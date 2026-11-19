import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Coins,
  CheckCircle2,
  XCircle,
  Search,
  Printer,
  Plus,
  Send,
  FileDown,
  MapPin,
  Upload,
  Image as ImageIcon,
  Eye,
  X,
  ArrowRight,
  ArrowLeft,
  Clock,
  ShieldCheck,
  FilePlus2,
  AlertTriangle,
  Camera,
  FileCheck2
} from 'lucide-react';
import { FundCategory, FundTier, PaymentMethod, PaymentTransaction } from '../../types';
import { exportTransactionsToCSV } from '../../utils/exportUtils';
import {
  PROVINCE_OPTIONS,
  getDistrictsForProvince,
  mapLegacyRegionToHierarchy
} from '../../data/locationData';
import { compressImageFile } from '../../utils/imageCompression';
import { LuxurySelect } from '../common/LuxurySelect';
import { ProfileCompletionGate, needsProfileCompletion } from '../common/ProfileCompletionGate';
import { DastoorPaymentCalculator } from '../common/DastoorPaymentCalculator';
import { OldPaperRecordModal } from './OldPaperRecordModal';
import { RukniyatFormContent } from './RukniyatFormModal';
import {
  DASTOOR_MONTHLY_RATE,
  calculateDastoorPeriod,
  calculateSalanaPeriod,
} from '../../utils/dastoor';
import {
  formatCnicDisplay,
  isValid13DigitCnic,
  getCnicLockAlertMessage,
} from '../../utils/cnic';
import { resolveReceiptFundTierLabel } from '../../utils/receiptExport';

const PAYMENT_METHODS: Array<{ id: PaymentMethod; label: string; labelUr: string; hint: string; hintUr: string }> = [
  { id: 'EasyPaisa', label: 'EasyPaisa', labelUr: 'ایزی پیسہ', hint: 'Mobile Wallet / Till', hintUr: 'موبائل والٹ / ٹل' },
  { id: 'JazzCash', label: 'JazzCash', labelUr: 'جاز کیش', hint: 'Mobile Account', hintUr: 'موبائل اکاؤنٹ' },
  { id: 'Bank Transfer', label: 'Bank Transfer', labelUr: 'بینک ٹرانسفر', hint: 'IBFT / Raast / Bank', hintUr: 'آئی بی ایف ٹی / راست / بینک' },
  { id: 'Cash', label: 'Cash', labelUr: 'نقد رقم', hint: 'District Office / Receipt', hintUr: 'ضلعی دفتر / رسید' }
];

