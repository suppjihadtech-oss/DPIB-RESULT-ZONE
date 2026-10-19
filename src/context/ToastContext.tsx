import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { ToastItem, ToastType } from '../types';
import { ToastContainer } from '../components/common/ToastContainer';

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => string;
  success: (message: string, title?: string, duration?: number) => string;
  error: (message: string, title?: string, duration?: number) => string;
  info: (message: string, title?: string, duration?: number) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, duration: number = 4200): string => {
      // Prevent rapid duplicate spamming of the exact same message
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = {
        id,
        type,
        title,
        message,
        duration,
        createdAt: Date.now()
      };

      setToasts((prev) => {
        // Filter out any immediate exact duplicate in the current queue to avoid clutter
        const filtered = prev.filter(
          (t) => !(t.type === type && t.message === message && Date.now() - t.createdAt < 1500)
        );
        // Keep up to 4 concurrent stacked toasts
        return [newToast, ...filtered].slice(0, 4);
      });

      return id;
    },
    []
  );

  const success = useCallback(
    (message: string, title: string = 'সফল সম্পন্ন', duration?: number) => {
      return showToast('success', message, title, duration);
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, title: string = 'ব্যর্থ হয়েছে', duration?: number) => {
      return showToast('error', message, title, duration || 5000);
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, title: string = 'তথ্য নির্দেশনা', duration?: number) => {
      return showToast('info', message, title, duration);
    },
    [showToast]
  );

  const contextValue = useMemo(
    () => ({
      toasts,
      showToast,
      success,
      error,
      info,
      removeToast,
      clearAllToasts
    }),
    [toasts, showToast, success, error, info, removeToast, clearAllToasts]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
