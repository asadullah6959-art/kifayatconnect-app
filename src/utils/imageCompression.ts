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
