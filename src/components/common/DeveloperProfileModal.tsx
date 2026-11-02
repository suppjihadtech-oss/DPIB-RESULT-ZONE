import React, { useState } from 'react';
import {
  X,
  Mail,
  MapPin,
  GraduationCap,
  Sparkles,
  Code2,
  ExternalLink,
  Check,
  Copy,
  Heart,
  Laptop,
} from 'lucide-react';
import { DpibBrandTitle } from './DpibBrandTitle';

interface DeveloperProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperProfileModal: React.FC<DeveloperProfileModalProps> = ({ isOpen, onClose }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('techjihad6825@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-bengali">
      {/* Frosted Glass Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Glassmorphic Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dev-modal-title"
        className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-3xl border border-violet-200/80 shadow-[0_25px_60px_-15px_rgba(76,29,149,0.25)] overflow-hidden my-auto z-10 transition-all duration-300 transform scale-100"
      >
        {/* Subtle Top Decorative Gradient Sheen (Violet to Lavender) */}
        <div className="h-2 w-full bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-500" />

        {/* Ambient Top Glow Sphere */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-violet-400/10 blur-3xl rounded-full pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="বন্ধ করুন"
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-100/90 hover:bg-violet-100 text-slate-600 hover:text-violet-900 transition-colors flex items-center justify-center cursor-pointer shadow-2xs border border-slate-200/60"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Developer Header Profile Block */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* Developer Photo */}
            <div className="relative shrink-0 group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-violet-200/90 shadow-md border-2 border-white bg-slate-100">
                <img
                  src="/assets/aistudio/1769429789676_88504b83.jpg"
                  alt="মোহাম্মদ জিহাদ - সফটওয়্যার ডেভেলপার"
                  className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to placeholder if path not resolved
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              {/* Verified Developer Badge */}
              <div className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold shadow-xs flex items-center gap-1 border border-white">
                <Code2 className="w-3 h-3" />
                <span>DEV</span>
              </div>
            </div>

            {/* Core Identity & Highlighted Typography */}
            <div className="space-y-1.5 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50/90 border border-violet-200/80 text-violet-800 text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                <span>সফটওয়্যার ডেভেলপার পরিচিতি</span>
              </div>

              {/* Developer Name in Curated Violet / Lavender Gradient Typography */}
              <h2
                id="dev-modal-title"
                className="text-2xl sm:text-3xl font-black tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #581C87 0%, #7E22CE 40%, #9333EA 70%, #A855F7 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent',
                }}
              >
                মোঃ জিহাদ
              </h2>

              <p className="text-xs sm:text-sm font-black font-outfit uppercase tracking-widest text-violet-950/80">
                MD JIHAD
              </p>

              <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-snug">
                সফটওয়্যার ডেভেলপার ও ডিজাইনার, <DpibBrandTitle className="text-xs inline-block" />
              </p>
            </div>
          </div>

          {/* Academic & Polytechnic Affiliation (Subtle Glass Card) */}
          <div className="p-4 rounded-2xl bg-violet-50/60 border border-violet-100/90 backdrop-blur-md space-y-2.5">
            <div className="flex items-start gap-2.5">
              <GraduationCap className="w-5 h-5 text-violet-700 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <p className="font-extrabold text-violet-950">
                  মেকানিক্যাল টেকনোলজি
                </p>
                <p className="font-medium text-slate-700 mt-0.5">
                  দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট (DPIB), ভোলা
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-outfit">
                  বীরশ্রেষ্ঠ মোস্তফা কামাল বাস স্ট্যান্ড সংলগ্ন, ভোলা সদর
                </p>
              </div>
            </div>
          </div>

          {/* Key Contributions & Vision (Clean Text without slop) */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-violet-900 font-outfit flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-violet-600 rounded-full inline-block" />
              <span>ABOUT THE PORTAL • উদ্যোগ ও লক্ষ্য</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউটের সকল ডিপ্লোমা প্রকৌশল শিক্ষার্থীর পরীক্ষার ফলাফল প্রাপ্তি, সেমিস্টার ভিত্তিক ফলাফল বিশ্লেষণ ও ডিজিটাল ভেরিফাইড গ্রেডশিট যাচাইকরণ সহজ ও আধুনিক করার লক্ষ্যে এই সেন্ট্রালাইজড রেজাল্ট জোন সিস্টেমটি তৈরি করা হয়েছে।
            </p>
          </div>

          {/* Contact Details & Actions */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Email Copy Trigger */}
            <button
              type="button"
              onClick={handleCopyEmail}
              className="flex-1 px-4 py-2.5 rounded-xl bg-violet-50/80 hover:bg-violet-100 border border-violet-200/80 text-violet-900 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {copiedEmail ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-emerald-700 font-extrabold">ইমেইল কপি হয়েছে!</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 text-violet-600 shrink-0" />
                  <span className="truncate">techjihad6825@gmail.com</span>
                  <Copy className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                </>
              )}
            </button>

            {/* Direct Mail Link */}
            <a
              href="mailto:techjihad6825@gmail.com"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
            >
              <span>ইমেইল পাঠান</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>for DPIB Students</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-violet-900 font-bold cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
