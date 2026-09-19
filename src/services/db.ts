import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  getDocFromServer,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  Student,
  Exam,
  StudentResult,
  SubjectResult,
  Notice,
  SystemSettings,
  Department,
  GradingRule,
  SemesterId,
  AppEvent,
  CurriculumSubject,
  Teacher,
  DocumentSettings,
  DocumentTemplateStyle,
  ShiftConfig,
} from '../types';
import { MASTER_CURRICULUM_DATA, normalizeTechnologyKey } from '../data/masterCurriculum';
import { DEFAULT_GRADING_RULES, calculateOverallResult, calculateSubjectGrade } from './grading';
import { toEnglishDigits } from '../utils/bangla';
import { resolveSubjectMeta, normalizeDepartment, normalizeSemester } from './excel';

const RESERVED_DOC_KEYS = new Set([
  'id',
  'docid',
  'examid',
  'examtitle',
  'examname',
  'title',
  'examtype',
  'examdate',
  'semester',
  'semesterid',
  'department',
  'departmentid',
  'departmentname',
  'studentid',
  'studentdocid',
  'roll',
  'rollnumber',
  'studentroll',
  'registration',
  'reg',
  'registrationno',
  'name',
  'studentname',
  'subjects',
  'subjectmarks',
  'marks',
  'totalfullmarks',
  'totalobtainedmarks',
  'totalmarks',
  'obtainedmarks',
  'fullmarks',
  'maxmarks',
  'gpa',
  'grade',
  'lettergrade',
  'ispassed',
  'passed',
  'status',
  'meritrank',
  'rank',
  'verificationcode',
  'createdat',
  'updatedat',
  'publishedat',
  'session',
  'shift',
  'errors',
  'remarks',
  'isvalid',
  'rownumber',
  'calculatedresult',
]);

/**
 * Normalizes a raw Firestore result document into a full StudentResult.
 * Combines all subject marks for the student, dynamically determines full marks and obtained marks,
 * and calculates the accurate overall GPA, final grade, and pass status.
 */
export function normalizeStudentResult(res: any): StudentResult {
  if (!res || typeof res !== 'object') {
    return res;
  }

  const roll = toEnglishDigits(String(res.roll || res.rollNumber || res.studentRoll || '')).trim();
  const studentName = String(res.studentName || res.name || res['শিক্ষার্থীর নাম'] || res['নাম'] || '').trim();
  const rawDept = res.department || res.departmentName || res.departmentId || res.dept || res.technology || '';
  const deptNormalized = normalizeDepartment(rawDept);
  const departmentId = String(res.departmentId || deptNormalized.id).trim();
  const departmentName = String(res.departmentName || deptNormalized.name).trim();

  const rawStudentId = String(res.studentId || res.student_id || '').trim();
  const studentId = (!rawStudentId || isFirestoreAutoId(rawStudentId))
    ? generateDynamicStudentId(roll, departmentId)
    : rawStudentId;
  const registration = res.registration || res.reg || res.registrationNo || undefined;

  const semesterId = (normalizeSemester(res.semesterId || res.semester) || '2') as SemesterId;
  const examId = String(res.examId || res.exam_id || `DEFAULT_EXAM_${departmentId.toUpperCase()}`).trim();
  const examTitle = String(res.examTitle || res.examName || res.title || '২য় পর্ব মডেল টেস্ট ২০২৬').trim();
  const examType = String(res.examType || 'মডেল টেস্ট').trim();
  const examDate = String(res.examDate || new Date().toISOString().split('T')[0]).trim();

  // Extract all subjects from multiple potential representations
  const subjectMap = new Map<string, SubjectResult>();

  // 1. Check res.subjects array (standard format from Admin Panel publish)
  if (Array.isArray(res.subjects) && res.subjects.length > 0) {
    res.subjects.forEach((s: any) => {
      if (!s || typeof s !== 'object') return;
      const codeKey = String(s.subjectCode || s.code || s.name || s.subject || '').trim();
      if (!codeKey) return;

      const rawFull = s.fullMarks ?? s.f ?? s.maxMarks ?? s.full ?? s.totalMarks ?? s.subjectFullMarks ?? s.fm;
      const fullMarks = Number(rawFull) > 0 ? Number(rawFull) : 0;
      const obtainedMarks = Number(toEnglishDigits(String(s.obtainedMarks ?? s.marks ?? s.score ?? s.obtained ?? 0))) || 0;

      const gradeInfo = (s.grade && s.gradePoint !== undefined)
        ? { grade: String(s.grade), gradePoint: Number(s.gradePoint) || 0, isPassed: s.isPassed !== undefined ? !!s.isPassed : s.grade !== 'F' }
        : calculateSubjectGrade(obtainedMarks, fullMarks);

      subjectMap.set(codeKey, {
        subjectCode: String(s.subjectCode || s.code || codeKey).trim(),
        subjectName: String(s.subjectName || s.name || codeKey).trim(),
        fullMarks,
        obtainedMarks,
        grade: gradeInfo.grade,
        gradePoint: gradeInfo.gradePoint,
        isPassed: gradeInfo.isPassed,
      });
    });
  } else {
    // 2. Check res.subjectMarks or res.marks object map (fallback for raw/legacy imports)
    const objMap = typeof res.subjectMarks === 'object' && !Array.isArray(res.subjectMarks)
      ? res.subjectMarks
      : typeof res.marks === 'object' && !Array.isArray(res.marks)
      ? res.marks
      : null;

    if (objMap) {
      Object.entries(objMap).forEach(([k, val]) => {
        if (!k) return;
        let obtained = 0;
        let full: number | undefined;

        if (typeof val === 'object' && val !== null) {
          obtained = Number(toEnglishDigits(String((val as any).obtainedMarks ?? (val as any).marks ?? (val as any).score ?? (val as any).obtained ?? 0)));
          const rawFull = (val as any).fullMarks ?? (val as any).f ?? (val as any).maxMarks ?? (val as any).totalMarks ?? (val as any).full ?? (val as any).fm;
          if (Number(rawFull) > 0) {
            full = Number(rawFull);
          }
        } else {
          obtained = Number(toEnglishDigits(String(val ?? 0)));
        }

        if (!full) {
          const rawF = (res as any)[`f_${k}`] ?? (res as any)[`full_${k}`] ?? (res as any)?.f?.[k] ?? (res as any)?.fullMarks?.[k];
          if (Number(rawF) > 0) full = Number(rawF);
        }

        const meta = resolveSubjectMeta(k, full);
        const finalFull = full || Number(meta.fullMarks) || 0;

        const prev = subjectMap.get(meta.code);
        if (!prev || (prev.obtainedMarks === 0 && obtained > 0)) {
          const gradeInfo = calculateSubjectGrade(obtained, finalFull);
          subjectMap.set(meta.code, {
            subjectCode: meta.code,
            subjectName: meta.name,
            fullMarks: finalFull,
            obtainedMarks: obtained,
            grade: gradeInfo.grade,
            gradePoint: gradeInfo.gradePoint,
            isPassed: gradeInfo.isPassed,
          });
        }
      });
    }

    // 3. Check flat top-level subject keys on res (e.g. "BANGLA-II": { "marks": 38, "fullMarks": 30 } or "BANGLA-II": 38)
    Object.entries(res).forEach(([k, val]) => {
      if (!k || val === null || val === undefined) return;
      const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (RESERVED_DOC_KEYS.has(cleanK) || RESERVED_DOC_KEYS.has(k.toLowerCase())) return;
      if (k.startsWith('f_') || k.startsWith('full_') || k.startsWith('fm_')) return;

      let obtained: number | null = null;
      let full: number | undefined;

      if (typeof val === 'object' && !Array.isArray(val)) {
        const rawObtained = (val as any).obtainedMarks ?? (val as any).marks ?? (val as any).score ?? (val as any).obtained ?? (val as any).val;
        const rawFull = (val as any).fullMarks ?? (val as any).f ?? (val as any).maxMarks ?? (val as any).totalMarks ?? (val as any).full ?? (val as any).fm;
        if (rawObtained !== undefined && rawObtained !== null && String(rawObtained).trim() !== '') {
          obtained = Number(toEnglishDigits(String(rawObtained)));
        }
        if (Number(rawFull) > 0) {
          full = Number(rawFull);
        }
      } else if (
        typeof val === 'number' ||
        (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(toEnglishDigits(val))))
      ) {
        obtained = Number(toEnglishDigits(String(val)));
      }

      if (obtained !== null && !isNaN(obtained)) {
        if (!full) {
          const rawF = (res as any)[`f_${k}`] ?? (res as any)[`full_${k}`] ?? (res as any)?.f?.[k] ?? (res as any)?.fullMarks?.[k];
          if (Number(rawF) > 0) full = Number(rawF);
        }

        const meta = resolveSubjectMeta(k, full);
        const finalFull = full || Number(meta.fullMarks) || 0;

        const prev = subjectMap.get(meta.code);
        if (!prev || (prev.obtainedMarks === 0 && obtained > 0)) {
          const gradeInfo = calculateSubjectGrade(obtained, finalFull);
          subjectMap.set(meta.code, {
            subjectCode: meta.code,
            subjectName: meta.name,
            fullMarks: finalFull,
            obtainedMarks: obtained,
            grade: gradeInfo.grade,
            gradePoint: gradeInfo.gradePoint,
            isPassed: gradeInfo.isPassed,
          });
        }
      }
    });
  }

  const subjects = Array.from(subjectMap.values());
  const calculated = calculateOverallResult(subjects);

  // Preserve pre-calculated overall results from source data if present
  let finalTotalFull = Number(res.totalFullMarks) > 0 ? Number(res.totalFullMarks) : calculated.totalFullMarks;
  let finalTotalObtained = res.totalObtainedMarks !== undefined && !isNaN(Number(res.totalObtainedMarks)) ? Number(res.totalObtainedMarks) : calculated.totalObtainedMarks;
  let finalGpa = res.gpa !== undefined && !isNaN(Number(res.gpa)) ? Number(res.gpa) : calculated.gpa;
  let finalLetterGrade = res.letterGrade || calculated.letterGrade;
  let finalIsPassed = res.isPassed !== undefined ? !!res.isPassed : calculated.isPassed;

  if (subjects.length === 0 && Number(res.totalFullMarks) > 0) {
    finalTotalFull = Number(res.totalFullMarks);
    finalTotalObtained = Number(res.totalObtainedMarks) || 0;
    const topCalc = calculateSubjectGrade(finalTotalObtained, finalTotalFull);
    finalGpa = topCalc.gradePoint;
    finalLetterGrade = topCalc.grade;
    finalIsPassed = topCalc.isPassed;
  }

  const rawVerCode = res.verificationCode ? String(res.verificationCode).trim() : '';
  const verificationCode = (rawVerCode && !isFirestoreAutoId(rawVerCode))
    ? rawVerCode
    : generateVerificationCode(roll, examId);

  const rawId = res.id ? String(res.id).trim() : '';
  const id = (rawId && !rawId.startsWith('res-temp'))
    ? rawId
    : generateDynamicResultId(examId, roll);

  return {
    id,
    examId,
    examTitle,
    examType,
    examDate,
    semesterId,
    departmentId,
    departmentName,
    studentName,
    roll,
    studentId,
    registration,
    subjects,
    totalObtainedMarks: finalTotalObtained,
    totalFullMarks: finalTotalFull,
    gpa: finalGpa,
    letterGrade: finalLetterGrade,
    isPassed: finalIsPassed,
    status: res.status || 'PUBLISHED',
    meritRank: res.meritRank ?? null,
    publishedAt: res.publishedAt || res.createdAt || Date.now(),
    verificationCode,
    createdAt: res.createdAt || Date.now(),
    updatedAt: res.updatedAt || Date.now(),
  };
}

