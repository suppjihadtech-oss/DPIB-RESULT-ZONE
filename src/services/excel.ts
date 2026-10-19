import { Result, SubjectResult, Technology, Semester } from '../types';

export interface ParsedJsonResult {
  roll: string;
  registration: string;
  studentName: string;
  technology: Technology;
  semester: Semester;
  session: string;
  subjects: {
    code: string;
    name: string;
    credit: number;
    marks: number;
  }[];
}

export interface ValidationReport {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: {
    index: number;
    roll?: string;
    reason: string;
  }[];
  parsedData: Omit<Result, 'id' | 'publishedAt'>[];
  detectedExam?: {
    semester: Semester;
    session: string;
    technology?: string;
    title: string;
    description?: string;
  };
}

// BTEB Grading Scale calculation
export function calculateGradePoint(marks: number): { grade: string; point: number } {
  if (marks >= 80) return { grade: 'A+', point: 4.0 };
  if (marks >= 75) return { grade: 'A', point: 3.75 };
  if (marks >= 70) return { grade: 'A-', point: 3.5 };
  if (marks >= 65) return { grade: 'B+', point: 3.25 };
  if (marks >= 60) return { grade: 'B', point: 3.0 };
  if (marks >= 55) return { grade: 'B-', point: 2.75 };
  if (marks >= 50) return { grade: 'C+', point: 2.5 };
  if (marks >= 45) return { grade: 'C', point: 2.25 };
  if (marks >= 40) return { grade: 'D', point: 2.0 };
  return { grade: 'F', point: 0.0 };
}

export function parseJsonResults(jsonString: string): ValidationReport {
  const report: ValidationReport = {
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    errors: [],
    parsedData: []
  };

  if (!jsonString || !jsonString.trim()) {
    report.errors.push({
      index: 0,
      reason: 'কোনো JSON কোড প্রদান করা হয়নি'
    });
    return report;
  }

  let rawList: any[];

  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      rawList = parsed;
    } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.results)) {
      rawList = parsed.results;
      if (parsed.examTitle || parsed.semester) {
        report.detectedExam = {
          title: parsed.examTitle || `${parsed.semester || 'সেমিস্টার'} ফাইনাল পরীক্ষা`,
          semester: parsed.semester || '১ম পর্ব',
          session: parsed.session || '2023-2024',
          description: parsed.description || 'JSON আপলোড হতে স্বয়ংক্রিয় তৈরি'
        };
      }
    } else if (parsed && typeof parsed === 'object') {
      rawList = [parsed];
    } else {
      report.errors.push({
        index: 0,
        reason: 'অবৈধ JSON ডেটা ফরম্যাট: অ্যারে বা অবজেক্ট হতে হবে'
      });
      return report;
    }
  } catch (err: any) {
    report.errors.push({
      index: 0,
      reason: `JSON সিনট্যাক্স ভুল: ${err.message || 'কোডটি যাচাই করুন'}`
    });
    return report;
  }

  report.totalRows = rawList.length;

  rawList.forEach((item, index) => {
    const rowNum = index + 1;
    const roll = String(item.roll || item.Roll || '').trim();
    const registration = String(item.registration || item.reg || item.Reg || '').trim();
    const studentName = String(item.name || item.studentName || item.StudentName || '').trim();
    const technology = (item.technology || item.tech || 'কম্পিউটার টেকনোলজি') as Technology;
    const semester = (item.semester || item.sem || '১ম পর্ব') as Semester;
    const session = String(item.session || '2023-2024').trim();

    if (!roll) {
      report.invalidRows++;
      report.errors.push({ index: rowNum, reason: 'রোল নম্বর অনুপস্থিত' });
      return;
    }

    if (!registration) {
      report.invalidRows++;
      report.errors.push({ index: rowNum, roll, reason: 'রেজিস্ট্রেশন নম্বর অনুপস্থিত' });
      return;
    }

    // Parse subjects
    const subjectsRaw = item.subjects || item.marksList || [];
    const subjects: SubjectResult[] = [];
    let totalCredits = 0;
    let totalPoints = 0;
    const failedSubjects: string[] = [];

    if (Array.isArray(subjectsRaw) && subjectsRaw.length > 0) {
      subjectsRaw.forEach((sub: any) => {
        const subCode = String(sub.code || sub.subjectCode || 'SUB');
        const subName = String(sub.name || sub.subjectName || subCode);
        const credit = Number(sub.credit || 3);
        const marks = Number(sub.marks ?? 0);
        const { grade, point } = calculateGradePoint(marks);

        if (point === 0) {
          failedSubjects.push(subName);
        }

        totalCredits += credit;
        totalPoints += point * credit;

        subjects.push({
          code: subCode,
          name: subName,
          credit,
          marks,
          grade,
          point
        });
      });
    } else {
      // Default fallback subject marks if raw subject list not nested
      const defaultMarks = Number(item.marks || 75);
      const { grade, point } = calculateGradePoint(defaultMarks);
      subjects.push({
        code: '66611',
        name: 'কম্পিউটার অ্যাপ্লিকেশন',
        credit: 3,
        marks: defaultMarks,
        grade,
        point
      });
      totalCredits = 3;
      totalPoints = point * 3;
    }

    const calculatedGpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;
    const status = failedSubjects.length > 0 ? (failedSubjects.length > 2 ? 'FAILED' : 'REFERRED') : 'PASSED';

    report.validRows++;
    report.parsedData.push({
      examId: '',
      studentId: '',
      roll,
      registration,
      studentName: studentName || `শিক্ষার্থী (${roll})`,
      technology,
      semester,
      session,
      subjects,
      gpa: calculatedGpa,
      status,
      failedSubjects: failedSubjects.length > 0 ? failedSubjects : undefined,
      isPublished: true
    });
  });

  if (!report.detectedExam && report.parsedData.length > 0) {
    const first = report.parsedData[0];
    report.detectedExam = {
      title: `${first.semester} ফাইনাল পরীক্ষা - ${first.session}`,
      semester: first.semester,
      session: first.session,
      technology: first.technology,
      description: 'JSON আপলোড হতে স্বয়ংক্রিয় তৈরি'
    };
  }

  return report;
}

