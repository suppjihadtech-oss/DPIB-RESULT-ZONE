import { toBanglaDigits, toEnglishDigits } from './bangla';
import { ShiftConfig } from '../types';

export interface ParsedTime {
  hour: number; // 1 - 12
  minute: number; // 0 - 59
  period: 'AM' | 'PM';
}

/**
 * Parses any 12-hour time string (e.g., "08:00 AM", "1:30 PM", "8:00 AM")
 * into normalized hour (1-12), minute (0-59), and period ('AM' | 'PM').
 */
export function parse12HourTime(timeStr?: string | null): ParsedTime {
  if (!timeStr || typeof timeStr !== 'string') {
    return { hour: 8, minute: 0, period: 'AM' };
  }

  const clean = toEnglishDigits(timeStr).trim().toUpperCase();
  const isPM = clean.includes('PM') || clean.includes('পিএম') || clean.includes('বিকাল') || clean.includes('রাত') || clean.includes('সন্ধ্যা') || clean.includes('দুপুর');
  const isAM = clean.includes('AM') || clean.includes('এএম') || clean.includes('সকাল') || clean.includes('ভোর');

  // Extract digits for hour and minute
  const match = clean.match(/(\d{1,2})[:.\s](\d{1,2})/);
  if (match) {
    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);

    let period: 'AM' | 'PM' = isPM ? 'PM' : 'AM';

    // If 24-hour format was provided (e.g., 14:30)
    if (hour >= 13 && hour <= 23) {
      hour = hour - 12;
      period = 'PM';
    } else if (hour === 0) {
      hour = 12;
      period = 'AM';
    } else if (hour > 12) {
      hour = 12;
    } else if (hour < 1) {
      hour = 12;
    }

    const safeMinute = isNaN(minute) ? 0 : Math.min(Math.max(minute, 0), 59);

    return {
      hour,
      minute: safeMinute,
      period,
    };
  }

  // Fallback single digit hour match (e.g., "8 AM")
  const singleHourMatch = clean.match(/(\d{1,2})/);
  if (singleHourMatch) {
    let hour = parseInt(singleHourMatch[1], 10);
    if (hour > 12) hour = hour % 12 || 12;
    return {
      hour: hour || 8,
      minute: 0,
      period: isPM ? 'PM' : 'AM',
    };
  }

  return { hour: 8, minute: 0, period: 'AM' };
}

/**
 * Formats hour, minute, and period into standard "HH:MM AA" format (e.g., "08:00 AM").
 */
export function format12HourTime(hour: number, minute: number, period: 'AM' | 'PM'): string {
  const safeHour = Math.min(Math.max(hour, 1), 12);
  const safeMinute = Math.min(Math.max(minute, 0), 59);
  const hourStr = safeHour < 10 ? `0${safeHour}` : `${safeHour}`;
  const minStr = safeMinute < 10 ? `0${safeMinute}` : `${safeMinute}`;
  return `${hourStr}:${minStr} ${period}`;
}

/**
 * Converts a 12-hour time string into total minutes from midnight (0 to 1439).
 */
export function timeToMinutes(timeStr: string): number {
  const { hour, minute, period } = parse12HourTime(timeStr);
  let h = hour % 12;
  if (period === 'PM') {
    h += 12;
  }
  return h * 60 + minute;
}

export interface DurationResult {
  valid: boolean;
  totalMinutes: number;
  hours: number;
  minutes: number;
  banglaDuration: string;
  error?: string;
}

/**
 * Calculates the exact duration between start time and end time.
 * Validates that start time is strictly before end time.
 */
export function calculateShiftDuration(startTime: string, endTime: string): DurationResult {
  if (!startTime || !endTime) {
    return {
      valid: false,
      totalMinutes: 0,
      hours: 0,
      minutes: 0,
      banglaDuration: '০ মিনিট',
      error: 'শুরুর ও শেষের সময় উভয়ই নির্বাচন করুন।',
    };
  }

  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  if (startMin >= endMin) {
    return {
      valid: false,
      totalMinutes: 0,
      hours: 0,
      minutes: 0,
      banglaDuration: 'ভুল সময়সীমা',
      error: 'শুরুর সময় অবশ্যই শেষের সময়ের পূর্বে হতে হবে।',
    };
  }

  const diff = endMin - startMin;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;

  let banglaDuration = '';
  if (hours > 0 && minutes > 0) {
    banglaDuration = `${toBanglaDigits(hours)} ঘণ্টা ${toBanglaDigits(minutes)} মিনিট`;
  } else if (hours > 0) {
    banglaDuration = `${toBanglaDigits(hours)} ঘণ্টা`;
  } else {
    banglaDuration = `${toBanglaDigits(minutes)} মিনিট`;
  }

  return {
    valid: true,
    totalMinutes: diff,
    hours,
    minutes,
    banglaDuration,
  };
}

