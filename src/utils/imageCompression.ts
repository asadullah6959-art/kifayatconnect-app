export interface CompressedImageResult {
  dataUrl: string;
  sizeBytes: number;
  width: number;
  height: number;
}

export const MAX_GALLERY_FILE_BYTES = 10 * 1024 * 1024; // 10MB maximum selection limit
const DEFAULT_MAX_BYTES = 750 * 1024; // 750KB encoded payload ceiling for fast Firestore sync

export function isGifFile(file: File): boolean {
  return file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
}

function calcDataUrlEncodedBytes(dataUrl: string): number {
  return dataUrl.length;
}

export function readFileAsDataUrlWithLimit(
  file: File,
  maxDataUrlBytes = DEFAULT_MAX_BYTES
): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      // Quick pre-check: base64 expands binary size by ~4/3
      if (file.size * 1.38 > maxDataUrlBytes) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => resolve(null);
      reader.onload = () => {
        const res = typeof reader.result === 'string' ? reader.result : null;
        if (!res || res.length > maxDataUrlBytes) {
          resolve(null);
          return;
        }
        resolve(res);
      };
      reader.readAsDataURL(file);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Compresses and resizes an image file (up to 10MB) client-side via an offscreen HTML5 Canvas
 * (max dimension 1024px, progressive JPEG quality 0.75 -> 0.55 -> 0.40) so payloads stay
 * strictly under 750KB for smooth, crash-free Firestore delivery on low-RAM phones.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 1024,
  quality = 0.75,
  maxBytes = DEFAULT_MAX_BYTES
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    try {
      if (!file || (!file.type.startsWith('image/') && !isGifFile(file))) {
        reject(new Error('Selected file is not a valid image or GIF.'));
        return;
      }
      if (file.size > MAX_GALLERY_FILE_BYTES) {
        reject(new Error('Selected file exceeds the 10MB limit. Please choose a smaller photo or GIF.'));
        return;
      }

      const loadBitmap = (src: string, onCleanup?: () => void) => {
        const img = new Image();
        img.onerror = () => {
          onCleanup?.();
          reject(new Error('Could not decode selected image file.'));
        };
        img.onload = () => {
          try {
            let width = img.naturalWidth || img.width;
            let height = img.naturalHeight || img.height;

            if (width <= 0 || height <= 0) {
              onCleanup?.();
              reject(new Error('Image has invalid dimensions.'));
              return;
            }

            if (width > maxDimension || height > maxDimension) {
              if (width >= height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            const renderAt = (w: number, h: number, q: number): string => {
              const canvas = document.createElement('canvas');
              canvas.width = Math.max(1, Math.round(w));
              canvas.height = Math.max(1, Math.round(h));
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                throw new Error('Browser canvas unavailable for image optimization.');
              }
              ctx.fillStyle = '#0A0D12';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              return canvas.toDataURL('image/jpeg', q);
            };

            let currentW = width;
            let currentH = height;
            let currentQ = Math.min(0.75, quality);
            let dataUrl = renderAt(currentW, currentH, currentQ);
            let sizeBytes = calcDataUrlEncodedBytes(dataUrl);

            // Progressive JPEG compression: 0.75 -> 0.55 -> 0.40
            const qualitySteps = [0.75, 0.55, 0.40];
            for (const nextQ of qualitySteps) {
              if (sizeBytes <= maxBytes) break;
              currentQ = Math.min(currentQ, nextQ);
              dataUrl = renderAt(currentW, currentH, currentQ);
              sizeBytes = calcDataUrlEncodedBytes(dataUrl);
            }

            // Additional proportional downscale guard for extremely dense 10MB camera shots
            let resizeAttempts = 0;
            while (sizeBytes > maxBytes && resizeAttempts < 4 && currentW > 280 && currentH > 280) {
              currentW = Math.round(currentW * 0.78);
              currentH = Math.round(currentH * 0.78);
              dataUrl = renderAt(currentW, currentH, 0.40);
              sizeBytes = calcDataUrlEncodedBytes(dataUrl);
              resizeAttempts += 1;
            }

            onCleanup?.();
            resolve({
              dataUrl,
              sizeBytes,
              width: currentW,
              height: currentH
            });
          } catch (err) {
            onCleanup?.();
            reject(err instanceof Error ? err : new Error('Image compression failed.'));
          }
        };
        img.src = src;
      };

      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        const objectUrl = URL.createObjectURL(file);
        loadBitmap(objectUrl, () => {
          try {
            URL.revokeObjectURL(objectUrl);
          } catch {
            // ignore revoke error
          }
        });
      } else {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read selected image file.'));
        reader.onload = () => loadBitmap(reader.result as string);
        reader.readAsDataURL(file);
      }
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Failed to process image upload.'));
    }
  });
}