/**
 * Consolidates multiple raw documents belonging to the same student + examination,
 * merging all subjects into a single complete exam result.
 */
export function consolidateStudentResults(rawList: any[]): StudentResult[] {
  const normalizedList = rawList.map((item) => normalizeStudentResult(item)).filter(Boolean);

  const grouped = new Map<string, StudentResult[]>();
  for (const item of normalizedList) {
    const roll = toEnglishDigits(String(item.roll || '')).trim();
    const examId = item.examId || item.examTitle || 'DEFAULT_EXAM';
    const key = `${examId}_${roll}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  }

  const consolidated: StudentResult[] = [];

  grouped.forEach((items) => {
    if (items.length === 1) {
      consolidated.push(items[0]);
      return;
    }

    // Sort items so newest (latest updated or published or created) is primary
    items.sort(
      (a, b) =>
        (b.updatedAt || b.publishedAt || b.createdAt || 0) -
        (a.updatedAt || a.publishedAt || a.createdAt || 0)
    );
    const primary = items[0];
    const subjectMap = new Map<string, SubjectResult>();

    // 1. First add all subjects from latest primary record
    if (Array.isArray(primary.subjects)) {
      primary.subjects.forEach((sub) => {
        if (sub.subjectCode) {
          subjectMap.set(sub.subjectCode, sub);
        }
      });
    }

    // 2. Fill in any missing subjects from older records
    items.slice(1).forEach((it) => {
      if (Array.isArray(it.subjects)) {
        it.subjects.forEach((sub) => {
          if (sub.subjectCode && !subjectMap.has(sub.subjectCode)) {
            subjectMap.set(sub.subjectCode, sub);
          }
        });
      }
    });

    const allSubjects = Array.from(subjectMap.values());
    const overall = allSubjects.length > 0 ? calculateOverallResult(allSubjects) : null;

    consolidated.push({
      ...primary,
      subjects: allSubjects,
      totalObtainedMarks: overall ? overall.totalObtainedMarks : primary.totalObtainedMarks,
      totalFullMarks: overall ? overall.totalFullMarks : primary.totalFullMarks,
      gpa: overall ? overall.gpa : primary.gpa,
      letterGrade: overall ? overall.letterGrade : primary.letterGrade,
      isPassed: overall ? overall.isPassed : primary.isPassed,
    });
  });

  return consolidated;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'settings', 'general'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, checking connection...');
    }
    return false;
  }
}

export const COLLECTIONS = {
  STUDENTS: 'students',
  EXAMS: 'exams',
  RESULTS: 'results',
  NOTICES: 'notices',
  SETTINGS: 'settings',
};

export const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'cmt', name: 'কম্পিউটার টেকনোলজি (CMT)', code: 'CMT' },
  { id: 'ct', name: 'সিভিল টেকনোলজি (CT)', code: 'CT' },
  { id: 'et', name: 'ইলেকট্রিক্যাল টেকনোলজি (ET)', code: 'ET' },
  { id: 'mt', name: 'মেকানিক্যাল টেকনোলজি (MT)', code: 'MT' },
  { id: 'ent', name: 'ইলেকট্রনিক্স টেকনোলজি (ENT)', code: 'ENT' },
  { id: 'at', name: 'আর্কিটেকচার টেকনোলজি (AT)', code: 'AT' },
];

export const DEFAULT_EXAM_TYPES: string[] = [
  'MODEL TEST',
  'MOCK TEST',
  'CLASS TEST',
  'INTERNAL EXAM',
  'SEMESTER FINAL',
  'MID TERM',
  'OTHER EXAM',
];

// Helper: Deeply sanitize any object to ensure NO `undefined` values ever reach Firestore
export function sanitizeFirestorePayload<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => (typeof item === 'object' && item !== null ? sanitizeFirestorePayload(item) : item));
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue; // Omit undefined keys completely
    } else if (value === null) {
      cleaned[key] = null;
    } else if (Array.isArray(value)) {
      cleaned[key] = value
        .filter((item) => item !== undefined)
        .map((item) => (typeof item === 'object' && item !== null ? sanitizeFirestorePayload(item) : item));
    } else if (typeof value === 'object' && !(value instanceof Date)) {
      cleaned[key] = sanitizeFirestorePayload(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// Helper to check if an ID looks like an internal auto-generated Firestore ID (20 alphanumeric chars, no hyphens)
export function isFirestoreAutoId(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  return /^[A-Za-z0-9]{18,28}$/.test(trimmed) && !trimmed.includes('-') && !trimmed.includes('_');
}

// Helper to generate dynamic unique student ID
export function generateDynamicStudentId(roll: string, deptCode?: string, year?: string): string {
  const cleanRoll = toEnglishDigits(String(roll || '')).replace(/\D/g, '').trim();
  const yr = year ? String(year).slice(-2) : '26';
  const dept = deptCode ? deptCode.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) : '';
  if (dept && cleanRoll) {
    return `DPIB-${dept}-${cleanRoll}`;
  }
  return cleanRoll ? `DPIB-${cleanRoll}` : `DPIB-STU-${Date.now().toString(36).toUpperCase()}`;
}

// Helper to generate dynamic unique result document ID
export function generateDynamicResultId(examId: string, roll: string): string {
  const cleanRoll = toEnglishDigits(String(roll || '')).replace(/\D/g, '').trim() || '000000';
  const cleanExam = (examId || 'EXAM').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  const time = Date.now().toString(36).toUpperCase();
  return `res-${cleanExam}-${cleanRoll}-${rand}-${time.slice(-4)}`;
}

// Helper to generate unique verification code
export function generateVerificationCode(roll: string, examId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const cleanRoll = roll.replace(/\D/g, '').slice(-4) || '0000';
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DPIB-${cleanRoll}-${randomStr}-${timestamp.slice(-4)}`;
}

/* ==================== SYSTEM SETTINGS & DYNAMIC SHIFTS ==================== */

export const DEFAULT_SHIFTS: ShiftConfig[] = [
  {
    id: '1st',
    name: '১ম শিফট',
    code: '1st',
    startTime: '08:00 AM',
    endTime: '01:00 PM',
    badge: 'সকাল শিফট',
    description: 'সকাল ০৮:০০ টা হতে দুপুর ০১:০০ টা পর্যন্ত',
  },
  {
    id: '2nd',
    name: '২য় শিফট',
    code: '2nd',
    startTime: '01:30 PM',
    endTime: '06:30 PM',
    badge: 'বিকাল শিফট',
    description: 'দুপুর ০১:৩০ টা হতে সন্ধ্যা ০৬:৩০ টা পর্যন্ত',
  },
];

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, 'general');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as SystemSettings;
      return {
        ...data,
        instituteName: data.instituteName || 'দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট',
        portalTitle: data.portalTitle || 'DPIB RESULT ZONE',
        tagline: data.tagline || 'বীরশ্রেষ্ঠ মোস্তফা কামাল বাস স্ট্যান্ড সংলগ্ন, ভোলা সদর, ভোলা',
        logoUrl: data.logoUrl || 'https://i.postimg.cc/mgyW32Y2/Firefly-Remove-Background.png',
        gradingRules: data.gradingRules || DEFAULT_GRADING_RULES,
        departments: data.departments || DEFAULT_DEPARTMENTS,
        examTypes: data.examTypes || DEFAULT_EXAM_TYPES,
        shifts: data.shifts && data.shifts.length > 0 ? data.shifts : DEFAULT_SHIFTS,
      };
    }
  } catch (e) {
    console.warn('Using default system settings:', e);
  }

  return {
    instituteName: 'দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট',
    portalTitle: 'DPIB RESULT ZONE',
    tagline: 'বীরশ্রেষ্ঠ মোস্তফা কামাল বাস স্ট্যান্ড সংলগ্ন, ভোলা সদর, ভোলা',
    logoUrl: 'https://i.postimg.cc/mgyW32Y2/Firefly-Remove-Background.png',
    gradingRules: DEFAULT_GRADING_RULES,
    departments: DEFAULT_DEPARTMENTS,
    examTypes: DEFAULT_EXAM_TYPES,
    shifts: DEFAULT_SHIFTS,
  };
}

