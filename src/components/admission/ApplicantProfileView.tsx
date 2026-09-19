import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlusCircle,
  LogOut,
  ChevronRight,
  Eye,
  GraduationCap,
  Layers,
  RefreshCw,
  Printer,
  Calendar,
  ShieldCheck,
  Edit3,
  LayoutDashboard,
  History,
  UserCheck,
  MapPin,
  Building2,
  Check,
  Award,
  Sparkles,
  School,
  BookOpen,
  ArrowRight,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import {
  ApplicantUser,
  AdmissionApplication,
  AdmissionApplicationStatus,
  AdmissionSettings,
} from '../../types';
import {
  subscribeApplicantApplications,
  logoutApplicant,
  getStatusBanglaLabel,
  getStatusBadgeClasses,
  updateApplicantProfile,
  subscribeAdmissionSettings,
  DEFAULT_ADMISSION_SETTINGS,
  parsePhoneNumbers,
} from '../../services/admissionService';
import { ApplicationDetailsSheet } from './ApplicationDetailsSheet';
import { AdmissionApplyForm } from './AdmissionApplyForm';
import { AdmissionBottomNav } from './AdmissionBottomNav';
import { AdmissionCountdownCard } from './AdmissionCountdownCard';
import { AdmissionFooter } from './AdmissionFooter';
import { getAdmissionDeadlineStatus } from '../../services/admissionService';
import { toBanglaDigits, formatBanglaDate, toEnglishDigits } from '../../utils/bangla';
import { BottomSheet } from '../common/BottomSheet';
import { AnimatePresence } from 'motion/react';
import { SubSectionTransition } from '../common/PageTransition';

interface ApplicantProfileViewProps {
  currentUser: ApplicantUser;
  onLogout: () => void;
  onBackToHome: () => void;
}

