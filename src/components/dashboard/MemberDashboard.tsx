import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Coins,
  Receipt,
  Megaphone,
  ShieldCheck,
  Plus,
  Printer,
  CheckCircle2,
  Clock,
  IdCard,
  Send,
  Upload,
  XCircle,
  MessageSquare,
  MessageSquareWarning,
  Users,
  FileCheck2,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { FundCategory, FundTier, PaymentMethod, ComplaintCategory } from '../../types';
import { mapLegacyRegionToHierarchy } from '../../data/locationData';
import { compressImageFile } from '../../utils/imageCompression';
import { BrandEmblem3D } from '../common/BrandEmblem3D';
import { RoleBadge } from '../common/RoleBadge';
import { TabbarBadge, FaizKhelVipCrownIcon } from '../common/TabbarBadge';
import { LuxurySelect } from '../common/LuxurySelect';
import { ProfileCompletionGate, needsProfileCompletion } from '../common/ProfileCompletionGate';
import { DastoorPaymentCalculator } from '../common/DastoorPaymentCalculator';
import {
  DASTOOR_MONTHLY_RATE,
  calculateDastoorPeriod,
  calculateSalanaPeriod,
  isFaizKhelUser,
} from '../../utils/dastoor';
import {
  formatCnicDisplay,
  isValid13DigitCnic,
  getCnicLockAlertMessage,
  normalizeCnicDigits,
} from '../../utils/cnic';
import { resolveReceiptFundTierLabel } from '../../utils/receiptExport';
import { translate } from '../../data/translations';

