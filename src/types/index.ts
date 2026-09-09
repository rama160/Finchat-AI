export type TransactionType = 'expense' | 'income';

export type TransactionSource = 'text' | 'voice' | 'receipt' | 'chat' | 'manual';

export type SyncStatus = 'synced' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  chat_id?: string;
  transaction_date: string; // YYYY-MM-DD
  transaction_time: string; // HH:mm:ss
  type: TransactionType;
  category: string;
  description: string; // Must preserve original details!
  amount: number;
  payment_method: string;
  merchant?: string;
  notes?: string;
  source: TransactionSource;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

export interface CategoryDefinition {
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  bgLight: string;
  keywords: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  suggested_transactions?: Partial<Transaction>[];
  is_saved?: boolean;
}

export interface ReceiptItem {
  id: string;
  description: string;
  category: string;
  amount: number;
  selected: boolean;
}

export interface ReceiptScanResult {
  merchant: string;
  date: string;
  items: ReceiptItem[];
  grand_total: number;
}

export interface AppSettings {
  google_sheets_url: string;
  auto_sync: boolean;
  last_sync_time: string | null;
  currency: 'IDR';
  theme: 'light';
  has_gemini_key: boolean;
}

export interface BackupData {
  version: string;
  timestamp: string;
  transactions: Transaction[];
  chat_messages: ChatMessage[];
  deleted_transaction_ids: string[];
  settings: AppSettings;
}
