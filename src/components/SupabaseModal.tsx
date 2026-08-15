import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  X,
  RefreshCw,
  Play,
  ArrowRight,
} from 'lucide-react';
import { DbStatusResponse } from '../types.ts';
import { safeFetchJson } from '../lib/api.ts';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbStatus: DbStatusResponse | null;
  onRefresh: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  dbStatus,
  onRefresh,
}) => {
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = () => {
    if (dbStatus?.schemaScript) {
      navigator.clipboard.writeText(dbStatus.schemaScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleVerifyTable = async () => {
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const result = await safeFetchJson<{ success: boolean; tableExists?: boolean; message?: string }>(
        '/api/db/init-table',
        { method: 'POST' }
      );
      if (result.ok && result.data) {
        setVerifyResult({
          success: Boolean(result.data.tableExists || result.data.success),
          message: result.data.message || (result.data.tableExists ? 'Table verified!' : 'Table not found yet.'),
        });
      } else {
        setVerifyResult({
          success: false,
          message: result.errorText || 'Verification request failed.',
        });
      }
      onRefresh();
    } catch (err: any) {
      setVerifyResult({
        success: false,
        message: 'Could not verify table: ' + err.message,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const sqlUrl = dbStatus?.sqlEditorUrl || 'https://supabase.com/dashboard';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/75 backdrop-blur-xs">
      <div className="bg-[#FDFCF8] max-w-2xl w-full border border-[#1A1A1A] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-8 py-6 border-b border-[#1A1A1A]/15 flex items-center justify-between bg-[#1A1A1A] text-[#FDFCF8]">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 bg-[#BC9C22]/20 text-[#BC9C22] border border-[#BC9C22]/40 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-2xl font-serif tracking-tight text-[#FDFCF8]">Supabase Table Setup</h3>
              <p className="text-[10px] uppercase tracking-widest text-[#BC9C22] font-semibold">
                PostgreSQL Storage & Bcrypt Hash Layer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#FDFCF8]/60 hover:text-white p-2 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto space-y-6">
          {/* Status Indicator */}
          <div
            className={`p-5 border flex items-start space-x-3.5 ${
              dbStatus?.tableExists
                ? 'bg-[#1A1A1A] border-[#BC9C22] text-[#FDFCF8]'
                : 'bg-amber-50/90 border-amber-400 text-[#1A1A1A]'
            }`}
          >
            {dbStatus?.tableExists ? (
              <CheckCircle2 className="w-5 h-5 text-[#BC9C22] mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            )}
            <div className="text-sm">
              <p className="font-serif text-base font-bold">
                {dbStatus?.tableExists
                  ? 'Supabase Table "public.users" is Active & Storing Data'
                  : 'Action Required: Create "public.users" Table in Supabase'}
              </p>
              <p className="mt-1 text-xs opacity-85 leading-relaxed font-light">
                {dbStatus?.tableExists
                  ? 'Registered profiles and Bcrypt password hashes are actively persisted into your Supabase PostgreSQL cloud database.'
                  : 'Your Supabase credentials are connected, but PostgreSQL requires the "users" table to be created first so PostgREST can store user registrations.'}
              </p>
            </div>
          </div>

          {verifyResult && (
            <div
              className={`p-4 border text-xs flex items-center space-x-2 ${
                verifyResult.success
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                  : 'bg-amber-50 border-amber-500 text-amber-900'
              }`}
            >
              {verifyResult.success ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>{verifyResult.message}</span>
            </div>
          )}

          {/* 3 Step Quick Setup Guide if table is missing */}
          {!dbStatus?.tableExists && (
            <div className="border border-[#1A1A1A]/15 p-6 bg-[#1A1A1A]/[0.03] space-y-4">
              <h4 className="text-xs uppercase tracking-widest font-bold text-[#1A1A1A] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1A1A1A] text-[#FDFCF8] text-[10px] flex items-center justify-center font-mono">
                  1
                </span>
                <span>Follow 3 Simple Steps to Enable Supabase Cloud Storage:</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* Step 1 */}
                <div className="p-3 bg-[#FDFCF8] border border-[#1A1A1A]/15 flex flex-col justify-between">
                  <div className="text-xs">
                    <strong className="block text-[11px] uppercase tracking-wider text-[#1A1A1A] mb-1">
                      Step 1: Copy SQL
                    </strong>
                    <p className="text-[11px] text-[#1A1A1A]/70 leading-normal">
                      Copy the pre-configured SQL table creation script.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="mt-3 w-full py-1.5 bg-[#1A1A1A] text-[#FDFCF8] hover:bg-[#BC9C22] hover:text-[#1A1A1A] text-[10px] uppercase tracking-wider font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
                  </button>
                </div>

                {/* Step 2 */}
                <div className="p-3 bg-[#FDFCF8] border border-[#1A1A1A]/15 flex flex-col justify-between">
                  <div className="text-xs">
                    <strong className="block text-[11px] uppercase tracking-wider text-[#1A1A1A] mb-1">
                      Step 2: Paste & Run
                    </strong>
                    <p className="text-[11px] text-[#1A1A1A]/70 leading-normal">
                      Open Supabase SQL Editor, paste the code, and click <strong>RUN</strong>.
                    </p>
                  </div>
                  <a
                    href={sqlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 w-full py-1.5 bg-[#BC9C22] text-[#1A1A1A] hover:bg-[#8C7416] hover:text-white text-[10px] uppercase tracking-wider font-bold transition-colors text-center inline-flex items-center justify-center gap-1"
                  >
                    <span>Open Supabase SQL</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Step 3 */}
                <div className="p-3 bg-[#FDFCF8] border border-[#1A1A1A]/15 flex flex-col justify-between">
                  <div className="text-xs">
                    <strong className="block text-[11px] uppercase tracking-wider text-[#1A1A1A] mb-1">
                      Step 3: Verify
                    </strong>
                    <p className="text-[11px] text-[#1A1A1A]/70 leading-normal">
                      Click below to check that Supabase recognizes the new table.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyTable}
                    disabled={isVerifying}
                    className="mt-3 w-full py-1.5 border border-[#1A1A1A] bg-transparent text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#FDFCF8] text-[10px] uppercase tracking-wider font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
                    <span>{isVerifying ? 'Verifying...' : 'Verify Table Now'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SQL Schema Script Box */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/70 flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-[#BC9C22]" />
                <span>Supabase SQL Table Schema (`public.users`)</span>
              </label>
              <button
                type="button"
                onClick={copyToClipboard}
                className="text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A] hover:text-[#BC9C22] border-b border-[#1A1A1A] hover:border-[#BC9C22] pb-0.5 transition-colors cursor-pointer"
              >
                {copied ? '✓ Copied SQL to Clipboard' : 'Copy SQL Script'}
              </button>
            </div>
            <div className="relative">
              <pre className="bg-[#1A1A1A] text-[#FDFCF8] p-5 text-xs font-mono overflow-x-auto border border-[#333] leading-relaxed max-h-52 select-all">
                <code>{dbStatus?.schemaScript}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-[#1A1A1A]/[0.03] border-t border-[#1A1A1A]/15 flex justify-between items-center">
          <button
            type="button"
            onClick={handleVerifyTable}
            disabled={isVerifying}
            className="text-xs uppercase tracking-wider font-bold text-[#1A1A1A] hover:text-[#BC9C22] flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>Re-check Supabase Status</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-xs uppercase tracking-widest font-bold text-[#FDFCF8] bg-[#1A1A1A] hover:bg-[#BC9C22] hover:text-[#1A1A1A] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
