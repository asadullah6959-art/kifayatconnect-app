import { GoogleGenAI } from '@google/genai';
import { TABBAR_CLANS, transliterateTabbarToUrdu } from '../data/tabbars';
import { PROVINCES_DATA } from '../data/locationData';
import type { RukniyatFormValues } from '../components/documents/RukniyatFormDocument';

/**
 * AI Camera & Photo Form Scanner — reads a photo of the paper رکنیت فارم and
 * returns a patch for the digital form below.
 *
 * Design rules that keep this reliable:
 *  - Every photo is downscaled + brightened + contrast-lifted on a canvas BEFORE
 *    the network call, so dim / faded / blurry phone shots become legible and a
 *    4K 50 MB shot becomes a ~1800 px JPEG instead of a rejected upload.
 *  - A scan is retried with stronger enhancement if the first pass reads nothing.
 *  - Nothing here rejects a photo for "quality": if text cannot be read we return
 *    what we have and say so plainly, never a dead end.
 */

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const ENHANCE_MAX_DIMENSION = 1800;
export const PRIMARY_MODEL = 'gemini-2.5-flash';
const MODEL_CHAIN = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

/** Raised when no API key is configured anywhere — a setup issue, not a photo issue. */
export class ScannerConfigError extends Error {
  constructor(message = 'Scanner is not configured') {
    super(message);
    this.name = 'ScannerConfigError';
  }
}

export interface EnhancedPhoto {
  dataUrl: string;
  base64: string;
  mimeType: string;
  width: number;
  height: number;
}

export interface ScanDetected {
  serialNo: string;
  amount: string;
  clanRaw: string;
  clanMatched: string;
  districtRaw: string;
  districtMatched: string;
}

export interface ScanResult {
  patch: Partial<RukniyatFormValues>;
  detected: ScanDetected;
  filledCount: number;
  attempts: number;
  model: string;
  enhanced: EnhancedPhoto;
}

/* ------------------------------------------------------------------ */
/* Image handling                                                      */
/* ------------------------------------------------------------------ */

/** `data:image/jpeg;base64,XXXX` -> `XXXX` (plus the mime type). */
export function stripDataUrlPrefix(dataUrl: string): { base64: string; mimeType: string } {
  const value = (dataUrl || '').trim();
  const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(value);
  if (match) {
    return { mimeType: match[1] || 'image/jpeg', base64: (match[3] || '').replace(/\s+/g, '') };
  }
  return { mimeType: 'image/jpeg', base64: value.replace(/\s+/g, '') };
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
    } catch {
      /* fall through to <img> */
    }
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('This photo could not be opened'));
      img.src = objectUrl;
    });
    return image;
  } finally {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
  }
}

/**
 * Downscale to ENHANCE_MAX_DIMENSION and lift brightness/contrast so faded pen
 * ink and dim indoor shots become readable. Very dark photos get an extra lift.
 */
export async function enhancePhoto(
  file: File,
  opts?: { brightness?: number; contrast?: number }
): Promise<EnhancedPhoto> {
  const bitmap = await loadBitmap(file);
  const sourceWidth = 'width' in bitmap ? bitmap.width : 0;
  const sourceHeight = 'height' in bitmap ? bitmap.height : 0;
  if (!sourceWidth || !sourceHeight) throw new Error('This photo could not be opened');

  const scale = Math.min(1, ENHANCE_MAX_DIMENSION / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas is unavailable in this browser');

  const brightness = opts?.brightness ?? 1.18;
  const contrast = opts?.contrast ?? 1.45;

  const paint = (b: number, c: number) => {
    ctx.filter = 'none';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.filter = `brightness(${b}) contrast(${c})`;
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, width, height);
    ctx.filter = 'none';
  };

  paint(brightness, contrast);

  // Adaptive lift: a photo whose average luminance is very low gets more help.
  try {
    const { data } = ctx.getImageData(0, 0, width, height);
    let sum = 0;
    let samples = 0;
    const step = Math.max(4, Math.floor(data.length / 4 / 12000)) * 4;
    for (let i = 0; i < data.length; i += step) {
      sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      samples += 1;
    }
    const mean = samples ? sum / samples : 128;
    if (mean < 105) paint(brightness * 1.14, contrast * 1.04);
  } catch {
    /* getImageData can be blocked; the first pass already applied enhancement */
  }

  if ('close' in bitmap && typeof bitmap.close === 'function') bitmap.close();

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const { base64, mimeType } = stripDataUrlPrefix(dataUrl);
  return { dataUrl, base64, mimeType, width, height };
}

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

