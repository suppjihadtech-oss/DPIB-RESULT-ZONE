import * as XLSX from 'xlsx';
import { Exam, ExamSubject, GradingRule, SemesterId, StudentResult, SubjectResult } from '../types';
import { calculateOverallResult, calculateSubjectGrade, DEFAULT_GRADING_RULES } from './grading';
import { toEnglishDigits, toBanglaDigits, SEMESTER_MAP } from '../utils/bangla';
import { MASTER_CURRICULUM_DATA } from '../data/masterCurriculum';
import { isFirestoreAutoId, generateDynamicStudentId } from './db';

export interface ParsedRow {
  rowNumber: number;
  roll: string;
  studentName: string;
  studentId: string;
  registration?: string;
  subjectMarks: { [subjectCode: string]: number };
  isValid: boolean;
  errors: string[];
  calculatedResult?: {
    subjects: SubjectResult[];
    totalFullMarks: number;
    totalObtainedMarks: number;
    gpa: number;
    letterGrade: string;
    isPassed: boolean;
  };
}

export interface RawRowData {
  rowNumber: number;
  data: { [key: string]: any };
  isValid: boolean;
  errors: string[];
}

export interface ValidationReport {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rawHeaders: string[];
  rawRows: RawRowData[];
  rows: ParsedRow[];
  results: StudentResult[];
  errors: string[];
  summaryMessage: string;
  detectedExam?: Exam | null;
  detectedSubjects?: ExamSubject[];
  autoCreatedExam?: boolean;
  sheetName?: string;
  fileName?: string;
}

// Known subject name dictionary for DPIB Model Tests and Semesters
export const KNOWN_SUBJECTS_MAP: { [key: string]: { code: string; name: string } } = {
  // Model Test & 2nd Semester subjects
  'BANGLA-II': { code: 'BANGLA-II', name: 'বাংলা-২ (BANGLA-II)' },
  'BANGLA_II': { code: 'BANGLA-II', name: 'বাংলা-২ (BANGLA-II)' },
  'BANGLA-2': { code: 'BANGLA-II', name: 'বাংলা-২ (BANGLA-II)' },
  'BANGLA2': { code: 'BANGLA-II', name: 'বাংলা-২ (BANGLA-II)' },
  'BANGLA': { code: 'BANGLA-II', name: 'বাংলা-২ (BANGLA-II)' },
  'বাংলা-২': { code: 'BANGLA-II', name: 'বাংলা-২ (BANGLA-II)' },
  'বাংলা ২': { code: 'BANGLA-II', name: 'বাংলা-২ (BANGLA-II)' },
  'বাংলা': { code: 'BANGLA-II', name: 'বাংলা-২ (BANGLA-II)' },
  '65722': { code: 'BANGLA-II', name: 'বাংলা-২ (BANGLA-II)' },
  '65721': { code: 'BANGLA-II', name: 'বাংলা-২ (BANGLA-II)' },

  'ENGLISH-II': { code: 'ENGLISH-II', name: 'ইংরেজি-২ (ENGLISH-II)' },
  'ENGLISH_II': { code: 'ENGLISH-II', name: 'ইংরেজি-২ (ENGLISH-II)' },
  'ENGLISH-2': { code: 'ENGLISH-II', name: 'ইংরেজি-২ (ENGLISH-II)' },
  'ENGLISH2': { code: 'ENGLISH-II', name: 'ইংরেজি-২ (ENGLISH-II)' },
  'ENGLISH': { code: 'ENGLISH-II', name: 'ইংরেজি-২ (ENGLISH-II)' },
  'ইংরেজি-২': { code: 'ENGLISH-II', name: 'ইংরেজি-২ (ENGLISH-II)' },
  'ইংরেজি ২': { code: 'ENGLISH-II', name: 'ইংরেজি-২ (ENGLISH-II)' },
  'ইংরেজি': { code: 'ENGLISH-II', name: 'ইংরেজি-২ (ENGLISH-II)' },

  'MATH-II': { code: 'MATH-II', name: 'ম্যাথমেটিক্স-২ (MATH-II)' },
  'MATH_II': { code: 'MATH-II', name: 'ম্যাথমেটিক্স-২ (MATH-II)' },
  'MATH-2': { code: 'MATH-II', name: 'ম্যাথমেটিক্স-২ (MATH-II)' },
  'MATH2': { code: 'MATH-II', name: 'ম্যাথমেটিক্স-২ (MATH-II)' },
  'MATHEMATICS-II': { code: 'MATH-II', name: 'ম্যাথমেটিক্স-২ (MATH-II)' },
  'MATHEMATICS_II': { code: 'MATH-II', name: 'ম্যাথমেটিক্স-২ (MATH-II)' },
  'MATHEMATICS-2': { code: 'MATH-II', name: 'ম্যাথমেটিক্স-২ (MATH-II)' },
  'ম্যাথমেটিক্স-২': { code: 'MATH-II', name: 'ম্যাথমেটিক্স-২ (MATH-II)' },
  'গণিত-২': { code: 'MATH-II', name: 'ম্যাথমেটিক্স-২ (MATH-II)' },
  'গণিত ২': { code: 'MATH-II', name: 'ম্যাথমেটিক্স-২ (MATH-II)' },
  '65921': { code: 'MATH-II', name: 'ম্যাথমেটিক্স-২ (MATH-II)' },

  'MECHANICAL-ENGINEERING-DRAWING': { code: 'MECHANICAL-ENGINEERING-DRAWING', name: 'মেকানিক্যাল ইঞ্জিনিয়ারিং ড্রয়িং (MED)' },
  'MECHANICAL_ENGINEERING_DRAWING': { code: 'MECHANICAL-ENGINEERING-DRAWING', name: 'মেকানিক্যাল ইঞ্জিনিয়ারিং ড্রয়িং (MED)' },
  'MECHANICAL-DRAWING': { code: 'MECHANICAL-ENGINEERING-DRAWING', name: 'মেকানিক্যাল ইঞ্জিনিয়ারিং ড্রয়িং (MED)' },
  'MED': { code: 'MECHANICAL-ENGINEERING-DRAWING', name: 'মেকানিক্যাল ইঞ্জিনিয়ারিং ড্রয়িং (MED)' },
  'মেকানিক্যাল ইঞ্জিনিয়ারিং ড্রয়িং': { code: 'MECHANICAL-ENGINEERING-DRAWING', name: 'মেকানিক্যাল ইঞ্জিনিয়ারিং ড্রয়িং (MED)' },
  'মেকানিক্যাল ড্রয়িং': { code: 'MECHANICAL-ENGINEERING-DRAWING', name: 'মেকানিক্যাল ইঞ্জিনিয়ারিং ড্রয়িং (MED)' },
  '67021': { code: 'MECHANICAL-ENGINEERING-DRAWING', name: 'মেকানিক্যাল ইঞ্জিনিয়ারিং ড্রয়িং (MED)' },
  '67011': { code: 'MECHANICAL-ENGINEERING-DRAWING', name: 'মেকানিক্যাল ইঞ্জিনিয়ারিং ড্রয়িং (MED)' },

  'BASIC-ELECTRICITY': { code: 'BASIC-ELECTRICITY', name: 'বেসিক ইলেকট্রিসিটি (BASIC ELECTRICITY)' },
  'BASIC_ELECTRICITY': { code: 'BASIC-ELECTRICITY', name: 'বেসিক ইলেকট্রিসিটি (BASIC ELECTRICITY)' },
  'BASIC ELECTRICITY': { code: 'BASIC-ELECTRICITY', name: 'বেসিক ইলেকট্রিসিটি (BASIC ELECTRICITY)' },
  'বেসিক ইলেকট্রিসিটি': { code: 'BASIC-ELECTRICITY', name: 'বেসিক ইলেকট্রিসিটি (BASIC ELECTRICITY)' },
  '66711': { code: 'BASIC-ELECTRICITY', name: 'বেসিক ইলেকট্রিসিটি (BASIC ELECTRICITY)' },

  'PHYSICS-II': { code: 'PHYSICS-II', name: 'ফিজিক্স-২ (PHYSICS-II)' },
  'PHYSICS_II': { code: 'PHYSICS-II', name: 'ফিজিক্স-২ (PHYSICS-II)' },
  'PHYSICS-2': { code: 'PHYSICS-II', name: 'ফিজিক্স-২ (PHYSICS-II)' },
  'PHYSICS2': { code: 'PHYSICS-II', name: 'ফিজিক্স-২ (PHYSICS-II)' },
  'PHYSICS': { code: 'PHYSICS-II', name: 'ফিজিক্স-২ (PHYSICS-II)' },
  'ফিজিক্স-২': { code: 'PHYSICS-II', name: 'ফিজিক্স-২ (PHYSICS-II)' },
  'ফিজিক্স ২': { code: 'PHYSICS-II', name: 'ফিজিক্স-২ (PHYSICS-II)' },
  'পদার্থবিজ্ঞান-২': { code: 'PHYSICS-II', name: 'ফিজিক্স-২ (PHYSICS-II)' },
  '65922': { code: 'PHYSICS-II', name: 'ফিজিক্স-২ (PHYSICS-II)' },

  // 1st Semester subjects
  'BANGLA-I': { code: 'BANGLA-I', name: 'বাংলা-১ (BANGLA-I)' },
  'BANGLA-1': { code: 'BANGLA-I', name: 'বাংলা-১ (BANGLA-I)' },
  'বাংলা-১': { code: 'BANGLA-I', name: 'বাংলা-১ (BANGLA-I)' },
  '65711': { code: 'BANGLA-I', name: 'বাংলা-১ (BANGLA-I)' },

  'ENGLISH-I': { code: 'ENGLISH-I', name: 'ইংরেজি-১ (ENGLISH-I)' },
  'ENGLISH-1': { code: 'ENGLISH-I', name: 'ইংরেজি-১ (ENGLISH-I)' },
  'ইংরেজি-১': { code: 'ENGLISH-I', name: 'ইংরেজি-১ (ENGLISH-I)' },
  '65712': { code: 'ENGLISH-I', name: 'ইংরেজি-১ (ENGLISH-I)' },

  'MATH-I': { code: 'MATH-I', name: 'ম্যাথমেটিক্স-১ (MATH-I)' },
  'MATH-1': { code: 'MATH-I', name: 'ম্যাথমেটিক্স-১ (MATH-I)' },
  'MATHEMATICS-I': { code: 'MATH-I', name: 'ম্যাথমেটিক্স-১ (MATH-I)' },
  'ম্যাথমেটিক্স-১': { code: 'MATH-I', name: 'ম্যাথমেটিক্স-১ (MATH-I)' },
  'গণিত-১': { code: 'MATH-I', name: 'ম্যাথমেটিক্স-১ (MATH-I)' },
  '65911': { code: 'MATH-I', name: 'ম্যাথমেটিক্স-১ (MATH-I)' },

  'PHYSICS-I': { code: 'PHYSICS-I', name: 'ফিজিক্স-১ (PHYSICS-I)' },
  'PHYSICS-1': { code: 'PHYSICS-I', name: 'ফিজিক্স-১ (PHYSICS-I)' },
  'ফিজিক্স-১': { code: 'PHYSICS-I', name: 'ফিজিক্স-১ (PHYSICS-I)' },
  'পদার্থবিজ্ঞান-১': { code: 'PHYSICS-I', name: 'ফিজিক্স-১ (PHYSICS-I)' },
  '65912': { code: 'PHYSICS-I', name: 'ফিজিক্স-১ (PHYSICS-I)' },

  'CHEMISTRY': { code: 'CHEMISTRY', name: 'কেমিস্ট্রি (CHEMISTRY)' },
  'রসায়ন': { code: 'CHEMISTRY', name: 'কেমিস্ট্রি (CHEMISTRY)' },
  'কেমিস্ট্রি': { code: 'CHEMISTRY', name: 'কেমিস্ট্রি (CHEMISTRY)' },
  '65913': { code: 'CHEMISTRY', name: 'কেমিস্ট্রি (CHEMISTRY)' },

  'COMPUTER-APPLICATION': { code: 'COMPUTER-APPLICATION', name: 'কম্পিউটার অ্যাপ্লিকেশন (COMPUTER APPLICATION)' },
  'COMPUTER_APPLICATION': { code: 'COMPUTER-APPLICATION', name: 'কম্পিউটার অ্যাপ্লিকেশন (COMPUTER APPLICATION)' },
  'কম্পিউটার অ্যাপ্লিকেশন': { code: 'COMPUTER-APPLICATION', name: 'কম্পিউটার অ্যাপ্লিকেশন (COMPUTER APPLICATION)' },
  '66611': { code: 'COMPUTER-APPLICATION', name: 'কম্পিউটার অ্যাপ্লিকেশন (COMPUTER APPLICATION)' },

  'PROGRAMMING-ESSENTIALS': { code: 'PROGRAMMING-ESSENTIALS', name: 'প্রোগ্রামিং এসেনশিয়ালস (PROGRAMMING ESSENTIALS)' },
  'প্রোগ্রামিং এসেনশিয়ালস': { code: 'PROGRAMMING-ESSENTIALS', name: 'প্রোগ্রামিং এসেনশিয়ালস (PROGRAMMING ESSENTIALS)' },
  '66621': { code: 'PROGRAMMING-ESSENTIALS', name: 'প্রোগ্রামিং এসেনশিয়ালস (PROGRAMMING ESSENTIALS)' },

  'BASIC-ELECTRONICS': { code: 'BASIC-ELECTRONICS', name: 'বেসিক ইলেকট্রনিক্স (BASIC ELECTRONICS)' },
  'বেসিক ইলেকট্রনিক্স': { code: 'BASIC-ELECTRONICS', name: 'বেসিক ইলেকট্রনিক্স (BASIC ELECTRONICS)' },
  '66811': { code: 'BASIC-ELECTRONICS', name: 'বেসিক ইলেকট্রনিক্স (BASIC ELECTRONICS)' },
};

