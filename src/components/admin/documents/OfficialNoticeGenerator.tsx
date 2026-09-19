import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Plus,
  Trash2,
  Bold,
  Type,
} from 'lucide-react';
import { A4DocumentEngine } from './A4DocumentEngine';
import { Notice } from '../../../types';
import { getNotices } from '../../../services/db';
import { formatBanglaDate } from '../../../utils/bangla';
import { SelectBottomSheet, SelectTrigger, SelectOption } from '../../common/SelectBottomSheet';
import { ModernDatePicker, ModernDateTrigger } from '../../common/ModernDatePicker';
import { saveDraft, getDraft, clearDraft, DraftRecord } from '../../../utils/draftStorage';
import { DraftRestoreBanner } from '../../common/DraftRestoreBanner';

type BodyFontSize = 'small' | 'normal' | 'large' | 'xlarge';

interface NoticeDraftData {
  memoNo: string;
  noticeDate: string;
  noticeTitle: string;
  noticeBody: string;
  signatoryName: string;
  signatoryTitle: string;
  copyToList: string[];
  bodyFontSize?: BodyFontSize;
  isOverallBold?: boolean;
}

export const OfficialNoticeGenerator: React.FC = () => {
  const [existingNotices, setExistingNotices] = useState<Notice[]>([]);
  const [selectedExistingId, setSelectedExistingId] = useState<string>('');
  const [noticeSheetOpen, setNoticeSheetOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Memo number is completely empty by default as per requirement
  const [memoNo, setMemoNo] = useState<string>('');
  const [noticeDate, setNoticeDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [noticeTitle, setNoticeTitle] = useState<string>('জরুরি প্রাতিষ্ঠানিক বিজ্ঞপ্তি');
  const [noticeBody, setNoticeBody] = useState<string>(
    `এতদ্বারা দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট-এর সকল বিভাগের শিক্ষক, কর্মকর্তা, কর্মচারী ও শিক্ষার্থীদের অবগতির জন্য জানানো যাচ্ছে যে, আগামী পরীক্ষার সংক্রান্ত প্রয়োজনীয় কার্যক্রম যথাসময়ে সম্পন্ন করার নির্দেশ দেওয়া হলো।`
  );

  // Body editor enhancements: font size and bold control
  const [bodyFontSize, setBodyFontSize] = useState<BodyFontSize>('normal');
  const [isOverallBold, setIsOverallBold] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [signatoryName, setSignatoryName] = useState<string>('নিলুফার ইয়াসমিন');
  const [signatoryTitle, setSignatoryTitle] = useState<string>('অধ্যক্ষ, (ভারপ্রাপ্ত)');
  const [copyToList, setCopyToList] = useState<string[]>([]);

  // Draft state
  const [pendingDraft, setPendingDraft] = useState<DraftRecord<NoticeDraftData> | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const isInitialMount = useRef(true);

  // Check for existing draft on load
  useEffect(() => {
    async function checkDraft() {
      try {
        const draft = await getDraft<NoticeDraftData>('official_notice');
        if (draft && draft.data) {
          setPendingDraft(draft);
        }
      } catch (err) {
        console.error('Failed to check draft:', err);
      }
    }
    checkDraft();
  }, []);

  // Debounced auto-save draft
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      const draftData: NoticeDraftData = {
        memoNo,
        noticeDate,
        noticeTitle,
        noticeBody,
        signatoryName,
        signatoryTitle,
        copyToList,
        bodyFontSize,
        isOverallBold,
      };
      await saveDraft('official_notice', draftData);
      setLastSavedTime(Date.now());
    }, 800);

    return () => clearTimeout(timer);
  }, [memoNo, noticeDate, noticeTitle, noticeBody, signatoryName, signatoryTitle, copyToList, bodyFontSize, isOverallBold]);

  const handleRestoreDraft = () => {
    if (!pendingDraft?.data) return;
    const d = pendingDraft.data;
    if (d.memoNo !== undefined) setMemoNo(d.memoNo);
    if (d.noticeDate) setNoticeDate(d.noticeDate);
    if (d.noticeTitle) setNoticeTitle(d.noticeTitle);
    if (d.noticeBody) setNoticeBody(d.noticeBody);
    if (d.signatoryName) setSignatoryName(d.signatoryName);
    if (d.signatoryTitle) setSignatoryTitle(d.signatoryTitle);
    if (Array.isArray(d.copyToList)) setCopyToList(d.copyToList);
    if (d.bodyFontSize) setBodyFontSize(d.bodyFontSize);
    if (d.isOverallBold !== undefined) setIsOverallBold(d.isOverallBold);

    setPendingDraft(null);
    setLastSavedTime(pendingDraft.updatedAt);
  };

  const handleDiscardDraft = async () => {
    await clearDraft('official_notice');
    setPendingDraft(null);
    setLastSavedTime(null);
  };

  // Load existing notices
  useEffect(() => {
    async function load() {
      try {
        const list = await getNotices();
        setExistingNotices(list);
      } catch (err) {
        console.error('Failed to load notices:', err);
      }
    }
    load();
  }, []);

  const handleSelectExisting = (id: string) => {
    setSelectedExistingId(id);
    const found = existingNotices.find((n) => n.id === id);
    if (found) {
      setNoticeTitle(found.title);
      setNoticeBody(found.content);
      if (found.publishedDate) {
        setNoticeDate(found.publishedDate.split('T')[0]);
      }
    }
  };

  // Wrap selected text or insert bold markers
  const handleInsertBold = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setNoticeBody((prev) => prev + ' **বোল্ড টেক্সট** ');
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = noticeBody.substring(start, end);

    let newBody = '';
    if (selectedText) {
      newBody = noticeBody.substring(0, start) + `**${selectedText}**` + noticeBody.substring(end);
      setNoticeBody(newBody);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, end + 4);
      }, 30);
    } else {
      newBody = noticeBody.substring(0, start) + `**বোল্ড লেখা**` + noticeBody.substring(end);
      setNoticeBody(newBody);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 2, start + 12);
      }, 30);
    }
  };

  const handleAddCopyItem = () => {
    setCopyToList((prev) => [...prev, 'নতুন অনুলিপি প্রাপক']);
  };

  const handleUpdateCopyItem = (index: number, val: string) => {
    setCopyToList((prev) => prev.map((item, i) => (i === index ? val : item)));
  };

  const handleRemoveCopyItem = (index: number) => {
    setCopyToList((prev) => prev.filter((_, i) => i !== index));
  };

  const noticeOptions: SelectOption[] = existingNotices.map((n) => ({
    value: n.id,
    label: n.title,
    sublabel: `তারিখ: ${n.publishedDate?.split('T')[0] || '---'} • ক্যাটাগরি: ${n.category || 'সাধারণ'}`,
    icon: Bell,
  }));

  // Render formatted body with bold chunks and preserved paragraphs
  const renderFormattedBody = (content: string) => {
    if (!content) return null;
    const paragraphs = content.split('\n');

    return paragraphs.map((para, pIdx) => {
      if (!para.trim()) {
        return <div key={pIdx} className="h-4" />;
      }

      const parts = para.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={pIdx} className="mb-2 leading-relaxed">
          {parts.map((part, partIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              const boldContent = part.slice(2, -2);
              return (
                <strong key={partIdx} className="font-bold text-black">
                  {boldContent}
                </strong>
              );
            }
            return <span key={partIdx}>{part}</span>;
          })}
        </p>
      );
    });
  };

  // Font size classes for notice body in A4 Document
  const fontSizeClassMap: Record<BodyFontSize, string> = {
    small: 'text-[14px] leading-[2.0]',
    normal: 'text-[15.5px] leading-[2.1]',
    large: 'text-[17px] leading-[2.2]',
    xlarge: 'text-[19px] leading-[2.3]',
  };

  return (
    <div className="space-y-6">
      {/* Draft Restore Banner */}
      <DraftRestoreBanner
        hasDraft={Boolean(pendingDraft)}
        draftTime={pendingDraft?.updatedAt}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
        lastSavedTime={lastSavedTime}
      />

      {/* Controls */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">অফিসিয়াল নোটিশ জেনারেটর</h3>
            <p className="text-xs text-slate-500">
              স্মারক নম্বর, বিজ্ঞপ্তি শিরোনাম, বিবরণ ও অনুলিপি দিয়ে অফিশিয়াল প্যাডে A4 নোটিশ তৈরি করুন।
            </p>
          </div>
        </div>

        {/* Quick Load Existing Notice */}
        {existingNotices.length > 0 && (
          <div className="mb-4">
            <SelectTrigger
              label="পূর্বের নোটিশ থেকে লোড করুন (ঐচ্ছিক)"
              value={selectedExistingId}
              displayValue={existingNotices.find((n) => n.id === selectedExistingId)?.title || ''}
              placeholder="আগের সংরক্ষিত নোটিশ থেকে ড্রাফট লোড করুন"
              onClick={() => setNoticeSheetOpen(true)}
              icon={Bell}
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">স্মারক নম্বর (ঐচ্ছিক)</label>
            <input
              type="text"
              value={memoNo}
              onChange={(e) => setMemoNo(e.target.value)}
              placeholder="প্রয়োজন হলে স্মারক নম্বর লিখুন (ডিফল্ট খালি)"
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              * ডিফল্ট অবস্থায় খালি থাকবে। প্রয়োজন হলে অ্যাডমিন নম্বর দিতে পারবেন।
            </p>
          </div>

          <div>
            <ModernDateTrigger
              id="notice-date-trigger"
              label="বিজ্ঞপ্তির তারিখ"
              required
              value={noticeDate}
              onClick={() => setDatePickerOpen(true)}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">বিজ্ঞপ্তির শিরোনাম</label>
            <input
              type="text"
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              className="w-full px-3 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden"
            />
          </div>

          {/* Enhanced Notice Body Editor */}
          <div className="sm:col-span-2 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700">বিজ্ঞপ্তির মূল বিষয়বস্তু</label>

              {/* Formatting Toolbar */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {/* Bold Selection / Tag Insertion */}
                <button
                  type="button"
                  onClick={handleInsertBold}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                  title="নির্বাচিত অংশ বোল্ড করুন অথবা বোল্ড ট্যাগ যোগ করুন"
                >
                  <Bold className="w-3.5 h-3.5 text-slate-700" />
                  <span>বোল্ড</span>
                </button>

                {/* Overall Bold Toggle */}
                <button
                  type="button"
                  onClick={() => setIsOverallBold((prev) => !prev)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                    isOverallBold
                      ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 shadow-2xs'
                  }`}
                  title="সম্পূর্ণ বিজ্ঞপ্তির মূল লেখা বোল্ড করুন"
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>{isOverallBold ? 'সম্পূর্ণ বোল্ড: চালু' : 'সম্পূর্ণ বোল্ড'}</span>
                </button>

                {/* Font Size Selector Pills */}
                <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold px-1.5">আকার:</span>
                  <button
                    type="button"
                    onClick={() => setBodyFontSize('small')}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                      bodyFontSize === 'small' ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    title="ছোট আকার (১৪px)"
                  >
                    ছোট
                  </button>
                  <button
                    type="button"
                    onClick={() => setBodyFontSize('normal')}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                      bodyFontSize === 'normal' ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    title="স্বাভাবিক আকার (১৫.৫px)"
                  >
                    স্বাভাবিক
                  </button>
                  <button
                    type="button"
                    onClick={() => setBodyFontSize('large')}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                      bodyFontSize === 'large' ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    title="বড় আকার (১৭px)"
                  >
                    বড়
                  </button>
                  <button
                    type="button"
                    onClick={() => setBodyFontSize('xlarge')}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                      bodyFontSize === 'xlarge' ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    title="অতিরিক্ত বড় (১৯px)"
                  >
                    খুব বড়
                  </button>
                </div>
              </div>
            </div>

            <div className="relative">
              <textarea
                ref={textareaRef}
                rows={7}
                value={noticeBody}
                onChange={(e) => setNoticeBody(e.target.value)}
                placeholder="বিজ্ঞপ্তির মূল বিষয়বস্তু এখানে লিখুন..."
                className={`w-full px-3.5 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden leading-relaxed font-bengali ${
                  isOverallBold ? 'font-bold' : 'font-normal'
                }`}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>টিপস: কোনো শব্দ বা বাক্য সিলেক্ট করে "বোল্ড" চাপলে সেটি গাঢ় হবে (যেমন **লেখা**)।</span>
              <span>{noticeBody.length} অক্ষর • {noticeBody.trim() ? noticeBody.trim().split(/\s+/).length : 0} শব্দ</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">স্বাক্ষরকারীর নাম</label>
            <input
              type="text"
              value={signatoryName}
              onChange={(e) => setSignatoryName(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">পদবি ও দপ্তর</label>
            <input
              type="text"
              value={signatoryTitle}
              onChange={(e) => setSignatoryTitle(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Copy To Controls */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700">অনুলিপি প্রাপকের তালিকা</label>
            <button
              type="button"
              onClick={handleAddCopyItem}
              className="flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>অনুলিপি যোগ করুন</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {copyToList.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleUpdateCopyItem(idx, e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-teal-600 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCopyItem(idx)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modern Bottom Sheet for Notice Loading */}
      <SelectBottomSheet
        isOpen={noticeSheetOpen}
        onClose={() => setNoticeSheetOpen(false)}
        title="পূর্ববর্তী নোটিশ নির্বাচন"
        subtitle="ড্রাফট লোড করার জন্য নোটিশ নির্বাচন করুন"
        options={noticeOptions}
        selectedValue={selectedExistingId}
        onSelect={(val) => handleSelectExisting(val)}
      />

      {/* A4 Document Engine */}
      <A4DocumentEngine
        hideDefaultHeader={true}
        showSignatures={false}
        fileName={`official-notice-${noticeDate}`}
      >
        {/* Exact Reference Notice Document Container */}
        <div className="font-bengali text-black px-6 py-4 select-text leading-relaxed">
          {/* Exact Top Letterhead Header */}
          <div className="text-center border-b-[1.5px] border-black pb-2.5 mb-6">
            <h1 className="text-2xl font-black text-black tracking-tight mb-1">
              দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট, ভোলা
            </h1>
            <div className="flex justify-between items-center mt-1.5 text-xs text-slate-800 font-medium px-2">
              <span>ইনস্টিটিউট কোডঃ ৪০০৫২</span>
              <span>EIIN: ১৩৭০৬১</span>
              <span>মোবাইল: ০১৭১৫-০০৬৪৩২</span>
            </div>
          </div>

          {/* Memo No (Left) & Date (Right) */}
          <div className="flex justify-between items-center text-sm font-medium mb-6">
            <p className="text-slate-900">
              <span className="font-semibold">স্মারক নং:</span> {memoNo ? memoNo : ''}
            </p>
            <p className="text-slate-900">
              <span className="font-semibold">তারিখ:</span> {formatBanglaDate(noticeDate)} খ্রি.
            </p>
          </div>

          {/* Notice Subject / Title */}
          <div className="text-center mb-8">
            <h2 className="inline-block text-lg font-bold text-black border-b-[1.5px] border-black pb-0.5">
              বিষয়: {noticeTitle}
            </h2>
          </div>

          {/* Notice Body with font size scaling and bold rendering */}
          <div
            className={`text-black text-justify min-h-[280px] px-1 ${
              fontSizeClassMap[bodyFontSize]
            } ${isOverallBold ? 'font-bold' : 'font-normal'}`}
          >
            {renderFormattedBody(noticeBody)}
          </div>

          {/* Signatory Seal & Signature Block */}
          <div className="mt-20 flex justify-end">
            <div className="text-center w-56 border-t border-black pt-2">
              <p className="text-base font-bold text-black">({signatoryName})</p>
              <p className="text-sm font-semibold text-slate-900">{signatoryTitle}</p>
              <p className="text-xs text-slate-700">দক্ষিণবঙ্গ পলিটেকনিক ইন্সঃ ভোলা।</p>
            </div>
          </div>

          {/* Copy To */}
          {copyToList.length > 0 && (
            <div className="mt-12 pt-3 border-t border-black text-xs text-black">
              <p className="font-bold mb-1">অবগতি ও প্রয়োজনীয় কার্যার্থে অনুলিপি প্রেরিত হলো (জ্যেষ্ঠতার ক্রমানুসারে নয়):</p>
              <ol className="list-decimal pl-5 space-y-0.5 text-slate-900 text-[11px]">
                {copyToList.map((item, cIdx) => (
                  <li key={cIdx}>{item}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </A4DocumentEngine>

      {/* Select Existing Notice Bottom Sheet */}
      <SelectBottomSheet
        isOpen={noticeSheetOpen}
        onClose={() => setNoticeSheetOpen(false)}
        title="পূর্বের নোটিশ নির্বাচন"
        subtitle="সংরক্ষিত নোটিশ থেকে তথ্য স্বয়ংক্রিয়ভাবে পূরণ করুন"
        options={noticeOptions}
        selectedValue={selectedExistingId}
        onSelect={(val) => {
          handleSelectExisting(val);
          setNoticeSheetOpen(false);
        }}
      />

      {/* Modern Date Picker Modal */}
      <ModernDatePicker
        isOpen={datePickerOpen}
        onClose={() => setDatePickerOpen(false)}
        value={noticeDate}
        onChange={(newDate) => setNoticeDate(newDate)}
        title="বিজ্ঞপ্তির তারিখ নির্বাচন"
        subtitle="অফিসিয়াল বিজ্ঞপ্তি জারির তারিখ নির্ধারণ করুন"
        minYear={2020}
        maxYear={2035}
      />
    </div>
  );
};
