import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  DonationConfig,
  DonationPaymentMethod,
  DonationPurpose,
  DonationRecord,
  DonationSmsLog,
  DonationStatus,
  TransactionRecord,
} from '../types';
import { toBanglaDigits, toEnglishDigits } from '../utils/bangla';

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
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: Array<{
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }>;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(errInfo.error);
}

const DONATIONS_COLLECTION = 'donations';
const DONATION_SMS_LOGS_COLLECTION = 'donation_sms_logs';
const TRANSACTIONS_COLLECTION = 'transactions';
const LOCAL_MY_DONATION_IDS_KEY = 'dpib_my_donation_ids';

export const DEFAULT_DONATION_CONFIG: DonationConfig = {
  enabled: true,
  bkashNumber: '01700000000',
  bkashAccountType: 'PERSONAL',
  nagadNumber: '01800000000',
  nagadAccountType: 'PERSONAL',
  smsWebhookSecret: '',
  donationTitle: 'DPIB RESULT ZONE ও মানবিক কল্যাণে সহায়তা করুন',
  donationDescription:
    'আপনার সামান্য অনুদান (১০ টাকা থেকে শুরু করে যেকোনো পরিমাণ) এই ডিজিটাল ফলাফল প্ল্যাটফর্মের উন্নয়ন, সার্ভার রক্ষণাবেক্ষণ এবং অসহায় ও মেধাবী শিক্ষার্থীদের কল্যাণমূলক কাজে ব্যয় করা হবে।',
};

export const DONATION_PURPOSE_OPTIONS: Array<{
  id: DonationPurpose;
  label: string;
  subtitle: string;
}> = [
  {
    id: 'APP_DEVELOPMENT',
    label: 'অ্যাপ উন্নয়ন ও সার্ভার ব্যয়',
    subtitle: 'প্ল্যাটফর্মের গতি, নতুন ফিচার ও ক্লাউড হোস্টিং সচল রাখতে',
  },
  {
    id: 'STUDENT_WELFARE',
    label: 'অসহায় ও মেধাবী শিক্ষার্থী সহায়তা',
    subtitle: 'দরিদ্র শিক্ষার্থীদের বই, ফরম ফিলাপ ও শিক্ষা উপকরণে',
  },
  {
    id: 'CHARITY_FUND',
    label: 'মানবিক ও সামাজিক কল্যাণ তহবিল',
    subtitle: 'জরুরি চিকিৎসা, ত্রাণ ও যেকোনো জনকল্যাণমূলক ভালো কাজে',
  },
];

export const QUICK_DONATION_AMOUNTS = [10, 20, 50, 100, 200, 500];

export function normalizeBdPhone(rawPhone: string): string {
  const english = toEnglishDigits(rawPhone || '').replace(/[\s\-()]/g, '');
  if (english.startsWith('+880')) {
    return '0' + english.slice(4);
  }
  if (english.startsWith('880') && english.length >= 13) {
    return '0' + english.slice(3);
  }
  return english;
}

export function isValidBdPhone(rawPhone: string): boolean {
  const normalized = normalizeBdPhone(rawPhone);
  return /^01[3-9]\d{8}$/.test(normalized);
}

export function stripInvisibleUnicode(input: string): string {
  return String(input || '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ');
}

export function normalizeTrxId(rawTrxId: string): string {
  return toEnglishDigits(stripInvisibleUnicode(rawTrxId || ''))
    .trim()
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase();
}

export function isUnexpandedSmsPlaceholder(rawText?: string): boolean {
  const cleaned = stripInvisibleUnicode(rawText || '').trim();
  if (!cleaned) return true;
  if (
    /^(?:\$\{?\s*[a-z0-9_.\s-]+\s*\}?|\{\s*[a-z0-9_.\s-]+\s*\}|%\s*[a-z0-9_.\s-]+\s*%?)$/i.test(
      cleaned
    )
  ) {
    return true;
  }
  const lower = cleaned.toLowerCase();
  const knownTemplates = [
    '${message}',
    '${msg}',
    '${text}',
    '${body}',
    '{message}',
    '{msg}',
    '{text}',
    '{body}',
    '%sms_body%',
    '%msg%',
    '%message%',
    '%m',
    '%text%',
  ];
  return knownTemplates.includes(lower);
}

export function phonesCompatible(smsPhone?: string, userPhone?: string): boolean {
  if (!smsPhone || !userPhone) return false;
  const cleanUser = normalizeBdPhone(stripInvisibleUnicode(userPhone));
  const rawSms = toEnglishDigits(stripInvisibleUnicode(smsPhone))
    .replace(/[\s\-()]/g, '')
    .replace(/^\+?880/, '0');

  if (!cleanUser || !rawSms) return false;
  if (rawSms === cleanUser) return true;

  // Support masked bKash/Nagad phone formats such as 013****5230 or 01712***678
  if (rawSms.includes('*') && cleanUser.length === 11) {
    const escaped = rawSms
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*+/g, '\\d*');
    try {
      const rx = new RegExp(`^${escaped}$`);
      if (rx.test(cleanUser)) return true;
    } catch {
      // Ignore regex errors
    }
    const prefix = rawSms.split('*')[0];
    const parts = rawSms.split('*');
    const suffix = parts[parts.length - 1] || '';
    if (
      prefix.length >= 3 &&
      cleanUser.startsWith(prefix) &&
      (!suffix || cleanUser.endsWith(suffix))
    ) {
      return true;
    }
  }

  return false;
}

