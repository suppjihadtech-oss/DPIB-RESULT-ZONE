import React from 'react';
import { History, RotateCcw, Trash2, CheckCircle2, CloudCheck } from 'lucide-react';
import { formatDraftTime } from '../../utils/draftStorage';
import { toBanglaDigits } from '../../utils/bangla';

interface DraftRestoreBannerProps {
  hasDraft: boolean;
  draftTime?: number;
  onRestore: () => void;
  onDiscard: () => void;
  isAutoSaved?: boolean;
  lastSavedTime?: number | null;
}

export const DraftRestoreBanner: React.FC<DraftRestoreBannerProps> = ({
  hasDraft,
  draftTime,
  onRestore,
  onDiscard,
  isAutoSaved,
  lastSavedTime,
}) => {
  if (!hasDraft && !isAutoSaved && !lastSavedTime) return null;

  return (
    <div className="no-print space-y-2 mb-4 font-bengali">
      {hasDraft && (
        <div className="p-3.5 sm:p-4 bg-amber-50/80 backdrop-blur-2xl backdrop-saturate-180 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ring-1 ring-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100/90 text-amber-900 flex items-center justify-center shrink-0 border border-amber-200/80 shadow-2xs">
              <History className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-amber-950">
                পূর্বের সংরক্ষিত ড্রাফট পাওয়া গেছে
              </p>
              <p className="text-[11px] text-amber-900 font-medium">
                {draftTime
                  ? `সর্বশেষ সংরক্ষণ: ${toBanglaDigits(formatDraftTime(draftTime))} — আপনি কি পূর্বের অসম্পূর্ণ কাজ পুনরুদ্ধার করতে চান?`
                  : 'আপনি কি পূর্বের অসম্পূর্ণ কাজ পুনরুদ্ধার করতে চান?'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={onRestore}
              className="flex-1 sm:flex-none px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ড্রাফট পুনরুদ্ধার করুন</span>
            </button>
            <button
              type="button"
              onClick={onDiscard}
              className="px-3 py-1.5 bg-white/80 hover:bg-white text-amber-900 border border-amber-300/80 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
              title="ড্রাফট মুছে নতুন করে শুরু করুন"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">বাতিল করুন</span>
            </button>
          </div>
        </div>
      )}

      {lastSavedTime && !hasDraft && (
        <div className="flex items-center justify-end gap-1.5 text-[11px] text-slate-500 font-medium px-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
          <span>অটো-সেভ ড্রাফট সংরক্ষিত: <strong className="text-slate-700 font-mono">{toBanglaDigits(formatDraftTime(lastSavedTime))}</strong></span>
        </div>
      )}
    </div>
  );
};
