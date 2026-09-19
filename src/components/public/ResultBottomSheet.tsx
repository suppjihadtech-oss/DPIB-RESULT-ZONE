import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Download,
  Printer,
  Share2,
  Award,
  Calendar,
  Building,
  User,
  Hash,
  FileSpreadsheet,
  QrCode as QrIcon,
  Copy,
  Check,
  CreditCard,
  Sparkles,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import QRCode from 'qrcode';
import { playPassSound, playFailSound, triggerPassConfetti } from '../../utils/resultAudio';
import { StudentResult } from '../../types';
import {
  toBanglaDigits,
  toBanglaNumber,
  toBanglaOrdinal,
  formatBanglaDate,
  SEMESTER_MAP,
  toEnglishDigits,
} from '../../utils/bangla';
import { isFirestoreAutoId, generateDynamicStudentId } from '../../services/db';
import { BottomSheet } from '../common/BottomSheet';
import { printElementById } from '../../utils/printHelper';
import { DigitalResultCardBottomSheet } from './DigitalResultCardBottomSheet';

interface ResultBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  result: StudentResult | null;
  onVerifyResult?: (code: string) => void;
  onOpenDigitalCard?: (result: StudentResult) => void;
}

export const ResultBottomSheet: React.FC<ResultBottomSheetProps> = ({
  isOpen,
  onClose,
  result,
  onVerifyResult,
  onOpenDigitalCard,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [digitalCardOpen, setDigitalCardOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && result) {
      const isStudentPassed = Boolean(result.isPassed && result.gpa > 0 && result.letterGrade !== 'F');

      if (isStudentPassed) {
        // পাশ করলে কিংবা A+ পেলে কনফেটি ফাটবে এবং ভালো সাউন্ড বাজবে
        playPassSound();
        triggerPassConfetti();
      } else {
        // ফেল দেখালে ব্যাড সাউন্ড
        playFailSound();
      }

      // Generate QR Code
      const verifyCode = (result.verificationCode && !isFirestoreAutoId(result.verificationCode))
        ? result.verificationCode
        : `DPIB-${(result.roll || '0000').slice(-4)}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
      const verifyUrl = `${window.location.origin}/?verify=${verifyCode}`;
      QRCode.toDataURL(verifyUrl, { width: 140, margin: 1 })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code error:', err));
    }
  }, [isOpen, result]);

  const [isPrinting, setIsPrinting] = useState(false);

  if (!result) return null;

  const isPassed = Boolean(result.isPassed && result.gpa > 0 && result.letterGrade !== 'F');
  const semesterBangla = SEMESTER_MAP[result.semesterId] || `${toBanglaDigits(result.semesterId)}ম সেমিস্টার`;

  const cleanRoll = toEnglishDigits(result.roll || '');
  const displayStudentId = (!result.studentId || isFirestoreAutoId(result.studentId))
    ? generateDynamicStudentId(cleanRoll, result.departmentId)
    : result.studentId;

  const displayVerificationCode = (result.verificationCode && !isFirestoreAutoId(result.verificationCode))
    ? result.verificationCode
    : `DPIB-${cleanRoll.slice(-4) || '0000'}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

  const handlePrint = () => {
    printElementById('printable-result-sheet', {
      title: `DPIB_RESULT_${result.roll}_${result.studentName.toUpperCase().replace(/\s+/g, '_')}`,
      orientation: 'portrait',
      onStart: () => setIsPrinting(true),
      onComplete: () => {
        setIsPrinting(false);
      },
      onError: (err) => {
        console.error('Print failed:', err);
        setIsPrinting(false);
      },
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(displayVerificationCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShare = async () => {
    const shareText = `DPIB RESULT ZONE: ${result.studentName} (রোল: ${result.roll}) - ${result.examTitle} ফলাফল: GPA ${result.gpa} (${result.letterGrade})`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'DPIB পরীক্ষার ফলাফল',
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.warn('Share cancelled or failed', err);
      }
    } else {
      navigator.clipboard.writeText(`${shareText} - ${window.location.href}`);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleDownloadPdf = () => {
    handlePrint();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      maxHeight="max-h-[86vh]"
    >
      <div className="space-y-4 pb-4">
        {/* The Printable Result Container */}
        <div
          id="printable-result-sheet"
          ref={printRef}
          className="bg-white rounded-2xl p-1 sm:p-3 text-left relative overflow-hidden"
        >
          {/* Top Result Profile Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center border-2 border-slate-100 overflow-hidden shrink-0 shadow-xs">
                <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-slate-500" />
              </div>
              <div>
                <div className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1 font-outfit ${
                  isPassed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {isPassed ? 'PASSED / উত্তীর্ণ' : 'REFERRED / অকৃতকার্য'}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {result.studentName}
                </h3>
                <p className="text-slate-500 font-bold text-xs mt-0.5">
                  রোল: <span className="text-slate-900 font-outfit font-black">{toBanglaDigits(result.roll)}</span> | আইডি:{' '}
                  <span className="text-slate-900 font-outfit font-bold">{displayStudentId}</span>
                </p>
              </div>
            </div>

            {/* GPA Header display */}
            <div className="text-left sm:text-right bg-slate-50 sm:bg-slate-50/80 px-4 py-2.5 rounded-xl w-full sm:w-auto border border-slate-100">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-0.5 font-outfit">
                GRADE POINT AVERAGE
              </p>
              <div className="text-3xl sm:text-4xl font-black text-blue-600 leading-none tracking-tight font-outfit">
                {toBanglaNumber(result.gpa, 2)}{' '}
                <span className="text-base sm:text-lg text-blue-400 font-bold">/ ৪.০০</span>
                <span
                  className={`ml-1.5 text-xs px-2 py-0.5 rounded-md font-black ${
                    result.letterGrade === 'F'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {result.letterGrade}
                </span>
              </div>
            </div>
          </div>

          {/* 2-Column Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 py-3.5 border-b border-slate-100">
            {/* Exam Info */}
            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-2">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200/60 pb-1 flex items-center gap-1.5 font-outfit">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>EXAMINATION DETAILS</span>
              </h4>
              <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                <p className="text-slate-500">পরীক্ষার নাম:</p>
                <p className="text-slate-900 font-bold truncate">{result.examTitle}</p>
                <p className="text-slate-500">সেমিস্টার:</p>
                <p className="text-slate-900 font-bold">{semesterBangla}</p>
                <p className="text-slate-500">বিভাগ:</p>
                <p className="text-slate-900 font-bold truncate">{result.departmentName}</p>
                <p className="text-slate-500">পরীক্ষার ধরন:</p>
                <p className="text-slate-900 font-bold font-outfit">{result.examType}</p>
              </div>
            </div>

            {/* Merit Info */}
            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-2">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200/60 pb-1 flex items-center gap-1.5 font-outfit">
                <Award className="w-3.5 h-3.5 text-slate-400" />
                <span>ACADEMIC MERIT & MARKS</span>
              </h4>
              <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                <p className="text-slate-500">মেধাক্রম:</p>
                <p className="text-blue-600 font-black">
                  {result.meritRank ? toBanglaOrdinal(result.meritRank) : 'উপলব্ধ নয়'}
                </p>
                <p className="text-slate-500">লেটার গ্রেড:</p>
                <p className="text-slate-900 font-black font-outfit">{result.letterGrade}</p>
                <p className="text-slate-500">মোট প্রাপ্ত নম্বর:</p>
                <p className="text-slate-900 font-bold font-outfit">
                  {toBanglaDigits(result.totalObtainedMarks)} / {toBanglaDigits(result.totalFullMarks)}
                </p>
                <p className="text-slate-500">প্রকাশের তারিখ:</p>
                <p className="text-slate-900 font-bold">
                  {formatBanglaDate(result.publishedAt || result.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Subject Marks Table */}
          <div className="py-3.5">
            <h4 className="text-xs font-black text-slate-500 tracking-wider uppercase mb-2 flex items-center justify-between font-outfit">
              <span className="flex items-center gap-1.5 text-slate-700">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>SUBJECT-WISE MARKS BREAKDOWN</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium font-bengali">
                মোট বিষয়: {toBanglaDigits(result.subjects?.length || 0)}টি
              </span>
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 text-center w-12 font-outfit uppercase tracking-wider text-[10px]">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400 mx-auto" />
                    </th>
                    <th className="py-2.5 px-3">বিষয় কোড ও নাম</th>
                    <th className="py-2.5 px-3 text-center">পূর্ণমান</th>
                    <th className="py-2.5 px-3 text-center">প্রাপ্ত নম্বর</th>
                    <th className="py-2.5 px-3 text-center">গ্রেড</th>
                    <th className="py-2.5 px-3 text-center">গ্রেড পয়েন্ট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.subjects?.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-3 text-center">
                        <div className="w-6 h-6 rounded-md bg-blue-50/90 border border-blue-200/70 flex items-center justify-center text-blue-600 shadow-2xs mx-auto">
                          <BookOpen className="w-3 h-3" />
                        </div>
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        <span className="font-outfit text-slate-400 mr-1.5 font-bold text-[11px]">
                          [{sub.subjectCode}]
                        </span>
                        {sub.subjectName}
                      </td>
                      <td className="py-2 px-3 text-center font-outfit text-slate-600 font-medium">
                        {toBanglaDigits(sub.fullMarks)}
                      </td>
                      <td className="py-2 px-3 text-center font-black font-outfit text-slate-900">
                        {toBanglaDigits(sub.obtainedMarks)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-black font-outfit text-[11px] ${
                            sub.grade === 'A+'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : sub.grade === 'F'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          {sub.grade}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-bold font-outfit text-slate-800">
                        {toBanglaNumber(sub.gradePoint, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Verification Code & QR Footer inside card */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500 gap-3">
            <div className="flex items-center space-x-2.5">
              {qrDataUrl && (
                <div className="w-12 h-12 p-0.5 bg-white border border-slate-200 rounded-lg shrink-0 shadow-2xs">
                  <img src={qrDataUrl} alt="Result QR Code" className="w-full h-full" />
                </div>
              )}
              <div>
                <span className="text-[9px] text-slate-400 block font-outfit uppercase font-bold tracking-wider">
                  DIGITAL VERIFICATION CODE
                </span>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    {displayVerificationCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer"
                    title="COPY CODE"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="text-right text-[10px] text-slate-400 space-y-0.5">
              <p>কম্পিউটার জেনারেটেড ডিজিটাল গ্রেডশিট</p>
              <p className="font-outfit uppercase font-semibold">DPIB DIGITAL RESULT SYSTEM</p>
            </div>
          </div>
        </div>

        {/* Exclusive Digital Result Card Option Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 rounded-2xl p-3.5 sm:p-4 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border border-blue-400/30">
          <div className="flex items-center gap-3 text-left w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0 shadow-inner">
              <CreditCard className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-200 text-[9px] font-black font-outfit uppercase tracking-widest mb-0.5">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>OFFICIAL SMART CARD</span>
              </div>
              <h4 className="text-sm sm:text-base font-black leading-tight truncate">
                DPIB ডিজিটাল রেজাল্ট কার্ড
              </h4>
              <p className="text-[11px] text-white/80 font-medium truncate">
                গোল্ড, রেড ও সায়ান থিমে প্রিমিয়াম 3D রেজাল্ট কার্ড পান
              </p>
            </div>
          </div>

          <button
            id="btn-take-result-card"
            type="button"
            onClick={() => {
              if (onOpenDigitalCard) {
                onOpenDigitalCard(result);
              } else {
                setDigitalCardOpen(true);
              }
            }}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-2.5 min-h-[42px] bg-white text-blue-950 rounded-xl font-black text-xs sm:text-sm hover:bg-amber-300 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shrink-0 font-bengali"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>রেজাল্ট কার্ড নিন</span>
          </button>
        </div>

        {/* Action Buttons Section */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-0.5">
          <button
            id="btn-result-download-pdf"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex-1 min-w-[130px] bg-slate-900 text-white font-bold py-3 px-3.5 sm:px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all cursor-pointer shadow-xs text-xs sm:text-sm active:scale-98 disabled:opacity-50 font-outfit min-h-[44px]"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span className="font-bengali truncate">{isGeneratingPdf ? 'তৈরি হচ্ছে...' : 'PDF ডাউনলোড'}</span>
          </button>

          <button
            id="btn-result-share"
            onClick={handleShare}
            className="flex-1 min-w-[110px] bg-slate-100 text-slate-700 font-bold py-3 px-3.5 sm:px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all cursor-pointer text-xs sm:text-sm active:scale-98 font-outfit min-h-[44px]"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span className="font-bengali truncate">শেয়ার করুন</span>
          </button>

          {onVerifyResult && (
            <button
              id="btn-result-verify-modal"
              onClick={() => {
                onClose();
                onVerifyResult(result.verificationCode || result.id);
              }}
              title="যাচাই করুন"
              className="w-11 sm:w-13 h-11 sm:h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-all cursor-pointer active:scale-98 border border-blue-100 shrink-0"
            >
              <QrIcon className="w-5 h-5" />
            </button>
          )}

          <button
            id="btn-result-print"
            onClick={handlePrint}
            disabled={isPrinting}
            title={isPrinting ? 'প্রিন্ট প্রস্তুত হচ্ছে...' : 'প্রিন্ট করুন'}
            className="w-11 sm:w-13 h-11 sm:h-12 bg-slate-100 disabled:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all cursor-pointer active:scale-98 disabled:cursor-wait border border-slate-200 shrink-0"
          >
            <Printer className={`w-4 h-4 ${isPrinting ? 'animate-bounce text-teal-700' : ''}`} />
          </button>
        </div>
      </div>

      {/* Digital Result Card Bottom Sheet */}
      <DigitalResultCardBottomSheet
        isOpen={digitalCardOpen}
        onClose={() => setDigitalCardOpen(false)}
        result={result}
        onVerify={onVerifyResult}
      />
    </BottomSheet>
  );
};

