import express from 'express';
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

  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'kifayat-connect-server' });
  });

  app.post('/api/scan-paper-form', async (req, res) => {
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        success: false,
        code: 'SCAN_NOT_CONFIGURED',
        error: 'The AI scanner needs GEMINI_API_KEY in Settings → Environment variables.',
      });
      return;
    }

    const body = req.body as { imageDataUrl?: string; mimeType?: string; data?: string; hint?: string };
    let mimeType = 'image/jpeg';
    let base64Data = '';

    if (typeof body?.data === 'string' && body.data.trim()) {
      // Pre-enhanced JPEG sent by the client scanner (canvas pass already applied).
      mimeType = (body.mimeType || 'image/jpeg').trim() || 'image/jpeg';
      base64Data = body.data.trim().replace(/^data:[^,]*,/, '').replace(/\s+/g, '');
    } else if (typeof body?.imageDataUrl === 'string') {
      const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(body.imageDataUrl.trim());
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    if (!base64Data) {
      res.status(400).json({
        success: false,
        code: 'INVALID_IMAGE',
        error: 'The photo could not be prepared for scanning. Please try taking it again.',
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const prompt = [
        'You are a careful bilingual (Urdu Nastaliq & English) document OCR assistant for "Sui Khel Qaumi Ittehad / Kifayat Connect".',
        'Extract any visible handwritten or printed details from this old membership (Rukniyat) paper form or old paper receipt (Raseed).',
        'Return clean extracted values. For CNIC, extract digits (format XXXXX-XXXXXXX-X if 13 digits are clear).',
        'For date, prefer YYYY-MM-DD if clear, otherwise keep the visible date string.',
        'For amount, return numeric PKR value (0 if not present). For tabar, identify clan/family name if visible (e.g., Faiz Khel, Swati Khel, Rousa Khel, etc.).',
        'Leave any unreadable or missing fields as empty strings (or 0 for amount). Do not invent data.',
        'Return a single JSON object using these keys, repeating each value under its Urdu key as well:',
        'name, نام, fatherName, ولد, contactNumber, رابطہ نمبر, cnic, شناختی کارڈ نمبر, tabar, مرکزی خاندان, subBranch, ذیلی شاخ,',
        'representative, نمائندہ, district, یونٹ, date, تاریخ, serialNo, رکنیت نمبر, amount, مبلغ, currentAddress, موجودہ پتہ, permanentAddress, مستقل پتہ.',
        'Use 13 digits with no dashes for cnic, YYYY-MM-DD for date, digits only for amount, and put the printed membership/receipt number in serialNo.',
      ].join(' ');

      // Best → fastest vision models; an unavailable or throttled model fails over instantly.
      const modelChain = ['gemini-3.8-flash', 'gemini-4-hydrogen', 'gemini-3.5-flash-lite'];
      const generateWith = (model: string) =>
        ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              oldMembershipNo: { type: Type.STRING },
              oldReceiptSerialNo: { type: Type.STRING },
              date: { type: Type.STRING },
              applicantName: { type: Type.STRING },
              fatherName: { type: Type.STRING },
              cnic: { type: Type.STRING },
              tabar: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              unit: { type: Type.STRING },
              phone: { type: Type.STRING },
              district: { type: Type.STRING },
              address: { type: Type.STRING },
            },
          },
        },
        });

      let response: Awaited<ReturnType<typeof generateWith>> | null = null;
      let lastModelError: unknown = null;
      for (const model of modelChain) {
        try {
          response = await generateWith(model);
          lastModelError = null;
          break;
        } catch (error) {
          lastModelError = error;
        }
      }
      if (!response) throw lastModelError ?? new Error('No vision model answered');

      const rawText = (response.text || '{}').trim();
      const parsed = JSON.parse(rawText) as Record<string, unknown>;

      res.json({
        success: true,
        text: rawText,
        fields: {
          oldMembershipNo: String(parsed.oldMembershipNo || '').trim(),
          oldReceiptSerialNo: String(parsed.oldReceiptSerialNo || '').trim(),
          date: String(parsed.date || '').trim(),
          applicantName: String(parsed.applicantName || '').trim(),
          fatherName: String(parsed.fatherName || '').trim(),
          cnic: String(parsed.cnic || '').trim(),
          tabar: String(parsed.tabar || '').trim(),
          amount: typeof parsed.amount === 'number' && Number.isFinite(parsed.amount) ? Math.max(0, parsed.amount) : 0,
          unit: String(parsed.unit || '').trim(),
          phone: String(parsed.phone || '').trim(),
          district: String(parsed.district || '').trim(),
          address: String(parsed.address || '').trim(),
        },
      });
    } catch (err) {
      console.warn('Paper form scan failed:', err);
      res.status(502).json({
        success: false,
        code: 'SCAN_ERROR',
        error: 'The scanner did not answer just now. Your photo is kept — please try again.',
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
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kifayat Connect server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
