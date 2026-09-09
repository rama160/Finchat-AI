import React, { useState, useEffect } from 'react';
import { X, Check, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/categories';
import { detectCategory, formatRupiah } from '../services/transactionParser';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Partial<Transaction>) => void;
  initialData?: Transaction | null;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Makanan');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setDescription(initialData.description);
      setCategory(initialData.category);
      setAmount(initialData.amount.toString());
      setPaymentMethod(initialData.payment_method || 'Tunai');
      setMerchant(initialData.merchant || '');
      setNotes(initialData.notes || '');
      setDate(initialData.transaction_date);
      setTime(initialData.transaction_time);
    } else {
      const now = new Date();
      setType('expense');
      setDescription('');
      setCategory('Makanan');
      setAmount('');
      setPaymentMethod('Tunai');
      setMerchant('');
      setNotes('');
      setDate(now.toISOString().split('T')[0]);
      setTime(now.toTimeString().split(' ')[0]);
    }
    setError('');
  }, [initialData, isOpen]);

  // Auto-detect category when user types description in new transaction mode
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDescription(val);
    if (!initialData && val.length > 2) {
      const detected = detectCategory(val, type);
      if (detected) setCategory(detected);
    }
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === 'expense' ? 'Makanan' : 'Gaji');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Deskripsi transaksi wajib diisi.');
      return;
    }

    const numAmount = parseInt(amount.replace(/\D/g, ''), 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Nominal harus lebih dari 0.');
      return;
    }

    onSave({
      ...(initialData ? { id: initialData.id } : {}),
      type,
      description: description.trim(),
      category,
      amount: numAmount,
      payment_method: paymentMethod,
      merchant: merchant.trim(),
      notes: notes.trim(),
      transaction_date: date || new Date().toISOString().split('T')[0],
      transaction_time: time || '12:00:00',
      source: initialData ? initialData.source : 'manual',
    });

    onClose();
  };

  if (!isOpen) return null;

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {initialData ? 'Edit Transaksi' : 'Tambah Transaksi'}
            </h2>
            <p className="text-xs text-slate-500">
              {initialData ? 'Ubah data transaksi yang tersimpan' : 'Catat transaksi keuangan secara detail'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Type Toggle: Expense / Income */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownCircle size={16} />
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpCircle size={16} />
              Pemasukan
            </button>
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nominal (Rupiah) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                Rp
              </span>
              <input
                type="text"
                value={amount ? new Intl.NumberFormat('id-ID').format(parseInt(amount.replace(/\D/g, '') || '0', 10)) : ''}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                className="w-full pl-10 pr-4 py-2.5 text-lg font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                required
              />
            </div>
          </div>

          {/* Description Field (Crucial: Detail, not category name!) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Deskripsi Transaksi * <span className="text-slate-400 font-normal">(Detail asli barang/kegiatan)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Contoh: Beli baju kemeja, Beli cabe 1kg, Beli popok baby..."
              className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              *Deskripsi menyimpan nama detail barang sebenarnya, bukan nama kategori.
            </p>
          </div>

          {/* Category Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {categories.map((c, idx) => (
                  <option key={`${c.type}-${c.name}-${idx}`} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Tunai">Tunai (Cash)</option>
                <option value="Transfer">Transfer Bank</option>
                <option value="QRIS">QRIS</option>
                <option value="Debit">Kartu Debit</option>
                <option value="Kredit">Kartu Kredit</option>
                <option value="E-Wallet">E-Wallet (GoPay, OVO, ShopeePay)</option>
              </select>
            </div>
          </div>

          {/* Merchant & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Merchant / Toko <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="Contoh: Alfamart, Toko Busana..."
                className="w-full px-3.5 py-2 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tanggal Transaksi
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Catatan Tambahan <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan kecil tentang transaksi ini..."
              rows={2}
              className="w-full px-3.5 py-2 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-xl shadow-sm shadow-emerald-200 transition-all flex items-center gap-2"
            >
              <Check size={16} />
              {initialData ? 'Simpan Perubahan' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
