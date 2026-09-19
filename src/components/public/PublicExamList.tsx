import React, { useState } from 'react';
import { BookOpen, Calendar, Award, Layers, Search, Filter } from 'lucide-react';
import { Exam, SemesterId } from '../../types';
import { SEMESTER_MAP, formatBanglaDate, toBanglaDigits } from '../../utils/bangla';
import { EmptyState } from '../common/EmptyState';
import { BottomSheet } from '../common/BottomSheet';

interface PublicExamListProps {
  exams: Exam[];
  onSelectExamForSearch: (exam: Exam) => void;
}

export const PublicExamList: React.FC<PublicExamListProps> = ({ exams, onSelectExamForSearch }) => {
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');
  const [selectedExamDetail, setSelectedExamDetail] = useState<Exam | null>(null);

  const publishedExams = exams.filter((e) => e.status === 'PUBLISHED');
  const filteredExams =
    selectedSemester !== 'ALL'
      ? publishedExams.filter((e) => e.semesterId === selectedSemester)
      : publishedExams;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            প্রকাশিত পরীক্ষার তালিকা
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            ডিপ্লোমা ইন ইঞ্জিনিয়ারিং ইনস্টিটিউট কর্তৃক গৃহীত সকল পরীক্ষার তালিকা
          </p>
        </div>

        {/* Semester Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
          <button
            onClick={() => setSelectedSemester('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedSemester === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            সকল সেমিস্টার
          </button>
          {(['1', '2', '3', '4', '5', '6', '7', '8'] as SemesterId[]).map((semId) => (
            <button
              key={semId}
              onClick={() => setSelectedSemester(semId)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSemester === semId
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {SEMESTER_MAP[semId]}
            </button>
          ))}
        </div>
      </div>

      {/* Exam Grid */}
      {filteredExams.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="কোনো প্রকাশিত পরীক্ষা পাওয়া যায়নি"
          description={
            selectedSemester !== 'ALL'
              ? 'নির্বাচিত সেমিস্টারে এখনও কোনো পরীক্ষার ফলাফল প্রকাশ করা হয়নি।'
              : 'এখনও কোনো পরীক্ষার ফলাফল প্রকাশ করা হয়নি। প্রশাসন কর্তৃক নতুন পরীক্ষা ও ফলাফল যোগ করা হলে তা এখানে প্রদর্শিত হবে।'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => {
            const semesterBangla = SEMESTER_MAP[exam.semesterId] || `${toBanglaDigits(exam.semesterId)}ম সেমিস্টার`;
            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold font-outfit uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                      {exam.examType}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {semesterBangla}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-emerald-700 transition-colors mb-2">
                    {exam.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                    <p className="flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{exam.departmentName}</span>
                    </p>
                    <p className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>পরীক্ষার তারিখ: {formatBanglaDate(exam.examDate)}</span>
                    </p>
                    <p className="flex items-center space-x-1.5">
                      <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>সর্বমোট বিষয়: {toBanglaDigits(exam.subjects?.length || 0)}টি</span>
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedExamDetail(exam)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline"
                  >
                    বিষয়সমূহ দেখুন
                  </button>

                  <button
                    onClick={() => onSelectExamForSearch(exam)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold transition-all active:scale-95"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>ফলাফল খুঁজুন</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Exam Details Bottom Sheet */}
      <BottomSheet
        isOpen={Boolean(selectedExamDetail)}
        onClose={() => setSelectedExamDetail(null)}
        title={selectedExamDetail?.title || 'পরীক্ষার বিবরণ'}
        subtitle={`${selectedExamDetail?.departmentName || ''} • ${
          selectedExamDetail ? SEMESTER_MAP[selectedExamDetail.semesterId] : ''
        }`}
      >
        {selectedExamDetail && (
          <div className="space-y-5">
            {selectedExamDetail.description && (
              <p className="text-sm text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {selectedExamDetail.description}
              </p>
            )}

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2.5">
                অন্তর্ভুক্ত বিষয় তালিকা ({toBanglaDigits(selectedExamDetail.subjects?.length || 0)}টি)
              </h4>
              <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">বিষয় কোড</th>
                      <th className="py-2.5 px-3">বিষয়ের নাম</th>
                      <th className="py-2.5 px-3 text-right">পূর্ণমান</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedExamDetail.subjects?.map((sub, sIdx) => (
                      <tr key={sIdx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{sub.code}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{sub.name}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {toBanglaDigits(sub.fullMarks)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  const target = selectedExamDetail;
                  setSelectedExamDetail(null);
                  onSelectExamForSearch(target);
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>এই পরীক্ষার ফলাফল অনুসন্ধান করুন</span>
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
