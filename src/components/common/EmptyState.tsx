import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div id="empty-state-card" className="flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl my-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-xs">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-base sm:text-lg font-semibold text-slate-700 mb-1">{title}</h4>
      {description && <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-5 leading-relaxed">{description}</p>}
      {actionText && onAction && (
        <button
          id="btn-empty-state-action"
          onClick={onAction}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm active:scale-95"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
