import React, { useState } from 'react';
import { Search, BookOpen, Layers, Sparkles, Trophy, Bell, ChevronDown, Check, ArrowRight } from 'lucide-react';
import { Exam, SemesterId } from '../../types';
import { SEMESTER_MAP, toBanglaDigits } from '../../utils/bangla';
import { BottomSheet } from '../common/BottomSheet';

interface HeroSearchCardProps {
  exams: Exam[];
  onSearch: (params: { roll: string; semesterId?: string; examId?: string }) => void;
  onNavigateTab: (tab: string) => void;
  isLoading?: boolean;
}

export const HeroSearchCard: React.FC<HeroSearchCardProps> = ({
  exams,
  onSearch,
  onNavigateTab,
  isLoading = false,
}) => {
  const [roll, setRoll] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');
  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Bottom Sheet states for Mobile pickers
  const [semesterPickerOpen, setSemesterPickerOpen] = useState(false);
  const [examPickerOpen, setExamPickerOpen] = useState(false);

  // Filter exams by selected semester if any
  const publishedExams = exams.filter((e) => e.status === 'PUBLISHED');
  const filteredExams =
    selectedSemester !== 'ALL'
      ? publishedExams.filter((e) => e.semesterId === selectedSemester)
      : publishedExams;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanRoll = roll.trim();
    if (!cleanRoll) {
      setValidationError('অনুগ্রহ করে সঠিক রোল নম্বর প্রদান করুন।');
      return;
    }

    onSearch({
      roll: cleanRoll,
      semesterId: selectedSemester !== 'ALL' ? selectedSemester : undefined,
      examId: selectedExamId !== 'ALL' ? selectedExamId : undefined,
    });
  };

  const selectedSemesterLabel =
    selectedSemester === 'ALL'
      ? 'সকল সেমিস্টার'
      : SEMESTER_MAP[selectedSemester] || `${toBanglaDigits(selectedSemester)}ম সেমিস্টার`;

  const selectedExamObj = publishedExams.find((e) => e.id === selectedExamId);
  const selectedExamLabel = selectedExamObj ? selectedExamObj.title : 'সকল পরীক্ষা';

  return (
    <div className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-20 bg-gradient-to-b from-slate-50/70 via-blue-50/30 to-slate-100/50">
      {/* Ambient Glassmorphism Backlight Spheres */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-400/20 via-sky-300/20 to-indigo-400/15 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-1/3 left-10 w-72 h-72 bg-teal-300/15 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/10 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
        {/* Hero Title & Subtitle */}
        <div className="text-center mb-7 sm:mb-9">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-xl border border-white/90 text-blue-800 text-xs font-bold font-outfit uppercase tracking-wider mb-3.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>RESULT SEARCH ZONE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-2.5 tracking-tight font-bengali">
            ফলাফল অনুসন্ধান করুন
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto font-medium font-bengali">
            আপনার সঠিক রোল নম্বর ও সেমিস্টার নির্বাচন করে তাৎক্ষণিক ফলাফল ও গ্রেডশিট দেখুন
          </p>
        </div>

        {/* iPhone Glassmorphism Master Search Card */}
        <div
          id="search-container-card"
          className="w-full bg-white/75 backdrop-blur-2xl p-4.5 sm:p-7 md:p-9 rounded-3xl sm:rounded-[36px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.9)_inset] border border-white/80 text-left transition-all relative overflow-hidden"
        >
          {/* Subtle Top Edge Sheen */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-5 md:items-end">
              {/* Roll Number Input (Takes 5 cols) */}
              <div className="md:col-span-5 flex flex-col gap-2">
                <label className="text-xs font-extrabold text-slate-600 ml-1 uppercase tracking-wider flex items-center gap-1.5 font-outfit">
                  <span>STUDENT ROLL</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <input
                    id="input-student-roll"
                    type="text"
                    inputMode="numeric"
                    placeholder="আপনার রোল নম্বর দিন"
                    value={roll}
                    onChange={(e) => {
                      setRoll(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    className="w-full bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-bold font-outfit text-base shadow-2xs hover:border-slate-300"
                  />
                  <div className="w-9 h-9 rounded-xl bg-slate-100/80 border border-slate-200/60 flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Search className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>

              {/* Semester Selector (Takes 3.5 cols) */}
              <div className="md:col-span-3 flex flex-col gap-2">
                <label className="text-xs font-extrabold text-slate-600 ml-1 uppercase tracking-wider font-outfit">
                  SEMESTER
                </label>
                <button
                  type="button"
                  id="btn-semester-picker"
                  onClick={() => setSemesterPickerOpen(true)}
                  className="w-full bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl px-4 py-4 text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all flex items-center justify-between text-left text-sm font-bold truncate cursor-pointer hover:bg-white hover:border-slate-300 shadow-2xs"
                >
                  <span className="truncate">{selectedSemesterLabel}</span>
                  <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
                </button>
              </div>

              {/* Exam Selector (Takes 4 cols) */}
              <div className="md:col-span-4 flex flex-col gap-2">
                <label className="text-xs font-extrabold text-slate-600 ml-1 uppercase tracking-wider font-outfit">
                  EXAMINATION
                </label>
                <button
                  type="button"
                  id="btn-exam-picker"
                  onClick={() => setExamPickerOpen(true)}
                  className="w-full bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl px-4 py-4 text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all flex items-center justify-between text-left text-sm font-bold truncate cursor-pointer hover:bg-white hover:border-slate-300 shadow-2xs"
                >
                  <span className="truncate">{selectedExamLabel}</span>
                  <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
                </button>
              </div>
            </div>

            {/* Error message */}
            {validationError && (
              <div className="p-3.5 bg-rose-50/90 backdrop-blur-md border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-center space-x-2 shadow-2xs">
                <span>{validationError}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="btn-submit-search"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:via-blue-700 hover:to-indigo-700 text-white px-10 py-4 rounded-2xl font-black text-base sm:text-lg shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-98 disabled:opacity-50 ring-2 ring-blue-500/20"
              >
                <Search className="w-5 h-5 stroke-[2.5]" />
                <span className="font-bengali">ফলাফল অনুসন্ধান করুন</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>
            </div>

            {/* DPIB SERVER - Powered By Branding */}
            <div className="pt-6 sm:pt-8 pb-2 flex flex-col items-center justify-center text-center select-none border-t border-slate-100/90 mt-4">
              <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
                <span className="h-0.5 w-10 sm:w-20 bg-gradient-to-r from-transparent via-violet-400 to-violet-600" />
                <span className="text-xs sm:text-sm font-black tracking-[0.35em] text-violet-700 uppercase font-outfit">
                  POWERED BY
                </span>
                <span className="h-0.5 w-10 sm:w-20 bg-gradient-to-l from-transparent via-violet-400 to-violet-600" />
              </div>
              <div className="flex items-center justify-center transition-transform hover:scale-[1.02] w-full px-2">
                <img
                  src="https://i.postimg.cc/zG2NKBT6/file-000000003638820ba48f9ab703e4624e.png"
                  alt="DPIB SERVER"
                  className="h-20 sm:h-32 md:h-36 lg:h-40 w-auto max-w-full sm:max-w-[480px] md:max-w-[560px] lg:max-w-[620px] object-contain drop-shadow-md"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Quick Dynamic Stats / Badges with iPhone Glassmorphism */}
        <div className="mt-8 sm:mt-10 flex flex-wrap justify-center gap-3 sm:gap-5">
          <div
            onClick={() => onNavigateTab('exams')}
            className="flex items-center gap-3 bg-white/80 backdrop-blur-xl px-4 sm:px-5 py-3 rounded-2xl border border-white/90 shadow-xs cursor-pointer hover:bg-white hover:shadow-md transition-all active:scale-98"
          >
            <div className="w-10 h-10 bg-blue-50/90 text-blue-600 rounded-xl border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-none font-outfit">PUBLISHED EXAMS</p>
              <p className="text-xs sm:text-sm font-black text-slate-800 mt-1 font-bengali">
                {publishedExams.length > 0 ? `${toBanglaDigits(publishedExams.length)}টি পরীক্ষা` : 'ফলাফল লাইভ'}
              </p>
            </div>
          </div>

          <div
            onClick={() => onNavigateTab('merit')}
            className="flex items-center gap-3 bg-white/80 backdrop-blur-xl px-4 sm:px-5 py-3 rounded-2xl border border-white/90 shadow-xs cursor-pointer hover:bg-white hover:shadow-md transition-all active:scale-98"
          >
            <div className="w-10 h-10 bg-amber-50/90 text-amber-600 rounded-xl border border-amber-100 flex items-center justify-center shrink-0 shadow-2xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-none font-outfit">TOP MERIT LIST</p>
              <p className="text-xs sm:text-sm font-black text-slate-800 mt-1 font-bengali">মেধাক্রম ও গ্রেড</p>
            </div>
          </div>

          <div
            onClick={() => onNavigateTab('notices')}
            className="flex items-center gap-3 bg-white/80 backdrop-blur-xl px-4 sm:px-5 py-3 rounded-2xl border border-white/90 shadow-xs cursor-pointer hover:bg-white hover:shadow-md transition-all active:scale-98"
          >
            <div className="w-10 h-10 bg-orange-50/90 text-orange-600 rounded-xl border border-orange-100 flex items-center justify-center shrink-0 shadow-2xs">
              <Bell className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-none font-outfit">NOTICE BOARD</p>
              <p className="text-xs sm:text-sm font-black text-slate-800 mt-1 font-bengali">ইনস্টিটিউট নোটিশ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Semester Selection Bottom Sheet */}
      <BottomSheet
        isOpen={semesterPickerOpen}
        onClose={() => setSemesterPickerOpen(false)}
        title="সেমিস্টার নির্বাচন করুন"
        subtitle="ফলাফল খোঁজার জন্য আপনার সেমিস্টার বেছে নিন"
      >
        <div className="space-y-2">
          <button
            onClick={() => {
              setSelectedSemester('ALL');
              setSemesterPickerOpen(false);
            }}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border text-sm font-bold transition-all ${
              selectedSemester === 'ALL'
                ? 'bg-blue-50 border-blue-400 text-blue-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>সকল সেমিস্টার (যেকোনো সেমিস্টার)</span>
            {selectedSemester === 'ALL' && <Check className="w-5 h-5 text-blue-600" />}
          </button>

          {(['1', '2', '3', '4', '5', '6', '7', '8'] as SemesterId[]).map((semId) => (
            <button
              key={semId}
              onClick={() => {
                setSelectedSemester(semId);
                setSemesterPickerOpen(false);
              }}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border text-sm font-bold transition-all ${
                selectedSemester === semId
                  ? 'bg-blue-50 border-blue-400 text-blue-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{SEMESTER_MAP[semId]}</span>
              {selectedSemester === semId && <Check className="w-5 h-5 text-blue-600" />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Exam Selection Bottom Sheet */}
      <BottomSheet
        isOpen={examPickerOpen}
        onClose={() => setExamPickerOpen(false)}
        title="পরীক্ষা নির্বাচন করুন"
        subtitle="নির্দিষ্ট পরীক্ষার ফলাফল দেখতে নির্বাচন করুন"
      >
        <div className="space-y-2">
          <button
            onClick={() => {
              setSelectedExamId('ALL');
              setExamPickerOpen(false);
            }}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border text-sm font-bold transition-all ${
              selectedExamId === 'ALL'
                ? 'bg-blue-50 border-blue-400 text-blue-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>সকল পরীক্ষা (সর্বশেষ প্রকাশিত পরীক্ষা)</span>
            {selectedExamId === 'ALL' && <Check className="w-5 h-5 text-blue-600" />}
          </button>

          {filteredExams.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
              এই সেমিস্টারের কোনো প্রকাশিত পরীক্ষা নেই।
            </div>
          ) : (
            filteredExams.map((exam) => (
              <button
                key={exam.id}
                onClick={() => {
                  setSelectedExamId(exam.id);
                  setExamPickerOpen(false);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border text-sm font-bold transition-all ${
                  selectedExamId === exam.id
                    ? 'bg-blue-50 border-blue-400 text-blue-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>
                  <span className="block">{exam.title}</span>
                  <span className="text-xs text-slate-400 font-normal">
                    {exam.departmentName} • {exam.examType}
                  </span>
                </div>
                {selectedExamId === exam.id && <Check className="w-5 h-5 text-blue-600" />}
              </button>
            ))
          )}
        </div>
      </BottomSheet>
    </div>
  );
};
