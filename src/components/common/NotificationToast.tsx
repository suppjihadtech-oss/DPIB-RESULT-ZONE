import React, { useEffect } from 'react';
import { Bell, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { PushNotificationPayload } from '../../types';

interface NotificationToastProps {
  notification: PushNotificationPayload | null;
  onClose: () => void;
  onClick: (payload: PushNotificationPayload) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onClick,
}) => {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onClose();
    }, 9000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  const isPayment = notification.type === 'PAYMENT';

  return (
    <div
      id="dpib-notification-toast"
      role="status"
      aria-live="polite"
      className="fixed top-4 right-4 z-[10050] max-w-sm w-[calc(100vw-32px)] bg-white/95 backdrop-blur-2xl backdrop-saturate-180 rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.22),0_1px_0_1px_rgba(255,255,255,0.9)_inset] ring-1 ring-black/5 border border-slate-200/80 p-4 animate-slideDown font-bengali"
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-md ${
            isPayment
              ? 'bg-emerald-600 shadow-emerald-600/25'
              : 'bg-teal-700 shadow-teal-700/25'
          }`}
        >
          {isPayment ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
              {notification.title || 'নতুন নোটিফিকেশন'}
            </h4>
            <button
              type="button"
              onClick={onClose}
              aria-label="বন্ধ করুন"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-black/5 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1 line-clamp-3 leading-relaxed">
            {notification.body}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClick(notification);
                onClose();
              }}
              className={`min-h-[36px] py-1.5 px-3.5 text-white text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
                isPayment
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-teal-700 hover:bg-teal-800'
              }`}
            >
              <span>{isPayment ? 'লেনদেন হিস্ট্রি দেখুন' : 'বিস্তারিত দেখুন'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[36px] py-1.5 px-2.5 text-slate-500 hover:text-slate-800 text-[11px] font-semibold rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
            >
              মুছে ফেলুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
