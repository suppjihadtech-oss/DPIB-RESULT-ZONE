import React, { useState, useMemo } from 'react';
import { 
  FileCode, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Trash2, 
  Download, 
  Plus, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Edit,
  Save,
  X
} from 'lucide-react';
import { db } from '../../services/db';
import { Result, Technology, Semester, Exam } from '../../types';
import { parseJsonResults, generateSampleJson, ValidationReport } from '../../services/excel';
import { useToast } from '../../context/ToastContext';

export const ResultManagement: React.FC = () => {
  const { success, error, info } = useToast();

  const [results, setResults] = useState<Result[]>(() => db.getResults());
  const [exams, setExams] = useState<Exam[]>(() => db.getExams());

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTech, setSelectedTech] = useState<string>('ALL');
  const [selectedSem, setSelectedSem] = useState<string>('ALL');
  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState<'INPUT' | 'PREVIEW' | 'COMPLETE'>('INPUT');
  const [jsonInput, setJsonInput] = useState('');
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [targetExamId, setTargetExamId] = useState<string>('AUTO');
  const [isPublishing, setIsPublishing] = useState(false);

  // Edit Single Result Modal State
  const [editingResult, setEditingResult] = useState<Result | null>(null);

  // Filtered Results List
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const matchSearch = 
        !searchQuery ||
        r.roll.includes(searchQuery) ||
        r.registration.includes(searchQuery) ||
        r.studentName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTech = selectedTech === 'ALL' || r.technology === selectedTech;
      const matchSem = selectedSem === 'ALL' || r.semester === selectedSem;
      const matchExam = selectedExamId === 'ALL' || r.examId === selectedExamId;

      return matchSearch && matchTech && matchSem && matchExam;
    });
  }, [results, searchQuery, selectedTech, selectedSem, selectedExamId]);

  // Handle Load Sample JSON
  const handleLoadSample = () => {
    const sample = generateSampleJson();
    setJsonInput(sample);
    info('নমুনা JSON ফলাফল কোড লোড করা হয়েছে। যাচাই বাটনে ক্লিক করুন।', 'নমুনা ডেটা');
  };

  // Handle Step 1 -> Step 2: Validate JSON
  const handleValidateJson = () => {
    if (!jsonInput.trim()) {
      error('অনুগ্রহ করে JSON কোড বক্সে পেস্ট করুন।', 'কোড খালি');
      return;
    }

    try {
      const report = parseJsonResults(jsonInput);
      setValidationReport(report);

      if (report.validRows > 0) {
        setUploadStep('PREVIEW');
        success(`${report.validRows} জন শিক্ষার্থীর ফলাফল সফলভাবে যাচাই করা হয়েছে।`, 'যাচাইকরণ সম্পন্ন');
      } else {
        error(
          report.errors[0]?.reason || 'JSON কোডে কোনো বৈধ ফলাফল ডেটা পাওয়া যায়নি।',
          'ফরম্যাট ত্রুটি'
        );
      }
    } catch (err: any) {
      error(`JSON পার্সিং ত্রুটি: ${err.message || 'কোডটি যাচাই করুন'}`, 'পার্সিং ব্যর্থ');
    }
  };

  // Handle Step 2 -> Step 3: Save to Database
  const handleConfirmAndSave = async () => {
    if (!validationReport || validationReport.validRows === 0) {
      error('সংরক্ষণ করার মতো কোনো বৈধ ফলাফল নেই।', 'ডেটা অনুপস্থিত');
      return;
    }

    setIsPublishing(true);

    try {
      // Determine Exam ID
      let finalExamId = targetExamId;
      if (targetExamId === 'AUTO' && validationReport.detectedExam) {
        // Auto-create or find exam
        const existingExam = exams.find(
          (e) => e.title === validationReport.detectedExam?.title || 
                 (e.semester === validationReport.detectedExam?.semester && e.session === validationReport.detectedExam?.session)
        );

        if (existingExam) {
          finalExamId = existingExam.id;
        } else {
          const newExam = db.saveExam({
            title: validationReport.detectedExam.title,
            semester: validationReport.detectedExam.semester,
            session: validationReport.detectedExam.session,
            academicYear: '২০২৪',
            examDate: new Date().toISOString().split('T')[0],
            isPublished: true,
            description: validationReport.detectedExam.description || 'JSON আপলোড হতে স্বয়ংক্রিয় তৈরি'
          });
          finalExamId = newExam.id;
          setExams(db.getExams());
        }
      }

      // Prepare payload
      const preparedResults = validationReport.parsedData.map((d) => ({
        ...d,
        examId: finalExamId === 'AUTO' ? (exams[0]?.id || 'exam-auto') : finalExamId
      }));

      const savedCount = db.batchSaveResults(preparedResults);

      // Refresh list
      setResults(db.getResults());
      setIsPublishing(false);
      setUploadStep('COMPLETE');

      success(
        `${savedCount} জন শিক্ষার্থীর ফলাফল সফলভাবে ডাটাবেসে সংরক্ষিত ও প্রকাশ করা হয়েছে!`,
        'ফলাফল প্রকাশিত'
      );
    } catch (err: any) {
      setIsPublishing(false);
      error(
        `ফলাফল ডাটাবেসে সংরক্ষণে ত্রুটি দেখা দিয়েছে: ${err.message || 'পুনরায় চেষ্টা করুন'}`,
        'সংরক্ষণ ব্যর্থ'
      );
    }
  };

  // Handle Delete Single Result
  const handleDeleteResult = (id: string, roll: string) => {
    if (window.confirm(`আপনি কি রোল ${roll}-এর ফলাফল মুছে ফেলতে চান?`)) {
      const deleted = db.deleteResult(id);
      if (deleted) {
        setResults(db.getResults());
        success(`রোল ${roll}-এর ফলাফল সফলভাবে মুছে ফেলা হয়েছে।`, 'মুছে ফেলা সম্পন্ন');
      } else {
        error('ফলাফল মুছতে ব্যর্থ হয়েছে।', 'ত্রুটি');
      }
    }
  };

  // Handle Clear All Results
  const handleClearAll = () => {
    if (window.confirm('সতর্কতা: আপনি কি নিশ্চিত যে সমস্ত ফলাফল রেকর্ড মুছে ফেলতে চান?')) {
      db.clearAllResults();
      setResults([]);
      success('সকল ফলাফল ডাটাবেস হতে পরিষ্কার করা হয়েছে।', 'মুছে ফেলা সম্পন্ন');
    }
  };

  // Handle Save Single Edited Result
  const handleSaveEditedResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResult) return;

    try {
      db.saveResult(editingResult);
      setResults(db.getResults());
      setEditingResult(null);
      success(`রোল ${editingResult.roll}-এর ফলাফল সফলভাবে আপডেট করা হয়েছে।`, 'আপডেট সম্পন্ন');
    } catch (err: any) {
      error(`সংরক্ষণ ব্যর্থ: ${err.message || 'পুনরায় চেষ্টা করুন'}`, 'ত্রুটি');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <FileCode className="w-5 h-5 text-emerald-600" />
            ফলাফল ব্যবস্থাপনা
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            সরাসরি JSON কোড দিয়ে ফলাফল আপলোড, স্বয়ংক্রিয় গ্রেডিং, অনুসন্ধান ও সম্পাদনা করুন
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setJsonInput('');
              setValidationReport(null);
              setUploadStep('INPUT');
              setUploadModalOpen(true);
            }}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            JSON ফলাফল আপলোড
          </button>
          {results.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="সকল ফলাফল মুছুন"
            >
              <Trash2 className="w-3.5 h-3.5" />
              সব মুছুন
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="রোল / রেজিস্ট্রেশন / নাম খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-emerald-500 focus:bg-white"
            />
          </div>

          {/* Technology Filter */}
          <div>
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-emerald-500 focus:bg-white"
            >
              <option value="ALL">সকল টেকনোলজি</option>
              <option value="কম্পিউটার টেকনোলজি">কম্পিউটার টেকনোলজি</option>
              <option value="সিভিল টেকনোলজি">সিভিল টেকনোলজি</option>
              <option value="ইলেকট্রিক্যাল টেকনোলজি">ইলেকট্রিক্যাল টেকনোলজি</option>
              <option value="মেকানিক্যাল টেকনোলজি">মেকানিক্যাল টেকনোলজি</option>
              <option value="ইলেকট্রনিক্স টেকনোলজি">ইলেকট্রনিক্স টেকনোলজি</option>
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <select
              value={selectedSem}
              onChange={(e) => setSelectedSem(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-emerald-500 focus:bg-white"
            >
              <option value="ALL">সকল পর্ব</option>
              <option value="১ম পর্ব">১ম পর্ব</option>
              <option value="২য় পর্ব">২য় পর্ব</option>
              <option value="৩য় পর্ব">৩য় পর্ব</option>
              <option value="৪র্থ পর্ব">৪র্থ পর্ব</option>
              <option value="৫ম পর্ব">৫ম পর্ব</option>
              <option value="৬ষ্ঠ পর্ব">৬ষ্ঠ পর্ব</option>
              <option value="৭ম পর্ব">৭ম পর্ব</option>
              <option value="৮ম পর্ব">৮ম পর্ব</option>
            </select>
          </div>

          {/* Exam Filter */}
          <div>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-emerald-500 focus:bg-white"
            >
              <option value="ALL">সকল পরীক্ষা</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>মোট {filteredResults.length} টি ফলাফল প্রদর্শিত হচ্ছে</span>
          {(searchQuery || selectedTech !== 'ALL' || selectedSem !== 'ALL' || selectedExamId !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedTech('ALL');
                setSelectedSem('ALL');
                setSelectedExamId('ALL');
                info('সকল ফিল্টার রিসেট করা হয়েছে');
              }}
              className="text-emerald-700 hover:underline cursor-pointer font-medium"
            >
              ফিল্টার রিসেট করুন
            </button>
          )}
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredResults.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <FileCode className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-700 text-sm">কোনো ফলাফল পাওয়া যায়নি</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              প্রদত্ত ফিল্টারের সাথে কোনো রেকর্ড মেলেনি অথবা এখনও কোনো ফলাফল ডেটা এন্ট্রি করা হয়নি।
            </p>
            <button
              type="button"
              onClick={() => {
                setJsonInput('');
                setValidationReport(null);
                setUploadStep('INPUT');
                setUploadModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              নতুন ফলাফল যোগ করুন
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold">
                  <th className="py-3 px-4">রোল ও রেজিঃ</th>
                  <th className="py-3 px-4">শিক্ষার্থীর নাম</th>
                  <th className="py-3 px-4">টেকনোলজি ও পর্ব</th>
                  <th className="py-3 px-4 text-center">বিষয় সংখ্যা</th>
                  <th className="py-3 px-4 text-center">GPA</th>
                  <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{r.roll}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{r.registration}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {r.studentName}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700">{r.technology}</div>
                      <div className="text-[11px] text-slate-400">{r.semester} ({r.session})</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      {r.subjects?.length || 0} টি
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block font-extrabold px-2.5 py-1 rounded-lg ${
                        r.status === 'PASSED' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {r.gpa.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {r.status === 'PASSED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          উত্তীর্ণ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          {r.status === 'REFERRED' ? 'রেফার্ড' : 'অকৃতকার্য'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingResult(r)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                          title="সম্পাদনা করুন"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteResult(r.id, r.roll)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= JSON RESULT UPLOAD MODAL ================= */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    JSON ফলাফল ডেটা ইমপোর্ট
                  </h3>
                  <p className="text-xs text-slate-500">
                    {uploadStep === 'INPUT' && 'ধাপ ১: JSON কোড ইনপুট ও পার্সিং'}
                    {uploadStep === 'PREVIEW' && 'ধাপ ২: প্রিভিউ ও স্বয়ংক্রিয় যাচাই'}
                    {uploadStep === 'COMPLETE' && 'ধাপ ৩: সফল সংরক্ষণ'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {uploadStep === 'INPUT' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      JSON কোড পেস্ট করুন:
                    </label>
                    <button
                      type="button"
                      onClick={handleLoadSample}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      নমুনা JSON লোড করুন
                    </button>
                  </div>

                  <textarea
                    rows={12}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder={`[
  {
    "roll": "612450",
    "registration": "1502123456",
    "studentName": "মোঃ তানভীর হাসান",
    "technology": "কম্পিউটার টেকনোলজি",
    "semester": "৪র্থ পর্ব",
    "session": "2023-2024",
    "subjects": [
      { "code": "66641", "name": "অবজেক্ট ওরিয়েন্টেড প্রোগ্রামিং", "credit": 3, "marks": 85 }
    ]
  }
]`}
                    className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-400 rounded-xl border border-slate-700 focus:outline-emerald-500"
                  />

                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      গুরুত্বপূর্ণ নির্দেশনা:
                    </p>
                    <p>
                      - শুধুমাত্র বৈধ JSON কোড সমর্থন করে (এক্সেল ফাইল আপলোড অপশন বাদ দেওয়া হয়েছে)।
                    </p>
                    <p>
                      - প্রতিটি শিক্ষার্থীর জন্য <span className="font-mono font-bold">roll</span> এবং <span className="font-mono font-bold">registration</span> ফিল্ড আবশ্যক।
                    </p>
                    <p>
                      - নম্বর অনুযায়ী BTEB স্কেলে জিপিএ ও গ্রেড স্বয়ংক্রিয়ভাবে গণনা করা হবে।
                    </p>
                  </div>
                </div>
              )}

              {uploadStep === 'PREVIEW' && validationReport && (
                <div className="space-y-4">
                  {/* Validation Summary Card */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">মোট প্রাপ্ত রেকর্ড</span>
                      <span className="text-xl font-bold text-slate-800">{validationReport.totalRows}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="text-[11px] text-emerald-700 block">সফলভাবে যাচাইকৃত</span>
                      <span className="text-xl font-bold text-emerald-700">{validationReport.validRows}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                      <span className="text-[11px] text-rose-700 block">ত্রুটিপূর্ণ রেকর্ড</span>
                      <span className="text-xl font-bold text-rose-700">{validationReport.invalidRows}</span>
                    </div>
                  </div>

                  {/* Exam Connection */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      পরীক্ষার সাথে সংশ্লিষ্টকরণ:
                    </label>
                    <select
                      value={targetExamId}
                      onChange={(e) => setTargetExamId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-emerald-500"
                    >
                      <option value="AUTO">
                        স্বয়ংক্রিয় সনাক্তকরণ ({validationReport.detectedExam?.title || 'JSON কোড থেকে'})
                      </option>
                      {exams.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.title} ({ex.semester})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Preview Table of verified students */}
                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0">
                        <tr>
                          <th className="p-2.5">রোল</th>
                          <th className="p-2.5">নাম</th>
                          <th className="p-2.5">টেকনোলজি</th>
                          <th className="p-2.5 text-center">GPA</th>
                          <th className="p-2.5 text-center">স্ট্যাটাস</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {validationReport.parsedData.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold font-mono text-slate-800">{item.roll}</td>
                            <td className="p-2.5 text-slate-700">{item.studentName}</td>
                            <td className="p-2.5 text-slate-600">{item.technology}</td>
                            <td className="p-2.5 text-center font-bold text-emerald-700 font-mono">
                              {item.gpa.toFixed(2)}
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                উত্তীর্ণ
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {uploadStep === 'COMPLETE' && (
                <div className="text-center py-8 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-extrabold text-slate-800">ফলাফল সফলভাবে সংরক্ষিত হয়েছে!</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    সকল শিক্ষার্থীর ফলাফল ডেটাবেসে আপডেট হয়েছে এবং শিক্ষার্থীরা তাদের রোল ও রেজিস্ট্রেশন দিয়ে ফলাফল অনুসন্ধান করতে পারবে।
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              {uploadStep === 'INPUT' && (
                <>
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="button"
                    onClick={handleValidateJson}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    যাচাই ও প্রিভিউ করুন
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {uploadStep === 'PREVIEW' && (
                <>
                  <button
                    type="button"
                    onClick={() => setUploadStep('INPUT')}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    কোড পুনরায় সম্পাদনা
                  </button>
                  <button
                    type="button"
                    disabled={isPublishing}
                    onClick={handleConfirmAndSave}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    {isPublishing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        সংরক্ষণ হচ্ছে...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        নিশ্চিত ও ডেটাবেসে প্রকাশ করুন
                      </>
                    )}
                  </button>
                </>
              )}

              {uploadStep === 'COMPLETE' && (
                <div className="w-full flex justify-end">
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    সম্পন্ন
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT SINGLE RESULT MODAL ================= */}
      {editingResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditedResult}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-slate-800 text-base">
                ফলাফল সম্পাদনা — রোল: {editingResult.roll}
              </h3>
              <button
                type="button"
                onClick={() => setEditingResult(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">শিক্ষার্থীর নাম</label>
                <input
                  type="text"
                  value={editingResult.studentName}
                  onChange={(e) => setEditingResult({ ...editingResult, studentName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">জিপিএ (GPA)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="4.00"
                    value={editingResult.gpa}
                    onChange={(e) => setEditingResult({ ...editingResult, gpa: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ফলাফল স্ট্যাটাস</label>
                  <select
                    value={editingResult.status}
                    onChange={(e) => setEditingResult({ ...editingResult, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="PASSED">উত্তীর্ণ (PASSED)</option>
                    <option value="REFERRED">রেফার্ড (REFERRED)</option>
                    <option value="FAILED">অকৃতকার্য (FAILED)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">টেকনোলজি</label>
                <input
                  type="text"
                  value={editingResult.technology}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingResult(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-4 h-4" />
                আপডেট সংরক্ষণ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