/**
 * Returns a conversational Bengali time description with period (সকাল/দুপুর/বিকাল/সন্ধ্যা/রাত).
 */
export function formatBanglaTimeWithPeriod(timeStr: string): string {
  const { hour, minute, period } = parse12HourTime(timeStr);
  const banglaHour = toBanglaDigits(hour < 10 ? `0${hour}` : hour);
  const banglaMinute = toBanglaDigits(minute < 10 ? `0${minute}` : minute);

  let prefix = 'সকাল';
  if (period === 'AM') {
    if (hour >= 4 && hour < 6) prefix = 'ভোর';
    else if (hour >= 6 && hour < 12) prefix = 'সকাল';
    else prefix = 'রাত'; // 12 AM
  } else {
    if (hour === 12 || hour < 3) prefix = 'দুপুর';
    else if (hour >= 3 && hour < 6) prefix = 'বিকাল';
    else if (hour >= 6 && hour < 8) prefix = 'সন্ধ্যা';
    else prefix = 'রাত';
  }

  return `${prefix} ${banglaHour}:${banglaMinute}`;
}

/**
 * Checks if the current local time falls within the given shift time range.
 */
export function isCurrentlyActiveShift(startTime: string, endTime: string): boolean {
  try {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);

    if (startMin < endMin) {
      return currentMinutes >= startMin && currentMinutes < endMin;
    } else if (startMin > endMin) {
      return currentMinutes >= startMin || currentMinutes < endMin;
    }
    return false;
  } catch {
    return false;
  }
}

export interface ActiveShiftStatus {
  hasActiveShift: boolean;
  activeShift: ShiftConfig | null;
  status: 'ACTIVE' | 'BETWEEN_SHIFTS' | 'OFF_HOURS';
  progressPercent: number; // 0 to 100
  totalMinutes: number;
  elapsedMinutes: number;
  remainingMinutes: number;
  remainingBangla: string; // e.g. "১ ঘণ্টা ৩০ মিনিট"
  elapsedBangla: string;   // e.g. "২ ঘণ্টা ১৫ মিনিট"
  nextShift: ShiftConfig | null;
  minutesUntilNextShift?: number;
  timeUntilNextBangla?: string;
  currentLocalTimeStr: string; // e.g. "09:45 AM"
  currentLocalTimeBangla: string; // e.g. "সকাল ০৯:৪৫"
}

/**
 * Automatically inspects the configured shifts and identifies the currently active shift
 * or the next upcoming shift, with elapsed/remaining durations and progress.
 */
