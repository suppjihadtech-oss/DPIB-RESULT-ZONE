import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  User,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  QrCode,
  Lock,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  getAdminSecuritySettings,
  validateAdminCredentials,
  generateTotpEnrollment,
  verifyAndActivateTwoFactor,
  disableAdminTwoFactor,
  changeAdminCredentials,
  AdminSecurityConfig,
} from '../../services/adminAuth';

interface SecurityPageProps {
  onBackToSettings?: () => void;
}

export const SecurityPage: React.FC<SecurityPageProps> = ({ onBackToSettings }) => {
  const [securityConfig, setSecurityConfig] = useState<AdminSecurityConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Active Tab: '2fa' | 'password'
  const [activeTab, setActiveTab] = useState<'2fa' | 'password'>('2fa');

  // Global feedback alerts
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // -------------------------------------------------------------
  // 2FA SETUP WIZARD STATES
  // Steps: 1 (Verify Admin Identity) -> 2 (Scan QR & Enter Code) -> 3 (Complete)
  // -------------------------------------------------------------
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [verifyUsername, setVerifyUsername] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [wizardLoading, setWizardLoading] = useState(false);

  // Generated TOTP Enrollment data
  const [totpSecret, setTotpSecret] = useState<string>('');
  const [totpUri, setTotpUri] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  // User input verification code
  const [authCode, setAuthCode] = useState('');

  // -------------------------------------------------------------
  // 2FA DISABLE MODAL / FORM STATES
  // -------------------------------------------------------------
  const [isDisabling, setIsDisabling] = useState(false);
  const [disableUsername, setDisableUsername] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisablePassword, setShowDisablePassword] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);

  // -------------------------------------------------------------
  // PASSWORD & USERNAME CHANGE STATES
  // -------------------------------------------------------------
  const [currentUsername, setCurrentUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  // Load current security configuration
  const loadConfig = async () => {
    try {
      setLoadingConfig(true);
      const data = await getAdminSecuritySettings();
      setSecurityConfig(data);
      setVerifyUsername(data.username);
      setDisableUsername(data.username);
      setCurrentUsername(data.username);
      setNewUsername(data.username);
    } catch (err) {
      console.error('Failed to load admin security config:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Step 1: Submit Identity Verification to Begin 2FA Setup
  const handleVerifyIdentityFor2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!verifyUsername.trim() || !verifyPassword.trim()) {
      setErrorMsg('অনুগ্রহ করে বর্তমান ইউজারনেম এবং পাসওয়ার্ড উভয়ই প্রদান করুন।');
      return;
    }

    setWizardLoading(true);
    try {
      const res = await validateAdminCredentials(verifyUsername, verifyPassword);
      if (!res.success) {
        setErrorMsg(res.error || 'ইউজারনেম অথবা পাসওয়ার্ড সঠিক নয়।');
        setWizardLoading(false);
        return;
      }

      // Identity verified! Generate TOTP Secret & QR Code
      const enrollment = await generateTotpEnrollment(res.activeUsername || verifyUsername);
      setTotpSecret(enrollment.secret);
      setTotpUri(enrollment.uri);

      // Generate QR Code image
      const qrImage = await QRCode.toDataURL(enrollment.uri, {
        width: 240,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      setQrDataUrl(qrImage);

      setWizardStep(2);
      setSuccessMsg('পরিচয় সফলভাবে নিশ্চিত হয়েছে। নিচের QR কোডটি Authenticator অ্যাপ দিয়ে স্ক্যান করুন।');
    } catch (err: any) {
      setErrorMsg('২-ধাপ নিরাপত্তা কনফিগারেশন তৈরিতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setWizardLoading(false);
    }
  };

  // Step 2: Verify TOTP Code and Activate 2FA
  const handleActivate2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanCode = authCode.replace(/\D/g, '').trim();
    if (cleanCode.length !== 6) {
      setErrorMsg('অনুগ্রহ করে Authenticator অ্যাপ থেকে ৬-সংখ্যার কোড লিখুন।');
      return;
    }

    setWizardLoading(true);
    try {
      const res = await verifyAndActivateTwoFactor(totpSecret, cleanCode);
      if (res.success) {
        setSuccessMsg(res.message);
        setWizardStep(3);
        await loadConfig();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg('২-ধাপ নিরাপত্তা সক্রিয় করতে ত্রুটি হয়েছে: ' + err.message);
    } finally {
      setWizardLoading(false);
    }
  };

  // Handle Disabling 2FA
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!disableUsername.trim() || !disablePassword.trim()) {
      setErrorMsg('ইউজারনেম এবং বর্তমান পাসওয়ার্ড প্রদান করা আবশ্যক।');
      return;
    }

    setDisableLoading(true);
    try {
      const res = await disableAdminTwoFactor(disableUsername, disablePassword);
      if (res.success) {
        setSuccessMsg(res.message);
        setIsDisabling(false);
        setDisablePassword('');
        setWizardStep(1);
        setAuthCode('');
        await loadConfig();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg('২-ধাপ নিরাপত্তা বন্ধ করতে সমস্যা: ' + err.message);
    } finally {
      setDisableLoading(false);
    }
  };

  // Handle Changing Admin Password / Username
  const handleChangeCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentUsername.trim() || !currentPassword.trim()) {
      setErrorMsg('বর্তমান ইউজারনেম এবং বর্তমান পাসওয়ার্ড প্রদান করা আবশ্যক।');
      return;
    }

    if (!newUsername.trim()) {
      setErrorMsg('নতুন ইউজারনেম ফাঁকা রাখা যাবে না।');
      return;
    }

    if (!newPassword.trim()) {
      setErrorMsg('নতুন পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মেলেনি।');
      return;
    }

    setPassLoading(true);
    try {
      const res = await changeAdminCredentials({
        currentUsername,
        currentPassword,
        newUsername,
        newPassword,
        confirmNewPassword: confirmPassword,
      });

      if (res.success) {
        setSuccessMsg(res.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        await loadConfig();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg('লগইন তথ্য পরিবর্তনে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setPassLoading(false);
    }
  };

  // Copy secret key helper
  const handleCopySecret = () => {
    if (!totpSecret) return;
    navigator.clipboard.writeText(totpSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-bengali">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200/60 text-teal-800 text-[10px] font-black uppercase tracking-wider font-outfit">
              SECURITY & ACCESS CONTROL
            </span>
            <span className="text-xs text-slate-400 font-bold">•</span>
            <span className="text-xs text-slate-500 font-bold font-outfit">
              ADMINISTRATOR HUB
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-teal-700 shrink-0" />
            <span>নিরাপত্তা ও অ্যাক্সেস কন্ট্রোল</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            অ্যাডমিন পাসওয়ার্ড পরিবর্তন এবং Authenticator অ্যাপের মাধ্যমে দুই ধাপের নিরাপত্তা (2FA) পরিচালনা করুন।
          </p>
        </div>

        {/* Action / Refresh */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadConfig}
            disabled={loadingConfig}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingConfig ? 'animate-spin' : ''}`} />
            <span>রিফ্রেশ</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs sm:text-sm font-semibold text-rose-800 flex items-start space-x-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <span className="leading-snug">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm font-semibold text-emerald-800 flex items-start space-x-3 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
          <span className="leading-snug">{successMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab('2fa');
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === '2fa'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>দুই ধাপের নিরাপত্তা (2FA / MFA)</span>
          {securityConfig?.twoFactorEnabled ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500 text-white uppercase font-outfit">
              ACTIVE
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-200 text-slate-700 uppercase font-outfit">
              OFF
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('password');
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'password'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>পাসওয়ার্ড ও ইউজারনেম পরিবর্তন</span>
        </button>
      </div>

      {/* TAB 1: TWO-FACTOR AUTHENTICATION (TOTP MFA) */}
      {activeTab === '2fa' && (
        <div className="space-y-6">
          {/* Status Overview Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    securityConfig?.twoFactorEnabled
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-amber-50 text-amber-600 border border-amber-200'
                  }`}
                >
                  {securityConfig?.twoFactorEnabled ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : (
                    <ShieldAlert className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      দ্বি-স্তরীয় প্রমাণীকরণ (TOTP Authenticator)
                    </h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black font-outfit uppercase ${
                        securityConfig?.twoFactorEnabled
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {securityConfig?.twoFactorEnabled ? 'সক্রিয় (ENABLED)' : 'নিষ্ক্রিয় (DISABLED)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    {securityConfig?.twoFactorEnabled
                      ? 'আপনার অ্যাকাউন্টে Authenticator অ্যাপের মাধ্যমে ৬-ডিজিট TOTP কোড বাধ্যতামূলক রয়েছে। লগইনের সময় পাসওয়ার্ডের সাথে কোডটি দিতে হবে।'
                      : '২-ধাপ নিরাপত্তা সক্রিয় করলে পাসওয়ার্ড চুরি হলেও কেউ Authenticator কোড ছাড়া অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করতে পারবে না।'}
                  </p>
                </div>
              </div>

              {/* Status Action Buttons */}
              {securityConfig?.twoFactorEnabled && (
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsDisabling(!isDisabling)}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {isDisabling ? 'বাতিল করুন' : 'নিরাপত্তা বন্ধ করুন (Disable)'}
                  </button>
                </div>
              )}
            </div>

            {/* Disable 2FA Verification Form */}
            {securityConfig?.twoFactorEnabled && isDisabling && (
              <div className="mt-6 pt-5 border-t border-slate-100 bg-rose-50/40 p-5 rounded-2xl border border-rose-100">
                <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>২-ধাপ নিরাপত্তা বন্ধ করার জন্য পরিচয় নিশ্চিত করুন</span>
                </h3>
                <p className="text-xs text-slate-600 mb-4">
                  নিরাপত্তা বজায় রাখতে আপনার বর্তমান ইউজারনেম ও পাসওয়ার্ড প্রদান করুন।
                </p>

                <form onSubmit={handleDisable2FA} className="space-y-3.5 max-w-md">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      ইউজারনেম (USERNAME)
                    </label>
                    <input
                      type="text"
                      value={disableUsername}
                      onChange={(e) => setDisableUsername(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 outline-none font-outfit"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      বর্তমান পাসওয়ার্ড (PASSWORD)
                    </label>
                    <div className="relative">
                      <input
                        type={showDisablePassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={disablePassword}
                        onChange={(e) => setDisablePassword(e.target.value)}
                        required
                        className="w-full px-3.5 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 outline-none font-outfit"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDisablePassword(!showDisablePassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                      >
                        {showDisablePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={disableLoading}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {disableLoading ? 'যাচাই করা হচ্ছে...' : 'নিশ্চিত ও ২-ধাপ নিরাপত্তা বন্ধ করুন'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDisabling(false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      বাতিল
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Setup 2FA Wizard (When Disabled or Re-enrolling) */}
          {!securityConfig?.twoFactorEnabled && (
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
              {/* Wizard Steps Progress Indicator */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black font-outfit ${
                      wizardStep >= 1 ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    1
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">ধাপ ১: পরিচয় যাচাই</p>
                    <p className="text-[10px] text-slate-400 font-outfit">VERIFY ADMIN</p>
                  </div>
                </div>

                <div className="w-12 h-0.5 bg-slate-200" />

                <div className="flex items-center space-x-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black font-outfit ${
                      wizardStep >= 2 ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    2
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">ধাপ ২: QR কোড স্ক্যান</p>
                    <p className="text-[10px] text-slate-400 font-outfit">SCAN QR & CODE</p>
                  </div>
                </div>

                <div className="w-12 h-0.5 bg-slate-200" />

                <div className="flex items-center space-x-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black font-outfit ${
                      wizardStep === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    3
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">ধাপ ৩: সম্পন্ন</p>
                    <p className="text-[10px] text-slate-400 font-outfit">2FA ACTIVE</p>
                  </div>
                </div>
              </div>

              {/* STEP 1: VERIFY DYNAMIC USERNAME & ADMIN PASSWORD */}
              {wizardStep === 1 && (
                <div className="max-w-lg space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-900">
                      অ্যাডমিন ক্রেডেনশিয়াল নিশ্চিত করুন
                    </h3>
                    <p className="text-xs text-slate-500">
                      নিরাপত্তা সেটআপ শুরু করার জন্য বর্তমান অ্যাডমিন ইউজারনেম এবং পাসওয়ার্ড প্রদান করুন।
                    </p>
                  </div>

                  <form onSubmit={handleVerifyIdentityFor2FA} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        ইউজারনেম (USERNAME) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={verifyUsername}
                          onChange={(e) => setVerifyUsername(e.target.value)}
                          required
                          placeholder="আপনার ইউজারনেম লিখুন"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10 outline-none font-outfit transition-all"
                        />
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        বর্তমান পাসওয়ার্ড (CURRENT PASSWORD) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showVerifyPassword ? 'text' : 'password'}
                          value={verifyPassword}
                          onChange={(e) => setVerifyPassword(e.target.value)}
                          required
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10 outline-none font-outfit transition-all"
                        />
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <button
                          type="button"
                          onClick={() => setShowVerifyPassword(!showVerifyPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                        >
                          {showVerifyPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={wizardLoading}
                      className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      <span>{wizardLoading ? 'যাচাই করা হচ্ছে...' : 'পরবর্তী ধাপ (QR কোড জেনারেট করুন)'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* STEP 2: DISPLAY QR CODE & VERIFY AUTH CODE */}
              {wizardStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    {/* Left: QR Code Card */}
                    <div className="md:col-span-5 bg-slate-50 border border-slate-200/90 rounded-2xl p-5 text-center space-y-3">
                      <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-teal-100/80 text-teal-800 text-[10px] font-black uppercase font-outfit">
                        <QrCode className="w-3.5 h-3.5" />
                        <span>SCAN WITH AUTHENTICATOR</span>
                      </div>

                      {/* Rendered QR Image */}
                      {qrDataUrl ? (
                        <div className="p-2 bg-white rounded-2xl inline-block border border-slate-200/80 shadow-xs mx-auto">
                          <img
                            src={qrDataUrl}
                            alt="2FA QR Code"
                            className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto"
                          />
                        </div>
                      ) : (
                        <div className="w-48 h-48 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                          <span className="text-xs text-slate-500">QR কোড প্রস্তুত হচ্ছে...</span>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-600 font-medium">
                        Google Authenticator বা Microsoft Authenticator অ্যাপ দিয়ে স্ক্যান করুন
                      </p>
                    </div>

                    {/* Right: Secret Key & Verification Form */}
                    <div className="md:col-span-7 space-y-4">
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          ক্যামেরা স্ক্যান না হলে ম্যানুয়াল সিক্রেট কী ব্যবহার করুন:
                        </span>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono font-black text-teal-900 tracking-wider select-all break-all">
                            {totpSecret}
                          </code>
                          <button
                            type="button"
                            onClick={handleCopySecret}
                            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1"
                          >
                            {copiedSecret ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 text-[11px]">কপি হয়েছে</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-600" />
                                <span className="text-[11px]">কপি</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          অ্যাকাউন্টের নাম: <span className="font-outfit font-bold text-slate-700">{securityConfig?.username || verifyUsername}</span> • ইস্যুকারী: <span className="font-outfit font-bold text-slate-700">DPIB Academic Office</span>
                        </p>
                      </div>

                      {/* Verification Code Form */}
                      <form onSubmit={handleActivate2FA} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700 uppercase">
                            Authenticator অ্যাপে দেখানো ৬-সংখ্যার কোড লিখুন <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            autoFocus
                            placeholder="••••••"
                            value={authCode}
                            onChange={(e) => setAuthCode(e.target.value.replace(/\D/g, ''))}
                            required
                            className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100/70 border-2 border-teal-600/40 rounded-2xl text-xl font-black text-center tracking-[0.4em] text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10 outline-none font-mono transition-all"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="submit"
                            disabled={wizardLoading || authCode.length !== 6}
                            className="flex-1 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>{wizardLoading ? 'যাচাই করা হচ্ছে...' : 'কোড যাচাই ও ২-ধাপ নিরাপত্তা সক্রিয় করুন'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setWizardStep(1)}
                            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs cursor-pointer"
                          >
                            পেছনে
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: SUCCESS CONFIRMATION */}
              {wizardStep === 3 && (
                <div className="p-6 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-center space-y-3">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto border border-emerald-300">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-black text-emerald-900">
                    দুই ধাপের নিরাপত্তা সফলভাবে সক্রিয় হয়েছে!
                  </h3>
                  <p className="text-xs text-emerald-700 max-w-md mx-auto leading-relaxed">
                    পরবর্তী প্রতিটি লগইনে আপনার ইউজারনেম ও পাসওয়ার্ড প্রদানের পর Authenticator অ্যাপ থেকে ৬-ডিজিট নিরাপত্তা কোড প্রদান করতে হবে।
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setWizardStep(1);
                      setAuthCode('');
                    }}
                    className="mt-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    নিরাপত্তা সেটিংস সারসংক্ষেপ দেখুন
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CHANGE PASSWORD & USERNAME */}
      {activeTab === 'password' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs max-w-2xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-teal-700" />
              <span>অ্যাডমিন ইউজারনেম ও পাসওয়ার্ড পরিবর্তন</span>
            </h2>
            <p className="text-xs text-slate-500">
              নিরাপত্তা জোরদার রাখতে নির্দিষ্ট সময় পর পর নতুন জটিল পাসওয়ার্ড ব্যবহার করুন।
            </p>
          </div>

          <form onSubmit={handleChangeCredentials} className="space-y-4">
            {/* Section 1: Verify Current Access */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                ১. বর্তমান পরিচয় যাচাই
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    বর্তমান ইউজারনেম <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={currentUsername}
                    onChange={(e) => setCurrentUsername(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 outline-none font-outfit"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    বর্তমান পাসওয়ার্ড <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 outline-none font-outfit"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    >
                      {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Set New Access */}
            <div className="p-4 bg-teal-50/40 border border-teal-100 rounded-2xl space-y-3">
              <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                ২. নতুন ইউজারনেম ও পাসওয়ার্ড
              </span>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  নতুন ইউজারনেম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  placeholder="আপনার নতুন ইউজারনেম লিখুন"
                  className="w-full px-3.5 py-2.5 bg-white border border-teal-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 outline-none font-outfit"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    নতুন পাসওয়ার্ড <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="কমপক্ষে ৬ অক্ষর"
                      className="w-full px-3.5 pr-10 py-2.5 bg-white border border-teal-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 outline-none font-outfit"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    নতুন পাসওয়ার্ড নিশ্চিতকরণ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="পুনরায় লিখুন"
                      className="w-full px-3.5 pr-10 py-2.5 bg-white border border-teal-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 outline-none font-outfit"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={passLoading}
              className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{passLoading ? 'সংরক্ষণ করা হচ্ছে...' : 'নতুন পাসওয়ার্ড ও ইউজারনেম সংরক্ষণ করুন'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
