import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import {
  CheckCircle2,
  AlertCircle,
  Database,
  MessageSquareText,
  ShieldCheck,
  FileCheck2,
  RefreshCw,
  ArrowLeft,
  Check,
  Loader2,
  X,
  BellRing,
} from 'lucide-react';
import {
  DonationPaymentMethod,
  DonationRecord,
  DonationSmsLog,
} from '../../types';
import {
  checkSmsDatabaseMatch,
  finalizeVerifiedDonationFromSms,
  generateTransactionNumber,
  subscribeSmsLogsForVerification,
} from '../../services/donationService';
import { toBanglaDigits } from '../../utils/bangla';
import { playFailSound, playPassSound } from '../../utils/resultAudio';
import {
  getNotificationPermissionStatus,
  isNotificationSystemActive,
  notifyPaymentCompleted,
  requestNotificationPermissionAndToken,
} from '../../services/notification';
import { PaymentMethodLogo } from '../common/PaymentMethodLogo';

interface PaymentVerificationModalProps {
  isOpen: boolean;
  paymentData: {
    paymentMethod: DonationPaymentMethod;
    amount: number;
    senderPhone: string;
    transactionId: string;
    referenceCode: string;
    donorName?: string;
    purpose: string;
    note?: string;
  } | null;
  onSuccess: (verifiedRecord: DonationRecord) => void;
  onCloseForEdit: (errorMessage?: string) => void;
}

const VERIFICATION_DURATION_MS = 30_000;

const VERIFICATION_STAGES = [
  {
    title: 'লেনদেন যাচাই করা হচ্ছে — ডেটাবেজ সংযোগ পরীক্ষা',
    subtitle: 'আপনার প্রদত্ত ট্রানজেকশন নম্বর (TRXID) ও পেমেন্ট তথ্য যাচাই চলছে',
    icon: Database,
  },
  {
    title: 'এসএমএস (SMS) রিডার থেকে প্রাপ্ত বার্তা অনুসন্ধান',
    subtitle: 'ক্লাউড ডেটাবেজে বিকাশ ও নগদ থেকে আসা নিশ্চিতকরণ SMS খোঁজা হচ্ছে',
    icon: MessageSquareText,
  },
  {
    title: 'ট্রানজেকশন নম্বর (TRXID) ও টাকার অ্যামাউন্ট যাচাই',
    subtitle: 'প্রাপ্ত SMS-এর সাথে ট্রানজেকশন আইডি ও টাকার পরিমাণ মিলিয়ে দেখা হচ্ছে',
    icon: ShieldCheck,
  },
  {
    title: 'চূড়ান্ত নিরাপত্তা নিশ্চিতকরণ ও লেনদেন রসিদ তৈরি',
    subtitle: 'সকল তথ্য যাচাই সম্পন্ন করে লেনদেন হিস্ট্রি ও ডিজিটাল রসিদ প্রস্তুত হচ্ছে',
    icon: FileCheck2,
  },
];

interface WalletTakaTransferSvgProps {
  brandColor: string;
  amount: number;
}

/**
 * Custom animated SVG showing Bangladeshi Taka (৳) banknotes & coins
 * gliding along an arc directly into an open digital wallet pocket.
 */
