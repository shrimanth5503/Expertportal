import React from 'react';
import { Shield, Database, Lock, LogOut, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { UserProfile, DbStatusResponse } from '../types.ts';

interface NavbarProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
  onOpenDbModal: () => void;
  onOpenDirectoryModal: () => void;
  dbStatus: DbStatusResponse | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onOpenDbModal,
  onOpenDirectoryModal,
  dbStatus,
}) => {
  const isSupabaseConfigured = dbStatus?.configured;
  const isTableActive = dbStatus?.tableExists;

  return (
    <header className="bg-[#FDFCF8]/95 backdrop-blur-md border-b border-[#1A1A1A]/10 sticky top-0 z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo & Editorial Name */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 bg-[#1A1A1A] text-[#BC9C22] flex items-center justify-center shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif text-xl font-bold tracking-tight text-[#1A1A1A]">
                The Expert Portal
              </span>
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2 py-0.5 bg-[#BC9C22]/15 text-[#8C7416] border border-[#BC9C22]/30">
                Bcrypt Active
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/50 font-medium">
              Identity & Skills Governance
            </p>
          </div>
        </div>

        {/* Action Controls & DB indicator */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Database Pill */}
          <button
            onClick={onOpenDbModal}
            className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer ${
              isTableActive
                ? 'bg-[#1A1A1A] text-[#BC9C22] border-[#BC9C22]/50 hover:bg-[#2A2A2A]'
                : isSupabaseConfigured
                ? 'bg-amber-50 text-amber-900 border-amber-400 hover:bg-amber-100 animate-pulse'
                : 'bg-[#BC9C22]/10 text-[#8C7416] border-[#BC9C22]/30 hover:bg-[#BC9C22]/20'
            }`}
            title="Click to view Supabase database configuration"
          >
            <Database className="w-3.5 h-3.5 shrink-0 text-[#BC9C22]" />
            <span className="hidden sm:inline">DB:</span>
            <span>
              {isTableActive
                ? 'Supabase Live'
                : isSupabaseConfigured
                ? '⚠️ Setup Supabase Table'
                : 'Sandbox DB'}
            </span>
          </button>

          {/* Directory of accounts */}
          <button
            onClick={onOpenDirectoryModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#1A1A1A] bg-transparent hover:bg-[#1A1A1A]/5 border border-[#1A1A1A]/20 transition-colors cursor-pointer"
            title="View all registered users"
          >
            <Users className="w-3.5 h-3.5 opacity-70" />
            <span className="hidden sm:inline">Directory</span>
          </button>

          {/* Current User or Security indicator */}
          {currentUser ? (
            <div className="flex items-center space-x-3 pl-2 sm:pl-3 border-l border-[#1A1A1A]/10">
              <div className="w-8 h-8 bg-[#1A1A1A] text-[#FDFCF8] flex items-center justify-center text-xs font-bold font-serif">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-[#1A1A1A] leading-none truncate max-w-[130px]">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-[#1A1A1A]/60 truncate max-w-[130px] font-mono mt-0.5">
                  {currentUser.email}
                </p>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-[#1A1A1A]/50 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden lg:flex items-center space-x-1.5 text-[10px] uppercase tracking-widest text-[#1A1A1A]/50 pl-2">
              <Lock className="w-3 h-3 text-[#BC9C22]" />
              <span>Encrypted Storage</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