const RESERVED_STUDENT_KEYS = new Set([
  'roll',
  'rollnumber',
  'studentroll',
  'name',
  'studentname',
  'studentid',
  'id',
  'registration',
  'reg',
  'registrationno',
  'exam',
  'examname',
  'examtitle',
  'semester',
  'semesterid',
  'department',
  'dept',
  'technology',
  'departmentname',
  'session',
  'shift',
  'status',
  'meritrank',
  'gpa',
  'grade',
  'lettergrade',
  'totalmarks',
  'totalobtainedmarks',
  'totalfullmarks',
  'ispassed',
  'verificationcode',
  'createdat',
  'updatedat',
  'publishedat',
  'remarks',
  'errors',
  'isvalid',
  'rownumber',
  'subjects',
  'marks',
  'fullmarks',
  'maxmarks',
  'result',
  'results',
]);

/**
 * Normalizes a subject key into a canonical alphanumeric string for comparison.
 * e.g., 'BANGLA-II', 'BANGLA_2', 'বাংলা-২', 'Bangla 2' -> canonical forms
 */
export function normalizeSubjectKey(raw: string): string {
  if (!raw) return '';
  return String(raw)
    .trim()
    .toUpperCase()
    .replace(/\bVIII\b/g, '8')
    .replace(/\bVII\b/g, '7')
    .replace(/\bVI\b/g, '6')
    .replace(/\bIV\b/g, '4')
    .replace(/\bV\b/g, '5')
    .replace(/\bIII\b/g, '3')
    .replace(/\bII\b/g, '2')
    .replace(/\bI\b/g, '1')
    .replace(/-II$/g, '2')
    .replace(/_II$/g, '2')
    .replace(/-I$/g, '1')
    .replace(/_I$/g, '1')
    .replace(/-III$/g, '3')
    .replace(/_III$/g, '3')
    .replace(/১/g, '1')
    .replace(/২/g, '2')
    .replace(/৩/g, '3')
    .replace(/৪/g, '4')
    .replace(/৫/g, '5')
    .replace(/৬/g, '6')
    .replace(/৭/g, '7')
    .replace(/৮/g, '8')
    .replace(/৯/g, '9')
    .replace(/০/g, '0')
    .replace(/[^A-Z0-9\u0980-\u09FF]/g, '');
}

/**
 * Dynamically resolves subject metadata (code, name, fullMarks) by matching
 * against available exam subjects, known subjects map, or clean fallback.
 */
