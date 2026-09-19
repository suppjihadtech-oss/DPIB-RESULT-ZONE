export type SemesterId = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Semester {
  id: SemesterId;
  name: string;
  banglaName: string;
  numeric: number;
}

export interface Student {
  id: string;
  name: string;
  roll: string;
  registration?: string;
  studentId: string;
  departmentId: string;
  departmentName: string;
  semesterId: SemesterId;
  shift?: string;
  session?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: number;
  updatedAt?: number;
}

export interface ExamSubject {
  code: string;
  name: string;
  fullMarks: number;
  passMarks?: number;
}

export type ExamType = 'MODEL TEST' | 'MOCK TEST' | 'CLASS TEST' | 'INTERNAL EXAM' | 'OTHER EXAM' | string;

export interface CurriculumSubject {
  id: string;
  technology: 'CIVIL' | 'COMPUTER' | 'ELECTRICAL' | 'MECHANICAL' | 'MARINE' | 'SURVEYING' | string;
  semester: string;
  semesterId: SemesterId;
  subjectCode: string;
  subjectName: string;
  curriculumFullMarks: number; // Reference only: BTEB Syllabus Full Marks
}

export interface BookItem {
  id: string;
  technology: string;
  technologyName: string;
  semesterId: SemesterId;
  semesterName?: string;
  subjectCode: string;
  subjectName: string;
  credit?: number;
  tpc?: string;
  marketPrice?: number | null;
  author?: string;
  publisher?: string;
  edition?: string;
  bookType?: 'COMPULSORY' | 'ELECTIVE' | 'OPTIONAL' | string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: number;
  updatedAt?: number;
}