export async function saveSystemSettings(settings: Partial<SystemSettings>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'general');
  const payload = sanitizeFirestorePayload({
    ...settings,
    updatedAt: Date.now(),
  });
  await setDoc(docRef, payload, { merge: true });
}

export async function getShiftConfigs(): Promise<ShiftConfig[]> {
  try {
    const settings = await getSystemSettings();
    if (settings.shifts && settings.shifts.length > 0) {
      return settings.shifts;
    }
  } catch (err) {
    console.warn('Could not fetch shift configs:', err);
  }
  return DEFAULT_SHIFTS;
}

export async function saveShiftConfigs(shifts: ShiftConfig[]): Promise<void> {
  await saveSystemSettings({ shifts });
}

export function formatShiftLabel(shiftCodeOrName: string, customShifts?: ShiftConfig[]): string {
  const list = customShifts && customShifts.length > 0 ? customShifts : DEFAULT_SHIFTS;
  const clean = (shiftCodeOrName || '').trim().toLowerCase();
  if (!clean) return '';

  const found = list.find(
    (s) =>
      s.code.toLowerCase() === clean ||
      s.id.toLowerCase() === clean ||
      s.name.toLowerCase().includes(clean) ||
      clean.includes(s.name.toLowerCase()) ||
      (clean === 'morning' && s.id === '1st') ||
      (clean === 'day' && s.id === '2nd') ||
      (clean === 'সকাল শিফট' && s.id === '1st') ||
      (clean === 'বিকাল শিফট' && s.id === '2nd') ||
      (clean === 'দুপুর শিফট' && s.id === '2nd')
  );

  if (found) {
    return `${found.name} (${found.startTime} - ${found.endTime})`;
  }

  if (clean === '1st' || clean.includes('১ম')) {
    const s1 = list[0] || DEFAULT_SHIFTS[0];
    return `${s1.name} (${s1.startTime} - ${s1.endTime})`;
  }
  if (clean === '2nd' || clean.includes('২য়')) {
    const s2 = list[1] || DEFAULT_SHIFTS[1];
    return `${s2.name} (${s2.startTime} - ${s2.endTime})`;
  }

  return shiftCodeOrName;
}

/* ==================== STUDENTS ==================== */

export async function getStudents(filters?: { semesterId?: string; departmentId?: string; search?: string }): Promise<Student[]> {
  try {
    const ref = collection(db, COLLECTIONS.STUDENTS);
    const snap = await getDocs(ref);
    let list: Student[] = [];

    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Student, 'id'>) });
    });

    if (filters) {
      if (filters.semesterId && filters.semesterId !== 'ALL') {
        list = list.filter((s) => s.semesterId === filters.semesterId);
      }
      if (filters.departmentId && filters.departmentId !== 'ALL') {
        list = list.filter((s) => s.departmentId === filters.departmentId);
      }
      if (filters.search) {
        const sLower = toEnglishDigits(filters.search.toLowerCase().trim());
        const origSearch = filters.search.toLowerCase().trim();
        list = list.filter(
          (s) =>
            toEnglishDigits(s.roll || '').includes(sLower) ||
            (s.name || '').toLowerCase().includes(origSearch) ||
            (s.studentId || '').toLowerCase().includes(origSearch)
        );
      }
    }

    return list.sort((a, b) => (Number(a.roll) || 0) - (Number(b.roll) || 0));
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
}

export async function saveStudent(student: Omit<Student, 'id'>, id?: string): Promise<string> {
  const cleanStudent = sanitizeFirestorePayload({
    ...student,
    roll: toEnglishDigits(String(student.roll || '').trim()),
    studentId: String(student.studentId || '').trim(),
    name: String(student.name || '').trim(),
    registration: student.registration ? String(student.registration).trim() : '',
    updatedAt: Date.now(),
  });

  if (id) {
    const docRef = doc(db, COLLECTIONS.STUDENTS, id);
    await updateDoc(docRef, cleanStudent);
    return id;
  } else {
    cleanStudent.createdAt = Date.now();
    const docRef = await addDoc(collection(db, COLLECTIONS.STUDENTS), cleanStudent);
    return docRef.id;
  }
}

export async function deleteStudent(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.STUDENTS, id));
  } catch (err) {
    console.error('Delete student error:', err);
    throw err;
  }
}

/* ==================== EXAMS ==================== */