export function resolveSubjectMeta(
  rawCodeOrName: string,
  explicitFullMarks?: number,
  examSubjects?: ExamSubject[]
): ExamSubject {
  const trimmed = String(rawCodeOrName || '').trim();
  if (!trimmed) {
    return { code: 'SUB', name: 'বিষয়', fullMarks: explicitFullMarks || 100 };
  }

  const normalizedUpper = trimmed.toUpperCase();
  const normalizedKey = normalizedUpper.replace(/\s+/g, '_');
  const dashKey = normalizedUpper.replace(/\s+/g, '-');
  const canonKey = normalizeSubjectKey(trimmed);

  // 1. Check against Exam Subjects configuration first if provided
  if (Array.isArray(examSubjects) && examSubjects.length > 0) {
    // Exact code match
    const exactCode = examSubjects.find((s) => s.code.trim().toUpperCase() === normalizedUpper);
    if (exactCode) {
      const examF = Number(exactCode.fullMarks) || Number((exactCode as any).f);
      return {
        code: exactCode.code,
        name: exactCode.name,
        fullMarks: explicitFullMarks || examF || 0,
      };
    }

    // Exact name match
    const exactName = examSubjects.find((s) => s.name.trim().toUpperCase() === normalizedUpper);
    if (exactName) {
      const examF = Number(exactName.fullMarks) || Number((exactName as any).f);
      return {
        code: exactName.code,
        name: exactName.name,
        fullMarks: explicitFullMarks || examF || 0,
      };
    }

    // Canonical normalized key match
    const canonMatch = examSubjects.find((s) => {
      const sCodeNorm = normalizeSubjectKey(s.code);
      const sNameNorm = normalizeSubjectKey(s.name);
      return (
        sCodeNorm === canonKey ||
        sNameNorm === canonKey ||
        (canonKey.length >= 3 && (sCodeNorm.includes(canonKey) || sNameNorm.includes(canonKey)))
      );
    });
    if (canonMatch) {
      const examF = Number(canonMatch.fullMarks) || Number((canonMatch as any).f);
      return {
        code: canonMatch.code,
        name: canonMatch.name,
        fullMarks: explicitFullMarks || examF || 0,
      };
    }

    // Substring / inclusion match
    const subMatch = examSubjects.find(
      (s) =>
        s.code.toUpperCase().includes(normalizedUpper) ||
        normalizedUpper.includes(s.code.toUpperCase()) ||
        s.name.toUpperCase().includes(normalizedUpper) ||
        normalizedUpper.includes(s.name.toUpperCase())
    );
    if (subMatch) {
      const examF = Number(subMatch.fullMarks) || Number((subMatch as any).f);
      return {
        code: subMatch.code,
        name: subMatch.name,
        fullMarks: explicitFullMarks || examF || 0,
      };
    }
  }

  // 2. Check KNOWN_SUBJECTS_MAP dictionary
  if (KNOWN_SUBJECTS_MAP[trimmed]) {
    const info = KNOWN_SUBJECTS_MAP[trimmed];
    return { code: info.code, name: info.name, fullMarks: explicitFullMarks || 0 };
  }
  if (KNOWN_SUBJECTS_MAP[normalizedUpper]) {
    const info = KNOWN_SUBJECTS_MAP[normalizedUpper];
    return { code: info.code, name: info.name, fullMarks: explicitFullMarks || 0 };
  }
  if (KNOWN_SUBJECTS_MAP[normalizedKey]) {
    const info = KNOWN_SUBJECTS_MAP[normalizedKey];
    return { code: info.code, name: info.name, fullMarks: explicitFullMarks || 0 };
  }
  if (KNOWN_SUBJECTS_MAP[dashKey]) {
    const info = KNOWN_SUBJECTS_MAP[dashKey];
    return { code: info.code, name: info.name, fullMarks: explicitFullMarks || 0 };
  }

  // Canonical dictionary lookup
  for (const [k, info] of Object.entries(KNOWN_SUBJECTS_MAP)) {
    if (normalizeSubjectKey(k) === canonKey) {
      return { code: info.code, name: info.name, fullMarks: explicitFullMarks || 0 };
    }
  }

  // Check prefix or partial match in known subjects
  for (const [k, info] of Object.entries(KNOWN_SUBJECTS_MAP)) {
    if (normalizedUpper === k.toUpperCase() || normalizedUpper.startsWith(k.toUpperCase() + '_')) {
      return { code: info.code, name: info.name, fullMarks: explicitFullMarks || 0 };
    }
  }

  // 3. Check against MASTER_CURRICULUM_DATA (313 subjects from official PDF)
  // Match by exact subjectCode
  const masterCodeMatch = MASTER_CURRICULUM_DATA.find((s) => s.subjectCode.toUpperCase() === normalizedUpper);
  if (masterCodeMatch) {
    return {
      code: masterCodeMatch.subjectCode,
      name: masterCodeMatch.subjectName,
      fullMarks: explicitFullMarks || Number(masterCodeMatch.curriculumFullMarks) || 0,
    };
  }

  // Match by canonical subject name
  const masterNameMatch = MASTER_CURRICULUM_DATA.find((s) => {
    const norm = normalizeSubjectKey(s.subjectName);
    return norm === canonKey || (canonKey.length >= 3 && norm.includes(canonKey));
  });
  if (masterNameMatch) {
    return {
      code: masterNameMatch.subjectCode,
      name: masterNameMatch.subjectName,
      fullMarks: explicitFullMarks || Number(masterNameMatch.curriculumFullMarks) || 0,
    };
  }

  // 4. Fallback clean metadata
  let cleanName = trimmed;
  if (cleanName.includes('_')) {
    const parts = cleanName.split('_');
    cleanName = parts.slice(1).join(' ').trim() || parts[0].trim();
  }

  return {
    code: trimmed,
    name: cleanName || trimmed,
    fullMarks: explicitFullMarks || 0,
  };
}

// Generate sample Excel template for download
export function generateSampleExcel(exam?: Exam | null): void {
  const subjects =
    exam?.subjects && exam.subjects.length > 0
      ? exam.subjects
      : [
          { code: 'BANGLA-II', name: 'বাংলা-২ (BANGLA-II)', fullMarks: 45 },
          { code: 'ENGLISH-II', name: 'ইংরেজি-২ (ENGLISH-II)', fullMarks: 45 },
          { code: 'MATH-II', name: 'ম্যাথমেটিক্স-২ (MATH-II)', fullMarks: 45 },
          { code: 'MECHANICAL-ENGINEERING-DRAWING', name: 'মেকানিক্যাল ইঞ্জিনিয়ারিং ড্রয়িং (MED)', fullMarks: 45 },
          { code: 'BASIC-ELECTRICITY', name: 'বেসিক ইলেকট্রিসিটি (BASIC ELECTRICITY)', fullMarks: 45 },
          { code: 'PHYSICS-II', name: 'ফিজিক্স-২ (PHYSICS-II)', fullMarks: 45 },
        ];

  const headers = ['Roll', 'Name', 'Student_ID', 'Registration'];
  if (!exam) {
    headers.unshift('Exam_Name', 'Semester', 'Technology');
  }

  subjects.forEach((sub) => {
    headers.push(`${sub.code}_${sub.name.replace(/\s+/g, '_')}`);
  });

  const sampleData = [
    headers,
    !exam
      ? [
          '২য় পর্ব মডেল টেস্ট ২০২৬',
          '2',
          'Computer',
          '601234',
          'মোঃ আরিয়ান আহমেদ',
          'DPIB-2026-001',
          '1502345678',
          ...subjects.map(() => 38),
        ]
      : ['601234', 'মোঃ আরিয়ান আহমেদ', 'DPIB-2026-001', '1502345678', ...subjects.map(() => 38)],
    !exam
      ? [
          '২য় পর্ব মডেল টেস্ট ২০২৬',
          '2',
          'Civil',
          '601235',
          'সাদিয়া সুলতানা',
          'DPIB-2026-002',
          '1502345679',
          ...subjects.map(() => 41),
        ]
      : ['601235', 'সাদিয়া সুলতানা', 'DPIB-2026-002', '1502345679', ...subjects.map(() => 41)],
    !exam
      ? [
          '২য় পর্ব মডেল টেস্ট ২০২৬',
          '2',
          'Electrical',
          '601236',
          'তানভীর হোসেন',
          'DPIB-2026-003',
          '1502345680',
          ...subjects.map(() => 39),
        ]
      : ['601236', 'তানভীর হোসেন', 'DPIB-2026-003', '1502345680', ...subjects.map(() => 39)],
    !exam
      ? [
          '২য় পর্ব মডেল টেস্ট ২০২৬',
          '2',
          'Mechanical',
          '601237',
          'নুসরাত জাহান',
          'DPIB-2026-004',
          '1502345681',
          ...subjects.map(() => 42),
        ]
      : ['601237', 'নুসরাত জাহান', 'DPIB-2026-004', '1502345681', ...subjects.map(() => 42)],
  ];

  const ws = XLSX.utils.aoa_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Results_Template');
  const fileName = exam
    ? `${exam.title.replace(/\s+/g, '_')}_Result_Template.xlsx`
    : 'DPIB_Model_Test_2026_Results_Template.xlsx';
  XLSX.writeFile(wb, fileName);
}

