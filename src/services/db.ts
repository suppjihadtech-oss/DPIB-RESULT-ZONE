import { Student, Exam, Result, Notice, RoutineItem, DocumentRequest, Technology, Semester } from '../types';

// Pre-seeded initial data for South Bengal Polytechnic Institute (DPIB)
const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-1',
    nameBangla: 'মোঃ তানভীর হাসান',
    nameEnglish: 'Md. Tanvir Hasan',
    roll: '612450',
    registration: '1502123456',
    technology: 'কম্পিউটার টেকনোলজি',
    semester: '৪র্থ পর্ব',
    shift: '১ম শিফট',
    session: '2023-2024',
    fatherName: 'মোঃ রফিকুল ইসলাম',
    motherName: 'তাহমিনা বেগম',
    bloodGroup: 'A+',
    phone: '01712345678',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  },
  {
    id: 'std-2',
    nameBangla: 'মোসাঃ ফারহানা ইসলাম',
    nameEnglish: 'Most. Farhana Islam',
    roll: '612451',
    registration: '1502123457',
    technology: 'কম্পিউটার টেকনোলজি',
    semester: '৪র্থ পর্ব',
    shift: '১ম শিফট',
    session: '2023-2024',
    fatherName: 'আব্দুল করিম',
    motherName: 'নাসরিন আক্তার',
    bloodGroup: 'B+',
    phone: '01812345679',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  },
  {
    id: 'std-3',
    nameBangla: 'আরিফুল ইসলাম রাব্বি',
    nameEnglish: 'Ariful Islam Rabbi',
    roll: '612452',
    registration: '1502123458',
    technology: 'সিভিল টেকনোলজি',
    semester: '৪র্থ পর্ব',
    shift: '২য় শিফট',
    session: '2023-2024',
    fatherName: 'মোশাররফ হোসেন',
    motherName: 'সালমা খাতুন',
    bloodGroup: 'O+',
    phone: '01912345680',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  },
  {
    id: 'std-4',
    nameBangla: 'সাকিব মাহমুদ',
    nameEnglish: 'Sakib Mahmud',
    roll: '612453',
    registration: '1502123459',
    technology: 'ইলেকট্রিক্যাল টেকনোলজি',
    semester: '৬ষ্ঠ পর্ব',
    shift: '১ম শিফট',
    session: '2022-2023',
    fatherName: 'নুরুল আমিন',
    motherName: 'রোকেয়া বেগম',
    bloodGroup: 'AB+',
    phone: '01612345681',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  }
];

const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam-1',
    title: 'ডিপ্লোমা ইন ইঞ্জিনিয়ারিং ৪র্থ পর্ব সমাপনী পরীক্ষা ২০২৩-২৪',
    semester: '৪র্থ পর্ব',
    session: '2023-2024',
    academicYear: '২০২৪',
    examDate: '2024-11-20',
    isPublished: true,
    totalExaminees: 3,
    description: 'BTEB বোর্ডের নিয়মাবলি অনুযায়ী প্রকাশিত ফলাফল',
    createdAt: new Date().toISOString()
  },
  {
    id: 'exam-2',
    title: 'ডিপ্লোমা ইন ইঞ্জিনিয়ারিং ৬ষ্ঠ পর্ব সমাপনী পরীক্ষা ২০২২-২৩',
    semester: '৬ষ্ঠ পর্ব',
    session: '2022-2023',
    academicYear: '২০২৪',
    examDate: '2024-10-15',
    isPublished: true,
    totalExaminees: 1,
    description: '৬ষ্ঠ পর্ব নিয়মিত ফলাফল',
    createdAt: new Date().toISOString()
  }
];

