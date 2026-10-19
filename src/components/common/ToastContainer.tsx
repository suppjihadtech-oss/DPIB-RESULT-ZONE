import React, { useEffect, useState } from 'react';
import { ToastItem, ToastType } from '../../types';

interface ToastContainerProps {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div 
      role="region" 
      aria-label="নোটিফিকেশন বার্তা"
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2.5 items-center w-full max-w-[92vw] sm:max-w-[460px] pointer-events-none transition-all duration-300"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

interface ToastCardProps {
  toast: ToastItem;
  onClose: (id: string) => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [progress, setProgress] = useState(100);

  const duration = toast.duration || 4200;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 40);

    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => {
        onClose(toast.id);
      }, 200);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [toast.id, duration, onClose]);

  const handleManualClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 180);
  };

  const getStyleConfig = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          wrapper: 'border-emerald-500/30 bg-emerald-950/90 text-white shadow-emerald-900/20 shadow-lg backdrop-blur-xl',
          iconWrapper: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
          titleColor: 'text-emerald-300',
          progressBar: 'bg-emerald-400',
          closeHover: 'hover:bg-emerald-500/20 text-emerald-200'
        };
      case 'error':
        return {
          wrapper: 'border-rose-500/30 bg-rose-950/90 text-white shadow-rose-900/20 shadow-lg backdrop-blur-xl',
          iconWrapper: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
          titleColor: 'text-rose-300',
          progressBar: 'bg-rose-400',
          closeHover: 'hover:bg-rose-500/20 text-rose-200'
        };
      case 'info':
      default:
        return {
          wrapper: 'border-sky-500/30 bg-slate-900/90 text-white shadow-sky-900/20 shadow-lg backdrop-blur-xl',
          iconWrapper: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
          titleColor: 'text-sky-300',
          progressBar: 'bg-sky-400',
          closeHover: 'hover:bg-sky-500/20 text-slate-300'
        };
    }
  };

  const styles = getStyleConfig(toast.type);

  return (
    <div
      className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 transition-all duration-300 ease-out ${
        styles.wrapper
      } ${
        isClosing
          ? 'opacity-0 scale-95 -translate-y-2'
          : 'opacity-100 scale-100 translate-y-0'
      }`}
      role="alert"
    >
      <div className="flex items-start gap-3.5">
        {/* SVG Icon Container - No emoji! */}
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles.iconWrapper}`}>
          {toast.type === 'success' && (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.2"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}

          {toast.type === 'error' && (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.2"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}

          {toast.type === 'info' && (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0 pr-1">
          {toast.title && (
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${styles.titleColor}`}>
              {toast.title}
            </h4>
          )}
          <p className="text-sm font-medium leading-relaxed break-words text-slate-100">
            {toast.message}
          </p>
        </div>

        {/* Circular Close Button */}
        <button
          type="button"
          onClick={handleManualClose}
          aria-label="নোটিফিকেশন বন্ধ করুন"
          className={`shrink-0 -mr-1 -mt-1 p-1.5 rounded-full transition-colors cursor-pointer ${styles.closeHover}`}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Expiry Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <div
          className={`h-full transition-all duration-75 linear ${styles.progressBar}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
