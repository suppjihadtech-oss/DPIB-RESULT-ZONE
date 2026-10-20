import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Filter,
  Layers,
  Sparkles,
  GraduationCap,
  Building,
  Clock,
  FileCode,
  Upload,
  Download,
  Copy,
  Check,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { Student, Department, SemesterId } from '../../types';
import {
  getStudents,
  saveStudent,
  deleteStudent,
  batchSaveStudents,
  lookupStudentRecordsByRoll,
  StudentCandidateInfo,
  DEFAULT_DEPARTMENTS,
} from '../../services/db';
import { toBanglaDigits, SEMESTER_MAP, toEnglishDigits } from '../../utils/bangla';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { LoadingOverlay } from '../common/LoadingOverlay';
import { BottomSheet } from '../common/BottomSheet';
import { SelectBottomSheet, SelectTrigger, SelectOption } from '../common/SelectBottomSheet';

interface StudentManagementProps {
  departments: Department[];
  initialAction?: 'add' | 'json' | null;
  onClearInitialAction?: () => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  departments,
  initialAction,
  onClearInitialAction,
}) => {
  const effectiveDepartments = departments && departments.length > 0 ? departments : DEFAULT_DEPARTMENTS;
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');

  // Bottom sheets for filters and form
  const [filterSemSheetOpen, setFilterSemSheetOpen] = useState(false);
  const [filterDeptSheetOpen, setFilterDeptSheetOpen] = useState(false);
  const [formDeptSheetOpen, setFormDeptSheetOpen] = useState(false);
  const [formSemSheetOpen, setFormSemSheetOpen] = useState(false);

  // Add / Edit Bottom Sheet modal
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Delete confirmation state
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formRoll, setFormRoll] = useState('');
  const [formStudentId, setFormStudentId] = useState('');
  const [formReg, setFormReg] = useState('');
  const [formDepartmentId, setFormDepartmentId] = useState(effectiveDepartments[0]?.id || 'cmt');
  const [formSemesterId, setFormSemesterId] = useState<SemesterId>('1');
  const [formSession, setFormSession] = useState('২০২৩-২৪');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Roll Auto-Fill states
  const [rollCandidates, setRollCandidates] = useState<StudentCandidateInfo[]>([]);
  const [autoMatchedInfo, setAutoMatchedInfo] = useState<{ source: string; details: string } | null>(null);

  // JSON Import States
  const [jsonSheetOpen, setJsonSheetOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonInputTab, setJsonInputTab] = useState<'PASTE' | 'FILE'>('PASTE');
  const [jsonDeptId, setJsonDeptId] = useState(effectiveDepartments[0]?.id || 'cmt');
  const [jsonSemesterId, setJsonSemesterId] = useState<SemesterId>('1');
  const [jsonSession, setJsonSession] = useState('২০২৩-২৪');
  const [allowDuplicateOverwrite, setAllowDuplicateOverwrite] = useState(false);
  const [jsonParseError, setJsonParseError] = useState<string | null>(null);
  const [parsedStudentList, setParsedStudentList] = useState<{
    data: Omit<Student, 'id'>;
    isDuplicate: boolean;
    error?: string;
  }[]>([]);
  const [jsonImportSuccessSummary, setJsonImportSuccessSummary] = useState<string | null>(null);
  const [isImportingJson, setIsImportingJson] = useState(false);
  const [jsonDeptSheetOpen, setJsonDeptSheetOpen] = useState(false);
  const [jsonSemSheetOpen, setJsonSemSheetOpen] = useState(false);
  const [copiedSample, setCopiedSample] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const list = await getStudents({
        semesterId: semesterFilter,
        departmentId: departmentFilter,
        search: searchQuery,
      });
      setStudents(list);
    } catch (err: any) {
      console.error('Students fetch error:', err);
      setFetchError(
        err?.message ||
          'শিক্ষার্থীদের ডেটাবেস থেকে তথ্য লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট ও ফায়ারবেস সংযোগ পরীক্ষা করুন।'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [semesterFilter, departmentFilter, searchQuery]);

  // Handle external navigation action trigger (e.g. from Dashboard quick action)
  useEffect(() => {
    if (initialAction === 'add') {
      handleOpenAdd();
      if (onClearInitialAction) onClearInitialAction();
    } else if (initialAction === 'json') {
      handleOpenJson();
      if (onClearInitialAction) onClearInitialAction();
    }
  }, [initialAction]);

  // Roll Number auto-lookup for manual form
  const handleManualRollChange = async (val: string) => {
    setFormRoll(val);
    const cleanRoll = toEnglishDigits(val.trim());
    if (!cleanRoll) {
      setRollCandidates([]);
      setAutoMatchedInfo(null);
      return;
    }

    // Lookup in students & past results
    const candidates = await lookupStudentRecordsByRoll(cleanRoll, students);
    if (candidates.length === 1) {
      const match = candidates[0];
      setRollCandidates([]);
      setFormName(match.name);
      setFormStudentId(match.studentId);
      if (match.registration) setFormReg(match.registration);
      if (match.departmentId) setFormDepartmentId(match.departmentId);
      if (match.semesterId) setFormSemesterId(match.semesterId);
      if (match.session) setFormSession(match.session);

      setAutoMatchedInfo({
        source: match.source === 'STUDENT_DATABASE' ? 'শিক্ষার্থী ডেটাবেজ' : 'পূর্ববর্তী পরীক্ষার ফলাফল',
        details: `${match.departmentName} • ${SEMESTER_MAP[match.semesterId]}`,
      });
    } else if (candidates.length > 1) {
      setRollCandidates(candidates);
      setAutoMatchedInfo(null);
    } else {
      setRollCandidates([]);
      setAutoMatchedInfo(null);
    }
  };

  const handleSelectCandidate = (candidate: StudentCandidateInfo) => {
    setFormName(candidate.name);
    setFormStudentId(candidate.studentId);
    if (candidate.registration) setFormReg(candidate.registration);
    if (candidate.departmentId) setFormDepartmentId(candidate.departmentId);
    if (candidate.semesterId) setFormSemesterId(candidate.semesterId);
    if (candidate.session) setFormSession(candidate.session);
    setRollCandidates([]);
    setAutoMatchedInfo({
      source: candidate.source === 'STUDENT_DATABASE' ? 'শিক্ষার্থী ডেটাবেজ' : 'পূর্ববর্তী পরীক্ষার ফলাফল',
      details: `${candidate.departmentName} • ${SEMESTER_MAP[candidate.semesterId]}`,
    });
  };

  // JSON Validation & Parser
  const validateJson = (rawStr: string, targetDeptId: string, targetSemId: SemesterId) => {
    setJsonParseError(null);
    setParsedStudentList([]);
    if (!rawStr.trim()) return;

    try {
      const parsed = JSON.parse(rawStr.trim());
      const items: any[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.students)
        ? parsed.students
        : null;

      if (!items) {
        setJsonParseError('JSON ফরম্যাট সঠিক নয়। এটি একটি অ্যারে [ ... ] অথবা { "students": [ ... ] } হতে হবে।');
        return;
      }

      if (items.length === 0) {
        setJsonParseError('JSON অ্যারেতে কোনো শিক্ষার্থীর তথ্য নেই।');
        return;
      }

      const deptObj = departments.find((d) => d.id === targetDeptId) || departments[0];
      const deptName = deptObj?.name || 'কম্পিউটার টেকনোলজি';

      const existingRollSet = new Set(
        students.map((s) => toEnglishDigits(String(s.roll || '').trim()))
      );

      const seenInBatchRolls = new Set<string>();
      const processed = items.map((rawItem, idx) => {
        const itemIndex = idx + 1;
        const name = String(rawItem.name || rawItem.studentName || '').trim();
        const rawRoll = rawItem.roll ?? rawItem.rollNumber ?? rawItem.boardRoll ?? '';
        const roll = toEnglishDigits(String(rawRoll).trim());
        const studentId =
          String(rawItem.studentId || rawItem.id || '').trim() || (roll ? `DPIB-${roll}` : '');
        const reg = String(
          rawItem.registrationNumber || rawItem.registration || rawItem.regNo || ''
        ).trim();

        let itemError: string | undefined;
        if (!roll) {
          itemError = `আইটেম #${itemIndex}: "roll" (রোল নম্বর) ফিল্ড অনুপস্থিত বা খালি।`;
        } else if (!name) {
          itemError = `আইটেম #${itemIndex} (রোল ${roll}): "name" (শিক্ষার্থীর নাম) ফিল্ড অনুপস্থিত বা খালি।`;
        } else if (seenInBatchRolls.has(roll)) {
          itemError = `আইটেম #${itemIndex} (রোল ${roll}): এই ফাইলে একই রোল নম্বর একাধিকবার রয়েছে।`;
        }

        if (roll) {
          seenInBatchRolls.add(roll);
        }

        const isDuplicate = Boolean(roll && existingRollSet.has(roll));

        // Use custom department/semester if specified in item, else fallback to batch selection
        const itemDeptId = rawItem.departmentId || targetDeptId;
        const itemDeptName = departments.find((d) => d.id === itemDeptId)?.name || deptName;
        const itemSemId = (rawItem.semesterId || rawItem.semester || targetSemId) as SemesterId;

        const studentData: Omit<Student, 'id'> = {
          name,
          roll,
          studentId,
          registration: reg || undefined,
          departmentId: itemDeptId,
          departmentName: itemDeptName,
          semesterId: itemSemId,
          session: rawItem.session || jsonSession,
          shift: rawItem.shift || '১ম শিফট',
          status: 'ACTIVE',
        };

        return {
          data: studentData,
          isDuplicate,
          error: itemError,
        };
      });

      setParsedStudentList(processed);
    } catch (err: any) {
      setJsonParseError(`ভুল JSON সিনট্যাক্স: ${err.message || 'অনুগ্রহ করে সঠিক JSON ফরম্যাট যাচাই করুন।'}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      validateJson(content, jsonDeptId, jsonSemesterId);
    };
    reader.readAsText(file);
  };

  const handleCopySampleJson = () => {
    const sample = JSON.stringify(
      [
        {
          name: 'মোহাম্মদ জিহাদ',
          roll: '622751',
          studentId: 'DPIB-622751',
          registrationNumber: '1502123456',
        },
        {
          name: 'তানভীর আহমেদ',
          roll: '622752',
          studentId: 'DPIB-622752',
          registrationNumber: '1502123457',
        },
      ],
      null,
      2
    );
    navigator.clipboard.writeText(sample);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2000);
  };

  const handleCommitJsonImport = async () => {
    const validItems = parsedStudentList.filter((item) => !item.error);
    if (validItems.length === 0) {
      setJsonParseError('সংরক্ষণ করার মতো কোনো বৈধ শিক্ষার্থী ডেটা নেই।');
      return;
    }

    setIsImportingJson(true);
    setJsonParseError(null);
    try {
      const toSave = validItems.map((item) => item.data);
      const res = await batchSaveStudents(toSave, {
        overwriteDuplicates: allowDuplicateOverwrite,
      });

      let summary = `সফলভাবে মোট ${toBanglaDigits(res.successCount)} জন নতুন শিক্ষার্থী যুক্ত হয়েছে!`;
      if (res.updatedCount > 0) {
        summary += ` ${toBanglaDigits(res.updatedCount)} জন হালনাগাদ হয়েছে।`;
      }
      if (res.skippedCount > 0) {
        summary += ` ${toBanglaDigits(res.skippedCount)} জন বিদ্যমান ডুপ্লিকেট বাদ রাখা হয়েছে।`;
      }
      if (res.errors.length > 0) {
        summary += ` (${toBanglaDigits(res.errors.length)}টি ত্রুটি)`;
      }

      setJsonImportSuccessSummary(summary);
      fetchStudents();

      setTimeout(() => {
        setJsonSheetOpen(false);
        setJsonText('');
        setParsedStudentList([]);
        setJsonImportSuccessSummary(null);
      }, 2200);
    } catch (err: any) {
      setJsonParseError(err.message || 'ইমপোর্ট করতে সমস্যা হয়েছে');
    } finally {
      setIsImportingJson(false);
    }
  };

  const handleOpenJson = () => {
    setJsonText('');
    setParsedStudentList([]);
    setJsonParseError(null);
    setJsonImportSuccessSummary(null);
    setAllowDuplicateOverwrite(false);
    setJsonDeptId(departmentFilter !== 'ALL' ? departmentFilter : effectiveDepartments[0]?.id || 'cmt');
    setJsonSemesterId(semesterFilter !== 'ALL' ? (semesterFilter as SemesterId) : '1');
    setJsonSheetOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormName('');
    setFormRoll('');
    setFormStudentId('');
    setFormReg('');
    setFormDepartmentId(effectiveDepartments[0]?.id || 'cmt');
    setFormSemesterId('1');
    setFormSession('২০২৩-২৪');
    setFormStatus('ACTIVE');
    setFormError(null);
    setRollCandidates([]);
    setAutoMatchedInfo(null);
    setSheetOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormRoll(student.roll);
    setFormStudentId(student.studentId);
    setFormReg(student.registration || '');
    setFormDepartmentId(student.departmentId);
    setFormSemesterId(student.semesterId);
    setFormSession(student.session || '২০২৩-২৪');
    setFormStatus(student.status);
    setFormError(null);
    setRollCandidates([]);
    setAutoMatchedInfo(null);
    setSheetOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = formName.trim();
    const cleanRoll = toEnglishDigits(formRoll.trim());
    if (!cleanName || !cleanRoll) {
      setFormError('অনুগ্রহ করে শিক্ষার্থীর নাম ও রোল নম্বর লিখুন।');
      return;
    }

    const deptObj = effectiveDepartments.find((d) => d.id === formDepartmentId);
    const departmentName = deptObj ? deptObj.name : 'কম্পিউটার টেকনোলজি';
    const finalStudentId = formStudentId.trim() || `DPIB-${cleanRoll}`;

    setSaving(true);
    try {
      await saveStudent(
        {
          name: cleanName,
          roll: cleanRoll,
          studentId: finalStudentId,
          registration: formReg.trim() || undefined,
          departmentId: formDepartmentId,
          departmentName,
          semesterId: formSemesterId,
          session: formSession,
          status: formStatus,
        },
        editingStudent?.id
      );
      setSheetOpen(false);
      fetchStudents();
    } catch (err: any) {
      setFormError(err.message || 'সংরক্ষণ করতে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDelete = (student: Student) => {
    setDeleteError(null);
    setDeleteConfirmStudent(student);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmStudent) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteStudent(deleteConfirmStudent.id);
      setDeleteConfirmStudent(null);
      fetchStudents();
    } catch (err: any) {
      console.error('Delete error:', err);
      setDeleteError(err.message || 'শিক্ষার্থীর তথ্য ডিলিট করা যায়নি');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            শিক্ষার্থী ব্যবস্থাপনা
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            মোট নিবন্ধিত শিক্ষার্থী: {toBanglaDigits(students.length)} জন • শিক্ষার্থী ডাটাবেজ তৈরি ও পরিচালনা
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            id="btn-json-import-student"
            type="button"
            onClick={handleOpenJson}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span>JSON ইমপোর্ট</span>
          </button>

          <button
            id="btn-add-student"
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>নতুন শিক্ষার্থী যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Cloud Database Error Banner if fetch fails */}
      {fetchError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-800 text-xs sm:text-sm shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={fetchStudents}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>পুনরায় চেষ্টা করুন</span>
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 p-4 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Search input */}
        <div className="sm:col-span-6 relative">
          <input
            type="text"
            placeholder="রোল, নাম বা আইডি দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Semester Filter */}
        <div className="sm:col-span-3">
          <SelectTrigger
            label=""
            value={semesterFilter}
            displayValue={semesterFilter === 'ALL' ? 'সকল সেমিস্টার' : SEMESTER_MAP[semesterFilter as SemesterId] || semesterFilter}
            placeholder="সকল সেমিস্টার"
            onClick={() => setFilterSemSheetOpen(true)}
            icon={GraduationCap}
          />
        </div>

        {/* Department Filter */}
        <div className="sm:col-span-3">
          <SelectTrigger
            label=""
            value={departmentFilter}
            displayValue={
              departmentFilter === 'ALL'
                ? 'সকল বিভাগ'
                : effectiveDepartments.find((d) => d.id === departmentFilter)?.name || departmentFilter
            }
            placeholder="সকল বিভাগ"
            onClick={() => setFilterDeptSheetOpen(true)}
            icon={Building}
          />
        </div>
      </div>

      {/* Student List Content */}
      {loading ? (
        <LoadingSpinner message="শিক্ষার্থীদের তালিকা লোড হচ্ছে..." />
      ) : students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center shadow-xs space-y-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
            <Users className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              কোনো শিক্ষার্থী পাওয়া যায়নি
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              শিক্ষার্থী ডেটাবেজ তৈরি করতে বা নতুন শিক্ষার্থী যুক্ত করতে নিচের যেকোনো একটি অপশন ব্যবহার করুন।
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
            <button
              id="btn-empty-add-student"
              type="button"
              onClick={handleOpenAdd}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>নতুন শিক্ষার্থী যোগ করুন</span>
            </button>
            <button
              id="btn-empty-json-import"
              type="button"
              onClick={handleOpenJson}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>JSON ইমপোর্ট করুন</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/80">
                  <th className="py-3 px-4 text-center">রোল</th>
                  <th className="py-3 px-4">শিক্ষার্থীর নাম</th>
                  <th className="py-3 px-4">আইডি</th>
                  <th className="py-3 px-4">রেজিস্ট্রেশন</th>
                  <th className="py-3 px-4">বিভাগ ও সেমিস্টার</th>
                  <th className="py-3 px-4 text-center">অবস্থা</th>
                  <th className="py-3 px-4 text-right">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-blue-700 font-outfit">
                      {toBanglaDigits(student.roll)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{student.name}</td>
                    <td className="py-3 px-4 text-slate-600 font-outfit text-xs">{student.studentId}</td>
                    <td className="py-3 px-4 text-slate-500 font-outfit text-xs">
                      {student.registration ? toBanglaDigits(student.registration) : '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800 block">{student.departmentName}</span>
                      <span className="text-slate-400">{SEMESTER_MAP[student.semesterId]}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          student.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {student.status === 'ACTIVE' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="সম্পাদনা"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(student)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="মুছে ফেলুন"
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

      {/* Delete Confirmation BottomSheet */}
      <BottomSheet
        isOpen={Boolean(deleteConfirmStudent)}
        onClose={() => {
          if (!isDeleting) setDeleteConfirmStudent(null);
        }}
        title="শিক্ষার্থী তথ্য মুছে ফেলার নিশ্চিতকরণ"
        subtitle="আপনি কি নিশ্চিতভাবে এই শিক্ষার্থীর তথ্য মুছে ফেলতে চান?"
      >
        <div className="space-y-4 pb-4">
          {deleteError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
              {deleteError}
            </div>
          )}

          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
            <p className="font-bold text-sm text-rose-900 mb-1">
              {deleteConfirmStudent?.name}
            </p>
            <p className="text-xs text-rose-800">
              রোল: {deleteConfirmStudent?.roll} • বিভাগ: {deleteConfirmStudent?.departmentName} • সেমিস্টার: {deleteConfirmStudent ? SEMESTER_MAP[deleteConfirmStudent.semesterId] : ''}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setDeleteConfirmStudent(null)}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
            >
              বাতিল করুন
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isDeleting ? 'ডিলিট হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Add / Edit Student Bottom Sheet */}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editingStudent ? 'শিক্ষার্থীর তথ্য সম্পাদনা' : 'নতুন শিক্ষার্থী নিবন্ধন'}
        subtitle="সঠিক তথ্য দিয়ে ফরমটি পূরণ করুন"
      >
        <form onSubmit={handleSave} className="space-y-4 pb-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                রোল নম্বর <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="রোল নম্বর লিখুন (উদাঃ ৬২২৭৫১)"
                value={formRoll}
                onChange={(e) => handleManualRollChange(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-outfit focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                শিক্ষার্থীর পুরো নাম <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="শিক্ষার্থীর পুরো নাম লিখুন"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            {/* Auto-Match Feedback Badge */}
            {autoMatchedInfo && (
              <div className="sm:col-span-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-800">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{autoMatchedInfo.source} হতে তথ্য স্বয়ংক্রিয়ভাবে লোড হয়েছে</span>
                </div>
                <span className="text-[11px] font-medium text-emerald-700">{autoMatchedInfo.details}</span>
              </div>
            )}

            {/* Roll Disambiguation Candidates */}
            {rollCandidates.length > 1 && (
              <div className="sm:col-span-2 p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>এই রোল নম্বরের একাধিক শিক্ষার্থী রেকর্ড রয়েছে! সঠিক শিক্ষার্থী নির্বাচন করুন:</span>
                </p>
                <div className="space-y-1.5">
                  {rollCandidates.map((cand, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectCandidate(cand)}
                      className="p-2.5 bg-white rounded-lg border border-amber-200 hover:border-amber-400 hover:bg-amber-100/40 transition-all cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-black text-slate-900">{cand.name}</span>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {cand.departmentName} • {SEMESTER_MAP[cand.semesterId]} {cand.session ? `• সেশন: ${cand.session}` : ''}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {cand.source === 'STUDENT_DATABASE' ? 'শিক্ষার্থী ডেটাবেজ' : 'ফলাফল রেকর্ড'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">শিক্ষার্থী আইডি</label>
              <input
                type="text"
                placeholder="শিক্ষার্থী আইডি লিখুন"
                value={formStudentId}
                onChange={(e) => setFormStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium font-outfit focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">রেজিস্ট্রেশন নম্বর</label>
              <input
                type="text"
                placeholder="রেজিস্ট্রেশন নম্বর লিখুন"
                value={formReg}
                onChange={(e) => setFormReg(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium font-outfit focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <SelectTrigger
                label="বিভাগ / টেকনোলজি"
                value={formDepartmentId}
                displayValue={effectiveDepartments.find((d) => d.id === formDepartmentId)?.name || formDepartmentId}
                placeholder="বিভাগ নির্বাচন করুন"
                onClick={() => setFormDeptSheetOpen(true)}
                icon={Building}
              />
            </div>

            <div>
              <SelectTrigger
                label="সেমিস্টার"
                value={formSemesterId}
                displayValue={SEMESTER_MAP[formSemesterId] || `${formSemesterId}ম পর্ব`}
                placeholder="সেমিস্টার নির্বাচন করুন"
                onClick={() => setFormSemSheetOpen(true)}
                icon={GraduationCap}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">সেশন</label>
              <input
                type="text"
                placeholder="শিক্ষাবর্ষ বা সেশন লিখুন"
                value={formSession}
                onChange={(e) => setFormSession(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'সংরক্ষণ করা হচ্ছে...' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Select Bottom Sheets for Filter & Form */}
      <SelectBottomSheet
        isOpen={filterSemSheetOpen}
        onClose={() => setFilterSemSheetOpen(false)}
        title="সেমিস্টার নির্বাচন"
        subtitle="ফিল্টার করার জন্য সেমিস্টার সিলেক্ট করুন"
        options={[
          { value: 'ALL', label: 'সকল সেমিস্টার', icon: GraduationCap },
          ...(['1', '2', '3', '4', '5', '6', '7', '8'] as SemesterId[]).map((semId) => ({
            value: semId,
            label: SEMESTER_MAP[semId],
            icon: GraduationCap,
          })),
        ]}
        selectedValue={semesterFilter}
        onSelect={(val) => setSemesterFilter(val)}
      />

      <SelectBottomSheet
        isOpen={filterDeptSheetOpen}
        onClose={() => setFilterDeptSheetOpen(false)}
        title="বিভাগ নির্বাচন"
        subtitle="ফিল্টার করার জন্য বিভাগ সিলেক্ট করুন"
        options={[
          { value: 'ALL', label: 'সকল বিভাগ', icon: Building },
          ...effectiveDepartments.map((d) => ({
            value: d.id,
            label: d.name,
            badge: d.code,
            icon: Building,
          })),
        ]}
        selectedValue={departmentFilter}
        onSelect={(val) => setDepartmentFilter(val)}
      />

      <SelectBottomSheet
        isOpen={formDeptSheetOpen}
        onClose={() => setFormDeptSheetOpen(false)}
        title="বিভাগ নির্বাচন করুন"
        subtitle="শিক্ষার্থীর টেকনোলজি নির্ধারণ করুন"
        options={effectiveDepartments.map((d) => ({
          value: d.id,
          label: d.name,
          badge: d.code,
          icon: Building,
        }))}
        selectedValue={formDepartmentId}
        onSelect={(val) => setFormDepartmentId(val)}
      />

      <SelectBottomSheet
        isOpen={formSemSheetOpen}
        onClose={() => setFormSemSheetOpen(false)}
        title="সেমিস্টার নির্বাচন করুন"
        subtitle="শিক্ষার্থীর বর্তমান সেমিস্টার পর্ব নির্ধারণ করুন"
        options={(['1', '2', '3', '4', '5', '6', '7', '8'] as SemesterId[]).map((semId) => ({
          value: semId,
          label: SEMESTER_MAP[semId],
          icon: GraduationCap,
        }))}
        selectedValue={formSemesterId}
        onSelect={(val) => setFormSemesterId(val as SemesterId)}
      />

      {/* Student Save & Delete Loading Overlay */}
      <LoadingOverlay
        isVisible={saving || isDeleting}
        message={
          isDeleting
            ? 'তথ্য মুছে ফেলা হচ্ছে...'
            : saving
            ? (editingStudent ? 'তথ্য আপডেট করা হচ্ছে...' : 'তথ্য সংরক্ষণ করা হচ্ছে...')
            : 'তথ্য সংরক্ষণ করা হচ্ছে...'
        }
        subtext="ক্লাউড ডাটাবেস আপডেট হচ্ছে..."
      />
    </div>
  );
};
