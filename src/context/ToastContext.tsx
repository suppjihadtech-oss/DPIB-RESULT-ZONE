import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export type ToastType = 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO' | 'LOADING';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  id?: string;
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number; // In ms. If 0 or omitted for LOADING, stays until dismissed or updated
  action?: ToastAction;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number; // 0 for persistent/loading, e.g. 4000ms for regular
  createdAt: number;
  action?: ToastAction;
  isPaused?: boolean;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (options: ToastOptions) => string;
  success: (message: string, title?: string, options?: Partial<ToastOptions>) => string;
  error: (message: string, title?: string, options?: Partial<ToastOptions>) => string;
  warning: (message: string, title?: string, options?: Partial<ToastOptions>) => string;
  info: (message: string, title?: string, options?: Partial<ToastOptions>) => string;
  loading: (message: string, title?: string, options?: Partial<ToastOptions>) => string;
  update: (id: string, options: Partial<ToastOptions>) => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
  pauseToast: (id: string) => void;
  resumeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Global event bus for calling toast outside React tree or directly via import
type ToastSubscriber = (action: { type: 'SHOW' | 'UPDATE' | 'DISMISS' | 'CLEAR'; payload: any }) => void;
const subscribers = new Set<ToastSubscriber>();

const notifySubscribers = (action: { type: 'SHOW' | 'UPDATE' | 'DISMISS' | 'CLEAR'; payload: any }) => {
  subscribers.forEach((sub) => {
    try {
      sub(action);
    } catch (err) {
      console.error('Toast listener error:', err);
    }
  });
};

// Global singleton helper object
export const toast = {
  show: (options: ToastOptions): string => {
    const id = options.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    notifySubscribers({ type: 'SHOW', payload: { ...options, id } });
    return id;
  },
  success: (message: string, title: string = 'SUCCESS', options?: Partial<ToastOptions>): string => {
    return toast.show({
      ...options,
      type: 'SUCCESS',
      title,
      message,
      duration: options?.duration ?? 5000,
    });
  },
  error: (message: string, title: string = 'ERROR', options?: Partial<ToastOptions>): string => {
    return toast.show({
      ...options,
      type: 'ERROR',
      title,
      message,
      duration: options?.duration ?? 7000,
    });
  },
  warning: (message: string, title: string = 'WARNING', options?: Partial<ToastOptions>): string => {
    return toast.show({
      ...options,
      type: 'WARNING',
      title,
      message,
      duration: options?.duration ?? 7000,
    });
  },
  info: (message: string, title: string = 'INFO', options?: Partial<ToastOptions>): string => {
    return toast.show({
      ...options,
      type: 'INFO',
      title,
      message,
      duration: options?.duration ?? 5000,
    });
  },
  loading: (message: string, title: string = 'PROCESSING', options?: Partial<ToastOptions>): string => {
    return toast.show({
      ...options,
      type: 'LOADING',
      title,
      message,
      duration: 0, // Persistent until updated or dismissed
    });
  },
  update: (id: string, options: Partial<ToastOptions>): void => {
    notifySubscribers({ type: 'UPDATE', payload: { id, options } });
  },
  dismiss: (id: string): void => {
    notifySubscribers({ type: 'DISMISS', payload: { id } });
  },
  clearAll: (): void => {
    notifySubscribers({ type: 'CLEAR', payload: {} });
  },
};

