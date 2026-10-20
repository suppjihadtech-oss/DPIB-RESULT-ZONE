import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Hourglass,
  Sparkles,
} from 'lucide-react';
import { AdmissionSettings } from '../../types';
import {
  getAdmissionDeadlineStatus,
  DeadlineStatusInfo,
  DEFAULT_ADMISSION_SETTINGS,
} from '../../services/admissionService';
import { toBanglaDigits } from '../../utils/bangla';

interface AdmissionCountdownCardProps {
  settings?: AdmissionSettings | null;
  className?: string;
  compact?: boolean;
}

export const AdmissionCountdownCard: React.FC<AdmissionCountdownCardProps> = ({
  settings,
  className = '',
  compact = false,
}) => {
  const [deadlineInfo, setDeadlineInfo] = useState<DeadlineStatusInfo>(() =>
    getAdmissionDeadlineStatus(settings)
  );

  // Live 1-second interval timer for smooth countdown
  useEffect(() => {
    const updateCountdown = () => {
      setDeadlineInfo(getAdmissionDeadlineStatus(settings));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [settings]);

  // Format single/double digits to Bangla with leading zero if needed
  const formatTimeUnit = (num: number) => {
    const padded = num < 10 ? `0${num}` : `${num}`;
    return toBanglaDigits(padded);
  };

  if (deadlineInfo.status === 'EXPIRED') {
    return (
      <div
        className={`bg-gradient-to-r from-rose-50 via-rose-100/60 to-amber-50 rounded-2xl border border-rose-200 p-4 sm:p-5 shadow-2xs ${className}`}
      >
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-rose-950">
                  ভর্তির সময়সীমা শেষ হয়েছে
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-rose-200 text-rose-900 text-[10px] font-bold">
                  আবেদন বন্ধ
                </span>
              </div>
              <p className="text-xs text-rose-800 mt-0.5 font-medium">
                চলতি সেশনের জন্য অনলাইন ভর্তি আবেদন গ্রহণ সমাপ্ত হয়েছে। পরবর্তী নির্দেশনার জন্য নোটিশ বোর্ড লক্ষ্য রাখুন।
              </p>
            </div>
          </div>
        </div>

        {deadlineInfo.notice && (
          <div className="mt-3 pt-2.5 border-t border-rose-200/80 text-xs text-rose-900 font-medium">
            <strong>কর্তৃপক্ষের বার্তা:</strong> {deadlineInfo.notice}
          </div>
        )}
      </div>
    );
  }

  if (deadlineInfo.status === 'NOT_STARTED') {
    return (
      <div
        className={`bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 rounded-2xl border border-sky-200 p-4 sm:p-5 shadow-2xs ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Hourglass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-sky-950">
                  ভর্তি আবেদন শীঘ্রই শুরু হবে
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-sky-200 text-sky-900 text-[10px] font-bold">
                  আসন্ন
                </span>
              </div>
              <p className="text-xs text-sky-800 mt-0.5">
                আবেদন শুরুর সময়: <strong className="font-bold">{deadlineInfo.formattedStartDate}</strong>
              </p>
            </div>
          </div>

          {/* Countdown Tiles to Start */}
          <div className="flex items-center gap-2 self-center sm:self-auto">
            <div className="flex flex-col items-center justify-center px-3 py-1.5 bg-white rounded-xl border border-sky-200 shadow-2xs min-w-[52px]">
              <span className="text-sm sm:text-base font-black text-sky-900 font-outfit">
                {formatTimeUnit(deadlineInfo.days)}
              </span>
              <span className="text-[9px] text-slate-500 font-bold">দিন</span>
            </div>
            <span className="text-sky-400 font-bold">:</span>
            <div className="flex flex-col items-center justify-center px-3 py-1.5 bg-white rounded-xl border border-sky-200 shadow-2xs min-w-[52px]">
              <span className="text-sm sm:text-base font-black text-sky-900 font-outfit">
                {formatTimeUnit(deadlineInfo.hours)}
              </span>
              <span className="text-[9px] text-slate-500 font-bold">ঘণ্টা</span>
            </div>
            <span className="text-sky-400 font-bold">:</span>
            <div className="flex flex-col items-center justify-center px-3 py-1.5 bg-white rounded-xl border border-sky-200 shadow-2xs min-w-[52px]">
              <span className="text-sm sm:text-base font-black text-sky-900 font-outfit">
                {formatTimeUnit(deadlineInfo.minutes)}
              </span>
              <span className="text-[9px] text-slate-500 font-bold">মিনিট</span>
            </div>
            <span className="text-sky-400 font-bold">:</span>
            <div className="flex flex-col items-center justify-center px-3 py-1.5 bg-white rounded-xl border border-sky-200 shadow-2xs min-w-[52px]">
              <span className="text-sm sm:text-base font-black text-sky-900 font-outfit">
                {formatTimeUnit(deadlineInfo.seconds)}
              </span>
              <span className="text-[9px] text-slate-500 font-bold">সেকেন্ড</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active / Ongoing Admission Countdown
  return (
    <div
      className={`bg-gradient-to-br from-sky-50 via-white to-blue-50/80 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden border border-sky-200/80 ${className}`}
    >
      {/* Subtle blue ambient glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left Status & Title */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100/90 text-sky-900 border border-sky-200/80 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-600" />
              </span>
              <span>ভর্তি চলছে</span>
            </span>
            {deadlineInfo.formattedEndDate && (
              <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <span>শেষ তারিখ: {deadlineInfo.formattedEndDate}</span>
              </span>
            )}
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              ভর্তি শেষ হতে বাকি
            </h3>
            {deadlineInfo.notice && (
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {deadlineInfo.notice}
              </p>
            )}
          </div>
        </div>

        {/* Countdown Digit Tiles */}
        <div className="flex items-center gap-2 sm:gap-2.5 self-center md:self-auto bg-white/90 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl border border-sky-100 shadow-2xs">
          {/* Days */}
          <div className="flex flex-col items-center justify-center px-3 sm:px-3.5 py-1.5 sm:py-2 bg-sky-50/60 rounded-xl border border-sky-100 min-w-[50px] sm:min-w-[58px]">
            <span className="text-lg sm:text-2xl font-black text-sky-950 font-outfit leading-none">
              {formatTimeUnit(deadlineInfo.days)}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold mt-1">দিন</span>
          </div>

          <span className="text-sky-400 font-bold text-sm sm:text-base leading-none">:</span>

          {/* Hours */}
          <div className="flex flex-col items-center justify-center px-3 sm:px-3.5 py-1.5 sm:py-2 bg-sky-50/60 rounded-xl border border-sky-100 min-w-[50px] sm:min-w-[58px]">
            <span className="text-lg sm:text-2xl font-black text-sky-950 font-outfit leading-none">
              {formatTimeUnit(deadlineInfo.hours)}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold mt-1">ঘণ্টা</span>
          </div>

          <span className="text-sky-400 font-bold text-sm sm:text-base leading-none">:</span>

          {/* Minutes */}
          <div className="flex flex-col items-center justify-center px-3 sm:px-3.5 py-1.5 sm:py-2 bg-sky-50/60 rounded-xl border border-sky-100 min-w-[50px] sm:min-w-[58px]">
            <span className="text-lg sm:text-2xl font-black text-sky-950 font-outfit leading-none">
              {formatTimeUnit(deadlineInfo.minutes)}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold mt-1">মিনিট</span>
          </div>

          <span className="text-sky-400 font-bold text-sm sm:text-base leading-none">:</span>

          {/* Seconds */}
          <div className="flex flex-col items-center justify-center px-3 sm:px-3.5 py-1.5 sm:py-2 bg-sky-100/70 border border-sky-200/90 rounded-xl min-w-[50px] sm:min-w-[58px]">
            <span className="text-lg sm:text-2xl font-black text-sky-900 font-outfit leading-none">
              {formatTimeUnit(deadlineInfo.seconds)}
            </span>
            <span className="text-[10px] sm:text-[11px] text-sky-700 font-bold mt-1">সেকেন্ড</span>
          </div>
        </div>
      </div>
    </div>
  );
};
