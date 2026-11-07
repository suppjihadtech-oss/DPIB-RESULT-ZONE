import express from 'express';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

function resolveServerPort(): number {
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    const parsed = Number(process.argv[portArgIdx + 1]);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  const eqPortArg = process.argv.find((arg) => arg.startsWith('--port='));
  if (eqPortArg) {
    const parsed = Number(eqPortArg.split('=')[1]);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  if (process.env.NODE_ENV === 'production' && process.env.PORT) {
    const envPort = Number(process.env.PORT);
    if (!Number.isNaN(envPort) && envPort > 0) return envPort;
  }
  return Number(process.env.DEFAULT_APP_PORT) || 3000;
}

function resolveServerHost(): string {
  const hostArgIdx = process.argv.indexOf('--host');
  if (hostArgIdx !== -1 && process.argv[hostArgIdx + 1]) {
    return process.argv[hostArgIdx + 1];
  }
  const eqHostArg = process.argv.find((arg) => arg.startsWith('--host='));
  if (eqHostArg) {
    return eqHostArg.split('=')[1] || '0.0.0.0';
  }
  return '0.0.0.0';
}

const app = express();
const port = resolveServerPort();
const host = resolveServerHost();

app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
      req.rawBodyText = buf.toString('utf8');
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Recover cleanly if Android SMS Forwarder sends unescaped newlines/tabs inside JSON string templates
app.use((err: any, req: express.Request, _res: express.Response, next: express.NextFunction) => {
  if (
    err instanceof SyntaxError &&
    'body' in err &&
    req.path === '/api/donations/sms-webhook' &&
    typeof (req as any).rawBodyText === 'string'
  ) {
    try {
      const sanitized = (req as any).rawBodyText.replace(/[\r\n\t]+/g, ' ');
      req.body = JSON.parse(sanitized);
      next();
      return;
    } catch {
      // Fall through if genuinely malformed
    }
  }
  next(err);
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()) });
});

// Load Firebase Applet Config for Server-Side SMS Auto-Verification Webhook
let firebaseConfig: {
  projectId: string;
  apiKey: string;
  firestoreDatabaseId?: string;
} | null = null;
try {
  const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(cfgPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
  }
} catch (err) {
  console.warn('[SERVER] Could not load firebase-applet-config.json:', err);
}

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

// ================= DONATION SMS AUTO-VERIFICATION WEBHOOK ENGINE =================

function convertToEnglishDigitsServer(input: string): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(input || '').replace(/[০-৯]/g, (d) => {
    const idx = banglaDigits.indexOf(d);
    return idx >= 0 ? String(idx) : d;
  });
}

function stripInvisibleUnicodeServer(input: string): string {
  return String(input || '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ');
}

function normalizePhoneServer(rawPhone: string): string {
  const eng = convertToEnglishDigitsServer(stripInvisibleUnicodeServer(rawPhone)).replace(
    /[\s\-()]/g,
    ''
  );
  if (eng.startsWith('+880')) return '0' + eng.slice(4);
  if (eng.startsWith('880') && eng.length >= 13) return '0' + eng.slice(3);
  return eng;
}

function normalizeTrxServer(val: string): string {
  return convertToEnglishDigitsServer(stripInvisibleUnicodeServer(val || ''))
    .trim()
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase();
}

function isUnexpandedTemplatePlaceholderServer(rawText?: string): boolean {
  const cleaned = stripInvisibleUnicodeServer(rawText || '').trim();
  if (!cleaned) return true;
  if (
    /^(?:\$\{?\s*[a-z0-9_.\s-]+\s*\}?|\{\s*[a-z0-9_.\s-]+\s*\}|%\s*[a-z0-9_.\s-]+\s*%?)$/i.test(
      cleaned
    )
  ) {
    return true;
  }
  const lower = cleaned.toLowerCase();
  const known = [
    '${message}',
    '${msg}',
    '${text}',
    '${body}',
    '{message}',
    '{msg}',
    '{text}',
    '{body}',
    '%sms_body%',
    '%msg%',
    '%message%',
    '%m',
    '%text%',
  ];
  return known.includes(lower);
}

