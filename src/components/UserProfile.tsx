import React, { useState } from 'react';
import {
  Mail,
  Briefcase,
  Layers,
  Clock,
  ShieldCheck,
  Edit3,
  Check,
  X,
  Database,
  FileCode2,
  Lock,
  ArrowUpRight,
} from 'lucide-react';
import { UserProfile as UserProfileType, DbStatusResponse } from '../types.ts';
import { DOMAIN_OPTIONS, getSeniorityLevel } from '../data/domains.ts';

interface UserProfileProps {
  user: UserProfileType;
  storageType?: 'supabase' | 'sandbox';
  dbStatus: DbStatusResponse | null;
  onUpdateUser: (updated: UserProfileType) => void;
  onOpenDbModal: () => void;
  onOpenAllUsersModal: () => void;
  onLogout: () => void;
}

export const UserProfileView: React.FC<UserProfileProps> = ({
  user,
  storageType = 'sandbox',
  dbStatus,
  onUpdateUser,
  onOpenDbModal,
  onOpenAllUsersModal,
  onLogout,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editDomain, setEditDomain] = useState(user.domain_expertise);
  const [editSkills, setEditSkills] = useState<string[]>(user.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [editYears, setEditYears] = useState(user.years_of_experience);
  const [editBio, setEditBio] = useState(user.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const seniority = getSeniorityLevel(user.years_of_experience);

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (!editSkills.some((s) => s.toLowerCase() === newSkill.trim().toLowerCase())) {
      setEditSkills([...editSkills, newSkill.trim()]);
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skill: string) => {
    setEditSkills(editSkills.filter((s) => s !== skill));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSaving(true);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          domain_expertise: editDomain,
          skills: editSkills,
          years_of_experience: editYears,
          bio: editBio,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update profile.');
      }

      onUpdateUser(data.user);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Toast */}
      {saveSuccess && (
        <div className="p-4 bg-[#1A1A1A] text-[#FDFCF8] border-l-4 border-[#BC9C22] text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-[#BC9C22]" />
            <span className="font-bold uppercase tracking-wider">Profile updated successfully</span>
          </div>
          <button onClick={() => setSaveSuccess(false)} className="text-[#BC9C22] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Profile Editorial Card */}
      <div className="bg-[#1A1A1A] text-[#FDFCF8] border border-[#333] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#BC9C22] opacity-10 rounded-bl-full pointer-events-none" />

        <div className="p-8 sm:p-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#333]">
          <div>
            <p className="text-[#BC9C22] uppercase tracking-[0.3em] text-[10px] font-bold mb-3">
              Developer Dossier
            </p>
            <h1 className="text-4xl sm:text-5xl font-serif italic leading-tight text-[#FDFCF8]">
              {user.name}
            </h1>
            <p className="text-xs text-[#FDFCF8]/60 flex items-center space-x-2 mt-2 font-mono">
              <Mail className="w-3.5 h-3.5 text-[#BC9C22]" />
              <span>{user.email}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-transparent hover:bg-[#BC9C22] text-[#FDFCF8] hover:text-[#1A1A1A] border border-[#BC9C22] text-xs uppercase tracking-widest font-bold transition-colors"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Dossier'}
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-transparent hover:bg-[#333] text-[#FDFCF8]/60 hover:text-white border border-[#333] text-xs uppercase tracking-widest font-bold transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* 3 Metrics Block */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#333] bg-[#1A1A1A]/80">
          <div className="p-6">
            <span className="text-[9px] uppercase tracking-widest text-[#BC9C22] font-bold block mb-1">
              Domain Expertise
            </span>
            <p className="text-sm font-bold text-[#FDFCF8]">{user.domain_expertise}</p>
          </div>

          <div className="p-6">
            <span className="text-[9px] uppercase tracking-widest text-[#BC9C22] font-bold block mb-1">
              Experience & Seniority
            </span>
            <p className="text-sm font-bold text-[#FDFCF8]">
              {user.years_of_experience} {user.years_of_experience === 1 ? 'Year' : 'Years'} • {seniority.badge}
            </p>
          </div>

          <div className="p-6">
            <span className="text-[9px] uppercase tracking-widest text-[#BC9C22] font-bold block mb-1">
              Storage Engine
            </span>
            <button
              onClick={onOpenDbModal}
              className="text-sm font-bold text-[#FDFCF8] hover:text-[#BC9C22] flex items-center space-x-1 transition-colors"
            >
              <span>{storageType === 'supabase' ? 'Supabase Table' : 'Sandbox DB'}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#BC9C22]" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Drawer/Form */}
      {isEditing && (
        <div className="bg-[#FDFCF8] border border-[#1A1A1A] p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#1A1A1A]/15 pb-4">
            <h3 className="text-2xl font-serif text-[#1A1A1A]">Update Profile Information</h3>
            <button onClick={() => setIsEditing(false)} className="text-[#1A1A1A]/50 hover:text-[#1A1A1A]">
              <X className="w-5 h-5" />
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border-l-2 border-rose-600 text-rose-800 text-xs">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="text-[10px] uppercase font-bold tracking-wider mb-1 text-[#1A1A1A]/60">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-transparent border-b border-[#1A1A1A]/30 py-2 text-sm text-[#1A1A1A] focus:border-[#BC9C22] outline-none"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] uppercase font-bold tracking-wider mb-1 text-[#1A1A1A]/60">
                  Domain Expertise
                </label>
                <select
                  value={editDomain}
                  onChange={(e) => setEditDomain(e.target.value)}
                  className="bg-transparent border-b border-[#1A1A1A]/30 py-2 text-sm text-[#1A1A1A] focus:border-[#BC9C22] outline-none"
                >
                  {DOMAIN_OPTIONS.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A]/60">
                  Years of Experience
                </label>
                <span className="text-xs font-mono font-bold">{editYears} years</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={editYears}
                onChange={(e) => setEditYears(Number(e.target.value))}
                className="accent-[#1A1A1A] cursor-pointer h-1.5 bg-[#1A1A1A]/20"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-bold tracking-wider mb-2 text-[#1A1A1A]/60">
                Skills Inventory
              </label>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {editSkills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs bg-[#1A1A1A] text-[#FDFCF8]"
                  >
                    <span>{s}</span>
                    <button type="button" onClick={() => handleRemoveSkill(s)} className="text-[#BC9C22]">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  placeholder="Add skill (e.g. PyTorch, Kubernetes)..."
                  className="flex-1 bg-transparent border-b border-[#1A1A1A]/30 py-1.5 text-xs text-[#1A1A1A] focus:border-[#BC9C22] outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-3 py-1 bg-transparent border border-[#1A1A1A] text-[#1A1A1A] text-xs font-bold uppercase tracking-wider"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-bold tracking-wider mb-1 text-[#1A1A1A]/60">
                Professional Bio / Summary
              </label>
              <textarea
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="bg-transparent border-b border-[#1A1A1A]/30 py-2 text-xs text-[#1A1A1A] focus:border-[#BC9C22] outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-[#1A1A1A]/30 text-xs font-bold uppercase tracking-wider text-[#1A1A1A]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-[#1A1A1A] hover:bg-[#BC9C22] text-[#FDFCF8] hover:text-[#1A1A1A] text-xs font-bold uppercase tracking-widest transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid: Skills Inventory & Cryptographic Security Guarantee */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Skills & Bio (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Skills Cloud */}
          <div className="bg-[#FDFCF8] border border-[#1A1A1A]/15 p-8 shadow-xs">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#1A1A1A]/10">
              <h3 className="text-2xl font-serif text-[#1A1A1A]">Registered Skills & Tech Stack</h3>
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#8C7416]">
                {user.skills?.length || 0} Technologies
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {user.skills && user.skills.length > 0 ? (
                user.skills.map((skill) => (
                  <div
                    key={skill}
                    className="px-3.5 py-2 bg-[#1A1A1A] text-[#FDFCF8] text-xs font-medium tracking-wide flex items-center space-x-2 border border-[#1A1A1A]"
                  >
                    <span className="w-1.5 h-1.5 bg-[#BC9C22]" />
                    <span>{skill}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#1A1A1A]/40 italic">No skills registered.</p>
              )}
            </div>
          </div>

          {/* Professional Bio */}
          <div className="bg-[#FDFCF8] border border-[#1A1A1A]/15 p-8 shadow-xs">
            <h3 className="text-2xl font-serif text-[#1A1A1A] mb-4 pb-3 border-b border-[#1A1A1A]/10">
              Professional Biography
            </h3>
            {user.bio ? (
              <p className="text-sm text-[#1A1A1A]/80 leading-relaxed font-light">
                {user.bio}
              </p>
            ) : (
              <p className="text-xs text-[#1A1A1A]/40 italic">No biography provided yet.</p>
            )}
          </div>
        </div>

        {/* Right: Security & Database Details (1 col) */}
        <div className="space-y-8">
          {/* Bcrypt Cryptographic Audit Card */}
          <div className="bg-[#1A1A1A] text-[#FDFCF8] p-8 border border-[#333] relative">
            <div className="flex items-center space-x-2 text-[#BC9C22] text-[10px] font-bold uppercase tracking-[0.25em] mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span>Security Audit</span>
            </div>

            <h4 className="text-2xl font-serif italic mb-2">Bcrypt Hash Verification</h4>
            <p className="text-xs text-[#FDFCF8]/60 leading-relaxed mb-6 font-light">
              Your password was processed through 10 rounds of cryptographic salt computation. The raw password is never logged or stored.
            </p>

            <div className="space-y-3 pt-4 border-t border-[#333] text-[11px] font-mono">
              <div className="flex justify-between text-[#FDFCF8]/60">
                <span>Algorithm:</span>
                <span className="text-[#FDFCF8] font-bold">Bcrypt $2a$</span>
              </div>
              <div className="flex justify-between text-[#FDFCF8]/60">
                <span>Rounds:</span>
                <span className="text-[#BC9C22] font-bold">10 Salt Rounds</span>
              </div>
              <div className="flex justify-between text-[#FDFCF8]/60">
                <span>Plaintext Leak:</span>
                <span className="text-[#BC9C22] font-bold">0% (Guaranteed)</span>
              </div>
            </div>
          </div>

          {/* Directory & Actions */}
          <div className="bg-[#FDFCF8] border border-[#1A1A1A]/15 p-6 space-y-4">
            <h4 className="text-xs uppercase tracking-widest font-bold text-[#1A1A1A]">
              Explore Network
            </h4>
            <p className="text-xs text-[#1A1A1A]/60 leading-relaxed">
              View all developers, domain specialists, and engineers registered in this portal.
            </p>
            <button
              onClick={onOpenAllUsersModal}
              className="w-full py-3 bg-transparent hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-[#FDFCF8] border border-[#1A1A1A] text-xs uppercase tracking-widest font-bold transition-colors"
            >
              Open Developer Directory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
