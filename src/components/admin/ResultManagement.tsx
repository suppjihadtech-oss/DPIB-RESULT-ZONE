import React, { useState, useEffect } from 'react';
import {
  Upload,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Download,
  FileCode,
  Layers,
  Sparkles,
  AlertCircle,
  Clock,
  ArrowRight,
  Check,
  BookOpen,
  Calendar,
  Building,
  GraduationCap,
  RefreshCw,
  AlertTriangle,
  X,
  ChevronRight,
  ChevronLeft,
  Edit3,
  User,
  Award,
  Hash,
  CalendarDays,
} from 'lucide-react';
import {
  Exam,
  Department,
  StudentResult,
  SemesterId,
  SubjectResult,
  Student,
} from '../../types';
import {
  getResults,
  getStudents,
  saveStudentResult,
  batchSaveResults,
  deleteResult,
  deleteAllResults,
  updateResultStatus,
  saveExam,
} from '../../services/db';
import { calculateResultGrades, calculateSubjectGrade } from '../../services/grading';
import {
  parseJsonResults,
  generateSampleJson,
  ValidationReport,
} from '../../services/excel';
import {
  toBanglaDigits,
  toBanglaNumber,
  SEMESTER_MAP,
  toEnglishDigits,
} from '../../utils/bangla';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { LoadingOverlay } from '../common/LoadingOverlay';
import { BottomSheet } from '../common/BottomSheet';
import { ResultBottomSheet } from '../public/ResultBottomSheet';
import { SelectBottomSheet, SelectTrigger, SelectOption } from '../common/SelectBottomSheet';

interface ResultManagementProps {
  exams: Exam[];
  departments: Department[];
  onRefreshStats?: () => void;
}

