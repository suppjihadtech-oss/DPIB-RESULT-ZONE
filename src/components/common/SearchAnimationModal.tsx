import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Database, UserCheck, FileCheck, Sparkles, BookOpen } from 'lucide-react';
import { toBanglaDigits } from '../../utils/bangla';

interface SearchAnimationModalProps {
  isActive: boolean;
  status: 'searching' | 'success' | 'not_found';
  onComplete: () => void;
  onCancel?: () => void;
  roll?: string;
}

const SEARCH_STEPS = [
  { text: 'ফলাফল অনুসন্ধান করা হচ্ছে...', subtext: 'ক্লাউড ডেটাবেস সংযোগ স্থাপিত হচ্ছে', icon: Search },
  { text: 'রোল ও সেমিস্টার তথ্য যাচাই করা হচ্ছে...', subtext: 'শিক্ষার্থীর একাডেমিক রেকর্ড মিলানো হচ্ছে', icon: UserCheck },
  { text: 'বিষয়ভিত্তিক নম্বর ও গ্রেড প্রস্তুত হচ্ছে...', subtext: 'কারিগরি বোর্ড স্কেলে জিপিএ ক্যালকুলেশন', icon: Database },
  { text: 'ফলাফল শীট প্রস্তুত সম্পন্ন!', subtext: 'ডিজিটাল রেজাল্ট কার্ড খোলা হচ্ছে', icon: FileCheck },
];

export const SearchAnimationModal: React.FC<SearchAnimationModalProps> = ({
  isActive,
  status,
  onComplete,
  onCancel,
  roll,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setCurrentStepIndex(0);
      return;
    }

    const stepDuration = 1000;

    const timer1 = setTimeout(() => setCurrentStepIndex(1), stepDuration);
    const timer2 = setTimeout(() => setCurrentStepIndex(2), stepDuration * 2);
    const timer3 = setTimeout(() => setCurrentStepIndex(3), stepDuration * 3);
    const timer4 = setTimeout(() => {
      onComplete();
    }, stepDuration * 4);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [isActive, onComplete]);

  if (!isActive) return null;

  const CurrentIcon = SEARCH_STEPS[currentStepIndex].icon;

  return (
    <div
      id="search-animation-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/35 backdrop-blur-xl transition-all select-none font-bengali"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-sm bg-white/85 backdrop-blur-2xl backdrop-saturate-180 rounded-[32px] p-7 sm:p-8 shadow-[0_24px_60px_rgba(15,23,42,0.18),0_1px_0_1px_rgba(255,255,255,0.9)_inset] ring-1 ring-black/5 border border-white/90 text-center flex flex-col items-center relative overflow-hidden"
      >
        {/* Book Page-Turning Animation Element */}
        <div className="relative w-32 h-24 flex items-center justify-center mb-5 perspective-[1000px]">
          {/* Base Book Spine & Covers */}
          <div className="relative w-28 h-20 bg-teal-900 rounded-lg shadow-xl flex justify-between p-1 border border-teal-800">
            {/* Left Page (Static) */}
            <div className="w-[49%] h-full bg-slate-50 rounded-l-sm border-r border-slate-200 p-1.5 flex flex-col justify-around">
              <div className="h-1 bg-slate-200 rounded-full w-3/4" />
              <div className="h-1 bg-slate-200 rounded-full w-full" />
              <div className="h-1 bg-slate-200 rounded-full w-5/6" />
              <div className="h-1 bg-slate-200 rounded-full w-2/3" />
            </div>

            {/* Right Page (Static Base) */}
            <div className="w-[49%] h-full bg-slate-50 rounded-r-sm p-1.5 flex flex-col justify-around">
              <div className="h-1 bg-teal-200 rounded-full w-3/4" />
              <div className="h-1 bg-slate-200 rounded-full w-full" />
              <div className="h-1 bg-slate-200 rounded-full w-4/5" />
              <div className="h-1 bg-slate-200 rounded-full w-1/2" />
            </div>

            {/* Flipping Page 1 */}
            <motion.div
              animate={{
                rotateY: [0, -180],
                opacity: [1, 0.9],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
                repeatDelay: 0.3,
              }}
              style={{
                transformOrigin: 'left center',
                transformStyle: 'preserve-3d',
              }}
              className="absolute right-1 top-1 w-[48%] h-[calc(100%-8px)] bg-white rounded-r-sm shadow-md border-l border-slate-300 p-1.5 flex flex-col justify-around"
            >
              <div className="h-1 bg-teal-300 rounded-full w-3/4" />
              <div className="h-1 bg-slate-200 rounded-full w-full" />
              <div className="h-1 bg-slate-200 rounded-full w-5/6" />
              <div className="h-1 bg-slate-200 rounded-full w-2/3" />
            </motion.div>

            {/* Flipping Page 2 */}
            <motion.div
              animate={{
                rotateY: [0, -180],
                opacity: [1, 0.85],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.6,
                repeatDelay: 0.3,
              }}
              style={{
                transformOrigin: 'left center',
                transformStyle: 'preserve-3d',
              }}
              className="absolute right-1 top-1 w-[48%] h-[calc(100%-8px)] bg-white rounded-r-sm shadow-md border-l border-slate-300 p-1.5 flex flex-col justify-around"
            >
              <div className="h-1 bg-blue-300 rounded-full w-4/5" />
              <div className="h-1 bg-slate-200 rounded-full w-full" />
              <div className="h-1 bg-slate-200 rounded-full w-2/3" />
              <div className="h-1 bg-slate-200 rounded-full w-3/4" />
            </motion.div>
          </div>

          {/* Active Step Badge */}
          <div className="absolute -bottom-2 -right-1 w-7 h-7 rounded-full bg-teal-700 text-white flex items-center justify-center shadow-md border-2 border-white/90">
            <CurrentIcon className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Portal Name & Status Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50/90 border border-teal-200/70 text-[11px] font-bold text-teal-800 font-outfit uppercase tracking-wider mb-3 backdrop-blur-md">
          <BookOpen className="w-3 h-3 text-teal-600" />
          <span>DPIB RESULT ZONE</span>
        </div>

        {/* Dynamic Step Text */}
        <div className="min-h-[56px] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-center"
            >
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug font-bengali">
                {SEARCH_STEPS[currentStepIndex].text}
              </h3>
              <p className="text-xs text-slate-600 font-medium mt-0.5 font-bengali">
                {SEARCH_STEPS[currentStepIndex].subtext}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100/90 h-2 rounded-full overflow-hidden mt-5 p-0.5 border border-slate-200/80">
          <motion.div
            initial={{ width: '15%' }}
            animate={{ width: `${((currentStepIndex + 1) / SEARCH_STEPS.length) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="h-full bg-teal-700 rounded-full"
          />
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {SEARCH_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStepIndex
                  ? 'w-6 bg-teal-700'
                  : i < currentStepIndex
                  ? 'w-1.5 bg-emerald-600'
                  : 'w-1.5 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};
