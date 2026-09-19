import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CalendarCheck,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { AppEvent } from '../../types';
import { toBanglaDigits, formatTime12Hour } from '../../utils/bangla';

interface EventCountdownCardProps {
  events: AppEvent[];
  onOpenCalendar?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  status: 'UPCOMING' | 'ONGOING' | 'ENDED';
}

function calculateTimeRemaining(event: AppEvent): TimeLeft {
  const now = new Date();

  // Combine eventDate and startTime
  const dateParts = event.eventDate.split('-');
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1;
  const day = parseInt(dateParts[2], 10);

  let startHours = 9;
  let startMinutes = 0;
  if (event.startTime) {
    const timeParts = event.startTime.split(':');
    if (timeParts.length >= 2) {
      startHours = parseInt(timeParts[0], 10);
      startMinutes = parseInt(timeParts[1], 10);
    }
  }

  const startDateTime = new Date(year, month, day, startHours, startMinutes, 0);

  let endDateTime: Date;
  if (event.endTime) {
    const endTimeParts = event.endTime.split(':');
    if (endTimeParts.length >= 2) {
      const endHours = parseInt(endTimeParts[0], 10);
      const endMinutes = parseInt(endTimeParts[1], 10);
      endDateTime = new Date(year, month, day, endHours, endMinutes, 0);
    } else {
      endDateTime = new Date(startDateTime.getTime() + 4 * 60 * 60 * 1000); // 4 hrs default
    }
  } else {
    // Default end time: end of that day (23:59:59)
    endDateTime = new Date(year, month, day, 23, 59, 59);
  }

  const nowMs = now.getTime();
  const startMs = startDateTime.getTime();
  const endMs = endDateTime.getTime();

  if (nowMs < startMs) {
    const diff = startMs - nowMs;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return {
      days: Math.max(0, days),
      hours: Math.max(0, hours),
      minutes: Math.max(0, minutes),
      seconds: Math.max(0, seconds),
      status: 'UPCOMING',
    };
  } else if (nowMs >= startMs && nowMs <= endMs) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      status: 'ONGOING',
    };
  } else {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      status: 'ENDED',
    };
  }
}

export const EventCountdownCard: React.FC<EventCountdownCardProps> = ({
  events,
  onOpenCalendar,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tick, setTick] = useState(0);

  // Filter only upcoming or ongoing published events
  const activeEvents = useMemo(() => {
    return events
      .filter((ev) => ev.status === 'PUBLISHED')
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  }, [events]);

  // Tick timer every second for accurate countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!activeEvents || activeEvents.length === 0) {
    return null;
  }

  const currentEvent = activeEvents[Math.min(currentIndex, activeEvents.length - 1)];
  const timeLeft = calculateTimeRemaining(currentEvent);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? activeEvents.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === activeEvents.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-lg shadow-slate-100/60 relative overflow-hidden transition-all font-bengali">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* Top Header / Meta Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50 border border-blue-200/80 rounded-full text-blue-700 text-xs font-black font-outfit uppercase">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>UPCOMING EVENT & PROGRAM</span>
            </div>
            {activeEvents.length > 1 && (
              <span className="text-[11px] font-bold text-slate-400 font-outfit">
                ({currentIndex + 1}/{activeEvents.length})
              </span>
            )}
          </div>

          {/* Carousel Arrows if multiple events */}
          {activeEvents.length > 1 && (
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                title="পূর্ববর্তী ইভেন্ট"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                title="পরবর্তী ইভেন্ট"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Event Main Title & Details */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-extrabold font-outfit uppercase">
              {currentEvent.eventTypeName || currentEvent.eventType}
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {currentEvent.title}
            </h3>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 font-medium">
              <div className="flex items-center space-x-1.5 font-outfit">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>{currentEvent.eventDate}</span>
              </div>
              {currentEvent.startTime && (
                <div className="flex items-center space-x-1.5 font-outfit">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {formatTime12Hour(currentEvent.startTime)} {currentEvent.endTime ? `- ${formatTime12Hour(currentEvent.endTime)}` : ''}
                  </span>
                </div>
              )}
              {currentEvent.location && (
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>{currentEvent.location}</span>
                </div>
              )}
            </div>

            {currentEvent.description && (
              <p className="text-xs text-slate-500 line-clamp-2 pt-1">
                {currentEvent.description}
              </p>
            )}
          </div>

          {/* Countdown Clock Display or Ongoing/Ended Status Box */}
          <div className="shrink-0 bg-slate-50/90 border border-slate-200/80 p-4 sm:p-5 rounded-2xl">
            {timeLeft.status === 'UPCOMING' ? (
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center font-outfit">
                  COUNTDOWN TO EVENT
                </span>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {/* Days */}
                  <div className="bg-white border border-slate-200 rounded-xl p-2 sm:px-3 sm:py-2 min-w-[54px] shadow-2xs">
                    <div className="text-xl sm:text-2xl font-black text-blue-600 font-outfit">
                      {String(timeLeft.days).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase font-outfit">
                      DAYS
                    </div>
                  </div>
                  {/* Hours */}
                  <div className="bg-white border border-slate-200 rounded-xl p-2 sm:px-3 sm:py-2 min-w-[54px] shadow-2xs">
                    <div className="text-xl sm:text-2xl font-black text-blue-600 font-outfit">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase font-outfit">
                      HOURS
                    </div>
                  </div>
                  {/* Minutes */}
                  <div className="bg-white border border-slate-200 rounded-xl p-2 sm:px-3 sm:py-2 min-w-[54px] shadow-2xs">
                    <div className="text-xl sm:text-2xl font-black text-blue-600 font-outfit">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase font-outfit">
                      MINUTES
                    </div>
                  </div>
                  {/* Seconds */}
                  <div className="bg-white border border-slate-200 rounded-xl p-2 sm:px-3 sm:py-2 min-w-[54px] shadow-2xs">
                    <div className="text-xl sm:text-2xl font-black text-blue-600 font-outfit">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase font-outfit">
                      SECONDS
                    </div>
                  </div>
                </div>
              </div>
            ) : timeLeft.status === 'ONGOING' ? (
              <div className="text-center py-2 px-4 space-y-1">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black font-outfit uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                  <span>ONGOING / চলমান</span>
                </span>
                <p className="text-sm font-black text-emerald-900 mt-1">অনুষ্ঠান শুরু হয়েছে</p>
              </div>
            ) : (
              <div className="text-center py-2 px-4 space-y-1">
                <span className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-black font-outfit uppercase">
                  <span>COMPLETED</span>
                </span>
                <p className="text-sm font-bold text-slate-600 mt-1">অনুষ্ঠান সমাপ্ত হয়েছে</p>
              </div>
            )}
          </div>
        </div>

        {/* View Calendar Button Link */}
        {onOpenCalendar && (
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onOpenCalendar}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 transition-colors cursor-pointer group"
            >
              <span>স্মার্ট ক্যালেন্ডারে সকল অনুষ্ঠান দেখুন</span>
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
