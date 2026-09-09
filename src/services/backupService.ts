import { BackupData } from '../types';
import { databaseHelper } from './databaseHelper';

export class BackupService {
  /**
   * Export all local data to JSON string and trigger download
   */
  exportBackup(): { jsonString: string; fileName: string } {
    const backup: BackupData = {
      version: '4.1',
      timestamp: new Date().toISOString(),
      transactions: databaseHelper.getTransactions(),
      chat_messages: databaseHelper.getChatMessages(),
      deleted_transaction_ids: databaseHelper.getTombstones(),
      settings: databaseHelper.getSettings()
    };

    const jsonString = JSON.stringify(backup, null, 2);
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `finchat_backup_${dateStr}.json`;

    // Trigger browser download
    try {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to trigger download file', e);
    }

    return { jsonString, fileName };
  }

  exportBackupFile(): { jsonString: string; fileName: string } {
    return this.exportBackup();
  }

  importBackup(content: string): { success: boolean; message: string } {
    const val = this.validateBackup(content);
    if (!val.valid || !val.data) {
      return { success: false, message: val.error || 'Format file backup tidak valid' };
    }
    this.applyRestore(val.data);
    return {
      success: true,
      message: `Berhasil mengimpor ${val.data.transactions.length} transaksi dari backup!`
    };
  }

  /**
   * Parse and validate backup JSON string
   */
  validateBackup(jsonString: string): {
    valid: boolean;
    error?: string;
    data?: BackupData;
  } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: 'Format file JSON tidak valid.' };
      }

      if (!Array.isArray(parsed.transactions)) {
        return { valid: false, error: 'File tidak memuat array transaksi yang valid.' };
      }

      return {
        valid: true,
        data: {
          version: parsed.version || '4.1',
          timestamp: parsed.timestamp || new Date().toISOString(),
          transactions: parsed.transactions || [],
          chat_messages: parsed.chat_messages || [],
          deleted_transaction_ids: parsed.deleted_transaction_ids || [],
          settings: parsed.settings || databaseHelper.getSettings()
        }
      };
    } catch (e: any) {
      return { valid: false, error: `Gagal membaca file JSON: ${e.message}` };
    }
  }

  /**
   * Apply restored backup into local storage
   */
  applyRestore(data: BackupData, mergeMode: 'replace' | 'merge' = 'replace'): void {
    if (mergeMode === 'replace') {
      databaseHelper.saveTransactions(data.transactions);
      if (data.chat_messages && data.chat_messages.length > 0) {
        databaseHelper.saveChatMessages(data.chat_messages);
      }
      if (data.deleted_transaction_ids) {
        localStorage.setItem('finchat_tombstones_v4', JSON.stringify(data.deleted_transaction_ids));
      }
      if (data.settings) {
        databaseHelper.saveSettings(data.settings);
      }
    } else {
      // Merge mode
      const existing = databaseHelper.getTransactions();
      const existingMap = new Map(existing.map(t => [t.id, t]));
      for (const t of data.transactions) {
        existingMap.set(t.id, t);
      }
      databaseHelper.saveTransactions(Array.from(existingMap.values()));
    }
  }
}

export const backupService = new BackupService();