export function generateExcelTemplate(exam?: Exam | null): void {
  generateSampleExcel(exam);
}

export function generateSampleJson(exam?: Exam | null): string {
  if (!exam) {
    return JSON.stringify(
      [
        {
          examTitle: '২য় পর্ব মডেল টেস্ট ২০২৬',
          semester: '2',
          department: 'Computer',
          roll: '601234',
          name: 'মোঃ আরিয়ান আহমেদ',
          studentId: 'DPIB-2026-001',
          registration: '1502345678',
          'BANGLA-II': { marks: 38, fullMarks: 45 },
          'ENGLISH-II': { marks: 40, fullMarks: 45 },
          'MATH-II': { marks: 42, fullMarks: 45 },
          'MECHANICAL-ENGINEERING-DRAWING': { marks: 35, fullMarks: 45 },
          'BASIC-ELECTRICITY': { marks: 41, fullMarks: 45 },
          'PHYSICS-II': { marks: 39, fullMarks: 45 },
        },
        {
          examTitle: '২য় পর্ব মডেল টেস্ট ২০২৬',
          semester: '2',
          department: 'Civil',
          roll: '601235',
          name: 'সাদিয়া সুলতানা',
          studentId: 'DPIB-2026-002',
          registration: '1502345679',
          'BANGLA-II': { marks: 36, fullMarks: 45 },
          'ENGLISH-II': { marks: 39, fullMarks: 45 },
          'MATH-II': { marks: 44, fullMarks: 45 },
          'MECHANICAL-ENGINEERING-DRAWING': { marks: 38, fullMarks: 45 },
          'BASIC-ELECTRICITY': { marks: 40, fullMarks: 45 },
          'PHYSICS-II': { marks: 42, fullMarks: 45 },
        },
        {
          examTitle: '২য় পর্ব মডেল টেস্ট ২০২৬',
          semester: '2',
          department: 'Electrical',
          roll: '601236',
          name: 'তানভীর হোসেন',
          studentId: 'DPIB-2026-003',
          registration: '1502345680',
          'BANGLA-II': { marks: 39, fullMarks: 45 },
          'ENGLISH-II': { marks: 37, fullMarks: 45 },
          'MATH-II': { marks: 40, fullMarks: 45 },
          'MECHANICAL-ENGINEERING-DRAWING': { marks: 36, fullMarks: 45 },
          'BASIC-ELECTRICITY': { marks: 43, fullMarks: 45 },
          'PHYSICS-II': { marks: 38, fullMarks: 45 },
        },
        {
          examTitle: '২য় পর্ব মডেল টেস্ট ২০২৬',
          semester: '2',
          department: 'Mechanical',
          roll: '601237',
          name: 'নুসরাত জাহান',
          studentId: 'DPIB-2026-004',
          registration: '1502345681',
          'BANGLA-II': { marks: 41, fullMarks: 45 },
          'ENGLISH-II': { marks: 42, fullMarks: 45 },
          'MATH-II': { marks: 43, fullMarks: 45 },
          'MECHANICAL-ENGINEERING-DRAWING': { marks: 40, fullMarks: 45 },
          'BASIC-ELECTRICITY': { marks: 39, fullMarks: 45 },
          'PHYSICS-II': { marks: 44, fullMarks: 45 },
        },
      ],
      null,
      2
    );
  }

  const sampleSubjects: { [code: string]: { marks: number; fullMarks: number } } = {};
  exam.subjects.forEach((sub) => {
    const full = Number(sub.fullMarks) || 100;
    sampleSubjects[sub.code] = {
      marks: Math.round(full * 0.85),
      fullMarks: full,
    };
  });

  return JSON.stringify(
    [
      {
        examTitle: exam.title,
        semester: exam.semesterId,
        department: exam.departmentName,
        roll: '601234',
        name: 'মোঃ আরিয়ান আহমেদ',
        studentId: 'DPIB-2026-001',
        registration: '1502345678',
        ...sampleSubjects,
      },
      {
        examTitle: exam.title,
        semester: exam.semesterId,
        department: exam.departmentName,
        roll: '601235',
        name: 'সাদিয়া সুলতানা',
        studentId: 'DPIB-2026-002',
        registration: '1502345679',
        ...sampleSubjects,
      },
    ],
    null,
    2
  );
}

export function normalizeSemester(sem: string | undefined): SemesterId {
  if (!sem) return '2';
  const clean = toEnglishDigits(String(sem).toLowerCase().replace(/[^0-9]/g, ''));
  if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(clean)) {
    return clean as SemesterId;
  }
  return '2';
}

export function normalizeDepartment(dept: string | undefined): { id: string; name: string } {
  if (!dept) return { id: 'cmt', name: 'কম্পিউটার টেকনোলজি' };
  const raw = String(dept).trim();
  const d = raw.toLowerCase();

  // Civil Technology
  if (d.includes('civil') || d.includes('সিভিল') || d.includes('ct') || d.includes('ce')) {
    return { id: 'ct', name: 'সিভিল টেকনোলজি' };
  }
  // Electrical Technology
  if (d.includes('elect') || d.includes('ইলেকট্রিক্যাল') || d.includes('et') || d.includes('eee') || d.includes('ee')) {
    return { id: 'et', name: 'ইলেকট্রিক্যাল টেকনোলজি' };
  }
  // Mechanical Technology
  if (d.includes('mech') || d.includes('মেকানিক্যাল') || d.includes('mt') || d.includes('me')) {
    return { id: 'mt', name: 'মেকানিক্যাল টেকনোলজি' };
  }
  // Computer Technology
  if (d.includes('comp') || d.includes('কম্পিউটার') || d.includes('cmt') || d.includes('cse') || d.includes('cst') || d.includes('it')) {
    return { id: 'cmt', name: 'কম্পিউটার টেকনোলজি' };
  }
  // RAC (Refrigeration and Air Conditioning)
  if (d.includes('rac') || d.includes('রেফ্রিজারেশন') || d.includes('refrigeration')) {
    return { id: 'rac', name: 'আরএসি টেকনোলজি' };
  }
  // Electronics
  if (d.includes('electron') || d.includes('ইলেকট্রনিক্স') || d.includes('ent')) {
    return { id: 'ent', name: 'ইলেকট্রনিক্স টেকনোলজি' };
  }
  // Architecture
  if (d.includes('arch') || d.includes('আর্কিটেকচার') || d.includes('at')) {
    return { id: 'at', name: 'আর্কিটেকচার টেকনোলজি' };
  }

  // Preserve provided custom department name cleanly
  const cleanId = raw.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'gen';
  return { id: cleanId, name: raw };
}

