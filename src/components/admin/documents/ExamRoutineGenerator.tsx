import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CalendarDays,
  Plus,
  Trash2,
  Edit3,
  Clock,
  Building,
  BookOpen,
  Award,
  GraduationCap,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Filter,
  MapPin,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sun,
  Sunrise,
  Sunset,
  Timer,
  Check,
  AlertCircle,
} from 'lucide-react';
import { A4DocumentEngine } from './A4DocumentEngine';
import { Exam, ExamRoutineItem, SemesterId, CurriculumSubject, ShiftConfig } from '../../../types';
import { getExams, saveExam, getShiftConfigs, DEFAULT_SHIFTS } from '../../../services/db';
import { getAutoLoadedCurriculumSubjects } from '../../../data/masterCurriculum';
import { toBanglaDigits, SEMESTER_MAP } from '../../../utils/bangla';
import { SelectBottomSheet, SelectTrigger, SelectOption } from '../../common/SelectBottomSheet';
import { BottomSheet } from '../../common/BottomSheet';
import { ModernDatePicker, ModernDateTrigger } from '../../common/ModernDatePicker';
import { saveDraft, getDraft, clearDraft, DraftRecord } from '../../../utils/draftStorage';
import { DraftRestoreBanner } from '../../common/DraftRestoreBanner';

const AVAILABLE_TECHNOLOGIES = [
  { id: 'COMPUTER', name: 'কম্পিউটার টেকনোলজি', code: 'CMT' },
  { id: 'CIVIL', name: 'সিভিল টেকনোলজি', code: 'CT' },
  { id: 'ELECTRICAL', name: 'ইলেকট্রিক্যাল টেকনোলজি', code: 'ET' },
  { id: 'MECHANICAL', name: 'মেকানিক্যাল টেকনোলজি', code: 'MT' },
  { id: 'MARINE', name: 'মেরিন টেকনোলজি', code: 'MARINE' },
  { id: 'SURVEYING', name: 'সার্ভেয়িং টেকনোলজি', code: 'ST' },
];

const EXAM_TYPES = [
  'মডেল টেস্ট',
  'পর্ব সমাপনী পরীক্ষা',
  'মিডটার্ম পরীক্ষা',
  'ক্লাস টেস্ট',
  'প্র্যাকটিক্যাল পরীক্ষা',
];

const BANGLA_DAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

export const getBanglaDayFromDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const date = new Date(y, m, d);
    if (!isNaN(date.getTime())) {
      return BANGLA_DAYS[date.getDay()] || '';
    }
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return BANGLA_DAYS[d.getDay()] || '';
};

export const formatBanglaDateDisplay = (dateStr: string): string => {
  if (!dateStr) return 'তারিখ নির্বাচন করুন';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const months = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const monthName = months[m] || parts[1];
    return `${toBanglaDigits(d)} ${monthName} ${toBanglaDigits(y)}`;
  }
  return dateStr;
};

// =========================================================================
// 1. MODERN SLIDING DATE SELECTION BOTTOM SHEET COMPONENT
// =========================================================================
interface DateSelectionBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onSelectDate: (dateStr: string, dayBangla: string) => void;
}