const WalletTakaTransferSvg: React.FC<WalletTakaTransferSvgProps> = ({
  brandColor,
  amount,
}) => {
  return (
    <div className="relative w-full flex flex-col items-center justify-center">
      <svg
        id="wallet-taka-animation-svg"
        viewBox="0 0 240 150"
        className="w-full max-w-[235px] h-auto overflow-visible select-none"
        role="img"
        aria-label="ওয়ালেটে টাকা যুক্ত হওয়ার অ্যানিমেশন"
      >
        <defs>
          {/* Clip incoming Taka notes & coins right at the front wallet pocket lip (y = 71) */}
          <clipPath id="dpib-wallet-pocket-clip">
            <rect x="0" y="-15" width="240" height="86" />
          </clipPath>

          <linearGradient id="dpib-wallet-back-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          <linearGradient id="dpib-wallet-front-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#090d16" />
          </linearGradient>

          <linearGradient id="dpib-note-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          <linearGradient id="dpib-coin-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="55%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          <linearGradient id="dpib-coin-emerald" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="55%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>

        {/* Subtle Trajectory Arc Guides */}
        <path
          d="M 22 44 Q 82 4 154 44"
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="1.75"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
        <path
          d="M 16 84 Q 78 36 164 52"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1.5"
          strokeDasharray="3 4"
          strokeLinecap="round"
        />

        {/* Sender Payment Origin Node (Left) */}
        <g transform="translate(10, 74)">
          <rect
            x="0"
            y="0"
            width="38"
            height="52"
            rx="9"
            fill="#ffffff"
            stroke="#cbd5e1"
            strokeWidth="2"
          />
          <rect x="13" y="4" width="12" height="2.2" rx="1.1" fill="#94a3b8" />
          <circle cx="19" cy="24" r="10.5" fill={brandColor} fillOpacity="0.14" />
          <text
            x="19"
            y="28.5"
            textAnchor="middle"
            fill={brandColor}
            fontSize="13"
            fontWeight="900"
          >
            ৳
          </text>
          <rect x="9" y="41" width="20" height="3" rx="1.5" fill="#cbd5e1" />
        </g>

        {/* Wallet Back Flap & Illuminated Pocket Opening (Drawn behind incoming money) */}
        <g transform="translate(116, 44)">
          {/* Back Flap */}
          <rect
            x="6"
            y="0"
            width="92"
            height="78"
            rx="14"
            fill="url(#dpib-wallet-back-grad)"
          />
          {/* Inner Brand Glow Slot */}
          <rect
            x="12"
            y="14"
            width="80"
            height="22"
            rx="8"
            fill={brandColor}
            fillOpacity="0.28"
          />
          <rect
            x="16"
            y="18"
            width="72"
            height="14"
            rx="5"
            fill="#10b981"
            fillOpacity="0.25"
          />
        </g>

        {/* ==================== ANIMATED TAKA (৳) SVG NOTES & COINS ENTERING WALLET ==================== */}
        <g clipPath="url(#dpib-wallet-pocket-clip)">
          {/* 1. Bangladeshi Taka Banknote SVG gliding into wallet */}
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            initial={{ x: 18, y: 24, scale: 0.72, rotate: -14, opacity: 0 }}
            animate={{
              x: [18, 78, 138, 144],
              y: [24, 2, 18, 75],
              scale: [0.72, 1.04, 0.96, 0.78],
              rotate: [-14, 3, 7, 1],
              opacity: [0, 1, 1, 1],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: 'easeInOut',
              times: [0, 0.36, 0.72, 1],
            }}
          >
            <rect
              x="0"
              y="0"
              width="46"
              height="26"
              rx="5"
              fill="url(#dpib-note-grad)"
              stroke="#ecfdf5"
              strokeWidth="1.5"
            />
            <rect
              x="3.5"
              y="3.5"
              width="39"
              height="19"
              rx="3"
              fill="none"
              stroke="#a7f3d0"
              strokeWidth="0.9"
              strokeDasharray="2 1.5"
            />
            <circle cx="23" cy="13" r="6.8" fill="#ffffff" fillOpacity="0.22" />
            <text
              x="23"
              y="17"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="12.5"
              fontWeight="900"
            >
              ৳
            </text>
          </motion.g>

          {/* 2. Primary Gold Taka (৳) SVG Coin dropping into wallet */}
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            initial={{ x: 26, y: 60, scale: 0.65, rotate: -20, opacity: 0 }}
            animate={{
              x: [26, 94, 158, 162],
              y: [60, 16, 20, 76],
              scale: [0.65, 1.06, 0.95, 0.76],
              rotate: [-20, 8, 0, 0],
              opacity: [0, 1, 1, 1],
            }}
            transition={{
              duration: 2.4,
              delay: 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
              times: [0, 0.36, 0.72, 1],
            }}
          >
            <circle
              cx="14"
              cy="14"
              r="13"
              fill="url(#dpib-coin-gold)"
              stroke="#fef08a"
              strokeWidth="1.6"
            />
            <circle
              cx="14"
              cy="14"
              r="9.5"
              fill="none"
              stroke="#78350f"
              strokeOpacity="0.32"
              strokeWidth="1"
            />
            <text
              x="14"
              y="18.5"
              textAnchor="middle"
              fill="#451a03"
              fontSize="13.5"
              fontWeight="900"
            >
              ৳
            </text>
          </motion.g>

          {/* 3. Secondary Emerald Taka (৳) SVG Coin dropping into wallet */}
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            initial={{ x: 32, y: 42, scale: 0.65, rotate: 12, opacity: 0 }}
            animate={{
              x: [32, 90, 146, 150],
              y: [42, 8, 18, 76],
              scale: [0.65, 1, 0.92, 0.75],
              rotate: [12, -5, 2, 0],
              opacity: [0, 1, 1, 1],
            }}
            transition={{
              duration: 2.4,
              delay: 1.6,
              repeat: Infinity,
              ease: 'easeInOut',
              times: [0, 0.36, 0.72, 1],
            }}
          >
            <circle
              cx="12"
              cy="12"
              r="11.5"
              fill="url(#dpib-coin-emerald)"
              stroke="#d1fae5"
              strokeWidth="1.5"
            />
            <text
              x="12"
              y="16.2"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="12"
              fontWeight="900"
            >
              ৳
            </text>
          </motion.g>
        </g>

        {/* ==================== FOREGROUND WALLET POCKET BODY & CLASP ==================== */}
        <g transform="translate(112, 68)">
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            animate={{
              y: [0, 2.5, -0.5, 0],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {/* Main Wallet Body (Sits in front of clipped money so money enters inside!) */}
            <path
              d="M 4 6 Q 4 0 12 0 L 100 0 Q 108 0 108 6 L 108 52 Q 108 66 94 66 L 18 66 Q 4 66 4 52 Z"
              fill="url(#dpib-wallet-front-grad)"
              stroke="#334155"
              strokeWidth="1.75"
            />

            {/* Top Pocket Rim Lip */}
            <line
              x1="10"
              y1="2.5"
              x2="102"
              y2="2.5"
              stroke="#64748b"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Hand-Stitched Inner Perimeter */}
            <rect
              x="10"
              y="8"
              width="92"
              height="52"
              rx="10"
              fill="none"
              stroke="#475569"
              strokeWidth="1"
              strokeDasharray="3 3"
            />

            {/* Brand Color Accent Stripe inside Wallet */}
            <rect x="16" y="15" width="34" height="4.5" rx="2.25" fill={brandColor} />
            <rect x="16" y="23" width="22" height="3" rx="1.5" fill="#64748b" />

            {/* Taka Amount Tag inside Wallet */}
            <text
              x="16"
              y="49"
              fill="#e2e8f0"
              fontSize="11"
              fontWeight="800"
            >
              ৳ {toBanglaDigits(amount)}
            </text>

            {/* Metallic Right-Side Wallet Clasp */}
            <rect
              x="80"
              y="21"
              width="32"
              height="24"
              rx="12"
              fill="#0f172a"
              stroke="#64748b"
              strokeWidth="1.5"
            />
            <circle cx="92" cy="33" r="7.5" fill={brandColor} />
            <text
              x="92"
              y="36.8"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="10"
              fontWeight="900"
            >
              ৳
            </text>
          </motion.g>
        </g>

        {/* Rising +৳ Absorption Echo above Wallet */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], y: [4, -14, -22] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        >
          <text
            x="166"
            y="34"
            textAnchor="middle"
            fill="#059669"
            fontSize="12"
            fontWeight="900"
          >
            +৳
          </text>
        </motion.g>
      </svg>

      <span className="text-[11px] font-extrabold text-emerald-700 mt-1">
        ওয়ালেটে টাকা যুক্ত ও যাচাই হচ্ছে
      </span>
    </div>
  );
};

export const PaymentVerificationModal: React.FC<PaymentVerificationModalProps> = ({
  isOpen,
  paymentData,
  onSuccess,
  onCloseForEdit,
}) => {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<'VERIFYING' | 'SUCCESS' | 'ERROR'>('VERIFYING');
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [attemptKey, setAttemptKey] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [verifiedRecord, setVerifiedRecord] = useState<DonationRecord | null>(null);
  const [finalizing, setFinalizing] = useState<boolean>(false);
  const [notifEnabled, setNotifEnabled] = useState<boolean>(() => isNotificationSystemActive());
  const [notifEnabling, setNotifEnabling] = useState<boolean>(false);

  // Refs to hold latest DB check outcome and callback across the 30-second verification window
  const matchedSmsRef = useRef<DonationSmsLog | null>(null);
  const checkErrorRef = useRef<string | null>(null);
  const completionTriggeredRef = useRef<boolean>(false);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setNotifEnabled(isNotificationSystemActive());
    }
  }, [isOpen]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  // Lock body scroll while bottom sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !paymentData) {
      setPhase('VERIFYING');
      setElapsedMs(0);
      setErrorMessage('');
      setVerifiedRecord(null);
      matchedSmsRef.current = null;
      checkErrorRef.current = null;
      completionTriggeredRef.current = false;
      return;
    }

    let cancelled = false;
    setPhase('VERIFYING');
    setElapsedMs(0);
    setErrorMessage('');
    setVerifiedRecord(null);
    matchedSmsRef.current = null;
    checkErrorRef.current = null;
    completionTriggeredRef.current = false;

    const runDatabaseCheck = async () => {
      if (cancelled) return;
      try {
        const res = await checkSmsDatabaseMatch({
          paymentMethod: paymentData.paymentMethod,
          amount: paymentData.amount,
          transactionId: paymentData.transactionId,
          referenceCode: paymentData.referenceCode,
        });
        if (cancelled) return;
        if (res.status === 'MATCHED' && res.matchedSms) {
          matchedSmsRef.current = res.matchedSms;
          checkErrorRef.current = null;
        } else if (res.status === 'MISMATCH' || res.status === 'DUPLICATE') {
          matchedSmsRef.current = null;
          checkErrorRef.current =
            res.errorMessage || 'প্রদত্ত ট্রানজেকশন নম্বর বা টাকার অ্যামাউন্ট মেলেনি।';
        } else {
          matchedSmsRef.current = null;
          checkErrorRef.current = null;
        }
      } catch (err: any) {
        if (!cancelled) {
          console.warn('Verification DB check warning:', err?.message || err);
        }
      }
    };

    // Immediate check + real-time listener on incoming SMS logs + periodic check during 30s
    runDatabaseCheck();
    const unsubSms = subscribeSmsLogsForVerification(() => {
      runDatabaseCheck();
    });
    const periodicCheck = setInterval(() => {
      runDatabaseCheck();
    }, 3000);

    const startTime = Date.now();
    const tickInterval = setInterval(async () => {
      if (cancelled) return;
      const nowElapsed = Math.min(VERIFICATION_DURATION_MS, Date.now() - startTime);
      setElapsedMs(nowElapsed);

      if (nowElapsed >= VERIFICATION_DURATION_MS && !completionTriggeredRef.current) {
        completionTriggeredRef.current = true;
        clearInterval(tickInterval);
        clearInterval(periodicCheck);

        // Perform one final authoritative DB check at the 30-second mark
        await runDatabaseCheck();
        if (cancelled) return;

        if (matchedSmsRef.current) {
          setFinalizing(true);
          try {
            const finalized = await finalizeVerifiedDonationFromSms(
              {
                paymentMethod: paymentData.paymentMethod,
                amount: paymentData.amount,
                senderPhone: paymentData.senderPhone,
                transactionId: paymentData.transactionId,
                referenceCode: paymentData.referenceCode,
                donorName: paymentData.donorName,
                purpose: paymentData.purpose,
                note: paymentData.note,
              },
              matchedSmsRef.current
            );
            if (cancelled) return;
            const completedTxnNumber = generateTransactionNumber(
              finalized.referenceCode,
              finalized.verifiedAt || finalized.updatedAt || Date.now()
            );
            setVerifiedRecord(finalized);
            setPhase('SUCCESS');
            playPassSound();
            notifyPaymentCompleted({
              donationId: finalized.id,
              transactionNumber: completedTxnNumber,
              paymentMethod: finalized.paymentMethod,
              amount: finalized.amount,
              transactionId: finalized.transactionId,
              donorName: finalized.donorName,
            });
          } catch (err: any) {
            if (cancelled) return;
            const rawErr = String(err?.message || '');
            const friendlyErr = rawErr.startsWith('{')
              ? 'ডেটাবেজ যাচাই সম্পন্ন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
              : rawErr ||
                'পেমেন্ট নিশ্চিতকরণ সম্পন্ন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
            setErrorMessage(friendlyErr);
            setPhase('ERROR');
            playFailSound();
          } finally {
            if (!cancelled) setFinalizing(false);
          }
        } else {
          const cleanTrxUpper = String(paymentData.transactionId || '').toUpperCase();
          setErrorMessage(
            checkErrorRef.current ||
              `৩০ সেকেন্ড ডেটাবেজ ও SMS রিডার যাচাই করেও আপনার প্রদত্ত ট্রানজেকশন নম্বর (${cleanTrxUpper}) ও ৳ ${toBanglaDigits(
                paymentData.amount
              )} টাকার কোনো নিশ্চিতকরণ SMS পাওয়া যায়নি।`
          );
          setPhase('ERROR');
          playFailSound();
        }
      }
    }, 100);

    return () => {
      cancelled = true;
      clearInterval(tickInterval);
      clearInterval(periodicCheck);
      unsubSms();
    };
  }, [
    isOpen,
    attemptKey,
    paymentData?.paymentMethod,
    paymentData?.amount,
    paymentData?.senderPhone,
    paymentData?.transactionId,
    paymentData?.referenceCode,
  ]);

  // Automatically transition to Step 4 Receipt shortly after showing the Success confirmation
  useEffect(() => {
    if (phase !== 'SUCCESS' || !verifiedRecord) return;
    const t = setTimeout(() => {
      onSuccessRef.current(verifiedRecord);
    }, 1800);
    return () => clearTimeout(t);
  }, [phase, verifiedRecord]);

  const isBkash = paymentData?.paymentMethod === 'BKASH';
  const brandColor = isBkash ? '#E2136E' : '#EA580C';
  const progressFraction = Math.min(1, Math.max(0, elapsedMs / VERIFICATION_DURATION_MS));
  const progressPercent = Math.round(progressFraction * 100);
  const secondsRemaining = Math.max(
    0,
    Math.ceil((VERIFICATION_DURATION_MS - elapsedMs) / 1000)
  );

  const stageIndex =
    progressFraction < 0.25
      ? 0
      : progressFraction < 0.55
      ? 1
      : progressFraction < 0.85
      ? 2
      : 3;

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressFraction);

  const generatedTxnNumber = verifiedRecord
    ? generateTransactionNumber(
        verifiedRecord.referenceCode,
        verifiedRecord.verifiedAt || verifiedRecord.updatedAt || Date.now()
      )
    : '';

  const sheetMarkup = (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {isOpen && paymentData && (
          <div
            id="payment-verification-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-verification-title"
            className="fixed inset-0 z-[9999] flex items-end justify-center pointer-events-auto select-none font-bengali"
          >
            {/* Backdrop Scrim */}
            <motion.div
              id="payment-verification-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 bg-slate-950/55 backdrop-blur-md"
              onClick={() => {
                if (phase !== 'VERIFYING') {
                  onCloseForEdit(phase === 'ERROR' ? errorMessage : undefined);
                }
              }}
            />

            {/* Bottom Slide-Up Sheet Container */}
            <motion.div
              id="payment-verification-sheet"
              initial={{ y: '100%', opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-lg bg-white rounded-t-[32px] shadow-[0_-20px_60px_rgba(15,23,42,0.28)] border-t border-slate-200/90 flex flex-col max-h-[90dvh] overflow-hidden"
            >
              {/* Top Brand / Status Accent Bar */}
              <div
                className="h-1.5 w-full shrink-0 transition-colors duration-300"
                style={{
                  backgroundColor:
                    phase === 'SUCCESS'
                      ? '#059669'
                      : phase === 'ERROR'
                      ? '#E11D48'
                      : brandColor,
                }}
              />

              {/* Drag Handle Capsule & Sheet Header */}
              <div className="px-5 sm:px-7 pt-2.5 pb-3.5 border-b border-slate-100 shrink-0">
                <div className="w-12 h-1.5 bg-slate-300/85 rounded-full mx-auto mb-3" />

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <PaymentMethodLogo provider={paymentData.paymentMethod} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-black text-slate-900 truncate">
                          {isBkash ? 'বিকাশ (BKASH)' : 'নগদ (NAGAD)'} পেমেন্ট যাচাই
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 font-semibold tabular-nums mt-0.5">
                        <span className="font-black text-slate-900">
                          ৳ {toBanglaDigits(paymentData.amount)} টাকা
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono font-bold text-slate-700 uppercase">
                          TRXID: {paymentData.transactionId}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    id="btn-close-verification-sheet"
                    onClick={() => onCloseForEdit(phase === 'ERROR' ? errorMessage : undefined)}
                    aria-label="বন্ধ করুন"
                    className="min-w-[44px] min-h-[44px] rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Sheet Content */}
              <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5">
                {/* ==================== PHASE 1: 30-SECOND WALLET + TAKA ANIMATION & VERIFICATION ==================== */}
                {phase === 'VERIFYING' && (
                  <div className="space-y-5 text-center">
                    {/* Dual Visual Showcase: Taka Entering Wallet SVG + 30s Circular Countdown Ring */}
                    <div className="rounded-3xl bg-gradient-to-b from-slate-50 to-slate-100/75 border border-slate-200/80 p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-12 items-center gap-4">
                      {/* Left/Top: Money Entering Wallet SVG Scene */}
                      <div className="sm:col-span-7 flex items-center justify-center">
                        <WalletTakaTransferSvg
                          brandColor={brandColor}
                          amount={paymentData.amount}
                        />
                      </div>

                      {/* Right/Bottom: Circular 30-Second SVG Progress Ring */}
                      <div className="sm:col-span-5 flex flex-col items-center justify-center">
                        <div className="relative w-28 h-28 flex items-center justify-center">
                          {/* Subtle expanding radar pulse ring */}
                          <motion.div
                            animate={{ scale: [0.88, 1.16], opacity: [0.28, 0] }}
                            transition={{
                              duration: 2.0,
                              repeat: Infinity,
                              ease: 'easeOut',
                            }}
                            className="absolute inset-1.5 rounded-full border-2 pointer-events-none"
                            style={{ borderColor: brandColor }}
                          />

                          <svg
                            className="w-28 h-28 -rotate-90"
                            viewBox="0 0 104 104"
                            aria-hidden="true"
                          >
                            <circle
                              cx="52"
                              cy="52"
                              r={radius}
                              fill="none"
                              stroke="#e2e8f0"
                              strokeWidth="6.5"
                            />
                            <circle
                              cx="52"
                              cy="52"
                              r={radius}
                              fill="none"
                              stroke={brandColor}
                              strokeWidth="6.5"
                              strokeLinecap="round"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              style={{ transition: 'stroke-dashoffset 100ms linear' }}
                            />
                          </svg>

                          {/* Center Countdown Readout */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span
                              id="verification-countdown-seconds"
                              className="text-2xl sm:text-3xl font-black text-slate-950 tabular-nums leading-none"
                            >
                              {toBanglaDigits(secondsRemaining)}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500 mt-1">
                              সেকেন্ড বাকি
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Active Verification Status Headline */}
                    <div className="min-h-[54px] flex flex-col items-center justify-center">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={stageIndex}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.22 }}
                          className="space-y-1"
                        >
                          <h3
                            id="payment-verification-title"
                            className="text-base sm:text-lg font-black text-slate-900 leading-snug text-balance"
                          >
                            {finalizing
                              ? 'লেনদেন চূড়ান্ত করা হচ্ছে...'
                              : VERIFICATION_STAGES[stageIndex].title}
                          </h3>
                          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                            {VERIFICATION_STAGES[stageIndex].subtitle}
                          </p>
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Linear Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full w-full origin-left rounded-full"
                          style={{ backgroundColor: brandColor }}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: progressFraction }}
                          transition={{ duration: 0.12, ease: 'linear' }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 tabular-nums">
                        <span>ডেটাবেজ ও SMS রিডার যাচাই</span>
                        <span>{toBanglaDigits(progressPercent)}% সম্পন্ন</span>
                      </div>
                    </div>

                    {/* 4-Step Compact Verification Checklist */}
                    <div className="text-left space-y-2.5 pt-3 border-t border-slate-100">
                      {VERIFICATION_STAGES.map((st, idx) => {
                        const isDone = idx < stageIndex || finalizing;
                        const isCurrent = idx === stageIndex && !finalizing;
                        return (
                          <div
                            key={st.title}
                            className={`flex items-center gap-2.5 text-xs transition-opacity duration-200 ${
                              isDone
                                ? 'text-emerald-700 font-bold'
                                : isCurrent
                                ? 'text-slate-900 font-extrabold'
                                : 'text-slate-400 font-medium'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                isDone
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : isCurrent
                                  ? 'bg-slate-900 text-white'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {isDone ? (
                                <Check className="w-3 h-3" />
                              ) : isCurrent ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <span className="text-[10px] tabular-nums">
                                  {toBanglaDigits(idx + 1)}
                                </span>
                              )}
                            </div>
                            <span className="truncate">{st.title}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Notification System Status / Quick Enable Notice */}
                    {notifEnabled ? (
                      <div className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 text-[11px] font-bold text-emerald-800">
                        <BellRing className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          নোটিফিকেশন সিস্টেম চালু আছে — ৩০ সেকেন্ড পর পেমেন্ট সম্পন্ন হলেই নোটিফিকেশন পাবেন
                        </span>
                      </div>
                    ) : (
                      getNotificationPermissionStatus() === 'default' && (
                        <button
                          type="button"
                          id="btn-enable-notif-during-verify"
                          disabled={notifEnabling}
                          onClick={async () => {
                            setNotifEnabling(true);
                            try {
                              await requestNotificationPermissionAndToken();
                              setNotifEnabled(isNotificationSystemActive());
                            } finally {
                              setNotifEnabling(false);
                            }
                          }}
                          className="w-full min-h-[40px] px-3.5 py-2 rounded-2xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-[11px] font-bold text-teal-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <BellRing className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span>
                            {notifEnabling
                              ? 'নোটিফিকেশন চালু করা হচ্ছে...'
                              : '৩০ সেকেন্ড পর পেমেন্ট সম্পন্ন হলে অ্যালার্ট পেতে নোটিফিকেশন চালু করুন'}
                          </span>
                        </button>
                      )
                    )}

                    {/* Bottom Cancel / Edit Action */}
                    <div className="pt-1">
                      <button
                        type="button"
                        id="btn-cancel-verification"
                        onClick={() => onCloseForEdit()}
                        className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
                      >
                        বাতিল করে তথ্য সংশোধন করুন
                      </button>
                    </div>
                  </div>
                )}

                {/* ==================== PHASE 2: VERIFIED SUCCESS ==================== */}
                {phase === 'SUCCESS' && verifiedRecord && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5 py-2 text-center"
                  >
                    <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-9 h-9" />
                    </div>

                    <div className="space-y-1.5">
                      <h3
                        id="payment-verification-title"
                        className="text-xl font-black text-slate-900 tracking-tight"
                      >
                        পেমেন্ট সফলভাবে নিশ্চিত হয়েছে!
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        SMS রিডার থেকে প্রাপ্ত তথ্যের সাথে আপনার ট্রানজেকশন নম্বর (TRXID) ও{' '}
                        <strong className="text-slate-900 tabular-nums">
                          ৳ {toBanglaDigits(verifiedRecord.amount)} টাকা
                        </strong>{' '}
                        শতভাগ মিলেছে।
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-1">
                      <span className="text-[11px] font-bold text-emerald-800 block">
                        স্বয়ংক্রিয় সম্পন্ন লেনদেন নম্বর
                      </span>
                      <span className="font-mono text-base font-black text-emerald-950 tabular-nums uppercase block">
                        {generatedTxnNumber}
                      </span>
                    </div>

                    <button
                      type="button"
                      id="btn-proceed-to-receipt"
                      onClick={() => onSuccess(verifiedRecord)}
                      className="w-full min-h-[48px] px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black shadow-xs transition-all cursor-pointer"
                    >
                      ডিজিটাল অনুদান রসিদ দেখুন
                    </button>
                  </motion.div>
                )}

                {/* ==================== PHASE 3: VERIFICATION FAILED (ERROR) ==================== */}
                {phase === 'ERROR' && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-5 py-1 text-center"
                  >
                    <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-9 h-9" />
                    </div>

                    <div className="space-y-1.5">
                      <h3
                        id="payment-verification-title"
                        className="text-xl font-black text-slate-900 tracking-tight"
                      >
                        পেমেন্ট যাচাই সম্পন্ন হয়নি (ত্রুটি)
                      </h3>
                      <p
                        id="verification-error-message"
                        className="text-xs sm:text-sm font-semibold text-rose-700 leading-relaxed"
                      >
                        {errorMessage}
                      </p>
                    </div>

                    {/* Clear Verification Checklist for User */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-1.5 text-xs text-slate-600 leading-relaxed">
                      <p className="font-black text-slate-900">
                        অনুগ্রহ করে নিচের বিষয়গুলো মিলিয়ে দেখুন:
                      </p>
                      <p>
                        ১. SMS-এ প্রাপ্ত ট্রানজেকশন আইডি (TRXID / TXNID) হুবহু সঠিক লেখা হয়েছে কিনা।
                      </p>
                      <p>
                        ২. প্রেরিত টাকার পরিমাণ (
                        <strong>৳ {toBanglaDigits(paymentData.amount)} টাকা</strong>) ও পেমেন্ট মাধ্যম (
                        <strong>{isBkash ? 'বিকাশ (BKASH)' : 'নগদ (NAGAD)'}</strong>) সঠিক আছে কিনা।
                      </p>
                      <p>৩. আপনার মোবাইল থেকে সত্যিই টাকা পাঠানো সম্পন্ন হয়েছে কিনা।</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2.5 pt-1">
                      <button
                        type="button"
                        id="btn-retry-verification"
                        onClick={() => setAttemptKey((prev) => prev + 1)}
                        className="w-full min-h-[48px] px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-black shadow-xs transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4 shrink-0" />
                        <span>পুনরায় ৩০ সেকেন্ড যাচাই করুন</span>
                      </button>

                      <button
                        type="button"
                        id="btn-edit-payment-info"
                        onClick={() => onCloseForEdit(errorMessage)}
                        className="w-full min-h-[48px] px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4 shrink-0" />
                        <span>তথ্য সংশোধন করুন</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );

  if (!mounted || typeof document === 'undefined') {
    return sheetMarkup;
  }

  return createPortal(sheetMarkup, document.body);
};
