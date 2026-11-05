import React from 'react';
import {
  Bell,
  ShieldCheck,
  Calculator,
  CalendarDays,
  GraduationCap,
  Trophy,
  BookOpen,
  Info,
  ChevronRight,
  HeartHandshake,
  History,
} from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { DpibBrandTitle } from '../common/DpibBrandTitle';

interface PublicMoreBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenNotificationModal?: () => void;
}

export const PublicMoreBottomSheet: React.FC<PublicMoreBottomSheetProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenNotificationModal,
}) => {
  const menuOptions = [
    {
      id: 'donate',
      title: 'অনুদান দিন / ডোনেট করুন',
      subtitle: 'অ্যাপ উন্নয়ন ও মানবিক সহায়তা (বিকাশ ও নগদ)',
      icon: HeartHandshake,
      color: 'bg-rose-50 text-rose-600 border-rose-200/80',
      action: () => {
        onNavigateTab('donate');
        onClose();
      },
    },
    {
      id: 'transactions',
      title: 'লেনদেন হিস্ট্রি',
      subtitle: 'নিশ্চিতকৃত পেমেন্ট ও অটো-জেনারেটেড রসিদ তালিকা',
      icon: History,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      action: () => {
        onNavigateTab('transactions');
        onClose();
      },
    },
    {
      id: 'about',
      title: 'আমাদের সম্পর্কে',
      subtitle: 'পরিচিতি, লক্ষ্য ও ডেভেলপার তথ্য',
      icon: Info,
      color: 'bg-violet-50 text-violet-700 border-violet-200/80',
      action: () => {
        onNavigateTab('about');
        onClose();
      },
    },
    {
      id: 'books',
      title: 'বুক লিস্ট ও পাঠ্যবই',
      subtitle: 'টেকনোলজি ও পর্বভিত্তিক বইয়ের তালিকা',
      icon: BookOpen,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      action: () => {
        onNavigateTab('books');
        onClose();
      },
    },
    {
      id: 'merit',
      title: 'শীর্ষ মেধাতালিকা',
      subtitle: 'পরীক্ষাভিত্তিক মেধাবী শিক্ষার্থীদের তালিকা',
      icon: Trophy,
      color: 'bg-amber-50 text-amber-600 border-amber-200/80',
      action: () => {
        onNavigateTab('merit');
        onClose();
      },
    },
    {
      id: 'admission',
      title: 'অনলাইন ভর্তি আবেদন',
      subtitle: 'নতুন শিক্ষার্থী ভর্তি ও আবেদন স্ট্যাটাস',
      icon: GraduationCap,
      color: 'bg-teal-50 text-teal-700 border-teal-200/80',
      action: () => {
        onNavigateTab('admission');
        onClose();
      },
    },
    {
      id: 'gpa-calculator',
      title: 'জিপিএ ক্যালকুলেটর',
      subtitle: 'বিটিইবি ডিপ্লোমা পয়েন্ট হিসাব',
      icon: Calculator,
      color: 'bg-blue-50 text-blue-600 border-blue-200/80',
      action: () => {
        onNavigateTab('gpa-calculator');
        onClose();
      },
    },
    {
      id: 'smart-calendar',
      title: 'স্মার্ট একাডেমিক ক্যালেন্ডার',
      subtitle: 'পরীক্ষার তারিখ, ইভেন্ট ও ছুটির দিনপঞ্জি',
      icon: CalendarDays,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
      action: () => {
        onNavigateTab('smart-calendar');
        onClose();
      },
    },
    {
      id: 'notifications-modal',
      title: 'পুশ নোটিফিকেশন',
      subtitle: 'ফলাফল ও নোটিশের তাৎক্ষণিক অ্যালার্ট',
      icon: Bell,
      color: 'bg-rose-50 text-rose-600 border-rose-200/80',
      action: () => {
        onClose();
        if (onOpenNotificationModal) onOpenNotificationModal();
      },
    },
    {
      id: 'notices',
      title: 'অফিসিয়াল নোটিশ বোর্ড',
      subtitle: 'ইনস্টিটিউটের জরুরি বিজ্ঞপ্তি ও সার্কুলার',
      icon: Bell,
      color: 'bg-amber-50 text-amber-600 border-amber-200/80',
      action: () => {
        onNavigateTab('notices');
        onClose();
      },
    },
    {
      id: 'verify',
      title: 'অনলাইন রেজাল্ট যাচাই',
      subtitle: 'ভেরিফিকেশন কোড ও কিউআর কোড যাচাই',
      icon: ShieldCheck,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
      action: () => {
        onNavigateTab('verify');
        onClose();
      },
    },
  ];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="অন্যান্য সেবাসমূহ"
      subtitle={<><DpibBrandTitle className="text-xs inline-block" /> পোর্টালের অতিরিক্ত বিকল্প</>}
      compact={true}
      maxHeight="max-h-[58dvh] sm:max-h-[75vh]"
    >
      <div className="pb-2 font-bengali">
        {/* Wide Horizontal Bar Cards: Full-width on mobile & tablet, 2 wide columns on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5">
          {menuOptions.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`more-menu-${item.id}`}
                type="button"
                onClick={item.action}
                className="group w-full flex items-center justify-between gap-3.5 px-4 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-white/95 hover:bg-white backdrop-blur-md border border-slate-200/90 hover:border-blue-300 shadow-2xs hover:shadow-sm transition-all active:scale-[0.99] cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Horizontal Left Icon Squircle */}
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border ${item.color} shrink-0 backdrop-blur-md shadow-2xs group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>

                  {/* Title & Subtitle */}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[13px] sm:text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors truncate leading-tight">
                      {item.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate leading-tight mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                {/* Right Action Arrow */}
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            );
          })}
        </div>

        {/* Quick Institute Info Banner (Compact Glassmorphic Strip) */}
        <div className="p-2 sm:p-2.5 bg-blue-50/70 backdrop-blur-md rounded-xl border border-blue-200/70 mt-2 flex items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
            <div className="text-left min-w-0">
              <h5 className="text-[11px] sm:text-xs font-black text-blue-950 font-bengali truncate leading-tight">
                দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট
              </h5>
              <p className="text-[8.5px] sm:text-[9px] text-blue-700 font-bold font-outfit uppercase tracking-wider truncate leading-tight mt-0.5">
                DAKKINBANGO POLYTECHNIC INSTITUTE, BHOLA
              </p>
            </div>
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-blue-800 bg-white/80 px-2 py-0.5 rounded-full border border-blue-200/60 shrink-0 font-outfit">
            CODE: 40052
          </span>
        </div>
      </div>
    </BottomSheet>
  );
};
