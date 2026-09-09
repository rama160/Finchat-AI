import { CategoryDefinition } from '../types';

export const EXPENSE_CATEGORIES: CategoryDefinition[] = [
  {
    name: 'Makanan',
    type: 'expense',
    icon: 'UtensilsCrossed',
    color: '#ea580c', // orange-600
    bgLight: '#ffedd5', // orange-100
    keywords: [
      'makan', 'nasi', 'mie', 'bakso', 'soto', 'ayam', 'ikan', 'bebek', 'seafood',
      'burger', 'pizza', 'roti', 'snack', 'cemilan', 'gorengan', 'martabak',
      'sate', 'lauk', 'warteg', 'padang', 'kfc', 'mcd', 'resto', 'restoran',
      'sarapan', 'lunch', 'dinner', 'pecel', 'gudeg', 'rawon', 'bubur'
    ]
  },
  {
    name: 'Minuman',
    type: 'expense',
    icon: 'Coffee',
    color: '#0284c7', // sky-600
    bgLight: '#e0f2fe', // sky-100
    keywords: [
      'minum', 'kopi', 'coffee', 'teh', 'tea', 'jus', 'juice', 'boba', 'es',
      'susu', 'air', 'mineral', 'aqua', 'le minerale', 'latte', 'cappuccino',
      'boba', 'janji jiwa', 'kopi kenangan', 'starbucks', 'chatime', 'minuman'
    ]
  },
  {
    name: 'Rokok',
    type: 'expense',
    icon: 'Flame',
    color: '#dc2626', // red-600
    bgLight: '#fee2e2', // red-100
    keywords: [
      'rokok', 'roko', 'sampoerna', 'surya', 'marlboro', 'djarum', 'gudang garam',
      'magnum', 'esse', 'camel', 'tembakau', 'vape', 'liquid', 'pod', 'iqos'
    ]
  },
  {
    name: 'Pakaian',
    type: 'expense',
    icon: 'Shirt',
    color: '#7c3aed', // violet-600
    bgLight: '#ede9fe', // violet-100
    keywords: [
      'baju', 'celana', 'jeans', 'jaket', 'kaos', 't-shirt', 'rok', 'sepatu',
      'sandal', 'kemeja', 'hoodie', 'sweater', 'jas', 'blazer', 'dress',
      'gamis', 'jilbab', 'hijab', 'tas', 'dompet', 'topi', 'kaos kaki',
      'pakaian', 'fashion', 'outfit', 'batik'
    ]
  },
  {
    name: 'Perlengkapan Bayi',
    type: 'expense',
    icon: 'Baby',
    color: '#ec4899', // pink-500
    bgLight: '#fce7f3', // pink-100
    keywords: [
      'popok', 'pampers', 'mamypoko', 'sweety', 'merries', 'susu bayi', 'formula',
      'botol bayi', 'dot', 'perlengkapan bayi', 'sleek baby', 'zwitsal', 'cussons',
      'minyak telon', 'telon', 'stroller', 'baju bayi', 'gendongan', 'bayi',
      'diapers', 'baby wipes', 'tisu basah bayi'
    ]
  },
  {
    name: 'Kebutuhan Dapur',
    type: 'expense',
    icon: 'ShoppingBasket',
    color: '#059669', // emerald-600
    bgLight: '#d1fae5', // emerald-100
    keywords: [
      'cabe', 'cabai', 'bawang', 'garam', 'gula', 'minyak goreng', 'minyak',
      'tepung', 'telur', 'telor', 'bumbu', 'bumbu dapur', 'beras', 'sayur',
      'daging', 'ayam potong', 'kecap', 'saus', 'masako', 'royco', 'merica',
      'tomat', 'wortel', 'kentang', 'tahu', 'tempe', 'ikan asin', 'dapur'
    ]
  },
  {
    name: 'Kebutuhan Rumah Tangga',
    type: 'expense',
    icon: 'Home',
    color: '#0d9488', // teal-600
    bgLight: '#ccfbf1', // teal-100
    keywords: [
      'sabun', 'deterjen', 'pewangi', 'alat kebersihan', 'sunlight', 'soklin',
      'rinso', 'daia', 'molto', 'downy', 'wipol', 'bayclin', 'karbol', 'sapu',
      'pel', 'spons', 'tisu', 'tissue', 'odol', 'pasta gigi', 'shampo',
      'shampoo', 'sikat gigi', 'pembersih', 'lemari', 'ember', 'rumah tangga'
    ]
  },
  {
    name: 'Transportasi',
    type: 'expense',
    icon: 'Car',
    color: '#2563eb', // blue-600
    bgLight: '#dbeafe', // blue-100
    keywords: [
      'bensin', 'pertalite', 'pertamax', 'solar', 'dexlite', 'isi bensin', 'bbm',
      'parkir', 'tol', 'tarif tol', 'ojek', 'ojol', 'grab', 'gojek', 'maxim',
      'taksi', 'kereta', 'krl', 'mrt', 'lrt', 'bus', 'transjakarta', 'angkot',
      'tiket pesawat', 'travel', 'tambal ban', 'cuci motor', 'cuci mobil', 'service motor'
    ]
  },
  {
    name: 'Belanja',
    type: 'expense',
    icon: 'ShoppingBag',
    color: '#4f46e5', // indigo-600
    bgLight: '#e0e7ff', // indigo-100
    keywords: [
      'belanja', 'shopee', 'tokopedia', 'lazada', 'tiktok shop', 'mall', 'supermarket',
      'indomaret', 'alfamart', 'hypermart', 'transmart', 'elektronik', 'gadget',
      'hp', 'laptop', 'aksesoris', 'kado', 'souvenir'
    ]
  },
  {
    name: 'Tagihan',
    type: 'expense',
    icon: 'Receipt',
    color: '#d97706', // amber-600
    bgLight: '#fef3c7', // amber-100
    keywords: [
      'listrik', 'pln', 'token', 'token listrik', 'pdam', 'air pdam', 'wifi',
      'indihome', 'biznet', 'first media', 'bpjs', 'pbb', 'pajak', 'cicilan',
      'angsuran', 'sewa kos', 'kontrakan', 'iuran', 'tagihan'
    ]
  },
  {
    name: 'Pulsa & Data',
    type: 'expense',
    icon: 'Smartphone',
    color: '#0891b2', // cyan-600
    bgLight: '#cffafe', // cyan-100
    keywords: [
      'pulsa', 'paket internet', 'kuota', 'data', 'paket data', 'telkomsel',
      'indosat', 'im3', 'xl', 'axis', 'tri', 'three', 'smartfren', 'byu'
    ]
  },
  {
    name: 'Kesehatan',
    type: 'expense',
    icon: 'HeartPulse',
    color: '#e11d48', // rose-600
    bgLight: '#ffe4e6', // rose-100
    keywords: [
      'obat', 'dokter', 'biaya pemeriksaan', 'apotek', 'apotik', 'kimia farma',
      'k24', 'paracetamol', 'vitamin', 'klinik', 'rumah sakit', 'rs', 'periksa',
      'lab', 'tes darah', 'swab', 'masker', 'koyo', 'kesehatan'
    ]
  },
  {
    name: 'Hiburan',
    type: 'expense',
    icon: 'Film',
    color: '#9333ea', // purple-600
    bgLight: '#f3e8ff', // purple-100
    keywords: [
      'bioskop', 'cinema', 'xxi', 'cgv', 'game', 'tiket hiburan', 'netflix',
      'spotify', 'youtube premium', 'karaoke', 'rekreasi', 'liburan', 'wisata',
      'steam', 'playstation', 'top up game', 'mobile legends', 'free fire'
    ]
  },
  {
    name: 'Pendidikan',
    type: 'expense',
    icon: 'GraduationCap',
    color: '#0369a1', // sky-700
    bgLight: '#bae6fd', // sky-200
    keywords: [
      'buku', 'alat tulis', 'kursus', 'spp', 'kuliah', 'sekolah', 'les',
      'bimbingan belajar', 'bimbel', 'ujian', 'seminar', 'pelatihan', 'pensil',
      'pulpen', 'buku tulis', 'fotokopi'
    ]
  },
  {
    name: 'Lainnya',
    type: 'expense',
    icon: 'MoreHorizontal',
    color: '#64748b', // slate-500
    bgLight: '#f1f5f9', // slate-100
    keywords: ['lain', 'lainnya', 'biaya lain', 'pengeluaran lain']
  }
];

