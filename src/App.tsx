import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './services/firebase';
import { Exam, Notice, SystemSettings, StudentResult, AppEvent, ApplicantUser } from './types';
import {
  getExams,
  getNotices,
  getSystemSettings,
  getPublishedEvents,
  subscribeToPublishedEvents,
  searchPublicResult,
} from './services/db';
import {
  getCurrentApplicantSession,
  onApplicantAuthStateChanged,
} from './services/admissionService';

// Common Components
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { SearchAnimationModal } from './components/common/SearchAnimationModal';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { LoadingOverlay } from './components/common/LoadingOverlay';
import { BottomSheet } from './components/common/BottomSheet';
import { NotificationPromptModal } from './components/common/NotificationPromptModal';
import { NotificationToast } from './components/common/NotificationToast';
import { PWAInstallBanner } from './components/common/PWAInstallBanner';
import { PageTransition } from './components/common/PageTransition';
import { AnimatePresence } from 'motion/react';
import { usePushNotification } from './hooks/usePushNotification';
import { SearchX } from 'lucide-react';
import { playPassSound, playFailSound, triggerPassConfetti } from './utils/resultAudio';

// Public Components
import { PublicHomePage } from './components/public/PublicHomePage';
import { HeroSearchCard } from './components/public/HeroSearchCard';
import { PublicExamList } from './components/public/PublicExamList';
import { PublicMeritList } from './components/public/PublicMeritList';
import { AcademicAnalysisPage } from './components/public/AcademicAnalysisPage';
import { PublicNoticeSection } from './components/public/PublicNoticeSection';
import { ResultVerification } from './components/public/ResultVerification';
import { ResultBottomSheet } from './components/public/ResultBottomSheet';
import { PublicMoreBottomSheet } from './components/public/PublicMoreBottomSheet';
import { GpaCalculatorPage } from './components/public/GpaCalculatorPage';
import { SmartCalendarPage } from './components/public/SmartCalendarPage';
import { StudentBookListPage } from './components/public/StudentBookListPage';

// Admission & Applicant Profile Components
import { ApplicantProfileView } from './components/admission/ApplicantProfileView';
import { ApplicantAuthModal } from './components/admission/ApplicantAuthModal';
import { OfficialAdmissionInfoPage } from './components/admission/OfficialAdmissionInfoPage';
import { FloatingHelplineWidget } from './components/admission/FloatingHelplineWidget';

// Admin Components
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminMenuPage } from './components/admin/AdminMenuPage';
import { AcademicDocumentsHub, DocumentTab } from './components/admin/documents/AcademicDocumentsHub';
import { TeacherManagement } from './components/admin/TeacherManagement';
import { StudentManagement } from './components/admin/StudentManagement';
import { ExamManagement } from './components/admin/ExamManagement';
import { ResultManagement } from './components/admin/ResultManagement';
import { NoticeManagement } from './components/admin/NoticeManagement';
import { SettingsManagement } from './components/admin/SettingsManagement';
import { SecurityPage } from './components/admin/SecurityPage';
import { ShiftManagementPage } from './components/admin/ShiftManagementPage';
import { EventManagement } from './components/admin/EventManagement';
import { AdmissionManagement } from './components/admin/AdmissionManagement';
import { BookManagement } from './components/admin/BookManagement';

