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
  ArrowLeft,
  Share2,
  Smartphone,
  Copy
} from 'lucide-react';
import { INSTALLED_APP_VERSION } from '../../services/githubReleases';
import {
  clearPendingPasswordReset,
  getPendingPasswordReset,
  isNativeMobileRuntime,
  OTP_COOLDOWN_SECONDS,
  requestPasswordReset
} from '../../services/firebase';
import { AppLogo } from '../common/AppLogo';
import { translate } from '../../data/translations';
import { resolveIphoneLiveUrl, shareSKIForIphone } from '../../utils/iphoneShare';

interface AuthWelcomeGateProps {
  onOpenRegisterModal: () => void;
}

export const AuthWelcomeGate: React.FC<AuthWelcomeGateProps> = ({ onOpenRegisterModal }) => {
  const {
    loginWithGoogleAuth,
    loginWithPassword,
    setupPasswordForExistingAccount,
    completePasswordResetAndSignIn,
    language,
    toggleLanguage,
    isOnline,
    githubRelease,
    latestPublishedUpdate,
    appSettings
  } = useApp();

  const isNativeMobile = isNativeMobileRuntime();
  const [authTab, setAuthTab] = useState<'PASSWORD' | 'GOOGLE'>('PASSWORD');

  // Password Login state
  const [pwdEmail, setPwdEmail] = useState('');
  const [pwdValue, setPwdValue] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [needsDirectPwdSetup, setNeedsDirectPwdSetup] = useState(false);
  const [confirmSetupPwd, setConfirmSetupPwd] = useState('');

  // Google Auth state
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Forgot Password state (Real 6-Digit EmailJS OTP Only — NO on-screen codes)
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState(() => getPendingPasswordReset()?.email || '');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(() => {
    const pending = getPendingPasswordReset();
    if (!pending) return 0;
    return Math.max(0, Math.ceil((OTP_COOLDOWN_SECONDS * 1000 - (Date.now() - pending.lastSentAt)) / 1000));
  });
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [startupShareFeedback, setStartupShareFeedback] = useState<string | null>(null);

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
      if (needsDirectPwdSetup) {
        if (pwdValue.trim().length < 6) {
          setPwdError(language === 'ur' ? 'پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے۔' : 'Password must be at least 6 characters.');
          return;
        }
        if (pwdValue.trim() !== confirmSetupPwd.trim()) {
          setPwdError(language === 'ur' ? 'پاس ورڈ اور تصدیق یکساں نہیں ہیں۔' : 'Passwords do not match.');
          return;
        }
        const setupRes = await setupPasswordForExistingAccount(pwdEmail, pwdValue);
        if (setupRes.success) {
          setNeedsDirectPwdSetup(false);
          setConfirmSetupPwd('');
        } else {
          setPwdError(setupRes.message);
        }
        return;
      }

      const res = await loginWithPassword(pwdEmail, pwdValue);
      if (!res.success) {
        if (res.needsPasswordSetup && res.existingAccountFound) {
          setNeedsDirectPwdSetup(true);
          setPwdError('');
        } else {
          setPwdError(res.message);
        }
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

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    setResetLoading(true);
    try {
      const res = await requestPasswordReset(resetEmail.trim());
      if (res.success) {
        setResetSent(true);
        setResetCooldown(res.cooldownSeconds || OTP_COOLDOWN_SECONDS);
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
      setResetError('Please enter the 6-digit code sent to your Gmail/Email inbox.');
      return;
    }
    if (newPassword.trim().length < 6) {
      setResetError('New password must be at least 6 characters.');
      return;
    }
    setResetLoading(true);
    try {
      const targetEmail = getPendingPasswordReset()?.email || resetEmail.trim();
      const res = await completePasswordResetAndSignIn(targetEmail, cleanCode, newPassword.trim());
      if (res.success) {
        setResetSuccess(res.message);
        setIsForgotMode(false);
        setResetSent(false);
        setResetCode('');
        setNewPassword('');
      } else {
        setResetError(res.message);
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div
      className="ski-auth-screen relative min-h-[100vh] min-h-[100dvh] w-full max-w-full overflow-x-hidden overflow-y-auto text-[#102338] flex flex-col justify-between px-4 sm:px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
      style={{
        backgroundColor: '#E6F2FA',
        backgroundImage:
          'radial-gradient(circle at 50% 8%, rgba(255,255,255,0.96) 0%, rgba(203,227,245,0.88) 36%, rgba(250,246,238,0.96) 100%)'
      }}
    >
      {/* Subtle sky-and-champagne geometric watermark */}
      <div aria-hidden="true" className="fixed inset-0 kc-geo-watermark ski-geo-watermark pointer-events-none z-0" />

      {/* Top Bar */}
      <div className="relative z-10 w-full max-w-md mx-auto flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2.5">
          <AppLogo size="sm" halo />
          <div>
            <span className={`font-extrabold text-sm tracking-tight kc-gold-gradient-text block leading-none ${language === 'ur' ? 'kc-font-urdu' : ''}`}>
              {language === 'ur' ? (appSettings.appNameUr || 'سوئی خیل اتحاد') : (appSettings.appName || 'SUI KHEL ITTEHAD')}
            </span>
            <span className="text-[10px] text-[#059669] font-semibold">
              {translate(language, 'tagline', appSettings.textOverrides)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#E5E4E2] bg-[#0D2A1F] border border-slate-400/20 hover:bg-[#1E293B] rounded-xl transition-colors cursor-pointer kc-pressable"
        >
          <Languages className="w-3.5 h-3.5 text-[#059669]" />
          <span>{translate(language, 'languageToggle')}</span>
        </button>
      </div>

      {/* Frosted sky-and-ivory sign-in card */}
      <div className="relative z-10 w-full max-w-md mx-auto my-5 kc-obsidian-card rounded-2xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#102338] via-[#C8A45D] to-[#CBE3F5]" />

        <div className="p-5 sm:p-6 space-y-5">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <AppLogo size="md" animated halo />
            </div>
            <h1 className={`text-xl font-extrabold kc-gold-gradient-text tracking-tight ${language === 'ur' ? 'kc-font-urdu' : ''}`}>
              {translate(language, 'welcomeSignInTitle', appSettings.textOverrides)}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              {translate(language, 'welcomeSubtitle')}
            </p>
          </div>

          {!isOnline && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>{language === 'ur' ? 'آپ آف لائن ہیں۔ ری سیٹ ای میل بھیجنے کے لیے انٹرنیٹ درکار ہے۔' : 'You are currently offline. Internet connectivity is required for email verification.'}</span>
            </div>
          )}

          {isForgotMode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#E5E4E2] flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4" />
                  <span>{translate(language, 'resetPasswordTitle')}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    clearPendingPasswordReset();
                    setIsForgotMode(false);
                    setResetSent(false);
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
                      {language === 'ur' ? 'رجسٹرڈ ای میل، CNIC یا ممبر آئی ڈی' : 'Registered Email, CNIC, or Member ID'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="name@gmail.com / 00000-0000000-0"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#0A0D12] border border-[#E5E4E2]/30 rounded-xl text-xs text-white placeholder-slate-500 focus:border-[#E5E4E2] outline-none"
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
                  <div className="p-3 rounded-xl bg-[#0D2A1F] border border-[#059669]/35 text-[11px] text-[#059669] flex items-center gap-2">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span>
                      {language === 'ur'
                        ? 'اپنا جی میل/ای میل ان باکس (اور اسپام فولڈر) چیک کریں اور موصول ہونے والا 6 ہندسوں کا کوڈ درج کریں۔'
                        : 'Check your Gmail/Email Inbox (and Spam folder) and enter the 6-digit code sent to your email.'}
                    </span>
                  </div>
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
                      className="w-full text-center tracking-[0.5em] text-lg font-mono px-3 py-2.5 bg-[#0A0D12] border border-[#E5E4E2]/50 rounded-xl text-[#E5E4E2] outline-none font-bold"
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
                        className="w-full px-3 py-2.5 pe-9 bg-[#0A0D12] border border-[#E5E4E2]/30 rounded-xl text-xs text-white outline-none focus:border-[#E5E4E2]"
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
                      className="text-[#E5E4E2] hover:underline disabled:opacity-50 cursor-pointer"
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
              {/* Method Switcher (Web only shows Google option alongside Direct Password Login) */}
              {!isNativeMobile && (
                <div className="grid grid-cols-2 p-1 bg-[#0A0D12] rounded-xl border border-[#E5E4E2]/25 gap-1">
                  <button
                    type="button"
                    onClick={() => setAuthTab('PASSWORD')}
                    className={`py-2 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      authTab === 'PASSWORD' ? 'kc-gold-button' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{translate(language, 'tabPasswordLogin')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthTab('GOOGLE')}
                    className={`py-2 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      authTab === 'GOOGLE' ? 'kc-gold-button' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{language === 'ur' ? 'گوگل' : 'Google'}</span>
                  </button>
                </div>
              )}

              {(authTab === 'PASSWORD' || isNativeMobile) && (
                <form onSubmit={handlePasswordSubmit} className="space-y-3">
                  {needsDirectPwdSetup && (
                    <div className="p-3 rounded-xl bg-[#0D2A1F] border border-[#059669]/40 text-[#F8FAFC] text-xs space-y-1">
                      <div className="font-bold text-[#E5E4E2] flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>{translate(language, 'existingAccountSetPwdTitle')}</span>
                      </div>
                      <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                        {translate(language, 'existingAccountSetPwdDesc')}
                      </p>
                    </div>
                  )}

                  {pwdError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{pwdError}</span>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      {language === 'ur' ? 'ای میل، شناختی کارڈ (CNIC) یا ممبر آئی ڈی' : 'Email, CNIC, or Member ID'}
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      placeholder={language === 'ur' ? 'name@gmail.com یا 00000-0000000-0' : 'name@gmail.com / 00000-0000000-0'}
                      value={pwdEmail}
                      onChange={(e) => {
                        setPwdEmail(e.target.value);
                        if (needsDirectPwdSetup) setNeedsDirectPwdSetup(false);
                      }}
                      className="w-full px-3 py-2.5 bg-[#0A0D12] border border-[#E5E4E2]/30 rounded-xl text-xs text-white placeholder-slate-500 focus:border-[#E5E4E2] outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">
                        {needsDirectPwdSetup ? translate(language, 'newPasswordLabel') : translate(language, 'passwordLabel')}
                      </label>
                      {!needsDirectPwdSetup && (
                        <button
                          type="button"
                          onClick={() => {
                            setResetEmail(pwdEmail);
                            setResetSent(false);
                            setResetError('');
                            setResetSuccess('');
                            setIsForgotMode(true);
                          }}
                          className="text-[11px] text-[#E5E4E2] hover:underline font-semibold cursor-pointer"
                        >
                          {translate(language, 'forgotPasswordLink')}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPwd ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={pwdValue}
                        onChange={(e) => setPwdValue(e.target.value)}
                        className="w-full px-3 py-2.5 pe-9 bg-[#0A0D12] border border-[#E5E4E2]/30 rounded-xl text-xs text-white placeholder-slate-500 focus:border-[#E5E4E2] outline-none"
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

                  {needsDirectPwdSetup && (
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        {translate(language, 'confirmPasswordLabel')}
                      </label>
                      <input
                        type={showPwd ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={confirmSetupPwd}
                        onChange={(e) => setConfirmSetupPwd(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#0A0D12] border border-[#E5E4E2]/30 rounded-xl text-xs text-white placeholder-slate-500 focus:border-[#E5E4E2] outline-none"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={pwdLoading}
                    className="w-full py-2.5 px-4 kc-gold-button font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2"
                  >
                    {pwdLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>
                      {needsDirectPwdSetup
                        ? translate(language, 'setPasswordAndSignInBtn')
                        : translate(language, 'signInWithPasswordBtn')}
                    </span>
                  </button>

                  {needsDirectPwdSetup ? (
                    <button
                      type="button"
                      onClick={() => {
                        setNeedsDirectPwdSetup(false);
                        setConfirmSetupPwd('');
                        setPwdError('');
                      }}
                      className="w-full text-[11px] text-slate-400 hover:text-white text-center cursor-pointer"
                    >
                      {translate(language, 'cancel')}
                    </button>
                  ) : (
                    <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                      {translate(language, 'noPasswordYetNote')}
                    </p>
                  )}
                </form>
              )}

              {authTab === 'GOOGLE' && !isNativeMobile && (
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
                    className="w-full py-3 px-4 rounded-xl bg-[#0D2A1F] hover:bg-[#1A233A] text-white border border-[#E5E4E2]/45 hover:border-[#E5E4E2]/70 font-bold text-xs flex items-center justify-center gap-3 transition-colors shadow-lg shadow-black/40 kc-pressable cursor-pointer disabled:opacity-50"
                  >
                    {isGoogleLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#E5E4E2]" />
                        <span>{language === 'ur' ? 'تصدیق ہو رہی ہے...' : 'Authenticating...'}</span>
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
              )}

              {/* Persistent Session Notice */}
              <div className="px-3 py-2 rounded-xl bg-[#0F172A] border border-[#059669]/30 text-[10px] text-[#059669] text-center font-medium">
                {translate(language, 'rememberSessionBadge')}
              </div>

              {/* New Member Registration CTA */}
              <div className="pt-3 border-t border-slate-400/20 flex items-center justify-between gap-2">
                <span className="text-[11px] text-[#94A3B8]">
                  {language === 'ur' ? 'نئے ممبر ہیں؟' : 'New to SUI KHEL ITTEHAD?'}
                </span>
                <button
                  type="button"
                  onClick={onOpenRegisterModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D2A1F] hover:bg-[#1E293B] text-[#059669] hover:text-[#E5E4E2] font-bold text-xs border border-[#059669]/35 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{translate(language, 'registerBtn')}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Startup Share & Mobile Download Hub (Android APK + iPhone iOS Link) */}
      <div className="w-full max-w-md mx-auto pb-4 space-y-2.5">
        {(() => {
          const overrideUrl = latestPublishedUpdate?.isPublished && latestPublishedUpdate?.apkDownloadUrl
            ? latestPublishedUpdate.apkDownloadUrl
            : null;
          const resolvedApkUrl = overrideUrl || githubRelease?.apkUrl || null;
          const resolvedTag = overrideUrl && latestPublishedUpdate
            ? `v${latestPublishedUpdate.version.replace(/^v/i, '')}`
            : (githubRelease?.tagName || `v${INSTALLED_APP_VERSION}`);
          const iphoneUrl = resolveIphoneLiveUrl(appSettings?.webAppLiveUrl);

          const androidShareText = resolvedApkUrl
            ? `SUI KHEL ITTEHAD (سوئی خیل اتحاد) Android APK (${resolvedTag}) ڈاؤن لوڈ لنک:\n${resolvedApkUrl}`
            : `SUI KHEL ITTEHAD (سوئی خیل اتحاد) ایپ لنک:\n${iphoneUrl}`;
          const whatsappAndroidHref = `https://wa.me/?text=${encodeURIComponent(androidShareText)}`;

          const iosShareText =
            `SUI KHEL ITTEHAD (سوئی خیل اتحاد) — iPhone / Safari App Link:\n` +
            `iPhone Safari mein khol kar Share (↑) → "Add to Home Screen" dabayein:\n${iphoneUrl}`;
          const whatsappIosHref = `https://wa.me/?text=${encodeURIComponent(iosShareText)}`;

          return (
            <div className="kc-obsidian-card rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-extrabold text-[#E5E4E2] flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#059669]" />
                  <span>{language === 'ur' ? 'موبائل ایپ ڈاؤن لوڈ اور شیئر' : 'Download & Share Mobile App'}</span>
                </span>
                <span className="font-mono text-[10px] text-emerald-400 font-bold">{resolvedTag}</span>
              </div>

              {startupShareFeedback && (
                <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/35 text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{startupShareFeedback}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Android APK Download + WhatsApp Share */}
                <div className="flex items-stretch gap-1.5">
                  {resolvedApkUrl ? (
                    <a
                      href={resolvedApkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl kc-gold-button text-[11px] font-extrabold"
                    >
                      <Download className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{language === 'ur' ? 'Android APK ڈاؤن لوڈ' : 'Android APK'}</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        await shareSKIForIphone(appSettings?.webAppLiveUrl);
                        setStartupShareFeedback(
                          language === 'ur'
                            ? 'ایپ لنک کاپی ہو گیا!'
                            : 'App link copied for Android / Web!'
                        );
                        setTimeout(() => setStartupShareFeedback(null), 3500);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl kc-gold-button text-[11px] font-extrabold cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{language === 'ur' ? 'Android لنک' : 'Android App'}</span>
                    </button>
                  )}
                  <a
                    href={whatsappAndroidHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={language === 'ur' ? 'واٹس ایپ پر اینڈرائیڈ لنک شیئر کریں' : 'Share Android APK on WhatsApp'}
                    className="px-2.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-400/45 text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1 shrink-0"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WA</span>
                  </a>
                </div>

                {/* iPhone iOS Link + WhatsApp Share */}
                <div className="flex items-stretch gap-1.5">
                  <button
                    type="button"
                    onClick={async () => {
                      await shareSKIForIphone(appSettings?.webAppLiveUrl);
                      setStartupShareFeedback(
                        language === 'ur'
                          ? 'آئی فون Safari لنک کاپی ہو گیا! واٹس ایپ پر بھیجیں۔'
                          : 'iPhone link copied! Send on WhatsApp to iPhone users.'
                      );
                      setTimeout(() => setStartupShareFeedback(null), 4000);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#0D2A1F] hover:bg-[#1E293B] border border-[#059669]/50 text-[#059669] text-[11px] font-extrabold cursor-pointer kc-pressable"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#E5E4E2] shrink-0" />
                    <span className="truncate">{language === 'ur' ? 'iPhone لنک کاپی' : 'iPhone (iOS) Link'}</span>
                  </button>
                  <a
                    href={whatsappIosHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={language === 'ur' ? 'واٹس ایپ پر آئی فون لنک شیئر کریں' : 'Share iPhone Link on WhatsApp'}
                    className="px-2.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-400/45 text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1 shrink-0"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WA</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
