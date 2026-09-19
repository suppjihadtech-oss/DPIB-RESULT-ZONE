import React from 'react';
import {
  FileText,
  User,
  Phone,
  Mail,
  GraduationCap,
  Layers,
  Calendar,
  MapPin,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Building,
  Sparkles,
  History,
  Info,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { AdmissionApplication, AdmissionApplicationStatus } from '../../types';
import {
  getStatusBanglaLabel,
  getStatusBadgeClasses,
} from '../../services/admissionService';
import { toBanglaDigits, formatBanglaDate } from '../../utils/bangla';
import { printElementById } from '../../utils/printHelper';

interface ApplicationDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  application: AdmissionApplication | null;
}

export const ApplicationDetailsSheet: React.FC<ApplicationDetailsSheetProps> = ({
  isOpen,
  onClose,
  application,
}) => {
  if (!application) return null;

  const statusBadge = getStatusBadgeClasses(application.status);

  const handlePrintSlip = () => {
    printElementById('printable-admission-slip', {
      title: `DPIB_ADMISSION_SLIP_${application.applicationNumber}`,
      orientation: 'portrait',
    });
  };

  const steps: { status: AdmissionApplicationStatus; label: string; desc: string }[] = [
    { status: 'SUBMITTED', label: 'আবেদন দাখিলকৃত', desc: 'আবেদন সফলভাবে গৃহীত হয়েছে' },
    { status: 'UNDER_REVIEW', label: 'যাচাইাধীন', desc: 'কাগজপত্র ও ফলাফল পর্যালোচনা চলছে' },
    { status: 'APPROVED', label: 'অনুমোদিত', desc: 'ভর্তির জন্য চূড়ান্তভাবে নির্বাচিত' },
    { status: 'ENROLLED', label: 'ভর্তি সম্পন্ন', desc: 'ইনস্টিটিউটে ভর্তি নিশ্চিত' },
  ];

  const getStepState = (stepStatus: AdmissionApplicationStatus) => {
    const statusOrder: AdmissionApplicationStatus[] = [
      'SUBMITTED',
      'UNDER_REVIEW',
      'APPROVED',
      'ENROLLED',
    ];
    if (application.status === 'REJECTED') {
      if (stepStatus === 'SUBMITTED') return 'completed';
      if (stepStatus === 'UNDER_REVIEW') return 'completed';
      return 'rejected';
    }
    const currentIdx = statusOrder.indexOf(application.status);
    const stepIdx = statusOrder.indexOf(stepStatus);

    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="ভর্তি আবেদনপত্রের পূর্ণাঙ্গ বিবরণ"
      subtitle={`আবেদন নম্বর: ${application.applicationNumber}`}
      maxHeight="max-h-[94vh]"
    >
      <div id="printable-admission-slip" className="space-y-6 pb-6 font-bengali">
        {/* ================= PRINTABLE SLIP HEADER / BANNER ================= */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 p-0.5 flex items-center justify-center backdrop-blur-md shrink-0">
                <img
                  src="https://i.postimg.cc/j5K3pb0M/sovapoti-images1.png"
                  alt="DPIB Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <p className="text-[11px] font-bold text-teal-300 uppercase tracking-widest font-outfit">
                  DPIB ADMISSION PORTAL
                </p>
                <h3 className="text-base sm:text-lg font-black text-white">
                  দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট
                </h3>
                <p className="text-xs text-slate-300">
                  ৪ বছর মেয়াদি ডিপ্লোমা ইন ইঞ্জিনিয়ারিং ভর্তি আবেদন
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end">
              <span className="text-[10px] text-slate-400 font-bold tracking-wider">
                আবেদন নম্বর
              </span>
              <span className="text-sm sm:text-base font-mono font-black text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-500/30 mt-0.5">
                {application.applicationNumber}
              </span>
            </div>
          </div>
        </div>

        {/* ================= STATUS PROGRESS TIMELINE ================= */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-700" />
              <span>আবেদনের বর্তমান পর্যায়</span>
            </h4>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
              <span>{getStatusBanglaLabel(application.status)}</span>
            </span>
          </div>

          {/* Stepper tracker */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {steps.map((st, idx) => {
              const state = getStepState(st.status);
              return (
                <div
                  key={st.status}
                  className={`p-3 rounded-xl border transition-all text-center flex flex-col items-center justify-center ${
                    state === 'completed'
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : state === 'active'
                      ? 'bg-teal-50 border-teal-300 text-teal-950 ring-2 ring-teal-600/20 shadow-2xs'
                      : state === 'rejected'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-70'
                  }`}
                >
                  <div className="mb-1">
                    {state === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : state === 'active' ? (
                      <Clock className="w-5 h-5 text-teal-700 animate-pulse" />
                    ) : state === 'rejected' ? (
                      <XCircle className="w-5 h-5 text-rose-600" />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center font-outfit">
                        {toBanglaDigits(idx + 1)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-black block leading-tight">{st.label}</span>
                  <span className="text-[10px] font-medium text-slate-500 mt-0.5 block leading-tight">
                    {st.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= AUTHORITY INSTRUCTION / NOTICE BANNER ================= */}
        {application.adminInstructions && (
          <div className="p-4 sm:p-5 bg-amber-50/80 rounded-2xl border border-amber-200/90 flex items-start gap-3.5 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-black text-amber-950">
                কর্তৃপক্ষের নির্দেশনা ও বিজ্ঞপ্তি
              </h4>
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium whitespace-pre-line">
                {application.adminInstructions}
              </p>
            </div>
          </div>
        )}

        {/* Assigned Roll & Session if Enrolled */}
        {application.assignedRoll && (
          <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-teal-800 font-bold">নির্ধারিত শ্রেণি রোল ও শিক্ষাবর্ষ</p>
              <p className="text-base font-black text-teal-950 mt-0.5">
                রোল: {toBanglaDigits(application.assignedRoll)} • শিক্ষাবর্ষ: {application.assignedSession || '২০২৬-২৭'}
              </p>
            </div>
            <span className="px-3 py-1 bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs">
              ভর্তি সম্পন্ন
            </span>
          </div>
        )}

        {/* ================= 1. PERSONAL INFORMATION ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3.5">
            <User className="w-4 h-4 text-teal-700" />
            <h4 className="text-xs sm:text-sm font-black text-slate-900">
              ব্যক্তিগত তথ্যাবলি
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">আবেদনকারীর নাম (বাংলা):</span>
              <span className="font-bold text-slate-800 text-sm">{application.personalInfo.fullNameBangla}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">আবেদনকারীর নাম (ইংরেজি):</span>
              <span className="font-bold text-slate-800 text-sm font-outfit uppercase">{application.personalInfo.fullNameEnglish}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">পিতার নাম:</span>
              <span className="font-bold text-slate-800">{application.personalInfo.fatherName}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">মাতার নাম:</span>
              <span className="font-bold text-slate-800">{application.personalInfo.motherName}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">অভিভাবকের নাম ও মোবাইল নম্বর:</span>
              <span className="font-bold text-slate-800">
                {application.personalInfo.guardianName || 'প্রযোজ্য নয়'}{' '}
                {application.personalInfo.guardianPhone ? `(${toBanglaDigits(application.personalInfo.guardianPhone)})` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">জন্মতারিখ ও লিঙ্গ:</span>
              <span className="font-bold text-slate-800">
                {formatBanglaDate(application.personalInfo.dateOfBirth)} •{' '}
                {application.personalInfo.gender === 'MALE' ? 'পুরুষ' : application.personalInfo.gender === 'FEMALE' ? 'মহিলা' : 'অন্যান্য'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">রক্তের গ্রুপ ও ধর্ম:</span>
              <span className="font-bold text-slate-800">
                {application.personalInfo.bloodGroup || 'অজানা'} • {application.personalInfo.religion}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">মোবাইল নম্বর:</span>
              <span className="font-bold text-slate-800 font-mono">
                {toBanglaDigits(application.applicantPhone || application.personalInfo.guardianPhone || '')}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 font-medium block">বর্তমান ঠিকানা:</span>
              <span className="font-bold text-slate-800">{application.personalInfo.presentAddress}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 font-medium block">স্থায়ী ঠিকানা:</span>
              <span className="font-bold text-slate-800">{application.personalInfo.permanentAddress}</span>
            </div>
          </div>
        </div>

        {/* ================= 2. EDUCATIONAL QUALIFICATION ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3.5">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs sm:text-sm font-black text-slate-900">
              শিক্ষাগত যোগ্যতা (এসএসসি / সমমান পরীক্ষা)
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block font-medium">পরীক্ষার নাম</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">{application.educationalInfo.examType}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block font-medium">শিক্ষা বোর্ড</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">{application.educationalInfo.board}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block font-medium">রোল নম্বর</span>
              <span className="font-bold text-slate-800 text-sm font-mono mt-0.5 block">{toBanglaDigits(application.educationalInfo.rollNumber)}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block font-medium">রেজিস্ট্রেশন নম্বর</span>
              <span className="font-bold text-slate-800 text-sm font-mono mt-0.5 block">{toBanglaDigits(application.educationalInfo.registrationNumber)}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block font-medium">পাসের সাল</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">{toBanglaDigits(application.educationalInfo.passingYear)}</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-emerald-700 block font-medium">প্রাপ্ত জিপিএ</span>
              <span className="font-black text-emerald-800 text-base mt-0.5 block font-outfit">{toBanglaDigits(application.educationalInfo.gpa.toFixed(2))}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl sm:col-span-2">
              <span className="text-slate-400 block font-medium">বিভাগ বা গ্রুপ</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">{application.educationalInfo.group || 'বিজ্ঞান'}</span>
            </div>
          </div>
        </div>

        {/* ================= 3. TECHNOLOGY CHOICES & AUTHORITY ASSIGNMENT ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3.5">
            <Layers className="w-4 h-4 text-teal-700" />
            <h4 className="text-xs sm:text-sm font-black text-slate-900">
              পছন্দের টেকনোলজি ও শিফট বণ্টন
            </h4>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-teal-700 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                  ১
                </span>
                <div>
                  <span className="text-[10px] text-teal-800 font-bold block">১ম পছন্দ</span>
                  <span className="font-black text-slate-900 text-sm">{application.technologyChoice.firstChoiceDeptName}</span>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-white rounded-lg text-[10px] font-bold text-teal-800 border border-teal-200">
                অগ্রাধিকার ১
              </span>
            </div>

            {application.technologyChoice.secondChoiceDeptName && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-slate-700 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    ২
                  </span>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">২য় পছন্দ</span>
                    <span className="font-bold text-slate-800 text-sm">{application.technologyChoice.secondChoiceDeptName}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-white rounded-lg text-[10px] font-bold text-slate-600 border border-slate-200">
                  অগ্রাধিকার ২
                </span>
              </div>
            )}

            {application.technologyChoice.thirdChoiceDeptName && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-slate-500 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    ৩
                  </span>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">৩য় পছন্দ</span>
                    <span className="font-bold text-slate-800 text-sm">{application.technologyChoice.thirdChoiceDeptName}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-white rounded-lg text-[10px] font-bold text-slate-600 border border-slate-200">
                  অগ্রাধিকার ৩
                </span>
              </div>
            )}

            {/* Shift Assignment Badge */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">কর্তৃপক্ষ কর্তৃক নির্ধারিত শিফট</span>
                <span className="font-black text-slate-900 text-xs">
                  {application.assignedShift === '1st'
                    ? '১ম শিফট (সকাল ০৮:০০ - ০১:১৫)'
                    : application.assignedShift === '2nd'
                    ? '২য় শিফট (দুপুর ০১:৩০ - ০৬:০০)'
                    : 'কর্তৃপক্ষের বিবেচনাধীন (আসন ও মেধা সাপেক্ষে বণ্টন করা হবে)'}
                </span>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                application.assignedShift
                  ? 'bg-teal-100 text-teal-900 border border-teal-200'
                  : 'bg-slate-200/70 text-slate-700'
              }`}>
                {application.assignedShift ? 'নির্ধারিত' : 'প্রক্রিয়াধীন'}
              </span>
            </div>
          </div>
        </div>

        {/* ================= 4. SECURITY & ANTI-FRAUD AUDIT ================= */}
        {application.securityAudit && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
              <div className="flex items-center gap-2">
                {application.securityAudit.riskScore >= 40 ? (
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                )}
                <h4 className="text-xs sm:text-sm font-black text-slate-900">
                  নিরাপত্তা ও ফ্রড প্রতিরোধ বিশ্লেষণ (Firestore Sync)
                </h4>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  application.securityAudit.riskScore >= 75
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : application.securityAudit.riskScore >= 40
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                রিস্ক স্কোর: {toBanglaDigits(application.securityAudit.riskScore)}/১০০ ({application.securityAudit.riskLevel})
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">ডুপ্লিকেট রোল স্ট্যাটাস</span>
                  <span className={`font-bold mt-0.5 block ${application.securityAudit.fraudFlags?.isDuplicateRoll ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {application.securityAudit.fraudFlags?.isDuplicateRoll ? 'ডুপ্লিকেট ফ্ল্যাগড' : 'ক্লিয়ার (স্বতন্ত্র)'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">রেজিস্ট্রেশন স্ট্যাটাস</span>
                  <span className={`font-bold mt-0.5 block ${application.securityAudit.fraudFlags?.isDuplicateReg ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {application.securityAudit.fraudFlags?.isDuplicateReg ? 'ডুপ্লিকেট ফ্ল্যাগড' : 'ক্লিয়ার (স্বতন্ত্র)'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">সাবমিশন গতি ও ভেলোসিটি</span>
                  <span className={`font-bold mt-0.5 block ${application.securityAudit.fraudFlags?.isRapidSubmission ? 'text-amber-600' : 'text-emerald-700'}`}>
                    {application.securityAudit.fraudFlags?.isRapidSubmission ? 'অস্বাভাবিক দ্রুত (বট সন্দেহ)' : 'স্বাভাবিক ম্যানুয়াল'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">অ্যাকশন ফলাফল</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">
                    {application.securityAudit.actionTaken === 'PASSED' ? 'অনুমোদিত পাস' : 'পর্যালোচনাধীন'}
                  </span>
                </div>
              </div>

              {application.securityAudit.riskFactors && application.securityAudit.riskFactors.length > 0 && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                  <span className="text-amber-900 font-bold text-[11px] block mb-1">চিহ্নিত ঝুঁকি ও অ্যালার্ট ফ্যাক্টর:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-800 text-[11px]">
                    {application.securityAudit.riskFactors.map((factor, fIdx) => (
                      <li key={fIdx} className="font-mono text-[10px]">{factor}</li>
                    ))}
                  </ul>
                </div>
              )}

              {application.securityAudit.deviceFingerprint && (
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>ডিভাইস ফিঙ্গারপ্রিন্ট: <code className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{application.securityAudit.deviceFingerprint}</code></span>
                  <span>যাচাইয়ের সময়: {formatBanglaDate(application.securityAudit.evaluatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= 5. APPLICATION STATUS & HISTORY LOG TIMELINE ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
            <History className="w-4 h-4 text-teal-700" />
            <h4 className="text-xs sm:text-sm font-black text-slate-900">
              আবেদনের ইতিহাস ও পর্যালোচনার বিবরণ
            </h4>
          </div>

          {(!application.statusHistory || application.statusHistory.length === 0) ? (
            <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-xs text-center">
              আবেদনটি {formatBanglaDate(application.submittedAt)} তারিখে দাখিল করা হয়েছে।
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {application.statusHistory.map((item, idx) => {
                const badge = getStatusBadgeClasses(item.status);
                return (
                  <div key={idx} className="relative group">
                    {/* Circle Node */}
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-teal-700 flex items-center justify-center shadow-xs">
                      <div className="w-2 h-2 rounded-full bg-teal-700" />
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          <span>{getStatusBanglaLabel(item.status)}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatBanglaDate(item.updatedAt)}
                        </span>
                      </div>

                      {item.note && (
                        <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">
                          {item.note}
                        </p>
                      )}

                      {item.updatedBy && (
                        <span className="text-[10px] text-slate-400 block mt-1">
                          হালনাগাদ করেছেন: {item.updatedBy}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= ACTIONS ================= */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handlePrintSlip}
            className="w-full sm:w-auto flex-1 py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>আবেদনপত্র প্রিন্ট / ডাউনলোড করুন</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
