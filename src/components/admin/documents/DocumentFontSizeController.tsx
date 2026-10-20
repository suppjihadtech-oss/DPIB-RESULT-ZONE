import React, { useState, useEffect } from 'react';
import {
  Type,
  Heading,
  FileText,
  Calendar,
  Building,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sliders,
  Maximize2,
} from 'lucide-react';
import { toBanglaDigits } from '../../../utils/bangla';

export interface DocumentFontSettings {
  masterScale: number; // 80 to 160 percent (default: 100)
  headerSize: number;  // 16 to 32 px (default: 22)
  titleSize: number;   // 14 to 28 px (default: 18)
  bodySize: number;    // 10 to 22 px (default: 13)
  dateSize: number;    // 9 to 18 px (default: 11)
}

export const DEFAULT_DOC_FONT_SETTINGS: DocumentFontSettings = {
  masterScale: 100,
  headerSize: 22,
  titleSize: 18,
  bodySize: 13,
  dateSize: 11,
};

export const getStoredFontSettings = (docKey: string): DocumentFontSettings => {
  if (typeof window === 'undefined') return DEFAULT_DOC_FONT_SETTINGS;
  try {
    const raw = localStorage.getItem(`dpib_doc_fonts_${docKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_DOC_FONT_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to load document font settings:', err);
  }
  return DEFAULT_DOC_FONT_SETTINGS;
};

export const saveStoredFontSettings = (docKey: string, settings: DocumentFontSettings) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`dpib_doc_fonts_${docKey}`, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save document font settings:', err);
  }
};

interface FontControlRowProps {
  label: string;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  min: number;
  max: number;
  unit?: string;
  isPercentage?: boolean;
  onChange: (val: number) => void;
}

const FontControlRow: React.FC<FontControlRowProps> = ({
  label,
  sublabel,
  icon: Icon,
  value,
  min,
  max,
  unit = 'px',
  isPercentage = false,
  onChange,
}) => {
  const handleDecrease = () => {
    onChange(Math.max(min, value - (isPercentage ? 5 : 1)));
  };

  const handleIncrease = () => {
    onChange(Math.min(max, value + (isPercentage ? 5 : 1)));
  };

  return (
    <div className="p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/70 hover:border-violet-300 transition-all shadow-2xs space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-violet-100/80 text-violet-700 shrink-0">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-800 block truncate leading-tight">
              {label}
            </span>
            {sublabel && (
              <span className="text-[10px] text-slate-400 block truncate">
                {sublabel}
              </span>
            )}
          </div>
        </div>

        {/* Current Size Badge */}
        <span className="px-2.5 py-0.5 rounded-lg bg-violet-50 text-violet-800 border border-violet-200/70 font-mono font-bold text-xs shrink-0 shadow-2xs">
          {toBanglaDigits(value)} {unit}
        </span>
      </div>

      {/* Slider and A- / A+ Stepper Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleDecrease}
          disabled={value <= min}
          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-violet-100/70 disabled:opacity-40 text-slate-700 hover:text-violet-900 font-black text-xs transition-all active:scale-95 flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-not-allowed border border-slate-200/60"
          title={`${label} ছোট করুন`}
        >
          A−
        </button>

        <div className="flex-1 relative flex items-center">
          <input
            type="range"
            min={min}
            max={max}
            step={isPercentage ? 5 : 1}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-violet-700 h-2 bg-slate-200/90 rounded-lg cursor-pointer transition-all"
          />
        </div>

        <button
          type="button"
          onClick={handleIncrease}
          disabled={value >= max}
          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-violet-100/70 disabled:opacity-40 text-slate-700 hover:text-violet-900 font-black text-xs transition-all active:scale-95 flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-not-allowed border border-slate-200/60"
          title={`${label} বড় করুন`}
        >
          A+
        </button>
      </div>
    </div>
  );
};

interface DocumentFontSizeControllerProps {
  docKey: string;
  settings: DocumentFontSettings;
  onChange: (newSettings: DocumentFontSettings) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const DocumentFontSizeController: React.FC<DocumentFontSizeControllerProps> = ({
  docKey,
  settings,
  onChange,
  isOpen,
  onToggle,
}) => {
  const [showDetailed, setShowDetailed] = useState(false);
  const [saveNotice, setSaveNotice] = useState(false);

  const updateSetting = <K extends keyof DocumentFontSettings>(
    key: K,
    val: DocumentFontSettings[K]
  ) => {
    const next = { ...settings, [key]: val };
    onChange(next);
    saveStoredFontSettings(docKey, next);
    triggerSaveNotice();
  };

  const triggerSaveNotice = () => {
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 2000);
  };

  const handleReset = () => {
    onChange(DEFAULT_DOC_FONT_SETTINGS);
    saveStoredFontSettings(docKey, DEFAULT_DOC_FONT_SETTINGS);
    triggerSaveNotice();
  };

  const handleApplyPreset = (scale: number, bodySize: number) => {
    const next: DocumentFontSettings = {
      ...settings,
      masterScale: scale,
      bodySize,
    };
    onChange(next);
    saveStoredFontSettings(docKey, next);
    triggerSaveNotice();
  };

  return (
    <div className="no-print font-bengali">
      {/* Glassmorphic Expanded Panel */}
      {isOpen && (
        <div className="mb-4 p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-xl shadow-slate-200/40 dark:shadow-none animate-fadeIn transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-600 text-white shadow-xs">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>ডকুমেন্ট ফন্ট সাইজ নিয়ন্ত্রণ</span>
                  {saveNotice && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-fadeIn">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>সংরক্ষিত</span>
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ডকুমেন্টের নাম, বিবরণ ও তারিখের লেখার আকার লাইভ পরিবর্তন ও সংরক্ষণ করুন
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="ডিফল্ট সাইজে ফিরিয়ে নিন"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>রিসেট</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDetailed((prev) => !prev)}
                className="px-3 py-1.5 rounded-xl bg-violet-100/80 hover:bg-violet-200/80 text-violet-900 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>{showDetailed ? 'সংক্ষিপ্ত ভিউ' : 'আলাদা নিয়ন্ত্রণ'}</span>
                {showDetailed ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={onToggle}
                className="px-2.5 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                title="প্যানেল বন্ধ করুন"
              >
                বন্ধ
              </button>
            </div>
          </div>

          {/* Quick Presets Row */}
          <div className="pt-3 pb-3 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 mr-1">কুইক প্রিসেট:</span>
            <button
              type="button"
              onClick={() => handleApplyPreset(100, 13)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                settings.masterScale === 100 && settings.bodySize === 13
                  ? 'bg-violet-700 text-white border-violet-700 shadow-2xs font-bold'
                  : 'bg-white/80 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              স্বাভাবিক (১০০%)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset(115, 14)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                settings.masterScale === 115
                  ? 'bg-violet-700 text-white border-violet-700 shadow-2xs font-bold'
                  : 'bg-white/80 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              সহজে পাঠযোগ্য (+১৫%)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset(130, 16)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                settings.masterScale === 130
                  ? 'bg-violet-700 text-white border-violet-700 shadow-2xs font-bold'
                  : 'bg-white/80 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              বড় ফন্ট (+৩০%)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset(145, 18)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                settings.masterScale === 145
                  ? 'bg-violet-700 text-white border-violet-700 shadow-2xs font-bold'
                  : 'bg-white/80 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              সর্বোচ্চ বড় (+৪৫%)
            </button>
          </div>

          {/* Master Font Size Scale Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <FontControlRow
              label="সার্বিক ফন্ট স্কেল (Master Scale)"
              sublabel="পুরো ডকুমেন্টের সমস্ত লেখার আনুপাতিক আকার"
              icon={Maximize2}
              value={settings.masterScale}
              min={80}
              max={160}
              unit="%"
              isPercentage={true}
              onChange={(val) => updateSetting('masterScale', val)}
            />

            <FontControlRow
              label="বিবরণ ও মূল লেখা (Body & Table)"
              sublabel="টেবিল সেল, প্যারাগ্রাফ ও বিবরণীর ফন্ট"
              icon={FileText}
              value={settings.bodySize}
              min={10}
              max={22}
              unit="px"
              onChange={(val) => updateSetting('bodySize', val)}
            />
          </div>

          {/* Detailed Individual Controls */}
          {showDetailed && (
            <div className="mt-3 pt-3 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fadeIn">
              <FontControlRow
                label="ডকুমেন্টের নাম ও শিরোনাম"
                sublabel="ডকুমেন্ট হেডিং ও মূল টাইটেল"
                icon={Heading}
                value={settings.titleSize}
                min={14}
                max={30}
                unit="px"
                onChange={(val) => updateSetting('titleSize', val)}
              />

              <FontControlRow
                label="তারিখ ও মেটাডাটা"
                sublabel="তারিখ, বিষয় কোড, সময় ও সাবলেবেল"
                icon={Calendar}
                value={settings.dateSize}
                min={9}
                max={18}
                unit="px"
                onChange={(val) => updateSetting('dateSize', val)}
              />

              <FontControlRow
                label="প্রতিষ্ঠান প্রধান ও হেডার"
                sublabel="ইনস্টিটিউট নাম ও প্রধান শিরোনাম"
                icon={Building}
                value={settings.headerSize}
                min={16}
                max={32}
                unit="px"
                onChange={(val) => updateSetting('headerSize', val)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
