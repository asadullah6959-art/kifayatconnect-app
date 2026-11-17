import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Camera
} from 'lucide-react';
import { 
  PROVINCE_OPTIONS, 
  getDistrictsForProvince, 
  getTehsilsForDistrict, 
  getSampleUCsForDistrict, 
  getMajorCitiesForDistrict,
  COUNTRIES
} from '../../data/locationData';
import { SearchableLocationSelect } from '../common/SearchableLocationSelect';
import { LuxurySelect } from '../common/LuxurySelect';
import { BrandEmblem3D } from '../common/BrandEmblem3D';
import { TabbarBadge } from '../common/TabbarBadge';
import {
  verifyEmailOTP,
  getPendingEmailOTP,
  clearPendingEmailOTP,
  findExistingFirestoreUserByEmail
} from '../../services/firebase';
import { compressAvatarFile } from '../../utils/imageCompression';
import { translate } from '../../data/translations';
import {
  TABBAR_CLANS,
  CUSTOM_TABBAR_ID,
  getTabbarById,
  transliterateTabbarToUrdu
} from '../../data/tabbars';
import {
  formatCnicDisplay,
  isValid13DigitCnic,
  getCnicLockAlertMessage
} from '../../utils/cnic';

import { User } from '../../types';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  completeProfileUser?: User | null;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, completeProfileUser }) => {
  const { registerMember, requestOTP, language, isOnline } = useApp();
  const isCompletingExistingProfile = Boolean(completeProfileUser);

  // 3-Step Flow: STEP 1 (OTP Verify Email) -> STEP 2 (Create & Confirm Password) -> STEP 3 (Community Profile & Location)
  const [step, setStep] = useState<1 | 2 | 3>(() => (completeProfileUser ? 3 : 1));

  const [email, setEmail] = useState(() => completeProfileUser?.email || getPendingEmailOTP()?.email || '');
  const [otpSent, setOtpSent] = useState(() => Boolean(getPendingEmailOTP()));
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const [applicantName, setApplicantName] = useState(() => completeProfileUser?.name || '');
  const [phone, setPhone] = useState(() => completeProfileUser?.phone || '+92 300 ');
  const [cnic, setCnic] = useState(() => completeProfileUser?.cnic || '');

  // Administrative Location Hierarchy (100% preserved)
  const [country, setCountry] = useState(() => completeProfileUser?.country || 'Pakistan');
  const [stateProvince, setStateProvince] = useState(() => completeProfileUser?.stateProvince || 'Punjab');
  const [district, setDistrict] = useState(() => completeProfileUser?.district || 'Lahore');
  const [tehsil, setTehsil] = useState(() => completeProfileUser?.tehsil || 'Model Town');
  const [cityTown, setCityTown] = useState(() => completeProfileUser?.cityTown || 'Lahore');
  const [unionCouncil, setUnionCouncil] = useState(() => completeProfileUser?.unionCouncil || 'UC-112 Model Town');
  const [address, setAddress] = useState(() => completeProfileUser?.address || '');
  const [tabbarSelection, setTabbarSelection] = useState<string>(() => {
    if (!completeProfileUser) return '';
    if (completeProfileUser.tabbarId) {
      return getTabbarById(completeProfileUser.tabbarId)?.id || CUSTOM_TABBAR_ID;
    }
    if (completeProfileUser.tabbarEnglish || completeProfileUser.tabbarUrdu) {
      return getTabbarById(completeProfileUser.tabbarEnglish)?.id || CUSTOM_TABBAR_ID;
    }
    return '';
  });
  const [customTabbarEnglish, setCustomTabbarEnglish] = useState(() =>
    completeProfileUser?.tabbarId === CUSTOM_TABBAR_ID || !getTabbarById(completeProfileUser?.tabbarId)
      ? completeProfileUser?.tabbarEnglish || ''
      : ''
  );
  const [customTabbarUrdu, setCustomTabbarUrdu] = useState(() =>
    completeProfileUser?.tabbarId === CUSTOM_TABBAR_ID || !getTabbarById(completeProfileUser?.tabbarId)
      ? completeProfileUser?.tabbarUrdu || ''
      : ''
  );
  const [tabbarError, setTabbarError] = useState('');
  const [cnicError, setCnicError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(() => completeProfileUser?.avatarUrl || completeProfileUser?.photoUrl || '');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [isOldMember, setIsOldMember] = useState(false);
  const [oldMembershipNo, setOldMembershipNo] = useState('');

  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    if (isOpen && completeProfileUser) {
      setStep(3);
      setEmail(completeProfileUser.email || '');
      if (completeProfileUser.name && completeProfileUser.name !== 'Registered Member') {
        setApplicantName(completeProfileUser.name);
      }
      if (completeProfileUser.phone) setPhone(completeProfileUser.phone);
      if (completeProfileUser.cnic) setCnic(completeProfileUser.cnic);
      if (completeProfileUser.country) setCountry(completeProfileUser.country);
      if (completeProfileUser.stateProvince) setStateProvince(completeProfileUser.stateProvince);
      if (completeProfileUser.district) setDistrict(completeProfileUser.district);
      if (completeProfileUser.tehsil) setTehsil(completeProfileUser.tehsil);
      if (completeProfileUser.cityTown) setCityTown(completeProfileUser.cityTown);
      if (completeProfileUser.unionCouncil) setUnionCouncil(completeProfileUser.unionCouncil);
      if (completeProfileUser.address) setAddress(completeProfileUser.address);
      if (completeProfileUser.tabbarId || completeProfileUser.tabbarEnglish || completeProfileUser.tabbarUrdu) {
        const matched = getTabbarById(completeProfileUser.tabbarId || completeProfileUser.tabbarEnglish);
        if (matched) {
          setTabbarSelection(matched.id);
        } else {
          setTabbarSelection(CUSTOM_TABBAR_ID);
          setCustomTabbarEnglish(completeProfileUser.tabbarEnglish || '');
          setCustomTabbarUrdu(completeProfileUser.tabbarUrdu || '');
        }
      }
      if (completeProfileUser.avatarUrl || completeProfileUser.photoUrl) {
        setAvatarUrl(completeProfileUser.avatarUrl || completeProfileUser.photoUrl || '');
      }
    } else if (isOpen && !completeProfileUser) {
      setStep(1);
    }
  }, [isOpen, completeProfileUser]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError('');
    setPhotoUploading(true);
    try {
      const compressed = await compressAvatarFile(file);
      setAvatarUrl(compressed.dataUrl);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Unable to optimize profile photo.');
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  const handleProvinceChange = (newProvince: string) => {
    setStateProvince(newProvince);
    const availableDistricts = getDistrictsForProvince(newProvince);
    const newDistrict = availableDistricts[0] || '';
    setDistrict(newDistrict);
    
    const availableTehsils = getTehsilsForDistrict(newProvince, newDistrict);
    setTehsil(availableTehsils[0] || '');
    
    const cities = getMajorCitiesForDistrict(newProvince, newDistrict);
    setCityTown(cities[0] || newDistrict);

    const ucs = getSampleUCsForDistrict(newProvince, newDistrict);
    setUnionCouncil(ucs[0] || 'UC-01 Central');
  };

  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict);
    const availableTehsils = getTehsilsForDistrict(stateProvince, newDistrict);
    setTehsil(availableTehsils[0] || '');

    const cities = getMajorCitiesForDistrict(stateProvince, newDistrict);
    setCityTown(cities[0] || newDistrict);

    const ucs = getSampleUCsForDistrict(stateProvince, newDistrict);
    setUnionCouncil(ucs[0] || 'UC-01 Central');
  };

  if (!isOpen) return null;

  const handleSendSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');
    setOtpLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const existingCloud = await findExistingFirestoreUserByEmail(cleanEmail).catch(() => null);
      if (existingCloud && (existingCloud.passwordHash || existingCloud.hasPassword) && existingCloud.profileCompleted) {
        setOtpError(
          language === 'ur'
            ? 'یہ ای میل پہلے سے رجسٹرڈ ہے۔ لاگ ان اسکرین پر جا کر ای میل اور پاس ورڈ سے براہِ راست سائن ان کریں۔'
            : 'This email already has a registered account with a password. Please close this window and sign in directly using Email + Password.'
        );
        return;
      }
      const res = await requestOTP(cleanEmail);
      if (res.success) {
        setOtpSent(true);
        setOtpSuccess(res.message);
      } else {
        setOtpError(res.message);
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');
    const cleanOtp = otpCode.replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setOtpError('Please enter the 6-digit verification code sent to your email.');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await verifyEmailOTP(email.trim().toLowerCase(), cleanOtp);
      if (res.success) {
        clearPendingEmailOTP();
        setOtpSuccess(res.message);
        setStep(2);
      } else {
        setOtpError(res.message);
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const handleConfirmPasswordStep = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    if (password.trim().length < 6) {
      setPwdError('Password must be at least 6 characters long.');
      return;
    }
    if (password.trim() !== confirmPassword.trim()) {
      setPwdError('Passwords do not match. Please enter the same password twice.');
      return;
    }
    setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTabbarError('');
    setCnicError('');
    if (!applicantName.trim()) return;
    if (!isValid13DigitCnic(cnic)) {
      setCnicError(getCnicLockAlertMessage(language));
      return;
    }

    const selectedClan = getTabbarById(tabbarSelection);
    let finalTabbarId = '';
    let finalTabbarEnglish = '';
    let finalTabbarUrdu = '';

    if (selectedClan) {
      finalTabbarId = selectedClan.id;
      finalTabbarEnglish = selectedClan.englishName;
      finalTabbarUrdu = selectedClan.urduName;
    } else if (tabbarSelection === CUSTOM_TABBAR_ID) {
      const eng = customTabbarEnglish.trim();
      const ur = customTabbarUrdu.trim() || transliterateTabbarToUrdu(eng);
      if (!eng && !ur) {
        setTabbarError(translate(language, 'tabbarRequiredError'));
        return;
      }
      finalTabbarId = CUSTOM_TABBAR_ID;
      finalTabbarEnglish = eng || ur;
      finalTabbarUrdu = ur || eng;
    } else {
      setTabbarError(translate(language, 'tabbarRequiredError'));
      return;
    }

    await registerMember({
      applicantName: applicantName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      cnic: cnic.trim(),
      country,
      stateProvince,
      district,
      tehsil,
      cityTown,
      unionCouncil,
      address: address.trim(),
      tabbarId: finalTabbarId,
      tabbarUrdu: finalTabbarUrdu,
      tabbarEnglish: finalTabbarEnglish,
      isOldMember,
      oldMembershipNo: isOldMember ? oldMembershipNo.trim() : undefined,
      password: password.trim(),
      avatarUrl: avatarUrl || undefined
    });

    const resetFormFields = () => {
      setStep(1);
      setApplicantName('');
      setEmail('');
      setOtpCode('');
      setOtpSent(false);
      setPassword('');
      setConfirmPassword('');
      setPhone('+92 300 ');
      setCnic('');
      setAddress('');
      setTabbarSelection('');
      setCustomTabbarEnglish('');
      setCustomTabbarUrdu('');
      setTabbarError('');
      setAvatarUrl('');
      setPhotoError('');
      setIsOldMember(false);
      setOldMembershipNo('');
    };

    if (!isCompletingExistingProfile) {
      resetFormFields();
      onClose();
      return;
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
      resetFormFields();
    }, 1200);
  };

  const availableDistricts = getDistrictsForProvince(stateProvince);
  const availableTehsils = getTehsilsForDistrict(stateProvince, district);
  const sampleUCs = getSampleUCsForDistrict(stateProvince, district);

  const previewTabbar =
    tabbarSelection === CUSTOM_TABBAR_ID
      ? {
          tabbarId: CUSTOM_TABBAR_ID,
          tabbarEnglish: customTabbarEnglish.trim(),
          tabbarUrdu: customTabbarUrdu.trim() || transliterateTabbarToUrdu(customTabbarEnglish),
        }
      : tabbarSelection
      ? { tabbarId: tabbarSelection }
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-[#0A0D12]/90 p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#111622] border border-[#D4AF37]/35 rounded-2xl shadow-2xl my-auto max-h-[92dvh] flex flex-col overflow-hidden text-xs text-white">
        {/* Sticky Header */}
        <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-[#D4AF37]/20 bg-[#111622] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BrandEmblem3D size="sm" />
              <div>
                <h3 className="text-base font-extrabold kc-gold-gradient-text">
                  {isCompletingExistingProfile
                    ? (language === 'ur' ? 'اپنی ممبر پروفائل مکمل کریں' : 'Complete Your Member Profile')
                    : translate(language, 'registerBtn')}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {step === 1
                    ? translate(language, 'step1VerifyEmail')
                    : step === 2
                    ? translate(language, 'step2CreatePassword')
                    : translate(language, 'step3CompleteProfile')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-[#161D2C] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[1, 2, 3].map(idx => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-colors ${
                  step >= idx ? 'bg-gradient-to-r from-[#D4AF37] to-[#F5D061]' : 'bg-[#161D2C]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ WebkitOverflowScrolling: 'touch' }}>

        {submitted ? (
          <div className="py-10 text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
            <h4 className="font-bold text-base text-white">
              {language === 'ur' ? 'اکاؤنٹ کامیابی سے بن گیا!' : `Welcome to Kifayat Connect (${district})!`}
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {language === 'ur'
                ? 'آپ کا اکاؤنٹ اور پاس ورڈ محفوظ کر لیا گیا ہے اور آپ کی درخواست ضلع کی منظوری کے لیے بھیج دی گئی ہے۔'
                : 'Your verified account and password are saved, and your application has entered District verification.'}
            </p>
          </div>
        ) : step === 1 ? (
          /* STEP 1: One-Time Email Verification via Working 6-Digit EmailJS OTP */
          <div className="space-y-4">
            <div className="p-2.5 rounded-xl bg-[#131C31] border border-[#38BDF8]/40 text-[11px] text-[#38BDF8] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#38BDF8] shrink-0" />
              <span>{translate(language, 'oneTimeOtpBadge')}</span>
            </div>
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
              <form onSubmit={handleSendSignupOtp} className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    {translate(language, 'emailLabel')} *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="name@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#0A0D12] border border-[#D4AF37]/30 rounded-xl text-xs text-white placeholder-slate-500 focus:border-[#F5D061] outline-none"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute end-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={otpLoading || !isOnline}
                  className="w-full py-2.5 px-4 kc-gold-button font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {otpLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{translate(language, 'sendOtpBtn')}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifySignupOtp} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-300">
                      {translate(language, 'otpCodeLabel')}
                    </label>
                    <span className="text-[10px] text-[#F5D061]">{email}</span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••••"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[0.5em] text-lg font-mono px-3 py-2.5 bg-[#0A0D12] border border-[#D4AF37]/50 rounded-xl text-[#F5D061] outline-none font-bold"
                  />
                </div>
                <div className="flex justify-between text-[11px]">
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
                    onClick={handleSendSignupOtp}
                    className="text-[#F5D061] hover:underline cursor-pointer"
                  >
                    {translate(language, 'resendOtpBtn')}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full py-2.5 px-4 kc-gold-button font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  {otpLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{translate(language, 'step2CreatePassword')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        ) : step === 2 ? (
          /* STEP 2: Create Password & Confirm Password */
          <form onSubmit={handleConfirmPasswordStep} className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {language === 'ur'
                  ? `${email} کی تصدیق ہو گئی! فوری لاگ ان کے لیے پاس ورڈ مقرر کریں۔`
                  : `${email} verified! Set your account password for quick login.`}
              </span>
            </div>

            {pwdError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                {translate(language, 'passwordLabel')} {language === 'ur' ? '(کم از کم 6 حروف)' : '(min 6 chars)'} *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pe-9 bg-[#0A0D12] border border-[#D4AF37]/30 rounded-xl text-xs text-white focus:border-[#F5D061] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                {translate(language, 'confirmPasswordLabel')} *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0A0D12] border border-[#D4AF37]/30 rounded-xl text-xs text-white focus:border-[#F5D061] outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 kc-gold-button font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{translate(language, 'step3CompleteProfile')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          /* STEP 3: Full Community Profile + Compressed Photo Upload + Searchable Pakistan Districts/Cities */
          <form id="kc-register-step3-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Profile Photo Upload above Applicant Full Name */}
            <div className="p-3.5 rounded-xl bg-[#0A0D12] border border-[#D4AF37]/30 flex items-center gap-3.5">
              <div className="relative w-16 h-16 rounded-full bg-[#161D2C] border-2 border-[#D4AF37]/60 overflow-hidden shrink-0 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Applicant Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-[#D4AF37]/70" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-xs font-bold text-[#F5D061]">
                  {language === 'ur' ? 'پروفائل تصویر' : 'Profile Photo'}{' '}
                  <span className="text-[10px] text-slate-400 font-normal">
                    {language === 'ur' ? '(اختیاری · خودکار کمپریسڈ 200×200)' : '(Optional · Auto-compressed 200×200 <35KB)'}
                  </span>
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg kc-gold-button text-[11px] font-bold cursor-pointer">
                    {photoUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                    <span>
                      {avatarUrl
                        ? (language === 'ur' ? 'تصویر تبدیل کریں' : 'Change Photo')
                        : (language === 'ur' ? 'تصویر اپ لوڈ کریں' : 'Upload Photo')}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold"
                    >
                      {language === 'ur' ? 'ہٹائیں' : 'Remove'}
                    </button>
                  )}
                </div>
                {photoError && <p className="text-[11px] text-rose-400">{photoError}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  {language === 'ur' ? 'درخواست گزار کا مکمل نام *' : 'Applicant Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'ur' ? 'مثال: محمد عثمان' : 'e.g. Muhammad Usman'}
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D4AF37]/30 rounded-xl bg-[#0A0D12] text-xs text-white outline-none focus:border-[#F5D061]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <label className="font-semibold text-slate-300">
                    {language === 'ur' ? 'قومی شناختی کارڈ نمبر (13 ہندسے لازمی) *' : '13-Digit National ID (CNIC) *'}
                  </label>
                  {isValid13DigitCnic(cnic) && (
                    <span className="text-[10px] text-emerald-400 font-bold">
                      {language === 'ur' ? 'درست ✓' : 'Valid ✓'}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="35201-1234567-1"
                  value={cnic}
                  onChange={(e) => {
                    setCnic(formatCnicDisplay(e.target.value));
                    setCnicError('');
                  }}
                  className={`w-full px-3 py-2 font-mono border rounded-xl bg-[#0A0D12] text-xs text-white outline-none focus:border-[#F5D061] ${
                    cnicError ? 'border-rose-500/70' : isValid13DigitCnic(cnic) ? 'border-emerald-500/60' : 'border-[#D4AF37]/30'
                  }`}
                />
                {cnicError && (
                  <p className="text-[11px] text-rose-400 font-semibold mt-1 flex items-start gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{cnicError}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  {language === 'ur' ? 'موبائل / فون نمبر *' : 'Phone Number *'}
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D4AF37]/30 rounded-xl bg-[#0A0D12] text-xs text-white outline-none focus:border-[#F5D061]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  {language === 'ur' ? 'تصدیق شدہ ای میل' : 'Verified Email'}
                </label>
                <input
                  type="email"
                  readOnly
                  value={email}
                  className="w-full px-3 py-2 border border-[#38BDF8]/40 rounded-xl bg-[#131C31] text-xs text-[#38BDF8]"
                />
              </div>
            </div>

            {/* Tabbar / Branch / Clan Selection (Black & Royal Gold) */}
            <div className="p-3.5 bg-[#0A0D12] rounded-xl border border-[#D4AF37]/35 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="font-bold text-[#F5D061] text-xs">
                  {translate(language, 'tabbarLabel')} *
                </label>
                {previewTabbar && (previewTabbar.tabbarId !== CUSTOM_TABBAR_ID || previewTabbar.tabbarEnglish || previewTabbar.tabbarUrdu) && (
                  <TabbarBadge
                    tabbarId={previewTabbar.tabbarId}
                    tabbarEnglish={previewTabbar.tabbarEnglish}
                    tabbarUrdu={previewTabbar.tabbarUrdu}
                    language={language}
                    compact
                  />
                )}
              </div>

              <LuxurySelect
                label={translate(language, 'tabbarShortLabel')}
                value={tabbarSelection}
                onChange={(val) => {
                  setTabbarSelection(val);
                  setTabbarError('');
                }}
                options={[
                  { value: '', label: translate(language, 'tabbarSelectPlaceholder') },
                  ...TABBAR_CLANS.map((clan) => ({
                    value: clan.id,
                    label: `${clan.emblem} ${clan.urduName} — ${clan.englishName}`
                  })),
                  { value: CUSTOM_TABBAR_ID, label: `🏛️ ${translate(language, 'tabbarOtherOption')}` }
                ]}
                searchable
                compact
              />

              {tabbarSelection === CUSTOM_TABBAR_ID && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      {translate(language, 'tabbarCustomEnglishLabel')} *
                    </label>
                    <input
                      type="text"
                      value={customTabbarEnglish}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomTabbarEnglish(val);
                        setCustomTabbarUrdu(transliterateTabbarToUrdu(val));
                        setTabbarError('');
                      }}
                      placeholder="e.g. Yousafzai / Khan Khel"
                      className="w-full px-3 py-2 border border-[#D4AF37]/30 rounded-xl bg-[#111622] text-xs text-white focus:border-[#F5D061] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      {translate(language, 'tabbarCustomUrduLabel')} *
                    </label>
                    <input
                      type="text"
                      value={customTabbarUrdu}
                      onChange={(e) => {
                        setCustomTabbarUrdu(e.target.value);
                        setTabbarError('');
                      }}
                      placeholder="مثال: یوسفزئی"
                      className="w-full px-3 py-2 border border-[#D4AF37]/30 rounded-xl bg-[#111622] text-xs text-[#F5D061] font-urdu-auto focus:border-[#F5D061] outline-none"
                    />
                  </div>
                </div>
              )}

              {tabbarError && (
                <p className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{tabbarError}</span>
                </p>
              )}
            </div>

            {/* Preserved Administrative Location Hierarchy */}
            <div className="p-3.5 bg-[#0A0D12] rounded-xl border border-[#D4AF37]/25 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#F5D061] pb-2 border-b border-[#D4AF37]/15">
                <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>
                  {language === 'ur' ? 'پاکستان لوکیشن (تمام اضلاع اور شہر)' : 'Pakistan Location (All Districts & Cities)'}
                </span>
              </div>

              <SearchableLocationSelect
                label={language === 'ur' ? 'شہر، تحصیل یا ضلع فوری تلاش کریں' : 'Quick Search Any City, Tehsil, or District'}
                value={{ stateProvince, district, cityTown, tehsil }}
                onChange={(loc) => {
                  setStateProvince(loc.stateProvince);
                  setDistrict(loc.district);
                  setCityTown(loc.cityTown);
                  if (loc.tehsil) setTehsil(loc.tehsil);
                  const ucs = getSampleUCsForDistrict(loc.stateProvince, loc.district);
                  setUnionCouncil(ucs[0] || 'UC-01 Central');
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    {language === 'ur' ? 'ملک' : 'Country'}
                  </label>
                  <LuxurySelect
                    label={language === 'ur' ? 'ملک' : 'Country'}
                    value={country}
                    onChange={setCountry}
                    options={COUNTRIES}
                    compact
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    {language === 'ur' ? 'صوبہ / ریاست *' : 'State / Province *'}
                  </label>
                  <LuxurySelect
                    label={language === 'ur' ? 'صوبہ / ریاست' : 'State / Province'}
                    value={stateProvince}
                    onChange={handleProvinceChange}
                    options={PROVINCE_OPTIONS}
                    compact
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    {language === 'ur' ? 'ضلع *' : 'District *'}
                  </label>
                  <LuxurySelect
                    label={language === 'ur' ? 'ضلع' : 'District'}
                    value={district}
                    onChange={handleDistrictChange}
                    options={[...availableDistricts, 'Other / Village']}
                    searchable
                    compact
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    {language === 'ur' ? 'تحصیل / سب ڈویژن *' : 'Tehsil / Sub-Division *'}
                  </label>
                  <input
                    type="text"
                    required
                    list="tehsils-list"
                    value={tehsil}
                    onChange={(e) => setTehsil(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#D4AF37]/30 rounded-lg bg-[#111622] text-xs text-white"
                  />
                  <datalist id="tehsils-list">
                    {availableTehsils.map(t => <option key={t} value={t} />)}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    {language === 'ur' ? 'شہر / قصبہ *' : 'City / Town *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={cityTown}
                    onChange={(e) => setCityTown(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#D4AF37]/30 rounded-lg bg-[#111622] text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    {language === 'ur' ? 'یونین کونسل (UC) *' : 'Union Council (UC) *'}
                  </label>
                  <input
                    type="text"
                    required
                    list="ucs-list"
                    value={unionCouncil}
                    onChange={(e) => setUnionCouncil(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#D4AF37]/30 rounded-lg bg-[#111622] text-xs text-white"
                  />
                  <datalist id="ucs-list">
                    {sampleUCs.map(uc => <option key={uc} value={uc} />)}
                  </datalist>
                </div>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                {language === 'ur' ? 'مستقل رہائشی پتہ *' : 'Permanent Residential Address *'}
              </label>
              <textarea
                required
                rows={2}
                placeholder={language === 'ur' ? 'مکان نمبر / گلی / سیکٹر / شہر...' : 'House / Street / Sector / City...'}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 border border-[#D4AF37]/30 rounded-xl bg-[#0A0D12] text-xs text-white resize-none"
              />
            </div>

            <div className="p-3 bg-[#0A0D12] rounded-xl border border-[#D4AF37]/20">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOldMember}
                  onChange={(e) => setIsOldMember(e.target.checked)}
                  className="rounded text-[#D4AF37]"
                />
                <span className="font-semibold text-slate-200">
                  {language === 'ur'
                    ? 'میں پرانے مینوئل رجسٹر کا پہلے سے موجود ممبر ہوں'
                    : 'I am an existing member from the old manual register'}
                </span>
              </label>

              {isOldMember && (
                <div className="mt-2 pt-2 border-t border-[#D4AF37]/15">
                  <input
                    type="text"
                    required={isOldMember}
                    placeholder={language === 'ur' ? 'سابقہ مینوئل آئی ڈی مثال: OLD-LHR-1984' : 'Previous Manual ID e.g. OLD-LHR-1984'}
                    value={oldMembershipNo}
                    onChange={(e) => setOldMembershipNo(e.target.value)}
                    className="w-full px-2.5 py-1.5 font-mono border border-[#D4AF37]/30 rounded-lg bg-[#111622] text-xs text-white"
                  />
                </div>
              )}
            </div>

          </form>
        )}
        </div>

        {/* Sticky Bottom Footer for Step 3 */}
        {!submitted && step === 3 && (
          <div className="px-4 sm:px-6 py-3 border-t border-[#D4AF37]/25 bg-[#0A0D12] flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-[#161D2C] text-slate-300 hover:text-white font-semibold cursor-pointer"
            >
              {translate(language, 'cancel')}
            </button>
            <button
              type="submit"
              form="kc-register-step3-form"
              className="flex items-center gap-1.5 px-5 py-2 kc-gold-button font-bold rounded-xl cursor-pointer"
            >
              <span>
                {isCompletingExistingProfile
                  ? (language === 'ur' ? 'محفوظ کریں اور فیچرز کھولیں' : 'Save & Unlock Features')
                  : translate(language, 'completeSignupBtn')}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