export async function getExams(filters?: { semesterId?: string; departmentId?: string; status?: 'PUBLISHED' | 'DRAFT' | 'ALL' }): Promise<Exam[]> {
  try {
    const ref = collection(db, COLLECTIONS.EXAMS);
    const snap = await getDocs(ref);
    let list: Exam[] = [];

    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Exam, 'id'>) });
    });

    if (filters) {
      if (filters.semesterId && filters.semesterId !== 'ALL') {
        list = list.filter((e) => e.semesterId === filters.semesterId);
      }
      if (filters.departmentId && filters.departmentId !== 'ALL') {
        list = list.filter((e) => e.departmentId === filters.departmentId);
      }
      if (filters.status && filters.status !== 'ALL') {
        list = list.filter((e) => e.status === filters.status);
      }
    }

    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTIONS.EXAMS);
    return [];
  }
}

export async function getExamById(id: string): Promise<Exam | null> {
  try {
    const docRef = doc(db, COLLECTIONS.EXAMS, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() as Omit<Exam, 'id'>) };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.EXAMS}/${id}`);
    return null;
  }
}

export async function saveExam(exam: Omit<Exam, 'id'> | Exam, id?: string): Promise<string> {
  const finalId = id || (exam as any).id;
  const data = sanitizeFirestorePayload({
    title: String(exam.title || '').trim(),
    semesterId: exam.semesterId || '1',
    departmentId: exam.departmentId || 'cmt',
    departmentName: exam.departmentName || 'কম্পিউটার টেকনোলজি (CMT)',
    examType: exam.examType || 'MODEL TEST',
    examDate: exam.examDate || new Date().toISOString().split('T')[0],
    totalMarks: Number(exam.totalMarks) || 0,
    description: exam.description ? String(exam.description).trim() : '',
    subjects: (exam.subjects || []).map((s) => ({
      code: String(s.code || '').trim(),
      name: String(s.name || '').trim(),
      fullMarks: Number(s.fullMarks) > 0 ? Number(s.fullMarks) : 0,
    })),
    status: exam.status || 'PUBLISHED',
    allowMeritList: exam.allowMeritList ?? true,
    publishedAt: exam.status === 'PUBLISHED' ? exam.publishedAt || Date.now() : null,
    updatedAt: Date.now(),
  });

  if (finalId) {
    data.createdAt = (exam as any).createdAt || Date.now();
    const docRef = doc(db, COLLECTIONS.EXAMS, finalId);
    await setDoc(docRef, data, { merge: true });
    return finalId;
  } else {
    data.createdAt = Date.now();
    const docRef = await addDoc(collection(db, COLLECTIONS.EXAMS), data);
    return docRef.id;
  }
}

export async function updateExamStatus(id: string, status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'): Promise<void> {
  const docRef = doc(db, COLLECTIONS.EXAMS, id);
  const payload = sanitizeFirestorePayload({
    status,
    publishedAt: status === 'PUBLISHED' ? Date.now() : null,
    updatedAt: Date.now(),
  });
  await updateDoc(docRef, payload);
}

export async function deleteExam(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.EXAMS, id));
  } catch (err) {
    console.error('Delete exam error:', err);
    throw err;
  }
}

/* ==================== RESULTS ==================== */

export async function searchPublicResult(params: {
  roll: string;
  semesterId?: string;
  examId?: string;
}): Promise<StudentResult | null> {
  try {
    const cleanRoll = toEnglishDigits(params.roll.trim());
    if (!cleanRoll) return null;

    const ref = collection(db, COLLECTIONS.RESULTS);
    const rawList: any[] = [];
    const seenIds = new Set<string>();

    const isDocPublished = (status: any) => {
      if (!status) return true;
      const s = String(status).trim().toUpperCase();
      return s === 'PUBLISHED' || s === 'APPROVED';
    };

    const addDocs = (snap: any) => {
      snap.forEach((docSnap: any) => {
        if (!seenIds.has(docSnap.id)) {
          seenIds.add(docSnap.id);
          const data = docSnap.data();
          if (isDocPublished(data.status)) {
            rawList.push({ id: docSnap.id, ...data });
          }
        }
      });
    };

    // 1. Exact query by 'roll'
    try {
      const qRoll = query(ref, where('roll', '==', cleanRoll));
      const snapRoll = await getDocs(qRoll);
      addDocs(snapRoll);
    } catch (e) {
      console.warn('Query by roll error:', e);
    }

    // 2. Query by 'studentRoll' (if saved via alternate generator)
    if (rawList.length === 0) {
      try {
        const qStudentRoll = query(ref, where('studentRoll', '==', cleanRoll));
        const snapStudentRoll = await getDocs(qStudentRoll);
        addDocs(snapStudentRoll);
      } catch (e) {
        console.warn('Query by studentRoll error:', e);
      }
    }

    // 3. Query by 'rollNumber'
    if (rawList.length === 0) {
      try {
        const qRollNumber = query(ref, where('rollNumber', '==', cleanRoll));
        const snapRollNumber = await getDocs(qRollNumber);
        addDocs(snapRollNumber);
      } catch (e) {
        console.warn('Query by rollNumber error:', e);
      }
    }

    // 4. Fallback: Full collection scan if query index or type mismatch occurs
    if (rawList.length === 0) {
      try {
        const allSnap = await getDocs(ref);
        allSnap.forEach((docSnap) => {
          const data = docSnap.data();
          const docRoll = toEnglishDigits(String(data.roll || data.studentRoll || data.rollNumber || '')).trim();
          if (docRoll === cleanRoll) {
            if (isDocPublished(data.status)) {
              if (!seenIds.has(docSnap.id)) {
                seenIds.add(docSnap.id);
                rawList.push({ id: docSnap.id, ...data });
              }
            }
          }
        });
      } catch (e) {
        console.warn('Collection scan fallback error:', e);
      }
    }

    if (rawList.length === 0) {
      return null;
    }

    const results = consolidateStudentResults(rawList);

    // Sort immediately by newest published or updated or created date
    results.sort(
      (a, b) =>
        (b.publishedAt || b.updatedAt || b.createdAt || 0) -
        (a.publishedAt || a.updatedAt || a.createdAt || 0)
    );

    // If examId specified, match exact ID or match against exam title
    if (params.examId && params.examId !== 'ALL') {
      let targetExamTitle = '';
      try {
        const examDoc = await getDoc(doc(db, COLLECTIONS.EXAMS, params.examId));
        if (examDoc.exists()) {
          targetExamTitle = String((examDoc.data() as any).title || '').trim().toLowerCase();
        }
      } catch (e) {
        console.warn('Exam lookup error:', e);
      }

      const match = results.find(
        (r) =>
          r.examId === params.examId ||
          (targetExamTitle && r.examTitle && r.examTitle.trim().toLowerCase() === targetExamTitle)
      );
      if (match) return match;
    }

    // If semesterId specified, match semester
    if (params.semesterId && params.semesterId !== 'ALL') {
      const match = results.find((r) => r.semesterId === params.semesterId);
      if (match) return match;
    }

    // Return the latest published result
    return results[0] || null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTIONS.RESULTS);
    return null;
  }
}

export async function verifyResultByCode(verificationCode: string): Promise<StudentResult | null> {
  try {
    const cleanCode = verificationCode.trim().toUpperCase();
    if (!cleanCode) return null;

    const ref = collection(db, COLLECTIONS.RESULTS);
    const q = query(ref, where('verificationCode', '==', cleanCode), limit(10));
    const snap = await getDocs(q);
    const rawList: any[] = [];

    snap.forEach((docSnap) => {
      rawList.push({ id: docSnap.id, ...docSnap.data() });
    });

    if (rawList.length > 0) {
      const consolidated = consolidateStudentResults(rawList);
      return consolidated[0] || null;
    }

    // Also try query by studentId (e.g. DPIB-326012)
    try {
      const qStu = query(ref, where('studentId', '==', cleanCode), limit(10));
      const snapStu = await getDocs(qStu);
      snapStu.forEach((docSnap) => {
        rawList.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (rawList.length > 0) {
        const consolidated = consolidateStudentResults(rawList);
        return consolidated[0] || null;
      }
    } catch (e) {
      // ignore
    }

    // Also try direct document ID lookup
    const docRef = doc(db, COLLECTIONS.RESULTS, cleanCode);
    const directSnap = await getDoc(docRef);
    if (directSnap.exists()) {
      return normalizeStudentResult({ id: directSnap.id, ...directSnap.data() });
    }

    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.RESULTS}/${verificationCode}`);
    return null;
  }
}

