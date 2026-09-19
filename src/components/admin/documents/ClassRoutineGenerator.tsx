import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  BookOpen,
  Users,
  Clock,
  Plus,
  Trash2,
  Building,
  GraduationCap,
  Edit3,
  X,
  Check,
  UserCheck,
  Sun,
  Sunset,
  SlidersHorizontal,
  FileText,
  Sparkles,
  Info,
  Layers,
} from 'lucide-react';
import { A4DocumentEngine } from './A4DocumentEngine';
import { SemesterId, Teacher, ShiftConfig } from '../../../types';
import { getTeachers, getShiftConfigs, DEFAULT_SHIFTS } from '../../../services/db';
import { getAutoLoadedCurriculumSubjects } from '../../../data/masterCurriculum';
import { toBanglaDigits, SEMESTER_MAP } from '../../../utils/bangla';
import { SelectBottomSheet, SelectTrigger, SelectOption } from '../../common/SelectBottomSheet';
import { BottomSheet } from '../../common/BottomSheet';
import { saveDraft, getDraft, clearDraft, DraftRecord } from '../../../utils/draftStorage';
import { DraftRestoreBanner } from '../../common/DraftRestoreBanner';

const AVAILABLE_TECHNOLOGIES = [
  { id: 'ALL', name: 'সকল প্রযুক্তি (সকল টেকনোলজি)', code: 'ALL' },
  { id: 'COMPUTER', name: 'কম্পিউটার টেকনোলজি', code: 'CMT' },
  { id: 'CIVIL', name: 'সিভিল টেকনোলজি', code: 'CT' },
  { id: 'ELECTRICAL', name: 'ইলেকট্রিক্যাল টেকনোলজি', code: 'ET' },
  { id: 'MECHANICAL', name: 'মেকানিক্যাল টেকনোলজি', code: 'MT' },
  { id: 'MARINE', name: 'মেরিন টেকনোলজি', code: 'MT' },
  { id: 'SURVEYING', name: 'সার্ভেয়িং টেকনোলজি', code: 'ST' },
];

// Standardized DPIB Shifts (No hardcoded timings attached)
const SHIFT_OPTIONS = [
  { id: 'সকাল শিফট', name: 'সকাল শিফট', sublabel: 'মর্নিং শিফট', icon: Sun },
  { id: 'দুপুর শিফট', name: 'দুপুর শিফট', sublabel: 'আফটারনুন / ডে শিফট', icon: Sunset },
];

export interface PeriodTimingConfig {
  period: number;
  time: string;
}

const DEFAULT_PERIOD_TIMES: PeriodTimingConfig[] = [
  { period: 1, time: '09:00 AM - 09:45 AM' },
  { period: 2, time: '09:45 AM - 10:30 AM' },
  { period: 3, time: '10:30 AM - 11:15 AM' },
];

const DAYS = [
  { key: 'Saturday', bangla: 'শনিবার' },
  { key: 'Sunday', bangla: 'রবিবার' },
  { key: 'Monday', bangla: 'সোমবার' },
  { key: 'Tuesday', bangla: 'মঙ্গলবার' },
  { key: 'Wednesday', bangla: 'বুধবার' },
  { key: 'Thursday', bangla: 'বৃহস্পতিবার' },
];

export interface RoutineSlotData {
  code: string;
  name: string;
  teacher: string;
  room: string;
  customTime?: string;
}

