import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  ApplicantUser,
  AdmissionApplication,
  AdmissionApplicationStatus,
  PersonalInfo,
  EducationalInfo,
  TechnologyChoice,
  AdmissionSettings,
  AdmissionSecurityLog,
} from '../types';
import { toEnglishDigits } from '../utils/bangla';
import {
  checkAndUpdateRateLimit,
  evaluateAdmissionFraudAndDuplicates,
  generateDeviceFingerprint,
  logAdmissionSecurityEvent,
  validateAdmissionInputs,
} from './admissionSecurityService';

export const ADMISSION_COLLECTIONS = {
  APPLICANTS: 'admission_applicants',
  APPLICATIONS: 'admission_applications',
  SETTINGS: 'admission_settings',
  SECURITY_LOGS: 'admission_security_logs',
  RATE_LIMITS: 'admission_rate_limits',
};

const APPLICANT_LOCAL_STORAGE_KEY = 'dpib_applicant_user_session';

/**
 * Fallback simple deterministic hash
 */
function fallbackHash(password: string): string {
  let hash = 0;
  const str = `dpib_salt_${password}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash)}_${str.length}`;
}

/**
 * Robust SHA-256 hashing for applicant passwords with salt
 */
async function sha256Hash(password: string, salt: string = 'dpib_salt_'): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgUint8 = new TextEncoder().encode(`${salt}${password}`);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // fallback
    }
  }
  return fallbackHash(password);
}

/**
 * Standard password hash generator
 */
export async function hashPassword(password: string): Promise<string> {
  return sha256Hash(password.trim());
}

/**
 * Comprehensive password matching verification for applicants
 */
async function verifyApplicantPasswordMatch(
  docData: any,
  inputPassword: string
): Promise<boolean> {
  if (!docData) return false;
  const storedHash = docData.passwordHash || docData.password || docData.rawPassword;

  // If no password was ever set for this applicant document, permit login and auto-set
  if (!storedHash) {
    return true;
  }

  const cleanInput = inputPassword.trim();
  const englishDigitsInput = toEnglishDigits(cleanInput);

  // 1. Direct plain text match
  if (storedHash === cleanInput || storedHash === englishDigitsInput) {
    return true;
  }

  // 2. Salted SHA-256
  const hash1 = await sha256Hash(cleanInput);
  const hash2 = await sha256Hash(englishDigitsInput);
  if (storedHash === hash1 || storedHash === hash2) {
    return true;
  }

  // 3. Unsalted SHA-256
  const unsalted1 = await sha256Hash(cleanInput, '');
  const unsalted2 = await sha256Hash(englishDigitsInput, '');
  if (storedHash === unsalted1 || storedHash === unsalted2) {
    return true;
  }

  // 4. Fallback hash
  const fb1 = fallbackHash(cleanInput);
  const fb2 = fallbackHash(englishDigitsInput);
  if (storedHash === fb1 || storedHash === fb2) {
    return true;
  }

  return false;
}

/**
 * Standardize Bangladesh mobile number to clean 11 digits (e.g. 017xxxxxxxx)
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  let digits = toEnglishDigits(phone.trim().replace(/[^0-9০-৯]/g, ''));
  if (digits.startsWith('00880') && digits.length >= 14) {
    digits = digits.slice(4);
  } else if (digits.startsWith('880') && digits.length >= 13) {
    digits = digits.slice(2);
  } else if (digits.startsWith('88') && digits.length === 12 && digits.startsWith('881')) {
    digits = '0' + digits.slice(2);
  } else if (digits.length === 10 && (digits.startsWith('1') || digits.startsWith('01'))) {
    digits = '0' + digits;
  }
  return digits;
}

/**
 * Convert phone number to internal synthetic auth email
 */
export function phoneToSyntheticEmail(phone: string): string {
  const cleanPhone = normalizePhoneNumber(phone);
  return `${cleanPhone}@dpib-admission.edu.bd`;
}

/**
 * Generates a unique, standardized Application Number (e.g., DPIB-ADM-2026-10482)
 */
export function generateApplicationNumber(): string {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(10000 + Math.random() * 90000); // 5 digits
  return `DPIB-ADM-${year}-${randomDigits}`;
}

/**
 * Register a new admission applicant using Phone Number + Full Name + Password
 */
