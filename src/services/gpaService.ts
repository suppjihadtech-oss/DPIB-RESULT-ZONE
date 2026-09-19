import { GpaSubject, GpaCalculationResult, GradingRule } from '../types';

export interface BtebGradeInfo {
  grade: string;
  gradePoint: number;
  minMarks: number;
  maxMarks: number;
  description: string;
  isPass: boolean;
}

export const BTEB_GRADING_SCALE: BtebGradeInfo[] = [
  { grade: 'A+', gradePoint: 4.00, minMarks: 80, maxMarks: 100, description: 'অসামান্য', isPass: true },
  { grade: 'A',  gradePoint: 3.75, minMarks: 75, maxMarks: 79.99, description: 'চমৎকার', isPass: true },
  { grade: 'A-', gradePoint: 3.50, minMarks: 70, maxMarks: 74.99, description: 'খুব ভালো', isPass: true },
  { grade: 'B+', gradePoint: 3.25, minMarks: 65, maxMarks: 69.99, description: 'ভালো', isPass: true },
  { grade: 'B',  gradePoint: 3.00, minMarks: 60, maxMarks: 64.99, description: 'সন্তোষজনক', isPass: true },
  { grade: 'B-', gradePoint: 2.75, minMarks: 55, maxMarks: 59.99, description: 'গড়ের উপরে', isPass: true },
  { grade: 'C+', gradePoint: 2.50, minMarks: 50, maxMarks: 54.99, description: 'মোটামুটি', isPass: true },
  { grade: 'C',  gradePoint: 2.25, minMarks: 45, maxMarks: 49.99, description: 'পাস মার্কের কাছাকাছি', isPass: true },
  { grade: 'D',  gradePoint: 2.00, minMarks: 40, maxMarks: 44.99, description: 'শুধু পাস', isPass: true },
  { grade: 'F',  gradePoint: 0.00, minMarks: 0,  maxMarks: 39.99, description: 'অকৃতকার্য বা রেফার্ড', isPass: false },
];

/**
 * Derives Grade and Grade Point from percentage/marks according to BTEB or custom configured scale.
 */
export function getBtebGradeFromMarks(marks: number, customRules?: GradingRule[]): BtebGradeInfo {
  const cleanMarks = Math.max(0, Math.min(100, marks));
  const pct = Math.round(cleanMarks * 10000) / 10000;
  
  if (customRules && customRules.length > 0) {
    const sorted = [...customRules].sort((a, b) => (b.minMarksPercentage ?? 0) - (a.minMarksPercentage ?? 0));
    for (const rule of sorted) {
      if (pct >= (rule.minMarksPercentage ?? 0)) {
        return {
          grade: rule.grade,
          gradePoint: rule.gradePoint,
          minMarks: rule.minMarksPercentage,
          maxMarks: rule.maxMarksPercentage,
          description: rule.description || (rule.gradePoint >= 4.0 ? 'অসামান্য' : rule.gradePoint >= 3.5 ? 'চমৎকার' : rule.gradePoint >= 3.0 ? 'ভালো' : rule.gradePoint >= 2.0 ? 'পাস' : 'অকৃতকার্য বা রেফার্ড'),
          isPass: rule.gradePoint > 0,
        };
      }
    }
  }

  for (const item of BTEB_GRADING_SCALE) {
    if (pct >= item.minMarks) {
      return item;
    }
  }
  return BTEB_GRADING_SCALE[BTEB_GRADING_SCALE.length - 1];
}

/**
 * Calculates semester GPA according to BTEB credit weighting formula:
 * GPA = Σ(Credit × GradePoint) / Σ(Credit)
 */
