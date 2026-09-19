// Accurate Date Conversion Utilities for Gregorian, Bangla, and Hijri Calendars

export interface SpecialDay {
  id: string;
  name: string;
  nameEn: string;
  type: 'HOLIDAY' | 'NATIONAL' | 'ISLAMIC' | 'ACADEMIC' | 'EVENT';
  description?: string;
  isHoliday: boolean;
}

export interface DayInfo {
  date: Date;
  dateString: string; // YYYY-MM-DD
  day: number;
  month: number; // 0-11
  year: number;
  dayOfWeekBangla: string;
  dayOfWeekEn: string;
  gregorianFormatted: string;
  banglaFormatted: string;
  banglaDay: number;
  banglaMonthName: string;
  banglaYear: number;
  banglaSeason: string;
  hijriFormatted: string;
  hijriDay: number;
  hijriMonthName: string;
  hijriYear: number;
  specialDays: SpecialDay[];
  isRedDay: boolean; // Special day or Friday/Saturday weekend
}

const BANGLA_MONTHS = [
  'বৈশাখ',
  'জ্যৈষ্ঠ',
  'আষাঢ়',
  'শ্রাবণ',
  'ভাদ্র',
  'আশ্বিন',
  'কার্তিক',
  'অগ্রহায়ণ',
  'পৌষ',
  'মাঘ',
  'ফাল্গুন',
  'চৈত্র',
];

const BANGLA_SEASONS = [
  'গ্রীষ্মকাল',
  'বর্ষাকাল',
  'শরৎকাল',
  'হেমন্তকাল',
  'শীতকাল',
  'বসন্তকাল',
];

const BANGLA_DAYS_OF_WEEK = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার',
];

const EN_DAYS_OF_WEEK = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

