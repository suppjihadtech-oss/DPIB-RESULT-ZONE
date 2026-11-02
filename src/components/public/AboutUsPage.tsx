import React from 'react';
import {
  ArrowLeft,
  Sparkles,
  Target,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Search,
  Bell,
  BarChart3,
  Calculator,
  CalendarDays,
  Mail,
  MapPin,
  Compass,
  Code2,
  Wrench,
} from 'lucide-react';
import { DpibBrandTitle } from '../common/DpibBrandTitle';

interface AboutUsPageProps {
  onBack: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const AboutUsPage: React.FC<AboutUsPageProps> = ({ onBack, onNavigateTab }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-10 sm:space-y-14 font-bengali text-slate-800">
      {/* ================= TOP NAVIGATION / BACK BUTTON ================= */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/90 hover:bg-white text-slate-700 hover:text-slate-950 border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md transition-all active:scale-95 text-xs sm:text-sm font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600 shrink-0" />
          <span>হোমে ফিরে যান</span>
        </button>

        <div className="text-right">
          <span className="text-[11px] sm:text-xs text-slate-500 font-semibold">
            দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট, ভোলা
          </span>
        </div>
      </div>

      {/* ================= SECTION 1: DPIB RESULT ZONE সম্পর্কে ================= */}
      <section className="space-y-8">
        {/* Main Hero Introduction Card */}
        <div className="relative overflow-hidden rounded-[32px] bg-white/85 backdrop-blur-2xl border border-slate-200/90 p-6 sm:p-10 shadow-xs">
          {/* Subtle Accent Sheen on Top Edge */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-violet-500/80 to-transparent" />

          <div className="max-w-3xl space-y-5">
            {/* Tag / Category Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-50 text-violet-800 border border-violet-200/80 text-xs font-bold font-outfit uppercase tracking-wider shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>আমাদের পরিচিতি ও লক্ষ্য</span>
            </div>

            {/* Main Page Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-snug">
                দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউটের ডিজিটাল ফলাফল ও একাডেমিক প্ল্যাটফর্ম
              </h1>
              <div className="mt-2 text-sm sm:text-base font-bold text-slate-600 flex items-center gap-2">
                <span>অফিশিয়াল রেজাল্ট সিস্টেম:</span>
                <DpibBrandTitle className="text-base sm:text-lg inline-block" />
              </div>
            </div>

            {/* পরিচিতি (Introduction) */}
            <div className="pt-2 border-t border-slate-100 space-y-3.5 text-slate-700 text-sm sm:text-base leading-relaxed font-normal">
              <p>
                <strong className="font-bold text-slate-900">DPIB RESULT ZONE</strong> হলো দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট, ভোলার শিক্ষার্থীদের পরীক্ষার ফলাফল ও প্রাসঙ্গিক একাডেমিক তথ্য সহজে খুঁজে পাওয়ার জন্য তৈরি একটি স্বয়ংসম্পূর্ণ ডিজিটাল প্ল্যাটফর্ম।
              </p>
              <p>
                শিক্ষার্থীরা যেন যেকোনো প্রান্ত থেকে যেকোনো সময় ঝামেলাহীনভাবে নিজেদের ফলাফল দেখতে পারে এবং পরীক্ষাসংক্রান্ত তথ্য ও একাডেমিক সার্কুলার এক জায়গায় নির্ভরযোগ্যভাবে পেতে পারে—সেই লক্ষ্য নিয়ে এই প্ল্যাটফর্মটি গড়ে তোলা হয়েছে।
              </p>
            </div>
          </div>
        </div>

        {/* প্রধান লক্ষ্যসমূহ (Key Objectives) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                প্ল্যাটফর্মটির প্রধান লক্ষ্য
              </h2>
              <p className="text-xs text-slate-500 font-medium">শিক্ষার্থীদের সুবিধার্থে নির্ধারিত মূল লক্ষ্যসমূহ</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-violet-700 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-violet-600" />
                <span className="text-slate-900 font-extrabold">সহজ ফলাফল অনুসন্ধান</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                রোল নম্বরের মাধ্যমে ফলাফল দেখার প্রক্রিয়া সহজ ও সুবিধাজনক করা, যাতে কোনো জটিলতা ছাড়াই শিক্ষার্থীরা নিজেদের প্রাপ্ত নম্বর ও গ্রেড দেখতে পারে।
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-violet-700 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-violet-600" />
                <span className="text-slate-900 font-extrabold">পরীক্ষাসংক্রান্ত তথ্য সহজলভ্য করা</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                ইনস্টিটিউট কর্তৃক আয়োজিত বিভিন্ন সেমিস্টার ও অভ্যন্তরীণ পরীক্ষার তালিকা ও তথ্য সহজে খুঁজে পাওয়ার সার্বক্ষণিক সুযোগ প্রদান করা।
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-violet-700 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-violet-600" />
                <span className="text-slate-900 font-extrabold">দ্রুত একাডেমিক বিজ্ঞপ্তি পৌঁছানো</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                পরীক্ষা ও ফলাফলসংক্রান্ত গুরুত্বপূর্ণ একাডেমিক বিজ্ঞপ্তি ও আদেশগুলো দ্রুত শিক্ষার্থীদের কাছে ডিজিটাল নোটিশ বোর্ডের মাধ্যমে পৌঁছে দেওয়া।
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-violet-700 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-violet-600" />
                <span className="text-slate-900 font-extrabold">সুসংগঠিত একাডেমিক প্ল্যাটফর্ম</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                বইয়ের তালিকা, সেমিস্টার জিপিএ হিসাব ও একাডেমিক ক্যালেন্ডারের মতো দরকারি একাডেমিক সেবাগুলোকে একটি সুসংগঠিত প্ল্যাটফর্মে উপস্থাপন করা।
              </p>
            </div>
          </div>
        </div>

        {/* প্ল্যাটফর্মের সুবিধা (বাস্তবে সক্রিয় সুবিধাসমূহ) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                বর্তমানে উপলব্ধ সুবিধাসমূহ
              </h2>
              <p className="text-xs text-slate-500 font-medium">সফটওয়্যারে বাস্তবে চালু থাকা মূল ফিচার ও সেবাসমূহ</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-2xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
                <Search className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">ফলাফল অনুসন্ধান</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                রোল নম্বর প্রবেশ করিয়ে সেমিস্টার পরীক্ষার ফলাফল, প্রতিটি বিষয়ের প্রাপ্ত নম্বর, লেটার গ্রেড এবং মোট জিপিএ বিস্তারিতভাবে পর্যবেক্ষণ।
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-2xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">অনলাইন রেজাল্ট যাচাই</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                ভেরিফিকেশন কোড কিংবা কিউআর কোডের মাধ্যমে ডিজিটাল মার্কশিটের সত্যতা অনলাইনে যাচাই ও প্রিন্ট করার সুবিধা।
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-2xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">ডিজিটাল নোটিশ বোর্ড</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                ইনস্টিটিউটের অফিসিয়াল পরীক্ষার নোটিশ, রুটিন এবং একাডেমিক সার্কুলার প্রকাশের সাথে সাথে পড়ার ব্যবস্থা।
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-2xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-1">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">বুক লিস্ট ও টেক্সটবুক</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                টেকনোলজি ও সেমিস্টার নির্বাচন করে কারিগরি শিক্ষা বোর্ড নির্ধারিত সকল পাঠ্যবইয়ের নাম ও বিষয় কোড জানার সুবিধা।
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-2xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1">
                <Calculator className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">জিপিএ ক্যালকুলেটর</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                কারিগরি শিক্ষা বোর্ডের অফিশিয়াল ক্রেডিট ও গ্রেডিং স্কেল অনুসারে সেমিস্টার জিপিএ ও মোট পয়েন্ট গণনার ডিজিটাল টুল।
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-2xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                <CalendarDays className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">স্মার্ট ক্যালেন্ডার</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                ইংরেজি, বাংলা ও হিজরি তারিখসহ কলেজের বাৎসরিক একাডেমিক ক্যালেন্ডার ও ছুটির দিনগুলো সরাসরি দেখার সুবিধা।
              </p>
            </div>
          </div>
        </div>

        {/* ভবিষ্যৎ লক্ষ্য (Future Direction) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-100/80 border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Compass className="w-4 h-4 text-violet-700" />
            <span>ভবিষ্যৎ লক্ষ্য ও পরিকল্পনা</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            প্ল্যাটফর্মটিকে শিক্ষার্থীদের নিয়মিত মতামত ও শিক্ষকগণের পরামর্শের ভিত্তিতে আরও সহজ, নির্ভরযোগ্য ও শিক্ষার্থীবান্ধব করার নিরন্তর প্রয়াস অব্যাহত থাকবে। কোনো অপ্রয়োজনীয় জটিলতা ছাড়াই পরীক্ষার ফলাফল প্রাপ্তি এবং একাডেমিক তথ্যসেবাকে আরও দ্রুতগতিতে উপস্থাপন করাই আমাদের ভবিষ্যৎ উদ্দেশ্য।
          </p>
        </div>
      </section>

      {/* ================= SECTION 2: সফটওয়্যার ডেভেলপার সম্পর্কে ================= */}
      <section className="space-y-6 pt-6 border-t border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              সফটওয়্যার ডেভেলপার পরিচিতি
            </h2>
            <p className="text-xs text-slate-500 font-medium">উদ্যোগ ও ডেভেলপমেন্ট পরিচিতি</p>
          </div>
        </div>

        {/* Developer Profile Card (Pure Clean Glassmorphism conforming to Rule 4 & 5) */}
        <div className="relative overflow-hidden rounded-[32px] bg-white/90 backdrop-blur-2xl border border-violet-200/70 p-6 sm:p-8 shadow-xs">
          {/* Subtle top edge violet sheen */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-violet-500/70 to-transparent" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            {/* Developer Circular Profile Photo */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-4 ring-violet-200/80 shadow-md border-2 border-white bg-slate-100 flex items-center justify-center">
                <img
                  src="/assets/aistudio/1769429789676_88504b83.jpg"
                  alt="মোঃ জিহাদ - সফটওয়্যার ডেভেলপার"
                  className="w-full h-full object-cover object-top"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback gracefully without showing any fake person image
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>

            {/* Developer Info & Narrative */}
            <div className="space-y-3 text-center sm:text-left flex-1 min-w-0">
              {/* Highlighted Developer Name */}
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-violet-950 tracking-tight">
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #581C87 0%, #7E22CE 40%, #9333EA 70%, #A855F7 100%)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      color: 'transparent',
                    }}
                  >
                    মোঃ জিহাদ
                  </span>
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
                  সফটওয়্যার ডেভেলপার ও ডিজাইনার
                </p>
              </div>

              {/* Institution and Department Badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-900 border border-violet-200 text-xs font-bold">
                  <Wrench className="w-3.5 h-3.5 text-violet-600" />
                  <span>বিভাগ: মেকানিক্যাল টেকনোলজি</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                  <span>দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট, ভোলা</span>
                </span>
              </div>

              {/* Dignified & Natural Biography */}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal pt-1">
                ডিজিটাল প্রযুক্তি ও সফটওয়্যার তৈরির প্রতি গভীর আগ্রহ এবং সহপাঠী ও শিক্ষার্থীদের একাডেমিক কাজগুলোকে সহজ করার আন্তরিক তাগিদ থেকেই মোঃ জিহাদ এই রেজাল্ট জোন সিস্টেমটি তৈরি করেছেন। পলিটেকনিকের একজন শিক্ষার্থী হিসেবে বাস্তব অভিজ্ঞতা ও শিক্ষকদের দিকনির্দেশনায় তিনি এই প্ল্যাটফর্মটি নকশা ও উন্নয়ন করেছেন, যাতে দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউটের প্রতিটি শিক্ষার্থী পরীক্ষার ফলাফল ও একাডেমিক তথ্য নির্বিঘ্নে পেতে পারে।
              </p>

              {/* Contact / Email Info */}
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>ভোলা সদর, ভোলা</span>
                </span>
                <a
                  href="mailto:techjihad6825@gmail.com"
                  className="flex items-center gap-1.5 bg-violet-50 hover:bg-violet-100 text-violet-900 border border-violet-200 px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-violet-600" />
                  <span>techjihad6825@gmail.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= BOTTOM RETURN BAR ================= */}
      <div className="pt-4 pb-8 flex items-center justify-center">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>হোম পেজে ফিরে যান</span>
        </button>
      </div>
    </div>
  );
};
