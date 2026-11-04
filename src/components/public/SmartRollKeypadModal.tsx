import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Delete,
  X,
  ChevronDown,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  GraduationCap,
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
  semesterLabel,
  examLabel,
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

  // Lock background scroll and dismiss any native mobile virtual keyboard when open
  useEffect(() => {
    if (isOpen) {
      if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
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
          {/* Frosted Glass Backdrop Overlay */}
          <motion.div
            id="smart-roll-keypad-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Premium Dialpad Drawer: Slides up from bottom */}
          <motion.div
            id="smart-roll-keypad-drawer"
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-md sm:max-w-lg bg-white/95 sm:bg-white/95 backdrop-blur-2xl backdrop-saturate-200 rounded-t-[36px] sm:rounded-t-[40px] shadow-[0_-20px_60px_rgba(15,23,42,0.3),0_1px_0_1px_rgba(255,255,255,0.9)_inset] z-10 flex flex-col overflow-hidden border-t border-white/80 select-none pb-safe"
            style={{ maxHeight: '92vh' }}
          >
            {/* Top Swipe Indicator Handle */}
            <div className="pt-3 pb-1 flex justify-center">
              <div className="w-12 h-1.5 rounded-full bg-slate-300/90" />
            </div>

            {/* Header: Title, Sound Toggle & Close Button */}
            <div className="px-5 sm:px-6 pt-1 pb-2 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/70 text-blue-600 flex items-center justify-center shadow-2xs">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    স্মার্ট রোল ডায়াল প্যাড
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-outfit">
                    SMART NUMERIC KEYPAD
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Sound Toggle */}
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? 'সাউন্ড বন্ধ করুন' : 'সাউন্ড চালু করুন'}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    soundEnabled
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                      : 'bg-slate-100 text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                {/* Close / Slide Down Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                  title="কিবোর্ড নামিয়ে রাখুন"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Context Badges (Semester & Exam context) */}
            {(semesterLabel || examLabel) && (
              <div className="px-5 sm:px-6 pt-2 flex items-center gap-2 overflow-x-auto text-[11px] text-slate-500 font-semibold no-scrollbar">
                <span className="shrink-0 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200/70 text-slate-700 font-bold">
                  <GraduationCap className="w-3 h-3 text-blue-600" />
                  <span>{semesterLabel || 'সকল সেমিস্টার'}</span>
                </span>
                <span className="shrink-0 truncate px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200/70 text-slate-700 font-bold">
                  {examLabel || 'সকল পরীক্ষা'}
                </span>
              </div>
            )}

            {/* Large Roll Display Screen with Cursor */}
            <div className="px-5 sm:px-6 pt-3 pb-2">
              <div className="bg-gradient-to-b from-slate-50/90 to-blue-50/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-inner flex flex-col items-center justify-center relative min-h-[85px] sm:min-h-[95px]">
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase font-outfit mb-1">
                  ENTERED ROLL NUMBER
                </span>

                {/* Big Formatted Digits Display */}
                <div className="flex items-center justify-center gap-1 sm:gap-1.5 min-h-[36px]">
                  {roll.length > 0 ? (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-3xl sm:text-4xl font-black font-outfit tracking-widest text-slate-900 tabular-nums">
                        {roll}
                      </span>
                      {/* Blinking smooth cursor */}
                      <span className="w-0.5 sm:w-1 h-7 sm:h-9 bg-blue-600 rounded-full animate-pulse" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-slate-400 font-bold text-lg sm:text-xl">
                      <span>আপনার রোল নম্বর টাইপ করুন</span>
                      <span className="w-0.5 sm:w-1 h-6 sm:h-7 bg-blue-500 rounded-full animate-pulse ml-1" />
                    </div>
                  )}
                </div>

                {/* Bangla Translation of Roll */}
                {roll.length > 0 && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full border border-blue-200/60 font-bengali">
                      বাংলা: {toBanglaDigits(roll)}
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold font-outfit">
                      ({roll.length} DIGITS)
                    </span>
                  </div>
                )}

                {/* Quick Clear Button (Appears when roll > 0) */}
                {roll.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-3 top-3 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold border border-rose-200 flex items-center gap-1 transition-all cursor-pointer"
                    title="সব মুছুন"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>মুছুন</span>
                  </button>
                )}
              </div>
            </div>

            {/* Smart 1-2-3 Dialpad Keypad Grid */}
            <div className="px-5 sm:px-6 py-2">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {/* Digits 1 to 9 */}
                {keypadButtons.map((btn) => (
                  <button
                    key={btn.num}
                    type="button"
                    onClick={() => handleDigitPress(btn.num)}
                    className="group relative flex flex-col items-center justify-center py-3.5 sm:py-4 rounded-2xl sm:rounded-3xl bg-white hover:bg-slate-50/90 active:bg-blue-100/80 border border-slate-200/90 hover:border-blue-300 shadow-2xs hover:shadow-xs transition-all duration-150 active:scale-[0.92] cursor-pointer"
                  >
                    <span className="text-2xl sm:text-3xl font-black font-outfit text-slate-900 group-hover:text-blue-600 transition-colors leading-none">
                      {btn.num}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 tracking-wider font-outfit mt-1 leading-none">
                      {btn.bn} • {btn.sub}
                    </span>
                  </button>
                ))}

                {/* Bottom Row: Clear (C), 0, Backspace (⌫) */}

                {/* Key: Clear / 00 */}
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex flex-col items-center justify-center py-3.5 sm:py-4 rounded-2xl sm:rounded-3xl bg-slate-50 hover:bg-rose-50 active:bg-rose-100 text-slate-700 hover:text-rose-700 border border-slate-200/90 hover:border-rose-300 shadow-2xs transition-all duration-150 active:scale-[0.92] cursor-pointer"
                  title="সব মুছে ফেলুন"
                >
                  <span className="text-xl sm:text-2xl font-black font-outfit leading-none">C</span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 tracking-wider uppercase mt-1 leading-none font-outfit">
                    CLEAR
                  </span>
                </button>

                {/* Key: 0 */}
                <button
                  type="button"
                  onClick={() => handleDigitPress('0')}
                  className="group flex flex-col items-center justify-center py-3.5 sm:py-4 rounded-2xl sm:rounded-3xl bg-white hover:bg-slate-50/90 active:bg-blue-100/80 border border-slate-200/90 hover:border-blue-300 shadow-2xs hover:shadow-xs transition-all duration-150 active:scale-[0.92] cursor-pointer"
                >
                  <span className="text-2xl sm:text-3xl font-black font-outfit text-slate-900 group-hover:text-blue-600 transition-colors leading-none">
                    0
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 tracking-wider font-outfit mt-1 leading-none">
                    ০ • ZERO
                  </span>
                </button>

                {/* Key: Backspace (Delete) */}
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="flex flex-col items-center justify-center py-3.5 sm:py-4 rounded-2xl sm:rounded-3xl bg-slate-50 hover:bg-amber-50 active:bg-amber-100 text-slate-700 hover:text-amber-700 border border-slate-200/90 hover:border-amber-300 shadow-2xs transition-all duration-150 active:scale-[0.92] cursor-pointer"
                  title="একটি সংখ্যা মুছুন"
                >
                  <Delete className="w-6 h-6 stroke-[2.2]" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 tracking-wider uppercase mt-1 leading-none font-outfit">
                    DELETE
                  </span>
                </button>
              </div>
            </div>

            {/* Primary Action Button: ফলাফল অনুসন্ধান করুন */}
            <div className="px-5 sm:px-6 pt-2 pb-4 sm:pb-6">
              <button
                type="button"
                onClick={handleSearchSubmit}
                disabled={roll.trim().length === 0}
                className={`w-full py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-98 cursor-pointer ${
                  roll.trim().length > 0
                    ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/30 ring-2 ring-blue-400/30'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <Search className="w-5 h-5 stroke-[2.5]" />
                <span>ফলাফল অনুসন্ধান করুন</span>
                {roll.trim().length > 0 && (
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-outfit font-bold ml-1">
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
