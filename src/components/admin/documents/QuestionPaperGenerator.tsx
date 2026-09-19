import React, { useState, useEffect, useRef } from 'react';
import {
  FileCode,
  Plus,
  Trash2,
  BookOpen,
  Building,
  GraduationCap,
  Edit3,
  CheckCircle2,
  HelpCircle,
  FileText,
  Clock,
  Award,
  Layers,
  Check,
  X,
  ListOrdered,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Minimize2,
  Type,
  Subscript,
  Superscript,
  Bold,
  Italic,
  Underline,
  CornerDownLeft,
  Eye,
  RectangleHorizontal,
  Expand,
  ChevronRight,
} from 'lucide-react';
import { A4DocumentEngine } from './A4DocumentEngine';
import { toBanglaDigits, SEMESTER_MAP } from '../../../utils/bangla';
import { SemesterId } from '../../../types';
import { getAutoLoadedCurriculumSubjects } from '../../../data/masterCurriculum';
import { SelectBottomSheet, SelectTrigger, SelectOption } from '../../common/SelectBottomSheet';
import { BottomSheet } from '../../common/BottomSheet';
import { saveDraft, getDraft, clearDraft, DraftRecord } from '../../../utils/draftStorage';
import { DraftRestoreBanner } from '../../common/DraftRestoreBanner';

const AVAILABLE_TECHNOLOGIES = [
  { id: 'ALL', name: 'সকল প্রযুক্তি (সকল টেকনোলজি)', code: 'ALL' },
  { id: 'COMPUTER', name: 'কম্পিউটার টেকনোলজি', code: 'CMT' },
  { id: 'CIVIL', name: 'সিভিল টেকনোলজি', code: 'CT' },
  { id: 'ELECTRICAL', name: 'ইলেকট্রিক্যাল টেকনোলজি', code: 'ET' },
  { id: 'MECHANICAL', name: 'মেকানিক্যাল টেকনোলজি', code: 'MT' },
  { id: 'MARINE', name: 'মেরিন টেকনোলজি', code: 'MT' },
  { id: 'SURVEYING', name: 'সার্ভেয়িং টেকনোলজি', code: 'ST' },
];

// =========================================================================
// TYPES FOR QUESTION WITH RICH HTML & IMAGE SUPPORT
// =========================================================================
export interface QuestionImage {
  id: string;
  url: string;
  caption?: string;
  size: 'small' | 'medium' | 'large' | 'full';
  align: 'left' | 'center' | 'right';
}

export interface QuestionItem {
  id: string;
  text: string;
  images?: QuestionImage[];
}

// Convert string or object to normalized QuestionItem
export const normalizeQuestion = (q: string | QuestionItem): QuestionItem => {
  if (typeof q === 'string') {
    return {
      id: Math.random().toString(36).substring(2, 9),
      text: q,
      images: [],
    };
  }
  return {
    id: q.id || Math.random().toString(36).substring(2, 9),
    text: q.text || '',
    images: q.images || [],
  };
};

