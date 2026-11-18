import type { User } from '../types';
import { resolveUserTabbar } from '../data/tabbars';

export const DASTOOR_MONTHLY_RATE = 100;
export const SALANA_ANNUAL_RATE = 1200;

export const MAHANA_QUICK_MONTHS = [1, 2, 3, 4, 6, 9, 11] as const;
export const SALANA_QUICK_YEARS = [1, 2, 3, 5, 10] as const;

export interface MonthOption {
  index: number; // 0..11
  shortEn: string;
  fullEn: string;
  fullUr: string;
}

export const MONTH_OPTIONS: MonthOption[] = [
  { index: 0, shortEn: 'Jan', fullEn: 'January', fullUr: 'جنوری' },
  { index: 1, shortEn: 'Feb', fullEn: 'February', fullUr: 'فروری' },
  { index: 2, shortEn: 'Mar', fullEn: 'March', fullUr: 'مارچ' },
  { index: 3, shortEn: 'Apr', fullEn: 'April', fullUr: 'اپریل' },
  { index: 4, shortEn: 'May', fullEn: 'May', fullUr: 'مئی' },
  { index: 5, shortEn: 'Jun', fullEn: 'June', fullUr: 'جون' },
  { index: 6, shortEn: 'Jul', fullEn: 'July', fullUr: 'جولائی' },
  { index: 7, shortEn: 'Aug', fullEn: 'August', fullUr: 'اگست' },
  { index: 8, shortEn: 'Sep', fullEn: 'September', fullUr: 'ستمبر' },
  { index: 9, shortEn: 'Oct', fullEn: 'October', fullUr: 'اکتوبر' },
  { index: 10, shortEn: 'Nov', fullEn: 'November', fullUr: 'نومبر' },
  { index: 11, shortEn: 'Dec', fullEn: 'December', fullUr: 'دسمبر' },
];

const URDU_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toUrduDigits(val: number | string): string {
  return String(val).replace(/\d/g, (d) => URDU_DIGITS[Number(d)] ?? d);
}

export function formatRupeesUr(amount: number): string {
  return `${toUrduDigits(Math.round(amount).toLocaleString('en-US'))} روپے`;
}

export interface DastoorPeriodResult {
  monthsCount: number;
  totalAmount: number;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  periodLabelEn: string;
  periodLabelUr: string;
}

export function calculateDastoorPeriod(
  startMonthIndex: number,
  startYear: number,
  rawMonthsCount: number
): DastoorPeriodResult {
  const safeMonths = Math.max(1, Math.min(240, Math.floor(rawMonthsCount || 1)));
  const safeStartMonth = ((Math.floor(startMonthIndex) % 12) + 12) % 12;
  const totalStartMonths = startYear * 12 + safeStartMonth;
  const totalEndMonths = totalStartMonths + safeMonths - 1;
  const endYear = Math.floor(totalEndMonths / 12);
  const endMonth = totalEndMonths % 12;

  const startOpt = MONTH_OPTIONS[safeStartMonth];
  const endOpt = MONTH_OPTIONS[endMonth];

  const periodLabelEn =
    safeMonths === 1
      ? `1 Month: ${startOpt.shortEn} ${startYear}`
      : `${safeMonths} Months: ${startOpt.shortEn} ${startYear} – ${endOpt.shortEn} ${endYear}`;

  const periodLabelUr =
    safeMonths === 1
      ? `۱ مہینہ: ${startOpt.fullUr} ${toUrduDigits(startYear)}`
      : `${toUrduDigits(safeMonths)} مہینے: ${startOpt.fullUr} ${toUrduDigits(startYear)} تا ${endOpt.fullUr} ${toUrduDigits(endYear)}`;

  return {
    monthsCount: safeMonths,
    totalAmount: safeMonths * DASTOOR_MONTHLY_RATE,
    startMonth: safeStartMonth,
    startYear,
    endMonth,
    endYear,
    periodLabelEn,
    periodLabelUr,
  };
}

