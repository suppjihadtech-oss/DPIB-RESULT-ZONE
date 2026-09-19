import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Edit2,
  Trash2,
  Pin,
  Eye,
  EyeOff,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Tag,
  Clock,
  Layers,
} from 'lucide-react';
import { Notice, NoticeCategory } from '../../types';
import { getNotices, saveNotice, deleteNotice, updateNoticeStatus } from '../../services/db';
import { toBanglaDigits, formatBanglaDate } from '../../utils/bangla';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { LoadingOverlay } from '../common/LoadingOverlay';
import { BottomSheet } from '../common/BottomSheet';
import { SelectBottomSheet, SelectTrigger, SelectOption } from '../common/SelectBottomSheet';

interface NoticeManagementProps {
  onRefreshStats?: () => void;
}

export const NoticeManagement: React.FC<NoticeManagementProps> = ({ onRefreshStats }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [deleteConfirmNotice, setDeleteConfirmNotice] = useState<Notice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // BottomSheet Select Visibility
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [statusSheetOpen, setStatusSheetOpen] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<NoticeCategory>('EXAM');
  const [formContent, setFormContent] = useState('');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formStatus, setFormStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const data = await getNotices();
      setNotices(data);
    } catch (err) {
      console.error('Fetch notices error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleOpenCreate = () => {
    setEditingNotice(null);
    setFormTitle('');
    setFormCategory('EXAM');
    setFormContent('');
    setFormIsPinned(false);
    setFormStatus('PUBLISHED');
    setFormError(null);
    setSheetOpen(true);
  };

  const handleOpenEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormTitle(notice.title);
    setFormCategory(notice.category);
    setFormContent(notice.content);
    setFormIsPinned(notice.isPinned || false);
    setFormStatus(notice.status);
    setFormError(null);
    setSheetOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanTitle = formTitle.trim();
    const cleanContent = formContent.trim();
    if (!cleanTitle || !cleanContent) {
      setFormError('অনুগ্রহ করে নোটিশের শিরোনাম ও বিস্তারিত বিবরণ পূরণ করুন।');
      return;
    }

    setSaving(true);
    try {
      await saveNotice(
        {
          title: cleanTitle,
          category: formCategory,
          content: cleanContent,
          isPinned: formIsPinned,
          status: formStatus,
          publishedDate: editingNotice ? editingNotice.publishedDate : new Date().toISOString().split('T')[0],
          createdAt: editingNotice ? editingNotice.createdAt : Date.now(),
          updatedAt: Date.now(),
        },
        editingNotice ? editingNotice.id : undefined
      );

      setSheetOpen(false);
      await fetchNotices();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      setFormError(err.message || 'সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (notice: Notice) => {
    const nextStatus = notice.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await updateNoticeStatus(notice.id, nextStatus);
      await fetchNotices();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const categoryOptions: SelectOption[] = [
    { value: 'EXAM', label: 'পরীক্ষা সংক্রান্ত (EXAM)', badge: 'EXAM', icon: Tag },
    { value: 'RESULT', label: 'ফলাফল সংক্রান্ত (RESULT)', badge: 'RESULT', icon: Tag },
    { value: 'URGENT', label: 'জরুরি বিজ্ঞপ্তি (URGENT)', badge: 'URGENT', icon: AlertCircle },
    { value: 'GENERAL', label: 'সাধারণ নোটিশ (GENERAL)', badge: 'GENERAL', icon: Bell },
  ];

  const statusOptions: SelectOption[] = [
    { value: 'PUBLISHED', label: 'তাৎক্ষণিক প্রকাশ (PUBLISHED)', sublabel: 'পাবলিক পোর্টালে দৃশ্যমান হবে', badge: 'LIVE', icon: CheckCircle2 },
    { value: 'DRAFT', label: 'খসড়া (DRAFT)', sublabel: 'অ্যাডমিন প্যানেলে সংরক্ষিত থাকবে', badge: 'DRAFT', icon: Clock },
  ];

  const getCategoryBadge = (cat: NoticeCategory) => {
    switch (cat) {
      case 'EXAM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">পরীক্ষা সংক্রান্ত</span>;
      case 'RESULT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">ফলাফল সংক্রান্ত</span>;
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">জরুরি বিজ্ঞপ্তি</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60">সাধারণ</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            নোটিশ বোর্ড ব্যবস্থাপনা
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            মোট নোটিশ: {toBanglaDigits(notices.length)}টি (জরুরি ও সাধারণ ঘোষণা প্রকাশ করুন)
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন নোটিশ লিখুন</span>
        </button>
      </div>

      {/* Notice Cards Grid */}
      {loading ? (
        <LoadingSpinner message="নোটিশ ডেটাবেস লোড হচ্ছে..." />
      ) : notices.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="কোনো নোটিশ পাওয়া যায়নি"
          description="পরীক্ষা বা ফলাফল সংক্রান্ত নোটিশ প্রকাশ করতে উপরের বাটনে ক্লিক করুন।"
          actionText="প্রথম নোটিশ প্রকাশ করুন"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={`bg-white/90 backdrop-blur-md rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                notice.isPinned ? 'border-amber-300 ring-1 ring-amber-200/50 bg-amber-50/20' : 'border-slate-200/90'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    {getCategoryBadge(notice.category)}
                    {notice.isPinned && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <Pin className="w-2.5 h-2.5" />
                        <span>পিন্ড</span>
                      </span>
                    )}
                  </div>

                  <span
                    className={`flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      notice.status === 'PUBLISHED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                        : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                    }`}
                  >
                    {notice.status === 'PUBLISHED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    <span>{notice.status === 'PUBLISHED' ? 'প্রকাশিত' : 'খসড়া'}</span>
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-2 line-clamp-2">{notice.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">{notice.content}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 font-outfit">
                  {formatBanglaDate(notice.createdAt)}
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleTogglePublish(notice)}
                    className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title={notice.status === 'PUBLISHED' ? 'অপ্রকাশিত করুন' : 'প্রকাশ করুন'}
                  >
                    {notice.status === 'PUBLISHED' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(notice)}
                    className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="সম্পাদনা"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmNotice(notice)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="মুছুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Bottom Sheet */}
      <BottomSheet
        isOpen={Boolean(deleteConfirmNotice)}
        onClose={() => {
          if (!isDeleting) {
            setDeleteConfirmNotice(null);
            setDeleteError(null);
          }
        }}
        title="নোটিশ মুছে ফেলার নিশ্চিতকরণ"
        subtitle="এই পদক্ষেপটি বাতিল করা যাবে না"
      >
        <div className="space-y-4 pb-4">
          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-950">আপনি কি এই নোটিশটি মুছে ফেলতে চান?</h4>
              <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                "<span className="font-bold">{deleteConfirmNotice?.title}</span>" নোটিশটি সিস্টেম থেকে স্থায়ীভাবে মুছে যাবে।
              </p>
            </div>
          </div>

          {deleteError && (
            <div className="p-3 bg-rose-100 border border-rose-300 rounded-xl text-xs font-bold text-rose-800">
              {deleteError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => {
                setDeleteConfirmNotice(null);
                setDeleteError(null);
              }}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={async () => {
                if (!deleteConfirmNotice) return;
                setIsDeleting(true);
                setDeleteError(null);
                try {
                  await deleteNotice(deleteConfirmNotice.id);
                  setDeleteConfirmNotice(null);
                  await fetchNotices();
                  if (onRefreshStats) onRefreshStats();
                } catch (err: any) {
                  console.error('Delete notice error:', err);
                  setDeleteError('নোটিশটি মুছে ফেলা যায়নি। আবার চেষ্টা করুন।');
                } finally {
                  setIsDeleting(false);
                }
              }}
              className="py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isDeleting ? 'মুছে ফেলা হচ্ছে...' : 'মুছে ফেলুন'}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Create / Edit Notice Bottom Sheet */}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editingNotice ? 'নোটিশ সম্পাদনা' : 'নতুন নোটিশ তৈরি'}
        subtitle="শিক্ষার্থীদের জন্য বিজ্ঞপ্তি বা ঘোষণা প্রকাশ করুন"
        maxHeight="max-h-[95vh]"
      >
        <form onSubmit={handleSave} className="space-y-4 pb-6">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
              {formError}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              নোটিশ শিরোনাম <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="নোটিশের শিরোনাম লিখুন"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectTrigger
              label="ক্যাটাগরি"
              value={formCategory}
              displayValue={categoryOptions.find(c => c.value === formCategory)?.label}
              onClick={() => setCategorySheetOpen(true)}
              icon={Tag}
            />

            <SelectTrigger
              label="অবস্থা"
              value={formStatus}
              displayValue={formStatus === 'PUBLISHED' ? 'তাৎক্ষণিক প্রকাশ (PUBLISHED)' : 'খসড়া (DRAFT)'}
              onClick={() => setStatusSheetOpen(true)}
              icon={CheckCircle2}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              বিস্তারিত বিবরণ <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={5}
              placeholder="নোটিশের সম্পূর্ণ বিবরণ এখানে লিখুন..."
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>

          <label className="flex items-center space-x-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={formIsPinned}
              onChange={(e) => setFormIsPinned(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-xs font-semibold text-slate-700">নোটিশটি শীর্ষে পিন করে রাখুন</span>
          </label>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'সংরক্ষণ করা হচ্ছে...' : 'নোটিশ সংরক্ষণ ও প্রকাশ করুন'}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Category Bottom Sheet */}
      <SelectBottomSheet
        isOpen={categorySheetOpen}
        onClose={() => setCategorySheetOpen(false)}
        title="নোটিশের ক্যাটাগরি নির্বাচন"
        subtitle="নোটিশের বিষয়বস্তু অনুযায়ী ধরণ নির্ধারণ করুন"
        options={categoryOptions}
        selectedValue={formCategory}
        onSelect={(val) => setFormCategory(val as NoticeCategory)}
      />

      {/* Status Bottom Sheet */}
      <SelectBottomSheet
        isOpen={statusSheetOpen}
        onClose={() => setStatusSheetOpen(false)}
        title="নোটিশের অবস্থা নির্বাচন"
        subtitle="এখনই প্রকাশ করবেন নাকি খসড়া রাখবেন"
        options={statusOptions}
        selectedValue={formStatus}
        onSelect={(val) => setFormStatus(val as any)}
      />

      {/* Notice Save / Delete Loading Overlay */}
      <LoadingOverlay
        isVisible={saving || isDeleting}
        message={
          isDeleting
            ? 'তথ্য মুছে ফেলা হচ্ছে...'
            : saving
            ? (editingNotice ? 'তথ্য আপডেট করা হচ্ছে...' : 'তথ্য সংরক্ষণ করা হচ্ছে...')
            : 'তথ্য সংরক্ষণ করা হচ্ছে...'
        }
        subtext="ক্লাউড ডাটাবেসে তথ্য আপডেট হচ্ছে..."
      />
    </div>
  );
};
