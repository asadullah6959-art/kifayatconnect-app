import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '25mb' }));

  const SERVER_BOOT_BUILD_ID = new Date().toISOString();

  const readLiveVersionManifest = () => {
    if (!IS_PROD) {
      return {
        version: '1.0.0',
        buildId: 'dev',
        builtAt: SERVER_BOOT_BUILD_ID,
        otaEnabled: false,
      };
    }
    const candidates = [
      path.resolve(__dirname, 'dist', 'version.json'),
      path.resolve(__dirname, 'public', 'version.json'),
    ];
    for (const filePath of candidates) {
      try {
        if (fs.existsSync(filePath)) {
          const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          if (parsed && typeof parsed === 'object') {
            return {
              version: String(parsed.version || '1.0.0'),
              buildId: String(parsed.buildId || SERVER_BOOT_BUILD_ID),
              builtAt: String(parsed.builtAt || SERVER_BOOT_BUILD_ID),
              otaEnabled: true,
            };
          }
        }
      } catch {
        // fallback to next candidate
      }
    }
    return {
      version: '1.0.0',
      buildId: SERVER_BOOT_BUILD_ID,
      builtAt: SERVER_BOOT_BUILD_ID,
      otaEnabled: true,
    };
  };

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'sui-khel-ittehad-server' });
  });

  app.get('/api/version', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json(readLiveVersionManifest());
  });

  app.get('/version.json', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json(readLiveVersionManifest());
  });

  app.post('/api/scan-paper-form', async (req, res) => {
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        success: false,
        code: 'SCAN_UNAVAILABLE',
        error: 'AI paper scan is not configured on this server. Please use manual entry.',
      });
      return;
    }

    const body = req.body as {
      imageDataUrl?: string;
      imageBase64?: string;
      mimeType?: string;
      formType?: 'RUKNIYAT' | 'RASEED' | 'AUTO';
    };

    let mimeType = '';
    let base64Data = '';

    const rawDataUrl = typeof body?.imageDataUrl === 'string' ? body.imageDataUrl.trim() : '';
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(rawDataUrl);
    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    } else if (typeof body?.imageBase64 === 'string' && body.imageBase64.trim()) {
      base64Data = body.imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '').trim();
      mimeType = typeof body?.mimeType === 'string' && body.mimeType.startsWith('image/')
        ? body.mimeType
        : 'image/jpeg';
    }

    if (!base64Data || !mimeType) {
      res.status(400).json({
        success: false,
        code: 'INVALID_IMAGE',
        error: 'Please upload a valid JPG, PNG, or WEBP paper form photo.',
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const prompt = [
        'You are a high-precision bilingual (Urdu Nastaliq & English) OCR assistant for "سوئی خیل اتحاد / SUI KHEL ITTEHAD / SUI KHEL ITTEHAD".',
        'CRITICAL RULE: Even if this image is blurry, dark, low-resolution, shadowed, faded, rotated, or taken on an old phone camera, NEVER refuse or ask for a clearer photo. Carefully decipher every visible Urdu Nastaliq and English word, handwritten pen ink, stamp, number, CNIC, phone number, Tabar, district, date, and amount, and return the JSON so all fields auto-fill into the form boxes below.',
        'Use the exact spatial layout map of our paper "رکنیت فارم - سوئی خیل اتحاد" (Rukniyat Form) OR "رسید وصولی - سوئی خیل اتحاد" (Raseed Wasooli Receipt).',
        'Convert any Urdu/Arabic-Indic numerals (۰-۹, ٠-٩) into ASCII digits (0-9).',
        'EXACT SPATIAL & FIELD MAP (RUKNIYAT FORM & RASEED WASOOLI):',
        'Top Meta Row: date (تاریخ, prefer YYYY-MM-DD), serialNo (رکنیت نمبر / سیریل نمبر), oldReceiptSerialNo (رسید نمبر — e.g. printed black receipt serial number like 4200), district (یونٹ / ضلع out of Pakistan districts), unit (یونٹ).',
        'Row 1 (ذاتی معلومات / رسید وصولی): name (نام / محترم جناب / صاحب کی جانب سے), fatherName (ولد), contactNumber (رابطہ نمبر).',
        'Row 2: education (تعلیم), experience (تجربہ), profession (پیشہ / روزگار).',
        'Row 3: maritalStatus (ازدواجی حیثیت -> "Married", "Single", or "Widowed"), currentArea (موجودہ علاقہ), ancestralArea (آبائی علاقہ (کند بائیں)).',
        'Row 4: dob (تاریخ پیدائش, prefer YYYY-MM-DD), age (عمر, numeric string), cnic (شناختی کارڈ نمبر — EXACTLY 13 digits stripped of all dashes, e.g. 3520112345671).',
        'Row 5: tabar (مرکزی خاندان (ٹبر) — match to one of the 11 clans if visible: Faiz Khel, Swati Khel, Rousa Khel, Malkhan Khel, Surjam Khel, Akhar Khel, Ulbaik Khel, Hakidad Khel, Zinwar Khel, Mir Baz Khel, Chharo Khel), subBranch (ذیلی شاخ (ٹبر)), representative (نمائندہ خاندان (ٹبر)).',
        'Row 6 & 7: currentAddress (موجودہ پتہ), permanentAddress (مستقل پتہ).',
        'Bottom (عہد نامہ / تصدیق / دفتری کارروائی / رسید وصولی): amount (مبلغ / روپے / وصول پائے / ماہانہ تعاون مبلغ / فارم فیس in PKR, numeric 0 if blank), representativeName (نام نمائندہ / دستخط وصول کنندہ).',
        'Also extract stateProvince if mentioned. Perform maximum best-effort OCR on every visible handwritten or printed line; return empty string (or 0 for amount) only if a field box on the paper is completely blank.',
      ].join('\n');

      const requestConfig = {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            serialNo: { type: Type.STRING },
            oldReceiptSerialNo: { type: Type.STRING },
            unit: { type: Type.STRING },
            district: { type: Type.STRING },
            stateProvince: { type: Type.STRING },
            name: { type: Type.STRING },
            fatherName: { type: Type.STRING },
            contactNumber: { type: Type.STRING },
            email: { type: Type.STRING },
            education: { type: Type.STRING },
            experience: { type: Type.STRING },
            profession: { type: Type.STRING },
            maritalStatus: { type: Type.STRING },
            currentArea: { type: Type.STRING },
            ancestralArea: { type: Type.STRING },
            dob: { type: Type.STRING },
            age: { type: Type.STRING },
            cnic: { type: Type.STRING },
            tabar: { type: Type.STRING },
            subBranch: { type: Type.STRING },
            representative: { type: Type.STRING },
            currentAddress: { type: Type.STRING },
            permanentAddress: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            representativeName: { type: Type.STRING },
          },
        },
      };

      const requestContents = {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
        ],
      };

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: requestContents,
          config: requestConfig,
        });
      } catch (primaryErr: unknown) {
        const msg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
        const shouldFallback = /not found|404|unsupported|not available|model/i.test(msg);
        if (!shouldFallback) {
          throw primaryErr;
        }
        response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: requestContents,
          config: requestConfig,
        });
      }

      const extractJsonObject = (raw: string): Record<string, unknown> => {
        const cleaned = raw
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/```$/i, '')
          .trim();

        const tryParse = (candidate: string): unknown => {
          try {
            return JSON.parse(candidate);
          } catch {
            return null;
          }
        };

        let parsedVal = tryParse(cleaned);
        if (!parsedVal) {
          const firstBrace = cleaned.indexOf('{');
          const lastBrace = cleaned.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace > firstBrace) {
            parsedVal = tryParse(cleaned.slice(firstBrace, lastBrace + 1));
          }
        }
        if (Array.isArray(parsedVal)) {
          parsedVal = parsedVal[0] ?? {};
        }
        if (parsedVal && typeof parsedVal === 'object') {
          const rec = parsedVal as Record<string, unknown>;
          const nested = rec.data || rec.fields || rec.result || rec.form;
          if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
            return nested as Record<string, unknown>;
          }
          return rec;
        }
        return {};
      };

      const rawText = (response.text || '{}').trim();
      const parsed = extractJsonObject(rawText);

      // Flexible bilingual English & Urdu key-mapper
      const normKeyMap = new Map<string, unknown>();
      for (const [k, v] of Object.entries(parsed)) {
        normKeyMap.set(k.trim().toLowerCase(), v);
      }
      const pick = (...keys: string[]): unknown => {
        for (const k of keys) {
          const direct = parsed[k];
          if (direct !== undefined && direct !== null && String(direct).trim() !== '') {
            return direct;
          }
          const matched = normKeyMap.get(k.trim().toLowerCase());
          if (matched !== undefined && matched !== null && String(matched).trim() !== '') {
            return matched;
          }
        }
        return '';
      };

      const toAsciiDigits = (v: unknown) =>
        String(v ?? '')
          .replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660))
          .replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
          .trim();

      const rawCnic = pick('cnic', 'nic', 'idCard', 'شناختی کارڈ نمبر', 'شناختی کارڈ');
      const cnicStripped = toAsciiDigits(rawCnic).replace(/\D/g, '').slice(0, 13);

      const rawAmount = pick(
        'amount',
        'monthlyPledgeAmount',
        'fee',
        'مبلغ',
        'رقم',
        'روپے',
        'وصول پائے'
      );
      const numericAmount =
        typeof rawAmount === 'number' && Number.isFinite(rawAmount)
          ? Math.max(0, rawAmount)
          : Number(toAsciiDigits(rawAmount).replace(/\D/g, '')) || 0;

      const serialNo = toAsciiDigits(
        pick('serialNo', 'oldMembershipNo', 'membershipNo', 'serialNumber', 'رکنیت نمبر', 'رکنیت / سیریل نمبر', 'سیریل نمبر')
      );
      const oldReceiptSerialNo = toAsciiDigits(
        pick('oldReceiptSerialNo', 'receiptNo', 'receiptNumber', 'رسید نمبر', 'رسید')
      );
      const nameVal = String(
        pick('name', 'applicantName', 'fullName', 'memberName', 'نام', 'مکمل نام', 'محترم جناب', 'صاحب کی جانب سے')
      ).trim();
      const fatherNameVal = String(pick('fatherName', 'father', 'sonOf', 'ولد', 'ولدیت')).trim();
      const contactVal = toAsciiDigits(
        pick('contactNumber', 'phone', 'mobile', 'mobileNumber', 'contact', 'رابطہ نمبر', 'فون', 'موبائل نمبر')
      );
      const currentAddrVal = String(
        pick('currentAddress', 'address', 'presentAddress', 'موجودہ پتہ', 'پتہ')
      ).trim();
      const permAddrVal = String(pick('permanentAddress', 'مستقل پتہ')).trim();
      const repVal = String(
        pick('representative', 'tabarRep', 'نمائندہ خاندان', 'نمائندہ خاندان (ٹبر)')
      ).trim();
      const repNameVal = String(
        pick('representativeName', 'tabarRepName', 'نام نمائندہ')
      ).trim();

      const extractedFields = {
        // Exact Rukniyat Spatial Map Keys
        date: toAsciiDigits(pick('date', 'formDate', 'تاریخ')),
        serialNo,
        district: String(pick('district', 'ضلع')).trim(),
        stateProvince: String(pick('stateProvince', 'province', 'صوبہ')).trim(),
        unit: String(pick('unit', 'یونٹ')).trim(),
        name: nameVal,
        fatherName: fatherNameVal,
        contactNumber: contactVal,
        email: String(pick('email', 'ای میل')).trim(),
        education: String(pick('education', 'qualification', 'تعلیم')).trim(),
        experience: String(pick('experience', 'تجربہ')).trim(),
        profession: String(pick('profession', 'occupation', 'job', 'پیشہ', 'پیشہ / روزگار', 'روزگار')).trim(),
        maritalStatus: String(pick('maritalStatus', 'marital', 'ازدواجی حیثیت')).trim(),
        currentArea: String(pick('currentArea', 'area', 'موجودہ علاقہ', 'علاقہ')).trim(),
        ancestralArea: String(pick('ancestralArea', 'nativeArea', 'آبائی علاقہ', 'آبائی علاقہ (کند بائیں)')).trim(),
        dob: toAsciiDigits(pick('dob', 'dateOfBirth', 'birthDate', 'تاریخ پیدائش')),
        age: toAsciiDigits(pick('age', 'عمر')).replace(/\D/g, '').slice(0, 3),
        cnic: cnicStripped,
        tabar: String(pick('tabar', 'tabbar', 'clan', 'مرکزی خاندان', 'مرکزی خاندان (ٹبر)', 'ٹبر')).trim(),
        subBranch: String(pick('subBranch', 'subTabbar', 'ذیلی شاخ', 'ذیلی شاخ (ٹبر)')).trim(),
        representative: repVal,
        currentAddress: currentAddrVal,
        permanentAddress: permAddrVal,
        amount: numericAmount,
        representativeName: repNameVal,
        // Legacy / Cross-Modal Compatibility Aliases
        oldMembershipNo: serialNo,
        oldReceiptSerialNo,
        applicantName: nameVal,
        phone: contactVal,
        address: currentAddrVal,
        tabarRepName: repNameVal || repVal,
        monthlyPledgeAmount: numericAmount,
      };

      res.json({
        success: true,
        fields: extractedFields,
        data: extractedFields,
      });
    } catch (err: unknown) {
      console.warn('Paper form scan failed:', err);
      const detail = err instanceof Error && err.message ? err.message : '';
      res.status(502).json({
        success: false,
        code: 'SCAN_FAILED',
        error: detail
          ? `AI scan encountered an error: ${detail}`
          : 'Photo enhanced and attached. You can review or enter fields manually below.',
      });
    }
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(
      express.static(distDir, {
        setHeaders(res, filePath) {
          if (
            filePath.endsWith('index.html') ||
            filePath.endsWith('sw.js') ||
            filePath.endsWith('version.json')
          ) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SUI KHEL ITTEHAD server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
