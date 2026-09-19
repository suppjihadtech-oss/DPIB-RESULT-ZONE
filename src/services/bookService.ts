import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { BookItem, SemesterId, Department } from '../types';
import { OperationType, handleFirestoreError } from './db';
import { MASTER_CURRICULUM_DATA, normalizeTechnologyKey } from '../data/masterCurriculum';
import { toEnglishDigits } from '../utils/bangla';

export const BOOK_COLLECTION = 'books';

export const SEMESTER_OPTIONS: { id: SemesterId; label: string; en: string }[] = [
  { id: '1', label: '১ম পর্ব', en: '1st Semester' },
  { id: '2', label: '২য় পর্ব', en: '2nd Semester' },
  { id: '3', label: '৩য় পর্ব', en: '3rd Semester' },
  { id: '4', label: '৪র্থ পর্ব', en: '4th Semester' },
  { id: '5', label: '৫ম পর্ব', en: '5th Semester' },
  { id: '6', label: '৬ষ্ঠ পর্ব', en: '6th Semester' },
  { id: '7', label: '৭ম পর্ব', en: '7th Semester' },
  { id: '8', label: '৮ম পর্ব', en: '8th Semester' },
];

export const DEFAULT_BOOK_TECHNOLOGIES: { id: string; name: string; code: string }[] = [
  { id: 'cmt', name: 'কম্পিউটার টেকনোলজি (CMT)', code: 'CMT' },
  { id: 'ct', name: 'সিভিল টেকনোলজি (CT)', code: 'CT' },
  { id: 'et', name: 'ইলেকট্রিক্যাল টেকনোলজি (ET)', code: 'ET' },
  { id: 'mt', name: 'মেকানিক্যাল টেকনোলজি (MT)', code: 'MT' },
  { id: 'mrt', name: 'মেরিন টেকনোলজি (MRT)', code: 'MRT' },
  { id: 'st', name: 'সার্ভেয়িং টেকনোলজি (ST)', code: 'ST' },
];

export function getSemesterBanglaName(semesterId: string): string {
  const found = SEMESTER_OPTIONS.find((s) => s.id === String(semesterId));
  return found ? found.label : `${semesterId}ম পর্ব`;
}

export function getTechBanglaName(techId: string, departments?: Department[]): string {
  if (!techId) return '';
  const clean = techId.toLowerCase().trim();
  if (clean === 'all' || clean.includes('সকল')) return 'সকল টেকনোলজি';
  if (departments && departments.length > 0) {
    const d = departments.find(
      (dept) =>
        dept.id.toLowerCase() === clean ||
        dept.code.toLowerCase() === clean ||
        normalizeTechnologyKey(dept.id) === normalizeTechnologyKey(clean)
    );
    if (d) return d.name;
  }
  const defaultFound = DEFAULT_BOOK_TECHNOLOGIES.find(
    (t) =>
      t.id.toLowerCase() === clean ||
      t.code.toLowerCase() === clean ||
      normalizeTechnologyKey(t.id) === normalizeTechnologyKey(clean)
  );
  if (defaultFound) return defaultFound.name;
  return techId.toUpperCase();
}

/**
 * Converts Master Curriculum database entries into standard BookItem models.
 * Default marketPrice is null so NO price is shown unless admin explicitly sets one.
 */