export function generateDonationReference(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `DPIB-${num}`;
}

export function getPurposeLabel(purpose?: string): string {
  const found = DONATION_PURPOSE_OPTIONS.find((p) => p.id === purpose);
  return found ? found.label : 'অ্যাপ উন্নয়ন ও কল্যাণমূলক কাজ';
}

export function generateTransactionNumber(referenceCode: string, timestamp: number): string {
  const refSuffix =
    String(referenceCode || '0000')
      .replace(/[^A-Z0-9]/gi, '')
      .slice(-4) || '0000';
  const dateStamp = new Date(timestamp).toISOString().slice(2, 10).replace(/-/g, '');
  return `TXN-${dateStamp}-${refSuffix}`;
}

export function maskPhoneNumberBangla(phone: string): string {
  const clean = normalizeBdPhone(phone);
  if (clean.length >= 11) {
    return toBanglaDigits(`${clean.slice(0, 3)}****${clean.slice(-4)}`);
  }
  return toBanglaDigits(clean);
}

export function formatTransactionDateTimeBangla(timestamp: number): string {
  if (!timestamp) return '';
  try {
    const formatted = new Intl.DateTimeFormat('bn-BD', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
    return toBanglaDigits(formatted);
  } catch {
    return toBanglaDigits(new Date(timestamp).toLocaleString());
  }
}

export function getSavedUserDonationIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_MY_DONATION_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function saveUserDonationId(donationId: string): void {
  if (!donationId) return;
  try {
    const existing = getSavedUserDonationIds();
    if (!existing.includes(donationId)) {
      const updated = [donationId, ...existing].slice(0, 50);
      localStorage.setItem(LOCAL_MY_DONATION_IDS_KEY, JSON.stringify(updated));
    }
  } catch {
    // Ignore storage quota issues
  }
}

export interface ParsedMobileBankingSms {
  provider: DonationPaymentMethod;
  parsedAmount?: number;
  parsedTrxId?: string;
  parsedSenderPhone?: string;
  parsedReference?: string;
}

/**
 * Intelligent parser for Bangladeshi bKash & Nagad confirmation SMS formats.
 * Supports Send Money, Cash In, and Make Payment SMS templates.
 */
export function parseMobileBankingSms(
  rawMessage: string,
  senderAddress?: string
): ParsedMobileBankingSms {
  const cleanText = toEnglishDigits(stripInvisibleUnicode(rawMessage || ''))
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const cleanSender = stripInvisibleUnicode(senderAddress || '').trim();
  const senderLower = cleanSender.toLowerCase();
  const bodyLower = cleanText.toLowerCase();

  // 1. Detect Provider (bKash vs Nagad)
  let provider: DonationPaymentMethod = 'BKASH';
  if (
    senderLower.includes('nagad') ||
    senderLower === '16167' ||
    bodyLower.includes('nagad') ||
    bodyLower.includes('নগদ') ||
    (/\btxn\s*id\b/i.test(cleanText) && !/\btrx\s*id\b/i.test(cleanText))
  ) {
    provider = 'NAGAD';
  }

  // 2. Extract Transaction ID (TrxID for bKash, TxnId for Nagad)
  let parsedTrxId: string | undefined;
  const trxMatch = cleanText.match(
    /(?:Trx\s*ID|Txn\s*Id|Txn\s*ID|Transaction\s*ID|Trans\s*ID|TRX\s*NO|TXN\s*NO|ট্রানজেকশন\s*আইডি)\s*[:.#=\-]?\s*([A-Z0-9][A-Z0-9_-]{4,25})/i
  );
  if (trxMatch && trxMatch[1]) {
    parsedTrxId = normalizeTrxId(trxMatch[1]);
  }

  // 3. Extract Received Amount (prioritize received/payment amount over Fee/Balance)
  let parsedAmount: number | undefined;
  const primaryAmountMatch = cleanText.match(
    /(?:received|cash\s*in|payment|amount|send\s*money|পেয়েছেন|পাঠিয়েছেন)\s*(?:of\s*)?(?:Tk|BDT|৳)\s*\.?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i
  );

  // Check all currency tokens and pick the first one NOT preceded by Fee / Balance / Charge
  let nonFeeCurrencyAmount: string | undefined;
  const currencyRegex =
    /(?:(fee|charge|balance|comm|vat|ফি|চার্জ|ব্যালেন্স)\s*(?:is|:)?\s*)?(?:Tk|BDT|৳)\s*\.?\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi;
  let m: RegExpExecArray | null;
  while ((m = currencyRegex.exec(cleanText)) !== null) {
    if (!m[1] && m[2]) {
      nonFeeCurrencyAmount = m[2];
      break;
    }
  }

  // Bengali amount before "টাকা" (e.g. "আপনি 01340975230 থেকে 10.00 টাকা পেয়েছেন")
  const bengaliTakaMatch = cleanText.match(
    /(?:থেকে|মোট|পরিমাণ)\s*(?:Tk|BDT|৳)?\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*টাকা/i
  );
  let genericBengaliTaka: string | undefined;
  const bnRegex =
    /(?:(ফি|চার্জ|ব্যালেন্স|fee|balance)\s*)?([0-9,]+(?:\.[0-9]{1,2})?)\s*টাকা/gi;
  let bMatch: RegExpExecArray | null;
  while ((bMatch = bnRegex.exec(cleanText)) !== null) {
    if (!bMatch[1] && bMatch[2]) {
      genericBengaliTaka = bMatch[2];
      break;
    }
  }

  const amountRaw =
    primaryAmountMatch?.[1] ||
    nonFeeCurrencyAmount ||
    bengaliTakaMatch?.[1] ||
    genericBengaliTaka;
  if (amountRaw) {
    const num = parseFloat(amountRaw.replace(/,/g, ''));
    if (!isNaN(num) && num > 0) {
      parsedAmount = num;
    }
  }

  // 4. Extract Sender Phone Number (supports full 11-digit and masked 013****5230 formats)
  let parsedSenderPhone: string | undefined;
  const labeledPhoneMatch = cleanText.match(
    /(?:from|sender|customer|account|a\/c|no|number|থেকে)\s*[:.#=\-]?\s*((?:\+?88)?01[3-9][\d*]{8})/i
  );
  const anyUnmaskedPhoneMatch = cleanText.match(/((?:\+?88)?01[3-9]\d{8})/);
  const anyMaskedPhoneMatch = cleanText.match(/(01[3-9]\d*\*+\d*)/);
  const phoneRaw =
    labeledPhoneMatch?.[1] || anyUnmaskedPhoneMatch?.[1] || anyMaskedPhoneMatch?.[1];
  if (phoneRaw) {
    parsedSenderPhone = phoneRaw.includes('*')
      ? phoneRaw.replace(/\s+/g, '')
      : normalizeBdPhone(phoneRaw);
  }

  // 5. Extract Reference Code (e.g., Ref DPIB-4829 or Ref: DPIB4829)
  let parsedReference: string | undefined;
  const dpibRefMatch = cleanText.match(/\b(DPIB[-\s]?\d{3,8})\b/i);
  if (dpibRefMatch && dpibRefMatch[1]) {
    parsedReference = dpibRefMatch[1].toUpperCase().replace(/\s+/g, '-');
    if (!parsedReference.includes('-')) {
      parsedReference = parsedReference.replace(/^DPIB/, 'DPIB-');
    }
  } else {
    const genericRefMatch = cleanText.match(
      /\b(?:Ref|Reference|রেফারেন্স)\s*[:.#=\-]?\s*([A-Z0-9][A-Z0-9_-]{2,20})\b/i
    );
    if (genericRefMatch && genericRefMatch[1]) {
      const candidate = genericRefMatch[1].toUpperCase();
      if (!['FEE', 'BALANCE', 'TRXID', 'TXNID', 'TK', 'BDT', 'AT'].includes(candidate)) {
        parsedReference = candidate;
      }
    }
  }

  return {
    provider,
    parsedAmount,
    parsedTrxId,
    parsedSenderPhone,
    parsedReference,
  };
}

export interface SubmitDonationInput {
  paymentMethod: DonationPaymentMethod;
  amount: number;
  senderPhone: string;
  transactionId: string;
  referenceCode?: string;
  donorName?: string;
  purpose?: DonationPurpose | string;
  note?: string;
}

/**
 * Submits a user donation to Firestore and automatically verifies it immediately
 * if a matching payment confirmation SMS has already been received by the webhook.
 */
export async function submitDonation(input: SubmitDonationInput): Promise<DonationRecord> {
  const cleanAmount = Number(toEnglishDigits(String(input.amount)));
  if (isNaN(cleanAmount) || cleanAmount < 10) {
    throw new Error('ন্যূনতম অনুদানের পরিমাণ ১০ টাকা হতে হবে।');
  }
  if (cleanAmount > 500000) {
    throw new Error('অনুদানের পরিমাণ সর্বাধিক ৫,০০,০০০ টাকা পর্যন্ত গ্রহণযোগ্য।');
  }

  const cleanPhone = normalizeBdPhone(input.senderPhone);
  if (!isValidBdPhone(cleanPhone)) {
    throw new Error('সঠিক ১১-সংখ্যার বাংলাদেশি মোবাইল নম্বর প্রদান করুন (যেমন: 017XXXXXXXX)।');
  }

  const cleanTrxId = normalizeTrxId(input.transactionId);
  if (cleanTrxId.length < 5) {
    throw new Error('সঠিক ট্রানজেকশন আইডি (TrxID / TxnId) লিখুন।');
  }

  const referenceCode = (input.referenceCode || generateDonationReference()).trim().toUpperCase();
  const now = Date.now();
  const docId = `don_${now}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    // Check if TrxID was already submitted
    const existingTrxQ = query(
      collection(db, DONATIONS_COLLECTION),
      where('transactionIdUpper', '==', cleanTrxId),
      limit(1)
    );
    const existingTrxSnap = await getDocs(existingTrxQ);
    if (!existingTrxSnap.empty) {
      throw new Error('এই ট্রানজেকশন আইডি (TrxID) ইতিমধ্যেই ব্যবহার করা হয়েছে। অনুগ্রহ করে সঠিক TrxID যাচাই করুন।');
    }

    // Check if an UNMATCHED incoming SMS from Android SMS Reader already arrived for this TrxID or Reference
    let status: DonationStatus = 'PENDING';
    let verificationSource: 'AUTO_SMS_APP' | undefined;
    let matchedSmsId: string | undefined;
    let matchedSmsText: string | undefined;
    let verifiedAt: number | undefined;

    const unmatchedSmsQ = query(
      collection(db, DONATION_SMS_LOGS_COLLECTION),
      where('matchStatus', '==', 'UNMATCHED'),
      limit(60)
    );
    const unmatchedSmsSnap = await getDocs(unmatchedSmsQ);

    for (const smsDoc of unmatchedSmsSnap.docs) {
      const sms = smsDoc.data() as DonationSmsLog;
      if (isUnexpandedSmsPlaceholder(sms.rawMessage)) continue;

      const reparsed = parseMobileBankingSms(sms.rawMessage, sms.senderAddress);
      const effectiveTrx = normalizeTrxId(sms.parsedTrxId || reparsed.parsedTrxId || '');
      const effectiveRef = (sms.parsedReference || reparsed.parsedReference || '').toUpperCase();
      const effectiveAmount =
        typeof sms.parsedAmount === 'number' ? sms.parsedAmount : reparsed.parsedAmount;
      const effectiveProvider = reparsed.provider || sms.provider;
      const rawNormalized = normalizeTrxId(sms.rawMessage);

      const trxMatches =
        (Boolean(effectiveTrx) && effectiveTrx === cleanTrxId) ||
        (cleanTrxId.length >= 6 && rawNormalized.includes(cleanTrxId));
      const refMatches =
        Boolean(effectiveRef) &&
        effectiveRef === referenceCode &&
        effectiveProvider === input.paymentMethod;
      const amountValid =
        typeof effectiveAmount === 'number' ? effectiveAmount >= cleanAmount : true;

      if ((trxMatches || refMatches) && amountValid) {
        status = 'VERIFIED';
        verificationSource = 'AUTO_SMS_APP';
        matchedSmsId = smsDoc.id;
        matchedSmsText = String(sms.rawMessage || '').slice(0, 600);
        verifiedAt = now;

        // Update that SMS log as MATCHED
        await updateDoc(doc(db, DONATION_SMS_LOGS_COLLECTION, smsDoc.id), {
          matchedDonationId: docId,
          matchedReferenceCode: referenceCode,
          matchStatus: 'MATCHED',
        });
        break;
      }
    }

    const record: DonationRecord = {
      id: docId,
      referenceCode,
      paymentMethod: input.paymentMethod,
      amount: cleanAmount,
      senderPhone: cleanPhone,
      transactionId: cleanTrxId,
      transactionIdUpper: cleanTrxId,
      donorName: (input.donorName || '').trim() || 'শুভাকাঙ্ক্ষী',
      purpose: input.purpose || 'APP_DEVELOPMENT',
      note: (input.note || '').trim().slice(0, 400),
      status,
      ...(verificationSource ? { verificationSource } : {}),
      ...(matchedSmsId ? { matchedSmsId } : {}),
      ...(matchedSmsText ? { matchedSmsText } : {}),
      ...(verifiedAt ? { verifiedAt } : {}),
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, DONATIONS_COLLECTION, docId), record);
    saveUserDonationId(docId);

    // If immediately verified via matched SMS, automatically generate Transaction in /transactions
    if (record.status === 'VERIFIED') {
      await ensureTransactionForDonation(record);
    }

    return record;
  } catch (error) {
    if (error instanceof Error && (
      error.message.includes('ন্যূনতম') ||
      error.message.includes('সঠিক') ||
      error.message.includes('ইতিমধ্যেই')
    )) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, `${DONATIONS_COLLECTION}/${docId}`);
  }
}

export interface SmsVerificationCheckResult {
  status: 'MATCHED' | 'MISMATCH' | 'DUPLICATE' | 'NOT_FOUND';
  matchedSms?: DonationSmsLog;
  errorMessage?: string;
}

/**
 * Checks Firestore (donations + donation_sms_logs) to verify whether an incoming SMS
 * from the Android SMS Reader matches the user's Transaction ID, Sender Phone, Payment Method, and Amount.
 */
export async function checkSmsDatabaseMatch(params: {
  paymentMethod: DonationPaymentMethod;
  amount: number;
  transactionId: string;
  senderPhone?: string;
  referenceCode?: string;
}): Promise<SmsVerificationCheckResult> {
  const cleanTrxId = normalizeTrxId(params.transactionId);
  const cleanAmount = Number(toEnglishDigits(String(params.amount)));
  const cleanPhone = params.senderPhone ? normalizeBdPhone(params.senderPhone) : '';
  const cleanRef = (params.referenceCode || '').trim().toUpperCase();

  try {
    // 1. Ensure TrxID was not already submitted/verified
    const existingTrxQ = query(
      collection(db, DONATIONS_COLLECTION),
      where('transactionIdUpper', '==', cleanTrxId),
      limit(5)
    );
    const existingTrxSnap = await getDocs(existingTrxQ);
    if (!existingTrxSnap.empty) {
      return {
        status: 'DUPLICATE',
        errorMessage:
          'এই ট্রানজেকশন আইডি (TRXID) ইতিমধ্যেই ব্যবহৃত হয়েছে। অনুগ্রহ করে আপনার নতুন পেমেন্টের সঠিক আইডি দিন।',
      };
    }

    // 2. Scan incoming SMS logs from Android SMS Reader (with unordered fallback if index unavailable)
    let rawDocs: DonationSmsLog[] = [];
    try {
      const smsQ = query(
        collection(db, DONATION_SMS_LOGS_COLLECTION),
        orderBy('receivedAt', 'desc'),
        limit(80)
      );
      const smsSnap = await getDocs(smsQ);
      rawDocs = smsSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<DonationSmsLog, 'id'>),
      }));
    } catch {
      const fallbackSnap = await getDocs(
        query(collection(db, DONATION_SMS_LOGS_COLLECTION), limit(100))
      );
      rawDocs = fallbackSnap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<DonationSmsLog, 'id'>),
        }))
        .sort((a, b) => Number(b.receivedAt || 0) - Number(a.receivedAt || 0));
    }

    let recentUnexpandedPlaceholder: string | null = null;
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;

    // 2A. Primary Check: Exact Normalized TrxID OR Direct Raw-Message TrxID Token Match
    for (const sms of rawDocs) {
      if (isUnexpandedSmsPlaceholder(sms.rawMessage)) {
        if (Number(sms.receivedAt || 0) >= thirtyMinutesAgo && !recentUnexpandedPlaceholder) {
          recentUnexpandedPlaceholder = String(sms.rawMessage || '').trim();
        }
        continue;
      }

      const reparsed = parseMobileBankingSms(sms.rawMessage, sms.senderAddress);
      const effectiveTrx = normalizeTrxId(sms.parsedTrxId || reparsed.parsedTrxId || '');
      const effectiveAmount =
        typeof sms.parsedAmount === 'number' ? sms.parsedAmount : reparsed.parsedAmount;
      const effectiveProvider = reparsed.provider || sms.provider;
      const rawAlphanumeric = normalizeTrxId(sms.rawMessage);

      const trxMatches =
        (Boolean(effectiveTrx) && effectiveTrx === cleanTrxId) ||
        (cleanTrxId.length >= 6 && rawAlphanumeric.includes(cleanTrxId));

      if (trxMatches) {
        if (sms.matchStatus === 'MATCHED') {
          return {
            status: 'DUPLICATE',
            errorMessage: 'এই ট্রানজেকশন আইডি (TRXID) ইতিমধ্যেই অন্য একটি লেনদেনে যাচাই সম্পন্ন হয়েছে।',
          };
        }

        if (effectiveProvider !== params.paymentMethod) {
          return {
            status: 'MISMATCH',
            errorMessage: `পেমেন্ট মাধ্যম মেলেনি! এসএমএস রিডার থেকে ${
              effectiveProvider === 'BKASH' ? 'বিকাশ (BKASH)' : 'নগদ (NAGAD)'
            }-এর এসএমএস পাওয়া গেছে, কিন্তু আপনি ${
              params.paymentMethod === 'BKASH' ? 'বিকাশ (BKASH)' : 'নগদ (NAGAD)'
            } নির্বাচন করেছেন।`,
          };
        }

        if (
          typeof effectiveAmount === 'number' &&
          Math.abs(effectiveAmount - cleanAmount) >= 0.01
        ) {
          return {
            status: 'MISMATCH',
            errorMessage: `টাকার অ্যামাউন্ট মেলেনি! আপনি ৳ ${toBanglaDigits(
              cleanAmount
            )} টাকা দিয়েছেন, কিন্তু এসএমএস রিডারে প্রাপ্ত পরিমাণ ৳ ${toBanglaDigits(
              effectiveAmount
            )} টাকা।`,
          };
        }

        return {
          status: 'MATCHED',
          matchedSms: {
            ...sms,
            provider: effectiveProvider,
            parsedTrxId: effectiveTrx || cleanTrxId,
            ...(typeof effectiveAmount === 'number' ? { parsedAmount: effectiveAmount } : {}),
          },
        };
      }
    }

    // 2B. Fallback Check: Match by Sender Phone Number + Exact Amount + Provider (or Reference)
    const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
    for (const sms of rawDocs) {
      if (sms.matchStatus !== 'UNMATCHED') continue;
      if (isUnexpandedSmsPlaceholder(sms.rawMessage)) continue;

      const reparsed = parseMobileBankingSms(sms.rawMessage, sms.senderAddress);
      const effectiveTrx = normalizeTrxId(sms.parsedTrxId || reparsed.parsedTrxId || '');
      const effectiveAmount =
        typeof sms.parsedAmount === 'number' ? sms.parsedAmount : reparsed.parsedAmount;
      const effectivePhone = sms.parsedSenderPhone || reparsed.parsedSenderPhone;
      const effectiveRef = (sms.parsedReference || reparsed.parsedReference || '').toUpperCase();
      const effectiveProvider = reparsed.provider || sms.provider;

      // Exact Reference Code match
      if (cleanRef && effectiveRef && effectiveRef === cleanRef) {
        if (!effectiveTrx) {
          if (
            effectiveProvider === params.paymentMethod &&
            (typeof effectiveAmount !== 'number' || Math.abs(effectiveAmount - cleanAmount) < 0.01)
          ) {
            return {
              status: 'MATCHED',
              matchedSms: {
                ...sms,
                provider: effectiveProvider,
                parsedTrxId: cleanTrxId,
                ...(typeof effectiveAmount === 'number' ? { parsedAmount: effectiveAmount } : {}),
              },
            };
          }
        } else if (effectiveTrx !== cleanTrxId) {
          return {
            status: 'MISMATCH',
            errorMessage: `ট্রানজেকশন নম্বর মেলেনি! এসএমএস রিডারে প্রাপ্ত ট্রানজেকশন আইডি হলো ${effectiveTrx}, কিন্তু আপনি ${cleanTrxId} লিখেছেন।`,
          };
        }
      }

      // Sender Phone + Exact Amount + Same Provider within 12 hours
      if (
        cleanPhone &&
        effectivePhone &&
        phonesCompatible(effectivePhone, cleanPhone) &&
        effectiveProvider === params.paymentMethod &&
        typeof effectiveAmount === 'number' &&
        Math.abs(effectiveAmount - cleanAmount) < 0.01 &&
        Number(sms.receivedAt || 0) >= twelveHoursAgo
      ) {
        if (!effectiveTrx) {
          return {
            status: 'MATCHED',
            matchedSms: {
              ...sms,
              provider: effectiveProvider,
              parsedTrxId: cleanTrxId,
              parsedAmount: effectiveAmount,
              parsedSenderPhone: cleanPhone,
            },
          };
        } else if (effectiveTrx !== cleanTrxId) {
          return {
            status: 'MISMATCH',
            errorMessage: `আপনার প্রদত্ত নম্বর (${toBanglaDigits(
              cleanPhone
            )}) ও ৳ ${toBanglaDigits(
              cleanAmount
            )} টাকার SMS পাওয়া গেছে, কিন্তু SMS-এ থাকা ট্রানজেকশন আইডি হলো ${effectiveTrx} (আপনি লিখেছেন ${cleanTrxId})।`,
          };
        }
      }
    }

    if (recentUnexpandedPlaceholder) {
      return {
        status: 'NOT_FOUND',
        errorMessage: `অ্যান্ড্রয়েড SMS FORWARDER অ্যাপ থেকে মূল পেমেন্ট মেসেজের পরিবর্তে টেমপ্লেট টেক্সট (${recentUnexpandedPlaceholder}) এসেছে। অ্যাপের JSON BODY-তে মেসেজের জায়গায় "{msg}" ও প্রেরকের জায়গায় "{sender}" ব্যবহার করে পুনরায় চেষ্টা করুন।`,
      };
    }

    return { status: 'NOT_FOUND' };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, DONATION_SMS_LOGS_COLLECTION);
  }
}

/**
 * Real-time listener on incoming SMS logs during the 15-second verification window.
 */
export function subscribeSmsLogsForVerification(onChanged: () => void): Unsubscribe {
  const q = query(
    collection(db, DONATION_SMS_LOGS_COLLECTION),
    orderBy('receivedAt', 'desc'),
    limit(25)
  );
  return onSnapshot(
    q,
    () => {
      onChanged();
    },
    () => {
      // Fallback without orderBy in case composite index is still warming up
      onSnapshot(
        query(collection(db, DONATION_SMS_LOGS_COLLECTION), limit(25)),
        () => {
          onChanged();
        },
        (fallbackErr) => {
          console.warn('Live SMS verification listener warning:', fallbackErr.message);
        }
      );
    }
  );
}

/**
 * Finalizes a verified donation after the 15-second check succeeds,
 * marking the SMS log as MATCHED and creating both the verified donation and completed transaction.
 */
export async function finalizeVerifiedDonationFromSms(
  input: SubmitDonationInput,
  matchedSms: DonationSmsLog
): Promise<DonationRecord> {
  const cleanAmount = Number(toEnglishDigits(String(input.amount)));
  const cleanPhone = normalizeBdPhone(input.senderPhone);
  const cleanTrxId = normalizeTrxId(input.transactionId);
  const referenceCode = (input.referenceCode || generateDonationReference()).trim().toUpperCase();
  const now = Date.now();
  const docId = `don_${now}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    // Re-check duplicate TrxID right before commit
    const existingTrxQ = query(
      collection(db, DONATIONS_COLLECTION),
      where('transactionIdUpper', '==', cleanTrxId),
      limit(1)
    );
    const existingTrxSnap = await getDocs(existingTrxQ);
    if (!existingTrxSnap.empty) {
      throw new Error(
        'এই ট্রানজেকশন আইডি (TRXID) ইতিমধ্যেই ব্যবহার করা হয়েছে। অনুগ্রহ করে সঠিক TRXID যাচাই করুন।'
      );
    }

    // Update SMS log as MATCHED
    await updateDoc(doc(db, DONATION_SMS_LOGS_COLLECTION, matchedSms.id), {
      matchedDonationId: docId,
      matchedReferenceCode: referenceCode,
      matchStatus: 'MATCHED',
    });

    const record: DonationRecord = {
      id: docId,
      referenceCode,
      paymentMethod: input.paymentMethod,
      amount: cleanAmount,
      senderPhone: cleanPhone,
      transactionId: cleanTrxId,
      transactionIdUpper: cleanTrxId,
      donorName: (input.donorName || '').trim() || 'শুভাকাঙ্ক্ষী',
      purpose: input.purpose || 'APP_DEVELOPMENT',
      note: (input.note || '').trim().slice(0, 400),
      status: 'VERIFIED',
      verificationSource: 'AUTO_SMS_APP',
      matchedSmsId: matchedSms.id,
      matchedSmsText: String(matchedSms.rawMessage || '').slice(0, 600),
      verifiedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, DONATIONS_COLLECTION, docId), record);
    saveUserDonationId(docId);
    await ensureTransactionForDonation(record);

    return record;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('ন্যূনতম') ||
        error.message.includes('সঠিক') ||
        error.message.includes('ইতিমধ্যেই'))
    ) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, `${DONATIONS_COLLECTION}/${docId}`);
  }
}