export async function getResults(filters?: {
  examId?: string;
  semesterId?: string;
  departmentId?: string;
  status?: 'PUBLISHED' | 'DRAFT' | 'REVIEW' | 'ALL';
  search?: string;
}): Promise<StudentResult[]> {
  try {
    const ref = collection(db, COLLECTIONS.RESULTS);
    const snap = await getDocs(ref);
    let rawList: any[] = [];

    snap.forEach((docSnap) => {
      rawList.push({ id: docSnap.id, ...docSnap.data() });
    });

    let list: StudentResult[] = consolidateStudentResults(rawList);

    if (filters) {
      if (filters.examId && filters.examId !== 'ALL') {
        list = list.filter((r) => r.examId === filters.examId);
      }
      if (filters.semesterId && filters.semesterId !== 'ALL') {
        list = list.filter((r) => r.semesterId === filters.semesterId);
      }
      if (filters.departmentId && filters.departmentId !== 'ALL') {
        list = list.filter((r) => r.departmentId === filters.departmentId);
      }
      if (filters.status && filters.status !== 'ALL') {
        list = list.filter((r) => r.status === filters.status);
      }
      if (filters.search) {
        const sLower = toEnglishDigits(filters.search.toLowerCase().trim());
        const origSearch = filters.search.toLowerCase().trim();
        list = list.filter(
          (r) =>
            toEnglishDigits(r.roll || '').includes(sLower) ||
            (r.studentName || '').toLowerCase().includes(origSearch) ||
            (r.verificationCode || '').toLowerCase().includes(origSearch)
        );
      }
    }

    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (error) {
    console.error('Error fetching results:', error);
    return [];
  }
}

export async function saveSingleResult(result: Omit<StudentResult, 'id'>, id?: string): Promise<string> {
  const roll = toEnglishDigits(String(result.roll || (result as any).studentRoll || (result as any).rollNumber || '').trim());
  const targetExamId = result.examId || 'DEFAULT_EXAM';
  
  // Dynamic unique ID for the result record
  let docId = id ? String(id).trim() : '';
  if (!docId || docId.startsWith('res-temp') || isFirestoreAutoId(docId)) {
    docId = generateDynamicResultId(targetExamId, roll);
  }

  let finalStudentId = String(result.studentId || '').trim();
  if (!finalStudentId || isFirestoreAutoId(finalStudentId)) {
    finalStudentId = generateDynamicStudentId(roll, (result as any).departmentId);
  }

  const rawVerCode = result.verificationCode ? String(result.verificationCode).trim() : '';
  const finalVerificationCode = (rawVerCode && !isFirestoreAutoId(rawVerCode))
    ? rawVerCode
    : generateVerificationCode(roll, targetExamId);

  const cleanResult = sanitizeFirestorePayload({
    ...result,
    id: docId,
    roll,
    studentName: String(result.studentName || '').trim(),
    studentId: finalStudentId,
    registration: result.registration ? String(result.registration).trim() : '',
    status: result.status || 'PUBLISHED',
    publishedAt: result.status === 'PUBLISHED' ? (result.publishedAt || Date.now()) : undefined,
    verificationCode: finalVerificationCode,
    createdAt: result.createdAt || Date.now(),
    updatedAt: Date.now(),
  });

  const docRef = doc(db, COLLECTIONS.RESULTS, docId);
  await setDoc(docRef, cleanResult, { merge: true });
  return docId;
}

export const saveStudentResult = saveSingleResult;

export async function batchSaveResults(
  results: (Omit<StudentResult, 'id'> | StudentResult)[],
  examId?: string,
  autoPublish = false
): Promise<{ successCount: number; errors: string[] }> {
  try {
    const batch = writeBatch(db);
    let successCount = 0;
    const errors: string[] = [];

    // Calculate merit ranks within this batch for passed students
    const sortedForRank = [...results].sort((a, b) => {
      if (b.gpa !== a.gpa) return b.gpa - a.gpa;
      return b.totalObtainedMarks - a.totalObtainedMarks;
    });

    let currentRank = 1;
    const rankedResults = sortedForRank.map((res) => {
      const isPassed = res.isPassed && res.gpa > 0;
      const rank = isPassed ? currentRank++ : null;
      const targetExamId = examId || res.examId || 'DEFAULT_EXAM';
      const roll = toEnglishDigits(String(res.roll || (res as any).studentRoll || (res as any).rollNumber || '').trim());

      let docId: string;
      if ('id' in res && res.id && !res.id.startsWith('res-temp') && !isFirestoreAutoId(res.id)) {
        docId = String(res.id).trim();
      } else {
        docId = generateDynamicResultId(targetExamId, roll);
      }

      let finalStudentId = String(res.studentId || '').trim();
      if (!finalStudentId || isFirestoreAutoId(finalStudentId)) {
        finalStudentId = generateDynamicStudentId(roll, (res as any).departmentId);
      }

      const rawVerCode = res.verificationCode ? String(res.verificationCode).trim() : '';
      const finalVerificationCode = (rawVerCode && !isFirestoreAutoId(rawVerCode))
        ? rawVerCode
        : generateVerificationCode(roll, targetExamId);

      return {
        id: docId,
        payload: sanitizeFirestorePayload({
          ...res,
          id: docId,
          roll,
          studentName: String(res.studentName || '').trim(),
          studentId: finalStudentId,
          registration: res.registration ? String(res.registration).trim() : '',
          meritRank: rank,
          status: autoPublish ? ('PUBLISHED' as const) : res.status || ('PUBLISHED' as const),
          publishedAt: autoPublish ? Date.now() : res.publishedAt || Date.now(),
          verificationCode: finalVerificationCode,
          createdAt: res.createdAt || Date.now(),
          updatedAt: Date.now(),
        }),
      };
    });

    const chunkSize = 400;
    for (let i = 0; i < rankedResults.length; i += chunkSize) {
      const chunk = rankedResults.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const docRef = doc(db, COLLECTIONS.RESULTS, item.id);
        batch.set(docRef, item.payload, { merge: true });
        successCount++;
      }
      await batch.commit();
    }
    return { successCount, errors };
  } catch (error: any) {
    console.error('Batch save error:', error);
    throw new Error(error.message || 'ব্যাচ ফলাফল সংরক্ষণে ত্রুটি হয়েছে');
  }
}

export async function updateResultStatus(id: string, status: 'PUBLISHED' | 'DRAFT' | 'REVIEW'): Promise<void> {
  const docRef = doc(db, COLLECTIONS.RESULTS, id);
  const payload = sanitizeFirestorePayload({
    status,
    publishedAt: status === 'PUBLISHED' ? Date.now() : null,
    updatedAt: Date.now(),
  });
  await updateDoc(docRef, payload);
}

export async function deleteResult(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.RESULTS, id));
  } catch (err) {
    console.error('Delete result error:', err);
    throw err;
  }
}

export async function deleteAllResults(examId?: string): Promise<number> {
  try {
    const ref = collection(db, COLLECTIONS.RESULTS);
    let q = query(ref);
    if (examId && examId !== 'ALL') {
      q = query(ref, where('examId', '==', examId));
    }
    const snap = await getDocs(q);
    if (snap.empty) return 0;

    let deletedCount = 0;
    const docs = snap.docs;
    const chunkSize = 400;

    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((docSnap) => {
        batch.delete(docSnap.ref);
        deletedCount++;
      });
      await batch.commit();
    }

    return deletedCount;
  } catch (err) {
    console.error('Delete all results error:', err);
    throw err;
  }
}

export async function getMeritList(examId?: string): Promise<StudentResult[]> {
  try {
    const ref = collection(db, COLLECTIONS.RESULTS);
    let q = query(ref, where('status', '==', 'PUBLISHED'));
    if (examId && examId !== 'ALL') {
      q = query(ref, where('examId', '==', examId), where('status', '==', 'PUBLISHED'));
    }
    const snap = await getDocs(q);
    let rawList: any[] = [];

    snap.forEach((docSnap) => {
      rawList.push({ id: docSnap.id, ...docSnap.data() });
    });

    const list = consolidateStudentResults(rawList);

    // Sort by GPA desc, then total obtained marks desc
    return list
      .filter((r) => r.isPassed && r.gpa > 0)
      .sort((a, b) => {
        if (b.gpa !== a.gpa) return b.gpa - a.gpa;
        return b.totalObtainedMarks - a.totalObtainedMarks;
      });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTIONS.RESULTS);
    return [];
  }
}

