import React, { useState, useEffect, useMemo } from 'react';
import {
  HeartHandshake,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Settings,
  Smartphone,
  Copy,
  Check,
  Save,
  Trash2,
  Play,
  Terminal,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  History,
  Receipt,
  SlidersHorizontal,
  Layers,
  CreditCard,
  Sparkles,
  FileText,
  User,
  Phone,
  Hash,
  Calendar,
  AlertTriangle,
  QrCode,
  Upload,
  Image,
  ExternalLink,
  Eye,
  Code2,
  Globe,
} from 'lucide-react';
import {
  DonationConfig,
  DonationRecord,
  DonationSmsLog,
  SystemSettings,
  TransactionRecord,
} from '../../types';
import {
  DEFAULT_DONATION_CONFIG,
  deleteDonationRecord,
  formatTransactionDateTimeBangla,
  getPurposeLabel,
  isUnexpandedSmsPlaceholder,
  subscribeAllDonations,
  subscribeDonationSmsLogs,
  subscribeTransactions,
  updateDonationStatusManually,
} from '../../services/donationService';
import {
  getSystemSettings,
  saveSystemSettings,
  subscribeSystemSettings,
  compressQrImageFile,
} from '../../services/db';
import { toBanglaDigits, toEnglishDigits } from '../../utils/bangla';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { PaymentMethodLogo } from '../common/PaymentMethodLogo';
import { BottomSheet } from '../common/BottomSheet';
import { SelectBottomSheet, SelectOption, SelectTrigger } from '../common/SelectBottomSheet';

interface DonationManagementProps {
  onRefreshSettings?: () => void;
}

type AdminDonationTab = 'DONATIONS' | 'TRANSACTIONS' | 'SETTINGS' | 'SIMULATOR';

const ACCOUNT_TYPE_OPTIONS: SelectOption[] = [
  {
    value: 'PERSONAL',
    label: 'পার্সোনাল অ্যাকাউন্ট (SEND MONEY)',
    badge: 'PERSONAL',
    sublabel: 'ব্যক্তিগত নম্বর — SEND MONEY অপশন থেকে অনুদান গ্রহণ',
    icon: User,
  },
  {
    value: 'MERCHANT',
    label: 'মার্চেন্ট অ্যাকাউন্ট (MAKE PAYMENT)',
    badge: 'MERCHANT',
    sublabel: 'অফিসিয়াল পেমেন্ট গেটওয়ে — MAKE PAYMENT অপশন',
    icon: ShieldCheck,
  },
  {
    value: 'AGENT',
    label: 'এজেন্ট অ্যাকাউন্ট (CASH OUT)',
    badge: 'AGENT',
    sublabel: 'এজেন্ট নম্বর — CASH OUT অপশনে পেমেন্ট গ্রহণ',
    icon: CreditCard,
  },
];

const ACCOUNT_TYPE_LABELS: Record<'PERSONAL' | 'MERCHANT' | 'AGENT', string> = {
  PERSONAL: 'পার্সোনাল (SEND MONEY)',
  MERCHANT: 'মার্চেন্ট (MAKE PAYMENT)',
  AGENT: 'এজেন্ট (CASH OUT)',
};

