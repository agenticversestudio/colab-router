import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Key, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const AuthGate: React.FC = () => {
  // Pre-fill from saved local storage if previously remembered
  const getInitialCreds = () => {
    try {
      const saved = localStorage.getItem('agentic_studio_auth');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          user: parsed.userId || '',
          pass: parsed.passkey || '',
          remember: true
        };
      }
    } catch {
      // ignore
    }
    return { user: '', pass: '', remember: true };
  };

  const initial = getInitialCreds();
  const [userId, setUserId] = useState(initial.user);
  const [passkey, setPasskey] = useState(initial.pass);
  const [rememberMe, setRememberMe] = useState(initial.remember);
  const [showPass, setShowPass] = useState(false);
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const login = useAuthStore(s => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const ok = await login(userId, passkey, customBaseUrl || undefined, rememberMe);
      if (!ok) {
        setError('Invalid Sovereign User ID or Master Passkey.');
      }
    } catch {
      setError('Connection refused or gateway unreachable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080C14]/95 backdrop-blur-xl p-4 selection:bg-blue-500/30">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0E1424] p-8 shadow-2xl shadow-black/80 transition-all">
        {/* Brand Shield Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-inner">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Agentic Studio</h2>
          <p className="mt-1 text-xs text-slate-400">
            Sovereign Command & Control AI Workstation
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User ID Field */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Sovereign User ID
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                placeholder="Enter Sovereign User ID"
                required
                className="w-full rounded-xl border border-white/10 bg-[#161F36] py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Passkey Field */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Master Passkey
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Key className="h-4 w-4" />
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                value={passkey}
                onChange={e => setPasskey(e.target.value)}
                placeholder="••••••••••••"
                required
                autoFocus
                className="w-full rounded-xl border border-white/10 bg-[#161F36] py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Save Info / Remember Credentials Section */}
          <div className="rounded-xl border border-white/10 bg-[#141C30]/80 p-3 transition hover:border-white/20">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="remember-credentials"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-[#0E1424] text-blue-600 focus:ring-blue-500/50 cursor-pointer accent-blue-500"
                />
                <div>
                  <div className="text-xs font-medium text-slate-200">Save Info on this Device</div>
                  <div className="text-[10px] text-slate-400">Remember session across browser reloads</div>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                Local Only
              </span>
            </label>
          </div>

          {/* Advanced Ingress Config Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[11px] text-blue-400 hover:underline"
            >
              {showAdvanced ? 'Hide Ingress Endpoint' : 'Configure Custom Cloud Ingress'}
            </button>
            {showAdvanced && (
              <div className="mt-2 rounded-xl border border-white/5 bg-black/30 p-3">
                <label className="mb-1 block text-[11px] text-slate-400">
                  Target Ngrok / Gateway URL
                </label>
                <input
                  type="url"
                  value={customBaseUrl}
                  onChange={e => setCustomBaseUrl(e.target.value)}
                  placeholder="https://your-domain.ngrok-free.dev or http://localhost:8000"
                  className="w-full rounded-lg border border-white/10 bg-[#161F36] px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50"
          >
            <Lock className="h-4 w-4" />
            <span>{isSubmitting ? 'Authenticating...' : 'Unlock Workstation'}</span>
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 border-t border-white/5 pt-4 text-[11px] text-slate-500">
          <span>Client-Encrypted Session</span>
          <span>•</span>
          <span>Zero Server Storage</span>
        </div>
      </div>
    </div>
  );
};