/* ==================== NOTICES ==================== */

export async function getNotices(filters?: { status?: 'PUBLISHED' | 'DRAFT' | 'ALL' }): Promise<Notice[]> {
  try {
    const ref = collection(db, COLLECTIONS.NOTICES);
    const snap = await getDocs(ref);
    let list: Notice[] = [];

    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Notice, 'id'>) });
    });

    if (filters && filters.status && filters.status !== 'ALL') {
      list = list.filter((n) => n.status === filters.status);
    }

    return list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTIONS.NOTICES);
    return [];
  }
}

export async function saveNotice(notice: Omit<Notice, 'id'>, id?: string): Promise<string> {
  const data = sanitizeFirestorePayload({
    title: String(notice.title || '').trim(),
    category: notice.category || 'EXAM',
    content: String(notice.content || '').trim(),
    isPinned: Boolean(notice.isPinned),
    status: notice.status || 'PUBLISHED',
    publishedDate: notice.publishedDate || new Date().toISOString(),
    updatedAt: Date.now(),
  });

  if (id) {
    const docRef = doc(db, COLLECTIONS.NOTICES, id);
    await updateDoc(docRef, data);
    return id;
  } else {
    data.createdAt = Date.now();
    const docRef = await addDoc(collection(db, COLLECTIONS.NOTICES), data);
    return docRef.id;
  }
}

export async function deleteNotice(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.NOTICES, id));
  } catch (err) {
    console.error('Delete notice error:', err);
    throw err;
  }
}

export async function updateNoticeStatus(id: string, status: 'PUBLISHED' | 'DRAFT'): Promise<void> {
  const docRef = doc(db, COLLECTIONS.NOTICES, id);
  const payload = sanitizeFirestorePayload({
    status,
    updatedAt: Date.now(),
  });
  await updateDoc(docRef, payload);
}

/* ==================== DASHBOARD STATS ==================== */

export interface DashboardStats {
  totalStudents: number;
  totalExams: number;
  totalResults: number;
  publishedResults: number;
  draftResults: number;
  totalNotices: number;
  totalAdmissions?: number;
  pendingAdmissions?: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const [students, exams, results, notices] = await Promise.all([
      getStudents(),
      getExams(),
      getResults(),
      getNotices(),
    ]);

    let totalAdmissions = 0;
    let pendingAdmissions = 0;
    try {
      const admSnap = await getDocs(collection(db, 'admission_applications'));
      totalAdmissions = admSnap.size;
      admSnap.forEach((d) => {
        const st = d.data()?.status;
        if (st === 'PENDING' || st === 'UNDER_REVIEW') pendingAdmissions++;
      });
    } catch {
      // ignore if collection empty or permission restricted
    }

    let publishedResults = 0;
    let draftResults = 0;

    results.forEach((r) => {
      if (r.status === 'PUBLISHED') publishedResults++;
      else draftResults++;
    });

    return {
      totalStudents: students.length,
      totalExams: exams.length,
      totalResults: results.length,
      publishedResults,
      draftResults,
      totalNotices: notices.length,
      totalAdmissions,
      pendingAdmissions,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalStudents: 0,
      totalExams: 0,
      totalResults: 0,
      publishedResults: 0,
      draftResults: 0,
      totalNotices: 0,
      totalAdmissions: 0,
      pendingAdmissions: 0,
    };
  }
}

/* ==================== SEED INITIAL DATA ==================== */

export async function seedInitialDemoData(): Promise<number> {
  const sampleStudents = [
    {
      name: 'মোঃ আরিয়ান আহমেদ',
      roll: '601234',
      studentId: 'DPIB-2024-001',
      registration: '1502345678',
      departmentId: 'cmt',
      departmentName: 'কম্পিউটার টেকনোলজি (CMT)',
      semesterId: '1' as SemesterId,
      shift: '১ম শিফট',
      session: '২০২৩-২৪',
      status: 'ACTIVE' as const,
    },
    {
      name: 'সাদিয়া সুলতানা',
      roll: '601235',
      studentId: 'DPIB-2024-002',
      registration: '1502345679',
      departmentId: 'cmt',
      departmentName: 'কম্পিউটার টেকনোলজি (CMT)',
      semesterId: '1' as SemesterId,
      shift: '১ম শিফট',
      session: '২০২৩-২৪',
      status: 'ACTIVE' as const,
    },
  ];

  for (const st of sampleStudents) {
    await saveStudent(st);
  }

  // Create Sample Exam
  const exam1Id = await saveExam({
    title: '১ম সেমিস্টার মডেল টেস্ট ২০২৪',
    semesterId: '1',
    departmentId: 'cmt',
    departmentName: 'কম্পিউটার টেকনোলজি (CMT)',
    examType: 'MODEL TEST',
    examDate: new Date().toISOString().split('T')[0],
    totalMarks: 300,
    description: 'ডিপ্লোমা ইন ইঞ্জিনিয়ারিং ১ম সেমিস্টার শিক্ষার্থীদের মডেল টেস্ট পরীক্ষা।',
    subjects: [
      { code: '66611', name: 'কম্পিউটার অ্যাপ্লিকেশন', fullMarks: 100 },
      { code: '66612', name: 'প্রোগ্রামিং এসেনশিয়ালস', fullMarks: 100 },
      { code: '65911', name: 'ম্যাথমেটিক্স-১', fullMarks: 100 },
    ],
    status: 'PUBLISHED',
    allowMeritList: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // Create Sample Results
  const result1 = {
    roll: '601234',
    studentName: 'মোঃ আরিয়ান আহমেদ',
    studentId: 'DPIB-2024-001',
    registration: '1502345678',
    examId: exam1Id,
    examTitle: '১ম সেমিস্টার মডেল টেস্ট ২০২৪',
    examType: 'MODEL TEST',
    examDate: new Date().toISOString().split('T')[0],
    departmentId: 'cmt',
    departmentName: 'কম্পিউটার টেকনোলজি (CMT)',
    semesterId: '1' as SemesterId,
    shift: '১ম শিফট',
    session: '২০২৩-২৪',
    subjects: [
      { subjectCode: '66611', subjectName: 'কম্পিউটার অ্যাপ্লিকেশন', fullMarks: 100, obtainedMarks: 85, grade: 'A+', gradePoint: 4.0, isPassed: true },
      { subjectCode: '66612', subjectName: 'প্রোগ্রামিং এসেনশিয়ালস', fullMarks: 100, obtainedMarks: 82, grade: 'A+', gradePoint: 4.0, isPassed: true },
      { subjectCode: '65911', subjectName: 'ম্যাথমেটিক্স-১', fullMarks: 100, obtainedMarks: 78, grade: 'A', gradePoint: 3.75, isPassed: true },
    ],
    totalFullMarks: 300,
    totalObtainedMarks: 245,
    gpa: 3.92,
    letterGrade: 'A+',
    isPassed: true,
    meritRank: 1,
    status: 'PUBLISHED' as const,
    verificationCode: generateVerificationCode('601234', exam1Id),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await saveSingleResult(result1);
  return 1;
}

// ==========================================
// EVENTS & PROGRAM MANAGEMENT (FIRESTORE)
// ==========================================

const EVENTS_COLLECTION = 'events';

/**
 * Get all events from Firestore (Admin)
 */
export async function getAllEvents(): Promise<AppEvent[]> {
  try {
    const colRef = collection(db, EVENTS_COLLECTION);
    const q = query(colRef, orderBy('eventDate', 'asc'));
    const snap = await getDocs(q);
    const list: AppEvent[] = [];
    snap.forEach((d) => {
      list.push({ ...(d.data() as AppEvent), id: d.id });
    });
    return list;
  } catch (error) {
    console.error('Error fetching all events:', error);
    return [];
  }
}

/**
 * Get only published events (Public User Panel & Calendar)
 */
export async function getPublishedEvents(): Promise<AppEvent[]> {
  try {
    const colRef = collection(db, EVENTS_COLLECTION);
    const q = query(colRef, where('status', '==', 'PUBLISHED'), orderBy('eventDate', 'asc'));
    const snap = await getDocs(q);
    const list: AppEvent[] = [];
    snap.forEach((d) => {
      list.push({ ...(d.data() as AppEvent), id: d.id });
    });
    return list;
  } catch (error) {
    // Fallback if composite index not ready yet: fetch all and filter in memory
    try {
      const colRef = collection(db, EVENTS_COLLECTION);
      const snap = await getDocs(colRef);
      const list: AppEvent[] = [];
      snap.forEach((d) => {
        const item = { ...(d.data() as AppEvent), id: d.id };
        if (item.status === 'PUBLISHED') {
          list.push(item);
        }
      });
      return list.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    } catch (err) {
      console.error('Error in published events fallback:', err);
      return [];
    }
  }
}

/**
 * Realtime listener for published events (Public Panel & Countdown)
 */
export function subscribeToPublishedEvents(
  callback: (events: AppEvent[]) => void,
  onError?: (error: any) => void
): Unsubscribe {
  const colRef = collection(db, EVENTS_COLLECTION);
  
  // Realtime snapshot listener on the events collection
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: AppEvent[] = [];
      snapshot.forEach((d) => {
        const item = { ...(d.data() as AppEvent), id: d.id };
        if (item.status === 'PUBLISHED' || !item.status) {
          list.push(item);
        }
      });
      list.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
      callback(list);
    },
    (error) => {
      // Gracefully handle transient offline/unavailable network states without spamming console
      if (error && (error.code === 'unavailable' || error.message?.includes('offline'))) {
        console.warn('Realtime events listener waiting for online connection...');
      } else {
        console.error('Realtime published events listener error:', error);
      }
      if (onError) onError(error);
    }
  );
}

/**
 * Realtime listener for all events (Admin Panel)
 */
export function subscribeToAllEvents(
  callback: (events: AppEvent[]) => void,
  onError?: (error: any) => void
): Unsubscribe {
  const colRef = collection(db, EVENTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: AppEvent[] = [];
      snapshot.forEach((d) => {
        list.push({ ...(d.data() as AppEvent), id: d.id });
      });
      list.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
      callback(list);
    },
    (error) => {
      if (error && (error.code === 'unavailable' || error.message?.includes('offline'))) {
        console.warn('Realtime all events listener waiting for online connection...');
      } else {
        console.error('Realtime all events listener error:', error);
      }
      if (onError) onError(error);
    }
  );
}