export interface Exam {
  id: string;
  title: string;
  semesterId: SemesterId;
  departmentId: string;
  departmentName: string;
  departmentIds?: string[];
  departmentNames?: string[];
  academicYear?: string;
  examType: ExamType;
  examDate: string;
  totalMarks: number;
  description?: string;
  subjects: ExamSubject[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  allowMeritList: boolean;
  publishedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface SubjectResult {
  subjectCode: string;
  subjectName: string;
  fullMarks: number;
  obtainedMarks: number;
  grade: string;
  gradePoint: number;
  isPassed: boolean;
  remarks?: string;
}

export interface StudentResult {
  id: string;
  examId: string;
  examTitle: string;
  examType: string;
  examDate: string;
  semesterId: SemesterId;
  departmentId: string;
  departmentName: string;
  studentId: string;
  studentDocId?: string;
  roll: string;
  registration?: string;
  studentName: string;
  subjects: SubjectResult[];
  totalFullMarks: number;
  totalObtainedMarks: number;
  gpa: number;
  letterGrade: string;
  isPassed: boolean;
  meritRank?: number;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED';
  publishedAt?: number;
  verificationCode: string;
  createdAt: number;
  updatedAt: number;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  publishedDate: string;
  category: NoticeCategory;
  isPinned: boolean;
  status: 'PUBLISHED' | 'DRAFT';
  createdAt: number;
  updatedAt: number;
}

export type NoticeCategory = 'EXAM' | 'RESULT' | 'GENERAL' | 'URGENT';

export interface SubjectMark {
  subjectCode: string;
  marks: number;
}

export interface GradingRule {
  id: string;
  minMarksPercentage: number;
  maxMarksPercentage: number;
  grade: string;
  gradePoint: number;
  description: string;
}

export interface ShiftConfig {
  id: string; // '1st' | '2nd' | custom
  name: string; // যেমন: '১ম শিফট', '২য় শিফট'
  code: '1st' | '2nd' | string;
  startTime: string; // যেমন: '08:00 AM'
  endTime: string; // যেমন: '01:00 PM'
  badge?: string; // যেমন: 'সকাল শিফট'
  description?: string; // যেমন: 'সকাল ০৮:০০ টা হতে দুপুর ০১:০০ টা পর্যন্ত'
}

export interface SystemSettings {
  id?: string;
  instituteName: string;
  portalTitle: string;
  tagline: string;
  logoUrl: string;
  contactEmail?: string;
  contactPhone?: string;
  noticeMarquee?: string;
  gradingRules: GradingRule[];
  departments: Department[];
  examTypes: string[];
  shifts?: ShiftConfig[];
  updatedAt?: number;
}

export type EventType =
  | 'EXAM'
  | 'MODEL_TEST'
  | 'MOCK_TEST'
  | 'FAREWELL'
  | 'FRESHERS'
  | 'SEMINAR'
  | 'CULTURAL'
  | 'SPORTS'
  | 'HOLIDAY'
  | 'OTHER';

export interface AppEvent {
  id: string;
  title: string;
  eventType: EventType;
  eventTypeName?: string;
  eventDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  location?: string;
  description?: string;
  status: 'PUBLISHED' | 'DRAFT';
  isPinned?: boolean;
  targetAudience?: string;
  createdAt: number;
  updatedAt: number;
}

export interface GpaSubject {
  id: string;
  name: string;
  code?: string;
  credit: number;
  marks?: number;
  grade: string;
  gradePoint: number;
}

export interface GpaCalculationResult {
  subjects: Array<{
    subject: GpaSubject;
    creditTimesGp: number;
  }>;
  totalCredits: number;
  totalCreditPoints: number;
  gpa: number;
  letterGrade: string;
  isPassed: boolean;
  hasReferred: boolean;
  referredSubjects: string[];
}

export interface DocumentSettings {
  instituteName: string;
  instituteAddress: string;
  instituteCode: string;
  eiin?: string;
  contactPhone: string;
  contactEmail?: string;
  logoUrl?: string;
  principalTitle: string;
  principalName?: string;
  examControllerTitle: string;
  examControllerName?: string;
  headOfDeptTitle: string;
  defaultTemplate: DocumentTemplateStyle;
}

export type DocumentTemplateStyle = 'official' | 'modern' | 'compact';

export interface ExamRoutineItem {
  id: string;
  subjectCode: string;
  subjectName: string;
  technology: string;
  semesterId?: string;
  date: string; // YYYY-MM-DD
  day: string; // যেমন: শনিবার
  startTime: string; // 12-hour: 10:00 AM
  endTime: string; // 12-hour: 01:00 PM
  roomNo?: string;
}

export interface Teacher {
  id: string;
  name: string;
  designation?: string;
  departmentId?: string;
  departmentName?: string;
  phone?: string;
  email?: string;
  isNonTech?: boolean;
  category?: 'TECH' | 'NON_TECH' | 'ALL_TECH';
  nonTechSubject?: string;
}

export interface ClassRoutineItem {
  id: string;
  day: 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday';
  dayBangla: string;
  period: number;
  subjectCode: string;
  subjectName: string;
  technology: string;
  teacherName: string;
  roomNo: string;
  startTime: string; // 12-hour format: 09:00 AM
  endTime: string; // 12-hour format: 09:45 AM
}

export interface NotificationSubscription {
  id?: string;
  token: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  userAgent?: string;
  preferredDepartment?: string;
  preferredSemester?: string;
  status: 'ACTIVE' | 'MUTED';
  createdAt: number;
  updatedAt: number;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  type?: 'RESULT' | 'NOTICE' | 'EVENT' | 'EXAM' | 'GENERAL';
  id?: string;
}

// ================= ADMISSION & APPLICANT PROFILE TYPES =================
export type AdmissionApplicationStatus =
  | 'SUBMITTED' // আবেদন করা হয়েছে
  | 'UNDER_REVIEW' // যাচাইাধীন
  | 'APPROVED' // অনুমোদিত
  | 'REJECTED' // বাতিল
  | 'ENROLLED'; // ভর্তি সম্পন্ন

export interface ApplicantUser {
  uid: string;
  phone: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  sscRoll?: string;
  sscBoard?: string;
  sscPassingYear?: string;
  fatherName?: string;
  motherName?: string;
  presentAddress?: string;
  permanentAddress?: string;
  bloodGroup?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  createdAt: number;
  updatedAt: number;
}

export interface PersonalInfo {
  fullNameBangla: string;
  fullNameEnglish: string;
  fatherName: string;
  motherName: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  photoUrl?: string;
  religion: string;
  nationality: string;
  presentAddress: string;
  permanentAddress: string;
}

export interface EducationalInfo {
  examType: 'SSC' | 'DAKHIL' | 'VOCATIONAL' | 'EQUIVALENT';
  board: string;
  rollNumber: string;
  registrationNumber: string;
  passingYear: string;
  gpa: number;
  instituteName?: string;
  group?: string; // বিজ্ঞান, মানবিক, ব্যবসায় শিক্ষা, ভোকেশনাল
}

export interface TechnologyChoice {
  firstChoiceDeptId: string;
  firstChoiceDeptName: string;
  secondChoiceDeptId?: string;
  secondChoiceDeptName?: string;
  thirdChoiceDeptId?: string;
  thirdChoiceDeptName?: string;
  preferredShift?: '1st' | '2nd' | 'both';
}

export interface ApplicationStatusHistory {
  status: AdmissionApplicationStatus;
  updatedAt: number;
  updatedBy?: string;
  note?: string;
}

export interface SecurityAuditReport {
  deviceFingerprint: string;
  userAgent: string;
  submissionDurationMs?: number;
  riskScore: number; // 0 (completely safe) to 100 (critical risk)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: string[];
  fraudFlags: {
    isDuplicateRoll: boolean;
    isDuplicateReg: boolean;
    isDuplicatePhone: boolean;
    isDuplicateEmail: boolean;
    isDuplicateNameBirthday: boolean;
    isRapidSubmission: boolean;
    isRateLimitTriggered: boolean;
    isSuspiciousDevicePattern: boolean;
  };
  matchedApplicationNumbers?: string[];
  actionTaken: 'PASSED' | 'FLAGGED_UNDER_REVIEW' | 'REJECTED_BLOCKED';
  evaluatedAt: number;
}

export interface AdmissionSecurityLog {
  id: string;
  eventType: 'APPLICATION_SUBMISSION' | 'DUPLICATE_ATTEMPT_BLOCKED' | 'RATE_LIMIT_EXCEEDED' | 'SUSPICIOUS_IDENTITY_FLAG' | 'SECURITY_CLEARED';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  deviceFingerprint: string;
  phone: string;
  roll?: string;
  applicationId?: string;
  applicationNumber?: string;
  riskScore: number;
  riskFactors: string[];
  details: string;
  timestamp: number;
}

export interface AdmissionRateLimitRecord {
  key: string; // deviceFingerprint or phone
  type: 'DEVICE' | 'PHONE';
  attempts: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  blockedUntil?: number;
  updatedAt: number;
}

export interface AdmissionApplication {
  id: string;
  applicationNumber: string; // e.g. DPIB-ADM-2026-10492
  applicantId: string; // User UID
  applicantPhone: string;
  applicantEmail?: string;
  personalInfo: PersonalInfo;
  educationalInfo: EducationalInfo;
  technologyChoice: TechnologyChoice;
  status: AdmissionApplicationStatus;
  statusHistory: ApplicationStatusHistory[];
  securityAudit?: SecurityAuditReport;
  adminInstructions?: string; // কর্তৃপক্ষের নির্দেশনা / স্পেশাল নোটিশ
  adminFeedback?: string; // রিভিউ নোট বা বাতিলের কারণ
  assignedRoll?: string; // ভর্তি সম্পন্ন হলে নির্ধারিত রোল
  assignedSession?: string; // যেমন: ২০২৬-২৭
  assignedShift?: '1st' | '2nd'; // কর্তৃপক্ষ কর্তৃক নির্ধারিত শিফট
  assignedDeptId?: string;
  assignedDeptName?: string;
  submittedAt: number;
  updatedAt: number;
}

export interface AdmissionSettings {
  contactPhone: string;
  contactEmail?: string;
  helplineTitle?: string;
  helplineHours?: string;
  emergencyPhone?: string;
  address?: string;
  // Admission Deadline & Schedule
  admissionStartDate?: string; // YYYY-MM-DDTHH:mm format
  admissionEndDate?: string;   // YYYY-MM-DDTHH:mm format
  admissionStartTimestamp?: number; // Epoch ms
  admissionEndTimestamp?: number;   // Epoch ms
  isAdmissionOpen?: boolean;        // Manual override toggle
  deadlineNotice?: string;          // Optional custom notice
  updatedAt?: number;
}


