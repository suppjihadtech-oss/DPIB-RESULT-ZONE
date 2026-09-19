import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import * as OTPAuth from 'otpauth';
import { db } from './firebase';

export interface AdminSession {
  username: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  displayName: string;
  token: string;
  loginAt: number;
}

export interface AdminSecurityConfig {
  username: string;
  twoFactorEnabled: boolean;
  twoFactorType?: 'TOTP' | 'EMAIL';
  twoFactorUpdatedAt?: number;
  updatedAt?: number;
}

const CREDENTIALS_DOC_PATH = 'admin_credentials';
const CREDENTIALS_COLLECTION = 'settings';

// Salt used for local hash security (prevents plaintext storage)
const AUTH_SALT = 'dpib_result_zone_secure_salt_2026';

// Helper to hash strings using browser Crypto Subtle (SHA-256)
export async function hashSecret(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value + AUTH_SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Initial/Default System Credentials (Used only if Firestore doc doesn't exist yet):
// USERNAME: DPIB
// PASSWORD: 198373
const DEFAULT_USERNAME = 'DPIB';
const DEFAULT_PASSWORD_RAW = '198373';

/**
 * Retrieves the stored credentials configuration from Firestore or falls back to defaults.
 */
export async function getStoredCredentials(): Promise<{
  username: string;
  passwordHash: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorType?: 'TOTP' | 'EMAIL';
  twoFactorUpdatedAt?: number;
}> {
  try {
    const docRef = doc(db, CREDENTIALS_COLLECTION, CREDENTIALS_DOC_PATH);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.username && data.passwordHash) {
        return {
          username: String(data.username).trim(),
          passwordHash: String(data.passwordHash),
          twoFactorEnabled: Boolean(data.twoFactorEnabled),
          twoFactorSecret: data.twoFactorSecret ? String(data.twoFactorSecret).trim() : undefined,
          twoFactorType: (data.twoFactorType as 'TOTP' | 'EMAIL') || 'TOTP',
          twoFactorUpdatedAt: data.twoFactorUpdatedAt ? Number(data.twoFactorUpdatedAt) : undefined,
        };
      }
    }
  } catch (error) {
    console.warn('Could not read admin credentials from Firestore, falling back to default:', error);
  }

  // Default fallback
  const defaultHash = await hashSecret(DEFAULT_PASSWORD_RAW);
  return {
    username: DEFAULT_USERNAME,
    passwordHash: defaultHash,
    twoFactorEnabled: false,
    twoFactorSecret: undefined,
    twoFactorType: 'TOTP',
  };
}

/**
 * Retrieves active admin security settings (2FA status, username, type).
 */
export async function getAdminSecuritySettings(): Promise<AdminSecurityConfig> {
  const creds = await getStoredCredentials();
  return {
    username: creds.username,
    twoFactorEnabled: creds.twoFactorEnabled,
    twoFactorType: creds.twoFactorType,
    twoFactorUpdatedAt: creds.twoFactorUpdatedAt,
  };
}

/**
 * Validates dynamic username and password without logging in.
 */
export async function validateAdminCredentials(
  inputUsername: string,
  inputPassword: string
): Promise<{ success: boolean; error?: string; activeUsername?: string }> {
  const cleanUser = inputUsername.trim();
  const cleanPass = inputPassword.trim();

  if (!cleanUser || !cleanPass) {
    return {
      success: false,
      error: 'অনুগ্রহ করে ইউজারনেম এবং পাসওয়ার্ড উভয়ই প্রদান করুন।',
    };
  }

  try {
    const stored = await getStoredCredentials();
    const inputPassHash = await hashSecret(cleanPass);

    const isUsernameMatch = stored.username.toUpperCase() === cleanUser.toUpperCase();
    const isPasswordMatch = stored.passwordHash === inputPassHash;

    if (!isUsernameMatch || !isPasswordMatch) {
      return {
        success: false,
        error: 'প্রদত্ত ইউজারনেম অথবা পাসওয়ার্ড সঠিক নয়।',
      };
    }

    return {
      success: true,
      activeUsername: stored.username,
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'তথ্য যাচাইকরণে সমস্যা হয়েছে।',
    };
  }
}

