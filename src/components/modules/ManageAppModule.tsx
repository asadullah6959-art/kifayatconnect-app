import React, { useState } from 'react';
import { useApp, isFounderUser } from '../../context/AppContext';
import {
  Settings,
  Smartphone,
  Users,
  MapPin,
  Sliders,
  Upload,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  ShieldCheck,
  ExternalLink,
  Layers,
  RefreshCw,
  Download,
  Lock,
  Unlock,
  Palette,
  Type,
  Megaphone,
  Eye,
  ToggleLeft,
  Crown,
  KeyRound,
  UserCheck,
  UserX,
  FileClock
} from 'lucide-react';
import { PROVINCE_OPTIONS, getAllDistricts, addCustomDistrict } from '../../data/locationData';
import { SearchableLocationSelect, SelectedLocationValue } from '../common/SearchableLocationSelect';
import { RoleBadge } from '../common/RoleBadge';
import { BrandEmblem3D } from '../common/BrandEmblem3D';
import { hashSecretString } from '../../services/firebase';
import { translate } from '../../data/translations';
import {
  RolePermissions,
  ThemePresetId,
  DashboardSectionVisibility,
  FeatureToggles,
  CustomCopyOverrides
} from '../../types';

type MasterTab =
  | 'GENERAL'
  | 'BRANDING'
  | 'THEMES'
  | 'COPY'
  | 'ROLES'
  | 'MEMBERS'
  | 'BROADCAST'
  | 'VISIBILITY'
  | 'FEATURES'
  | 'APK_LOCATIONS';

const THEME_PRESET_OPTIONS: Array<{
  id: ThemePresetId;
  name: string;
  nameUr: string;
  bg: string;
  surface: string;
  accent: string;
  emerald: string;
}> = [
  {
    id: 'OBSIDIAN_GOLD',
    name: 'Obsidian Black & Royal Gold',
    nameUr: 'اوبسیڈین بلیک اور شاہی گولڈ',
    bg: '#0A0D12',
    surface: '#111622',
    accent: '#D4AF37',
    emerald: '#043927'
  },
  {
    id: 'EMERALD_GOLD',
    name: 'Royal Emerald & Gold',
    nameUr: 'شاہی زمرد اور گولڈ',
    bg: '#06130F',
    surface: '#0B1F18',
    accent: '#F5D061',
    emerald: '#065F46'
  },
  {
    id: 'MIDNIGHT_ROYAL',
    name: 'Midnight Sapphire & Gold',
    nameUr: 'مڈ نائٹ رائل اور گولڈ',
    bg: '#070B16',
    surface: '#0F172A',
    accent: '#EAB308',
    emerald: '#043927'
  },
  {
    id: 'IMPERIAL_ONYX',
    name: 'Imperial Onyx Velvet',
    nameUr: 'امپیریل اونکس مخملی',
    bg: '#08080A',
    surface: '#121216',
    accent: '#D4AF37',
    emerald: '#064E3B'
  }
];

