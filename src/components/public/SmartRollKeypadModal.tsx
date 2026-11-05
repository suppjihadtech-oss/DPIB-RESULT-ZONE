import React, { useEffect, useState } from 'react';
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
  const [soundEnabled, setSoundEnabled] = useState(true);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="smart-roll-keypad-container"
          className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto font-bengali"
        >
          {/* Subtle Non-Obscuring Backdrop Overlay (keeps upper 55%+ of screen crystal clear) */}
          <motion.div
            id="smart-roll-keypad-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-gradient-to-t from-slate-950/25 via-slate-900/5 to-transparent touch-none"
            onClick={onClose}
          />

          {/* Compact Smart Dialpad Drawer: Strictly < 50% of mobile screen height */}
          <motion.div
            id="smart-roll-keypad-drawer"
            initial={{ y: '100%', opacity: 0.75 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 360 }}
            className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl backdrop-saturate-200 rounded-t-[26px] sm:rounded-t-[30px] shadow-[0_-10px_35px_rgba(15,23,42,0.16),0_1px_0_1px_rgba(255,255,255,0.95)_inset] z-10 flex flex-col overflow-hidden border-t border-slate-200/90 select-none touch-none pb-safe max-h-[46dvh]"
          >
            {/* Compact Top Swipe Handle */}
            <div className="pt-1.5 pb-1 flex justify-center shrink-0">
              <div className="w-9 h-1 rounded-full bg-slate-300/90" />
            </div>

            {/* Unified Compact Roll Preview & Controls Bar */}
            <div className="px-3 sm:px-4 pb-1.5 flex items-center gap-1.5 shrink-0">
              <div className="flex-1 h-10 sm:h-11 px-3 rounded-xl bg-slate-100/90 border border-slate-200/80 flex items-center justify-between gap-2 overflow-hidden">
                <div className="flex items-center gap-1 min-w-0">
                  {roll.length > 0 ? (
                    <>
                      <span className="text-lg sm:text-xl font-black font-outfit tracking-wider text-slate-900 tabular-nums truncate">
                        {roll}
                      </span>
                      <span className="w-0.5 h-5 bg-blue-600 rounded-full animate-pulse shrink-0" />
                    </>
                  ) : (
                    <>
                      <span className="text-xs sm:text-sm font-bold text-slate-400 truncate">
                        রোল নম্বর টাইপ করুন...
                      </span>
                      <span className="w-0.5 h-4 bg-blue-500 rounded-full animate-pulse shrink-0" />
                    </>
                  )}
                </div>

                {roll.length > 0 && (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md border border-blue-200/60 font-bengali">
                      {toBanglaDigits(roll)}
                    </span>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="w-6 h-6 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                      title="সব মুছুন"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                )}
              </div>

              {/* Sound Toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'সাউন্ড বন্ধ করুন' : 'সাউন্ড চালু করুন'}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  soundEnabled
                    ? 'bg-blue-50 text-blue-700 border border-blue-200/70'
                    : 'bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-200/60'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Close / Slide Down Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/60 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="কিবোর্ড নামিয়ে রাখুন"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Compact Smart 1-2-3 Dialpad Keypad Grid */}
            <div className="px-3 sm:px-4 py-1 shrink-0">
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {/* Digits 1 to 9 */}
                {keypadButtons.map((btn) => (
                  <button
                    key={btn.num}
                    type="button"
                    onClick={() => handleDigitPress(btn.num)}
                    className="group relative flex flex-col items-center justify-center h-10 sm:h-11 rounded-xl sm:rounded-2xl bg-white hover:bg-slate-50/90 active:bg-blue-100/80 border border-slate-200/90 hover:border-blue-300 shadow-2xs transition-all duration-100 active:scale-[0.94] cursor-pointer"
                  >
                    <span className="text-lg sm:text-xl font-black font-outfit text-slate-900 group-hover:text-blue-600 transition-colors leading-none">
                      {btn.num}
                    </span>
                    <span className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-500 tracking-wider font-outfit mt-0.5 leading-none">
                      {btn.bn} • {btn.sub}
                    </span>
                  </button>
                ))}

                {/* Bottom Row: Clear (C), 0, Backspace (⌫) */}

                {/* Key: Clear */}
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex flex-col items-center justify-center h-10 sm:h-11 rounded-xl sm:rounded-2xl bg-slate-50 hover:bg-rose-50 active:bg-rose-100 text-slate-700 hover:text-rose-700 border border-slate-200/90 hover:border-rose-300 shadow-2xs transition-all duration-100 active:scale-[0.94] cursor-pointer"
                  title="সব মুছে ফেলুন"
                >
                  <span className="text-base sm:text-lg font-black font-outfit leading-none">C</span>
                  <span className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-500 tracking-wider uppercase mt-0.5 leading-none font-outfit">
                    CLEAR
                  </span>
                </button>

                {/* Key: 0 */}
                <button
                  type="button"
                  onClick={() => handleDigitPress('0')}
                  className="group flex flex-col items-center justify-center h-10 sm:h-11 rounded-xl sm:rounded-2xl bg-white hover:bg-slate-50/90 active:bg-blue-100/80 border border-slate-200/90 hover:border-blue-300 shadow-2xs transition-all duration-100 active:scale-[0.94] cursor-pointer"
                >
                  <span className="text-lg sm:text-xl font-black font-outfit text-slate-900 group-hover:text-blue-600 transition-colors leading-none">
                    0
                  </span>
                  <span className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-500 tracking-wider font-outfit mt-0.5 leading-none">
                    ০ • ZERO
                  </span>
                </button>

                {/* Key: Backspace (Delete) */}
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="flex flex-col items-center justify-center h-10 sm:h-11 rounded-xl sm:rounded-2xl bg-slate-50 hover:bg-amber-50 active:bg-amber-100 text-slate-700 hover:text-amber-700 border border-slate-200/90 hover:border-amber-300 shadow-2xs transition-all duration-100 active:scale-[0.94] cursor-pointer"
                  title="একটি সংখ্যা মুছুন"
                >
                  <Delete className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                  <span className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-500 tracking-wider uppercase mt-0.5 leading-none font-outfit">
                    DELETE
                  </span>
                </button>
              </div>
            </div>

            {/* Compact Primary Action Button: ফলাফল অনুসন্ধান করুন */}
            <div className="px-3 sm:px-4 pt-1 pb-2.5 sm:pb-3.5 shrink-0">
              <button
                type="button"
                onClick={handleSearchSubmit}
                disabled={roll.trim().length === 0}
                className={`w-full h-10 sm:h-11 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 cursor-pointer ${
                  roll.trim().length > 0
                    ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25 ring-1 ring-blue-400/30'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                <span>ফলাফল অনুসন্ধান করুন</span>
                {roll.trim().length > 0 && (
                  <span className="bg-white/20 text-white text-[11px] px-2 py-0.5 rounded-full font-outfit font-bold">
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
};