export interface SalanaPeriodResult {
  yearsCount: number;
  monthsCount: number;
  totalAmount: number;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  periodLabelEn: string;
  periodLabelUr: string;
}

export function calculateSalanaPeriod(
  startMonthIndex: number,
  startYear: number,
  rawYearsCount: number
): SalanaPeriodResult {
  const safeYears = Math.max(1, Math.min(50, Math.floor(rawYearsCount || 1)));
  const monthsCount = safeYears * 12;
  const safeStartMonth = ((Math.floor(startMonthIndex) % 12) + 12) % 12;
  const totalStartMonths = startYear * 12 + safeStartMonth;
  const totalEndMonths = totalStartMonths + monthsCount - 1;
  const endYear = Math.floor(totalEndMonths / 12);
  const endMonth = totalEndMonths % 12;

  const startOpt = MONTH_OPTIONS[safeStartMonth];
  const endOpt = MONTH_OPTIONS[endMonth];

  const periodLabelEn = `${safeYears} ${safeYears === 1 ? 'Year' : 'Years'} (${monthsCount}M): ${startOpt.shortEn} ${startYear} – ${endOpt.shortEn} ${endYear}`;
  const periodLabelUr = `${toUrduDigits(safeYears)} ${safeYears === 1 ? 'سال' : 'سال'} (${toUrduDigits(monthsCount)} مہینے): ${startOpt.fullUr} ${toUrduDigits(startYear)} تا ${endOpt.fullUr} ${toUrduDigits(endYear)}`;

  return {
    yearsCount: safeYears,
    monthsCount,
    totalAmount: safeYears * SALANA_ANNUAL_RATE,
    startMonth: safeStartMonth,
    startYear,
    endMonth,
    endYear,
    periodLabelEn,
    periodLabelUr,
  };
}

export interface TreasuryAccountItem {
  id: string;
  methodEn: string;
  methodUr: string;
  accountTitle: string;
  accountNumber: string;
  bankOrProviderEn: string;
  bankOrProviderUr: string;
}

export const DEFAULT_TREASURY_ACCOUNTS: TreasuryAccountItem[] = [
  {
    id: 'easypaisa',
    methodEn: 'EasyPaisa',
    methodUr: 'ایزی پیسہ',
    accountTitle: 'Kifayat Connect Treasury',
    accountNumber: '03008492019',
    bankOrProviderEn: 'EasyPaisa Official Wallet',
    bankOrProviderUr: 'آفیشل ایزی پیسہ اکاؤنٹ',
  },
  {
    id: 'jazzcash',
    methodEn: 'JazzCash',
    methodUr: 'جاز کیش',
    accountTitle: 'Kifayat Connect Treasury',
    accountNumber: '03018492019',
    bankOrProviderEn: 'JazzCash Official Wallet',
    bankOrProviderUr: 'آفیشل جاز کیش اکاؤنٹ',
  },
  {
    id: 'bank',
    methodEn: 'Bank / IBAN',
    methodUr: 'بینک اکاؤنٹ / IBAN',
    accountTitle: 'Kifayat Connect Welfare Trust',
    accountNumber: 'PK42MEZN0002810104892019',
    bankOrProviderEn: 'Meezan Bank (Raast / IBFT)',
    bankOrProviderUr: 'میزان بینک (راست / آئی بی ایف ٹی)',
  },
];

export async function copyToClipboardSafe(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback for restricted Android WebView environments
  }

  try {
    if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      return copied;
    }
  } catch {
    return false;
  }
  return false;
}

export function isFaizKhelUser(
  input?:
    | (Partial<User> & { tabbarId?: string; tabbarEnglish?: string; tabbarUrdu?: string })
    | null
): boolean {
  if (!input) return false;
  const resolved = resolveUserTabbar(input);
  return resolved?.id === 'faiz_khel';
}
