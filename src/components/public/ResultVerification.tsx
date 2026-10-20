import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, CheckCircle2, XCircle, FileText, ArrowRight, User, CreditCard, Sparkles } from 'lucide-react';
import { verifyResultByCode } from '../../services/db';
import { StudentResult } from '../../types';
import { toBanglaDigits, toBanglaNumber, formatBanglaDate, SEMESTER_MAP } from '../../utils/bangla';
import { playPassSound, playFailSound, triggerPassConfetti } from '../../utils/resultAudio';
import { LoadingOverlay } from '../common/LoadingOverlay';
import { DigitalResultCardBottomSheet } from './DigitalResultCardBottomSheet';

interface ResultVerificationProps {
  initialCode?: string;
  onViewResultCard: (result: StudentResult) => void;
}

export const ResultVerification: React.FC<ResultVerificationProps> = ({
  initialCode = '',
  onViewResultCard,
}) => {
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [verifiedResult, setVerifiedResult] = useState<StudentResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cardSheetOpen, setCardSheetOpen] = useState(false);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      handleVerify(initialCode);
    }
  }, [initialCode]);

  const handleVerify = async (codeToVerify?: string) => {
    const targetCode = (codeToVerify || code).trim();
    if (!targetCode) {
      setErrorMessage('অনুগ্রহ করে ভেরিফিকেশন কোড বা রোল নম্বর লিখুন।');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setVerifiedResult(null);
    setHasSearched(true);

    try {
      const res = await verifyResultByCode(targetCode);
      if (res) {
        setVerifiedResult(res);
        const isPassed = Boolean(res.isPassed && (res.gpa || 0) > 0 && res.letterGrade !== 'F');
        if (isPassed) {
          // পাশ করলে বা A+ পেলে কনফেটি ফাটবে এবং ভালো সাউন্ড বাজবে
          playPassSound();
          triggerPassConfetti();
        } else {
          // ফেল দেখালে ব্যাড সাউন্ড
          playFailSound();
        }
      } else {
        setErrorMessage('দুঃখিত, এই ভেরিফিকেশন কোডটির বিপরীতে কোনো অনুমোদিত ফলাফল রেকর্ড পাওয়া যায়নি।');
      }
    } catch (err: any) {
      setErrorMessage('ফলাফল যাচাই করতে গিয়ে সমস্যা হয়েছে। ইন্টারনেট সংযোগ পরীক্ষা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-full text-xs font-bold mb-3">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span className="font-outfit">ONLINE RESULT AUTHENTICATION</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          ফলাফল সত্যতা যাচাই
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">
          ডিজিটাল গ্রেডশিটে থাকা ইউনিক ভেরিফিকেশন কোড বা রেজাল্ট আইডি প্রবেশ করিয়ে ফলাফলের সত্যতা নিশ্চিত করুন
        </p>
      </div>

      {/* Verification Code Input Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] mb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="space-y-4"
        >
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            ভেরিফিকেশন কোড
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="আপনার ভেরিফিকেশন কোড লিখুন"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold font-mono text-base focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none uppercase"
            />
            <ShieldCheck className="w-5 h-5 text-blue-600 absolute right-4 top-1/2 -translate-y-1/2" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-base transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            <Search className="w-5 h-5" />
            <span>সত্যতা যাচাই করুন</span>
          </button>
        </form>
      </div>

      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={loading}
        message="ফলাফল রেকর্ড যাচাই করা হচ্ছে..."
        subtext="ডিজিটাল ডেটাবেস থেকে সিকিউর ভেরিফিকেশন চলছে..."
      />

      {/* Error state */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-800 space-y-2">
          <XCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h4 className="font-bold text-base">অননুমোদিত বা সঠিক নয়</h4>
          <p className="text-xs sm:text-sm text-rose-600 max-w-md mx-auto">{errorMessage}</p>
        </div>
      )}

      {/* Success Verified Result Card */}
      {verifiedResult && (
        <div className="bg-emerald-50/50 border-2 border-emerald-300 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
          <div className="flex items-center space-x-3 text-emerald-800">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-outfit">
                AUTHENTIC & VERIFIED
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                ফলাফলটি সফলভাবে যাচাইকৃত ও সত্য
              </h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-2xs space-y-3 text-xs sm:text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[11px]">শিক্ষার্থীর নাম</span>
                <span className="font-bold text-slate-900 text-sm">{verifiedResult.studentName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">রোল নম্বর</span>
                <span className="font-bold text-blue-700 font-outfit text-sm">
                  {toBanglaDigits(verifiedResult.roll)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">বিভাগ</span>
                <span className="font-semibold text-slate-800">{verifiedResult.departmentName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">সেমিস্টার</span>
                <span className="font-semibold text-slate-800">
                  {SEMESTER_MAP[verifiedResult.semesterId]}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">পরীক্ষার নাম</span>
                <span className="font-semibold text-slate-900">{verifiedResult.examTitle}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">ফলাফল (GPA)</span>
                <span className={`font-black font-outfit text-base ${
                  verifiedResult.letterGrade === 'F' ? 'text-rose-600' : 'text-blue-600'
                }`}>
                  GPA {toBanglaNumber(verifiedResult.gpa, 2)} ({verifiedResult.letterGrade})
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500 font-outfit">
              CODE: {verifiedResult.verificationCode}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCardSheetOpen(true)}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-98"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>রেজাল্ট কার্ড নিন</span>
              </button>
              <button
                onClick={() => onViewResultCard(verifiedResult)}
                className="flex items-center space-x-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <span>সম্পূর্ণ গ্রেডশিট দেখুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Result Card Sheet */}
      <DigitalResultCardBottomSheet
        isOpen={cardSheetOpen}
        onClose={() => setCardSheetOpen(false)}
        result={verifiedResult}
        onVerify={handleVerify}
      />
    </div>
  );
};
