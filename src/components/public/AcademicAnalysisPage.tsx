import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  Award,
  Trophy,
  Activity,
  Calendar,
  Layers,
  Cpu,
  BookOpen,
  FileText,
  Filter,
  RotateCcw,
  ChevronDown,
  Search,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  PieChart,
  Percent,
  Compass,
  AlertCircle,
  HelpCircle,
  Printer,
  ChevronRight,
  ShieldCheck,
  Zap,
  Building,
  Wrench,
  BookMarked,
  Info,
} from 'lucide-react';
import { Exam, StudentResult, SubjectResult, SystemSettings, SemesterId } from '../../types';
import { getResults, getExams } from '../../services/db';
import { printElementById } from '../../utils/printHelper';
import { toBanglaDigits, toBanglaNumber, toBanglaOrdinal, SEMESTER_MAP } from '../../utils/bangla';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { BottomSheet } from '../common/BottomSheet';

interface AcademicAnalysisPageProps {
  exams: Exam[];
  settings: SystemSettings | null;
  onViewResultCard?: (result: StudentResult) => void;
  onNavigateTab?: (tab: string) => void;
}

type ActiveAnalysisTab = 'overview' | 'subjects' | 'departments' | 'students';

interface SubjectAggregate {
  code: string;
  name: string;
  fullMarks: number;
  totalStudents: number;
  passedStudents: number;
  failedStudents: number;
  passRate: number;
  avgMarks: number;
  highestMarks: number;
  gradeDistribution: { [grade: string]: number };
}

interface DeptAggregate {
  departmentId: string;
  departmentName: string;
  totalStudents: number;
  passedStudents: number;
  failedStudents: number;
  passRate: number;
  avgGpa: number;
  aPlusCount: number;
  highestGpa: number;
}

interface SemesterAggregate {
  semesterId: SemesterId;
  semesterName: string;
  totalStudents: number;
  passedStudents: number;
  failedStudents: number;
  passRate: number;
  avgGpa: number;
  aPlusCount: number;
  highestGpa: number;
}

