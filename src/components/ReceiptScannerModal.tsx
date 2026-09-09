import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  FileSpreadsheet,
  Edit2
} from 'lucide-react';
import { ReceiptItem, ReceiptScanResult, Transaction } from '../types';
import { receiptOcrService, SAMPLE_RECEIPTS } from '../services/receiptOcrService';
import { EXPENSE_CATEGORIES } from '../data/categories';
import { formatRupiah } from '../services/transactionParser';
import { CategoryIcon } from './CategoryIcon';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTransactions: (transactions: Partial<Transaction>[]) => void;
}

type ScanStep = 'capture' | 'review';

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  onSaveTransactions,
}) => {
  const [step, setStep] = useState<ScanStep>('capture');
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ReceiptScanResult | null>(null);

  // Split mode: 'separate' (individual items) vs 'grand_total' (1 single merged transaction)
  const [saveMode, setSaveMode] = useState<'separate' | 'grand_total'>('separate');

  // Camera stream state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Edit states for review table
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [merchantName, setMerchantName] = useState('');
  const [receiptDate, setReceiptDate] = useState('');

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      console.warn('Camera error or blocked in iframe:', e);
      setIsCameraActive(false);
      alert('Kamera tidak dapat diakses atau diblokir pada browser/iframe. Anda dapat menggunakan tombol Upload Foto atau Pilih Contoh Struk di bawah.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      stopCamera();
      processReceipt(dataUrl, 'foto_kamera_struk.jpg');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      processReceipt(dataUrl, file.name);
    };
    reader.readAsDataURL(file);
  };

  const processReceipt = async (dataUrl: string, fileName?: string) => {
    setImagePreview(dataUrl);
    setIsProcessing(true);

    try {
      const result = await receiptOcrService.processReceiptImage(dataUrl, fileName);
      setScanResult(result);
      setMerchantName(result.merchant);
      setReceiptDate(result.date);
      setItems(result.items);
      setStep('review');
    } catch (e) {
      console.error('OCR processing error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // 1-Click Load Sample Receipt (especially TEST 4: Baju 100k, Celana 200k, Sepatu 300k)
  const handleLoadSample = (sampleId: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      const result = receiptOcrService.loadSampleReceipt(sampleId);
      setScanResult(result);
      setMerchantName(result.merchant);
      setReceiptDate(result.date);
      setItems(result.items);
      setImagePreview(null);
      setIsProcessing(false);
      setStep('review');
    }, 300);
  };

  const handleRetake = () => {
    stopCamera();
    setImagePreview(null);
    setScanResult(null);
    setItems([]);
    setStep('capture');
  };

  // Item editing actions
  const toggleItemSelection = (id: string) => {
    setItems(prev =>
      prev.map(it => (it.id === id ? { ...it, selected: !it.selected } : it))
    );
  };

  const updateItem = (id: string, field: keyof ReceiptItem, val: any) => {
    setItems(prev =>
      prev.map(it => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const addItem = () => {
    const newItem: ReceiptItem = {
      id: `item_${Date.now()}`,
      description: 'Item Baru',
      category: 'Belanja',
      amount: 10000,
      selected: true
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleSave = () => {
    const selectedItems = items.filter(it => it.selected && it.amount > 0);
    if (selectedItems.length === 0) {
      alert('Pilih setidaknya 1 item untuk disimpan.');
      return;
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    if (saveMode === 'separate') {
      // Option A: Save each item as a separate distinct transaction (Requirement #9)
      const transactionsToSave: Partial<Transaction>[] = selectedItems.map(item => ({
        type: 'expense',
        description: item.description, // Crucial: detail asli, not category name!
        category: item.category,
        amount: item.amount,
        merchant: merchantName,
        payment_method: 'Tunai',
        transaction_date: receiptDate || now.toISOString().split('T')[0],
        transaction_time: timeStr,
        source: 'receipt',
        notes: `Dari struk: ${merchantName}`
      }));

      onSaveTransactions(transactionsToSave);
    } else {
      // Option B: Save as single merged grand total transaction
      const totalAmount = selectedItems.reduce((sum, it) => sum + it.amount, 0);
      const summaryDesc = `${merchantName || 'Belanja'}: ${selectedItems.map(i => i.description).slice(0, 3).join(', ')}${selectedItems.length > 3 ? '...' : ''}`;

      const singleTx: Partial<Transaction> = {
        type: 'expense',
        description: summaryDesc,
        category: selectedItems[0]?.category || 'Belanja',
        amount: totalAmount,
        merchant: merchantName,
        payment_method: 'Tunai',
        transaction_date: receiptDate || now.toISOString().split('T')[0],
        transaction_time: timeStr,
        source: 'receipt',
        notes: `Total dari ${selectedItems.length} item struk ${merchantName}`
      };

      onSaveTransactions([singleTx]);
    }

    handleClose();
  };

  const handleClose = () => {
    stopCamera();
    setStep('capture');
    setImagePreview(null);
    setScanResult(null);
    setItems([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
              <Camera size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {step === 'capture' ? 'Scan & Ekstrak Struk' : 'Review & Edit Hasil Struk'}
              </h2>
              <p className="text-xs text-slate-500">
                {step === 'capture' 
                  ? 'Ambil foto kamera atau upload gambar struk belanja' 
                  : 'Sistem dapat memisahkan setiap item atau menyimpan sebagai 1 transaksi'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {step === 'capture' ? (
            <div className="space-y-5">
              {/* Camera Preview or Action Box */}
              {isCameraActive ? (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border border-slate-800 shadow-inner">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-6 py-3 rounded-full bg-white text-slate-900 font-bold shadow-lg flex items-center gap-2 hover:bg-slate-100 active:scale-95 transition-all"
                    >
                      <Camera size={18} /> Ambil Foto
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="p-3 rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Camera Button */}
                  <button
                    type="button"
                    onClick={startCamera}
                    className="p-6 border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-700 hover:text-emerald-700 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-700 flex items-center justify-center transition-colors">
                      <Camera size={24} />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-bold block">Gunakan Kamera</span>
                      <span className="text-xs text-slate-400">Ambil foto struk langsung</span>
                    </div>
                  </button>

                  {/* Upload Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-700 hover:text-blue-700 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-700 flex items-center justify-center transition-colors">
                      <Upload size={24} />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-bold block">Upload Gambar Struk</span>
                      <span className="text-xs text-slate-400">Dari galeri perangkat (JPG, PNG)</span>
                    </div>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}

              {/* Sample Struk Selector (Testing Wajib: TEST 4 & 5) */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-slate-700 text-xs font-bold mb-3">
                  <Sparkles size={15} className="text-blue-600" />
                  Uji Coba Cepat Struk (Contoh Preset Realistis):
                </div>
                <div className="space-y-2">
                  {SAMPLE_RECEIPTS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleLoadSample(s.id)}
                      className="w-full p-3 bg-white border border-slate-200 hover:border-blue-400 rounded-xl text-left flex items-center justify-between hover:shadow-2xs transition-all group"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-800 block group-hover:text-blue-600">
                          {s.id === 'receipt_clothing' ? '⭐ TEST 4: ' : ''}{s.name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {s.items.map(i => `${i.description} (${formatRupiah(i.amount)})`).join(' • ')}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-blue-600 shrink-0 ml-3 bg-blue-50 px-2.5 py-1 rounded-lg">
                        Pilih Struk
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {isProcessing && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center gap-3 text-blue-700 text-sm font-semibold animate-pulse">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Sedang memindai dan mengekstrak item struk...
                </div>
              )}
            </div>
          ) : (
            // REVIEW STEP
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Merchant & Date Summary Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                    Nama Toko / Merchant:
                  </label>
                  <input
                    type="text"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                    Tanggal Struk:
                  </label>
                  <input
                    type="date"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Crucial Requirement: Toggle Option Save Mode */}
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl">
                <span className="block text-xs font-bold text-blue-900 mb-2">
                  Metode Penyimpanan Transaksi:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSaveMode('separate')}
                    className={`p-2.5 text-left rounded-xl border text-xs transition-all flex items-start gap-2.5 ${
                      saveMode === 'separate'
                        ? 'bg-white border-blue-600 text-blue-900 shadow-xs font-semibold'
                        : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <Layers size={16} className="mt-0.5 text-blue-600 shrink-0" />
                    <div>
                      <span className="block font-bold">Pisahkan Item (Disarankan)</span>
                      <span className="text-[11px] text-slate-500">
                        Setiap barang disimpan sebagai transaksi mandiri ({items.filter(i => i.selected).length} transaksi).
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSaveMode('grand_total')}
                    className={`p-2.5 text-left rounded-xl border text-xs transition-all flex items-start gap-2.5 ${
                      saveMode === 'grand_total'
                        ? 'bg-white border-blue-600 text-blue-900 shadow-xs font-semibold'
                        : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <FileSpreadsheet size={16} className="mt-0.5 text-blue-600 shrink-0" />
                    <div>
                      <span className="block font-bold">1 Transaksi Grand Total</span>
                      <span className="text-[11px] text-slate-500">
                        Total {formatRupiah(items.filter(i => i.selected).reduce((s, it) => s + it.amount, 0))} disimpan sebagai 1 transaksi belanja.
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Items Table / List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Daftar Item Hasil Ekstraksi Struk ({items.length} item):
                  </span>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
                  >
                    <Plus size={14} /> Tambah Item
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        item.selected
                          ? 'bg-white border-slate-200 shadow-2xs'
                          : 'bg-slate-50/70 border-slate-200 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => toggleItemSelection(item.id)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 shrink-0 cursor-pointer"
                      />

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                        {/* Description field */}
                        <div className="sm:col-span-1">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            className="w-full px-2 py-1 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Nama barang..."
                          />
                        </div>

                        {/* Category Dropdown */}
                        <div>
                          <select
                            value={item.category}
                            onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                            className="w-full px-2 py-1 text-xs text-slate-700 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                          >
                            {EXPENSE_CATEGORIES.map((c) => (
                              <option key={`expense-${c.name}`} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Amount */}
                        <div>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                              Rp
                            </span>
                            <input
                              type="number"
                              value={item.amount}
                              onChange={(e) => updateItem(item.id, 'amount', parseInt(e.target.value, 10) || 0)}
                              className="w-full pl-7 pr-2 py-1 text-xs font-mono font-bold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Grand Total Summary */}
                <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Grand Total Terpilih:</span>
                  <span className="text-sm text-blue-700 font-mono">
                    {formatRupiah(items.filter(i => i.selected).reduce((sum, i) => sum + i.amount, 0))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {step === 'review' ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/60 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw size={14} /> Scan Ulang
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200 active:scale-98 flex items-center gap-1.5 transition-all"
              >
                <Check size={16} />
                {saveMode === 'separate'
                  ? `Simpan ${items.filter(i => i.selected).length} Transaksi Terpisah`
                  : 'Simpan 1 Transaksi Grand Total'}
              </button>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/60 transition-colors"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
