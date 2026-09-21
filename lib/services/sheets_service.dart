import 'dart:convert';

import 'package:http/http.dart' as http;
import '../models/transaction_model.dart';
import 'database_helper.dart';
import 'prefs_service.dart';

/// Sinkronisasi offline-first dengan Google Sheets melalui Apps Script.
///
/// Versi ini menggunakan GET untuk operasi sinkronisasi. Google Apps Script
/// Web App sering mengembalikan redirect 302 setelah POST; beberapa client
/// kemudian mengubah POST menjadi GET dan berakhir pada HTTP 405. Payload
/// sinkronisasi dikirim sebagai base64url melalui GET agar redirect tetap aman.
class SheetsService {
  static bool _syncInProgress = false;

  static String _compactResponse(String body) {
    final trimmed = body.trim();
    if (trimmed.isEmpty) return 'Respons server kosong.';
    if (trimmed.startsWith('<') ||
        trimmed.contains('<!DOCTYPE') ||
        trimmed.contains('<html')) {
      return 'Google Sheets mengembalikan halaman web, bukan respons API JSON. Pastikan URL yang dipakai adalah Web App /exec.';
    }
    if (trimmed.length > 500) return '${trimmed.substring(0, 500)}…';
    return trimmed;
  }

  static Uri _webAppUri(String rawUrl) {
    final trimmed = rawUrl.trim();
    if (trimmed.isEmpty) {
      throw Exception('URL Google Sheets belum diatur di halaman Pengaturan.');
    }
    final uri = Uri.parse(trimmed);
    if (uri.scheme != 'https' || !uri.host.contains('script.google.com')) {
      throw Exception('URL Google Sheets harus berupa Web App Google Apps Script HTTPS.');
    }
    if (!uri.path.endsWith('/exec')) {
      throw Exception('URL Google Sheets harus menggunakan endpoint Web App /exec, bukan /dev atau halaman editor.');
    }
    return uri;
  }

  static String _encodePayload(Map<String, dynamic> payload) {
    return base64UrlEncode(utf8.encode(jsonEncode(payload))).replaceAll('=', '');
  }

  static Future<http.Response> _get(Uri uri) async {
    var current = uri;
    for (var attempt = 0; attempt < 5; attempt++) {
      try {
        final response = await http.get(
          current,
          headers: const {'Accept': 'application/json'},
        ).timeout(const Duration(seconds: 20));

        if (response.statusCode >= 200 && response.statusCode < 300) {
          return response;
        }

        final location = response.headers['location'];
        if ((response.statusCode == 301 ||
                response.statusCode == 302 ||
                response.statusCode == 303 ||
                response.statusCode == 307 ||
                response.statusCode == 308) &&
            location != null &&
            location.isNotEmpty) {
          current = current.resolve(location);
          continue;
        }

        throw Exception(
          'Google Sheets HTTP ${response.statusCode}: ${_compactResponse(response.body)}',
        );
      } on FormatException {
        rethrow;
      }
    }

    throw Exception('Google Sheets terlalu banyak redirect. Gunakan URL Web App /exec.');
  }

  static Future<http.Response> _getAction(
    Uri base,
    Map<String, dynamic> payload,
  ) {
    final query = <String, String>{
      ...base.queryParameters,
      'action': payload['action']?.toString() ?? 'health',
      'payload': _encodePayload(payload),
    };
    return _get(base.replace(queryParameters: query));
  }

