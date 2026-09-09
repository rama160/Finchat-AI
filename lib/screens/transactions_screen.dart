import 'package:flutter/material.dart';
import '../models/transaction.dart';
import '../constants/categories.dart';
import '../services/storage_service.dart';

class TransactionsScreen extends StatefulWidget {
  const TransactionsScreen({super.key});

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> {
  final StorageService _storage = StorageService();
  String _selectedFilterType = 'all'; // 'all', 'expense', 'income'
  String _selectedCategory = 'all';
  final TextEditingController _quickInputController = TextEditingController();
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _storage.addListener(_onStorageUpdate);
  }

  @override
  void dispose() {
    _storage.removeListener(_onStorageUpdate);
    _quickInputController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onStorageUpdate() {
    if (mounted) setState(() {});
  }

  List<String> _getCategoryOptions() {
    List<CategoryItem> sourceList;
    if (_selectedFilterType == 'expense') {
      sourceList = expenseCategories;
    } else if (_selectedFilterType == 'income') {
      sourceList = incomeCategories;
    } else {
      sourceList = [...expenseCategories, ...incomeCategories];
    }
    // Deduplicate category names
    final names = sourceList.map((c) => c.name).toSet().toList();
    return names;
  }

  void _handleQuickAdd() {
    final text = _quickInputController.text.trim();
    if (text.isEmpty) return;

    // Simple quick text parse: e.g. "Kopi 25000" or "Beli makan 35rb"
    int amount = 0;
    String desc = text;

    final regex = RegExp(r'(\d+[\d\.]*)\s*(rb|k|ribu)?', caseSensitive: false);
    final match = regex.firstMatch(text);
    if (match != null) {
      final numPart = match.group(1)!.replaceAll('.', '');
      final multiplier = match.group(2)?.toLowerCase();
      int parsed = int.tryParse(numPart) ?? 0;
      if (multiplier == 'rb' || multiplier == 'k' || multiplier == 'ribu') {
        parsed *= 1000;
      }
      amount = parsed;
      desc = text.replaceAll(match.group(0)!, '').trim();
      if (desc.isEmpty) desc = 'Pengeluaran Cepat';
    }

    if (amount <= 0) amount = 20000; // default fallback

    final now = DateTime.now();
    final newTx = TransactionModel(
      id: now.millisecondsSinceEpoch.toString(),
      description: desc,
      amount: amount,
      type: TransactionType.expense,
      category: 'Makanan',
      transactionDate: now.toIso8601String().split('T')[0],
      transactionTime: '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:00',
      source: 'quick_chat',
    );

    _storage.addTransaction(newTx);
    _quickInputController.clear();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Berhasil mencatat: $desc (${StorageService.formatRupiah(amount)})'),
        backgroundColor: const Color(0xFF059669),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showAddTransactionDialog() {
    final descController = TextEditingController();
    final amountController = TextEditingController();
    TransactionType type = TransactionType.expense;
    String category = 'Makanan';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final catList = type == TransactionType.expense ? expenseCategories : incomeCategories;

            return Container(
              padding: EdgeInsets.only(
                top: 20,
                left: 20,
                right: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Tambah Transaksi Baru',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey[900],
                    ),
                  ),
                  const SizedBox(height: 14),
                  // Segmented control: Expense / Income
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: type == TransactionType.expense ? const Color(0xFFE11D48) : Colors.grey[100],
                            foregroundColor: type == TransactionType.expense ? Colors.white : Colors.grey[700],
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          onPressed: () {
                            setModalState(() {
                              type = TransactionType.expense;
                              category = 'Makanan';
                            });
                          },
                          child: const Text('Pengeluaran', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: type == TransactionType.income ? const Color(0xFF059669) : Colors.grey[100],
                            foregroundColor: type == TransactionType.income ? Colors.white : Colors.grey[700],
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          onPressed: () {
                            setModalState(() {
                              type = TransactionType.income;
                              category = 'Gaji';
                            });
                          },
                          child: const Text('Pemasukan', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: descController,
                    decoration: InputDecoration(
                      labelText: 'Deskripsi',
                      hintText: 'Misal: Beli Kopi, Makan Siang',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: amountController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Nominal (Rp)',
                      hintText: '50000',
                      prefixText: 'Rp ',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: category,
                    decoration: InputDecoration(
                      labelText: 'Kategori',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                    items: catList.map((c) {
                      return DropdownMenuItem(
                        value: c.name,
                        child: Row(
                          children: [
                            Icon(c.icon, size: 18, color: c.color),
                            const SizedBox(width: 8),
                            Text(c.name),
                          ],
                        ),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setModalState(() => category = val);
                    },
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF059669),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    onPressed: () {
                      final desc = descController.text.trim();
                      final amount = int.tryParse(amountController.text.replaceAll(RegExp(r'\D'), '')) ?? 0;
                      if (desc.isEmpty || amount <= 0) return;

                      final now = DateTime.now();
                      _storage.addTransaction(
                        TransactionModel(
                          id: now.millisecondsSinceEpoch.toString(),
                          description: desc,
                          amount: amount,
                          type: type,
                          category: category,
                          transactionDate: now.toIso8601String().split('T')[0],
                          transactionTime: '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:00',
                        ),
                      );
                      Navigator.pop(ctx);
                    },
                    child: const Text('Simpan Transaksi', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _storage.transactions.where((t) {
      if (_selectedFilterType == 'expense' && t.type != TransactionType.expense) return false;
      if (_selectedFilterType == 'income' && t.type != TransactionType.income) return false;
      if (_selectedCategory != 'all' && t.category != _selectedCategory) return false;
      final search = _searchController.text.trim().toLowerCase();
      if (search.isNotEmpty) {
        final matches = t.description.toLowerCase().contains(search) ||
            t.category.toLowerCase().contains(search) ||
            t.merchant.toLowerCase().contains(search);
        if (!matches) return false;
      }
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Finchat AI', style: TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle, color: Color(0xFF059669), size: 28),
            onPressed: _showAddTransactionDialog,
          ),
        ],
      ),
      body: Column(
        children: [
          // Balance Summary Card
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF065F46), Color(0xFF059669)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF059669).withOpacity(0.25),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Total Saldo Kas', style: TextStyle(color: Color(0xFFD1FAE5), fontSize: 13, fontWeight: FontWeight.w500)),
                const SizedBox(height: 6),
                Text(
                  StorageService.formatRupiah(_storage.balance),
                  style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(10)),
                            child: const Icon(Icons.arrow_downward, color: Color(0xFF6EE7B7), size: 16),
                          ),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Pemasukan', style: TextStyle(color: Color(0xFFD1FAE5), fontSize: 10)),
                              Text(StorageService.formatRupiah(_storage.totalIncome), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(10)),
                            child: const Icon(Icons.arrow_upward, color: Color(0xFFFCA5A5), size: 16),
                          ),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Pengeluaran', style: TextStyle(color: Color(0xFFFEE2E2), fontSize: 10)),
                              Text(StorageService.formatRupiah(_storage.totalExpense), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Filters & Search
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        ChoiceChip(
                          label: const Text('Semua'),
                          selected: _selectedFilterType == 'all',
                          onSelected: (val) => setState(() => _selectedFilterType = 'all'),
                        ),
                        const SizedBox(width: 6),
                        ChoiceChip(
                          label: const Text('Pengeluaran'),
                          selected: _selectedFilterType == 'expense',
                          onSelected: (val) => setState(() => _selectedFilterType = 'expense'),
                        ),
                        const SizedBox(width: 6),
                        ChoiceChip(
                          label: const Text('Pemasukan'),
                          selected: _selectedFilterType == 'income',
                          onSelected: (val) => setState(() => _selectedFilterType = 'income'),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                DropdownButton<String>(
                  value: _selectedCategory,
                  underline: const SizedBox(),
                  style: const TextStyle(fontSize: 12, color: Color(0xFF0F172A)),
                  items: [
                    const DropdownMenuItem(value: 'all', child: Text('Semua Kategori')),
                    ..._getCategoryOptions().map((name) => DropdownMenuItem(value: name, child: Text(name))),
                  ],
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedCategory = val);
                  },
                ),
              ],
            ),
          ),

          // Transactions List
          Expanded(
            child: filtered.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.receipt_long, size: 56, color: Colors.grey[300]),
                        const SizedBox(height: 8),
                        Text('Belum ada transaksi', style: TextStyle(color: Colors.grey[600], fontWeight: FontWeight.w600)),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (ctx, idx) {
                      final tx = filtered[idx];
                      final cat = getCategoryItem(tx.category, tx.type == TransactionType.income ? 'income' : 'expense');
                      final isIncome = tx.type == TransactionType.income;

                      return Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFF1F5F9)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 42,
                              height: 42,
                              decoration: BoxDecoration(
                                color: cat.bgLight,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(cat.icon, color: cat.color, size: 20),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(tx.description, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                  const SizedBox(height: 2),
                                  Text('${tx.category} • ${tx.transactionDate}', style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                                ],
                              ),
                            ),
                            Text(
                              '${isIncome ? '+' : '-'}${StorageService.formatRupiah(tx.amount)}',
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 14,
                                color: isIncome ? const Color(0xFF059669) : const Color(0xFFE11D48),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),

          // Quick Chat Input Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _quickInputController,
                      decoration: InputDecoration(
                        hintText: 'Ketik cepat: "Kopi 25rb" atau "Bensin 50rb"...',
                        hintStyle: TextStyle(fontSize: 12, color: Colors.grey[400]),
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(20),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      onSubmitted: (_) => _handleQuickAdd(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    backgroundColor: const Color(0xFF059669),
                    radius: 18,
                    child: IconButton(
                      icon: const Icon(Icons.send, size: 16, color: Colors.white),
                      onPressed: _handleQuickAdd,
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
