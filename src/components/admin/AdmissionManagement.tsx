import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  ShieldCheck,
  RefreshCw,
  Layers,
  Phone,
  Mail,
  GraduationCap,
  Sparkles,
  ChevronDown,
  UserCheck,
  Building,
  ShieldAlert,
} from 'lucide-react';
import {
  AdmissionApplication,
  AdmissionApplicationStatus,
  AdmissionSettings,
  AdmissionSecurityLog,
} from '../../types';
import {
  subscribeAllAdmissionApplications,
  updateAdmissionApplicationStatus,
  getStatusBanglaLabel,
  getStatusBadgeClasses,
  subscribeAdmissionSettings,
  updateAdmissionSettings,
  DEFAULT_ADMISSION_SETTINGS,
  parsePhoneNumbers,
  clearApplicationSecurityFlag,
  getAdmissionSecurityLogs,
} from '../../services/admissionService';
import { DEFAULT_DEPARTMENTS } from '../../services/db';
import { toBanglaDigits, formatBanglaDate, toEnglishDigits } from '../../utils/bangla';
import { BottomSheet } from '../common/BottomSheet';
import { SelectBottomSheet, SelectOption, SelectTrigger } from '../common/SelectBottomSheet';
import { ApplicationDetailsSheet } from '../admission/ApplicationDetailsSheet';
import { AdmissionDeadlineSheet } from './AdmissionDeadlineSheet';
import { LoadingOverlay } from '../common/LoadingOverlay';
import { getAdmissionDeadlineStatus } from '../../services/admissionService';

