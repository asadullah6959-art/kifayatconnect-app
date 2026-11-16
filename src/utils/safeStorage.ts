// Safe Storage + IndexedDB Mirror Utility for iPhone Safari, In-App Browsers & Android WebView
// Never relies on cookies and never throws SecurityError/QuotaExceededError in restricted WebViews.

const memoryFallbackStore = new Map<string, string>();

const IDB_DB_NAME = 'kifayat_connect_session_db';
const IDB_STORE_NAME = 'kv_sessions';

export function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch {
    // Restricted Safari / in-app WebView may deny localStorage access
  }
  return memoryFallbackStore.get(key) ?? null;
}

export function safeSetItem(key: string, value: string): boolean {
  memoryFallbackStore.set(key, value);
  try {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.setItem(key, value);
      return true;
    }
  } catch {
    // QuotaExceededError or SecurityError in restricted browser; memory fallback remains active
  }
  return false;
}

export function safeRemoveItem(key: string): void {
  memoryFallbackStore.delete(key);
  try {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore restricted storage errors
  }
}

function openSessionDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || !('indexedDB' in window) || !window.indexedDB) {
        resolve(null);
        return;
      }
      const timeoutId = window.setTimeout(() => resolve(null), 800);
      const req = window.indexedDB.open(IDB_DB_NAME, 1);
      req.onupgradeneeded = () => {
        try {
          const db = req.result;
          if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
            db.createObjectStore(IDB_STORE_NAME);
          }
        } catch {
          // Ignore upgrade errors
        }
      };
      req.onsuccess = () => {
        window.clearTimeout(timeoutId);
        resolve(req.result);
      };
      req.onerror = () => {
        window.clearTimeout(timeoutId);
        resolve(null);
      };
      req.onblocked = () => {
        window.clearTimeout(timeoutId);
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

export async function mirrorSessionToIndexedDB(key: string, value: string | null): Promise<void> {
  try {
    const db = await openSessionDB();
    if (!db) return;
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
        const store = tx.objectStore(IDB_STORE_NAME);
        if (value === null) {
          store.delete(key);
        } else {
          store.put(value, key);
        }
        tx.oncomplete = () => {
          try { db.close(); } catch {}
          resolve();
        };
        tx.onerror = () => {
          try { db.close(); } catch {}
          resolve();
        };
      } catch {
        try { db.close(); } catch {}
        resolve();
      }
    });
  } catch {
    // Never fail app execution if IndexedDB is blocked in Safari Private Mode
  }
}

export async function readSessionFromIndexedDB(key: string): Promise<string | null> {
  try {
    const db = await openSessionDB();
    if (!db) return null;
    return await new Promise<string | null>((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE_NAME, 'readonly');
        const store = tx.objectStore(IDB_STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => {
          try { db.close(); } catch {}
          resolve(typeof req.result === 'string' ? req.result : null);
        };
        req.onerror = () => {
          try { db.close(); } catch {}
          resolve(null);
        };
      } catch {
        try { db.close(); } catch {}
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}
