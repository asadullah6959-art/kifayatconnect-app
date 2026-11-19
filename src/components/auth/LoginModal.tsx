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
  clearPendingPasswordReset,
  getPendingPasswordReset,
  isNativeMobileRuntime,
  OTP_COOLDOWN_SECONDS,
  requestPasswordReset
} from '../../services/firebase';
import { AppLogo } from '../common/AppLogo';
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
    setupPasswordForExistingAccount,
    completePasswordResetAndSignIn,
    isOnline,
    language,
    appSettings
  } = useApp();

  const isNativeMobile = isNativeMobileRuntime();
  const [activeAuthMethod, setActiveAuthMethod] = useState<'PASSWORD' | 'GOOGLE'>('PASSWORD');

  // Password login
  const [pwdEmail, setPwdEmail] = useState('');
  const [pwdValue, setPwdValue] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [needsDirectPwdSetup, setNeedsDirectPwdSetup] = useState(false);
  const [confirmSetupPwd, setConfirmSetupPwd] = useState('');

  // Google login
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googleSuccess, setGoogleSuccess] = useState<string | null>(null);

  // Forgot Password / Account Recovery State (Real 6-Digit EmailJS OTP Only — NO on-screen codes)
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState(() => getPendingPasswordReset()?.email || '');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(() => {
    const pending = getPendingPasswordReset();
    if (!pending) return 0;
    return Math.max(0, Math.ceil((OTP_COOLDOWN_SECONDS * 1000 - (Date.now() - pending.lastSentAt)) / 1000));
  });
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

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
          onClose();
        } else {
          setPwdError(setupRes.message);
        }
        return;
      }

      const res = await loginWithPassword(pwdEmail, pwdValue);
      if (res.success) {
        setNeedsDirectPwdSetup(false);
        onClose();
      } else {
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
    setGoogleSuccess(null);

    try {
      const verifiedUser = await loginWithGoogleAuth();
      setGoogleSuccess(`Signed in as ${verifiedUser.name}`);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setGoogleError('Sign-in popup was closed before completing authentication.');
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

    if (!resetEmail.trim()) {
      setResetError('Please enter your registered email address or CNIC.');
      return;
    }

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
        setIsForgotPasswordMode(false);
        setResetSent(false);
        setResetCode('');
        setNewPassword('');
        onClose();
      } else {
        setResetError(res.message);
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] kc-modal-backdrop flex items-start sm:items-center justify-center bg-[#0A0D12]/90 overflow-y-auto">
      <div
        className="relative w-full max-w-md kc-modal-panel bg-[#111622] border border-[#D4AF37]/35 rounded-2xl shadow-2xl p-5 sm:p-6 pb-24 sm:pb-6 my-auto overflow-y-auto text-xs text-white"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2.5 pb-4 border-b border-[#D4AF37]/20">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className="shrink-0">
              <AppLogo size="sm" halo />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-extrabold kc-gold-gradient-text break-words whitespace-normal leading-snug">
                {translate(language, 'welcomeSignInTitle', appSettings.textOverrides)}
              </h3>
              <p className="text-[11px] text-slate-400 break-words whitespace-normal leading-snug mt-0.5">
                {translate(language, 'tagline', appSettings.textOverrides)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={language === 'ur' ? 'بند کریں' : 'Close'}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl bg-[#090D16] border border-[#D4AF37]/30 text-slate-300 hover:text-white hover:bg-[#161D2C] transition-colors cursor-pointer shrink-0 kc-pressable"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Tabs (Web only shows Google alongside Direct Password Login) */}
        {!isForgotPasswordMode && !isNativeMobile && (
          <div className="grid grid-cols-2 p-1 bg-[#0A0D12] rounded-xl mt-4 border border-[#D4AF37]/25 gap-1">
            <button
              type="button"
              onClick={() => setActiveAuthMethod('PASSWORD')}
              className={`py-2 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeAuthMethod === 'PASSWORD' ? 'kc-gold-button' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{translate(language, 'tabPasswordLogin')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAuthMethod('GOOGLE')}
              className={`py-2 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeAuthMethod === 'GOOGLE' ? 'kc-gold-button' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'گوگل' : 'Google'}</span>
            </button>
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
                  clearPendingPasswordReset();
                  setIsForgotPasswordMode(false);
                  setResetSent(false);
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
                    {language === 'ur' ? 'رجسٹرڈ ای میل، CNIC یا ممبر آئی ڈی' : 'Registered Email, CNIC, or Member ID'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="name@gmail.com / 00000-0000000-0"
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
                <div className="p-3 rounded-xl bg-[#131C31] border border-[#38BDF8]/35 text-[11px] text-[#38BDF8] flex items-center gap-2">
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
            {(activeAuthMethod === 'PASSWORD' || isNativeMobile) && (
              <form onSubmit={handlePasswordSignIn} className="mt-4 space-y-3">
                {needsDirectPwdSetup && (
                  <div className="p-3 rounded-xl bg-[#131C31] border border-[#38BDF8]/40 text-[#F8FAFC] text-xs space-y-1">
                    <div className="font-bold text-[#F5D061] flex items-center gap-1.5">
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
                    className="w-full px-3 py-2.5 bg-[#0A0D12] border border-[#D4AF37]/30 rounded-xl text-xs text-white placeholder-slate-500 focus:border-[#F5D061] outline-none"
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
                          setIsForgotPasswordMode(true);
                        }}
                        className="text-[11px] text-[#F5D061] hover:underline font-medium cursor-pointer"
                      >
                        {translate(language, 'forgotPasswordLink')}
                      </button>
                    )}
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
                      className="w-full px-3 py-2.5 bg-[#0A0D12] border border-[#D4AF37]/30 rounded-xl text-xs text-white placeholder-slate-500 focus:border-[#F5D061] outline-none"
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

                {needsDirectPwdSetup && (
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
                )}
              </form>
            )}

            {activeAuthMethod === 'GOOGLE' && !isNativeMobile && (
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
                  className="w-full py-3 px-4 rounded-xl bg-[#141B2D] hover:bg-[#1A233A] text-white border border-[#D4AF37]/45 hover:border-[#F5D061]/70 font-bold text-xs flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-lg shadow-black/40 kc-pressable disabled:opacity-50"
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#F5D061]" />
                      <span>{language === 'ur' ? 'رابطہ ہو رہا ہے...' : 'Connecting...'}</span>
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
