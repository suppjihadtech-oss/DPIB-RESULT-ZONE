import React, { useState } from 'react';
import { 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  AlertCircle, 
  Calendar, 
  X, 
  Save, 
  CheckCircle2 
} from 'lucide-react';
import { db } from '../../services/db';
import { Notice } from '../../types';
import { useToast } from '../../context/ToastContext';

export const NoticeManagement: React.FC = () => {
  const { success, error, info } = useToast();

  const [notices, setNotices] = useState<Notice[]>(() => db.getNotices());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Partial<Notice> | null>(null);

  const handleOpenAdd = () => {
    setEditingNotice({
      title: '',
      category: 'সাধারণ',
      date: new Date().toISOString().split('T')[0],
      content: '',
      isImportant: false,
      published: true
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (notice: Notice) => {
    setEditingNotice({ ...notice });
    setModalOpen(true);
  };

  const handleSaveNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotice) return;

    if (!editingNotice.title?.trim() || !editingNotice.content?.trim()) {
      error('নোটিশের শিরোনাম ও বিবরণ উভয়ই পূরণ করা আবশ্যক!', 'যাচাইকরণ ত্রুটি');
      return;
    }

    try {
      const isNew = !editingNotice.id;
      const saved = db.saveNotice(editingNotice as any);
      setNotices(db.getNotices());
      setModalOpen(false);
      setEditingNotice(null);

      if (isNew) {
        success(`নোটিশ "${saved.title}" সফলভাবে প্রকাশ করা হয়েছে।`, 'নোটিশ প্রকাশিত');
      } else {
        success(`নোটিশ "${saved.title}" সফলভাবে আপডেট হয়েছে।`, 'নোটিশ আপডেট');
      }
    } catch (err: any) {
      error(`সংরক্ষণ করতে ব্যর্থ হয়েছে: ${err.message || 'পুনরায় চেষ্টা করুন'}`, 'ত্রুটি');
    }
  };

  const handleDeleteNotice = (id: string, title: string) => {
    if (window.confirm(`আপনি কি "${title}" নোটিশটি মুছে ফেলতে চান?`)) {
      const deleted = db.deleteNotice(id);
      if (deleted) {
        setNotices(db.getNotices());
        success(`নোটিশটি সফলভাবে মুছে ফেলা হয়েছে।`, 'মুছে ফেলা সম্পন্ন');
      } else {
        error('নোটিশ মুছতে সমস্যা হয়েছে।', 'ত্রুটি');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600" />
            নোটিশ বোর্ড পরিচালনা
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ইনস্টিটিউটের শিক্ষার্থী ও অভিভাবকদের জন্য সাধারণ ও পরীক্ষার নোটিশ প্রকাশ করুন
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          নতুন নোটিশ তৈরি
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {notices.map((notice) => (
          <div
            key={notice.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  notice.category === 'পরীক্ষা'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : notice.category === 'একাডেমিক'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {notice.category}
                </span>
                {notice.isImportant && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    জরুরি নোটিশ
                  </span>
                )}
                <span className="text-xs text-slate-400 font-mono">
                  {notice.date}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(notice)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                  title="সম্পাদনা"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteNotice(notice.id, notice.title)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="font-bold text-slate-800 text-base">
              {notice.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {notice.content}
            </p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && editingNotice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveNotice}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-slate-800 text-base">
                {editingNotice.id ? 'নোটিশ সম্পাদনা' : 'নতুন নোটিশ প্রকাশ'}
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
                <label className="font-bold text-slate-700 block mb-1">নোটিশের শিরোনাম *</label>
                <input
                  type="text"
                  required
                  value={editingNotice.title || ''}
                  onChange={(e) => setEditingNotice({ ...editingNotice, title: e.target.value })}
                  placeholder="যেমন: ৪র্থ পর্ব সমাপনী পরীক্ষার ফলাফল প্রকাশ সংক্রান্ত"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ক্যাটাগরি</label>
                  <select
                    value={editingNotice.category || 'সাধারণ'}
                    onChange={(e) => setEditingNotice({ ...editingNotice, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500"
                  >
                    <option value="সাধারণ">সাধারণ</option>
                    <option value="পরীক্ষা">পরীক্ষা</option>
                    <option value="একাডেমিক">একাডেমিক</option>
                    <option value="ভর্তি">ভর্তি</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">তারিখ</label>
                  <input
                    type="date"
                    value={editingNotice.date || ''}
                    onChange={(e) => setEditingNotice({ ...editingNotice, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">নোটিশের বিস্তারিত বিবরণ *</label>
                <textarea
                  rows={4}
                  required
                  value={editingNotice.content || ''}
                  onChange={(e) => setEditingNotice({ ...editingNotice, content: e.target.value })}
                  placeholder="নোটিশের বিস্তারিত বার্তা এখানে লিখুন..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editingNotice.isImportant ?? false}
                    onChange={(e) => setEditingNotice({ ...editingNotice, isImportant: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  জরুরি নোটিশ হিসেবে চিহ্নিত করুন
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
