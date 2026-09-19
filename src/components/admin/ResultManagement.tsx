import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
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
  parseExcelFile,
  parseJsonResults,
  generateSampleExcel,
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
  // Step 1: Upload (File / JSON)
  // Step 2: Validation & Detected Exam Preview
  // Step 3: Confirmation & Batch Publish
  const [uploadTab, setUploadTab] = useState<'EXCEL' | 'JSON'>('EXCEL');
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

  // Manual Entry States
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [manualExamId, setManualExamId] = useState<string>(exams[0]?.id || '');
  const [manualExamSheetOpen, setManualExamSheetOpen] = useState(false);
  const [manualStudentName, setManualStudentName] = useState('');
  const [manualRoll, setManualRoll] = useState('');
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualReg, setManualReg] = useState('');
  const [manualSubjectsMarks, setManualSubjectsMarks] = useState<{ [code: string]: number }>({});
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
      setManualStudentName('');
      setManualReg('');
      setManualStudentId('');
      return;
    }
    if (studentsList && studentsList.length > 0) {
      const matched = studentsList.find(
        (s) => toEnglishDigits(s.roll || '').trim() === cleanRoll
      );
      if (matched) {
        setManualStudentName(matched.name || '');
        setManualReg(matched.registration || '');
        setManualStudentId(matched.studentId || '');
      } else {
        setManualStudentName('');
        setManualReg('');
        setManualStudentId('');
      }
    } else {
      setManualStudentName('');
      setManualReg('');
      setManualStudentId('');
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

  const activeExamForManual = exams.find((e) => e.id === manualExamId);

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
      label: 'স্বয়ংক্রিয় সনাক্তকরণ (ফাইল থেকে গ্রহণ বা তৈরি করুন)',
      sublabel: detectedExam ? `${detectedExam.title} (${detectedExam.departmentName})` : 'ফাইল বিশ্লেষণে প্রাপ্ত তথ্য',
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

  // Direct Excel Upload Handler (NO mandatory exam selection required)
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsProcessingUpload(true);
    setUploadErrors([]);
    setUploadSuccessSummary(null);

    const chosenExam = selectedOverrideExamId !== 'AUTO' ? exams.find((x) => x.id === selectedOverrideExamId) : null;

    try {
      const parsed = await parseExcelFile(file, chosenExam, uploadPublishStatus, undefined, exams);
      setParsedReport(parsed);
      setParsedPreviewList(parsed.results);
      setDetectedExam(parsed.detectedExam || null);
      setIsAutoCreatedExam(Boolean(parsed.autoCreatedExam));
      setUploadErrors(parsed.errors);

      if (parsed.errors.length === 0 && parsed.validRows > 0) {
        setUploadSuccessSummary(
          `সফলভাবে ${toBanglaDigits(parsed.validRows)} জন শিক্ষার্থীর ফলাফল যাচাই হয়েছে! পরীক্ষা: ${parsed.detectedExam?.title || 'সনাক্তকৃত পরীক্ষা'}`
        );
      }
      setUploadStep('PREVIEW');
    } catch (err: any) {
      setUploadErrors([err.message || 'এক্সেল ফাইল পার্স করতে সমস্যা হয়েছে।']);
      setParsedReport(null);
    } finally {
      setIsProcessingUpload(false);
      // reset file input value so re-selecting same file triggers onChange
      e.target.value = '';
    }
  };

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
            description: detectedExam.description || 'এক্সেল/JSON আপলোড হতে স্বয়ংক্রিয় তৈরি',
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

  // Manual Result Save
  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    if (!activeExamForManual) {
      setManualError('অনুগ্রহ করে পরীক্ষা নির্বাচন করুন।');
      return;
    }

    const cleanName = manualStudentName.trim();
    const cleanRoll = toEnglishDigits(manualRoll.trim());
    if (!cleanName || !cleanRoll) {
      setManualError('শিক্ষার্থীর নাম ও রোল নম্বর লিখুন।');
      return;
    }

    const subjectMarksArray: SubjectResult[] = activeExamForManual.subjects.map((sub) => {
      const obtained = Number(manualSubjectsMarks[sub.code] || 0);
      const gradeInfo = calculateSubjectGrade(obtained, sub.fullMarks);
      return {
        subjectCode: sub.code,
        subjectName: sub.name,
        fullMarks: sub.fullMarks,
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
      setManualSubjectsMarks({});
      fetchResults();
      if (onRefreshStats) onRefreshStats();
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
            মোট ফলাফল রেকর্ড: {toBanglaDigits(results.length)}টি (সরাসরি Excel/JSON ফাইল আপলোড ও স্বয়ংক্রিয় প্রসেসিং)
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
            <Upload className="w-4 h-4" />
            <span>ফলাফল ফাইল আপলোড</span>
          </button>

          <button
            onClick={() => {
              setManualError(null);
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
          icon={FileSpreadsheet}
          title="কোনো ফলাফল রেকর্ড পাওয়া যায়নি"
          description="এক্সেল বা JSON ফাইলের মাধ্যমে সরাসরি ফলাফল ফায়ারস্টোরে আপলোড করুন।"
          actionText="ফাইল আপলোড করুন"
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
        title="ফলাফল ডেটা আপলোড ও প্রকাশ"
        subtitle="সরাসরি Excel (.xlsx / .csv) বা JSON আপলোড করুন — পরীক্ষা নির্বাচন বাধ্যতামূলক নয়, সিস্টেম স্বয়ংক্রিয়ভাবে সনাক্ত ও প্রসেস করবে"
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
              <span>ফাইল নির্বাচন</span>
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

          {/* ================= STEP 1: FILE SELECTION ================= */}
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
                  displayValue={selectedOverrideExamId === 'AUTO' ? 'স্বয়ংক্রিয় সনাক্তকরণ (ফাইল থেকে)' : exams.find(x => x.id === selectedOverrideExamId)?.title}
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
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-emerald-900 text-xs sm:text-sm flex items-center gap-1.5">
                        <span>{parsedReport.fileName || uploadedFileName || 'নির্বাচিত ফলাফল ফাইল'}</span>
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

              {/* Upload Method Tabs */}
              <div className="flex items-center border-b border-slate-200">
                <button
                  onClick={() => setUploadTab('EXCEL')}
                  className={`flex items-center space-x-2 py-2.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
                    uploadTab === 'EXCEL'
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>এক্সেল স্প্রেডশিট আপলোড</span>
                </button>
                <button
                  onClick={() => setUploadTab('JSON')}
                  className={`flex items-center space-x-2 py-2.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
                    uploadTab === 'JSON'
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FileCode className="w-4 h-4" />
                  <span>JSON ডেটা ইনপুট</span>
                </button>
              </div>

              {/* EXCEL TAB */}
              {uploadTab === 'EXCEL' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      সঠিক কলাম ফরম্যাট নিশ্চিতে নমুনা টেমপ্লেট ডাউনলোড করতে পারেন:
                    </span>
                    <button
                      onClick={() => generateSampleExcel(null)}
                      className="flex items-center space-x-1 text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>নমুনা এক্সেল টেমপ্লেট</span>
                    </button>
                  </div>

                  {/* File Dropzone */}
                  <label className="flex flex-col items-center justify-center p-7 border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/30 rounded-2xl cursor-pointer transition-all text-center group">
                    <Upload className="w-9 h-9 text-slate-400 group-hover:text-blue-600 mb-2 transition-transform group-hover:-translate-y-0.5" />
                    <span className="font-bold text-slate-800 text-sm">
                      ফাইল নির্বাচন করতে ক্লিক করুন বা টেনে আনুন
                    </span>
                    <span className="text-xs text-slate-400 mt-1">.xlsx, .xls অথবা .csv ফাইল সাপোর্ট করে</span>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleExcelUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* JSON TAB */}
              {uploadTab === 'JSON' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      JSON ফরম্যাট রেজাল্ট অ্যারে
                    </label>
                    <button
                      type="button"
                      onClick={() => setJsonInputText(generateSampleJson(null))}
                      className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>নমুনা লোড করুন</span>
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={jsonInputText}
                    onChange={(e) => setJsonInputText(e.target.value)}
                    placeholder='[{"roll": "601234", "name": "মোঃ আরিয়ান আহমেদ", "66611": 85, "66612": 78}]'
                    className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleJsonUpload}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    JSON প্রসেস ও যাচাই করুন
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2: PREVIEW & VERIFY ================= */}
          {uploadStep === 'PREVIEW' && (
            <div className="space-y-4">
              {!parsedReport ? (
                <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                  <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700">এখনও কোনো ফাইল নির্বাচন করা হয়নি</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    ফলাফল তালিকা প্রিভিউ ও যাচাই করার জন্য প্রথমে ধাপ ১ (ফাইল নির্বাচন) থেকে এক্সেল বা JSON ফাইল নির্বাচন করুন।
                  </p>
                  <button
                    type="button"
                    onClick={() => setUploadStep('FILE')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>ফাইল নির্বাচন করতে যান</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* File Metadata Header Bar */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-slate-900">{parsedReport.fileName}</span>
                      <span className="text-slate-400">({parsedReport.sheetName})</span>
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
                        <span>ফাইলে {toBanglaDigits(parsedReport.invalidRows)}টি সারিতে ত্রুটি পাওয়া গেছে (সংশোধন আবশ্যক):</span>
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
                        * ত্রুটিযুক্ত অবস্থায় ফলাফল নিশ্চিত করা যাবে না। অনুগ্রহ করে ফাইল সংশোধন করে পুনরায় আপলোড করুন।
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
                      ← ফাইল পরিবর্তন করুন
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
                    ফলাফল নিশ্চিত ও ফায়ারস্টোরে সংরক্ষণের জন্য প্রথমে ধাপ ১ থেকে ফাইল আপলোড করুন।
                  </p>
                  <button
                    type="button"
                    onClick={() => setUploadStep('FILE')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>ফাইল আপলোড করতে যান</span>
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
                        নতুন ফাইল আপলোড
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Manual Single Result Entry Bottom Sheet */}
      <BottomSheet
        isOpen={manualSheetOpen}
        onClose={() => setManualSheetOpen(false)}
        title="একক ফলাফল এন্ট্রি"
        subtitle="নির্দিষ্ট শিক্ষার্থীর বিষয়ভিত্তিক নম্বর প্রবেশ করান"
        maxHeight="max-h-[95vh]"
      >
        <form onSubmit={handleManualSave} className="space-y-4 pb-6">
          {manualError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
              {manualError}
            </div>
          )}

          <SelectTrigger
            label="পরীক্ষা নির্বাচন করুন"
            required
            value={manualExamId}
            displayValue={activeExamForManual ? `${activeExamForManual.title} (${activeExamForManual.departmentName})` : ''}
            onClick={() => setManualExamSheetOpen(true)}
            icon={BookOpen}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                রোল নম্বর <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="রোল নম্বর লিখুন"
                value={manualRoll}
                onChange={(e) => handleManualRollChange(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-outfit outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">শিক্ষার্থী আইডি</label>
              <input
                type="text"
                placeholder="শিক্ষার্থী আইডি লিখুন"
                value={manualStudentId}
                onChange={(e) => setManualStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">রেজিস্ট্রেশন নম্বর</label>
              <input
                type="text"
                placeholder="রেজিস্ট্রেশন নম্বর লিখুন"
                value={manualReg}
                onChange={(e) => setManualReg(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
              />
            </div>
          </div>

          {/* Dynamic Subject Mark Inputs */}
          {activeExamForManual && (
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                বিষয়ভিত্তিক প্রাপ্ত নম্বর প্রদান করুন ({toBanglaDigits(activeExamForManual.subjects.length)}টি বিষয়)
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                {activeExamForManual.subjects.map((sub) => {
                  const val = manualSubjectsMarks[sub.code] ?? '';
                  const gradeInfo = val !== '' ? calculateSubjectGrade(Number(val), sub.fullMarks) : null;
                  return (
                    <div
                      key={sub.code}
                      className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-600 mr-1.5">[{sub.code}]</span>
                        <span className="font-semibold text-slate-900">{sub.name}</span>
                        <span className="text-slate-400 block text-[11px]">পূর্ণমান: {sub.fullMarks}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {gradeInfo && (
                          <span className="font-bold text-blue-700 font-outfit bg-blue-100 px-2 py-0.5 rounded">
                            {gradeInfo.grade} ({gradeInfo.gradePoint.toFixed(2)})
                          </span>
                        )}
                        <input
                          type="number"
                          placeholder="প্রাপ্ত নম্বর"
                          value={val}
                          onChange={(e) =>
                            setManualSubjectsMarks({
                              ...manualSubjectsMarks,
                              [sub.code]: Number(e.target.value),
                            })
                          }
                          max={sub.fullMarks}
                          min={0}
                          required
                          className="w-20 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-3">
            <button
              type="submit"
              disabled={manualSaving}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {manualSaving ? 'সংরক্ষণ হচ্ছে...' : 'ফলাফল সংরক্ষণ ও প্রকাশ করুন'}
            </button>
          </div>
        </form>
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
        subtitle="আপলোডকৃত ডেটা ফাইল থেকে গ্রহণ করুন অথবা বিদ্যমান পরীক্ষায় যুক্ত করুন"
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
