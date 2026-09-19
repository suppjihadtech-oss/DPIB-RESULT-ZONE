import React from 'react';

interface CompactAttributionProps {
  className?: string;
}

export const CompactAttribution: React.FC<CompactAttributionProps> = ({ className = '' }) => {
  return (
    <div
      id="dpib-compact-attribution"
      className={`select-none text-center font-bengali py-3 ${className}`}
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
          <span className="h-px w-6 sm:w-10 bg-slate-300" />
          <span className="text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase font-outfit">
            DEVELOPED BY
          </span>
          <span className="h-px w-6 sm:w-10 bg-slate-300" />
        </div>

        {/* 5. MD JIHAD */}
        <div className="inline-flex items-center justify-center px-3.5 py-0.5 rounded-full bg-sky-100/70 border border-sky-200/80">
          <p className="text-xs sm:text-[13px] font-extrabold tracking-[0.18em] text-slate-900 uppercase font-outfit">
            MD JIHAD
          </p>
        </div>
      </div>
    </div>
  );
};


