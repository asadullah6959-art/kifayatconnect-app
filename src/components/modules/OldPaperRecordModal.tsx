import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Loader2,
  Edit3
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TABBAR_CLANS, CUSTOM_TABBAR_ID, transliterateTabbarToUrdu } from '../../data/tabbars';
import { PROVINCES_DATA } from '../../data/locationData';
import { FundTier } from '../../types';
import { LuxurySelect } from '../common/LuxurySelect';
import {
  formatCnicDisplay,
  isValid13DigitCnic,
  getCnicLockAlertMessage
} from '../../utils/cnic';
import {
  prepareImageForAiScan,
  normalizeDigits,
  normalizeExtractedDate,
  matchProvinceAndDistrict,
  pickBilingualField
} from '../../utils/imageCompression';

interface OldPaperRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OldPaperRecordModal: React.FC<OldPaperRecordModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, language, createOldPaperRecord } = useApp();
  const isUr = language === 'ur';

  const [entryMode, setEntryMode] = useState<'SCAN' | 'MANUAL'>('SCAN');
  const [paperPhotoUrl, setPaperPhotoUrl] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanNotice, setScanNotice] = useState<string>('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [oldMembershipNo, setOldMembershipNo] = useState<string>('');
  const [oldReceiptSerialNo, setOldReceiptSerialNo] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [applicantName, setApplicantName] = useState<string>('');
  const [fatherName, setFatherName] = useState<string>('');
  const [cnic, setCnic] = useState<string>('');
  const [tabbarId, setTabbarId] = useState<string>('faiz_khel');
  const [customTabbarEnglish, setCustomTabbarEnglish] = useState<string>('');
  const [fundTier, setFundTier] = useState<FundTier>('MAHANA');
  const [amount, setAmount] = useState<string>('100');
  const [unit, setUnit] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [stateProvince, setStateProvince] = useState<string>('Khyber Pakhtunkhwa');
  const [district, setDistrict] = useState<string>('Mardan');
  const [address, setAddress] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [savedSerial, setSavedSerial] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const saveCooldownRef = useRef<number>(0);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const aiAutoInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen || currentUser?.role !== 'SUPER_ADMIN') return null;

  const provinceNames = Object.keys(PROVINCES_DATA);
  const availableDistricts = (PROVINCES_DATA[stateProvince]?.districts || []).map((d) => d.name);

  const resetFileInputs = () => {
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (aiAutoInputRef.current) aiAutoInputRef.current.value = '';
  };

  const clearUploadedPhoto = () => {
    setPaperPhotoUrl('');
    setScanNotice('');
    setScanStatus('idle');
    setErrorMsg('');
    resetFileInputs();
  };

  const runAiScan = async (source: File | string) => {
    setErrorMsg('');
    setScanNotice('');
    setScanStatus('idle');
    setIsScanning(true);

    try {
      const prepared = await prepareImageForAiScan(source, 1800, 0.88);
      setPaperPhotoUrl(prepared.dataUrl);

      const response = await fetch('/api/scan-paper-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: prepared.base64,
          mimeType: prepared.mimeType,
          formType: 'AUTO'
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        setScanStatus('error');
        setScanNotice(
          payload?.error ||
            (isUr
              ? 'تصویر بہتر کر کے منسلک کر دی گئی ہے — آپ نیچے تمام خانے دستی پُر یا ترمیم کر سکتے ہیں۔'
              : 'Photo enhanced and attached — you can review or edit all details manually below.')
        );
        return;
      }

      const d = (payload?.data || payload?.fields || {}) as Record<string, unknown>;
      let filledCount = 0;

      const rawMembershipNo = pickBilingualField(d, [
        'serialNo',
        'oldMembershipNo',
        'membershipNo',
        'serialNumber',
        'رکنیت نمبر',
        'رکنیت / سیریل نمبر',
        'سیریل نمبر'
      ]);
      if (rawMembershipNo) {
        setOldMembershipNo(normalizeDigits(rawMembershipNo).trim());
        filledCount += 1;
      }
      const rawReceiptNo = pickBilingualField(d, [
        'oldReceiptSerialNo',
        'receiptNo',
        'receiptNumber',
        'رسید نمبر',
        'رسید'
      ]);
      if (rawReceiptNo) {
        setOldReceiptSerialNo(normalizeDigits(rawReceiptNo).trim());
        filledCount += 1;
      }
      const normDate = normalizeExtractedDate(pickBilingualField(d, ['date', 'formDate', 'تاریخ']));
      if (normDate) {
        setDate(normDate);
        filledCount += 1;
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
        setApplicantName(String(rawName).trim());
        filledCount += 1;
      }
      const rawFather = pickBilingualField(d, ['fatherName', 'father', 'sonOf', 'ولد', 'ولدیت']);
      if (rawFather) {
        setFatherName(String(rawFather).trim());
        filledCount += 1;
      }
      const rawCnic = pickBilingualField(d, ['cnic', 'nic', 'idCard', 'شناختی کارڈ نمبر', 'شناختی کارڈ']);
      if (rawCnic) {
        const cnicDigits = normalizeDigits(rawCnic).replace(/\D/g, '').slice(0, 13);
        if (cnicDigits) {
          setCnic(cnicDigits);
          filledCount += 1;
        }
      }
      const rawAmt = pickBilingualField(d, [
        'amount',
        'monthlyPledgeAmount',
        'fee',
        'مبلغ',
        'رقم',
        'روپے',
        'وصول پائے'
      ]);
      if (rawAmt !== undefined && rawAmt !== null && String(rawAmt).trim() !== '') {
        const cleanAmt = normalizeDigits(rawAmt).replace(/\D/g, '');
        if (cleanAmt && Number(cleanAmt) > 0) {
          setAmount(cleanAmt);
          filledCount += 1;
        }
      }
      const rawUnit = pickBilingualField(d, ['unit', 'یونٹ']);
      const rawDistrict = pickBilingualField(d, ['district', 'ضلع']);
      const rawProvince = pickBilingualField(d, ['stateProvince', 'province', 'صوبہ']);
      if (rawUnit || rawDistrict) {
        setUnit(String(rawUnit || rawDistrict).trim());
        if (rawUnit) filledCount += 1;
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
      const rawAddr = pickBilingualField(d, ['currentAddress', 'address', 'presentAddress', 'موجودہ پتہ', 'پتہ']);
      if (rawAddr) {
        setAddress(String(rawAddr).trim());
        filledCount += 1;
      }
      const locMatch = matchProvinceAndDistrict(rawDistrict || rawUnit, rawProvince, PROVINCES_DATA);
      if (locMatch.stateProvince) {
        setStateProvince(locMatch.stateProvince);
        filledCount += 1;
      }
      if (locMatch.district) {
        setDistrict(locMatch.district);
        filledCount += 1;
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
          setTabbarId(matchedTab.id);
        } else {
          setTabbarId(CUSTOM_TABBAR_ID);
          setCustomTabbarEnglish(tabText);
        }
        filledCount += 1;
      }

      if (filledCount === 0) {
        setScanStatus('success');
        setScanNotice(
          isUr
            ? '✅ تصویر بہتر کر کے منسلک کر دی گئی ہے — نیچے خانوں میں تفصیلات پُر یا ترمیم کر لیں۔'
            : '✅ Photo enhanced and attached — fill or edit any remaining fields below.'
        );
        return;
      }

      setScanStatus('success');
      setScanNotice(
        isUr
          ? `✅ AI Auto نے ${filledCount} خانے خودکار طریقے سے پُر کر دیے ہیں — محفوظ کرنے سے پہلے تفصیلات چیک کر لیں۔`
          : `✅ AI Auto filled ${filledCount} field${filledCount > 1 ? 's' : ''} below — please review before saving.`
      );
    } catch (err) {
      setScanStatus('error');
      setScanNotice(
        err instanceof Error && err.message
          ? err.message
          : isUr
          ? 'AI اسکین ناکام رہا — آپ نیچے دستی اندراج کر سکتے ہیں۔'
          : 'AI auto-scan failed — you can enter details manually below.'
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handlePhotoUploadAndScan = async (e: React.ChangeEvent<HTMLInputElement>, forceAiScan = false) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErrorMsg('');
    setScanNotice('');
    setScanStatus('idle');

    if (!forceAiScan && entryMode === 'MANUAL') {
      try {
        const prepared = await prepareImageForAiScan(file, 1800, 0.88);
        setPaperPhotoUrl(prepared.dataUrl);
      } catch (err) {
        setScanStatus('error');
        setScanNotice(err instanceof Error ? err.message : 'Could not process selected photo.');
      }
      return;
    }

    await runAiScan(file);
  };

  const handleAiAutoClick = async () => {
    if (isScanning) return;
    if (paperPhotoUrl) {
      await runAiScan(paperPhotoUrl);
    } else {
      aiAutoInputRef.current?.click();
    }
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    if (now - saveCooldownRef.current < 500 || isSaving) return;
    saveCooldownRef.current = now;
    setErrorMsg('');

    if (!applicantName.trim()) {
      setErrorMsg(isUr ? 'براہِ کرم رکن کا نام درج کریں۔' : 'Member Name is required.');
      return;
    }
    if (!isValid13DigitCnic(cnic)) {
      setErrorMsg(getCnicLockAlertMessage(language));
      return;
    }

    const selectedClan = TABBAR_CLANS.find((c) => c.id === tabbarId);
    const customEn = customTabbarEnglish.trim();
    const numericAmount = Math.max(0, Number(amount.replace(/\D/g, '')) || 0);

    setIsSaving(true);
    try {
      const res = await createOldPaperRecord({
        oldMembershipNo: oldMembershipNo.trim() || undefined,
        oldReceiptSerialNo: oldReceiptSerialNo.trim() || undefined,
        date,
        applicantName,
        fatherName,
        cnic,
        tabbarId,
        tabbarEnglish: selectedClan ? selectedClan.englishName : customEn || 'Other Tabbar',
        tabbarUrdu: selectedClan ? selectedClan.urduName : transliterateTabbarToUrdu(customEn),
        amount: numericAmount,
        fundTier,
        unit: unit.trim() || district,
        phone,
        stateProvince,
        district,
        address,
        paperFormPhotoUrl: paperPhotoUrl || undefined
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Could not save old record.');
      } else {
        setSavedSerial(res.serialNumber || 'SAVED');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAndClose = () => {
    setSavedSerial(null);
    setErrorMsg('');
    setScanNotice('');
    setScanStatus('idle');
    setApplicantName('');
    setFatherName('');
    setCnic('');
    setOldMembershipNo('');
    setOldReceiptSerialNo('');
    setPaperPhotoUrl('');
    resetFileInputs();
    onClose();
  };

  const inputCls =
    'w-full px-3 py-2 bg-[#0A111D] border border-[#D4AF37]/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FDE047]';

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-[calc(100vw-16px)] max-h-[92dvh] flex flex-col bg-[#070D14] border border-[#D4AF37]/55 rounded-3xl shadow-2xl overflow-hidden box-border">
        {/* Header */}
        <div className="flex items-center justify-between gap-2.5 px-4 py-3.5 bg-[#0D1726] border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-amber-300 truncate">
                {isUr ? 'پرانا دستی ریکارڈ شامل کریں' : 'Add Old / By-Hand Paper Record'}
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                {isUr
                  ? 'صرف بانی / سپر ایڈمن · براہِ راست تصدیق شدہ ریکارڈ اور مہر رسید'
                  : 'Super Admin Only · Pre-Approved with Official Mohar Receipt Unlocked'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label={isUr ? 'بند کریں' : 'Close modal'}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {savedSerial ? (
            <div className="p-6 rounded-2xl bg-emerald-950/35 border border-emerald-500/45 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-extrabold text-white">
                {isUr ? 'پرانا دستی ریکارڈ محفوظ اور منظور ہو گیا!' : 'Old By-Hand Record Digitized & Approved!'}
              </h3>
              <p className="text-xs text-slate-300">
                {isUr
                  ? 'رکن کی پروفائل اور رسید مہر کے ساتھ فعال کر دی گئی ہے۔'
                  : 'Member record is ACTIVE and the Official Mohar Receipt is ready immediately.'}
              </p>
              <div className="inline-block px-4 py-2 rounded-xl bg-[#070D14] border border-[#D4AF37]/50 font-mono text-lg font-black text-[#FDE047]">
                {savedSerial}
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-[#070D14] font-extrabold text-sm"
                >
                  {isUr ? 'مکمل / بند کریں' : 'Done'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveRecord} className="space-y-4">
              {/* Mode Switcher */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setEntryMode('SCAN')}
                  className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                    entryMode === 'SCAN'
                      ? 'bg-amber-500/15 border-[#FDE047] text-amber-200'
                      : 'bg-[#11192C] border-slate-700 text-slate-300'
                  }`}
                >
                  <Camera className="w-5 h-5 text-amber-300 shrink-0" />
                  <div>
                    <div className="text-xs font-extrabold">📷 Scan Paper Form</div>
                    <div className="text-[10px] text-slate-400">AI Auto-Fill from Photo</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('MANUAL')}
                  className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                    entryMode === 'MANUAL'
                      ? 'bg-emerald-500/15 border-emerald-400 text-emerald-200'
                      : 'bg-[#11192C] border-slate-700 text-slate-300'
                  }`}
                >
                  <Edit3 className="w-5 h-5 text-emerald-300 shrink-0" />
                  <div>
                    <div className="text-xs font-extrabold">Skip Scan / Enter Manually</div>
                    <div className="text-[10px] text-slate-400">دستی اندراج کریں</div>
                  </div>
                </button>
              </div>

              {/* Photo Upload + AI Scan Box */}
              <div className="p-4 rounded-2xl bg-[#11192C] border border-[#D4AF37]/35 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                    {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white">
                      {isScanning
                        ? isUr
                          ? 'AI پرانے فارم کو پڑھ رہا ہے...'
                          : 'Scanning Old Form with AI...'
                        : entryMode === 'SCAN'
                        ? isUr
                          ? 'پرانے فارم یا رسید کی تصویر لیں یا گیلری سے منتخب کریں'
                          : 'Capture or Upload Old Paper Form / Receipt (AI Auto-Fill)'
                        : isUr
                        ? 'ثبوت کے لیے پرانے فارم کی تصویر منسلک کریں (اختیاری)'
                        : 'Attach Paper Form / Receipt Photo Proof (Optional)'}
                    </p>
                    <p className="text-[11px] text-slate-400">JPG, PNG, WEBP · Auto-compressed</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="kc-pressable min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold cursor-pointer">
                    <Camera className="w-4 h-4 shrink-0" />
                    <span>{isUr ? '📷 تصویر لیں' : '📷 Take Photo'}</span>
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handlePhotoUploadAndScan(e, false)}
                      className="hidden"
                    />
                  </label>
                  <label className="kc-pressable min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#0A111D] hover:bg-[#161F33] border border-[#D4AF37]/40 text-slate-200 text-xs font-bold cursor-pointer">
                    <ImageIcon className="w-4 h-4 text-[#FDE047] shrink-0" />
                    <span>{isUr ? '🖼️ گیلری' : '🖼️ Choose from Gallery'}</span>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUploadAndScan(e, false)}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={isScanning}
                    onClick={handleAiAutoClick}
                    className="kc-pressable min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-[#070D14] text-xs font-black shadow-md hover:brightness-110 disabled:opacity-60 cursor-pointer"
                  >
                    {isScanning ? (
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    ) : (
                      <Sparkles className="w-4 h-4 shrink-0" />
                    )}
                    <span>
                      {isScanning
                        ? (isUr ? 'اسکین ہو رہا ہے...' : 'Scanning...')
                        : (isUr ? '✨ AI Auto پُر کریں' : '✨ AI Auto')}
                    </span>
                  </button>
                  <input
                    ref={aiAutoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUploadAndScan(e, true)}
                    className="hidden"
                  />
                </div>

                {paperPhotoUrl && (
                  <div className="relative rounded-xl overflow-hidden bg-[#070D14] border border-[#D4AF37]/40">
                    <img
                      src={paperPhotoUrl}
                      alt="Old paper proof"
                      className="w-full max-h-48 object-contain"
                    />
                    <button
                      type="button"
                      onClick={clearUploadedPhoto}
                      aria-label="Remove uploaded image"
                      title={isUr ? 'تصویر ہٹائیں' : 'Remove image'}
                      style={{ position: 'absolute', top: '6px', right: '6px', zIndex: 50 }}
                      className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 border-2 border-[#FDE047] text-white flex items-center justify-center shadow-lg cursor-pointer"
                    >
                      <X className="w-4 h-4 stroke-[2.75]" />
                    </button>
                  </div>
                )}

                {scanNotice && (
                  <div
                    className={`text-xs font-semibold rounded-xl px-3 py-2.5 flex items-center gap-2 border ${
                      scanStatus === 'success'
                        ? 'text-emerald-200 bg-emerald-950/70 border-emerald-400/60'
                        : 'text-amber-200 bg-amber-500/10 border-amber-400/35'
                    }`}
                  >
                    {scanStatus === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    )}
                    <span>{scanNotice}</span>
                  </div>
                )}
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-amber-200 mb-1">
                    Old Membership No. (پرانا رکنیت نمبر)
                  </label>
                  <input
                    type="text"
                    value={oldMembershipNo}
                    onChange={(e) => setOldMembershipNo(e.target.value)}
                    placeholder="e.g. SK-412"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-200 mb-1">
                    Old Receipt Serial No. (پرانی رسید نمبر / Auto)
                  </label>
                  <input
                    type="text"
                    value={oldReceiptSerialNo}
                    onChange={(e) => setOldReceiptSerialNo(e.target.value)}
                    placeholder="Leave blank for Auto KC-YYYY-XXXX"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-200 mb-1">
                    Member Name * (نام)
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="Full Name"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-200 mb-1">
                    Father Name (ولدیت)
                  </label>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="Father's Name"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-200 mb-1">
                    13-Digit CNIC * (شناختی کارڈ)
                  </label>
                  <input
                    type="text"
                    required
                    value={cnic}
                    onChange={(e) => setCnic(formatCnicDisplay(e.target.value))}
                    placeholder="XXXXX-XXXXXXX-X"
                    inputMode="numeric"
                    className={`${inputCls} font-mono`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-200 mb-1">
                    Date (تاریخ)
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-200 mb-1">
                    Tabar / Family (ٹبر)
                  </label>
                  <LuxurySelect
                    label="Tabar / Family (ٹبر)"
                    value={tabbarId}
                    onChange={setTabbarId}
                    options={[
                      ...TABBAR_CLANS.map((c) => ({
                        value: c.id,
                        label: `${c.urduName} — ${c.englishName}`,
                      })),
                      { value: CUSTOM_TABBAR_ID, label: 'Other / Custom Tabbar' },
                    ]}
                    searchable
                    compact
                  />
                </div>

                {tabbarId === CUSTOM_TABBAR_ID && (
                  <div>
                    <label className="block text-[11px] font-bold text-amber-200 mb-1">
                      Custom Tabbar Name
                    </label>
                    <input
                      type="text"
                      value={customTabbarEnglish}
                      onChange={(e) => setCustomTabbarEnglish(e.target.value)}
                      placeholder="Custom Tabbar"
                      className={inputCls}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-amber-200 mb-1">
                    Fund Tier (فنڈ کی قسم)
                  </label>
                  <LuxurySelect
                    label="Fund Tier (فنڈ کی قسم)"
                    value={fundTier}
                    onChange={(val) => setFundTier(val as FundTier)}
                    options={[
                      { value: 'MAHANA', label: 'Mahana Fund (ماہانہ فنڈ)' },
                      { value: 'SALANA', label: 'Salana Fund (سالانہ فنڈ)' },
                      { value: 'HANGAMI', label: 'ہنگامی فنڈ / Hangami Fund' },
                    ]}
                    compact
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-200 mb-1">
                    Amount PKR (رقم روپے میں)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 1200"
                    className={`${inputCls} font-mono font-bold text-[#FDE047]`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-200 mb-1">
                    Unit (یونٹ)
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Unit / Halqa"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-200 mb-1">
                    Phone (رابطہ نمبر)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="03XX-XXXXXXX"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-200 mb-1">
                    Province (صوبہ)
                  </label>
                  <LuxurySelect
                    label="Province (صوبہ)"
                    value={stateProvince}
                    onChange={(val) => {
                      setStateProvince(val);
                      const firstDist = PROVINCES_DATA[val]?.districts?.[0]?.name || '';
                      if (firstDist) setDistrict(firstDist);
                    }}
                    options={provinceNames.map((p) => ({ value: p, label: p }))}
                    searchable
                    compact
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-200 mb-1">
                    District (ضلع)
                  </label>
                  <LuxurySelect
                    label="District (ضلع)"
                    value={district}
                    onChange={setDistrict}
                    options={availableDistricts.map((d) => ({ value: d, label: d }))}
                    searchable
                    compact
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-amber-200 mb-1">
                    Address (پتہ)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Village / Mohalla / City"
                    className={inputCls}
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 pb-[calc(12px+env(safe-area-inset-bottom,0px))]">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  {isUr ? 'منسوخ کریں' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-[#070D14] text-xs font-black shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {isSaving
                    ? isUr
                      ? 'محفوظ ہو رہا ہے...'
                      : 'Saving...'
                    : isUr
                    ? 'تصدیق شدہ ریکارڈ محفوظ کریں'
                    : 'Save Pre-Approved Record'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