const INITIAL_RESULTS: Result[] = [
  {
    id: 'res-1',
    examId: 'exam-1',
    studentId: 'std-1',
    roll: '612450',
    registration: '1502123456',
    studentName: 'মোঃ তানভীর হাসান',
    technology: 'কম্পিউটার টেকনোলজি',
    semester: '৪র্থ পর্ব',
    session: '2023-2024',
    subjects: [
      { code: '66641', name: 'অবজেক্ট ওরিয়েন্টেড প্রোগ্রামিং', credit: 3, marks: 84, grade: 'A+', point: 4.0 },
      { code: '66642', name: 'ডাটা স্ট্রাকচার ও অ্যালগরিদম', credit: 4, marks: 78, grade: 'A', point: 3.75 },
      { code: '66643', name: 'ওয়েব ডেভেলপমেন্ট ফান্ডামেন্টালস', credit: 3, marks: 88, grade: 'A+', point: 4.0 },
      { code: '66644', name: 'ডাটাবেস ম্যানেজমেন্ট সিস্টেম', credit: 3, marks: 76, grade: 'A', point: 3.75 }
    ],
    gpa: 3.87,
    status: 'PASSED',
    publishedAt: '2024-11-25T10:00:00.000Z',
    isPublished: true
  },
  {
    id: 'res-2',
    examId: 'exam-1',
    studentId: 'std-2',
    roll: '612451',
    registration: '1502123457',
    studentName: 'মোসাঃ ফারহানা ইসলাম',
    technology: 'কম্পিউটার টেকনোলজি',
    semester: '৪র্থ পর্ব',
    session: '2023-2024',
    subjects: [
      { code: '66641', name: 'অবজেক্ট ওরিয়েন্টেড প্রোগ্রামিং', credit: 3, marks: 91, grade: 'A+', point: 4.0 },
      { code: '66642', name: 'ডাটা স্ট্রাকচার ও অ্যালগরিদম', credit: 4, marks: 82, grade: 'A+', point: 4.0 },
      { code: '66643', name: 'ওয়েব ডেভেলপমেন্ট ফান্ডামেন্টালস', credit: 3, marks: 85, grade: 'A+', point: 4.0 },
      { code: '66644', name: 'ডাটাবেস ম্যানেজমেন্ট সিস্টেম', credit: 3, marks: 79, grade: 'A', point: 3.75 }
    ],
    gpa: 3.94,
    status: 'PASSED',
    publishedAt: '2024-11-25T10:00:00.000Z',
    isPublished: true
  },
  {
    id: 'res-3',
    examId: 'exam-1',
    studentId: 'std-3',
    roll: '612452',
    registration: '1502123458',
    studentName: 'আরিফুল ইসলাম রাব্বি',
    technology: 'সিভিল টেকনোলজি',
    semester: '৪র্থ পর্ব',
    session: '2023-2024',
    subjects: [
      { code: '66441', name: 'স্ট্রাকচারাল মেকানিক্স', credit: 4, marks: 72, grade: 'A-', point: 3.5 },
      { code: '66442', name: 'সার্ভেয়ারিং-২', credit: 3, marks: 68, grade: 'B+', point: 3.25 },
      { code: '66443', name: 'এনভায়রনমেন্টাল ইঞ্জিনিয়ারিং', credit: 3, marks: 74, grade: 'A-', point: 3.5 }
    ],
    gpa: 3.43,
    status: 'PASSED',
    publishedAt: '2024-11-25T10:00:00.000Z',
    isPublished: true
  }
];

const INITIAL_NOTICES: Notice[] = [
  {
    id: 'not-1',
    title: 'ডিপ্লোমা ইন ইঞ্জিনিয়ারিং ৪র্থ পর্ব সমাপনী পরীক্ষার ফলাফল প্রকাশ সংক্রান্ত',
    category: 'পরীক্ষা',
    date: '২০২৪-১১-২৫',
    content: 'সকল শিক্ষার্থীদের অবগতির জন্য জানানো যাচ্ছে যে, ডিপ্লোমা ইন ইঞ্জিনিয়ারিং শিক্ষাক্রমের ৪র্থ পর্বের চূড়ান্ত সমাপনী পরীক্ষার ফলাফল প্রকাশ করা হয়েছে। ফলাফল অনুসন্ধান প্যানেল থেকে রোল ও রেজিস্ট্রেশন নম্বর দিয়ে মার্কশিট ডাউনলোড করা যাবে।',
    isImportant: true,
    published: true
  },
  {
    id: 'not-2',
    title: '৫ম পর্বের নিয়মিত ক্লাস শুরু ও সেমিস্টার ফি জমা সংক্রান্ত বিজ্ঞপ্তি',
    category: 'একাডেমিক',
    date: '২০২৪-১২-০১',
    content: 'আগামী ৫ই ডিসেম্বর হতে সকল টেকনোলজির ৫ম পর্বের শ্রেণি কার্যক্রম নিয়মিত রুটিন অনুযায়ী অনুষ্ঠিত হবে। নির্ধারিত সময়ের মধ্যে সেমিস্টার ফি পরিশোধ করতে অনুরোধ করা হলো।',
    isImportant: false,
    published: true
  },
  {
    id: 'not-3',
    title: 'শিক্ষার্থী প্রবেশপত্র (Admit Card) সংগ্রহ নির্দেশনা',
    category: 'পরীক্ষা',
    date: '২০২৪-১১-১০',
    content: 'পরীক্ষার পূর্বে ডকুমেন্ট জেনারেটর বা একাডেমিক শাখা থেকে প্রবেশপত্র সংগ্রহ করতে হবে।',
    isImportant: true,
    published: true
  }
];

