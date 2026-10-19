import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  X, 
  Save,
  Globe,
  Lock
} from 'lucide-react';
import { db } from '../../services/db';
import { Exam, Semester } from '../../types';
import { useToast } from '../../context/ToastContext';

export const ExamManagement: React.FC = () => {
  const { success, error, info } = useToast();

  const [exams, setExams] = useState<Exam[]>(() => db.getExams());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Partial<Exam> | null>(null);

  const handleOpenAdd = () => {
    setEditingExam({
      title: '',
      semester: '১ম পর্ব',
      session: '2023-2024',
      academicYear: '২০২৪',
      examDate: new Date().toISOString().split('T')[0],
      isPublished: true,
      description: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (exam: Exam) => {
    setEditingExam({ ...exam });
    setModalOpen(true);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam) return;

    if (!editingExam.title?.trim()) {
      error('পরীক্ষার শিরোনাম অবশ্যই প্রদান করতে হবে!', 'যাচাইকরণ ত্রুটি');
      return;
    }

    try {
      const isNew = !editingExam.id;
      const saved = db.saveExam(editingExam as any);
      setExams(db.getExams());
      setModalOpen(false);
      setEditingExam(null);

      if (isNew) {
        success(`নতুন পরীক্ষা "${saved.title}" সফলভাবে তৈরি হয়েছে।`, 'পরীক্ষা তৈরি সফল');
      } else {
        success(`পরীক্ষা "${saved.title}"-এর তথ্য সফলভাবে আপডেট করা হয়েছে।`, 'আপডেট সফল');
      }
    } catch (err: any) {
      error(`সংরক্ষণ করতে ব্যর্থ হয়েছে: ${err.message || 'পুনরায় চেষ্টা করুন'}`, 'ত্রুটি');
    }
  };

  const handleTogglePublish = (id: string, title: string) => {
    const newStatus = db.toggleExamPublish(id);
    setExams(db.getExams());
    if (newStatus) {
      success(`"${title}"-এর ফলাফল সর্বসাধারণের জন্য প্রকাশ করা হয়েছে।`, 'ফলাফল উন্মুক্ত');
    } else {
      info(`"${title}"-এর ফলাফল অপ্রকাশিত (Draft) রাখা হয়েছে।`, 'ফলাফল স্থগিত');
    }
  };

  const handleDeleteExam = (id: string, title: string) => {
    if (window.confirm(`আপনি কি নিশ্চিত যে "${title}" পরীক্ষা ও সংশ্লিষ্ট রেকর্ড মুছে ফেলতে চান?`)) {
      const deleted = db.deleteExam(id);
      if (deleted) {
        setExams(db.getExams());
        success(`পরীক্ষা "${title}" সফলভাবে মুছে ফেলা হয়েছে।`, 'মুছে ফেলা সম্পন্ন');
      } else {
        error('পরীক্ষা মুছতে সমস্যা হয়েছে।', 'ত্রুটি');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            পরীক্ষা পরিচালনা
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            সেমিস্টার ও পর্বভিত্তিক পরীক্ষা তৈরি, ফলাফল প্রকাশের স্ট্যাটাস নিয়ন্ত্রণ করুন
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          নতুন পরীক্ষা যোগ করুন
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {exam.semester} • সেশন {exam.session}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  exam.isPublished 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {exam.isPublished ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {exam.isPublished ? 'প্রকাশিত' : 'অপ্রকাশিত'}
                </span>
              </div>

              <h3 className="font-bold text-slate-800 text-base leading-snug">
                {exam.title}
              </h3>

              {exam.description && (
                <p className="text-xs text-slate-500 line-clamp-2">
                  {exam.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  {exam.examDate}
                </span>
                <span>শিক্ষাবর্ষ: {exam.academicYear}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleTogglePublish(exam.id, exam.title)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  exam.isPublished
                    ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {exam.isPublished ? 'স্থগিত করুন' : 'ফলাফল প্রকাশ করুন'}
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(exam)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                  title="সম্পাদনা করুন"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteExam(exam.id, exam.title)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && editingExam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveExam}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-slate-800 text-base">
                {editingExam.id ? 'পরীক্ষা তথ্য সম্পাদনা' : 'নতুন পরীক্ষা তৈরি'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">পরীক্ষার পুরো নাম *</label>
                <input
                  type="text"
                  required
                  value={editingExam.title || ''}
                  onChange={(e) => setEditingExam({ ...editingExam, title: e.target.value })}
                  placeholder="যেমন: ডিপ্লোমা ইন ইঞ্জিনিয়ারিং ৪র্থ পর্ব সমাপনী পরীক্ষা ২০২৩-২৪"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">পর্ব / সেমিস্টার *</label>
                  <select
                    value={editingExam.semester || '১ম পর্ব'}
                    onChange={(e) => setEditingExam({ ...editingExam, semester: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500"
                  >
                    <option value="১ম পর্ব">১ম পর্ব</option>
                    <option value="২য় পর্ব">২য় পর্ব</option>
                    <option value="৩য় পর্ব">৩য় পর্ব</option>
                    <option value="৪র্থ পর্ব">৪র্থ পর্ব</option>
                    <option value="৫ম পর্ব">৫ম পর্ব</option>
                    <option value="৬ষ্ঠ পর্ব">৬ষ্ঠ পর্ব</option>
                    <option value="৭ম পর্ব">৭ম পর্ব</option>
                    <option value="৮ম পর্ব">৮ম পর্ব</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">সেশন</label>
                  <input
                    type="text"
                    value={editingExam.session || '2023-2024'}
                    onChange={(e) => setEditingExam({ ...editingExam, session: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">পরীক্ষার তারিখ</label>
                  <input
                    type="date"
                    value={editingExam.examDate || ''}
                    onChange={(e) => setEditingExam({ ...editingExam, examDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">শিক্ষাবর্ষ</label>
                  <input
                    type="text"
                    value={editingExam.academicYear || '২০২৪'}
                    onChange={(e) => setEditingExam({ ...editingExam, academicYear: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">বিবরণ (ঐচ্ছিক)</label>
                <textarea
                  rows={2}
                  value={editingExam.description || ''}
                  onChange={(e) => setEditingExam({ ...editingExam, description: e.target.value })}
                  placeholder="পরীক্ষা সংক্রান্ত বিশেষ নির্দেশনা বা বিবরণ"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="examPub"
                  checked={editingExam.isPublished ?? true}
                  onChange={(e) => setEditingExam({ ...editingExam, isPublished: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="examPub" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  তৈরি করার সাথে সাথে পাবলিক পোর্টালে ফলাফল অনুসন্ধান সক্রিয় থাকবে
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