/**
 * Generates a TOTP enrollment secret and standard otpauth URI for QR code generation.
 */
export async function generateTotpEnrollment(username: string): Promise<{
  secret: string;
  uri: string;
}> {
  const cleanUser = username.trim() || DEFAULT_USERNAME;
  const secret = new OTPAuth.Secret({ size: 20 });
  const base32Secret = secret.base32;

  const totp = new OTPAuth.TOTP({
    issuer: 'DPIB Academic Office',
    label: cleanUser,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secret,
  });

  return {
    secret: base32Secret,
    uri: totp.toString(),
  };
}

/**
 * Verifies a 6-digit TOTP token against a secret and activates 2FA in Firestore.
 */
export async function verifyAndActivateTwoFactor(
  secretBase32: string,
  token: string
): Promise<{ success: boolean; message: string }> {
  const cleanToken = token.replace(/\D/g, '').trim();

  if (cleanToken.length !== 6) {
    return {
      success: false,
      message: 'অনুগ্রহ করে Authenticator অ্যাপ থেকে ৬-সংখ্যার সঠিক কোড লিখুন।',
    };
  }

  try {
    const totp = new OTPAuth.TOTP({
      issuer: 'DPIB Academic Office',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secretBase32),
    });

    const delta = totp.validate({
      token: cleanToken,
      window: 1, // allows +/- 30s clock drift
    });

    if (delta === null) {
      return {
        success: false,
        message: 'নিরাপত্তা কোড সঠিক নয় বা সময় উত্তীর্ণ হয়েছে। Authenticator অ্যাপে প্রদর্শিত বর্তমান কোডটি দিন।',
      };
    }

    // Save active 2FA to Firestore
    const docRef = doc(db, CREDENTIALS_COLLECTION, CREDENTIALS_DOC_PATH);
    await setDoc(
      docRef,
      {
        twoFactorEnabled: true,
        twoFactorSecret: secretBase32,
        twoFactorType: 'TOTP',
        twoFactorUpdatedAt: Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    return {
      success: true,
      message: 'অভিনন্দন! দুই ধাপের নিরাপত্তা (Authenticator App TOTP 2FA) সফলভাবে সক্রিয় করা হয়েছে।',
    };
  } catch (error: any) {
    console.error('Error activating TOTP MFA:', error);
    return {
      success: false,
      message: `নিরাপত্তা সেটিংস সংরক্ষণে সমস্যা: ${error.message || 'ক্লাউড ডেটাবেস ত্রুটি'}`,
    };
  }
}

/**
 * Disables Two-Factor Authentication with dynamic username and password validation.
 */
export async function disableAdminTwoFactor(
  inputUsername: string,
  inputPassword: string
): Promise<{ success: boolean; message: string }> {
  const val = await validateAdminCredentials(inputUsername, inputPassword);
  if (!val.success) {
    return {
      success: false,
      message: val.error || 'ইউজারনেম অথবা পাসওয়ার্ড সঠিক নয়। ২-ধাপ নিরাপত্তা নিষ্ক্রিয় করা যায়নি।',
    };
  }

  try {
    const docRef = doc(db, CREDENTIALS_COLLECTION, CREDENTIALS_DOC_PATH);
    await setDoc(
      docRef,
      {
        twoFactorEnabled: false,
        twoFactorSecret: '',
        twoFactorUpdatedAt: Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    return {
      success: true,
      message: 'দুই ধাপের নিরাপত্তা সফলভাবে বন্ধ করা হয়েছে।',
    };
  } catch (error: any) {
    return {
      success: false,
      message: `নিরাপত্তা সেটিংস সংরক্ষণে সমস্যা: ${error.message}`,
    };
  }
}

/**
 * Verifies admin login using Username and Password.
 * If TOTP 2FA is enabled, requires TOTP verification step.
 */
export async function verifyAdminLogin(
  inputUsername: string,
  inputPassword: string
): Promise<{
  success: boolean;
  error?: string;
  requireTwoFactor?: boolean;
  challengeId?: string;
  username?: string;
  session?: AdminSession;
}> {
  const cleanUser = inputUsername.trim();
  const cleanPass = inputPassword.trim();

  if (!cleanUser || !cleanPass) {
    return {
      success: false,
      error: 'অনুগ্রহ করে ইউজারনেম এবং পাসওয়ার্ড উভয়ই প্রদান করুন।',
    };
  }

  try {
    const stored = await getStoredCredentials();
    const inputPassHash = await hashSecret(cleanPass);

    // Case-insensitive username match, strict password hash match
    const isUsernameMatch = stored.username.toUpperCase() === cleanUser.toUpperCase();
    const isPasswordMatch = stored.passwordHash === inputPassHash;

    if (!isUsernameMatch || !isPasswordMatch) {
      return {
        success: false,
        error: 'ইউজারনেম অথবা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে আবার চেষ্টা করুন।',
      };
    }

    // If Two-Factor Authentication is enabled, require TOTP code
    if (stored.twoFactorEnabled && stored.twoFactorSecret) {
      return {
        success: false,
        requireTwoFactor: true,
        challengeId: `TOTP-${Date.now()}`,
        username: stored.username,
      };
    }

    // Direct Login without 2FA
    const session: AdminSession = {
      username: stored.username,
      role: 'SUPER_ADMIN',
      displayName: 'DPIB Admin Controller',
      token: `DPIB-TOKEN-${Date.now().toString(36).toUpperCase()}`,
      loginAt: Date.now(),
    };

    try {
      sessionStorage.setItem('dpib_admin_session', JSON.stringify(session));
      localStorage.setItem('dpib_admin_active_user', stored.username);
    } catch (e) {
      console.error('Session storage error:', e);
    }

    return {
      success: true,
      session,
    };
  } catch (err: any) {
    console.error('Admin verification error:', err);
    return {
      success: false,
      error: 'লগইন যাচাই করতে সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করুন।',
    };
  }
}

/**
 * Verifies the 6-digit TOTP code from Authenticator App during login.
 */
export async function verifyAdminTwoFactor(
  inputOtp: string
): Promise<{ success: boolean; error?: string; session?: AdminSession }> {
  const cleanCode = inputOtp.replace(/\D/g, '').trim();

  if (cleanCode.length !== 6) {
    return {
      success: false,
      error: 'অনুগ্রহ করে Authenticator অ্যাপ থেকে ৬-সংখ্যার সঠিক নিরাপত্তা কোড প্রদান করুন।',
    };
  }

  try {
    const stored = await getStoredCredentials();

    if (!stored.twoFactorEnabled || !stored.twoFactorSecret) {
      return {
        success: false,
        error: '২-ধাপ নিরাপত্তা কনফিগারেশন পাওয়া যায়নি।',
      };
    }

    const totp = new OTPAuth.TOTP({
      issuer: 'DPIB Academic Office',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(stored.twoFactorSecret),
    });

    const delta = totp.validate({
      token: cleanCode,
      window: 1, // allows +/- 30s clock drift
    });

    if (delta === null) {
      return {
        success: false,
        error: 'নিরাপত্তা কোডটি সঠিক নয় অথবা এর সময়সীমা শেষ হয়েছে। Authenticator অ্যাপের সর্বশেষ কোডটি লিখুন।',
      };
    }

    const session: AdminSession = {
      username: stored.username,
      role: 'SUPER_ADMIN',
      displayName: 'DPIB Admin Controller',
      token: `DPIB-TOTP-TOKEN-${Date.now().toString(36).toUpperCase()}`,
      loginAt: Date.now(),
    };

    try {
      sessionStorage.setItem('dpib_admin_session', JSON.stringify(session));
      localStorage.setItem('dpib_admin_active_user', stored.username);
    } catch (e) {
      console.error('Session storage error:', e);
    }

    return {
      success: true,
      session,
    };
  } catch (err: any) {
    console.error('Two-factor verification error:', err);
    return {
      success: false,
      error: 'নিরাপত্তা যাচাইকরণে ত্রুটি হয়েছে। আবার চেষ্টা করুন।',
    };
  }
}

/**
 * Allows the admin to change their login credentials in Settings/Security.
 * Strictly verifies the current (old) username and password before allowing changes.
 */
export async function changeAdminCredentials(params: {
  currentUsername: string;
  currentPassword: string;
  newUsername: string;
  newPassword: string;
  confirmNewPassword: string;
}): Promise<{ success: boolean; message: string }> {
  const currentU = params.currentUsername.trim();
  const currentP = params.currentPassword.trim();
  const newU = params.newUsername.trim();
  const newP = params.newPassword.trim();
  const confirmP = params.confirmNewPassword.trim();

  if (!currentU || !currentP) {
    return { success: false, message: 'বর্তমান ইউজারনেম এবং বর্তমান পাসওয়ার্ড প্রদান করা আবশ্যক।' };
  }

  if (!newU) {
    return { success: false, message: 'নতুন ইউজারনেম ফাঁকা রাখা যাবে না।' };
  }

  if (!newP) {
    return { success: false, message: 'নতুন পাসওয়ার্ড ফাঁকা রাখা যাবে না।' };
  }

  if (newP.length < 6) {
    return { success: false, message: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };
  }

  if (newP !== confirmP) {
    return { success: false, message: 'নতুন পাসওয়ার্ড এবং পাসওয়ার্ড নিশ্চিতকরণ মিলছে না।' };
  }

  // 1. Verify old credentials
  const stored = await getStoredCredentials();
  const currentPassHash = await hashSecret(currentP);

  const isCurrentUsernameMatch = stored.username.toUpperCase() === currentU.toUpperCase();
  const isCurrentPasswordMatch = stored.passwordHash === currentPassHash;

  if (!isCurrentUsernameMatch || !isCurrentPasswordMatch) {
    return { success: false, message: 'বর্তমান ইউজারনেম অথবা বর্তমান পাসওয়ার্ড সঠিক নয়! পরিবর্তন বাতিল করা হয়েছে।' };
  }

  // 2. Save new credentials to Firestore
  try {
    const newPassHash = await hashSecret(newP);
    const docRef = doc(db, CREDENTIALS_COLLECTION, CREDENTIALS_DOC_PATH);

    await setDoc(
      docRef,
      {
        username: newU,
        passwordHash: newPassHash,
        updatedAt: Date.now(),
        updatedBy: stored.username,
      },
      { merge: true }
    );

    // Update active session username
    try {
      const activeSessionRaw = sessionStorage.getItem('dpib_admin_session');
      if (activeSessionRaw) {
        const parsed = JSON.parse(activeSessionRaw);
        parsed.username = newU;
        sessionStorage.setItem('dpib_admin_session', JSON.stringify(parsed));
      }
      localStorage.setItem('dpib_admin_active_user', newU);
    } catch (e) {
      console.warn(e);
    }

    return {
      success: true,
      message: 'অ্যাডমিন ইউজারনেম ও পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!',
    };
  } catch (error: any) {
    console.error('Failed to update credentials in Firestore:', error);
    return {
      success: false,
      message: `লগইন তথ্য সংরক্ষণে ত্রুটি: ${error.message || 'ক্লাউড ডেটাবেস ত্রুটি'}`,
    };
  }
}

/**
 * Gets the current active admin username for display purposes.
 */
export async function getActiveAdminUsername(): Promise<string> {
  try {
    const stored = await getStoredCredentials();
    return stored.username;
  } catch {
    return DEFAULT_USERNAME;
  }
}

