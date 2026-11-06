import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  HeartHandshake,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Smartphone,
  ShieldCheck,
  Printer,
  RefreshCw,
  ArrowRight,
  Wallet,
  History,
  Receipt,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  DonationConfig,
  DonationPaymentMethod,
  DonationPurpose,
  DonationRecord,
  SystemSettings,
  TransactionRecord,
} from '../../types';
import {
  DEFAULT_DONATION_CONFIG,
  DONATION_PURPOSE_OPTIONS,
  QUICK_DONATION_AMOUNTS,
  formatTransactionDateTimeBangla,
  generateDonationReference,
  generateTransactionNumber,
  getDonationRecordForTransaction,
  getPurposeLabel,
  getSavedUserDonationIds,
  lookupDonations,
  maskPhoneNumberBangla,
  normalizeBdPhone,
  normalizeTrxId,
  subscribeDonationById,
  subscribeTransactions,
} from '../../services/donationService';
import { toBanglaDigits, toEnglishDigits } from '../../utils/bangla';
import { DpibBrandTitle } from '../common/DpibBrandTitle';
import { PaymentMethodLogo } from '../common/PaymentMethodLogo';
import { PaymentVerificationModal } from './PaymentVerificationModal';

interface DonationPageProps {
  settings: SystemSettings | null;
  onBack: () => void;
  initialMode?: 'WIZARD' | 'HISTORY' | 'LOOKUP';
}

type WizardStep = 1 | 2 | 3 | 4;

const WIZARD_STEPS: { step: WizardStep; shortTitle: string; fullTitle: string }[] = [
  { step: 1, shortTitle: 'পরিমাণ ও খাত', fullTitle: 'অনুদানের পরিমাণ ও খাত নির্ধারণ' },
  { step: 2, shortTitle: 'মাধ্যম ও নম্বর', fullTitle: 'পেমেন্ট মাধ্যম ও টাকা পাঠানো' },
  { step: 3, shortTitle: 'তথ্য যাচাই', fullTitle: 'ট্রানজেকশন তথ্য নিশ্চিতকরণ' },
  { step: 4, shortTitle: 'ডিজিটাল রসিদ', fullTitle: 'ডিজিটাল অনুদান রসিদ' },
];

