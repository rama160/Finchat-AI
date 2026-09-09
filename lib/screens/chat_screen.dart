import 'package:flutter/material.dart';
import '../services/storage_service.dart';

class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime time;

  ChatMessage({required this.text, required this.isUser, required this.time});
}

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final StorageService _storage = StorageService();
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<ChatMessage> _messages = [];
  bool _isTyping = false;

  final List<String> _quickPrompts = [
    'Berapa sisa saldo kas saya?',
    'Berapa pengeluaran makanan bulan ini?',
    'Beri saran hemat untuk keuangan saya',
    'Rangkum arus kas saya',
  ];

  @override
  void initState() {
    super.initState();
    _messages.add(
      ChatMessage(
        text: 'Halo! Saya Finchat AI, asisten keuangan cerdas Anda. Anda bisa mencatat transaksi lewat obrolan atau menanyakan analisis pengeluaran.',
        isUser: false,
        time: DateTime.now(),
      ),
    );
  }

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage(String text) {
    if (text.trim().isEmpty) return;

    setState(() {
      _messages.add(ChatMessage(text: text.trim(), isUser: true, time: DateTime.now()));
      _isTyping = true;
    });
    _inputController.clear();
    _scrollToBottom();

    // Process AI response
    Future.delayed(const Duration(milliseconds: 600), () {
      if (!mounted) return;
      final reply = _generateAIResponse(text);
      setState(() {
        _messages.add(ChatMessage(text: reply, isUser: false, time: DateTime.now()));
        _isTyping = false;
      });
      _scrollToBottom();
    });
  }

  String _generateAIResponse(String prompt) {
    final lower = prompt.toLowerCase();
    final balanceStr = StorageService.formatRupiah(_storage.balance);
    final incomeStr = StorageService.formatRupiah(_storage.totalIncome);
    final expenseStr = StorageService.formatRupiah(_storage.totalExpense);

    if (lower.contains('saldo') || lower.contains('sisa') || lower.contains('uang')) {
      return 'Saat ini total saldo kas Anda adalah $balanceStr (Pemasukan: $incomeStr, Pengeluaran: $expenseStr).';
    } else if (lower.contains('makanan') || lower.contains('makan')) {
      final foodTx = _storage.transactions.where((t) => t.category == 'Makanan');
      final foodTotal = foodTx.fold(0, (sum, t) => sum + t.amount);
      return 'Total pengeluaran untuk kategori Makanan adalah ${StorageService.formatRupiah(foodTotal)} dari ${foodTx.length} transaksi.';
    } else if (lower.contains('hemat') || lower.contains('tips') || lower.contains('saran')) {
      return '💡 Saran hemat Finchat AI:\n1. Alokasikan 50% untuk kebutuhan, 30% keinginan, 20% tabungan/investasi.\n2. Batasi jajan kopi dan makanan pesan-antar ke maksimal 3 kali seminggu.\n3. Catat segera setiap transaksi sekecil apa pun!';
    } else if (lower.contains('rangkum') || lower.contains('laporan')) {
      return '📊 Rangkuman Keuangan:\n• Total Pemasukan: $incomeStr\n• Total Pengeluaran: $expenseStr\n• Net Cash Flow: $balanceStr\nStatus kas Anda dalam kondisi sehat dan surplus!';
    } else {
      return 'Saya memahami pesan Anda. Anda dapat bertanya seputar sisa saldo, rincian kategori pengeluaran, atau tips berhemat.';
    }
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Row(
          children: [
            CircleAvatar(
              radius: 14,
              backgroundColor: Color(0xFFD1FAE5),
              child: Icon(Icons.auto_awesome, color: Color(0xFF059669), size: 16),
            ),
            SizedBox(width: 8),
            Text('Finchat AI Chat', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF0F172A))),
          ],
        ),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Quick Prompts
          Container(
            height: 44,
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              scrollDirection: Axis.horizontal,
              itemCount: _quickPrompts.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (ctx, idx) {
                return ActionChip(
                  label: Text(_quickPrompts[idx], style: const TextStyle(fontSize: 11, color: Color(0xFF065F46))),
                  backgroundColor: const Color(0xFFECFDF5),
                  side: const BorderSide(color: Color(0xFFA7F3D0)),
                  onPressed: () => _sendMessage(_quickPrompts[idx]),
                );
              },
            ),
          ),

          // Messages List
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (ctx, idx) {
                final msg = _messages[idx];
                return Align(
                  alignment: msg.isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
                    decoration: BoxDecoration(
                      color: msg.isUser ? const Color(0xFF059669) : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: msg.isUser ? null : Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.02),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Text(
                      msg.text,
                      style: TextStyle(
                        fontSize: 13,
                        color: msg.isUser ? Colors.white : const Color(0xFF1E293B),
                        height: 1.4,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          if (_isTyping)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              alignment: Alignment.centerLeft,
              child: const Text('Finchat AI sedang mengetik...', style: TextStyle(fontSize: 11, color: Colors.grey)),
            ),

          // Chat Input Field
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _inputController,
                      decoration: InputDecoration(
                        hintText: 'Tanyakan sesuatu tentang keuangan Anda...',
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
                      onSubmitted: (val) => _sendMessage(val),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    backgroundColor: const Color(0xFF059669),
                    radius: 18,
                    child: IconButton(
                      icon: const Icon(Icons.arrow_upward, size: 16, color: Colors.white),
                      onPressed: () => _sendMessage(_inputController.text),
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
