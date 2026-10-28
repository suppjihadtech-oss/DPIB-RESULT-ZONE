import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
  BookOpen,
  HelpCircle,
  FileText,
  Calendar,
  AlertCircle,
  ChevronRight,
  Award,
  CheckCircle2,
  GraduationCap,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Building2,
  Layers,
  Trash2,
  Info,
} from 'lucide-react';
import { StudentResult, Exam, Notice } from '../../types';
import { toBanglaDigits, toEnglishDigits, SEMESTER_MAP } from '../../utils/bangla';
import { searchAllPublicResults } from '../../services/db';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  resultData?: StudentResult | null;
  error?: boolean;
}

interface DpibAssistantModalProps {
  exams: Exam[];
  notices: Notice[];
  onNavigateTab: (tab: any) => void;
  onOpenResultModal?: (result: StudentResult) => void;
}

// Available DPIB Technologies / Departments with UPPERCASE English
const DPIB_DEPARTMENTS = [
  { id: 'cmt', code: 'CMT', name: 'কম্পিউটার টেকনোলজি (COMPUTER TECHNOLOGY - CMT)' },
  { id: 'ct', code: 'CT', name: 'সিভিল টেকনোলজি (CIVIL TECHNOLOGY - CT)' },
  { id: 'et', code: 'ET', name: 'ইলেকট্রিক্যাল টেকনোলজি (ELECTRICAL TECHNOLOGY - ET)' },
  { id: 'mt', code: 'MT', name: 'মেকানিক্যাল টেকনোলজি (MECHANICAL TECHNOLOGY - MT)' },
  { id: 'ent', code: 'ENT', name: 'ইলেকট্রনিক্স টেকনোলজি (ELECTRONICS TECHNOLOGY - ENT)' },
  { id: 'rac', code: 'RAC', name: 'আরএসি টেকনোলজি (REFRIGERATION & AIR CONDITIONING - RAC)' },
];

// Quick Action Prompts with beautiful SVG icons (NO EMOJIS)
const QUICK_ACTIONS = [
  {
    id: 'result',
    label: 'আমার রেজাল্ট বিশ্লেষণ',
    prompt: 'আমার বোর্ড রোলের ফলাফল ও বিষয়ভিত্তিক দুর্বলতা বিশ্লেষণ দেখতে চাই।',
    icon: Search,
  },
  {
    id: 'pass',
    label: 'পাসের শর্ত কী?',
    prompt: 'BTEB ডিপ্লোমা পরীক্ষায় পাসের সাধারণ শর্ত ও নিয়ম কী?',
    icon: CheckCircle2,
  },
  {
    id: 'routine',
    label: 'পরীক্ষার রুটিন ও সময়সূচি',
    prompt: 'বর্তমান পরীক্ষার তালিকা ও সময়সূচি সম্পর্কে জানতে চাই।',
    icon: Calendar,
  },
  {
    id: 'notice',
    label: 'সাম্প্রতিক নোটিশসমূহ',
    prompt: 'ইনস্টিটিউটের সর্বশেষ প্রকাশিত গুরুত্বপূর্ণ নোটিশগুলো কী কী?',
    icon: FileText,
  },
  {
    id: 'technology',
    label: 'টেকনোলজি ও বিভাগসমূহ',
    prompt: 'দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউটে কোন কোন টেকনোলজি বা বিভাগ রয়েছে?',
    icon: Building2,
  },
  {
    id: 'grading',
    label: 'গ্রেডিং স্কেল ও GPA',
    prompt: 'BTEB ডিপ্লোমা গ্রেডিং সিস্টেম এবং GPA হিসাব করার নিয়ম কী?',
    icon: Award,
  },
];