export async function registerApplicant(params: {
  name: string;
  phone: string;
  password: string;
}): Promise<ApplicantUser> {
  const cleanPhone = normalizePhoneNumber(params.phone);
  const cleanName = params.name.trim();
  const cleanPass = params.password.trim();
  const syntheticEmail = phoneToSyntheticEmail(cleanPhone);

  if (!cleanPhone || cleanPhone.length < 11) {
    throw new Error('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন।');
  }
  if (!cleanPass || cleanPass.length < 6) {
    throw new Error('পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।');
  }

  const pHash = await hashPassword(cleanPass);

  // 1. Check if user already exists in Firestore by phone
  try {
    const directDocRef = doc(db, ADMISSION_COLLECTIONS.APPLICANTS, `applicant_${cleanPhone}`);
    const directSnap = await getDoc(directDocRef);
    if (directSnap.exists()) {
      const data = directSnap.data();
      const isMatch = await verifyApplicantPasswordMatch(data, cleanPass);
      if (isMatch) {
        // Already registered with same credentials -> automatically log in
        const existingUser: ApplicantUser = {
          uid: data.uid || `applicant_${cleanPhone}`,
          phone: data.phone || cleanPhone,
          displayName: data.displayName || cleanName,
          email: data.email || syntheticEmail,
          avatarUrl: data.avatarUrl,
          createdAt: data.createdAt || Date.now(),
          updatedAt: Date.now(),
        };
        localStorage.setItem(APPLICANT_LOCAL_STORAGE_KEY, JSON.stringify(existingUser));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('dpib_applicant_session_update', { detail: existingUser }));
        }
        return existingUser;
      }
      throw new Error('এই মোবাইল নম্বর দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট নিবন্ধিত রয়েছে। অনুগ্রহ করে লগইন করুন।');
    }

    const colRef = collection(db, ADMISSION_COLLECTIONS.APPLICANTS);
    const q = query(colRef, where('phone', '==', cleanPhone));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      throw new Error('এই মোবাইল নম্বর দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট নিবন্ধিত রয়েছে। অনুগ্রহ করে লগইন করুন।');
    }
  } catch (err: any) {
    if (err.message && err.message.includes('ইতিমধ্যে একটি অ্যাকাউন্ট')) {
      throw err;
    }
    console.warn('Pre-check for existing phone in firestore caught:', err);
  }

  // 2. Try Firebase Auth (if enabled and permitted)
  let firebaseUid: string | null = null;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, syntheticEmail, cleanPass);
    const firebaseUser = userCredential.user;
    firebaseUid = firebaseUser.uid;

    await updateProfile(firebaseUser, {
      displayName: cleanName,
    });
  } catch (authErr: any) {
    console.warn('Firebase Auth registration unavailable or rejected, using Firestore-direct applicant account:', authErr?.code || authErr?.message);
    if (authErr?.code === 'auth/email-already-in-use') {
      // Try to log in directly if already created
      try {
        const loginRes = await signInWithEmailAndPassword(auth, syntheticEmail, cleanPass);
        if (loginRes.user) {
          firebaseUid = loginRes.user.uid;
        }
      } catch {
        throw new Error('এই মোবাইল নম্বরটি দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে। অনুগ্রহ করে লগইন করুন।');
      }
    }
  }

  const finalUid = firebaseUid || `applicant_${cleanPhone}`;

  const applicantData: ApplicantUser = {
    uid: finalUid,
    phone: cleanPhone,
    displayName: cleanName,
    email: syntheticEmail,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // 3. Save to Firestore 'admission_applicants' collection (both by finalUid and phone alias)
  try {
    const userDocRef = doc(db, ADMISSION_COLLECTIONS.APPLICANTS, finalUid);
    await setDoc(
      userDocRef,
      {
        ...applicantData,
        passwordHash: pHash,
      },
      { merge: true }
    );

    // Also ensure applicant_${cleanPhone} exists as an alias if finalUid is different
    if (finalUid !== `applicant_${cleanPhone}`) {
      const aliasDocRef = doc(db, ADMISSION_COLLECTIONS.APPLICANTS, `applicant_${cleanPhone}`);
      await setDoc(
        aliasDocRef,
        {
          ...applicantData,
          passwordHash: pHash,
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('Could not save applicant profile to firestore, will use local state:', err);
  }

  // 4. Cache in localStorage & trigger event
  localStorage.setItem(APPLICANT_LOCAL_STORAGE_KEY, JSON.stringify(applicantData));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dpib_applicant_session_update', { detail: applicantData }));
  }

  return applicantData;
}

/**
 * Login an existing admission applicant using Phone Number + Password
 */
export async function loginApplicant(params: {
  phone: string;
  password: string;
}): Promise<ApplicantUser> {
  const cleanPhone = normalizePhoneNumber(params.phone);
  const cleanPass = params.password.trim();
  const syntheticEmail = phoneToSyntheticEmail(cleanPhone);
  const pHash = await hashPassword(cleanPass);

  if (!cleanPhone || cleanPhone.length < 11) {
    throw new Error('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন।');
  }
  if (!cleanPass) {
    throw new Error('অনুগ্রহ করে পাসওয়ার্ড প্রদান করুন।');
  }

  let applicantData: ApplicantUser | null = null;

  // 1. Try Firebase Auth (Primary Authentication Provider)
  try {
    let userCredential: any = null;
    try {
      userCredential = await signInWithEmailAndPassword(auth, syntheticEmail, cleanPass);
    } catch {
      // Try with english digits if different
      const enPass = toEnglishDigits(cleanPass);
      if (enPass !== cleanPass) {
        userCredential = await signInWithEmailAndPassword(auth, syntheticEmail, enPass);
      }
    }

    if (userCredential && userCredential.user) {
      const firebaseUser = userCredential.user;
      const userDocRef = doc(db, ADMISSION_COLLECTIONS.APPLICANTS, firebaseUser.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        applicantData = snap.data() as ApplicantUser;
      } else {
        applicantData = {
          uid: firebaseUser.uid,
          phone: cleanPhone,
          displayName: firebaseUser.displayName || 'ভর্তি আবেদনকারী',
          email: syntheticEmail,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      }

      // Sync latest hash to Firestore
      try {
        await setDoc(userDocRef, { ...applicantData, passwordHash: pHash }, { merge: true });
        const aliasDocRef = doc(db, ADMISSION_COLLECTIONS.APPLICANTS, `applicant_${cleanPhone}`);
        await setDoc(aliasDocRef, { ...applicantData, passwordHash: pHash }, { merge: true });
      } catch (syncErr) {
        console.warn('Syncing applicant record to firestore post auth:', syncErr);
      }
    }
  } catch (authErr: any) {
    console.warn('Firebase Auth login skipped or failed, verifying via Firestore:', authErr?.code || authErr?.message);
  }

  // 2. Fallback: Multi-lookup in Firestore `admission_applicants`
  if (!applicantData) {
    try {
      let foundDocData: any = null;
      let foundDocId: string | null = null;

      // Check 1: Deterministic ID `applicant_${cleanPhone}`
      const directDocRef = doc(db, ADMISSION_COLLECTIONS.APPLICANTS, `applicant_${cleanPhone}`);
      const directSnap = await getDoc(directDocRef);
      if (directSnap.exists()) {
        foundDocData = directSnap.data();
        foundDocId = directSnap.id;
      }

      // Check 2: Direct phone key `cleanPhone`
      if (!foundDocData) {
        const phoneKeyRef = doc(db, ADMISSION_COLLECTIONS.APPLICANTS, cleanPhone);
        const phoneKeySnap = await getDoc(phoneKeyRef);
        if (phoneKeySnap.exists()) {
          foundDocData = phoneKeySnap.data();
          foundDocId = phoneKeySnap.id;
        }
      }

      // Check 3: Query by phone in `admission_applicants`
      if (!foundDocData) {
        const colRef = collection(db, ADMISSION_COLLECTIONS.APPLICANTS);
        const q = query(colRef, where('phone', '==', cleanPhone));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          foundDocData = querySnap.docs[0].data();
          foundDocId = querySnap.docs[0].id;
        }
      }

      // Check 4: Query by raw input phone in `admission_applicants`
      if (!foundDocData && params.phone.trim() !== cleanPhone) {
        const colRef = collection(db, ADMISSION_COLLECTIONS.APPLICANTS);
        const q = query(colRef, where('phone', '==', params.phone.trim()));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          foundDocData = querySnap.docs[0].data();
          foundDocId = querySnap.docs[0].id;
        }
      }

      // Check 5: Query by email in `admission_applicants`
      if (!foundDocData) {
        const colRef = collection(db, ADMISSION_COLLECTIONS.APPLICANTS);
        const q = query(colRef, where('email', '==', syntheticEmail));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          foundDocData = querySnap.docs[0].data();
          foundDocId = querySnap.docs[0].id;
        }
      }

      // If document was found in admission_applicants, verify password
      if (foundDocData) {
        const isMatch = await verifyApplicantPasswordMatch(foundDocData, cleanPass);
        if (isMatch) {
          applicantData = {
            uid: foundDocData.uid || foundDocId || `applicant_${cleanPhone}`,
            phone: foundDocData.phone || cleanPhone,
            displayName: foundDocData.displayName || 'ভর্তি আবেদনকারী',
            email: foundDocData.email || syntheticEmail,
            avatarUrl: foundDocData.avatarUrl,
            createdAt: foundDocData.createdAt || Date.now(),
            updatedAt: Date.now(),
          };

          // Standardize password hash in Firestore for faster future lookups
          try {
            const targetDocRef = doc(db, ADMISSION_COLLECTIONS.APPLICANTS, applicantData.uid);
            await setDoc(targetDocRef, { ...applicantData, passwordHash: pHash }, { merge: true });
            if (applicantData.uid !== `applicant_${cleanPhone}`) {
              const aliasDocRef = doc(db, ADMISSION_COLLECTIONS.APPLICANTS, `applicant_${cleanPhone}`);
              await setDoc(aliasDocRef, { ...applicantData, passwordHash: pHash }, { merge: true });
            }
          } catch (updateErr) {
            console.warn('Could not update applicant password hash on successful login:', updateErr);
          }
        } else {
          throw new Error('মোবাইল নম্বর বা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে পাসওয়ার্ড পরীক্ষা করে পুনরায় চেষ্টা করুন অথবা হেল্পডেস্কে যোগাযোগ করুন।');
        }
      }
    } catch (dbErr: any) {
      if (dbErr.message && dbErr.message.includes('পাসওয়ার্ড')) {
        throw dbErr;
      }
      console.warn('Firestore lookup error during login:', dbErr);
    }
  }

  // 3. Fallback Check: Check if an application exists in `admission_applications` for this phone
  if (!applicantData) {
    try {
      const appsCol = collection(db, ADMISSION_COLLECTIONS.APPLICATIONS);
      const appQuery = query(appsCol, where('applicantPhone', '==', cleanPhone));
      const appSnap = await getDocs(appQuery);

      if (!appSnap.empty) {
        const appDoc = appSnap.docs[0].data() as AdmissionApplication;
        const applicantName =
          appDoc.personalInfo?.fullNameBangla ||
          appDoc.personalInfo?.fullNameEnglish ||
          'ভর্তি আবেদনকারী';

        applicantData = {
          uid: appDoc.applicantId || `applicant_${cleanPhone}`,
          phone: cleanPhone,
          displayName: applicantName,
          email: appDoc.applicantEmail || syntheticEmail,
          avatarUrl: appDoc.personalInfo?.photoUrl,
          createdAt: appDoc.submittedAt || Date.now(),
          updatedAt: Date.now(),
        };

        // Create applicant profile in Firestore with this password
        try {
          const newDocRef = doc(db, ADMISSION_COLLECTIONS.APPLICANTS, applicantData.uid);
          await setDoc(
            newDocRef,
            {
              ...applicantData,
              passwordHash: pHash,
            },
            { merge: true }
          );

          if (applicantData.uid !== `applicant_${cleanPhone}`) {
            const aliasRef = doc(db, ADMISSION_COLLECTIONS.APPLICANTS, `applicant_${cleanPhone}`);
            await setDoc(aliasRef, { ...applicantData, passwordHash: pHash }, { merge: true });
          }
        } catch (appCreateErr) {
          console.warn('Auto-creating applicant doc from application error:', appCreateErr);
        }
      }
    } catch (appErr) {
      console.warn('Application lookup during login caught:', appErr);
    }
  }

  // 4. Fallback: Check local storage cached session if phone matches
  if (!applicantData) {
    const cached = getCachedApplicantUser();
    if (cached && (cached.phone === cleanPhone || normalizePhoneNumber(cached.phone) === cleanPhone)) {
      applicantData = cached;
    }
  }

  // 5. If still not found anywhere, guide user to register
  if (!applicantData) {
    throw new Error('এই মোবাইল নম্বর দিয়ে কোনো আবেদনকারী অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে প্রথমে "নতুন নিবন্ধন" করুন।');
  }

  localStorage.setItem(APPLICANT_LOCAL_STORAGE_KEY, JSON.stringify(applicantData));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dpib_applicant_session_update', { detail: applicantData }));
  }

  return applicantData;
}

