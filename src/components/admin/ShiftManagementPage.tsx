import React, { useState, useEffect } from 'react';
import {
  Clock,
  Sunrise,
  Sunset,
  Sun,
  Moon,
  Plus,
  Edit3,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Sliders,
  Check,
  X,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { ShiftConfig } from '../../types';
import {
  getShiftConfigs,
  saveShiftConfigs,
  DEFAULT_SHIFTS,
} from '../../services/db';
import { toBanglaDigits } from '../../utils/bangla';
import {
  calculateShiftDuration,
  formatBanglaTimeWithPeriod,
  isCurrentlyActiveShift,
} from '../../utils/timeUtils';
import { SmartTimePicker } from './SmartTimePicker';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { LoadingOverlay } from '../common/LoadingOverlay';

interface ShiftManagementPageProps {
  onBackToSettings?: () => void;
}

export const ShiftManagementPage: React.FC<ShiftManagementPageProps> = ({
  onBackToSettings,
}) => {
  const [shifts, setShifts] = useState<ShiftConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State (Add / Edit)
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [shiftName, setShiftName] = useState('');
  const [shiftBadge, setShiftBadge] = useState('সকাল শিফট');
  const [startTime, setStartTime] = useState('08:00 AM');
  const [endTime, setEndTime] = useState('01:00 PM');
  const [shiftDescription, setShiftDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<ShiftConfig | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Realtime clock ticker for active shift calculation
  const [currentMinuteTicker, setCurrentMinuteTicker] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMinuteTicker(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const data = await getShiftConfigs();
      setShifts(data && data.length > 0 ? data : DEFAULT_SHIFTS);
    } catch (err) {
      console.error('Failed to load shifts:', err);
      setShifts(DEFAULT_SHIFTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Real-time time range validation & duration calculation
  const durationInfo = calculateShiftDuration(startTime, endTime);

  const resetForm = () => {
    setEditingShiftId(null);
    setShiftName('');
    setShiftBadge('সকাল শিফট');
    setStartTime('08:00 AM');
    setEndTime('01:00 PM');
    setShiftDescription('');
    setFormError(null);
  };

  const handleStartEdit = (shift: ShiftConfig) => {
    setEditingShiftId(shift.id);
    setShiftName(shift.name);
    setShiftBadge(shift.badge || shift.name);
    setStartTime(shift.startTime);
    setEndTime(shift.endTime);
    setShiftDescription(shift.description || '');
    setFormError(null);

    // Smooth scroll to form on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = shiftName.trim();
    if (!cleanName) {
      setFormError('অনুগ্রহ করে শিফটের নাম প্রদান করুন।');
      return;
    }

    if (!durationInfo.valid) {
      setFormError(durationInfo.error || 'শুরুর ও শেষের সময়ের সীমা সঠিক নয়।');
      return;
    }

    setSaving(true);
    try {
      let updatedList: ShiftConfig[];

      if (editingShiftId) {
        // Update existing shift
        updatedList = shifts.map((s) => {
          if (s.id === editingShiftId) {
            return {
              ...s,
              name: cleanName,
              badge: shiftBadge.trim() || cleanName,
              startTime: startTime.trim(),
              endTime: endTime.trim(),
              description:
                shiftDescription.trim() ||
                `${cleanName} (${startTime.trim()} - ${endTime.trim()})`,
            };
          }
          return s;
        });
        showToast('শিফটের তথ্য সফলভাবে আপডেট করা হয়েছে।');
      } else {
        // Add new shift
        const newId = `shift_${Date.now()}`;
        const newShift: ShiftConfig = {
          id: newId,
          code: newId,
          name: cleanName,
          badge: shiftBadge.trim() || cleanName,
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          description:
            shiftDescription.trim() ||
            `${cleanName} (${startTime.trim()} - ${endTime.trim()})`,
        };
        updatedList = [...shifts, newShift];
        showToast('নতুন শিফট সফলভাবে সিস্টেমে যুক্ত করা হয়েছে।');
      }

      await saveShiftConfigs(updatedList);
      setShifts(updatedList);
      resetForm();
    } catch (err: any) {
      console.error('Error saving shift configs:', err);
      setFormError(`শিফট সংরক্ষণে ত্রুটি: ${err.message || 'অনুগ্রহ করে পুনরায় চেষ্টা করুন।'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (shifts.length <= 1) {
      setDeleteError('সিস্টেমে কমপক্ষে একটি শিফট থাকা আবশ্যক। এটি মুছে ফেলা সম্ভব নয়।');
      return;
    }

    setSaving(true);
    setDeleteError(null);
    try {
      const updatedList = shifts.filter((s) => s.id !== deleteTarget.id);
      await saveShiftConfigs(updatedList);
      setShifts(updatedList);
      if (editingShiftId === deleteTarget.id) {
        resetForm();
      }
      setDeleteTarget(null);
      showToast('শিফট সফলভাবে মুছে ফেলা হয়েছে।');
    } catch (err: any) {
      console.error('Error deleting shift:', err);
      setDeleteError(`মুছে ফেলার সময় সমস্যা: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreDefaults = async () => {
    if (!confirm('আপনি কি পূর্বনির্ধারিত ১ম ও ২য় শিফট রিস্টোর করতে চান?')) {
      return;
    }

    setSaving(true);
    try {
      await saveShiftConfigs(DEFAULT_SHIFTS);
      setShifts(DEFAULT_SHIFTS);
      resetForm();
      showToast('ডিফল্ট শিফটসমূহ সফলভাবে রিস্টোর করা হয়েছে।');
    } catch (err: any) {
      alert(`রিস্টোর ব্যর্থ হয়েছে: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <LoadingSpinner size="lg" message="শিফট কনফিগারেশন ও সময়সূচী লোড হচ্ছে..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-bengali">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-teal-500/50 flex items-center space-x-3 animate-in fade-in slide-in-from-top-4">
          <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <p className="text-xs sm:text-sm font-bold">{toastMessage}</p>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            {onBackToSettings && (
              <button
                type="button"
                onClick={onBackToSettings}
                className="p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="সেটিংস পেজে ফিরে যান"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200/60 text-teal-800 text-[10px] font-black uppercase tracking-wider font-outfit">
              ACADEMIC TIMETABLE & SHIFTS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-teal-700" />
            <span>শিফট ও সময়সূচী ব্যবস্থাপনা</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            ডিপ্লোমা ইন ইঞ্জিনিয়ারিং শিক্ষাক্রমের সকল একাডেমিক শিফট, স্মার্ট সময় নির্বাচন ও ফায়ারস্টোর ক্লাউড সিঙ্ক।
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchShifts}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>রিফ্রেশ</span>
          </button>
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            title="পূর্বনির্ধারিত শিফট রিস্টোর করুন"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>ডিফল্ট শিফট</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Add/Edit Form & Shifts List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN: ADD / EDIT SHIFT FORM ================= */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
                {editingShiftId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingShiftId ? 'শিফট সম্পাদনা করুন' : 'নতুন শিফট যুক্ত করুন'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {editingShiftId
                    ? 'পূর্বের শিফটের নাম ও সময়সীমা পরিবর্তন করে সেভ করুন'
                    : 'নাম ও স্মার্ট টাইম পিকারের মাধ্যমে নতুন শিফট তৈরি করুন'}
                </p>
              </div>
            </div>

            {editingShiftId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-900 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                নতুন যোগ করুন
              </button>
            )}
          </div>

          <form onSubmit={handleSaveShift} className="space-y-5">
            {/* Shift Name & Badge Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  শিফটের নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="শিফটের নাম লিখুন"
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:border-teal-700 focus:bg-white transition-all"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {['১ম শিফট', '২য় শিফট', 'সকাল শিফট', 'সান্ধ্য শিফট'].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => {
                        setShiftName(quick);
                        if (!shiftBadge) setShiftBadge(quick);
                      }}
                      className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded cursor-pointer"
                    >
                      {quick}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  শিফট ট্যাগ / ব্যাজ
                </label>
                <input
                  type="text"
                  placeholder="শিফটের ব্যাজ বা সংক্ষিপ্ত নাম লিখুন"
                  value={shiftBadge}
                  onChange={(e) => setShiftBadge(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:border-teal-700 focus:bg-white transition-all"
                />
                <p className="text-[10px] text-slate-400">
                  রুটিন ও ফিল্টারে এই ট্যাগটি প্রদর্শিত হবে
                </p>
              </div>
            </div>

            {/* Smart Time Pickers: Start Time & End Time */}
            <div className="space-y-4 pt-2">
              {/* Start Time Smart Picker */}
              <SmartTimePicker
                id="smart-start-time"
                label="শুরুর সময় (START TIME)"
                sublabel="শিফট ক্লাসের প্রারম্ভিক সময়"
                value={startTime}
                onChange={(newVal) => setStartTime(newVal)}
                type="start"
              />

              {/* End Time Smart Picker */}
              <SmartTimePicker
                id="smart-end-time"
                label="শেষের সময় (END TIME)"
                sublabel="শিফট ক্লাসের সমাপ্তি সময়"
                value={endTime}
                onChange={(newVal) => setEndTime(newVal)}
                type="end"
              />
            </div>

            {/* Live Duration Calculation & Validation Banner */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                durationInfo.valid
                  ? 'bg-teal-50/50 border-teal-200/80 text-teal-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900 ring-2 ring-rose-100'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      durationInfo.valid
                        ? 'bg-teal-700 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {durationInfo.valid ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold block uppercase tracking-wide opacity-80">
                      {durationInfo.valid ? 'সময়সীমা ও মোট ডিউরেশন' : 'সময়সীমা ত্রুটি'}
                    </span>
                    <span className="text-xs sm:text-sm font-black font-mono">
                      {durationInfo.valid
                        ? `মোট সময়কাল: ${durationInfo.banglaDuration}`
                        : durationInfo.error}
                    </span>
                  </div>
                </div>

                {durationInfo.valid && (
                  <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-900 text-[11px] font-bold font-mono">
                    {toBanglaDigits(durationInfo.hours)}h {toBanglaDigits(durationInfo.minutes)}m
                  </span>
                )}
              </div>
            </div>

            {/* Description or Remarks */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                সংক্ষিপ্ত বিবরণ বা মন্তব্য (ঐচ্ছিক)
              </label>
              <input
                type="text"
                placeholder="শিফটের বিবরণ বা মন্তব্য লিখুন"
                value={shiftDescription}
                onChange={(e) => setShiftDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-teal-700 focus:bg-white transition-all"
              />
            </div>

            {/* Form Error Alert */}
            {formError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || !durationInfo.valid}
                className="flex-1 py-3 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 active:bg-teal-900 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{editingShiftId ? 'পরিবর্তন সংরক্ষণ করুন' : 'নতুন শিফট সংরক্ষণ করুন'}</span>
              </button>

              {editingShiftId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ================= RIGHT COLUMN: CURRENT SHIFTS LIST ================= */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-teal-700" />
              <h2 className="text-base font-bold text-slate-900">
                সক্রিয় শিফটসমূহ ({toBanglaDigits(shifts.length)}টি)
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              ক্লাউড ফায়ারস্টোর রিয়েলটাইম
            </span>
          </div>

          <div className="space-y-3.5">
            {shifts.map((shift, idx) => {
              const duration = calculateShiftDuration(shift.startTime, shift.endTime);
              const isActiveNow = isCurrentlyActiveShift(shift.startTime, shift.endTime);
              const isBeingEdited = editingShiftId === shift.id;

              return (
                <div
                  key={shift.id || idx}
                  className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-200 relative overflow-hidden ${
                    isBeingEdited
                      ? 'border-teal-600 ring-2 ring-teal-100 shadow-md bg-teal-50/10'
                      : 'border-slate-200/90 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  {/* Top Bar: Serial & Badge */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                      <span className="w-7 h-7 rounded-xl bg-teal-700 text-white font-bold text-xs flex items-center justify-center font-mono shadow-xs">
                        {toBanglaDigits(idx + 1)}
                      </span>
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                          {shift.name}
                        </h3>
                        {shift.badge && (
                          <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60 inline-block mt-0.5">
                            {shift.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Active Time Indicator & Actions */}
                    <div className="flex items-center space-x-1.5">
                      {isActiveNow && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black flex items-center space-x-1.5 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>বর্তমানে চলমান</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleStartEdit(shift)}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          isBeingEdited
                            ? 'bg-teal-700 text-white shadow-xs'
                            : 'text-slate-500 hover:text-teal-700 hover:bg-slate-100'
                        }`}
                        title="সম্পাদনা করুন"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {shifts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(shift)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                          title="শিফট মুছুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Time Range Visual Card */}
                  <div className="mt-3.5 bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
                    <div className="grid grid-cols-2 gap-3 items-center">
                      {/* Start Time Display */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                          <Sunrise className="w-3 h-3 text-amber-500" />
                          <span>শুরুর সময়</span>
                        </span>
                        <p className="text-sm sm:text-base font-black font-mono text-slate-900">
                          {toBanglaDigits(shift.startTime)}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {formatBanglaTimeWithPeriod(shift.startTime)}
                        </p>
                      </div>

                      {/* End Time Display */}
                      <div className="space-y-0.5 border-l border-slate-200 pl-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                          <Sunset className="w-3 h-3 text-indigo-500" />
                          <span>শেষের সময়</span>
                        </span>
                        <p className="text-sm sm:text-base font-black font-mono text-slate-900">
                          {toBanglaDigits(shift.endTime)}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {formatBanglaTimeWithPeriod(shift.endTime)}
                        </p>
                      </div>
                    </div>

                    {/* Duration Pill Footer */}
                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                      <span className="flex items-center space-x-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>মোট সময়কাল:</span>
                      </span>
                      <span className="font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200/80 font-mono">
                        {duration.banglaDuration}
                      </span>
                    </div>
                  </div>

                  {/* Description if present */}
                  {shift.description && (
                    <p className="text-xs text-slate-500 mt-3 italic px-1">
                      "{shift.description}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">
                শিফট মুছে ফেলার নিশ্চয়তা
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                আপনি কি নিশ্চিতভাবে <strong className="text-slate-900 font-bold">"{deleteTarget.name}"</strong> শিফটটি সিস্টেম থেকে মুছে ফেলতে চান?
              </p>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={saving}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>হ্যাঁ, মুছে ফেলুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      <LoadingOverlay isVisible={saving} message="শিফট ডেটা ক্লাউড ফায়ারস্টোরে সেভ হচ্ছে..." />
    </div>
  );
};
