import React, { useState, useMemo } from 'react';
import { Calendar, Check, Copy, Coins, Sparkles, Building2 } from 'lucide-react';
import type { FundCategory } from '../../types';
import { LuxurySelect } from './LuxurySelect';
import {
  DASTOOR_MONTHLY_RATE,
  DASTOOR_QUICK_PRESETS,
  MONTH_OPTIONS,
  DEFAULT_TREASURY_ACCOUNTS,
  calculateDastoorPeriod,
  copyToClipboardSafe,
  formatRupeesUr,
  toUrduDigits,
} from '../../utils/dastoor';

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
        className="rounded-2xl p-3.5 sm:p-4 border-[1.5px] border-[#D4AF37] space-y-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(253,224,71,0.22)]"
        style={{
          background: 'linear-gradient(145deg, #022C22 0%, #064E3B 55%, #022C22 100%)',
        }}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap border-b border-[#D4AF37]/30 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#021B14] border border-[#D4AF37]/70 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-[#FDE047]" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-extrabold text-[#FDE047] truncate">
                {isUr ? 'آفیشل ایڈمن ادائیگی اکاؤنٹس' : 'Official Admin Payment Accounts'}
              </h4>
              <p className="text-[10px] text-emerald-100/85 truncate">
                {isUr
                  ? 'اکاؤنٹ نمبر کاپی کریں اور رقم بھیج کر رسید اپ لوڈ کریں'
                  : 'Tap Copy to send your contribution, then upload receipt'}
              </p>
            </div>
          </div>
          {contactHelpline && (
            <span className="text-[10px] font-mono text-emerald-200 bg-[#021B14]/80 border border-[#D4AF37]/35 px-2 py-0.5 rounded-md">
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
                className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#021B14]/85 border border-[#D4AF37]/35"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-extrabold text-[#FDE047]">
                      {isUr ? acc.methodUr : acc.methodEn}
                    </span>
                    <span className="text-[10px] text-emerald-200/80 truncate">
                      · {isUr ? acc.bankOrProviderUr : acc.bankOrProviderEn}
                    </span>
                  </div>
                  <div className="text-xs font-mono font-extrabold text-white tracking-wide truncate mt-0.5">
                    {acc.accountNumber}
                  </div>
                  <div className="text-[10px] text-slate-300 truncate">
                    {acc.accountTitle}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(acc.id, acc.accountNumber)}
                  className={`kc-pressable shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold border transition-colors cursor-pointer ${
                    isCopied
                      ? 'bg-emerald-600 border-emerald-300 text-white'
                      : 'bg-gradient-to-br from-[#FDE047] via-[#D4AF37] to-[#9A711A] border-[#FEF08A]/70 text-[#021B14]'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{isUr ? 'کاپی ہو گیا!' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
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
  paymentMode: 'DASTOOR' | 'OTHER';
  onPaymentModeChange: (mode: 'DASTOOR' | 'OTHER') => void;
  monthsCount: number;
  onMonthsCountChange: (months: number) => void;
  startMonth: number;
  onStartMonthChange: (monthIndex: number) => void;
  startYear: number;
  onStartYearChange: (year: number) => void;
  customAmount: string;
  onCustomAmountChange: (amount: string) => void;
  fundCategory: FundCategory;
  onFundCategoryChange: (cat: FundCategory) => void;
  contactHelpline?: string;
  compact?: boolean;
}

export const DastoorPaymentCalculator: React.FC<DastoorPaymentCalculatorProps> = ({
  language,
  paymentMode,
  onPaymentModeChange,
  monthsCount,
  onMonthsCountChange,
  startMonth,
  onStartMonthChange,
  startYear,
  onStartYearChange,
  customAmount,
  onCustomAmountChange,
  fundCategory,
  onFundCategoryChange,
  contactHelpline,
  compact = false,
}) => {
  const isUr = language === 'ur';
  const currentYear = new Date().getFullYear();

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

  const period = useMemo(
    () => calculateDastoorPeriod(startMonth, startYear, monthsCount),
    [startMonth, startYear, monthsCount]
  );

  const localizeFund = (cat: FundCategory) => {
    if (!isUr) return cat;
    if (cat === 'Monthly Contribution') return 'ماہانہ دستور / چندہ';
    if (cat === 'Annual Welfare Fund') return 'سالانہ فلاحی فنڈ';
    if (cat === 'Emergency Relief') return 'ہنگامی امداد';
    if (cat === 'Zakat & Sadqah') return 'زکوٰۃ و صدقات';
    return cat;
  };

  return (
    <div className="space-y-3.5">
      {/* Mode Tabs: Monthly Dastoor (Rs. 100/Month) vs Other / Extra Fund */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl kc-tab-shell">
        <button
          type="button"
          onClick={() => {
            onPaymentModeChange('DASTOOR');
            onFundCategoryChange('Monthly Contribution');
          }}
          className={`kc-pressable py-2 px-2.5 rounded-lg text-[11px] sm:text-xs font-extrabold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            paymentMode === 'DASTOOR'
              ? 'kc-gold-button'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Coins className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {isUr ? 'ماہانہ دستور (۱۰۰ روپے/ماہ)' : 'Monthly Dastoor (Rs. 100)'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onPaymentModeChange('OTHER')}
          className={`kc-pressable py-2 px-2.5 rounded-lg text-[11px] sm:text-xs font-extrabold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            paymentMode === 'OTHER'
              ? 'kc-gold-button'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {isUr ? 'دیگر رقم / خصوصی فنڈ' : 'Other / Extra Fund'}
          </span>
        </button>
      </div>

      {paymentMode === 'DASTOOR' ? (
        <div className="space-y-3">
          {/* Official Rate Strip */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#022C22] border border-[#D4AF37]/50 text-[11px]">
            <span className="font-bold text-emerald-200">
              {isUr ? 'سرکاری ماہانہ دستور ریٹ:' : 'Official Dastoor Rate:'}
            </span>
            <span className="font-mono font-extrabold text-[#FDE047] tabular-nums">
              {isUr
                ? `۱۰۰ روپے فی مہینہ (PKR ${DASTOOR_MONTHLY_RATE})`
                : `Rs. ${DASTOOR_MONTHLY_RATE} / Month`}
            </span>
          </div>

          {/* 5 Golden Quick-Duration Buttons */}
          <div>
            <label className="text-[11px] font-bold text-[#F5D061] block mb-1.5 uppercase tracking-wider">
              {isUr ? 'مدت منتخب کریں (فوری بٹن)' : 'Quick Duration Presets'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DASTOOR_QUICK_PRESETS.map((preset) => {
                const isSelected = monthsCount === preset.months;
                return (
                  <button
                    key={preset.months}
                    type="button"
                    onClick={() => onMonthsCountChange(preset.months)}
                    className={`kc-pressable p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#FDE047] via-[#D4AF37] to-[#9A711A] border-[#FEF08A] text-[#021B14] shadow-[0_4px_14px_rgba(212,175,55,0.35)]'
                        : 'bg-[#021B14] border-[#D4AF37]/40 text-white hover:border-[#FDE047]'
                    }`}
                  >
                    <div className="text-[11px] font-extrabold leading-tight">
                      {isUr ? preset.labelUr : preset.labelEn}
                    </div>
                    <div
                      className={`text-[11px] font-mono tabular-nums font-black mt-0.5 ${
                        isSelected ? 'text-[#022C22]' : 'text-[#FDE047]'
                      }`}
                    >
                      {isUr
                        ? formatRupeesUr(preset.amount)
                        : `Rs. ${preset.amount.toLocaleString()}`}
                    </div>
                  </button>
                );
              })}

              {/* Custom Months Direct Focus Card */}
              <div className="p-2 rounded-xl border border-[#D4AF37]/45 bg-[#021B14] flex flex-col justify-between">
                <label className="text-[10px] font-bold text-[#F5D061] block leading-tight">
                  {isUr ? 'اپنی مرضی کے مہینے' : 'Custom Months'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={240}
                  inputMode="numeric"
                  value={monthsCount}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    onMonthsCountChange(Number.isFinite(parsed) && parsed > 0 ? Math.min(240, parsed) : 1);
                  }}
                  placeholder={isUr ? 'مہینے' : 'Months'}
                  className="mt-1 w-full bg-[#063B2E]/60 border border-[#D4AF37]/50 rounded-lg px-2 py-1 text-xs font-mono font-extrabold text-white tabular-nums focus:outline-none focus:border-[#FDE047]"
                />
              </div>
            </div>
          </div>

          {/* Start Month & Year Selection -> Live Covered Period */}
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

          {/* Live Calculated Summary Strip */}
          <div
            className="rounded-xl p-3 border-[1.5px] border-[#D4AF37] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            style={{
              background: 'linear-gradient(135deg, #022C22 0%, #064E3B 100%)',
            }}
          >
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#FDE047]">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {isUr
                    ? `${toUrduDigits(period.monthsCount)} مہینے × ۱۰۰ روپے`
                    : `${period.monthsCount} ${period.monthsCount === 1 ? 'Month' : 'Months'} × Rs. ${DASTOOR_MONTHLY_RATE}`}
                </span>
              </div>
              <div className="text-xs font-extrabold text-white break-words">
                {isUr ? period.periodLabelUr : period.periodLabelEn}
              </div>
              <div className="text-[10px] text-emerald-200/85">
                {isUr ? period.periodLabelEn : period.periodLabelUr}
              </div>
            </div>

            <div className="sm:text-right shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#D4AF37]/25">
              <span className="text-[10px] text-emerald-200 block uppercase font-bold">
                {isUr ? 'کل واجب الادا رقم' : 'Total Payable'}
              </span>
              <span className="text-lg font-black font-mono tabular-nums text-[#FDE047]">
                PKR {period.totalAmount.toLocaleString()}
              </span>
              <span className="block text-[11px] font-bold text-white font-urdu-auto">
                {formatRupeesUr(period.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
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
                { value: 'Annual Welfare Fund', label: localizeFund('Annual Welfare Fund') },
                { value: 'Emergency Relief', label: localizeFund('Emergency Relief') },
                { value: 'Zakat & Sadqah', label: localizeFund('Zakat & Sadqah') },
                { value: 'Monthly Contribution', label: localizeFund('Monthly Contribution') },
              ]}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-200 block mb-1.5">
              {isUr ? 'جمع شدہ رقم درج کریں (PKR)' : 'Enter Custom Amount (PKR)'}
            </label>
            <input
              type="number"
              required
              min={1}
              step="any"
              inputMode="numeric"
              placeholder={isUr ? 'مثال: 500 یا 1500 روپے' : 'e.g. 500 or 1500 PKR'}
              value={customAmount}
              onChange={(e) => onCustomAmountChange(e.target.value)}
              className="kc-luxury-input w-full text-sm font-mono tabular-nums font-bold px-3.5 py-2.5 rounded-xl"
            />
          </div>
        </div>
      )}

      {/* 1-Click Copy Emerald & Gold Admin Payment Account Card */}
      <AdminPaymentAccountCard language={language} contactHelpline={contactHelpline} />
    </div>
  );
};
