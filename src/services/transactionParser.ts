import { Transaction, TransactionSource, TransactionType } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/categories';

// Indonesian word to number converter for voice and text
export function parseIndonesianSpokenNumber(text: string): number | null {
  const normalized = text.toLowerCase().trim();
  
  // Quick direct phrase maps
  const quickMap: Record<string, number> = {
    'seratus ribu': 100000,
    'dua ratus ribu': 200000,
    'tiga ratus ribu': 300000,
    'empat ratus ribu': 400000,
    'lima ratus ribu': 500000,
    'enam ratus ribu': 600000,
    'tujuh ratus ribu': 700000,
    'delapan ratus ribu': 800000,
    'sembilan ratus ribu': 900000,
    'sepuluh ribu': 10000,
    'dua puluh ribu': 20000,
    'dua puluh lima ribu': 25000,
    'tiga puluh ribu': 30000,
    'tiga puluh lima ribu': 35000,
    'empat puluh ribu': 40000,
    'lima puluh ribu': 50000,
    'enam puluh ribu': 60000,
    'tujuh puluh ribu': 70000,
    'tujuh puluh lima ribu': 75000,
    'delapan puluh ribu': 80000,
    'sembilan puluh ribu': 90000,
    'seribu': 1000,
    'dua ribu': 2000,
    'tiga ribu': 3000,
    'empat ribu': 4000,
    'lima ribu': 5000,
    'enam ribu': 6000,
    'tujuh ribu': 7000,
    'delapan ribu': 8000,
    'sembilan ribu': 9000,
    'lima belas ribu': 15000,
    'satu juta': 1000000,
    'dua juta': 2000000,
    'tiga juta': 3000000,
    'empat juta': 4000000,
    'lima juta': 5000000,
    'satu koma lima juta': 1500000,
    'dua koma lima juta': 2500000
  };

  for (const [phrase, value] of Object.entries(quickMap)) {
    if (normalized.includes(phrase)) {
      return value;
    }
  }

  // Token-based Indonesian number parser
  const unitMap: Record<string, number> = {
    'nol': 0, 'kosong': 0, 'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4,
    'lima': 5, 'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9,
    'sepuluh': 10, 'sebelas': 11, 'seratus': 100, 'seribu': 1000, 'sejuta': 1000000
  };

  if (normalized.includes('juta') || normalized.includes('ribu') || normalized.includes('ratus') || normalized.includes('puluh')) {
    // Regex for e.g. "1,5 juta" or "1.5 juta"
    const decimalJuta = normalized.match(/(\d+)[,\.](\d+)\s*juta/);
    if (decimalJuta) {
      const whole = parseFloat(`${decimalJuta[1]}.${decimalJuta[2]}`);
      return Math.round(whole * 1000000);
    }
    const numJuta = normalized.match(/(\d+)\s*juta/);
    if (numJuta) {
      return parseInt(numJuta[1], 10) * 1000000;
    }
    const numRibu = normalized.match(/(\d+)\s*ribu/);
    if (numRibu) {
      return parseInt(numRibu[1], 10) * 1000;
    }
  }

  return null;
}

