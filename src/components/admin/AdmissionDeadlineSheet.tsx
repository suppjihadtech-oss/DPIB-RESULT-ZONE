import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Hourglass,
  Sliders,
  Check,
  Power,
} from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { AdmissionSettings } from '../../types';
import {
  updateAdmissionSettings,
  getAdmissionDeadlineStatus,
  DEFAULT_ADMISSION_SETTINGS,
} from '../../services/admissionService';
import { toBanglaDigits } from '../../utils/bangla';

interface AdmissionDeadlineSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: AdmissionSettings;
  onSettingsUpdated?: (updated: AdmissionSettings) => void;
}

export const AdmissionDeadlineSheet: React.FC<AdmissionDeadlineSheetProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSettingsUpdated,
}) => {
  // Helpers to format default ISO or input datetime
  const formatInputDateTime = (dateStr?: string, timestamp?: number) => {
    if (dateStr) {
      // If already in YYYY-MM-DDTHH:mm format
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateStr)) {
        return dateStr.substring(0, 16);
      }
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          return d.toISOString().substring(0, 16);
        }
      } catch (e) {}
    }
    if (timestamp) {
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
    }
    return '';
  };

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isOpenToggle, setIsOpenToggle] = useState<boolean>(true);
  const [notice, setNotice] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state whenever sheet opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const defaultStart = formatInputDateTime(
        currentSettings.admissionStartDate,
        currentSettings.admissionStartTimestamp || Date.now()
      ) || new Date(now.getFullYear(), 0, 1, 9, 0).toISOString().substring(0, 16);

      const defaultEnd = formatInputDateTime(
        currentSettings.admissionEndDate,
        currentSettings.admissionEndTimestamp || Date.now() + 30 * 86400000
      ) || new Date(now.getFullYear(), 11, 31, 23, 59).toISOString().substring(0, 16);

      setStartDate(defaultStart);
      setEndDate(defaultEnd);
      setIsOpenToggle(currentSettings.isAdmissionOpen !== false);
      setNotice(currentSettings.deadlineNotice || '');
      setSuccess(false);
      setError(null);
    }
  }, [isOpen, currentSettings]);

  // Quick preset helper
  const handleExtendDays = (days: number) => {
    const base = endDate ? new Date(endDate) : new Date();
    if (isNaN(base.getTime())) return;
    base.setDate(base.getDate() + days);
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const newEnd = `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}T${pad(base.getHours())}:${pad(base.getMinutes())}`;
    setEndDate(newEnd);
    setIsOpenToggle(true);
  };

  const handleSetOpenNow = () => {
    const now = new Date();
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const newStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setStartDate(newStart);
    setIsOpenToggle(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) {
      setError('ভর্তি শুরুর তারিখ ও সময় নির্ধারণ করুন।');
      return;
    }
    if (!endDate) {
      setError('ভর্তি শেষ হওয়ার তারিখ ও সময় নির্ধারণ করুন।');
      return;
    }

    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();

    if (isNaN(startMs) || isNaN(endMs)) {
      setError('তারিখ বা সময়ের ফরম্যাট সঠিক নয়।');
      return;
    }

    if (endMs <= startMs) {
      setError('ভর্তি শেষ হওয়ার তারিখ অবশ্যই শুরু হওয়ার তারিখের পরবর্তী হতে হবে।');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const updatedPayload: Partial<AdmissionSettings> = {
        admissionStartDate: startDate,
        admissionEndDate: endDate,
        admissionStartTimestamp: startMs,
        admissionEndTimestamp: endMs,
        isAdmissionOpen: isOpenToggle,
        deadlineNotice: notice.trim(),
      };

      await updateAdmissionSettings(updatedPayload);

      const merged: AdmissionSettings = {
        ...currentSettings,
        ...updatedPayload,
      };

      if (onSettingsUpdated) {
        onSettingsUpdated(merged);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Failed to update admission deadline:', err);
      setError(err?.message || 'ভর্তি সময়সীমা সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSaving(false);
    }
  };

  // Preview status calculations
  const previewSettings: AdmissionSettings = {
    ...currentSettings,
    admissionStartDate: startDate,
    admissionEndDate: endDate,
    admissionStartTimestamp: startDate ? new Date(startDate).getTime() : undefined,
    admissionEndTimestamp: endDate ? new Date(endDate).getTime() : undefined,
    isAdmissionOpen: isOpenToggle,
    deadlineNotice: notice.trim(),
  };
  const previewInfo = getAdmissionDeadlineStatus(previewSettings);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="ভর্তি আবেদন সময়সীমা ও শিডিউল নির্ধারণ"
      subtitle="ভর্তি শুরু ও শেষের তারিখ এবং লাইভ কাউন্টডাউন পরিচালনা করুন"
      maxHeight="max-h-[92vh]"
    >
      <form onSubmit={handleSave} className="space-y-5 pb-6 font-bengali">
        {/* Live Preview Banner */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-700" />
              <span>লাইভ স্ট্যাটাস প্রিভিউ:</span>
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                previewInfo.status === 'ACTIVE'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : previewInfo.status === 'NOT_STARTED'
                  ? 'bg-sky-100 text-sky-800 border border-sky-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {previewInfo.status === 'ACTIVE'
                ? 'ভর্তি আবেদন চলছে (Active)'
                : previewInfo.status === 'NOT_STARTED'
                ? 'শীঘ্রই শুরু হবে (Upcoming)'
                : 'সময়সীমা শেষ / বন্ধ (Expired)'}
            </span>
          </div>

          <p className="text-xs text-slate-600">
            {previewInfo.status === 'ACTIVE'
              ? `আবেদন শেষ হতে বাকি: ${toBanglaDigits(previewInfo.days)} দিন ${toBanglaDigits(previewInfo.hours)} ঘণ্টা ${toBanglaDigits(previewInfo.minutes)} মিনিট`
              : previewInfo.status === 'NOT_STARTED'
              ? `আবেদন শুরুর বাকি: ${toBanglaDigits(previewInfo.days)} দিন`
              : 'আবেদন বাটন ইউজার প্যানেলে স্বয়ংক্রিয়ভাবে ডিজেবল থাকবে।'}
          </p>
        </div>

        {/* Status Toggle */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-black text-slate-900 block">
              ভর্তি আবেদন কার্যক্রম সক্রিয় রাখুন
            </span>
            <span className="text-[11px] text-slate-500 block">
              সরাসরি ভর্তি উন্মুক্ত রাখতে এটি সক্রিয় রাখুন
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpenToggle(!isOpenToggle)}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              isOpenToggle ? 'bg-teal-700' : 'bg-slate-300'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform shadow-xs ${
                isOpenToggle ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Date-Time Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              ভর্তি শুরুর তারিখ ও সময় <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold font-outfit text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-700 outline-none"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              ভর্তি শেষ হওয়ার তারিখ ও সময় <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold font-outfit text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-700 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 block">
            দ্রুত সময় বৃদ্ধি / প্রিসেট বাটন্স:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleExtendDays(7)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 transition-all cursor-pointer"
            >
              +৭ দিন বৃদ্ধি
            </button>
            <button
              type="button"
              onClick={() => handleExtendDays(15)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 transition-all cursor-pointer"
            >
              +১৫ দিন বৃদ্ধি
            </button>
            <button
              type="button"
              onClick={() => handleExtendDays(30)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 transition-all cursor-pointer"
            >
              +১ মাস বৃদ্ধি
            </button>
            <button
              type="button"
              onClick={handleSetOpenNow}
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-lg border border-teal-200 transition-all cursor-pointer"
            >
              এখনই শুরু করুন
            </button>
          </div>
        </div>

        {/* Optional Custom Notice */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            বিশেষ জরুরি নোটিশ (ঐচ্ছিক)
          </label>
          <input
            type="text"
            value={notice}
            onChange={(e) => setNotice(e.target.value)}
            placeholder="জরুরি বিজ্ঞপ্তি বা বার্তা লিখুন"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-teal-700 outline-none"
          />
        </div>

        {/* Status Messages */}
        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>ভর্তি সময়সীমা ও শিডিউল সফলভাবে Firestore-এ আপডেট হয়েছে!</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            বাতিল
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>সংরক্ষণ হচ্ছে...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>সময়সীমা সংরক্ষণ করুন</span>
              </>
            )}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
