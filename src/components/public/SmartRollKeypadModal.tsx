import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Delete,
  X,
  ChevronDown,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { toBanglaDigits } from '../../utils/bangla';

interface SmartRollKeypadModalProps {
  isOpen: boolean;
  onClose: () => void;
  roll: string;
  onChangeRoll: (newRoll: string) => void;
  onSubmit: () => void;
  semesterLabel?: string;
  examLabel?: string;
}

// Gentle tactile audio click effect using Web Audio API
function playKeypadSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.035);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.035);
  } catch {}
}

export const SmartRollKeypadModal: React.FC<SmartRollKeypadModalProps> = ({
  isOpen,
  onClose,
  roll,
  onChangeRoll,
  onSubmit,
}) => {
  const [mounted, setMounted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when dialpad is open so mobile doesn't scroll behind it
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

  // Trigger tactile & sound feedback on key press
  const handleKeyInteraction = () => {
    if (soundEnabled) {
      playKeypadSound();
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(12);
      } catch {}
    }
  };

  const handleDigitPress = (digit: string) => {
    handleKeyInteraction();
    // Maximum 10 digits for student roll/registration
    if (roll.length < 10) {
      onChangeRoll(roll + digit);
    }
  };

  const handleBackspace = () => {
    handleKeyInteraction();
    if (roll.length > 0) {
      onChangeRoll(roll.slice(0, -1));
    }
  };

  const handleClear = () => {
    handleKeyInteraction();
    onChangeRoll('');
  };

  const handleSearchSubmit = () => {
    handleKeyInteraction();
    if (roll.trim().length > 0) {
      onClose();
      onSubmit();
    }
  };

  // Capture physical keyboard numbers & backspace when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSearchSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, roll]);

  // Dismiss any native mobile virtual keyboard when open without shifting scroll
  useEffect(() => {
    if (isOpen) {
      if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, [isOpen]);

  const keypadButtons = [
    { num: '1', bn: '১', sub: 'START' },
    { num: '2', bn: '২', sub: 'ABC' },
    { num: '3', bn: '৩', sub: 'DEF' },
    { num: '4', bn: '৪', sub: 'GHI' },
    { num: '5', bn: '৫', sub: 'JKL' },
    { num: '6', bn: '৬', sub: 'MNO' },
    { num: '7', bn: '৭', sub: 'PQRS' },
    { num: '8', bn: '৮', sub: 'TUV' },
    { num: '9', bn: '৯', sub: 'WXYZ' },
  ];

  const markup = (
    <AnimatePresence>
      {isOpen && (
        <div
          id="smart-roll-keypad-container"
          className="fixed inset-0 z-[9999] flex items-end justify-center pointer-events-auto font-bengali"
        >
          {/* Subtle Non-Obscuring Backdrop Overlay */}
          <motion.div
            id="smart-roll-keypad-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Smart Dialpad Drawer: Slides up reliably from bottom */}
          <motion.div
            id="smart-roll-keypad-drawer"
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-md bg-white rounded-t-[28px] sm:rounded-t-[32px] shadow-[0_-16px_50px_rgba(15,23,42,0.28)] z-10 flex flex-col border-t border-slate-200/90 pb-safe sm:pb-3 max-h-[92dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Drag / Swipe Handle */}
            <div className="pt-2 pb-1 flex justify-center shrink-0 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1.5 rounded-full bg-slate-300" />
            </div>

            {/* Unified Roll Preview & Controls Bar */}
            <div className="px-3.5 sm:px-4 pb-2 flex items-center gap-1.5 shrink-0">
              <div className="flex-1 h-11 sm:h-12 px-3 rounded-xl bg-slate-100/90 border border-slate-200 flex items-center justify-between gap-2 overflow-hidden">
                <div className="flex items-center gap-1 min-w-0">
                  {roll.length > 0 ? (
                    <>
                      <span className="text-xl sm:text-2xl font-black font-outfit tracking-wider text-slate-900 tabular-nums truncate">
                        {roll}
                      </span>
                      <span className="w-0.5 h-5 bg-blue-600 rounded-full animate-pulse shrink-0" />
                    </>
                  ) : (
                    <>
                      <span className="text-xs sm:text-sm font-bold text-slate-400 truncate">
                        রোল নম্বর লিখুন...
                      </span>
                      <span className="w-0.5 h-4 bg-blue-500 rounded-full animate-pulse shrink-0" />
                    </>
                  )}
                </div>

                {roll.length > 0 && (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs font-bold text-blue-700 bg-blue-100/90 px-2.5 py-0.5 rounded-md border border-blue-200 font-bengali">
                      {toBanglaDigits(roll)}
                    </span>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                      title="সব মুছুন"
                    >
                      <X className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                )}
              </div>

              {/* Sound Toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'সাউন্ড বন্ধ করুন' : 'সাউন্ড চালু করুন'}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  soundEnabled
                    ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs'
                    : 'bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-200'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
              </button>

              {/* Close / Slide Down Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="ডায়াল প্যাড বন্ধ করুন"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Smart 1-2-3 Dialpad Keypad Grid */}
            <div className="px-3.5 sm:px-4 py-1 shrink-0">
              <div className="grid grid-cols-3 gap-2">
                {/* Digits 1 to 9 */}
                {keypadButtons.map((btn) => (
                  <button
                    key={btn.num}
                    type="button"
                    onClick={() => handleDigitPress(btn.num)}
                    className="group relative flex flex-col items-center justify-center h-12 sm:h-13 rounded-xl sm:rounded-2xl bg-slate-50/90 hover:bg-blue-50 active:bg-blue-100 border border-slate-200 hover:border-blue-400 shadow-2xs transition-all duration-75 active:scale-[0.95] cursor-pointer"
                  >
                    <span className="text-xl sm:text-2xl font-black font-outfit text-slate-900 group-hover:text-blue-700 transition-colors leading-none">
                      {btn.num}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 tracking-wider font-outfit mt-0.5 leading-none">
                      {btn.bn} • {btn.sub}
                    </span>
                  </button>
                ))}

                {/* Bottom Row: Clear (C), 0, Backspace (⌫) */}
                {/* Key: Clear */}
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex flex-col items-center justify-center h-12 sm:h-13 rounded-xl sm:rounded-2xl bg-rose-50/60 hover:bg-rose-100 active:bg-rose-200 text-slate-700 hover:text-rose-700 border border-rose-200 shadow-2xs transition-all duration-75 active:scale-[0.95] cursor-pointer"
                  title="সব মুছে ফেলুন"
                >
                  <span className="text-lg sm:text-xl font-black font-outfit text-rose-700 leading-none">C</span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-rose-600 tracking-wider uppercase mt-0.5 leading-none font-outfit">
                    CLEAR
                  </span>
                </button>

                {/* Key: 0 */}
                <button
                  type="button"
                  onClick={() => handleDigitPress('0')}
                  className="group flex flex-col items-center justify-center h-12 sm:h-13 rounded-xl sm:rounded-2xl bg-slate-50/90 hover:bg-blue-50 active:bg-blue-100 border border-slate-200 hover:border-blue-400 shadow-2xs transition-all duration-75 active:scale-[0.95] cursor-pointer"
                >
                  <span className="text-xl sm:text-2xl font-black font-outfit text-slate-900 group-hover:text-blue-700 transition-colors leading-none">
                    0
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 tracking-wider font-outfit mt-0.5 leading-none">
                    ০ • ZERO
                  </span>
                </button>

                {/* Key: Backspace (Delete) */}
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="flex flex-col items-center justify-center h-12 sm:h-13 rounded-xl sm:rounded-2xl bg-amber-50/60 hover:bg-amber-100 active:bg-amber-200 text-slate-700 hover:text-amber-800 border border-amber-200 shadow-2xs transition-all duration-75 active:scale-[0.95] cursor-pointer"
                  title="একটি সংখ্যা মুছুন"
                >
                  <Delete className="w-5 h-5 text-amber-700 stroke-[2.2]" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-amber-700 tracking-wider uppercase mt-0.5 leading-none font-outfit">
                    DELETE
                  </span>
                </button>
              </div>
            </div>

            {/* Primary Action Button: ফলাফল অনুসন্ধান করুন */}
            <div className="px-3.5 sm:px-4 pt-1.5 pb-2.5 sm:pb-3 shrink-0">
              <button
                type="button"
                onClick={handleSearchSubmit}
                disabled={roll.trim().length === 0}
                className={`w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer ${
                  roll.trim().length > 0
                    ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25 ring-1 ring-blue-400/30'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                <span>ফলাফল অনুসন্ধান করুন</span>
                {roll.trim().length > 0 && (
                  <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-outfit font-bold">
                    {roll}
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted || typeof document === 'undefined') {
    return markup;
  }

  return createPortal(markup, document.body);
};
