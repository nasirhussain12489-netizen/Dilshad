import React, { useState } from 'react';
import { Lock, Mail, X, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { syncAdminSessionToFirestore } from '../lib/firebase.ts';
import { normalizeFetchError } from '../lib/error.ts';
import { AdminUser } from '../types.ts';
import { IlmLogo } from './IlmLogo.tsx';

async function readApiResponse(res: Response): Promise<any> {
  const raw = await res.text();

  let data: any;

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = {
      error: `API returned non-JSON response (HTTP ${res.status}): ${raw.slice(0, 250)}`,
    };
  }

  if (data && typeof data.error !== 'string' && data.error) {
    data.error =
      data.error.message || JSON.stringify(data.error);
  }

  return data;
}

interface AdminLoginModalProps {
  onClose: () => void;
  onLoginSuccess: (token: string, user: AdminUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  onClose,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await readApiResponse(res);
      if (!res.ok) {
        throw new Error(data.error || 'Invalid Gmail or password.');
      }
      await syncAdminSessionToFirestore(data.user);
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(normalizeFetchError(err, 'Authentication failed.'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          currentPassword: password,
          newPassword,
        }),
      });
      const data = await readApiResponse(res);
      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed.');
      }
      setSuccessMsg(data.message || 'Password updated. You may now sign in.');
      setMode('login');
      setPassword(newPassword);
      setNewPassword('');
    } catch (err: any) {
      setError(normalizeFetchError(err, 'Password reset failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0B0D14] border border-[#D4AF37]/40 shadow-2xl overflow-hidden p-7 sm:p-9">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Gmail login"
          className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <IlmLogo size="sm" showSubtitle />
          <h3 className="font-display text-2xl font-bold text-white mt-5">
            {mode === 'login' ? 'Sign In with Gmail' : 'Change Password'}
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            {mode === 'login'
              ? 'Enter your registered Gmail address and password to open your dashboard.'
              : 'Verify your current password to set a new password.'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-red-950/60 border border-red-700/60 text-xs text-red-200">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-700/60 text-xs text-emerald-200">
            {successMsg}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Gmail Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your Gmail (e.g. example@gmail.com)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#12151F] border border-neutral-700 focus:border-[#D4AF37] focus:outline-none text-sm text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-neutral-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    setError(null);
                  }}
                  className="text-xs text-[#F3D068] hover:underline cursor-pointer"
                >
                  Change password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#12151F] border border-neutral-700 focus:border-[#D4AF37] focus:outline-none text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-[#C89D2E] via-[#E8C55B] to-[#C89D2E] hover:brightness-110 text-neutral-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Signing in...' : 'Login with Gmail & Password'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Gmail Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your Gmail address"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#12151F] border border-neutral-700 focus:border-[#D4AF37] focus:outline-none text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#12151F] border border-neutral-700 focus:border-[#D4AF37] focus:outline-none text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                New Password (min 8 characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#12151F] border border-neutral-700 focus:border-[#D4AF37] focus:outline-none text-sm text-white"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="flex-1 py-2.5 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-sm font-medium cursor-pointer"
              >
                Back to Login
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#D4AF37] hover:bg-[#e3be42] text-neutral-950 font-semibold text-sm cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

