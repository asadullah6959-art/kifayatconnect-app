import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Printer,
  Languages,
  ShieldCheck,
  Coins,
  CalendarDays,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  RukniyatFormDocument,
  emptyRukniyatValues,
  type DocLanguage,
  type RukniyatFormValues,
} from '../documents/RukniyatFormDocument';
import { printElement } from '../documents/printDocument';
import {
  calculateFundQuote,
  MAHANA_QUICK_MONTHS,
  SALANA_QUICK_YEARS,
  MONTHLY_RATE_PKR,
  YEARLY_RATE_PKR,
  FORM_PRINTING_FEE_PKR,
  formatPkr,
  toUrduDigits,
  receiptPurposeEn,
  receiptPurposeUr,
  type FundPlan,
  type MemberFormType,
} from '../../utils/fundPricing';
import { isValid13DigitCnic, normalizeCnicDigits, formatCnicDisplay, getCnicLockAlertMessage } from '../../utils/cnic';
import type { FundCategory, PaymentMethod } from '../../types';

/**
 * Rukniyat + Fund submission — replaces the old payment wizard.
 *
 * The applicant fills the official Rukniyat Form and chooses a fund. The رکنیت نمبر
 * is never typed by hand: it is minted automatically the moment the form is
 * submitted, printed on the form straight away, and the Raseed Wasooli reuses that
 * identical number when an authorised officer approves the application.
 */

