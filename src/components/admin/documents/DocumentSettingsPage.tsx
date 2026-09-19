import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  CheckCircle2,
  Building,
  Phone,
  Hash,
  Mail,
  UserCheck,
  Award,
  Loader2,
} from 'lucide-react';
import { DocumentSettings } from '../../../types';
import { getDocumentSettings, saveDocumentSettings, DEFAULT_DOCUMENT_SETTINGS } from '../../../services/db';
import { updateCachedDocSettings } from './A4DocumentEngine';

export const DocumentSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<DocumentSettings>(DEFAULT_DOCUMENT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getDocumentSettings();
        setSettings(data);
        updateCachedDocSettings(data);
      } catch (err) {
        console.error('Failed to load document settings from Firestore:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleChange = (field: keyof DocumentSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveDocumentSettings(settings);
      updateCachedDocSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save document settings to Firestore:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (confirm('আপনি কি ডিফল্ট তথ্য পুনর্বহাল করতে চান?')) {
      setSaving(true);
      try {
        setSettings(DEFAULT_DOCUMENT_SETTINGS);
        await saveDocumentSettings(DEFAULT_DOCUMENT_SETTINGS);
        updateCachedDocSettings(DEFAULT_DOCUMENT_SETTINGS);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      } catch (err) {
        console.error('Failed to reset document settings in Firestore:', err);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">ডকুমেন্ট সেটিংস (ফায়ারস্টোর ক্লাউড)</h3>
            <p className="text-xs text-slate-500">
              সমস্ত জেনারেটেড ডকুমেন্টের কমন হেডার, ইনস্টিটিউট কোড, ফোন ও স্বাক্ষরকারীর পদবি কনফিগার করুন।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={saving || loading}
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ডিফল্ট রিসেট</span>
          </button>
          <button
            type="button"
            disabled={saving || loading}
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>ডকুমেন্ট সেটিংস সফলভাবে সংরক্ষিত হয়েছে। সকল ডকুমেন্টে এই তথ্য ব্যবহৃত হবে।</span>
        </div>
      )}

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Institute Info Box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-teal-700" />
            কমন হেডার ও ইনস্টিটিউট পরিচিতি
          </h4>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ইনস্টিটিউটের নাম
            </label>
            <input
              type="text"
              value={settings.instituteName}
              onChange={(e) => handleChange('instituteName', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ঠিকানা ও অবস্থান
            </label>
            <input
              type="text"
              value={settings.instituteAddress}
              onChange={(e) => handleChange('instituteAddress', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ইনস্টিটিউট কোড
              </label>
              <input
                type="text"
                value={settings.instituteCode}
                onChange={(e) => handleChange('instituteCode', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                যোগাযোগ ফোন নম্বর
              </label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ইমেইল অ্যাড্রেস
            </label>
            <input
              type="email"
              value={settings.contactEmail || ''}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Signatory & Authority Box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <UserCheck className="w-4 h-4 text-teal-700" />
            অফিসিয়াল স্বাক্ষরকারী ও পদবি
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                অধ্যক্ষের পদবি
              </label>
              <input
                type="text"
                value={settings.principalTitle}
                onChange={(e) => handleChange('principalTitle', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                অধ্যক্ষের নাম
              </label>
              <input
                type="text"
                value={settings.principalName || ''}
                onChange={(e) => handleChange('principalName', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                পরীক্ষা নিয়ন্ত্রকের পদবি
              </label>
              <input
                type="text"
                value={settings.examControllerTitle}
                onChange={(e) => handleChange('examControllerTitle', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                পরীক্ষা নিয়ন্ত্রণ কমিটি / নাম
              </label>
              <input
                type="text"
                value={settings.examControllerName || ''}
                onChange={(e) => handleChange('examControllerName', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              বিভাগীয় প্রধানের পদবি
            </label>
            <input
              type="text"
              value={settings.headOfDeptTitle}
              onChange={(e) => handleChange('headOfDeptTitle', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-hidden"
            />
          </div>

          <div className="pt-2 text-[11px] text-slate-500">
            * এই পদবিসমূহ রেজাল্ট শিট, মার্কশিট, নোটিশ ও রুটিনের স্বাক্ষর অংশে স্বয়ংক্রিয়ভাবে বসবে।
          </div>
        </div>
      </div>
    </div>
  );
};
