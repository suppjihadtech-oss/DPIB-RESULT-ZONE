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
import { ModernTimePicker } from '../../common/ModernTimePicker';
import { saveDraft, getDraft, clearDraft, DraftRecord } from '../../../utils/draftStorage';
import { DraftRestoreBanner } from '../../common/DraftRestoreBanner';
import {
  suggestNextRoutineDate,
  detectRoutineConflict,
  parseTimeToMinutes,
} from '../../../utils/smartRoutineAutomation';

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

export const ExamRoutineGenerator: React.FC = () => {
  // Routine Generation Mode: 'COMBINED' (সম্মিলিত রুটিন) vs 'SINGLE' (একক রুটিন)
  const [routineMode, setRoutineMode] = useState<'COMBINED' | 'SINGLE'>('COMBINED');

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
        routineMode,
        selectedExamId,
        viewTechFilter,
        viewSemesterFilter,
        routineItems,
      };
      await saveDraft('exam_routine', draftData);
      setLastSavedTime(Date.now());
    }, 800);

    return () => clearTimeout(timer);
  }, [routineMode, selectedExamId, viewTechFilter, viewSemesterFilter, routineItems]);

  const handleRestoreDraft = () => {
    if (!pendingDraft?.data) return;
    const d = pendingDraft.data;
    if (d.routineMode) setRoutineMode(d.routineMode);
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
  const [formWarningMessage, setFormWarningMessage] = useState<string>('');
  const [autoSuggestedNotice, setAutoSuggestedNotice] = useState<string>('');

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

  // Open "বিষয় যুক্ত করুন" Bottom Sheet for new entry with Smart Auto-Suggest
  const handleOpenAddSubjectSheet = () => {
    setEditingItemId(null);
    setFormSubjectCode('');
    setFormSubjectName('');
    setSubjectSearchQuery('');
    setFormWarningMessage('');

    // In Single Routine mode, pre-fill technology and semester
    if (routineMode === 'SINGLE') {
      const activeTech = viewTechFilter === 'ALL' ? 'COMPUTER' : viewTechFilter;
      const activeSem = viewSemesterFilter === 'ALL' ? '2' : viewSemesterFilter;
      setFormTech(activeTech);
      setFormSemester(activeSem);
    }

    // Smart Auto-Date Suggestion:
    // If routine items exist, suggest the day after the latest exam date (skipping Fridays).
    const existingDates = routineItems.map((item) => item.date).filter(Boolean);
    const { nextDate, dayBangla } = suggestNextRoutineDate(existingDates, true);

    setFormDate(nextDate);
    setFormDay(dayBangla);

    // Smart Time Suggestion: use the time of the last added item, or standard default
    if (routineItems.length > 0) {
      const lastItem = routineItems[routineItems.length - 1];
      if (lastItem.startTime && lastItem.endTime) {
        setFormStartTime(lastItem.startTime);
        setFormEndTime(lastItem.endTime);
        setAutoSuggestedNotice(`পূর্ববর্তী বিষয়ের সময় অনুযায়ী ${lastItem.startTime} - ${lastItem.endTime} এবং পরবর্তী সম্ভাব্য তারিখ সাজেস্ট করা হয়েছে।`);
      }
    } else {
      setAutoSuggestedNotice('স্বয়ংক্রিয়ভাবে প্রাথমিক তারিখ ও সময় সাজেস্ট করা হয়েছে (প্রয়োজনে পরিবর্তন করতে পারেন)।');
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
    setFormWarningMessage('');
    setAutoSuggestedNotice('');
    setSubjectSheetOpen(true);
  };

  // Select a curriculum subject to auto-fill code and name
  const handleSelectCurriculumSubject = (sub: CurriculumSubject) => {
    setFormSubjectCode(sub.subjectCode);
    setFormSubjectName(sub.subjectName);
    setFormWarningMessage('');
  };

  // Save entry from the Sliding Bottom Sheet with Smart Conflict Detection and Date/Time Validation
  const handleSaveSubjectEntry = (e: React.FormEvent) => {
    e.preventDefault();
    setFormWarningMessage('');

    if (!formSubjectName.trim()) {
      setFormWarningMessage('অনুগ্রহ করে বিষয়ের নাম সিলেক্ট বা এন্ট্রি করুন।');
      return;
    }

    if (!formDate) {
      setFormWarningMessage('অনুগ্রহ করে পরীক্ষার তারিখ নির্ধারণ করুন।');
      return;
    }

    // 1. Time Inversion Check
    const startMin = parseTimeToMinutes(formStartTime);
    const endMin = parseTimeToMinutes(formEndTime);
    if (startMin > 0 && endMin > 0 && endMin <= startMin) {
      setFormWarningMessage('ভুল সময়সূচি: পরীক্ষার সমাপ্তির সময় অবশ্যই শুরুর সময়ের পরবর্তী হতে হবে!');
      return;
    }

    const trimmedCode = formSubjectCode.trim();
    const trimmedName = formSubjectName.trim().toLowerCase();

    // 2. Duplicate Check Rule:
    const isDuplicate = routineItems.some((item) => {
      if (editingItemId && item.id === editingItemId) return false;
      
      const sameSemester = item.semesterId === formSemester;
      const sameDate = item.date === formDate;
      const sameSubject =
        (trimmedCode && item.subjectCode && item.subjectCode.trim() === trimmedCode) ||
        (item.subjectName && item.subjectName.trim().toLowerCase() === trimmedName);

      if (!sameSemester || !sameDate || !sameSubject) return false;
      if (formTech === 'ALL') return true;
      if (item.technology === 'ALL') return true;
      return item.technology === formTech;
    });

    if (isDuplicate) {
      setFormWarningMessage('সতর্কতা: এই বিষয়টি ইতিমধ্যে এই তারিখ ও সেমিস্টারের রুটিনে যুক্ত রয়েছে (ডুপ্লিকেট এন্ট্রি)।');
      return;
    }

    // 3. Smart Conflict Detection (same tech, same date, overlapping times)
    const conflict = detectRoutineConflict(
      {
        technology: formTech,
        semesterId: formSemester,
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        subjectCode: formSubjectCode,
        subjectName: formSubjectName,
      },
      routineItems,
      editingItemId
    );

    if (conflict.hasConflict) {
      setFormWarningMessage(conflict.message);
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
    if (routineMode === 'SINGLE') {
      const activeTech = viewTechFilter === 'ALL' ? 'COMPUTER' : viewTechFilter;
      const activeSem = viewSemesterFilter === 'ALL' ? '2' : viewSemesterFilter;
      list = list.filter(
        (item) =>
          (item.technology === activeTech || item.technology === 'ALL') &&
          item.semesterId === activeSem
      );
    } else {
      if (viewTechFilter !== 'ALL') {
        list = list.filter((item) => item.technology === viewTechFilter || item.technology === 'ALL');
      }
      if (viewSemesterFilter !== 'ALL') {
        list = list.filter((item) => item.semesterId === viewSemesterFilter);
      }
    }

    // Sort strictly by Date, then Time, then Technology, then Semester
    return list.sort((a, b) => {
      if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
      const timeA = parseTimeToMinutes(a.startTime);
      const timeB = parseTimeToMinutes(b.startTime);
      if (timeA !== timeB) return timeA - timeB;
      if (a.technology !== b.technology) return (a.technology || '').localeCompare(b.technology || '');
      return (a.semesterId || '').localeCompare(b.semesterId || '');
    });
  }, [routineItems, routineMode, viewTechFilter, viewSemesterFilter]);

  // Group displayedRoutineItems by Date for Combined Routine view & table
  const groupedRoutineByDate = useMemo(() => {
    const groups: { date: string; day: string; items: ExamRoutineItem[] }[] = [];
    displayedRoutineItems.forEach((item) => {
      let grp = groups.find((g) => g.date === item.date);
      if (!grp) {
        grp = {
          date: item.date,
          day: item.day || getBanglaDayFromDate(item.date),
          items: [],
        };
        groups.push(grp);
      }
      grp.items.push(item);
    });
    return groups;
  }, [displayedRoutineItems]);

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

        {/* ২ টি রুটিন তৈরির মোড অপশন (সম্মিলিত রুটিন বনাম একক রুটিন) */}
        <div className="pt-4 pb-2 border-b border-slate-100 mb-2">
          <label className="block text-xs font-bold text-slate-700 mb-2">
            রুটিন তৈরির মোড নির্বাচন করুন:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setRoutineMode('COMBINED');
                setViewTechFilter('ALL');
                setViewSemesterFilter('ALL');
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                routineMode === 'COMBINED'
                  ? 'bg-violet-50/90 border-violet-400 shadow-xs ring-2 ring-violet-200'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200/90 text-slate-600'
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  routineMode === 'COMBINED'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-white text-slate-500 border border-slate-200'
                }`}
              >
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">
                    ১. সম্মিলিত রুটিন তৈরি করুন
                  </h4>
                  {routineMode === 'COMBINED' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-violet-600 text-white">
                      সক্রিয়
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  একই রুটিনে সব টেকনোলজি ও পর্বের বিষয় তারিখ অনুযায়ী একসঙ্গে থাকবে (BTEB স্ট্যান্ডার্ড ফরম্যাট)।
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setRoutineMode('SINGLE');
                if (viewTechFilter === 'ALL') setViewTechFilter('COMPUTER');
                if (viewSemesterFilter === 'ALL') setViewSemesterFilter('2');
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                routineMode === 'SINGLE'
                  ? 'bg-violet-50/90 border-violet-400 shadow-xs ring-2 ring-violet-200'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200/90 text-slate-600'
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  routineMode === 'SINGLE'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-white text-slate-500 border border-slate-200'
                }`}
              >
                <Building className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">
                    ২. একক রুটিন তৈরি করুন
                  </h4>
                  {routineMode === 'SINGLE' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-violet-600 text-white">
                      সক্রিয়
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  নির্দিষ্ট ডিপার্টমেন্ট/টেকনোলজি ও সেমিস্টার পর্বের জন্য আলাদা স্বতন্ত্র পরীক্ষার রুটিন।
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Global Selectors Row (Select Exam, Tech Filter/Select, Semester Filter/Select) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <SelectTrigger
            label="পরীক্ষা নির্বাচন"
            value={selectedExamId}
            displayValue={selectedExam?.title || 'পরীক্ষা নির্বাচন করুন'}
            placeholder="পরীক্ষা নির্বাচন করুন"
            onClick={() => setExamSheetOpen(true)}
            icon={Award}
          />

          <SelectTrigger
            label={routineMode === 'SINGLE' ? 'টেকনোলজি নির্বাচন' : 'টেকনোলজি ফিল্টার'}
            value={viewTechFilter}
            displayValue={
              viewTechFilter === 'ALL'
                ? 'সকল টেকনোলজি (সম্মিলিত রুটিন)'
                : AVAILABLE_TECHNOLOGIES.find((t) => t.id === viewTechFilter)?.name || viewTechFilter
            }
            placeholder="টেকনোলজি নির্বাচন"
            onClick={() => setFilterTechSheetOpen(true)}
            icon={Building}
          />

          <SelectTrigger
            label={routineMode === 'SINGLE' ? 'সেমিস্টার / পর্ব নির্বাচন' : 'সেমিস্টার / পর্ব ফিল্টার'}
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
          {/* Auto Suggested Notice Banner */}
          {autoSuggestedNotice && (
            <div className="p-3 bg-indigo-50/80 border border-indigo-200/90 rounded-2xl flex items-center justify-between gap-2 text-indigo-950 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-semibold">{autoSuggestedNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoSuggestedNotice('')}
                className="text-indigo-400 hover:text-indigo-700 p-0.5 rounded cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Validation Warning Alert */}
          {formWarningMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-800 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-bold">{formWarningMessage}</span>
            </div>
          )}

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

      {/* Modern Date Selection Modal using ModernDatePicker */}
      <ModernDatePicker
        isOpen={formDateSheetOpen}
        onClose={() => setFormDateSheetOpen(false)}
        value={formDate}
        onChange={(newDate) => {
          setFormDate(newDate);
          setFormDay(getBanglaDayFromDate(newDate));
        }}
        title="পরীক্ষার তারিখ নির্বাচন"
        subtitle="ক্যালেন্ডার থেকে পরীক্ষার তারিখ নির্ধারণ করুন (বার স্বয়ংক্রিয়ভাবে নির্ধারিত হবে)"
        minYear={2020}
        maxYear={2035}
      />

      {/* Modern Time Selection Sliding Bottom Sheet using ModernTimePicker */}
      <ModernTimePicker
        isOpen={formTimeSheetOpen}
        onClose={() => setFormTimeSheetOpen(false)}
        startTime={formStartTime}
        endTime={formEndTime}
        onSelectTime={(start, end) => {
          setFormStartTime(start);
          setFormEndTime(end);
          setFormWarningMessage('');
        }}
        title="পরীক্ষার সময়সূচি নির্বাচন"
        subtitle="শুরুর সময় ও শেষের সময় নির্ধারণ করুন"
        suggestedDurationMinutes={180}
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
          fileName={`exam-routine-${routineMode.toLowerCase()}-${selectedExam?.title || 'dpib'}-${viewTechFilter}`}
        >
          {/* Official DPIB Exam Routine Sheet Container */}
          <div className="font-bengali text-black text-center px-4 py-2 select-text">
            {/* Header */}
            <p className="doc-institute-title m-0 text-sm font-semibold text-black">
              দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট, ভোলা।
            </p>
            <h1 className="doc-header-title text-xl font-bold my-1 border-b-[1.5px] border-black inline-block pb-0.5">
              ডিপ্লোমা ইন-ইঞ্জিনিয়ারিং
            </h1>
            {selectedExam && (
              <p className="doc-title mt-2 mb-0.5 text-base font-bold text-black">
                {selectedExam.title}
              </p>
            )}
            <p className="doc-subtitle mb-4 text-xs font-semibold text-slate-800">
              {routineMode === 'COMBINED' ? (
                <>
                  সকল টেকনোলজি (সম্মিলিত পরীক্ষার সময়সূচি)
                  {viewTechFilter !== 'ALL' && ` • ফিল্টার: ${AVAILABLE_TECHNOLOGIES.find((t) => t.id === viewTechFilter)?.name || viewTechFilter}`}
                  {viewSemesterFilter !== 'ALL' && ` • ${SEMESTER_MAP[viewSemesterFilter as SemesterId] || `${viewSemesterFilter}ম পর্ব`}`}
                </>
              ) : (
                <>
                  {`টেকনোলজিঃ ${AVAILABLE_TECHNOLOGIES.find((t) => t.id === viewTechFilter)?.name || viewTechFilter}`}
                  {` • পর্বঃ ${SEMESTER_MAP[viewSemesterFilter as SemesterId] || `${viewSemesterFilter}ম পর্ব`}`}
                </>
              )}
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
                {routineMode === 'COMBINED' ? (
                  // ১. সম্মিলিত রুটিন: একই তারিখের সব টেকনোলজি ও পর্বের বিষয়গুলো তারিখ অনুযায়ী একত্রিত সাজানো
                  groupedRoutineByDate.map((group) => {
                    return group.items.map((item, itemIdx) => {
                      const techObj = AVAILABLE_TECHNOLOGIES.find((t) => t.id === item.technology);
                      const isAll = item.technology === 'ALL';
                      const semBangla = item.semesterId ? SEMESTER_MAP[item.semesterId as SemesterId] : '';

                      return (
                        <tr key={item.id} className="border border-black">
                          {/* বার / তারিখ (Rowspan for all subjects of this date group) */}
                          {itemIdx === 0 && (
                            <td
                              rowSpan={group.items.length}
                              className="border border-black p-2 text-xs font-medium leading-tight align-middle text-center bg-slate-50/20"
                            >
                              <span className="block font-mono font-bold text-xs">{toBanglaDigits(group.date)}</span>
                              <span className="block text-slate-800 font-semibold text-[11px] mt-0.5">{group.day}</span>
                            </td>
                          )}

                          {/* টেকনোলজি ও পর্ব */}
                          <td className="border border-black p-2 text-xs font-semibold leading-tight text-center">
                            <span className="block font-bold text-black">
                              {isAll ? 'সকল টেকনোলজি' : (techObj?.name || item.technology)}
                            </span>
                            {semBangla && (
                              <span className="block text-[11px] text-slate-700 mt-0.5">({semBangla})</span>
                            )}
                          </td>

                          {/* বিষয় ও বিষয় কোড */}
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

                          {/* সময় */}
                          <td className="border border-black p-2 text-xs font-semibold leading-tight text-center">
                            <span className="block font-mono text-[11px]">{toBanglaDigits(item.startTime)}</span>
                            <span className="block text-[10px] text-slate-500">হতে</span>
                            <span className="block font-mono text-[11px]">{toBanglaDigits(item.endTime)}</span>
                          </td>
                        </tr>
                      );
                    });
                  })
                ) : (
                  // ২. একক রুটিন: নির্বাচিত টেকনোলজি ও সেমিস্টার পর্বের রুটিন
                  displayedRoutineItems.map((item) => {
                    const techObj = AVAILABLE_TECHNOLOGIES.find((t) => t.id === item.technology);
                    const isAll = item.technology === 'ALL';
                    const semBangla = item.semesterId ? SEMESTER_MAP[item.semesterId as SemesterId] : '';

                    return (
                      <tr key={item.id} className="border border-black">
                        {/* বার / তারিখ */}
                        <td className="border border-black p-2 text-xs font-medium leading-tight align-middle text-center">
                          <span className="block font-mono font-bold text-xs">{toBanglaDigits(item.date)}</span>
                          <span className="block text-slate-800 font-semibold text-[11px] mt-0.5">{item.day}</span>
                        </td>

                        {/* টেকনোলজি ও পর্ব */}
                        <td className="border border-black p-2 text-xs font-semibold leading-tight text-center">
                          <span className="block font-bold text-black">
                            {isAll ? 'সকল টেকনোলজি' : (techObj?.name || item.technology)}
                          </span>
                          {semBangla && (
                            <span className="block text-[11px] text-slate-700 mt-0.5">({semBangla})</span>
                          )}
                        </td>

                        {/* বিষয় ও বিষয় কোড */}
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

                        {/* সময় */}
                        <td className="border border-black p-2 text-xs font-semibold leading-tight text-center">
                          <span className="block font-mono text-[11px]">{toBanglaDigits(item.startTime)}</span>
                          <span className="block text-[10px] text-slate-500">হতে</span>
                          <span className="block font-mono text-[11px]">{toBanglaDigits(item.endTime)}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
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
