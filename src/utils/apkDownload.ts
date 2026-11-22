import { LATEST_APK_DOWNLOAD_URL } from '../services/githubReleases';

type ApkDownloadWindow = Window & {
  Capacitor?: { isNativePlatform?: () => boolean };
  SKIOtaNative?: { openExternalUrl?: (url: string) => void };
};

export function openLatestApkDownload(): void {
  if (typeof window === 'undefined') return;

  const nativeWindow = window as ApkDownloadWindow;
  if (nativeWindow.Capacitor?.isNativePlatform?.()) {
    const openExternalUrl = nativeWindow.SKIOtaNative?.openExternalUrl;
    if (openExternalUrl) {
      openExternalUrl.call(nativeWindow.SKIOtaNative, LATEST_APK_DOWNLOAD_URL);
      return;
    }
  }

  const downloadWindow = window.open(LATEST_APK_DOWNLOAD_URL, '_blank');
  if (downloadWindow) {
    downloadWindow.opener = null;
  } else {
    window.location.assign(LATEST_APK_DOWNLOAD_URL);
  }
}
