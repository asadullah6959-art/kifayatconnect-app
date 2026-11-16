import React from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentTransaction } from '../../types';
import { X, Printer, ShieldCheck, CheckCircle2, Clock, XCircle, Calendar } from 'lucide-react';
import { mapLegacyRegionToHierarchy } from '../../data/locationData';
import { BrandEmblem3D } from '../common/BrandEmblem3D';
import { TabbarBadge, FaizKhelVipCrownIcon } from '../common/TabbarBadge';
import { DASTOOR_MONTHLY_RATE, formatRupeesUr, isFaizKhelUser, toUrduDigits } from '../../utils/dastoor';
import receiptSealImg from '../../assets/images/receipt_watermark_seal_1794225904149.jpg';

interface DigitalReceiptModalProps {
  receipt: PaymentTransaction;
  onClose: () => void;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({ receipt, onClose }) => {
  const { language, users } = useApp();
  const isUr = language === 'ur';
  const payer = users.find(u => u.id === receipt.userId);

  const tabbarId = receipt.userTabbarId || payer?.tabbarId;
  const tabbarEnglish = receipt.userTabbarEnglish || payer?.tabbarEnglish;
  const tabbarUrdu = receipt.userTabbarUrdu || payer?.tabbarUrdu;
  const isFaizKhel = isFaizKhelUser({ tabbarId, tabbarEnglish, tabbarUrdu });

  const handlePrint = () => {
    window.print();
  };

  const getAmountInWords = (amount: number) => {
    if (isUr) {
      return `صرف ${formatRupeesUr(amount)} (پاکستانی روپے)`;
    }
    return `${amount.toLocaleString()} Pakistan Rupees Only`;
  };

  const getStatusBadgeInfo = (status: PaymentTransaction['status']) => {
    if (status === 'VERIFIED') {
      return {
        bannerClass: 'kc-emerald-panel border-emerald-500/45',
        pillClass: 'bg-emerald-950/90 text-emerald-300 border-emerald-400/60',
        headlineEn: 'Approved ✓ — Credited to Welfare Fund',
        headlineUr: 'منظور شدہ ✓ — فلاحی فنڈ میں جمع کر دیا گیا',
        badgeEn: 'Approved ✓',
        badgeUr: 'منظور شدہ ✓',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
      };
    }
    if (status === 'REJECTED') {
      return {
        bannerClass: 'bg-rose-950/60 border border-rose-500/45',
        pillClass: 'bg-rose-950 text-rose-200 border-rose-500/60',
        headlineEn: 'Payment Rejected — Please Review & Resubmit',
        headlineUr: 'ادائیگی مسترد — براہ کرم درست رسید دوبارہ جمع کروائیں',
        badgeEn: 'Rejected',
        badgeUr: 'مسترد',
        icon: <XCircle className="w-4 h-4 text-rose-400 shrink-0" />,
      };
    }
    return {
      bannerClass: 'bg-[#231D0B]/90 border border-[#D4AF37]/60',
      pillClass: 'bg-[#090D16] text-[#FDE047] border-[#D4AF37]',
      headlineEn: 'Submitted · Under Review by Admin / Treasury',
      headlineUr: 'جمع شدہ · ایڈمن اور خزانہ کی جانب سے زیرِ جائزہ',
      badgeEn: 'Submitted · Under Review',
      badgeUr: 'جمع شدہ · زیرِ جائزہ',
      icon: <Clock className="w-4 h-4 text-[#FDE047] shrink-0" />,
    };
  };

  const statusInfo = getStatusBadgeInfo(receipt.status);

  const localizeFund = (cat: string) => {
    if (!isUr) return cat;
    if (cat === 'Monthly Contribution') return 'ماہانہ دستور / چندہ';
    if (cat === 'Annual Welfare Fund') return 'سالانہ فلاحی فنڈ';
    if (cat === 'Emergency Relief') return 'ہنگامی امداد';
    if (cat === 'Zakat & Sadqah') return 'زکوٰۃ و صدقات';
    return cat;
  };

  const localizeMethod = (m: string) => {
    if (!isUr) return m;
    if (m === 'EasyPaisa') return 'ایزی پیسہ';
    if (m === 'JazzCash') return 'جاز کیش';
    if (m === 'Bank Transfer') return 'بینک ٹرانسفر';
    if (m === 'Cash') return 'نقد رقم';
    return m;
  };

  const dastoorRate = receipt.ratePerMonth || DASTOOR_MONTHLY_RATE;
  const hasDastoorBreakdown = Boolean(receipt.monthsCount && receipt.monthsCount > 0);

  return (
    <div className="fixed inset-0 z-[10000] flex items-start sm:items-center justify-center bg-black/85 p-3 sm:p-4 overflow-y-auto">
      <div
        className={`kc-luxury-modal relative w-full max-w-xl rounded-2xl p-4 sm:p-7 my-auto max-h-[92dvh] overflow-y-auto ${
          isFaizKhel ? '!border-[1.5px] !border-[#D4AF37]' : ''
        }`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Header Action Bar */}
        <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#D4AF37]/25 no-print">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-[#F5D061] uppercase tracking-wider truncate">
              {isUr ? 'ڈیجیٹل رسید · مالیاتی واؤچر' : 'Digital Receipt · Verified Voucher'}
            </span>
            <span className="text-[#D4AF37]/50">·</span>
            <span className="text-xs font-mono text-slate-300 shrink-0">{receipt.receiptNumber}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="kc-pressable kc-gold-button flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-extrabold rounded-lg cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isUr ? 'پرنٹ کریں' : 'Print Receipt'}</span>
            </button>
            <button
              onClick={onClose}
              className="kc-pressable p-1.5 rounded-lg text-slate-300 hover:text-[#F5D061] hover:bg-[#161F33] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT BODY */}
        <div
          className={`receipt-print-area mt-4 print:bg-white p-4 sm:p-6 rounded-xl border shadow-[inset_0_1px_0_rgba(252,227,138,0.12)] relative overflow-hidden ${
            isFaizKhel
              ? 'bg-gradient-to-br from-[#2B1F06] via-[#42300A] to-[#1C1404] border-[1.5px] border-[#FDE047]'
              : 'bg-[#090D16] border-[#38BDF8]/30'
          }`}
        >
          {/* Official Seal Watermark */}
          <div
            className="absolute right-6 bottom-8 w-44 h-44 opacity-15 pointer-events-none rounded-full bg-cover"
            style={{ backgroundImage: `url(${receiptSealImg})` }}
          />

          {/* Top Logo and Organization Title */}
          <div className="flex items-start justify-between gap-2 border-b border-[#D4AF37]/25 pb-4">
            <div className="flex items-center gap-3 min-w-0">
              <BrandEmblem3D size="md" className="shrink-0" />
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-white print:text-slate-900 uppercase tracking-tight">
                  {isUr ? 'کفایت کنیکٹ ویلفیئر آرگنائزیشن' : 'Kifayat Connect Welfare Organization'}
                </h2>
                <p className="text-[11px] text-slate-300 print:text-slate-600">
                  {isUr ? 'مرکزی خزانہ و آڈٹ شدہ فلاحی کھاتے' : 'Central Treasury & Audited Welfare Accounts'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {isUr ? 'قومی ٹیکس نمبر: 8492019-3 · اسلام آباد' : 'NTN: 8492019-3 · Sector F-7 Secretariat, Islamabad'}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                {isUr ? 'ڈیجیٹل رسید' : 'Official E-Receipt'}
              </span>
              <span className="text-xs sm:text-sm font-bold font-mono text-[#F5D061] print:text-emerald-700 block">
                {receipt.receiptNumber}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono tabular-nums">
                {isUr ? 'تاریخ:' : 'Date:'} {receipt.date}
              </span>
            </div>
          </div>

          {/* Live Status Banner */}
          <div className={`my-4 py-2.5 px-3 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs ${statusInfo.bannerClass}`}>
            <div className="flex items-center gap-2 text-white print:text-slate-900 font-semibold min-w-0">
              {statusInfo.icon}
              <span>{isUr ? statusInfo.headlineUr : statusInfo.headlineEn}</span>
            </div>
            <span className={`font-mono text-[10px] px-2.5 py-0.5 rounded-md border font-extrabold shrink-0 ${statusInfo.pillClass}`}>
              {isUr ? statusInfo.badgeUr : statusInfo.badgeEn}
            </span>
          </div>

          {/* Member, Tabar & Payment Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs py-2">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium block">
                {isUr ? 'وصول از (ممبر اور ٹبر):' : 'Received From (Member & Tabar):'}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                {isFaizKhel && <FaizKhelVipCrownIcon className="w-4 h-4" />}
                <p className={`font-bold print:text-slate-900 text-sm ${isFaizKhel ? 'text-[#FDE047]' : 'text-white'}`}>
                  {receipt.userName}
                </p>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <TabbarBadge
                  tabbarId={tabbarId}
                  tabbarEnglish={tabbarEnglish}
                  tabbarUrdu={tabbarUrdu}
                  language={language}
                  compact
                />
                <span className="text-[#F5D061] print:text-slate-700 font-mono text-[11px]">
                  {receipt.userMembershipId}
                </span>
              </div>
              <div className="mt-1.5 space-y-0.5">
                <p className="text-slate-200 print:text-slate-700 font-medium text-[11px]">
                  {isUr ? 'ضلع:' : 'District:'} {receipt.district || payer?.district || (receipt.userRegion ? mapLegacyRegionToHierarchy(receipt.userRegion).district : 'Islamabad')}
                </p>
                <p className="text-slate-400 text-[10px]">
                  {isUr ? 'صوبہ:' : 'Province:'} {receipt.stateProvince || payer?.stateProvince || (receipt.userRegion ? mapLegacyRegionToHierarchy(receipt.userRegion).stateProvince : 'Islamabad Capital Territory')}
                </p>
              </div>
              {payer?.cnic && (
                <p className="text-slate-400 font-mono text-[10px] mt-1">
                  {isUr ? 'شناختی کارڈ:' : 'CNIC:'} {payer.cnic}
                </p>
              )}
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium block">
                {isUr ? 'لین دین کی تفصیلات:' : 'Transaction Details:'}
              </span>
              <p className="font-semibold text-white print:text-slate-900 mt-0.5">
                {localizeMethod(receipt.paymentMethod)}
              </p>
              <p className="text-slate-300 print:text-slate-600 font-mono text-[11px]">
                {isUr ? 'حوالہ:' : 'Ref:'} {receipt.referenceNumber}
              </p>
              <p className="text-slate-300 text-[11px]">
                {isUr ? 'فنڈ:' : 'Fund:'}{' '}
                <span className="text-emerald-400 print:text-emerald-700 font-medium">
                  {localizeFund(receipt.fundCategory)}
                </span>
              </p>
            </div>
          </div>

          {/* Dastoor Covered Period Breakdown (when submitted via Dastoor Rs. 100/Month Calculator) */}
          {(hasDastoorBreakdown || receipt.periodLabelEn || receipt.periodLabelUr) && (
            <div
              className="my-3 p-3.5 rounded-xl border border-[#D4AF37]/50 space-y-1.5"
              style={{
                background: 'linear-gradient(135deg, rgba(2, 44, 34, 0.85) 0%, rgba(6, 78, 59, 0.65) 100%)',
              }}
            >
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1.5 font-extrabold text-[#FDE047] uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{isUr ? 'دستور ادائیگی کی مدت' : 'Dastoor Covered Period'}</span>
                </span>
                {hasDastoorBreakdown && (
                  <span className="font-mono font-bold text-emerald-200 tabular-nums">
                    {isUr
                      ? `${toUrduDigits(receipt.monthsCount!)} مہینے @ ${toUrduDigits(dastoorRate)} روپے`
                      : `${receipt.monthsCount} ${receipt.monthsCount === 1 ? 'Month' : 'Months'} @ Rs. ${dastoorRate}`}
                  </span>
                )}
              </div>
              <div className="text-xs font-extrabold text-white print:text-slate-900">
                {isUr
                  ? receipt.periodLabelUr || receipt.periodLabelEn
                  : receipt.periodLabelEn || receipt.periodLabelUr}
              </div>
              {receipt.periodLabelEn && receipt.periodLabelUr && (
                <div className="text-[10px] text-emerald-100/85 print:text-slate-600">
                  {isUr ? receipt.periodLabelEn : receipt.periodLabelUr}
                </div>
              )}
            </div>
          )}

          {/* Amount Box */}
          <div className="my-4 p-4 kc-obsidian-card print:bg-slate-50 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                {isUr ? 'کل جمع شدہ رقم' : 'Total Amount Contributed'}
              </span>
              <p className="text-xs text-slate-200 print:text-slate-700 italic mt-0.5">
                "{getAmountInWords(receipt.amount)}"
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xl font-extrabold text-[#F5D061] print:text-slate-900 font-mono tabular-nums block">
                PKR {receipt.amount.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-white print:text-slate-800 block font-urdu-auto">
                {formatRupeesUr(receipt.amount)}
              </span>
            </div>
          </div>

          {receipt.proofNote && (
            <div className="text-[11px] text-slate-300 mb-4 bg-[#111726] border border-[#D4AF37]/20 p-2.5 rounded-lg">
              <span className="font-medium text-[#F5D061]">{isUr ? 'ادائیگی کنندہ کا نوٹ:' : 'Payer Remarks:'}</span> {receipt.proofNote}
            </div>
          )}

          {receipt.status === 'REJECTED' && receipt.rejectionReason && (
            <div className="text-[11px] text-rose-200 mb-4 bg-rose-950/60 border border-rose-500/40 p-2.5 rounded-lg">
              <span className="font-bold text-rose-300">{isUr ? 'مسترد ہونے کی وجہ:' : 'Rejection Note:'}</span> {receipt.rejectionReason}
            </div>
          )}

          {/* Officer Verification Signatures & Stamp */}
          <div className="pt-4 border-t border-[#D4AF37]/25 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <img
                src={receiptSealImg}
                alt="Stamp"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border border-[#D4AF37]/60 shadow-xs shrink-0"
              />
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                  {isUr ? 'مجاز تصدیق:' : 'Authorized Verification:'}
                </span>
                <p className="font-semibold text-white print:text-slate-900 text-xs">
                  {receipt.verifiedBy || (isUr ? 'مرکزی خزانہ آفیسر / زیرِ جائزہ' : 'Central Treasury / Automated Log')}
                </p>
                <p className="text-[10px] text-slate-400 font-mono tabular-nums">
                  {receipt.verifiedAt ? new Date(receipt.verifiedAt).toLocaleString() : (isUr ? 'سسٹم میں ریکارڈ شدہ' : 'System Logged')}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-1 text-[10px] text-[#F5D061] print:text-slate-600 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>E-SEAL: KC-AUTH-{receipt.id.toUpperCase()}</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1">
                {isUr
                  ? 'کمپیوٹر سے تیار کردہ قانونی رسید — دستی دستخط کی ضرورت نہیں۔'
                  : 'Computer-generated legal receipt. Does not require physical signature.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-[11px] text-slate-400 text-center mt-4 no-print">
          {isUr
            ? 'یہ رسید کفایت کنیکٹ کے مرکزی فنانس لیجر میں ریکارڈ ہو چکی ہے۔'
            : 'This receipt is permanently audited in Kifayat Connect Central Financial Ledger.'}
        </p>
      </div>
    </div>
  );
};