const INITIAL_ROUTINES: RoutineItem[] = [
  {
    id: 'rt-1',
    day: 'রবিবার',
    time: '০৯:০০ - ১০:৩০',
    subjectCode: '66641',
    subjectName: 'অবজেক্ট ওরিয়েন্টেড প্রোগ্রামিং',
    teacherName: 'ইঞ্জিঃ মোঃ জাহিদুল ইসলাম',
    roomNo: 'ল্যাব-০১ (কম্পিউটার)',
    technology: 'কম্পিউটার টেকনোলজি',
    semester: '৪র্থ পর্ব',
    shift: '১ম শিফট'
  },
  {
    id: 'rt-2',
    day: 'রবিবার',
    time: '১০:৪৫ - ১২:১৫',
    subjectCode: '66642',
    subjectName: 'ডাটা স্ট্রাকচার ও অ্যালগরিদম',
    teacherName: 'ইঞ্জিঃ শামীমা নাসরিন',
    roomNo: 'ল্যাব-০২',
    technology: 'কম্পিউটার টেকনোলজি',
    semester: '৪র্থ পর্ব',
    shift: '১ম শিফট'
  },
  {
    id: 'rt-3',
    day: 'সোমবার',
    time: '০৯:০০ - ১০:৩০',
    subjectCode: '66441',
    subjectName: 'স্ট্রাকচারাল মেকানিক্স',
    teacherName: 'ইঞ্জিঃ মাহমুদুল হাসান',
    roomNo: 'কক্ষ-৩০১',
    technology: 'সিভিল টেকনোলজি',
    semester: '৪র্থ পর্ব',
    shift: '১ম শিফট'
  }
];

const INITIAL_DOCUMENT_REQUESTS: DocumentRequest[] = [
  {
    id: 'doc-1',
    type: 'TRANSCRIPT',
    studentRoll: '612450',
    studentName: 'মোঃ তানভীর হাসান',
    technology: 'কম্পিউটার টেকনোলজি',
    semester: '৪র্থ পর্ব',
    purpose: 'উচ্চশিক্ষা ও চাকরির আবেদন',
    date: '2024-11-26',
    status: 'APPROVED'
  }
];

class DBService {
  private getStorage<T>(key: string, defaultData: T): T {
    try {
      const data = localStorage.getItem(`dpib_${key}`);
      if (!data) {
        localStorage.setItem(`dpib_${key}`, JSON.stringify(defaultData));
        return defaultData;
      }
      return JSON.parse(data);
    } catch {
      return defaultData;
    }
  }

