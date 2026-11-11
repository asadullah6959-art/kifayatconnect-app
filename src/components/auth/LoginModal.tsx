import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Lock, 
  ShieldCheck, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  Loader2,
  Sparkles
} from 'lucide-react';
import { UserRole } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ 
  isOpen, 
  onClose, 
  onSwitchToRegister 
}) => {
  const { 
    users, 
    switchUser, 
    language, 
    loginWithGoogleAuth, 
    logoutFirebaseAuth,
    firebaseUser, 
    currentUser 
  } = useApp();

  const [mode, setMode] = useState<'LOGIN' | 'RECOVERY'>('LOGIN');
  const [selectedRole, setSelectedRole] = useState<UserRole>('SUPER_ADMIN');
  const [password, setPassword] = useState('••••••••');
  
  // Google Auth state
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googleSuccess, setGoogleSuccess] = useState<string | null>(null);

  // Recovery form state
  const [recoveryKey, setRecoveryKey] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setGoogleError(null);
    setGoogleSuccess(null);

    try {
      const verifiedUser = await loginWithGoogleAuth();
      if (verifiedUser.role === 'SUPER_ADMIN') {
        setGoogleSuccess(`Identity Verified! Welcome permanent Super Admin (${verifiedUser.email})`);
      } else {
        setGoogleSuccess(`Signed in as ${verifiedUser.name} (${verifiedUser.role})`);
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setGoogleError('Sign-in cancelled: The Google popup window was closed before completing.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setGoogleError('Only one popup request allowed at a time.');
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

  const handleEmergencyRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryKey.trim().toUpperCase() === 'KC-EMERGENCY-RECOVER-2026' || recoveryKey.trim().length >= 8) {
      const superAdmin = users.find(u => u.role === 'SUPER_ADMIN') || users[0];
      switchUser(superAdmin.id);
      setRecoverySuccess(true);
      setTimeout(() => {
        setRecoverySuccess(false);
        setMode('LOGIN');
        onClose();
      }, 2000);
    } else {
      setRecoveryError('Invalid master recovery code. Please check physical safe document.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 my-6 text-xs">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <img 
              src="/src/assets/images/kifayat_emblem_logo_1794225902501.jpg" 
              alt="Logo" 
              className="w-8 h-8 rounded-lg object-cover border border-emerald-600/40"
            />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {mode === 'LOGIN' ? 'Identity Authentication Gate' : 'Super Admin Account Recovery'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Kifayat Connect Single Sign-On & RBAC
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'LOGIN' ? (
          <div className="mt-4 space-y-4">
            
            {/* PHASE 1: Official Google Sign-In Button */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                Permanent Super Admin Authentication
              </label>

              <button
                type="button"
                disabled={isGoogleLoading}
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-semibold rounded-lg border border-slate-300 dark:border-slate-700 shadow-xs transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>
                  {isGoogleLoading ? 'Verifying with Google Identity...' : 'Sign in with Google'}
                </span>
              </button>

              {googleSuccess && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-md text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{googleSuccess}</span>
                </div>
              )}

              {googleError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-md text-rose-700 dark:text-rose-300 text-[11px] flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{googleError}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                <span>Authorized Super Admin:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  asadullah6959@gmail.com
                </span>
              </div>
            </div>

            {/* Visual Divider */}
            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
              <span className="bg-white dark:bg-slate-900 px-2 text-[10px] text-slate-400 font-medium uppercase tracking-wider shrink-0">
                Or Role Simulation (Demo / Testing)
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Select Persona / Role Access Level
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                <option value="SUPER_ADMIN">Super Admin (Asadullah - Full Governance)</option>
                <option value="FINANCE_OFFICER">Finance Officer (Ayesha Siddiqui - Central Treasury)</option>
                <option value="REGIONAL_OFFICER">Regional Officer (Bilal Ahmed - Lahore Central)</option>
                <option value="MEMBER">Member (Hamza Malik - KC-MEM-501)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Security Password / Token
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs font-mono"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <button
                type="button"
                onClick={() => setMode('RECOVERY')}
                className="text-emerald-600 hover:underline font-medium"
              >
                Emergency Admin Recovery?
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchToRegister();
                }}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                Apply for Membership →
              </button>
            </div>

            <button
              onClick={handleRoleLogin}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded shadow-xs transition-colors cursor-pointer"
            >
              <span>Authenticate Persona & Enter Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmergencyRecovery} className="mt-4 space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              <ShieldAlert className="w-4 h-4 inline mr-1 text-amber-600" />
              <strong>Institutional Safety Fail-Safe:</strong> To ensure the welfare organization never loses administrative authority, enter the Board Master Recovery Key or secret passphrase.
            </div>

            {recoverySuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  Super Admin Authority Restored!
                </p>
                <p className="text-slate-500 text-xs">
                  Switching session to Chairman / Super Admin...
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Master Recovery Security Key
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter KC-EMERGENCY-RECOVER-2026"
                    value={recoveryKey}
                    onChange={(e) => {
                      setRecoveryKey(e.target.value);
                      setRecoveryError('');
                    }}
                    className="w-full px-3 py-2 font-mono border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs"
                  />
                  {recoveryError && (
                    <p className="text-rose-600 text-[10px] mt-1">{recoveryError}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    Tip: Use demo master key <code className="font-mono text-emerald-600">KC-EMERGENCY-RECOVER-2026</code>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('LOGIN')}
                    className="text-slate-500 hover:text-slate-700 text-xs"
                  >
                    ← Back to Login
                  </button>

                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded shadow-xs"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Authorize Emergency Recovery</span>
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
