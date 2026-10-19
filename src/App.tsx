import React, { useState } from 'react';
import { ToastProvider, useToast } from './context/ToastContext';
import { AdminLayout, AdminTab } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ResultManagement } from './components/admin/ResultManagement';
import { StudentManagement } from './components/admin/StudentManagement';
import { ExamManagement } from './components/admin/ExamManagement';
import { DocumentGenerator } from './components/admin/DocumentGenerator';
import { NoticeManagement } from './components/admin/NoticeManagement';
import { RoutineManagement } from './components/admin/RoutineManagement';
import { SettingsManagement } from './components/admin/SettingsManagement';
import { PublicPortal } from './components/public/PublicPortal';
import { Lock, X, KeyRound, ShieldCheck } from 'lucide-react';
import { db } from './services/db';

const AppContent: React.FC = () => {
  const { success, error, info } = useToast();

  const [currentView, setCurrentView] = useState<'ADMIN' | 'PUBLIC'>('ADMIN');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('dpib_admin_auth') === 'true';
  });
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');

  // Admin PIN Login Modal
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const actualPin = db.getAdminPin();

    if (pinInput === actualPin) {
      setIsAdminAuthenticated(true);
      localStorage.setItem('dpib_admin_auth', 'true');
      setShowLoginModal(false);
      setPinInput('');
      setCurrentView('ADMIN');
      success('এডমিন প্যানেলে স্বাগতম! সফলভাবে লগইন সম্পন্ন হয়েছে।', 'লগইন সফল');
    } else {
      error('ভুল এডমিন পিন! সঠিক পিন প্রদান করে পুনরায় চেষ্টা করুন। (ডিফল্ট: 123456)', 'অনুমোদন ব্যর্থ');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('dpib_admin_auth');
    setCurrentView('PUBLIC');
    info('এডমিন সেশন সমাপ্ত হয়েছে এবং সফলভাবে লগআউট হয়েছে।', 'লগআউট');
  };

  return (
    <>
      {currentView === 'ADMIN' ? (
        isAdminAuthenticated ? (
          <AdminLayout
            currentTab={currentTab}
            onTabChange={(tab) => setCurrentTab(tab)}
            onLogout={handleAdminLogout}
            onGoToPublic={() => setCurrentView('PUBLIC')}
          >
            {currentTab === 'dashboard' && <AdminDashboard onNavigate={(tab) => setCurrentTab(tab)} />}
            {currentTab === 'results' && <ResultManagement />}
            {currentTab === 'students' && <StudentManagement />}
            {currentTab === 'exams' && <ExamManagement />}
            {currentTab === 'documents' && <DocumentGenerator />}
            {currentTab === 'notices' && <NoticeManagement />}
            {currentTab === 'routines' && <RoutineManagement />}
            {currentTab === 'settings' && <SettingsManagement />}
          </AdminLayout>
        ) : (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-md">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">এডমিন প্যানেল সিকিউরিটি</h2>
                <p className="text-xs text-slate-500 mt-1">
                  প্রবেশাধিকার নিশ্চিত করতে এডমিন পাসকোড বা পিন প্রদান করুন
                </p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="এডমিন পিন (ডিফল্ট: 123456)"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-bold text-lg tracking-widest focus:outline-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-sm"
                >
                  প্রবেশ করুন
                </button>
              </form>

              <button
                type="button"
                onClick={() => setCurrentView('PUBLIC')}
                className="text-xs text-slate-500 hover:text-emerald-700 hover:underline cursor-pointer"
              >
                &larr; পাবলিক ফলাফল পোর্টালে ফিরে যান
              </button>
            </div>
          </div>
        )
      ) : (
        <PublicPortal onOpenAdminLogin={() => setShowLoginModal(true)} />
      )}

      {/* Admin Login Modal Triggered from Public Portal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-800 text-base">এডমিন সিকিউরিটি ভেরিফিকেশন</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              দক্ষিণবঙ্গ পলিটেকনিক ইনস্টিটিউটের ফলাফল ব্যবস্থাপনা ও প্রশাসনিক কর্মকাণ্ডের জন্য এডমিন পিন দিন:
            </p>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input
                type="password"
                required
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="এডমিন পিন (ডিফল্ট: 123456)"
                className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-bold text-lg tracking-widest focus:outline-emerald-500"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  লগইন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