export const DonationPage: React.FC<DonationPageProps> = ({
  settings,
  onBack,
  initialMode = 'WIZARD',
}) => {
  const config: DonationConfig = {
    ...DEFAULT_DONATION_CONFIG,
    ...(settings?.donationConfig || {}),
  };

  // Top-level mode: Multi-step Wizard ('WIZARD'), Transaction History ('HISTORY'), or Lookup ('LOOKUP')
  const [pageMode, setPageMode] = useState<'WIZARD' | 'HISTORY' | 'LOOKUP'>(initialMode);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Form States
  const [amount, setAmount] = useState<number>(50);
  const [customAmountInput, setCustomAmountInput] = useState<string>('50');
  const [purpose, setPurpose] = useState<DonationPurpose>('APP_DEVELOPMENT');
  const [paymentMethod, setPaymentMethod] = useState<DonationPaymentMethod>('BKASH');
  const [referenceCode, setReferenceCode] = useState<string>(() => generateDonationReference());
  const [senderPhone, setSenderPhone] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // UI Feedback & 30-Second Verification Modal States
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [pendingVerificationPayload, setPendingVerificationPayload] = useState<{
    paymentMethod: DonationPaymentMethod;
    amount: number;
    senderPhone: string;
    transactionId: string;
    referenceCode: string;
    donorName?: string;
    purpose: string;
    note?: string;
  } | null>(null);

  // Active Submitted Receipt & Live Listener (Step 4)
  const [submittedDonation, setSubmittedDonation] = useState<DonationRecord | null>(null);

  // Status Lookup States
  const [lookupQuery, setLookupQuery] = useState<string>('');
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupResults, setLookupResults] = useState<DonationRecord[]>([]);
  const [lookupSearched, setLookupSearched] = useState<boolean>(false);

  // Real-time Auto-Generated Transaction History States
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState<boolean>(true);
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'MINE' | 'BKASH' | 'NAGAD'>('ALL');
  const [historySearch, setHistorySearch] = useState<string>('');
  const [loadingReceiptTxnId, setLoadingReceiptTxnId] = useState<string | null>(null);
  const [myDonationIds, setMyDonationIds] = useState<string[]>(() => getSavedUserDonationIds());

  useEffect(() => {
    setPageMode(initialMode);
  }, [initialMode]);

  // Real-time Firestore listener for completed auto-generated transactions
  useEffect(() => {
    const unsub = subscribeTransactions(
      (items) => {
        setTransactions(items);
        setTransactionsLoading(false);
        setMyDonationIds(getSavedUserDonationIds());
      },
      (err) => {
        console.warn('Transactions subscription warning:', err.message);
        setTransactionsLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Real-time Firestore listener so the receipt flips from অপেক্ষমাণ -> সম্পন্ন automatically
  // when the Android SMS Reading App webhook or Admin verifies the payment
  useEffect(() => {
    if (!submittedDonation?.id) return;
    setMyDonationIds(getSavedUserDonationIds());
    const unsub = subscribeDonationById(submittedDonation.id, (updated) => {
      if (updated) {
        setSubmittedDonation(updated);
      }
    });
    return () => unsub();
  }, [submittedDonation?.id]);

  const activeAccountNumber =
    paymentMethod === 'BKASH' ? config.bkashNumber : config.nagadNumber;
  const activeAccountType =
    paymentMethod === 'BKASH' ? config.bkashAccountType : config.nagadAccountType;

  const getAccountTypeBangla = (accType: 'PERSONAL' | 'MERCHANT' | 'AGENT') => {
    if (accType === 'MERCHANT') return 'মার্চেন্ট — পেমেন্ট করুন';
    if (accType === 'AGENT') return 'এজেন্ট — ক্যাশ আউট করুন';
    return 'পার্সোনাল — সেন্ড মানি করুন';
  };

  const scrollToTopSmooth = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPresetAmount = (val: number) => {
    setAmount(val);
    setCustomAmountInput(String(val));
    setErrorMsg(null);
  };

  const handleCustomAmountChange = (raw: string) => {
    const cleaned = toEnglishDigits(raw).replace(/[^\d]/g, '');
    setCustomAmountInput(cleaned);
    const num = Number(cleaned);
    setAmount(isNaN(num) ? 0 : num);
    setErrorMsg(null);
  };

  const handleCopyText = async (text: string, type: 'NUMBER' | 'REF') => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    if (type === 'NUMBER') {
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2000);
    } else {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handleNextStep = () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!amount || amount < 10) {
        setErrorMsg('অনুগ্রহ করে ন্যূনতম ১০ টাকা বা তার বেশি অনুদানের পরিমাণ নির্বাচন করুন।');
        return;
      }
      setCurrentStep(2);
      scrollToTopSmooth();
      return;
    }

    if (currentStep === 2) {
      setCurrentStep(3);
      scrollToTopSmooth();
    }
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    if (currentStep === 2) {
      setCurrentStep(1);
      scrollToTopSmooth();
    } else if (currentStep === 3) {
      setCurrentStep(2);
      scrollToTopSmooth();
    }
  };

  const handleSubmitDonation = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!amount || amount < 10) {
      setErrorMsg('অনুগ্রহ করে ন্যূনতম ১০ টাকা বা তার বেশি অনুদানের পরিমাণ নির্বাচন করুন।');
      setCurrentStep(1);
      return;
    }

    const normalizedPhone = normalizeBdPhone(senderPhone);
    if (!/^01[3-9]\d{8}$/.test(normalizedPhone)) {
      setErrorMsg(
        'সঠিক ১১-সংখ্যার মোবাইল নম্বর লিখুন যে নম্বর থেকে টাকা পাঠিয়েছেন (যেমন: ০১৭XXXXXXXX)।'
      );
      return;
    }

    const cleanTrx = normalizeTrxId(transactionId);
    if (cleanTrx.length < 5) {
      setErrorMsg(
        paymentMethod === 'BKASH'
          ? 'বিকাশ এসএমএস-এ প্রাপ্ত সঠিক ট্রানজেকশন আইডি লিখুন।'
          : 'নগদ এসএমএস-এ প্রাপ্ত সঠিক ট্রানজেকশন আইডি লিখুন।'
      );
      return;
    }

    // Open the 15-second animated database & SMS Reader verification modal instead of succeeding immediately
    setPendingVerificationPayload({
      paymentMethod,
      amount,
      senderPhone: normalizedPhone,
      transactionId: cleanTrx,
      referenceCode,
      donorName,
      purpose,
      note,
    });
    setVerificationModalOpen(true);
  };

  const handleResetForNewDonation = () => {
    setSubmittedDonation(null);
    setReferenceCode(generateDonationReference());
    setTransactionId('');
    setNote('');
    setErrorMsg(null);
    setCurrentStep(1);
    setPageMode('WIZARD');
    scrollToTopSmooth();
  };

  const handleLookupSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = lookupQuery.trim();
    if (!clean) return;
    setLookupLoading(true);
    setLookupSearched(true);
    try {
      const found = await lookupDonations(clean);
      setLookupResults(found);
    } catch (err) {
      console.error('Donation lookup error:', err);
      setLookupResults([]);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleOpenReceiptFromTransaction = async (txn: TransactionRecord) => {
    setLoadingReceiptTxnId(txn.id);
    try {
      const record = await getDonationRecordForTransaction(txn);
      setSubmittedDonation(record);
      setCurrentStep(4);
      setPageMode('WIZARD');
      scrollToTopSmooth();
    } finally {
      setLoadingReceiptTxnId(null);
    }
  };

  const myTransactionsCount = transactions.filter((t) =>
    myDonationIds.includes(t.donationId)
  ).length;
  const totalCompletedAmount = transactions.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0
  );
  const filteredTransactions = transactions.filter((t) => {
    if (historyFilter === 'MINE' && !myDonationIds.includes(t.donationId)) return false;
    if (historyFilter === 'BKASH' && t.paymentMethod !== 'BKASH') return false;
    if (historyFilter === 'NAGAD' && t.paymentMethod !== 'NAGAD') return false;
    if (!historySearch.trim()) return true;
    const q = toEnglishDigits(historySearch.trim()).toLowerCase();
    return (
      t.transactionNumber.toLowerCase().includes(q) ||
      t.referenceCode.toLowerCase().includes(q) ||
      t.gatewayTrxId.toLowerCase().includes(q) ||
      (t.donorName || '').toLowerCase().includes(q) ||
      t.senderPhone.toLowerCase().includes(q)
    );
  });

  const activeReceiptTransactionNumber = submittedDonation
    ? transactions.find((t) => t.donationId === submittedDonation.id)?.transactionNumber ||
      generateTransactionNumber(
        submittedDonation.referenceCode,
        submittedDonation.verifiedAt || submittedDonation.updatedAt || Date.now()
      )
    : '';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-9 space-y-6 font-bengali text-slate-800">
      {/* Top Bar: Back Button & Mode Switcher */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          id="btn-donation-back-home"
          onClick={onBack}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-2xl bg-white/95 hover:bg-white text-slate-700 hover:text-slate-950 border border-slate-200/90 hover:border-slate-300 shadow-2xs transition-all active:scale-95 text-xs sm:text-sm font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600 shrink-0" />
          <span>হোমে ফিরে যান</span>
        </button>

        <div className="flex flex-wrap items-center gap-1 bg-slate-200/75 p-1 rounded-2xl border border-slate-200/90">
          <button
            type="button"
            id="btn-tab-make-donation"
            onClick={() => setPageMode('WIZARD')}
            className={`min-h-[40px] px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              pageMode === 'WIZARD'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {submittedDonation && currentStep === 4 ? 'বর্তমান রসিদ' : 'ধাপে ধাপে অনুদান'}
          </button>
          <button
            type="button"
            id="btn-tab-transaction-history"
            onClick={() => setPageMode('HISTORY')}
            className={`min-h-[40px] px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              pageMode === 'HISTORY'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span>
              লেনদেন হিস্ট্রি
              {transactions.length > 0 ? ` (${toBanglaDigits(transactions.length)})` : ''}
            </span>
          </button>
          <button
            type="button"
            id="btn-tab-lookup-donation"
            onClick={() => setPageMode('LOOKUP')}
            className={`min-h-[40px] px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              pageMode === 'LOOKUP'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span>যাচাই ও রসিদ</span>
          </button>
        </div>
      </div>

      {/* ================= VIEW C: REAL-TIME COMPLETED TRANSACTION HISTORY ================= */}
      {pageMode === 'HISTORY' && (
        <motion.div
          key="history-view"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-5"
        >
          {/* Summary Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 block">মোট সম্পন্ন লেনদেন</span>
              <span className="text-2xl font-black text-slate-950 tabular-nums mt-1 block">
                {toBanglaDigits(transactions.length)} টি
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
                প্রতিটি নিশ্চিত পেমেন্টের অটো রেকর্ড
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 block">মোট সংগৃহীত তহবিল</span>
              <span className="text-2xl font-black text-emerald-700 tabular-nums mt-1 block">
                ৳ {toBanglaDigits(totalCompletedAmount)} টাকা
              </span>
              <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
                অ্যাপ উন্নয়ন ও মানবিক কল্যাণ খাত
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-500 block">অনুমোদিত পেমেন্ট মাধ্যম</span>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5">
                  <PaymentMethodLogo provider="BKASH" size="xs" />
                  <span className="text-xs font-black text-[#E2136E]">বিকাশ</span>
                </div>
                <span className="text-slate-300">·</span>
                <div className="flex items-center gap-1.5">
                  <PaymentMethodLogo provider="NAGAD" size="xs" />
                  <span className="text-xs font-black text-[#EA580C]">নগদ</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                তাৎক্ষণিক ডিজিটাল লেনদেন রসিদ
              </span>
            </div>
          </div>

          {/* Transaction List Card */}
          <div className="bg-white rounded-[28px] border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-5 sm:p-7 border-b border-slate-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    নিশ্চিতকৃত লেনদেন হিস্ট্রি
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
                    পেমেন্ট নিশ্চিত হওয়া মাত্রই স্বয়ংক্রিয়ভাবে একটি লেনদেন তৈরি হয় এবং এখানে যুক্ত হয়।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    setPageMode('WIZARD');
                    scrollToTopSmooth();
                  }}
                  className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer self-start sm:self-center shrink-0 transition-all"
                >
                  <HeartHandshake className="w-4 h-4 shrink-0" />
                  <span>নতুন অনুদান প্রদান করুন</span>
                </button>
              </div>

              {/* Filter Tabs & Search Box */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: 'ALL', label: `সকল (${toBanglaDigits(transactions.length)})` },
                      { id: 'MINE', label: `আমার লেনদেন (${toBanglaDigits(myTransactionsCount)})` },
                      { id: 'BKASH', label: 'বিকাশ' },
                      { id: 'NAGAD', label: 'নগদ' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setHistoryFilter(f.id)}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        historyFilter === f.id
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="relative sm:w-64">
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="লেনদেন নম্বর বা রেফারেন্স খুঁজুন..."
                    className="w-full min-h-[40px] pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 outline-none transition-all tabular-nums"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {transactionsLoading ? (
              <div className="p-10 text-center text-xs sm:text-sm font-bold text-slate-500">
                লেনদেন হিস্ট্রি লোড হচ্ছে...
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Receipt className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-800">
                    {historyFilter === 'MINE'
                      ? 'আপনার ব্রাউজার থেকে এখনো কোনো সম্পন্ন লেনদেন পাওয়া যায়নি'
                      : 'কোনো সম্পন্ন লেনদেন পাওয়া যায়নি'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    অনুদান পেমেন্ট নিশ্চিত হওয়া মাত্রই স্বয়ংক্রিয়ভাবে লেনদেন নম্বর তৈরি হয়ে এই তালিকায় যুক্ত হবে।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    setPageMode('WIZARD');
                    scrollToTopSmooth();
                  }}
                  className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-2"
                >
                  <span>এখনই অনুদান প্রদান করুন</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200/80">
                {filteredTransactions.map((txn) => {
                  const isMine = myDonationIds.includes(txn.donationId);
                  return (
                    <div
                      key={txn.id}
                      className="p-4 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        <PaymentMethodLogo provider={txn.paymentMethod} size="md" />
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                            <span className="font-mono font-black text-slate-950 tabular-nums">
                              {txn.transactionNumber}
                            </span>
                            <span className="text-slate-300" aria-hidden="true">
                              ·
                            </span>
                            <span
                              className={`font-black ${
                                txn.paymentMethod === 'BKASH'
                                  ? 'text-[#E2136E]'
                                  : 'text-[#EA580C]'
                              }`}
                            >
                              {txn.paymentMethod === 'BKASH' ? 'বিকাশ' : 'নগদ'}
                            </span>
                            <span className="text-slate-300" aria-hidden="true">
                              ·
                            </span>
                            <span className="text-emerald-700 font-black">সম্পন্ন</span>
                            {isMine && (
                              <>
                                <span className="text-slate-300" aria-hidden="true">
                                  ·
                                </span>
                                <span className="text-blue-700 font-black">আপনার লেনদেন</span>
                              </>
                            )}
                          </div>

                          <p className="text-base sm:text-lg font-black text-slate-900 tabular-nums">
                            ৳ {toBanglaDigits(txn.amount)} টাকা — {txn.donorName || 'শুভাকাঙ্ক্ষী'}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] sm:text-xs text-slate-500">
                            <span>খাত: {getPurposeLabel(txn.purpose)}</span>
                            <span className="text-slate-300" aria-hidden="true">
                              ·
                            </span>
                            <span className="font-mono tabular-nums">
                              রেফারেন্স: {txn.referenceCode}
                            </span>
                            <span className="text-slate-300" aria-hidden="true">
                              ·
                            </span>
                            <span className="font-mono tabular-nums">
                              নম্বর:{' '}
                              {isMine
                                ? toBanglaDigits(txn.senderPhone)
                                : maskPhoneNumberBangla(txn.senderPhone)}
                            </span>
                            {txn.completedAt > 0 && (
                              <>
                                <span className="text-slate-300" aria-hidden="true">
                                  ·
                                </span>
                                <span>{formatTransactionDateTimeBangla(txn.completedAt)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <span className="text-[11px] font-bold text-slate-500">
                          {txn.verificationSource === 'AUTO_SMS_APP'
                            ? 'অটো এসএমএস যাচাই'
                            : 'অ্যাডমিন অনুমোদিত'}
                        </span>
                        <button
                          type="button"
                          disabled={loadingReceiptTxnId === txn.id}
                          onClick={() => handleOpenReceiptFromTransaction(txn)}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>
                            {loadingReceiptTxnId === txn.id ? 'খুলছে...' : 'রসিদ দেখুন'}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ================= VIEW A: STATUS LOOKUP / VERIFICATION ================= */}
      {pageMode === 'LOOKUP' && (
        <motion.div
          key="lookup-view"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-[28px] border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6"
        >
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              অনুদানের অবস্থা যাচাই করুন
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
              আপনার ট্রানজেকশন আইডি, রেফারেন্স কোড অথবা মোবাইল নম্বর দিয়ে যাচাই ও ডিজিটাল রসিদ সংগ্রহ করুন।
            </p>
          </div>

          <form onSubmit={handleLookupSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="ট্রানজেকশন আইডি, রেফারেন্স কোড অথবা মোবাইল নম্বর লিখুন..."
                className="w-full min-h-[48px] pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 outline-none transition-all tabular-nums"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              disabled={lookupLoading || !lookupQuery.trim()}
              className="min-h-[48px] px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-extrabold transition-all shadow-2xs disabled:opacity-50 cursor-pointer shrink-0"
            >
              {lookupLoading ? 'খোঁজা হচ্ছে...' : 'তথ্য খুঁজুন'}
            </button>
          </form>

          {lookupSearched && (
            <div className="space-y-3 pt-2">
              {lookupResults.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1.5">
                  <p className="text-sm font-bold text-slate-800">কোনো অনুদান রেকর্ড পাওয়া যায়নি</p>
                  <p className="text-xs text-slate-500">
                    অনুগ্রহ করে ট্রানজেকশন আইডি বা রেফারেন্স কোডটি সঠিকভাবে লিখেছেন কিনা নিশ্চিত করুন।
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200/80 border border-slate-200/80 rounded-2xl overflow-hidden">
                  {lookupResults.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 bg-white hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <PaymentMethodLogo provider={item.paymentMethod} size="md" />
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-semibold">
                            <span className="font-mono font-black text-slate-900 tabular-nums">
                              {item.referenceCode}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={`font-black ${
                                item.paymentMethod === 'BKASH'
                                  ? 'text-[#E2136E]'
                                  : 'text-[#EA580C]'
                              }`}
                            >
                              {item.paymentMethod === 'BKASH' ? 'বিকাশ' : 'নগদ'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums truncate">
                              আইডি: {item.transactionId}
                            </span>
                          </div>
                          <p className="text-base sm:text-lg font-black text-slate-900 tabular-nums">
                            ৳ {toBanglaDigits(item.amount)} টাকা — {item.donorName || 'শুভাকাঙ্ক্ষী'}
                          </p>
                          <p className="text-xs text-slate-500">
                            খাত: {getPurposeLabel(item.purpose)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                        <span
                          className={`text-xs font-black ${
                            item.status === 'VERIFIED'
                              ? 'text-emerald-700'
                              : item.status === 'REJECTED'
                              ? 'text-rose-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {item.status === 'VERIFIED'
                            ? 'যাচাই সম্পন্ন'
                            : item.status === 'REJECTED'
                            ? 'যাচাই ব্যর্থ'
                            : 'যাচাই অপেক্ষমাণ'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSubmittedDonation(item);
                            setCurrentStep(4);
                            setPageMode('WIZARD');
                            scrollToTopSmooth();
                          }}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                        >
                          রসিদ দেখুন
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* ================= VIEW B: MULTI-PAGE STEP-BY-STEP WIZARD ================= */}
      {pageMode === 'WIZARD' && (
        <div className="space-y-5">
          {/* 4-Step Visual Progress Stepper */}
          <div className="no-print bg-white rounded-3xl border border-slate-200/90 p-3.5 sm:p-5 shadow-2xs">
            <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
              {WIZARD_STEPS.map((st) => {
                const isCompleted = currentStep > st.step || (st.step === 4 && currentStep === 4);
                const isActive = currentStep === st.step;
                const canJumpBack = st.step < currentStep && currentStep < 4;

                return (
                  <button
                    key={st.step}
                    type="button"
                    disabled={!canJumpBack}
                    onClick={() => {
                      if (canJumpBack) {
                        setErrorMsg(null);
                        setCurrentStep(st.step);
                        scrollToTopSmooth();
                      }
                    }}
                    className={`flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 p-2 sm:px-3.5 sm:py-2.5 rounded-2xl text-center sm:text-left transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : isCompleted
                        ? 'bg-emerald-50/90 text-emerald-900 border border-emerald-200/80'
                        : 'bg-slate-50/70 text-slate-400'
                    } ${canJumpBack ? 'cursor-pointer hover:bg-emerald-100/80' : 'cursor-default'}`}
                  >
                    <span
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl text-xs font-black tabular-nums flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-white text-slate-900'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200/80 text-slate-500'
                      }`}
                    >
                      {isCompleted && !isActive ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        toBanglaDigits(st.step)
                      )}
                    </span>
                    <div className="min-w-0">
                      <span
                        className={`block text-[10px] font-bold leading-none ${
                          isActive
                            ? 'text-slate-300'
                            : isCompleted
                            ? 'text-emerald-700'
                            : 'text-slate-400'
                        }`}
                      >
                        ধাপ {toBanglaDigits(st.step)}
                      </span>
                      <span className="block text-[11px] sm:text-xs font-black truncate mt-0.5">
                        {st.shortTitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* ==================== PAGE 1: STEP 1 — AMOUNT & PURPOSE ==================== */}
            {currentStep === 1 && (
              <motion.div
                key="wizard-step-1"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
                className="space-y-5"
              >
                {/* Warm Editorial Intro Card */}
                <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-500">
                    <span className="inline-flex items-center gap-1.5 text-rose-700">
                      <HeartHandshake className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>প্রথম ধাপ · স্বেচ্ছায় অনুদান ও মানবিক সহায়তা</span>
                    </span>
                    <span className="tabular-nums text-slate-500">ধাপ ১ / ৪</span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug text-balance">
                    {config.donationTitle}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                    {config.donationDescription}
                  </p>

                  <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 font-semibold">
                    <span className="inline-flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>সর্বনিম্ন অনুদান ১০ টাকা</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-[#E2136E] shrink-0" />
                      <span>বিকাশ ও নগদ পেমেন্ট</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>স্বয়ংক্রিয় যাচাই ও রসিদ</span>
                    </span>
                  </div>
                </div>

                {/* Step 1 Main Card: Amount & Purpose */}
                <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-xs font-bold text-blue-700 block">
                        প্রথম ধাপ
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900">
                        অনুদানের পরিমাণ ও খাত নির্ধারণ করুন
                      </h2>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 font-semibold block">
                        নির্বাচিত পরিমাণ
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
                        ৳ {toBanglaDigits(amount || 0)} টাকা
                      </span>
                    </div>
                  </div>

                  {/* Preset Amount Buttons */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-slate-700">
                      দ্রুত পরিমাণ নির্বাচন করুন (৳ ১০ থেকে শুরু):
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                      {QUICK_DONATION_AMOUNTS.map((preset) => {
                        const isSelected = amount === preset;
                        return (
                          <button
                            key={preset}
                            type="button"
                            id={`btn-amount-${preset}`}
                            onClick={() => handleSelectPresetAmount(preset)}
                            className={`min-h-[48px] py-3 px-3 rounded-2xl text-sm sm:text-base font-black tabular-nums transition-all border cursor-pointer ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                            }`}
                          >
                            ৳ {toBanglaDigits(preset)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Amount Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="input-custom-donation-amount"
                        className="block text-xs font-bold text-slate-700"
                      >
                        অথবা আপনার পছন্দের পরিমাণ লিখুন (ন্যূনতম ১০ টাকা){' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-500 text-base">
                          ৳
                        </span>
                        <input
                          id="input-custom-donation-amount"
                          type="text"
                          inputMode="numeric"
                          value={customAmountInput}
                          onChange={(e) => handleCustomAmountChange(e.target.value)}
                          placeholder="১০ বা তার বেশি লিখুন"
                          className="w-full min-h-[48px] pl-10 pr-16 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-black text-slate-900 tabular-nums focus:bg-white focus:border-slate-900 outline-none transition-all font-mono"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                          টাকা
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
                      আপনি <strong className="text-slate-900">৳১০, ৳২০, ৳৫০, ৳১০০, ৳৫০০</strong> কিংবা আপনার সামর্থ্য অনুযায়ী যেকোনো পরিমাণ অনুদান দিতে পারবেন।
                    </div>
                  </div>

                  {/* Purpose Selection */}
                  <div className="space-y-2.5 pt-1">
                    <label className="block text-xs font-bold text-slate-700">
                      কোন কল্যাণমূলক কাজে সহায়তা করতে চান?
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {DONATION_PURPOSE_OPTIONS.map((opt) => {
                        const active = purpose === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setPurpose(opt.id)}
                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              active
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                : 'bg-slate-50/70 hover:bg-slate-100/80 text-slate-900 border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span
                                className={`text-xs sm:text-sm font-extrabold leading-snug ${
                                  active ? 'text-white' : 'text-slate-900'
                                }`}
                              >
                                {opt.label}
                              </span>
                              <span
                                className={`w-5 h-5 rounded-lg border shrink-0 mt-0.5 flex items-center justify-center ${
                                  active
                                    ? 'border-white bg-white text-slate-900'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {active && <Check className="w-3.5 h-3.5" />}
                              </span>
                            </div>
                            <p
                              className={`text-[11px] mt-1.5 leading-relaxed ${
                                active ? 'text-slate-300' : 'text-slate-500'
                              }`}
                            >
                              {opt.subtitle}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {errorMsg && (
                    <div
                      id="donation-form-error"
                      className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm font-bold text-rose-800 flex items-start gap-2.5"
                    >
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Step 1 Next Button */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="button"
                      id="btn-wizard-next"
                      onClick={handleNextStep}
                      className="w-full sm:w-auto min-h-[48px] px-7 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm sm:text-base font-black shadow-sm transition-all active:scale-[0.99] inline-flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <span>পরবর্তী ধাপ</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ==================== PAGE 2: STEP 2 — PAYMENT METHOD & NUMBER ==================== */}
            {currentStep === 2 && (
              <motion.div
                key="wizard-step-2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
                className="bg-white rounded-[28px] border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6"
              >
                {/* Step Header & Selected Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-bold text-blue-700 block">
                      দ্বিতীয় ধাপ
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900">
                      বিকাশ বা নগদে টাকা পাঠান
                    </h2>
                  </div>

                  <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80">
                    <span className="font-black text-slate-900 tabular-nums">
                      ৳ {toBanglaDigits(amount)} টাকা
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate max-w-[170px] font-semibold">
                      {getPurposeLabel(purpose)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-blue-700 hover:underline font-bold cursor-pointer ml-1 shrink-0"
                    >
                      পরিবর্তন
                    </button>
                  </div>
                </div>

                {/* Official bKash & Nagad Selector Cards */}
                <div className="space-y-2.5">
                  <span className="block text-xs font-bold text-slate-700">
                    পেমেন্ট মাধ্যম নির্বাচন করুন:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* bKash Card */}
                    <button
                      type="button"
                      id="btn-method-bkash"
                      onClick={() => setPaymentMethod('BKASH')}
                      className={`min-h-[76px] p-4 sm:p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        paymentMethod === 'BKASH'
                          ? 'border-[#E2136E] bg-[#E2136E]/[0.04] shadow-2xs'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <PaymentMethodLogo provider="BKASH" size="lg" />
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                            বিকাশ
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 truncate">
                            {getAccountTypeBangla(config.bkashAccountType)}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          paymentMethod === 'BKASH'
                            ? 'border-[#E2136E] bg-[#E2136E]'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {paymentMethod === 'BKASH' && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                    </button>

                    {/* Nagad Card */}
                    <button
                      type="button"
                      id="btn-method-nagad"
                      onClick={() => setPaymentMethod('NAGAD')}
                      className={`min-h-[76px] p-4 sm:p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        paymentMethod === 'NAGAD'
                          ? 'border-[#EA580C] bg-[#EA580C]/[0.04] shadow-2xs'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <PaymentMethodLogo provider="NAGAD" size="lg" />
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                            নগদ
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 truncate">
                            {getAccountTypeBangla(config.nagadAccountType)}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          paymentMethod === 'NAGAD'
                            ? 'border-[#EA580C] bg-[#EA580C]'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {paymentMethod === 'NAGAD' && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Active Payment Number & Reference Card */}
                <div
                  className={`p-5 sm:p-6 rounded-2xl border space-y-5 ${
                    paymentMethod === 'BKASH'
                      ? 'bg-pink-50/45 border-[#E2136E]/25'
                      : 'bg-orange-50/45 border-[#EA580C]/25'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <PaymentMethodLogo provider={paymentMethod} size="md" />
                      <div>
                        <span className="text-xs font-bold text-slate-600 block">
                          অফিসিয়াল {paymentMethod === 'BKASH' ? 'বিকাশ' : 'নগদ'} নম্বর (
                          {getAccountTypeBangla(activeAccountType)}):
                        </span>
                        <div className="text-2xl sm:text-3xl font-black text-slate-950 font-mono tracking-wider tabular-nums mt-1">
                          {activeAccountNumber}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="btn-copy-payment-number"
                      onClick={() => handleCopyText(activeAccountNumber, 'NUMBER')}
                      className={`min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white transition-all active:scale-95 cursor-pointer shrink-0 ${
                        paymentMethod === 'BKASH'
                          ? 'bg-[#E2136E] hover:bg-[#c81060]'
                          : 'bg-[#EA580C] hover:bg-[#d14906]'
                      }`}
                    >
                      {copiedNumber ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>নম্বর কপি হয়েছে</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>নম্বর কপি করুন</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Unique Reference Code Row */}
                  <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        আপনার ইউনিক রেফারেন্স কোড:
                      </span>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        অ্যাপে <strong>৳ {toBanglaDigits(amount)} টাকা</strong> পাঠানোর সময় রেফারেন্স ঘরে নিচের কোডটি ব্যবহার করলে দ্রুত যাচাই হবে:
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 font-mono text-sm font-black text-slate-900 tabular-nums">
                        {referenceCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(referenceCode, 'REF')}
                        className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedRef ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedRef ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Clear Step-by-Step Guide */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1.5 leading-relaxed">
                  <p className="font-black text-slate-900">টাকা পাঠানোর সহজ নিয়ম:</p>
                  <p>
                    ১. উপরের কপি করা নম্বরে আপনার{' '}
                    <strong>{paymentMethod === 'BKASH' ? 'বিকাশ' : 'নগদ'}</strong> অ্যাপ থেকে{' '}
                    <strong>৳ {toBanglaDigits(amount)} টাকা</strong> পাঠান।
                  </p>
                  <p>
                    ২. টাকা পাঠানোর পর ফিরতি এসএমএস থেকে <strong>ট্রানজেকশন আইডি</strong> সংগ্রহ করে নিচের <strong>পরবর্তী ধাপ</strong> বাটনে ক্লিক করুন।
                  </p>
                </div>

                {/* Step 2 Navigation Buttons */}
                <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    id="btn-wizard-prev"
                    onClick={handlePrevStep}
                    className="min-h-[48px] px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-extrabold transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 shrink-0" />
                    <span>পূর্ববর্তী ধাপ</span>
                  </button>

                  <button
                    type="button"
                    id="btn-wizard-next"
                    onClick={handleNextStep}
                    className="min-h-[48px] px-7 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm sm:text-base font-black shadow-sm transition-all active:scale-[0.99] inline-flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <span>টাকা পাঠিয়েছি — পরবর্তী ধাপ</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ==================== PAGE 3: STEP 3 — TRANSACTION VERIFICATION FORM ==================== */}
            {currentStep === 3 && (
              <motion.form
                key="wizard-step-3"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleSubmitDonation}
                className="bg-white rounded-[28px] border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6"
              >
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-xs font-bold text-blue-700 block">
                    তৃতীয় ধাপ
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    পেমেন্ট যাচাইয়ের তথ্য প্রদান করুন
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    টাকা পাঠানোর পর প্রাপ্ত এসএমএস দেখে আপনার মোবাইল নম্বর ও ট্রানজেকশন আইডি লিখুন।
                  </p>
                </div>

                {/* Selected Payment Summary Bar with Official Logo */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <PaymentMethodLogo provider={paymentMethod} size="md" />
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block">
                        নির্বাচিত মাধ্যম ও পরিমাণ
                      </span>
                      <span className="text-sm sm:text-base font-black text-slate-900 tabular-nums">
                        {paymentMethod === 'BKASH' ? 'বিকাশ' : 'নগদ'} · ৳ {toBanglaDigits(amount)}{' '}
                        টাকা
                      </span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] font-bold text-slate-500 block">
                      রেফারেন্স কোড
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-black text-slate-900 tabular-nums">
                      {referenceCode}
                    </span>
                  </div>
                </div>

                {errorMsg && (
                  <div
                    id="donation-form-error"
                    className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm font-bold text-rose-800 flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Sender Mobile Number */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="input-sender-phone"
                      className="block text-xs font-bold text-slate-700"
                    >
                      যে মোবাইল নম্বর থেকে টাকা পাঠিয়েছেন{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-sender-phone"
                      type="tel"
                      inputMode="tel"
                      required
                      placeholder="০১৭XXXXXXXX"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="w-full min-h-[48px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 outline-none transition-all font-mono tabular-nums"
                    />
                  </div>

                  {/* Transaction ID */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="input-transaction-id"
                      className="block text-xs font-bold text-slate-700"
                    >
                      {paymentMethod === 'BKASH'
                        ? 'বিকাশ ট্রানজেকশন আইডি (TRXID)'
                        : 'নগদ ট্রানজেকশন আইডি (TXNID)'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-transaction-id"
                      type="text"
                      required
                      placeholder="SMS-এ প্রাপ্ত আইডি কোড লিখুন"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                      className="w-full min-h-[48px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-base font-black text-slate-900 placeholder:text-slate-400 placeholder:font-sans placeholder:font-medium focus:bg-white focus:border-slate-900 outline-none transition-all font-mono uppercase tabular-nums"
                    />
                  </div>

                  {/* Optional Donor Name */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="input-donor-name"
                      className="block text-xs font-bold text-slate-700"
                    >
                      আপনার নাম (ঐচ্ছিক)
                    </label>
                    <input
                      id="input-donor-name"
                      type="text"
                      placeholder="খালি রাখলে 'শুভাকাঙ্ক্ষী' হিসেবে যুক্ত হবে"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full min-h-[48px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 outline-none transition-all"
                    />
                  </div>

                  {/* Optional Note */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="input-donor-note"
                      className="block text-xs font-bold text-slate-700"
                    >
                      সংক্ষিপ্ত বার্তা বা দোয়া (ঐচ্ছিক)
                    </label>
                    <input
                      id="input-donor-note"
                      type="text"
                      placeholder="যেকোনো শুভকামনা বা মন্তব্য লিখুন..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full min-h-[48px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Verification Info Notice */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 text-xs text-slate-600 leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    নিশ্চিত বাটনে ক্লিক করার পর নিচের থেকে স্লাইড-আপ শীটে <strong>১৫ সেকেন্ড</strong> ডেটাবেজ ও SMS রিডার থেকে ট্রানজেকশন নম্বর (TRXID) ও টাকার অ্যামাউন্ট যাচাই করা হবে।
                  </span>
                </div>

                {/* Step 3 Navigation & Submit Bar */}
                <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    id="btn-wizard-prev"
                    onClick={handlePrevStep}
                    disabled={verificationModalOpen}
                    className="min-h-[48px] px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-extrabold transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <ArrowLeft className="w-4 h-4 shrink-0" />
                    <span>পূর্ববর্তী ধাপ</span>
                  </button>

                  <button
                    type="submit"
                    id="btn-submit-donation"
                    disabled={verificationModalOpen}
                    className={`min-h-[48px] px-7 py-3.5 rounded-2xl text-sm sm:text-base font-black text-white shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 inline-flex items-center justify-center gap-2.5 cursor-pointer ${
                      paymentMethod === 'BKASH'
                        ? 'bg-[#E2136E] hover:bg-[#c81060]'
                        : 'bg-[#EA580C] hover:bg-[#d14906]'
                    }`}
                  >
                    <span>
                      ৳ {toBanglaDigits(amount || 0)} টাকা অনুদান নিশ্চিত করুন
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </motion.form>
            )}

            {/* ==================== PAGE 4: STEP 4 — DIGITAL DONATION RECEIPT ==================== */}
            {currentStep === 4 && submittedDonation && (
              <motion.div
                key="wizard-step-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div
                  id="donation-receipt-card"
                  className="bg-white rounded-[28px] border border-slate-200/90 shadow-xs overflow-hidden"
                >
                  {/* Status Top Banner (100% Bengali) */}
                  {submittedDonation.status === 'VERIFIED' ? (
                    <div className="bg-emerald-600 text-white px-6 py-5 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg sm:text-xl font-black tracking-tight">
                            অনুদান সফলভাবে যাচাই সম্পন্ন হয়েছে
                          </h2>
                          <p className="text-xs sm:text-sm text-emerald-100 mt-0.5 leading-relaxed">
                            {submittedDonation.verificationSource === 'AUTO_SMS_APP'
                              ? 'অটোমেটিক এসএমএস ভেরিফিকেশন সিস্টেম দ্বারা তাৎক্ষণিক নিশ্চিত করা হয়েছে।'
                              : 'কর্তৃপক্ষ কর্তৃক পেমেন্টটি সফলভাবে যাচাই ও অনুমোদিত হয়েছে।'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black bg-emerald-950/30 px-3.5 py-1.5 rounded-xl self-start sm:self-center shrink-0">
                        যাচাই সম্পন্ন
                      </span>
                    </div>
                  ) : submittedDonation.status === 'REJECTED' ? (
                    <div className="bg-rose-600 text-white px-6 py-5 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                          <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg sm:text-xl font-black tracking-tight">
                            পেমেন্ট তথ্যটি যাচাইয়ে মেলেনি
                          </h2>
                          <p className="text-xs sm:text-sm text-rose-100 mt-0.5 leading-relaxed">
                            প্রদত্ত ট্রানজেকশন আইডি বা তথ্যে অসামঞ্জস্য পাওয়া গেছে। সঠিক তথ্য দিয়ে পুনরায় চেষ্টা করুন।
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black bg-rose-950/30 px-3.5 py-1.5 rounded-xl self-start sm:self-center shrink-0">
                        যাচাই ব্যর্থ
                      </span>
                    </div>
                  ) : (
                    <div className="bg-amber-500 text-slate-950 px-6 py-5 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-white/60 flex items-center justify-center shrink-0">
                          <Clock className="w-6 h-6 text-amber-900" />
                        </div>
                        <div>
                          <h2 className="text-lg sm:text-xl font-black tracking-tight">
                            অনুদান তথ্য গৃহীত হয়েছে — যাচাই চলছে
                          </h2>
                          <p className="text-xs sm:text-sm text-amber-950/90 mt-0.5 font-medium leading-relaxed">
                            পেমেন্ট এসএমএস যুক্ত হওয়া মাত্রই বা কর্তৃপক্ষ অনুমোদনের সাথে সাথে এই পেজে স্ট্যাটাস স্বয়ংক্রিয়ভাবে সম্পন্ন দেখাবে।
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black bg-white/75 text-amber-950 px-3.5 py-1.5 rounded-xl self-start sm:self-center shrink-0">
                        যাচাই অপেক্ষমাণ
                      </span>
                    </div>
                  )}

                  {/* Receipt Details Body */}
                  <div className="p-6 sm:p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
                      <div>
                        <DpibBrandTitle className="text-lg sm:text-xl" />
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">
                          চতুর্থ ধাপ · ডিজিটাল অনুদান ও মানবিক সহায়তা রসিদ
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-[11px] font-bold text-slate-500 block">
                          রেফারেন্স কোড
                        </span>
                        <span className="font-mono text-base sm:text-lg font-black text-slate-900 tabular-nums">
                          {submittedDonation.referenceCode}
                        </span>
                      </div>
                    </div>

                    {/* Key-Value Receipt Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/90 p-5 rounded-2xl border border-slate-200/70">
                      <div>
                        <span className="text-xs text-slate-500 block">অনুদানের পরিমাণ</span>
                        <span className="text-2xl font-black text-slate-900 tabular-nums mt-0.5 block">
                          ৳ {toBanglaDigits(submittedDonation.amount)} টাকা
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">পেমেন্ট মাধ্যম</span>
                        <div className="flex items-center gap-2 mt-1">
                          <PaymentMethodLogo
                            provider={submittedDonation.paymentMethod}
                            size="sm"
                          />
                          <span
                            className={`text-base font-black ${
                              submittedDonation.paymentMethod === 'BKASH'
                                ? 'text-[#E2136E]'
                                : 'text-[#EA580C]'
                            }`}
                          >
                            {submittedDonation.paymentMethod === 'BKASH' ? 'বিকাশ' : 'নগদ'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">ট্রানজেকশন আইডি</span>
                        <span className="font-mono text-sm sm:text-base font-black text-slate-900 tabular-nums mt-0.5 block">
                          {submittedDonation.transactionId}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">প্রেরকের মোবাইল নম্বর</span>
                        <span className="font-mono text-sm sm:text-base font-bold text-slate-800 tabular-nums mt-0.5 block">
                          {submittedDonation.senderPhone}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">দাতার নাম</span>
                        <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                          {submittedDonation.donorName || 'শুভাকাঙ্ক্ষী'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">ব্যয়ের খাত</span>
                        <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                          {getPurposeLabel(submittedDonation.purpose)}
                        </span>
                      </div>
                    </div>

                    {/* Auto-Generated Transaction Confirmation Box */}
                    {submittedDonation.status === 'VERIFIED' ? (
                      <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-emerald-800 block">
                            স্বয়ংক্রিয় লেনদেন সম্পন্ন হয়েছে
                          </span>
                          <p className="text-sm sm:text-base font-black text-emerald-950 font-mono tabular-nums">
                            লেনদেন নম্বর: {activeReceiptTransactionNumber}
                          </p>
                          <p className="text-xs text-emerald-800">
                            পেমেন্ট নিশ্চিত হওয়ায় লেনদেন হিস্ট্রিতে স্থায়ীভাবে সংরক্ষিত হয়েছে।
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPageMode('HISTORY');
                            scrollToTopSmooth();
                          }}
                          className="no-print min-h-[44px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer self-start sm:self-center shrink-0 transition-all"
                        >
                          <History className="w-4 h-4" />
                          <span>লেনদেন হিস্ট্রি দেখুন</span>
                        </button>
                      </div>
                    ) : submittedDonation.status === 'PENDING' ? (
                      <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-xs text-amber-950 leading-relaxed">
                        <strong>নোট:</strong> আপনার পেমেন্ট তথ্য সফলভাবে গৃহীত হয়েছে। পেমেন্ট নিশ্চিত হওয়া মাত্রই স্বয়ংক্রিয়ভাবে একটি লেনদেন নম্বর তৈরি হবে এবং <strong>লেনদেন হিস্ট্রি</strong> তালিকায় যুক্ত হবে।
                      </div>
                    ) : null}

                    {submittedDonation.note && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs sm:text-sm text-slate-700">
                        <strong className="text-slate-900">মন্তব্য: </strong>
                        {submittedDonation.note}
                      </div>
                    )}

                    <div className="text-center py-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      আপনার এই আন্তরিক সহায়তা <strong className="text-slate-900">DPIB RESULT ZONE</strong>-এর উন্নয়ন ও কল্যাণমূলক কর্মকাণ্ড এগিয়ে নিতে গুরুত্বপূর্ণ ভূমিকা রাখবে। আন্তরিক ধন্যবাদ ও কৃতজ্ঞতা।
                    </div>

                    {/* Receipt Actions */}
                    <div className="no-print flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        <span>রসিদ প্রিন্ট / সংরক্ষণ করুন</span>
                      </button>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPageMode('HISTORY');
                            scrollToTopSmooth();
                          }}
                          className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                        >
                          <History className="w-4 h-4" />
                          <span>লেনদেন হিস্ট্রি</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleResetForNewDonation}
                          className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>আরেকটি অনুদান প্রদান করুন</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 15-Second Animated Database & SMS Reader Verification Modal */}
      <PaymentVerificationModal
        isOpen={verificationModalOpen}
        paymentData={pendingVerificationPayload}
        onSuccess={(verifiedRecord) => {
          setVerificationModalOpen(false);
          setPendingVerificationPayload(null);
          setErrorMsg(null);
          setSubmittedDonation(verifiedRecord);
          setCurrentStep(4);
          setPageMode('WIZARD');
          scrollToTopSmooth();
        }}
        onCloseForEdit={(errText) => {
          setVerificationModalOpen(false);
          setPendingVerificationPayload(null);
          if (errText) {
            setErrorMsg(errText);
          }
        }}
      />
    </div>
  );
};