export const INCOME_CATEGORIES: CategoryDefinition[] = [
  {
    name: 'Gaji',
    type: 'income',
    icon: 'Wallet',
    color: '#059669', // emerald-600
    bgLight: '#d1fae5',
    keywords: ['gaji', 'salary', 'upah', 'honor', 'payroll']
  },
  {
    name: 'Bonus',
    type: 'income',
    icon: 'Award',
    color: '#d97706', // amber-600
    bgLight: '#fef3c7',
    keywords: ['bonus', 'thr', 'insentif', 'tips', 'tip', 'komisi']
  },
  {
    name: 'Penjualan',
    type: 'income',
    icon: 'Store',
    color: '#2563eb', // blue-600
    bgLight: '#dbeafe',
    keywords: ['penjualan', 'omset', 'jual', 'laba', 'untung', 'hasil jualan']
  },
  {
    name: 'Transfer Masuk',
    type: 'income',
    icon: 'ArrowDownLeft',
    color: '#7c3aed', // violet-600
    bgLight: '#ede9fe',
    keywords: ['transfer', 'terima transfer', 'dapat uang', 'kiriman', 'dikirimi', 'tf']
  },
  {
    name: 'Hadiah',
    type: 'income',
    icon: 'Gift',
    color: '#ec4899', // pink-500
    bgLight: '#fce7f3',
    keywords: ['hadiah', 'kado', 'giveaway', 'sawer', 'angpau']
  },
  {
    name: 'Investasi',
    type: 'income',
    icon: 'TrendingUp',
    color: '#0d9488', // teal-600
    bgLight: '#ccfbf1',
    keywords: ['investasi', 'dividen', 'bunga', 'reksadana', 'saham', 'crypto', 'profit']
  },
  {
    name: 'Lainnya',
    type: 'income',
    icon: 'MoreHorizontal',
    color: '#64748b',
    bgLight: '#f1f5f9',
    keywords: ['pemasukan lain', 'lainnya']
  }
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export function getCategoryDefinition(name: string, type: 'expense' | 'income' = 'expense'): CategoryDefinition {
  const match = ALL_CATEGORIES.find(c => c.name.toLowerCase() === name.toLowerCase() && c.type === type)
    || ALL_CATEGORIES.find(c => c.name.toLowerCase() === name.toLowerCase());
  
  if (match) return match;
  
  return type === 'income' 
    ? INCOME_CATEGORIES[INCOME_CATEGORIES.length - 1] 
    : EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
}
