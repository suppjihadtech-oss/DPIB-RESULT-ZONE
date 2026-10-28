import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI SDK with server-side API Key
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
} else {
  console.warn('[SERVER] GEMINI_API_KEY is not set. DPIB Assistant fallback responses will be used.');
}

// System prompt for DPIB AI Academic Assistant
const DPIB_SYSTEM_INSTRUCTION = `
তুমি "দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট, ভোলা" (DPIB)-এর অফিসিয়াল "AI ACADEMIC ASSISTANT"।
তোমার কাজ শিক্ষার্থীদের এবং পোর্টাল ব্যবহারকারীদের ফলাফল (RESULT), পরীক্ষা (EXAM), পর্ব/সেমিস্টার (SEMESTER), টেকনোলজি/বিভাগ (TECHNOLOGY) এবং নোটিশ (NOTICE) সম্পর্কিত প্রশ্নের সঠিক, প্রাসঙ্গিক ও আন্তরিক সহায়তা প্রদান করা।

কঠোর আচরণবিধি ও নীতিমালা:
১. ভাষা ও ফন্ট: সর্বদা প্রাতিষ্ঠানিক, সাবলীল, সহায়ক ও স্পষ্ট বাংলা ভাষায় উত্তর দেবে। কোনো অবস্থাতেই কোনো ইমোজি (Emoji) ব্যবহার করবে না। কোনো ইংরেজি শব্দ বা সংক্ষিপ্ত রূপ ব্যবহার করলে তা সম্পূর্ণ বড় হাতের (UPPERCASE) অক্ষরে লিখবে (যেমন: DPIB, RESULT, EXAM, SEMESTER, TECHNOLOGY, NOTICE, GPA, BTEB, CMT, CT, ET, MT, ENT, RAC)।
২. সত্যতা ও কঠোর অ্যান্টি-হ্যালুসিনেশন (ANTI-HALLUCINATION): তোমাকে প্রদত্ত ডেটাবেস কনটেক্সট (CONTEXT)-এর উপর ভিত্তি করে উত্তর দেবে। ডেটা অনুপস্থিত থাকলে নিজের থেকে কোনো মনগড়া তথ্য, কাল্পনিক রোল নম্বর, ভুয়া ফলাফল বা তারিখ বানিয়ে বলবে না। কোনো তথ্য ডেটাবেসে না থাকলে স্পষ্টভাবে বলবে: "এই তথ্যটি বর্তমানে ডেটাবেসে পাওয়া যায়নি।"
৩. ডেটা অ্যাক্সেস কন্ট্রোল ও গোপনীয়তা: ব্যক্তিগত শিক্ষার্থী তথ্যের গোপনীয়তা রক্ষা করবে। কোনো ব্যক্তিগত গোপনীয় তথ্য (ফোন নম্বর, পাসওয়ার্ড বা সংবেদনশীল ডেটা) প্রকাশ বা অনুমান করবে না। শুধুমাত্র অনুমোদিত পাবলিক একাডেমিক ফলাফল (রোল, মোট নম্বর, GPA, গ্রেড, পাস/ফেল, বিষয়ভিত্তিক প্রাপ্ত নম্বর) বিশ্লেষণ করবে।
৪. কভার করা ক্ষেত্রসমূহ:
   - RESULT (ফলাফল): রোল নম্বরের বিপরীতে বিষয়ভিত্তিক নম্বর, GPA, পাস/ফেল এবং দুর্বল বিষয় চিহ্নিত করে গঠনমূলক স্টাডি প্ল্যান ও পরামর্শ।
   - EXAM (পরীক্ষা): ডেটাবেসে থাকা সক্রিয় পরীক্ষা, সময়সূচি, পূর্ণমান ও স্ট্যাটাস।
   - SEMESTER (পর্ব): ১ম থেকে ৮ম পর্বের শিক্ষাক্রম ও BTEB গাইডলাইন।
   - TECHNOLOGY (টেকনোলজি): সিভিল (CIVIL TECHNOLOGY - CT), ইলেকট্রিক্যাল (ELECTRICAL TECHNOLOGY - ET), মেকানিক্যাল (MECHANICAL TECHNOLOGY - MT), কম্পিউটার (COMPUTER TECHNOLOGY - CMT), ইলেকট্রনিক্স (ELECTRONICS TECHNOLOGY - ENT), আরএসি (REFRIGERATION & AIR CONDITIONING - RAC)।
   - NOTICE (নোটিশ): প্রতিষ্ঠানের সাম্প্রতিক বিজ্ঞপ্তি, প্রকাশের তারিখ ও বিস্তারিত তথ্য।
   - GRADING (গ্রেডিং সিস্টেম): BTEB নিয়মে ৮০%+ = A+ (৪.০০), পাস মার্ক নূন্যতম ৪০%।
`;