export function generateSampleJson(): string {
  const sample = [
    {
      roll: "612450",
      registration: "1502123456",
      studentName: "মোঃ তানভীর হাসান",
      technology: "কম্পিউটার টেকনোলজি",
      semester: "৪র্থ পর্ব",
      session: "2023-2024",
      subjects: [
        { code: "66641", name: "অবজেক্ট ওরিয়েন্টেড প্রোগ্রামিং", credit: 3, marks: 84 },
        { code: "66642", name: "ডাটা স্ট্রাকচার ও অ্যালগরিদম", credit: 4, marks: 78 },
        { code: "66643", name: "ওয়েব ডেভেলপমেন্ট ফান্ডামেন্টালস", credit: 3, marks: 88 },
        { code: "66644", name: "ডাটাবেস ম্যানেজমেন্ট সিস্টেম", credit: 3, marks: 76 }
      ]
    },
    {
      roll: "612451",
      registration: "1502123457",
      studentName: "মোসাঃ ফারহানা ইসলাম",
      technology: "কম্পিউটার টেকনোলজি",
      semester: "৪র্থ পর্ব",
      session: "2023-2024",
      subjects: [
        { code: "66641", name: "অবজেক্ট ওরিয়েন্টেড প্রোগ্রামিং", credit: 3, marks: 91 },
        { code: "66642", name: "ডাটা স্ট্রাকচার ও অ্যালগরিদম", credit: 4, marks: 82 },
        { code: "66643", name: "ওয়েব ডেভেলপমেন্ট ফান্ডামেন্টালস", credit: 3, marks: 85 },
        { code: "66644", name: "ডাটাবেস ম্যানেজমেন্ট সিস্টেম", credit: 3, marks: 79 }
      ]
    },
    {
      roll: "612452",
      registration: "1502123458",
      studentName: "আরিফুল ইসলাম রাব্বি",
      technology: "সিভিল টেকনোলজি",
      semester: "৪র্থ পর্ব",
      session: "2023-2024",
      subjects: [
        { code: "66441", name: "স্ট্রাকচারাল মেকানিক্স", credit: 4, marks: 72 },
        { code: "66442", name: "সার্ভেয়ারিং-২", credit: 3, marks: 68 },
        { code: "66443", name: "এনভায়রনমেন্টাল ইঞ্জিনিয়ারিং", credit: 3, marks: 74 }
      ]
    }
  ];

  return JSON.stringify(sample, null, 2);
}
