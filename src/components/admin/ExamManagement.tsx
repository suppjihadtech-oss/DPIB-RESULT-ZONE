import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  PlusCircle,
  Eye,
  EyeOff,
  Layers,
  Calendar,
  AlertTriangle,
  GraduationCap,
  Building,
  Tag,
  Sparkles,
  Database,
  Check,
  Cpu,
  Zap,
  Wrench,
  Anchor,
  Compass,
  RefreshCw,
  RotateCcw,
  CheckCheck,
} from 'lucide-react';
import { Exam, Department, ExamSubject, SemesterId, ExamType } from '../../types';
import {
  saveExam,
  deleteExam,
  updateExamStatus,
  seedCurriculumDatabase,
} from '../../services/db';
import { toBanglaDigits, formatBanglaDate, SEMESTER_MAP } from '../../utils/bangla';
import { EmptyState } from '../common/EmptyState';
import { LoadingOverlay } from '../common/LoadingOverlay';
import { BottomSheet } from '../common/BottomSheet';
import { SelectBottomSheet, SelectTrigger, SelectOption } from '../common/SelectBottomSheet';
import { ModernDatePicker, ModernDateTrigger } from '../common/ModernDatePicker';
import {
  AVAILABLE_TECHNOLOGIES,
  MASTER_CURRICULUM_DATA,
  getAutoLoadedCurriculumSubjects,
  AutoLoadedCurriculumSubject,
} from '../../data/masterCurriculum';

interface ExamManagementProps {
  exams: Exam[];
  departments: Department[];
  examTypes: string[];
  onRefreshExams: () => void;
}