/**
 * Save or update an event
 */
export async function saveEvent(event: Partial<AppEvent>): Promise<string> {
  const colRef = collection(db, EVENTS_COLLECTION);
  const now = Date.now();

  if (event.id) {
    const docRef = doc(db, EVENTS_COLLECTION, event.id);
    await setDoc(
      docRef,
      {
        ...event,
        updatedAt: now,
      },
      { merge: true }
    );
    return event.id;
  } else {
    const docRef = doc(colRef);
    const newEvent: AppEvent = {
      id: docRef.id,
      title: event.title || 'শিরোনামহীন অনুষ্ঠান',
      eventType: event.eventType || 'OTHER',
      eventTypeName: event.eventTypeName || 'অন্যান্য',
      eventDate: event.eventDate || new Date().toISOString().split('T')[0],
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      location: event.location || '',
      description: event.description || '',
      status: event.status || 'PUBLISHED',
      isPinned: Boolean(event.isPinned),
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef, newEvent);
    return docRef.id;
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string): Promise<boolean> {
  try {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    return false;
  }
}

/**
 * Toggle Event Status
 */
export async function toggleEventStatus(eventId: string, currentStatus: 'PUBLISHED' | 'DRAFT'): Promise<boolean> {
  try {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    const nextStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    await setDoc(docRef, { status: nextStatus, updatedAt: Date.now() }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error toggling event status:', error);
    return false;
  }
}

// ==========================================
// CURRICULUM DATABASE SERVICES
// ==========================================
export const CURRICULUM_COLLECTION = 'curriculum';

/**
 * Seeds the centralized master curriculum (313 subjects across 6 technologies) into Firestore.
 */
export async function seedCurriculumDatabase(): Promise<number> {
  try {
    const batchSize = 450;
    let count = 0;
    for (let i = 0; i < MASTER_CURRICULUM_DATA.length; i += batchSize) {
      const chunk = MASTER_CURRICULUM_DATA.slice(i, i + batchSize);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const docRef = doc(db, CURRICULUM_COLLECTION, item.id);
        batch.set(docRef, item, { merge: true });
        count++;
      }
      await batch.commit();
    }
    return count;
  } catch (error) {
    console.error('Error seeding curriculum database:', error);
    throw error;
  }
}

/**
 * Fetch curriculum subjects from Firestore with optional filtering.
 * Falls back to MASTER_CURRICULUM_DATA to guarantee instant availability and offline resilience.
 */
export async function getCurriculumSubjects(
  technology?: string,
  semesterId?: string
): Promise<CurriculumSubject[]> {
  try {
    let list: CurriculumSubject[] = [];
    const colRef = collection(db, CURRICULUM_COLLECTION);
    const snapshot = await getDocs(colRef);

    if (!snapshot.empty) {
      list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as CurriculumSubject[];
    } else {
      // If collection is empty, use Master dataset
      list = [...MASTER_CURRICULUM_DATA];
    }

    if (technology) {
      const canonicalTech = normalizeTechnologyKey(technology);
      list = list.filter((s) => normalizeTechnologyKey(s.technology) === canonicalTech);
    }

    if (semesterId) {
      const cleanSem = String(semesterId).trim();
      list = list.filter((s) => String(s.semesterId).trim() === cleanSem || s.semester.startsWith(cleanSem));
    }

    return list;
  } catch (error) {
    console.warn('Using local master curriculum fallback:', error);
    let list = [...MASTER_CURRICULUM_DATA];
    if (technology) {
      const canonicalTech = normalizeTechnologyKey(technology);
      list = list.filter((s) => normalizeTechnologyKey(s.technology) === canonicalTech);
    }
    if (semesterId) {
      const cleanSem = String(semesterId).trim();
      list = list.filter((s) => String(s.semesterId).trim() === cleanSem || s.semester.startsWith(cleanSem));
    }
    return list;
  }
}

/**
 * Fetches curriculum subjects matching one or more technologies and a specific semester.
 * De-duplicates subjects that share the same subject code.
 */
export async function getCurriculumByTechAndSem(
  technologies: string[],
  semesterId: string
): Promise<CurriculumSubject[]> {
  if (!technologies || technologies.length === 0 || !semesterId) return [];

  const canonicalTechs = new Set(technologies.map(t => normalizeTechnologyKey(t)));
  const allSubjects = await getCurriculumSubjects();

  const filtered = allSubjects.filter((sub) => {
    const techMatch = canonicalTechs.has(normalizeTechnologyKey(sub.technology));
    const semMatch = String(sub.semesterId).trim() === String(semesterId).trim() ||
      sub.semester.startsWith(String(semesterId).trim());
    return techMatch && semMatch;
  });

  // Deduplicate by subjectCode while preserving metadata
  const seenCodes = new Set<string>();
  const uniqueSubjects: CurriculumSubject[] = [];

  for (const s of filtered) {
    const key = `${s.subjectCode}`;
    if (!seenCodes.has(key)) {
      seenCodes.add(key);
      uniqueSubjects.push(s);
    }
  }

  return uniqueSubjects;
}

/**
 * Fetches all registered teachers from Firestore collection 'teachers'.
 */
export async function getTeachers(departmentId?: string): Promise<Teacher[]> {
  try {
    const colRef = collection(db, 'teachers');
    const snapshot = await getDocs(colRef);
    
    if (!snapshot.empty) {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Teacher[];
      if (departmentId) {
        return list.filter((t) => t.departmentId === departmentId);
      }
      return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return [];
  } catch (err) {
    console.warn('Failed to get teachers from Firestore:', err);
    return [];
  }
}

/**
 * Saves or updates a teacher in Firestore.
 */
export async function saveTeacher(teacher: Omit<Teacher, 'id'>, id?: string): Promise<string> {
  const colRef = collection(db, 'teachers');
  const payload = sanitizeFirestorePayload({
    name: String(teacher.name || '').trim(),
    designation: String(teacher.designation || 'ইন্সট্রাক্টর').trim(),
    departmentId: String(teacher.departmentId || '').trim(),
    departmentName: String(teacher.departmentName || '').trim(),
    phone: teacher.phone ? String(teacher.phone).trim() : '',
    email: teacher.email ? String(teacher.email).trim() : '',
    category: teacher.category ? String(teacher.category).trim() : 'TECH',
    isNonTech: Boolean(teacher.isNonTech || teacher.departmentId === 'NON_TECH' || teacher.category === 'NON_TECH'),
    nonTechSubject: teacher.nonTechSubject ? String(teacher.nonTechSubject).trim() : '',
    updatedAt: Date.now(),
  });

  if (id) {
    const docRef = doc(db, 'teachers', id);
    await setDoc(docRef, payload, { merge: true });
    return id;
  } else {
    payload.createdAt = Date.now();
    const docRef = await addDoc(colRef, payload);
    return docRef.id;
  }
}

/**
 * Deletes a teacher from Firestore.
 */
export async function deleteTeacher(id: string): Promise<void> {
  const docRef = doc(db, 'teachers', id);
  await deleteDoc(docRef);
}

// ==========================================
// DOCUMENT SETTINGS & TEMPLATES (FIRESTORE)
// ==========================================

export const DEFAULT_DOCUMENT_SETTINGS: DocumentSettings = {
  instituteName: 'দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট, ভোলা',
  instituteAddress: 'বীরশ্রেষ্ঠ মোস্তফা কামাল বাস স্ট্যান্ড সংলগ্ন, ভোলা সদর, ভোলা',
  instituteCode: '৪০০৫২',
  eiin: '১৩৭০৬১',
  contactPhone: '০১৭১৫-০০৬৪৩২',
  contactEmail: 'dpib.bhola@gmail.com',
  logoUrl: 'https://i.postimg.cc/mgyW32Y2/Firefly-Remove-Background.png',
  principalTitle: 'অধ্যক্ষ',
  principalName: 'নিলুফার ইয়াসমিন (ভারপ্রাপ্ত)',
  examControllerTitle: 'পরীক্ষা নিয়ন্ত্রক',
  examControllerName: 'পরীক্ষা নিয়ন্ত্রণ কমিটি',
  headOfDeptTitle: 'বিভাগীয় প্রধান',
  defaultTemplate: 'official',
};

/**
 * Fetch official document header & contact settings from Firestore.
 */
export async function getDocumentSettings(): Promise<DocumentSettings> {
  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, 'documents');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Partial<DocumentSettings>;
      return {
        ...DEFAULT_DOCUMENT_SETTINGS,
        ...data,
      };
    }
  } catch (error) {
    console.warn('Could not read document settings from Firestore, using default:', error);
  }
  return DEFAULT_DOCUMENT_SETTINGS;
}