export function App() {
  // Navigation State
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminSection, setAdminSection] = useState('dashboard');
  const [adminDocTab, setAdminDocTab] = useState<DocumentTab>('result-generator');
  const [publicTab, setPublicTab] = useState<
    'home' | 'search' | 'merit' | 'exams' | 'notices' | 'verify' | 'gpa-calculator' | 'smart-calendar' | 'admission' | 'analysis' | 'books'
  >('home');
  const [verificationCodeParam, setVerificationCodeParam] = useState<string>('');
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  // Applicant Profile & Admission State
  const [applicantUser, setApplicantUser] = useState<ApplicantUser | null>(() => getCurrentApplicantSession());
  const [applicantAuthModalOpen, setApplicantAuthModalOpen] = useState(false);
  const [applicantAuthInitialMode, setApplicantAuthInitialMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Firebase Auth State & Admin Session
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [localAdminSession, setLocalAdminSession] = useState<{ email: string; displayName: string } | null>(() => {
    try {
      const saved = sessionStorage.getItem('dpib_admin_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(true);

  const effectiveAdminUser = currentUser || (localAdminSession ? ({
    email: localAdminSession.email,
    displayName: localAdminSession.displayName,
    uid: 'local-admin-uid',
  } as any) : null);
  const isAdminLoggedIn = Boolean(effectiveAdminUser);

  // App Data State
  const [exams, setExams] = useState<Exam[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Search & Result Bottom Sheet States
  const [searchAnimationActive, setSearchAnimationActive] = useState(false);
  const [searchStatus, setSearchStatus] = useState<'searching' | 'success' | 'not_found'>('searching');
  const [searchResultData, setSearchResultData] = useState<StudentResult | null>(null);
  const [searchedRoll, setSearchedRoll] = useState<string>('');
  const [resultSheetOpen, setResultSheetOpen] = useState(false);
  const [notFoundModalOpen, setNotFoundModalOpen] = useState(false);

  // Push Notification & PWA State
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const {
    isSupported: isPushSupported,
    permission: pushPermission,
    isSubscribed: isPushSubscribed,
    loading: pushLoading,
    error: pushError,
    incomingNotification,
    enableNotifications,
    disableNotifications,
    triggerTestNotification,
    clearIncomingNotification,
    checkPermission,
  } = usePushNotification();

  const handleNotificationClick = (payload: any) => {
    if (payload.url) {
      try {
        const parsed = new URL(payload.url, window.location.origin);
        const tab = parsed.searchParams.get('tab');
        if (tab && ['home', 'search', 'merit', 'exams', 'notices', 'verify', 'gpa-calculator', 'smart-calendar'].includes(tab)) {
          setPublicTab(tab as any);
        }
        const verify = parsed.searchParams.get('verify');
        if (verify) {
          setVerificationCodeParam(verify);
          setPublicTab('verify');
        }
      } catch {
        // Fallback simple string matching
        if (payload.url.includes('notices')) setPublicTab('notices');
        else if (payload.url.includes('search')) setPublicTab('search');
        else if (payload.url.includes('exams')) setPublicTab('exams');
      }
    } else if (payload.type === 'NOTICE') {
      setPublicTab('notices');
    } else if (payload.type === 'RESULT') {
      setPublicTab('search');
    }
  };

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to Applicant Auth State
  useEffect(() => {
    const unsubscribe = onApplicantAuthStateChanged((user) => {
      setApplicantUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Check URL parameters, pathname & hash for routing (Admin Access, Verification, or /admission route)
  useEffect(() => {
    const checkUrlRouting = () => {
      const pathname = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const urlParams = new URLSearchParams(window.location.search);
      const adminParam = urlParams.get('admin');
      const panelParam = urlParams.get('panel');

      if (adminParam === 'true' || adminParam === 'login' || panelParam === 'admin' || hash === '#admin') {
        setIsAdminMode(true);
      }

      const verifyParam = urlParams.get('verify');
      if (verifyParam) {
        setVerificationCodeParam(verifyParam);
        setPublicTab('verify');
        return;
      }

      // Check if user directly loaded or refreshed on /admission route
      if (
        pathname === '/admission' ||
        pathname === '/admission/' ||
        hash === '#admission' ||
        hash === '#/admission' ||
        urlParams.get('tab') === 'admission'
      ) {
        setPublicTab('admission');
        return;
      }

      const tabParam = urlParams.get('tab');
      if (tabParam && ['home', 'search', 'analysis', 'merit', 'exams', 'notices', 'verify', 'gpa-calculator', 'smart-calendar'].includes(tabParam)) {
        setPublicTab(tabParam as any);
      }
    };

    checkUrlRouting();
    window.addEventListener('popstate', checkUrlRouting);
    window.addEventListener('hashchange', checkUrlRouting);
    return () => {
      window.removeEventListener('popstate', checkUrlRouting);
      window.removeEventListener('hashchange', checkUrlRouting);
    };
  }, []);

  // Synchronized Public Tab Navigation with Browser History
  const handleNavigatePublicTab = (tab: typeof publicTab) => {
    setPublicTab(tab);
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
    if (tab === 'admission') {
      if (window.location.pathname !== '/admission') {
        try {
          window.history.pushState({ tab: 'admission' }, '', '/admission');
        } catch {
          window.location.hash = '#admission';
        }
      }
    } else {
      if (window.location.pathname === '/admission' || window.location.hash.includes('admission')) {
        try {
          window.history.pushState({ tab }, '', '/');
        } catch {
          window.location.hash = '';
        }
      }
    }
  };

  // Keyboard shortcut (Alt + Shift + A or Ctrl + Shift + A) to toggle admin view seamlessly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey || e.ctrlKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsAdminMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch initial portal data
  const loadPortalData = useCallback(async () => {
    try {
      const [examsData, noticesData, eventsData, settingsData] = await Promise.all([
        getExams(),
        getNotices(),
        getPublishedEvents(),
        getSystemSettings(),
      ]);
      setExams(examsData);
      setNotices(noticesData);
      setEvents(eventsData);
      setSettings(settingsData);
    } catch (err) {
      console.error('Portal data error:', err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortalData();

    // Subscribe to realtime published events so countdowns & user panel update instantly
    const unsubscribeEvents = subscribeToPublishedEvents(
      (realtimeEvents) => {
        setEvents(realtimeEvents);
      },
      (err) => {
        console.error('Realtime events subscription error:', err);
      }
    );

    return () => {
      unsubscribeEvents();
    };
  }, [loadPortalData]);

  // Handle Search Result Flow
  const handlePerformSearch = async (params: {
    roll: string;
    semesterId?: string;
    examId?: string;
  }) => {
    setSearchedRoll(params.roll);
    setSearchAnimationActive(true);
    setSearchStatus('searching');
    setSearchResultData(null);

    try {
      const foundResult = await searchPublicResult(params);
      if (foundResult) {
        setSearchResultData(foundResult);
        setSearchStatus('success');
      } else {
        setSearchStatus('not_found');
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchStatus('not_found');
    }
  };

  const handleSearchAnimationComplete = () => {
    setSearchAnimationActive(false);
    if (searchResultData) {
      const isPassed = Boolean(
        searchResultData.isPassed &&
        (searchResultData.gpa || 0) > 0 &&
        searchResultData.letterGrade !== 'F'
      );

      if (isPassed) {
        // পাশ করলে কিংবা A+ পেলে কনফেটি ফাটবে এবং ভালো সাউন্ড বাজবে
        playPassSound();
        triggerPassConfetti();
      } else {
        // ফেল দেখালে ব্যাড সাউন্ড বাজবে
        playFailSound();
      }

      // সব শিক্ষার্থীর রেজাল্ট শিট স্বাভাবিকভাবে পূর্ণাঙ্গ তথ্যসহ খুলবে
      setResultSheetOpen(true);
    } else {
      setNotFoundModalOpen(true);
    }
  };

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('dpib_admin_session');
      setLocalAdminSession(null);
      await signOut(auth);
      setIsAdminMode(false);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Premium 3D Book Initial Loading Overlay
  if (initialLoading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bengali">
        <LoadingOverlay
          isVisible={true}
          message="সিস্টেম ও ডেটাবেস প্রস্তুত করা হচ্ছে..."
          subtext="DPIB RESULT ZONE ক্লাউড সার্ভারের সাথে সংযোগ স্থাপিত হচ্ছে..."
        />
      </div>
    );
  }

  const departments = settings?.departments || [];
  const examTypes = settings?.examTypes || ['MODEL TEST', 'MOCK TEST', 'CLASS TEST', 'INTERNAL EXAM', 'OTHER EXAM'];

  // ================= ADMIN VIEW =================
  if (isAdminMode) {
    if (!isAdminLoggedIn) {
      return (
        <AdminLogin
          onSuccess={(customSession) => {
            if (customSession) {
              setLocalAdminSession(customSession);
              try {
                sessionStorage.setItem('dpib_admin_session', JSON.stringify(customSession));
              } catch (e) {
                console.error(e);
              }
            }
            setIsAdminMode(true);
            setAdminSection('dashboard');
          }}
          onBackToPublic={() => {
            setIsAdminMode(false);
            // Clean admin url param if present
            if (window.location.hash === '#admin') {
              window.history.replaceState(null, '', window.location.pathname);
            }
          }}
        />
      );
    }

    const handleAdminSectionChange = (sec: string) => {
      setAdminSection(sec);
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        window.scrollTo(0, 0);
      }
    };

    return (
      <AdminLayout
        currentSection={adminSection}
        onSectionChange={handleAdminSectionChange}
        currentUser={effectiveAdminUser}
        onLogout={handleLogout}
        onBackToPublic={() => {
          setIsAdminMode(false);
          if (window.location.hash === '#admin') {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }}
      >
        <AnimatePresence mode="wait">
          {adminSection === 'dashboard' && (
            <PageTransition key="admin-dashboard">
              <AdminDashboard
                onNavigate={handleAdminSectionChange}
                exams={exams}
              />
            </PageTransition>
          )}
          {adminSection === 'menu' && (
            <PageTransition key="admin-menu">
              <AdminMenuPage
                onNavigate={(sec, docTab) => {
                  if (docTab) setAdminDocTab(docTab);
                  handleAdminSectionChange(sec);
                }}
              />
            </PageTransition>
          )}
          {adminSection === 'documents' && (
            <PageTransition key="admin-documents">
              <AcademicDocumentsHub
                initialTab={adminDocTab}
                onBackToMenu={() => handleAdminSectionChange('menu')}
              />
            </PageTransition>
          )}
          {adminSection === 'admissions' && (
            <PageTransition key="admin-admissions">
              <AdmissionManagement />
            </PageTransition>
          )}
          {adminSection === 'teachers' && (
            <PageTransition key="admin-teachers">
              <TeacherManagement departments={departments} />
            </PageTransition>
          )}
          {adminSection === 'students' && (
            <PageTransition key="admin-students">
              <StudentManagement departments={departments} />
            </PageTransition>
          )}
          {adminSection === 'exams' && (
            <PageTransition key="admin-exams">
              <ExamManagement
                exams={exams}
                departments={departments}
                examTypes={examTypes}
                onRefreshExams={loadPortalData}
              />
            </PageTransition>
          )}
          {adminSection === 'results' && (
            <PageTransition key="admin-results">
              <ResultManagement
                exams={exams}
                departments={departments}
                onRefreshStats={loadPortalData}
              />
            </PageTransition>
          )}
          {adminSection === 'events' && (
            <PageTransition key="admin-events">
              <EventManagement />
            </PageTransition>
          )}
          {adminSection === 'notices' && (
            <PageTransition key="admin-notices">
              <NoticeManagement onRefreshStats={loadPortalData} />
            </PageTransition>
          )}
          {adminSection === 'books' && (
            <PageTransition key="admin-books">
              <BookManagement departments={departments} />
            </PageTransition>
          )}
          {adminSection === 'shifts' && (
            <PageTransition key="admin-shifts">
              <ShiftManagementPage onBackToSettings={() => handleAdminSectionChange('settings')} />
            </PageTransition>
          )}
          {adminSection === 'security' && (
            <PageTransition key="admin-security">
              <SecurityPage onBackToSettings={() => handleAdminSectionChange('settings')} />
            </PageTransition>
          )}
          {adminSection === 'settings' && (
            <PageTransition key="admin-settings">
              <SettingsManagement
                departments={departments}
                onRefreshSettings={loadPortalData}
                onNavigate={handleAdminSectionChange}
              />
            </PageTransition>
          )}
        </AnimatePresence>
      </AdminLayout>
    );
  }

  // ================= PUBLIC PORTAL VIEW =================
  const isAdmissionRoute = publicTab === 'admission';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white font-bengali">
      {/* Public Header - Clean Public Navigation with NO Admin Links (Hidden on dedicated /admission route) */}
      {!isAdmissionRoute && (
        <Header
          currentTab={publicTab}
          onTabChange={handleNavigatePublicTab}
          onOpenNotificationModal={() => setNotificationModalOpen(true)}
          isNotificationSubscribed={isPushSubscribed}
          applicantUser={applicantUser}
          onOpenApplicantAuth={() => {
            setApplicantAuthInitialMode('LOGIN');
            setApplicantAuthModalOpen(true);
          }}
        />
      )}

      {/* Main View Router with Modern Page Transition */}
      <main className={isAdmissionRoute ? 'flex-1' : 'flex-1 pb-24 md:pb-8'}>
        <AnimatePresence mode="wait">
          {publicTab === 'home' && (
            <PageTransition key="public-home">
              <PublicHomePage
                exams={exams}
                notices={notices}
                events={events}
                settings={settings}
                onNavigateTab={handleNavigatePublicTab}
              />
            </PageTransition>
          )}

          {publicTab === 'admission' && (
            <PageTransition key={`public-admission-${applicantUser ? applicantUser.uid : 'guest'}`}>
              {applicantUser ? (
                <ApplicantProfileView
                  currentUser={applicantUser}
                  onLogout={() => {
                    setApplicantUser(null);
                  }}
                  onBackToHome={() => handleNavigatePublicTab('home')}
                />
              ) : (
                <OfficialAdmissionInfoPage
                  onOpenRegister={() => {
                    setApplicantAuthInitialMode('REGISTER');
                    setApplicantAuthModalOpen(true);
                  }}
                  onOpenLogin={() => {
                    setApplicantAuthInitialMode('LOGIN');
                    setApplicantAuthModalOpen(true);
                  }}
                  onBackToHome={() => handleNavigatePublicTab('home')}
                />
              )}
            </PageTransition>
          )}

          {publicTab === 'search' && (
            <PageTransition key="public-search">
              <HeroSearchCard
                exams={exams}
                onSearch={handlePerformSearch}
                onNavigateTab={handleNavigatePublicTab}
              />
            </PageTransition>
          )}

          {publicTab === 'gpa-calculator' && (
            <PageTransition key="public-gpa-calculator">
              <GpaCalculatorPage />
            </PageTransition>
          )}

          {publicTab === 'smart-calendar' && (
            <PageTransition key="public-smart-calendar">
              <SmartCalendarPage />
            </PageTransition>
          )}

          {publicTab === 'books' && (
            <PageTransition key="public-books">
              <StudentBookListPage
                settings={settings}
                onNavigateTab={handleNavigatePublicTab}
              />
            </PageTransition>
          )}

          {publicTab === 'exams' && (
            <PageTransition key="public-exams">
              <PublicExamList
                exams={exams}
                onSelectExamForSearch={() => {
                  handleNavigatePublicTab('search');
                }}
              />
            </PageTransition>
          )}

          {publicTab === 'analysis' && (
            <PageTransition key="public-analysis">
              <AcademicAnalysisPage
                exams={exams}
                settings={settings}
                onViewResultCard={(res) => {
                  setSearchResultData(res);
                  setResultSheetOpen(true);
                }}
                onNavigateTab={handleNavigatePublicTab}
              />
            </PageTransition>
          )}

          {publicTab === 'merit' && (
            <PageTransition key="public-merit">
              <PublicMeritList
                exams={exams}
                onViewResultCard={(res) => {
                  setSearchResultData(res);
                  setResultSheetOpen(true);
                }}
              />
            </PageTransition>
          )}

          {publicTab === 'notices' && (
            <PageTransition key="public-notices">
              <PublicNoticeSection notices={notices} />
            </PageTransition>
          )}

          {publicTab === 'verify' && (
            <PageTransition key="public-verify">
              <ResultVerification
                initialCode={verificationCodeParam}
                onViewResultCard={(res) => {
                  setSearchResultData(res);
                  setResultSheetOpen(true);
                }}
              />
            </PageTransition>
          )}
        </AnimatePresence>
      </main>

      {/* Foreground Realtime Push Notification Toast */}
      <NotificationToast
        notification={incomingNotification}
        onClose={clearIncomingNotification}
        onClick={handleNotificationClick}
      />

      {/* Notification Permission & Subscription Modal (Bangla UI) */}
      <NotificationPromptModal
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
        isSubscribed={isPushSubscribed}
        permission={pushPermission}
        loading={pushLoading}
        error={pushError}
        departments={departments}
        onEnable={enableNotifications}
        onDisable={disableNotifications}
        onTestNotification={triggerTestNotification}
        onCheckPermission={checkPermission}
      />

      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Search Animation 4-Step Modal (Light Glass) */}
      <SearchAnimationModal
        isActive={searchAnimationActive}
        status={searchStatus}
        onComplete={handleSearchAnimationComplete}
        onCancel={() => setSearchAnimationActive(false)}
        roll={searchedRoll}
      />

      {/* Result Bottom Sheet Card */}
      <ResultBottomSheet
        isOpen={resultSheetOpen}
        onClose={() => setResultSheetOpen(false)}
        result={searchResultData}
        onVerifyResult={(code) => {
          setVerificationCodeParam(code);
          handleNavigatePublicTab('verify');
        }}
      />

      {/* Result Not Found Modal */}
      <BottomSheet
        isOpen={notFoundModalOpen}
        onClose={() => setNotFoundModalOpen(false)}
        title="ফলাফল পাওয়া যায়নি"
        subtitle="প্রদত্ত তথ্যের সাথে কোনো প্রকাশিত ফলাফল মেলেনি"
      >
        <div className="space-y-4 pb-6 text-center">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
            <SearchX className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">
              রোল নম্বর: <span className="font-outfit font-black text-rose-600">{searchedRoll}</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
              অনুগ্রহ করে নিশ্চিত করুন যে রোল নম্বরটি সঠিক এবং পরীক্ষার ফলাফল প্রকাশিত হয়েছে। কোনো সন্দেহ থাকলে বিভাগীয় প্রধান বা পরীক্ষা নিয়ন্ত্রকের সাথে যোগাযোগ করুন।
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setNotFoundModalOpen(false);
                handleNavigatePublicTab('search');
              }}
              className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-98 cursor-pointer"
            >
              আবার খুঁজুন
            </button>
            <button
              type="button"
              onClick={() => {
                setNotFoundModalOpen(false);
                handleNavigatePublicTab('exams');
              }}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              পরীক্ষার তালিকা
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Public More Bottom Sheet (Clean with NO Admin Links) */}
      <PublicMoreBottomSheet
        isOpen={moreSheetOpen}
        onClose={() => setMoreSheetOpen(false)}
        onNavigateTab={(tab) => {
          handleNavigatePublicTab(tab as any);
        }}
        onOpenNotificationModal={() => setNotificationModalOpen(true)}
      />

      {/* Applicant Authentication Modal (Modern Sliding Bottom Sheet) */}
      <ApplicantAuthModal
        isOpen={applicantAuthModalOpen}
        onClose={() => setApplicantAuthModalOpen(false)}
        initialMode={applicantAuthInitialMode}
        onSuccess={(user) => {
          setApplicantUser(user);
          setApplicantAuthModalOpen(false);
          handleNavigatePublicTab('admission');
        }}
      />

      {/* Dedicated Floating Helpline Widget for Admission Portal */}
      {isAdmissionRoute && <FloatingHelplineWidget />}

      {/* Public Footer (Hidden on /admission route) */}
      {!isAdmissionRoute && (
        <Footer
          currentTab={publicTab}
          isHome={publicTab === 'home'}
          onTabChange={handleNavigatePublicTab}
        />
      )}

      {/* Mobile Floating Bottom Navigation Bar (Hidden on /admission route) */}
      {!isAdmissionRoute && (
        <MobileBottomNav
          currentTab={publicTab}
          onTabChange={handleNavigatePublicTab}
          onOpenSearch={() => handleNavigatePublicTab('search')}
          onOpenMore={() => setMoreSheetOpen(true)}
        />
      )}
    </div>
  );
}

export default App;
