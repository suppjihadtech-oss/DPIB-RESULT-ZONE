import * as XLSX from 'xlsx';
import {
  Exam,
  ExamSubject,
  GradingRule,
  SemesterId,
  StudentResult,
  SubjectResult,
  BookItem,
  AmbiguousMatchInfo,
} from '../types';
import { calculateOverallResult, calculateSubjectGrade, DEFAULT_GRADING_RULES } from './grading';
import { toEnglishDigits, toBanglaDigits, SEMESTER_MAP, isNullMarksValue, formatBanglaMarks } from '../utils/bangla';
import { MASTER_CURRICULUM_DATA, getAutoLoadedCurriculumSubjects } from '../data/masterCurriculum';
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

export interface MatchedDatabaseSubjectInfo {
  subjectName: string;
  subjectCode: string;
  originalName?: string;
  semesterId?: string;
  technology?: string;
}

export interface AmbiguousSubjectWarning {
  inputName: string;
  candidates: AmbiguousMatchInfo[];
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
  unresolvedBanglaSubjects?: string[];
  matchedDatabaseSubjects?: MatchedDatabaseSubjectInfo[];
  ambiguousSubjects?: AmbiguousSubjectWarning[];
  codeMismatchWarnings?: string[];
  unmatchedSubjects?: string[];
}

export function containsBangla(text: string): boolean {
  return /[\u0980-\u09FF]/.test(text || '');
}

export interface ResolvedSubjectMeta extends ExamSubject {
  isBanglaResolved: boolean;
  originalName?: string;
  isMatchedFromDatabase?: boolean;
  isAmbiguous?: boolean;
  isCodeInvalid?: boolean;
  codeMismatchWarning?: string;
  ambiguousCandidates?: AmbiguousMatchInfo[];
  isUnmatched?: boolean;
}