/**
 * Automatically creates or ensures a completed Transaction document in Firestore (/transactions)
 * whenever a donation/payment is confirmed or verified.
 */
export async function ensureTransactionForDonation(
  donation: DonationRecord
): Promise<TransactionRecord> {
  const txnId = `txn_${donation.id}`;
  const completedAt = donation.verifiedAt || donation.updatedAt || Date.now();
  const transactionRecord: TransactionRecord = {
    id: txnId,
    transactionNumber: generateTransactionNumber(donation.referenceCode, completedAt),
    donationId: donation.id,
    referenceCode: donation.referenceCode,
    paymentMethod: donation.paymentMethod,
    amount: Number(donation.amount),
    senderPhone: donation.senderPhone,
    gatewayTrxId: donation.transactionIdUpper || donation.transactionId,
    donorName: donation.donorName || 'শুভাকাঙ্ক্ষী',
    purpose: donation.purpose || 'APP_DEVELOPMENT',
    verificationSource:
      donation.verificationSource === 'AUTO_SMS_APP' ? 'AUTO_SMS_APP' : 'MANUAL_ADMIN',
    status: 'COMPLETED',
    completedAt,
    createdAt: completedAt,
  };

  try {
    await setDoc(doc(db, TRANSACTIONS_COLLECTION, txnId), transactionRecord);
    return transactionRecord;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${TRANSACTIONS_COLLECTION}/${txnId}`);
  }
}

/**
 * Removes a linked transaction if a donation is reverted from VERIFIED or deleted.
 */
export async function removeTransactionForDonation(donationId: string): Promise<void> {
  const txnId = `txn_${donationId}`;
  try {
    await deleteDoc(doc(db, TRANSACTIONS_COLLECTION, txnId));
  } catch {
    // Ignore if transaction document does not exist
  }
}

let hasSyncedVerifiedTransactions = false;

/**
 * Ensures any previously verified donations in Firestore have an auto-generated Transaction document.
 */
export async function syncVerifiedDonationsToTransactions(): Promise<void> {
  if (hasSyncedVerifiedTransactions) return;
  hasSyncedVerifiedTransactions = true;
  try {
    const verifiedQ = query(
      collection(db, DONATIONS_COLLECTION),
      where('status', '==', 'VERIFIED'),
      limit(60)
    );
    const snap = await getDocs(verifiedQ);
    if (snap.empty) return;

    for (const d of snap.docs) {
      const donationData = { id: d.id, ...(d.data() as Omit<DonationRecord, 'id'>) };
      const txnRef = doc(db, TRANSACTIONS_COLLECTION, `txn_${d.id}`);
      const existingTxn = await getDoc(txnRef);
      if (!existingTxn.exists()) {
        await ensureTransactionForDonation(donationData);
      }
    }
  } catch (err) {
    console.warn('Background transaction sync warning:', err);
  }
}

/**
 * Subscribe to auto-generated completed payment transactions in real time.
 */
export function subscribeTransactions(
  callback: (transactions: TransactionRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  syncVerifiedDonationsToTransactions();

  const q = query(
    collection(db, TRANSACTIONS_COLLECTION),
    orderBy('completedAt', 'desc'),
    limit(150)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items: TransactionRecord[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<TransactionRecord, 'id'>),
      }));
      callback(items);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

/**
 * Fetches a donation record by ID (or synthesizes one from its TransactionRecord if needed)
 * so any item in Transaction History can open its full Digital Receipt.
 */
export async function getDonationRecordForTransaction(
  txn: TransactionRecord
): Promise<DonationRecord> {
  try {
    const snap = await getDoc(doc(db, DONATIONS_COLLECTION, txn.donationId));
    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() as Omit<DonationRecord, 'id'>) };
    }
  } catch {
    // Fallback below if donation doc missing
  }
  return {
    id: txn.donationId,
    referenceCode: txn.referenceCode,
    paymentMethod: txn.paymentMethod,
    amount: txn.amount,
    senderPhone: txn.senderPhone,
    transactionId: txn.gatewayTrxId,
    transactionIdUpper: txn.gatewayTrxId,
    donorName: txn.donorName || 'শুভাকাঙ্ক্ষী',
    purpose: txn.purpose || 'APP_DEVELOPMENT',
    status: 'VERIFIED',
    verificationSource: txn.verificationSource,
    verifiedAt: txn.completedAt,
    createdAt: txn.createdAt,
    updatedAt: txn.completedAt,
  };
}

/**
 * Subscribe to a single donation document for real-time status updates
 * (so the receipt page flips live when the Android SMS webhook verifies the payment).
 */
export function subscribeDonationById(
  donationId: string,
  callback: (donation: DonationRecord | null) => void
): Unsubscribe {
  const docRef = doc(db, DONATIONS_COLLECTION, donationId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...(snap.data() as Omit<DonationRecord, 'id'>) });
      } else {
        callback(null);
      }
    },
    (err) => {
      console.warn('Donation subscription warning:', err.message);
    }
  );
}

/**
 * Look up donation records by Reference Code (DPIB-XXXX), Transaction ID (TrxID), or Sender Phone.
 */
export async function lookupDonations(searchQuery: string): Promise<DonationRecord[]> {
  const clean = toEnglishDigits(searchQuery || '').trim();
  if (!clean) return [];

  const upper = clean.toUpperCase();
  const phone = normalizeBdPhone(clean);

  try {
    const resultsMap = new Map<string, DonationRecord>();

    // Query by TrxID
    const trxQ = query(
      collection(db, DONATIONS_COLLECTION),
      where('transactionIdUpper', '==', upper),
      limit(10)
    );
    const trxSnap = await getDocs(trxQ);
    trxSnap.forEach((d) => {
      resultsMap.set(d.id, { id: d.id, ...(d.data() as Omit<DonationRecord, 'id'>) });
    });

    // Query by Reference Code
    const refQ = query(
      collection(db, DONATIONS_COLLECTION),
      where('referenceCode', '==', upper),
      limit(10)
    );
    const refSnap = await getDocs(refQ);
    refSnap.forEach((d) => {
      resultsMap.set(d.id, { id: d.id, ...(d.data() as Omit<DonationRecord, 'id'>) });
    });

    // Query by Sender Phone
    if (isValidBdPhone(phone)) {
      const phoneQ = query(
        collection(db, DONATIONS_COLLECTION),
        where('senderPhone', '==', phone),
        limit(15)
      );
      const phoneSnap = await getDocs(phoneQ);
      phoneSnap.forEach((d) => {
        resultsMap.set(d.id, { id: d.id, ...(d.data() as Omit<DonationRecord, 'id'>) });
      });
    }

    return Array.from(resultsMap.values()).sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, DONATIONS_COLLECTION);
  }
}

/**
 * Subscribe to all donations (for Admin Panel).
 */
export function subscribeAllDonations(
  callback: (donations: DonationRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, DONATIONS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(200)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items: DonationRecord[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<DonationRecord, 'id'>),
      }));
      callback(items);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

/**
 * Subscribe to incoming SMS logs (for Admin Panel).
 */
export function subscribeDonationSmsLogs(
  callback: (logs: DonationSmsLog[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, DONATION_SMS_LOGS_COLLECTION),
    orderBy('receivedAt', 'desc'),
    limit(100)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items: DonationSmsLog[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<DonationSmsLog, 'id'>),
      }));
      callback(items);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

/**
 * Manually verify or reject a donation from the Admin Panel.
 * Automatically generates or removes the corresponding Transaction record in /transactions.
 */
export async function updateDonationStatusManually(
  donationId: string,
  status: DonationStatus
): Promise<void> {
  const path = `${DONATIONS_COLLECTION}/${donationId}`;
  try {
    const docRef = doc(db, DONATIONS_COLLECTION, donationId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error('অনুদান রেকর্ডটি পাওয়া যায়নি।');
    }
    const existing = snap.data() as DonationRecord;
    const now = Date.now();
    const verificationSource =
      status === 'VERIFIED' ? 'MANUAL_ADMIN' : existing.verificationSource || 'MANUAL_ADMIN';
    const verifiedAt = status === 'VERIFIED' ? now : existing.verifiedAt || 0;

    await updateDoc(docRef, {
      ...existing,
      status,
      verificationSource,
      verifiedAt,
      updatedAt: now,
    });

    if (status === 'VERIFIED') {
      await ensureTransactionForDonation({
        ...existing,
        id: donationId,
        status: 'VERIFIED',
        verificationSource: 'MANUAL_ADMIN',
        verifiedAt: now,
        updatedAt: now,
      });
    } else {
      await removeTransactionForDonation(donationId);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete a donation record (Admin Panel cleanup).
 */
export async function deleteDonationRecord(donationId: string): Promise<void> {
  const path = `${DONATIONS_COLLECTION}/${donationId}`;
  try {
    await deleteDoc(doc(db, DONATIONS_COLLECTION, donationId));
    await removeTransactionForDonation(donationId);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
