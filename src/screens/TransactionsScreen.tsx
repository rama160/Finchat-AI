import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Mic,
  Camera,
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Calendar,
  Store,
  CreditCard,
  Edit2,
  Trash2,
  Send,
  CloudCheck,
  Clock,
  Sparkles,
  Filter
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { formatRupiah, parseMultiTransactions, createTransactionObject } from '../services/transactionParser';
import { CategoryIcon } from '../components/CategoryIcon';
import { ALL_CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/categories';
import { TelegramChatInput } from '../components/TelegramChatInput';

interface TransactionsScreenProps {
  transactions: Transaction[];
  onAddTransaction: (tx: Partial<Transaction>) => void;
  onAddMultipleTransactions: (txs: Partial<Transaction>[]) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenVoiceModal: () => void;
  onOpenReceiptModal: () => void;
  onOpenAddModal: () => void;
  onNavigateToChat?: (initialMessage?: string) => void;
  isOnline: boolean;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  transactions,
  onAddTransaction,
  onAddMultipleTransactions,
  onEditTransaction,
  onDeleteTransaction,
  onOpenVoiceModal,
  onOpenReceiptModal,
  onOpenAddModal,
  onNavigateToChat,
  isOnline,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [quickInputText, setQuickInputText] = useState('');
  const [quickInputSuccess, setQuickInputSuccess] = useState<string | null>(null);

  // Unique categories based on active filterType (deduplicated to prevent duplicate keys like 'Lainnya')
  const categoryOptions = useMemo(() => {
    let sourceList = ALL_CATEGORIES;
    if (filterType === 'expense') {
      sourceList = EXPENSE_CATEGORIES;
    } else if (filterType === 'income') {
      sourceList = INCOME_CATEGORIES;
    }
    return Array.from(new Set(sourceList.map((c) => c.name)));
  }, [filterType]);

  useEffect(() => {
    if (selectedCategory !== 'all' && !categoryOptions.includes(selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [categoryOptions, selectedCategory]);

  // Financial Summary
  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const balance = totalIncome - totalExpense;

  // Handle Telegram-style Chat Input Submission
  const handleInputSend = (text: string) => {
    if (!text.trim()) return;

    // Try parsing multi-transactions (e.g. "beli baju 100rb, cabe 20rb, popok 50rb")
    const drafts = parseMultiTransactions(text, 'text');
    if (drafts.length > 0) {
      const newTxs = drafts.map((d) => createTransactionObject(d));
      onAddMultipleTransactions(newTxs);
      setQuickInputSuccess(`Berhasil mencatat ${newTxs.length} transaksi baru!`);
      setQuickInputText('');
      setTimeout(() => setQuickInputSuccess(null), 3500);
      return;
    }

    // If no transactions parsed and it's conversational / financial question
    if (onNavigateToChat) {
      onNavigateToChat(text);
      setQuickInputText('');
    } else {
      alert('Sertakan nama barang dan nominal harga, contoh: "beli nasi 25rb, es 5rb" atau buka tab Chat AI.');
    }
  };

  // Filtered List
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesType = filterType === 'all' || tx.type === filterType;
      const matchesCategory = selectedCategory === 'all' || tx.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        tx.description.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        (tx.merchant && tx.merchant.toLowerCase().includes(q));

      return matchesType && matchesCategory && matchesSearch;
    });
  }, [transactions, filterType, selectedCategory, searchQuery]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    for (const tx of filteredTransactions) {
      let label = tx.transaction_date;
      if (tx.transaction_date === today) label = 'Hari Ini';
      else if (tx.transaction_date === yesterday) label = 'Kemarin';

      if (!groups[label]) groups[label] = [];
      groups[label].push(tx);
    }

    return groups;
  }, [filteredTransactions]);

  const sourceLabels: Record<string, string> = {
    text: 'Teks',
    voice: 'Suara',
    receipt: 'Struk',
    chat: 'Chat AI',
    manual: 'Manual'
  };

  return (
    <div className="space-y-4 pb-36">
      {/* Saldo & Cashflow Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 text-white shadow-xl border border-slate-700/50 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
            <Wallet size={15} className="text-emerald-400" />
            <span>Total Saldo Finchat AI</span>
          </div>
          <span className="text-[10px] bg-slate-700/80 text-emerald-400 px-2.5 py-0.5 rounded-full font-mono border border-slate-600">
            {transactions.length} Transaksi Tersimpan
          </span>
        </div>

        <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono text-white mb-4">
          {formatRupiah(balance)}
        </div>

        {/* Income vs Expense Mini Stats */}
        <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-700/70">
          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ArrowUpCircle size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-medium block truncate">Pemasukan</span>
              <span className="text-xs font-bold text-emerald-400 font-mono truncate block">
                {formatRupiah(totalIncome)}
              </span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <ArrowDownCircle size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-medium block truncate">Pengeluaran</span>
              <span className="text-xs font-bold text-rose-400 font-mono truncate block">
                {formatRupiah(totalExpense)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
        {/* Type Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filterType === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({transactions.length})
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filterType === 'expense'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pengeluaran
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filterType === 'income'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pemasukan
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi..."
              className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none max-w-[130px] truncate"
          >
            <option value="all">Semua Kategori</option>
            {categoryOptions.map((catName) => (
              <option key={catName} value={catName}>
                {catName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Filter size={20} />
            </div>
            <p className="text-sm font-bold text-slate-700">Belum ada transaksi</p>
            <p className="text-xs text-slate-400 mt-1">
              Gunakan tombol Voice Input, Scan Struk, atau ketik langsung di atas.
            </p>
          </div>
        ) : (
          (Object.entries(groupedTransactions) as [string, Transaction[]][]).map(([dateLabel, txList]) => (
            <div key={dateLabel} className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {dateLabel}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {txList.length} transaksi
                </span>
              </div>

              <div className="space-y-2">
                {txList.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CategoryIcon categoryName={tx.category} type={tx.type} size={20} />

                      <div className="min-w-0">
                        {/* CRITICAL: Must show original detailed description, not category name! */}
                        <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
                          {tx.description}
                        </h4>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[11px] text-slate-500">
                          {/* Category pill */}
                          <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                            {tx.category}
                          </span>

                          {/* Source badge */}
                          <span className="text-[10px] text-slate-400">
                            • {sourceLabels[tx.source] || tx.source}
                          </span>

                          {/* Merchant if exists */}
                          {tx.merchant && (
                            <span className="text-[10px] text-slate-500 truncate max-w-[100px]">
                              • {tx.merchant}
                            </span>
                          )}

                          {/* Sync status */}
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
                            {tx.sync_status === 'synced' ? (
                              <span className="text-emerald-600 flex items-center gap-0.5">
                                • Terhubung
                              </span>
                            ) : (
                              <span className="text-amber-600 flex items-center gap-0.5">
                                • Pending
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span
                          className={`text-sm font-extrabold font-mono ${
                            tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          {tx.transaction_time?.slice(0, 5) || '12:00'}
                        </span>
                      </div>

                      {/* Quick Edit & Delete Actions */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus transaksi "${tx.description}"?`)) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Success Toast */}
      {quickInputSuccess && (
        <div className="fixed bottom-[124px] inset-x-0 mx-auto max-w-sm px-4 z-35 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-slate-900/95 text-white text-xs font-semibold py-2.5 px-4 rounded-2xl shadow-xl flex items-center justify-between border border-emerald-500/40 backdrop-blur-md">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {quickInputSuccess}
            </span>
            <button
              type="button"
              onClick={() => setQuickInputSuccess(null)}
              className="text-slate-400 hover:text-white text-sm ml-2 font-bold px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Telegram-style Input Bar Docked at Bottom of Transactions Screen */}
      <div className="fixed bottom-[53px] inset-x-0 mx-auto w-full max-w-lg z-30 bg-slate-100/95 backdrop-blur-md border-t border-slate-200/90 py-1 px-1.5 sm:px-2 shadow-md">
        <TelegramChatInput
          inputText={quickInputText}
          setInputText={setQuickInputText}
          onSend={handleInputSend}
          onOpenVoiceModal={onOpenVoiceModal}
          onOpenReceiptModal={onOpenReceiptModal}
          onOpenAddModal={onOpenAddModal}
          placeholder="Pesan"
        />
      </div>
    </div>
  );
};
