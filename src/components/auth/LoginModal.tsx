import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Mail,
  KeyRound,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import {
  clearPendingEmailOTP,
  clearPendingPasswordReset,
  getPendingEmailOTP,
  getPendingPasswordReset,
  isNativeMobileRuntime,
  requestPasswordReset,
  verifyPasswordReset
} from '../../services/firebase';
import { BrandEmblem3D } from '../common/BrandEmblem3D';
import { translate } from '../../data/translations';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSwitchToRegister }) => {
  const { 
    loginWithGoogleAuth,
    loginWithPassword,
    requestOTP,
    verifyOTP,
    isOnline,
    language,
    appSettings
  } = useApp();

  const isNativeMobile = isNativeMobileRuntime();
  const allowPasswordLogin = appSettings.featureToggles?.allowPasswordLogin !== false;

  const [activeAuthMethod, setActiveAuthMethod] = useState<'PASSWORD' | 'OTP' | 'GOOGLE'>(() => {
    if (getPendingEmailOTP()) return 'OTP';
    return allowPasswordLogin ? 'PASSWORD' : 'OTP';
  });

  // Password login
  const [pwdEmail, setPwdEmail] = useState('');
  const [pwdValue, setPwdValue] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');

  // Google login
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googleSuccess, setGoogleSuccess] = useState<string | null>(null);

  // Email OTP
  const [otpEmail, setOtpEmail] = useState(() => getPendingEmailOTP()?.email || '');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(() => Boolean(getPendingEmailOTP()));
  const [otpCooldown, setOtpCooldown] = useState(() => {
    const pending = getPendingEmailOTP();
    if (!pending) return 0;
    return Math.max(0, Math.ceil((60000 - (Date.now() - pending.lastSentAt)) / 1000));
  });
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');

  // Forgot Password / Account Recovery State
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(() => Boolean(getPendingPasswordReset()));
  const [resetEmail, setResetEmail] = useState(() => getPendingPasswordReset()?.email || '');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetSent, setResetSent] = useState(() => Boolean(getPendingPasswordReset()));
  const [resetCooldown, setResetCooldown] = useState(() => {
    const pending = getPendingPasswordReset();
    if (!pending) return 0;
    return Math.max(0, Math.ceil((60000 - (Date.now() - pending.lastSentAt)) / 1000));
  });
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  useEffect(() => {
    const syncPendingAuthStates = () => {
      const pendingOtp = getPendingEmailOTP();
      if (pendingOtp) {
        setActiveAuthMethod('OTP');
        setOtpEmail(prev => prev || pendingOtp.email);
        setOtpSent(true);
        const cd = Math.max(0, Math.ceil((60000 - (Date.now() - pendingOtp.lastSentAt)) / 1000));
        setOtpCooldown(cd);
      }

      const pendingReset = getPendingPasswordReset();
      if (pendingReset) {
        setIsForgotPasswordMode(true);
        setResetEmail(prev => prev || pendingReset.email);
        setResetSent(true);
        const rcd = Math.max(0, Math.ceil((60000 - (Date.now() - pendingReset.lastSentAt)) / 1000));
        setResetCooldown(rcd);
      }
    };

    if (isOpen) syncPendingAuthStates();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') syncPendingAuthStates();
    };
    window.addEventListener('focus', syncPendingAuthStates);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', syncPendingAuthStates);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isOpen]);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setInterval(() => {
      setResetCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resetCooldown]);

  if (!isOpen) return null;

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdLoading(true);
    try {
      const res = await loginWithPassword(pwdEmail, pwdValue);
      if (res.success) {
        onClose();
      } else {
        setPwdError(res.message);
      }
    } finally {
      setPwdLoading(false);
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');

    if (!otpEmail.trim() || !otpEmail.includes('@')) {
      setOtpError('Please enter a valid email address.');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await requestOTP(otpEmail.trim());
      if (res.success) {
        setOtpSent(true);
        setOtpCooldown(res.cooldownSeconds || 60);
        setOtpSuccess(res.message);
      } else {
        setOtpError(res.message);
        if (res.cooldownSeconds) setOtpCooldown(res.cooldownSeconds);
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');

    const enteredOtp = otpCode.replace(/\D/g, '');
    const cleanEmail = (otpEmail || getPendingEmailOTP()?.email || '').trim().toLowerCase();

    if (enteredOtp.length !== 6) {
      setOtpError('Please enter the full 6-digit verification code.');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await verifyOTP(cleanEmail, enteredOtp);
      if (res.success) {
        setOtpSuccess(res.message);
        setTimeout(() => {
          onClose();
        }, 700);
      } else {
        setOtpError(res.message);
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setGoogleError(null);
    setGoogleSuccess(null);

    try {
      const verifiedUser = await loginWithGoogleAuth();
      setGoogleSuccess(`Signed in as ${verifiedUser.name}`);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setGoogleError('Sign-in cancelled: The Google popup window was closed.');
      } else {
        setGoogleError(err?.message || 'Google authentication failed. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setResetError('Please enter a valid registered email address.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await requestPasswordReset(resetEmail.trim());
      if (res.success) {
        setResetSent(true);
        setResetCooldown(res.cooldownSeconds || 60);
        setResetSuccess(res.message);
      } else {
        setResetError(res.message);
        if (res.cooldownSeconds) setResetCooldown(res.cooldownSeconds);
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    const cleanCode = resetCode.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setResetError('Please enter the 6-digit temporary reset code.');
      return;
    }

    if (newPassword.trim().length < 6) {
      setResetError('New password must be at least 6 characters.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await verifyPasswordReset(resetEmail.trim(), cleanCode, newPassword.trim());
      if (res.success) {
        setResetSuccess(res.message);
        setPwdEmail(resetEmail.trim());
        setTimeout(() => {
          setIsForgotPasswordMode(false);
          setResetSent(false);
          setResetCode('');
          setNewPassword('');
          setActiveAuthMethod('PASSWORD');
        }, 1100);
      } else {
        setResetError(res.message);
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0D12]/90 p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#111622] border border-[#D4AF37]/35 rounded-2xl shadow-2xl p-6 text-xs text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#D4AF37]/20">
          <div className="flex items-center gap-2.5">
            <BrandEmblem3D size="sm" />
            <div>
              <h3 className="text-base font-extrabold kc-gold-gradient-text">
                {translate(language, 'welcomeSignInTitle', appSettings.textOverrides)}
              </h3>
              <p className="text-[11px] text-slate-400">
                {translate(language, 'tagline', appSettings.textOverrides)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-[#161D2C] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Tabs */}
        {!isForgotPasswordMode && (
          <div className={`grid ${!isNativeMobile ? (allowPasswordLogin ? 'grid-cols-3' : 'grid-cols-2') : (allowPasswordLogin ? 'grid-cols-2' : 'grid-cols-1')} p-1 bg-[#0A0D12] rounded-xl mt-4 border border-[#D4AF37]/25 gap-1`}>
            {allowPasswordLogin && (
              <button
                type="button"
                onClick={() => setActiveAuthMethod('PASSWORD')}
                className={`py-2 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                  activeAuthMethod === 'PASSWORD' ? 'kc-gold-button' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{translate(language, 'tabPasswordLogin')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveAuthMethod('OTP')}
              className={`py-2 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                activeAuthMethod === 'OTP' ? 'kc-gold-button' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{translate(language, 'tabOtpLogin')}</span>
            </button>

            {!isNativeMobile && (
              <button
                type="button"
                onClick={() => setActiveAuthMethod('GOOGLE')}
                className={`py-2 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                  activeAuthMethod === 'GOOGLE' ? 'kc-gold-button' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Google</span>
              </button>
            )}
          </div>
        )}

        {/* FORGOT PASSWORD RECOVERY */}
        {isForgotPasswordMode ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#F5D061] font-bold text-xs">
                <KeyRound className="w-4 h-4" />
                <span>{translate(language, 'resetPasswordTitle')}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsForgotPasswordMode(false);
                  setResetError('');
                  setResetSuccess('');
                }}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{translate(language, 'backToSignIn')}</span>
              </button>
            </div>

            {resetError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            {!resetSent ? (
              <form onSubmit={handleRequestReset} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {translate(language, 'emailLabel')}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@gmail.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0A0D12] border border-[#D4AF37]/30 rounded-xl text-xs text-white placeholder-slate-500 focus:border-[#F5D061] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resetCooldown > 0 || resetLoading || !isOnline}
                  className="w-full py-2.5 px-4 kc-gold-button font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {resetLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{resetCooldown > 0 ? `${resetCooldown}s` : translate(language, 'sendResetCodeBtn')}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyReset} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {translate(language, 'otpCodeLabel')}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••••"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[0.5em] text-lg font-mono px-3 py-2 bg-[#0A0D12] border border-[#D4AF37]/50 rounded-xl text-[#F5D061] outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {translate(language, 'newPasswordLabel')}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 pe-9 bg-[#0A0D12] border border-[#D4AF37]/30 rounded-xl text-xs text-white focus:border-[#F5D061] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(v => !v)}
                      className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      clearPendingPasswordReset();
                      setResetSent(false);
                      setResetCode('');
                      setNewPassword('');
                    }}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    {translate(language, 'cancel')}
                  </button>
                  <button
                    type="button"
                    disabled={resetCooldown > 0 || resetLoading}
                    onClick={handleRequestReset}
                    className="text-[#F5D061] hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {resetCooldown > 0 ? `${resetCooldown}s` : translate(language, 'resendOtpBtn')}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-2.5 px-4 kc-gold-button font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2"
                >
                  {resetLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{translate(language, 'confirmResetBtn')}</span>
                </button>
              </form>
            )}
          </div>
        ) : (
          <>
            {activeAuthMethod === 'PASSWORD' && allowPasswordLogin && (
              <form onSubmit={handlePasswordSignIn} className="mt-4 space-y-3">
                {pwdError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{pwdError}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {translate(language, 'emailLabel')}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@gmail.com"
                    value={pwdEmail}
                    onChange={(e) => setPwdEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0A0D12] border border-[#D4AF37]/30 rounded-xl text-xs text-white placeholder-slate-500 focus:border-[#F5D061] outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      {translate(language, 'passwordLabel')}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(pwdEmail);
                        setIsForgotPasswordMode(true);
                      }}
                      className="text-[11px] text-[#F5D061] hover:underline font-medium cursor-pointer"
                    >
                      {translate(language, 'forgotPasswordLink')}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      required
                      value={pwdValue}
                      onChange={(e) => setPwdValue(e.target.value)}
                      className="w-full px-3 py-2.5 pe-9 bg-[#0A0D12] border border-[#D4AF37]/30 rounded-xl text-xs text-white focus:border-[#F5D061] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(v => !v)}
                      className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="w-full py-2.5 px-4 kc-gold-button font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2"
                >
                  {pwdLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{translate(language, 'signInWithPasswordBtn')}</span>
                </button>
              </form>
            )}

            {activeAuthMethod === 'GOOGLE' && (
              isNativeMobile ? (
                <div className="mt-4 p-4 rounded-xl bg-[#0A0D12] border border-[#D4AF37]/30 text-center space-y-3">
                  <p className="text-xs text-[#F5D061] font-semibold">
                    {translate(language, 'mobileGoogleNotice')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveAuthMethod('OTP')}
                    className="px-4 py-2 rounded-lg kc-gold-button font-bold text-xs cursor-pointer"
                  >
                    {translate(language, 'tabOtpLogin')}
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {googleError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{googleError}</span>
                    </div>
                  )}

                  {googleSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{googleSuccess}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading || !isOnline}
                    className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {isGoogleLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>{translate(language, 'continueGoogleBtn')}</span>
                      </>
                    )}
                  </button>
                </div>
              )
            )}

            {activeAuthMethod === 'OTP' && (
              <div className="mt-4 space-y-4">
                {otpError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}

                {otpSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{otpSuccess}</span>
                  </div>
                )}

                {!otpSent ? (
                  <form onSubmit={handleRequestOTP} className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        {translate(language, 'emailLabel')}
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="name@gmail.com"
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#0A0D12] border border-[#D4AF37]/30 rounded-xl text-xs text-white placeholder-slate-500 focus:border-[#F5D061] outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={otpCooldown > 0 || otpLoading || !isOnline}
                      className="w-full py-2.5 px-4 kc-gold-button font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {otpLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>{otpCooldown > 0 ? `${otpCooldown}s` : translate(language, 'sendOtpBtn')}</span>
                    </button>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(otpEmail);
                          setIsForgotPasswordMode(true);
                        }}
                        className="text-[11px] text-[#F5D061] hover:underline font-medium cursor-pointer"
                      >
                        {translate(language, 'forgotPasswordLink')}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-300">
                          {translate(language, 'otpCodeLabel')}
                        </label>
                        <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                          {otpEmail}
                        </span>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="••••••"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center tracking-[0.5em] text-lg font-mono px-3 py-2 bg-[#0A0D12] border border-[#D4AF37]/50 rounded-xl text-[#F5D061] focus:border-[#F5D061] outline-none font-bold"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          clearPendingEmailOTP();
                          setOtpSent(false);
                          setOtpCode('');
                        }}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        {translate(language, 'cancel')}
                      </button>
                      <button
                        type="button"
                        disabled={otpCooldown > 0 || otpLoading}
                        onClick={handleRequestOTP}
                        className="text-[#F5D061] hover:underline disabled:opacity-50 cursor-pointer"
                      >
                        {otpCooldown > 0 ? `${otpCooldown}s` : translate(language, 'resendOtpBtn')}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={otpLoading}
                      className="w-full py-2.5 px-4 kc-gold-button font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2"
                    >
                      {otpLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>{translate(language, 'verifySignInBtn')}</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </>
        )}

        <div className="mt-5 pt-3 border-t border-[#D4AF37]/20 text-center">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSwitchToRegister();
            }}
            className="text-[#F5D061] hover:underline font-semibold cursor-pointer text-xs"
          >
            {translate(language, 'registerBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};
