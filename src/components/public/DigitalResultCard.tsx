import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download,
  Printer,
  Share2,
  RotateCw,
  Sparkles,
  ShieldCheck,
  Check,
  Radio,
  QrCode as QrIcon,
  CheckCircle2,
  XCircle,
  Eye,
  CreditCard,
  Lock,
} from 'lucide-react';
import QRCode from 'qrcode';
import { StudentResult } from '../../types';
import {
  toBanglaDigits,
  toBanglaNumber,
  SEMESTER_MAP,
  toEnglishDigits,
} from '../../utils/bangla';
import { isFirestoreAutoId, generateDynamicStudentId } from '../../services/db';
import {
  generateDeterministicCardNumber,
  generateDeterministicSecurityCode,
  getAcademicRegistration,
  getCardValidityPeriod,
} from '../../utils/cardHelper';
import { printElementById } from '../../utils/printHelper';

export type CardTheme = 'gold' | 'red' | 'cyan';

interface DigitalResultCardProps {
  result: StudentResult;
  initialTheme?: CardTheme;
  onClose?: () => void;
  onVerify?: (code: string) => void;
}

export const DigitalResultCard: React.FC<DigitalResultCardProps> = ({
  result,
  initialTheme = 'gold',
  onClose,
  onVerify,
}) => {
  const [theme, setTheme] = useState<CardTheme>(initialTheme);
  const [isFlipped, setIsFlipped] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);
  const printSheetRef = useRef<HTMLDivElement>(null);

  const cleanRoll = toEnglishDigits(result.roll || '');
  const cleanStudentId = (!result.studentId || isFirestoreAutoId(result.studentId))
    ? generateDynamicStudentId(cleanRoll, result.departmentId)
    : result.studentId;

  const cleanVerificationCode = (result.verificationCode && !isFirestoreAutoId(result.verificationCode))
    ? result.verificationCode
    : `DPIB-${cleanRoll.slice(-4) || '0000'}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

  const cardNumber = generateDeterministicCardNumber(
    result.roll,
    cleanStudentId,
    result.departmentId
  );
  const securityCode = generateDeterministicSecurityCode(
    result.roll,
    cleanVerificationCode
  );
  const registrationNo = getAcademicRegistration(
    result.registration,
    result.roll
  );
  const validThru = getCardValidityPeriod(result.semesterId);
  const semesterBangla =
    SEMESTER_MAP[result.semesterId] ||
    `${toBanglaDigits(result.semesterId)}ম সেমিস্টার`;
  const isPassed = result.isPassed && result.gpa > 0;

  useEffect(() => {
    const verifyUrl = `${window.location.origin}/?verify=${cleanVerificationCode}`;
    QRCode.toDataURL(verifyUrl, {
      width: 180,
      margin: 1,
      color: {
        dark: '#090d16',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation failed:', err));
  }, [result, cleanVerificationCode]);

  // Premium 3D Theme Style Configurations with Obsidian Black Accents & Realistic Metal Surface
  const themeStyles = {
    gold: {
      name: 'ROYAL GOLD',
      cardBg: 'bg-gradient-to-br from-[#0c0904] via-[#241706] to-[#633e08]',
      cardBorderColor: 'border-amber-400/50',
      shadow3D: '0 25px 60px -15px rgba(0,0,0,0.85), 0 12px 28px -10px rgba(180,83,9,0.35), inset 0 1.5px 1px 0 rgba(255,255,255,0.45), inset 0 -2.5px 4px 0 rgba(0,0,0,0.8), inset 1.5px 0 2px 0 rgba(255,255,255,0.25), inset -1.5px 0 2px 0 rgba(0,0,0,0.5)',
      accentText: 'text-amber-300',
      accentGlow: 'bg-amber-400/20',
      badgeBg: 'bg-black/65 border-amber-400/50 text-amber-200',
      chipColor: 'from-[#fff3c4] via-[#f59e0b] to-[#78350f] border-amber-300',
      chipLines: 'border-amber-950/70',
      hologramBg: 'from-amber-300/30 via-yellow-200/20 to-teal-300/30 border-amber-300/50',
      tabActive: 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-slate-950 shadow-md',
      pillAccent: 'border-amber-500/40 bg-black/50 text-amber-300',
      metalSheen: 'from-amber-200/20 via-transparent to-yellow-500/10',
    },
    red: {
      name: 'RUBY CRIMSON',
      cardBg: 'bg-gradient-to-br from-[#0d0205] via-[#2b050f] to-[#6d0d21]',
      cardBorderColor: 'border-rose-400/50',
      shadow3D: '0 25px 60px -15px rgba(0,0,0,0.85), 0 12px 28px -10px rgba(159,18,57,0.35), inset 0 1.5px 1px 0 rgba(255,255,255,0.45), inset 0 -2.5px 4px 0 rgba(0,0,0,0.8), inset 1.5px 0 2px 0 rgba(255,255,255,0.25), inset -1.5px 0 2px 0 rgba(0,0,0,0.5)',
      accentText: 'text-rose-300',
      accentGlow: 'bg-rose-400/20',
      badgeBg: 'bg-black/65 border-rose-400/50 text-rose-200',
      chipColor: 'from-[#ffe4e6] via-[#f43f5e] to-[#881337] border-rose-300',
      chipLines: 'border-rose-950/70',
      hologramBg: 'from-rose-300/30 via-pink-200/20 to-cyan-300/30 border-rose-300/50',
      tabActive: 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white shadow-md',
      pillAccent: 'border-rose-500/40 bg-black/50 text-rose-300',
      metalSheen: 'from-rose-200/20 via-transparent to-red-500/10',
    },
    cyan: {
      name: 'SAPPHIRE CYAN',
      cardBg: 'bg-gradient-to-br from-[#020b12] via-[#051f33] to-[#0369a1]',
      cardBorderColor: 'border-sky-400/50',
      shadow3D: '0 25px 60px -15px rgba(0,0,0,0.85), 0 12px 28px -10px rgba(2,132,199,0.35), inset 0 1.5px 1px 0 rgba(255,255,255,0.45), inset 0 -2.5px 4px 0 rgba(0,0,0,0.8), inset 1.5px 0 2px 0 rgba(255,255,255,0.25), inset -1.5px 0 2px 0 rgba(0,0,0,0.5)',
      accentText: 'text-sky-300',
      accentGlow: 'bg-sky-400/20',
      badgeBg: 'bg-black/65 border-sky-400/50 text-sky-200',
      chipColor: 'from-[#e0f2fe] via-[#0ea5e9] to-[#075985] border-sky-300',
      chipLines: 'border-sky-950/70',
      hologramBg: 'from-sky-300/30 via-cyan-200/20 to-emerald-300/30 border-sky-300/50',
      tabActive: 'bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 text-white shadow-md',
      pillAccent: 'border-sky-500/40 bg-black/50 text-sky-300',
      metalSheen: 'from-sky-200/20 via-transparent to-cyan-500/10',
    },
  };

  const currentStyle = themeStyles[theme];

  // Save Card image via html2canvas-pro with 3D canvas rendering
  const handleDownloadCard = async () => {
    setIsDownloading(true);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const targetElement = isFlipped ? backCardRef.current : frontCardRef.current;
      if (!targetElement) return;

      const canvas = await html2canvas(targetElement, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: null,
      });

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `DPIB_DIGITAL_CARD_${result.roll}_${isFlipped ? 'BACK' : 'FRONT'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download card error:', err);
      alert('কার্ড ডাউনলোড করতে সমস্যা হয়েছে। দয়া করে প্রিন্ট অপশনটি ব্যবহার করুন।');
    } finally {
      setIsDownloading(false);
    }
  };

  // Print Dual-Side Card
  const handlePrintCard = () => {
    printElementById('dpib-printable-digital-card', {
      title: `DPIB RESULT CARD - ${result.studentName.toUpperCase()} (${result.roll})`,
      orientation: 'portrait',
      onStart: () => setIsPrinting(true),
      onComplete: () => {
        setTimeout(() => setIsPrinting(false), 800);
      },
      onError: (err) => {
        console.error('Print card failed:', err);
        setIsPrinting(false);
      },
    });
  };

  // Share Card verification link
  const handleShare = async () => {
    const verifyUrl = `${window.location.origin}/?verify=${
      result.verificationCode || result.id
    }`;
    const shareText = `DPIB DIGITAL RESULT CARD: ${result.studentName.toUpperCase()} (রোল: ${result.roll}) • GPA: ${result.gpa} (${result.letterGrade}) • সেমিস্টার: ${semesterBangla} • অনলাইন ভেরিফিকেশন: ${verifyUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'DPIB DIGITAL RESULT CARD',
          text: shareText,
          url: verifyUrl,
        });
      } catch (err) {
        console.warn('Share cancelled', err);
      }
    } else {
      navigator.clipboard.writeText(verifyUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="space-y-4 font-bengali text-slate-800">
      {/* Top Header & Theme Selector Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-amber-300 text-[10px] font-black font-outfit uppercase tracking-widest shadow-xs">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>OFFICIAL 3D SMART CARD</span>
            </span>
            <span className="text-[11px] text-slate-500 font-bold uppercase font-outfit">
              DPIB SECURE ID
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
            ডিজিটাল রেজাল্ট স্মার্ট কার্ড
          </h3>
        </div>

        {/* 3 Theme Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
          <button
            id="btn-theme-gold"
            type="button"
            onClick={() => setTheme('gold')}
            className={`px-3 py-1 rounded-xl text-[11px] font-black font-outfit transition-all flex items-center gap-1.5 cursor-pointer ${
              theme === 'gold'
                ? themeStyles.gold.tabActive
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-600 shadow-xs" />
            <span>GOLD</span>
          </button>

          <button
            id="btn-theme-red"
            type="button"
            onClick={() => setTheme('red')}
            className={`px-3 py-1 rounded-xl text-[11px] font-black font-outfit transition-all flex items-center gap-1.5 cursor-pointer ${
              theme === 'red'
                ? themeStyles.red.tabActive
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-700 shadow-xs" />
            <span>RED</span>
          </button>

          <button
            id="btn-theme-cyan"
            type="button"
            onClick={() => setTheme('cyan')}
            className={`px-3 py-1 rounded-xl text-[11px] font-black font-outfit transition-all flex items-center gap-1.5 cursor-pointer ${
              theme === 'cyan'
                ? themeStyles.cyan.tabActive
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-sky-600 shadow-xs" />
            <span>CYAN</span>
          </button>
        </div>
      </div>

      {/* Main Interactive 3D Card Display */}
      <div className="flex flex-col items-center justify-center py-1">
        <div className="w-full max-w-[480px] sm:max-w-[510px] perspective-[1400px]">
          {/* Card Wrapper with 3D Flip */}
          <div
            id="interactive-digital-result-card"
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer transition-transform duration-500 relative select-none"
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* ================= CARD FRONT (3D SURFACE) ================= */}
            <div
              ref={frontCardRef}
              className={`w-full aspect-[1.586/1] rounded-3xl p-4 sm:p-5 text-white relative overflow-hidden border ${currentStyle.cardBg} ${currentStyle.cardBorderColor} transition-all duration-300 flex flex-col justify-between`}
              style={{
                backfaceVisibility: 'hidden',
                boxShadow: currentStyle.shadow3D,
              }}
            >
              {/* 3D Glass Specular Reflection / Glare Bar */}
              <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/12 to-transparent -rotate-30 pointer-events-none transform translate-y-[-15%]" />
              
              {/* Top Bevel Highlight Glint */}
              <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-black/80 to-transparent pointer-events-none" />

              {/* Floating 3D Micro-Bubbles & Depth Orbs */}
              <div className="absolute -top-6 -right-6 w-36 h-36 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/15 blur-[0.5px] pointer-events-none" />
              <div className="absolute top-10 right-28 w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/20 shadow-inner blur-[0.3px] pointer-events-none" />
              <div className="absolute -bottom-10 left-10 w-40 h-40 rounded-full bg-gradient-to-tr from-white/5 to-transparent border border-white/10 blur-[1px] pointer-events-none" />
              <div className="absolute bottom-12 right-12 w-8 h-8 rounded-full bg-white/10 border border-white/25 blur-[0.2px] pointer-events-none" />

              {/* Watermark Crest Logo in Background */}
              <div className="absolute right-3 bottom-2 opacity-[0.08] pointer-events-none">
                <img
                  src="https://i.postimg.cc/mgyW32Y2/Firefly-Remove-Background.png"
                  alt="DPIB Crest"
                  className="w-40 h-40 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Front Header with Obsidian Glass Container */}
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center space-x-2.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/15 shadow-sm">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white p-0.5 border border-white/60 flex items-center justify-center shrink-0 shadow-md">
                    <img
                      src="https://i.postimg.cc/mgyW32Y2/Firefly-Remove-Background.png"
                      alt="DPIB Logo"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase font-outfit block text-white drop-shadow-xs leading-none">
                      DPIB RESULT ZONE
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-white/80 font-bold block leading-tight mt-0.5">
                      দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট
                    </span>
                  </div>
                </div>

                {/* 3D Status Jewel Badge */}
                <div
                  className={`px-3 py-1 rounded-full border text-[9px] sm:text-[10px] font-black tracking-widest uppercase font-outfit shadow-md flex items-center gap-1.5 backdrop-blur-md ${
                    isPassed
                      ? 'bg-black/70 border-emerald-400/70 text-emerald-300'
                      : 'bg-black/70 border-rose-400/70 text-rose-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isPassed ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <span>{isPassed ? 'PASSED / উত্তীর্ণ' : 'REFERRED'}</span>
                </div>
              </div>

              {/* Front Middle: 3D Metal Smart Chip & Contactless & 16-Digit Number */}
              <div className="relative z-10 my-auto py-0.5">
                <div className="flex items-center space-x-3 mb-2">
                  {/* 3D Realistic Metallic Smart SIM Chip */}
                  <div
                    className={`w-11 h-8 sm:w-13 sm:h-9 rounded-lg bg-gradient-to-br ${currentStyle.chipColor} border shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.9),inset_0_-1.5px_2px_rgba(0,0,0,0.6),0_2px_5px_rgba(0,0,0,0.6)] p-1 relative overflow-hidden flex flex-col justify-between shrink-0`}
                  >
                    <div className="grid grid-cols-3 gap-0.5 h-full opacity-65">
                      <div className={`border-r ${currentStyle.chipLines}`} />
                      <div className={`border-r ${currentStyle.chipLines}`} />
                      <div className="" />
                    </div>
                    <div
                      className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 border-y ${currentStyle.chipLines} opacity-65`}
                    />
                    <div className="absolute inset-x-2 top-1.5 bottom-1.5 border border-black/30 rounded-xs pointer-events-none" />
                  </div>

                  {/* Contactless Radio Icon */}
                  <div className="opacity-80 p-1 bg-black/40 rounded-lg border border-white/10 shadow-inner">
                    <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-white/90 rotate-90" />
                  </div>

                  {/* 3D Holographic Foil Seal */}
                  <div
                    className={`ml-auto px-2.5 py-1 rounded-lg bg-gradient-to-r ${currentStyle.hologramBg} border backdrop-blur-xs flex items-center gap-1.5 shadow-inner`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] font-outfit text-white drop-shadow-xs">
                      OFFICIAL SMART CARD
                    </span>
                  </div>
                </div>

                {/* 16-Digit Embossed Card Number */}
                <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-xl border border-white/15 inline-block shadow-inner">
                  <span className="font-mono text-base sm:text-lg md:text-xl font-black tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    {cardNumber}
                  </span>
                </div>
              </div>

              {/* Front Bottom: Student Information & GPA Tray in Obsidian Frost */}
              <div className="relative z-10 pt-1.5 border-t border-white/20 bg-black/40 backdrop-blur-md -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 px-4 sm:px-5 py-2.5 rounded-b-3xl border-b border-black/80">
                <div className="flex items-end justify-between gap-2">
                  {/* Student Name & Roll/Dept */}
                  <div className="max-w-[70%]">
                    <div className="text-[8px] sm:text-[9px] text-white/70 uppercase font-bold tracking-widest leading-none mb-0.5 font-outfit">
                      STUDENT / রোল: {toBanglaDigits(result.roll)}
                    </div>
                    <div className="text-sm sm:text-base font-black text-white truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {result.studentName}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-white/90 font-semibold truncate mt-0.5">
                      {result.departmentName} • {semesterBangla}
                    </div>
                  </div>

                  {/* GPA & Valid Thru in Raised 3D Pill */}
                  <div className="text-right shrink-0 bg-black/60 border border-white/15 px-3 py-1 rounded-xl shadow-inner">
                    <div className="text-[8px] text-white/70 uppercase font-black tracking-widest leading-none mb-0.5 font-outfit">
                      GPA / জিপিএ
                    </div>
                    <div className="text-sm sm:text-base font-black font-outfit text-white leading-tight">
                      {toBanglaNumber(result.gpa, 2)}{' '}
                      <span className={`text-xs ${currentStyle.accentText} font-black`}>
                        ({result.letterGrade})
                      </span>
                    </div>
                    <div className="text-[8px] sm:text-[9px] font-mono text-white/80 font-bold uppercase mt-0.5">
                      THRU {validThru}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= CARD BACK (3D SURFACE) ================= */}
            <div
              ref={backCardRef}
              className={`w-full aspect-[1.586/1] rounded-3xl p-4 sm:p-5 text-white absolute inset-0 overflow-hidden border ${currentStyle.cardBg} ${currentStyle.cardBorderColor} transition-all duration-300 flex flex-col justify-between`}
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                boxShadow: currentStyle.shadow3D,
              }}
            >
              {/* Glossy Black Specular Glare */}
              <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/10 to-transparent -rotate-30 pointer-events-none transform translate-y-[-15%]" />
              <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

              {/* Glossy Obsidian Magnetic Stripe */}
              <div className="-mx-4 sm:-mx-5 -mt-4 sm:-mt-5 h-9 sm:h-11 bg-gradient-to-r from-[#050505] via-[#141414] to-[#050505] border-b border-white/15 flex items-center justify-between px-6 shadow-inner">
                <span className="text-[8px] sm:text-[9px] font-mono text-slate-400 tracking-[0.25em] uppercase font-bold">
                  DPIB ACADEMIC SECURE STRIPE • CODE 40052
                </span>
                <span className="text-[8px] sm:text-[9px] font-mono text-slate-300 font-bold">
                  {cleanVerificationCode}
                </span>
              </div>

              {/* Signature & Security Code Panel */}
              <div className="my-auto space-y-1 relative z-10">
                <div className="flex items-center gap-2">
                  {/* Security Signature Strip with Pattern */}
                  <div className="flex-1 bg-slate-100 text-slate-900 rounded-lg px-3 py-1.5 text-left flex items-center justify-between border border-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]">
                    <span className="font-mono text-[9px] sm:text-xs font-black text-slate-900 tracking-wider">
                      VER ID: {cleanVerificationCode}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-slate-500 italic font-serif select-none">
                      AUTHORIZED SIGNATURE
                    </span>
                  </div>

                  {/* 3D CVV / Security Box */}
                  <div className="bg-black/85 border border-white/30 rounded-lg px-2.5 py-1 text-center shrink-0 shadow-inner">
                    <span className="text-[7px] sm:text-[8px] text-white/60 block font-outfit uppercase leading-none font-bold">
                      SEC CODE
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-black text-amber-300 tracking-widest">
                      {securityCode}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[8px] sm:text-[9px] text-white/80 font-mono px-1 font-bold">
                  <span>REG: {registrationNo}</span>
                  <span>ROLL: {result.roll}</span>
                  <span>SEM: {result.semesterId}</span>
                </div>
              </div>

              {/* Back Bottom: QR Code + Disclaimer in Obsidian Frost */}
              <div className="relative z-10 flex items-center gap-3 pt-2 border-t border-white/20 bg-black/40 backdrop-blur-md -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 px-4 sm:px-5 py-2.5 rounded-b-3xl">
                {/* Dynamic QR Code Tile with 3D Bevel */}
                {qrDataUrl && (
                  <div className="w-13 h-13 sm:w-15 sm:h-15 bg-white p-0.5 rounded-xl shrink-0 shadow-md border border-white/60">
                    <img
                      src={qrDataUrl}
                      alt="Verification QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Disclaimer & Institute info */}
                <div className="text-[8px] sm:text-[9px] text-white/85 leading-tight font-medium">
                  <p className="line-clamp-2">
                    এই কার্ডটি শুধুমাত্র দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউটের ডিজিটাল
                    একাডেমিক ফলাফল সনাক্তকরণ ও অনলাইন যাচাইকরণের জন্য প্রযোজ্য।
                  </p>
                  <p className="text-[7px] sm:text-[8px] text-white font-black mt-0.5 font-outfit uppercase tracking-wider">
                    DAKKINBANGO POLYTECHNIC INSTITUTE • BHOLA (CODE: 40052)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Flip Hint */}
        <div className="mt-2.5 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setIsFlipped(!isFlipped)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 border border-slate-700 font-outfit"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {isFlipped
                ? 'VIEW FRONT (সামনের পাশ দেখুন)'
                : 'VIEW BACK (পেছনের পাশ দেখুন)'}
            </span>
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        <button
          id="btn-download-digital-card"
          type="button"
          onClick={handleDownloadCard}
          disabled={isDownloading}
          className="bg-slate-900 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all cursor-pointer shadow-xs text-xs sm:text-sm active:scale-98 disabled:opacity-50 font-outfit"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span className="font-bengali">{isDownloading ? 'সংরক্ষণ হচ্ছে...' : 'কার্ড সংরক্ষণ করুন'}</span>
        </button>

        <button
          id="btn-print-digital-card"
          type="button"
          onClick={handlePrintCard}
          disabled={isPrinting}
          className="bg-blue-50 border border-blue-200 text-blue-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 transition-all cursor-pointer text-xs sm:text-sm active:scale-98 disabled:opacity-50 font-outfit"
        >
          <Printer className="w-4 h-4 text-blue-600" />
          <span className="font-bengali">{isPrinting ? 'প্রস্তুত হচ্ছে...' : 'কার্ড প্রিন্ট করুন'}</span>
        </button>

        <button
          id="btn-share-digital-card"
          type="button"
          onClick={handleShare}
          className="bg-slate-100 border border-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all cursor-pointer text-xs sm:text-sm active:scale-98 font-outfit"
        >
          <Share2 className="w-4 h-4 text-slate-600" />
          <span className="font-bengali">{copiedLink ? 'লিংক কপি হয়েছে!' : 'শেয়ার করুন'}</span>
        </button>
      </div>

      {/* Hidden Printable Dual-Side Sheet Container */}
      <div className="hidden">
        <div
          id="dpib-printable-digital-card"
          ref={printSheetRef}
          className="p-8 bg-white text-slate-900 max-w-[600px] mx-auto space-y-6 font-bengali"
        >
          <div className="text-center pb-4 border-b border-slate-200">
            <h2 className="text-xl font-black text-slate-900">
              দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট, ভোলা
            </h2>
            <p className="text-xs text-slate-500 font-outfit uppercase font-bold">
              DPIB DIGITAL RESULT CARD • BTEB CODE: 40052
            </p>
          </div>

          <div className="space-y-6">
            {/* Front Printable */}
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-outfit">
                FRONT SIDE / কার্ডের সামনের অংশ:
              </p>
              <div
                className={`w-full aspect-[1.586/1] rounded-3xl p-6 text-white relative overflow-hidden border ${currentStyle.cardBg} ${currentStyle.cardBorderColor} flex flex-col justify-between shadow-2xl`}
                style={{
                  boxShadow: currentStyle.shadow3D,
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="bg-black/60 px-3 py-1.5 rounded-xl border border-white/20">
                    <span className="font-black text-sm uppercase font-outfit block">
                      DPIB RESULT ZONE
                    </span>
                    <span className="text-[10px] text-white/80">
                      দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-black/70 border border-white/20 text-xs font-black font-outfit">
                    {isPassed ? 'PASSED / উত্তীর্ণ' : 'REFERRED'}
                  </span>
                </div>

                <div className="my-auto">
                  <div className="bg-black/50 px-3 py-1 rounded-xl border border-white/15 inline-block">
                    <span className="font-mono text-lg font-black tracking-widest text-white">
                      {cardNumber}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-end bg-black/40 -mx-6 -mb-6 p-4 rounded-b-3xl border-t border-white/20">
                  <div>
                    <div className="text-sm font-black">{result.studentName}</div>
                    <div className="text-xs text-white/80">
                      রোল: {result.roll} | {result.departmentName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black font-outfit">
                      GPA {result.gpa} ({result.letterGrade})
                    </div>
                    <div className="text-[10px] font-mono">THRU {validThru}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Back Printable */}
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-outfit">
                BACK SIDE / কার্ডের পেছনের অংশ:
              </p>
              <div
                className={`w-full aspect-[1.586/1] rounded-3xl p-6 text-white relative overflow-hidden border ${currentStyle.cardBg} ${currentStyle.cardBorderColor} flex flex-col justify-between shadow-2xl`}
                style={{
                  boxShadow: currentStyle.shadow3D,
                }}
              >
                <div className="-mx-6 -mt-6 h-10 bg-slate-950 flex items-center justify-between px-6 border-b border-white/15">
                  <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">
                    DPIB ACADEMIC SECURE STRIPE • CODE 40052
                  </span>
                  <span className="text-[9px] font-mono text-slate-300 font-bold">
                    {cleanVerificationCode}
                  </span>
                </div>

                <div className="bg-white/95 text-slate-900 rounded-lg p-2 text-xs flex justify-between items-center my-2 border border-slate-300 shadow-inner">
                  <span className="font-mono font-bold">
                    VER ID: {cleanVerificationCode}
                  </span>
                  <span className="font-mono font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
                    SEC: {securityCode}
                  </span>
                </div>

                <div className="flex items-center gap-3 bg-black/40 -mx-6 -mb-6 p-4 rounded-b-3xl border-t border-white/20">
                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="QR"
                      className="w-14 h-14 bg-white p-1 rounded-lg shrink-0"
                    />
                  )}
                  <div className="text-[9px] text-white/80">
                    <p>
                      এই কার্ডটি শুধুমাত্র ডিজিটাল ফলাফল সনাক্তকরণ ও যাচাইকরণের জন্য
                      প্রযোজ্য।
                    </p>
                    <p className="font-bold uppercase font-outfit mt-0.5">
                      DAKKINBANGO POLYTECHNIC INSTITUTE • BHOLA
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-200 font-outfit uppercase">
            PRINTED ON: {new Date().toLocaleDateString('bn-BD')} • DPIB DIGITAL RESULT SYSTEM
          </div>
        </div>
      </div>
    </div>
  );
};