export function getMasterBooksForTechAndSemester(
  technology: string,
  semesterId?: string,
  departments?: Department[]
): BookItem[] {
  const normKey = normalizeTechnologyKey(technology, departments);
  const isAll = normKey === 'ALL' || technology.toLowerCase() === 'all';

  const cleanSem = semesterId && semesterId !== 'all' ? String(semesterId).trim() : null;

  const targetSubjects = MASTER_CURRICULUM_DATA.filter((item) => {
    const matchTech = isAll || normalizeTechnologyKey(item.technology, departments) === normKey;
    if (!matchTech) return false;
    if (cleanSem) {
      return String(item.semesterId).trim() === cleanSem || item.semester.startsWith(cleanSem);
    }
    return true;
  });

  return targetSubjects.map((sub) => {
    // Determine credit & TPC from curriculum full marks
    let credit = 3;
    let tpc = '2-3-3';
    if (sub.curriculumFullMarks === 50) {
      credit = 1;
      tpc = '0-3-1';
    } else if (sub.curriculumFullMarks === 100) {
      credit = 2;
      tpc = '2-0-2';
    } else if (sub.curriculumFullMarks === 150) {
      credit = 3;
      tpc = '2-3-3';
    } else if (sub.curriculumFullMarks >= 200) {
      credit = 4;
      tpc = '3-3-4';
    }

    const canonicalTech = normalizeTechnologyKey(sub.technology, departments);
    const id = `${canonicalTech}_${sub.semesterId}_${sub.subjectCode}`;

    return {
      id,
      technology: canonicalTech.toLowerCase(),
      technologyName: getTechBanglaName(canonicalTech, departments),
      semesterId: sub.semesterId as SemesterId,
      semesterName: getSemesterBanglaName(sub.semesterId),
      subjectCode: sub.subjectCode,
      subjectName: sub.subjectName,
      credit,
      tpc,
      marketPrice: null, // by default NO price is shown unless admin sets it
      author: 'বিটিইবি পাঠ্যক্রম প্রণয়ন কমিটি',
      publisher: 'বিটিইবি অনুমোদিত / টেকনিক্যাল বা হক পাবলিকেশন্স',
      edition: 'প্রবিধান ২০২২',
      bookType: 'COMPULSORY' as const,
      description: `বাংলাদেশ কারিগরি শিক্ষা বোর্ড (বিটিইবি) ডিপ্লোমা কারিকুলাম নির্ধারিত বিষয়। পূর্ণমান: ${sub.curriculumFullMarks}`,
      status: 'ACTIVE' as const,
      createdAt: 0,
      updatedAt: 0,
    };
  });
}

/**
 * Real-time listener for books filtered by Technology and Semester.
 * Pulls from Master Curriculum database and overlays any admin edits & prices from Firestore.
 */
export function subscribeBooksByTechAndSemester(
  technology: string,
  semesterId: string,
  callback: (books: BookItem[]) => void,
  departmentsOrError?: Department[] | ((err: Error) => void),
  onError?: (err: Error) => void
): Unsubscribe {
  let departments: Department[] | undefined;
  let errorHandler = onError;
  if (typeof departmentsOrError === 'function') {
    errorHandler = departmentsOrError;
  } else if (Array.isArray(departmentsOrError)) {
    departments = departmentsOrError;
  }

  try {
    const baseMasterBooks = getMasterBooksForTechAndSemester(technology, semesterId, departments);

    // Call immediately with master books so UI never shows a blank/empty screen
    callback(baseMasterBooks);

    const normKey = normalizeTechnologyKey(technology, departments);

    const q = query(collection(db, BOOK_COLLECTION));

    return onSnapshot(
      q,
      (snapshot) => {
        const firestoreMap = new Map<string, any>();

        snapshot.forEach((d) => {
          const data = d.data();
          firestoreMap.set(d.id, { id: d.id, ...data });

          if (data.technology && data.semesterId && data.subjectCode) {
            const compositeKey = `${normalizeTechnologyKey(data.technology, departments)}_${data.semesterId}_${data.subjectCode}`;
            firestoreMap.set(compositeKey, { id: d.id, ...data });
          }
        });

        // Overlay Firestore edits on top of Master books
        const merged: BookItem[] = baseMasterBooks.map((mb) => {
          const compositeKey = `${normalizeTechnologyKey(mb.technology, departments)}_${mb.semesterId}_${mb.subjectCode}`;
          const override = firestoreMap.get(mb.id) || firestoreMap.get(compositeKey);

          if (override) {
            const rawPrice = override.marketPrice;
            const parsedPrice =
              typeof rawPrice === 'number' && rawPrice > 0
                ? rawPrice
                : typeof rawPrice === 'string' && Number(rawPrice) > 0
                ? Number(rawPrice)
                : null;

            return {
              ...mb,
              ...override,
              marketPrice: parsedPrice, // null if not set
            };
          }
          return mb;
        });

        // Also check if any additional custom books created in Firestore match this filter
        snapshot.forEach((d) => {
          const data = d.data() as BookItem;
          const matchTech = normKey === 'ALL' || normalizeTechnologyKey(data.technology || '', departments) === normKey;
          const matchSem = !semesterId || semesterId === 'all' || String(data.semesterId) === String(semesterId);

          if (matchTech && matchSem) {
            const compositeKey = `${normalizeTechnologyKey(data.technology || '', departments)}_${data.semesterId}_${data.subjectCode}`;
            const exists = merged.some(
              (m) => m.id === d.id || `${normalizeTechnologyKey(m.technology, departments)}_${m.semesterId}_${m.subjectCode}` === compositeKey
            );

            if (!exists) {
              const rawPrice = data.marketPrice;
              const parsedPrice =
                typeof rawPrice === 'number' && rawPrice > 0
                  ? rawPrice
                  : typeof rawPrice === 'string' && Number(rawPrice) > 0
                  ? Number(rawPrice)
                  : null;

              merged.push({
                ...data,
                id: d.id,
                marketPrice: parsedPrice,
              });
            }
          }
        });

        // Sort by subject code ascending
        merged.sort((a, b) => {
          const codeA = Number(toEnglishDigits(a.subjectCode || '0')) || 0;
          const codeB = Number(toEnglishDigits(b.subjectCode || '0')) || 0;
          if (codeA !== codeB) return codeA - codeB;
          return (a.subjectName || '').localeCompare(b.subjectName || '');
        });

        callback(merged);
      },
      (error) => {
        console.error('Error subscribing to books from Firestore:', error);
        if (errorHandler) errorHandler(error);
        // On firestore error, we still have master books rendered
      }
    );
  } catch (err: any) {
    console.error('Failed to subscribe books:', err);
    if (errorHandler) errorHandler(err);
    return () => {};
  }
}

