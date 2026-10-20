import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Send,
  Loader2,
  Radio,
  Building,
  Laptop,
  HardHat,
  Zap,
  Cog,
  Anchor,
  Compass,
  Layers,
  ChevronRight,
  RotateCcw,
  Info,
} from 'lucide-react';
import { Department } from '../../types';
import { BottomSheet } from './BottomSheet';
import { SelectBottomSheet, SelectOption } from './SelectBottomSheet';

interface NotificationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubscribed: boolean;
  permission: 'granted' | 'denied' | 'default' | 'unsupported';
  loading: boolean;
  error: string | null;
  departments: Department[];
  onEnable: (preferences?: { preferredDepartment?: string; preferredSemester?: string }) => Promise<{ success: boolean; error?: string }>;
  onDisable: () => Promise<boolean>;
  onTestNotification: () => void;
  onCheckPermission?: () => void;
}

const DEFAULT_DEPARTMENTS_CONFIG: Array<{ id: string; name: string; code: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'COMPUTER', name: 'কম্পিউটার টেকনোলজি', code: 'CMT', icon: Laptop },
  { id: 'CIVIL', name: 'সিভিল টেকনোলজি', code: 'CT', icon: HardHat },
  { id: 'ELECTRICAL', name: 'ইলেকট্রিক্যাল টেকনোলজি', code: 'ET', icon: Zap },
  { id: 'MECHANICAL', name: 'মেকানিক্যাল টেকনোলজি', code: 'MT', icon: Cog },
  { id: 'MARINE', name: 'মেরিন টেকনোলজি', code: 'MT', icon: Anchor },
  { id: 'SURVEYING', name: 'সার্ভেয়িং টেকনোলজি', code: 'ST', icon: Compass },
];

