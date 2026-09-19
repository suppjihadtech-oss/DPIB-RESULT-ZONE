import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Layers,
  GraduationCap,
  Sparkles,
  Printer,
  Copy,
  Check,
  Tag,
  Building2,
  BookMarked,
  Coins,
  FileText,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Info,
  Calendar,
} from 'lucide-react';
import { BookItem, SemesterId, SystemSettings } from '../../types';
import {
  SEMESTER_OPTIONS,
  DEFAULT_BOOK_TECHNOLOGIES,
  subscribeBooksByTechAndSemester,
  getSemesterBanglaName,
  getTechBanglaName,
} from '../../services/bookService';
import { toBanglaDigits } from '../../utils/bangla';
import {
  SelectBottomSheet,
  SelectOption,
} from '../common/SelectBottomSheet';

interface StudentBookListPageProps {
  settings?: SystemSettings | null;
  onNavigateTab?: (tab: string) => void;
}

export const StudentBookListPage: React.FC<StudentBookListPageProps> = ({
  settings,
  onNavigateTab,
}) => {
  // 1. Available Technologies (from settings or fallback default list)
  const technologies = useMemo(() => {
    if (settings?.departments && settings.departments.length > 0) {
      return settings.departments.map((dept) => ({
        id: dept.id.toLowerCase(),
        name: dept.name,
        code: dept.code,
      }));
    }
    return DEFAULT_BOOK_TECHNOLOGIES;
  }, [settings?.departments]);

  // 2. Selected State (Defaults to first technology and 1st semester)
  const [selectedTech, setSelectedTech] = useState<string>(() => {
    return technologies[0]?.id || 'cmt';
  });
  const [selectedSemester, setSelectedSemester] = useState<SemesterId>('1');

  // Action Sheet Modals State
  const [isTechSheetOpen, setIsTechSheetOpen] = useState<boolean>(false);
  const [isSemesterSheetOpen, setIsSemesterSheetOpen] = useState<boolean>(false);

  // 3. Books loaded from Firestore
  const [books, setBooks] = useState<BookItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // When technology list updates, ensure selectedTech is valid
  useEffect(() => {
    if (technologies.length > 0 && !technologies.some((t) => t.id === selectedTech)) {
      setSelectedTech(technologies[0].id);
    }
  }, [technologies, selectedTech]);

  // 4. Real-time Firestore sync whenever technology or semester changes
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeBooksByTechAndSemester(
      selectedTech,
      selectedSemester,
      (fetchedBooks) => {
        setBooks(fetchedBooks);
        setIsLoading(false);
      },
      settings?.departments,
      (error) => {
        console.error('Failed to load books:', error);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [selectedTech, selectedSemester, settings?.departments]);

  // 5. Filter books by local in-page search query (Book title or Subject Code)
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;
    const q = searchQuery.toLowerCase().trim();
    return books.filter((b) => {
      const nameMatch = (b.subjectName || '').toLowerCase().includes(q);
      const codeMatch = (b.subjectCode || '').toLowerCase().includes(q);
      const authorMatch = (b.author || '').toLowerCase().includes(q);
      const publisherMatch = (b.publisher || '').toLowerCase().includes(q);
      return nameMatch || codeMatch || authorMatch || publisherMatch;
    });
  }, [books, searchQuery]);

  // 6. Summary metrics
  const totalCredits = useMemo(() => {
    return books.reduce((acc, b) => acc + (b.credit || 0), 0);
  }, [books]);

  const activeTechObj = useMemo(() => {
    return technologies.find((t) => t.id === selectedTech) || technologies[0];
  }, [technologies, selectedTech]);

  // Options for modern BottomSheet Action Sheets
  const techOptions: SelectOption[] = useMemo(() => {
    return technologies.map((tech) => ({
      value: tech.id,
      label: tech.name,
      sublabel: `কোড: ${tech.code || tech.id.toUpperCase()}`,
      badge: tech.code || tech.id.toUpperCase(),
      icon: GraduationCap,
    }));
  }, [technologies]);

  const semesterOptions: SelectOption[] = useMemo(() => {
    return SEMESTER_OPTIONS.map((sem) => ({
      value: sem.id,
      label: `${sem.label} (${sem.en})`,
      sublabel: `${sem.label} - ডিপ্লোমা ইঞ্জিনিয়ারিং কারিকুলাম`,
      badge: `${sem.id}st/th Sem`,
      icon: Calendar,
    }));
  }, []);

  // 7. Copy Book List to Clipboard
  const handleCopyBookList = () => {
    if (books.length === 0) return;
    const headerText = `📚 ${activeTechObj?.name || selectedTech.toUpperCase()} - ${getSemesterBanglaName(
      selectedSemester
    )} এর পাঠ্যবই তালিকা:\n\n`;
    const bodyText = books
      .map((b, idx) => {
        const priceText =
          b.marketPrice && b.marketPrice > 0
            ? ` | আনুমানিক বাজার মূল্য: ৳${toBanglaDigits(b.marketPrice)}`
            : '';
        const creditText = b.credit ? ` (${toBanglaDigits(b.credit)} ক্রেডিট)` : '';
        return `${toBanglaDigits(idx + 1)}. ${b.subjectName} [কোড: ${toBanglaDigits(
          b.subjectCode
        )}]${creditText}${priceText}`;
      })
      .join('\n');
    const footerText = `\n\n© ${settings?.instituteName || 'DPIB RESULT ZONE'}`;

    navigator.clipboard.writeText(headerText + bodyText + footerText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  // 8. Handle Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 font-bengali">
      {/* ================= HERO & TITLE HEADER ================= */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-4 sm:p-7 shadow-xs mb-6 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            {/* Back Button and Badge */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('home')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100/80 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>হোম পেজ</span>
                </button>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <BookOpen className="w-3.5 h-3.5" />
                <span>বুক লিস্ট ও পাঠ্যবই নির্দেশিকা</span>
              </span>
              <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
                বিটিইবি কারিকুলাম ও সিলেবাস রেফারেন্স
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>ডিপ্লোমা সেমিস্টার বুক লিস্ট</span>
              <Sparkles className="w-5 h-5 text-amber-500" />
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              আপনার টেকনোলজি এবং বর্তমান সেমিস্টার নির্বাচন করুন। কারিগরি শিক্ষা বোর্ড নির্ধারিত সকল
              বইয়ের নাম, বিষয় কোড, ক্রেডিট ও বাজার মূল্য এক নজরে দেখুন।
            </p>
          </div>

          {/* Quick Action Buttons (Print / Copy) */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              type="button"
              onClick={handleCopyBookList}
              disabled={books.length === 0}
              className="px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="বইয়ের তালিকা কপি করুন"
            >
              {copiedNotification ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">কপি হয়েছে!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>কপি তালিকা</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={books.length === 0}
              className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="প্রিন্ট করুন"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= STEP 1 & STEP 2: MODERN ACTION SHEET SELECTORS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        {/* Technology / Department Action Sheet Trigger */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900">
                  টেকনোলজি / বিভাগ
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  মোট {toBanglaDigits(technologies.length)}টি বিভাগ উপলব্ধ
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black font-outfit uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
              {activeTechObj?.code || selectedTech.toUpperCase()}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsTechSheetOpen(true)}
            className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white border border-slate-200/90 hover:border-blue-400/80 rounded-xl text-left text-xs sm:text-sm font-bold transition-all flex items-center justify-between gap-2 cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="truncate">
                <span className="text-slate-900 font-black">{activeTechObj?.name || selectedTech}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-black text-blue-600 hidden sm:inline">পরিবর্তন করুন</span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </button>
        </div>

        {/* Semester Action Sheet Trigger */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900">
                  সেমিস্টার / পর্ব
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  ১ম থেকে ৮ম পর্বের সিলেবাস
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              {toBanglaDigits(selectedSemester)}ম পর্ব
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsSemesterSheetOpen(true)}
            className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white border border-slate-200/90 hover:border-emerald-400/80 rounded-xl text-left text-xs sm:text-sm font-bold transition-all flex items-center justify-between gap-2 cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="text-slate-900 font-black">
                  {getSemesterBanglaName(selectedSemester)}
                </span>
                <span className="text-slate-500 text-xs ml-1.5 font-medium hidden sm:inline">
                  ({SEMESTER_OPTIONS.find((s) => s.id === selectedSemester)?.en})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-black text-emerald-600 hidden sm:inline">পর্ব পরিবর্তন</span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
          </button>
        </div>
      </div>

      {/* ================= ACTIVE SELECTION METADATA & IN-PAGE SEARCH ================= */}
      <div className="bg-slate-100/70 backdrop-blur-md rounded-2xl border border-slate-200/70 p-3.5 sm:p-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Info summary */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <BookMarked className="w-4 h-4 text-blue-600" />
            <span className="text-slate-900 font-black">
              {activeTechObj?.name || selectedTech.toUpperCase()}
            </span>
            <span className="text-slate-600 font-normal">|</span>
            <span className="text-blue-700 font-black">
              {getSemesterBanglaName(selectedSemester)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white text-slate-800 border border-slate-200/80 shadow-2xs">
              মোট বই: {toBanglaDigits(books.length)}টি
            </span>
            {totalCredits > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white text-blue-700 border border-blue-200/80 shadow-2xs">
                মোট ক্রেডিট: {toBanglaDigits(totalCredits)}
              </span>
            )}
          </div>
        </div>

        {/* Search Input Filter */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="বইয়ের নাম বা বিষয় কোড দিয়ে খুঁজুন..."
            className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* ================= BOOKS DISPLAY LIST ================= */}
      {isLoading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs animate-pulse space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-20 h-5 bg-slate-200 rounded-lg" />
                <div className="w-16 h-5 bg-slate-200 rounded-lg" />
              </div>
              <div className="w-3/4 h-6 bg-slate-200 rounded-lg" />
              <div className="w-1/2 h-4 bg-slate-100 rounded-lg" />
              <div className="pt-2 border-t border-slate-100 flex justify-between">
                <div className="w-24 h-4 bg-slate-200 rounded-lg" />
                <div className="w-16 h-4 bg-slate-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200/70 shadow-xs">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            {searchQuery ? 'কোনো বই পাওয়া যায়নি' : 'এই পর্বের বই এখনও তালিকাভুক্ত হয়নি'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {searchQuery
              ? `"${searchQuery}" এর সাথে সম্পর্কিত কোনো বই পাওয়া যায়নি। ভিন্ন কোড বা নাম দিয়ে চেষ্টা করুন।`
              : `${activeTechObj?.name || 'নির্বাচিত টেকনোলজি'} এর ${getSemesterBanglaName(
                  selectedSemester
                )} এর বইয়ের তথ্য ডাটাবেজে যুক্ত করা হচ্ছে। অ্যাডমিন প্যানেল থেকে হালনাগাদ হলে সাথে সাথে এখানে প্রদর্শিত হবে।`}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>ফিল্টার ক্লিয়ার করুন</span>
            </button>
          )}
        </div>
      ) : (
        /* Book Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredBooks.map((book, index) => {
            const hasPrice = typeof book.marketPrice === 'number' && book.marketPrice > 0;

            return (
              <div
                key={book.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-blue-200/80 transition-all flex flex-col justify-between group relative"
              >
                {/* Top Row: Serial, Code & Credit Badge */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    {/* Subject Code Badge */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/70 text-xs font-black">
                      <Tag className="w-3 h-3 text-blue-600" />
                      <span>কোড: {toBanglaDigits(book.subjectCode)}</span>
                    </div>

                    {/* Credit / TPC Pill */}
                    <div className="flex items-center gap-1.5">
                      {book.credit !== undefined && book.credit > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-black border border-slate-200/60">
                          <Layers className="w-3 h-3 text-slate-500" />
                          <span>{toBanglaDigits(book.credit)} ক্রেডিট</span>
                        </span>
                      )}
                      {book.tpc && (
                        <span
                          className="text-[10px] font-outfit font-black px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200/50"
                          title="থিওরি-প্র্যাকটিক্যাল-ক্রেডিট (T-P-C)"
                        >
                          {book.tpc}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Book Title */}
                  <h4 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-700 transition-colors leading-snug line-clamp-2">
                    {book.subjectName}
                  </h4>

                  {/* Regulation or Book Type */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {book.edition && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/50">
                        {book.edition}
                      </span>
                    )}
                    {book.bookType && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        {book.bookType === 'COMPULSORY'
                          ? 'বাধ্যতামূলক'
                          : book.bookType === 'ELECTIVE'
                          ? 'ঐচ্ছিক'
                          : book.bookType}
                      </span>
                    )}
                  </div>

                  {/* Author / Publisher details if set */}
                  {(book.author || book.publisher) && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs space-y-1">
                      {book.author && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <span className="font-bold text-slate-500 text-[11px]">লেখক:</span>
                          <span className="font-medium text-slate-800 truncate">
                            {book.author}
                          </span>
                        </div>
                      )}
                      {book.publisher && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700 truncate">
                            {book.publisher}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Description note if set */}
                  {book.description && (
                    <p className="mt-2 text-[11px] text-slate-500 line-clamp-2 italic">
                      {book.description}
                    </p>
                  )}
                </div>

                {/* Bottom Footer: MARKET PRICE (Only shown if set by admin!) */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {hasPrice ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/90 text-amber-800 border border-amber-200/90 font-black text-xs shadow-2xs">
                      <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        বাজার মূল্য: ৳{toBanglaDigits(book.marketPrice!)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-600 font-medium">
                      বোর্ড নির্ধারিত পাঠ্যবই
                    </div>
                  )}

                  <span className="text-[10px] font-outfit text-slate-600 font-bold">
                    #{toBanglaDigits(index + 1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= HELPFUL BTEB NOTICE / FOOTER BANNER ================= */}
      <div className="mt-8 bg-blue-50/70 border border-blue-200/70 rounded-2xl p-4 sm:p-5 text-xs text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h5 className="font-black text-slate-900 text-sm">
              বই ক্রয় ও সংস্করণ সংক্রান্ত নির্দেশনা
            </h5>
            <p className="text-slate-600 text-[11px] sm:text-xs">
              বাজারে বিভিন্ন প্রকাশনীর (হক, টেকনিক্যাল ইত্যাদি) বই পাওয়া যায়। বই ক্রয়ের পূর্বে
              অবশ্যই বিষয় কোড এবং প্রবিধান সংস্করণ (২০২২/২০১০) মিলিয়ে নিন। বাজার মূল্য স্থানীয় বুক
              মার্কেট অনুযায়ী সামান্য কম-বেশি হতে পারে।
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="shrink-0 px-4 py-2 bg-white hover:bg-slate-50 text-blue-700 font-bold rounded-xl border border-blue-200/80 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>বই তালিকা প্রিন্ট</span>
        </button>
      </div>

      {/* ================= MODERN ACTION SHEETS (BOTTOM SHEETS) ================= */}
      {/* 1. Technology Action Sheet */}
      <SelectBottomSheet
        isOpen={isTechSheetOpen}
        onClose={() => setIsTechSheetOpen(false)}
        title="টেকনোলজি / বিভাগ নির্বাচন করুন"
        subtitle="আপনার ডিপ্লোমা ইঞ্জিনিয়ারিং টেকনোলজি বেছে নিন"
        options={techOptions}
        selectedValue={selectedTech}
        onSelect={(val) => {
          setSelectedTech(val);
          setIsTechSheetOpen(false);
        }}
        searchable={true}
        emptyText="কোনো বিভাগ পাওয়া যায়নি"
      />

      {/* 2. Semester Action Sheet */}
      <SelectBottomSheet
        isOpen={isSemesterSheetOpen}
        onClose={() => setIsSemesterSheetOpen(false)}
        title="সেমিস্টার / পর্ব নির্বাচন করুন"
        subtitle="বর্তমান সেমিস্টার নির্বাচন করলে স্বয়ংক্রিয়ভাবে পাঠ্যবই প্রদর্শিত হবে"
        options={semesterOptions}
        selectedValue={selectedSemester}
        onSelect={(val) => {
          setSelectedSemester(val as SemesterId);
          setIsSemesterSheetOpen(false);
        }}
        searchable={false}
        emptyText="কোনো পর্ব পাওয়া যায়নি"
      />
    </div>
  );
};
