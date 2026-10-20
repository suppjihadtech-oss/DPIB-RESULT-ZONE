import React, { useState } from 'react';
import {
  Lock,
  User,
  KeyRound,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  LogIn,
  Smartphone,
} from 'lucide-react';
import {
  verifyAdminLogin,
  verifyAdminTwoFactor,
} from '../../services/adminAuth';

interface AdminLoginProps {
  onSuccess: (customSession?: { email: string; displayName: string }) => void;
  onBackToPublic: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onBackToPublic }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Two Factor Authentication State
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [mfaUsername, setMfaUsername] = useState<string>('');
  const [mfaOtp, setMfaOtp] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMsg('অনুগ্রহ করে ইউজারনেম এবং পাসওয়ার্ড উভয়ই প্রদান করুন।');
      return;
    }

    setLoading(true);

    try {
      const result = await verifyAdminLogin(cleanUser, cleanPass);

      if (result.requireTwoFactor) {
        setIsMfaStep(true);
        setMfaUsername(result.username || cleanUser);
        setSuccessMsg('দ্বি-স্তরীয় নিরাপত্তা সক্রিয় রয়েছে। আপনার Authenticator অ্যাপের কোডটি দিন।');
      } else if (result.success && result.session) {
        setSuccessMsg('সফলভাবে লগইন হয়েছে! অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...');
        setTimeout(() => {
          onSuccess({
            email: `${result.session?.username.toLowerCase()}@dpib.edu.bd`,
            displayName: `DPIB Admin (${result.session?.username})`,
          });
        }, 500);
      } else {
        setErrorMsg(result.error || 'ইউজারনেম অথবা পাসওয়ার্ড সঠিক নয়।');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg('লগইন প্রক্রিয়াকরণে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanOtp = mfaOtp.replace(/\D/g, '').trim();
    if (cleanOtp.length !== 6) {
      setErrorMsg('অনুগ্রহ করে ৬-সংখ্যার সঠিক নিরাপত্তা কোড প্রদান করুন।');
      return;
    }

    setLoading(true);

    try {
      const res = await verifyAdminTwoFactor(cleanOtp);
      if (res.success && res.session) {
        setSuccessMsg('দ্বি-স্তরীয় নিরাপত্তা সফলভাবে যাচাই হয়েছে! প্রবেশ করা হচ্ছে...');
        setTimeout(() => {
          onSuccess({
            email: `${res.session?.username.toLowerCase()}@dpib.edu.bd`,
            displayName: `DPIB Admin (${res.session?.username})`,
          });
        }, 500);
      } else {
        setErrorMsg(res.error || 'নিরাপত্তা কোডটি সঠিক নয়। Authenticator অ্যাপে দেখানো বর্তমান কোডটি দিন।');
      }
    } catch (err: any) {
      setErrorMsg('যাচাইকরণে ত্রুটি হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col justify-center items-center px-4 py-12 selection:bg-teal-700 selection:text-white font-bengali">
      {/* Decorative Light Background Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute top-12 right-12 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Main Centered Login Card */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-slate-200/60 relative z-10 transition-all">
        {/* Back to Public Portal Button */}
        <button
          id="btn-back-to-public-portal"
          type="button"
          onClick={() => {
            if (isMfaStep) {
              setIsMfaStep(false);
              setErrorMsg(null);
              setSuccessMsg(null);
              setMfaOtp('');
            } else {
              onBackToPublic();
            }
          }}
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>{isMfaStep ? 'ইউজারনেম ও পাসওয়ার্ডে ফিরুন' : 'পাবলিক পোর্টালে ফিরে যান'}</span>
        </button>

        {/* Institution Brand & Header */}
        <div className="text-center mb-8">
          <div className="relative w-20 h-20 rounded-3xl bg-slate-50 border border-slate-200/80 p-1 mx-auto mb-4 flex items-center justify-center shadow-xs">
            <img
              src="https://i.postimg.cc/mgyW32Y2/Firefly-Remove-Background.png"
              alt="DPIB Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-teal-50 border border-teal-200/80 rounded-full text-teal-800 text-[11px] font-black tracking-widest font-outfit uppercase mb-2 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
            <span>{isMfaStep ? 'TWO-STEP VERIFICATION' : 'ADMIN LOGIN ONLY'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-outfit">
            DPIB <span className="text-teal-700">RESULT ZONE</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {isMfaStep
              ? 'নিরাপত্তা নিশ্চিত করতে Authenticator অ্যাপের কোড প্রদান করুন'
              : 'পরীক্ষা ও ফলাফল ব্যবস্থাপনার জন্য অ্যাডমিন লগইন করুন'}
          </p>
        </div>

        {/* Alert Notifications */}
        {errorMsg && (
          <div
            id="admin-login-error"
            className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs sm:text-sm font-semibold text-rose-800 flex items-start space-x-3 shadow-2xs animate-shake"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="space-y-1">
              <span className="leading-snug block">{errorMsg}</span>
            </div>
          </div>
        )}

        {successMsg && (
          <div
            id="admin-login-success"
            className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm font-semibold text-emerald-800 flex items-start space-x-3 shadow-2xs"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
            <span className="leading-snug">{successMsg}</span>
          </div>
        )}

        {/* Step 1: Standard Username + Password Form */}
        {!isMfaStep && (
          <form onSubmit={handleSubmit} className="space-y-4.5">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                ইউজারনেম (USERNAME) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-admin-username"
                  type="text"
                  placeholder="আপনার ইউজারনেম দিন"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10 outline-none transition-all font-outfit"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  পাসওয়ার্ড (PASSWORD) <span className="text-rose-500">*</span>
                </label>
              </div>
              <div className="relative">
                <input
                  id="input-admin-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-11 pr-11 py-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10 outline-none transition-all font-outfit"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="btn-admin-submit-login"
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3.5 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-extrabold rounded-2xl text-sm transition-all shadow-md shadow-teal-700/20 active:scale-98 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer font-outfit tracking-wider"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'যাচাই করা হচ্ছে...' : 'লগইন করুন (LOGIN)'}</span>
            </button>
          </form>
        )}

        {/* Step 2: Two-Factor Authentication Authenticator OTP Form */}
        {isMfaStep && (
          <form onSubmit={handleMfaSubmit} className="space-y-4.5">
            <div className="bg-teal-50/70 border border-teal-100 rounded-2xl p-4 text-center space-y-1.5">
              <Smartphone className="w-7 h-7 text-teal-700 mx-auto" />
              <p className="text-xs font-bold text-slate-800">
                অ্যাডমিন ইউজার: <span className="font-mono text-teal-800 font-black">{mfaUsername}</span>
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                আপনার মোবাইল <span className="font-semibold text-slate-800">Authenticator অ্যাপ</span> (Google Authenticator / Microsoft Authenticator) থেকে বর্তমান ৬-সংখ্যার কোডটি লিখুন
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider text-center">
                ৬-ডিজিট নিরাপত্তা কোড (AUTHENTICATOR CODE) <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-admin-mfa-otp"
                type="text"
                maxLength={6}
                autoFocus
                placeholder="••••••"
                value={mfaOtp}
                onChange={(e) => setMfaOtp(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full py-3.5 px-4 bg-slate-50 hover:bg-slate-100/70 border-2 border-teal-600/40 rounded-2xl text-2xl font-black text-center tracking-[0.5em] text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10 outline-none transition-all font-mono"
              />
            </div>

            <button
              id="btn-admin-submit-mfa"
              type="submit"
              disabled={loading || mfaOtp.length !== 6}
              className="w-full mt-3 py-3.5 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-extrabold rounded-2xl text-sm transition-all shadow-md shadow-teal-700/20 active:scale-98 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer font-outfit tracking-wider"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'যাচাই করা হচ্ছে...' : 'কোড যাচাই ও প্রবেশ করুন'}</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsMfaStep(false);
                  setErrorMsg(null);
                  setMfaOtp('');
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                লগইন ফর্মে ফিরে যান
              </button>
            </div>
          </form>
        )}

        {/* Security & Access Info Footer */}
        <div className="mt-8 pt-5 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>শুধুমাত্র অনুমোদিত ইনস্টিটিউট নিয়ন্ত্রকগণের জন্য সংরক্ষিত</span>
          </p>
        </div>
      </div>
    </div>
  );
};


