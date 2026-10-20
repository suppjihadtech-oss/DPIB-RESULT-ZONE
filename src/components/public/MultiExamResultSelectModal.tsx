import React from 'react';
import {
  FileText,
  Calendar,
  Building,
  GraduationCap,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Sparkles,
  Layers,
  Award,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { StudentResult } from '../../types';
import {
  toBanglaDigits,
  formatBanglaDate,
  SEMESTER_MAP,
} from '../../utils/bangla';
import { BottomSheet } from '../common/BottomSheet';

interface MultiExamResultSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: StudentResult[];
  roll: string;
  onSelectResult: (result: StudentResult) => void;
}

export const MultiExamResultSelectModal: React.FC<MultiExamResultSelectModalProps> = ({
  isOpen,
  onClose,
  results,
  roll,
  onSelectResult,
}) => {
  if (!results || results.length === 0) return null;

  // Student name from the latest result
  const primaryStudentName = results[0]?.studentName || '';

  const formatResultDate = (result: StudentResult) => {
    if (result.examDate) {
      return {
        label: 'পরীক্ষার তারিখ',
        dateStr: formatBanglaDate(result.examDate),
      };
    }
    if (result.publishedAt) {
      return {
        label: 'প্রকাশের তারিখ',
        dateStr: formatBanglaDate(result.publishedAt),
      };
    }
    if (result.createdAt) {
      return {
        label: 'তারিখ',
        dateStr: formatBanglaDate(result.createdAt),
      };
    }
    return {
      label: 'তারিখ',
      dateStr: 'হালনাগাদ করা হয়েছে',
    };
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="পরীক্ষার ফলাফল নির্বাচন"
      subtitle={`রোল: ${toBanglaDigits(roll)} • মোট ${toBanglaDigits(results.length)}টি পরীক্ষার ফলাফল পাওয়া গেছে`}
      maxHeight="max-h-[88vh]"
    >
      <div className="space-y-4 pb-6 font-bengali">
        {/* Student Summary Top Glass Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-purple-50/90 border border-blue-100/90 shadow-2xs backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-outfit">
                  STUDENT PROFILE
                </p>
                <h4 className="text-base sm:text-lg font-black text-slate-900 truncate">
                  {primaryStudentName || `শিক্ষার্থী (রোল: ${toBanglaDigits(roll)})`}
                </h4>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-full bg-white/80 border border-blue-200/80 text-blue-800 text-xs font-extrabold shadow-2xs font-outfit">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{toBanglaDigits(results.length)}টি ফলাফল প্রস্তুত</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-2.5 font-medium leading-relaxed">
            একই রোল নম্বরে একাধিক পরীক্ষার ফলাফল নিবন্ধিত রয়েছে। আপনি যে পরীক্ষার বিস্তারিত বিষয়ভিত্তিক গ্রেডশিট ও ফলাফল দেখতে চান, নিচের তালিকা থেকে সেই কার্ডটি স্পর্শ বা ক্লিক করুন।
          </p>
        </div>

        {/* List of Available Exam Cards */}
        <div className="space-y-3 pt-1">
          {results.map((item, index) => {
            const isPassed = Boolean(
              item.isPassed && (item.gpa || 0) > 0 && item.letterGrade !== 'F'
            );
            const semesterTitle =
              SEMESTER_MAP[item.semesterId] ||
              `${toBanglaDigits(item.semesterId)}ম পর্ব/সেমিস্টার`;
            const dateInfo = formatResultDate(item);

            // Reliable unique identifier check (database id or composite key)
            const itemKey = item.id || `res-${item.examId}-${item.roll}-${index}`;

            return (
              <div
                key={itemKey}
                onClick={() => onSelectResult(item)}
                className={`group relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-all cursor-pointer border active:scale-[0.99] select-none ${
                  isPassed
                    ? 'bg-white/85 hover:bg-white border-slate-200/90 hover:border-emerald-400 hover:shadow-[0_12px_28px_rgba(16,185,129,0.12)]'
                    : 'bg-white/85 hover:bg-white border-slate-200/90 hover:border-rose-400 hover:shadow-[0_12px_28px_rgba(244,63,94,0.12)]'
                } backdrop-blur-xl shadow-xs`}
              >
                {/* Subtle Left Accent Line */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2 ${
                    isPassed ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pl-2">
                  {/* Left Column: Exam info */}
                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Exam Name & Type */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm sm:text-base font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                        {item.examTitle || item.examType || 'পরীক্ষার ফলাফল'}
                      </span>
                      {item.examType && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold font-outfit uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200/80">
                          {item.examType}
                        </span>
                      )}
                    </div>

                    {/* Meta info row: Technology & Semester/Parba */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-600 font-semibold">
                      <span className="inline-flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate max-w-[200px] sm:max-w-none">
                          {item.departmentName || 'ডিপ্লোমা ইন ইঞ্জিনিয়ারিং'}
                        </span>
                      </span>

                      <span className="text-slate-300">•</span>

                      <span className="inline-flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{semesterTitle}</span>
                      </span>

                      <span className="text-slate-300">•</span>

                      {/* Date */}
                      <span className="inline-flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {dateInfo.label}: {dateInfo.dateStr}
                        </span>
                      </span>
                    </div>

                    {/* Marks Summary if available */}
                    {item.totalFullMarks > 0 && (
                      <div className="text-[11px] text-slate-500 font-medium">
                        মোট নম্বর: <span className="font-bold text-slate-700 font-outfit">{toBanglaDigits(item.totalObtainedMarks)}</span> / <span className="font-outfit">{toBanglaDigits(item.totalFullMarks)}</span>
                        {Array.isArray(item.subjects) && item.subjects.length > 0 && (
                          <span className="ml-2 text-slate-400">
                            ({toBanglaDigits(item.subjects.length)}টি বিষয়)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Status & Action Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Status Pill */}
                    <div className="text-left sm:text-right">
                      {isPassed ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="text-left">
                            <div className="text-xs font-black leading-none">উত্তীর্ণ</div>
                            <div className="text-[10px] font-bold text-emerald-700 font-outfit leading-none mt-1">
                              GPA {toBanglaDigits(item.gpa?.toFixed(2) || '0.00')} ({item.letterGrade || 'P'})
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200/80 shadow-2xs">
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <div className="text-left">
                            <div className="text-xs font-black leading-none">অনুত্তীর্ণ</div>
                            <div className="text-[10px] font-bold text-rose-700 font-outfit leading-none mt-1">
                              গ্রেড {item.letterGrade || 'F'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SVG Action CTA Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectResult(item);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs group-hover:scale-105 group-hover:shadow-md cursor-pointer"
                    >
                      <span>ফলাফল দেখুন</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5] transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
};
