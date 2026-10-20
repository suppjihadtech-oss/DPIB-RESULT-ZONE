import { getBanglaDayFromDate } from './banglaDateHelper';

export interface RoutineItemSchedule {
  id?: string;
  technology: string;
  semesterId?: string;
  date: string;
  day?: string;
  startTime: string;
  endTime: string;
  subjectCode?: string;
  subjectName?: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictType: 'SAME_DEPT_EXAM_OVERLAP' | 'SAME_DEPT_CLASS_OVERLAP' | 'TIME_INVERSION' | null;
  message: string;
  conflictingItem?: RoutineItemSchedule;
}

// Convert "10:00 AM" to minutes
export const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim().toUpperCase();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!match) return 0;

  let hour = parseInt(match[1], 10);
  const min = parseInt(match[2], 10);
  const ampm = match[3];

  if (ampm) {
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
  }
  return hour * 60 + min;
};

// Check if two time intervals overlap: [startA, endA) and [startB, endB)
export const isTimeOverlapping = (
  startAStr: string,
  endAStr: string,
  startBStr: string,
  endBStr: string
): boolean => {
  const startA = parseTimeToMinutes(startAStr);
  const endA = parseTimeToMinutes(endAStr);
  const startB = parseTimeToMinutes(startBStr);
  const endB = parseTimeToMinutes(endBStr);

  // If start is after end, consider it invalid or zero-span
  if (endA <= startA || endB <= startB) return false;

  return Math.max(startA, startB) < Math.min(endA, endB);
};

/**
 * Smart Date Suggestion:
 * Given a list of existing routine items or a previous date:
 * Returns the next probable date (usually +1 day or skipping Friday if needed).
 */
export const suggestNextRoutineDate = (
  existingDates: string[],
  skipFridays = true
): { nextDate: string; dayBangla: string } => {
  if (!existingDates || existingDates.length === 0) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    return {
      nextDate: dateStr,
      dayBangla: getBanglaDayFromDate(dateStr),
    };
  }

  // Sort dates ascending
  const validDates = existingDates
    .filter((d) => Boolean(d && d.includes('-')))
    .sort();

  const lastDateStr = validDates[validDates.length - 1];
  const parts = lastDateStr.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);

  const next = new Date(y, m, d);
  next.setDate(next.getDate() + 1);

  // If Friday (5) and skipFridays is true, advance to Saturday (6)
  if (skipFridays && next.getDay() === 5) {
    next.setDate(next.getDate() + 1);
  }

  const yyyy = next.getFullYear();
  const mm = String(next.getMonth() + 1).padStart(2, '0');
  const dd = String(next.getDate()).padStart(2, '0');
  const nextDateStr = `${yyyy}-${mm}-${dd}`;

  return {
    nextDate: nextDateStr,
    dayBangla: getBanglaDayFromDate(nextDateStr),
  };
};

/**
 * Smart Conflict Detection:
 * Checks whether the newItem conflicts with any existing item.
 * Rule:
 * - Only flags conflict if SAME DATE AND overlapping TIME for the SAME TECHNOLOGY & SEMESTER
 * - Or if one of them is 'ALL' technology with the same semester.
 * - Does NOT flag conflict if technologies are different (e.g. Computer vs Electrical at same time is valid).
 */
export const detectRoutineConflict = (
  newItem: RoutineItemSchedule,
  existingItems: RoutineItemSchedule[],
  currentEditingId?: string | null
): ConflictResult => {
  // 1. Time Inversion Check
  const startMin = parseTimeToMinutes(newItem.startTime);
  const endMin = parseTimeToMinutes(newItem.endTime);
  if (startMin > 0 && endMin > 0 && endMin <= startMin) {
    return {
      hasConflict: true,
      conflictType: 'TIME_INVERSION',
      message: 'ভুল সময়সূচি: পরীক্ষার সমাপ্তির সময় অবশ্যই শুরুর সময়ের পরবর্তী হতে হবে।',
    };
  }

  if (!newItem.date) {
    return { hasConflict: false, conflictType: null, message: '' };
  }

  for (const item of existingItems) {
    if (currentEditingId && item.id === currentEditingId) continue;
    if (item.date !== newItem.date) continue;

    // Check technology compatibility
    const sameSemester = !newItem.semesterId || !item.semesterId || newItem.semesterId === item.semesterId;
    if (!sameSemester) continue;

    const isTechConflict =
      newItem.technology === 'ALL' ||
      item.technology === 'ALL' ||
      newItem.technology === item.technology;

    if (!isTechConflict) {
      // Different technologies running exam at same time is totally valid!
      continue;
    }

    // Check time overlap
    if (isTimeOverlapping(newItem.startTime, newItem.endTime, item.startTime, item.endTime)) {
      const deptName = item.technology === 'ALL' ? 'সকল টেকনোলজি' : item.technology;
      return {
        hasConflict: true,
        conflictType: 'SAME_DEPT_EXAM_OVERLAP',
        message: `সময়সূচি সংঘাত (Conflict): একই দিনে (${newItem.date}) একই টেকনোলজি (${deptName})-এ "${item.subjectName || item.subjectCode || 'অন্যান্য বিষয়'}"-এর পরীক্ষা চলমান রয়েছে (${item.startTime} হতে ${item.endTime})।`,
        conflictingItem: item,
      };
    }
  }

  return { hasConflict: false, conflictType: null, message: '' };
};