export const FundsAndPayments: React.FC = () => {
  const {
    currentUser,
    payments,
    verifyPayment,
    submitPayment,
    setSelectedReceipt,
    openCompleteProfileModal,
    appSettings,
    language
  } = useApp();
  const isUr = language === 'ur';
  const requiresProfileCompletion = needsProfileCompletion(currentUser);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAuditOfficer = Boolean(currentUser?.isAuditOfficer);
  const hasFullAuditView = isSuperAdmin || isAuditOfficer;
  const isDistrictAdmin = currentUser?.role === 'ADMIN';
  const isCoAdmin = currentUser?.role === 'CO_ADMIN';
  const isMember = currentUser?.role === 'MEMBER';
  // Final payment & Raseed approval restricted strictly to Founder & 3 Additional Super Admins
  const canVerify = isSuperAdmin;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterFund, setFilterFund] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterProvince, setFilterProvince] = useState<string>(
    !hasFullAuditView && (isCoAdmin || isDistrictAdmin)
      ? (currentUser?.assignedStateProvince || currentUser?.stateProvince || 'ALL')
      : 'ALL'
  );
  const [filterDistrict, setFilterDistrict] = useState<string>(
    !hasFullAuditView && isDistrictAdmin
      ? (currentUser?.assignedDistrict || currentUser?.district || 'ALL')
      : 'ALL'
  );

  // Unified Funds & Rukniyat Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<'FUNDS' | 'RUKNIYAT'>('FUNDS');

  // 3-Step Payment Submission Modal (3-Tier Fund Calculator + Mandatory 13-Digit CNIC)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isOldPaperModalOpen, setIsOldPaperModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fundTier, setFundTier] = useState<FundTier>('MAHANA');
  const [monthsCount, setMonthsCount] = useState<number>(1);
  const [yearsCount, setYearsCount] = useState<number>(1);
  const [startDay, setStartDay] = useState<number>(() => new Date().getDate());
  const [startMonth, setStartMonth] = useState<number>(() => new Date().getMonth());
  const [startYear, setStartYear] = useState<number>(() => new Date().getFullYear());
  const [payAmount, setPayAmount] = useState<string>('');
  const [payFund, setPayFund] = useState<FundCategory>('Monthly Contribution');
  const [payerCnic, setPayerCnic] = useState<string>(() =>
    currentUser?.cnic ? formatCnicDisplay(currentUser.cnic) : ''
  );
  const [unit, setUnit] = useState<string>('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('EasyPaisa');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [receiptImageUrl, setReceiptImageUrl] = useState<string>('');
  const [receiptImageName, setReceiptImageName] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const lastActionTsRef = useRef<number>(0);
  const receiptCameraInputRef = useRef<HTMLInputElement | null>(null);
  const receiptGalleryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (currentUser?.cnic && !payerCnic) {
      setPayerCnic(formatCnicDisplay(currentUser.cnic));
    }
  }, [currentUser?.cnic, payerCnic]);

  // Preview / Reject modals
  const [previewTx, setPreviewTx] = useState<PaymentTransaction | null>(null);
  const [rejectTxId, setRejectTxId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [downloadToast, setDownloadToast] = useState(false);

  if (!currentUser) return null;

  const visibleTransactions = payments.filter(p => {
    if (isAuditOfficer || isSuperAdmin) return true;
    if (isMember) return p.userId === currentUser.id;
    if (isDistrictAdmin) {
      const myDist = currentUser.assignedDistrict || currentUser.district;
      const txDist = p.district || mapLegacyRegionToHierarchy(p.userRegion).district;
      return txDist === myDist;
    }
    if (isCoAdmin) {
      const myProv = currentUser.assignedStateProvince || currentUser.stateProvince;
      const txProv = p.stateProvince || mapLegacyRegionToHierarchy(p.userRegion).stateProvince;
      return txProv === myProv;
    }
    return true;
  });

  const filteredTransactions = visibleTransactions.filter(tx => {
    const fallback = mapLegacyRegionToHierarchy(tx.userRegion);
    const txProv = tx.stateProvince || fallback.stateProvince;
    const txDist = tx.district || fallback.district;

    const matchesSearch =
      tx.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txDist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txProv.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFund = filterFund === 'ALL' || tx.fundCategory === filterFund;
    const matchesStatus = filterStatus === 'ALL' || tx.status === filterStatus;
    const matchesProvince = filterProvince === 'ALL' || txProv === filterProvince;
    const matchesDistrict = filterDistrict === 'ALL' || txDist === filterDistrict;

    return matchesSearch && matchesFund && matchesStatus && matchesProvince && matchesDistrict;
  });

  const verifiedPayments = visibleTransactions.filter(p => p.status === 'VERIFIED');
  const totalVerifiedSum = verifiedPayments.reduce((acc, curr) => acc + curr.amount, 0);
  const pendingPayments = visibleTransactions.filter(p => p.status === 'PENDING_VERIFICATION');
  const pendingSum = pendingPayments.reduce((acc, curr) => acc + curr.amount, 0);

  const resetReceiptFileInputs = () => {
    if (receiptCameraInputRef.current) receiptCameraInputRef.current.value = '';
    if (receiptGalleryInputRef.current) receiptGalleryInputRef.current.value = '';
  };

  const clearReceiptUpload = () => {
    setReceiptImageUrl('');
    setReceiptImageName('');
    setUploadError(null);
    resetReceiptFileInputs();
  };

  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(isUr ? 'تصویر 10MB کی حد سے زیادہ ہے۔ براہ کرم چھوٹی تصویر منتخب کریں۔' : 'Image exceeds 10MB limit. Please choose a smaller photo.');
      return;
    }
    setUploadError(null);
    setIsCompressing(true);
    try {
      const compressed = await compressImageFile(file, 1024, 0.75, 750 * 1024);
      setReceiptImageUrl(compressed.dataUrl);
      setReceiptImageName(file.name);
    } catch (err: any) {
      setUploadError(err?.message || (isUr ? 'منتخب کردہ رسید کی تصویر پر کارروائی نہیں ہو سکی۔' : 'Unable to process selected receipt photo.'));
    } finally {
      setIsCompressing(false);
    }
  };

  const resetPaymentModal = () => {
    setIsSubmitModalOpen(false);
    setStep(1);
    setFundTier('MAHANA');
    setMonthsCount(1);
    setYearsCount(1);
    setStartDay(new Date().getDate());
    setStartMonth(new Date().getMonth());
    setStartYear(new Date().getFullYear());
    setPayAmount('');
    setPayFund('Monthly Contribution');
    setPayerCnic(currentUser?.cnic ? formatCnicDisplay(currentUser.cnic) : '');
    setUnit('');
    setPayMethod('EasyPaisa');
    setPayRef('');
    setPayNotes('');
    setReceiptImageUrl('');
    setReceiptImageName('');
    setUploadError(null);
    setSubmitError(null);
    resetReceiptFileInputs();
  };

  const mahanaPeriod = calculateDastoorPeriod(startMonth, startYear, Math.min(11, Math.max(1, monthsCount)));
  const salanaPeriod = calculateSalanaPeriod(startMonth, startYear, Math.max(1, yearsCount));

  const numericPayAmount =
    fundTier === 'MAHANA'
      ? mahanaPeriod.totalAmount
      : fundTier === 'SALANA'
      ? salanaPeriod.totalAmount
      : Number(payAmount);

  const isCnicValid = isValid13DigitCnic(payerCnic);
  const isPayAmountValid =
    fundTier === 'MAHANA'
      ? monthsCount >= 1 && monthsCount <= 11 && mahanaPeriod.totalAmount > 0
      : fundTier === 'SALANA'
      ? yearsCount >= 1 && salanaPeriod.totalAmount > 0
      : Boolean(payAmount.trim()) && Number.isFinite(numericPayAmount) && numericPayAmount > 0;
  const canProceedStep1 = isPayAmountValid && isCnicValid;

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastActionTsRef.current < 500 || isSubmittingPayment) return;
    lastActionTsRef.current = now;

    if (!isCnicValid) {
      setSubmitError(getCnicLockAlertMessage(language));
      return;
    }
    if (!isPayAmountValid) return;

    setSubmitError(null);
    setIsSubmittingPayment(true);
    try {
      const cleanRef =
        payRef.trim() ||
        `${payMethod.replace(/\s+/g, '').substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`;

      const resolvedCategory: FundCategory =
        fundTier === 'MAHANA'
          ? 'Monthly Contribution'
          : fundTier === 'SALANA'
          ? 'Annual Welfare Fund'
          : payFund || 'Emergency Relief';

      const maxDayInSelectedMonth = new Date(startYear, startMonth + 1, 0).getDate();
      const safeDay = Math.max(1, Math.min(maxDayInSelectedMonth, startDay));
      const formattedSelectedDate = `${startYear}-${String(startMonth + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;

      const res = await submitPayment({
        amount: Math.round(numericPayAmount),
        fundCategory: resolvedCategory,
        fundTier,
        yearsCount: fundTier === 'SALANA' ? yearsCount : undefined,
        unit: unit.trim() || undefined,
        payerCnic: formatCnicDisplay(payerCnic),
        paymentMethod: payMethod,
        referenceNumber: cleanRef,
        date: formattedSelectedDate,
        startDay: safeDay,
        startMonth,
        startYear,
        proofNote: payNotes.trim() || undefined,
        receiptImageUrl: receiptImageUrl || undefined,
        receiptImageName: receiptImageName || undefined,
        paymentMode: fundTier === 'HANGAMI' ? 'OTHER' : 'DASTOOR',
        ...(fundTier === 'MAHANA'
          ? {
              monthsCount: mahanaPeriod.monthsCount,
              ratePerMonth: DASTOOR_MONTHLY_RATE,
              startMonth: mahanaPeriod.startMonth,
              startYear: mahanaPeriod.startYear,
              periodLabelEn: mahanaPeriod.periodLabelEn,
              periodLabelUr: mahanaPeriod.periodLabelUr,
            }
          : fundTier === 'SALANA'
          ? {
              monthsCount: salanaPeriod.monthsCount,
              ratePerMonth: DASTOOR_MONTHLY_RATE,
              startMonth: salanaPeriod.startMonth,
              startYear: salanaPeriod.startYear,
              periodLabelEn: salanaPeriod.periodLabelEn,
              periodLabelUr: salanaPeriod.periodLabelUr,
            }
          : {
              periodLabelEn: 'ہنگامی فنڈ / Hangami Fund',
              periodLabelUr: 'ہنگامی فنڈ / Hangami Fund',
            }),
      });

      if (!res.success) {
        setSubmitError(res.error || getCnicLockAlertMessage(language));
        return;
      }
      resetPaymentModal();
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleDebouncedVerify = (txId: string, approved: boolean) => {
    const now = Date.now();
    if (now - lastActionTsRef.current < 500) return;
    lastActionTsRef.current = now;
    verifyPayment(txId, approved);
  };

  const handleExportCSV = () => {
    exportTransactionsToCSV(
      filteredTransactions,
      currentUser,
      `Category: ${filterFund} · Status: ${filterStatus}`
    );
    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 2500);
  };

  const handleConfirmReject = () => {
    const now = Date.now();
    if (now - lastActionTsRef.current < 500 || !rejectTxId) return;
    lastActionTsRef.current = now;
    verifyPayment(rejectTxId, false, rejectReason.trim() || (isUr ? 'رسید کی تصدیق نہیں ہو سکی۔' : 'Receipt could not be verified.'));
    setRejectTxId(null);
    setRejectReason('');
  };

  const localizeMethod = (m: string) => {
    if (!isUr) return m;
    const found = PAYMENT_METHODS.find(pm => pm.id === m);
    return found ? found.labelUr : m;
  };

  const renderStatusPill = (status: PaymentTransaction['status']) => {
    if (status === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-md font-bold bg-[#131C31] text-[#38BDF8] border border-[#38BDF8]/45">
          <CheckCircle2 className="w-3 h-3" />
          {isUr ? 'منظور شدہ ✓' : 'Approved ✓'}
        </span>
      );
    }
    if (status === 'PENDING_VERIFICATION') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-md font-bold bg-[#D4AF37]/15 text-[#F5D061] border border-[#D4AF37]/45">
          <Clock className="w-3 h-3" />
          {isUr ? 'جمع شدہ / زیرِ جائزہ' : 'Under Review'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-md font-bold bg-rose-950/75 text-rose-300 border border-rose-500/45">
        <XCircle className="w-3 h-3" />
        {isUr ? 'مسترد' : 'Rejected'}
      </span>
    );
  };

  return (
    <div className="space-y-5 max-w-full pb-[100px]">
      {downloadToast && (
        <div className="fixed top-5 right-5 z-50 pointer-events-none no-print">
          <div className="bg-[#090D16] text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl border border-[#D4AF37]/50 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">
              {isUr ? 'مالیاتی لیجر CSV ڈاؤن لوڈ ہو گیا!' : 'Financial ledger CSV downloaded!'}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25 no-print">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#F5D061] uppercase tracking-wider">
              {isAuditOfficer && !isSuperAdmin
                ? (isUr ? 'آڈٹ آفیسر تصدیقی لیجر (صرف پڑھنے کے لیے)' : 'Audit Officer Verification Ledger (Read-Only)')
                : isMember
                ? (isUr ? 'ذاتی مالیاتی کھاتہ' : 'Personal Ledger')
                : isDistrictAdmin
                ? (isUr ? `${currentUser.assignedDistrict || currentUser.district} فنڈز` : `${currentUser.assignedDistrict || currentUser.district} Funds`)
                : isCoAdmin
                ? (isUr ? `${currentUser.assignedStateProvince || currentUser.stateProvince} فنڈز` : `${currentUser.assignedStateProvince || currentUser.stateProvince} Funds`)
                : (isUr ? 'مرکزی خزانہ لیجر' : 'Central Treasury Ledger')}
            </span>
            <span className="text-[#D4AF37]/50">·</span>
            <span className="text-xs text-slate-400">
              {isUr ? 'آڈٹ شدہ فلاحی عطیات و چندہ' : 'Audited Welfare Contributions'}
            </span>
          </div>
          <h1 className={`text-xl sm:text-2xl font-bold text-white mt-1 flex items-center gap-2 ${isUr ? 'kc-font-urdu' : ''}`}>
            <Coins className="w-6 h-6 text-[#F5D061] shrink-0" />
            <span>{isUr ? 'فنڈز اور ادائیگیاں' : 'Funds & Contributions'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {canVerify
              ? (isUr ? 'اپلوڈ کردہ رسیدوں کا جائزہ لیں، ادائیگیاں منظور کریں اور تصدیق شدہ واؤچر جاری کریں۔' : 'Review uploaded payment receipts, approve contributions, and issue certified vouchers.')
              : isAuditOfficer
              ? (isUr ? 'پاکستان بھر کے اراکین کے عطیات اور رسیدوں کے ثبوت کا آڈٹ معائنہ۔' : 'Read-only inspection of all member contributions and uploaded payment receipt proofs across Pakistan.')
              : (isUr ? '3 آسان مراحل میں رسید اپلوڈ اور فوری اسٹیٹس ٹریکنگ کے ساتھ ادائیگی جمع کرائیں۔' : 'Submit contributions in 3 simple steps with receipt upload and instant status tracking.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setIsOldPaperModalOpen(true)}
              className="kc-pressable flex items-center gap-1.5 px-3 py-2 bg-[#064E3B]/75 hover:bg-[#065F46] text-[#FEF08A] border border-[#D4AF37]/55 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <FilePlus2 className="w-3.5 h-3.5 text-[#FDE047]" />
              <span>
                {isUr
                  ? '+ پرانا دستی ریکارڈ شامل کریں'
                  : '+ Add Old / By-Hand Record (پرانا دستی ریکارڈ شامل کریں)'}
              </span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="kc-pressable flex items-center gap-1.5 px-3 py-2 bg-[#141B2D] hover:bg-[#1A233A] text-slate-200 border border-[#D4AF37]/40 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isUr ? 'CSV برآمد کریں' : 'Export CSV'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="kc-pressable flex items-center gap-1.5 px-3 py-2 bg-[#141B2D] hover:bg-[#1A233A] text-slate-200 border border-[#D4AF37]/40 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#F5D061]" />
            <span>{isUr ? 'پرنٹ' : 'Print'}</span>
          </button>

          <button
            onClick={() => {
              if (requiresProfileCompletion) {
                openCompleteProfileModal();
              } else {
                setIsSubmitModalOpen(true);
              }
            }}
            className="kc-pressable kc-gold-button flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isUr ? 'ادائیگی جمع کرائیں' : 'Submit Payment'}</span>
          </button>
        </div>
      </div>

      {requiresProfileCompletion && (
        <ProfileCompletionGate compact featureName={isUr ? 'فلاحی فنڈ ادائیگیاں' : 'Contribution Payments'} />
      )}

      {/* Unified Navigation Tabs: Funds & Raseed Wasooli | Rukniyat Form */}
      <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl kc-tab-shell no-print">
        <button
          type="button"
          onClick={() => setActiveSubTab('FUNDS')}
          className={`kc-pressable py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'FUNDS'
              ? 'kc-gold-button shadow-md'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Coins className="w-4 h-4 shrink-0" />
          <span className="truncate">
            {isUr ? 'فنڈز اور رسید وصولی' : 'Funds & Raseed Wasooli'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('RUKNIYAT')}
          className={`kc-pressable py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'RUKNIYAT'
              ? 'kc-gold-button shadow-md'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <FileCheck2 className="w-4 h-4 shrink-0" />
          <span className="truncate">
            {isUr ? 'رکنیت فارم (Rukniyat Form)' : 'Rukniyat Form (رکنیت فارم)'}
          </span>
        </button>
      </div>

      {activeSubTab === 'RUKNIYAT' ? (
        <RukniyatFormContent embedded />
      ) : (
        <>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="kc-obsidian-card kc-gold-touch p-4 rounded-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            {isUr ? 'کل منظور شدہ فنڈز' : 'Total Approved Funds'}
          </span>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-xl sm:text-2xl font-extrabold text-white font-mono tabular-nums">
              PKR {totalVerifiedSum.toLocaleString()}
            </span>
            <span className="text-[11px] text-emerald-400 font-bold">{isUr ? 'تصدیق شدہ' : 'Cleared'}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
            {isUr ? `${verifiedPayments.length} منظور شدہ لین دین` : `${verifiedPayments.length} approved transactions`}
          </p>
        </div>

        <div className="kc-obsidian-card kc-gold-touch p-4 rounded-2xl !border-[#F5D061]/55">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#F5D061] block">
            {isUr ? 'تصدیق کے منتظر' : 'Pending Verification'}
          </span>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-xl sm:text-2xl font-extrabold text-[#F5D061] font-mono tabular-nums">
              PKR {pendingSum.toLocaleString()}
            </span>
            <span className="text-[11px] text-[#F5D061] font-bold font-mono tabular-nums">
              {isUr ? `${pendingPayments.length} قطار میں` : `${pendingPayments.length} Queue`}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mt-1">
            {canVerify
              ? (isUr ? 'آفیسر کی تصدیق کے منتظر' : 'Awaiting officer verification')
              : (isUr ? 'خزانہ کی منظوری کے منتظر' : 'Awaiting treasury approval')}
          </p>
        </div>

        <div className="kc-emerald-panel kc-gold-touch p-4 rounded-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block">
            {isUr ? 'ڈیجیٹل لیجر شفافیت' : 'Digital Ledger Integrity'}
          </span>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-xl sm:text-2xl font-extrabold text-white font-mono tabular-nums">
              {visibleTransactions.length}
            </span>
            <span className="text-[11px] text-[#F5D061] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isUr ? 'آڈٹ شدہ' : 'Audited'}
            </span>
          </div>
          <p className="text-[11px] text-emerald-100/80 mt-1">
            {isUr ? 'ہر منظور شدہ ادائیگی پر ای رسید جاری ہوتی ہے' : 'Every approved payment issues an E-Receipt'}
          </p>
        </div>
      </div>

      {/* Filters + Ledger */}
      <div className="report-print-area kc-obsidian-card rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#D4AF37]/20 no-print">
          <div>
            <h3 className="text-sm font-bold text-[#F5D061]">
              {isUr ? 'لیجر لین دین' : 'Ledger Transactions'}
            </h3>
            <p className="text-xs text-slate-400">
              {isUr ? 'رسیدوں کی تصاویر، حوالہ نمبر اور فوری منظوری کا اسٹیٹس' : 'Receipt photos, reference numbers, and real-time approval status'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-[#F5D061] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isUr ? 'حوالہ، ممبر، ضلع تلاش کریں...' : 'Search ref, member, district...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="kc-luxury-input pl-8 pr-3 py-1.5 text-xs rounded-xl w-full sm:w-52"
              />
            </div>

            <div className="w-44">
              <LuxurySelect
                compact
                value={filterFund}
                onChange={setFilterFund}
                label={isUr ? 'فنڈ کی قسم' : 'Fund Category'}
                options={[
                  { value: 'ALL', label: isUr ? 'تمام اقسام' : 'All Categories' },
                  { value: 'Monthly Contribution', label: isUr ? 'ماہانہ چندہ / حصہ' : 'Monthly Contribution' },
                  { value: 'Annual Welfare Fund', label: isUr ? 'سالانہ فلاحی فنڈ' : 'Annual Welfare Fund' },
                  { value: 'Emergency Relief', label: isUr ? 'ہنگامی امداد' : 'Emergency Relief' },
                  { value: 'Zakat & Sadqah', label: isUr ? 'زکوٰۃ و صدقات' : 'Zakat & Sadqah' }
                ]}
              />
            </div>

            <div className="w-36">
              <LuxurySelect
                compact
                value={filterStatus}
                onChange={setFilterStatus}
                label={isUr ? 'حیثیت' : 'Status'}
                options={[
                  { value: 'ALL', label: isUr ? 'تمام حیثیتیں' : 'All Statuses' },
                  { value: 'VERIFIED', label: isUr ? 'منظور شدہ' : 'Approved' },
                  { value: 'PENDING_VERIFICATION', label: isUr ? 'زیرِ التواء' : 'Pending' },
                  { value: 'REJECTED', label: isUr ? 'مسترد' : 'Rejected' }
                ]}
              />
            </div>

            {(hasFullAuditView || (!isDistrictAdmin && !isCoAdmin)) && (
              <>
                <div className="w-40">
                  <LuxurySelect
                    compact
                    value={filterProvince}
                    onChange={(val) => {
                      setFilterProvince(val);
                      setFilterDistrict('ALL');
                    }}
                    label={isUr ? 'صوبہ' : 'Province'}
                    options={[
                      { value: 'ALL', label: isUr ? 'تمام صوبے' : 'All Provinces' },
                      ...PROVINCE_OPTIONS.map(p => ({ value: p, label: p }))
                    ]}
                  />
                </div>

                <div className="w-44">
                  <LuxurySelect
                    compact
                    searchable
                    value={filterDistrict}
                    onChange={setFilterDistrict}
                    label={isUr ? 'ضلع' : 'District'}
                    options={[
                      { value: 'ALL', label: isUr ? 'تمام اضلاع' : 'All Districts' },
                      ...(filterProvince !== 'ALL'
                        ? getDistrictsForProvince(filterProvince)
                        : PROVINCE_OPTIONS.flatMap(p => getDistrictsForProvince(p))
                      ).map(d => ({ value: d, label: d }))
                    ]}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile-First Transaction Cards */}
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              {isUr
                ? 'ابھی تک کوئی لین دین ریکارڈ نہیں ہوا۔ حصہ جمع کروانے کے لیے "ادائیگی جمع کروائیں" پر ٹیپ کریں۔'
                : 'No transactions recorded yet. Tap "Submit Payment" to submit a contribution.'}
            </div>
          ) : (
            filteredTransactions.map(tx => {
              const fallback = mapLegacyRegionToHierarchy(tx.userRegion);
              const prov = tx.stateProvince || fallback.stateProvince;
              const dist = tx.district || fallback.district;

              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-xl kc-glass-bevel bg-[#090D16]/90 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono tabular-nums font-bold text-xs text-[#F5D061] block">
                        {tx.serialNumber || tx.receiptNumber}
                      </span>
                      <span className="text-xs font-semibold text-white flex items-center gap-1 truncate mt-0.5">
                        <MapPin className="w-3 h-3 text-[#D4AF37] shrink-0" />
                        <span className="truncate">{tx.userName} · {dist}, {prov}</span>
                      </span>
                    </div>
                    {renderStatusPill(tx.status)}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#D4AF37]/15">
                    <div className="min-w-0 pr-2">
                      <span className="text-emerald-300 font-semibold text-[11px] block truncate">
                        {isUr ? resolveReceiptFundTierLabel(tx).ur : resolveReceiptFundTierLabel(tx).en}
                      </span>
                      <span className="text-slate-300 block">{localizeMethod(tx.paymentMethod)}</span>
                      <span className="text-[10px] font-mono text-slate-400">{isUr ? 'حوالہ:' : 'Ref:'} {tx.referenceNumber}</span>
                      {(tx.periodLabelUr || tx.periodLabelEn) && (
                        <span className="text-[10px] font-bold text-emerald-300 block truncate mt-0.5">
                          {isUr ? tx.periodLabelUr || tx.periodLabelEn : tx.periodLabelEn || tx.periodLabelUr}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono tabular-nums font-extrabold text-sm text-white">
                        PKR {tx.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block tabular-nums">{tx.date}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#D4AF37]/15">
                    {tx.receiptImageUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewTx(tx)}
                        className="min-h-[44px] inline-flex items-center gap-1.5 px-2 text-xs font-semibold text-[#F5D061] hover:underline cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isUr ? 'رسید کی تصویر دیکھیں' : 'View Receipt Photo'}</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">{isUr ? 'کوئی تصویر منسلک نہیں' : 'No photo attached'}</span>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => setSelectedReceipt(tx)}
                        className="kc-pressable min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-[#141B2D] border border-[#D4AF37]/40 text-slate-100 rounded-xl font-semibold cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isUr ? 'ڈیجیٹل رسید' : 'Digital Receipt'}</span>
                      </button>
                      {canVerify && tx.status === 'PENDING_VERIFICATION' && (
                        <>
                          <button
                            onClick={() => handleDebouncedVerify(tx.id, true)}
                            className="kc-pressable min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] border border-[#38BDF8]/60 text-white rounded-xl font-bold cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#F8FAFC]" />
                            <span>{isUr ? 'منظور کریں' : 'Approve'}</span>
                          </button>
                          <button
                            onClick={() => setRejectTxId(tx.id)}
                            className="kc-pressable min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-rose-950/90 hover:bg-rose-900 border border-rose-500/45 text-rose-200 rounded-xl font-semibold cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{isUr ? 'مسترد' : 'Reject'}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
        </>
      )}

      {/* 3-Step Payment Submission Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/85 p-3 sm:p-4 overflow-y-auto">
          <div
            className="kc-luxury-modal relative w-full max-w-lg rounded-2xl p-5 sm:p-6 pb-[100px] sm:pb-6 my-auto max-h-[92dvh] overflow-y-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/25">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5D061]">
                  {isUr ? `مرحلہ ${step} از 3` : `Step ${step} of 3`}
                </span>
                <h3 className="text-base font-bold text-white">
                  {isUr ? 'فنڈ ادائیگی اور رسید وصولی' : 'Funds Payment & Raseed Wasooli'}
                </h3>
              </div>
              <button
                type="button"
                onClick={resetPaymentModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#F5D061] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="grid grid-cols-3 gap-2 my-4">
              {[
                { num: 1, label: isUr ? 'رقم' : 'Amount' },
                { num: 2, label: isUr ? 'طریقہ' : 'Method' },
                { num: 3, label: isUr ? 'رسید' : 'Receipt' }
              ].map(item => (
                <div
                  key={item.num}
                  className={`py-1.5 px-2 rounded-lg text-center text-[11px] font-bold border ${
                    step === item.num
                      ? 'bg-[#D4AF37]/20 text-[#F5D061] border-[#D4AF37]'
                      : step > item.num
                      ? 'bg-[#131C31] text-[#38BDF8] border-[#38BDF8]/45'
                      : 'bg-[#090D16] text-slate-400 border-[#D4AF37]/20'
                  }`}
                >
                  {item.num}. {item.label}
                </div>
              ))}
            </div>

            <form onSubmit={handleFinalSubmit} className="space-y-4">
              {step === 1 && (
                <div className="space-y-4">
                  <DastoorPaymentCalculator
                    language={language}
                    fundTier={fundTier}
                    onFundTierChange={setFundTier}
                    monthsCount={monthsCount}
                    onMonthsCountChange={setMonthsCount}
                    yearsCount={yearsCount}
                    onYearsCountChange={setYearsCount}
                    startDay={startDay}
                    onStartDayChange={setStartDay}
                    startMonth={startMonth}
                    onStartMonthChange={setStartMonth}
                    startYear={startYear}
                    onStartYearChange={setStartYear}
                    customAmount={payAmount}
                    onCustomAmountChange={setPayAmount}
                    fundCategory={payFund}
                    onFundCategoryChange={setPayFund}
                    payerCnic={payerCnic}
                    onPayerCnicChange={setPayerCnic}
                    unit={unit}
                    onUnitChange={setUnit}
                    contactHelpline={appSettings.contactHelpline}
                    actionSlot={
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          disabled={!canProceedStep1}
                          onClick={() => setStep(2)}
                          className="kc-pressable kc-gold-button w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 disabled:opacity-45 font-extrabold text-xs rounded-xl cursor-pointer"
                        >
                          <span>{isUr ? 'اگلا مرحلہ: ادائیگی کا طریقہ' : 'Next: Payment Method'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    }
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-200 block mb-2">
                      {isUr ? 'ادائیگی کا طریقہ منتخب کریں' : 'Select Payment Method'}
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {PAYMENT_METHODS.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPayMethod(m.id)}
                          className={`kc-pressable p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            payMethod === m.id
                              ? 'bg-[#D4AF37]/15 border-[#F5D061] text-[#F5D061]'
                              : 'bg-[#090D16] border-[#D4AF37]/25 text-slate-200 hover:border-[#D4AF37]/55'
                          }`}
                        >
                          <div className="text-xs font-bold">{isUr ? m.labelUr : m.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{isUr ? m.hintUr : m.hint}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-200 block mb-1">
                      {isUr ? 'ٹرانزیکشن آئی ڈی / حوالہ نمبر' : 'Transaction ID / Reference Number'}
                    </label>
                    <input
                      type="text"
                      placeholder={isUr ? 'مثال: TID-84920192 (نقد کے لیے خالی چھوڑ دیں)' : 'e.g. TID-84920192 (auto-generated for Cash if blank)'}
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      className="kc-luxury-input w-full text-xs font-mono px-3 py-2.5 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-200 block mb-1">
                      {isUr ? 'اختیاری نوٹ' : 'Optional Note'}
                    </label>
                    <input
                      type="text"
                      placeholder={isUr ? 'مثال: اپریل کا فلاحی حصہ' : 'e.g. April welfare contribution'}
                      value={payNotes}
                      onChange={(e) => setPayNotes(e.target.value)}
                      className="kc-luxury-input w-full text-xs px-3 py-2.5 rounded-xl"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="kc-pressable flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-[#F5D061] cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{isUr ? 'واپس' : 'Back'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="kc-pressable kc-gold-button flex items-center gap-1.5 px-5 py-2.5 font-extrabold text-xs rounded-xl cursor-pointer"
                    >
                      <span>{isUr ? 'اگلا مرحلہ: رسید اپ لوڈ کریں' : 'Next: Upload Receipt'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-[#090D16] border border-[#D4AF37]/35 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <span className="text-slate-400 block truncate">
                        {fundTier === 'MAHANA'
                          ? (isUr ? 'ماہانہ فنڈ' : 'Mahana Fund')
                          : fundTier === 'SALANA'
                          ? (isUr ? 'سالانہ فنڈ' : 'Salana Fund')
                          : 'ہنگامی فنڈ / Hangami Fund'}{' '}
                        · {localizeMethod(payMethod)}
                      </span>
                      <span className="font-mono tabular-nums font-bold text-[#F5D061]">
                        PKR {Math.round(numericPayAmount || 0).toLocaleString()}
                        {fundTier === 'MAHANA' && (
                          <span className="text-emerald-300 font-sans ml-1.5">
                            ({isUr ? mahanaPeriod.periodLabelUr : mahanaPeriod.periodLabelEn})
                          </span>
                        )}
                        {fundTier === 'SALANA' && (
                          <span className="text-emerald-300 font-sans ml-1.5">
                            ({isUr ? salanaPeriod.periodLabelUr : salanaPeriod.periodLabelEn})
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#F5D061] border border-[#D4AF37]/35 font-bold shrink-0">
                      {isUr ? 'ایڈمن منظوری زیرِ التواء' : 'Pending Admin Approval'}
                    </span>
                  </div>

                  {submitError && (
                    <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-xs text-rose-200 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                      {isUr ? 'ادائیگی کا اسکرین شاٹ / رسید کی تصویر اپ لوڈ کریں (گیلری یا کیمرہ)' : 'Upload Payment Screenshot / Receipt Photo (Gallery or Camera)'}
                    </label>

                    <div className="grid grid-cols-2 gap-2.5">
                      <label className="kc-pressable flex flex-col items-center justify-center p-3.5 rounded-xl border-2 border-dashed border-[#D4AF37]/55 hover:border-[#FDE047] bg-[#090D16] cursor-pointer transition-colors text-center">
                        <Camera className="w-5 h-5 text-[#FDE047] mb-1" />
                        <span className="text-xs font-extrabold text-white">
                          {isUr ? '📷 کیمرہ سے تصویر لیں' : '📷 Take Photo'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          {isUr ? 'کیمرہ کھولیں' : 'Live Camera'}
                        </span>
                        <input
                          ref={receiptCameraInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleReceiptFileChange}
                          className="hidden"
                        />
                      </label>

                      <label className="kc-pressable flex flex-col items-center justify-center p-3.5 rounded-xl border-2 border-dashed border-[#38BDF8]/50 hover:border-[#38BDF8] bg-[#090D16] cursor-pointer transition-colors text-center">
                        <Upload className="w-5 h-5 text-[#38BDF8] mb-1" />
                        <span className="text-xs font-extrabold text-white">
                          {isUr ? '🖼️ گیلری سے منتخب کریں' : '🖼️ Choose Gallery'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          {isCompressing ? (isUr ? 'کمپریس ہو رہا ہے...' : 'Optimizing...') : 'JPG / PNG'}
                        </span>
                        <input
                          ref={receiptGalleryInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleReceiptFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {uploadError && (
                      <p className="text-xs text-rose-400 font-medium mt-1.5">{uploadError}</p>
                    )}

                    {receiptImageUrl && (
                      <div className="mt-3 p-2.5 rounded-xl kc-emerald-panel space-y-2">
                        <div className="relative rounded-xl overflow-hidden bg-[#070D14] border border-[#D4AF37]/45">
                          <img
                            src={receiptImageUrl}
                            alt="Receipt preview"
                            className="w-full max-h-44 object-contain"
                          />
                          <button
                            type="button"
                            onClick={clearReceiptUpload}
                            aria-label="Remove uploaded receipt image"
                            title={isUr ? 'رسید کی تصویر ہٹائیں' : 'Remove receipt image'}
                            style={{ position: 'absolute', top: '6px', right: '6px', zIndex: 999 }}
                            className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 border-2 border-[#FDE047] text-white flex items-center justify-center shadow-lg cursor-pointer"
                          >
                            <X className="w-4 h-4 stroke-[2.75]" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-xs px-1">
                          <span className="font-bold text-white truncate">
                            {receiptImageName || 'receipt.jpg'}
                          </span>
                          <span className="text-[10px] text-emerald-300 font-semibold shrink-0">
                            {isUr ? 'کمپریس شدہ اور تیار ہے' : 'Compressed & Ready'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#D4AF37]/20">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="kc-pressable flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-[#F5D061] cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{isUr ? 'واپس' : 'Back'}</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isCompressing || !canProceedStep1 || isSubmittingPayment}
                      className="kc-pressable kc-gold-button flex items-center gap-1.5 px-5 py-2.5 disabled:opacity-50 text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {isSubmittingPayment
                          ? (isUr ? 'جمع ہو رہا ہے...' : 'Submitting...')
                          : (isUr ? 'منظوری کے لیے جمع کروائیں' : 'Submit for Approval')}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {isSuperAdmin && (
        <OldPaperRecordModal
          isOpen={isOldPaperModalOpen}
          onClose={() => setIsOldPaperModalOpen(false)}
        />
      )}

      {/* Receipt Image Preview Modal */}
      {previewTx && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/85 p-3 sm:p-4 overflow-y-auto">
          <div className="kc-luxury-modal rounded-2xl max-w-md w-full p-4 space-y-3 my-auto max-h-[92dvh] overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="flex items-center justify-between pb-2 border-b border-[#D4AF37]/25">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#F5D061]" />
                  <span>{previewTx.receiptNumber} {isUr ? 'ثبوت' : 'Proof'}</span>
                </h4>
                <p className="text-[11px] text-slate-400 tabular-nums">
                  {previewTx.userName} · PKR {previewTx.amount.toLocaleString()} ({localizeMethod(previewTx.paymentMethod)})
                </p>
              </div>
              <button
                onClick={() => setPreviewTx(null)}
                className="p-1 text-slate-300 hover:text-[#F5D061] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {previewTx.receiptImageUrl && (
              <img
                src={previewTx.receiptImageUrl}
                alt="Payment proof"
                className="w-full max-h-[60vh] object-contain rounded-xl bg-[#090D16] border border-[#D4AF37]/25"
              />
            )}
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectTxId && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/85 p-3 sm:p-4 overflow-y-auto">
          <div className="kc-luxury-modal rounded-2xl max-w-sm w-full p-5 space-y-3 my-auto">
            <h4 className="text-sm font-bold text-white">
              {isUr ? 'ادائیگی کا ثبوت مسترد کریں' : 'Reject Payment Proof'}
            </h4>
            <p className="text-xs text-slate-400">
              {isUr
                ? 'مختصر وجہ بیان کریں تاکہ ممبر درست رسید دوبارہ جمع کروا سکے۔'
                : 'Provide a brief reason so the member can resubmit a valid receipt.'}
            </p>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={isUr ? 'مثال: ٹرانزیکشن آئی ڈی میں فرق یا غیر واضح رسید' : 'e.g. Transaction ID mismatch or unclear receipt'}
              className="kc-luxury-input w-full text-xs px-3 py-2.5 rounded-xl"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectTxId(null);
                  setRejectReason('');
                }}
                className="kc-pressable px-3 py-1.5 text-xs text-slate-300 hover:text-white font-semibold cursor-pointer"
              >
                {isUr ? 'منسوخ کریں' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="kc-pressable px-4 py-1.5 bg-rose-900 hover:bg-rose-800 border border-rose-500/50 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                {isUr ? 'مسترد کرنے کی تصدیق' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
