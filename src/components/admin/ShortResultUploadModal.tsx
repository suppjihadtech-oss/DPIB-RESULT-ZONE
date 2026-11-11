import React, { useState, useMemo } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Building,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Info,
  ShieldCheck,
  Download,
} from 'lucide-react';
import {
  Department,
  Exam,
  SemesterId,
  Student,
  StudentResult,
} from '../../types';
import {
  toBanglaDigits,
  toBanglaNumber,
  SEMESTER_MAP,
  toEnglishDigits,
} from '../../utils/bangla';
import {
  parseShortResultJson,
  generateSampleShortResultJson,
  ShortResultValidationReport,
  ShortResultRowValidation,
  DEFAULT_INSTITUTE_NAME,
} from '../../services/shortResultParser';
import { batchSaveResults, saveExam } from '../../services/db';
import { BottomSheet } from '../common/BottomSheet';
import { SelectBottomSheet, SelectTrigger } from '../common/SelectBottomSheet';
import { toast } from '../../context/ToastContext';

interface ShortResultUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  exams: Exam[];
  existingStudents: Student[];
  existingResults: StudentResult[];
  onUploadSuccess: () => void;
}

export const ShortResultUploadModal: React.FC<ShortResultUploadModalProps> = ({
  isOpen,
  onClose,
  departments,
  exams,
  existingStudents,
  existingResults,
  onUploadSuccess,
}) => {
  const [step, setStep] = useState<'INPUT' | 'PREVIEW' | 'CONFIRM'>('INPUT');
  const [jsonText, setJsonText] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [copiedSample, setCopiedSample] = useState(false);

  // Configuration & Overrides
  const [overrideExamTitle, setOverrideExamTitle] = useState<string>('');
  const [overrideYear, setOverrideYear] = useState<string>(new Date().getFullYear().toString());
  const [overrideSemesterId, setOverrideSemesterId] = useState<SemesterId>('2');
  const [overrideDepartmentId, setOverrideDepartmentId] = useState<string>('ALL');
  const [overrideInstituteName, setOverrideInstituteName] = useState<string>(DEFAULT_INSTITUTE_NAME);
  const [publishStatus, setPublishStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');
  const [overwriteDuplicates, setOverwriteDuplicates] = useState<boolean>(false);

  // Dropdown Sheets
  const [semSheetOpen, setSemSheetOpen] = useState(false);
  const [deptSheetOpen, setDeptSheetOpen] = useState(false);
  const [statusSheetOpen, setStatusSheetOpen] = useState(false);

  // Report & Filter in Preview
  const [report, setReport] = useState<ShortResultValidationReport | null>(null);
  const [previewFilterTab, setPreviewFilterTab] = useState<'ALL' | 'MATCHED' | 'UNMATCHED' | 'DUPLICATE' | 'ERRORS'>('ALL');
  const [previewSearch, setPreviewSearch] = useState<string>('');

  // Processing state
  const [isPublishing, setIsPublishing] = useState(false);

  // Handle File Upload (.json)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      toast.error('শুধুমাত্র .json ফাইল আপলোড করা সম্ভব।', 'INVALID FILE');
      return;
    }

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setJsonText(content);
        toast.info(`${file.name} ফাইলটি সফলভাবে লোড হয়েছে`, 'FILE LOADED');
      }
    };
    reader.onerror = () => {
      toast.error('ফাইল পড়তে সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'READ ERROR');
    };
    reader.readAsText(file);
  };

  // Copy sample JSON
  const handleCopySample = () => {
    const sample = generateSampleShortResultJson();
    navigator.clipboard.writeText(sample);
    setCopiedSample(true);
    toast.success('নমুনা JSON ক্লিপবোর্ডে কপি করা হয়েছে!', 'COPIED');
    setTimeout(() => setCopiedSample(false), 2000);
  };

  // Parse and move to Step 2
  const handleProceedToPreview = () => {
    if (!jsonText.trim()) {
      toast.warning('অনুগ্রহ করে JSON টেক্সট পেস্ট করুন অথবা ফাইল আপলোড করুন।', 'EMPTY INPUT');
      return;
    }

    const validationReport = parseShortResultJson(
      jsonText,
      existingStudents,
      existingResults,
      {
        overrideExamTitle: overrideExamTitle || undefined,
        overrideYear: overrideYear || undefined,
        overrideSemesterId,
        overrideDepartmentId,
        overrideInstituteName: overrideInstituteName || undefined,
        overwriteDuplicates,
        defaultStatus: publishStatus,
      }
    );

    setReport(validationReport);

    if (validationReport.totalRows === 0) {
      toast.error(validationReport.errors[0] || 'ফাইলে কোনো ফলাফল রেকর্ড খুঁজে পাওয়া যায়নি।', 'VALIDATION FAILED');
      return;
    }

    if (validationReport.invalidRows > 0) {
      toast.warning(
        `মোট ${toBanglaDigits(validationReport.invalidRows)}টি রেকর্ডে ত্রুটি সনাক্ত হয়েছে। প্রিভিউ চেক করুন।`,
        'WARNING'
      );
    } else {
      toast.success(
        `সফলভাবে ${toBanglaDigits(validationReport.validRows)}টি ফলাফল যাচাই সম্পন্ন হয়েছে!`,
        'VALIDATED'
      );
    }

    setStep('PREVIEW');
  };

  // Filtered rows for the preview table
  const filteredPreviewRows = useMemo(() => {
    if (!report) return [];
    return report.rows.filter((row) => {
      // Tab filter
      if (previewFilterTab === 'MATCHED' && !row.isStudentMatched) return false;
      if (previewFilterTab === 'UNMATCHED' && row.isStudentMatched) return false;
      if (previewFilterTab === 'DUPLICATE' && !row.isDuplicateInFile && !row.isDuplicateInDatabase) return false;
      if (previewFilterTab === 'ERRORS' && row.isValid) return false;

      // Search filter
      if (previewSearch.trim()) {
        const q = toEnglishDigits(previewSearch.toLowerCase().trim());
        const rowRoll = toEnglishDigits(row.roll).toLowerCase();
        const rowName = (row.matchedStudentName || '').toLowerCase();
        const rowDept = (row.departmentName || '').toLowerCase();
        return rowRoll.includes(q) || rowName.includes(q) || rowDept.includes(q);
      }

      return true;
    });
  }, [report, previewFilterTab, previewSearch]);

  // Commit and publish
  const handleCommitPublish = async () => {
    if (!report || report.resultsToPublish.length === 0) {
      toast.warning('সংরক্ষণ বা প্রকাশের জন্য কোনো বৈধ ফলাফল পাওয়া যায়নি।', 'EMPTY RESULTS');
      return;
    }

    setIsPublishing(true);
    const toastId = toast.loading('সংক্ষিপ্ত ফলাফল ডাটাবেজে সংরক্ষণ করা হচ্ছে...', 'SAVING');

    try {
      // Group results by examId (supports multiple departments in the same JSON)
      const resultsByExamId = new Map<string, StudentResult[]>();
      report.resultsToPublish.forEach((r) => {
        const list = resultsByExamId.get(r.examId) || [];
        list.push(r);
        resultsByExamId.set(r.examId, list);
      });

      let totalSaved = 0;

      for (const [examId, resultsList] of resultsByExamId.entries()) {
        const sampleResult = resultsList[0];
        const existingExam = exams.find((x) => x.id === examId);

        if (!existingExam) {
          await saveExam(
            {
              title: report.detectedExamTitle,
              semesterId: sampleResult.semesterId,
              departmentId: sampleResult.departmentId,
              departmentName: sampleResult.departmentName,
              examType: 'সংক্ষিপ্ত ফলাফল',
              examDate: new Date().toISOString().split('T')[0],
              academicYear: report.detectedAcademicYear,
              totalMarks: 0,
              description: `${report.detectedInstituteName ? `${report.detectedInstituteName} — ` : ''}বাংলাদেশ কারিগরি শিক্ষা বোর্ডের সংক্ষিপ্ত ফলাফল`,
              subjects: [],
              status: publishStatus,
              allowMeritList: true,
              publishedAt: publishStatus === 'PUBLISHED' ? Date.now() : undefined,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            examId
          );
        }

        const res = await batchSaveResults(
          resultsList,
          examId,
          publishStatus === 'PUBLISHED'
        );
        totalSaved += res.successCount;
      }

      toast.dismiss(toastId);
      toast.success(
        `সফলভাবে ${toBanglaDigits(totalSaved)}টি সংক্ষিপ্ত ফলাফল ${publishStatus === 'PUBLISHED' ? 'প্রকাশিত' : 'সংরক্ষিত'} হয়েছে!`,
        'COMPLETED'
      );

      onUploadSuccess();
      onClose();
    } catch (err: any) {
      console.error('Short result publish error:', err);
      toast.dismiss(toastId);
      toast.error(err?.message || 'ফলাফল সংরক্ষণ ব্যর্থ হয়েছে। সংযোগ পরীক্ষা করুন।', 'ERROR');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="সংক্ষিপ্ত ফলাফল আপলোড"
      subtitle="বাংলাদেশ কারিগরি শিক্ষা বোর্ডের সংক্ষিপ্ত ফলাফল JSON ফাইল আপলোড ও স্বয়ংক্রিয় শিক্ষার্থী ম্যাচিং"
      maxHeight="max-h-[96vh]"
    >
      <div className="space-y-4 pb-6 font-bengali">
        {/* Step Indicator */}
        <div className="grid grid-cols-3 gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 text-center text-xs">
          <button
            type="button"
            onClick={() => setStep('INPUT')}
            className={`py-2 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              step === 'INPUT'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-outfit ${
                step === 'INPUT' ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-700'
              }`}
            >
              ১
            </span>
            <span>JSON ইনপুট</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (report) setStep('PREVIEW');
            }}
            disabled={!report}
            className={`py-2 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
              step === 'PREVIEW'
                ? 'bg-blue-600 text-white shadow-xs'
                : report
                ? 'text-blue-700 hover:bg-blue-50 cursor-pointer'
                : 'text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-outfit ${
                step === 'PREVIEW' ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-700'
              }`}
            >
              ২
            </span>
            <span>যাচাই ও প্রিভিউ</span>
            {report && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (report && report.validRows > 0) setStep('CONFIRM');
            }}
            disabled={!report || report.validRows === 0}
            className={`py-2 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
              step === 'CONFIRM'
                ? 'bg-emerald-600 text-white shadow-xs'
                : report && report.validRows > 0
                ? 'text-emerald-700 hover:bg-emerald-50 cursor-pointer'
                : 'text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-outfit ${
                step === 'CONFIRM' ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-700'
              }`}
            >
              ৩
            </span>
            <span>নিশ্চিতকরণ</span>
          </button>
        </div>

        {/* ================= STEP 1: INPUT & CONFIG ================= */}
        {step === 'INPUT' && (
          <div className="space-y-4">
            {/* Meta Configuration Cards */}
            <div className="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>পরীক্ষা ও ফলাফল সেটিংস (প্রয়োজনে পরিবর্তনযোগ্য)</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  JSON-এ থাকলে স্বয়ংক্রিয়ভাবে শনাক্ত হবে
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                     পরীক্ষার নাম
                  </label>
                  <input
                    type="text"
                    value={overrideExamTitle}
                    onChange={(e) => setOverrideExamTitle(e.target.value)}
                    placeholder="উদাঃ ডিপ্লোমা ইন ইঞ্জিঃ ২য় পর্ব বোর্ড পরীক্ষা ২০২৪"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    প্রতিষ্ঠানের নাম
                  </label>
                  <input
                    type="text"
                    value={overrideInstituteName}
                    onChange={(e) => setOverrideInstituteName(e.target.value)}
                    placeholder="উদাঃ দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট, ভোলা সদর, ভোলা"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <SelectTrigger
                    label="সেমিস্টার"
                    value={overrideSemesterId}
                    displayValue={SEMESTER_MAP[overrideSemesterId] || `${overrideSemesterId}ম সেমিস্টার`}
                    onClick={() => setSemSheetOpen(true)}
                  />
                </div>

                <div>
                  <SelectTrigger
                    label="টেকনোলজি"
                    value={overrideDepartmentId}
                    displayValue={
                      overrideDepartmentId === 'ALL'
                        ? 'সকল টেকনোলজি (স্বয়ংক্রিয়)'
                        : departments.find((d) => d.id === overrideDepartmentId)?.name ||
                          overrideDepartmentId.toUpperCase()
                    }
                    onClick={() => setDeptSheetOpen(true)}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    পরীক্ষার বছর
                  </label>
                  <input
                    type="text"
                    value={overrideYear}
                    onChange={(e) => setOverrideYear(e.target.value)}
                    placeholder="২০২৪"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-outfit font-bold focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <SelectTrigger
                    label="প্রকাশের অবস্থা"
                    value={publishStatus}
                    displayValue={publishStatus === 'PUBLISHED' ? 'সরাসরি প্রকাশ (PUBLISHED)' : 'খসড়া হিসেবে সংরক্ষণ (DRAFT)'}
                    onClick={() => setStatusSheetOpen(true)}
                  />
                </div>
              </div>

              {/* Overwrite duplicates toggle */}
              <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    বিদ্যমান ডুপ্লিকেট ফলাফল ওভাররাইট করুন
                  </p>
                  <p className="text-[11px] text-slate-500">
                    অনুমোদন না দিলে পূর্বে সংরক্ষিত রোলসমূহের ফলাফল নিরাপদে অক্ষত থাকবে (স্কিপ হবে)।
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={overwriteDuplicates}
                    onChange={(e) => setOverwriteDuplicates(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* JSON Upload & Input Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>JSON কোড পেস্ট করুন অথবা ফাইল আপলোড করুন</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySample}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                  >
                    {copiedSample ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>নমুনা JSON ফরম্যাট দেখুন</span>
                  </button>
                  {jsonText && (
                    <button
                      type="button"
                      onClick={() => {
                        setJsonText('');
                        setUploadedFileName(null);
                        setReport(null);
                      }}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                    >
                      ক্লিয়ার
                    </button>
                  )}
                </div>
              </div>

              {/* Upload Box / Drag & Drop */}
              <div className="border border-dashed border-slate-300 hover:border-blue-400 bg-white rounded-2xl p-4 text-center transition-colors">
                <input
                  type="file"
                  id="short-result-file-input"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="short-result-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    {uploadedFileName ? (
                      <span className="text-blue-600">{uploadedFileName} (পরিবর্তন করতে ক্লিক করুন)</span>
                    ) : (
                      'কম্পিউটার বা ফোন থেকে .json ফাইল সিলেক্ট করুন'
                    )}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    অথবা সরাসরি নিচে কোড পেস্ট করুন
                  </span>
                </label>
              </div>

              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder={`{\n  "examTitle": "ডিপ্লোমা ইন ইঞ্জিনিয়ারিং বোর্ড পরীক্ষা ২০২৪",\n  "semester": "2",\n  "technology": "Computer Technology",\n  "results": [\n    { "roll": "612345", "gpa": 3.75, "status": "PASSED" }\n  ]\n}`}
                rows={9}
                className="w-full p-3.5 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl border border-slate-800 focus:border-blue-500 outline-none leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* Step 1 Action Button */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={handleProceedToPreview}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <span>যাচাই ও প্রিভিউ দেখুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: PREVIEW & VERIFY ================= */}
        {step === 'PREVIEW' && report && (
          <div className="space-y-4">
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block font-bold">মোট রেকর্ড</span>
                <span className="text-base font-black font-outfit text-slate-900">
                  {toBanglaDigits(report.totalRows)}
                </span>
              </div>

              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                <span className="text-emerald-700 text-[10px] block font-bold">শিক্ষার্থী মিলেছে</span>
                <span className="text-base font-black font-outfit text-emerald-700">
                  {toBanglaDigits(report.matchedCount)}
                </span>
              </div>

              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                <span className="text-amber-700 text-[10px] block font-bold">নাম মেলেনি</span>
                <span className="text-base font-black font-outfit text-amber-700">
                  {toBanglaDigits(report.unmatchedCount)}
                </span>
              </div>

              <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200">
                <span className="text-rose-700 text-[10px] block font-bold">ফাইলে ডুপ্লিকেট</span>
                <span className="text-base font-black font-outfit text-rose-700">
                  {toBanglaDigits(report.duplicateInFileCount)}
                </span>
              </div>

              <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-200">
                <span className="text-purple-700 text-[10px] block font-bold">ডেটাবেজে ডুপ্লিকেট</span>
                <span className="text-base font-black font-outfit text-purple-700">
                  {toBanglaDigits(report.duplicateInDatabaseCount)}
                </span>
              </div>

              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200">
                <span className="text-blue-700 text-[10px] block font-bold">প্রকাশযোগ্য রেকর্ড</span>
                <span className="text-base font-black font-outfit text-blue-700">
                  {toBanglaDigits(report.resultsToPublish.length)}
                </span>
              </div>
            </div>

            {/* Filter Tabs & Search in Preview */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setPreviewFilterTab('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    previewFilterTab === 'ALL'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  সব ({toBanglaDigits(report.totalRows)})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilterTab('MATCHED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    previewFilterTab === 'MATCHED'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  মিলেছে ({toBanglaDigits(report.matchedCount)})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilterTab('UNMATCHED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    previewFilterTab === 'UNMATCHED'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  মেলেনি ({toBanglaDigits(report.unmatchedCount)})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilterTab('DUPLICATE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    previewFilterTab === 'DUPLICATE'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  ডুপ্লিকেট ({toBanglaDigits(report.duplicateInFileCount + report.duplicateInDatabaseCount)})
                </button>
                {report.invalidRows > 0 && (
                  <button
                    type="button"
                    onClick={() => setPreviewFilterTab('ERRORS')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      previewFilterTab === 'ERRORS'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    ত্রুটি ({toBanglaDigits(report.invalidRows)})
                  </button>
                )}
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="রোল বা নাম খুঁজুন..."
                  value={previewSearch}
                  onChange={(e) => setPreviewSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Validation Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="max-h-[50vh] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">#</th>
                      <th className="py-2.5 px-3">রোল নম্বর</th>
                      <th className="py-2.5 px-3">শিক্ষার্থী ও টেকনোলজি</th>
                      <th className="py-2.5 px-3 text-center">GPA</th>
                      <th className="py-2.5 px-3 text-center">গ্রেড</th>
                      <th className="py-2.5 px-3 text-center">অবস্থা</th>
                      <th className="py-2.5 px-3 text-right">যাচাই ফলাফল</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPreviewRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">
                          কোনো ফলাফল খুঁজে পাওয়া যায়নি
                        </td>
                      </tr>
                    ) : (
                      filteredPreviewRows.map((row) => (
                        <tr
                          key={row.rowNumber}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            !row.isValid
                              ? 'bg-rose-50/30'
                              : row.isDuplicateInFile || row.isDuplicateInDatabase
                              ? 'bg-amber-50/20'
                              : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-center font-outfit text-slate-400 text-[11px]">
                            {row.rowNumber}
                          </td>
                          <td className="py-2 px-3 font-outfit font-bold text-blue-700">
                            {row.roll || <span className="text-rose-500 italic">অনুপস্থিত</span>}
                          </td>
                          <td className="py-2 px-3">
                            <div className="space-y-0.5">
                              {row.isStudentMatched ? (
                                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>{row.matchedStudentName}</span>
                                </span>
                              ) : row.studentMatchStatus === 'AMBIGUOUS' ? (
                                <span className="text-amber-700 font-medium text-[11px] flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>একাধিক শিক্ষার্থী মিলেছে (নাম রাখা হয়নি)</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">
                                  ডাটাবেজে নাম মেলেনি
                                </span>
                              )}
                              <div className="flex items-center gap-1">
                                <span className="inline-block px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded text-[10px] font-medium border border-blue-100">
                                  {row.departmentName}
                                </span>
                                {row.rawDepartment && (
                                  <span className="text-[10px] text-slate-400 font-outfit">
                                    ({row.rawDepartment})
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center font-outfit font-black text-slate-900">
                            {toBanglaNumber(row.gpa, 2)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded font-black font-outfit text-[11px] ${
                                row.letterGrade === 'A+'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : row.letterGrade === 'F'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {row.letterGrade}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.isPassed
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {row.rawStatusText || (row.isPassed ? 'PASSED' : 'FAILED')}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            {row.errors.length > 0 ? (
                              <span
                                className="inline-flex items-center gap-1 text-rose-600 text-[11px] font-bold"
                                title={row.errors.join(', ')}
                              >
                                <XCircle className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate max-w-[130px]">{row.errors[0]}</span>
                              </span>
                            ) : row.isDuplicateInFile ? (
                              <span className="inline-flex items-center gap-1 text-rose-600 text-[11px] font-bold">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>ফাইলে ডুপ্লিকেট</span>
                              </span>
                            ) : row.isDuplicateInDatabase ? (
                              <span className="inline-flex items-center gap-1 text-purple-600 text-[11px] font-bold">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>{overwriteDuplicates ? 'ওভাররাইট হবে' : 'পূর্ববর্তী বিদ্যমান'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px] font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>বৈধ</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep('INPUT')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ইনপুটে ফিরে যান</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('CONFIRM')}
                disabled={report.resultsToPublish.length === 0}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all cursor-pointer ${
                  report.resultsToPublish.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>নিশ্চিতকরণে এগিয়ে যান ({toBanglaDigits(report.resultsToPublish.length)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: CONFIRM & PUBLISH ================= */}
        {step === 'CONFIRM' && report && (
          <div className="space-y-4">
            <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-emerald-900">
                    ফলাফল প্রকাশের চূড়ান্ত সারসংক্ষেপ
                  </h4>
                  <p className="text-xs text-emerald-700">
                    নিচের তথ্যসমূহ যাচাই করে চূড়ান্ত অনুমোদন দিন। ফায়ারস্টোরে সংরক্ষণ করা হবে।
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-emerald-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">পরীক্ষার নাম</span>
                  <span className="text-slate-900 font-bold">{report.detectedExamTitle}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">প্রতিষ্ঠানের নাম</span>
                  <span className="text-slate-900 font-bold">{report.detectedInstituteName || 'অনির্দিষ্ট'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">সেমিস্টার ও শিক্ষাবর্ষ</span>
                  <span className="text-slate-900 font-bold">
                    {SEMESTER_MAP[report.detectedSemesterId] || `${report.detectedSemesterId}ম সেমিস্টার`} ({toBanglaDigits(report.detectedAcademicYear)})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">টেকনোলজি / বিভাগ</span>
                  <span className="text-slate-900 font-bold">{report.detectedDepartmentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">প্রকাশের অবস্থা</span>
                  <span className="text-blue-700 font-bold">
                    {publishStatus === 'PUBLISHED' ? 'প্রকাশিত (সরাসরি শিক্ষার্থীরা দেখতে পাবে)' : 'খসড়া (DRAFT)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">ডুপ্লিকেট নীতিমালা</span>
                  <span className="text-slate-900 font-bold">
                    {overwriteDuplicates ? 'বিদ্যমান ফলাফল ওভাররাইট করা হবে' : 'পূর্ববর্তী বিদ্যমান ফলাফল স্কিপ করা হবে'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>তথ্য সুরক্ষার নিশ্চয়তা:</span>
                </p>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  • এটি একটি “সংক্ষিপ্ত ফলাফল”। শিক্ষার্থীদের জন্য বিষয়ভিত্তিক নম্বরপত্র ব্যতীত কেবল রোল, GPA, লেটার গ্রেড এবং প্রতিষ্ঠানের নাম দৃশ্যমান হবে।<br />
                  • কোনো প্রকার ফেক ডাটা বা অপ্রমাণিত নাম যুক্ত করা হয়নি। যেসকল রোলের সংরক্ষিত নাম পাওয়া গেছে কেবল সেগুলিই সংযুক্ত করা হয়েছে।
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep('PREVIEW')}
                disabled={isPublishing}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>প্রিভিউতে ফিরে যান</span>
              </button>

              <button
                type="button"
                onClick={handleCommitPublish}
                disabled={isPublishing || report.resultsToPublish.length === 0}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>সংরক্ষণ করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{publishStatus === 'PUBLISHED' ? 'ফলাফল প্রকাশ করুন' : 'খসড়া হিসেবে সংরক্ষণ করুন'} ({toBanglaDigits(report.resultsToPublish.length)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Select Bottom Sheets for Semester, Department, and Status */}
      <SelectBottomSheet
        isOpen={semSheetOpen}
        onClose={() => setSemSheetOpen(false)}
        title="সেমিস্টার নির্বাচন করুন"
        options={(['1', '2', '3', '4', '5', '6', '7', '8'] as SemesterId[]).map((sem) => ({
          value: sem,
          label: SEMESTER_MAP[sem] || `${toBanglaDigits(sem)}ম পর্ব`,
        }))}
        selectedValue={overrideSemesterId}
        onSelect={(val) => setOverrideSemesterId(val as SemesterId)}
      />

      <SelectBottomSheet
        isOpen={deptSheetOpen}
        onClose={() => setDeptSheetOpen(false)}
        title="টেকনোলজি নির্বাচন করুন"
        options={[
          {
            value: 'ALL',
            label: 'সকল টেকনোলজি (স্বয়ংক্রিয়)',
            subLabel: 'JSON বা শিক্ষার্থী ডাটাবেজ অনুযায়ী প্রতিটি রোল শনাক্ত হবে',
          },
          ...departments.map((dept) => ({
            value: dept.id,
            label: dept.name,
            subLabel: dept.code,
          })),
        ]}
        selectedValue={overrideDepartmentId}
        onSelect={(val) => setOverrideDepartmentId(val)}
      />

      <SelectBottomSheet
        isOpen={statusSheetOpen}
        onClose={() => setStatusSheetOpen(false)}
        title="প্রকাশের অবস্থা নির্বাচন করুন"
        options={[
          {
            value: 'PUBLISHED',
            label: 'সরাসরি প্রকাশ (PUBLISHED)',
            subLabel: 'শিক্ষার্থীরা তাৎক্ষণিকভাবে দেখতে পাবে',
          },
          {
            value: 'DRAFT',
            label: 'খসড়া হিসেবে সংরক্ষণ (DRAFT)',
            subLabel: 'পরবর্তীতে অ্যাডমিন প্যানেল হতে রিভিউ করে প্রকাশ করা যাবে',
          },
        ]}
        selectedValue={publishStatus}
        onSelect={(val) => setPublishStatus(val as 'PUBLISHED' | 'DRAFT')}
      />
    </BottomSheet>
  );
};
