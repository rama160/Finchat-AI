import React, { useState, useEffect } from 'react';
import {
  FileText,
  MessageSquare,
  BarChart3,
  Settings as SettingsIcon,
  Wifi,
  WifiOff,
  CloudUpload,
  Sparkles,
  Bot
} from 'lucide-react';
import { Transaction, ChatMessage, AppSettings } from './types';
import { databaseHelper } from './services/databaseHelper';
import { sheetsService } from './services/sheetsService';
import { TransactionsScreen } from './screens/TransactionsScreen';
import { ChatScreen } from './screens/ChatScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { VoiceInputModal } from './components/VoiceInputModal';
import { ReceiptScannerModal } from './components/ReceiptScannerModal';
import { TransactionFormModal } from './components/TransactionFormModal';
import { InstallApkModal } from './components/InstallApkModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ParsedTransactionDraft, createTransactionObject } from './services/transactionParser';

type NavTab = 'transactions' | 'chat' | 'reports' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    google_sheets_url: '',
    auto_sync: true,
    last_sync_time: null,
    is_connected: false,
    currency: 'IDR',
  });
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Modals state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Sync animation/status
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize and load data on startup
  useEffect(() => {
    // Online/offline listeners
    const handleOnline = () => {
      setIsOnline(true);
      // If auto-sync is enabled, trigger background sync
      const currentSettings = databaseHelper.getSettings();
      if (currentSettings.auto_sync && currentSettings.google_sheets_url) {
        sheetsService.syncPendingTransactions().then(() => loadData());
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadData = () => {
    let txs = databaseHelper.getTransactions();

    // Initial seed for authentic first-load experience if empty
    if (txs.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      const initialSeed: Transaction[] = [
        {
          id: `tx_seed_1`,
          type: 'income',
          description: 'Gaji Bulanan',
          category: 'Gaji',
          amount: 8500000,
          payment_method: 'Transfer',
          merchant: 'Kantor / Perusahaan',
          transaction_date: today,
          transaction_time: '09:00:00',
          source: 'manual',
          sync_status: 'synced',
          created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: `tx_seed_2`,
          type: 'expense',
          description: 'Beli baju kemeja kerja',
          category: 'Pakaian',
          amount: 150000,
          payment_method: 'QRIS',
          merchant: 'Matahari Mall',
          transaction_date: today,
          transaction_time: '12:30:00',
          source: 'text',
          sync_status: 'synced',
          created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: `tx_seed_3`,
          type: 'expense',
          description: 'Beli cabe dan bumbu dapur',
          category: 'Kebutuhan Dapur',
          amount: 25000,
          payment_method: 'Tunai',
          merchant: 'Pasar Tradisional',
          transaction_date: today,
          transaction_time: '07:15:00',
          source: 'voice',
          sync_status: 'synced',
          created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: `tx_seed_4`,
          type: 'expense',
          description: 'Beli popok bayi M50',
          category: 'Perlengkapan Bayi',
          amount: 89000,
          payment_method: 'Debit',
          merchant: 'Alfamart',
          transaction_date: today,
          transaction_time: '14:20:00',
          source: 'receipt',
          sync_status: 'synced',
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      databaseHelper.saveTransactions(initialSeed);
      txs = initialSeed;
    }

    setTransactions(txs);
    setChatMessages(databaseHelper.getChatHistory());
    setSettings(databaseHelper.getSettings());
  };

  // Add a single transaction
  const handleAddTransaction = async (txData: Partial<Transaction>) => {
    let newTx: Transaction;
    if (txData.id) {
      // Editing existing
      newTx = databaseHelper.saveTransaction(txData as Transaction);
    } else {
      newTx = createTransactionObject({
        type: txData.type || 'expense',
        description: txData.description || 'Transaksi Baru',
        category: txData.category || 'Lainnya',
        amount: txData.amount || 0,
        merchant: txData.merchant,
        payment_method: txData.payment_method || 'Tunai',
        source: txData.source || 'manual',
        notes: txData.notes,
        date: txData.transaction_date,
        time: txData.transaction_time,
      });
      databaseHelper.saveTransaction(newTx);
    }

    loadData();

    // Auto sync if enabled
    if (settings.auto_sync && settings.google_sheets_url && isOnline) {
      sheetsService.syncPendingTransactions().then(() => loadData());
    }
  };

  // Add multiple transactions (e.g. from Multi-Transaction parser or Receipt scanner)
  const handleAddMultipleTransactions = async (txsData: Partial<Transaction>[]) => {
    const createdList: Transaction[] = [];

    for (const data of txsData) {
      const newTx = createTransactionObject({
        type: data.type || 'expense',
        description: data.description || 'Transaksi',
        category: data.category || 'Lainnya',
        amount: data.amount || 0,
        merchant: data.merchant,
        payment_method: data.payment_method || 'Tunai',
        source: data.source || 'text',
        notes: data.notes,
        date: data.transaction_date,
        time: data.transaction_time,
      });
      databaseHelper.saveTransaction(newTx);
      createdList.push(newTx);
    }

    loadData();

    // Auto sync if enabled
    if (settings.auto_sync && settings.google_sheets_url && isOnline) {
      sheetsService.syncPendingTransactions().then(() => loadData());
    }
  };

  // Voice confirmation handler
  const handleVoiceConfirm = (drafts: ParsedTransactionDraft[]) => {
    const txsToCreate = drafts.map((d) => createTransactionObject(d));
    handleAddMultipleTransactions(txsToCreate);
  };

  // Edit transaction trigger
  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsFormModalOpen(true);
  };

  // Delete transaction handler (adds tombstone)
  const handleDeleteTransaction = (id: string) => {
    databaseHelper.deleteTransaction(id);
    loadData();

    // Trigger sync for deletion tombstone
    if (settings.auto_sync && settings.google_sheets_url && isOnline) {
      sheetsService.syncPendingTransactions().then(() => loadData());
    }
  };

  // Chat handlers
  const handleSendMessage = (msg: ChatMessage) => {
    const updated = [...chatMessages, msg];
    setChatMessages(updated);
    databaseHelper.saveChatHistory(updated);
  };

  const handleSaveSuggestedTransactions = (
    txs: Partial<Transaction>[],
    messageId: string
  ) => {
    handleAddMultipleTransactions(txs);
    databaseHelper.markSuggestedTransactionsSaved(messageId);
    setChatMessages(databaseHelper.getChatHistory());
  };

  const handleClearChat = () => {
    databaseHelper.saveChatHistory([]);
    setChatMessages([]);
  };

  // Settings update
  const handleUpdateSettings = (updated: Partial<AppSettings>) => {
    const nextSettings = databaseHelper.saveSettings(updated);
    setSettings(nextSettings);
  };

  // Trigger quick manual sync from top bar
  const handleTopBarSync = async () => {
    if (!settings.google_sheets_url) {
      setActiveTab('settings');
      return;
    }
    setIsSyncing(true);
    await sheetsService.syncPendingTransactions();
    setIsSyncing(false);
    loadData();
  };

  const pendingCount = transactions.filter((t) => t.sync_status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-800 font-sans flex justify-center selection:bg-emerald-100 selection:text-emerald-900">
      {/* Mobile-proportioned container on desktop (Flutter app structure) */}
      <div className="w-full max-w-lg min-h-screen bg-white flex flex-col shadow-2xl relative border-x border-slate-200">
        {/* Top App Bar */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs shadow-emerald-200">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                Finchat AI
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-md">
                  v2.0
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">
                Pencatat Keuangan Cerdas & Google Sheets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* PWA / APK Install Button */}
            <PWAInstallButton onOpenModal={() => setIsInstallModalOpen(true)} />

            {/* Sync Status Button / Indicator */}
            {settings.google_sheets_url ? (
              <button
                type="button"
                onClick={handleTopBarSync}
                className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold border transition-all ${
                  pendingCount > 0
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
                title={
                  pendingCount > 0
                    ? `${pendingCount} transaksi belum tersinkron`
                    : 'Semua transaksi tersinkronisasi'
                }
              >
                <CloudUpload
                  size={13}
                  className={isSyncing ? 'animate-bounce text-emerald-600' : ''}
                />
                <span>{pendingCount > 0 ? `${pendingCount} Pending` : 'Synced'}</span>
              </button>
            ) : null}

            {/* Online / Offline status badge */}
            <div
              className={`p-1.5 rounded-full border ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}
              title={isOnline ? 'Terhubung ke Internet' : 'Mode Offline (Data tersimpan di perangkat)'}
            >
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className={`flex-1 ${activeTab === 'chat' ? 'p-0 overflow-hidden flex flex-col' : 'p-4 overflow-y-auto'}`}>
          {activeTab === 'transactions' && (
            <TransactionsScreen
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
              onAddMultipleTransactions={handleAddMultipleTransactions}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              onOpenReceiptModal={() => setIsReceiptModalOpen(true)}
              onOpenAddModal={() => {
                setEditingTransaction(null);
                setIsFormModalOpen(true);
              }}
              onNavigateToChat={(initialMessage) => {
                setActiveTab('chat');
                if (initialMessage) {
                  handleSendMessage(initialMessage);
                }
              }}
              isOnline={isOnline}
            />
          )}

          {activeTab === 'chat' && (
            <ChatScreen
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              onSaveSuggestedTransactions={handleSaveSuggestedTransactions}
              onClearChat={handleClearChat}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              onOpenReceiptModal={() => setIsReceiptModalOpen(true)}
              onOpenAddModal={() => {
                setEditingTransaction(null);
                setIsFormModalOpen(true);
              }}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsScreen transactions={transactions} />
          )}

          {activeTab === 'settings' && (
            <SettingsScreen
              settings={settings}
              transactions={transactions}
              onUpdateSettings={handleUpdateSettings}
              onRefreshData={loadData}
              onRunTest={(num) => {}}
              onOpenInstallModal={() => setIsInstallModalOpen(true)}
            />
          )}
        </main>

        {/* Flutter-style Bottom Navigation Bar */}
        <nav className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-lg bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 z-40 shadow-lg flex items-center justify-around">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'transactions'
                ? 'text-emerald-700 font-bold bg-emerald-50/80 scale-105'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <FileText size={20} strokeWidth={activeTab === 'transactions' ? 2.5 : 2} />
            <span className="text-[10px] mt-0.5">Transaksi</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'chat'
                ? 'text-emerald-700 font-bold bg-emerald-50/80 scale-105'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <Bot size={20} strokeWidth={activeTab === 'chat' ? 2.5 : 2} />
            <span className="text-[10px] mt-0.5">Chat AI</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'reports'
                ? 'text-emerald-700 font-bold bg-emerald-50/80 scale-105'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <BarChart3 size={20} strokeWidth={activeTab === 'reports' ? 2.5 : 2} />
            <span className="text-[10px] mt-0.5">Laporan</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'settings'
                ? 'text-emerald-700 font-bold bg-emerald-50/80 scale-105'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <SettingsIcon size={20} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
            <span className="text-[10px] mt-0.5">Pengaturan</span>
          </button>
        </nav>

        {/* Global Offline Indicator Banner */}
        <OfflineIndicator />

        {/* Global Modals */}
        <VoiceInputModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          onConfirmTransactions={handleVoiceConfirm}
        />

        <ReceiptScannerModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          onSaveTransactions={handleAddMultipleTransactions}
        />

        <TransactionFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingTransaction(null);
          }}
          onSave={handleAddTransaction}
          initialData={editingTransaction}
        />

        <InstallApkModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
        />
      </div>
    </div>
  );
}
