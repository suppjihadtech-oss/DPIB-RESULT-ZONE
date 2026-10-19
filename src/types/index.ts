export type Technology = 
  | 'কম্পিউটার টেকনোলজি'
  | 'সিভিল টেকনোলজি'
  | 'ইলেকট্রিক্যাল টেকনোলজি'
  | 'মেকানিক্যাল টেকনোলজি'
  | 'ইলেকট্রনিক্স টেকনোলজি';

export type Semester = 
  | '১ম পর্ব'
  | '২য় পর্ব'
  | '৩য় পর্ব'
  | '৪র্থ পর্ব'
  | '৫ম পর্ব'
  | '৬ষ্ঠ পর্ব'
  | '৭ম পর্ব'
  | '৮ম পর্ব';

export type Shift = '১ম শিফট' | '২য় শিফট';

export interface Student {
  id: string;
  nameBangla: string;
  nameEnglish: string;
  roll: string;
  registration: string;
  technology: Technology;
  semester: Semester;
  shift: Shift;
  session: string;
  fatherName: string;
  motherName: string;
  bloodGroup?: string;
  phone?: string;
  status: 'ACTIVE' | 'PASSED' | 'DROPPED';
  createdAt: string;
}

export interface SubjectResult {
  code: string;
  name: string;
  credit: number;
  marks: number;
  grade: string; // A+, A, A-, B+, B, C, D, F
  point: number; // 4.00, 3.75, etc.
}

export interface Result {
  id: string;
  examId: string;
  studentId: string;
  roll: string;
  registration: string;
  studentName: string;
  technology: Technology;
  semester: Semester;
  session: string;
  subjects: SubjectResult[];
  gpa: number;
  status: 'PASSED' | 'FAILED' | 'REFERRED';
  failedSubjects?: string[];
  publishedAt: string;
  isPublished: boolean;
}

export interface Exam {
  id: string;
  title: string;
  semester: Semester;
  session: string;
  academicYear: string;
  examDate: string;
  isPublished: boolean;
  totalExaminees?: number;
  description?: string;
  createdAt: string;
}

export interface Notice {
  id: string;
  title: string;
  category: 'একাডেমিক' | 'পরীক্ষা' | 'ভর্তি' | 'সাধারণ';
  date: string;
  content: string;
  isImportant?: boolean;
  published: boolean;
}

export interface RoutineItem {
  id: string;
  day: 'শনিবার' | 'রবিবার' | 'সোমবার' | 'মঙ্গলবার' | 'বুধবার' | 'বৃহস্পতিবার';
  time: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  roomNo: string;
  technology: Technology;
  semester: Semester;
  shift: Shift;
}

export type DocumentType = 'ADMIT_CARD' | 'TRANSCRIPT' | 'TESTIMONIAL' | 'APPRECIATION';

export interface DocumentRequest {
  id: string;
  type: DocumentType;
  studentRoll: string;
  studentName: string;
  technology: Technology;
  semester: Semester;
  purpose: string;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'ISSUED';
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  createdAt: number;
}