export const AcademicAnalysisPage: React.FC<AcademicAnalysisPageProps> = ({
  exams,
  settings,
  onViewResultCard,
  onNavigateTab,
}) => {
  // -------------------------------------------------------------
  // DATA STATES
  // -------------------------------------------------------------
  const [allResults, setAllResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveAnalysisTab>('overview');

  // -------------------------------------------------------------
  // FILTER STATES
  // -------------------------------------------------------------
  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('ALL');

  // Sheet States for Mobile Selection
  const [filterSheetType, setFilterSheetType] = useState<
    'exam' | 'year' | 'semester' | 'department' | 'subject' | null
  >(null);
  const [filterSearchQuery, setFilterSearchQuery] = useState('');

  // -------------------------------------------------------------
  // FETCH RESULTS FROM FIRESTORE
  // -------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getResults({ status: 'PUBLISHED' })
      .then((data) => {
        if (isMounted) {
          setAllResults(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error loading results for academic analysis:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // -------------------------------------------------------------
  // DYNAMIC FILTER OPTIONS EXTRACTION
  // -------------------------------------------------------------
  const publishedExams = useMemo(() => {
    return exams.filter((e) => e.status === 'PUBLISHED');
  }, [exams]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    allResults.forEach((r) => {
      if (r.examDate) {
        const y = r.examDate.split('-')[0];
        if (y && y.length === 4) years.add(y);
      }
    });
    publishedExams.forEach((e) => {
      if (e.academicYear) years.add(e.academicYear);
      if (e.examDate) {
        const y = e.examDate.split('-')[0];
        if (y && y.length === 4) years.add(y);
      }
    });
    return Array.from(years).sort().reverse();
  }, [allResults, publishedExams]);

  const availableDepartments = useMemo(() => {
    if (settings?.departments && settings.departments.length > 0) {
      return settings.departments;
    }
    const map = new Map<string, string>();
    allResults.forEach((r) => {
      if (r.departmentId && r.departmentName) {
        map.set(r.departmentId, r.departmentName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({
      id,
      name,
      code: id.toUpperCase(),
    }));
  }, [settings, allResults]);

  const availableSubjects = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    allResults.forEach((r) => {
      if (Array.isArray(r.subjects)) {
        r.subjects.forEach((s) => {
          if (s.subjectCode) {
            map.set(s.subjectCode, {
              code: s.subjectCode,
              name: s.subjectName || s.subjectCode,
            });
          }
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [allResults]);

  // -------------------------------------------------------------
  // FILTERING LOGIC
  // -------------------------------------------------------------
  const filteredResults = useMemo(() => {
    return allResults.filter((r) => {
      // 1. Exam Filter
      if (selectedExamId !== 'ALL' && r.examId !== selectedExamId) {
        return false;
      }
      // 2. Year Filter
      if (selectedYear !== 'ALL') {
        const rYear = r.examDate ? r.examDate.split('-')[0] : '';
        if (rYear !== selectedYear) return false;
      }
      // 3. Semester Filter
      if (selectedSemester !== 'ALL' && r.semesterId !== selectedSemester) {
        return false;
      }
      // 4. Department Filter
      if (selectedDepartment !== 'ALL' && r.departmentId !== selectedDepartment) {
        return false;
      }
      // 5. Subject Filter
      if (selectedSubjectCode !== 'ALL') {
        const hasSub = (r.subjects || []).some((s) => s.subjectCode === selectedSubjectCode);
        if (!hasSub) return false;
      }
      return true;
    });
  }, [
    allResults,
    selectedExamId,
    selectedYear,
    selectedSemester,
    selectedDepartment,
    selectedSubjectCode,
  ]);

  const hasActiveFilters =
    selectedExamId !== 'ALL' ||
    selectedYear !== 'ALL' ||
    selectedSemester !== 'ALL' ||
    selectedDepartment !== 'ALL' ||
    selectedSubjectCode !== 'ALL';

  const handleResetFilters = () => {
    setSelectedExamId('ALL');
    setSelectedYear('ALL');
    setSelectedSemester('ALL');
    setSelectedDepartment('ALL');
    setSelectedSubjectCode('ALL');
  };

  // -------------------------------------------------------------
  // COMPUTED STATISTICAL METRICS (KPIs)
  // -------------------------------------------------------------
  const metrics = useMemo(() => {
    const totalExaminees = filteredResults.length;
    if (totalExaminees === 0) {
      return {
        totalExaminees: 0,
        passedCount: 0,
        failedCount: 0,
        passRate: 0,
        aPlusCount: 0,
        aPlusRate: 0,
        avgGpa: 0,
        avgMarks: 0,
        highestGpa: 0,
        highestMarks: 0,
        highestScorer: null as StudentResult | null,
        topSemester: null as { name: string; rate: number } | null,
        topDepartment: null as { name: string; rate: number } | null,
        gradeDistribution: {
          'A+': 0,
          A: 0,
          'A-': 0,
          B: 0,
          C: 0,
          D: 0,
          F: 0,
        },
      };
    }

    let passedCount = 0;
    let failedCount = 0;
    let aPlusCount = 0;
    let gpaSum = 0;
    let marksSum = 0;
    let highestGpa = 0;
    let highestMarks = 0;
    let highestScorer: StudentResult | null = null;

    const gradeDistribution: { [grade: string]: number } = {
      'A+': 0,
      A: 0,
      'A-': 0,
      B: 0,
      C: 0,
      D: 0,
      F: 0,
    };

    filteredResults.forEach((r) => {
      if (r.isPassed && r.gpa > 0) {
        passedCount++;
      } else {
        failedCount++;
      }

      if (r.letterGrade === 'A+' || r.gpa === 4.0) {
        aPlusCount++;
      }

      // Grade tally
      const lg = r.letterGrade || (r.isPassed ? 'A' : 'F');
      if (gradeDistribution[lg] !== undefined) {
        gradeDistribution[lg]++;
      } else {
        gradeDistribution['F']++;
      }

      gpaSum += r.gpa || 0;
      marksSum += r.totalObtainedMarks || 0;

      if (r.gpa > highestGpa || (r.gpa === highestGpa && r.totalObtainedMarks > highestMarks)) {
        highestGpa = r.gpa;
        highestMarks = r.totalObtainedMarks;
        highestScorer = r;
      }
    });

    const passRate = totalExaminees > 0 ? (passedCount / totalExaminees) * 100 : 0;
    const aPlusRate = totalExaminees > 0 ? (aPlusCount / totalExaminees) * 100 : 0;
    const avgGpa = totalExaminees > 0 ? gpaSum / totalExaminees : 0;
    const avgMarks = totalExaminees > 0 ? marksSum / totalExaminees : 0;

    // Semester pass rates to find top semester
    const semMap = new Map<string, { total: number; passed: number; name: string }>();
    filteredResults.forEach((r) => {
      const sId = r.semesterId || '1';
      const sName = SEMESTER_MAP[sId] || `${toBanglaDigits(sId)} সেমিস্টার`;
      if (!semMap.has(sId)) {
        semMap.set(sId, { total: 0, passed: 0, name: sName });
      }
      const obj = semMap.get(sId)!;
      obj.total++;
      if (r.isPassed && r.gpa > 0) obj.passed++;
    });

    let topSemester: { name: string; rate: number } | null = null;
    let maxSemRate = -1;
    semMap.forEach((v) => {
      if (v.total >= 1) {
        const rate = (v.passed / v.total) * 100;
        if (rate > maxSemRate) {
          maxSemRate = rate;
          topSemester = { name: v.name, rate };
        }
      }
    });

    // Department pass rates to find top department
    const deptMap = new Map<string, { total: number; passed: number; name: string }>();
    filteredResults.forEach((r) => {
      const dId = r.departmentId || 'unknown';
      const dName = r.departmentName || dId.toUpperCase();
      if (!deptMap.has(dId)) {
        deptMap.set(dId, { total: 0, passed: 0, name: dName });
      }
      const obj = deptMap.get(dId)!;
      obj.total++;
      if (r.isPassed && r.gpa > 0) obj.passed++;
    });

    let topDepartment: { name: string; rate: number } | null = null;
    let maxDeptRate = -1;
    deptMap.forEach((v) => {
      if (v.total >= 1) {
        const rate = (v.passed / v.total) * 100;
        if (rate > maxDeptRate) {
          maxDeptRate = rate;
          topDepartment = { name: v.name, rate };
        }
      }
    });

    return {
      totalExaminees,
      passedCount,
      failedCount,
      passRate,
      aPlusCount,
      aPlusRate,
      avgGpa,
      avgMarks,
      highestGpa,
      highestMarks,
      highestScorer,
      topSemester,
      topDepartment,
      gradeDistribution,
    };
  }, [filteredResults]);

  // -------------------------------------------------------------
  // SUBJECT-WISE AGGREGATION
  // -------------------------------------------------------------
  const subjectAggregates: SubjectAggregate[] = useMemo(() => {
    const map = new Map<
      string,
      {
        code: string;
        name: string;
        fullMarks: number;
        total: number;
        passed: number;
        failed: number;
        marksSum: number;
        highestMarks: number;
        grades: { [g: string]: number };
      }
    >();

    filteredResults.forEach((r) => {
      if (Array.isArray(r.subjects)) {
        r.subjects.forEach((s) => {
          if (!s || !s.subjectCode) return;
          const code = s.subjectCode;
          if (!map.has(code)) {
            map.set(code, {
              code,
              name: s.subjectName || code,
              fullMarks: s.fullMarks || 45,
              total: 0,
              passed: 0,
              failed: 0,
              marksSum: 0,
              highestMarks: 0,
              grades: { 'A+': 0, A: 0, 'A-': 0, B: 0, C: 0, D: 0, F: 0 },
            });
          }
          const item = map.get(code)!;
          item.total++;
          const obtained = Number(s.obtainedMarks) || 0;
          item.marksSum += obtained;
          if (obtained > item.highestMarks) {
            item.highestMarks = obtained;
          }

          if (s.isPassed && s.grade !== 'F') {
            item.passed++;
          } else {
            item.failed++;
          }

          const g = s.grade || 'F';
          if (item.grades[g] !== undefined) {
            item.grades[g]++;
          } else {
            item.grades['F']++;
          }
        });
      }
    });

    return Array.from(map.values())
      .map((item) => ({
        code: item.code,
        name: item.name,
        fullMarks: item.fullMarks,
        totalStudents: item.total,
        passedStudents: item.passed,
        failedStudents: item.failed,
        passRate: item.total > 0 ? (item.passed / item.total) * 100 : 0,
        avgMarks: item.total > 0 ? item.marksSum / item.total : 0,
        highestMarks: item.highestMarks,
        gradeDistribution: item.grades,
      }))
      .sort((a, b) => b.passRate - a.passRate || b.avgMarks - a.avgMarks);
  }, [filteredResults]);

  // Strongest vs Weakest Subjects
  const strongestSubjects = useMemo(() => {
    return subjectAggregates.slice(0, 3);
  }, [subjectAggregates]);

  const weakestSubjects = useMemo(() => {
    return [...subjectAggregates].reverse().slice(0, 3);
  }, [subjectAggregates]);

  // -------------------------------------------------------------
  // DEPARTMENT & SEMESTER AGGREGATION
  // -------------------------------------------------------------
  const departmentAggregates: DeptAggregate[] = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        total: number;
        passed: number;
        failed: number;
        gpaSum: number;
        aPlus: number;
        highestGpa: number;
      }
    >();

    filteredResults.forEach((r) => {
      const id = r.departmentId || 'general';
      const name = r.departmentName || id.toUpperCase();
      if (!map.has(id)) {
        map.set(id, {
          id,
          name,
          total: 0,
          passed: 0,
          failed: 0,
          gpaSum: 0,
          aPlus: 0,
          highestGpa: 0,
        });
      }
      const item = map.get(id)!;
      item.total++;
      if (r.isPassed && r.gpa > 0) item.passed++;
      else item.failed++;

      if (r.letterGrade === 'A+' || r.gpa === 4.0) item.aPlus++;
      item.gpaSum += r.gpa || 0;
      if (r.gpa > item.highestGpa) item.highestGpa = r.gpa;
    });

    return Array.from(map.values())
      .map((item) => ({
        departmentId: item.id,
        departmentName: item.name,
        totalStudents: item.total,
        passedStudents: item.passed,
        failedStudents: item.failed,
        passRate: item.total > 0 ? (item.passed / item.total) * 100 : 0,
        avgGpa: item.total > 0 ? item.gpaSum / item.total : 0,
        aPlusCount: item.aPlus,
        highestGpa: item.highestGpa,
      }))
      .sort((a, b) => b.passRate - a.passRate || b.avgGpa - a.avgGpa);
  }, [filteredResults]);

  const semesterAggregates: SemesterAggregate[] = useMemo(() => {
    const map = new Map<
      SemesterId,
      {
        id: SemesterId;
        name: string;
        total: number;
        passed: number;
        failed: number;
        gpaSum: number;
        aPlus: number;
        highestGpa: number;
      }
    >();

    filteredResults.forEach((r) => {
      const id = (r.semesterId || '1') as SemesterId;
      const name = SEMESTER_MAP[id] || `${toBanglaDigits(id)} সেমিস্টার`;
      if (!map.has(id)) {
        map.set(id, {
          id,
          name,
          total: 0,
          passed: 0,
          failed: 0,
          gpaSum: 0,
          aPlus: 0,
          highestGpa: 0,
        });
      }
      const item = map.get(id)!;
      item.total++;
      if (r.isPassed && r.gpa > 0) item.passed++;
      else item.failed++;

      if (r.letterGrade === 'A+' || r.gpa === 4.0) item.aPlus++;
      item.gpaSum += r.gpa || 0;
      if (r.gpa > item.highestGpa) item.highestGpa = r.gpa;
    });

    return Array.from(map.values())
      .map((item) => ({
        semesterId: item.id,
        semesterName: item.name,
        totalStudents: item.total,
        passedStudents: item.passed,
        failedStudents: item.failed,
        passRate: item.total > 0 ? (item.passed / item.total) * 100 : 0,
        avgGpa: item.total > 0 ? item.gpaSum / item.total : 0,
        aPlusCount: item.aPlus,
        highestGpa: item.highestGpa,
      }))
      .sort((a, b) => Number(a.semesterId) - Number(b.semesterId));
  }, [filteredResults]);

  // -------------------------------------------------------------
  // TOP PERFORMING STUDENTS (LEADERBOARD)
  // -------------------------------------------------------------
  const topStudents = useMemo(() => {
    return [...filteredResults]
      .filter((r) => r.isPassed && r.gpa > 0)
      .sort((a, b) => {
        if (b.gpa !== a.gpa) return b.gpa - a.gpa;
        return (b.totalObtainedMarks || 0) - (a.totalObtainedMarks || 0);
      });
  }, [filteredResults]);

  // -------------------------------------------------------------
  // EXAM-BY-EXAM TREND & PROGRESSION
  // -------------------------------------------------------------
  const examProgression = useMemo(() => {
    const map = new Map<
      string,
      {
        examId: string;
        examTitle: string;
        examDate: string;
        total: number;
        passed: number;
        gpaSum: number;
      }
    >();

    allResults.forEach((r) => {
      const examId = r.examId || 'DEFAULT_EXAM';
      if (!map.has(examId)) {
        map.set(examId, {
          examId,
          examTitle: r.examTitle || 'পরীক্ষা',
          examDate: r.examDate || '',
          total: 0,
          passed: 0,
          gpaSum: 0,
        });
      }
      const item = map.get(examId)!;
      item.total++;
      if (r.isPassed && r.gpa > 0) item.passed++;
      item.gpaSum += r.gpa || 0;
    });

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        passRate: item.total > 0 ? (item.passed / item.total) * 100 : 0,
        avgGpa: item.total > 0 ? item.gpaSum / item.total : 0,
      }))
      .sort((a, b) => a.examDate.localeCompare(b.examDate));
  }, [allResults]);

  // Print Summary
  const handlePrintSummary = () => {
    printElementById('printable-academic-analysis-report', {
      title: 'DPIB_ACADEMIC_ANALYSIS_REPORT',
      orientation: 'landscape',
    });
  };

  if (loading) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-4 font-bengali">
        <LoadingSpinner size="lg" message="একাডেমিক ফলাফল এনালাইসিস লোড হচ্ছে..." />
      </div>
    );
  }

  return (
    <div id="printable-academic-analysis-report" className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10 font-bengali text-slate-800 space-y-8">
      {/* ================= HEADER SECTION ================= */}
      <div className="relative bg-gradient-to-br from-blue-600 via-sky-600 to-blue-700 text-white rounded-3xl p-6 sm:p-10 shadow-lg overflow-hidden border border-blue-400/30">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-300/10 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-bold font-outfit uppercase tracking-wider mb-3.5 shadow-2xs">
              <BarChart3 className="w-4 h-4 text-sky-200" />
              <span>ACADEMIC ANALYTICS HUB</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              একাডেমিক এনালাইসিস
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-sky-100 font-medium mt-2.5 max-w-xl leading-relaxed">
              দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউটের প্রকাশিত ফলাফল থেকে প্রস্তুতকৃত রিয়েল-টাইম প্রাতিষ্ঠানিক পরিসংখ্যান, পাসের হার, গ্রেড বণ্টন ও পারফরম্যান্স মেট্রিক্স।
            </p>
          </div>

          {/* Action Tools */}
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 self-start md:self-center">
            <button
              id="btn-print-analysis"
              type="button"
              onClick={handlePrintSummary}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/30 rounded-2xl text-xs sm:text-sm font-bold backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>রিপোর্ট প্রিন্ট</span>
            </button>

            <div className="px-4 py-2 bg-white/10 border border-white/20 rounded-2xl text-xs font-semibold text-sky-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>লাইভ ডাটা সিঙ্ক</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= FILTER TOOLBAR (MODERN SLIDING FILTER SYSTEM) ================= */}
      <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-200/90 p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Filter Labels & Reset Button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Filter className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-slate-800">
                ফিল্টার নির্বাচন
              </span>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                {toBanglaDigits(filteredResults.length)} জন পরীক্ষার্থী
              </span>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="lg:hidden text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>রিসেট</span>
              </button>
            )}
          </div>

          {/* Filter Buttons Triggering Bottom Sliding Sheets */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap items-center gap-2">
            {/* 1. Exam Filter */}
            <button
              id="filter-exam-btn"
              type="button"
              onClick={() => {
                setFilterSearchQuery('');
                setFilterSheetType('exam');
              }}
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                selectedExamId !== 'ALL'
                  ? 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-300'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">
                  {selectedExamId === 'ALL'
                    ? 'সকল পরীক্ষা'
                    : publishedExams.find((e) => e.id === selectedExamId)?.title || 'পরীক্ষা'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* 2. Academic Year Filter */}
            <button
              id="filter-year-btn"
              type="button"
              onClick={() => {
                setFilterSearchQuery('');
                setFilterSheetType('year');
              }}
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                selectedYear !== 'ALL'
                  ? 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-300'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  {selectedYear === 'ALL' ? 'সকল বছর' : `${toBanglaDigits(selectedYear)} সন`}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* 3. Semester Filter */}
            <button
              id="filter-semester-btn"
              type="button"
              onClick={() => {
                setFilterSearchQuery('');
                setFilterSheetType('semester');
              }}
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                selectedSemester !== 'ALL'
                  ? 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-300'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Layers className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">
                  {selectedSemester === 'ALL'
                    ? 'সকল সেমিস্টার'
                    : SEMESTER_MAP[selectedSemester] || `${toBanglaDigits(selectedSemester)} সেমিস্টার`}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* 4. Department / Technology Filter */}
            <button
              id="filter-department-btn"
              type="button"
              onClick={() => {
                setFilterSearchQuery('');
                setFilterSheetType('department');
              }}
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                selectedDepartment !== 'ALL'
                  ? 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-300'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Cpu className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">
                  {selectedDepartment === 'ALL'
                    ? 'সকল টেকনোলজি'
                    : availableDepartments.find((d) => d.id === selectedDepartment)?.name || 'টেকনোলজি'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* 5. Subject Filter */}
            <button
              id="filter-subject-btn"
              type="button"
              onClick={() => {
                setFilterSearchQuery('');
                setFilterSheetType('subject');
              }}
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer col-span-2 sm:col-span-1 ${
                selectedSubjectCode !== 'ALL'
                  ? 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-300'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <BookMarked className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="truncate">
                  {selectedSubjectCode === 'ALL'
                    ? 'সকল বিষয়'
                    : availableSubjects.find((s) => s.code === selectedSubjectCode)?.name || selectedSubjectCode}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Desktop Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="সকল ফিল্টার মুছুন"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>রিসেট</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= EMPTY STATE IF NO RESULTS ================= */}
      {filteredResults.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
          <EmptyState
            title="কোনো ফলাফল পাওয়া যায়নি"
            description="নির্বাচিত ফিল্টারের আওতায় কোনো প্রকাশিত ফলাফল রেকর্ড বিদ্যমান নেই। অনুগ্রহ করে ফিল্টার পরিবর্তন বা রিসেট করে পুনরায় চেষ্টা করুন।"
            icon={Search}
            actionLabel="সকল ফিল্টার রিসেট করুন"
            onAction={handleResetFilters}
          />
        </div>
      ) : (
        <>
          {/* ================= PRIMARY KEY STATISTICS CARDS (KPIs) ================= */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. মোট পরীক্ষার্থী */}
            <div className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase font-outfit">
                  EXAMINEES
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold">মোট পরীক্ষার্থী</p>
              <h3 className="text-xl sm:text-3xl font-black text-slate-900 mt-1">
                {toBanglaDigits(metrics.totalExaminees)}{' '}
                <span className="text-xs sm:text-sm font-bold text-slate-500">জন</span>
              </h3>
            </div>

            {/* 2. উত্তীর্ণ ও অনুত্তীর্ণ */}
            <div className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase font-outfit">
                  PASSED / FAILED
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold">উত্তীর্ণ ও অনুত্তীর্ণ</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl sm:text-3xl font-black text-emerald-600">
                  {toBanglaDigits(metrics.passedCount)}
                </span>
                <span className="text-xs text-slate-400 font-bold">/</span>
                <span className="text-base sm:text-lg font-bold text-rose-500">
                  {toBanglaDigits(metrics.failedCount)}
                </span>
              </div>
            </div>

            {/* 3. পাসের হার */}
            <div className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                  <Percent className="w-5 h-5" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-sky-600 uppercase font-outfit">
                  PASS RATE
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold">পাসের হার</p>
              <h3 className="text-xl sm:text-3xl font-black text-sky-600 mt-1">
                {toBanglaNumber(metrics.passRate, 1)}%
              </h3>
              {/* Mini progress bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, metrics.passRate)}%` }}
                />
              </div>
            </div>

            {/* 4. A+ প্রাপ্ত শিক্ষার্থী */}
            <div className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-amber-600 uppercase font-outfit">
                  GRADE A+
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold">A+ প্রাপ্ত শিক্ষার্থী</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-xl sm:text-3xl font-black text-amber-600">
                  {toBanglaDigits(metrics.aPlusCount)}
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  ({toBanglaNumber(metrics.aPlusRate, 1)}%)
                </span>
              </div>
            </div>

            {/* 5. গড় নম্বর ও GPA */}
            <div className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-indigo-600 uppercase font-outfit">
                  AVG GPA
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold">গড় নম্বর ও GPA</p>
              <h3 className="text-xl sm:text-3xl font-black text-indigo-700 mt-1">
                {toBanglaNumber(metrics.avgGpa, 2)}{' '}
                <span className="text-xs font-bold text-slate-400">/ ৪.০০</span>
              </h3>
            </div>

            {/* 6. সর্বোচ্চ ফলাফল */}
            <div className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                  <Trophy className="w-5 h-5" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-teal-600 uppercase font-outfit">
                  TOP SCORE
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold">সর্বোচ্চ ফলাফল</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-xl sm:text-3xl font-black text-teal-700">
                  {toBanglaNumber(metrics.highestGpa, 2)}
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  (নম্বর {toBanglaDigits(metrics.highestMarks)})
                </span>
              </div>
            </div>

            {/* 7. সেরা সেমিস্টার */}
            <div className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                  <Compass className="w-5 h-5" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-purple-600 uppercase font-outfit">
                  TOP SEMESTER
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold">সেরা সেমিস্টার</p>
              <h3 className="text-base sm:text-lg font-black text-purple-900 mt-1 truncate">
                {metrics.topSemester ? metrics.topSemester.name : 'প্রযোজ্য নয়'}
              </h3>
              {metrics.topSemester && (
                <p className="text-[11px] font-bold text-purple-700 mt-0.5">
                  পাসের হার {toBanglaNumber(metrics.topSemester.rate, 1)}%
                </p>
              )}
            </div>

            {/* 8. সেরা টেকনোলজি */}
            <div className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-blue-700 uppercase font-outfit">
                  TOP TECH
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold">সেরা টেকনোলজি</p>
              <h3 className="text-base sm:text-lg font-black text-blue-950 mt-1 truncate">
                {metrics.topDepartment ? metrics.topDepartment.name : 'প্রযোজ্য নয়'}
              </h3>
              {metrics.topDepartment && (
                <p className="text-[11px] font-bold text-blue-600 mt-0.5">
                  পাসের হার {toBanglaNumber(metrics.topDepartment.rate, 1)}%
                </p>
              )}
            </div>
          </div>

          {/* ================= SUB-NAVIGATION TABS ================= */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto scrollbar-none">
            <button
              id="analysis-tab-overview"
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>সারসংক্ষেপ ও চার্ট</span>
            </button>

            <button
              id="analysis-tab-subjects"
              type="button"
              onClick={() => setActiveTab('subjects')}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'subjects'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <BookMarked className="w-4 h-4" />
              <span>বিষয়ভিত্তিক ফলাফল</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-white/20 font-bold">
                {toBanglaDigits(subjectAggregates.length)}
              </span>
            </button>

            <button
              id="analysis-tab-departments"
              type="button"
              onClick={() => setActiveTab('departments')}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'departments'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>টেকনোলজি ও সেমিস্টার</span>
            </button>

            <button
              id="analysis-tab-students"
              type="button"
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'students'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>শীর্ষ মেধাবী শিক্ষার্থী</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-white/20 font-bold">
                {toBanglaDigits(topStudents.length)}
              </span>
            </button>
          </div>

          {/* ================= TAB 1: OVERVIEW & CHARTS ================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6 sm:space-y-8">
              {/* Top Row: Grade Distribution & Pass Ratio */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. গ্রেডের বণ্টন (Grade Distribution Visual Chart) */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        <span>গ্রেডের বণ্টন ও পরিসংখ্যান</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        সকল পরীক্ষার্থীর অর্জিত লেটার গ্রেডের আনুপাতিক চিত্র
                      </p>
                    </div>
                  </div>

                  {/* Visual Horizontal Bars for Each Grade */}
                  <div className="space-y-4">
                    {[
                      { grade: 'A+', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
                      { grade: 'A', color: 'bg-teal-500', text: 'text-teal-700', bg: 'bg-teal-50' },
                      { grade: 'A-', color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
                      { grade: 'B', color: 'bg-indigo-500', text: 'text-indigo-700', bg: 'bg-indigo-50' },
                      { grade: 'C', color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
                      { grade: 'D', color: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50' },
                      { grade: 'F', color: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' },
                    ].map((gItem) => {
                      const count = metrics.gradeDistribution[gItem.grade] || 0;
                      const pct = metrics.totalExaminees > 0 ? (count / metrics.totalExaminees) * 100 : 0;
                      return (
                        <div key={gItem.grade} className="flex items-center gap-3">
                          <div className="w-12 text-center">
                            <span className="text-xs font-black px-2 py-1 rounded-lg bg-slate-100 text-slate-800 font-outfit uppercase">
                              {gItem.grade}
                            </span>
                          </div>

                          <div className="flex-1 bg-slate-100 h-5 rounded-full overflow-hidden relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className={`h-full ${gItem.color} rounded-full`}
                            />
                          </div>

                          <div className="w-24 text-right">
                            <span className="text-xs font-black text-slate-800">
                              {toBanglaDigits(count)} জন
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold ml-1.5">
                              ({toBanglaNumber(pct, 1)}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. পাস বনাম ফেল অনুপাত ও সেরা শিক্ষার্থী হাইলাইট */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-sky-600" />
                      <span>পাস বনাম রেফার্ড অনুপাত</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      প্রাতিষ্ঠানিক উত্তীর্ণের হার
                    </p>

                    {/* Circular Style Summary Card */}
                    <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50/50 border border-sky-100 flex flex-col items-center text-center">
                      <div className="w-24 h-24 rounded-full border-4 border-sky-400/40 bg-white flex flex-col items-center justify-center shadow-xs">
                        <span className="text-2xl font-black text-sky-700 leading-none">
                          {toBanglaNumber(metrics.passRate, 1)}%
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 mt-1">পাস রেট</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 w-full mt-5 pt-4 border-t border-sky-200/60">
                        <div>
                          <p className="text-[11px] font-bold text-emerald-700">সব বিষয়ে পাস</p>
                          <p className="text-lg font-black text-emerald-800">
                            {toBanglaDigits(metrics.passedCount)} জন
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-rose-700">রেফার্ড/ফেল</p>
                          <p className="text-lg font-black text-rose-800">
                            {toBanglaDigits(metrics.failedCount)} জন
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Performer Quick Callout */}
                  {metrics.highestScorer && (
                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                      <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                        <Trophy className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>শীর্ষ স্থান অধিকারী</span>
                      </div>
                      <p className="text-sm font-black text-slate-900 mt-1 truncate">
                        {metrics.highestScorer.studentName}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        রোল: {toBanglaDigits(metrics.highestScorer.roll)} | GPA:{' '}
                        <span className="font-bold text-emerald-700">
                          {toBanglaNumber(metrics.highestScorer.gpa, 2)}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Strongest & Weakest Subjects Radar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* সেরা ৩টি বিষয় (Highest Pass Rate) */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                  <div className="flex items-center gap-2 mb-4 text-emerald-700">
                    <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-sm sm:text-base font-black text-slate-900">
                      সেরা পারফর্ম করা বিষয়সমূহ
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {strongestSubjects.length === 0 ? (
                      <p className="text-xs text-slate-400">কোনো তথ্য নেই</p>
                    ) : (
                      strongestSubjects.map((sub, idx) => (
                        <div
                          key={sub.code}
                          className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between"
                        >
                          <div>
                            <span className="text-[10px] font-bold text-emerald-700 font-outfit uppercase">
                              CODE {toBanglaDigits(sub.code)}
                            </span>
                            <h5 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                              {sub.name}
                            </h5>
                            <p className="text-[11px] text-slate-500">
                              গড় নম্বর: {toBanglaNumber(sub.avgMarks, 1)} / {toBanglaDigits(sub.fullMarks)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-black text-xs">
                              {toBanglaNumber(sub.passRate, 1)}% পাস
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* তুলনামূলক দুর্বল বিষয়সমূহ (Lowest Pass Rate) */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                  <div className="flex items-center gap-2 mb-4 text-rose-700">
                    <ArrowDownRight className="w-5 h-5 text-rose-600" />
                    <h4 className="text-sm sm:text-base font-black text-slate-900">
                      অতিরিক্ত মনোযোগ প্রয়োজন এমন বিষয়সমূহ
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {weakestSubjects.length === 0 ? (
                      <p className="text-xs text-slate-400">কোনো তথ্য নেই</p>
                    ) : (
                      weakestSubjects.map((sub, idx) => (
                        <div
                          key={sub.code}
                          className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-center justify-between"
                        >
                          <div>
                            <span className="text-[10px] font-bold text-rose-700 font-outfit uppercase">
                              CODE {toBanglaDigits(sub.code)}
                            </span>
                            <h5 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                              {sub.name}
                            </h5>
                            <p className="text-[11px] text-slate-500">
                              ফেল: {toBanglaDigits(sub.failedStudents)} জন | গড় নম্বর:{' '}
                              {toBanglaNumber(sub.avgMarks, 1)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="px-2.5 py-1 rounded-xl bg-rose-600 text-white font-black text-xs">
                              {toBanglaNumber(sub.passRate, 1)}% পাস
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* পরীক্ষাভিত্তিক পরিবর্তন ও অগ্রগতি টাইমলাইন */}
              {examProgression.length > 1 && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span>পরীক্ষাভিত্তিক ফলাফলের পরিবর্তন ও প্রবণতা</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {examProgression.map((ep) => (
                      <div
                        key={ep.examId}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:border-blue-300 transition-all"
                      >
                        <span className="text-[10px] text-slate-400 font-bold uppercase font-outfit">
                          {ep.examDate || 'EXAM'}
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 truncate">
                          {ep.examTitle}
                        </h4>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                          <div>
                            <span className="text-[11px] text-slate-500 font-semibold">পাসের হার</span>
                            <p className="text-sm font-black text-blue-600">
                              {toBanglaNumber(ep.passRate, 1)}%
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] text-slate-500 font-semibold">গড় GPA</span>
                            <p className="text-sm font-black text-indigo-700">
                              {toBanglaNumber(ep.avgGpa, 2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: SUBJECT-WISE IN-DEPTH BREAKDOWN ================= */}
          {activeTab === 'subjects' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <BookMarked className="w-5 h-5 text-purple-600" />
                      <span>বিষয়ভিত্তিক ফলাফল ও বিশ্লেষণ</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      প্রতিটি বিষয়ের মোট পরীক্ষার্থী, উত্তীর্ণ, ফেল, পাসের হার ও সর্বোচ্চ নম্বর
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full self-start sm:self-auto">
                    মোট {toBanglaDigits(subjectAggregates.length)}টি বিষয়
                  </span>
                </div>

                {/* Table / Grid for Subjects */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm font-bengali">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-y border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">কোড ও বিষয়ের নাম</th>
                        <th className="py-3 px-3 text-center">পূর্ণমান</th>
                        <th className="py-3 px-3 text-center">পরীক্ষার্থী</th>
                        <th className="py-3 px-3 text-center">উত্তীর্ণ</th>
                        <th className="py-3 px-3 text-center">রেফার্ড</th>
                        <th className="py-3 px-4 text-center">পাসের হার</th>
                        <th className="py-3 px-3 text-center">গড় নম্বর</th>
                        <th className="py-3 px-3 text-center">সর্বোচ্চ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {subjectAggregates.map((sub) => (
                        <tr key={sub.code} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-outfit uppercase mr-2">
                              {sub.code}
                            </span>
                            <span>{sub.name}</span>
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-slate-600">
                            {toBanglaDigits(sub.fullMarks)}
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                            {toBanglaDigits(sub.totalStudents)}
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-emerald-600">
                            {toBanglaDigits(sub.passedStudents)}
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-rose-500">
                            {toBanglaDigits(sub.failedStudents)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex flex-col items-center">
                              <span
                                className={`font-black text-xs ${
                                  sub.passRate >= 80
                                    ? 'text-emerald-600'
                                    : sub.passRate >= 50
                                    ? 'text-amber-600'
                                    : 'text-rose-600'
                                }`}
                              >
                                {toBanglaNumber(sub.passRate, 1)}%
                              </span>
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    sub.passRate >= 80
                                      ? 'bg-emerald-500'
                                      : sub.passRate >= 50
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(100, sub.passRate)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-indigo-700">
                            {toBanglaNumber(sub.avgMarks, 1)}
                          </td>
                          <td className="py-3.5 px-3 text-center font-black text-teal-700">
                            {toBanglaDigits(sub.highestMarks)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: DEPARTMENT & SEMESTER ANALYTICS ================= */}
          {activeTab === 'departments' && (
            <div className="space-y-8">
              {/* 1. টেকনোলজিভিত্তিক ফলাফল (Technology Breakdown) */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-indigo-600" />
                      <span>টেকনোলজিভিত্তিক ফলাফলের তুলনা</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      প্রতিটি টেকনোলজির মোট পরীক্ষার্থী, পাসের হার, গড় GPA ও A+ সংখ্যা
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departmentAggregates.map((dept) => (
                    <div
                      key={dept.departmentId}
                      className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 hover:border-indigo-300 hover:shadow-xs transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase font-outfit">
                          {dept.departmentId.toUpperCase()}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                          পাস {toBanglaNumber(dept.passRate, 1)}%
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-black text-slate-900 mt-1 truncate">
                        {dept.departmentName}
                      </h4>

                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200 text-center">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500">পরীক্ষার্থী</span>
                          <p className="text-sm font-black text-slate-800">
                            {toBanglaDigits(dept.totalStudents)}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-500">গড় GPA</span>
                          <p className="text-sm font-black text-indigo-700">
                            {toBanglaNumber(dept.avgGpa, 2)}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-500">A+ প্রাপ্ত</span>
                          <p className="text-sm font-black text-amber-600">
                            {toBanglaDigits(dept.aPlusCount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. সেমিস্টারভিত্তিক ফলাফল (Semester Breakdown) */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-amber-600" />
                      <span>সেমিস্টারভিত্তিক ফলাফলের তুলনা</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ১ম থেকে ৮ম সেমিস্টারের সামগ্রিক ফলাফল বিশ্লেষণ
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {semesterAggregates.map((sem) => (
                    <div
                      key={sem.semesterId}
                      className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 hover:border-amber-300 hover:shadow-xs transition-all"
                    >
                      <span className="text-[10px] font-bold text-amber-600 uppercase font-outfit">
                        SEMESTER {toBanglaDigits(sem.semesterId)}
                      </span>
                      <h4 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                        {sem.semesterName}
                      </h4>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-bold">পাসের হার:</span>
                          <span className="font-black text-emerald-600">
                            {toBanglaNumber(sem.passRate, 1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-bold">গড় GPA:</span>
                          <span className="font-black text-indigo-700">
                            {toBanglaNumber(sem.avgGpa, 2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-bold">পরীক্ষার্থী:</span>
                          <span className="font-bold text-slate-800">
                            {toBanglaDigits(sem.totalStudents)} জন
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: MERIT LEADERBOARD ================= */}
          {activeTab === 'students' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span>সর্বোচ্চ ফলাফলকারী শিক্ষার্থীদের তালিকা</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    অর্জিত GPA ও প্রাপ্ত মোট নম্বরের ক্রমানুসারে সাজানো মেধা তালিকা
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full self-start sm:self-auto">
                  মোট {toBanglaDigits(topStudents.length)} জন মেধা তালিকায়
                </span>
              </div>

              {topStudents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  কোনো উত্তীর্ণ শিক্ষার্থীর রেকর্ড পাওয়া যায়নি।
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm font-bengali">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-y border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4 text-center">স্থান</th>
                        <th className="py-3 px-4">শিক্ষার্থীর নাম</th>
                        <th className="py-3 px-3 text-center">রোল</th>
                        <th className="py-3 px-4">টেকনোলজি</th>
                        <th className="py-3 px-3 text-center">সেমিস্টার</th>
                        <th className="py-3 px-3 text-center">GPA</th>
                        <th className="py-3 px-3 text-center">প্রাপ্ত নম্বর</th>
                        {onViewResultCard && <th className="py-3 px-3 text-center">মার্কশিট</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {topStudents.map((res, idx) => {
                        const rank = idx + 1;
                        return (
                          <tr key={res.id || idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 text-center">
                              {rank === 1 ? (
                                <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs inline-flex items-center justify-center shadow-xs">
                                  ১
                                </span>
                              ) : rank === 2 ? (
                                <span className="w-6 h-6 rounded-full bg-slate-400 text-white font-black text-xs inline-flex items-center justify-center shadow-xs">
                                  ২
                                </span>
                              ) : rank === 3 ? (
                                <span className="w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs inline-flex items-center justify-center shadow-xs">
                                  ৩
                                </span>
                              ) : (
                                <span className="font-bold text-slate-600">
                                  {toBanglaDigits(rank)}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              {res.studentName}
                            </td>
                            <td className="py-3.5 px-3 text-center font-bold text-slate-700 font-outfit">
                              {toBanglaDigits(res.roll)}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 truncate max-w-[150px]">
                              {res.departmentName}
                            </td>
                            <td className="py-3.5 px-3 text-center text-slate-600">
                              {SEMESTER_MAP[res.semesterId] || `${toBanglaDigits(res.semesterId)}ম`}
                            </td>
                            <td className="py-3.5 px-3 text-center font-black text-emerald-600">
                              {toBanglaNumber(res.gpa, 2)}
                            </td>
                            <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                              {toBanglaDigits(res.totalObtainedMarks)} / {toBanglaDigits(res.totalFullMarks)}
                            </td>
                            {onViewResultCard && (
                              <td className="py-3.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => onViewResultCard(res)}
                                  className="p-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                                  title="মার্কশিট দেখুন"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ================= BOTTOM SLIDING SHEETS FOR FILTERS ================= */}
      {/* 1. EXAM SELECTOR SHEET */}
      <BottomSheet
        isOpen={filterSheetType === 'exam'}
        onClose={() => setFilterSheetType(null)}
        title="পরীক্ষা নির্বাচন করুন"
        subtitle="নির্দিষ্ট পরীক্ষার ফলাফল এনালাইসিস ফিল্টার"
      >
        <div className="space-y-2 pb-6 font-bengali">
          <button
            type="button"
            onClick={() => {
              setSelectedExamId('ALL');
              setFilterSheetType(null);
            }}
            className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between font-bold text-xs sm:text-sm cursor-pointer transition-all ${
              selectedExamId === 'ALL'
                ? 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-300'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <span>সকল পরীক্ষা (সম্মিলিত এনালাইসিস)</span>
            {selectedExamId === 'ALL' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
          </button>

          {publishedExams.map((exam) => (
            <button
              key={exam.id}
              type="button"
              onClick={() => {
                setSelectedExamId(exam.id);
                setFilterSheetType(null);
              }}
              className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between font-bold text-xs sm:text-sm cursor-pointer transition-all ${
                selectedExamId === exam.id
                  ? 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-300'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div>
                <p className="text-slate-900">{exam.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {exam.departmentName} | {SEMESTER_MAP[exam.semesterId] || exam.semesterId}
                </p>
              </div>
              {selectedExamId === exam.id && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* 2. YEAR SELECTOR SHEET */}
      <BottomSheet
        isOpen={filterSheetType === 'year'}
        onClose={() => setFilterSheetType(null)}
        title="শিক্ষাবর্ষ নির্বাচন করুন"
        subtitle="পরীক্ষার বছরভিত্তিক ফিল্টার"
      >
        <div className="space-y-2 pb-6 font-bengali">
          <button
            type="button"
            onClick={() => {
              setSelectedYear('ALL');
              setFilterSheetType(null);
            }}
            className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between font-bold text-xs sm:text-sm cursor-pointer transition-all ${
              selectedYear === 'ALL'
                ? 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-300'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <span>সকল শিক্ষাবর্ষ</span>
            {selectedYear === 'ALL' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
          </button>

          {availableYears.map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => {
                setSelectedYear(yr);
                setFilterSheetType(null);
              }}
              className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between font-bold text-xs sm:text-sm cursor-pointer transition-all ${
                selectedYear === yr
                  ? 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-300'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <span>{toBanglaDigits(yr)} শিক্ষাবর্ষ</span>
              {selectedYear === yr && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* 3. SEMESTER SELECTOR SHEET */}
      <BottomSheet
        isOpen={filterSheetType === 'semester'}
        onClose={() => setFilterSheetType(null)}
        title="সেমিস্টার নির্বাচন করুন"
        subtitle="১ম থেকে ৮ম সেমিস্টার ফিল্টার"
      >
        <div className="space-y-2 pb-6 font-bengali">
          <button
            type="button"
            onClick={() => {
              setSelectedSemester('ALL');
              setFilterSheetType(null);
            }}
            className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between font-bold text-xs sm:text-sm cursor-pointer transition-all ${
              selectedSemester === 'ALL'
                ? 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-300'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <span>সকল সেমিস্টার</span>
            {selectedSemester === 'ALL' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
          </button>

          {(['1', '2', '3', '4', '5', '6', '7', '8'] as SemesterId[]).map((sId) => (
            <button
              key={sId}
              type="button"
              onClick={() => {
                setSelectedSemester(sId);
                setFilterSheetType(null);
              }}
              className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between font-bold text-xs sm:text-sm cursor-pointer transition-all ${
                selectedSemester === sId
                  ? 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-300'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <span>{SEMESTER_MAP[sId]}</span>
              {selectedSemester === sId && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* 4. DEPARTMENT SELECTOR SHEET */}
      <BottomSheet
        isOpen={filterSheetType === 'department'}
        onClose={() => setFilterSheetType(null)}
        title="টেকনোলজি নির্বাচন করুন"
        subtitle="ডিপার্টমেন্টভিত্তিক ফিল্টার"
      >
        <div className="space-y-2 pb-6 font-bengali">
          <button
            type="button"
            onClick={() => {
              setSelectedDepartment('ALL');
              setFilterSheetType(null);
            }}
            className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between font-bold text-xs sm:text-sm cursor-pointer transition-all ${
              selectedDepartment === 'ALL'
                ? 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-300'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <span>সকল টেকনোলজি</span>
            {selectedDepartment === 'ALL' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
          </button>

          {availableDepartments.map((dept) => (
            <button
              key={dept.id}
              type="button"
              onClick={() => {
                setSelectedDepartment(dept.id);
                setFilterSheetType(null);
              }}
              className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between font-bold text-xs sm:text-sm cursor-pointer transition-all ${
                selectedDepartment === dept.id
                  ? 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-300'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div>
                <p className="text-slate-900">{dept.name}</p>
                <p className="text-[11px] text-slate-500 font-outfit uppercase">{dept.code}</p>
              </div>
              {selectedDepartment === dept.id && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* 5. SUBJECT SELECTOR SHEET */}
      <BottomSheet
        isOpen={filterSheetType === 'subject'}
        onClose={() => setFilterSheetType(null)}
        title="বিষয় নির্বাচন করুন"
        subtitle="বিষয়ভিত্তিক বিশ্লেষণ ফিল্টার"
      >
        <div className="space-y-3 pb-6 font-bengali">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="বিষয়ের নাম বা কোড খুঁজুন..."
              value={filterSearchQuery}
              onChange={(e) => setFilterSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            <button
              type="button"
              onClick={() => {
                setSelectedSubjectCode('ALL');
                setFilterSheetType(null);
              }}
              className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between font-bold text-xs cursor-pointer transition-all ${
                selectedSubjectCode === 'ALL'
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <span>সকল বিষয়</span>
              {selectedSubjectCode === 'ALL' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
            </button>

            {availableSubjects
              .filter((s) => {
                if (!filterSearchQuery) return true;
                const q = filterSearchQuery.toLowerCase();
                return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
              })
              .map((sub) => (
                <button
                  key={sub.code}
                  type="button"
                  onClick={() => {
                    setSelectedSubjectCode(sub.code);
                    setFilterSheetType(null);
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between font-bold text-xs cursor-pointer transition-all ${
                    selectedSubjectCode === sub.code
                      ? 'bg-blue-50 text-blue-700 border-blue-300'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div>
                    <span className="text-slate-900">{sub.name}</span>
                    <span className="text-[10px] text-slate-400 font-outfit uppercase ml-2">
                      ({sub.code})
                    </span>
                  </div>
                  {selectedSubjectCode === sub.code && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
