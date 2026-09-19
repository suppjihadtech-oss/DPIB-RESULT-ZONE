import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { toBanglaDigits, formatBanglaDate } from '../../utils/bangla';

const BANGLA_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

const BANGLA_DAYS_SHORT = ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র'];

interface ModernDatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  value: string; // ISO format 'YYYY-MM-DD'
  onChange: (dateStr: string) => void;
  title?: string;
  subtitle?: string;
  minYear?: number;
  maxYear?: number;
}

export const ModernDatePicker: React.FC<ModernDatePickerProps> = ({
  isOpen,
  onClose,
  value,
  onChange,
  title = 'তারিখ নির্বাচন করুন',
  subtitle,
  minYear = 1970,
  maxYear = 2035,
}) => {
  // Parse initial date
  const parseDate = (dStr: string) => {
    if (!dStr) return new Date();
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d);
      }
    }
    const dt = new Date(dStr);
    return isNaN(dt.getTime()) ? new Date() : dt;
  };

  const [currentYear, setCurrentYear] = useState<number>(() => parseDate(value).getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => parseDate(value).getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(() => parseDate(value).getDate());
  
  // View mode: 'DAYS' | 'MONTHS' | 'YEARS'
  const [viewMode, setViewMode] = useState<'DAYS' | 'MONTHS' | 'YEARS'>('DAYS');

  useEffect(() => {
    if (isOpen) {
      const d = parseDate(value);
      setCurrentYear(d.getFullYear());
      setCurrentMonth(d.getMonth());
      setSelectedDay(d.getDate());
      setViewMode('DAYS');
    }
  }, [isOpen, value]);

  // Generate days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Starting day of month (Saturday is 0 in BD convention, standard JS has Sunday as 0)
  // Standard JS: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // BD order: 0=Sat (6 in JS), 1=Sun (0 in JS), 2=Mon (1 in JS), 3=Tue (2 in JS), 4=Wed (3 in JS), 5=Thu (4 in JS), 6=Fri (5 in JS)
  const firstDayOfWeekJS = new Date(currentYear, currentMonth, 1).getDay();
  const firstDayOffset = (firstDayOfWeekJS + 1) % 7; // Convert so Saturday is 0

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    const mStr = String(currentMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const result = `${currentYear}-${mStr}-${dStr}`;
    onChange(result);
    onClose();
  };

  const handleSetToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDay(today.getDate());
    const mStr = String(today.getMonth() + 1).padStart(2, '0');
    const dStr = String(today.getDate()).padStart(2, '0');
    onChange(`${today.getFullYear()}-${mStr}-${dStr}`);
    onClose();
  };

  // Generate Year Array
  const yearsList = [];
  for (let y = maxYear; y >= minYear; y--) {
    yearsList.push(y);
  }

  const currentDateFormatted = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle || `নির্বাচিত: ${formatBanglaDate(currentDateFormatted)}`}
      maxHeight="max-h-[90vh]"
    >
      <div className="space-y-4 pb-4 font-bengali">
        {/* Navigation & Mode Switch Header */}
        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'MONTHS' ? 'DAYS' : 'MONTHS')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'MONTHS'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-800 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{BANGLA_MONTHS[currentMonth]}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'YEARS' ? 'DAYS' : 'YEARS')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm font-outfit flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'YEARS'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-800 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{toBanglaDigits(currentYear)}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              title="পূর্ববর্তী মাস"
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              title="পরবর্তী মাস"
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Mode: Month Grid */}
        {viewMode === 'MONTHS' && (
          <div className="grid grid-cols-3 gap-2 py-2">
            {BANGLA_MONTHS.map((mName, idx) => (
              <button
                key={mName}
                type="button"
                onClick={() => {
                  setCurrentMonth(idx);
                  setViewMode('DAYS');
                }}
                className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                  currentMonth === idx
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-teal-50 border-slate-200'
                }`}
              >
                {mName}
              </button>
            ))}
          </div>
        )}

        {/* View Mode: Year Grid */}
        {viewMode === 'YEARS' && (
          <div className="max-h-[45vh] overflow-y-auto grid grid-cols-4 gap-2 pr-1 py-1">
            {yearsList.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => {
                  setCurrentYear(y);
                  setViewMode('DAYS');
                }}
                className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold font-outfit border transition-all cursor-pointer ${
                  currentYear === y
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-teal-50 border-slate-200'
                }`}
              >
                {toBanglaDigits(y)}
              </button>
            ))}
          </div>
        )}

        {/* View Mode: Day Grid */}
        {viewMode === 'DAYS' && (
          <div className="space-y-2">
            {/* Weekday Labels (Sat to Fri) */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] sm:text-xs text-slate-500 py-1">
              {BANGLA_DAYS_SHORT.map((dayName, idx) => (
                <div
                  key={dayName}
                  className={`py-1 ${idx === 6 ? 'text-rose-600' : 'text-slate-600'}`}
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty leading slots */}
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2" />
              ))}

              {/* Day buttons */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected =
                  selectedDay === dayNum &&
                  parseDate(value).getMonth() === currentMonth &&
                  parseDate(value).getFullYear() === currentYear;

                const dayOfWeekJS = new Date(currentYear, currentMonth, dayNum).getDay();
                const isFriday = dayOfWeekJS === 5;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => handleSelectDay(dayNum)}
                    className={`h-10 sm:h-11 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold font-outfit transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20 ring-2 ring-teal-600 font-black'
                        : isFriday
                        ? 'bg-rose-50/70 hover:bg-rose-100 text-rose-700 border border-rose-100'
                        : 'bg-white hover:bg-teal-50/70 text-slate-800 border border-slate-100 hover:border-teal-200'
                    }`}
                  >
                    {toBanglaDigits(dayNum)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSetToday}
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-teal-700" />
            <span>আজকের তারিখ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const mStr = String(currentMonth + 1).padStart(2, '0');
              const dStr = String(selectedDay).padStart(2, '0');
              onChange(`${currentYear}-${mStr}-${dStr}`);
              onClose();
            }}
            className="py-2.5 px-5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-98 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>নিশ্চিত করুন</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

interface ModernDateTriggerProps {
  id?: string;
  label?: string;
  value: string;
  onClick: () => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export const ModernDateTrigger: React.FC<ModernDateTriggerProps> = ({
  id,
  label,
  value,
  onClick,
  required,
  disabled,
  className = '',
  placeholder = 'তারিখ নির্বাচন করুন',
}) => {
  const displayDate = value ? formatBanglaDate(value) : placeholder;

  return (
    <div className={`space-y-1.5 font-bengali ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 active:bg-slate-100 border border-slate-200/90 rounded-xl text-left flex items-center justify-between text-xs sm:text-sm font-medium text-slate-800 transition-all focus:ring-2 focus:ring-teal-700 outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-2xs group"
      >
        <div className="flex items-center gap-2.5 truncate">
          <div className="p-1 rounded-lg bg-teal-50 text-teal-700 group-hover:bg-teal-100 transition-colors">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <span className={`font-bold ${value ? 'text-slate-900' : 'text-slate-400'}`}>
            {displayDate}
          </span>
        </div>
        <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100 group-hover:bg-teal-100 font-outfit">
          {value ? toBanglaDigits(value) : 'তারিখ'}
        </span>
      </button>
    </div>
  );
};
