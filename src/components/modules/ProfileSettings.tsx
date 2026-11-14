import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User as UserIcon,
  Lock,
  CheckCircle2,
  IdCard,
  Save,
  Camera,
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { SearchableLocationSelect, SelectedLocationValue } from '../common/SearchableLocationSelect';
import { RoleBadge } from '../common/RoleBadge';
import { compressImageFile } from '../../utils/imageCompression';
import { translate } from '../../data/translations';

export const ProfileSettings: React.FC = () => {
  const {
    currentUser,
    language,
    appSettings,
    updateUserProfile,
    setSelectedCardUser,
    setOrChangeUserPassword
  } = useApp();

  const t = (key: Parameters<typeof translate>[1]) => translate(language, key, appSettings.textOverrides);

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [unionCouncil, setUnionCouncil] = useState(currentUser?.unionCouncil || '');
  const [location, setLocation] = useState<SelectedLocationValue>({
    stateProvince: currentUser?.stateProvince || 'Punjab',
    district: currentUser?.district || 'Lahore',
    cityTown: currentUser?.cityTown || 'Lahore',
    tehsil: currentUser?.tehsil || 'Model Town'
  });

  const [monthlyPledge, setMonthlyPledge] = useState(currentUser?.monthlyPledge || 0);
  const [annualPledge, setAnnualPledge] = useState(currentUser?.annualPledge || 0);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Password security form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdFeedback, setPwdFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

  if (!currentUser) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    try {
      const compressed = await compressImageFile(file, 400, 0.78);
      setAvatarUrl(compressed.dataUrl);
      updateUserProfile({ avatarUrl: compressed.dataUrl });
    } catch (err: any) {
      setAvatarError(err?.message || 'Unable to process selected profile image.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      bio: bio.trim(),
      avatarUrl: avatarUrl || undefined,
      country: 'Pakistan',
      stateProvince: location.stateProvince,
      district: location.district,
      tehsil: location.tehsil || location.cityTown,
      cityTown: location.cityTown,
      unionCouncil: unionCouncil.trim(),
      monthlyPledge: Number(monthlyPledge),
      annualPledge: Number(annualPledge)
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdFeedback(null);
    if (newPassword.length < 6) {
      setPwdFeedback({
        type: 'err',
        msg: language === 'ur' ? 'پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے۔' : 'Password must be at least 6 characters.'
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdFeedback({
        type: 'err',
        msg: language === 'ur' ? 'پاس ورڈ اور تصدیق یکساں نہیں ہیں۔' : 'Passwords do not match.'
      });
      return;
    }
    setIsUpdatingPwd(true);
    try {
      const res = await setOrChangeUserPassword(currentUser.email, newPassword);
      if (!res.success) {
        setPwdFeedback({ type: 'err', msg: res.message || 'Could not update password.' });
      } else {
        setNewPassword('');
        setConfirmPassword('');
        setPwdFeedback({
          type: 'ok',
          msg: language === 'ur'
            ? 'پاس ورڈ محفوظ ہو گیا! اب آپ ای میل اور پاس ورڈ سے لاگ ان کر سکتے ہیں۔'
            : 'Password saved! You can now sign in with Gmail + Password.'
        });
      }
    } finally {
      setIsUpdatingPwd(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#D4AF37]/20">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">
              {language === 'ur' ? 'شناخت اور پروفائل' : 'Identity & Profile'}
            </span>
            <RoleBadge role={currentUser.role} isFounder={currentUser.isFounder} compact />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <UserIcon className="w-6 h-6 text-[#D4AF37]" />
            <span>{t('navProfile')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'ur'
              ? 'اپنی پروفائل تصویر، پاکستان کا پتہ، رابطہ اور پاس ورڈ اپ ڈیٹ کریں۔'
              : 'Update your profile photo, Pakistan location, contact info, password, and welfare pledge.'}
          </p>
        </div>

        <button
          onClick={() => setSelectedCardUser(currentUser)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#111622] hover:bg-[#192234] text-[#F5D061] text-xs font-bold rounded-xl border border-[#D4AF37]/40 shadow-xs transition-colors self-start sm:self-auto"
        >
          <IdCard className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>{t('viewDigitalId')}</span>
        </button>
      </div>

      {/* Profile Photo & Identity Banner */}
      <div className="p-4 sm:p-5 bg-white dark:bg-[#111622] rounded-xl border border-slate-200 dark:border-[#D4AF37]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={currentUser.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#D4AF37]/60"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#0A0D12] text-[#F5D061] flex items-center justify-center font-bold text-2xl border-2 border-[#D4AF37]/50">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <label className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-gradient-to-br from-[#F5D061] to-[#8A6218] text-[#0A0D12] flex items-center justify-center cursor-pointer shadow-md border-2 border-white dark:border-[#111622]">
              <Camera className="w-3.5 h-3.5" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>

          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</h2>
            <p className="text-xs font-mono text-[#D4AF37] font-semibold">
              {currentUser.membershipId || 'KC-PENDING'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'ur' ? 'تصویر اپ لوڈ کرنے کے لیے کیمرہ دبائیں' : 'Tap the camera icon to upload a compressed profile photo'}
            </p>
            {avatarError && <p className="text-[11px] text-rose-500 mt-1">{avatarError}</p>}
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#0A0D12] border border-slate-200 dark:border-[#D4AF37]/20 text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
          <Lock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>CNIC and Membership ID are audit-protected and verified by leadership.</span>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{language === 'ur' ? 'پروفائل کامیابی سے محفوظ ہو گئی!' : 'Profile updated and synced!'}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111622] rounded-xl border border-slate-200 dark:border-[#D4AF37]/20 p-5 sm:p-6 space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {language === 'ur' ? 'مکمل نام' : 'Full Legal Name'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#0A0D12] text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              National ID (CNIC) - [LOCKED]
            </label>
            <input
              type="text"
              disabled
              value={currentUser.cnic || 'Not linked'}
              className="w-full px-3 py-2.5 font-mono border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-100 dark:bg-[#0A0D12]/60 text-slate-500 text-xs cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {language === 'ur' ? 'ای میل' : 'Contact Email'}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#0A0D12] text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {language === 'ur' ? 'موبائل نمبر' : 'Mobile Phone'}
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 1234567"
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#0A0D12] text-xs text-slate-900 dark:text-white font-mono"
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Short Bio / Community Role
          </label>
          <input
            type="text"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="e.g. Community volunteer in Lahore"
            className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#0A0D12] text-xs text-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SearchableLocationSelect
            value={location}
            onChange={setLocation}
            label="City / Tehsil / District (All Pakistan)"
            required
          />

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
              Union Council / Sector
            </label>
            <input
              type="text"
              value={unionCouncil}
              onChange={(e) => setUnionCouncil(e.target.value)}
              placeholder="e.g. UC-12 Central"
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#0A0D12] text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Street Address / House No.
          </label>
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#0A0D12] text-xs text-slate-900 dark:text-white resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Monthly Welfare Pledge (PKR)
            </label>
            <input
              type="number"
              min={0}
              step={100}
              value={monthlyPledge}
              onChange={(e) => setMonthlyPledge(Number(e.target.value))}
              className="w-full px-3 py-2.5 font-mono font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#0A0D12] text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Annual Welfare Pledge (PKR)
            </label>
            <input
              type="number"
              min={0}
              step={500}
              value={annualPledge}
              onChange={(e) => setAnnualPledge(Number(e.target.value))}
              className="w-full px-3 py-2.5 font-mono font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#0A0D12] text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-[#F5D061] via-[#D4AF37] to-[#8A6218] text-[#0A0D12] font-extrabold rounded-xl shadow-xs hover:brightness-110 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{t('saveChanges')}</span>
          </button>
        </div>
      </form>

      {/* Account Password Security Card */}
      <form
        onSubmit={handlePasswordSubmit}
        className="bg-white dark:bg-[#111622] rounded-xl border border-slate-200 dark:border-[#D4AF37]/25 p-5 sm:p-6 space-y-4 text-xs"
      >
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'ur' ? 'اکاؤنٹ پاس ورڈ سیکیورٹی' : 'Account Password Security'}
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#D4AF37]">
            {currentUser.hasPassword ? 'Password Set' : 'No Password Yet'}
          </span>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {language === 'ur'
            ? 'ای میل اور پاس ورڈ کے ذریعے تیز لاگ ان کے لیے اپنا پاس ورڈ مقرر یا تبدیل کریں۔'
            : 'Set or update a password so you can sign in anytime using Gmail + Password without needing an OTP every session.'}
        </p>

        {pwdFeedback && (
          <div
            className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
              pwdFeedback.type === 'ok'
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
            }`}
          >
            {pwdFeedback.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{pwdFeedback.msg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {language === 'ur' ? 'نیا پاس ورڈ' : 'New Password'}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#0A0D12] text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {language === 'ur' ? 'پاس ورڈ کی تصدیق کریں' : 'Confirm Password'}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#0A0D12] text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUpdatingPwd}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0A0D12] hover:bg-slate-800 text-[#F5D061] border border-[#D4AF37]/40 font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{isUpdatingPwd ? 'Saving...' : currentUser.hasPassword ? 'Update Password' : 'Create Password'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
