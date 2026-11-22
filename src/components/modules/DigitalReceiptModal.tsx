import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentTransaction } from '../../types';
import {
  X,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  FileDown,
  FileSpreadsheet,
  Share2,
  Lock,
  Loader2,
  Check
} from 'lucide-react';
import { mapLegacyRegionToHierarchy } from '../../data/locationData';
import { BrandEmblem3D } from '../common/BrandEmblem3D';
import { TabbarBadge, FaizKhelVipCrownIcon } from '../common/TabbarBadge';
import { OfficialMoharStamp } from '../common/OfficialMoharStamp';
import {
  DASTOOR_MONTHLY_RATE,
  formatRupeesUr,
  isFaizKhelUser,
  toUrduDigits,
  copyToClipboardSafe
} from '../../utils/dastoor';
import { canViewUserCnic } from '../../utils/privacy';
import {
  downloadOfficialReceiptPdf,
  downloadOfficialReceiptExcel,
  buildWhatsAppReceiptText,
  resolveReceiptFundTierLabel
} from '../../utils/receiptExport';

interface DigitalReceiptModalProps {
  receipt: PaymentTransaction;
  onClose: () => void;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({ receipt, onClose }) => {
  const { language, users, currentUser } = useApp();
  const isUr = language === 'ur';
  const payer = users.find(u => u.id === receipt.userId);
  const canShowPayerCnic = Boolean(
    (payer?.cnic || receipt.payerCnic) &&
      (!payer || canViewUserCnic(currentUser, payer))
  );

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const tabbarId = receipt.userTabbarId || payer?.tabbarId;
  const tabbarEnglish = receipt.userTabbarEnglish || payer?.tabbarEnglish;
  const tabbarUrdu = receipt.userTabbarUrdu || payer?.tabbarUrdu;
  const isFaizKhel = isFaizKhelUser({ tabbarId, tabbarEnglish, tabbarUrdu });

  const isVerified = receipt.status === 'VERIFIED';
  const serial = receipt.serialNumber || receipt.receiptNumber;
  const unitLabel =
    receipt.unit ||
    receipt.unionCouncil ||
    receipt.district ||
    payer?.district ||
    'Central Unit';
  const fundTierLabel = resolveReceiptFundTierLabel(receipt);
  const whatsAppText = buildWhatsAppReceiptText(receipt);
  const whatsAppHref = `https://wa.me/?text=${encodeURIComponent(whatsAppText)}`;

  const handlePrint = () => {
    if (!isVerified) return;
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!isVerified || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await downloadOfficialReceiptPdf(receipt, payer, { allowCnic: canShowPayerCnic });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadExcel = () => {
    if (!isVerified) return;
    downloadOfficialReceiptExcel(receipt, payer, { allowCnic: canShowPayerCnic });
  };

  const handleShareWhatsApp = async () => {
    if (!isVerified) return;
    await copyToClipboardSafe(whatsAppText);
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `SUI KHEL ITTEHAD Raseed ${serial}`,
          text: whatsAppText,
        });
        setShareFeedback(isUr ? 'رسید شیئر اور کاپی ہو گئی!' : 'Receipt shared & copied!');
        setTimeout(() => setShareFeedback(null), 2600);
        return;
      } catch {
        // Fallback notice when user closes native sheet or on unsupported WebView
      }
    }
    setShareFeedback(
      isUr
        ? 'رسید کاپی ہو گئی! اب نیچے واٹس ایپ لنک کھول کر بھیجیں۔'
        : 'Raseed copied! Tap Open WhatsApp below to send.'
    );
    setTimeout(() => setShareFeedback(null), 3200);
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
    <div className="fixed inset-0 z-[10000] kc-modal-backdrop flex items-start sm:items-center justify-center bg-black/85 overflow-y-auto">
      <div
        className={`kc-luxury-modal kc-modal-panel relative w-full max-w-xl rounded-2xl p-4 sm:p-6 pb-24 sm:pb-6 my-auto overflow-y-auto ${
          isFaizKhel ? '!border-[1.5px] !border-[#E5E4E2]' : ''
        }`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Header Action Bar */}
        <div className="flex items-start justify-between gap-2 pb-4 border-b border-[#E5E4E2]/25 no-print">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 flex-1 min-w-0">
            <span className="text-xs font-bold text-[#E5E4E2] uppercase tracking-wider break-words whitespace-normal leading-snug">
              {isVerified
                ? (isUr ? 'رسید وصولی · آفیشل تصدیق شدہ واؤچر' : 'Official Raseed · Approved Voucher')
                : (isUr ? 'ٹریکنگ سلپ · منظوری کا انتظار' : 'Tracking Slip · Pending Admin Approval')}
            </span>
            <span className="text-[#E5E4E2]/50">·</span>
            <span className="text-xs font-mono text-slate-300 shrink-0">{serial}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isVerified && (
              <button
                type="button"
                onClick={handlePrint}
                className="kc-pressable kc-gold-button flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-extrabold rounded-lg cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isUr ? 'پرنٹ' : 'Print'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="kc-pressable min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl text-slate-300 hover:text-[#E5E4E2] hover:bg-[#161F33] shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STRICT APPROVAL GATE: Unapproved or Rejected receipts stay locked without Mohar/PDF/EXL */}
        {!isVerified ? (
          <div className="mt-4 space-y-4">
            <div
              className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                receipt.status === 'REJECTED'
                  ? 'bg-rose-950/45 border-rose-500/50'
                  : 'bg-[#0D2A1F] border-[#E5E4E2]/55'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#071812] border border-[#E5E4E2]/45 flex items-center justify-center shrink-0">
                    {receipt.status === 'REJECTED' ? (
                      <XCircle className="w-5 h-5 text-rose-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-[#CBD5E1]" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      {receipt.status === 'REJECTED'
                        ? (isUr ? 'ادائیگی مسترد کر دی گئی' : 'Payment Rejected')
                        : (isUr ? 'ایڈمن منظوری زیرِ التواء' : 'Pending Admin Approval')}
                    </h3>
                    <p className="text-[11px] text-slate-300 font-mono">
                      {isUr ? 'سیریل نمبر:' : 'Tracking Serial:'} {serial}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border shrink-0 ${
                    receipt.status === 'REJECTED'
                      ? 'bg-rose-950 text-rose-200 border-rose-500/60'
                      : 'bg-[#071812] text-[#CBD5E1] border-[#E5E4E2]/60'
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  <span>
                    {receipt.status === 'REJECTED'
                      ? (isUr ? 'مسترد' : 'Rejected')
                      : (isUr ? 'رسید مقفل ہے' : 'Raseed Locked')}
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#071812] border border-slate-400/20 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">{isUr ? 'ممبر کا نام' : 'Member'}</span>
                  <span className="font-bold text-white block truncate">{receipt.userName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">{isUr ? 'رقم' : 'Submitted Amount'}</span>
                  <span className="font-mono font-extrabold text-[#CBD5E1]">
                    PKR {receipt.amount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{isUr ? 'فنڈ کی قسم' : 'Fund Tier'}</span>
                  <span className="text-emerald-300 font-semibold">
                    {isUr ? fundTierLabel.ur : fundTierLabel.en}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">{isUr ? 'تاریخ' : 'Date'}</span>
                  <span className="font-mono text-slate-200">{receipt.date}</span>
                </div>
              </div>

              {receipt.status === 'REJECTED' && receipt.rejectionReason ? (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200">
                  <strong className="text-rose-300">{isUr ? 'وجہ:' : 'Reason:'}</strong> {receipt.rejectionReason}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#071812] border border-[#E5E4E2]/35 flex items-start gap-2.5 text-xs text-slate-200">
                  <Lock className="w-4 h-4 text-[#CBD5E1] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-[#E5E4E2]">
                      {isUr
                        ? 'آفیشل مہر والی رسید (PDF / Excel / WhatsApp) ایڈمن منظوری کے بعد کھلے گی'
                        : 'Official Mohar Raseed (PDF / Excel / WhatsApp) unlocks after Admin Approval'}
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {isUr
                        ? 'جیسے ہی بانی (Founder) یا سپر ایڈمن آپ کی ادائیگی کی تصدیق کریں گے، آپ کو اطلاع ملے گی اور آپ سرکاری مہر کے ساتھ اپنی رسید ڈاؤن لوڈ کر سکیں گے۔'
                        : 'Once the Founder (KC-ADM-001) or an authorized Super Admin approves your payment, you will receive an instant notification and full Raseed downloads will unlock automatically.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* VERIFIED OFFICIAL RASEED ("رسید وصولی") */
          <>
            <div
              className={`receipt-print-area mt-4 print:bg-white p-4 sm:p-6 rounded-2xl border shadow-[inset_0_1px_0_rgba(252,227,138,0.14)] relative overflow-hidden ${
                isFaizKhel
                  ? 'bg-gradient-to-br from-[#2B1F06] via-[#42300A] to-[#1C1404] border-[1.5px] border-[#CBD5E1]'
                  : 'bg-[#071812] border-[#E5E4E2]/55'
              }`}
            >
              {/* Top Luxury Organization Banner */}
              <div className="rounded-xl p-3.5 sm:p-4 bg-gradient-to-r from-[#022C22] via-[#064E3B]/80 to-[#022C22] border border-[#E5E4E2]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <BrandEmblem3D size="md" className="shrink-0" />
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-extrabold text-[#E5E4E2] font-urdu-auto leading-tight">
                      سوئی خیل اتحاد
                    </h2>
                    <p className="text-[11px] font-bold text-emerald-200 tracking-wide">
                      SUI KHEL ITTEHAD · SUI KHEL ITTEHAD
                    </p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-[#E5E4E2] text-[#071812] text-[11px] font-black">
                      رسید وصولی · OFFICIAL RASEED
                    </span>
                  </div>
                </div>

                <div className="sm:text-right shrink-0 space-y-0.5 bg-[#071812]/70 px-3 py-2 rounded-xl border border-[#E5E4E2]/40">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">
                    {isUr ? 'سیریل نمبر / Serial No.' : 'Serial No.'}
                  </div>
                  <div className="text-sm font-black font-mono text-[#CBD5E1]">{serial}</div>
                  <div className="text-[10px] text-slate-300 font-mono tabular-nums">
                    {isUr ? 'تاریخ:' : 'Date:'} {receipt.date}
                  </div>
                  <div className="text-[10px] text-[#059669] font-bold truncate max-w-[160px]">
                    {isUr ? 'یونٹ:' : 'Unit:'} {unitLabel}
                  </div>
                </div>
              </div>

              {/* Approved Status Pill */}
              <div className="my-3.5 py-2 px-3 rounded-xl kc-emerald-panel border border-emerald-500/45 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {isUr
                      ? 'منظور شدہ ✓ — آفیشل مہر اور رسید وصولی جاری کر دی گئی'
                      : 'Approved ✓ — Official Verified Raseed Issued'}
                  </span>
                </div>
                <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-md border font-extrabold bg-emerald-950/90 text-emerald-300 border-emerald-400/60">
                  VERIFIED ✓
                </span>
              </div>

              {/* Exact Official Urdu Receipt Wording */}
              <div
                dir="rtl"
                className="my-3.5 p-4 rounded-xl bg-[#0F172A] border border-[#E5E4E2]/50 text-center space-y-1.5"
              >
                <p className="text-sm sm:text-base font-extrabold text-[#E5E4E2] font-urdu-auto leading-loose">
                  محترم جناب <span className="text-white underline decoration-[#E5E4E2] underline-offset-4">{receipt.userName}</span> صاحب کی جانب سے مبلغ{' '}
                  <span className="text-[#059669] font-mono">{receipt.amount.toLocaleString()}</span> روپے ({formatRupeesUr(receipt.amount)}) سکہ رائج الوقت وصول پائے۔
                </p>
                <p className="text-[11px] text-slate-300" dir="ltr">
                  Received with thanks from <strong className="text-white">{receipt.userName}</strong> the sum of{' '}
                  <strong className="text-[#CBD5E1]">PKR {receipt.amount.toLocaleString()}</strong>.
                </p>
              </div>

              {/* Member & Transaction Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs py-2">
                <div className="p-3 rounded-xl bg-[#0F172A]/85 border border-slate-400/20 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold block">
                    {isUr ? 'ممبر و ٹبر کی تفصیل:' : 'Member & Tabar Details:'}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isFaizKhel && <FaizKhelVipCrownIcon className="w-4 h-4" />}
                    <span className={`font-bold text-sm ${isFaizKhel ? 'text-[#CBD5E1]' : 'text-white'}`}>
                      {receipt.userName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <TabbarBadge
                      tabbarId={tabbarId}
                      tabbarEnglish={tabbarEnglish}
                      tabbarUrdu={tabbarUrdu}
                      language={language}
                      compact
                    />
                    <span className="text-[#E5E4E2] font-mono text-[11px]">
                      {receipt.userMembershipId}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    {receipt.district || payer?.district || (receipt.userRegion ? mapLegacyRegionToHierarchy(receipt.userRegion).district : 'Islamabad')},{' '}
                    {receipt.stateProvince || payer?.stateProvince || (receipt.userRegion ? mapLegacyRegionToHierarchy(receipt.userRegion).stateProvince : 'Pakistan')}
                  </p>
                  {canShowPayerCnic && (receipt.payerCnic || payer?.cnic) && (
                    <p className="text-slate-300 font-mono text-[10px]">
                      {isUr ? 'شناختی کارڈ:' : 'CNIC:'} {receipt.payerCnic || payer?.cnic}
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-[#0F172A]/85 border border-slate-400/20 space-y-1 sm:text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold block">
                    {isUr ? 'لین دین کی تفصیلات:' : 'Transaction Breakdown:'}
                  </span>
                  <p className="font-bold text-emerald-300">
                    {isUr ? fundTierLabel.ur : fundTierLabel.en}
                  </p>
                  <p className="text-white font-semibold">
                    {localizeMethod(receipt.paymentMethod)}
                  </p>
                  <p className="text-slate-300 font-mono text-[11px]">
                    {isUr ? 'حوالہ:' : 'Ref:'} {receipt.referenceNumber}
                  </p>
                  <p className="text-base font-black font-mono text-[#CBD5E1] tabular-nums">
                    PKR {receipt.amount.toLocaleString()}
                  </p>
                </div>
              </div>

              {(hasDastoorBreakdown || receipt.periodLabelEn || receipt.periodLabelUr) && (
                <div
                  className="my-2.5 p-3 rounded-xl border border-[#E5E4E2]/45 space-y-1"
                  style={{
                    background: 'linear-gradient(135deg, rgba(2, 44, 34, 0.85) 0%, rgba(6, 78, 59, 0.6) 100%)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1.5 font-extrabold text-[#CBD5E1]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{isUr ? 'فنڈ کا دورانیہ / تفصیل' : 'Covered Fund Period'}</span>
                    </span>
                    {hasDastoorBreakdown && (
                      <span className="font-mono font-bold text-emerald-200 tabular-nums">
                        {isUr
                          ? `${toUrduDigits(receipt.monthsCount!)} مہینے @ ${toUrduDigits(dastoorRate)} روپے`
                          : `${receipt.monthsCount} Months @ Rs. ${dastoorRate}`}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-extrabold text-white">
                    {isUr
                      ? receipt.periodLabelUr || receipt.periodLabelEn
                      : receipt.periodLabelEn || receipt.periodLabelUr}
                  </div>
                </div>
              )}

              {/* Signatures + Official Circular Mohar Stamp */}
              <div className="mt-4 pt-4 border-t border-[#E5E4E2]/30 grid grid-cols-1 sm:grid-cols-3 items-center gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#059669]">
                    {receipt.verifiedBy || (isUr ? 'بانی / سپر ایڈمن' : 'Founder / Super Admin')}
                  </p>
                  <div className="border-t border-[#E5E4E2]/50 pt-1">
                    <p className="text-xs font-extrabold text-[#E5E4E2] font-urdu-auto">
                      دستخط ناظم مالیات
                    </p>
                    <p className="text-[10px] text-slate-400">Finance Secretary Signature</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <OfficialMoharStamp variant="VERIFIED" serialNumber={serial} size={112} />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-emerald-300">SUI KHEL ITTEHAD Treasury</p>
                  <div className="border-t border-[#E5E4E2]/50 pt-1">
                    <p className="text-xs font-extrabold text-[#E5E4E2] font-urdu-auto">
                      دستخط وصول کنندہ
                    </p>
                    <p className="text-[10px] text-slate-400">Authorized Receiver Signature</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-400/15 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
                <span className="inline-flex items-center gap-1 text-[#E5E4E2]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  E-SEAL: KC-AUTH-{receipt.id.toUpperCase()}
                </span>
                <span>
                  {receipt.verifiedAt ? new Date(receipt.verifiedAt).toLocaleString() : receipt.date}
                </span>
              </div>
            </div>

            {/* 3 Fast 1-Click Export & Share Buttons (Only Unlocked When Approved) */}
            <div className="mt-4 space-y-2.5 no-print">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  disabled={isExportingPdf}
                  onClick={handleDownloadPdf}
                  className="kc-pressable kc-gold-button min-h-[44px] flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer disabled:opacity-60"
                >
                  {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                  <span>{isUr ? 'پی ڈی ایف (PDF)' : 'Download PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  className="kc-pressable min-h-[44px] flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#022C22] hover:bg-[#064E3B] border border-[#E5E4E2]/55 text-[#E5E4E2] text-xs font-extrabold cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                  <span>{isUr ? 'ایکسل (EXL)' : 'Download Excel (EXL)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="kc-pressable min-h-[44px] flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#0D2A1F] hover:bg-[#1E293B] border border-[#059669]/55 text-[#059669] text-xs font-extrabold cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{isUr ? 'واٹس ایپ شیئر' : 'Share on WhatsApp'}</span>
                </button>
              </div>

              {shareFeedback && (
                <div className="p-2.5 rounded-xl bg-[#022C22] border border-emerald-500/45 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-200">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Check className="w-4 h-4 text-emerald-400" />
                    {shareFeedback}
                  </span>
                  <a
                    href={whatsAppHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                  >
                    {isUr ? 'واٹس ایپ کھولیں ↗' : 'Open WhatsApp ↗'}
                  </a>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer Note */}
        <p className="text-[11px] text-slate-400 text-center mt-4 no-print">
          {isUr
            ? 'یہ ریکارڈ سوئی خیل اتحاد کے مرکزی آڈٹ لیجر میں محفوظ ہے۔'
            : 'This record is audited in SUI KHEL ITTEHAD Central Financial Ledger.'}
        </p>
      </div>
    </div>
  );
};
