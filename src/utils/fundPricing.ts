/**
 * Rukniyat Fund Pricing — single source of truth.
 *
 * Official decisions (do not change without a Founder decision):
 *  - Mahana (monthly) fund: 100 PKR per month. Selectable 1..11 months.
 *    12 months is deliberately EXCLUDED — a full year must use the Salana plan.
 *  - Salana (yearly) fund: 1,200 PKR per year. Any whole number of years
 *    (1, 2, 10, ...). Quick presets 1 / 2 / 10 years.
 *  - One-time form printing fee: 100 PKR — charged ONLY to a New Member.
 *    An Old Member (form already submitted by hand) pays the fund only.
 *
 * Amounts are always plain PKR numbers. A receipt serial number (e.g. 4200/4201)
 * is NEVER a currency amount and must never be added to these totals.
 */

export const MONTHLY_RATE_PKR = 100;
export const YEARLY_RATE_PKR = 1200;
export const FORM_PRINTING_FEE_PKR = 100;

/** Monthly selections stop at 11 — 12 months belongs to the Salana plan. */
export const MIN_MONTHS = 1;
export const MAX_MONTHS = 11;

export const MIN_YEARS = 1;
export const MAX_YEARS = 50;

export const MAHANA_QUICK_MONTHS = [1, 2, 3, 6, 9, 11] as const;
export const SALANA_QUICK_YEARS = [1, 2, 10] as const;

export type FundPlan = 'MAHANA' | 'SALANA';
/** NEW = never submitted a Rukniyat form. OLD_BY_HAND = already submitted on paper. */
export type MemberFormType = 'NEW' | 'OLD_BY_HAND';

export interface FundSelection {
  plan: FundPlan;
  months?: number;
  years?: number;
  memberType: MemberFormType;
}

export interface FundQuote {
  plan: FundPlan;
  monthsCount: number;
  yearsCount: number;
  fundAmount: number;
  printingFee: number;
  totalAmount: number;
  periodLabelEn: string;
  periodLabelUr: string;
  errors: string[];
  isValid: boolean;
}

const URDU_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toUrduDigits(input: number | string): string {
  return String(input).replace(/\d/g, (d) => URDU_DIGITS[Number(d)]);
}

export function formatPkr(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString('en-US')}`;
}

function isWholeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value);
}

/** Valid month counts: whole numbers 1..11 only (12 is rejected by design). */
export function isValidMonthCount(months: unknown): months is number {
  return isWholeNumber(months) && months >= MIN_MONTHS && months <= MAX_MONTHS;
}

/** Valid year counts: whole numbers 1..50 (1, 2, 10 and any other count allowed). */
export function isValidYearCount(years: unknown): years is number {
  return isWholeNumber(years) && years >= MIN_YEARS && years <= MAX_YEARS;
}

export function calculateFundQuote(selection: FundSelection): FundQuote {
  const errors: string[] = [];
  const memberType: MemberFormType = selection.memberType === 'OLD_BY_HAND' ? 'OLD_BY_HAND' : 'NEW';

  let monthsCount = 0;
  let yearsCount = 0;
  let fundAmount = 0;
  let periodLabelEn = '';
  let periodLabelUr = '';

  if (selection.plan === 'MAHANA') {
    const months = selection.months ?? 1;
    if (!isValidMonthCount(months)) {
      errors.push(
        `Monthly fund supports ${MIN_MONTHS} to ${MAX_MONTHS} months only. For 12 months choose the yearly fund.`
      );
    }
    monthsCount = isWholeNumber(months) ? Math.max(0, Math.min(months, MAX_MONTHS)) : 0;
    fundAmount = monthsCount * MONTHLY_RATE_PKR;
    periodLabelEn = `${monthsCount} month${monthsCount === 1 ? '' : 's'} (Mahana Fund)`;
    periodLabelUr = `${toUrduDigits(monthsCount)} ماہ (ماہانہ فنڈ)`;
  } else {
    const years = selection.years ?? 1;
    if (!isValidYearCount(years)) {
      errors.push(`Yearly fund supports ${MIN_YEARS} to ${MAX_YEARS} whole years.`);
    }
    yearsCount = isWholeNumber(years) ? Math.max(0, Math.min(years, MAX_YEARS)) : 0;
    fundAmount = yearsCount * YEARLY_RATE_PKR;
    periodLabelEn = `${yearsCount} year${yearsCount === 1 ? '' : 's'} (Salana Fund)`;
    periodLabelUr = `${toUrduDigits(yearsCount)} سال (سالانہ فنڈ)`;
  }

  const printingFee = memberType === 'NEW' ? FORM_PRINTING_FEE_PKR : 0;
  const totalAmount = fundAmount + printingFee;

  return {
    plan: selection.plan,
    monthsCount,
    yearsCount,
    fundAmount,
    printingFee,
    totalAmount,
    periodLabelEn,
    periodLabelUr,
    errors,
    isValid: errors.length === 0,
  };
}

/** The amount that must actually be received and printed on the Raseed Wasooli. */
export function receiptPayableAmount(selection: FundSelection): number {
  return calculateFundQuote(selection).totalAmount;
}

export function receiptPurposeEn(quote: FundQuote, memberType: MemberFormType): string {
  const base = `Membership fund — ${quote.periodLabelEn}`;
  return memberType === 'NEW' ? `${base} + one-time form printing fee` : base;
}

export function receiptPurposeUr(quote: FundQuote, memberType: MemberFormType): string {
  const base = `رکنیت فنڈ — ${quote.periodLabelUr}`;
  return memberType === 'NEW' ? `${base} + ایک بار فارم پرنٹنگ فیس` : base;
}
