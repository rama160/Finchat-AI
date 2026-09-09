# Finchat AI - Smart Personal Finance Tracker

Aplikasi pencatatan keuangan pintar (*personal finance tracker*) berbasis AI dengan dukungan Web (React/TypeScript) dan Mobile (Flutter), dilengkapi dengan integrasi **GitHub Actions CI/CD Workflow** otomatis.

---

## 🚀 Fitur Utama
- 💰 **Pencatatan Keuangan Real-time**: Input manual, input cepat teks, dan filter kategori.
- 🤖 **Asisten Finchat AI**: Obrolan interaktif untuk analisis saldo, pola pengeluaran, dan saran keuangan cerdas.
- 📊 **Laporan & Visualisasi Interaktif**: Net Cash Flow, perbandingan pemasukan/pengeluaran, dan breakdown persentase per kategori.
- 📱 **Flutter & Multiplatform Ready**: Struktur project Flutter lengkap (`lib/`, `pubspec.yaml`, `android/`, `web/`).
- ⚙️ **Automated GitHub Actions Workflow**: Workflow otomatis khusus untuk build file Android APK release (`app-release.apk`) siap install setiap kali push ke GitHub.

---

## 📂 Struktur Project

```
├── .github/
│   └── workflows/
│       └── flutter.yml        # CI/CD Workflow GitHub Actions khusus Build Android Release APK
├── lib/                       # Flutter Source Code
│   ├── constants/             # Kategori pengeluaran & pemasukan
│   ├── models/                # Model data Transaksi
│   ├── screens/               # Halaman Transaksi, Chat AI, Laporan, Pengaturan
│   ├── services/              # StorageService & formatting Rupiah
│   └── main.dart              # Entry point aplikasi Flutter
├── android/                   # Konfigurasi native Android Flutter
├── pubspec.yaml               # Flutter dependencies & manifest
├── src/                       # React / Vite Web Source Code
├── server.ts                  # Express backend server (Web)
└── package.json               # Node.js dependencies & scripts
```

---

## 🛠️ Cara Import ke GitHub & Dapatkan APK Release

1. **Buat Repository Baru di GitHub**:
   - Buka [GitHub](https://github.com/new) dan buat repository kosong (misal: `finchat-ai`).

2. **Push Repository ke GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: setup Flutter Android APK release workflow"
   git branch -M main
   git remote add origin https://github.com/USERNAME/finchat-ai.git
   git push -u origin main
   ```

3. **GitHub Actions Otomatis Membangun APK**:
   - Setelah di-push, buka tab **Actions** di repository GitHub Anda.
   - Workflow `Build Android APK Release` (`.github/workflows/flutter.yml`) akan otomatis terpicu.
   - Workflow akan mengeksekusi:
     - ✅ Setup Java JDK 17 & Flutter Stable
     - ✅ `flutter pub get`
     - ✅ `flutter build apk --release`
   - Setelah proses selesai (status hijau/sukses), unduh file **`app-release-apk`** pada bagian **Artifacts** di halaman detail run tersebut. File `.apk` siap langsung diinstall di perangkat Android.

---

## 💻 Menjalankan Secara Lokal

### 1. Menjalankan Aplikasi Flutter:
Pastikan Flutter SDK sudah terinstal di komputer Anda:
```bash
# Unduh dependency
flutter pub get

# Jalankan di Chrome (Web)
flutter run -d chrome

# Jalankan di HP Android / Emulator
flutter run
```

### 2. Menjalankan Aplikasi Web (React/Vite):
```bash
# Install dependencies
npm install

# Jalankan development server
npm run dev

# Build production
npm run build
```
