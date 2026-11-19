export interface LiveVersionManifest {
  version: string;
  buildId: string;
  builtAt: string;
  otaEnabled: boolean;
}

export const EMBEDDED_BUILD_ID: string =
  typeof __KC_BUILD_ID__ !== 'undefined' ? __KC_BUILD_ID__ : 'dev';

export const EMBEDDED_APP_VERSION: string =
  typeof __KC_APP_VERSION__ !== 'undefined' ? __KC_APP_VERSION__ : '1.0.0';

export function isNativeCapacitorRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as {
    Capacitor?: { isNativePlatform?: () => boolean };
  }).Capacitor;
  return Boolean(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
}

export async function fetchLiveVersionManifest(): Promise<LiveVersionManifest | null> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return null;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;

  const cacheBuster = Date.now();
  const endpoints = [`./api/version?t=${cacheBuster}`, `./version.json?t=${cacheBuster}`];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      if (!response.ok) continue;
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json') && !endpoint.includes('version.json')) {
        continue;
      }
      const data = (await response.json()) as Partial<LiveVersionManifest>;
      if (data && typeof data.buildId === 'string' && data.buildId.trim()) {
        return {
          version: String(data.version || EMBEDDED_APP_VERSION),
          buildId: data.buildId.trim(),
          builtAt: String(data.builtAt || ''),
          otaEnabled: data.otaEnabled !== false,
        };
      }
    } catch {
      // Try next endpoint safely
    }
  }
  return null;
}

/**
 * Clears ONLY static HTTP / Service Worker / Cache Storage caches so the newest
 * JS/CSS/HTML assets load immediately.
 * NEVER touches localStorage or IndexedDB (preserving Firebase Auth & user session).
 */
export async function applyOtaCacheBustAndReload(targetBuildId?: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    if (targetBuildId && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('kc_ota_just_applied_build', targetBuildId);
    }
  } catch {
    // Ignore storage error
  }

  // 1. Android Capacitor WebView HTTP disk cache clear (preserves WebStorage & IndexedDB)
  try {
    const nativeBridge = (window as unknown as {
      KifayatOtaNative?: { clearWebViewHttpCache?: () => void };
    }).KifayatOtaNative;
    nativeBridge?.clearWebViewHttpCache?.();
  } catch {
    // Ignore native bridge error
  }

  // 2. Clear Browser / PWA Cache Storage (leaves localStorage & IndexedDB untouched)
  try {
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key).catch(() => false)));
    }
  } catch {
    // Ignore cache clear failure
  }

  // 3. Activate any waiting Service Worker & request cache purge
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        regs.map(async (reg) => {
          try {
            reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
            reg.active?.postMessage({ type: 'CLEAR_ALL_CACHES' });
            await reg.update();
          } catch {
            // Ignore single SW update failure
          }
        })
      );
    }
  } catch {
    // Ignore SW errors
  }

  // 4. Reload cleanly with fresh assets while keeping user login session intact
  try {
    window.location.reload();
  } catch {
    window.location.href = window.location.href;
  }
}