const PAYMENT_METHODS: Array<{ id: PaymentMethod; en: string; ur: string }> = [
  { id: 'EasyPaisa', en: 'EasyPaisa', ur: 'ایزی پیسہ' },
  { id: 'JazzCash', en: 'JazzCash', ur: 'جاز کیش' },
  { id: 'Bank Transfer', en: 'Bank Transfer', ur: 'بینک ٹرانسفر' },
  { id: 'Cash', en: 'Cash', ur: 'نقد' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const RukniyatFundSystem: React.FC<Props> = ({ isOpen, onClose }) => {
  const { currentUser, submitPayment, language } = useApp();
  const isUr = language === 'ur';

  const [docLang, setDocLang] = useState<DocLanguage>(isUr ? 'ur' : 'en');
  const [values, setValues] = useState<RukniyatFormValues>(() => emptyRukniyatValues());
  const [plan, setPlan] = useState<FundPlan>('MAHANA');
  const [months, setMonths] = useState<number>(1);
  const [years, setYears] = useState<number>(1);
  const [memberType, setMemberType] = useState<MemberFormType>('NEW');
  const [method, setMethod] = useState<PaymentMethod>('EasyPaisa');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  /** Serial minted by this submission — the receipt reuses the same value. */
  const [issuedSerial, setIssuedSerial] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  // Prefill what the account already knows — the applicant can still edit it.
  useEffect(() => {
    if (!isOpen || !currentUser) return;
    setValues(prev => ({
      ...prev,
      applicantName: prev.applicantName || currentUser.name || '',
      phone: prev.phone || currentUser.phone || '',
      cnic: prev.cnic || normalizeCnicDigits(currentUser.cnic || ''),
      unit: prev.unit || (currentUser as any).tabbarEnglish || '',
      currentArea: prev.currentArea || currentUser.cityTown || '',
      centralClanEn: prev.centralClanEn || (currentUser as any).tabbarEnglish || '',
      permanentAddress: prev.permanentAddress || currentUser.address || '',
      currentAddress: prev.currentAddress || currentUser.address || '',
    }));
  }, [isOpen, currentUser]);

  const quote = useMemo(
    () => calculateFundQuote({ plan, months, years, memberType }),
    [plan, months, years, memberType]
  );

  const validationErrors = useMemo(() => {
    const errs: string[] = [];
    if (!values.applicantName.trim()) errs.push(isUr ? 'نام درکار ہے' : 'Applicant name is required');
    if (!values.fatherName.trim()) errs.push(isUr ? 'ولد کا نام درکار ہے' : "Father's name is required");
    if (!values.phone.trim()) errs.push(isUr ? 'رابطہ نمبر درکار ہے' : 'Contact number is required');
    if (!isValid13DigitCnic(values.cnic))
      errs.push(isUr ? 'شناختی کارڈ نمبر 13 ہندسوں کا ہونا لازمی ہے' : 'CNIC must be exactly 13 digits');
    if (!values.centralClan.trim())
      errs.push(isUr ? 'مرکزی خاندان (تبر) درکار ہے' : 'Central clan (tabbar) is required');
    if (!values.unit.trim()) errs.push(isUr ? 'یونٹ درکار ہے' : 'Unit is required');
    if (!quote.isValid) errs.push(...quote.errors);
    return errs;
  }, [values, quote, isUr]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError(null);
    // Hard gate: a 13-digit CNIC is mandatory. Nothing is submitted without it, and
    // the reason is shown in both languages so the requirement is unambiguous.
    if (!isValid13DigitCnic(values.cnic)) {
      setError(`${getCnicLockAlertMessage('ur')} — ${getCnicLockAlertMessage('en')}`);
      return;
    }
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }

    setBusy(true);
    try {
      const result = await submitPayment({
        amount: quote.totalAmount,
        fundCategory: (plan === 'MAHANA' ? 'Monthly Contribution' : 'Annual Welfare Fund') as FundCategory,
        fundTier: plan,
        monthsCount: plan === 'MAHANA' ? months : undefined,
        yearsCount: plan === 'SALANA' ? years : undefined,
        ratePerMonth: plan === 'MAHANA' ? MONTHLY_RATE_PKR : YEARLY_RATE_PKR,
        unit: values.unit,
        payerCnic: normalizeCnicDigits(values.cnic),
        paymentMethod: method,
        referenceNumber: reference.trim() || `RUKNIYAT-${Date.now()}`,
        proofNote: [
          `Rukniyat application — ${quote.periodLabelEn}`,
          `Applicant: ${values.applicantName} s/o ${values.fatherName}`,
          `CNIC: ${formatCnicDisplay(values.cnic)}`,
          `Form type: ${memberType === 'NEW' ? 'New Member (+ form printing fee)' : 'Old Member (form submitted by hand)'}`,
          `Fund: PKR ${quote.fundAmount} + printing fee PKR ${quote.printingFee} = PKR ${quote.totalAmount}`,
          note.trim() ? `Note: ${note.trim()}` : '',
        ]
          .filter(Boolean)
          .join(' | '),
        paymentMode: 'OTHER',
        periodLabelEn: quote.periodLabelEn,
        periodLabelUr: quote.periodLabelUr,
      });

      if (!result?.success) {
        setError(result?.error || (isUr ? 'درخواست جمع نہیں ہو سکی' : 'Could not submit the application'));
        return;
      }
      // The serial is minted by this submission; the receipt reuses this exact value.
      setIssuedSerial(result.transaction?.serialNumber || result.transaction?.receiptNumber || null);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || (isUr ? 'درخواست جمع نہیں ہو سکی' : 'Could not submit the application'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/85 p-2 sm:p-4 overflow-y-auto">
      <div className="kc-luxury-modal rounded-2xl max-w-5xl w-full p-3 sm:p-5 space-y-4 my-auto max-h-[94dvh] overflow-y-auto">
        {/* Header — app chrome only, the document below keeps its own official look */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#D4AF37]/25">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#F5D061]" />
              {isUr ? 'رکنیت فارم اور فنڈ' : 'Rukniyat Form & Fund'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isUr
                ? 'فارم بھریں اور فنڈ منتخب کریں۔ رکنیت نمبر جمع کرانے پر خودکار جاری ہوتا ہے اور منظوری کے بعد اسی نمبر سے رسید بنتی ہے۔'
                : 'Fill the form and choose a fund. The membership number is issued automatically on submission and the receipt reuses it after approval.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDocLang(docLang === 'ur' ? 'en' : 'ur')}
              className="kc-pressable flex items-center gap-1.5 px-3 py-2 bg-[#141B2D] hover:bg-[#1A233A] text-slate-200 border border-[#D4AF37]/40 text-xs font-semibold rounded-xl cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5 text-[#F5D061]" />
              <span>{docLang === 'ur' ? 'English' : 'اردو'}</span>
            </button>
            <button
              type="button"
              onClick={() => printElement(printRef.current)}
              className="kc-pressable flex items-center gap-1.5 px-3 py-2 bg-[#141B2D] hover:bg-[#1A233A] text-slate-200 border border-[#D4AF37]/40 text-xs font-semibold rounded-xl cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#F5D061]" />
              <span>{isUr ? 'پرنٹ / PDF' : 'Print / PDF'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="kc-pressable p-2 rounded-xl bg-[#141B2D] hover:bg-[#1A233A] border border-[#D4AF37]/40 text-slate-300 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              {isUr ? 'درخواست جمع ہو گئی — منظوری کا انتظار' : 'Application submitted — awaiting approval'}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isUr
                ? `آپ کی درخواست ${formatPkr(quote.totalAmount)} کے ساتھ جمع ہو گئی ہے۔ رکنیت نمبر ابھی جاری ہو چکا ہے اور منظوری کے بعد اسی نمبر کے ساتھ رسید وصولی جاری ہوگی۔`
                : `Your application for ${formatPkr(quote.totalAmount)} was submitted. The membership number is already issued; after approval the Raseed Wasooli is issued with that same number.`}
            </p>
            {issuedSerial ? (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#D4AF37]/50 bg-[#0B1220]/70 px-3 py-2">
                <span className="text-[11px] text-slate-300">
                  {isUr ? 'رکنیت نمبر / رسید نمبر' : 'Membership No. / Receipt No.'}
                </span>
                <span className="sqi-serial-badge">{issuedSerial}</span>
                <span className="text-[10px] text-slate-400">
                  {isUr
                    ? 'یہی نمبر فارم اور رسید وصولی دونوں پر پرنٹ ہوگا۔'
                    : 'This same number prints on both the form and the Raseed Wasooli.'}
                </span>
              </div>
            ) : null}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="kc-pressable kc-gold-button px-4 py-2 text-xs font-extrabold rounded-xl cursor-pointer"
              >
                {isUr ? 'بند کریں' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => printElement(printRef.current)}
                className="kc-pressable px-4 py-2 text-xs font-semibold rounded-xl bg-[#141B2D] border border-[#D4AF37]/40 text-slate-200 cursor-pointer"
              >
                {isUr ? 'فارم پرنٹ کریں' : 'Print the form'}
              </button>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
          {/* Official document */}
          <div ref={printRef} className="min-w-0">
            <RukniyatFormDocument
              values={values}
              onChange={(patch: Partial<RukniyatFormValues>) => setValues(prev => ({ ...prev, ...patch }))}
              language={docLang}
              editable={!submitted}
              serialNumber={issuedSerial}
            />
          </div>

          {/* Fund calculator */}
          <div className="space-y-3">
            <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#0B1220]/80 p-3 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#F5D061] uppercase tracking-wider">
                <UserPlus className="w-3.5 h-3.5" />
                {isUr ? 'فارم کی قسم' : 'Form type'}
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  disabled={submitted}
                  onClick={() => setMemberType('NEW')}
                  className={`text-start px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    memberType === 'NEW'
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#F5D061]'
                      : 'bg-[#141B2D] border-[#D4AF37]/25 text-slate-300'
                  }`}
                >
                  {isUr ? 'نیا رکن' : 'New Member'}
                  <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                    {isUr
                      ? `فارم پرنٹنگ فیس ${formatPkr(FORM_PRINTING_FEE_PKR)} لازمی`
                      : `Form printing fee ${formatPkr(FORM_PRINTING_FEE_PKR)} applies`}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={submitted}
                  onClick={() => setMemberType('OLD_BY_HAND')}
                  className={`text-start px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    memberType === 'OLD_BY_HAND'
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#F5D061]'
                      : 'bg-[#141B2D] border-[#D4AF37]/25 text-slate-300'
                  }`}
                >
                  {isUr ? 'پرانہ رکن (فارم بذریعہ ہاتھ جمع)' : 'Old Member (form already submitted by hand)'}
                  <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                    {isUr ? 'پرنٹنگ فیس نہیں — صرف فنڈ' : 'No printing fee — fund only'}
                  </span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#0B1220]/80 p-3 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#F5D061] uppercase tracking-wider">
                <CalendarDays className="w-3.5 h-3.5" />
                {isUr ? 'فنڈ منتخب کریں' : 'Choose the fund'}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={submitted}
                  onClick={() => setPlan('MAHANA')}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                    plan === 'MAHANA'
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#F5D061]'
                      : 'bg-[#141B2D] border-[#D4AF37]/25 text-slate-300'
                  }`}
                >
                  {isUr ? 'ماہانہ' : 'Monthly'}
                  <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                    {formatPkr(MONTHLY_RATE_PKR)} / {isUr ? 'ماہ' : 'month'}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={submitted}
                  onClick={() => setPlan('SALANA')}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                    plan === 'SALANA'
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#F5D061]'
                      : 'bg-[#141B2D] border-[#D4AF37]/25 text-slate-300'
                  }`}
                >
                  {isUr ? 'سالانہ' : 'Yearly'}
                  <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                    {formatPkr(YEARLY_RATE_PKR)} / {isUr ? 'سال' : 'year'}
                  </span>
                </button>
              </div>

              {plan === 'MAHANA' ? (
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-300 block">
                    {isUr ? 'مہینے (1 سے 11 تک)' : 'Months (1 to 11)'}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {MAHANA_QUICK_MONTHS.map(m => (
                      <button
                        key={m}
                        type="button"
                        disabled={submitted}
                        onClick={() => setMonths(m)}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer ${
                          months === m
                            ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F5D061]'
                            : 'bg-[#141B2D] border-[#D4AF37]/25 text-slate-300'
                        }`}
                      >
                        {isUr ? toUrduDigits(m) : m}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={11}
                    step={1}
                    disabled={submitted}
                    value={months}
                    onChange={e => setMonths(Math.max(1, Math.min(11, Number(e.target.value) || 1)))}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1220] border border-[#D4AF37]/30 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                  <p className="text-[10px] text-slate-500">
                    {isUr
                      ? 'بارہ ماہ کے لیے سالانہ فنڈ منتخب کریں۔'
                      : 'For 12 months choose the yearly fund.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-300 block">
                    {isUr ? 'سال (کوئی بھی تعداد)' : 'Years (any count)'}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {SALANA_QUICK_YEARS.map(y => (
                      <button
                        key={y}
                        type="button"
                        disabled={submitted}
                        onClick={() => setYears(y)}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer ${
                          years === y
                            ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F5D061]'
                            : 'bg-[#141B2D] border-[#D4AF37]/25 text-slate-300'
                        }`}
                      >
                        {isUr ? `${toUrduDigits(y)} سال` : `${y} yr`}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    step={1}
                    disabled={submitted}
                    value={years}
                    onChange={e => setYears(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1220] border border-[#D4AF37]/30 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              )}
            </div>

            {/* Live total */}
            <div className="rounded-2xl border border-[#D4AF37]/45 bg-[#0B1220]/90 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span>{isUr ? 'فنڈ' : 'Fund'}</span>
                <span className="font-mono">{formatPkr(quote.fundAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span>{isUr ? 'فارم پرنٹنگ فیس' : 'Form printing fee'}</span>
                <span className="font-mono">{formatPkr(quote.printingFee)}</span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-[#D4AF37]/25">
                <span className="text-xs font-bold text-[#F5D061]">
                  {isUr ? 'کل قابل ادائیگی' : 'Total payable'}
                </span>
                <span className="text-sm font-extrabold text-white font-mono">
                  {formatPkr(quote.totalAmount)}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
                {isUr
                  ? 'رکنیت نمبر رقم نہیں ہے — وہ جمع کرانے پر الگ سے جاری ہوتا ہے۔'
                  : 'The membership number is not money — it is issued separately on submission.'}
              </p>
            </div>

            {/* Payment details */}
            <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#0B1220]/80 p-3 space-y-2">
              <label className="text-[11px] font-semibold text-slate-300 block">
                {isUr ? 'ادائیگی کا طریقہ' : 'Payment method'}
              </label>
              <select
                disabled={submitted}
                value={method}
                onChange={e => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B1220] border border-[#D4AF37]/30 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m.id} value={m.id}>
                    {isUr ? m.ur : m.en}
                  </option>
                ))}
              </select>
              <input
                type="text"
                disabled={submitted}
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder={isUr ? 'حوالہ / ٹرانزیکشن نمبر' : 'Reference / transaction no.'}
                className="w-full px-3 py-2 rounded-xl bg-[#0B1220] border border-[#D4AF37]/30 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
              <textarea
                disabled={submitted}
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                placeholder={isUr ? 'اضافی نوٹ (اختیاری)' : 'Additional note (optional)'}
                className="w-full px-3 py-2 rounded-xl bg-[#0B1220] border border-[#D4AF37]/30 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {error ? (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-2.5 text-[11px] text-red-200">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            ) : null}

            {!submitted ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={busy}
                className="kc-pressable kc-gold-button w-full py-2.5 text-xs font-extrabold rounded-xl cursor-pointer disabled:opacity-60"
              >
                {busy
                  ? isUr
                    ? 'جمع ہو رہا ہے...'
                    : 'Submitting...'
                  : isUr
                  ? 'منظوری کے لیے جمع کروائیں'
                  : 'Submit for approval'}
              </button>
            ) : null}

            <p className="flex items-start gap-1.5 text-[10px] text-slate-500 leading-relaxed">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[#D4AF37]" />
              {isUr
                ? 'رسید وصولی صرف منظوری کے بعد جاری ہوگی اور اس پر وہی رکنیت نمبر ہوگا جو فارم پر ہے۔'
                : 'The Raseed Wasooli is issued only after approval and carries the same number as the form.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RukniyatFundSystem;
