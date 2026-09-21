import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:fl_chart/fl_chart.dart';
import '../models/transaction_model.dart';
import '../services/database_helper.dart';
import '../services/pdf_service.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  bool _isRangeMode = false;
  DateTime _singleDate = DateTime.now();
  DateTimeRange _range = DateTimeRange(
    start: DateTime.now(),
    end: DateTime.now(),
  );

  bool _loading = true;
  List<TransactionModel> _transactions = [];
  String _periodLabel = '';
  String _reportTitle = 'Laporan Harian';

  @override
  void initState() {
    super.initState();
    DatabaseHelper.transactionChanges.addListener(_onTransactionsChanged);
    _load();
  }

  @override
  void dispose() {
    DatabaseHelper.transactionChanges.removeListener(_onTransactionsChanged);
    super.dispose();
  }

  void _onTransactionsChanged() {
    if (mounted) _load();
  }

  DateTime _lastDayOfMonth(DateTime d) => DateTime(d.year, d.month + 1, 0);

  Future<void> _load() async {
    if (mounted) setState(() => _loading = true);

    List<TransactionModel> data;
    String label;
    String title;

    if (_isRangeMode) {
      final start = DateTime(
        _range.start.year,
        _range.start.month,
        _range.start.day,
      );
      final end = DateTime(
        _range.end.year,
        _range.end.month,
        _range.end.day,
      );

      final lastDay = _lastDayOfMonth(start);
      final isFullMonth = start.day == 1 &&
          start.year == end.year &&
          start.month == end.month &&
          end.day == lastDay.day;

      if (isFullMonth) {
        data = await DatabaseHelper.instance.getTransactionsByMonth(
          DateFormat('yyyy-MM').format(start),
        );
        label = _capitalize(DateFormat('MMMM yyyy', 'id_ID').format(start));
        title = 'Laporan Bulanan';
      } else {
        data = await DatabaseHelper.instance.getTransactionsByDateRange(
          DateFormat('yyyy-MM-dd').format(start),
          DateFormat('yyyy-MM-dd').format(end),
        );
        label =
            '${DateFormat('dd MMM yyyy', 'id_ID').format(start)} - ${DateFormat('dd MMM yyyy', 'id_ID').format(end)}';
        title = 'Laporan Rentang Tanggal';
      }
    } else {
      final dateStr = DateFormat('yyyy-MM-dd').format(_singleDate);
      data = await DatabaseHelper.instance.getTransactionsByDate(dateStr);
      label = _capitalize(
        DateFormat('EEEE, dd MMMM yyyy', 'id_ID').format(_singleDate),
      );
      title = 'Laporan Harian';
    }

    if (!mounted) return;
    setState(() {
      _transactions = data;
      _periodLabel = label;
      _reportTitle = title;
      _loading = false;
    });
  }

  String _capitalize(String s) =>
      s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);

  void _shiftDay(int delta) {
    setState(() {
      _isRangeMode = false;
      _singleDate = _singleDate.add(Duration(days: delta));
    });
    _load();
  }

  Future<void> _showPeriodPicker() async {
    final choice = await showModalBottomSheet<String>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 16, 20, 4),
              child: Text(
                'Pilih Periode Laporan',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.today, color: Colors.teal),
              title: const Text('Pilih Tanggal'),
              subtitle: const Text('Lihat laporan untuk satu hari tertentu'),
              onTap: () => Navigator.pop(context, 'date'),
            ),
            ListTile(
              leading: const Icon(Icons.date_range, color: Colors.teal),
              title: const Text('Pilih Rentang Waktu'),
              subtitle: const Text(
                'Rentang satu bulan penuh otomatis menjadi laporan bulanan',
              ),
              onTap: () => Navigator.pop(context, 'range'),
            ),
          ],
        ),
      ),
    );

    if (!mounted || choice == null) return;

    if (choice == 'date') {
      final picked = await showDatePicker(
        context: context,
        initialDate: _isRangeMode ? _range.start : _singleDate,
        firstDate: DateTime(2020),
        lastDate: DateTime(2100),
      );
      if (picked != null) {
        setState(() {
          _isRangeMode = false;
          _singleDate = picked;
        });
        _load();
      }
      return;
    }

    final picked = await showDateRangePicker(
      context: context,
      initialDateRange: _isRangeMode
          ? _range
          : DateTimeRange(start: _singleDate, end: _singleDate),
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      setState(() {
        _isRangeMode = true;
        _range = picked;
      });
      _load();
    }
  }

  List<TransactionModel> _incomeTransactions() =>
      _transactions.where((tx) => tx.type == 'income').toList();

  List<TransactionModel> _expenseTransactions() =>
      _transactions.where((tx) => tx.type == 'expense').toList();

  Map<String, int> _categoryCounts() {
    final result = <String, int>{};
    for (final tx in _transactions) {
      result[tx.category] = (result[tx.category] ?? 0) + 1;
    }
    return result;
  }

  TransactionModel? _largestExpense() {
    final expenses = _expenseTransactions();
    if (expenses.isEmpty) return null;
    return expenses.reduce((a, b) => a.amount >= b.amount ? a : b);
  }

  Map<String, double> _expenseByCategory() {
    final result = <String, double>{};
    for (final tx in _expenseTransactions()) {
      result[tx.category] = (result[tx.category] ?? 0) + tx.amount;
    }
    return result;
  }

  Widget _buildSummary(
    NumberFormat currency,
    Map<String, dynamic> summary,
  ) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 12, 12, 4),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.teal.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.teal.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _isRangeMode ? 'Ringkasan periode terpilih' : 'Ringkasan hari',
            style: const TextStyle(fontSize: 12, color: Colors.grey),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _Metric(
                  label: 'Pemasukan',
                  value: currency.format(summary['income']),
                  icon: Icons.arrow_downward,
                  color: Colors.green,
                  onTap: () => _showTransactionDetails(
                    'Detail Pemasukan',
                    _incomeTransactions(),
                    currency,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _Metric(
                  label: 'Pengeluaran',
                  value: currency.format(summary['expense']),
                  icon: Icons.arrow_upward,
                  color: Colors.redAccent,
                  onTap: () => _showTransactionDetails(
                    'Detail Pengeluaran',
                    _expenseTransactions(),
                    currency,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            'Saldo: ${currency.format(summary['balance'])}',
            style: const TextStyle(
              color: Colors.teal,
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Ketuk kartu pemasukan atau pengeluaran untuk melihat detail transaksi periode ini.',
            style: TextStyle(fontSize: 11, color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildComparisonChart(NumberFormat currency, Map<String, dynamic> summary) {
    final income = (summary['income'] as num?)?.toDouble() ?? 0;
    final expense = (summary['expense'] as num?)?.toDouble() ?? 0;
    final maxValue = income > expense ? income : expense;

    return Card(
      margin: const EdgeInsets.fromLTRB(12, 8, 12, 4),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 14, 16, 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Perbandingan Pemasukan & Pengeluaran',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 4),
            Text(
              _periodLabel,
              style: const TextStyle(fontSize: 11, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 230,
              child: BarChart(
                BarChartData(
                  maxY: maxValue == 0 ? 1 : maxValue * 1.25,
                  minY: 0,
                  gridData: const FlGridData(show: true),
                  borderData: FlBorderData(show: false),
                  alignment: BarChartAlignment.spaceAround,
                  titlesData: FlTitlesData(
                    topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 55,
                        getTitlesWidget: (value, meta) => Text(
                          _shortCurrency(value, currency),
                          style: const TextStyle(fontSize: 9),
                        ),
                      ),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          switch (value.toInt()) {
                            case 0:
                              return const Padding(
                                padding: EdgeInsets.only(top: 6),
                                child: Text('Pemasukan', style: TextStyle(fontSize: 10)),
                              );
                            case 1:
                              return const Padding(
                                padding: EdgeInsets.only(top: 6),
                                child: Text('Pengeluaran', style: TextStyle(fontSize: 10)),
                              );
                            default:
                              return const SizedBox.shrink();
                          }
                        },
                      ),
                    ),
                  ),
                  barGroups: [
                    BarChartGroupData(
                      x: 0,
                      barRods: [
                        BarChartRodData(
                          toY: income,
                          width: 54,
                          borderRadius: BorderRadius.circular(5),
                        ),
                      ],
                    ),
                    BarChartGroupData(
                      x: 1,
                      barRods: [
                        BarChartRodData(
                          toY: expense,
                          width: 54,
                          borderRadius: BorderRadius.circular(5),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _shortCurrency(double value, NumberFormat currency) {
    if (value >= 1000000) return 'Rp${(value / 1000000).toStringAsFixed(1)}jt';
    if (value >= 1000) return 'Rp${(value / 1000).toStringAsFixed(0)}rb';
    return currency.format(value);
  }

  Widget _buildCategoryChart() {
    final counts = _categoryCounts();
    if (counts.isEmpty) {
      return const Card(
        margin: EdgeInsets.fromLTRB(12, 8, 12, 4),
        child: Padding(
          padding: EdgeInsets.all(20),
          child: Center(child: Text('Belum ada transaksi pada periode ini.')),
        ),
      );
    }

    final entries = counts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final palette = [
      Colors.teal,
      Colors.orange,
      Colors.indigo,
      Colors.redAccent,
      Colors.purple,
      Colors.brown,
      Colors.blueGrey,
      Colors.pink,
    ];
    final total = entries.fold<int>(0, (sum, e) => sum + e.value);

    return Card(
      margin: const EdgeInsets.fromLTRB(12, 8, 12, 4),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Kategori (Jumlah Transaksi)',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 220,
              child: Row(
                children: [
                  Expanded(
                    flex: 3,
                    child: PieChart(
                      PieChartData(
                        centerSpaceRadius: 38,
                        sectionsSpace: 2,
                        sections: List.generate(entries.length, (i) {
                          final pct = entries[i].value / total * 100;
                          return PieChartSectionData(
                            value: entries[i].value.toDouble(),
                            title: '${pct.toStringAsFixed(0)}%',
                            radius: 62,
                            color: palette[i % palette.length],
                            titleStyle: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          );
                        }),
                      ),
                    ),
                  ),
                  Expanded(
                    flex: 2,
                    child: ListView.builder(
                      itemCount: entries.length,
                      itemBuilder: (_, i) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          children: [
                            Container(
                              width: 10,
                              height: 10,
                              decoration: BoxDecoration(
                                color: palette[i % palette.length],
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                entries[i].key,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 12),
                              ),
                            ),
                            Text(
                              '${entries[i].value}',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLargestExpense(NumberFormat currency) {
    final largest = _largestExpense();
    if (largest == null) return const SizedBox.shrink();

    return Card(
      margin: const EdgeInsets.fromLTRB(12, 8, 12, 4),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.red.shade50,
          child: const Icon(Icons.trending_up, color: Colors.redAccent),
        ),
        title: const Text('Pengeluaran Terbesar'),
        subtitle: Text('${largest.description} • ${largest.category}'),
        trailing: Text(
          currency.format(largest.amount),
          style: const TextStyle(
            color: Colors.redAccent,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildInsight(NumberFormat currency, Map<String, dynamic> summary) {
    final income = (summary['income'] as num?)?.toDouble() ?? 0;
    final expense = (summary['expense'] as num?)?.toDouble() ?? 0;
    final balance = income - expense;
    final expenses = _expenseTransactions();
    final categoryValues = _expenseByCategory().entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final largest = _largestExpense();

    String headline;
    String detail;
    IconData icon;
    Color color;

    if (_transactions.isEmpty) {
      headline = 'Belum ada transaksi';
      detail = 'Belum ada cukup data untuk membuat insight pada filter $_periodLabel.';
      icon = Icons.insights;
      color = Colors.grey;
    } else if (income == 0 && expense > 0) {
      headline = 'Periode didominasi pengeluaran';
      detail = 'Total pengeluaran ${currency.format(expense)} dari ${expenses.length} transaksi. Pertimbangkan mengecek kategori dengan nilai terbesar.';
      icon = Icons.warning_amber_rounded;
      color = Colors.orange;
    } else if (balance >= 0) {
      headline = 'Arus keuangan positif';
      detail = 'Pemasukan ${currency.format(income)} lebih besar atau sama dengan pengeluaran ${currency.format(expense)}. Sisa periode ${currency.format(balance)}.';
      icon = Icons.trending_up;
      color = Colors.green;
    } else {
      headline = 'Pengeluaran melebihi pemasukan';
      detail = 'Selisih periode ini ${currency.format(balance.abs())}. Fokus pertama pada kategori pengeluaran terbesar.';
      icon = Icons.trending_down;
      color = Colors.redAccent;
    }

    final categoryInsight = categoryValues.isEmpty
        ? ''
        : ' Kategori pengeluaran terbesar adalah ${categoryValues.first.key} (${currency.format(categoryValues.first.value)}).';
    final largestInsight = largest == null
        ? ''
        : ' Transaksi terbesar: ${largest.description} (${currency.format(largest.amount)}).';

    return Card(
      margin: const EdgeInsets.fromLTRB(12, 8, 12, 4),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              backgroundColor: color.withValues(alpha: 0.12),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Insight Periode', style: TextStyle(fontSize: 12, color: Colors.grey)),
                  const SizedBox(height: 2),
                  Text(headline, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  const SizedBox(height: 4),
                  Text('$detail$categoryInsight$largestInsight', style: const TextStyle(fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showTransactionDetails(
    String title,
    List<TransactionModel> transactions,
    NumberFormat currency,
  ) async {
    final sorted = [...transactions]
      ..sort((a, b) => '${b.transactionDate}${b.transactionTime}'.compareTo('${a.transactionDate}${a.transactionTime}'));

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.65,
        minChildSize: 0.35,
        maxChildSize: 0.92,
        builder: (_, controller) => SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 12, 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        '$title (${sorted.length})',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: sorted.isEmpty
                    ? const Center(child: Text('Tidak ada transaksi pada periode ini.'))
                    : ListView.separated(
                        controller: controller,
                        itemCount: sorted.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (_, index) {
                          final tx = sorted[index];
                          final income = tx.type == 'income';
                          return ListTile(
                            leading: CircleAvatar(
                              backgroundColor: income ? Colors.green.shade50 : Colors.red.shade50,
                              child: Icon(
                                income ? Icons.arrow_downward : Icons.arrow_upward,
                                color: income ? Colors.green : Colors.redAccent,
                              ),
                            ),
                            title: Text(tx.description),
                            subtitle: Text('${tx.category} • ${tx.transactionDate}'),
                            trailing: Text(
                              '${income ? '+' : '-'}${currency.format(tx.amount)}',
                              style: TextStyle(
                                color: income ? Colors.green : Colors.redAccent,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp',
      decimalDigits: 0,
    );
    final summary = DatabaseHelper.instance.summarize(_transactions);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Laporan'),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            color: Colors.teal,
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left, color: Colors.white),
                  onPressed: _isRangeMode ? null : () => _shiftDay(-1),
                ),
                Flexible(
                  child: InkWell(
                    onTap: _showPeriodPicker,
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Flexible(
                            child: Text(
                              _periodLabel,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.arrow_drop_down, color: Colors.white),
                        ],
                      ),
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right, color: Colors.white),
                  onPressed: _isRangeMode ? null : () => _shiftDay(1),
                ),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : ListView(
                    children: [
                      _buildSummary(currency, summary),
                      _buildComparisonChart(currency, summary),
                      _buildCategoryChart(),
                      _buildLargestExpense(currency),
                      _buildInsight(currency, summary),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
                        child: SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.teal,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                            icon: const Icon(Icons.picture_as_pdf),
                            label: const Text('Export PDF'),
                            onPressed: _transactions.isEmpty
                                ? null
                                : () => PdfService.exportAndShare(
                                      title: _reportTitle,
                                      periodLabel: _periodLabel,
                                      transactions: _transactions,
                                      totalIncome: summary['income'],
                                      totalExpense: summary['expense'],
                                    ),
                          ),
                        ),
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _Metric({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Row(
            children: [
              Icon(icon, size: 18, color: color),
              const SizedBox(width: 7),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: const TextStyle(fontSize: 11)),
                    const SizedBox(height: 2),
                    Text(
                      value,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: color, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, size: 17, color: color),
            ],
          ),
        ),
      ),
    );
  }
}