function getClientAssistantFallback(
  messageText: string,
  resultContext: StudentResult | null,
  exams: Exam[],
  notices: Notice[]
): string {
  const clean = (messageText || '').trim().toLowerCase();

  if (resultContext) {
    const weakSubs = resultContext.subjects.filter(
      (s) => !s.isPassed || s.grade === 'F' || s.grade === 'D' || s.grade === 'C'
    );
    if (
      clean.includes('উন্নতি') ||
      clean.includes('দুর্বল') ||
      clean.includes('পরামর্শ') ||
      clean.includes('দরকার') ||
      clean.includes('পড়াশোনা')
    ) {
      if (weakSubs.length > 0) {
        return (
          `শিক্ষার্থী ${resultContext.studentName} (রোল: ${toBanglaDigits(resultContext.roll)})-এর ফলাফল পর্যালোচনার ভিত্তিতে পরামর্শ:\n\n` +
          `নিম্নোক্ত বিষয়গুলোতে উন্নয়ন প্রয়োজন:\n` +
          weakSubs
            .map(
              (s) =>
                `• ${s.subjectName} [${s.subjectCode}]: প্রাপ্ত নম্বর ${toBanglaDigits(s.obtainedMarks)}/${toBanglaDigits(s.fullMarks)} (গ্রেড: ${s.grade})`
            )
            .join('\n') +
          `\n\nগঠনমূলক স্টাডি প্ল্যান:\n` +
          `১. বিগত ৩-৫ বছরের BTEB বোর্ড সমাপনী পরীক্ষার প্রশ্ন নিয়মিত সমাধান করুন।\n` +
          `২. তত্ত্বীয় ও ব্যবহারিক উভয় অংশে নূন্যতম ৪০% নম্বর নিশ্চিত করতে প্রতিদিন খাতায় লিখে অনুশীলন করুন।\n` +
          `৩. বিষয়ভিত্তিক সম্মানিত শিক্ষকের সাথে যোগাযোগ করে কঠিন অধ্যায়গুলো ঝালিয়ে নিন।`
        );
      }
      return `আপনার ফলাফল অত্যন্ত সন্তোষজনক (GPA: ${toBanglaDigits(resultContext.gpa.toFixed(2))}, গ্রেড: ${resultContext.letterGrade})। এই ভালো অবস্থান ধরে রাখতে লাইব্রেরির রেফারেন্স বই ও নিয়মিত ক্লাস নোট অনুসরণ করুন।`;
    }
  }

  if (clean.includes('ফলাফল') && (clean.includes('কীভাবে') || clean.includes('দেখব') || clean.includes('খুঁজব'))) {
    return (
      `DPIB RESULT ZONE-এ ফলাফল দেখার সহজ নিয়ম:\n\n` +
      `১. হোম পেজ অথবা উপরের 'ফলাফল অনুসন্ধান' মেনুতে প্রবেশ করুন।\n` +
      `২. আপনার সঠিক বোর্ড রোল নম্বর লিখুন।\n` +
      `৩. আপনার সেমিস্টার ও পরীক্ষা নির্বাচন করুন (ঐচ্ছিক)।\n` +
      `৪. 'ফলাফল অনুসন্ধান করুন' বাটনে ক্লিক করুন।\n\n` +
      `তৎক্ষণাৎ বিষয়ভিত্তিক নম্বর, মোট নম্বর, GPA ও প্রিন্টযোগ্য ডিজিটাল গ্রেডশিট দেখতে পাবেন।`
    );
  }

  if (clean.includes('পাসের শর্ত') || clean.includes('পাস মার্ক') || clean.includes('পাস করার নিয়ম') || clean.includes('রেফার্ড')) {
    return (
      `BTEB ডিপ্লোমা ইন ইঞ্জিনিয়ারিং পাসের সাধারণ নিয়মাবলি:\n\n` +
      `১. প্রতিটি বিষয়ে তত্ত্বীয় ধারাবাহিক (TC), তত্ত্বীয় সমাপনী (TF), ব্যবহারিক ধারাবাহিক (PC) ও ব্যবহারিক সমাপনী (PF) প্রতিটি অংশে পৃথকভাবে পাস করতে হয়।\n` +
      `২. সার্বিকভাবে প্রতিটি অংশে নূন্যতম ৪০% নম্বর অর্জন আবশ্যক।\n` +
      `৩. ৪০%-এর কম নম্বর পেলে বা অনুপস্থিত থাকলে উক্ত বিষয়ে 'F' গ্রেড (রেফার্ড) গণ্য হবে।\n` +
      `৪. রেফার্ড বিষয়ে পরবর্তী নির্ধারিত পর্বে পুনঃপরীক্ষা দিয়ে উত্তীর্ণ হওয়া যায়। চূড়ান্ত ডিপ্লোমা সনদের জন্য সকল বিষয়ে উত্তীর্ণ হওয়া আবশ্যক।`
    );
  }

  if (clean.includes('রুটিন') || clean.includes('পরীক্ষার তারিখ') || clean.includes('সময়সূচি') || clean.includes('পরীক্ষা')) {
    const pubCount = exams.length;
    let details = `পরীক্ষার রুটিন ও সময়সূচি সংক্রান্ত তথ্য:\n\n`;
    if (pubCount > 0) {
      details += `বর্তমানে ডেটাবেসে অন্তর্ভুক্ত পরীক্ষাসমূহ:\n`;
      exams.slice(0, 5).forEach((ex, idx) => {
        details += `${idx + 1}. ${ex.title} (পর্ব: ${SEMESTER_MAP[ex.semesterId] || ex.semesterId}) - তারিখ: ${toBanglaDigits(ex.examDate)}\n`;
      });
      details += `\nসকল পরীক্ষার বিস্তারিত তালিকা ও ফলাফল দেখতে 'পরীক্ষার তালিকা' মেনুতে যান।`;
    } else {
      details += `১. ইনস্টিটিউটের সকল পরীক্ষা ও রুটিনের তথ্য পোর্টালের 'স্মার্ট ক্যালেন্ডার' এবং 'পরীক্ষার তালিকা' মেনুতে পাওয়া যাবে।\n`;
      details += `২. চূড়ান্ত অফিসিয়াল রুটিন নোটিশ বোর্ড থেকে সরাসরি ডাউনলোড ও প্রিন্ট করা যাবে।`;
    }
    return details;
  }

  if (clean.includes('নোটিশ') || clean.includes('বিজ্ঞপ্তি') || clean.includes('ছুটি') || clean.includes('ক্যালেন্ডার')) {
    let noticeText = `ইনস্টিটিউটের সাম্প্রতিক নোটিশ ও সার্কুলার:\n\n`;
    if (notices.length > 0) {
      noticeText += `সর্বশেষ প্রকাশিত নোটিশসমূহ:\n`;
      notices.slice(0, 5).forEach((n, idx) => {
        noticeText += `${idx + 1}. ${n.title} [${toBanglaDigits(n.publishedDate)}]\n`;
      });
      noticeText += `\nসম্পূর্ণ নোটিশ পড়তে পোর্টালের 'নোটিশ' ট্যাবে যান। সরকারি ছুটির দিনপঞ্জি দেখতে 'স্মার্ট ক্যালেন্ডার' ব্যবহার করুন।`;
    } else {
      noticeText += `১. ইনস্টিটিউটের সকল সাম্প্রতিক নোটিশ ও অ্যাকাডেমিক আদেশ দেখতে 'নোটিশ' ট্যাবে যান।\n` +
        `২. সরকারি ছুটি, কলেজ বন্ধের দিন ও অনুষ্ঠান দিনপঞ্জি দেখতে 'স্মার্ট ক্যালেন্ডার' পেজ ব্যবহার করুন।`;
    }
    return noticeText;
  }

  if (clean.includes('টেকনোলজি') || clean.includes('বিভাগ') || clean.includes('ডিপার্টমেন্ট') || clean.includes('সিভিল') || clean.includes('কম্পিউটার')) {
    return (
      `দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউটের অনুমোদিত ডিপ্লোমা টেকনোলজিসমূহ:\n\n` +
      `১. কম্পিউটার টেকনোলজি (COMPUTER TECHNOLOGY - CMT)\n` +
      `২. সিভিল টেকনোলজি (CIVIL TECHNOLOGY - CT)\n` +
      `৩. ইলেকট্রিক্যাল টেকনোলজি (ELECTRICAL TECHNOLOGY - ET)\n` +
      `৪. মেকানিক্যাল টেকনোলজি (MECHANICAL TECHNOLOGY - MT)\n` +
      `৫. ইলেকট্রনিক্স টেকনোলজি (ELECTRONICS TECHNOLOGY - ENT)\n` +
      `৬. আরএসি টেকনোলজি (REFRIGERATION & AIR CONDITIONING - RAC)\n\n` +
      `প্রতিটি টেকনোলজির ১ম থেকে ৮ম পর্বের বিষয়ভিত্তিক সিলেবাস ও পাঠ্যবই দেখতে 'বুক লিস্ট' পেজ ভিজিট করতে পারেন।`
    );
  }

  if (clean.includes('বই') || clean.includes('বুক লিস্ট') || clean.includes('পাঠ্যবই')) {
    return (
      `ডিপ্লোমা পাঠ্যবই ও বুক লিস্ট:\n\n` +
      `১. আপনার টেকনোলজি ও বর্তমান সেমিস্টারের সকল পাঠ্যবই দেখতে 'বুক লিস্ট' পেজে যান।\n` +
      `২. সেখানে বিষয় কোড, ক্রেডিট সংখ্যা, আনুমানিক বাজার মূল্য এবং BTEB রেফারেন্স বইয়ের তালিকা দেওয়া আছে।`
    );
  }

  if (clean.includes('জিপিএ') || clean.includes('গ্রেড') || clean.includes('ক্যালকুলেটর')) {
    return (
      `GPA হিসাব ও BTEB গ্রেডিং স্কেল:\n\n` +
      `• ৮০%+ : A+ (৪.০০)\n` +
      `• ৭৫-৭৯% : A (৩.৭৫)\n` +
      `• ৭০-৭৪% : A- (৩.৫০)\n` +
      `• ৬৫-৬৯% : B+ (৩.২৫)\n` +
      `• ৬০-৬৪% : B (৩.০০)\n` +
      `• ৫৫-৫৯% : B- (২.৭৫)\n` +
      `• ৫০-৫৪% : C+ (২.৫০)\n` +
      `• ৪৫-৪৯% : C (২.২৫)\n` +
      `• ৪০-৪৪% : D (২.০০)\n` +
      `• ৪০% এর কম : F (০.০০ - ফেল)\n\n` +
      `সেমিস্টার GPA সরাসরি গণনা করতে 'জিপিএ ক্যালকুলেটর' মেনু ব্যবহার করুন।`
    );
  }

  return (
    `আপনার প্রশ্নের জন্য ধন্যবাদ। দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট শিক্ষার্থী সহায়তা কেন্দ্রে আপনাকে স্বাগতম।\n\n` +
    `আপনার ফলাফল ও বিষয়ভিত্তিক দুর্বলতা দেখতে সরাসরি আপনার বোর্ড রোল নম্বর (যেমন: 601234) লিখুন।\n\n` +
    `অন্যান্য তথ্যের জন্য নিচের কুইক অপশনগুলো বেছে নিতে পারেন:\n` +
    `• আমার ফলাফল কীভাবে দেখব?\n` +
    `• পাসের শর্ত কী?\n` +
    `• পরীক্ষার রুটিন কোথায় পাব?\n` +
    `• নোটিশ ও ছুটির তথ্য কোথায় পাব?\n` +
    `• কোন বিষয়ে আমার উন্নতি করা দরকার?`
  );
}

