import React from 'react';
import { Smartphone, Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenModal: () => void;
  className?: string;
  variant?: 'header' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onOpenModal,
  className = '',
  variant = 'header',
}) => {
  const { isInstalled } = usePWAInstall();

  // If already running in standalone PWA mode, we can show a lighter subtle indicator or hide it
  if (isInstalled && variant === 'header') {
    return null;
  }

  if (variant === 'card') {
    return (
      <button
        type="button"
        onClick={onOpenModal}
        className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 group active:scale-98 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Smartphone size={20} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
              Pasang Aplikasi / Buat APK Android
            </h3>
            <p className="text-[11px] text-slate-500">
              Instal di HP Android tanpa Play Store atau unduh paket file .apk
            </p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center gap-1 group-hover:bg-emerald-100 transition-colors">
          <span>Buka</span>
          <Download size={13} />
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenModal}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all active:scale-95 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xs ${className}`}
      title="Pasang Aplikasi ke Ponsel / Buat APK"
    >
      <Smartphone size={13} />
      <span className="hidden sm:inline">Pasang APK / App</span>
      <span className="sm:hidden">App</span>
    </button>
  );
};
