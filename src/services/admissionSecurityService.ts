import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  AdmissionApplication,
  AdmissionApplicationStatus,
  AdmissionRateLimitRecord,
  AdmissionSecurityLog,
  EducationalInfo,
  PersonalInfo,
  SecurityAuditReport,
  TechnologyChoice,
} from '../types';
import { toEnglishDigits } from '../utils/bangla';

export const ADMISSION_SECURITY_COLLECTIONS = {
  APPLICATIONS: 'admission_applications',
  RATE_LIMITS: 'admission_rate_limits',
  SECURITY_LOGS: 'admission_security_logs',
};

// Rate Limit Configuration: Max 4 attempts per 10 minutes per device/phone
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS_PER_WINDOW = 4;
const BLOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes block if exceeded
const BOT_RAPID_SUBMISSION_THRESHOLD_MS = 6000; // 6 seconds for multi-step form

/**
 * Generate a client-side device & browser fingerprint hash
 * Completely safe, non-intrusive, and deterministic for detecting repeated submissions
 */
export function generateDeviceFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'fp_ssr_client';
  }

  try {
    const nav = window.navigator;
    const scr = window.screen;
    const rawTokens = [
      nav.userAgent || 'unknown_ua',
      nav.language || 'bn',
      scr.width || 0,
      scr.height || 0,
      scr.colorDepth || 24,
      new Date().getTimezoneOffset(),
      nav.hardwareConcurrency || 2,
    ].join('###');

    let hash = 0;
    for (let i = 0; i < rawTokens.length; i++) {
      const char = rawTokens.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `dev_${Math.abs(hash).toString(36)}_${scr.width}x${scr.height}`;
  } catch {
    return `dev_gen_${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Check and update rate limits in Firestore
 * Fully synced with Firestore to prevent browser reload / local storage bypass
 */
export async function checkAndUpdateRateLimit(params: {
  deviceFingerprint: string;
  phone: string;
}): Promise<{
  isAllowed: boolean;
  blockedUntil?: number;
  remainingMinutes?: number;
  reason?: string;
}> {
  const now = Date.now();
  const cleanPhone = toEnglishDigits(params.phone).replace(/\D/g, '');

  const targets = [
    { key: `device_${params.deviceFingerprint}`, type: 'DEVICE' as const },
    { key: `phone_${cleanPhone}`, type: 'PHONE' as const },
  ];

  for (const target of targets) {
    try {
      const limitDocRef = doc(db, ADMISSION_SECURITY_COLLECTIONS.RATE_LIMITS, target.key);
      const snap = await getDoc(limitDocRef);

      if (snap.exists()) {
        const data = snap.data() as AdmissionRateLimitRecord;

        // Check if currently blocked
        if (data.blockedUntil && data.blockedUntil > now) {
          const remainingMinutes = Math.ceil((data.blockedUntil - now) / 60000);
          return {
            isAllowed: false,
            blockedUntil: data.blockedUntil,
            remainingMinutes,
            reason: `অতিরিক্ত সাবমিশন চেষ্টার কারণে এই ${
              target.type === 'DEVICE' ? 'ডিভাইসটি' : 'মোবাইল নম্বরটি'
            } সাময়িকভাবে ${remainingMinutes} মিনিটের জন্য সীমাবদ্ধ রাখা হয়েছে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।`,
          };
        }

        // Check window expiry
        const isWindowExpired = now - (data.firstAttemptAt || 0) > RATE_LIMIT_WINDOW_MS;
        const currentAttempts = isWindowExpired ? 1 : (data.attempts || 0) + 1;
        const firstAttemptAt = isWindowExpired ? now : data.firstAttemptAt || now;

        if (currentAttempts > MAX_ATTEMPTS_PER_WINDOW) {
          const blockedUntil = now + BLOCK_DURATION_MS;
          await setDoc(
            limitDocRef,
            {
              key: target.key,
              type: target.type,
              attempts: currentAttempts,
              firstAttemptAt,
              lastAttemptAt: now,
              blockedUntil,
              updatedAt: now,
            },
            { merge: true }
          );

          // Log security rate limit trip
          await logAdmissionSecurityEvent({
            eventType: 'RATE_LIMIT_EXCEEDED',
            severity: 'WARNING',
            deviceFingerprint: params.deviceFingerprint,
            phone: cleanPhone,
            riskScore: 70,
            riskFactors: [`RATE_LIMIT_EXCEEDED_ON_${target.type}`],
            details: `Rate limit triggered for ${target.type} (${target.key}) with ${currentAttempts} attempts in window.`,
          });

          return {
            isAllowed: false,
            blockedUntil,
            remainingMinutes: Math.ceil(BLOCK_DURATION_MS / 60000),
            reason: `অতিরিক্ত আবেদনের চেষ্টার কারণে এই ${
              target.type === 'DEVICE' ? 'ডিভাইসটি' : 'মোবাইল নম্বরটি'
            } সাময়িকভাবে ১০ মিনিটের জন্য সীমাবদ্ধ করা হয়েছে।`,
          };
        }

        // Update attempt count in Firestore
        await setDoc(
          limitDocRef,
          {
            key: target.key,
            type: target.type,
            attempts: currentAttempts,
            firstAttemptAt,
            lastAttemptAt: now,
            blockedUntil: 0,
            updatedAt: now,
          },
          { merge: true }
        );
      } else {
        // Create initial tracking record in Firestore
        await setDoc(limitDocRef, {
          key: target.key,
          type: target.type,
          attempts: 1,
          firstAttemptAt: now,
          lastAttemptAt: now,
          blockedUntil: 0,
          updatedAt: now,
        });
      }
    } catch (err) {
      console.warn('Rate limit Firestore tracking check error:', err);
    }
  }

  return { isAllowed: true };
}

/**
 * Log a security event directly to Firestore
 */
export async function logAdmissionSecurityEvent(params: {
  eventType: AdmissionSecurityLog['eventType'];
  severity: AdmissionSecurityLog['severity'];
  deviceFingerprint: string;
  phone: string;
  roll?: string;
  applicationId?: string;
  applicationNumber?: string;
  riskScore: number;
  riskFactors: string[];
  details: string;
}): Promise<void> {
  try {
    const now = Date.now();
    const logId = `sec_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const logRef = doc(db, ADMISSION_SECURITY_COLLECTIONS.SECURITY_LOGS, logId);
    const logDoc: AdmissionSecurityLog = {
      id: logId,
      eventType: params.eventType,
      severity: params.severity,
      deviceFingerprint: params.deviceFingerprint,
      phone: params.phone,
      roll: params.roll,
      applicationId: params.applicationId,
      applicationNumber: params.applicationNumber,
      riskScore: params.riskScore,
      riskFactors: params.riskFactors,
      details: params.details,
      timestamp: now,
    };
    await setDoc(logRef, logDoc);
  } catch (err) {
    console.warn('Failed to write security log to Firestore:', err);
  }
}