  static Map<String, dynamic> _decodeBody(http.Response response) {
    if (response.body.trim().isEmpty) return <String, dynamic>{};
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map) return Map<String, dynamic>.from(decoded);
    } catch (_) {
      throw Exception(_compactResponse(response.body));
    }
    throw Exception('Respons Google Sheets bukan JSON yang valid.');
  }

  static Future<String> checkConnection() async {
    final url = await PrefsService.getSheetsUrl();
    final base = _webAppUri(url);
    final response = await _get(
      base.replace(queryParameters: {
        ...base.queryParameters,
        'action': 'health',
      }),
    );
    final decoded = _decodeBody(response);
    if (decoded['status'] == 'ok' || decoded['result'] == 'success') {
      return decoded['message']?.toString() ?? 'Google Sheets aktif.';
    }
    throw Exception('Respons Apps Script tidak valid: ${_compactResponse(response.body)}');
  }

  static Future<int> syncUnsyncedTransactions() async {
    if (_syncInProgress) return 0;
    _syncInProgress = true;
    try {
      return await _syncUnsyncedTransactionsInternal();
    } finally {
      _syncInProgress = false;
    }
  }

  static Future<int> _syncUnsyncedTransactionsInternal() async {
    final base = _webAppUri(await PrefsService.getSheetsUrl());
    final unsynced = await DatabaseHelper.instance.getUnsyncedTransactions();
    var successCount = 0;

    final deletedIds = await DatabaseHelper.instance.getDeletedTransactionIds();
    if (deletedIds.isNotEmpty) {
      final response = await _getAction(base, {
        'action': 'delete',
        'ids': deletedIds,
      });
      final body = _decodeBody(response);
      if (body['status'] != 'ok' && body['result'] != 'success') {
        throw Exception('Apps Script gagal menghapus transaksi di Sheets.');
      }
      final rawRemoved = body['ids'] is List
          ? body['ids'] as List
          : (body['deleted_ids'] is List ? body['deleted_ids'] as List : const []);
      final removed = rawRemoved
          .map((e) => int.tryParse(e.toString()))
          .whereType<int>()
          .toList();
      await DatabaseHelper.instance.clearDeletedTransactionIds(removed);
      successCount += removed.length;
    }

    if (unsynced.isEmpty) {
      await PrefsService.setLastSync(DateTime.now().toIso8601String());
      return successCount;
    }

    // Dua transaksi per request menjaga URL tetap pendek pada Web App Google.
    const batchSize = 2;
    for (var start = 0; start < unsynced.length; start += batchSize) {
      final end = (start + batchSize > unsynced.length)
          ? unsynced.length
          : start + batchSize;
      final batch = unsynced.sublist(start, end);
      final response = await _getAction(base, {
        'action': 'sync',
        'transactions': batch.map((tx) => tx.toMap()).toList(),
      });
      final body = _decodeBody(response);

      if (body['status'] != 'ok' && body['result'] != 'success') {
        throw Exception(
          'Apps Script tidak mengonfirmasi sinkronisasi: ${_compactResponse(response.body)}',
        );
      }

      final rawSyncedIds = body['ids'] is List
          ? body['ids'] as List
          : (body['confirmed_ids'] is List ? body['confirmed_ids'] as List : const []);
      final syncedIds = rawSyncedIds
          .map((e) => int.tryParse(e.toString()))
          .whereType<int>()
          .toSet();
      if (syncedIds.isEmpty) {
        throw Exception(
          'Apps Script mengembalikan 0 transaksi tersinkron. Respons: ${_compactResponse(response.body)}',
        );
      }

      for (final id in syncedIds) {
        await DatabaseHelper.instance.markAsSynced(id);
        successCount++;
      }
    }

    await PrefsService.setLastSync(DateTime.now().toIso8601String());
    return successCount;
  }

  static Future<int> syncAllTransactions() async {
    final base = _webAppUri(await PrefsService.getSheetsUrl());
    final all = await DatabaseHelper.instance.getAllTransactions();
    if (all.isEmpty) return 0;

    var successCount = 0;
    const batchSize = 2;
    for (var start = 0; start < all.length; start += batchSize) {
      final end = (start + batchSize > all.length) ? all.length : start + batchSize;
      final batch = all.sublist(start, end);
      final response = await _getAction(base, {
        'action': 'sync',
        'transactions': batch.map((tx) => tx.toMap()).toList(),
      });
      final body = _decodeBody(response);
      if (body['status'] != 'ok' && body['result'] != 'success') {
        throw Exception('Apps Script gagal sinkronisasi: ${_compactResponse(response.body)}');
      }
      final rawIds = body['ids'] is List
          ? body['ids'] as List
          : (body['confirmed_ids'] is List ? body['confirmed_ids'] as List : const []);
      final syncedIds = rawIds
          .map((e) => int.tryParse(e.toString()))
          .whereType<int>()
          .toSet();
      if (syncedIds.isEmpty) {
        throw Exception('Apps Script mengembalikan 0 transaksi. Respons: ${_compactResponse(response.body)}');
      }
      for (final id in syncedIds) {
        await DatabaseHelper.instance.markAsSynced(id);
        successCount++;
      }
    }

    await PrefsService.setLastSync(DateTime.now().toIso8601String());
    return successCount;
  }

  static Future<int> restoreIfLocalEmpty() async {
    final local = await DatabaseHelper.instance.getAllTransactions();
    if (local.isNotEmpty) return 0;

    final rawUrl = await PrefsService.getSheetsUrl();
    if (rawUrl.trim().isEmpty) return 0;
    final base = _webAppUri(rawUrl);
    final response = await _get(
      base.replace(queryParameters: {
        ...base.queryParameters,
        'action': 'list',
      }),
    );
    final decoded = _decodeBody(response);
    if (decoded['status'] != 'ok' && decoded['result'] != 'success') {
      throw Exception('Format data pemulihan Google Sheets tidak valid.');
    }

    final rows = decoded['transactions'];
    if (rows is! List) return 0;

    final transactions = <TransactionModel>[];
    for (final raw in rows) {
      if (raw is! Map) continue;
      final map = Map<String, dynamic>.from(raw);
      final amount = double.tryParse(map['amount']?.toString() ?? '') ?? 0;
      final id = int.tryParse(map['id']?.toString() ?? '');
      if (amount <= 0 || id == null) continue;
      map['id'] = id;
      map['is_synced'] = 1;
      transactions.add(TransactionModel.fromMap(map));
    }

    await DatabaseHelper.instance.restoreTransactions(transactions);
    return transactions.length;
  }
}
