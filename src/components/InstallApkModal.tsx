import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallApkModal: React.FC<InstallApkModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, triggerInstall } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'pwa' | 'apk'>('pwa');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentAppUrl = window.location.origin;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentAppUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeInstall = async () => {
    const success = await triggerInstall();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white border-b border-emerald-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 p-1.5 border border-white/15 flex items-center justify-center shrink-0">
              <img src="/pwa-192x192.png" alt="Finchat AI Icon" className="w-full h-full object-contain rounded-xl" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>Pasang Aplikasi / Buat APK</span>
              </h2>
              <p className="text-xs text-emerald-200">
                Gunakan Finchat AI layaknya aplikasi native di Android
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="p-2 bg-slate-100/80 border-b border-slate-200 flex gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-2 px-3 rounded-2xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'pwa'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Smartphone size={15} />
            <span>Pasang Cepat (Direkomendasikan)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2 px-3 rounded-2xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'apk'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Download size={15} />
            <span>Buat File .APK (Paket)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-slate-700">
          {activeTab === 'pwa' ? (
            <div className="space-y-4">
              {/* Banner Info */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck size={18} />
                </div>
                <div className="text-xs leading-relaxed text-emerald-950">
                  <strong className="block font-bold text-emerald-900 mb-0.5">
                    Instalasi Resmi PWA (Progressive Web App)
                  </strong>
                  Aplikasi ini sudah berstandar PWA lengkap dengan <strong>ikon aplikasi resmi</strong>, <strong>tampilan layar penuh</strong> tanpa browser bar, <strong>mode offline</strong>, dan <strong>kecepatan tinggi</strong> tanpa membebani memori HP.
                </div>
              </div>

              {/* Native Install Button (if browser supports beforeinstallprompt) */}
              {isInstallable && (
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Sparkles size={14} /> Browser Mendukung Instalasi Instan
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                      Siap Dipasang
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Klik tombol di bawah untuk memasang Finchat AI langsung ke layar beranda smartphone Anda:
                  </p>
                  <button
                    type="button"
                    onClick={handleNativeInstall}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
                  >
                    <Smartphone size={16} />
                    <span>Pasang Finchat AI ke Layar HP Sekarang</span>
                  </button>
                </div>
              )}

              {/* Already installed banner */}
              {isInstalled && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <CheckCircle2 size={16} className="text-emerald-700" />
                  <span>Aplikasi sudah terpasang di perangkat Anda (Mode Standalone)!</span>
                </div>
              )}

              {/* Step-by-step Guide for Chrome Android */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span>Cara Pasang di HP Android (Google Chrome):</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">
                      1
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">
                        Buka aplikasi ini di browser Chrome di HP Android
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Pastikan Anda membukanya di browser Google Chrome ponsel Anda.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">
                      2
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">
                        Ketuk tombol Titik Tiga (⋮) di pojok kanan atas Chrome
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Menu pengaturan browser akan terbuka.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">
                      3
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">
                        Pilih menu &quot;Tambahkan ke Layar Utama&quot; atau &quot;Instal Aplikasi&quot;
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Ketuk <strong>Instal</strong>. Aplikasi Finchat AI akan otomatis terpasang dengan logo resmi di beranda HP Anda!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* iOS Guide */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Share2 size={13} className="text-blue-600" />
                  Untuk Pengguna iPhone / iPad (Safari):
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Buka di Safari &rarr; Tap ikon <strong>Bagikan (Share)</strong> di bagian bawah &rarr; Pilih <strong>&quot;Tambah ke Layar Utama&quot; (Add to Home Screen)</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tab 2: How to generate native .APK file */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Layers size={18} />
                </div>
                <div className="text-xs leading-relaxed text-blue-950">
                  <strong className="block font-bold text-blue-900 mb-0.5">
                    Generate File .APK Resmi untuk Android
                  </strong>
                  Karena Finchat AI sudah dilengkapi berkas <strong>Web App Manifest</strong> dan <strong>Service Worker</strong> standar Google, Anda dapat meng-generate paket <strong>.APK siap pasang</strong> secara gratis dalam 1 menit via <strong>PWABuilder (Microsoft & Chromium Official Tool)</strong>!
                </div>
              </div>

              {/* App URL Box */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-2">
                <span className="text-[11px] text-slate-400 font-medium block">
                  Link Aplikasi Finchat AI Anda:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentAppUrl}
                    className="flex-1 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono text-emerald-400 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              {/* Step to get APK via PWABuilder */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Langkah Mengunduh File APK:
                </h3>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      1
                    </span>
                    <p className="text-slate-800">
                      Buka layanan <strong>PWABuilder.com</strong> (alat resmi untuk convert PWA menjadi APK / Google Play Package).
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      2
                    </span>
                    <p className="text-slate-800">
                      Tempel URL aplikasi yang disalin di atas, lalu klik <strong>Start</strong>.
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      3
                    </span>
                    <p className="text-slate-800">
                      Pilih <strong>Android</strong> &rarr; Klik <strong>Download Package / APK</strong>. File installer APK akan terunduh dan siap di-install di ponsel Android mana pun!
                    </p>
                  </div>

                  <div className="pt-2">
                    <a
                      href={`https://www.pwabuilder.com?url=${encodeURIComponent(currentAppUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-xs transition-colors shadow-xs"
                    >
                      <span>Buka PWABuilder Sekarang</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Kompatibel dengan Android 5.0+ hingga Android 15+
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
