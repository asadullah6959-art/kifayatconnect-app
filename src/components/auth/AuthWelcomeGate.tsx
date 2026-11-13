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
  Lock
} from 'lucide-react';
import { INSTALLED_APP_VERSION } from '../../services/githubReleases';

interface AuthWelcomeGateProps {
  onOpenRegisterModal: () => void;
}

export const AuthWelcomeGate: React.FC<AuthWelcomeGateProps> = ({ onOpenRegisterModal }) => {
  const {
    loginWithGoogleAuth,
    requestOTP,
    verifyOTP,
    language,
    toggleLanguage,
    isOnline,
    githubRelease,
    latestPublishedUpdate
  } = useApp();

  const [authTab, setAuthTab] = useState<'GOOGLE' | 'OTP'>('GOOGLE');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

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
    if (otpCode.trim().length !== 6) {
      setOtpError('Please enter the complete 6-digit verification code.');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await verifyOTP(otpEmail.trim(), otpCode.trim());
      if (res.success) {
        setOtpSuccess(res.message);
      } else {
        setOtpError(res.message);
      }
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-[100vh] min-h-[100dvh] w-full max-w-full overflow-x-hidden overflow-y-auto bg-[#071122] text-white flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold font-serif text-base shadow-md">
            KC
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block leading-none">
              {language === 'ur' ? 'کفایت کنیکٹ' : 'Kifayat Connect'}
            </span>
            <span className="text-[10px] text-amber-400 font-medium">
              {language === 'ur' ? 'ویلفیئر و گورننس پورٹل' : 'Governance & Welfare Portal'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          <Languages className="w-3.5 h-3.5 text-amber-400" />
          <span>{language === 'en' ? 'اردو' : 'English'}</span>
        </button>
      </div>

      {/* Main Sign-In Card */}
      <div className="w-full max-w-md mx-auto my-6 bg-[#0a192f] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-600" />

        <div className="p-5 sm:p-6 space-y-5">
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
              <Lock className="w-3 h-3" />
              <span>Secure Member & Governance Access</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {language === 'ur' ? 'خوش آمدید — سائن ان کریں' : 'Sign in to Kifayat Connect'}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verified digital ledger, transparent welfare contributions, and role-scoped district governance.
            </p>
          </div>

          {!isOnline && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>You are currently offline. Live sign-in requires an internet connection.</span>
            </div>
          )}

          {/* Method Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setAuthTab('GOOGLE')}
              className={`py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                authTab === 'GOOGLE'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Google Sign-In</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthTab('OTP')}
              className={`py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                authTab === 'OTP'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email OTP</span>
            </button>
          </div>

          {authTab === 'GOOGLE' ? (
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
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                Super Admin and appointed District/Finance officers receive backend-verified permissions automatically upon Google sign-in.
              </p>
            </div>
          ) : (
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
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-amber-400 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={otpCooldown > 0 || otpLoading || !isOnline}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {otpLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{otpCooldown > 0 ? `Resend Code in ${otpCooldown}s` : 'Send 6-Digit Email OTP'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Enter 6-Digit Verification Code
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
                      className="w-full text-center tracking-[0.5em] text-lg font-mono px-3 py-2.5 bg-slate-950 border border-amber-500/50 rounded-xl text-amber-400 focus:border-amber-400 outline-none font-bold"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode('');
                      }}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      Change Email
                    </button>
                    <button
                      type="button"
                      disabled={otpCooldown > 0 || otpLoading}
                      onClick={handleRequestOTP}
                      className="text-amber-400 hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend Code'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {otpLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Verify & Sign In</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* New Member Application */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400">New to Kifayat Connect?</span>
            <button
              type="button"
              onClick={onOpenRegisterModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs border border-slate-700 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Apply for Membership</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Version & APK Status */}
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-semibold hover:bg-amber-500/25 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Android APK ({resolvedTag})</span>
              </a>
            );
          }

          return (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>v{INSTALLED_APP_VERSION} — Latest Version Installed</span>
            </span>
          );
        })()}
      </div>
    </div>
  );
};
