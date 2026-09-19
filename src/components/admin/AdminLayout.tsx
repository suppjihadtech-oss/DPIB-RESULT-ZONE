import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Home,
  Users,
  UserCheck,
  BookOpen,
  FileSpreadsheet,
  Bell,
  CalendarDays,
  Settings,
  LogOut,
  ExternalLink,
  ChevronRight,
  Layers,
  GraduationCap,
  Menu as MenuIcon,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { getFirebaseStatus } from '../../services/firebase';
import { toBanglaDigits } from '../../utils/bangla';
import { subscribeAllAdmissionApplications } from '../../services/admissionService';

interface AdminLayoutProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
  currentUser: User | { email?: string | null; displayName?: string | null } | null;
  onLogout: () => void;
  onBackToPublic: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentSection,
  onSectionChange,
  currentUser,
  onLogout,
  onBackToPublic,
  children,
}) => {
  const fbStatus = getFirebaseStatus();
  const [totalAdmissionCount, setTotalAdmissionCount] = useState<number>(0);
  const [pendingAdmissionCount, setPendingAdmissionCount] = useState<number>(0);

  useEffect(() => {
    try {
      const unsub = subscribeAllAdmissionApplications(
        (apps) => {
          setTotalAdmissionCount(apps.length);
          const pending = apps.filter(
            (a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW'
          ).length;
          setPendingAdmissionCount(pending);
        },
        (err) => console.warn('Admin layout admission sub error:', err)
      );
      return () => unsub();
    } catch (e) {
      console.warn('Failed to subscribe to admission applications:', e);
    }
  }, []);

  const primaryNavItems = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', enLabel: 'DASHBOARD', icon: Home },
    { id: 'admissions', label: 'ভর্তি আবেদন', enLabel: 'ADMISSIONS', icon: GraduationCap },
    { id: 'teachers', label: 'শিক্ষক ব্যবস্থাপনা', enLabel: 'TEACHERS', icon: UserCheck },
    { id: 'students', label: 'শিক্ষার্থী ব্যবস্থাপনা', enLabel: 'STUDENTS', icon: Users },
    { id: 'exams', label: 'পরীক্ষা ব্যবস্থাপনা', enLabel: 'EXAMS', icon: BookOpen },
    { id: 'results', label: 'ফলাফল ব্যবস্থাপনা', enLabel: 'RESULTS', icon: FileSpreadsheet },
    { id: 'events', label: 'ইভেন্ট ও ক্যালেন্ডার', enLabel: 'EVENTS', icon: CalendarDays },
    { id: 'notices', label: 'নোটিশ ব্যবস্থাপনা', enLabel: 'NOTICES', icon: Bell },
    { id: 'books', label: 'বুক লিস্ট ব্যবস্থাপনা', enLabel: 'BOOK LIST', icon: BookOpen },
    { id: 'documents', label: 'একাডেমিক ডকুমেন্ট হাব', enLabel: 'DOCUMENTS', icon: Layers },
    { id: 'shifts', label: 'শিফট ও সময়সূচী', enLabel: 'SHIFTS', icon: Clock },
    { id: 'security', label: 'নিরাপত্তা ও অ্যাক্সেস', enLabel: 'SECURITY', icon: ShieldCheck },
    { id: 'settings', label: 'সিস্টেম সেটিংস', enLabel: 'SETTINGS', icon: Settings },
    { id: 'menu', label: 'মেনু পেজ', enLabel: 'MENU HUB', icon: MenuIcon },
  ];

  // The admission section uses the president's logo; all other admin sections use the new main logo
  const isAdmissionSection = currentSection === 'admissions';
  const adminSectionLogoUrl = isAdmissionSection
    ? 'https://i.postimg.cc/j5K3pb0M/sovapoti-images1.png'
    : 'https://i.postimg.cc/mgyW32Y2/Firefly-Remove-Background.png';

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 flex flex-col md:flex-row selection:bg-teal-700 selection:text-white font-bengali">
      {/* ================= DESKTOP LIGHT GLASS SIDEBAR ================= */}
      <aside className="no-print hidden md:flex flex-col w-68 bg-white/75 backdrop-blur-2xl backdrop-saturate-180 text-slate-700 shrink-0 border-r border-slate-200/60 shadow-xs">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-200/50 flex items-center space-x-3 bg-white/50 backdrop-blur-md">
          <div className="w-11 h-11 rounded-2xl bg-white/90 p-0.5 flex items-center justify-center border border-white/80 shadow-xs">
            <img
              src={adminSectionLogoUrl}
              alt="Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-outfit font-black text-slate-900 text-base tracking-tight block">
                DPIB <span className="text-teal-700">ADMIN</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-teal-50 text-teal-800 font-outfit border border-teal-200/60">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-bold uppercase font-outfit tracking-wider block mt-0.5">
              DIGITAL ACADEMIC OFFICE
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                id={`admin-nav-${item.id}`}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <div className="flex flex-col text-left min-w-0 flex-1">
                  <span className="truncate leading-tight">{item.label}</span>
                  <span
                    className={`text-[9px] font-outfit uppercase tracking-wider font-bold truncate leading-none mt-0.5 ${
                      isActive ? 'text-teal-100/90' : 'text-slate-400'
                    }`}
                  >
                    {item.enLabel}
                  </span>
                </div>
                {item.id === 'admissions' && totalAdmissionCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full font-outfit shrink-0 ${
                      isActive
                        ? 'bg-white text-teal-800'
                        : pendingAdmissionCount > 0
                        ? 'bg-rose-500 text-white'
                        : 'bg-teal-100 text-teal-800'
                    }`}
                  >
                    {toBanglaDigits(pendingAdmissionCount > 0 ? pendingAdmissionCount : totalAdmissionCount)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Firebase Live Status Box (Light Glass) */}
        <div className="p-4 border-t border-slate-200/50 bg-slate-50/70 backdrop-blur-md text-[11px] space-y-2">
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-[10px] uppercase font-outfit">FIRESTORE DATABASE</span>
            </span>
            <span className="font-mono text-emerald-600 font-black text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
              CONNECTED
            </span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            MASTER CURRICULUM • রেজাল্ট জোন ইঞ্জিন
          </p>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-200/50 flex items-center justify-between bg-white/60 backdrop-blur-md">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0 font-outfit border border-teal-200">
              {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">
                {currentUser?.displayName || 'অ্যাডমিন'}
              </p>
              <p className="text-[10px] text-slate-500 truncate font-mono">
                {currentUser?.email || 'admin@dpib.edu.bd'}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="লগআউট"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {/* Top Header */}
        <header className="no-print bg-white/80 backdrop-blur-2xl backdrop-saturate-180 border-b border-slate-200/60 py-2.5 sm:py-3 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_4px_24px_rgba(15,23,42,0.03)] gap-2">
          <div className="flex items-center space-x-3 shrink-0">
            {/* Mobile Brand */}
            <div className="flex items-center space-x-2 md:hidden">
              <div className="w-8 h-8 rounded-xl bg-white/90 p-0.5 flex items-center justify-center border border-white/80 shadow-xs">
                <img
                  src={adminSectionLogoUrl}
                  alt="Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-outfit font-black text-slate-900 text-sm tracking-tight">
                DPIB <span className="text-teal-700">ADMIN</span>
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400">
              <span className="font-outfit font-bold text-slate-600">DPIB RESULT ZONE</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="font-bold text-teal-800 uppercase font-outfit">
                {primaryNavItems.find((n) => n.id === currentSection)?.enLabel || currentSection}
              </span>
            </div>
          </div>

          {/* Quick Nav Bar in Header (Desktop / Tablet) */}
          <div className="hidden lg:flex items-center space-x-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/70 text-xs font-bold">
            <button
              onClick={() => onSectionChange('dashboard')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                currentSection === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>ড্যাশবোর্ড</span>
            </button>
            <button
              onClick={() => onSectionChange('admissions')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                currentSection === 'admissions'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-teal-800 hover:bg-teal-50/90'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>ভর্তি আবেদন</span>
              {pendingAdmissionCount > 0 ? (
                <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] rounded-full font-outfit">
                  {toBanglaDigits(pendingAdmissionCount)}
                </span>
              ) : totalAdmissionCount > 0 ? (
                <span className="px-1.5 py-0.5 bg-teal-100 text-teal-800 text-[10px] rounded-full font-outfit">
                  {toBanglaDigits(totalAdmissionCount)}
                </span>
              ) : null}
            </button>
            <button
              onClick={() => onSectionChange('results')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                currentSection === 'results'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>ফলাফল</span>
            </button>
            <button
              onClick={() => onSectionChange('documents')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                currentSection === 'documents'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>ডকুমেন্টস</span>
            </button>
            <button
              onClick={() => onSectionChange('menu')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                currentSection === 'menu'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <MenuIcon className="w-3.5 h-3.5" />
              <span>মেনু পেজ</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Quick "ভর্তি আবেদন" Button on Mobile */}
            <button
              onClick={() => onSectionChange('admissions')}
              className={`md:hidden flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentSection === 'admissions'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/70'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-[11px]">ভর্তি আবেদন</span>
              {pendingAdmissionCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse ml-0.5" />
              )}
            </button>

            {/* View Public Portal Button */}
            <button
              onClick={onBackToPublic}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">মূল ওয়েবসাইট দেখুন</span>
              <span className="sm:hidden">ওয়েবসাইট</span>
            </button>

            {/* Mobile Logout */}
            <button
              onClick={onLogout}
              title="লগআউট"
              className="md:hidden p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Minimal Admin Footer */}
        <footer className="mt-auto pt-3 pb-20 md:pb-3 px-6 text-center text-xs text-slate-500 border-t border-slate-200/60 select-none no-print">
          <p>© ২০২৪-২০২৬ <span className="font-outfit font-bold text-slate-700">DPIB RESULT ZONE</span> • ডিজিটাল একাডেমিক অফিস</p>
        </footer>
      </div>

      {/* ================= MOBILE BOTTOM ADMIN NAV ================= */}
      <div className="fixed bottom-2.5 inset-x-2.5 max-w-md mx-auto z-40 md:hidden pointer-events-none select-none font-bengali no-print">
        <nav
          id="admin-mobile-bottom-navbar"
          aria-label="Admin Mobile Navigation"
          className="pointer-events-auto relative bg-white/85 backdrop-blur-2xl backdrop-saturate-180 border border-white/80 shadow-[0_16px_45px_rgba(15,23,42,0.16),0_1px_0_1px_rgba(255,255,255,0.9)_inset] ring-1 ring-black/5 rounded-[32px] px-1.5 py-1.5 flex items-center justify-between transition-all"
          style={{ paddingBottom: 'calc(0.4rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* 1. ড্যাশবোর্ড */}
          <button
            id="admin-bottom-nav-dashboard"
            type="button"
            onClick={() => onSectionChange('dashboard')}
            className="relative flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer min-w-0"
          >
            <div
              className={`flex items-center justify-center w-8 h-7 sm:w-10 sm:h-8 rounded-xl transition-all ${
                currentSection === 'dashboard'
                  ? 'bg-teal-50/90 text-teal-700 font-black border border-teal-200/60 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Home className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${currentSection === 'dashboard' ? 'scale-110' : ''}`} />
            </div>
            <span
              className={`text-[9px] sm:text-[11px] font-bold mt-0.5 tracking-tight transition-colors truncate max-w-full leading-tight ${
                currentSection === 'dashboard' ? 'text-teal-700 font-extrabold' : 'text-slate-600'
              }`}
            >
              ড্যাশবোর্ড
            </span>
            <span
              className={`text-[7px] sm:text-[8px] font-outfit uppercase tracking-wider font-bold truncate max-w-full leading-none mt-0.5 ${
                currentSection === 'dashboard' ? 'text-teal-700' : 'text-slate-400'
              }`}
            >
              HOME
            </span>
            {currentSection === 'dashboard' && (
              <motion.div
                layoutId="admin-bottom-nav-indicator"
                className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-teal-700"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>

          {/* 2. ভর্তি আবেদন */}
          <button
            id="admin-bottom-nav-admissions"
            type="button"
            onClick={() => onSectionChange('admissions')}
            className="relative flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer min-w-0"
          >
            <div
              className={`relative flex items-center justify-center w-8 h-7 sm:w-10 sm:h-8 rounded-xl transition-all ${
                currentSection === 'admissions'
                  ? 'bg-teal-50/90 text-teal-700 font-black border border-teal-200/60 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${currentSection === 'admissions' ? 'scale-110' : ''}`} />
              {pendingAdmissionCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              )}
            </div>
            <span
              className={`text-[9px] sm:text-[11px] font-bold mt-0.5 tracking-tight transition-colors truncate max-w-full leading-tight ${
                currentSection === 'admissions' ? 'text-teal-700 font-extrabold' : 'text-slate-600'
              }`}
            >
              ভর্তি আবেদন
            </span>
            <span
              className={`text-[7px] sm:text-[8px] font-outfit uppercase tracking-wider font-bold truncate max-w-full leading-none mt-0.5 ${
                currentSection === 'admissions' ? 'text-teal-700' : 'text-slate-400'
              }`}
            >
              ADMISSION
            </span>
            {currentSection === 'admissions' && (
              <motion.div
                layoutId="admin-bottom-nav-indicator"
                className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-teal-700"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>

          {/* 3. ফলাফল */}
          <button
            id="admin-bottom-nav-results"
            type="button"
            onClick={() => onSectionChange('results')}
            className="relative flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer min-w-0"
          >
            <div
              className={`flex items-center justify-center w-8 h-7 sm:w-10 sm:h-8 rounded-xl transition-all ${
                currentSection === 'results'
                  ? 'bg-teal-50/90 text-teal-700 font-black border border-teal-200/60 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${currentSection === 'results' ? 'scale-110' : ''}`} />
            </div>
            <span
              className={`text-[9px] sm:text-[11px] font-bold mt-0.5 tracking-tight transition-colors truncate max-w-full leading-tight ${
                currentSection === 'results' ? 'text-teal-700 font-extrabold' : 'text-slate-600'
              }`}
            >
              ফলাফল
            </span>
            <span
              className={`text-[7px] sm:text-[8px] font-outfit uppercase tracking-wider font-bold truncate max-w-full leading-none mt-0.5 ${
                currentSection === 'results' ? 'text-teal-700' : 'text-slate-400'
              }`}
            >
              RESULTS
            </span>
            {currentSection === 'results' && (
              <motion.div
                layoutId="admin-bottom-nav-indicator"
                className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-teal-700"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>

          {/* 4. ইভেন্ট */}
          <button
            id="admin-bottom-nav-events"
            type="button"
            onClick={() => onSectionChange('events')}
            className="relative flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer min-w-0"
          >
            <div
              className={`flex items-center justify-center w-8 h-7 sm:w-10 sm:h-8 rounded-xl transition-all ${
                currentSection === 'events'
                  ? 'bg-teal-50/90 text-teal-700 font-black border border-teal-200/60 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${currentSection === 'events' ? 'scale-110' : ''}`} />
            </div>
            <span
              className={`text-[9px] sm:text-[11px] font-bold mt-0.5 tracking-tight transition-colors truncate max-w-full leading-tight ${
                currentSection === 'events' ? 'text-teal-700 font-extrabold' : 'text-slate-600'
              }`}
            >
              ইভেন্ট
            </span>
            <span
              className={`text-[7px] sm:text-[8px] font-outfit uppercase tracking-wider font-bold truncate max-w-full leading-none mt-0.5 ${
                currentSection === 'events' ? 'text-teal-700' : 'text-slate-400'
              }`}
            >
              EVENTS
            </span>
            {currentSection === 'events' && (
              <motion.div
                layoutId="admin-bottom-nav-indicator"
                className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-teal-700"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>

          {/* 5. মেনু পেজ */}
          <button
            id="admin-bottom-nav-menu"
            type="button"
            onClick={() => onSectionChange('menu')}
            className="relative flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer min-w-0"
          >
            <div
              className={`flex items-center justify-center w-8 h-7 sm:w-10 sm:h-8 rounded-xl transition-all ${
                currentSection === 'menu'
                  ? 'bg-teal-50/90 text-teal-700 font-black border border-teal-200/60 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MenuIcon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${currentSection === 'menu' ? 'scale-110' : ''}`} />
            </div>
            <span
              className={`text-[9px] sm:text-[11px] font-bold mt-0.5 tracking-tight transition-colors truncate max-w-full leading-tight ${
                currentSection === 'menu' ? 'text-teal-700 font-extrabold' : 'text-slate-600'
              }`}
            >
              মেনু পেজ
            </span>
            <span
              className={`text-[7px] sm:text-[8px] font-outfit uppercase tracking-wider font-bold truncate max-w-full leading-none mt-0.5 ${
                currentSection === 'menu' ? 'text-teal-700' : 'text-slate-400'
              }`}
            >
              MENU
            </span>
            {currentSection === 'menu' && (
              <motion.div
                layoutId="admin-bottom-nav-indicator"
                className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-teal-700"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        </nav>
      </div>
    </div>
  );
};