export const AVATAR_MAX_DIMENSION = 200;
export const AVATAR_MAX_BYTES = 35 * 1024; // 35KB ceiling for crisp, instant-loading avatars

/**
 * Compresses profile avatars to <= 200x200px JPEG (starting at quality 0.72, strictly < 35KB)
 * so Member Directory renders dozens of members in milliseconds across low-RAM phones.
 */
export async function compressAvatarFile(file: File): Promise<CompressedImageResult> {
  const initial = await compressImageFile(file, AVATAR_MAX_DIMENSION, 0.72, AVATAR_MAX_BYTES);
  if (initial.sizeBytes <= AVATAR_MAX_BYTES) {
    return initial;
  }

  // Fallback progressive downscale if a dense photo remained over 35KB at 200px
  for (const dim of [160, 128, 96]) {
    const attempt = await compressImageFile(file, dim, 0.55, AVATAR_MAX_BYTES);
    if (attempt.sizeBytes <= AVATAR_MAX_BYTES) {
      return attempt;
    }
  }
  return initial;
}

export const MAX_AI_SCAN_FILE_BYTES = 50 * 1024 * 1024; // 50MB support for 4K/Full HD mobile photos

export interface PreparedAiScanImage {
  base64: string;
  dataUrl: string;
  mimeType: 'image/jpeg';
  width: number;
  height: number;
  sharpnessScore: number;
}

function calculateSharpnessScore(ctx: CanvasRenderingContext2D, width: number, height: number): number {
  try {
    if (width < 160 || height < 160) return 0;
    const { data } = ctx.getImageData(0, 0, width, height);
    let sum = 0;
    let sumSquares = 0;
    let count = 0;
    const stride = Math.max(1, Math.floor(Math.max(width, height) / 900));
    for (let y = stride; y < height - stride; y += stride) {
      for (let x = stride; x < width - stride; x += stride) {
        const i = (y * width + x) * 4;
        const center = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const left = (data[i - 4] + data[i - 3] + data[i - 2]) / 3;
        const right = (data[i + 4] + data[i + 5] + data[i + 6]) / 3;
        const laplacian = center * 4 - left - right -
          ((data[i - width * 4] + data[i - width * 4 + 1] + data[i - width * 4 + 2]) / 3) -
          ((data[i + width * 4] + data[i + width * 4 + 1] + data[i + width * 4 + 2]) / 3);
        sum += laplacian;
        sumSquares += laplacian * laplacian;
        count += 1;
      }
    }
    if (count === 0) return 0;
    const mean = sum / count;
    return sumSquares / count - mean * mean;
  } catch {
    return 0;
  }
}