/**
 * Reset applicant password (internal / admin supported)
 */
export async function resetApplicantPassword(phone: string): Promise<void> {
  const syntheticEmail = phoneToSyntheticEmail(phone);
  try {
    await sendPasswordResetEmail(auth, syntheticEmail);
  } catch (err) {
    console.warn('Send password reset email via Firebase Auth failed:', err);
  }
}

/**
 * Logout applicant
 */
export async function logoutApplicant(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Sign out error:', err);
  }
  localStorage.removeItem(APPLICANT_LOCAL_STORAGE_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dpib_applicant_logout'));
  }
}

/**
 * Get cached applicant user from localStorage
 */
export function getCachedApplicantUser(): ApplicantUser | null {
  try {
    const raw = localStorage.getItem(APPLICANT_LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return null;
}

export const getCurrentApplicantSession = getCachedApplicantUser;

/**
 * Listen to Applicant Auth state change
 */
export function onApplicantAuthStateChanged(callback: (user: ApplicantUser | null) => void): () => void {
  // Initial check from localStorage
  const initialUser = getCachedApplicantUser();
  if (initialUser) {
    callback(initialUser);
  }

  const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const cached = getCachedApplicantUser();
      if (cached && cached.uid === firebaseUser.uid) {
        callback(cached);
        return;
      }
      try {
        const userDocRef = doc(db, ADMISSION_COLLECTIONS.APPLICANTS, firebaseUser.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data() as ApplicantUser;
          localStorage.setItem(APPLICANT_LOCAL_STORAGE_KEY, JSON.stringify(data));
          callback(data);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch applicant doc:', err);
      }
      const basic: ApplicantUser = {
        uid: firebaseUser.uid,
        phone: firebaseUser.email ? firebaseUser.email.split('@')[0] : '',
        displayName: firebaseUser.displayName || 'ভর্তি আবেদনকারী',
        email: firebaseUser.email || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      localStorage.setItem(APPLICANT_LOCAL_STORAGE_KEY, JSON.stringify(basic));
      callback(basic);
    } else {
      // If Firebase Auth has no user, keep local storage session if user is logged in via phone
      const currentCached = getCachedApplicantUser();
      if (currentCached) {
        callback(currentCached);
      } else {
        callback(null);
      }
    }
  });

  const handleCustomSessionUpdate = (e: any) => {
    if (e.detail) {
      callback(e.detail);
    }
  };

  const handleCustomLogout = () => {
    callback(null);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('dpib_applicant_session_update', handleCustomSessionUpdate);
    window.addEventListener('dpib_applicant_logout', handleCustomLogout);
  }

  return () => {
    unsubscribeAuth();
    if (typeof window !== 'undefined') {
      window.removeEventListener('dpib_applicant_session_update', handleCustomSessionUpdate);
      window.removeEventListener('dpib_applicant_logout', handleCustomLogout);
    }
  };
}

/**
 * Update applicant profile
 */
export async function updateApplicantProfile(
  uid: string,
  updates: Partial<ApplicantUser>
): Promise<ApplicantUser> {
  const cleanUpdates: Partial<ApplicantUser> & { updatedAt: number } = {
    ...updates,
    updatedAt: Date.now(),
  };

  // If Firebase Auth currentUser is active and displayName is being updated
  if (auth.currentUser && updates.displayName) {
    try {
      await updateProfile(auth.currentUser, {
        displayName: updates.displayName,
      });
    } catch (authErr) {
      console.warn('Could not update Firebase Auth displayName:', authErr);
    }
  }

  try {
    const userDocRef = doc(db, ADMISSION_COLLECTIONS.APPLICANTS, uid);
    await setDoc(userDocRef, cleanUpdates, { merge: true });

    // Also sync alias document if phone is available
    const targetPhone = updates.phone;
    if (targetPhone) {
      const cleanPhone = normalizePhoneNumber(targetPhone);
      if (cleanPhone) {
        const aliasDocRef = doc(db, ADMISSION_COLLECTIONS.APPLICANTS, `applicant_${cleanPhone}`);
        await setDoc(aliasDocRef, cleanUpdates, { merge: true });
      }
    }
  } catch (err) {
    console.error('Error updating applicant profile in Firestore:', err);
  }

  const current = getCachedApplicantUser();
  const merged: ApplicantUser = current && current.uid === uid
    ? { ...current, ...cleanUpdates }
    : {
        uid,
        displayName: updates.displayName || 'ভর্তি আবেদনকারী',
        phone: updates.phone || '',
        createdAt: Date.now(),
        ...cleanUpdates,
      };

  localStorage.setItem(APPLICANT_LOCAL_STORAGE_KEY, JSON.stringify(merged));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('dpib_applicant_session_update', { detail: merged })
    );
  }

  return merged;
}

