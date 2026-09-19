import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Layers,
  Database,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  KeyRound,
  UserCheck,
  Lock,
  Clock,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { Department, GradingRule, ShiftConfig, SystemSettings } from '../../types';
import {
  getSystemSettings,
  saveSystemSettings,
  seedInitialDemoData,
  DEFAULT_SHIFTS,
  saveShiftConfigs,
} from '../../services/db';
import { getFirebaseStatus } from '../../services/firebase';
import { getActiveAdminUsername, getAdminSecuritySettings } from '../../services/adminAuth';
import { toBanglaDigits } from '../../utils/bangla';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { LoadingOverlay } from '../common/LoadingOverlay';

interface SettingsManagementProps {
  departments: Department[];
  onRefreshSettings: () => void;
  onNavigate?: (section: string) => void;
}

export const SettingsManagement: React.FC<SettingsManagementProps> = ({
  departments,
  onRefreshSettings,
  onNavigate,
}) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [instituteName, setInstituteName] = useState('');
  const [gradingRules, setGradingRules] = useState<GradingRule[]>([]);
  const [deptList, setDeptList] = useState<Department[]>(departments);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');

  // Dynamic Shifts State (Summary)
  const [shifts, setShifts] = useState<ShiftConfig[]>(DEFAULT_SHIFTS);

  // Security Status & Active Admin
  const [activeAdminUser, setActiveAdminUser] = useState('DPIB');
  const [isTwoFactorActive, setIsTwoFactorActive] = useState(false);

  const fbStatus = getFirebaseStatus();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [data, currentAdmin, secConfig] = await Promise.all([
        getSystemSettings(),
        getActiveAdminUsername(),
        getAdminSecuritySettings(),
      ]);
      setSettings(data);
      setInstituteName(data.instituteName);
      setGradingRules(data.gradingRules);
      setDeptList(data.departments);
      setShifts(data.shifts && data.shifts.length > 0 ? data.shifts : DEFAULT_SHIFTS);
      setActiveAdminUser(currentAdmin);
      setIsTwoFactorActive(secConfig.twoFactorEnabled);
    } catch (err) {
      console.error('Settings load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      await saveSystemSettings({
        ...settings,
        instituteName,
        gradingRules,
        departments: deptList,
        updatedAt: Date.now(),
      });
      setSavedSuccess(true);
      onRefreshSettings();
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(`সেটিংস সংরক্ষণে সমস্যা: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddDepartment = () => {
    const name = newDeptName.trim();
    const code = newDeptCode.trim().toUpperCase();
    if (!name || !code) {
      alert('বিভাগের নাম ও কোড উভয়ই প্রদান করুন।');
      return;
    }
    const id = code.toLowerCase();
    if (deptList.some((d) => d.id === id || d.code === code)) {
      alert('এই কোডের একটি বিভাগ ইতিমধ্যেই বিদ্যমান।');
      return;
    }
    setDeptList([...deptList, { id, code, name }]);
    setNewDeptName('');
    setNewDeptCode('');
  };

  const handleRemoveDepartment = (id: string) => {
    if (deptList.length <= 1) {
      alert('কমপক্ষে একটি বিভাগ থাকতে হবে।');
      return;
    }
    setDeptList(deptList.filter((d) => d.id !== id));
  };

  const handleSeedData = async () => {
    if (
      window.confirm(
        'আপনি কি ফায়ারস্টোর ডেটাবেসে নমুনা ডিপ্লোমা শিক্ষার্থী, পরীক্ষা ও ফলাফল ডাটা তৈরি করতে চান? (এটি আপনার বিদ্যমান ডেটার কোনো ক্ষতি করবে না)'
      )
    ) {
      setSeeding(true);
      try {
        const count = await seedInitialDemoData();
        alert(`সফলভাবে ${toBanglaDigits(count)}টি ফলাফল ও নমুনা পরীক্ষা ফায়ারস্টোরে যোগ করা হয়েছে!`);
        fetchSettings();
        onRefreshSettings();
      } catch (err: any) {
        alert(`ডাটা তৈরিতে সমস্যা: ${err.message}`);
      } finally {
        setSeeding(false);
      }
    }
  };

  if (loading) return <LoadingSpinner message="সিস্টেম সেটিংস লোড হচ্ছে..." />;

  return (
    <div className="space-y-8 font-bengali">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            সিস্টেম সেটিংস ও কনফিগারেশন
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ডাইনামিক শিফট সময়সূচী, নিরাপত্তা সেটিংস, বিভাগ ও ডেটাবেস ব্যবস্থাপনা
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 self-start sm:self-auto disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center space-x-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>সেটিংস সফলভাবে হালনাগাদ করা হয়েছে!</span>
        </div>
      )}

      {/* ================= SECURITY ACCESS CONTROL DEDICATED PAGE LINK CARD ================= */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-700/80">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                নিরাপত্তা ও অ্যাক্সেস কন্ট্রোল
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                অ্যাডমিন পাসওয়ার্ড পরিবর্তন এবং Authenticator অ্যাপের মাধ্যমে দুই ধাপের নিরাপত্তা (2FA)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border ${
                isTwoFactorActive
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isTwoFactorActive ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span>{isTwoFactorActive ? 'দ্বি-স্তরীয় সুরক্ষা সক্রিয় (TOTP)' : 'দ্বি-স্তরীয় সুরক্ষা নিষ্ক্রিয়'}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-800/60 p-5 rounded-2xl border border-slate-700/60">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold text-slate-300">
                বর্তমান সক্রিয় ইউজার: <strong className="text-white font-mono">{activeAdminUser}</strong>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              পাসওয়ার্ড পরিবর্তন ও QR কোড দিয়ে 2FA সেটআপের জন্য নিরাপত্তা পেজে প্রবেশ করুন
            </p>
          </div>

          <button
            type="button"
            id="btn-open-security-page"
            onClick={() => onNavigate && onNavigate('security')}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 flex items-center space-x-2 cursor-pointer self-stretch sm:self-auto justify-center font-bengali"
          >
            <Shield className="w-4 h-4" />
            <span>নিরাপত্তা পেজে প্রবেশ করুন</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ================= DYNAMIC SHIFT MANAGEMENT HUB CARD ================= */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  শিফট ও সময়সূচী ব্যবস্থাপনা
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200/60 text-teal-800 text-[10px] font-black uppercase font-outfit">
                  DYNAMIC SHIFTS
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                স্মার্ট টাইম পিকার, ডিউরেশন ক্যালকুলেশন ও সম্পূর্ণ আলাদা শিফট ব্যবস্থাপনা পেজ।
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate?.('shifts')}
            className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center space-x-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>শিফট যুক্ত ও পরিচালনা করুন</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Shifts Preview Badges */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
            <span>বর্তমানে কনফিগারকৃত শিফটসমূহ ({toBanglaDigits(shifts.length)}টি):</span>
            <button
              type="button"
              onClick={() => onNavigate?.('shifts')}
              className="text-teal-700 hover:underline flex items-center space-x-1 text-xs"
            >
              <span>বিস্তারিত দেখুন ও এডিট করুন</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {shifts.map((shift, idx) => (
              <div
                key={shift.id || idx}
                onClick={() => onNavigate?.('shifts')}
                className="p-4 bg-slate-50/80 hover:bg-teal-50/40 border border-slate-200 hover:border-teal-300 rounded-2xl transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-teal-700 text-white font-bold text-xs flex items-center justify-center font-mono shadow-xs">
                      {toBanglaDigits(idx + 1)}
                    </span>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-teal-900">
                      {shift.name}
                    </span>
                  </div>
                  {shift.badge && (
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                      {shift.badge}
                    </span>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono">
                    {toBanglaDigits(shift.startTime)} - {toBanglaDigits(shift.endTime)}
                  </span>
                  <span className="text-[11px] font-bold text-teal-700 group-hover:translate-x-0.5 transition-transform flex items-center">
                    ম্যানেজ <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cloud DB Status & Seed Generator */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-base mb-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <span>ফায়ারবেস ফায়ারস্টোর ক্লাউড ডেটাবেস</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            অ্যাপ্লিকেশনের সকল শিক্ষার্থী, পরীক্ষা, ফলাফল এবং নোটিশ ডেটা সরাসরি গুগল ক্লাউড ফায়ারস্টোরে রিয়েলটাইম সংরক্ষিত হচ্ছে।
          </p>
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">PROJECT ID:</span>
              <span className="font-mono font-bold text-slate-900">{fbStatus.projectId}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">STATUS:</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                ONLINE & ACTIVE
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 text-left">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>দ্রুত পরীক্ষার ডেটা প্রস্তুতকারক</span>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            যদি আপনার ডাটাবেস সম্পূর্ণ নতুন বা খালি থাকে, আপনি এক ক্লিকে ১ম থেকে ৮ম সেমিস্টার এবং মডেল টেস্টের ডেমো ফলাফল ও নোটিশ ফায়ারস্টোরে যোগ করতে পারেন।
          </p>
          <button
            onClick={handleSeedData}
            disabled={seeding}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
            <span>{seeding ? 'ডেটা তৈরি হচ্ছে...' : 'ফায়ারস্টোরে প্রাথমিক নমুনা ডেটা যোগ করুন'}</span>
          </button>
        </div>
      </div>

      {/* Institute Info */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">ইনস্টিটিউট তথ্য</h3>
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 uppercase">ইনস্টিটিউটের পুরো নাম</label>
          <input
            type="text"
            value={instituteName}
            onChange={(e) => setInstituteName(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-teal-700"
          />
        </div>
      </div>

      {/* Departments Manager */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">বিভাগ / টেকনোলজি তালিকা</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {deptList.map((dept) => (
            <div
              key={dept.id}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200"
            >
              <div>
                <span className="text-xs font-bold text-slate-900 block">{dept.name}</span>
                <span className="text-[11px] font-mono text-slate-500 font-bold uppercase">{dept.code}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveDepartment(dept.id)}
                className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Dept Row */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="নতুন বিভাগের নাম লিখুন"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-teal-700"
          />
          <input
            type="text"
            placeholder="বিভাগীয় কোড লিখুন"
            value={newDeptCode}
            onChange={(e) => setNewDeptCode(e.target.value)}
            className="w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold font-mono outline-none uppercase focus:border-teal-700"
          />
          <button
            type="button"
            onClick={handleAddDepartment}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shrink-0 cursor-pointer"
          >
            বিভাগ যোগ করুন
          </button>
        </div>
      </div>

      {/* Settings / Seed Loading Overlay */}
      <LoadingOverlay
        isVisible={saving || seeding}
        message={seeding ? 'ডেমো ডেটাবেস প্রস্তুত হচ্ছে...' : 'সিস্টেম সেটিংস সংরক্ষণ হচ্ছে...'}
        subtext="ক্লাউড সার্ভারে কনফিগারেশন আপডেট করা হচ্ছে..."
      />
    </div>
  );
};