export const ExamManagement: React.FC<ExamManagementProps> = ({
  exams,
  departments,
  examTypes,
  onRefreshExams,
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  // BottomSheet Select Visibility
  const [semesterSheetOpen, setSemesterSheetOpen] = useState(false);
  const [examTypeSheetOpen, setExamTypeSheetOpen] = useState(false);
  const [examDatePickerOpen, setExamDatePickerOpen] = useState(false);

  // Delete confirmation state
  const [deleteConfirmExam, setDeleteConfirmExam] = useState<Exam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Seeding state
  const [isSeedingCurriculum, setIsSeedingCurriculum] = useState(false);
  const [seedSuccessMessage, setSeedSuccessMessage] = useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formAcademicYear, setFormAcademicYear] = useState('2026');
  const [formSemesterId, setFormSemesterId] = useState<SemesterId>('1');
  const [selectedTechCodes, setSelectedTechCodes] = useState<string[]>(['COMPUTER']);
  const [formExamType, setFormExamType] = useState<ExamType>(examTypes[0] || 'মডেল টেস্ট');
  const [formExamDate, setFormExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDescription, setFormDescription] = useState('');
  const [formAllowMeritList, setFormAllowMeritList] = useState(true);
  const [formStatus, setFormStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');
  const [formDefaultMarks, setFormDefaultMarks] = useState<number>(45);

  // Subject state for current exam
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Map of canonical technology code to technology info
  const techMap = useMemo(() => {
    const map = new Map<string, (typeof AVAILABLE_TECHNOLOGIES)[0]>();
    AVAILABLE_TECHNOLOGIES.forEach((t) => map.set(t.code, t));
    return map;
  }, []);

  /**
   * Helper function to recalculate subjects automatically based on active technologies & semester.
   * Completely clears stale technology data while preserving existing custom full marks for retained subjects.
   */
  const computeAutoLoadedSubjects = (
    techCodes: string[],
    semId: SemesterId,
    existingSubjects: ExamSubject[] = [],
    defaultMarks: number = formDefaultMarks
  ): ExamSubject[] => {
    if (!techCodes || techCodes.length === 0 || !semId) return [];

    const rawCurriculumList = getAutoLoadedCurriculumSubjects(techCodes, semId);
    const existingMarksMap = new Map<string, number>();
    existingSubjects.forEach((s) => {
      if (s.code && s.fullMarks > 0) {
        existingMarksMap.set(s.code.trim(), s.fullMarks);
      }
    });

    return rawCurriculumList.map((item) => ({
      code: item.code,
      name: item.name,
      fullMarks: existingMarksMap.get(item.code) || defaultMarks,
    }));
  };

  const handleOpenCreate = () => {
    setEditingExam(null);
    setFormTitle('');
    setFormAcademicYear(new Date().getFullYear().toString());
    setFormSemesterId('1');
    const defaultTechs = ['COMPUTER'];
    setSelectedTechCodes(defaultTechs);
    setFormExamType(examTypes[0] || 'মডেল টেস্ট');
    setFormExamDate(new Date().toISOString().split('T')[0]);
    setFormDescription('');
    setFormAllowMeritList(true);
    setFormStatus('PUBLISHED');
    setFormDefaultMarks(45);
    setFormError(null);

    // Automatically load Computer 1st semester subjects
    const autoSubs = computeAutoLoadedSubjects(defaultTechs, '1', [], 45);
    setSubjects(autoSubs);

    setSheetOpen(true);
  };

  const handleOpenEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormTitle(exam.title);
    setFormAcademicYear(exam.academicYear || new Date().getFullYear().toString());
    setFormSemesterId(exam.semesterId);

    // Parse technologies
    let techs: string[] = [];
    if (exam.departmentIds && exam.departmentIds.length > 0) {
      techs = exam.departmentIds;
    } else if (exam.departmentId) {
      const matchTech = AVAILABLE_TECHNOLOGIES.find(
        (t) => t.id === exam.departmentId || t.code === exam.departmentId
      );
      techs = matchTech ? [matchTech.code] : ['COMPUTER'];
    } else {
      techs = ['COMPUTER'];
    }
    setSelectedTechCodes(techs);

    setFormExamType(exam.examType);
    setFormExamDate(exam.examDate);
    setFormDescription(exam.description || '');
    setFormAllowMeritList(exam.allowMeritList);
    setFormStatus(exam.status === 'ARCHIVED' ? 'DRAFT' : exam.status);
    setSubjects(exam.subjects || []);
    setFormError(null);
    setSheetOpen(true);
  };

  /**
   * Toggle a specific technology. Automatically recalculates and replaces the subject list.
   */
  const handleToggleTech = (techCode: string) => {
    let nextTechs: string[];
    if (selectedTechCodes.includes(techCode)) {
      nextTechs = selectedTechCodes.filter((t) => t !== techCode);
    } else {
      nextTechs = [...selectedTechCodes, techCode];
    }
    setSelectedTechCodes(nextTechs);

    // Recalculate auto-loaded subjects strictly from the new selection (no stale data)
    const newSubjects = computeAutoLoadedSubjects(nextTechs, formSemesterId, subjects, formDefaultMarks);
    setSubjects(newSubjects);
  };

  /**
   * Select All 6 Technologies at once
   */
  const handleSelectAllTech = () => {
    const allTechs = AVAILABLE_TECHNOLOGIES.map((t) => t.code);
    setSelectedTechCodes(allTechs);
    const newSubjects = computeAutoLoadedSubjects(allTechs, formSemesterId, subjects, formDefaultMarks);
    setSubjects(newSubjects);
  };

  /**
   * Deselect All Technologies
   */
  const handleDeselectAllTech = () => {
    setSelectedTechCodes([]);
    setSubjects([]);
  };

  /**
   * Semester change handler - dynamically reloads subjects for selected technologies & new semester
   */
  const handleSemesterChange = (newSemId: SemesterId) => {
    setFormSemesterId(newSemId);
    const newSubjects = computeAutoLoadedSubjects(selectedTechCodes, newSemId, [], formDefaultMarks);
    setSubjects(newSubjects);
  };

  /**
   * Restore all auto-loaded curriculum subjects for current active selection
   */
  const handleReloadFromCurriculum = () => {
    const reloaded = computeAutoLoadedSubjects(selectedTechCodes, formSemesterId, subjects, formDefaultMarks);
    setSubjects(reloaded);
  };

  /**
   * Remove subject from current exam only. Master Curriculum Database is never modified.
   */
  const handleRemoveSubject = (codeToRemove: string) => {
    setSubjects((prev) => prev.filter((s) => s.code !== codeToRemove));
  };

  const handleSubjectMarksChange = (index: number, val: number) => {
    const next = [...subjects];
    next[index] = { ...next[index], fullMarks: Math.max(1, val || 0) };
    setSubjects(next);
  };

  const handleApplyDefaultMarksToAll = (marks: number) => {
    setFormDefaultMarks(marks);
    setSubjects((prev) =>
      prev.map((s) => ({
        ...s,
        fullMarks: marks,
      }))
    );
  };

  const handleSeedDatabase = async () => {
    setIsSeedingCurriculum(true);
    setSeedSuccessMessage(null);
    try {
      const count = await seedCurriculumDatabase();
      setSeedSuccessMessage(`কারিকুলাম ডাটাবেসে মোট ${toBanglaDigits(count)}টি বিষয় সফলভাবে আপডেট হয়েছে।`);
      setTimeout(() => setSeedSuccessMessage(null), 5000);
    } catch (err: any) {
      alert('কারিকুলাম ডাটাবেস আপডেট করতে ত্রুটি: ' + err.message);
    } finally {
      setIsSeedingCurriculum(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanTitle = formTitle.trim();
    if (!cleanTitle) {
      setFormError('অনুগ্রহ করে পরীক্ষার নাম প্রদান করুন।');
      return;
    }

    if (selectedTechCodes.length === 0) {
      setFormError('অনুগ্রহ করে অন্তত একটি টেকনোলজি নির্বাচন করুন।');
      return;
    }

    if (subjects.length === 0) {
      setFormError('পরীক্ষায় অন্তত একটি বিষয় থাকতে হবে। টেকনোলজি নির্বাচন করে বিষয় স্বয়ংক্রিয়ভাবে লোড করুন।');
      return;
    }

    if (subjects.some((s) => !s.code.trim() || !s.name.trim() || !s.fullMarks || s.fullMarks <= 0)) {
      setFormError('সকল বিষয়ের সঠিক কোড ও পূর্ণমান নির্ধারণ করুন।');
      return;
    }

    // Resolve primary department & list of departments
    const primaryTech = AVAILABLE_TECHNOLOGIES.find((t) => t.code === selectedTechCodes[0]);
    const departmentId = primaryTech?.id || 'cmt';
    const departmentName = selectedTechCodes
      .map((code) => AVAILABLE_TECHNOLOGIES.find((t) => t.code === code)?.shortName || code)
      .join(', ');

    const departmentNames = selectedTechCodes.map(
      (code) => AVAILABLE_TECHNOLOGIES.find((t) => t.code === code)?.name || code
    );

    const totalMarks = subjects.reduce((sum, s) => sum + Number(s.fullMarks || 0), 0);

    setSaving(true);
    try {
      await saveExam(
        {
          title: cleanTitle,
          academicYear: formAcademicYear.trim() || new Date().getFullYear().toString(),
          semesterId: formSemesterId,
          departmentId,
          departmentName,
          departmentIds: selectedTechCodes,
          departmentNames,
          examType: formExamType,
          examDate: formExamDate,
          totalMarks,
          description: formDescription.trim(),
          subjects: subjects.map((s) => ({
            code: s.code.trim(),
            name: s.name.trim(),
            fullMarks: Number(s.fullMarks),
          })),
          status: formStatus,
          allowMeritList: formAllowMeritList,
          publishedAt: formStatus === 'PUBLISHED' ? Date.now() : null,
          createdAt: editingExam ? editingExam.createdAt : Date.now(),
          updatedAt: Date.now(),
        },
        editingExam ? editingExam.id : undefined
      );

      setSheetOpen(false);
      onRefreshExams();
    } catch (err: any) {
      setFormError(err.message || 'সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (exam: Exam) => {
    const nextStatus = exam.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await updateExamStatus(exam.id, nextStatus);
      onRefreshExams();
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const handleOpenDelete = (exam: Exam) => {
    setDeleteConfirmExam(exam);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmExam) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteExam(deleteConfirmExam.id);
      setDeleteConfirmExam(null);
      onRefreshExams();
    } catch (err: any) {
      setDeleteError(err.message || 'পরীক্ষা মুছে ফেলতে ত্রুটি হয়েছে');
    } finally {
      setIsDeleting(false);
    }
  };

  // Options for Semester Bottom Sheet
  const semesterOptions: SelectOption[] = (['1', '2', '3', '4', '5', '6', '7', '8'] as SemesterId[]).map((semId) => ({
    value: semId,
    label: SEMESTER_MAP[semId],
    sublabel: `ডিপ্লোমা ইন ইঞ্জিনিয়ারিং (${toBanglaDigits(semId)}ম পর্ব)`,
    badge: `${semId}th Sem`,
    icon: GraduationCap,
  }));

  // Options for Exam Type Bottom Sheet
  const examTypeOptions: SelectOption[] = examTypes.map((type) => ({
    value: type,
    label: type,
    badge: 'TYPE',
    icon: Tag,
  }));

  // Map of code to Curriculum Reference information for display
  const curriculumRefInfoMap = useMemo(() => {
    const map = new Map<string, { refMarks: number; technologies: string[] }>();
    MASTER_CURRICULUM_DATA.forEach((s) => {
      const existing = map.get(s.subjectCode);
      if (existing) {
        if (!existing.technologies.includes(s.technology)) {
          existing.technologies.push(s.technology);
        }
      } else {
        map.set(s.subjectCode, {
          refMarks: s.curriculumFullMarks,
          technologies: [s.technology],
        });
      }
    });
    return map;
  }, []);

  const allTechSelected = selectedTechCodes.length === AVAILABLE_TECHNOLOGIES.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            পরীক্ষা ব্যবস্থাপনা
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200/70">
              অটো-কারিকুলাম যুক্ত
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            মোট পরীক্ষা: {toBanglaDigits(exams.length)}টি (সেন্ট্রালাইজড কারিকুলাম স্বয়ংক্রিয় লোডিং সহ)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleSeedDatabase}
            disabled={isSeedingCurriculum}
            title="কারিকুলাম ডাটাবেস হালনাগাদ করুন"
            className="flex items-center space-x-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all border border-slate-200/80 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-700 ${isSeedingCurriculum ? 'animate-spin' : ''}`} />
            <span>কারিকুলাম সিঙ্ক</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন পরীক্ষা তৈরি</span>
          </button>
        </div>
      </div>

      {seedSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{seedSuccessMessage}</span>
        </div>
      )}

      {/* Exam Cards Grid */}
      {exams.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="কোনো পরীক্ষা তৈরি করা হয়নি"
          description="ফলাফল প্রকাশের জন্য প্রথমে সেন্ট্রালাইজড কারিকুলাম থেকে স্বয়ংক্রিয় বিষয় নির্বাচন করে পরীক্ষা তৈরি করুন।"
          actionText="প্রথম পরীক্ষা তৈরি করুন"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-100 font-outfit uppercase">
                      {exam.examType}
                    </span>
                    {exam.academicYear && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                        {toBanglaDigits(exam.academicYear)}
                      </span>
                    )}
                  </div>
                  <span
                    className={`flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      exam.status === 'PUBLISHED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                        : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                    }`}
                  >
                    {exam.status === 'PUBLISHED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    <span>{exam.status === 'PUBLISHED' ? 'প্রকাশিত' : 'খসড়া'}</span>
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-2">{exam.title}</h3>

                <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                  <p className="flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {exam.departmentName} • {SEMESTER_MAP[exam.semesterId]}
                    </span>
                  </p>
                  <p className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>তারিখ: {formatBanglaDate(exam.examDate)}</span>
                  </p>
                  <p className="flex items-center space-x-1.5 text-slate-700 font-medium">
                    <BookOpen className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>
                      মোট বিষয়: {toBanglaDigits(exam.subjects?.length || 0)}টি (পরীক্ষার পূর্ণমান:{' '}
                      {toBanglaDigits(exam.totalMarks)})
                    </span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleTogglePublish(exam)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    exam.status === 'PUBLISHED'
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {exam.status === 'PUBLISHED' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{exam.status === 'PUBLISHED' ? 'অপ্রকাশিত করুন' : 'এখন প্রকাশ করুন'}</span>
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEdit(exam)}
                    className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                    title="সম্পাদনা"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenDelete(exam)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation BottomSheet */}
      <BottomSheet
        isOpen={Boolean(deleteConfirmExam)}
        onClose={() => {
          if (!isDeleting) setDeleteConfirmExam(null);
        }}
        title="পরীক্ষা মুছে ফেলার নিশ্চিতকরণ"
        subtitle="আপনি কি নিশ্চিতভাবে এই পরীক্ষাটি মুছে ফেলতে চান?"
      >
        <div className="space-y-4 pb-4">
          {deleteError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
              {deleteError}
            </div>
          )}

          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800 leading-relaxed">
              <p className="font-bold text-sm text-rose-900 mb-1">
                {deleteConfirmExam?.title}
              </p>
              <p>
                বিভাগ: {deleteConfirmExam?.departmentName} • সেমিস্টার:{' '}
                {deleteConfirmExam ? SEMESTER_MAP[deleteConfirmExam.semesterId] : ''}
              </p>
              <p className="mt-2 text-rose-700">
                সতর্কতা: এই পরীক্ষাটি ডিলিট করলে পোর্টাল থেকে এর সমস্ত বিবরণ মুছে যাবে।
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setDeleteConfirmExam(null)}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
            >
              বাতিল করুন
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isDeleting ? 'ডিলিট হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Create / Edit Exam Bottom Sheet */}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editingExam ? 'পরীক্ষার বিবরণ সম্পাদনা' : 'নতুন পরীক্ষা তৈরি'}
        subtitle="টেকনোলজি ও সেমিস্টার নির্বাচন করলে কারিকুলাম থেকে বিষয় স্বয়ংক্রিয়ভাবে লোড হবে"
        maxHeight="max-h-[95vh]"
      >
        <form onSubmit={handleSave} className="space-y-4 pb-6">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Title */}
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                পরীক্ষার নাম <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="পরীক্ষার পূর্ণ নাম লিখুন"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-teal-600 outline-hidden"
              />
            </div>

            {/* Academic Year */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">শিক্ষাবর্ষ / সাল</label>
              <input
                type="text"
                placeholder="শিক্ষাবর্ষ বা সাল লিখুন"
                value={formAcademicYear}
                onChange={(e) => setFormAcademicYear(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-teal-600 outline-hidden"
              />
            </div>

            {/* Semester Select */}
            <SelectTrigger
              label="সেমিস্টার (পর্ব)"
              value={formSemesterId}
              displayValue={SEMESTER_MAP[formSemesterId]}
              onClick={() => setSemesterSheetOpen(true)}
              icon={GraduationCap}
            />

            {/* Exam Type Select */}
            <SelectTrigger
              label="পরীক্ষার ধরন"
              value={formExamType}
              displayValue={formExamType}
              onClick={() => setExamTypeSheetOpen(true)}
              icon={Tag}
            />

            {/* Exam Date */}
            <div className="space-y-1 sm:col-span-2">
              <ModernDateTrigger
                id="exam-date-trigger"
                label="পরীক্ষার তারিখ"
                required
                value={formExamDate}
                onClick={() => setExamDatePickerOpen(true)}
              />
            </div>
          </div>

          {/* Technology Selection Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase">
                  টেকনোলজি নির্বাচন
                </label>
                <p className="text-[11px] text-slate-500">
                  টেকনোলজি নির্বাচন পরিবর্তন করলে বিষয় তালিকা স্বয়ংক্রিয়ভাবে রিক্যালকুলেট হবে
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={allTechSelected ? handleDeselectAllTech : handleSelectAllTech}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                    allTechSelected
                      ? 'bg-teal-100 text-teal-800 border-teal-300'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {allTechSelected ? 'সব আনসিলেক্ট' : 'সকল টেকনোলজি'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVAILABLE_TECHNOLOGIES.map((tech) => {
                const isSelected = selectedTechCodes.includes(tech.code);
                return (
                  <button
                    key={tech.code}
                    type="button"
                    onClick={() => handleToggleTech(tech.code)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 border-teal-400 text-teal-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {tech.code === 'COMPUTER' && <Cpu className="w-3.5 h-3.5" />}
                        {tech.code === 'CIVIL' && <Building className="w-3.5 h-3.5" />}
                        {tech.code === 'ELECTRICAL' && <Zap className="w-3.5 h-3.5" />}
                        {tech.code === 'MECHANICAL' && <Wrench className="w-3.5 h-3.5" />}
                        {tech.code === 'MARINE' && <Anchor className="w-3.5 h-3.5" />}
                        {tech.code === 'SURVEYING' && <Compass className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-bold truncate">{tech.shortName}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-teal-700 stroke-[2.5] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auto-Loaded Curriculum Subjects Section */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-teal-700" />
                  স্বয়ংক্রিয় বিষয় তালিকা ({toBanglaDigits(subjects.length)}টি বিষয় অন্তর্ভুক্ত)
                </h4>
                <p className="text-[11px] text-slate-500">
                  সিলেবাস থেকে ডুপ্লিকেট ছাড়া লোডকৃত বিষয়সমূহ
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReloadFromCurriculum}
                  className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold transition-all border border-teal-200 flex items-center gap-1 cursor-pointer"
                  title="কারিকুলাম থেকে পুনরায় সম্পূর্ণ তালিকা লোড করুন"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
                  <span>কারিকুলাম রিলোড</span>
                </button>
              </div>
            </div>

            {/* Quick Default Marks Setter */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-600 font-medium">পরীক্ষার পূর্ণমান এক ক্লিকে সেট করুন:</span>
              <div className="flex items-center gap-1.5">
                {[45, 50, 100].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleApplyDefaultMarksToAll(m)}
                    className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer ${
                      formDefaultMarks === m
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {toBanglaDigits(m)}
                  </button>
                ))}
              </div>
            </div>

            {/* Loaded Subjects List Panel */}
            <div className="space-y-2 max-h-72 overflow-y-auto p-1 custom-scrollbar">
              {subjects.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                  <BookOpen className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                  <p className="text-xs font-medium">কোনো বিষয় লোড হয়নি</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    উপরের সেকশন থেকে অন্তত একটি টেকনোলজি নির্বাচন করুন।
                  </p>
                </div>
              ) : (
                subjects.map((sub, idx) => {
                  const refData = curriculumRefInfoMap.get(sub.code);
                  const matchedTechNames = refData?.technologies
                    ?.map((code) => techMap.get(code)?.shortName || code)
                    .join(', ');

                  return (
                    <div
                      key={sub.code || idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-200 hover:bg-teal-50/20 transition-all"
                    >
                      {/* Left: SVG Book Icon + Subject Info */}
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700 shrink-0 mt-0.5">
                          <BookOpen className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 leading-tight">
                              {sub.name}
                            </span>
                            <span className="px-1.5 py-0.5 text-[11px] font-mono font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {toBanglaDigits(sub.code)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 flex-wrap">
                            {matchedTechNames && (
                              <span className="px-1.5 py-0.2 rounded bg-teal-50 text-teal-700 font-medium border border-teal-100">
                                {matchedTechNames}
                              </span>
                            )}
                            {refData?.refMarks && (
                              <span className="text-slate-400">
                                সিলেবাস রেফারেন্স: {toBanglaDigits(refData.refMarks)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Exam Marks Input & SVG Delete Button */}
                      <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                          <span className="text-[11px] font-medium text-slate-600">পূর্ণমান:</span>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={sub.fullMarks || formDefaultMarks}
                            onChange={(e) => handleSubjectMarksChange(idx, Number(e.target.value))}
                            required
                            className="w-14 px-1 py-0.5 text-xs text-center font-bold text-teal-800 bg-white rounded border border-slate-200 focus:border-teal-600 outline-hidden"
                          />
                        </div>

                        {/* Premium SVG Delete Button (Current Exam Only) */}
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(sub.code)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="বর্তমান পরীক্ষা থেকে বাদ দিন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center space-x-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={formAllowMeritList}
                onChange={(e) => setFormAllowMeritList(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded"
              />
              <span className="text-xs font-semibold text-slate-700">পাবলিক মেধা তালিকা চালু রাখুন</span>
            </label>

            <label className="flex items-center space-x-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={formStatus === 'PUBLISHED'}
                onChange={(e) => setFormStatus(e.target.checked ? 'PUBLISHED' : 'DRAFT')}
                className="w-4 h-4 text-teal-600 rounded"
              />
              <span className="text-xs font-semibold text-slate-700">তাৎক্ষণিক প্রকাশ করুন</span>
            </label>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={saving || subjects.length === 0}
              className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-sm transition-all shadow-sm active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'সংরক্ষণ করা হচ্ছে...' : 'সংরক্ষণ ও আপডেট করুন'}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Semester Selection Bottom Sheet */}
      <SelectBottomSheet
        isOpen={semesterSheetOpen}
        onClose={() => setSemesterSheetOpen(false)}
        title="সেমিস্টার নির্বাচন করুন"
        subtitle="ডিপ্লোমা ইন ইঞ্জিনিয়ারিং পর্ব"
        options={semesterOptions}
        selectedValue={formSemesterId}
        onSelect={(val) => handleSemesterChange(val as SemesterId)}
      />

      {/* Exam Type Selection Bottom Sheet */}
      <SelectBottomSheet
        isOpen={examTypeSheetOpen}
        onClose={() => setExamTypeSheetOpen(false)}
        title="পরীক্ষার ধরন নির্বাচন"
        subtitle="মডেল টেস্ট, মিড-টার্ম, সেমিস্টার ফাইনাল ইত্যাদি"
        options={examTypeOptions}
        selectedValue={formExamType}
        onSelect={(val) => setFormExamType(val)}
      />

      {/* Modern Date Picker Modal */}
      <ModernDatePicker
        isOpen={examDatePickerOpen}
        onClose={() => setExamDatePickerOpen(false)}
        value={formExamDate}
        onChange={(newDate) => setFormExamDate(newDate)}
        title="পরীক্ষার তারিখ নির্বাচন"
        subtitle="পরীক্ষা অনুষ্ঠিত হওয়ার তারিখ নির্ধারণ করুন"
        minYear={2020}
        maxYear={2035}
      />

      {/* Loading Overlay with 3D Open-Book Animation */}
      <LoadingOverlay
        isVisible={saving || isDeleting || isSeedingCurriculum}
        message={
          isDeleting
            ? 'তথ্য মুছে ফেলা হচ্ছে...'
            : isSeedingCurriculum
            ? 'তথ্য আপডেট করা হচ্ছে...'
            : saving
            ? (editingExam ? 'তথ্য আপডেট করা হচ্ছে...' : 'তথ্য সংরক্ষণ করা হচ্ছে...')
            : 'তথ্য সংরক্ষণ করা হচ্ছে...'
        }
        subtext="ক্লাউড ডাটাবেসে তথ্য রিয়েলটাইম প্রসেস ও হালনাগাদ করা হচ্ছে..."
        minDurationMs={2500}
      />
    </div>
  );
};
