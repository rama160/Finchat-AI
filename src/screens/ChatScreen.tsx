import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  User,
  RotateCcw,
  Check,
  CheckCheck,
} from 'lucide-react';
import { ChatMessage, Transaction } from '../types';
import { aiService } from '../services/aiService';
import { formatRupiah } from '../services/transactionParser';
import { CategoryIcon } from '../components/CategoryIcon';
import { TelegramChatInput } from '../components/TelegramChatInput';

interface ChatScreenProps {
  messages: ChatMessage[];
  onSendMessage: (msg: ChatMessage) => void;
  onSaveSuggestedTransactions: (txs: Partial<Transaction>[], messageId: string) => void;
  onClearChat: () => void;
  onOpenVoiceModal: () => void;
  onOpenReceiptModal?: () => void;
  onOpenAddModal?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  messages,
  onSendMessage,
  onSaveSuggestedTransactions,
  onClearChat,
  onOpenVoiceModal,
  onOpenReceiptModal,
  onOpenAddModal,
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    setInputText('');

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };

    onSendMessage(userMessage);
    setIsTyping(true);

    try {
      const aiReply = await aiService.processUserMessage(text);
      onSendMessage(aiReply);
    } catch (err) {
      onSendMessage({
        id: `msg_err_${Date.now()}`,
        sender: 'ai',
        text: 'Maaf, terjadi gangguan saat memproses pesan Anda. Silakan coba lagi.',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] min-h-[500px] bg-[#dbe8de] relative overflow-hidden">
      {/* Telegram Chat Wallpaper Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `radial-gradient(#8fae96 1.2px, transparent 1.2px), radial-gradient(#8fae96 1.2px, #dbe8de 1.2px)`,
          backgroundSize: '28px 28px',
          backgroundPosition: '0 0, 14px 14px'
        }}
      />

      {/* Chat Subheader */}
      <div className="relative z-10 px-4 py-2.5 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Bot size={18} />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1">
              Finchat AI Assistant
            </h2>
            <p className="text-[10px] text-emerald-600 font-medium">online • pencatat keuangan</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm('Bersihkan seluruh riwayat obrolan AI?')) {
              onClearChat();
            }
          }}
          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          title="Reset Obrolan"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="relative z-10 flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5">
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';
          return (
            <div
              key={msg.id}
              className={`flex items-end gap-1.5 ${isAi ? 'justify-start' : 'justify-end'}`}
            >
              {isAi && (
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mb-1 shadow-2xs">
                  <Bot size={13} />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed space-y-2 shadow-sm ${
                  isAi
                    ? 'bg-white text-slate-800 rounded-bl-xs border border-slate-100'
                    : 'bg-[#EFFDDE] text-slate-900 rounded-br-xs border border-[#D7ECC0]'
                }`}
              >
                {/* Main Message Text */}
                <div className="whitespace-pre-line font-medium text-[13px] text-slate-800">
                  {msg.text}
                </div>

                {/* Suggested Transactions Cards in AI bubble */}
                {isAi && msg.suggested_transactions && msg.suggested_transactions.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="space-y-1.5">
                      {msg.suggested_transactions.map((st, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <CategoryIcon categoryName={st.category || 'Lainnya'} size={14} />
                            <div className="min-w-0">
                              <span className="font-bold text-slate-800 block truncate text-xs">
                                {st.description}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {st.category} • {st.payment_method || 'Tunai'}
                              </span>
                            </div>
                          </div>
                          <span className="font-bold text-rose-600 font-mono text-xs shrink-0">
                            {formatRupiah(st.amount || 0)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {msg.is_saved ? (
                      <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl text-center font-bold text-[11px] flex items-center justify-center gap-1">
                        <CheckCheck size={14} /> Transaksi Sudah Disimpan
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          onSaveSuggestedTransactions(msg.suggested_transactions!, msg.id)
                        }
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98"
                      >
                        <Check size={15} /> Simpan {msg.suggested_transactions.length} Transaksi ke Database
                      </button>
                    )}
                  </div>
                )}

                <span
                  className="block text-[9px] text-right font-mono text-slate-400 mt-1"
                >
                  {new Date(msg.timestamp).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              {!isAi && (
                <div className="w-6 h-6 rounded-full bg-[#24A1DE] text-white flex items-center justify-center shrink-0 mb-1 shadow-2xs">
                  <User size={13} />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-500 italic">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Bot size={13} />
            </div>
            <div className="bg-white px-3 py-2 rounded-2xl rounded-bl-xs border border-slate-100 shadow-2xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Telegram-style Input Bar Docked at the Bottom */}
      <div className="relative z-20 w-full bg-gradient-to-t from-[#dbe8de] via-[#dbe8de]/90 to-transparent pt-2 pb-1 sm:pb-2">
        <TelegramChatInput
          inputText={inputText}
          setInputText={setInputText}
          onSend={(text) => handleSend(text)}
          onOpenVoiceModal={onOpenVoiceModal}
          onOpenReceiptModal={onOpenReceiptModal}
          onOpenAddModal={onOpenAddModal}
          placeholder="Pesan"
          disabled={isTyping}
        />
      </div>
    </div>
  );
};
