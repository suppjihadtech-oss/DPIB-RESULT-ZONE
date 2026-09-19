import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  Plus,
  Trash2,
  RefreshCw,
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Layers,
  ShieldCheck,
  ChevronDown,
  Check,
  Bookmark,
  GraduationCap,
  Cpu,
  Building,
  Zap,
  Wrench,
  Anchor,
  Compass,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { GpaSubject, GradingRule, SemesterId } from '../../types';
import {
  BTEB_GRADING_SCALE,
  calculateBtebGpa,
  getBtebGradeFromMarks,
  BtebGradeInfo,
} from '../../services/gpaService';
import { toBanglaDigits } from '../../utils/bangla';
import { BottomSheet } from '../common/BottomSheet';
import { getCurriculumSubjects, getSystemSettings } from '../../services/db';
import { getAutoLoadedCurriculumSubjects } from '../../data/masterCurriculum';

interface TechnologyOption {
  code: string;
  name: string;
  shortName: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TECHNOLOGIES: TechnologyOption[] = [
  { code: 'COMPUTER', name: 'কম্পিউটার টেকনোলজি', shortName: 'কম্পিউটার', icon: Cpu },
  { code: 'CIVIL', name: 'সিভিল টেকনোলজি', shortName: 'সিভিল', icon: Building },
  { code: 'ELECTRICAL', name: 'ইলেকট্রিক্যাল টেকনোলজি', shortName: 'ইলেকট্রিক্যাল', icon: Zap },
  { code: 'MECHANICAL', name: 'মেকানিক্যাল টেকনোলজি', shortName: 'মেকানিক্যাল', icon: Wrench },
  { code: 'MARINE', name: 'মেরিন টেকনোলজি', shortName: 'মেরিন', icon: Anchor },
  { code: 'SURVEYING', name: 'সার্ভেয়িং টেকনোলজি', shortName: 'সার্ভেয়িং', icon: Compass },
];

const SEMESTERS: { id: SemesterId; label: string; name: string }[] = [
  { id: '1', label: '১ম', name: '১ম পর্ব' },
  { id: '2', label: '২য়', name: '২য় পর্ব' },
  { id: '3', label: '৩য়', name: '৩য় পর্ব' },
  { id: '4', label: '৪র্থ', name: '৪র্থ পর্ব' },
  { id: '5', label: '৫ম', name: '৫ম পর্ব' },
  { id: '6', label: '৬ষ্ঠ', name: '৬ষ্ঠ পর্ব' },
  { id: '7', label: '৭ম', name: '৭ম পর্ব' },
  { id: '8', label: '৮ম', name: '৮ম পর্ব' },
];

const CREDIT_OPTIONS = [
  { credit: 1, label: '১ ক্রেডিট', desc: 'ল্যাব বা শর্ট প্র্যাকটিক্যাল কোর্স' },
  { credit: 2, label: '২ ক্রেডিট', desc: 'সাধারণ থিওরি বা প্র্যাকটিক্যাল' },
  { credit: 3, label: '৩ ক্রেডিট', desc: 'স্ট্যান্ডার্ড ইঞ্জিনিয়ারিং কোর্স' },
  { credit: 4, label: '৪ ক্রেডিট', desc: 'মেজর কোর ইঞ্জিনিয়ারিং বিষয়' },
  { credit: 5, label: '৫ ক্রেডিট', desc: 'বিশেষ প্রজেক্ট বা উন্নত কোর্স' },
  { credit: 6, label: '৬ ক্রেডিট', desc: 'ইন্ডাস্ট্রিয়াল ট্রেনিং বা ফাইনাল প্রজেক্ট' },
];

export const GpaCalculatorPage: React.FC = () => {
  // Academic Selection States
  const [selectedTech, setSelectedTech] = useState<string>('COMPUTER');
  const [selectedSemester, setSelectedSemester] = useState<SemesterId>('5');
  const [subjects, setSubjects] = useState<GpaSubject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState<boolean>(false);
  const [configuredGradingRules, setConfiguredGradingRules] = useState<GradingRule[]>([]);

  // Input Mode: MARKS (নম্বর) vs GRADE (সরাসরি গ্রেড)
  const [inputMode, setInputMode] = useState<'MARKS' | 'GRADE'>('MARKS');

  // BottomSheet States
  const [techSheetOpen, setTechSheetOpen] = useState(false);
  const [semesterSheetOpen, setSemesterSheetOpen] = useState(false);
  const [creditSheetOpen, setCreditSheetOpen] = useState(false);
  const [gradeSheetOpen, setGradeSheetOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [deleteConfirmSubject, setDeleteConfirmSubject] = useState<{ id: string; name: string } | null>(null);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);

  // Load configured system settings & grading rules
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSystemSettings();
        if (settings && settings.gradingRules && settings.gradingRules.length > 0) {
          setConfiguredGradingRules(settings.gradingRules);
        }
      } catch (err) {
        console.error('Error loading grading rules:', err);
      }
    }
    loadSettings();
  }, []);

  // AUTO-LOAD SUBJECTS when Semester or Technology changes
  useEffect(() => {
    let isCancelled = false;

    async function loadAcademicSubjects() {
      setIsLoadingSubjects(true);
      try {
        // 1. Try fetching from Firestore curriculum
        const dbCurriculum = await getCurriculumSubjects(selectedTech, selectedSemester);
        
        let loadedItems = dbCurriculum;

        // 2. Fallback to Master Curriculum if empty
        if (!loadedItems || loadedItems.length === 0) {
          const autoFallback = getAutoLoadedCurriculumSubjects([selectedTech], selectedSemester);
          loadedItems = autoFallback.map((item) => ({
            id: `curric-${item.subjectCode}`,
            subjectCode: item.subjectCode,
            subjectName: item.subjectName,
            technology: selectedTech,
            semesterId: selectedSemester,
            semester: `${selectedSemester}th`,
            curriculumFullMarks: item.curriculumFullMarks || 150,
          }));
        }

        // 3. Deduplicate strictly by subjectCode
        const deduplicatedMap = new Map<string, typeof loadedItems[0]>();
        for (const item of loadedItems) {
          const codeKey = (item.subjectCode || '').trim();
          if (codeKey && !deduplicatedMap.has(codeKey)) {
            deduplicatedMap.set(codeKey, item);
          }
        }

        const uniqueItems = Array.from(deduplicatedMap.values());

        // 4. Map into GpaSubject with configured dynamic credits & initial default benchmark marks
        const mappedSubjects: GpaSubject[] = uniqueItems.map((item, index) => {
          // BTEB standard credit formula: 50 marks = 1 credit (e.g. 100 marks = 2 cr, 150 marks = 3 cr, 200 marks = 4 cr)
          const derivedCredit = Math.max(1, Math.min(6, Math.round((item.curriculumFullMarks || 150) / 50)));
          const defaultMarks = 80;
          const gInfo = getBtebGradeFromMarks(defaultMarks, configuredGradingRules);

          return {
            id: `${item.subjectCode || 'sub'}-${index}-${Date.now()}`,
            name: item.subjectName || `বিষয় ${index + 1}`,
            code: item.subjectCode || '',
            credit: derivedCredit,
            marks: defaultMarks,
            grade: gInfo.grade,
            gradePoint: gInfo.gradePoint,
          };
        });

        if (!isCancelled) {
          setSubjects(mappedSubjects);
        }
      } catch (err) {
        console.error('Error auto-loading subjects:', err);
        // Resilient fallback to Master Curriculum data
        const autoFallback = getAutoLoadedCurriculumSubjects([selectedTech], selectedSemester);
        const fallbackMapped: GpaSubject[] = autoFallback.map((item, index) => {
          const derivedCredit = Math.max(1, Math.min(6, Math.round((item.curriculumFullMarks || 150) / 50)));
          const defaultMarks = 80;
          const gInfo = getBtebGradeFromMarks(defaultMarks, configuredGradingRules);

          return {
            id: `${item.subjectCode}-${index}-${Date.now()}`,
            name: item.subjectName,
            code: item.subjectCode,
            credit: derivedCredit,
            marks: defaultMarks,
            grade: gInfo.grade,
            gradePoint: gInfo.gradePoint,
          };
        });
        if (!isCancelled) {
          setSubjects(fallbackMapped);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingSubjects(false);
        }
      }
    }

    loadAcademicSubjects();

    return () => {
      isCancelled = true;
    };
  }, [selectedTech, selectedSemester, configuredGradingRules]);

  // Live dynamic calculation result
  const result = useMemo(() => {
    return calculateBtebGpa(subjects, configuredGradingRules);
  }, [subjects, configuredGradingRules]);

  // Active subject for bottom sheets
  const activeSubject = useMemo(() => {
    return subjects.find((s) => s.id === activeSubjectId) || null;
  }, [subjects, activeSubjectId]);

  // Selected technology metadata
  const currentTechMeta = useMemo(() => {
    return TECHNOLOGIES.find((t) => t.code === selectedTech) || TECHNOLOGIES[0];
  }, [selectedTech]);

  // Selected semester metadata
  const currentSemesterMeta = useMemo(() => {
    return SEMESTERS.find((s) => s.id === selectedSemester) || SEMESTERS[4];
  }, [selectedSemester]);

  // Open Bottom Sheets
  const handleOpenCreditSheet = (subId: string) => {
    setActiveSubjectId(subId);
    setCreditSheetOpen(true);
  };

  const handleOpenGradeSheet = (subId: string) => {
    setActiveSubjectId(subId);
    setGradeSheetOpen(true);
  };

  const handleSelectCredit = (credit: number) => {
    if (!activeSubjectId) return;
    handleSubjectChange(activeSubjectId, 'credit', credit);
    setCreditSheetOpen(false);
    setActiveSubjectId(null);
  };

  const handleSelectGrade = (gradeInfo: BtebGradeInfo) => {
    if (!activeSubjectId) return;
    setSubjects((prev) =>
      prev.map((sub) => {
        if (sub.id !== activeSubjectId) return sub;
        const updated = { ...sub, grade: gradeInfo.grade, gradePoint: gradeInfo.gradePoint };
        if (!sub.marks || sub.marks < gradeInfo.minMarks || sub.marks > gradeInfo.maxMarks) {
          updated.marks = gradeInfo.minMarks;
        }
        return updated;
      })
    );
    setGradeSheetOpen(false);
    setActiveSubjectId(null);
  };

  const handleSubjectChange = (id: string, field: keyof GpaSubject, value: any) => {
    setSubjects((prev) =>
      prev.map((sub) => {
        if (sub.id !== id) return sub;

        const updated = { ...sub, [field]: value };

        if (field === 'marks') {
          const m = Number(value) || 0;
          const gradeInfo = getBtebGradeFromMarks(m, configuredGradingRules);
          updated.marks = m;
          updated.grade = gradeInfo.grade;
          updated.gradePoint = gradeInfo.gradePoint;
        } else if (field === 'grade') {
          const scale = configuredGradingRules.length > 0
            ? configuredGradingRules.map((r) => ({
                grade: r.grade,
                gradePoint: r.point,
                minMarks: r.minMarks,
                maxMarks: r.maxMarks,
                description: '',
                isPass: r.point > 0,
              }))
            : BTEB_GRADING_SCALE;
          const gInfo = scale.find((g) => g.grade === value);
          if (gInfo) {
            updated.grade = gInfo.grade;
            updated.gradePoint = gInfo.gradePoint;
            if (!sub.marks || sub.marks < gInfo.minMarks || sub.marks > gInfo.maxMarks) {
              updated.marks = gInfo.minMarks;
            }
          }
        }

        return updated;
      })
    );
  };

  const handleAddCustomSubject = () => {
    const newId = `manual-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const newSubject: GpaSubject = {
      id: newId,
      name: `নতুন বিষয় ${toBanglaDigits(subjects.length + 1)}`,
      code: '',
      credit: 3,
      marks: 80,
      grade: 'A+',
      gradePoint: 4.0,
    };
    setSubjects([...subjects, newSubject]);
  };

  const handleExecuteDeleteSubject = () => {
    if (!deleteConfirmSubject) return;
    setSubjects(subjects.filter((s) => s.id !== deleteConfirmSubject.id));
    setDeleteConfirmSubject(null);
  };

  const handleReloadDefaultCurriculum = () => {
    setResetConfirmOpen(false);
    // Trigger fresh load
    setSelectedTech((prev) => prev);
  };

  const TechIcon = currentTechMeta.icon;

  return (
    <div className="space-y-8 animate-fade-in font-bengali pb-16">
      {/* Top Academic Context Header */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-violet-50 border border-violet-100 rounded-full text-violet-700 text-xs font-bold font-sans uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
              <span>কারিগরি শিক্ষা বোর্ড গ্রেডিং ও ক্রেডিট সিস্টেম</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              জিপিএ ক্যালকুলেটর
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              সেমিস্টার ও টেকনোলজি নির্বাচন করলেই কারিকুলাম অনুযায়ী সংশ্লিষ্ট সকল বই স্বয়ংক্রিয়ভাবে লোড হবে। প্রাপ্ত নম্বর বা গ্রেড পরিবর্তন করে তাৎক্ষণিক জিপিএ হিসাব করুন।
            </p>
          </div>

          {/* Academic Selector Controls (Modern Sliding Sheets) */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Semester Selector Button */}
            <button
              type="button"
              onClick={() => setSemesterSheetOpen(true)}
              className="px-4 py-3 bg-white hover:bg-violet-50/60 text-slate-800 font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2.5 transition-all cursor-pointer border border-slate-200 hover:border-violet-300 shadow-2xs group"
            >
              <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-[10px] text-slate-400 font-medium leading-tight">সেমিস্টার</span>
                <span className="font-extrabold text-slate-900">{currentSemesterMeta.name}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-violet-600 ml-1" />
            </button>

            {/* Technology Selector Button */}
            <button
              type="button"
              onClick={() => setTechSheetOpen(true)}
              className="px-4 py-3 bg-white hover:bg-violet-50/60 text-slate-800 font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2.5 transition-all cursor-pointer border border-slate-200 hover:border-violet-300 shadow-2xs group"
            >
              <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <TechIcon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-[10px] text-slate-400 font-medium leading-tight">টেকনোলজি</span>
                <span className="font-extrabold text-slate-900">{currentTechMeta.shortName}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-violet-600 ml-1" />
            </button>
          </div>
        </div>

        {/* Input Mode Toggle & Auto-load Status */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700">
              {isLoadingSubjects ? (
                'বিষয়সমূহ লোড হচ্ছে...'
              ) : (
                `স্বয়ংক্রিয়ভাবে ${toBanglaDigits(subjects.length)}টি বিষয় লোড হয়েছে (${currentSemesterMeta.name} - ${currentTechMeta.shortName})`
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1 hidden sm:inline">ইনপুট মোড:</span>
            <div className="inline-flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setInputMode('MARKS')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  inputMode === 'MARKS'
                    ? 'bg-white text-violet-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                নম্বর প্রদান
              </button>
              <button
                type="button"
                onClick={() => setInputMode('GRADE')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  inputMode === 'GRADE'
                    ? 'bg-white text-violet-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                সরাসরি গ্রেড
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Subject Table + Result Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Subjects Table (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    বিষয় তালিকা ও প্রাপ্ত ফলাফল
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    প্রতিটি বিষয়ের প্রাপ্ত নম্বর বা গ্রেড প্রদান করুন
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddCustomSubject}
                  className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                  title="প্রয়োজনে অতিরিক্ত বিষয় যোগ করুন"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>বিষয় যোগ</span>
                </button>
              </div>
            </div>

            {/* Subject List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                    <th className="py-3 px-3.5 text-center w-10">ক্রম</th>
                    <th className="py-3 px-3 min-w-[180px]">বিষয়ের নাম ও কোড</th>
                    <th className="py-3 px-2 text-center w-24">ক্রেডিট</th>
                    {inputMode === 'MARKS' && <th className="py-3 px-2 text-center w-24">প্রাপ্ত নম্বর (%)</th>}
                    <th className="py-3 px-2 text-center w-28">গ্রেড</th>
                    <th className="py-3 px-2 text-center w-20">পয়েন্ট</th>
                    <th className="py-3 px-3 text-center w-24">ক্রেডিট × পয়েন্ট</th>
                    <th className="py-3 px-2 text-center w-12">বাদ দিন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {subjects.length === 0 ? (
                    <tr>
                      <td colSpan={inputMode === 'MARKS' ? 8 : 7} className="p-8 text-center text-slate-400">
                        কোনো বিষয় পাওয়া যায়নি। উপরে সেমিস্টার ও টেকনোলজি নির্বাচন করুন।
                      </td>
                    </tr>
                  ) : (
                    subjects.map((sub, idx) => {
                      const creditTimesGp = ((sub.credit || 0) * (sub.gradePoint || 0)).toFixed(2);
                      const isF = sub.grade === 'F';

                      return (
                        <tr
                          key={sub.id}
                          className={`transition-colors ${
                            isF ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {/* Serial */}
                          <td className="py-3.5 px-3.5 text-center font-bold text-slate-400 font-mono">
                            {toBanglaDigits(idx + 1)}
                          </td>

                          {/* Subject Name & Code */}
                          <td className="py-3.5 px-3 space-y-1">
                            <input
                              type="text"
                              value={sub.name}
                              onChange={(e) => handleSubjectChange(sub.id, 'name', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-hidden focus:bg-white focus:border-violet-600 shadow-2xs"
                            />
                            {sub.code && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono pl-1">
                                <span>কোড:</span>
                                <span className="font-bold text-slate-700">{sub.code}</span>
                              </div>
                            )}
                          </td>

                          {/* Credit Button (Sliding Sheet) */}
                          <td className="py-3.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenCreditSheet(sub.id)}
                              className="w-full px-2 py-1.5 bg-slate-50 hover:bg-violet-50 border border-slate-200 hover:border-violet-300 rounded-xl text-xs font-bold text-slate-900 flex items-center justify-center gap-1 transition-all cursor-pointer group"
                              title="ক্রেডিট পরিবর্তন"
                            >
                              <span className="font-mono font-black text-violet-700">{toBanglaDigits(sub.credit)}</span>
                              <span className="text-[10px] text-slate-500">Cr</span>
                              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-violet-600" />
                            </button>
                          </td>

                          {/* Marks Input (if Marks Mode) */}
                          {inputMode === 'MARKS' && (
                            <td className="py-3.5 px-2 text-center">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={sub.marks ?? ''}
                                onChange={(e) => handleSubjectChange(sub.id, 'marks', e.target.value)}
                                placeholder="০-১০০"
                                className="w-20 px-2 py-1.5 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-hidden focus:bg-white focus:border-violet-600 font-mono"
                              />
                            </td>
                          )}

                          {/* Letter Grade Button (Sliding Sheet) */}
                          <td className="py-3.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenGradeSheet(sub.id)}
                              className={`w-full px-2.5 py-1.5 border rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer group ${
                                isF
                                  ? 'bg-rose-100/80 border-rose-300 text-rose-700 hover:bg-rose-100'
                                  : 'bg-slate-50 hover:bg-violet-50 border-slate-200 hover:border-violet-300 text-slate-900'
                              }`}
                              title="গ্রেড নির্বাচন করুন"
                            >
                              <span className="font-sans font-black">{sub.grade}</span>
                              <ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                            </button>
                          </td>

                          {/* Grade Point */}
                          <td className="py-3.5 px-2 text-center font-bold font-mono text-slate-700">
                            {toBanglaDigits(sub.gradePoint.toFixed(2))}
                          </td>

                          {/* Credit × GP */}
                          <td className="py-3.5 px-3 text-center font-black font-mono text-violet-700 bg-violet-50/30">
                            {toBanglaDigits(creditTimesGp)}
                          </td>

                          {/* Delete Subject Button */}
                          <td className="py-3.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmSubject({ id: sub.id, name: sub.name || `বিষয় ${idx + 1}` })}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="বিষয়টি তালিকা থেকে বাদ দিন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 font-medium">
                * কোনো বিষয়ে ফেল (F গ্রেড) থাকলে সামগ্রিক ফলাফল রেফার্ড হিসেবে গণ্য হয়।
              </div>
              <button
                type="button"
                onClick={handleAddCustomSubject}
                className="text-xs font-bold text-violet-700 hover:text-violet-900 flex items-center space-x-1.5 py-1 px-3 rounded-lg hover:bg-violet-50 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>প্রয়োজনে নতুন বিষয় যুক্ত করুন</span>
              </button>
            </div>
          </div>

          {/* Official BTEB Grading Scale Reference */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs sm:text-sm">
              <Info className="w-4 h-4 text-violet-600" />
              <span>কারিগরি শিক্ষা বোর্ড অফিসিয়াল গ্রেডিং স্কেল</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              {BTEB_GRADING_SCALE.map((g) => (
                <div
                  key={g.grade}
                  className={`p-2.5 rounded-xl border ${
                    g.grade === 'A+'
                      ? 'bg-violet-50/70 border-violet-200 text-violet-900'
                      : g.grade === 'F'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="font-black text-sm font-sans">{g.grade}</div>
                  <div className="text-[11px] font-bold font-mono mt-0.5">পয়েন্ট: {toBanglaDigits(g.gradePoint.toFixed(2))}</div>
                  <div className="text-[10px] text-slate-500">{toBanglaDigits(g.minMarks)}-{toBanglaDigits(g.maxMarks)}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Calculated Results Summary Card (4 Cols) */}
        <div className="lg:col-span-4 space-y-5 sticky top-24">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-lg shadow-slate-100 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-violet-600" />
                <h3 className="font-black text-slate-900 text-base">
                  ফলাফলের সারসংক্ষেপ
                </h3>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black ${
                  result.isPassed
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {result.isPassed ? 'উত্তীর্ণ' : 'রেফার্ড'}
              </span>
            </div>

            {/* Big GPA Metric Display */}
            <div className="text-center py-2 space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                সেমিস্টার জিপিএ (GPA)
              </span>
              <div className="text-5xl sm:text-6xl font-black text-violet-700 font-mono tracking-tight">
                {toBanglaDigits(result.gpa.toFixed(2))}
              </div>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <span className="text-xs font-bold text-slate-600">লেটার গ্রেড:</span>
                <span className="text-sm font-black font-sans px-3 py-0.5 bg-violet-50 text-violet-800 rounded-lg border border-violet-200">
                  {result.letterGrade}
                </span>
              </div>
            </div>

            {/* Calculation Breakdown Rows */}
            <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">মোট বিষয়ের সংখ্যা:</span>
                <span className="font-bold text-slate-900 font-mono">{toBanglaDigits(subjects.length)} টি</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">মোট ক্রেডিট [Σ(Credit)]:</span>
                <span className="font-black text-slate-900 font-mono">{toBanglaDigits(result.totalCredits)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">মোট অর্জিত ক্রেডিট পয়েন্ট [Σ(Credit × GP)]:</span>
                <span className="font-black text-slate-900 font-mono">{toBanglaDigits(result.totalCreditPoints)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-slate-900">
                <span>হিসাবের সূত্র:</span>
                <span className="font-mono text-[11px] text-violet-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Σ(Credit × GP) ÷ Σ(Credit)
                </span>
              </div>
            </div>

            {/* Referred alert if any */}
            {result.hasReferred && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1.5 text-xs text-rose-900">
                <div className="flex items-center space-x-1.5 font-black text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>রেফার্ড বিষয়সমূহ:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  যেহেতু নিম্নের বিষয়ে 'F' গ্রেড রয়েছে, কারিগরি বোর্ডের নিয়ম অনুযায়ী সামগ্রিক ফলাফল রেফার্ড গণ্য হবে:
                </p>
                <ul className="list-disc pl-5 font-bold space-y-0.5 text-rose-800">
                  {result.referredSubjects.map((sName, i) => (
                    <li key={i}>{sName}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Metadata Footer */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                {currentSemesterMeta.name} • {currentTechMeta.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODERN SLIDING SHEETS ================= */}

      {/* 1. SEMESTER SELECTION SLIDING SHEET */}
      <BottomSheet
        isOpen={semesterSheetOpen}
        onClose={() => setSemesterSheetOpen(false)}
        title="সেমিস্টার নির্বাচন করুন"
        subtitle="সংশ্লিষ্ট পর্বের কারিকুলাম ও বইয়ের তালিকা লোড হবে"
      >
        <div className="space-y-3 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SEMESTERS.map((sem) => {
              const isSelected = selectedSemester === sem.id;
              return (
                <button
                  key={sem.id}
                  type="button"
                  onClick={() => {
                    setSelectedSemester(sem.id);
                    setSemesterSheetOpen(false);
                  }}
                  className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-[0.98] ${
                    isSelected
                      ? 'bg-violet-50 border-violet-400 text-violet-900 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${
                        isSelected
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-slate-900">
                        {sem.name}
                      </div>
                      <p className="text-[11px] text-slate-500">ডিপ্লোমা ইন ইঞ্জিনিয়ারিং</p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </BottomSheet>

      {/* 2. TECHNOLOGY SELECTION SLIDING SHEET */}
      <BottomSheet
        isOpen={techSheetOpen}
        onClose={() => setTechSheetOpen(false)}
        title="টেকনোলজি নির্বাচন করুন"
        subtitle="নির্বাচিত টেকনোলজির অ্যাকাডেমিক কোর্সসমূহ লোড হবে"
      >
        <div className="space-y-3 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TECHNOLOGIES.map((tech) => {
              const isSelected = selectedTech === tech.code;
              const IconComp = tech.icon;
              return (
                <button
                  key={tech.code}
                  type="button"
                  onClick={() => {
                    setSelectedTech(tech.code);
                    setTechSheetOpen(false);
                  }}
                  className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-[0.98] ${
                    isSelected
                      ? 'bg-violet-50 border-violet-400 text-violet-900 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${
                        isSelected
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-slate-900">
                        {tech.name}
                      </div>
                      <p className="text-[11px] text-slate-500">বিটিইবি কারিকুলাম</p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </BottomSheet>

      {/* 3. CREDIT SELECTION SLIDING SHEET */}
      <BottomSheet
        isOpen={creditSheetOpen}
        onClose={() => {
          setCreditSheetOpen(false);
          setActiveSubjectId(null);
        }}
        title="ক্রেডিট সংখ্যা নির্বাচন করুন"
        subtitle={activeSubject ? `বিষয়: ${activeSubject.name}` : 'বিটিইবি নির্ধারিত ক্রেডিট সিলেক্ট করুন'}
      >
        <div className="space-y-3 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CREDIT_OPTIONS.map((opt) => {
              const isSelected = activeSubject?.credit === opt.credit;
              return (
                <button
                  key={opt.credit}
                  type="button"
                  onClick={() => handleSelectCredit(opt.credit)}
                  className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-[0.98] ${
                    isSelected
                      ? 'bg-violet-50 border-violet-400 text-violet-900 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono text-sm border ${
                        isSelected
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {toBanglaDigits(opt.credit)} Cr
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">
                        {opt.label}
                      </div>
                      <p className="text-[11px] text-slate-500">{opt.desc}</p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </BottomSheet>

      {/* 4. GRADE SELECTION SLIDING SHEET */}
      <BottomSheet
        isOpen={gradeSheetOpen}
        onClose={() => {
          setGradeSheetOpen(false);
          setActiveSubjectId(null);
        }}
        title="লেটার গ্রেড ও পয়েন্ট নির্বাচন"
        subtitle={activeSubject ? `বিষয়: ${activeSubject.name}` : 'অফিসিয়াল স্কেল থেকে গ্রেড নির্বাচন করুন'}
      >
        <div className="space-y-2.5 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {BTEB_GRADING_SCALE.map((g) => {
              const isSelected = activeSubject?.grade === g.grade;
              const isF = g.grade === 'F';

              return (
                <button
                  key={g.grade}
                  type="button"
                  onClick={() => handleSelectGrade(g)}
                  className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-[0.98] ${
                    isSelected
                      ? isF
                        ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-xs'
                        : 'bg-violet-50 border-violet-400 text-violet-900 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-black border ${
                        isSelected
                          ? isF
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-violet-600 text-white border-violet-600'
                          : isF
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      <span className="text-sm leading-none font-sans">{g.grade}</span>
                      <span className="text-[9px] opacity-80 font-mono mt-0.5">{toBanglaDigits(g.gradePoint.toFixed(2))}</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900">
                          {g.description}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">
                        নম্বর: {toBanglaDigits(g.minMarks)}-{toBanglaDigits(g.maxMarks)}% | পয়েন্ট: {toBanglaDigits(g.gradePoint.toFixed(2))}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? isF
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-violet-600 text-white border-violet-600'
                        : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </BottomSheet>

      {/* 5. DELETE SUBJECT CONFIRMATION SLIDING SHEET */}
      <BottomSheet
        isOpen={Boolean(deleteConfirmSubject)}
        onClose={() => setDeleteConfirmSubject(null)}
        title="বিষয়টি বাদ দিতে চান?"
        subtitle={deleteConfirmSubject?.name}
      >
        <div className="space-y-4 pb-6 text-center">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
            <Trash2 className="w-7 h-7" />
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
            আপনি কি নিশ্চিত যে <span className="font-bold text-slate-900">"{deleteConfirmSubject?.name}"</span> বিষয়টিকে এই হিসাব থেকে বাদ দিতে চান?
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeleteConfirmSubject(null)}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleExecuteDeleteSubject}
              className="py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              হ্যাঁ, বাদ দিন
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