const URDU_DIGIT_SET = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGIT_SET = '٠١٢٣٤٥٦٧٨٩';

export function toAsciiDigits(value: string): string {
  return (value || '')
    .replace(/[۰-۹]/g, d => String(URDU_DIGIT_SET.indexOf(d)))
    .replace(/[٠-٩]/g, d => String(ARABIC_DIGIT_SET.indexOf(d)));
}

function normalizeLatin(value: string): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function normalizeUrdu(value: string): string {
  return (value || '')
    .replace(/[\u200b-\u200f\u064b-\u0652]/g, '')
    .replace(/[^\u0600-\u06ff]/g, '');
}

function normalizeKey(value: string): string {
  return (value || '')
    .toString()
    .toLowerCase()
    .replace(/[\s_\-–—/\\.,:;()"'[\]{}|]+/g, '')
    .trim();
}

/* ------------------------------------------------------------------ */
/* Clan + district matching against the app's own data                 */
/* ------------------------------------------------------------------ */

export function matchClan(raw: string): { englishName: string; urduName: string } | null {
  const value = (raw || '').trim();
  if (!value) return null;
  const latin = normalizeLatin(value);
  const urdu = normalizeUrdu(value);

  for (const clan of TABBAR_CLANS) {
    if (latin && (normalizeLatin(clan.englishName) === latin || normalizeLatin(clan.id) === latin)) {
      return { englishName: clan.englishName, urduName: clan.urduName };
    }
    if (urdu && normalizeUrdu(clan.urduName) === urdu) {
      return { englishName: clan.englishName, urduName: clan.urduName };
    }
  }
  for (const clan of TABBAR_CLANS) {
    if (latin.length >= 4 && normalizeLatin(clan.englishName).includes(latin)) {
      return { englishName: clan.englishName, urduName: clan.urduName };
    }
    if (urdu.length >= 3 && normalizeUrdu(clan.urduName).includes(urdu)) {
      return { englishName: clan.englishName, urduName: clan.urduName };
    }
  }
  return null;
}

interface DistrictHit {
  name: string;
  province: string;
}

let districtIndexCache: Array<{ key: string; hit: DistrictHit }> | null = null;

function districtIndex(): Array<{ key: string; hit: DistrictHit }> {
  if (districtIndexCache) return districtIndexCache;
  const list: Array<{ key: string; hit: DistrictHit }> = [];
  Object.values(PROVINCES_DATA).forEach(province => {
    (province?.districts || []).forEach(district => {
      if (district?.name) list.push({ key: normalizeLatin(district.name), hit: { name: district.name, province: province.name } });
    });
  });
  districtIndexCache = list;
  return list;
}

export function matchDistrict(raw: string): DistrictHit | null {
  const value = (raw || '').trim();
  if (!value) return null;
  const key = normalizeLatin(value);
  if (!key) return null;
  const list = districtIndex();
  const exact = list.find(entry => entry.key === key);
  if (exact) return exact.hit;
  if (key.length >= 4) {
    const partial = list.find(entry => entry.key.includes(key) || key.includes(entry.key));
    if (partial) return partial.hit;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Field extraction                                                    */
/* ------------------------------------------------------------------ */

const FIELD_ALIASES: Record<string, string[]> = {
  applicantName: ['name', 'applicantname', 'fullname', 'applicant', 'نام', 'اسم', 'پورا نام'],
  fatherName: ['fathername', 'father', 'guardianname', 'ولد', 'والد', 'ولد کا نام'],
  phone: ['contactnumber', 'phone', 'phonenumber', 'phoneno', 'mobile', 'contact', 'رابطہ نمبر', 'فون', 'موبائل'],
  cnic: ['cnic', 'cnicnumber', 'nic', 'nicnumber', 'idcard', 'شناختی کارڈ نمبر', 'شناختی کارڈ', 'قومی شناختی کارڈ'],
  centralClan: ['tabar', 'tabbar', 'centralclan', 'clan', 'tribe', 'مرکزی خاندان', 'ٹبر', 'تبر', 'خاندان'],
  subBranch: ['subbranch', 'branch', 'subclan', 'ذیلی شاخ', 'شاخ'],
  clanRep: ['representative', 'clanrepresentative', 'representativename', 'نمائندہ', 'نمائندہ خاندان'],
  district: ['district', 'unit', 'districtname', 'یونٹ', 'ضلع', 'یونٹضلع'],
  date: ['date', 'formdate', 'تاریخ'],
  serialNo: ['serialno', 'serial', 'serialnumber', 'membershipno', 'membershipnumber', 'receiptno', 'receiptnumber', 'رکنیت نمبر', 'رسید نمبر', 'سیریل نمبر'],
  amount: ['amount', 'paidamount', 'payment', 'paymentamount', 'fund', 'مبلغ', 'رقم', 'مبلغرقم'],
  currentAddress: ['currentaddress', 'presentaddress', 'موجودہ پتہ', 'حالیہ پتہ'],
  permanentAddress: ['permanentaddress', 'address', 'مستقل پتہ', 'پتہ'],
  education: ['education', 'تعلیم'],
  profession: ['profession', 'occupation', 'پیشہ', 'روزگار'],
  experience: ['experience', 'تجربہ'],
  maritalStatus: ['maritalstatus', 'ازدواجی حیثیت'],
  currentArea: ['currentarea', 'موجودہ علاقہ'],
  ancestralArea: ['ancestralarea', 'آبائی علاقہ'],
  dob: ['dob', 'dateofbirth', 'تاریخ پیدائش'],
  age: ['age', 'عمر'],
};

function readField(source: Record<string, unknown>, aliases: string[]): string {
  const entries = Object.entries(source);
  for (const alias of aliases.map(normalizeKey)) {
    for (const [key, value] of entries) {
      if (normalizeKey(key) !== alias) continue;
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    }
  }
  return '';
}

function pad(value: string): string {
  return value.padStart(2, '0');
}

export function normalizeDateValue(raw: string): string {
  const value = toAsciiDigits(raw || '').trim();
  if (!value) return '';
  const iso = /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(value);
  if (iso) return `${iso[1]}-${pad(iso[2])}-${pad(iso[3])}`;
  const dmy = /(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/.exec(value);
  if (dmy) {
    let year = dmy[3];
    if (year.length === 2) year = `${Number(year) > 40 ? '19' : '20'}${year}`;
    return `${year}-${pad(dmy[2])}-${pad(dmy[1])}`;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

export function normalizeCnicValue(raw: string): string {
  let digits = toAsciiDigits(raw || '').replace(/\D+/g, '');
  if (digits.length === 15 && digits.startsWith('92')) digits = digits.slice(2);
  if (digits.length === 14 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.length === 13 ? digits : '';
}

export function normalizeAmountValue(raw: string): string {
  const digits = toAsciiDigits(raw || '').replace(/[^0-9.]/g, '');
  if (!digits) return '';
  const amount = Number(digits);
  return Number.isFinite(amount) && amount > 0 ? String(Math.round(amount)) : '';
}

export function buildFormPatch(raw: unknown): {
  patch: Partial<RukniyatFormValues>;
  detected: ScanDetected;
  filledCount: number;
} {
  const empty = {
    patch: {} as Partial<RukniyatFormValues>,
    detected: { serialNo: '', amount: '', clanRaw: '', clanMatched: '', districtRaw: '', districtMatched: '' } as ScanDetected,
    filledCount: 0,
  };
  if (!raw || typeof raw !== 'object') return empty;

  const root = raw as Record<string, unknown>;
  const nested = (root.fields ?? root.data ?? root.result) as Record<string, unknown> | undefined;
  const source: Record<string, unknown> = nested && typeof nested === 'object' ? { ...root, ...nested } : root;

  const patch: Partial<RukniyatFormValues> = {};
  const detected: ScanDetected = { serialNo: '', amount: '', clanRaw: '', clanMatched: '', districtRaw: '', districtMatched: '' };

  const name = readField(source, FIELD_ALIASES.applicantName);
  if (name) patch.applicantName = name;

  const father = readField(source, FIELD_ALIASES.fatherName);
  if (father) patch.fatherName = father;

  const phone = readField(source, FIELD_ALIASES.phone);
  if (phone) patch.phone = toAsciiDigits(phone).replace(/[^\d+]/g, '');

  const cnic = normalizeCnicValue(readField(source, FIELD_ALIASES.cnic));
  if (cnic) patch.cnic = cnic;

  const clanRaw = readField(source, FIELD_ALIASES.centralClan);
  detected.clanRaw = clanRaw;
  if (clanRaw) {
    const clan = matchClan(clanRaw);
    if (clan) {
      patch.centralClan = clan.urduName;
      patch.centralClanEn = clan.englishName;
      detected.clanMatched = clan.englishName;
    } else if (/[\u0600-\u06ff]/.test(clanRaw)) {
      patch.centralClan = clanRaw;
    } else {
      patch.centralClanEn = clanRaw;
      try {
        const urdu = transliterateTabbarToUrdu(clanRaw);
        if (urdu) patch.centralClan = urdu;
      } catch {
        /* keep the English value only */
      }
    }
  }

  const subBranch = readField(source, FIELD_ALIASES.subBranch);
  if (subBranch) {
    if (/[\u0600-\u06ff]/.test(subBranch)) patch.subBranch = subBranch;
    else patch.subBranchEn = subBranch;
  }

  const rep = readField(source, FIELD_ALIASES.clanRep);
  if (rep) patch.clanRepName = rep;

  const districtRaw = readField(source, FIELD_ALIASES.district);
  detected.districtRaw = districtRaw;
  if (districtRaw) {
    const hit = matchDistrict(districtRaw);
    if (hit) {
      patch.unit = hit.name;
      detected.districtMatched = hit.name;
    } else {
      patch.unit = districtRaw;
    }
  }

  const date = normalizeDateValue(readField(source, FIELD_ALIASES.date));
  if (date) patch.formDate = date;

  detected.serialNo = readField(source, FIELD_ALIASES.serialNo);
  detected.amount = normalizeAmountValue(readField(source, FIELD_ALIASES.amount));

  const currentAddress = readField(source, FIELD_ALIASES.currentAddress);
  if (currentAddress) patch.currentAddress = currentAddress;

  const permanentAddress = readField(source, FIELD_ALIASES.permanentAddress);
  if (permanentAddress) patch.permanentAddress = permanentAddress;

  const education = readField(source, FIELD_ALIASES.education);
  if (education) patch.education = education;

  const profession = readField(source, FIELD_ALIASES.profession);
  if (profession) patch.profession = profession;

  const experience = readField(source, FIELD_ALIASES.experience);
  if (experience) patch.experience = experience;

  const maritalStatus = readField(source, FIELD_ALIASES.maritalStatus);
  if (maritalStatus) patch.maritalStatus = maritalStatus;

  const currentArea = readField(source, FIELD_ALIASES.currentArea);
  if (currentArea) patch.currentArea = currentArea;

  const ancestralArea = readField(source, FIELD_ALIASES.ancestralArea);
  if (ancestralArea) patch.ancestralArea = ancestralArea;

  const dob = normalizeDateValue(readField(source, FIELD_ALIASES.dob));
  if (dob) patch.dob = dob;

  const age = toAsciiDigits(readField(source, FIELD_ALIASES.age)).replace(/\D+/g, '');
  if (age) patch.age = age;

  const filledCount = Object.values(patch).filter(value => typeof value === 'string' && value.trim()).length;
  return { patch, detected, filledCount };
}

/* ------------------------------------------------------------------ */
/* Gemini call                                                         */
/* ------------------------------------------------------------------ */

const FORM_PROMPT = `You are an OCR engine reading a photograph of a printed Urdu/English membership form (رکنیت فارم) of "سوئی خیل قومی اتحاد" / Sui Khel Qaumi Ittehad.

Return ONLY a JSON object. No markdown, no commentary.

Use EXACTLY these keys (English key, then the same value under the Urdu key). Use "" when a field is not visible — never guess or invent:

{
  "name": "", "نام": "",
  "fatherName": "", "ولد": "",
  "contactNumber": "", "رابطہ نمبر": "",
  "cnic": "", "شناختی کارڈ نمبر": "",
  "tabar": "", "مرکزی خاندان": "",
  "subBranch": "", "ذیلی شاخ": "",
  "representative": "", "نمائندہ": "",
  "district": "", "یونٹ": "",
  "date": "", "تاریخ": "",
  "serialNo": "", "رکنیت نمبر": "",
  "amount": "", "مبلغ": "",
  "currentAddress": "", "موجودہ پتہ": "",
  "permanentAddress": "", "مستقل پتہ": ""
}

Rules:
- "cnic": 13 digits only, no dashes.
- "date": YYYY-MM-DD.
- "serialNo": the membership/receipt number PRINTED on the paper. It is an identifier, never a money amount.
- "amount": money in PKR only, digits only, no currency symbol. Empty if no amount is written.
- Handwriting may be faded, tilted or in dim light: read it as best you can and keep going.`;

function resolveApiKey(): string {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string> })?.env || {};
    const viteKey = env.VITE_GEMINI_API_KEY || env.VITE_API_KEY || '';
    if (viteKey) return String(viteKey).trim();
  } catch {
    /* import.meta.env unavailable */
  }
  try {
    if (typeof process !== 'undefined' && process?.env) {
      return String(process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
    }
  } catch {
    /* process unavailable in the browser */
  }
  return '';
}

function extractText(response: unknown): string {
  const anyResponse = response as any;
  if (typeof anyResponse?.text === 'string') return anyResponse.text;
  if (typeof anyResponse?.text === 'function') {
    try {
      const value = anyResponse.text();
      if (typeof value === 'string') return value;
    } catch {
      /* fall through to candidates */
    }
  }
  const parts = anyResponse?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) return parts.map((part: any) => (typeof part?.text === 'string' ? part.text : '')).join('');
  return '';
}

async function callGeminiDirect(
  apiKey: string,
  model: string,
  mimeType: string,
  base64: string,
  hint: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: 'user',
        parts: [{ text: `${FORM_PROMPT}${hint}` }, { inlineData: { mimeType, data: base64 } }],
      },
    ],
    config: { responseMimeType: 'application/json', temperature: 0 },
  });
  return extractText(response);
}

/** Same-origin proxy so a server-side GEMINI_API_KEY can be used without exposing it. */
async function callGeminiProxy(mimeType: string, base64: string, hint: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch('/api/scan-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mimeType, data: base64, hint }),
    });
  } catch {
    throw new ScannerConfigError('Scanner is not configured');
  }
  if (response.status === 501 || response.status === 503) throw new ScannerConfigError('Scanner is not configured');
  if (!response.ok) throw new Error('The scanner service did not answer');
  const payload = await response.json().catch(() => null);
  if (typeof payload?.text === 'string') return payload.text;
  if (payload?.result) return JSON.stringify(payload.result);
  return '';
}

