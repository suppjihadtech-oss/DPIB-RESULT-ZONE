import React from 'react';
import { motion } from 'motion/react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'লোড হচ্ছে...',
  size = 'md',
}) => {
  if (size === 'sm') {
    return (
      <div id="loading-spinner-wrapper" className="inline-flex items-center gap-2 text-slate-600">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        {message && <span className="text-xs font-medium">{message}</span>}
      </div>
    );
  }

  return (
    <div id="loading-spinner-wrapper" className="flex flex-col items-center justify-center p-8 space-y-4">
      {/* 3D Open Book Illustration */}
      <div className="relative w-36 h-24 flex items-center justify-center select-none">
        {/* Soft Ground Shadow */}
        <div className="absolute -bottom-1.5 w-28 h-3 bg-slate-900/10 rounded-full blur-xs animate-pulse" />

        {/* 3D Container */}
        <div
          className="relative w-32 h-20 flex items-center justify-center"
          style={{
            perspective: '1000px',
            perspectiveOrigin: '50% 50%',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Hardcover Base */}
          <div
            className="absolute inset-0 rounded-md bg-gradient-to-b from-blue-900 to-indigo-950 shadow-md border border-blue-800/60 flex"
            style={{
              transform: 'rotateX(20deg)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="w-1/2 h-full rounded-l-md border-r border-blue-800/40 bg-gradient-to-r from-blue-950 to-blue-900" />
            <div className="w-1/2 h-full rounded-r-md border-l border-blue-800/40 bg-gradient-to-l from-blue-950 to-blue-900" />
          </div>

          {/* Static Pages Layer */}
          <div
            className="absolute inset-x-1 inset-y-1 rounded-sm flex"
            style={{
              transform: 'rotateX(20deg) translateZ(2px)',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Left Page */}
            <div className="w-1/2 h-full bg-gradient-to-r from-slate-100 via-white to-amber-50/80 rounded-l-xs border-y border-l border-slate-200 p-1.5 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-1 opacity-40 pt-0.5">
                <div className="h-1 bg-blue-600/30 rounded-full w-4/5" />
                <div className="h-0.5 bg-slate-400/30 rounded-full w-full" />
                <div className="h-0.5 bg-slate-400/30 rounded-full w-3/4" />
              </div>
              <div className="text-[6px] font-mono text-slate-400 font-bold">DPIB</div>
            </div>

            {/* Right Page */}
            <div className="w-1/2 h-full bg-gradient-to-l from-slate-100 via-white to-amber-50/80 rounded-r-xs border-y border-r border-slate-200 p-1.5 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-1 opacity-40 pt-0.5">
                <div className="h-1 bg-emerald-600/30 rounded-full w-3/5" />
                <div className="h-0.5 bg-slate-400/30 rounded-full w-full" />
                <div className="h-0.5 bg-slate-400/30 rounded-full w-2/3" />
              </div>
              <div className="text-[6px] font-mono text-slate-400 font-bold text-right">2026</div>
            </div>
          </div>

          {/* 3D Flipping Pages */}
          <div
            className="absolute inset-x-1 inset-y-1"
            style={{
              transform: 'rotateX(20deg) translateZ(3px)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div
              className="book-page-flipper book-page-delay-1 absolute top-0 right-0 w-1/2 h-full rounded-r-xs bg-gradient-to-l from-white via-slate-50 to-amber-50/90 border-y border-r border-slate-300 shadow-sm p-1.5 flex flex-col justify-between"
              style={{ transformOrigin: '0% 50%' }}
            >
              <div className="space-y-1 opacity-50 pt-0.5">
                <div className="h-1 bg-indigo-600/40 rounded-full w-3/4" />
                <div className="h-0.5 bg-slate-400/40 rounded-full w-full" />
              </div>
            </div>

            <div
              className="book-page-flipper book-page-delay-2 absolute top-0 right-0 w-1/2 h-full rounded-r-xs bg-gradient-to-l from-white via-slate-50 to-amber-50/90 border-y border-r border-slate-300 shadow-sm p-1.5 flex flex-col justify-between"
              style={{ transformOrigin: '0% 50%' }}
            >
              <div className="space-y-1 opacity-50 pt-0.5">
                <div className="h-1 bg-blue-600/40 rounded-full w-4/5" />
                <div className="h-0.5 bg-slate-400/40 rounded-full w-full" />
              </div>
            </div>

            <div
              className="book-page-flipper book-page-delay-3 absolute top-0 right-0 w-1/2 h-full rounded-r-xs bg-gradient-to-l from-white via-slate-50 to-amber-50/90 border-y border-r border-slate-300 shadow-sm p-1.5 flex flex-col justify-between"
              style={{ transformOrigin: '0% 50%' }}
            >
              <div className="space-y-1 opacity-50 pt-0.5">
                <div className="h-1 bg-emerald-600/40 rounded-full w-2/3" />
                <div className="h-0.5 bg-slate-400/40 rounded-full w-full" />
              </div>
            </div>
          </div>

          {/* Spine Ribbon */}
          <div
            className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-amber-500 rounded-full z-30"
            style={{ transform: 'rotateX(20deg) translateZ(4px)' }}
          >
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-2.5 bg-amber-600 [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)]" />
          </div>
        </div>
      </div>

      {message && (
        <motion.p
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="text-xs sm:text-sm font-semibold text-slate-700 font-bengali text-center"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
};

