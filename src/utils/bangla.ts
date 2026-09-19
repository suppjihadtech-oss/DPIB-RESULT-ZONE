// Bengali Number and Language Utilities

const BANGLA_DIGITS: { [key: string]: string } = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

const ENGLISH_DIGITS: { [key: string]: string } = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

export const BANGLA_MONTHS = [
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

export const SEMESTER_MAP: { [key: string]: string } = {
  '1': '১ম সেমিস্টার',
  '2': '২য় সেমিস্টার',
  '3': '৩য় সেমিস্টার',
  '4': '৪র্থ সেমিস্টার',
  '5': '৫ম সেমিস্টার',
  '6': '৬ষ্ঠ সেমিস্টার',
  '7': '৭ম সেমিস্টার',
  '8': '৮ম সেমিস্টার',
};

export function toBanglaDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  const str = input.toString();
  return str.replace(/[0-9]/g, (digit) => BANGLA_DIGITS[digit] || digit);
}

export function toEnglishDigits(input: string | null | undefined): string {
  if (!input) return '';
  return input.replace(/[০-৯]/g, (digit) => ENGLISH_DIGITS[digit] || digit);
}

export function toBanglaNumber(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || isNaN(value)) return '০';
  const fixed = Number(value).toFixed(decimals);
  // remove trailing .00 if needed or keep standard
  return toBanglaDigits(fixed);
}

export function toBanglaOrdinal(num: number | string): string {
  const n = typeof num === 'string' ? parseInt(toEnglishDigits(num), 10) : num;
  if (n === 1) return '১ম';
  if (n === 2) return '২য়';
  if (n === 3) return '৩য়';
  if (n === 4) return '৪র্থ';
  if (n === 5) return '৫ম';
  if (n === 6) return '৬ষ্ঠ';
  if (n === 7) return '৭ম';
  if (n === 8) return '৮ম';
  if (n === 9) return '৯ম';
  if (n === 10) return '১০ম';
  return `${toBanglaDigits(n)}তম`;
}

export function formatBanglaDate(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const day = toBanglaDigits(d.getDate());
    const month = BANGLA_MONTHS[d.getMonth()];
    const year = toBanglaDigits(d.getFullYear());
    return `${day} ${month}, ${year}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Converts 24-hour time string (e.g. "14:30" or "09:00") to 12-hour format (e.g. "02:30 PM", "09:00 AM")
 * Preserves original if already formatted or invalid.
 */
export function formatTime12Hour(timeStr?: string | null): string {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  if (!trimmed) return '';
  if (/am|pm/i.test(trimmed)) return trimmed;
  const parts = trimmed.split(':');
  if (parts.length < 2) return trimmed;
  let hours = parseInt(toEnglishDigits(parts[0]), 10);
  const minutes = toEnglishDigits(parts[1]).padStart(2, '0');
  if (isNaN(hours)) return trimmed;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hoursStr = String(hours).padStart(2, '0');
  return `${hoursStr}:${minutes} ${ampm}`;
}