export const ManageAppModule: React.FC = () => {
  const {
    currentUser,
    users,
    auditLogs,
    appUpdates,
    publishAppUpdate,
    toggleUpdatePublish,
    appSettings,
    updateAppSettings,
    createOrUpdateStaff,
    promoteToSuperAdmin,
    demoteSuperAdmin,
    toggleUserSuspension,
    updateUserPermissions,
    broadcastAdminAlert,
    githubRelease,
    refreshGitHubRelease,
    requestOTP,
    verifyOTP,
    language
  } = useApp();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const currentIsFounder = isFounderUser(currentUser);

  // PIN Protection Gate
  const hasConfiguredPin = Boolean(appSettings.masterPinHash);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('kc_master_unlocked') === '1';
    } catch {
      return false;
    }
  });
  const [pinInput, setPinInput] = useState('');
  const [pinConfirmInput, setPinConfirmInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinMode, setPinMode] = useState<'ENTER' | 'OTP_RESET'>('ENTER');
  const [resetOtpInput, setResetOtpInput] = useState('');
  const [newResetPin, setNewResetPin] = useState('');
  const [pinInfoMsg, setPinInfoMsg] = useState<string | null>(null);
  const [pinBusy, setPinBusy] = useState(false);

  const [activeTab, setActiveTab] = useState<MasterTab>('GENERAL');
  const [checkingGitHub, setCheckingGitHub] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. General & Maintenance Settings
  const [maintenanceMode, setMaintenanceMode] = useState(appSettings.maintenanceMode);
  const [registrationOpen, setRegistrationOpen] = useState(appSettings.registrationOpen);
  const [chatEnabled, setChatEnabled] = useState(appSettings.chatEnabled);
  const [contactEmail, setContactEmail] = useState(appSettings.contactEmail);
  const [contactHelpline, setContactHelpline] = useState(appSettings.contactHelpline);
  const [profileVisibility, setProfileVisibility] = useState(appSettings.profileVisibility);

  // 2. Branding & Logo
  const [appName, setAppName] = useState(appSettings.appName);
  const [appNameUr, setAppNameUr] = useState(appSettings.appNameUr || 'کفایت کنیکٹ');
  const [tagline, setTagline] = useState(appSettings.tagline);
  const [taglineUr, setTaglineUr] = useState(appSettings.taglineUr || 'بہتر کل کے لیے ایک ساتھ');
  const [primaryColor, setPrimaryColor] = useState(appSettings.primaryColor);
  const [accentGoldColor, setAccentGoldColor] = useState(appSettings.accentGoldColor);

  // 4. EN / UR Text Overrides
  const [copyOverrides, setCopyOverrides] = useState<CustomCopyOverrides>({
    welcomeHeadlineEn: appSettings.textOverrides?.welcomeHeadlineEn || 'Sign In to Kifayat Connect',
    welcomeHeadlineUr: appSettings.textOverrides?.welcomeHeadlineUr || 'کفایت کنیکٹ میں سائن ان کریں',
    maintenanceMessageEn:
      appSettings.textOverrides?.maintenanceMessageEn ||
      'System upgrade in progress. Please check back shortly.',
    maintenanceMessageUr:
      appSettings.textOverrides?.maintenanceMessageUr ||
      'سسٹم کی مرمت اور اپڈیٹ جاری ہے۔ براہ کرم کچھ دیر بعد کوشش کریں۔',
    idCardFooterEn: appSettings.textOverrides?.idCardFooterEn || 'TOGETHER FOR A BETTER TOMORROW',
    idCardFooterUr: appSettings.textOverrides?.idCardFooterUr || 'بہتر کل کے لیے ایک ساتھ'
  });

  // 5. Role Quotas & Staff Appointment Modal (STRICT 4 ROLES ONLY)
  const [maxAdminsPerDistrict, setMaxAdminsPerDistrict] = useState(appSettings.maxAdminsPerDistrict || 10);
  const [maxCoAdminsPerState, setMaxCoAdminsPerState] = useState(appSettings.maxCoAdminsPerState || 3);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffRole, setStaffRole] = useState<'ADMIN' | 'CO_ADMIN'>('ADMIN');
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffCnic, setStaffCnic] = useState('');
  const [staffLocation, setStaffLocation] = useState<SelectedLocationValue>({
    stateProvince: 'Punjab',
    district: 'Lahore',
    cityTown: 'Lahore',
    tehsil: 'Model Town'
  });
  const [staffQuotaError, setStaffQuotaError] = useState<string | null>(null);
  const [superAdminCandidateId, setSuperAdminCandidateId] = useState('');

  // 6. Member Manager
  const [memberSearch, setMemberSearch] = useState('');
  const [editingPermUserId, setEditingPermUserId] = useState<string | null>(null);

  // 7. Broadcast Alert
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<'ALL' | 'STAFF'>('ALL');

  // 8. Dashboard Visibility
  const [dashVis, setDashVis] = useState<DashboardSectionVisibility>(
    appSettings.dashboardVisibility || {
      showKpiGrid: true,
      showQuickActions: true,
      showApkSyncBanner: true,
      showDistrictMatrix: true,
      showOfficeBearersWidget: true,
      showAnnouncementsFeed: true
    }
  );

  // 9. Feature Toggles
  const [featureToggles, setFeatureToggles] = useState<FeatureToggles>(
    appSettings.featureToggles || {
      allowPasswordLogin: true,
      allowCommunityAnnouncements: true,
      allowDigitalIdDownload: true,
      allowMemberPayments: true,
      allowComplaintsDesk: true
    }
  );

  // 10. APK & Locations
  const [version, setVersion] = useState('1.1.0');
  const [title, setTitle] = useState('Kifayat Connect — Release');
  const [description, setDescription] = useState(
    'Kifayat Connect ka naya update aa chuka hai. Behtar performance aur naye features ke liye app update karein.'
  );
  const [releaseNotesText, setReleaseNotesText] = useState(
    'Verified Android APK release\nObsidian Black & Royal Gold luxury interface\nReal-time sync and offline message queue'
  );
  const [apkDownloadUrl, setApkDownloadUrl] = useState('');
  const [pwaUpdateUrl, setPwaUpdateUrl] = useState(
    typeof window !== 'undefined' ? window.location.origin : ''
  );
  const [isMandatory, setIsMandatory] = useState(false);

  const [locProvince, setLocProvince] = useState('Punjab');
  const [newDistrictName, setNewDistrictName] = useState('');
  const [newCityName, setNewCityName] = useState('');

  if (!currentUser) return null;

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center bg-[#111622] rounded-2xl border border-[#D4AF37]/25">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
        <h2 className="text-base font-bold text-white">Restricted Master Control</h2>
        <p className="text-xs text-slate-400 mt-1">
          The Master Control Panel (👑) is strictly reserved for verified Super Admins.
        </p>
      </div>
    );
  }

  const showNotice = (type: 'success' | 'error', text: string) => {
    setFeedbackBanner({ type, text });
    setTimeout(() => setFeedbackBanner(null), 4000);
  };

  // PIN Handlers
  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    const clean = pinInput.replace(/\D/g, '');
    if (clean.length < 4 || clean.length > 6) {
      setPinError('Master Control PIN must be 4 to 6 digits.');
      return;
    }
    if (clean !== pinConfirmInput.replace(/\D/g, '')) {
      setPinError('PIN and confirmation do not match.');
      return;
    }
    setPinBusy(true);
    try {
      const hash = await hashSecretString(clean, 'master_pin');
      updateAppSettings({ masterPinHash: hash });
      sessionStorage.setItem('kc_master_unlocked', '1');
      setIsUnlocked(true);
      setPinInput('');
      setPinConfirmInput('');
    } finally {
      setPinBusy(false);
    }
  };

  const handleUnlockWithPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    const clean = pinInput.replace(/\D/g, '');
    if (clean.length < 4) {
      setPinError('Enter your 4–6 digit Master Control PIN.');
      return;
    }
    setPinBusy(true);
    try {
      const hash = await hashSecretString(clean, 'master_pin');
      if (hash === appSettings.masterPinHash) {
        sessionStorage.setItem('kc_master_unlocked', '1');
        setIsUnlocked(true);
        setPinInput('');
      } else {
        setPinError('Incorrect Master Control PIN.');
      }
    } finally {
      setPinBusy(false);
    }
  };

  const handleSendPinResetOtp = async () => {
    setPinError(null);
    setPinInfoMsg(null);
    setPinBusy(true);
    try {
      const res = await requestOTP(currentUser.email);
      if (res.success) {
        setPinInfoMsg(res.message);
      } else {
        setPinError(res.message);
      }
    } finally {
      setPinBusy(false);
    }
  };

  const handleConfirmPinReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    const cleanPin = newResetPin.replace(/\D/g, '');
    if (cleanPin.length < 4 || cleanPin.length > 6) {
      setPinError('New PIN must be 4 to 6 digits.');
      return;
    }
    setPinBusy(true);
    try {
      const res = await verifyOTP(currentUser.email, resetOtpInput);
      if (!res.success) {
        setPinError(res.message);
        return;
      }
      const hash = await hashSecretString(cleanPin, 'master_pin');
      updateAppSettings({ masterPinHash: hash });
      sessionStorage.setItem('kc_master_unlocked', '1');
      setIsUnlocked(true);
      setPinMode('ENTER');
      setResetOtpInput('');
      setNewResetPin('');
      showNotice('success', 'Master Control PIN reset via Email OTP.');
    } finally {
      setPinBusy(false);
    }
  };

  const handleLockPanel = () => {
    try {
      sessionStorage.removeItem('kc_master_unlocked');
    } catch {
      // Ignore
    }
    setIsUnlocked(false);
  };

  // PIN Lock Gate UI
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-8 bg-[#111622] border border-[#D4AF37]/35 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex flex-col items-center text-center space-y-2">
          <BrandEmblem3D size="md" />
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-[#D4AF37]/40 text-[#F5D061] text-[10px] font-bold uppercase tracking-wider">
            <Lock className="w-3 h-3" />
            <span>{hasConfiguredPin ? translate(language, 'masterPinLockedTitle') : translate(language, 'masterPinCreateTitle')}</span>
          </div>
          <h2 className="text-lg font-extrabold text-white">
            {translate(language, 'masterControlTitle')} 👑
          </h2>
          <p className="text-xs text-slate-400">
            {hasConfiguredPin
              ? translate(language, 'masterPinEnterPrompt')
              : 'Create a 4–6 digit security PIN to protect live platform controls.'}
          </p>
        </div>

        {pinError && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-semibold">
            {pinError}
          </div>
        )}
        {pinInfoMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-semibold">
            {pinInfoMsg}
          </div>
        )}

        {!hasConfiguredPin ? (
          <form onSubmit={handleSetupPin} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                New Master PIN (4–6 Digits) *
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                required
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full px-3 py-2.5 rounded-xl border border-[#D4AF37]/30 bg-[#0A0D12] text-white font-mono text-center tracking-[0.5em] text-base focus:outline-hidden focus:border-[#F5D061]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Confirm Master PIN *
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                required
                value={pinConfirmInput}
                onChange={(e) => setPinConfirmInput(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full px-3 py-2.5 rounded-xl border border-[#D4AF37]/30 bg-[#0A0D12] text-white font-mono text-center tracking-[0.5em] text-base focus:outline-hidden focus:border-[#F5D061]"
              />
            </div>
            <button
              type="submit"
              disabled={pinBusy}
              className="w-full py-2.5 rounded-xl font-extrabold kc-gold-button flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>{translate(language, 'masterPinSaveBtn')}</span>
            </button>
          </form>
        ) : pinMode === 'ENTER' ? (
          <form onSubmit={handleUnlockWithPin} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Master Control PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                required
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="w-full px-3 py-2.5 rounded-xl border border-[#D4AF37]/30 bg-[#0A0D12] text-white font-mono text-center tracking-[0.5em] text-base focus:outline-hidden focus:border-[#F5D061]"
              />
            </div>
            <button
              type="submit"
              disabled={pinBusy}
              className="w-full py-2.5 rounded-xl font-extrabold kc-gold-button flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>{translate(language, 'masterPinUnlockBtn')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPinError(null);
                setPinMode('OTP_RESET');
              }}
              className="w-full py-1.5 text-[11px] font-semibold text-[#F5D061] hover:underline"
            >
              {translate(language, 'masterPinResetOtp')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmPinReset} className="space-y-3 text-xs">
            <div className="p-2.5 rounded-xl bg-[#0A0D12] border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between gap-2">
              <span className="truncate">{currentUser.email}</span>
              <button
                type="button"
                disabled={pinBusy}
                onClick={handleSendPinResetOtp}
                className="px-2.5 py-1 rounded-lg bg-[#043927] text-[#F5D061] border border-[#D4AF37]/40 font-bold shrink-0"
              >
                {translate(language, 'sendOtpBtn')}
              </button>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                {translate(language, 'otpCodeLabel')}
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={resetOtpInput}
                onChange={(e) => setResetOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full px-3 py-2 rounded-xl border border-[#D4AF37]/30 bg-[#0A0D12] text-white font-mono text-center tracking-widest"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                New 4–6 Digit PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                required
                value={newResetPin}
                onChange={(e) => setNewResetPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full px-3 py-2 rounded-xl border border-[#D4AF37]/30 bg-[#0A0D12] text-white font-mono text-center tracking-widest"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPinMode('ENTER')}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
              >
                {translate(language, 'cancel')}
              </button>
              <button
                type="submit"
                disabled={pinBusy}
                className="flex-1 py-2 rounded-xl font-extrabold kc-gold-button"
              >
                Verify OTP & Save PIN
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // Action Handlers
  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateAppSettings({
      maintenanceMode,
      registrationOpen,
      chatEnabled,
      contactEmail: contactEmail.trim(),
      contactHelpline: contactHelpline.trim(),
      profileVisibility
    });
    showNotice('success', 'System & maintenance settings saved live.');
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    updateAppSettings({
      appName: appName.trim() || 'KIFAYAT CONNECT',
      appNameUr: appNameUr.trim() || 'کفایت کنیکٹ',
      tagline: tagline.trim() || 'Together for a Better Tomorrow',
      taglineUr: taglineUr.trim() || 'بہتر کل کے لیے ایک ساتھ',
      primaryColor,
      accentGoldColor
    });
    showNotice('success', 'Brand identity and colors updated live.');
  };

  const handleSelectTheme = (preset: ThemePresetId) => {
    updateAppSettings({ themePreset: preset });
    showNotice('success', `Theme preset switched to ${preset.replace('_', ' ')}.`);
  };

  const handleSaveCopyOverrides = (e: React.FormEvent) => {
    e.preventDefault();
    updateAppSettings({ textOverrides: copyOverrides });
    showNotice('success', 'Bilingual EN/UR text overrides applied live.');
  };

  const handleSaveQuotas = (e: React.FormEvent) => {
    e.preventDefault();
    updateAppSettings({
      maxAdminsPerDistrict: Math.max(1, Number(maxAdminsPerDistrict) || 10),
      maxCoAdminsPerState: Math.max(1, Number(maxCoAdminsPerState) || 3)
    });
    showNotice('success', 'District/State admin quotas updated.');
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffQuotaError(null);

    const res = createOrUpdateStaff({
      name: staffName,
      email: staffEmail,
      phone: staffPhone,
      cnic: staffCnic,
      role: staffRole,
      stateProvince: staffLocation.stateProvince,
      district: staffLocation.district,
      cityTown: staffLocation.cityTown,
      tehsil: staffLocation.tehsil || staffLocation.cityTown
    });

    if (!res.success) {
      setStaffQuotaError(res.error || 'Failed to appoint staff.');
    } else {
      setStaffModalOpen(false);
      setStaffName('');
      setStaffEmail('');
      setStaffPhone('');
      setStaffCnic('');
      showNotice('success', `Appointed new ${staffRole} successfully.`);
    }
  };

  const handlePromoteSuperAdmin = () => {
    if (!superAdminCandidateId) return;
    const res = promoteToSuperAdmin(superAdminCandidateId);
    if (res.success) {
      setSuperAdminCandidateId('');
      showNotice('success', 'Member promoted to Additional Super Admin 👑.');
    } else {
      showNotice('error', res.error || 'Unable to promote member.');
    }
  };

  const handleDemoteSuperAdmin = (uid: string) => {
    const res = demoteSuperAdmin(uid);
    if (res.success) {
      showNotice('success', 'Additional Super Admin demoted to Admin.');
    } else {
      showNotice('error', res.error || 'Action blocked by Founder Protection.');
    }
  };

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return;
    broadcastAdminAlert(broadcastTitle.trim(), broadcastBody.trim(), broadcastTarget);
    setBroadcastTitle('');
    setBroadcastBody('');
    showNotice('success', `Live notification dispatched to ${broadcastTarget}.`);
  };

  const handleSaveVisibility = () => {
    updateAppSettings({ dashboardVisibility: dashVis });
    showNotice('success', 'Dashboard visibility toggles updated live.');
  };

  const handleSaveFeatures = () => {
    updateAppSettings({ featureToggles });
    showNotice('success', 'Feature availability toggles updated live.');
  };

  const handleCheckGitHub = async () => {
    setCheckingGitHub(true);
    try {
      await refreshGitHubRelease(true);
      showNotice('success', 'Checked GitHub Releases for latest APK.');
    } finally {
      setCheckingGitHub(false);
    }
  };

  const handleCreateUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!version.trim() || !title.trim() || !apkDownloadUrl.trim()) return;

    publishAppUpdate({
      version: version.trim(),
      title: title.trim(),
      description: description.trim(),
      releaseNotes: releaseNotesText.split('\n').filter(line => line.trim().length > 0),
      releaseDate: new Date().toISOString().split('T')[0],
      apkDownloadUrl: apkDownloadUrl.trim(),
      pwaUpdateUrl: pwaUpdateUrl.trim() || window.location.origin,
      isMandatory,
      isPublished: true
    });
    showNotice('success', `Manual APK update v${version.trim()} published!`);
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDistrictName.trim()) return;
    addCustomDistrict(locProvince, newDistrictName.trim(), newCityName.trim() || undefined);
    showNotice('success', `Registered ${newDistrictName.trim()} under ${locProvince}.`);
    setNewDistrictName('');
    setNewCityName('');
  };

  const tabs: Array<{ id: MasterTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'GENERAL', label: '1. System & Maintenance', icon: Settings },
    { id: 'BRANDING', label: '2. Brand & Logo', icon: Crown },
    { id: 'THEMES', label: '3. Themes (4)', icon: Palette },
    { id: 'COPY', label: '4. EN/UR Copy', icon: Type },
    { id: 'ROLES', label: '5. Roles & Super Admins', icon: ShieldCheck },
    { id: 'MEMBERS', label: '6. Members & Perms', icon: Users },
    { id: 'BROADCAST', label: '7. Live Broadcast', icon: Megaphone },
    { id: 'VISIBILITY', label: '8. Dashboard Layout', icon: Eye },
    { id: 'FEATURES', label: '9. Feature Toggles', icon: ToggleLeft },
    { id: 'APK_LOCATIONS', label: '10. APK, Locations & Logs', icon: Smartphone }
  ];

  const superAdminsList = users.filter(u => u.role === 'SUPER_ADMIN');
  const promotableUsers = users.filter(u => u.role !== 'SUPER_ADMIN' && !u.isSuspended);
  const filteredMembers = users.filter(u => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.district && u.district.toLowerCase().includes(q)) ||
      (u.membershipId && u.membershipId.toLowerCase().includes(q))
    );
  });

  const permLabels: Array<{ key: keyof RolePermissions; label: string }> = [
    { key: 'canManageUsers', label: 'Manage Users' },
    { key: 'canApproveMembers', label: 'Approve Members' },
    { key: 'canVerifyPayments', label: 'Verify Payments' },
    { key: 'canPostCommunityAnnouncements', label: 'Post Community Elaan' },
    { key: 'canPostOfficialAnnouncements', label: 'Post Official App Elaan' },
    { key: 'canManageComplaints', label: 'Manage Complaints' },
    { key: 'canViewReports', label: 'View Audit & Reports' }
  ];

  return (
    <div className="space-y-5 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <span className="text-[11px] font-bold text-[#F5D061] uppercase tracking-wider flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5" />
            <span>Founder & Executive Governance</span>
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5 flex items-center gap-2">
            <span>{translate(language, 'masterControlTitle')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            PIN-locked master console controlling branding, themes, roles, visibility, broadcasts, and APK updates.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {currentIsFounder && (
            <span className="text-[11px] px-3 py-1.5 bg-[#043927]/70 border border-[#D4AF37]/50 text-[#F5D061] rounded-lg font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Founder Root Active</span>
            </span>
          )}
          <button
            type="button"
            onClick={handleLockPanel}
            className="text-xs px-3 py-1.5 bg-[#161D2C] hover:bg-slate-800 border border-[#D4AF37]/30 text-slate-200 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-[#F5D061]" />
            <span>Lock Panel</span>
          </button>
        </div>
      </div>

      {feedbackBanner && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          }`}
        >
          {feedbackBanner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedbackBanner.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#D4AF37]/20 text-xs">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                active
                  ? 'kc-gold-button font-extrabold'
                  : 'bg-[#111622] text-slate-300 border border-[#D4AF37]/20 hover:border-[#D4AF37]/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. GENERAL & MAINTENANCE */}
      {activeTab === 'GENERAL' && (
        <form onSubmit={handleSaveGeneral} className="p-5 sm:p-6 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">System Governance & Maintenance Mode</h3>
              <p className="text-slate-400">Pause non-Super-Admin access during critical maintenance or adjust core operations.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-rose-500/35 bg-rose-950/20 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-rose-300 text-sm block">Maintenance Mode</span>
              <span className="text-[11px] text-slate-300">
                When enabled, only Super Admins can access the workspace; all other users see the custom maintenance notice.
              </span>
            </div>
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="w-5 h-5 accent-amber-500 cursor-pointer shrink-0"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="p-3.5 rounded-xl border border-slate-800 bg-[#0A0D12] flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-semibold text-white block">Public Registration</span>
                <span className="text-[11px] text-slate-400">Allow new community signups via OTP + Password.</span>
              </div>
              <input
                type="checkbox"
                checked={registrationOpen}
                onChange={(e) => setRegistrationOpen(e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
            </label>

            <label className="p-3.5 rounded-xl border border-slate-800 bg-[#0A0D12] flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-semibold text-white block">Encrypted Direct Messaging</span>
                <span className="text-[11px] text-slate-400">Enable 1-on-1 member and leadership chat.</span>
              </div>
              <input
                type="checkbox"
                checked={chatEnabled}
                onChange={(e) => setChatEnabled(e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Official Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Helpline Number</label>
              <input
                type="text"
                value={contactHelpline}
                onChange={(e) => setContactHelpline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Directory Visibility</label>
              <select
                value={profileVisibility}
                onChange={(e) => setProfileVisibility(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
              >
                <option value="MEMBERS_ONLY">Members Only</option>
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Staff Only</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button type="submit" className="px-5 py-2.5 rounded-xl font-extrabold kc-gold-button cursor-pointer">
              {translate(language, 'saveChanges')}
            </button>
          </div>
        </form>
      )}

      {/* 2. BRAND & LOGO */}
      {activeTab === 'BRANDING' && (
        <form onSubmit={handleSaveBranding} className="p-5 sm:p-6 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 space-y-5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-slate-800">
            <div className="p-3 rounded-2xl bg-[#0A0D12] border border-[#D4AF37]/40 self-start">
              <BrandEmblem3D size="lg" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">3D Royal Emblem & Bilingual Brand Identity</h3>
              <p className="text-slate-400">Configure English & Urdu app titles, taglines, and primary gold/emerald colors.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">App Title (English)</label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">App Title (Urdu / اردو)</label>
              <input
                type="text"
                dir="rtl"
                value={appNameUr}
                onChange={(e) => setAppNameUr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Tagline (English)</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Tagline (Urdu / اردو)</label>
              <input
                type="text"
                dir="rtl"
                value={taglineUr}
                onChange={(e) => setTaglineUr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Primary Emerald Hex</label>
              <div className="flex items-center gap-2">
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-9 rounded bg-transparent border-0" />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Royal Gold Accent Hex</label>
              <div className="flex items-center gap-2">
                <input type="color" value={accentGoldColor} onChange={(e) => setAccentGoldColor(e.target.value)} className="w-10 h-9 rounded bg-transparent border-0" />
                <input
                  type="text"
                  value={accentGoldColor}
                  onChange={(e) => setAccentGoldColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button type="submit" className="px-5 py-2.5 rounded-xl font-extrabold kc-gold-button cursor-pointer">
              Save Brand Identity
            </button>
          </div>
        </form>
      )}

      {/* 3. THEME PRESETS */}
      {activeTab === 'THEMES' && (
        <div className="p-5 sm:p-6 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 space-y-4 text-xs">
          <div>
            <h3 className="text-base font-bold text-white">Luxury Live Theme Presets (4)</h3>
            <p className="text-slate-400">Apply a palette across the entire application immediately without reload.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {THEME_PRESET_OPTIONS.map(preset => {
              const isSelected = (appSettings.themePreset || 'OBSIDIAN_GOLD') === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectTheme(preset.id)}
                  className={`p-4 rounded-2xl border text-left transition-transform active:scale-[0.99] cursor-pointer space-y-3 ${
                    isSelected
                      ? 'border-[#F5D061] bg-[#161D2C] shadow-[0_0_24px_rgba(212,175,55,0.2)]'
                      : 'border-slate-800 bg-[#0A0D12] hover:border-[#D4AF37]/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-sm text-white block">{preset.name}</span>
                      <span className="text-[11px] text-slate-400">{preset.nameUr}</span>
                    </div>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-md bg-[#F5D061] text-[#0A0D12] text-[10px] font-extrabold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg border border-white/15" style={{ backgroundColor: preset.bg }} title="Background" />
                    <span className="w-7 h-7 rounded-lg border border-white/15" style={{ backgroundColor: preset.surface }} title="Surface" />
                    <span className="w-7 h-7 rounded-lg border border-white/15" style={{ backgroundColor: preset.emerald }} title="Emerald" />
                    <span className="w-7 h-7 rounded-lg border border-white/15" style={{ backgroundColor: preset.accent }} title="Gold Accent" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. EN / UR COPY OVERRIDES */}
      {activeTab === 'COPY' && (
        <form onSubmit={handleSaveCopyOverrides} className="p-5 sm:p-6 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 space-y-4 text-xs">
          <div>
            <h3 className="text-base font-bold text-white">Live English & Urdu Text Overrides</h3>
            <p className="text-slate-400">Customize key headlines, maintenance notices, and VIP ID card footer copy live.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Welcome Headline (EN)</label>
              <input
                type="text"
                value={copyOverrides.welcomeHeadlineEn}
                onChange={(e) => setCopyOverrides(p => ({ ...p, welcomeHeadlineEn: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Welcome Headline (UR)</label>
              <input
                type="text"
                dir="rtl"
                value={copyOverrides.welcomeHeadlineUr}
                onChange={(e) => setCopyOverrides(p => ({ ...p, welcomeHeadlineUr: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Maintenance Message (EN)</label>
              <textarea
                rows={2}
                value={copyOverrides.maintenanceMessageEn}
                onChange={(e) => setCopyOverrides(p => ({ ...p, maintenanceMessageEn: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white resize-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Maintenance Message (UR)</label>
              <textarea
                rows={2}
                dir="rtl"
                value={copyOverrides.maintenanceMessageUr}
                onChange={(e) => setCopyOverrides(p => ({ ...p, maintenanceMessageUr: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white resize-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">VIP ID Card Footer (EN)</label>
              <input
                type="text"
                value={copyOverrides.idCardFooterEn}
                onChange={(e) => setCopyOverrides(p => ({ ...p, idCardFooterEn: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">VIP ID Card Footer (UR)</label>
              <input
                type="text"
                dir="rtl"
                value={copyOverrides.idCardFooterUr}
                onChange={(e) => setCopyOverrides(p => ({ ...p, idCardFooterUr: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button type="submit" className="px-5 py-2.5 rounded-xl font-extrabold kc-gold-button cursor-pointer">
              Apply Text Overrides
            </button>
          </div>
        </form>
      )}

      {/* 5. ROLES, MULTI-SUPER ADMIN & QUOTAS (STRICT 4 ROLES) */}
      {activeTab === 'ROLES' && (
        <div className="space-y-5 text-xs">
          {/* Multi-Super Admin Manager with Founder Protection */}
          <div className="p-5 bg-[#111622] rounded-2xl border border-[#D4AF37]/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-[#F5D061]" />
                  <span>Multi-Super Admin Governance & Founder Protection</span>
                </h3>
                <p className="text-slate-400 mt-0.5">
                  Strict 4-Role Hierarchy: Super Admin · Admin · Co-Admin · Member. The Founder account cannot be edited, demoted, or suspended by any Additional Super Admin.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#043927]/70 border border-[#D4AF37]/40 text-[#F5D061] font-bold self-start">
                {translate(language, 'founderProtected')}
              </span>
            </div>

            {currentIsFounder && (
              <div className="flex flex-col sm:flex-row gap-2 p-3 rounded-xl bg-[#0A0D12] border border-[#D4AF37]/25">
                <select
                  value={superAdminCandidateId}
                  onChange={(e) => setSuperAdminCandidateId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-700 bg-[#111622] text-white"
                >
                  <option value="">Select member or admin to promote to Additional Super Admin...</option>
                  {promotableUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) — {u.role}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!superAdminCandidateId}
                  onClick={handlePromoteSuperAdmin}
                  className="px-4 py-2 rounded-xl font-extrabold kc-gold-button disabled:opacity-40 cursor-pointer shrink-0"
                >
                  Promote to Super Admin 👑
                </button>
              </div>
            )}

            <div className="space-y-2">
              {superAdminsList.map(sa => {
                const saIsFounder = isFounderUser(sa);
                return (
                  <div
                    key={sa.id}
                    className="p-3 rounded-xl bg-[#0A0D12] border border-[#D4AF37]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white truncate">{sa.name}</span>
                        <RoleBadge role={sa.role} isFounder={saIsFounder} compact />
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">{sa.email}</span>
                    </div>

                    {saIsFounder ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-[#D4AF37]/40 text-[#F5D061] text-[10px] font-bold shrink-0">
                        <Lock className="w-3 h-3" />
                        <span>Founder Immutable</span>
                      </span>
                    ) : currentIsFounder ? (
                      <button
                        type="button"
                        onClick={() => handleDemoteSuperAdmin(sa.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-200 font-semibold shrink-0 cursor-pointer"
                      >
                        Demote to Admin
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500">Additional Super Admin</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quotas & District/State Appointments */}
          <form onSubmit={handleSaveQuotas} className="p-5 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-white">Constitutional Role Quotas</h3>
                <p className="text-slate-400">Configure District Admin and State Co-Admin limits.</p>
              </div>
              <button
                type="button"
                onClick={() => setStaffModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-extrabold kc-gold-button self-start cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Appoint Admin / Co-Admin</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Max Admins per District</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={maxAdminsPerDistrict}
                  onChange={(e) => setMaxAdminsPerDistrict(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Max Co-Admins per State/Province</label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={maxCoAdminsPerState}
                  onChange={(e) => setMaxCoAdminsPerState(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#043927] hover:bg-emerald-900 border border-[#D4AF37]/40 text-[#F5D061] font-bold cursor-pointer">
                Save Role Quotas
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Admins ({users.filter(u => u.role === 'ADMIN').length})</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">Max {appSettings.maxAdminsPerDistrict} / District</span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {users.filter(u => u.role === 'ADMIN').length === 0 ? (
                  <p className="text-slate-500 py-4 text-center">No Admins appointed yet.</p>
                ) : (
                  users.filter(u => u.role === 'ADMIN').map(admin => (
                    <div key={admin.id} className="p-3 rounded-xl border border-slate-800 bg-[#0A0D12] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-white block truncate">{admin.name}</span>
                        <span className="text-[11px] text-slate-400">{admin.district}, {admin.stateProvince}</span>
                      </div>
                      <RoleBadge role={admin.role} compact />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-5 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Co-Admins ({users.filter(u => u.role === 'CO_ADMIN').length})</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">Max {appSettings.maxCoAdminsPerState} / State</span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {users.filter(u => u.role === 'CO_ADMIN').length === 0 ? (
                  <p className="text-slate-500 py-4 text-center">No Co-Admins appointed yet.</p>
                ) : (
                  users.filter(u => u.role === 'CO_ADMIN').map(ca => (
                    <div key={ca.id} className="p-3 rounded-xl border border-slate-800 bg-[#0A0D12] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-white block truncate">{ca.name}</span>
                        <span className="text-[11px] text-slate-400">{ca.stateProvince}</span>
                      </div>
                      <RoleBadge role={ca.role} compact />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MEMBER SUSPENSION & GRANULAR PERMISSIONS */}
      {activeTab === 'MEMBERS' && (
        <div className="p-5 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Member Suspension & Permission Matrix</h3>
              <p className="text-slate-400">Suspend/reactivate accounts or grant granular permissions (Founder Protected).</p>
            </div>
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search name, email, ID, district..."
              className="px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white w-full sm:w-64"
            />
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {filteredMembers.map(u => {
              const targetIsFounder = isFounderUser(u);
              const isEditing = editingPermUserId === u.id;
              return (
                <div key={u.id} className="p-3.5 rounded-xl bg-[#0A0D12] border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white truncate">{u.name}</span>
                        <RoleBadge role={u.role} isFounder={targetIsFounder} compact />
                        {u.isSuspended && (
                          <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500/40 text-rose-300 text-[10px] font-bold">
                            SUSPENDED
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {u.email} · {u.district}, {u.stateProvince}
                      </span>
                    </div>

                    {targetIsFounder ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-[#D4AF37]/40 text-[#F5D061] text-[10px] font-bold flex items-center gap-1 self-start">
                        <Lock className="w-3 h-3" />
                        <span>{translate(language, 'founderProtected')}</span>
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingPermUserId(isEditing ? null : u.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#161D2C] hover:bg-slate-800 border border-[#D4AF37]/30 text-[#F5D061] font-semibold cursor-pointer"
                        >
                          {isEditing ? 'Hide Permissions' : 'Permissions'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const res = toggleUserSuspension(u.id, !u.isSuspended);
                            if (res.success) {
                              showNotice('success', `${u.name} ${u.isSuspended ? 'reactivated' : 'suspended'}.`);
                            } else {
                              showNotice('error', res.error || 'Action denied.');
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 cursor-pointer ${
                            u.isSuspended
                              ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                              : 'bg-rose-950/70 border border-rose-500/40 text-rose-300'
                          }`}
                        >
                          {u.isSuspended ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                          <span>{u.isSuspended ? 'Activate' : 'Suspend'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing && !targetIsFounder && (
                    <div className="pt-2.5 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {permLabels.map(perm => {
                        const checked = Boolean(u.permissions?.[perm.key]);
                        return (
                          <label key={perm.key} className="flex items-center gap-2 p-2 rounded-lg bg-[#111622] border border-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const res = updateUserPermissions(u.id, { [perm.key]: e.target.checked });
                                if (!res.success && res.error) showNotice('error', res.error);
                              }}
                              className="accent-amber-500"
                            />
                            <span className="text-[11px] text-slate-200">{perm.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. LIVE NOTIFICATION BROADCAST */}
      {activeTab === 'BROADCAST' && (
        <form onSubmit={handleBroadcastSubmit} className="p-5 sm:p-6 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 space-y-4 text-xs">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#F5D061]" />
              <span>Live System Notification Broadcast</span>
            </h3>
            <p className="text-slate-400">Push an instant high-priority alert to all members or leadership staff.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">Alert Title *</label>
              <input
                type="text"
                required
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g. Urgent Executive Council Assembly"
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Audience</label>
              <select
                value={broadcastTarget}
                onChange={(e) => setBroadcastTarget(e.target.value as 'ALL' | 'STAFF')}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
              >
                <option value="ALL">All Users (Members + Staff)</option>
                <option value="STAFF">Leadership Only (Super Admin, Admin, Co-Admin)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Notification Message *</label>
            <textarea
              rows={3}
              required
              value={broadcastBody}
              onChange={(e) => setBroadcastBody(e.target.value)}
              placeholder="Write alert notification body..."
              className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button type="submit" className="px-5 py-2.5 rounded-xl font-extrabold kc-gold-button cursor-pointer">
              Dispatch Live Alert
            </button>
          </div>
        </form>
      )}

      {/* 8. DASHBOARD SECTION VISIBILITY */}
      {activeTab === 'VISIBILITY' && (
        <div className="p-5 sm:p-6 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 space-y-4 text-xs">
          <div>
            <h3 className="text-base font-bold text-white">Dashboard Section Visibility Controls</h3>
            <p className="text-slate-400">Show or hide dashboard widgets across Member and Officer dashboards live.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'showKpiGrid', label: 'KPI Statistics Grid' },
              { key: 'showQuickActions', label: 'Apollo-Style Quick Action Cards' },
              { key: 'showApkSyncBanner', label: 'GitHub Releases APK Banner' },
              { key: 'showDistrictMatrix', label: 'District Contributions Matrix' },
              { key: 'showOfficeBearersWidget', label: 'Office Bearers Summary' },
              { key: 'showAnnouncementsFeed', label: 'Live Announcements Feed' }
            ].map(item => (
              <label key={item.key} className="p-3.5 rounded-xl bg-[#0A0D12] border border-slate-800 flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-slate-200">{item.label}</span>
                <input
                  type="checkbox"
                  checked={dashVis[item.key as keyof DashboardSectionVisibility]}
                  onChange={(e) =>
                    setDashVis(prev => ({ ...prev, [item.key]: e.target.checked }))
                  }
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </label>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleSaveVisibility}
              className="px-5 py-2.5 rounded-xl font-extrabold kc-gold-button cursor-pointer"
            >
              Save Visibility Rules
            </button>
          </div>
        </div>
      )}

      {/* 9. FEATURE TOGGLES */}
      {activeTab === 'FEATURES' && (
        <div className="p-5 sm:p-6 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 space-y-4 text-xs">
          <div>
            <h3 className="text-base font-bold text-white">Global Feature Toggles</h3>
            <p className="text-slate-400">Enable or disable core modules in real time.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'allowPasswordLogin', label: 'Allow Gmail + Password Login' },
              { key: 'allowCommunityAnnouncements', label: 'Allow Admin/Co-Admin Community Announcements' },
              { key: 'allowDigitalIdDownload', label: 'Allow VIP Digital ID PNG Download' },
              { key: 'allowMemberPayments', label: 'Allow Member Payment Submissions' },
              { key: 'allowComplaintsDesk', label: 'Allow Complaints Desk Submissions' }
            ].map(item => (
              <label key={item.key} className="p-3.5 rounded-xl bg-[#0A0D12] border border-slate-800 flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-slate-200">{item.label}</span>
                <input
                  type="checkbox"
                  checked={featureToggles[item.key as keyof FeatureToggles]}
                  onChange={(e) =>
                    setFeatureToggles(prev => ({ ...prev, [item.key]: e.target.checked }))
                  }
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </label>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleSaveFeatures}
              className="px-5 py-2.5 rounded-xl font-extrabold kc-gold-button cursor-pointer"
            >
              Save Feature Toggles
            </button>
          </div>
        </div>
      )}

      {/* 10. APK GITHUB AUTO-SYNC, LOCATIONS & SECURITY AUDIT */}
      {activeTab === 'APK_LOCATIONS' && (
        <div className="space-y-6 text-xs">
          {/* Live GitHub Releases Sync Card (PRESERVED) */}
          <div className="p-5 bg-[#111622] text-white rounded-2xl border border-[#D4AF37]/35 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5D061]">
                  GitHub Releases Auto-Sync
                </span>
                <a
                  href="https://github.com/asadullah6959-art/kifayatconnect-app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono text-slate-300 hover:text-[#F5D061] hover:underline inline-flex items-center gap-1"
                >
                  <span>asadullah6959-art/kifayatconnect-app</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <h3 className="text-sm sm:text-base font-bold">
                {githubRelease?.apkUrl
                  ? `Latest Release: ${githubRelease.tagName}`
                  : githubRelease?.releaseTitle || 'Latest Version Installed'}
              </h3>
              <p className="text-xs text-slate-300">
                Installed Build: <strong className="font-mono text-[#F5D061]">v{githubRelease?.installedVersion || '1.0.0'}</strong>
                {githubRelease?.apkUrl
                  ? ` · Verified Android APK (${githubRelease.tagName}) ready from GitHub Releases.`
                  : ' · Latest Version Installed. APK download activates automatically once a GitHub Release is published.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {githubRelease?.apkUrl && (
                <a
                  href={githubRelease.apkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl kc-gold-button font-extrabold text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download APK ({githubRelease.tagName})</span>
                </a>
              )}
              <button
                type="button"
                onClick={handleCheckGitHub}
                disabled={checkingGitHub}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A0D12] hover:bg-slate-800 text-white border border-[#D4AF37]/30 font-semibold text-xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#F5D061] ${checkingGitHub ? 'animate-spin' : ''}`} />
                <span>{checkingGitHub ? 'Checking...' : 'Check Releases'}</span>
              </button>
            </div>
          </div>

          {/* Manual APK Override */}
          <div className="p-5 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#F5D061]" />
              <span>Manual APK Release Override</span>
            </h3>

            <form onSubmit={handleCreateUpdate} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.1.0"
                  className="px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white font-mono"
                />
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Release Title"
                  className="md:col-span-2 px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
                />
              </div>

              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
              />

              <textarea
                rows={2}
                value={releaseNotesText}
                onChange={(e) => setReleaseNotesText(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#0A0D12] text-white resize-none"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="url"
                  required
                  value={apkDownloadUrl}
                  onChange={(e) => setApkDownloadUrl(e.target.value)}
                  placeholder="https://github.com/asadullah6959-art/kifayatconnect-app/releases/download/..."
                  className="px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white font-mono text-[11px]"
                />
                <input
                  type="url"
                  value={pwaUpdateUrl}
                  onChange={(e) => setPwaUpdateUrl(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMandatory}
                    onChange={(e) => setIsMandatory(e.target.checked)}
                    className="accent-amber-500"
                  />
                  <span>Mandatory Update</span>
                </label>
                <button type="submit" className="px-4 py-2 rounded-xl font-extrabold kc-gold-button cursor-pointer">
                  Publish Manual Override
                </button>
              </div>
            </form>

            {appUpdates.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                {appUpdates.map(upd => (
                  <div key={upd.id} className="p-3 rounded-xl bg-[#0A0D12] border border-slate-800 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono font-bold text-[#F5D061]">v{upd.version}</span>{' '}
                      <span className="text-white font-semibold">{upd.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleUpdatePublish(upd.id)}
                      className={`px-3 py-1 rounded-lg font-bold ${
                        upd.isPublished ? 'bg-slate-800 text-slate-300' : 'bg-emerald-700 text-white'
                      }`}
                    >
                      {upd.isPublished ? 'Unpublish' : 'Activate'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Location Master */}
          <form onSubmit={handleAddLocation} className="p-5 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#F5D061]" />
              <span>Pakistan Districts & Cities Master ({getAllDistricts().length} Registered)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={locProvince}
                onChange={(e) => setLocProvince(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
              >
                {PROVINCE_OPTIONS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input
                type="text"
                required
                value={newDistrictName}
                onChange={(e) => setNewDistrictName(e.target.value)}
                placeholder="New District Name *"
                className="px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
              />
              <input
                type="text"
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                placeholder="City / Tehsil"
                className="px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="px-4 py-2 rounded-xl font-extrabold kc-gold-button cursor-pointer">
                Add District
              </button>
            </div>
          </form>

          {/* Recent Audit Logs Preview */}
          <div className="p-5 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <FileClock className="w-4 h-4 text-[#F5D061]" />
              <span>Recent Security & Role Audit Logs ({auditLogs.length})</span>
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {auditLogs.slice(0, 12).map(log => (
                <div key={log.id} className="p-2.5 rounded-xl bg-[#0A0D12] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="min-w-0">
                    <span className="font-bold text-[#F5D061]">{log.action}</span>{' '}
                    <span className="text-slate-300">— {log.details}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Staff Appointment Modal (STRICT 4 ROLES: ADMIN & CO_ADMIN) */}
      {staffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0D12]/90 p-4 overflow-y-auto">
          <div className="bg-[#111622] rounded-2xl p-5 sm:p-6 max-w-md w-full border border-[#D4AF37]/35 shadow-2xl space-y-4">
            <div>
              <span className="text-[10px] font-bold text-[#F5D061] uppercase tracking-wider">
                Super Admin Appointment
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Appoint Admin / Co-Admin
              </h3>
              <p className="text-xs text-slate-400">
                Max {appSettings.maxAdminsPerDistrict} Admins/District and max {appSettings.maxCoAdminsPerState} Co-Admins/State.
              </p>
            </div>

            {staffQuotaError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs font-semibold">
                {staffQuotaError}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Role *</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as 'ADMIN' | 'CO_ADMIN')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
                >
                  <option value="ADMIN">Admin (Max {appSettings.maxAdminsPerDistrict} per District)</option>
                  <option value="CO_ADMIN">Co-Admin (Max {appSettings.maxCoAdminsPerState} per State)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Enter full legal name"
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">CNIC Number *</label>
                <input
                  type="text"
                  required
                  value={staffCnic}
                  onChange={(e) => setStaffCnic(e.target.value)}
                  placeholder="35201-1234567-1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white font-mono"
                />
              </div>

              <SearchableLocationSelect
                value={staffLocation}
                onChange={setStaffLocation}
                label="Assigned District / City across Pakistan"
                required
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStaffModalOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white font-medium cursor-pointer"
                >
                  {translate(language, 'cancel')}
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl font-extrabold kc-gold-button cursor-pointer">
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
