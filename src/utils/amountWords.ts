/**
 * Amount in words for the Raseed Wasooli.
 * The receipt always prints the figure AND the words so the amount can never be
 * confused with a serial number (4200/4201 are identifiers, not money).
 */

const ONES = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];

const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function belowThousand(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const rest = n % 10;
    return `${TENS[tens]}${rest ? `-${ONES[rest]}` : ''}`;
  }
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return `${ONES[hundreds]} Hundred${rest ? ` ${belowThousand(rest)}` : ''}`;
}

/** 0 .. 999,999,999 → English words. Non-finite input yields an empty string. */
export function numberToWordsEn(value: number): string {
  if (!Number.isFinite(value)) return '';
  const n = Math.floor(Math.abs(value));
  if (n === 0) return 'Zero';

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${belowThousand(crore)} Crore`);
  if (lakh) parts.push(`${belowThousand(lakh)} Lakh`);
  if (thousand) parts.push(`${belowThousand(thousand)} Thousand`);
  if (rest) parts.push(belowThousand(rest));

  return parts.join(' ');
}

/** "Rupees One Thousand Three Hundred Only" — the receipt's رقم بالفاظ line. */
export function rupeesInWordsEn(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  return `Rupees ${numberToWordsEn(safe)} Only`;
}

const URDU_ONES = [
  'صفر', 'ایک', 'دو', 'تین', 'چار', 'پانچ', 'چھ', 'سات', 'آٹھ', 'نو',
  'دس', 'گیارہ', 'بارہ', 'تیرہ', 'چودہ', 'پندرہ', 'سولہ', 'سترہ', 'اٹھارہ', 'انیس',
];
const URDU_TENS = ['', '', 'بیس', 'تیس', 'چالیس', 'پچاس', 'ساٹھ', 'ستر', 'اسی', 'نوے'];

function belowThousandUr(n: number): string {
  if (n === 0) return '';
  if (n < 20) return URDU_ONES[n];
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const rest = n % 10;
    return `${URDU_TENS[tens]}${rest ? ` ${URDU_ONES[rest]}` : ''}`;
  }
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return `${URDU_ONES[hundreds]} سو${rest ? ` ${belowThousandUr(rest)}` : ''}`;
}

/** Urdu words for the amount, e.g. "روپے ایک ہزار تین سو". */
export function rupeesInWordsUr(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  if (safe === 0) return 'روپے صفر';

  const lakh = Math.floor(safe / 100000);
  const thousand = Math.floor((safe % 100000) / 1000);
  const rest = safe % 1000;

  const parts: string[] = [];
  if (lakh) parts.push(`${belowThousandUr(lakh)} لاکھ`);
  if (thousand) parts.push(`${belowThousandUr(thousand)} ہزار`);
  if (rest) parts.push(belowThousandUr(rest));

  return `روپے ${parts.join(' ')}`;
}