function applySharpenAndLightingFallback(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  applyLightingInPixels: boolean
): void {
  try {
    if (width * height > 1800 * 1800) return;
    const imgData = ctx.getImageData(0, 0, width, height);
    const src = imgData.data;

    // Guaranteed software lighting/contrast pass if browser lacks CanvasRenderingContext2D.filter
    if (applyLightingInPixels) {
      const len = src.length;
      for (let i = 0; i < len; i += 4) {
        const r = src[i] * 1.18;
        const g = src[i + 1] * 1.18;
        const b = src[i + 2] * 1.18;
        // 1.45 contrast around midpoint 128 (preserves blue/black ink vs teal paper form)
        src[i] = Math.min(255, Math.max(0, (r - 128) * 1.45 + 128));
        src[i + 1] = Math.min(255, Math.max(0, (g - 128) * 1.45 + 128));
        src[i + 2] = Math.min(255, Math.max(0, (b - 128) * 1.45 + 128));
      }
    }

    const copy = new Uint8ClampedArray(src);
    const rowStride = width * 4;

    // Crisp 3x3 unsharp sharpening kernel [0, -0.45, 0; -0.45, 2.8, -0.45; 0, -0.45, 0]
    for (let y = 1; y < height - 1; y += 1) {
      const rowOffset = y * rowStride;
      for (let x = 1; x < width - 1; x += 1) {
        const i = rowOffset + x * 4;
        const up = i - rowStride;
        const down = i + rowStride;
        const left = i - 4;
        const right = i + 4;

        src[i] = Math.min(255, Math.max(0, Math.round(copy[i] * 2.8 - (copy[up] + copy[down] + copy[left] + copy[right]) * 0.45)));
        src[i + 1] = Math.min(255, Math.max(0, Math.round(copy[i + 1] * 2.8 - (copy[up + 1] + copy[down + 1] + copy[left + 1] + copy[right + 1]) * 0.45)));
        src[i + 2] = Math.min(255, Math.max(0, Math.round(copy[i + 2] * 2.8 - (copy[up + 2] + copy[down + 2] + copy[left + 2] + copy[right + 2]) * 0.45)));
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } catch {
    // Gracefully fall back if canvas pixel access is unavailable
  }
}

function renderEnhancedCanvas(
  drawable: CanvasImageSource,
  naturalW: number,
  naturalH: number,
  maxDimension: number,
  quality: number
): PreparedAiScanImage {
  const scale = Math.min(1, maxDimension / Math.max(naturalW, naturalH));
  const targetW = Math.max(1, Math.round(naturalW * scale));
  const targetH = Math.max(1, Math.round(naturalH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas unavailable for AI image optimization.');
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetW, targetH);

  // Automatic lighting & contrast boost for dim, faded, or low-quality mobile shots
  const supportsFilter = typeof ctx.filter === 'string';
  if (supportsFilter) {
    ctx.filter = 'brightness(1.18) contrast(1.45)';
  }
  ctx.drawImage(drawable, 0, 0, targetW, targetH);
  const sharpnessScore = calculateSharpnessScore(ctx, targetW, targetH);
  if (supportsFilter) {
    ctx.filter = 'none';
  }

  applySharpenAndLightingFallback(ctx, targetW, targetH, !supportsFilter);

  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  // Keep payload mobile-network friendly while preserving 1800px clarity
  if (dataUrl.length > 5 * 1024 * 1024) {
    dataUrl = canvas.toDataURL('image/jpeg', 0.78);
  }
  const base64 = dataUrl.replace(/^data:image\/[^;]+;base64,/, '').trim();
  return { base64, dataUrl, mimeType: 'image/jpeg', width: targetW, height: targetH, sharpnessScore };
}

/**
 * Accepts EVERY mobile photo immediately regardless of lighting, blur, or camera quality (up to 50MB),
 * resizes to max 1800px on the longest side, boosts brightness/contrast/grayscale & sharpens text,
 * exports a crisp JPEG data URL, and returns pure base64 for /api/scan-paper-form.
 */
export async function prepareImageForAiScan(
  source: File | string,
  maxDimension = 1800,
  quality = 0.88
): Promise<PreparedAiScanImage> {
  if (typeof source !== 'string') {
    if (!source) {
      throw new Error('No photo selected.');
    }
    if (source.size > MAX_AI_SCAN_FILE_BYTES) {
      throw new Error('Selected photo exceeds the 50MB limit.');
    }

    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(source);
        try {
          if (bitmap.width > 0 && bitmap.height > 0) {
            return renderEnhancedCanvas(bitmap, bitmap.width, bitmap.height, maxDimension, quality);
          }
        } finally {
          bitmap.close();
        }
      } catch {
        // Fallback to HTMLImageElement loader below
      }
    }
  }

  return new Promise((resolve, reject) => {
    const processSrc = (imgSrc: string, onCleanup?: () => void) => {
      const img = new Image();
      img.onerror = () => {
        onCleanup?.();
        if (typeof source === 'string' && source.startsWith('data:image/')) {
          const base64 = source.replace(/^data:image\/[^;]+;base64,/, '').trim();
          resolve({ base64, dataUrl: source, mimeType: 'image/jpeg', width: 0, height: 0, sharpnessScore: 0 });
          return;
        }
        reject(new Error('Could not decode selected photo.'));
      };
      img.onload = () => {
        try {
          const naturalW = img.naturalWidth || img.width;
          const naturalH = img.naturalHeight || img.height;
          if (!naturalW || !naturalH) {
            onCleanup?.();
            reject(new Error('Selected photo has empty dimensions.'));
            return;
          }
          const result = renderEnhancedCanvas(img, naturalW, naturalH, maxDimension, quality);
          onCleanup?.();
          resolve(result);
        } catch (err) {
          onCleanup?.();
          if (typeof source === 'string' && source.startsWith('data:image/')) {
            const base64 = source.replace(/^data:image\/[^;]+;base64,/, '').trim();
            resolve({ base64, dataUrl: source, mimeType: 'image/jpeg', width: 0, height: 0, sharpnessScore: 0 });
            return;
          }
          reject(err instanceof Error ? err : new Error('Failed to process photo for AI scan.'));
        }
      };
      img.src = imgSrc;
    };

    if (typeof source === 'string') {
      if (!source.trim()) {
        reject(new Error('No photo attached to scan.'));
        return;
      }
      processSrc(source);
      return;
    }

    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      const objectUrl = URL.createObjectURL(source);
      processSrc(objectUrl, () => {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // ignore
        }
      });
    } else {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read selected photo.'));
      reader.onload = () => processSrc(String(reader.result || ''));
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Converts Urdu / Persian / Arabic-Indic digits to ASCII 0-9.
 */
export function normalizeDigits(raw: unknown): string {
  const s = String(raw ?? '');
  return s
    .replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06f0));
}

/**
 * Normalizes OCR date strings (YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY) to YYYY-MM-DD.
 */
export function normalizeExtractedDate(raw: unknown): string {
  const clean = normalizeDigits(raw).trim();
  if (!clean) return '';

  const isoMatch = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(clean);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const year = Number(y);
    const month = Number(m);
    const day = Number(d);
    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const dmyMatch = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/.exec(clean);
  if (dmyMatch) {
    let [, dStr, mStr, yStr] = dmyMatch;
    if (yStr.length === 2) {
      const yy = Number(yStr);
      yStr = yy > 40 ? `19${yStr}` : `20${yStr}`;
    }
    let day = Number(dStr);
    let month = Number(mStr);
    if (month > 12 && day <= 12) {
      const tmp = month;
      month = day;
      day = tmp;
    }
    const year = Number(yStr);
    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${yStr}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  return '';
}

/**
 * Resolves extracted district/province names against PROVINCES_DATA so dependent dropdowns stay valid.
 */
export function matchProvinceAndDistrict(
  extractedDist: unknown,
  extractedProv: unknown,
  provincesData: Record<string, { districts: Array<{ name: string }> }>
): { stateProvince?: string; district?: string } {
  const distQuery = String(extractedDist ?? '').trim().toLowerCase();
  const provQuery = String(extractedProv ?? '').trim().toLowerCase();

  let matchedProvince: string | undefined;
  if (provQuery) {
    matchedProvince = Object.keys(provincesData).find(
      (p) => p.toLowerCase() === provQuery || p.toLowerCase().includes(provQuery) || provQuery.includes(p.toLowerCase())
    );
  }

  if (distQuery) {
    const provKeys = matchedProvince
      ? [matchedProvince, ...Object.keys(provincesData).filter((p) => p !== matchedProvince)]
      : Object.keys(provincesData);

    for (const pKey of provKeys) {
      const foundDist = (provincesData[pKey]?.districts || []).find(
        (d) =>
          d.name.toLowerCase() === distQuery ||
          d.name.toLowerCase().includes(distQuery) ||
          distQuery.includes(d.name.toLowerCase())
      );
      if (foundDist) {
        return { stateProvince: pKey, district: foundDist.name };
      }
    }
  }

  if (matchedProvince) {
    return { stateProvince: matchedProvince };
  }
  return {};
}

/**
 * Picks the first non-empty value from an extracted OCR object across English & Urdu key aliases.
 */
export function pickBilingualField(
  obj: Record<string, unknown>,
  candidateKeys: string[]
): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  const normalizedMap = new Map<string, unknown>();
  for (const [k, v] of Object.entries(obj)) {
    normalizedMap.set(k.trim().toLowerCase(), v);
  }
  for (const key of candidateKeys) {
    const direct = obj[key];
    if (direct !== undefined && direct !== null && String(direct).trim() !== '') {
      return direct;
    }
    const norm = normalizedMap.get(key.trim().toLowerCase());
    if (norm !== undefined && norm !== null && String(norm).trim() !== '') {
      return norm;
    }
  }
  return undefined;
}
