import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxHeight?: string;
  showCloseButton?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = 'max-h-[90vh]',
  showCloseButton = true,
}) => {
  // Lock body scroll when bottom sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="bottom-sheet-container" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-auto font-bengali">
          {/* iOS-Style Backdrop blur overlay */}
          <motion.div
            id="bottom-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity"
            onClick={onClose}
          />

          {/* iOS Frosted Glass Sheet Modal */}
          <motion.div
            id="bottom-sheet-content"
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={`relative w-full max-w-4xl bg-white/85 sm:bg-white/90 backdrop-blur-2xl backdrop-saturate-180 rounded-t-[36px] sm:rounded-[32px] shadow-[0_-20px_60px_rgba(15,23,42,0.2),0_1px_0_1px_rgba(255,255,255,0.9)_inset] z-10 flex flex-col ${maxHeight} overflow-hidden border-t sm:border border-white/80 ring-1 ring-black/5 sm:m-4`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* iOS Capsule Drag Handle */}
            <div className="pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-12 h-1.5 bg-slate-300/80 hover:bg-slate-400/80 rounded-full mx-auto transition-colors cursor-grab" />
            </div>

            {/* Translucent Glass Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-6 sm:px-10 py-3.5 border-b border-slate-200/50 bg-white/40 backdrop-blur-md shrink-0">
                <div className="min-w-0 pr-4">
                  {title && (
                    <h3 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    id="btn-close-bottom-sheet"
                    onClick={onClose}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-200/60 hover:bg-slate-300/70 active:scale-95 text-slate-600 hover:text-slate-950 flex items-center justify-center transition-all border border-white/60 shadow-xs cursor-pointer shrink-0"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-10 py-5">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
