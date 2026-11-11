import {
  Student,
  StudentResult,
  SemesterId,
  Department,
  Exam,
} from '../types';
import {
  toEnglishDigits,
  toBanglaDigits,
  SEMESTER_MAP,
} from '../utils/bangla';
import { normalizeDepartment, normalizeSemester } from './excel';
import {
  generateDynamicResultId,
  generateVerificationCode,
} from './db';

export const DEFAULT_INSTITUTE_NAME = 'দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট, ভোলা সদর, ভোলা';

/**
 * Case-insensitive & multi-alias technology/department resolver.
 * Handles English (CMT, cmt, Computer, CIVIL, ce, ct, ELECTRICAL, et, eee, MECHANICAL, me, mt, etc.)
 * and Bengali (কম্পিউটার, সিভিল, ইত্যাদি)
 */
export function resolveTechnology(rawTech?: string): { id: string; name: string } {
  if (!rawTech) {
    return { id: 'cmt', name: 'কম্পিউটার টেকনোলজি' };
  }
  const clean = String(rawTech).trim();
  const lower = clean.toLowerCase();

  // 1. Civil Technology (ce, ct, civil, etc.)
  if (
    lower === 'civil' ||
    lower === 'ce' ||
    lower === 'ct' ||
    lower.includes('civil') ||
    clean.includes('সিভিল')
  ) {
    return { id: 'ct', name: 'সিভিল টেকনোলজি' };
  }

  // 2. Electrical Technology (et, eee, ee, electrical, etc.)
  if (
    lower === 'electrical' ||
    lower === 'eee' ||
    lower === 'ee' ||
    lower === 'et' ||
    lower.includes('elect') ||
    clean.includes('ইলেকট্রিক্যাল')
  ) {
    return { id: 'et', name: 'ইলেকট্রিক্যাল টেকনোলজি' };
  }

  // 3. Mechanical Technology (me, mt, mechanical, etc.)
  if (
    lower === 'mechanical' ||
    lower === 'me' ||
    lower === 'mt' ||
    lower.includes('mech') ||
    clean.includes('মেকানিক্যাল')
  ) {
    return { id: 'mt', name: 'মেকানিক্যাল টেকনোলজি' };
  }

  // 4. Computer Technology (cmt, cse, cst, it, computer, etc.)
  if (
    lower === 'cmt' ||
    lower === 'computer' ||
    lower === 'cse' ||
    lower === 'cst' ||
    lower === 'it' ||
    lower.includes('comp') ||
    clean.includes('কম্পিউটার')
  ) {
    return { id: 'cmt', name: 'কম্পিউটার টেকনোলজি' };
  }

  // 5. Electronics Technology (ent, electronics, etc.)
  if (
    lower === 'ent' ||
    lower === 'electronics' ||
    lower.includes('electron') ||
    clean.includes('ইলেকট্রনিক্স')
  ) {
    return { id: 'ent', name: 'ইলেকট্রনিক্স টেকনোলজি' };
  }

  // 6. Refrigeration & Air Conditioning (RAC)
  if (
    lower === 'rac' ||
    lower.includes('refrigeration') ||
    clean.includes('রেফ্রিজারেশন') ||
    clean.includes('আরএসি')
  ) {
    return { id: 'rac', name: 'আরএসি টেকনোলজি' };
  }

  // 7. Architecture Technology (aidt, arch, architecture, at)
  if (
    lower === 'architecture' ||
    lower === 'aidt' ||
    lower === 'at' ||
    lower.includes('arch') ||
    clean.includes('আর্কিটেকচার')
  ) {
    return { id: 'at', name: 'আর্কিটেকচার টেকনোলজি' };
  }

  // 8. Marine Technology (mnt, marine, mt)
  if (
    lower === 'marine' ||
    lower === 'mnt' ||
    lower.includes('marine') ||
    clean.includes('মেরিন')
  ) {
    return { id: 'marine', name: 'মেরিন টেকনোলজি' };
  }

  // 9. Surveying Technology
  if (
    lower === 'surveying' ||
    lower.includes('survey') ||
    clean.includes('সার্ভেয়িং') ||
    clean.includes('সার্ভেয়িং')
  ) {
    return { id: 'surveying', name: 'সার্ভেয়িং টেকনোলজি' };
  }

  // Normalize fallback
  const fallback = normalizeDepartment(clean);
  if (fallback && fallback.id && fallback.name) {
    return fallback;
  }

  const cleanId = lower.replace(/[^a-z0-9]/g, '').slice(0, 10) || 'gen';
  return { id: cleanId, name: clean };
}

