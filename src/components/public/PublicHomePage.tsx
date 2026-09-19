import React, { useState } from 'react';
import {
  Search,
  Trophy,
  BookOpen,
  Bell,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Building,
  Zap,
  Wrench,
  Layers,
  ChevronRight,
  Calendar,
  Calculator,
  CalendarDays,
  GraduationCap,
  BarChart3,
} from 'lucide-react';
import { Exam, Notice, SystemSettings, AppEvent } from '../../types';
import { toBanglaDigits, formatBanglaDate } from '../../utils/bangla';
import { BottomSheet } from '../common/BottomSheet';
import { EventCountdownCard } from './EventCountdownCard';

interface PublicHomePageProps {
  exams: Exam[];
  notices: Notice[];
  events?: AppEvent[];
  settings: SystemSettings | null;
  onNavigateTab: (tab: string) => void;
}

export const PublicHomePage: React.FC<PublicHomePageProps> = ({
  exams,
  notices,
  events = [],
  settings,
  onNavigateTab,
}) => {
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const publishedExams = exams.filter((e) => e.status === 'PUBLISHED');
  const publishedNotices = notices.filter((n) => n.status === 'PUBLISHED');
  const pinnedNotices = publishedNotices.filter((n) => n.isPinned);
  const regularNotices = publishedNotices.filter((n) => !n.isPinned);
  const homePreviewNotices = [...pinnedNotices, ...regularNotices].slice(0, 3);

  const departments = settings?.departments || [
    { id: 'cmt', name: 'কম্পিউটার টেকনোলজি (CMT)', code: 'CMT' },
    { id: 'ct', name: 'সিভিল টেকনোলজি (CT)', code: 'CT' },
    { id: 'et', name: 'ইলেকট্রিক্যাল টেকনোলজি (ET)', code: 'ET' },
    { id: 'mt', name: 'মেকানিক্যাল টেকনোলজি (MT)', code: 'MT' },
    { id: 'ent', name: 'ইলেকট্রনিক্স টেকনোলজি (ENT)', code: 'ENT' },
    { id: 'at', name: 'আর্কিটেকচার টেকনোলজি (AT)', code: 'AT' },
  ];

  const getDeptIcon = (code: string) => {
    switch (code) {
      case 'CMT':
        return <Cpu className="w-5 h-5 text-blue-600" />;
      case 'CT':
        return <Building className="w-5 h-5 text-emerald-600" />;
      case 'ET':
        return <Zap className="w-5 h-5 text-amber-600" />;
      case 'MT':
        return <Wrench className="w-5 h-5 text-indigo-600" />;
      default:
        return <Layers className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-8 sm:space-y-12 pb-12 font-bengali relative">
      {/* Ambient Glassmorphism Backlight Spheres */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-400/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-80 right-10 w-80 h-80 bg-indigo-300/15 blur-3xl pointer-events-none rounded-full" />

      {/* ================= HERO INSTITUTE INTRODUCTION SECTION ================= */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-10 sm:pb-16 bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.04),0_0_0_1px_rgba(255,255,255,0.9)_inset] rounded-[36px] mx-4 sm:mx-6">
        {/* Top Edge Sheen */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Institute Official Logo & Portal Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 backdrop-blur-md border border-blue-200/80 text-blue-800 text-xs font-bold font-outfit uppercase tracking-wider mb-5 sm:mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>OFFICIAL RESULT ZONE</span>
          </div>

          <div className="flex justify-center mb-4 sm:mb-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/90 backdrop-blur-md p-1 shadow-xs border border-white/90 flex items-center justify-center">
              <img
                src="https://i.postimg.cc/mgyW32Y2/Firefly-Remove-Background.png"
                alt="দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট"
                className="w-full h-full object-contain drop-shadow-xs"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Institute Name */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight sm:leading-tight">
            দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট
          </h1>

          {/* Institute Address */}
          <p className="text-sm sm:text-base md:text-lg font-bold text-slate-600 mt-2 sm:mt-3 flex items-center justify-center gap-1.5 max-w-xl mx-auto">
            <span>বীরশ্রেষ্ঠ মোস্তফা কামাল বাস স্ট্যান্ড সংলগ্ন, ভোলা সদর, ভোলা</span>
          </p>

          {/* Portal Concept / Introduction */}
          <p className="text-sm sm:text-base text-slate-600 mt-3 sm:mt-4 max-w-2xl mx-auto leading-relaxed font-medium">
            দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউটের ডিপ্লোমা ইন ইঞ্জিনিয়ারিং শিক্ষার্থীদের পরীক্ষার ফলাফল দ্রুত, নির্ভুল ও স্বচ্ছভাবে অনুসন্ধানের জন্য প্রস্তুতকৃত ডিজিটাল DPIB RESULT ZONE।
          </p>

          {/* ================= TWO PRIMARY ACTION BUTTONS ================= */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-5 max-w-md sm:max-w-lg mx-auto">
            {/* Primary Action Button: ফলাফল অনুসন্ধান করুন */}
            <button
              id="home-btn-search-results"
              type="button"
              onClick={() => onNavigateTab('search')}
              className="w-full sm:w-auto flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:via-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-base sm:text-lg shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2.5 active:scale-98 cursor-pointer ring-2 ring-blue-500/20"
            >
              <Search className="w-5 h-5 stroke-[2.5]" />
              <span>ফলাফল অনুসন্ধান করুন</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>

            {/* Secondary Action Button: একাডেমিক এনালাইসিস */}
            <button
              id="home-btn-analysis"
              type="button"
              onClick={() => onNavigateTab('analysis')}
              className="w-full sm:w-auto flex-1 px-7 py-4 bg-white/90 backdrop-blur-md hover:bg-white text-slate-800 hover:text-blue-700 border border-slate-200/90 hover:border-blue-300 rounded-2xl font-black text-base sm:text-lg shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2.5 active:scale-98 cursor-pointer"
            >
              <BarChart3 className="w-5 h-5 text-blue-600 stroke-[2.2]" />
              <span>একাডেমিক এনালাইসিস</span>
            </button>
          </div>

          {/* Key Trust Badges */}
          <div className="mt-8 pt-6 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-slate-600 font-bold">
            <span className="flex items-center gap-1.5 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>ক্লাউড ভেরিফাইড রেজাল্ট</span>
            </span>
            <span className="flex items-center gap-1.5 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>নিরাপদ QR কোড যাচাই</span>
            </span>
            <span className="flex items-center gap-1.5 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>মুদ্রণযোগ্য ডিজিটাল গ্রেডশিট</span>
            </span>
          </div>
        </div>
      </section>

      {/* ================= REAL-TIME EVENT COUNTDOWN (IF UPCOMING EVENTS) ================= */}
      {events && events.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6">
          <EventCountdownCard
            events={events}
            onOpenCalendar={() => onNavigateTab('smart-calendar')}
          />
        </section>
      )}

      {/* ================= QUICK STATS & ACADEMIC TOOLS ================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-3.5">
          {/* GPA Calculator Quick Card */}
          <div
            onClick={() => onNavigateTab('gpa-calculator')}
            className="p-4 sm:p-5 bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/90 shadow-xs hover:shadow-md hover:bg-white transition-all cursor-pointer group active:scale-98"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-50/90 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-blue-100 shadow-2xs">
              <Calculator className="w-5 h-5" />
            </div>
            <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider font-outfit">BTEB TOOLS</p>
            <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">জিপিএ ক্যালকুলেটর</p>
            <span className="text-[11px] text-blue-600 font-bold mt-1 inline-flex items-center gap-0.5">
              <span>হিসাব করুন</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          {/* Book List Quick Card */}
          <div
            onClick={() => onNavigateTab('books')}
            className="p-4 sm:p-5 bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/90 shadow-xs hover:shadow-md hover:bg-white transition-all cursor-pointer group active:scale-98"
          >
            <div className="w-10 h-10 rounded-2xl bg-teal-50/90 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-teal-100 shadow-2xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <p className="text-[10px] text-teal-700 font-extrabold uppercase tracking-wider font-outfit">TEXTBOOKS</p>
            <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">বুক লিস্ট ও বই</p>
            <span className="text-[11px] text-teal-700 font-bold mt-1 inline-flex items-center gap-0.5">
              <span>সকল বই দেখুন</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          {/* Smart Calendar Quick Card */}
          <div
            onClick={() => onNavigateTab('smart-calendar')}
            className="p-4 sm:p-5 bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/90 shadow-xs hover:shadow-md hover:bg-white transition-all cursor-pointer group active:scale-98"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-50/90 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-emerald-100 shadow-2xs">
              <CalendarDays className="w-5 h-5" />
            </div>
            <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider font-outfit">CALENDAR</p>
            <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">স্মার্ট ক্যালেন্ডার</p>
            <span className="text-[11px] text-emerald-600 font-bold mt-1 inline-flex items-center gap-0.5">
              <span>তারিখ ও ছুটি</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          {/* Exams List */}
          <div
            onClick={() => onNavigateTab('exams')}
            className="p-4 sm:p-5 bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/90 shadow-xs hover:shadow-md hover:bg-white transition-all cursor-pointer group active:scale-98"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-50/90 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-amber-100 shadow-2xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider font-outfit">EXAMINATIONS</p>
            <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">পরীক্ষার তালিকা</p>
            <span className="text-[11px] text-amber-600 font-bold mt-1 inline-flex items-center gap-0.5">
              <span>{publishedExams.length > 0 ? `${toBanglaDigits(publishedExams.length)}টি প্রকাশিত` : 'তালিকা'}</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          {/* Notices */}
          <div
            onClick={() => onNavigateTab('notices')}
            className="p-4 sm:p-5 bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/90 shadow-xs hover:shadow-md hover:bg-white transition-all cursor-pointer group active:scale-98"
          >
            <div className="w-10 h-10 rounded-2xl bg-orange-50/90 text-orange-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-orange-100 shadow-2xs">
              <Bell className="w-5 h-5" />
            </div>
            <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider font-outfit">NOTICE BOARD</p>
            <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">ডিজিটাল নোটিশ</p>
            <span className="text-[11px] text-orange-600 font-bold mt-1 inline-flex items-center gap-0.5">
              <span>বিজ্ঞপ্তি পড়ুন</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </section>

      {/* ================= DYNAMIC NOTICE PREVIEW ================= */}
      {publishedNotices.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/90 p-5 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100/80 text-orange-700 flex items-center justify-center border border-orange-200/60 shadow-2xs">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">সর্বশেষ প্রকাশিত নোটিশ</h2>
                  <p className="text-xs text-slate-500">পরীক্ষা ও ফলাফল সংক্রান্ত সাম্প্রতিক বিজ্ঞপ্তি</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('notices')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>সকল নোটিশ ({toBanglaDigits(publishedNotices.length)})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {homePreviewNotices.map((notice) => (
                <div
                  key={notice.id}
                  onClick={() => setSelectedNotice(notice)}
                  className="py-3.5 sm:py-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-2xl px-3 transition-colors cursor-pointer group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {notice.isPinned && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-200/60">
                          পিন করা
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatBanglaDate(notice.publishedDate || notice.createdAt)}</span>
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                      {notice.title}
                    </h3>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= ONLINE ADMISSION BANNER ================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 shadow-md border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold font-outfit uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ADMISSION OPEN • ২০২৬-২৭ সেশন</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
              ৪ বছর মেয়াদি ডিপ্লোমা ইন ইঞ্জিনিয়ারিং কোর্সে ভর্তি চলছে
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              নিরাপদ অনলাইন রেজিস্ট্রেশনের মাধ্যমে পছন্দের টেকনোলজিতে আবেদন করুন এবং সরাসরি আবেদন স্ট্যাটাস ট্র্যাক করুন।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto relative z-10 shrink-0">
            <button
              id="home-btn-apply-admission"
              type="button"
              onClick={() => onNavigateTab('admission')}
              className="py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl text-xs sm:text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer ring-2 ring-blue-400/30"
            >
              <GraduationCap className="w-4 h-4" />
              <span>ভর্তি আবেদন করুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              id="home-btn-applicant-profile"
              type="button"
              onClick={() => onNavigateTab('admission')}
              className="py-3.5 px-5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs sm:text-sm border border-white/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer backdrop-blur-md"
            >
              <span>আবেদনকারী প্রোফাইল</span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= INSTITUTE DEPARTMENTS & CURRICULUM ================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center sm:text-left mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ইনস্টিটিউট টেকনোলজি ও বিভাগসমূহ
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউটের ৪ বছর মেয়াদি ডিপ্লোমা ইন ইঞ্জিনিয়ারিং পাঠ্যক্রম
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="p-4 sm:p-5 rounded-[24px] bg-white/80 backdrop-blur-xl border border-white/90 shadow-2xs hover:bg-white hover:shadow-md transition-all flex items-start gap-3.5"
            >
              <div className="w-11 h-11 rounded-2xl bg-slate-50/90 border border-slate-100 flex items-center justify-center shrink-0 shadow-2xs">
                {getDeptIcon(dept.code)}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                  {dept.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  কোড: <span className="font-mono font-bold text-slate-700">{dept.code}</span> • ৪ বছর (৮টি সেমিস্টার)
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Notice Details Bottom Sheet */}
      <BottomSheet
        isOpen={Boolean(selectedNotice)}
        onClose={() => setSelectedNotice(null)}
        title={selectedNotice?.title || 'নোটিশ বিবরণ'}
        subtitle={selectedNotice ? formatBanglaDate(selectedNotice.publishedDate || selectedNotice.createdAt) : ''}
      >
        {selectedNotice && (
          <div className="space-y-4 pb-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold font-outfit">
                {selectedNotice.category === 'EXAM'
                  ? 'পরীক্ষা'
                  : selectedNotice.category === 'RESULT'
                  ? 'ফলাফল'
                  : selectedNotice.category === 'URGENT'
                  ? 'জরুরি'
                  : 'সাধারণ'}
              </span>
              {selectedNotice.isPinned && (
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 rounded-full text-xs font-bold">
                  পিন করা নোটিশ
                </span>
              )}
            </div>

            <div className="bg-slate-50/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200/80 text-sm text-slate-800 leading-relaxed whitespace-pre-line font-medium">
              {selectedNotice.content}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedNotice(null)}
                className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