// Parse nominal from string: 10k, 10rb, 10 ribu, 50.000, Rp50.000, 1 juta, 1,5 juta, etc.
export function parseNominal(text: string): { amount: number; matchedText: string } | null {
  const clean = text.trim();

  // Check spoken words first (e.g., "seratus ribu", "dua puluh ribu", "lima puluh ribu")
  const spoken = parseIndonesianSpokenNumber(clean);
  if (spoken !== null && spoken > 0) {
    // Match the spoken words in the text to know where the amount was
    const wordsRegex = /(?:satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|seratus|dua ratus|tiga ratus|empat ratus|lima ratus|dua puluh|tiga puluh|empat puluh|lima puluh|enam puluh|tujuh puluh|delapan puluh|sembilan puluh|lima belas|dua puluh lima|tujuh puluh lima)?\s*(?:koma\s*\d+\s*)?(?:juta|ribu|ratus)/i;
    const m = clean.match(wordsRegex);
    return {
      amount: spoken,
      matchedText: m ? m[0] : ''
    };
  }

  // 1,5 juta or 1.5 juta or 2 juta
  const jutaMatch = clean.match(/(\d+)(?:[,\.](\d+))?\s*(?:juta|jt)/i);
  if (jutaMatch) {
    const val = jutaMatch[2] 
      ? parseFloat(`${jutaMatch[1]}.${jutaMatch[2]}`) * 1000000 
      : parseInt(jutaMatch[1], 10) * 1000000;
    return { amount: Math.round(val), matchedText: jutaMatch[0] };
  }

  // 10k, 25k, 100k
  const kMatch = clean.match(/(?:rp\.?\s*)?(\d+(?:[,\.]\d+)?)\s*k\b/i);
  if (kMatch) {
    const num = parseFloat(kMatch[1].replace(',', '.'));
    return { amount: Math.round(num * 1000), matchedText: kMatch[0] };
  }

  // 10rb, 25 rb, 150rb, 10 ribu
  const rbMatch = clean.match(/(?:rp\.?\s*)?(\d+(?:[,\.]\d+)?)\s*(?:rb|ribu)\b/i);
  if (rbMatch) {
    const num = parseFloat(rbMatch[1].replace(',', '.'));
    return { amount: Math.round(num * 1000), matchedText: rbMatch[0] };
  }

  // Standard Indonesian currency format: Rp 50.000, Rp50.000, 50.000, 50000
  // Note: Avoid matching dates like 2024 or years
  const rpExplicitMatch = clean.match(/rp\.?\s*(\d{1,3}(?:\.\d{3})+|\d+)/i);
  if (rpExplicitMatch) {
    const num = parseInt(rpExplicitMatch[1].replace(/\./g, ''), 10);
    return { amount: num, matchedText: rpExplicitMatch[0] };
  }

  // Numbers with thousands separator: 50.000, 100.000, 1.250.000
  const dotNumberMatch = clean.match(/\b(\d{1,3}(?:\.\d{3})+)\b/);
  if (dotNumberMatch) {
    const num = parseInt(dotNumberMatch[1].replace(/\./g, ''), 10);
    return { amount: num, matchedText: dotNumberMatch[0] };
  }

  // Plain numbers (>= 1000)
  const plainNumMatch = clean.match(/\b(\d{3,9})\b/);
  if (plainNumMatch) {
    const num = parseInt(plainNumMatch[1], 10);
    return { amount: num, matchedText: plainNumMatch[0] };
  }

  return null;
}

