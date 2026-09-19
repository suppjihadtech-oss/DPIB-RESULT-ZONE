import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Sparkles,
  Info,
  CalendarDays,
  Sun,
  Moon,
  Bookmark,
  Bell,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Filter,
  Check,
  ChevronDown,
  X,
  Layers,
  Sparkle,
  BookOpen,
  Award,
} from 'lucide-react';
import { AppEvent } from '../../types';
import { getPublishedEvents, subscribeToPublishedEvents } from '../../services/db';
import { getFullDayInfo, DayInfo } from '../../utils/calendarUtils';
import { toBanglaDigits, formatTime12Hour } from '../../utils/bangla';
import { BottomSheet } from '../common/BottomSheet';

const MONTH_NAMES_EN = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
];

const MONTH_NAMES_BN = [
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

const WEEKDAY_NAMES_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
const WEEKDAY_NAMES_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const SmartCalendarPage: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);

  // BottomSheet States (Month/Year picker & Filter only)
  const [monthYearPickerOpen, setMonthYearPickerOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Realtime subscription for published events from Firestore
  useEffect(() => {
    setLoadingEvents(true);
    const unsubscribe = subscribeToPublishedEvents(
      (realtimeEvents) => {
        setEvents(realtimeEvents);
        setLoadingEvents(false);
      },
      (err) => {
        console.error('Failed to load published events for calendar:', err);
        setLoadingEvents(false);
      }
    );
    return () => {
      unsubscribe();
    };
  }, []);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (selectedCategoryFilter === 'ALL') return events;
    return events.filter((ev) => ev.eventType === selectedCategoryFilter);
  }, [events, selectedCategoryFilter]);

  // Map events by date string YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map = new Map<string, AppEvent[]>();
    filteredEvents.forEach((ev) => {
      const existing = map.get(ev.eventDate) || [];
      existing.push(ev);
      map.set(ev.eventDate, existing);
    });
    return map;
  }, [filteredEvents]);

  // Selected Day Information
  const selectedDayInfo: DayInfo = useMemo(() => {
    return getFullDayInfo(selectedDate);
  }, [selectedDate]);

  // Events on selected date
  const eventsOnSelectedDate = useMemo(() => {
    return eventsByDate.get(selectedDayInfo.dateString) || [];
  }, [eventsByDate, selectedDayInfo.dateString]);

  // Month grid calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      dayInfo: DayInfo;
      events: AppEvent[];
    }> = [];

    // Previous month filler days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1, daysInPrevMonth - i);
      const dInfo = getFullDayInfo(d);
      days.push({
        date: d,
        isCurrentMonth: false,
        dayInfo: dInfo,
        events: eventsByDate.get(dInfo.dateString) || [],
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(currentYear, currentMonth, day);
      const dInfo = getFullDayInfo(d);
      days.push({
        date: d,
        isCurrentMonth: true,
        dayInfo: dInfo,
        events: eventsByDate.get(dInfo.dateString) || [],
      });
    }

    // Next month filler days
    const remainingCells = 42 - days.length;
    if (remainingCells < 7 && remainingCells > 0) {
      for (let i = 1; i <= remainingCells; i++) {
        const d = new Date(currentYear, currentMonth + 1, i);
        const dInfo = getFullDayInfo(d);
        days.push({
          date: d,
          isCurrentMonth: false,
          dayInfo: dInfo,
          events: eventsByDate.get(dInfo.dateString) || [],
        });
      }
    }

    return days;
  }, [currentYear, currentMonth, eventsByDate]);

  // Month Navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(now);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const yearChoices = useMemo(() => {
    const list: number[] = [];
    for (let y = 2024; y <= 2030; y++) {
      list.push(y);
    }
    return list;
  }, []);

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  return (
    <div className="space-y-8 animate-fade-in font-bengali pb-12">
      {/* Top Header Card */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-xs font-bold font-outfit uppercase">
              <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
              <span>ACADEMIC & OBSERVANCE CALENDAR</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              স্মার্ট ক্যালেন্ডার
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              ইংরেজি, বাংলা ও হিজরি সনসহ জাতীয় ও সরকারি ছুটির দিন এবং ইনস্টিটিউট কার্যক্রমের রিয়েলটাইম তথ্যভাণ্ডার।
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setFilterSheetOpen(true)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-colors cursor-pointer border border-slate-200"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>
                ফিল্টার {selectedCategoryFilter !== 'ALL' ? '(সক্রিয়)' : ''}
              </span>
            </button>
            <button
              type="button"
              onClick={handleGoToToday}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>আজকের তারিখে যান</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar Grid & Date Details View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Calendar Box (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
          {/* Navigation Bar: Month/Year Selector via BottomSheet Trigger */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            {/* Previous / Next buttons */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                title="পূর্ববর্তী মাস"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                title="পরবর্তী মাস"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Month & Year BottomSheet Trigger Pill */}
            <button
              type="button"
              onClick={() => setMonthYearPickerOpen(true)}
              className="px-4 py-2 bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-slate-900 transition-all cursor-pointer shadow-2xs group active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                <span className="font-bengali">{MONTH_NAMES_BN[currentMonth]}</span>
                <span className="font-outfit font-black text-blue-700">{currentYear}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-y-0.5" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[11px] font-black uppercase font-outfit">
            {WEEKDAY_NAMES_EN.map((wd, i) => (
              <div
                key={wd}
                className={`py-2 rounded-lg ${
                  i === 5 ? 'text-rose-600 bg-rose-50/50' : 'text-slate-500 bg-slate-50/50'
                }`}
              >
                <span>{WEEKDAY_NAMES_BN[i]}</span>
                <span className="block text-[9px] text-slate-400 font-medium">{wd}</span>
              </div>
            ))}
          </div>

          {/* Days Matrix */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map(({ date, isCurrentMonth, dayInfo, events: dayEvents }, index) => {
              const isSelected = isSameDay(date, selectedDate);
              const isTodayDate = isSameDay(date, today);
              const hasSpecialDay = dayInfo.specialDays.length > 0;
              const hasEvents = dayEvents.length > 0;
              const isRed = dayInfo.isRedDay || hasSpecialDay;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateClick(date)}
                  className={`relative p-2 sm:p-2.5 rounded-2xl min-h-[64px] sm:min-h-[76px] flex flex-col items-center justify-between transition-all text-center cursor-pointer border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 ring-2 ring-blue-600/30'
                      : isTodayDate
                      ? 'bg-blue-50/70 border-blue-300 text-blue-900 font-bold'
                      : isCurrentMonth
                      ? 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-900'
                      : 'bg-slate-50/40 border-transparent text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {/* Top indicator icons/badges */}
                  <div className="w-full flex items-center justify-between px-0.5">
                    {/* Event or Special Badge Indicator */}
                    <div className="flex items-center space-x-1">
                      {hasEvents && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-amber-300' : 'bg-blue-600 animate-pulse'
                          }`}
                          title="ইভেন্ট রয়েছে"
                        />
                      )}
                      {hasSpecialDay && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-rose-200' : 'bg-rose-500'
                          }`}
                          title="বিশেষ দিবস / ছুটি"
                        />
                      )}
                    </div>

                    {/* Today label if today */}
                    {isTodayDate && (
                      <span
                        className={`text-[8px] font-black uppercase px-1 rounded ${
                          isSelected ? 'bg-blue-800 text-white' : 'bg-blue-600 text-white'
                        }`}
                      >
                        আজ
                      </span>
                    )}
                  </div>

                  {/* Main Day Number (Gregorian) */}
                  <div
                    className={`text-sm sm:text-base font-black font-outfit ${
                      isSelected
                        ? 'text-white'
                        : isRed && isCurrentMonth
                        ? 'text-rose-600'
                        : !isCurrentMonth
                        ? 'text-slate-300'
                        : 'text-slate-900'
                    }`}
                  >
                    {date.getDate()}
                  </div>

                  {/* Secondary Bangla Date Subscript */}
                  <div
                    className={`text-[10px] font-medium leading-none ${
                      isSelected ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {toBanglaDigits(dayInfo.banglaDay)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Calendar Bottom Legend */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 font-medium">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>সরকারি ও জাতীয় ছুটি / বিশেষ দিবস (লাল চিহ্নিত)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>ইনস্টিটিউট পরীক্ষা ও অনুষ্ঠান (ইভেন্ট)</span>
            </div>
          </div>

          {/* Mobile Inline Selected Date Details Card */}
          <div className="block lg:hidden pt-4 border-t border-slate-100">
            <DateDetailsCard
              dayInfo={selectedDayInfo}
              events={eventsOnSelectedDate}
            />
          </div>
        </div>

        {/* Selected Date Information Card (5 Cols) - Desktop View */}
        <div className="hidden lg:block lg:col-span-5 space-y-6">
          <DateDetailsCard
            dayInfo={selectedDayInfo}
            events={eventsOnSelectedDate}
          />
        </div>
      </div>

      {/* ================= MODERN BOTTOM SHEETS ================= */}

      {/* 1. MONTH & YEAR PICKER BOTTOM SHEET */}
      <BottomSheet
        isOpen={monthYearPickerOpen}
        onClose={() => setMonthYearPickerOpen(false)}
        title="মাস ও বছর নির্বাচন করুন"
        subtitle="ক্যালেন্ডার ভিউ পরিবর্তন করতে মাস ও সাল নির্বাচন করুন"
      >
        <div className="space-y-6 pb-6">
          {/* Year Selection Chips */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase font-outfit">
              সাল / YEAR
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {yearChoices.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setCurrentYear(y)}
                  className={`py-2 rounded-xl text-xs sm:text-sm font-black font-outfit transition-all cursor-pointer border ${
                    currentYear === y
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Month Selection Grid */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase font-outfit">
              মাস / MONTH
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {MONTH_NAMES_BN.map((mName, mIdx) => {
                const isSelected = currentMonth === mIdx;
                return (
                  <button
                    key={mIdx}
                    type="button"
                    onClick={() => {
                      setCurrentMonth(mIdx);
                      setMonthYearPickerOpen(false);
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-[0.98] ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-400 text-blue-900 shadow-2xs font-bold'
                        : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">{mName}</div>
                      <div className="text-[10px] text-slate-400 font-outfit uppercase">{MONTH_NAMES_EN[mIdx]}</div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Jump to Current Month Button */}
          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setCurrentYear(now.getFullYear());
                setCurrentMonth(now.getMonth());
                setSelectedDate(now);
                setMonthYearPickerOpen(false);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
            >
              চলতি মাস ও সালে যান
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* 2. EVENT CATEGORY FILTER BOTTOM SHEET */}
      <BottomSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="ইভেন্ট ও ছুটির ক্যাটাগরি ফিল্টার"
        subtitle="নির্দিষ্ট কার্যক্রম অনুযায়ী ক্যালেন্ডার দেখতে নির্বাচন করুন"
      >
        <div className="space-y-2 pb-6">
          {[
            { id: 'ALL', label: 'সকল ইভেন্ট ও নোটিশ', icon: Sparkles },
            { id: 'EXAM', label: 'সেমিস্টার পরীক্ষা', icon: CalendarDays },
            { id: 'MODEL_TEST', label: 'মডেল টেস্ট', icon: BookOpen },
            { id: 'FAREWELL', label: 'বিদায় সংবর্ধনা', icon: Award },
            { id: 'FRESHERS', label: 'নবীন বরণ', icon: Sparkle },
            { id: 'HOLIDAY', label: 'ছুটি ও অবকাশ', icon: Bell },
            { id: 'CULTURAL', label: 'সাংস্কৃতিক অনুষ্ঠান', icon: Sun },
            { id: 'SPORTS', label: 'বার্ষিক ক্রীড়া', icon: ShieldCheck },
          ].map((cat) => {
            const isSelected = selectedCategoryFilter === cat.id;
            const Icon = cat.icon;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategoryFilter(cat.id);
                  setFilterSheetOpen(false);
                }}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-[0.98] ${
                  isSelected
                    ? 'bg-blue-50/90 border-blue-400 text-blue-900 shadow-2xs font-bold'
                    : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900">{cat.label}</span>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-300'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
};

// Reusable Date Details Card (Used in both Desktop Column and Mobile BottomSheet)
const DateDetailsCard: React.FC<{ dayInfo: DayInfo; events: AppEvent[] }> = ({
  dayInfo,
  events,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header of Selected Day Card */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-black text-slate-900 uppercase font-outfit">
            SELECTED DATE INFO
          </h3>
        </div>
        <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-700 font-outfit">
          {dayInfo.dayOfWeekEn}
        </span>
      </div>

      {/* 3-Calendar Stacked Display */}
      <div className="space-y-3.5">
        {/* 1. English / Gregorian */}
        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-outfit">
            <span className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              ENGLISH / GREGORIAN
            </span>
            <span>{dayInfo.dayOfWeekBangla}</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 font-outfit tracking-tight">
            {dayInfo.gregorianFormatted}
          </div>
        </div>

        {/* 2. Bangla Calendar (বঙ্গাব্দ) */}
        <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/60 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 uppercase font-outfit">
            <span className="flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-amber-600" />
              বাংলা তারিখ (বঙ্গাব্দ)
            </span>
            <span className="text-amber-700">{dayInfo.banglaSeason}</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900">
            {dayInfo.banglaFormatted}
          </div>
        </div>

        {/* 3. Hijri Calendar (হিজরি সন) */}
        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/60 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 uppercase font-outfit">
            <span className="flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-emerald-600" />
              হিজরি তারিখ (ইসলামিক সন)
            </span>
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900">
            {dayInfo.hijriFormatted}
          </div>
        </div>
      </div>

      {/* Special Occasion / Holiday Section if any */}
      {dayInfo.specialDays.length > 0 && (
        <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl space-y-2">
          <div className="flex items-center space-x-2 text-rose-800 text-xs font-black uppercase font-outfit">
            <Bell className="w-4 h-4 text-rose-600" />
            <span>বিশেষ দিবস / সরকারি ছুটি</span>
          </div>
          <div className="space-y-1.5">
            {dayInfo.specialDays.map((spec) => (
              <div key={spec.id} className="text-xs font-bold text-rose-900 flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                <div>
                  <div>{spec.name}</div>
                  {spec.nameEn && (
                    <div className="text-[10px] text-rose-600 font-outfit uppercase font-semibold">
                      {spec.nameEn}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Created Institute Events Section on this Date */}
      {events.length > 0 ? (
        <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-3">
          <div className="flex items-center space-x-2 text-blue-900 text-xs font-black uppercase font-outfit">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>ইনস্টিটিউট অনুষ্ঠান ও কার্যক্রম ({events.length} টি)</span>
          </div>

          <div className="space-y-3">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="p-3 bg-white rounded-xl border border-blue-100 space-y-1.5 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{ev.title}</h4>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-md font-outfit uppercase shrink-0">
                    {ev.eventTypeName || ev.eventType}
                  </span>
                </div>

                {(ev.startTime || ev.endTime) && (
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-600 font-outfit">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {formatTime12Hour(ev.startTime)} {ev.endTime ? ` - ${formatTime12Hour(ev.endTime)}` : ''}
                    </span>
                  </div>
                )}

                {ev.location && (
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ev.location}</span>
                  </div>
                )}

                {ev.description && (
                  <p className="text-[11px] text-slate-600 leading-relaxed pt-1 border-t border-slate-100">
                    {ev.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-center">
          <p className="text-xs text-slate-500">
            এই তারিখে কোনো বিশেষ কলেজ অনুষ্ঠান নির্ধারিত নেই।
          </p>
        </div>
      )}
    </div>
  );
};
