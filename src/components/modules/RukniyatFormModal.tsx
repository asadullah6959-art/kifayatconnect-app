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
  Image as ImageIcon,
  Loader2
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
import {
  prepareImageForAiScan,
  normalizeDigits,
  normalizeExtractedDate,
  matchProvinceAndDistrict,
  pickBilingualField
} from '../../utils/imageCompression';

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
  const [paperSerialNo, setPaperSerialNo] = useState<string>('');
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
  // CRITICAL: Never hardcode any real CNIC as default value or placeholder; keep input completely empty and editable.
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

  // Photo & AI Form Scanner refs/states
  const photoCameraInputRef = useRef<HTMLInputElement | null>(null);
  const photoGalleryInputRef = useRef<HTMLInputElement | null>(null);
  const scanCameraInputRef = useRef<HTMLInputElement | null>(null);
  const scanGalleryInputRef = useRef<HTMLInputElement | null>(null);
  const aiAutoFormInputRef = useRef<HTMLInputElement | null>(null);
  const [scannedFormPhotoUrl, setScannedFormPhotoUrl] = useState<string>('');
  const [isAiScanning, setIsAiScanning] = useState<boolean>(false);
  const [aiScanStatus, setAiScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [aiScanMessage, setAiScanMessage] = useState<string>('');

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
      setPaperSerialNo(effectiveInspected.oldMembershipNo || effectiveInspected.serialNumber || '');
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
      setPaperSerialNo('');
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
      setCnic('');
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
    e.target.value = '';
    if (!file) return;
    try {
      const compressed = await compressAvatarFile(file);
      setApplicantPhotoUrl(compressed);
    } catch {
      setErrorMsg(isUr ? 'تصویر اپ لوڈ کرنے میں مسئلہ آیا۔' : 'Could not process selected photo.');
    }
  };

  const clearApplicantPhoto = () => {
    setApplicantPhotoUrl('');
    if (photoCameraInputRef.current) photoCameraInputRef.current.value = '';
    if (photoGalleryInputRef.current) photoGalleryInputRef.current.value = '';
  };

  const resetScannerInputs = () => {
    if (scanCameraInputRef.current) scanCameraInputRef.current.value = '';
    if (scanGalleryInputRef.current) scanGalleryInputRef.current.value = '';
    if (aiAutoFormInputRef.current) aiAutoFormInputRef.current.value = '';
  };

  const clearScannedFormPhoto = () => {
    setScannedFormPhotoUrl('');
    setAiScanMessage('');
    setAiScanStatus('idle');
    resetScannerInputs();
  };

  const runRukniyatAiScan = async (source: File | string) => {
    setErrorMsg('');
    setAiScanMessage('');
    setAiScanStatus('idle');
    setIsAiScanning(true);

    try {
      const prepared = await prepareImageForAiScan(source, 1800, 0.88);
      if (prepared.width > 0 && prepared.height > 0 &&
          (prepared.width < 480 || prepared.height < 480)) {
        throw new Error(
          isUr
            ? 'تصویر کی ریزولیوشن بہت کم ہے۔ واضح، زیادہ ریزولیوشن والی تصویر دوبارہ لیں۔'
            : 'Image resolution is too low. Please retake a clear, high-resolution photo.'
        );
      }
      if (prepared.sharpnessScore > 0 && prepared.sharpnessScore < 35) {
        throw new Error(
          isUr
            ? 'تصویر دھندلی یا غیر واضح لگتی ہے۔ فارم کو روشنی میں اور مستحکم طور پر دوبارہ اسکین کریں۔'
            : 'The image appears blurry or unreadable. Retake the form in good light and keep the camera steady.'
        );
      }
      setScannedFormPhotoUrl(prepared.dataUrl);

      const response = await fetch('/api/scan-paper-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: prepared.base64,
          mimeType: prepared.mimeType,
          formType: 'RUKNIYAT'
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        setAiScanStatus('error');
        setAiScanMessage(
          payload?.error ||
            (isUr
              ? 'تصویر بہتر کر کے منسلک کر دی گئی ہے — آپ نیچے تمام خانے دستی پُر یا ترمیم کر سکتے ہیں۔'
              : 'Photo enhanced and attached — you can review or edit all fields below.')
        );
        return;
      }

      const d = (payload?.data || payload?.fields || {}) as Record<string, unknown>;
      let filledCount = 0;

      const normDate = normalizeExtractedDate(pickBilingualField(d, ['date', 'formDate', 'تاریخ']));
      if (normDate) {
        setFormDate(normDate);
        filledCount += 1;
      }
      const rawSerial = pickBilingualField(d, [
        'serialNo',
        'oldMembershipNo',
        'membershipNo',
        'serialNumber',
        'رکنیت نمبر',
        'رکنیت / سیریل نمبر',
        'سیریل نمبر'
      ]);
      if (rawSerial) {
        setPaperSerialNo(normalizeDigits(rawSerial).trim());
        filledCount += 1;
      }
      const rawDistrict = pickBilingualField(d, ['district', 'unit', 'ضلع', 'یونٹ']);
      const rawProvince = pickBilingualField(d, ['stateProvince', 'province', 'صوبہ']);
      const locMatch = matchProvinceAndDistrict(rawDistrict, rawProvince, PROVINCES_DATA);
      if (locMatch.stateProvince) {
        setStateProvince(locMatch.stateProvince);
        filledCount += 1;
      }
      if (locMatch.district) {
        setDistrict(locMatch.district);
        filledCount += 1;
      }
      const rawUnit = pickBilingualField(d, ['unit', 'یونٹ']);
      if (rawUnit || locMatch.district || rawDistrict) {
        setUnit(String(rawUnit || locMatch.district || rawDistrict).trim());
        if (rawUnit) filledCount += 1;
      }
      const rawName = pickBilingualField(d, [
        'name',
        'applicantName',
        'fullName',
        'memberName',
        'نام',
        'مکمل نام',
        'محترم جناب',
        'صاحب کی جانب سے'
      ]);
      if (rawName) {
        const nameVal = String(rawName).trim();
        setApplicantName(nameVal);
        if (!typedSignature) setTypedSignature(nameVal);
        filledCount += 1;
      }
      const rawFather = pickBilingualField(d, ['fatherName', 'father', 'sonOf', 'ولد', 'ولدیت']);
      if (rawFather) {
        setFatherName(String(rawFather).trim());
        filledCount += 1;
      }
      const rawPhone = pickBilingualField(d, [
        'contactNumber',
        'phone',
        'mobile',
        'mobileNumber',
        'contact',
        'رابطہ نمبر',
        'فون',
        'موبائل نمبر'
      ]);
      if (rawPhone) {
        setPhone(normalizeDigits(rawPhone).trim());
        filledCount += 1;
      }
      const rawEmail = pickBilingualField(d, ['email', 'ای میل']);
      if (rawEmail) {
        setEmail(String(rawEmail).trim());
        filledCount += 1;
      }
      const rawEducation = pickBilingualField(d, ['education', 'qualification', 'تعلیم']);
      if (rawEducation) {
        setEducation(String(rawEducation).trim());
        filledCount += 1;
      }
      const rawExperience = pickBilingualField(d, ['experience', 'تجربہ']);
      if (rawExperience) {
        setExperience(String(rawExperience).trim());
        filledCount += 1;
      }
      const rawProfession = pickBilingualField(d, ['profession', 'occupation', 'job', 'پیشہ', 'پیشہ / روزگار', 'روزگار']);
      if (rawProfession) {
        setProfession(String(rawProfession).trim());
        filledCount += 1;
      }
      const rawMarital = pickBilingualField(d, ['maritalStatus', 'marital', 'ازدواجی حیثیت']);
      if (rawMarital) {
        const ms = String(rawMarital).toLowerCase();
        if (ms.includes('single') || ms.includes('unmarried') || ms.includes('غیر')) setMaritalStatus('Single');
        else if (ms.includes('widow') || ms.includes('بیوہ')) setMaritalStatus('Widowed');
        else if (ms.includes('married') || ms.includes('شادی')) setMaritalStatus('Married');
        filledCount += 1;
      }
      const rawCurrentArea = pickBilingualField(d, ['currentArea', 'area', 'موجودہ علاقہ', 'علاقہ']);
      if (rawCurrentArea) {
        setCurrentArea(String(rawCurrentArea).trim());
        filledCount += 1;
      }
      const rawAncestralArea = pickBilingualField(d, ['ancestralArea', 'nativeArea', 'آبائی علاقہ', 'آبائی علاقہ (کند بائیں)']);
      if (rawAncestralArea) {
        setAncestralArea(String(rawAncestralArea).trim());
        filledCount += 1;
      }
      const normDob = normalizeExtractedDate(pickBilingualField(d, ['dob', 'dateOfBirth', 'birthDate', 'تاریخ پیدائش']));
      if (normDob) {
        setDob(normDob);
        const computedAge = calculateAgeFromDob(normDob);
        if (computedAge) setAge(computedAge);
        filledCount += 1;
      }
      const rawAge = pickBilingualField(d, ['age', 'عمر']);
      if (rawAge) {
        const cleanAge = normalizeDigits(rawAge).replace(/\D/g, '').slice(0, 3);
        if (cleanAge) {
          setAge(cleanAge);
          filledCount += 1;
        }
      }
      const rawCnic = pickBilingualField(d, ['cnic', 'nic', 'idCard', 'شناختی کارڈ نمبر', 'شناختی کارڈ']);
      if (rawCnic) {
        const strippedCnic = normalizeDigits(rawCnic).replace(/\D/g, '').slice(0, 13);
        if (isValid13DigitCnic(strippedCnic)) {
          setCnic(strippedCnic);
          filledCount += 1;
        } else {
          setAiScanStatus('error');
          setAiScanMessage(
            isUr
              ? 'اسکین کردہ CNIC 13 ہندسوں کا درست نمبر نہیں ہے۔ تصویر صاف کر کے دوبارہ لیں یا CNIC دستی درج کریں۔'
              : 'The scanned CNIC is not a valid 13-digit number. Retake a clear image or enter the CNIC manually.'
          );
          return;
        }
      }
      const rawTabar = pickBilingualField(d, [
        'tabar',
        'tabbar',
        'clan',
        'مرکزی خاندان',
        'مرکزی خاندان (ٹبر)',
        'ٹبر'
      ]);
      if (rawTabar) {
        const tabText = String(rawTabar).trim();
        const matchedTab = TABBAR_CLANS.find(
          (c) =>
            c.englishName.toLowerCase().includes(tabText.toLowerCase()) ||
            c.urduName.includes(tabText)
        );
        if (matchedTab) {
          setSelectedTabbarId(matchedTab.id);
        } else {
          setSelectedTabbarId(CUSTOM_TABBAR_ID);
          setCustomTabbarEnglish(tabText);
        }
        filledCount += 1;
      }
      const rawSubBranch = pickBilingualField(d, ['subBranch', 'subTabbar', 'ذیلی شاخ', 'ذیلی شاخ (ٹبر)']);
      if (rawSubBranch) {
        setSubBranch(String(rawSubBranch).trim());
        filledCount += 1;
      }
      const rawRep = pickBilingualField(d, [
        'representative',
        'representativeName',
        'tabarRepName',
        'نمائندہ خاندان',
        'نمائندہ خاندان (ٹبر)',
        'نام نمائندہ'
      ]);
      if (rawRep) {
        setTabarRepName(String(rawRep).trim());
        filledCount += 1;
      }
      const rawRepName = pickBilingualField(d, ['representativeName', 'tabarRepName', 'نام نمائندہ']);
      if (rawRepName && String(rawRepName).trim()) {
        setTabarRepSignature(String(rawRepName).trim());
      }
      const rawCurrentAddr = pickBilingualField(d, ['currentAddress', 'address', 'presentAddress', 'موجودہ پتہ', 'پتہ']);
      if (rawCurrentAddr) {
        setAddress(String(rawCurrentAddr).trim());
        filledCount += 1;
      }
      const rawPermAddr = pickBilingualField(d, ['permanentAddress', 'مستقل پتہ']);
      if (rawPermAddr) {
        setPermanentAddress(String(rawPermAddr).trim());
        filledCount += 1;
      }
      const rawPledge = pickBilingualField(d, ['amount', 'monthlyPledgeAmount', 'fee', 'مبلغ', 'رقم', 'روپے']);
      if (rawPledge !== undefined && rawPledge !== null && String(rawPledge).trim() !== '') {
        const pledgeDigits = normalizeDigits(rawPledge).replace(/\D/g, '');
        if (pledgeDigits && Number(pledgeDigits) >= 50) {
          setMonthlyPledgeAmount(pledgeDigits);
          filledCount += 1;
        }
      }

      if (filledCount === 0) {
        setAiScanStatus('success');
        setAiScanMessage(
          isUr
            ? '✅ تصویر بہتر کر کے منسلک کر دی گئی ہے — نیچے خانوں میں تفصیلات پُر یا ترمیم کر لیں۔'
            : '✅ Photo enhanced and attached — fill or edit any remaining fields below.'
        );
        return;
      }

      setAiScanStatus('success');
      setAiScanMessage(
        isUr
          ? `✅ AI Auto نے فارم سے ${filledCount} خانے خودکار پُر کر دیے ہیں — براہ کرم نیچے تفصیلات چیک کریں۔`
          : `✅ AI Auto filled ${filledCount} form field${filledCount > 1 ? 's' : ''} below — please review before submitting.`
      );
    } catch (err) {
      setAiScanStatus('error');
      setAiScanMessage(
        err instanceof Error && err.message
          ? err.message
          : isUr
          ? 'AI اسکین ناکام رہا۔ براہ کرم دستی اندراج کریں۔'
          : 'AI Auto scan failed. Please review or fill manually.'
      );
    } finally {
      setIsAiScanning(false);
    }
  };

  const handleScannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await runRukniyatAiScan(file);
  };

  const handleAiAutoFormClick = async () => {
    if (isAiScanning) return;
    if (scannedFormPhotoUrl) {
      await runRukniyatAiScan(scannedFormPhotoUrl);
    } else {
      aiAutoFormInputRef.current?.click();
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
    ctx.strokeStyle = '#CBD5E1';
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
        monthlyPledgeAmount: Math.max(100, Number(monthlyPledgeAmount) || 100),
        oldMembershipNo: paperSerialNo.trim() || undefined
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
    'w-full px-3 py-2.5 bg-[#0D2A1F] border border-[#E5E4E2]/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CBD5E1] focus:ring-1 focus:ring-[#CBD5E1]/40 transition';

  const outerWrapperClass = embedded
    ? 'w-full max-w-[100vw] flex flex-col bg-[#071812] border border-[#E5E4E2]/50 rounded-3xl shadow-xl overflow-hidden box-border'
    : 'relative w-full max-w-[calc(100vw-20px)] sm:max-w-4xl kc-modal-panel flex flex-col bg-[#071812] border border-[#E5E4E2]/50 rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden box-border my-auto';

  const bodyWrapper = (
      <div className={outerWrapperClass}>
        {/* Top Control Bar */}
        <div className="flex items-start sm:items-center justify-between gap-2 px-3.5 sm:px-5 py-3 bg-[#0D2A1F] border-b border-[#E5E4E2]/30 shrink-0">
          <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#CBD5E1] to-[#B45309] flex items-center justify-center text-[#071812] shadow-md shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xs sm:text-base font-extrabold text-amber-300 tracking-wide break-words whitespace-normal leading-snug">
                {isUr ? 'رکنیت فارم — سوئی خیل اتحاد' : 'RUKNIYAT FORM — SUI KHEL ITTEHAD'}
              </h2>
              <p className="text-[11px] text-slate-300 break-words whitespace-normal leading-snug mt-0.5">
                {isInspectMode
                  ? `Serial: ${displaySerial} · Status: ${effectiveInspected?.status}`
                  : isUr
                  ? 'بغیر 13 ہندسوں کے شناختی کارڈ کے رکنیت فارم جمع نہیں ہو گا'
                  : 'Mandatory 13-Digit CNIC · Atomic Serial Generation'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setFormLang((prev) => (prev === 'ur' ? 'en' : 'ur'))}
              className="min-h-[44px] flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs font-bold hover:bg-amber-500/25 transition cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5 shrink-0" />
              <span>{isUr ? 'English' : 'اردو'}</span>
            </button>
            {!embedded && (
              <button
                type="button"
                onClick={handleClose}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl bg-slate-800/90 border border-[#E5E4E2]/30 text-slate-200 hover:text-white hover:bg-slate-700 transition cursor-pointer shrink-0 kc-pressable"
                aria-label="Close Rukniyat Form"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Luxury Paper / Dark Form Body */}
        <div
          className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 sm:pb-6 space-y-5"
          style={{ WebkitOverflowScrolling: 'touch' }}
          dir={isUr ? 'rtl' : 'ltr'}
        >
          {submittedSerial ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#062E22] via-[#0B1F1C] to-[#071812] border-2 border-[#E5E4E2]/60 text-center space-y-5">
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

              <div className="max-w-sm mx-auto p-4 rounded-2xl bg-[#071812]/90 border border-[#E5E4E2]/50">
                <p className="text-[11px] uppercase tracking-wider text-amber-300/80 font-bold">
                  {isUr ? 'رکنیت / سیریل نمبر' : 'Assigned Atomic Serial No.'}
                </p>
                <p className="text-2xl font-mono font-black text-[#CBD5E1] mt-1 tracking-wider">
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
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#E5E4E2] to-[#CBD5E1] text-[#071812] font-extrabold text-sm shadow-lg hover:brightness-110 transition cursor-pointer"
              >
                {embedded
                  ? (isUr ? 'نیا رکنیت فارم پُر کریں' : 'Fill Another Rukniyat Form')
                  : (isUr ? 'ڈیش بورڈ پر واپس جائیں' : 'Return to Dashboard')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Official Form Header Card with Circular Emblem */}
              <div className="relative p-4 sm:p-6 rounded-3xl kc-glass-bevel bg-gradient-to-br from-[#0F1B2E]/90 via-[#0D2A1F]/90 to-[#090F1B]/95 shadow-xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* Circular Emblem + Organization Title & Motto */}
                  <div className="flex flex-col sm:flex-row items-center gap-3.5 text-center sm:text-start flex-1 min-w-0">
                    <BrandEmblem3D size="md" halo className="shrink-0" />
                    <div className="space-y-1.5 min-w-0">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-extrabold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className={isUr ? 'kc-font-urdu' : ''}>{isUr ? 'رکنیت فارم' : 'RUKNIYAT FORM · MEMBERSHIP'}</span>
                      </div>
                      <h1 className="kc-font-urdu text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#E5E4E2] via-[#E5E4E2] to-[#CBD5E1] py-0.5">
                        سوئی خیل اتحاد
                      </h1>
                      {!isUr && (
                        <p className="text-xs font-bold tracking-widest uppercase text-amber-200/80">
                          SUI KHEL ITTEHAD · SUI KHEL ITTEHAD
                        </p>
                      )}
                      <p className={`text-xs sm:text-sm font-bold text-emerald-300 ${isUr ? 'kc-font-urdu' : ''}`}>
                        {isUr
                          ? 'وحدت  |  خدمت  |  معاونت  |  مصالحت'
                          : 'Unity  |  Service  |  Cooperation  |  Reconciliation'}
                      </p>
                    </div>
                  </div>

                  {/* Meta Row + Dual Camera/Gallery Photo Box */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-3.5 shrink-0">
                    <div className="space-y-2 text-xs min-w-0 w-full sm:min-w-[180px]">
                      <div className="p-2 rounded-xl bg-[#071812]/80 border border-[#E5E4E2]/30 space-y-1">
                        <span className="text-[10px] text-slate-400 block">
                          {isUr ? 'رکنیت نمبر / سیریل نمبر' : 'Membership / Serial No.'}
                        </span>
                        {isInspectMode ? (
                          <span className="font-mono font-extrabold text-[#CBD5E1] block">
                            {displaySerial}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={paperSerialNo}
                            onChange={(e) => setPaperSerialNo(e.target.value)}
                            placeholder={displaySerial}
                            dir="ltr"
                            className="w-full px-2 py-1.5 bg-[#0D2A1F] border border-slate-700 rounded-lg text-xs font-mono font-bold text-[#CBD5E1] placeholder-slate-500"
                          />
                        )}
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
                            className="w-full min-h-[44px] px-2 py-1.5 bg-[#071812] border border-slate-700 rounded-lg text-[11px] text-white"
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
                            className="w-full min-h-[44px] px-2 py-1.5 bg-[#071812] border border-slate-700 rounded-lg text-[11px] text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Applicant Photo Frame + Camera / Gallery Buttons */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="w-24 h-28 rounded-2xl border-2 border-dashed border-[#E5E4E2]/60 bg-[#071812] flex flex-col items-center justify-center overflow-hidden relative">
                        {applicantPhotoUrl ? (
                          <>
                            <img
                              src={applicantPhotoUrl}
                              alt="Applicant"
                              className="w-full h-full object-cover"
                            />
                            {!isInspectMode && (
                              <button
                                type="button"
                                onClick={clearApplicantPhoto}
                                aria-label="Remove applicant photo"
                                title={isUr ? 'تصویر ہٹائیں' : 'Remove photo'}
                                style={{ position: 'absolute', top: '6px', right: '6px', zIndex: 999 }}
                                className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 border-2 border-[#CBD5E1] text-white flex items-center justify-center shadow-lg cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5 stroke-[2.75]" />
                              </button>
                            )}
                          </>
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
                          <label className="kc-pressable min-h-[44px] inline-flex items-center gap-1 px-2.5 py-2 rounded-lg bg-[#E5E4E2]/20 border border-[#E5E4E2]/60 text-[#E5E4E2] text-[11px] font-bold cursor-pointer">
                            <Camera className="w-3.5 h-3.5" />
                            <span>{isUr ? 'کیمرہ' : 'Camera'}</span>
                            <input
                              ref={photoCameraInputRef}
                              type="file"
                              accept="image/*"
                              capture="user"
                              onChange={handlePhotoSelect}
                              className="hidden"
                            />
                          </label>
                          <label className="kc-pressable min-h-[44px] inline-flex items-center gap-1 px-2.5 py-2 rounded-lg bg-[#0D2A1F] border border-[#059669]/50 text-[#059669] text-[11px] font-bold cursor-pointer">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>{isUr ? 'گیلری' : 'Gallery'}</span>
                            <input
                              ref={photoGalleryInputRef}
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

              {/* Instant Auto-Enhance AI Paper Rukniyat Form Scanner */}
              {!isInspectMode && (
                <div className="p-4 rounded-2xl bg-[#0D2A1F]/90 border border-[#E5E4E2]/40 space-y-3">
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                        {isAiScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold text-amber-200 truncate">
                          {isUr ? 'کاغذی رکنیت فارم فوری اسکینر (AI Auto)' : 'Instant AI Camera Form Scanner'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {isUr
                            ? 'تصویر لیتے ہی یا گیلری سے منتخب کرتے ہی تمام خانے فوراً خودکار پُر ہو جائیں گے (50MB تک)'
                            : 'Capture or choose form photo (up to 50MB) — enhances clarity & auto-fills all fields immediately'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 gap-2">
                      <label className="kc-pressable min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/50 text-amber-200 text-xs font-bold cursor-pointer">
                        <Camera className="w-4 h-4 shrink-0" />
                        <span>{isUr ? '📷 تصویر لیں' : '📷 Take Photo'}</span>
                        <input
                          ref={scanCameraInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleScannerFileChange}
                          className="hidden"
                        />
                      </label>
                      <label className="kc-pressable min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#0D2A1F] hover:bg-[#161F33] border border-[#E5E4E2]/40 text-slate-200 text-xs font-bold cursor-pointer">
                        <ImageIcon className="w-4 h-4 text-[#CBD5E1] shrink-0" />
                        <span>{isUr ? '🖼️ گیلری' : '🖼️ Choose from Gallery'}</span>
                        <input
                          ref={scanGalleryInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleScannerFileChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={isAiScanning}
                        onClick={handleAiAutoFormClick}
                        className="kc-pressable min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#E5E4E2] to-[#CBD5E1] text-[#071812] text-xs font-black shadow-md hover:brightness-110 disabled:opacity-60 cursor-pointer"
                      >
                        {isAiScanning ? (
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        ) : (
                          <Sparkles className="w-4 h-4 shrink-0" />
                        )}
                        <span>{isAiScanning ? (isUr ? 'اسکین...' : 'Scanning...') : '✨ AI Auto'}</span>
                      </button>
                      <input
                        ref={aiAutoFormInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleScannerFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {scannedFormPhotoUrl && (
                    <div className="relative rounded-xl overflow-hidden bg-[#071812] border border-[#E5E4E2]/40">
                      <img
                        src={scannedFormPhotoUrl}
                        alt="Scanned Rukniyat paper form"
                        className="w-full max-h-44 object-contain"
                      />
                      <button
                        type="button"
                        onClick={clearScannedFormPhoto}
                        aria-label="Remove scanned form photo"
                        title={isUr ? 'اسکین شدہ تصویر ہٹائیں' : 'Remove scanned photo'}
                        style={{ position: 'absolute', top: '6px', right: '6px', zIndex: 999 }}
                        className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 border-2 border-[#CBD5E1] text-white flex items-center justify-center shadow-lg cursor-pointer"
                      >
                        <X className="w-4 h-4 stroke-[2.75]" />
                      </button>
                    </div>
                  )}

                  {aiScanMessage && (
                    <div
                      className={`text-xs font-semibold rounded-xl px-3 py-2.5 flex items-center gap-2 border ${
                        aiScanStatus === 'success'
                          ? 'text-emerald-200 bg-emerald-950/75 border-emerald-400/60'
                          : 'text-amber-200 bg-amber-500/10 border-amber-400/35'
                      }`}
                    >
                      {aiScanStatus === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                      )}
                      <span>{aiScanMessage}</span>
                    </div>
                  )}
                </div>
              )}

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
              <div className="p-4 sm:p-5 rounded-3xl bg-[#0D2A1F]/90 border border-[#E5E4E2]/30 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E4E2]/25 pb-2.5">
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
                      placeholder="e.g. 00000-0000000-0"
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
              <div className="p-4 sm:p-5 rounded-3xl bg-[#0D2A1F]/90 border border-[#E5E4E2]/30 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E4E2]/25 pb-2.5">
                  <h3 className="text-base font-extrabold text-amber-300">
                    {isUr ? '۲۔ عہد نامہ (Oath)' : '2. Pledge & Oath (عہد نامہ)'}
                  </h3>
                </div>

                <div className="p-4 rounded-2xl bg-[#071812]/90 border border-[#E5E4E2]/35 space-y-3 leading-loose">
                  <p className="text-sm sm:text-base text-amber-50 font-medium" dir="rtl">
                    میں سوئی خیل اتحاد کے دستور، اس کے اغراض و مقاصد اور اس کے تمام قواعد و ضوابط سے کلی طور پر اتفاق کرتا ہوں۔ میں عہد کرتا ہوں کہ ہر دم تنظیم کا وفادار اور اس کے لیے ہر وقت ہر قسم کی قربانی کے لیے تیار رہوں گا۔ میں یہ بھی عہد کرتا ہوں کہ سوئی قوم کی ترقی و خوشحالی کے لیے اپنی تمام تر لیاقت و قابلیت اور دولت و صلاحیت بروئے کار لاؤں گا۔ تنظیم جو خدمت ذمے لگائے ان شاء اللہ ذوق و شوق سے کروں گا۔ علاوہ ازیں میں وعدہ کرتا ہوں کہ تنظیم کے لیے ہر ماہ کم از کم مبلغ{' '}
                    <span className="inline-block font-mono font-black text-[#CBD5E1] px-2 py-0.5 rounded bg-amber-500/15 border border-amber-400/40">
                      {monthlyPledgeAmount || '100'}
                    </span>{' '}
                    روپے بطور تعاون پیش کروں گا۔
                  </p>

                  {!isUr && (
                    <p className="text-xs text-slate-300 border-t border-slate-800 pt-2.5" dir="ltr">
                      “I fully agree with the constitution, aims, objectives, and all rules and regulations of SUI KHEL ITTEHAD. I solemnly pledge to remain loyal to the organization and ready for every service and sacrifice. I will dedicate my skills, capability, and resources for the progress and prosperity of the Sui nation, fulfill assigned duties diligently InshaAllah, and contribute at least PKR {monthlyPledgeAmount || '100'} monthly.”
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
                      className="w-32 px-3 py-1.5 bg-[#0D2A1F] border border-[#E5E4E2]/40 rounded-xl text-sm font-mono font-bold text-[#CBD5E1]"
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
                      <div className="flex items-center gap-1.5 bg-[#071812] p-1 rounded-xl border border-slate-700">
                        <button
                          type="button"
                          onClick={() => setSigMode('DRAW')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                            sigMode === 'DRAW' ? 'bg-amber-500 text-[#071812]' : 'text-slate-300'
                          }`}
                        >
                          {isUr ? 'ڈرا کریں' : 'Draw'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSigMode('TYPE')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                            sigMode === 'TYPE' ? 'bg-amber-500 text-[#071812]' : 'text-slate-300'
                          }`}
                        >
                          {isUr ? 'ٹائپ کریں' : 'Type'}
                        </button>
                      </div>
                    )}
                  </div>

                  {drawnSignatureDataUrl && isInspectMode ? (
                    <div className="p-3 rounded-2xl bg-[#071812] border border-[#E5E4E2]/40 inline-block">
                      <img src={drawnSignatureDataUrl} alt="Applicant Signature" className="h-20 object-contain" />
                    </div>
                  ) : sigMode === 'DRAW' && !isInspectMode ? (
                    <div className="space-y-1.5">
                      <div className="relative rounded-2xl bg-[#071812] border border-[#E5E4E2]/40 overflow-hidden">
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
              <div className="p-4 sm:p-5 rounded-3xl bg-[#0D2A1F]/90 border border-[#E5E4E2]/30 space-y-3">
                <h3 className="text-base font-extrabold text-amber-300 border-b border-[#E5E4E2]/25 pb-2">
                  {isUr ? '۳۔ تصدیق نمائندہ خاندان' : '3. Tabar Representative Verification (تصدیق نمائندہ خاندان)'}
                </h3>
                <p className="text-xs sm:text-sm text-amber-50/90 leading-relaxed font-medium">
                  {isUr
                    ? 'میں نے مندرجہ بالا اندراجات اچھی طرح ملاحظہ کر لیے ہیں اور میری معلومات کی حد تک وہ بالکل درست ہیں۔ میں یقین دلاتا ہوں کہ موصوف سوئی خیل اتحاد کے وفادار رکن ثابت ہوں گے۔'
                    : 'I have carefully reviewed the entries above and to the best of my knowledge they are completely accurate. I assure that the applicant will prove to be a loyal member of SUI KHEL ITTEHAD.'}
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
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#0B1726] to-[#071812] border-2 border-[#E5E4E2]/45 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E4E2]/25 pb-2">
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
                    <div className="p-3 rounded-2xl bg-[#0D2A1F] border border-slate-700/80 text-xs sm:text-sm text-slate-200 flex flex-wrap items-center gap-2">
                      <span>{isUr ? 'مبلغ' : 'Form Fee Received PKR:'}</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={!canOfficeApprove}
                        value={formFeeAmount}
                        onChange={(e) => setFormFeeAmount(e.target.value.replace(/\D/g, ''))}
                        className="w-24 px-2.5 py-1 rounded-lg bg-[#071812] border border-[#E5E4E2]/40 font-mono font-bold text-[#CBD5E1] text-center"
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
                      {isUr ? 'مہر سوئی خیل اتحاد' : 'Official Organization Mohar'}
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
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2 pb-[calc(16px+env(safe-area-inset-bottom,0px))]" dir="ltr">
                {!embedded && (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-slate-800 text-slate-200 text-xs sm:text-sm font-bold hover:bg-slate-700 transition cursor-pointer"
                  >
                    {isUr ? 'بند کریں' : 'Close'}
                  </button>
                )}

                {canOfficeApprove && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleOfficeApprove}
                    className="min-h-[44px] px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs sm:text-sm font-extrabold shadow-lg flex items-center gap-2 hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    {isSubmitting ? 'Approving...' : 'Approve Rukniyat & Issue Official Serial'}
                  </button>
                )}

                {!isInspectMode && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-h-[44px] w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-[#E5E4E2] via-[#CBD5E1] to-[#CBD5E1] text-[#071812] text-xs sm:text-sm font-black shadow-[0_10px_30px_rgba(212,175,55,0.35)] hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
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
    <div className="fixed inset-0 z-[95] kc-modal-backdrop flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      {bodyWrapper}
    </div>
  );
};

export const RukniyatFormModal: React.FC = () => {
  const { isRukniyatFormOpen, closeRukniyatForm } = useApp();
  if (!isRukniyatFormOpen) return null;
  return <RukniyatFormContent onClose={closeRukniyatForm} />;
};
