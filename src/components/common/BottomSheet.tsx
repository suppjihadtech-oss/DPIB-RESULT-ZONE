import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxHeight?: string;
  showCloseButton?: boolean;
  zIndex?: string;
  compact?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxHeight,
  showCloseButton = true,
  zIndex = 'z-[9999]',
  compact = false,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const resolvedMaxHeight =
    maxHeight || (compact ? 'max-h-[56dvh] sm:max-h-[76vh]' : 'max-h-[72dvh] sm:max-h-[85vh]');

  const sheetMarkup = (
    <AnimatePresence>
      {isOpen && (
        <div
          id="bottom-sheet-container"
          className={`fixed inset-0 ${zIndex} flex items-end sm:items-center justify-center pointer-events-auto font-bengali`}
        >
          {/* iOS-Style Backdrop blur overlay (lighter in compact mode so top screen remains visible) */}
          <motion.div
            id="bottom-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className={`fixed inset-0 transition-opacity ${
              compact
                ? 'bg-gradient-to-t from-slate-950/35 via-slate-900/15 to-slate-950/5 backdrop-blur-[2px]'
                : 'bg-slate-950/45 backdrop-blur-md'
            }`}
            onClick={onClose}
          />

          {/* iOS Frosted Glass Sheet Modal */}
          <motion.div
            id="bottom-sheet-content"
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={`relative w-full max-w-4xl bg-white/95 sm:bg-white/95 backdrop-blur-2xl backdrop-saturate-180 ${
              compact ? 'rounded-t-[28px] sm:rounded-[28px]' : 'rounded-t-[36px] sm:rounded-[32px]'
            } shadow-[0_-16px_50px_rgba(15,23,42,0.22),0_1px_0_1px_rgba(255,255,255,0.9)_inset] z-10 flex flex-col ${resolvedMaxHeight} overflow-hidden border-t sm:border border-white/80 ring-1 ring-black/5 sm:m-4`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* iOS Capsule Drag Handle */}
            <div className={`${compact ? 'pt-2 pb-0.5' : 'pt-3 pb-1'} flex justify-center shrink-0`}>
              <div
                className={`${
                  compact ? 'w-10 h-1' : 'w-12 h-1.5'
                } bg-slate-300/85 hover:bg-slate-400/80 rounded-full mx-auto transition-colors cursor-grab`}
              />
            </div>

            {/* Translucent Glass Header */}
            {(title || showCloseButton) && (
              <div
                className={`flex items-center justify-between ${
                  compact ? 'px-4 sm:px-7 py-2.5 sm:py-3' : 'px-6 sm:px-10 py-3.5'
                } border-b border-slate-200/50 bg-white/60 backdrop-blur-md shrink-0`}
              >
                <div className="min-w-0 pr-4">
                  {title && (
                    <h3
                      className={`${
                        compact ? 'text-base sm:text-xl' : 'text-lg sm:text-2xl'
                      } font-black text-slate-900 tracking-tight truncate`}
                    >
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p
                      className={`${
                        compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'
                      } text-slate-600 font-medium mt-0.5 truncate`}
                    >
                      {subtitle}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    id="btn-close-bottom-sheet"
                    onClick={onClose}
                    className={`${
                      compact ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-8 h-8 sm:w-9 sm:h-9'
                    } rounded-full bg-slate-200/70 hover:bg-slate-300 active:scale-95 text-slate-600 hover:text-slate-950 flex items-center justify-center transition-all border border-white/60 shadow-xs cursor-pointer shrink-0`}
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </button>
                )}
              </div>
            )}

            {/* Scrollable Content */}
            <div
              className={`flex-1 overflow-y-auto ${
                compact ? 'px-3 sm:px-6 py-2.5 sm:py-4' : 'px-5 sm:px-10 py-5'
              }`}
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted || typeof document === 'undefined') {
    return sheetMarkup;
  }

  return createPortal(sheetMarkup, document.body);
};