export function parseJsonLoose(text: string): Record<string, unknown> | null {
  if (!text) return null;
  let value = text.trim();
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(value);
  if (fenced) value = fenced[1].trim();
  const start = value.indexOf('{');
  const end = value.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(value.slice(start, end + 1));
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Enhance + read one photo. Retries with stronger enhancement when the first
 * pass finds nothing, so a dim or soft photo still produces fields.
 */
export async function scanFormPhoto(
  file: File,
  opts?: { onEnhanced?: (dataUrl: string) => void; onStage?: (stage: 'enhance' | 'read' | 'retry') => void }
): Promise<ScanResult> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('TOO_LARGE');
  }

  const passes = [
    { brightness: 1.18, contrast: 1.45, hint: '' },
    {
      brightness: 1.34,
      contrast: 1.64,
      hint: '\nThis photo is dim or soft: read every stroke carefully, including faded handwriting.',
    },
  ];

  let best: ScanResult | null = null;

  for (let index = 0; index < passes.length; index += 1) {
    opts?.onStage?.(index === 0 ? 'enhance' : 'retry');
    const enhanced = await enhancePhoto(file, passes[index]);
    if (index === 0) opts?.onEnhanced?.(enhanced.dataUrl);

    opts?.onStage?.('read');
    let text = '';
    let usedModel = PRIMARY_MODEL;

    const apiKey = resolveApiKey();
    if (apiKey) {
      let lastError: unknown = null;
      for (const model of MODEL_CHAIN) {
        try {
          text = await callGeminiDirect(apiKey, model, enhanced.mimeType, enhanced.base64, passes[index].hint);
          usedModel = model;
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (lastError) throw lastError;
    } else {
      text = await callGeminiProxy(enhanced.mimeType, enhanced.base64, passes[index].hint);
    }

    const parsed = parseJsonLoose(text);
    const built = buildFormPatch(parsed);
    const result: ScanResult = {
      patch: built.patch,
      detected: built.detected,
      filledCount: built.filledCount,
      attempts: index + 1,
      model: usedModel,
      enhanced,
    };

    if (!best || result.filledCount > best.filledCount) best = result;
    if (best.filledCount >= 3) return best;
  }

  return best as ScanResult;
}
