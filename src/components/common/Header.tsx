import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  Trophy,
  Bell,
  Menu,
  X,
  Sparkles,
  Calculator,
  CalendarDays,
  ShieldCheck,
  GraduationCap,
  User,
  BarChart3,
} from 'lucide-react';
import { ApplicantUser } from '../../types';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenNotificationModal?: () => void;
  isNotificationSubscribed?: boolean;
  applicantUser?: ApplicantUser | null;
  onOpenApplicantAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenNotificationModal,
  isNotificationSubscribed,
  applicantUser,
  onOpenApplicantAuth,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'হোম', icon: Sparkles },
    { id: 'search', label: 'ফলাফল অনুসন্ধান', icon: Search },
    { id: 'analysis', label: 'একাডেমিক এনালাইসিস', icon: BarChart3 },
    { id: 'gpa-calculator', label: 'জিপিএ ক্যালকুলেটর', icon: Calculator },
    { id: 'smart-calendar', label: 'স্মার্ট ক্যালেন্ডার', icon: CalendarDays },
    { id: 'books', label: 'বুক লিস্ট', icon: BookOpen },
    { id: 'admission', label: 'ভর্তি আবেদন', icon: GraduationCap },
    { id: 'notices', label: 'নোটিশ', icon: Bell },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl backdrop-saturate-180 border-b border-slate-200/60 shadow-[0_4px_24px_rgba(15,23,42,0.04)] transition-all font-bengali">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Name */}
          <div
            id="brand-logo-btn"
            onClick={() => onTabChange('home')}
            className="flex items-center gap-2.5 sm:gap-4 cursor-pointer group select-none min-w-0"
          >
            <div className="relative w-9 h-9 sm:w-12 sm:h-12 rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 p-0.5 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 shrink-0">
              <img
                src="https://i.postimg.cc/mgyW32Y2/Firefly-Remove-Background.png"
                alt="DPIB RESULT ZONE"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-outfit font-black tracking-tight text-slate-900 text-sm sm:text-lg md:text-xl leading-none truncate">
                DPIB RESULT ZONE
              </span>
              <span className="text-[9px] sm:text-xs text-slate-500 font-bold tracking-widest uppercase mt-1 truncate">
                DIPLOMA IN ENGINEERING
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2 text-xs sm:text-sm font-bold text-slate-600 bg-slate-100/50 backdrop-blur-md p-1.5 rounded-full border border-slate-200/50">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  className={`transition-all px-3.5 py-1.5 rounded-full cursor-pointer flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white font-black shadow-xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/70'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action: Notification & Quick Search Button */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {onOpenNotificationModal && (
              <button
                id="btn-header-notification"
                type="button"
                onClick={onOpenNotificationModal}
                title="পুশ নোটিফিকেশন সেটিংস"
                className="relative p-2.5 text-slate-600 hover:text-blue-600 bg-white/70 hover:bg-blue-50/80 backdrop-blur-md rounded-2xl transition-all cursor-pointer border border-white/90 shadow-xs active:scale-95"
              >
                <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                {isNotificationSubscribed ? (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
                ) : (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full animate-ping" />
                )}
              </button>
            )}

            {/* Applicant Profile / Login Indicator */}
            {applicantUser ? (
              <button
                id="btn-header-applicant-profile"
                type="button"
                onClick={() => onTabChange('admission')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer backdrop-blur-md ${
                  currentTab === 'admission'
                    ? 'bg-blue-50/90 text-blue-700 border-blue-300'
                    : 'bg-white/70 hover:bg-white text-slate-700 border-white/80 shadow-xs'
                }`}
                title="আবেদনকারী প্রোফাইল"
              >
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  <User className="w-3 h-3" />
                </div>
                <span className="hidden md:inline truncate max-w-[100px]">
                  {applicantUser.displayName || 'প্রোফাইল'}
                </span>
              </button>
            ) : (
              <button
                id="btn-header-admission-apply"
                type="button"
                onClick={() => onTabChange('admission')}
                className="hidden xl:flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-800 border border-emerald-200/80 backdrop-blur-md rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>ভর্তি আবেদন</span>
              </button>
            )}

            <button
              id="btn-header-search"
              type="button"
              onClick={() => onTabChange('search')}
              className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold font-outfit uppercase shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>SEARCH RESULT</span>
            </button>

            {/* Mobile Menu Trigger */}
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 lg:hidden text-slate-600 hover:text-slate-900 bg-white/60 hover:bg-white/90 backdrop-blur-md border border-white/80 rounded-xl transition-all cursor-pointer shadow-xs"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation (Frosted Glass Sheet) */}
      {mobileMenuOpen && (
        <div id="mobile-menu-dropdown" className="lg:hidden border-t border-slate-200/60 bg-white/85 backdrop-blur-2xl backdrop-saturate-180 px-4 pt-3 pb-6 space-y-1.5 shadow-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/70 bg-white/40 border border-white/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Quick link to Merit List in Mobile Drawer */}
          <button
            id="mobile-nav-merit"
            onClick={() => {
              onTabChange('merit');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              currentTab === 'merit'
                ? 'bg-amber-500 text-white font-extrabold shadow-sm'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/70 bg-white/40 border border-white/60'
            }`}
          >
            <Trophy className={`w-4 h-4 ${currentTab === 'merit' ? 'text-white' : 'text-amber-600'}`} />
            <span>শীর্ষস্থান ও মেধাতালিকা</span>
          </button>
        </div>
      )}
    </header>
  );
};