export interface ShortResultRowValidation {
  rowNumber: number;
  rawRoll: string;
  roll: string;
  gpa: number;
  letterGrade: string;
  rawStatusText?: string;
  isPassed: boolean;

  // Department / Technology
  departmentId: string;
  departmentName: string;
  rawDepartment?: string;

  // Student match
  isStudentMatched: boolean;
  matchedStudent?: Student;
  matchedStudentName?: string;
  matchedStudentId?: string;
  matchedRegistration?: string;
  studentMatchStatus: 'MATCHED' | 'UNMATCHED' | 'AMBIGUOUS';

  // Duplicate checks
  isDuplicateInFile: boolean;
  isDuplicateInDatabase: boolean;

  // Validity
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ShortResultValidationReport {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  matchedCount: number;
  unmatchedCount: number;
  ambiguousCount: number;
  duplicateInFileCount: number;
  duplicateInDatabaseCount: number;

  detectedExamTitle: string;
  detectedAcademicYear: string;
  detectedSemesterId: SemesterId;
  detectedDepartmentId: string;
  detectedDepartmentName: string;
  detectedInstituteName?: string;

  rows: ShortResultRowValidation[];
  resultsToPublish: StudentResult[];
  errors: string[];
  warnings: string[];
  summaryMessage: string;
}

export interface ShortResultParseOptions {
  overrideExamId?: string;
  overrideExamTitle?: string;
  overrideYear?: string;
  overrideSemesterId?: SemesterId;
  overrideDepartmentId?: string;
  overrideInstituteName?: string;
  overwriteDuplicates?: boolean;
  defaultStatus?: 'PUBLISHED' | 'DRAFT';
}

/**
 * Standard Grade Point mapping for BTEB (Bangladesh Technical Education Board) 4.00 scale
 */
export function calculateShortLetterGrade(gpa: number): string {
  if (isNaN(gpa) || gpa <= 0) return 'F';
  if (gpa >= 4.0) return 'A+';
  if (gpa >= 3.75) return 'A';
  if (gpa >= 3.5) return 'A-';
  if (gpa >= 3.25) return 'B+';
  if (gpa >= 3.0) return 'B';
  if (gpa >= 2.0) return 'C';
  return 'D';
}

/**
 * Normalizes status strings from various BTEB board formats
 */
export function parseResultStatusText(statusRaw?: any): { statusText?: string; isPassed?: boolean } {
  if (!statusRaw) return {};
  const str = String(statusRaw).trim();
  if (!str) return {};

  const lower = str.toLowerCase();
  const isFailed =
    lower.includes('fail') ||
    lower.includes('refer') ||
    lower.includes('withheld') ||
    lower.includes('absent') ||
    lower.includes('expelled') ||
    str.includes('ফেল') ||
    str.includes('রেফার্ড') ||
    str.includes('অনুপস্থিত') ||
    str.includes('বহিষ্কার');

  const isPassed =
    !isFailed &&
    (lower.includes('pass') ||
      lower.includes('promoted') ||
      str.includes('উত্তীর্ণ') ||
      str.includes('পাস') ||
      str.includes('পাশ'));

  return {
    statusText: str,
    isPassed: isFailed ? false : isPassed ? true : undefined,
  };
}

/**
 * Parse and validate a BTEB Short Summary Result JSON payload.
 * Strictly adheres to non-assumptive field mapping, accurate roll matching with database students,
 * duplicate detection, and robust validation.
 */
export function parseShortResultJson(
  jsonText: string,
  existingStudents: Student[] = [],
  existingResults: StudentResult[] = [],
  options: ShortResultParseOptions = {}
): ShortResultValidationReport {
  const globalErrors: string[] = [];
  const globalWarnings: string[] = [];

  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err: any) {
    return {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      matchedCount: 0,
      unmatchedCount: 0,
      ambiguousCount: 0,
      duplicateInFileCount: 0,
      duplicateInDatabaseCount: 0,
      detectedExamTitle: options.overrideExamTitle || '',
      detectedAcademicYear: options.overrideYear || '',
      detectedSemesterId: options.overrideSemesterId || '1',
      detectedDepartmentId: options.overrideDepartmentId || '',
      detectedDepartmentName: '',
      detectedInstituteName: options.overrideInstituteName,
      rows: [],
      resultsToPublish: [],
      errors: [`JSON সিনট্যাক্স সঠিক নয়: ${err?.message || 'ভুল ফরম্যাট'}`],
      warnings: [],
      summaryMessage: 'JSON ফাইল পার্স করতে ব্যর্থ হয়েছে।',
    };
  }

