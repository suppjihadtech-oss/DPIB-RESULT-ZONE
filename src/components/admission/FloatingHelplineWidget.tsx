import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Phone,
  PhoneCall,
  X,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Headphones,
  Sparkles,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import {
  subscribeAdmissionSettings,
  DEFAULT_ADMISSION_SETTINGS,
  parsePhoneNumbers,
} from '../../services/admissionService';
import { AdmissionSettings } from '../../types';
import { toBanglaDigits, toEnglishDigits } from '../../utils/bangla';

interface FloatingHelplineWidgetProps {
  settings?: AdmissionSettings;
}

/**
 * Generates a subtle, pleasant chime sound using Web Audio API
 */
function playHelplineChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // Two-tone bell harmonic chime (gentle and pleasant)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.14); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1174.66, now + 0.06); // D6

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(0.09, now + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.05);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  } catch {
    // Graceful fallback if audio is blocked
  }
}

export const FloatingHelplineWidget: React.FC<FloatingHelplineWidgetProps> = ({
  settings: initialSettings,
}) => {
  const [admissionSettings, setAdmissionSettings] = useState<AdmissionSettings>(
    initialSettings || DEFAULT_ADMISSION_SETTINGS
  );
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showAutoBubble, setShowAutoBubble] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loopIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to live admission settings
  useEffect(() => {
    if (initialSettings) {
      setAdmissionSettings(initialSettings);
      return;
    }
    const unsub = subscribeAdmissionSettings((settings) => {
      setAdmissionSettings(settings);
    });
    return () => {
      unsub();
    };
  }, [initialSettings]);

  // Periodic automated speech bubble with pleasant chime
  useEffect(() => {
    // Helper function to trigger speech bubble
    const triggerBubble = () => {
      setShowAutoBubble(true);
      playHelplineChime();

      // Auto dismiss after 5.5 seconds
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setShowAutoBubble(false);
      }, 5500);
    };

    // Initial trigger after 3.5 seconds on page load
    bubbleTimerRef.current = setTimeout(() => {
      triggerBubble();
    }, 3500);

    // Periodic reminder every 28 seconds if modal isn't open
    loopIntervalRef.current = setInterval(() => {
      if (!isOpen) {
        triggerBubble();
      }
    }, 28000);

    return () => {
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (loopIntervalRef.current) clearInterval(loopIntervalRef.current);
    };
  }, [isOpen]);

  const handleOpenModal = () => {
    setShowAutoBubble(false);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  const handleCopyNumber = (phone: string, idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone).catch(() => {});
    setCopiedIndex(idx);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2500);
  };

  const phoneNumbers = parsePhoneNumbers(admissionSettings.contactPhone);

  return (
    <>
      {/* ================= FLOATING FIXED GLOBAL HELPLINE BUTTON ================= */}
      <div
        id="admission-floating-helpline-container"
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end pointer-events-none"
      >
        {/* Periodic Automated Speech Bubble / Tooltip */}
        <AnimatePresence>
          {showAutoBubble && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="pointer-events-auto mb-2.5 max-w-[260px] sm:max-w-xs bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3.5 shadow-xl border border-slate-700/80 cursor-pointer group relative"
              onClick={handleOpenModal}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-bold text-sky-300 font-outfit uppercase tracking-wider">
                    ভর্তি সহায়তা
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAutoBubble(false);
                  }}
                  className="text-slate-400 hover:text-white p-0.5 rounded-md transition-colors"
                  title="বন্ধ করুন"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs font-bold text-slate-100 mt-1.5 leading-snug">
                ভর্তি সংক্রান্ত যেকোনো তথ্যের জন্য সরাসরি কল করুন
              </p>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[11px] text-sky-400 font-bold group-hover:text-sky-300 transition-colors">
                <span className="flex items-center gap-1">
                  <PhoneCall className="w-3 h-3 animate-pulse" />
                  <span>নম্বর দেখতে ক্লিক করুন</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {admissionSettings.helplineHours || 'সকাল ০৯:০০ - বিকাল ০৫:০০'}
                </span>
              </div>

              {/* Triangle Tail */}
              <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-slate-900 border-r border-b border-slate-700/80 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Helpline Trigger Button */}
        <motion.button
          id="btn-admission-floating-helpline"
          type="button"
          onClick={handleOpenModal}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="pointer-events-auto relative group flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 text-white shadow-lg shadow-blue-700/35 hover:shadow-blue-700/50 border-2 border-white cursor-pointer transition-all duration-300"
          title="ভর্তি হটলাইন ও যোগাযোগ নম্বর"
          aria-label="ভর্তি হটলাইন"
        >
          {/* Subtle Ripple Animation Rings */}
          <span className="absolute -inset-1 rounded-full bg-blue-500/25 animate-ping opacity-75 pointer-events-none" />
          <span className="absolute -inset-2 rounded-full bg-sky-400/20 animate-pulse pointer-events-none" />

          {/* Icon */}
          <div className="relative z-10 flex items-center justify-center">
            <PhoneCall className="w-6 h-6 text-white transition-transform group-hover:rotate-12 group-hover:scale-110" />
          </div>

          {/* Active Status Badge */}
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs" />
        </motion.button>
      </div>

      {/* ================= HELPLINE NUMBERS DIALOG MODAL ================= */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            {/* Backdrop Dismiss */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden font-bengali"
            >
              {/* Top Banner Header */}
              <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white p-5 sm:p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-sky-400/20 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-start justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                      <PhoneCall className="w-6 h-6 text-sky-200 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-sky-200 text-[10px] font-bold font-outfit uppercase tracking-wider">
                          OFFICIAL HELPLINE
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white tracking-tight mt-0.5">
                        {admissionSettings.helplineTitle || 'ভর্তি সংক্রান্ত হেল্পলাইন'}
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="বন্ধ করুন"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-sky-100 font-medium relative z-10">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                    <span>অফিস সময়: <strong className="text-white font-bold">{admissionSettings.helplineHours || 'সকাল ০৯:০০ - বিকাল ০৫:০০'}</strong></span>
                  </span>
                  <span className="flex items-center gap-1 text-emerald-300 text-[11px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <span>কলের জন্য প্রস্তুত</span>
                  </span>
                </div>
              </div>

              {/* Body: Direct Caller Number Cards */}
              <div className="p-5 sm:p-6 space-y-3.5 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700">
                    সরাসরি কল করতে যেকোনো নম্বরে স্পর্শ করুন:
                  </p>
                  <span className="text-[11px] text-slate-400 font-medium">
                    মোট {toBanglaDigits(phoneNumbers.length)} টি হটলাইন
                  </span>
                </div>

                <div className="space-y-2.5">
                  {phoneNumbers.map((phone, idx) => {
                    const cleanPhone = toEnglishDigits(phone).replace(/[^0-9+]/g, '');
                    const isCopied = copiedIndex === idx;

                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 p-3.5 sm:p-4 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-3 group"
                      >
                        {/* Direct Call Anchor Link (Takes user directly to native phone dialer) */}
                        <a
                          id={`helpline-modal-call-${idx}`}
                          href={`tel:${cleanPhone}`}
                          className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                          title={`${phone} এ সরাসরি কল করুন`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-600 text-blue-700 group-hover:text-white border border-blue-200/80 group-hover:border-blue-600 flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                            <Phone className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-outfit">
                                {phoneNumbers.length > 1 ? `হটলাইন ${toBanglaDigits(idx + 1)}` : 'প্রধান হটলাইন'}
                              </span>
                            </div>
                            <div className="text-base sm:text-lg font-outfit font-black text-slate-900 tracking-wider mt-0.5 group-hover:text-blue-700 transition-colors">
                              {phone}
                            </div>
                          </div>
                        </a>

                        {/* Actions: Copy & Direct Dial Button */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Copy Number */}
                          <button
                            type="button"
                            onClick={(e) => handleCopyNumber(phone, idx, e)}
                            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="নম্বর কপি করুন"
                          >
                            {isCopied ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          {/* Primary Call Action Pill */}
                          <a
                            href={`tel:${cleanPhone}`}
                            className="px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-blue-700/20 transition-all cursor-pointer"
                            title="সরাসরি কল দিন"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>কল করুন</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Additional Guidance Footer */}
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-start gap-2 text-[11px] text-slate-500 font-medium">
                  <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <span>
                    ভর্তি সংক্রান্ত যে কোনো জিজ্ঞাসা, টেকনোলজি কোটা, ফি বা অনলাইন ফরম পূরণের সহযোগিতার জন্য সরাসরি কর্তৃপক্ষকে অবহিত করুন।
                  </span>
                </div>
              </div>

              {/* Bottom Dismiss Footer */}
              <div className="p-3 bg-slate-100/80 border-t border-slate-200 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-colors cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