export async function parseExcelFile(
  file: File,
  exam?: Exam | null,
  status: 'PUBLISHED' | 'DRAFT' = 'PUBLISHED',
  gradingRules: GradingRule[] = DEFAULT_GRADING_RULES,
  allExams: Exam[] = []
): Promise<ValidationReport> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer || buffer.byteLength === 0) {
          return resolve({
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            rawHeaders: [],
            rawRows: [],
            rows: [],
            results: [],
            errors: ['নির্বাচিত ফাইলটি ফাঁকা বা পড়তে কোনো সমস্যা হয়েছে।'],
            summaryMessage: 'নির্বাচিত ফাইলটি ফাঁকা।',
            fileName: file.name,
          });
        }

        const data = new Uint8Array(buffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          return resolve({
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            rawHeaders: [],
            rawRows: [],
            rows: [],
            results: [],
            errors: ['এক্সেল ফাইলে কোনো ওয়ার্কশিট পাওয়া যায়নি।'],
            summaryMessage: 'কোনো ওয়ার্কশিট নেই।',
            fileName: file.name,
          });
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawJson || rawJson.length === 0) {
          return resolve({
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            rawHeaders: [],
            rawRows: [],
            rows: [],
            results: [],
            errors: ['ফাইলে কোনো ফলাফলের তথ্য পাওয়া যায়নি।'],
            summaryMessage: 'ফাইলটি ফাঁকা।',
            fileName: file.name,
            sheetName: firstSheetName,
          });
        }

        // Locate header row by scanning first 10 rows (handles sheets with institution banners or title headers)
        let headerRowIndex = 0;
        let rollIndex = -1;
        let nameIndex = -1;
        let idIndex = -1;
        let regIndex = -1;
        let examNameIndex = -1;
        let semesterIndex = -1;
        let deptIndex = -1;
        let foundHeader = false;

        for (let r = 0; r < Math.min(rawJson.length, 10); r++) {
          const row = (rawJson[r] || []).map((c: any) => String(c ?? '').trim());
          if (row.length === 0 || row.every((c: string) => c === '')) continue;

          const rIndex = row.findIndex((h: string) =>
            /^(roll|রোল|board_roll|student_roll|roll_no|rollno|বোর্ড রোল|রোল নম্বর)$/i.test(h) ||
            /(^|\b)(roll|রোল)(\b|$)/i.test(h)
          );
          const nIndex = row.findIndex((h: string) =>
            !/exam|dept|subject|টেকনোলজি/i.test(h) &&
            (/^(name|নাম|student_name|শিক্ষার্থীর নাম|শিক্ষার্থী)$/i.test(h) || /(^|\b)(name|নাম)(\b|$)/i.test(h))
          );

          if (rIndex !== -1 || (nIndex !== -1 && row.length >= 3)) {
            headerRowIndex = r;
            rollIndex = rIndex;
            nameIndex = nIndex;
            foundHeader = true;
            break;
          }
        }

        if (!foundHeader) {
          headerRowIndex = 0;
        }

        const rawHeaderRow: any[] = rawJson[headerRowIndex] || [];
        const headerRow: string[] = rawHeaderRow.map((h: any, idx: number) => {
          const val = String(h ?? '').trim();
          return val || `কলাম ${idx + 1}`;
        });

        // Filter valid data rows below header row
        const dataRows = rawJson.slice(headerRowIndex + 1).filter(
          (r) => r && r.length > 0 && !r.every((c: any) => c === '' || c === undefined || c === null)
        );

        if (rollIndex === -1) {
          rollIndex = headerRow.findIndex((h) => /roll|রোল/i.test(h));
        }
        if (nameIndex === -1) {
          nameIndex = headerRow.findIndex((h) => !/exam|dept|subject|টেকনোলজি/i.test(h) && /name|নাম|student|শিক্ষার্থী/i.test(h));
        }
        idIndex = headerRow.findIndex((h) => /(^|\b)(id|আইডি|student_id|studentid|admission_id)(\b|$)/i.test(h));
        regIndex = headerRow.findIndex((h) => /reg|রেজিস্ট্রেশন|registration|reg_no|রেজি/i.test(h));
        examNameIndex = headerRow.findIndex((h) => /exam|পরীক্ষা|exam_name|title|পরীক্ষার নাম/i.test(h));
        semesterIndex = headerRow.findIndex((h) => /semester|সেমিস্টার|sem|পর্ব/i.test(h));
        deptIndex = headerRow.findIndex((h) => /dept|department|technology|টেকনোলজি|বিভাগ|টেক/i.test(h));

        // Smart fallback: if rollIndex is still -1, check if column 0 contains numeric rolls
        if (rollIndex === -1 && dataRows.length > 0) {
          const col0Sample = dataRows.slice(0, 5).map((r) => toEnglishDigits(String(r[0] || '').trim()));
          if (col0Sample.some((val) => /^\d{4,8}$/.test(val))) {
            rollIndex = 0;
            if (nameIndex === -1 && dataRows.some((r) => String(r[1] || '').trim().length > 1)) {
              nameIndex = 1;
            }
          }
        }

        let targetExam: Exam | null = exam || null;
        let detectedExamTitle = '';
        let detectedSemester: SemesterId = '2';
        let detectedDept = { id: 'cmt', name: 'কম্পিউটার টেকনোলজি' };

        // Look in pre-header rows for title or department info
        for (let r = 0; r < headerRowIndex; r++) {
          const text = (rawJson[r] || []).map((c: any) => String(c ?? '').trim()).join(' ');
          if (text) {
            if (/সেমিস্টার|পর্ব|1st|2nd|3rd|4th|5th|6th|7th|8th/i.test(text)) {
              detectedSemester = normalizeSemester(text);
            }
            if (/কম্পিউটার|সিভিল|ইলেকট্রিক্যাল|মেকানিক্যাল|আরএসি|ইলেকট্রনিক্স|আর্কিটেকচার|cmt|ct|et|mt|rac|ent/i.test(text)) {
              detectedDept = normalizeDepartment(text);
            }
            if (!detectedExamTitle && /মডেল টেস্ট|পরীক্ষা|পর্ব সমাপনী|মিডটার্ম|টেস্ট/i.test(text)) {
              detectedExamTitle = text;
            }
          }
        }

        for (const row of dataRows) {
          if (row && row.length > 0) {
            if (examNameIndex !== -1 && row[examNameIndex]) {
              detectedExamTitle = String(row[examNameIndex]).trim();
            }
            if (semesterIndex !== -1 && row[semesterIndex]) {
              detectedSemester = normalizeSemester(String(row[semesterIndex]).trim());
            }
            if (deptIndex !== -1 && row[deptIndex]) {
              detectedDept = normalizeDepartment(String(row[deptIndex]).trim());
            }
            if (detectedExamTitle) break;
          }
        }

        if (!detectedExamTitle) {
          detectedExamTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim() || '২য় পর্ব মডেল টেস্ট ২০২৬';
        }

        if (!targetExam) {
          const matchedExam = allExams.find(
            (ex) =>
              ex.title.toLowerCase() === detectedExamTitle.toLowerCase() ||
              (ex.semesterId === detectedSemester && ex.departmentId === detectedDept.id)
          );
          if (matchedExam) {
            targetExam = matchedExam;
          }
        }

        const excludedIndices = new Set([
          rollIndex,
          nameIndex,
          idIndex,
          regIndex,
          examNameIndex,
          semesterIndex,
          deptIndex,
        ]);

        // Add indices for summary/metadata columns so they are not treated as subjects
        headerRow.forEach((colName, colIdx) => {
          if (
            /(^|\b)(total|মোট|মোট নম্বর|total_marks|gpa|জিপিএ|point|grade|লেটার গ্রেড|letter_grade|lg|status|অবস্থা|result|ফলাফল|remarks|মন্তব্য|sl|ক্রমিক|action)(\b|$)/i.test(
              colName
            )
          ) {
            excludedIndices.add(colIdx);
          }
        });

        const detectedSubjects: ExamSubject[] = [];
        const colSubjectMap: { [colIdx: number]: ExamSubject } = {};

        headerRow.forEach((colName, colIdx) => {
          if (excludedIndices.has(colIdx) || !colName) return;

          // Check if column name contains explicit full marks, e.g. "BANGLA_40", "MATH (30)", "বেসিক (পূর্ণমান ২০)"
          let colFullMarks: number | undefined;
          const matchFull = colName.match(/[\(_\[](\d+)[\)_\]]$|[_ -](\d+)$|পূর্ণমান[:\s]*(\d+)/);
          if (matchFull) {
            const extracted = Number(matchFull[1] || matchFull[2] || matchFull[3]);
            if (extracted > 0) colFullMarks = extracted;
          }

          const meta = resolveSubjectMeta(colName, colFullMarks, targetExam?.subjects);
          detectedSubjects.push(meta);
          colSubjectMap[colIdx] = meta;
        });

        const uniqueSubjectMap = new Map<string, ExamSubject>();
        detectedSubjects.forEach((s) => uniqueSubjectMap.set(s.code, s));
        const effectiveSubjects: ExamSubject[] =
          uniqueSubjectMap.size > 0
            ? Array.from(uniqueSubjectMap.values())
            : targetExam && targetExam.subjects.length > 0
            ? targetExam.subjects
            : [];

        let autoCreated = false;
        if (!targetExam) {
          autoCreated = true;
          targetExam = {
            id: `exam_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            title: detectedExamTitle || 'মডেল টেস্ট ২০২৬',
            semesterId: detectedSemester,
            departmentId: detectedDept.id,
            departmentName: detectedDept.name,
            examType: 'মডেল টেস্ট',
            examDate: new Date().toISOString().split('T')[0],
            totalMarks: effectiveSubjects.reduce((sum, s) => sum + (Number(s.fullMarks) || 100), 0),
            subjects: effectiveSubjects,
            status: 'PUBLISHED',
            allowMeritList: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
        }

        const parsedRows: ParsedRow[] = [];
        const studentResults: StudentResult[] = [];
        const globalErrors: string[] = [];

        if (dataRows.length === 0) {
          return resolve({
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            rawHeaders: headerRow,
            rawRows: [],
            rows: [],
            results: [],
            errors: ['ফাইলে কোনো ডাটা সারি পাওয়া যায়নি।'],
            summaryMessage: 'কোনো ডাটা সারি পাওয়া যায়নি।',
            fileName: file.name,
            sheetName: firstSheetName,
            detectedExam: targetExam,
            detectedSubjects: effectiveSubjects,
          });
        }

        dataRows.forEach((row, rIdx) => {
          if (!row || row.length === 0 || row.every((c: any) => c === undefined || c === '')) {
            return;
          }

          const rowNumber = headerRowIndex + rIdx + 2;
          const rowErrors: string[] = [];

          const rawRoll = rollIndex !== -1 && row[rollIndex] !== undefined ? String(row[rollIndex]).trim() : '';
          const roll = toEnglishDigits(rawRoll);
          const rawName = nameIndex !== -1 && row[nameIndex] !== undefined ? String(row[nameIndex]).trim() : '';
          const studentName = rawName || (roll ? `শিক্ষার্থী (${toBanglaDigits(roll)})` : '');
          const studentId = idIndex !== -1 && row[idIndex] !== undefined ? String(row[idIndex]).trim() : roll ? `DPIB-${roll}` : '';
          const registration = regIndex !== -1 && row[regIndex] !== undefined ? String(row[regIndex]).trim() : '';

          // Student-specific department & semester if specified in row
          const rowDept = deptIndex !== -1 && row[deptIndex] ? normalizeDepartment(String(row[deptIndex]).trim()) : detectedDept;
          const rowSemester = semesterIndex !== -1 && row[semesterIndex] ? normalizeSemester(String(row[semesterIndex]).trim()) : detectedSemester;
          const rowExamTitle = examNameIndex !== -1 && row[examNameIndex] ? String(row[examNameIndex]).trim() : detectedExamTitle;

          if (!roll) {
            rowErrors.push(`সারি ${toBanglaDigits(rowNumber)}: রোল নম্বর অনুপস্থিত`);
          }
          if (!rawName) {
            // Optional warning if student name is empty, but we assign fallback
            if (!roll) {
              rowErrors.push(`সারি ${toBanglaDigits(rowNumber)}: শিক্ষার্থীর নাম ও রোল উভয়ই অনুপস্থিত`);
            }
          }

          const subjectMarks: { [code: string]: number } = {};
          const subjectResults: SubjectResult[] = [];

          headerRow.forEach((colName, colIdx) => {
            if (excludedIndices.has(colIdx) || !colName) return;

            const rawVal = row[colIdx];
            // If cell is empty or absent, skip or record 0
            if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') {
              return;
            }

            const meta = colSubjectMap[colIdx] || resolveSubjectMeta(colName, undefined, targetExam?.subjects);
            let subFullMarks = Number(meta.fullMarks) > 0 ? Number(meta.fullMarks) : 0;
            if (!subFullMarks || subFullMarks <= 0) {
              subFullMarks = 100;
            }
            const cleanStr = String(rawVal).trim().toLowerCase();

            // Check if marked absent
            if (cleanStr === 'ab' || cleanStr === 'absent' || cleanStr === 'অনুপস্থিত') {
              subjectMarks[meta.code] = 0;
              subjectResults.push({
                subjectCode: meta.code,
                subjectName: meta.name,
                fullMarks: subFullMarks,
                obtainedMarks: 0,
                grade: 'F',
                gradePoint: 0,
                isPassed: false,
              });
              return;
            }

            const numericVal = Number(toEnglishDigits(cleanStr));

            if (isNaN(numericVal)) {
              rowErrors.push(`সারি ${toBanglaDigits(rowNumber)}: '${meta.name}' বিষয়ের নম্বর সঠিক নয় (${rawVal})`);
              subjectMarks[meta.code] = 0;
              subjectResults.push({
                subjectCode: meta.code,
                subjectName: meta.name,
                fullMarks: subFullMarks,
                obtainedMarks: 0,
                grade: 'F',
                gradePoint: 0,
                isPassed: false,
              });
            } else if (numericVal < 0) {
              rowErrors.push(`সারি ${toBanglaDigits(rowNumber)}: '${meta.name}' প্রাপ্ত নম্বর নেতিবাচক হতে পারে না (${numericVal})`);
              subjectMarks[meta.code] = numericVal;
              subjectResults.push({
                subjectCode: meta.code,
                subjectName: meta.name,
                fullMarks: subFullMarks,
                obtainedMarks: numericVal,
                grade: 'F',
                gradePoint: 0,
                isPassed: false,
              });
            } else if (subFullMarks > 0 && numericVal > subFullMarks) {
              rowErrors.push(
                `সারি ${toBanglaDigits(rowNumber)}: '${meta.name}' নম্বর পূর্ণমানের চেয়ে বেশি (${toBanglaDigits(numericVal)}/${toBanglaDigits(subFullMarks)})`
              );
              subjectMarks[meta.code] = numericVal;
              subjectResults.push({
                subjectCode: meta.code,
                subjectName: meta.name,
                fullMarks: subFullMarks,
                obtainedMarks: numericVal,
                grade: 'F',
                gradePoint: 0,
                isPassed: false,
              });
            } else {
              subjectMarks[meta.code] = numericVal;
              const subGrade = calculateSubjectGrade(numericVal, subFullMarks, gradingRules);
              subjectResults.push({
                subjectCode: meta.code,
                subjectName: meta.name,
                fullMarks: subFullMarks,
                obtainedMarks: numericVal,
                grade: subGrade.grade,
                gradePoint: subGrade.gradePoint,
                isPassed: subGrade.isPassed,
              });
            }
          });

          // If no subjects found for this student, check if effective subjects can be initialized with 0
          if (subjectResults.length === 0 && effectiveSubjects.length > 0) {
            rowErrors.push(`সারি ${toBanglaDigits(rowNumber)}: কোনো বিষয়ের নম্বর পাওয়া যায়নি`);
          }

          const isValid = rowErrors.length === 0 && Boolean(roll);
          let calculatedResult;

          if (isValid) {
            calculatedResult = {
              subjects: subjectResults,
              ...calculateOverallResult(subjectResults, gradingRules),
            };

            const studentDeptId = rowDept.id || targetExam!.departmentId;
            const studentDeptName = rowDept.name || targetExam!.departmentName;
            const studentExamId = targetExam!.id;

            studentResults.push({
              id: `${studentExamId}_${roll}`,
              examId: studentExamId,
              examTitle: rowExamTitle || targetExam!.title,
              examType: targetExam!.examType,
              examDate: targetExam!.examDate,
              semesterId: rowSemester || targetExam!.semesterId,
              departmentId: studentDeptId,
              departmentName: studentDeptName,
              studentName,
              roll,
              studentId,
              registration: registration || undefined,
              subjects: subjectResults,
              totalObtainedMarks: calculatedResult.totalObtainedMarks,
              totalFullMarks: calculatedResult.totalFullMarks,
              gpa: calculatedResult.gpa,
              letterGrade: calculatedResult.letterGrade,
              isPassed: calculatedResult.isPassed,
              status,
              publishedAt: status === 'PUBLISHED' ? Date.now() : undefined,
              verificationCode: `DPIB-${roll}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          } else {
            globalErrors.push(...rowErrors);
          }

          parsedRows.push({
            rowNumber,
            roll,
            studentName,
            studentId,
            registration,
            subjectMarks,
            isValid,
            errors: rowErrors,
            calculatedResult,
          });
        });

        const validRows = parsedRows.filter((r) => r.isValid).length;
        const invalidRows = parsedRows.filter((r) => !r.isValid).length;
        const totalRows = parsedRows.length;

        const rawRowsFormatted: RawRowData[] = dataRows.map((r, idx) => {
          const rowObj: { [k: string]: any } = {};
          headerRow.forEach((hdr, hIdx) => {
            rowObj[hdr] = r[hIdx] ?? '';
          });
          const parsedItem = parsedRows[idx];
          return {
            rowNumber: idx + 1,
            data: rowObj,
            isValid: parsedItem ? parsedItem.isValid : true,
            errors: parsedItem ? parsedItem.errors : [],
          };
        });

        const summaryMessage = `${toBanglaDigits(totalRows)}টি ফলাফল পাওয়া গেছে, ${toBanglaDigits(validRows)}টি সফলভাবে যাচাই হয়েছে${
          invalidRows > 0 ? `, ${toBanglaDigits(invalidRows)}টি ফলাফলে ত্রুটি রয়েছে` : ''
        }`;

        resolve({
          totalRows,
          validRows,
          invalidRows,
          rawHeaders: headerRow,
          rawRows: rawRowsFormatted,
          rows: parsedRows,
          results: studentResults,
          errors: globalErrors,
          summaryMessage,
          detectedExam: targetExam,
          detectedSubjects: effectiveSubjects,
          autoCreatedExam: autoCreated,
          sheetName: firstSheetName,
          fileName: file.name,
        });
      } catch (err: any) {
        reject(new Error(`এক্সেল ফাইল প্রসেস করতে ব্যর্থ হয়েছে: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error('ফাইল পড়তে ব্যর্থ হয়েছে'));
    reader.readAsArrayBuffer(file);
  });
}

export function parseJsonResults(
  jsonText: string,
  exam?: Exam | null,
  status: 'PUBLISHED' | 'DRAFT' = 'PUBLISHED',
  gradingRules: GradingRule[] = DEFAULT_GRADING_RULES,
  allExams: Exam[] = []
): ValidationReport {
  try {
    const parsed = JSON.parse(jsonText);
    const dataList: any[] = Array.isArray(parsed) ? parsed : parsed.results || parsed.data || [];

    if (!dataList || dataList.length === 0) {
      return {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        rawHeaders: [],
        rawRows: [],
        rows: [],
        results: [],
        errors: ['JSON ফাইলে কোনো ফলাফলের তথ্য পাওয়া যায়নি।'],
        summaryMessage: 'JSON ফাইলে কোনো ফলাফলের তথ্য পাওয়া যায়নি।',
      };
    }

    let targetExam: Exam | null = exam || null;
    let autoCreated = false;

    // Detect exam info from top-level JSON
    const topExamTitle = parsed.examTitle || parsed.examName || parsed.title || '';
    const topSemester = normalizeSemester(parsed.semester || parsed.semesterId);
    const topDept = normalizeDepartment(parsed.department || parsed.departmentName || parsed.departmentId);
    const explicitTopFullMarks = Number(parsed.fullMarks || parsed.defaultFullMarks || parsed.subjectFullMarks) || undefined;

    if (!targetExam && topExamTitle) {
      const match = allExams.find(
        (ex) =>
          ex.title.toLowerCase() === topExamTitle.toLowerCase() ||
          (ex.semesterId === topSemester && ex.departmentId === topDept.id)
      );
      if (match) targetExam = match;
    }

    // Optional explicit top-level full marks
    const defaultSubjectFullMarks = explicitTopFullMarks;

    // Step 1: Detect all unique subjects present in the JSON payload
    const detectedSubjectMetaMap = new Map<string, ExamSubject>();

    dataList.forEach((item) => {
      if (!item || typeof item !== 'object') return;

      const registerSubject = (rawKey: string, rawVal: any) => {
        if (!rawKey) return;
        let explicitFull: number | undefined;
        if (typeof rawVal === 'object' && rawVal !== null) {
          const rawF = (rawVal as any).fullMarks ?? (rawVal as any).f ?? (rawVal as any).full ?? (rawVal as any).maxMarks ?? (rawVal as any).subjectFullMarks ?? (rawVal as any).fm;
          if (Number(rawF) > 0) explicitFull = Number(rawF);
        }
        if (!explicitFull) {
          const rawF = (item as any)[`f_${rawKey}`] ?? (item as any)[`full_${rawKey}`] ?? (item as any)?.f?.[rawKey] ?? (item as any)?.fullMarks?.[rawKey];
          if (Number(rawF) > 0) explicitFull = Number(rawF);
        }
        const meta = resolveSubjectMeta(rawKey, explicitFull || defaultSubjectFullMarks, targetExam?.subjects);
        if (explicitFull) meta.fullMarks = explicitFull;
        detectedSubjectMetaMap.set(meta.code, meta);
      };

      // Case A: item.subjects as an Array
      if (Array.isArray(item.subjects)) {
        item.subjects.forEach((s: any) => {
          if (!s) return;
          const codeKey = s.subjectCode || s.code || s.name || s.subject;
          if (codeKey) {
            registerSubject(codeKey, s);
          }
        });
      }

      // Case B: item.subjects or item.marks as an Object map
      const objSubjects =
        typeof item.subjects === 'object' && !Array.isArray(item.subjects)
          ? item.subjects
          : typeof item.marks === 'object' && !Array.isArray(item.marks)
          ? item.marks
          : null;
      if (objSubjects) {
        Object.entries(objSubjects).forEach(([k, val]) => {
          registerSubject(k, val);
        });
      }

      // Case C: Flat keys directly on the student object
      Object.entries(item).forEach(([k, val]) => {
        const lowerK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (RESERVED_STUDENT_KEYS.has(lowerK) || RESERVED_STUDENT_KEYS.has(k.toLowerCase())) return;
        if (k.startsWith('f_') || k.startsWith('full_') || k.startsWith('fm_')) return;

        if (
          typeof val === 'number' ||
          (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(toEnglishDigits(val)))) ||
          (typeof val === 'object' && val !== null && ((val as any).obtainedMarks !== undefined || (val as any).marks !== undefined || (val as any).score !== undefined))
        ) {
          registerSubject(k, val);
        }
      });
    });

    const detectedSubjects: ExamSubject[] = Array.from(detectedSubjectMetaMap.values());

    const effectiveSubjects: ExamSubject[] =
      detectedSubjects.length > 0
        ? detectedSubjects
        : targetExam && targetExam.subjects.length > 0
        ? targetExam.subjects
        : [];

    const dynamicExamTotalFullMarks = effectiveSubjects.reduce(
      (sum, s) => sum + (Number(s.fullMarks) || defaultSubjectFullMarks || 100),
      0
    );

    if (!targetExam) {
      autoCreated = true;
      targetExam = {
        id: `exam_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: topExamTitle || 'মডেল টেস্ট ২০২৬',
        semesterId: topSemester,
        departmentId: topDept.id,
        departmentName: topDept.name,
        examType: 'মডেল টেস্ট',
        examDate: new Date().toISOString().split('T')[0],
        totalMarks: dynamicExamTotalFullMarks,
        subjects: effectiveSubjects,
        status: 'PUBLISHED',
        allowMeritList: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    const parsedRows: ParsedRow[] = [];
    const studentResults: StudentResult[] = [];
    const globalErrors: string[] = [];

    dataList.forEach((item, idx) => {
      const rowNumber = idx + 1;
      const rowErrors: string[] = [];

      const rawRoll = item.roll || item.rollNumber || item.studentRoll || item.Roll || item['রোল'] || '';
      const roll = toEnglishDigits(String(rawRoll).trim());
      const studentName =
        item.studentName ||
        item.name ||
        item.Name ||
        item.student_name ||
        item['নাম'] ||
        item['শিক্ষার্থীর নাম'] ||
        '';
      const rawSid = item.studentId || item.student_id;
      const studentId = (rawSid && !isFirestoreAutoId(rawSid))
        ? String(rawSid).trim()
        : (roll ? `DPIB-${roll}` : '');
      const registration = item.registration || item.reg || item.registrationNo || item['রেজিস্ট্রেশন'] || '';

      // Check item-level department and semester if present
      const itemDeptRaw = item.department || item.dept || item.technology || item.departmentName || item.departmentId;
      const itemDept = itemDeptRaw ? normalizeDepartment(String(itemDeptRaw).trim()) : topDept;
      const itemSemRaw = item.semester || item.semesterId || item.sem;
      const itemSemester = itemSemRaw ? normalizeSemester(String(itemSemRaw).trim()) : topSemester;
      const itemExamTitle = item.examTitle || item.examName || item.title || topExamTitle;

      if (!roll) rowErrors.push(`সারি ${rowNumber}: রোল নম্বর অনুপস্থিত`);
      if (!studentName) rowErrors.push(`সারি ${rowNumber}: শিক্ষার্থীর নাম অনুপস্থিত`);

      const subjectMarks: { [code: string]: number } = {};
      const subjectResults: SubjectResult[] = [];
      const studentSubjectEntries: { rawKey: string; rawVal: any; explicitFullMarks?: number }[] = [];

      // 1. Check item.subjects array
      if (Array.isArray(item.subjects)) {
        item.subjects.forEach((s: any) => {
          if (!s || typeof s !== 'object') return;
          const k = s.subjectCode || s.code || s.name || s.subject;
          const v = s.obtainedMarks ?? s.marks ?? s.score ?? s.val;
          const rawF = s.fullMarks ?? s.f ?? s.full ?? s.maxMarks ?? s.subjectFullMarks ?? s.fm ?? s.fMarks;
          if (k && v !== undefined && v !== null && String(v).trim() !== '') {
            studentSubjectEntries.push({
              rawKey: String(k),
              rawVal: v,
              explicitFullMarks: Number(rawF) > 0 ? Number(rawF) : undefined,
            });
          }
        });
      }

      // 2. Check item.subjects object or item.marks object
      const objMap =
        typeof item.subjects === 'object' && !Array.isArray(item.subjects)
          ? item.subjects
          : typeof item.marks === 'object' && !Array.isArray(item.marks)
          ? item.marks
          : null;

      if (objMap) {
        Object.entries(objMap).forEach(([k, v]) => {
          if (!k || v === undefined || v === null) return;
          let val = v;
          let full: number | undefined;
          if (typeof v === 'object' && v !== null) {
            val = (v as any).obtainedMarks ?? (v as any).marks ?? (v as any).score ?? (v as any).val;
            const rawF = (v as any).fullMarks ?? (v as any).f ?? (v as any).full ?? (v as any).maxMarks ?? (v as any).subjectFullMarks ?? (v as any).fm;
            if (Number(rawF) > 0) full = Number(rawF);
          }
          if (!full) {
            const rawF = (item as any)[`f_${k}`] ?? (item as any)[`full_${k}`] ?? (item as any)?.f?.[k] ?? (item as any)?.fullMarks?.[k];
            if (Number(rawF) > 0) full = Number(rawF);
          }
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            studentSubjectEntries.push({
              rawKey: k,
              rawVal: val,
              explicitFullMarks: full,
            });
          }
        });
      }

      // 3. Check flat keys on item
      Object.entries(item).forEach(([k, v]) => {
        if (!k || v === undefined || v === null) return;
        const lowerK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (RESERVED_STUDENT_KEYS.has(lowerK) || RESERVED_STUDENT_KEYS.has(k.toLowerCase())) return;
        if (k.startsWith('f_') || k.startsWith('full_') || k.startsWith('fm_')) return;

        let val = v;
        let full: number | undefined;
        if (typeof v === 'object' && v !== null) {
          val = (v as any).obtainedMarks ?? (v as any).marks ?? (v as any).score ?? (v as any).val;
          const rawF = (v as any).fullMarks ?? (v as any).f ?? (v as any).full ?? (v as any).maxMarks ?? (v as any).subjectFullMarks ?? (v as any).fm;
          if (Number(rawF) > 0) full = Number(rawF);
        }

        if (!full) {
          const rawF = (item as any)[`f_${k}`] ?? (item as any)[`full_${k}`] ?? (item as any)?.f?.[k] ?? (item as any)?.fullMarks?.[k];
          if (Number(rawF) > 0) full = Number(rawF);
        }

        if (val !== undefined && val !== null && String(val).trim() !== '') {
          const cleanStr = String(val).trim();
          if (!isNaN(Number(toEnglishDigits(cleanStr)))) {
            const alreadyAdded = studentSubjectEntries.some((e) => e.rawKey.toLowerCase() === k.toLowerCase());
            if (!alreadyAdded) {
              studentSubjectEntries.push({
                rawKey: k,
                rawVal: val,
                explicitFullMarks: full,
              });
            }
          }
        }
      });

      // Process ONLY the subjects present for this specific student
      studentSubjectEntries.forEach((entry) => {
        const meta = resolveSubjectMeta(
          entry.rawKey,
          entry.explicitFullMarks,
          targetExam?.subjects
        );
        let subFullMarks =
          Number(entry.explicitFullMarks) > 0
            ? Number(entry.explicitFullMarks)
            : Number(meta.fullMarks) > 0
            ? Number(meta.fullMarks)
            : 0;

        if (!subFullMarks || subFullMarks <= 0) {
          subFullMarks = 100;
        }

        const rawVal = entry.rawVal;
        const numericVal = Number(toEnglishDigits(String(rawVal).trim()));

        if (isNaN(numericVal)) {
          rowErrors.push(`সারি ${rowNumber}: '${meta.name}' বিষয়ের নম্বর সঠিক নয় (${rawVal})`);
          subjectMarks[meta.code] = 0;
          subjectResults.push({
            subjectCode: meta.code,
            subjectName: meta.name,
            fullMarks: subFullMarks,
            obtainedMarks: 0,
            grade: 'F',
            gradePoint: 0,
            isPassed: false,
          });
        } else if (numericVal < 0) {
          rowErrors.push(`সারি ${rowNumber}: '${meta.name}' প্রাপ্ত নম্বর নেতিবাচক হতে পারে না (${numericVal})`);
          subjectMarks[meta.code] = numericVal;
          subjectResults.push({
            subjectCode: meta.code,
            subjectName: meta.name,
            fullMarks: subFullMarks,
            obtainedMarks: numericVal,
            grade: 'F',
            gradePoint: 0,
            isPassed: false,
          });
        } else if (subFullMarks > 0 && numericVal > subFullMarks) {
          if (entry.explicitFullMarks) {
            rowErrors.push(`সারি ${rowNumber}: '${meta.name}' প্রাপ্ত নম্বর (${numericVal}) পূর্ণমান (${subFullMarks})-এর চেয়ে বেশি!`);
          } else {
            subFullMarks = numericVal <= 100 ? 100 : Math.ceil(numericVal / 50) * 50;
          }
          const gradeInfo = calculateSubjectGrade(numericVal, subFullMarks);
          subjectMarks[meta.code] = numericVal;
          subjectResults.push({
            subjectCode: meta.code,
            subjectName: meta.name,
            fullMarks: subFullMarks,
            obtainedMarks: numericVal,
            grade: gradeInfo.grade,
            gradePoint: gradeInfo.gradePoint,
            isPassed: gradeInfo.isPassed,
          });
        } else {
          subjectMarks[meta.code] = numericVal;
          const subGrade = calculateSubjectGrade(numericVal, subFullMarks, gradingRules);
          subjectResults.push({
            subjectCode: meta.code,
            subjectName: meta.name,
            fullMarks: subFullMarks,
            obtainedMarks: numericVal,
            grade: subGrade.grade,
            gradePoint: subGrade.gradePoint,
            isPassed: subGrade.isPassed,
          });
        }
      });

      const isValid = rowErrors.length === 0;
      let calculatedResult;

      if (isValid) {
        calculatedResult = {
          subjects: subjectResults,
          ...calculateOverallResult(subjectResults, gradingRules),
        };

        const studentDeptId = itemDept.id || targetExam!.departmentId;
        const studentDeptName = itemDept.name || targetExam!.departmentName;
        const studentExamId = targetExam!.id;

        studentResults.push({
          id: `${studentExamId}_${roll}`,
          examId: studentExamId,
          examTitle: itemExamTitle || targetExam!.title,
          examType: targetExam!.examType,
          examDate: targetExam!.examDate,
          semesterId: itemSemester || targetExam!.semesterId,
          departmentId: studentDeptId,
          departmentName: studentDeptName,
          studentName,
          roll,
          studentId,
          registration: registration || undefined,
          subjects: subjectResults,
          totalObtainedMarks: calculatedResult.totalObtainedMarks,
          totalFullMarks: calculatedResult.totalFullMarks,
          gpa: calculatedResult.gpa,
          letterGrade: calculatedResult.letterGrade,
          isPassed: calculatedResult.isPassed,
          status,
          publishedAt: status === 'PUBLISHED' ? Date.now() : undefined,
          verificationCode: `DPIB-${roll}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      } else {
        globalErrors.push(...rowErrors);
      }

      parsedRows.push({
        rowNumber,
        roll,
        studentName,
        studentId,
        registration,
        subjectMarks,
        isValid,
        errors: rowErrors,
        calculatedResult,
      });
    });

    const validRows = parsedRows.filter((r) => r.isValid).length;
    const invalidRows = parsedRows.filter((r) => !r.isValid).length;
    const totalRows = parsedRows.length;
    const rawHeaders = dataList.length > 0 && typeof dataList[0] === 'object' && dataList[0] !== null ? Object.keys(dataList[0]) : ['roll', 'name'];
    const rawRows: RawRowData[] = dataList.map((item, idx) => ({
      rowNumber: idx + 1,
      data: item && typeof item === 'object' ? item : { value: item },
      isValid: parsedRows[idx]?.isValid ?? true,
      errors: parsedRows[idx]?.errors || [],
    }));

    return {
      totalRows,
      validRows,
      invalidRows,
      rawHeaders,
      rawRows,
      rows: parsedRows,
      results: studentResults,
      errors: globalErrors,
      summaryMessage: `${totalRows}টি ফলাফল পাওয়া গেছে, ${validRows}টি সফলভাবে যাচাই হয়েছে${
        invalidRows > 0 ? `, ${invalidRows}টি ফলাফলে সমস্যা রয়েছে` : ''
      }`,
      detectedExam: targetExam,
      autoCreatedExam: autoCreated,
    };
  } catch (err: any) {
    throw new Error(`JSON ফাইল পড়তে ব্যর্থ: ${err.message}`);
  }
}
