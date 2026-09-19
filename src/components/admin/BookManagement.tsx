import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Search,
  Filter,
  Edit2,
  Trash2,
  Coins,
  Building2,
  Check,
  X,
  RefreshCw,
  Info,
  ChevronDown,
  GraduationCap,
  Calendar,
  Layers,
  Sparkles,
  Hash,
  Award,
  PenTool,
  Bookmark,
  FileText,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { BookItem, Department, SemesterId } from '../../types';
import {
  subscribeAllBooks,
  updateBook,
  deleteBook,
  saveOrUpdateBook,
  SEMESTER_OPTIONS,
  DEFAULT_BOOK_TECHNOLOGIES,
  getSemesterBanglaName,
  getTechBanglaName,
} from '../../services/bookService';
import { normalizeTechnologyKey } from '../../data/masterCurriculum';
import { toBanglaDigits, toEnglishDigits } from '../../utils/bangla';
import {
  SelectBottomSheet,
  SelectOption,
  SelectTrigger,
} from '../common/SelectBottomSheet';

interface BookManagementProps {
  departments: Department[];
}

export const BookManagement: React.FC<BookManagementProps> = ({ departments }) => {
  // Available technologies (with 'all' option plus institute departments)
  const technologies = useMemo(() => {
    if (departments && departments.length > 0) {
      return departments.map((d) => ({
        id: d.id.toLowerCase(),
        name: d.name,
        code: d.code,
      }));
    }
    return DEFAULT_BOOK_TECHNOLOGIES;
  }, [departments]);

  // Master books list from Firestore / Master Curriculum
  const [books, setBooks] = useState<BookItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [filterTech, setFilterTech] = useState<string>('all');
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Action Sheet Modals for Filters
  const [isFilterTechSheetOpen, setIsFilterTechSheetOpen] = useState<boolean>(false);
  const [isFilterSemesterSheetOpen, setIsFilterSemesterSheetOpen] = useState<boolean>(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);

  // Quick Price Modal State
  const [quickPriceBook, setQuickPriceBook] = useState<BookItem | null>(null);
  const [quickPriceInput, setQuickPriceInput] = useState<string>('');

  // Delete Modal State
  const [isDeletingBook, setIsDeletingBook] = useState<BookItem | null>(null);

  // Form Submitting State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Fields for full edit
  const [formData, setFormData] = useState<{
    technology: string;
    semesterId: SemesterId;
    subjectCode: string;
    subjectName: string;
    credit: string;
    tpc: string;
    marketPrice: string; // string input, parsed to number or null
    author: string;
    publisher: string;
    edition: string;
    bookType: string;
    description: string;
    status: 'ACTIVE' | 'INACTIVE';
  }>({
    technology: 'cmt',
    semesterId: '1',
    subjectCode: '',
    subjectName: '',
    credit: '3',
    tpc: '2-3-3',
    marketPrice: '',
    author: '',
    publisher: '',
    edition: 'প্রবিধান ২০২২',
    bookType: 'COMPULSORY',
    description: '',
    status: 'ACTIVE',
  });

  // Action Sheet Modals for Form selections
  const [isFormTechSheetOpen, setIsFormTechSheetOpen] = useState<boolean>(false);
  const [isFormSemesterSheetOpen, setIsFormSemesterSheetOpen] = useState<boolean>(false);
  const [isFormBookTypeSheetOpen, setIsFormBookTypeSheetOpen] = useState<boolean>(false);
  const [isFormStatusSheetOpen, setIsFormStatusSheetOpen] = useState<boolean>(false);

  // Subscribe to all books (sources from Master Curriculum + overlays Firestore edits & prices)
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeAllBooks(
      (allBooks) => {
        setBooks(allBooks);
        setIsLoading(false);
      },
      departments,
      (err) => {
        console.error('Failed to subscribe books:', err);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [departments]);

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Options for Technology Filter Action Sheet
  const filterTechOptions: SelectOption[] = useMemo(() => {
    const list: SelectOption[] = [
      {
        value: 'all',
        label: 'সকল টেকনোলজি',
        sublabel: 'সকল ডিপার্টমেন্টের বই দেখুন',
        badge: 'ALL',
        icon: GraduationCap,
      },
    ];
    technologies.forEach((t) => {
      list.push({
        value: t.id,
        label: t.name,
        sublabel: `কোড: ${t.code}`,
        badge: t.code,
        icon: GraduationCap,
      });
    });
    return list;
  }, [technologies]);

  // Options for Semester Filter Action Sheet
  const filterSemesterOptions: SelectOption[] = useMemo(() => {
    const list: SelectOption[] = [
      {
        value: 'all',
        label: 'সকল সেমিস্টার',
        sublabel: '১ম থেকে ৮ম সব সেমিস্টার',
        badge: 'ALL',
        icon: Calendar,
      },
    ];
    SEMESTER_OPTIONS.forEach((s) => {
      list.push({
        value: s.id,
        label: s.label,
        sublabel: `${s.en.toUpperCase()}`,
        badge: `পর্ব ${toBanglaDigits(s.id)}`,
        icon: Calendar,
      });
    });
    return list;
  }, []);

  // Form Select Options
  const formTechOptions: SelectOption[] = useMemo(() => {
    return technologies.map((t) => ({
      value: t.id,
      label: t.name,
      sublabel: `কোড: ${t.code}`,
      badge: t.code,
      icon: GraduationCap,
    }));
  }, [technologies]);

  const formSemesterOptions: SelectOption[] = useMemo(() => {
    return SEMESTER_OPTIONS.map((s) => ({
      value: s.id,
      label: s.label,
      sublabel: `${s.en.toUpperCase()}`,
      badge: `পর্ব ${toBanglaDigits(s.id)}`,
      icon: Calendar,
    }));
  }, []);

  const formBookTypeOptions: SelectOption[] = [
    {
      value: 'COMPULSORY',
      label: 'বাধ্যতামূলক (COMPULSORY)',
      sublabel: 'কারিকুলাম নির্ধারিত আবশ্যক পাঠ্য বিষয়',
      badge: 'আবশ্যক',
      icon: BookOpen,
    },
    {
      value: 'ELECTIVE',
      label: 'ঐচ্ছিক (ELECTIVE)',
      sublabel: 'শিক্ষার্থী কর্তৃক নির্বাচিত ঐচ্ছিক বিষয়',
      badge: 'ঐচ্ছিক',
      icon: Layers,
    },
    {
      value: 'OPTIONAL',
      label: 'অপশনাল (OPTIONAL)',
      sublabel: 'অতিরিক্ত বা বিশেষ বিষয়',
      badge: 'অপশনাল',
      icon: BookOpen,
    },
  ];

  const formStatusOptions: SelectOption[] = [
    {
      value: 'ACTIVE',
      label: 'সক্রিয় (ACTIVE)',
      sublabel: 'শিক্ষার্থীদের তালিকায় প্রদর্শিত হবে',
      badge: 'চলমান',
      icon: Check,
    },
    {
      value: 'INACTIVE',
      label: 'নিষ্ক্রিয় (INACTIVE)',
      sublabel: 'সাময়িকভাবে শিক্ষার্থী তালিকায় লুকানো থাকবে',
      badge: 'লুকানো',
      icon: X,
    },
  ];

  // Selected labels for trigger display
  const currentFilterTechLabel = useMemo(() => {
    if (filterTech === 'all') return 'সকল টেকনোলজি';
    const found = technologies.find(
      (t) =>
        t.id.toLowerCase() === filterTech.toLowerCase() ||
        normalizeTechnologyKey(t.id, departments) === normalizeTechnologyKey(filterTech, departments)
    );
    return found ? found.name : filterTech;
  }, [filterTech, technologies, departments]);

  const currentFilterSemesterLabel = useMemo(() => {
    if (filterSemester === 'all') return 'সকল সেমিস্টার';
    const found = SEMESTER_OPTIONS.find((s) => s.id === filterSemester);
    return found ? `${found.label} (${found.en.toUpperCase()})` : `পর্ব ${filterSemester}`;
  }, [filterSemester]);

  // Robust filtering: uses department-aware normalizeTechnologyKey so every technology filter matches
  const filteredBooks = useMemo(() => {
    const normFilterTech = normalizeTechnologyKey(filterTech, departments);
    const cleanSem = filterSemester !== 'all' ? String(filterSemester).trim() : null;
    const q = searchQuery.toLowerCase().trim();

    return books.filter((b) => {
      // Technology match
      if (normFilterTech !== 'ALL') {
        const normBookTech = normalizeTechnologyKey(b.technology, departments);
        if (normBookTech !== normFilterTech) {
          return false;
        }
      }

      // Semester match
      if (cleanSem) {
        if (String(b.semesterId).trim() !== cleanSem) {
          return false;
        }
      }

      // Search match
      if (q) {
        const nameMatch = (b.subjectName || '').toLowerCase().includes(q);
        const codeMatch = (b.subjectCode || '').toLowerCase().includes(q);
        const authorMatch = (b.author || '').toLowerCase().includes(q);
        const publisherMatch = (b.publisher || '').toLowerCase().includes(q);
        if (!nameMatch && !codeMatch && !authorMatch && !publisherMatch) {
          return false;
        }
      }

      return true;
    });
  }, [books, filterTech, filterSemester, searchQuery, departments]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredBooks.length;
    const priced = filteredBooks.filter(
      (b) => typeof b.marketPrice === 'number' && b.marketPrice > 0
    ).length;
    const unpriced = total - priced;
    return { total, priced, unpriced };
  }, [filteredBooks]);

  // Open Form Modal for Edit
  const handleOpenEditModal = (book: BookItem) => {
    setEditingBook(book);
    setFormData({
      technology: book.technology,
      semesterId: book.semesterId,
      subjectCode: book.subjectCode,
      subjectName: book.subjectName,
      credit: book.credit !== undefined ? String(book.credit) : '',
      tpc: book.tpc || '',
      marketPrice:
        typeof book.marketPrice === 'number' && book.marketPrice > 0
          ? String(book.marketPrice)
          : '',
      author: book.author || '',
      publisher: book.publisher || '',
      edition: book.edition || 'প্রবিধান ২০২২',
      bookType: book.bookType || 'COMPULSORY',
      description: book.description || '',
      status: book.status || 'ACTIVE',
    });
    setIsEditModalOpen(true);
  };

  // Open Quick Price Modal
  const handleOpenQuickPrice = (book: BookItem) => {
    setQuickPriceBook(book);
    setQuickPriceInput(
      typeof book.marketPrice === 'number' && book.marketPrice > 0
        ? String(book.marketPrice)
        : ''
    );
  };

  // Save Quick Price
  const handleSaveQuickPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPriceBook) return;

    setIsSubmitting(true);
    try {
      const rawPrice = toEnglishDigits(quickPriceInput.trim());
      const parsedPrice = rawPrice && Number(rawPrice) > 0 ? Number(rawPrice) : null;

      await saveOrUpdateBook(quickPriceBook.id, {
        marketPrice: parsedPrice,
        technology: quickPriceBook.technology,
        semesterId: quickPriceBook.semesterId,
        subjectCode: quickPriceBook.subjectCode,
        subjectName: quickPriceBook.subjectName,
      });

      setToastMessage(
        parsedPrice
          ? `"${quickPriceBook.subjectName}" বইয়ের মূল্য ৳${toBanglaDigits(parsedPrice)} নির্ধারণ করা হয়েছে!`
          : `"${quickPriceBook.subjectName}" বইয়ের মূল্য মুছে দেওয়া হয়েছে (কোনো মূল্য দেখাবে না)!`
      );
      setQuickPriceBook(null);
    } catch (err: any) {
      console.error('Failed to update price:', err);
      alert('মূল্য আপডেট করতে সমস্যা হয়েছে: ' + (err?.message || 'অজানা ত্রুটি'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Full Form Submit (Edit Book)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;

    if (!formData.subjectName.trim() || !formData.subjectCode.trim()) {
      alert('বইয়ের নাম এবং বিষয় কোড আবশ্যক!');
      return;
    }

    setIsSubmitting(true);
    try {
      const techName = getTechBanglaName(formData.technology, departments);
      const semName = getSemesterBanglaName(formData.semesterId);

      const parsedCredit = Number(toEnglishDigits(formData.credit)) || undefined;
      const rawPrice = toEnglishDigits(formData.marketPrice.trim());
      const parsedPrice = rawPrice && Number(rawPrice) > 0 ? Number(rawPrice) : null;

      await saveOrUpdateBook(editingBook.id, {
        technology: formData.technology,
        technologyName: techName,
        semesterId: formData.semesterId,
        semesterName: semName,
        subjectCode: formData.subjectCode.trim(),
        subjectName: formData.subjectName.trim(),
        credit: parsedCredit,
        tpc: formData.tpc.trim() || undefined,
        marketPrice: parsedPrice,
        author: formData.author.trim() || undefined,
        publisher: formData.publisher.trim() || undefined,
        edition: formData.edition.trim() || undefined,
        bookType: formData.bookType as any,
        description: formData.description.trim() || undefined,
        status: formData.status,
      });

      setToastMessage(`"${formData.subjectName}" সফলভাবে আপডেট করা হয়েছে!`);
      setIsEditModalOpen(false);
      setEditingBook(null);
    } catch (err: any) {
      console.error('Failed to save book:', err);
      alert('বইয়ের তথ্য সংরক্ষণ করতে সমস্যা হয়েছে: ' + (err?.message || 'অজানা ত্রুটি'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Book
  const handleConfirmDelete = async () => {
    if (!isDeletingBook) return;
    setIsSubmitting(true);
    try {
      await deleteBook(isDeletingBook.id);
      setToastMessage(`"${isDeletingBook.subjectName}" তালিকা থেকে মুছে ফেলা হয়েছে!`);
      setIsDeletingBook(null);
    } catch (err: any) {
      console.error('Failed to delete book:', err);
      alert('বই মুছতে সমস্যা হয়েছে: ' + (err?.message || 'অজানা ত্রুটি'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= HEADER SECTION ================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                পাঠ্যবই ও সিলেবাস ব্যবস্থাপনা
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              সার্ভারে বিটিইবি কারিকুলাম নির্ধারিত সকল টেকনোলজির বই যুক্ত রয়েছে। যেকোনো বিষয়ের তথ্য বা
              বাজার মূল্য সম্পাদনা করতে পারবেন। <strong>ডিফল্টভাবে মূল্য সেট না থাকলে কোনো মূল্য প্রদর্শিত হবে না।</strong>
            </p>
          </div>

          {/* Quick Counter Pills */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <div className="px-3.5 py-2 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-blue-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>মোট বই: {toBanglaDigits(stats.total)}</span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span>মূল্য সেট করা: {toBanglaDigits(stats.priced)}</span>
            </div>
            {stats.unpriced > 0 && (
              <div className="px-3.5 py-2 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5">
                <span>মূল্য ছাড়া: {toBanglaDigits(stats.unpriced)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= MODERN ACTION SHEET FILTER BAR ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap flex-1">
          {/* Technology Filter Trigger (Modern Action Sheet) */}
          <button
            type="button"
            onClick={() => setIsFilterTechSheetOpen(true)}
            className="px-3.5 py-2.5 bg-slate-50 hover:bg-white border border-slate-200/90 hover:border-blue-400 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs group"
            title="টেকনোলজি ফিল্টার নির্বাচন করুন"
          >
            <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-slate-800 max-w-[180px] truncate">{currentFilterTechLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors ml-1" />
          </button>

          {/* Semester Filter Trigger (Modern Action Sheet) */}
          <button
            type="button"
            onClick={() => setIsFilterSemesterSheetOpen(true)}
            className="px-3.5 py-2.5 bg-slate-50 hover:bg-white border border-slate-200/90 hover:border-emerald-400 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs group"
            title="সেমিস্টার ফিল্টার নির্বাচন করুন"
          >
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-slate-800 max-w-[160px] truncate">{currentFilterSemesterLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors ml-1" />
          </button>

          {/* Reset filter button if any active filter */}
          {(filterTech !== 'all' || filterSemester !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setFilterTech('all');
                setFilterSemester('all');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
            >
              ফিল্টার রিসেট
            </button>
          )}
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="বইয়ের নাম, বিষয় কোড বা প্রকাশনী..."
            className="w-full pl-8.5 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* ================= BOOKS TABLE / EMPTY STATE ================= */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span>সার্ভার থেকে পাঠ্যবই তালিকা লোড হচ্ছে...</span>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center max-w-lg mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-900">কোনো বই মেলেনি</h3>
          <p className="text-xs text-slate-500">
            {searchQuery
              ? 'অনুসন্ধানের সাথে কোনো বই মেলেনি। ফিল্টার রিসেট করুন অথবা ভিন্ন কিওয়ার্ড লিখুন।'
              : 'নির্বাচিত ফিল্টারের জন্য কোনো বইয়ের রেকর্ড খুঁজে পাওয়া যায়নি। ফিল্টার পরিবর্তন করে দেখুন।'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFilterTech('all');
                setFilterSemester('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>সকল বই দেখুন</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          {/* Mobile Card List (< md) */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredBooks.map((book) => {
              const hasPrice = typeof book.marketPrice === 'number' && book.marketPrice > 0;
              return (
                <div key={book.id} className="p-4 space-y-3 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 text-[11px] font-black">
                          {toBanglaDigits(book.subjectCode)}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[10px] font-bold">
                          {getSemesterBanglaName(book.semesterId)}
                        </span>
                        {book.credit !== undefined && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {toBanglaDigits(book.credit)} ক্রেডিট
                          </span>
                        )}
                      </div>
                      <h4 className="font-black text-slate-900 text-sm leading-snug">
                        {book.subjectName}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                        {getTechBanglaName(book.technology, departments)}
                      </p>
                    </div>

                    {/* Price Badge / Set Price Button */}
                    <div className="shrink-0">
                      {hasPrice ? (
                        <button
                          type="button"
                          onClick={() => handleOpenQuickPrice(book)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-black text-xs transition-colors cursor-pointer"
                          title="মূল্য পরিবর্তন করতে ক্লিক করুন"
                        >
                          <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>৳{toBanglaDigits(book.marketPrice!)}</span>
                          <Edit2 className="w-3 h-3 text-amber-500 opacity-60 ml-0.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenQuickPrice(book)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200/80 hover:border-blue-200 text-xs font-bold transition-all cursor-pointer"
                          title="বইয়ের বাজার মূল্য সেট করুন"
                        >
                          <Coins className="w-3.5 h-3.5 text-slate-400" />
                          <span>মূল্য সেট করুন</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Author / Publisher / TPC */}
                  {(book.author || book.publisher || book.tpc) && (
                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 border-t border-slate-100">
                      {book.author && <span>লেখক: {book.author}</span>}
                      {book.publisher && <span>প্রকাশক: {book.publisher}</span>}
                      {book.tpc && <span className="font-outfit font-bold">TPC: {book.tpc}</span>}
                    </div>
                  )}

                  {/* Action Buttons for Mobile */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(book)}
                      className="px-3 py-1.5 rounded-xl text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200/70 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>সম্পাদনা</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDeletingBook(book)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-black uppercase text-slate-600 tracking-wider">
                  <th className="py-3 px-4">বিষয় কোড</th>
                  <th className="py-3 px-4">বইয়ের নাম</th>
                  <th className="py-3 px-4">টেকনোলজি ও সেমিস্টার</th>
                  <th className="py-3 px-4">ক্রেডিট ও T-P-C</th>
                  <th className="py-3 px-4">লেখক ও প্রকাশনী</th>
                  <th className="py-3 px-4">বাজার মূল্য (ঐচ্ছিক)</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {filteredBooks.map((book) => {
                  const hasPrice = typeof book.marketPrice === 'number' && book.marketPrice > 0;
                  return (
                    <tr
                      key={book.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Code */}
                      <td className="py-3.5 px-4 font-black">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 text-xs font-black">
                          {toBanglaDigits(book.subjectCode)}
                        </span>
                      </td>

                      {/* Subject Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-900">{book.subjectName}</div>
                        {book.edition && (
                          <span className="text-[10px] text-slate-500 font-bold">
                            {book.edition}
                          </span>
                        )}
                      </td>

                      {/* Tech & Semester */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">
                          {getTechBanglaName(book.technology, departments)}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-bold">
                          {getSemesterBanglaName(book.semesterId)}
                        </div>
                      </td>

                      {/* Credit & TPC */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {book.credit !== undefined && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-black text-[11px]">
                              {toBanglaDigits(book.credit)} ক্রেডিট
                            </span>
                          )}
                          {book.tpc && (
                            <span className="text-[10px] font-outfit text-slate-600 font-bold">
                              {book.tpc}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Author & Publisher */}
                      <td className="py-3.5 px-4">
                        {book.author && (
                          <div className="text-slate-700 truncate max-w-[140px]" title={book.author}>
                            {book.author}
                          </div>
                        )}
                        {book.publisher && (
                          <div
                            className="text-[10px] text-slate-500 truncate max-w-[140px]"
                            title={book.publisher}
                          >
                            {book.publisher}
                          </div>
                        )}
                        {!book.author && !book.publisher && (
                          <span className="text-slate-400 italic">তথ্য নেই</span>
                        )}
                      </td>

                      {/* Market Price (Default state shows NO price, with easy set button) */}
                      <td className="py-3.5 px-4 font-bold">
                        {hasPrice ? (
                          <button
                            type="button"
                            onClick={() => handleOpenQuickPrice(book)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-black text-xs transition-colors cursor-pointer"
                            title="মূল্য পরিবর্তন করতে ক্লিক করুন"
                          >
                            <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>৳{toBanglaDigits(book.marketPrice!)}</span>
                            <Edit2 className="w-3 h-3 text-amber-500 opacity-60 ml-0.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenQuickPrice(book)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200/80 hover:border-blue-200 text-[11px] font-bold transition-all cursor-pointer"
                            title="বইয়ের আনুমানিক বাজার মূল্য সেট করুন"
                          >
                            <Coins className="w-3 h-3 text-slate-400" />
                            <span>মূল্য সেট করুন</span>
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Full Book Details */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(book)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                            title="বই সম্পাদনা করুন"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Book */}
                          <button
                            type="button"
                            onClick={() => setIsDeletingBook(book)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= EDIT BOOK SLIDING ACTION SHEET ================= */}
      <AnimatePresence>
        {isEditModalOpen && editingBook && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center font-bengali">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-md"
              onClick={() => !isSubmitting && setIsEditModalOpen(false)}
            />

            {/* Sliding Action Sheet */}
            <motion.div
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full sm:max-w-2xl bg-white rounded-t-[32px] sm:rounded-[30px] shadow-[0_-20px_50px_rgba(15,23,42,0.22)] z-10 flex flex-col max-h-[92vh] overflow-hidden border-t sm:border border-slate-200/90"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle Bar */}
              <div className="pt-3 pb-1 flex justify-center shrink-0">
                <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto transition-colors" />
              </div>

              {/* Action Sheet Header with SVG Icons */}
              <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/70 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/80 shrink-0 shadow-2xs">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      বইয়ের তথ্য ও বাজার মূল্য সম্পাদনা
                    </h3>
                    <p className="text-[11px] text-slate-500 font-bold truncate">
                      বিষয়: {editingBook.subjectName} ({toBanglaDigits(editingBook.subjectCode)})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSubmitting}
                  className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 hover:text-slate-950 flex items-center justify-center transition-all cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Sheet Form */}
              <form onSubmit={handleSubmitForm} className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs">
                {/* Row 1: Technology & Semester (Modern Action Sheet Triggers) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SelectTrigger
                    label="টেকনোলজি / বিভাগ"
                    required
                    value={formData.technology}
                    displayValue={getTechBanglaName(formData.technology, departments)}
                    onClick={() => setIsFormTechSheetOpen(true)}
                    icon={GraduationCap}
                  />

                  <SelectTrigger
                    label="সেমিস্টার / পর্ব"
                    required
                    value={formData.semesterId}
                    displayValue={getSemesterBanglaName(formData.semesterId)}
                    onClick={() => setIsFormSemesterSheetOpen(true)}
                    icon={Calendar}
                  />
                </div>

                {/* Row 2: Subject Code & Subject Name with SVG Icons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      বিষয় কোড <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={formData.subjectCode}
                        onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                        placeholder="যেমন: 28511"
                        className="w-full pl-8.5 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      বই বা বিষয়ের নাম <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={formData.subjectName}
                        onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                        placeholder="যেমন: কম্পিউটার অ্যাপ্লিকেশন"
                        className="w-full pl-8.5 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Credit & TPC with SVG Icons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ক্রেডিট (যেমন: 2, 3, 4)</label>
                    <div className="relative">
                      <Award className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="number"
                        value={formData.credit}
                        onChange={(e) => setFormData({ ...formData, credit: e.target.value })}
                        placeholder="3"
                        className="w-full pl-8.5 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">T-P-C (ঐচ্ছিক)</label>
                    <div className="relative">
                      <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={formData.tpc}
                        onChange={(e) => setFormData({ ...formData, tpc: e.target.value })}
                        placeholder="2-3-3"
                        className="w-full pl-8.5 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 4: CRITICAL - Market Price Section with Quick Presets */}
                <div className="p-3.5 sm:p-4 bg-amber-50/70 border border-amber-200/90 rounded-2xl space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-amber-950 flex items-center gap-1.5 text-xs">
                      <Coins className="w-4 h-4 text-amber-600" />
                      <span>বইয়ের বাজার মূল্য (টাকা ৳) - ঐচ্ছিক</span>
                    </label>
                    {formData.marketPrice && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, marketPrice: '' })}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>মূল্য মুছুন</span>
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-amber-700 text-sm">
                      ৳
                    </span>
                    <input
                      type="number"
                      value={formData.marketPrice}
                      onChange={(e) => setFormData({ ...formData, marketPrice: e.target.value })}
                      placeholder="যেমন: 220 বা 280 (খালি রাখলে কোনো মূল্য দেখাবে না)"
                      className="w-full pl-8 pr-3 py-2 bg-white border border-amber-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>

                  {/* Quick Preset Chips */}
                  <div>
                    <div className="text-[10px] font-bold text-amber-900 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>১-ক্লিকে মূল্য নির্বাচন করুন:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[150, 180, 200, 220, 250, 280, 300, 350, 400].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setFormData({ ...formData, marketPrice: String(preset) })}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                            formData.marketPrice === String(preset)
                              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                              : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-200'
                          }`}
                        >
                          ৳{toBanglaDigits(preset)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-amber-800 leading-normal flex items-start gap-1 pt-1 border-t border-amber-200/60">
                    <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>নিয়ম:</strong> এখানে মূল্য খালি রাখলে ছাত্রছাত্রীদের কাছে কোনো মূল্য ট্যাগ
                      প্রদর্শিত হবে না। মূল্য সেট করতে চাইলে টাকার পরিমাণ লিখুন।
                    </span>
                  </p>
                </div>

                {/* Row 5: Author & Publisher with SVG Icons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">লেখক (ঐচ্ছিক)</label>
                    <div className="relative">
                      <PenTool className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        placeholder="যেমন: প্রকৌশলী মোঃ ..."
                        className="w-full pl-8.5 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">প্রকাশনী (ঐচ্ছিক)</label>
                    <div className="relative">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={formData.publisher}
                        onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                        placeholder="যেমন: হক পাবলিকেশন্স / টেকনিক্যাল"
                        className="w-full pl-8.5 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 6: Regulation / Edition & Subject Type & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">প্রবিধান সংস্করণ</label>
                    <div className="relative">
                      <Bookmark className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={formData.edition}
                        onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                        placeholder="প্রবিধান ২০২২"
                        className="w-full pl-8.5 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <SelectTrigger
                    label="বিষয়ের ধরন"
                    value={formData.bookType}
                    displayValue={
                      formData.bookType === 'COMPULSORY'
                        ? 'বাধ্যতামূলক'
                        : formData.bookType === 'ELECTIVE'
                        ? 'ঐচ্ছিক'
                        : 'অপশনাল'
                    }
                    onClick={() => setIsFormBookTypeSheetOpen(true)}
                    icon={BookOpen}
                  />

                  <SelectTrigger
                    label="অবস্থা"
                    value={formData.status}
                    displayValue={formData.status === 'ACTIVE' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    onClick={() => setIsFormStatusSheetOpen(true)}
                    icon={CheckCircle2}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">বিশেষ বিবরণ বা নোট (ঐচ্ছিক)</label>
                  <div className="relative">
                    <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="বই বা বিষয় সম্পর্কিত সংক্ষিপ্ত নির্দেশনা..."
                      className="w-full pl-8.5 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>বাতিল</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'আপডেট সংরক্ষণ করুন'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= QUICK PRICE SLIDING ACTION SHEET ================= */}
      <AnimatePresence>
        {quickPriceBook && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center font-bengali">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-md"
              onClick={() => !isSubmitting && setQuickPriceBook(null)}
            />

            {/* Sliding Action Sheet */}
            <motion.div
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full sm:max-w-lg bg-white rounded-t-[32px] sm:rounded-[28px] shadow-[0_-15px_40px_rgba(15,23,42,0.18)] z-10 flex flex-col max-h-[90vh] overflow-hidden border-t sm:border border-slate-200/90"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle Bar */}
              <div className="pt-3 pb-1 flex justify-center shrink-0">
                <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto transition-colors" />
              </div>

              {/* Action Sheet Header with SVG Icons */}
              <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/70 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-300/40 shrink-0">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      বাজার মূল্য নির্ধারণ
                    </h3>
                    <p className="text-[11px] text-slate-500 font-bold truncate">
                      {quickPriceBook.subjectName} ({toBanglaDigits(quickPriceBook.subjectCode)})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickPriceBook(null)}
                  disabled={isSubmitting}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveQuickPrice} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
                {/* Book Badge summary */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-bold text-slate-800 truncate">{quickPriceBook.subjectName}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-black text-[11px] shrink-0 border border-blue-200/60">
                    কোড: {toBanglaDigits(quickPriceBook.subjectCode)}
                  </span>
                </div>

                {/* Input Price Area */}
                <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-600" />
                      <span>বাজার মূল্য (টাকা ৳)</span>
                    </label>
                    {quickPriceInput && (
                      <button
                        type="button"
                        onClick={() => setQuickPriceInput('')}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>মূল্য মুছুন</span>
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-amber-700 text-base">
                      ৳
                    </span>
                    <input
                      type="number"
                      autoFocus
                      value={quickPriceInput}
                      onChange={(e) => setQuickPriceInput(e.target.value)}
                      placeholder="যেমন: 250 (খালি রাখলে কোনো মূল্য দেখাবে না)"
                      className="w-full pl-8.5 pr-4 py-2.5 bg-white border border-amber-300 rounded-xl text-base font-black text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400 placeholder:text-xs placeholder:font-normal"
                    />
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="pt-1">
                    <div className="text-[10px] font-bold text-amber-800 mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>দ্রুত মূল্য নির্বাচন (১ ক্লিকে):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[150, 180, 200, 220, 250, 280, 300, 350, 400].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setQuickPriceInput(String(preset))}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                            quickPriceInput === String(preset)
                              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                              : 'bg-white hover:bg-amber-100/80 text-amber-900 border-amber-200'
                          }`}
                        >
                          ৳{toBanglaDigits(preset)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-amber-800 leading-relaxed flex items-start gap-1.5 pt-1.5 border-t border-amber-200/60">
                    <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>নিয়ম:</strong> মূল্য খালি রাখলে ছাত্রছাত্রীদের বুক লিস্টে কোনো মূল্য প্রদর্শন হবে না।
                    </span>
                  </p>
                </div>

                {/* Bottom Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setQuickPriceBook(null)}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all cursor-pointer text-xs flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>বাতিল</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-black shadow-xs transition-all text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'মূল্য সংরক্ষণ করুন'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= DELETE CONFIRMATION SLIDING ACTION SHEET ================= */}
      <AnimatePresence>
        {isDeletingBook && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center font-bengali">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-md"
              onClick={() => !isSubmitting && setIsDeletingBook(null)}
            />

            {/* Sliding Action Sheet */}
            <motion.div
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-[28px] shadow-[0_-15px_40px_rgba(15,23,42,0.18)] z-10 flex flex-col overflow-hidden border-t sm:border border-slate-200/90 p-5 sm:p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pt-1 pb-1 flex justify-center shrink-0">
                <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto transition-colors" />
              </div>

              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-black text-slate-900">বইটি তালিকা থেকে বাদ দিতে চান?</h3>
                <p className="text-xs text-slate-600">
                  &ldquo;<strong>{isDeletingBook.subjectName}</strong>&rdquo; (কোড:{' '}
                  {toBanglaDigits(isDeletingBook.subjectCode)}) সাময়িকভাবে তালিকা থেকে অপসারিত হবে।
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDeletingBook(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all cursor-pointer text-xs flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>না, রাখুন</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= ALL MODERN ACTION SHEETS (BOTTOM SHEETS) ================= */}

      {/* 1. Filter: Technology Action Sheet */}
      <SelectBottomSheet
        isOpen={isFilterTechSheetOpen}
        onClose={() => setIsFilterTechSheetOpen(false)}
        title="টেকনোলজি নির্বাচন করুন"
        subtitle="যেই টেকনোলজির বই তালিকা ফিল্টার করতে চান"
        options={filterTechOptions}
        selectedValue={filterTech}
        onSelect={(val) => {
          setFilterTech(val);
          setIsFilterTechSheetOpen(false);
        }}
        searchable={true}
      />

      {/* 2. Filter: Semester Action Sheet */}
      <SelectBottomSheet
        isOpen={isFilterSemesterSheetOpen}
        onClose={() => setIsFilterSemesterSheetOpen(false)}
        title="সেমিস্টার নির্বাচন করুন"
        subtitle="১ম থেকে ৮ম পর্বের যেকোনো সেমিস্টার ফিল্টার করুন"
        options={filterSemesterOptions}
        selectedValue={filterSemester}
        onSelect={(val) => {
          setFilterSemester(val);
          setIsFilterSemesterSheetOpen(false);
        }}
        searchable={false}
      />

      {/* 3. Form: Technology Action Sheet */}
      <SelectBottomSheet
        isOpen={isFormTechSheetOpen}
        onClose={() => setIsFormTechSheetOpen(false)}
        title="টেকনোলজি বা বিভাগ পরিবর্তন"
        subtitle="বইটির সংশ্লিষ্ট টেকনোলজি নির্ধারণ করুন"
        options={formTechOptions}
        selectedValue={formData.technology}
        onSelect={(val) => {
          setFormData((prev) => ({ ...prev, technology: val }));
          setIsFormTechSheetOpen(false);
        }}
        searchable={true}
      />

      {/* 4. Form: Semester Action Sheet */}
      <SelectBottomSheet
        isOpen={isFormSemesterSheetOpen}
        onClose={() => setIsFormSemesterSheetOpen(false)}
        title="সেমিস্টার বা পর্ব নির্বাচন"
        subtitle="পাঠ্যবইটির জন্য সেমিস্টার নির্ধারণ করুন"
        options={formSemesterOptions}
        selectedValue={formData.semesterId}
        onSelect={(val) => {
          setFormData((prev) => ({ ...prev, semesterId: val as SemesterId }));
          setIsFormSemesterSheetOpen(false);
        }}
        searchable={false}
      />

      {/* 5. Form: Book Type Action Sheet */}
      <SelectBottomSheet
        isOpen={isFormBookTypeSheetOpen}
        onClose={() => setIsFormBookTypeSheetOpen(false)}
        title="বিষয়ের ধরন নির্বাচন"
        subtitle="বাধ্যতামূলক, ঐচ্ছিক নাকি অপশনাল"
        options={formBookTypeOptions}
        selectedValue={formData.bookType}
        onSelect={(val) => {
          setFormData((prev) => ({ ...prev, bookType: val }));
          setIsFormBookTypeSheetOpen(false);
        }}
        searchable={false}
      />

      {/* 6. Form: Status Action Sheet */}
      <SelectBottomSheet
        isOpen={isFormStatusSheetOpen}
        onClose={() => setIsFormStatusSheetOpen(false)}
        title="বইয়ের অবস্থা"
        subtitle="সক্রিয় থাকলে শিক্ষার্থীদের নিকট তালিকা দৃশ্যমান থাকবে"
        options={formStatusOptions}
        selectedValue={formData.status}
        onSelect={(val) => {
          setFormData((prev) => ({ ...prev, status: val as 'ACTIVE' | 'INACTIVE' }));
          setIsFormStatusSheetOpen(false);
        }}
        searchable={false}
      />
    </div>
  );
};
