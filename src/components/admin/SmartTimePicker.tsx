import React, { useState, useEffect } from 'react';
import {
  Clock,
  Sunrise,
  Sunset,
  Sun,
  Moon,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  parse12HourTime,
  format12HourTime,
  formatBanglaTimeWithPeriod,
  ParsedTime,
} from '../../utils/timeUtils';
import { toBanglaDigits } from '../../utils/bangla';

interface SmartTimePickerProps {
  id?: string;
  label: string;
  sublabel?: string;
  value: string; // e.g. "08:00 AM"
  onChange: (newValue: string) => void;
  type?: 'start' | 'end';
  error?: string;
  disabled?: boolean;
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTE_PRESETS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const QUICK_TIME_PRESETS = {
  start: [
    { label: '০৮:০০ AM', value: '08:00 AM', desc: 'মর্নিং ১ম শিফট' },
    { label: '০৮:৩০ AM', value: '08:30 AM', desc: 'সাধারণ সকাল' },
    { label: '০৯:০০ AM', value: '09:00 AM', desc: 'অফিসিয়াল সময়' },
    { label: '০১:০০ PM', value: '01:00 PM', desc: '২য় শিফট শুরু' },
    { label: '০১:৩০ PM', value: '01:30 PM', desc: 'দুপুর শিফট' },
    { label: '০৫:০০ PM', value: '05:00 PM', desc: 'সান্ধ্য শিফট' },
  ],
  end: [
    { label: '০১:০০ PM', value: '01:00 PM', desc: '১ম শিফট শেষ' },
    { label: '০১:৩০ PM', value: '01:30 PM', desc: 'দুপুর বিরতি' },
    { label: '০২:০০ PM', value: '02:00 PM', desc: 'দুপুর শেষ' },
    { label: '০৫:০০ PM', value: '05:00 PM', desc: 'সাধারণ সমাপ্তি' },
    { label: '০৬:০০ PM', value: '06:00 PM', desc: '২য় শিফট সমাপ্তি' },
    { label: '০৬:৩০ PM', value: '06:30 PM', desc: 'সান্ধ্য সমাপ্তি' },
    { label: '০৯:০০ PM', value: '09:00 PM', desc: 'নাইট শিফট শেষ' },
  ],
};

export const SmartTimePicker: React.FC<SmartTimePickerProps> = ({
  id,
  label,
  sublabel,
  value,
  onChange,
  type = 'start',
  error,
  disabled = false,
}) => {
  const [parsed, setParsed] = useState<ParsedTime>(() => parse12HourTime(value));
  const [showPickerGrid, setShowPickerGrid] = useState(false);

  // Synchronize when value changes externally
  useEffect(() => {
    setParsed(parse12HourTime(value));
  }, [value]);

  const updateTime = (hour: number, minute: number, period: 'AM' | 'PM') => {
    const formatted = format12HourTime(hour, minute, period);
    setParsed({ hour, minute, period });
    onChange(formatted);
  };

  const handleHourChange = (newHour: number) => {
    updateTime(newHour, parsed.minute, parsed.period);
  };

  const handleMinuteChange = (newMinute: number) => {
    updateTime(parsed.hour, newMinute, parsed.period);
  };

  const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
    updateTime(parsed.hour, parsed.minute, newPeriod);
  };

  const stepMinute = (delta: number) => {
    let nextMin = parsed.minute + delta;
    if (nextMin >= 60) nextMin = 0;
    if (nextMin < 0) nextMin = 55;
    updateTime(parsed.hour, nextMin, parsed.period);
  };

  const stepHour = (delta: number) => {
    let nextHour = parsed.hour + delta;
    if (nextHour > 12) nextHour = 1;
    if (nextHour < 1) nextHour = 12;
    updateTime(nextHour, parsed.minute, parsed.period);
  };

  const presets = type === 'start' ? QUICK_TIME_PRESETS.start : QUICK_TIME_PRESETS.end;
  const isStart = type === 'start';
  const themeColor = isStart ? 'teal' : 'sky';

