import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  CalendarDays,
  Calendar,
  Bell,
  Layers,
  Settings,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { ResultSheetGenerator } from './ResultSheetGenerator';
import { ExamRoutineGenerator } from './ExamRoutineGenerator';
import { ClassRoutineGenerator } from './ClassRoutineGenerator';
import { OfficialNoticeGenerator } from './OfficialNoticeGenerator';
import { QuestionPaperGenerator } from './QuestionPaperGenerator';
import { TemplateManagement } from './TemplateManagement';
import { DocumentSettingsPage } from './DocumentSettingsPage';
import { AnimatePresence } from 'motion/react';
import { SubSectionTransition } from '../../common/PageTransition';

export type DocumentTab =
  | 'result-generator'
  | 'exam-routine'
  | 'class-routine'
  | 'question-paper'
  | 'notice-generator'
  | 'template-management'
  | 'document-settings';

interface AcademicDocumentsHubProps {
  initialTab?: DocumentTab;
  onBackToMenu?: () => void;
}

export const AcademicDocumentsHub: React.FC<AcademicDocumentsHubProps> = ({
  initialTab = 'result-generator',
  onBackToMenu,
}) => {
  const [activeTab, setActiveTab] = useState<DocumentTab>(initialTab);

  const tabs: Array<{
    id: DocumentTab;
    label: string;
    enLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    category: string;
  }> = [
    { id: 'result-generator', label: 'ফলাফল তৈরি', enLabel: 'RESULT SHEET', icon: FileSpreadsheet, category: 'একাডেমিক' },
    { id: 'exam-routine', label: 'পরীক্ষার রুটিন', enLabel: 'EXAM ROUTINE', icon: CalendarDays, category: 'রুটিন' },
    { id: 'class-routine', label: 'ক্লাস রুটিন', enLabel: 'CLASS ROUTINE', icon: Calendar, category: 'রুটিন' },
    { id: 'question-paper', label: 'প্রশ্নপত্র তৈরি', enLabel: 'QUESTION PAPER', icon: FileText, category: 'একাডেমিক' },
    { id: 'notice-generator', label: 'অফিসিয়াল নোটিশ', enLabel: 'OFFICIAL NOTICE', icon: Bell, category: 'বিজ্ঞপ্তি' },
    { id: 'template-management', label: 'টেমপ্লেট পরিচালনা', enLabel: 'TEMPLATES', icon: Layers, category: 'সেটিংস' },
    { id: 'document-settings', label: 'ডকুমেন্ট সেটিংস', enLabel: 'DOC SETTINGS', icon: Settings, category: 'সেটিংস' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Hub Navigation Bar */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onBackToMenu && (
            <button
              onClick={onBackToMenu}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer mr-1"
              title="অ্যাডমিন মেনু পেজে ফিরুন"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">মেনু পেজ</span>
            </button>
          )}

          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
              <span>অ্যাডমিন প্যানেল</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-teal-700 font-extrabold">একাডেমিক ডকুমেন্টস</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 leading-tight mt-0.5">
              অ্যাকাডেমিক ডকুমেন্ট জেনারেটর হাব
            </h2>
          </div>
        </div>

        {/* Quick Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 custom-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <div className="flex flex-col text-left leading-none">
                  <span>{tab.label}</span>
                  <span
                    className={`text-[8.5px] font-outfit uppercase tracking-wider font-bold mt-0.5 ${
                      isActive ? 'text-teal-100' : 'text-slate-400'
                    }`}
                  >
                    {tab.enLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Current Generator Tab */}
      <AnimatePresence mode="wait">
        <SubSectionTransition key={activeTab}>
          {activeTab === 'result-generator' && <ResultSheetGenerator />}
          {activeTab === 'exam-routine' && <ExamRoutineGenerator />}
          {activeTab === 'class-routine' && <ClassRoutineGenerator />}
          {activeTab === 'question-paper' && <QuestionPaperGenerator />}
          {activeTab === 'notice-generator' && <OfficialNoticeGenerator />}
          {activeTab === 'template-management' && <TemplateManagement />}
          {activeTab === 'document-settings' && <DocumentSettingsPage />}
        </SubSectionTransition>
      </AnimatePresence>
    </div>
  );
};