const EN_MONTHS = [
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

const HIJRI_MONTHS = [
  'মুহররম',
  'সফর',
  'রবিউল আউয়াল',
  'রবিউস সানি',
  'জমাদিউল আউয়াল',
  'জমাদিউস সানি',
  'রজব',
  'শাবান',
  'রমজান',
  'শাওয়াল',
  'জিলকদ',
  'জিলহজ্জ',
];

// Fixed National & Observance Days (Month is 1-indexed, Day is 1-indexed)
const FIXED_SPECIAL_DAYS: Record<string, SpecialDay[]> = {
  '01-01': [
    { id: 'new-year', name: 'ইংরেজি নববর্ষ (NEW YEAR)', nameEn: 'NEW YEAR', type: 'NATIONAL', isHoliday: false },
  ],
  '02-21': [
    { id: 'mother-lang', name: 'শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস', nameEn: 'INTERNATIONAL MOTHER LANGUAGE DAY', type: 'HOLIDAY', isHoliday: true },
  ],
  '03-17': [
    { id: 'mujib-birthday', name: 'জাতির পিতার জন্মবার্ষিকী ও জাতীয় শিশু দিবস', nameEn: 'NATIONAL CHILDREN DAY', type: 'NATIONAL', isHoliday: true },
  ],
  '03-26': [
    { id: 'independence', name: 'মহান স্বাধীনতা ও জাতীয় দিবস', nameEn: 'INDEPENDENCE DAY', type: 'HOLIDAY', isHoliday: true },
  ],
  '04-14': [
    { id: 'pahela-baishakh', name: 'পহেলা বৈশাখ (বাংলা নববর্ষ)', nameEn: 'BENGALI NEW YEAR', type: 'HOLIDAY', isHoliday: true },
  ],
  '05-01': [
    { id: 'may-day', name: 'মে দিবস (আন্তর্জাতিক শ্রমিক দিবস)', nameEn: 'MAY DAY', type: 'HOLIDAY', isHoliday: true },
  ],
  '08-15': [
    { id: 'national-mourning', name: 'জাতীয় শোক দিবস', nameEn: 'NATIONAL MOURNING DAY', type: 'NATIONAL', isHoliday: true },
  ],
  '12-14': [
    { id: 'intellectuals-day', name: 'শহীদ বুদ্ধিজীবী দিবস', nameEn: 'MARTYRED INTELLECTUALS DAY', type: 'NATIONAL', isHoliday: false },
  ],
  '12-16': [
    { id: 'victory-day', name: 'মহান বিজয় দিবস', nameEn: 'VICTORY DAY', type: 'HOLIDAY', isHoliday: true },
  ],
  '12-25': [
    { id: 'christmas', name: 'যীশু খ্রিস্টের জন্মদিন (বড়দিন)', nameEn: 'CHRISTMAS DAY', type: 'HOLIDAY', isHoliday: true },
  ],
};

function isLeapYearGregorian(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Converts Gregorian Date to Bangla Date (Revised Bangladesh Calendar).
 * In modern Bangladesh system:
 * - Bengali year starts on April 14.
 * - Boishakh to Ashwin (1st to 6th month) = 31 days each.
 * - Kartik to Magh (7th to 10th month) = 30 days each.
 * - Falgun (11th month) = 29 days (30 in leap year).
 * - Choitro (12th month) = 30 days.
 */
export function getBanglaDate(date: Date): { day: number; monthName: string; monthIndex: number; year: number; season: string } {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth(); // 0-indexed
  const gDay = date.getDate();

  // Day count from beginning of Gregorian year
  const daysInMonths = [31, isLeapYearGregorian(gYear) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // April 14 is the epoch (1st Boishakh)
  // Check if date is before April 14
  const isBeforeApril14 = gMonth < 3 || (gMonth === 3 && gDay < 14);

  const bYear = isBeforeApril14 ? gYear - 594 : gYear - 593;

  // Calculate day difference from April 14
  // Target Bengali month day counts (for the current Bengali year)
  // If the Gregorian year of Falgun (which is gYear + 1 if after April 14, or gYear if before April 14) is leap year
  const falgunYear = isBeforeApril14 ? gYear : gYear + 1;
  const isFalgunLeap = isLeapYearGregorian(falgunYear);

  const bMonthDays = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, isFalgunLeap ? 30 : 29, 30];

  // Calculate total days from previous April 14
  let totalDaysSinceApr14 = 0;
  if (!isBeforeApril14) {
    // Current Gregorian year from Apr 14
    totalDaysSinceApr14 = gDay - 14;
    for (let m = 3; m < gMonth; m++) {
      totalDaysSinceApr14 += daysInMonths[m];
    }
  } else {
    // From Apr 14 of previous Gregorian year
    const prevYearLeap = isLeapYearGregorian(gYear - 1);
    const prevDaysInMonths = [31, prevYearLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    // Days remaining in prev year from Apr 14
    let remainingInPrevYear = 30 - 14; // Apr 14 to Apr 30 = 16 days
    for (let m = 4; m < 12; m++) {
      remainingInPrevYear += prevDaysInMonths[m];
    }
    
    // Days in current year up to gDate
    let daysInCurrYear = gDay;
    for (let m = 0; m < gMonth; m++) {
      daysInCurrYear += daysInMonths[m];
    }
    
    totalDaysSinceApr14 = remainingInPrevYear + daysInCurrYear;
  }

  // Find Bengali month & day
  let bMonthIndex = 0;
  let runningDays = 0;

  for (let i = 0; i < 12; i++) {
    if (runningDays + bMonthDays[i] > totalDaysSinceApr14) {
      bMonthIndex = i;
      break;
    }
    runningDays += bMonthDays[i];
  }

  const bDay = totalDaysSinceApr14 - runningDays + 1;
  const seasonIndex = Math.floor(bMonthIndex / 2);

  return {
    day: bDay,
    monthName: BANGLA_MONTHS[bMonthIndex],
    monthIndex: bMonthIndex,
    year: bYear,
    season: BANGLA_SEASONS[seasonIndex],
  };
}

/**
 * Converts Gregorian Date to Hijri (Islamic) Date using standard Astronomical Tabular algorithm.
 */
export function getHijriDate(date: Date, adjustmentDays: number = 0): { day: number; monthName: string; monthIndex: number; year: number } {
  const d = new Date(date);
  d.setDate(d.getDate() + adjustmentDays);

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  // Julian Day Number Calculation
  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;
  let jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  // Islamic epoch JDN = 1948439.5
  let l = jdn - 1948440 + 10632;
  let n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
  l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
  let hMonth = Math.floor((24 * l) / 709);
  let hDay = l - Math.floor((709 * hMonth) / 24);
  let hYear = 30 * n + j - 30;

  // Fix 0-based month index
  const safeMonthIndex = Math.max(0, Math.min(11, hMonth - 1));

  return {
    day: hDay,
    monthName: HIJRI_MONTHS[safeMonthIndex],
    monthIndex: safeMonthIndex,
    year: hYear,
  };
}

/**
 * Generates full DayInfo for any given Date object.
 */
export function getFullDayInfo(date: Date): DayInfo {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const dayOfWeek = date.getDay();

  const pad = (n: number) => String(n).padStart(2, '0');
  const dateString = `${year}-${pad(month + 1)}-${pad(day)}`;
  const mmdd = `${pad(month + 1)}-${pad(day)}`;

  const bDate = getBanglaDate(date);
  const hDate = getHijriDate(date);

  const specialDays = FIXED_SPECIAL_DAYS[mmdd] ? [...FIXED_SPECIAL_DAYS[mmdd]] : [];

  // Friday is weekly holiday in Bangladesh (and Saturday in some institutes)
  const isWeekend = dayOfWeek === 5; // Friday
  const hasHoliday = specialDays.some((s) => s.isHoliday);
  const isRedDay = isWeekend || hasHoliday;

  const toBanglaNum = (n: number) =>
    String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)]);

  return {
    date,
    dateString,
    day,
    month,
    year,
    dayOfWeekBangla: BANGLA_DAYS_OF_WEEK[dayOfWeek],
    dayOfWeekEn: EN_DAYS_OF_WEEK[dayOfWeek],
    gregorianFormatted: `${day} ${EN_MONTHS[month]} ${year}`,
    banglaFormatted: `${toBanglaNum(bDate.day)} ${bDate.monthName}, ${toBanglaNum(bDate.year)} বঙ্গাব্দ (${bDate.season})`,
    banglaDay: bDate.day,
    banglaMonthName: bDate.monthName,
    banglaYear: bDate.year,
    banglaSeason: bDate.season,
    hijriFormatted: `${toBanglaNum(hDate.day)} ${hDate.monthName}, ${toBanglaNum(hDate.year)} হিজরি`,
    hijriDay: hDate.day,
    hijriMonthName: hDate.monthName,
    hijriYear: hDate.year,
    specialDays,
    isRedDay,
  };
}
