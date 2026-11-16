import { copyToClipboardSafe } from './dastoor';

export const DEFAULT_IPHONE_LIVE_URL =
  'https://ais-pre-q7z4kzjcy3ymciznhiopmq-425294184532.asia-northeast1.run.app';

export function resolveIphoneLiveUrl(configuredUrl?: string): string {
  const trimmed = (configuredUrl || '').trim().replace(/\/+$/, '');
  if (trimmed) {
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  if (typeof window !== 'undefined') {
    const isNative = Boolean(
      (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
    );
    const { protocol, hostname, origin } = window.location;
    if (
      !isNative &&
      /^https?:$/i.test(protocol) &&
      !/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(hostname)
    ) {
      return origin.replace(/\/+$/, '');
    }
  }

  return DEFAULT_IPHONE_LIVE_URL;
}

export function isIphoneSafariBrowser(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  const isNative = Boolean(
    (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
  );
  if (isNative) return false;

  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  if (isStandalone) return false;

  const ua = navigator.userAgent || '';
  const isIOSDevice =
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);

  if (!isIOSDevice) return false;

  const isNonSafariIOSBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA\//i.test(ua);
  const hasSafariToken = /Safari/i.test(ua) && /AppleWebKit/i.test(ua);

  return hasSafariToken && !isNonSafariIOSBrowser;
}

export interface IphoneShareResult {
  url: string;
  method: 'share' | 'clipboard';
}

export async function shareKifayatForIphone(configuredUrl?: string): Promise<IphoneShareResult> {
  const url = resolveIphoneLiveUrl(configuredUrl);
  const title = 'Kifayat Connect — iPhone / Web App';
  const shareText =
    `Kifayat Connect (کفایت کنیکٹ) — Together for a Better Tomorrow\n` +
    `iPhone Safari mein khol kar Share (↑) → "Add to Home Screen" dabayein:\n` +
    `آئی فون Safari میں کھول کر Share (↑) اور "Add to Home Screen" منتخب کریں:`;

  // Always copy cleanly first so WhatsApp paste works even if the share sheet is dismissed
  await copyToClipboardSafe(`${shareText}\n${url}`);

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title,
        text: shareText,
        url
      });
      return { url, method: 'share' };
    } catch {
      // Fallback gracefully to clipboard result if user cancelled or WebView blocks navigator.share
    }
  }

  return { url, method: 'clipboard' };
}
