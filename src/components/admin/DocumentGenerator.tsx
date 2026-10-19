import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Printer, 
  Download, 
  CheckCircle2, 
  Award, 
  BookOpen, 
  Calendar,
  Sparkles,
  QrCode
} from 'lucide-react';
import { db } from '../../services/db';
import { Student, Result, DocumentType } from '../../types';
import { useToast } from '../../context/ToastContext';

export const DocumentGenerator: React.FC = () => {
  const { success, error, info } = useToast();

  const [rollInput, setRollInput] = useState('612450');
  const [docType, setDocType] = useState<DocumentType>('TRANSCRIPT');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(() => {
    const list = db.getStudents();
    return list.find((s) => s.roll === '612450') || list[0] || null;
  });
  const [studentResult, setStudentResult] = useState<Result | null>(() => {
    const res = db.getResults();
    return res.find((r) => r.roll === '612450') || res[0] || null;
  });

  const institute = db.getInstituteInfo();

  const handleSearchStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRoll = rollInput.trim();
    if (!cleanRoll) {
      error('অনুগ্রহ করে রোল নম্বর প্রদান করুন।', 'রোল অনুপস্থিত');
      return;
    }

    const students = db.getStudents();
    const foundStudent = students.find((s) => s.roll === cleanRoll);

    if (!foundStudent) {
      error(`রোল নম্বর ${cleanRoll}-এর কোনো শিক্ষার্থী ডাটাবেসে পাওয়া যায়নি।`, 'শিক্ষার্থী অনুপস্থিত');
      return;
    }

    const results = db.getResults();
    const foundResult = results.find((r) => r.roll === cleanRoll);

    setSelectedStudent(foundStudent);
    setStudentResult(foundResult || null);

    success(
      `${foundStudent.nameBangla}-এর তথ্য পাওয়া গেছে এবং ডকুমেন্ট প্রস্তুত করা হয়েছে।`,
      'ডকুমেন্ট প্রস্তুত'
    );
  };

  const handlePrint = () => {
    if (!selectedStudent) {
      error('প্রিন্ট করার জন্য প্রথমে শিক্ষার্থী নির্বাচন করুন।', 'ডকুমেন্ট খালি');
      return;
    }
    info('প্রিন্ট ডায়ালগ খোলা হয়েছে...', 'প্রিন্ট প্রস্তুতি');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            ডকুমেন্ট জেনারেটর
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            শিক্ষার্থীদের অফিশিয়াল প্রবেশপত্র, ট্রান্সক্রিপ্ট, ও প্রশংসাপত্র সরাসরি জেনারেট ও প্রিন্ট করুন
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          ডকুমেন্ট প্রিন্ট / PDF সংরক্ষণ
        </button>
      </div>

      {/* Selector Control Panel (no-print) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4 no-print">
        <form onSubmit={handleSearchStudent} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              ডকুমেন্টের ধরণ:
            </label>
            <select
              value={docType}
              onChange={(e) => {
                setDocType(e.target.value as DocumentType);
                info('ডকুমেন্টের ধরণ পরিবর্তন করা হয়েছে');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-emerald-500"
            >
              <option value="TRANSCRIPT">একাডেমিক ট্রান্সক্রিপ্ট / মার্কশিট</option>
              <option value="ADMIT_CARD">পরীক্ষার প্রবেশপত্র (Admit Card)</option>
              <option value="TESTIMONIAL">প্রশংসাপত্র / প্রত্যয়নপত্র (Testimonial)</option>
              <option value="APPRECIATION">কৃতিত্ব সনদপত্র (Certificate of Merit)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              শিক্ষার্থীর রোল নম্বর:
            </label>
            <div className="relative">
              <input
                type="text"
                value={rollInput}
                onChange={(e) => setRollInput(e.target.value)}
                placeholder="যেমন: 612450"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition cursor-pointer h-[38px]"
            >
              <Search className="w-4 h-4" />
              তথ্য খুঁজুন ও জেনারেট করুন
            </button>
          </div>
        </form>
      </div>

      {/* Official Document Sheet Preview (Printable Area) */}
      {selectedStudent ? (
        <div className="bg-white rounded-3xl border border-slate-300 shadow-md p-6 sm:p-10 max-w-4xl mx-auto printable-document">
          {/* Institute Header Letterhead */}
          <div className="text-center border-b-2 border-emerald-800 pb-5 mb-6 relative">
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
                DPIB
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-emerald-900 tracking-tight">
                  {institute.name}
                </h1>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">
                  {institute.btebAffiliated}
                </p>
                <p className="text-[11px] text-slate-500">
                  {institute.address} • ফোন: {institute.phone}
                </p>
              </div>
            </div>

            {/* Document Title Badge */}
            <div className="mt-4 inline-block">
              <span className="px-5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-xs sm:text-sm uppercase tracking-wider border border-emerald-300">
                {docType === 'TRANSCRIPT' && 'OFFICIAL ACADEMIC TRANSCRIPT / গ্রেডশিট'}
                {docType === 'ADMIT_CARD' && 'EXAMINATION ADMIT CARD / প্রবেশপত্র'}
                {docType === 'TESTIMONIAL' && 'CHARACTHER CERTIFICATE / প্রশংসাপত্র'}
                {docType === 'APPRECIATION' && 'CERTIFICATE OF ACADEMIC EXCELLENCE'}
              </span>
            </div>
          </div>

          {/* Student Info Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 mb-6 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
              <div>
                <span className="text-slate-500 font-medium">শিক্ষার্থীর নাম (বাংলা):</span>
                <span className="font-bold text-slate-900 ml-2">{selectedStudent.nameBangla}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Student's Name (English):</span>
                <span className="font-bold text-slate-900 ml-2 font-mono">{selectedStudent.nameEnglish || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">রোল নম্বর (Roll):</span>
                <span className="font-bold text-slate-900 ml-2 font-mono">{selectedStudent.roll}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">রেজিস্ট্রেশন নম্বর (Reg):</span>
                <span className="font-bold text-slate-900 ml-2 font-mono">{selectedStudent.registration}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">টেকনোলজি:</span>
                <span className="font-bold text-emerald-800 ml-2">{selectedStudent.technology}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">পর্ব ও শিফট:</span>
                <span className="font-bold text-slate-900 ml-2">{selectedStudent.semester} ({selectedStudent.shift})</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">পিতার নাম:</span>
                <span className="font-bold text-slate-900 ml-2">{selectedStudent.fatherName || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">সেশন:</span>
                <span className="font-bold text-slate-900 ml-2 font-mono">{selectedStudent.session}</span>
              </div>
            </div>
          </div>

          {/* Conditional Document Body */}
          {docType === 'TRANSCRIPT' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center justify-between border-b pb-1">
                <span>বিষয়ভিত্তিক নম্বর ও গ্রেড বিবরণী</span>
                <span className="text-emerald-700 font-extrabold">
                  অর্জিত GPA: {studentResult?.gpa.toFixed(2) || '৩.৮৭'}
                </span>
              </h3>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <th className="p-2.5">বিষয় কোড</th>
                    <th className="p-2.5">বিষয়ের নাম</th>
                    <th className="p-2.5 text-center">ক্রেডিট</th>
                    <th className="p-2.5 text-center">প্রাপ্ত নম্বর</th>
                    <th className="p-2.5 text-center">লেটার গ্রেড</th>
                    <th className="p-2.5 text-center">গ্রেড পয়েন্ট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(studentResult?.subjects || [
                    { code: '66641', name: 'অবজেক্ট ওরিয়েন্টেড প্রোগ্রামিং', credit: 3, marks: 84, grade: 'A+', point: 4.0 },
                    { code: '66642', name: 'ডাটা স্ট্রাকচার ও অ্যালগরিদম', credit: 4, marks: 78, grade: 'A', point: 3.75 },
                    { code: '66643', name: 'ওয়েব ডেভেলপমেন্ট ফান্ডামেন্টালস', credit: 3, marks: 88, grade: 'A+', point: 4.0 },
                    { code: '66644', name: 'ডাটাবেস ম্যানেজমেন্ট সিস্টেম', credit: 3, marks: 76, grade: 'A', point: 3.75 }
                  ]).map((sub, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-mono text-slate-700">{sub.code}</td>
                      <td className="p-2.5 font-medium text-slate-900">{sub.name}</td>
                      <td className="p-2.5 text-center font-mono">{sub.credit}</td>
                      <td className="p-2.5 text-center font-mono">{sub.marks}</td>
                      <td className="p-2.5 text-center font-bold font-mono text-emerald-800">{sub.grade}</td>
                      <td className="p-2.5 text-center font-bold font-mono text-slate-900">{sub.point.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                <span className="font-semibold text-emerald-900">ফলাফলের সার্বিক মূল্যায়ন:</span>
                <span className="font-extrabold text-emerald-800 text-sm">
                  কৃতকার্য (PASSED) — গ্রেড পয়েন্ট গড় (GPA): {studentResult?.gpa.toFixed(2) || '৩.৮৭'}
                </span>
              </div>
            </div>
          )}

          {docType === 'ADMIT_CARD' && (
            <div className="space-y-4 border border-dashed border-slate-300 rounded-2xl p-5 text-xs sm:text-sm">
              <h4 className="font-bold text-slate-900 text-center text-base border-b pb-2">
                ডিপ্লোমা ইন ইঞ্জিনিয়ারিং পর্ব সমাপনী পরীক্ষা — ২০২৪
              </h4>
              <p className="text-slate-600 leading-relaxed">
                এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, উপরোল্লিখিত শিক্ষার্থী দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউটের একজন নিয়মিত শিক্ষার্থী হিসেবে সমাপনী পরীক্ষায় অংশগ্রহণের অনুমতিপ্রাপ্ত হয়েছে।
              </p>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                <p className="font-bold text-slate-800">পরীক্ষার্থীদের জন্য বিশেষ সতর্কবার্তা:</p>
                <p>১. প্রবেশপত্র ব্যতিরেকে কোনো শিক্ষার্থীকে পরীক্ষার হলে প্রবেশ করতে দেওয়া হবে না।</p>
                <p>২. পরীক্ষা শুরুর অন্তত ৩০ মিনিট পূর্বে পরীক্ষার আসনে উপস্থিত হতে হবে।</p>
                <p>৩. মোবাইল ফোন বা কোনো অবৈধ ইলেকট্রনিক ডিভাইস বহন সম্পূর্ণ নিষিদ্ধ।</p>
              </div>
            </div>
          )}

          {docType === 'TESTIMONIAL' && (
            <div className="space-y-5 py-4 text-xs sm:text-sm leading-loose text-slate-800">
              <p>
                এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, <span className="font-bold underline">{selectedStudent.nameBangla}</span>, পিতা: <span className="font-bold">{selectedStudent.fatherName || 'মোঃ রফিকুল ইসলাম'}</span>, মাতা: <span className="font-bold">{selectedStudent.motherName || 'তাহমিনা বেগম'}</span>, রোল নং: <span className="font-mono font-bold">{selectedStudent.roll}</span>, রেজিস্ট্রেশন নং: <span className="font-mono font-bold">{selectedStudent.registration}</span>, সেশন: <span className="font-mono font-bold">{selectedStudent.session}</span>; অত্র ইনস্টিটিউটের <span className="font-bold text-emerald-800">{selectedStudent.technology}</span>-এর একজন নিয়মিত শিক্ষার্থী।
              </p>
              <p>
                আমার জানামতে সে অধ্যয়নকালে কোনো রাষ্ট্রবিরোধী বা ইনস্টিটিউটবিরোধী কোনো কার্যকলাপে লিপ্ত ছিল না। তাহার নৈতিক চরিত্র অত্যন্ত প্রশংসনীয় ও নির্মল।
              </p>
              <p className="font-semibold text-emerald-900">
                আমি তাহার ভবিষ্যৎ জীবনের সর্বাঙ্গীন সাফল্য ও উন্নতি কামনা করি।
              </p>
            </div>
          )}

          {/* Signatures & Seal Section */}
          <div className="pt-16 mt-8 flex justify-between items-end text-xs text-slate-700">
            <div className="text-center">
              <div className="w-36 border-t border-slate-400 pt-1 font-semibold">
                যাচাইকারীর স্বাক্ষর
              </div>
              <span className="text-[11px] text-slate-400">একাডেমিক শাখা</span>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-600/40 mx-auto flex items-center justify-center text-[10px] text-emerald-700/60 font-bold uppercase tracking-wider mb-2">
                ইনস্টিটিউট সিল
              </div>
            </div>

            <div className="text-center">
              <div className="w-36 border-t border-slate-400 pt-1 font-semibold">
                অধ্যক্ষের স্বাক্ষর
              </div>
              <span className="text-[11px] text-slate-400">দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
          <p className="text-xs text-slate-500">শিক্ষার্থী রোল দিয়ে অনুসন্ধান করুন</p>
        </div>
      )}
    </div>
  );
};