export function calculateBtebGpa(subjects: GpaSubject[], customRules?: GradingRule[]): GpaCalculationResult {
  if (!subjects || subjects.length === 0) {
    return {
      subjects: [],
      totalCredits: 0,
      totalCreditPoints: 0,
      gpa: 0,
      letterGrade: 'F',
      isPassed: false,
      hasReferred: false,
      referredSubjects: [],
    };
  }

  let totalCredits = 0;
  let totalCreditPoints = 0;
  const referredSubjects: string[] = [];
  const processed = subjects.map((sub) => {
    const credit = Math.max(0, sub.credit || 0);
    const gp = Math.max(0, sub.gradePoint || 0);
    const creditTimesGp = Number((credit * gp).toFixed(4));

    if (credit > 0) {
      totalCredits += credit;
      totalCreditPoints += creditTimesGp;
    }

    if (sub.grade === 'F' || gp === 0) {
      referredSubjects.push(sub.name || sub.code || 'বিষয়');
    }

    return {
      subject: sub,
      creditTimesGp,
    };
  });

  const hasReferred = referredSubjects.length > 0;
  let rawGpa = totalCredits > 0 ? totalCreditPoints / totalCredits : 0;
  rawGpa = Math.min(4.00, Math.max(0, rawGpa));

  // If there's an 'F' grade in BTEB, semester result status is Referred with GPA 0.00
  const finalGpa = hasReferred ? 0.00 : Number(rawGpa.toFixed(2));

  // Find overall letter grade
  let overallGrade = 'F';
  if (!hasReferred && finalGpa >= 2.00) {
    if (customRules && customRules.length > 0) {
      const sorted = [...customRules].sort((a, b) => b.gradePoint - a.gradePoint);
      const match = sorted.find((r) => finalGpa >= r.gradePoint && r.gradePoint > 0);
      overallGrade = match ? match.grade : (finalGpa >= 4.0 ? 'A+' : 'D');
    } else {
      if (finalGpa >= 4.00) overallGrade = 'A+';
      else if (finalGpa >= 3.75) overallGrade = 'A';
      else if (finalGpa >= 3.50) overallGrade = 'A-';
      else if (finalGpa >= 3.25) overallGrade = 'B+';
      else if (finalGpa >= 3.00) overallGrade = 'B';
      else if (finalGpa >= 2.75) overallGrade = 'B-';
      else if (finalGpa >= 2.50) overallGrade = 'C+';
      else if (finalGpa >= 2.25) overallGrade = 'C';
      else overallGrade = 'D';
    }
  }

  return {
    subjects: processed,
    totalCredits: Number(totalCredits.toFixed(2)),
    totalCreditPoints: Number(totalCreditPoints.toFixed(2)),
    gpa: finalGpa,
    letterGrade: overallGrade,
    isPassed: !hasReferred && finalGpa >= 2.00,
    hasReferred,
    referredSubjects,
  };
}

/**
 * Sample template subjects for Diploma in Engineering semester.
 */
export const DEFAULT_SAMPLE_SUBJECTS: GpaSubject[] = [
  { id: '1', name: 'প্রোগ্রামিং এসেনশিয়ালস', code: '66631', credit: 3, marks: 85, grade: 'A+', gradePoint: 4.00 },
  { id: '2', name: 'ডাটাবেস ম্যানেজমেন্ট সিস্টেম', code: '66641', credit: 4, marks: 78, grade: 'A', gradePoint: 3.75 },
  { id: '3', name: 'ডাটা স্ট্রাকচার ও অ্যালগরিদম', code: '66642', credit: 3, marks: 72, grade: 'A-', gradePoint: 3.50 },
  { id: '4', name: 'ওয়েব ডেভেলপমেন্ট', code: '66643', credit: 3, marks: 82, grade: 'A+', gradePoint: 4.00 },
  { id: '5', name: 'ইঞ্জিনিয়ারিং ম্যাথমেটিক্স', code: '65931', credit: 3, marks: 68, grade: 'B+', gradePoint: 3.25 },
  { id: '6', name: 'বিজনেস কমিউনিকেশন', code: '65841', credit: 2, marks: 76, grade: 'A', gradePoint: 3.75 },
];