/**
 * Strict Input Validation for Admission Fields
 */
export function validateAdmissionInputs(params: {
  personalInfo: PersonalInfo;
  educationalInfo: EducationalInfo;
  applicantPhone: string;
  applicantEmail?: string;
}): { isValid: boolean; error?: string } {
  const cleanPhone = toEnglishDigits(params.applicantPhone).replace(/\D/g, '');
  const cleanRoll = toEnglishDigits(params.educationalInfo.rollNumber).replace(/\D/g, '');
  const cleanReg = toEnglishDigits(params.educationalInfo.registrationNumber).replace(/\D/g, '');
  const gpa = Number(params.educationalInfo.gpa);

  // 1. Phone number validation (11 digits, starts with 013-019)
  if (!cleanPhone || !/^01[3-9]\d{8}$/.test(cleanPhone)) {
    return {
      isValid: false,
      error: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন।',
    };
  }

  // 2. Roll validation (6 digits standard for SSC/Dakhil)
  if (!cleanRoll || cleanRoll.length < 6 || cleanRoll.length > 8) {
    return {
      isValid: false,
      error: 'এসএসসি/সমমানের সঠিক রোল নম্বর প্রদান করুন (সাধারণত ৬ ডিজিট)।',
    };
  }

  // 3. Registration validation (10 digits standard)
  if (!cleanReg || cleanReg.length < 9 || cleanReg.length > 12) {
    return {
      isValid: false,
      error: 'এসএসসি/সমমানের সঠিক রেজিস্ট্রেশন নম্বর প্রদান করুন (সাধারণত ১০ ডিজিট)।',
    };
  }

  // 4. GPA validation (2.00 to 5.00)
  if (isNaN(gpa) || gpa < 2.0 || gpa > 5.0) {
    return {
      isValid: false,
      error: 'সঠিক জিপিএ (২.০০ থেকে ৫.০০ এর মধ্যে) প্রদান করুন।',
    };
  }

  // 5. Name Validation
  if (!params.personalInfo.fullNameBangla?.trim() || params.personalInfo.fullNameBangla.trim().length < 3) {
    return {
      isValid: false,
      error: 'বাংলায় পূর্ণ নাম সঠিকভাবে লিখুন (কমপক্ষে ৩ অক্ষর)।',
    };
  }
  if (!params.personalInfo.fullNameEnglish?.trim() || params.personalInfo.fullNameEnglish.trim().length < 3) {
    return {
      isValid: false,
      error: 'ইংরেজিতে পূর্ণ নাম সঠিকভাবে লিখুন (কমপক্ষে ৩ অক্ষর)।',
    };
  }

  // 6. Age & Date of Birth Validation
  if (params.personalInfo.dateOfBirth) {
    const dob = new Date(params.personalInfo.dateOfBirth);
    if (!isNaN(dob.getTime())) {
      const ageDiff = Date.now() - dob.getTime();
      const ageDate = new Date(ageDiff);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (age < 12 || age > 40) {
        return {
          isValid: false,
          error: 'জন্মতারিখ অনুযায়ী শিক্ষার্থীর বয়স ১২ থেকে ৪০ বছরের মধ্যে হতে হবে।',
        };
      }
    }
  }

  // 7. Email Validation (if provided)
  if (params.applicantEmail && params.applicantEmail.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(params.applicantEmail.trim())) {
      return {
        isValid: false,
        error: 'অনুগ্রহ করে সঠিক ইমেইল ঠিকানা প্রদান করুন অথবা খালি রাখুন।',
      };
    }
  }

  return { isValid: true };
}

