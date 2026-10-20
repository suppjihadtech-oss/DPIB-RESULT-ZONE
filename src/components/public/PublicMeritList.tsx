import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Search, ChevronDown } from 'lucide-react';
import { Exam, StudentResult } from '../../types';
import { getMeritList } from '../../services/db';
import { toBanglaDigits, toBanglaNumber, toBanglaOrdinal, SEMESTER_MAP } from '../../utils/bangla';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { BottomSheet } from '../common/BottomSheet';

interface PublicMeritListProps {
  exams: Exam[];
  onViewResultCard: (result: StudentResult) => void;
}

export const PublicMeritList: React.FC<PublicMeritListProps> = ({ exams, onViewResultCard }) => {
  const publishedExams = exams.filter((e) => e.status === 'PUBLISHED' && e.allowMeritList !== false);
  const [selectedExamId, setSelectedExamId] = useState<string>(publishedExams[0]?.id || '');
  const [meritResults, setMeritResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [examPickerOpen, setExamPickerOpen] = useState(false);

  useEffect(() => {
    if (publishedExams.length > 0 && !selectedExamId) {
      setSelectedExamId(publishedExams[0].id);
    }
  }, [publishedExams, selectedExamId]);

  useEffect(() => {
    if (!selectedExamId) {
      setMeritResults([]);
      return;
    }

    let isMounted = true;
    setLoading(true);
    getMeritList(selectedExamId)
      .then((data) => {
        if (isMounted) {
          setMeritResults(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Merit list error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedExamId]);

  const currentExam = publishedExams.find((e) => e.id === selectedExamId);

  const filteredList = meritResults.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      r.studentName.toLowerCase().includes(q) ||
      r.roll.includes(q) ||
      toBanglaDigits(r.roll).includes(q)
    );
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Title Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-bold mb-3">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span>অফিসিয়াল শীর্ষ মেধাতালিকা</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          পরীক্ষার মেধা তালিকা
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          প্রকাশিত ফলাফলের সর্বোচ্চ GPA ও নম্বরের ভিত্তিতে প্রস্তুতকৃত ডিজিটাল মেধা তালিকা
        </p>
      </div>

      {/* Select Exam & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-8 flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Exam Picker Button */}
        <div className="w-full sm:w-1/2">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            পরীক্ষা বেছে নিন
          </label>
          <button
            onClick={() => setExamPickerOpen(true)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold hover:bg-slate-100 transition-all text-left"
          >
            <span className="truncate">
              {currentExam ? `${currentExam.title} (${currentExam.departmentName})` : 'কোনো পরীক্ষা নির্বাচিত নেই'}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
          </button>
        </div>

        {/* Filter Input */}
        <div className="w-full sm:w-1/2">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            মেধাতালিকায় শিক্ষার্থী খুঁজুন
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="রোল নম্বর বা নাম লিখুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-500 outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <LoadingSpinner message="মেধাতালিকা প্রস্তুত করা হচ্ছে..." />
      ) : publishedExams.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="কোনো পরীক্ষার ফলাফল এখনও প্রকাশ করা হয়নি"
          description="প্রশাসন কর্তৃক ফলাফল প্রকাশ করা হলে মেধা তালিকা এখানে স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।"
        />
      ) : meritResults.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="এই পরীক্ষার কোনো মেধা তালিকা পাওয়া যায়নি"
          description="নির্বাচিত পরীক্ষার ফলাফল এখনও রিভিউ বা খসড়া অবস্থায় থাকতে পারে।"
        />
      ) : (
        <div className="space-y-6">
          {/* Top 3 Podium Highlights on larger screens */}
          {meritResults.length >= 3 && !searchQuery && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {/* 2nd Place */}
              {meritResults[1] && (
                <div className="order-2 sm:order-1 bg-gradient-to-b from-slate-100 to-white rounded-2xl border border-slate-200 p-5 text-center flex flex-col items-center justify-center shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold font-outfit text-lg mb-2 shadow-inner">
                    ২য়
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">{meritResults[1].studentName}</h4>
                  <p className="text-xs text-slate-500 font-outfit mt-0.5">রোল: {toBanglaDigits(meritResults[1].roll)}</p>
                  <div className="mt-3 px-3 py-1 bg-slate-200/80 rounded-full text-xs font-bold text-slate-800 font-outfit">
                    GPA {toBanglaNumber(meritResults[1].gpa, 2)} ({meritResults[1].letterGrade})
                  </div>
                </div>
              )}

              {/* 1st Place Champion */}
              {meritResults[0] && (
                <div className="order-1 sm:order-2 bg-gradient-to-b from-amber-50 to-white rounded-2xl border-2 border-amber-300 p-6 text-center flex flex-col items-center justify-center shadow-md relative -translate-y-2">
                  <div className="absolute -top-3 px-3 py-0.5 bg-amber-400 text-amber-950 font-black text-[11px] uppercase tracking-wider rounded-full shadow-xs">
                    ১ম স্থান
                  </div>
                  <div className="w-14 h-14 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black font-outfit text-xl mb-2 shadow-md">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base sm:text-lg">{meritResults[0].studentName}</h4>
                  <p className="text-xs text-slate-500 font-outfit mt-0.5">রোল: {toBanglaDigits(meritResults[0].roll)}</p>
                  <div className="mt-3 px-4 py-1.5 bg-amber-100 rounded-full text-xs font-bold text-amber-900 font-outfit">
                    GPA {toBanglaNumber(meritResults[0].gpa, 2)} ({meritResults[0].letterGrade}) • {toBanglaDigits(meritResults[0].totalObtainedMarks)} নম্বর
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {meritResults[2] && (
                <div className="order-3 sm:order-3 bg-gradient-to-b from-amber-50/40 to-white rounded-2xl border border-amber-100 p-5 text-center flex flex-col items-center justify-center shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-amber-200/80 text-amber-900 flex items-center justify-center font-bold font-outfit text-lg mb-2 shadow-inner">
                    ৩য়
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">{meritResults[2].studentName}</h4>
                  <p className="text-xs text-slate-500 font-outfit mt-0.5">রোল: {toBanglaDigits(meritResults[2].roll)}</p>
                  <div className="mt-3 px-3 py-1 bg-amber-100/80 rounded-full text-xs font-bold text-amber-900 font-outfit">
                    GPA {toBanglaNumber(meritResults[2].gpa, 2)} ({meritResults[2].letterGrade})
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Merit List Presentation: Mobile Cards (<md) & Desktop Table (>=md) */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                সম্পূর্ণ মেধা তালিকা ({toBanglaDigits(filteredList.length)} জন শিক্ষার্থী)
              </span>
            </div>

            {/* Mobile View: High Quality Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredList.map((item, idx) => {
                const rank = idx + 1;
                return (
                  <div key={item.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-black font-outfit shrink-0 ${
                          rank === 1
                            ? 'bg-amber-400 text-amber-950 shadow-xs'
                            : rank === 2
                            ? 'bg-slate-200 text-slate-800'
                            : rank === 3
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {toBanglaDigits(rank)}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{item.studentName}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="font-outfit font-semibold text-blue-600">রোল: {toBanglaDigits(item.roll)}</span>
                          <span>•</span>
                          <span className="truncate">{item.departmentName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-black font-outfit bg-emerald-50 text-emerald-800 border border-emerald-200">
                          GPA {toBanglaNumber(item.gpa, 2)}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-lg text-[11px] font-bold font-outfit bg-slate-100 text-slate-700">
                          {item.letterGrade}
                        </span>
                      </div>
                      <button
                        onClick={() => onViewResultCard(item)}
                        className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                      >
                        ফলাফল দেখুন
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Full Data Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-3 px-4 text-center w-16">মেধাক্রম</th>
                    <th className="py-3 px-4">শিক্ষার্থীর নাম</th>
                    <th className="py-3 px-4 text-center">রোল</th>
                    <th className="py-3 px-4">বিভাগ</th>
                    <th className="py-3 px-4 text-center">মোট নম্বর</th>
                    <th className="py-3 px-4 text-center">GPA</th>
                    <th className="py-3 px-4 text-center">গ্রেড</th>
                    <th className="py-3 px-4 text-right">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((item, idx) => {
                    const rank = idx + 1;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold font-outfit ${
                              rank === 1
                                ? 'bg-amber-400 text-amber-950 font-black'
                                : rank === 2
                                ? 'bg-slate-200 text-slate-800'
                                : rank === 3
                                ? 'bg-amber-100 text-amber-900'
                                : 'text-slate-600 bg-slate-100'
                            }`}
                          >
                            {toBanglaDigits(rank)}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{item.studentName}</td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-700 font-outfit">
                          {toBanglaDigits(item.roll)}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{item.departmentName}</td>
                        <td className="py-3 px-4 text-center font-bold font-outfit text-slate-800">
                          {toBanglaDigits(item.totalObtainedMarks)}
                        </td>
                        <td className="py-3 px-4 text-center font-black font-outfit text-emerald-600 text-sm">
                          {toBanglaNumber(item.gpa, 2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded font-bold font-outfit text-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {item.letterGrade}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onViewResultCard(item)}
                            className="px-3 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                          >
                            ফলাফল কার্ড
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Exam Picker Bottom Sheet */}
      <BottomSheet
        isOpen={examPickerOpen}
        onClose={() => setExamPickerOpen(false)}
        title="মেধাতালিকার পরীক্ষা পরিবর্তন"
        subtitle="যেকোনো প্রকাশিত পরীক্ষার শীর্ষ মেধাতালিকা দেখতে নির্বাচন করুন"
      >
        <div className="space-y-2">
          {publishedExams.map((exam) => (
            <button
              key={exam.id}
              onClick={() => {
                setSelectedExamId(exam.id);
                setExamPickerOpen(false);
              }}
              className={`w-full p-3.5 rounded-xl border text-sm font-semibold text-left transition-all ${
                selectedExamId === exam.id
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-slate-900">{exam.title}</div>
              <div className="text-xs text-slate-500 font-normal mt-0.5">
                {exam.departmentName} • {SEMESTER_MAP[exam.semesterId]}
              </div>
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
};