export const ClassRoutineGenerator: React.FC = () => {
  // Selection states
  const [selectedTech, setSelectedTech] = useState<string>('COMPUTER');
  const [selectedSemester, setSelectedSemester] = useState<string>('1');
  const [academicYear, setAcademicYear] = useState<string>('২০২৫-২০২৬');
  const [shift, setShift] = useState<string>('সকাল শিফট');
  
  // Dynamic Period Timings (Independently customizable by admin/teacher)
  const [periodTimes, setPeriodTimes] = useState<PeriodTimingConfig[]>(DEFAULT_PERIOD_TIMES);

  // Timetable State: dayKey -> periodNumber -> RoutineSlotData
  const [timetable, setTimetable] = useState<Record<string, Record<number, RoutineSlotData>>>({});
  const [teachersList, setTeachersList] = useState<Teacher[]>([]);

  // Draft state
  const [pendingDraft, setPendingDraft] = useState<DraftRecord<any> | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const isInitialMount = useRef(true);

  // Check for existing draft on load
  useEffect(() => {
    async function checkDraft() {
      try {
        const draft = await getDraft<any>('class_routine');
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
        selectedTech,
        selectedSemester,
        academicYear,
        shift,
        periodTimes,
        timetable,
      };
      await saveDraft('class_routine', draftData);
      setLastSavedTime(Date.now());
    }, 800);

    return () => clearTimeout(timer);
  }, [selectedTech, selectedSemester, academicYear, shift, periodTimes, timetable]);

  const handleRestoreDraft = () => {
    if (!pendingDraft?.data) return;
    const d = pendingDraft.data;
    if (d.selectedTech) setSelectedTech(d.selectedTech);
    if (d.selectedSemester) setSelectedSemester(d.selectedSemester);
    if (d.academicYear) setAcademicYear(d.academicYear);
    if (d.shift) setShift(d.shift);
    if (Array.isArray(d.periodTimes)) setPeriodTimes(d.periodTimes);
    if (d.timetable) setTimetable(d.timetable);

    setPendingDraft(null);
    setLastSavedTime(pendingDraft.updatedAt);
  };

  const handleDiscardDraft = async () => {
    await clearDraft('class_routine');
    setPendingDraft(null);
    setLastSavedTime(null);
  };

  // Slot Edit Sheet state (MODERN SLIDING BOTTOM SHEET)
  const [editingSlot, setEditingSlot] = useState<{ dayKey: string; period: number; dayBangla: string } | null>(null);
  const [slotCode, setSlotCode] = useState('');
  const [slotName, setSlotName] = useState('');
  const [slotTeacher, setSlotTeacher] = useState('');
  const [slotRoom, setSlotRoom] = useState('');
  const [slotCustomTime, setSlotCustomTime] = useState('');

  // Period Timing Configuration Sheet State
  const [timingSheetOpen, setTimingSheetOpen] = useState(false);
  const [tempPeriodTimes, setTempPeriodTimes] = useState<PeriodTimingConfig[]>(DEFAULT_PERIOD_TIMES);

  // Bottom sheets
  const [techSheetOpen, setTechSheetOpen] = useState(false);
  const [semesterSheetOpen, setSemesterSheetOpen] = useState(false);
  const [shiftSheetOpen, setShiftSheetOpen] = useState(false);
  const [subjectSheetOpen, setSubjectSheetOpen] = useState(false);
  const [teacherSheetOpen, setTeacherSheetOpen] = useState(false);

  const [shiftsList, setShiftsList] = useState<ShiftConfig[]>(DEFAULT_SHIFTS);

  // Fetch real teachers and dynamic shifts from Firestore only
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [teachers, loadedShifts] = await Promise.all([
          getTeachers(),
          getShiftConfigs(),
        ]);
        setTeachersList(teachers);
        if (loadedShifts && loadedShifts.length > 0) {
          setShiftsList(loadedShifts);
          setShift(loadedShifts[0].name);
        }
      } catch (err) {
        console.error('Failed to load teachers or shifts for routine:', err);
      }
    }
    loadInitialData();
  }, []);

  // Auto loaded curriculum subjects based on Tech + Sem
  const autoSubjects = (selectedTech && selectedSemester)
    ? getAutoLoadedCurriculumSubjects([selectedTech], selectedSemester as SemesterId)
    : [];

  // Initialize timetable when tech & semester are chosen or period count increases
  useEffect(() => {
    if (!selectedTech || !selectedSemester) {
      setTimetable({});
      return;
    }

    setTimetable((prev) => {
      const initial: Record<string, Record<number, RoutineSlotData>> = { ...prev };

      DAYS.forEach((day) => {
        if (!initial[day.key]) initial[day.key] = {};
        periodTimes.forEach((p) => {
          if (!initial[day.key][p.period]) {
            initial[day.key][p.period] = {
              code: '',
              name: '',
              teacher: '',
              room: '',
              customTime: '',
            };
          }
        });
      });

      return initial;
    });
  }, [selectedTech, selectedSemester, periodTimes.length]);

  // Add Period Function (No maximum limit)
  const handleAddPeriod = () => {
    const nextNum = periodTimes.length + 1;
    let defaultTime = '11:15 AM - 12:00 PM';
    if (nextNum === 4) defaultTime = '11:15 AM - 12:00 PM';
    else if (nextNum === 5) defaultTime = '12:00 PM - 12:45 PM';
    else if (nextNum === 6) defaultTime = '01:15 PM - 02:00 PM';
    else if (nextNum === 7) defaultTime = '02:00 PM - 02:45 PM';
    else if (nextNum === 8) defaultTime = '02:45 PM - 03:30 PM';
    else {
      defaultTime = `পিরিয়ড ${toBanglaDigits(nextNum)} সময়`;
    }

    const newPeriod: PeriodTimingConfig = { period: nextNum, time: defaultTime };
    setPeriodTimes((prev) => [...prev, newPeriod]);
  };

  // Remove Period Function
  const handleRemovePeriod = (periodNumToRemove?: number) => {
    if (periodTimes.length <= 1) return;
    const targetPeriod = periodNumToRemove ?? periodTimes[periodTimes.length - 1].period;
    setPeriodTimes((prev) => {
      const filtered = prev.filter((p) => p.period !== targetPeriod);
      return filtered.map((p, idx) => ({ ...p, period: idx + 1 }));
    });
  };

  // Add Period inside Timing Sheet (temp list)
  const handleAddTempPeriod = () => {
    const nextNum = tempPeriodTimes.length + 1;
    let defaultTime = '11:15 AM - 12:00 PM';
    if (nextNum === 4) defaultTime = '11:15 AM - 12:00 PM';
    else if (nextNum === 5) defaultTime = '12:00 PM - 12:45 PM';
    else if (nextNum === 6) defaultTime = '01:15 PM - 02:00 PM';
    else if (nextNum === 7) defaultTime = '02:00 PM - 02:45 PM';
    else if (nextNum === 8) defaultTime = '02:45 PM - 03:30 PM';
    else {
      defaultTime = `পিরিয়ড ${toBanglaDigits(nextNum)} সময়`;
    }

    setTempPeriodTimes((prev) => [...prev, { period: nextNum, time: defaultTime }]);
  };

  // Remove Period inside Timing Sheet (temp list)
  const handleRemoveTempPeriod = (idxToRemove: number) => {
    if (tempPeriodTimes.length <= 1) return;
    setTempPeriodTimes((prev) => {
      const filtered = prev.filter((_, idx) => idx !== idxToRemove);
      return filtered.map((p, idx) => ({ ...p, period: idx + 1 }));
    });
  };

  // Auto-populate curriculum subjects on demand
  const handleAutoPopulateCurriculum = () => {
    if (!selectedTech || !selectedSemester || autoSubjects.length === 0) return;
    const initial: Record<string, Record<number, RoutineSlotData>> = {};
    let subIndex = 0;
    DAYS.forEach((day, dIdx) => {
      initial[day.key] = {};
      periodTimes.forEach((p, pIdx) => {
        const sub = autoSubjects[(subIndex + pIdx + dIdx) % autoSubjects.length];
        initial[day.key][p.period] = {
          code: sub ? sub.subjectCode : '',
          name: sub ? sub.subjectName : '',
          teacher: '',
          room: pIdx >= 4 ? 'ল্যাব-১' : '৩০১',
          customTime: '',
        };
      });
      subIndex++;
    });
    setTimetable(initial);
  };

  const handleOpenSlotEdit = (dayKey: string, period: number, dayBangla: string) => {
    const current = timetable[dayKey]?.[period] || { code: '', name: '', teacher: '', room: '', customTime: '' };
    const defaultPeriodTime = periodTimes.find((p) => p.period === period)?.time || '';
    
    setSlotCode(current.code || '');
    setSlotName(current.name || '');
    setSlotTeacher(current.teacher || '');
    setSlotRoom(current.room || '');
    setSlotCustomTime(current.customTime || defaultPeriodTime);
    setEditingSlot({ dayKey, period, dayBangla });
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;

    setTimetable((prev) => ({
      ...prev,
      [editingSlot.dayKey]: {
        ...(prev[editingSlot.dayKey] || {}),
        [editingSlot.period]: {
          code: slotCode.trim(),
          name: slotName.trim(),
          teacher: slotTeacher.trim(),
          room: slotRoom.trim(),
          customTime: slotCustomTime.trim(),
        },
      },
    }));
    setEditingSlot(null);
  };

  const handleClearSlot = () => {
    if (!editingSlot) return;
    setTimetable((prev) => ({
      ...prev,
      [editingSlot.dayKey]: {
        ...(prev[editingSlot.dayKey] || {}),
        [editingSlot.period]: { code: '', name: '', teacher: '', room: '', customTime: '' },
      },
    }));
    setEditingSlot(null);
  };

  // Open Period Timing Customizer
  const handleOpenTimingSheet = () => {
    setTempPeriodTimes([...periodTimes]);
    setTimingSheetOpen(true);
  };

  const handleSaveTimingSheet = (e: React.FormEvent) => {
    e.preventDefault();
    setPeriodTimes(tempPeriodTimes);
    setTimingSheetOpen(false);
  };

  const selectedTechObj = AVAILABLE_TECHNOLOGIES.find((t) => t.id === selectedTech);
  const semesterBangla = selectedSemester ? (SEMESTER_MAP[selectedSemester as SemesterId] || `${toBanglaDigits(selectedSemester)}ম পর্ব`) : '';

  // Options for Main selectors
  const techOptions: SelectOption[] = AVAILABLE_TECHNOLOGIES.map((t) => ({
    value: t.id,
    label: t.name,
    badge: t.code,
    icon: Building,
  }));

  const semesterOptions: SelectOption[] = (['1', '2', '3', '4', '5', '6', '7', '8'] as SemesterId[]).map((sem) => ({
    value: sem,
    label: SEMESTER_MAP[sem] || `${toBanglaDigits(sem)}ম পর্ব`,
    badge: `${sem}th`,
    icon: GraduationCap,
  }));

  const shiftOptions: SelectOption[] = shiftsList.map((s) => ({
    value: s.name,
    label: s.name,
    sublabel: `সময়: ${s.startTime} - ${s.endTime}`,
    badge: s.badge || s.startTime,
    icon: s.name.includes('বিকাল') || s.name.includes('২য়') ? Sunset : Sun,
  }));

  // Options for Slot Edit
  const subjectOptions: SelectOption[] = autoSubjects.map((s) => ({
    value: s.subjectCode,
    label: `${s.subjectCode} - ${s.subjectName}`,
    sublabel: `পূর্ণমান: ${s.curriculumFullMarks || 100}`,
    icon: BookOpen,
  }));

  const teacherOptions: SelectOption[] = teachersList.map((t) => {
    const isNonTech = Boolean(t.isNonTech || t.departmentId === 'NON_TECH' || t.category === 'NON_TECH');
    const isAllTech = Boolean(t.departmentId === 'ALL_TECH' || t.category === 'ALL_TECH');
    const badgeText = isNonTech
      ? 'NON-TECH'
      : isAllTech
      ? 'ALL TECH'
      : String(t.departmentId || 'TECH').toUpperCase();

    return {
      value: t.name,
      label: t.name,
      sublabel: `${t.designation || 'শিক্ষক'} • ${t.departmentName || t.departmentId || ''}`,
      badge: badgeText,
      icon: isNonTech ? BookOpen : isAllTech ? Layers : UserCheck,
    };
  });

  return (
    <div className="space-y-6 font-bengali">
      {/* Draft Restore Banner */}
      <DraftRestoreBanner
        hasDraft={Boolean(pendingDraft)}
        draftTime={pendingDraft?.updatedAt}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
        lastSavedTime={lastSavedTime}
      />

      {/* ========================================================================= */}
      {/* 1. TOP CONTROL & METADATA BAR                                             */}
      {/* ========================================================================= */}
      <div className="no-print bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                ক্লাস রুটিন জেনারেটর (Class Routine Generator)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                শিফট, টেকনোলজি ও সেমিস্টার নির্বাচন করে স্বাধীন সময়সূচিতে প্রফেশনাল ক্লাস রুটিন তৈরি করুন
              </p>
            </div>
          </div>

          {/* Quick Period Timings Config Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddPeriod}
              className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-900 rounded-xl text-xs font-bold transition-all border border-teal-200 flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4 text-teal-700" />
              <span>পিরিয়ড বাড়ান</span>
            </button>
            <button
              type="button"
              onClick={handleOpenTimingSheet}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4 text-teal-700" />
              <span>পিরিয়ডের সময়সূচি কাস্টমাইজ</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <SelectTrigger
            label="শিফট নির্বাচন"
            value={shift}
            displayValue={shift}
            placeholder="শিফট সিলেক্ট করুন"
            onClick={() => setShiftSheetOpen(true)}
            icon={shift === 'সকাল শিফট' ? Sun : Sunset}
          />

          <SelectTrigger
            label="টেকনোলজি নির্বাচন"
            value={selectedTech}
            displayValue={selectedTechObj ? selectedTechObj.name : ''}
            placeholder="টেকনোলজি নির্বাচন করুন"
            onClick={() => setTechSheetOpen(true)}
            icon={Building}
          />

          <SelectTrigger
            label="সেমিস্টার নির্বাচন"
            value={selectedSemester}
            displayValue={selectedSemester ? SEMESTER_MAP[selectedSemester as SemesterId] : ''}
            placeholder="সেমিস্টার নির্বাচন করুন"
            onClick={() => setSemesterSheetOpen(true)}
            icon={GraduationCap}
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">শিক্ষাবর্ষ / সেশন</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="শিক্ষাবর্ষ বা সেশন লিখুন"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200/90 rounded-2xl font-semibold focus:bg-white focus:border-teal-600 focus:outline-hidden transition-all font-mono"
            />
          </div>
        </div>

        {/* Action bar for curriculum auto-load and multi-teacher note */}
        {selectedTech && selectedSemester && (
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <Info className="w-4 h-4 text-teal-700 shrink-0" />
              <span>
                * একই সময়ে একাধিক শিক্ষক ও একাধিক টেকনোলজির ক্লাস সমান্তরালে স্বাধীনভাবে নেওয়া যাবে।
              </span>
            </div>

            {autoSubjects.length > 0 && (
              <button
                type="button"
                onClick={handleAutoPopulateCurriculum}
                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5 text-teal-700" />
                <span>কারিকুলাম বিষয়সমূহ অটো-লোড করুন</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. MODERN SLIDING BOTTOM SHEETS FOR SELECTIONS                             */}
      {/* ========================================================================= */}
      <SelectBottomSheet
        isOpen={shiftSheetOpen}
        onClose={() => setShiftSheetOpen(false)}
        title="শিফট নির্বাচন"
        subtitle="ক্লাস রুটিনের জন্য নির্দিষ্ট শিফট নির্বাচন করুন"
        options={shiftOptions}
        selectedValue={shift}
        onSelect={(val) => setShift(val)}
      />

      <SelectBottomSheet
        isOpen={techSheetOpen}
        onClose={() => setTechSheetOpen(false)}
        title="টেকনোলজি নির্বাচন"
        subtitle="ক্লাস রুটিনের জন্য বিভাগ সিলেক্ট করুন"
        options={techOptions}
        selectedValue={selectedTech}
        onSelect={(val) => setSelectedTech(val)}
      />

      <SelectBottomSheet
        isOpen={semesterSheetOpen}
        onClose={() => setSemesterSheetOpen(false)}
        title="সেমিস্টার নির্বাচন"
        subtitle="ক্লাস রুটিনের জন্য পর্ব সিলেক্ট করুন"
        options={semesterOptions}
        selectedValue={selectedSemester}
        onSelect={(val) => setSelectedSemester(val)}
      />

      {/* ========================================================================= */}
      {/* 3. PERIOD TIMINGS CONFIGURATION BOTTOM SHEET                              */}
      {/* ========================================================================= */}
      <BottomSheet
        isOpen={timingSheetOpen}
        onClose={() => setTimingSheetOpen(false)}
        title="পিরিয়ড ও সময়সূচি কাস্টমাইজেশন"
        subtitle="শিফট নির্বিশেষে প্রতিটি পিরিয়ডের জন্য নিজের ইচ্ছামতো সময়সূচি সেট করুন"
        maxHeight="max-h-[92vh]"
      >
        <form onSubmit={handleSaveTimingSheet} className="space-y-4 pb-6 font-bengali">
          <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-2xl flex items-center gap-2.5 text-xs text-teal-950 font-medium">
            <Clock className="w-4 h-4 text-teal-700 shrink-0" />
            <span>
              এখানে প্রতিটি পিরিয়ডের সময় আপনার প্রতিষ্ঠানের বর্তমান ক্লাসের নিয়ম অনুযায়ী পরিবর্তন করতে পারেন।
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
            {tempPeriodTimes.map((pt, idx) => (
              <div
                key={pt.period}
                className="p-3 bg-white border border-slate-200 rounded-2xl space-y-1.5 shadow-2xs relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    <span>পিরিয়ড {toBanglaDigits(pt.period)}:</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-mono">
                      #{pt.period}
                    </span>
                    {tempPeriodTimes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTempPeriod(idx)}
                        title="এই পিরিয়ডটি মুছুন"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  value={pt.time}
                  onChange={(e) => {
                    const updated = [...tempPeriodTimes];
                    updated[idx].time = e.target.value;
                    setTempPeriodTimes(updated);
                  }}
                  placeholder="পিরিয়ডের সময় লিখুন"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:bg-white focus:border-teal-600 focus:outline-hidden"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleAddTempPeriod}
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-teal-700" />
              <span>+ নতুন পিরিয়ড যোগ করুন</span>
            </button>
            <span className="text-[11px] text-slate-500">
              মোট পিরিয়ড: <strong>{toBanglaDigits(tempPeriodTimes.length)}টি</strong>
            </span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setTimingSheetOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>সময়সূচি সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* ========================================================================= */}
      {/* 4. MODERN SLIDING BOTTOM SHEET FOR ROUTINE CELL EDIT                       */}
      {/* ========================================================================= */}
      <BottomSheet
        isOpen={Boolean(editingSlot)}
        onClose={() => setEditingSlot(null)}
        title={editingSlot ? `পিরিয়ড সম্পাদনা (${editingSlot.dayBangla} - পিরিয়ড ${toBanglaDigits(editingSlot.period)})` : ''}
        subtitle="নির্দিষ্ট এই পিরিয়ডের বিষয়, শিক্ষক, রুম ও সময়সূচি নির্ধারণ করুন"
        maxHeight="max-h-[92vh]"
      >
        {editingSlot && (
          <form onSubmit={handleSaveSlot} className="space-y-4 pb-6 font-bengali">
            {/* Class Timing for this slot */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-700" />
                <span>ক্লাসের সময়সূচি (Time / Timing)</span>
              </label>
              <input
                type="text"
                value={slotCustomTime}
                onChange={(e) => setSlotCustomTime(e.target.value)}
                placeholder="ক্লাসের সময় লিখুন"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden font-mono font-bold"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                * শিফট অনুযায়ী সময় বাধ্যতামূলক নয়, যেকোনো সময় স্বাধীনভাবে লিখতে পারেন।
              </p>
            </div>

            {/* Quick Subject Picker using Bottom Sheet */}
            {autoSubjects.length > 0 && (
              <div>
                <SelectTrigger
                  label="কারিকুলাম থেকে বিষয় বাছাই"
                  value={slotCode}
                  displayValue={slotCode ? `${slotCode} - ${slotName}` : ''}
                  placeholder="কারিকুলাম বিষয় নির্বাচন করুন"
                  onClick={() => setSubjectSheetOpen(true)}
                  icon={BookOpen}
                />
              </div>
            )}

            {/* Subject Code & Name Manual Inputs */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">বিষয় কোড ও বিষয়ের নাম</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={slotCode}
                  onChange={(e) => setSlotCode(e.target.value)}
                  placeholder="বিষয় কোড লিখুন"
                  className="sm:col-span-1 px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden font-mono font-bold"
                />
                <input
                  type="text"
                  value={slotName}
                  onChange={(e) => setSlotName(e.target.value)}
                  placeholder="বিষয়ের নাম লিখুন"
                  className="sm:col-span-2 px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden font-semibold"
                />
              </div>
            </div>

            {/* Teacher Selection with Modern Bottom Sheet */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">সংশ্লিষ্ট শিক্ষক</label>
                {teachersList.length === 0 && (
                  <span className="text-[10px] text-amber-600 font-bold">
                    * শিক্ষক যোগ করতে শিক্ষক ব্যবস্থাপনা পেজে যান
                  </span>
                )}
              </div>

              {teachersList.length > 0 ? (
                <div className="space-y-2">
                  <SelectTrigger
                    label=""
                    value={slotTeacher}
                    displayValue={slotTeacher}
                    placeholder="তালিকা থেকে শিক্ষক সিলেক্ট করুন"
                    onClick={() => setTeacherSheetOpen(true)}
                    icon={UserCheck}
                  />
                  <input
                    type="text"
                    value={slotTeacher}
                    onChange={(e) => setSlotTeacher(e.target.value)}
                    placeholder="অথবা সরাসরি শিক্ষকের নাম লিখুন"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden font-medium"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={slotTeacher}
                  onChange={(e) => setSlotTeacher(e.target.value)}
                  placeholder="শিক্ষকের নাম লিখুন"
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden font-medium"
                />
              )}
            </div>

            {/* Room / Lab */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">রুম নম্বর / ল্যাব</label>
              <input
                type="text"
                value={slotRoom}
                onChange={(e) => setSlotRoom(e.target.value)}
                placeholder="রুম নম্বর বা ল্যাবের নাম লিখুন"
                className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClearSlot}
                className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                স্লট খালি করুন
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>সংরক্ষণ করুন</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </BottomSheet>

      {/* Bottom Sheet for Subject selection inside routine edit */}
      <SelectBottomSheet
        isOpen={subjectSheetOpen}
        onClose={() => setSubjectSheetOpen(false)}
        title="কারিকুলাম বিষয় নির্বাচন"
        subtitle="এই পিরিয়ডের জন্য বিষয় সিলেক্ট করুন"
        options={subjectOptions}
        selectedValue={slotCode}
        onSelect={(val) => {
          setSlotCode(val);
          const found = autoSubjects.find((s) => s.subjectCode === val);
          if (found) setSlotName(found.subjectName);
        }}
      />

      {/* Bottom Sheet for Teacher selection inside routine edit */}
      <SelectBottomSheet
        isOpen={teacherSheetOpen}
        onClose={() => setTeacherSheetOpen(false)}
        title="শিক্ষক নির্বাচন"
        subtitle="এই বিষয়ের সংশ্লিষ্ট শিক্ষক সিলেক্ট করুন"
        options={teacherOptions}
        selectedValue={slotTeacher}
        onSelect={(val) => setSlotTeacher(val)}
      />

      {/* ========================================================================= */}
      {/* 5. A4 OFFICIAL CLASS ROUTINE DOCUMENT (PRINT / PDF ENGINE)                */}
      {/* ========================================================================= */}
      {(!selectedTech || !selectedSemester) ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500 shadow-xs">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700 text-sm">অনুগ্রহ করে টেকনোলজি ও সেমিস্টার নির্বাচন করুন</p>
          <p className="text-xs text-slate-400 mt-1">
            টেকনোলজি ও সেমিস্টার নির্বাচন করলে সাপ্তাহিক পূর্ণাঙ্গ ক্লাস রুটিন তৈরি হবে এবং সরাসরি প্রতিটি ঘর এডিট করা যাবে।
          </p>
        </div>
      ) : (
        <A4DocumentEngine
          hideDefaultHeader={true}
          showSignatures={false}
          orientation="landscape"
          fileName={`class-routine-${selectedTech}-${selectedSemester}-${shift}`}
        >
          {/* Exact Paper Content */}
          <div className="font-bengali text-black select-text px-2 py-1">
            {/* Header */}
            <div className="text-center mb-4 pb-2 border-b-2 border-black">
              <h1 className="text-2xl font-black text-black tracking-tight mb-0.5">
                দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট, ভোলা
              </h1>
              <p className="text-sm font-bold text-black my-0.5">
                সাপ্তাহিক শ্রেণি সময়সূচি / ক্লাস রুটিন - {academicYear}
              </p>
              <div className="flex justify-center items-center gap-3 text-xs font-semibold text-slate-900 mt-1">
                <span>শিফট: <strong>{shift}</strong></span>
                <span>|</span>
                <span>টেকনোলজি: <strong>{selectedTechObj?.name}</strong></span>
                <span>|</span>
                <span>পর্ব: <strong>{semesterBangla}</strong></span>
              </div>
            </div>

            {/* Timetable Grid */}
            <div className="w-full overflow-x-auto mb-4">
              <table className="w-full border-collapse border border-black text-[11px] table-fixed">
                <thead>
                  <tr className="bg-slate-100 text-black font-bold">
                    <th className="border border-black px-2 py-2 text-center w-16 font-bold">বার</th>
                    {periodTimes.map((p) => (
                      <th
                        key={p.period}
                        className="border border-black px-1.5 py-1.5 text-center font-bold"
                      >
                        <span className="block font-bold">পিরিয়ড {toBanglaDigits(p.period)}</span>
                        <span className="block text-[9px] font-mono text-slate-800 font-normal">
                          {p.time}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day, idx) => (
                    <tr key={day.key} className={idx % 2 === 1 ? 'bg-slate-50/40' : ''}>
                      <td className="border border-black px-2 py-2 text-center font-bold bg-slate-100/70 text-black">
                        {day.bangla}
                      </td>
                      {periodTimes.map((p) => {
                        const cell = timetable[day.key]?.[p.period];
                        const hasContent = cell && (cell.code || cell.name || cell.teacher || cell.room);
                        return (
                          <td
                            key={p.period}
                            onClick={() => handleOpenSlotEdit(day.key, p.period, day.bangla)}
                            className="border border-black px-1 py-1.5 text-center align-top leading-tight bg-white hover:bg-teal-50/50 cursor-pointer transition-colors"
                            title="স্লট এডিট করতে ক্লিক করুন"
                          >
                            {hasContent ? (
                              <div>
                                <span className="block font-bold text-black text-[10px]">
                                  {cell.code} {cell.name ? `- ${cell.name}` : ''}
                                </span>
                                {(cell.teacher || cell.room) && (
                                  <span className="block text-[9px] text-slate-800 mt-0.5 font-medium">
                                    {cell.teacher ? `${cell.teacher}` : ''} {cell.room ? `• ${cell.room}` : ''}
                                  </span>
                                )}
                                {cell.customTime && cell.customTime !== p.time && (
                                  <span className="block text-[8.5px] text-teal-800 font-mono font-bold mt-0.5">
                                    ({cell.customTime})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Exact Reference Footer Signatures */}
            <div className="mt-10 flex justify-between px-8 text-xs font-bold text-black">
              <div className="text-center w-36 border-t border-black pt-1">
                <p>প্রস্তুতকারক</p>
                <p className="text-[10px] text-slate-600 font-normal">রুটিন প্রণয়ন কমিটি</p>
              </div>
              <div className="text-center w-36 border-t border-black pt-1">
                <p>বিভাগীয় প্রধান</p>
                <p className="text-[10px] text-slate-600 font-normal">দক্ষিণবঙ্গ পলিটেকনিক</p>
              </div>
              <div className="text-center w-36 border-t border-black pt-1">
                <p>অধ্যক্ষ</p>
                <p className="text-[10px] text-slate-600 font-normal">দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট</p>
              </div>
            </div>
          </div>
        </A4DocumentEngine>
      )}
    </div>
  );
};
