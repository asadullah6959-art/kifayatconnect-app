export interface CompressedImageResult {
  dataUrl: string;
  sizeBytes: number;
  width: number;
  height: number;
}

const DEFAULT_MAX_BYTES = 450 * 1024; // 450KB limit for Firestore & low-RAM phones

function calcBase64SizeBytes(dataUrl: string): number {
  const base64Length = dataUrl.split(',')[1]?.length || 0;
  return Math.round((base64Length * 3) / 4);
}

/**
 * Compresses and resizes an image file client-side via HTML5 Canvas
 * so photos, receipts, and custom backgrounds stay < 450KB on low-RAM mobile devices
 * and well below Firestore's 1MB document limit.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 1080,
  quality = 0.78,
  maxBytes = DEFAULT_MAX_BYTES
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    try {
      if (!file || !file.type.startsWith('image/')) {
        reject(new Error('Selected file is not a valid image (JPG, PNG, or WEBP required).'));
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read selected image file.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Could not decode image file.'));
        img.onload = () => {
          try {
            let width = img.naturalWidth || img.width;
            let height = img.naturalHeight || img.height;

            if (width <= 0 || height <= 0) {
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
            let currentQ = quality;
            let dataUrl = renderAt(currentW, currentH, currentQ);
            let sizeBytes = calcBase64SizeBytes(dataUrl);

            // Iteratively lower quality / dimensions until strictly < maxBytes (450KB)
            const qualitySteps = [0.68, 0.56, 0.44];
            for (const nextQ of qualitySteps) {
              if (sizeBytes < maxBytes) break;
              currentQ = Math.min(currentQ, nextQ);
              dataUrl = renderAt(currentW, currentH, currentQ);
              sizeBytes = calcBase64SizeBytes(dataUrl);
            }

            let resizeAttempts = 0;
            while (sizeBytes >= maxBytes && resizeAttempts < 4 && currentW > 240 && currentH > 240) {
              currentW = Math.round(currentW * 0.78);
              currentH = Math.round(currentH * 0.78);
              dataUrl = renderAt(currentW, currentH, Math.min(currentQ, 0.55));
              sizeBytes = calcBase64SizeBytes(dataUrl);
              resizeAttempts += 1;
            }

            resolve({
              dataUrl,
              sizeBytes,
              width: currentW,
              height: currentH
            });
          } catch (err) {
            reject(err instanceof Error ? err : new Error('Image compression failed.'));
          }
        };
        img.src = reader.result as string;
      };

      reader.readAsDataURL(file);
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Failed to process image upload.'));
    }
  });
}
