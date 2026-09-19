import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  MapPin,
  Clock,
  BookOpen,
  Award,
  CheckCircle2,
  FileText,
  UserPlus,
  LogIn,
  Layers,
  Cpu,
  Building,
  Zap,
  Wrench,
  Radio,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Mail,
} from 'lucide-react';
import { toBanglaDigits, toEnglishDigits } from '../../utils/bangla';
import {
  subscribeAdmissionSettings,
  DEFAULT_ADMISSION_SETTINGS,
} from '../../services/admissionService';
import { AdmissionSettings } from '../../types';
import { AdmissionCountdownCard } from './AdmissionCountdownCard';
import { getAdmissionDeadlineStatus } from '../../services/admissionService';
import { AdmissionFooter } from './AdmissionFooter';

interface OfficialAdmissionInfoPageProps {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
  onBackToHome?: () => void;
}

export const OfficialAdmissionInfoPage: React.FC<OfficialAdmissionInfoPageProps> = ({
  onOpenRegister,
  onOpenLogin,
  onBackToHome,
}) => {
  const [admissionSettings, setAdmissionSettings] = useState<AdmissionSettings>(DEFAULT_ADMISSION_SETTINGS);

  useEffect(() => {
    const unsubscribe = subscribeAdmissionSettings((settings) => {
      setAdmissionSettings(settings);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const technologies = [
    {
      code: 'CMT',
      name: 'কম্পিউটার টেকনোলজি',
      enName: 'COMPUTER TECHNOLOGY',
      seats: '১২০',
      shifts: '১ম ও ২য় শিফট',
      icon: Cpu,
      color: 'blue',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'সফটওয়্যার ডেভেলপমেন্ট, ওয়েব ও অ্যাপ ডেভেলপমেন্ট, সাইবার সিকিউরিটি, নেটওয়ার্কিং ও ডেটাবেজ ম্যানেজমেন্ট।',
    },
    {
      code: 'CT',
      name: 'সিভিল টেকনোলজি',
      enName: 'CIVIL TECHNOLOGY',
      seats: '১২০',
      shifts: '১ম ও ২য় শিফট',
      icon: Building,
      color: 'emerald',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'স্ট্রাকচারাল ডিজাইন, অটোক্যাড ও থ্রিডি আর্কিটেকচার, ভবন ও সেতু নির্মাণ, সার্ভেয়িং ও আধুনিক কনস্ট্রাকশন ম্যানেজমেন্ট।',
    },
    {
      code: 'ET',
      name: 'ইলেকট্রিক্যাল টেকনোলজি',
      enName: 'ELECTRICAL TECHNOLOGY',
      seats: '১২০',
      shifts: '১ম ও ২য় শিফট',
      icon: Zap,
      color: 'amber',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      description: 'পাওয়ার সিস্টেম ও গ্রিড অপারেশন, সাবস্টেশন অটোমেশন, ইন্ডাস্ট্রিয়াল ওয়্যারিং, কন্ট্রোল সিস্টেম ও রিনিউয়েবল এনার্জি।',
    },
    {
      code: 'MT',
      name: 'মেকানিক্যাল টেকনোলজি',
      enName: 'MECHANICAL TECHNOLOGY',
      seats: '৬০',
      shifts: '১ম ও ২য় শিফট',
      icon: Wrench,
      color: 'indigo',
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description: 'ইন্ডাস্ট্রিয়াল মেশিন অপারেশন, থার্মোডাইনামিক্স, অটোমোবাইল ইঞ্জিনিয়ারিং, মেকানিকাল ড্রয়িং ও হাইড্রোলিক কন্ট্রোল।',
    },
    {
      code: 'ENT',
      name: 'ইলেকট্রনিক্স টেকনোলজি',
      enName: 'ELECTRONICS TECHNOLOGY',
      seats: '৬০',
      shifts: '১ম ও ২য় শিফট',
      icon: Radio,
      color: 'sky',
      bg: 'bg-sky-50 text-sky-700 border-sky-200',
      description: 'মাইক্রোকন্ট্রোলার ও পিএলসি প্রোগ্রামিং, আইওটি, সার্কিট ডিজাইন, টেলিকমিউনিকেশন ও রোবোটিক্স টেকনোলজি।',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen font-bengali bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8 flex-1 w-full">
        {/* ================= ADMISSION PORTAL TOP APP BAR ================= */}
        <div className="flex items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl px-4 py-3 shadow-2xs">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-800 transition-colors cursor-pointer group"
              title="মূল রেজাল্ট পোর্টালে ফিরে যান"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 p-0.5 flex items-center justify-center group-hover:border-blue-300">
                <img
                  src="https://i.postimg.cc/j5K3pb0M/sovapoti-images1.png"
                  alt="DPIB Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-left">
                <span className="text-slate-900 font-bold block text-xs">মূল ওয়েবসাইট</span>
                <span className="text-[10px] text-slate-500 font-medium block">ফলাফল ও অন্যান্য তথ্য</span>
              </div>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-700" />
              <span>লগইন</span>
            </button>
            <button
              type="button"
              onClick={onOpenRegister}
              className="px-3.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-blue-700/20 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>নিবন্ধন</span>
            </button>
          </div>
        </div>

        {/* ================= HERO INSTITUTIONAL HEADER & LOGIN/REGISTRATION SECTION ================= */}
        <section className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-10 shadow-xs">
          {/* Subtle decorative background pattern */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-50/60 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-50/50 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="text-center space-y-4 max-w-3xl mx-auto">
            {/* Institute Official Logo & Portal Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-xs font-bold font-outfit uppercase tracking-wider shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              <span>OFFICIAL ADMISSION PORTAL • ২০২৬-২৭ সেশন</span>
            </div>

            <div className="flex justify-center my-2">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white p-1 shadow-md border border-slate-200/90 flex items-center justify-center">
                <img
                  src="https://i.postimg.cc/j5K3pb0M/sovapoti-images1.png"
                  alt="দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-snug">
              দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm font-bold text-slate-600">
              <span className="flex items-center gap-1.5 text-blue-800 bg-blue-50/80 px-3 py-1 rounded-xl border border-blue-200/60">
                <MapPin className="w-4 h-4 text-blue-700 shrink-0" />
                <span>বীরশ্রেষ্ঠ মোস্তফা কামাল বাস স্ট্যান্ড সংলগ্ন, ভোলা সদর, ভোলা</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-3 py-1 rounded-xl font-outfit">
                <span>ইনস্টিটিউট কোড: ৪০০৫২</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto pt-1 font-medium">
              দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB) অনুমোদিত একটি আধুনিক ও শীর্ষস্থানীয় কারিগরি শিক্ষাপ্রতিষ্ঠান। চার বছর মেয়াদি ডিপ্লোমা ইন ইঞ্জিনিয়ারিং কোর্সে গুণগত ও কর্মমুখী শিক্ষা প্রদানের মাধ্যমে দক্ষ প্রকৌশলী গড়ে তোলাই আমাদের লক্ষ্য।
            </p>

            {/* Live Admission Deadline Countdown */}
            <div className="pt-3 max-w-2xl mx-auto w-full">
              <AdmissionCountdownCard settings={admissionSettings} />
            </div>

            {/* ================= PRIMARY BALANCED CTA BUTTONS ================= */}
            <div className="pt-3 sm:pt-4">
              {(() => {
                const deadlineInfo = getAdmissionDeadlineStatus(admissionSettings);
                const isExpired = deadlineInfo.isExpired;

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 max-w-lg mx-auto">
                    {/* Primary CTA: নতুন নিবন্ধন করুন */}
                    <button
                      id="btn-admission-landing-register"
                      type="button"
                      onClick={onOpenRegister}
                      disabled={isExpired}
                      className="w-full py-3.5 sm:py-4 px-6 bg-blue-700 hover:bg-blue-600 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm sm:text-base shadow-lg shadow-blue-700/20 hover:shadow-blue-700/30 transition-all flex items-center justify-center gap-2.5 active:scale-98 cursor-pointer"
                    >
                      <UserPlus className="w-5 h-5 stroke-[2.2]" />
                      <span>{isExpired ? 'আবেদন সমাপ্ত' : 'নতুন নিবন্ধন করুন'}</span>
                      {!isExpired && <ArrowRight className="w-4 h-4 ml-0.5" />}
                    </button>

                    {/* Secondary CTA: লগইন করুন */}
                    <button
                      id="btn-admission-landing-login"
                      type="button"
                      onClick={onOpenLogin}
                      className="w-full py-3.5 sm:py-4 px-6 bg-white hover:bg-sky-50 text-slate-800 hover:text-blue-800 border-2 border-slate-200 hover:border-blue-300 rounded-2xl font-bold text-sm sm:text-base shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2.5 active:scale-98 cursor-pointer"
                    >
                      <LogIn className="w-5 h-5 text-blue-700 stroke-[2.2]" />
                      <span>লগইন ও অবস্থা যাচাই</span>
                    </button>
                  </div>
                );
              })()}

              <p className="text-[11px] sm:text-xs text-slate-500 mt-3 font-medium">
                আবেদনের বর্তমান অবস্থা দেখতে বা প্রোফাইল পরিচালনা করতে অ্যাকাউন্ট ব্যবহার করুন
              </p>
            </div>
          </div>
        </section>

        {/* ================= REPOSITIONED INFORMATION CARD (SKY BLUE + WHITE + SUBTLE GRADIENT) ================= */}
        <section
          id="section-admission-key-info"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 text-white p-6 sm:p-8 shadow-[0_12px_36px_rgba(2,132,199,0.18)] border border-sky-300/30"
        >
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-sky-300/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-sky-100 text-xs font-bold font-outfit uppercase">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-200" />
                  <span>ADMISSION INFORMATION & HIGHLIGHTS</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  ভর্তি সংক্রান্ত মূল তথ্যাবলি ও সুযোগ-সুবিধা
                </h2>
              </div>
              <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-white text-blue-900 text-xs font-bold font-outfit shadow-xs">
                ইনস্টিটিউট কোড: ৪০০৫২
              </span>
            </div>

            {/* 4 Refined Academic Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20 transition-all space-y-2">
                <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/30 shadow-inner">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-white">কোর্সের মেয়াদ</h3>
                <p className="text-xs text-sky-100 leading-relaxed font-medium">
                  ৪ বছর মেয়াদি ৮ সেমিস্টার ডিপ্লোমা ইন ইঞ্জিনিয়ারিং শিক্ষাক্রম।
                </p>
              </div>

              <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20 transition-all space-y-2">
                <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/30 shadow-inner">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-white">অনুমোদন ও বোর্ড</h3>
                <p className="text-xs text-sky-100 leading-relaxed font-medium">
                  বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB) কর্তৃক সরকারি কারিকুলামভুক্ত।
                </p>
              </div>

              <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20 transition-all space-y-2">
                <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/30 shadow-inner">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-white">শিফট সুবিধা</h3>
                <p className="text-xs text-sky-100 leading-relaxed font-medium">
                  ১ম ও ২য় শিফট চালুকৃত (কর্তৃপক্ষ কর্তৃক মেধার ভিত্তিতে বরাদ্দ)।
                </p>
              </div>

              <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20 transition-all space-y-2">
                <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/30 shadow-inner">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-white">সনদের গ্রহণযোগ্যতা</h3>
                <p className="text-xs text-sky-100 leading-relaxed font-medium">
                  দেশ-বিদেশে সরকারি ও বেসরকারি চাকরির বাজারে শতভাগ স্বীকৃত।
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= AVAILABLE TECHNOLOGIES ================= */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-700" />
                <span>উপলব্ধ টেকনোলজিসমূহ</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                আবেদনকারী তার পছন্দ অনুযায়ী যেকোনো তিনটি টেকনোলজি পছন্দের তালিকায় রাখতে পারবেন
              </p>
            </div>
            <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200/60 self-start sm:self-auto font-outfit">
              ৫টি প্রযুক্তি বিভাগ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {technologies.map((tech) => {
              const Icon = tech.icon;
              return (
                <div
                  key={tech.code}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl border ${tech.bg}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase font-outfit px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {tech.code}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-slate-900">{tech.name}</h3>
                      <span className="text-[10px] text-slate-400 font-bold uppercase font-outfit">
                        {tech.enName}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {tech.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>আসন: <span className="font-outfit text-slate-900 font-black">{tech.seats}</span></span>
                    <span className="text-blue-700 font-bold">{tech.shifts}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= ELIGIBILITY & REQUIREMENTS ================= */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Eligibility Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                ভর্তির ন্যূনতম যোগ্যতা
              </h3>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 font-medium">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>যেকোনো শিক্ষাবোর্ড থেকে এসএসসি / দাখিল / এসএসসি (ভোকেশনাল) বা সমমান পরীক্ষায় উত্তীর্ণ।</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>বিজ্ঞান, মানবিক বা ব্যবসায় শিক্ষা যেকোনো বিভাগ থেকে ন্যূনতম জিপিএ ২.০০ (GPA 2.00)।</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>বাংলাদেশ কারিগরি শিক্ষা বোর্ডের সর্বশেষ নীতিমালা অনুযায়ী কোনো বয়সসীমা প্রযোজ্য নয়।</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>পূর্ববর্তী যেকোনো পাসের সনের শিক্ষার্থীরাও নিয়মানুযায়ী আবেদন করতে পারবেন।</span>
              </li>
            </ul>
          </div>

          {/* Required Documents Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                প্রয়োজনীয় কাগজপত্র ও নির্দেশনাবলি
              </h3>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 font-medium">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <span>এসএসসি / সমমান পরীক্ষার মূল বা সাময়িক মার্কশিট / ট্রান্সক্রিপ্ট ও প্রশংসাপত্র।</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <span>আবেদনকারীর সদ্য তোলা পাসপোর্ট সাইজের ৪ কপি রঙিন ছবি।</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <span>আবেদনকারীর ডিজিটাল জন্মনিবন্ধন সনদ অথবা জাতীয় পরিচয়পত্রের স্পষ্ট কপি।</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <span>পিতা ও মাতার জাতীয় পরিচয়পত্রের ফটোকপি ও অভিভাবকের ফোন নম্বর।</span>
              </li>
            </ul>
          </div>
        </section>

        {/* ================= STEP-BY-STEP ADMISSION WORKFLOW ================= */}
        <section className="bg-slate-50/80 rounded-3xl p-6 sm:p-8 border border-slate-200/80 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              ভর্তি আবেদনের ৩টি সহজ ধাপ
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              কয়েক মিনিটেই অনলাইন ফরম পূরণ সম্পন্ন করুন
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-center">
              <div className="w-9 h-9 rounded-xl bg-blue-700 text-white font-outfit font-black text-sm flex items-center justify-center mx-auto">
                ০১
              </div>
              <h4 className="text-sm font-black text-slate-900">নিবন্ধন করুন</h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                মোবাইল নম্বর ও পছন্দের পাসওয়ার্ড দিয়ে দ্রুত নিজের অ্যাকাউন্ট তৈরি করুন।
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-center">
              <div className="w-9 h-9 rounded-xl bg-blue-700 text-white font-outfit font-black text-sm flex items-center justify-center mx-auto">
                ০২
              </div>
              <h4 className="text-sm font-black text-slate-900">ফরম পূরণ ও পছন্দক্রম</h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                ব্যক্তিগত তথ্য, শিক্ষাগত ফলাফল ও পছন্দের টেকনোলজি তালিকা নির্বাচন করুন।
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-center">
              <div className="w-9 h-9 rounded-xl bg-blue-700 text-white font-outfit font-black text-sm flex items-center justify-center mx-auto">
                ০৩
              </div>
              <h4 className="text-sm font-black text-slate-900">আবেদন ট্র্যাকিং ও প্রিন্ট</h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                আবেদন ফরম সাবমিট করে প্রোফাইল থেকে স্ট্যাটাস যাচাই ও প্রিন্ট কপি সংগ্রহ করুন।
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ================= DEDICATED ADMISSION FOOTER ================= */}
      <AdmissionFooter settings={admissionSettings} />
    </div>
  );
};
