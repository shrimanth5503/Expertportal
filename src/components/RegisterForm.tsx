import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Briefcase,
  Layers,
  Clock,
  AlertCircle,
  Plus,
  X,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { DOMAIN_OPTIONS, getSeniorityLevel } from '../data/domains.ts';
import { RegisterPayload, AuthResponse } from '../types.ts';
import { safeFetchJson } from '../lib/api.ts';

interface RegisterFormProps {
  onRegisterSuccess: (response: AuthResponse) => void;
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onRegisterSuccess,
  onSwitchToLogin,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [selectedDomain, setSelectedDomain] = useState(DOMAIN_OPTIONS[0].name);
  const [customDomain, setCustomDomain] = useState('');
  const [isCustomDomain, setIsCustomDomain] = useState(false);

  const [skills, setSkills] = useState<string[]>([
    'React',
    'TypeScript',
    'Node.js',
    'PostgreSQL',
    'Python',
  ]);
  const [newSkillInput, setNewSkillInput] = useState('');

  const [yearsOfExperience, setYearsOfExperience] = useState<number>(4);
  const [bio, setBio] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentDomainObj = DOMAIN_OPTIONS.find((d) => d.name === selectedDomain);
  const seniority = getSeniorityLevel(yearsOfExperience);

  // Quick fill sample data for fast testing
  const fillSampleData = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setName(`Sarah Chen`);
    setEmail(`sarah.chen${randomSuffix}@example.com`);
    setPassword(`SecurePass123!`);
    setConfirmPassword(`SecurePass123!`);
    setSelectedDomain('AI & Machine Learning');
    setIsCustomDomain(false);
    setSkills(['Python', 'PyTorch', 'LLM Fine-Tuning', 'FastAPI', 'LangChain']);
    setYearsOfExperience(6);
    setBio('Senior AI engineer specializing in generative models and scalable LLM orchestration.');
    setErrorMsg(null);
  };

  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: 'Empty', color: 'bg-[#1A1A1A]/20', text: 'text-[#1A1A1A]/40' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { score, label: 'Basic', color: 'bg-rose-500', text: 'text-rose-600' };
    if (score <= 3) return { score, label: 'Moderate', color: 'bg-[#BC9C22]', text: 'text-[#8C7416]' };
    return { score, label: 'Cryptographically Strong', color: 'bg-[#1A1A1A]', text: 'text-[#1A1A1A]' };
  };

  const strength = getPasswordStrength();

  const handleAddSkill = (skillToAdd?: string) => {
    const rawInput = (skillToAdd || newSkillInput).trim();
    if (!rawInput) return;

    // Support comma-separated batch input (e.g. "React, Node.js, SQL")
    const newItems = rawInput
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const updated = [...skills];
    for (const item of newItems) {
      if (!updated.some((s) => s.toLowerCase() === item.toLowerCase())) {
        updated.push(item);
      }
    }

    setSkills(updated);
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleKeyDownSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Gather all skills, including anything currently typed in the input
    let finalSkills = [...skills];
    if (newSkillInput.trim()) {
      const pending = newSkillInput
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      for (const item of pending) {
        if (!finalSkills.some((s) => s.toLowerCase() === item.toLowerCase())) {
          finalSkills.push(item);
        }
      }
      setSkills(finalSkills);
      setNewSkillInput('');
    }

    // 2. Validate Fields
    if (!name.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('A valid email address is required.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }
    if (finalSkills.length === 0) {
      setErrorMsg('Please add at least one core skill.');
      return;
    }

    const domainFinal = isCustomDomain ? customDomain.trim() : selectedDomain;
    if (!domainFinal) {
      setErrorMsg('Domain expertise is required.');
      return;
    }

    setIsLoading(true);

    const payload: RegisterPayload = {
      name: name.trim(),
      email: email.trim(),
      password: password,
      domain_expertise: domainFinal,
      skills: finalSkills,
      years_of_experience: Math.max(0, Number(yearsOfExperience) || 0),
      bio: bio.trim(),
    };

    try {
      const result = await safeFetchJson<AuthResponse>('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!result.ok || !result.data?.success) {
        throw new Error(result.data?.message || result.errorText || 'Registration failed.');
      }

      onRegisterSuccess(result.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <header className="mb-6 flex justify-between items-end border-b border-[#1A1A1A]/10 pb-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-serif text-[#1A1A1A] tracking-tight">Register</h2>
          <p className="text-[11px] opacity-50 uppercase tracking-widest font-semibold mt-1">
            Create Profile & Encrypt Credentials
          </p>
        </div>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-xs font-bold border-b border-[#1A1A1A] pb-0.5 text-[#1A1A1A] hover:text-[#BC9C22] hover:border-[#BC9C22] transition-colors cursor-pointer"
        >
          Already a member? Sign in
        </button>
      </header>

      {/* Quick-Fill Sample Banner */}
      <div className="mb-6 p-3 bg-[#1A1A1A]/[0.03] border border-[#1A1A1A]/10 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-[#1A1A1A]/70">
          <Sparkles className="w-3.5 h-3.5 text-[#BC9C22]" />
          <span className="text-[11px] uppercase tracking-wider font-semibold">Want a quick test?</span>
        </div>
        <button
          type="button"
          onClick={fillSampleData}
          className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A] hover:text-[#BC9C22] border-b border-[#1A1A1A] hover:border-[#BC9C22] pb-0.5 transition-colors cursor-pointer"
        >
          Auto-fill Sample Profile (Sarah Chen)
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border-l-2 border-rose-600 text-rose-900 text-xs flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Notice:</span> {errorMsg}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold tracking-wider mb-1 text-[#1A1A1A]/60">
              1. Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Julian Thorne"
              className="bg-transparent border-b border-[#1A1A1A]/20 py-2 text-sm text-[#1A1A1A] focus:border-[#BC9C22] outline-none transition-colors placeholder:text-[#1A1A1A]/30"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold tracking-wider mb-1 text-[#1A1A1A]/60">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. julian@domain.com"
              className="bg-transparent border-b border-[#1A1A1A]/20 py-2 text-sm text-[#1A1A1A] focus:border-[#BC9C22] outline-none transition-colors placeholder:text-[#1A1A1A]/30"
            />
          </div>
        </div>

        {/* Row 2: Secure Password */}
        <div className="p-4 bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A]/70 flex items-center space-x-1.5">
              <Lock className="w-3 h-3 text-[#BC9C22]" />
              <span>Password (Encrypted via Bcrypt) *</span>
            </label>
            <span className="text-[9px] uppercase tracking-widest font-bold text-[#8C7416] bg-[#BC9C22]/15 px-2 py-0.5 border border-[#BC9C22]/30">
              10-Salt Rounds
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (!confirmPassword) {
                    setConfirmPassword(e.target.value);
                  }
                }}
                placeholder="Choose password (min 6 chars)"
                className="w-full bg-transparent border-b border-[#1A1A1A]/20 py-2 pr-8 text-sm text-[#1A1A1A] focus:border-[#BC9C22] outline-none transition-colors placeholder:text-[#1A1A1A]/30 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-2.5 text-[#1A1A1A]/40 hover:text-[#1A1A1A] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full bg-transparent border-b border-[#1A1A1A]/20 py-2 text-sm text-[#1A1A1A] focus:border-[#BC9C22] outline-none transition-colors placeholder:text-[#1A1A1A]/30 font-mono"
              />
            </div>
          </div>

          {password && (
            <div className="flex items-center justify-between text-[10px] text-[#1A1A1A]/60 pt-1">
              <span>Security Complexity: <strong className={strength.text}>{strength.label}</strong></span>
              <div className="w-24 bg-[#1A1A1A]/10 h-1 overflow-hidden">
                <div className={`h-full ${strength.color}`} style={{ width: `${(strength.score / 5) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Row 3: 2. Skill Set Input & Tag Cloud */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A]/60">
              2. Skill Set *
            </label>
            <span className="text-[10px] text-[#1A1A1A]/40">Type & press Add or Enter</span>
          </div>

          {/* Active Skills Chips */}
          <div className="flex flex-wrap gap-1.5 mb-2 py-1">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs bg-[#1A1A1A] text-[#FDFCF8] font-medium group transition-all"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-[#BC9C22] hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              onKeyDown={handleKeyDownSkill}
              placeholder="e.g. React, Node.js, Python, PostgreSQL..."
              className="flex-1 bg-transparent border-b border-[#1A1A1A]/20 py-2 text-sm text-[#1A1A1A] focus:border-[#BC9C22] outline-none transition-colors placeholder:text-[#1A1A1A]/30"
            />
            <button
              type="button"
              onClick={() => handleAddSkill()}
              className="px-3.5 py-1 bg-transparent border border-[#1A1A1A]/30 text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#FDFCF8] text-xs uppercase tracking-wider font-bold transition-colors cursor-pointer"
            >
              + Add
            </button>
          </div>

          {currentDomainObj && (
            <div className="mt-2 text-[10px] text-[#1A1A1A]/60">
              <span className="font-semibold uppercase tracking-wider">Quick Suggestions:</span>{' '}
              {currentDomainObj.suggestedSkills
                .filter((s) => !skills.includes(s))
                .slice(0, 5)
                .map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleAddSkill(s)}
                    className="inline-block mr-2 underline hover:text-[#BC9C22] cursor-pointer"
                  >
                    +{s}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Row 4: 3. Domain Expertise & 4. Years of Experience */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A]/60">
                3. Domain Expertise *
              </label>
              <button
                type="button"
                onClick={() => setIsCustomDomain(!isCustomDomain)}
                className="text-[10px] text-[#BC9C22] font-semibold hover:underline cursor-pointer"
              >
                {isCustomDomain ? 'Standard list' : '+ Custom domain'}
              </button>
            </div>

            {isCustomDomain ? (
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="e.g. BioEngineering, FinTech, Robotics"
                className="bg-transparent border-b border-[#1A1A1A]/20 py-2 text-sm text-[#1A1A1A] focus:border-[#BC9C22] outline-none transition-colors"
              />
            ) : (
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="bg-transparent border-b border-[#1A1A1A]/20 py-2 text-sm text-[#1A1A1A] focus:border-[#BC9C22] outline-none transition-colors appearance-none cursor-pointer"
              >
                {DOMAIN_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.name} className="bg-[#FDFCF8] text-[#1A1A1A]">
                    {opt.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A]/60">
                4. Years of Experience *
              </label>
              <span className="text-[10px] font-bold text-[#8C7416] uppercase tracking-wider">
                {seniority.badge}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="30"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                className="flex-1 accent-[#1A1A1A] cursor-pointer h-1.5 bg-[#1A1A1A]/20 rounded-none"
              />
              <div className="flex items-center border-b border-[#1A1A1A]/30">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(Math.max(0, Number(e.target.value) || 0))}
                  className="font-mono text-sm font-bold text-[#1A1A1A] w-10 text-right bg-transparent outline-none"
                />
                <span className="text-xs text-[#1A1A1A]/50 ml-0.5">y</span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 5: Bio (Optional) */}
        <div className="flex flex-col">
          <label className="text-[10px] uppercase font-bold tracking-wider mb-1 text-[#1A1A1A]/60">
            Professional Summary (Optional)
          </label>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Specialized focus, projects, architectural paradigms..."
            className="bg-transparent border-b border-[#1A1A1A]/20 py-2 text-xs text-[#1A1A1A] focus:border-[#BC9C22] outline-none transition-colors resize-none placeholder:text-[#1A1A1A]/30"
          />
        </div>

        {/* Submit Action */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="group flex items-center gap-4 bg-[#1A1A1A] text-[#FDFCF8] px-8 py-4 w-full justify-between hover:bg-[#BC9C22] hover:text-[#1A1A1A] transition-colors disabled:opacity-50 cursor-pointer shadow-md"
          >
            <span className="uppercase tracking-widest text-xs font-bold">
              {isLoading ? 'Encrypting with Bcrypt & Saving...' : 'Register Profile'}
            </span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </form>

      {/* Footer Security Assurance */}
      <footer className="mt-8 pt-4 border-t border-[#1A1A1A]/10 flex items-center gap-2.5 opacity-60">
        <ShieldCheck className="w-4 h-4 text-[#BC9C22]" />
        <p className="text-[10px] font-medium uppercase tracking-tight text-[#1A1A1A]">
          All credentials encrypted via Bcrypt & stored in Supabase / Sandbox DB
        </p>
      </footer>
    </div>
  );
};