/**
 * Real-time listener for ALL books in the institute (for Admin panel).
 * Sources from Master Curriculum and overlays Firestore edits/prices.
 */
export function subscribeAllBooks(
  callback: (books: BookItem[]) => void,
  departmentsOrError?: Department[] | ((err: Error) => void),
  onError?: (err: Error) => void
): Unsubscribe {
  let departments: Department[] | undefined;
  let errorHandler = onError;
  if (typeof departmentsOrError === 'function') {
    errorHandler = departmentsOrError;
  } else if (Array.isArray(departmentsOrError)) {
    departments = departmentsOrError;
  }

  try {
    // Generate full master curriculum books for all 6 technologies across all 8 semesters
    const allMasterBooks = getMasterBooksForTechAndSemester('all', 'all', departments);

    // Immediately deliver so admin panel loads without waiting
    callback(allMasterBooks);

    const q = query(collection(db, BOOK_COLLECTION));

    return onSnapshot(
      q,
      (snapshot) => {
        const firestoreMap = new Map<string, any>();

        snapshot.forEach((d) => {
          const data = d.data();
          firestoreMap.set(d.id, { id: d.id, ...data });

          if (data.technology && data.semesterId && data.subjectCode) {
            const compositeKey = `${normalizeTechnologyKey(data.technology, departments)}_${data.semesterId}_${data.subjectCode}`;
            firestoreMap.set(compositeKey, { id: d.id, ...data });
          }
        });

        // Overlay Firestore edits
        const merged: BookItem[] = allMasterBooks.map((mb) => {
          const compositeKey = `${normalizeTechnologyKey(mb.technology, departments)}_${mb.semesterId}_${mb.subjectCode}`;
          const override = firestoreMap.get(mb.id) || firestoreMap.get(compositeKey);

          if (override) {
            const rawPrice = override.marketPrice;
            const parsedPrice =
              typeof rawPrice === 'number' && rawPrice > 0
                ? rawPrice
                : typeof rawPrice === 'string' && Number(rawPrice) > 0
                ? Number(rawPrice)
                : null;

            return {
              ...mb,
              ...override,
              marketPrice: parsedPrice,
            };
          }
          return mb;
        });

        // Add custom books from Firestore that aren't in master curriculum
        snapshot.forEach((d) => {
          const data = d.data() as BookItem;
          const compositeKey = `${normalizeTechnologyKey(data.technology || '', departments)}_${data.semesterId}_${data.subjectCode}`;
          const exists = merged.some(
            (m) => m.id === d.id || `${normalizeTechnologyKey(m.technology, departments)}_${m.semesterId}_${m.subjectCode}` === compositeKey
          );

          if (!exists) {
            const rawPrice = data.marketPrice;
            const parsedPrice =
              typeof rawPrice === 'number' && rawPrice > 0
                ? rawPrice
                : typeof rawPrice === 'string' && Number(rawPrice) > 0
                ? Number(rawPrice)
                : null;

            merged.push({
              ...data,
              id: d.id,
              marketPrice: parsedPrice,
            });
          }
        });

        // Sort by technology, semesterId, subjectCode
        merged.sort((a, b) => {
          if (a.technology !== b.technology) {
            return (a.technology || '').localeCompare(b.technology || '');
          }
          if (a.semesterId !== b.semesterId) {
            return Number(a.semesterId) - Number(b.semesterId);
          }
          return (a.subjectCode || '').localeCompare(b.subjectCode || '');
        });

        callback(merged);
      },
      (error) => {
        console.error('Error subscribing to all books:', error);
        if (errorHandler) errorHandler(error);
      }
    );
  } catch (err: any) {
    console.error('Failed to subscribe all books:', err);
    if (errorHandler) errorHandler(err);
    return () => {};
  }
}