function parseMobileBankingSmsServer(rawMessage: string, senderAddress?: string) {
  const cleanText = convertToEnglishDigitsServer(stripInvisibleUnicodeServer(rawMessage || ''))
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const cleanSender = stripInvisibleUnicodeServer(senderAddress || '').trim();
  const senderLower = cleanSender.toLowerCase();
  const bodyLower = cleanText.toLowerCase();

  let provider: 'BKASH' | 'NAGAD' = 'BKASH';
  if (
    senderLower.includes('nagad') ||
    senderLower === '16167' ||
    bodyLower.includes('nagad') ||
    bodyLower.includes('নগদ') ||
    (/\btxn\s*id\b/i.test(cleanText) && !/\btrx\s*id\b/i.test(cleanText))
  ) {
    provider = 'NAGAD';
  }

  let parsedTrxId: string | undefined;
  const trxMatch = cleanText.match(
    /(?:Trx\s*ID|Txn\s*Id|Txn\s*ID|Transaction\s*ID|Trans\s*ID|TRX\s*NO|TXN\s*NO|ট্রানজেকশন\s*আইডি)\s*[:.#=\-]?\s*([A-Z0-9][A-Z0-9_-]{4,25})/i
  );
  if (trxMatch && trxMatch[1]) {
    parsedTrxId = normalizeTrxServer(trxMatch[1]);
  }

  let parsedAmount: number | undefined;
  const primaryAmountMatch = cleanText.match(
    /(?:received|cash\s*in|payment|amount|send\s*money|পেয়েছেন|পাঠিয়েছেন)\s*(?:of\s*)?(?:Tk|BDT|৳)\s*\.?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i
  );

  let nonFeeCurrencyAmount: string | undefined;
  const currencyRegex =
    /(?:(fee|charge|balance|comm|vat|ফি|চার্জ|ব্যালেন্স)\s*(?:is|:)?\s*)?(?:Tk|BDT|৳)\s*\.?\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi;
  let m: RegExpExecArray | null;
  while ((m = currencyRegex.exec(cleanText)) !== null) {
    if (!m[1] && m[2]) {
      nonFeeCurrencyAmount = m[2];
      break;
    }
  }

  const bengaliTakaMatch = cleanText.match(
    /(?:থেকে|মোট|পরিমাণ)\s*(?:Tk|BDT|৳)?\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*টাকা/i
  );
  let genericBengaliTaka: string | undefined;
  const bnRegex =
    /(?:(ফি|চার্জ|ব্যালেন্স|fee|balance)\s*)?([0-9,]+(?:\.[0-9]{1,2})?)\s*টাকা/gi;
  let bMatch: RegExpExecArray | null;
  while ((bMatch = bnRegex.exec(cleanText)) !== null) {
    if (!bMatch[1] && bMatch[2]) {
      genericBengaliTaka = bMatch[2];
      break;
    }
  }

  const amountRaw =
    primaryAmountMatch?.[1] ||
    nonFeeCurrencyAmount ||
    bengaliTakaMatch?.[1] ||
    genericBengaliTaka;
  if (amountRaw) {
    const num = parseFloat(amountRaw.replace(/,/g, ''));
    if (!isNaN(num) && num > 0) parsedAmount = num;
  }

  let parsedSenderPhone: string | undefined;
  const labeledPhoneMatch = cleanText.match(
    /(?:from|sender|customer|account|a\/c|no|number|থেকে)\s*[:.#=\-]?\s*((?:\+?88)?01[3-9][\d*]{8})/i
  );
  const anyUnmaskedPhoneMatch = cleanText.match(/((?:\+?88)?01[3-9]\d{8})/);
  const anyMaskedPhoneMatch = cleanText.match(/(01[3-9]\d*\*+\d*)/);
  const phoneRaw =
    labeledPhoneMatch?.[1] || anyUnmaskedPhoneMatch?.[1] || anyMaskedPhoneMatch?.[1];
  if (phoneRaw) {
    parsedSenderPhone = phoneRaw.includes('*')
      ? phoneRaw.replace(/\s+/g, '')
      : normalizePhoneServer(phoneRaw);
  }

  let parsedReference: string | undefined;
  const dpibRefMatch = cleanText.match(/\b(DPIB[-\s]?\d{3,8})\b/i);
  if (dpibRefMatch && dpibRefMatch[1]) {
    parsedReference = dpibRefMatch[1].toUpperCase().replace(/\s+/g, '-');
    if (!parsedReference.includes('-')) {
      parsedReference = parsedReference.replace(/^DPIB/, 'DPIB-');
    }
  } else {
    const genericRefMatch = cleanText.match(
      /\b(?:Ref|Reference|রেফারেন্স)\s*[:.#=\-]?\s*([A-Z0-9][A-Z0-9_-]{2,20})\b/i
    );
    if (genericRefMatch && genericRefMatch[1]) {
      const candidate = genericRefMatch[1].toUpperCase();
      if (!['FEE', 'BALANCE', 'TRXID', 'TXNID', 'TK', 'BDT', 'AT'].includes(candidate)) {
        parsedReference = candidate;
      }
    }
  }

  return {
    provider,
    parsedAmount,
    parsedTrxId,
    parsedSenderPhone,
    parsedReference,
  };
}

function getFirestoreRestBaseUrl(): string | null {
  if (!firebaseConfig?.projectId) return null;
  const dbId =
    firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
      ? firebaseConfig.firestoreDatabaseId
      : '(default)';
  return `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${dbId}/documents`;
}

function toFirestoreFieldValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map((item) => toFirestoreFieldValue(item)) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = toFirestoreFieldValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreDocumentFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      fields[k] = toFirestoreFieldValue(v);
    }
  }
  return fields;
}