export const DonationManagement: React.FC<DonationManagementProps> = ({
  onRefreshSettings,
}) => {
  const [activeTab, setActiveTab] = useState<AdminDonationTab>('DONATIONS');

  // Data States
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [smsLogs, setSmsLogs] = useState<DonationSmsLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search States
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [txnProviderFilter, setTxnProviderFilter] = useState<'ALL' | 'BKASH' | 'NAGAD'>('ALL');
  const [txnSearchQuery, setTxnSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Payment & SMS Webhook Configuration States
  const [fullSettings, setFullSettings] = useState<SystemSettings | null>(null);
  const [config, setConfig] = useState<DonationConfig>(DEFAULT_DONATION_CONFIG);
  const [savingConfig, setSavingConfig] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Inline Feedback Banner (Replaces native window.alert)
  const [bannerFeedback, setBannerFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Digital Action Sheet Modal States
  const [mobileTabSheetOpen, setMobileTabSheetOpen] = useState(false);
  const [statusFilterSheetOpen, setStatusFilterSheetOpen] = useState(false);
  const [txnProviderSheetOpen, setTxnProviderSheetOpen] = useState(false);
  const [bkashTypeSheetOpen, setBkashTypeSheetOpen] = useState(false);
  const [nagadTypeSheetOpen, setNagadTypeSheetOpen] = useState(false);
  const [simSenderSheetOpen, setSimSenderSheetOpen] = useState(false);
  const [simTemplateSheetOpen, setSimTemplateSheetOpen] = useState(false);

  // Detail & Confirmation Digital Action Sheets
  const [selectedDonationSheet, setSelectedDonationSheet] = useState<DonationRecord | null>(null);
  const [selectedTxnSheet, setSelectedTxnSheet] = useState<TransactionRecord | null>(null);
  const [deleteConfirmDonation, setDeleteConfirmDonation] = useState<DonationRecord | null>(null);

  // SMS Webhook Simulator States
  const [simSender, setSimSender] = useState<'BKASH' | 'NAGAD'>('BKASH');
  const [simTemplateKey, setSimTemplateKey] = useState<string>('SAMPLE_BKASH');
  const [simMessage, setSimMessage] = useState<string>(
    'You have received Tk 100.00 from 01712345678. Ref DPIB-4829. Fee Tk 0.00. Balance Tk 1500.00. TrxID BKH9A21M4P at 05/11/2026 14:30'
  );
  const [simRunning, setSimRunning] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  const showBanner = (type: 'success' | 'error', text: string) => {
    setBannerFeedback({ type, text });
  };

  useEffect(() => {
    if (!bannerFeedback) return;
    const timer = setTimeout(() => setBannerFeedback(null), 4500);
    return () => clearTimeout(timer);
  }, [bannerFeedback]);

  useEffect(() => {
    const unsubDonations = subscribeAllDonations(
      (items) => {
        setDonations(items);
        setLoading(false);
      },
      (err) => {
        console.error('DONATIONS SUBSCRIPTION ERROR:', err);
        setLoading(false);
      }
    );

    const unsubSms = subscribeDonationSmsLogs(
      (logs) => {
        setSmsLogs(logs);
      },
      (err) => {
        console.warn('SMS LOGS SUBSCRIPTION WARNING:', err);
      }
    );

    const unsubTransactions = subscribeTransactions(
      (items) => {
        setTransactions(items);
      },
      (err) => {
        console.warn('TRANSACTIONS SUBSCRIPTION WARNING:', err);
      }
    );

    const unsubSettings = subscribeSystemSettings(
      (sys) => {
        setFullSettings(sys);
        if (sys.donationConfig) {
          setConfig((prev) => ({
            ...DEFAULT_DONATION_CONFIG,
            ...prev,
            ...sys.donationConfig,
          }));
        }
      },
      (err) => {
        console.warn('SETTINGS SUBSCRIPTION WARNING:', err);
      }
    );

    return () => {
      unsubDonations();
      unsubTransactions();
      unsubSms();
      unsubSettings();
    };
  }, []);

  // Sync open detail sheet if underlying donation updates in real time
  useEffect(() => {
    if (!selectedDonationSheet) return;
    const updated = donations.find((d) => d.id === selectedDonationSheet.id);
    if (updated) {
      setSelectedDonationSheet(updated);
    }
  }, [donations]);

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/donations/sms-webhook`
      : '/api/donations/sms-webhook';

  const liveVercelUrl = 'https://dpib-result-zone.vercel.app/api/donations/sms-webhook';

  const copyToClipboard = async (text: string, key: string, successText?: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedKey(key);
    if (successText) {
      showBanner('success', successText);
    }
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };


  const handleGenerateSecret = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let token = 'DPIB_SMS_';
    for (let i = 0; i < 16; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setConfig((prev) => ({ ...prev, smsWebhookSecret: token }));
    showBanner('success', 'নতুন WEBHOOK SECRET KEY তৈরি হয়েছে — সংরক্ষণ করতে ভুলবেন না!');
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      try {
        localStorage.setItem('dpib_cached_donation_config', JSON.stringify(config));
      } catch {}
      await saveSystemSettings({
        ...(fullSettings || {}),
        donationConfig: config,
        updatedAt: Date.now(),
      });
      showBanner('success', 'বিকাশ, নগদ ও কিউআর কোড সেটিংস সফলভাবে ক্লাউডে সংরক্ষিত হয়েছে!');
      if (onRefreshSettings) onRefreshSettings();
    } catch (err: any) {
      showBanner('error', `সেটিংস সংরক্ষণে ত্রুটি: ${err?.message || 'UNKNOWN ERROR'}`);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleManualStatusUpdate = async (
    donationId: string,
    newStatus: 'VERIFIED' | 'REJECTED' | 'PENDING'
  ) => {
    setProcessingId(donationId);
    try {
      await updateDonationStatusManually(donationId, newStatus);
      const statusText =
        newStatus === 'VERIFIED'
          ? 'অনুদানটি সফলভাবে অনুমোদিত (VERIFIED) হয়েছে এবং লেনদেন হিস্ট্রিতে যুক্ত হয়েছে!'
          : newStatus === 'REJECTED'
          ? 'অনুদানটি বাতিল (REJECTED) করা হয়েছে।'
          : 'অনুদানটি অপেক্ষমাণ (PENDING) তালিকায় নেওয়া হয়েছে।';
      showBanner('success', statusText);
    } catch (err: any) {
      showBanner('error', `স্ট্যাটাস আপডেটে সমস্যা: ${err?.message || 'UNKNOWN ERROR'}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmDeleteRecord = async () => {
    if (!deleteConfirmDonation) return;
    const targetId = deleteConfirmDonation.id;
    setProcessingId(targetId);
    try {
      await deleteDonationRecord(targetId);
      if (selectedDonationSheet?.id === targetId) {
        setSelectedDonationSheet(null);
      }
      setDeleteConfirmDonation(null);
      showBanner('success', 'অনুদান রেকর্ডটি স্থায়ীভাবে মুছে ফেলা হয়েছে।');
    } catch (err: any) {
      showBanner('error', `মুছে ফেলতে সমস্যা: ${err?.message || 'UNKNOWN ERROR'}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleFillSampleFromPending = (pending: DonationRecord) => {
    setSimTemplateKey(`PENDING_${pending.id}`);
    if (pending.paymentMethod === 'BKASH') {
      setSimSender('BKASH');
      setSimMessage(
        `You have received Tk ${pending.amount}.00 from ${pending.senderPhone}. Ref ${pending.referenceCode}. Fee Tk 0.00. Balance Tk 2500.00. TrxID ${pending.transactionId} at 05/11/2026 15:10`
      );
    } else {
      setSimSender('NAGAD');
      setSimMessage(
        `Money Received. Amount: Tk ${pending.amount}.00 Sender: ${pending.senderPhone} Ref: ${pending.referenceCode} TxnId: ${pending.transactionId} Balance: Tk 3200.00`
      );
    }
  };

  const handleSelectSimulatorTemplate = (val: string) => {
    setSimTemplateKey(val);
    if (val === 'SAMPLE_BKASH') {
      setSimSender('BKASH');
      setSimMessage(
        'You have received Tk 100.00 from 01712345678. Ref DPIB-4829. Fee Tk 0.00. Balance Tk 1500.00. TrxID BKH9A21M4P at 05/11/2026 14:30'
      );
      return;
    }
    if (val === 'SAMPLE_NAGAD') {
      setSimSender('NAGAD');
      setSimMessage(
        'Money Received. Amount: Tk 50.00 Sender: 01812345678 Ref: DPIB-9012 TxnId: 72A8B9C1 Balance: Tk 2200.00'
      );
      return;
    }
    if (val.startsWith('PENDING_')) {
      const id = val.replace('PENDING_', '');
      const found = pendingDonations.find((p) => p.id === id);
      if (found) {
        handleFillSampleFromPending(found);
      }
    }
  };

  const handleRunSmsSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simMessage.trim()) return;
    setSimRunning(true);
    setSimResult(null);
    try {
      const resp = await fetch('/api/donations/sms-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: simSender === 'BKASH' ? 'bKash' : 'NAGAD',
          message: simMessage.trim(),
          secret: config.smsWebhookSecret || '',
          adminSimulation: true,
        }),
      });
      const data = await resp.json();
      setSimResult(data);
    } catch (err: any) {
      setSimResult({ success: false, error: err?.message || 'WEBHOOK REQUEST FAILED' });
    } finally {
      setSimRunning(false);
    }
  };

  // Summary Statistics
  const verifiedDonations = useMemo(
    () => donations.filter((d) => d.status === 'VERIFIED'),
    [donations]
  );
  const pendingDonations = useMemo(
    () => donations.filter((d) => d.status === 'PENDING'),
    [donations]
  );
  const rejectedDonations = useMemo(
    () => donations.filter((d) => d.status === 'REJECTED'),
    [donations]
  );

  const totalVerifiedAmount = useMemo(
    () => verifiedDonations.reduce((sum, d) => sum + Number(d.amount || 0), 0),
    [verifiedDonations]
  );
  const autoVerifiedCount = useMemo(
    () => verifiedDonations.filter((d) => d.verificationSource === 'AUTO_SMS_APP').length,
    [verifiedDonations]
  );

  const bkashTxnCount = useMemo(
    () => transactions.filter((t) => t.paymentMethod === 'BKASH').length,
    [transactions]
  );
  const nagadTxnCount = useMemo(
    () => transactions.filter((t) => t.paymentMethod === 'NAGAD').length,
    [transactions]
  );

  // Filtered Lists
  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = toEnglishDigits(searchQuery.trim()).toLowerCase();
      return (
        d.referenceCode.toLowerCase().includes(q) ||
        d.transactionId.toLowerCase().includes(q) ||
        d.senderPhone.toLowerCase().includes(q) ||
        (d.donorName || '').toLowerCase().includes(q)
      );
    });
  }, [donations, statusFilter, searchQuery]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (txnProviderFilter !== 'ALL' && t.paymentMethod !== txnProviderFilter) return false;
      if (!txnSearchQuery.trim()) return true;
      const q = toEnglishDigits(txnSearchQuery.trim()).toLowerCase();
      return (
        t.transactionNumber.toLowerCase().includes(q) ||
        t.referenceCode.toLowerCase().includes(q) ||
        t.gatewayTrxId.toLowerCase().includes(q) ||
        t.senderPhone.toLowerCase().includes(q) ||
        (t.donorName || '').toLowerCase().includes(q)
      );
    });
  }, [transactions, txnProviderFilter, txnSearchQuery]);

  // Digital Action Sheet Option Definitions
  const tabSheetOptions: SelectOption[] = useMemo(
    () => [
      {
        value: 'DONATIONS',
        label: `অনুদান তালিকা (${toBanglaDigits(donations.length)})`,
        badge: 'DONATIONS',
        sublabel: 'সকল বিকাশ ও নগদ অনুদান যাচাই এবং অনুমোদন ব্যবস্থাপনা',
        icon: HeartHandshake,
      },
      {
        value: 'TRANSACTIONS',
        label: `লেনদেন হিস্ট্রি (${toBanglaDigits(transactions.length)})`,
        badge: 'TXN HISTORY',
        sublabel: 'অনুমোদিত সকল পেমেন্টের স্থায়ী TXN ডিজিটাল রসিদ তালিকা',
        icon: History,
      },
      {
        value: 'SETTINGS',
        label: 'নম্বর ও WEBHOOK সেটিংস',
        badge: 'API CONFIG',
        sublabel: 'বিকাশ ও নগদ অ্যাকাউন্ট নম্বর, SECRET KEY এবং SMS WEBHOOK',
        icon: Settings,
      },
      {
        value: 'SIMULATOR',
        label: `SMS টেস্টার ও লগ (${toBanglaDigits(smsLogs.length)})`,
        badge: 'SMS TESTER',
        sublabel: 'অটোমেটিক SMS পার্সিং টেস্টার এবং ইনকামিং WEBHOOK লগ',
        icon: Terminal,
      },
    ],
    [donations.length, transactions.length, smsLogs.length]
  );

  const activeTabDisplayLabel = useMemo(() => {
    const match = tabSheetOptions.find((t) => t.value === activeTab);
    return match ? match.label : 'অনুদান তালিকা';
  }, [tabSheetOptions, activeTab]);

  const statusFilterOptions: SelectOption[] = useMemo(
    () => [
      {
        value: 'ALL',
        label: `সকল অনুদান (${toBanglaDigits(donations.length)})`,
        badge: 'ALL',
        sublabel: 'যাচাইাধীন, সম্পন্ন এবং বাতিলকৃত সব অনুদান দেখুন',
        icon: Layers,
      },
      {
        value: 'PENDING',
        label: `যাচাই অপেক্ষমাণ (${toBanglaDigits(pendingDonations.length)})`,
        badge: 'PENDING',
        sublabel: 'SMS ভেরিফিকেশন বা অ্যাডমিন অনুমোদনের অপেক্ষায়',
        icon: Clock,
      },
      {
        value: 'VERIFIED',
        label: `যাচাই সম্পন্ন (${toBanglaDigits(verifiedDonations.length)})`,
        badge: 'VERIFIED',
        sublabel: 'সফলভাবে যাচাইকৃত এবং অনুমোদিত অনুদানসমূহ',
        icon: CheckCircle2,
      },
      {
        value: 'REJECTED',
        label: `বাতিলকৃত অনুদান (${toBanglaDigits(rejectedDonations.length)})`,
        badge: 'REJECTED',
        sublabel: 'বাতিল বা অসামঞ্জস্যপূর্ণ TRXID যুক্ত রিকোয়েস্ট',
        icon: XCircle,
      },
    ],
    [
      donations.length,
      pendingDonations.length,
      verifiedDonations.length,
      rejectedDonations.length,
    ]
  );

  const statusFilterDisplayLabel = useMemo(() => {
    const found = statusFilterOptions.find((o) => o.value === statusFilter);
    return found ? found.label : 'সকল অনুদান';
  }, [statusFilterOptions, statusFilter]);

  const txnProviderOptions: SelectOption[] = useMemo(
    () => [
      {
        value: 'ALL',
        label: `সকল পেমেন্ট মাধ্যম (${toBanglaDigits(transactions.length)})`,
        badge: 'ALL',
        sublabel: 'বিকাশ (BKASH) ও নগদ (NAGAD) উভয় গেটওয়ের লেনদেন',
        icon: Layers,
      },
      {
        value: 'BKASH',
        label: `বিকাশ লেনদেন (${toBanglaDigits(bkashTxnCount)})`,
        badge: 'BKASH',
        sublabel: 'শুধুমাত্র বিকাশ পেমেন্ট গেটওয়ে সম্পন্ন হিস্ট্রি',
        icon: Smartphone,
      },
      {
        value: 'NAGAD',
        label: `নগদ লেনদেন (${toBanglaDigits(nagadTxnCount)})`,
        badge: 'NAGAD',
        sublabel: 'শুধুমাত্র নগদ পেমেন্ট গেটওয়ে সম্পন্ন হিস্ট্রি',
        icon: Smartphone,
      },
    ],
    [transactions.length, bkashTxnCount, nagadTxnCount]
  );

  const txnProviderDisplayLabel = useMemo(() => {
    const found = txnProviderOptions.find((o) => o.value === txnProviderFilter);
    return found ? found.label : 'সকল পেমেন্ট মাধ্যম';
  }, [txnProviderOptions, txnProviderFilter]);

  const simSenderOptions: SelectOption[] = useMemo(
    () => [
      {
        value: 'BKASH',
        label: 'বিকাশ (BKASH)',
        badge: 'BKASH',
        sublabel: 'BKASH অফিসিয়াল SMS সেন্টার ফরম্যাট',
        icon: Smartphone,
      },
      {
        value: 'NAGAD',
        label: 'নগদ (NAGAD)',
        badge: 'NAGAD',
        sublabel: 'NAGAD অফিসিয়াল SMS সেন্টার ফরম্যাট',
        icon: Smartphone,
      },
    ],
    []
  );

  const simTemplateOptions: SelectOption[] = useMemo(() => {
    const base: SelectOption[] = [
      {
        value: 'SAMPLE_BKASH',
        label: 'স্যাম্পল বিকাশ SMS (৳ ১০০)',
        badge: 'BKASH SAMPLE',
        sublabel: 'TRXID BKH9A21M4P · REF DPIB-4829',
        icon: Sparkles,
      },
      {
        value: 'SAMPLE_NAGAD',
        label: 'স্যাম্পল নগদ SMS (৳ ৫০)',
        badge: 'NAGAD SAMPLE',
        sublabel: 'TXNID 72A8B9C1 · REF DPIB-9012',
        icon: Sparkles,
      },
    ];

    const pendingOpts: SelectOption[] = pendingDonations.map((p) => ({
      value: `PENDING_${p.id}`,
      label: `${p.paymentMethod === 'BKASH' ? 'বিকাশ' : 'নগদ'} পেন্ডিং — ৳ ${toBanglaDigits(
        p.amount
      )} (${p.referenceCode})`,
      badge: `PENDING · ${p.paymentMethod}`,
      sublabel: `TRXID: ${p.transactionId} · নম্বর: ${p.senderPhone}`,
      icon: Clock,
    }));

    return [...pendingOpts, ...base];
  }, [pendingDonations]);

  const simTemplateDisplayLabel = useMemo(() => {
    const found = simTemplateOptions.find((o) => o.value === simTemplateKey);
    return found ? found.label : 'স্যাম্পল বা পেন্ডিং অনুদান বাছাই করুন';
  }, [simTemplateOptions, simTemplateKey]);

  if (loading) {
    return <LoadingSpinner message="অনুদান ও পেমেন্ট ডাটা লোড হচ্ছে..." />;
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-5 sm:space-y-6 font-bengali">
      {/* Inline Status Feedback Banner (Zero window.alert) */}
      {bannerFeedback && (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-xs ${
            bannerFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {bannerFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="break-words">{bannerFeedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerFeedback(null)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-black uppercase bg-white/80 hover:bg-white border border-current/15 shrink-0 cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      )}

      {/* Page Header & Responsive Digital Navigation */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                অনুদান ও অটোমেটিক পেমেন্ট হাব
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
                বিকাশ (BKASH) ও নগদ (NAGAD) অনুদান ব্যবস্থাপনা এবং অ্যান্ড্রয়েড SMS অটো-ভেরিফিকেশন
              </p>
            </div>
          </div>

          {/* Mobile Section Selector — Digital Action Sheet Trigger */}
          <div className="sm:hidden">
            <SelectTrigger
              id="mobile-donation-tab-trigger"
              label="অ্যাক্টিভ সেকশন (SECTION MENU)"
              value={activeTab}
              displayValue={activeTabDisplayLabel}
              icon={SlidersHorizontal}
              onClick={() => setMobileTabSheetOpen(true)}
            />
          </div>

          {/* Tablet / Desktop Single-Row Segmented Tabs */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto max-w-full">
            <button
              type="button"
              id="admin-donation-tab-list"
              onClick={() => setActiveTab('DONATIONS')}
              className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                activeTab === 'DONATIONS'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              অনুদান তালিকা ({toBanglaDigits(donations.length)})
            </button>
            <button
              type="button"
              id="admin-donation-tab-transactions"
              onClick={() => setActiveTab('TRANSACTIONS')}
              className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 tabular-nums ${
                activeTab === 'TRANSACTIONS'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5 shrink-0" />
              <span>লেনদেন হিস্ট্রি ({toBanglaDigits(transactions.length)})</span>
            </button>
            <button
              type="button"
              id="admin-donation-tab-settings"
              onClick={() => setActiveTab('SETTINGS')}
              className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'SETTINGS'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5 shrink-0" />
              <span>নম্বর ও WEBHOOK সেটিংস</span>
            </button>
            <button
              type="button"
              id="admin-donation-tab-simulator"
              onClick={() => setActiveTab('SIMULATOR')}
              className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 tabular-nums ${
                activeTab === 'SIMULATOR'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 shrink-0" />
              <span>SMS টেস্টার ও লগ ({toBanglaDigits(smsLogs.length)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Clean Mobile-First Summary Cards (Tabular Numerals, Zero Overflow) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="min-w-0 bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] sm:text-xs font-bold text-slate-500 block leading-snug">
            মোট যাচাইকৃত অনুদান
          </span>
          <span className="text-lg sm:text-2xl font-black text-emerald-700 tabular-nums mt-1.5 block truncate">
            ৳ {toBanglaDigits(totalVerifiedAmount)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block tabular-nums">
            {toBanglaDigits(verifiedDonations.length)}টি সফল লেনদেন
          </span>
        </div>

        <div className="min-w-0 bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] sm:text-xs font-bold text-slate-500 block leading-snug">
            অটো-ভেরিফাইড (AUTO SMS)
          </span>
          <span className="text-lg sm:text-2xl font-black text-blue-700 tabular-nums mt-1.5 block">
            {toBanglaDigits(autoVerifiedCount)} টি
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            স্বয়ংক্রিয় TRXID ম্যাচিং
          </span>
        </div>

        <div className="min-w-0 bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] sm:text-xs font-bold text-slate-500 block leading-snug">
            যাচাইাধীন (PENDING)
          </span>
          <span className="text-lg sm:text-2xl font-black text-amber-600 tabular-nums mt-1.5 block">
            {toBanglaDigits(pendingDonations.length)} টি
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            SMS বা ম্যানুয়াল অপেক্ষায়
          </span>
        </div>

        <div className="min-w-0 bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] sm:text-xs font-bold text-slate-500 block leading-snug">
            সক্রিয় পেমেন্ট নম্বর
          </span>
          <div className="mt-2 space-y-1.5 text-[11px] sm:text-xs font-mono font-bold text-slate-800 tabular-nums">
            <div className="flex items-center gap-1.5 min-w-0">
              <PaymentMethodLogo provider="BKASH" size="xs" />
              <span className="text-[#E2136E] font-outfit uppercase shrink-0">BKASH:</span>
              <span className="truncate">{toBanglaDigits(config.bkashNumber)}</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <PaymentMethodLogo provider="NAGAD" size="xs" />
              <span className="text-[#EA580C] font-outfit uppercase shrink-0">NAGAD:</span>
              <span className="truncate">{toBanglaDigits(config.nagadNumber)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= TAB 1: DONATIONS LIST & DIGITAL ACTION SHEET ================= */}
      {activeTab === 'DONATIONS' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Mobile-First Search & Digital Action Sheet Status Filter */}
          <div className="p-4 sm:p-6 border-b border-slate-200/80 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
            <div className="md:col-span-7 space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                অনুদান খুঁজুন (TRXID / REF / PHONE)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="TRXID, রেফারেন্স (DPIB-XXXX), নম্বর বা নাম..."
                  className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-700 outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="md:col-span-5">
              <SelectTrigger
                id="donation-status-filter-trigger"
                label="অনুদান স্ট্যাটাস ফিল্টার (STATUS)"
                value={statusFilter}
                displayValue={statusFilterDisplayLabel}
                icon={SlidersHorizontal}
                onClick={() => setStatusFilterSheetOpen(true)}
              />
            </div>
          </div>

          {/* Donations List */}
          {filteredDonations.length === 0 ? (
            <div className="p-8 sm:p-12 text-center space-y-2">
              <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">কোনো অনুদান রেকর্ড পাওয়া যায়নি</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                ব্যবহারকারীরা বিকাশ (BKASH) বা নগদ (NAGAD)-এ অনুদান পাঠিয়ে তথ্য জমা দিলে এখানে রিয়েলটাইমে প্রদর্শিত হবে।
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200/70">
              {filteredDonations.map((item) => {
                const isBusy = processingId === item.id;
                return (
                  <div
                    key={item.id}
                    className="p-4 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0"
                  >
                    <div
                      onClick={() => setSelectedDonationSheet(item)}
                      className="space-y-2 min-w-0 flex-1 cursor-pointer"
                    >
                      {/* Clean Inline Metadata Row (Zero Pill Clutter — Dot Separators) */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <PaymentMethodLogo provider={item.paymentMethod} size="xs" />
                        <span
                          className={`font-black uppercase font-outfit ${
                            item.paymentMethod === 'BKASH' ? 'text-[#E2136E]' : 'text-[#EA580C]'
                          }`}
                        >
                          {item.paymentMethod}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="inline-flex items-center gap-1 font-mono font-black text-slate-900 tabular-nums">
                          REF: {item.referenceCode}
                          <button
                            type="button"
                            title="রেফারেন্স কোড কপি করুন"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(item.referenceCode, `ref_${item.id}`, `রেফারেন্স ${item.referenceCode} কপি হয়েছে!`);
                            }}
                            className="p-1 hover:bg-slate-200/80 rounded cursor-pointer transition-colors"
                          >
                            {copiedKey === `ref_${item.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400 hover:text-slate-700" />
                            )}
                          </button>
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-800 tabular-nums break-all">
                          TRXID: {item.transactionId}
                          <button
                            type="button"
                            title="TRXID কপি করুন"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(item.transactionId, `trx_${item.id}`, `TRXID ${item.transactionId} কপি হয়েছে!`);
                            }}
                            className="p-1 hover:bg-slate-200/80 rounded cursor-pointer transition-colors"
                          >
                            {copiedKey === `trx_${item.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400 hover:text-slate-700" />
                            )}
                          </button>
                        </span>
                      </div>

                      {/* Primary Amount & Donor Info */}
                      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                        <span className="inline-flex items-center gap-1 text-lg sm:text-xl font-black text-slate-950 tabular-nums">
                          ৳ {toBanglaDigits(item.amount)} টাকা
                          <button
                            type="button"
                            title="টাকার পরিমাণ কপি করুন"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(String(item.amount), `amt_${item.id}`, `টাকার পরিমাণ ${item.amount} কপি হয়েছে!`);
                            }}
                            className="p-1 hover:bg-slate-200/80 rounded cursor-pointer transition-colors text-xs font-normal"
                          >
                            {copiedKey === `amt_${item.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700" />
                            )}
                          </button>
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-slate-800">
                          — {item.donorName || 'শুভাকাঙ্ক্ষী'}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({getPurposeLabel(item.purpose)})
                        </span>
                      </div>

                      {/* Secondary Mobile Number & Status Line */}
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                        <span className="inline-flex items-center gap-1 font-mono text-slate-600 tabular-nums">
                          SENDER: {toBanglaDigits(item.senderPhone)}
                          <button
                            type="button"
                            title="মোবাইল নম্বর কপি করুন"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(item.senderPhone, `phone_${item.id}`, `মোবাইল নম্বর ${item.senderPhone} কপি হয়েছে!`);
                            }}
                            className="p-1 hover:bg-slate-200/80 rounded cursor-pointer transition-colors"
                          >
                            {copiedKey === `phone_${item.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400 hover:text-slate-700" />
                            )}
                          </button>
                        </span>
                        <span className="text-slate-300">·</span>
                        <span
                          className={`font-black ${
                            item.status === 'VERIFIED'
                              ? 'text-emerald-700'
                              : item.status === 'REJECTED'
                              ? 'text-rose-700'
                              : 'text-amber-600'
                          }`}
                        >
                          {item.status === 'VERIFIED'
                            ? item.verificationSource === 'AUTO_SMS_APP'
                              ? 'VERIFIED (AUTO SMS)'
                              : 'VERIFIED (MANUAL)'
                            : item.status === 'REJECTED'
                            ? 'REJECTED (বাতিল)'
                            : 'PENDING (যাচাই অপেক্ষমাণ)'}
                        </span>
                      </div>

                      {item.note && (
                        <p className="text-xs text-slate-600 break-words">মন্তব্য: {item.note}</p>
                      )}

                      {item.matchedSmsText && (
                        <div className="text-[11px] font-mono text-emerald-900 bg-emerald-50/85 px-3 py-2 rounded-xl border border-emerald-200/70 break-words leading-relaxed">
                          <span className="font-black uppercase mr-1.5">MATCHED SMS:</span>
                          {item.matchedSmsText}
                        </div>
                      )}
                    </div>

                    {/* Responsive Thumb-Friendly Action Row */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {item.status !== 'VERIFIED' && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleManualStatusUpdate(item.id, 'VERIFIED')}
                          className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>অনুমোদন করুন</span>
                        </button>
                      )}

                      {item.status === 'PENDING' && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleManualStatusUpdate(item.id, 'REJECTED')}
                          className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4 shrink-0" />
                          <span>বাতিল করুন</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedDonationSheet(item)}
                        className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                        <span>অ্যাকশন শীট</span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setDeleteConfirmDonation(item)}
                        title="রেকর্ড মুছে ফেলুন"
                        className="min-h-[44px] px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200/80 transition-colors cursor-pointer flex items-center justify-center gap-1 text-xs font-bold"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                        <span className="sm:hidden">মুছুন</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: AUTO-GENERATED COMPLETED TRANSACTIONS HISTORY ================= */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200/80 space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                স্বয়ংক্রিয় সম্পন্ন লেনদেন হিস্ট্রি (COMPLETED TRANSACTIONS)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                যেকোনো অনুদান নিশ্চিত বা অনুমোদিত হওয়া মাত্রই স্বয়ংক্রিয়ভাবে একটি স্থায়ী লেনদেন (TXN) তৈরি হয়ে এখানে প্রদর্শিত হয়।
              </p>
            </div>

            {/* Responsive Search & Digital Action Sheet Provider Filter */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
              <div className="md:col-span-7 space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  লেনদেন খুঁজুন (TXN ID / TRXID / PHONE)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={txnSearchQuery}
                    onChange={(e) => setTxnSearchQuery(e.target.value)}
                    placeholder="TXN নম্বর, TRXID বা মোবাইল নম্বর..."
                    className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-700 outline-none tabular-nums"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="md:col-span-5">
                <SelectTrigger
                  id="txn-provider-filter-trigger"
                  label="পেমেন্ট মাধ্যম ফিল্টার (PROVIDER)"
                  value={txnProviderFilter}
                  displayValue={txnProviderDisplayLabel}
                  icon={SlidersHorizontal}
                  onClick={() => setTxnProviderSheetOpen(true)}
                />
              </div>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="p-8 sm:p-12 text-center space-y-2">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                এখনো কোনো সম্পন্ন লেনদেন তৈরি হয়নি
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                কোনো অনুদান অটো-SMS বা অ্যাডমিন অনুমোদনের মাধ্যমে নিশ্চিত হলে এখানে স্বয়ংক্রিয়ভাবে লেনদেন তৈরি হয়ে দেখাবে।
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200/70">
              {filteredTransactions.map((txn) => (
                <div
                  key={txn.id}
                  onClick={() => setSelectedTxnSheet(txn)}
                  className="p-4 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 cursor-pointer min-w-0"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <PaymentMethodLogo provider={txn.paymentMethod} size="md" />
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <span className="inline-flex items-center gap-1 font-mono font-black text-slate-950 tabular-nums">
                          {txn.transactionNumber}
                          <button
                            type="button"
                            title="TXN নম্বর কপি করুন"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(txn.transactionNumber, `txn_num_${txn.id}`, `TXN নম্বর ${txn.transactionNumber} কপি হয়েছে!`);
                            }}
                            className="p-1 hover:bg-slate-200/80 rounded cursor-pointer transition-colors"
                          >
                            {copiedKey === `txn_num_${txn.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400 hover:text-slate-700" />
                            )}
                          </button>
                        </span>
                        <span className="text-slate-300">·</span>
                        <span
                          className={`font-black uppercase font-outfit ${
                            txn.paymentMethod === 'BKASH' ? 'text-[#E2136E]' : 'text-[#EA580C]'
                          }`}
                        >
                          {txn.paymentMethod}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-800 tabular-nums break-all">
                          GATEWAY TRXID: {txn.gatewayTrxId}
                          <button
                            type="button"
                            title="TRXID কপি করুন"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(txn.gatewayTrxId, `txn_trx_${txn.id}`, `TRXID ${txn.gatewayTrxId} কপি হয়েছে!`);
                            }}
                            className="p-1 hover:bg-slate-200/80 rounded cursor-pointer transition-colors"
                          >
                            {copiedKey === `txn_trx_${txn.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400 hover:text-slate-700" />
                            )}
                          </button>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                        <span className="inline-flex items-center gap-1 text-lg sm:text-xl font-black text-slate-950 tabular-nums">
                          ৳ {toBanglaDigits(txn.amount)} টাকা
                          <button
                            type="button"
                            title="টাকার পরিমাণ কপি করুন"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(String(txn.amount), `txn_amt_${txn.id}`, `টাকার পরিমাণ ${txn.amount} কপি হয়েছে!`);
                            }}
                            className="p-1 hover:bg-slate-200/80 rounded cursor-pointer transition-colors text-xs font-normal"
                          >
                            {copiedKey === `txn_amt_${txn.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700" />
                            )}
                          </button>
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-slate-800">
                          — {txn.donorName || 'শুভাকাঙ্ক্ষী'}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({getPurposeLabel(txn.purpose)})
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                          SENDER: {toBanglaDigits(txn.senderPhone)}
                          <button
                            type="button"
                            title="মোবাইল নম্বর কপি করুন"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(txn.senderPhone, `txn_phone_${txn.id}`, `মোবাইল নম্বর ${txn.senderPhone} কপি হয়েছে!`);
                            }}
                            className="p-1 hover:bg-slate-200/80 rounded cursor-pointer transition-colors"
                          >
                            {copiedKey === `txn_phone_${txn.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400 hover:text-slate-700" />
                            )}
                          </button>
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                          REF: {txn.referenceCode}
                          <button
                            type="button"
                            title="রেফারেন্স কোড কপি করুন"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(txn.referenceCode, `txn_ref_${txn.id}`, `রেফারেন্স ${txn.referenceCode} কপি হয়েছে!`);
                            }}
                            className="p-1 hover:bg-slate-200/80 rounded cursor-pointer transition-colors"
                          >
                            {copiedKey === `txn_ref_${txn.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400 hover:text-slate-700" />
                            )}
                          </button>
                        </span>
                        {txn.completedAt > 0 && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span>সময়: {formatTransactionDateTimeBangla(txn.completedAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <span className="text-xs font-black text-emerald-700">
                      {txn.verificationSource === 'AUTO_SMS_APP'
                        ? 'COMPLETED (AUTO SMS)'
                        : 'COMPLETED (MANUAL)'}
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-bold">
                      রসিদ দেখুন
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: BKASH / NAGAD & ANDROID SMS WEBHOOK CONFIG ================= */}
      {activeTab === 'SETTINGS' && (
        <div className="space-y-6">
          <form
            onSubmit={handleSaveConfig}
            className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 shadow-xs space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-black text-slate-900">
                  বিকাশ (BKASH) ও নগদ (NAGAD) নম্বর কনফিগারেশন
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  অনুদান পেজে প্রদর্শিত অফিসিয়াল BKASH ও NAGAD নম্বর এবং অ্যাকাউন্টের ধরন নির্ধারণ করুন।
                </p>
              </div>
              <button
                type="submit"
                disabled={savingConfig}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Save className="w-4 h-4 shrink-0" />
                <span>{savingConfig ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* BKASH Config Box */}
              <div className="min-w-0 p-4 sm:p-5 rounded-2xl bg-pink-50/40 border border-[#E2136E]/20 space-y-4">
                <div className="flex items-center gap-3">
                  <PaymentMethodLogo provider="BKASH" size="md" />
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    বিকাশ সেটিংস (BKASH)
                  </h3>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    বিকাশ মোবাইল নম্বর (BKASH NUMBER) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={config.bkashNumber}
                      onChange={(e) => setConfig({ ...config, bkashNumber: e.target.value })}
                      placeholder="017XXXXXXXX"
                      className="w-full min-h-[44px] px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black font-mono text-slate-900 outline-none focus:border-[#E2136E] tabular-nums"
                    />
                    {config.bkashNumber && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(config.bkashNumber, 'CONFIG_BKASH_NUM', 'বিকাশ নম্বর কপি হয়েছে!')}
                        className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                        title="বিকাশ নম্বর কপি করুন"
                      >
                        {copiedKey === 'CONFIG_BKASH_NUM' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="hidden sm:inline">
                          {copiedKey === 'CONFIG_BKASH_NUM' ? 'কপি হয়েছে' : 'কপি'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                <SelectTrigger
                  id="bkash-account-type-trigger"
                  label="অ্যাকাউন্টের ধরন (ACCOUNT TYPE)"
                  required
                  value={config.bkashAccountType}
                  displayValue={ACCOUNT_TYPE_LABELS[config.bkashAccountType]}
                  icon={CreditCard}
                  onClick={() => setBkashTypeSheetOpen(true)}
                />

                {/* bKash QR Code (Image URL / File Upload) */}
                <div className="pt-3 border-t border-[#E2136E]/15 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-[#E2136E]" />
                      <span>বিকাশ কিউআর কোড (BKASH QR CODE)</span>
                    </label>
                    {config.bkashQrImageUrl && (
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, bkashQrImageUrl: '' })}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        মুছে ফেলুন
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={config.bkashQrImageUrl || ''}
                        onChange={(e) => setConfig({ ...config, bkashQrImageUrl: e.target.value })}
                        placeholder="কিউআর ইমেজ লিঙ্ক (URL) দিন... (https://...)"
                        className="w-full min-h-[42px] px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#E2136E]"
                      />
                      {config.bkashQrImageUrl && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(config.bkashQrImageUrl || '', 'CONFIG_BKASH_QR', 'বিকাশ কিউআর লিঙ্ক কপি হয়েছে!')}
                          className="min-h-[42px] px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                          title="কিউআর লিঙ্ক কপি করুন"
                        >
                          {copiedKey === 'CONFIG_BKASH_QR' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span className="hidden sm:inline">
                            {copiedKey === 'CONFIG_BKASH_QR' ? 'কপি হয়েছে' : 'কপি'}
                          </span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl border border-dashed border-[#E2136E]/40 hover:border-[#E2136E] bg-white text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-pink-50/50 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-[#E2136E]" />
                        <span>ডিভাইস থেকে কিউআর ছবি আপলোড করুন</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                showBanner('success', 'কিউআর ছবি অপ্টিমাইজ হচ্ছে...');
                                const compressed = await compressQrImageFile(file);
                                setConfig((prev) => ({ ...prev, bkashQrImageUrl: compressed }));
                                showBanner('success', 'বিকাশ কিউআর ছবি প্রস্তুত হয়েছে — সংরক্ষণ করতে উপরে "সেটিংস সংরক্ষণ করুন" বাটনে চাপ দিন।');
                              } catch (err: any) {
                                showBanner('error', err.message || 'ছবি প্রসেস করতে ব্যর্থ হয়েছে।');
                              }
                            }
                          }}
                        />
                      </label>
                    </div>

                    {config.bkashQrImageUrl && (
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 flex items-center gap-3">
                        <img
                          src={config.bkashQrImageUrl}
                          alt="BKASH QR PREVIEW"
                          className="w-14 h-14 rounded-lg object-contain border border-slate-100 bg-white shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-bold text-emerald-700 block">
                            কিউআর কোড যুক্ত হয়েছে
                          </span>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            ব্যবহারকারী কিউআর কোড স্ক্যান করে সরাসরি পেমেন্ট করতে পারবেন।
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* NAGAD Config Box */}
              <div className="min-w-0 p-4 sm:p-5 rounded-2xl bg-orange-50/40 border border-[#EA580C]/20 space-y-4">
                <div className="flex items-center gap-3">
                  <PaymentMethodLogo provider="NAGAD" size="md" />
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    নগদ সেটিংস (NAGAD)
                  </h3>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    নগদ মোবাইল নম্বর (NAGAD NUMBER) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={config.nagadNumber}
                      onChange={(e) => setConfig({ ...config, nagadNumber: e.target.value })}
                      placeholder="018XXXXXXXX"
                      className="w-full min-h-[44px] px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black font-mono text-slate-900 outline-none focus:border-[#EA580C] tabular-nums"
                    />
                    {config.nagadNumber && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(config.nagadNumber, 'CONFIG_NAGAD_NUM', 'নগদ নম্বর কপি হয়েছে!')}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                        title="নগদ নম্বর কপি করুন"
                      >
                        {copiedKey === 'CONFIG_NAGAD_NUM' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="hidden sm:inline">
                          {copiedKey === 'CONFIG_NAGAD_NUM' ? 'কপি হয়েছে' : 'কপি'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                <SelectTrigger
                  id="nagad-account-type-trigger"
                  label="অ্যাকাউন্টের ধরন (ACCOUNT TYPE)"
                  required
                  value={config.nagadAccountType}
                  displayValue={ACCOUNT_TYPE_LABELS[config.nagadAccountType]}
                  icon={CreditCard}
                  onClick={() => setNagadTypeSheetOpen(true)}
                />

                {/* Nagad QR Code (Image URL / File Upload) */}
                <div className="pt-3 border-t border-[#EA580C]/15 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-[#EA580C]" />
                      <span>নগদ কিউআর কোড (NAGAD QR CODE)</span>
                    </label>
                    {config.nagadQrImageUrl && (
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, nagadQrImageUrl: '' })}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        মুছে ফেলুন
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={config.nagadQrImageUrl || ''}
                        onChange={(e) => setConfig({ ...config, nagadQrImageUrl: e.target.value })}
                        placeholder="কিউআর ইমেজ লিঙ্ক (URL) দিন... (https://...)"
                        className="w-full min-h-[42px] px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#EA580C]"
                      />
                      {config.nagadQrImageUrl && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(config.nagadQrImageUrl || '', 'CONFIG_NAGAD_QR', 'নগদ কিউআর লিঙ্ক কপি হয়েছে!')}
                          className="min-h-[42px] px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                          title="কিউআর লিঙ্ক কপি করুন"
                        >
                          {copiedKey === 'CONFIG_NAGAD_QR' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span className="hidden sm:inline">
                            {copiedKey === 'CONFIG_NAGAD_QR' ? 'কপি হয়েছে' : 'কপি'}
                          </span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl border border-dashed border-[#EA580C]/40 hover:border-[#EA580C] bg-white text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-orange-50/50 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-[#EA580C]" />
                        <span>ডিভাইস থেকে কিউআর ছবি আপলোড করুন</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                showBanner('success', 'কিউআর ছবি অপ্টিমাইজ হচ্ছে...');
                                const compressed = await compressQrImageFile(file);
                                setConfig((prev) => ({ ...prev, nagadQrImageUrl: compressed }));
                                showBanner('success', 'নগদ কিউআর ছবি প্রস্তুত হয়েছে — সংরক্ষণ করতে উপরে "সেটিংস সংরক্ষণ করুন" বাটনে চাপ দিন।');
                              } catch (err: any) {
                                showBanner('error', err.message || 'ছবি প্রসেস করতে ব্যর্থ হয়েছে।');
                              }
                            }
                          }}
                        />
                      </label>
                    </div>

                    {config.nagadQrImageUrl && (
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 flex items-center gap-3">
                        <img
                          src={config.nagadQrImageUrl}
                          alt="NAGAD QR PREVIEW"
                          className="w-14 h-14 rounded-lg object-contain border border-slate-100 bg-white shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-bold text-emerald-700 block">
                            কিউআর কোড যুক্ত হয়েছে
                          </span>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            ব্যবহারকারী কিউআর কোড স্ক্যান করে সরাসরি পেমেন্ট করতে পারবেন।
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Universal BANGLA QR Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-sky-50/80 border border-emerald-200/80 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                      সর্বজনীন বাংলা কিউআর (BANGLA QR CODE)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      বাংলাদেশ ব্যাংক অনুমোদিত সর্বজনীন বাংলা কিউআর — যেকোনো ব্যাংকিং বা MFS অ্যাপ (বিকাশ, নগদ, রকেট, উপায়, কার্ড ইত্যাদি) দিয়ে স্ক্যানযোগ্য।
                    </p>
                  </div>
                </div>

                {config.banglaQrImageUrl && (
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, banglaQrImageUrl: '' })}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer self-start sm:self-center shrink-0"
                  >
                    কিউআর মুছে ফেলুন
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
                <div className="md:col-span-8 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={config.banglaQrImageUrl || ''}
                      onChange={(e) => setConfig({ ...config, banglaQrImageUrl: e.target.value })}
                      placeholder="বাংলা কিউআর ইমেজ লিঙ্ক (URL) দিন... (যেমন: https://...)"
                      className="w-full min-h-[44px] px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 outline-none focus:border-emerald-600"
                    />
                    {config.banglaQrImageUrl && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(config.banglaQrImageUrl || '', 'CONFIG_BANGLA_QR', 'বাংলা কিউআর লিঙ্ক কপি হয়েছে!')}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                        title="বাংলা কিউআর লিঙ্ক কপি করুন"
                      >
                        {copiedKey === 'CONFIG_BANGLA_QR' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="hidden sm:inline">
                          {copiedKey === 'CONFIG_BANGLA_QR' ? 'কপি হয়েছে' : 'কপি'}
                        </span>
                      </button>
                    )}
                  </div>

                  <label className="w-full min-h-[40px] px-3.5 py-2 rounded-xl border border-dashed border-emerald-400 bg-white text-xs font-bold text-emerald-800 flex items-center justify-center gap-2 cursor-pointer hover:bg-emerald-50/60 transition-colors">
                    <Upload className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>ডিভাইস থেকে বাংলা কিউআর ছবি আপলোড করুন</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            showBanner('success', 'বাংলা কিউআর ছবি অপ্টিমাইজ হচ্ছে...');
                            const compressed = await compressQrImageFile(file);
                            setConfig((prev) => ({ ...prev, banglaQrImageUrl: compressed }));
                            showBanner('success', 'বাংলা কিউআর ছবি প্রস্তুত হয়েছে — সংরক্ষণ করতে উপরে "সেটিংস সংরক্ষণ করুন" বাটনে চাপ দিন।');
                          } catch (err: any) {
                            showBanner('error', err.message || 'ছবি প্রসেস করতে ব্যর্থ হয়েছে।');
                          }
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="md:col-span-4">
                  {config.banglaQrImageUrl ? (
                    <div className="p-3 rounded-2xl bg-white border border-emerald-200 flex items-center gap-3">
                      <img
                        src={config.banglaQrImageUrl}
                        alt="BANGLA QR PREVIEW"
                        className="w-16 h-16 rounded-xl object-contain border border-slate-100 bg-white shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-black text-emerald-800 block">
                          বাংলা কিউআর সক্রিয়
                        </span>
                        <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                          ইউজার প্যানেলে সরাসরি প্রদর্শিত হবে
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-white/70 border border-slate-200/80 text-[11px] text-slate-500 text-center leading-relaxed">
                      বাংলা কিউআর লিঙ্ক বা ছবি দিলে ব্যবহারকারী যেকোনো মোবাইল অ্যাপ থেকে সহজে স্ক্যান করতে পারবেন।
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Donation Title & Description */}
            <div className="grid grid-cols-1 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">অনুদান পেজের শিরোনাম</label>
                <input
                  type="text"
                  value={config.donationTitle || ''}
                  onChange={(e) => setConfig({ ...config, donationTitle: e.target.value })}
                  className="w-full min-h-[44px] px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-teal-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">অনুদান পেজের বিবরণ</label>
                <textarea
                  rows={2}
                  value={config.donationDescription || ''}
                  onChange={(e) => setConfig({ ...config, donationDescription: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-teal-700"
                />
              </div>
            </div>

            {/* WEBHOOK SECRET KEY */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <KeyRound className="w-4 h-4 text-teal-700 shrink-0" />
                  <label className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                    অ্যান্ড্রয়েড SMS অ্যাপ ওয়েবহুক সিক্রেট কী (WEBHOOK SECRET KEY)
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateSecret}
                  className="w-full sm:w-auto min-h-[40px] px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-teal-800 cursor-pointer shrink-0"
                >
                  নতুন SECRET KEY তৈরি করুন
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={config.smsWebhookSecret || ''}
                  onChange={(e) => setConfig({ ...config, smsWebhookSecret: e.target.value })}
                  placeholder="ঐচ্ছিক সিক্রেট টোকেন (যেমন: DPIB_SMS_SECRET_2026)"
                  className="w-full min-h-[44px] px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 outline-none focus:border-teal-700"
                />
                {config.smsWebhookSecret && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(config.smsWebhookSecret || '', 'CONFIG_SECRET_KEY', 'সিক্রেট কী কপি হয়েছে!')}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                    title="সিক্রেট কী কপি করুন"
                  >
                    {copiedKey === 'CONFIG_SECRET_KEY' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="hidden sm:inline">
                      {copiedKey === 'CONFIG_SECRET_KEY' ? 'কপি হয়েছে' : 'কপি'}
                    </span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                নিরাপত্তার জন্য আপনার অ্যান্ড্রয়েড SMS রিডিং অ্যাপ থেকে HTTP POST পাঠানোর সময় এই সিক্রেট কী-টি{' '}
                <code className="font-mono font-bold text-slate-800">SECRET</code> ফিল্ডে পাঠাতে পারবেন।
              </p>
            </div>
          </form>

          {/* ================= ANDROID SMS WEBHOOK 3 CORE CARDS ================= */}
          <div className="space-y-4 pt-2">
            <div className="border-b border-slate-200/80 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                  SMS ফরোয়ার্ডার ওয়েবহুক কনফিগারেশন (WEBHOOK SETUP)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  আপনার অ্যান্ড্রয়েড SMS ফরোয়ার্ডার অ্যাপ সংযোগ করতে নিচের ৩টি তথ্য আলাদা কার্ডে সাজিয়ে দেওয়া হলো:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* CARD 1: WEBHOOK URL */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between gap-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0">
                        <Globe className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                        ১. ওয়েবহুক URL (WEBHOOK URL)
                      </h4>
                    </div>
                    <span className="text-[10px] font-black uppercase font-outfit px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 shrink-0">
                      POST
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    অ্যাপের <strong className="text-slate-700">URL (HTTPS)</strong> ফিল্ডে এই লিঙ্কটি পেস্ট করুন।
                  </p>

                  <div className="w-full min-h-[42px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-teal-900 break-all select-all flex items-center">
                    {liveVercelUrl}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {copiedKey === 'CARD_WEBHOOK_URL' ? 'কপি সম্পন্ন!' : 'এক ক্লিকে কপি'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(liveVercelUrl, 'CARD_WEBHOOK_URL', 'ওয়েবহুক URL সফলভাবে কপি হয়েছে!')
                    }
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-black uppercase font-outfit flex items-center gap-1.5 cursor-pointer transition-all ${
                      copiedKey === 'CARD_WEBHOOK_URL'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-teal-800 hover:bg-teal-900 text-white shadow-2xs'
                    }`}
                  >
                    {copiedKey === 'CARD_WEBHOOK_URL' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'CARD_WEBHOOK_URL' ? 'COPIED' : 'URL কপি করুন'}</span>
                  </button>
                </div>
              </div>

              {/* CARD 2: SECRET KEY */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between gap-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 flex items-center justify-center shrink-0">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                        ২. সিক্রেট টোকেন (SECRET KEY)
                      </h4>
                    </div>
                    <span className="text-[10px] font-black uppercase font-outfit px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 shrink-0">
                      TOKEN
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    নিরাপত্তা নিশ্চিত করতে এবং ভুয়া রিকোয়েস্ট রোধে এই সিক্রেট টোকেনটি ব্যবহৃত হয়।
                  </p>

                  <div className="w-full min-h-[42px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-purple-900 break-all select-all flex items-center">
                    {config.smsWebhookSecret || 'DPIB_SMS_FUYTU9B2F5ZRK77F'}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateSecret}
                    className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-700 cursor-pointer transition-colors"
                  >
                    নতুন তৈরি
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        config.smsWebhookSecret || 'DPIB_SMS_FUYTU9B2F5ZRK77F',
                        'CARD_SECRET_TOKEN',
                        'সিক্রেট টোকেন সফলভাবে কপি হয়েছে!'
                      )
                    }
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-black uppercase font-outfit flex items-center gap-1.5 cursor-pointer transition-all ${
                      copiedKey === 'CARD_SECRET_TOKEN'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs'
                    }`}
                  >
                    {copiedKey === 'CARD_SECRET_TOKEN' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'CARD_SECRET_TOKEN' ? 'COPIED' : 'সিক্রেট কপি করুন'}</span>
                  </button>
                </div>
              </div>

              {/* CARD 3: JSON PAYLOAD TEMPLATE */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between gap-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-center shrink-0">
                        <Code2 className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                        ৩. JSON পে-লোড টেমপ্লেট (PAYLOAD)
                      </h4>
                    </div>
                    <span className="text-[10px] font-black uppercase font-outfit px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                      JSON BODY
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    অ্যাপের <strong className="text-slate-700">JSON পে-লোড টেমপ্লেট</strong> বক্সে এই কোডটি পেস্ট করুন।
                  </p>

                  <pre className="w-full text-[11px] font-mono text-slate-800 bg-slate-50 border border-slate-200 p-2.5 rounded-xl overflow-x-auto whitespace-pre leading-relaxed select-all">
{`{
  "sender": "[SENDER]",
  "message": "[MESSAGE]",
  "secret": "${config.smsWebhookSecret || 'DPIB_SMS_FUYTU9B2F5ZRK77F'}"
}`}
                  </pre>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {copiedKey === 'CARD_JSON_PAYLOAD' ? 'কপি সম্পন্ন!' : 'এক ক্লিকে কপি'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const payloadTemplate = `{\n  "sender": "[SENDER]",\n  "message": "[MESSAGE]",\n  "secret": "${config.smsWebhookSecret || 'DPIB_SMS_FUYTU9B2F5ZRK77F'}"\n}`;
                      copyToClipboard(payloadTemplate, 'CARD_JSON_PAYLOAD', 'JSON পে-লোড সফলভাবে কপি হয়েছে!');
                    }}
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-black uppercase font-outfit flex items-center gap-1.5 cursor-pointer transition-all ${
                      copiedKey === 'CARD_JSON_PAYLOAD'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                    }`}
                  >
                    {copiedKey === 'CARD_JSON_PAYLOAD' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'CARD_JSON_PAYLOAD' ? 'COPIED' : 'JSON কপি করুন'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: LIVE SMS SIMULATOR & INCOMING LOGS ================= */}
      {activeTab === 'SIMULATOR' && (
        <div className="space-y-6">
          {/* Interactive Webhook Tester */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-4 space-y-1">
              <h2 className="text-base sm:text-xl font-black text-slate-900">
                অটোমেটিক SMS ভেরিফিকেশন লাইভ টেস্টার
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                অ্যান্ড্রয়েড অ্যাপ সংযুক্ত করার আগেই আসল বিকাশ (BKASH) বা নগদ (NAGAD) SMS টেক্সট দিয়ে অটো-ম্যাচিং পরীক্ষা করুন।
              </p>
            </div>

            {/* Digital Action Sheet Quick Template / Pending Donation Picker */}
            <SelectTrigger
              id="sim-template-picker-trigger"
              label={`দ্রুত SMS টেমপ্লেট বা পেন্ডিং অনুদান নির্বাচন (${toBanglaDigits(
                pendingDonations.length
              )}টি PENDING)`}
              value={simTemplateKey}
              displayValue={simTemplateDisplayLabel}
              icon={Sparkles}
              onClick={() => setSimTemplateSheetOpen(true)}
            />

            <form onSubmit={handleRunSmsSimulation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-4">
                  <SelectTrigger
                    id="sim-sender-trigger"
                    label="SMS প্রেরক (SENDER)"
                    required
                    value={simSender}
                    displayValue={simSender === 'BKASH' ? 'বিকাশ (BKASH)' : 'নগদ (NAGAD)'}
                    icon={Smartphone}
                    onClick={() => setSimSenderSheetOpen(true)}
                  />
                </div>

                <div className="md:col-span-8 space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    ইনকামিং SMS টেক্সট (SMS BODY)
                  </label>
                  <input
                    type="text"
                    value={simMessage}
                    onChange={(e) => setSimMessage(e.target.value)}
                    className="w-full min-h-[44px] px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 outline-none focus:bg-white focus:border-teal-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={simRunning}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4 shrink-0" />
                <span>{simRunning ? 'WEBHOOK প্রসেস হচ্ছে...' : 'WEBHOOK টেস্ট রান করুন'}</span>
              </button>
            </form>

            {simResult && (
              <div
                className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  simResult.matched
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="font-black text-sm leading-snug">
                  {simResult.matched
                    ? `অটো-ভেরিফিকেশন সফল! ম্যাচকৃত রেফারেন্স: ${simResult.matchedReferenceCode}`
                    : 'SMS লগ সংরক্ষিত হয়েছে (বর্তমানে কোনো PENDING অনুদানের সাথে TRXID মেলেনি)'}
                </div>
                {simResult.parsed && (
                  <div className="font-mono text-[11px] flex flex-wrap gap-x-4 gap-y-1 uppercase">
                    <span>PROVIDER: {simResult.parsed.provider}</span>
                    <span>AMOUNT: {simResult.parsed.parsedAmount ?? 'N/A'}</span>
                    <span>TRXID: {simResult.parsed.parsedTrxId ?? 'N/A'}</span>
                    <span>SENDER: {simResult.parsed.parsedSenderPhone ?? 'N/A'}</span>
                    <span>REF: {simResult.parsed.parsedReference ?? 'N/A'}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Incoming SMS Logs Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-200/80">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                প্রাপ্ত ইনকামিং SMS লগ (WEBHOOK HISTORY)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                অ্যান্ড্রয়েড অ্যাপ থেকে আসা প্রতিটি SMS এখানে পার্সিং তথ্যের সাথে সংরক্ষিত থাকে।
              </p>
            </div>

            {smsLogs.length === 0 ? (
              <div className="p-8 text-center text-xs sm:text-sm text-slate-500">
                এখনো কোনো ইনকামিং SMS WEBHOOK রিসিভ হয়নি।
              </div>
            ) : (
              <div className="divide-y divide-slate-200/70">
                {smsLogs.map((log) => (
                  <div key={log.id} className="p-4 sm:p-5 space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2 font-mono font-bold min-w-0">
                        <PaymentMethodLogo
                          provider={log.provider === 'NAGAD' ? 'NAGAD' : 'BKASH'}
                          size="xs"
                        />
                        <span
                          className={`uppercase font-outfit ${
                            log.provider === 'BKASH' ? 'text-[#E2136E]' : 'text-[#EA580C]'
                          }`}
                        >
                          {log.provider} ({String(log.senderAddress || '').toUpperCase()})
                        </span>
                        {log.parsedTrxId && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="inline-flex items-center gap-1 text-slate-900 break-all">
                              TRXID: {log.parsedTrxId}
                              <button
                                type="button"
                                title="TRXID কপি করুন"
                                onClick={() => copyToClipboard(log.parsedTrxId || '', `log_trx_${log.id}`, `TRXID ${log.parsedTrxId} কপি হয়েছে!`)}
                                className="p-0.5 hover:bg-slate-200/80 rounded cursor-pointer transition-colors"
                              >
                                {copiedKey === `log_trx_${log.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3 text-slate-400" />
                                )}
                              </button>
                            </span>
                          </>
                        )}
                        {log.parsedAmount && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="text-slate-900 tabular-nums">
                              ৳{toBanglaDigits(log.parsedAmount)}
                            </span>
                          </>
                        )}
                      </div>

                      <span
                        className={`font-outfit uppercase text-xs font-black ${
                          log.matchStatus === 'MATCHED'
                            ? 'text-emerald-700'
                            : isUnexpandedSmsPlaceholder(log.rawMessage)
                            ? 'text-rose-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {log.matchStatus === 'MATCHED'
                          ? `MATCHED (${log.matchedReferenceCode || ''})`
                          : isUnexpandedSmsPlaceholder(log.rawMessage)
                          ? 'TEMPLATE PLACEHOLDER ERROR'
                          : 'PENDING LOG'}
                      </span>
                    </div>

                    <div className="relative group">
                      <p className="text-xs font-mono text-slate-600 bg-slate-50 p-3 pr-20 rounded-xl border border-slate-200/60 break-words leading-relaxed">
                        {log.rawMessage}
                      </p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(log.rawMessage, `log_raw_${log.id}`, 'SMS টেক্সট কপি হয়েছে!')}
                        className="absolute right-2.5 top-2.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                      >
                        {copiedKey === `log_raw_${log.id}` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                        <span>{copiedKey === `log_raw_${log.id}` ? 'কপি হয়েছে' : 'কপি'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= DIGITAL ACTION SHEETS (SELECTORS & ACTIONS) ================= */}

      {/* 1. Mobile Navigation Module Digital Action Sheet */}
      <SelectBottomSheet
        isOpen={mobileTabSheetOpen}
        onClose={() => setMobileTabSheetOpen(false)}
        title="অনুদান ও পেমেন্ট হাব মেনু"
        subtitle="ব্যবস্থাপনা সেকশন নির্বাচন করুন"
        options={tabSheetOptions}
        selectedValue={activeTab}
        onSelect={(val) => setActiveTab(val as AdminDonationTab)}
        searchable={false}
      />

      {/* 2. Donation Status Filter Digital Action Sheet */}
      <SelectBottomSheet
        isOpen={statusFilterSheetOpen}
        onClose={() => setStatusFilterSheetOpen(false)}
        title="অনুদান স্ট্যাটাস ফিল্টার (STATUS)"
        subtitle="ফিল্টার করতে একটি স্ট্যাটাস নির্বাচন করুন"
        options={statusFilterOptions}
        selectedValue={statusFilter}
        onSelect={(val) => setStatusFilter(val as 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED')}
        searchable={false}
      />

      {/* 3. Completed Transactions Provider Filter Digital Action Sheet */}
      <SelectBottomSheet
        isOpen={txnProviderSheetOpen}
        onClose={() => setTxnProviderSheetOpen(false)}
        title="পেমেন্ট মাধ্যম নির্বাচন (PROVIDER)"
        subtitle="BKASH বা NAGAD অনুযায়ী লেনদেন ফিল্টার করুন"
        options={txnProviderOptions}
        selectedValue={txnProviderFilter}
        onSelect={(val) => setTxnProviderFilter(val as 'ALL' | 'BKASH' | 'NAGAD')}
        searchable={false}
      />

      {/* 4. BKASH Account Type Digital Action Sheet */}
      <SelectBottomSheet
        isOpen={bkashTypeSheetOpen}
        onClose={() => setBkashTypeSheetOpen(false)}
        title="বিকাশ অ্যাকাউন্টের ধরন (BKASH TYPE)"
        subtitle="অনুদান গ্রহণের অ্যাকাউন্ট ক্যাটাগরি নির্বাচন করুন"
        options={ACCOUNT_TYPE_OPTIONS}
        selectedValue={config.bkashAccountType}
        onSelect={(val) =>
          setConfig((prev) => ({
            ...prev,
            bkashAccountType: val as 'PERSONAL' | 'MERCHANT' | 'AGENT',
          }))
        }
        searchable={false}
      />

      {/* 5. NAGAD Account Type Digital Action Sheet */}
      <SelectBottomSheet
        isOpen={nagadTypeSheetOpen}
        onClose={() => setNagadTypeSheetOpen(false)}
        title="নগদ অ্যাকাউন্টের ধরন (NAGAD TYPE)"
        subtitle="অনুদান গ্রহণের অ্যাকাউন্ট ক্যাটাগরি নির্বাচন করুন"
        options={ACCOUNT_TYPE_OPTIONS}
        selectedValue={config.nagadAccountType}
        onSelect={(val) =>
          setConfig((prev) => ({
            ...prev,
            nagadAccountType: val as 'PERSONAL' | 'MERCHANT' | 'AGENT',
          }))
        }
        searchable={false}
      />

      {/* 6. SMS Simulator Sender Digital Action Sheet */}
      <SelectBottomSheet
        isOpen={simSenderSheetOpen}
        onClose={() => setSimSenderSheetOpen(false)}
        title="SMS প্রেরক মাধ্যম (SENDER)"
        subtitle="কোন গেটওয়ের SMS টেস্ট করতে চান তা বাছাই করুন"
        options={simSenderOptions}
        selectedValue={simSender}
        onSelect={(val) => setSimSender(val as 'BKASH' | 'NAGAD')}
        searchable={false}
      />

      {/* 7. SMS Simulator Quick Template & Pending Donation Digital Action Sheet */}
      <SelectBottomSheet
        isOpen={simTemplateSheetOpen}
        onClose={() => setSimTemplateSheetOpen(false)}
        title="SMS টেমপ্লেট ও PENDING অনুদান"
        subtitle="অটো-ফিল করতে স্যাম্পল বা অপেক্ষমাণ অনুদান নির্বাচন করুন"
        options={simTemplateOptions}
        selectedValue={simTemplateKey}
        onSelect={handleSelectSimulatorTemplate}
        searchable={simTemplateOptions.length > 5}
      />

      {/* 8. Donation Detail & Status Action Digital BottomSheet */}
      <BottomSheet
        isOpen={Boolean(selectedDonationSheet)}
        onClose={() => setSelectedDonationSheet(null)}
        title="অনুদান যাচাই ও ব্যবস্থাপনা (ACTION SHEET)"
        subtitle={
          selectedDonationSheet
            ? `REF: ${selectedDonationSheet.referenceCode} · TRXID: ${selectedDonationSheet.transactionId}`
            : undefined
        }
      >
        {selectedDonationSheet && (
          <div className="space-y-5 pb-3">
            {/* Highlight Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <PaymentMethodLogo provider={selectedDonationSheet.paymentMethod} size="md" />
                <div>
                  <div className="text-[11px] font-black uppercase font-outfit text-slate-500">
                    {selectedDonationSheet.paymentMethod} PAYMENT REQUEST
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-950 tabular-nums">
                    ৳ {toBanglaDigits(selectedDonationSheet.amount)} টাকা
                  </div>
                </div>
              </div>

              <span
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase border ${
                  selectedDonationSheet.status === 'VERIFIED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : selectedDonationSheet.status === 'REJECTED'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {selectedDonationSheet.status}
              </span>
            </div>

            {/* Detail Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>দাতার নাম (DONOR)</span>
                </div>
                <div className="font-bold text-slate-900 text-sm">
                  {selectedDonationSheet.donorName || 'শুভাকাঙ্ক্ষী'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>প্রেরকের নম্বর (SENDER)</span>
                  </div>
                  <div className="font-mono font-bold text-slate-900 text-sm tabular-nums truncate">
                    {toBanglaDigits(selectedDonationSheet.senderPhone)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      selectedDonationSheet.senderPhone,
                      'SHEET_PHONE',
                      'প্রেরকের মোবাইল নম্বর কপি হয়েছে!'
                    )
                  }
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black uppercase cursor-pointer shrink-0"
                >
                  {copiedKey === 'SHEET_PHONE' ? 'COPIED' : 'COPY'}
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" />
                    <span>ট্রানজেকশন আইডি (TRXID)</span>
                  </div>
                  <div className="font-mono font-black text-slate-900 text-sm tabular-nums break-all">
                    {selectedDonationSheet.transactionId}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      selectedDonationSheet.transactionId,
                      'SHEET_TRXID',
                      'TRXID কপি হয়েছে!'
                    )
                  }
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black uppercase cursor-pointer shrink-0"
                >
                  {copiedKey === 'SHEET_TRXID' ? 'COPIED' : 'COPY'}
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>অনুদানের খাত (PURPOSE)</span>
                </div>
                <div className="font-bold text-slate-900">
                  {getPurposeLabel(selectedDonationSheet.purpose)}
                </div>
              </div>
            </div>

            {selectedDonationSheet.note && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 break-words">
                <span className="font-bold block text-slate-500 mb-0.5">মন্তব্য (NOTE):</span>
                {selectedDonationSheet.note}
              </div>
            )}

            {selectedDonationSheet.matchedSmsText && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-950 break-words leading-relaxed">
                <span className="font-black uppercase block text-emerald-700 mb-1">
                  AUTO-MATCHED SMS PAYLOAD:
                </span>
                {selectedDonationSheet.matchedSmsText}
              </div>
            )}

            {/* Digital Action Controls */}
            <div className="space-y-2.5 pt-2 border-t border-slate-200/80">
              <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                অ্যাকশন নির্বাচন করুন (SELECT ACTION)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedDonationSheet.status !== 'VERIFIED' && (
                  <button
                    type="button"
                    disabled={processingId === selectedDonationSheet.id}
                    onClick={() => handleManualStatusUpdate(selectedDonationSheet.id, 'VERIFIED')}
                    className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>অনুমোদন করুন (VERIFY)</span>
                  </button>
                )}

                {selectedDonationSheet.status !== 'PENDING' && (
                  <button
                    type="button"
                    disabled={processingId === selectedDonationSheet.id}
                    onClick={() => handleManualStatusUpdate(selectedDonationSheet.id, 'PENDING')}
                    className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>অপেক্ষমাণ করুন (PENDING)</span>
                  </button>
                )}

                {selectedDonationSheet.status !== 'REJECTED' && (
                  <button
                    type="button"
                    disabled={processingId === selectedDonationSheet.id}
                    onClick={() => handleManualStatusUpdate(selectedDonationSheet.id, 'REJECTED')}
                    className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>বাতিল করুন (REJECT)</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={processingId === selectedDonationSheet.id}
                  onClick={() => setDeleteConfirmDonation(selectedDonationSheet)}
                  className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-slate-100 hover:bg-rose-600 text-slate-700 hover:text-white border border-slate-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                  <span>রেকর্ড মুছে ফেলুন (DELETE)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* 9. Completed Transaction Digital Receipt Sheet */}
      <BottomSheet
        isOpen={Boolean(selectedTxnSheet)}
        onClose={() => setSelectedTxnSheet(null)}
        title="সম্পন্ন লেনদেন ডিজিটাল রসিদ (TXN RECEIPT)"
        subtitle={selectedTxnSheet ? selectedTxnSheet.transactionNumber : undefined}
      >
        {selectedTxnSheet && (
          <div className="space-y-4 pb-3">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <PaymentMethodLogo provider={selectedTxnSheet.paymentMethod} size="md" />
                <div>
                  <div className="text-[11px] font-black uppercase font-outfit text-emerald-700">
                    {selectedTxnSheet.paymentMethod} COMPLETED TXN
                  </div>
                  <div className="text-2xl font-black text-slate-950 tabular-nums">
                    ৳ {toBanglaDigits(selectedTxnSheet.amount)} টাকা
                  </div>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase">
                SUCCESS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">
                    TXN NUMBER
                  </span>
                  <span className="font-mono font-black text-slate-950 text-sm tabular-nums break-all">
                    {selectedTxnSheet.transactionNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      selectedTxnSheet.transactionNumber,
                      'TXN_NUM',
                      'TXN নম্বর কপি হয়েছে!'
                    )
                  }
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black uppercase cursor-pointer shrink-0"
                >
                  {copiedKey === 'TXN_NUM' ? 'COPIED' : 'COPY'}
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">
                    GATEWAY TRXID
                  </span>
                  <span className="font-mono font-black text-slate-950 text-sm tabular-nums break-all">
                    {selectedTxnSheet.gatewayTrxId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      selectedTxnSheet.gatewayTrxId,
                      'TXN_GW',
                      'GATEWAY TRXID কপি হয়েছে!'
                    )
                  }
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black uppercase cursor-pointer shrink-0"
                >
                  {copiedKey === 'TXN_GW' ? 'COPIED' : 'COPY'}
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">
                  দাতা ও প্রেরকের নম্বর (DONOR & SENDER)
                </span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {selectedTxnSheet.donorName || 'শুভাকাঙ্ক্ষী'}
                </span>
                <span className="font-mono text-slate-600 tabular-nums">
                  {toBanglaDigits(selectedTxnSheet.senderPhone)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>সম্পন্নের সময় ও খাত</span>
                </span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {getPurposeLabel(selectedTxnSheet.purpose)}
                </span>
                <span className="text-slate-600 block">
                  {selectedTxnSheet.completedAt > 0
                    ? formatTransactionDateTimeBangla(selectedTxnSheet.completedAt)
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* 10. Delete Confirmation Digital Action Sheet (Replaces window.confirm) */}
      <BottomSheet
        isOpen={Boolean(deleteConfirmDonation)}
        onClose={() => setDeleteConfirmDonation(null)}
        title="অনুদান রেকর্ড মুছে ফেলবেন?"
        subtitle={
          deleteConfirmDonation
            ? `REF: ${deleteConfirmDonation.referenceCode} • ৳ ${toBanglaDigits(
                deleteConfirmDonation.amount
              )}`
            : undefined
        }
        compact={true}
        zIndex="z-[10002]"
      >
        {deleteConfirmDonation && (
          <div className="space-y-4 pb-2">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-rose-950 leading-relaxed">
                আপনি কি নিশ্চিতভাবে{' '}
                <strong className="font-mono">{deleteConfirmDonation.referenceCode}</strong> (
                <strong>{deleteConfirmDonation.donorName || 'শুভাকাঙ্ক্ষী'}</strong> — ৳{' '}
                {toBanglaDigits(deleteConfirmDonation.amount)}) রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান? এই কাজটি আর ফিরিয়ে আনা যাবে না।
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmDonation(null)}
                className="min-h-[48px] px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                disabled={processingId === deleteConfirmDonation.id}
                onClick={handleConfirmDeleteRecord}
                className="min-h-[48px] px-4 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                <span>
                  {processingId === deleteConfirmDonation.id
                    ? 'মুছে ফেলা হচ্ছে...'
                    : 'হ্যাঁ, মুছে ফেলুন'}
                </span>
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
