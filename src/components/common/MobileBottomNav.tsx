import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Home,
  BookOpen,
  Search,
  BarChart3,
  MoreHorizontal,
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenMore: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenSearch,
  onOpenMore,
}) => {
  const [pulseCenter, setPulseCenter] = useState(false);

  // Periodic subtle pulse animation on center Result Search button
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseCenter(true);
      setTimeout(() => setPulseCenter(false), 1400);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const isSearchActive = currentTab === 'search';

  return (
    <div className="fixed bottom-2.5 inset-x-2.5 max-w-md mx-auto z-40 md:hidden pointer-events-none select-none font-bengali">
      <nav
        id="mobile-bottom-navbar"
        aria-label="Mobile Navigation"
        className="pointer-events-auto relative bg-white/80 backdrop-blur-2xl backdrop-saturate-180 border border-white/80 shadow-[0_16px_45px_rgba(15,23,42,0.16),0_1px_0_1px_rgba(255,255,255,0.9)_inset] ring-1 ring-black/5 rounded-[32px] px-2 py-1.5 flex items-center justify-between transition-all"
        style={{ paddingBottom: 'calc(0.4rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* 1. HOME (হোম) */}
        <button
          id="bottom-nav-home"
          type="button"
          onClick={() => onTabChange('home')}
          className="relative flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer min-w-0"
        >
          <div
            className={`flex items-center justify-center w-9 h-7 sm:w-10 sm:h-8 rounded-xl transition-all ${
              currentTab === 'home'
                ? 'bg-blue-50/90 text-blue-600 font-black border border-blue-200/60 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${currentTab === 'home' ? 'scale-110' : ''}`} />
          </div>
          <span
            className={`text-[10px] sm:text-[11px] font-bold mt-0.5 tracking-tight transition-colors truncate max-w-full ${
              currentTab === 'home' ? 'text-blue-600 font-extrabold' : 'text-slate-600'
            }`}
          >
            হোম
          </span>
          {currentTab === 'home' && (
            <motion.div
              layoutId="bottom-nav-indicator"
              className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-blue-600"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>

        {/* 2. EXAM (পরীক্ষা) */}
        <button
          id="bottom-nav-exams"
          type="button"
          onClick={() => onTabChange('exams')}
          className="relative flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer min-w-0"
        >
          <div
            className={`flex items-center justify-center w-9 h-7 sm:w-10 sm:h-8 rounded-xl transition-all ${
              currentTab === 'exams'
                ? 'bg-blue-50/90 text-blue-600 font-black border border-blue-200/60 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${currentTab === 'exams' ? 'scale-110' : ''}`} />
          </div>
          <span
            className={`text-[10px] sm:text-[11px] font-bold mt-0.5 tracking-tight transition-colors truncate max-w-full ${
              currentTab === 'exams' ? 'text-blue-600 font-extrabold' : 'text-slate-600'
            }`}
          >
            পরীক্ষা
          </span>
          {currentTab === 'exams' && (
            <motion.div
              layoutId="bottom-nav-indicator"
              className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-blue-600"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>

        {/* 3. [ RESULT SEARCH ] (CENTER PROMINENT ACTION) */}
        <div className="relative flex-1 flex flex-col items-center justify-center -top-4 sm:-top-5 min-w-0">
          <motion.button
            id="bottom-nav-center-search"
            type="button"
            onClick={onOpenSearch}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            animate={pulseCenter ? { scale: [1, 1.07, 1], rotate: [0, -2, 2, 0] } : {}}
            transition={{ duration: 0.8 }}
            className={`relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl shadow-xl transition-all cursor-pointer ring-4 ring-white/90 ${
              isSearchActive
                ? 'bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white shadow-blue-600/40 ring-blue-100'
                : 'bg-gradient-to-tr from-blue-600 via-blue-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-600/30'
            }`}
            aria-label="ফলাফল অনুসন্ধান"
          >
            <div
              className={`absolute inset-0 rounded-2xl sm:rounded-3xl transition-opacity pointer-events-none ${
                isSearchActive ? 'bg-blue-400/30 animate-pulse' : 'bg-transparent'
              }`}
            />

            <div className="relative z-10 flex flex-col items-center justify-center">
              <Search className="w-6 h-6 text-white stroke-[2.7]" />
            </div>
          </motion.button>
          <span
            className={`text-[10px] sm:text-[11px] font-black mt-1 tracking-tight transition-colors whitespace-nowrap ${
              isSearchActive ? 'text-blue-600 font-extrabold' : 'text-slate-800'
            }`}
          >
            ফলাফল
          </span>
        </div>

        {/* 4. ACADEMIC ANALYSIS / এনালাইসিস */}
        <button
          id="bottom-nav-analysis"
          type="button"
          onClick={() => onTabChange('analysis')}
          className="relative flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer min-w-0"
        >
          <div
            className={`flex items-center justify-center w-9 h-7 sm:w-10 sm:h-8 rounded-xl transition-all ${
              currentTab === 'analysis'
                ? 'bg-blue-50/90 text-blue-600 font-black border border-blue-200/60 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${currentTab === 'analysis' ? 'scale-110' : ''}`} />
          </div>
          <span
            className={`text-[10px] sm:text-[11px] font-bold mt-0.5 tracking-tight transition-colors truncate max-w-full ${
              currentTab === 'analysis' ? 'text-blue-600 font-extrabold' : 'text-slate-600'
            }`}
          >
            এনালাইসিস
          </span>
          {currentTab === 'analysis' && (
            <motion.div
              layoutId="bottom-nav-indicator"
              className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-blue-600"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>

        {/* 5. MORE (অন্যান্য / মেনু) */}
        <button
          id="bottom-nav-more"
          type="button"
          onClick={onOpenMore}
          className="relative flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer min-w-0"
        >
          <div className="flex items-center justify-center w-9 h-7 sm:w-10 sm:h-8 rounded-xl text-slate-600 hover:text-slate-900 transition-all">
            <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold mt-0.5 tracking-tight transition-colors text-slate-600 truncate max-w-full">
            অন্যান্য
          </span>
        </button>
      </nav>
    </div>
  );
};