// Categorize intelligent Indonesian context
export function detectCategory(description: string, type: TransactionType = 'expense'): string {
  const lower = description.toLowerCase();

  if (type === 'income') {
    for (const cat of INCOME_CATEGORIES) {
      for (const kw of cat.keywords) {
        if (lower.includes(kw)) {
          return cat.name;
        }
      }
    }
    return 'Lainnya';
  }

  // Priority check for specific categories with overlapping words
  // 1. Perlengkapan Bayi (sleek baby, popok, pampers, susu bayi, minyak telon)
  const babyCat = EXPENSE_CATEGORIES.find(c => c.name === 'Perlengkapan Bayi')!;
  for (const kw of babyCat.keywords) {
    if (lower.includes(kw)) return babyCat.name;
  }

  // 2. Kebutuhan Dapur (cabe, bawang, bumbu, garam, gula, minyak goreng, beras, telur)
  const kitchenCat = EXPENSE_CATEGORIES.find(c => c.name === 'Kebutuhan Dapur')!;
  for (const kw of kitchenCat.keywords) {
    if (lower.includes(kw)) return kitchenCat.name;
  }

  // 3. Kebutuhan Rumah Tangga (sabun, deterjen, pewangi, sunlight, soklin, wipol, spons)
  const homeCat = EXPENSE_CATEGORIES.find(c => c.name === 'Kebutuhan Rumah Tangga')!;
  for (const kw of homeCat.keywords) {
    if (lower.includes(kw)) return homeCat.name;
  }

  // 4. Rokok (rokok, surya, sampoerna, marlboro, vape, pod)
  const rokokCat = EXPENSE_CATEGORIES.find(c => c.name === 'Rokok')!;
  for (const kw of rokokCat.keywords) {
    if (lower.includes(kw)) return rokokCat.name;
  }

  // 5. Pakaian (baju, celana, jeans, jaket, kaos, rok, sepatu, sandal)
  const clothesCat = EXPENSE_CATEGORIES.find(c => c.name === 'Pakaian')!;
  for (const kw of clothesCat.keywords) {
    if (lower.includes(kw)) return clothesCat.name;
  }

  // 6. Tagihan (listrik, pln, pdam, wifi, indihome, bpjs, cicilan)
  const billCat = EXPENSE_CATEGORIES.find(c => c.name === 'Tagihan')!;
  for (const kw of billCat.keywords) {
    if (lower.includes(kw)) return billCat.name;
  }

  // 7. Pulsa & Data (pulsa, kuota, paket internet)
  const dataCat = EXPENSE_CATEGORIES.find(c => c.name === 'Pulsa & Data')!;
  for (const kw of dataCat.keywords) {
    if (lower.includes(kw)) return dataCat.name;
  }

  // 8. Transportasi (bensin, solar, parkir, tol, grab, gojek, ojol)
  const transportCat = EXPENSE_CATEGORIES.find(c => c.name === 'Transportasi')!;
  for (const kw of transportCat.keywords) {
    if (lower.includes(kw)) return transportCat.name;
  }

  // 9. Kesehatan (obat, dokter, apotek, klinik, paracetamol)
  const healthCat = EXPENSE_CATEGORIES.find(c => c.name === 'Kesehatan')!;
  for (const kw of healthCat.keywords) {
    if (lower.includes(kw)) return healthCat.name;
  }

  // 10. Makanan vs Minuman
  const drinkCat = EXPENSE_CATEGORIES.find(c => c.name === 'Minuman')!;
  for (const kw of drinkCat.keywords) {
    if (lower.includes(kw)) return drinkCat.name;
  }

  const foodCat = EXPENSE_CATEGORIES.find(c => c.name === 'Makanan')!;
  for (const kw of foodCat.keywords) {
    if (lower.includes(kw)) return foodCat.name;
  }

  // 11. Belanja, Hiburan, Pendidikan
  for (const cat of EXPENSE_CATEGORIES) {
    if (cat.name === 'Lainnya') continue;
    for (const kw of cat.keywords) {
      if (lower.includes(kw)) return cat.name;
    }
  }

  return 'Lainnya';
}

// Detect transaction type (income vs expense)
export function detectType(text: string): TransactionType {
  const lower = text.toLowerCase();
  const incomeKeywords = [
    'gaji', 'gajian', 'salary', 'dapat uang', 'terima uang', 'terima transfer',
    'transfer masuk', 'bonus', 'thr', 'penjualan', 'omset', 'hasil jual',
    'laba', 'untung', 'cashback', 'hadiah', 'dikasih uang', 'dapet duit'
  ];

  for (const kw of incomeKeywords) {
    if (lower.includes(kw)) return 'income';
  }

  return 'expense';
}

// Clean and capitalize description properly
export function cleanDescription(rawDesc: string): string {
  let cleaned = rawDesc
    .trim()
    .replace(/^[,;.\-\s]+|[,;.\-\s]+$/g, '')
    // remove trailing connectors
    .replace(/\s+(dan|lalu|serta|kemudian)$/i, '')
    .trim();

  if (!cleaned) return 'Transaksi';

  // Capitalize first letter of each word or sentence
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return cleaned;
}

export interface ParsedTransactionDraft {
  description: string;
  category: string;
  amount: number;
  type: TransactionType;
  payment_method: string;
  merchant?: string;
  source: TransactionSource;
  notes?: string;
  date?: string;
  time?: string;
}

/**
 * Multi-Transaction Sentence Splitter & Parser
 * Handles sentences like:
 * - "beli nasi 25rb, rokok 30rb, es 10rb" -> 3 transactions
 * - "beli baju 100rb, celana 200rb, cabe 20rb, popok 50rb" -> 4 transactions
 * - "beli baju seratus ribu, cabe dua puluh ribu, popok lima puluh ribu" -> 3 transactions
 */
