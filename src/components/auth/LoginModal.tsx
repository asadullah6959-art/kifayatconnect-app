import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  KeyRound,
  Mail,
  Smartphone,
  ArrowRight
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSwitchToRegister }) => {
  const { 
    users, 
    switchUser, 
    loginWithGoogleAuth, 
    requestOTP,
    verifyOTP,
    language 
  } = useApp();

  const [activeAuthMethod, setActiveAuthMethod] = useState<'OTP' | 'GOOGLE' | 'SIMULATION'>('OTP');
  
  // Google Sign-In states
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googleSuccess, setGoogleSuccess] = useState<string | null>(null);

  // Email OTP states
  const [otpEmail, setOtpEmail] = useState('asadullah6959@gmail.com');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [otpPreviewCode, setOtpPreviewCode] = useState('');

  // Role Simulation state
  const [selectedRole, setSelectedRole] = useState<UserRole>('SUPER_ADMIN');
  const [password, setPassword] = useState('••••••••');

  // Cooldown timer effect
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  if (!isOpen) return null;

  const handleRequestOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');

    if (!otpEmail.trim() || !otpEmail.includes('@')) {
      setOtpError('Please enter a valid email address.');
      return;
    }

    const res = requestOTP(otpEmail.trim());
    if (res.success) {
      setOtpSent(true);
      setOtpCooldown(res.cooldownSeconds || 60);
      setOtpSuccess(res.message);
      if (res.previewCode) {
        setOtpPreviewCode(res.previewCode);
      }
    } else {
      setOtpError(res.message);
      if (res.cooldownSeconds) setOtpCooldown(res.cooldownSeconds);
    }
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setOtpError('Please enter the full 6-digit verification code.');
      return;
    }

    const res = verifyOTP(otpEmail.trim(), otpCode.trim());
    if (res.success) {
      setOtpSuccess(res.message);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setOtpError(res.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setGoogleError(null);
    setGoogleSuccess(null);

    try {
      const verifiedUser = await loginWithGoogleAuth();
      if (verifiedUser.role === 'SUPER_ADMIN') {
        setGoogleSuccess(`Identity Verified! Welcome Super Admin (${verifiedUser.email})`);
      } else {
        setGoogleSuccess(`Signed in as ${verifiedUser.name} (${verifiedUser.role})`);
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setGoogleError('Sign-in cancelled: The Google popup window was closed.');
      } else {
        setGoogleError(err.message || 'Google authentication failed. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRoleLogin = () => {
    const targetUser = users.find(u => u.role === selectedRole);
    if (targetUser) {
      switchUser(targetUser.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-xs text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20">
              KC
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Authentication & Sign-In Gate
              </h3>
              <p className="text-[11px] text-slate-400">
                Kifayat Connect Secure Verification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Method Navigation Tabs */}
        <div className="flex items-center p-1 bg-slate-950 rounded-xl mt-4 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveAuthMethod('OTP')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeAuthMethod === 'OTP'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email OTP</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAuthMethod('GOOGLE')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeAuthMethod === 'GOOGLE'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Google Auth</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAuthMethod('SIMULATION')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeAuthMethod === 'SIMULATION'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Role Switcher</span>
          </button>
        </div>

        {/* TAB 1: 6-Digit Email OTP Verification */}
        {activeAuthMethod === 'OTP' && (
          <div className="mt-4 space-y-4">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Enter your email address to receive a secure random <strong>6-digit OTP</strong> (5-minute expiration, 60s cooldown, attempt-throttled).
            </p>

            {otpError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            {otpSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{otpSuccess}</span>
              </div>
            )}

            {!otpSent ? (
              <form onSubmit={handleRequestOTP} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="e.g. asadullah6959@gmail.com"
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-amber-400 outline-none"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <span className="text-[10px] text-amber-400/90 block mt-1">
                    Super Admin email: <strong className="font-mono">asadullah6959@gmail.com</strong>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={otpCooldown > 0}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {otpCooldown > 0 ? `Resend Code in ${otpCooldown}s` : 'Send 6-Digit Email OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Enter 6-Digit Code
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Sent to: <strong className="text-white">{otpEmail}</strong>
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-widest text-lg font-mono px-3 py-2 bg-slate-950 border border-amber-500/50 rounded-xl text-amber-400 focus:border-amber-400 outline-none font-bold"
                  />
                  {otpPreviewCode && (
                    <div className="mt-1.5 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center">
                      <span className="text-[10px] text-slate-400">Local Testing Code: </span>
                      <strong className="text-amber-400 font-mono text-xs">{otpPreviewCode}</strong>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                    }}
                    className="flex-1 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Change Email
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Verify & Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: Google Sign-In */}
        {activeAuthMethod === 'GOOGLE' && (
          <div className="mt-4 space-y-4">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Direct Firebase authentication via Google Sign-In. Super Admin access requires backend email verification against <strong>asadullah6959@gmail.com</strong>.
            </p>

            {googleError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{googleError}</span>
              </div>
            )}

            {googleSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{googleSuccess}</span>
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full py-3 px-4 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-sm"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Connecting with Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* TAB 3: Role Simulation */}
        {activeAuthMethod === 'SIMULATION' && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Select Persona / Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-white outline-none"
              >
                <option value="SUPER_ADMIN">Super Admin (Asadullah - HQ)</option>
                <option value="FINANCE_OFFICER">Finance Officer (Tariq Mahmood - Central Treasury)</option>
                <option value="ADMIN">District Admin (Muhammad Usman - Lahore District)</option>
                <option value="CO_ADMIN">State Co-Admin (Bilal Tariq - Punjab Province)</option>
                <option value="MEMBER">Member (Ayesha Bibi - KC-MEM-001)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Security Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white outline-none"
                />
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              onClick={handleRoleLogin}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Simulate Role Sign-In
            </button>
          </div>
        )}

        {/* Footer switch to register */}
        <div className="mt-5 pt-3 border-t border-slate-800 text-center">
          <p className="text-slate-400 text-xs">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchToRegister();
              }}
              className="text-amber-400 hover:underline font-semibold cursor-pointer"
            >
              Apply for Membership
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
