import React, { useState, useEffect, useRef } from 'react';
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
  TrendingDown,
  Award,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';
import { StudentResult, Exam, Notice } from '../../types';
import { toBanglaDigits, toEnglishDigits, SEMESTER_MAP } from '../../utils/bangla';
import { searchPublicResult, searchAllPublicResults } from '../../services/db';

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

const QUICK_QUESTIONS = [
  'আমার ফলাফল কীভাবে দেখব?',
  'কোন বিষয়ে আমার উন্নতি করা দরকার?',
  'পাসের শর্ত কী?',
  'পরীক্ষার রুটিন কোথায় পাব?',
  'নোটিশ ও ছুটির তথ্য কোথায় পাব?',
];

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
      text: 'আসসালামু আলাইকুম। আমি DPIB অ্যাসিস্ট্যান্ট। দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউটের শিক্ষার্থী পোর্টালে আপনাকে স্বাগতম। আপনি আপনার রোল নম্বর দিয়ে পরীক্ষার ফলাফল বিশ্লেষণ দেখতে পারেন, অথবা নিচের কুইক প্রশ্নগুলো থেকে সরাসরি জানতে পারেন।',
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Roll Search Quick Bar inside Assistant
  const [rollInput, setRollInput] = useState('');
  const [isSearchingRoll, setIsSearchingRoll] = useState(false);
  const [currentResultContext, setCurrentResultContext] = useState<StudentResult | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Handle Roll Search
  const handleRollSearch = async (rollToSearch?: string) => {
    const targetRoll = (rollToSearch || rollInput).trim();
    if (!targetRoll) return;

    const cleanRoll = toEnglishDigits(targetRoll);
    setIsSearchingRoll(true);

    // Add user query
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      text: `রোল নম্বর: ${toBanglaDigits(cleanRoll)}-এর পরীক্ষার ফলাফল ও বিস্তারিত বিশ্লেষণ জানতে চাই।`,
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
            text: `দুঃখিত, রোল নম্বর "${toBanglaDigits(cleanRoll)}"-এর কোনো প্রকাশিত ফলাফল বর্তমানে ডেটাবেসে পাওয়া যায়নি। অনুগ্রহ করে নিশ্চিত করুন যে রোল নম্বরটি সঠিক এবং পরীক্ষার ফলাফল ইতিমধ্যে প্রকাশিত হয়েছে।`,
            timestamp: Date.now(),
            error: true,
          },
        ]);
        setIsSearchingRoll(false);
        return;
      }

      setCurrentResultContext(result);

      // Analyze weak / failed subjects
      const failedSubjects = result.subjects.filter((s) => !s.isPassed || s.grade === 'F');
      const weakSubjects = result.subjects.filter((s) => s.isPassed && (s.grade === 'D' || s.grade === 'C'));

      let analysisSummary = `শিক্ষার্থীর নাম: ${result.studentName}\nরোল: ${toBanglaDigits(result.roll)}\nটেকনোলজি: ${result.departmentName}\nপর্ব: ${SEMESTER_MAP[result.semesterId] || result.semesterId}\nপরীক্ষা: ${result.examTitle}\n\nমোট প্রাপ্ত নম্বর: ${toBanglaDigits(result.totalObtainedMarks)} / ${toBanglaDigits(result.totalFullMarks)}\nজিপিএ (GPA): ${toBanglaDigits(result.gpa.toFixed(2))} (গ্রেড: ${result.letterGrade})\nফলাফল অবস্থা: ${result.isPassed ? 'উত্তীর্ণ (পাস)' : 'অনুত্তীর্ণ (ফেল)'}\n`;

      if (allResults.length > 1) {
        analysisSummary += `\n📌 দ্রষ্টব্য: এই রোল নম্বরে মোট ${toBanglaDigits(allResults.length)}টি পরীক্ষার ফলাফল প্রকাশিত রয়েছে। এখানে সর্বশেষ পরীক্ষা "${result.examTitle}"-এর বিশ্লেষণ দেওয়া হলো।\n`;
      }

      if (failedSubjects.length > 0) {
        analysisSummary += `\nঅনুত্তীর্ণ বিষয় (${toBanglaDigits(failedSubjects.length)}টি):\n` +
          failedSubjects.map((s) => `• ${s.subjectName} (${s.subjectCode}): প্রাপ্ত নম্বর ${toBanglaDigits(s.obtainedMarks)} / ${toBanglaDigits(s.fullMarks)} (গ্রেড: ${s.grade})`).join('\n');
      }

      if (weakSubjects.length > 0) {
        analysisSummary += `\n\nউন্নতি প্রয়োজন এমন বিষয়:\n` +
          weakSubjects.map((s) => `• ${s.subjectName}: প্রাপ্ত নম্বর ${toBanglaDigits(s.obtainedMarks)} / ${toBanglaDigits(s.fullMarks)} (গ্রেড: ${s.grade})`).join('\n');
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
              subjects: result.subjects.map((s) => ({
                code: s.subjectCode,
                name: s.subjectName,
                fullMarks: s.fullMarks,
                obtainedMarks: s.obtainedMarks,
                grade: s.grade,
                isPassed: s.isPassed,
              })),
            },
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
              text: analysisSummary + '\n\nপরামর্শ: উল্লেখিত বিষয়গুলোতে নিয়মিত অনুশীলনের পাশাপাশি পূর্ববর্তী সেমিস্টারের প্রশ্ন সমাধান করুন।',
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
      console.error('Error during assistant roll search:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          role: 'assistant',
          text: 'ফলাফল অনুসন্ধানের সময় একটি ত্রুটি ঘটেছে। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।',
          timestamp: Date.now(),
          error: true,
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

    // Check if input looks like a raw roll number (5-7 digits)
    const englishDigits = toEnglishDigits(messageText);
    if (/^\d{5,7}$/.test(englishDigits)) {
      handleRollSearch(englishDigits);
      setInputText('');
      return;
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
        .slice(-6)
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      // Basic app context for real answers
      const appContext = {
        instituteName: 'দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট, ভোলা',
        activeExamsCount: exams.length,
        recentNotices: notices.slice(0, 5).map((n) => ({
          title: n.title,
          date: n.publishedDate,
          category: n.category,
        })),
        defaultPassMark: '৪০%',
      };

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
                isPassed: currentResultContext.isPassed,
                subjects: currentResultContext.subjects,
              }
            : null,
          appContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Server returned error');
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          text: data.reply || 'দুঃখিত, কোনো উত্তর পাওয়া যায়নি।',
          timestamp: Date.now(),
        },
      ]);
    } catch (err) {
      console.error('Error querying DPIB Assistant API:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-assistant-err`,
          role: 'assistant',
          text: 'সহকারী সার্ভারের সাথে সংযোগে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।',
          timestamp: Date.now(),
          error: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: 'চ্যাটটি নতুন করে শুরু করা হয়েছে। আপনি আপনার রোল নম্বর দিয়ে পরীক্ষার ফলাফল বিশ্লেষণ দেখতে পারেন অথবা যেকোনো প্রশ্ন জিজ্ঞাসা করতে পারেন।',
        timestamp: Date.now(),
      },
    ]);
    setCurrentResultContext(null);
  };

  return (
    <>
      {/* ================= FLOATING GLASSMORPHISM AI BUTTON ================= */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 select-none">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="DPIB অ্যাসিস্ট্যান্ট ওপেন করুন"
          title="DPIB অ্যাসিস্ট্যান্ট"
          className="relative group flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 text-white shadow-xl shadow-teal-900/25 border-2 border-white/60 backdrop-blur-xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
        >
          {/* Subtle pulse ring */}
          <span className="absolute -inset-1 rounded-full bg-teal-400 opacity-30 group-hover:opacity-60 blur-xs animate-pulse pointer-events-none" />

          {/* SVG Bot Icon */}
          <Bot className="w-7 h-7 sm:w-8 sm:h-8 text-white relative z-10 transition-transform duration-300 group-hover:rotate-6" />

          {/* Label tooltip */}
          <span className="absolute bottom-full mb-2 right-0 bg-slate-900/90 text-white text-[11px] font-bold px-3 py-1 rounded-xl shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-700 font-bengali">
            DPIB অ্যাসিস্ট্যান্ট
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
                : 'h-[82vh] sm:h-[680px] sm:max-w-xl sm:rounded-3xl rounded-t-3xl'
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
                      DPIB অ্যাসিস্ট্যান্ট
                    </h3>
                    <span className="px-2 py-0.2 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-bold border border-emerald-300/30">
                      স্মার্ট এআই
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
                  className="p-2 rounded-xl text-teal-100 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
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
                    placeholder="রোল নম্বর দিয়ে ফলাফল ও দুর্বল বিষয় খুঁজুন (উদা: 589412)"
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                      msg.role === 'user'
                        ? 'bg-teal-700 text-white rounded-tr-xs'
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
                          <span className="text-teal-900">
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
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start gap-2">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3 text-xs text-slate-500 flex items-center gap-2 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] font-bold text-slate-600 ml-1">
                      DPIB অ্যাসিস্ট্যান্ট উত্তর তৈরি করছে...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions Pills */}
            <div className="px-3 py-2 bg-slate-100/70 border-t border-slate-200/80 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-600" />
                <span>দ্রুত প্রশ্ন:</span>
              </span>
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  disabled={isLoading || isSearchingRoll}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200/90 hover:border-teal-300 rounded-xl whitespace-nowrap transition-all shadow-2xs cursor-pointer shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <div className="p-3 bg-white border-t border-slate-200 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="বাংলায় আপনার প্রশ্ন লিখুন অথবা রোল নম্বর দিন..."
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
              <div className="mt-1.5 text-center">
                <p className="text-[10px] text-slate-400">
                  DPIB অ্যাসিস্ট্যান্ট শুধুমাত্র অনুমোদিত ও প্রকাশিত একাডেমিক তথ্যের ভিত্তিতে উত্তর দিয়ে থাকে।
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