/**
 * Save or Update a Book Item in Firestore (using merge so it creates or edits).
 * Used when admin sets price, publisher, edition, or details on any book.
 */
export async function saveOrUpdateBook(
  id: string,
  updates: Partial<BookItem>
): Promise<string> {
  try {
    const cleanId = id || `${normalizeTechnologyKey(updates.technology || 'computer')}_${updates.semesterId || '1'}_${updates.subjectCode || '0'}`;
    const docRef = doc(db, BOOK_COLLECTION, cleanId);

    const now = Date.now();
    const cleanUpdates: any = {
      ...updates,
      id: cleanId,
      updatedAt: now,
    };

    if (cleanUpdates.technology) {
      cleanUpdates.technology = cleanUpdates.technology.toLowerCase().trim();
    }
    if (cleanUpdates.semesterId) {
      cleanUpdates.semesterId = String(cleanUpdates.semesterId);
    }
    if (cleanUpdates.marketPrice !== undefined) {
      cleanUpdates.marketPrice =
        typeof cleanUpdates.marketPrice === 'number' && cleanUpdates.marketPrice > 0
          ? Number(cleanUpdates.marketPrice)
          : typeof cleanUpdates.marketPrice === 'string' && Number(cleanUpdates.marketPrice) > 0
          ? Number(cleanUpdates.marketPrice)
          : null;
    }

    // Remove undefined values
    Object.keys(cleanUpdates).forEach((k) => {
      if (cleanUpdates[k] === undefined) delete cleanUpdates[k];
    });

    await setDoc(docRef, cleanUpdates, { merge: true });
    return cleanId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${BOOK_COLLECTION}/${id}`);
    throw error;
  }
}

/**
 * Update an existing Book item in Firestore
 */
export async function updateBook(
  id: string,
  updates: Partial<BookItem>
): Promise<void> {
  await saveOrUpdateBook(id, updates);
}

/**
 * Add a new Book item to Firestore (kept for compatibility)
 */
export async function createBook(
  bookData: Omit<BookItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const canonicalId = `${normalizeTechnologyKey(bookData.technology)}_${bookData.semesterId}_${bookData.subjectCode}`;
  return await saveOrUpdateBook(canonicalId, bookData);
}

/**
 * Delete / Reset a book override from Firestore (reverting to default Master Curriculum values)
 */
export async function deleteBook(id: string): Promise<void> {
  try {
    const docRef = doc(db, BOOK_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${BOOK_COLLECTION}/${id}`);
    throw error;
  }
}

/**
 * Compatibility seed function
 */
export async function seedBooksFromCurriculum(
  techKey: string,
  semesterId?: string,
  departments?: Department[]
): Promise<{ added: number; skipped: number }> {
  return { added: 0, skipped: 0 };
}