const DateSelectionBottomSheet: React.FC<DateSelectionBottomSheetProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
}) => {
  const [currentViewDate, setCurrentViewDate] = useState(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
      }
    }
    return new Date();
  });

  const [tempSelectedDate, setTempSelectedDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (selectedDate) {
      setTempSelectedDate(selectedDate);
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        setCurrentViewDate(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1));
      }
    }
  }, [selectedDate, isOpen]);

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentViewDate(new Date(year, month + 1, 1));
  };

  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sun, 6 is Sat
  // Starting grid with Saturday: Sat = 0, Sun = 1, Mon = 2, Tue = 3, Wed = 4, Thu = 5, Fri = 6
  const startOffset = (firstDayOfWeek + 1) % 7;

  const handleDayClick = (dayNumber: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(dayNumber).padStart(2, '0');
    const fullDate = `${year}-${mm}-${dd}`;
    setTempSelectedDate(fullDate);
  };

  const handleQuickPreset = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const fullDate = `${yyyy}-${mm}-${dd}`;
    setTempSelectedDate(fullDate);
    setCurrentViewDate(new Date(yyyy, d.getMonth(), 1));
  };

  const handleConfirm = () => {
    const dayBangla = getBanglaDayFromDate(tempSelectedDate);
    onSelectDate(tempSelectedDate, dayBangla);
    onClose();
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const computedDayBangla = getBanglaDayFromDate(tempSelectedDate);

  const monthsBangla = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const weekdaysBangla = ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র'];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="পরীক্ষার তারিখ নির্বাচন"
      subtitle="ক্যালেন্ডার থেকে পরীক্ষার নির্ধারিত দিন ও তারিখ সিলেক্ট করুন"
      maxHeight="max-h-[90vh]"
    >
      <div className="space-y-4 pb-4 font-bengali">
        {/* Quick Date Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-500 shrink-0 mr-1">দ্রুত পছন্দ:</span>
          <button
            type="button"
            onClick={() => handleQuickPreset(0)}
            className="px-2.5 py-1 bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-700 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer"
          >
            আজ
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset(1)}
            className="px-2.5 py-1 bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-700 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer"
          >
            আগামীকাল
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset(3)}
            className="px-2.5 py-1 bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-700 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer"
          >
            ৩ দিন পর
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset(7)}
            className="px-2.5 py-1 bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-700 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer"
          >
            ১ সপ্তাহ পর
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset(14)}
            className="px-2.5 py-1 bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-700 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer"
          >
            ২ সপ্তাহ পর
          </button>
        </div>

        {/* Calendar Box */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4">
          {/* Month/Year Nav Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/80">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              title="পূর্ববর্তী মাস"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <span className="text-sm font-black text-slate-900">
                {monthsBangla[month]} {toBanglaDigits(year)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              title="পরবর্তী মাস"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Row */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {weekdaysBangla.map((wd, i) => (
              <div
                key={wd}
                className={`text-[11px] font-bold py-1 ${i === 6 ? 'text-rose-500' : 'text-slate-500'}`}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9" />
            ))}

            {Array.from({ length: totalDays }).map((_, i) => {
              const dayNum = i + 1;
              const mm = String(month + 1).padStart(2, '0');
              const dd = String(dayNum).padStart(2, '0');
              const currentCellDate = `${year}-${mm}-${dd}`;
              const isSelected = tempSelectedDate === currentCellDate;
              const isToday = todayStr === currentCellDate;
              const dayOfWeek = (startOffset + i) % 7;
              const isFriday = dayOfWeek === 6;

              return (
                <button
                  key={currentCellDate}
                  type="button"
                  onClick={() => handleDayClick(dayNum)}
                  className={`h-9 w-full rounded-xl text-xs font-bold transition-all flex items-center justify-center relative cursor-pointer ${
                    isSelected
                      ? 'bg-violet-700 text-white shadow-md shadow-violet-500/30 scale-105 z-10'
                      : isToday
                      ? 'bg-violet-100 text-violet-900 border border-violet-300'
                      : isFriday
                      ? 'bg-white hover:bg-rose-50 text-rose-600 border border-slate-100'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-100'
                  }`}
                >
                  <span>{toBanglaDigits(dayNum)}</span>
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 bg-violet-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date & Auto Day Preview Card */}
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200/90 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-violet-900">
                {formatBanglaDateDisplay(tempSelectedDate)}
              </p>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mt-0.5">
                <span>বার: {computedDayBangla || '---'}</span>
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md">
                  স্বয়ংক্রিয় নির্ধারিত
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>তারিখ নিশ্চিত করুন</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

// =========================================================================
// 2. MODERN SLIDING TIME SELECTION BOTTOM SHEET COMPONENT
// =========================================================================
interface TimeSelectionBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  startTime: string;
  endTime: string;
  onSelectTime: (start: string, end: string) => void;
}

const TIME_SHIFTS = [
  {
    id: 'morning_standard',
    title: 'সকাল শিফট (স্ট্যান্ডার্ড)',
    start: '10:00 AM',
    end: '01:00 PM',
    duration: '৩ ঘণ্টা',
    description: 'মডেল টেস্ট ও বোর্ড সমাপনী পরীক্ষা',
    icon: Sun,
    badge: 'ডিফল্ট',
  },
  {
    id: 'morning_early',
    title: 'সকাল ১ম শিফট',
    start: '09:00 AM',
    end: '12:00 PM',
    duration: '৩ ঘণ্টা',
    description: 'সকালের ১ম শিফট পরীক্ষা',
    icon: Sunrise,
    badge: '১ম শিফট',
  },
  {
    id: 'noon_shift',
    title: 'দুপুর শিফট',
    start: '11:00 AM',
    end: '02:00 PM',
    duration: '৩ ঘণ্টা',
    description: 'মধ্যবর্তী সমাপনী শিফট',
    icon: Clock,
    badge: 'মধ্যাহ্ন',
  },
  {
    id: 'afternoon_shift',
    title: 'বিকাল শিফট (২য় শিফট)',
    start: '02:00 PM',
    end: '05:00 PM',
    duration: '৩ ঘণ্টা',
    description: 'বিকালের ২য় শিফট পরীক্ষা',
    icon: Sunset,
    badge: '২য় শিফট',
  },
  {
    id: 'class_test',
    title: 'ক্লাস টেস্ট ও কুইজ',
    start: '10:00 AM',
    end: '11:30 AM',
    duration: '১.৫ ঘণ্টা',
    description: 'সংক্ষিপ্ত ধারাবাহিক মূল্যায়ন',
    icon: Timer,
    badge: 'সংক্ষিপ্ত',
  },
  {
    id: 'practical_full',
    title: 'ব্যবহারিক / ল্যাব পরীক্ষা',
    start: '09:00 AM',
    end: '04:00 PM',
    duration: '৭ ঘণ্টা',
    description: 'পূর্ণ দিবস প্র্যাকটিক্যাল সেশন',
    icon: Layers,
    badge: 'ব্যবহারিক',
  },
];

const TimeSelectionBottomSheet: React.FC<TimeSelectionBottomSheetProps> = ({
  isOpen,
  onClose,
  startTime,
  endTime,
  onSelectTime,
}) => {
  const [selectedStart, setSelectedStart] = useState(startTime || '10:00 AM');
  const [selectedEnd, setSelectedEnd] = useState(endTime || '01:00 PM');
  const [customMode, setCustomMode] = useState(false);
  const [dynamicShifts, setDynamicShifts] = useState<ShiftConfig[]>(DEFAULT_SHIFTS);

  useEffect(() => {
    async function loadShifts() {
      try {
        const loaded = await getShiftConfigs();
        if (loaded && loaded.length > 0) {
          setDynamicShifts(loaded);
        }
      } catch (e) {
        console.error('Error loading shifts in TimeSelectionBottomSheet:', e);
      }
    }
    if (isOpen) {
      loadShifts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (startTime) setSelectedStart(startTime);
    if (endTime) setSelectedEnd(endTime);
  }, [startTime, endTime, isOpen]);

  const handleSelectPreset = (start: string, end: string) => {
    setSelectedStart(start);
    setSelectedEnd(end);
    onSelectTime(start, end);
    onClose();
  };

  const handleConfirmCustom = () => {
    onSelectTime(selectedStart, selectedEnd);
    onClose();
  };

  const START_OPTIONS = [
    '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM',
    '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '05:00 PM'
  ];

  const END_OPTIONS = [
    '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM',
    '01:30 PM', '02:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '06:00 PM', '06:30 PM'
  ];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="পরীক্ষার সময়সূচি নির্বাচন"
      subtitle="অ্যাডমিনে কনফিগার করা শিফট বা কাস্টম সময় সিলেক্ট করুন"
      maxHeight="max-h-[90vh]"
    >
      <div className="space-y-4 pb-4 font-bengali">
        {/* Toggle Preset / Custom Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setCustomMode(false)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              !customMode ? 'bg-white text-violet-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            সক্রিয় শিফটসমূহ
          </button>
          <button
            type="button"
            onClick={() => setCustomMode(true)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              customMode ? 'bg-white text-violet-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            কাস্টম সময় নির্ধারণ
          </button>
        </div>

        {!customMode ? (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {dynamicShifts.map((shift, idx) => {
              const isMatch = selectedStart === shift.startTime && selectedEnd === shift.endTime;
              const isSunset = shift.name.includes('বিকাল') || shift.name.includes('২য়') || shift.startTime.includes('PM');
              const Icon = isSunset ? Sunset : Sunrise;

              return (
                <button
                  key={shift.id || idx}
                  type="button"
                  onClick={() => handleSelectPreset(shift.startTime, shift.endTime)}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer group ${
                    isMatch
                      ? 'bg-violet-50/90 border-violet-600 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200/90'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isMatch
                          ? 'bg-violet-700 text-white border-violet-700'
                          : 'bg-slate-50 text-slate-600 border-slate-200 group-hover:border-violet-200 group-hover:text-violet-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                          {shift.name}
                        </h4>
                        {shift.badge && (
                          <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {shift.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{shift.description || `${shift.startTime} হতে ${shift.endTime}`}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block font-mono font-bold text-xs sm:text-sm text-violet-900 bg-violet-100/60 px-2 py-0.5 rounded-lg border border-violet-200">
                      {toBanglaDigits(shift.startTime)} - {toBanglaDigits(shift.endTime)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Custom Start Time */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                শুরুর সময় নির্বাচন করুন:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {START_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSelectedStart(opt)}
                    className={`py-2 px-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      selectedStart === opt
                        ? 'bg-violet-700 text-white border-violet-700 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {toBanglaDigits(opt)}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom End Time */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                শেষের সময় নির্বাচন করুন:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {END_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSelectedEnd(opt)}
                    className={`py-2 px-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      selectedEnd === opt
                        ? 'bg-violet-700 text-white border-violet-700 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {toBanglaDigits(opt)}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Time Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-700" />
                <span className="text-xs font-bold text-slate-800">
                  নির্ধারিত সময়: <span className="font-mono text-violet-900">{toBanglaDigits(selectedStart)} - {toBanglaDigits(selectedEnd)}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={handleConfirmCustom}
                className="px-4 py-1.5 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                সময় নিশ্চিত করুন
              </button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

export const ExamRoutineGenerator: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  
  // Filter for preview / table (ALL or specific technology)
  const [viewTechFilter, setViewTechFilter] = useState<string>('ALL');
  const [viewSemesterFilter, setViewSemesterFilter] = useState<string>('ALL');

  // Routine Entries state - starts 100% EMPTY (no default/fake data)
  const [routineItems, setRoutineItems] = useState<ExamRoutineItem[]>([]);

  // Draft state
  const [pendingDraft, setPendingDraft] = useState<DraftRecord<any> | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const isInitialMount = useRef(true);

  // Check for existing draft on load
  useEffect(() => {
    async function checkDraft() {
      try {
        const draft = await getDraft<any>('exam_routine');
        if (draft && draft.data) {
          setPendingDraft(draft);
        }
      } catch (err) {
        console.error('Failed to check draft:', err);
      }
    }
    checkDraft();
  }, []);

  // Debounced auto-save draft
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      const draftData = {
        selectedExamId,
        viewTechFilter,
        viewSemesterFilter,
        routineItems,
      };
      await saveDraft('exam_routine', draftData);
      setLastSavedTime(Date.now());
    }, 800);

    return () => clearTimeout(timer);
  }, [selectedExamId, viewTechFilter, viewSemesterFilter, routineItems]);

  const handleRestoreDraft = () => {
    if (!pendingDraft?.data) return;
    const d = pendingDraft.data;
    if (d.selectedExamId) setSelectedExamId(d.selectedExamId);
    if (d.viewTechFilter) setViewTechFilter(d.viewTechFilter);
    if (d.viewSemesterFilter) setViewSemesterFilter(d.viewSemesterFilter);
    if (Array.isArray(d.routineItems)) setRoutineItems(d.routineItems);

    setPendingDraft(null);
    setLastSavedTime(pendingDraft.updatedAt);
  };

  const handleDiscardDraft = async () => {
    await clearDraft('exam_routine');
    setPendingDraft(null);
    setLastSavedTime(null);
  };

  // Selection Bottom Sheets
  const [examSheetOpen, setExamSheetOpen] = useState(false);
  const [filterTechSheetOpen, setFilterTechSheetOpen] = useState(false);
  const [filterSemSheetOpen, setFilterSemSheetOpen] = useState(false);

  // Modern Sliding Bottom Sheets for Sub-selections in Add/Edit Subject Modal
  const [formTechSheetOpen, setFormTechSheetOpen] = useState(false);
  const [formSemSheetOpen, setFormSemSheetOpen] = useState(false);
  const [formDateSheetOpen, setFormDateSheetOpen] = useState(false);
  const [formTimeSheetOpen, setFormTimeSheetOpen] = useState(false);

  // Modern Sliding Bottom Sheet for "পরীক্ষা যোগ করুন" (Create New Exam)
  const [createExamSheetOpen, setCreateExamSheetOpen] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamType, setNewExamType] = useState('মডেল টেস্ট');
  const [newExamDate, setNewExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [newExamDept, setNewExamDept] = useState('ALL');
  const [newExamSem, setNewExamSem] = useState('2');
  const [isSavingExam, setIsSavingExam] = useState(false);

  // Select Bottom Sheets for Create Exam Modal
  const [newExamTypeSheetOpen, setNewExamTypeSheetOpen] = useState(false);
  const [newExamDeptSheetOpen, setNewExamDeptSheetOpen] = useState(false);
  const [newExamSemSheetOpen, setNewExamSemSheetOpen] = useState(false);
  const [newExamDatePickerOpen, setNewExamDatePickerOpen] = useState(false);

  // Modern Sliding Bottom Sheet for "বিষয় যুক্ত করুন" (Add / Edit Subject Routine Entry)
  const [subjectSheetOpen, setSubjectSheetOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form states inside the Add/Edit Subject Bottom Sheet
  const [formTech, setFormTech] = useState<string>('COMPUTER');
  const [formSemester, setFormSemester] = useState<string>('2');
  const [formSubjectCode, setFormSubjectCode] = useState<string>('');
  const [formSubjectName, setFormSubjectName] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('');
  const [formDay, setFormDay] = useState<string>('');
  const [formStartTime, setFormStartTime] = useState<string>('10:00 AM');
  const [formEndTime, setFormEndTime] = useState<string>('01:00 PM');
  const [subjectSearchQuery, setSubjectSearchQuery] = useState<string>('');

  // Load exams from Firestore on initial mount
  useEffect(() => {
    async function load() {
      try {
        const list = await getExams();
        setExams(list);
        if (list.length > 0 && !selectedExamId) {
          setSelectedExamId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load exams:', err);
      }
    }
    load();
  }, []);

  // When formDate changes, automatically set the Bangla day
  useEffect(() => {
    if (formDate) {
      const dayName = getBanglaDayFromDate(formDate);
      if (dayName) {
        setFormDay(dayName);
      }
    }
  }, [formDate]);

  // Dynamically load authentic curriculum subjects for the selected tech & semester in the bottom sheet
  const availableCurriculumSubjects: CurriculumSubject[] = useMemo(() => {
    if (!formSemester) return [];
    if (formTech === 'ALL') {
      const allTechs = AVAILABLE_TECHNOLOGIES.map((t) => t.id);
      const list = getAutoLoadedCurriculumSubjects(allTechs, formSemester as SemesterId);
      // Deduplicate by subject code so common subjects appear once
      const seen = new Set<string>();
      return list.filter((sub) => {
        const code = (sub.subjectCode || '').trim();
        if (code && seen.has(code)) return false;
        if (code) seen.add(code);
        return true;
      });
    }
    return getAutoLoadedCurriculumSubjects([formTech], formSemester as SemesterId);
  }, [formTech, formSemester]);

  // Filtered curriculum subjects in the bottom sheet by search query
  const filteredCurriculumSubjects = useMemo(() => {
    if (!subjectSearchQuery.trim()) return availableCurriculumSubjects;
    const query = subjectSearchQuery.toLowerCase();
    return availableCurriculumSubjects.filter(
      (sub) =>
        sub.subjectName.toLowerCase().includes(query) ||
        sub.subjectCode.toLowerCase().includes(query)
    );
  }, [availableCurriculumSubjects, subjectSearchQuery]);

  // Open "বিষয় যুক্ত করুন" Bottom Sheet for new entry
  const handleOpenAddSubjectSheet = () => {
    setEditingItemId(null);
    setFormSubjectCode('');
    setFormSubjectName('');
    setSubjectSearchQuery('');
    if (!formDate) {
      const today = new Date().toISOString().split('T')[0];
      setFormDate(today);
      setFormDay(getBanglaDayFromDate(today));
    }
    setSubjectSheetOpen(true);
  };

  // Open "বিষয় যুক্ত করুন" Bottom Sheet for editing an existing entry
  const handleOpenEditSubjectSheet = (item: ExamRoutineItem) => {
    setEditingItemId(item.id);
    setFormTech(item.technology || 'COMPUTER');
    setFormSemester(item.semesterId || '2');
    setFormSubjectCode(item.subjectCode);
    setFormSubjectName(item.subjectName);
    setFormDate(item.date);
    setFormDay(item.day || getBanglaDayFromDate(item.date));
    setFormStartTime(item.startTime);
    setFormEndTime(item.endTime);
    setSubjectSearchQuery('');
    setSubjectSheetOpen(true);
  };

  // Select a curriculum subject to auto-fill code and name
  const handleSelectCurriculumSubject = (sub: CurriculumSubject) => {
    setFormSubjectCode(sub.subjectCode);
    setFormSubjectName(sub.subjectName);
  };

  // Save entry from the Sliding Bottom Sheet with Duplicate Protection
  const handleSaveSubjectEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubjectName.trim()) {
      alert('অনুগ্রহ করে বিষয়ের নাম সিলেক্ট বা এন্ট্রি করুন।');
      return;
    }

    if (!formDate) {
      alert('অনুগ্রহ করে পরীক্ষার তারিখ নির্ধারণ করুন।');
      return;
    }

    const trimmedCode = formSubjectCode.trim();
    const trimmedName = formSubjectName.trim().toLowerCase();

    // Duplicate Check Rule:
    // Prevent adding the same subject for the same semester and date if:
    // 1. Current entry is 'ALL' and already exists any entry for that subject/date/semester
    // 2. Existing entry is 'ALL' for that subject/date/semester
    // 3. Existing entry has the same technology
    const isDuplicate = routineItems.some((item) => {
      if (editingItemId && item.id === editingItemId) return false;
      
      const sameSemester = item.semesterId === formSemester;
      const sameDate = item.date === formDate;
      const sameSubject =
        (trimmedCode && item.subjectCode && item.subjectCode.trim() === trimmedCode) ||
        (item.subjectName && item.subjectName.trim().toLowerCase() === trimmedName);

      if (!sameSemester || !sameDate || !sameSubject) return false;

      // If current is 'ALL', it represents all technologies so it clashes
      if (formTech === 'ALL') return true;

      // If existing is 'ALL', it already represents all technologies including this one
      if (item.technology === 'ALL') return true;

      // If existing is the same specific technology
      return item.technology === formTech;
    });

    if (isDuplicate) {
      alert('সতর্কতা: এই বিষয়টি ইতিমধ্যে এই তারিখ ও সেমিস্টারের রুটিনে যুক্ত রয়েছে (ডুপ্লিকেট এন্ট্রি প্রতিরোধ করা হয়েছে)।');
      return;
    }

    const resolvedDay = formDay || getBanglaDayFromDate(formDate);

    if (editingItemId) {
      // Update existing item
      setRoutineItems((prev) =>
        prev.map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                technology: formTech,
                semesterId: formSemester,
                subjectCode: formSubjectCode.trim(),
                subjectName: formSubjectName.trim(),
                date: formDate,
                day: resolvedDay,
                startTime: formStartTime,
                endTime: formEndTime,
              }
            : item
        )
      );
    } else {
      // Add new routine item
      const newItem: ExamRoutineItem = {
        id: `routine_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        technology: formTech,
        semesterId: formSemester,
        subjectCode: formSubjectCode.trim(),
        subjectName: formSubjectName.trim(),
        date: formDate,
        day: resolvedDay,
        startTime: formStartTime,
        endTime: formEndTime,
      };
      setRoutineItems((prev) => [...prev, newItem]);
    }

    setSubjectSheetOpen(false);
  };

  // Remove routine item
  const handleRemoveItem = (id: string) => {
    setRoutineItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Save new Exam into Firestore and select it
  const handleCreateNewExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim()) {
      alert('অনুগ্রহ করে পরীক্ষার নাম লিখুন।');
      return;
    }

    setIsSavingExam(true);
    try {
      const payload: Omit<Exam, 'id'> = {
        title: newExamTitle.trim(),
        examType: newExamType,
        examDate: newExamDate,
        departmentId: newExamDept,
        departmentName:
          newExamDept === 'ALL'
            ? 'সকল টেকনোলজি'
            : AVAILABLE_TECHNOLOGIES.find((t) => t.id === newExamDept)?.name || 'কম্পিউটার টেকনোলজি',
        semesterId: newExamSem as SemesterId,
        totalMarks: 100,
        subjects: [],
        status: 'PUBLISHED',
        allowMeritList: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const newId = await saveExam(payload);
      const createdExam: Exam = { id: newId, ...payload };
      setExams((prev) => [createdExam, ...prev]);
      setSelectedExamId(newId);
      setCreateExamSheetOpen(false);
      setNewExamTitle('');
    } catch (err) {
      console.error('Failed to save exam:', err);
      alert('পরীক্ষা সংরক্ষণ করতে ব্যর্থ হয়েছে।');
    } finally {
      setIsSavingExam(false);
    }
  };

  // Optional: Auto-load all subjects for a selected tech & semester on demand
  const handleBulkLoadTechSubjects = () => {
    if (viewTechFilter === 'ALL') {
      alert('অনুগ্রহ করে নির্দিষ্ট একটি টেকনোলজি ফিল্টার নির্বাচন করুন।');
      return;
    }
    const semester = viewSemesterFilter === 'ALL' ? '2' : viewSemesterFilter;
    const subjects = getAutoLoadedCurriculumSubjects([viewTechFilter], semester as SemesterId);
    if (subjects.length === 0) {
      alert('এই টেকনোলজির জন্য কোনো কারিকুলাম বিষয় পাওয়া যায়নি।');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const newItems: ExamRoutineItem[] = subjects.map((sub, idx) => ({
      id: `routine_bulk_${sub.subjectCode}_${idx}_${Date.now()}`,
      technology: viewTechFilter,
      semesterId: semester,
      subjectCode: sub.subjectCode,
      subjectName: sub.subjectName,
      date: today,
      day: getBanglaDayFromDate(today),
      startTime: '10:00 AM',
      endTime: '01:00 PM',
    }));

    setRoutineItems((prev) => [...prev, ...newItems]);
  };

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  // Filter routine items for view / document table
  const displayedRoutineItems = useMemo(() => {
    let list = [...routineItems];
    if (viewTechFilter !== 'ALL') {
      // Include specific technology OR entries representing ALL technologies
      list = list.filter((item) => item.technology === viewTechFilter || item.technology === 'ALL');
    }
    if (viewSemesterFilter !== 'ALL') {
      list = list.filter((item) => item.semesterId === viewSemesterFilter);
    }
    // Sort by Date, then Time, then Technology
    return list.sort((a, b) => {
      if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
      if (a.startTime !== b.startTime) return (a.startTime || '').localeCompare(b.startTime || '');
      return (a.technology || '').localeCompare(b.technology || '');
    });
  }, [routineItems, viewTechFilter, viewSemesterFilter]);

  // Options for Select Bottom Sheets
  const examOptions: SelectOption[] = exams.map((ex) => ({
    value: ex.id,
    label: ex.title,
    sublabel: `ধরন: ${ex.examType} • তারিখ: ${ex.examDate || '---'}`,
    badge: ex.examType,
    icon: Award,
  }));

  const techOptions: SelectOption[] = [
    { value: 'ALL', label: 'সকল টেকনোলজি (সমন্বিত রুটিন)', icon: Building },
    ...AVAILABLE_TECHNOLOGIES.map((t) => ({
      value: t.id,
      label: t.name,
      sublabel: `কোড: ${t.code}`,
      badge: t.code,
      icon: Building,
    })),
  ];

  // Form Tech Options including "সকল প্রযুক্তি" (ALL)
  const formTechOptions: SelectOption[] = [
    {
      value: 'ALL',
      label: 'সকল প্রযুক্তি (সকল টেকনোলজি)',
      sublabel: 'কম্পিউটার, সিভিল, ইলেকট্রিক্যাল, মেকানিক্যাল, মেরিন ও সার্ভেয়িং',
      badge: 'ALL',
      icon: Layers,
    },
    ...AVAILABLE_TECHNOLOGIES.map((t) => ({
      value: t.id,
      label: t.name,
      sublabel: `কোড: ${t.code} • কারিকুলাম সিলেবাস`,
      badge: t.code,
      icon: Building,
    })),
  ];

  const semesterOptions: SelectOption[] = [
    { value: 'ALL', label: 'সকল সেমিস্টার', icon: GraduationCap },
    ...(['1', '2', '3', '4', '5', '6', '7', '8'] as SemesterId[]).map((sem) => ({
      value: sem,
      label: SEMESTER_MAP[sem] || `${toBanglaDigits(sem)}ম পর্ব`,
      badge: `${sem}th`,
      icon: GraduationCap,
    })),
  ];

  const formSemesterOptions: SelectOption[] = (['1', '2', '3', '4', '5', '6', '7', '8'] as SemesterId[]).map((sem) => ({
    value: sem,
    label: SEMESTER_MAP[sem] || `${toBanglaDigits(sem)}ম পর্ব`,
    sublabel: `ডিপ্লোমা ইন ইঞ্জিনিয়ারিং ${SEMESTER_MAP[sem]}`,
    badge: `${sem}th Sem`,
    icon: GraduationCap,
  }));

  const examTypeOptions: SelectOption[] = EXAM_TYPES.map((t) => ({
    value: t,
    label: t,
    badge: 'পরীক্ষা',
    icon: Award,
  }));

  const newExamDeptOptions: SelectOption[] = [
    { value: 'ALL', label: 'সকল টেকনোলজি (ইনস্টিটিউট ব্যাপী)', badge: 'ALL', icon: Building },
    ...AVAILABLE_TECHNOLOGIES.map((t) => ({
      value: t.id,
      label: t.name,
      badge: t.code,
      icon: Building,
    })),
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-16 font-bengali">
      {/* Draft Restore Banner */}
      <DraftRestoreBanner
        hasDraft={Boolean(pendingDraft)}
        draftTime={pendingDraft?.updatedAt}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
        lastSavedTime={lastSavedTime}
      />

      {/* Top Banner / Controls Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-bold mb-2 border border-violet-100">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>ডিপ্লোমা ইন ইঞ্জিনিয়ারিং পরীক্ষা সূচি</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              পরীক্ষার রুটিন জেনারেটর
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              কারিকুলাম সিলেবাস অনুযায়ী পরীক্ষার তারিখ, সময়সূচি ও অফিশিয়াল A4 শিট প্রস্তুত করুন
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCreateExamSheetOpen(true)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-violet-700" />
              <span>নতুন পরীক্ষা তৈরি</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddSubjectSheet}
              className="px-5 py-2.5 bg-violet-700 hover:bg-violet-800 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-violet-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>বিষয় যুক্ত করুন</span>
            </button>
          </div>
        </div>

        {/* Global Selectors Row (Select Exam, Tech Filter, Semester Filter) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <SelectTrigger
            label="পরীক্ষা নির্বাচন"
            value={selectedExamId}
            displayValue={selectedExam?.title || 'পরীক্ষা নির্বাচন করুন'}
            placeholder="পরীক্ষা নির্বাচন করুন"
            onClick={() => setExamSheetOpen(true)}
            icon={Award}
          />

          <SelectTrigger
            label="টেকনোলজি ফিল্টার"
            value={viewTechFilter}
            displayValue={
              viewTechFilter === 'ALL'
                ? 'সকল টেকনোলজি (সমন্বিত রুটিন)'
                : AVAILABLE_TECHNOLOGIES.find((t) => t.id === viewTechFilter)?.name || viewTechFilter
            }
            placeholder="টেকনোলজি নির্বাচন"
            onClick={() => setFilterTechSheetOpen(true)}
            icon={Building}
          />

          <SelectTrigger
            label="সেমিস্টার / পর্ব ফিল্টার"
            value={viewSemesterFilter}
            displayValue={
              viewSemesterFilter === 'ALL'
                ? 'সকল সেমিস্টার'
                : SEMESTER_MAP[viewSemesterFilter as SemesterId] || `${viewSemesterFilter}ম পর্ব`
            }
            placeholder="সেমিস্টার নির্বাচন"
            onClick={() => setFilterSemSheetOpen(true)}
            icon={GraduationCap}
          />
        </div>

        {/* Routine Schedule Overview & Management List */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                নির্ধারিত পরীক্ষার বিষয় তালিকা
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-violet-100 text-violet-800 font-mono">
                মোট: {toBanglaDigits(displayedRoutineItems.length)} টি বিষয়
              </span>
            </div>

            {viewTechFilter !== 'ALL' && (
              <button
                type="button"
                onClick={handleBulkLoadTechSubjects}
                className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-violet-700" />
                <span>কারিকুলাম থেকে এই টেকনোলজির বিষয়গুলো আনুন</span>
              </button>
            )}
          </div>

          {routineItems.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50">
              <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">রুটিনে এখনো কোনো বিষয় যুক্ত করা হয়নি</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                উপরের <strong className="text-violet-700 font-bold">"বিষয় যুক্ত করুন"</strong> বাটনে ক্লিক করে নির্দিষ্ট টেকনোলজির বিষয়, তারিখ ও সময় নির্ধারণ করুন।
              </p>
              <button
                type="button"
                onClick={handleOpenAddSubjectSheet}
                className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>প্রথম বিষয় যুক্ত করুন</span>
              </button>
            </div>
          ) : displayedRoutineItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
              নির্বাচিত ফিল্টারের সাথে মিলে এমন কোনো বিষয় রুটিনে পাওয়া যায়নি।
            </div>
          ) : (
            <div className="space-y-2">
              <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <div className="col-span-3">বার ও তারিখ</div>
                <div className="col-span-3">টেকনোলজি ও পর্ব</div>
                <div className="col-span-3">বিষয় ও বিষয় কোড</div>
                <div className="col-span-2">পরীক্ষার সময়</div>
                <div className="col-span-1 text-right">অ্যাকশন</div>
              </div>

              {displayedRoutineItems.map((item) => {
                const techObj = AVAILABLE_TECHNOLOGIES.find((t) => t.id === item.technology);
                const isAllTech = item.technology === 'ALL';
                const semName = item.semesterId ? SEMESTER_MAP[item.semesterId as SemesterId] : '';

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-white border border-slate-200/80 rounded-xl hover:border-violet-300 transition-all flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:items-center shadow-2xs group"
                  >
                    {/* 1. Date & Day */}
                    <div className="sm:col-span-3 flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-violet-50 text-violet-700 shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 font-mono">
                          {toBanglaDigits(item.date || '---')}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-500">{item.day || '---'}</p>
                      </div>
                    </div>

                    {/* 2. Technology & Semester */}
                    <div className="sm:col-span-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {isAllTech ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black border border-indigo-200">
                            <Layers className="w-3 h-3" />
                            <span>সকল প্রযুক্তি</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px] font-black uppercase font-outfit border border-slate-200">
                            {techObj?.code || item.technology}
                          </span>
                        )}
                        {semName && (
                          <span className="px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-700 text-[10px] font-bold border border-violet-100">
                            {semName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 3. Subject Name & Code */}
                    <div className="sm:col-span-3 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.subjectName}</p>
                      {item.subjectCode && (
                        <p className="text-[10px] font-mono font-semibold text-slate-500">
                          কোড: {toBanglaDigits(item.subjectCode)}
                        </p>
                      )}
                    </div>

                    {/* 4. Time */}
                    <div className="sm:col-span-2">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 font-mono">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{toBanglaDigits(item.startTime)} - {toBanglaDigits(item.endTime)}</span>
                      </div>
                    </div>

                    {/* 5. Actions: Edit & Delete */}
                    <div className="sm:col-span-1 flex items-center justify-end gap-1 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleOpenEditSubjectSheet(item)}
                        className="p-1.5 text-slate-500 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                        title="এডিট করুন"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. MODERN SLIDING BOTTOM SHEET: "পরীক্ষা যোগ করুন"        */}
      {/* ========================================================= */}
      <BottomSheet
        isOpen={createExamSheetOpen}
        onClose={() => setCreateExamSheetOpen(false)}
        title="নতুন পরীক্ষা যোগ করুন"
        subtitle="পরীক্ষার শিরোনাম, ধরন ও প্রাথমিক তথ্য নির্ধারণ করুন"
      >
        <form onSubmit={handleCreateNewExam} className="space-y-4 pb-4 font-bengali">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              পরীক্ষার নাম / শিরোনাম <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newExamTitle}
              onChange={(e) => setNewExamTitle(e.target.value)}
              placeholder="পরীক্ষার নাম বা শিরোনাম লিখুন"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:bg-white focus:border-violet-600 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectTrigger
              label="পরীক্ষার ধরন"
              value={newExamType}
              displayValue={newExamType}
              placeholder="পরীক্ষার ধরন"
              onClick={() => setNewExamTypeSheetOpen(true)}
              icon={Award}
            />

            <div>
              <ModernDateTrigger
                id="routine-new-exam-date"
                label="শুরুর তারিখ"
                required
                value={newExamDate}
                onClick={() => setNewExamDatePickerOpen(true)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectTrigger
              label="টেকনোলজি পরিসর"
              value={newExamDept}
              displayValue={
                newExamDept === 'ALL'
                  ? 'সকল টেকনোলজি (ইনস্টিটিউট ব্যাপী)'
                  : AVAILABLE_TECHNOLOGIES.find((t) => t.id === newExamDept)?.name || newExamDept
              }
              placeholder="টেকনোলজি পরিসর"
              onClick={() => setNewExamDeptSheetOpen(true)}
              icon={Building}
            />

            <SelectTrigger
              label="ডিফল্ট পর্ব / সেমিস্টার"
              value={newExamSem}
              displayValue={SEMESTER_MAP[newExamSem as SemesterId] || `${newExamSem}ম পর্ব`}
              placeholder="সেমিস্টার নির্বাচন করুন"
              onClick={() => setNewExamSemSheetOpen(true)}
              icon={GraduationCap}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateExamSheetOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSavingExam}
              className="px-5 py-2 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSavingExam ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ ও নির্বাচন করুন'}</span>
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* ========================================================================= */}
      {/* 2. MODERN SLIDING BOTTOM SHEET: "বিষয় যুক্ত / সম্পাদনা করুন"              */}
      {/* ========================================================================= */}
      <BottomSheet
        isOpen={subjectSheetOpen}
        onClose={() => setSubjectSheetOpen(false)}
        title={editingItemId ? 'পরীক্ষার বিষয় সম্পাদনা' : 'পরীক্ষার রুটিনে বিষয় যুক্ত করুন'}
        subtitle="টেকনোলজি অনুযায়ী বিষয় সিলেক্ট করুন এবং আধুনিক পদ্ধতিতে তারিখ ও সময়সূচি নির্ধারণ করুন"
        maxHeight="max-h-[92vh]"
      >
        <form onSubmit={handleSaveSubjectEntry} className="space-y-4 pb-6 font-bengali">
          {/* 1. Technology & Semester Selectors (Modern SelectTriggers with SVG icons) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <SelectTrigger
              label="টেকনোলজি নির্বাচন"
              value={formTech}
              displayValue={
                formTech === 'ALL'
                  ? 'সকল প্রযুক্তি (সকল টেকনোলজি)'
                  : AVAILABLE_TECHNOLOGIES.find((t) => t.id === formTech)?.name || formTech
              }
              placeholder="টেকনোলজি নির্বাচন করুন"
              onClick={() => setFormTechSheetOpen(true)}
              icon={formTech === 'ALL' ? Layers : Building}
            />

            <SelectTrigger
              label="সেমিস্টার / পর্ব"
              value={formSemester}
              displayValue={SEMESTER_MAP[formSemester as SemesterId] || `${formSemester}ম পর্ব`}
              placeholder="সেমিস্টার নির্বাচন করুন"
              onClick={() => setFormSemSheetOpen(true)}
              icon={GraduationCap}
            />
          </div>

          {/* 2. Authentic Curriculum Subjects List (Dynamic for chosen Tech & Semester) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                কারিকুলাম থেকে বিষয় নির্বাচন করুন:
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">
                {formTech === 'ALL' ? 'সকল টেকনোলজির সমন্বিত সিলেবাস' : 'পলিটেকনিক কারিকুলাম ডেটাবেস'}
              </span>
            </div>

            {/* Subject search bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="বিষয়ের নাম বা কোড দিয়ে খুঁজুন..."
                value={subjectSearchQuery}
                onChange={(e) => setSubjectSearchQuery(e.target.value)}
                className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-violet-600 outline-none transition-all"
              />
            </div>

            {/* List of Curriculum Subjects */}
            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-1 bg-slate-50/50 space-y-1">
              {filteredCurriculumSubjects.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400 font-medium">
                  কোনো কারিকুলাম বিষয় পাওয়া যায়নি
                </div>
              ) : (
                filteredCurriculumSubjects.map((sub, idx) => {
                  const isSelected = formSubjectCode === sub.subjectCode;
                  const itemKey = sub.subjectCode || sub.code || `curr_sub_${idx}`;
                  return (
                    <button
                      key={itemKey}
                      type="button"
                      onClick={() => handleSelectCurriculumSubject(sub)}
                      className={`w-full px-3 py-1.5 rounded-lg text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-violet-700 text-white font-bold shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`font-mono text-[11px] ${isSelected ? 'text-violet-200' : 'text-slate-500'}`}>
                          {sub.subjectCode}
                        </span>
                        <span className="truncate">{sub.subjectName}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* 3. Subject Name & Code Inputs (Can be fine-tuned or manually entered) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                বিষয়ের নাম <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formSubjectName}
                onChange={(e) => setFormSubjectName(e.target.value)}
                placeholder="সিলেক্ট করুন বা লিখুন"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-violet-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">বিষয় কোড</label>
              <input
                type="text"
                value={formSubjectCode}
                onChange={(e) => setFormSubjectCode(e.target.value)}
                placeholder="বিষয় কোড লিখুন"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:bg-white focus:border-violet-600 outline-none"
              />
            </div>
          </div>

          {/* 4. Modern Date Selection Trigger & Automatic Read-Only Day UI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectTrigger
              label="পরীক্ষার তারিখ"
              value={formDate}
              displayValue={formatBanglaDateDisplay(formDate)}
              placeholder="তারিখ নির্বাচন করুন"
              onClick={() => setFormDateSheetOpen(true)}
              icon={CalendarDays}
            />

            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-50 text-violet-700 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    সপ্তাহের বার
                  </label>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    {formDay || (formDate ? getBanglaDayFromDate(formDate) : 'তারিখ নির্বাচন করুন')}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-100 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>স্বয়ংক্রিয় নির্ধারিত</span>
              </span>
            </div>
          </div>

          {/* 5. Modern Time Selection Sliding Trigger */}
          <SelectTrigger
            label="পরীক্ষার সময়সূচি ও শিফট"
            value={`${formStartTime} - ${formEndTime}`}
            displayValue={`${toBanglaDigits(formStartTime)} - ${toBanglaDigits(formEndTime)}`}
            placeholder="সময়সূচি নির্বাচন করুন"
            onClick={() => setFormTimeSheetOpen(true)}
            icon={Clock}
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSubjectSheetOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingItemId ? 'আপডেট করুন' : 'রুটিনে যুক্ত করুন'}</span>
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Modern Date Selection Sliding Bottom Sheet */}
      <DateSelectionBottomSheet
        isOpen={formDateSheetOpen}
        onClose={() => setFormDateSheetOpen(false)}
        selectedDate={formDate}
        onSelectDate={(dateStr, dayBangla) => {
          setFormDate(dateStr);
          setFormDay(dayBangla);
        }}
      />

      {/* Modern Time Selection Sliding Bottom Sheet */}
      <TimeSelectionBottomSheet
        isOpen={formTimeSheetOpen}
        onClose={() => setFormTimeSheetOpen(false)}
        startTime={formStartTime}
        endTime={formEndTime}
        onSelectTime={(start, end) => {
          setFormStartTime(start);
          setFormEndTime(end);
        }}
      />

      {/* Select Bottom Sheets for Quick Filtering */}
      <SelectBottomSheet
        isOpen={examSheetOpen}
        onClose={() => setExamSheetOpen(false)}
        title="পরীক্ষা নির্বাচন করুন"
        subtitle="রুটিনের জন্য পরীক্ষা সিলেক্ট করুন"
        options={examOptions}
        selectedValue={selectedExamId}
        onSelect={(val) => setSelectedExamId(val)}
      />

      <SelectBottomSheet
        isOpen={filterTechSheetOpen}
        onClose={() => setFilterTechSheetOpen(false)}
        title="টেকনোলজি ফিল্টার"
        subtitle="নির্দিষ্ট টেকনোলজির রুটিন দেখতে সিলেক্ট করুন"
        options={techOptions}
        selectedValue={viewTechFilter}
        onSelect={(val) => setViewTechFilter(val)}
      />

      <SelectBottomSheet
        isOpen={filterSemSheetOpen}
        onClose={() => setFilterSemSheetOpen(false)}
        title="সেমিস্টার ফিল্টার"
        subtitle="নির্দিষ্ট সেমিস্টার পর্ব দেখতে সিলেক্ট করুন"
        options={semesterOptions}
        selectedValue={viewSemesterFilter}
        onSelect={(val) => setViewSemesterFilter(val)}
      />

      {/* Select Bottom Sheets for Add/Edit Subject Modal */}
      <SelectBottomSheet
        isOpen={formTechSheetOpen}
        onClose={() => setFormTechSheetOpen(false)}
        title="টেকনোলজি নির্বাচন করুন"
        subtitle="পরীক্ষার বিষয়ের জন্য টেকনোলজি বা 'সকল প্রযুক্তি' সিলেক্ট করুন"
        options={formTechOptions}
        selectedValue={formTech}
        onSelect={(val) => {
          setFormTech(val);
          setFormSubjectCode('');
          setFormSubjectName('');
        }}
      />

      <SelectBottomSheet
        isOpen={formSemSheetOpen}
        onClose={() => setFormSemSheetOpen(false)}
        title="সেমিস্টার / পর্ব নির্বাচন করুন"
        subtitle="কারিকুলাম বিষয় দেখতে সেমিস্টার পর্ব সিলেক্ট করুন"
        options={formSemesterOptions}
        selectedValue={formSemester}
        onSelect={(val) => {
          setFormSemester(val);
          setFormSubjectCode('');
          setFormSubjectName('');
        }}
      />

      {/* Select Bottom Sheets for Create Exam Modal */}
      <SelectBottomSheet
        isOpen={newExamTypeSheetOpen}
        onClose={() => setNewExamTypeSheetOpen(false)}
        title="পরীক্ষার ধরন নির্বাচন করুন"
        subtitle="মডেল টেস্ট, সমাপনী বা অন্যান্য ধরন সিলেক্ট করুন"
        options={examTypeOptions}
        selectedValue={newExamType}
        onSelect={(val) => setNewExamType(val)}
      />

      <SelectBottomSheet
        isOpen={newExamDeptSheetOpen}
        onClose={() => setNewExamDeptSheetOpen(false)}
        title="টেকনোলজি পরিসর নির্বাচন করুন"
        subtitle="সকল টেকনোলজি অথবা নির্দিষ্ট বিভাগ সিলেক্ট করুন"
        options={newExamDeptOptions}
        selectedValue={newExamDept}
        onSelect={(val) => setNewExamDept(val)}
      />

      <SelectBottomSheet
        isOpen={newExamSemSheetOpen}
        onClose={() => setNewExamSemSheetOpen(false)}
        title="সেমিস্টার নির্বাচন করুন"
        subtitle="পরীক্ষার ডিফল্ট পর্ব নির্ধারণ করুন"
        options={formSemesterOptions}
        selectedValue={newExamSem}
        onSelect={(val) => setNewExamSem(val)}
      />

      {/* Modern Date Picker Modal for Create Exam */}
      <ModernDatePicker
        isOpen={newExamDatePickerOpen}
        onClose={() => setNewExamDatePickerOpen(false)}
        value={newExamDate}
        onChange={(newDate) => setNewExamDate(newDate)}
        title="পরীক্ষা শুরুর তারিখ নির্বাচন"
        subtitle="পরীক্ষার শুরুর তারিখ নির্ধারণ করুন"
        minYear={2020}
        maxYear={2035}
      />

      {/* ========================================================= */}
      {/* 3. A4 OFFICIAL EXAMINATION ROUTINE DOCUMENT ENGINE        */}
      {/* ========================================================= */}
      {displayedRoutineItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700 text-sm">পরীক্ষার অফিশিয়াল রুটিন প্রিভিউ</p>
          <p className="text-xs text-slate-400 mt-1">
            উপরে বিষয় যুক্ত করলে এখানে প্রিন্ট উপযোগী অফিশিয়াল A4 পরীক্ষার রুটিন প্রদর্শিত হবে।
          </p>
        </div>
      ) : (
        <A4DocumentEngine
          hideDefaultHeader={true}
          showSignatures={false}
          fileName={`exam-routine-${selectedExam?.title || 'dpib'}-${viewTechFilter}`}
        >
          {/* Official DPIB Exam Routine Sheet Container */}
          <div className="font-bengali text-black text-center px-4 py-2 select-text">
            {/* Header */}
            <p className="m-0 text-sm font-semibold text-black">
              দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট, ভোলা।
            </p>
            <h1 className="text-xl font-bold my-1 border-b-[1.5px] border-black inline-block pb-0.5">
              ডিপ্লোমা ইন-ইঞ্জিনিয়ারিং
            </h1>
            {selectedExam && (
              <p className="mt-2 mb-0.5 text-base font-bold text-black">
                {selectedExam.title}
              </p>
            )}
            <p className="mb-4 text-xs font-semibold text-slate-800">
              {viewTechFilter === 'ALL'
                ? 'সকল টেকনোলজি (সমন্বিত পরীক্ষার সময়সূচি)'
                : `টেকনোলজিঃ ${AVAILABLE_TECHNOLOGIES.find((t) => t.id === viewTechFilter)?.name || viewTechFilter}`}
              {viewSemesterFilter !== 'ALL' && ` • ${SEMESTER_MAP[viewSemesterFilter as SemesterId] || `${viewSemesterFilter}ম পর্ব`}`}
            </p>

            {/* Table: Official Examination Schedule */}
            <table className="w-full border-collapse border-[1.2px] border-black text-center mb-6">
              <thead>
                <tr className="bg-slate-50 text-black font-bold">
                  <th className="border border-black p-2 text-xs w-[20%] font-bold">
                    বার / তারিখ
                  </th>
                  <th className="border border-black p-2 text-xs w-[22%] font-bold">
                    টেকনোলজি ও পর্ব
                  </th>
                  <th className="border border-black p-2 text-xs w-[40%] font-bold">
                    বিষয় ও বিষয় কোড
                  </th>
                  <th className="border border-black p-2 text-xs w-[18%] font-bold">
                    সময়
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedRoutineItems.map((item) => {
                  const techObj = AVAILABLE_TECHNOLOGIES.find((t) => t.id === item.technology);
                  const isAll = item.technology === 'ALL';
                  const semBangla = item.semesterId ? SEMESTER_MAP[item.semesterId as SemesterId] : '';

                  return (
                    <tr key={item.id} className="border border-black">
                      {/* Date & Day */}
                      <td className="border border-black p-2 text-xs font-medium leading-tight">
                        <span className="block font-mono font-bold">{toBanglaDigits(item.date)}</span>
                        <span className="block text-slate-800 font-semibold text-[11px] mt-0.5">{item.day}</span>
                      </td>

                      {/* Technology & Semester */}
                      <td className="border border-black p-2 text-xs font-semibold leading-tight">
                        <span className="block font-bold text-black">
                          {isAll ? 'সকল টেকনোলজি' : (techObj?.name || item.technology)}
                        </span>
                        {semBangla && (
                          <span className="block text-[11px] text-slate-700 mt-0.5">({semBangla})</span>
                        )}
                      </td>

                      {/* Subject Name & Code */}
                      <td className="border border-black p-0 align-middle text-left">
                        <div className="p-2 text-xs font-semibold text-black leading-snug">
                          <span className="font-bold">{item.subjectName}</span>
                          {item.subjectCode && (
                            <span className="block text-[11px] font-mono text-slate-700 mt-0.5">
                              (বিষয় কোড: {toBanglaDigits(item.subjectCode)})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Time */}
                      <td className="border border-black p-2 text-xs font-semibold leading-tight">
                        <span className="block font-mono text-[11px]">{toBanglaDigits(item.startTime)}</span>
                        <span className="block text-[10px] text-slate-500">হতে</span>
                        <span className="block font-mono text-[11px]">{toBanglaDigits(item.endTime)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Signatures */}
            <div className="mt-14 flex justify-between px-8 text-sm font-bold text-black">
              <div className="text-center w-36 border-t border-black pt-1">
                <p>প্রস্তুতকারক</p>
              </div>
              <div className="text-center w-36 border-t border-black pt-1">
                <p>পরীক্ষা নিয়ন্ত্রক</p>
              </div>
              <div className="text-center w-36 border-t border-black pt-1">
                <p>অধ্যক্ষ</p>
              </div>
            </div>
          </div>
        </A4DocumentEngine>
      )}
    </div>
  );
};
