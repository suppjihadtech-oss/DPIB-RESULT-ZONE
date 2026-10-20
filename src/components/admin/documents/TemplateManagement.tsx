import React, { useState, useEffect } from 'react';
import {
  Layers,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  CreditCard,
  Calendar,
  Bell,
  Sparkles,
  Palette,
  Loader2,
} from 'lucide-react';
import { DocumentTemplateStyle } from '../../../types';
import { getDocumentTemplatePreference, saveDocumentTemplatePreference } from '../../../services/db';

interface TemplateOption {
  id: DocumentTemplateStyle;
  name: string;
  enName: string;
  description: string;
  features: string[];
  bestFor: string;
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: 'official',
    name: 'অফিসিয়াল ট্র্যাডিশনাল',
    enName: 'Official Traditional BTEB Standard',
    description: 'বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB) ও সরকারি পলিটেকনিকের অফিশিয়াল প্যাটার্ন অনুযায়ী ক্লাসিক ডিজাইন।',
    features: ['ক্লাসিক সেন্টার হেডলাইন', 'ডাবল সাবটল ডিভাইডার', 'পরিমিত মার্জিন ও সিগনেচার সিল ব্লক', 'A4 প্রিন্ট অপ্টিমাইজড'],
    bestFor: 'ফলাফল বিবরণী, ট্রান্সক্রিপ্ট, নোটিশ ও রুটিন',
  },
  {
    id: 'modern',
    name: 'মডার্ন ক্লিন',
    enName: 'Modern Contemporary Design',
    description: 'সমসাময়িক মিনিমালিস্ট লেআউট, টিল অ্যাকসেন্ট ও ব্যাজ সহ পরিচ্ছন্ন ভিউ।',
    features: ['ব্র্যান্ডেড লোগো লেআউট', 'টিল রঙের মার্জিত থিম', 'হাই-কন্ট্রাস্ট টাইপোগ্রাফি', 'ডিজিটাল ডিসপ্লে ফ্রেন্ডলি'],
    bestFor: 'অ্যাডমিট কার্ড, ক্লাস রুটিন ও শিক্ষার্থী রিপোর্ট',
  },
  {
    id: 'compact',
    name: 'কমপ্যাক্ট একাডেমিক',
    enName: 'High Density Compact Sheet',
    description: 'কম স্থানে অধিক ডাটা প্রদর্শনের জন্য কনডেনসড ফন্ট ও টাইট সেল স্পেসিং।',
    features: ['সর্বোচ্চ ডাটা ডেনসিটি', '১০ মিমি সংকীর্ণ মার্জিন', 'এক পাতায় অধিক শিক্ষার্থীর তথ্য', 'কাগজ সাশ্রয়ী প্রিন্ট'],
    bestFor: 'উপস্থিতি পত্র ও বাল্ক রেজাল্ট শিট',
  },
];

export const TemplateManagement: React.FC = () => {
  const [activeTemplate, setActiveTemplate] = useState<DocumentTemplateStyle>('official');
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadTemplate() {
      try {
        const tpl = await getDocumentTemplatePreference();
        setActiveTemplate(tpl);
      } catch (err) {
        console.error('Failed to load template preference:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTemplate();
  }, []);

  const handleSetDefault = async (tpl: DocumentTemplateStyle) => {
    setActiveTemplate(tpl);
    try {
      await saveDocumentTemplatePreference(tpl);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save template to Firestore:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">ডকুমেন্ট টেমপ্লেট পরিচালনা</h3>
            <p className="text-xs text-slate-500">
              সমস্ত একাডেমিক ও অফিশিয়াল ডকুমেন্টের জন্য ডিফল্ট A4 টেমপ্লেট ও স্টাইল নির্বাচন করুন।
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>ডিফল্ট টেমপ্লেট সফলভাবে আপডেট করা হয়েছে!</span>
          </div>
        )}
      </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {TEMPLATE_OPTIONS.map((tpl) => {
          const isSelected = activeTemplate === tpl.id;
          return (
            <div
              key={tpl.id}
              className={`bg-white rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-teal-700 ring-2 ring-teal-700/20 shadow-md'
                  : 'border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isSelected ? 'bg-teal-100 text-teal-900' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tpl.id}
                  </span>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-xs font-bold text-teal-700">
                      <CheckCircle2 className="w-4 h-4 text-teal-700" />
                      ডিফল্ট সক্রিয়
                    </span>
                  )}
                </div>

                <h4 className="text-base font-bold text-slate-900 leading-snug">
                  {tpl.name}
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  {tpl.description}
                </p>

                {/* Features List */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 block">মূল বৈশিষ্ট্যসমূহ:</span>
                  {tpl.features.map((f, i) => (
                    <p key={i} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-700 shrink-0" />
                      <span>{f}</span>
                    </p>
                  ))}
                </div>

                <div className="mt-3 p-2 bg-slate-50 rounded-lg text-[10.5px] text-slate-600">
                  <span className="font-bold text-slate-800">ব্যবহারের ক্ষেত্র:</span> {tpl.bestFor}
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => handleSetDefault(tpl.id)}
                  disabled={isSelected}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50 text-teal-800 border border-teal-200 cursor-default'
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                  }`}
                >
                  {isSelected ? 'বর্তমানে সক্রিয়' : 'ডিফল্ট হিসেবে সেট করুন'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