// Intelligent Fallback Reply Engine when AI is slow, offline, or unavailable
function generateIntelligentAssistantReply(
  prompt: string,
  studentResultContext?: any,
  appContext?: any
): string {
  const cleanPrompt = (prompt || '').trim().toLowerCase();

  // 1. Result context analysis
  if (studentResultContext) {
    const { studentName, roll, gpa, isPassed, letterGrade, subjects, departmentName, semester, examTitle } = studentResultContext;
    const weakSubs = Array.isArray(subjects)
      ? subjects.filter((s: any) => !s.isPassed || s.grade === 'F' || s.grade === 'D' || s.grade === 'C')
      : [];
    const passedSubs = Array.isArray(subjects)
      ? subjects.filter((s: any) => s.isPassed && s.grade !== 'F' && s.grade !== 'D' && s.grade !== 'C')
      : [];

    if (
      cleanPrompt.includes('উন্নতি') ||
      cleanPrompt.includes('দুর্বল') ||
      cleanPrompt.includes('পরামর্শ') ||
      cleanPrompt.includes('দরকার') ||
      cleanPrompt.includes('পড়াশোনা') ||
      cleanPrompt.includes('স্টাডি প্ল্যান')
    ) {
      let advice = `শিক্ষার্থী ${studentName || ''} (রোল: ${roll || ''})-এর ফলাফল পর্যালোচনার ভিত্তিতে বিষয়ভিত্তিক পরামর্শ:\n\n`;
      if (weakSubs.length > 0) {
        advice += `নিম্নোক্ত বিষয়গুলোতে তুলনামূলক কম নম্বর বা দুর্বলতা পরিলক্ষিত হয়েছে:\n`;
        weakSubs.forEach((s: any) => {
          advice += `• ${s.name || s.subjectName || s.code || ''}: প্রাপ্ত নম্বর ${s.obtainedMarks || 0}/${s.fullMarks || 0} (গ্রেড: ${s.grade || ''})\n`;
        });
        advice += `\nগঠনমূলক স্টাডি প্ল্যান:\n`;
        advice += `১. দুর্বল বিষয়গুলোর বিগত ৩-৫ বছরের BTEB বোর্ড সমাপনী পরীক্ষার প্রশ্ন নিয়মিত সমাধান করুন।\n`;
        advice += `২. তত্ত্বীয় অংশে নূন্যতম ৪০% নম্বর নিশ্চিত করতে সংক্ষিপ্ত ও রচনামূলক প্রশ্নের কাঠামোগত অনুশীলন করুন।\n`;
        advice += `৩. ব্যবহারিক ক্লাসের ল্যাব এক্সপেরিমেন্টগুলো নিজ দায়িত্বে সম্পন্ন করে ল্যাব নোটবুক প্রস্তুত রাখুন।\n`;
        advice += `৪. সংশ্লিষ্ট বিষয়ের শিক্ষকের সাথে সরাসরি যোগাযোগ করে কঠিন অধ্যায়গুলো ঝালিয়ে নিন।`;
      } else {
        advice += `অভিনন্দন! আপনার ফলাফল অত্যন্ত সন্তোষজনক (GPA: ${gpa || ''}, গ্রেড: ${letterGrade || ''})। সবগুলো বিষয়েই ভালো অবস্থান রয়েছে। এই ধারাবাহিকতা বজায় রাখতে নিয়মিত রেফারেন্স বই ও ক্লাস নোট অনুসরণ করুন।`;
      }
      return advice;
    }

    // General result overview for this student
    return `শিক্ষার্থী: ${studentName || ''}\nবোর্ড রোল: ${roll || ''}\nটেকনোলজি: ${departmentName || 'কারিগরি'}\nপর্ব: ${semester || ''}ম সেমিস্টার\nপরীক্ষা: ${examTitle || ''}\n\n• মোট GPA: ${gpa ? Number(gpa).toFixed(2) : '০.০০'} (${letterGrade || ''})\n• অবস্থা: ${isPassed ? 'উত্তীর্ণ (পাস)' : 'অনুত্তীর্ণ (ফেল)'}\n• মোট বিষয়: ${Array.isArray(subjects) ? subjects.length : 0}টি\n\nফলাফলের বিস্তারিত গ্রেডশিট দেখতে মূল ফলাফল পেজ ভিজিট করুন। কোনো বিষয়ে নির্দিষ্ট পরামর্শ চাইলে জিজ্ঞাসা করতে পারেন।`;
  }

  // 2. Exam related queries
  if (
    cleanPrompt.includes('পরীক্ষা') ||
    cleanPrompt.includes('exam') ||
    cleanPrompt.includes('রুটিন') ||
    cleanPrompt.includes('সময়সূচি') ||
    cleanPrompt.includes('তারিখ')
  ) {
    let examInfo = `দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউটের পরীক্ষা সংক্রান্ত তথ্য:\n\n`;
    if (appContext && Array.isArray(appContext.exams) && appContext.exams.length > 0) {
      examInfo += `বর্তমানে সিস্টেমে অনুমোদিত ও অন্তর্ভুক্ত পরীক্ষাসমূহ:\n`;
      appContext.exams.slice(0, 6).forEach((ex: any, idx: number) => {
        examInfo += `${idx + 1}. ${ex.title || 'পরীক্ষা'} (${ex.semesterId ? ex.semesterId + 'ম পর্ব' : ''}) - তারিখ: ${ex.examDate || 'ঘোষিত'}\n`;
      });
      examInfo += `\nসকল পরীক্ষার বিস্তারিত তালিকা ও ফলাফল দেখতে 'পরীক্ষার তালিকা' মেনুতে যান।`;
    } else {
      examInfo += `১. ইনস্টিটিউটের সকল পরীক্ষা ও রুটিনের তথ্য পোর্টালের 'পরীক্ষার তালিকা' ও 'স্মার্ট ক্যালেন্ডার' ট্যাবে পাওয়া যাবে।\n`;
      examInfo += `২. চূড়ান্ত পরীক্ষার সময়সূচি নোটিশ বোর্ড থেকে ডাউনলোড করা যাবে।\n`;
      examInfo += `৩. কোনো পরীক্ষা বা রুটিন প্রকাশিত হলে তাৎক্ষণিকভাবে পোর্টালে হালনাগাদ করা হয়।`;
    }
    return examInfo;
  }

  // 3. Notice related queries
  if (cleanPrompt.includes('নোটিশ') || cleanPrompt.includes('বিজ্ঞপ্তি') || cleanPrompt.includes('ছুটি') || cleanPrompt.includes('আদেশ')) {
    let noticeInfo = `ইনস্টিটিউটের সাম্প্রতিক নোটিশ ও বিজ্ঞপ্তি:\n\n`;
    if (appContext && Array.isArray(appContext.recentNotices) && appContext.recentNotices.length > 0) {
      noticeInfo += `সর্বশেষ প্রকাশিত নোটিশসমূহ:\n`;
      appContext.recentNotices.slice(0, 5).forEach((n: any, idx: number) => {
        noticeInfo += `${idx + 1}. ${n.title} (তারিখ: ${n.date || 'সাম্প্রতিক'}${n.category ? `, বিভাগ: ${n.category}` : ''})\n`;
      });
      noticeInfo += `\nসম্পূর্ণ নোটিশ ও সার্কুলার পড়তে পোর্টালের 'নোটিশ' ট্যাবে প্রবেশ করুন।`;
    } else {
      noticeInfo += `১. ইনস্টিটিউটের সাম্প্রতিক সকল প্রশাসনিক বিজ্ঞপ্তি ও ছুটির নোটিশ দেখতে 'নোটিশ' ট্যাবে যান।\n`;
      noticeInfo += `২. সরকারি ছুটির দিন ও একাডেমিক কার্যক্রমের পূর্ণাঙ্গ দিনপঞ্জি দেখতে 'স্মার্ট ক্যালেন্ডার' ব্যবহার করুন।\n`;
      noticeInfo += `৩. গুরুত্বপূর্ণ নোটিশগুলো সর্বদা নোটিশ বোর্ডে পিন করা থাকে।`;
    }
    return noticeInfo;
  }

  // 4. Technology / Department queries
  if (
    cleanPrompt.includes('টেকনোলজি') ||
    cleanPrompt.includes('বিভাগ') ||
    cleanPrompt.includes('ডিপার্টমেন্ট') ||
    cleanPrompt.includes('technology') ||
    cleanPrompt.includes('department') ||
    cleanPrompt.includes('সিভিল') ||
    cleanPrompt.includes('কম্পিউটার') ||
    cleanPrompt.includes('ইলেকট্রিক্যাল') ||
    cleanPrompt.includes('মেকানিক্যাল')
  ) {
    return `দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউটের অনুমোদিত ডিপ্লোমা টেকনোলজিসমূহ:\n\n` +
      `১. কম্পিউটার টেকনোলজি (COMPUTER TECHNOLOGY - CMT)\n` +
      `২. সিভিল টেকনোলজি (CIVIL TECHNOLOGY - CT)\n` +
      `৩. ইলেকট্রিক্যাল টেকনোলজি (ELECTRICAL TECHNOLOGY - ET)\n` +
      `৪. মেকানিক্যাল টেকনোলজি (MECHANICAL TECHNOLOGY - MT)\n` +
      `৫. ইলেকট্রনিক্স টেকনোলজি (ELECTRONICS TECHNOLOGY - ENT)\n` +
      `৬. আরএসি টেকনোলজি (REFRIGERATION & AIR CONDITIONING - RAC)\n\n` +
      `প্রতিটি টেকনোলজির ১ম থেকে ৮ম পর্বের বিষয়ভিত্তিক সিলেবাস ও পাঠ্যবই দেখতে 'বুক লিস্ট' পেজ ভিজিট করতে পারেন।`;
  }

  // 5. Semester related queries
  if (
    cleanPrompt.includes('সেমিস্টার') ||
    cleanPrompt.includes('পর্ব') ||
    cleanPrompt.includes('semester') ||
    cleanPrompt.includes('পর্বভিত্তিক')
  ) {
    return `BTEB ডিপ্লোমা ইন ইঞ্জিনিয়ারিং শিক্ষাক্রম ৮টি পর্ব বা সেমিস্টারে বিভক্ত:\n\n` +
      `• ১ম পর্ব থেকে ৭ম পর্ব: তাত্ত্বিক ও ব্যবহারিক প্রাতিষ্ঠানিক ক্লাস এবং ল্যাব ওয়ার্ক।\n` +
      `• ৮ম পর্ব: শিল্প-কারখানা ভিত্তিক ব্যবহারিক প্রশিক্ষণ (INDUSTRIAL ATTACHMENT / TRAINING)।\n\n` +
      `প্রতিটি সেমিস্টারের বিষয় ও বুক লিস্ট দেখতে আমাদের 'বুক লিস্ট' ট্যাব ব্যবহার করুন।`;
  }

  // 6. Passing criteria & rules
  if (cleanPrompt.includes('পাসের শর্ত') || cleanPrompt.includes('পাস মার্ক') || cleanPrompt.includes('পাস করার নিয়ম') || cleanPrompt.includes('রেফার্ড')) {
    return `বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB) অনুমোদিত ডিপ্লোমা ইন ইঞ্জিনিয়ারিং শিক্ষাক্রমের পাসের সাধারণ নিয়মাবলি:\n\n` +
      `১. প্রতিটি বিষয়ে তত্ত্বীয় ধারাবাহিক (TC), তত্ত্বীয় সমাপনী (TF), ব্যবহারিক ধারাবাহিক (PC) এবং ব্যবহারিক সমাপনী (PF) প্রতিটি অংশে পৃথকভাবে পাস করতে হয়।\n` +
      `২. সার্বিকভাবে প্রতিটি অংশে নূন্যতম ৪০% নম্বর অর্জন করা আবশ্যক।\n` +
      `৩. কোনো বিষয়ে ৪০%-এর কম নম্বর পেলে বা পরীক্ষায় অনুপস্থিত থাকলে উক্ত বিষয়ে 'F' গ্রেড বা রেফার্ড আসবে।\n` +
      `৪. রেফার্ড বিষয়ে পরবর্তী নির্ধারিত পর্বে পুনঃপরীক্ষা দিয়ে উত্তীর্ণ হওয়া যায়। চূড়ান্ত ডিপ্লোমা সনদের জন্য সকল পর্বের সকল বিষয়ে উত্তীর্ণ হওয়া আবশ্যক।`;
  }

  // 7. Result search guide
  if (cleanPrompt.includes('ফলাফল') && (cleanPrompt.includes('কীভাবে') || cleanPrompt.includes('দেখব') || cleanPrompt.includes('খুঁজব'))) {
    return `DPIB RESULT ZONE-এ ফলাফল দেখার সহজ নিয়ম:\n\n` +
      `১. হোম পেজ অথবা উপরের 'ফলাফল অনুসন্ধান' মেনুতে প্রবেশ করুন।\n` +
      `২. আপনার সঠিক বোর্ড রোল নম্বর লিখুন।\n` +
      `৩. প্রযোজ্য ক্ষেত্রে আপনার সেমিস্টার ও পরীক্ষা নির্বাচন করুন।\n` +
      `৪. 'ফলাফল অনুসন্ধান করুন' বাটনে ক্লিক করুন।\n\n` +
      `আপনি তৎক্ষণাৎ আপনার বিষয়ভিত্তিক নম্বর, জিপিএ এবং অফিশিয়াল ডিজিটাল গ্রেডশিট দেখতে পাবেন। একই রোলে একাধিক পরীক্ষার ফলাফল থাকলে তালিকা থেকে নির্দিষ্ট পরীক্ষাটি বাছাই করতে পারবেন।`;
  }

  // 8. GPA calculator and grading scale
  if (cleanPrompt.includes('জিপিএ') || cleanPrompt.includes('গ্রেড') || cleanPrompt.includes('ক্যালকুলেটর') || cleanPrompt.includes('gpa')) {
    return `বিটিইবি ডিপ্লোমা গ্রেডিং স্কেল:\n\n` +
      `• ৮০% বা তদূর্ধ্ব: A+ (৪.০০)\n` +
      `• ৭৫% থেকে ৭৯%: A (৩.৭৫)\n` +
      `• ৭০% থেকে ৭৪%: A- (৩.৫০)\n` +
      `• ৬৫% থেকে ৬৯%: B+ (৩.২৫)\n` +
      `• ৬০% থেকে ৬৪%: B (৩.০০)\n` +
      `• ৫৫% থেকে ৫৯%: B- (২.৭৫)\n` +
      `• ৫০% থেকে ৫৪%: C+ (২.৫০)\n` +
      `• ৪৫% থেকে ৪৯%: C (২.২৫)\n` +
      `• ৪০% থেকে ৪৪%: D (২.০০)\n` +
      `• ৪০%-এর কম: F (০.০০ - অনুত্তীর্ণ)\n\n` +
      `সেমিস্টার জিপিএ সরাসরি গণনা করতে আমাদের 'জিপিএ ক্যালকুলেটর' মেনু ব্যবহার করুন।`;
  }

  // 9. Book list queries
  if (cleanPrompt.includes('বই') || cleanPrompt.includes('বুক লিস্ট') || cleanPrompt.includes('পাঠ্যবই')) {
    return `ডিপ্লোমা পাঠ্যবই ও বুক লিস্ট:\n\n` +
      `১. আপনার টেকনোলজি এবং বর্তমান সেমিস্টারের নির্ধারিত সকল পাঠ্যবই দেখতে 'বুক লিস্ট' পেজে যান।\n` +
      `২. সেখানে বিষয় কোড, ক্রেডিট সংখ্যা, আনুমানিক বাজার মূল্য এবং বিটিইবি অনুমোদিত বইয়ের বিবরণ পেয়ে যাবেন।\n` +
      `৩. সম্পূর্ণ বুক লিস্টটি এক ক্লিকে কপি বা প্রিন্ট করার সুবিধা রয়েছে।`;
  }

  // Default polite academic response
  return `আপনার প্রশ্নের জন্য ধন্যবাদ। দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট শিক্ষার্থী সহায়তা কেন্দ্রে আপনাকে স্বাগতম।\n\n` +
    `আপনি আপনার ফলাফল ও দুর্বল বিষয় বিশ্লেষণ দেখতে ইনপুটে আপনার বোর্ড রোল নম্বর (যেমন: 601234) প্রবেশ করাতে পারেন।\n\n` +
    `একাডেমিক তথ্যের জন্য নিচের যেকোনো অপশন জানতে পারেন:\n` +
    `• আমার ফলাফল কীভাবে দেখব?\n` +
    `• পাসের শর্ত ও গ্রেডিং সিস্টেম\n` +
    `• পরীক্ষার তালিকা ও সময়সূচি\n` +
    `• সাম্প্রতিক নোটিশসমূহ\n` +
    `• টেকনোলজি ও বিভাগসমূহ\n` +
    `• ডিপ্লোমা বুক লিস্ট ও পাঠ্যবই`;
}

