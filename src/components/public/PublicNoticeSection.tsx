import React, { useState } from 'react';
import { Bell, Pin, Calendar, FileText, ChevronRight, AlertCircle } from 'lucide-react';
import { Notice } from '../../types';
import { formatBanglaDate } from '../../utils/bangla';
import { EmptyState } from '../common/EmptyState';
import { BottomSheet } from '../common/BottomSheet';

interface PublicNoticeSectionProps {
  notices: Notice[];
}

export const PublicNoticeSection: React.FC<PublicNoticeSectionProps> = ({ notices }) => {
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const publishedNotices = notices.filter((n) => n.status === 'PUBLISHED');

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'EXAM':
        return <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[11px] font-bold">পরীক্ষা</span>;
      case 'RESULT':
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-bold">ফলাফল</span>;
      case 'URGENT':
        return <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[11px] font-bold">জরুরি</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[11px] font-bold">সাধারণ</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8 text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          ডিজিটাল নোটিশ বোর্ড
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          পরীক্ষা ও ফলাফল সংক্রান্ত সর্বশেষ নোটিশ ও জরুরি বিজ্ঞপ্তি
        </p>
      </div>

      {/* Notices List */}
      {publishedNotices.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="কোনো নোটিশ প্রকাশ করা হয়নি"
          description="ইনস্টিটিউট কর্তৃক নতুন নোটিশ প্রকাশ করা হলে তা এখানে প্রদর্শিত হবে।"
        />
      ) : (
        <div className="space-y-3">
          {publishedNotices.map((notice) => (
            <div
              key={notice.id}
              onClick={() => setSelectedNotice(notice)}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                notice.isPinned
                  ? 'bg-amber-50/40 border-amber-200/90 shadow-2xs hover:border-amber-300'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2">
                  {notice.isPinned && (
                    <span className="flex items-center space-x-1 text-amber-700 text-xs font-bold bg-amber-100/80 px-2 py-0.5 rounded-md">
                      <Pin className="w-3 h-3 fill-amber-700" />
                      <span>পিন করা নোটিশ</span>
                    </span>
                  )}
                  {getCategoryBadge(notice.category)}
                  <span className="text-xs text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatBanglaDate(notice.publishedDate || notice.createdAt)}</span>
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base sm:text-lg hover:text-emerald-700 transition-colors">
                  {notice.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                  {notice.content}
                </p>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 self-center" />
            </div>
          ))}
        </div>
      )}

      {/* Full Notice Bottom Sheet */}
      <BottomSheet
        isOpen={Boolean(selectedNotice)}
        onClose={() => setSelectedNotice(null)}
        title={selectedNotice?.title || 'নোটিশ বিবরণ'}
        subtitle={selectedNotice ? formatBanglaDate(selectedNotice.publishedDate || selectedNotice.createdAt) : ''}
      >
        {selectedNotice && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              {getCategoryBadge(selectedNotice.category)}
              {selectedNotice.isPinned && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-xs font-bold">
                  পিন করা নোটিশ
                </span>
              )}
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-sm text-slate-800 leading-relaxed whitespace-pre-line font-medium">
              {selectedNotice.content}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedNotice(null)}
                className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
