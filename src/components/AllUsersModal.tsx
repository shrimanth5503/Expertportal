import React, { useEffect, useState } from 'react';
import { Users, X, Mail, Search, RefreshCw } from 'lucide-react';
import { UserProfile } from '../types.ts';
import { getSeniorityLevel } from '../data/domains.ts';

interface AllUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AllUsersModal: React.FC<AllUsersModalProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users/all');
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.domain_expertise.toLowerCase().includes(q) ||
      u.skills?.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/70 backdrop-blur-xs">
      <div className="bg-[#FDFCF8] max-w-3xl w-full border border-[#1A1A1A] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-6 border-b border-[#1A1A1A]/15 flex items-center justify-between bg-[#1A1A1A] text-[#FDFCF8]">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 bg-[#BC9C22]/20 text-[#BC9C22] border border-[#BC9C22]/40 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-2xl font-serif tracking-tight text-[#FDFCF8]">Expert Network Directory</h3>
              <p className="text-[10px] uppercase tracking-widest text-[#BC9C22] font-semibold">
                {users.length} Registered Developer Profiles
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchUsers}
              disabled={isLoading}
              className="text-[#FDFCF8]/60 hover:text-white p-2 transition-colors"
              title="Refresh users"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-[#FDFCF8]/60 hover:text-white p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-8 py-4 border-b border-[#1A1A1A]/10 bg-[#FDFCF8]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#1A1A1A]/40 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, domain, or skill (e.g. Python, LLM)..."
              className="w-full bg-transparent pl-9 pr-4 py-2 border-b border-[#1A1A1A]/20 text-xs text-[#1A1A1A] focus:border-[#BC9C22] outline-none placeholder:text-[#1A1A1A]/30"
            />
          </div>
        </div>

        {/* User List */}
        <div className="p-8 overflow-y-auto space-y-4 divide-y divide-[#1A1A1A]/10">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-[#1A1A1A]/40 text-xs font-light">
              {isLoading ? 'Retrieving profiles from storage...' : 'No matching profiles found.'}
            </div>
          ) : (
            filtered.map((user) => {
              const sen = getSeniorityLevel(user.years_of_experience);
              return (
                <div key={user.id} className="pt-4 first:pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 bg-[#1A1A1A] text-[#FDFCF8] font-serif font-bold flex items-center justify-center text-base shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-base font-serif font-bold text-[#1A1A1A]">{user.name}</h4>
                          <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 bg-[#BC9C22]/15 text-[#8C7416]">
                            {user.years_of_experience}y exp • {sen.badge}
                          </span>
                        </div>
                        <p className="text-xs text-[#1A1A1A]/50 flex items-center space-x-1 font-mono mt-0.5">
                          <Mail className="w-3 h-3 text-[#1A1A1A]/40" />
                          <span>{user.email}</span>
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                        {user.domain_expertise}
                      </span>
                    </div>
                  </div>

                  {/* Skills tags */}
                  {user.skills && user.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3 pl-13.5">
                      {user.skills.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] px-2 py-0.5 bg-[#1A1A1A] text-[#FDFCF8] font-mono"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-[#1A1A1A]/[0.03] border-t border-[#1A1A1A]/15 flex justify-between items-center text-xs text-[#1A1A1A]/50 font-light">
          <span>Passwords securely hashed with Bcrypt before persistence</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1A1A1A] text-[#FDFCF8] text-xs uppercase tracking-widest font-bold hover:bg-[#BC9C22] hover:text-[#1A1A1A] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
