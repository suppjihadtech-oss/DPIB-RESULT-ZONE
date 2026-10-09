import React, { useState, useEffect } from 'react';
import {
  Clock,
  Check,
  RotateCcw,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { toBanglaDigits } from '../../utils/bangla';

export interface ModernTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  startTime: string; // e.g. "10:00 AM" or "09:00"
  endTime: string;   // e.g. "01:00 PM" or "12:00"
  onSelectTime: (start: string, end: string) => void;
  title?: string;
  subtitle?: string;
  suggestedDurationMinutes?: number; // e.g., 180 for 3 hours exam, 45 for class
}

// Preset times for quick one-tap selection
export interface QuickPreset {
  label: string;
  start: string;
  end: string;
  badge?: string;
  type?: 'morning' | 'noon' | 'afternoon';
}

const DEFAULT_PRESETS: QuickPreset[] = [
  { label: 'সকাল শিফট (১ম পর্ব পরীক্ষা)', start: '10:00 AM', end: '01:00 PM', badge: '৩ ঘণ্টা', type: 'morning' },
  { label: 'সকাল শিফট (সংক্ষিপ্ত পরীক্ষা)', start: '09:00 AM', end: '11:00 AM', badge: '২ ঘণ্টা', type: 'morning' },
  { label: 'দুপুর শিফট (প্রধান পরীক্ষা)', start: '02:00 PM', end: '05:00 PM', badge: '৩ ঘণ্টা', type: 'noon' },
  { label: 'ক্লাস টেস্ট / ল্যাব টেস্ট', start: '10:30 AM', end: '12:00 PM', badge: '১.৫ ঘণ্টা', type: 'morning' },
  { label: '১ম ক্লাস পিরিয়ড', start: '09:00 AM', end: '09:45 AM', badge: '৪৫ মিনিট', type: 'morning' },
  { label: '২য় ক্লাস পিরিয়ড', start: '09:45 AM', end: '10:30 AM', badge: '৪৫ মিনিট', type: 'morning' },
  { label: '৩য় ক্লাস পিরিয়ড', start: '10:30 AM', end: '11:15 AM', badge: '৪৫ মিনিট', type: 'morning' },
  { label: '৪র্থ ক্লাস পিরিয়ড', start: '11:15 AM', end: '12:00 PM', badge: '৪৫ মিনিট', type: 'morning' },
];

const HOURS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

// Convert "10:00 AM" to total minutes from midnight
export const timeStringToMinutes = (timeStr: string): number | null => {
  if (!timeStr) return null;
  const cleaned = timeStr.trim().toUpperCase();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const ampm = match[3];

  if (ampm) {
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
  }
  return hour * 60 + minute;
};

// Convert minutes to "HH:MM AM/PM"
export const minutesToTimeString = (minutes: number): string => {
  let m = minutes % (24 * 60);
  if (m < 0) m += 24 * 60;
  let hour = Math.floor(m / 60);
  const min = m % 60;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  let displayHour = hour % 12;
  if (displayHour === 0) displayHour = 12;
  return `${String(displayHour).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ampm}`;
};

// Parse a string like "10:00 AM" into components
const parseTimeComponents = (timeStr: string, fallbackHour = '10', fallbackMin = '00', fallbackAmPm = 'AM') => {
  if (!timeStr) return { hour: fallbackHour, minute: fallbackMin, ampm: fallbackAmPm };
  const cleaned = timeStr.trim().toUpperCase();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!match) return { hour: fallbackHour, minute: fallbackMin, ampm: fallbackAmPm };

  let hour = String(parseInt(match[1], 10)).padStart(2, '0');
  let minute = String(parseInt(match[2], 10)).padStart(2, '0');
  let ampm = match[3] || fallbackAmPm;
  return { hour, minute, ampm };
};

