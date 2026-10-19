import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileCode, 
  FileText, 
  Bell, 
  Calendar, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export type AdminTab = 
  | 'dashboard' 
  | 'students' 
  | 'exams' 
  | 'results' 
  | 'documents' 
  | 'notices' 
  | 'routines' 
  | 'settings';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
  onGoToPublic: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onTabChange,
  onLogout,
  onGoToPublic,
  children
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { success, error, info } = useToast();

  const navItems: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'results', label: 'ফলাফল ব্যবস্থাপনা', icon: FileCode },
    { id: 'students', label: 'শিক্ষার্থী তথ্য', icon: Users },
    { id: 'exams', label: 'পরীক্ষা পরিচালনা', icon: BookOpen },
    { id: 'documents', label: 'ডকুমেন্ট জেনারেটর', icon: FileText },
    { id: 'notices', label: 'নোটিশ বোর্ড', icon: Bell },
    { id: 'routines', label: 'ক্লাস ও পরীক্ষার রুটিন', icon: Calendar },
    { id: 'settings', label: 'ইনস্টিটিউট সেটিংস', icon: Settings }
  ];

  const handleTabClick = (tab: AdminTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              aria-label="মেনু খুলুন"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-900/40">
                DPIB
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  DPIB RESULT ZONE
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    এডমিন প্যানেল
                  </span>
                </h1>
                <p className="text-xs text-slate-400 hidden sm:block">
                  দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউট, ভোলা সদর
                </p>
              </div>
            </div>
          </div>

          {/* Quick Toast Test Bar & Public Switch */}
          <div className="flex items-center gap-2">
            {/* Interactive Toast Tester */}
            <div className="hidden xl:flex items-center bg-slate-800/80 rounded-xl px-2.5 py-1 border border-slate-700/60 text-xs gap-1.5">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mr-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                স্মার্ট টোস্ট টেস্ট:
              </span>
              <button
                type="button"
                onClick={() => success('ডেটা সফলভাবে ডেটাবেসে সংরক্ষিত হয়েছে!', 'সফল সম্পন্ন')}
                className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-medium transition cursor-pointer flex items-center gap-1"
                title="সফল টোস্ট পরীক্ষা করুন"
              >
                <CheckCircle2 className="w-3 h-3" />
                সাকসেস
              </button>
              <button
                type="button"
                onClick={() => error('প্রয়োজনীয় ফিল্ড পূরণ করা হয়নি অথবা রোল নম্বর অনুপস্থিত!', 'ত্রুটি সনাক্ত')}
                className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-medium transition cursor-pointer flex items-center gap-1"
                title="ত্রুটি টোস্ট পরীক্ষা করুন"
              >
                <AlertCircle className="w-3 h-3" />
                এরর
              </button>
              <button
                type="button"
                onClick={() => info('নতুন সেমিস্টারের রেজাল্ট শীট পর্যালোচনার জন্য প্রস্তুত রয়েছে।', 'তথ্য')}
                className="px-2 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 font-medium transition cursor-pointer flex items-center gap-1"
                title="তথ্য টোস্ট পরীক্ষা করুন"
              >
                <Info className="w-3 h-3" />
                ইনফো
              </button>
            </div>

            <button
              type="button"
              onClick={onGoToPublic}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">পাবলিক ভিউ</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">লগআউট</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-64 shrink-0">
          <nav className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm sticky top-22 space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              নেভিগেশন মেনু
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}

            {/* Quick Helper Info */}
            <div className="pt-4 mt-4 border-t border-slate-100 px-3">
              <div className="rounded-xl bg-emerald-50/80 border border-emerald-100 p-3 text-xs text-emerald-900 leading-relaxed">
                <p className="font-semibold text-emerald-800 mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  সিস্টেম স্ট্যাটাস
                </p>
                <p className="text-[11px] text-emerald-700">
                  স্মার্ট টোস্ট ও সরাসরি JSON কোড ফলাফল ইমপোর্ট সক্রিয়।
                </p>
              </div>
            </div>
          </nav>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-slate-900/60 backdrop-blur-sm flex">
            <div className="w-72 bg-white h-full p-5 shadow-2xl flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="font-bold text-slate-800 text-sm">মেনু নির্বাচন করুন</div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleTabClick(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
                          isActive
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-2">
                <div className="text-xs font-semibold text-slate-500 mb-1">দ্রুত টোস্ট পরীক্ষা:</div>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => success('সফলভাবে সংরক্ষিত হয়েছে!')}
                    className="p-1.5 text-center bg-emerald-50 text-emerald-700 rounded border border-emerald-200"
                  >
                    সফল
                  </button>
                  <button
                    type="button"
                    onClick={() => error('যাচাইকরণ ব্যর্থ হয়েছে!')}
                    className="p-1.5 text-center bg-rose-50 text-rose-700 rounded border border-rose-200"
                  >
                    ত্রুটি
                  </button>
                  <button
                    type="button"
                    onClick={() => info('প্রক্রিয়া চলছে...')}
                    className="p-1.5 text-center bg-sky-50 text-sky-700 rounded border border-sky-200"
                  >
                    তথ্য
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Dynamic Admin Body */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