export function detectActiveShift(shifts: ShiftConfig[], refDate?: Date): ActiveShiftStatus {
  const now = refDate || new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Format current local time
  const ch = now.getHours();
  const cmin = now.getMinutes();
  const cperiod: 'AM' | 'PM' = ch >= 12 ? 'PM' : 'AM';
  let ch12 = ch % 12;
  if (ch12 === 0) ch12 = 12;
  const currentLocalTimeStr = format12HourTime(ch12, cmin, cperiod);
  const currentLocalTimeBangla = formatBanglaTimeWithPeriod(currentLocalTimeStr);

  const safeShifts = shifts && shifts.length > 0 ? shifts : [];

  // 1. First pass: check if any shift is currently ongoing
  for (const shift of safeShifts) {
    if (!shift.startTime || !shift.endTime) continue;
    const startMin = timeToMinutes(shift.startTime);
    const endMin = timeToMinutes(shift.endTime);

    let isActive = false;
    let totalMins = 0;
    let elapsedMins = 0;

    if (startMin < endMin) {
      // Standard same-day shift: e.g. 08:00 AM (480) to 01:00 PM (780)
      if (currentMinutes >= startMin && currentMinutes < endMin) {
        isActive = true;
        totalMins = endMin - startMin;
        elapsedMins = currentMinutes - startMin;
      }
    } else if (startMin > endMin) {
      // Overnight shift spanning midnight
      if (currentMinutes >= startMin || currentMinutes < endMin) {
        isActive = true;
        totalMins = 1440 - startMin + endMin;
        elapsedMins =
          currentMinutes >= startMin
            ? currentMinutes - startMin
            : 1440 - startMin + currentMinutes;
      }
    }

    if (isActive) {
      const remainingMins = Math.max(0, totalMins - elapsedMins);
      const progressPercent =
        totalMins > 0
          ? Math.min(100, Math.max(0, Math.round((elapsedMins / totalMins) * 100)))
          : 0;

      const remHours = Math.floor(remainingMins / 60);
      const remM = remainingMins % 60;
      let remainingBangla = '';
      if (remHours > 0 && remM > 0) {
        remainingBangla = `${toBanglaDigits(remHours)} ঘণ্টা ${toBanglaDigits(remM)} মিনিট`;
      } else if (remHours > 0) {
        remainingBangla = `${toBanglaDigits(remHours)} ঘণ্টা`;
      } else {
        remainingBangla = `${toBanglaDigits(remM)} মিনিট`;
      }

      const elpHours = Math.floor(elapsedMins / 60);
      const elpM = elapsedMins % 60;
      let elapsedBangla = '';
      if (elpHours > 0 && elpM > 0) {
        elapsedBangla = `${toBanglaDigits(elpHours)} ঘণ্টা ${toBanglaDigits(elpM)} মিনিট`;
      } else if (elpHours > 0) {
        elapsedBangla = `${toBanglaDigits(elpHours)} ঘণ্টা`;
      } else {
        elapsedBangla = `${toBanglaDigits(elpM)} মিনিট`;
      }

      return {
        hasActiveShift: true,
        activeShift: shift,
        status: 'ACTIVE',
        progressPercent,
        totalMinutes: totalMins,
        elapsedMinutes: elapsedMins,
        remainingMinutes: remainingMins,
        remainingBangla,
        elapsedBangla,
        nextShift: null,
        currentLocalTimeStr,
        currentLocalTimeBangla,
      };
    }
  }

  // 2. Second pass: No active shift, find the next upcoming shift
  let nextShift: ShiftConfig | null = null;
  let minWaitMinutes = Infinity;

  for (const shift of safeShifts) {
    if (!shift.startTime) continue;
    const startMin = timeToMinutes(shift.startTime);

    let wait = 0;
    if (startMin > currentMinutes) {
      // Starts later today
      wait = startMin - currentMinutes;
    } else {
      // Starts tomorrow
      wait = 1440 - currentMinutes + startMin;
    }

    if (wait < minWaitMinutes) {
      minWaitMinutes = wait;
      nextShift = shift;
    }
  }

  let timeUntilNextBangla = '';
  if (nextShift && minWaitMinutes < Infinity) {
    const wHours = Math.floor(minWaitMinutes / 60);
    const wM = minWaitMinutes % 60;
    if (wHours > 0 && wM > 0) {
      timeUntilNextBangla = `${toBanglaDigits(wHours)} ঘণ্টা ${toBanglaDigits(wM)} মিনিট`;
    } else if (wHours > 0) {
      timeUntilNextBangla = `${toBanglaDigits(wHours)} ঘণ্টা`;
    } else {
      timeUntilNextBangla = `${toBanglaDigits(wM)} মিনিট`;
    }
  }

  return {
    hasActiveShift: false,
    activeShift: null,
    status: minWaitMinutes <= 60 ? 'BETWEEN_SHIFTS' : 'OFF_HOURS',
    progressPercent: 0,
    totalMinutes: 0,
    elapsedMinutes: 0,
    remainingMinutes: 0,
    remainingBangla: '০ মিনিট',
    elapsedBangla: '০ মিনিট',
    nextShift,
    minutesUntilNextShift: minWaitMinutes < Infinity ? minWaitMinutes : undefined,
    timeUntilNextBangla: timeUntilNextBangla || undefined,
    currentLocalTimeStr,
    currentLocalTimeBangla,
  };
}
