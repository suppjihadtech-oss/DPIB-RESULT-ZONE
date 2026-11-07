import React, { useState } from 'react';
import { DeveloperProfileModal } from './DeveloperProfileModal';
import { Sparkles, User } from 'lucide-react';

interface CompactAttributionProps {
  className?: string;
  onNavigateTab?: (tab: string) => void;
}

export const CompactAttribution: React.FC<CompactAttributionProps> = ({
  className = '',
  onNavigateTab,
}) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleDeveloperClick = () => {
    if (onNavigateTab) {
      onNavigateTab('about');
    } else {
      setIsProfileModalOpen(true);
    }
  };

  return (
    <>
      <div
        id="dpib-compact-attribution"
        className={`select-none text-center font-bengali py-3 max-w-full overflow-hidden ${className}`}
      >
        <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-2.5">
          {/* 1. DPIB SERVER LOGO (Original untouched) */}
          <div className="flex items-center justify-center transition-transform hover:scale-[1.02]">
            <img
              src="https://i.postimg.cc/zG2NKBT6/file-000000003638820ba48f9ab703e4624e.png"
              alt="DPIB SERVER"
              className="h-12 sm:h-14 md:h-15 w-auto max-w-[280px] sm:max-w-[320px] object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* 2. POWERED BY */}
          <div className="flex items-center justify-center gap-2.5 pt-0.5">
            <span className="h-px w-8 sm:w-12 bg-sky-200" />
            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.24em] text-sky-600 uppercase font-outfit">
              POWERED BY
            </span>
            <span className="h-px w-8 sm:w-12 bg-sky-200" />
          </div>

          {/* 3. দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট, ভোলা */}
          <p className="text-xs sm:text-sm font-bold text-slate-800 tracking-wide">
            দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট, ভোলা
          </p>

          {/* 4. DEVELOPED BY */}
          <div className="flex items-center justify-center gap-2 pt-0.5">
            <span className="h-px w-6 sm:w-10 bg-violet-200" />
            <span className="text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] text-violet-700 uppercase font-outfit">
              DEVELOPED BY
            </span>
            <span className="h-px w-6 sm:w-10 bg-violet-200" />
          </div>

          {/* 5. MD JIHAD (Rule 5: Highlighted with Violet/Lavender Typography & Glassmorphism, Clickable Profile) */}
          <button
            type="button"
            onClick={handleDeveloperClick}
            title="আমাদের সম্পর্কে ও ডেভেলপার পরিচিতি দেখুন"
            className="group inline-flex items-center justify-center gap-2 px-3.5 py-1 rounded-full bg-violet-50/80 hover:bg-violet-100/90 border border-violet-200/90 hover:border-violet-300 backdrop-blur-md shadow-2xs transition-all duration-200 cursor-pointer active:scale-95"
          >
            {/* Mini Avatar Icon (Replacing real photo) */}
            <span className="w-5 h-5 rounded-full overflow-hidden border border-violet-300 shrink-0 bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-2xs">
              <User className="w-3 h-3 text-white" />
            </span>

            {/* Violet Multi-Color Gradient Highlighted Name */}
            <span
              className="text-xs sm:text-[13px] font-black tracking-[0.16em] uppercase font-outfit transition-transform group-hover:scale-102"
              style={{
                background: 'linear-gradient(135deg, #581C87 0%, #7E22CE 40%, #9333EA 70%, #A855F7 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }}
            >
              MD JIHAD
            </span>

            <Sparkles className="w-3 h-3 text-violet-500 group-hover:text-violet-700 transition-colors shrink-0" />
          </button>
        </div>
      </div>

      {/* Developer Profile Modal */}
      <DeveloperProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};