export const AdmissionManagement: React.FC = () => {
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  // Sheet modals for filters
  const [statusFilterSheetOpen, setStatusFilterSheetOpen] = useState<boolean>(false);
  const [deptFilterSheetOpen, setDeptFilterSheetOpen] = useState<boolean>(false);

  // Selected app for details
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null);

  // Status Change Modal State
  const [statusModalApp, setStatusModalApp] = useState<AdmissionApplication | null>(null);
  const [newStatus, setNewStatus] = useState<AdmissionApplicationStatus>('UNDER_REVIEW');
  const [assignedShift, setAssignedShift] = useState<'1st' | '2nd' | ''>('');
  const [assignedDeptId, setAssignedDeptId] = useState<string>('');
  const [adminInstructions, setAdminInstructions] = useState<string>('');
  const [adminFeedback, setAdminFeedback] = useState<string>('');
  const [assignedRoll, setAssignedRoll] = useState<string>('');
  const [assignedSession, setAssignedSession] = useState<string>('২০২৬-২৭');
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  // Sheets for Status Modal dropdowns
  const [newStatusSheetOpen, setNewStatusSheetOpen] = useState<boolean>(false);
  const [assignedShiftSheetOpen, setAssignedShiftSheetOpen] = useState<boolean>(false);
  const [assignedDeptSheetOpen, setAssignedDeptSheetOpen] = useState<boolean>(false);

  // Admission Contact Settings State
  const [contactSettings, setContactSettings] = useState<AdmissionSettings>(DEFAULT_ADMISSION_SETTINGS);
  const [contactSheetOpen, setContactSheetOpen] = useState<boolean>(false);
  const [deadlineSheetOpen, setDeadlineSheetOpen] = useState<boolean>(false);
  const [editPhone, setEditPhone] = useState<string>(DEFAULT_ADMISSION_SETTINGS.contactPhone);
  const [editHelplineTitle, setEditHelplineTitle] = useState<string>(DEFAULT_ADMISSION_SETTINGS.helplineTitle || 'ভর্তি সংক্রান্ত যোগাযোগ');
  const [editHelplineHours, setEditHelplineHours] = useState<string>(DEFAULT_ADMISSION_SETTINGS.helplineHours || 'সকাল ০৯:০০ টা হতে বিকাল ০৫:০০ টা');
  const [savingContact, setSavingContact] = useState<boolean>(false);
  const [contactSavedSuccess, setContactSavedSuccess] = useState<boolean>(false);
  const [contactSaveError, setContactSaveError] = useState<string | null>(null);

  // Security Audit Logs & Clearance State
  const [securityLogsSheetOpen, setSecurityLogsSheetOpen] = useState<boolean>(false);
  const [securityLogs, setSecurityLogs] = useState<AdmissionSecurityLog[]>([]);
  const [loadingSecurityLogs, setLoadingSecurityLogs] = useState<boolean>(false);
  const [clearingSecurityAppId, setClearingSecurityAppId] = useState<string | null>(null);
  const [securityClearSuccessMessage, setSecurityClearSuccessMessage] = useState<string | null>(null);

  const handleOpenSecurityLogs = async () => {
    setSecurityLogsSheetOpen(true);
    setLoadingSecurityLogs(true);
    try {
      const logs = await getAdmissionSecurityLogs();
      setSecurityLogs(logs);
    } catch (err) {
      console.error('Error loading security logs:', err);
    } finally {
      setLoadingSecurityLogs(false);
    }
  };

  const handleClearSecurity = async (app: AdmissionApplication) => {
    try {
      setClearingSecurityAppId(app.id);
      await clearApplicationSecurityFlag(
        app.id,
        'অ্যাডমিন (ভর্তি সেল)',
        'কর্তৃপক্ষ কর্তৃক রোল, রেজিস্ট্রেশন ও শিক্ষাগত সনদ যাচাই সম্পন্ন হয়েছে।'
      );
      setSecurityClearSuccessMessage(`আবেদন #${app.applicationNumber}-এর নিরাপত্তা ক্লিয়ারেন্স সফল হয়েছে।`);
      setTimeout(() => setSecurityClearSuccessMessage(null), 3500);
    } catch (err: any) {
      alert(err?.message || 'ক্লিয়ারেন্স সম্পন্ন করতে সমস্যা হয়েছে।');
    } finally {
      setClearingSecurityAppId(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    const unsubscribeApps = subscribeAllAdmissionApplications(
      (list) => {
        setApplications(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching admission applications in admin:', err);
        setLoading(false);
      }
    );

    const unsubscribeSettings = subscribeAdmissionSettings((settings) => {
      setContactSettings(settings);
      setEditPhone(settings.contactPhone || DEFAULT_ADMISSION_SETTINGS.contactPhone);
      setEditHelplineTitle(settings.helplineTitle || DEFAULT_ADMISSION_SETTINGS.helplineTitle || 'ভর্তি সংক্রান্ত যোগাযোগ');
      setEditHelplineHours(settings.helplineHours || DEFAULT_ADMISSION_SETTINGS.helplineHours || 'সকাল ০৯:০০ টা হতে বিকাল ০৫:০০ টা');
    });

    return () => {
      unsubscribeApps();
      unsubscribeSettings();
    };
  }, []);

  const handleSaveContactSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingContact(true);
      setContactSavedSuccess(false);
      setContactSaveError(null);
      await updateAdmissionSettings({
        contactPhone: editPhone.trim(),
        helplineTitle: editHelplineTitle.trim(),
        helplineHours: editHelplineHours.trim(),
      });
      setContactSavedSuccess(true);
      setTimeout(() => {
        setContactSavedSuccess(false);
        setContactSheetOpen(false);
      }, 1200);
    } catch (err: any) {
      console.error('Failed to update admission contact settings:', err);
      setContactSaveError(err?.message || 'যোগাযোগের তথ্য আপডেট করা সম্ভব হয়নি। আবার চেষ্টা করুন।');
    } finally {
      setSavingContact(false);
    }
  };

  const openStatusModal = (app: AdmissionApplication) => {
    setStatusModalApp(app);
    setNewStatus(app.status);
    setAssignedShift(app.assignedShift || '1st');
    setAssignedDeptId(app.assignedDeptId || app.technologyChoice.firstChoiceDeptId);
    setAdminInstructions(app.adminInstructions || '');
    setAdminFeedback(app.adminFeedback || '');
    setAssignedRoll(app.assignedRoll || '');
    setAssignedSession(app.assignedSession || '২০২৬-২৭');
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalApp) return;

    try {
      setUpdatingStatus(true);
      const assignedDept = DEFAULT_DEPARTMENTS.find((d) => d.id === assignedDeptId);
      await updateAdmissionApplicationStatus(statusModalApp.id, newStatus, {
        assignedShift: assignedShift || undefined,
        assignedDeptId: assignedDeptId || undefined,
        assignedDeptName: assignedDept?.name || undefined,
        adminInstructions: adminInstructions.trim(),
        adminFeedback: adminFeedback.trim(),
        assignedRoll: assignedRoll.trim() ? toEnglishDigits(assignedRoll) : undefined,
        assignedSession: assignedSession.trim() || undefined,
        note: `কর্তৃপক্ষ কর্তৃক আবেদনের অবস্থা "${getStatusBanglaLabel(newStatus)}" ও শিফট "${assignedShift === '1st' ? '১ম শিফট' : '২য় শিফট'}" নির্ধারণ করা হয়েছে।`,
      });
      setStatusModalApp(null);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const statusFilterOptions: SelectOption[] = [
    { value: 'ALL', label: 'সকল আবেদনের অবস্থা' },
    { value: 'FLAGGED', label: 'নিরাপত্তা রিভিউ / ফ্ল্যাগড', badge: 'সুরক্ষা' },
    { value: 'SUBMITTED', label: 'আবেদন দাখিলকৃত', badge: 'নতুন' },
    { value: 'UNDER_REVIEW', label: 'কাগজপত্র যাচাইাধীন' },
    { value: 'APPROVED', label: 'অনুমোদিত আবেদন' },
    { value: 'ENROLLED', label: 'ভর্তি সম্পন্ন' },
    { value: 'REJECTED', label: 'বাতিলকৃত আবেদন' },
  ];

  const deptFilterOptions: SelectOption[] = [
    { value: 'ALL', label: 'সকল টেকনোলজি বিভাগ' },
    ...DEFAULT_DEPARTMENTS.map((d) => ({
      value: d.id,
      label: d.name,
      sublabel: `কোড: ${d.code}`,
    })),
  ];

  const statusOptions: SelectOption[] = [
    { value: 'SUBMITTED', label: 'আবেদন দাখিলকৃত', sublabel: 'প্রাথমিক আবেদন জমা' },
    { value: 'UNDER_REVIEW', label: 'যাচাইাধীন', sublabel: 'প্রয়োজনীয় কাগজপত্র ও তথ্য পর্যালোচনা চলছে' },
    { value: 'APPROVED', label: 'অনুমোদিত', sublabel: 'আবেদন গৃহীত ও ভর্তির জন্য নির্বাচিত' },
    { value: 'ENROLLED', label: 'ভর্তি সম্পন্ন', sublabel: 'ইনস্টিটিউটে শিক্ষার্থী হিসেবে চূড়ান্ত অন্তর্ভুক্তি' },
    { value: 'REJECTED', label: 'বাতিলকৃত', sublabel: 'যোগ্যতা বা কাগজপত্রের ঘাটতির কারণে বাতিল' },
  ];

  const shiftOptions: SelectOption[] = [
    { value: '1st', label: '১ম শিফট (সকাল ০৮:০০ - ০১:১৫)', sublabel: 'সকালের ব্যাচ' },
    { value: '2nd', label: '২য় শিফট (দুপুর ০১:৩০ - ০৬:০০)', sublabel: 'দুপুরের ব্যাচ' },
  ];

  const deptAssignmentOptions: SelectOption[] = DEFAULT_DEPARTMENTS.map((d) => ({
    value: d.id,
    label: d.name,
    sublabel: `কোড: ${d.code}`,
  }));

  const filteredApplications = applications.filter((app) => {
    // Search match
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName =
        app.personalInfo.fullNameBangla?.toLowerCase().includes(q) ||
        app.personalInfo.fullNameEnglish?.toLowerCase().includes(q);
      const matchAppNo = app.applicationNumber?.toLowerCase().includes(q);
      const matchPhone = app.applicantPhone?.includes(q);
      const matchRoll = app.educationalInfo?.rollNumber?.includes(q);
      if (!matchName && !matchAppNo && !matchPhone && !matchRoll) {
        return false;
      }
    }

    // Status filter
    if (statusFilter === 'FLAGGED') {
      const isFlagged = (app.securityAudit?.riskScore || 0) >= 40 || app.status === 'UNDER_REVIEW';
      if (!isFlagged) return false;
    } else if (statusFilter !== 'ALL' && app.status !== statusFilter) {
      return false;
    }

    // Dept filter
    if (deptFilter !== 'ALL' && app.technologyChoice.firstChoiceDeptId !== deptFilter) {
      return false;
    }

    return true;
  });

  const stats = {
    total: applications.length,
    submitted: applications.filter((a) => a.status === 'SUBMITTED').length,
    underReview: applications.filter((a) => a.status === 'UNDER_REVIEW').length,
    approved: applications.filter((a) => a.status === 'APPROVED').length,
    enrolled: applications.filter((a) => a.status === 'ENROLLED').length,
    rejected: applications.filter((a) => a.status === 'REJECTED').length,
    flaggedSecurity: applications.filter((a) => (a.securityAudit?.riskScore || 0) >= 40).length,
  };

  const selectedStatusLabel =
    statusFilterOptions.find((o) => o.value === statusFilter)?.label || 'সকল অবস্থা';
  const selectedDeptLabel =
    deptFilterOptions.find((o) => o.value === deptFilter)?.label || 'সকল টেকনোলজি';

  return (
    <div className="space-y-6 font-bengali">
      {/* Top Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white p-0.5 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-xs">
            <img
              src="https://i.postimg.cc/j5K3pb0M/sovapoti-images1.png"
              alt="ভর্তি পোর্টাল লোগো"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                ভর্তি আবেদন ব্যবস্থাপনা
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                অ্যাডমিন পোর্টাল
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              অনলাইনে প্রাপ্ত সকল ভর্তি আবেদন যাচাই, অনুমোদন, নির্দেশনা প্রদান ও ভর্তি নিশ্চিতকরণ
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            id="btn-admin-admission-security-logs"
            onClick={handleOpenSecurityLogs}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 border ${
              stats.flaggedSecurity > 0
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 animate-pulse'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${stats.flaggedSecurity > 0 ? 'text-white' : 'text-amber-600'}`} />
            <span>সিকিউরিটি ও ফ্রড লগ</span>
            {stats.flaggedSecurity > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-amber-900 text-[10px] font-black">
                {toBanglaDigits(stats.flaggedSecurity)}
              </span>
            )}
          </button>
          <button
            type="button"
            id="btn-admin-admission-deadline-settings"
            onClick={() => setDeadlineSheetOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Calendar className="w-3.5 h-3.5 text-teal-400" />
            <span>ভর্তি সময়সীমা ও শিডিউল</span>
          </button>
          <button
            type="button"
            id="btn-admin-admission-contact-settings"
            onClick={() => setContactSheetOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>যোগাযোগের নম্বর সেটিংস</span>
          </button>
        </div>
      </div>

      {/* Top Banners: Helpline + Live Deadline Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* 1. Helpline Info Banner */}
        <div className="bg-gradient-to-r from-teal-50/80 via-emerald-50/50 to-sky-50/80 rounded-2xl border border-teal-200/80 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900">
                  {contactSettings.helplineTitle || 'ভর্তি সংক্রান্ত যোগাযোগ'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-teal-100/80 text-teal-800 text-[10px] font-bold">
                  লাইভ হেল্পলাইন
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-600 mt-0.5">
                <span>নম্বর: <strong className="font-outfit text-slate-900">{contactSettings.contactPhone}</strong></span>
                <span className="text-slate-300">•</span>
                <span>সময়সূচি: <span className="font-medium text-slate-700">{contactSettings.helplineHours}</span></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-auto">
            {parsePhoneNumbers(contactSettings.contactPhone).map((phone, idx) => (
              <a
                key={idx}
                href={`tel:${toEnglishDigits(phone).replace(/[^0-9+]/g, '')}`}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-teal-200 text-teal-700 text-xs font-bold transition-all flex items-center gap-1.5"
                title={`${phone} এ সরাসরি কল টেস্ট`}
              >
                <Phone className="w-3 h-3" />
                <span>কল টেস্ট {parsePhoneNumbers(contactSettings.contactPhone).length > 1 ? `(${toBanglaDigits(idx + 1)})` : ''}</span>
              </a>
            ))}
            <button
              type="button"
              onClick={() => setContactSheetOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Edit className="w-3 h-3" />
              <span>নম্বর পরিবর্তন</span>
            </button>
          </div>
        </div>

        {/* 2. Live Deadline Banner */}
        {(() => {
          const deadlineStatus = getAdmissionDeadlineStatus(contactSettings);
          const isActive = deadlineStatus.status === 'ACTIVE';
          const isNotStarted = deadlineStatus.status === 'NOT_STARTED';

          return (
            <div
              className={`rounded-2xl border p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border-emerald-200/80'
                  : isNotStarted
                  ? 'bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border-sky-200/80'
                  : 'bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border-rose-200/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 shadow-2xs ${
                    isActive ? 'bg-emerald-600' : isNotStarted ? 'bg-sky-600' : 'bg-rose-600'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">
                      ভর্তি আবেদন সময়সীমা
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isActive
                          ? 'bg-emerald-200 text-emerald-900'
                          : isNotStarted
                          ? 'bg-sky-200 text-sky-900'
                          : 'bg-rose-200 text-rose-900'
                      }`}
                    >
                      {isActive
                        ? 'ভর্তি চলছে'
                        : isNotStarted
                        ? 'শীঘ্রই শুরু'
                        : 'সময়সীমা শেষ'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {isActive ? (
                      <span>
                        বাকি: <strong className="text-emerald-800 font-bold">{toBanglaDigits(deadlineStatus.days)} দিন {toBanglaDigits(deadlineStatus.hours)} ঘণ্টা</strong> (শেষ: {deadlineStatus.formattedEndDate})
                      </span>
                    ) : isNotStarted ? (
                      <span>
                        শুরু: <strong className="text-sky-800 font-bold">{deadlineStatus.formattedStartDate}</strong>
                      </span>
                    ) : (
                      <span className="text-rose-700 font-medium">
                        ভর্তি আবেদন গ্রহণ বন্ধ রয়েছে। নতুন আবেদন জমা হবে না।
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setDeadlineSheetOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit className="w-3 h-3 text-teal-400" />
                  <span>সময়সীমা পরিবর্তন</span>
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Security Clearance Feedback Banner */}
      {securityClearSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between text-xs font-bold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{securityClearSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSecurityClearSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {[
          { label: 'মোট আবেদন', count: stats.total, color: 'text-slate-800', bg: 'bg-white', filterVal: 'ALL' },
          { label: 'দাখিলকৃত', count: stats.submitted, color: 'text-blue-600', bg: 'bg-blue-50/60', filterVal: 'SUBMITTED' },
          { label: 'যাচাইাধীন', count: stats.underReview, color: 'text-amber-700', bg: 'bg-amber-50/60', filterVal: 'UNDER_REVIEW' },
          { label: 'অনুমোদিত', count: stats.approved, color: 'text-emerald-700', bg: 'bg-emerald-50/60', filterVal: 'APPROVED' },
          { label: 'ভর্তি সম্পন্ন', count: stats.enrolled, color: 'text-indigo-700', bg: 'bg-indigo-50/60', filterVal: 'ENROLLED' },
          { label: 'বাতিলকৃত', count: stats.rejected, color: 'text-rose-700', bg: 'bg-rose-50/60', filterVal: 'REJECTED' },
          {
            label: 'নিরাপত্তা ফ্ল্যাগড',
            count: stats.flaggedSecurity,
            color: stats.flaggedSecurity > 0 ? 'text-amber-900' : 'text-slate-400',
            bg: stats.flaggedSecurity > 0 ? 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-300' : 'bg-slate-50/60',
            filterVal: 'FLAGGED',
          },
        ].map((item) => (
          <button
            type="button"
            key={item.label}
            onClick={() => setStatusFilter(item.filterVal)}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer hover:shadow-sm ${
              statusFilter === item.filterVal ? 'ring-2 ring-teal-700 border-teal-700' : 'border-slate-200/80'
            } ${item.bg}`}
          >
            <p className="text-[11px] font-bold text-slate-500 leading-tight truncate">{item.label}</p>
            <p className={`text-xl sm:text-2xl font-black font-outfit mt-1 ${item.color}`}>
              {toBanglaDigits(item.count)}
            </p>
          </button>
        ))}
      </div>

      {/* Search & Modern Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="নাম, আবেদন নম্বর, মোবাইল নম্বর বা এসএসসি রোল লিখে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-teal-700 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Status Filter Button */}
          <button
            type="button"
            onClick={() => setStatusFilterSheetOpen(true)}
            className="flex-1 sm:flex-none px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between gap-2 transition-colors cursor-pointer"
          >
            <span className="truncate max-w-[130px]">{selectedStatusLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {/* Dept Filter Button */}
          <button
            type="button"
            onClick={() => setDeptFilterSheetOpen(true)}
            className="flex-1 sm:flex-none px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between gap-2 transition-colors cursor-pointer"
          >
            <span className="truncate max-w-[140px]">{selectedDeptLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>
        </div>
      </div>

      {/* Applications Table / Card Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-700" />
            <p className="text-xs font-bold">ভর্তি আবেদন ডেটা লোড হচ্ছে...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600">কোনো ভর্তি আবেদন পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400">সার্চ বা ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">আবেদন নম্বর ও তারিখ</th>
                  <th className="py-3.5 px-4">আবেদনকারীর নাম ও যোগাযোগ</th>
                  <th className="py-3.5 px-4">পছন্দের টেকনোলজি ও শিফট</th>
                  <th className="py-3.5 px-4">এসএসসি রোল ও জিপিএ</th>
                  <th className="py-3.5 px-4 text-center">বর্তমান অবস্থা</th>
                  <th className="py-3.5 px-4 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bengali">
                {filteredApplications.map((app) => {
                  const badge = getStatusBadgeClasses(app.status);
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Application ID */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-md text-xs border border-slate-200">
                          {app.applicationNumber}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-1">
                          {formatBanglaDate(app.submittedAt)}
                        </span>
                      </td>

                      {/* Name & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {app.personalInfo.fullNameBangla}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                          <span>{toBanglaDigits(app.applicantPhone)}</span>
                          <span>•</span>
                          <span className="truncate max-w-[150px]">{app.applicantEmail}</span>
                        </div>
                      </td>

                      {/* Tech Choice */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">
                          {app.technologyChoice.firstChoiceDeptName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          শিফট:{' '}
                          {app.technologyChoice.preferredShift === '1st'
                            ? '১ম শিফট'
                            : app.technologyChoice.preferredShift === '2nd'
                            ? '২য় শিফট'
                            : 'কর্তৃপক্ষ নির্ধারিত'}
                        </div>
                      </td>

                      {/* SSC Result */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-800">
                          রোল: {toBanglaDigits(app.educationalInfo.rollNumber)}
                        </div>
                        <div className="text-emerald-700 font-black font-outfit text-xs">
                          জিপিএ {toBanglaDigits(app.educationalInfo.gpa.toFixed(2))} ({app.educationalInfo.board})
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            <span>{getStatusBanglaLabel(app.status)}</span>
                          </span>
                          {app.securityAudit && app.securityAudit.riskScore >= 40 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <ShieldAlert className="w-3 h-3 text-amber-700" />
                              <span>সিকিউরিটি রিভিউ ({toBanglaDigits(app.securityAudit.riskScore)})</span>
                            </span>
                          )}
                          {app.securityAudit && app.securityAudit.riskScore === 0 && app.securityAudit.actionTaken === 'PASSED' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-teal-700">
                              <ShieldCheck className="w-3 h-3 text-teal-600" />
                              <span>ভেরিফাইড</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {app.securityAudit && app.securityAudit.riskScore >= 40 && (
                            <button
                              type="button"
                              onClick={() => handleClearSecurity(app)}
                              disabled={clearingSecurityAppId === app.id}
                              title="সিকিউরিটি ক্লিয়ারেন্স দিন"
                              className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors cursor-pointer flex items-center gap-1 font-bold text-[10px] px-2 border border-amber-300 disabled:opacity-50"
                            >
                              <ShieldCheck className="w-3 h-3 text-amber-800" />
                              <span>{clearingSecurityAppId === app.id ? 'ক্লিয়ারিং...' : 'ক্লিয়ারেন্স'}</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedApp(app)}
                            title="পূর্ণাঙ্গ তথ্য ও বিবরণ দেখুন"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openStatusModal(app)}
                            title="অবস্থা পরিবর্তন ও নির্দেশনা দিন"
                            className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 transition-colors cursor-pointer flex items-center gap-1 font-bold text-[11px] px-2.5"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>আপডেট</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= STATUS UPDATE BOTTOM SHEET MODAL ================= */}
      <BottomSheet
        isOpen={Boolean(statusModalApp)}
        onClose={() => setStatusModalApp(null)}
        title="আবেদনের অবস্থা হালনাগাদ ও নির্দেশনা"
        subtitle={`আবেদন নম্বর: ${statusModalApp?.applicationNumber}`}
      >
        {statusModalApp && (
          <form onSubmit={handleStatusSubmit} className="space-y-4 pb-6 font-bengali">
            {/* Applicant Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block font-medium">আবেদনকারীর নাম</span>
                <span className="font-bold text-slate-800 text-sm">
                  {statusModalApp.personalInfo.fullNameBangla}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">নির্বাচিত টেকনোলজি</span>
                <span className="font-bold text-slate-800">
                  {statusModalApp.technologyChoice.firstChoiceDeptName}
                </span>
              </div>
            </div>

            {/* Status Trigger & Selector */}
            <div>
              <SelectTrigger
                label="আবেদনের নতুন অবস্থা"
                value={statusOptions.find((o) => o.value === newStatus)?.label || 'অবস্থা নির্বাচন করুন'}
                onClick={() => setNewStatusSheetOpen(true)}
                required
              />
            </div>

            {/* Authority Shift & Dept Assignment */}
            {(newStatus === 'APPROVED' || newStatus === 'ENROLLED' || newStatus === 'UNDER_REVIEW') && (
              <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-3">
                <div className="text-xs font-black text-teal-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>কর্তৃপক্ষ কর্তৃক শিফট ও টেকনোলজি বণ্টন</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <SelectTrigger
                      label="বরাদ্দকৃত শিফট"
                      value={
                        assignedShift === '1st'
                          ? '১ম শিফট (সকাল ০৮:০০ - ০১:১৫)'
                          : assignedShift === '2nd'
                          ? '২য় শিফট (দুপুর ০১:৩০ - ০৬:০০)'
                          : '১ম শিফট'
                      }
                      onClick={() => setAssignedShiftSheetOpen(true)}
                    />
                  </div>

                  <div>
                    <SelectTrigger
                      label="বরাদ্দকৃত টেকনোলজি"
                      value={
                        deptAssignmentOptions.find((d) => d.value === assignedDeptId)?.label ||
                        'টেকনোলজি নির্বাচন করুন'
                      }
                      onClick={() => setAssignedDeptSheetOpen(true)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Enrolled Specific fields */}
            {newStatus === 'ENROLLED' && (
              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-indigo-900 mb-1">
                    নির্ধারিত শ্রেণি রোল
                  </label>
                  <input
                    type="text"
                    value={assignedRoll}
                    onChange={(e) => setAssignedRoll(e.target.value)}
                    placeholder="আপনার রোল নম্বর লিখুন"
                    className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-900 mb-1">
                    শিক্ষাবর্ষ / সেশন
                  </label>
                  <input
                    type="text"
                    value={assignedSession}
                    onChange={(e) => setAssignedSession(e.target.value)}
                    placeholder="শিক্ষাবর্ষ বা সেশন লিখুন"
                    className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              </div>
            )}

            {/* Authority Instructions (shown in applicant profile) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                কর্তৃপক্ষের নির্দেশনা ও বিজ্ঞপ্তি (আবেদনকারীর প্রোফাইলে দৃশ্যমান হবে)
              </label>
              <textarea
                rows={3}
                value={adminInstructions}
                onChange={(e) => setAdminInstructions(e.target.value)}
                placeholder="আবেদনকারী শিক্ষার্থীর জন্য প্রয়োজনীয় নির্দেশনা লিখুন..."
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-700 outline-none resize-none"
              />
            </div>

            {/* Admin Feedback (Internal Review) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                অফিসিয়াল মন্তব্য বা পর্যালোচনার নোট (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={adminFeedback}
                onChange={(e) => setAdminFeedback(e.target.value)}
                placeholder="পর্যালোচনা সংক্রান্ত কোনো নোট থাকলে লিখুন"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-700 outline-none"
              />
            </div>

            <div className="pt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStatusModalApp(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={updatingStatus}
                className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                সংরক্ষণ ও হালনাগাদ করুন
              </button>
            </div>
          </form>
        )}
      </BottomSheet>

      {/* Select Bottom Sheets */}
      <SelectBottomSheet
        isOpen={statusFilterSheetOpen}
        onClose={() => setStatusFilterSheetOpen(false)}
        title="আবেদনের অবস্থা ফিল্টার করুন"
        options={statusFilterOptions}
        selectedValue={statusFilter}
        onSelect={(val) => setStatusFilter(val)}
      />

      <SelectBottomSheet
        isOpen={deptFilterSheetOpen}
        onClose={() => setDeptFilterSheetOpen(false)}
        title="টেকনোলজি বিভাগ ফিল্টার করুন"
        options={deptFilterOptions}
        selectedValue={deptFilter}
        onSelect={(val) => setDeptFilter(val)}
        searchable
      />

      <SelectBottomSheet
        isOpen={newStatusSheetOpen}
        onClose={() => setNewStatusSheetOpen(false)}
        title="আবেদনের অবস্থা নির্ধারণ করুন"
        options={statusOptions}
        selectedValue={newStatus}
        onSelect={(val) => setNewStatus(val as AdmissionApplicationStatus)}
      />

      <SelectBottomSheet
        isOpen={assignedShiftSheetOpen}
        onClose={() => setAssignedShiftSheetOpen(false)}
        title="শিফট বরাদ্দ করুন"
        options={shiftOptions}
        selectedValue={assignedShift}
        onSelect={(val) => setAssignedShift(val as any)}
      />

      <SelectBottomSheet
        isOpen={assignedDeptSheetOpen}
        onClose={() => setAssignedDeptSheetOpen(false)}
        title="টেকনোলজি বিভাগ বরাদ্দ করুন"
        options={deptAssignmentOptions}
        selectedValue={assignedDeptId}
        onSelect={(val) => setAssignedDeptId(val)}
        searchable
      />

      {/* Details Sheet */}
      <ApplicationDetailsSheet
        isOpen={Boolean(selectedApp)}
        onClose={() => setSelectedApp(null)}
        application={selectedApp}
      />

      {/* Admission Contact Number Settings BottomSheet */}
      <BottomSheet
        isOpen={contactSheetOpen}
        onClose={() => setContactSheetOpen(false)}
        title="ভর্তি হেল্পলাইন ও যোগাযোগের নম্বর সেটিংস"
      >
        <form onSubmit={handleSaveContactSettings} className="space-y-4 font-bengali">
          <div className="bg-teal-50/70 border border-teal-200/80 p-3 rounded-2xl flex items-start gap-2.5">
            <Phone className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div className="text-xs text-teal-900 leading-relaxed">
              <span className="font-bold">সরাসরি কল ও যোগাযোগ নম্বর:</span> এখানে যে মোবাইল নম্বর সেট করবেন, তা ব্যবহারকারী প্যানেলের ভর্তি আবেদন পেজের <strong className="font-bold">“ভর্তি সংক্রান্ত যোগাযোগ”</strong> সেকশনে স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে এবং শিক্ষার্থীরা এক ট্যাপে সরাসরি কল করতে পারবে।
            </div>
          </div>

          {/* Contact Phone Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>যোগাযোগের মোবাইল নম্বর (একাধিক নম্বর দেওয়া যাবে) *</span>
              <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">কমা (,) দিয়ে আলাদা করুন</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="হেল্পলাইন মোবাইল নম্বর দিন"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold font-outfit text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-700 outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              নোট: একাধিক নম্বর যুক্ত করতে কমা (,) অথবা স্লাশ (/) ব্যবহার করুন। প্রতিটি নম্বরের জন্য ইউজার প্যানেলে সরাসরি কল বাটন তৈরি হবে।
            </p>
          </div>

          {/* Helpline Title Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              সেকশন শিরোনাম (Section Title)
            </label>
            <input
              type="text"
              value={editHelplineTitle}
              onChange={(e) => setEditHelplineTitle(e.target.value)}
              placeholder="ভর্তি সংক্রান্ত যোগাযোগ"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-teal-700 outline-none"
            />
          </div>

          {/* Helpline Hours */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              হেল্পলাইন সময়সূচি (Helpline Hours)
            </label>
            <input
              type="text"
              value={editHelplineHours}
              onChange={(e) => setEditHelplineHours(e.target.value)}
              placeholder="হেল্পলাইনের সময়সূচি লিখুন"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-teal-700 outline-none"
            />
          </div>

          {/* Live Preview Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              ইউজার প্যানেল লাইভ প্রিভিউ ({parsePhoneNumbers(editPhone).length} টি নম্বর):
            </p>
            <div className="bg-white p-3.5 rounded-xl border border-teal-200/80 space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">{editHelplineTitle || 'ভর্তি সংক্রান্ত যোগাযোগ'}</h4>
                  <p className="text-[10px] text-slate-500">{editHelplineHours || 'সকাল ০৯:০০ টা হতে বিকাল ০৫:০০ টা'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                {parsePhoneNumbers(editPhone).length > 0 ? (
                  parsePhoneNumbers(editPhone).map((phone, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-900 border border-teal-200 text-xs font-bold font-outfit">
                      <Phone className="w-3 h-3 text-teal-700" />
                      <span>{phone}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">কোনো নম্বর লিখা হয়নি</span>
                )}
              </div>
            </div>
          </div>

          {contactSavedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>যোগাযোগের নম্বর সফলভাবে Firestore-এ সংরক্ষিত ও আপডেট হয়েছে!</span>
            </div>
          )}

          {contactSaveError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block">সংরক্ষণ ব্যর্থ হয়েছে:</strong>
                <span>{contactSaveError}</span>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setContactSheetOpen(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={savingContact || !editPhone.trim()}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {savingContact ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>সংরক্ষণ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>নম্বর সংরক্ষণ করুন</span>
                </>
              )}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Admission Deadline & Schedule Bottom Sheet */}
      <AdmissionDeadlineSheet
        isOpen={deadlineSheetOpen}
        onClose={() => setDeadlineSheetOpen(false)}
        currentSettings={contactSettings}
        onSettingsUpdated={(updated) => {
          setContactSettings(updated);
        }}
      />

      {/* Security & Anti-Fraud Audit Logs Bottom Sheet */}
      <BottomSheet
        isOpen={securityLogsSheetOpen}
        onClose={() => setSecurityLogsSheetOpen(false)}
        title="ভর্তি নিরাপত্তা ও ফ্রড মনিটরিং অডিট লগ"
        subtitle="ফায়ারস্টোর সিঙ্কড ডুপ্লিকেট রোল, ফোন, ডিভাইস ও রেট লিমিট নিরীক্ষা"
        maxHeight="max-h-[92vh]"
      >
        <div className="space-y-4 pb-6 font-bengali">
          {/* Header & Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-black text-slate-900">রিয়েল-টাইম ফ্রড গার্ড প্রটেকশন</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  সক্রিয়
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                একই রোল, রেজিস্ট্রেশন নম্বর বা ফোন দিয়ে একাধিক আবেদন অথবা অস্বাভাবিক গতিবিধি স্বয়ংক্রিয়ভাবে ব্লক ও লগ করা হয়।
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenSecurityLogs}
              disabled={loadingSecurityLogs}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSecurityLogs ? 'animate-spin text-teal-700' : ''}`} />
              <span>রিফ্রেশ করুন</span>
            </button>
          </div>

          {/* Logs List */}
          {loadingSecurityLogs ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-700" />
              <p className="text-xs font-bold">নিরাপত্তা লগ ফায়ারস্টোর থেকে লোড হচ্ছে...</p>
            </div>
          ) : securityLogs.length === 0 ? (
            <div className="py-12 text-center space-y-2 bg-slate-50/50 rounded-2xl border border-slate-100">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-slate-700">কোনো সন্দেহভাজন ফ্রড বা ডুপ্লিকেট প্রচেষ্টা শনাক্ত হয়নি</p>
              <p className="text-[11px] text-slate-400">সিস্টেমের সকল প্রাপ্ত আবেদন স্বাভাবিক ও বৈধ রয়েছে।</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[58vh] overflow-y-auto pr-1">
              {securityLogs.map((log) => {
                const isHighRisk = (log.riskScore || 0) >= 70 || log.actionTaken === 'BLOCKED';
                const isMediumRisk = (log.riskScore || 0) >= 40 && !isHighRisk;
                return (
                  <div
                    key={log.id}
                    className={`p-3.5 rounded-2xl border text-xs transition-colors ${
                      isHighRisk
                        ? 'bg-rose-50/70 border-rose-200'
                        : isMediumRisk
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-white border-slate-200/80'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isHighRisk
                              ? 'bg-rose-600 text-white'
                              : isMediumRisk
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {log.eventType}
                        </span>
                        <span className="font-bold text-slate-800 text-[11px]">
                          {log.actionTaken === 'BLOCKED'
                            ? '🚫 আবেদন সরাসরি ব্লকড'
                            : log.actionTaken === 'FLAGGED'
                            ? '⚠️ পর্যালোচনার জন্য ফ্ল্যাগড'
                            : 'ক্লিয়ারেন্স / পাস'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatBanglaDate(log.timestamp)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100/80 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">রোল ও ফোন:</span>
                        <span className="font-mono font-bold text-slate-800">
                          রোল: {toBanglaDigits(log.rollNumber || 'প্রযোজ্য নয়')} • {toBanglaDigits(log.phone || '')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">আবেদনকারী / ট্র্যাকিং:</span>
                        <span className="font-bold text-slate-800">
                          {log.candidateName || log.applicationNumber || 'সাধারণ পরিদর্শন'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">রিস্ক স্কোর ও ডিভাইস:</span>
                        <span className="font-bold text-slate-800">
                          স্কোর: {toBanglaDigits(log.riskScore || 0)}/১০০ • <code className="text-[9px] bg-slate-100 px-1 rounded">{log.deviceFingerprint?.slice(0, 10)}...</code>
                        </span>
                      </div>
                    </div>

                    {log.details && (
                      <p className="mt-2 text-[11px] text-slate-600 bg-white/70 p-2 rounded-xl border border-slate-100">
                        {log.details}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Action */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setSecurityLogsSheetOpen(false)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={updatingStatus}
        message="আবেদনের অবস্থা হালনাগাদ করা হচ্ছে..."
        subtext="ডেটাবেজ ও নোটিফিকেশন সিস্টেম সিঙ্ক করা হচ্ছে..."
      />
    </div>
  );
};