  // Extract student array and top-level meta
  let rawList: any[] = [];
  let topExamTitle = '';
  let topExamYear = '';
  let topSemester = '';
  let topDept = '';
  let topInstitute = '';

  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (typeof parsed === 'object' && parsed !== null) {
    topExamTitle =
      parsed.examTitle ||
      parsed.examName ||
      parsed.exam_title ||
      parsed.exam_name ||
      parsed.exam ||
      parsed['পরীক্ষার নাম'] ||
      parsed['পরীক্ষা'] ||
      '';

    topExamYear =
      parsed.examYear ||
      parsed.academicYear ||
      parsed.year ||
      parsed.exam_year ||
      parsed['বছর'] ||
      parsed['সাল'] ||
      '';

    topSemester =
      parsed.semester ||
      parsed.semesterId ||
      parsed.semester_id ||
      parsed.sem ||
      parsed['সেমিস্টার'] ||
      parsed['পর্ব'] ||
      '';

    topDept =
      parsed.technology ||
      parsed.department ||
      parsed.dept ||
      parsed.tech ||
      parsed['টেকনোলজি'] ||
      parsed['বিভাগ'] ||
      '';

    topInstitute =
      parsed.instituteName ||
      parsed.institute ||
      parsed.college ||
      parsed.institution ||
      parsed['প্রতিষ্ঠানের নাম'] ||
      parsed['প্রতিষ্ঠান'] ||
      '';

    rawList =
      parsed.results ||
      parsed.data ||
      parsed.students ||
      parsed['ফলাফল'] ||
      parsed.items ||
      [];

    if (!Array.isArray(rawList) || rawList.length === 0) {
      // Check if the object itself is a single student object
      if (parsed.roll || parsed.rollNumber || parsed['রোল']) {
        rawList = [parsed];
      }
    }
  }

  if (!rawList || rawList.length === 0) {
    return {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      matchedCount: 0,
      unmatchedCount: 0,
      ambiguousCount: 0,
      duplicateInFileCount: 0,
      duplicateInDatabaseCount: 0,
      detectedExamTitle: options.overrideExamTitle || topExamTitle,
      detectedAcademicYear: options.overrideYear || topExamYear,
      detectedSemesterId: options.overrideSemesterId || (normalizeSemester(topSemester) as SemesterId) || '1',
      detectedDepartmentId: options.overrideDepartmentId || '',
      detectedDepartmentName: '',
      detectedInstituteName: options.overrideInstituteName || topInstitute,
      rows: [],
      resultsToPublish: [],
      errors: ['JSON ফাইলে কোনো শিক্ষার্থীর ফলাফল রেকর্ড খুঁজে পাওয়া যায়নি।'],
      warnings: [],
      summaryMessage: 'কোনো ফলাফল রেকর্ড অনুপস্থিত।',
    };
  }

