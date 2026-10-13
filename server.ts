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
      // Fallback if no API key
      res.json({
        reply: 'দুঃখিত, এআই সার্ভার কনফিগারেশন সংযোগ সাময়িকভাবে অনুপলব্ধ। অনুগ্রহ করে কিছু সময় পর আবার চেষ্টা করুন বা সরাসরি রেজাল্ট সার্চ পেজ থেকে রোল নম্বর অনুসন্ধান করুন।',
      });
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

    // Model selection with cascade fallback
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    let replyText = '';
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
        });
        if (response.text) {
          replyText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[API /api/assistant/chat] Model ${model} failed, trying next:`, err?.message || err);
      }
    }

    if (!replyText) {
      if (lastError) throw lastError;
      replyText = 'দুঃখিত, কোনো উত্তর তৈরি করা সম্ভব হয়নি। অনুগ্রহ করে আবার প্রশ্নটি করুন।';
    }

    res.json({ reply: replyText });
  } catch (error: any) {
    console.error('[API /api/assistant/chat Error]:', error);
    res.status(500).json({
      error: 'সহকারী সার্ভারে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
    });
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
