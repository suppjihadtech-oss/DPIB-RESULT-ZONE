import React, { useState, useMemo, useRef } from 'react';
import {
  User,
  GraduationCap,
  Layers,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building,
  FileCheck,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ShieldCheck,
  Cpu,
  Zap,
  Wrench,
  Radio,
  BookOpen,
  Award,
  UserCheck,
  Heart,
  Droplet,
  Users,
} from 'lucide-react';
import {
  ApplicantUser,
  AdmissionApplication,
  PersonalInfo,
  EducationalInfo,
  TechnologyChoice,
  Department,
} from '../../types';
import {
  createAdmissionApplication,
} from '../../services/admissionService';
import { generateDeviceFingerprint } from '../../services/admissionSecurityService';
import { DEFAULT_DEPARTMENTS } from '../../services/db';
import { toBanglaDigits, toEnglishDigits } from '../../utils/bangla';
import { LoadingOverlay } from '../common/LoadingOverlay';
import { SelectBottomSheet, SelectOption, SelectTrigger } from '../common/SelectBottomSheet';
import { ModernDatePicker, ModernDateTrigger } from '../common/ModernDatePicker';

interface AdmissionApplyFormProps {
  currentUser: ApplicantUser;
  onSuccess: (application: AdmissionApplication) => void;
  onCancel: () => void;
}

