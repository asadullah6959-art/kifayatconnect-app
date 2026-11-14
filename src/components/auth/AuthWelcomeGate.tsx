import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Mail, 
  ShieldCheck, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  UserPlus, 
  Languages, 
  Download, 
  WifiOff,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft
} from 'lucide-react';
import { INSTALLED_APP_VERSION } from '../../services/githubReleases';
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

interface AuthWelcomeGateProps {
  onOpenRegisterModal: () => void;
}

export const AuthWelcomeGate: React.FC<AuthWelcomeGateProps> = ({ onOpenRegisterModal }) => {
  const {
    loginWithGoogleAuth,
    loginWithPassword,
    requestOTP,
    verifyOTP,
    language,
    toggleLanguage,
    isOnline,
    githubRelease,
    latestPublishedUpdate,
    appSettings
  } = useApp();

  const isNativeMobile = isNativeMobileRuntime();
  const allowPasswordLogin = appSettings.featureToggles?.allowPasswordLogin !== false;

  const [authTab, setAuthTab] = useState<'PASSWORD' | 'OTP' | 'GOOGLE'>(() => {
    if (getPendingEmailOTP()) return 'OTP';
    return allowPasswordLogin ? 'PASSWORD' : 'OTP';
  });

  // Password Login state
  const [pwdEmail, setPwdEmail] = useState('');
  const [pwdValue, setPwdValue] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');

  // Google Auth state
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Email OTP state
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

  // Forgot Password state
  const [isForgotMode, setIsForgotMode] = useState(() => Boolean(getPendingPasswordReset()));
  const [resetEmail, setResetEmail] = useState(() => getPendingPasswordReset()?.email || '');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [resetSent, setResetSent] = useState(() => Boolean(getPendingPasswordReset()));
  const [resetCooldown, setResetCooldown] = useState(() => {
    const pending = getPendingPasswordReset();
    if (!pending) return 0;
    return Math.max(0, Math.ceil((60000 - (Date.now() - pending.lastSentAt)) / 1000));
  });
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Automatically restore pending OTP when returning from Gmail/email app on mobile
  useEffect(() => {
    const syncPendingOtp = () => {
      const pending = getPendingEmailOTP();
      if (pending) {
        setAuthTab('OTP');
        setOtpEmail(prev => prev || pending.email);
        setOtpSent(true);
        const cd = Math.max(0, Math.ceil((60000 - (Date.now() - pending.lastSentAt)) / 1000));
        setOtpCooldown(cd);
      }
      const pendingReset = getPendingPasswordReset();
      if (pendingReset) {
        setIsForgotMode(true);
        setResetEmail(prev => prev || pendingReset.email);
        setResetSent(true);
        const rcd = Math.max(0, Math.ceil((60000 - (Date.now() - pendingReset.lastSentAt)) / 1000));
        setResetCooldown(rcd);
      }
    };

    syncPendingOtp();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') syncPendingOtp();
    };
    window.addEventListener('focus', syncPendingOtp);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', syncPendingOtp);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdLoading(true);
    try {
      const res = await loginWithPassword(pwdEmail, pwdValue);
      if (!res.success) {
        setPwdError(res.message);
      }
    } finally {
      setPwdLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setGoogleError(null);
    try {
      await loginWithGoogleAuth();
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setGoogleError('Sign-in popup was closed before completing authentication.');
      } else {
        setGoogleError(err?.message || 'Unable to sign in with Google right now.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');
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
      setOtpError('Please enter the complete 6-digit verification code.');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await verifyOTP(cleanEmail, enteredOtp);
      if (res.success) {
        setOtpSuccess(res.message);
      } else {
        setOtpError(res.message);
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
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
          setIsForgotMode(false);
          setResetSent(false);
          setResetCode('');
          setNewPassword('');
          setAuthTab('PASSWORD');
        }, 1200);
      } else {
        setResetError(res.message);
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-[100vh] min-h-[100dvh] w-full max-w-full overflow-x-hidden overflow-y-auto bg-[#0A0D12] text-white flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2.5">
          <BrandEmblem3D size="sm" />
          <div>
            <span className="font-extrabold text-sm tracking-tight kc-gold-gradient-text block leading-none">
              {language === 'ur' ? (appSettings.appNameUr || 'کفایت کنیکٹ') : (appSettings.appName || 'Kifayat Connect')}
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">
              {translate(language, 'tagline', appSettings.textOverrides)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#F5D061] bg-[#111622] border border-[#D4AF37]/35 hover:bg-[#161D2C] rounded-xl transition-colors cursor-pointer"
        >
          <Languages className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>{translate(language, 'languageToggle')}</span>
        </button>
      </div>

      {/* Main Luxury Obsidian Card */}
      <div className="w-full max-w-md mx-auto my-5 bg-[#111622] border border-[#D4AF37]/35 rounded-2xl shadow-[0_20px_55px_rgba(0,0,0,0.65)] overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#043927] via-[#D4AF37] to-[#F5D061]" />

        <div className="p-5 sm:p-6 space-y-5">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <BrandEmblem3D size="md" animated />
            </div>
            <h1 className="text-xl font-extrabold kc-gold-gradient-text tracking-tight">
              {translate(language, 'welcomeSignInTitle', appSettings.textOverrides)}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              {translate(language, 'welcomeSubtitle')}
            </p>
          </div>

          {!isOnline && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>{language === 'ur' ? 'آپ آف لائن ہیں۔ ای میل کوڈ بھیجنے کے لیے انٹرنیٹ درکار ہے۔' : 'You are currently offline. Live OTP dispatch requires internet connectivity.'}</span>
            </div>
          )}

          {isForgotMode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F5D061] flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4" />
                  <span>{translate(language, 'resetPasswordTitle')}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(false);
                    setResetError('');
                    setResetSuccess('');
                  }}
                  className="text-[11px] text-slate-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{translate(language, 'backToSignIn')}</span>
                </button>
              </div>

              {resetError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
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
                      className="w-full text-center tracking-[0.5em] text-lg font-mono px-3 py-2.5 bg-[#0A0D12] border border-[#D4AF37]/50 rounded-xl text-[#F5D061] outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      {translate(language, 'newPasswordLabel')}
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPwd ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2.5 pe-9 bg-[#0A0D12] border border-[#D4AF37]/30 rounded-xl text-xs text-white outline-none focus:border-[#F5D061]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPwd(v => !v)}
                        className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
              {/* Method Switcher */}
              <div className={`grid ${!isNativeMobile ? (allowPasswordLogin ? 'grid-cols-3' : 'grid-cols-2') : (allowPasswordLogin ? 'grid-cols-2' : 'grid-cols-1')} p-1 bg-[#0A0D12] rounded-xl border border-[#D4AF37]/25 gap-1`}>
                {allowPasswordLogin && (
                  <button
                    type="button"
                    onClick={() => setAuthTab('PASSWORD')}
                    className={`py-2 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                      authTab === 'PASSWORD' ? 'kc-gold-button' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{translate(language, 'tabPasswordLogin')}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setAuthTab('OTP')}
                  className={`py-2 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                    authTab === 'OTP' ? 'kc-gold-button' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{translate(language, 'tabOtpLogin')}</span>
                </button>

                {!isNativeMobile && (
                  <button
                    type="button"
                    onClick={() => setAuthTab('GOOGLE')}
                    className={`py-2 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                      authTab === 'GOOGLE' ? 'kc-gold-button' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Google</span>
                  </button>
                )}
              </div>

              {authTab === 'PASSWORD' && allowPasswordLogin && (
                <form onSubmit={handlePasswordSubmit} className="space-y-3">
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
                          setIsForgotMode(true);
                        }}
                        className="text-[11px] text-[#F5D061] hover:underline font-semibold cursor-pointer"
                      >
                        {translate(language, 'forgotPasswordLink')}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPwd ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={pwdValue}
                        onChange={(e) => setPwdValue(e.target.value)}
                        className="w-full px-3 py-2.5 pe-9 bg-[#0A0D12] border border-[#D4AF37]/30 rounded-xl text-xs text-white placeholder-slate-500 focus:border-[#F5D061] outline-none"
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

                  <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                    {translate(language, 'noPasswordYetNote')}
                  </p>
                </form>
              )}

              {authTab === 'GOOGLE' && (
                isNativeMobile ? (
                  <div className="p-4 rounded-xl bg-[#0A0D12] border border-[#D4AF37]/30 text-center space-y-3">
                    <p className="text-xs text-[#F5D061] font-semibold">
                      {translate(language, 'mobileGoogleNotice')}
                    </p>
                    <button
                      type="button"
                      onClick={() => setAuthTab('OTP')}
                      className="px-4 py-2 rounded-lg kc-gold-button font-bold text-xs cursor-pointer"
                    >
                      {translate(language, 'tabOtpLogin')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {googleError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{googleError}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isGoogleLoading || !isOnline}
                      className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs flex items-center justify-center gap-3 transition-colors shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isGoogleLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                          <span>Authenticating...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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

              {authTab === 'OTP' && (
                <div className="space-y-3">
                  {otpError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{otpError}</span>
                    </div>
                  )}

                  {otpSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
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
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOTP} className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-300">
                            {translate(language, 'otpCodeLabel')}
                          </label>
                          <span className="text-[10px] text-slate-400 truncate max-w-[160px]">
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
                          className="w-full text-center tracking-[0.5em] text-lg font-mono px-3 py-2.5 bg-[#0A0D12] border border-[#D4AF37]/50 rounded-xl text-[#F5D061] focus:border-[#F5D061] outline-none font-bold"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[11px]">
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

              {/* Persistent Session Notice */}
              <div className="px-3 py-2 rounded-xl bg-[#043927]/35 border border-emerald-500/25 text-[10px] text-emerald-300 text-center font-medium">
                {translate(language, 'rememberSessionBadge')}
              </div>

              {/* New Member Registration CTA */}
              <div className="pt-3 border-t border-[#D4AF37]/20 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  {language === 'ur' ? 'نئے ممبر ہیں؟' : 'New to Kifayat Connect?'}
                </span>
                <button
                  type="button"
                  onClick={onOpenRegisterModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#043927] hover:bg-[#065F46] text-[#F5D061] font-bold text-xs border border-[#D4AF37]/35 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{translate(language, 'registerBtn')}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer Version & APK Auto-Sync Status */}
      <div className="w-full max-w-md mx-auto text-center space-y-2 pb-2">
        {(() => {
          const overrideUrl = latestPublishedUpdate?.isPublished && latestPublishedUpdate?.apkDownloadUrl
            ? latestPublishedUpdate.apkDownloadUrl
            : null;
          const resolvedApkUrl = overrideUrl || githubRelease?.apkUrl || null;
          const resolvedTag = overrideUrl && latestPublishedUpdate
            ? `v${latestPublishedUpdate.version.replace(/^v/i, '')}`
            : (githubRelease?.tagName || `v${INSTALLED_APP_VERSION}`);

          if (resolvedApkUrl) {
            return (
              <a
                href={resolvedApkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#F5D061] text-[11px] font-semibold hover:bg-[#D4AF37]/25 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{translate(language, 'downloadApkBtn')} ({resolvedTag})</span>
              </a>
            );
          }

          return (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>v{INSTALLED_APP_VERSION} — {translate(language, 'latestVersionInstalled')}</span>
            </span>
          );
        })()}
      </div>
    </div>
  );
};
