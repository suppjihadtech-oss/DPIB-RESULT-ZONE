import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  History,
  Receipt,
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
  subscribeAllDonations,
  subscribeDonationSmsLogs,
  subscribeTransactions,
  updateDonationStatusManually,
} from '../../services/donationService';
import { getSystemSettings, saveSystemSettings } from '../../services/db';
import { toBanglaDigits, toEnglishDigits } from '../../utils/bangla';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { PaymentMethodLogo } from '../common/PaymentMethodLogo';

interface DonationManagementProps {
  onRefreshSettings?: () => void;
}

export const DonationManagement: React.FC<DonationManagementProps> = ({
  onRefreshSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'DONATIONS' | 'TRANSACTIONS' | 'SETTINGS' | 'SIMULATOR'>('DONATIONS');

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
  const [configSavedMsg, setConfigSavedMsg] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // SMS Webhook Simulator States
  const [simSender, setSimSender] = useState<'bKash' | 'NAGAD'>('bKash');
  const [simMessage, setSimMessage] = useState<string>(
    'You have received Tk 100.00 from 01712345678. Ref DPIB-4829. Fee Tk 0.00. Balance Tk 1500.00. TrxID BKH9A21M4P at 05/11/2026 14:30'
  );
  const [simRunning, setSimRunning] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  useEffect(() => {
    const unsubDonations = subscribeAllDonations(
      (items) => {
        setDonations(items);
        setLoading(false);
      },
      (err) => {
        console.error('Donations subscription error:', err);
        setLoading(false);
      }
    );

    const unsubSms = subscribeDonationSmsLogs(
      (logs) => {
        setSmsLogs(logs);
      },
      (err) => {
        console.warn('SMS logs subscription warning:', err);
      }
    );

    const unsubTransactions = subscribeTransactions(
      (items) => {
        setTransactions(items);
      },
      (err) => {
        console.warn('Transactions subscription warning:', err);
      }
    );

    getSystemSettings().then((sys) => {
      setFullSettings(sys);
      if (sys.donationConfig) {
        setConfig({
          ...DEFAULT_DONATION_CONFIG,
          ...sys.donationConfig,
        });
      }
    });

    return () => {
      unsubDonations();
      unsubTransactions();
      unsubSms();
    };
  }, []);

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/donations/sms-webhook`
      : '/api/donations/sms-webhook';

  const handleCopyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = webhookUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleGenerateSecret = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let token = 'DPIB_SMS_';
    for (let i = 0; i < 16; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setConfig((prev) => ({ ...prev, smsWebhookSecret: token }));
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigSavedMsg(null);
    try {
      await saveSystemSettings({
        ...(fullSettings || {}),
        donationConfig: config,
        updatedAt: Date.now(),
      });
      setConfigSavedMsg('বিকাশ, নগদ ও অটো-SMS ওয়েবহুক সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
      if (onRefreshSettings) onRefreshSettings();
      setTimeout(() => setConfigSavedMsg(null), 4000);
    } catch (err: any) {
      alert(`সেটিংস সংরক্ষণে ত্রুটি: ${err?.message || err}`);
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
    } catch (err: any) {
      alert(`স্ট্যাটাস আপডেটে সমস্যা: ${err?.message || err}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteRecord = async (donationId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই অনুদান রেকর্ডটি মুছে ফেলতে চান?')) return;
    setProcessingId(donationId);
    try {
      await deleteDonationRecord(donationId);
    } catch (err: any) {
      alert(`মুছে ফেলতে সমস্যা: ${err?.message || err}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleFillSampleFromPending = (pending: DonationRecord) => {
    if (pending.paymentMethod === 'BKASH') {
      setSimSender('bKash');
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
          sender: simSender,
          message: simMessage.trim(),
          secret: config.smsWebhookSecret || '',
          adminSimulation: true,
        }),
      });
      const data = await resp.json();
      setSimResult(data);
    } catch (err: any) {
      setSimResult({ success: false, error: err?.message || 'Webhook request failed' });
    } finally {
      setSimRunning(false);
    }
  };

  // Summary Statistics
  const verifiedDonations = donations.filter((d) => d.status === 'VERIFIED');
  const totalVerifiedAmount = verifiedDonations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const autoVerifiedCount = verifiedDonations.filter(
    (d) => d.verificationSource === 'AUTO_SMS_APP'
  ).length;
  const pendingDonations = donations.filter((d) => d.status === 'PENDING');

  // Filtered list
  const filteredDonations = donations.filter((d) => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      d.referenceCode.toLowerCase().includes(q) ||
      d.transactionId.toLowerCase().includes(q) ||
      d.senderPhone.toLowerCase().includes(q) ||
      (d.donorName || '').toLowerCase().includes(q)
    );
  });

  const filteredTransactions = transactions.filter((t) => {
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

  if (loading) {
    return <LoadingSpinner message="অনুদান ও পেমেন্ট ডাটা লোড হচ্ছে..." />;
  }

  return (
    <div className="space-y-6 font-bengali">
      {/* Page Header & Tab Navigation */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center shrink-0">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              অনুদান ও অটোমেটিক পেমেন্ট হাব
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              বিকাশ ও নগদ অনুদান ব্যবস্থাপনা এবং অ্যান্ড্রয়েড SMS রিডিং অ্যাপ অটো-ভেরিফিকেশন
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            id="admin-donation-tab-list"
            onClick={() => setActiveTab('DONATIONS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'TRANSACTIONS'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>লেনদেন হিস্ট্রি ({toBanglaDigits(transactions.length)})</span>
          </button>
          <button
            type="button"
            id="admin-donation-tab-settings"
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'SETTINGS'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>নম্বর ও ওয়েবহুক সেটিংস</span>
          </button>
          <button
            type="button"
            id="admin-donation-tab-simulator"
            onClick={() => setActiveTab('SIMULATOR')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'SIMULATOR'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>SMS টেস্টার ও লগ ({toBanglaDigits(smsLogs.length)})</span>
          </button>
        </div>
      </div>

      {/* 4 Clean Summary Cards (Tabular Numerals) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 block">মোট যাচাইকৃত অনুদান</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700 tabular-nums mt-1 block">
            ৳ {toBanglaDigits(totalVerifiedAmount)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {toBanglaDigits(verifiedDonations.length)}টি সফল লেনদেন
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 block">অটো-ভেরিফাইড (SMS অ্যাপ)</span>
          <span className="text-xl sm:text-2xl font-black text-blue-700 tabular-nums mt-1 block">
            {toBanglaDigits(autoVerifiedCount)} টি
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            স্বয়ংক্রিয় TrxID ম্যাচিং
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 block">যাচাইাধীন (Pending)</span>
          <span className="text-xl sm:text-2xl font-black text-amber-600 tabular-nums mt-1 block">
            {toBanglaDigits(pendingDonations.length)} টি
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            SMS বা ম্যানুয়াল অনুমোদনের অপেক্ষায়
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 block">সক্রিয় পেমেন্ট মাধ্যম</span>
          <div className="mt-2 space-y-1.5 text-xs font-mono font-bold text-slate-800 tabular-nums">
            <div className="flex items-center gap-2 truncate">
              <PaymentMethodLogo provider="BKASH" size="xs" />
              <span className="text-[#E2136E] font-bengali">বিকাশ:</span>
              <span className="truncate">{config.bkashNumber}</span>
            </div>
            <div className="flex items-center gap-2 truncate">
              <PaymentMethodLogo provider="NAGAD" size="xs" />
              <span className="text-[#EA580C] font-bengali">নগদ:</span>
              <span className="truncate">{config.nagadNumber}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= TAB 1: DONATIONS LIST & MANUAL VERIFICATION ================= */}
      {activeTab === 'DONATIONS' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Search & Status Filter Bar */}
          <div className="p-4 sm:p-6 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="TrxID, রেফারেন্স (DPIB-XXXX), নম্বর বা নাম দিয়ে খুঁজুন..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-700 outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'ALL', label: 'সকল' },
                  { id: 'PENDING', label: 'যাচাইাধীন' },
                  { id: 'VERIFIED', label: 'যাচাই সম্পন্ন' },
                  { id: 'REJECTED', label: 'বাতিল' },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    statusFilter === st.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Donations List */}
          {filteredDonations.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">কোনো অনুদান রেকর্ড পাওয়া যায়নি</h3>
              <p className="text-xs text-slate-500">
                ব্যবহারকারীরা বিকাশ বা নগদে অনুদান পাঠিয়ে তথ্য জমা দিলে এখানে রিয়েলটাইমে প্রদর্শিত হবে।
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200/70">
              {filteredDonations.map((item) => {
                const isBusy = processingId === item.id;
                return (
                  <div
                    key={item.id}
                    className="p-4 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* Top Meta Line (Zero Pill Clutter — Clean Inline Typography with Dot Separators) */}
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                        <PaymentMethodLogo provider={item.paymentMethod} size="xs" />
                        <span
                          className={`font-black ${
                            item.paymentMethod === 'BKASH' ? 'text-[#E2136E]' : 'text-[#EA580C]'
                          }`}
                        >
                          {item.paymentMethod === 'BKASH' ? 'বিকাশ' : 'নগদ'}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono font-black text-slate-900 tabular-nums">
                          {item.referenceCode}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono font-bold text-slate-800 tabular-nums">
                          আইডি: {item.transactionId}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono text-slate-600 tabular-nums">
                          নম্বর: {item.senderPhone}
                        </span>
                      </div>

                      {/* Primary Amount & Donor Title */}
                      <div className="flex flex-wrap items-baseline gap-2.5">
                        <span className="text-lg sm:text-xl font-black text-slate-950 tabular-nums">
                          ৳ {toBanglaDigits(item.amount)} টাকা
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-slate-700">
                          — {item.donorName || 'শুভাকাঙ্ক্ষী'}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({getPurposeLabel(item.purpose)})
                        </span>
                      </div>

                      {item.note && (
                        <p className="text-xs text-slate-600">মন্তব্য: {item.note}</p>
                      )}

                      {item.matchedSmsText && (
                        <p className="text-[11px] font-mono text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/70 truncate max-w-2xl">
                          এসএমএস ম্যাচ: {item.matchedSmsText}
                        </p>
                      )}
                    </div>

                    {/* Right Status & Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-black mr-2 ${
                          item.status === 'VERIFIED'
                            ? 'text-emerald-700'
                            : item.status === 'REJECTED'
                            ? 'text-rose-700'
                            : 'text-amber-600'
                        }`}
                      >
                        {item.status === 'VERIFIED'
                          ? item.verificationSource === 'AUTO_SMS_APP'
                            ? 'যাচাই সম্পন্ন (অটো এসএমএস)'
                            : 'যাচাই সম্পন্ন (ম্যানুয়াল)'
                          : item.status === 'REJECTED'
                          ? 'যাচাই ব্যর্থ'
                          : 'যাচাই অপেক্ষমাণ'}
                      </span>

                      {item.status !== 'VERIFIED' && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleManualStatusUpdate(item.id, 'VERIFIED')}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>অনুমোদন করুন</span>
                        </button>
                      )}

                      {item.status === 'PENDING' && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleManualStatusUpdate(item.id, 'REJECTED')}
                          className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>বাতিল</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDeleteRecord(item.id)}
                        title="মুছে ফেলুন"
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 1B: AUTO-GENERATED COMPLETED TRANSACTIONS HISTORY ================= */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                স্বয়ংক্রিয় সম্পন্ন লেনদেন হিস্ট্রি (Completed Transactions)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                যেকোনো অনুদান নিশ্চিত বা অনুমোদিত হওয়া মাত্রই স্বয়ংক্রিয়ভাবে একটি স্থায়ী লেনদেন তৈরি হয়ে এখানে প্রদর্শিত হয়।
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={txnSearchQuery}
                  onChange={(e) => setTxnSearchQuery(e.target.value)}
                  placeholder="TXN নম্বর, TrxID বা নম্বর..."
                  className="w-56 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-700 outline-none tabular-nums"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              {(
                [
                  { id: 'ALL', label: 'সকল মাধ্যম' },
                  { id: 'BKASH', label: 'বিকাশ' },
                  { id: 'NAGAD', label: 'নগদ' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setTxnProviderFilter(m.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    txnProviderFilter === m.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                এখনো কোনো সম্পন্ন লেনদেন তৈরি হয়নি
              </h3>
              <p className="text-xs text-slate-500">
                কোনো অনুদান অটো-SMS বা অ্যাডমিন অনুমোদনের মাধ্যমে নিশ্চিত হলে এখানে স্বয়ংক্রিয়ভাবে লেনদেন তৈরি হয়ে দেখাবে।
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200/70">
              {filteredTransactions.map((txn) => (
                <div
                  key={txn.id}
                  className="p-4 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    <PaymentMethodLogo provider={txn.paymentMethod} size="md" />
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                        <span className="font-mono font-black text-slate-950 tabular-nums">
                          {txn.transactionNumber}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span
                          className={`font-black ${
                            txn.paymentMethod === 'BKASH' ? 'text-[#E2136E]' : 'text-[#EA580C]'
                          }`}
                        >
                          {txn.paymentMethod === 'BKASH' ? 'বিকাশ' : 'নগদ'}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono font-bold text-slate-800 tabular-nums">
                          গেটওয়ে TrxID: {txn.gatewayTrxId}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono text-slate-700 tabular-nums">
                          নম্বর: {toBanglaDigits(txn.senderPhone)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-baseline gap-2.5">
                        <span className="text-lg sm:text-xl font-black text-slate-950 tabular-nums">
                          ৳ {toBanglaDigits(txn.amount)} টাকা
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-slate-700">
                          — {txn.donorName || 'শুভাকাঙ্ক্ষী'}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({getPurposeLabel(txn.purpose)})
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-500">
                        <span className="font-mono tabular-nums">
                          রেফারেন্স: {txn.referenceCode}
                        </span>
                        {txn.completedAt > 0 && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span>সম্পন্নের সময়: {formatTransactionDateTimeBangla(txn.completedAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-xs font-black text-emerald-700">
                      {txn.verificationSource === 'AUTO_SMS_APP'
                        ? 'সম্পন্ন (অটো এসএমএস)'
                        : 'সম্পন্ন (ম্যানুয়াল)'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: BKASH / NAGAD & ANDROID SMS WEBHOOK CONFIG ================= */}
      {activeTab === 'SETTINGS' && (
        <div className="space-y-6">
          {configSavedMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{configSavedMsg}</span>
            </div>
          )}

          <form
            onSubmit={handleSaveConfig}
            className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  বিকাশ ও নগদ অ্যাকাউন্ট নম্বর কনফিগারেশন
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  অনুদান পেজে প্রদর্শিত অফিসিয়াল বিকাশ ও নগদ নম্বর এবং বিবরণ নির্ধারণ করুন।
                </p>
              </div>
              <button
                type="submit"
                disabled={savingConfig}
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingConfig ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* bKash Config Box */}
              <div className="p-5 rounded-2xl bg-pink-50/40 border border-[#E2136E]/20 space-y-4">
                <div className="flex items-center gap-3">
                  <PaymentMethodLogo provider="BKASH" size="md" />
                  <h3 className="text-sm sm:text-base font-black text-slate-900">বিকাশ সেটিংস</h3>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    বিকাশ মোবাইল নম্বর <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={config.bkashNumber}
                    onChange={(e) => setConfig({ ...config, bkashNumber: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black font-mono text-slate-900 outline-none focus:border-[#E2136E]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">অ্যাকাউন্টের ধরন</label>
                  <select
                    value={config.bkashAccountType}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bkashAccountType: e.target.value as 'PERSONAL' | 'MERCHANT' | 'AGENT',
                      })
                    }
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-[#E2136E]"
                  >
                    <option value="PERSONAL">পার্সোনাল (সেন্ড মানি)</option>
                    <option value="MERCHANT">মার্চেন্ট (মেক পেমেন্ট)</option>
                    <option value="AGENT">এজেন্ট (ক্যাশ আউট)</option>
                  </select>
                </div>
              </div>

              {/* Nagad Config Box */}
              <div className="p-5 rounded-2xl bg-orange-50/40 border border-[#EA580C]/20 space-y-4">
                <div className="flex items-center gap-3">
                  <PaymentMethodLogo provider="NAGAD" size="md" />
                  <h3 className="text-sm sm:text-base font-black text-slate-900">নগদ সেটিংস</h3>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    নগদ মোবাইল নম্বর <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={config.nagadNumber}
                    onChange={(e) => setConfig({ ...config, nagadNumber: e.target.value })}
                    placeholder="018XXXXXXXX"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black font-mono text-slate-900 outline-none focus:border-[#EA580C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">অ্যাকাউন্টের ধরন</label>
                  <select
                    value={config.nagadAccountType}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        nagadAccountType: e.target.value as 'PERSONAL' | 'MERCHANT' | 'AGENT',
                      })
                    }
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-[#EA580C]"
                  >
                    <option value="PERSONAL">পার্সোনাল (Send Money)</option>
                    <option value="MERCHANT">মার্চেন্ট (Make Payment)</option>
                    <option value="AGENT">এজেন্ট (Cash Out)</option>
                  </select>
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
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-teal-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">অনুদান পেজের বিবরণ</label>
                <textarea
                  rows={2}
                  value={config.donationDescription || ''}
                  onChange={(e) => setConfig({ ...config, donationDescription: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-teal-700"
                />
              </div>
            </div>

            {/* Webhook Secret Key */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-teal-700" />
                  <label className="text-xs sm:text-sm font-black text-slate-900">
                    অ্যান্ড্রয়েড SMS অ্যাপ ওয়েবহুক সিক্রেট কী (Webhook Secret Key)
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateSecret}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-teal-800 cursor-pointer"
                >
                  নতুন সিক্রেট তৈরি করুন
                </button>
              </div>
              <input
                type="text"
                value={config.smsWebhookSecret || ''}
                onChange={(e) => setConfig({ ...config, smsWebhookSecret: e.target.value })}
                placeholder="ঐচ্ছিক সিক্রেট টোকেন (যেমন: DPIB_SMS_SECRET_2026)"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 outline-none focus:border-teal-700"
              />
              <p className="text-[11px] text-slate-500">
                নিরাপত্তার জন্য আপনার অ্যান্ড্রয়েড SMS রিডিং অ্যাপ থেকে HTTP POST পাঠানোর সময় এই সিক্রেট কী-টি{' '}
                <code className="font-mono text-slate-800">secret</code> ফিল্ডে পাঠাতে পারবেন।
              </p>
            </div>
          </form>

          {/* Android SMS Reading App Integration Guide */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-5 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black">
                  অ্যান্ড্রয়েড SMS রিডিং অ্যাপ সংযোগ গাইড (Auto-Verification API)
                </h3>
                <p className="text-xs text-slate-400">
                  আপনার তৈরি করা বা যেকোনো অ্যান্ড্রয়েড SMS ফরোয়ার্ডার অ্যাপ নিচের API এন্ডপয়েন্টে বিকাশ/নগদ SMS পাঠালেই স্বয়ংক্রিয়ভাবে ভেরিফাই হয়ে যাবে।
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 font-outfit block">
                WEBHOOK ENDPOINT URL (HTTP POST)
              </span>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <code className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs sm:text-sm text-emerald-300 break-all">
                  {webhookUrl}
                </code>
                <button
                  type="button"
                  onClick={handleCopyWebhookUrl}
                  className="px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  {copiedWebhook ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedWebhook ? 'কপি হয়েছে' : 'URL কপি করুন'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-400 font-outfit block">
                  JSON PAYLOAD FORMAT (APPLICATION/JSON)
                </span>
                <pre className="text-[11px] sm:text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
{`{
  "sender": "bKash",
  "message": "%SMS_BODY%",
  "secret": "${config.smsWebhookSecret || 'YOUR_SECRET'}"
}`}
                </pre>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs text-slate-300">
                <span className="text-[11px] font-bold uppercase text-slate-400 font-outfit block">
                  স্বয়ংক্রিয় ম্যাচিং যেভাবে কাজ করে:
                </span>
                <ul className="space-y-1.5 text-[11px] leading-relaxed">
                  <li>১. সার্ভার SMS থেকে স্বয়ংক্রিয়ভাবে <strong>bKash / Nagad</strong>, <strong>টাকার পরিমাণ</strong>, <strong>TrxID / TxnId</strong>, <strong>প্রেরকের নম্বর</strong> এবং <strong>Reference</strong> আলাদা করে।</li>
                  <li>২. ডাটাবেসে থাকা অপেক্ষমাণ (PENDING) অনুদানের <strong>TrxID</strong> বা <strong>Reference</strong>-এর সাথে মিললে তাৎক্ষণিক <strong>VERIFIED</strong> করে দেয়।</li>
                  <li>৩. ব্যবহারকারী পেমেন্ট করার আগেই যদি SMS চলে আসে, তবে ফর্ম সাবমিটের সাথে সাথেই অটো-ভেরিফাই হয়ে যাবে!</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: LIVE SMS SIMULATOR & INCOMING LOGS ================= */}
      {activeTab === 'SIMULATOR' && (
        <div className="space-y-6">
          {/* Interactive Webhook Tester */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  অটোমেটিক SMS ভেরিফিকেশন লাইভ টেস্টার
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  অ্যান্ড্রয়েড অ্যাপ সংযুক্ত করার আগেই আসল বিকাশ/নগদ SMS টেক্সট দিয়ে অটো-ম্যাচিং পরীক্ষা করুন।
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSimSender('bKash');
                    setSimMessage(
                      'You have received Tk 100.00 from 01712345678. Ref DPIB-4829. Fee Tk 0.00. Balance Tk 1500.00. TrxID BKH9A21M4P at 05/11/2026 14:30'
                    );
                  }}
                  className="px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-[#E2136E] text-xs font-bold cursor-pointer"
                >
                  স্যাম্পল বিকাশ SMS
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimSender('NAGAD');
                    setSimMessage(
                      'Money Received. Amount: Tk 50.00 Sender: 01812345678 Ref: DPIB-9012 TxnId: 72A8B9C1 Balance: Tk 2200.00'
                    );
                  }}
                  className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#EA580C] text-xs font-bold cursor-pointer"
                >
                  স্যাম্পল নগদ SMS
                </button>
              </div>
            </div>

            {/* Quick 1-Click Fill from Latest Pending Donation */}
            {pendingDonations.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-amber-950">
                  <strong>টিপস:</strong> বর্তমানে <strong>{toBanglaDigits(pendingDonations.length)}টি</strong> অপেক্ষমাণ অনুদান রয়েছে (সর্বশেষ:{' '}
                  <code className="font-mono font-bold">{pendingDonations[0].transactionId}</code> • ৳
                  {toBanglaDigits(pendingDonations[0].amount)})।
                </div>
                <button
                  type="button"
                  onClick={() => handleFillSampleFromPending(pendingDonations[0])}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer shrink-0"
                >
                  এই পেন্ডিং অনুদানের SMS তৈরি করুন
                </button>
              </div>
            )}

            <form onSubmit={handleRunSmsSimulation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">SMS প্রেরক (Sender)</label>
                  <select
                    value={simSender}
                    onChange={(e) => setSimSender(e.target.value as 'bKash' | 'NAGAD')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none"
                  >
                    <option value="bKash">bKash</option>
                    <option value="NAGAD">NAGAD</option>
                  </select>
                </div>

                <div className="sm:col-span-3 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">ইনকামিং SMS টেক্সট</label>
                  <input
                    type="text"
                    value={simMessage}
                    onChange={(e) => setSimMessage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 outline-none focus:bg-white focus:border-teal-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={simRunning}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>{simRunning ? 'ওয়েবহুক প্রসেস হচ্ছে...' : 'ওয়েবহুক টেস্ট রান করুন'}</span>
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
                <div className="font-black text-sm">
                  {simResult.matched
                    ? `অটো-ভেরিফিকেশন সফল! ম্যাচকৃত রেফারেন্স: ${simResult.matchedReferenceCode}`
                    : 'SMS লগ সংরক্ষিত হয়েছে (বর্তমানে কোনো পেন্ডিং অনুদানের সাথে TrxID মেলেনি)'}
                </div>
                {simResult.parsed && (
                  <div className="font-mono text-[11px] flex flex-wrap gap-x-4 gap-y-1">
                    <span>Provider: {simResult.parsed.provider}</span>
                    <span>Amount: {simResult.parsed.parsedAmount ?? 'N/A'}</span>
                    <span>TrxID: {simResult.parsed.parsedTrxId ?? 'N/A'}</span>
                    <span>Sender: {simResult.parsed.parsedSenderPhone ?? 'N/A'}</span>
                    <span>Ref: {simResult.parsed.parsedReference ?? 'N/A'}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Incoming SMS Logs Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-200/80">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                প্রাপ্ত ইনকামিং SMS লগ (Webhook History)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                অ্যান্ড্রয়েড অ্যাপ থেকে আসা প্রতিটি SMS এখানে পার্সিং তথ্যের সাথে সংরক্ষিত থাকে।
              </p>
            </div>

            {smsLogs.length === 0 ? (
              <div className="p-8 text-center text-xs sm:text-sm text-slate-500">
                এখনো কোনো ইনকামিং SMS ওয়েবহুক রিসিভ হয়নি।
              </div>
            ) : (
              <div className="divide-y divide-slate-200/70">
                {smsLogs.map((log) => (
                  <div key={log.id} className="p-4 sm:p-5 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 font-mono font-bold">
                        <PaymentMethodLogo
                          provider={log.provider === 'NAGAD' ? 'NAGAD' : 'BKASH'}
                          size="xs"
                        />
                        <span
                          className={`font-bengali ${
                            log.provider === 'BKASH' ? 'text-[#E2136E]' : 'text-[#EA580C]'
                          }`}
                        >
                          {log.provider === 'BKASH' ? 'বিকাশ' : 'নগদ'} ({log.senderAddress})
                        </span>
                        {log.parsedTrxId && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="text-slate-900">আইডি: {log.parsedTrxId}</span>
                          </>
                        )}
                        {log.parsedAmount && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="text-slate-900">
                              ৳{toBanglaDigits(log.parsedAmount)}
                            </span>
                          </>
                        )}
                      </div>

                      <span
                        className={`font-bengali text-xs font-black ${
                          log.matchStatus === 'MATCHED' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {log.matchStatus === 'MATCHED'
                          ? `ম্যাচ সম্পন্ন (${log.matchedReferenceCode || ''})`
                          : 'অপেক্ষমাণ লগ'}
                      </span>
                    </div>

                    <p className="text-xs font-mono text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 break-words">
                      {log.rawMessage}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
