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
      id: 'about',
      title: 'আমাদের সম্পর্কে',
      subtitle: 'পরিচিতি ও লক্ষ্য',
      icon: Info,
      color: 'bg-violet-50 text-violet-700 border-violet-200/80',
      action: () => {
        onNavigateTab('about');
        onClose();
      },
    },
    {
      id: 'books',
      title: 'বুক লিস্ট ও বই',
      subtitle: 'পাঠ্যবই ও কোড',
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
      subtitle: 'মেধাবী তালিকা',
      icon: Trophy,
      color: 'bg-amber-50 text-amber-600 border-amber-200/80',
      action: () => {
        onNavigateTab('merit');
        onClose();
      },
    },
    {
      id: 'admission',
      title: 'ভর্তি আবেদন',
      subtitle: 'অনলাইন ভর্তি',
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
      subtitle: 'পয়েন্ট হিসাব',
      icon: Calculator,
      color: 'bg-blue-50 text-blue-600 border-blue-200/80',
      action: () => {
        onNavigateTab('gpa-calculator');
        onClose();
      },
    },
    {
      id: 'smart-calendar',
      title: 'স্মার্ট ক্যালেন্ডার',
      subtitle: 'তারিখ ও ছুটি',
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
      subtitle: 'মোবাইল অ্যালার্ট',
      icon: Bell,
      color: 'bg-rose-50 text-rose-600 border-rose-200/80',
      action: () => {
        onClose();
        if (onOpenNotificationModal) onOpenNotificationModal();
      },
    },
    {
      id: 'notices',
      title: 'নোটিশ বোর্ড',
      subtitle: 'পরীক্ষার নোটিশ',
      icon: Bell,
      color: 'bg-amber-50 text-amber-600 border-amber-200/80',
      action: () => {
        onNavigateTab('notices');
        onClose();
      },
    },
    {
      id: 'verify',
      title: 'রেজাল্ট যাচাই',
      subtitle: 'কিউআর কোড যাচাই',
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
    >
      <div className="pb-4 font-bengali">
        {/* Compact Square Cards Grid: 3 cards per row on mobile, 3-4 on tablet/desktop */}
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {menuOptions.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className="group relative flex flex-col items-center justify-center text-center p-2 sm:p-3 rounded-2xl bg-white/80 hover:bg-white backdrop-blur-md border border-slate-200/80 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all active:scale-95 cursor-pointer aspect-square min-h-[92px] sm:min-h-[105px]"
              >
                {/* Centered Square Icon Squircle */}
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center border ${item.color} mb-1 sm:mb-1.5 shrink-0 backdrop-blur-md shadow-2xs group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5" />
                </div>

                {/* Title */}
                <h4 className="text-[11px] sm:text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug px-0.5">
                  {item.title}
                </h4>

                {/* Subtitle (Shown on tablet/desktop for extra context) */}
                <p className="text-[9.5px] text-slate-500 font-medium line-clamp-1 mt-0.5 hidden sm:block">
                  {item.subtitle}
                </p>
              </button>
            );
          })}
        </div>

        {/* Quick Institute Info Banner (Compact Glassmorphic Strip) */}
        <div className="p-2.5 sm:p-3 bg-blue-50/70 backdrop-blur-md rounded-2xl border border-blue-200/70 mt-3 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="text-left min-w-0">
              <h5 className="text-[11px] sm:text-xs font-black text-blue-950 font-bengali truncate">
                দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট
              </h5>
              <p className="text-[9px] text-blue-700 font-bold font-outfit uppercase tracking-wider truncate">
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
