import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/chat_message_model.dart';
import '../models/transaction_model.dart';
import '../services/database_helper.dart';
import '../services/gemini_service.dart';
import '../services/prefs_service.dart';
import '../services/sheets_service.dart';
import '../services/transaction_parser.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<ChatMessageModel> _messages = [];
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadHistory() async {
    final history = await DatabaseHelper.instance.getChatMessages();

    if (!mounted) return;

    setState(() {
      _messages = history;

      if (_messages.isEmpty) {
        _messages = [
          ChatMessageModel(
            role: 'assistant',
            content:
                'Halo! Saya Finchat.',
            timestamp: DateTime.now().toIso8601String(),
          ),
        ];
      }
    });

    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  // ============================================================
  // CHAT SEND
  // ============================================================

  Future<void> _handleSend() async {
    final text = _inputController.text.trim();

    if (text.isEmpty || _sending) return;

    final userMessage = ChatMessageModel(
      role: 'user',
      content: text,
      timestamp: DateTime.now().toIso8601String(),
    );

    setState(() {
      _messages = [..._messages, userMessage];
      _sending = true;
      _inputController.clear();
    });

    await DatabaseHelper.instance.insertChatMessage(userMessage);
    _scrollToBottom();

    try {
      /*
       * ==========================================================
       * PENTING
       * ==========================================================
       *
       * Pertanyaan HARUS diperiksa sebelum TransactionParser.
       *
       * Contoh sebelumnya:
       *
       * "berapa pengeluaran tanggal 26 yang mengandung kata acara"
       *
       * Parser melihat angka "26" lalu menganggap:
       *
       *   amount = 26
       *
       * Akibatnya pertanyaan menjadi transaksi Rp26.
       *
       * Sekarang:
       *
       * Pertanyaan
       *     -> Chat AI
       *
       * Transaksi
       *     -> TransactionParser
       */

      final isQuestion = _isLikelyQuestion(text);

      // ==========================================================
      // 1. PERTANYAAN
      // ==========================================================

      if (isQuestion) {
        final yearMonth = DateFormat('yyyy-MM').format(DateTime.now());

        final transactions =
            await DatabaseHelper.instance.getTransactionsByMonth(yearMonth);

        /*
         * Untuk pertanyaan sederhana yang dapat dijawab langsung
         * dari database lokal, gunakan jawaban lokal terlebih dahulu.
         */
        final localReply = _tryAnswerLocalQuery(
          text,
          transactions,
        );

        if (localReply != null) {
          await _addAssistantMessage(localReply);
          return;
        }
      } else {
        // ========================================================
        // 2. TRANSAKSI NORMAL
        // ========================================================

        /*
         * Parser transaksi hanya dijalankan jika input BUKAN
         * pertanyaan.
         */
        final parsedTransactions =
            TransactionParser.parseMany(text);

        if (parsedTransactions.isNotEmpty) {
          final saved = await _saveTransactions(
            parsedTransactions,
            source: 'chat',
          );

          final currency = NumberFormat.currency(
            locale: 'id_ID',
            symbol: 'Rp',
            decimalDigits: 0,
          );

          final lines = saved.map(
            (tx) =>
                '• ${tx.description} — ${tx.category} — ${currency.format(tx.amount)}',
          );

          await _addAssistantMessage(
            '✅ ${saved.length} transaksi berhasil dicatat:\n'
            '${lines.join('\n')}',
          );

          return;
        }
      }

      // ==========================================================
      // 3. GEMINI AI
      // ==========================================================

      final apiKey = await PrefsService.getApiKey();
      final proxyUrl = await PrefsService.getAiProxyUrl();

      if (apiKey.isEmpty && proxyUrl.trim().isEmpty) {
        await _addAssistantMessage(
          isQuestion
              ? 'Untuk menjawab pertanyaan seperti ini, isi API Key Gemini atau AI Proxy di Pengaturan.'
              : 'Saya belum mengenali itu sebagai transaksi sederhana. Untuk pertanyaan AI atau kalimat yang lebih kompleks, isi API Key Gemini di Pengaturan.',
        );

        return;
      }

      final yearMonth = DateFormat('yyyy-MM').format(DateTime.now());

      final monthTransactions =
          await DatabaseHelper.instance.getTransactionsByMonth(
        yearMonth,
      );

      final summary =
          DatabaseHelper.instance.summarize(monthTransactions);

      summary['transactions'] = monthTransactions
          .map(
            (tx) => {
              'id': tx.id,
              'date': tx.transactionDate,
              'time': tx.transactionTime,
              'type': tx.type,
              'category': tx.category,
              'description': tx.description,
              'amount': tx.amount,
              'merchant': tx.merchant,
            },
          )
          .toList();

      final result = await GeminiService.processChatMessage(
        apiKey: apiKey,
        userText: text,
        financeContext: summary,
        proxyUrl: proxyUrl,
      );

      var replyText = (result['reply'] ?? '').toString();

      // ==========================================================
      // 4. PENGAMAN CHAT AI
      // ==========================================================

      /*
       * Kalau input adalah pertanyaan:
       *
       *   JANGAN PERNAH menyimpan hasil Gemini sebagai transaksi.
       *
       * Ini penting sebagai pengaman kedua apabila Gemini salah
       * mengembalikan:
       *
       *   intent = transaction
       *
       * untuk sebuah pertanyaan.
       */
      if (!isQuestion &&
          result['intent'] == 'transaction' &&
          result['transaction'] != null) {
        final map = Map<String, dynamic>.from(
          result['transaction'],
        );

        final saved = await _saveTransactions(
          [map],
          source: 'chat',
        );

        if (saved.isNotEmpty) {
          final currency = NumberFormat.currency(
            locale: 'id_ID',
            symbol: 'Rp',
            decimalDigits: 0,
          );

          final tx = saved.first;

          replyText +=
              '\n\n✅ Transaksi tersimpan: '
              '${tx.description} '
              '(${currency.format(tx.amount)})';
        }
      }

      await _addAssistantMessage(
        replyText.isNotEmpty
            ? replyText
            : 'Baik, sudah saya proses.',
      );
    } catch (e) {
      await _addAssistantMessage(
        'Maaf, terjadi kesalahan: ${_friendlyError(e)}',
      );
    } finally {
      if (mounted) {
        setState(() {
          _sending = false;
        });
      }

      _scrollToBottom();
    }
  }

  // ============================================================
  // DETEKSI PERTANYAAN
  // ============================================================

  bool _isLikelyQuestion(String text) {
    final lower = text.toLowerCase().trim();

    if (lower.isEmpty) return false;

    // Tanda tanya selalu dianggap pertanyaan.
    if (lower.contains('?')) return true;

    const starts = [
      'berapa ',
      'berapa?',
      'apa ',
      'apa?',
      'apakah ',
      'apakah?',
      'mana ',
      'mana?',
      'kapan ',
      'kapan?',
      'kenapa ',
      'mengapa ',
      'bagaimana ',
      'bagaimana?',
      'bisakah ',
      'tolong tampilkan',
      'tampilkan ',
      'tunjukkan ',
      'lihat ',
      'daftar ',
      'buatkan ',
      'cek ',
      'cekkan ',
      'coba cek ',
      'cari ',
      'carikan ',
      'riwayat ',
      'hitung ',
    ];

    if (starts.any(lower.startsWith)) {
      return true;
    }

    const patterns = [
      'berapa total',
      'berapa jumlah',
      'berapa pengeluaran',
      'berapa pemasukan',
      'total pengeluaran',
      'total pemasukan',
      'pengeluaran terbesar',
      'pemasukan terbesar',
      'transaksi apa',
      'transaksi mana',
      'transaksi tanggal',
      'pengeluaran tanggal',
      'pemasukan tanggal',
      'pengeluaran pada tanggal',
      'pemasukan pada tanggal',
      'yang mengandung kata',
      'buat dalam bentuk nota',
      'buatkan nota',
      'buat nota',
      'ringkasan pengeluaran',
      'ringkasan pemasukan',
      'insight pengeluaran',
      'insight pemasukan',
      'cek pengeluaran',
      'cek pemasukan',
      'cek transaksi',
      'cari transaksi',
      'carikan transaksi',
      'riwayat transaksi',
      'riwayat pengeluaran',
      'riwayat pemasukan',
      'berapa transaksi',
      'transaksi saya',
    ];

    return patterns.any(lower.contains);
  }

  // ============================================================
  // JAWABAN QUERY LOKAL
  // ============================================================

  String? _tryAnswerLocalQuery(
    String text,
    List<TransactionModel> transactions,
  ) {
    final lower = text.toLowerCase().trim();

    final asksTotal =
        lower.contains('total') ||
        lower.contains('jumlah') ||
        lower.contains('berapa');

    if (!asksTotal) return null;

    final asksExpense =
        lower.contains('pengeluaran') ||
        lower.contains('belanja');

    final asksIncome =
        lower.contains('pemasukan') ||
        lower.contains('pendapatan');

    final requestedDate = _extractRequestedDate(lower);

    final filtered = transactions.where((tx) {
      if (asksExpense && tx.type != 'expense') {
        return false;
      }

      if (asksIncome && tx.type != 'income') {
        return false;
      }

      if (requestedDate != null &&
          tx.transactionDate != requestedDate) {
        return false;
      }

      return true;
    }).toList();

    /*
     * Kata-kata umum yang tidak perlu dipakai sebagai pencarian
     * transaksi.
     */
    const ignoredWords = {
      'berapa',
      'total',
      'jumlah',
      'pengeluaran',
      'pemasukan',
      'pendapatan',
      'belanja',
      'tanggal',
      'hari',
      'pada',
      'yang',
      'mengandung',
      'kata',
      'dalam',
      'bentuk',
      'buat',
      'buatkan',
      'nota',
      'untuk',
      'dari',
      'di',
      'bulan',
      'ini',
      'januari',
      'februari',
      'maret',
      'april',
      'mei',
      'juni',
      'juli',
      'agustus',
      'september',
      'oktober',
      'november',
      'desember',
    };

    final searchTerms = lower
        .replaceAll(RegExp(r'[^a-z0-9\s]'), ' ')
        .split(RegExp(r'\s+'))
        .where(
          (word) =>
              word.length >= 3 &&
              !ignoredWords.contains(word) &&
              !RegExp(r'^\d+$').hasMatch(word),
        )
        .toSet();

    final matching = filtered.where((tx) {
      if (searchTerms.isEmpty) {
        return true;
      }

      final haystack =
          '${tx.description} ${tx.merchant} ${tx.category}'
              .toLowerCase();

      return searchTerms.any(haystack.contains);
    }).toList();

    /*
     * Kalau tidak ditemukan secara lokal, biarkan Gemini yang
     * menjawab berdasarkan context transaksi.
     */
    if (matching.isEmpty) {
      return null;
    }

    final total = matching.fold<double>(
      0,
      (sum, tx) => sum + tx.amount,
    );

    final currency = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp',
      decimalDigits: 0,
    );

    final detail = matching.length == 1
        ? matching.first.description
        : '${matching.length} transaksi';

    return 'Total yang cocok dengan pertanyaan tersebut adalah '
        '${currency.format(total)} ($detail).';
  }

  // ============================================================
  // EXTRACT TANGGAL
  // ============================================================

  String? _extractRequestedDate(String lower) {
    final match = RegExp(
      r'tanggal\s+(\d{1,2})\s+'
      r'(januari|februari|maret|april|mei|juni|juli|agustus|'
      r'september|oktober|november|desember)\s+'
      r'(\d{4})',
      caseSensitive: false,
    ).firstMatch(lower);

    if (match == null) {
      return null;
    }

    const months = {
      'januari': '01',
      'februari': '02',
      'maret': '03',
      'april': '04',
      'mei': '05',
      'juni': '06',
      'juli': '07',
      'agustus': '08',
      'september': '09',
      'oktober': '10',
      'november': '11',
      'desember': '12',
    };

    final day = match.group(1)!.padLeft(2, '0');

    final month =
        months[match.group(2)!.toLowerCase()];

    final year = match.group(3)!;

    if (month == null) {
      return null;
    }

    return '$year-$month-$day';
  }

  // ============================================================
  // SAVE TRANSACTIONS
  // ============================================================

  Future<List<TransactionModel>> _saveTransactions(
    List<Map<String, dynamic>> items, {
    required String source,
  }) async {
    final now = DateTime.now();

    final saved = <TransactionModel>[];

    for (final map in items) {
      final amount =
          double.tryParse(map['amount'].toString()) ?? 0;

      if (amount <= 0) {
        continue;
      }

      final tx = TransactionModel(
        transactionDate:
            DateFormat('yyyy-MM-dd').format(now),
        transactionTime:
            DateFormat('HH:mm:ss').format(now),
        type: map['type'] == 'income'
            ? 'income'
            : 'expense',
        category:
            (map['category'] ?? 'Lainnya').toString(),
        description:
            (map['description'] ?? 'Transaksi').toString(),
        amount: amount,
        merchant:
            (map['merchant'] ?? '').toString(),
        source: source,
      );

      await DatabaseHelper.instance.insertTransaction(tx);

      saved.add(tx);
    }

    if (saved.isNotEmpty) {
      unawaited(_syncInBackground());
    }

    return saved;
  }

  // ============================================================
  // BACKGROUND SYNC
  // ============================================================

  Future<void> _syncInBackground() async {
    try {
      await SheetsService.syncUnsyncedTransactions();
    } catch (_) {
      /*
       * Sinkronisasi tidak boleh membuat pencatatan lokal gagal.
       */
    }
  }

  // ============================================================
  // ASSISTANT MESSAGE
  // ============================================================

  Future<void> _addAssistantMessage(String text) async {
    final message = ChatMessageModel(
      role: 'assistant',
      content: text,
      timestamp: DateTime.now().toIso8601String(),
    );

    if (mounted) {
      setState(() {
        _messages = [..._messages, message];
      });
    }

    await DatabaseHelper.instance.insertChatMessage(message);

    _scrollToBottom();
  }

  // ============================================================
  // ERROR
  // ============================================================

  String _friendlyError(Object error) {
    final message = error
        .toString()
        .replaceFirst('Exception: ', '')
        .trim();

    if (message.contains('Failed host lookup') ||
        message.contains('SocketException')) {
      return 'Koneksi internet ke Gemini gagal. '
          'Periksa koneksi internet dan coba lagi.';
    }

    if (message.length > 280) {
      return '${message.substring(0, 280)}…';
    }

    return message;
  }

  // ============================================================
  // UI
  // ============================================================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chat AI Keuangan'),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(12),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];

                final isUser = message.role == 'user';

                return Align(
                  alignment: isUser
                      ? Alignment.centerRight
                      : Alignment.centerLeft,
                  child: Container(
                    margin:
                        const EdgeInsets.symmetric(vertical: 4),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    constraints: BoxConstraints(
                      maxWidth:
                          MediaQuery.of(context).size.width * 0.75,
                    ),
                    decoration: BoxDecoration(
                      color: isUser
                          ? Colors.teal
                          : Colors.grey.shade200,
                      borderRadius:
                          BorderRadius.circular(16),
                    ),
                    child: Text(
                      message.content,
                      style: TextStyle(
                        color: isUser
                            ? Colors.white
                            : Colors.black87,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          if (_sending)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: SizedBox(
                height: 16,
                width: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                ),
              ),
            ),

          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(8),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _inputController,
                      minLines: 1,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        hintText:
                            'Contoh: nasi 25rb, rokok 30rb, es 10rb',
                        border: OutlineInputBorder(
                          borderRadius:
                              BorderRadius.all(
                            Radius.circular(24),
                          ),
                        ),
                        contentPadding:
                            EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 10,
                        ),
                      ),
                      onSubmitted: (_) => _handleSend(),
                    ),
                  ),

                  const SizedBox(width: 8),

                  CircleAvatar(
                    backgroundColor: Colors.teal,
                    child: IconButton(
                      icon: const Icon(
                        Icons.send,
                        color: Colors.white,
                        size: 18,
                      ),
                      onPressed:
                          _sending ? null : _handleSend,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
