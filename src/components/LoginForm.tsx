import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { LoginPayload, AuthResponse } from '../types.ts';

interface LoginFormProps {
  onLoginSuccess: (response: AuthResponse) => void;
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  onSwitchToRegister,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fillDemoAccount = () => {
    setEmail('alex.rivera@example.com');
    setPassword('DemoSecure123!');
    setErrorMsg(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);

    const payload: LoginPayload = {
      email: email.trim(),
      password,
    };

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: AuthResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed. Please verify credentials.');
      }

      onLoginSuccess(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to authenticate.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <header className="mb-8 flex justify-between items-end border-b border-[#1A1A1A]/10 pb-4">
        <div>
          <h2 className="text-4xl font-serif text-[#1A1A1A] tracking-tight">Access Portal</h2>
          <p className="text-xs opacity-50 uppercase tracking-widest font-semibold mt-1">
            Authenticate Identity
          </p>
        </div>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-xs font-bold border-b border-[#1A1A1A] pb-0.5 text-[#1A1A1A] hover:text-[#BC9C22] hover:border-[#BC9C22] transition-colors"
        >
          New user? Register
        </button>
      </header>

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50/80 border-l-2 border-rose-600 text-rose-900 text-xs flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Error:</span> {errorMsg}
          </div>
        </div>
      )}

      {/* Demo Credentials Quick-Fill Banner */}
      <div className="mb-6 p-3 bg-[#1A1A1A]/[0.03] border border-[#1A1A1A]/10 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-[#1A1A1A]/70">
          <Sparkles className="w-3.5 h-3.5 text-[#BC9C22]" />
          <span className="text-[11px] uppercase tracking-wider font-semibold">Testing mode?</span>
        </div>
        <button
          type="button"
          onClick={fillDemoAccount}
          className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A] hover:text-[#BC9C22] border-b border-[#1A1A1A] hover:border-[#BC9C22] pb-0.5 transition-colors"
        >
          Auto-fill Sample User (Alex Rivera)
        </button>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        {/* Email Input */}
        <div className="flex flex-col">
          <label className="text-[10px] uppercase font-bold tracking-wider mb-1 text-[#1A1A1A]/60">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex.rivera@example.com"
            className="bg-transparent border-b border-[#1A1A1A]/20 py-2.5 text-sm text-[#1A1A1A] focus:border-[#BC9C22] outline-none transition-colors placeholder:text-[#1A1A1A]/30"
          />
        </div>

        {/* Password Input */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A]/60">
              Encrypted Password
            </label>
            <span className="text-[9px] uppercase tracking-widest font-bold text-[#8C7416]">
              Bcrypt Hash Verification
            </span>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-transparent border-b border-[#1A1A1A]/20 py-2.5 pr-8 text-sm text-[#1A1A1A] focus:border-[#BC9C22] outline-none transition-colors placeholder:text-[#1A1A1A]/30 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-3 text-[#1A1A1A]/40 hover:text-[#1A1A1A]"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="group flex items-center gap-4 bg-[#1A1A1A] text-[#FDFCF8] px-8 py-4 w-full justify-between hover:bg-[#BC9C22] hover:text-[#1A1A1A] transition-colors disabled:opacity-50 cursor-pointer shadow-md"
          >
            <span className="uppercase tracking-widest text-xs font-bold">
              {isLoading ? 'Verifying Hash...' : 'Sign In to Portal'}
            </span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </form>

      {/* Footer */}
      <footer className="mt-8 pt-4 border-t border-[#1A1A1A]/10 flex items-center gap-2.5 opacity-60">
        <ShieldCheck className="w-4 h-4 text-[#BC9C22]" />
        <p className="text-[10px] font-medium uppercase tracking-tight text-[#1A1A1A]">
          Zero plaintext password persistence guarantee
        </p>
      </footer>
    </div>
  );
};