export const ResultManagement: React.FC<ResultManagementProps> = ({
  exams,
  departments,
  onRefreshStats,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection Bottom Sheets for Filters
  const [examFilterSheetOpen, setExamFilterSheetOpen] = useState(false);
  const [deptFilterSheetOpen, setDeptFilterSheetOpen] = useState(false);
  const [statusFilterSheetOpen, setStatusFilterSheetOpen] = useState(false);

  // Modals & Bottom Sheets
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [manualSheetOpen, setManualSheetOpen] = useState(false);
  const [previewResult, setPreviewResult] = useState<StudentResult | null>(null);

  // Upload Workflow state:
  // Step 1: JSON Input & Validation
  // Step 2: Validation & Detected Exam Preview
  // Step 3: Confirmation & Batch Publish
  const [uploadPublishStatus, setUploadPublishStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');
  const [uploadPublishSheetOpen, setUploadPublishSheetOpen] = useState(false);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  
  // Parsed and validated data
  const [uploadStep, setUploadStep] = useState<'FILE' | 'PREVIEW' | 'CONFIRM'>('FILE');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [parsedReport, setParsedReport] = useState<ValidationReport | null>(null);
  const [previewTabMode, setPreviewTabMode] = useState<'PROCESSED' | 'RAW'>('PROCESSED');
  const [parsedPreviewList, setParsedPreviewList] = useState<StudentResult[]>([]);
  const [detectedExam, setDetectedExam] = useState<Exam | null>(null);
  const [isAutoCreatedExam, setIsAutoCreatedExam] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [uploadSuccessSummary, setUploadSuccessSummary] = useState<string | null>(null);
  const [jsonInputText, setJsonInputText] = useState('');
  const [selectedOverrideExamId, setSelectedOverrideExamId] = useState<string>('AUTO');
  const [overrideExamSheetOpen, setOverrideExamSheetOpen] = useState(false);

  // Delete State
  const [deleteConfirmResult, setDeleteConfirmResult] = useState<StudentResult | null>(null);
  const [isDeletingResult, setIsDeletingResult] = useState<boolean>(false);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState<boolean>(false);
  const [isDeletingAll, setIsDeletingAll] = useState<boolean>(false);
  const [deleteAllScope, setDeleteAllScope] = useState<'ALL' | 'FILTERED'>('ALL');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);

  // Manual Entry 4-Step States
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [manualStep, setManualStep] = useState<1 | 2 | 3 | 4>(1);
  const [manualDeptId, setManualDeptId] = useState<string>('');
  const [manualSemesterId, setManualSemesterId] = useState<SemesterId>('1');
  const [manualExamId, setManualExamId] = useState<string>(exams[0]?.id || '');
  const [manualExamSheetOpen, setManualExamSheetOpen] = useState(false);
  const [manualStudentName, setManualStudentName] = useState('');
  const [manualRoll, setManualRoll] = useState('');
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualReg, setManualReg] = useState('');
  const [manualSubjectsMarks, setManualSubjectsMarks] = useState<{ [code: string]: number | '' }>({});
  const [manualCustomFullMarks, setManualCustomFullMarks] = useState<{ [code: string]: number }>({});
  const [editingFullMarksCode, setEditingFullMarksCode] = useState<string | null>(null);
  const [studentAutoMatched, setStudentAutoMatched] = useState<boolean>(false);
  const [matchedStudentDept, setMatchedStudentDept] = useState<string | null>(null);
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const [data, students] = await Promise.all([
        getResults({
          examId: selectedExamId !== 'ALL' ? selectedExamId : undefined,
          departmentId: selectedDepartmentId !== 'ALL' ? selectedDepartmentId : undefined,
          status: statusFilter !== 'ALL' ? (statusFilter as any) : undefined,
          search: searchQuery,
        }),
        getStudents(),
      ]);
      setResults(data);
      setStudentsList(students);
    } catch (err) {
      console.error('Fetch results error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRollChange = (val: string) => {
    setManualRoll(val);
    const cleanRoll = toEnglishDigits(val.trim());
    if (!cleanRoll) {
      setStudentAutoMatched(false);
      setMatchedStudentDept(null);
      return;
    }
    if (studentsList && studentsList.length > 0) {
      const matched = studentsList.find((s) => {
        const sRoll = toEnglishDigits(s.roll || '').trim();
        if (sRoll !== cleanRoll) return false;
        if (manualDeptId && s.departmentId) {
          return s.departmentId === manualDeptId;
        }
        return true;
      }) || studentsList.find((s) => toEnglishDigits(s.roll || '').trim() === cleanRoll);

      if (matched) {
        setManualStudentName(matched.name || '');
        setManualReg(matched.registration || '');
        setManualStudentId(matched.studentId || `DPIB-${cleanRoll}`);
        setStudentAutoMatched(true);
        setMatchedStudentDept(matched.departmentName || null);
      } else {
        setStudentAutoMatched(false);
        setMatchedStudentDept(null);
        // Retain any admin-typed information without auto-wiping
      }
    } else {
      setStudentAutoMatched(false);
      setMatchedStudentDept(null);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [selectedExamId, selectedDepartmentId, statusFilter, searchQuery]);

  useEffect(() => {
    if (exams.length > 0 && !manualExamId) {
      setManualExamId(exams[0].id);
    }
  }, [exams]);

  useEffect(() => {
    if (departments.length > 0 && !manualDeptId) {
      setManualDeptId(departments[0].id);
    }
  }, [departments]);

  const activeExamForManual = exams.find((e) => e.id === manualExamId);

  // Initialize or update custom full marks whenever active exam changes
  useEffect(() => {
    if (activeExamForManual && activeExamForManual.subjects) {
      setManualCustomFullMarks((prev) => {
        const next = { ...prev };
        activeExamForManual.subjects.forEach((s) => {
          if (next[s.code] === undefined) {
            next[s.code] = s.fullMarks;
          }
        });
        return next;
      });
    }
  }, [activeExamForManual]);

  // When technology or semester changes in step 1, select a matching exam if available
  useEffect(() => {
    if (manualDeptId && manualSemesterId && exams.length > 0) {
      const match = exams.find(
        (e) => e.departmentId === manualDeptId && e.semesterId === manualSemesterId
      );
      if (match) {
        setManualExamId(match.id);
      }
    }
  }, [manualDeptId, manualSemesterId, exams]);

  // Options for Exam Filter Sheet
  const examFilterOptions: SelectOption[] = [
    { value: 'ALL', label: 'সকল পরীক্ষা (ALL EXAMS)', badge: 'ALL', icon: BookOpen },
    ...exams.map((ex) => ({
      value: ex.id,
      label: ex.title,
      sublabel: `${ex.departmentName} • ${SEMESTER_MAP[ex.semesterId]}`,
      badge: ex.examType,
      icon: GraduationCap,
    })),
  ];

  // Options for Department / Technology Filter Sheet
  const deptFilterOptions: SelectOption[] = [
    { value: 'ALL', label: 'সকল টেকনোলজি (ALL TECH)', badge: 'ALL', icon: Building },
    ...departments.map((dept) => ({
      value: dept.id,
      label: dept.name,
      sublabel: `কোড: ${dept.code}`,
      badge: dept.code,
      icon: Building,
    })),
  ];

  // Options for Status Filter Sheet
  const statusFilterOptions: SelectOption[] = [
    { value: 'ALL', label: 'সকল অবস্থা (ALL STATUS)', badge: 'ALL', icon: Filter },
    { value: 'PUBLISHED', label: 'প্রকাশিত ফলাফল (PUBLISHED)', badge: 'LIVE', icon: CheckCircle2 },
    { value: 'DRAFT', label: 'খসড়া ফলাফল (DRAFT)', badge: 'DRAFT', icon: Clock },
    { value: 'REVIEW', label: 'রিভিউ প্রয়োজন (REVIEW)', badge: 'REVIEW', icon: AlertCircle },
  ];

  // Options for Publish Status Selection
  const publishStatusOptions: SelectOption[] = [
    { value: 'PUBLISHED', label: 'তাৎক্ষণিক প্রকাশ (PUBLISHED)', sublabel: 'পাবলিক পোর্টালে সাথে সাথে দৃশ্যমান হবে', badge: 'LIVE', icon: CheckCircle2 },
    { value: 'DRAFT', label: 'খসড়া হিসেবে সংরক্ষণ (DRAFT)', sublabel: 'পরবর্তীতে অ্যাডমিন প্যানেল থেকে প্রকাশ করা যাবে', badge: 'DRAFT', icon: Clock },
  ];

  // Options for Override Exam Selection
  const overrideExamOptions: SelectOption[] = [
    {
      value: 'AUTO',
      label: 'স্বয়ংক্রিয় সনাক্তকরণ (JSON কোড থেকে)',
      sublabel: detectedExam ? `${detectedExam.title} (${detectedExam.departmentName})` : 'JSON কোড বিশ্লেষণে প্রাপ্ত তথ্য',
      badge: 'AUTO',
      icon: Sparkles,
    },
    ...exams.map((ex) => ({
      value: ex.id,
      label: ex.title,
      sublabel: `${ex.departmentName} • ${SEMESTER_MAP[ex.semesterId]}`,
      badge: ex.examType,
      icon: BookOpen,
    })),
  ];

  // Direct JSON Upload Handler (NO mandatory exam selection required)
  const handleJsonUpload = () => {
    if (!jsonInputText.trim()) {
      setUploadErrors(['অনুগ্রহ করে JSON ডাটা ইনপুট করুন।']);
      return;
    }

    setUploadedFileName('JSON ডেটা ইনপুট');
    setIsProcessingUpload(true);
    setUploadErrors([]);
    setUploadSuccessSummary(null);

    const chosenExam = selectedOverrideExamId !== 'AUTO' ? exams.find((x) => x.id === selectedOverrideExamId) : null;

    try {
      const parsed = parseJsonResults(jsonInputText, chosenExam, uploadPublishStatus, undefined, exams);
      setParsedReport(parsed);
      setParsedPreviewList(parsed.results);
      setDetectedExam(parsed.detectedExam || null);
      setIsAutoCreatedExam(Boolean(parsed.autoCreatedExam));
      setUploadErrors(parsed.errors);

      if (parsed.errors.length === 0 && parsed.validRows > 0) {
        setUploadSuccessSummary(
          `JSON থেকে ${toBanglaDigits(parsed.validRows)} জন শিক্ষার্থীর ফলাফল লোড ও যাচাই হয়েছে! পরীক্ষা: ${parsed.detectedExam?.title || 'সনাক্তকৃত পরীক্ষা'}`
        );
      }
      setUploadStep('PREVIEW');
    } catch (err: any) {
      setUploadErrors([err.message || 'JSON ফরম্যাট সঠিক নয়।']);
      setParsedReport(null);
    } finally {
      setIsProcessingUpload(false);
    }
  };

  // Commit Batch Upload to Firestore (creates exam if auto-created, then saves results)
  const handleCommitBatchSave = async () => {
    if (parsedPreviewList.length === 0) return;

    setIsProcessingUpload(true);
    try {
      let finalExamId = detectedExam?.id;

      // If exam was auto-created or doesn't exist yet, save it to Firestore first
      if (detectedExam && (isAutoCreatedExam || !exams.some((x) => x.id === detectedExam.id))) {
        await saveExam(
          {
            title: detectedExam.title,
            semesterId: detectedExam.semesterId,
            departmentId: detectedExam.departmentId,
            departmentName: detectedExam.departmentName,
            examType: detectedExam.examType || 'মডেল টেস্ট',
            examDate: detectedExam.examDate || new Date().toISOString().split('T')[0],
            totalMarks: detectedExam.totalMarks || 100,
            description: detectedExam.description || 'JSON আপলোড হতে স্বয়ংক্রিয় তৈরি',
            subjects: detectedExam.subjects || [],
            status: uploadPublishStatus,
            allowMeritList: true,
            publishedAt: uploadPublishStatus === 'PUBLISHED' ? Date.now() : null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          detectedExam.id
        );
      }

      // Update result records with final examId
      const finalResults = parsedPreviewList.map((r) => ({
        ...r,
        examId: finalExamId || r.examId,
        status: uploadPublishStatus,
        publishedAt: uploadPublishStatus === 'PUBLISHED' ? Date.now() : undefined,
      }));

      await batchSaveResults(finalResults, finalExamId, uploadPublishStatus === 'PUBLISHED');
      
      setUploadSuccessSummary(`সফলভাবে ${toBanglaDigits(finalResults.length)}টি ফলাফল ফায়ারস্টোরে সংরক্ষিত ও প্রকাশিত হয়েছে!`);
      setTimeout(() => {
        setUploadSheetOpen(false);
        setParsedPreviewList([]);
        setDetectedExam(null);
        setUploadErrors([]);
        setUploadSuccessSummary(null);
      }, 1500);
      fetchResults();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      setUploadErrors([`সংরক্ষণে সমস্যা: ${err.message}`]);
    } finally {
      setIsProcessingUpload(false);
    }
  };

  // Construct a previewable StudentResult from current single entry inputs
  const buildCurrentStudentResult = (): StudentResult | null => {
    if (!activeExamForManual) return null;
    const cleanName = manualStudentName.trim() || 'শিক্ষার্থীর নাম';
    const cleanRoll = toEnglishDigits(manualRoll.trim()) || '০০০০০০';
    const subjectsList = activeExamForManual.subjects || [];

    const subjectMarksArray: SubjectResult[] = subjectsList.map((sub) => {
      const full = manualCustomFullMarks[sub.code] ?? sub.fullMarks;
      const obtained = Number(manualSubjectsMarks[sub.code] || 0);
      const gradeInfo = calculateSubjectGrade(obtained, full);
      return {
        subjectCode: sub.code,
        subjectName: sub.name,
        fullMarks: full,
        obtainedMarks: obtained,
        grade: gradeInfo.grade,
        gradePoint: gradeInfo.gradePoint,
        isPassed: gradeInfo.isPassed,
      };
    });

    const calculated = calculateResultGrades(subjectMarksArray);

    return {
      id: `preview-${cleanRoll}`,
      examId: activeExamForManual.id,
      examTitle: activeExamForManual.title,
      examType: activeExamForManual.examType,
      examDate: activeExamForManual.examDate,
      semesterId: activeExamForManual.semesterId,
      departmentId: activeExamForManual.departmentId,
      departmentName: activeExamForManual.departmentName,
      studentName: cleanName,
      roll: cleanRoll,
      studentId: manualStudentId.trim() || `DPIB-${cleanRoll}`,
      registration: manualReg.trim() || undefined,
      subjects: subjectMarksArray,
      totalObtainedMarks: calculated.totalObtainedMarks,
      totalFullMarks: calculated.totalFullMarks,
      gpa: calculated.gpa,
      letterGrade: calculated.letterGrade,
      isPassed: calculated.isPassed,
      status: 'PUBLISHED',
      publishedAt: Date.now(),
      verificationCode: `DPIB-${cleanRoll}-PREVIEW`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  };

  // Manual Result Save with Step 4 Validation & Feedback
  const handleManualSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setManualError(null);

    if (!activeExamForManual) {
      setManualError('অনুগ্রহ করে ধাপ ১-এ একটি পরীক্ষা নির্বাচন করুন।');
      setManualStep(1);
      return;
    }

    const cleanName = manualStudentName.trim();
    const cleanRoll = toEnglishDigits(manualRoll.trim());
    if (!cleanName || !cleanRoll) {
      setManualError('শিক্ষার্থীর নাম ও রোল নম্বর অবশ্যই পূরণ করতে হবে।');
      setManualStep(2);
      return;
    }

    const subjectsList = activeExamForManual.subjects || [];
    if (subjectsList.length === 0) {
      setManualError('নির্বাচিত পরীক্ষায় কোনো বিষয় যুক্ত করা নেই।');
      setManualStep(3);
      return;
    }

    // Validate marks for all subjects
    for (const sub of subjectsList) {
      const full = manualCustomFullMarks[sub.code] ?? sub.fullMarks;
      const obtained = Number(manualSubjectsMarks[sub.code] ?? 0);
      if (obtained > full) {
        setManualError(`"${sub.name}" বিষয়ের প্রাপ্ত নম্বর (${obtained}) নির্ধারিত পূর্ণমানের (${full}) চেয়ে বেশি হতে পারে না!`);
        setManualStep(3);
        return;
      }
      if (obtained < 0) {
        setManualError(`"${sub.name}" বিষয়ের প্রাপ্ত নম্বর শূন্যের চেয়ে কম হতে পারে না!`);
        setManualStep(3);
        return;
      }
    }

    const subjectMarksArray: SubjectResult[] = subjectsList.map((sub) => {
      const full = manualCustomFullMarks[sub.code] ?? sub.fullMarks;
      const obtained = Number(manualSubjectsMarks[sub.code] ?? 0);
      const gradeInfo = calculateSubjectGrade(obtained, full);
      return {
        subjectCode: sub.code,
        subjectName: sub.name,
        fullMarks: full,
        obtainedMarks: obtained,
        grade: gradeInfo.grade,
        gradePoint: gradeInfo.gradePoint,
        isPassed: gradeInfo.isPassed,
      };
    });

    const calculated = calculateResultGrades(subjectMarksArray);

    setManualSaving(true);
    try {
      await saveStudentResult({
        examId: activeExamForManual.id,
        examTitle: activeExamForManual.title,
        examType: activeExamForManual.examType,
        examDate: activeExamForManual.examDate,
        semesterId: activeExamForManual.semesterId,
        departmentId: activeExamForManual.departmentId,
        departmentName: activeExamForManual.departmentName,
        studentName: cleanName,
        roll: cleanRoll,
        studentId: manualStudentId.trim() || `DPIB-${cleanRoll}`,
        registration: manualReg.trim() || undefined,
        subjects: subjectMarksArray,
        totalObtainedMarks: calculated.totalObtainedMarks,
        totalFullMarks: calculated.totalFullMarks,
        gpa: calculated.gpa,
        letterGrade: calculated.letterGrade,
        isPassed: calculated.isPassed,
        status: 'PUBLISHED',
        publishedAt: Date.now(),
        verificationCode: `DPIB-${cleanRoll}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      setManualSheetOpen(false);
      setManualStudentName('');
      setManualRoll('');
      setManualStudentId('');
      setManualReg('');
      setManualSubjectsMarks({});
      setManualCustomFullMarks({});
      setManualStep(1);
      setDeleteSuccessMessage(`শিক্ষার্থী "${cleanName}" (রোল: ${cleanRoll})-এর ফলাফল সফলভাবে ফায়ারস্টোরে প্রকাশিত হয়েছে!`);
      fetchResults();
      if (onRefreshStats) onRefreshStats();
      setTimeout(() => setDeleteSuccessMessage(null), 5000);
    } catch (err: any) {
      setManualError(err.message || 'সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setManualSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmResult) return;
    const targetId = deleteConfirmResult.id;
    const targetName = deleteConfirmResult.studentName;

    setIsDeletingResult(true);
    setDeleteError(null);
    try {
      // Optimistically remove from state for instant feedback
      setResults((prev) => prev.filter((r) => r.id !== targetId));
      await deleteResult(targetId);
      setDeleteSuccessMessage(`"${targetName}" এর ফলাফল রেকর্ডটি সফলভাবে মুছে ফেলা হয়েছে!`);
      setDeleteConfirmResult(null);
      fetchResults();
      if (onRefreshStats) onRefreshStats();
      setTimeout(() => setDeleteSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Delete result error:', err);
      setDeleteError(err.message || 'ফলাফল মুছতে ব্যর্থ হয়েছে। ফায়ারস্টোর পারমিশন বা সংযোগ যাচাই করুন।');
      fetchResults();
    } finally {
      setIsDeletingResult(false);
    }
  };

  const handleDeleteAll = async (scope: 'ALL' | 'FILTERED' = 'ALL') => {
    setIsDeletingAll(true);
    setDeleteError(null);
    try {
      const targetExamId = scope === 'FILTERED' && selectedExamId !== 'ALL' ? selectedExamId : undefined;
      const count = await deleteAllResults(targetExamId);
      setDeleteAllModalOpen(false);
      setDeleteSuccessMessage(
        targetExamId
          ? `নির্বাচিত পরীক্ষার মোট ${toBanglaDigits(count)}টি ফলাফল ডাটাবেজ থেকে মুছে ফেলা হয়েছে!`
          : `ডাটাবেজের সকল (${toBanglaDigits(count)}টি) ফলাফল সফলভাবে মুছে ফেলা হয়েছে!`
      );
      fetchResults();
      if (onRefreshStats) onRefreshStats();
      setTimeout(() => setDeleteSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Delete all error:', err);
      setDeleteError(err.message || 'ফলাফল মুছতে সমস্যা হয়েছে');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleToggleStatus = async (result: StudentResult) => {
    const nextStatus = result.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await updateResultStatus(result.id, nextStatus);
      fetchResults();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error('Status error:', err);
    }
  };

  // Selected filter labels
  const selectedExamObj = exams.find((x) => x.id === selectedExamId);
  const examFilterDisplay = selectedExamId === 'ALL' ? 'সকল পরীক্ষা' : selectedExamObj?.title || selectedExamId;
  const selectedDeptObj = departments.find((d) => d.id === selectedDepartmentId);
  const deptFilterDisplay = selectedDepartmentId === 'ALL' ? 'সকল টেকনোলজি' : selectedDeptObj?.name || selectedDepartmentId;
  const statusFilterDisplay =
    statusFilter === 'ALL'
      ? 'সকল অবস্থা'
      : statusFilter === 'PUBLISHED'
      ? 'প্রকাশিত'
      : statusFilter === 'DRAFT'
      ? 'খসড়া'
      : statusFilter;

  return (
    <div className="space-y-6">
      {/* Delete Success Toast Banner */}
      {deleteSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between shadow-xs transition-all animate-fadeIn">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{deleteSuccessMessage}</span>
          </div>
          <button
            onClick={() => setDeleteSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ফলাফল ব্যবস্থাপনা
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            মোট ফলাফল রেকর্ড: {toBanglaDigits(results.length)}টি (সরাসরি JSON কোড ইমপোর্ট ও স্বয়ংক্রিয় প্রসেসিং)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setUploadStep(parsedPreviewList.length > 0 ? 'PREVIEW' : 'FILE');
              setUploadSheetOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-emerald-300" />
            <span>JSON ফলাফল ইমপোর্ট</span>
          </button>

          <button
            onClick={() => {
              setManualError(null);
              setManualStep(1);
              if (selectedDepartmentId !== 'ALL') {
                setManualDeptId(selectedDepartmentId);
              } else if (departments.length > 0 && !manualDeptId) {
                setManualDeptId(departments[0].id);
              }
              if (selectedExamId !== 'ALL') {
                setManualExamId(selectedExamId);
                const ex = exams.find((x) => x.id === selectedExamId);
                if (ex) {
                  setManualDeptId(ex.departmentId);
                  setManualSemesterId(ex.semesterId);
                }
              }
              setManualSheetOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>একক এন্ট্রি</span>
          </button>

          <button
            onClick={() => {
              setDeleteError(null);
              setDeleteAllModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
            title="ডাটাবেজের সকল ফলাফল এক ক্লিকে মুছুন"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>সকল ফলাফল মুছুন</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar using Modern Bottom Sheet Selects */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 p-4 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <div className="sm:col-span-4 relative">
          <input
            type="text"
            placeholder="রোল নম্বর বা নাম দিয়ে ফলাফল খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <div className="sm:col-span-3">
          <SelectTrigger
            value={selectedExamId}
            displayValue={examFilterDisplay}
            onClick={() => setExamFilterSheetOpen(true)}
            icon={BookOpen}
          />
        </div>

        <div className="sm:col-span-3">
          <SelectTrigger
            value={selectedDepartmentId}
            displayValue={deptFilterDisplay}
            onClick={() => setDeptFilterSheetOpen(true)}
            icon={Building}
          />
        </div>

        <div className="sm:col-span-2">
          <SelectTrigger
            value={statusFilter}
            displayValue={statusFilterDisplay}
            onClick={() => setStatusFilterSheetOpen(true)}
            icon={Filter}
          />
        </div>
      </div>

      {/* Results Table */}
      {loading ? (
        <LoadingSpinner message="ফলাফল ডেটাবেস লোড হচ্ছে..." />
      ) : results.length === 0 ? (
        <EmptyState
          icon={FileCode}
          title="কোনো ফলাফল রেকর্ড পাওয়া যায়নি"
          description="JSON কোডের মাধ্যমে সরাসরি ফলাফল ফায়ারস্টোরে ইমপোর্ট ও প্রকাশ করুন।"
          actionText="JSON ফলাফল ইমপোর্ট করুন"
          onAction={() => setUploadSheetOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/80">
                  <th className="py-3 px-4 text-center">রোল</th>
                  <th className="py-3 px-4">শিক্ষার্থীর নাম</th>
                  <th className="py-3 px-4">টেকনোলজি</th>
                  <th className="py-3 px-4">পরীক্ষার নাম</th>
                  <th className="py-3 px-4 text-center">মোট নম্বর</th>
                  <th className="py-3 px-4 text-center">GPA</th>
                  <th className="py-3 px-4 text-center">গ্রেড</th>
                  <th className="py-3 px-4 text-center">অবস্থা</th>
                  <th className="py-3 px-4 text-right">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-blue-700 font-outfit">
                      {toBanglaDigits(res.roll)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{res.studentName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/70">
                        {res.departmentName || res.departmentId}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs truncate max-w-xs">{res.examTitle}</td>
                    <td className="py-3 px-4 text-center font-outfit font-semibold text-slate-700">
                      {toBanglaDigits(res.totalObtainedMarks)} / {toBanglaDigits(res.totalFullMarks)}
                    </td>
                    <td className="py-3 px-4 text-center font-black font-outfit text-blue-600">
                      {toBanglaNumber(res.gpa, 2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded font-bold font-outfit text-xs bg-slate-100 text-slate-800 border border-slate-200/60">
                        {res.letterGrade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(res)}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                          res.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/80 hover:bg-amber-100'
                        }`}
                      >
                        {res.status === 'PUBLISHED' ? 'প্রকাশিত' : 'খসড়া'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setPreviewResult(res)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                          title="কার্ড দেখুন"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteConfirmResult(res);
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="মুছুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= DIRECT RESULT UPLOAD BOTTOM SHEET ================= */}
      <BottomSheet
        isOpen={uploadSheetOpen}
        onClose={() => setUploadSheetOpen(false)}
        title="JSON ফলাফল ডেটা ইমপোর্ট ও প্রকাশ"
        subtitle="সরাসরি JSON কোড ইনপুট করুন — পরীক্ষা নির্বাচন বাধ্যতামূলক নয়, সিস্টেম স্বয়ংক্রিয়ভাবে সনাক্ত ও প্রসেস করবে"
        maxHeight="max-h-[95vh]"
      >
        <div className="space-y-5 pb-6">
          {/* Progress / Step indicators (Interactive Tabs) */}
          <div className="grid grid-cols-3 gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 text-center text-xs">
            <button
              type="button"
              onClick={() => setUploadStep('FILE')}
              className={`py-2 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                uploadStep === 'FILE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-outfit ${uploadStep === 'FILE' ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-700'}`}>১</span>
              <span>JSON কোড ইনপুট</span>
            </button>
            <button
              type="button"
              onClick={() => setUploadStep('PREVIEW')}
              className={`py-2 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                uploadStep === 'PREVIEW'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : parsedPreviewList.length > 0
                  ? 'text-blue-700 hover:bg-blue-50 font-bold'
                  : 'text-slate-500 hover:bg-slate-200/60'
              }`}
            >
              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-outfit ${uploadStep === 'PREVIEW' ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-700'}`}>২</span>
              <span>প্রিভিউ ও যাচাই</span>
              {parsedPreviewList.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setUploadStep('CONFIRM')}
              className={`py-2 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                uploadStep === 'CONFIRM'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : parsedPreviewList.length > 0
                  ? 'text-emerald-700 hover:bg-emerald-50 font-bold'
                  : 'text-slate-500 hover:bg-slate-200/60'
              }`}
            >
              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-outfit ${uploadStep === 'CONFIRM' ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-700'}`}>৩</span>
              <span>নিশ্চিত করুন</span>
            </button>
          </div>

          {/* ================= STEP 1: JSON CODE INPUT ================= */}
          {uploadStep === 'FILE' && (
            <div className="space-y-4">
              {/* Quick Options: Status & Override */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/90">
                <SelectTrigger
                  label="প্রকাশের অবস্থা"
                  value={uploadPublishStatus}
                  displayValue={uploadPublishStatus === 'PUBLISHED' ? 'তাৎক্ষণিক প্রকাশ (PUBLISHED)' : 'খসড়া হিসেবে সংরক্ষণ (DRAFT)'}
                  onClick={() => setUploadPublishSheetOpen(true)}
                  icon={CheckCircle2}
                />

                <SelectTrigger
                  label="পরীক্ষা সংশ্লিষ্টকরণ (ঐচ্ছিক)"
                  value={selectedOverrideExamId}
                  displayValue={selectedOverrideExamId === 'AUTO' ? 'স্বয়ংক্রিয় সনাক্তকরণ (JSON কোড থেকে)' : exams.find(x => x.id === selectedOverrideExamId)?.title}
                  onClick={() => setOverrideExamSheetOpen(true)}
                  icon={BookOpen}
                />
              </div>

              {/* Quick Database Clear helper */}
              <div className="flex items-center justify-between p-3 bg-rose-50/60 border border-rose-200/70 rounded-2xl text-xs text-rose-800">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>পূর্বের ফলাফল ডেটাবেজ থেকে সম্পূর্ণ মুছে নতুন করে আপলোড করতে চান?</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadSheetOpen(false);
                    setDeleteError(null);
                    setDeleteAllModalOpen(true);
                  }}
                  className="font-bold text-rose-700 hover:text-rose-900 bg-white border border-rose-200 px-2.5 py-1 rounded-lg shrink-0 cursor-pointer shadow-2xs hover:bg-rose-50 transition-colors"
                >
                  সকল ফলাফল মুছুন
                </button>
              </div>

              {/* Notice if data is already loaded */}
              {parsedReport && (
                <div className="p-4 bg-emerald-50 border border-emerald-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-emerald-900 text-xs sm:text-sm flex items-center gap-1.5">
                        <span>{parsedReport.fileName || uploadedFileName || 'JSON ফলাফল ডেটা'}</span>
                        {parsedReport.invalidRows === 0 ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                      </div>
                      <div className="text-emerald-700 text-[11px] mt-0.5 font-medium">
                        মোট {toBanglaDigits(parsedReport.totalRows)} সারির মধ্যে {toBanglaDigits(parsedReport.validRows)} জন বৈধ শিক্ষার্থী
                        {parsedReport.invalidRows > 0 && ` (${toBanglaDigits(parsedReport.invalidRows)}টি ত্রুটি)`}
                        {detectedExam && ` • ${detectedExam.title}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setParsedReport(null);
                        setParsedPreviewList([]);
                        setDetectedExam(null);
                        setUploadedFileName(null);
                        setUploadErrors([]);
                        setUploadSuccessSummary(null);
                      }}
                      className="px-3 py-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                    >
                      বাতিল
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadStep('PREVIEW')}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <span>প্রিভিউ দেখুন</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Dedicated JSON Input Box */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-800">
                        JSON ফরম্যাট রেজাল্ট কোড
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        শিক্ষার্থীদের রোল, নাম ও বিষয়ভিত্তিক নম্বর সংবলিত JSON অ্যারে কোড পেস্ট করুন
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setJsonInputText(generateSampleJson(null))}
                      className="px-2.5 py-1.5 text-xs text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 rounded-xl font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>নমুনা কোড লোড করুন</span>
                    </button>
                    {jsonInputText && (
                      <button
                        type="button"
                        onClick={() => setJsonInputText('')}
                        className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl font-semibold transition-colors cursor-pointer"
                      >
                        পরিষ্কার করুন
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <textarea
                    rows={8}
                    value={jsonInputText}
                    onChange={(e) => setJsonInputText(e.target.value)}
                    placeholder={`[\n  {\n    "roll": "601234",\n    "name": "মোঃ আরিয়ান আহমেদ",\n    "registration": "1502123456",\n    "66611": 85,\n    "66612": 78\n  }\n]`}
                    className="w-full p-3.5 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none leading-relaxed text-slate-800 transition-all resize-y"
                    spellCheck={false}
                  />
                  {jsonInputText.trim() && (
                    <div className="text-[10px] text-slate-400 flex items-center justify-between px-1">
                      <span>অক্ষর সংখ্যা: {toBanglaDigits(jsonInputText.length)}</span>
                      <span>সরাসরি যেকোনো স্ট্যান্ডার্ড JSON সমর্থন করে</span>
                    </div>
                  )}
                </div>

                {/* Example format helper box */}
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>JSON কোডের গঠন নির্দেশিকা:</span>
                  </div>
                  <p className="text-amber-800/90 leading-relaxed">
                    প্রতিটি অবজেক্টে শিক্ষার্থীর <code className="bg-amber-100/90 px-1 py-0.5 rounded font-mono text-[10px] text-amber-900 font-bold">roll</code> এবং <code className="bg-amber-100/90 px-1 py-0.5 rounded font-mono text-[10px] text-amber-900 font-bold">name</code> ফিল্ড থাকা আবশ্যক। বিষয় কোডসমূহ সরাসরি কি (Key) হিসেবে দিয়ে প্রাপ্ত নম্বর প্রদান করুন (যেমন: <code className="bg-amber-100/90 px-1 py-0.5 rounded font-mono text-[10px] text-amber-900">"66611": 85</code>)।
                  </p>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleJsonUpload}
                    disabled={isProcessingUpload || !jsonInputText.trim()}
                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-all shadow-xs flex items-center justify-center gap-2"
                  >
                    {isProcessingUpload ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>যাচাই করা হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-blue-200" />
                        <span>JSON কোড প্রসেস ও ফলাফল প্রিভিউ দেখুন</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: PREVIEW & VERIFY ================= */}
          {uploadStep === 'PREVIEW' && (
            <div className="space-y-4">
              {!parsedReport ? (
                <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                  <FileCode className="w-10 h-10 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700">এখনও কোনো JSON কোড ইনপুট করা হয়নি</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    ফলাফল তালিকা প্রিভিউ ও যাচাই করার জন্য প্রথমে ধাপ ১ (JSON ইনপুট) থেকে JSON কোড পেস্ট ও প্রসেস করুন।
                  </p>
                  <button
                    type="button"
                    onClick={() => setUploadStep('FILE')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>JSON কোড ইনপুট করতে যান</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* JSON Metadata Header Bar */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-slate-900">{parsedReport.fileName || uploadedFileName || 'JSON ফলাফল ডেটা'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-semibold text-slate-700">
                        মোট সারি: <strong className="font-outfit text-slate-900">{toBanglaDigits(parsedReport.totalRows)}</strong>
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md font-semibold text-emerald-800">
                        বৈধ: <strong className="font-outfit">{toBanglaDigits(parsedReport.validRows)}</strong>
                      </span>
                      {parsedReport.invalidRows > 0 && (
                        <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 rounded-md font-semibold text-rose-800">
                          ত্রুটি: <strong className="font-outfit">{toBanglaDigits(parsedReport.invalidRows)}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Upload Status & Errors */}
                  {parsedReport.invalidRows > 0 && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-2">
                      <div className="font-bold flex items-center space-x-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>JSON ডেটায় {toBanglaDigits(parsedReport.invalidRows)}টি সারিতে ত্রুটি পাওয়া গেছে (সংশোধন আবশ্যক):</span>
                      </div>
                      <ul className="list-disc pl-5 space-y-0.5 max-h-32 overflow-y-auto font-medium">
                        {parsedReport.errors.slice(0, 10).map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                        {parsedReport.errors.length > 10 && (
                          <li className="font-bold text-rose-900">... এবং আরও {toBanglaDigits(parsedReport.errors.length - 10)}টি ত্রুটি রয়েছে</li>
                        )}
                      </ul>
                      <p className="text-[11px] text-rose-600 pt-1 font-semibold">
                        * ত্রুটিযুক্ত অবস্থায় ফলাফল নিশ্চিত করা যাবে না। অনুগ্রহ করে JSON কোড সংশোধন করে পুনরায় যাচাই করুন।
                      </p>
                    </div>
                  )}

                  {parsedReport.invalidRows === 0 && parsedReport.validRows > 0 && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>সকল {toBanglaDigits(parsedReport.validRows)} জন শিক্ষার্থীর ডেটা সঠিক ও ত্রুটিমুক্ত সনাক্ত হয়েছে!</span>
                    </div>
                  )}

                  {/* Detected Exam Information Card */}
                  {detectedExam && (
                    <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                          <span className="font-bold text-xs text-blue-900 uppercase">সনাক্তকৃত পরীক্ষার বিবরণ</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 font-outfit uppercase">
                          {isAutoCreatedExam ? 'স্বয়ংক্রিয় তৈরি' : 'বিদ্যমান রেকর্ড'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 text-slate-700">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">পরীক্ষার নাম</span>
                          <span className="font-bold text-slate-900">{detectedExam.title}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">সেমিস্টার</span>
                          <span className="font-bold">{SEMESTER_MAP[detectedExam.semesterId] || detectedExam.semesterId}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">বিভাগ / টেকনোলজি</span>
                          <span className="font-bold">{detectedExam.departmentName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">সনাক্তকৃত বিষয়সমূহ</span>
                          <span className="font-bold font-outfit">{detectedExam.subjects?.length || 0}টি বিষয়</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Preview Mode Switcher */}
                  <div className="flex items-center justify-between border-b border-slate-200 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewTabMode('PROCESSED')}
                        className={`py-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                          previewTabMode === 'PROCESSED'
                            ? 'border-blue-600 text-blue-700'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        প্রসেসকৃত ফলাফল ({toBanglaDigits(parsedReport.validRows)})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTabMode('RAW')}
                        className={`py-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                          previewTabMode === 'RAW'
                            ? 'border-blue-600 text-blue-700'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        প্রকৃত স্প্রেডশিট ডেটা ({toBanglaDigits(parsedReport.totalRows)} সারি)
                      </button>
                    </div>
                    {previewTabMode === 'PROCESSED' && (
                      <span className="text-[11px] text-slate-500 font-medium hidden sm:inline-block">
                        উত্তীর্ণ: {toBanglaDigits(parsedPreviewList.filter((p) => p.isPassed).length)} | অনুত্তীর্ণ: {toBanglaDigits(parsedPreviewList.filter((p) => !p.isPassed).length)}
                      </span>
                    )}
                  </div>

                  {/* Tab 1: PROCESSED PREVIEW TABLE */}
                  {previewTabMode === 'PROCESSED' && (
                    <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 text-xs shadow-2xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                          <tr>
                            <th className="py-2.5 px-3">রোল</th>
                            <th className="py-2.5 px-3">নাম</th>
                            <th className="py-2.5 px-3 text-center">মোট নম্বর</th>
                            <th className="py-2.5 px-3 text-center">GPA</th>
                            <th className="py-2.5 px-3 text-center">গ্রেড</th>
                            <th className="py-2.5 px-3 text-center">অবস্থা</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parsedPreviewList.map((p, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2 px-3 font-bold font-outfit text-blue-700">{p.roll}</td>
                              <td className="py-2 px-3 font-medium text-slate-900">{p.studentName}</td>
                              <td className="py-2 px-3 text-center font-outfit">{p.totalObtainedMarks}</td>
                              <td className="py-2 px-3 text-center font-bold font-outfit text-blue-600">
                                {p.gpa.toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-center font-bold">{p.letterGrade}</td>
                              <td className="py-2 px-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    p.isPassed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                  }`}
                                >
                                  {p.isPassed ? 'পাস' : 'ফেল'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Tab 2: RAW SPREADSHEET TABLE */}
                  {previewTabMode === 'RAW' && (
                    <div className="max-h-60 overflow-x-auto overflow-y-auto rounded-xl border border-slate-200 text-xs shadow-2xs">
                      <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3 bg-slate-200/80 text-center font-outfit text-[11px] w-12">#</th>
                            {parsedReport.rawHeaders.map((hdr, hIdx) => (
                              <th key={hIdx} className="py-2.5 px-3 text-slate-800">
                                {hdr}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parsedReport.rawRows.map((row, rIdx) => {
                            const isRowInvalid = row.errors && row.errors.length > 0;
                            return (
                              <tr
                                key={rIdx}
                                className={
                                  isRowInvalid
                                    ? 'bg-rose-50/60 hover:bg-rose-100/50 text-rose-900'
                                    : 'hover:bg-slate-50/80'
                                }
                              >
                                <td className="py-2 px-3 text-center font-outfit text-[11px] text-slate-400 bg-slate-50/50">
                                  {row.rowNumber}
                                </td>
                                {parsedReport.rawHeaders.map((hdr, hIdx) => {
                                  const cellVal = row.data[hdr] ?? '';
                                  return (
                                    <td key={hIdx} className="py-2 px-3 font-medium">
                                      {String(cellVal)}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Bottom Action Controls */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setUploadStep('FILE')}
                      className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      ← JSON কোড পরিবর্তন করুন
                    </button>
                    <button
                      type="button"
                      disabled={parsedReport.invalidRows > 0 || parsedReport.validRows === 0}
                      onClick={() => setUploadStep('CONFIRM')}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
                    >
                      <span>পরবর্তী ধাপ: নিশ্চিতকরণ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ================= STEP 3: CONFIRM & PUBLISH ================= */}
          {uploadStep === 'CONFIRM' && (
            <div className="space-y-4">
              {parsedPreviewList.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700">প্রকাশের জন্য কোনো ফলাফল প্রস্তুত নেই</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    ফলাফল নিশ্চিত ও ফায়ারস্টোরে সংরক্ষণের জন্য প্রথমে ধাপ ১ থেকে JSON কোড ইনপুট করুন।
                  </p>
                  <button
                    type="button"
                    onClick={() => setUploadStep('FILE')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>JSON কোড ইনপুট করতে যান</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Overview Card */}
                  <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <h4 className="text-sm font-bold text-slate-900">ফলাফল প্রকাশ সারসংক্ষেপ</h4>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${uploadPublishStatus === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {uploadPublishStatus === 'PUBLISHED' ? 'তাৎক্ষণিক প্রকাশ (PUBLISHED)' : 'খসড়া (DRAFT)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-white border border-slate-200/70 rounded-xl">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">মোট শিক্ষার্থী</span>
                        <span className="text-lg font-bold font-outfit text-slate-900">{toBanglaDigits(parsedPreviewList.length)} জন</span>
                      </div>
                      <div className="p-3 bg-white border border-slate-200/70 rounded-xl">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">উত্তীর্ণ (পাস)</span>
                        <span className="text-lg font-bold font-outfit text-emerald-600">
                          {toBanglaDigits(parsedPreviewList.filter(p => p.isPassed).length)} জন
                        </span>
                      </div>
                      <div className="p-3 bg-white border border-slate-200/70 rounded-xl">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">অনুত্তীর্ণ (ফেল)</span>
                        <span className="text-lg font-bold font-outfit text-rose-600">
                          {toBanglaDigits(parsedPreviewList.filter(p => !p.isPassed).length)} জন
                        </span>
                      </div>
                      <div className="p-3 bg-white border border-slate-200/70 rounded-xl">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">পাসের হার</span>
                        <span className="text-lg font-bold font-outfit text-blue-600">
                          {toBanglaDigits(((parsedPreviewList.filter(p => p.isPassed).length / parsedPreviewList.length) * 100).toFixed(1))}%
                        </span>
                      </div>
                    </div>

                    {detectedExam && (
                      <div className="p-3 bg-blue-50/60 border border-blue-200/60 rounded-xl text-xs space-y-1 text-slate-700">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">সংযুক্ত পরীক্ষা:</span>
                          <span className="font-bold text-slate-900">{detectedExam.title}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">বিভাগ ও সেমিস্টার:</span>
                          <span className="font-medium">{detectedExam.departmentName} • {SEMESTER_MAP[detectedExam.semesterId]}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <button
                      onClick={handleCommitBatchSave}
                      disabled={isProcessingUpload}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      {isProcessingUpload ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>সংরক্ষণ ও প্রকাশ করা হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>ফলাফল নিশ্চিত ও ফায়ারস্টোরে প্রকাশ করুন ({toBanglaDigits(parsedPreviewList.length)}টি)</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setUploadStep('PREVIEW')}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                      >
                        ← প্রিভিউ তালিকায় ফিরে যান
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadStep('FILE')}
                        className="px-4 py-2 text-xs font-semibold text-slate-500 hover:underline cursor-pointer"
                      >
                        নতুন JSON ইনপুট
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Manual Single Result Entry Bottom Sheet (4-Step Guided Wizard) */}
      <BottomSheet
        isOpen={manualSheetOpen}
        onClose={() => setManualSheetOpen(false)}
        title="একক ফলাফল এন্ট্রি"
        subtitle="৪ ধাপে শিক্ষার্থীর একক ফলাফল যাচাই ও প্রকাশ করুন"
        maxHeight="max-h-[96vh]"
      >
        <div className="space-y-4 pb-6">
          {manualError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{manualError}</span>
            </div>
          )}

          {/* 4-Step Visual Progress Bar */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-2xl select-none">
            {[
              { step: 1, label: '১. পরীক্ষা', short: 'পরীক্ষা', icon: BookOpen },
              { step: 2, label: '২. শিক্ষার্থী', short: 'শিক্ষার্থী', icon: GraduationCap },
              { step: 3, label: '৩. নম্বর', short: 'নম্বর', icon: Award },
              { step: 4, label: '৪. যাচাই ও প্রকাশ', short: 'যাচাই', icon: CheckCircle2 },
            ].map((s) => {
              const isCurrent = manualStep === s.step;
              const isDone = manualStep > s.step;
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => {
                    if (s.step < manualStep) {
                      setManualStep(s.step as any);
                    } else if (s.step === 2 && activeExamForManual) {
                      setManualStep(2);
                    } else if (s.step === 3 && activeExamForManual && manualRoll.trim() && manualStudentName.trim()) {
                      setManualStep(3);
                    } else if (s.step === 4 && activeExamForManual && manualRoll.trim() && manualStudentName.trim()) {
                      setManualStep(4);
                    }
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-white text-blue-700 shadow-xs border border-blue-200'
                      : isDone
                      ? 'text-emerald-700 hover:bg-white/60'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : isDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isDone ? '✓' : s.step}
                  </span>
                  <span className="hidden sm:inline truncate">{s.label}</span>
                  <span className="sm:hidden text-[10px] truncate">{s.short}</span>
                </button>
              );
            })}
          </div>

          {/* ================= STEP 1: EXAM INFORMATION ================= */}
          {manualStep === 1 && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl">
                <p className="text-xs font-bold text-blue-900 mb-0.5">ধাপ ১: পরীক্ষার তথ্য নির্বাচন</p>
                <p className="text-[11px] text-blue-700">টেকনোলজি, পর্ব ও কাঙ্ক্ষিত পরীক্ষাটি নির্বাচন করুন।</p>
              </div>

              {/* Technology Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  টেকনোলজি / বিভাগ <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {departments.map((dept) => {
                    const isSelected = manualDeptId === dept.id;
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => setManualDeptId(dept.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <p className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {dept.name}
                        </p>
                        <p className={`text-[10px] font-medium font-outfit uppercase mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                          কোড: {dept.code}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Semester Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  পর্ব / সেমিস্টার <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {(['1', '2', '3', '4', '5', '6', '7', '8'] as SemesterId[]).map((sem) => {
                    const isSelected = manualSemesterId === sem;
                    return (
                      <button
                        key={sem}
                        type="button"
                        onClick={() => setManualSemesterId(sem)}
                        className={`py-2 px-1 rounded-xl text-center border font-bold text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block text-xs font-black">{SEMESTER_MAP[sem]}</span>
                        <span className={`block text-[9px] font-outfit ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                          SEM {sem}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exam Selection (Filtered by Tech & Semester) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    পরীক্ষার নাম ও ধরন <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setManualExamSheetOpen(true)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    সকল পরীক্ষা দেখুন
                  </button>
                </div>

                {(() => {
                  const matchingExams = exams.filter(
                    (e) => (!manualDeptId || e.departmentId === manualDeptId) && (!manualSemesterId || e.semesterId === manualSemesterId)
                  );

                  if (matchingExams.length === 0) {
                    return (
                      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-center space-y-2">
                        <p className="text-xs font-bold text-amber-900">
                          নির্বাচিত টেকনোলজি ও পর্বের কোনো পরীক্ষা তৈরি নেই।
                        </p>
                        <p className="text-[11px] text-amber-700">
                          নিচের বাটন চেপে সিস্টেমের যেকোনো তৈরি পরীক্ষা থেকে সরাসরি নির্বাচন করতে পারেন।
                        </p>
                        <button
                          type="button"
                          onClick={() => setManualExamSheetOpen(true)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          সকল তৈরি পরীক্ষা হতে বাছাই করুন
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {matchingExams.map((ex) => {
                        const isSelected = manualExamId === ex.id;
                        return (
                          <div
                            key={ex.id}
                            onClick={() => {
                              setManualExamId(ex.id);
                              setManualDeptId(ex.departmentId);
                              setManualSemesterId(ex.semesterId);
                            }}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-blue-50/90 border-blue-500 shadow-2xs'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black text-slate-900 truncate">
                                  {ex.title}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase font-outfit">
                                  {ex.examType}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                তারিখ: {ex.examDate} • পূর্ণমান: {ex.totalMarks} • বিষয়: {toBanglaDigits(ex.subjects?.length || 0)}টি
                              </p>
                            </div>

                            <div className="shrink-0">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                                  isSelected
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Selected Exam Information Confirmation Card */}
              {activeExamForManual && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      {activeExamForManual.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 text-[10px] font-bold">
                      {activeExamForManual.departmentName}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">পর্ব:</span>
                      <span className="font-bold text-slate-800">{SEMESTER_MAP[activeExamForManual.semesterId]}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">পরীক্ষার ধরন:</span>
                      <span className="font-bold text-slate-800">{activeExamForManual.examType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">পরীক্ষার তারিখ:</span>
                      <span className="font-bold text-slate-800 font-outfit">{activeExamForManual.examDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">নির্ধারিত মোট পূর্ণমান:</span>
                      <span className="font-bold text-slate-800 font-outfit">{activeExamForManual.totalMarks}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1 Actions */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={!activeExamForManual}
                  onClick={() => {
                    if (!activeExamForManual) {
                      setManualError('অনুগ্রহ করে একটি পরীক্ষা নির্বাচন করুন।');
                      return;
                    }
                    setManualError(null);
                    setManualStep(2);
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                >
                  <span>পরবর্তী: শিক্ষার্থীর তথ্য</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: STUDENT INFORMATION ================= */}
          {manualStep === 2 && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
                <p className="text-xs font-bold text-emerald-900 mb-0.5">ধাপ ২: শিক্ষার্থীর তথ্য প্রদান</p>
                <p className="text-[11px] text-emerald-700">
                  রোল নম্বর লিখলে ডেটাবেজে বিদ্যমান শিক্ষার্থীর নাম ও তথ্য স্বয়ংক্রিয়ভাবে পূরণ হবে।
                </p>
              </div>

              {/* Roll Number Input with Live Match Indicator */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  রোল নম্বর <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="শিক্ষার্থীর রোল নম্বর লিখুন (উদাঃ ৬২২৭৫১)"
                    value={manualRoll}
                    onChange={(e) => handleManualRollChange(e.target.value)}
                    required
                    className="w-full px-3.5 py-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-base font-black font-outfit outline-none focus:border-blue-500 focus:bg-white transition-all tracking-wider"
                  />
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>

                {/* Auto-Match Feedback Badge */}
                {manualRoll.trim() && (
                  <div className="pt-0.5">
                    {studentAutoMatched ? (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>শিক্ষার্থীর তথ্য ডেটাবেজ থেকে স্বয়ংক্রিয়ভাবে যুক্ত হয়েছে ({matchedStudentDept || 'DPIB'})</span>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>নতুন শিক্ষার্থীর জন্য সরাসরি নাম ও তথ্য প্রদান করুন।</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Student Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  শিক্ষার্থীর পুরো নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="শিক্ষার্থীর পুরো নাম লিখুন"
                  value={manualStudentName}
                  onChange={(e) => setManualStudentName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Student ID */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    শিক্ষার্থী আইডি (STUDENT ID)
                  </label>
                  <input
                    type="text"
                    placeholder="উদাঃ DPIB-622751"
                    value={manualStudentId}
                    onChange={(e) => setManualStudentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium font-outfit outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Registration Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    রেজিস্ট্রেশন নম্বর (REGISTRATION NO)
                  </label>
                  <input
                    type="text"
                    placeholder="উদাঃ ১৫০২১..."
                    value={manualReg}
                    onChange={(e) => setManualReg(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium font-outfit outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Step 2 Actions */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setManualStep(1)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>পূর্ববর্তী ধাপ</span>
                </button>
                <button
                  type="button"
                  disabled={!manualRoll.trim() || !manualStudentName.trim()}
                  onClick={() => {
                    if (!manualRoll.trim() || !manualStudentName.trim()) {
                      setManualError('অনুগ্রহ করে শিক্ষার্থীর রোল নম্বর ও নাম লিখুন।');
                      return;
                    }
                    setManualError(null);
                    setManualStep(3);
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                >
                  <span>পরবর্তী: বিষয়ভিত্তিক নম্বর</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: SUBJECT MARKS & FULL MARKS ================= */}
          {manualStep === 3 && activeExamForManual && (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-indigo-950 mb-0.5">ধাপ ৩: বিষয়ভিত্তিক নম্বর প্রদান</p>
                    <p className="text-[11px] text-indigo-700">
                      পরীক্ষার কনফিগারেশন হতে নির্ধারিত পূর্ণমান প্রদর্শিত হচ্ছে। প্রয়োজনে পূর্ণমান সম্পাদনা করতে পারেন।
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-white text-indigo-900 border border-indigo-200 text-xs font-black shrink-0">
                    {toBanglaDigits(activeExamForManual.subjects?.length || 0)}টি বিষয়
                  </span>
                </div>
              </div>

              {/* Subjects Mark Entry List */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {(activeExamForManual.subjects || []).map((sub) => {
                  const effectiveFullMarks = manualCustomFullMarks[sub.code] ?? sub.fullMarks;
                  const obtainedVal = manualSubjectsMarks[sub.code] ?? '';
                  const numVal = obtainedVal === '' ? null : Number(obtainedVal);
                  const isOverMark = numVal !== null && numVal > effectiveFullMarks;
                  const isNegative = numVal !== null && numVal < 0;
                  const gradeInfo = numVal !== null && !isOverMark && !isNegative
                    ? calculateSubjectGrade(numVal, effectiveFullMarks)
                    : null;
                  const isEditingFull = editingFullMarksCode === sub.code;

                  return (
                    <div
                      key={sub.code}
                      className={`p-3 rounded-2xl border transition-all ${
                        isOverMark || isNegative
                          ? 'bg-rose-50/80 border-rose-300'
                          : 'bg-slate-50/90 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-mono text-[11px] font-bold">
                              {sub.code}
                            </span>
                            <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {sub.name}
                            </span>
                          </div>

                          {/* Full Marks Display & Edit Toggle */}
                          <div className="flex items-center gap-2 mt-1 text-[11px]">
                            <span className="text-slate-500 font-medium">নির্ধারিত পূর্ণমান:</span>
                            {isEditingFull ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={1}
                                  value={effectiveFullMarks}
                                  onChange={(e) =>
                                    setManualCustomFullMarks({
                                      ...manualCustomFullMarks,
                                      [sub.code]: Number(e.target.value) || 1,
                                    })
                                  }
                                  className="w-16 px-1.5 py-0.5 bg-white border border-blue-400 rounded text-center text-xs font-bold outline-none font-outfit"
                                />
                                <button
                                  type="button"
                                  onClick={() => setEditingFullMarksCode(null)}
                                  className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold cursor-pointer"
                                >
                                  সংরক্ষণ
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-slate-800 font-outfit">{effectiveFullMarks}</span>
                                <button
                                  type="button"
                                  onClick={() => setEditingFullMarksCode(sub.code)}
                                  className="text-blue-600 hover:text-blue-800 text-[10px] font-bold inline-flex items-center gap-0.5 cursor-pointer ml-1"
                                  title="পূর্ণমান পরিবর্তন করুন"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>সম্পাদনা</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Mark Input & Realtime Calculated Grade */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {gradeInfo && (
                            <span
                              className={`px-2.5 py-1 rounded-xl text-xs font-black font-outfit border ${
                                gradeInfo.isPassed
                                  ? gradeInfo.gradePoint >= 3.5
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                                    : 'bg-blue-100 text-blue-900 border-blue-200'
                                  : 'bg-rose-100 text-rose-900 border-rose-200'
                              }`}
                            >
                              {gradeInfo.grade} ({gradeInfo.gradePoint.toFixed(2)})
                            </span>
                          )}

                          <div className="space-y-0.5">
                            <input
                              type="number"
                              placeholder="প্রাপ্ত নম্বর"
                              value={obtainedVal}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : Number(e.target.value);
                                setManualSubjectsMarks({
                                  ...manualSubjectsMarks,
                                  [sub.code]: val,
                                });
                              }}
                              max={effectiveFullMarks}
                              min={0}
                              className={`w-24 px-3 py-2 bg-white border rounded-xl text-sm font-bold text-center outline-none font-outfit ${
                                isOverMark || isNegative
                                  ? 'border-rose-500 text-rose-700 bg-rose-50'
                                  : 'border-slate-300 focus:border-blue-500'
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {isOverMark && (
                        <p className="text-[10px] text-rose-600 font-bold mt-1">
                          প্রাপ্ত নম্বর পূর্ণমানের ({effectiveFullMarks}) চেয়ে বেশি হতে পারে না!
                        </p>
                      )}
                      {isNegative && (
                        <p className="text-[10px] text-rose-600 font-bold mt-1">
                          প্রাপ্ত নম্বর শূন্যের চেয়ে কম হতে পারে না!
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Step 3 Actions */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setManualStep(2)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>পূর্ববর্তী ধাপ</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Check for invalid marks
                    for (const sub of activeExamForManual.subjects || []) {
                      const full = manualCustomFullMarks[sub.code] ?? sub.fullMarks;
                      const val = Number(manualSubjectsMarks[sub.code] ?? 0);
                      if (val > full) {
                        setManualError(`"${sub.name}" বিষয়ের প্রাপ্ত নম্বর নির্ধারিত পূর্ণমানের চেয়ে বেশি!`);
                        return;
                      }
                      if (val < 0) {
                        setManualError(`"${sub.name}" বিষয়ের প্রাপ্ত নম্বর নেতিবাচক হতে পারে না!`);
                        return;
                      }
                    }
                    setManualError(null);
                    setManualStep(4);
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span>পরবর্তী: ফলাফল যাচাই ও প্রকাশ</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 4: VERIFICATION & PUBLISH ================= */}
          {manualStep === 4 && activeExamForManual && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl">
                <p className="text-xs font-bold text-slate-100 mb-0.5">ধাপ ৪: ফলাফল যাচাই ও প্রকাশ</p>
                <p className="text-[11px] text-slate-300">
                  নিচের স্বয়ংক্রিয় হিসাব ও মেটাডেটা যাচাই করে চূড়ান্তভাবে ফলাফল প্রকাশ করুন।
                </p>
              </div>

              {/* Computed Live Summary Stats */}
              {(() => {
                const subArray: SubjectResult[] = (activeExamForManual.subjects || []).map((sub) => {
                  const full = manualCustomFullMarks[sub.code] ?? sub.fullMarks;
                  const obtained = Number(manualSubjectsMarks[sub.code] || 0);
                  const gradeInfo = calculateSubjectGrade(obtained, full);
                  return {
                    subjectCode: sub.code,
                    subjectName: sub.name,
                    fullMarks: full,
                    obtainedMarks: obtained,
                    grade: gradeInfo.grade,
                    gradePoint: gradeInfo.gradePoint,
                    isPassed: gradeInfo.isPassed,
                  };
                });
                const calculated = calculateResultGrades(subArray);
                const percentage = ((calculated.totalObtainedMarks / (calculated.totalFullMarks || 1)) * 100).toFixed(1);

                // Duplicate Check: Check if this roll already has a result in this exam
                const cleanRoll = toEnglishDigits(manualRoll.trim());
                const existingResult = results.find(
                  (r) => r.examId === activeExamForManual.id && toEnglishDigits(r.roll) === cleanRoll
                );

                return (
                  <div className="space-y-3">
                    {/* Student & Exam Header Info */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <p className="font-black text-slate-900 text-sm">{manualStudentName}</p>
                        <p className="text-slate-500 font-bold mt-0.5">
                          রোল: <span className="font-outfit text-slate-900">{manualRoll}</span> • রেজিঃ <span className="font-outfit text-slate-900">{manualReg || 'N/A'}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 font-bold text-xs">
                          {activeExamForManual.title}
                        </span>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {activeExamForManual.departmentName} • {SEMESTER_MAP[activeExamForManual.semesterId]}
                        </p>
                      </div>
                    </div>

                    {/* Calculated GPA & Metrics Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-center">
                        <span className="text-[10px] font-extrabold uppercase text-blue-700 tracking-wider">মোট প্রাপ্ত নম্বর</span>
                        <p className="text-lg font-black text-blue-950 font-outfit mt-0.5">
                          {calculated.totalObtainedMarks} <span className="text-xs text-blue-600 font-normal">/ {calculated.totalFullMarks}</span>
                        </p>
                        <span className="text-[10px] font-bold text-blue-700 font-outfit">{percentage}%</span>
                      </div>

                      <div className="p-3 bg-violet-50/80 border border-violet-200/80 rounded-2xl text-center">
                        <span className="text-[10px] font-extrabold uppercase text-violet-700 tracking-wider">সিজিপিএ (GPA)</span>
                        <p className="text-xl font-black text-violet-950 font-outfit mt-0.5">
                          {calculated.gpa.toFixed(2)}
                        </p>
                        <span className="text-[10px] font-bold text-violet-700">আউট অফ ৪.০০</span>
                      </div>

                      <div className="p-3 bg-teal-50/80 border border-teal-200/80 rounded-2xl text-center">
                        <span className="text-[10px] font-extrabold uppercase text-teal-700 tracking-wider">লেটার গ্রেড</span>
                        <p className="text-xl font-black text-teal-950 font-outfit mt-0.5">
                          {calculated.letterGrade}
                        </p>
                        <span className="text-[10px] font-bold text-teal-700">বাংলাদেশ কারিগরি বোর্ড</span>
                      </div>

                      <div className={`p-3 rounded-2xl text-center border ${
                        calculated.isPassed
                          ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-950'
                          : 'bg-rose-50/80 border-rose-200/80 text-rose-950'
                      }`}>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider">ফলাফল স্ট্যাটাস</span>
                        <p className="text-base font-black mt-0.5">
                          {calculated.isPassed ? 'উত্তীর্ণ (PASSED)' : 'অকৃতকার্য (FAILED)'}
                        </p>
                        <span className="text-[10px] font-bold">
                          {calculated.isPassed ? 'সফলভাবে উত্তীর্ণ' : 'পুনরায় পরীক্ষা প্রযোজ্য'}
                        </span>
                      </div>
                    </div>

                    {/* Duplicate Result Warning Notification */}
                    {existingResult && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">সতর্কতা: এই রোল নম্বরের একটি ফলাফল ইতোমধ্যে বিদ্যমান!</p>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            পূর্বের GPA ছিল {existingResult.gpa.toFixed(2)} ({existingResult.letterGrade})। সংরক্ষণ করলে এই রেকর্ডটি নতুন প্রাপ্ত নম্বর দ্বারা হালনাগাদ হবে।
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Interactive Result Card Preview Action */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const preview = buildCurrentStudentResult();
                          if (preview) {
                            setPreviewResult(preview);
                          }
                        }}
                        className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-bold transition-all border border-slate-300 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                        <span>অফিসিয়াল মার্কশিট কার্ড প্রিভিউ দেখুন</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Step 4 Actions */}
              <div className="pt-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setManualStep(3)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>নম্বর সংশোধন</span>
                </button>

                <button
                  type="button"
                  disabled={manualSaving}
                  onClick={() => handleManualSave()}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {manualSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>সংরক্ষণ ও প্রকাশ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ফলাফল সংরক্ষণ ও প্রকাশ নিশ্চিত করুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Result Card Preview Sheet */}
      <ResultBottomSheet
        isOpen={Boolean(previewResult)}
        onClose={() => setPreviewResult(null)}
        result={previewResult}
      />

      {/* ================= MODAL BOTTOM SHEETS ================= */}

      {/* Exam Filter Bottom Sheet */}
      <SelectBottomSheet
        isOpen={examFilterSheetOpen}
        onClose={() => setExamFilterSheetOpen(false)}
        title="পরীক্ষা নির্বাচন করুন"
        subtitle="নির্দিষ্ট পরীক্ষার ফলাফল ফিল্টার করতে নির্বাচন করুন"
        options={examFilterOptions}
        selectedValue={selectedExamId}
        onSelect={(val) => setSelectedExamId(val)}
      />

      {/* Department / Technology Filter Bottom Sheet */}
      <SelectBottomSheet
        isOpen={deptFilterSheetOpen}
        onClose={() => setDeptFilterSheetOpen(false)}
        title="টেকনোলজি নির্বাচন করুন"
        subtitle="নির্দিষ্ট ডিপার্টমেন্ট বা টেকনোলজির ফলাফল ফিল্টার করতে নির্বাচন করুন"
        options={deptFilterOptions}
        selectedValue={selectedDepartmentId}
        onSelect={(val) => setSelectedDepartmentId(val)}
      />

      {/* Status Filter Bottom Sheet */}
      <SelectBottomSheet
        isOpen={statusFilterSheetOpen}
        onClose={() => setStatusFilterSheetOpen(false)}
        title="ফলাফল অবস্থা ফিল্টার"
        subtitle="ফলাফলের স্ট্যাটাস অনুযায়ী প্রদর্শন ফিল্টার করুন"
        options={statusFilterOptions}
        selectedValue={statusFilter}
        onSelect={(val) => setStatusFilter(val)}
      />

      {/* Upload Publish Status Bottom Sheet */}
      <SelectBottomSheet
        isOpen={uploadPublishSheetOpen}
        onClose={() => setUploadPublishSheetOpen(false)}
        title="প্রকাশের অবস্থা নির্ধারণ"
        subtitle="আপলোডকৃত ফলাফল তাৎক্ষণিক প্রকাশ করবেন নাকি খসড়া রাখবেন?"
        options={publishStatusOptions}
        selectedValue={uploadPublishStatus}
        onSelect={(val) => setUploadPublishStatus(val as any)}
      />

      {/* Override Exam Bottom Sheet */}
      <SelectBottomSheet
        isOpen={overrideExamSheetOpen}
        onClose={() => setOverrideExamSheetOpen(false)}
        title="পরীক্ষা সংশ্লিষ্টকরণ"
        subtitle="JSON ডেটা থেকে পরীক্ষা সনাক্ত করুন অথবা বিদ্যমান পরীক্ষায় যুক্ত করুন"
        options={overrideExamOptions}
        selectedValue={selectedOverrideExamId}
        onSelect={(val) => setSelectedOverrideExamId(val)}
      />

      {/* Manual Exam Bottom Sheet */}
      <SelectBottomSheet
        isOpen={manualExamSheetOpen}
        onClose={() => setManualExamSheetOpen(false)}
        title="পরীক্ষা নির্বাচন করুন"
        subtitle="যার অধীনে ফলাফল এন্ট্রি করতে চান"
        options={exams.map((ex) => ({
          value: ex.id,
          label: ex.title,
          sublabel: `${ex.departmentName} • ${SEMESTER_MAP[ex.semesterId]}`,
          badge: ex.examType,
          icon: BookOpen,
        }))}
        selectedValue={manualExamId}
        onSelect={(val) => {
          setManualExamId(val);
          setManualSubjectsMarks({});
        }}
      />

      {/* ================= DELETE CONFIRMATION BOTTOM SHEET ================= */}
      <BottomSheet
        isOpen={!!deleteConfirmResult}
        onClose={() => {
          if (!isDeletingResult) {
            setDeleteConfirmResult(null);
            setDeleteError(null);
          }
        }}
        title="ফলাফল রেকর্ড মোছা নিশ্চিতকরণ"
        subtitle="এই ক্রিয়াকলাপটি স্থায়ী এবং ফায়ারস্টোর থেকে এই শিক্ষার্থীর ফলাফল রেকর্ড সম্পূর্ণ মুছে ফেলবে।"
        maxHeight="max-h-[90vh]"
      >
        {deleteConfirmResult && (
          <div className="space-y-4 pb-4">
            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">শিক্ষার্থীর নাম:</span>
                <span className="font-bold text-slate-900">{deleteConfirmResult.studentName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">রোল নম্বর:</span>
                <span className="font-bold font-outfit text-slate-900">{toBanglaDigits(deleteConfirmResult.roll)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">পরীক্ষা:</span>
                <span className="text-slate-700 text-xs">{deleteConfirmResult.examTitle}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">প্রাপ্ত নম্বর ও জিপিএ:</span>
                <span className="font-bold text-blue-600 font-outfit">
                  {toBanglaDigits(deleteConfirmResult.totalObtainedMarks)} / {toBanglaDigits(deleteConfirmResult.totalFullMarks)} (GPA: {toBanglaNumber(deleteConfirmResult.gpa, 2)})
                </span>
              </div>
            </div>

            <p className="text-xs text-rose-600 bg-rose-50/60 p-3 rounded-xl border border-rose-100">
              সতর্কতা: মুছে ফেলার পর এই শিক্ষার্থীর মার্কশিট বা ফলাফল আর পাবলিক রেজাল্ট পেজে প্রদর্শিত হবে না।
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmResult(null);
                  setDeleteError(null);
                }}
                disabled={isDeletingResult}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingResult}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                {isDeletingResult ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>মুছে ফেলা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>স্থায়ীভাবে মুছুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* ================= DELETE ALL RESULTS BOTTOM SHEET ================= */}
      <BottomSheet
        isOpen={deleteAllModalOpen}
        onClose={() => {
          if (!isDeletingAll) {
            setDeleteAllModalOpen(false);
            setDeleteError(null);
          }
        }}
        title="এক ক্লিকে সকল ফলাফল মুছে ফেলা"
        subtitle="ফায়ারস্টোর ডাটাবেজ থেকে সংরক্ষিত ফলাফল রেকর্ড সম্পূর্ণ মুছে ফেলুন।"
        maxHeight="max-h-[90vh]"
      >
        <div className="space-y-4 pb-4">
          {deleteError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{deleteError}</span>
            </div>
          )}

          <div className="p-4 bg-rose-50/70 border border-rose-200/90 rounded-2xl space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl shrink-0 mt-0.5">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-900">
                  আপনি কি নিশ্চিত যে সকল ফলাফল ডাটাবেজ থেকে মুছে ফেলতে চান?
                </h4>
                <p className="text-xs text-rose-700 mt-1">
                  বর্তমানে এই তালিকায় মোট {toBanglaDigits(results.length)}টি ফলাফল রয়েছে। এক ক্লিকে মুছে ফেলার পর এগুলো আর পুনরুদ্ধার করা যাবে না।
                </p>
              </div>
            </div>

            {selectedExamId !== 'ALL' && (
              <div className="pt-3 border-t border-rose-200/70 space-y-2">
                <label className="text-xs font-bold text-slate-800 block">মুছে ফেলার অপশন নির্বাচন করুন:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteAllScope('FILTERED')}
                    className={`p-3 rounded-xl text-left border text-xs font-semibold transition-all cursor-pointer ${
                      deleteAllScope === 'FILTERED'
                        ? 'border-rose-600 bg-rose-100 text-rose-900 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold text-slate-900">নির্বাচিত পরীক্ষা শুধু</span>
                    <span className="text-[11px] text-slate-500 truncate block mt-0.5">{examFilterDisplay}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteAllScope('ALL')}
                    className={`p-3 rounded-xl text-left border text-xs font-semibold transition-all cursor-pointer ${
                      deleteAllScope === 'ALL'
                        ? 'border-rose-600 bg-rose-100 text-rose-900 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold text-slate-900">সম্পূর্ণ ডাটাবেজ</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">সকল পরীক্ষার সব ফলাফল সম্পূর্ণ মুছুন</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>মুছে ফেলার পর পাবলিক সার্চ বা মার্কশিটে কোনো ফলাফল পাওয়া যাবে না।</span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setDeleteAllModalOpen(false);
                setDeleteError(null);
              }}
              disabled={isDeletingAll}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={() => handleDeleteAll(selectedExamId !== 'ALL' ? deleteAllScope : 'ALL')}
              disabled={isDeletingAll}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {isDeletingAll ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>মুছে ফেলা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>হ্যাঁ, এক ক্লিকে সকল ফলাফল মুছুন</span>
                </>
              )}
            </button>
          </div>
        </div>
      </BottomSheet>
      {/* Processing & Data Action Loading Overlay */}
      <LoadingOverlay
        isVisible={isProcessingUpload || isDeletingAll || isDeletingResult || manualSaving}
        message={
          isProcessingUpload || manualSaving
            ? 'ফলাফল প্রকাশ করা হচ্ছে...'
            : isDeletingAll || isDeletingResult
            ? 'তথ্য মুছে ফেলা হচ্ছে...'
            : 'তথ্য সংরক্ষণ করা হচ্ছে...'
        }
        subtext="অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন, ডেটাবেস সিঙ্ক চলছে..."
      />
    </div>
  );
};
