/**
 * Universal Auto-Save Draft Storage Engine for DPIB Academic Documents.
 * Uses IndexedDB for large/structured documents, routines, questions, and results,
 * with seamless fallback to LocalStorage.
 */

const DB_NAME = 'dpib_academic_drafts_db';
const DB_VERSION = 1;
const STORE_NAME = 'document_drafts';

export interface DraftRecord<T = any> {
  docType: string;
  data: T;
  updatedAt: number;
}

let dbInstance: IDBDatabase | null = null;

const getDB = (): Promise<IDBDatabase | null> => {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'docType' });
        }
      };

      request.onsuccess = () => {
        dbInstance = request.result;
        resolve(dbInstance);
      };

      request.onerror = () => {
        console.warn('IndexedDB failed to open, falling back to LocalStorage');
        resolve(null);
      };
    } catch (e) {
      console.warn('IndexedDB exception, falling back to LocalStorage', e);
      resolve(null);
    }
  });
};

/**
 * Save draft state to IndexedDB with fallback to localStorage
 */
export async function saveDraft<T>(docType: string, data: T): Promise<void> {
  const record: DraftRecord<T> = {
    docType,
    data,
    updatedAt: Date.now(),
  };

  try {
    const db = await getDB();
    if (db) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      return;
    }
  } catch (err) {
    console.warn('Failed saving draft to IndexedDB, fallback to localStorage', err);
  }

  // Fallback to localStorage
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`dpib_draft_${docType}`, JSON.stringify(record));
    }
  } catch (e) {
    console.warn('LocalStorage saveDraft error:', e);
  }
}

/**
 * Retrieve draft state from IndexedDB or fallback to localStorage
 */
export async function getDraft<T>(docType: string): Promise<DraftRecord<T> | null> {
  try {
    const db = await getDB();
    if (db) {
      const res = await new Promise<DraftRecord<T> | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(docType);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
      if (res) return res;
    }
  } catch (err) {
    console.warn('Failed getting draft from IndexedDB, fallback to localStorage', err);
  }

  // Fallback to localStorage
  try {
    if (typeof window !== 'undefined') {
      const item = localStorage.getItem(`dpib_draft_${docType}`);
      if (item) {
        return JSON.parse(item) as DraftRecord<T>;
      }
    }
  } catch (e) {
    console.warn('LocalStorage getDraft error:', e);
  }

  return null;
}

/**
 * Clear draft state when finalized/published or explicitly reset
 */
export async function clearDraft(docType: string): Promise<void> {
  try {
    const db = await getDB();
    if (db) {
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(docType);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    }
  } catch (err) {
    console.warn('Failed clearing draft in IndexedDB', err);
  }

  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`dpib_draft_${docType}`);
    }
  } catch (e) {
    // Ignore
  }
}

/**
 * Format draft time in friendly Bangla format
 */
export function formatDraftTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = (hours % 12 || 12).toString().padStart(2, '0');

  return `${displayHours}:${minutes} ${ampm}`;
}
