import { GradingRule } from '../types';

export const DEFAULT_GRADING_RULES: GradingRule[] = [
  { id: '1', minMarksPercentage: 80, maxMarksPercentage: 100, grade: 'A+', gradePoint: 4.00, description: 'অতি চমৎকার (Outstanding)' },
  { id: '2', minMarksPercentage: 75, maxMarksPercentage: 79.99, grade: 'A', gradePoint: 3.75, description: 'চমৎকার (Excellent)' },
  { id: '3', minMarksPercentage: 70, maxMarksPercentage: 74.99, grade: 'A-', gradePoint: 3.50, description: 'খুব ভালো (Very Good)' },
  { id: '4', minMarksPercentage: 65, maxMarksPercentage: 69.99, grade: 'B+', gradePoint: 3.25, description: 'ভালো (Good)' },
  { id: '5', minMarksPercentage: 60, maxMarksPercentage: 64.99, grade: 'B', gradePoint: 3.00, description: 'সন্তোষজনক (Satisfactory)' },
  { id: '6', minMarksPercentage: 55, maxMarksPercentage: 59.99, grade: 'B-', gradePoint: 2.75, description: 'মোটামুটি (Above Average)' },
  { id: '7', minMarksPercentage: 50, maxMarksPercentage: 54.99, grade: 'C+', gradePoint: 2.50, description: 'গড় (Average)' },
  { id: '8', minMarksPercentage: 45, maxMarksPercentage: 49.99, grade: 'C', gradePoint: 2.25, description: 'চলনসই (Pass)' },
  { id: '9', minMarksPercentage: 40, maxMarksPercentage: 44.99, grade: 'D', gradePoint: 2.00, description: 'উত্তীর্ণ (Marginal)' },
  { id: '10', minMarksPercentage: 0, maxMarksPercentage: 39.99, grade: 'F', gradePoint: 0.00, description: 'অকৃতকার্য (Fail)' },
];

/**
 * Calculates grade, gradePoint and pass status from obtainedMarks and subjectFullMarks.
 * Formula: percentage = (obtainedMarks / subjectFullMarks) * 100
 * Exactly 40% or more (percentage >= 40) is PASS (Grade D or higher).
 */
export function calculateSubjectGrade(
  obtainedMarks: number,
  fullMarks: number,
  rules: GradingRule[] = DEFAULT_GRADING_RULES
): { grade: string; gradePoint: number; isPassed: boolean; percentage: number } {
  const obtained = Number(obtainedMarks) || 0;
  const full = Number(fullMarks);

  if (!full || full <= 0) {
    return { grade: 'F', gradePoint: 0.00, isPassed: false, percentage: 0 };
  }

  // Formula: percentage = (obtainedMarks / subjectFullMarks) * 100
  const rawPercentage = (obtained / full) * 100;
  // Round to 4 decimal places to prevent floating-point representation quirks
  const percentage = Math.round(rawPercentage * 10000) / 10000;

  // Grade mapping:
  // 80%–100% = A+ (4.00)
  // 75%–79.99% = A (3.75)
  // 70%–74.99% = A- (3.50)
  // 65%–69.99% = B+ (3.25)
  // 60%–64.99% = B (3.00)
  // 55%–59.99% = B- (2.75)
  // 50%–54.99% = C+ (2.50)
  // 45%–49.99% = C (2.25)
  // 40%–44.99% = D (2.00) -> percentage >= 40 is PASS
  // 0%–39.99% = F (0.00) -> FAIL

  let grade = 'F';
  let gradePoint = 0.00;
  let isPassed = false;

  if (percentage >= 80) {
    grade = 'A+';
    gradePoint = 4.00;
    isPassed = true;
  } else if (percentage >= 75) {
    grade = 'A';
    gradePoint = 3.75;
    isPassed = true;
  } else if (percentage >= 70) {
    grade = 'A-';
    gradePoint = 3.50;
    isPassed = true;
  } else if (percentage >= 65) {
    grade = 'B+';
    gradePoint = 3.25;
    isPassed = true;
  } else if (percentage >= 60) {
    grade = 'B';
    gradePoint = 3.00;
    isPassed = true;
  } else if (percentage >= 55) {
    grade = 'B-';
    gradePoint = 2.75;
    isPassed = true;
  } else if (percentage >= 50) {
    grade = 'C+';
    gradePoint = 2.50;
    isPassed = true;
  } else if (percentage >= 45) {
    grade = 'C';
    gradePoint = 2.25;
    isPassed = true;
  } else if (percentage >= 39.9999) { // Exactly 40% or >= 40 is PASS with D
    grade = 'D';
    gradePoint = 2.00;
    isPassed = true;
  } else {
    grade = 'F';
    gradePoint = 0.00;
    isPassed = false;
  }

  return {
    grade,
    gradePoint,
    isPassed,
    percentage: Math.round(rawPercentage * 100) / 100,
  };
}

