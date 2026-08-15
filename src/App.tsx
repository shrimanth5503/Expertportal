import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { RegisterForm } from './components/RegisterForm.tsx';
import { LoginForm } from './components/LoginForm.tsx';
import { UserProfileView } from './components/UserProfile.tsx';
import { SupabaseModal } from './components/SupabaseModal.tsx';
import { AllUsersModal } from './components/AllUsersModal.tsx';
import { UserProfile, AuthResponse, DbStatusResponse } from './types.ts';
import { safeFetchJson } from './lib/api.ts';
import { ShieldCheck, Database, Lock, AlertTriangle, ArrowRight, Check } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'register' | 'login'>('register');
  const [storageType, setStorageType] = useState<'supabase' | 'sandbox'>('sandbox');
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authBannerNotice, setAuthBannerNotice] = useState<string | null>(null);

  // Fetch Database Status
  const fetchDbStatus = async () => {
    try {
      const result = await safeFetchJson<DbStatusResponse>('/api/db/status');
      if (result.ok && result.data) {
        setDbStatus(result.data);
        if (result.data.activeStore) {
          setStorageType(result.data.activeStore);
        }
      } else {
        console.warn('DB status notice:', result.errorText);
      }
    } catch (err) {
      console.warn('Could not fetch DB status:', err);
    }
  };

  // Restore authenticated session from token
  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsCheckingAuth(false);
      return;
    }

    try {
      const result = await safeFetchJson<{ success: boolean; user?: UserProfile; storageType?: 'supabase' | 'sandbox' }>(
        '/api/auth/me',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (result.ok && result.data?.success && result.data.user) {
        setCurrentUser(result.data.user);
        if (result.data.storageType) {
          setStorageType(result.data.storageType);
        }
      } else {
        localStorage.removeItem('auth_token');
      }
    } catch (err) {
      console.warn('Session check error:', err);
      localStorage.removeItem('auth_token');
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    fetchDbStatus();
    checkAuth();
  }, []);

  const handleAuthSuccess = (response: AuthResponse) => {
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    if (response.user) {
      setCurrentUser(response.user);
    }
    if (response.storageType) {
      setStorageType(response.storageType);
    }
    if (response.tableMissing || response.warning) {
      setAuthBannerNotice(
        response.warning ||
          'Account created! Table "users" has not been initialized in Supabase yet. Open Supabase SQL Editor to enable cloud persistence.'
      );
    } else {
      setAuthBannerNotice(null);
    }
    fetchDbStatus();
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setCurrentUser(null);
    setActiveTab('login');
    setAuthBannerNotice(null);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#1A1A1A] border-t-[#BC9C22] animate-spin mx-auto" />
          <p className="text-xs font-serif uppercase tracking-widest text-[#1A1A1A]">
            Verifying Identity & Encryption Protocol...
          </p>
        </div>
      </div>
    );
  }

  const needsTableSetup = dbStatus?.configured && !dbStatus?.tableExists;

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#BC9C22] selection:text-[#1A1A1A]">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenDbModal={() => setIsDbModalOpen(true)}
        onOpenDirectoryModal={() => setIsUsersModalOpen(true)}
        dbStatus={dbStatus}
      />

      {/* Supabase Notice Banner if configured but table not created in SQL editor yet */}
      {needsTableSetup && (
        <div className="bg-amber-100/90 border-b border-amber-300 text-amber-950 px-4 py-2.5 text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Supabase Connected:</strong> PostgreSQL requires the <code className="font-mono font-bold bg-amber-200/80 px-1 py-0.5">public.users</code> table. Run the SQL script to start persisting data to the cloud.
              </span>
            </div>
            <button
              onClick={() => setIsDbModalOpen(true)}
              className="px-3 py-1 bg-[#1A1A1A] text-[#FDFCF8] hover:bg-[#BC9C22] hover:text-[#1A1A1A] text-[10px] font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
            >
              1-Click Setup SQL
            </button>
          </div>
        </div>
      )}

      {authBannerNotice && (
        <div className="bg-[#1A1A1A] text-[#FDFCF8] border-b border-[#BC9C22] px-4 py-3 text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-[#BC9C22] shrink-0" />
              <span>{authBannerNotice}</span>
            </div>
            <button
              onClick={() => setIsDbModalOpen(true)}
              className="px-3 py-1 bg-[#BC9C22] text-[#1A1A1A] text-[10px] font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
            >
              View SQL Schema
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col justify-center">
        {currentUser ? (
          /* Authenticated User Profile & Dossier */
          <UserProfileView
            user={currentUser}
            storageType={storageType}
            dbStatus={dbStatus}
            onUpdateUser={(updated) => setCurrentUser(updated)}
            onOpenDbModal={() => setIsDbModalOpen(true)}
            onOpenAllUsersModal={() => setIsUsersModalOpen(true)}
            onLogout={handleLogout}
          />
        ) : (
          /* Unauthenticated Flow: "Artistic Flair" Split Canvas */
          <div className="flex flex-col lg:flex-row w-full max-w-6xl mx-auto shadow-2xl border border-[#1A1A1A]/15 bg-[#FDFCF8] overflow-hidden min-h-[720px]">
            {/* Left Hero Panel (42%) */}
            <div className="w-full lg:w-[42%] bg-[#1A1A1A] p-8 sm:p-12 lg:p-14 flex flex-col justify-between text-[#FDFCF8] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-[#BC9C22] opacity-10 rounded-bl-full pointer-events-none" />

              <div>
                <p className="text-[#BC9C22] uppercase tracking-[0.3em] text-xs font-bold mb-8">
                  The Expert Portal
                </p>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif leading-[0.92] italic text-[#FDFCF8]">
                  Forge Your <br />Digital <br />Presence
                </h1>
              </div>

              <div className="border-t border-[#333] pt-8 mt-10 lg:mt-0">
                <p className="text-xs sm:text-sm text-[#FDFCF8]/60 leading-relaxed mb-6 font-light">
                  Securely connect your talent with the world’s most ambitious projects. Powered by Supabase encryption and Bcrypt salt hashing for total data sovereignty.
                </p>
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-[1px] bg-[#BC9C22]" />
                  <span className="text-[10px] uppercase tracking-widest text-[#BC9C22] font-semibold">
                    Identity & Governance
                  </span>
                </div>
              </div>
            </div>

            {/* Right Interactive Form Area (58%) */}
            <div className="w-full lg:w-[58%] p-6 sm:p-10 lg:p-14 flex flex-col justify-center bg-[#FDFCF8]">
              <div className="max-w-md mx-auto w-full">
                {/* Tab Switcher */}
                <div className="flex border-b border-[#1A1A1A]/15 mb-6">
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold border-b-2 transition-all cursor-pointer ${
                      activeTab === 'register'
                        ? 'border-[#1A1A1A] text-[#1A1A1A]'
                        : 'border-transparent text-[#1A1A1A]/40 hover:text-[#1A1A1A]'
                    }`}
                  >
                    1. Create Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold border-b-2 transition-all cursor-pointer ${
                      activeTab === 'login'
                        ? 'border-[#1A1A1A] text-[#1A1A1A]'
                        : 'border-transparent text-[#1A1A1A]/40 hover:text-[#1A1A1A]'
                    }`}
                  >
                    2. Member Sign In
                  </button>
                </div>

                {/* Active Form */}
                {activeTab === 'register' ? (
                  <RegisterForm
                    onRegisterSuccess={handleAuthSuccess}
                    onSwitchToLogin={() => setActiveTab('login')}
                  />
                ) : (
                  <LoginForm
                    onLoginSuccess={handleAuthSuccess}
                    onSwitchToRegister={() => setActiveTab('register')}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1A1A1A]/10 bg-[#FDFCF8] py-6 text-center text-xs text-[#1A1A1A]/60">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-serif font-bold text-[#1A1A1A]">The Expert Portal</span>
            <span>•</span>
            <span className="text-[11px] uppercase tracking-wider">
              Supabase PostgreSQL & Bcrypt Security Protocol
            </span>
          </div>
          <div className="flex items-center space-x-6 text-xs uppercase tracking-wider font-semibold">
            <button
              onClick={() => setIsDbModalOpen(true)}
              className="text-[#1A1A1A] hover:text-[#BC9C22] transition-colors cursor-pointer"
            >
              Supabase SQL Setup
            </button>
            <button
              onClick={() => setIsUsersModalOpen(true)}
              className="text-[#1A1A1A] hover:text-[#BC9C22] transition-colors cursor-pointer"
            >
              Developer Directory
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SupabaseModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        dbStatus={dbStatus}
        onRefresh={fetchDbStatus}
      />

      <AllUsersModal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
      />
    </div>
  );
}
