import { toBanglaDigits } from './bangla';

export const BANGLA_DAYS_MAP: string[] = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার',
];

export const BANGLA_MONTHS_NAMES = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
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

/**
 * Accurately determines Bengali Day Name from YYYY-MM-DD or standard ISO date string
 */
export const getBanglaDayFromDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  const parts = trimmed.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const date = new Date(y, m, d);
    if (!isNaN(date.getTime())) {
      return BANGLA_DAYS_MAP[date.getDay()] || '';
    }
  }
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return '';
  return BANGLA_DAYS_MAP[d.getDay()] || '';
};

/**
 * Formats a YYYY-MM-DD date into Bangla readable format (e.g. ১২ অক্টোবর ২০২৬)
 */
export const formatBanglaDateDisplay = (dateStr?: string | null): string => {
  if (!dateStr) return 'তারিখ নির্বাচন করুন';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const monthName = BANGLA_MONTHS_NAMES[m] || parts[1];
    return `${toBanglaDigits(d)} ${monthName} ${toBanglaDigits(y)}`;
  }
  return dateStr;
};
