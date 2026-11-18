import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Crown,
  Upload,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Languages,
  PenTool,
  RotateCcw,
  FileCheck2,
  Sparkles,
  UserCheck,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TABBAR_CLANS, CUSTOM_TABBAR_ID, resolveUserTabbar, transliterateTabbarToUrdu } from '../../data/tabbars';
import { PROVINCES_DATA } from '../../data/locationData';
import { BrandEmblem3D } from '../common/BrandEmblem3D';
import { LuxurySelect } from '../common/LuxurySelect';
import { OfficialMoharStamp } from '../common/OfficialMoharStamp';
import {
  formatCnicDisplay,
  isValid13DigitCnic,
  normalizeCnicDigits,
  getCnicLockAlertMessage
} from '../../utils/cnic';

async function compressAvatarFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file'));
      img.onload = () => {
        const maxSide = 420;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function calculateAgeFromDob(dobStr: string): string {
  if (!dobStr) return '';
  const dob = new Date(dobStr);
  if (Number.isNaN(dob.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 && age <= 120 ? String(age) : '';
}

interface RukniyatFormContentProps {
  embedded?: boolean;
  onClose?: () => void;
}

export const RukniyatFormContent: React.FC<RukniyatFormContentProps> = ({ embedded = false, onClose }) => {
  const {
    currentUser,
    language,
    isRukniyatFormOpen,
    inspectedRukniyatApp,
    closeRukniyatForm,
    submitRukniyatForm,
    finalApproveApplication
  } = useApp();

  const [formLang, setFormLang] = useState<'ur' | 'en'>(language === 'ur' ? 'ur' : 'ur');
  const effectiveInspected = embedded ? null : inspectedRukniyatApp;
  const isInspectMode = Boolean(effectiveInspected);
  const canOfficeApprove = Boolean(
    isInspectMode &&
      effectiveInspected &&
      effectiveInspected.status !== 'ACTIVE' &&
      currentUser?.role === 'SUPER_ADMIN'
  );
  const handleClose = onClose || closeRukniyatForm;

  // Header fields
  const [formDate, setFormDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [unit, setUnit] = useState<string>('');
  const [applicantPhotoUrl, setApplicantPhotoUrl] = useState<string>('');

  // Section 1: 17 Personal Info Fields + Location
  const [applicantName, setApplicantName] = useState<string>('');
  const [fatherName, setFatherName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [education, setEducation] = useState<string>('');
  const [experience, setExperience] = useState<string>('');
  const [profession, setProfession] = useState<string>('');
  const [maritalStatus, setMaritalStatus] = useState<string>('Married');
  const [currentArea, setCurrentArea] = useState<string>('');
  const [ancestralArea, setAncestralArea] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [cnic, setCnic] = useState<string>('');
  const [selectedTabbarId, setSelectedTabbarId] = useState<string>('faiz_khel');
  const [customTabbarEnglish, setCustomTabbarEnglish] = useState<string>('');
  const [customTabbarUrdu, setCustomTabbarUrdu] = useState<string>('');
  const [subBranch, setSubBranch] = useState<string>('');
  const [tabarRepName, setTabarRepName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [permanentAddress, setPermanentAddress] = useState<string>('');
  const [stateProvince, setStateProvince] = useState<string>('Khyber Pakhtunkhwa');
  const [district, setDistrict] = useState<string>('Mardan');

  // Section 2: Oath & Signature
  const [monthlyPledgeAmount, setMonthlyPledgeAmount] = useState<string>('100');
  const [oathAccepted, setOathAccepted] = useState<boolean>(true);
  const [sigMode, setSigMode] = useState<'DRAW' | 'TYPE'>('DRAW');
  const [typedSignature, setTypedSignature] = useState<string>('');
  const [drawnSignatureDataUrl, setDrawnSignatureDataUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  // Section 3: Tabar Rep Verification
  const [tabarRepSignature, setTabarRepSignature] = useState<string>('');

  // Section 4: Office Use Only
  const [formFeeAmount, setFormFeeAmount] = useState<string>('100');
  const [officeSecretarySignature, setOfficeSecretarySignature] = useState<string>('');
  const [presidentSignature, setPresidentSignature] = useState<string>('');

  // Submit / Feedback State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [submittedSerial, setSubmittedSerial] = useState<string | null>(null);
  const submitCooldownRef = useRef<number>(0);

  const provinceNames = useMemo(() => Object.keys(PROVINCES_DATA), []);
  const availableDistricts = useMemo(() => {
    return (PROVINCES_DATA[stateProvince]?.districts || []).map((d) => d.name);
  }, [stateProvince]);

  // Populate fields when opening modal or mounting embedded form
  useEffect(() => {
    if (!embedded && !isRukniyatFormOpen) return;
    setErrorMsg('');
    setSubmittedSerial(null);
    setFormLang(language === 'ur' ? 'ur' : 'ur');

    if (effectiveInspected) {
      setFormDate((effectiveInspected.submittedAt || '').split('T')[0] || new Date().toISOString().split('T')[0]);
      setUnit(effectiveInspected.unit || effectiveInspected.district || '');
      setApplicantPhotoUrl(effectiveInspected.applicantPhotoUrl || '');
      setApplicantName(effectiveInspected.applicantName || '');
      setFatherName(effectiveInspected.fatherName || '');
      setPhone(effectiveInspected.phone || '');
      setEmail(effectiveInspected.email || '');
      setEducation(effectiveInspected.education || '');
      setExperience(effectiveInspected.experience || '');
      setProfession(effectiveInspected.profession || '');
      setMaritalStatus(effectiveInspected.maritalStatus || 'Married');
      setCurrentArea(effectiveInspected.currentArea || '');
      setAncestralArea(effectiveInspected.ancestralArea || '');
      setDob(effectiveInspected.dob || '');
      setAge(effectiveInspected.age || '');
      setCnic(formatCnicDisplay(effectiveInspected.cnic));
      setSelectedTabbarId(effectiveInspected.tabbarId || CUSTOM_TABBAR_ID);
      setCustomTabbarEnglish(effectiveInspected.tabbarEnglish || '');
      setCustomTabbarUrdu(effectiveInspected.tabbarUrdu || '');
      setSubBranch(effectiveInspected.subBranch || '');
      setTabarRepName(effectiveInspected.tabarRepName || '');
      setTabarRepSignature(effectiveInspected.tabarRepSignature || '');
      setAddress(effectiveInspected.address || '');
      setPermanentAddress(effectiveInspected.permanentAddress || '');
      setStateProvince(effectiveInspected.stateProvince || 'Khyber Pakhtunkhwa');
      setDistrict(effectiveInspected.district || 'Mardan');
      setMonthlyPledgeAmount(String(effectiveInspected.monthlyPledgeAmount || 100));
      setTypedSignature(
        effectiveInspected.applicantSignature && !effectiveInspected.applicantSignature.startsWith('data:')
          ? effectiveInspected.applicantSignature
          : ''
      );
      setDrawnSignatureDataUrl(
        effectiveInspected.applicantSignature?.startsWith('data:') ? effectiveInspected.applicantSignature : ''
      );
      setFormFeeAmount(String(effectiveInspected.formFeeAmount || 100));
      setOfficeSecretarySignature(effectiveInspected.officeSecretarySignature || '');
      setPresidentSignature(effectiveInspected.presidentSignature || '');
    } else {
      const userTab = resolveUserTabbar(currentUser || undefined);
      setFormDate(new Date().toISOString().split('T')[0]);
      setUnit(currentUser?.district || 'Mardan');
      setApplicantPhotoUrl(currentUser?.photoUrl || currentUser?.avatarUrl || '');
      setApplicantName(currentUser?.name || '');
      setFatherName('');
      setPhone(currentUser?.phone || '');
      setEmail(currentUser?.email || '');
      setEducation('');
      setExperience('');
      setProfession('');
      setMaritalStatus('Married');
      setCurrentArea(currentUser?.cityTown || currentUser?.district || '');
      setAncestralArea('');
      setDob('');
      setAge('');
      setCnic(formatCnicDisplay(currentUser?.cnic));
      setSelectedTabbarId(userTab?.id || 'faiz_khel');
      setCustomTabbarEnglish(userTab?.isCustom ? userTab.englishName : '');
      setCustomTabbarUrdu(userTab?.isCustom ? userTab.urduName : '');
      setSubBranch('');
      setTabarRepName('');
      setTabarRepSignature('');
      setAddress(currentUser?.address || '');
      setPermanentAddress('');
      setStateProvince(currentUser?.stateProvince || 'Khyber Pakhtunkhwa');
      setDistrict(currentUser?.district || 'Mardan');
      setMonthlyPledgeAmount(String(currentUser?.monthlyPledge && currentUser.monthlyPledge >= 100 ? currentUser.monthlyPledge : 100));
      setTypedSignature(currentUser?.name || '');
      setDrawnSignatureDataUrl('');
      setFormFeeAmount('100');
      setOfficeSecretarySignature('');
      setPresidentSignature('');
    }
  }, [embedded, isRukniyatFormOpen, effectiveInspected, currentUser, language]);

  if (!embedded && !isRukniyatFormOpen) return null;

  const isUr = formLang === 'ur';
  const cnicDigitsCount = normalizeCnicDigits(cnic).length;
  const cnicIsValid = isValid13DigitCnic(cnic);
  const displaySerial =
    submittedSerial ||
    effectiveInspected?.serialNumber ||
    effectiveInspected?.generatedMembershipId ||
    (isUr ? 'خودکار (KC-YYYY-XXXX)' : 'Auto (KC-YYYY-XXXX)');

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAvatarFile(file);
      setApplicantPhotoUrl(compressed);
    } catch {
      setErrorMsg(isUr ? 'تصویر اپ لوڈ کرنے میں مسئلہ آیا۔' : 'Could not process selected photo.');
    }
  };

  // Signature canvas pointer helpers
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isInspectMode) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    isDrawingRef.current = true;
    const pt = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#FDE047';
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || isInspectMode) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const pt = getCanvasPoint(e);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      setDrawnSignatureDataUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearSignaturePad = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setDrawnSignatureDataUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInspectMode) return;

    const now = Date.now();
    if (now - submitCooldownRef.current < 500 || isSubmitting) return;
    submitCooldownRef.current = now;
    setErrorMsg('');

    if (!applicantName.trim() || !fatherName.trim() || !phone.trim() || !address.trim()) {
      setErrorMsg(
        isUr
          ? 'براہِ کرم نام، ولدیت، رابطہ نمبر اور موجودہ پتہ لازمی درج کریں۔'
          : 'Please complete Name, Father Name, Contact Number, and Current Address.'
      );
      return;
    }

    if (!cnicIsValid) {
      setErrorMsg(getCnicLockAlertMessage(formLang));
      return;
    }

    if (!oathAccepted) {
      setErrorMsg(
        isUr
          ? 'رکنیت فارم جمع کرانے کے لیے عہد نامہ کی تصدیق ضروری ہے۔'
          : 'Please confirm the Oath (عہد نامہ) declaration before submitting.'
      );
      return;
    }

    const chosenTab =
      selectedTabbarId === CUSTOM_TABBAR_ID
        ? {
            id: CUSTOM_TABBAR_ID,
            englishName: customTabbarEnglish.trim() || customTabbarUrdu.trim() || 'Other Tabbar',
            urduName:
              customTabbarUrdu.trim() ||
              transliterateTabbarToUrdu(customTabbarEnglish.trim() || 'Other Tabbar')
          }
        : resolveUserTabbar({ tabbarId: selectedTabbarId });

    const finalSignature =
      sigMode === 'DRAW'
        ? drawnSignatureDataUrl || typedSignature.trim() || applicantName.trim()
        : typedSignature.trim() || applicantName.trim();

    setIsSubmitting(true);
    try {
      const result = await submitRukniyatForm({
        applicantName,
        fatherName,
        phone,
        email,
        education,
        experience,
        profession,
        maritalStatus,
        currentArea,
        ancestralArea,
        dob,
        age,
        cnic,
        unit: unit || district,
        country: 'Pakistan',
        stateProvince,
        district,
        tehsil: district,
        cityTown: currentArea || district,
        unionCouncil: '',
        tabbarId: chosenTab?.id || selectedTabbarId,
        tabbarEnglish: chosenTab?.englishName,
        tabbarUrdu: chosenTab?.urduName,
        subBranch,
        tabarRepName,
        tabarRepSignature,
        address,
        permanentAddress,
        applicantPhotoUrl,
        applicantSignature: finalSignature,
        monthlyPledgeAmount: Math.max(100, Number(monthlyPledgeAmount) || 100)
      });

      if (!result.success) {
        setErrorMsg(result.error || 'Submission failed.');
      } else {
        setSubmittedSerial(result.serialNumber || null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOfficeApprove = async () => {
    if (!effectiveInspected || !canOfficeApprove) return;
    const now = Date.now();
    if (now - submitCooldownRef.current < 500 || isSubmitting) return;
    submitCooldownRef.current = now;
    setIsSubmitting(true);
    try {
      await finalApproveApplication(
        effectiveInspected.id,
        'Rukniyat Form approved via Office Sign-Off.',
        {
          formFeeAmount: Number(formFeeAmount) || 100,
          officeSecretarySignature: officeSecretarySignature.trim() || currentUser?.name,
          presidentSignature: presidentSignature.trim() || currentUser?.name
        }
      );
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelClass = 'block text-xs font-bold text-amber-200/90 mb-1';
  const inputClass =
    'w-full px-3 py-2.5 bg-[#0A111D] border border-[#D4AF37]/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FDE047] focus:ring-1 focus:ring-[#FDE047]/40 transition';

  const outerWrapperClass = embedded
    ? 'w-full max-w-full flex flex-col bg-[#070D14] border border-[#D4AF37]/50 rounded-3xl shadow-xl overflow-hidden box-border'
    : 'relative w-full max-w-4xl max-h-[94dvh] flex flex-col bg-[#070D14] border border-[#D4AF37]/50 rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden box-border';

  const bodyWrapper = (
      <div className={outerWrapperClass}>
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 px-4 sm:px-6 py-3.5 bg-[#0C1524] border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FDE047] to-[#B45309] flex items-center justify-center text-[#070D14] shadow-md shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-amber-300 tracking-wide truncate">
                {isUr ? 'رکنیت فارم — سوئی خیل قومی اتحاد' : 'RUKNIYAT FORM — SUI KHEL QAUMI ITTEHAD'}
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                {isInspectMode
                  ? `Serial: ${displaySerial} · Status: ${effectiveInspected?.status}`
                  : isUr
                  ? 'بغیر 13 ہندسوں کے شناختی کارڈ کے رکنیت فارم جمع نہیں ہو گا'
                  : 'Mandatory 13-Digit CNIC · Atomic Serial Generation'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setFormLang((prev) => (prev === 'ur' ? 'en' : 'ur'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs font-bold hover:bg-amber-500/25 transition cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5" />
              {isUr ? 'English' : 'اردو'}
            </button>
            {!embedded && (
              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                aria-label="Close Rukniyat Form"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Luxury Paper / Dark Form Body */}
        <div
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5"
          dir={isUr ? 'rtl' : 'ltr'}
        >
          {submittedSerial ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#062E22] via-[#0B1F1C] to-[#070D14] border-2 border-[#D4AF37]/60 text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-emerald-300" />
              </div>
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold mb-2">
                  {isUr ? 'درخواست موصول ہو گئی (زیرِ التواء منظوری)' : 'Submitted — Pending Admin Approval'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {isUr
                    ? 'آپ کا رکنیت فارم کامیابی سے جمع ہو گیا!'
                    : 'Your Rukniyat Form Has Been Submitted!'}
                </h3>
                <p className="text-sm text-slate-300 mt-1">
                  {isUr
                    ? 'سپر ایڈمن کی منظوری کے بعد آپ کا مستقل رکنیت نمبر اور آفیشل رسید فعال ہو جائے گی۔'
                    : 'Your application is queued for Founder / Super Admin approval. Once approved, your official ID & Receipt will unlock automatically.'}
                </p>
              </div>

              <div className="max-w-sm mx-auto p-4 rounded-2xl bg-[#070D14]/90 border border-[#D4AF37]/50">
                <p className="text-[11px] uppercase tracking-wider text-amber-300/80 font-bold">
                  {isUr ? 'رکنیت / سیریل نمبر' : 'Assigned Atomic Serial No.'}
                </p>
                <p className="text-2xl font-mono font-black text-[#FDE047] mt-1 tracking-wider">
                  {submittedSerial}
                </p>
              </div>

              <div className="flex justify-center">
                <OfficialMoharStamp variant="OFFICIAL" serialNumber={submittedSerial} size={112} />
              </div>

              <button
                type="button"
                onClick={() => {
                  setSubmittedSerial(null);
                  if (!embedded) handleClose();
                }}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-[#070D14] font-extrabold text-sm shadow-lg hover:brightness-110 transition cursor-pointer"
              >
                {embedded
                  ? (isUr ? 'نیا رکنیت فارم پُر کریں' : 'Fill Another Rukniyat Form')
                  : (isUr ? 'ڈیش بورڈ پر واپس جائیں' : 'Return to Dashboard')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Official Form Header Card with Circular Emblem */}
              <div className="relative p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-[#0F1B2E] via-[#131C31] to-[#090F1B] border-2 border-[#D4AF37]/60 shadow-xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* Circular Emblem + Organization Title & Motto */}
                  <div className="flex flex-col sm:flex-row items-center gap-3.5 text-center sm:text-start flex-1 min-w-0">
                    <BrandEmblem3D size="md" className="shrink-0" />
                    <div className="space-y-1 min-w-0">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-extrabold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isUr ? 'رکنیت فارم' : 'RUKNIYAT FORM · MEMBERSHIP'}</span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FEF08A] via-[#D4AF37] to-[#FDE047]">
                        سوئی خیل قومی اتحاد
                      </h1>
                      {!isUr && (
                        <p className="text-xs font-bold tracking-widest uppercase text-amber-200/80">
                          Sui Khel Qaumi Ittehad · Kifayat Connect
                        </p>
                      )}
                      <p className="text-xs sm:text-sm font-bold text-emerald-300">
                        {isUr
                          ? 'وحدت  |  خدمت  |  معاونت  |  مصالحت'
                          : 'Unity  |  Service  |  Cooperation  |  Reconciliation'}
                      </p>
                    </div>
                  </div>

                  {/* Meta Row + Dual Camera/Gallery Photo Box */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-3.5 shrink-0">
                    <div className="space-y-2 text-xs min-w-[170px]">
                      <div className="p-2 rounded-xl bg-[#070D14]/80 border border-[#D4AF37]/30">
                        <span className="text-[10px] text-slate-400 block">
                          {isUr ? 'رکنیت / سیریل نمبر' : 'Membership / Serial No.'}
                        </span>
                        <span className="font-mono font-extrabold text-[#FDE047]">
                          {displaySerial}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">
                            {isUr ? 'تاریخ' : 'Date'}
                          </label>
                          <input
                            type="date"
                            value={formDate}
                            disabled={isInspectMode}
                            onChange={(e) => setFormDate(e.target.value)}
                            className="w-full px-2 py-1.5 bg-[#070D14] border border-slate-700 rounded-lg text-[11px] text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">
                            {isUr ? 'یونٹ' : 'Unit'}
                          </label>
                          <input
                            type="text"
                            value={unit}
                            disabled={isInspectMode}
                            onChange={(e) => setUnit(e.target.value)}
                            placeholder={isUr ? 'یونٹ' : 'Unit'}
                            className="w-full px-2 py-1.5 bg-[#070D14] border border-slate-700 rounded-lg text-[11px] text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Applicant Photo Frame + Camera / Gallery Buttons */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <div className="w-24 h-28 rounded-2xl border-2 border-dashed border-[#D4AF37]/60 bg-[#070D14] flex flex-col items-center justify-center overflow-hidden relative">
                        {applicantPhotoUrl ? (
                          <img
                            src={applicantPhotoUrl}
                            alt="Applicant"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-2">
                            <Upload className="w-5 h-5 text-amber-300 mx-auto mb-1" />
                            <span className="text-[10px] font-bold text-amber-200 leading-tight block">
                              {isUr ? 'تصویر لگائیں' : 'Applicant Photo'}
                            </span>
                          </div>
                        )}
                      </div>
                      {!isInspectMode && (
                        <div className="flex items-center gap-1.5">
                          <label className="kc-pressable inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/60 text-[#FEF08A] text-[10px] font-bold cursor-pointer">
                            <Camera className="w-3 h-3" />
                            <span>{isUr ? 'کیمرہ' : 'Camera'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="user"
                              onChange={handlePhotoSelect}
                              className="hidden"
                            />
                          </label>
                          <label className="kc-pressable inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#131C31] border border-[#38BDF8]/50 text-[#38BDF8] text-[10px] font-bold cursor-pointer">
                            <ImageIcon className="w-3 h-3" />
                            <span>{isUr ? 'گیلری' : 'Gallery'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoSelect}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mandatory 13-Digit CNIC Alert Strip */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                  cnicIsValid
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                }`}
              >
                {cnicIsValid ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <div className="text-xs font-semibold flex-1">
                  {cnicIsValid
                    ? isUr
                      ? `13 ہندسوں کا شناختی کارڈ تصدیق شدہ ہے (${formatCnicDisplay(cnic)})`
                      : `Valid 13-digit CNIC verified (${formatCnicDisplay(cnic)})`
                    : isUr
                    ? `لازمی شرط: درست 13 ہندسوں کا شناختی کارڈ نمبر درج کریں (${cnicDigitsCount}/13 ہندسے)`
                    : `Mandatory Lock: Enter a complete 13-digit CNIC (${cnicDigitsCount}/13 digits entered)`}
                </div>
              </div>

              {/* Section 1: Personal Information (ذاتی معلومات) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#11192C]/90 border border-[#D4AF37]/30 space-y-4">
                <div className="flex items-center justify-between border-b border-[#D4AF37]/25 pb-2.5">
                  <h3 className="text-base font-extrabold text-amber-300">
                    {isUr ? '۱۔ ذاتی معلومات' : '1. Personal Information (ذاتی معلومات)'}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {isUr ? '* نشان زدہ خانے لازمی ہیں' : '* Required fields'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* Row 1: نام | ولد | رابطہ نمبر */}
                  <div>
                    <label className={labelClass}>{isUr ? 'نام *' : 'Full Name *'}</label>
                    <input
                      type="text"
                      required
                      disabled={isInspectMode}
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder={isUr ? 'مکمل نام لکھیں' : 'Full Name'}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>{isUr ? 'ولد *' : "Father's Name *"}</label>
                    <input
                      type="text"
                      required
                      disabled={isInspectMode}
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      placeholder={isUr ? 'والد کا نام' : "Father's Name"}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>{isUr ? 'رابطہ نمبر *' : 'Contact No. *'}</label>
                    <input
                      type="tel"
                      required
                      disabled={isInspectMode}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="03XX-XXXXXXX"
                      dir="ltr"
                      className={inputClass}
                    />
                  </div>

                  {/* Row 2: تعلیم | تجربہ | پیشہ/روزگار */}
                  <div>
                    <label className={labelClass}>{isUr ? 'تعلیم' : 'Education'}</label>
                    <input
                      type="text"
                      disabled={isInspectMode}
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      placeholder={isUr ? 'میٹرک / بی اے / ایم اے' : 'Qualification'}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>{isUr ? 'تجربہ' : 'Experience'}</label>
                    <input
                      type="text"
                      disabled={isInspectMode}
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder={isUr ? 'سماجی یا پیشہ ورانہ تجربہ' : 'Experience / Skills'}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>{isUr ? 'پیشہ / روزگار' : 'Profession / Employment'}</label>
                    <input
                      type="text"
                      disabled={isInspectMode}
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      placeholder={isUr ? 'کاروبار / ملازمت' : 'Profession'}
                      className={inputClass}
                    />
                  </div>

                  {/* Row 3: ازدواجی حیثیت | موجودہ علاقہ | آبائی علاقہ (کند بائیں) */}
                  <div>
                    <label className={labelClass}>{isUr ? 'ازدواجی حیثیت' : 'Marital Status'}</label>
                    <LuxurySelect
                      disabled={isInspectMode}
                      value={maritalStatus}
                      onChange={setMaritalStatus}
                      label={isUr ? 'ازدواجی حیثیت' : 'Marital Status'}
                      options={[
                        { value: 'Married', label: isUr ? 'شادی شدہ (Married)' : 'Married' },
                        { value: 'Single', label: isUr ? 'غیر شادی شدہ (Single)' : 'Single' },
                        { value: 'Widowed', label: isUr ? 'بیوہ / رنڈوا (Widowed)' : 'Widowed' }
                      ]}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>{isUr ? 'موجودہ علاقہ' : 'Current Area'}</label>
                    <input
                      type="text"
                      disabled={isInspectMode}
                      value={currentArea}
                      onChange={(e) => setCurrentArea(e.target.value)}
                      placeholder={isUr ? 'موجودہ رہائشی علاقہ' : 'Current Area / City'}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>{isUr ? 'آبائی علاقہ (کند بائیں)' : 'Ancestral Area (کند بائیں)'}</label>
                    <input
                      type="text"
                      disabled={isInspectMode}
                      value={ancestralArea}
                      onChange={(e) => setAncestralArea(e.target.value)}
                      placeholder={isUr ? 'آبائی گاؤں / علاقہ' : 'Ancestral Area'}
                      className={inputClass}
                    />
                  </div>

                  {/* Row 4: تاریخ پیدائش | عمر | شناختی کارڈ نمبر */}
                  <div>
                    <label className={labelClass}>{isUr ? 'تاریخ پیدائش' : 'Date of Birth'}</label>
                    <input
                      type="date"
                      disabled={isInspectMode}
                      value={dob}
                      onChange={(e) => {
                        setDob(e.target.value);
                        const computed = calculateAgeFromDob(e.target.value);
                        if (computed) setAge(computed);
                      }}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>{isUr ? 'عمر (سال)' : 'Age (Years)'}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      disabled={isInspectMode}
                      value={age}
                      onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      placeholder={isUr ? 'عمر' : 'Age'}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      {isUr ? 'شناختی کارڈ نمبر (13 ہندسے لازمی) *' : 'CNIC (13 Digits Mandatory) *'}
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isInspectMode}
                      value={cnic}
                      onChange={(e) => setCnic(formatCnicDisplay(e.target.value))}
                      placeholder="XXXXX-XXXXXXX-X"
                      inputMode="numeric"
                      dir="ltr"
                      className={`${inputClass} font-mono ${
                        cnic && !cnicIsValid ? 'border-rose-500/80' : 'border-emerald-500/40'
                      }`}
                    />
                  </div>

                  {/* Row 5: مرکزی خاندان (ٹبر) | ذیلی شاخ (ٹبر) | نمائندہ خاندان (ٹبر) */}
                  <div>
                    <label className={labelClass}>{isUr ? 'مرکزی خاندان (ٹبر)' : 'Central Tabbar / Family'}</label>
                    <LuxurySelect
                      searchable
                      disabled={isInspectMode}
                      value={selectedTabbarId}
                      onChange={setSelectedTabbarId}
                      label={isUr ? 'مرکزی خاندان (ٹبر)' : 'Central Tabbar / Family'}
                      options={[
                        ...TABBAR_CLANS.map((c) => ({
                          value: c.id,
                          label: `${c.emblem} ${c.urduName} — ${c.englishName}`
                        })),
                        {
                          value: CUSTOM_TABBAR_ID,
                          label: isUr ? 'دیگر ٹبر (خود لکھیں)' : 'Other / Custom Tabbar'
                        }
                      ]}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>{isUr ? 'ذیلی شاخ (ٹبر)' : 'Sub-Branch (ذیلی شاخ)'}</label>
                    <input
                      type="text"
                      disabled={isInspectMode}
                      value={subBranch}
                      onChange={(e) => setSubBranch(e.target.value)}
                      placeholder={isUr ? 'ذیلی خاندانی شاخ' : 'Sub-Branch'}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>{isUr ? 'نمائندہ خاندان (ٹبر)' : 'Tabar Representative'}</label>
                    <input
                      type="text"
                      disabled={isInspectMode}
                      value={tabarRepName}
                      onChange={(e) => setTabarRepName(e.target.value)}
                      placeholder={isUr ? 'خاندان کے نمائندے کا نام' : 'Representative Name'}
                      className={inputClass}
                    />
                  </div>

                  {selectedTabbarId === CUSTOM_TABBAR_ID && (
                    <>
                      <div>
                        <label className={labelClass}>{isUr ? 'ٹبر کا نام (انگریزی)' : 'Custom Tabbar (English)'}</label>
                        <input
                          type="text"
                          disabled={isInspectMode}
                          value={customTabbarEnglish}
                          onChange={(e) => setCustomTabbarEnglish(e.target.value)}
                          placeholder="e.g. Yousafzai"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>{isUr ? 'ٹبر کا نام (اردو)' : 'Custom Tabbar (Urdu)'}</label>
                        <input
                          type="text"
                          disabled={isInspectMode}
                          value={customTabbarUrdu}
                          onChange={(e) => setCustomTabbarUrdu(e.target.value)}
                          placeholder="ٹبر کا اردو نام"
                          className={inputClass}
                        />
                      </div>
                    </>
                  )}

                  {/* Province | Searchable All Pakistan Districts | Email */}
                  <div>
                    <label className={labelClass}>{isUr ? 'صوبہ' : 'Province'}</label>
                    <LuxurySelect
                      searchable
                      disabled={isInspectMode}
                      value={stateProvince}
                      onChange={(prov) => {
                        setStateProvince(prov);
                        const firstDist = PROVINCES_DATA[prov]?.districts?.[0]?.name || '';
                        if (firstDist) setDistrict(firstDist);
                      }}
                      label={isUr ? 'صوبہ' : 'Province'}
                      options={provinceNames.map((p) => ({ value: p, label: p }))}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>{isUr ? 'ضلع (تمام اضلاع پاکستان)' : 'District (Searchable)'}</label>
                    <LuxurySelect
                      searchable
                      disabled={isInspectMode}
                      value={district}
                      onChange={(dist) => {
                        setDistrict(dist);
                        if (!unit) setUnit(dist);
                      }}
                      label={isUr ? 'ضلع' : 'District'}
                      options={availableDistricts.map((d) => ({ value: d, label: d }))}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>{isUr ? 'ای میل (اختیاری)' : 'Email (Optional)'}</label>
                    <input
                      type="email"
                      disabled={isInspectMode}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="member@email.com"
                      dir="ltr"
                      className={inputClass}
                    />
                  </div>

                  {/* Row 6: موجودہ پتہ | مستقل پتہ */}
                  <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className={labelClass}>{isUr ? 'موجودہ پتہ *' : 'Current Address *'}</label>
                      <input
                        type="text"
                        required
                        disabled={isInspectMode}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={isUr ? 'مکمل موجودہ رہائشی پتہ' : 'Full Current Street/House Address'}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{isUr ? 'مستقل پتہ' : 'Permanent Address'}</label>
                      <input
                        type="text"
                        disabled={isInspectMode}
                        value={permanentAddress}
                        onChange={(e) => setPermanentAddress(e.target.value)}
                        placeholder={isUr ? 'مکمل مستقل آبائی پتہ' : 'Full Permanent Address'}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Oath (عہد نامہ) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#11192C]/90 border border-[#D4AF37]/30 space-y-4">
                <div className="flex items-center justify-between border-b border-[#D4AF37]/25 pb-2.5">
                  <h3 className="text-base font-extrabold text-amber-300">
                    {isUr ? '۲۔ عہد نامہ (Oath)' : '2. Pledge & Oath (عہد نامہ)'}
                  </h3>
                </div>

                <div className="p-4 rounded-2xl bg-[#070D14]/90 border border-[#D4AF37]/35 space-y-3 leading-loose">
                  <p className="text-sm sm:text-base text-amber-50 font-medium" dir="rtl">
                    میں سوئی خیل قومی اتحاد کے دستور، اس کے اغراض و مقاصد اور اس کے تمام قواعد و ضوابط سے کلی طور پر اتفاق کرتا ہوں۔ میں عہد کرتا ہوں کہ ہر دم تنظیم کا وفادار اور اس کے لیے ہر وقت ہر قسم کی قربانی کے لیے تیار رہوں گا۔ میں یہ بھی عہد کرتا ہوں کہ سوئی قوم کی ترقی و خوشحالی کے لیے اپنی تمام تر لیاقت و قابلیت اور دولت و صلاحیت بروئے کار لاؤں گا۔ تنظیم جو خدمت ذمے لگائے ان شاء اللہ ذوق و شوق سے کروں گا۔ علاوہ ازیں میں وعدہ کرتا ہوں کہ تنظیم کے لیے ہر ماہ کم از کم مبلغ{' '}
                    <span className="inline-block font-mono font-black text-[#FDE047] px-2 py-0.5 rounded bg-amber-500/15 border border-amber-400/40">
                      {monthlyPledgeAmount || '100'}
                    </span>{' '}
                    روپے بطور تعاون پیش کروں گا۔
                  </p>

                  {!isUr && (
                    <p className="text-xs text-slate-300 border-t border-slate-800 pt-2.5" dir="ltr">
                      “I fully agree with the constitution, aims, objectives, and all rules and regulations of Sui Khel Qaumi Ittehad. I solemnly pledge to remain loyal to the organization and ready for every service and sacrifice. I will dedicate my skills, capability, and resources for the progress and prosperity of the Sui nation, fulfill assigned duties diligently InshaAllah, and contribute at least PKR {monthlyPledgeAmount || '100'} monthly.”
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <label className="text-xs font-bold text-amber-200">
                      {isUr ? 'ماہانہ تعاون مبلغ (PKR):' : 'Monthly Cooperation Pledge (PKR):'}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      disabled={isInspectMode}
                      value={monthlyPledgeAmount}
                      onChange={(e) => setMonthlyPledgeAmount(e.target.value.replace(/\D/g, ''))}
                      className="w-32 px-3 py-1.5 bg-[#0C1524] border border-[#D4AF37]/40 rounded-xl text-sm font-mono font-bold text-[#FDE047]"
                      dir="ltr"
                    />
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-300">
                      <input
                        type="checkbox"
                        disabled={isInspectMode}
                        checked={oathAccepted}
                        onChange={(e) => setOathAccepted(e.target.checked)}
                        className="w-4 h-4 accent-amber-400 rounded"
                      />
                      {isUr ? 'میں اس عہد نامہ کی تصدیق کرتا ہوں' : 'I solemnly confirm & accept this Oath'}
                    </label>
                  </div>
                </div>

                {/* Applicant Digital Signature */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5" />
                      {isUr ? 'دستخط امیدوار (Applicant Signature)' : 'Applicant Digital Signature'}
                    </span>
                    {!isInspectMode && (
                      <div className="flex items-center gap-1.5 bg-[#070D14] p-1 rounded-xl border border-slate-700">
                        <button
                          type="button"
                          onClick={() => setSigMode('DRAW')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                            sigMode === 'DRAW' ? 'bg-amber-500 text-[#070D14]' : 'text-slate-300'
                          }`}
                        >
                          {isUr ? 'ڈرا کریں' : 'Draw'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSigMode('TYPE')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                            sigMode === 'TYPE' ? 'bg-amber-500 text-[#070D14]' : 'text-slate-300'
                          }`}
                        >
                          {isUr ? 'ٹائپ کریں' : 'Type'}
                        </button>
                      </div>
                    )}
                  </div>

                  {drawnSignatureDataUrl && isInspectMode ? (
                    <div className="p-3 rounded-2xl bg-[#070D14] border border-[#D4AF37]/40 inline-block">
                      <img src={drawnSignatureDataUrl} alt="Applicant Signature" className="h-20 object-contain" />
                    </div>
                  ) : sigMode === 'DRAW' && !isInspectMode ? (
                    <div className="space-y-1.5">
                      <div className="relative rounded-2xl bg-[#070D14] border border-[#D4AF37]/40 overflow-hidden">
                        <canvas
                          ref={canvasRef}
                          width={520}
                          height={120}
                          onPointerDown={handlePointerDown}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          onPointerLeave={handlePointerUp}
                          className="w-full h-28 touch-none cursor-crosshair"
                        />
                        <button
                          type="button"
                          onClick={clearSignaturePad}
                          className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-slate-800/90 text-slate-300 text-[10px] font-bold flex items-center gap-1 hover:text-white"
                        >
                          <RotateCcw className="w-3 h-3" />
                          {isUr ? 'صاف کریں' : 'Clear'}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {isUr ? 'اوپر باکس میں انگلی یا ماؤس سے دستخط کریں' : 'Draw your signature above using finger or mouse'}
                      </p>
                    </div>
                  ) : (
                    <input
                      type="text"
                      disabled={isInspectMode}
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                      placeholder={isUr ? 'اپنا نام بطور دستخط لکھیں' : 'Type your full name as signature'}
                      className={`${inputClass} italic font-serif text-base text-amber-200`}
                    />
                  )}
                </div>
              </div>

              {/* Section 3: Tabar Rep Verification (تصدیق نمائندہ خاندان) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#11192C]/90 border border-[#D4AF37]/30 space-y-3">
                <h3 className="text-base font-extrabold text-amber-300 border-b border-[#D4AF37]/25 pb-2">
                  {isUr ? '۳۔ تصدیق نمائندہ خاندان' : '3. Tabar Representative Verification (تصدیق نمائندہ خاندان)'}
                </h3>
                <p className="text-xs sm:text-sm text-amber-50/90 leading-relaxed font-medium">
                  {isUr
                    ? 'میں نے مندرجہ بالا اندراجات اچھی طرح ملاحظہ کر لیے ہیں اور میری معلومات کی حد تک وہ بالکل درست ہیں۔ میں یقین دلاتا ہوں کہ موصوف سوئی خیل قومی اتحاد کے وفادار رکن ثابت ہوں گے۔'
                    : 'I have carefully reviewed the entries above and to the best of my knowledge they are completely accurate. I assure that the applicant will prove to be a loyal member of Sui Khel Qaumi Ittehad.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className={labelClass}>{isUr ? 'نام نمائندہ خاندان' : 'Tabar Representative Name'}</label>
                    <input
                      type="text"
                      disabled={isInspectMode}
                      value={tabarRepName}
                      onChange={(e) => setTabarRepName(e.target.value)}
                      placeholder={isUr ? 'نمائندے کا نام' : 'Representative Name'}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{isUr ? 'دستخط نمائندہ خاندان' : 'Representative Signature'}</label>
                    <input
                      type="text"
                      disabled={isInspectMode}
                      value={tabarRepSignature}
                      onChange={(e) => setTabarRepSignature(e.target.value)}
                      placeholder={isUr ? 'نمائندہ کے دستخط' : 'Representative Sign / Name'}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: For Office Use Only (برائے دفتری کارروائی) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#0B1726] to-[#070D14] border-2 border-[#D4AF37]/45 space-y-4">
                <div className="flex items-center justify-between border-b border-[#D4AF37]/25 pb-2">
                  <h3 className="text-base font-extrabold text-amber-300 flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4" />
                    {isUr ? '۴۔ برائے دفتری کارروائی' : '4. For Office Use Only (برائے دفتری کارروائی)'}
                  </h3>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-200">
                    {isUr ? 'صرف دفتری عملہ' : 'Office Authority'}
                  </span>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-5">
                  <div className="flex-1 w-full space-y-3">
                    <div className="p-3 rounded-2xl bg-[#0C1524] border border-slate-700/80 text-xs sm:text-sm text-slate-200 flex flex-wrap items-center gap-2">
                      <span>{isUr ? 'مبلغ' : 'Form Fee Received PKR:'}</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={!canOfficeApprove}
                        value={formFeeAmount}
                        onChange={(e) => setFormFeeAmount(e.target.value.replace(/\D/g, ''))}
                        className="w-24 px-2.5 py-1 rounded-lg bg-[#070D14] border border-[#D4AF37]/40 font-mono font-bold text-[#FDE047] text-center"
                        dir="ltr"
                      />
                      <span>
                        {isUr
                          ? 'روپے فارم فیس وصول پائی۔ حسب تصدیق نمائندہ رکنیت منظور کی جاتی ہے۔'
                          : 'received. Subject to representative verification, membership is approved.'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>{isUr ? 'دستخط ناظم دفتر' : 'Signature Office Secretary (ناظم دفتر)'}</label>
                        <input
                          type="text"
                          disabled={!canOfficeApprove}
                          value={officeSecretarySignature}
                          onChange={(e) => setOfficeSecretarySignature(e.target.value)}
                          placeholder={canOfficeApprove ? 'Enter Secretary Signature' : 'Awaiting Office Sign-off'}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>{isUr ? 'دستخط صدر' : 'Signature President (صدر)'}</label>
                        <input
                          type="text"
                          disabled={!canOfficeApprove}
                          value={presidentSignature}
                          onChange={(e) => setPresidentSignature(e.target.value)}
                          placeholder={canOfficeApprove ? 'Enter President Signature' : 'Awaiting President Sign-off'}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mandatory Official Mohar Stamp */}
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <OfficialMoharStamp
                      variant={effectiveInspected?.status === 'ACTIVE' ? 'VERIFIED' : 'OFFICIAL'}
                      serialNumber={effectiveInspected?.serialNumber || effectiveInspected?.generatedMembershipId}
                      size={118}
                    />
                    <span className="text-[10px] font-bold text-amber-300/80">
                      {isUr ? 'مہر سوئی خیل قومی اتحاد' : 'Official Organization Mohar'}
                    </span>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs font-bold flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2 pb-2" dir="ltr">
                {!embedded && (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-5 py-2.5 rounded-2xl bg-slate-800 text-slate-200 text-xs sm:text-sm font-bold hover:bg-slate-700 transition cursor-pointer"
                  >
                    {isUr ? 'بند کریں' : 'Close'}
                  </button>
                )}

                {canOfficeApprove && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleOfficeApprove}
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs sm:text-sm font-extrabold shadow-lg flex items-center gap-2 hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    {isSubmitting ? 'Approving...' : 'Approve Rukniyat & Issue Official Serial'}
                  </button>
                )}

                {!isInspectMode && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#F59E0B] to-[#EAB308] text-[#070D14] text-xs sm:text-sm font-black shadow-[0_10px_30px_rgba(212,175,55,0.35)] hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
                  >
                    {isSubmitting
                      ? isUr
                        ? 'جمع ہو رہا ہے...'
                        : 'Submitting...'
                      : isUr
                      ? 'رکنیت فارم جمع کروائیں'
                      : 'Submit Rukniyat Form'}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
  );

  if (embedded) {
    return bodyWrapper;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {bodyWrapper}
    </div>
  );
};

export const RukniyatFormModal: React.FC = () => {
  const { isRukniyatFormOpen, closeRukniyatForm } = useApp();
  if (!isRukniyatFormOpen) return null;
  return <RukniyatFormContent onClose={closeRukniyatForm} />;
};