  // Resolve Effective Metadata (Overrides take precedence over detected values)
  const effectiveExamTitle =
    options.overrideExamTitle?.trim() ||
    topExamTitle.trim() ||
    'বাংলাদেশ কারিগরি শিক্ষা বোর্ড সংক্ষিপ্ত ফলাফল';

  const effectiveAcademicYear =
    options.overrideYear?.trim() ||
    topExamYear.trim() ||
    new Date().getFullYear().toString();

  const effectiveSemesterId: SemesterId =
    options.overrideSemesterId ||
    (normalizeSemester(topSemester) as SemesterId) ||
    '1';

  const isAllDept = !options.overrideDepartmentId || options.overrideDepartmentId === 'ALL';
  const normDept = isAllDept
    ? { id: 'ALL', name: 'সকল টেকনোলজি' }
    : resolveTechnology(options.overrideDepartmentId || topDept);

  const effectiveDepartmentId = isAllDept ? 'ALL' : normDept.id;
  const effectiveDepartmentName = normDept.name;

  const effectiveInstituteName =
    options.overrideInstituteName?.trim() ||
    topInstitute.trim() ||
    DEFAULT_INSTITUTE_NAME;

  // Target exam ID fallback (per department or generic)
  const baseTargetExamId =
    options.overrideExamId ||
    `EXAM_${effectiveDepartmentId.toUpperCase()}_SEM${effectiveSemesterId}_${effectiveAcademicYear}`;

  // Build lookups for Students by roll
  // To avoid false mismatches, group students by English-normalized roll
  const studentsByRollMap = new Map<string, Student[]>();
  existingStudents.forEach((st) => {
    const cleanRoll = toEnglishDigits(String(st.roll || '')).trim();
    if (!cleanRoll) return;
    if (!studentsByRollMap.has(cleanRoll)) {
      studentsByRollMap.set(cleanRoll, []);
    }
    studentsByRollMap.get(cleanRoll)!.push(st);
  });

  // Track Duplicates inside this uploaded file
  const seenRollsInFile = new Set<string>();
  const duplicateRollsInFile = new Set<string>();