export const ModernTimePicker: React.FC<ModernTimePickerProps> = ({
  isOpen,
  onClose,
  startTime,
  endTime,
  onSelectTime,
  title = 'স্মার্ট সময়সূচি নির্ধারণ',
  subtitle = 'শুরুর সময় এবং শেষের সময় আধুনিক টাইম পিকারের মাধ্যমে সেট করুন',
  suggestedDurationMinutes = 180, // Default 3 hours for exams
}) => {
  const [activeTab, setActiveTab] = useState<'picker' | 'presets'>('picker');
  
  // Start Time state
  const [startHour, setStartHour] = useState('10');
  const [startMin, setStartMin] = useState('00');
  const [startAmPm, setStartAmPm] = useState<'AM' | 'PM'>('AM');

  // End Time state
  const [endHour, setEndHour] = useState('01');
  const [endMin, setEndMin] = useState('00');
  const [endAmPm, setEndAmPm] = useState<'AM' | 'PM'>('PM');

  // Currently focused time target
  const [focusedTarget, setFocusedTarget] = useState<'start' | 'end'>('start');

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      const s = parseTimeComponents(startTime, '10', '00', 'AM');
      setStartHour(s.hour);
      setStartMin(s.minute);
      setStartAmPm(s.ampm as 'AM' | 'PM');

      const e = parseTimeComponents(endTime, '01', '00', 'PM');
      setEndHour(e.hour);
      setEndMin(e.minute);
      setEndAmPm(e.ampm as 'AM' | 'PM');
    }
  }, [isOpen, startTime, endTime]);

  const currentStartTimeStr = `${startHour}:${startMin} ${startAmPm}`;
  const currentEndTimeStr = `${endHour}:${endMin} ${endAmPm}`;

  const startMinutes = timeStringToMinutes(currentStartTimeStr);
  const endMinutes = timeStringToMinutes(currentEndTimeStr);

  // Validation
  const isInvalidSequence = startMinutes !== null && endMinutes !== null && endMinutes <= startMinutes;
  const durationMinutes = (startMinutes !== null && endMinutes !== null && endMinutes > startMinutes)
    ? endMinutes - startMinutes
    : 0;

  const durationHoursFormatted = durationMinutes > 0
    ? `${toBanglaDigits(Math.floor(durationMinutes / 60))} ঘণ্টা ${durationMinutes % 60 > 0 ? `${toBanglaDigits(durationMinutes % 60)} মিনিট` : ''}`
    : '';

  // Smart duration auto-suggest handler
  const handleApplyDuration = (minutesToAdd: number) => {
    if (startMinutes === null) return;
    const newEndMinutes = startMinutes + minutesToAdd;
    const newEndStr = minutesToTimeString(newEndMinutes);
    const e = parseTimeComponents(newEndStr);
    setEndHour(e.hour);
    setEndMin(e.minute);
    setEndAmPm(e.ampm as 'AM' | 'PM');
  };

  const handleSelectPreset = (p: QuickPreset) => {
    onSelectTime(p.start, p.end);
    onClose();
  };

  const handleConfirm = () => {
    if (isInvalidSequence) {
      // Auto adjust end time to suggested duration if invalid
      if (startMinutes !== null) {
        const autoEndStr = minutesToTimeString(startMinutes + suggestedDurationMinutes);
        onSelectTime(currentStartTimeStr, autoEndStr);
        onClose();
        return;
      }
    }
    onSelectTime(currentStartTimeStr, currentEndTimeStr);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxHeight="max-h-[92vh]"
    >
      <div className="space-y-4 pb-4 font-bengali">
        {/* Toggle Mode Tab Bar */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab('picker')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'picker'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>আধুনিক টাইম পিকার</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>প্রস্তুত সময়সূচি (প্রিসেট)</span>
          </button>
        </div>

        {activeTab === 'presets' ? (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            <p className="text-xs font-bold text-slate-500 mb-2">
              দ্রুত ব্যবহারের জন্য নিচের যেকোনো সাধারণ সময়সূচি সিলেক্ট করুন:
            </p>
            {DEFAULT_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="w-full p-3.5 bg-white hover:bg-teal-50/70 border border-slate-200/90 hover:border-teal-300 rounded-2xl text-left transition-all flex items-center justify-between cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shrink-0 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                    {preset.type === 'noon' ? <Sunset className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-900">
                      {preset.label}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">
                      সময়সীমা: {preset.badge}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-slate-100 group-hover:bg-teal-100 text-slate-800 group-hover:text-teal-900 rounded-lg text-xs font-bold font-outfit border border-slate-200 group-hover:border-teal-200">
                    {toBanglaDigits(preset.start)} - {toBanglaDigits(preset.end)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Start vs End Time Display Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Start Time Trigger Card */}
              <button
                type="button"
                onClick={() => setFocusedTarget('start')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  focusedTarget === 'start'
                    ? 'bg-teal-50/90 border-teal-700 ring-2 ring-teal-600/30 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    শুরুর সময় (Start)
                  </span>
                  <Sun className={`w-3.5 h-3.5 ${startAmPm === 'AM' ? 'text-amber-500' : 'text-slate-400'}`} />
                </div>
                <div className="text-base sm:text-lg font-black text-slate-900 font-outfit">
                  {toBanglaDigits(currentStartTimeStr)}
                </div>
                {focusedTarget === 'start' && (
                  <span className="inline-block mt-1 text-[10px] font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-md">
                    সম্পাদনা চলছে
                  </span>
                )}
              </button>

              {/* End Time Trigger Card */}
              <button
                type="button"
                onClick={() => setFocusedTarget('end')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  focusedTarget === 'end'
                    ? 'bg-teal-50/90 border-teal-700 ring-2 ring-teal-600/30 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    শেষের সময় (End)
                  </span>
                  <Sunset className={`w-3.5 h-3.5 ${endAmPm === 'PM' ? 'text-indigo-500' : 'text-slate-400'}`} />
                </div>
                <div className="text-base sm:text-lg font-black text-slate-900 font-outfit">
                  {toBanglaDigits(currentEndTimeStr)}
                </div>
                {focusedTarget === 'end' && (
                  <span className="inline-block mt-1 text-[10px] font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-md">
                    সম্পাদনা চলছে
                  </span>
                )}
              </button>
            </div>

            {/* Validation Warning Alert if End Time <= Start Time */}
            {isInvalidSequence && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-2 text-rose-800 text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-bold">
                    সতর্কতা: শেষের সময় অবশ্যই শুরুর সময়ের পরবর্তী হতে হবে!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyDuration(suggestedDurationMinutes)}
                  className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px] shrink-0 hover:bg-rose-700 cursor-pointer"
                >
                  স্বয়ংক্রিয় ঠিক করুন
                </button>
              </div>
            )}

            {!isInvalidSequence && durationMinutes > 0 && (
              <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-semibold">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>নির্ধারিত সময়সীমা: <strong>{durationHoursFormatted}</strong></span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  সঠিক ক্রম
                </span>
              </div>
            )}

            {/* Smart Duration Suggestion Pills */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                  <span>স্মার্ট সময়সীমা অনুযায়ী শেষের সময় ঠিক করুন:</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { label: '৪৫ মিনিট', mins: 45 },
                  { label: '১ ঘণ্টা', mins: 60 },
                  { label: '১.৫ ঘণ্টা', mins: 90 },
                  { label: '২ ঘণ্টা', mins: 120 },
                  { label: '২.৫ ঘণ্টা', mins: 150 },
                  { label: '৩ ঘণ্টা (পূর্ণাঙ্গ)', mins: 180 },
                  { label: '৩.৫ ঘণ্টা', mins: 210 },
                  { label: '৪ ঘণ্টা', mins: 240 },
                ].map((dur) => (
                  <button
                    key={dur.mins}
                    type="button"
                    onClick={() => handleApplyDuration(dur.mins)}
                    className="px-2.5 py-1.5 bg-white hover:bg-teal-50 hover:text-teal-900 border border-slate-200 hover:border-teal-300 rounded-xl text-xs font-bold text-slate-700 shrink-0 transition-all cursor-pointer shadow-2xs"
                  >
                    + {dur.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Time Picker Controls for Currently Focused Target */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800">
                  {focusedTarget === 'start' ? 'শুরুর সময় পরিবর্তন করুন:' : 'শেষের সময় পরিবর্তন করুন:'}
                </span>
                
                {/* AM / PM Toggle Buttons */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      if (focusedTarget === 'start') setStartAmPm('AM');
                      else setEndAmPm('AM');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      (focusedTarget === 'start' ? startAmPm : endAmPm) === 'AM'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    সকাল (AM)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (focusedTarget === 'start') setStartAmPm('PM');
                      else setEndAmPm('PM');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      (focusedTarget === 'start' ? startAmPm : endAmPm) === 'PM'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    বিকাল (PM)
                  </button>
                </div>
              </div>

              {/* Hour Selection Grid */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  ঘণ্টা নির্বাচন (Hour)
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                  {HOURS.map((h) => {
                    const isSelected = (focusedTarget === 'start' ? startHour : endHour) === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          if (focusedTarget === 'start') setStartHour(h);
                          else setEndHour(h);
                        }}
                        className={`h-9 rounded-xl text-xs font-bold font-outfit border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-700 text-white border-teal-700 shadow-xs font-black'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        {toBanglaDigits(h)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minute Selection Grid */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  মিনিট নির্বাচন (Minute)
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                  {MINUTES.map((m) => {
                    const isSelected = (focusedTarget === 'start' ? startMin : endMin) === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          if (focusedTarget === 'start') setStartMin(m);
                          else setEndMin(m);
                        }}
                        className={`h-9 rounded-xl text-xs font-bold font-outfit border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-700 text-white border-teal-700 shadow-xs font-black'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        :{toBanglaDigits(m)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setStartHour('10');
              setStartMin('00');
              setStartAmPm('AM');
              setEndHour('01');
              setEndMin('00');
              setEndAmPm('PM');
            }}
            className="py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-teal-700" />
            <span>রিসেট</span>
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="py-2.5 px-5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-700/20 transition-all active:scale-98 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>সময় নিশ্চিত করুন</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
