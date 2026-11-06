import { GoogleGenAI } from '@google/genai';

function generateFallbackReply(
  prompt: string,
  studentResultContext?: any,
  appContext?: any
): string {
  const cleanPrompt = (prompt || '').trim().toLowerCase();

  if (studentResultContext) {
    const { studentName, roll, gpa, isPassed, letterGrade, subjects, departmentName, semester, examTitle } =
      studentResultContext;
    const weakSubs = Array.isArray(subjects)
      ? subjects.filter(
          (s: any) => !s.isPassed || s.grade === 'F' || s.grade === 'D' || s.grade === 'C'
        )
      : [];

    if (
      cleanPrompt.includes('উন্নতি') ||
      cleanPrompt.includes('দুর্বল') ||
      cleanPrompt.includes('পরামর্শ') ||
      cleanPrompt.includes('স্টাডি প্ল্যান')
    ) {
      let advice = `শিক্ষার্থী ${studentName || ''} (রোল: ${roll || ''})-এর ফলাফল পর্যালোচনার ভিত্তিতে বিষয়ভিত্তিক পরামর্শ:\n\n`;
      if (weakSubs.length > 0) {
        weakSubs.forEach((s: any) => {
          advice += `• ${s.name || s.subjectName || s.code || ''}: প্রাপ্ত নম্বর ${s.obtainedMarks || 0}/${s.fullMarks || 0} (গ্রেড: ${s.grade || ''})\n`;
        });
        advice += `\nনিয়মিত BTEB বোর্ড প্রশ্ন সমাধান ও ল্যাব অনুশীলনের মাধ্যমে দ্রুত উন্নতি সম্ভব।`;
      } else {
        advice += `অভিনন্দন! আপনার ফলাফল অত্যন্ত সন্তোষজনক (GPA: ${gpa || ''}, গ্রেড: ${letterGrade || ''})।`;
      }
      return advice;
    }

    return `শিক্ষার্থী: ${studentName || ''}\nবোর্ড রোল: ${roll || ''}\nটেকনোলজি: ${departmentName || 'কারিগরি'}\nপর্ব: ${semester || ''}ম সেমিস্টার\nপরীক্ষা: ${examTitle || ''}\n• মোট GPA: ${gpa ? Number(gpa).toFixed(2) : '০.০০'} (${letterGrade || ''})\n• অবস্থা: ${isPassed ? 'উত্তীর্ণ (পাস)' : 'অনুত্তীর্ণ (ফেল)'}`;
  }

  if (
    cleanPrompt.includes('পরীক্ষা') ||
    cleanPrompt.includes('exam') ||
    cleanPrompt.includes('রুটিন')
  ) {
    if (appContext && Array.isArray(appContext.exams) && appContext.exams.length > 0) {
      return appContext.exams
        .slice(0, 6)
        .map(
          (ex: any, idx: number) =>
            `${idx + 1}. ${ex.title || 'পরীক্ষা'} - তারিখ: ${ex.examDate || 'ঘোষিত'}`
        )
        .join('\n');
    }
    return `পোর্টালের 'পরীক্ষার তালিকা' ও 'স্মার্ট ক্যালেন্ডার' ট্যাবে সকল পরীক্ষা ও রুটিনের তথ্য পাওয়া যাবে।`;
  }

  return `আপনার প্রশ্নের জন্য ধন্যবাদ। দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট (DPIB) শিক্ষার্থী সহায়তা কেন্দ্রে আপনাকে স্বাগতম। ফলাফল, পরীক্ষা, নোটিশ ও টেকনোলজি সংক্রান্ত যেকোনো তথ্য পোর্টাল থেকে সরাসরি দেখতে পারবেন।`;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { prompt, conversationHistory, studentResultContext, appContext } = body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(200).json({
        reply: generateFallbackReply(prompt, studentResultContext, appContext),
      });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    const contents: any[] = [];
    if (Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-6)) {
        if (!msg?.text?.trim()) continue;
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text.trim() }],
        });
      }
    }
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        maxOutputTokens: 800,
        temperature: 0.3,
      },
    });

    res.status(200).json({
      reply:
        response?.text?.trim() ||
        generateFallbackReply(prompt, studentResultContext, appContext),
    });
  } catch {
    res.status(200).json({
      reply: generateFallbackReply(req.body?.prompt || ''),
    });
  }
}
