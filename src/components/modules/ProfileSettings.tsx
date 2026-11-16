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
  AlertCircle,
  Share2
} from 'lucide-react';
import { SearchableLocationSelect, SelectedLocationValue } from '../common/SearchableLocationSelect';
import { RoleBadge } from '../common/RoleBadge';
import { TabbarBadge, FaizKhelVipCrownIcon } from '../common/TabbarBadge';
import { isFaizKhelUser } from '../../utils/dastoor';
import { LuxurySelect } from '../common/LuxurySelect';
import { compressAvatarFile } from '../../utils/imageCompression';
import { translate } from '../../data/translations';
import {
  TABBAR_CLANS,
  CUSTOM_TABBAR_ID,
  getTabbarById,
  transliterateTabbarToUrdu
} from '../../data/tabbars';

export const ProfileSettings: React.FC = () => {
  const {
    currentUser,
    language,
    appSettings,
    updateUserProfile,
    setSelectedCardUser,
    setOrChangeUserPassword,
    triggerShareForIphone
  } = useApp();

  const t = (key: Parameters<typeof translate>[1]) => translate(language, key, appSettings.textOverrides);

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [cnic, setCnic] = useState(currentUser?.cnic || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [unionCouncil, setUnionCouncil] = useState(currentUser?.unionCouncil || '');
  const [tabbarSelection, setTabbarSelection] = useState<string>(() => {
    if (!currentUser) return '';
    if (currentUser.tabbarId) {
      return getTabbarById(currentUser.tabbarId)?.id || CUSTOM_TABBAR_ID;
    }
    if (currentUser.tabbarEnglish || currentUser.tabbarUrdu) {
      return getTabbarById(currentUser.tabbarEnglish)?.id || CUSTOM_TABBAR_ID;
    }
    return '';
  });
  const [customTabbarEnglish, setCustomTabbarEnglish] = useState(() =>
    currentUser?.tabbarId === CUSTOM_TABBAR_ID || !getTabbarById(currentUser?.tabbarId)
      ? currentUser?.tabbarEnglish || ''
      : ''
  );
  const [customTabbarUrdu, setCustomTabbarUrdu] = useState(() =>
    currentUser?.tabbarId === CUSTOM_TABBAR_ID || !getTabbarById(currentUser?.tabbarId)
      ? currentUser?.tabbarUrdu || ''
      : ''
  );
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
      const compressed = await compressAvatarFile(file);
      setAvatarUrl(compressed.dataUrl);
      updateUserProfile({ avatarUrl: compressed.dataUrl, photoUrl: compressed.dataUrl });
    } catch (err: any) {
      setAvatarError(err?.message || 'Unable to process selected profile image.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCnic = (currentUser.cnic || cnic).trim();
    const isCompleted = Boolean(name.trim() && (cleanCnic || address.trim()));

    const selectedClan = getTabbarById(tabbarSelection);
    let finalTabbarId = currentUser.tabbarId;
    let finalTabbarEnglish = currentUser.tabbarEnglish;
    let finalTabbarUrdu = currentUser.tabbarUrdu;

    if (selectedClan) {
      finalTabbarId = selectedClan.id;
      finalTabbarEnglish = selectedClan.englishName;
      finalTabbarUrdu = selectedClan.urduName;
    } else if (tabbarSelection === CUSTOM_TABBAR_ID) {
      const eng = customTabbarEnglish.trim();
      const ur = customTabbarUrdu.trim() || transliterateTabbarToUrdu(eng);
      if (eng || ur) {
        finalTabbarId = CUSTOM_TABBAR_ID;
        finalTabbarEnglish = eng || ur;
        finalTabbarUrdu = ur || eng;
      }
    }

    updateUserProfile({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      cnic: cleanCnic,
      address: address.trim(),
      bio: bio.trim(),
      avatarUrl: avatarUrl || undefined,
      tabbarId: finalTabbarId,
      tabbarEnglish: finalTabbarEnglish,
      tabbarUrdu: finalTabbarUrdu,
      country: 'Pakistan',
      stateProvince: location.stateProvince,
      district: location.district,
      tehsil: location.tehsil || location.cityTown,
      cityTown: location.cityTown,
      unionCouncil: unionCouncil.trim(),
      monthlyPledge: Number(monthlyPledge),
      annualPledge: Number(annualPledge),
      profileCompleted: isCompleted ? true : currentUser.profileCompleted
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#F5D061] uppercase tracking-wider">
              {language === 'ur' ? 'شناخت اور پروفائل' : 'Identity & Profile'}
            </span>
            <RoleBadge
              role={currentUser.role}
              isFounder={currentUser.isFounder}
              isAuditOfficer={Boolean(currentUser.isAuditOfficer)}
              compact
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <UserIcon className="w-6 h-6 text-[#F5D061]" />
            <span>{t('navProfile')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'ur'
              ? 'اپنی پروفائل تصویر، پاکستان کا پتہ، رابطہ اور پاس ورڈ اپ ڈیٹ کریں۔'
              : 'Update your profile photo, Pakistan location, contact info, password, and welfare pledge.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              void triggerShareForIphone();
            }}
            className="kc-pressable flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl border border-[#38BDF8]/55 text-[#38BDF8] hover:text-[#FDE047] hover:border-[#FDE047] shadow-[0_6px_18px_rgba(14,165,233,0.22),inset_0_1px_0_rgba(56,189,248,0.18)] hover:brightness-110 transition-all cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #131C31 0%, #1E293B 55%, #0F172A 100%)',
            }}
          >
            <Share2 className="w-3.5 h-3.5 text-[#FDE047] shrink-0" />
            <span>
              {language === 'ur' ? 'آئی فون کے لیے ایپ لنک شیئر کریں' : 'Share App for iPhone (iOS Link)'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCardUser(currentUser)}
            className="kc-pressable flex items-center gap-1.5 px-4 py-2 bg-[#131C31] hover:bg-[#1E293B] text-[#F5D061] text-xs font-bold rounded-xl border border-slate-400/20 shadow-md transition-colors cursor-pointer"
          >
            <IdCard className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>{t('viewDigitalId')}</span>
          </button>
        </div>
      </div>

      {/* Profile Photo & Identity Banner */}
      <div
        style={
          isFaizKhelUser(currentUser)
            ? {
                background: 'linear-gradient(135deg, #2B1F06 0%, #42300A 52%, #1C1404 100%)',
                boxShadow: '0 10px 28px rgba(212, 175, 55, 0.28), 0 0 16px rgba(253, 224, 71, 0.16), inset 0 1px 0 rgba(254, 240, 138, 0.34)',
              }
            : undefined
        }
        className={`relative overflow-hidden p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isFaizKhelUser(currentUser) ? 'border-[1.5px] border-[#FDE047]' : 'kc-obsidian-card'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={currentUser.name}
                className={`w-16 h-16 rounded-2xl object-cover border-2 ${
                  isFaizKhelUser(currentUser) ? 'border-[#FDE047]' : 'border-[#38BDF8]/65'
                }`}
              />
            ) : (
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl border-2 ${
                  isFaizKhelUser(currentUser)
                    ? 'bg-[#1C1404] text-[#FEF08A] border-[#FDE047]'
                    : 'bg-[#131C31] text-[#38BDF8] border-[#38BDF8]/55'
                }`}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <label className="kc-pressable absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-gradient-to-br from-[#FCE38A] via-[#D4AF37] to-[#8A6218] text-[#090D16] flex items-center justify-center cursor-pointer shadow-md border-2 border-[#0F172A]">
              <Camera className="w-3.5 h-3.5" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isFaizKhelUser(currentUser) && <FaizKhelVipCrownIcon className="w-6 h-6" />}
              <h2 className={`text-base font-bold truncate ${isFaizKhelUser(currentUser) ? 'text-[#FEF08A]' : 'text-[#F8FAFC]'}`}>
                {currentUser.name}
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-mono text-[#F5D061] font-semibold">
                {currentUser.membershipId || 'KC-PENDING'}
              </p>
              <TabbarBadge user={currentUser} language={language} compact />
            </div>
            <p className="text-[11px] text-[#94A3B8]">
              {language === 'ur' ? 'تصویر اپ لوڈ کرنے کے لیے کیمرہ دبائیں' : 'Tap the camera icon to upload a compressed profile photo'}
            </p>
            {avatarError && <p className="text-[11px] text-rose-400 mt-1">{avatarError}</p>}
          </div>
        </div>

        <div className="kc-emerald-panel flex items-start gap-2 p-3 rounded-xl text-[11px] text-[#F8FAFC] max-w-xs">
          <Lock className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
          <span>
            {language === 'ur'
              ? 'شناختی کارڈ اور ممبرشپ آئی ڈی آڈٹ کے تحت محفوظ اور قیادت سے تصدیق شدہ ہیں۔'
              : 'CNIC and Membership ID are audit-protected and verified by leadership.'}
          </span>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 kc-emerald-panel rounded-xl flex items-center gap-2 text-xs text-emerald-200 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{language === 'ur' ? 'پروفائل کامیابی سے محفوظ ہو گئی!' : 'Profile updated and synced!'}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="kc-obsidian-card rounded-2xl p-5 sm:p-6 space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-slate-200 block mb-1">
              {language === 'ur' ? 'مکمل نام' : 'Full Legal Name'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="kc-luxury-input w-full px-3 py-2.5 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-200 block mb-1">
              {currentUser.cnic
                ? (language === 'ur' ? 'قومی شناختی کارڈ (CNIC) - [مقفل]' : 'National ID (CNIC) - [LOCKED]')
                : (language === 'ur' ? 'قومی شناختی کارڈ (CNIC)' : 'National ID (CNIC)')}
            </label>
            <input
              type="text"
              disabled={Boolean(currentUser.cnic)}
              value={currentUser.cnic ? currentUser.cnic : cnic}
              onChange={(e) => setCnic(e.target.value)}
              placeholder="35201-1234567-1"
              className={`w-full px-3 py-2.5 font-mono rounded-xl text-xs ${
                currentUser.cnic
                  ? 'border border-[#D4AF37]/20 bg-[#090D16]/75 text-slate-400 cursor-not-allowed'
                  : 'kc-luxury-input'
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-slate-200 block mb-1">
              {language === 'ur' ? 'ای میل' : 'Contact Email'}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="kc-luxury-input w-full px-3 py-2.5 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-200 block mb-1">
              {language === 'ur' ? 'موبائل نمبر' : 'Mobile Phone'}
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 1234567"
              className="kc-luxury-input w-full px-3 py-2.5 rounded-xl text-xs font-mono"
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-200 block mb-1">
            {language === 'ur' ? 'مختصر تعارف / کمیونٹی کردار' : 'Short Bio / Community Role'}
          </label>
          <input
            type="text"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={language === 'ur' ? 'مثال: لاہور میں کمیونٹی رضاکار' : 'e.g. Community volunteer in Lahore'}
            className="kc-luxury-input w-full px-3 py-2.5 rounded-xl text-xs"
          />
        </div>

        {/* Tabbar / Branch / Clan Selection */}
        <div className="p-3.5 rounded-xl bg-[#090D16] border border-[#D4AF37]/30 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="font-bold text-[#F5D061] text-xs">
              {t('tabbarLabel')}
            </label>
            <TabbarBadge
              tabbarId={tabbarSelection || currentUser.tabbarId}
              tabbarEnglish={
                tabbarSelection === CUSTOM_TABBAR_ID
                  ? customTabbarEnglish.trim()
                  : currentUser.tabbarEnglish
              }
              tabbarUrdu={
                tabbarSelection === CUSTOM_TABBAR_ID
                  ? (customTabbarUrdu.trim() || transliterateTabbarToUrdu(customTabbarEnglish))
                  : currentUser.tabbarUrdu
              }
              language={language}
              compact
            />
          </div>

          <LuxurySelect
            label={t('tabbarShortLabel')}
            value={tabbarSelection}
            onChange={setTabbarSelection}
            options={[
              { value: '', label: t('tabbarSelectPlaceholder') },
              ...TABBAR_CLANS.map((clan) => ({
                value: clan.id,
                label: `${clan.emblem} ${clan.urduName} — ${clan.englishName}`
              })),
              { value: CUSTOM_TABBAR_ID, label: `🏛️ ${t('tabbarOtherOption')}` }
            ]}
            searchable
            compact
          />

          {tabbarSelection === CUSTOM_TABBAR_ID && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  {t('tabbarCustomEnglishLabel')}
                </label>
                <input
                  type="text"
                  value={customTabbarEnglish}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomTabbarEnglish(val);
                    setCustomTabbarUrdu(transliterateTabbarToUrdu(val));
                  }}
                  placeholder="e.g. Yousafzai / Khan Khel"
                  className="kc-luxury-input w-full px-3 py-2 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  {t('tabbarCustomUrduLabel')}
                </label>
                <input
                  type="text"
                  value={customTabbarUrdu}
                  onChange={(e) => setCustomTabbarUrdu(e.target.value)}
                  placeholder="مثال: یوسفزئی"
                  className="kc-luxury-input w-full px-3 py-2 rounded-xl text-xs text-[#F5D061] font-urdu-auto"
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SearchableLocationSelect
            value={location}
            onChange={setLocation}
            label={language === 'ur' ? 'شہر / تحصیل / ضلع (پورا پاکستان)' : 'City / Tehsil / District (All Pakistan)'}
            required
          />

          <div>
            <label className="block text-[11px] font-bold text-[#F5D061] mb-1 uppercase tracking-wider">
              {language === 'ur' ? 'یونین کونسل / سیکٹر' : 'Union Council / Sector'}
            </label>
            <input
              type="text"
              value={unionCouncil}
              onChange={(e) => setUnionCouncil(e.target.value)}
              placeholder="e.g. UC-12 Central"
              className="kc-luxury-input w-full px-3 py-2.5 rounded-xl text-xs"
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-200 block mb-1">
            {language === 'ur' ? 'گلی / مکان نمبر / پتہ' : 'Street Address / House No.'}
          </label>
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="kc-luxury-input w-full p-2.5 rounded-xl text-xs resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#D4AF37]/20">
          <div>
            <label className="font-semibold text-slate-200 block mb-1">
              {language === 'ur' ? 'ماہانہ فلاحی عہد (PKR)' : 'Monthly Welfare Pledge (PKR)'}
            </label>
            <input
              type="number"
              min={0}
              step={100}
              value={monthlyPledge}
              onChange={(e) => setMonthlyPledge(Number(e.target.value))}
              className="kc-luxury-input w-full px-3 py-2.5 font-mono tabular-nums font-bold rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-200 block mb-1">
              {language === 'ur' ? 'سالانہ فلاحی عہد (PKR)' : 'Annual Welfare Pledge (PKR)'}
            </label>
            <input
              type="number"
              min={0}
              step={500}
              value={annualPledge}
              onChange={(e) => setAnnualPledge(Number(e.target.value))}
              className="kc-luxury-input w-full px-3 py-2.5 font-mono tabular-nums font-bold rounded-xl text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-[#D4AF37]/20">
          <button
            type="submit"
            className="kc-pressable kc-gold-button flex items-center gap-1.5 px-5 py-2.5 font-extrabold rounded-xl cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{t('saveChanges')}</span>
          </button>
        </div>
      </form>

      {/* Account Password Security Card */}
      <form
        onSubmit={handlePasswordSubmit}
        className="kc-obsidian-card rounded-2xl p-5 sm:p-6 space-y-4 text-xs"
      >
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#D4AF37]/20">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#F5D061]" />
            <h3 className="text-sm font-bold text-white">
              {language === 'ur' ? 'اکاؤنٹ پاس ورڈ سیکیورٹی' : 'Account Password Security'}
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#F5D061]">
            {currentUser.hasPassword
              ? (language === 'ur' ? 'پاس ورڈ مقرر ہے' : 'Password Set')
              : (language === 'ur' ? 'ابھی پاس ورڈ نہیں' : 'No Password Yet')}
          </span>
        </div>

        <p className="text-[11px] text-slate-400">
          {language === 'ur'
            ? 'ای میل اور پاس ورڈ کے ذریعے تیز لاگ ان کے لیے اپنا پاس ورڈ مقرر یا تبدیل کریں۔'
            : 'Set or update a password so you can sign in anytime using Gmail + Password without needing an OTP every session.'}
        </p>

        {pwdFeedback && (
          <div
            className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
              pwdFeedback.type === 'ok'
                ? 'kc-emerald-panel text-emerald-200'
                : 'bg-rose-950/60 border-rose-500/45 text-rose-200'
            }`}
          >
            {pwdFeedback.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{pwdFeedback.msg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-slate-200 block mb-1">
              {language === 'ur' ? 'نیا پاس ورڈ' : 'New Password'}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={language === 'ur' ? 'کم از کم 6 حروف' : 'Minimum 6 characters'}
              className="kc-luxury-input w-full px-3 py-2.5 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-200 block mb-1">
              {language === 'ur' ? 'پاس ورڈ کی تصدیق کریں' : 'Confirm Password'}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={language === 'ur' ? 'دوبارہ پاس ورڈ درج کریں' : 'Re-enter password'}
              className="kc-luxury-input w-full px-3 py-2.5 rounded-xl text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUpdatingPwd}
            className="kc-pressable flex items-center gap-1.5 px-4 py-2 bg-[#090D16] hover:bg-[#161F33] text-[#F5D061] border border-[#D4AF37]/45 font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>
              {isUpdatingPwd
                ? (language === 'ur' ? 'محفوظ ہو رہا ہے...' : 'Saving...')
                : currentUser.hasPassword
                ? (language === 'ur' ? 'پاس ورڈ تبدیل کریں' : 'Update Password')
                : (language === 'ur' ? 'پاس ورڈ بنائیں' : 'Create Password')}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
