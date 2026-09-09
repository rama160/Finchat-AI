import { ChatMessage, Transaction } from '../types';
import { databaseHelper } from './databaseHelper';
import { createTransactionObject, formatRupiah, parseMultiTransactions } from './transactionParser';

export class AiService {
  /**
   * Process a user chat message
   */
  async processUserMessage(userText: string): Promise<ChatMessage> {
    const raw = userText.trim();
    const lower = raw.toLowerCase();

    // 1. Check if user text contains transaction intentions (e.g. "beli celana 100rb, cabe 20rb dan popok 50rb")
    const parsedDrafts = parseMultiTransactions(raw, 'chat');

    if (parsedDrafts.length > 0) {
      const fullTxs = parsedDrafts.map(d => createTransactionObject(d));
      const total = fullTxs.reduce((sum, t) => sum + t.amount, 0);

      const itemsList = fullTxs
        .map((t, idx) => `${idx + 1}. **${t.description}** (${t.category}): ${formatRupiah(t.amount)}`)
        .join('\n');

      return {
        id: `msg_${Date.now()}`,
        sender: 'ai',
        text: `Saya mendeteksi **${fullTxs.length} transaksi** dari pesan Anda:\n\n${itemsList}\n\n**Total: ${formatRupiah(total)}**\n\nKlik tombol di bawah untuk langsung menyimpannya ke daftar transaksi Anda:`,
        timestamp: new Date().toISOString(),
        suggested_transactions: fullTxs,
        is_saved: false
      };
    }

    // 2. Financial Query Answering using real local database
    const financialAnswer = this.answerFinancialQuery(lower);
    if (financialAnswer) {
      return {
        id: `msg_${Date.now()}`,
        sender: 'ai',
        text: financialAnswer,
        timestamp: new Date().toISOString()
      };
    }

    // 3. Try Server Gemini Endpoint if available
    try {
      const serverRes = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: raw })
      });

      if (serverRes.ok) {
        const data = await serverRes.json();
        if (data && data.reply) {
          return {
            id: `msg_${Date.now()}`,
            sender: 'ai',
            text: data.reply,
            timestamp: new Date().toISOString()
          };
        }
      }
    } catch {
      // Fallback
    }

    // 4. Smart conversational fallback in Indonesian
    return {
      id: `msg_${Date.now()}`,
      sender: 'ai',
      text: this.getGeneralAssistantResponse(raw),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Deterministic financial queries answering from local database
   */
  private answerFinancialQuery(query: string): string | null {
    const transactions = databaseHelper.getTransactions();
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

    const currentMonthTxs = transactions.filter(t => t.transaction_date.startsWith(currentMonthPrefix));
    const lastMonthTxs = transactions.filter(t => t.transaction_date.startsWith(lastMonthPrefix));

    const currentExpense = currentMonthTxs
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentIncome = currentMonthTxs
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const allExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const allIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentBalance = allIncome - allExpense;

    // "berapa saldo saya" / "saldo"
    if (query.includes('saldo') || query.includes('sisa uang') || query.includes('sisa kas')) {
      return `💰 **Informasi Saldo Anda Saat Ini:**\n\n• **Total Pemasukan:** ${formatRupiah(allIncome)}\n• **Total Pengeluaran:** ${formatRupiah(allExpense)}\n• **Saldo Tersedia:** **${formatRupiah(currentBalance)}**\n\n${currentBalance < 0 ? '⚠️ Pengeluaran Anda melebihi pemasukan total.' : '✅ Saldo keuangan Anda dalam kondisi positif.'}`;
    }

    // "berapa pengeluaran saya bulan ini"
    if (query.includes('pengeluaran') && (query.includes('bulan ini') || query.includes('sekarang'))) {
      return `📊 **Pengeluaran Bulan Ini (${currentMonthPrefix}):**\n\nTotal pengeluaran Anda adalah **${formatRupiah(currentExpense)}** dari ${currentMonthTxs.filter(t => t.type === 'expense').length} transaksi.\n\nPemasukan tercatat: ${formatRupiah(currentIncome)}\nNet cashflow bulan ini: **${formatRupiah(currentIncome - currentExpense)}**.`;
    }

    // "kategori apa yang paling banyak" / "terbanyak" / "pengeluaran terbesar"
    if (query.includes('paling banyak') || query.includes('terbanyak') || query.includes('terbesar') || query.includes('kategori apa')) {
      const catTotals: Record<string, number> = {};
      currentMonthTxs
        .filter(t => t.type === 'expense')
        .forEach(t => {
          catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
        });

      const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
      if (sorted.length === 0) {
        return 'Belum ada data pengeluaran yang tercatat untuk bulan ini.';
      }

      const topCategory = sorted[0];
      const percent = currentExpense > 0 ? Math.round((topCategory[1] / currentExpense) * 100) : 0;

      const topList = sorted
        .slice(0, 3)
        .map((s, idx) => `${idx + 1}. **${s[0]}**: ${formatRupiah(s[1])} (${Math.round((s[1] / (currentExpense || 1)) * 100)}%)`)
        .join('\n');

      return `🏷️ **Kategori Pengeluaran Terbanyak Bulan Ini:**\n\nKategori nomor 1 adalah **${topCategory[0]}** dengan total **${formatRupiah(topCategory[1])}** (${percent}% dari total pengeluaran bulan ini).\n\n**Top 3 Kategori:**\n${topList}`;
    }

    // Specific category query e.g. "pengeluaran makanan", "pengeluaran pakaian", etc.
    const categoriesToCheck = [
      'makanan', 'minuman', 'rokok', 'pakaian', 'perlengkapan bayi',
      'kebutuhan dapur', 'kebutuhan rumah tangga', 'transportasi',
      'belanja', 'tagihan', 'pulsa & data', 'kesehatan', 'hiburan', 'pendidikan'
    ];

    for (const catName of categoriesToCheck) {
      if (query.includes(catName)) {
        const catTxs = currentMonthTxs.filter(
          t => t.category.toLowerCase() === catName.toLowerCase() && t.type === 'expense'
        );
        const totalCat = catTxs.reduce((sum, t) => sum + t.amount, 0);

        return `🛍️ **Pengeluaran Kategori ${catName.toUpperCase()}:**\n\nTotal pengeluaran kategori **${catName}** di bulan ini adalah **${formatRupiah(totalCat)}** (${catTxs.length} transaksi).\n\n${catTxs.length > 0 ? 'Item terbaru: ' + catTxs.slice(0, 2).map(t => `${t.description} (${formatRupiah(t.amount)})`).join(', ') : 'Belum ada transaksi di kategori ini bulan ini.'}`;
      }
    }

    // "bandingkan pengeluaran bulan ini dengan bulan lalu"
    if (query.includes('bandingkan') || query.includes('bulan lalu') || query.includes('perbandingan')) {
      const lastExpense = lastMonthTxs
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const diff = currentExpense - lastExpense;
      const percentDiff = lastExpense > 0 ? Math.round((Math.abs(diff) / lastExpense) * 100) : 0;

      let analysis = '';
      if (diff > 0) {
        analysis = `🔺 Pengeluaran bulan ini **meningkat ${formatRupiah(diff)}** (+${percentDiff}%) dibandingkan bulan lalu.`;
      } else if (diff < 0) {
        analysis = `🔻 Pengeluaran bulan ini **hemat ${formatRupiah(Math.abs(diff))}** (-${percentDiff}%) dibandingkan bulan lalu. Bagus sekali!`;
      } else {
        analysis = '⚖️ Pengeluaran bulan ini sama persis dengan bulan lalu.';
      }

      return `📈 **Perbandingan Pengeluaran:**\n\n• **Bulan Ini:** ${formatRupiah(currentExpense)}\n• **Bulan Lalu:** ${formatRupiah(lastExpense)}\n\n${analysis}`;
    }

    return null;
  }

  private getGeneralAssistantResponse(query: string): string {
    return `Saya dapat membantu Anda mencatat keuangan dan menjawab pertanyaan laporan, seperti:\n\n` +
      `• *"Berapa pengeluaran saya bulan ini?"*\n` +
      `• *"Kategori apa yang paling banyak?"*\n` +
      `• *"Berapa pengeluaran makanan atau pakaian?"*\n` +
      `• *"Berapa saldo saya?"*\n` +
      `• *"Bandingkan pengeluaran bulan ini dengan bulan lalu"*\n\n` +
      `Atau Anda bisa langsung mencatat pengeluaran, contoh:\n` +
      `👉 *"beli celana 100rb, cabe 20rb dan popok 50rb"*`;
  }
}

export const aiService = new AiService();
