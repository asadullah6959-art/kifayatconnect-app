import { useCallback, useEffect, useRef, useState } from 'react';
import { AppSettings, AppUpdate } from '../types';
import { compareVersions, INSTALLED_APP_VERSION } from '../services/githubReleases';
import {
  applyOtaCacheBustAndReload,
  EMBEDDED_APP_VERSION,
  EMBEDDED_BUILD_ID,
  fetchLiveVersionManifest,
} from '../utils/otaUpdate';

interface UseLiveAutoUpdateOptions {
  appSettings: AppSettings;
  latestPublishedUpdate: AppUpdate | null;
}

export interface LiveAutoUpdateState {
  updateAvailable: boolean;
  updateVersionLabel: string;
  isRefreshing: boolean;
  dismissBanner: () => void;
  applyLiveUpdate: () => Promise<void>;
  checkNow: () => Promise<void>;
}

const POLL_INTERVAL_MS = 3 * 60 * 1000;
const MIN_CHECK_GAP_MS = 12 * 1000;

export function useLiveAutoUpdate({
  appSettings,
  latestPublishedUpdate,
}: UseLiveAutoUpdateOptions): LiveAutoUpdateState {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateVersionLabel, setUpdateVersionLabel] = useState(EMBEDDED_APP_VERSION);
  const [detectedBuildKey, setDetectedBuildKey] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dismissedKey, setDismissedKey] = useState<string>(() => {
    try {
      return sessionStorage.getItem('kc_ota_dismissed_key') || '';
    } catch {
      return '';
    }
  });

  const lastCheckAtRef = useRef<number>(0);

  const flagUpdate = useCallback(
    (buildKey: string, versionLabel: string) => {
      if (!buildKey) return;
      try {
        const justApplied = sessionStorage.getItem('kc_ota_just_applied_build');
        if (justApplied && justApplied === buildKey) return;
      } catch {
        // Ignore storage error
      }
      if (dismissedKey && dismissedKey === buildKey) return;

      setDetectedBuildKey(buildKey);
      setUpdateVersionLabel(versionLabel || EMBEDDED_APP_VERSION);
      setUpdateAvailable(true);
    },
    [dismissedKey]
  );

  const checkNow = useCallback(async () => {
    const now = Date.now();
    if (now - lastCheckAtRef.current < MIN_CHECK_GAP_MS) return;
    lastCheckAtRef.current = now;

    // 1. Trigger Service Worker update check if supported
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          if (reg.waiting) {
            flagUpdate(`sw-waiting-${reg.waiting.scriptURL}`, EMBEDDED_APP_VERSION);
          }
          reg.update().catch(() => {});
        }
      } catch {
        // Ignore SW check error
      }
    }

    // 2. Compare remote version.json / /api/version buildId against embedded buildId
    const remote = await fetchLiveVersionManifest();
    if (remote && remote.otaEnabled && remote.buildId && remote.buildId !== 'dev') {
      if (import.meta.env.PROD && remote.buildId !== EMBEDDED_BUILD_ID) {
        flagUpdate(remote.buildId, remote.version || EMBEDDED_APP_VERSION);
      }
    }
  }, [flagUpdate]);

  // Watch Firestore live update signals (published update or liveBuildId)
  useEffect(() => {
    if (appSettings.liveBuildId && appSettings.liveBuildId !== EMBEDDED_BUILD_ID) {
      if (import.meta.env.PROD || appSettings.liveBuildId.startsWith('live-')) {
        flagUpdate(
          appSettings.liveBuildId,
          appSettings.liveAppVersion || EMBEDDED_APP_VERSION
        );
      }
    } else if (
      latestPublishedUpdate &&
      latestPublishedUpdate.isPublished &&
      compareVersions(latestPublishedUpdate.version, INSTALLED_APP_VERSION) > 0
    ) {
      flagUpdate(
        `pub-${latestPublishedUpdate.id}-${latestPublishedUpdate.version}`,
        latestPublishedUpdate.version
      );
    }
  }, [appSettings.liveBuildId, appSettings.liveAppVersion, latestPublishedUpdate, flagUpdate]);

  // Listen to Service Worker update events, visibility/resume, focus, online, and Capacitor appStateChange
  useEffect(() => {
    void checkNow();

    const handleSwEvent = () => {
      flagUpdate(`sw-event-${Date.now()}`, EMBEDDED_APP_VERSION);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void checkNow();
      }
    };

    const handleFocusOrOnline = () => {
      void checkNow();
    };

    window.addEventListener('kc-sw-update-available', handleSwEvent);
    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('resume', handleFocusOrOnline);
    window.addEventListener('focus', handleFocusOrOnline);
    window.addEventListener('online', handleFocusOrOnline);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void checkNow();
      }
    }, POLL_INTERVAL_MS);

    let capListenerRemove: (() => void) | undefined;
    try {
      const capApp = (window as unknown as {
        Capacitor?: {
          Plugins?: {
            App?: {
              addListener?: (
                eventName: string,
                cb: (state: { isActive: boolean }) => void
              ) => Promise<{ remove: () => void }> | { remove: () => void };
            };
          };
        };
      }).Capacitor?.Plugins?.App;

      if (capApp && typeof capApp.addListener === 'function') {
        const handle = capApp.addListener('appStateChange', (state) => {
          if (state?.isActive) {
            void checkNow();
          }
        });
        if (handle && typeof (handle as Promise<{ remove: () => void }>).then === 'function') {
          (handle as Promise<{ remove: () => void }>)
            .then((res) => {
              capListenerRemove = () => res?.remove?.();
            })
            .catch(() => {});
        } else if (handle && typeof (handle as { remove?: () => void }).remove === 'function') {
          capListenerRemove = () => (handle as { remove: () => void }).remove();
        }
      }
    } catch {
      // Capacitor App plugin unavailable
    }

    return () => {
      window.removeEventListener('kc-sw-update-available', handleSwEvent);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('resume', handleFocusOrOnline);
      window.removeEventListener('focus', handleFocusOrOnline);
      window.removeEventListener('online', handleFocusOrOnline);
      window.clearInterval(intervalId);
      try {
        capListenerRemove?.();
      } catch {
        // Ignore cleanup failure
      }
    };
  }, [checkNow, flagUpdate]);

  const dismissBanner = useCallback(() => {
    setUpdateAvailable(false);
    if (detectedBuildKey) {
      setDismissedKey(detectedBuildKey);
      try {
        sessionStorage.setItem('kc_ota_dismissed_key', detectedBuildKey);
      } catch {
        // Ignore storage error
      }
    }
  }, [detectedBuildKey]);

  const applyLiveUpdate = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await applyOtaCacheBustAndReload(detectedBuildKey || EMBEDDED_BUILD_ID);
  }, [detectedBuildKey, isRefreshing]);

  return {
    updateAvailable,
    updateVersionLabel,
    isRefreshing,
    dismissBanner,
    applyLiveUpdate,
    checkNow,
  };
}
