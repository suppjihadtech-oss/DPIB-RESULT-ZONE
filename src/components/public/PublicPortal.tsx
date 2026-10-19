import React, { useState, useMemo } from 'react';
import { 
  Search, 
  BookOpen, 
  Award, 
  Printer, 
  Calendar, 
  Bell, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  ShieldCheck, 
  GraduationCap, 
  ArrowRight,
  Sparkles,
  ChevronRight,
  X
} from 'lucide-react';
import { db } from '../../services/db';
import { Result, Exam, Notice, RoutineItem } from '../../types';
import { useToast } from '../../context/ToastContext';

interface PublicPortalProps {
  onOpenAdminLogin: () => void;
}

export const PublicPortal: React.FC<PublicPortalProps> = ({ onOpenAdminLogin }) => {
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'RESULT' | 'NOTICES' | 'ROUTINE'>('RESULT');
  const [roll, setRoll] = useState('');
  const [reg, setReg] = useState('');
  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');

  const [searchedResult, setSearchedResult] = useState<Result | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const exams = useMemo(() => db.getExams().filter((e) => e.isPublished), []);
  const notices = useMemo(() => db.getNotices().filter((n) => n.published), []);
  const routines = useMemo(() => db.getRoutines(), []);
  const institute = useMemo(() => db.getInstituteInfo(), []);

  // Handle Search Result
  const handleSearchResult = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRoll = roll.trim();
    const cleanReg = reg.trim();

    if (!cleanRoll) {
      error('অনুগ্রহ করে আপনার বোর্ড রোল নম্বর প্রদান করুন।', 'রোল অনুপস্থিত');
      return;
    }

    const examFilter = selectedExamId === 'ALL' ? undefined : selectedExamId;
    const matches = db.findResultByRollAndReg(cleanRoll, cleanReg || undefined, examFilter);

    setHasSearched(true);

    if (matches.length > 0) {
      setSearchedResult(matches[0]);
      success(
        `রোল ${cleanRoll}-এর ফলাফল পাওয়া গেছে। গ্রেডশিট প্রদর্শিত হচ্ছে।`,
        'ফলাফল প্রাপ্ত'
      );
    } else {
      setSearchedResult(null);
      error(
        `রোল ${cleanRoll} এর জন্য কোনো প্রকাশিত ফলাফল খুঁজে পাওয়া যায়নি। রোল ও রেজিস্ট্রেশন যাচাই করুন।`,
        'ফলাফল পাওয়া যায়নি'
      );
    }
  };

  const handlePrintResult = () => {
    if (!searchedResult) return;
    info('মার্কশিট প্রিন্ট ডায়ালগ প্রস্তুত হচ্ছে...');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-emerald-900 text-white border-b border-emerald-800 shadow-md no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-emerald-900 flex items-center justify-center font-black text-xl shadow-md">
              DPIB
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
                {institute.name}
              </h1>
              <p className="text-xs text-emerald-200">
                {institute.address} • {institute.btebAffiliated}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAdminLogin}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 font-semibold text-xs flex items-center gap-2 border border-white/20 transition cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-300" />
            এডমিন লগইন
          </button>
        </div>
      </header>

      {/* Navigation Pills (no-print) */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex gap-2 py-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('RESULT')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'RESULT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Award className="w-4 h-4" />
              ফলাফল অনুসন্ধান
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('NOTICES')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'NOTICES'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Bell className="w-4 h-4" />
              একাডেমিক নোটিশ
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">
                {notices.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ROUTINE')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'ROUTINE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              ক্লাস রুটিন
            </button>
          </div>

          <div className="hidden md:flex items-center text-xs text-slate-400 font-medium">
            <span>হেল্পলাইন: {institute.phone.split(',')[0]}</span>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ================= TAB 1: RESULT SEARCH ================= */}
        {activeTab === 'RESULT' && (
          <div className="space-y-8">
            {/* Search Card (no-print) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md max-w-2xl mx-auto space-y-5 no-print">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">
                  ডিজিটাল ফলাফল অনুসন্ধান
                </h2>
                <p className="text-xs text-slate-500">
                  আপনার ডিপ্লোমা পরীক্ষার রোল ও রেজিস্ট্রেশন নম্বর প্রদান করে ফলাফল ও মার্কশিট দেখুন
                </p>
              </div>

              <form onSubmit={handleSearchResult} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    পরীক্ষার নাম নির্বাচন করুন:
                  </label>
                  <select
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-emerald-500"
                  >
                    <option value="ALL">সকল প্রকাশিত পরীক্ষা</option>
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      বোর্ড রোল নম্বর *
                    </label>
                    <input
                      type="text"
                      required
                      value={roll}
                      onChange={(e) => setRoll(e.target.value)}
                      placeholder="যেমন: 612450"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-emerald-500 font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      রেজিস্ট্রেশন নম্বর (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      value={reg}
                      onChange={(e) => setReg(e.target.value)}
                      placeholder="যেমন: 1502123456"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  ফলাফল দেখুন
                </button>
              </form>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-slate-500">
                পরীক্ষামূলক রোলে চেক করতে পারেন: <span className="font-mono font-bold text-emerald-800 cursor-pointer underline" onClick={() => { setRoll('612450'); setReg('1502123456'); }}>612450</span>, <span className="font-mono font-bold text-emerald-800 cursor-pointer underline" onClick={() => { setRoll('612451'); setReg('1502123457'); }}>612451</span>, <span className="font-mono font-bold text-emerald-800 cursor-pointer underline" onClick={() => { setRoll('612452'); setReg('1502123458'); }}>612452</span>
              </div>
            </div>

            {/* Result Found: Official Marksheet View */}
            {searchedResult && (
              <div className="bg-white rounded-3xl border border-slate-300 shadow-xl p-6 sm:p-10 max-w-4xl mx-auto printable-document space-y-6">
                <div className="flex items-center justify-between border-b pb-4 no-print">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">ফলাফল ও মার্কশিট</h3>
                      <p className="text-xs text-slate-500">অফিশিয়াল গ্রেড বিবরণী প্রস্তুত রয়েছে</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handlePrintResult}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-4 h-4" />
                    মার্কশিট প্রিন্ট করুন
                  </button>
                </div>

                {/* Institution Letterhead */}
                <div className="text-center border-b-2 border-emerald-900 pb-5">
                  <h2 className="text-xl sm:text-2xl font-black text-emerald-900 tracking-tight">
                    {institute.name}
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">{institute.address}</p>
                  <p className="text-[11px] text-slate-500 font-semibold">{institute.btebAffiliated}</p>
                  <div className="mt-3 inline-block">
                    <span className="px-4 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-xs uppercase tracking-wider border border-emerald-300">
                      ডিপ্লোমা ইন ইঞ্জিনিয়ারিং — ফলাফল ও মার্কশিট
                    </span>
                  </div>
                </div>

                {/* Student Details Grid */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs sm:text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
                    <div>
                      <span className="text-slate-500">শিক্ষার্থীর নাম:</span>
                      <span className="font-bold text-slate-900 ml-2">{searchedResult.studentName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">বোর্ড রোল নম্বর:</span>
                      <span className="font-bold font-mono text-slate-900 ml-2">{searchedResult.roll}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">রেজিস্ট্রেশন নম্বর:</span>
                      <span className="font-bold font-mono text-slate-900 ml-2">{searchedResult.registration}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">টেকনোলজি:</span>
                      <span className="font-bold text-emerald-800 ml-2">{searchedResult.technology}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">পর্ব ও সেশন:</span>
                      <span className="font-bold text-slate-900 ml-2">{searchedResult.semester} ({searchedResult.session})</span>
                    </div>
                    <div>
                      <span className="text-slate-500">ফলাফল স্ট্যাটাস:</span>
                      <span className={`font-bold ml-2 ${
                        searchedResult.status === 'PASSED' ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {searchedResult.status === 'PASSED' ? 'কৃতকার্য (PASSED)' : 'রেফার্ড / অকৃতকার্য'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subject Wise Grade Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm border-b pb-1 flex justify-between">
                    <span>বিষয়ভিত্তিক নম্বর ও অর্জিত গ্রেড</span>
                    <span className="text-emerald-800 font-extrabold text-sm font-mono">
                      সর্বমোট GPA: {searchedResult.gpa.toFixed(2)}
                    </span>
                  </h4>

                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2.5">বিষয় কোড</th>
                        <th className="p-2.5">বিষয়ের নাম</th>
                        <th className="p-2.5 text-center">ক্রেডিট</th>
                        <th className="p-2.5 text-center">প্রাপ্ত নম্বর</th>
                        <th className="p-2.5 text-center">লেটার গ্রেড</th>
                        <th className="p-2.5 text-center">গ্রেড পয়েন্ট</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {searchedResult.subjects.map((sub, i) => (
                        <tr key={i} className="hover:bg-slate-50/60">
                          <td className="p-2.5 font-mono text-slate-700">{sub.code}</td>
                          <td className="p-2.5 font-medium text-slate-800">{sub.name}</td>
                          <td className="p-2.5 text-center font-mono">{sub.credit}</td>
                          <td className="p-2.5 text-center font-mono">{sub.marks}</td>
                          <td className="p-2.5 text-center font-bold font-mono text-emerald-800">{sub.grade}</td>
                          <td className="p-2.5 text-center font-bold font-mono text-slate-800">{sub.point.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row justify-between items-center gap-2">
                    <span className="font-semibold text-emerald-900 text-xs sm:text-sm">
                      চূড়ান্ত মূল্যায়ন: BTEB স্কেলে জিপিএ
                    </span>
                    <span className="text-2xl font-black text-emerald-800 font-mono">
                      GPA: {searchedResult.gpa.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-12 mt-6 flex justify-between items-end text-xs text-slate-600">
                  <div className="text-center">
                    <div className="w-36 border-t border-slate-400 pt-1 font-semibold">
                      পরীক্ষা নিয়ন্ত্রক শাখা
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-36 border-t border-slate-400 pt-1 font-semibold">
                      অধ্যক্ষের স্বাক্ষর
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: NOTICES ================= */}
        {activeTab === 'NOTICES' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-4">
              <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                ইনস্টিটিউট নোটিশ বোর্ড
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                পরীক্ষা, সেমিস্টার ফি, ক্লাস ও একাডেমিক সংক্রান্ত সকল অফিশিয়াল নোটিশ
              </p>
            </div>

            <div className="space-y-4">
              {notices.map((n) => (
                <div
                  key={n.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2 hover:border-emerald-300 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      n.category === 'পরীক্ষা'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {n.category}
                    </span>
                    {n.isImportant && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        জরুরি নোটিশ
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-mono ml-auto">
                      {n.date}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base">{n.title}</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{n.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: ROUTINE ================= */}
        {activeTab === 'ROUTINE' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-4">
              <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                দৈনিক ক্লাস রুটিন
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                টেকনোলজি ও পর্বভিত্তিক নিয়মিত ক্লাসের সময়সূচি
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {routines.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {r.day}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 font-mono">
                      {r.time}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-800 text-base leading-snug">
                    {r.subjectName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    কোড: {r.subjectCode} • {r.technology} ({r.semester})
                  </p>

                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex justify-between">
                    <span>শিক্ষক: {r.teacherName}</span>
                    <span className="font-bold text-slate-700">{r.roomNo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 text-xs text-center border-t border-slate-800 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-300">
            {institute.name} — ডিজিটাল ফলাফল ও শিক্ষার্থী পোর্টাল
          </p>
          <p className="text-slate-500">
            {institute.address} • যোগাযোগ: {institute.phone} • {institute.email}
          </p>
          <p className="text-[11px] text-slate-600 pt-2">
            সর্বস্বত্ব সংরক্ষিত &copy; {new Date().getFullYear()} DPIB | BTEB অনুমোদিত পলিটেকনিক
          </p>
        </div>
      </footer>
    </div>
  );
};
