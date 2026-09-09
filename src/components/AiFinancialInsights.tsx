import React, { useState } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Lightbulb, ShieldAlert, CheckCircle2, RefreshCw, Bot } from 'lucide-react';
import { Transaction } from '../types';
import { formatRupiah } from '../services/transactionParser';

interface AiFinancialInsightsProps {
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: Array<{
    name: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  periodTitle: string;
  onAIInsightsGenerated?: (insights: string[]) => void;
}

export const AiFinancialInsights: React.FC<AiFinancialInsightsProps> = ({
  transactions,
  totalIncome,
  totalExpense,
  balance,
  categoryBreakdown,
  periodTitle,
  onAIInsightsGenerated,
}) => {
  const [liveAiInsight, setLiveAiInsight] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Compute Algorithmic Insights
  const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');

  // Compute burn rate / health status
  const expenseRatio = totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 100;

  const healthStatus = (() => {
    if (totalExpense === 0 && totalIncome === 0) {
      return {
        label: 'Belum Ada Aktivitas',
        color: 'bg-slate-100 text-slate-700 border-slate-300',
        badge: 'Netral',
        icon: CheckCircle2,
      };
    }
    if (totalExpense === 0 && totalIncome > 0) {
      return {
        label: '100% Saldo Tersimpan',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badge: 'Sangat Sehat',
        icon: CheckCircle2,
      };
    }
    if (totalIncome === 0 && totalExpense > 0) {
      return {
        label: 'Pengeluaran Tanpa Pemasukan Tercatat',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        badge: 'Defisit Periode',
        icon: ShieldAlert,
      };
    }
    if (expenseRatio <= 50) {
      return {
        label: `Arus Kas Prima: Pengeluaran hanya ${expenseRatio}% dari Pemasukan`,
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badge: 'Arus Kas Sehat',
        icon: CheckCircle2,
      };
    }
    if (expenseRatio <= 85) {
      return {
        label: `Arus Kas Terkendali: Beban ${expenseRatio}% dari Pemasukan`,
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        badge: 'Cukup Aman',
        icon: TrendingUp,
      };
    }
    return {
      label: `Peringatan: Pengeluaran mencapai ${expenseRatio}% dari Pemasukan`,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      badge: 'Defisit / Waspada',
      icon: TrendingDown,
    };
  })();

  // Specific smart saving recommendations based on dominant category
  const categoryRecommendation = (() => {
    if (!topCategory) return 'Catat pengeluaran Anda untuk menerima rekomendasi cerdas dari AI.';

    const catName = topCategory.name.toLowerCase();
    if (catName.includes('makan') || catName.includes('minum')) {
      return `Pengeluaran kuliner ${topCategory.name} menyerap ${topCategory.percentage}% anggaran (${formatRupiah(topCategory.amount)}). Coba atur kuota mingguan untuk makan di luar atau manfaatkan promo makanan online untuk hemat hingga 15-20%.`;
    }
    if (catName.includes('rokok')) {
      return `Pos ${topCategory.name} mencapai ${formatRupiah(topCategory.amount)} (${topCategory.count}x beli). Pengurangan bertahap konsumsi bisa mengalihkan dana ini ke pos investasi atau tabungan masa depan.`;
    }
    if (catName.includes('belanja') || catName.includes('pakaian')) {
      return `Kategori belanja non-rutin mendominasi ${topCategory.percentage}%. Gunakan "Aturan 24 Jam" sebelum membeli barang non-esensial untuk mencegah pembelian impulsif.`;
    }
    if (catName.includes('transport')) {
      return `Transportasi menyerap ${topCategory.percentage}% kas. Pertimbangkan opsi tiket bulanan, carpooling, atau rute efisien untuk menekan biaya bahan bakar/ongkos.`;
    }
    if (catName.includes('tagihan') || catName.includes('pulsa')) {
      return `Pos tagihan & langganan tercatat ${formatRupiah(topCategory.amount)}. Periksa apakah ada paket langganan digital yang sudah tidak aktif digunakan.`;
    }
    return `Pos ${topCategory.name} merupakan pengeluaran terbesar (${topCategory.percentage}% dari total). Menjaga pos ini di bawah batas aman akan menjaga kestabilan saldo Anda.`;
  })();

  // Average transaction value
  const avgExpensePerTx = expenseTransactions.length > 0 ? Math.round(totalExpense / expenseTransactions.length) : 0;

  // Request Live AI Insight via Gemini API
  const handleFetchAiInsight = async () => {
    setIsLoadingAi(true);
    setAiError(null);

    try {
      const summaryPayload = {
        periodTitle,
        totalIncome,
        totalExpense,
        balance,
        transactionCount: transactions.length,
        topCategory: topCategory ? `${topCategory.name} (${formatRupiah(topCategory.amount)}, ${topCategory.percentage}%)` : 'None',
        categoryBreakdown: categoryBreakdown.slice(0, 4).map((c) => `${c.name}: ${formatRupiah(c.amount)} (${c.percentage}%)`).join(', '),
      };

      const prompt = `Sebagai penasihat keuangan pribadi Finchat AI, berikan analisis ringkas dan 3 saran taktis untuk kondisi keuangan pengguna berikut ini:
Periode: ${summaryPayload.periodTitle}
Pemasukan: ${formatRupiah(totalIncome)}
Pengeluaran: ${formatRupiah(totalExpense)}
Net Cash Flow / Saldo: ${formatRupiah(balance)}
Kategori Terbesar: ${summaryPayload.topCategory}
Breakdown Kategori: ${summaryPayload.categoryBreakdown}

Tuliskan dalam Bahasa Indonesia yang ramah, ringkas, profesional, to-the-point, dan berikan poin rekomendasi aksi konkret. Jangan bertele-tele.`;

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });

      if (!res.ok) {
        throw new Error('Gagal menghubungi layanan AI Gemini');
      }

      const data = await res.json();
      if (data && data.reply) {
        setLiveAiInsight(data.reply);
        if (onAIInsightsGenerated) {
          // split points
          const bulletPoints = data.reply
            .split('\n')
            .filter((l: string) => l.trim().length > 0)
            .slice(0, 4);
          onAIInsightsGenerated(bulletPoints);
        }
      } else {
        throw new Error('Respon AI kosong');
      }
    } catch (err: any) {
      setAiError(err.message || 'Tidak dapat memuat insight AI saat ini');
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-3xl shadow-xl border border-slate-700/60 relative overflow-hidden space-y-4">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              AI Financial Insight
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                Cerdas
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Evaluasi & pola pengeluaran periode {periodTitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFetchAiInsight}
          disabled={isLoadingAi || transactions.length === 0}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Tanya saran mendalam ke Gemini AI"
        >
          <RefreshCw size={12} className={isLoadingAi ? 'animate-spin text-emerald-400' : ''} />
          {isLoadingAi ? 'Menganalisis...' : 'Analisis Mendalam'}
        </button>
      </div>

      {/* Status Health Pill Card */}
      <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
            <healthStatus.icon size={16} />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-white block truncate">
              {healthStatus.label}
            </span>
            <span className="text-[10px] text-slate-400 block">
              Rata-rata {formatRupiah(avgExpensePerTx)} / pengeluaran
            </span>
          </div>
        </div>

        <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-xl bg-slate-800 text-emerald-300 border border-emerald-500/30 shrink-0 font-mono">
          {healthStatus.badge}
        </span>
      </div>

      {/* Actionable Key Insights */}
      <div className="space-y-2.5 relative z-10">
        {/* Insight 1: Dominant Category */}
        {topCategory && (
          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <TrendingUp size={13} />
            </div>
            <div className="text-xs leading-relaxed text-slate-200">
              <strong className="text-white font-semibold">Pos Dominan:</strong>{' '}
              Kategori <span className="text-amber-300 font-bold">{topCategory.name}</span> menyerap{' '}
              <span className="font-bold text-white font-mono">{topCategory.percentage}%</span> dari seluruh pengeluaran ({formatRupiah(topCategory.amount)}).
            </div>
          </div>
        )}

        {/* Insight 2: Smart Saving Action */}
        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
            <Lightbulb size={13} />
          </div>
          <div className="text-xs leading-relaxed text-slate-300">
            <strong className="text-emerald-300 font-semibold">Rekomendasi Hemat:</strong>{' '}
            {categoryRecommendation}
          </div>
        </div>
      </div>

      {/* Live Gemini AI Coaching Result (if loaded) */}
      {liveAiInsight && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl relative z-10 space-y-1.5 animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
            <Bot size={15} />
            <span>Saran Khusus Asisten AI Finchat:</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
            {liveAiInsight}
          </p>
        </div>
      )}

      {aiError && (
        <p className="text-[11px] text-rose-400 pl-1 relative z-10">
          ⚠️ {aiError}
        </p>
      )}
    </div>
  );
};
