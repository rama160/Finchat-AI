import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/transaction.dart';

class StorageService extends ChangeNotifier {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();

  List<TransactionModel> _transactions = [];
  bool _isLoaded = false;

  List<TransactionModel> get transactions => List.unmodifiable(_transactions);
  bool get isLoaded => _isLoaded;

  int get totalIncome => _transactions
      .where((t) => t.type == TransactionType.income)
      .fold(0, (sum, t) => sum + t.amount);

  int get totalExpense => _transactions
      .where((t) => t.type == TransactionType.expense)
      .fold(0, (sum, t) => sum + t.amount);

  int get balance => totalIncome - totalExpense;

  static String formatRupiah(num number) {
    final formatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );
    return formatter.format(number);
  }

  Future<void> init() async {
    if (_isLoaded) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final data = prefs.getString('finchat_transactions');
      if (data != null && data.isNotEmpty) {
        final List decoded = jsonDecode(data);
        _transactions = decoded.map((e) => TransactionModel.fromJson(e)).toList();
      } else {
        _transactions = _getInitialSampleData();
        await _saveToDisk();
      }
    } catch (e) {
      debugPrint('StorageService load error: $e');
      _transactions = _getInitialSampleData();
    }
    _isLoaded = true;
    notifyListeners();
  }

  Future<void> addTransaction(TransactionModel tx) async {
    _transactions.insert(0, tx);
    await _saveToDisk();
    notifyListeners();
  }

  Future<void> addMultipleTransactions(List<TransactionModel> txs) async {
    _transactions.insertAll(0, txs);
    await _saveToDisk();
    notifyListeners();
  }

  Future<void> updateTransaction(TransactionModel tx) async {
    final index = _transactions.indexWhere((t) => t.id == tx.id);
    if (index != -1) {
      _transactions[index] = tx;
      await _saveToDisk();
      notifyListeners();
    }
  }

  Future<void> deleteTransaction(String id) async {
    _transactions.removeWhere((t) => t.id == id);
    await _saveToDisk();
    notifyListeners();
  }

  Future<void> clearAllTransactions() async {
    _transactions.clear();
    await _saveToDisk();
    notifyListeners();
  }

  Future<void> _saveToDisk() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final data = jsonEncode(_transactions.map((t) => t.toJson()).toList());
      await prefs.setString('finchat_transactions', data);
    } catch (e) {
      debugPrint('StorageService save error: $e');
    }
  }

  List<TransactionModel> _getInitialSampleData() {
    final now = DateTime.now();
    final todayStr = DateFormat('yyyy-MM-dd').format(now);
    final yesterdayStr = DateFormat('yyyy-MM-dd').format(now.subtract(const Duration(days: 1)));

    return [
      TransactionModel(
        id: '1',
        description: 'Gaji Bulanan',
        amount: 8500000,
        type: TransactionType.income,
        category: 'Gaji',
        transactionDate: todayStr,
        transactionTime: '09:00:00',
        paymentMethod: 'Transfer Bank',
      ),
      TransactionModel(
        id: '2',
        description: 'Makan Siang Nasi Padang',
        amount: 35000,
        type: TransactionType.expense,
        category: 'Makanan',
        transactionDate: todayStr,
        transactionTime: '12:30:00',
        paymentMethod: 'QRIS',
        merchant: 'RM Sederhana',
      ),
      TransactionModel(
        id: '3',
        description: 'Bensin Motor',
        amount: 50000,
        type: TransactionType.expense,
        category: 'Transportasi',
        transactionDate: yesterdayStr,
        transactionTime: '08:15:00',
        paymentMethod: 'Tunai',
        merchant: 'SPBU Pertamina',
      ),
    ];
  }
}