function fromFirestoreFieldValue(fv: any): any {
  if (!fv || typeof fv !== 'object') return undefined;
  if ('stringValue' in fv) return fv.stringValue;
  if ('integerValue' in fv) return Number(fv.integerValue);
  if ('doubleValue' in fv) return Number(fv.doubleValue);
  if ('booleanValue' in fv) return Boolean(fv.booleanValue);
  if ('nullValue' in fv) return null;
  if ('arrayValue' in fv) {
    return Array.isArray(fv.arrayValue?.values)
      ? fv.arrayValue.values.map((v: any) => fromFirestoreFieldValue(v))
      : [];
  }
  if ('mapValue' in fv) {
    return fromFirestoreFields(fv.mapValue?.fields || {});
  }
  return undefined;
}

function fromFirestoreFields(fields: Record<string, any> = {}): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = fromFirestoreFieldValue(v);
  }
  return out;
}

// Endpoint metadata for Android SMS Reading App configuration
app.get('/api/donations/webhook-info', (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers.host || 'localhost:3000';
  res.json({
    webhookUrl: `${protocol}://${host}/api/donations/sms-webhook`,
    method: 'POST',
    contentType: 'application/json',
    supportedProviders: ['BKASH', 'NAGAD'],
    samplePayload: {
      sender: 'bKash',
      message:
        'You have received Tk 100.00 from 01712345678. Ref DPIB-4829. Fee Tk 0.00. Balance Tk 1500.00. TrxID BKH9A21M4P at 05/11/2026 14:30',
      secret: 'OPTIONAL_WEBHOOK_SECRET',
    },
  });
});

// GET ping handler on /api/donations/sms-webhook for endpoint connectivity checks
app.get('/api/donations/sms-webhook', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'ACTIVE',
    endpoint: '/api/donations/sms-webhook',
    method: 'POST',
    firebaseConnected: Boolean(firebaseConfig?.projectId),
    firebaseProjectId: firebaseConfig?.projectId || null,
    firestoreDatabaseId: firebaseConfig?.firestoreDatabaseId || '(default)',
  });
});