export const NotificationPromptModal: React.FC<NotificationPromptModalProps> = ({
  isOpen,
  onClose,
  isSubscribed,
  permission,
  loading,
  error,
  departments,
  onEnable,
  onDisable,
  onTestNotification,
  onCheckPermission,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>(() => {
    return localStorage.getItem('dpib_notification_dept') || '';
  });
  const [techSheetOpen, setTechSheetOpen] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('dpib_notification_dept');
    if (saved) {
      setSelectedDept(saved);
    }
    if (isOpen && onCheckPermission) {
      onCheckPermission();
    }
  }, [isOpen]);

  const handleToggleEnable = async () => {
    if (selectedDept) {
      localStorage.setItem('dpib_notification_dept', selectedDept);
    } else {
      localStorage.removeItem('dpib_notification_dept');
    }

    await onEnable({
      preferredDepartment: selectedDept || undefined,
    });
  };

  const handleTestClick = () => {
    onTestNotification();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  // Build department options with icons
  const activeDepartmentsList = departments.length > 0 ? departments : DEFAULT_DEPARTMENTS_CONFIG;

  const techOptions: SelectOption[] = [
    {
      value: '',
      label: 'সকল টেকনোলজি',
      sublabel: 'সকল ডিপার্টমেন্টের ফলাফল ও নোটিশ অ্যালার্ট',
      badge: 'ALL',
      icon: Layers,
    },
    ...activeDepartmentsList.map((dept) => {
      const match = DEFAULT_DEPARTMENTS_CONFIG.find((d) => d.id.toUpperCase() === dept.id.toUpperCase());
      return {
        value: dept.id,
        label: dept.name,
        sublabel: `${dept.name}-এর সকল ফলাফল ও নোটিশ`,
        badge: dept.code || 'DPIB',
        icon: match ? match.icon : Building,
      };
    }),
  ];

  const currentSelectedOption = techOptions.find((opt) => opt.value === selectedDept) || techOptions[0];
  const CurrentIcon = currentSelectedOption.icon || Layers;

  // Determine active presentation state
  const isPermissionGranted = permission === 'granted' || isSubscribed;
  const isPermissionDenied = permission === 'denied';
  const isUnsupported = permission === 'unsupported';

  return (
    <>
      <BottomSheet
        isOpen={isOpen && !techSheetOpen}
        onClose={onClose}
        title="তাৎক্ষণিক নোটিফিকেশন সেবা"
      >
        <div className="p-6 space-y-5 font-bengali">
          {/* Top Status Header */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                isPermissionGranted
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isPermissionDenied
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-teal-50 text-teal-700 border-teal-100'
              }`}
            >
              {isPermissionGranted ? (
                <BellRing className="w-6 h-6" />
              ) : isPermissionDenied ? (
                <BellOff className="w-6 h-6" />
              ) : (
                <Bell className="w-6 h-6" />
              )}
            </div>

            <div>
              {/* Context Tag */}
              {isPermissionGranted ? (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold mb-1 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>অনুমতি সক্রিয় ও চালু</span>
                </div>
              ) : isPermissionDenied ? (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 text-[11px] font-bold mb-1 border border-rose-200">
                  <ShieldAlert className="w-3 h-3 text-rose-600" />
                  <span>ব্রাউজারে ব্লকড (BLOCKED)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[11px] font-bold mb-1 border border-teal-200">
                  <Radio className="w-3 h-3 text-teal-600" />
                  <span>ওয়েব পুশ নোটিফিকেশন</span>
                </div>
              )}

              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {isPermissionGranted
                  ? 'নোটিফিকেশন সক্রিয় রয়েছে'
                  : isPermissionDenied
                  ? 'নোটিফিকেশনের অনুমতি বন্ধ রয়েছে'
                  : 'পরীক্ষা ও ফলাফলের নোটিফিকেশন পান'}
              </h3>
            </div>
          </div>

          {/* STATE 1: PERMISSION GRANTED (Previously or newly enabled) */}
          {isPermissionGranted && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-emerald-900">
                  <p className="font-bold">ব্রাউজার পারমিশন অনুমোদিত আছে</p>
                  <p className="mt-1 text-emerald-700 leading-relaxed text-xs">
                    ডিপিআইবি রেজাল্ট জোনের নোটিফিকেশন সার্ভিস এই ডিভাইসে সক্রিয়। নতুন সেমিস্টার ফলাফল, পরীক্ষার রুটিন ও জরুরি নোটিশ প্রকাশের সাথে সাথে অ্যালার্ট পাবেন।
                  </p>
                </div>
              </div>

              {/* Technology Preference Card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                    <CurrentIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-500 font-semibold block">নির্ধারিত বিভাগ</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block">
                      {currentSelectedOption.label}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTechSheetOpen(true)}
                  className="px-3 py-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 hover:bg-teal-50 rounded-xl transition-all cursor-pointer border border-teal-200 shrink-0"
                >
                  পরিবর্তন
                </button>
              </div>

              {/* Test & Disable Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestClick}
                  disabled={testSent}
                  className="w-full py-3 px-4 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-teal-200"
                >
                  <Send className="w-4 h-4" />
                  <span>{testSent ? 'টেস্ট নোটিফিকেশন পাঠানো হয়েছে!' : 'একটি টেস্ট নোটিফিকেশন পাঠান'}</span>
                </button>

                <button
                  type="button"
                  onClick={onDisable}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <BellOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>নোটিফিকেশন সাময়িকভাবে বন্ধ করুন</span>
                </button>
              </div>
            </div>
          )}

          {/* STATE 2: PERMISSION BLOCKED / DENIED */}
          {isPermissionDenied && (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-rose-900 space-y-2">
                    <p className="font-bold">নোটিফিকেশন ব্রাউজারে ব্লক করা রয়েছে</p>
                    <p className="text-rose-700 text-xs leading-relaxed">
                      আপনার ব্রাউজারের সাইট সেটিংসে ডিপিআইবি রেজাল্ট জোনের জন্য নোটিফিকেশনের অনুমতি বন্ধ (BLOCKED) করা আছে। ফলে স্বয়ংক্রিয় প্রম্পট দেখানো সম্ভব হচ্ছে না।
                    </p>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-rose-200/80 text-xs text-rose-950 space-y-1.5">
                  <p className="font-bold text-[11px] uppercase tracking-wide text-rose-800">
                    কীভাবে অনুমতি চালু করবেন:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700 text-xs pl-1">
                    <li>ব্রাউজারের অ্যাড্রেস বারের বাম পাশে <strong>লক (LOCK)</strong> বা সাইট কন্ট্রোল আইকনে চাপুন।</li>
                    <li><strong>PERMISSIONS</strong> বা <strong>SITE SETTINGS</strong>-এ গিয়ে <strong>NOTIFICATIONS</strong> অপশনটি <strong>ALLOW</strong> করুন।</li>
                    <li>এরপর নিচে "পারমিশন স্ট্যাটাস যাচাই করুন" বোতামে চাপুন অথবা পেজ রিফ্রেশ করুন।</li>
                  </ol>
                </div>
              </div>

              {/* Action Buttons for Blocked state */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (onCheckPermission) onCheckPermission();
                  }}
                  className="w-full sm:flex-1 py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>পারমিশন স্ট্যাটাস যাচাই করুন</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-center"
                >
                  পরে করব
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: DEFAULT / NOT YET REQUESTED */}
          {!isPermissionGranted && !isPermissionDenied && !isUnsupported && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                ডিপিআইবি রেজাল্ট জোনের মাধ্যমে পরীক্ষার ফলাফল, ডিপ্লোমা নোটিশ এবং ক্লাস ও পরীক্ষার আপডেট মুহূর্তেই পান।
              </p>

              {/* Feature Highlights */}
              <div className="space-y-2.5 bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-xs text-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <span>ফলাফল প্রকাশের সাথে সাথে রিয়েলটাইম অ্যালার্ট</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  <span>মোবাইল বা পিসিতে কোনো অ্যাপ ইনস্টল ছাড়াই সরাসরি ব্রাউজারে কাজ করে</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span>সম্পূর্ণ নিরাপদ, বিজ্ঞাপনমুক্ত ও নিজস্ব ডিভাইসে সংরক্ষিত</span>
                </div>
              </div>

              {/* Modern Sliding Bottom Sheet Technology Selector Trigger */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>আপনার টেকনোলজি নির্বাচন করুন (ঐচ্ছিক):</span>
                </label>

                <button
                  type="button"
                  onClick={() => setTechSheetOpen(true)}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                      <CurrentIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate">
                        {currentSelectedOption.label}
                      </span>
                      {currentSelectedOption.badge && (
                        <span className="text-[10px] text-slate-500 font-mono font-semibold">
                          কোড: {currentSelectedOption.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700">
                    <span>নির্বাচন</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </div>

              {error && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons for Default State */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleToggleEnable}
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-teal-700 hover:bg-teal-800 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>অনুমতি চাওয়া হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      <span>নোটিফিকেশন চালু করুন</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
                >
                  পরে করব
                </button>
              </div>
            </div>
          )}

          {/* STATE 4: UNSUPPORTED */}
          {isUnsupported && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold text-sm">এই ব্রাউজারে নোটিফিকেশন সমর্থিত নয়</p>
                  <p className="mt-1 text-xs">
                    আপনার বর্তমান ব্রাউজারে পুশ নোটিফিকেশন ফিচারটি সক্রিয় নয়। আপডেট পেতে অনুগ্রহ করে GOOGLE CHROME, MICROSOFT EDGE বা অন্য কোনো আধুনিক ব্রাউজার ব্যবহার করুন।
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-center"
              >
                বুঝেছি, বন্ধ করুন
              </button>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Modern Sliding Bottom Sheet for Technology Selection */}
      <SelectBottomSheet
        isOpen={techSheetOpen}
        onClose={() => setTechSheetOpen(false)}
        title="টেকনোলজি নির্বাচন করুন"
        subtitle="আপনার ডিপার্টমেন্ট অনুযায়ী নোটিফিকেশন পেতে টেকনোলজি সিলেক্ট করুন"
        options={techOptions}
        selectedValue={selectedDept}
        onSelect={(val) => {
          setSelectedDept(val);
          localStorage.setItem('dpib_notification_dept', val);
          setTechSheetOpen(false);
        }}
      />
    </>
  );
};