export const DpibAssistantModal: React.FC<DpibAssistantModalProps> = ({
  exams,
  notices,
  onNavigateTab,
  onOpenResultModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      text: 'আসসালামু আলাইকুম। আমি DPIB AI ACADEMIC ASSISTANT। দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউটের পোর্টাল সংক্রান্ত যেকোনো প্রশ্ন—ফলাফল (RESULT), পরীক্ষা (EXAM), পর্ব/সেমিস্টার (SEMESTER), টেকনোলজি (TECHNOLOGY) ও নোটিশ (NOTICE) সম্পর্কে জানতে পারেন। আপনার বোর্ড রোল নম্বর লিখে সরাসরি ফলাফল বিশ্লেষণও দেখতে পারেন।',
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Roll Search Quick Bar inside Assistant
  const [rollInput, setRollInput] = useState('');
  const [isSearchingRoll, setIsSearchingRoll] = useState(false);
  const [currentResultContext, setCurrentResultContext] = useState<StudentResult | null>(null);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Text-To-Speech (TTS) states
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [ttsSupported, setTtsSupported] = useState(false);

  // Voice Input (Speech-to-Text) states
  const [isListening, setIsListening] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  // Check TTS and STT support on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        setTtsSupported(true);
      }
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSttSupported(true);
      }
    }
  }, []);

  // Cleanup TTS on modal close or unmount
  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopSpeech();
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        setIsListening(false);
      }
    }
  }, [isOpen, stopSpeech, isListening]);

  // Handle Copy Message Text
  const handleCopyMessage = async (msgId: string, text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
    }
  };

  // Handle Text-to-Speech (TTS)
  const handleToggleSpeech = (msgId: string, text: string) => {
    if (!ttsSupported) return;

    if (speakingMessageId === msgId) {
      stopSpeech();
      return;
    }

    stopSpeech();

    // Clean text of bullets and markdown symbols for cleaner narration
    const cleanSpeechText = text
      .replace(/[•\*\#\_\[\]]/g, ' ')
      .replace(/\n+/g, '. ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.lang = 'bn-BD';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Pick Bengali voice if available in browser
    const voices = window.speechSynthesis.getVoices();
    const bnVoice = voices.find(
      (v) => v.lang === 'bn-BD' || v.lang === 'bn-IN' || v.lang.startsWith('bn')
    );
    if (bnVoice) {
      utterance.voice = bnVoice;
    }

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Handle Voice Input (Speech-to-Text)
  const toggleVoiceInput = () => {
    if (!sttSupported) {
      alert('আপনার ব্রাউজারে ভয়েস ইনপুট সমর্থিত নয়। ক্রোম বা এজ ব্রাউজার ব্যবহার করুন।');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'bn-BD';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setInputText((prev) => (prev ? `${prev} ${transcript.trim()}` : transcript.trim()));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Error starting speech recognition:', err);
      setIsListening(false);
    }
  };

  // Build live app context with factual data and UPPERCASE English
  const buildLiveAppContext = () => {
    return {
      instituteName: 'দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট, ভোলা',
      departments: DPIB_DEPARTMENTS,
      activeExamsCount: exams.length,
      exams: exams.slice(0, 8).map((e) => ({
        id: e.id,
        title: e.title,
        semesterId: e.semesterId,
        departmentName: e.departmentName,
        examDate: e.examDate,
        totalMarks: e.totalMarks,
        status: e.status,
      })),
      recentNotices: notices.slice(0, 6).map((n) => ({
        id: n.id,
        title: n.title,
        date: n.publishedDate,
        category: n.category,
      })),
      semesters: ['১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম'],
      defaultPassMark: '৪০%',
    };
  };

  // Handle Roll Search
  const handleRollSearch = async (rollToSearch?: string) => {
    const targetRoll = (rollToSearch || rollInput).trim();
    if (!targetRoll) return;

    const cleanRoll = toEnglishDigits(targetRoll);
    setIsSearchingRoll(true);

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      text: `বোর্ড রোল: ${toBanglaDigits(cleanRoll)}-এর পরীক্ষার ফলাফল ও বিস্তারিত বিশ্লেষণ দেখতে চাই।`,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setRollInput('');

    try {
      const allResults = await searchAllPublicResults({ roll: cleanRoll });
      const result = allResults[0] || null;

      if (!result) {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-res`,
            role: 'assistant',
            text: `বোর্ড রোল নম্বর "${toBanglaDigits(cleanRoll)}"-এর কোনো প্রকাশিত ফলাফল বর্তমানে ডেটাবেসে পাওয়া যায়নি।\n\nঅনুগ্রহ করে নিশ্চিত করুন যে:\n১. রোল নম্বরটি সঠিক রয়েছে।\n২. উক্ত রোল নম্বরের পরীক্ষার ফলাফল ইতিমধ্যে কর্তৃপক্ষ কর্তৃক প্রকাশিত হয়েছে।\n\nআপনি পাসের শর্ত, নোটিশ বা পরীক্ষার তালিকা সম্পর্কে জানতে পারেন।`,
            timestamp: Date.now(),
          },
        ]);
        setIsSearchingRoll(false);
        return;
      }

      setCurrentResultContext(result);

      // Analyze weak / failed subjects
      const failedSubjects = result.subjects.filter((s) => !s.isPassed || s.grade === 'F');
      const weakSubjects = result.subjects.filter((s) => s.isPassed && (s.grade === 'D' || s.grade === 'C'));

      let analysisSummary = `শিক্ষার্থীর নাম: ${result.studentName}\nরোল: ${toBanglaDigits(result.roll)}\nটেকনোলজি: ${result.departmentName}\nপর্ব: ${SEMESTER_MAP[result.semesterId] || result.semesterId + 'ম সেমিস্টার'}\nপরীক্ষা: ${result.examTitle}\n\nমোট প্রাপ্ত নম্বর: ${toBanglaDigits(result.totalObtainedMarks)} / ${toBanglaDigits(result.totalFullMarks)}\nGPA: ${toBanglaDigits(result.gpa.toFixed(2))} (গ্রেড: ${result.letterGrade})\nফলাফল অবস্থা: ${result.isPassed ? 'উত্তীর্ণ (পাস)' : 'অনুত্তীর্ণ (ফেল)'}\n`;

      if (allResults.length > 1) {
        analysisSummary += `\n[দ্রষ্টব্য]: এই রোল নম্বরে মোট ${toBanglaDigits(allResults.length)}টি পরীক্ষার ফলাফল প্রকাশিত রয়েছে। এখানে সর্বশেষ পরীক্ষা "${result.examTitle}"-এর বিশ্লেষণ দেওয়া হলো।\n`;
      }

      if (failedSubjects.length > 0) {
        analysisSummary +=
          `\nঅনুত্তীর্ণ বিষয় (${toBanglaDigits(failedSubjects.length)}টি):\n` +
          failedSubjects
            .map(
              (s) =>
                `• ${s.subjectName} (${s.subjectCode}): প্রাপ্ত নম্বর ${toBanglaDigits(s.obtainedMarks)} / ${toBanglaDigits(s.fullMarks)} (গ্রেড: ${s.grade})`
            )
            .join('\n');
      }

      if (weakSubjects.length > 0) {
        analysisSummary +=
          `\n\nউন্নতি প্রয়োজন এমন বিষয়:\n` +
          weakSubjects
            .map(
              (s) =>
                `• ${s.subjectName}: প্রাপ্ত নম্বর ${toBanglaDigits(s.obtainedMarks)} / ${toBanglaDigits(s.fullMarks)} (গ্রেড: ${s.grade})`
            )
            .join('\n');
      }

      // Query AI for personalized study advice based on real DB result
      try {
        const response = await fetch('/api/assistant/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `রোল নম্বর ${cleanRoll}-এর প্রকৃত ফলাফল ডেটাবেস থেকে পাওয়া গেছে। সংক্ষেপে ফলাফল জানিয়ে দুর্বল বা অনুত্তীর্ণ বিষয়গুলোতে ভালো করার সুনির্দিষ্ট বিষয়ভিত্তিক পরামর্শ ও স্টাডি প্ল্যান দিন।`,
            studentResultContext: {
              studentName: result.studentName,
              roll: result.roll,
              departmentName: result.departmentName,
              semester: result.semesterId,
              examTitle: result.examTitle,
              gpa: result.gpa,
              isPassed: result.isPassed,
              letterGrade: result.letterGrade,
              subjects: result.subjects.map((s) => ({
                code: s.subjectCode,
                name: s.subjectName,
                fullMarks: s.fullMarks,
                obtainedMarks: s.obtainedMarks,
                grade: s.grade,
                isPassed: s.isPassed,
              })),
            },
            appContext: buildLiveAppContext(),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-${Date.now()}-ai`,
              role: 'assistant',
              text: data.reply || analysisSummary,
              timestamp: Date.now(),
              resultData: result,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-${Date.now()}-res`,
              role: 'assistant',
              text:
                analysisSummary +
                '\n\nপরামর্শ: উল্লেখিত বিষয়গুলোতে নিয়মিত অনুশীলনের পাশাপাশি পূর্ববর্তী সেমিস্টারের প্রশ্ন সমাধান করুন।',
              timestamp: Date.now(),
              resultData: result,
            },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-res`,
            role: 'assistant',
            text: analysisSummary,
            timestamp: Date.now(),
            resultData: result,
          },
        ]);
      }
    } catch (err) {
      console.warn('Error during assistant roll search:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-info`,
          role: 'assistant',
          text: `রোল নম্বর "${toBanglaDigits(cleanRoll)}"-এর তথ্য অনুসন্ধানকালে ডেটাবেস থেকে কোনো উত্তর পাওয়া যায়নি।`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsSearchingRoll(false);
    }
  };

  // Send Custom User Prompt
  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputText).trim();
    if (!messageText || isLoading) return;

    // Check if input directly looks like a roll number (5-7 digits)
    const englishDigits = toEnglishDigits(messageText);
    if (/^\d{5,7}$/.test(englishDigits)) {
      handleRollSearch(englishDigits);
      setInputText('');
      return;
    }

    // Check if input contains roll query (e.g., "রোল 601234 এর রেজাল্ট কি")
    const embeddedRollMatch = englishDigits.match(/(?:রোল|roll|বোর্ড রোল)\s*[:=]?\s*(\d{5,7})/i) ||
      englishDigits.match(/\b(\d{6})\b/);
    if (embeddedRollMatch && embeddedRollMatch[1] && !currentResultContext) {
      // Auto-fetch roll result first to enrich context
      try {
        const found = await searchAllPublicResults({ roll: embeddedRollMatch[1] });
        if (found && found.length > 0) {
          setCurrentResultContext(found[0]);
        }
      } catch {}
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      text: messageText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Build conversation history (excluding greeting)
      const conversationHistory = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-8)
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const appContext = buildLiveAppContext();

      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: messageText,
          conversationHistory,
          studentResultContext: currentResultContext
            ? {
                studentName: currentResultContext.studentName,
                roll: currentResultContext.roll,
                departmentName: currentResultContext.departmentName,
                semester: currentResultContext.semesterId,
                examTitle: currentResultContext.examTitle,
                gpa: currentResultContext.gpa,
                letterGrade: currentResultContext.letterGrade,
                isPassed: currentResultContext.isPassed,
                subjects: currentResultContext.subjects,
              }
            : null,
          appContext,
        }),
      });

      let replyContent = '';
      if (response.ok) {
        const data = await response.json();
        replyContent = data.reply || '';
      }

      if (!replyContent) {
        replyContent = getClientAssistantFallback(messageText, currentResultContext, exams, notices);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          text: replyContent,
          timestamp: Date.now(),
        },
      ]);
    } catch (err) {
      console.warn('Network request to DPIB Assistant failed, using smart local engine:', err);
      const fallbackReply = getClientAssistantFallback(messageText, currentResultContext, exams, notices);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-assistant-fb`,
          role: 'assistant',
          text: fallbackReply,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset / Clear Chat session
  const handleResetChat = () => {
    stopSpeech();
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: 'নতুন চ্যাট শুরু করা হয়েছে। আপনি আপনার রোল নম্বর লিখে ফলাফল বিশ্লেষণ দেখতে পারেন অথবা পরীক্ষা, সেমিস্টার, টেকনোলজি ও নোটিশ সম্পর্কে যেকোনো প্রশ্ন করতে পারেন।',
        timestamp: Date.now(),
      },
    ]);
    setCurrentResultContext(null);
    setRollInput('');
    setInputText('');
  };

  return (
    <>
      {/* ================= FLOATING GLASSMORPHISM AI BUTTON ================= */}
      <div className="fixed bottom-32 sm:bottom-20 right-4 sm:right-8 z-40 select-none">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="DPIB AI ACADEMIC ASSISTANT"
          title="DPIB AI ACADEMIC ASSISTANT"
          className="relative group flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 text-white shadow-xl shadow-teal-900/25 border-2 border-white/60 backdrop-blur-xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
        >
          {/* Subtle pulse ring */}
          <span className="absolute -inset-1 rounded-full bg-teal-400 opacity-30 group-hover:opacity-60 blur-xs animate-pulse pointer-events-none" />

          {/* SVG Bot Icon */}
          <Bot className="w-7 h-7 sm:w-8 sm:h-8 text-white relative z-10 transition-transform duration-300 group-hover:rotate-6" />

          {/* Status badge */}
          <span className="absolute top-1 right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-teal-800 z-20" />

          {/* Label tooltip */}
          <span className="absolute bottom-full mb-2 right-0 bg-slate-900/90 text-white text-[11px] font-bold px-3 py-1 rounded-xl shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-700 font-bengali">
            DPIB AI ASSISTANT
          </span>
        </button>
      </div>

      {/* ================= BOTTOM SHEET / MODAL ================= */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-bengali">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Assistant Sheet Container */}
          <div
            className={`relative w-full bg-white flex flex-col overflow-hidden shadow-2xl transition-all duration-300 z-10 border border-slate-200/90 ${
              isExpanded
                ? 'h-[92vh] sm:h-[88vh] sm:max-w-3xl sm:rounded-3xl rounded-t-3xl'
                : 'h-[85vh] sm:h-[700px] sm:max-w-xl sm:rounded-3xl rounded-t-3xl'
            }`}
          >
            {/* Header with Glassmorphism */}
            <div className="px-4 py-3.5 bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-700 text-white flex items-center justify-between shadow-xs shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-2xs">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm sm:text-base tracking-tight leading-tight">
                      DPIB AI ACADEMIC ASSISTANT
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-400/25 text-emerald-100 text-[10px] font-bold border border-emerald-300/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                      LIVE AI
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-100/90 font-medium">
                    দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট শিক্ষার্থী সহায়তা
                  </p>
                </div>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="নতুন চ্যাট শুরু করুন"
                  className="px-2.5 py-1.5 rounded-xl text-teal-100 hover:text-white hover:bg-white/15 transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">নতুন চ্যাট</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'ছোট করুন' : 'বড় করুন'}
                  className="hidden sm:flex p-2 rounded-xl text-teal-100 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="বন্ধ করুন"
                  className="p-2 rounded-xl text-teal-100 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Roll Search Bar Inside Assistant */}
            <div className="p-3 bg-teal-50/70 border-b border-teal-100/80 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRollSearch();
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={rollInput}
                    onChange={(e) => setRollInput(e.target.value)}
                    placeholder="রোল নম্বর দিয়ে ফলাফল ও দুর্বল বিষয় খুঁজুন (যেমন: 601234)"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-teal-200 rounded-xl focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600 font-semibold text-slate-800 placeholder-slate-400 shadow-2xs"
                  />
                  <Search className="w-4 h-4 text-teal-700 absolute left-3 top-2.5" />
                </div>
                <button
                  type="submit"
                  disabled={isSearchingRoll || !rollInput.trim()}
                  className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSearchingRoll ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>ফলাফল বিশ্লেষণ</span>
                  )}
                </button>
              </form>
            </div>

            {/* Chat Messages Flow */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/60">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[82%] rounded-2xl p-3.5 text-xs sm:text-[13px] leading-relaxed shadow-xs relative group ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-teal-700 to-teal-800 text-white rounded-tr-xs'
                        : msg.error
                        ? 'bg-rose-50 border border-rose-200 text-rose-950 rounded-tl-xs'
                        : 'bg-white border border-slate-200/90 text-slate-900 rounded-tl-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-normal">
                      {msg.text}
                    </div>

                    {/* Interactive Result Card Snippet if result attached */}
                    {msg.resultData && (
                      <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-teal-900 font-bold">
                            {msg.resultData.studentName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              msg.resultData.isPassed
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-rose-100 text-rose-900'
                            }`}
                          >
                            {msg.resultData.isPassed ? 'পাস' : 'ফেল'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-200 font-semibold text-slate-700">
                          <div>রোল: {toBanglaDigits(msg.resultData.roll)}</div>
                          <div>GPA: {toBanglaDigits(msg.resultData.gpa.toFixed(2))}</div>
                          <div>মোট নম্বর: {toBanglaDigits(msg.resultData.totalObtainedMarks)}</div>
                          <div>গ্রেড: {msg.resultData.letterGrade}</div>
                        </div>

                        {onOpenResultModal && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenResultModal(msg.resultData!);
                              setIsOpen(false);
                            }}
                            className="w-full mt-1.5 py-1.5 text-center text-[11px] font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>মূল ডিজিটাল গ্রেডশিট দেখুন</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Assistant Message Action Buttons (Copy + TTS) */}
                    {msg.role === 'assistant' && msg.id !== 'welcome' && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                        {/* Copy button */}
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.id, msg.text)}
                          title="উত্তর কপি করুন"
                          className="px-2 py-1 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-100 transition-colors text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 text-[10px]">কপি হয়েছে</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[10px]">কপি</span>
                            </>
                          )}
                        </button>

                        {/* Text to Speech button */}
                        {ttsSupported && (
                          <button
                            type="button"
                            onClick={() => handleToggleSpeech(msg.id, msg.text)}
                            title={speakingMessageId === msg.id ? 'পড়া বন্ধ করুন' : 'উচ্চস্বরে শুনুন'}
                            className={`px-2 py-1 rounded-lg transition-colors text-[11px] font-medium flex items-center gap-1 cursor-pointer ${
                              speakingMessageId === msg.id
                                ? 'bg-teal-100 text-teal-800 animate-pulse'
                                : 'text-slate-500 hover:text-teal-700 hover:bg-slate-100'
                            }`}
                          >
                            {speakingMessageId === msg.id ? (
                              <>
                                <VolumeX className="w-3 h-3 text-teal-800" />
                                <span className="text-[10px]">বন্ধ করুন</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3 h-3" />
                                <span className="text-[10px]">শুনুন</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <div className="flex items-start gap-2">
                  <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-3.5 text-xs text-slate-500 flex items-center gap-2.5 shadow-2xs">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <span className="text-[11px] font-bold text-teal-800">
                      DPIB AI উত্তর তৈরি করছে...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Category Buttons with Clean SVG Icons */}
            <div className="px-3 py-2 bg-slate-100/80 border-t border-slate-200/80 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1 mr-1">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>কুইক অ্যাকশন:</span>
              </span>
              {QUICK_ACTIONS.map((item) => {
                const ActionIcon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSendMessage(item.prompt)}
                    disabled={isLoading || isSearchingRoll}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200/90 hover:border-teal-300 rounded-xl whitespace-nowrap transition-all shadow-2xs cursor-pointer shrink-0 disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <ActionIcon className="w-3 h-3 text-teal-600 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Voice listening status indicator if active */}
            {isListening && (
              <div className="px-4 py-1.5 bg-rose-50 border-t border-rose-200 flex items-center justify-between text-xs text-rose-700 font-semibold shrink-0 animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                  <span>শুনছি... আপনার প্রশ্ন বাংলায় বলুন</span>
                </div>
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className="text-[11px] text-rose-800 underline font-bold cursor-pointer"
                >
                  রেকর্ডিং শেষ
                </button>
              </div>
            )}

            {/* Input Form with Voice Button */}
            <div className="p-3 bg-white border-t border-slate-200 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                {/* Voice Input Button */}
                {sttSupported && (
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    title={isListening ? 'ভয়েস ইনপুট বন্ধ করুন' : 'বাংলায় কথা বলে প্রশ্ন করুন'}
                    className={`p-2.5 rounded-2xl transition-all shadow-2xs flex items-center justify-center shrink-0 cursor-pointer ${
                      isListening
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-800 border border-slate-200'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}

                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="বাংলায় আপনার প্রশ্ন লিখুন বা বোর্ড রোল নম্বর দিন..."
                  className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600 font-normal text-slate-800 transition-all shadow-2xs"
                  disabled={isLoading || isSearchingRoll}
                />

                <button
                  type="submit"
                  disabled={isLoading || isSearchingRoll || !inputText.trim()}
                  title="পাঠান"
                  className="p-2.5 sm:px-4 sm:py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white rounded-2xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-bold">পাঠান</span>
                </button>
              </form>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>DPIB AI শুধুমাত্র অনুমোদিত ও প্রকাশিত অ্যাকাডেমিক তথ্যের ভিত্তিতে উত্তর দেয়।</span>
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="চ্যাট হিস্ট্রি মুছুন"
                  className="text-slate-400 hover:text-teal-700 underline cursor-pointer ml-2 shrink-0 flex items-center gap-0.5"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  <span>ক্লিয়ার</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