// =========================================================================
// QUESTION CONTENT RENDERER (HTML + IMAGES / DIAGRAMS)
// =========================================================================
export const QuestionContentRenderer: React.FC<{
  item: QuestionItem;
  className?: string;
  compact?: boolean;
}> = ({ item, className = '', compact = false }) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* HTML Question Text Rendering */}
      <div
        className="question-html-render leading-relaxed break-words text-black text-xs sm:text-[13px] font-normal"
        dangerouslySetInnerHTML={{ __html: item.text }}
      />

      {/* Attached Images / Diagrams */}
      {item.images && item.images.length > 0 && (
        <div className={`space-y-2 pt-1 no-break-inside ${compact ? 'max-w-md' : 'w-full'}`}>
          {item.images.map((img) => {
            const alignClass =
              img.align === 'center'
                ? 'flex flex-col items-center text-center mx-auto'
                : img.align === 'right'
                ? 'flex flex-col items-end text-right ml-auto'
                : 'flex flex-col items-start text-left mr-auto';

            const sizeClass =
              img.size === 'small'
                ? 'max-w-[130px] max-h-28'
                : img.size === 'medium'
                ? 'max-w-[240px] max-h-48'
                : img.size === 'large'
                ? 'max-w-[380px] max-h-72'
                : 'max-w-full max-h-96';

            return (
              <div key={img.id} className={`${alignClass} my-1.5`}>
                <div className="inline-block p-1 bg-white border border-slate-300 rounded-md shadow-2xs">
                  <img
                    src={img.url}
                    alt={img.caption || 'প্রশ্ন সম্পর্কিত চিত্র'}
                    className={`${sizeClass} object-contain rounded-xs block`}
                    referrerPolicy="no-referrer"
                  />
                </div>
                {img.caption && (
                  <span className="block text-[11px] text-slate-700 font-semibold mt-1 italic font-bengali">
                    {img.caption}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// =========================================================================
// MODERN SLIDING BOTTOM SHEET: "প্রশ্ন ও নির্দেশনা ইনপুট মডিউল"
// WITH HTML TOOLBAR & DIAGRAM / IMAGE UPLOAD
// =========================================================================
interface QuestionSectionBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  sectionKey: 'A' | 'B' | 'C';
  sectionTitle: string;
  sectionSubtitle: string;
  instruction: string;
  onChangeInstruction: (val: string) => void;
  questions: QuestionItem[];
  onAddQuestion: (item: QuestionItem) => void;
  onUpdateQuestion: (index: number, item: QuestionItem) => void;
  onRemoveQuestion: (index: number) => void;
  startIndex: number;
}

// =========================================================================
// IMAGE SIZE PRESET OPTIONS FOR SELECT BOTTOM SHEET
// =========================================================================
const IMAGE_SIZE_OPTIONS: SelectOption[] = [
  {
    value: 'small',
    label: 'ছোট আকার',
    sublabel: 'মিনি চিত্র বা আইকনচিত্র (সর্বোচ্চ ১৩০px)',
    badge: 'SMALL',
    icon: Minimize2,
  },
  {
    value: 'medium',
    label: 'মাঝারি আকার',
    sublabel: 'স্ট্যান্ডার্ড সার্কিট বা সাধারণ ডায়াগ্রাম (সর্বোচ্চ ২৪০px)',
    badge: 'DEFAULT',
    icon: RectangleHorizontal,
  },
  {
    value: 'large',
    label: 'বড় আকার',
    sublabel: 'বিস্তারিত ডায়াগ্রাম বা বড় নকশা (সর্বোচ্চ ৩৮০px)',
    badge: 'LARGE',
    icon: Maximize2,
  },
  {
    value: 'full',
    label: 'সম্পূর্ণ প্রস্থ',
    sublabel: 'পুরো লাইনের প্রস্থ জুড়ে (১০০% প্রস্থ)',
    badge: 'FULL',
    icon: Expand,
  },
];

const QuestionSectionBottomSheet: React.FC<QuestionSectionBottomSheetProps> = ({
  isOpen,
  onClose,
  sectionKey,
  sectionTitle,
  sectionSubtitle,
  instruction,
  onChangeInstruction,
  questions,
  onAddQuestion,
  onUpdateQuestion,
  onRemoveQuestion,
  startIndex,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachedImages, setAttachedImages] = useState<QuestionImage[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Image Upload / Add States
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageCaptionInput, setImageCaptionInput] = useState('');
  const [imageAlignment, setImageAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [imageSize, setImageSize] = useState<'small' | 'medium' | 'large' | 'full'>('medium');
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false);
  const [targetImageIdForSize, setTargetImageIdForSize] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Quick instruction presets
  const instructionPresets: Record<'A' | 'B' | 'C', string[]> = {
    A: [
      'যে-কোনো ১০টি প্রশ্নের উত্তর দাও: ১ × ১০ = ১০',
      'সকল প্রশ্নের উত্তর দাও: ১ × ১০ = ১০',
      'যে-কোনো ৫টি প্রশ্নের উত্তর দাও: ২ × ৫ = ১০',
      'যে-কোনো ১০টি প্রশ্নের উত্তর দাও',
    ],
    B: [
      'যে-কোনো ৪টি প্রশ্নের উত্তর দাও: ৫ × ৪ = ২০',
      'যে-কোনো ৫টি প্রশ্নের উত্তর দাও: ৪ × ৫ = ২০',
      'যে-কোনো ৩টি প্রশ্নের উত্তর দাও: ৫ × ৩ = ১৫',
      'যে-কোনো ৪টি প্রশ্নের উত্তর দাও',
    ],
    C: [
      'যে-কোনো ৩টি প্রশ্নের উত্তর দাও: ১০ × ৩ = ৩০',
      'যে-কোনো ৫টি প্রশ্নের উত্তর দাও: ৬ × ৫ = ৩০',
      'যে-কোনো ৪টি প্রশ্নের উত্তর দাও: ৮ × ৪ = ৩২',
      'যে-কোনো ৩টি প্রশ্নের উত্তর দাও',
    ],
  };

  // Insert HTML tag into textarea at cursor position
  const insertHtmlTag = (openTag: string, closeTag: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = inputText.substring(start, end);
    const beforeText = inputText.substring(0, start);
    const afterText = inputText.substring(end);

    const replacement = closeTag
      ? `${openTag}${selectedText || 'টেক্সট'}${closeTag}`
      : `${openTag}${selectedText}`;

    setInputText(beforeText + replacement + afterText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + openTag.length + (selectedText ? selectedText.length : (closeTag ? 6 : 0));
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Url = uploadEvent.target?.result as string;
      if (base64Url) {
        const newImg: QuestionImage = {
          id: Math.random().toString(36).substring(2, 9),
          url: base64Url,
          caption: imageCaptionInput.trim() || undefined,
          size: imageSize,
          align: imageAlignment,
        };
        setAttachedImages((prev) => [...prev, newImg]);
        setImageCaptionInput('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle URL Add
  const handleAddUrlImage = () => {
    if (!imageUrlInput.trim()) return;
    const newImg: QuestionImage = {
      id: Math.random().toString(36).substring(2, 9),
      url: imageUrlInput.trim(),
      caption: imageCaptionInput.trim() || undefined,
      size: imageSize,
      align: imageAlignment,
    };
    setAttachedImages((prev) => [...prev, newImg]);
    setImageUrlInput('');
    setImageCaptionInput('');
  };

  const handleRemoveAttachedImage = (id: string) => {
    setAttachedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleUpdateAttachedImage = (id: string, updates: Partial<QuestionImage>) => {
    setAttachedImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, ...updates } : img))
    );
  };

  const handleSaveQuestion = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && attachedImages.length === 0) return;

    const questionItem: QuestionItem = {
      id: editingIndex !== null ? questions[editingIndex]?.id || Math.random().toString(36).substring(2, 9) : Math.random().toString(36).substring(2, 9),
      text: inputText.trim(),
      images: attachedImages,
    };

    if (editingIndex !== null) {
      onUpdateQuestion(editingIndex, questionItem);
      setEditingIndex(null);
    } else {
      onAddQuestion(questionItem);
    }

    setInputText('');
    setAttachedImages([]);
    setShowImagePanel(false);
  };

  const handleStartEdit = (idx: number) => {
    const q = questions[idx];
    setEditingIndex(idx);
    setInputText(q.text || '');
    setAttachedImages(q.images || []);
    setShowImagePanel((q.images || []).length > 0);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setInputText('');
    setAttachedImages([]);
    setShowImagePanel(false);
  };

  const handleClose = () => {
    setEditingIndex(null);
    setInputText('');
    setAttachedImages([]);
    setShowImagePanel(false);
    setSizeSheetOpen(false);
    setTargetImageIdForSize(null);
    onClose();
  };

  const handleSelectImageSize = (val: string) => {
    const newSize = val as 'small' | 'medium' | 'large' | 'full';
    if (targetImageIdForSize) {
      handleUpdateAttachedImage(targetImageIdForSize, { size: newSize });
    } else {
      setImageSize(newSize);
    }
    setSizeSheetOpen(false);
    setTargetImageIdForSize(null);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={sectionTitle}
      subtitle={sectionSubtitle}
      maxHeight="max-h-[94vh]"
    >
      <div className="space-y-5 pb-6 font-bengali">
        {/* 1. Instruction Card */}
        <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-violet-700" />
              <span>বিভাগীয় নির্দেশনা ও নম্বর বণ্টন:</span>
            </label>
            <span className="text-[10px] font-semibold text-slate-400 font-mono">
              (প্রশ্নপত্রের শীর্ষে প্রদর্শিত হবে)
            </span>
          </div>

          <input
            type="text"
            value={instruction}
            onChange={(e) => onChangeInstruction(e.target.value)}
            placeholder="বিভাগীয় নির্দেশনা ও নম্বর বণ্টন লিখুন"
            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:border-violet-600 focus:outline-hidden transition-all shadow-2xs"
          />

          {/* Preset Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-400">কুইক প্রিসেট:</span>
            {instructionPresets[sectionKey].map((preset, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => onChangeInstruction(preset)}
                className={`px-2.5 py-1 text-[11px] rounded-lg border font-medium transition-all cursor-pointer ${
                  instruction === preset
                    ? 'bg-violet-700 text-white border-violet-700 font-bold shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Write / Edit Question Form with HTML Toolbar & Image Upload */}
        <form onSubmit={handleSaveQuestion} className="p-4 bg-violet-50/50 border border-violet-100 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-violet-950 flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-violet-700" />
              <span>
                {editingIndex !== null
                  ? `প্রশ্ন নং ${toBanglaDigits(startIndex + editingIndex)} সম্পাদনা করুন:`
                  : `নতুন প্রশ্ন লিখুন (প্রশ্ন নং ${toBanglaDigits(startIndex + questions.length)}):`}
              </span>
            </label>

            {editingIndex !== null && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>এডিট বাতিল</span>
              </button>
            )}
          </div>

          {/* HTML Quick Formatting Toolbar */}
          <div className="flex flex-wrap items-center gap-1 p-1.5 bg-white border border-violet-200/80 rounded-xl shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 px-1.5 flex items-center gap-1">
              <Type className="w-3 h-3 text-violet-600" />
              <span>HTML টুলস:</span>
            </span>

            <button
              type="button"
              onClick={() => insertHtmlTag('<strong>', '</strong>')}
              title="বোল্ড করুন"
              className="px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-violet-50 hover:text-violet-700 rounded-md border border-slate-200 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Bold className="w-3 h-3" />
              <span>বোল্ড</span>
            </button>

            <button
              type="button"
              onClick={() => insertHtmlTag('<em>', '</em>')}
              title="ইটালিক করুন"
              className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-violet-50 hover:text-violet-700 rounded-md border border-slate-200 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Italic className="w-3 h-3" />
              <span>ইটালিক</span>
            </button>

            <button
              type="button"
              onClick={() => insertHtmlTag('<u>', '</u>')}
              title="আন্ডারলাইন"
              className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-violet-50 hover:text-violet-700 rounded-md border border-slate-200 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Underline className="w-3 h-3" />
              <span>আন্ডারলাইন</span>
            </button>

            <button
              type="button"
              onClick={() => insertHtmlTag('<sup>', '</sup>')}
              title="সুপারস্ক্রিপ্ট / ঘাত (যেমন: x²)"
              className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-violet-50 hover:text-violet-700 rounded-md border border-slate-200 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Superscript className="w-3 h-3 text-violet-600" />
              <span>ঘাত (x²)</span>
            </button>

            <button
              type="button"
              onClick={() => insertHtmlTag('<sub>', '</sub>')}
              title="সাবস্ক্রিপ্ট (যেমন: H₂O)"
              className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-violet-50 hover:text-violet-700 rounded-md border border-slate-200 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Subscript className="w-3 h-3 text-violet-600" />
              <span>সাব (H₂O)</span>
            </button>

            <button
              type="button"
              onClick={() => insertHtmlTag('<br>')}
              title="নতুন লাইন / ব্রেক"
              className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-violet-50 hover:text-violet-700 rounded-md border border-slate-200 flex items-center gap-1 transition-all cursor-pointer"
            >
              <CornerDownLeft className="w-3 h-3" />
              <span>লাইন ব্রেক</span>
            </button>

            <button
              type="button"
              onClick={() => insertHtmlTag('<p>', '</p>')}
              title="প্যারাগ্রাফ"
              className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-violet-50 hover:text-violet-700 rounded-md border border-slate-200 transition-all cursor-pointer"
            >
              &lt;p&gt;
            </button>

            <div className="ml-auto">
              <button
                type="button"
                onClick={() => setShowImagePanel(!showImagePanel)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md border flex items-center gap-1.5 transition-all cursor-pointer ${
                  showImagePanel || attachedImages.length > 0
                    ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                    : 'bg-white hover:bg-teal-50 text-teal-800 border-teal-300'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>ছবি / চিত্র যোগ করুন {attachedImages.length > 0 ? `(${toBanglaDigits(attachedImages.length)})` : ''}</span>
              </button>
            </div>
          </div>

          {/* Text Area */}
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              rows={3}
              required={attachedImages.length === 0}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="এখানে প্রশ্নটি লিখুন... প্রয়োজন অনুযায়ী HTML ট্যাগ (<p>, <strong>, <sup>, <sub>, <br>) ব্যবহার করতে পারেন।"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium focus:border-violet-600 focus:outline-hidden transition-all shadow-2xs resize-y font-bengali"
            />

            {/* Live Render Preview Box if HTML or text entered */}
            {inputText.trim() && (
              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-1">
                  <Eye className="w-3 h-3 text-violet-600" />
                  <span>লাইভ প্রিভিউ (HTML রেন্ডারিং):</span>
                </div>
                <div
                  className="text-xs sm:text-sm font-normal text-slate-900 leading-relaxed font-bengali break-words"
                  dangerouslySetInnerHTML={{ __html: inputText }}
                />
              </div>
            )}

            {/* Image / Diagram Management Drawer */}
            {showImagePanel && (
              <div className="p-3.5 bg-teal-50/70 border border-teal-200/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-teal-700" />
                    <span>প্রশ্নের জন্য ছবি বা ডায়াগ্রাম যুক্ত করুন:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowImagePanel(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Upload from device & URL input Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: File Upload */}
                  <div className="p-3 bg-white border border-teal-200 rounded-xl space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      ১. ডিভাইস থেকে ছবি আপলোড:
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="question-image-upload-input"
                    />
                    <label
                      htmlFor="question-image-upload-input"
                      className="w-full py-2 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>গ্যালারি বা কম্পিউটার থেকে নির্বাচন করুন</span>
                    </label>
                  </div>

                  {/* Option 2: Image URL */}
                  <div className="p-3 bg-white border border-teal-200 rounded-xl space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      ২. ইমেজ লিংক / URL দিয়ে:
                    </span>
                    <div className="flex gap-1.5">
                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="আপনার ছবির URL অথবা লিংক দিন"
                        className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={handleAddUrlImage}
                        disabled={!imageUrlInput.trim()}
                        className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        যোগ
                      </button>
                    </div>
                  </div>
                </div>

                {/* Optional Image Settings (Size & Alignment & Caption) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">ডিফল্ট আকার:</label>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetImageIdForSize(null);
                        setSizeSheetOpen(true);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-teal-300 rounded-lg flex items-center justify-between text-left transition-all cursor-pointer shadow-2xs group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {(() => {
                          const curr = IMAGE_SIZE_OPTIONS.find((o) => o.value === imageSize) || IMAGE_SIZE_OPTIONS[1];
                          const IconComp = curr.icon || RectangleHorizontal;
                          return (
                            <>
                              <div className="w-5 h-5 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200/60">
                                <IconComp className="w-3 h-3" />
                              </div>
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {curr.label}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">অ্যালাইনমেন্ট:</label>
                    <div className="flex gap-1">
                      {(['left', 'center', 'right'] as const).map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setImageAlignment(a)}
                          className={`flex-1 py-1 text-[10px] font-bold rounded border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            imageAlignment === a
                              ? 'bg-teal-700 text-white border-teal-700'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          {a === 'left' ? <AlignLeft className="w-3 h-3" /> : a === 'center' ? <AlignCenter className="w-3 h-3" /> : <AlignRight className="w-3 h-3" />}
                          <span>{a === 'left' ? 'বামে' : a === 'center' ? 'মাঝে' : 'ডানে'}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">ক্যাপশন / শিরোনাম (ঐচ্ছিক):</label>
                    <input
                      type="text"
                      value={imageCaptionInput}
                      onChange={(e) => setImageCaptionInput(e.target.value)}
                      placeholder="ছবির ক্যাপশন বা শিরোনাম লিখুন"
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-medium focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Attached Images List */}
                {attachedImages.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-teal-200">
                    <span className="text-[11px] font-bold text-teal-900 block">
                      সংযুক্ত ছবিসমূহ ({toBanglaDigits(attachedImages.length)}টি):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {attachedImages.map((img) => (
                        <div
                          key={img.id}
                          className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={img.url}
                              alt="thumb"
                              className="w-10 h-10 object-contain rounded border border-slate-200 bg-slate-50 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-800 block truncate">
                                {img.caption || 'চিত্র / ডায়াগ্রাম'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                সাইজ: {img.size} • পজিশন: {img.align}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setTargetImageIdForSize(img.id);
                                setSizeSheetOpen(true);
                              }}
                              className="px-2.5 py-1 bg-slate-50 hover:bg-teal-50 hover:text-teal-800 border border-slate-200 hover:border-teal-300 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                              title="ছবির আকার পরিবর্তন করুন"
                            >
                              {(() => {
                                const curr = IMAGE_SIZE_OPTIONS.find((o) => o.value === img.size) || IMAGE_SIZE_OPTIONS[1];
                                const IconComp = curr.icon || RectangleHorizontal;
                                return (
                                  <>
                                    <IconComp className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                                    <span>{curr.label.split(' ')[0]}</span>
                                  </>
                                );
                              })()}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveAttachedImage(img.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="ছবি মুছুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400 font-medium">
                প্রশ্ন ও চিত্র সংযুক্ত করে নিচের বাটনে ক্লিক করুন
              </span>

              <div className="flex items-center gap-2">
                {editingIndex !== null && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
                  >
                    বাতিল
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!inputText.trim() && attachedImages.length === 0}
                  className="px-4 py-2 bg-violet-700 hover:bg-violet-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {editingIndex !== null ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>আপডেট করুন</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>যোগ করুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* 3. Current Questions List Inside Sheet */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                এই বিভাগের বর্তমান প্রশ্নসমূহ
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-violet-100 text-violet-800 font-mono">
                মোট: {toBanglaDigits(questions.length)} টি
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              (লাইভ প্রিভিউ ও প্রিন্টে স্বয়ংক্রিয়ভাবে আপডেট হবে)
            </span>
          </div>

          {questions.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">এই বিভাগে এখনো কোনো প্রশ্ন যুক্ত করা হয়নি</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                উপরের বক্সে প্রশ্ন লিখে <strong className="text-violet-700 font-bold">"যোগ করুন"</strong> বাটনে ক্লিক করলে প্রশ্নটি এই বিভাগে সংরক্ষিত হবে।
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const serialNum = toBanglaDigits(startIndex + idx);
                const isBeingEdited = editingIndex === idx;

                return (
                  <div
                    key={q.id || idx}
                    className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      isBeingEdited
                        ? 'bg-violet-50/80 border-violet-300 shadow-xs'
                        : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-800 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-slate-200">
                        {serialNum}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <QuestionContentRenderer item={q} compact={true} />
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(idx)}
                        className="p-1.5 text-slate-500 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                        title="প্রশ্নটি সম্পাদনা করুন"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveQuestion(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="প্রশ্নটি মুছুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Footer Done Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>সম্পন্ন করুন</span>
          </button>
        </div>
      </div>

      {/* Modern Sliding Bottom Sheet for Image Size Selection */}
      <SelectBottomSheet
        isOpen={sizeSheetOpen}
        onClose={() => {
          setSizeSheetOpen(false);
          setTargetImageIdForSize(null);
        }}
        title="ছবির আকার নির্বাচন করুন"
        subtitle="প্রশ্নপত্রে ছবির প্রদর্শনের আকার নির্ধারণ করুন"
        options={IMAGE_SIZE_OPTIONS}
        selectedValue={
          targetImageIdForSize
            ? (attachedImages.find((img) => img.id === targetImageIdForSize)?.size || 'medium')
            : imageSize
        }
        onSelect={handleSelectImageSize}
        searchable={false}
      />
    </BottomSheet>
  );
};

// =========================================================================
// MAIN QUESTION PAPER GENERATOR COMPONENT
// =========================================================================
export const QuestionPaperGenerator: React.FC = () => {
  const [examName, setExamName] = useState('১ম পর্ব সমাপনী পরীক্ষা');
  const [examYear, setExamYear] = useState('২০২৬');
  const [selectedTech, setSelectedTech] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [examTime, setExamTime] = useState('৩ ঘণ্টা');
  const [totalMarks, setTotalMarks] = useState('৬০');

  // Bottom sheets for primary selection
  const [techSheetOpen, setTechSheetOpen] = useState(false);
  const [semesterSheetOpen, setSemesterSheetOpen] = useState(false);
  const [subjectSheetOpen, setSubjectSheetOpen] = useState(false);

  // Bottom sheets for Questions Input (A, B, C)
  const [sheetSectionAOpen, setSheetSectionAOpen] = useState(false);
  const [sheetSectionBOpen, setSheetSectionBOpen] = useState(false);
  const [sheetSectionCOpen, setSheetSectionCOpen] = useState(false);

  // Group Questions - Managed as QuestionItem[]
  const [groupAQuestions, setGroupAQuestions] = useState<QuestionItem[]>([]);
  const [groupBQuestions, setGroupBQuestions] = useState<QuestionItem[]>([]);
  const [groupCQuestions, setGroupCQuestions] = useState<QuestionItem[]>([]);

  // Section Instruction texts (user customizable)
  const [groupAInstruction, setGroupAInstruction] = useState('যে-কোনো ১০টি প্রশ্নের উত্তর দাও: ১ × ১০ = ১০');
  const [groupBInstruction, setGroupBInstruction] = useState('যে-কোনো ৪টি প্রশ্নের উত্তর দাও: ৫ × ৪ = ২০');
  const [groupCInstruction, setGroupCInstruction] = useState('যে-কোনো ৩টি প্রশ্নের উত্তর দাও: ১০ × ৩ = ৩০');

  // Draft state
  const [pendingDraft, setPendingDraft] = useState<DraftRecord<any> | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const isInitialMount = useRef(true);

  // Check for existing draft on load
  useEffect(() => {
    async function checkDraft() {
      try {
        const draft = await getDraft<any>('question_paper');
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
      const draftData = {
        examName,
        examYear,
        selectedTech,
        selectedSemester,
        subjectName,
        subjectCode,
        examTime,
        totalMarks,
        groupAQuestions,
        groupBQuestions,
        groupCQuestions,
        groupAInstruction,
        groupBInstruction,
        groupCInstruction,
      };
      await saveDraft('question_paper', draftData);
      setLastSavedTime(Date.now());
    }, 800);

    return () => clearTimeout(timer);
  }, [
    examName,
    examYear,
    selectedTech,
    selectedSemester,
    subjectName,
    subjectCode,
    examTime,
    totalMarks,
    groupAQuestions,
    groupBQuestions,
    groupCQuestions,
    groupAInstruction,
    groupBInstruction,
    groupCInstruction,
  ]);

  const handleRestoreDraft = () => {
    if (!pendingDraft?.data) return;
    const d = pendingDraft.data;
    if (d.examName) setExamName(d.examName);
    if (d.examYear) setExamYear(d.examYear);
    if (d.selectedTech) setSelectedTech(d.selectedTech);
    if (d.selectedSemester) setSelectedSemester(d.selectedSemester);
    if (d.subjectName) setSubjectName(d.subjectName);
    if (d.subjectCode) setSubjectCode(d.subjectCode);
    if (d.examTime) setExamTime(d.examTime);
    if (d.totalMarks) setTotalMarks(d.totalMarks);
    if (Array.isArray(d.groupAQuestions)) setGroupAQuestions(d.groupAQuestions);
    if (Array.isArray(d.groupBQuestions)) setGroupBQuestions(d.groupBQuestions);
    if (Array.isArray(d.groupCQuestions)) setGroupCQuestions(d.groupCQuestions);
    if (d.groupAInstruction) setGroupAInstruction(d.groupAInstruction);
    if (d.groupBInstruction) setGroupBInstruction(d.groupBInstruction);
    if (d.groupCInstruction) setGroupCInstruction(d.groupCInstruction);

    setPendingDraft(null);
    setLastSavedTime(pendingDraft.updatedAt);
  };

  const handleDiscardDraft = async () => {
    await clearDraft('question_paper');
    setPendingDraft(null);
    setLastSavedTime(null);
  };

  // Auto loaded curriculum subjects based on Tech + Sem
  const autoSubjects = (selectedTech && selectedSemester)
    ? getAutoLoadedCurriculumSubjects([selectedTech], selectedSemester as SemesterId)
    : [];

  const handleSelectSubject = (code: string) => {
    const found = autoSubjects.find((s) => s.subjectCode === code);
    if (found) {
      setSubjectCode(found.subjectCode);
      setSubjectName(found.subjectName);
      if (found.curriculumFullMarks) {
        setTotalMarks(String(found.curriculumFullMarks));
      }
    } else {
      setSubjectCode(code);
    }
  };

  const selectedTechObj = AVAILABLE_TECHNOLOGIES.find((t) => t.id === selectedTech);
  const semesterBangla = selectedSemester
    ? (SEMESTER_MAP[selectedSemester as keyof typeof SEMESTER_MAP] || `${toBanglaDigits(selectedSemester)}ম পর্ব`)
    : '';

  // Add Question Handlers
  const handleAddQuestion = (group: 'A' | 'B' | 'C', item: QuestionItem) => {
    if (!item.text.trim() && (!item.images || item.images.length === 0)) return;
    if (group === 'A') {
      setGroupAQuestions((prev) => [...prev, item]);
    } else if (group === 'B') {
      setGroupBQuestions((prev) => [...prev, item]);
    } else {
      setGroupCQuestions((prev) => [...prev, item]);
    }
  };

  // Edit Question Handlers
  const handleUpdateQuestion = (group: 'A' | 'B' | 'C', index: number, item: QuestionItem) => {
    if (group === 'A') {
      setGroupAQuestions((prev) => prev.map((q, i) => (i === index ? item : q)));
    } else if (group === 'B') {
      setGroupBQuestions((prev) => prev.map((q, i) => (i === index ? item : q)));
    } else {
      setGroupCQuestions((prev) => prev.map((q, i) => (i === index ? item : q)));
    }
  };

  // Remove Question Handlers
  const handleRemoveQuestion = (group: 'A' | 'B' | 'C', index: number) => {
    if (group === 'A') {
      setGroupAQuestions((prev) => prev.filter((_, i) => i !== index));
    } else if (group === 'B') {
      setGroupBQuestions((prev) => prev.filter((_, i) => i !== index));
    } else {
      setGroupCQuestions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Options for Select Bottom Sheets
  const techOptions: SelectOption[] = AVAILABLE_TECHNOLOGIES.map((t) => ({
    value: t.id,
    label: t.name,
    badge: t.code,
    icon: Building,
  }));

  const semesterOptions: SelectOption[] = (['1', '2', '3', '4', '5', '6', '7', '8'] as SemesterId[]).map((sem) => ({
    value: sem,
    label: SEMESTER_MAP[sem] || `${toBanglaDigits(sem)}ম পর্ব`,
    badge: `${sem}th`,
    icon: GraduationCap,
  }));

  const subjectOptions: SelectOption[] = autoSubjects.map((s) => ({
    value: s.subjectCode,
    label: s.subjectName,
    sublabel: `কোড: ${s.subjectCode} • পূর্ণমান: ${s.curriculumFullMarks || 100}`,
    badge: s.subjectCode,
    icon: BookOpen,
  }));

  return (
    <div className="space-y-6 font-bengali">
      {/* Draft Restore Banner */}
      <DraftRestoreBanner
        hasDraft={Boolean(pendingDraft)}
        draftTime={pendingDraft?.updatedAt}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
        lastSavedTime={lastSavedTime}
      />

      {/* Controls Bar */}
      <div className="no-print bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                প্রশ্নপত্র জেনারেটর
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                HTML ফরম্যাটিং ও ছবি/ডায়াগ্রামসহ ক, খ ও গ বিভাগের প্রশ্নপত্র তৈরি ও অফিশিয়াল A4 প্রিন্ট করুন
              </p>
            </div>
          </div>
        </div>

        {/* Primary Meta Fields Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 mb-4">
          <SelectTrigger
            label="টেকনোলজি নির্বাচন"
            value={selectedTech}
            displayValue={selectedTechObj ? selectedTechObj.name : ''}
            placeholder="টেকনোলজি নির্বাচন করুন"
            onClick={() => setTechSheetOpen(true)}
            icon={Building}
          />

          <SelectTrigger
            label="সেমিস্টার নির্বাচন"
            value={selectedSemester}
            displayValue={selectedSemester ? SEMESTER_MAP[selectedSemester as SemesterId] : ''}
            placeholder="সেমিস্টার নির্বাচন করুন"
            onClick={() => setSemesterSheetOpen(true)}
            icon={GraduationCap}
          />

          <SelectTrigger
            label="বিষয় নির্বাচন"
            value={subjectCode}
            displayValue={subjectName ? `${subjectName} (${subjectCode})` : ''}
            placeholder={autoSubjects.length > 0 ? 'বিষয় সিলেক্ট করুন' : 'আগে টেকনোলজি ও পর্ব বাছুন'}
            onClick={() => setSubjectSheetOpen(true)}
            icon={BookOpen}
            disabled={autoSubjects.length === 0}
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">পরীক্ষার নাম</label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="পরীক্ষার নাম লিখুন"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200/90 rounded-2xl font-semibold focus:bg-white focus:border-violet-600 focus:outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Extra Settings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 mb-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">পরীক্ষার সাল</label>
            <input
              type="text"
              value={examYear}
              onChange={(e) => setExamYear(e.target.value)}
              placeholder="পরীক্ষার সন বা সাল লিখুন"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200/90 rounded-2xl font-semibold focus:bg-white focus:border-violet-600 focus:outline-hidden transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">পরীক্ষার সময়</label>
            <input
              type="text"
              value={examTime}
              onChange={(e) => setExamTime(e.target.value)}
              placeholder="পরীক্ষার সময়কাল লিখুন"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200/90 rounded-2xl font-semibold focus:bg-white focus:border-violet-600 focus:outline-hidden transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">পূর্ণমান</label>
            <input
              type="text"
              value={totalMarks}
              onChange={(e) => setTotalMarks(e.target.value)}
              placeholder="পরীক্ষার পূর্ণমান নম্বর লিখুন"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200/90 rounded-2xl font-semibold focus:bg-white focus:border-violet-600 focus:outline-hidden transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">ম্যানুয়াল বিষয়ের নাম (প্রয়োজনে)</label>
            <input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="বিষয়ের নাম লিখুন"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200/90 rounded-2xl font-semibold focus:bg-white focus:border-violet-600 focus:outline-hidden transition-all"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODERN QUESTION MANAGEMENT CARDS (ক, খ ও গ বিভাগ)                           */}
        {/* ========================================================================= */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-violet-700" />
              <span>বিভাগ অনুযায়ী প্রশ্নাবলী পরিচালনা (ক, খ ও গ বিভাগ):</span>
            </h4>
            <span className="text-[11px] font-semibold text-slate-400">
              সর্বমোট: {toBanglaDigits(groupAQuestions.length + groupBQuestions.length + groupCQuestions.length)}টি প্রশ্ন
            </span>
          </div>

          {/* Section A Card */}
          <div className="p-4 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200/70">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-violet-100 text-violet-800 text-xs font-black">
                    ক-বিভাগ
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    অতি সংক্ষিপ্ত প্রশ্নমালা
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-600 border border-slate-200 font-mono">
                    {toBanglaDigits(groupAQuestions.length)}টি প্রশ্ন
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  নির্দেশনা: <strong className="text-slate-800">{groupAInstruction}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSheetSectionAOpen(true)}
                className="px-4 py-2 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ক-বিভাগে প্রশ্ন যুক্ত / সম্পাদনা করুন</span>
              </button>
            </div>

            {/* Questions preview in Card */}
            {groupAQuestions.length === 0 ? (
              <div className="py-3 px-4 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                ক-বিভাগে এখনো কোনো প্রশ্ন যুক্ত করা হয়নি। ডানপাশের <strong className="text-violet-700">"যুক্ত করুন"</strong> বাটনে ক্লিক করে প্রশ্ন লিখুন।
              </div>
            ) : (
              <div className="space-y-1.5">
                {groupAQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-2.5 bg-white border border-slate-200/70 rounded-xl flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="w-5 text-center font-bold text-slate-500 font-mono shrink-0 pt-0.5">
                        {toBanglaDigits(idx + 1)}.
                      </span>
                      <div className="min-w-0">
                        <QuestionContentRenderer item={q} compact={true} />
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSheetSectionAOpen(true)}
                        className="p-1 text-slate-400 hover:text-violet-700 rounded transition-colors cursor-pointer"
                        title="সম্পাদনা করুন"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion('A', idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section B Card */}
          <div className="p-4 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200/70">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-black">
                    খ-বিভাগ
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    সংক্ষিপ্ত প্রশ্নমালা
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-600 border border-slate-200 font-mono">
                    {toBanglaDigits(groupBQuestions.length)}টি প্রশ্ন
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  নির্দেশনা: <strong className="text-slate-800">{groupBInstruction}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSheetSectionBOpen(true)}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>খ-বিভাগে প্রশ্ন যুক্ত / সম্পাদনা করুন</span>
              </button>
            </div>

            {/* Questions preview in Card */}
            {groupBQuestions.length === 0 ? (
              <div className="py-3 px-4 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                খ-বিভাগে এখনো কোনো প্রশ্ন যুক্ত করা হয়নি। ডানপাশের <strong className="text-indigo-700">"যুক্ত করুন"</strong> বাটনে ক্লিক করে প্রশ্ন লিখুন।
              </div>
            ) : (
              <div className="space-y-1.5">
                {groupBQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-2.5 bg-white border border-slate-200/70 rounded-xl flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="w-5 text-center font-bold text-slate-500 font-mono shrink-0 pt-0.5">
                        {toBanglaDigits(groupAQuestions.length + idx + 1)}.
                      </span>
                      <div className="min-w-0">
                        <QuestionContentRenderer item={q} compact={true} />
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSheetSectionBOpen(true)}
                        className="p-1 text-slate-400 hover:text-indigo-700 rounded transition-colors cursor-pointer"
                        title="সম্পাদনা করুন"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion('B', idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section C Card */}
          <div className="p-4 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200/70">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-teal-100 text-teal-800 text-xs font-black">
                    গ-বিভাগ
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    রচনামূলক প্রশ্নমালা
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-600 border border-slate-200 font-mono">
                    {toBanglaDigits(groupCQuestions.length)}টি প্রশ্ন
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  নির্দেশনা: <strong className="text-slate-800">{groupCInstruction}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSheetSectionCOpen(true)}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>গ-বিভাগে প্রশ্ন যুক্ত / সম্পাদনা করুন</span>
              </button>
            </div>

            {/* Questions preview in Card */}
            {groupCQuestions.length === 0 ? (
              <div className="py-3 px-4 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                গ-বিভাগে এখনো কোনো প্রশ্ন যুক্ত করা হয়নি। ডানপাশের <strong className="text-teal-700">"যুক্ত করুন"</strong> বাটনে ক্লিক করে প্রশ্ন লিখুন।
              </div>
            ) : (
              <div className="space-y-1.5">
                {groupCQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-2.5 bg-white border border-slate-200/70 rounded-xl flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="w-5 text-center font-bold text-slate-500 font-mono shrink-0 pt-0.5">
                        {toBanglaDigits(groupAQuestions.length + groupBQuestions.length + idx + 1)}.
                      </span>
                      <div className="min-w-0">
                        <QuestionContentRenderer item={q} compact={true} />
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSheetSectionCOpen(true)}
                        className="p-1 text-slate-400 hover:text-teal-700 rounded transition-colors cursor-pointer"
                        title="সম্পাদনা করুন"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion('C', idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3 MODERN SLIDING BOTTOM SHEETS FOR SECTIONS ক, খ & গ                        */}
      {/* ========================================================================= */}
      <QuestionSectionBottomSheet
        isOpen={sheetSectionAOpen}
        onClose={() => setSheetSectionAOpen(false)}
        sectionKey="A"
        sectionTitle="ক-বিভাগ: অতি সংক্ষিপ্ত প্রশ্নমালা"
        sectionSubtitle="HTML ফরম্যাটিং ও ছবি/ডায়াগ্রামসহ প্রশ্ন লিখুন বা সম্পাদনা করুন"
        instruction={groupAInstruction}
        onChangeInstruction={(val) => setGroupAInstruction(val)}
        questions={groupAQuestions}
        onAddQuestion={(item) => handleAddQuestion('A', item)}
        onUpdateQuestion={(idx, item) => handleUpdateQuestion('A', idx, item)}
        onRemoveQuestion={(idx) => handleRemoveQuestion('A', idx)}
        startIndex={1}
      />

      <QuestionSectionBottomSheet
        isOpen={sheetSectionBOpen}
        onClose={() => setSheetSectionBOpen(false)}
        sectionKey="B"
        sectionTitle="খ-বিভাগ: সংক্ষিপ্ত প্রশ্নমালা"
        sectionSubtitle="HTML ফরম্যাটিং ও ছবি/ডায়াগ্রামসহ প্রশ্ন লিখুন বা সম্পাদনা করুন"
        instruction={groupBInstruction}
        onChangeInstruction={(val) => setGroupBInstruction(val)}
        questions={groupBQuestions}
        onAddQuestion={(item) => handleAddQuestion('B', item)}
        onUpdateQuestion={(idx, item) => handleUpdateQuestion('B', idx, item)}
        onRemoveQuestion={(idx) => handleRemoveQuestion('B', idx)}
        startIndex={groupAQuestions.length + 1}
      />

      <QuestionSectionBottomSheet
        isOpen={sheetSectionCOpen}
        onClose={() => setSheetSectionCOpen(false)}
        sectionKey="C"
        sectionTitle="গ-বিভাগ: রচনামূলক প্রশ্নমালা"
        sectionSubtitle="HTML ফরম্যাটিং ও ছবি/ডায়াগ্রামসহ প্রশ্ন লিখুন বা সম্পাদনা করুন"
        instruction={groupCInstruction}
        onChangeInstruction={(val) => setGroupCInstruction(val)}
        questions={groupCQuestions}
        onAddQuestion={(item) => handleAddQuestion('C', item)}
        onUpdateQuestion={(idx, item) => handleUpdateQuestion('C', idx, item)}
        onRemoveQuestion={(idx) => handleRemoveQuestion('C', idx)}
        startIndex={groupAQuestions.length + groupBQuestions.length + 1}
      />

      {/* Select Bottom Sheets for Meta Info */}
      <SelectBottomSheet
        isOpen={techSheetOpen}
        onClose={() => setTechSheetOpen(false)}
        title="টেকনোলজি নির্বাচন"
        subtitle="প্রশ্নপত্রের জন্য বিভাগ সিলেক্ট করুন"
        options={techOptions}
        selectedValue={selectedTech}
        onSelect={(val) => {
          setSelectedTech(val);
          setSubjectCode('');
          setSubjectName('');
        }}
      />

      <SelectBottomSheet
        isOpen={semesterSheetOpen}
        onClose={() => setSemesterSheetOpen(false)}
        title="সেমিস্টার নির্বাচন"
        subtitle="প্রশ্নপত্রের জন্য পর্ব সিলেক্ট করুন"
        options={semesterOptions}
        selectedValue={selectedSemester}
        onSelect={(val) => {
          setSelectedSemester(val);
          setSubjectCode('');
          setSubjectName('');
        }}
      />

      <SelectBottomSheet
        isOpen={subjectSheetOpen}
        onClose={() => setSubjectSheetOpen(false)}
        title="বিষয় নির্বাচন"
        subtitle="কারিকুলাম থেকে বিষয় নির্বাচন করুন"
        options={subjectOptions}
        selectedValue={subjectCode}
        onSelect={(val) => handleSelectSubject(val)}
      />

      {/* ========================================================================= */}
      {/* A4 OFFICIAL EXAMINATION QUESTION PAPER ENGINE                            */}
      {/* ========================================================================= */}
      {(!selectedTech || !selectedSemester || !subjectCode) ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500 shadow-xs">
          <FileCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700 text-sm">অনুগ্রহ করে টেকনোলজি, সেমিস্টার ও বিষয় নির্বাচন করুন</p>
          <p className="text-xs text-slate-400 mt-1">
            টেকনোলজি, সেমিস্টার ও বিষয় নির্বাচন করে ক, খ ও গ বিভাগের প্রশ্ন লিখলে অফিশিয়াল প্রশ্নপত্র প্রিভিউ প্রদর্শিত হবে।
          </p>
        </div>
      ) : (
        <A4DocumentEngine
          hideDefaultHeader={true}
          showSignatures={false}
          fileName={`question-paper-${selectedTech}-${selectedSemester}-${subjectCode}`}
        >
          {/* Exact Official Question Paper Layout */}
          <div className="font-bengali text-black px-4 py-2 select-text leading-normal">
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-2 mb-4">
              <h1 className="text-2xl font-black text-black tracking-tight mb-0.5">
                দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট, ভোলা
              </h1>
              {examName && (
                <h2 className="text-base font-bold text-black my-0.5">
                  {examName} {examYear ? `- ${toBanglaDigits(examYear)}` : ''}
                </h2>
              )}
              <h3 className="text-sm font-semibold text-slate-800">
                টেকনোলজি: {selectedTechObj?.name} | পর্ব: {semesterBangla}
              </h3>
              <p className="text-sm font-bold mt-1 text-black">
                বিষয়: {subjectName} (বিষয় কোড: {toBanglaDigits(subjectCode)})
              </p>
              <div className="flex justify-between items-center mt-2 font-bold text-xs text-black px-4">
                <span>সময়: {toBanglaDigits(examTime)}</span>
                <span>পূর্ণমান: {toBanglaDigits(totalMarks)}</span>
              </div>
            </div>

            <div className="text-center text-xs italic text-slate-700 mb-4">
              [ দ্রষ্টব্য: ডান পাশের সংখ্যা প্রশ্নের পূর্ণমান জ্ঞাপক। সকল বিভাগের প্রশ্নের উত্তর দাও। ]
            </div>

            {/* Section A */}
            <div className="mb-5">
              <div className="text-center mb-2">
                <h4 className="font-extrabold text-sm text-black">ক-বিভাগ (অতি সংক্ষিপ্ত প্রশ্ন)</h4>
                {groupAInstruction && (
                  <p className="text-xs font-bold text-black mt-0.5">{groupAInstruction}</p>
                )}
              </div>
              {groupAQuestions.length === 0 ? (
                <p className="text-xs italic text-slate-400 py-2 text-center">
                  (উপরে ক-বিভাগে প্রশ্ন এন্ট্রি করুন)
                </p>
              ) : (
                <ol className="list-decimal pl-6 space-y-2 text-xs text-black">
                  {groupAQuestions.map((q) => (
                    <li key={q.id} className="leading-relaxed">
                      <QuestionContentRenderer item={q} />
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Section B */}
            <div className="mb-5">
              <div className="text-center mb-2">
                <h4 className="font-extrabold text-sm text-black">খ-বিভাগ (সংক্ষিপ্ত প্রশ্ন)</h4>
                {groupBInstruction && (
                  <p className="text-xs font-bold text-black mt-0.5">{groupBInstruction}</p>
                )}
              </div>
              {groupBQuestions.length === 0 ? (
                <p className="text-xs italic text-slate-400 py-2 text-center">
                  (উপরে খ-বিভাগে প্রশ্ন এন্ট্রি করুন)
                </p>
              ) : (
                <ol className="list-decimal pl-6 space-y-2.5 text-xs text-black" start={groupAQuestions.length + 1}>
                  {groupBQuestions.map((q) => (
                    <li key={q.id} className="leading-relaxed">
                      <QuestionContentRenderer item={q} />
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Section C */}
            <div className="mb-6">
              <div className="text-center mb-2">
                <h4 className="font-extrabold text-sm text-black">গ-বিভাগ (রচনামূলক প্রশ্ন)</h4>
                {groupCInstruction && (
                  <p className="text-xs font-bold text-black mt-0.5">{groupCInstruction}</p>
                )}
              </div>
              {groupCQuestions.length === 0 ? (
                <p className="text-xs italic text-slate-400 py-2 text-center">
                  (উপরে গ-বিভাগে প্রশ্ন এন্ট্রি করুন)
                </p>
              ) : (
                <ol className="list-decimal pl-6 space-y-3 text-xs text-black" start={groupAQuestions.length + groupBQuestions.length + 1}>
                  {groupCQuestions.map((q) => (
                    <li key={q.id} className="leading-relaxed">
                      <QuestionContentRenderer item={q} />
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </A4DocumentEngine>
      )}
    </div>
  );
};
