import React, { useState, useRef, useEffect } from 'react';
import {
  Smile,
  Paperclip,
  Camera,
  Send,
  Mic,
  Plus,
  Receipt,
  Sparkles,
  X
} from 'lucide-react';

interface TelegramChatInputProps {
  inputText: string;
  setInputText: (val: string) => void;
  onSend: (text: string) => void;
  onOpenVoiceModal?: () => void;
  onOpenReceiptModal?: () => void;
  onOpenAddModal?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const TelegramChatInput: React.FC<TelegramChatInputProps> = ({
  inputText,
  setInputText,
  onSend,
  onOpenVoiceModal,
  onOpenReceiptModal,
  onOpenAddModal,
  placeholder = 'Pesan',
  disabled = false,
}) => {
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [isEmojiDrawerOpen, setIsEmojiDrawerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const quickQuestions = [
    'Berapa saldo saya?',
    'Berapa pengeluaran bulan ini?',
    'Kategori apa yang paling banyak?',
    'beli nasi 25rb, es 5rb dan rokok 30rb',
    'beli bensin motor 30rb',
    'beli popok baby 85rb dan minyak 35rb',
    'gaji masuk 5000000'
  ];

  const quickEmojis = [
    '💰', '💵', '💳', '🧾', '🍔', '☕', '🍜', '🛒',
    '⛽', '🚗', '📱', '🏠', '🏥', '✈️', '👔', '🎁',
    '👍', '🙏', '🔥', '✨'
  ];

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || disabled) return;
    onSend(inputText.trim());
    setIsAttachmentOpen(false);
    setIsEmojiDrawerOpen(false);
  };

  const handleActionClick = () => {
    if (inputText.trim()) {
      handleFormSubmit();
    } else if (onOpenReceiptModal) {
      onOpenReceiptModal();
    }
  };

  const insertEmoji = (emoji: string) => {
    setInputText(inputText + emoji);
    inputRef.current?.focus();
  };

  const selectPrompt = (prompt: string) => {
    setInputText(prompt);
    setIsEmojiDrawerOpen(false);
    inputRef.current?.focus();
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.telegram-input-container')) {
        setIsAttachmentOpen(false);
        setIsEmojiDrawerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="telegram-input-container relative w-full">
      {/* Attachment Menu Popup */}
      {isAttachmentOpen && (
        <div className="absolute bottom-full mb-3 left-4 right-4 sm:left-auto sm:right-16 sm:w-72 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-xl border border-slate-200/90 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Lampiran & Aksi Cepat
            </span>
            <button
              type="button"
              onClick={() => setIsAttachmentOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-1">
            {onOpenReceiptModal && (
              <button
                type="button"
                onClick={() => {
                  setIsAttachmentOpen(false);
                  onOpenReceiptModal();
                }}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-sky-50 text-left transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Receipt size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Scan Struk Belanja</div>
                  <div className="text-[10px] text-slate-500">Foto / upload struk (OCR otomatis)</div>
                </div>
              </button>
            )}

            {onOpenVoiceModal && (
              <button
                type="button"
                onClick={() => {
                  setIsAttachmentOpen(false);
                  onOpenVoiceModal();
                }}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-emerald-50 text-left transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Mic size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Perekam Suara (Voice)</div>
                  <div className="text-[10px] text-slate-500">Bicara: "Beli nasi 25rb, es 5rb"</div>
                </div>
              </button>
            )}

            {onOpenAddModal && (
              <button
                type="button"
                onClick={() => {
                  setIsAttachmentOpen(false);
                  onOpenAddModal();
                }}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-purple-50 text-left transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Plus size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Catat Manual</div>
                  <div className="text-[10px] text-slate-500">Form detail transaksi lengkap</div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Emoji & Quick Prompt Drawer */}
      {isEmojiDrawerOpen && (
        <div className="absolute bottom-full mb-3 left-2 right-2 sm:left-4 sm:right-16 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-slate-200/90 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 max-h-72 overflow-y-auto">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-500" />
              Ide Pertanyaan & Emoji
            </span>
            <button
              type="button"
              onClick={() => setIsEmojiDrawerOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
            >
              <X size={14} />
            </button>
          </div>

          {/* Quick Questions */}
          <div className="mb-3">
            <span className="text-[10px] font-semibold text-slate-400 block mb-1.5 uppercase">
              Pertanyaan Cepat
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectPrompt(q)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-full text-[11px] font-medium transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Emojis */}
          <div>
            <span className="text-[10px] font-semibold text-slate-400 block mb-1.5 uppercase">
              Emoji Finansial
            </span>
            <div className="grid grid-cols-10 gap-1 text-center text-lg">
              {quickEmojis.map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-transform active:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Telegram-style Input Row */}
      <div className="flex items-center gap-2 px-2.5 py-2 sm:px-3 sm:py-2.5 w-full">
        {/* White Rounded Capsule */}
        <div className="flex-1 flex items-center bg-white rounded-full px-3 py-1 sm:py-1.5 shadow-sm border border-slate-200/90 transition-all focus-within:ring-2 focus-within:ring-[#24A1DE]/40 focus-within:border-[#24A1DE]">
          {/* Left Smile Emoji Button */}
          <button
            type="button"
            onClick={() => {
              setIsEmojiDrawerOpen(!isEmojiDrawerOpen);
              setIsAttachmentOpen(false);
            }}
            className={`p-1.5 rounded-full transition-colors shrink-0 ${
              isEmojiDrawerOpen
                ? 'text-[#24A1DE] bg-sky-50'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Emoji & Ide Pertanyaan"
            aria-label="Pilih Emoji"
          >
            <Smile size={22} strokeWidth={2} />
          </button>

          {/* Text Input with "Pesan" placeholder */}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleFormSubmit();
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 bg-transparent border-none outline-none px-2.5 py-1 text-[15px] sm:text-base text-slate-800 placeholder:text-slate-400 caret-[#24A1DE] min-w-0"
          />

          {/* Right Paperclip Attachment Button */}
          <button
            type="button"
            onClick={() => {
              setIsAttachmentOpen(!isAttachmentOpen);
              setIsEmojiDrawerOpen(false);
            }}
            className={`p-1.5 rounded-full transition-colors shrink-0 ${
              isAttachmentOpen
                ? 'text-[#24A1DE] bg-sky-50'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Lampiran (Struk, Suara, Manual)"
            aria-label="Lampiran"
          >
            <Paperclip size={21} strokeWidth={2} className="-rotate-45" />
          </button>
        </div>

        {/* Right Circular Telegram Blue Button (#24A1DE) */}
        <button
          type="button"
          onClick={handleActionClick}
          disabled={disabled}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#24A1DE] hover:bg-[#1f93cd] active:scale-95 text-white flex items-center justify-center shadow-md shadow-sky-500/20 transition-all duration-200 shrink-0"
          title={inputText.trim() ? 'Kirim Pesan' : 'Scan Struk / Foto Kamera'}
          aria-label={inputText.trim() ? 'Kirim' : 'Scan Struk'}
        >
          {inputText.trim() ? (
            <Send size={19} strokeWidth={2.2} className="translate-x-0.5" />
          ) : (
            <Camera size={21} strokeWidth={2.2} />
          )}
        </button>
      </div>
    </div>
  );
};
