import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileSpreadsheet,
  BookOpen,
  Users,
  Building,
  GraduationCap,
  Award,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  Search,
  SlidersHorizontal,
  RefreshCw,
  FileText,
  Check,
  X,
  UserCheck,
  Sparkles,
  Calculator,
  HelpCircle,
  ChevronRight,
  ListOrdered,
  Percent,
  UploadCloud,
  Send,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { A4DocumentEngine, getStoredDocSettings } from './A4DocumentEngine';
import { Exam, Student, StudentResult, SemesterId, SubjectResult } from '../../../types';
import {
  getExams,
  getStudents,
  getResults,
  batchSaveResults,
  saveExam,
  generateVerificationCode,
  generateDynamicResultId,
  generateDynamicStudentId,
  isFirestoreAutoId,
} from '../../../services/db';
import { getAutoLoadedCurriculumSubjects } from '../../../data/masterCurriculum';
import { toBanglaDigits, toEnglishDigits, SEMESTER_MAP } from '../../../utils/bangla';
import { calculateSubjectGrade, calculateOverallResult } from '../../../services/grading';
import { SelectBottomSheet, SelectTrigger, SelectOption } from '../../common/SelectBottomSheet';
import { BottomSheet } from '../../common/BottomSheet';
import { LoadingOverlay } from '../../common/LoadingOverlay';
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

export interface ConfiguredSubject {
  id: string;
  subjectCode: string;
  subjectName: string;
  fullMarks: number;
  passMarks?: number;
}

export interface StudentMarkRow {
  id: string;
  studentId?: string;
  roll: string;
  name: string;
  regNo?: string;
  isRegisteredStudent?: boolean;
  marks: Record<string, number>; // subjectCode -> obtained marks
}

// =========================================================================
// SUBJECT MANAGEMENT BOTTOM SHEET
// =========================================================================
interface SubjectManagementBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: ConfiguredSubject[];
  onAddSubject: (subj: Omit<ConfiguredSubject, 'id'>) => void;
  onUpdateSubject: (id: string, updated: Partial<ConfiguredSubject>) => void;
  onRemoveSubject: (id: string) => void;
  onLoadCurriculumPreset: () => void;
  hasCurriculumPreset: boolean;
}

const SubjectManagementBottomSheet: React.FC<SubjectManagementBottomSheetProps> = ({
  isOpen,
  onClose,
  subjects,
  onAddSubject,
  onUpdateSubject,
  onRemoveSubject,
  onLoadCurriculumPreset,
  hasCurriculumPreset,
}) => {
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newFullMarks, setNewFullMarks] = useState('');

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const fullMarksNum = parseInt(toEnglishDigits(newFullMarks), 10);
    if (isNaN(fullMarksNum) || fullMarksNum <= 0) {
      alert('অনুগ্রহ করে বিষয়ের সঠিক পূর্ণমান (যেমন: ১০০, ২০০ বা ৫০) লিখুন।');
      return;
    }

    onAddSubject({
      subjectCode: newCode.trim() || String(Math.floor(10000 + Math.random() * 90000)),
      subjectName: newName.trim(),
      fullMarks: fullMarksNum,
    });

    setNewCode('');
    setNewName('');
    setNewFullMarks('');
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="পরীক্ষার বিষয় ও পূর্ণমান কনফিগারেশন"
      subtitle="বিষয়ের নাম, কোড এবং প্রতিটি পরীক্ষার জন্য নির্দিষ্ট পূর্ণমান নির্ধারণ করুন"
      maxHeight="max-h-[92vh]"
    >
      <div className="space-y-5 pb-6 font-bengali">
        {/* Quick Action Preset Banner */}
        {hasCurriculumPreset && (
          <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-teal-700 shrink-0" />
              <div>
                <p className="text-xs font-bold text-teal-950">কারিকুলাম প্রিসেট পাওয়া গেছে</p>
                <p className="text-[11px] text-teal-700">
                  সিলেক্টেড টেকনোলজি ও পর্বের বিষয়গুলো এক ক্লিকে লোড করুন
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLoadCurriculumPreset}
              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
            >
              প্রিসেট লোড করুন
            </button>
          </div>
        )}

        {/* Add New Subject Form */}
        <form onSubmit={handleAddNew} className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
          <div className="flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-violet-700" />
            <h4 className="text-xs font-bold text-slate-900">নতুন বিষয় যোগ করুন:</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">বিষয় কোড</label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="বিষয় কোড লিখুন"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-violet-600 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">বিষয়ের নাম *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="বিষয়ের নাম লিখুন"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-violet-600 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">পূর্ণমান *</label>
              <input
                type="number"
                required
                min={1}
                max={500}
                value={newFullMarks}
                onChange={(e) => setNewFullMarks(e.target.value)}
                placeholder="পূর্ণমান"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center focus:border-violet-600 focus:outline-hidden font-mono"
              />
            </div>

            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={!newName.trim()}
                className="w-full py-2 bg-violet-700 hover:bg-violet-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>যুক্ত করুন</span>
              </button>
            </div>
          </div>
        </form>

        {/* Configured Subjects List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              বর্তমান বিষয়সমূহ ({toBanglaDigits(subjects.length)}টি):
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              * প্রয়োজনে পূর্ণমান পরিবর্তন করতে বক্সে সরাসরি লিখুন
            </span>
          </div>

          {subjects.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">কোনো বিষয় যুক্ত করা হয়নি</p>
              <p className="text-[11px] text-slate-400 mt-1">
                উপরে ফর্ম পূরণ করে অথবা কারিকুলাম প্রিসেট লোড করে বিষয় যুক্ত করুন।
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {subjects.map((subj, idx) => (
                <div
                  key={subj.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-800 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-slate-200">
                      {toBanglaDigits(idx + 1)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {subj.subjectName}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        কোড: {subj.subjectCode}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500">পূর্ণমান:</span>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={subj.fullMarks}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val > 0) {
                            onUpdateSubject(subj.id, { fullMarks: val });
                          }
                        }}
                        className="w-14 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-center text-xs font-bold font-mono text-violet-700 focus:border-violet-600 focus:outline-hidden"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveSubject(subj.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Done */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>কনফিগারেশন সম্পন্ন</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

// =========================================================================
// STUDENT MARKS ENTRY / EDIT BOTTOM SHEET
// =========================================================================
interface StudentMarksBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: ConfiguredSubject[];
  editingStudent: StudentMarkRow | null;
  onSave: (row: StudentMarkRow) => void;
  isManualMode: boolean;
  allStudents?: Student[];
}

