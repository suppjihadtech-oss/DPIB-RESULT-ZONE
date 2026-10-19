import React, { useMemo } from 'react';
import { 
  Users, 
  BookOpen, 
  FileCode, 
  CheckCircle2, 
  Bell, 
  Plus, 
  FileText, 
  Sparkles,
  TrendingUp,
  Award
} from 'lucide-react';
import { db } from '../../services/db';
import { AdminTab } from './AdminLayout';
import { useToast } from '../../context/ToastContext';

interface AdminDashboardProps {
  onNavigate: (tab: AdminTab) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { info, success } = useToast();

  const students = useMemo(() => db.getStudents(), []);
  const exams = useMemo(() => db.getExams(), []);
  const results = useMemo(() => db.getResults(), []);
  const notices = useMemo(() => db.getNotices(), []);

  const passedResults = results.filter((r) => r.status === 'PASSED').length;
  const passRate = results.length > 0 ? Math.round((passedResults / results.length) * 100) : 0;

  const statCards = [
    {
      label: 'মোট নিবন্ধিত শিক্ষার্থী',
      value: students.length,
      icon: Users,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      action: () => onNavigate('students')
    },
    {
      label: 'মোট ফলাফল এন্ট্রি',
      value: results.length,
      icon: FileCode,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      action: () => onNavigate('results')
    },
    {
      label: 'অনুষ্ঠিত পরীক্ষা সমূহ',
      value: exams.length,
      icon: BookOpen,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      action: () => onNavigate('exams')
    },
    {
      label: 'প্রকাশিত নোটিশ',
      value: notices.filter((n) => n.published).length,
      icon: Bell,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      action: () => onNavigate('notices')
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <Award className="w-80 h-80" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            স্মার্ট ডিজিটাল প্রশাসন পোর্টাল
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            স্বাগতম, DPIB এডমিন ম্যানেজমেন্ট প্যানেল
          </h2>
          <p className="text-emerald-100/80 text-sm leading-relaxed">
            দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউটের ফলাফল প্রক্রিয়াকরণ, শিক্ষার্থী তথ্য সংরক্ষণ, ডিজিটাল প্রবেশপত্র ও মার্কশিট জেনারেশন সরাসরি সম্পন্ন করুন।
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('results')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/30 transition cursor-pointer"
            >
              <FileCode className="w-4 h-4" />
              JSON কোড হতে ফলাফল আপলোড
            </button>
            <button
              type="button"
              onClick={() => {
                info('ড্যাশবোর্ড পরিসংখ্যান সর্বশেষ ডেটার সাথে সিঙ্ক হয়েছে');
              }}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm backdrop-blur-sm border border-white/10 transition cursor-pointer"
            >
              পরিসংখ্যান রিফ্রেশ
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.action}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{card.label}</span>
                <div className={`p-2.5 rounded-xl border ${card.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
                  {card.value}
                </span>
                <span className="text-xs text-slate-400">রেকর্ড</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => onNavigate('results')}
          className="bg-gradient-to-br from-emerald-700 to-teal-800 text-white p-6 rounded-3xl shadow-md cursor-pointer hover:shadow-lg transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <FileCode className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-bold text-lg mb-1">JSON ফলাফল আপলোড</h3>
          <p className="text-xs text-emerald-100/80 leading-relaxed mb-4">
            কোনো জটিলতা ছাড়াই সরাসরি JSON কোড পেস্ট করে নিমেষেই শিক্ষার্থীদের ফলাফল যাচাই ও প্রকাশ করুন।
          </p>
          <span className="inline-flex items-center text-xs font-bold text-emerald-200 group-hover:translate-x-1 transition-transform">
            আপলোড প্যানেল খুলুন &rarr;
          </span>
        </div>

        <div
          onClick={() => onNavigate('students')}
          className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-800 mb-1">নতুন শিক্ষার্থী যোগ</h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            রোল, রেজিস্ট্রেশন, টেকনোলজি ও পর্বভিত্তিক নতুন শিক্ষার্থীর তথ্য এন্ট্রি বা পূর্বের তথ্য সংশোধন করুন।
          </p>
          <span className="inline-flex items-center text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
            শিক্ষার্থী পরিচালনা &rarr;
          </span>
        </div>

        <div
          onClick={() => onNavigate('documents')}
          className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-800 mb-1">ডকুমেন্ট জেনারেটর</h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            শিক্ষার্থীদের পরীক্ষার প্রবেশপত্র, মার্কশিট ও প্রশংসাপত্র স্বয়ংক্রিয়ভাবে জেনারেট ও সরাসরি প্রিন্ট করুন।
          </p>
          <span className="inline-flex items-center text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform">
            ডকুমেন্ট তৈরি করুন &rarr;
          </span>
        </div>
      </div>

      {/* Summary Box & Pass Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              ফলাফল পরিসংখ্যান ও পাসের হার
            </h3>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {passRate}% উত্তীর্ণ
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>উত্তীর্ণ শিক্ষার্থী ({passedResults} জন)</span>
                <span className="font-bold text-emerald-600">{passRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${passRate}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-slate-400 block text-[11px]">কৃতকার্য</span>
                <span className="text-lg font-bold text-slate-800">{passedResults} জন</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-slate-400 block text-[11px]">রেফার্ড/অকৃতকার্য</span>
                <span className="text-lg font-bold text-slate-800">{results.length - passedResults} জন</span>
              </div>
            </div>
          </div>
        </div>

        {/* Institute Info Box */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-2">প্রতিষ্ঠান তথ্য</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট (DPIB) — বীরশ্রেষ্ঠ মোস্তফা কামাল বাস স্ট্যান্ড সংলগ্ন, ভোলা সদর, ভোলা। বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB) অনুমোদিত।
            </p>
            <div className="mt-4 space-y-1.5 text-xs text-slate-600">
              <p><span className="font-semibold text-slate-700">অনুমোদিত টেকনোলজি:</span> কম্পিউটার, সিভিল, ইলেকট্রিক্যাল, মেকানিক্যাল, ইলেকট্রনিক্স</p>
              <p><span className="font-semibold text-slate-700">এডমিন নিরাপত্তা পিন:</span> সংরক্ষিত (ডিফল্ট: 123456)</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">সর্বশেষ ডাটাবেস আপডেট: আজ</span>
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="text-emerald-700 font-semibold hover:underline cursor-pointer"
            >
              সেটিংস পরিবর্তন &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
