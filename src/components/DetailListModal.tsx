import React, { useState } from 'react';
import { X, ArrowDownCircle, ArrowUpCircle, Search, Calendar, Tag, Store, CreditCard } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { formatRupiah } from '../services/transactionParser';
import { CategoryIcon } from './CategoryIcon';

interface DetailListModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: TransactionType;
  transactions: Transaction[];
  periodTitle: string;
}

export const DetailListModal: React.FC<DetailListModalProps> = ({
  isOpen,
  onClose,
  type,
  transactions,
  periodTitle,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const isIncome = type === 'income';
  const filteredByType = transactions.filter((t) => t.type === type);

  const totalAmount = filteredByType.reduce((sum, t) => sum + t.amount, 0);

  // Available categories for secondary filter
  const categories = Array.from(new Set(filteredByType.map((t) => t.category)));

  const displayList = filteredByType.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      (t.merchant && t.merchant.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-6 py-5 border-b flex items-center justify-between ${
            isIncome
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-rose-600 text-white border-rose-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {isIncome ? <ArrowUpCircle size={22} /> : <ArrowDownCircle size={22} />}
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Detail Transaksi {isIncome ? 'Pemasukan' : 'Pengeluaran'}
              </h2>
              <p className="text-xs text-white/80 font-medium">
                Periode: {periodTitle} ({filteredByType.length} transaksi)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Hero Total Amount Banner */}
        <div className={`p-4 ${isIncome ? 'bg-emerald-50 border-b border-emerald-100' : 'bg-rose-50 border-b border-rose-100'} flex items-center justify-between`}>
          <div>
            <span className={`text-xs font-semibold block ${isIncome ? 'text-emerald-800' : 'text-rose-800'}`}>
              Total {isIncome ? 'Pemasukan' : 'Pengeluaran'} Periode Ini:
            </span>
            <span className={`text-xl font-black font-mono tracking-tight ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatRupiah(totalAmount)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 font-medium block">Jumlah Catatan</span>
            <span className="text-sm font-bold text-slate-800">{filteredByType.length} Transaksi</span>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-2.5">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari deskripsi, kategori, atau toko..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {categories.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Semua Kategori
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 ${
                    selectedCategory === cat
                      ? isIncome ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Transaction Items List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {displayList.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-semibold">Tidak ada transaksi ditemukan pada filter ini.</p>
              <p className="text-xs mt-1">Coba ubah periode atau kata kunci pencarian.</p>
            </div>
          ) : (
            displayList.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl shadow-2xs transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryIcon categoryName={tx.category} type={tx.type} size={20} />
                  <div className="min-w-0">
                    {/* CRITICAL: Detail description must be shown clearly! */}
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                      {tx.description}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Tag size={11} className="text-slate-400" />
                        {tx.category}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={11} className="text-slate-400" />
                        {tx.transaction_date}
                      </span>
                      {tx.merchant && (
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <Store size={11} className="text-slate-400" />
                          {tx.merchant}
                        </span>
                      )}
                      {tx.payment_method && (
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <CreditCard size={11} className="text-slate-400" />
                          {tx.payment_method}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-sm font-extrabold font-mono ${
                      isIncome ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {isIncome ? '+' : '-'}{formatRupiah(tx.amount)}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    {tx.transaction_time || '12:00:00'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Menampilkan {displayList.length} dari {filteredByType.length} transaksi
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
