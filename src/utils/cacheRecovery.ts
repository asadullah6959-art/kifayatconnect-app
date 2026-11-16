// Safe Cache Auto-Recovery Utility
// Clears ONLY corrupted/unparseable localStorage cache keys while strictly preserving
// user login sessions, credentials, password hashes, and language preferences.

const PROTECTED_SESSION_KEYS = new Set<string>([
  'kifayat_current_user',
  'kifayat_current_user_v3',
  'kifayat_lang_v3',
  'kc_saved_credentials',
  'kc_local_pwd_hashes_v1',
  'kc_active_otp',
  'kc_pending_password_reset',
  'kifayat_migrated_clean_v3'
]);

const STRING_VALUE_KEYS = new Set<string>([
  'kifayat_current_user_v3',
  'kifayat_lang_v3',
  'kifayat_ack_update_version_v3',
  'kifayat_migrated_clean_v3'
]);

export function repairCorruptedLocalCachePreserveSession(): string[] {
  const repairedKeys: string[] = [];
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return repairedKeys;
  }

  try {
    const keysToInspect: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('kifayat_') || k.startsWith('kc_'))) {
        keysToInspect.push(k);
      }
    }

    for (const key of keysToInspect) {
      if (PROTECTED_SESSION_KEYS.has(key) || STRING_VALUE_KEYS.has(key)) {
        // Still guard protected JSON keys if somehow truncated to invalid JSON (except raw string keys)
        if (key === 'kifayat_current_user') {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (!parsed || typeof parsed !== 'object' || !parsed.id) {
                localStorage.removeItem(key);
                repairedKeys.push(key);
              }
            }
          } catch {
            localStorage.removeItem(key);
            repairedKeys.push(key);
          }
        }
        continue;
      }

      try {
        const raw = localStorage.getItem(key);
        if (raw === null || raw === '') continue;
        const parsed = JSON.parse(raw);
        if (parsed === null || typeof parsed !== 'object') {
          localStorage.removeItem(key);
          repairedKeys.push(key);
        }
      } catch {
        localStorage.removeItem(key);
        repairedKeys.push(key);
      }
    }
  } catch {
    // Ignore storage access errors in restricted WebViews
  }

  return repairedKeys;
}
