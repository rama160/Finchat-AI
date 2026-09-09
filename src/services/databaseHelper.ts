import { AppSettings, ChatMessage, Transaction } from '../types';

const STORAGE_KEYS = {
  TRANSACTIONS: 'finchat_transactions_v4',
  CHAT_MESSAGES: 'finchat_chat_messages_v4',
  DELETED_IDS: 'finchat_tombstones_v4',
  SETTINGS: 'finchat_settings_v4',
};

// Initial realistic seed transactions matching Indonesian context
const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_seed_1',
    transaction_date: new Date(Date.now() - 3600 * 1000 * 2).toISOString().split('T')[0],
    transaction_time: '12:30:00',
    type: 'expense',
    category: 'Makanan',
    description: 'Beli nasi padang rendang',
    amount: 25000,
    payment_method: 'Tunai',
    merchant: 'RM Padang Sederhana',
    notes: 'Makan siang kantor',
    source: 'text',
    sync_status: 'synced',
    created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
  },
  {
    id: 'tx_seed_2',
    transaction_date: new Date(Date.now() - 3600 * 1000 * 5).toISOString().split('T')[0],
    transaction_time: '09:15:00',
    type: 'expense',
    category: 'Transportasi',
    description: 'Isi bensin Pertalite motor',
    amount: 50000,
    payment_method: 'QRIS',
    merchant: 'SPBU Pertamina',
    notes: 'Isi penuh',
    source: 'voice',
    sync_status: 'synced',
    created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
  },
  {
    id: 'tx_seed_3',
    transaction_date: new Date(Date.now() - 86400 * 1000 * 1).toISOString().split('T')[0],
    transaction_time: '19:40:00',
    type: 'expense',
    category: 'Perlengkapan Bayi',
    description: 'Beli popok bayi MamyPoko M',
    amount: 75000,
    payment_method: 'Transfer',
    merchant: 'Alfamart',
    notes: '',
    source: 'receipt',
    sync_status: 'synced',
    created_at: new Date(Date.now() - 86400 * 1000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 86400 * 1000 * 1).toISOString(),
  },
  {
    id: 'tx_seed_4',
    transaction_date: new Date(Date.now() - 86400 * 1000 * 2).toISOString().split('T')[0],
    transaction_time: '16:10:00',
    type: 'expense',
    category: 'Kebutuhan Dapur',
    description: 'Beli cabe dan bawang merah',
    amount: 20000,
    payment_method: 'Tunai',
    merchant: 'Pasar Tradisional',
    notes: '',
    source: 'text',
    sync_status: 'synced',
    created_at: new Date(Date.now() - 86400 * 1000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400 * 1000 * 2).toISOString(),
  },
  {
    id: 'tx_seed_5',
    transaction_date: new Date(Date.now() - 86400 * 1000 * 5).toISOString().split('T')[0],
    transaction_time: '08:00:00',
    type: 'income',
    category: 'Gaji',
    description: 'Gaji Bulanan PT Maju Bersama',
    amount: 7500000,
    payment_method: 'Transfer',
    merchant: 'Payroll Perusahaan',
    notes: 'Bulan ini',
    source: 'manual',
    sync_status: 'synced',
    created_at: new Date(Date.now() - 86400 * 1000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400 * 1000 * 5).toISOString(),
  }
];

const DEFAULT_SETTINGS: AppSettings = {
  google_sheets_url: '',
  auto_sync: true,
  last_sync_time: null,
  currency: 'IDR',
  theme: 'light',
  has_gemini_key: false
};

const INITIAL_CHATS: ChatMessage[] = [
  {
    id: 'msg_welcome',
    sender: 'ai',
    text: 'Halo! Saya Finchat AI, asisten keuangan pribadi Anda. Anda bisa mencatat transaksi langsung di sini dengan mengetik atau berbicara (contoh: "beli baju 100rb, cabe 20rb dan popok 50rb"), atau tanyakan laporan keuangan Anda!',
    timestamp: new Date().toISOString()
  }
];

export class DatabaseHelper {
  // --- Transactions ---

  getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) {
        this.saveTransactions(INITIAL_TRANSACTIONS);
        return INITIAL_TRANSACTIONS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  }

  saveTransactions(transactions: Transaction[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions to localStorage', e);
    }
  }

  addTransaction(transaction: Transaction): void {
    const list = this.getTransactions();
    // Prepend new transaction
    const updated = [transaction, ...list.filter(t => t.id !== transaction.id)];
    this.saveTransactions(updated);
  }

  addMultipleTransactions(transactions: Transaction[]): void {
    const list = this.getTransactions();
    const newIds = new Set(transactions.map(t => t.id));
    const filtered = list.filter(t => !newIds.has(t.id));
    this.saveTransactions([...transactions, ...filtered]);
  }

  updateTransaction(transaction: Transaction): void {
    const list = this.getTransactions();
    const index = list.findIndex(t => t.id === transaction.id);
    if (index !== -1) {
      const updatedItem = {
        ...list[index],
        ...transaction,
        updated_at: new Date().toISOString()
      };
      list[index] = updatedItem;
      this.saveTransactions([...list]);
    }
  }

  deleteTransaction(id: string): void {
    const list = this.getTransactions();
    const updated = list.filter(t => t.id !== id);
    this.saveTransactions(updated);

    // Save tombstone for sync deletion to Google Sheets
    this.addTombstone(id);
  }

  saveTransaction(transaction: Transaction): Transaction {
    const list = this.getTransactions();
    const index = list.findIndex(t => t.id === transaction.id);
    if (index !== -1) {
      const updated = { ...list[index], ...transaction, updated_at: new Date().toISOString() };
      list[index] = updated;
      this.saveTransactions([...list]);
      return updated;
    } else {
      this.addTransaction(transaction);
      return transaction;
    }
  }

  clearAllTransactions(): void {
    this.saveTransactions([]);
  }

  // Aliases for compatibility
  getDeletedTombstones(): string[] {
    return this.getTombstones();
  }

  getChatHistory(): ChatMessage[] {
    return this.getChatMessages();
  }

  saveChatHistory(messages: ChatMessage[]): void {
    this.saveChatMessages(messages);
  }

  markSuggestedTransactionsSaved(messageId: string): void {
    const chats = this.getChatMessages();
    const updated = chats.map(c => {
      if (c.id === messageId) {
        return { ...c, is_saved: true };
      }
      return c;
    });
    this.saveChatMessages(updated);
  }

  // --- Tombstones (Deleted Transaction IDs) ---

  getTombstones(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DELETED_IDS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  addTombstone(id: string): void {
    const tombstones = this.getTombstones();
    if (!tombstones.includes(id)) {
      tombstones.push(id);
      localStorage.setItem(STORAGE_KEYS.DELETED_IDS, JSON.stringify(tombstones));
    }
  }

  removeTombstones(ids: string[]): void {
    const set = new Set(ids);
    const tombstones = this.getTombstones().filter(id => !set.has(id));
    localStorage.setItem(STORAGE_KEYS.DELETED_IDS, JSON.stringify(tombstones));
  }

  clearTombstones(): void {
    localStorage.removeItem(STORAGE_KEYS.DELETED_IDS);
  }

  // --- Chat Messages ---

  getChatMessages(): ChatMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
      return data ? JSON.parse(data) : INITIAL_CHATS;
    } catch {
      return INITIAL_CHATS;
    }
  }

  saveChatMessages(messages: ChatMessage[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save chat messages', e);
    }
  }

  addChatMessage(msg: ChatMessage): void {
    const list = this.getChatMessages();
    this.saveChatMessages([...list, msg]);
  }

  clearChatMessages(): void {
    this.saveChatMessages(INITIAL_CHATS);
  }

  // --- Settings ---

  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(settings: Partial<AppSettings>): AppSettings {
    try {
      const current = this.getSettings();
      const merged: AppSettings = { ...current, ...settings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
      return merged;
    } catch (e) {
      console.error('Failed to save settings', e);
      return this.getSettings();
    }
  }

  // --- Bulk Reset & Restore ---

  resetToDefault(): void {
    this.saveTransactions(INITIAL_TRANSACTIONS);
    this.clearTombstones();
    this.clearChatMessages();
    this.saveSettings(DEFAULT_SETTINGS);
  }
}

export const databaseHelper = new DatabaseHelper();