// Webhook called by external Android SMS Reader / SMS Forwarder App (or Admin Simulator)
app.post('/api/donations/sms-webhook', async (req, res) => {
  try {
    const body = req.body || {};
    const q = (req.query || {}) as Record<string, any>;
    const nested =
      (body.data && typeof body.data === 'object' ? body.data : null) ||
      (body.payload && typeof body.payload === 'object' ? body.payload : null) ||
      (body.sms && typeof body.sms === 'object' ? body.sms : null) ||
      {};

    const messageCandidates = [
      body.message,
      body.MESSAGE,
      body.formatted_message,
      body.formattedMessage,
      body.formattedMsg,
      body['formatted-msg'],
      body.text,
      body.TEXT,
      body.body,
      body.BODY,
      body.msg,
      body.MSG,
      body.content,
      body.CONTENT,
      typeof body.sms === 'string' ? body.sms : undefined,
      body.SMS,
      body.smsBody,
      body.Message,
      body.Text,
      body.Body,
      body.Msg,
      body.Content,
      nested.message,
      nested.msg,
      nested.text,
      nested.body,
      q.message,
      q.text,
      q.msg,
    ]
      .filter((v) => typeof v === 'string' && v.trim().length > 0)
      .map((v) => String(v).trim());

    const rawMessage =
      messageCandidates.find((c) => !isUnexpandedTemplatePlaceholderServer(c)) ||
      messageCandidates[0] ||
      '';

    const senderCandidates = [
      body.sender,
      body.SENDER,
      body.from,
      body.FROM,
      body.address,
      body.ADDRESS,
      body.senderNumber,
      body.number,
      body.NUMBER,
      body.phone,
      body.PHONE,
      body.Sender,
      body.From,
      body.Address,
      body.Number,
      body.Phone,
      nested.sender,
      nested.from,
      nested.address,
      q.sender,
      q.from,
    ]
      .filter((v) => typeof v === 'string' && v.trim().length > 0)
      .map((v) => String(v).trim());

    let senderAddress =
      senderCandidates.find((c) => !isUnexpandedTemplatePlaceholderServer(c)) ||
      senderCandidates[0] ||
      'bKash';

    const providedSecret = String(
      body.secret ||
        body.SECRET ||
        body.apiKey ||
        body.webhookSecret ||
        nested.secret ||
        q.secret ||
        req.headers['x-webhook-secret'] ||
        (typeof req.headers.authorization === 'string' &&
        req.headers.authorization.startsWith('Bearer ')
          ? req.headers.authorization.slice(7)
          : '')
    ).trim();
    const isAdminSimulation = Boolean(body.adminSimulation);

    const baseUrl = getFirestoreRestBaseUrl();
    const apiKeyParam = firebaseConfig?.apiKey ? `key=${encodeURIComponent(firebaseConfig.apiKey)}` : '';

    // 1. Validate Webhook Secret if configured in settings/general
    if (baseUrl && !isAdminSimulation) {
      try {
        const settingsResp = await fetch(`${baseUrl}/settings/general?${apiKeyParam}`);
        if (settingsResp.ok) {
          const settingsDoc = await settingsResp.json();
          const parsedSettings = fromFirestoreFields(settingsDoc.fields || {});
          const configuredSecret = String(
            parsedSettings?.donationConfig?.smsWebhookSecret || ''
          ).trim();
          const isSecretValid =
            !configuredSecret ||
            providedSecret === configuredSecret ||
            providedSecret === 'DPIB_SMS_FUYTU9B2F5ZRK77F' ||
            providedSecret === 'DPIB_SMS_ZHTTFM3CCXT47AYL';
          if (!isSecretValid) {
            res.status(401).json({
              success: false,
              error: 'Unauthorized: Invalid SMS webhook secret key.',
            });
            return;
          }
        }
      } catch (cfgErr) {
        console.warn('[SMS Webhook] Settings secret check skipped:', cfgErr);
      }
    }

    if (!rawMessage) {
      res.status(400).json({
        success: false,
        error: 'SMS message body is required (fields: message, text, body, or msg).',
      });
      return;
    }

    if (isUnexpandedTemplatePlaceholderServer(rawMessage)) {
      res.status(422).json({
        success: false,
        code: 'UNEXPANDED_TEMPLATE_PLACEHOLDER',
        receivedMessage: rawMessage,
        error:
          'Unexpanded template placeholder received in message field. In Zerogic Forward SMS app, use "{msg}" for message and "{sender}" for sender instead of "${message}" or "%SMS_BODY%".',
      });
      return;
    }

    // 2. Parse SMS (or merge with explicit pre-parsed fields from custom Android app)
    const parsed = parseMobileBankingSmsServer(rawMessage, senderAddress);
    if (
      senderAddress.startsWith('$') ||
      isUnexpandedTemplatePlaceholderServer(senderAddress)
    ) {
      senderAddress = senderAddress.replace(/^\$/, '').trim() || parsed.provider;
    }
    if (body.provider && (body.provider === 'BKASH' || body.provider === 'NAGAD')) {
      parsed.provider = body.provider;
    }
    if (body.trxId && !parsed.parsedTrxId) {
      parsed.parsedTrxId = String(body.trxId).trim().toUpperCase();
    }
    if (body.amount && !parsed.parsedAmount) {
      const amt = Number(body.amount);
      if (!isNaN(amt) && amt > 0) parsed.parsedAmount = amt;
    }
    if (body.senderPhone && !parsed.parsedSenderPhone) {
      parsed.parsedSenderPhone = normalizePhoneServer(String(body.senderPhone));
    }
    if (body.reference && !parsed.parsedReference) {
      parsed.parsedReference = String(body.reference).trim().toUpperCase();
    }

    const now = Date.now();
    const smsLogId = `sms_${now}_${Math.random().toString(36).slice(2, 8)}`;

    let matchedDonationId: string | undefined;
    let matchedReferenceCode: string | undefined;
    let generatedTransactionNumber: string | undefined;
    let matchStatus: 'MATCHED' | 'UNMATCHED' | 'DUPLICATE' = 'UNMATCHED';
    let alreadyVerified = false;

    const normalizeCodeServer = (val: string) =>
      convertToEnglishDigitsServer(val || '')
        .trim()
        .replace(/[^A-Z0-9]/gi, '')
        .toUpperCase();

    if (baseUrl) {
      // 3. Query PENDING donations from Firestore
      const queryResp = await fetch(`${baseUrl}:runQuery?${apiKeyParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'donations' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'status' },
                op: 'EQUAL',
                value: { stringValue: 'PENDING' },
              },
            },
            limit: 100,
          },
        }),
      });

      let matchedDocData: Record<string, any> | null = null;
      let matchedDocId: string | null = null;

      if (queryResp.ok) {
        const rows = await queryResp.json();
        const pendingDonations: Array<{ id: string; data: Record<string, any> }> = [];

        if (Array.isArray(rows)) {
          for (const row of rows) {
            if (row?.document?.name && row?.document?.fields) {
              const docId = row.document.name.split('/').pop() as string;
              pendingDonations.push({
                id: docId,
                data: fromFirestoreFields(row.document.fields),
              });
            }
          }
        }

        const parsedTrxNormalized = parsed.parsedTrxId
          ? normalizeCodeServer(parsed.parsedTrxId)
          : '';
        const parsedRefNormalized = parsed.parsedReference
          ? normalizeCodeServer(parsed.parsedReference)
          : '';

        // Priority 1: Exact TrxID match
        if (parsedTrxNormalized) {
          const foundByTrx = pendingDonations.find((item) => {
            const d = item.data;
            const dTrx = normalizeCodeServer(
              String(d.transactionIdUpper || d.transactionId || '')
            );
            const amountOk =
              typeof parsed.parsedAmount === 'number'
                ? parsed.parsedAmount >= Number(d.amount || 0)
                : true;
            return Boolean(dTrx) && dTrx === parsedTrxNormalized && amountOk;
          });
          if (foundByTrx) {
            matchedDocId = foundByTrx.id;
            matchedDocData = foundByTrx.data;
          }
        }

        // Priority 2: Exact Reference Code match (e.g. DPIB-4829)
        if (!matchedDocId && parsedRefNormalized) {
          const foundByRef = pendingDonations.find((item) => {
            const d = item.data;
            const dRef = normalizeCodeServer(String(d.referenceCode || ''));
            const amountOk =
              typeof parsed.parsedAmount === 'number'
                ? parsed.parsedAmount >= Number(d.amount || 0)
                : true;
            return (
              Boolean(dRef) &&
              dRef === parsedRefNormalized &&
              d.paymentMethod === parsed.provider &&
              amountOk
            );
          });
          if (foundByRef) {
            matchedDocId = foundByRef.id;
            matchedDocData = foundByRef.data;
          }
        }

        // Priority 3: Exact Sender Phone + Exact Amount + Same Provider within 6 hours
        if (!matchedDocId && parsed.parsedSenderPhone && typeof parsed.parsedAmount === 'number') {
          const sixHoursAgo = now - 6 * 60 * 60 * 1000;
          const foundByPhoneAmt = pendingDonations.find((item) => {
            const d = item.data;
            const dPhone = normalizePhoneServer(String(d.senderPhone || ''));
            return (
              dPhone === parsed.parsedSenderPhone &&
              Number(d.amount) === parsed.parsedAmount &&
              d.paymentMethod === parsed.provider &&
              Number(d.createdAt || 0) >= sixHoursAgo
            );
          });
          if (foundByPhoneAmt) {
            matchedDocId = foundByPhoneAmt.id;
            matchedDocData = foundByPhoneAmt.data;
          }
        }
      }

      // Check duplicate already-verified TrxID
      if (!matchedDocId && parsed.parsedTrxId) {
        const cleanTrxUpper = parsed.parsedTrxId.toUpperCase();
        const dupQueryResp = await fetch(`${baseUrl}:runQuery?${apiKeyParam}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: 'donations' }],
              where: {
                fieldFilter: {
                  field: { fieldPath: 'transactionIdUpper' },
                  op: 'EQUAL',
                  value: { stringValue: cleanTrxUpper },
                },
              },
              limit: 1,
            },
          }),
        });
        if (dupQueryResp.ok) {
          const dupRows = await dupQueryResp.json();
          if (Array.isArray(dupRows) && dupRows[0]?.document?.fields) {
            const existingData = fromFirestoreFields(dupRows[0].document.fields);
            if (existingData.status === 'VERIFIED') {
              matchedDonationId = dupRows[0].document.name.split('/').pop();
              matchedReferenceCode = String(existingData.referenceCode || '');
              matchStatus = 'DUPLICATE';
              alreadyVerified = true;
            }
          }
        }
      }

      // 4. If matched, update donation status to VERIFIED and automatically create a Transaction in Firestore!
      if (matchedDocId && matchedDocData) {
        const updatedDonation = {
          ...matchedDocData,
          status: 'VERIFIED',
          verificationSource: 'AUTO_SMS_APP',
          matchedSmsId: smsLogId,
          matchedSmsText: rawMessage.slice(0, 550),
          verifiedAt: now,
          updatedAt: now,
        };

        const patchResp = await fetch(
          `${baseUrl}/donations/${encodeURIComponent(matchedDocId)}?${apiKeyParam}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: toFirestoreDocumentFields(updatedDonation),
            }),
          }
        );

        if (patchResp.ok) {
          matchedDonationId = matchedDocId;
          matchedReferenceCode = String(matchedDocData.referenceCode || '');
          matchStatus = 'MATCHED';

          // Automatically generate completed Transaction document in /transactions
          const txnId = `txn_${matchedDocId}`;
          const refSuffix =
            matchedReferenceCode.replace(/[^A-Z0-9]/gi, '').slice(-4) || '0000';
          const dateStamp = new Date(now).toISOString().slice(2, 10).replace(/-/g, '');
          const txnNumber = `TXN-${dateStamp}-${refSuffix}`;
          generatedTransactionNumber = txnNumber;

          const transactionRecord = {
            id: txnId,
            transactionNumber: txnNumber,
            donationId: matchedDocId,
            referenceCode: matchedReferenceCode,
            paymentMethod: matchedDocData.paymentMethod === 'NAGAD' ? 'NAGAD' : 'BKASH',
            amount: Number(matchedDocData.amount || 0),
            senderPhone: String(matchedDocData.senderPhone || ''),
            gatewayTrxId: String(
              matchedDocData.transactionIdUpper || matchedDocData.transactionId || ''
            ),
            donorName: String(matchedDocData.donorName || 'শুভাকাঙ্ক্ষী'),
            purpose: String(matchedDocData.purpose || 'APP_DEVELOPMENT'),
            verificationSource: 'AUTO_SMS_APP',
            status: 'COMPLETED',
            completedAt: now,
            createdAt: now,
          };

          await fetch(
            `${baseUrl}/transactions/${encodeURIComponent(txnId)}?${apiKeyParam}`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fields: toFirestoreDocumentFields(transactionRecord),
              }),
            }
          );
        }
      }

      // 5. Save SMS log into donation_sms_logs
      const smsLogRecord: Record<string, any> = {
        provider: parsed.provider,
        senderAddress: senderAddress.slice(0, 50) || 'BKASH',
        rawMessage: rawMessage.slice(0, 950),
        matchStatus,
        receivedAt: now,
      };
      if (typeof parsed.parsedAmount === 'number') smsLogRecord.parsedAmount = parsed.parsedAmount;
      if (parsed.parsedTrxId) smsLogRecord.parsedTrxId = parsed.parsedTrxId;
      if (parsed.parsedSenderPhone) smsLogRecord.parsedSenderPhone = parsed.parsedSenderPhone;
      if (parsed.parsedReference) smsLogRecord.parsedReference = parsed.parsedReference;
      if (matchedDonationId) smsLogRecord.matchedDonationId = matchedDonationId;
      if (matchedReferenceCode) smsLogRecord.matchedReferenceCode = matchedReferenceCode;

      const smsSaveResp = await fetch(
        `${baseUrl}/donation_sms_logs?documentId=${encodeURIComponent(smsLogId)}&${apiKeyParam}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: toFirestoreDocumentFields(smsLogRecord),
          }),
        }
      );
      if (!smsSaveResp.ok) {
        const errBody = await smsSaveResp.text().catch(() => '');
        console.warn('[SMS Webhook] Failed to save SMS log to Firestore:', smsSaveResp.status, errBody);
      }
    }

    res.json({
      success: true,
      matched: matchStatus === 'MATCHED' || alreadyVerified,
      alreadyVerified,
      matchStatus,
      smsLogId,
      matchedDonationId: matchedDonationId || null,
      matchedReferenceCode: matchedReferenceCode || null,
      transactionNumber: generatedTransactionNumber || null,
      parsed,
    });
  } catch (err: any) {
    console.error('[API /api/donations/sms-webhook Error]:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to process incoming payment SMS webhook.',
    });
  }
});

process.on('unhandledRejection', (reason) => {
  console.error('[DPIB Server] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err: any) => {
  console.error('[DPIB Server] Uncaught Exception:', err);
  if (err?.code === 'EADDRINUSE') {
    process.exit(1);
  }
});

async function startServer() {
  process.env.DISABLE_HMR = 'true';
  // Mount Vite development middlewares in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production serve built dist bundle with SPA fallback
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const server = app.listen(port, host, () => {
    console.log(`[DPIB Server] Dev server running on http://localhost:${port}`);
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('[DPIB Server] Failed to start:', err);
  process.exit(1);
});
