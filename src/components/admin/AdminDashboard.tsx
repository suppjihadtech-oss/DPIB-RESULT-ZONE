import React, { useEffect, useState } from 'react';
import {
  Users,
  BookOpen,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Bell,
  Plus,
  Upload,
  ArrowRight,
  TrendingUp,
  Award,
  GraduationCap,
} from 'lucide-react';
import { getDashboardStats, DashboardStats } from '../../services/db';
import { Exam, StudentResult } from '../../types';
import { toBanglaDigits, formatBanglaDate, SEMESTER_MAP } from '../../utils/bangla';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface AdminDashboardProps {
  onNavigate: (section: string) => void;
  exams: Exam[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, exams }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'ভর্তি আবেদন',
      value: stats?.totalAdmissions ?? 0,
      icon: GraduationCap,
      color: 'bg-teal-50 text-teal-700 border-teal-200',
      section: 'admissions',
    },
    {
      label: 'মোট শিক্ষার্থী',
      value: stats?.totalStudents ?? 0,
      icon: Users,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      section: 'students',
    },
    {
      label: 'মোট পরীক্ষা',
      value: stats?.totalExams ?? 0,
      icon: BookOpen,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      section: 'exams',
    },
    {
      label: 'মোট ফলাফল',
      value: stats?.totalResults ?? 0,
      icon: FileSpreadsheet,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      section: 'results',
    },
    {
      label: 'প্রকাশিত ফলাফল',
      value: stats?.publishedResults ?? 0,
      icon: CheckCircle2,
      color: 'bg-teal-50 text-teal-700 border-teal-200',
      section: 'results',
    },
    {
      label: 'খসড়া ফলাফল',
      value: stats?.draftResults ?? 0,
      icon: Clock,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      section: 'results',
    },
    {
      label: 'মোট নোটিশ',
      value: stats?.totalNotices ?? 0,
      icon: Bell,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      section: 'notices',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Welcome & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            অ্যাডমিন ড্যাশবোর্ড
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ফলাফল ডেটাবেস, শিক্ষার্থী ও পরীক্ষার রিয়েলটাইম তথ্য সারসংক্ষেপ
          </p>
        </div>

        {/* Quick Actions Header */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => onNavigate('admissions')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <GraduationCap className="w-4 h-4" />
            <span>ভর্তি আবেদন</span>
            {(stats?.pendingAdmissions ?? 0) > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-outfit font-bold">
                {toBanglaDigits(stats?.pendingAdmissions ?? 0)}
              </span>
            )}
          </button>
          <button
            onClick={() => onNavigate('results')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>ফলাফল আপলোড</span>
          </button>
          <button
            onClick={() => onNavigate('exams')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন পরীক্ষা</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      {loading ? (
        <LoadingSpinner message="পরিসংখ্যান লোড হচ্ছে..." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                onClick={() => onNavigate(card.section)}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl border ${card.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold group-hover:text-slate-700 uppercase font-outfit">
                    VIEW
                  </span>
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-outfit block tracking-tight">
                    {toBanglaDigits(card.value)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 mt-1 block">
                    {card.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Launchpad Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('admissions')}
          className="bg-gradient-to-br from-teal-800 to-teal-900 text-white p-6 rounded-3xl shadow-md cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-bold text-lg mb-1">ভর্তি আবেদন ও যাচাইকরণ</h3>
          <p className="text-xs text-teal-100/90 leading-relaxed mb-4">
            শিক্ষার্থীদের নতুন অনলাইন ভর্তি আবেদন যাচাই, অনুমোদন ও প্রিন্ট স্লিপ নিয়ন্ত্রণ করুন
          </p>
          <span className="inline-flex items-center text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
            <span>আবেদন তালিকা দেখুন</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </span>
        </div>

        <div
          onClick={() => onNavigate('results')}
          className="bg-gradient-to-br from-emerald-700 to-teal-800 text-white p-6 rounded-3xl shadow-md cursor-pointer hover:shadow-lg transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-bold text-lg mb-1">এক্সেল ও JSON থেকে ফলাফল আপলোড</h3>
          <p className="text-xs text-emerald-100/80 leading-relaxed mb-4">
            এক ক্লিকে সম্পূর্ণ ব্যাচ রেজাল্ট শিট আপলোড করে সরাসরি ফায়ারস্টোরে সংরক্ষণ ও প্রকাশ করুন
          </p>
          <span className="inline-flex items-center text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
            <span>ফলাফল আপলোড প্যানেলে যান</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </span>
        </div>

        <div
          onClick={() => onNavigate('students')}
          className="bg-white border border-slate-200/90 p-6 rounded-3xl shadow-xs cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg mb-1">শিক্ষার্থী ডাটাবেজ</h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            সেমিস্টার ও বিভাগভিত্তিক শিক্ষার্থীদের রোল, রেজিস্ট্রেশন ও তথ্য ফিল্টার ও পরিচালনা করুন
          </p>
          <span className="inline-flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
            <span>শিক্ষার্থী তালিকা দেখুন</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </span>
        </div>

        <div
          onClick={() => onNavigate('settings')}
          className="bg-white border border-slate-200/90 p-6 rounded-3xl shadow-xs cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg mb-1">গ্রেডিং ও সিস্টেম নিয়ম</h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            বোর্ড মানদণ্ড অনুযায়ী জিপিএ গ্রেডিং রেঞ্জ, সেমিস্টার ও টেকনোলজি কাস্টমাইজ করুন
          </p>
          <span className="inline-flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
            <span>সেটিংস পরিবর্তন করুন</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </span>
        </div>
      </div>

      {/* Recent Exams Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">সাম্প্রতিক পরীক্ষাসমূহ</h3>
            <p className="text-xs text-slate-400">তৈরিকৃত পরীক্ষার সর্বশেষ অবস্থা</p>
          </div>
          <button
            onClick={() => onNavigate('exams')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
          >
            সকল পরীক্ষা দেখুন
          </button>
        </div>

        {exams.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            এখনও কোনো পরীক্ষা তৈরি করা হয়নি। &quot;নতুন পরীক্ষা&quot; বাটনে ক্লিক করে পরীক্ষা তৈরি করুন।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">পরীক্ষার নাম</th>
                  <th className="py-2.5 px-3">বিভাগ ও সেমিস্টার</th>
                  <th className="py-2.5 px-3">পরীক্ষার তারিখ</th>
                  <th className="py-2.5 px-3 text-center">অবস্থা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.slice(0, 5).map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 font-semibold text-slate-800">{exam.title}</td>
                    <td className="py-3 px-3 text-slate-600 text-xs">
                      {exam.departmentName} • {SEMESTER_MAP[exam.semesterId]}
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-xs">{formatBanglaDate(exam.examDate)}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          exam.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {exam.status === 'PUBLISHED' ? 'প্রকাশিত' : 'খসড়া'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