/**
 * Create a new admission application submission
 * Protected by Firestore-synced rate limiting, duplicate roll/reg check, and anti-fraud evaluation
 */
export async function createAdmissionApplication(params: {
  applicantId: string;
  applicantPhone: string;
  applicantEmail?: string;
  personalInfo: PersonalInfo;
  educationalInfo: EducationalInfo;
  technologyChoice: TechnologyChoice;
  deviceFingerprint?: string;
  submissionDurationMs?: number;
}): Promise<AdmissionApplication> {
  const now = Date.now();
  const fingerprint = params.deviceFingerprint || generateDeviceFingerprint();

  // 1. Enforce server/database deadline and status validation
  try {
    const settings = await getAdmissionSettings();
    const deadlineInfo = getAdmissionDeadlineStatus(settings);

    if (deadlineInfo.isExpired) {
      throw new Error('ভর্তির নির্ধারিত সময়সীমা শেষ হয়েছে। নতুন আবেদন গ্রহণ সাময়িকভাবে বন্ধ আছে।');
    }
    if (deadlineInfo.status === 'NOT_STARTED') {
      throw new Error(`ভর্তি আবেদন কার্যক্রম এখনো শুরু হয়নি। নির্ধারিত সময় (${deadlineInfo.formattedStartDate}) থেকে আবেদন গ্রহণ শুরু হবে।`);
    }
    if (!deadlineInfo.isOpen) {
      throw new Error('ভর্তি কার্যক্রম বর্তমানে কর্তৃপক্ষ কর্তৃক সাময়িকভাবে স্থগিত রাখা হয়েছে।');
    }
  } catch (validationErr: any) {
    console.error('Admission deadline validation error:', validationErr);
    throw validationErr;
  }

  // 2. Strict Input & Field Validation
  const inputValidation = validateAdmissionInputs({
    personalInfo: params.personalInfo,
    educationalInfo: params.educationalInfo,
    applicantPhone: params.applicantPhone,
    applicantEmail: params.applicantEmail,
  });
  if (!inputValidation.isValid) {
    throw new Error(inputValidation.error || 'আবেদনপত্রের তথ্যে ত্রুটি পাওয়া গেছে। অনুগ্রহ করে তথ্য পুনরায় যাচাই করুন।');
  }

  // 3. Firestore-Synced Rate Limiting (Protects against bot spam and repeated attacks)
  const rateLimitResult = await checkAndUpdateRateLimit({
    deviceFingerprint: fingerprint,
    phone: params.applicantPhone,
  });
  if (!rateLimitResult.isAllowed) {
    throw new Error(rateLimitResult.reason || 'অতিরিক্ত আবেদন চেষ্টার কারণে অনুরোধ সাময়িকভাবে সীমাবদ্ধ করা হয়েছে।');
  }

  // 4. Firestore Duplicate & Fraud Detection Evaluation
  const fraudEvaluation = await evaluateAdmissionFraudAndDuplicates({
    applicantId: params.applicantId,
    applicantPhone: params.applicantPhone,
    applicantEmail: params.applicantEmail,
    personalInfo: params.personalInfo,
    educationalInfo: params.educationalInfo,
    technologyChoice: params.technologyChoice,
    deviceFingerprint: fingerprint,
    submissionDurationMs: params.submissionDurationMs,
  });

  // If hard blocked (e.g. roll already approved/enrolled or duplicate active application)
  if (fraudEvaluation.isBlocked) {
    throw new Error(fraudEvaluation.blockReason || 'ডুপ্লিকেট বা পরিচয় সংক্রান্ত জটিলতার কারণে আবেদনটি গ্রহণ করা সম্ভব হয়নি।');
  }

  const applicationNumber = generateApplicationNumber();
  const initialStatus: AdmissionApplicationStatus = fraudEvaluation.suggestedStatus;

  // Custom instruction based on security evaluation
  let initialInstructions = 'আপনার আবেদনটি গৃহীত হয়েছে। মূল কাগজপত্র ও মেধা তালিকা যাচাইয়ের জন্য অপেক্ষা করুন।';
  if (initialStatus === 'UNDER_REVIEW') {
    initialInstructions = 'আপনার আবেদনটি স্বয়ংক্রিয়ভাবে নিরাপত্তা পর্যালোচনা ও যাচাইকরণ বিভাগে স্থানান্তরিত হয়েছে। তথ্য ও কাগজপত্রের সত্যতা যাচাই সাপেক্ষে ফলাফল জানানো হবে।';
  }

  const application: AdmissionApplication = {
    id: `app_${now}_${Math.random().toString(36).substring(2, 8)}`,
    applicationNumber,
    applicantId: params.applicantId,
    applicantPhone: params.applicantPhone,
    applicantEmail: params.applicantEmail,
    personalInfo: params.personalInfo,
    educationalInfo: params.educationalInfo,
    technologyChoice: params.technologyChoice,
    status: initialStatus,
    statusHistory: [
      {
        status: initialStatus,
        updatedAt: now,
        note: initialStatus === 'UNDER_REVIEW'
          ? `ভর্তি আবেদন জমা দেওয়া হয়েছে এবং প্রাথমিক নিরাপত্তা পর্যালোচনার জন্য চিহ্নিত হয়েছে (রিস্ক স্কোর: ${fraudEvaluation.securityAudit.riskScore})।`
          : 'ভর্তি আবেদন সফলভাবে দাখিল করা হয়েছে।',
      },
    ],
    securityAudit: fraudEvaluation.securityAudit,
    adminInstructions: initialInstructions,
    submittedAt: now,
    updatedAt: now,
  };

  try {
    const appDocRef = doc(db, ADMISSION_COLLECTIONS.APPLICATIONS, application.id);
    await setDoc(appDocRef, application);

    // Log successful submission with security audit metadata to Firestore
    await logAdmissionSecurityEvent({
      eventType: 'APPLICATION_SUBMISSION',
      severity: fraudEvaluation.securityAudit.riskLevel === 'LOW' ? 'INFO' : 'WARNING',
      deviceFingerprint: fingerprint,
      phone: params.applicantPhone,
      roll: params.educationalInfo.rollNumber,
      applicationId: application.id,
      applicationNumber: application.applicationNumber,
      riskScore: fraudEvaluation.securityAudit.riskScore,
      riskFactors: fraudEvaluation.securityAudit.riskFactors,
      details: `Application submitted successfully. Status: ${initialStatus}. Risk Score: ${fraudEvaluation.securityAudit.riskScore}.`,
    });
  } catch (err: any) {
    console.error('Error creating admission application in Firestore:', err);
    throw new Error('আবেদনপত্র ডাটাবেসে সংরক্ষণ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
  }

  return application;
}

/**
 * Admin: Clear security flag and grant clearance on an application
 */
export async function clearApplicationSecurityFlag(
  applicationId: string,
  adminIdentifier: string,
  note?: string
): Promise<void> {
  const now = Date.now();
  try {
    const appDocRef = doc(db, ADMISSION_COLLECTIONS.APPLICATIONS, applicationId);
    const snap = await getDoc(appDocRef);
    if (!snap.exists()) {
      throw new Error('আবেদনটি পাওয়া যায়নি।');
    }

    const currentApp = snap.data() as AdmissionApplication;
    const updatedAudit = currentApp.securityAudit ? {
      ...currentApp.securityAudit,
      riskScore: 0,
      riskLevel: 'LOW' as const,
      actionTaken: 'PASSED' as const,
      riskFactors: [],
      evaluatedAt: now,
    } : undefined;

    const newHistory = [
      ...(currentApp.statusHistory || []),
      {
        status: currentApp.status,
        updatedAt: now,
        updatedBy: adminIdentifier,
        note: note || 'কর্তৃপক্ষ কর্তৃক নিরাপত্তা ও পরিচয় যাচাই সম্পন্নপূর্বক সিকিউরিটি ক্লিয়ারেন্স প্রদান করা হয়েছে।',
      },
    ];

    await updateDoc(appDocRef, {
      securityAudit: updatedAudit,
      statusHistory: newHistory,
      adminInstructions: 'আপনার আবেদনের তথ্য ও কাগজপত্র কর্তৃপক্ষ কর্তৃক চূড়ান্তভাবে যাচাই ও সত্য প্রমাণিত হয়েছে।',
      updatedAt: now,
    });

    await logAdmissionSecurityEvent({
      eventType: 'SECURITY_CLEARED',
      severity: 'INFO',
      deviceFingerprint: currentApp.securityAudit?.deviceFingerprint || 'admin_override',
      phone: currentApp.applicantPhone,
      roll: currentApp.educationalInfo?.rollNumber,
      applicationId: currentApp.id,
      applicationNumber: currentApp.applicationNumber,
      riskScore: 0,
      riskFactors: [],
      details: `Security flag cleared by admin (${adminIdentifier}). Note: ${note || 'Verified'}`,
    });
  } catch (err: any) {
    console.error('Error clearing application security flag:', err);
    throw new Error('সিকিউরিটি ক্লিয়ারেন্স ডাটাবেসে আপডেট করতে ব্যর্থ হয়েছে।');
  }
}

/**
 * Admin: Fetch recent security audit logs from Firestore
 */
export async function getAdmissionSecurityLogs(): Promise<AdmissionSecurityLog[]> {
  try {
    const colRef = collection(db, ADMISSION_COLLECTIONS.SECURITY_LOGS);
    const snap = await getDocs(colRef);
    const list: AdmissionSecurityLog[] = [];
    snap.forEach((d) => list.push(d.data() as AdmissionSecurityLog));
    return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  } catch (err) {
    console.error('Error fetching admission security logs:', err);
    return [];
  }
}

/**
 * Fetch all applications submitted by a specific applicant
 */
export async function getApplicantApplications(applicantId: string): Promise<AdmissionApplication[]> {
  try {
    const colRef = collection(db, ADMISSION_COLLECTIONS.APPLICATIONS);
    const q = query(colRef, where('applicantId', '==', applicantId));
    const snap = await getDocs(q);
    const list: AdmissionApplication[] = [];
    snap.forEach((d) => {
      list.push(d.data() as AdmissionApplication);
    });
    return list.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
  } catch (err) {
    console.error('Error fetching applicant applications:', err);
    return [];
  }
}

/**
 * Realtime subscription to an applicant's applications
 */
export function subscribeApplicantApplications(
  applicantIdOrPhone: string,
  onUpdate: (apps: AdmissionApplication[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  try {
    const colRef = collection(db, ADMISSION_COLLECTIONS.APPLICATIONS);
    // Listen to all applications and filter by applicantId or phone in memory for instant reactivity
    return onSnapshot(
      colRef,
      (snap) => {
        const list: AdmissionApplication[] = [];
        const cleanTarget = normalizePhoneNumber(applicantIdOrPhone);
        snap.forEach((d) => {
          const data = d.data() as AdmissionApplication;
          const matchId = data.applicantId === applicantIdOrPhone || data.applicantId === `applicant_${cleanTarget}`;
          const matchPhone = cleanTarget && normalizePhoneNumber(data.applicantPhone || '') === cleanTarget;
          if (matchId || matchPhone) {
            list.push(data);
          }
        });
        list.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
        onUpdate(list);
      },
      (err) => {
        console.error('Realtime subscription error for applicant applications:', err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.error('Failed to attach realtime subscription:', err);
    return () => {};
  }
}

/**
 * Admin: Fetch all admission applications across the institute
 */
export async function getAllAdmissionApplications(): Promise<AdmissionApplication[]> {
  try {
    const colRef = collection(db, ADMISSION_COLLECTIONS.APPLICATIONS);
    const snap = await getDocs(colRef);
    const list: AdmissionApplication[] = [];
    snap.forEach((d) => {
      list.push(d.data() as AdmissionApplication);
    });
    return list.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
  } catch (err) {
    console.error('Error fetching all admission applications:', err);
    return [];
  }
}

/**
 * Admin: Realtime subscription to all admission applications
 */
export function subscribeAllAdmissionApplications(
  onUpdate: (apps: AdmissionApplication[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  try {
    const colRef = collection(db, ADMISSION_COLLECTIONS.APPLICATIONS);
    return onSnapshot(
      colRef,
      (snap) => {
        const list: AdmissionApplication[] = [];
        snap.forEach((d) => {
          list.push(d.data() as AdmissionApplication);
        });
        list.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
        onUpdate(list);
      },
      (err) => {
        console.error('Realtime subscription error for all admission applications:', err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.error('Failed to attach realtime subscription:', err);
    return () => {};
  }
}

/**
 * Admin: Update application status, instructions, or notes
 */
export async function updateAdmissionApplicationStatus(
  applicationId: string,
  newStatus: AdmissionApplicationStatus,
  options?: {
    adminInstructions?: string;
    adminFeedback?: string;
    assignedRoll?: string;
    assignedSession?: string;
    assignedShift?: '1st' | '2nd';
    assignedDeptId?: string;
    assignedDeptName?: string;
    note?: string;
    updatedBy?: string;
  }
): Promise<void> {
  const docRef = doc(db, ADMISSION_COLLECTIONS.APPLICATIONS, applicationId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    throw new Error('Application document not found');
  }

  const existing = snap.data() as AdmissionApplication;
  const now = Date.now();

  const newHistoryItem = {
    status: newStatus,
    updatedAt: now,
    updatedBy: options?.updatedBy || 'এডমিশন কন্ট্রোলার',
    note: options?.note || `আবেদনের অবস্থা "${getStatusBanglaLabel(newStatus)}" হিসেবে হালনাগাদ করা হয়েছে।`,
  };

  const updatedHistory = [...(existing.statusHistory || []), newHistoryItem];

  const payload: Partial<AdmissionApplication> = {
    status: newStatus,
    statusHistory: updatedHistory,
    updatedAt: now,
  };

  if (options?.adminInstructions !== undefined) {
    payload.adminInstructions = options.adminInstructions;
  }
  if (options?.adminFeedback !== undefined) {
    payload.adminFeedback = options.adminFeedback;
  }
  if (options?.assignedRoll !== undefined) {
    payload.assignedRoll = options.assignedRoll;
  }
  if (options?.assignedSession !== undefined) {
    payload.assignedSession = options.assignedSession;
  }
  if (options?.assignedShift !== undefined) {
    payload.assignedShift = options.assignedShift;
  }
  if (options?.assignedDeptId !== undefined) {
    payload.assignedDeptId = options.assignedDeptId;
  }
  if (options?.assignedDeptName !== undefined) {
    payload.assignedDeptName = options.assignedDeptName;
  }

  await updateDoc(docRef, payload);
}

/**
 * Helper to get user-friendly Bangla status text
 */
export function getStatusBanglaLabel(status: AdmissionApplicationStatus): string {
  switch (status) {
    case 'SUBMITTED':
      return 'আবেদন দাখিলকৃত';
    case 'UNDER_REVIEW':
      return 'যাচাইাধীন';
    case 'APPROVED':
      return 'অনুমোদিত';
    case 'REJECTED':
      return 'বাতিল';
    case 'ENROLLED':
      return 'ভর্তি সম্পন্ন';
    default:
      return status;
  }
}

/**
 * Helper to get Tailwind color badge classes for status
 */
export function getStatusBadgeClasses(status: AdmissionApplicationStatus): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (status) {
    case 'SUBMITTED':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-600',
      };
    case 'UNDER_REVIEW':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'APPROVED':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-600',
      };
    case 'REJECTED':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        dot: 'bg-rose-600',
      };
    case 'ENROLLED':
      return {
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
        dot: 'bg-indigo-600',
      };
    default:
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-500',
      };
  }
}

/* ================= ADMISSION SETTINGS & CONTACT HELPLINE ================= */

/**
 * Parses single or multiple phone numbers separated by comma, slash, semicolon, or newline
 */
export function parsePhoneNumbers(phoneStr?: string): string[] {
  if (!phoneStr) return [];
  return phoneStr
    .split(/[,/;\n|]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export const DEFAULT_ADMISSION_SETTINGS: AdmissionSettings = {
  contactPhone: '01712-345678, 01987-654321',
  helplineTitle: 'ভর্তি সংক্রান্ত যোগাযোগ',
  helplineHours: 'সকাল ০৯:০০ টা হতে বিকাল ০৫:০০ টা',
  emergencyPhone: '01987654321',
  address: 'বীরশ্রেষ্ঠ মোস্তফা কামাল বাস স্ট্যান্ড সংলগ্ন, ভোলা সদর, ভোলা',
  admissionStartDate: '2026-06-01T09:00',
  admissionEndDate: '2026-12-31T23:59',
  admissionStartTimestamp: new Date('2026-06-01T09:00:00').getTime(),
  admissionEndTimestamp: new Date('2026-12-31T23:59:59').getTime(),
  isAdmissionOpen: true,
  deadlineNotice: '',
};

export interface DeadlineStatusInfo {
  status: 'ACTIVE' | 'NOT_STARTED' | 'EXPIRED';
  isOpen: boolean;
  isExpired: boolean;
  timeRemainingMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  endTimestamp?: number;
  startTimestamp?: number;
  formattedEndDate: string;
  formattedStartDate: string;
  notice?: string;
}

/**
 * Calculates current admission deadline status & countdown parts
 */
export function getAdmissionDeadlineStatus(
  settings?: AdmissionSettings | null
): DeadlineStatusInfo {
  const currentSettings = settings || DEFAULT_ADMISSION_SETTINGS;
  const now = Date.now();

  const startTimestamp =
    currentSettings.admissionStartTimestamp ||
    (currentSettings.admissionStartDate
      ? new Date(currentSettings.admissionStartDate).getTime()
      : undefined);

  const endTimestamp =
    currentSettings.admissionEndTimestamp ||
    (currentSettings.admissionEndDate
      ? new Date(currentSettings.admissionEndDate).getTime()
      : undefined);

  const isExplicitlyClosed = currentSettings.isAdmissionOpen === false;

  let status: 'ACTIVE' | 'NOT_STARTED' | 'EXPIRED' = 'ACTIVE';
  let isExpired = false;
  let isOpen = true;
  let targetTimestamp = endTimestamp || now;

  if (isExplicitlyClosed) {
    status = 'EXPIRED';
    isExpired = true;
    isOpen = false;
  } else if (startTimestamp && now < startTimestamp) {
    status = 'NOT_STARTED';
    isOpen = false;
    isExpired = false;
    targetTimestamp = startTimestamp;
  } else if (endTimestamp && now > endTimestamp) {
    status = 'EXPIRED';
    isExpired = true;
    isOpen = false;
    targetTimestamp = endTimestamp;
  }

  const diffMs = Math.max(0, targetTimestamp - now);
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formattedEndDate = endTimestamp
    ? new Date(endTimestamp).toLocaleString('bn-BD', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '';

  const formattedStartDate = startTimestamp
    ? new Date(startTimestamp).toLocaleString('bn-BD', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '';

  return {
    status,
    isOpen,
    isExpired,
    timeRemainingMs: diffMs,
    days,
    hours,
    minutes,
    seconds,
    startTimestamp,
    endTimestamp,
    formattedStartDate,
    formattedEndDate,
    notice: currentSettings.deadlineNotice,
  };
}

/**
 * Fetch current admission settings from Firestore
 */
export async function getAdmissionSettings(): Promise<AdmissionSettings> {
  try {
    const docRef = doc(db, ADMISSION_COLLECTIONS.SETTINGS, 'config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as AdmissionSettings;
      return {
        ...DEFAULT_ADMISSION_SETTINGS,
        ...data,
        contactPhone: data.contactPhone || DEFAULT_ADMISSION_SETTINGS.contactPhone,
        helplineTitle: data.helplineTitle || DEFAULT_ADMISSION_SETTINGS.helplineTitle,
        helplineHours: data.helplineHours || DEFAULT_ADMISSION_SETTINGS.helplineHours,
      };
    }
  } catch (err) {
    console.warn('Using default admission settings:', err);
  }
  return DEFAULT_ADMISSION_SETTINGS;
}

/**
 * Real-time subscription to admission settings
 */
export function subscribeAdmissionSettings(
  callback: (settings: AdmissionSettings) => void
): Unsubscribe {
  const docRef = doc(db, ADMISSION_COLLECTIONS.SETTINGS, 'config');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as AdmissionSettings;
        callback({
          ...DEFAULT_ADMISSION_SETTINGS,
          ...data,
          contactPhone: data.contactPhone || DEFAULT_ADMISSION_SETTINGS.contactPhone,
          helplineTitle: data.helplineTitle || DEFAULT_ADMISSION_SETTINGS.helplineTitle,
          helplineHours: data.helplineHours || DEFAULT_ADMISSION_SETTINGS.helplineHours,
        });
      } else {
        callback(DEFAULT_ADMISSION_SETTINGS);
      }
    },
    (err) => {
      console.warn('Error subscribing to admission settings:', err);
      callback(DEFAULT_ADMISSION_SETTINGS);
    }
  );
}

/**
 * Update admission settings (Admin only)
 */
export async function updateAdmissionSettings(
  settings: Partial<AdmissionSettings>
): Promise<void> {
  const docRef = doc(db, ADMISSION_COLLECTIONS.SETTINGS, 'config');
  const payload: Record<string, any> = {
    ...settings,
    updatedAt: Date.now(),
  };

  if (settings.contactPhone !== undefined) {
    payload.contactPhone = settings.contactPhone.trim();
  }
  if (settings.contactEmail !== undefined) {
    payload.contactEmail = settings.contactEmail.trim();
  }
  if (settings.helplineTitle !== undefined) {
    payload.helplineTitle = settings.helplineTitle.trim();
  }
  if (settings.helplineHours !== undefined) {
    payload.helplineHours = settings.helplineHours.trim();
  }
  if (settings.emergencyPhone !== undefined) {
    payload.emergencyPhone = settings.emergencyPhone.trim();
  }
  if (settings.address !== undefined) {
    payload.address = settings.address.trim();
  }

  await setDoc(docRef, payload, { merge: true });
}