const BOARDS = [
  'ঢাকা',
  'বরিশাল',
  'কুমিল্লা',
  'চট্টগ্রাম',
  'রাজশাহী',
  'যশোর',
  'দিনাজপুর',
  'সিলেট',
  'ময়মনসিংহ',
  'বাংলাদেশ মাদ্রাসা শিক্ষা বোর্ড',
  'বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB)',
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const PASSING_YEARS = ['2026', '2025', '2024', '2023', '2022', '2021'];

type ActiveSheetType =
  | 'GENDER'
  | 'BLOOD_GROUP'
  | 'RELIGION'
  | 'GUARDIAN_RELATION'
  | 'EXAM_TYPE'
  | 'BOARD'
  | 'PASSING_YEAR'
  | 'GROUP'
  | 'TECH_CHOICE_1'
  | 'TECH_CHOICE_2'
  | 'TECH_CHOICE_3'
  | null;

export const AdmissionApplyForm: React.FC<AdmissionApplyFormProps> = ({
  currentUser,
  onSuccess,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const formLoadedAtRef = useRef<number>(Date.now());

  // Active Bottom Sheet Modal
  const [activeSheet, setActiveSheet] = useState<ActiveSheetType>(null);
  const [dobPickerOpen, setDobPickerOpen] = useState<boolean>(false);

  // 1. Personal Information State
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullNameBangla: currentUser.displayName || '',
    fullNameEnglish: '',
    fatherName: '',
    motherName: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelation: 'পিতা',
    dateOfBirth: '2008-01-01',
    gender: 'MALE',
    bloodGroup: 'B+',
    religion: 'ইসলাম',
    nationality: 'বাংলাদেশী',
    presentAddress: '',
    permanentAddress: '',
  });

  // 2. Educational Information State
  const [educationalInfo, setEducationalInfo] = useState<EducationalInfo>({
    examType: 'SSC',
    board: 'বরিশাল',
    rollNumber: '',
    registrationNumber: '',
    passingYear: '2025',
    gpa: 4.5,
    instituteName: '',
    group: 'বিজ্ঞান',
  });

  // 3. Technology Preferences
  const [technologyChoice, setTechnologyChoice] = useState<TechnologyChoice>({
    firstChoiceDeptId: DEFAULT_DEPARTMENTS[0]?.id || 'cmt',
    firstChoiceDeptName: DEFAULT_DEPARTMENTS[0]?.name || 'কম্পিউটার টেকনোলজি (CMT)',
    secondChoiceDeptId: DEFAULT_DEPARTMENTS[1]?.id || 'ct',
    secondChoiceDeptName: DEFAULT_DEPARTMENTS[1]?.name || 'সিভিল টেকনোলজি (CT)',
    thirdChoiceDeptId: DEFAULT_DEPARTMENTS[2]?.id || 'et',
    thirdChoiceDeptName: DEFAULT_DEPARTMENTS[2]?.name || 'ইলেকট্রিক্যাল টেকনোলজি (ET)',
  });

  // Get department icon by code
  const getDeptIcon = (deptId: string) => {
    switch (deptId) {
      case 'cmt':
        return Cpu;
      case 'ct':
        return Building;
      case 'et':
        return Zap;
      case 'mt':
        return Wrench;
      case 'ent':
        return Radio;
      default:
        return Layers;
    }
  };

  // Select Option Lists
  const genderOptions: SelectOption[] = [
    { value: 'MALE', label: 'পুরুষ', badge: 'পুরুষ', icon: User },
    { value: 'FEMALE', label: 'মহিলা', badge: 'মহিলা', icon: User },
    { value: 'OTHER', label: 'অন্যান্য', badge: 'অন্যান্য', icon: User },
  ];

  const bloodGroupOptions: SelectOption[] = BLOOD_GROUPS.map((bg) => ({
    value: bg,
    label: `${bg} গ্রুপ`,
    badge: bg,
    icon: Droplet,
  }));

  const religionOptions: SelectOption[] = [
    { value: 'ইসলাম', label: 'ইসলাম', badge: 'ইসলাম', icon: ShieldCheck },
    { value: 'হিন্দু', label: 'হিন্দু', badge: 'হিন্দু', icon: ShieldCheck },
    { value: 'বৌদ্ধ', label: 'বৌদ্ধ', badge: 'বৌদ্ধ', icon: ShieldCheck },
    { value: 'খ্রিস্টান', label: 'খ্রিস্টান', badge: 'খ্রিস্টান', icon: ShieldCheck },
    { value: 'অন্যান্য', label: 'অন্যান্য', badge: 'অন্যান্য', icon: ShieldCheck },
  ];

  const guardianRelationOptions: SelectOption[] = [
    { value: 'পিতা', label: 'পিতা', badge: 'পিতা', icon: Users },
    { value: 'মাতা', label: 'মাতা', badge: 'মাতা', icon: Users },
    { value: 'ভাই', label: 'ভাই', badge: 'ভাই', icon: Users },
    { value: 'চাচা', label: 'চাচা / মামা', badge: 'চাচা/মামা', icon: Users },
    { value: 'অন্যান্য', label: 'অন্যান্য অভিভাবক', badge: 'অভিভাবক', icon: Users },
  ];

  const examTypeOptions: SelectOption[] = [
    { value: 'SSC', label: 'এসএসসি (সাধারণ শিক্ষা বোর্ড)', badge: 'এসএসসি', icon: GraduationCap },
    { value: 'DAKHIL', label: 'দাখিল (মাদ্রাসা শিক্ষা বোর্ড)', badge: 'দাখিল', icon: GraduationCap },
    { value: 'VOCATIONAL', label: 'ভোকেশনাল (কারিগরি শিক্ষা বোর্ড)', badge: 'ভোকেশনাল', icon: Award },
    { value: 'EQUIVALENT', label: 'সমমান (ও-লেভেল / সমমান)', badge: 'সমমান', icon: BookOpen },
  ];

  const boardOptions: SelectOption[] = BOARDS.map((b) => ({
    value: b,
    label: b,
    badge: b === 'বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB)' ? 'BTEB' : 'বোর্ড',
    icon: Building,
  }));

  const passingYearOptions: SelectOption[] = PASSING_YEARS.map((y) => ({
    value: y,
    label: `${toBanglaDigits(y)} সাল`,
    badge: toBanglaDigits(y),
    icon: Calendar,
  }));

  const groupOptions: SelectOption[] = [
    { value: 'বিজ্ঞান', label: 'বিজ্ঞান বিভাগ', badge: 'বিজ্ঞান', icon: Cpu },
    { value: 'মানবিক', label: 'মানবিক বিভাগ', badge: 'মানবিক', icon: BookOpen },
    { value: 'ব্যবসায় শিক্ষা', label: 'ব্যবসায় শিক্ষা বিভাগ', badge: 'ব্যবসায় শিক্ষা', icon: Award },
    { value: 'ভোকেশনাল', label: 'ভোকেশনাল শাখা', badge: 'ভোকেশনাল', icon: Wrench },
    { value: 'অন্যান্য', label: 'অন্যান্য শাখা', badge: 'অন্যান্য', icon: Layers },
  ];

  const technologyOptions: SelectOption[] = DEFAULT_DEPARTMENTS.map((dept) => ({
    value: dept.id,
    label: dept.name,
    badge: dept.code,
    icon: getDeptIcon(dept.id),
  }));

  const optionalTechnologyOptions: SelectOption[] = [
    { value: '', label: 'কোনো পছন্দ নেই (ঐচ্ছিক)', badge: 'NONE', icon: Layers },
    ...technologyOptions,
  ];

  // Helper Labels
  const getGenderLabel = (val: string) => {
    const found = genderOptions.find((o) => o.value === val);
    return found ? found.label : val;
  };

  const getExamTypeLabel = (val: string) => {
    const found = examTypeOptions.find((o) => o.value === val);
    return found ? found.label : val;
  };

  // Step 1 Validation
  const validateStep1 = (): boolean => {
    setErrorMessage(null);
    if (!personalInfo.fullNameBangla.trim()) {
      setErrorMessage('অনুগ্রহ করে বাংলায় পূর্ণ নাম লিখুন।');
      return false;
    }
    if (!personalInfo.fullNameEnglish.trim()) {
      setErrorMessage('অনুগ্রহ করে ইংরেজিতে পূর্ণ নাম লিখুন।');
      return false;
    }
    if (!personalInfo.fatherName.trim()) {
      setErrorMessage('পিতার নাম প্রদান করুন।');
      return false;
    }
    if (!personalInfo.motherName.trim()) {
      setErrorMessage('মাতার নাম প্রদান করুন।');
      return false;
    }
    if (!personalInfo.presentAddress.trim()) {
      setErrorMessage('বর্তমান ঠিকানা লিখুন।');
      return false;
    }
    if (!personalInfo.permanentAddress.trim()) {
      setErrorMessage('স্থায়ী ঠিকানা লিখুন।');
      return false;
    }
    return true;
  };

  // Step 2 Validation
  const validateStep2 = (): boolean => {
    setErrorMessage(null);
    if (!educationalInfo.rollNumber.trim()) {
      setErrorMessage('এসএসসি/সমমান পরীক্ষার রোল নম্বর প্রদান করুন।');
      return false;
    }
    if (!educationalInfo.registrationNumber.trim()) {
      setErrorMessage('রেজিস্ট্রেশন নম্বর প্রদান করুন।');
      return false;
    }
    if (!educationalInfo.gpa || educationalInfo.gpa < 2.0 || educationalInfo.gpa > 5.0) {
      setErrorMessage('সঠিক জিপিএ (২.০০ থেকে ৫.০০ এর মধ্যে) লিখুন।');
      return false;
    }
    return true;
  };

  // Step 3 Validation
  const validateStep3 = (): boolean => {
    setErrorMessage(null);
    if (!technologyChoice.firstChoiceDeptId) {
      setErrorMessage('১ম পছন্দের টেকনোলজি নির্বাচন করুন।');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    try {
      setSubmitting(true);
      const submissionDurationMs = Date.now() - formLoadedAtRef.current;
      const deviceFingerprint = generateDeviceFingerprint();

      const newApp = await createAdmissionApplication({
        applicantId: currentUser.uid,
        applicantEmail: currentUser.email,
        applicantPhone: currentUser.phone || personalInfo.guardianPhone || '',
        personalInfo,
        educationalInfo: {
          ...educationalInfo,
          rollNumber: toEnglishDigits(educationalInfo.rollNumber),
          registrationNumber: toEnglishDigits(educationalInfo.registrationNumber),
          gpa: Number(educationalInfo.gpa),
        },
        technologyChoice,
        deviceFingerprint,
        submissionDurationMs,
      });

      onSuccess(newApp);
    } catch (err: any) {
      console.error('Admission submit error:', err);
      setErrorMessage(err?.message || 'আবেদনটি দাখিল করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-bengali">
      {/* ================= STEPPER PROGRESS BAR ================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between">
          {[
            { step: 1, title: 'ব্যক্তিগত তথ্য', icon: User },
            { step: 2, title: 'শিক্ষাগত যোগ্যতা', icon: GraduationCap },
            { step: 3, title: 'টেকনোলজি পছন্দ', icon: Layers },
            { step: 4, title: 'পর্যালোচনা ও জমা', icon: FileCheck },
          ].map((item, idx) => {
            const Icon = item.icon;
            const isCompleted = currentStep > item.step;
            const isCurrent = currentStep === item.step;
            return (
              <React.Fragment key={item.step}>
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20 ring-4 ring-teal-100'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs font-bold mt-1.5 hidden sm:block ${
                      isCurrent
                        ? 'text-teal-800 font-black'
                        : isCompleted
                        ? 'text-emerald-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {item.title}
                  </span>
                </div>

                {idx < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 sm:mx-4 rounded-full transition-all ${
                      currentStep > idx + 1 ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-rose-800 font-bold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ================= STEP 1: PERSONAL INFORMATION ================= */}
      {currentStep === 1 && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
          <div className="pb-3 border-b border-slate-100 flex items-center gap-2.5">
            <User className="w-5 h-5 text-teal-700" />
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                ধাপ ১: ব্যক্তিগত তথ্যাবলি
              </h3>
              <p className="text-xs text-slate-500">
                আবেদনকারীর সঠিক পরিচয় ও যোগাযোগের তথ্যাবলি পূরণ করুন
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                পূর্ণ নাম (বাংলায়) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="applicant-fullname-bangla"
                value={personalInfo.fullNameBangla}
                onChange={(e) =>
                  setPersonalInfo({ ...personalInfo, fullNameBangla: e.target.value })
                }
                placeholder="আপনার পূর্ণ নাম বাংলায় লিখুন"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-teal-700 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                পূর্ণ নাম (ইংরেজিতে বড় হাতের অক্ষরে) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="applicant-fullname-english"
                value={personalInfo.fullNameEnglish}
                onChange={(e) =>
                  setPersonalInfo({ ...personalInfo, fullNameEnglish: e.target.value.toUpperCase() })
                }
                placeholder="আপনার পূর্ণ নাম ইংরেজিতে লিখুন"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium uppercase font-outfit focus:bg-white focus:ring-2 focus:ring-teal-700 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                পিতার নাম <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={personalInfo.fatherName}
                onChange={(e) =>
                  setPersonalInfo({ ...personalInfo, fatherName: e.target.value })
                }
                placeholder="পিতার পূর্ণ নাম লিখুন"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-teal-700 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                মাতার নাম <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={personalInfo.motherName}
                onChange={(e) =>
                  setPersonalInfo({ ...personalInfo, motherName: e.target.value })
                }
                placeholder="মাতার পূর্ণ নাম লিখুন"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-teal-700 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                অভিভাবকের নাম
              </label>
              <input
                type="text"
                value={personalInfo.guardianName}
                onChange={(e) =>
                  setPersonalInfo({ ...personalInfo, guardianName: e.target.value })
                }
                placeholder="অভিভাবকের নাম লিখুন"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-teal-700 outline-none"
              />
            </div>

            {/* Sliding Bottom Sheet Trigger: Guardian Relation */}
            <div>
              <SelectTrigger
                id="select-trigger-guardian-relation"
                label="অভিভাবকের সাথে সম্পর্ক"
                value={personalInfo.guardianRelation || 'পিতা'}
                displayValue={personalInfo.guardianRelation}
                onClick={() => setActiveSheet('GUARDIAN_RELATION')}
                icon={Users}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                অভিভাবকের মোবাইল নম্বর
              </label>
              <input
                type="tel"
                value={personalInfo.guardianPhone}
                onChange={(e) =>
                  setPersonalInfo({ ...personalInfo, guardianPhone: e.target.value })
                }
                placeholder="অভিভাবকের মোবাইল নম্বর লিখুন"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-teal-700 outline-none"
              />
            </div>

            {/* Modern Calendar Trigger: Date of Birth */}
            <div>
              <ModernDateTrigger
                id="applicant-dob-trigger"
                label="জন্মতারিখ"
                required
                value={personalInfo.dateOfBirth}
                onClick={() => setDobPickerOpen(true)}
              />
            </div>

            {/* Sliding Bottom Sheet Trigger: Gender */}
            <div>
              <SelectTrigger
                id="select-trigger-gender"
                label="লিঙ্গ"
                value={personalInfo.gender}
                displayValue={getGenderLabel(personalInfo.gender)}
                onClick={() => setActiveSheet('GENDER')}
                icon={User}
              />
            </div>

            {/* Sliding Bottom Sheet Trigger: Blood Group */}
            <div>
              <SelectTrigger
                id="select-trigger-blood-group"
                label="রক্তের গ্রুপ"
                value={personalInfo.bloodGroup || 'B+'}
                displayValue={personalInfo.bloodGroup}
                onClick={() => setActiveSheet('BLOOD_GROUP')}
                icon={Droplet}
              />
            </div>

            {/* Sliding Bottom Sheet Trigger: Religion */}
            <div>
              <SelectTrigger
                id="select-trigger-religion"
                label="ধর্ম"
                value={personalInfo.religion || 'ইসলাম'}
                displayValue={personalInfo.religion}
                onClick={() => setActiveSheet('RELIGION')}
                icon={ShieldCheck}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">জাতীয়তা</label>
              <input
                type="text"
                value={personalInfo.nationality}
                onChange={(e) =>
                  setPersonalInfo({ ...personalInfo, nationality: e.target.value })
                }
                placeholder="আপনার জাতীয়তা লিখুন"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-teal-700 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                বর্তমান ঠিকানা (গ্রাম/রোড, ডাকঘর, উপজেলা, জেলা){' '}
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={personalInfo.presentAddress}
                onChange={(e) =>
                  setPersonalInfo({ ...personalInfo, presentAddress: e.target.value })
                }
                placeholder="আপনার বর্তমান ঠিকানা লিখুন"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-teal-700 outline-none resize-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                স্থায়ী ঠিকানা <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={personalInfo.permanentAddress}
                onChange={(e) =>
                  setPersonalInfo({ ...personalInfo, permanentAddress: e.target.value })
                }
                placeholder="আপনার স্থায়ী ঠিকানা লিখুন"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-teal-700 outline-none resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 2: EDUCATIONAL QUALIFICATION ================= */}
      {currentStep === 2 && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
          <div className="pb-3 border-b border-slate-100 flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                ধাপ ২: শিক্ষাগত যোগ্যতা
              </h3>
              <p className="text-xs text-slate-500">
                এসএসসি / দাখিল / ভোকেশনাল পরীক্ষার তথ্য ও ফলাফল প্রদান করুন
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sliding Bottom Sheet Trigger: Exam Type */}
            <div>
              <SelectTrigger
                id="select-trigger-exam-type"
                label="পরীক্ষার নাম"
                required
                value={educationalInfo.examType}
                displayValue={getExamTypeLabel(educationalInfo.examType)}
                onClick={() => setActiveSheet('EXAM_TYPE')}
                icon={GraduationCap}
              />
            </div>

            {/* Sliding Bottom Sheet Trigger: Board */}
            <div>
              <SelectTrigger
                id="select-trigger-board"
                label="শিক্ষা বোর্ড"
                required
                value={educationalInfo.board}
                displayValue={educationalInfo.board}
                onClick={() => setActiveSheet('BOARD')}
                icon={Building}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                রোল নম্বর <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="applicant-ssc-roll"
                value={educationalInfo.rollNumber}
                onChange={(e) =>
                  setEducationalInfo({ ...educationalInfo, rollNumber: e.target.value })
                }
                placeholder="আপনার রোল নম্বর লিখুন"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:bg-white focus:ring-2 focus:ring-teal-700 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                রেজিস্ট্রেশন নম্বর <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="applicant-ssc-reg"
                value={educationalInfo.registrationNumber}
                onChange={(e) =>
                  setEducationalInfo({
                    ...educationalInfo,
                    registrationNumber: e.target.value,
                  })
                }
                placeholder="আপনার রেজিস্ট্রেশন নম্বর লিখুন"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:bg-white focus:ring-2 focus:ring-teal-700 outline-none"
              />
            </div>

            {/* Sliding Bottom Sheet Trigger: Passing Year */}
            <div>
              <SelectTrigger
                id="select-trigger-passing-year"
                label="পাসের সাল"
                required
                value={educationalInfo.passingYear}
                displayValue={`${toBanglaDigits(educationalInfo.passingYear)} সাল`}
                onClick={() => setActiveSheet('PASSING_YEAR')}
                icon={Calendar}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                প্রাপ্ত জিপিএ (৫.০০ এর স্কেলে) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="2.00"
                max="5.00"
                id="applicant-ssc-gpa"
                value={educationalInfo.gpa}
                onChange={(e) =>
                  setEducationalInfo({ ...educationalInfo, gpa: parseFloat(e.target.value) })
                }
                placeholder="আপনার প্রাপ্ত জিপিএ লিখুন"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-black focus:bg-white focus:ring-2 focus:ring-teal-700 outline-none text-emerald-800"
              />
            </div>

            {/* Sliding Bottom Sheet Trigger: Group */}
            <div>
              <SelectTrigger
                id="select-trigger-group"
                label="বিভাগ / গ্রুপ"
                value={educationalInfo.group || 'বিজ্ঞান'}
                displayValue={educationalInfo.group}
                onClick={() => setActiveSheet('GROUP')}
                icon={BookOpen}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                পূর্বতন শিক্ষাপ্রতিষ্ঠানের নাম
              </label>
              <input
                type="text"
                value={educationalInfo.instituteName}
                onChange={(e) =>
                  setEducationalInfo({ ...educationalInfo, instituteName: e.target.value })
                }
                placeholder="আপনার পূর্ববর্তী বিদ্যালয় বা মাদ্রাসার নাম লিখুন"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-teal-700 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 3: TECHNOLOGY CHOICES ================= */}
      {currentStep === 3 && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
          <div className="pb-3 border-b border-slate-100 flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-teal-700" />
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                ধাপ ৩: পছন্দের টেকনোলজি নির্বাচন
              </h3>
              <p className="text-xs text-slate-500">
                আপনার অগ্রাধিকার অনুযায়ী টেকনোলজি পছন্দসমূহ ক্রমানুসারে নির্বাচন করুন
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* 1st Choice */}
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200">
              <SelectTrigger
                id="select-trigger-tech-choice-1"
                label="১ম পছন্দ"
                required
                value={technologyChoice.firstChoiceDeptId}
                displayValue={technologyChoice.firstChoiceDeptName}
                onClick={() => setActiveSheet('TECH_CHOICE_1')}
                icon={getDeptIcon(technologyChoice.firstChoiceDeptId)}
              />
            </div>

            {/* 2nd Choice */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <SelectTrigger
                id="select-trigger-tech-choice-2"
                label="২য় পছন্দ"
                value={technologyChoice.secondChoiceDeptId || ''}
                displayValue={technologyChoice.secondChoiceDeptName || 'নির্বাচন করুন (ঐচ্ছিক)'}
                onClick={() => setActiveSheet('TECH_CHOICE_2')}
                icon={technologyChoice.secondChoiceDeptId ? getDeptIcon(technologyChoice.secondChoiceDeptId) : Layers}
              />
            </div>

            {/* 3rd Choice */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <SelectTrigger
                id="select-trigger-tech-choice-3"
                label="৩য় পছন্দ"
                value={technologyChoice.thirdChoiceDeptId || ''}
                displayValue={technologyChoice.thirdChoiceDeptName || 'নির্বাচন করুন (ঐচ্ছিক)'}
                onClick={() => setActiveSheet('TECH_CHOICE_3')}
                icon={technologyChoice.thirdChoiceDeptId ? getDeptIcon(technologyChoice.thirdChoiceDeptId) : Layers}
              />
            </div>

            {/* Shift Authority Notice */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-black text-slate-900 block">
                  শিফট নির্ধারণ সংক্রান্ত তথ্য
                </span>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  ১ম শিফট ও ২য় শিফট নির্ধারণ সম্পূর্ণ প্রতিষ্ঠান কর্তৃপক্ষ কর্তৃক আসন সংখ্যা ও মেধা স্কোরের ভিত্তিতে চূড়ান্তভাবে নির্ধারিত হবে।
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 4: REVIEW & SUBMIT ================= */}
      {currentStep === 4 && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
          <div className="pb-3 border-b border-slate-100 flex items-center gap-2.5">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                ধাপ ৪: চূড়ান্ত পর্যালোচনা ও দাখিল
              </h3>
              <p className="text-xs text-slate-500">
                দাখিল করার পূর্বে আপনার সকল তথ্যাবলি সঠিকভাবে যাচাই করে নিন
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Applicant Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="font-black text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-700" />
                <span>ব্যক্তিগত তথ্য সারসংক্ষেপ</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-400">নাম:</span>{' '}
                  <span className="font-bold">{personalInfo.fullNameBangla}</span> ({personalInfo.fullNameEnglish})
                </div>
                <div>
                  <span className="text-slate-400">পিতা ও মাতা:</span>{' '}
                  <span className="font-bold">{personalInfo.fatherName}</span>, {personalInfo.motherName}
                </div>
                <div>
                  <span className="text-slate-400">মোবাইল:</span>{' '}
                  <span className="font-bold font-mono">{currentUser.phone || personalInfo.guardianPhone}</span>
                </div>
                <div>
                  <span className="text-slate-400">জন্মতারিখ:</span>{' '}
                  <span className="font-bold">{personalInfo.dateOfBirth}</span>
                </div>
              </div>
            </div>

            {/* Educational Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="font-black text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>শিক্ষাগত যোগ্যতা সারসংক্ষেপ</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-400">পরীক্ষা ও বোর্ড:</span>{' '}
                  <span className="font-bold">{educationalInfo.examType} - {educationalInfo.board}</span>
                </div>
                <div>
                  <span className="text-slate-400">রোল ও রেজি:</span>{' '}
                  <span className="font-mono font-bold">{toBanglaDigits(educationalInfo.rollNumber)}</span>, {toBanglaDigits(educationalInfo.registrationNumber)}
                </div>
                <div>
                  <span className="text-slate-400">পাসের সাল:</span>{' '}
                  <span className="font-bold">{toBanglaDigits(educationalInfo.passingYear)}</span>
                </div>
                <div>
                  <span className="text-slate-400">প্রাপ্ত GPA:</span>{' '}
                  <span className="font-black text-emerald-700 font-outfit text-sm">{toBanglaDigits(educationalInfo.gpa.toFixed(2))}</span>
                </div>
              </div>
            </div>

            {/* Choices Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="font-black text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-700" />
                <span>নির্বাচিত টেকনোলজি পছন্দ</span>
              </h4>
              <div className="space-y-1.5 text-slate-800">
                <div>
                  <span className="text-teal-700 font-bold">১ম পছন্দ:</span>{' '}
                  <span className="font-black">{technologyChoice.firstChoiceDeptName}</span>
                </div>
                {technologyChoice.secondChoiceDeptName && (
                  <div>
                    <span className="text-slate-500 font-bold">২য় পছন্দ:</span>{' '}
                    <span>{technologyChoice.secondChoiceDeptName}</span>
                  </div>
                )}
                {technologyChoice.thirdChoiceDeptName && (
                  <div>
                    <span className="text-slate-500 font-bold">৩য় পছন্দ:</span>{' '}
                    <span>{technologyChoice.thirdChoiceDeptName}</span>
                  </div>
                )}
                <div className="text-slate-500 pt-1 text-[11px]">
                  শিফট: কর্তৃপক্ষ কর্তৃক আসন ও মেধার ভিত্তিতে নির্ধারিত হবে।
                </div>
              </div>
            </div>

            {/* Realtime Firestore Security Badge */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
                <span>ফায়ারস্টোর ক্লাউড ভেরিফিকেশন ও ডুপ্লিকেট চেকার সক্রিয়</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-outfit uppercase tracking-wider">
                Firestore Protected
              </span>
            </div>

            {/* Declaration Box */}
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
              <p className="text-xs text-teal-950 leading-relaxed font-medium">
                আমি অঙ্গীকার করছি যে উপরে বর্ণিত সকল তথ্যাবলি সম্পূর্ণ সত্য ও নির্ভুল। ভুল বা অসত্য তথ্য প্রদান করলে কর্তৃপক্ষ আমার আবেদন বাতিল করার অধিকার সংরক্ষণ করেন।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= CONTROLS FOOTER ================= */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {currentStep === 1 ? (
          <button
            type="button"
            onClick={onCancel}
            className="py-3.5 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer text-center"
          >
            বাতিল করুন
          </button>
        ) : (
          <button
            type="button"
            onClick={handleBack}
            className="py-3.5 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>পূর্ববর্তী ধাপ</span>
          </button>
        )}

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={handleNext}
            className="py-3.5 px-7 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            <span>পরবর্তী ধাপ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="py-3.5 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>আবেদনপত্র চূড়ান্তভাবে জমা দিন</span>
          </button>
        )}
      </div>

      {/* ================= MODERN SLIDING BOTTOM SHEETS FOR SELECTIONS ================= */}
      {/* 1. Gender Bottom Sheet */}
      <SelectBottomSheet
        isOpen={activeSheet === 'GENDER'}
        onClose={() => setActiveSheet(null)}
        title="লিঙ্গ নির্বাচন করুন"
        subtitle="আবেদনকারীর লিঙ্গ নির্বাচন করুন"
        options={genderOptions}
        selectedValue={personalInfo.gender}
        onSelect={(val) => {
          setPersonalInfo({ ...personalInfo, gender: val as 'MALE' | 'FEMALE' | 'OTHER' });
        }}
      />

      {/* 2. Blood Group Bottom Sheet */}
      <SelectBottomSheet
        isOpen={activeSheet === 'BLOOD_GROUP'}
        onClose={() => setActiveSheet(null)}
        title="রক্তের গ্রুপ নির্বাচন করুন"
        subtitle="আবেদনকারীর রক্তের গ্রুপ"
        options={bloodGroupOptions}
        selectedValue={personalInfo.bloodGroup}
        onSelect={(val) => {
          setPersonalInfo({ ...personalInfo, bloodGroup: val });
        }}
      />

      {/* 3. Religion Bottom Sheet */}
      <SelectBottomSheet
        isOpen={activeSheet === 'RELIGION'}
        onClose={() => setActiveSheet(null)}
        title="ধর্ম নির্বাচন করুন"
        subtitle="আবেদনকারীর ধর্ম"
        options={religionOptions}
        selectedValue={personalInfo.religion}
        onSelect={(val) => {
          setPersonalInfo({ ...personalInfo, religion: val });
        }}
      />

      {/* 4. Guardian Relation Bottom Sheet */}
      <SelectBottomSheet
        isOpen={activeSheet === 'GUARDIAN_RELATION'}
        onClose={() => setActiveSheet(null)}
        title="অভিভাবকের সাথে সম্পর্ক"
        subtitle="অভিভাবকের সাথে আবেদনকারীর সম্পর্ক নির্বাচন করুন"
        options={guardianRelationOptions}
        selectedValue={personalInfo.guardianRelation}
        onSelect={(val) => {
          setPersonalInfo({ ...personalInfo, guardianRelation: val });
        }}
      />

      {/* 5. Exam Type Bottom Sheet */}
      <SelectBottomSheet
        isOpen={activeSheet === 'EXAM_TYPE'}
        onClose={() => setActiveSheet(null)}
        title="পরীক্ষার ধরন নির্বাচন করুন"
        subtitle="এসএসসি বা সমমান পরীক্ষার ধরন"
        options={examTypeOptions}
        selectedValue={educationalInfo.examType}
        onSelect={(val) => {
          setEducationalInfo({ ...educationalInfo, examType: val as any });
        }}
      />

      {/* 6. Education Board Bottom Sheet */}
      <SelectBottomSheet
        isOpen={activeSheet === 'BOARD'}
        onClose={() => setActiveSheet(null)}
        title="শিক্ষা বোর্ড নির্বাচন করুন"
        subtitle="যে বোর্ড থেকে এসএসসি/সমমান পাস করেছেন"
        options={boardOptions}
        selectedValue={educationalInfo.board}
        searchable={true}
        onSelect={(val) => {
          setEducationalInfo({ ...educationalInfo, board: val });
        }}
      />

      {/* 7. Passing Year Bottom Sheet */}
      <SelectBottomSheet
        isOpen={activeSheet === 'PASSING_YEAR'}
        onClose={() => setActiveSheet(null)}
        title="পাসের সাল নির্বাচন করুন"
        subtitle="এসএসসি/সমমান পাসের বছর"
        options={passingYearOptions}
        selectedValue={educationalInfo.passingYear}
        onSelect={(val) => {
          setEducationalInfo({ ...educationalInfo, passingYear: val });
        }}
      />

      {/* 8. Group Bottom Sheet */}
      <SelectBottomSheet
        isOpen={activeSheet === 'GROUP'}
        onClose={() => setActiveSheet(null)}
        title="বিভাগ / গ্রুপ নির্বাচন করুন"
        subtitle="এসএসসি/সমমান পরীক্ষার বিভাগ"
        options={groupOptions}
        selectedValue={educationalInfo.group}
        onSelect={(val) => {
          setEducationalInfo({ ...educationalInfo, group: val });
        }}
      />

      {/* 9. Technology Choice 1 Bottom Sheet */}
      <SelectBottomSheet
        isOpen={activeSheet === 'TECH_CHOICE_1'}
        onClose={() => setActiveSheet(null)}
        title="১ম পছন্দের টেকনোলজি নির্বাচন করুন"
        subtitle="আপনার সর্বোচ্চ পছন্দের টেকনোলজি বিভাগ"
        options={technologyOptions}
        selectedValue={technologyChoice.firstChoiceDeptId}
        onSelect={(val) => {
          const dept = DEFAULT_DEPARTMENTS.find((d) => d.id === val);
          setTechnologyChoice({
            ...technologyChoice,
            firstChoiceDeptId: val,
            firstChoiceDeptName: dept?.name || val,
          });
        }}
      />

      {/* 10. Technology Choice 2 Bottom Sheet */}
      <SelectBottomSheet
        isOpen={activeSheet === 'TECH_CHOICE_2'}
        onClose={() => setActiveSheet(null)}
        title="২য় পছন্দের টেকনোলজি নির্বাচন করুন"
        subtitle="দ্বিতীয় অগ্রাধিকারপ্রাপ্ত টেকনোলজি (ঐচ্ছিক)"
        options={optionalTechnologyOptions}
        selectedValue={technologyChoice.secondChoiceDeptId || ''}
        onSelect={(val) => {
          const dept = DEFAULT_DEPARTMENTS.find((d) => d.id === val);
          setTechnologyChoice({
            ...technologyChoice,
            secondChoiceDeptId: val,
            secondChoiceDeptName: dept?.name || val,
          });
        }}
      />

      {/* 11. Technology Choice 3 Bottom Sheet */}
      <SelectBottomSheet
        isOpen={activeSheet === 'TECH_CHOICE_3'}
        onClose={() => setActiveSheet(null)}
        title="৩য় পছন্দের টেকনোলজি নির্বাচন করুন"
        subtitle="তৃতীয় অগ্রাধিকারপ্রাপ্ত টেকনোলজি (ঐচ্ছিক)"
        options={optionalTechnologyOptions}
        selectedValue={technologyChoice.thirdChoiceDeptId || ''}
        onSelect={(val) => {
          const dept = DEFAULT_DEPARTMENTS.find((d) => d.id === val);
          setTechnologyChoice({
            ...technologyChoice,
            thirdChoiceDeptId: val,
            thirdChoiceDeptName: dept?.name || val,
          });
        }}
      />

      {/* 12. Modern Date of Birth Calendar Picker */}
      <ModernDatePicker
        isOpen={dobPickerOpen}
        onClose={() => setDobPickerOpen(false)}
        value={personalInfo.dateOfBirth}
        onChange={(newDate) => {
          setPersonalInfo({ ...personalInfo, dateOfBirth: newDate });
        }}
        title="জন্মতারিখ নির্বাচন করুন"
        subtitle="আবেদনকারীর সঠিক জন্মতারিখ নির্ধারণ করুন"
        minYear={1990}
        maxYear={2020}
      />

      <LoadingOverlay
        isVisible={submitting}
        message="ভর্তি আবেদনপত্র জমা দেওয়া হচ্ছে..."
        subtext="আইডি তৈরি ও ডেটাবেজে সংরক্ষণ করা হচ্ছে..."
      />
    </div>
  );
};
