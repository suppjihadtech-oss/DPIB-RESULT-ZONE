import React from 'react';
import {
  FileSpreadsheet,
  CalendarDays,
  Calendar,
  FileText,
  Bell,
  Layers,
  Settings,
  Users,
  BookOpen,
  Award,
  UserCheck,
  Building,
  Sparkles,
  Sliders,
  BellRing,
  ExternalLink,
  GraduationCap,
  ChevronRight,
  Phone,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { DocumentTab } from './documents/AcademicDocumentsHub';

interface AdminMenuPageProps {
  onNavigate: (section: string, docTab?: DocumentTab) => void;
}

export const AdminMenuPage: React.FC<AdminMenuPageProps> = ({ onNavigate }) => {
  // 1. Academic & Document Generators
  const documentTools = [
    {
      id: 'result-generator' as DocumentTab,
      section: 'documents',
      title: 'ফলাফল তৈরি',
      en: 'RESULT SHEET',
      badge: 'BTEB',
      icon: FileSpreadsheet,
      color: 'teal',
      iconBg: 'bg-teal-50 text-teal-700 group-hover:bg-teal-700 group-hover:text-white',
      borderHover: 'hover:border-teal-500/80 hover:bg-teal-50/30',
    },
    {
      id: 'exam-routine' as DocumentTab,
      section: 'documents',
      title: 'পরীক্ষার রুটিন',
      en: 'EXAM ROUTINE',
      badge: 'রুটিন',
      icon: CalendarDays,
      color: 'violet',
      iconBg: 'bg-violet-50 text-violet-700 group-hover:bg-violet-700 group-hover:text-white',
      borderHover: 'hover:border-violet-500/80 hover:bg-violet-50/30',
    },
    {
      id: 'class-routine' as DocumentTab,
      section: 'documents',
      title: 'ক্লাস রুটিন',
      en: 'CLASS ROUTINE',
      badge: 'সময়সূচি',
      icon: Calendar,
      color: 'sky',
      iconBg: 'bg-sky-50 text-sky-700 group-hover:bg-sky-700 group-hover:text-white',
      borderHover: 'hover:border-sky-500/80 hover:bg-sky-50/30',
    },
    {
      id: 'question-paper' as DocumentTab,
      section: 'documents',
      title: 'প্রশ্নপত্র তৈরি',
      en: 'QUESTION PAPER',
      badge: 'পরীক্ষা',
      icon: FileText,
      color: 'emerald',
      iconBg: 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white',
      borderHover: 'hover:border-emerald-500/80 hover:bg-emerald-50/30',
    },
    {
      id: 'notice-generator' as DocumentTab,
      section: 'documents',
      title: 'অফিসিয়াল নোটিশ',
      en: 'OFFICIAL NOTICE',
      badge: 'বিজ্ঞপ্তি',
      icon: Bell,
      color: 'amber',
      iconBg: 'bg-amber-50 text-amber-700 group-hover:bg-amber-700 group-hover:text-white',
      borderHover: 'hover:border-amber-500/80 hover:bg-amber-50/30',
    },
    {
      id: 'template-management' as DocumentTab,
      section: 'documents',
      title: 'টেমপ্লেট পরিচালনা',
      en: 'TEMPLATES',
      badge: 'লেআউট',
      icon: Layers,
      color: 'slate',
      iconBg: 'bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white',
      borderHover: 'hover:border-slate-500/80 hover:bg-slate-50',
    },
    {
      id: 'document-settings' as DocumentTab,
      section: 'documents',
      title: 'ডকুমেন্ট সেটিংস',
      en: 'DOC SETTINGS',
      badge: 'কনফিগ',
      icon: Sliders,
      color: 'slate',
      iconBg: 'bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white',
      borderHover: 'hover:border-slate-500/80 hover:bg-slate-50',
    },
  ];

  // 2. Core Administration Modules
  const coreModules = [
    {
      id: 'admissions',
      title: 'ভর্তি আবেদন',
      en: 'ADMISSION APPLICATIONS',
      badge: 'ভর্তি',
      icon: GraduationCap,
      iconBg: 'bg-teal-50 text-teal-700 group-hover:bg-teal-700 group-hover:text-white',
      borderHover: 'hover:border-teal-500/80 hover:bg-teal-50/30',
    },
    {
      id: 'teachers',
      title: 'শিক্ষক ব্যবস্থাপনা',
      en: 'TEACHER MANAGEMENT',
      badge: 'টিচার',
      icon: UserCheck,
      iconBg: 'bg-indigo-50 text-indigo-700 group-hover:bg-indigo-700 group-hover:text-white',
      borderHover: 'hover:border-indigo-500/80 hover:bg-indigo-50/30',
    },
    {
      id: 'students',
      title: 'শিক্ষার্থী ডাটাবেজ',
      en: 'STUDENT DATABASE',
      badge: 'ডাটাবেজ',
      icon: Users,
      iconBg: 'bg-blue-50 text-blue-700 group-hover:bg-blue-700 group-hover:text-white',
      borderHover: 'hover:border-blue-500/80 hover:bg-blue-50/30',
    },
    {
      id: 'exams',
      title: 'পরীক্ষা ব্যবস্থাপনা',
      en: 'EXAMS & SCHEDULE',
      badge: 'পরীক্ষা',
      icon: BookOpen,
      iconBg: 'bg-cyan-50 text-cyan-700 group-hover:bg-cyan-700 group-hover:text-white',
      borderHover: 'hover:border-cyan-500/80 hover:bg-cyan-50/30',
    },
    {
      id: 'results',
      title: 'ফলাফল নিয়ন্ত্রণ',
      en: 'RESULTS CONTROL',
      badge: 'ফলাফল',
      icon: Award,
      iconBg: 'bg-teal-50 text-teal-700 group-hover:bg-teal-700 group-hover:text-white',
      borderHover: 'hover:border-teal-500/80 hover:bg-teal-50/30',
    },
    {
      id: 'events',
      title: 'ইভেন্ট ও ক্যালেন্ডার',
      en: 'ACADEMIC CALENDAR',
      badge: 'ক্যালেন্ডার',
      icon: CalendarDays,
      iconBg: 'bg-purple-50 text-purple-700 group-hover:bg-purple-700 group-hover:text-white',
      borderHover: 'hover:border-purple-500/80 hover:bg-purple-50/30',
    },
    {
      id: 'notices',
      title: 'নোটিশ ব্যবস্থাপনা',
      en: 'NOTICE BOARD',
      badge: 'বোর্ড',
      icon: BellRing,
      iconBg: 'bg-rose-50 text-rose-700 group-hover:bg-rose-700 group-hover:text-white',
      borderHover: 'hover:border-rose-500/80 hover:bg-rose-50/30',
    },
    {
      id: 'books',
      title: 'বুক লিস্ট ব্যবস্থাপনা',
      en: 'BOOK LIST & TEXTBOOKS',
      badge: 'পাঠ্যবই',
      icon: BookOpen,
      iconBg: 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white',
      borderHover: 'hover:border-emerald-500/80 hover:bg-emerald-50/30',
    },
    {
      id: 'shifts',
      title: 'শিফট ও সময়সূচী',
      en: 'SHIFT MANAGEMENT',
      badge: 'শিফট',
      icon: Clock,
      iconBg: 'bg-teal-50 text-teal-700 group-hover:bg-teal-700 group-hover:text-white',
      borderHover: 'hover:border-teal-500/80 hover:bg-teal-50/30',
    },
    {
      id: 'security',
      title: 'নিরাপত্তা ও ২-ধাপ যাচাই',
      en: 'SECURITY & 2FA',
      badge: 'সুরক্ষা',
      icon: ShieldCheck,
      iconBg: 'bg-teal-50 text-teal-700 group-hover:bg-teal-700 group-hover:text-white',
      borderHover: 'hover:border-teal-500/80 hover:bg-teal-50/30',
    },
    {
      id: 'settings',
      title: 'সিস্টেম সেটিংস',
      en: 'SYSTEM SETTINGS',
      badge: 'সেটিংস',
      icon: Settings,
      iconBg: 'bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white',
      borderHover: 'hover:border-slate-500/80 hover:bg-slate-50',
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8 font-bengali">
      {/* Compact Hub Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200/60 text-teal-800 text-[10px] font-black uppercase tracking-wider font-outfit">
              DIGITAL ACADEMIC OFFICE
            </span>
            <span className="text-xs text-slate-400 font-bold">•</span>
            <span className="text-xs text-slate-500 font-bold font-outfit">
              INSTITUTE CODE: 40052
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            অ্যাকাডেমিক মেনু ও সিস্টেম হাব
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            নিচের যেকোনো মডিউল বা ডকুমেন্টে ক্লিক করে সরাসরি প্রবেশ করুন।
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('admissions')}
            className="px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-all border border-teal-200 flex items-center gap-1.5 cursor-pointer"
          >
            <GraduationCap className="w-3.5 h-3.5 text-teal-700" />
            <span>ভর্তি আবেদন</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('documents', 'result-generator')}
            className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>ডকুমেন্ট হাব</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: ACADEMIC DOCUMENTS & ROUTINES (Modern Sleek Horizontal Bars) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-600" />
            <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide font-outfit">
              ACADEMIC DOCUMENTS & TIMETABLES
            </h2>
            <span className="text-xs text-slate-500 font-bold">
              (একাডেমিক ডকুমেন্ট ও রুটিন)
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-400 font-outfit">
            {documentTools.length} MODULES
          </span>
        </div>

        {/* Modern Compact Horizontal List Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {documentTools.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                id={`btn-menu-${item.id}`}
                onClick={() => onNavigate(item.section, item.id)}
                className={`w-full bg-white px-3.5 py-2.5 sm:py-3 rounded-2xl border border-slate-200/90 ${item.borderHover} shadow-2xs hover:shadow-xs transition-all active:scale-[0.98] group cursor-pointer flex items-center justify-between gap-3 text-left`}
              >
                {/* Left: SVG Icon + Bangla Label */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${item.iconBg}`}>
                    <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform group-hover:scale-110" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-800 transition-colors truncate">
                        {item.title}
                      </span>
                    </div>
                    <div className="text-[9.5px] text-slate-400 font-outfit uppercase tracking-wider font-semibold truncate leading-tight mt-0.5">
                      {item.en}
                    </div>
                  </div>
                </div>

                {/* Right: Small Badge + Chevron */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-outfit">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: CORE SYSTEM MANAGEMENT (Modern Sleek Horizontal Bars) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-600" />
            <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide font-outfit">
              CORE SYSTEM & DATABASE
            </h2>
            <span className="text-xs text-slate-500 font-bold">
              (কোর সিস্টেম ও ডাটাবেজ)
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-400 font-outfit">
            {coreModules.length} MODULES
          </span>
        </div>

        {/* Modern Compact Horizontal List Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {coreModules.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                id={`btn-menu-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`w-full bg-white px-3.5 py-2.5 sm:py-3 rounded-2xl border border-slate-200/90 ${item.borderHover} shadow-2xs hover:shadow-xs transition-all active:scale-[0.98] group cursor-pointer flex items-center justify-between gap-3 text-left`}
              >
                {/* Left: SVG Icon + Bangla Label */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${item.iconBg}`}>
                    <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform group-hover:scale-110" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-800 transition-colors truncate">
                        {item.title}
                      </span>
                    </div>
                    <div className="text-[9.5px] text-slate-400 font-outfit uppercase tracking-wider font-semibold truncate leading-tight mt-0.5">
                      {item.en}
                    </div>
                  </div>
                </div>

                {/* Right: Small Badge + Chevron */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-outfit">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-700 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