export function parseMultiTransactions(
  input: string,
  source: TransactionSource = 'text'
): ParsedTransactionDraft[] {
  if (!input || !input.trim()) return [];

  const rawText = input.trim();

  // Normalize conjunctions & splitters
  // Split on newlines, commas, or " dan " (when followed by an item + amount)
  // Or handle sentences where multiple purchases are chained
  
  // Strategy: Identify segments. A segment usually contains item words + an amount.
  // First, let's normalize separators
  let prepared = rawText
    .replace(/\n+/g, ' , ')
    .replace(/\s*\+\s*/g, ' , ')
    .replace(/\s+serta\s+/gi, ' , ')
    .replace(/\s+lalu\s+/gi, ' , ');

  // Split by comma
  const rawSegments = prepared.split(',').map(s => s.trim()).filter(Boolean);
  const segments: string[] = [];

  for (const seg of rawSegments) {
    // If a segment contains " dan " followed by an item and amount, split it!
    // Example: "cabe 20rb dan popok 50rb"
    const danSplit = seg.split(/\s+dan\s+/i);
    if (danSplit.length > 1) {
      for (const sub of danSplit) {
        if (sub.trim()) segments.push(sub.trim());
      }
    } else {
      segments.push(seg);
    }
  }

  const results: ParsedTransactionDraft[] = [];

  for (const segment of segments) {
    const nominalRes = parseNominal(segment);
    if (!nominalRes || nominalRes.amount <= 0) {
      continue;
    }

    const { amount, matchedText } = nominalRes;

    // Extract description by removing the amount matched text
    let desc = segment;
    if (matchedText) {
      desc = desc.replace(matchedText, '');
    }

    // Clean common prefixes/suffixes
    desc = desc
      .replace(/\brp\.?\b/gi, '')
      .replace(/\bsebesar\b/gi, '')
      .replace(/\bharga\b/gi, '')
      .replace(/\bseharga\b/gi, '')
      .replace(/\bsejumlah\b/gi, '')
      .trim();

    desc = cleanDescription(desc);

    // If description is too short or empty, provide sensible fallback
    if (!desc || desc.length < 2) {
      desc = 'Transaksi';
    }

    const type = detectType(segment);
    const category = detectCategory(desc, type);

    // Default payment method
    let payment_method = 'Tunai';
    const lowerSeg = segment.toLowerCase();
    if (lowerSeg.includes('qris')) payment_method = 'QRIS';
    else if (lowerSeg.includes('transfer') || lowerSeg.includes('tf')) payment_method = 'Transfer';
    else if (lowerSeg.includes('debit')) payment_method = 'Debit';
    else if (lowerSeg.includes('kredit') || lowerSeg.includes('cc')) payment_method = 'Kredit';
    else if (lowerSeg.includes('gopay') || lowerSeg.includes('ovo') || lowerSeg.includes('shopeepay') || lowerSeg.includes('dana')) payment_method = 'E-Wallet';

    results.push({
      description: desc,
      category,
      amount,
      type,
      payment_method,
      source
    });
  }

  return results;
}

// Helper to convert draft to full Transaction object
export function createTransactionObject(draft: ParsedTransactionDraft, chatId?: string): Transaction {
  const now = new Date();
  const dateStr = draft.date || now.toISOString().split('T')[0];
  const timeStr = draft.time || now.toTimeString().split(' ')[0];

  return {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    chat_id: chatId,
    transaction_date: dateStr,
    transaction_time: timeStr,
    type: draft.type,
    category: draft.category,
    description: draft.description,
    amount: draft.amount,
    payment_method: draft.payment_method || 'Tunai',
    merchant: draft.merchant || '',
    notes: draft.notes || '',
    source: draft.source || 'text',
    sync_status: 'pending',
    created_at: now.toISOString(),
    updated_at: now.toISOString()
  };
}

// Format Indonesian Rupiah e.g. "Rp 100.000" or "Rp100.000"
export function formatRupiah(amount: number, withSpace = true): string {
  const formatted = new Intl.NumberFormat('id-ID').format(amount);
  return withSpace ? `Rp ${formatted}` : `Rp${formatted}`;
}