/**
 * Calculates overall result for a student across all subjects.
 * Each subject's own fullMarks is respected.
 * If student has NO subject with 'F' (all subjects percentage >= 40), student is marked as PASS.
 * Overall letterGrade and GPA reflect the student's actual performance.
 */
export function calculateOverallResult(
  subjects: { obtainedMarks: number; fullMarks: number; gradePoint?: number; grade?: string; isPassed?: boolean }[],
  rules: GradingRule[] = DEFAULT_GRADING_RULES
): {
  totalFullMarks: number;
  totalObtainedMarks: number;
  overallPercentage: number;
  gpa: number;
  letterGrade: string;
  isPassed: boolean;
  failedSubjectCount: number;
} {
  if (!subjects || subjects.length === 0) {
    return {
      totalFullMarks: 0,
      totalObtainedMarks: 0,
      overallPercentage: 0,
      gpa: 0,
      letterGrade: 'N/A',
      isPassed: false,
      failedSubjectCount: 0,
    };
  }

  let totalFull = 0;
  let totalObtained = 0;
  let weightedGradePointsSum = 0;
  let unweightedGradePointsSum = 0;
  let failedSubjectCount = 0;

  for (const sub of subjects) {
    const full = Number(sub.fullMarks) || 0;
    const obtained = Number(sub.obtainedMarks) || 0;
    totalFull += full;
    totalObtained += obtained;

    // Calculate subject grade using its own actual full marks and obtained marks
    const calc = calculateSubjectGrade(obtained, full, rules);

    // If grade is 'F' (percentage < 40), it is a failed subject
    if (calc.grade === 'F' || calc.gradePoint === 0 || !calc.isPassed) {
      failedSubjectCount++;
    }

    unweightedGradePointsSum += calc.gradePoint;
    weightedGradePointsSum += (calc.gradePoint * (full > 0 ? full : 1));
  }

  const overallPercentage = totalFull > 0 ? (totalObtained / totalFull) * 100 : 0;
  const overallGradeInfo = calculateSubjectGrade(totalObtained, totalFull, rules);

  const hasFailedSubject = failedSubjectCount > 0;
  // A student with NO 'F' in any subject is PASSED
  const isPassed = !hasFailedSubject;

  if (hasFailedSubject) {
    return {
      totalFullMarks: totalFull,
      totalObtainedMarks: totalObtained,
      overallPercentage: Math.round(overallPercentage * 100) / 100,
      gpa: 0.00,
      letterGrade: 'F',
      isPassed: false,
      failedSubjectCount,
    };
  }

  // Calculate weighted GPA (matching total marks weight) and unweighted GPA
  const weightedGpa = totalFull > 0 ? weightedGradePointsSum / totalFull : 0;
  const unweightedGpa = subjects.length > 0 ? unweightedGradePointsSum / subjects.length : 0;

  // Use weighted GPA and round to 2 decimal places
  let gpa = Number(weightedGpa.toFixed(2));
  if (gpa === 0 && isPassed) {
    gpa = overallGradeInfo.gradePoint;
  }
  if (gpa < 2.00 && isPassed) {
    gpa = 2.00;
  }

  // Overall letter grade is derived from overall percentage (89.21% -> A+, 69.17% -> B+, 40.0% -> D)
  const letterGrade = overallGradeInfo.grade;

  return {
    totalFullMarks: totalFull,
    totalObtainedMarks: totalObtained,
    overallPercentage: Math.round(overallPercentage * 100) / 100,
    gpa,
    letterGrade,
    isPassed: true,
    failedSubjectCount: 0,
  };
}

export const calculateResultGrades = calculateOverallResult;
