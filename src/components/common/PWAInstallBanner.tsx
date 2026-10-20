import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('dpib_pwa_banner_dismissed') === 'true';
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  if (!isInstallable || isInstalled || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('dpib_pwa_banner_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    const success = await promptInstall();
    if (success) {
      setDismissed(true);
    }
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-white/80 backdrop-blur-2xl backdrop-saturate-180 rounded-3xl p-4 shadow-[0_16px_40px_rgba(15,23,42,0.16),0_1px_0_1px_rgba(255,255,255,0.9)_inset] ring-1 ring-black/5 border border-white/80 animate-slideUp font-bengali">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-blue-600/90 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/25">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span>অ্যাপ হিসেবে ইনস্টল করুন</span>
              <span className="px-1.5 py-0.5 bg-blue-50/90 text-blue-700 text-[10px] font-black rounded-lg border border-blue-200/60 font-outfit">PWA</span>
            </h4>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-600 font-medium mt-1 leading-relaxed">
            এক ক্লিকে আপনার ফোনে সরাসরি হোমস্ক্রিনে যুক্ত করুন দ্রুত লোডিং এবং অফলাইন সুবিধার জন্য।
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstallClick}
              className="py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ইনস্টল করুন</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="py-1.5 px-2.5 text-slate-500 hover:text-slate-800 text-xs font-semibold rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
            >
              এখন না
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
