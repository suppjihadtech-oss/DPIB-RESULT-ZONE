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

// System prompt for DPIB AI Assistant
const DPIB_SYSTEM_INSTRUCTION = `
তুমি "দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট, ভোলা" (DPIB)-এর অফিসিয়াল শিক্ষার্থী সহায়ক "DPIB অ্যাসিস্ট্যান্ট"।
তোমার কাজ শিক্ষার্থীদের তাদের রেজাল্ট বিশ্লেষণ, পাসের শর্ত, নোটিশ, রুটিন, পরীক্ষার নিয়ম এবং বিষয়ভিত্তিক পড়াশোনার পরিকল্পনা সংক্রান্ত প্রশ্নের সঠিক ও আন্তরিক সহায়তা প্রদান করা।

কঠোর আচরণবিধি ও নীতিমালা:
১. ভাষা: সর্বদা প্রাতিষ্ঠানিক, বিনম্র ও স্পষ্ট বাংলা ভাষায় উত্তর দেবে।
২. কোনো ইমোজি ব্যবহার করবে না। বুলেট পয়েন্ট ও স্পষ্ট প্যারাগ্রাফ ব্যবহার করবে।
৩. সত্যতা ও সঠিকতা: তোমাকে প্রদত্ত প্রকৃত তথ্য (context/data) এর ভিত্তিতে উত্তর দেবে। নিজের থেকে কোনো পরীক্ষার নম্বর বা কাল্পনিক তথ্য বানিয়ে বলবে না। তথ্য না থাকলে স্পষ্টভাবে বলবে "এই তথ্যটি বর্তমানে ডেটাবেসে পাওয়া যায়নি।"
৪. গোপনীয়তা রক্ষা: রোল নম্বরের বিপরীতে শিক্ষার্থীর ফলাফল বিশ্লেষণের সময় শুধুমাত্র অনুমোদিত একাডেমিক তথ্য (মোট নম্বর, GPA, গ্রেড, পাস/ফেল, বিষয়ভিত্তিক প্রাপ্ত নম্বর ও পূর্ণমান) বিশ্লেষণ করবে। কোনো ব্যক্তিগত গোপনীয় তথ্য প্রকাশ করবে না।
৫. রেজাল্ট বিশ্লেষণ: কোনো শিক্ষার্থী যদি রোল নম্বর বা রেজাল্ট সংক্রান্ত তথ্য জানতে চায় এবং রেজাল্ট কনটেক্সট দেওয়া থাকে:
   - স্পষ্ট করে তার মোট নম্বর, জিপিএ এবং সামগ্রিক ফলাফল (পাস/ফেল) তুলে ধরবে।
   - কোন বিষয়ে সে ভালো করেছে এবং কোন বিষয়ে সে কম নম্বর পেয়েছে বা ফেল করেছে তা স্পষ্টভাবে উল্লেখ করবে।
   - রেজাল্টের ওপর ভিত্তি করে প্রতিটি দুর্বল বিষয়ের জন্য সুনির্দিষ্ট গঠনমূলক স্টাডি প্ল্যান ও পরামর্শ দেবে।
   - পাসের সাধারণ শর্ত: বিটিইবি নিয়মানুযায়ী প্রতিটি বিষয়ে নূন্যতম পাস মার্ক ৪০% (বা নির্ধারিত পাসের হার) অর্জন করতে হয়।
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
    const { studentName, roll, gpa, isPassed, letterGrade, subjects } = studentResultContext;
    const weakSubs = Array.isArray(subjects)
      ? subjects.filter((s: any) => !s.isPassed || s.grade === 'F' || s.grade === 'D' || s.grade === 'C')
      : [];

    if (cleanPrompt.includes('উন্নতি') || cleanPrompt.includes('দুর্বল') || cleanPrompt.includes('পরামর্শ') || cleanPrompt.includes('দরকার')) {
      let advice = `শিক্ষার্থী ${studentName || ''} (রোল: ${roll || ''})-এর ফলাফল পর্যালোচনার ভিত্তিতে পরামর্শ:\n\n`;
      if (weakSubs.length > 0) {
        advice += `নিম্নোক্ত বিষয়গুলোতে তুলনামূলক কম নম্বর বা দুর্বলতা পরিলক্ষিত হয়েছে:\n`;
        weakSubs.forEach((s: any) => {
          advice += `• ${s.name || s.subjectName || s.code || ''}: প্রাপ্ত নম্বর ${s.obtainedMarks || 0}/${s.fullMarks || 0} (গ্রেড: ${s.grade || ''})\n`;
        });
        advice += `\nপরামর্শ ও স্টাডি প্ল্যান:\n`;
        advice += `১. উল্লেখিত বিষয়গুলোর বিগত ৩-৫ বছরের বিটিইবি বোর্ড সমাপনী পরীক্ষার প্রশ্ন নিয়মিত সমাধান করুন।\n`;
        advice += `২. তত্ত্বীয় অংশে সংক্ষিপ্ত ও রচনামূলক প্রশ্নের কাঠামোগত অনুশীলন করুন।\n`;
        advice += `৩. ব্যবহারিক ক্লাসের ল্যাব এক্সপেরিমেন্টগুলো নিজ দায়িত্বে সম্পন্ন করে ল্যাব নোটবুক আপডেট রাখুন।\n`;
        advice += `৪. সংশ্লিষ্ট বিষয়ের সম্মানিত শিক্ষকের সাথে সরাসরি পরামর্শ করে পাঠ্যসূচির কঠিন অংশগুলো আয়ত্ত করুন।`;
      } else {
        advice += `অভিনন্দন! আপনার ফলাফল সন্তোষজনক (GPA: ${gpa || ''}, গ্রেড: ${letterGrade || ''})। এই ধারাবাহিকতা ধরে রাখতে নিয়মিত পড়াশোনা ও রেফারেন্স বই অনুশীলন করুন।`;
      }
      return advice;
    }
  }

  // 2. Intent matching for quick questions & frequent queries
  if (cleanPrompt.includes('ফলাফল') && (cleanPrompt.includes('কীভাবে') || cleanPrompt.includes('দেখব') || cleanPrompt.includes('খুঁজব'))) {
    return `DPIB RESULT ZONE-এ ফলাফল দেখার সহজ নিয়ম:\n\n` +
      `১. হোম পেজ অথবা উপরের 'ফলাফল অনুসন্ধান' মেনুতে প্রবেশ করুন।\n` +
      `২. আপনার সঠিক বোর্ড রোল নম্বর লিখুন।\n` +
      `৩. প্রযোজ্য ক্ষেত্রে আপনার সেমিস্টার ও পরীক্ষা নির্বাচন করুন।\n` +
      `৪. 'ফলাফল অনুসন্ধান করুন' বাটনে ক্লিক করুন।\n\n` +
      `আপনি তৎক্ষণাৎ আপনার বিষয়ভিত্তিক নম্বর, জিপিএ এবং প্রিন্টযোগ্য অফিশিয়াল ডিজিটাল গ্রেডশিট দেখতে পাবেন। একই রোলে একাধিক পরীক্ষার ফলাফল থাকলে তালিকা থেকে নির্দিষ্ট পরীক্ষাটি বাছাই করতে পারবেন।`;
  }

  if (cleanPrompt.includes('পাসের শর্ত') || cleanPrompt.includes('পাস মার্ক') || cleanPrompt.includes('পাস করার নিয়ম')) {
    return `বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB) অনুমোদিত ডিপ্লোমা ইন ইঞ্জিনিয়ারিং শিক্ষাক্রমের পাসের সাধারণ নিয়মাবলি:\n\n` +
      `১. প্রতিটি বিষয়ে তত্ত্বীয় ধারাবাহিক (TC), তত্ত্বীয় সমাপনী (TF), ব্যবহারিক ধারাবাহিক (PC) এবং ব্যবহারিক সমাপনী (PF) প্রতিটি অংশে পৃথকভাবে পাস করতে হয়।\n` +
      `২. সার্বিকভাবে প্রতিটি অংশে নূন্যতম ৪০% নম্বর অর্জন করা আবশ্যক।\n` +
      `৩. কোনো বিষয়ে ৪০%-এর কম নম্বর পেলে বা পরীক্ষা অনুপস্থিত থাকলে উক্ত বিষয়ে 'F' গ্রেড বা রেফার্ড আসবে।\n` +
      `৪. রেফার্ড বিষয়ে পরবর্তী নির্ধারিত পর্বে পুনঃপরীক্ষা দিয়ে উত্তীর্ণ হতে হবে। চূড়ান্ত সনদের জন্য সকল পর্বের সকল বিষয়ে উত্তীর্ণ হওয়া আবশ্যক।`;
  }

  if (cleanPrompt.includes('রুটিন') || cleanPrompt.includes('পরীক্ষার তারিখ') || cleanPrompt.includes('সময়সূচি')) {
    return `পরীক্ষার রুটিন সংক্রান্ত তথ্য:\n\n` +
      `১. দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউটের ঘোষিত সকল পরীক্ষা ও সময়সূচি পোর্টালের 'স্মার্ট ক্যালেন্ডার' এবং 'পরীক্ষার তালিকা' মেনুতে প্রদর্শিত হয়।\n` +
      `২. চূড়ান্ত পরীক্ষার সময়সূচি ও নোটিশ 'নোটিশ' সেকশন থেকে সরাসরি পিডিএফ আকারে ডাউনলোড ও প্রিন্ট করা যায়।\n` +
      `৩. যেকোনো রুটিন পরিবর্তনের নোটিশ তাৎক্ষণিকভাবে এই পোর্টালে হালনাগাদ করা হয়।`;
  }

  if (cleanPrompt.includes('নোটিশ') || cleanPrompt.includes('ছুটি') || cleanPrompt.includes('ক্যালেন্ডার')) {
    return `নোটিশ ও ছুটির তথ্য:\n\n` +
      `১. ইনস্টিটিউটের সাম্প্রতিক সকল প্রশাসনিক বিজ্ঞপ্তি, ক্লাস স্থগিত বা ছুটির নোটিশ দেখতে 'নোটিশ' ট্যাবে যান।\n` +
      `২. সরকারি ছুটির দিন, ধর্মীয় অনুষ্ঠান এবং একাডেমিক কার্যক্রমের পূর্ণাঙ্গ দিনপঞ্জি দেখতে 'স্মার্ট ক্যালেন্ডার' ট্যাবে চোখ রাখুন।\n` +
      `৩. গুরুত্বপূর্ণ নোটিশগুলো সর্বদা পিন করা থাকে যাতে শিক্ষার্থীরা সহজেই দেখতে পারে।`;
  }

  if (cleanPrompt.includes('বই') || cleanPrompt.includes('বুক লিস্ট') || cleanPrompt.includes('পাঠ্যবই')) {
    return `ডিপ্লোমা পাঠ্যবই ও বুক লিস্ট:\n\n` +
      `১. আপনার টেকনোলজি এবং বর্তমান সেমিস্টারের নির্ধারিত সকল পাঠ্যবই দেখতে 'বুক লিস্ট' পেজে যান।\n` +
      `২. সেখানে বিষয় কোড, ক্রেডিট সংখ্যা, আনুমানিক বাজার মূল্য এবং বিটিইবি অনুমোদিত বইয়ের বিবরণ পেয়ে যাবেন।\n` +
      `৩. পুরো বুক লিস্টটি এক ক্লিকে কপি বা প্রিন্ট করার সুবিধা রয়েছে।`;
  }

  if (cleanPrompt.includes('জিপিএ') || cleanPrompt.includes('গ্রেড') || cleanPrompt.includes('ক্যালকুলেটর')) {
    return `জিপিএ হিসাব ও গ্রেডিং স্কেল:\n\n` +
      `• ৮০% বা তদূর্ধ্ব: A+ (৪.০০)\n` +
      `• ৭৫% থেকে ৭৯%: A (৩.৭৫)\n` +
      `• ৭০% থেকে ৭৪%: A- (৩.৫০)\n` +
      `• ৬৫% থেকে ৬৯%: B+ (৩.২৫)\n` +
      `• ৬০% থেকে ৬৪%: B (৩.০০)\n` +
      `• ৫৫% থেকে ৫৯%: B- (২.৭৫)\n` +
      `• ৫০% থেকে ৫৪%: C+ (২.৫০)\n` +
      `• ৪৫% থেকে ৪৯%: C (২.২৫)\n` +
      `• ৪০% থেকে ৪৪%: D (২.০০)\n` +
      `• ৪০%-এর কম: F (০.০০ - ফেল)\n\n` +
      `সরাসরি সেমিস্টার জিপিএ হিসাব করতে আমাদের 'জিপিএ ক্যালকুলেটর' ব্যবহার করুন।`;
  }

  // Default polite and helpful academic response
  return `আপনার প্রশ্নের জন্য ধন্যবাদ। দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট শিক্ষার্থী সহায়তা কেন্দ্রে আপনাকে স্বাগতম।\n\n` +
    `আপনি আপনার ফলাফল ও দুর্বল বিষয় বিশ্লেষণ দেখতে ইনপুটে আপনার বোর্ড রোল নম্বর (যেমন: 589412) প্রবেশ করাতে পারেন।\n\n` +
    `একাডেমিক তথ্যের জন্য নিচের কুইক অপশনগুলো বেছে নিতে পারেন:\n` +
    `• আমার ফলাফল কীভাবে দেখব?\n` +
    `• পাসের শর্ত কী?\n` +
    `• পরীক্ষার রুটিন কোথায় পাব?\n` +
    `• নোটিশ ও ছুটির তথ্য কোথায় পাব?\n` +
    `• কোন বিষয়ে আমার উন্নতি করা দরকার?`;
}

// API Route for DPIB Student Assistant
app.post('/api/assistant/chat', async (req, res) => {
  try {
    const { prompt, conversationHistory, studentResultContext, appContext } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    // Build context
    let contextBlock = '';
    if (studentResultContext) {
      contextBlock += `\n\n[শিক্ষার্থীর রেজাল্ট কনটেক্সট (প্রকৃত ডেটাবেস থেকে প্রাপ্ত)]:\n${JSON.stringify(studentResultContext, null, 2)}`;
    }
    if (appContext) {
      contextBlock += `\n\n[ইনস্টিটিউট ও সিস্টেম কনটেক্সট]:\n${JSON.stringify(appContext, null, 2)}`;
    }

    if (!ai) {
      const fallback = generateIntelligentAssistantReply(prompt, studentResultContext, appContext);
      res.json({ reply: fallback });
      return;
    }

    // Build chat contents or prompt
    const contents: any[] = [];

    // Prior history if provided
    if (Array.isArray(conversationHistory)) {
      conversationHistory.slice(-6).forEach((msg: { role: string; text: string }) => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      });
    }

    // Current message with context
    contents.push({
      role: 'user',
      parts: [
        {
          text: `${DPIB_SYSTEM_INSTRUCTION}\n${contextBlock}\n\nশিক্ষার্থীর প্রশ্ন: ${prompt}`,
        },
      ],
    });

    let replyText = '';

    // Fast call with strict timeout using Promise.race
    try {
      const modelCall = ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI response timed out')), 6500)
      );

      const response: any = await Promise.race([modelCall, timeoutPromise]);
      if (response && response.text) {
        replyText = response.text;
      }
    } catch (aiErr: any) {
      console.warn('[API /api/assistant/chat] Gemini API failed or timed out:', aiErr?.message || aiErr);
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
  // Mount Vite development middlewares in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