  private setStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`dpib_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key} to localStorage:`, e);
    }
  }

  // --- Students ---
  getStudents(): Student[] {
    return this.getStorage<Student[]>('students', INITIAL_STUDENTS);
  }

  saveStudent(student: Omit<Student, 'id' | 'createdAt'> & { id?: string }): Student {
    const students = this.getStudents();
    if (student.id) {
      // update
      const index = students.findIndex((s) => s.id === student.id);
      if (index !== -1) {
        const updated: Student = {
          ...students[index],
          ...student,
          id: student.id
        };
        students[index] = updated;
        this.setStorage('students', students);
        return updated;
      }
    }
    // new student
    const newStudent: Student = {
      ...student,
      id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    students.unshift(newStudent);
    this.setStorage('students', students);
    return newStudent;
  }

  deleteStudent(id: string): boolean {
    const students = this.getStudents();
    const filtered = students.filter((s) => s.id !== id);
    if (filtered.length !== students.length) {
      this.setStorage('students', filtered);
      return true;
    }
    return false;
  }

  // --- Exams ---
  getExams(): Exam[] {
    return this.getStorage<Exam[]>('exams', INITIAL_EXAMS);
  }

  saveExam(exam: Omit<Exam, 'id' | 'createdAt'> & { id?: string }): Exam {
    const exams = this.getExams();
    if (exam.id) {
      const index = exams.findIndex((e) => e.id === exam.id);
      if (index !== -1) {
        const updated: Exam = {
          ...exams[index],
          ...exam,
          id: exam.id
        };
        exams[index] = updated;
        this.setStorage('exams', exams);
        return updated;
      }
    }
    const newExam: Exam = {
      ...exam,
      id: `exam-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    exams.unshift(newExam);
    this.setStorage('exams', exams);
    return newExam;
  }

  deleteExam(id: string): boolean {
    const exams = this.getExams();
    const filtered = exams.filter((e) => e.id !== id);
    if (filtered.length !== exams.length) {
      this.setStorage('exams', filtered);
      return true;
    }
    return false;
  }

  toggleExamPublish(id: string): boolean {
    const exams = this.getExams();
    const exam = exams.find((e) => e.id === id);
    if (exam) {
      exam.isPublished = !exam.isPublished;
      this.setStorage('exams', exams);
      return exam.isPublished;
    }
    return false;
  }

  // --- Results ---
  getResults(): Result[] {
    return this.getStorage<Result[]>('results', INITIAL_RESULTS);
  }

  saveResult(result: Omit<Result, 'id' | 'publishedAt'> & { id?: string }): Result {
    const results = this.getResults();
    if (result.id) {
      const index = results.findIndex((r) => r.id === result.id);
      if (index !== -1) {
        const updated: Result = {
          ...results[index],
          ...result,
          id: result.id
        };
        results[index] = updated;
        this.setStorage('results', results);
        return updated;
      }
    }
    const newResult: Result = {
      ...result,
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      publishedAt: new Date().toISOString()
    };
    results.unshift(newResult);
    this.setStorage('results', results);
    return newResult;
  }

  batchSaveResults(newResults: Omit<Result, 'id' | 'publishedAt'>[]): number {
    const results = this.getResults();
    let savedCount = 0;
    const now = new Date().toISOString();

    newResults.forEach((nr) => {
      // Check if student with same roll and examId already has result
      const existingIdx = results.findIndex(
        (r) => r.roll === nr.roll && (r.examId === nr.examId || (r.semester === nr.semester && r.session === nr.session))
      );

      if (existingIdx !== -1) {
        results[existingIdx] = {
          ...results[existingIdx],
          ...nr,
          publishedAt: now
        };
        savedCount++;
      } else {
        results.unshift({
          ...nr,
          id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          publishedAt: now
        });
        savedCount++;
      }
    });

    this.setStorage('results', results);
    return savedCount;
  }

  deleteResult(id: string): boolean {
    const results = this.getResults();
    const filtered = results.filter((r) => r.id !== id);
    if (filtered.length !== results.length) {
      this.setStorage('results', filtered);
      return true;
    }
    return false;
  }

  clearAllResults(): void {
    this.setStorage('results', []);
  }

  // Search Results for Student Portal
  findResultByRollAndReg(roll: string, registration?: string, examId?: string): Result[] {
    const results = this.getResults();
    const cleanRoll = roll.trim();
    const cleanReg = registration ? registration.trim() : '';

    return results.filter((r) => {
      const matchRoll = r.roll.toLowerCase() === cleanRoll.toLowerCase();
      const matchReg = cleanReg ? r.registration.toLowerCase() === cleanReg.toLowerCase() : true;
      const matchExam = examId ? r.examId === examId : true;
      return matchRoll && matchReg && matchExam && r.isPublished;
    });
  }

  // --- Notices ---
  getNotices(): Notice[] {
    return this.getStorage<Notice[]>('notices', INITIAL_NOTICES);
  }

  saveNotice(notice: Omit<Notice, 'id'> & { id?: string }): Notice {
    const notices = this.getNotices();
    if (notice.id) {
      const idx = notices.findIndex((n) => n.id === notice.id);
      if (idx !== -1) {
        notices[idx] = { ...notices[idx], ...notice };
        this.setStorage('notices', notices);
        return notices[idx];
      }
    }
    const newNotice: Notice = {
      ...notice,
      id: `not-${Date.now()}`
    };
    notices.unshift(newNotice);
    this.setStorage('notices', notices);
    return newNotice;
  }

  deleteNotice(id: string): boolean {
    const notices = this.getNotices();
    const filtered = notices.filter((n) => n.id !== id);
    if (filtered.length !== notices.length) {
      this.setStorage('notices', filtered);
      return true;
    }
    return false;
  }

  // --- Routines ---
  getRoutines(): RoutineItem[] {
    return this.getStorage<RoutineItem[]>('routines', INITIAL_ROUTINES);
  }

  saveRoutine(routine: Omit<RoutineItem, 'id'> & { id?: string }): RoutineItem {
    const routines = this.getRoutines();
    if (routine.id) {
      const idx = routines.findIndex((r) => r.id === routine.id);
      if (idx !== -1) {
        routines[idx] = { ...routines[idx], ...routine };
        this.setStorage('routines', routines);
        return routines[idx];
      }
    }
    const newRoutine: RoutineItem = {
      ...routine,
      id: `rt-${Date.now()}`
    };
    routines.push(newRoutine);
    this.setStorage('routines', routines);
    return newRoutine;
  }

  deleteRoutine(id: string): boolean {
    const routines = this.getRoutines();
    const filtered = routines.filter((r) => r.id !== id);
    if (filtered.length !== routines.length) {
      this.setStorage('routines', filtered);
      return true;
    }
    return false;
  }

  // --- Document Requests ---
  getDocumentRequests(): DocumentRequest[] {
    return this.getStorage<DocumentRequest[]>('doc_requests', INITIAL_DOCUMENT_REQUESTS);
  }

  saveDocumentRequest(req: Omit<DocumentRequest, 'id' | 'date'> & { id?: string }): DocumentRequest {
    const requests = this.getDocumentRequests();
    if (req.id) {
      const idx = requests.findIndex((d) => d.id === req.id);
      if (idx !== -1) {
        requests[idx] = { ...requests[idx], ...req };
        this.setStorage('doc_requests', requests);
        return requests[idx];
      }
    }
    const newReq: DocumentRequest = {
      ...req,
      id: `doc-${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    requests.unshift(newReq);
    this.setStorage('doc_requests', requests);
    return newReq;
  }

  // --- Reset All to Factory Seed ---
  resetToDefaultData(): void {
    this.setStorage('students', INITIAL_STUDENTS);
    this.setStorage('exams', INITIAL_EXAMS);
    this.setStorage('results', INITIAL_RESULTS);
    this.setStorage('notices', INITIAL_NOTICES);
    this.setStorage('routines', INITIAL_ROUTINES);
    this.setStorage('doc_requests', INITIAL_DOCUMENT_REQUESTS);
  }

  // --- Institute Info & Admin PIN ---
  getInstituteInfo() {
    return this.getStorage('institute_info', {
      name: 'দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট (DPIB)',
      code: 'ভোল্লা পলিটেকনিক কোড: ৫২০২১',
      address: 'বীরশ্রেষ্ঠ মোস্তফা কামাল বাস স্ট্যান্ড সংলগ্ন, ভোলা সদর, ভোলা',
      phone: '+৮৮০ ১৭২৭-০৫৫০৫৫, +৮৮০ ১৮৭৩-৪৪৭৪৭৪',
      email: 'dpib.bhola@gmail.com',
      website: 'www.dpib.edu.bd',
      btebAffiliated: 'বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB) অনুমোদিত'
    });
  }

  getAdminPin(): string {
    return localStorage.getItem('dpib_admin_pin') || '123456';
  }

  setAdminPin(pin: string): void {
    localStorage.setItem('dpib_admin_pin', pin);
  }
}

export const db = new DBService();