export interface FraudEvaluationResult {
  isBlocked: boolean;
  blockReason?: string;
  suggestedStatus: AdmissionApplicationStatus;
  securityAudit: SecurityAuditReport;
}

/**
 * Comprehensive Firestore-Synced Fraud & Duplicate Application Evaluator
 * Queries live Firestore data to detect duplicates, identity collisions, and bot automation patterns
 */
export async function evaluateAdmissionFraudAndDuplicates(params: {
  applicantId: string;
  applicantPhone: string;
  applicantEmail?: string;
  personalInfo: PersonalInfo;
  educationalInfo: EducationalInfo;
  technologyChoice: TechnologyChoice;
  deviceFingerprint: string;
  submissionDurationMs?: number;
}): Promise<FraudEvaluationResult> {
  const cleanPhone = toEnglishDigits(params.applicantPhone).replace(/\D/g, '');
  const cleanGuardianPhone = params.personalInfo.guardianPhone
    ? toEnglishDigits(params.personalInfo.guardianPhone).replace(/\D/g, '')
    : '';
  const cleanRoll = toEnglishDigits(params.educationalInfo.rollNumber).replace(/\D/g, '');
  const cleanReg = toEnglishDigits(params.educationalInfo.registrationNumber).replace(/\D/g, '');
  const cleanBoard = (params.educationalInfo.board || '').trim().toLowerCase();
  const cleanYear = toEnglishDigits(params.educationalInfo.passingYear || '').replace(/\D/g, '');
  const cleanEmail = (params.applicantEmail || '').trim().toLowerCase();

  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'Server/Node';
  const duration = params.submissionDurationMs || 30000;

  let riskScore = 0;
  const riskFactors: string[] = [];
  const matchedAppNumbers: string[] = [];
  const fraudFlags = {
    isDuplicateRoll: false,
    isDuplicateReg: false,
    isDuplicatePhone: false,
    isDuplicateEmail: false,
    isDuplicateNameBirthday: false,
    isRapidSubmission: false,
    isRateLimitTriggered: false,
    isSuspiciousDevicePattern: false,
  };

  // 1. Rapid submission bot detection (< 6 seconds)
  if (duration < BOT_RAPID_SUBMISSION_THRESHOLD_MS) {
    riskScore += 40;
    riskFactors.push('RAPID_AUTOMATED_SUBMISSION_SPEED');
    fraudFlags.isRapidSubmission = true;
  }

  // 2. Query Firestore live applications for duplicate examination credentials (Roll & Reg)
  const applicationsCol = collection(db, ADMISSION_SECURITY_COLLECTIONS.APPLICATIONS);

  try {
    // Query A: Look for identical SSC Roll Number in Firestore
    const rollQuery = query(
      applicationsCol,
      where('educationalInfo.rollNumber', '==', cleanRoll),
      limit(10)
    );
    const rollSnap = await getDocs(rollQuery);

    const existingAppsWithRoll: AdmissionApplication[] = [];
    rollSnap.forEach((docSnap) => {
      const appData = docSnap.data() as AdmissionApplication;
      // Exclude self if updating
      if (appData.applicantId !== params.applicantId) {
        existingAppsWithRoll.push(appData);
      } else {
        // If same applicant already submitted for this roll, record it
        existingAppsWithRoll.push(appData);
      }
    });

    // Query B: Look for identical Registration Number in Firestore
    const regQuery = query(
      applicationsCol,
      where('educationalInfo.registrationNumber', '==', cleanReg),
      limit(10)
    );
    const regSnap = await getDocs(regQuery);

    const existingAppsWithReg: AdmissionApplication[] = [];
    regSnap.forEach((docSnap) => {
      const appData = docSnap.data() as AdmissionApplication;
      if (!existingAppsWithRoll.some((a) => a.id === appData.id)) {
        existingAppsWithReg.push(appData);
      }
    });

    const conflictingApps = [...existingAppsWithRoll, ...existingAppsWithReg];

    // Analyze conflict cases
    for (const conflict of conflictingApps) {
      matchedAppNumbers.push(conflict.applicationNumber);

      const conflictBoard = (conflict.educationalInfo?.board || '').trim().toLowerCase();
      const conflictYear = toEnglishDigits(conflict.educationalInfo?.passingYear || '').replace(/\D/g, '');
      const conflictPhone = toEnglishDigits(conflict.applicantPhone || '').replace(/\D/g, '');
      const sameRoll = toEnglishDigits(conflict.educationalInfo?.rollNumber || '').replace(/\D/g, '') === cleanRoll;
      const sameReg = toEnglishDigits(conflict.educationalInfo?.registrationNumber || '').replace(/\D/g, '') === cleanReg;
      const isBoardMatch = !cleanBoard || !conflictBoard || cleanBoard === conflictBoard;
      const isYearMatch = !cleanYear || !conflictYear || cleanYear === conflictYear;

      // Case 1: Active Enrollment or Approval already exists for this Roll or Reg
      if ((sameRoll && isBoardMatch) || sameReg) {
        if (conflict.status === 'ENROLLED' || conflict.status === 'APPROVED') {
          fraudFlags.isDuplicateRoll = true;
          fraudFlags.isDuplicateReg = true;
          riskScore = 100;
          riskFactors.push('DUPLICATE_ROLL_OR_REG_ALREADY_APPROVED_OR_ENROLLED');

          await logAdmissionSecurityEvent({
            eventType: 'DUPLICATE_ATTEMPT_BLOCKED',
            severity: 'CRITICAL',
            deviceFingerprint: params.deviceFingerprint,
            phone: cleanPhone,
            roll: cleanRoll,
            applicationNumber: conflict.applicationNumber,
            riskScore: 100,
            riskFactors,
            details: `Blocked duplicate submission attempt. Candidate roll ${cleanRoll} is already ${conflict.status} under application ${conflict.applicationNumber}.`,
          });

          return {
            isBlocked: true,
            blockReason: `এই রোল (${cleanRoll}) বা রেজিস্ট্রেশন নম্বর দিয়ে ইতিমধ্যে একটি আবেদন অনুমোদিত বা ভর্তি সম্পন্ন হয়েছে (আবেদন নং: ${conflict.applicationNumber})। একই তথ্যে একাধিক আবেদন গ্রহণ করা সম্ভব নয়।`,
            suggestedStatus: 'REJECTED',
            securityAudit: {
              deviceFingerprint: params.deviceFingerprint,
              userAgent,
              submissionDurationMs: duration,
              riskScore: 100,
              riskLevel: 'CRITICAL',
              riskFactors,
              fraudFlags,
              matchedApplicationNumbers: matchedAppNumbers,
              actionTaken: 'REJECTED_BLOCKED',
              evaluatedAt: Date.now(),
            },
          };
        }

        // Case 2: Same applicant or phone submitting duplicate application for same roll
        if (conflict.applicantId === params.applicantId || conflictPhone === cleanPhone) {
          if (conflict.status === 'SUBMITTED' || conflict.status === 'UNDER_REVIEW') {
            fraudFlags.isDuplicateRoll = true;
            riskScore = 95;
            riskFactors.push('DUPLICATE_SUBMISSION_FOR_SAME_ACTIVE_APPLICATION');

            await logAdmissionSecurityEvent({
              eventType: 'DUPLICATE_ATTEMPT_BLOCKED',
              severity: 'WARNING',
              deviceFingerprint: params.deviceFingerprint,
              phone: cleanPhone,
              roll: cleanRoll,
              applicationNumber: conflict.applicationNumber,
              riskScore: 95,
              riskFactors,
              details: `Blocked duplicate attempt from same applicant/phone. Application ${conflict.applicationNumber} is already in ${conflict.status} status.`,
            });

            return {
              isBlocked: true,
              blockReason: `আপনার এই রোল নম্বরে (${cleanRoll}) ইতিমধ্যে একটি আবেদন ডাটাবেসে জমা রয়েছে (আবেদন ট্র্যাকিং নং: ${conflict.applicationNumber})। অনুগ্রহ করে ড্যাশবোর্ড থেকে বর্তমান আবেদনের অবস্থা পর্যালোচনা করুন।`,
              suggestedStatus: conflict.status,
              securityAudit: {
                deviceFingerprint: params.deviceFingerprint,
                userAgent,
                submissionDurationMs: duration,
                riskScore: 95,
                riskLevel: 'HIGH',
                riskFactors,
                fraudFlags,
                matchedApplicationNumbers: matchedAppNumbers,
                actionTaken: 'REJECTED_BLOCKED',
                evaluatedAt: Date.now(),
              },
            };
          }
        }

        // Case 3: Different applicant / different phone claiming the SAME Roll & Reg!
        if (conflict.applicantId !== params.applicantId && conflictPhone !== cleanPhone) {
          fraudFlags.isDuplicateRoll = true;
          fraudFlags.isDuplicateReg = true;
          riskScore = Math.max(riskScore, 85);
          riskFactors.push('IDENTITY_COLLISION_SAME_ROLL_CLAIMED_BY_DIFFERENT_ACCOUNT');
        }
      }
    }

    // 3. Check Phone & Email Frequency across all applications in Firestore
    const phoneQuery = query(
      applicationsCol,
      where('applicantPhone', '==', cleanPhone),
      limit(10)
    );
    const phoneSnap = await getDocs(phoneQuery);
    const appsWithPhone: AdmissionApplication[] = [];
    phoneSnap.forEach((d) => appsWithPhone.push(d.data() as AdmissionApplication));

    // If more than 2 distinct applications exist from this phone
    if (appsWithPhone.length >= 2) {
      riskScore += 25;
      riskFactors.push(`HIGH_APPLICATION_VOLUME_ON_SAME_PHONE_${appsWithPhone.length}_APPS`);
      fraudFlags.isDuplicatePhone = true;
    }

    // Check Email if provided
    if (cleanEmail) {
      const emailQuery = query(
        applicationsCol,
        where('applicantEmail', '==', cleanEmail),
        limit(10)
      );
      const emailSnap = await getDocs(emailQuery);
      if (emailSnap.size >= 2) {
        riskScore += 20;
        riskFactors.push('MULTIPLE_APPLICATIONS_SAME_EMAIL');
        fraudFlags.isDuplicateEmail = true;
      }
    }

    // 4. Check Identity Pattern: Same Name + Father Name + Date of Birth
    const candidateBanglaName = params.personalInfo.fullNameBangla.trim().toLowerCase();
    const candidateFatherName = params.personalInfo.fatherName.trim().toLowerCase();
    const candidateDob = params.personalInfo.dateOfBirth;

    if (candidateDob && (candidateBanglaName || candidateFatherName)) {
      const identityQuery = query(
        applicationsCol,
        where('personalInfo.dateOfBirth', '==', candidateDob),
        limit(10)
      );
      const identitySnap = await getDocs(identityQuery);
      identitySnap.forEach((d) => {
        const app = d.data() as AdmissionApplication;
        if (app.applicantId !== params.applicantId) {
          const otherName = (app.personalInfo?.fullNameBangla || '').trim().toLowerCase();
          const otherFather = (app.personalInfo?.fatherName || '').trim().toLowerCase();
          if (otherName === candidateBanglaName && otherFather === candidateFatherName) {
            riskScore += 35;
            riskFactors.push('IDENTITY_MATCH_NAME_FATHER_DOB_WITH_DIFFERENT_ACCOUNT');
            fraudFlags.isDuplicateNameBirthday = true;
            matchedAppNumbers.push(app.applicationNumber);
          }
        }
      });
    }
  } catch (firestoreErr) {
    console.warn('Firestore duplicate check error:', firestoreErr);
  }

  // Determine Risk Level & Action
  riskScore = Math.min(100, Math.max(0, riskScore));
  let riskLevel: SecurityAuditReport['riskLevel'] = 'LOW';
  let suggestedStatus: AdmissionApplicationStatus = 'SUBMITTED';
  let actionTaken: SecurityAuditReport['actionTaken'] = 'PASSED';

  if (riskScore >= 75) {
    riskLevel = 'CRITICAL';
    suggestedStatus = 'UNDER_REVIEW'; // Auto flag for strict admin review
    actionTaken = 'FLAGGED_UNDER_REVIEW';
  } else if (riskScore >= 40) {
    riskLevel = 'HIGH';
    suggestedStatus = 'UNDER_REVIEW';
    actionTaken = 'FLAGGED_UNDER_REVIEW';
  } else if (riskScore >= 20) {
    riskLevel = 'MEDIUM';
    suggestedStatus = 'SUBMITTED';
    actionTaken = 'PASSED';
  }

  const securityAudit: SecurityAuditReport = {
    deviceFingerprint: params.deviceFingerprint,
    userAgent,
    submissionDurationMs: duration,
    riskScore,
    riskLevel,
    riskFactors,
    fraudFlags,
    matchedApplicationNumbers: Array.from(new Set(matchedAppNumbers)),
    actionTaken,
    evaluatedAt: Date.now(),
  };

  // If flagged for review, log the security incident to Firestore
  if (actionTaken === 'FLAGGED_UNDER_REVIEW') {
    await logAdmissionSecurityEvent({
      eventType: 'SUSPICIOUS_IDENTITY_FLAG',
      severity: riskLevel === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      deviceFingerprint: params.deviceFingerprint,
      phone: cleanPhone,
      roll: cleanRoll,
      riskScore,
      riskFactors,
      details: `Application automatically flagged for admin review due to risk score ${riskScore}. Factors: ${riskFactors.join(', ')}`,
    });
  }

  return {
    isBlocked: false,
    suggestedStatus,
    securityAudit,
  };
}
