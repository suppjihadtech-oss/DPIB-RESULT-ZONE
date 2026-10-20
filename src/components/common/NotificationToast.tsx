import React from 'react';
import { Bell, ArrowRight, X } from 'lucide-react';
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
  if (!notification) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-[calc(100vw-32px)] bg-white/80 backdrop-blur-2xl backdrop-saturate-180 rounded-3xl shadow-[0_16px_40px_rgba(15,23,42,0.16),0_1px_0_1px_rgba(255,255,255,0.9)_inset] ring-1 ring-black/5 border border-white/80 p-4 animate-slideDown font-bengali">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-blue-600/90 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/25">
          <Bell className="w-5 h-5 animate-bounce" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
              {notification.title || 'নতুন নোটিফিকেশন'}
            </h4>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1 line-clamp-2 leading-relaxed">
            {notification.body}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClick(notification);
                onClose();
              }}
              className="py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <span>বিস্তারিত দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-2.5 text-slate-500 hover:text-slate-800 text-[11px] font-semibold rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
            >
              মুছে ফেলুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