// Authoritative mapping of English subject names & legacy codes to official BTEB codes and Bengali names
export const BTEB_ENGLISH_TO_BANGLA_MAP: { [key: string]: { code: string; name: string } } = {
  // General Foundation Courses
  'BANGLA-I': { code: '25711', name: 'বাংলা-১' },
  'BANGLA-1': { code: '25711', name: 'বাংলা-১' },
  'BANGLA 1': { code: '25711', name: 'বাংলা-১' },
  'BANGLAI': { code: '25711', name: 'বাংলা-১' },
  '65711': { code: '25711', name: 'বাংলা-১' },
  '25711': { code: '25711', name: 'বাংলা-১' },

  'BANGLA-II': { code: '25721', name: 'বাংলা-২' },
  'BANGLA-2': { code: '25721', name: 'বাংলা-২' },
  'BANGLA 2': { code: '25721', name: 'বাংলা-২' },
  'BANGLAII': { code: '25721', name: 'বাংলা-২' },
  '65721': { code: '25721', name: 'বাংলা-২' },
  '65722': { code: '25721', name: 'বাংলা-২' },
  '25721': { code: '25721', name: 'বাংলা-২' },

  'ENGLISH-I': { code: '25712', name: 'ইংরেজি-১' },
  'ENGLISH-1': { code: '25712', name: 'ইংরেজি-১' },
  'ENGLISH 1': { code: '25712', name: 'ইংরেজি-১' },
  'ENGLISHO': { code: '25712', name: 'ইংরেজি-১' },
  '65712': { code: '25712', name: 'ইংরেজি-১' },
  '25712': { code: '25712', name: 'ইংরেজি-১' },

  'ENGLISH-II': { code: '25722', name: 'ইংরেজি-২' },
  'ENGLISH-2': { code: '25722', name: 'ইংরেজি-২' },
  'ENGLISH 2': { code: '25722', name: 'ইংরেজি-২' },
  'ENGLISHII': { code: '25722', name: 'ইংরেজি-২' },
  '65723': { code: '25722', name: 'ইংরেজি-২' },
  '25722': { code: '25722', name: 'ইংরেজি-২' },

  'MATHEMATICS-I': { code: '25911', name: 'গণিত-১' },
  'MATHEMATICS-1': { code: '25911', name: 'গণিত-১' },
  'MATH-I': { code: '25911', name: 'গণিত-১' },
  'MATH-1': { code: '25911', name: 'গণিত-১' },
  'MATH 1': { code: '25911', name: 'গণিত-১' },
  '65911': { code: '25911', name: 'গণিত-১' },
  '25911': { code: '25911', name: 'গণিত-১' },

  'MATHEMATICS-II': { code: '25921', name: 'গণিত-২' },
  'MATHEMATICS-2': { code: '25921', name: 'গণিত-২' },
  'MATH-II': { code: '25921', name: 'গণিত-২' },
  'MATH-2': { code: '25921', name: 'গণিত-২' },
  'MATH 2': { code: '25921', name: 'গণিত-২' },
  '65921': { code: '25921', name: 'গণিত-২' },
  '25921': { code: '25921', name: 'গণিত-২' },

  'MATHEMATICS-III': { code: '25931', name: 'গণিত-৩' },
  'MATHEMATICS-3': { code: '25931', name: 'গণিত-৩' },
  'MATH-III': { code: '25931', name: 'গণিত-৩' },
  'MATH-3': { code: '25931', name: 'গণিত-৩' },
  'MATH 3': { code: '25931', name: 'গণিত-৩' },
  '65931': { code: '25931', name: 'গণিত-৩' },
  '25931': { code: '25931', name: 'গণিত-৩' },

  'PHYSICS-I': { code: '25912', name: 'পদার্থবিজ্ঞান-১' },
  'PHYSICS-1': { code: '25912', name: 'পদার্থবিজ্ঞান-১' },
  'PHYSICS 1': { code: '25912', name: 'পদার্থবিজ্ঞান-১' },
  '65912': { code: '25912', name: 'পদার্থবিজ্ঞান-১' },
  '25912': { code: '25912', name: 'পদার্থবিজ্ঞান-১' },

  'PHYSICS-II': { code: '25922', name: 'পদার্থবিজ্ঞান-২' },
  'PHYSICS-2': { code: '25922', name: 'পদার্থবিজ্ঞান-২' },
  'PHYSICS 2': { code: '25922', name: 'পদার্থবিজ্ঞান-২' },
  '65922': { code: '25922', name: 'পদার্থবিজ্ঞান-২' },
  '25922': { code: '25922', name: 'পদার্থবিজ্ঞান-২' },

  'CHEMISTRY': { code: '25913', name: 'রসায়ন' },
  '65913': { code: '25913', name: 'রসায়ন' },
  '25913': { code: '25913', name: 'রসায়ন' },

  'SOCIAL SCIENCE': { code: '25811', name: 'সোশ্যাল সাইন্স' },
  'SOCIAL-SCIENCE': { code: '25811', name: 'সোশ্যাল সাইন্স' },
  '65811': { code: '25811', name: 'সোশ্যাল সাইন্স' },
  '25811': { code: '25811', name: 'সোশ্যাল সাইন্স' },

  'PHYSICAL EDUCATION': { code: '25812', name: 'শারীরিক শিক্ষা ও জীবনদক্ষতা উন্নয়ন' },
  'PHYSICAL EDUCATION & LIFE SKILL DEVELOPMENT': { code: '25812', name: 'শারীরিক শিক্ষা ও জীবনদক্ষতা উন্নয়ন' },
  '25812': { code: '25812', name: 'শারীরিক শিক্ষা ও জীবনদক্ষতা উন্নয়ন' },

  'ACCOUNTING': { code: '25841', name: 'একাউন্টিং' },
  '65841': { code: '25841', name: 'একাউন্টিং' },
  '25841': { code: '25841', name: 'একাউন্টিং' },

  'BUSINESS COMMUNICATION': { code: '25831', name: 'বিজনেস কমিউনিকেশন' },
  'BUSINESS-COMMUNICATION': { code: '25831', name: 'বিজনেস কমিউনিকেশন' },
  '25831': { code: '25831', name: 'বিজনেস কমিউনিকেশন' },

  'INDUSTRIAL MANAGEMENT': { code: '25852', name: 'ইন্ডাস্ট্রিয়াল ম্যানেজমেন্ট' },
  'INDUSTRIAL-MANAGEMENT': { code: '25852', name: 'ইন্ডাস্ট্রিয়াল ম্যানেজমেন্ট' },
  '25852': { code: '25852', name: 'ইন্ডাস্ট্রিয়াল ম্যানেজমেন্ট' },

  'INNOVATION & ENTREPRENEURSHIP': { code: '25853', name: 'ইনোভেশন অ্যান্ড এন্টারপ্রেনারশিপ' },
  'INNOVATION AND ENTREPRENEURSHIP': { code: '25853', name: 'ইনোভেশন অ্যান্ড এন্টারপ্রেনারশিপ' },
  '25853': { code: '25853', name: 'ইনোভেশন অ্যান্ড এন্টারপ্রেনারশিপ' },

  'PRINCIPLES OF MARKETING': { code: '25851', name: 'প্রিন্সিপালস অফ মার্কেটিং' },
  '25851': { code: '25851', name: 'প্রিন্সিপালস অফ মার্কেটিং' },

  'ENVIRONMENTAL STUDIES': { code: '29041', name: 'এনভায়রনমেন্টাল স্টাডিজ' },
  '29041': { code: '29041', name: 'এনভায়রনমেন্টাল স্টাডিজ' },

  'ENGINEERING DRAWING': { code: '21011', name: 'ইঞ্জিনিয়ারিং ড্রয়িং' },
  'ENGINEERING-DRAWING': { code: '21011', name: 'ইঞ্জিনিয়ারিং ড্রয়িং' },
  '61011': { code: '21011', name: 'ইঞ্জিনিয়ারিং ড্রয়িং' },
  '21011': { code: '21011', name: 'ইঞ্জিনিয়ারিং ড্রয়িং' },

  'BASIC ELECTRICITY': { code: '26711', name: 'বেসিক ইলেকট্রিসিটি' },
  'BASIC-ELECTRICITY': { code: '26711', name: 'বেসিক ইলেকট্রিসিটি' },
  'BASIC_ELECTRICITY': { code: '26711', name: 'বেসিক ইলেকট্রিসিটি' },
  '66711': { code: '26711', name: 'বেসিক ইলেকট্রিসিটি' },
  '26711': { code: '26711', name: 'বেসিক ইলেকট্রিসিটি' },

  'BASIC ELECTRONICS': { code: '26811', name: 'বেসিক ইলেকট্রনিক্স' },
  'BASIC-ELECTRONICS': { code: '26811', name: 'বেসিক ইলেকট্রনিক্স' },
  'BASIC_ELECTRONICS': { code: '26811', name: 'বেসিক ইলেকট্রনিক্স' },
  '66811': { code: '26811', name: 'বেসিক ইলেকট্রনিক্স' },
  '26811': { code: '26811', name: 'বেসিক ইলেকট্রনিক্স' },

  'BASIC WORKSHOP PRACTICE': { code: '27011', name: 'বেসিক ওয়ার্কশপ প্র্যাকটিস' },
  '67011': { code: '27011', name: 'বেসিক ওয়ার্কশপ প্র্যাকটিস' },
  '27011': { code: '27011', name: 'বেসিক ওয়ার্কশপ প্র্যাকটিস' },

  'MECHANICAL ENGINEERING DRAWING': { code: '27021', name: 'মেকানিক্যাল ইঞ্জিনিয়ারিং ড্রয়িং' },
  'MECHANICAL-ENGINEERING-DRAWING': { code: '27021', name: 'মেকানিক্যাল ইঞ্জিনিয়ারিং ড্রয়িং' },
  'MECHANICAL_ENGINEERING_DRAWING': { code: '27021', name: 'মেকানিক্যাল ইঞ্জিনিয়ারিং ড্রয়িং' },
  'MED': { code: '27021', name: 'মেকানিক্যাল ইঞ্জিনিয়ারিং ড্রয়িং' },
  '67021': { code: '27021', name: 'মেকানিক্যাল ইঞ্জিনিয়ারিং ড্রয়িং' },
  '27021': { code: '27021', name: 'মেকানিক্যাল ইঞ্জিনিয়ারিং ড্রয়িং' },

  // Computer Technology
  'COMPUTER OFFICE APPLICATION': { code: '28511', name: 'কম্পিউটার অফিস অ্যাপ্লিকেশন' },
  'COMPUTER OFFICE APPLICATIONS': { code: '28511', name: 'কম্পিউটার অফিস অ্যাপ্লিকেশন' },
  'COMPUTER-APPLICATION': { code: '28511', name: 'কম্পিউটার অফিস অ্যাপ্লিকেশন' },
  '66611': { code: '28511', name: 'কম্পিউটার অফিস অ্যাপ্লিকেশন' },
  '28511': { code: '28511', name: 'কম্পিউটার অফিস অ্যাপ্লিকেশন' },

  'PYTHON PROGRAMMING': { code: '28521', name: 'পাইথন প্রোগ্রামিং' },
  '28521': { code: '28521', name: 'পাইথন প্রোগ্রামিং' },

  'APPLICATION DEVELOPMENT USING PYTHON': { code: '28531', name: 'অ্যাপ্লিকেশন ডেভেলপমেন্ট ইউজিং পাইথন' },
  '28531': { code: '28531', name: 'অ্যাপ্লিকেশন ডেভেলপমেন্ট ইউজিং পাইথন' },

  'COMPUTER GRAPHICS DESIGN-I': { code: '28522', name: 'কম্পিউটার গ্রাফিক্স ডিজাইন-১' },
  'COMPUTER GRAPHICS DESIGN 1': { code: '28522', name: 'কম্পিউটার গ্রাফিক্স ডিজাইন-১' },
  '28522': { code: '28522', name: 'কম্পিউটার গ্রাফিক্স ডিজাইন-১' },

  'COMPUTER GRAPHICS DESIGN-II': { code: '28532', name: 'কম্পিউটার গ্রাফিক্স ডিজাইন-২' },
  'COMPUTER GRAPHICS DESIGN 2': { code: '28532', name: 'কম্পিউটার গ্রাফিক্স ডিজাইন-২' },
  '28532': { code: '28532', name: 'কম্পিউটার গ্রাফিক্স ডিজাইন-২' },

  'IT SUPPORT SERVICES': { code: '28533', name: 'আইটি সাপোর্ট সার্ভিসেস' },
  '28533': { code: '28533', name: 'আইটি সাপোর্ট সার্ভিসেস' },

  'DIGITAL ELECTRONICS-I': { code: '26831', name: 'ডিজিটাল ইলেকট্রনিক্স-১' },
  'DIGITAL ELECTRONICS 1': { code: '26831', name: 'ডিজিটাল ইলেকট্রনিক্স-১' },
  '26831': { code: '26831', name: 'ডিজিটাল ইলেকট্রনিক্স-১' },

  'DIGITAL ELECTRONICS-II': { code: '26841', name: 'ডিজিটাল ইলেকট্রনিক্স-২' },
  'DIGITAL ELECTRONICS 2': { code: '26841', name: 'ডিজিটাল ইলেকট্রনিক্স-২' },
  '26841': { code: '26841', name: 'ডিজিটাল ইলেকট্রনিক্স-২' },

  'JAVA PROGRAMMING': { code: '28541', name: 'জাভা প্রোগ্রামিং' },
  '66641': { code: '28541', name: 'জাভা প্রোগ্রামিং' },
  '28541': { code: '28541', name: 'জাভা প্রোগ্রামিং' },

  'DATA STRUCTURE & ALGORITHM': { code: '28542', name: 'ডাটা স্ট্রাকচার অ্যান্ড অ্যালগরিদম' },
  'DATA STRUCTURE AND ALGORITHM': { code: '28542', name: 'ডাটা স্ট্রাকচার অ্যান্ড অ্যালগরিদম' },
  'DATA STRUCTURES': { code: '28542', name: 'ডাটা স্ট্রাকচার অ্যান্ড অ্যালগরিদম' },
  '66642': { code: '28542', name: 'ডাটা স্ট্রাকচার অ্যান্ড অ্যালগরিদম' },
  '28542': { code: '28542', name: 'ডাটা স্ট্রাকচার অ্যান্ড অ্যালগরিদম' },

  'COMPUTER PERIPHERALS & INTERFACING': { code: '28543', name: 'কম্পিউটার পেরিফেরালস অ্যান্ড ইন্টারফেসিং' },
  'COMPUTER PERIPHERALS AND INTERFACING': { code: '28543', name: 'কম্পিউটার পেরিফেরালস অ্যান্ড ইন্টারফেসিং' },
  '28543': { code: '28543', name: 'কম্পিউটার পেরিফেরালস অ্যান্ড ইন্টারফেসিং' },

  'WEB DESIGN & DEVELOPMENT-I': { code: '28544', name: 'ওয়েব ডিজাইন অ্যান্ড ডেভেলপমেন্ট-১' },
  'WEB DESIGN AND DEVELOPMENT-1': { code: '28544', name: 'ওয়েব ডিজাইন অ্যান্ড ডেভেলপমেন্ট-১' },
  '28544': { code: '28544', name: 'ওয়েব ডিজাইন অ্যান্ড ডেভেলপমেন্ট-১' },

  'APPLICATION DEVELOPMENT USING JAVA': { code: '28551', name: 'অ্যাপ্লিকেশন ডেভেলপমেন্ট ইউজিং জাভা' },
  '28551': { code: '28551', name: 'অ্যাপ্লিকেশন ডেভেলপমেন্ট ইউজিং জাভা' },

  'WEB DESIGN & DEVELOPMENT-II': { code: '28552', name: 'ওয়েব ডিজাইন অ্যান্ড ডেভেলপমেন্ট-২' },
  'WEB DESIGN AND DEVELOPMENT-2': { code: '28552', name: 'ওয়েব ডিজাইন অ্যান্ড ডেভেলপমেন্ট-২' },
  '28552': { code: '28552', name: 'ওয়েব ডিজাইন অ্যান্ড ডেভেলপমেন্ট-২' },

  'COMPUTER ARCHITECTURE & MICROPROCESSOR': { code: '28553', name: 'কম্পিউটার আর্কিটেকচার অ্যান্ড মাইক্রোপ্রসেসর' },
  '28553': { code: '28553', name: 'কম্পিউটার আর্কিটেকচার অ্যান্ড মাইক্রোপ্রসেসর' },

  'DATA COMMUNICATION': { code: '28554', name: 'ডাটা কমিউনিকেশন' },
  '28554': { code: '28554', name: 'ডাটা কমিউনিকেশন' },

  'OPERATING SYSTEM': { code: '28555', name: 'অপারেটিং সিস্টেম' },
  'OPERATING SYSTEMS': { code: '28555', name: 'অপারেটিং সিস্টেম' },
  '28555': { code: '28555', name: 'অপারেটিং সিস্টেম' },

  'DATABASE MANAGEMENT SYSTEM': { code: '28561', name: 'ডাটাবেজ ম্যানেজমেন্ট সিস্টেম' },
  'DBMS': { code: '28561', name: 'ডাটাবেজ ম্যানেজমেন্ট সিস্টেম' },
  '28561': { code: '28561', name: 'ডাটাবেজ ম্যানেজমেন্ট সিস্টেম' },

  'COMPUTER NETWORKING': { code: '28562', name: 'কম্পিউটার নেটওয়ার্কিং' },
  '28562': { code: '28562', name: 'কম্পিউটার নেটওয়ার্কিং' },

  'SENSOR & IOT SYSTEM': { code: '28563', name: 'সেন্সর অ্যান্ড আইওটি সিস্টেম' },
  '28563': { code: '28563', name: 'সেন্সর অ্যান্ড আইওটি সিস্টেম' },

  'NETWORK ADMINISTRATION & SERVICES': { code: '28572', name: 'নেটওয়ার্ক অ্যাডমিনিস্ট্রেশন অ্যান্ড সার্ভিসেস' },
  '28572': { code: '28572', name: 'নেটওয়ার্ক অ্যাডমিনিস্ট্রেশন অ্যান্ড সার্ভিসেস' },

  'CYBER SECURITY & ETHICS': { code: '28573', name: 'সাইবার সিকিউরিটি অ্যান্ড এথিক্স' },
  '28573': { code: '28573', name: 'সাইবার সিকিউরিটি অ্যান্ড এথিক্স' },

  // Civil Technology
  'CIVIL ENGINEERING MATERIALS': { code: '26411', name: 'সিভিল ইঞ্জিনিয়ারিং মেটেরিয়ালস' },
  '26411': { code: '26411', name: 'সিভিল ইঞ্জিনিয়ারিং মেটেরিয়ালস' },

  'CIVIL ENGINEERING DRAWING': { code: '26421', name: 'সিভিল ইঞ্জিনিয়ারিং ড্রয়িং' },
  '26421': { code: '26421', name: 'সিভিল ইঞ্জিনিয়ারিং ড্রয়িং' },

  'STRUCTURAL MECHANICS': { code: '26431', name: 'স্ট্রাকচারাল মেকানিক্স' },
  '26431': { code: '26431', name: 'স্ট্রাকচারাল মেকানিক্স' },

  'SURVEYING-I': { code: '26432', name: 'সার্ভেয়িং-১' },
  'SURVEYING 1': { code: '26432', name: 'সার্ভেয়িং-১' },
  '26432': { code: '26432', name: 'সার্ভেয়িং-১' },

  'CONSTRUCTION PROCESS-I': { code: '26433', name: 'কনস্ট্রাকশন প্রসেস-১' },
  '26433': { code: '26433', name: 'কনস্ট্রাকশন প্রসেস-১' },

  'CONSTRUCTION PROCESS-II': { code: '26441', name: 'কনস্ট্রাকশন প্রসেস-২' },
  '26441': { code: '26441', name: 'কনস্ট্রাকশন প্রসেস-২' },

  'ESTIMATING & COSTING-I': { code: '26442', name: 'এস্টিমেটিং অ্যান্ড কস্টিং-১' },
  '26442': { code: '26442', name: 'এস্টিমেটিং অ্যান্ড কস্টিং-১' },

  'CIVIL CAD-I': { code: '26443', name: 'সিভিল ক্যাড-১' },
  '26443': { code: '26443', name: 'সিভিল ক্যাড-১' },

  'SURVEYING-II': { code: '26444', name: 'সার্ভেয়িং-২' },
  '26444': { code: '26444', name: 'সার্ভেয়িং-২' },

  'GEOTECHNICAL ENGINEERING': { code: '26445', name: 'জিওটেকনিক্যাল ইঞ্জিনিয়ারিং' },
  '26445': { code: '26445', name: 'জিওটেকনিক্যাল ইঞ্জিনিয়ারিং' },

  'HYDROLOGY': { code: '26446', name: 'হাইড্রোলজি' },
  '26446': { code: '26446', name: 'হাইড্রোলজি' },

  'FOUNDATION ENGINEERING': { code: '26451', name: 'ফাউন্ডেশন ইঞ্জিনিয়ারিং' },
  '26451': { code: '26451', name: 'ফাউন্ডেশন ইঞ্জিনিয়ারিং' },

  'CIVIL CAD-II': { code: '26452', name: 'সিভিল ক্যাড-২' },
  '26452': { code: '26452', name: 'সিভিল ক্যাড-২' },

  'SURVEYING-III': { code: '26453', name: 'সার্ভেয়িং-৩' },
  '26453': { code: '26453', name: 'সার্ভেয়িং-৩' },

  'THEORY OF STRUCTURE': { code: '26454', name: 'থিওরি অফ স্ট্রাকচার' },
  '26454': { code: '26454', name: 'থিওরি অফ স্ট্রাকচার' },

  'WATER SUPPLY ENGINEERING': { code: '26455', name: 'ওয়াটার সাপ্লাই ইঞ্জিনিয়ারিং' },
  '26455': { code: '26455', name: 'ওয়াটার সাপ্লাই ইঞ্জিনিয়ারিং' },

  'HYDRAULICS': { code: '26456', name: 'হাইড্রোলিক্স' },
  '26456': { code: '26456', name: 'হাইড্রোলিক্স' },

  // Electrical Technology
  'ELECTRICAL CIRCUITS-I': { code: '26721', name: 'ইলেকট্রিক্যাল সার্কিট-১' },
  'ELECTRICAL CIRCUITS 1': { code: '26721', name: 'ইলেকট্রিক্যাল সার্কিট-১' },
  '26721': { code: '26721', name: 'ইলেকট্রিক্যাল সার্কিট-১' },

  'ELECTRICAL CIRCUITS-II': { code: '26731', name: 'ইলেকট্রিক্যাল সার্কিট-২' },
  'ELECTRICAL CIRCUITS 2': { code: '26731', name: 'ইলেকট্রিক্যাল সার্কিট-২' },
  '26731': { code: '26731', name: 'ইলেকট্রিক্যাল সার্কিট-২' },

  'ELECTRICAL APPLIANCES': { code: '26732', name: 'ইলেকট্রিক্যাল অ্যাপ্লায়েন্সেস' },
  '26732': { code: '26732', name: 'ইলেকট্রিক্যাল অ্যাপ্লায়েন্সেস' },

  'DC MACHINE': { code: '26742', name: 'ডি সি মেশিন' },
  '26742': { code: '26742', name: 'ডি সি মেশিন' },

  'AC MACHINE-I': { code: '26761', name: 'এসি মেশিন-১' },
  '26761': { code: '26761', name: 'এসি মেশিন-১' },

  'AC MACHINE-II': { code: '26771', name: 'এসি মেশিন-২' },
  '26771': { code: '26771', name: 'এসি মেশিন-২' },

  'SWITCH GEAR & PROTECTION': { code: '26773', name: 'সুইচ গিয়ার অ্যান্ড প্রোটেকশন' },
  '26773': { code: '26773', name: 'সুইচ গিয়ার অ্যান্ড প্রোটেকশন' },

  // Mechanical Technology
  'MACHINE SHOP PRACTICE-I': { code: '27012', name: 'মেশিন শপ প্র্যাকটিস-১' },
  '27012': { code: '27012', name: 'মেশিন শপ প্র্যাকটিস-১' },

  'MACHINE SHOP PRACTICE-II': { code: '27032', name: 'মেশিন শপ প্র্যাকটিস-২' },
  '27032': { code: '27032', name: 'মেশিন শপ প্র্যাকটিস-২' },

  'MACHINE SHOP PRACTICE-III': { code: '27042', name: 'মেশিন শপ প্র্যাকটিস-৩' },
  '27042': { code: '27042', name: 'মেশিন শপ প্র্যাকটিস-৩' },

  'ENGINEERING MECHANICS': { code: '27041', name: 'ইঞ্জিনিয়ারিং মেকানিক্স' },
  '27041': { code: '27041', name: 'ইঞ্জিনিয়ারিং মেকানিক্স' },

  'ENGINEERING THERMODYNAMICS': { code: '27131', name: 'ইঞ্জিনিয়ারিং থার্মোডায়নামিক্স' },
  '27131': { code: '27131', name: 'ইঞ্জিনিয়ারিং থার্মোডায়নামিক্স' },

  'METALLURGY': { code: '27043', name: 'মেটালার্জি' },
  '27043': { code: '27043', name: 'মেটালার্জি' },

  'FLUID MECHANICS & MACHINERIES': { code: '27051', name: 'ফ্লুইড মেকানিক্স অ্যান্ড মেশিনারিজ' },
  '27051': { code: '27051', name: 'ফ্লুইড মেকানিক্স অ্যান্ড মেশিনারিজ' },

  'STRENGTH OF MATERIALS': { code: '27061', name: 'স্ট্রেন্থ অফ মেটেরিয়ালস' },
  '27061': { code: '27061', name: 'স্ট্রেন্থ অফ মেটেরিয়ালস' },

  'CAD & CAM': { code: '27063', name: 'ক্যাড অ্যান্ড ক্যাম' },
  '27063': { code: '27063', name: 'ক্যাড অ্যান্ড ক্যাম' },

  'DESIGN OF MACHINE ELEMENTS': { code: '27071', name: 'ডিজাইন অফ মেশিন এলিমেন্টস' },
  '27071': { code: '27071', name: 'ডিজাইন অফ মেশিন এলিমেন্টস' },
};