const StudentMarksBottomSheet: React.FC<StudentMarksBottomSheetProps> = ({
  isOpen,
  onClose,
  subjects,
  editingStudent,
  onSave,
  isManualMode,
  allStudents = [],
}) => {
  const [roll, setRoll] = useState('');
  const [name, setName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [marks, setMarks] = useState<Record<string, number>>({});

  useEffect(() => {
    if (editingStudent) {
      setRoll(editingStudent.roll || '');
      setName(editingStudent.name || '');
      setRegNo(editingStudent.regNo || '');
      setMarks(editingStudent.marks || {});
    } else {
      setRoll('');
      setName('');
      setRegNo('');
      setMarks({});
    }
  }, [editingStudent, isOpen]);

  const handleRollChange = (val: string) => {
    setRoll(val);
    const clean = toEnglishDigits(val.trim());
    if (!clean) {
      setName('');
      setRegNo('');
      return;
    }
    if (allStudents && allStudents.length > 0) {
      const matched = allStudents.find(
        (s) => toEnglishDigits(s.roll || '').trim() === clean
      );
      if (matched) {
        setName(matched.name || '');
        setRegNo(matched.registration || '');
      } else {
        setName('');
        setRegNo('');
      }
    } else {
      setName('');
      setRegNo('');
    }
  };

  const handleMarkChange = (subjectCode: string, valueStr: string) => {
    const val = parseInt(toEnglishDigits(valueStr), 10);
    setMarks((prev) => ({
      ...prev,
      [subjectCode]: isNaN(val) ? 0 : val,
    }));
  };

  // Compute live GPA for preview in the bottom sheet
  const liveSubjectList = subjects.map((s) => ({
    obtainedMarks: marks[s.subjectCode] || 0,
    fullMarks: s.fullMarks,
  }));
  const liveResult = calculateOverallResult(liveSubjectList);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roll.trim() || !name.trim()) return;

    for (const s of subjects) {
      const obtained = marks[s.subjectCode] ?? 0;
      if (s.fullMarks <= 0) {
        alert(`'${s.subjectName}' বিষয়ের পূর্ণমান সঠিক নয়!`);
        return;
      }
      if (obtained < 0) {
        alert(`'${s.subjectName}' বিষয়ে প্রাপ্ত নম্বর নেতিবাচক হতে পারে না!`);
        return;
      }
      if (obtained > s.fullMarks) {
        alert(`'${s.subjectName}' বিষয়ে প্রাপ্ত নম্বর (${obtained}) পূর্ণমান (${s.fullMarks})-এর চেয়ে বেশি হতে পারে না!`);
        return;
      }
    }

    const cleanRoll = toEnglishDigits(roll.trim());
    const cleanSid = (editingStudent?.studentId && !isFirestoreAutoId(editingStudent.studentId))
      ? editingStudent.studentId
      : generateDynamicStudentId(cleanRoll);

    onSave({
      id: editingStudent?.id || `manual-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      studentId: cleanSid,
      roll: cleanRoll,
      name: name.trim(),
      regNo: regNo.trim() ? toEnglishDigits(regNo.trim()) : undefined,
      isRegisteredStudent: editingStudent?.isRegisteredStudent || false,
      marks,
    });

    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={editingStudent ? 'শিক্ষার্থীর ফলাফল ও নম্বর সম্পাদনা' : 'নতুন শিক্ষার্থী ও ফলাফল এন্ট্রি'}
      subtitle="শিক্ষার্থীর তথ্য ও প্রতিটি বিষয়ে প্রাপ্ত নম্বর ইনপুট করুন"
      maxHeight="max-h-[92vh]"
    >
      <form onSubmit={handleSubmit} className="space-y-5 pb-6 font-bengali">
        {/* Student Metadata Card */}
        <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-violet-700" />
            <span>শিক্ষার্থীর প্রাথমিক তথ্য:</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">রোল নম্বর *</label>
              <input
                type="text"
                required
                value={roll}
                onChange={(e) => handleRollChange(e.target.value)}
                placeholder="রোল নম্বর লিখুন"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono focus:border-violet-600 focus:outline-hidden shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">শিক্ষার্থীর নাম *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="শিক্ষার্থীর পূর্ণ নাম লিখুন"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-violet-600 focus:outline-hidden shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">রেজিস্ট্রেশন নং (ঐচ্ছিক)</label>
              <input
                type="text"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                placeholder="রেজিস্ট্রেশন নম্বর লিখুন"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold font-mono focus:border-violet-600 focus:outline-hidden shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Subject Marks Form Fields */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-violet-700" />
              <span>বিষয়ভিত্তিক প্রাপ্ত নম্বর ইনপুট:</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-medium">
              (পূর্ণমানের ভিত্তিতে গ্রেড ও জিপিএ স্বয়ংক্রিয়ভাবে হিসাব হবে)
            </span>
          </div>

          {subjects.length === 0 ? (
            <div className="p-6 text-center bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs font-semibold">
              প্রথমে উপরের "বিষয় কনফিগারেশন" থেকে পরীক্ষার বিষয়সমূহ যুক্ত করুন।
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {subjects.map((subj) => {
                const obtained = marks[subj.subjectCode] ?? '';
                const obtainedNum = typeof obtained === 'number' ? obtained : 0;
                const subGrade = calculateSubjectGrade(obtainedNum, subj.fullMarks);

                return (
                  <div
                    key={subj.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-violet-300 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {subj.subjectName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 font-mono">
                        <span>কোড: {subj.subjectCode}</span>
                        <span>•</span>
                        <span className="text-violet-700 font-bold">পূর্ণমান: {toBanglaDigits(subj.fullMarks)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={subj.fullMarks}
                        value={obtained}
                        onChange={(e) => handleMarkChange(subj.subjectCode, e.target.value)}
                        placeholder="০"
                        className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs font-bold font-mono focus:bg-white focus:border-violet-600 focus:outline-hidden"
                      />

                      <div className={`px-2 py-1 rounded-lg text-[10px] font-black font-mono w-10 text-center ${
                        subGrade.isPassed && subGrade.grade !== 'F'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {obtained === '' || obtainedNum === 0 ? '-' : subGrade.grade}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Calculation Strip */}
        <div className="p-3.5 bg-violet-50/70 border border-violet-100 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-700">
              মোট প্রাপ্ত: <strong className="text-violet-900 font-mono text-sm">{toBanglaDigits(liveResult.totalObtainedMarks)}</strong> / {toBanglaDigits(liveResult.totalFullMarks)}
            </span>
            <span className="font-bold text-slate-700">
              GPA: <strong className="text-violet-900 font-mono text-sm">{liveResult.gpa.toFixed(2)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">ফলাফল:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
              liveResult.isPassed
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}>
              {liveResult.isPassed ? 'পাস (PASSED)' : 'ফেল (FAILED)'}
            </span>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            বাতিল
          </button>
          <button
            type="submit"
            disabled={!roll.trim() || !name.trim()}
            className="px-5 py-2 bg-violet-700 hover:bg-violet-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>{editingStudent ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};

// =========================================================================
// MAIN RESULT SHEET GENERATOR
// =========================================================================
export const ResultSheetGenerator: React.FC = () => {
  // Method Switcher: 'FROM_STUDENTS' (শিক্ষার্থী যুক্ত করে) vs 'MANUAL' (ম্যানুয়ালি)
  const [creationMethod, setCreationMethod] = useState<'FROM_STUDENTS' | 'MANUAL'>('FROM_STUDENTS');

  // Core Metadata Fields (Configurable)
  const [selectedTech, setSelectedTech] = useState<string>('COMPUTER');
  const [selectedSemester, setSelectedSemester] = useState<string>('1');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [customExamTitle, setCustomExamTitle] = useState<string>('১ম পর্ব সমাপনী পরীক্ষা');
  const [examYear, setExamYear] = useState<string>('২০২৬');
  const [academicSession, setAcademicSession] = useState<string>('২০২৫-২৬');

  // Databases & Lists
  const [exams, setExams] = useState<Exam[]>([]);
  const [allStudentsList, setAllStudentsList] = useState<Student[]>([]);
  const [dbStudents, setDbStudents] = useState<Student[]>([]);
  const [dbResults, setDbResults] = useState<StudentResult[]>([]);

  // Configured Subject Columns (with custom fullMarks per subject)
  const [configuredSubjects, setConfiguredSubjects] = useState<ConfiguredSubject[]>([]);

  // Student Mark Rows
  const [studentRows, setStudentRows] = useState<StudentMarkRow[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Search & Filter within student lists
  const [studentSearch, setStudentSearch] = useState('');

  // Bottom Sheets
  const [techSheetOpen, setTechSheetOpen] = useState(false);
  const [semesterSheetOpen, setSemesterSheetOpen] = useState(false);
  const [examSheetOpen, setExamSheetOpen] = useState(false);
  const [subjectConfigSheetOpen, setSubjectConfigSheetOpen] = useState(false);
  const [studentEntrySheetOpen, setStudentEntrySheetOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentMarkRow | null>(null);

  // Result Publishing Workflow
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccessMessage, setPublishSuccessMessage] = useState<string | null>(null);
  const [publishValidationErrors, setPublishValidationErrors] = useState<string[]>([]);

  // Dynamic Document Settings
  const docSettings = getStoredDocSettings();

  // Draft state
  const [pendingDraft, setPendingDraft] = useState<DraftRecord<any> | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const isInitialMount = useRef(true);

  // Publish session & Export Interception State
  const [isResultPublished, setIsResultPublished] = useState(false);
  const [pendingExportAction, setPendingExportAction] = useState<(() => void) | null>(null);

  // Check for existing draft on load
  useEffect(() => {
    async function checkDraft() {
      try {
        const draft = await getDraft<any>('result_sheet');
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
        creationMethod,
        selectedTech,
        selectedSemester,
        selectedExamId,
        customExamTitle,
        examYear,
        academicSession,
        configuredSubjects,
        studentRows,
        selectedStudentIds: Array.from(selectedStudentIds),
      };
      await saveDraft('result_sheet', draftData);
      setLastSavedTime(Date.now());
    }, 800);

    return () => clearTimeout(timer);
  }, [
    creationMethod,
    selectedTech,
    selectedSemester,
    selectedExamId,
    customExamTitle,
    examYear,
    academicSession,
    configuredSubjects,
    studentRows,
    selectedStudentIds,
  ]);

  const handleRestoreDraft = () => {
    if (!pendingDraft?.data) return;
    const d = pendingDraft.data;
    if (d.creationMethod) setCreationMethod(d.creationMethod);
    if (d.selectedTech) setSelectedTech(d.selectedTech);
    if (d.selectedSemester) setSelectedSemester(d.selectedSemester);
    if (d.selectedExamId) setSelectedExamId(d.selectedExamId);
    if (d.customExamTitle) setCustomExamTitle(d.customExamTitle);
    if (d.examYear) setExamYear(d.examYear);
    if (d.academicSession) setAcademicSession(d.academicSession);
    if (Array.isArray(d.configuredSubjects)) setConfiguredSubjects(d.configuredSubjects);
    if (Array.isArray(d.studentRows)) setStudentRows(d.studentRows);
    if (Array.isArray(d.selectedStudentIds)) setSelectedStudentIds(new Set(d.selectedStudentIds));

    setPendingDraft(null);
    setLastSavedTime(pendingDraft.updatedAt);
  };

  const handleDiscardDraft = async () => {
    await clearDraft('result_sheet');
    setPendingDraft(null);
    setLastSavedTime(null);
  };

  // Intercept print / PDF export to ask for publishing if not yet published
  const handleBeforeExport = (proceed: () => void) => {
    if (!isResultPublished && activeResultRows.length > 0) {
      setPendingExportAction(() => proceed);
      setPublishConfirmOpen(true);
    } else {
      proceed();
    }
  };

  const handleDismissPublish = () => {
    setPublishConfirmOpen(false);
    if (pendingExportAction) {
      const action = pendingExportAction;
      setPendingExportAction(null);
      setTimeout(() => action(), 50);
    }
  };

  // Load Exams
  useEffect(() => {
    async function loadInitialExams() {
      try {
        const examList = await getExams();
        setExams(examList);
      } catch (err) {
        console.error('Failed to load exams:', err);
      }
    }
    loadInitialExams();
  }, []);

  // When Technology or Semester changes, auto load curriculum subjects with configurable full marks
  useEffect(() => {
    if (!selectedTech || !selectedSemester) return;

    const autoSubs = getAutoLoadedCurriculumSubjects([selectedTech], selectedSemester as SemesterId);
    if (autoSubs && autoSubs.length > 0) {
      const mapped: ConfiguredSubject[] = autoSubs.map((s) => ({
        id: `subj-${s.subjectCode}`,
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        fullMarks: s.curriculumFullMarks || 50,
      }));
      setConfiguredSubjects(mapped);
    }
  }, [selectedTech, selectedSemester]);

  // Load DB Students & DB Results when Tech / Sem / Exam changes
  useEffect(() => {
    if (!selectedTech || !selectedSemester) {
      setDbStudents([]);
      setDbResults([]);
      return;
    }

    async function loadData() {
      try {
        const [studentList, resultList] = await Promise.all([
          getStudents(),
          selectedExamId ? getResults({ examId: selectedExamId }) : Promise.resolve([]),
        ]);

        const filtered = studentList.filter((s) => {
          const sTech = (s.departmentName || s.departmentId || '').toUpperCase();
          const matchTech =
            selectedTech === 'ALL' ||
            sTech.includes(selectedTech) ||
            (selectedTech === 'COMPUTER' && (sTech.includes('CMT') || sTech.includes('কম্পিউটার'))) ||
            (selectedTech === 'CIVIL' && (sTech.includes('CT') || sTech.includes('সিভিল'))) ||
            (selectedTech === 'ELECTRICAL' && (sTech.includes('ET') || sTech.includes('ইলেকট্রিক্যাল'))) ||
            (selectedTech === 'MECHANICAL' && (sTech.includes('MT') || sTech.includes('মেকানিক্যাল')));
          const matchSem = s.semesterId === selectedSemester;
          return matchTech && matchSem;
        });

        setAllStudentsList(studentList);
        setDbStudents(filtered);
        setDbResults(resultList);

        // If in 'FROM_STUDENTS' mode, populate studentRows from registered students
        if (creationMethod === 'FROM_STUDENTS') {
          const rows: StudentMarkRow[] = filtered.map((s) => {
            const existingRes = resultList.find(
              (r) => r.roll === s.roll || r.studentId === s.studentId
            );
            const m: Record<string, number> = {};
            if (existingRes?.subjects) {
              existingRes.subjects.forEach((sub) => {
                m[sub.subjectCode] = sub.obtainedMarks;
              });
            }
            const cleanRoll = toEnglishDigits(String(s.roll || '')).trim();
            const cleanSid = (s.studentId && !isFirestoreAutoId(s.studentId))
              ? s.studentId
              : generateDynamicStudentId(cleanRoll, selectedTech);
            return {
              id: s.id || `student-${cleanRoll}`,
              studentId: cleanSid,
              roll: cleanRoll,
              name: s.name,
              regNo: s.registration,
              isRegisteredStudent: true,
              marks: m,
            };
          });

          setStudentRows(rows);
          setSelectedStudentIds(new Set(rows.map((r) => r.id)));
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    }

    loadData();
  }, [selectedTech, selectedSemester, selectedExamId, creationMethod]);

  // Subject Management Handlers
  const handleAddSubject = (newSub: Omit<ConfiguredSubject, 'id'>) => {
    const created: ConfiguredSubject = {
      ...newSub,
      id: `custom-subj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setConfiguredSubjects((prev) => [...prev, created]);
  };

  const handleUpdateSubject = (id: string, updated: Partial<ConfiguredSubject>) => {
    setConfiguredSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
    );
  };

  const handleRemoveSubject = (id: string) => {
    setConfiguredSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const handleLoadCurriculumPreset = () => {
    const autoSubs = getAutoLoadedCurriculumSubjects([selectedTech], selectedSemester as SemesterId);
    if (autoSubs && autoSubs.length > 0) {
      const mapped: ConfiguredSubject[] = autoSubs.map((s) => ({
        id: `subj-${s.subjectCode}-${Date.now()}`,
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        fullMarks: s.curriculumFullMarks || 50,
      }));
      setConfiguredSubjects(mapped);
    }
  };

  // Student Mark Row Handlers
  const handleSaveStudentRow = (row: StudentMarkRow) => {
    setStudentRows((prev) => {
      const exists = prev.some((r) => r.id === row.id);
      if (exists) {
        return prev.map((r) => (r.id === row.id ? row : r));
      } else {
        return [...prev, row];
      }
    });
    setSelectedStudentIds((prev) => new Set([...prev, row.id]));
  };

  const handleDeleteStudentRow = (id: string) => {
    setStudentRows((prev) => prev.filter((r) => r.id !== id));
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedStudentIds.size === studentRows.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(studentRows.map((r) => r.id)));
    }
  };

  // Filtered rows based on selection and search
  const displayedStudents = studentRows.filter((s) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.roll.includes(q);
  });

  // Calculate final result items to show on the A4 document
  const activeResultRows = useMemo(() => {
    const activeList = studentRows.filter((r) => selectedStudentIds.has(r.id));

    return activeList.map((st) => {
      const subjectCalcs = configuredSubjects.map((sub) => {
        const obtained = st.marks[sub.subjectCode] ?? 0;
        const gradeInfo = calculateSubjectGrade(obtained, sub.fullMarks);
        return {
          subjectCode: sub.subjectCode,
          subjectName: sub.subjectName,
          fullMarks: sub.fullMarks,
          obtainedMarks: obtained,
          grade: gradeInfo.grade,
          gradePoint: gradeInfo.gradePoint,
          isPassed: gradeInfo.isPassed,
        };
      });

      const overall = calculateOverallResult(subjectCalcs);

      return {
        id: st.id,
        roll: st.roll,
        name: st.name,
        regNo: st.regNo,
        subjects: subjectCalcs,
        totalObtained: overall.totalObtainedMarks,
        totalFull: overall.totalFullMarks,
        gpa: overall.gpa,
        letterGrade: overall.letterGrade,
        isPassed: overall.isPassed,
      };
    });
  }, [studentRows, selectedStudentIds, configuredSubjects]);

  // Pass / Fail statistics for footer
  const totalExaminees = activeResultRows.length;
  const passedCount = activeResultRows.filter((r) => r.isPassed).length;
  const failedCount = totalExaminees - passedCount;
  const passRate = totalExaminees > 0 ? ((passedCount / totalExaminees) * 100).toFixed(1) : '0';

  // Helper Labels
  const selectedTechObj = AVAILABLE_TECHNOLOGIES.find((t) => t.id === selectedTech);
  const semesterBangla = selectedSemester
    ? SEMESTER_MAP[selectedSemester as keyof typeof SEMESTER_MAP] || `${toBanglaDigits(selectedSemester)}ম পর্ব`
    : '';
  const currentExam = exams.find((e) => e.id === selectedExamId);
  const finalExamHeading = currentExam ? currentExam.title : customExamTitle;

  // Options for Bottom Sheets
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

  const examOptions: SelectOption[] = [
    {
      value: 'CUSTOM',
      label: 'কাস্টম পরীক্ষার নাম লিখুন',
      sublabel: 'নিচের বক্সে ম্যানুয়ালি লিখুন',
      badge: 'ম্যানুয়াল',
      icon: Edit3,
    },
    ...exams.map((ex) => ({
      value: ex.id,
      label: ex.title,
      sublabel: `টাইপ: ${ex.examType} • তারিখ: ${ex.examDate || '---'}`,
      badge: ex.examType,
      icon: Award,
    })),
  ];

  // Publish Results to Firestore
  const handlePublishResults = async () => {
    if (activeResultRows.length === 0) return;

    // Strict pre-publishing validation
    const errors: string[] = [];

    if (configuredSubjects.length === 0) {
      errors.push('পরীক্ষায় কোনো বিষয় কনফিগার করা হয়নি। অনুগ্রহ করে অন্তত একটি বিষয় ও পূর্ণমান যুক্ত করুন।');
    }

    configuredSubjects.forEach((sub, sIdx) => {
      const fm = Number(sub.fullMarks);
      if (isNaN(fm) || fm <= 0) {
        errors.push(`বিষয় ${toBanglaDigits(sIdx + 1)}: '${sub.subjectName || sub.subjectCode}'-এর পূর্ণমান (Full Marks) অনুপস্থিত বা সঠিক নয়।`);
      }
    });

    activeResultRows.forEach((row, rIdx) => {
      const cleanRoll = toEnglishDigits(String(row.roll || '')).trim();
      const cleanName = String(row.name || '').trim();
      const label = cleanName ? `${cleanName} (রোল: ${cleanRoll || 'নেই'})` : `সারি ${toBanglaDigits(rIdx + 1)}`;

      if (!cleanRoll) {
        errors.push(`${label}: শিক্ষার্থীর রোল নম্বর দেওয়া হয়নি।`);
      }
      if (!cleanName) {
        errors.push(`সারি ${toBanglaDigits(rIdx + 1)}: শিক্ষার্থীর নাম দেওয়া হয়নি।`);
      }

      if (!row.subjects || row.subjects.length === 0) {
        errors.push(`${label}: কোনো বিষয়ের ফলাফল পাওয়া যায়নি।`);
      } else {
        row.subjects.forEach((sm) => {
          const fm = Number(sm.fullMarks);
          const om = Number(sm.obtainedMarks);
          if (isNaN(fm) || fm <= 0) {
            errors.push(`${label}: '${sm.subjectName || sm.subjectCode}' বিষয়ের পূর্ণমান সঠিক নয় (${sm.fullMarks})।`);
          }
          if (isNaN(om) || om < 0) {
            errors.push(`${label}: '${sm.subjectName || sm.subjectCode}' প্রাপ্ত নম্বর নেতিবাচক হতে পারে না।`);
          } else if (fm > 0 && om > fm) {
            errors.push(
              `${label}: '${sm.subjectName || sm.subjectCode}' প্রাপ্ত নম্বর (${toBanglaDigits(om)}) পূর্ণমান (${toBanglaDigits(fm)})-এর চেয়ে বেশি!`
            );
          }
        });
      }
    });

    if (errors.length > 0) {
      setPublishValidationErrors(errors);
      setPublishConfirmOpen(false);
      return;
    }

    setIsPublishing(true);
    try {
      let examId = selectedExamId;
      const examTitle = finalExamHeading;

      if (!examId || examId === 'CUSTOM' || !exams.find((e) => e.id === examId)) {
        examId = `exam-${Date.now()}`;
        const totalExamFullMarks = configuredSubjects.reduce((sum, s) => sum + (Number(s.fullMarks) || 0), 0);
        const newExam: Exam = {
          id: examId,
          title: examTitle || 'পর্ব সমাপনী পরীক্ষা',
          departmentId: selectedTech,
          departmentName: selectedTechObj?.name || 'ডিপ্লোমা ইন ইঞ্জিনিয়ারিং',
          semesterId: selectedSemester as SemesterId,
          examType: 'পর্ব সমাপনী পরীক্ষা',
          academicYear: examYear || '২০২৬',
          examDate: new Date().toISOString().split('T')[0],
          totalMarks: totalExamFullMarks,
          subjects: configuredSubjects.map((s) => ({
            code: s.subjectCode || (s as any).code || 'SUB',
            name: s.subjectName || (s as any).name || 'বিষয়',
            fullMarks: Number(s.fullMarks) > 0 ? Number(s.fullMarks) : 0,
          })),
          status: 'PUBLISHED',
          allowMeritList: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        const savedExamId = await saveExam(newExam, examId);
        examId = savedExamId || examId;
      } else {
        const existing = exams.find((e) => e.id === examId);
        if (existing) {
          await saveExam({ ...existing, status: 'PUBLISHED' }, examId);
        }
      }

      const studentResultsToSave: StudentResult[] = activeResultRows.map((row) => {
        const cleanRoll = toEnglishDigits(String(row.roll || '')).trim();
        const subjectResults: SubjectResult[] = row.subjects.map((sm) => {
          const fm = Number(sm.fullMarks) > 0 ? Number(sm.fullMarks) : 0;
          const om = Number(sm.obtainedMarks) || 0;
          const gradeInfo = calculateSubjectGrade(om, fm);
          return {
            subjectCode: sm.subjectCode,
            subjectName: sm.subjectName,
            obtainedMarks: om,
            fullMarks: fm,
            grade: gradeInfo.grade,
            gradePoint: gradeInfo.gradePoint,
            isPassed: gradeInfo.isPassed,
          };
        });

        const calculated = calculateOverallResult(subjectResults);

        const cleanSid = (row.studentId && !isFirestoreAutoId(row.studentId))
          ? row.studentId
          : generateDynamicStudentId(cleanRoll, selectedTech);
        const dynamicDocId = generateDynamicResultId(examId, cleanRoll);

        return {
          id: dynamicDocId,
          examId: examId,
          examTitle: examTitle || 'পর্ব সমাপনী পরীক্ষা',
          examType: 'পর্ব সমাপনী পরীক্ষা',
          examDate: new Date().toISOString().split('T')[0],
          studentId: cleanSid,
          roll: cleanRoll,
          studentName: String(row.name || '').trim(),
          registration: row.regNo ? String(row.regNo).trim() : undefined,
          departmentId: selectedTech,
          departmentName: selectedTechObj?.name || 'ডিপ্লোমা ইন ইঞ্জিনিয়ারিং',
          semesterId: selectedSemester as SemesterId,
          academicYear: examYear || '২০২৬',
          subjects: subjectResults,
          totalFullMarks: calculated.totalFullMarks,
          totalObtainedMarks: calculated.totalObtainedMarks,
          gpa: calculated.gpa,
          letterGrade: calculated.letterGrade,
          isPassed: calculated.isPassed,
          status: 'PUBLISHED' as const,
          verificationCode: generateVerificationCode(cleanRoll, examId),
          createdAt: Date.now(),
          publishedAt: Date.now(),
          updatedAt: Date.now(),
        };
      });

      await batchSaveResults(studentResultsToSave, examId, true);
      setIsResultPublished(true);
      await clearDraft('result_sheet');
      setPublishSuccessMessage(
        `সফলভাবে ${toBanglaDigits(studentResultsToSave.length)} জন শিক্ষার্থীর ফলাফল সিস্টেমে প্রকাশিত হয়েছে!`
      );
      setPublishConfirmOpen(false);

      if (pendingExportAction) {
        const action = pendingExportAction;
        setPendingExportAction(null);
        setTimeout(() => action(), 100);
      }
      setTimeout(() => setPublishSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Publishing failed:', err);
      alert('ফলাফল প্রকাশে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsPublishing(false);
    }
  };

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
      {/* 1. TOP CONTROL & METHOD SELECTION BAR                                      */}
      {/* ========================================================================= */}
      <div className="no-print bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                ফলাফল বিবরণী প্রস্তুতকরণ
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ডাটাবেজ শিক্ষার্থী সংযোগ অথবা সরাসরি ম্যানুয়াল এন্ট্রির মাধ্যমে প্রফেশনাল A4 ফলাফল প্রস্তুত করুন
              </p>
            </div>
          </div>

          {/* Method Switcher Pills */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/70 shrink-0">
            <button
              type="button"
              onClick={() => setCreationMethod('FROM_STUDENTS')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                creationMethod === 'FROM_STUDENTS'
                  ? 'bg-white text-teal-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-teal-700" />
              <span>শিক্ষার্থী যুক্ত করে তৈরি করুন</span>
            </button>

            <button
              type="button"
              onClick={() => setCreationMethod('MANUAL')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                creationMethod === 'MANUAL'
                  ? 'bg-white text-violet-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-4 h-4 text-violet-700" />
              <span>ম্যানুয়ালি ফলাফল তৈরি করুন</span>
            </button>
          </div>
        </div>

        {/* 2. Core Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
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

          <SelectTrigger
            label="পরীক্ষা নির্বাচন"
            value={selectedExamId}
            displayValue={currentExam ? currentExam.title : (selectedExamId === 'CUSTOM' ? 'কাস্টম পরীক্ষা' : '')}
            placeholder="পরীক্ষা সিলেক্ট করুন"
            onClick={() => setExamSheetOpen(true)}
            icon={Award}
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">পরীক্ষার নাম (ম্যানুয়াল / কাস্টম)</label>
            <input
              type="text"
              value={customExamTitle}
              onChange={(e) => {
                setCustomExamTitle(e.target.value);
                setSelectedExamId('CUSTOM');
              }}
              placeholder="পরীক্ষার নাম লিখুন"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200/90 rounded-2xl font-semibold focus:bg-white focus:border-violet-600 focus:outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Extra Settings Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">পরীক্ষার সাল</label>
            <input
              type="text"
              value={examYear}
              onChange={(e) => setExamYear(e.target.value)}
              placeholder="২০২৬"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200/90 rounded-2xl font-semibold focus:bg-white focus:border-violet-600 focus:outline-hidden transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">সেশন / শিক্ষাবর্ষ</label>
            <input
              type="text"
              value={academicSession}
              onChange={(e) => setAcademicSession(e.target.value)}
              placeholder="২০২৫-২৬"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200/90 rounded-2xl font-semibold focus:bg-white focus:border-violet-600 focus:outline-hidden transition-all"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setSubjectConfigSheetOpen(true)}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition-all border border-slate-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-violet-700" />
              <span>বিষয় ও পূর্ণমান কনফিগার ({toBanglaDigits(configuredSubjects.length)}টি বিষয়)</span>
            </button>
          </div>
        </div>

        {/* Subject Chips Preview Strip */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600">কনফিগার করা বিষয়:</span>
            {configuredSubjects.map((sub) => (
              <span
                key={sub.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-violet-50 text-violet-800 border border-violet-100"
              >
                <span>{sub.subjectName}</span>
                <span className="text-[10px] text-violet-500 font-mono">({toBanglaDigits(sub.fullMarks)})</span>
              </span>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 font-medium">
            * পূর্ণমান প্রতিটি পরীক্ষার জন্য কাস্টমাইজযোগ্য।
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. STUDENT & MARKS MANAGEMENT CARD                                        */}
      {/* ========================================================================= */}
      <div className="no-print bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-700" />
              <span>
                {creationMethod === 'FROM_STUDENTS'
                  ? 'ডাটাবেজ পরীক্ষার্থী তালিকা ও নম্বর ব্যবস্থাপনা:'
                  : 'ম্যানুয়াল পরীক্ষার্থী তালিকা ও নম্বর ব্যবস্থাপনা:'}
              </span>
            </h4>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-100 text-violet-800 font-mono">
              নির্বাচিত: {toBanglaDigits(selectedStudentIds.size)} / {toBanglaDigits(studentRows.length)} জন
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingStudent(null);
                setStudentEntrySheetOpen(true);
              }}
              className="px-4 py-2 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন শিক্ষার্থী ও নম্বর যোগ করুন</span>
            </button>
          </div>
        </div>

        {/* Toolbar: Search & Select All */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="রোল বা নাম দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-violet-600 focus:outline-hidden transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {selectedStudentIds.size === studentRows.length ? 'সব আনসিলেক্ট করুন' : 'সব সিলেক্ট করুন'}
            </button>
          </div>
        </div>

        {/* Student Table / Cards */}
        {studentRows.length === 0 ? (
          <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">
              {creationMethod === 'FROM_STUDENTS'
                ? 'এই টেকনোলজি ও সেমিস্টারের জন্য ডাটাবেজে কোনো শিক্ষার্থী পাওয়া যায়নি'
                : 'ম্যানুয়ালি এখনো কোনো শিক্ষার্থী যোগ করা হয়নি'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
              উপরে <strong className="text-violet-700">"নতুন শিক্ষার্থী ও নম্বর যোগ করুন"</strong> বাটনে ক্লিক করে রোল, নাম এবং বিষয়ভিত্তিক নম্বর যুক্ত করুন।
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {displayedStudents.map((st, idx) => {
              const isSelected = selectedStudentIds.has(st.id);

              // Calculate overall gpa for row preview
              const subCalcs = configuredSubjects.map((s) => ({
                obtainedMarks: st.marks[s.subjectCode] || 0,
                fullMarks: s.fullMarks,
              }));
              const overall = calculateOverallResult(subCalcs);

              return (
                <div
                  key={st.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-white border-violet-200/90 shadow-2xs'
                      : 'bg-slate-50/70 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectStudent(st.id)}
                      className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {st.name}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 font-mono">
                          (রোল: {st.roll})
                        </span>
                        {st.regNo && (
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                            রেজি: {st.regNo}
                          </span>
                        )}
                      </div>

                      {/* Marks Summary */}
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span>
                          মোট প্রাপ্ত: <strong className="text-slate-800 font-mono">{toBanglaDigits(overall.totalObtainedMarks)}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          GPA: <strong className="text-violet-700 font-mono">{overall.gpa.toFixed(2)}</strong>
                        </span>
                        <span>•</span>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                          overall.isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {overall.isPassed ? 'পাস' : 'ফেল'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStudent(st);
                        setStudentEntrySheetOpen(true);
                      }}
                      className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>নম্বর এন্ট্রি / এডিট</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteStudentRow(st.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODERN SLIDING BOTTOM SHEETS                                            */}
      {/* ========================================================================= */}
      <SubjectManagementBottomSheet
        isOpen={subjectConfigSheetOpen}
        onClose={() => setSubjectConfigSheetOpen(false)}
        subjects={configuredSubjects}
        onAddSubject={handleAddSubject}
        onUpdateSubject={handleUpdateSubject}
        onRemoveSubject={handleRemoveSubject}
        onLoadCurriculumPreset={handleLoadCurriculumPreset}
        hasCurriculumPreset={Boolean(selectedTech && selectedSemester)}
      />

      <StudentMarksBottomSheet
        isOpen={studentEntrySheetOpen}
        onClose={() => {
          setStudentEntrySheetOpen(false);
          setEditingStudent(null);
        }}
        subjects={configuredSubjects}
        editingStudent={editingStudent}
        onSave={handleSaveStudentRow}
        isManualMode={creationMethod === 'MANUAL'}
        allStudents={allStudentsList.length > 0 ? allStudentsList : dbStudents}
      />

      <SelectBottomSheet
        isOpen={techSheetOpen}
        onClose={() => setTechSheetOpen(false)}
        title="টেকনোলজি নির্বাচন"
        subtitle="ফলাফল তৈরির জন্য টেকনোলজি সিলেক্ট করুন"
        options={techOptions}
        selectedValue={selectedTech}
        onSelect={(val) => {
          setSelectedTech(val);
        }}
      />

      <SelectBottomSheet
        isOpen={semesterSheetOpen}
        onClose={() => setSemesterSheetOpen(false)}
        title="সেমিস্টার নির্বাচন"
        subtitle="নির্দিষ্ট পর্ব সিলেক্ট করুন"
        options={semesterOptions}
        selectedValue={selectedSemester}
        onSelect={(val) => {
          setSelectedSemester(val);
        }}
      />

      <SelectBottomSheet
        isOpen={examSheetOpen}
        onClose={() => setExamSheetOpen(false)}
        title="পরীক্ষা নির্বাচন"
        subtitle="ফলাফল বিবরণীর জন্য পরীক্ষা সিলেক্ট করুন"
        options={examOptions}
        selectedValue={selectedExamId}
        onSelect={(val) => {
          setSelectedExamId(val);
          if (val === 'CUSTOM') {
            setCustomExamTitle('১ম পর্ব সমাপনী পরীক্ষা');
          } else {
            const found = exams.find((e) => e.id === val);
            if (found) setCustomExamTitle(found.title);
          }
        }}
      />

      {/* ========================================================================= */}
      {/* 5. A4 OFFICIAL EXAMINATION RESULT SHEET (PRINT / PDF ENGINE)              */}
      {/* ========================================================================= */}
      {(!selectedTech || !selectedSemester) ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500 shadow-xs">
          <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700 text-sm">অনুগ্রহ করে টেকনোলজি ও সেমিস্টার নির্বাচন করুন</p>
          <p className="text-xs text-slate-400 mt-1">
            টেকনোলজি ও সেমিস্টার নির্বাচন করলে স্বয়ংক্রিয়ভাবে ফলাফল শিটের প্রিন্ট প্রিভিউ দেখা যাবে।
          </p>
        </div>
      ) : (
        <>
          {publishSuccessMessage && (
            <div className="no-print p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-900 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{publishSuccessMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setPublishSuccessMessage(null)}
                className="text-emerald-700 hover:text-emerald-900 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <A4DocumentEngine
            hideDefaultHeader={true}
            showSignatures={false}
            orientation="landscape"
            fileName={`result-sheet-${selectedTech}-${selectedSemester}-${examYear}`}
            onBeforePrint={handleBeforeExport}
            onBeforeDownloadPdf={handleBeforeExport}
            actionButtons={
              <button
                type="button"
                onClick={() => {
                  setPendingExportAction(null);
                  setPublishConfirmOpen(true);
                }}
                disabled={activeResultRows.length === 0 || isPublishing}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-600/50 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-200" />
                <span>{isResultPublished ? 'ফলাফল প্রকাশিত' : 'ফলাফল প্রকাশ করুন'}</span>
              </button>
            }
          >
            {/* Exact Official Paper Container */}
            <div className="font-bengali text-black leading-normal select-text px-2 py-1">
              {/* Header matching DPIB Official Result Sheet Format */}
              <div className="text-center mb-5 pb-2 border-b-2 border-black">
                <h1 className="text-2xl font-black text-black tracking-tight mb-0.5">
                  {docSettings.instituteName || 'দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট, ভোলা'}
                </h1>
                <h2 className="text-base font-bold text-black my-0.5">
                  {finalExamHeading} {examYear ? `- ${toBanglaDigits(examYear)}` : ''}
                </h2>
                <div className="flex justify-center items-center gap-4 text-xs font-semibold text-slate-900 mt-1">
                  <span>টেকনোলজি: <strong>{selectedTechObj?.name}</strong></span>
                  <span>|</span>
                  <span>পর্ব: <strong>{semesterBangla}</strong></span>
                  {academicSession && (
                    <>
                      <span>|</span>
                      <span>সেশন: <strong>{academicSession}</strong></span>
                    </>
                  )}
                </div>
              </div>

              {/* Tabular Result Sheet */}
              {activeResultRows.length === 0 ? (
                <div className="py-14 text-center text-slate-400 border border-dashed border-black rounded-lg">
                  কোনো পরীক্ষার্থীর ফলাফল রেকর্ড নেই বা কোনো শিক্ষার্থী সিলেক্ট করা হয়নি।
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full border-collapse border border-black text-[11px] text-center">
                    <thead>
                      <tr className="bg-white text-black font-bold">
                        <th className="border border-black px-1.5 py-2 text-center w-10 font-bold">ক্র: নং</th>
                        <th className="border border-black px-2 py-2 text-center w-20 font-bold">রোল</th>
                        <th className="border border-black px-2.5 py-2 text-left min-w-[140px] font-bold">শিক্ষার্থীর নাম</th>
                        {configuredSubjects.map((sub) => (
                          <th
                            key={sub.id}
                            className="border border-black px-1.5 py-1.5 text-center font-bold"
                            style={{ lineHeight: '1.3' }}
                          >
                            <span className="block font-bold text-[10.5px]">{sub.subjectName}</span>
                            <span className="block text-[9px] font-normal text-slate-800">
                              (পূর্ণমান: {toBanglaDigits(sub.fullMarks)})
                            </span>
                          </th>
                        ))}
                        <th className="border border-black px-1.5 py-2 text-center w-14 font-bold">মোট প্রাপ্ত</th>
                        <th className="border border-black px-1.5 py-2 text-center w-12 font-bold">GPA</th>
                        <th className="border border-black px-2 py-2 text-center w-14 font-bold">ফলাফল</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeResultRows.map((row, idx) => (
                        <tr key={row.id} className="text-black hover:bg-slate-50/50">
                          <td className="border border-black px-1 py-2 text-center font-medium">
                            {toBanglaDigits(idx + 1)}
                          </td>
                          <td className="border border-black px-1.5 py-2 text-center font-mono font-bold">
                            {row.roll}
                          </td>
                          <td className="border border-black px-2 py-2 text-left font-semibold text-black">
                            {row.name}
                          </td>
                          {row.subjects.map((sm, sIdx) => {
                            const isFail = !sm.isPassed || sm.grade === 'F';
                            return (
                              <td
                                key={sIdx}
                                className={`border border-black px-1 py-2 text-center font-mono font-bold ${
                                  isFail && sm.obtainedMarks > 0 ? 'text-red-600' : ''
                                }`}
                              >
                                {sm.obtainedMarks > 0 ? (
                                  <span>{sm.obtainedMarks}</span>
                                ) : (
                                  <span className="text-slate-400 font-normal">০</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="border border-black px-1 py-2 text-center font-mono font-bold">
                            {row.totalObtained}
                          </td>
                          <td className="border border-black px-1 py-2 text-center font-mono font-bold">
                            {row.gpa > 0 ? row.gpa.toFixed(2) : '0.00'}
                          </td>
                          <td
                            className={`border border-black px-1.5 py-2 text-center font-bold ${
                            row.isPassed && row.gpa > 0 ? 'text-black' : 'text-red-600'
                          }`}
                        >
                          {row.isPassed && row.gpa > 0 ? 'পাস' : 'ফেল'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary Statistics Strip */}
            {activeResultRows.length > 0 && (
              <div className="mt-3 py-1 px-3 border border-black bg-slate-50/50 flex items-center justify-between text-[11px] font-bold text-black">
                <span>মোট পরীক্ষার্থী: {toBanglaDigits(totalExaminees)} জন</span>
                <span>উত্তীর্ণ: {toBanglaDigits(passedCount)} জন</span>
                <span>অনুত্তীর্ণ: {toBanglaDigits(failedCount)} জন</span>
                <span>পাসের হার: {toBanglaDigits(passRate)}%</span>
              </div>
            )}

            {/* Official Signatures */}
            <div className="mt-14 flex justify-between items-end px-6">
              <div className="text-center w-52">
                <p className="border-t border-black pt-1.5 font-bold text-xs text-black">
                  {docSettings.examControllerName || 'ফলাফল প্রস্তুতকারী'}
                </p>
                <p className="text-[10px] text-slate-700 mt-0.5">দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট</p>
              </div>

              <div className="text-center w-52">
                <p className="border-t border-black pt-1.5 font-bold text-xs text-black">
                  {docSettings.headOfDeptTitle || 'পরীক্ষা নিয়ন্ত্রণ কমিটি'}
                </p>
                <p className="text-[10px] text-slate-700 mt-0.5">দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট</p>
              </div>

              <div className="text-center w-56">
                <p className="border-t border-black pt-1.5 font-bold text-xs text-black">
                  {docSettings.principalTitle || 'অধ্যক্ষ'}
                </p>
                {docSettings.principalName && (
                  <p className="text-[11px] font-bold text-slate-900 mt-0.5">{docSettings.principalName}</p>
                )}
                <p className="text-[10px] text-slate-800 mt-0.5 font-medium">
                  {docSettings.instituteName || 'দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট, ভোলা।'}
                </p>
              </div>
            </div>
          </div>
        </A4DocumentEngine>

        {/* Confirmation Bottom Sheet for Publishing Results */}
        <BottomSheet
          isOpen={publishConfirmOpen}
          onClose={handleDismissPublish}
          title="ফলাফল প্রকাশের নিশ্চিতকরণ"
        >
          <div className="p-6 space-y-5 font-bengali">
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-950">
                  ফলাফল রেজাল্ট প্যানেলে প্রকাশ করবেন?
                </h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  ফলাফল প্রকাশ করলে শিক্ষার্থীরা রেজাল্ট প্যানেলে তাদের রোল নাম্বার দিয়ে এই ফলাফলটি অনুসন্ধান ও মার্কশিট ডাউনলোড করতে পারবে।
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">পরীক্ষার নাম:</span>
                <span className="font-bold text-slate-900">{finalExamHeading}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">টেকনোলজি:</span>
                <span className="font-bold text-slate-900">{selectedTechObj?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">সেমিস্টার:</span>
                <span className="font-bold text-slate-900">{semesterBangla}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">মোট পরীক্ষার্থী:</span>
                <span className="font-bold text-teal-800">{toBanglaDigits(activeResultRows.length)} জন</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDismissPublish}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                এখন নয়
              </button>
              <button
                type="button"
                onClick={handlePublishResults}
                disabled={isPublishing}
                className="flex-1 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isPublishing ? 'প্রকাশ করা হচ্ছে...' : 'প্রকাশ করুন'}</span>
              </button>
            </div>
          </div>
        </BottomSheet>

        {/* Validation Errors Bottom Sheet */}
        <BottomSheet
          isOpen={publishValidationErrors.length > 0}
          onClose={() => setPublishValidationErrors([])}
          title="ফলাফল প্রকাশে অসমাপ্ত বা ত্রুটিযুক্ত তথ্য"
        >
          <div className="p-6 space-y-4 font-bengali">
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-rose-50 border border-rose-200">
              <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-950">
                  নিচের ত্রুটিগুলো সংশোধন ছাড়া ফলাফল প্রকাশ সম্ভব নয়:
                </h4>
                <p className="text-xs text-rose-800 mt-1">
                  প্রত্যেক বিষয়ের পূর্ণমান মূল ডাটা অনুযায়ী হতে হবে এবং প্রাপ্ত নম্বর পূর্ণমানের চেয়ে বেশি হতে পারবে না।
                </p>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {publishValidationErrors.map((err, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 flex items-start gap-2"
                >
                  <span className="font-bold text-rose-600 shrink-0 mt-0.5">•</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setPublishValidationErrors([])}
              className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs"
            >
              ঠিক আছে, ঠিক করছি
            </button>
          </div>
        </BottomSheet>
      </>
    )}

    {/* Publishing Loading Overlay */}
    <LoadingOverlay
      isVisible={isPublishing}
      message="ফলাফল প্রকাশ করা হচ্ছে..."
      subtext="ক্লাউড ডাটাবেসে সকল শিক্ষার্থীর ফলাফল যুক্ত ও প্রকাশিত হচ্ছে..."
      minDurationMs={2000}
    />
  </div>
);
};