/**
 * Save official document header & contact settings to Firestore.
 */
export async function saveDocumentSettings(settings: Partial<DocumentSettings>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'documents');
  const payload = sanitizeFirestorePayload({
    ...settings,
    updatedAt: Date.now(),
  });
  await setDoc(docRef, payload, { merge: true });
}

/**
 * Fetch default document template preference from Firestore.
 */
export async function getDocumentTemplatePreference(): Promise<DocumentTemplateStyle> {
  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, 'templates');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.defaultTemplate) {
        return data.defaultTemplate as DocumentTemplateStyle;
      }
    }
  } catch (error) {
    console.warn('Could not read template settings from Firestore:', error);
  }
  return 'official';
}

/**
 * Save default document template preference to Firestore.
 */
export async function saveDocumentTemplatePreference(template: DocumentTemplateStyle): Promise<void> {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'templates');
  const payload = sanitizeFirestorePayload({
    defaultTemplate: template,
    updatedAt: Date.now(),
  });
  await setDoc(docRef, payload, { merge: true });
}

// ==========================================
// ACADEMIC ROUTINES & QUESTION PAPERS (FIRESTORE)
// ==========================================

export const ROUTINE_COLLECTIONS = {
  CLASS_ROUTINES: 'class_routines',
  EXAM_ROUTINES: 'exam_routines',
  QUESTION_PAPERS: 'question_papers',
};

export async function saveClassRoutine(routine: Record<string, any>, id?: string): Promise<string> {
  const colRef = collection(db, ROUTINE_COLLECTIONS.CLASS_ROUTINES);
  const payload = sanitizeFirestorePayload({
    ...routine,
    updatedAt: Date.now(),
  });

  if (id || routine.id) {
    const docId = id || routine.id;
    const docRef = doc(db, ROUTINE_COLLECTIONS.CLASS_ROUTINES, docId);
    await setDoc(docRef, payload, { merge: true });
    return docId;
  } else {
    payload.createdAt = Date.now();
    const docRef = await addDoc(colRef, payload);
    return docRef.id;
  }
}

export async function getClassRoutines(filters?: { technology?: string; semesterId?: string }): Promise<any[]> {
  try {
    const colRef = collection(db, ROUTINE_COLLECTIONS.CLASS_ROUTINES);
    const snap = await getDocs(colRef);
    let list: any[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    if (filters?.technology && filters.technology !== 'ALL') {
      list = list.filter((r) => r.technology === filters.technology);
    }
    if (filters?.semesterId && filters.semesterId !== 'ALL') {
      list = list.filter((r) => r.semesterId === filters.semesterId);
    }
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (error) {
    console.error('Error fetching class routines:', error);
    return [];
  }
}

export async function saveExamRoutine(routine: Record<string, any>, id?: string): Promise<string> {
  const colRef = collection(db, ROUTINE_COLLECTIONS.EXAM_ROUTINES);
  const payload = sanitizeFirestorePayload({
    ...routine,
    updatedAt: Date.now(),
  });

  if (id || routine.id) {
    const docId = id || routine.id;
    const docRef = doc(db, ROUTINE_COLLECTIONS.EXAM_ROUTINES, docId);
    await setDoc(docRef, payload, { merge: true });
    return docId;
  } else {
    payload.createdAt = Date.now();
    const docRef = await addDoc(colRef, payload);
    return docRef.id;
  }
}

export async function getExamRoutines(filters?: { examId?: string }): Promise<any[]> {
  try {
    const colRef = collection(db, ROUTINE_COLLECTIONS.EXAM_ROUTINES);
    const snap = await getDocs(colRef);
    let list: any[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    if (filters?.examId && filters.examId !== 'ALL') {
      list = list.filter((r) => r.examId === filters.examId);
    }
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (error) {
    console.error('Error fetching exam routines:', error);
    return [];
  }
}

export async function saveQuestionPaper(paper: Record<string, any>, id?: string): Promise<string> {
  const colRef = collection(db, ROUTINE_COLLECTIONS.QUESTION_PAPERS);
  const payload = sanitizeFirestorePayload({
    ...paper,
    updatedAt: Date.now(),
  });

  if (id || paper.id) {
    const docId = id || paper.id;
    const docRef = doc(db, ROUTINE_COLLECTIONS.QUESTION_PAPERS, docId);
    await setDoc(docRef, payload, { merge: true });
    return docId;
  } else {
    payload.createdAt = Date.now();
    const docRef = await addDoc(colRef, payload);
    return docRef.id;
  }
}

export async function getQuestionPapers(filters?: { subjectCode?: string; semester?: string }): Promise<any[]> {
  try {
    const colRef = collection(db, ROUTINE_COLLECTIONS.QUESTION_PAPERS);
    const snap = await getDocs(colRef);
    let list: any[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    if (filters?.subjectCode) {
      list = list.filter((q) => q.subjectCode === filters.subjectCode);
    }
    if (filters?.semester) {
      list = list.filter((q) => q.semester === filters.semester);
    }
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (error) {
    console.error('Error fetching question papers:', error);
    return [];
  }
}



