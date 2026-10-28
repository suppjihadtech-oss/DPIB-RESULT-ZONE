import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  AlertTriangle,
  Info,
  Loader2,
  X,
} from 'lucide-react';
import { useToast, ToastItem, ToastType } from '../../context/ToastContext';

interface GlassToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}

const GlassToastCard: React.FC<GlassToastCardProps> = ({
  toast,
  onDismiss,
  onPause,
  onResume,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const remainingRef = useRef(toast.duration);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-dismiss: SUCCESS & INFO = 5s, ERROR & WARNING = 7s, with pause-on-hover
  useEffect(() => {
    if (toast.duration <= 0 || toast.type === 'LOADING') {
      return;
    }

    if (!isHovered) {
      startTimeRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        onDismiss(toast.id);
      }, remainingRef.current);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      const elapsed = Date.now() - startTimeRef.current;
      remainingRef.current = Math.max(500, remainingRef.current - elapsed);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [toast.id, toast.duration, toast.type, isHovered, onDismiss]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    onPause(toast.id);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onResume(toast.id);
  };

  // iOS-style compact icon configuration (consistent size, stroke, alignment)
  const getTypeConfig = (type: ToastType) => {
    switch (type) {
      case 'SUCCESS':
        return {
          icon: <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={2.5} />,
          iconBg: 'bg-emerald-50/90 border-emerald-200/80 shadow-xs shadow-emerald-500/10',
          borderHover: 'hover:border-emerald-300',
        };
      case 'ERROR':
        return {
          icon: <X className="w-3.5 h-3.5 text-rose-600 shrink-0" strokeWidth={2.5} />,
          iconBg: 'bg-rose-50/90 border-rose-200/80 shadow-xs shadow-rose-500/10',
          borderHover: 'hover:border-rose-300',
        };
      case 'WARNING':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" strokeWidth={2.3} />,
          iconBg: 'bg-amber-50/90 border-amber-200/80 shadow-xs shadow-amber-500/10',
          borderHover: 'hover:border-amber-300',
        };
      case 'LOADING':
        return {
          icon: <Loader2 className="w-3.5 h-3.5 text-teal-600 shrink-0 animate-spin" strokeWidth={2.3} />,
          iconBg: 'bg-teal-50/90 border-teal-200/80 shadow-xs shadow-teal-500/10',
          borderHover: 'hover:border-teal-300',
        };
      case 'INFO':
      default:
        return {
          icon: <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" strokeWidth={2.3} />,
          iconBg: 'bg-sky-50/90 border-sky-200/80 shadow-xs shadow-sky-500/10',
          borderHover: 'hover:border-sky-300',
        };
    }
  };

  const config = getTypeConfig(toast.type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -18, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.95, transition: { duration: 0.16, ease: 'easeOut' } }}
      transition={{ type: 'spring', damping: 28, stiffness: 420 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`pointer-events-auto relative w-full rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/80 text-slate-900 shadow-[0_10px_28px_rgba(15,23,42,0.10),0_1px_3px_rgba(0,0,0,0.04)] px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-center gap-2.5 select-none transition-colors duration-150 ${config.borderHover}`}
      role="alert"
      aria-live="assertive"
    >
      {/* Refined SVG Status Icon Badge */}
      <div
        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${config.iconBg}`}
      >
        {config.icon}
      </div>

      {/* Compact Single-line Message (truncated on overflow, no description, no second line) */}
      <span className="flex-1 min-w-0 text-xs sm:text-[13px] font-semibold text-slate-800 font-bengali truncate leading-normal">
        {toast.message}
      </span>

      {/* Optional Single-line Action Button */}
      {toast.action && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toast.action?.onClick();
            onDismiss(toast.id);
          }}
          className="px-2 py-0.5 text-[11px] font-bold text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-md shrink-0 transition-colors uppercase font-outfit cursor-pointer"
        >
          {toast.action.label}
        </button>
      )}

      {/* iOS-style Crisp SVG Close Cross Button (×) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(toast.id);
        }}
        aria-label="CLOSE"
        className="p-1 -mr-0.5 text-slate-400 hover:text-slate-700 active:text-slate-900 rounded-lg hover:bg-slate-100/70 active:scale-90 transition-all cursor-pointer shrink-0 flex items-center justify-center"
      >
        <X className="w-3.5 h-3.5" strokeWidth={2.4} />
      </button>
    </motion.div>
  );
};

export const GlassToastContainer: React.FC = () => {
  const { toasts, dismiss, pauseToast, resumeToast } = useToast();

  return (
    <div
      aria-label="NOTIFICATIONS"
      className="fixed z-[9999] pointer-events-none top-3 sm:top-4 inset-x-0 mx-auto px-4 w-full max-w-sm sm:max-w-md flex flex-col items-center gap-2"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {toasts.map((toastItem) => (
          <GlassToastCard
            key={toastItem.id}
            toast={toastItem}
            onDismiss={dismiss}
            onPause={pauseToast}
            onResume={resumeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
