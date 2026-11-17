import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  FileText,
  Upload,
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
import {
  formatCnicDisplay,
  isValid13DigitCnic,
  getCnicLockAlertMessage
} from '../../utils/cnic';

interface OldPaperRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

async function compressPaperPhoto(file: File): Promise<{ base64: string; dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file'));
      img.onload = () => {
        const maxSide = 1100;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const dataUrl = String(reader.result);
          resolve({
            base64: dataUrl.split(',')[1] || '',
            dataUrl,
            mimeType: 'image/jpeg'
          });
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
        resolve({
          base64: dataUrl.split(',')[1] || '',
          dataUrl,
          mimeType: 'image/jpeg'
        });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const OldPaperRecordModal: React.FC<OldPaperRecordModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, language, createOldPaperRecord } = useApp();
  const isUr = language === 'ur';

  const [entryMode, setEntryMode] = useState<'SCAN' | 'MANUAL'>('SCAN');
  const [paperPhotoUrl, setPaperPhotoUrl] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanNotice, setScanNotice] = useState<string>('');

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

  if (!isOpen || currentUser?.role !== 'SUPER_ADMIN') return null;

  const provinceNames = Object.keys(PROVINCES_DATA);
  const availableDistricts = (PROVINCES_DATA[stateProvince]?.districts || []).map((d) => d.name);

  const handlePhotoUploadAndScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setScanNotice('');

    try {
      const compressed = await compressPaperPhoto(file);
      setPaperPhotoUrl(compressed.dataUrl);

      if (entryMode === 'MANUAL') return;

      setIsScanning(true);
      const response = await fetch('/api/scan-paper-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: compressed.base64,
          mimeType: compressed.mimeType
        })
      });

      if (!response.ok) {
        setScanNotice(
          isUr
            ? 'AI اسکین دستیاب نہیں یا تصویر صاف نہیں — نیچے دستی اندراج مکمل کریں۔'
            : 'AI scan unavailable or unclear — photo attached, enter details manually below.'
        );
        return;
      }

      const payload = await response.json();
      const d = payload?.data || {};
      if (d.oldMembershipNo) setOldMembershipNo(String(d.oldMembershipNo));
      if (d.oldReceiptSerialNo) setOldReceiptSerialNo(String(d.oldReceiptSerialNo));
      if (d.date && /^\d{4}-\d{2}-\d{2}$/.test(d.date)) setDate(d.date);
      if (d.applicantName) setApplicantName(String(d.applicantName));
      if (d.fatherName) setFatherName(String(d.fatherName));
      if (d.cnic) setCnic(formatCnicDisplay(String(d.cnic)));
      if (d.amount !== undefined && d.amount !== null) {
        const cleanAmt = String(d.amount).replace(/\D/g, '');
        if (cleanAmt) setAmount(cleanAmt);
      }
      if (d.unit) setUnit(String(d.unit));
      if (d.phone) setPhone(String(d.phone));
      if (d.district) setDistrict(String(d.district));
      if (d.address) setAddress(String(d.address));
      if (d.tabar) {
        const matchedTab = TABBAR_CLANS.find(
          (c) =>
            c.englishName.toLowerCase().includes(String(d.tabar).toLowerCase()) ||
            c.urduName.includes(String(d.tabar))
        );
        if (matchedTab) {
          setTabbarId(matchedTab.id);
        } else {
          setTabbarId(CUSTOM_TABBAR_ID);
          setCustomTabbarEnglish(String(d.tabar));
        }
      }
      setScanNotice(
        isUr
          ? '✨ AI نے پرانا فارم پڑھ لیا ہے — محفوظ کرنے سے پہلے تفصیلات چیک کر لیں۔'
          : '✨ AI auto-filled extracted fields — please review before saving.'
      );
    } catch {
      setScanNotice(
        isUr
          ? 'AI اسکین ناکام رہا — آپ نیچے دستی اندراج کر سکتے ہیں۔'
          : 'AI auto-scan failed — you can enter details manually below.'
      );
    } finally {
      setIsScanning(false);
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
    setApplicantName('');
    setFatherName('');
    setCnic('');
    setOldMembershipNo('');
    setOldReceiptSerialNo('');
    setPaperPhotoUrl('');
    onClose();
  };

  const inputCls =
    'w-full px-3 py-2 bg-[#0A111D] border border-[#D4AF37]/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FDE047]';

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl max-h-[92dvh] flex flex-col bg-[#070D14] border border-[#D4AF37]/55 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 bg-[#0D1726] border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-amber-300">
                {isUr ? 'پرانا دستی ریکارڈ شامل کریں' : 'Add Old / By-Hand Paper Record'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isUr
                  ? 'صرف بانی / سپر ایڈمن · براہِ راست تصدیق شدہ ریکارڈ اور مہر رسید'
                  : 'Super Admin Only · Pre-Approved with Official Mohar Receipt Unlocked'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
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
              <div className="p-4 rounded-2xl bg-[#11192C] border border-[#D4AF37]/35 space-y-2.5">
                <label className="flex flex-col sm:flex-row items-center justify-between gap-3 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                      {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {isScanning
                          ? isUr
                            ? 'AI پرانے فارم کو پڑھ رہا ہے...'
                            : 'Scanning Old Form with AI...'
                          : entryMode === 'SCAN'
                          ? isUr
                            ? 'پرانے فارم یا رسید کی تصویر اپ لوڈ کریں (AI خودکار اندراج)'
                            : 'Upload Old Paper Form / Receipt Photo (AI Auto-Fill)'
                          : isUr
                          ? 'ثبوت کے لیے پرانے فارم کی تصویر منسلک کریں (اختیاری)'
                          : 'Attach Paper Form / Receipt Photo Proof (Optional)'}
                      </p>
                      <p className="text-[11px] text-slate-400">JPG, PNG · Auto-compressed</p>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold shrink-0">
                    {isScanning ? 'Scanning...' : 'Choose Photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUploadAndScan}
                    className="hidden"
                  />
                </label>

                {paperPhotoUrl && (
                  <img
                    src={paperPhotoUrl}
                    alt="Old paper proof"
                    className="w-full max-h-40 object-contain rounded-xl bg-[#070D14] border border-slate-800"
                  />
                )}

                {scanNotice && (
                  <div className="text-xs font-semibold text-amber-200 bg-amber-500/10 border border-amber-400/30 rounded-xl px-3 py-2 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
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
                  <select
                    value={tabbarId}
                    onChange={(e) => setTabbarId(e.target.value)}
                    className={inputCls}
                  >
                    {TABBAR_CLANS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.urduName} — {c.englishName}
                      </option>
                    ))}
                    <option value={CUSTOM_TABBAR_ID}>Other / Custom Tabbar</option>
                  </select>
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
                  <select
                    value={fundTier}
                    onChange={(e) => setFundTier(e.target.value as FundTier)}
                    className={inputCls}
                  >
                    <option value="MAHANA">Mahana Fund (ماہانہ فنڈ)</option>
                    <option value="SALANA">Salana Fund (سالانہ فنڈ)</option>
                    <option value="HANGAMI">ہنگامی فنڈ / Hangami Fund</option>
                  </select>
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
                  <select
                    value={stateProvince}
                    onChange={(e) => {
                      setStateProvince(e.target.value);
                      const firstDist = PROVINCES_DATA[e.target.value]?.districts?.[0]?.name || '';
                      if (firstDist) setDistrict(firstDist);
                    }}
                    className={inputCls}
                  >
                    {provinceNames.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-200 mb-1">
                    District (ضلع)
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className={inputCls}
                  >
                    {availableDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
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

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  {isUr ? 'منسوخ کریں' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-[#070D14] text-xs font-black shadow-lg disabled:opacity-50"
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