  rawList.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const rRaw = item.roll || item.rollNumber || item.studentRoll || item.roll_no || item['রোল'] || '';
    const cleanR = toEnglishDigits(String(rRaw).trim());
    if (cleanR) {
      if (seenRollsInFile.has(cleanR)) {
        duplicateRollsInFile.add(cleanR);
      } else {
        seenRollsInFile.add(cleanR);
      }
    }
  });

  // Build lookup for existing database duplicates
  // Criteria: same roll, examId (or title/semester/year), semesterId, and departmentId
  const isDuplicateInDb = (roll: string, deptId: string, rowExamId: string): boolean => {
    return existingResults.some((er) => {
      const erRoll = toEnglishDigits(String(er.roll || '')).trim();
      if (erRoll !== roll) return false;

      const sameSem = er.semesterId === effectiveSemesterId;
      const sameDept = !deptId || deptId === 'ALL' || er.departmentId === deptId;
      const sameExam =
        er.examId === rowExamId ||
        er.examTitle.toLowerCase() === effectiveExamTitle.toLowerCase() ||
        er.examId.toUpperCase().includes(`SEM${effectiveSemesterId}_${effectiveAcademicYear}`.toUpperCase());

      return sameExam && sameSem && sameDept;
    });
  };

  const processedRows: ShortResultRowValidation[] = [];
  const resultsToPublish: StudentResult[] = [];

  let matchedCount = 0;
  let unmatchedCount = 0;
  let ambiguousCount = 0;
  let duplicateInFileCount = 0;
  let duplicateInDbCount = 0;

  const fileRollOccurrenceCounter = new Map<string, number>();

  rawList.forEach((item, idx) => {
    const rowNumber = idx + 1;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!item || typeof item !== 'object') {
      errors.push(`সারি #${rowNumber}: অবজেক্ট ফরম্যাট সঠিক নয়`);
      processedRows.push({
        rowNumber,
        rawRoll: '',
        roll: '',
        gpa: 0,
        letterGrade: 'F',
        isPassed: false,
        departmentId: 'ALL',
        departmentName: 'সকল টেকনোলজি',
        isStudentMatched: false,
        studentMatchStatus: 'UNMATCHED',
        isDuplicateInFile: false,
        isDuplicateInDatabase: false,
        isValid: false,
        errors,
        warnings,
      });
      return;
    }

    // 1. Roll extraction
    const rawRoll = String(
      item.roll ||
      item.rollNumber ||
      item.studentRoll ||
      item.roll_no ||
      item['রোল'] ||
      item['রোল নম্বর'] ||
      ''
    ).trim();

    const roll = toEnglishDigits(rawRoll);
    if (!roll) {
      errors.push(`রোল নম্বর অনুপস্থিত`);
    }

    // 2. GPA extraction and validation
    const rawGpaVal =
      item.gpa !== undefined
        ? item.gpa
        : item.cgpa !== undefined
        ? item.cgpa
        : item.point !== undefined
        ? item.point
        : item.gradePoint !== undefined
        ? item.gradePoint
        : item['জিপিএ'];

    let gpaNum = 0;
    let isGpaValid = false;

    if (rawGpaVal === undefined || rawGpaVal === null || String(rawGpaVal).trim() === '') {
      errors.push(`GPA অনুপস্থিত`);
    } else {
      const gpaStr = toEnglishDigits(String(rawGpaVal).trim());
      const parsedGpa = parseFloat(gpaStr);
      if (isNaN(parsedGpa)) {
        errors.push(`GPA সংখ্যা হতে হবে (${rawGpaVal})`);
      } else if (parsedGpa < 0 || parsedGpa > 4.0) {
        errors.push(`অবৈধ GPA: ${parsedGpa} (মান ০.০০ থেকে ৪.০০ এর মধ্যে হতে হবে)`);
      } else {
        gpaNum = Number(parsedGpa.toFixed(2));
        isGpaValid = true;
      }
    }

    // 3. Status extraction
    const rawStatusVal =
      item.status !== undefined
        ? item.status
        : item.resultStatus !== undefined
        ? item.resultStatus
        : item.result !== undefined
        ? item.result
        : item.remarks !== undefined
        ? item.remarks
        : item['অবস্থা'] ||
          item['ফলাফল'];

    const parsedStatus = parseResultStatusText(rawStatusVal);

    // 4. Letter Grade extraction
    const rawGrade = String(
      item.grade ||
      item.letterGrade ||
      item['গ্রেড'] ||
      ''
    ).trim();

    const letterGrade = rawGrade || calculateShortLetterGrade(gpaNum);

    // 5. Pass / Fail determination
    let isPassed = false;
    if (parsedStatus.isPassed !== undefined) {
      isPassed = parsedStatus.isPassed;
    } else {
      isPassed = isGpaValid && gpaNum > 0 && letterGrade !== 'F';
    }

    // 6. Row-level Technology detection (Case-insensitive & multi-alias)
    const rawItemTech =
      item.technology ||
      item.tech ||
      item.department ||
      item.dept ||
      item['টেকনোলজি'] ||
      item['বিভাগ'] ||
      item['টেক'];

    // 7. Student database matching
    let matchedStudent: Student | undefined;
    let matchedStudentName = '';
    let matchedStudentId = '';
    let matchedRegistration = '';
    let studentMatchStatus: 'MATCHED' | 'UNMATCHED' | 'AMBIGUOUS' = 'UNMATCHED';

    if (roll) {
      const candidates = studentsByRollMap.get(roll) || [];

      // If multiple candidates exist across departments, prefer candidate matching row or chosen department
      let filteredCandidates = candidates;
      const expectedDeptHint = rawItemTech
        ? resolveTechnology(rawItemTech).id
        : !isAllDept
        ? normDept.id
        : undefined;

      if (candidates.length > 1 && expectedDeptHint) {
        const deptMatched = candidates.filter((c) => c.departmentId === expectedDeptHint);
        if (deptMatched.length > 0) {
          filteredCandidates = deptMatched;
        }
      }

      if (filteredCandidates.length === 1) {
        matchedStudent = filteredCandidates[0];
        matchedStudentName = String(matchedStudent.name || '').trim();
        matchedStudentId = String(matchedStudent.studentId || '').trim();
        matchedRegistration = String(matchedStudent.registration || '').trim();
        studentMatchStatus = 'MATCHED';
        matchedCount++;
      } else if (filteredCandidates.length === 0) {
        studentMatchStatus = 'UNMATCHED';
        unmatchedCount++;
        warnings.push('ডেটাবেজে এই রোলের শিক্ষার্থীর নাম পাওয়া যায়নি');
      } else {
        studentMatchStatus = 'AMBIGUOUS';
        ambiguousCount++;
        warnings.push(`একাধিক শিক্ষার্থীর (${filteredCandidates.length} জন) একই রোল নম্বর পাওয়া গেছে; নাম বাদ রাখা হয়েছে`);
      }
    }

    // 8. Determine Effective Row Technology
    let rowDept: { id: string; name: string };
    if (rawItemTech) {
      // Row explicitly has technology defined (CMT, cmt, Computer, CIVIL, ce, electrical, etc.)
      rowDept = resolveTechnology(rawItemTech);
    } else if (!isAllDept) {
      // Admin chose a specific single technology in the UI dropdown
      rowDept = normDept;
    } else if (matchedStudent?.departmentId) {
      // Admin chose "সকল টেকনোলজি", and student was found in student database
      rowDept = {
        id: matchedStudent.departmentId,
        name: matchedStudent.departmentName || resolveTechnology(matchedStudent.departmentId).name,
      };
    } else if (topDept) {
      // Top-level JSON technology specified
      rowDept = resolveTechnology(topDept);
    } else {
      // Fallback
      rowDept = { id: 'cmt', name: 'কম্পিউটার টেকনোলজি' };
    }

    const rowTargetExamId =
      options.overrideExamId ||
      `EXAM_${rowDept.id.toUpperCase()}_SEM${effectiveSemesterId}_${effectiveAcademicYear}`;

    // 9. Duplicate Checks
    let isDuplicateInFile = false;
    if (roll) {
      const count = (fileRollOccurrenceCounter.get(roll) || 0) + 1;
      fileRollOccurrenceCounter.set(roll, count);
      if (count > 1) {
        isDuplicateInFile = true;
        duplicateInFileCount++;
        errors.push(`একই ফাইলে রোলটি একাধিকবার বিদ্যমান (#${count} বার)`);
      }
    }

    const isDuplicateInDatabase = roll ? isDuplicateInDb(roll, rowDept.id, rowTargetExamId) : false;
    if (isDuplicateInDatabase) {
      duplicateInDbCount++;
      if (options.overwriteDuplicates) {
        warnings.push('ডেটাবেজে বিদ্যমান পূর্ববর্তী ফলাফল ওভাররাইট করা হবে');
      } else {
        warnings.push('ডেটাবেজে ইতিমধ্যে এই রোল ও সেমিস্টারের ফলাফল বিদ্যমান');
      }
    }

    // Overall row validity
    const isValid = errors.length === 0;

    const rowValidation: ShortResultRowValidation = {
      rowNumber,
      rawRoll,
      roll,
      gpa: gpaNum,
      letterGrade,
      rawStatusText: parsedStatus.statusText,
      isPassed,
      departmentId: rowDept.id,
      departmentName: rowDept.name,
      rawDepartment: rawItemTech ? String(rawItemTech).trim() : undefined,
      isStudentMatched: studentMatchStatus === 'MATCHED',
      matchedStudent,
      matchedStudentName: matchedStudentName || undefined,
      matchedStudentId: matchedStudentId || undefined,
      matchedRegistration: matchedRegistration || undefined,
      studentMatchStatus,
      isDuplicateInFile,
      isDuplicateInDatabase,
      isValid,
      errors,
      warnings,
    };

    processedRows.push(rowValidation);

    // If valid, build StudentResult ready for Firestore
    if (isValid && (!isDuplicateInDatabase || options.overwriteDuplicates)) {
      const docId = generateDynamicResultId(rowTargetExamId, roll);
      const studentId = matchedStudentId || `DPIB-${roll}`;
      const verificationCode = generateVerificationCode(roll, rowTargetExamId);

      const studentResult: StudentResult = {
        id: docId,
        examId: rowTargetExamId,
        examTitle: effectiveExamTitle,
        examType: 'সংক্ষিপ্ত ফলাফল',
        examDate: new Date().toISOString().split('T')[0],
        semesterId: effectiveSemesterId,
        departmentId: rowDept.id,
        departmentName: rowDept.name,
        studentName: matchedStudentName || '',
        roll,
        studentId,
        registration: matchedRegistration || undefined,
        subjects: [],
        totalObtainedMarks: 0,
        totalFullMarks: 0,
        gpa: gpaNum,
        letterGrade,
        isPassed,
        status: options.defaultStatus || 'PUBLISHED',
        meritRank: null,
        publishedAt: (options.defaultStatus || 'PUBLISHED') === 'PUBLISHED' ? Date.now() : undefined,
        verificationCode,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        resultType: 'SHORT',
        instituteName: effectiveInstituteName,
        academicYear: effectiveAcademicYear,
        resultStatusText: parsedStatus.statusText,
      };

      resultsToPublish.push(studentResult);
    }
  });

  const validRows = processedRows.filter((r) => r.isValid).length;
  const invalidRows = processedRows.length - validRows;

  let summaryMessage = `মোট ${toBanglaDigits(processedRows.length)}টি রেকর্ডের মধ্যে ${toBanglaDigits(validRows)}টি প্রস্তুত।`;
  if (matchedCount > 0) {
    summaryMessage += ` ${toBanglaDigits(matchedCount)} জন শিক্ষার্থীর নাম সফলভাবে মিলেছে।`;
  }
  if (unmatchedCount > 0) {
    summaryMessage += ` ${toBanglaDigits(unmatchedCount)} জনের নাম পাওয়া যায়নি।`;
  }
  if (invalidRows > 0) {
    summaryMessage += ` ${toBanglaDigits(invalidRows)}টি রেকর্ডে ত্রুটি রয়েছে।`;
  }

  return {
    totalRows: processedRows.length,
    validRows,
    invalidRows,
    matchedCount,
    unmatchedCount,
    ambiguousCount,
    duplicateInFileCount,
    duplicateInDatabaseCount: duplicateInDbCount,
    detectedExamTitle: effectiveExamTitle,
    detectedAcademicYear: effectiveAcademicYear,
    detectedSemesterId: effectiveSemesterId,
    detectedDepartmentId: effectiveDepartmentId,
    detectedDepartmentName: effectiveDepartmentName,
    detectedInstituteName: effectiveInstituteName,
    rows: processedRows,
    resultsToPublish,
    errors: globalErrors,
    warnings: globalWarnings,
    summaryMessage,
  };
}

/**
 * Sample JSON Generator for BTEB Short Summary Results
 */
export function generateSampleShortResultJson(): string {
  const sample = {
    examTitle: 'ডিপ্লোমা ইন ইঞ্জিনিয়ারিং ২য় পর্ব বোর্ড পরীক্ষা ২০২৪',
    examYear: '2024',
    semester: '2',
    instituteName: DEFAULT_INSTITUTE_NAME,
    results: [
      {
        roll: '612341',
        technology: 'CMT',
        gpa: 3.85,
        grade: 'A',
        status: 'PASSED',
      },
      {
        roll: '612342',
        technology: 'Civil',
        gpa: 3.5,
        grade: 'A-',
        status: 'PASSED',
      },
      {
        roll: '612343',
        technology: 'electrical',
        gpa: 4.0,
        grade: 'A+',
        status: 'উত্তীর্ণ',
      },
      {
        roll: '612344',
        technology: 'মেকানিক্যাল',
        gpa: 0.0,
        grade: 'F',
        status: 'REFERRED',
      },
    ],
  };

  return JSON.stringify(sample, null, 2);
}
