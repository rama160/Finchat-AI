import React, { useState, useMemo } from 'react';
import {
  FileDown,
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  ChevronRight,
  Sparkles,
  PieChart as PieChartIcon,
  Check
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { formatRupiah } from '../services/transactionParser';
import { DetailListModal } from '../components/DetailListModal';
import { CategoryDetailModal } from '../components/CategoryDetailModal';
import { CategoryPieChart, CategoryBreakdownItem } from '../components/CategoryPieChart';
import { AiFinancialInsights } from '../components/AiFinancialInsights';
import { ReportDateFilter, DateFilterPreset } from '../components/ReportDateFilter';
import { formatRangeDisplayTitle, getLastDayOfMonth, isFullMonthRange } from '../utils/dateFilterHelper';
import { exportReportToPdf } from '../services/pdfExportService';

interface ReportsScreenProps {
  transactions: Transaction[];
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ transactions }) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const lastDayThisMonth = getLastDayOfMonth(currentYear, currentMonth);
  const mStr = String(currentMonth).padStart(2, '0');

  // Filter state (Defaults to 'this_month' covering 1st to last day)
  const [preset, setPreset] = useState<DateFilterPreset>('this_month');
  const [startDate, setStartDate] = useState<string>(`${currentYear}-${mStr}-01`);
  const [endDate, setEndDate] = useState<string>(`${currentYear}-${mStr}-${String(lastDayThisMonth).padStart(2, '0')}`);

  // Modals state
  const [detailModalType, setDetailModalType] = useState<TransactionType | null>(null);
  const [selectedCategoryForDetail, setSelectedCategoryForDetail] = useState<string | null>(null);

  // PDF Export loading state
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [aiInsightsList, setAiInsightsList] = useState<string[]>([]);

  // Computed period title with rule: if 1st to end of month -> display month name
  const periodTitle = useMemo(() => {
    return formatRangeDisplayTitle(
      startDate,
      endDate,
      preset === 'all' ? 'all' : undefined
    );
  }, [startDate, endDate, preset]);

  // Filter transactions based on date
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (preset === 'all') return true;
      if (!startDate && !endDate) return true;

      const txDate = t.transaction_date;
      if (startDate && endDate) {
        return txDate >= startDate && txDate <= endDate;
      }
      if (startDate) {
        return txDate >= startDate;
      }
      if (endDate) {
        return txDate <= endDate;
      }
      return true;
    });
  }, [transactions, startDate, endDate, preset]);

  // Total Income
  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  // Total Expense
  const totalExpense = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  // Cashflow Balance
  const balance = totalIncome - totalExpense;

  // Category Breakdown for expenses
  const categoryBreakdown: CategoryBreakdownItem[] = useMemo(() => {
    const map: Record<string, { amount: number; count: number }> = {};
    const expenses = filteredTransactions.filter((t) => t.type === 'expense');

    for (const tx of expenses) {
      if (!map[tx.category]) {
        map[tx.category] = { amount: 0, count: 0 };
      }
      map[tx.category].amount += tx.amount;
      map[tx.category].count += 1;
    }

    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
        percentage: totalExpense > 0 ? Math.round((data.amount / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, totalExpense]);

  // Handle PDF Export
  const handleExportPdf = () => {
    try {
      setIsExportingPdf(true);
      exportReportToPdf({
        periodTitle,
        totalIncome,
        totalExpense,
        balance,
        transactions: filteredTransactions,
        categoryBreakdown,
        aiInsights: aiInsightsList.length > 0 ? aiInsightsList : undefined,
      });

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Gagal mengekspor PDF laporan.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Header & Export PDF Button */}
      <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
            <span>Laporan Keuangan</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Analisis kas, diagram kategori & AI insight
          </p>
        </div>

        {/* Export PDF Button */}
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={isExportingPdf}
          className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xs shrink-0 ${
            exportSuccess
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
          title="Download Laporan Format PDF"
        >
          {exportSuccess ? (
            <>
              <Check size={14} className="text-white" />
              <span>PDF Diunduh!</span>
            </>
          ) : (
            <>
              <FileDown size={14} className={isExportingPdf ? 'animate-bounce' : ''} />
              <span>{isExportingPdf ? 'Membuat PDF...' : 'Ekspor PDF'}</span>
            </>
          )}
        </button>
      </div>

      {/* Requirement 3: Advanced Date Filter with Smart Month detection */}
      <ReportDateFilter
        preset={preset}
        setPreset={setPreset}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        displayTitle={periodTitle}
      />

      {/* Net Cash Flow Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
          <span>Net Cash Flow ({periodTitle})</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              balance >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {balance >= 0 ? 'Surplus Kas' : 'Defisit Kas'}
          </span>
        </div>
        <div
          className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
            balance >= 0 ? 'text-slate-900' : 'text-rose-600'
          }`}
        >
          {formatRupiah(balance)}
        </div>
      </div>

      {/* Clickable Income & Expense Summary Cards */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Ringkasan Keuangan
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <Sparkles size={13} /> Klik Card untuk Lihat Detail Transaksi
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card PEMASUKAN */}
          <button
            type="button"
            onClick={() => setDetailModalType('income')}
            className="p-4 bg-white hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 rounded-2xl shadow-2xs hover:shadow-xs transition-all text-left group active:scale-98 relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowUpCircle size={22} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-600 block">
                    TOTAL PEMASUKAN
                  </span>
                  <span className="text-lg font-black font-mono text-emerald-600 block">
                    {formatRupiah(totalIncome)}
                  </span>
                </div>
              </div>
              <div className="p-1 rounded-full bg-slate-100 group-hover:bg-emerald-200 text-slate-400 group-hover:text-emerald-800 transition-colors">
                <ChevronRight size={16} />
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>{filteredTransactions.filter((t) => t.type === 'income').length} Transaksi</span>
              <span className="text-emerald-700 font-bold group-hover:underline">
                Buka Detail Pemasukan &rarr;
              </span>
            </div>
          </button>

          {/* Card PENGELUARAN */}
          <button
            type="button"
            onClick={() => setDetailModalType('expense')}
            className="p-4 bg-white hover:bg-rose-50/40 border border-slate-200 hover:border-rose-300 rounded-2xl shadow-2xs hover:shadow-xs transition-all text-left group active:scale-98 relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowDownCircle size={22} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-600 block">
                    TOTAL PENGELUARAN
                  </span>
                  <span className="text-lg font-black font-mono text-rose-600 block">
                    {formatRupiah(totalExpense)}
                  </span>
                </div>
              </div>
              <div className="p-1 rounded-full bg-slate-100 group-hover:bg-rose-200 text-slate-400 group-hover:text-rose-800 transition-colors">
                <ChevronRight size={16} />
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>{filteredTransactions.filter((t) => t.type === 'expense').length} Transaksi</span>
              <span className="text-rose-700 font-bold group-hover:underline">
                Buka Detail Pengeluaran &rarr;
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Requirement 1: Pengeluaran Berdasarkan Kategori (PIE CHART + INTERACTIVE DETAIL) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <PieChartIcon size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Pengeluaran Berdasarkan Kategori
              </h3>
              <p className="text-[11px] text-slate-400">
                Diagram proporsi pengeluaran ({categoryBreakdown.length} kategori)
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-slate-600 font-mono">
            {formatRupiah(totalExpense)}
          </span>
        </div>

        {/* Pie Chart Component */}
        <CategoryPieChart
          data={categoryBreakdown}
          totalExpense={totalExpense}
          onSelectCategory={(catName) => setSelectedCategoryForDetail(catName)}
        />
      </div>

      {/* Requirement 2: AI INSIGHT (Replaces Top 5 Largest Expenses) */}
      <AiFinancialInsights
        transactions={filteredTransactions}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        balance={balance}
        categoryBreakdown={categoryBreakdown}
        periodTitle={periodTitle}
        onAIInsightsGenerated={(insights) => setAiInsightsList(insights)}
      />

      {/* Modal 1: Detail Transaksi Per Kategori (Saat klik slice atau baris kategori) */}
      {selectedCategoryForDetail && (
        <CategoryDetailModal
          isOpen={Boolean(selectedCategoryForDetail)}
          onClose={() => setSelectedCategoryForDetail(null)}
          categoryName={selectedCategoryForDetail}
          transactions={filteredTransactions}
          periodTitle={periodTitle}
        />
      )}

      {/* Modal 2: Detail Transaksi Pemasukan / Pengeluaran Umum */}
      {detailModalType && (
        <DetailListModal
          isOpen={Boolean(detailModalType)}
          onClose={() => setDetailModalType(null)}
          type={detailModalType}
          transactions={filteredTransactions}
          periodTitle={periodTitle}
        />
      )}
    </div>
  );
};