// API Route for DPIB AI Academic Assistant
app.post('/api/assistant/chat', async (req, res) => {
  try {
    const { prompt, conversationHistory, studentResultContext, appContext } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    // Build context block with factual database records
    let contextBlock = '';
    if (studentResultContext) {
      contextBlock += `\n\n[শিক্ষার্থীর রেজাল্ট কনটেক্সট (অনুমোদিত ডেটাবেস থেকে প্রাপ্ত)]:\n${JSON.stringify(studentResultContext, null, 2)}`;
    }
    if (appContext) {
      contextBlock += `\n\n[ইনস্টিটিউট ও সিস্টেম লাইভ কনটেক্সট (পরীক্ষা, নোটিশ ও বিভাগসমূহ)]:\n${JSON.stringify(appContext, null, 2)}`;
    }

    if (!ai) {
      const fallback = generateIntelligentAssistantReply(prompt, studentResultContext, appContext);
      res.json({ reply: fallback });
      return;
    }

    // Build multi-turn chat contents array with strict alternating turns
    const contents: any[] = [];
    if (Array.isArray(conversationHistory)) {
      let lastRole: string | null = null;
      for (const msg of conversationHistory.slice(-6)) {
        if (!msg || !msg.text || typeof msg.text !== 'string' || !msg.text.trim()) continue;
        const role = msg.role === 'user' ? 'user' : 'model';
        if (role === lastRole) {
          contents[contents.length - 1].parts[0].text += `\n${msg.text.trim()}`;
        } else {
          contents.push({ role, parts: [{ text: msg.text.trim() }] });
          lastRole = role;
        }
      }
    }

    // Ensure first message is user
    while (contents.length > 0 && contents[0].role !== 'user') {
      contents.shift();
    }

    // Current turn message enriched with factual context
    const currentTurnText = contextBlock
      ? `${contextBlock}\n\nশিক্ষার্থীর প্রশ্ন: ${prompt}`
      : `শিক্ষার্থীর প্রশ্ন: ${prompt}`;

    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts[0].text += `\n\n${currentTurnText}`;
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: currentTurnText }],
      });
    }

    let replyText = '';

    // Fast call using gemini-3.8-flash with generous 15s timeout and concise tokens
    try {
      const modelCall = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: DPIB_SYSTEM_INSTRUCTION,
          maxOutputTokens: 800,
          temperature: 0.3,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI response timed out')), 15000)
      );

      const response: any = await Promise.race([modelCall, timeoutPromise]);
      if (response && response.text) {
        replyText = response.text;
      }
    } catch (aiErr: any) {
      console.warn('[API /api/assistant/chat] Gemini API failed or timed out, using intelligent local engine:', aiErr?.message || aiErr);
    }

    // If Gemini produced no text or failed, immediately generate smart rule-based answer
    if (!replyText || replyText.trim().length === 0) {
      replyText = generateIntelligentAssistantReply(prompt, studentResultContext, appContext);
    }

    res.json({ reply: replyText });
  } catch (error: any) {
    console.error('[API /api/assistant/chat Error]:', error);
    // Never fail with 500, always return graceful Bangla assistance
    const safeFallback = generateIntelligentAssistantReply(req.body?.prompt || '');
    res.json({ reply: safeFallback });
  }
});

async function startServer() {
  process.env.DISABLE_HMR = 'true';
  // Mount Vite development middlewares in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production serve dist
    app.use(express.static('dist'));
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[DPIB Server] Dev server running on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[DPIB Server] Failed to start:', err);
});
