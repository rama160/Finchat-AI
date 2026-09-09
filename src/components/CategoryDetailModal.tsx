import React, { useState } from 'react';
import { X, Search, Calendar, Tag, Store, CreditCard, ArrowDownCircle } from 'lucide-react';
import { Transaction } from '../types';
import { formatRupiah } from '../services/transactionParser';
import { CategoryIcon } from './CategoryIcon';

interface CategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  transactions: Transaction[];
  periodTitle: string;
}

export const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({
  isOpen,
  onClose,
  categoryName,
  transactions,
  periodTitle,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  // Filter transactions by category and expense type
  const categoryTransactions = transactions.filter(
    (t) => t.category.toLowerCase() === categoryName.toLowerCase() && t.type === 'expense'
  );

  const totalAmount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);

  const filteredList = categoryTransactions.filter((t) => {
    const term = search.toLowerCase();
    return (
      t.description.toLowerCase().includes(term) ||
      (t.merchant && t.merchant.toLowerCase().includes(term)) ||
      (t.payment_method && t.payment_method.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0">
              <CategoryIcon categoryName={categoryName} type="expense" size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Kategori: {categoryName}
              </h2>
              <p className="text-xs text-slate-300">
                Periode: {periodTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Hero Category Total Amount Banner */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              Total Pengeluaran Kategori Ini:
            </span>
            <span className="text-xl font-black font-mono tracking-tight text-rose-600">
              {formatRupiah(totalAmount)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 font-medium block">Total Catatan</span>
            <span className="text-sm font-bold text-slate-800 font-mono">
              {categoryTransactions.length} Transaksi
            </span>
          </div>
        </div>

        {/* Search within Category */}
        <div className="p-3 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Cari dalam kategori ${categoryName}...`}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
        </div>

        {/* Transactions List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {filteredList.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <p className="text-sm font-semibold">Tidak ada transaksi ditemukan.</p>
              <p className="text-xs mt-1">Coba kata kunci pencarian yang lain.</p>
            </div>
          ) : (
            filteredList.map((tx) => (
              <div
                key={tx.id}
                className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <ArrowDownCircle size={16} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 truncate">
                      {tx.description}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[10px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={10} className="text-slate-400" />
                        {tx.transaction_date}
                      </span>
                      {tx.merchant && (
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <Store size={10} className="text-slate-400" />
                          {tx.merchant}
                        </span>
                      )}
                      {tx.payment_method && (
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <CreditCard size={10} className="text-slate-400" />
                          {tx.payment_method}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black font-mono text-rose-600 block">
                    -{formatRupiah(tx.amount)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {tx.transaction_time || '12:00'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Menampilkan {filteredList.length} dari {categoryTransactions.length} transaksi
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