export const ApplicantProfileView: React.FC<ApplicantProfileViewProps> = ({
  currentUser,
  onLogout,
  onBackToHome,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'profile'>('dashboard');
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAppForDetails, setSelectedAppForDetails] = useState<AdmissionApplication | null>(null);
  const [isApplyMode, setIsApplyMode] = useState<boolean>(false);
  const [admissionSettings, setAdmissionSettings] = useState<AdmissionSettings>(DEFAULT_ADMISSION_SETTINGS);

  // Profile Form States
  const [profileData, setProfileData] = useState({
    displayName: currentUser.displayName || '',
    phone: currentUser.phone || '',
    email: currentUser.email && !currentUser.email.includes('@dpib-admission.edu.bd') ? currentUser.email : '',
    fatherName: currentUser.fatherName || '',
    motherName: currentUser.motherName || '',
    bloodGroup: currentUser.bloodGroup || '',
    presentAddress: currentUser.presentAddress || '',
    permanentAddress: currentUser.permanentAddress || '',
  });
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<boolean>(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);

  // Realtime subscription to current user's applications
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeApplicantApplications(
      currentUser.uid,
      (list) => {
        setApplications(list);
        setLoading(false);

        // Auto-fill missing profile details from latest application if present
        if (list.length > 0) {
          const latest = list[0];
          setProfileData((prev) => ({
            displayName: prev.displayName || latest.personalInfo.fullNameBangla || latest.personalInfo.fullNameEnglish || '',
            phone: prev.phone || latest.applicantPhone || '',
            email: prev.email || (latest.applicantEmail && !latest.applicantEmail.includes('@dpib-admission.edu.bd') ? latest.applicantEmail : ''),
            fatherName: prev.fatherName || latest.personalInfo.fatherName || '',
            motherName: prev.motherName || latest.personalInfo.motherName || '',
            bloodGroup: prev.bloodGroup || latest.personalInfo.bloodGroup || '',
            presentAddress: prev.presentAddress || latest.personalInfo.presentAddress || '',
            permanentAddress: prev.permanentAddress || latest.personalInfo.permanentAddress || '',
          }));
        }
      },
      (err) => {
        console.error('Error fetching applicant apps:', err);
        setLoading(false);
      }
    );

    const unsubSettings = subscribeAdmissionSettings((st) => {
      setAdmissionSettings(st);
    });

    return () => {
      unsubscribe();
      unsubSettings();
    };
  }, [currentUser.uid]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.displayName.trim()) {
      setProfileSaveError('অনুগ্রহ করে আপনার পূর্ণ নাম প্রদান করুন।');
      return;
    }
    if (!profileData.phone.trim()) {
      setProfileSaveError('অনুগ্রহ করে যোগাযোগের মোবাইল নম্বর প্রদান করুন।');
      return;
    }

    try {
      setSavingProfile(true);
      setProfileSaveSuccess(false);
      setProfileSaveError(null);

      await updateApplicantProfile(currentUser.uid, {
        displayName: profileData.displayName.trim(),
        phone: profileData.phone.trim(),
        email: profileData.email.trim() || undefined,
        fatherName: profileData.fatherName.trim() || undefined,
        motherName: profileData.motherName.trim() || undefined,
        bloodGroup: profileData.bloodGroup || undefined,
        presentAddress: profileData.presentAddress.trim() || undefined,
        permanentAddress: profileData.permanentAddress.trim() || undefined,
      });

      // Update local user object
      currentUser.displayName = profileData.displayName.trim();
      currentUser.phone = profileData.phone.trim();
      if (profileData.email) currentUser.email = profileData.email.trim();
      if (profileData.fatherName) currentUser.fatherName = profileData.fatherName.trim();
      if (profileData.motherName) currentUser.motherName = profileData.motherName.trim();
      if (profileData.bloodGroup) currentUser.bloodGroup = profileData.bloodGroup;
      if (profileData.presentAddress) currentUser.presentAddress = profileData.presentAddress.trim();
      if (profileData.permanentAddress) currentUser.permanentAddress = profileData.permanentAddress.trim();

      setProfileSaveSuccess(true);
      setTimeout(() => {
        setProfileSaveSuccess(false);
      }, 3500);
    } catch (err: any) {
      console.error('Failed to update applicant profile:', err);
      setProfileSaveError(err?.message || 'প্রোফাইল তথ্য সংরক্ষণে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogoutClick = async () => {
    await logoutApplicant();
    onLogout();
  };

  const latestApp = applications[0];

  // Derive Academic details if present in any application
  const academicSummary = latestApp?.educationalInfo || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-bengali pb-24">
      {/* ================= TOP HEADER / APP BAR ================= */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBackToHome}
              className="flex items-center space-x-2 text-xs font-bold text-slate-700 hover:text-blue-700 transition-colors cursor-pointer group"
              title="মূল ওয়েবসাইটে ফিরে যান"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-50 p-0.5 border border-slate-200 flex items-center justify-center group-hover:border-blue-300">
                <img
                  src="https://i.postimg.cc/j5K3pb0M/sovapoti-images1.png"
                  alt="DPIB Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-left hidden sm:block">
                <span className="font-outfit font-black text-slate-900 text-sm block leading-none">
                  DPIB
                </span>
                <span className="text-[10px] text-slate-500 font-bold block leading-none mt-0.5">
                  ভর্তি পোর্টাল
                </span>
              </div>
            </button>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="text-xs font-black text-blue-800 uppercase font-outfit hidden sm:inline">
              আবেদনকারী ড্যাশবোর্ড
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onBackToHome}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <School className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">মূল ওয়েবসাইট</span>
            </button>

            <button
              onClick={handleLogoutClick}
              title="লগআউট"
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 border border-rose-200/80 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>লগআউট</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT BODY ================= */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
        <AnimatePresence mode="wait">
          {isApplyMode ? (
            /* ================= ADMISSION APPLY FORM VIEW ================= */
            <SubSectionTransition key="applicant-apply-mode" className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="space-y-0.5">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-700" />
                    <span>নতুন ভর্তি আবেদন ফরম</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    ৪ বছর মেয়াদি ডিপ্লোমা ইন ইঞ্জিনিয়ারিং শিক্ষাক্রম
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsApplyMode(false)}
                  className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>ড্যাশবোর্ডে ফিরে যান</span>
                </button>
              </div>

              <AdmissionApplyForm
                currentUser={currentUser}
                onSuccess={(newApp) => {
                  setIsApplyMode(false);
                  setSelectedAppForDetails(newApp);
                  setActiveTab('history');
                }}
                onCancel={() => setIsApplyMode(false)}
              />
            </SubSectionTransition>
          ) : (
            <SubSectionTransition key={`applicant-tab-${activeTab}`}>
              {/* ================= TAB 1: DASHBOARD ================= */}
            {activeTab === 'dashboard' && (() => {
              const deadlineInfo = getAdmissionDeadlineStatus(admissionSettings);
              const isExpired = deadlineInfo.isExpired;

              return (
                <div className="space-y-5">
                  {/* 1. Profile / User Information Card (Applicant Name & Mobile Number) */}
                  <div className="bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 text-white rounded-3xl p-5 sm:p-7 shadow-[0_12px_36px_rgba(2,132,199,0.18)] relative overflow-hidden border border-sky-400/30">
                    {/* Subtle ambient light glows */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-60 h-60 bg-sky-300/15 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                      <div className="flex items-start sm:items-center space-x-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/25 p-1 flex items-center justify-center backdrop-blur-md shrink-0 shadow-inner">
                          <User className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-lg sm:text-2xl font-black text-white">
                              {currentUser.displayName || 'ভর্তি আবেদনকারী'}
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30 backdrop-blur-xs font-outfit shadow-2xs">
                              রেজিস্টার্ড আবেদনকারী
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-sky-100 font-medium">
                            {currentUser.phone && (
                              <span className="flex items-center gap-1.5 font-mono">
                                <Phone className="w-3.5 h-3.5 text-sky-200" />
                                <span>{currentUser.phone}</span>
                              </span>
                            )}
                            {currentUser.email && !currentUser.email.includes('@dpib-admission.edu.bd') && (
                              <span className="flex items-center gap-1.5 font-outfit">
                                <Mail className="w-3.5 h-3.5 text-sky-200" />
                                <span>{currentUser.email}</span>
                              </span>
                            )}
                          </div>

                          {latestApp && (
                            <div className="pt-1 flex items-center gap-2">
                              <span className="text-[11px] text-sky-100 font-medium">
                                সর্বশেষ আবেদন নম্বর:
                              </span>
                              <span className="text-xs font-mono font-black text-blue-900 bg-white px-2.5 py-0.5 rounded-lg shadow-2xs">
                                {latestApp.applicationNumber}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-white/15">
                        <button
                          id="applicant-apply-now-btn"
                          type="button"
                          onClick={() => !isExpired && setIsApplyMode(true)}
                          disabled={isExpired}
                          className={`flex-1 md:flex-none py-3 px-5 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                            isExpired
                              ? 'bg-white/20 text-sky-200 cursor-not-allowed border border-white/20'
                              : 'bg-white hover:bg-sky-50 text-blue-700 shadow-md shadow-blue-950/20 active:scale-98 cursor-pointer'
                          }`}
                          title={isExpired ? 'ভর্তির সময়সীমা শেষ হয়েছে' : 'নতুন ভর্তি আবেদন করুন'}
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>{isExpired ? 'আবেদন সমাপ্ত' : 'নতুন ভর্তি আবেদন করুন'}</span>
                        </button>

                        {latestApp && (
                          <button
                            type="button"
                            onClick={() => setSelectedAppForDetails(latestApp)}
                            className="py-3 px-4 bg-white/15 hover:bg-white/25 text-white font-bold rounded-2xl text-xs sm:text-sm border border-white/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs"
                          >
                            <Eye className="w-4 h-4" />
                            <span>আবেদন স্লিপ</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. Live Admission Window Countdown (Shifted below user profile card) */}
                  <AdmissionCountdownCard settings={admissionSettings} />

                {/* 2. Authority Notification & Instructions Box */}
                {latestApp?.adminInstructions && (
                  <div className="p-4 sm:p-5 bg-amber-50 rounded-2xl border border-amber-200/90 shadow-2xs flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-black text-amber-950">
                          কর্তৃপক্ষের সাম্প্রতিক নির্দেশনা ও নোটিফিকেশন
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 font-bold">
                          জরুরি
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium whitespace-pre-line">
                        {latestApp.adminInstructions}
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. Current Application Status Tracker (Active Application View) */}
                {latestApp ? (
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-700" />
                            <span>আবেদনের বর্তমান অবস্থা ও ট্র্যাকিং</span>
                          </h2>
                          {(() => {
                            const badge = getStatusBadgeClasses(latestApp.status);
                            return (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                <span>{getStatusBanglaLabel(latestApp.status)}</span>
                              </span>
                            );
                          })()}
                        </div>
                        <p className="text-xs text-slate-500">
                          আবেদন নম্বর: <strong className="font-mono text-slate-700 font-bold">{latestApp.applicationNumber}</strong> • দাখিলের তারিখ: {formatBanglaDate(latestApp.submittedAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedAppForDetails(latestApp)}
                          className="py-2 px-3.5 bg-sky-50 hover:bg-sky-100 text-blue-800 font-bold rounded-xl text-xs border border-sky-200 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>পূর্ণাঙ্গ বিবরণ দেখুন</span>
                        </button>
                      </div>
                    </div>

                    {/* Step Flow indicator */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                      {[
                        { st: 'SUBMITTED', label: '১. আবেদন দাখিল', desc: 'আবেদন গৃহীত হয়েছে' },
                        { st: 'UNDER_REVIEW', label: '২. তথ্য যাচাই', desc: 'কাগজপত্র নিরীক্ষা চলছে' },
                        { st: 'APPROVED', label: '৩. অনুমোদন', desc: 'ভর্তির জন্য নির্বাচিত' },
                        { st: 'ENROLLED', label: '৪. ভর্তি সম্পন্ন', desc: 'ইনস্টিটিউটে ভর্তি নিশ্চিত' },
                      ].map((step, idx) => {
                        const isDone =
                          latestApp.status === 'ENROLLED'
                            ? true
                            : latestApp.status === 'APPROVED'
                            ? idx <= 2
                            : latestApp.status === 'UNDER_REVIEW'
                            ? idx <= 1
                            : idx === 0;

                        const isCurrent =
                          (latestApp.status === 'SUBMITTED' && idx === 0) ||
                          (latestApp.status === 'UNDER_REVIEW' && idx === 1) ||
                          (latestApp.status === 'APPROVED' && idx === 2) ||
                          (latestApp.status === 'ENROLLED' && idx === 3);

                        return (
                          <div
                            key={step.st}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              isDone
                                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                                : isCurrent
                                ? 'bg-sky-50 border-blue-300 text-blue-950 ring-1 ring-blue-400'
                                : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-xs">{step.label}</span>
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : isCurrent ? (
                                <Clock className="w-3.5 h-3.5 text-blue-700 animate-spin shrink-0" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-slate-300" />
                              )}
                            </div>
                            <p className="text-[11px] opacity-80">{step.desc}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[11px] text-slate-500 font-bold block">নির্বাচিত টেকনোলজি (১ম পছন্দ)</span>
                        <span className="text-xs font-bold text-slate-900 block mt-0.5">
                          {latestApp.technologyChoice.firstChoiceDeptName}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[11px] text-slate-500 font-bold block">নির্ধারিত শিফট</span>
                        <span className="text-xs font-bold text-slate-900 block mt-0.5">
                          {latestApp.assignedShift === '1st'
                            ? '১ম শিফট (সকাল ০৮:০০ - দুপুর ০১:০০)'
                            : latestApp.assignedShift === '2nd'
                            ? '২য় শিফট (দুপুর ০১:৩০ - সন্ধ্যা ০৬:৩০)'
                            : 'কর্তৃপক্ষের বিবেচনাধীন'}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[11px] text-slate-500 font-bold block">ভর্তি রোল / সেশন</span>
                        <span className="text-xs font-bold text-slate-900 block mt-0.5">
                          {latestApp.assignedRoll ? `রোল: ${latestApp.assignedRoll}` : 'অনুমোদনের পর প্রদান করা হবে'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* No Application Yet Card */
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center space-y-4 shadow-2xs">
                    <div className="w-14 h-14 rounded-2xl bg-sky-50 text-blue-700 flex items-center justify-center mx-auto border border-sky-100">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                      <h3 className="text-base font-black text-slate-800">
                        এখনো কোনো ভর্তি আবেদন দাখিল করেননি
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        ৪ বছর মেয়াদি ডিপ্লোমা ইন ইঞ্জিনিয়ারিং কোর্সে ভর্তির জন্য এখনই আপনার আবেদন ফর্ম পূরণ করুন।
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => !isExpired && setIsApplyMode(true)}
                      disabled={isExpired}
                      className={`py-2.5 px-5 font-bold rounded-xl text-xs shadow-sm inline-flex items-center gap-2 transition-all ${
                        isExpired
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-blue-700 hover:bg-blue-600 text-white shadow-blue-700/20 cursor-pointer'
                      }`}
                      title={isExpired ? 'ভর্তির সময়সীমা শেষ হয়েছে' : 'ভর্তি আবেদন শুরু করুন'}
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{isExpired ? 'ভর্তির সময়সীমা সমাপ্ত' : 'ভর্তি আবেদন শুরু করুন'}</span>
                    </button>
                  </div>
                )}

                {/* 4. Important Guidelines & Documents Checklist */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Important Guidelines */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-700" />
                      <span>ভর্তি সংক্রান্ত গুরুত্বপূর্ণ নির্দেশনা</span>
                    </h3>
                    <ul className="space-y-2 text-xs text-slate-600">
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                        <span>আবেদন ফর্ম পূরণের সময় এসএসসি রোল, বোর্ড ও পাসের সাল নির্ভুলভাবে দিন।</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                        <span>আবেদন দাখিলের পর প্রাপ্ত ট্র্যাকিং নম্বরটি ভবিষ্যতের জন্য সংরক্ষণ করুন।</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                        <span>অনুমোদন পাওয়ার পর মূল কাগজপত্র নিয়ে নির্ধারিত তারিখের মধ্যে উপস্থিত হতে হবে।</span>
                      </li>
                    </ul>
                  </div>

                  {/* Required Documents */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-700" />
                      <span>ভর্তির সময় প্রয়োজনীয় কাগজপত্র</span>
                    </h3>
                    <ul className="space-y-2 text-xs text-slate-600">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-700 shrink-0 mt-1.5" />
                        <span>এসএসসি/সমমান পরীক্ষার মূল একাডেমিক ট্রান্সক্রিপ্ট/মার্কশিট ও ফটোকপি।</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-700 shrink-0 mt-1.5" />
                        <span>সদ্য তোলা ৪ কপি পাসপোর্ট সাইজ ও ২ কপি স্ট্যাম্প সাইজ রঙিন ছবি।</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-700 shrink-0 mt-1.5" />
                        <span>শিক্ষা প্রতিষ্ঠান প্রধান কর্তৃক প্রদত্ত মূল প্রশংসাপত্র (Testimonial)।</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-700 shrink-0 mt-1.5" />
                        <span>শিক্ষার্থী ও অভিভাবকের জাতীয় পরিচয়পত্র বা ডিজিটাল জন্ম নিবন্ধনের কপি।</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ); })()}

            {/* ================= TAB 2: HISTORY ================= */}
            {activeTab === 'history' && (() => {
              const deadlineInfo = getAdmissionDeadlineStatus(admissionSettings);
              const isExpired = deadlineInfo.isExpired;

              return (
                <div className="space-y-4">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="space-y-0.5">
                      <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <History className="w-5 h-5 text-blue-700" />
                        <span>ভর্তি আবেদন হিস্ট্রি ও ট্র্যাকিং</span>
                      </h2>
                      <p className="text-xs text-slate-500">
                        আপনার জমা দেওয়া সকল ভর্তি আবেদনের বিস্তারিত রেকর্ড ও স্ট্যাটাস হিস্ট্রি
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-sky-50 text-blue-900 border border-sky-200 text-xs font-bold font-outfit">
                        মোট আবেদন: {toBanglaDigits(applications.length)} টি
                      </span>
                      <button
                        type="button"
                        onClick={() => !isExpired && setIsApplyMode(true)}
                        disabled={isExpired}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isExpired
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-700 hover:bg-blue-600 text-white cursor-pointer'
                        }`}
                        title={isExpired ? 'ভর্তির সময়সীমা শেষ হয়েছে' : 'নতুন আবেদন করুন'}
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>{isExpired ? 'আবেদন সমাপ্ত' : 'নতুন আবেদন'}</span>
                      </button>
                    </div>
                  </div>

                {loading ? (
                  <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-700" />
                    <p className="text-xs font-bold text-slate-600">আবেদনপত্র লোড করা হচ্ছে...</p>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 space-y-4 p-6">
                    <div className="w-14 h-14 rounded-2xl bg-sky-50 text-blue-700 flex items-center justify-center mx-auto border border-sky-100">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div className="max-w-sm mx-auto space-y-1">
                      <h3 className="text-base font-black text-slate-800">
                        কোনো আবেদন হিস্ট্রি পাওয়া যায়নি
                      </h3>
                      <p className="text-xs text-slate-500">
                        আপনি এখনো কোনো ভর্তি আবেদন দাখিল করেননি। নতুন আবেদন বাটনে ক্লিক করে সহজে আবেদন জমা দিন।
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsApplyMode(true)}
                      className="py-2.5 px-5 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-xl text-xs inline-flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>এখনই ভর্তি আবেদন করুন</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {applications.map((app) => {
                      const badge = getStatusBadgeClasses(app.status);
                      return (
                        <div
                          key={app.id}
                          className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 p-4 sm:p-5 transition-all shadow-2xs space-y-3.5"
                        >
                          {/* Top row of card */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                  {app.applicationNumber}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                  <span>{getStatusBanglaLabel(app.status)}</span>
                                </span>
                              </div>
                              <h3 className="text-sm font-black text-slate-900 pt-0.5">
                                ১ম পছন্দ: {app.technologyChoice.firstChoiceDeptName}
                              </h3>
                              <p className="text-xs text-slate-500">
                                দাখিলের তারিখ: {formatBanglaDate(app.submittedAt)}
                                {app.updatedAt && app.updatedAt !== app.submittedAt && (
                                  <span> • সর্বশেষ আপডেট: {formatBanglaDate(app.updatedAt)}</span>
                                )}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                              <button
                                type="button"
                                onClick={() => setSelectedAppForDetails(app)}
                                className="py-2 px-3.5 bg-sky-50 hover:bg-sky-100 text-blue-900 font-bold rounded-xl text-xs border border-sky-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-700" />
                                <span>বিস্তারিত দেখুন</span>
                              </button>
                            </div>
                          </div>

                          {/* Technology choices summary */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                              <span className="text-[10px] text-slate-500 font-bold block">১ম পছন্দ:</span>
                              <span className="font-bold text-slate-800">{app.technologyChoice.firstChoiceDeptName}</span>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                              <span className="text-[10px] text-slate-500 font-bold block">২য় পছন্দ:</span>
                              <span className="font-bold text-slate-800">
                                {app.technologyChoice.secondChoiceDeptName || 'বাছাই করা হয়নি'}
                              </span>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                              <span className="text-[10px] text-slate-500 font-bold block">৩য় পছন্দ:</span>
                              <span className="font-bold text-slate-800">
                                {app.technologyChoice.thirdChoiceDeptName || 'বাছাই করা হয়নি'}
                              </span>
                            </div>
                          </div>

                          {/* Status History Timeline */}
                          {app.statusHistory && app.statusHistory.length > 0 && (
                            <div className="pt-2 border-t border-slate-100 space-y-1.5">
                              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>স্ট্যাটাস হিস্ট্রি টাইমলাইন:</span>
                              </span>
                              <div className="space-y-1 pl-2 border-l-2 border-sky-300">
                                {app.statusHistory.map((sh, idx) => (
                                  <div key={idx} className="text-[11px] text-slate-600 flex items-start justify-between gap-2">
                                    <span>
                                      <strong className="text-slate-800">{getStatusBanglaLabel(sh.status)}</strong>
                                      {sh.note && <span> - {sh.note}</span>}
                                    </span>
                                    <span className="text-slate-400 font-mono text-[10px] shrink-0">
                                      {formatBanglaDate(sh.updatedAt)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ); })()}

            {/* ================= TAB 3: PROFILE ================= */}
            {activeTab === 'profile' && (
              <div className="space-y-5">
                {/* Profile Top Overview Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-xs">
                      {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : <User className="w-7 h-7" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base sm:text-lg font-black text-slate-900">
                          {currentUser.displayName || 'ভর্তি আবেদনকারী'}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-blue-800 border border-sky-200">
                          সক্রিয় একাউন্ট
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        মোবাইল: {currentUser.phone}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        নিবন্ধন আইডি: <span className="font-mono">{currentUser.uid}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                      মোট আবেদন: <strong className="font-bold text-slate-900">{toBanglaDigits(applications.length)} টি</strong>
                    </span>
                  </div>
                </div>

                {/* Academic Background Summary if found */}
                {academicSummary && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-700" />
                      <span>একাডেমিক তথ্য (এসএসসি / সমমান রেকর্ড)</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 font-bold block">পরীক্ষার ধরন</span>
                        <span className="font-bold text-slate-800 block mt-0.5">{academicSummary.examType}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 font-bold block">শিক্ষা বোর্ড</span>
                        <span className="font-bold text-slate-800 block mt-0.5">{academicSummary.board}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 font-bold block">রোল নম্বর</span>
                        <span className="font-mono font-bold text-slate-800 block mt-0.5">{academicSummary.rollNumber}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 font-bold block">প্রাপ্ত জিপিএ (GPA)</span>
                        <span className="font-mono font-black text-blue-700 block mt-0.5">{toBanglaDigits(academicSummary.gpa)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Editable Profile Information Form */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
                  <div className="pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-blue-700" />
                      <span>প্রোফাইল তথ্য সম্পাদনা ও আপডেট</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      আপনার নাম, মোবাইল নম্বর এবং অন্যান্য যোগাযোগের তথ্য হালনাগাদ করুন
                    </p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    {profileSaveSuccess && (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>প্রোফাইল তথ্য সফলভাবে সংরক্ষণ ও Firebase-এর সাথে সিঙ্ক করা হয়েছে।</span>
                      </div>
                    )}

                    {profileSaveError && (
                      <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{profileSaveError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          আবেদনকারীর পূর্ণ নাম <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={profileData.displayName}
                          onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                          placeholder="আপনার পূর্ণ নাম লিখুন"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          মোবাইল নম্বর <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          placeholder="আপনার মোবাইল নম্বর লিখুন"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold font-outfit text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          ইমেইল ঠিকানা (ঐচ্ছিক)
                        </label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          placeholder="আপনার ইমেইল ঠিকানা লিখুন"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                      </div>

                      {/* Blood Group */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          রক্তের গ্রুপ (ঐচ্ছিক)
                        </label>
                        <select
                          value={profileData.bloodGroup}
                          onChange={(e) => setProfileData({ ...profileData, bloodGroup: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                        >
                          <option value="">বাছাই করুন</option>
                          <option value="A+">A+ (এ পজিটিভ)</option>
                          <option value="A-">A- (এ নেগেটিভ)</option>
                          <option value="B+">B+ (বি পজিটিভ)</option>
                          <option value="B-">B- (বি নেগেটিভ)</option>
                          <option value="AB+">AB+ (এবি পজিটিভ)</option>
                          <option value="AB-">AB- (এবি নেগেটিভ)</option>
                          <option value="O+">O+ (ও পজিটিভ)</option>
                          <option value="O-">O- (ও নেগেটিভ)</option>
                        </select>
                      </div>

                      {/* Father Name */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          পিতার নাম
                        </label>
                        <input
                          type="text"
                          value={profileData.fatherName}
                          onChange={(e) => setProfileData({ ...profileData, fatherName: e.target.value })}
                          placeholder="পিতার নাম লিখুন"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                      </div>

                      {/* Mother Name */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          মাতার নাম
                        </label>
                        <input
                          type="text"
                          value={profileData.motherName}
                          onChange={(e) => setProfileData({ ...profileData, motherName: e.target.value })}
                          placeholder="মাতার নাম লিখুন"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                      </div>

                      {/* Present Address */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700">
                          বর্তমান ঠিকানা
                        </label>
                        <input
                          type="text"
                          value={profileData.presentAddress}
                          onChange={(e) => setProfileData({ ...profileData, presentAddress: e.target.value })}
                          placeholder="আপনার বর্তমান ঠিকানা লিখুন"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                      </div>

                      {/* Permanent Address */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700">
                          স্থায়ী ঠিকানা
                        </label>
                        <input
                          type="text"
                          value={profileData.permanentAddress}
                          onChange={(e) => setProfileData({ ...profileData, permanentAddress: e.target.value })}
                          placeholder="আপনার স্থায়ী ঠিকানা লিখুন"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-3 flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="py-2.5 px-6 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                      >
                        {savingProfile ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>সংরক্ষণ হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>তথ্য সংরক্ষণ করুন</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </SubSectionTransition>
        )}
      </AnimatePresence>

        {/* Global Admission Footer */}
        {!isApplyMode && (
          <AdmissionFooter settings={admissionSettings} className="mt-12 pb-24 sm:pb-20" />
        )}
      </main>

      {/* ================= MODERN ADMISSION BOTTOM NAVIGATION ================= */}
      {!isApplyMode && (
        <AdmissionBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          applicationsCount={applications.length}
        />
      )}

      {/* ================= APPLICATION DETAILS SHEET ================= */}
      <ApplicationDetailsSheet
        isOpen={Boolean(selectedAppForDetails)}
        onClose={() => setSelectedAppForDetails(null)}
        application={selectedAppForDetails}
      />
    </div>
  );
};
