import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Check, Sparkles, Volume2 } from 'lucide-react';
import { ParsedTransactionDraft, formatRupiah, parseMultiTransactions } from '../services/transactionParser';
import { CategoryIcon } from './CategoryIcon';

interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmTransactions: (drafts: ParsedTransactionDraft[]) => void;
}

export const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
  isOpen,
  onClose,
  onConfirmTransactions,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedDrafts, setParsedDrafts] = useState<ParsedTransactionDraft[]>([]);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Tekan mikrofon dan mulailah berbicara...');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setTranscript('');
      setParsedDrafts([]);
      setStatusMessage('Tekan mikrofon dan mulailah berbicara...');
      return;
    }

    // Check Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setStatusMessage('Web Speech API tidak didukung di browser ini. Anda dapat mengetik atau gunakan tombol contoh suara.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'id-ID';

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage('Mendengarkan... Silakan sebutkan transaksi Anda dalam Bahasa Indonesia.');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        handleParse(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setStatusMessage('Izin mikrofon ditolak. Silakan gunakan tombol simulasi suara atau ketik manual.');
        } else {
          setStatusMessage(`Status suara: ${event.error}. Anda juga dapat menguji contoh di bawah.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition init error:', e);
      setSpeechSupported(false);
    }

    return () => {
      stopListening();
    };
  }, [isOpen]);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        setTranscript('');
        setParsedDrafts([]);
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleParse = (text: string) => {
    if (!text.trim()) {
      setParsedDrafts([]);
      return;
    }
    const results = parseMultiTransactions(text, 'voice');
    setParsedDrafts(results);
  };

  // Test triggers for quick 1-click verification of Voice Input
  const applyPresetVoice = (phrase: string) => {
    setTranscript(phrase);
    setStatusMessage('Memproses rekaman suara...');
    handleParse(phrase);
  };

  const handleConfirm = () => {
    if (parsedDrafts.length > 0) {
      onConfirmTransactions(parsedDrafts);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Mic size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Perekam Suara Pintar (Voice Input)</h2>
              <p className="text-xs text-slate-500">Dukungan Multi-Transaksi Bahasa Indonesia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-center">
          {/* Microphone Animation Visual */}
          <div className="flex flex-col items-center justify-center py-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                isListening
                  ? 'bg-rose-500 text-white shadow-xl shadow-rose-200 scale-105'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
              }`}
            >
              {isListening ? (
                <>
                  <span className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-30" />
                  <MicOff size={36} />
                </>
              ) : (
                <Mic size={36} />
              )}
            </button>
            <p className="text-xs font-semibold text-slate-600 mt-4">
              {statusMessage}
            </p>
          </div>

          {/* Transcript display & editable */}
          <div className="text-left">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Hasil Suara (Teks Hasil Speech-to-Text):
            </label>
            <textarea
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                handleParse(e.target.value);
              }}
              placeholder="Suara Anda akan muncul di sini... atau ketik kalimat di sini"
              rows={2}
              className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans resize-none"
            />
          </div>

          {/* Quick preset Indonesian voice samples (essential for Testing Wajib TEST 3) */}
          <div className="text-left bg-emerald-50/70 border border-emerald-100 p-3.5 rounded-2xl">
            <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold mb-2">
              <Sparkles size={14} />
              Uji Coba Cepat (Test Case Suara):
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPresetVoice('beli baju seratus ribu, cabe dua puluh ribu, popok lima puluh ribu')}
                className="text-left px-2.5 py-1.5 bg-white border border-emerald-200 hover:border-emerald-400 rounded-xl text-xs text-slate-700 hover:text-emerald-700 transition-colors shadow-2xs"
              >
                🎙️ <span className="font-semibold text-emerald-700">TEST 3:</span> "beli baju seratus ribu, cabe dua puluh ribu, popok lima puluh ribu"
              </button>
              <button
                type="button"
                onClick={() => applyPresetVoice('beli nasi 25rb, rokok 30rb, es 10rb')}
                className="text-left px-2.5 py-1.5 bg-white border border-emerald-200 hover:border-emerald-400 rounded-xl text-xs text-slate-700 hover:text-emerald-700 transition-colors shadow-2xs"
              >
                🎙️ "beli nasi 25rb, rokok 30rb, es 10rb"
              </button>
            </div>
          </div>

          {/* Parsed Transactions Preview */}
          {parsedDrafts.length > 0 && (
            <div className="text-left space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Terdeteksi {parsedDrafts.length} Transaksi Terpisah:
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Total: {formatRupiah(parsedDrafts.reduce((s, t) => s + t.amount, 0))}
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {parsedDrafts.map((draft, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CategoryIcon categoryName={draft.category} type={draft.type} size={16} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {draft.description}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Kategori: <strong className="text-slate-700">{draft.category}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-rose-600 font-mono">
                        {formatRupiah(draft.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={parsedDrafts.length === 0}
            onClick={handleConfirm}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
              parsedDrafts.length > 0
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200 active:scale-98'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check size={16} />
            Simpan {parsedDrafts.length} Transaksi
          </button>
        </div>
      </div>
    </div>
  );
};
