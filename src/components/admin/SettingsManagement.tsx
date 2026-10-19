import React, { useState } from 'react';
import { 
  Settings, 
  KeyRound, 
  Building2, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { db } from '../../services/db';
import { useToast } from '../../context/ToastContext';

export const SettingsManagement: React.FC = () => {
  const { success, error, info } = useToast();

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [institute, setInstitute] = useState(() => db.getInstituteInfo());

  // Handle PIN Update
  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    const actualPin = db.getAdminPin();

    if (currentPin !== actualPin) {
      error('আপনার প্রদত্ত বর্তমান পিনটি সঠিক নয়!', 'অনুমতি অস্বীকার');
      return;
    }

    if (!newPin || newPin.length < 4) {
      error('নতুন পিন কমপক্ষে ৪ ডিজিটের হতে হবে!', 'যাচাইকরণ ত্রুটি');
      return;
    }

    if (newPin !== confirmPin) {
      error('নতুন পিন এবং নিশ্চিতকরণ পিন মিলছে না!', 'অমিল সনাক্ত');
      return;
    }

    db.setAdminPin(newPin);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    success('এডমিন প্যানেলের নিরাপত্তা পিন সফলভাবে পরিবর্তিত হয়েছে।', 'পিন আপডেট সম্পন্ন');
  };

  // Handle Restore Default Seed Data
  const handleResetData = () => {
    if (window.confirm('আপনি কি নিশ্চিত যে সমস্ত ডেটা ফ্যাক্টরি ডিফল্টে ফিরিয়ে নিতে চান? এতে বর্তমান সকল পরিবর্তন পুনরায় সেট হবে।')) {
      db.resetToDefaultData();
      success('সকল শিক্ষার্থী, পরীক্ষা ও ফলাফলের নমুনা ডেটা সফলভাবে পুনরুদ্ধার করা হয়েছে।', 'পুনরুদ্ধার সম্পন্ন');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600" />
          ইনস্টিটিউট সেটিংস ও সিস্টেম কনফিগারেশন
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          এডমিন নিরাপত্তা পিন পরিবর্তন, সাধারণ তথ্য ও ডেটাবেস রক্ষণাবেক্ষণ
        </p>
      </div>

      {/* Global Toast Interactive Test Panel */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5 text-amber-400" />
              গ্লোবাল স্মার্ট টোস্ট নোটিফিকেশন সিস্টেম টেস্ট
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              প্রয়োজনীয় ৩ ধরনের আধুনিক গ্লাসফিজম টোস্টের অ্যানিমেশন ও স্ট্যাকিং পরীক্ষা করুন:
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Active System
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Success Test */}
          <button
            type="button"
            onClick={() => {
              success(
                'শিক্ষার্থীর ফলাফল সফলভাবে ফায়ারস্টোর ক্লাউড ডেটাবেসে সংরক্ষিত ও প্রস্তুত হয়েছে।',
                'সফল সম্পন্ন'
              );
            }}
            className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 text-left transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase mb-1">
              <CheckCircle2 className="w-4 h-4" />
              SUCCESS (সবুজ)
            </div>
            <p className="text-xs text-slate-200">
              ডেটা Save, Update, Delete বা Import সফল হলে দেখায়।
            </p>
          </button>

          {/* Error Test */}
          <button
            type="button"
            onClick={() => {
              error(
                'ফায়ারবেস সংযোগ বিচ্ছিন্ন অথবা শিক্ষার্থীর রোল নম্বর অনুপস্থিত!',
                'ত্রুটি সনাক্ত'
              );
            }}
            className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 hover:bg-rose-900/60 text-left transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase mb-1">
              <AlertCircle className="w-4 h-4" />
              ERROR (লাল)
            </div>
            <p className="text-xs text-slate-200">
              কোনো কাজ ব্যর্থ হলে বা ভ্যালিডেশন এরর এলে সহজ বাংলায় দেখায়।
            </p>
          </button>

          {/* Info Test */}
          <button
            type="button"
            onClick={() => {
              info(
                'সেমিস্টার ফাইনাল পরীক্ষার রুটিন ও রেজাল্ট শিট হালনাগাদ করা হয়েছে।',
                'তথ্য নির্দেশনা'
              );
            }}
            className="p-4 rounded-2xl bg-slate-800/80 border border-sky-500/40 hover:bg-slate-700/80 text-left transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase mb-1">
              <Info className="w-4 h-4" />
              INFO (নীল)
            </div>
            <p className="text-xs text-slate-200">
              প্রয়োজনীয় তথ্য, সতর্কতামূলক নির্দেশনা বা অসম্পূর্ণ ফর্ম জানাতে ব্যবহৃত হয়।
            </p>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security PIN Change */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-600" />
            এডমিন নিরাপত্তা পিন পরিবর্তন
          </h3>
          <p className="text-xs text-slate-500">
            এডমিন প্যানেলে প্রবেশের জন্য বর্তমান পিন: <span className="font-mono font-bold text-slate-700">{db.getAdminPin()}</span>
          </p>

          <form onSubmit={handleUpdatePin} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">বর্তমান পিন *</label>
              <input
                type="password"
                required
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="বর্তমান পিন লিখুন"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">নতুন পিন *</label>
                <input
                  type="password"
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="কমপক্ষে ৪ সংখ্যা"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">নিশ্চিত করুন *</label>
                <input
                  type="password"
                  required
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="পুনরায় লিখুন"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              পিন আপডেট করুন
            </button>
          </form>
        </div>

        {/* Database & System Maintenance */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              প্রতিষ্ঠান বিবরণ ও যোগাযোগ
            </h3>
            <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <p><span className="font-bold text-slate-700">প্রতিষ্ঠানের নাম:</span> {institute.name}</p>
              <p><span className="font-bold text-slate-700">ঠিকানা:</span> {institute.address}</p>
              <p><span className="font-bold text-slate-700">হেল্পলাইন:</span> {institute.phone}</p>
              <p><span className="font-bold text-slate-700">ইমেইল:</span> {institute.email}</p>
              <p><span className="font-bold text-slate-700">বোর্ড অনুমোদন:</span> {institute.btebAffiliated}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-800 text-xs">ফ্যাক্টরি ডাটাবেস রিসেট</h4>
              <p className="text-[11px] text-slate-400">পরীক্ষামূলক নমুনা তথ্য ও রেকর্ড পুনঃস্থাপন করুন</p>
            </div>
            <button
              type="button"
              onClick={handleResetData}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              রিসেট করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