  return (
    <div className="space-y-3" id={id}>
      {/* Header & Label */}
      <div className="flex items-center justify-between">
        <label className="flex items-center space-x-2 text-xs font-bold text-slate-800">
          <span
            className={`w-5 h-5 rounded-md flex items-center justify-center ${
              isStart ? 'bg-teal-50 text-teal-700' : 'bg-sky-50 text-sky-700'
            }`}
          >
            {isStart ? <Sunrise className="w-3.5 h-3.5" /> : <Sunset className="w-3.5 h-3.5" />}
          </span>
          <span className="tracking-tight">{label}</span>
        </label>
        {sublabel && <span className="text-[11px] text-slate-400 font-medium">{sublabel}</span>}
      </div>

      {/* Main Visual Time Display Card */}
      <div
        className={`relative overflow-hidden rounded-2xl border transition-all duration-200 ${
          error
            ? 'border-rose-300 bg-rose-50/40 ring-2 ring-rose-100'
            : isStart
            ? 'border-teal-200 bg-teal-50/30 hover:border-teal-300'
            : 'border-sky-200 bg-sky-50/30 hover:border-sky-300'
        } p-4`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Formatted Display Value */}
          <div className="space-y-1">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900">
                {toBanglaDigits(parsed.hour < 10 ? `0${parsed.hour}` : parsed.hour)}:
                {toBanglaDigits(parsed.minute < 10 ? `0${parsed.minute}` : parsed.minute)}
              </span>
              <span
                className={`px-2 py-0.5 rounded-lg text-xs font-black uppercase font-mono ${
                  parsed.period === 'AM'
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                }`}
              >
                {parsed.period}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-600 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatBanglaTimeWithPeriod(value)}</span>
            </p>
          </div>

          {/* Steppers & AM/PM Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick AM/PM Pill */}
            <div className="flex rounded-xl bg-white p-1 border border-slate-200/80 shadow-2xs">
              <button
                type="button"
                disabled={disabled}
                onClick={() => handlePeriodChange('AM')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                  parsed.period === 'AM'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="সকাল (AM)"
              >
                <Sun className="w-3 h-3" />
                <span>AM</span>
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => handlePeriodChange('PM')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                  parsed.period === 'PM'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="দুপুর/বিকাল/রাত (PM)"
              >
                <Moon className="w-3 h-3" />
                <span>PM</span>
              </button>
            </div>

            {/* Toggle Detailed Grid Button */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => setShowPickerGrid(!showPickerGrid)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors border flex items-center space-x-1.5 cursor-pointer shadow-2xs ${
                showPickerGrid
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{showPickerGrid ? 'সংকোচন' : 'সময় বদলান'}</span>
              {showPickerGrid ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable Interactive Dial / Grid Selector */}
        {showPickerGrid && (
          <div className="mt-4 pt-4 border-t border-slate-200/80 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Hour Selector (01 to 12) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                <span>ঘণ্টা নির্বাচন করুন (HOUR):</span>
                <span className="font-mono text-slate-800">
                  {toBanglaDigits(parsed.hour)} টা
                </span>
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 sm:gap-1.5">
                {HOURS.map((hr) => {
                  const isSelected = parsed.hour === hr;
                  return (
                    <button
                      key={hr}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleHourChange(hr)}
                      className={`h-8 sm:h-9 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? isStart
                            ? 'bg-teal-700 text-white shadow-sm ring-2 ring-teal-200'
                            : 'bg-sky-700 text-white shadow-sm ring-2 ring-sky-200'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {toBanglaDigits(hr < 10 ? `0${hr}` : hr)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minute Selector (00 to 55) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                <span>মিনিট নির্বাচন করুন (MINUTES):</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => stepMinute(-1)}
                    className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                    title="-১ মিনিট"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-slate-800">
                    {toBanglaDigits(parsed.minute < 10 ? `0${parsed.minute}` : parsed.minute)} মিনিট
                  </span>
                  <button
                    type="button"
                    onClick={() => stepMinute(1)}
                    className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                    title="+১ মিনিট"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 sm:gap-1.5">
                {MINUTE_PRESETS.map((min) => {
                  const isSelected = parsed.minute === min;
                  return (
                    <button
                      key={min}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleMinuteChange(min)}
                      className={`h-8 sm:h-9 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? isStart
                            ? 'bg-teal-700 text-white shadow-sm ring-2 ring-teal-200'
                            : 'bg-sky-700 text-white shadow-sm ring-2 ring-sky-200'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      :{toBanglaDigits(min < 10 ? `0${min}` : min)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Close Grid Button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowPickerGrid(false)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                সম্পন্ন করুন
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Presets Chips */}
      <div className="space-y-1.5">
        <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-500">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>দ্রুত সময় প্রিসেট (QUICK PRESETS):</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => {
            const isMatch = value.toUpperCase() === p.value.toUpperCase();
            return (
              <button
                key={p.value}
                type="button"
                disabled={disabled}
                onClick={() => onChange(p.value)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isMatch
                    ? isStart
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-sky-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isMatch && <Check className="w-3 h-3" />}
                <span className="font-mono">{toBanglaDigits(p.label)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs font-bold text-rose-600 animate-in fade-in flex items-center space-x-1">
          <span>• {error}</span>
        </p>
      )}
    </div>
  );
};
