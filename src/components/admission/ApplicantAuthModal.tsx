import React, { useState, useEffect } from 'react';
import {
  LogIn,
  UserPlus,
  Lock,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Eye,
  EyeOff,
  Headphones,
} from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import {
  registerApplicant,
  loginApplicant,
  normalizePhoneNumber,
  subscribeAdmissionSettings,
  DEFAULT_ADMISSION_SETTINGS,
  parsePhoneNumbers,
} from '../../services/admissionService';
import { ApplicantUser, AdmissionSettings } from '../../types';
import { LoadingOverlay } from '../common/LoadingOverlay';
import { toEnglishDigits } from '../../utils/bangla';

interface ApplicantAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: ApplicantUser) => void;
  initialMode?: 'LOGIN' | 'REGISTER';
}

export const ApplicantAuthModal: React.FC<ApplicantAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'LOGIN',
}) => {
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>(initialMode);
  const [isHelpView, setIsHelpView] = useState(false);
  const [admissionSettings, setAdmissionSettings] = useState<AdmissionSettings>(DEFAULT_ADMISSION_SETTINGS);

  useEffect(() => {
    const unsub = subscribeAdmissionSettings((settings) => {
      setAdmissionSettings(settings);
    });
    return () => unsub();
  }, []);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsHelpView(false);
  };

  const handleTabSwitch = (tab: 'LOGIN' | 'REGISTER') => {
    setActiveTab(tab);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsHelpView(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanPhone = normalizePhoneNumber(phone);
    if (!cleanPhone || cleanPhone.length < 11) {
      setErrorMessage('সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন।');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('অনুগ্রহ করে পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    try {
      setLoading(true);
      const user = await loginApplicant({ phone: cleanPhone, password });
      setSuccessMessage('লগইন সফল হয়েছে! প্রোফাইলে নিয়ে যাওয়া হচ্ছে...');
      setTimeout(() => {
        resetForm();
        onSuccess(user);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Applicant login failed:', err);
      const msg = err?.message || '';
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        setErrorMessage('ভুল মোবাইল নম্বর বা পাসওয়ার্ড প্রদান করা হয়েছে। অনুগ্রহ করে যাচাই করে পুনরায় চেষ্টা করুন।');
      } else if (msg) {
        setErrorMessage(msg);
      } else {
        setErrorMessage('লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে নম্বর ও পাসওয়ার্ড যাচাই করে পুনরায় চেষ্টা করুন।');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = name.trim();
    const cleanPhone = normalizePhoneNumber(phone);

    if (!cleanName) {
      setErrorMessage('আবেদনকারীর পূর্ণ নাম লিখুন।');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 11) {
      setErrorMessage('সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন।');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মেলেনি।');
      return;
    }

    try {
      setLoading(true);
      const user = await registerApplicant({
        name: cleanName,
        phone: cleanPhone,
        password,
      });
      setSuccessMessage('নিবন্ধন সফল হয়েছে! আপনার আবেদনকারী প্রোফাইল তৈরি হয়েছে।');
      setTimeout(() => {
        resetForm();
        onSuccess(user);
        onClose();
      }, 900);
    } catch (err: any) {
      console.error('Applicant registration failed:', err);
      if (err.code === 'auth/email-already-in-use' || err.message?.includes('already-in-use')) {
        setErrorMessage('এই মোবাইল নম্বরটি দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে। অনুগ্রহ করে লগইন করুন।');
      } else if (err.code === 'auth/weak-password') {
        setErrorMessage('পাসওয়ার্ডটি তুলনামূলক দুর্বল। কমপক্ষে ৬ অক্ষরের শক্তিশালী পাসওয়ার্ড দিন।');
      } else {
        setErrorMessage(err.message || 'নিবন্ধন সম্পন্ন করা সম্ভব হয়নি। আবার চেষ্টা করুন।');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={() => {
          resetForm();
          onClose();
        }}
        title="ভর্তি আবেদনকারী পোর্টাল"
        subtitle="মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে লগইন অথবা নতুন নিবন্ধন করুন"
        maxHeight="max-h-[92vh]"
      >
        <div className="space-y-5 pb-6 font-bengali">
          {/* Top Auth Banner */}
          <div className="p-4 rounded-2xl bg-blue-50/75 backdrop-blur-md border border-blue-200/70 flex items-start gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs text-blue-950 leading-relaxed font-medium">
              ভর্তি আবেদন দাখিল, পছন্দের টেকনোলজি নির্বাচন এবং কর্তৃপক্ষের দিকনির্দেশনা ও ফলাফল ট্র্যাকিংয়ের জন্য ব্যক্তিগত প্রোফাইল ব্যবহার করুন।
            </div>
          </div>

          {/* Tab Selector Buttons */}
          {!isHelpView && (
            <div className="flex p-1 bg-slate-100/80 backdrop-blur-md rounded-2xl border border-slate-200/70">
              <button
                type="button"
                id="applicant-tab-login"
                onClick={() => handleTabSwitch('LOGIN')}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'LOGIN'
                    ? 'bg-white text-blue-800 shadow-xs border border-white/90 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>লগইন করুন</span>
              </button>
              <button
                type="button"
                id="applicant-tab-register"
                onClick={() => handleTabSwitch('REGISTER')}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'REGISTER'
                    ? 'bg-white text-blue-800 shadow-xs border border-white/90 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>নতুন নিবন্ধন</span>
              </button>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-rose-800 font-bold">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              {errorMessage.includes('নতুন নিবন্ধন') && activeTab === 'LOGIN' && (
                <button
                  type="button"
                  onClick={() => handleTabSwitch('REGISTER')}
                  className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-[11px] font-bold transition-all self-start sm:self-auto cursor-pointer"
                >
                  নিবন্ধন করুন
                </button>
              )}
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ================= HELP / ASSISTANCE VIEW ================= */}
          {isHelpView ? (
            <div className="space-y-4 py-2">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-blue-700 border border-sky-200 flex items-center justify-center mx-auto mb-2">
                  <Headphones className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-900">ভর্তি সহায়তা ও হেল্পডেস্ক</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  পাসওয়ার্ড ভুলে গেলে বা অ্যাকাউন্টে প্রবেশে সমস্যা হলে সরাসরি ইনস্টিটিউট এডমিশন হেল্পডেস্কে যোগাযোগ করুন।
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                <div className="py-1 border-b border-slate-200/60 space-y-1.5">
                  <span className="font-bold text-slate-600 block">ভর্তি হটলাইন নম্বর:</span>
                  <div className="flex flex-wrap gap-2">
                    {parsePhoneNumbers(admissionSettings.contactPhone).map((phone, idx) => (
                      <a
                        key={idx}
                        href={`tel:${toEnglishDigits(phone).replace(/[^0-9+]/g, '')}`}
                        className="font-mono font-black text-blue-800 hover:text-blue-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3 h-3 text-blue-700" />
                        <span>{phone}</span>
                      </a>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="font-bold text-slate-600">অফিস সময়:</span>
                  <span className="font-bold text-slate-800">{admissionSettings.helplineHours || 'সকাল ০৯:০০ - বিকাল ০৫:০০'}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="font-bold text-slate-600">হেল্পডেস্ক অবস্থান:</span>
                  <span className="font-bold text-slate-800">প্রশাসনিক ভবন</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsHelpView(false)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  লগইনে ফিরে যান
                </button>
              </div>
            </div>
          ) : activeTab === 'LOGIN' ? (
            /* ================= LOGIN FORM ================= */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  মোবাইল নম্বর <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    id="applicant-login-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="আপনার ১১ ডিজিটের মোবাইল নম্বর লিখুন"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    পাসওয়ার্ড <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsHelpView(true);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 cursor-pointer flex items-center gap-1"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>সহায়তা প্রয়োজন?</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="applicant-login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="আপনার অ্যাকাউন্টের পাসওয়ার্ড লিখুন"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="applicant-login-submit-btn"
                disabled={loading}
                className="w-full py-3 bg-blue-700 hover:bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-700/20 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer mt-2"
              >
                <LogIn className="w-4 h-4" />
                <span>লগইন করুন ও প্রবেশ করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* ================= REGISTRATION FORM ================= */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  আবেদনকারীর পূর্ণ নাম <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="applicant-reg-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="আপনার পূর্ণ নাম লিখুন"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মোবাইল নম্বর <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    id="applicant-reg-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="আপনার ১১ ডিজিটের মোবাইল নম্বর লিখুন"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="applicant-reg-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড লিখুন"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পাসওয়ার্ড নিশ্চিত করুন <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="applicant-reg-confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="পাসওয়ার্ড পুনরায় লিখুন"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                id="applicant-reg-submit-btn"
                disabled={loading}
                className="w-full py-3 bg-blue-700 hover:bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-700/20 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer mt-3"
              >
                <UserPlus className="w-4 h-4" />
                <span>নিবন্ধন সম্পন্ন করুন ও প্রোফাইলে যান</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </BottomSheet>

      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={loading}
        message="তথ্য যাচাই ও প্রক্রিয়াকরণ করা হচ্ছে..."
        subtext="অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন..."
      />
    </>
  );
};