export const MemberDashboard: React.FC = () => {
  const {
    currentUser,
    applications,
    payments,
    complaints,
    announcements,
    appSettings,
    submitPayment,
    submitComplaint,
    setSelectedReceipt,
    setSelectedCardUser,
    setActiveTab,
    openCompleteProfileModal,
    openRukniyatForm,
    openTutorial,
    language
  } = useApp();
  const requiresProfileCompletion = needsProfileCompletion(currentUser);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [fundTier, setFundTier] = useState<FundTier>('MAHANA');
  const [monthsCount, setMonthsCount] = useState<number>(2);
  const [yearsCount, setYearsCount] = useState<number>(1);
  const [startMonth, setStartMonth] = useState<number>(() => new Date().getMonth());
  const [startYear, setStartYear] = useState<number>(() => new Date().getFullYear());
  const [customPayAmount, setCustomPayAmount] = useState<string>('');
  const [payFund, setPayFund] = useState<FundCategory>('Monthly Contribution');
  const [payerCnic, setPayerCnic] = useState<string>(() =>
    currentUser?.cnic ? formatCnicDisplay(currentUser.cnic) : ''
  );
  const [unit, setUnit] = useState<string>('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('EasyPaisa');
  const [payReference, setPayReference] = useState('');
  const [payNote, setPayNote] = useState('');
  const [receiptImageUrl, setReceiptImageUrl] = useState('');
  const [receiptImageName, setReceiptImageName] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentSubmittedSuccess, setPaymentSubmittedSuccess] = useState(false);
  const lastActionTsRef = useRef<number>(0);

  useEffect(() => {
    if (currentUser?.cnic && !payerCnic) {
      setPayerCnic(formatCnicDisplay(currentUser.cnic));
    }
  }, [currentUser?.cnic, payerCnic]);

  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [cmpCategory, setCmpCategory] = useState<ComplaintCategory>('Membership Card');
  const [cmpSubject, setCmpSubject] = useState('');
  const [cmpDescription, setCmpDescription] = useState('');
  const [cmpPriority, setCmpPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  if (!currentUser) return null;

  const vis = appSettings.dashboardVisibility || {
    showKpiGrid: true,
    showQuickActions: true,
    showApkSyncBanner: true,
    showDistrictMatrix: true,
    showOfficeBearersWidget: true,
    showAnnouncementsFeed: true
  };
  const allowPayments = appSettings.featureToggles?.allowMemberPayments !== false;
  const allowComplaints = appSettings.featureToggles?.allowComplaintsDesk !== false;

  const memLoc = mapLegacyRegionToHierarchy(currentUser.region);
  const memberDistrict = currentUser.district || memLoc.district;
  const memberProvince = currentUser.stateProvince || memLoc.stateProvince;
  const memberTehsil = currentUser.tehsil || memLoc.tehsil;

  const currentMonthLabel = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });
  const currentMonthShort = new Date().toLocaleString('en-US', { month: 'short' });

  const ownPayments = payments.filter(p => p.userId === currentUser.id);
  const ownComplaints = complaints.filter(c => c.userId === currentUser.id);
  const relevantAnnouncements = announcements.filter(
    a =>
      a.announcementType === 'OFFICIAL_APP' ||
      a.targetScope === 'ALL' ||
      a.targetRegion === 'ALL_REGIONS' ||
      (a.targetScope === 'PROVINCE' && a.targetStateProvince === memberProvince) ||
      a.targetDistrict === memberDistrict ||
      a.targetRegion === currentUser.region
  );

  const totalVerifiedContributed = ownPayments
    .filter(p => p.status === 'VERIFIED')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pendingPayments = ownPayments.filter(p => p.status === 'PENDING_VERIFICATION');

  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsCompressing(true);
    try {
      const compressed = await compressImageFile(file, 1080, 0.78);
      setReceiptImageUrl(compressed.dataUrl);
      setReceiptImageName(file.name);
    } catch (err: any) {
      setUploadError(err?.message || 'Unable to process receipt image.');
    } finally {
      setIsCompressing(false);
    }
  };

  /** Red ✕ on the receipt preview: clear the image and reset the file input so the same file can be re-picked. */
  const clearReceiptImage = () => {
    setReceiptImageUrl('');
    setReceiptImageName('');
    setUploadError(null);
    if (receiptInputRef.current) receiptInputRef.current.value = '';
  };

  const mahanaPeriod = calculateDastoorPeriod(startMonth, startYear, Math.min(11, Math.max(2, monthsCount)));
  const salanaPeriod = calculateSalanaPeriod(startMonth, startYear, Math.max(1, yearsCount));

  const effectivePayAmount =
    fundTier === 'MAHANA'
      ? mahanaPeriod.totalAmount
      : fundTier === 'SALANA'
      ? salanaPeriod.totalAmount
      : Math.round(Number(customPayAmount) || 0);

  const isCnicValid = isValid13DigitCnic(payerCnic);
  const isPayAmountValid =
    fundTier === 'MAHANA'
      ? monthsCount >= 2 && monthsCount <= 11 && mahanaPeriod.totalAmount > 0
      : fundTier === 'SALANA'
      ? yearsCount >= 1 && salanaPeriod.totalAmount > 0
      : Boolean(customPayAmount.trim()) && Number.isFinite(Number(customPayAmount)) && Number(customPayAmount) > 0;
  const canSubmitPayment = isPayAmountValid && isCnicValid;

  const currentUserCnicDigits = normalizeCnicDigits(currentUser.cnic);
  const ownRukniyatApp = applications.find(
    a =>
      (a.email && currentUser.email && a.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      (currentUserCnicDigits.length === 13 && normalizeCnicDigits(a.cnic) === currentUserCnicDigits) ||
      (currentUser.membershipId && a.generatedMembershipId === currentUser.membershipId)
  );

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastActionTsRef.current < 500 || isSubmittingPayment) return;
    lastActionTsRef.current = now;

    if (!isCnicValid) {
      setPaymentError(getCnicLockAlertMessage(language));
      return;
    }
    if (!isPayAmountValid || effectivePayAmount <= 0) return;

    setPaymentError(null);
    setIsSubmittingPayment(true);
    try {
      const cleanRef =
        payReference.trim() ||
        `${payMethod.replace(/\s+/g, '').substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`;

      const resolvedCategory: FundCategory =
        fundTier === 'MAHANA'
          ? 'Monthly Contribution'
          : fundTier === 'SALANA'
          ? 'Annual Welfare Fund'
          : payFund || 'Emergency Relief';

      const res = await submitPayment({
        amount: effectivePayAmount,
        fundCategory: resolvedCategory,
        fundTier,
        yearsCount: fundTier === 'SALANA' ? yearsCount : undefined,
        unit: unit.trim() || undefined,
        payerCnic: formatCnicDisplay(payerCnic),
        paymentMethod: payMethod,
        referenceNumber: cleanRef,
        proofNote: payNote.trim() || undefined,
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
        setPaymentError(res.error || getCnicLockAlertMessage(language));
        return;
      }

      setPaymentSubmittedSuccess(true);
      setTimeout(() => {
        setPaymentSubmittedSuccess(false);
        setIsPaymentModalOpen(false);
        setFundTier('MAHANA');
        setMonthsCount(2);
        setYearsCount(1);
        setStartMonth(new Date().getMonth());
        setStartYear(new Date().getFullYear());
        setCustomPayAmount('');
        setUnit('');
        setPayReference('');
        setPayNote('');
        setReceiptImageUrl('');
        setReceiptImageName('');
        setPaymentError(null);
      }, 1500);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmpSubject.trim() || !cmpDescription.trim()) return;

    submitComplaint({
      category: cmpCategory,
      subject: cmpSubject.trim(),
      description: cmpDescription.trim(),
      priority: cmpPriority
    });

    setIsComplaintModalOpen(false);
    setCmpSubject('');
    setCmpDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#F5D061] uppercase tracking-wider">
              {language === 'ur' ? 'ذاتی ممبرشپ پورٹل' : 'Member Self-Service'}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-400">{memberDistrict}, {memberProvince}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            {language === 'ur' ? `خوش آمدید، ${currentUser.name}` : `Welcome back, ${currentUser.name}`}
          </h1>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span className="text-xs text-slate-400">
              ID: <strong className="font-mono text-[#F5D061]">{currentUser.membershipId || 'KC-PENDING'}</strong>
            </span>
            <RoleBadge
              role={currentUser.role}
              isFounder={currentUser.isFounder}
              isAuditOfficer={Boolean(currentUser.isAuditOfficer)}
              compact
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => openTutorial()}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#131C31] hover:bg-[#1E293B] border border-[#38BDF8]/45 text-[#38BDF8] text-xs font-bold rounded-xl kc-pressable cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{language === 'ur' ? 'ایپ گائیڈ' : 'App Guide'}</span>
          </button>

          <button
            type="button"
            onClick={() => openRukniyatForm(ownRukniyatApp || null)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#022C22] hover:bg-[#064E3B] border border-[#D4AF37]/60 text-[#FEF08A] text-xs font-extrabold rounded-xl kc-pressable cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4 text-[#FDE047]" />
            <span>{language === 'ur' ? 'رکنیت فارم (Rukniyat Form)' : 'Rukniyat Form (رکنیت فارم)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCardUser(currentUser)}
            className="flex items-center gap-1.5 px-3.5 py-2 kc-obsidian-card hover:border-[#F5D061]/70 text-white text-xs font-bold rounded-xl kc-pressable cursor-pointer"
          >
            <IdCard className="w-4 h-4 text-[#F5D061]" />
            <span>{translate(language, 'viewDigitalId')}</span>
          </button>

          {allowPayments && (
            <button
              type="button"
              onClick={() => {
                if (requiresProfileCompletion) {
                  openCompleteProfileModal();
                } else {
                  setIsPaymentModalOpen(true);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 kc-gold-button text-xs font-extrabold rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{translate(language, 'actionPayFunds')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Rukniyat Form Status Banner / Quick Entry */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#022C22]/85 via-[#0F172A] to-[#131C31] border border-[#D4AF37]/45 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#070D14] border border-[#D4AF37]/60 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-5 h-5 text-[#FDE047]" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-extrabold text-[#FEF08A]">
                {language === 'ur'
                  ? 'رکنیت فارم (سوئی خیل قومی اتحاد)'
                  : 'Official Rukniyat Form (رکنیت فارم)'}
              </h3>
              {ownRukniyatApp?.serialNumber && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#070D14] border border-[#D4AF37]/50 text-[#FDE047]">
                  {ownRukniyatApp.serialNumber}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300">
              {ownRukniyatApp
                ? ownRukniyatApp.status === 'ACTIVE'
                  ? (language === 'ur'
                      ? 'مبارک ہو! آپ کا رکنیت فارم مہر اور دستخط کے ساتھ منظور ہو چکا ہے۔'
                      : 'Approved & Verified with Official Mohar Stamp.')
                  : (language === 'ur'
                      ? 'آپ کا رکنیت فارم جمع ہو چکا ہے اور ایڈمن منظوری کے لیے زیرِ التواء ہے۔'
                      : 'Submitted · Pending Admin Approval.')
                : (language === 'ur'
                    ? '13 ہندسوں کے شناختی کارڈ اور عہد نامہ کے ساتھ اپنا دو لسانی رکنیت فارم مکمل کریں۔'
                    : 'Submit your bilingual Rukniyat Form with mandatory 13-digit CNIC & oath signature.')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openRukniyatForm(ownRukniyatApp || null)}
          className="kc-pressable kc-gold-button px-4 py-2 rounded-xl text-xs font-extrabold shrink-0 cursor-pointer self-start sm:self-center"
        >
          {ownRukniyatApp
            ? (language === 'ur' ? 'فارم و مہر دیکھیں' : 'View Form & Mohar')
            : (language === 'ur' ? 'رکنیت فارم پُر کریں' : 'Fill Rukniyat Form')}
        </button>
      </div>

      {requiresProfileCompletion && (
        <ProfileCompletionGate featureName={language === 'ur' ? 'ادائیگی، لائیو چیٹ اور شکایات' : 'payments, Live Chat & complaints'} />
      )}

      {/* Quick Action Cards */}
      {vis.showQuickActions && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {allowPayments && (
            <button
              type="button"
              onClick={() => {
                if (requiresProfileCompletion) {
                  openCompleteProfileModal();
                } else {
                  setIsPaymentModalOpen(true);
                }
              }}
              className="p-3.5 rounded-2xl kc-emerald-panel hover:border-[#F5D061]/75 text-left transition-transform hover:-translate-y-0.5 kc-pressable cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-[#090D16] border border-[#D4AF37]/40 flex items-center justify-center mb-2">
                <Coins className="w-4 h-4 text-[#F5D061]" />
              </div>
              <span className="text-xs font-extrabold text-white block truncate">{translate(language, 'actionPayFunds')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSelectedCardUser(currentUser)}
            className="p-3.5 rounded-2xl kc-obsidian-card hover:border-[#F5D061]/65 text-left transition-transform hover:-translate-y-0.5 kc-pressable cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#090D16] border border-[#D4AF37]/30 flex items-center justify-center mb-2">
              <IdCard className="w-4 h-4 text-[#F5D061]" />
            </div>
            <span className="text-xs font-extrabold text-white block truncate">{translate(language, 'actionDigitalId')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className="p-3.5 rounded-2xl kc-obsidian-card hover:border-[#F5D061]/65 text-left transition-transform hover:-translate-y-0.5 kc-pressable cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#090D16] border border-[#D4AF37]/30 flex items-center justify-center mb-2">
              <Users className="w-4 h-4 text-[#F5D061]" />
            </div>
            <span className="text-xs font-extrabold text-white block truncate">{translate(language, 'navMembers')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className="p-3.5 rounded-2xl kc-obsidian-card hover:border-[#F5D061]/65 text-left transition-transform hover:-translate-y-0.5 kc-pressable cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#090D16] border border-emerald-500/35 flex items-center justify-center mb-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs font-extrabold text-white block truncate">{translate(language, 'actionOpenChat')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            className="p-3.5 rounded-2xl kc-obsidian-card hover:border-[#F5D061]/65 text-left transition-transform hover:-translate-y-0.5 kc-pressable cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#090D16] border border-[#D4AF37]/30 flex items-center justify-center mb-2">
              <Megaphone className="w-4 h-4 text-[#F5D061]" />
            </div>
            <span className="text-xs font-extrabold text-white block truncate">{translate(language, 'actionAnnouncements')}</span>
          </button>

          {allowComplaints && (
            <button
              type="button"
              onClick={() => {
                if (requiresProfileCompletion) {
                  openCompleteProfileModal();
                } else {
                  setIsComplaintModalOpen(true);
                }
              }}
              className="p-3.5 rounded-2xl kc-obsidian-card hover:border-[#F5D061]/65 text-left transition-transform hover:-translate-y-0.5 kc-pressable cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-[#090D16] border border-rose-500/35 flex items-center justify-center mb-2">
                <MessageSquareWarning className="w-4 h-4 text-rose-400" />
              </div>
              <span className="text-xs font-extrabold text-white block truncate">{translate(language, 'actionComplaints')}</span>
            </button>
          )}
        </div>
      )}

      {/* Hero Split: Fintech Slate / Faiz Khel Royal Imperial Gold VIP Card Preview + KPI Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div
          onClick={() => setSelectedCardUser(currentUser)}
          className={`lg:col-span-5 rounded-2xl p-5 text-[#F8FAFC] shadow-xl cursor-pointer transition-colors flex flex-col justify-between relative overflow-hidden ${
            isFaizKhelUser(currentUser)
              ? 'border-[1.5px] border-[#FDE047] shadow-[0_12px_32px_rgba(212,175,55,0.28)]'
              : 'border border-slate-400/25 hover:border-[#38BDF8]/65'
          }`}
          style={{
            background: isFaizKhelUser(currentUser)
              ? 'linear-gradient(135deg, #2B1F06 0%, #42300A 52%, #1C1404 100%)'
              : 'linear-gradient(145deg, #131C31 0%, #1E293B 55%, #090D16 100%)'
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <BrandEmblem3D size="xs" />
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider kc-gold-gradient-text">
                  KIFAYAT CONNECT 👑
                </h4>
                <p className="text-[10px] text-[#38BDF8] font-semibold">{translate(language, 'vipPremiumMember')}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {isFaizKhelUser(currentUser) && <FaizKhelVipCrownIcon className="w-6 h-6" />}
              <span className="text-[10px] font-mono font-bold text-[#38BDF8] bg-[#090D16] px-2 py-0.5 rounded-md border border-[#38BDF8]/40 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#F5D061]" />
                <span>{translate(language, 'activeLabel')}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 my-4">
            {(currentUser.avatarUrl || currentUser.avatar) ? (
              <img
                src={currentUser.avatarUrl || currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 rounded-xl object-cover border-2 border-[#F5D061] shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-[#0F172A] border-2 border-[#F5D061] flex items-center justify-center text-[#F5D061] font-extrabold text-lg shadow-md shrink-0">
                {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 space-y-1">
              <h3 className={`font-extrabold text-base truncate ${isFaizKhelUser(currentUser) ? 'text-[#FEF08A]' : 'text-[#F8FAFC]'}`}>
                {currentUser.name}
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-[11px] font-mono text-[#F5D061]">{currentUser.membershipId || 'KC-PENDING'}</p>
                <TabbarBadge user={currentUser} language={language} compact />
              </div>
              <p className="text-[10px] text-[#94A3B8] truncate">
                {memberDistrict}, {memberProvince}{memberTehsil ? ` · ${memberTehsil}` : ''}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-400/20 flex items-center justify-between text-[10px] text-[#94A3B8]">
            <div>
              <span>{language === 'ur' ? 'میعاد:' : 'VALID THRU:'} </span>
              <span className="font-mono text-[#F5D061] font-bold">{currentUser.validUntil || '2028-12-31'}</span>
            </div>
            <span className="text-[#38BDF8] font-semibold">
              {language === 'ur' ? 'وی آئی پی کارڈ اور QR دیکھیں →' : 'Tap for VIP Card & QR →'}
            </span>
          </div>
        </div>

        {vis.showKpiGrid && (
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 kc-obsidian-card rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {language === 'ur' ? 'کل جمع شدہ فنڈ' : 'Total Contributed'}
                  </span>
                  <Coins className="w-4 h-4 text-[#F5D061]" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    PKR {totalVerifiedContributed.toLocaleString()}
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold">{translate(language, 'verifiedLabel')}</span>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 border-t border-[#D4AF37]/15 pt-2 flex items-center justify-between">
                <span className="tabular-nums">
                  {language === 'ur'
                    ? `${ownPayments.filter(p => p.status === 'VERIFIED').length} تصدیق شدہ ادائیگیاں`
                    : `${ownPayments.filter(p => p.status === 'VERIFIED').length} Cleared Transactions`}
                </span>
                <span className="text-emerald-400 font-semibold">{language === 'ur' ? 'آڈٹ شدہ' : 'Audited'}</span>
              </div>
            </div>

            <div className="p-4 kc-obsidian-card rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {language === 'ur' ? 'ماہانہ تعاون' : 'Monthly Pledge'}
                  </span>
                  <Receipt className="w-4 h-4 text-blue-400" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    PKR {currentUser.monthlyPledge.toLocaleString()}
                  </span>
                  <span className="text-xs text-blue-400 font-semibold">{language === 'ur' ? 'ماہانہ' : 'Recurring'}</span>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 border-t border-[#D4AF37]/15 pt-2 flex items-center justify-between">
                <span>{language === 'ur' ? `دورانیہ (${currentMonthLabel})` : `Cycle (${currentMonthLabel})`}</span>
                <span className="text-blue-400 font-semibold">{translate(language, 'activeLabel')}</span>
              </div>
            </div>

            <div className="p-4 kc-obsidian-card rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {language === 'ur' ? 'سالانہ ویلفیئر عہد' : 'Annual Welfare Pledge'}
                  </span>
                  <Coins className="w-4 h-4 text-purple-400" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    PKR {currentUser.annualPledge.toLocaleString()}
                  </span>
                  <span className="text-xs text-purple-400 font-semibold">{language === 'ur' ? 'سالانہ' : 'Annual'}</span>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 border-t border-[#D4AF37]/15 pt-2 flex items-center justify-between">
                <span>{language === 'ur' ? 'تعلیم اور صحت' : 'Education & Healthcare'}</span>
                <span className="text-purple-400 font-semibold">{currentMonthShort}</span>
              </div>
            </div>

            <div className="p-4 kc-obsidian-card rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {language === 'ur' ? 'تصدیق کی حیثیت' : 'Verification Status'}
                  </span>
                  <Clock className="w-4 h-4 text-[#F5D061]" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    {pendingPayments.length} {translate(language, 'pendingLabel')}
                  </span>
                  <span className="text-xs text-[#F5D061] font-semibold">
                    {language === 'ur' ? 'زیر جائزہ' : 'In Review'}
                  </span>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 border-t border-[#D4AF37]/15 pt-2">
                {pendingPayments.length > 0
                  ? (language === 'ur' ? 'ایڈمن / قیادت آپ کی رسید کی تصدیق کر رہی ہے۔' : 'Admin / Leadership is cross-verifying transaction slip.')
                  : (language === 'ur' ? 'آپ کی تمام ادائیگیاں تصدیق ہو چکی ہیں!' : 'All submitted payments have been verified!')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Member Payment History */}
      <div className="kc-obsidian-card rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D4AF37]/20">
          <div>
            <h3 className="text-sm font-bold text-white">
              {language === 'ur' ? 'میری ادائیگیوں کا ریکارڈ اور مصدقہ رسیدیں' : 'My Payment Records & Certified Receipts'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'ur' ? 'کفایت کنیکٹ پرائیویسی قوانین کے تحت صرف آپ کی ذاتی ادائیگیاں دکھائی جاتی ہیں' : 'Only your private transactions are shown under Kifayat Connect privacy rules'}
            </p>
          </div>

          {allowPayments && (
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 kc-gold-button text-xs font-extrabold rounded-xl cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'نئی ادائیگی کریں' : 'Make New Payment'}</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto mt-3 rounded-xl border border-[#D4AF37]/20">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#D4AF37]/20 bg-[#090D16] text-slate-300 font-semibold">
                <th className="py-2.5 px-3">{language === 'ur' ? 'رسید نمبر' : 'Receipt No.'}</th>
                <th className="py-2.5 px-3">{translate(language, 'dateLabel')}</th>
                <th className="py-2.5 px-3">{language === 'ur' ? 'مد' : 'Category'}</th>
                <th className="py-2.5 px-3">{language === 'ur' ? 'طریقہ' : 'Method'}</th>
                <th className="py-2.5 px-3">{language === 'ur' ? 'حوالہ' : 'Reference'}</th>
                <th className="py-2.5 px-3 text-right">{language === 'ur' ? 'رقم (PKR)' : 'Amount (PKR)'}</th>
                <th className="py-2.5 px-3 text-center">{translate(language, 'statusLabel')}</th>
                <th className="py-2.5 px-3 text-right">{language === 'ur' ? 'واؤچر' : 'Voucher'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10">
              {ownPayments.map(tx => (
                <tr key={tx.id} className="hover:bg-[#1A233A]/55 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-[#F5D061]">{tx.serialNumber || tx.receiptNumber}</td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-slate-400">{tx.date}</td>
                  <td className="py-2.5 px-3 text-emerald-300 font-medium">
                    <div>{language === 'ur' ? resolveReceiptFundTierLabel(tx).ur : resolveReceiptFundTierLabel(tx).en}</div>
                    {(tx.periodLabelUr || tx.periodLabelEn) && (
                      <div className="text-[10px] text-[#F5D061] font-semibold">
                        {language === 'ur' ? tx.periodLabelUr || tx.periodLabelEn : tx.periodLabelEn || tx.periodLabelUr}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{tx.paymentMethod}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{tx.referenceNumber}</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-white">{tx.amount.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                      tx.status === 'VERIFIED'
                        ? 'bg-[#131C31] text-[#38BDF8] border border-[#38BDF8]/40'
                        : tx.status === 'REJECTED'
                        ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                        : 'bg-[#090D16] text-[#F5D061] border border-[#D4AF37]/40'
                    }`}>
                      {tx.status === 'VERIFIED' ? <CheckCircle2 className="w-3 h-3" /> : tx.status === 'REJECTED' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      <span>
                        {tx.status === 'VERIFIED'
                          ? (language === 'ur' ? 'منظور شدہ ✓' : 'Approved ✓')
                          : tx.status === 'REJECTED'
                          ? translate(language, 'rejectedLabel')
                          : (language === 'ur' ? 'زیرِ جائزہ' : 'Under Review')}
                      </span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedReceipt(tx)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-[#090D16] hover:bg-[#1A233A] text-[#F5D061] border border-[#D4AF37]/35 rounded-lg font-medium kc-pressable cursor-pointer"
                    >
                      <Printer className="w-3 h-3" />
                      <span>{language === 'ur' ? 'رسید' : 'Receipt'}</span>
                    </button>
                  </td>
                </tr>
              ))}
              {ownPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    {language === 'ur'
                      ? 'ابھی کوئی ادائیگی جمع نہیں کروائی گئی۔ پہلی ادائیگی کے لیے "نئی ادائیگی کریں" پر کلک کریں۔'
                      : 'No contributions submitted yet. Click "Make New Payment" to submit your first contribution.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: My Grievances & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="kc-obsidian-card rounded-2xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/20">
            <div>
              <h3 className="text-sm font-bold text-white">
                {language === 'ur' ? 'سپورٹ ٹکٹس اور شکایات' : 'Support Tickets & Grievances'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'ur' ? `آپ کے ضلعی ایڈمن (${memberDistrict}) کو بھیجی جاتی ہیں` : `Routed to your District Admin (${memberDistrict})`}
              </p>
            </div>
            {allowComplaints && (
              <button type="button" onClick={() => setIsComplaintModalOpen(true)} className="text-xs text-[#F5D061] hover:underline font-bold cursor-pointer">
                {language === 'ur' ? '+ شکایت درج کریں' : '+ File Ticket'}
              </button>
            )}
          </div>

          <div className="mt-3 space-y-3">
            {ownComplaints.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {language === 'ur' ? 'آپ نے ابھی کوئی شکایت درج نہیں کروائی۔' : 'You have not filed any grievances.'}
              </div>
            ) : (
              ownComplaints.map(cmp => (
                <div key={cmp.id} className="p-3 rounded-xl border border-[#D4AF37]/25 bg-[#090D16] text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-white">{cmp.subject}</span>
                      <p className="text-[10px] text-slate-400 font-mono">{cmp.ticketNumber} · {cmp.category}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      cmp.status === 'RESOLVED' ? 'bg-[#131C31] text-[#38BDF8] border border-[#38BDF8]/35' : 'bg-amber-950/60 text-[#F5D061] border border-[#D4AF37]/35'
                    }`}>
                      {cmp.status === 'RESOLVED' ? translate(language, 'resolvedLabel') : translate(language, 'openLabel')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1.5">{cmp.description}</p>
                  {cmp.responseNote && (
                    <div className="mt-2 text-[11px] text-emerald-100 kc-emerald-panel p-2.5 rounded-lg">
                      <span className="font-bold text-[#F5D061]">
                        {language === 'ur' ? `جواب (${cmp.assignedOfficerName}):` : `Response (${cmp.assignedOfficerName}):`}
                      </span> {cmp.responseNote}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {vis.showAnnouncementsFeed && (
          <div className="kc-obsidian-card rounded-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/20">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {language === 'ur' ? 'اعلانات اور آفیشل نوٹس' : 'Announcements & Official Notices'}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'ur' ? `تازہ ترین آفیشل ایپ 👑 اور ${memberDistrict} کے اعلانات` : `Latest Official App 👑 & ${memberDistrict} notices`}
                </p>
              </div>
              <Megaphone className="w-4 h-4 text-[#F5D061]" />
            </div>

            <div className="mt-3 space-y-3">
              {relevantAnnouncements.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  {translate(language, 'noAnnouncements')}
                </div>
              ) : (
                relevantAnnouncements.slice(0, 5).map(ann => (
                  <div
                    key={ann.id}
                    className={`p-3 rounded-xl border text-xs ${
                      ann.urgency === 'URGENT'
                        ? 'border-rose-500/45 bg-rose-950/25'
                        : 'border-[#D4AF37]/25 bg-[#090D16]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-white">{ann.title}</h4>
                      <span className="text-[9px] font-bold text-[#F5D061] shrink-0">
                        {ann.announcementType === 'OFFICIAL_APP'
                          ? (language === 'ur' ? '👑 آفیشل' : '👑 OFFICIAL')
                          : (language === 'ur' ? '📢 کمیونٹی' : '📢 COMMUNITY')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{ann.content}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-[#D4AF37]/15 pt-1.5">
                      <span>{language === 'ur' ? `از: ${ann.publishedBy}` : `From: ${ann.publishedBy}`}</span>
                      <span className="font-mono tabular-nums">{new Date(ann.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: SUBMIT PAYMENT (PRESERVED UPLOAD & COMPRESSION) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/80 p-3 sm:p-4 overflow-y-auto">
          <div
            className="relative w-full max-w-lg kc-luxury-modal rounded-2xl p-5 sm:p-6 pb-[100px] sm:pb-6 my-auto max-h-[92dvh] overflow-y-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <h3 className="text-base font-bold text-white pb-2 border-b border-[#D4AF37]/20">
              {language === 'ur' ? 'ادائیگی / ویلفیئر تعاون جمع کروائیں' : 'Submit Payment / Welfare Contribution'}
            </h3>

            {paymentSubmittedSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-sm text-white">
                  {language === 'ur' ? 'ادائیگی کامیابی سے جمع ہو گئی!' : 'Payment Submitted Successfully!'}
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {language === 'ur'
                    ? 'آپ کی ادائیگی ایڈمن کی تصدیق کے لیے زیر التواء ہے۔ منظوری کے بعد آپ کی مصدقہ رسید خودکار جاری ہو جائے گی۔'
                    : 'Your transaction is pending verification by your Admin. Once approved, your certified receipt is automatically issued.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit} className="mt-4 space-y-4">
                <DastoorPaymentCalculator
                  compact
                  language={language}
                  fundTier={fundTier}
                  onFundTierChange={setFundTier}
                  monthsCount={monthsCount}
                  onMonthsCountChange={setMonthsCount}
                  yearsCount={yearsCount}
                  onYearsCountChange={setYearsCount}
                  startMonth={startMonth}
                  onStartMonthChange={setStartMonth}
                  startYear={startYear}
                  onStartYearChange={setStartYear}
                  customAmount={customPayAmount}
                  onCustomAmountChange={setCustomPayAmount}
                  fundCategory={payFund}
                  onFundCategoryChange={setPayFund}
                  payerCnic={payerCnic}
                  onPayerCnicChange={setPayerCnic}
                  unit={unit}
                  onUnitChange={setUnit}
                  contactHelpline={appSettings.contactHelpline}
                />

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {language === 'ur' ? 'ادائیگی کا طریقہ' : 'Payment Method'}
                  </label>
                  <LuxurySelect
                    compact
                    value={payMethod}
                    onChange={(val) => setPayMethod(val as PaymentMethod)}
                    label={language === 'ur' ? 'ادائیگی کا طریقہ' : 'Payment Method'}
                    options={[
                      { value: 'EasyPaisa', label: language === 'ur' ? 'ایزی پیسہ (EasyPaisa)' : 'EasyPaisa' },
                      { value: 'JazzCash', label: language === 'ur' ? 'جاز کیش (JazzCash)' : 'JazzCash' },
                      { value: 'Bank Transfer', label: language === 'ur' ? 'بینک ٹرانسفر' : 'Bank Transfer' },
                      { value: 'Cash', label: language === 'ur' ? 'نقد (Cash)' : 'Cash' }
                    ]}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {language === 'ur' ? 'ٹرانزیکشن ریفرنس / سلپ نمبر' : 'Transaction Reference ID / Slip No.'}{' '}
                    <span className="text-slate-500 font-normal">
                      {language === 'ur' ? '(اگر تصویر اپلوڈ کی ہو تو اختیاری)' : '(Optional if photo uploaded)'}
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EP-99281726 or Bank Ref"
                    value={payReference}
                    onChange={(e) => setPayReference(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl kc-luxury-input"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {language === 'ur' ? 'ادائیگی اسکرین شاٹ / رسید تصویر اپلوڈ کریں' : 'Upload Payment Screenshot / Receipt Photo (Compressed)'}
                  </label>
                  <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[#D4AF37]/45 bg-[#090D16] cursor-pointer hover:border-[#F5D061] text-xs font-semibold text-slate-200 kc-pressable">
                    <Upload className="w-4 h-4 text-[#F5D061]" />
                    <span>
                      {isCompressing
                        ? (language === 'ur' ? 'رسید کمپریس ہو رہی ہے...' : 'Compressing receipt...')
                        : receiptImageName
                        ? `${language === 'ur' ? 'منسلک:' : 'Attached:'} ${receiptImageName}`
                        : (language === 'ur' ? 'رسید کی تصویر منتخب کریں (JPG/PNG)' : 'Tap to attach receipt photo (JPG/PNG)')}
                    </span>
                    <input ref={receiptInputRef} type="file" accept="image/*" onChange={handleReceiptFileChange} className="hidden" />
                  </label>
                  {receiptImageUrl ? (
                    <div className="relative mt-2 w-24 h-24 rounded-xl overflow-hidden border border-[#D4AF37]/30 bg-[#090D16]">
                      <img
                        src={receiptImageUrl}
                        alt={receiptImageName || 'Receipt'}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          clearReceiptImage();
                        }}
                        aria-label={language === 'ur' ? 'رسید ہٹائیں' : 'Remove receipt photo'}
                        title={language === 'ur' ? 'رسید ہٹائیں' : 'Remove receipt photo'}
                        className="absolute top-[6px] right-[6px] z-[999] w-[30px] h-[30px] rounded-full bg-[#DC2626] text-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.6)] cursor-pointer leading-none text-[13px] font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ) : null}
                  {uploadError && <p className="text-[11px] text-rose-400 mt-1">{uploadError}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {language === 'ur' ? 'اضافی نوٹ (اختیاری)' : 'Optional Note'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'ur' ? `مثلاً: ${currentMonthLabel} کا ماہانہ تعاون` : `e.g. ${currentMonthLabel} contribution`}
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl kc-luxury-input"
                  />
                </div>

                {paymentError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-xs text-rose-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{paymentError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D4AF37]/20">
                  <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer">
                    {translate(language, 'cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmitPayment || isCompressing || isSubmittingPayment}
                    className="flex items-center gap-1.5 px-4 py-2 kc-gold-button disabled:opacity-45 text-xs font-extrabold rounded-xl cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {isSubmittingPayment
                        ? (language === 'ur' ? 'جمع ہو رہا ہے...' : 'Submitting...')
                        : `${translate(language, 'actionPayFunds')} (PKR ${effectivePayAmount.toLocaleString()})`}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: COMPLAINT */}
      {isComplaintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/80 p-3 sm:p-4 overflow-y-auto">
          <div
            className="relative w-full max-w-lg kc-luxury-modal rounded-2xl p-5 sm:p-6 my-auto max-h-[92dvh] overflow-y-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <h3 className="text-base font-bold text-white pb-2 border-b border-[#D4AF37]/20">
              {language === 'ur' ? 'سپورٹ ٹکٹ یا شکایت درج کریں' : 'File Support Ticket or Grievance'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'ur'
                ? `براہ راست آپ کے ضلعی ایڈمن (${memberDistrict}, ${memberProvince}) کو بھیجی جائے گی۔`
                : `Routed directly to your District Admin in ${memberDistrict}, ${memberProvince}.`}
            </p>

            <form onSubmit={handleComplaintSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {language === 'ur' ? 'زمرہ' : 'Category'}
                  </label>
                  <LuxurySelect
                    compact
                    value={cmpCategory}
                    onChange={(val) => setCmpCategory(val as ComplaintCategory)}
                    label={language === 'ur' ? 'زمرہ' : 'Category'}
                    options={[
                      { value: 'Membership Card', label: language === 'ur' ? 'ممبرشپ کارڈ مسئلہ / ترسیل' : 'Membership Card Delivery / Issue' },
                      { value: 'Receipt Inquiry', label: language === 'ur' ? 'رسید یا ریکارڈ کی درستگی' : 'Receipt Tax / Record Correction' },
                      { value: 'Fund Allocation', label: language === 'ur' ? 'فنڈز کی تقسیم و شفافیت' : 'Fund Allocation Transparency' },
                      { value: 'Welfare Support', label: language === 'ur' ? 'ویلفیئر امداد نامزدگی' : 'Welfare Support Nomination' },
                      { value: 'District Activity', label: language === 'ur' ? 'ضلعی سرگرمی کا سوال' : 'District Activity Question' },
                      { value: 'General', label: language === 'ur' ? 'عمومی سوالات' : 'General Inquiries' }
                    ]}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {language === 'ur' ? 'ترجیح' : 'Urgency Priority'}
                  </label>
                  <LuxurySelect
                    compact
                    value={cmpPriority}
                    onChange={(val) => setCmpPriority(val as 'LOW' | 'MEDIUM' | 'HIGH')}
                    label={language === 'ur' ? 'ترجیح' : 'Urgency Priority'}
                    options={[
                      { value: 'LOW', label: language === 'ur' ? 'کم (معمول)' : 'Low' },
                      { value: 'MEDIUM', label: language === 'ur' ? 'درمیانی' : 'Medium' },
                      { value: 'HIGH', label: language === 'ur' ? 'زیادہ (فوری توجہ)' : 'High (Urgent Attention)' }
                    ]}
                  />
                </div>
              </div>

              <input
                type="text"
                required
                placeholder={language === 'ur' ? 'موضوع...' : 'Subject line...'}
                value={cmpSubject}
                onChange={(e) => setCmpSubject(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl kc-luxury-input"
              />

              <textarea
                required
                rows={4}
                placeholder={language === 'ur' ? 'مکمل تفصیلات لکھیں...' : 'Provide full details...'}
                value={cmpDescription}
                onChange={(e) => setCmpDescription(e.target.value)}
                className="w-full text-xs p-3 rounded-xl kc-luxury-input resize-none"
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D4AF37]/20">
                <button type="button" onClick={() => setIsComplaintModalOpen(false)} className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer">
                  {translate(language, 'cancel')}
                </button>
                <button type="submit" className="flex items-center gap-1.5 px-4 py-2 kc-gold-button text-xs font-extrabold rounded-xl cursor-pointer">
                  <Send className="w-3.5 h-3.5" />
                  <span>{language === 'ur' ? 'شکایت جمع کروائیں' : 'Submit Ticket'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
