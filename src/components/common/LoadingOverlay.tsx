import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

export type LoadingOperation = 'save' | 'delete' | 'update' | 'publish' | 'processing' | 'default';

const OPERATION_MESSAGES: Record<string, string> = {
  save: 'তথ্য সংরক্ষণ করা হচ্ছে...',
  delete: 'তথ্য মুছে ফেলা হচ্ছে...',
  update: 'তথ্য আপডেট করা হচ্ছে...',
  publish: 'ফলাফল প্রকাশ করা হচ্ছে...',
  processing: 'ডেটা প্রসেসিং চলছে...',
  default: 'ডেটা প্রসেসিং চলছে...',
};

export interface LoadingOverlayProps {
  isVisible: boolean;
  operation?: LoadingOperation;
  message?: string;
  subtext?: string;
  fullScreen?: boolean;
  transparentBackdrop?: boolean;
  minDurationMs?: number;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  operation,
  message,
  subtext = 'অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন...',
  fullScreen = true,
  transparentBackdrop = false,
  minDurationMs = 2200,
  className = '',
}) => {
  const displayMessage = message || (operation ? OPERATION_MESSAGES[operation] : null) || 'তথ্য সংরক্ষণ করা হচ্ছে...';
  const [shouldRender, setShouldRender] = useState(isVisible);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      startTimeRef.current = Date.now();
      setShouldRender(true);
    } else {
      if (startTimeRef.current > 0) {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, minDurationMs - elapsed);

        if (remaining > 0) {
          timerRef.current = setTimeout(() => {
            setShouldRender(false);
            startTimeRef.current = 0;
            timerRef.current = null;
          }, remaining);
        } else {
          setShouldRender(false);
          startTimeRef.current = 0;
        }
      } else {
        setShouldRender(false);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isVisible, minDurationMs]);

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          id="dpib-loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35, ease: 'easeInOut' } }}
          className={`${
            fullScreen
              ? 'fixed inset-0 z-[9999]'
              : 'absolute inset-0 z-50 rounded-2xl'
          } flex items-center justify-center p-4 ${
            transparentBackdrop
              ? 'bg-slate-900/30 backdrop-blur-sm'
              : 'bg-slate-950/45 backdrop-blur-md'
          } select-none pointer-events-auto cursor-wait ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Main Card */}
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 8 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="w-full max-w-xs sm:max-w-sm bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)] border border-white/80 text-center flex flex-col items-center relative overflow-hidden"
          >
            {/* Ambient Background Light Blobs */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

            {/* Top Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/90 border border-blue-200/80 text-[11px] font-bold text-blue-700 font-outfit uppercase tracking-wider mb-5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>DPIB RESULT ZONE</span>
            </div>

            {/* 3D Realistic Open-Book with Continuous Flipping Pages */}
            <div className="relative w-44 h-32 flex items-center justify-center my-2 select-none">
              {/* Soft Ground Shadow */}
              <div className="absolute -bottom-2 w-36 h-4 bg-slate-900/15 rounded-full blur-md animate-pulse" />

              {/* Book 3D Stage */}
              <div
                className="relative w-40 h-28 flex items-center justify-center"
                style={{
                  perspective: '1200px',
                  perspectiveOrigin: '50% 50%',
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Book Cover Base (Hardcover backing) */}
                <div
                  className="absolute inset-0 rounded-lg bg-gradient-to-b from-blue-900 to-indigo-950 shadow-xl border border-blue-800/60 flex"
                  style={{
                    transform: 'rotateX(20deg)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Left Hardcover */}
                  <div className="w-1/2 h-full rounded-l-lg border-r border-blue-800/40 relative bg-gradient-to-r from-blue-950 to-blue-900">
                    <div className="absolute inset-1 rounded-l-md border border-blue-500/20" />
                  </div>
                  {/* Right Hardcover */}
                  <div className="w-1/2 h-full rounded-r-lg border-l border-blue-800/40 relative bg-gradient-to-l from-blue-950 to-blue-900">
                    <div className="absolute inset-1 rounded-r-md border border-blue-500/20" />
                  </div>
                </div>

                {/* Stationary Base Pages */}
                <div
                  className="absolute inset-x-1 inset-y-1 rounded-md flex"
                  style={{
                    transform: 'rotateX(20deg) translateZ(2px)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Left Open Page (Static stack) */}
                  <div className="w-1/2 h-full bg-gradient-to-r from-slate-100 via-white to-amber-50/80 rounded-l-sm border-y border-l border-slate-200 shadow-inner p-2 flex flex-col justify-between relative overflow-hidden">
                    {/* Spine Shadow Gradient */}
                    <div className="absolute right-0 inset-y-0 w-3 bg-gradient-to-l from-slate-400/25 to-transparent pointer-events-none" />
                    {/* Page Text Line Watermarks */}
                    <div className="space-y-1.5 opacity-40 pt-1">
                      <div className="h-1.5 bg-blue-600/30 rounded-full w-4/5" />
                      <div className="h-1 bg-slate-400/30 rounded-full w-full" />
                      <div className="h-1 bg-slate-400/30 rounded-full w-5/6" />
                      <div className="h-1 bg-slate-400/30 rounded-full w-3/4" />
                      <div className="h-1 bg-slate-400/30 rounded-full w-full" />
                    </div>
                    {/* Bottom Page Number */}
                    <div className="text-[8px] font-mono text-slate-400 font-bold">DPIB</div>
                  </div>

                  {/* Right Open Page (Static stack) */}
                  <div className="w-1/2 h-full bg-gradient-to-l from-slate-100 via-white to-amber-50/80 rounded-r-sm border-y border-r border-slate-200 shadow-inner p-2 flex flex-col justify-between relative overflow-hidden">
                    {/* Spine Shadow Gradient */}
                    <div className="absolute left-0 inset-y-0 w-3 bg-gradient-to-r from-slate-400/25 to-transparent pointer-events-none" />
                    {/* Page Text Line Watermarks */}
                    <div className="space-y-1.5 opacity-40 pt-1">
                      <div className="h-1.5 bg-emerald-600/30 rounded-full w-3/5" />
                      <div className="h-1 bg-slate-400/30 rounded-full w-full" />
                      <div className="h-1 bg-slate-400/30 rounded-full w-4/5" />
                      <div className="h-1 bg-slate-400/30 rounded-full w-full" />
                      <div className="h-1 bg-slate-400/30 rounded-full w-2/3" />
                    </div>
                    {/* Bottom Page Number */}
                    <div className="text-[8px] font-mono text-slate-400 font-bold text-right">2026</div>
                  </div>
                </div>

                {/* 3D Animated Flipping Pages (3 Layers turning smoothly) */}
                <div
                  className="absolute inset-x-1 inset-y-1"
                  style={{
                    transform: 'rotateX(20deg) translateZ(3px)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Page 1 (Flipping continuously) */}
                  <div
                    className="book-page-flipper book-page-delay-1 absolute top-0 right-0 w-1/2 h-full rounded-r-sm bg-gradient-to-l from-white via-slate-50 to-amber-50/90 border-y border-r border-slate-300 shadow-md p-2 flex flex-col justify-between"
                    style={{
                      transformOrigin: '0% 50%',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    <div className="space-y-1.5 opacity-50 pt-1">
                      <div className="h-1.5 bg-indigo-600/40 rounded-full w-3/4" />
                      <div className="h-1 bg-slate-400/40 rounded-full w-full" />
                      <div className="h-1 bg-slate-400/40 rounded-full w-4/5" />
                      <div className="h-1 bg-slate-400/40 rounded-full w-full" />
                    </div>
                    <div className="flex justify-between items-center text-[7px] font-mono text-slate-400">
                      <span>RESULT</span>
                      <span>#1</span>
                    </div>
                  </div>

                  {/* Page 2 (Flipping continuously with offset) */}
                  <div
                    className="book-page-flipper book-page-delay-2 absolute top-0 right-0 w-1/2 h-full rounded-r-sm bg-gradient-to-l from-white via-slate-50 to-amber-50/90 border-y border-r border-slate-300 shadow-md p-2 flex flex-col justify-between"
                    style={{
                      transformOrigin: '0% 50%',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    <div className="space-y-1.5 opacity-50 pt-1">
                      <div className="h-1.5 bg-blue-600/40 rounded-full w-4/5" />
                      <div className="h-1 bg-slate-400/40 rounded-full w-full" />
                      <div className="h-1 bg-slate-400/40 rounded-full w-3/4" />
                      <div className="h-1 bg-slate-400/40 rounded-full w-full" />
                    </div>
                    <div className="flex justify-between items-center text-[7px] font-mono text-slate-400">
                      <span>GRADE</span>
                      <span>#2</span>
                    </div>
                  </div>

                  {/* Page 3 (Flipping continuously with offset) */}
                  <div
                    className="book-page-flipper book-page-delay-3 absolute top-0 right-0 w-1/2 h-full rounded-r-sm bg-gradient-to-l from-white via-slate-50 to-amber-50/90 border-y border-r border-slate-300 shadow-md p-2 flex flex-col justify-between"
                    style={{
                      transformOrigin: '0% 50%',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    <div className="space-y-1.5 opacity-50 pt-1">
                      <div className="h-1.5 bg-emerald-600/40 rounded-full w-2/3" />
                      <div className="h-1 bg-slate-400/40 rounded-full w-full" />
                      <div className="h-1 bg-slate-400/40 rounded-full w-5/6" />
                      <div className="h-1 bg-slate-400/40 rounded-full w-full" />
                    </div>
                    <div className="flex justify-between items-center text-[7px] font-mono text-slate-400">
                      <span>VERIFIED</span>
                      <span>#3</span>
                    </div>
                  </div>
                </div>

                {/* Center Spine Ribbon Bookmark & Fold Accent */}
                <div
                  className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1.5 bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 shadow-sm z-30 rounded-full"
                  style={{
                    transform: 'rotateX(20deg) translateZ(4px)',
                  }}
                >
                  {/* Dangling Ribbon Tail */}
                  <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-2 h-4 bg-amber-600 [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)] shadow-md" />
                </div>
              </div>
            </div>

            {/* Dynamic Status Text & Subtext */}
            <div className="mt-4 min-h-[48px] flex flex-col items-center justify-center">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-snug">
                {displayMessage}
              </h3>
              {subtext && (
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {subtext}
                </p>
              )}
            </div>

            {/* Shimmering Progress Indicator */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-4 p-0.5 border border-slate-200/60 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent animate-shimmer" />
              <motion.div
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-1/2 h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
