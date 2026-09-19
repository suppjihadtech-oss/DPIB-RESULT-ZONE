import React from 'react';
import { ShieldCheck, Globe, Calculator, CalendarDays, BookOpen, GraduationCap, MapPin } from 'lucide-react';
import { CompactAttribution } from './CompactAttribution';

interface FooterProps {
  currentTab?: string;
  isHome?: boolean;
  onTabChange: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ currentTab, isHome = false, onTabChange }) => {
  // If not on Home page, render the requested compact premium attribution section
  if (!isHome && currentTab !== 'home') {
    return (
      <footer className="bg-[#F0F8FF] text-slate-700 pt-8 pb-36 sm:pb-20 px-4 border-t border-sky-200/75 select-none font-bengali">
        <div className="max-w-7xl mx-auto">
          <CompactAttribution />
        </div>
      </footer>
    );
  }

  // Expanded Footer ONLY on Home Page
  return (
    <footer className="bg-[#F0F8FF] text-slate-700 pt-12 pb-36 sm:pb-20 border-t border-sky-200/75 font-bengali">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-sky-200/60">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-white border border-sky-200 p-0.5 flex items-center justify-center shadow-xs">
                <img
                  src="https://i.postimg.cc/mgyW32Y2/Firefly-Remove-Background.png"
                  alt="DPIB Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-outfit text-slate-900 font-black text-lg tracking-tight">
                  DPIB <span className="text-blue-600">RESULT ZONE</span>
                </span>
                <span className="text-xs text-slate-600 font-bold">দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed max-w-md font-medium">
              বীরশ্রেষ্ঠ মোস্তফা কামাল বাস স্ট্যান্ড সংলগ্ন, ভোলা সদর, ভোলা। দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউটের ডিপ্লোমা ইন ইঞ্জিনিয়ারিং শিক্ষার্থীদের সেমিস্টার পরীক্ষা ও মডেল টেস্টের দ্রুত, নির্ভুল ও স্বচ্ছ ফলাফল অনুসন্ধান এবং ডিজিটাল গ্রেডশিট যাচাইকরণ প্ল্যাটফর্ম।
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700">
              <span className="flex items-center space-x-1.5 bg-white/90 border border-sky-200/90 px-3 py-1 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-900">নিরাপদ ও ডিজিটাল ভেরিফাইড</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-white/90 border border-sky-200/90 px-3 py-1 rounded-lg">
                <Globe className="w-4 h-4 text-sky-600" />
                <span className="font-semibold text-slate-900">রিয়েলটাইম ক্লাউড ডেটাবেস</span>
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-slate-900 font-bold text-sm mb-3.5 uppercase tracking-wider font-outfit flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-blue-600 rounded-full inline-block" />
              <span>QUICK LINKS / দ্রুত লিঙ্ক</span>
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <button
                  onClick={() => onTabChange('search')}
                  className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="text-blue-500 font-bold">›</span> ফলাফল অনুসন্ধান
                </button>
              </li>
              <li>
                <button
                  onClick={() => onTabChange('analysis')}
                  className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="text-blue-500 font-bold">›</span> একাডেমিক এনালাইসিস
                </button>
              </li>
              <li>
                <button
                  onClick={() => onTabChange('merit')}
                  className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="text-blue-500 font-bold">›</span> মেধাতালিকা ও শীর্ষস্থান
                </button>
              </li>
              <li>
                <button
                  onClick={() => onTabChange('exams')}
                  className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="text-blue-500 font-bold">›</span> পরীক্ষার তালিকা
                </button>
              </li>
              <li>
                <button
                  onClick={() => onTabChange('notices')}
                  className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="text-blue-500 font-bold">›</span> সর্বশেষ নোটিশ বোর্ড
                </button>
              </li>
            </ul>
          </div>

          {/* Academic Utilities */}
          <div>
            <h4 className="text-slate-900 font-bold text-sm mb-3.5 uppercase tracking-wider font-outfit flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-sky-600 rounded-full inline-block" />
              <span>ACADEMIC TOOLS / সেবাসমূহ</span>
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <button
                  onClick={() => onTabChange('gpa-calculator')}
                  className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span>জিপিএ ক্যালকুলেটর</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onTabChange('smart-calendar')}
                  className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <CalendarDays className="w-4 h-4 text-sky-600" />
                  <span>স্মার্ট ক্যালেন্ডার</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onTabChange('verify')}
                  className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>ফলাফল অনলাইন যাচাইকরণ</span>
                </button>
              </li>
              <li className="pt-1">
                <span className="text-xs text-slate-600 block leading-relaxed bg-white/80 p-2.5 rounded-xl border border-sky-200/80">
                  বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB) অনুমোদিত ভোলা জেলার শীর্ষ প্রতিষ্ঠান
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Compact Attribution on Home */}
        <div className="pt-6">
          <CompactAttribution />
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-sky-200/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium">
          <p>© ২০২৪-২০২৬ DPIB RESULT ZONE. সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="mt-2 sm:mt-0 font-outfit font-semibold text-slate-700">
            DAKKINBANGO POLYTECHNIC INSTITUTE, BHOLA
          </p>
        </div>
      </div>
    </footer>
  );
};

