import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Check,
  Copy,
  Coins,
  Sparkles,
  Building2,
  AlertTriangle,
  CheckCircle2,
  HeartHandshake,
  ShieldCheck
} from 'lucide-react';
import type { FundCategory, FundTier } from '../../types';
import { LuxurySelect } from './LuxurySelect';
import {
  DASTOOR_MONTHLY_RATE,
  SALANA_ANNUAL_RATE,
  MAHANA_QUICK_MONTHS,
  SALANA_QUICK_YEARS,
  MONTH_OPTIONS,
  DEFAULT_TREASURY_ACCOUNTS,
  calculateDastoorPeriod,
  calculateSalanaPeriod,
  copyToClipboardSafe,
  formatRupeesUr,
  toUrduDigits,
} from '../../utils/dastoor';
import {
  formatCnicDisplay,
  isValid13DigitCnic,
  getCnicLockAlertMessage,
} from '../../utils/cnic';

interface AdminPaymentAccountCardProps {
  language: 'en' | 'ur';
  contactHelpline?: string;
}

export const AdminPaymentAccountCard: React.FC<AdminPaymentAccountCardProps> = React.memo(
  ({ language, contactHelpline }) => {
    const isUr = language === 'ur';
    const [copiedAccountId, setCopiedAccountId] = useState<string | null>(null);

    const handleCopy = async (id: string, valueToCopy: string) => {
      await copyToClipboardSafe(valueToCopy);
      setCopiedAccountId(id);
      window.setTimeout(() => {
        setCopiedAccountId((prev) => (prev === id ? null : prev));
      }, 2400);
    };

    return (
      <div
        className="rounded-2xl p-3.5 sm:p-4 border border-slate-400/20 space-y-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(248,250,252,0.08)]"
        style={{
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.85) 0%, #131C31 55%, #0F172A 100%)',
        }}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-400/20 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#090D16] border border-[#38BDF8]/50 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-[#38BDF8]" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-extrabold text-[#F8FAFC] truncate">
                {isUr ? 'آفیشل ایڈمن ادائیگی اکاؤنٹس' : 'Official Admin Payment Accounts'}
              </h4>
              <p className="text-[10px] text-[#94A3B8] truncate">
                {isUr
                  ? 'اکاؤنٹ نمبر کاپی کریں اور رقم بھیج کر رسید اپ لوڈ کریں'
                  : 'Tap Copy to send your contribution, then upload receipt'}
              </p>
            </div>
          </div>
          {contactHelpline && (
            <span className="text-[10px] font-mono text-[#38BDF8] bg-[#090D16]/85 border border-[#38BDF8]/30 px-2 py-0.5 rounded-md">
              {contactHelpline}
            </span>
          )}
        </div>

        <div className="space-y-2">
          {DEFAULT_TREASURY_ACCOUNTS.map((acc) => {
            const isCopied = copiedAccountId === acc.id;
            return (
              <div
                key={acc.id}
                className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#090D16]/90 border border-slate-400/20"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-extrabold text-[#F5D061]">
                      {isUr ? acc.methodUr : acc.methodEn}
                    </span>
                    <span className="text-[10px] text-[#94A3B8] truncate">
                      · {isUr ? acc.bankOrProviderUr : acc.bankOrProviderEn}
                    </span>
                  </div>
                  <div className="text-xs font-mono font-extrabold text-[#F8FAFC] tracking-wide truncate mt-0.5">
                    {acc.accountNumber}
                  </div>
                  <div className="text-[10px] text-[#94A3B8] truncate">
                    {acc.accountTitle}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(acc.id, acc.accountNumber)}
                  className={`kc-pressable relative z-50 shrink-0 min-w-[48px] min-h-[48px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer ${
                    isCopied
                      ? 'bg-[#0EA5E9] border-[#38BDF8] text-[#090D16]'
                      : 'bg-gradient-to-br from-[#FDE047] via-[#D4AF37] to-[#A17419] border-[#FEF08A]/75 text-[#090D16]'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{isUr ? 'کاپی ہو گیا!' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 shrink-0" />
                      <span>{isUr ? 'کاپی کریں' : 'Copy'}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

AdminPaymentAccountCard.displayName = 'AdminPaymentAccountCard';

interface DastoorPaymentCalculatorProps {
  language: 'en' | 'ur';
  fundTier: FundTier;
  onFundTierChange: (tier: FundTier) => void;
  monthsCount: number;
  onMonthsCountChange: (months: number) => void;
  yearsCount: number;
  onYearsCountChange: (years: number) => void;
  startMonth: number;
  onStartMonthChange: (monthIndex: number) => void;
  startYear: number;
  onStartYearChange: (year: number) => void;
  customAmount: string;
  onCustomAmountChange: (amount: string) => void;
  fundCategory: FundCategory;
  onFundCategoryChange: (cat: FundCategory) => void;
  payerCnic: string;
  onPayerCnicChange: (cnic: string) => void;
  unit?: string;
  onUnitChange?: (unit: string) => void;
  contactHelpline?: string;
  compact?: boolean;
  actionSlot?: React.ReactNode;
}

export const DastoorPaymentCalculator: React.FC<DastoorPaymentCalculatorProps> = ({
  language,
  fundTier,
  onFundTierChange,
  monthsCount,
  onMonthsCountChange,
  yearsCount,
  onYearsCountChange,
  startMonth,
  onStartMonthChange,
  startYear,
  onStartYearChange,
  customAmount,
  onCustomAmountChange,
  fundCategory,
  onFundCategoryChange,
  payerCnic,
  onPayerCnicChange,
  unit = '',
  onUnitChange,
  contactHelpline,
  compact = false,
  actionSlot,
}) => {
  const isUr = language === 'ur';
  const currentYear = new Date().getFullYear();

  const [customMonthsDraft, setCustomMonthsDraft] = useState(String(monthsCount));
  const [customYearsDraft, setCustomYearsDraft] = useState(String(yearsCount));

  useEffect(() => {
    setCustomMonthsDraft(String(Math.min(11, Math.max(2, monthsCount || 2))));
  }, [monthsCount]);

  useEffect(() => {
    setCustomYearsDraft(String(Math.max(1, yearsCount || 1)));
  }, [yearsCount]);

  const yearOptions = useMemo(() => {
    const years: Array<{ value: string; label: string }> = [];
    for (let y = currentYear - 1; y <= currentYear + 6; y++) {
      years.push({
        value: String(y),
        label: isUr ? toUrduDigits(y) : String(y),
      });
    }
    return years;
  }, [currentYear, isUr]);

  const safeMahanaMonths = Math.min(11, Math.max(2, Math.floor(monthsCount || 2)));
  const mahanaPeriod = useMemo(
    () => calculateDastoorPeriod(startMonth, startYear, safeMahanaMonths),
    [startMonth, startYear, safeMahanaMonths]
  );

  const parsedDraftYears = parseInt(customYearsDraft, 10);
  const effectiveYears =
    customYearsDraft.trim() === ''
      ? 0
      : Number.isFinite(parsedDraftYears) && parsedDraftYears > 0
      ? Math.min(50, parsedDraftYears)
      : 0;

  const salanaPeriod = useMemo(
    () => calculateSalanaPeriod(startMonth, startYear, Math.max(1, effectiveYears || yearsCount || 1)),
    [startMonth, startYear, effectiveYears, yearsCount]
  );

  const cnicValid = isValid13DigitCnic(payerCnic);

  const localizeFund = (cat: FundCategory) => {
    if (!isUr) return cat;
    if (cat === 'Monthly Contribution') return 'ماہانہ فنڈ / چندہ';
    if (cat === 'Annual Welfare Fund') return 'سالانہ فلاحی فنڈ';
    if (cat === 'Emergency Relief') return 'ہنگامی فنڈ / Hangami Fund';
    if (cat === 'Zakat & Sadqah') return 'زکوٰۃ و صدقات';
    return cat;
  };

  return (
    <div className="space-y-3.5">
      {/* 3-Tier Fund Tabs: Mahana Fund (2–11m) | Salana Fund (Yearly) | ہنگامی فنڈ / Hangami Fund */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl kc-tab-shell">
        <button
          type="button"
          onClick={() => {
            onFundTierChange('MAHANA');
            onFundCategoryChange('Monthly Contribution');
            if (monthsCount < 2 || monthsCount > 11) {
              onMonthsCountChange(2);
            }
          }}
          className={`kc-pressable py-2 px-2 rounded-lg text-[10px] sm:text-xs font-extrabold transition-colors cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
            fundTier === 'MAHANA' ? 'kc-gold-button' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Coins className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {isUr ? 'ماہانہ فنڈ' : 'Mahana Fund'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onFundTierChange('SALANA');
            onFundCategoryChange('Annual Welfare Fund');
            if (yearsCount < 1) {
              onYearsCountChange(1);
            }
          }}
          className={`kc-pressable py-2 px-2 rounded-lg text-[10px] sm:text-xs font-extrabold transition-colors cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
            fundTier === 'SALANA' ? 'kc-gold-button' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {isUr ? 'سالانہ فنڈ' : 'Salana Fund'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onFundTierChange('HANGAMI');
            onFundCategoryChange('Emergency Relief');
          }}
          className={`kc-pressable py-2 px-2 rounded-lg text-[10px] sm:text-xs font-extrabold transition-colors cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
            fundTier === 'HANGAMI' ? 'kc-gold-button' : 'text-slate-300 hover:text-white'
          }`}
        >
          <HeartHandshake className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {isUr ? 'ہنگامی فنڈ' : 'Hangami Fund'}
          </span>
        </button>
      </div>

      {/* TIER 1: MAHANA FUND (2 to 11 Months @ Rs. 100/Month) */}
      {fundTier === 'MAHANA' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#131C31] border border-[#38BDF8]/35 text-[11px]">
            <span className="font-bold text-[#94A3B8]">
              {isUr ? 'ماہانہ فنڈ ریٹ (۲ تا ۱۱ مہینے):' : 'Mahana Fund Rate (2–11 Months):'}
            </span>
            <span className="font-mono font-extrabold text-[#38BDF8] tabular-nums">
              {isUr
                ? `۱۰۰ روپے فی مہینہ (PKR ${DASTOOR_MONTHLY_RATE})`
                : `Rs. ${DASTOOR_MONTHLY_RATE} / Month`}
            </span>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#F5D061] block mb-1.5 uppercase tracking-wider">
              {isUr ? 'مدت منتخب کریں (۲ تا ۱۱ مہینے)' : 'Select Months (2 to 11 Months)'}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
              {MAHANA_QUICK_MONTHS.map((m) => {
                const isSelected = safeMahanaMonths === m;
                const amt = m * DASTOOR_MONTHLY_RATE;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setCustomMonthsDraft(String(m));
                      onMonthsCountChange(m);
                    }}
                    className={`kc-pressable p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#FDE047] via-[#D4AF37] to-[#A17419] border-[#FEF08A] text-[#090D16] shadow-[0_4px_14px_rgba(212,175,55,0.3)]'
                        : 'bg-[#0F172A] border-slate-400/20 text-[#F8FAFC] hover:border-[#38BDF8]'
                    }`}
                  >
                    <div className="text-[11px] font-extrabold leading-tight">
                      {isUr ? `${toUrduDigits(m)} مہینے` : `${m} Months`}
                    </div>
                    <div
                      className={`text-[11px] font-mono tabular-nums font-black mt-0.5 ${
                        isSelected ? 'text-[#090D16]' : 'text-[#F5D061]'
                      }`}
                    >
                      {isUr ? formatRupeesUr(amt) : `Rs. ${amt.toLocaleString()}`}
                    </div>
                  </button>
                );
              })}

              {/* Custom Months Draft (2..11 allowed) */}
              <div className="p-2 rounded-xl border border-slate-400/20 bg-[#0F172A] flex flex-col justify-between">
                <label className="text-[10px] font-bold text-[#94A3B8] block leading-tight">
                  {isUr ? 'مہینے درج کریں (2–11)' : 'Custom (2–11M)'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={customMonthsDraft}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
                    setCustomMonthsDraft(raw);
                    if (raw === '') return;
                    const parsed = parseInt(raw, 10);
                    if (Number.isFinite(parsed) && parsed >= 2 && parsed <= 11) {
                      onMonthsCountChange(parsed);
                    }
                  }}
                  onBlur={() => {
                    const parsed = parseInt(customMonthsDraft, 10);
                    const valid =
                      Number.isFinite(parsed) && parsed >= 2
                        ? Math.min(11, parsed)
                        : 2;
                    setCustomMonthsDraft(String(valid));
                    onMonthsCountChange(valid);
                  }}
                  placeholder="2–11"
                  className="mt-1 w-full bg-[#131C31] border border-slate-400/25 rounded-lg px-2 py-1 text-xs font-mono font-extrabold text-[#F8FAFC] tabular-nums focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                {isUr ? 'شروع ہونے والا مہینہ' : 'Starting Month'}
              </label>
              <LuxurySelect
                compact
                value={String(startMonth)}
                onChange={(v) => onStartMonthChange(Number(v))}
                label={isUr ? 'شروع ہونے والا مہینہ' : 'Starting Month'}
                options={MONTH_OPTIONS.map((m) => ({
                  value: String(m.index),
                  label: isUr ? `${m.fullUr} (${m.shortEn})` : `${m.fullEn} (${m.fullUr})`,
                }))}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                {isUr ? 'شروع ہونے والا سال' : 'Starting Year'}
              </label>
              <LuxurySelect
                compact
                value={String(startYear)}
                onChange={(v) => onStartYearChange(Number(v))}
                label={isUr ? 'شروع ہونے والا سال' : 'Starting Year'}
                options={yearOptions}
              />
            </div>
          </div>

          <div
            className="rounded-xl p-3 border border-[#38BDF8]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            style={{
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.16) 0%, #131C31 55%, #0F172A 100%)',
            }}
          >
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {isUr
                    ? `ماہانہ فنڈ · ${toUrduDigits(mahanaPeriod.monthsCount)} مہینے × ۱۰۰ روپے`
                    : `Mahana Fund · ${mahanaPeriod.monthsCount} Months × Rs. ${DASTOOR_MONTHLY_RATE}`}
                </span>
              </div>
              <div className="text-xs font-extrabold text-[#F8FAFC] break-words">
                {isUr ? mahanaPeriod.periodLabelUr : mahanaPeriod.periodLabelEn}
              </div>
              <div className="text-[10px] text-[#94A3B8]">
                {isUr ? mahanaPeriod.periodLabelEn : mahanaPeriod.periodLabelUr}
              </div>
            </div>

            <div className="sm:text-right shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-400/20">
              <span className="text-[10px] text-[#94A3B8] block uppercase font-bold">
                {isUr ? 'کل واجب الادا رقم' : 'Total Payable'}
              </span>
              <span className="text-lg font-black font-mono tabular-nums text-[#F5D061]">
                PKR {mahanaPeriod.totalAmount.toLocaleString()}
              </span>
              <span className="block text-[11px] font-bold text-[#F8FAFC] font-urdu-auto">
                {formatRupeesUr(mahanaPeriod.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TIER 2: SALANA FUND (Yearly @ Rs. 1,200/Year, Smoothly Editable Input) */}
      {fundTier === 'SALANA' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#131C31] border border-[#D4AF37]/40 text-[11px]">
            <span className="font-bold text-[#94A3B8]">
              {isUr ? 'سالانہ فنڈ ریٹ (Salana Fund):' : 'Salana Fund Rate (Annual):'}
            </span>
            <span className="font-mono font-extrabold text-[#FDE047] tabular-nums">
              {isUr
                ? `۱,۲۰۰ روپے فی سال (PKR ${SALANA_ANNUAL_RATE})`
                : `Rs. ${SALANA_ANNUAL_RATE.toLocaleString()} / Year`}
            </span>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#F5D061] block mb-1.5 uppercase tracking-wider">
              {isUr ? 'سال منتخب کریں یا درج کریں' : 'Select or Enter Years (1, 2, 3, 5, 10+)'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SALANA_QUICK_YEARS.map((y) => {
                const isSelected = effectiveYears === y;
                const amt = y * SALANA_ANNUAL_RATE;
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setCustomYearsDraft(String(y));
                      onYearsCountChange(y);
                    }}
                    className={`kc-pressable p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#FDE047] via-[#D4AF37] to-[#A17419] border-[#FEF08A] text-[#090D16] shadow-[0_4px_14px_rgba(212,175,55,0.3)]'
                        : 'bg-[#0F172A] border-slate-400/20 text-[#F8FAFC] hover:border-[#D4AF37]'
                    }`}
                  >
                    <div className="text-[11px] font-extrabold leading-tight">
                      {isUr ? `${toUrduDigits(y)} سال` : `${y} ${y === 1 ? 'Year' : 'Years'}`}
                    </div>
                    <div
                      className={`text-[11px] font-mono tabular-nums font-black mt-0.5 ${
                        isSelected ? 'text-[#090D16]' : 'text-[#F5D061]'
                      }`}
                    >
                      {isUr ? formatRupeesUr(amt) : `Rs. ${amt.toLocaleString()}`}
                    </div>
                  </button>
                );
              })}

              {/* Freely Editable Years Input (supports full backspace to '') */}
              <div className="p-2 rounded-xl border border-[#D4AF37]/35 bg-[#0F172A] flex flex-col justify-between">
                <label className="text-[10px] font-bold text-[#F5D061] block leading-tight">
                  {isUr ? 'اپنے سال لکھیں' : 'Edit Years'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={customYearsDraft}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
                    setCustomYearsDraft(raw);
                    if (raw !== '') {
                      const parsed = parseInt(raw, 10);
                      if (Number.isFinite(parsed) && parsed > 0) {
                        onYearsCountChange(Math.min(50, parsed));
                      }
                    }
                  }}
                  onBlur={() => {
                    if (customYearsDraft.trim() === '') return;
                    const parsed = parseInt(customYearsDraft, 10);
                    const valid = Number.isFinite(parsed) && parsed > 0 ? Math.min(50, parsed) : 1;
                    setCustomYearsDraft(String(valid));
                    onYearsCountChange(valid);
                  }}
                  placeholder={isUr ? 'مثال: 1, 2, 10' : 'e.g. 1, 2, 10'}
                  className="mt-1 w-full bg-[#131C31] border border-[#D4AF37]/40 rounded-lg px-2 py-1 text-xs font-mono font-extrabold text-[#F8FAFC] tabular-nums focus:outline-none focus:border-[#FDE047]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                {isUr ? 'شروع ہونے والا مہینہ' : 'Starting Month'}
              </label>
              <LuxurySelect
                compact
                value={String(startMonth)}
                onChange={(v) => onStartMonthChange(Number(v))}
                label={isUr ? 'شروع ہونے والا مہینہ' : 'Starting Month'}
                options={MONTH_OPTIONS.map((m) => ({
                  value: String(m.index),
                  label: isUr ? `${m.fullUr} (${m.shortEn})` : `${m.fullEn} (${m.fullUr})`,
                }))}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                {isUr ? 'شروع ہونے والا سال' : 'Starting Year'}
              </label>
              <LuxurySelect
                compact
                value={String(startYear)}
                onChange={(v) => onStartYearChange(Number(v))}
                label={isUr ? 'شروع ہونے والا سال' : 'Starting Year'}
                options={yearOptions}
              />
            </div>
          </div>

          <div
            className="rounded-xl p-3 border border-[#D4AF37]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.14) 0%, #131C31 55%, #0F172A 100%)',
            }}
          >
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#FDE047]">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {effectiveYears > 0
                    ? isUr
                      ? `سالانہ فنڈ · ${toUrduDigits(effectiveYears)} سال × ۱,۲۰۰ روپے`
                      : `Salana Fund · ${effectiveYears} ${effectiveYears === 1 ? 'Year' : 'Years'} × Rs. ${SALANA_ANNUAL_RATE.toLocaleString()}`
                    : isUr
                    ? 'سالوں کی تعداد درج کریں'
                    : 'Enter number of years above'}
                </span>
              </div>
              {effectiveYears > 0 && (
                <>
                  <div className="text-xs font-extrabold text-[#F8FAFC] break-words">
                    {isUr ? salanaPeriod.periodLabelUr : salanaPeriod.periodLabelEn}
                  </div>
                  <div className="text-[10px] text-[#94A3B8]">
                    {isUr ? salanaPeriod.periodLabelEn : salanaPeriod.periodLabelUr}
                  </div>
                </>
              )}
            </div>

            <div className="sm:text-right shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-400/20">
              <span className="text-[10px] text-[#94A3B8] block uppercase font-bold">
                {isUr ? 'کل واجب الادا رقم' : 'Total Payable'}
              </span>
              <span className="text-lg font-black font-mono tabular-nums text-[#F5D061]">
                PKR {(effectiveYears * SALANA_ANNUAL_RATE).toLocaleString()}
              </span>
              <span className="block text-[11px] font-bold text-[#F8FAFC] font-urdu-auto">
                {formatRupeesUr(effectiveYears * SALANA_ANNUAL_RATE)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TIER 3: ہنگامی فنڈ / HANGAMI FUND (Custom PKR Amount) */}
      {fundTier === 'HANGAMI' && (
        <div className="space-y-3">
          <div className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#022C22] via-[#064E3B]/75 to-[#0F172A] border border-[#D4AF37]/45 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold text-[#FDE047]">
                ہنگامی فنڈ / Hangami Fund
              </p>
              <p className="text-[10px] text-emerald-100/85">
                {isUr
                  ? 'ہنگامی فلاحی امداد، علاج، میت یا خصوصی تعاون کے لیے اپنی مرضی کی رقم درج کریں'
                  : 'Enter any custom PKR amount for emergency relief, medical aid, or urgent community support'}
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-200 block mb-1.5">
              {isUr ? 'فنڈ کا مقصد / قسم' : 'Fund Purpose / Category'}
            </label>
            <LuxurySelect
              compact={compact}
              value={fundCategory}
              onChange={(val) => onFundCategoryChange(val as FundCategory)}
              label={isUr ? 'فنڈ کا مقصد / قسم' : 'Fund Purpose / Category'}
              options={[
                { value: 'Emergency Relief', label: isUr ? 'ہنگامی فنڈ / Hangami Fund' : 'ہنگامی فنڈ / Hangami Fund' },
                { value: 'Zakat & Sadqah', label: localizeFund('Zakat & Sadqah') },
                { value: 'Annual Welfare Fund', label: localizeFund('Annual Welfare Fund') },
                { value: 'Monthly Contribution', label: localizeFund('Monthly Contribution') },
              ]}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-200 block mb-1.5">
              {isUr ? 'ہنگامی فنڈ رقم درج کریں (PKR)' : 'Enter ہنگامی فنڈ / Hangami Fund Amount (PKR)'}
            </label>
            <input
              type="text"
              inputMode="numeric"
              required
              placeholder={isUr ? 'مثال: 500 یا 2500 روپے' : 'e.g. 500 or 2500 PKR'}
              value={customAmount}
              onChange={(e) => onCustomAmountChange(e.target.value.replace(/[^\d]/g, ''))}
              className="kc-luxury-input w-full text-sm font-mono tabular-nums font-bold px-3.5 py-2.5 rounded-xl"
            />
          </div>
        </div>
      )}

      {/* MANDATORY 13-DIGIT CNIC LOCK & OPTIONAL UNIT */}
      <div className="p-3 rounded-xl bg-[#070D14] border border-[#D4AF37]/40 space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <label className="text-[11px] font-extrabold text-[#FDE047] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isUr ? 'شناختی کارڈ نمبر (13 ہندسے لازمی) *' : '13-Digit CNIC (Mandatory) *'}</span>
              </label>
              {cnicValid && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isUr ? 'درست' : 'Valid'}</span>
                </span>
              )}
            </div>
            <input
              type="text"
              inputMode="numeric"
              required
              placeholder="35201-1234567-1"
              value={payerCnic}
              onChange={(e) => onPayerCnicChange(formatCnicDisplay(e.target.value))}
              className={`kc-luxury-input w-full text-xs font-mono font-bold px-3 py-2 rounded-xl ${
                cnicValid ? '!border-emerald-500/60' : '!border-rose-500/55'
              }`}
            />
          </div>

          {onUnitChange && (
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                {isUr ? 'یونٹ / حلقہ (اختیاری)' : 'Unit / Circle (Optional)'}
              </label>
              <input
                type="text"
                placeholder={isUr ? 'مثال: یونٹ نمبر ۱' : 'e.g. Unit No. 1'}
                value={unit}
                onChange={(e) => onUnitChange(e.target.value)}
                className="kc-luxury-input w-full text-xs px-3 py-2 rounded-xl"
              />
            </div>
          )}
        </div>

        {!cnicValid && (
          <div className="flex items-start gap-2 text-[11px] text-rose-300 bg-rose-950/50 border border-rose-500/40 rounded-lg p-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
            <span>{getCnicLockAlertMessage(language)}</span>
          </div>
        )}
      </div>

      {actionSlot}

      {/* 1-Click Copy Admin Payment Account Card */}
      <AdminPaymentAccountCard language={language} contactHelpline={contactHelpline} />
    </div>
  );
};

