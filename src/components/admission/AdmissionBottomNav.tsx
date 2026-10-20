import React from 'react';
import { motion } from 'motion/react';
import {
  Home,
  History,
  UserCheck,
} from 'lucide-react';
import { toBanglaDigits } from '../../utils/bangla';

interface AdmissionBottomNavProps {
  activeTab: 'dashboard' | 'history' | 'profile';
  onTabChange: (tab: 'dashboard' | 'history' | 'profile') => void;
  applicationsCount?: number;
}

export const AdmissionBottomNav: React.FC<AdmissionBottomNavProps> = ({
  activeTab,
  onTabChange,
  applicationsCount = 0,
}) => {
  return (
    <div className="fixed bottom-3 inset-x-3 max-w-sm mx-auto z-40 select-none font-bengali pointer-events-none">
      <nav
        id="admission-bottom-navbar"
        aria-label="Admission Bottom Navigation"
        className="pointer-events-auto relative bg-white/80 backdrop-blur-2xl backdrop-saturate-180 border border-white/80 shadow-[0_16px_45px_rgba(15,23,42,0.16),0_1px_0_1px_rgba(255,255,255,0.9)_inset] ring-1 ring-black/5 rounded-[28px] px-2 py-1.5 flex items-center justify-around transition-all"
        style={{ paddingBottom: 'calc(0.4rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* 1. Dashboard (Home Icon) */}
        <button
          id="admission-bottom-tab-dashboard"
          type="button"
          onClick={() => onTabChange('dashboard')}
          className="relative flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer min-w-0"
        >
          <div
            className={`flex items-center justify-center w-10 h-7 rounded-xl transition-all ${
              activeTab === 'dashboard'
                ? 'bg-blue-50/90 text-blue-700 font-black border border-blue-200/60 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home className={`w-4 h-4 transition-transform ${activeTab === 'dashboard' ? 'scale-110' : ''}`} />
          </div>
          <span
            className={`text-[11px] font-bold mt-0.5 tracking-tight transition-colors truncate ${
              activeTab === 'dashboard' ? 'text-blue-700 font-black' : 'text-slate-600'
            }`}
          >
            ড্যাশবোর্ড
          </span>
          {activeTab === 'dashboard' && (
            <motion.div
              layoutId="admission-nav-indicator"
              className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-blue-700"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>

        {/* 2. History */}
        <button
          id="admission-bottom-tab-history"
          type="button"
          onClick={() => onTabChange('history')}
          className="relative flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer min-w-0"
        >
          <div
            className={`relative flex items-center justify-center w-10 h-7 rounded-xl transition-all ${
              activeTab === 'history'
                ? 'bg-blue-50/90 text-blue-700 font-black border border-blue-200/60 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className={`w-4 h-4 transition-transform ${activeTab === 'history' ? 'scale-110' : ''}`} />
            {applicationsCount > 0 && (
              <span className="absolute -top-0.5 right-1 px-1 min-w-[14px] h-3.5 rounded-full bg-blue-700 text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-xs">
                {toBanglaDigits(applicationsCount)}
              </span>
            )}
          </div>
          <span
            className={`text-[11px] font-bold mt-0.5 tracking-tight transition-colors truncate ${
              activeTab === 'history' ? 'text-blue-700 font-black' : 'text-slate-600'
            }`}
          >
            হিস্ট্রি
          </span>
          {activeTab === 'history' && (
            <motion.div
              layoutId="admission-nav-indicator"
              className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-blue-700"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>

        {/* 3. Profile */}
        <button
          id="admission-bottom-tab-profile"
          type="button"
          onClick={() => onTabChange('profile')}
          className="relative flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer min-w-0"
        >
          <div
            className={`flex items-center justify-center w-10 h-7 rounded-xl transition-all ${
              activeTab === 'profile'
                ? 'bg-blue-50/90 text-blue-700 font-black border border-blue-200/60 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className={`w-4 h-4 transition-transform ${activeTab === 'profile' ? 'scale-110' : ''}`} />
          </div>
          <span
            className={`text-[11px] font-bold mt-0.5 tracking-tight transition-colors truncate ${
              activeTab === 'profile' ? 'text-blue-700 font-black' : 'text-slate-600'
            }`}
          >
            প্রোফাইল
          </span>
          {activeTab === 'profile' && (
            <motion.div
              layoutId="admission-nav-indicator"
              className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-blue-700"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      </nav>
    </div>
  );
};