export const KNOWN_SUBJECTS_MAP: { [key: string]: { code: string; name: string } } = BTEB_ENGLISH_TO_BANGLA_MAP;

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
 */
export function normalizeSubjectKey(raw: string): string {
  if (!raw) return '';
  return String(raw)
    .normalize('NFC')
    .trim()
    .toUpperCase()
    .replace(/\u09AF\u09BC/g, '\u09DF') // য়
    .replace(/\u09A1\u09BC/g, '\u09DC') // ড়
    .replace(/\u09A2\u09BC/g, '\u09DD') // ঢ়
    .replace(/\bVIII\b/g, '8')
    .replace(/\bVII\b/g, '7')
    .replace(/\bVI\b/g, '6')
    .replace(/\bIV\b/g, '4')
    .replace(/\bV\b/g, '5')
    .replace(/\bIII\b/g, '3')
    .replace(/\bII\b/g, '2')
    .replace(/\bI\b/g, '1')
    .replace(/[-_]VIII\b/g, '8')
    .replace(/[-_]VII\b/g, '7')
    .replace(/[-_]VI\b/g, '6')
    .replace(/[-_]IV\b/g, '4')
    .replace(/[-_]V\b/g, '5')
    .replace(/[-_]III\b/g, '3')
    .replace(/[-_]II\b/g, '2')
    .replace(/[-_]I\b/g, '1')
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
 * Text normalizer for intelligent case-insensitive, punctuation-insensitive,
 * digit-normalized, and Roman numeral-normalized matching.
 */
export function normalizeSubjectText(input: string): string {
  if (!input) return '';
  let str = String(input).normalize('NFC').toLowerCase();

  // Normalize Bengali composite nukta characters to precomposed Unicode
  str = str
    .replace(/\u09af\u09bc/g, '\u09df') // য়
    .replace(/\u09a1\u09bc/g, '\u09dc') // ড়
    .replace(/\u09a2\u09bc/g, '\u09dd'); // ঢ়

  // Convert Bengali numbers to English digits
  str = toEnglishDigits(str);

  // Convert symbols '&' and '+' to ' and '
  str = str.replace(/[&+]/g, ' and ');

  // Replace punctuation, dashes, underscores, slashes, brackets with spaces
  str = str.replace(/[_\-\/\\.,;:()[\]{}"'`~!?*#^%$@|]/g, ' ');

  // Separate attached digits and letters: e.g. "math3" -> "math 3", "গণিত৩" -> "গণিত 3"
  str = str.replace(/([a-z\u0980-\u09ff])(\d+)/gi, '$1 $2');
  str = str.replace(/(\d+)([a-z\u0980-\u09ff])/gi, '$1 $2');

  // Trailing roman numeral attached to non-roman letters (e.g. 'mathiii' -> 'math iii')
  str = str.replace(/([^ivx\s\d])(viii|vii|vi|iv|v|iii|ii|i)\b/gi, '$1 $2');

  // Roman numerals conversion with word boundary protection
  str = str
    .replace(/\bviii\b/g, '8')
    .replace(/\bvii\b/g, '7')
    .replace(/\bvi\b/g, '6')
    .replace(/\biv\b/g, '4')
    .replace(/\bv\b/g, '5')
    .replace(/\biii\b/g, '3')
    .replace(/\bii\b/g, '2')
    .replace(/\bi\b/g, '1');

  // Collapse multiple whitespaces
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Safely extracts subject level / part number (1 through 8) from a normalized string.
 * Example: "mathematics 3" -> 3, "গণিত 3" -> 3, "surveying 1" -> 1, "basic electricity" -> null
 */
export function extractSubjectLevelNumber(str: string): number | null {
  if (!str) return null;
  const matches = str.match(/\b([1-8])\b/g);
  if (matches && matches.length > 0) {
    return parseInt(matches[matches.length - 1], 10);
  }
  return null;
}

/**
 * Safely extracts subject name and embedded full marks from subject header or JSON key.
 * Supports patterns like:
 * - "MATHEMATICS-III (50)" -> name: "MATHEMATICS-III", fullMarks: 50
 * - "গণিত-৩ [৫০]" -> name: "গণিত-৩", fullMarks: 50
 * - "PHYSICS (পূর্ণমান ৪০)" -> name: "PHYSICS", fullMarks: 40
 * - "25931_50" or "MATHEMATICS-III_50" -> fullMarks: 50
 */
export function extractFullMarksFromKey(rawKey: string): { cleanKey: string; extractedFullMarks?: number } {
  if (!rawKey) return { cleanKey: '' };
  const trimmed = String(rawKey).trim();
  // 1. In parentheses or brackets, e.g. "MATHEMATICS-III (50)", "গণিত ৩ [৫০]", "PHYSICS (পূর্ণমান ৪০)"
  const bracketMatch = trimmed.match(/^(.+?)\s*[\(\[]\s*(?:পূর্ণমান|full|fm|marks)?\s*[:\s]*([0-9\u09e6-\u09ef]+)\s*[\)\]]$/i);
  if (bracketMatch) {
    const num = Number(toEnglishDigits(bracketMatch[2]));
    if (num > 0) return { cleanKey: bracketMatch[1].trim(), extractedFullMarks: num };
  }
  // 2. Explicit prefix "পূর্ণমান", e.g. "MATHEMATICS-III পূর্ণমান ৫০"
  const bnMatch = trimmed.match(/^(.+?)\s+পূর্ণমান\s*[:\s]*([0-9\u09e6-\u09ef]+)$/i);
  if (bnMatch) {
    const num = Number(toEnglishDigits(bnMatch[2]));
    if (num > 0) return { cleanKey: bnMatch[1].trim(), extractedFullMarks: num };
  }
  // 3. Underscore or suffix with valid marks (>= 10 and <= 300), e.g. "MATHEMATICS-III_50", "25931_50", "গণিত_৫০"
  const suffixMatch = trimmed.match(/^(.+?)[_ ]([0-9\u09e6-\u09ef]{2,3})$/);
  if (suffixMatch) {
    const num = Number(toEnglishDigits(suffixMatch[2]));
    if (num >= 10 && num <= 300) return { cleanKey: suffixMatch[1].trim(), extractedFullMarks: num };
  }
  return { cleanKey: trimmed };
}

/**
 * Cross-lingual and transliteration synonym dictionary.
 * Maps English names, transliterated Bengali, and colloquial variations to canonical tokens.
 */
export const SUBJECT_TOKEN_SYNONYMS: { [token: string]: string } = {
  // Math
  mathematics: 'গণিত',
  math: 'গণিত',
  maths: 'গণিত',
  গণিত: 'গণিত',
  ম্যাথমেটিক্স: 'গণিত',
  ম্যাথ: 'গণিত',

  // Physics
  physics: 'পদার্থবিজ্ঞান',
  পদার্থবিজ্ঞান: 'পদার্থবিজ্ঞান',
  পদার্থ: 'পদার্থবিজ্ঞান',
  ফিজিক্স: 'পদার্থবিজ্ঞান',
  ফিজিকস: 'পদার্থবিজ্ঞান',

  // Chemistry
  chemistry: 'রসায়ন',
  রসায়ন: 'রসায়ন',
  রসায়ন: 'রসায়ন',
  কেমিস্ট্রি: 'রসায়ন',
  কেমেস্ট্রি: 'রসায়ন',

  // English & Bangla
  english: 'ইংরেজি',
  ইংরেজি: 'ইংরেজি',
  ইংলিশ: 'ইংরেজি',
  bangla: 'বাংলা',
  bengali: 'বাংলা',
  বাংলা: 'বাংলা',

  // Common Engineering Terms
  engineering: 'ইঞ্জিনিয়ারিং',
  ইঞ্জিনিয়ারিং: 'ইঞ্জিনিয়ারিং',
  ইঞ্জিনিয়ারিং: 'ইঞ্জিনিয়ারিং',
  mechanical: 'মেকানিক্যাল',
  মেকানিক্যাল: 'মেকানিক্যাল',
  মেকানিকাল: 'মেকানিক্যাল',
  electrical: 'ইলেকট্রিক্যাল',
  ইলেকট্রিক্যাল: 'ইলেকট্রিক্যাল',
  ইলেকট্রিকাল: 'ইলেকট্রিক্যাল',
  বৈদ্যুতিক: 'ইলেকট্রিক্যাল',
  electronic: 'ইলেকট্রনিক্স',
  electronics: 'ইলেকট্রনিক্স',
  ইলেকট্রনিক্স: 'ইলেকট্রনিক্স',
  ইলেকট্রনিক: 'ইলেকট্রনিক্স',
  civil: 'সিভিল',
  সিভিল: 'সিভিল',
  computer: 'কম্পিউটার',
  কম্পিউটার: 'কম্পিউটার',

  // Specific subjects
  drawing: 'ড্রয়িং',
  ড্রয়িং: 'ড্রয়িং',
  ড্রইং: 'ড্রয়িং',
  অঙ্কন: 'ড্রয়িং',
  surveying: 'সার্ভেয়িং',
  সার্ভেয়িং: 'সার্ভেয়িং',
  সার্ভেয়িং: 'সার্ভেয়িং',
  সার্ভে: 'সার্ভেয়িং',
  circuit: 'সার্কিট',
  circuits: 'সার্কিট',
  সার্কিট: 'সার্কিট',
  সার্কিটস: 'সার্কিট',
  machine: 'মেশিন',
  machines: 'মেশিন',
  মেশিন: 'মেশিন',
  materials: 'মেটেরিয়ালস',
  material: 'মেটেরিয়ালস',
  মেটেরিয়ালস: 'মেটেরিয়ালস',
  মেটেরিয়ালস: 'মেটেরিয়ালস',
  মেটেরিয়াল: 'মেটেরিয়ালস',
  structure: 'স্ট্রাকচার',
  structures: 'স্ট্রাকচার',
  structural: 'স্ট্রাকচারাল',
  স্ট্রাকচার: 'স্ট্রাকচার',
  স্ট্রাকচারাল: 'স্ট্রাকচারাল',
  programming: 'প্রোগ্রামিং',
  প্রোগ্রামিং: 'প্রোগ্রামিং',
  algorithm: 'অ্যালগরিদম',
  algorithms: 'অ্যালগরিদম',
  অ্যালগরিদম: 'অ্যালগরিদম',
  এলগরিদম: 'অ্যালগরিদম',
  data: 'ডাটা',
  ডাটা: 'ডাটা',
  উপাত্ত: 'ডাটা',
  database: 'ডাটাবেজ',
  dbms: 'ডাটাবেজ',
  ডাটাবেজ: 'ডাটাবেজ',
  ডাটাবেস: 'ডাটাবেজ',
  network: 'নেটওয়ার্কিং',
  networking: 'নেটওয়ার্কিং',
  নেটওয়ার্ক: 'নেটওয়ার্কিং',
  নেটওয়ার্কিং: 'নেটওয়ার্কিং',
  নেটওয়ার্ক: 'নেটওয়ার্কিং',
  নেটওয়ার্কিং: 'নেটওয়ার্কিং',
  operating: 'অপারেটিং',
  অপারেটিং: 'অপারেটিং',
  system: 'সিস্টেম',
  systems: 'সিস্টেম',
  সিস্টেম: 'সিস্টেম',
  mechanics: 'মেকানিক্স',
  মেকানিক্স: 'মেকানিক্স',
  thermodynamics: 'থার্মোডায়নামিক্স',
  থার্মোডায়নামিক্স: 'থার্মোডায়নামিক্স',
  application: 'অ্যাপ্লিকেশন',
  applications: 'অ্যাপ্লিকেশন',
  অ্যাপ্লিকেশন: 'অ্যাপ্লিকেশন',
  এপ্লিকেশন: 'অ্যাপ্লিকেশন',
  office: 'অফিস',
  অফিস: 'অফিস',
  coa: 'কম্পিউটার অফিস অ্যাপ্লিকেশন',
  hydraulics: 'হাইড্রোলিক্স',
  হাইড্রোলিক্স: 'হাইড্রোলিক্স',
  hydrology: 'হাইড্রোলজি',
  হাইড্রোলজি: 'হাইড্রোলজি',
  foundation: 'ফাউন্ডেশন',
  ফাউন্ডেশন: 'ফাউন্ডেশন',
  estimating: 'এস্টিমেটিং',
  এস্টিমেটিং: 'এস্টিমেটিং',
  costing: 'কস্টিং',
  কস্টিং: 'কস্টিং',
  construction: 'কনস্ট্রাকশন',
  কনস্ট্রাকশন: 'কনস্ট্রাকশন',
  process: 'প্রসেস',
  প্রসেস: 'প্রসেস',
  management: 'ম্যানেজমেন্ট',
  ম্যানেজমেন্ট: 'ম্যানেজমেন্ট',
  security: 'সিকিউরিটি',
  সাইবার: 'সাইবার',
  cyber: 'সাইবার',
  সিকিউরিটি: 'সিকিউরিটি',
  iot: 'আইওটি',
  আইওটি: 'আইওটি',
  sensor: 'সেন্সর',
  sensors: 'সেন্সর',
  সেন্সর: 'সেন্সর',
  fluid: 'ফ্লুইড',
  ফ্লুইড: 'ফ্লুইড',
  strength: 'স্ট্রেন্থ',
  স্ট্রেন্থ: 'স্ট্রেন্থ',
  cad: 'ক্যাড',
  ক্যাড: 'ক্যাড',
  cam: 'ক্যাম',
  ক্যাম: 'ক্যাম',
  shop: 'শপ',
  শপ: 'শপ',
  practice: 'প্র্যাকটিস',
  প্র্যাকটিস: 'প্র্যাকটিস',
  প্রাকটিস: 'প্র্যাকটিস',
  basic: 'বেসিক',
  বেসিক: 'বেসিক',
  electricity: 'ইলেকট্রিসিটি',
  ইলেকট্রিসিটি: 'ইলেকট্রিসিটি',
  environmental: 'এনভায়রনমেন্টাল',
  এনভায়রনমেন্টাল: 'এনভায়রনমেন্টাল',
  studies: 'স্টাডিজ',
  স্টাডিজ: 'স্টাডিজ',
  social: 'সোশ্যাল',
  সোশ্যাল: 'সোশ্যাল',
  science: 'সাইন্স',
  সাইন্স: 'সাইন্স',
  accounting: 'একাউন্টিং',
  একাউন্টিং: 'একাউন্টিং',
  communication: 'কমিউনিকেশন',
  কমিউনিকেশন: 'কমিউনিকেশন',
  python: 'পাইথন',
  পাইথন: 'পাইথন',
  java: 'জাভা',
  জাভা: 'জাভা',
  graphics: 'গ্রাফিক্স',
  গ্রাফিক্স: 'গ্রাফিক্স',
  design: 'ডিজাইন',
  ডিজাইন: 'ডিজাইন',
  web: 'ওয়েব',
  ওয়েব: 'ওয়েব',
  development: 'ডেভেলপমেন্ট',
  ডেভেলপমেন্ট: 'ডেভেলপমেন্ট',
  architecture: 'আর্কিটেকচার',
  আর্কিটেকচার: 'আর্কিটেকচার',
  microprocessor: 'মাইক্রোপ্রসেসর',
  মাইক্রোপ্রসেসর: 'মাইক্রোপ্রসেসর',
  switchgear: 'সুইচ গিয়ার',
  switch: 'সুইচ',
  সুইচ: 'সুইচ',
  gear: 'গিয়ার',
  গিয়ার: 'গিয়ার',
  protection: 'প্রোটেকশন',
  প্রোটেকশন: 'প্রোটেকশন',
  dc: 'ডি সি',
  ac: 'এসি',
};

/**
 * Converts a normalized subject string into canonical token sequence using the synonym dictionary.
 */
export function canonicalizeSubjectTokens(normalizedText: string): string {
  if (!normalizedText) return '';
  const tokens = normalizedText.split(' ').filter(Boolean);
  const canonicalTokens = tokens.map((t) => SUBJECT_TOKEN_SYNONYMS[t] || t);
  return canonicalTokens.join(' ').replace(/\s+/g, ' ').trim();
}

export interface SearchableBookItem {
  subjectCode: string;
  subjectName: string;
  technology?: string;
  semesterId?: string;
  fullMarks?: number;
  normalizedBangla: string;
  canonicalBangla: string;
  levelNumber: number | null;
  normalizedAliases: string[];
  canonicalAliases: string[];
}

/**
 * Builds a unified search pool of actual database books across all 8 semesters & technologies.
 * Combines Firestore books, Master Curriculum, and any exam subjects.
 */
export function buildSearchableBookPool(
  availableBooks?: BookItem[],
  examSubjects?: ExamSubject[]
): SearchableBookItem[] {
  const pool: SearchableBookItem[] = [];

  const addBook = (
    code: string,
    name: string,
    tech?: string,
    semId?: string,
    fullMarks?: number
  ) => {
    const cleanCode = toEnglishDigits(code || '').trim();
    if (!cleanCode) return;

    const normBangla = normalizeSubjectText(name);
    const canonBangla = canonicalizeSubjectTokens(normBangla);
    const levelNumber = extractSubjectLevelNumber(normBangla);

    // Collect English & legacy aliases from BTEB_ENGLISH_TO_BANGLA_MAP
    const normalizedAliases: string[] = [];
    const canonicalAliases: string[] = [];

    Object.entries(BTEB_ENGLISH_TO_BANGLA_MAP).forEach(([enKey, info]) => {
      if (info.code === cleanCode) {
        const na = normalizeSubjectText(enKey);
        const ca = canonicalizeSubjectTokens(na);
        normalizedAliases.push(na);
        canonicalAliases.push(ca);
      }
    });

    pool.push({
      subjectCode: cleanCode,
      subjectName: name,
      technology: tech ? tech.toUpperCase() : undefined,
      semesterId: semId ? String(semId).trim() : undefined,
      fullMarks: fullMarks || 100,
      normalizedBangla: normBangla,
      canonicalBangla: canonBangla,
      levelNumber,
      normalizedAliases: Array.from(new Set(normalizedAliases)),
      canonicalAliases: Array.from(new Set(canonicalAliases)),
    });
  };

  // 1. From availableBooks (Firestore books collection + live admin books)
  if (Array.isArray(availableBooks) && availableBooks.length > 0) {
    availableBooks.forEach((b) => {
      addBook(b.subjectCode, b.subjectName, b.technology, b.semesterId, b.credit ? b.credit * 50 : 100);
    });
  }

  // 2. From MASTER_CURRICULUM_DATA (313 BTEB Syllabus Subjects across all 8 semesters & 6 technologies)
  MASTER_CURRICULUM_DATA.forEach((s) => {
    const cleanCode = toEnglishDigits(s.subjectCode).trim();
    const already = pool.some(
      (p) =>
        p.subjectCode === cleanCode &&
        p.technology === s.technology.toUpperCase() &&
        p.semesterId === String(s.semesterId)
    );
    if (!already) {
      addBook(s.subjectCode, s.subjectName, s.technology, s.semesterId, s.curriculumFullMarks || 100);
    }
  });

  // 3. From examSubjects (if provided)
  if (Array.isArray(examSubjects) && examSubjects.length > 0) {
    examSubjects.forEach((es) => {
      const cleanCode = toEnglishDigits(es.code).trim();
      const already = pool.some((p) => p.subjectCode === cleanCode);
      if (!already) {
        addBook(es.code, es.name, undefined, undefined, es.fullMarks || 100);
      }
    });
  }

  return pool;
}

/**
 * Authoritatively resolves subject metadata:
 * - When Subject Code is missing: intelligently matches against database books across all semesters,
 *   prioritizing current exam's semester & technology, detects ambiguity without guessing, and falls back cleanly.
 * - When Subject Code is provided: validates against database curriculum; if code and subject name conflict,
 *   warns admin instead of silently modifying.
 */
export function resolveSubjectMeta(
  rawCodeOrName: string,
  explicitFullMarks?: number,
  examSubjects?: ExamSubject[],
  explicitSubjectCode?: string,
  explicitSubjectName?: string,
  technologyContext?: string,
  semesterContext?: SemesterId,
  availableBooks?: BookItem[]
): ResolvedSubjectMeta {
  const rawKeyInfo = extractFullMarksFromKey(rawCodeOrName);
  const cleanRaw = rawKeyInfo.cleanKey || String(rawCodeOrName || '').trim();
  if ((!explicitFullMarks || explicitFullMarks <= 0) && rawKeyInfo.extractedFullMarks) {
    explicitFullMarks = rawKeyInfo.extractedFullMarks;
  }

  const nameKeyInfo = extractFullMarksFromKey(explicitSubjectName || '');
  const cleanName = nameKeyInfo.cleanKey || String(explicitSubjectName || '').trim();
  if ((!explicitFullMarks || explicitFullMarks <= 0) && nameKeyInfo.extractedFullMarks) {
    explicitFullMarks = nameKeyInfo.extractedFullMarks;
  }

  const trimmedRaw = cleanRaw;
  const trimmedCode = String(explicitSubjectCode || '').trim();
  const trimmedName = cleanName;

  const originalCandidate = trimmedName || (trimmedCode && trimmedCode !== trimmedRaw ? trimmedRaw : '') || trimmedRaw;
  const pool = buildSearchableBookPool(availableBooks, examSubjects);

  const cleanContextTech = technologyContext ? technologyContext.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const cleanContextSem = semesterContext ? String(semesterContext).trim() : '';

  // Determine explicit 5-digit code or explicitSubjectCode
  let rawCleanCode = toEnglishDigits(trimmedCode || (/^\d{5}$/.test(trimmedRaw) ? trimmedRaw : ''));

  // If explicit code is an alias or legacy key from BTEB_ENGLISH_TO_BANGLA_MAP
  if (!rawCleanCode && trimmedCode) {
    const aliasMatch = BTEB_ENGLISH_TO_BANGLA_MAP[trimmedCode.toUpperCase()] || BTEB_ENGLISH_TO_BANGLA_MAP[normalizeSubjectKey(trimmedCode)];
    if (aliasMatch) {
      rawCleanCode = aliasMatch.code;
    }
  }

  // Also check if trimmedRaw directly matches an alias in BTEB_ENGLISH_TO_BANGLA_MAP
  if (!rawCleanCode && trimmedRaw) {
    const aliasMatch =
      BTEB_ENGLISH_TO_BANGLA_MAP[trimmedRaw.toUpperCase()] ||
      BTEB_ENGLISH_TO_BANGLA_MAP[normalizeSubjectKey(trimmedRaw)] ||
      BTEB_ENGLISH_TO_BANGLA_MAP[normalizeSubjectText(trimmedRaw).toUpperCase()];
    if (aliasMatch) {
      rawCleanCode = aliasMatch.code;
    }
  }

  // =========================================================================
  // CASE 1: SUBJECT CODE IS PROVIDED (Validate code, check for name mismatch)
  // =========================================================================
  if (rawCleanCode) {
    const codeMatches = pool.filter((b) => b.subjectCode === rawCleanCode);

    if (codeMatches.length > 0) {
      // Prioritize contextual technology and semester if multiple records share this code
      let selectedBook = codeMatches[0];
      if (cleanContextTech || cleanContextSem) {
        const contextualMatch =
          codeMatches.find((b) => {
            const matchTech = cleanContextTech && b.technology ? cleanContextTech.includes(b.technology.toLowerCase()) : false;
            const matchSem = cleanContextSem && b.semesterId ? b.semesterId === cleanContextSem : false;
            return matchTech && matchSem;
          }) ||
          codeMatches.find((b) => cleanContextSem && b.semesterId ? b.semesterId === cleanContextSem : false) ||
          codeMatches.find((b) => cleanContextTech && b.technology ? cleanContextTech.includes(b.technology.toLowerCase()) : false);

        if (contextualMatch) selectedBook = contextualMatch;
      }

      // Check for code and subject name discrepancy
      let codeMismatchWarning: string | undefined;
      const testName = trimmedName || (trimmedCode && trimmedCode !== trimmedRaw ? trimmedRaw : '');
      if (testName && !/^\d{5}$/.test(testName)) {
        const normTest = normalizeSubjectText(testName);
        const canonTest = canonicalizeSubjectTokens(normTest);
        const canonKeyTest = normalizeSubjectKey(testName);

        const nameMatchesOfficial =
          normTest === selectedBook.normalizedBangla ||
          canonTest === selectedBook.canonicalBangla ||
          selectedBook.normalizedAliases.includes(normTest) ||
          selectedBook.canonicalAliases.includes(canonTest) ||
          canonKeyTest === normalizeSubjectKey(selectedBook.subjectName) ||
          (normTest.length >= 4 &&
            (selectedBook.normalizedBangla.includes(normTest) ||
              normTest.includes(selectedBook.normalizedBangla) ||
              selectedBook.canonicalBangla.includes(canonTest) ||
              canonTest.includes(selectedBook.canonicalBangla)));

        if (!nameMatchesOfficial) {
          codeMismatchWarning = `সতর্কতা: বিষয় কোড ${rawCleanCode}-এর অফিশিয়াল নাম '${selectedBook.subjectName}', কিন্তু JSON-এ '${testName}' দেওয়া হয়েছে!`;
        }
      }

      return {
        code: selectedBook.subjectCode,
        name: selectedBook.subjectName, // Official BTEB Bengali Name
        originalName: originalCandidate,
        isBanglaResolved: true,
        fullMarks: explicitFullMarks || selectedBook.fullMarks || 100,
        codeMismatchWarning,
      };
    } else {
      // Code was provided, but NOT found in database
      return {
        code: rawCleanCode,
        name: trimmedName || trimmedRaw,
        originalName: originalCandidate,
        isBanglaResolved: containsBangla(trimmedName || trimmedRaw),
        fullMarks: explicitFullMarks || 100,
        isCodeInvalid: true,
        codeMismatchWarning: `সতর্কতা: বিষয় কোড '${rawCleanCode}' ডেটাবেজের পাঠ্যক্রমে পাওয়া যায়নি (INVALID CODE)`,
      };
    }
  }

  // =========================================================================
  // CASE 2: SUBJECT CODE IS MISSING (Automatic Database Matching)
  // =========================================================================
  const searchQuery = trimmedName || trimmedRaw;
  const normSearch = normalizeSubjectText(searchQuery);
  const canonSearch = canonicalizeSubjectTokens(normSearch);
  const canonKeySearch = normalizeSubjectKey(searchQuery);
  const searchLevel = extractSubjectLevelNumber(normSearch);

  if (!normSearch && !canonSearch && !canonKeySearch) {
    return {
      code: 'N/A',
      name: originalCandidate,
      originalName: originalCandidate,
      isBanglaResolved: false,
      fullMarks: explicitFullMarks || 100,
      isUnmatched: true,
    };
  }

  // Score each book in the database
  interface ScoredCandidate {
    book: SearchableBookItem;
    nameScore: number;
    totalScore: number;
  }

  const scoredList: ScoredCandidate[] = [];

  pool.forEach((b) => {
    // Strict Guard: If part/level number is explicitly specified, enforce strict equality
    if (searchLevel !== null && b.levelNumber !== null && searchLevel !== b.levelNumber) {
      return; // Part number mismatch (e.g. Mathematics 3 cannot match Mathematics 1 or 2)
    }

    let nameScore = 0;

    // 1. Exact match with canonical tokens or normalized Bengali or English aliases
    if (
      canonSearch === b.canonicalBangla ||
      b.canonicalAliases.includes(canonSearch) ||
      normSearch === b.normalizedBangla ||
      b.normalizedAliases.includes(normSearch) ||
      canonKeySearch === normalizeSubjectKey(b.subjectName) ||
      b.normalizedAliases.some((a) => normalizeSubjectKey(a) === canonKeySearch)
    ) {
      nameScore = 100;
    }
    // 2. Starts-with / prefix match
    else if (
      (normSearch.length >= 3 && (b.normalizedBangla.startsWith(normSearch) || b.normalizedAliases.some((a) => a.startsWith(normSearch)))) ||
      (canonSearch.length >= 3 && (b.canonicalBangla.startsWith(canonSearch) || b.canonicalAliases.some((a) => a.startsWith(canonSearch))))
    ) {
      nameScore = 85;
    }
    // 3. Word-token inclusion match
    else if (canonSearch.length >= 3 || normSearch.length >= 3) {
      const searchTokens = canonSearch.split(' ').filter((t) => t.length >= 2);
      const banglaTokens = b.canonicalBangla.split(' ');
      const allTokensInBangla =
        searchTokens.length > 0 &&
        searchTokens.every((st) => banglaTokens.some((bt) => bt.includes(st) || st.includes(bt)));

      const aliasTokensMatch = b.canonicalAliases.some((alias) => {
        const at = alias.split(' ');
        return searchTokens.length > 0 && searchTokens.every((st) => at.some((att) => att.includes(st) || st.includes(att)));
      });

      if (allTokensInBangla || aliasTokensMatch) {
        nameScore = 80;
      } else if (
        b.canonicalBangla.includes(canonSearch) ||
        b.canonicalAliases.some((a) => a.includes(canonSearch)) ||
        b.normalizedBangla.includes(normSearch) ||
        b.normalizedAliases.some((a) => a.includes(normSearch))
      ) {
        nameScore = 65;
      }
    }

    if (nameScore >= 60) {
      let contextBoost = 0;
      // Boost for matching semester
      if (cleanContextSem && b.semesterId === cleanContextSem) {
        contextBoost += 35;
      }
      // Boost for matching technology
      if (cleanContextTech && b.technology && cleanContextTech.includes(b.technology.toLowerCase())) {
        contextBoost += 25;
      }
      // Boost for matching level number
      if (searchLevel !== null && b.levelNumber === searchLevel) {
        contextBoost += 15;
      }

      scoredList.push({
        book: b,
        nameScore,
        totalScore: nameScore + contextBoost,
      });
    }
  });

  // Group by distinct subjectCode to avoid penalizing common subjects
  const codeScores = new Map<string, { maxTotal: number; maxName: number; book: SearchableBookItem }>();
  scoredList.forEach((item) => {
    const existing = codeScores.get(item.book.subjectCode);
    if (!existing || item.totalScore > existing.maxTotal) {
      codeScores.set(item.book.subjectCode, {
        maxTotal: item.totalScore,
        maxName: item.nameScore,
        book: item.book,
      });
    }
  });

  const sortedDistinctCodes = Array.from(codeScores.values()).sort(
    (a, b) => b.maxTotal - a.maxTotal || b.maxName - a.maxName
  );

  if (sortedDistinctCodes.length === 0) {
    // No match found in database
    return {
      code: 'N/A',
      name: originalCandidate,
      originalName: originalCandidate,
      isBanglaResolved: containsBangla(originalCandidate),
      fullMarks: explicitFullMarks || 100,
      isUnmatched: true,
    };
  }

  const topMatch = sortedDistinctCodes[0];
  const secondMatch = sortedDistinctCodes[1];

  // Ambiguity check: if multiple distinct subject codes tied or have negligible difference (<15)
  // and no contextual semester/technology resolved them
  if (
    secondMatch &&
    secondMatch.maxName >= 70 &&
    (topMatch.maxTotal - secondMatch.maxTotal) < 15
  ) {
    const candidates: AmbiguousMatchInfo[] = sortedDistinctCodes.slice(0, 4).map((c) => ({
      subjectCode: c.book.subjectCode,
      subjectName: c.book.subjectName,
      semesterId: c.book.semesterId,
      technology: c.book.technology,
    }));

    return {
      code: 'N/A (অস্পষ্ট)',
      name: originalCandidate,
      originalName: originalCandidate,
      isBanglaResolved: false,
      fullMarks: explicitFullMarks || 100,
      isAmbiguous: true,
      ambiguousCandidates: candidates,
    };
  }

  // Clear single best match!
  return {
    code: topMatch.book.subjectCode,
    name: topMatch.book.subjectName,
    originalName: originalCandidate,
    isBanglaResolved: true,
    isMatchedFromDatabase: true,
    fullMarks: explicitFullMarks || topMatch.book.fullMarks || 100,
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
          subjects: [
            { subjectCode: '25721', subjectName: 'Bangla-II', marks: 38, fullMarks: 45 },
            { subjectCode: '25722', subjectName: 'English-II', marks: 40, fullMarks: 45 },
            { subjectCode: '25921', subjectName: 'Mathematics-II', marks: 42, fullMarks: 45 },
            { subjectCode: '27021', subjectName: 'Mechanical Engineering Drawing', marks: 35, fullMarks: 45 },
            { subjectCode: '26711', subjectName: 'Basic Electricity', marks: 41, fullMarks: 45 },
            { subjectCode: '25922', subjectName: 'Physics-II', marks: 39, fullMarks: 45 }
          ]
        },
        {
          examTitle: '২য় পর্ব মডেল টেস্ট ২০২৬',
          semester: '2',
          department: 'Civil',
          roll: '601235',
          name: 'সাদিয়া সুলতানা',
          studentId: 'DPIB-2026-002',
          registration: '1502345679',
          subjects: [
            { subjectCode: '25721', subjectName: 'Bangla-II', marks: 36, fullMarks: 45 },
            { subjectCode: '25722', subjectName: 'English-II', marks: 39, fullMarks: 45 },
            { subjectCode: '25921', subjectName: 'Mathematics-II', marks: 44, fullMarks: 45 },
            { subjectCode: '27021', subjectName: 'Mechanical Engineering Drawing', marks: 38, fullMarks: 45 },
            { subjectCode: '26711', subjectName: 'Basic Electricity', marks: 40, fullMarks: 45 },
            { subjectCode: '25922', subjectName: 'Physics-II', marks: 42, fullMarks: 45 }
          ]
        },
        {
          examTitle: '২য় পর্ব মডেল টেস্ট ২০২৬',
          semester: '2',
          department: 'Electrical',
          roll: '601236',
          name: 'তানভীর হোসেন',
          studentId: 'DPIB-2026-003',
          registration: '1502345680',
          subjects: [
            { subjectCode: '25721', subjectName: 'Bangla-II', marks: 39, fullMarks: 45 },
            { subjectCode: '25722', subjectName: 'English-II', marks: 37, fullMarks: 45 },
            { subjectCode: '25921', subjectName: 'Mathematics-II', marks: 40, fullMarks: 45 },
            { subjectCode: '27021', subjectName: 'Mechanical Engineering Drawing', marks: 36, fullMarks: 45 },
            { subjectCode: '26711', subjectName: 'Basic Electricity', marks: 43, fullMarks: 45 },
            { subjectCode: '25922', subjectName: 'Physics-II', marks: 38, fullMarks: 45 }
          ]
        },
        {
          examTitle: '২য় পর্ব মডেল টেস্ট ২০২৬',
          semester: '2',
          department: 'Mechanical',
          roll: '601237',
          name: 'নুসরাত জাহান',
          studentId: 'DPIB-2026-004',
          registration: '1502345681',
          subjects: [
            { subjectCode: '25721', subjectName: 'Bangla-II', marks: 41, fullMarks: 45 },
            { subjectCode: '25722', subjectName: 'English-II', marks: 42, fullMarks: 45 },
            { subjectCode: '25921', subjectName: 'Mathematics-II', marks: 43, fullMarks: 45 },
            { subjectCode: '27021', subjectName: 'Mechanical Engineering Drawing', marks: 40, fullMarks: 45 },
            { subjectCode: '26711', subjectName: 'Basic Electricity', marks: 39, fullMarks: 45 },
            { subjectCode: '25922', subjectName: 'Physics-II', marks: 44, fullMarks: 45 }
          ]
        }
      ],
      null,
      2
    );
  }

  const sampleSubjects = (exam.subjects && exam.subjects.length > 0
    ? exam.subjects
    : [
        { code: '25721', name: 'বাংলা-২', fullMarks: 45 },
        { code: '25722', name: 'ইংরেজি-২', fullMarks: 45 },
        { code: '25921', name: 'গণিত-২', fullMarks: 45 },
        { code: '27021', name: 'মেকানিক্যাল ইঞ্জিনিয়ারিং ড্রয়িং', fullMarks: 45 },
        { code: '26711', name: 'বেসিক ইলেকট্রিসিটি', fullMarks: 45 },
        { code: '25922', name: 'পদার্থবিজ্ঞান-২', fullMarks: 45 },
      ]
  ).map((sub) => {
    const full = Number(sub.fullMarks) || 100;
    return {
      subjectCode: sub.code,
      subjectName: sub.name,
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
        subjects: sampleSubjects,
      },
      {
        examTitle: exam.title,
        semester: exam.semesterId,
        department: exam.departmentName,
        roll: '601235',
        name: 'সাদিয়া সুলতানা',
        studentId: 'DPIB-2026-002',
        registration: '1502345679',
        subjects: sampleSubjects.map((s) => ({
          ...s,
          marks: Math.min(s.fullMarks, Math.round(s.fullMarks * 0.78)),
        })),
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
            const meta = colSubjectMap[colIdx] || resolveSubjectMeta(colName, undefined, targetExam?.subjects);
            let subFullMarks = Number(meta.fullMarks) > 0 ? Number(meta.fullMarks) : 0;
            if (!subFullMarks || subFullMarks <= 0) {
              subFullMarks = 100;
            }

            // If cell is empty, null, or dash, do NOT drop the subject: keep it with null marks
            if (rawVal === undefined || rawVal === null || isNullMarksValue(rawVal)) {
              subjectMarks[meta.code] = null as any;
              subjectResults.push({
                subjectCode: meta.code,
                subjectName: meta.name,
                originalSubjectName: meta.originalName || colName,
                fullMarks: subFullMarks,
                obtainedMarks: null,
                grade: '—',
                gradePoint: 0,
                isPassed: true,
                isMatchedFromDatabase: meta.isMatchedFromDatabase,
                isAmbiguous: meta.isAmbiguous,
                isCodeInvalid: meta.isCodeInvalid,
                codeMismatchWarning: meta.codeMismatchWarning,
                ambiguousCandidates: meta.ambiguousCandidates,
              });
              return;
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
  allExams: Exam[] = [],
  availableBooks?: BookItem[]
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

    // Detect exam info from top-level JSON or item objects
    let rawDetectedExamTitle = '';
    let rawDetectedSemester = '';
    let rawDetectedDept = '';
    let explicitTopFullMarks: number | undefined;

    // Registry of all subject-specific full marks detected in the JSON
    const jsonSubjectFullMarksMap = new Map<string, number>();

    const recordJsonSubjectFullMark = (key: string, full: any) => {
      const num = Number(toEnglishDigits(String(full ?? '')));
      if (isNaN(num) || num <= 0 || !key) return;
      const trimmed = key.trim();
      const normKey = normalizeSubjectKey(trimmed);
      const normText = normalizeSubjectText(trimmed);
      const canonText = canonicalizeSubjectTokens(normText);
      const cleanDigits = toEnglishDigits(trimmed);

      jsonSubjectFullMarksMap.set(trimmed, num);
      jsonSubjectFullMarksMap.set(trimmed.toLowerCase(), num);
      jsonSubjectFullMarksMap.set(normKey, num);
      jsonSubjectFullMarksMap.set(normText, num);
      jsonSubjectFullMarksMap.set(canonText, num);

      if (/^\d{5}$/.test(cleanDigits)) {
        jsonSubjectFullMarksMap.set(cleanDigits, num);
      }

      // Cross-register with BTEB_ENGLISH_TO_BANGLA_MAP
      const btebDirect =
        BTEB_ENGLISH_TO_BANGLA_MAP[trimmed.toUpperCase()] ||
        BTEB_ENGLISH_TO_BANGLA_MAP[normKey.toUpperCase()] ||
        BTEB_ENGLISH_TO_BANGLA_MAP[normText.toUpperCase()];
      if (btebDirect) {
        jsonSubjectFullMarksMap.set(btebDirect.code, num);
        jsonSubjectFullMarksMap.set(btebDirect.name, num);
        jsonSubjectFullMarksMap.set(btebDirect.name.toLowerCase(), num);
        jsonSubjectFullMarksMap.set(normalizeSubjectText(btebDirect.name), num);
        jsonSubjectFullMarksMap.set(canonicalizeSubjectTokens(normalizeSubjectText(btebDirect.name)), num);
      }

      // Cross-register with MASTER_CURRICULUM_DATA
      const curriMatch = MASTER_CURRICULUM_DATA.find((c) => {
        const cCode = toEnglishDigits(c.subjectCode).trim();
        if (cleanDigits === cCode) return true;
        const cNorm = normalizeSubjectText(c.subjectName);
        if (normText === cNorm || canonText === canonicalizeSubjectTokens(cNorm)) return true;
        return false;
      });
      if (curriMatch) {
        jsonSubjectFullMarksMap.set(curriMatch.subjectCode, num);
        jsonSubjectFullMarksMap.set(curriMatch.subjectName, num);
        jsonSubjectFullMarksMap.set(curriMatch.subjectName.toLowerCase(), num);
        jsonSubjectFullMarksMap.set(normalizeSubjectText(curriMatch.subjectName), num);
        jsonSubjectFullMarksMap.set(canonicalizeSubjectTokens(normalizeSubjectText(curriMatch.subjectName)), num);
      }

      // Cross-register with availableBooks if passed
      if (Array.isArray(availableBooks) && availableBooks.length > 0) {
        const bookMatch = availableBooks.find((b) => {
          const bCode = toEnglishDigits(b.subjectCode).trim();
          if (cleanDigits === bCode) return true;
          const bNorm = normalizeSubjectText(b.subjectName);
          if (normText === bNorm || canonText === canonicalizeSubjectTokens(bNorm)) return true;
          return false;
        });
        if (bookMatch) {
          jsonSubjectFullMarksMap.set(bookMatch.subjectCode, num);
          jsonSubjectFullMarksMap.set(bookMatch.subjectName, num);
        }
      }
    };

    // Check top-level properties if parsed is an object
    if (!Array.isArray(parsed) && typeof parsed === 'object' && parsed !== null) {
      rawDetectedExamTitle =
        parsed.examTitle ||
        parsed.exam_title ||
        parsed.examName ||
        parsed.exam_name ||
        parsed.exam ||
        parsed.title ||
        parsed['পরীক্ষার নাম'] ||
        parsed['পরীক্ষা'] ||
        '';
      rawDetectedSemester =
        parsed.semester ||
        parsed.semester_id ||
        parsed.semesterId ||
        parsed.sem ||
        parsed['সেমিস্টার'] ||
        parsed['পর্ব'] ||
        '';
      rawDetectedDept =
        parsed.department ||
        parsed.department_name ||
        parsed.departmentName ||
        parsed.dept ||
        parsed.technology ||
        parsed.tech ||
        parsed['টেকনোলজি'] ||
        parsed['বিভাগ'] ||
        parsed.departmentId ||
        '';

      // Accept explicit top-level default subject full marks if explicitly specified
      const rawF = parsed.defaultFullMarks || parsed.defaultSubjectFullMarks || parsed.subjectDefaultFullMarks || parsed.subjectFullMarks;
      if (typeof rawF === 'number' && rawF > 0) {
        explicitTopFullMarks = rawF;
      } else if (typeof rawF === 'string' && Number(toEnglishDigits(rawF)) > 0) {
        explicitTopFullMarks = Number(toEnglishDigits(rawF));
      } else if (typeof parsed.fullMarks === 'number' && parsed.fullMarks > 0) {
        explicitTopFullMarks = parsed.fullMarks;
      } else if (typeof parsed.fullMarks === 'string' && Number(toEnglishDigits(parsed.fullMarks)) > 0) {
        explicitTopFullMarks = Number(toEnglishDigits(parsed.fullMarks));
      }

      if (parsed.fullMarks && typeof parsed.fullMarks === 'object' && !Array.isArray(parsed.fullMarks)) {
        Object.entries(parsed.fullMarks).forEach(([k, v]) => recordJsonSubjectFullMark(k, v));
      }
      if (parsed.fullMarksMap && typeof parsed.fullMarksMap === 'object') {
        Object.entries(parsed.fullMarksMap).forEach(([k, v]) => recordJsonSubjectFullMark(k, v));
      }
      if (parsed.f && typeof parsed.f === 'object') {
        Object.entries(parsed.f).forEach(([k, v]) => recordJsonSubjectFullMark(k, v));
      }
      if (parsed.full && typeof parsed.full === 'object') {
        Object.entries(parsed.full).forEach(([k, v]) => recordJsonSubjectFullMark(k, v));
      }
      if (Array.isArray(parsed.subjects)) {
        parsed.subjects.forEach((s: any) => {
          if (!s || typeof s !== 'object') return;
          const fm = s.fullMarks ?? s.f ?? s.full ?? s.maxMarks ?? s.fm;
          if (s.subjectCode) recordJsonSubjectFullMark(String(s.subjectCode), fm);
          if (s.code) recordJsonSubjectFullMark(String(s.code), fm);
          if (s.subjectName) recordJsonSubjectFullMark(String(s.subjectName), fm);
          if (s.name) recordJsonSubjectFullMark(String(s.name), fm);
        });
      }
    }

    // Scan each item in dataList for exam info and full marks definitions
    for (const item of dataList) {
      if (!item || typeof item !== 'object') continue;
      if (!rawDetectedExamTitle) {
        rawDetectedExamTitle =
          item.examTitle ||
          item.exam_title ||
          item.examName ||
          item.exam_name ||
          item.exam ||
          item.title ||
          item['পরীক্ষার নাম'] ||
          item['পরীক্ষা'] ||
          '';
      }
      if (!rawDetectedSemester) {
        rawDetectedSemester =
          item.semester ||
          item.semester_id ||
          item.semesterId ||
          item.sem ||
          item['সেমিস্টার'] ||
          item['পর্ব'] ||
          '';
      }
      if (!rawDetectedDept) {
        rawDetectedDept =
          item.department ||
          item.department_name ||
          item.departmentName ||
          item.dept ||
          item.technology ||
          item.tech ||
          item['টেকনোলজি'] ||
          item['বিভাগ'] ||
          item.departmentId ||
          '';
      }

      if (item.defaultFullMarks && typeof item.defaultFullMarks === 'number' && item.defaultFullMarks > 0) {
        if (!explicitTopFullMarks) explicitTopFullMarks = item.defaultFullMarks;
      }
      if (item.fullMarks && typeof item.fullMarks === 'object' && !Array.isArray(item.fullMarks)) {
        Object.entries(item.fullMarks).forEach(([k, v]) => recordJsonSubjectFullMark(k, v));
      }
      if (item.fullMarksMap && typeof item.fullMarksMap === 'object') {
        Object.entries(item.fullMarksMap).forEach(([k, v]) => recordJsonSubjectFullMark(k, v));
      }
      if (item.f && typeof item.f === 'object') {
        Object.entries(item.f).forEach(([k, v]) => recordJsonSubjectFullMark(k, v));
      }
      if (Array.isArray(item.subjects)) {
        item.subjects.forEach((s: any) => {
          if (!s || typeof s !== 'object') return;
          const fm = s.fullMarks ?? s.f ?? s.full ?? s.maxMarks ?? s.fm ?? s.fMarks;
          if (s.subjectCode) recordJsonSubjectFullMark(String(s.subjectCode), fm);
          if (s.code) recordJsonSubjectFullMark(String(s.code), fm);
          if (s.subjectName) recordJsonSubjectFullMark(String(s.subjectName), fm);
          if (s.name) recordJsonSubjectFullMark(String(s.name), fm);
        });
      }

      // Check object subjects map
      const objSubjects =
        typeof item.subjects === 'object' && !Array.isArray(item.subjects)
          ? item.subjects
          : typeof item.marks === 'object' && !Array.isArray(item.marks)
          ? item.marks
          : null;
      if (objSubjects) {
        Object.entries(objSubjects).forEach(([k, val]) => {
          if (typeof val === 'object' && val !== null) {
            const fm = (val as any).fullMarks ?? (val as any).f ?? (val as any).full ?? (val as any).maxMarks ?? (val as any).fm;
            if (fm) recordJsonSubjectFullMark(k, fm);
          }
        });
      }

      // Check flat keys for f_ or embedded full marks
      Object.entries(item).forEach(([k, val]) => {
        if (/^(f_|full_|fm_|fullMarks_|পূর্ণমান_)/i.test(k)) {
          const targetSub = k.replace(/^(f_|full_|fm_|fullMarks_|পূর্ণমান_)/i, '');
          recordJsonSubjectFullMark(targetSub, val);
        }
        const keyInfo = extractFullMarksFromKey(k);
        if (keyInfo.extractedFullMarks) {
          recordJsonSubjectFullMark(keyInfo.cleanKey, keyInfo.extractedFullMarks);
        }
        if (typeof val === 'object' && val !== null) {
          const fm = (val as any).fullMarks ?? (val as any).f ?? (val as any).full ?? (val as any).maxMarks ?? (val as any).fm;
          if (fm) {
            recordJsonSubjectFullMark(keyInfo.cleanKey || k, fm);
          }
        }
      });
    }

    const defaultSubjectFullMarks = explicitTopFullMarks;

    // Helper to query full marks explicitly supplied by the user in the JSON
    const lookupJsonFullMarks = (code?: string, name?: string, rawKey?: string): number | undefined => {
      if (rawKey) {
        const keyInfo = extractFullMarksFromKey(rawKey);
        if (keyInfo.extractedFullMarks) return keyInfo.extractedFullMarks;
        const normKey = rawKey.trim();
        if (jsonSubjectFullMarksMap.has(normKey)) return jsonSubjectFullMarksMap.get(normKey);
        if (jsonSubjectFullMarksMap.has(normKey.toLowerCase())) return jsonSubjectFullMarksMap.get(normKey.toLowerCase());
        const cleanedNorm = normalizeSubjectKey(normKey);
        if (jsonSubjectFullMarksMap.has(cleanedNorm)) return jsonSubjectFullMarksMap.get(cleanedNorm);
        const normText = normalizeSubjectText(normKey);
        if (jsonSubjectFullMarksMap.has(normText)) return jsonSubjectFullMarksMap.get(normText);
        const canonText = canonicalizeSubjectTokens(normText);
        if (jsonSubjectFullMarksMap.has(canonText)) return jsonSubjectFullMarksMap.get(canonText);
      }
      if (code) {
        const cleanCode = toEnglishDigits(code.trim());
        if (jsonSubjectFullMarksMap.has(cleanCode)) return jsonSubjectFullMarksMap.get(cleanCode);
        if (jsonSubjectFullMarksMap.has(code.trim())) return jsonSubjectFullMarksMap.get(code.trim());
      }
      if (name) {
        const normName = name.trim();
        if (jsonSubjectFullMarksMap.has(normName)) return jsonSubjectFullMarksMap.get(normName);
        if (jsonSubjectFullMarksMap.has(normName.toLowerCase())) return jsonSubjectFullMarksMap.get(normName.toLowerCase());
        const normSubject = normalizeSubjectText(normName);
        if (jsonSubjectFullMarksMap.has(normSubject)) return jsonSubjectFullMarksMap.get(normSubject);
        const canonSubject = canonicalizeSubjectTokens(normSubject);
        if (jsonSubjectFullMarksMap.has(canonSubject)) return jsonSubjectFullMarksMap.get(canonSubject);
        const canonKey = normalizeSubjectKey(normName);
        if (jsonSubjectFullMarksMap.has(canonKey)) return jsonSubjectFullMarksMap.get(canonKey);
      }
      return undefined;
    };

    const topExamTitle = String(rawDetectedExamTitle || '').trim();
    const topSemester = normalizeSemester(rawDetectedSemester);
    const topDept = normalizeDepartment(rawDetectedDept);

    if (!targetExam && topExamTitle) {
      const match = allExams.find(
        (ex) =>
          ex.title.toLowerCase() === topExamTitle.toLowerCase() ||
          (ex.semesterId === topSemester && ex.departmentId === topDept.id)
      );
      if (match) targetExam = match;
    }

    // Step 1: Detect all unique subjects present in the JSON payload
    const detectedSubjectMetaMap = new Map<string, ResolvedSubjectMeta>();
    const unresolvedBanglaSet = new Set<string>();
    const matchedDatabaseSubjectsMap = new Map<string, MatchedDatabaseSubjectInfo>();
    const ambiguousSubjectsMap = new Map<string, AmbiguousMatchInfo[]>();
    const codeMismatchWarningsSet = new Set<string>();
    const unmatchedSubjectsSet = new Set<string>();

    dataList.forEach((item) => {
      if (!item || typeof item !== 'object') return;

      const registerSubject = (
        rawKey: string,
        rawVal: any,
        explicitSubCode?: string,
        explicitSubName?: string
      ) => {
        if (!rawKey && !explicitSubCode && !explicitSubName) return;
        const keyInfo = extractFullMarksFromKey(rawKey);
        const actualKey = keyInfo.cleanKey || rawKey;

        let explicitFull: number | undefined = keyInfo.extractedFullMarks;
        if (!explicitFull && typeof rawVal === 'object' && rawVal !== null) {
          const rawF =
            (rawVal as any).fullMarks ??
            (rawVal as any).f ??
            (rawVal as any).full ??
            (rawVal as any).maxMarks ??
            (rawVal as any).subjectFullMarks ??
            (rawVal as any).fm;
          if (Number(rawF) > 0) explicitFull = Number(rawF);
        }
        if (!explicitFull) {
          const rawF =
            (item as any)[`f_${rawKey}`] ??
            (item as any)[`f_${actualKey}`] ??
            (item as any)[`full_${rawKey}`] ??
            (item as any)[`full_${actualKey}`] ??
            (item as any)?.f?.[rawKey] ??
            (item as any)?.f?.[actualKey] ??
            (item as any)?.fullMarks?.[rawKey] ??
            (item as any)?.fullMarks?.[actualKey];
          if (Number(rawF) > 0) explicitFull = Number(rawF);
        }
        if (!explicitFull) {
          explicitFull = lookupJsonFullMarks(explicitSubCode, explicitSubName || actualKey, rawKey);
        }

        const meta = resolveSubjectMeta(
          actualKey,
          explicitFull || defaultSubjectFullMarks,
          targetExam?.subjects,
          explicitSubCode,
          explicitSubName,
          topDept?.name,
          topSemester,
          availableBooks
        );

        // Strictly prioritize JSON-provided full marks over database defaults
        const finalFull =
          explicitFull ||
          lookupJsonFullMarks(meta.code, meta.name, actualKey) ||
          (Number(meta.fullMarks) > 0 ? Number(meta.fullMarks) : 0) ||
          defaultSubjectFullMarks ||
          100;
        meta.fullMarks = finalFull;
        if (explicitFull || finalFull) {
          recordJsonSubjectFullMark(meta.code, finalFull);
          recordJsonSubjectFullMark(meta.name, finalFull);
          recordJsonSubjectFullMark(actualKey, finalFull);
        }

        if (!meta.isBanglaResolved && !containsBangla(meta.name)) {
          unresolvedBanglaSet.add(meta.name);
        }
        if (meta.isMatchedFromDatabase) {
          matchedDatabaseSubjectsMap.set(meta.code, {
            subjectName: meta.name,
            subjectCode: meta.code,
            originalName: meta.originalName,
            semesterId: topSemester,
            technology: topDept?.name,
          });
        }
        if (meta.isAmbiguous && meta.ambiguousCandidates) {
          ambiguousSubjectsMap.set(meta.originalName || meta.name, meta.ambiguousCandidates);
        }
        if (meta.codeMismatchWarning) {
          codeMismatchWarningsSet.add(meta.codeMismatchWarning);
        }
        if (meta.isUnmatched) {
          unmatchedSubjectsSet.add(meta.originalName || meta.name);
        }

        // Retain any explicit full marks if already registered
        const existingMeta = detectedSubjectMetaMap.get(meta.code);
        if (existingMeta && Number(existingMeta.fullMarks) > 0 && (!explicitFull && !defaultSubjectFullMarks)) {
          meta.fullMarks = existingMeta.fullMarks;
        }
        detectedSubjectMetaMap.set(meta.code, meta);
      };

      // Case A: item.subjects as an Array
      if (Array.isArray(item.subjects)) {
        item.subjects.forEach((s: any) => {
          if (!s) return;
          const codeKey = s.subjectCode || s.code || s.name || s.subject;
          const subCode = s.subjectCode || s.code;
          const subName = s.subjectName || s.name || s.subject;
          if (codeKey) {
            registerSubject(codeKey, s, subCode, subName);
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
          let subCode: string | undefined = /^\d{5}$/.test(k.trim()) ? k.trim() : undefined;
          let subName: string | undefined;
          if (typeof val === 'object' && val !== null) {
            if ((val as any).subjectCode || (val as any).code) subCode = (val as any).subjectCode || (val as any).code;
            if ((val as any).subjectName || (val as any).name) subName = (val as any).subjectName || (val as any).name;
          }
          registerSubject(k, val, subCode, subName);
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
          isNullMarksValue(val) ||
          (typeof val === 'object' && val !== null && ((val as any).obtainedMarks !== undefined || (val as any).marks !== undefined || (val as any).score !== undefined))
        ) {
          let subCode: string | undefined = /^\d{5}$/.test(k.trim()) ? k.trim() : undefined;
          let subName: string | undefined;
          if (typeof val === 'object' && val !== null) {
            if ((val as any).subjectCode || (val as any).code) subCode = (val as any).subjectCode || (val as any).code;
            if ((val as any).subjectName || (val as any).name) subName = (val as any).subjectName || (val as any).name;
          }
          registerSubject(k, val, subCode, subName);
        }
      });
    });

    const detectedSubjects: ExamSubject[] = Array.from(detectedSubjectMetaMap.values());

    // Determine applicable curriculum subjects based on topSemester and topDept,
    // prioritizing any JSON-supplied full marks over database defaults
    const curriculumSubjects = getAutoLoadedCurriculumSubjects(
      [topDept.id, topDept.name],
      topSemester
    ).map((s) => {
      const jsonFull = lookupJsonFullMarks(s.subjectCode, s.subjectName);
      return {
        code: s.subjectCode,
        name: s.subjectName,
        fullMarks:
          jsonFull ||
          (Number(s.curriculumFullMarks) > 0 ? Number(s.curriculumFullMarks) : 0) ||
          defaultSubjectFullMarks ||
          100,
      };
    });

    // Build effective subject map ensuring all applicable subjects for this semester and technology are included
    const effectiveSubjectMap = new Map<string, ExamSubject>();

    // A. First add targetExam subjects if predefined (updating any fullMarks specified in JSON)
    if (targetExam && targetExam.subjects && targetExam.subjects.length > 0) {
      targetExam.subjects.forEach((s) => {
        if (s.code) {
          const jsonFull = lookupJsonFullMarks(s.code, s.name);
          effectiveSubjectMap.set(s.code, {
            ...s,
            fullMarks: jsonFull || Number(s.fullMarks) || 100,
          });
        }
      });
    }

    // B. Second add curriculum subjects for this semester and technology
    curriculumSubjects.forEach((s) => {
      if (!effectiveSubjectMap.has(s.code)) {
        effectiveSubjectMap.set(s.code, s);
      }
    });

    // C. Third add all detected subjects from the JSON
    detectedSubjects.forEach((s) => {
      const existing = effectiveSubjectMap.get(s.code);
      const jsonFull = lookupJsonFullMarks(s.code, s.name, (s as any).originalName);
      const chosenFull =
        jsonFull ||
        (Number(s.fullMarks) > 0 ? Number(s.fullMarks) : 0) ||
        (Number(existing?.fullMarks) > 0 ? Number(existing?.fullMarks) : 0) ||
        defaultSubjectFullMarks ||
        100;
      if (existing) {
        effectiveSubjectMap.set(s.code, {
          ...existing,
          ...s,
          fullMarks: chosenFull,
        });
      } else {
        effectiveSubjectMap.set(s.code, {
          ...s,
          fullMarks: chosenFull,
        });
      }
    });

    const effectiveSubjects: ExamSubject[] = Array.from(effectiveSubjectMap.values());

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
    } else {
      targetExam = {
        ...targetExam,
        subjects: effectiveSubjects,
        totalMarks: dynamicExamTotalFullMarks,
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
      const itemDeptRaw =
        item.department ||
        item.department_name ||
        item.departmentName ||
        item.dept ||
        item.technology ||
        item.tech ||
        item['টেকনোলজি'] ||
        item['বিভাগ'] ||
        item.departmentId;
      const itemDept = itemDeptRaw ? normalizeDepartment(String(itemDeptRaw).trim()) : topDept;
      const itemSemRaw =
        item.semester ||
        item.semester_id ||
        item.semesterId ||
        item.sem ||
        item['সেমিস্টার'] ||
        item['পর্ব'];
      const itemSemester = itemSemRaw ? normalizeSemester(String(itemSemRaw).trim()) : topSemester;
      const itemExamTitle =
        item.examTitle ||
        item.exam_title ||
        item.examName ||
        item.exam_name ||
        item.exam ||
        item.title ||
        item['পরীক্ষার নাম'] ||
        item['পরীক্ষা'] ||
        topExamTitle;

      if (!roll) rowErrors.push(`সারি ${rowNumber}: রোল নম্বর অনুপস্থিত`);
      if (!studentName) rowErrors.push(`সারি ${rowNumber}: শিক্ষার্থীর নাম অনুপস্থিত`);

      const subjectMarks: { [code: string]: number } = {};
      const subjectResults: SubjectResult[] = [];
      const studentSubjectEntries: {
        rawKey: string;
        rawVal: any;
        explicitFullMarks?: number;
        explicitSubjectCode?: string;
        explicitSubjectName?: string;
      }[] = [];

      // 1. Check item.subjects array
      if (Array.isArray(item.subjects)) {
        item.subjects.forEach((s: any) => {
          if (!s || typeof s !== 'object') return;
          const k = s.subjectCode || s.code || s.name || s.subject;
          const subCode = s.subjectCode || s.code;
          const subName = s.subjectName || s.name || s.subject;
          const v = s.obtainedMarks !== undefined ? s.obtainedMarks : s.marks !== undefined ? s.marks : s.score !== undefined ? s.score : s.val;
          const rawF = s.fullMarks ?? s.f ?? s.full ?? s.maxMarks ?? s.subjectFullMarks ?? s.fm ?? s.fMarks;
          if (k && (v !== undefined || isNullMarksValue(v) || s.obtainedMarks === null || s.marks === null || s.score === null)) {
            studentSubjectEntries.push({
              rawKey: String(k),
              rawVal: v ?? null,
              explicitFullMarks: Number(rawF) > 0 ? Number(rawF) : undefined,
              explicitSubjectCode: subCode,
              explicitSubjectName: subName,
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
          if (!k || v === undefined) return;
          let val = v;
          let full: number | undefined;
          let subCode: string | undefined = /^\d{5}$/.test(k.trim()) ? k.trim() : undefined;
          let subName: string | undefined;
          if (typeof v === 'object' && v !== null) {
            val = (v as any).obtainedMarks !== undefined ? (v as any).obtainedMarks : (v as any).marks !== undefined ? (v as any).marks : (v as any).score !== undefined ? (v as any).score : (v as any).val;
            const rawF = (v as any).fullMarks ?? (v as any).f ?? (v as any).full ?? (v as any).maxMarks ?? (v as any).subjectFullMarks ?? (v as any).fm;
            if (Number(rawF) > 0) full = Number(rawF);
            if ((v as any).subjectCode || (v as any).code) subCode = (v as any).subjectCode || (v as any).code;
            if ((v as any).subjectName || (v as any).name) subName = (v as any).subjectName || (v as any).name;
          }
          if (!full) {
            const rawF = (item as any)[`f_${k}`] ?? (item as any)[`full_${k}`] ?? (item as any)?.f?.[k] ?? (item as any)?.fullMarks?.[k];
            if (Number(rawF) > 0) full = Number(rawF);
          }
          if (val !== undefined) {
            studentSubjectEntries.push({
              rawKey: k,
              rawVal: val,
              explicitFullMarks: full,
              explicitSubjectCode: subCode,
              explicitSubjectName: subName,
            });
          }
        });
      }

      // 3. Check flat keys on item
      Object.entries(item).forEach(([k, v]) => {
        if (!k || v === undefined) return;
        const lowerK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (RESERVED_STUDENT_KEYS.has(lowerK) || RESERVED_STUDENT_KEYS.has(k.toLowerCase())) return;
        if (k.startsWith('f_') || k.startsWith('full_') || k.startsWith('fm_')) return;

        const keyInfo = extractFullMarksFromKey(k);
        const actualK = keyInfo.cleanKey || k;

        let val = v;
        let full: number | undefined = keyInfo.extractedFullMarks;
        let subCode: string | undefined = /^\d{5}$/.test(actualK.trim()) ? actualK.trim() : undefined;
        let subName: string | undefined;
        if (typeof v === 'object' && v !== null) {
          val = (v as any).obtainedMarks !== undefined ? (v as any).obtainedMarks : (v as any).marks !== undefined ? (v as any).marks : (v as any).score !== undefined ? (v as any).score : (v as any).val;
          const rawF = (v as any).fullMarks ?? (v as any).f ?? (v as any).full ?? (v as any).maxMarks ?? (v as any).subjectFullMarks ?? (v as any).fm;
          if (Number(rawF) > 0) full = Number(rawF);
          if ((v as any).subjectCode || (v as any).code) subCode = (v as any).subjectCode || (v as any).code;
          if ((v as any).subjectName || (v as any).name) subName = (v as any).subjectName || (v as any).name;
        }

        if (!full) {
          const rawF =
            (item as any)[`f_${k}`] ??
            (item as any)[`f_${actualK}`] ??
            (item as any)[`full_${k}`] ??
            (item as any)[`full_${actualK}`] ??
            (item as any)?.f?.[k] ??
            (item as any)?.f?.[actualK] ??
            (item as any)?.fullMarks?.[k] ??
            (item as any)?.fullMarks?.[actualK];
          if (Number(rawF) > 0) full = Number(rawF);
        }

        if (!full) {
          full = lookupJsonFullMarks(subCode, subName || actualK, k);
        }

        const isNumeric = val !== null && val !== undefined && String(val).trim() !== '' && !isNaN(Number(toEnglishDigits(String(val).trim())));
        const isNullMark = isNullMarksValue(val);

        if (isNumeric || isNullMark) {
          const alreadyAdded = studentSubjectEntries.some((e) => e.rawKey.toLowerCase() === k.toLowerCase() || e.rawKey.toLowerCase() === actualK.toLowerCase());
          if (!alreadyAdded) {
            studentSubjectEntries.push({
              rawKey: k,
              rawVal: isNullMark ? null : val,
              explicitFullMarks: full,
              explicitSubjectCode: subCode,
              explicitSubjectName: subName,
            });
          }
        }
      });

      // Process subjects for this student:
      // Iterate over all applicable subjects for this exam/semester/technology (effectiveSubjects)
      // to guarantee that no subject disappears or is dropped from the result.
      effectiveSubjects.forEach((subj) => {
        // Find if this student provided a mark for this subject
        const matchEntry = studentSubjectEntries.find((entry) => {
          if (entry.explicitSubjectCode && entry.explicitSubjectCode === subj.code) return true;
          const meta = resolveSubjectMeta(
            entry.rawKey,
            entry.explicitFullMarks,
            targetExam?.subjects,
            entry.explicitSubjectCode,
            entry.explicitSubjectName,
            itemDept?.name || topDept?.name,
            itemSemester || topSemester,
            availableBooks
          );
          return meta.code === subj.code || meta.name.toLowerCase() === subj.name.toLowerCase();
        });

        const jsonFull = lookupJsonFullMarks(subj.code, subj.name, matchEntry?.rawKey);
        let subFullMarks =
          Number(matchEntry?.explicitFullMarks) > 0
            ? Number(matchEntry?.explicitFullMarks)
            : jsonFull
            ? jsonFull
            : Number(subj.fullMarks) > 0
            ? Number(subj.fullMarks)
            : defaultSubjectFullMarks
            ? defaultSubjectFullMarks
            : 100;

        if (!matchEntry || isNullMarksValue(matchEntry.rawVal)) {
          // Marks are null, empty, unassigned, or subject was not in student object (absent):
          // Always keep subject row in result with null marks and "—"
          subjectResults.push({
            subjectCode: subj.code,
            subjectName: subj.name,
            originalSubjectName: matchEntry?.rawKey || subj.originalName,
            fullMarks: subFullMarks,
            obtainedMarks: null,
            grade: '—',
            gradePoint: 0,
            isPassed: true,
            isMatchedFromDatabase: subj.isMatchedFromDatabase,
            isAmbiguous: subj.isAmbiguous,
            isCodeInvalid: subj.isCodeInvalid,
            codeMismatchWarning: subj.codeMismatchWarning,
            ambiguousCandidates: subj.ambiguousCandidates,
          });
          return;
        }

        const rawVal = matchEntry.rawVal;
        const numericVal = Number(toEnglishDigits(String(rawVal).trim()));

        if (isNaN(numericVal)) {
          rowErrors.push(`সারি ${rowNumber}: '${subj.name}' বিষয়ের নম্বর সঠিক নয় (${rawVal})`);
          subjectMarks[subj.code] = 0;
          subjectResults.push({
            subjectCode: subj.code,
            subjectName: subj.name,
            originalSubjectName: matchEntry?.rawKey || subj.originalName,
            fullMarks: subFullMarks,
            obtainedMarks: 0,
            grade: 'F',
            gradePoint: 0,
            isPassed: false,
            isMatchedFromDatabase: subj.isMatchedFromDatabase,
            isAmbiguous: subj.isAmbiguous,
            isCodeInvalid: subj.isCodeInvalid,
            codeMismatchWarning: subj.codeMismatchWarning,
            ambiguousCandidates: subj.ambiguousCandidates,
          });
        } else if (numericVal < 0) {
          rowErrors.push(`সারি ${rowNumber}: '${subj.name}' প্রাপ্ত নম্বর নেতিবাচক হতে পারে না (${numericVal})`);
          subjectMarks[subj.code] = numericVal;
          subjectResults.push({
            subjectCode: subj.code,
            subjectName: subj.name,
            originalSubjectName: matchEntry?.rawKey || subj.originalName,
            fullMarks: subFullMarks,
            obtainedMarks: numericVal,
            grade: 'F',
            gradePoint: 0,
            isPassed: false,
            isMatchedFromDatabase: subj.isMatchedFromDatabase,
            isAmbiguous: subj.isAmbiguous,
            isCodeInvalid: subj.isCodeInvalid,
            codeMismatchWarning: subj.codeMismatchWarning,
            ambiguousCandidates: subj.ambiguousCandidates,
          });
        } else if (subFullMarks > 0 && numericVal > subFullMarks) {
          if (matchEntry?.explicitFullMarks) {
            rowErrors.push(`সারি ${rowNumber}: '${subj.name}' প্রাপ্ত নম্বর (${numericVal}) পূর্ণমান (${subFullMarks})-এর চেয়ে বেশি!`);
          } else {
            subFullMarks = numericVal <= 100 ? 100 : Math.ceil(numericVal / 50) * 50;
          }
          const gradeInfo = calculateSubjectGrade(numericVal, subFullMarks);
          subjectMarks[subj.code] = numericVal;
          subjectResults.push({
            subjectCode: subj.code,
            subjectName: subj.name,
            originalSubjectName: matchEntry?.rawKey || subj.originalName,
            fullMarks: subFullMarks,
            obtainedMarks: numericVal,
            grade: gradeInfo.grade,
            gradePoint: gradeInfo.gradePoint,
            isPassed: gradeInfo.isPassed,
            isMatchedFromDatabase: subj.isMatchedFromDatabase,
            isAmbiguous: subj.isAmbiguous,
            isCodeInvalid: subj.isCodeInvalid,
            codeMismatchWarning: subj.codeMismatchWarning,
            ambiguousCandidates: subj.ambiguousCandidates,
          });
        } else {
          subjectMarks[subj.code] = numericVal;
          const subGrade = calculateSubjectGrade(numericVal, subFullMarks, gradingRules);
          subjectResults.push({
            subjectCode: subj.code,
            subjectName: subj.name,
            originalSubjectName: matchEntry?.rawKey || subj.originalName,
            fullMarks: subFullMarks,
            obtainedMarks: numericVal,
            grade: subGrade.grade,
            gradePoint: subGrade.gradePoint,
            isPassed: subGrade.isPassed,
            isMatchedFromDatabase: subj.isMatchedFromDatabase,
            isAmbiguous: subj.isAmbiguous,
            isCodeInvalid: subj.isCodeInvalid,
            codeMismatchWarning: subj.codeMismatchWarning,
            ambiguousCandidates: subj.ambiguousCandidates,
          });
        }
      });

      // Second, preserve any extra student subjects not already in effectiveSubjects
      studentSubjectEntries.forEach((entry) => {
        const meta = resolveSubjectMeta(
          entry.rawKey,
          entry.explicitFullMarks,
          targetExam?.subjects,
          entry.explicitSubjectCode,
          entry.explicitSubjectName,
          itemDept?.name || topDept?.name,
          itemSemester || topSemester,
          availableBooks
        );
        const alreadyAdded = subjectResults.some(
          (s) => s.subjectCode === meta.code || s.subjectName.toLowerCase() === meta.name.toLowerCase()
        );
        if (alreadyAdded) return;

        let subFullMarks =
          Number(entry.explicitFullMarks) > 0
            ? Number(entry.explicitFullMarks)
            : Number(meta.fullMarks) > 0
            ? Number(meta.fullMarks)
            : 100;

        const rawVal = entry.rawVal;
        if (isNullMarksValue(rawVal)) {
          subjectResults.push({
            subjectCode: meta.code,
            subjectName: meta.name,
            originalSubjectName: meta.originalName || entry.explicitSubjectName,
            fullMarks: subFullMarks,
            obtainedMarks: null,
            grade: '—',
            gradePoint: 0,
            isPassed: true,
            isMatchedFromDatabase: meta.isMatchedFromDatabase,
            isAmbiguous: meta.isAmbiguous,
            isCodeInvalid: meta.isCodeInvalid,
            codeMismatchWarning: meta.codeMismatchWarning,
            ambiguousCandidates: meta.ambiguousCandidates,
          });
          return;
        }

        const numericVal = Number(toEnglishDigits(String(rawVal).trim()));
        if (!isNaN(numericVal) && numericVal >= 0) {
          const subGrade = calculateSubjectGrade(numericVal, subFullMarks, gradingRules);
          subjectMarks[meta.code] = numericVal;
          subjectResults.push({
            subjectCode: meta.code,
            subjectName: meta.name,
            originalSubjectName: meta.originalName || entry.explicitSubjectName,
            fullMarks: subFullMarks,
            obtainedMarks: numericVal,
            grade: subGrade.grade,
            gradePoint: subGrade.gradePoint,
            isPassed: subGrade.isPassed,
            isMatchedFromDatabase: meta.isMatchedFromDatabase,
            isAmbiguous: meta.isAmbiguous,
            isCodeInvalid: meta.isCodeInvalid,
            codeMismatchWarning: meta.codeMismatchWarning,
            ambiguousCandidates: meta.ambiguousCandidates,
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

    const unresolvedBanglaList = Array.from(unresolvedBanglaSet);

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
      detectedSubjects,
      autoCreatedExam: autoCreated,
      unresolvedBanglaSubjects: unresolvedBanglaList.length > 0 ? unresolvedBanglaList : undefined,
      matchedDatabaseSubjects: Array.from(matchedDatabaseSubjectsMap.values()),
      ambiguousSubjects: Array.from(ambiguousSubjectsMap.entries()).map(([inputName, candidates]) => ({
        inputName,
        candidates,
      })),
      codeMismatchWarnings: Array.from(codeMismatchWarningsSet),
      unmatchedSubjects: Array.from(unmatchedSubjectsSet),
    };
  } catch (err: any) {
    throw new Error(`JSON ফাইল পড়তে ব্যর্থ: ${err.message}`);
  }
}
