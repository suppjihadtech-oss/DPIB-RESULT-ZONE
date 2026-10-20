import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Search,
  BookOpen,
  CheckCircle2,
  Plus,
  Minus,
  Check,
  GraduationCap,
  Sparkles,
  SlidersHorizontal,
  Info,
  Layers,
} from 'lucide-react';
import { CurriculumSubject, ExamSubject } from '../../types';
import { toBanglaDigits, toEnglishDigits } from '../../utils/bangla';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  availableSubjects: CurriculumSubject[];
  selectedSubjects: ExamSubject[];
  onApplySelection: (subjects: ExamSubject[]) => void;
  technologyNames: string[];
  semesterName: string;
  defaultExamFullMarks?: number;
}

interface StagedItem {
  name: string;
  fullMarks: number;
}

export const CurriculumSubjectBottomSheet: React.FC<Props> = ({
  isOpen,
  onClose,
  availableSubjects,
  selectedSubjects,
  onApplySelection,
  technologyNames,
  semesterName,
  defaultExamFullMarks = 45,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  // Local state for subjects being configured in the sheet
  const [stagedSubjects, setStagedSubjects] = useState<Map<string, StagedItem>>(() => {
    const map = new Map<string, StagedItem>();
    selectedSubjects.forEach((s) => {
      map.set(s.code, { name: s.name, fullMarks: s.fullMarks });
    });
    return map;
  });

  // Keep stagedSubjects in sync whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      const map = new Map<string, StagedItem>();
      selectedSubjects.forEach((s) => {
        map.set(s.code, { name: s.name, fullMarks: s.fullMarks });
      });
      setStagedSubjects(map);
      setSearchQuery('');
    }
  }, [isOpen, selectedSubjects]);

  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return availableSubjects;
    const q = searchQuery.toLowerCase().trim();
    const qDigits = toEnglishDigits(q);
    return availableSubjects.filter((sub) => {
      const codeMatch = sub.subjectCode.toLowerCase().includes(q) || sub.subjectCode.includes(qDigits);
      const nameMatch = sub.subjectName.toLowerCase().includes(q);
      const techMatch = sub.technology.toLowerCase().includes(q);
      return codeMatch || nameMatch || techMatch;
    });
  }, [availableSubjects, searchQuery]);

  const handleToggleSubject = (sub: CurriculumSubject) => {
    setStagedSubjects((prev: Map<string, StagedItem>) => {
      const next = new Map<string, StagedItem>(prev);
      if (next.has(sub.subjectCode)) {
        next.delete(sub.subjectCode);
      } else {
        next.set(sub.subjectCode, {
          name: sub.subjectName,
          fullMarks: defaultExamFullMarks,
        });
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setStagedSubjects((prev: Map<string, StagedItem>) => {
      const next = new Map<string, StagedItem>(prev);
      filteredSubjects.forEach((sub) => {
        if (!next.has(sub.subjectCode)) {
          next.set(sub.subjectCode, {
            name: sub.subjectName,
            fullMarks: defaultExamFullMarks,
          });
        }
      });
      return next;
    });
  };

  const handleDeselectAll = () => {
    setStagedSubjects(new Map<string, StagedItem>());
  };

  const handleUpdateMarks = (code: string, marks: number) => {
    setStagedSubjects((prev: Map<string, StagedItem>) => {
      const next = new Map<string, StagedItem>(prev);
      const existing = next.get(code);
      if (existing) {
        next.set(code, {
          name: existing.name,
          fullMarks: Math.max(1, marks),
        });
      }
      return next;
    });
  };

  const handleApply = () => {
    const result: ExamSubject[] = [];
    stagedSubjects.forEach((val, code) => {
      result.push({
        code,
        name: val.name,
        fullMarks: val.fullMarks,
      });
    });
    onApplySelection(result);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Bottom Sheet Modal Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 flex flex-col max-h-[90vh] sm:max-h-[85vh] border border-slate-100 overflow-hidden"
          >
            {/* Top Sheet Drag Handle on mobile */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700 shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                    কারিকুলাম বিষয় নির্বাচন
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                      {toBanglaDigits(availableSubjects.length)} টি বিষয়
                    </span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
                      {semesterName || 'সেমিস্টার'}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {technologyNames.length > 0 ? technologyNames.join(', ') : 'সব টেকনোলজি'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
                title="বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-header info banner on Curriculum Reference */}
            <div className="bg-amber-50/80 border-b border-amber-100/80 px-6 py-2 flex items-center justify-between text-xs text-amber-800">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  সিলেবাসের মোট নম্বর শুধুমাত্র রেফারেন্স। আপনি পরীক্ষার জন্য পূর্ণমান নির্ধারণ করতে পারেন।
                </span>
              </div>
            </div>

            {/* Search & Bulk Selection Bar */}
            <div className="p-4 border-b border-slate-100 bg-white space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="বিষয়ের নাম বা কোড দিয়ে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium transition-colors border border-teal-200/50"
                  >
                    সব নির্বাচন করুন
                  </button>
                  {stagedSubjects.size > 0 && (
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors"
                    >
                      মুছে ফেলুন
                    </button>
                  )}
                </div>

                <div className="font-semibold text-slate-600">
                  নির্বাচিত: <span className="text-teal-700 font-bold">{toBanglaDigits(stagedSubjects.size)}</span> টি
                </div>
              </div>
            </div>

            {/* Subjects List Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[48vh] custom-scrollbar">
              {filteredSubjects.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                  <p className="text-sm font-medium">কোনো কারিকুলাম বিষয় পাওয়া যায়নি</p>
                  <p className="text-xs text-slate-400 mt-1">অনুসন্ধানের শব্দ পরিবর্তন করে চেষ্টা করুন</p>
                </div>
              ) : (
                filteredSubjects.map((sub) => {
                  const isSelected = stagedSubjects.has(sub.subjectCode);
                  const currentData = stagedSubjects.get(sub.subjectCode);

                  return (
                    <motion.div
                      key={sub.id || sub.subjectCode}
                      layout
                      className={`group p-3.5 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-teal-50/40 border-teal-300 shadow-xs'
                          : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Subject Info */}
                      <div
                        onClick={() => handleToggleSubject(sub)}
                        className="flex items-start gap-3 flex-1 cursor-pointer select-none"
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isSelected
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                          }`}
                        >
                          <BookOpen className="w-4.5 h-4.5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              className={`text-sm font-bold truncate ${
                                isSelected ? 'text-teal-950' : 'text-slate-800'
                              }`}
                            >
                              {sub.subjectName}
                            </h4>
                            <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded bg-slate-100 text-slate-700 border border-slate-200/60">
                              {toBanglaDigits(sub.subjectCode)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                              {sub.technology}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] text-slate-400">
                              সিলেবাস রেফারেন্স পূর্ণমান: {toBanglaDigits(sub.curriculumFullMarks)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right controls: Marks input & Select button */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {isSelected && (
                          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-teal-200 shadow-xs">
                            <span className="text-[11px] font-medium text-slate-500">পরীক্ষার পূর্ণমান:</span>
                            <input
                              type="number"
                              min="1"
                              max="500"
                              value={currentData?.fullMarks || defaultExamFullMarks}
                              onChange={(e) =>
                                handleUpdateMarks(sub.subjectCode, parseInt(e.target.value) || 0)
                              }
                              className="w-14 px-1.5 py-0.5 text-xs text-center font-bold text-teal-800 bg-slate-50 rounded border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                            />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleSubject(sub)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                            isSelected
                              ? 'bg-teal-600 text-white shadow-xs hover:bg-teal-700'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              নির্বাচিত
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              যোগ করুন
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Bottom Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                মোট বিষয়:{' '}
                <span className="font-bold text-slate-800">{toBanglaDigits(stagedSubjects.size)} টি</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  পরীক্ষায় যুক্ত করুন ({toBanglaDigits(stagedSubjects.size)})
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
