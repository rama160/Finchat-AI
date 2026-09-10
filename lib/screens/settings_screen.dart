import 'package:flutter/material.dart';
import '../services/storage_service.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final storage = StorageService();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Pengaturan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF0F172A))),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profile / App Info Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: const Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: Color(0xFF059669),
                  child: Icon(Icons.wallet, color: Colors.white, size: 24),
                ),
                SizedBox(width: 14),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Finchat AI', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    SizedBox(height: 2),
                    Text('Pencatatan Keuangan Cerdas', style: TextStyle(fontSize: 12, color: Colors.grey)),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Preferences
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              children: [
                const ListTile(
                  leading: Icon(Icons.currency_exchange, color: Color(0xFF059669)),
                  title: Text('Mata Uang', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  subtitle: Text('Rupiah Indonesia (IDR)', style: TextStyle(fontSize: 12)),
                  trailing: Icon(Icons.check, color: Color(0xFF059669)),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.table_chart_outlined, color: Color(0xFF2563EB)),
                  title: const Text('Sinkronisasi Google Sheets', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  subtitle: const Text('Ekspor otomatis transaksi ke spreadsheet', style: TextStyle(fontSize: 12)),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Konfigurasi Google Sheets dapat dihubungkan melalui Web App atau file config.'),
                      ),
                    );
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.delete_outline, color: Color(0xFFE11D48)),
                  title: const Text('Reset Data Transaksi', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFFE11D48))),
                  subtitle: const Text('Hapus seluruh riwayat transaksi lokal', style: TextStyle(fontSize: 12)),
                  onTap: () {
                    showDialog(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Reset Semua Data?'),
                        content: const Text('Tindakan ini akan menghapus semua riwayat transaksi yang tersimpan di perangkat ini.'),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE11D48), foregroundColor: Colors.white),
                            onPressed: () {
                              storage.clearAllTransactions();
                              Navigator.pop(ctx);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Semua transaksi telah dihapus.')),
                              );
                            },
                            child: const Text('Hapus'),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),
          Center(
            child: Text(
              'Finchat AI v1.0.0 (Flutter & Web Ready)',
              style: TextStyle(fontSize: 11, color: Colors.grey[400]),
            ),
          ),
        ],
      ),
    );
  }
}
