export function normalizeCnicDigits(raw?: string | null): string {
  if (!raw) return '';
  return String(raw).replace(/\D/g, '').slice(0, 13);
}

export function isValid13DigitCnic(raw?: string | null): boolean {
  return normalizeCnicDigits(raw).length === 13;
}

export function formatCnicDisplay(raw?: string | null): string {
  const digits = normalizeCnicDigits(raw);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
}

export function getCnicLockAlertMessage(language: 'en' | 'ur'): string {
  if (language === 'ur') {
    return 'براہِ کرم درست 13 ہندسوں کا شناختی کارڈ نمبر (CNIC) درج کریں (مثلاً 00000-0000000-0)۔ 13 ہندسوں کے شناختی کارڈ کے بغیر رکنیت فارم یا فنڈ جمع نہیں ہو سکتا۔';
  }
  return 'Valid 13-digit CNIC is strictly required (e.g. 00000-0000000-0). Neither Rukniyat Form nor Fund Payments can be submitted without a 13-digit CNIC.';
}