const MAX_VISIBLE_TOASTS = 4;
const DEDUPLICATION_INTERVAL_MS = 1500;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const recentMessagesRef = useRef<Map<string, number>>(new Map());

  // Throttling / Deduplication check
  const isDuplicate = useCallback((type: ToastType, message: string): boolean => {
    const key = `${type}:::${message.trim()}`;
    const now = Date.now();
    const lastTime = recentMessagesRef.current.get(key);
    if (lastTime && now - lastTime < DEDUPLICATION_INTERVAL_MS) {
      return true;
    }
    recentMessagesRef.current.set(key, now);

    // Clean up stale cache keys
    if (recentMessagesRef.current.size > 20) {
      for (const [k, time] of recentMessagesRef.current.entries()) {
        if (now - time > 5000) {
          recentMessagesRef.current.delete(k);
        }
      }
    }
    return false;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const update = useCallback((id: string, options: Partial<ToastOptions>) => {
    setToasts((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const newType = options.type || t.type;
          let newDuration = options.duration;
          if (newDuration === undefined) {
            newDuration =
              newType === 'LOADING'
                ? 0
                : newType === 'ERROR' || newType === 'WARNING'
                ? 7000
                : 5000;
          }
          return {
            ...t,
            ...options,
            type: newType,
            title: options.title !== undefined ? options.title : t.title,
            message: options.message !== undefined ? options.message : t.message,
            duration: newDuration,
            createdAt: Date.now(),
            isPaused: false,
          };
        }
        return t;
      })
    );
  }, []);

  const showToast = useCallback(
    (options: ToastOptions): string => {
      const type = options.type || 'INFO';
      const message = options.message || '';

      // Check for duplication (unless it's an explicit update by ID)
      if (isDuplicate(type, message) && !options.id) {
        // Find existing toast and refresh it
        const existing = toasts.find((t) => t.message === message && t.type === type);
        if (existing) {
          return existing.id;
        }
      }

      const id = options.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const defaultDuration =
        type === 'LOADING'
          ? 0
          : type === 'ERROR' || type === 'WARNING'
          ? 7000
          : 5000;
      const duration = options.duration !== undefined ? options.duration : defaultDuration;

      const newItem: ToastItem = {
        id,
        type,
        title: options.title || (type === 'LOADING' ? 'PROCESSING' : type),
        message,
        duration,
        createdAt: Date.now(),
        action: options.action,
        isPaused: false,
      };

      setToasts((prev) => {
        // If an item with the same ID already exists, update it in place
        const existingIndex = prev.findIndex((t) => t.id === id);
        if (existingIndex !== -1) {
          const next = [...prev];
          next[existingIndex] = newItem;
          return next;
        }

        // Add to stack, keep within maximum visible limit
        const next = [newItem, ...prev];
        if (next.length > MAX_VISIBLE_TOASTS) {
          return next.slice(0, MAX_VISIBLE_TOASTS);
        }
        return next;
      });

      return id;
    },
    [isDuplicate, toasts]
  );

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const pauseToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isPaused: true } : t))
    );
  }, []);

  const resumeToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isPaused: false } : t))
    );
  }, []);

  // Connect global subscribers
  useEffect(() => {
    const handleGlobalEvent: ToastSubscriber = (action) => {
      switch (action.type) {
        case 'SHOW':
          showToast(action.payload);
          break;
        case 'UPDATE':
          update(action.payload.id, action.payload.options);
          break;
        case 'DISMISS':
          dismiss(action.payload.id);
          break;
        case 'CLEAR':
          clearAll();
          break;
      }
    };

    subscribers.add(handleGlobalEvent);
    return () => {
      subscribers.delete(handleGlobalEvent);
    };
  }, [showToast, update, dismiss, clearAll]);

  // Context value methods
  const success = useCallback(
    (message: string, title: string = 'SUCCESS', options?: Partial<ToastOptions>) =>
      showToast({ ...options, type: 'SUCCESS', title, message, duration: options?.duration ?? 5000 }),
    [showToast]
  );

  const error = useCallback(
    (message: string, title: string = 'ERROR', options?: Partial<ToastOptions>) =>
      showToast({ ...options, type: 'ERROR', title, message, duration: options?.duration ?? 7000 }),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title: string = 'WARNING', options?: Partial<ToastOptions>) =>
      showToast({ ...options, type: 'WARNING', title, message, duration: options?.duration ?? 7000 }),
    [showToast]
  );

  const info = useCallback(
    (message: string, title: string = 'INFO', options?: Partial<ToastOptions>) =>
      showToast({ ...options, type: 'INFO', title, message, duration: options?.duration ?? 5000 }),
    [showToast]
  );

  const loading = useCallback(
    (message: string, title: string = 'PROCESSING', options?: Partial<ToastOptions>) =>
      showToast({ ...options, type: 'LOADING', title, message, duration: 0 }),
    [showToast]
  );

  const value: ToastContextType = {
    toasts,
    showToast,
    success,
    error,
    warning,
    info,
    loading,
    update,
    dismiss,
    clearAll,
    pauseToast,
    resumeToast,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
