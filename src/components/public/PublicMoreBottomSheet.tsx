import React from 'react';
import {
  Bell,
  ShieldCheck,
  ChevronRight,
  Calculator,
  CalendarDays,
  GraduationCap,
  Trophy,
  BookOpen,
} from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';

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
      id: 'books',
      title: 'বুক লিস্ট ও পাঠ্যবই',
      subtitle: 'সেমিস্টার ও টেকনোলজি নির্বাচন করে বোর্ড নির্ধারিত সকল বই, কোড ও মূল্য দেখুন',
      icon: BookOpen,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      action: () => {
        onNavigateTab('books');
        onClose();
      },
    },
    {
      id: 'merit',
      title: 'শীর্ষস্থানীয় মেধাতালিকা',
      subtitle: 'সর্বোচ্চ GPA ও অর্জিত নম্বরের ভিত্তিতে প্রস্তুতকৃত অফিশিয়াল মেধা তালিকা',
      icon: Trophy,
      color: 'bg-amber-50 text-amber-600 border-amber-200/80',
      action: () => {
        onNavigateTab('merit');
        onClose();
      },
    },
    {
      id: 'admission',
      title: 'ভর্তি আবেদন ও প্রোফাইল',
      subtitle: 'ডিপ্লোমা ইন ইঞ্জিনিয়ারিং ভর্তি আবেদন ও আবেদন ট্র্যাকিং',
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
      subtitle: 'কারিগরি বোর্ডের নিয়ম অনুযায়ী সেমিস্টার জিপিএ হিসাব',
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
      subtitle: 'ইংরেজি, বাংলা ও হিজরি সনসহ কলেজ অনুষ্ঠান ও ছুটির তালিকা',
      icon: CalendarDays,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
      action: () => {
        onNavigateTab('smart-calendar');
        onClose();
      },
    },
    {
      id: 'notifications-modal',
      title: 'পুশ নোটিফিকেশন সেটিংস',
      subtitle: 'ফলাফল ও জরুরি নোটিশের তাৎক্ষণিক মোবাইল অ্যালার্ট',
      icon: Bell,
      color: 'bg-rose-50 text-rose-600 border-rose-200/80',
      action: () => {
        onClose();
        if (onOpenNotificationModal) onOpenNotificationModal();
      },
    },
    {
      id: 'notices',
      title: 'বিজ্ঞপ্তি ও নোটিশ বোর্ড',
      subtitle: 'ইনস্টিটিউটের সর্বশেষ পরীক্ষার নোটিশ ও আদেশ',
      icon: Bell,
      color: 'bg-amber-50 text-amber-600 border-amber-200/80',
      action: () => {
        onNavigateTab('notices');
        onClose();
      },
    },
    {
      id: 'verify',
      title: 'ফলাফল অনলাইন যাচাইকরণ',
      subtitle: 'ডিজিটাল রেজাল্ট কোড বা কিউআর কোড ভেরিফিকেশন',
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
      subtitle="DPIB RESULT ZONE পোর্টালের অতিরিক্ত বিকল্প"
    >
      <div className="space-y-2.5 pb-6 font-bengali">
        {menuOptions.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className="w-full p-3.5 sm:p-4 rounded-2xl bg-white/65 hover:bg-white/95 backdrop-blur-md border border-white/80 hover:border-blue-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between text-left group cursor-pointer active:scale-98"
            >
              <div className="flex items-center gap-3.5 min-w-0 pr-2">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${item.color} shrink-0 backdrop-blur-md shadow-xs`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5 line-clamp-1">{item.subtitle}</p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-slate-100/80 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-slate-400 transition-all shrink-0">
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          );
        })}

        {/* Quick Institute Info Banner (Light Glass) */}
        <div className="p-4 bg-blue-50/75 backdrop-blur-md rounded-2xl border border-blue-200/70 mt-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="text-left min-w-0">
            <h5 className="text-xs sm:text-sm font-black text-blue-950 font-bengali truncate">
              দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট
            </h5>
            <p className="text-[10px] sm:text-[11px] text-blue-700 font-bold font-outfit uppercase tracking-wider mt-0.5 truncate">
              DAKKINBANGO POLYTECHNIC INSTITUTE, BHOLA
            </p>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
