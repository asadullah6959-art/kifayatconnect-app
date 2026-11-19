import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
  browserPopupRedirectResolver,
  signInWithPopup,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut as fbSignOut, 
  GoogleAuthProvider,
  onAuthStateChanged,
  Auth,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  collection,
  onSnapshot,
  getDocFromServer,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  User, 
  MembershipApplication, 
  PaymentTransaction, 
  Complaint, 
  Announcement, 
  AuditLog, 
  AppNotification,
  OfficeBearer,
  OfficeBearerHistory,
  AppUpdate,
  AppSettings,
  ChatMessage,
  ChatConversation,
  normalizeLegacyRole
} from '../types';
import { safeGetItem, safeSetItem, safeRemoveItem } from '../utils/safeStorage';
import { EMAILJS_LOCKED_CONFIG } from '../config/emailjsConfig';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID (Critical for AI Studio Firestore)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Storage when bucket is configured
export const storage = firebaseConfig.storageBucket ? getStorage(app) : null;

export async function uploadMediaToFirebaseStorage(
  file: File,
  folder = 'community_media'
): Promise<string | null> {
  if (!storage || !firebaseConfig.storageBucket) return null;
  await tryEnsureSessionBestEffort();
  try {
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
    const objectRef = ref(storage, `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${cleanName}`);
    const uploadTask = uploadBytes(objectRef, file, {
      contentType: file.type || 'application/octet-stream'
    }).then(() => getDownloadURL(objectRef));
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 10000);
    });
    return await Promise.race([uploadTask, timeoutPromise]);
  } catch (err) {
    console.warn('Firebase Storage upload skipped/unavailable; falling back to local optimization:', err);
    return null;
  }
}

// Initialize Authentication with multi-layer persistence (IndexedDB -> localStorage -> inMemory)
// so Safari Private Mode, iPhone Google App, and WhatsApp in-app browsers never crash on blocked cookies/storage.
let resolvedAuth: Auth;
try {
  resolvedAuth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence],
    popupRedirectResolver: browserPopupRedirectResolver
  });
} catch {
  resolvedAuth = getAuth(app);
}
export const auth: Auth = resolvedAuth;

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Authorized Permanent Root Super Admin Email
export const ROOT_SUPER_ADMIN_EMAIL = 'asadullah6959@gmail.com';

// Test connection status safely on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'app_settings', 'global'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is currently offline; using cached local state.');
    }
    return Boolean(db && db.app);
  }
}

// Bridge OTP / Password / New Member sessions into Firebase Auth so Firestore reads & writes succeed
export async function ensureFirebaseAuthSession(): Promise<FirebaseUser | null> {
  try {
    if (auth.currentUser) return auth.currentUser;
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.warn('Firebase anonymous bridge skipped or unavailable:', err);
    return auth.currentUser;
  }
}

// Structured error handling for Firestore
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Detect Capacitor / native mobile WebView runtime where Firebase popup redirects fail
export function isNativeMobileRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as {
    Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
  }).Capacitor;
  if (cap?.isNativePlatform?.()) return true;
  const platform = cap?.getPlatform?.();
  if (platform === 'android' || platform === 'ios') return true;
  const { protocol, hostname, port } = window.location;
  if (protocol === 'capacitor:' || protocol === 'ionic:' || protocol === 'file:') return true;
  if (hostname === 'localhost' && !port) return true;
  if (typeof navigator !== 'undefined' && /;\s*wv\)/i.test(navigator.userAgent)) return true;
  return false;
}

// Detect in-app browsers (WhatsApp, Facebook, Instagram, Google App) where cross-site auth cookies/popups are blocked
export function isRestrictedInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /(WhatsApp|FBAN|FBAV|Instagram|Line\/|Snapchat|Twitter|GSA\/|MicroMessenger)/i.test(ua);
}

// Google Sign-In with Popup (Standard Web browsers only; zero cookies required for app load or Email/Password login)
export async function loginWithGoogle(): Promise<FirebaseUser> {
  if (isNativeMobileRuntime()) {
    throw new Error('Please use Email OTP or Password to sign in on the mobile app.');
  }
  if (isRestrictedInAppBrowser()) {
    throw new Error('In-app browsers block cross-site popups. Please sign in with Password or Email OTP, or open in Safari/Chrome.');
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign In Error:', error);
    throw error;
  }
}

// Sign-Out
export async function logoutUser(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
    throw error;
  }
}

export function toIsoTimestamp(val: unknown, fallback = ''): string {
  if (!val) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number') {
    try {
      return new Date(val).toISOString();
    } catch {
      return fallback;
    }
  }
  if (val instanceof Date) {
    return Number.isNaN(val.getTime()) ? fallback : val.toISOString();
  }
  if (typeof val === 'object') {
    const obj = val as { toDate?: () => Date; seconds?: number };
    if (typeof obj.toDate === 'function') {
      try {
        const d = obj.toDate();
        return Number.isNaN(d.getTime()) ? fallback : d.toISOString();
      } catch {
        return fallback;
      }
    }
    if (typeof obj.seconds === 'number') {
      try {
        return new Date(obj.seconds * 1000).toISOString();
      } catch {
        return fallback;
      }
    }
  }
  return fallback;
}

export function buildSafeEmailUserId(email: string): string {
  const norm = email.trim().toLowerCase();
  if (norm === ROOT_SUPER_ADMIN_EMAIL.toLowerCase()) {
    return 'usr_super_admin';
  }
  const sanitized = norm.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  return `usr_${sanitized.slice(0, 80) || Date.now().toString()}`;
}

export async function findExistingFirestoreUserByEmail(email: string): Promise<User | null> {
  const normEmail = email.trim().toLowerCase();
  if (!normEmail) return null;
  const candidates: User[] = [];
  const seenIds = new Set<string>();
  const addCandidate = (u?: User | null) => {
    if (!u || !u.id) return;
    if (!seenIds.has(u.id)) {
      seenIds.add(u.id);
      candidates.push(u);
    }
  };

  try {
    await tryEnsureSessionBestEffort();
    const q = query(collection(db, 'users'), where('email', '==', normEmail));
    const snap = await getDocs(q);
    snap.forEach(docSnap => {
      const data = docSnap.data() as Partial<User>;
      addCandidate({ ...data, id: data.id || docSnap.id } as User);
    });

    const safeId = buildSafeEmailUserId(normEmail);
    const idsToCheck = Array.from(
      new Set([
        ...(normEmail === ROOT_SUPER_ADMIN_EMAIL.toLowerCase() ? ['usr_super_admin'] : []),
        safeId,
        normEmail
      ])
    );

    await Promise.all(
      idsToCheck.map(async cid => {
        if (seenIds.has(cid)) return;
        try {
          const directSnap = await getDoc(doc(db, 'users', cid));
          if (directSnap.exists()) {
            const data = directSnap.data() as Partial<User>;
            addCandidate({ ...data, id: data.id || directSnap.id } as User);
          }
        } catch {
          // Ignore invalid doc id or missing doc
        }
      })
    );
  } catch (err) {
    console.warn('Firestore user email lookup warning:', err);
  }

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  // Prefer the most complete/authoritative cloud record if multiple exist
  const scoreUser = (u: User): number => {
    let score = 0;
    if (u.isFounder || u.id === 'usr_super_admin') score += 50;
    if (u.profileCompleted) score += 20;
    if (u.passwordHash) score += 15;
    if (u.cnic) score += 10;
    if (u.photoUrl || u.avatarUrl) score += 8;
    if (u.tabbarId || u.tabbarUrdu || u.tabbarEnglish) score += 6;
    if (u.phone) score += 4;
    if (u.approvalStatus === 'approved' || u.status === 'approved') score += 5;
    return score;
  };
  return candidates.sort((a, b) => scoreUser(b) - scoreUser(a))[0];
}

export async function findExistingFirestoreUserByIdentifier(identifier: string): Promise<User | null> {
  const raw = identifier.trim();
  if (!raw) return null;

  if (raw.includes('@')) {
    return findExistingFirestoreUserByEmail(raw.toLowerCase());
  }

  const upperId = raw.toUpperCase();
  if (upperId === 'KC-ADM-001') {
    return findExistingFirestoreUserByEmail(ROOT_SUPER_ADMIN_EMAIL);
  }

  const digits = raw.replace(/\D/g, '');
  try {
    await tryEnsureSessionBestEffort();

    // 1. Check exact membershipId / memberId match
    const byMemIdSnap = await getDocs(
      query(collection(db, 'users'), where('membershipId', '==', upperId))
    ).catch(() => null);
    if (byMemIdSnap && !byMemIdSnap.empty) {
      const d = byMemIdSnap.docs[0];
      const data = d.data() as Partial<User>;
      return { ...data, id: data.id || d.id } as User;
    }

    const byLegacyMemIdSnap = await getDocs(
      query(collection(db, 'users'), where('memberId', '==', upperId))
    ).catch(() => null);
    if (byLegacyMemIdSnap && !byLegacyMemIdSnap.empty) {
      const d = byLegacyMemIdSnap.docs[0];
      const data = d.data() as Partial<User>;
      return { ...data, id: data.id || d.id } as User;
    }

    // 2. If CNIC (13 digits) or phone digits are provided, check directory users for normalized match
    if (digits.length === 13 || digits.length >= 7) {
      const tail = digits.slice(-10);
      const allUsers = await fetchAllUsersFromFirestore();
      if (digits.length === 13) {
        const matchedByCnic = allUsers.find((u) => {
          const uCnicDigits = (u.cnic || '').replace(/\D/g, '');
          return Boolean(uCnicDigits && uCnicDigits === digits);
        });
        if (matchedByCnic) return matchedByCnic;
      }
      const matchedByPhone = allUsers.find((u) => {
        const uDigits = (u.phone || '').replace(/\D/g, '');
        if (!uDigits) return false;
        return uDigits === digits || (tail.length >= 9 && uDigits.endsWith(tail));
      });
      if (matchedByPhone) return matchedByPhone;
    }
  } catch (err) {
    console.warn('Firestore user identifier lookup warning:', err);
  }

  return null;
}

/**
 * Synchronizes the Firebase authenticated user with their Firestore /users/{uid} document.
 * Preserves existing Email-OTP / Password account record and never overwrites non-empty cloud fields.
 */
export async function syncUserWithFirestore(firebaseUser: FirebaseUser): Promise<User> {
  const normEmail = (firebaseUser.email || '').trim().toLowerCase();
  const existingByEmail = normEmail ? await findExistingFirestoreUserByEmail(normEmail) : null;
  const targetDocId = existingByEmail?.id || (
    normEmail === ROOT_SUPER_ADMIN_EMAIL.toLowerCase() ? 'usr_super_admin' : firebaseUser.uid
  );
  const userDocRef = doc(db, 'users', targetDocId);
  const path = `users/${targetDocId}`;

  try {
    const docSnap = existingByEmail ? { exists: () => true, data: () => existingByEmail } : await getDoc(userDocRef);
    const isSuperAdminEmail = normEmail === ROOT_SUPER_ADMIN_EMAIL.toLowerCase();

    if (docSnap.exists()) {
      const existingData = docSnap.data() as User;
      const normalizedRole = normalizeLegacyRole(existingData.role, normEmail || existingData.email);
      const shouldBeFounder = isSuperAdminEmail || existingData.isFounder === true;
      const cloudPwdHash = existingData.passwordHash || undefined;
      if (cloudPwdHash && (normEmail || existingData.email)) {
        mirrorPasswordHashToLocalStorage(normEmail || existingData.email, cloudPwdHash);
      }
      const hasPwd = Boolean(
        existingData.hasPassword ||
        cloudPwdHash ||
        hasLocalPasswordCredential(normEmail || existingData.email)
      );
      const inferredProfileCompleted = shouldBeFounder
        ? true
        : existingData.profileCompleted !== undefined
        ? Boolean(existingData.profileCompleted)
        : Boolean((existingData.cnic && existingData.cnic.trim()) || (existingData.address && existingData.address.trim()) || normalizedRole !== 'MEMBER');
      const nowIso = new Date().toISOString();
      const photo = existingData.photoUrl || existingData.avatarUrl || firebaseUser.photoURL || undefined;
      const resolvedApproval = resolveUserApprovalStatus({
        ...existingData,
        isFounder: shouldBeFounder,
        email: normEmail || existingData.email
      });

      const updated: User = {
        ...existingData,
        id: targetDocId,
        email: normEmail || existingData.email,
        role: normalizedRole,
        isFounder: shouldBeFounder,
        isStaff: normalizedRole !== 'MEMBER',
        hasPassword: hasPwd,
        passwordHash: cloudPwdHash,
        otpVerifiedOnce: Boolean(existingData.otpVerifiedOnce ?? true),
        profileCompleted: inferredProfileCompleted,
        photoUrl: photo,
        avatarUrl: photo,
        isOnline: true,
        lastSeen: nowIso,
        approvalStatus: resolvedApproval,
        status: resolvedApproval,
        lastLoginAt: nowIso
      };

      const mergePayload: Record<string, unknown> = {
        id: targetDocId,
        email: normEmail || existingData.email,
        role: normalizedRole,
        isFounder: shouldBeFounder,
        isStaff: normalizedRole !== 'MEMBER',
        hasPassword: hasPwd,
        otpVerifiedOnce: Boolean(existingData.otpVerifiedOnce ?? true),
        profileCompleted: inferredProfileCompleted,
        province: existingData.stateProvince || existingData.province || 'Punjab',
        isOnline: true,
        lastSeen: serverTimestamp(),
        approvalStatus: resolvedApproval,
        status: resolvedApproval,
        lastLoginAt: nowIso
      };
      if (photo) {
        mergePayload.photoUrl = photo;
        mergePayload.avatarUrl = photo;
      }
      if (cloudPwdHash) {
        mergePayload.passwordHash = cloudPwdHash;
      }

      await setDoc(userDocRef, mergePayload, { merge: true }).catch(() => {});
      return updated;
    }

    // Document does not exist yet: create verified account in Firestore immediately
    const nowIso = new Date().toISOString();
    const joinDate = nowIso.split('T')[0];
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);
    const emailPrefix = normEmail
      ? normEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : 'Registered Member';

    const newUser: User = {
      id: targetDocId,
      name: isSuperAdminEmail ? 'Asadullah (Founder Super Admin)' : (firebaseUser.displayName || emailPrefix),
      email: normEmail,
      phone: firebaseUser.phoneNumber || '',
      role: isSuperAdminEmail ? 'SUPER_ADMIN' : 'MEMBER',
      isFounder: isSuperAdminEmail,
      hasPassword: hasLocalPasswordCredential(normEmail),
      profileCompleted: isSuperAdminEmail,
      isOnline: true,
      lastSeen: nowIso,
      province: isSuperAdminEmail ? 'Islamabad Capital Territory' : 'Punjab',
      status: isSuperAdminEmail ? 'approved' : 'pending',
      approvalStatus: isSuperAdminEmail ? 'approved' : 'pending',
      lastLoginAt: nowIso,
      createdAt: nowIso,
      country: 'Pakistan',
      stateProvince: isSuperAdminEmail ? 'Islamabad Capital Territory' : 'Punjab',
      district: isSuperAdminEmail ? 'Islamabad' : 'Lahore',
      tehsil: isSuperAdminEmail ? 'Islamabad City' : 'Model Town',
      cityTown: isSuperAdminEmail ? 'Islamabad' : 'Lahore',
      unionCouncil: isSuperAdminEmail ? 'UC-01 Secretariat' : '',
      membershipId: isSuperAdminEmail ? 'KC-ADM-001' : `KC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      membershipStatus: isSuperAdminEmail ? 'ACTIVE' : 'PENDING_DISTRICT_REVIEW',
      verificationStatus: isSuperAdminEmail ? 'VERIFIED' : 'PENDING',
      avatarUrl: firebaseUser.photoURL || undefined,
      photoUrl: firebaseUser.photoURL || undefined,
      cnic: '',
      address: isSuperAdminEmail ? 'Central Secretariat, Islamabad' : '',
      joinDate,
      validUntil: expiryDate.toISOString().split('T')[0],
      monthlyPledge: 0,
      annualPledge: 0,
      totalContributed: 0,
      isStaff: isSuperAdminEmail,
      notes: isSuperAdminEmail ? 'Verified Founder Super Admin authorized via Google Identity' : 'Authenticated Member (Profile Pending)'
    };

    await setDoc(userDocRef, {
      ...normalizeUserForCloud(newUser, { isOnline: true }),
      lastSeen: serverTimestamp()
    }, { merge: true });
    return newUser;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ----------------------------------------------------
// CRITICAL: DO NOT MODIFY, OVERWRITE, OR REMOVE THIS EMAILJS OTP CONFIG IN FUTURE UPDATES
// Real 6-Digit EmailJS OTP Only (Sign-Up, Password Reset & Founder Master Control PIN Reset)
// Strictly NO on-screen/demo OTPs and NO Firebase continue-URI email links.
// ----------------------------------------------------
export const PENDING_OTP_STORAGE_KEY = 'kc_active_otp';
const LEGACY_PENDING_OTP_STORAGE_KEY = 'kc_pending_email_otp';
const OTP_TTL_MS = 15 * 60 * 1000; // 15-minute validity across mobile app switches
export const OTP_COOLDOWN_MS = 30 * 1000; // 30-second resend cooldown
export const OTP_COOLDOWN_SECONDS = 30;

const EMAILJS_SERVICE_ID = EMAILJS_LOCKED_CONFIG.SERVICE_ID;
const EMAILJS_TEMPLATE_ID = EMAILJS_LOCKED_CONFIG.TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = EMAILJS_LOCKED_CONFIG.PUBLIC_KEY;

export interface StoredOTP {
  email: string;
  codeHash: string;
  expiresAt: number; // 15-minute TTL
  attempts: number; // max 3 attempts
  lastSentAt: number; // 30s cooldown
}

const otpStore = new Map<string, StoredOTP>();

function writePendingOTPToStorage(record: StoredOTP): void {
  try {
    safeSetItem(PENDING_OTP_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Ignore storage write failure
  }
}

export function clearPendingEmailOTP(): void {
  otpStore.clear();
  try {
    safeRemoveItem(PENDING_OTP_STORAGE_KEY);
    safeRemoveItem(LEGACY_PENDING_OTP_STORAGE_KEY);
  } catch {
    // Ignore storage remove failure
  }
}

export function getPendingEmailOTP(): StoredOTP | null {
  try {
    const raw =
      safeGetItem(PENDING_OTP_STORAGE_KEY) ||
      safeGetItem(LEGACY_PENDING_OTP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredOTP>;
    if (!parsed || typeof parsed.email !== 'string' || typeof parsed.expiresAt !== 'number') {
      clearPendingEmailOTP();
      return null;
    }
    if (Date.now() >= parsed.expiresAt || (parsed.attempts ?? 0) >= 3) {
      clearPendingEmailOTP();
      return null;
    }
    return {
      email: parsed.email.trim().toLowerCase(),
      codeHash: typeof parsed.codeHash === 'string' ? parsed.codeHash : '',
      expiresAt: parsed.expiresAt,
      attempts: typeof parsed.attempts === 'number' ? parsed.attempts : 0,
      lastSentAt: typeof parsed.lastSentAt === 'number' ? parsed.lastSentAt : Date.now()
    };
  } catch {
    clearPendingEmailOTP();
    return null;
  }
}

async function hashOTP(email: string, code: string): Promise<string> {
  const input = `${email}:${code}:kifayat_otp_v1`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(input);
    const buf = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return `h_${Math.abs(hash)}`;
}

export function isEmailOTPConfigured(): boolean {
  return Boolean(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);
}

async function dispatchRealEmailViaEmailJS(
  toEmail: string,
  code: string,
  purpose: 'SIGNUP_OTP' | 'PASSWORD_RESET' | 'MASTER_PIN_RESET'
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(EMAILJS_LOCKED_CONFIG.ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          passcode: code,
          otp: code,
          otp_code: code,
          code,
          email: toEmail,
          to_email: toEmail,
          user_email: toEmail,
          purpose:
            purpose === 'SIGNUP_OTP'
              ? 'New Account Verification'
              : purpose === 'MASTER_PIN_RESET'
              ? 'Founder Master Control PIN Reset'
              : 'Password Reset'
        }
      })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: text || `Email delivery failed (${res.status}).` };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error sending verification email.'
    };
  }
}

export interface OTPRequestResult {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  mode?: 'EMAILJS_OTP';
  pendingRecord?: StoredOTP;
}

export async function requestEmailOTP(
  email: string,
  onOtpPrepared?: (record: StoredOTP) => void
): Promise<OTPRequestResult> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  const now = Date.now();
  const persistedPending = getPendingEmailOTP();
  const existing = otpStore.get(cleanEmail) || (persistedPending?.email === cleanEmail ? persistedPending : undefined);

  if (existing && now - existing.lastSentAt < OTP_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((OTP_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
    return {
      success: false,
      message: `Please wait ${remainingSeconds} seconds before requesting a new verification code.`,
      cooldownSeconds: remainingSeconds,
      pendingRecord: existing
    };
  }

  const cleanOtp = String(Math.floor(100000 + Math.random() * 900000)).trim();
  const delivery = await dispatchRealEmailViaEmailJS(cleanEmail, cleanOtp, 'SIGNUP_OTP');
  if (!delivery.ok) {
    return {
      success: false,
      message: delivery.error || 'Unable to send verification code to your email inbox. Please try again.'
    };
  }

  const codeHash = await hashOTP(cleanEmail, cleanOtp);
  const expiresAt = now + OTP_TTL_MS;

  const pendingRecord: StoredOTP = {
    email: cleanEmail,
    codeHash,
    expiresAt,
    attempts: 0,
    lastSentAt: now
  };

  otpStore.set(cleanEmail, pendingRecord);
  writePendingOTPToStorage(pendingRecord);
  if (onOtpPrepared) {
    onOtpPrepared(pendingRecord);
  }

  return {
    success: true,
    mode: 'EMAILJS_OTP',
    cooldownSeconds: OTP_COOLDOWN_SECONDS,
    message: `A 6-digit verification code has been sent to ${cleanEmail}. Please check your Gmail/Email Inbox and Spam folder.`,
    pendingRecord
  };
}

export const sendEmailOtp = requestEmailOTP;

export interface OTPVerifyResult {
  success: boolean;
  message: string;
  isSuperAdmin?: boolean;
  verifiedEmail?: string;
}

export async function verifyEmailOTP(
  email: string,
  otpInput: string,
  stateOtpRecord?: StoredOTP | null
): Promise<OTPVerifyResult> {
  const cleanEmail = email.trim().toLowerCase();
  const enteredOtp = String(otpInput || '').replace(/\D/g, '');
  const now = Date.now();

  if (enteredOtp.length !== 6) {
    return { success: false, message: 'Please enter the complete 6-digit verification code from your email.' };
  }

  const persisted = getPendingEmailOTP();
  const candidates: StoredOTP[] = [];
  if (cleanEmail && otpStore.get(cleanEmail)) candidates.push(otpStore.get(cleanEmail)!);
  if (persisted && (!cleanEmail || persisted.email === cleanEmail)) candidates.push(persisted);
  if (stateOtpRecord && (!cleanEmail || stateOtpRecord.email === cleanEmail)) candidates.push(stateOtpRecord);
  if (candidates.length === 0 && persisted && !cleanEmail) candidates.push(persisted);

  const saved = candidates.sort((a, b) => (b.lastSentAt || 0) - (a.lastSentAt || 0))[0];

  if (!saved) {
    return { success: false, message: 'No active verification code found. Please request a new code to your email.' };
  }

  const targetEmail = cleanEmail || saved.email;

  if (now >= saved.expiresAt) {
    otpStore.delete(targetEmail);
    clearPendingEmailOTP();
    return { success: false, message: 'Verification code has expired (15-minute limit). Please request a new code.' };
  }

  if (saved.attempts >= 3) {
    otpStore.delete(targetEmail);
    clearPendingEmailOTP();
    return { success: false, message: 'Too many incorrect attempts. Code invalidated for security.' };
  }

  const candidateHash = await hashOTP(targetEmail, enteredOtp);
  const matchesHash = Boolean(saved.codeHash && saved.codeHash === candidateHash);

  if (!matchesHash) {
    const updatedRecord: StoredOTP = { ...saved, attempts: saved.attempts + 1 };
    const remaining = 3 - updatedRecord.attempts;
    if (remaining <= 0) {
      otpStore.delete(targetEmail);
      clearPendingEmailOTP();
      return { success: false, message: 'Too many incorrect attempts. Code invalidated for security.' };
    }
    otpStore.set(targetEmail, updatedRecord);
    writePendingOTPToStorage(updatedRecord);
    return { success: false, message: `Incorrect verification code. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.` };
  }

  otpStore.delete(targetEmail);
  clearPendingEmailOTP();

  const isSuperAdmin = targetEmail === ROOT_SUPER_ADMIN_EMAIL.toLowerCase();

  return {
    success: true,
    message: 'Email verified successfully.',
    isSuperAdmin,
    verifiedEmail: targetEmail
  };
}

export const verifyEmailOtp = verifyEmailOTP;

export async function signInWithFirebaseEmailPassword(
  email: string,
  password: string
): Promise<{ success: boolean; user?: FirebaseUser; code?: string }> {
  const normEmail = email.trim().toLowerCase();
  const cleanPwd = password.trim();
  if (!normEmail || !cleanPwd) return { success: false };
  try {
    const cred = await signInWithEmailAndPassword(auth, normEmail, cleanPwd);
    return { success: true, user: cred.user };
  } catch (err: any) {
    return { success: false, code: err?.code };
  }
}

// ----------------------------------------------------
// Forgot Password / Real 6-Digit EmailJS OTP Only (30s Cooldown)
// Works for BOTH Regular Members and Founder (KC-ADM-001)
// ----------------------------------------------------
export const PENDING_RESET_STORAGE_KEY = 'kc_pending_password_reset';
const resetStore = new Map<string, StoredOTP>();

function writePendingResetToStorage(record: StoredOTP): void {
  try {
    safeSetItem(PENDING_RESET_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Ignore storage write failure
  }
}

export function clearPendingPasswordReset(): void {
  resetStore.clear();
  try {
    safeRemoveItem(PENDING_RESET_STORAGE_KEY);
  } catch {
    // Ignore storage remove failure
  }
}

export function getPendingPasswordReset(): StoredOTP | null {
  try {
    const raw = safeGetItem(PENDING_RESET_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredOTP>;
    if (!parsed || typeof parsed.email !== 'string' || typeof parsed.expiresAt !== 'number') {
      clearPendingPasswordReset();
      return null;
    }
    if (Date.now() > parsed.expiresAt || (parsed.attempts ?? 0) >= 3) {
      clearPendingPasswordReset();
      return null;
    }
    return {
      email: parsed.email.trim().toLowerCase(),
      codeHash: typeof parsed.codeHash === 'string' ? parsed.codeHash : '',
      expiresAt: parsed.expiresAt,
      attempts: typeof parsed.attempts === 'number' ? parsed.attempts : 0,
      lastSentAt: typeof parsed.lastSentAt === 'number' ? parsed.lastSentAt : Date.now()
    };
  } catch {
    clearPendingPasswordReset();
    return null;
  }
}

export async function requestPasswordReset(emailOrIdentifier: string): Promise<OTPRequestResult> {
  const rawInput = emailOrIdentifier.trim();
  if (!rawInput) {
    return { success: false, message: 'Please enter your registered email address, CNIC, or Member ID.' };
  }

  let normEmail = rawInput.toLowerCase();
  if (rawInput.toUpperCase() === 'KC-ADM-001') {
    normEmail = ROOT_SUPER_ADMIN_EMAIL.toLowerCase();
  } else if (!normEmail.includes('@')) {
    const matched = await findExistingFirestoreUserByIdentifier(rawInput).catch(() => null);
    if (!matched?.email) {
      return { success: false, message: 'No registered email found for that CNIC or Member ID.' };
    }
    normEmail = matched.email.trim().toLowerCase();
  }

  const now = Date.now();
  const persistedPending = getPendingPasswordReset();
  const existing = resetStore.get(normEmail) || (persistedPending?.email === normEmail ? persistedPending : undefined);

  if (existing && now - existing.lastSentAt < OTP_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((OTP_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
    return {
      success: false,
      message: `Please wait ${remainingSeconds} seconds before requesting another reset code.`,
      cooldownSeconds: remainingSeconds,
      pendingRecord: existing
    };
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const delivery = await dispatchRealEmailViaEmailJS(normEmail, otpCode, 'PASSWORD_RESET');
  if (!delivery.ok) {
    return {
      success: false,
      message: delivery.error || 'Unable to send password reset code to your email inbox.'
    };
  }

  const codeHash = await hashOTP(normEmail, `reset:${otpCode}`);
  const pendingRecord: StoredOTP = {
    email: normEmail,
    codeHash,
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    lastSentAt: now
  };
  resetStore.set(normEmail, pendingRecord);
  writePendingResetToStorage(pendingRecord);

  return {
    success: true,
    mode: 'EMAILJS_OTP',
    cooldownSeconds: OTP_COOLDOWN_SECONDS,
    pendingRecord,
    message: `A 6-digit password reset code has been sent to ${normEmail}. Please check your Gmail/Email Inbox and Spam folder.`
  };
}

export async function verifyPasswordReset(
  emailOrIdentifier: string,
  code: string,
  newPassword: string
): Promise<OTPVerifyResult> {
  const rawInput = emailOrIdentifier.trim();
  const cleanCode = String(code || '').replace(/\D/g, '');
  const cleanPassword = newPassword.trim();
  const now = Date.now();

  if (cleanCode.length !== 6) {
    return { success: false, message: 'Please enter the 6-digit reset code from your Gmail/Email inbox.' };
  }

  if (cleanPassword.length < 6) {
    return { success: false, message: 'New password must be at least 6 characters long.' };
  }

  const persisted = getPendingPasswordReset();
  let normEmail = rawInput.toLowerCase();
  if (rawInput.toUpperCase() === 'KC-ADM-001') {
    normEmail = ROOT_SUPER_ADMIN_EMAIL.toLowerCase();
  } else if (!normEmail.includes('@')) {
    if (persisted?.email) {
      normEmail = persisted.email;
    } else {
      const matched = await findExistingFirestoreUserByIdentifier(rawInput).catch(() => null);
      if (matched?.email) normEmail = matched.email.trim().toLowerCase();
    }
  }

  let record = resetStore.get(normEmail);
  if (!record && persisted && (!normEmail || persisted.email === normEmail)) {
    record = persisted;
    normEmail = persisted.email;
    resetStore.set(normEmail, persisted);
  }

  if (!record || !record.codeHash) {
    return { success: false, message: 'No active password reset code found. Please request a new 6-digit code to your email.' };
  }

  if (now > record.expiresAt) {
    resetStore.delete(normEmail);
    clearPendingPasswordReset();
    return { success: false, message: 'Reset code has expired (15-minute limit). Please request a new code.' };
  }

  if (record.attempts >= 3) {
    resetStore.delete(normEmail);
    clearPendingPasswordReset();
    return { success: false, message: 'Too many incorrect attempts. Reset code invalidated for security.' };
  }

  const candidateHash = await hashOTP(normEmail, `reset:${cleanCode}`);
  const matchesHash = record.codeHash === candidateHash;

  if (!matchesHash) {
    record.attempts += 1;
    const remaining = 3 - record.attempts;
    if (remaining <= 0) {
      resetStore.delete(normEmail);
      clearPendingPasswordReset();
      return { success: false, message: 'Too many incorrect attempts. Reset code invalidated for security.' };
    }
    resetStore.set(normEmail, record);
    writePendingResetToStorage(record);
    return { success: false, message: `Incorrect reset code. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.` };
  }

  resetStore.delete(normEmail);
  clearPendingPasswordReset();

  const newPasswordHash = await saveLocalPasswordCredential(normEmail, cleanPassword);
  try {
    await tryEnsureSessionBestEffort();
    const remoteUser = await findExistingFirestoreUserByEmail(normEmail);
    const targetDocId =
      remoteUser?.id ||
      (normEmail === ROOT_SUPER_ADMIN_EMAIL.toLowerCase() ? 'usr_super_admin' : null);
    if (targetDocId) {
      await setDoc(
        doc(db, 'users', targetDocId),
        { passwordHash: newPasswordHash, hasPassword: true, otpVerifiedOnce: true },
        { merge: true }
      );
    }
  } catch {
    // Non-blocking cloud sync fallback
  }

  return {
    success: true,
    message: 'Reset code verified and password updated. Entering your Dashboard...',
    verifiedEmail: normEmail
  };
}

// ----------------------------------------------------
// Founder Master Control PIN Reset via Real 6-Digit EmailJS OTP
// ----------------------------------------------------
export const PENDING_MASTER_PIN_RESET_KEY = 'kc_pending_master_pin_reset';
const masterPinResetStore = new Map<string, StoredOTP>();

export function clearPendingMasterPinReset(): void {
  masterPinResetStore.clear();
  try {
    safeRemoveItem(PENDING_MASTER_PIN_RESET_KEY);
  } catch {
    // Ignore
  }
}

export function getPendingMasterPinReset(): StoredOTP | null {
  try {
    const raw = safeGetItem(PENDING_MASTER_PIN_RESET_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredOTP>;
    if (!parsed || typeof parsed.email !== 'string' || typeof parsed.expiresAt !== 'number') {
      clearPendingMasterPinReset();
      return null;
    }
    if (Date.now() > parsed.expiresAt || (parsed.attempts ?? 0) >= 3) {
      clearPendingMasterPinReset();
      return null;
    }
    return {
      email: parsed.email.trim().toLowerCase(),
      codeHash: typeof parsed.codeHash === 'string' ? parsed.codeHash : '',
      expiresAt: parsed.expiresAt,
      attempts: typeof parsed.attempts === 'number' ? parsed.attempts : 0,
      lastSentAt: typeof parsed.lastSentAt === 'number' ? parsed.lastSentAt : Date.now()
    };
  } catch {
    clearPendingMasterPinReset();
    return null;
  }
}

export async function requestMasterPinResetOTP(founderEmail: string): Promise<OTPRequestResult> {
  const normEmail = (founderEmail || ROOT_SUPER_ADMIN_EMAIL).trim().toLowerCase();
  if (!normEmail || !normEmail.includes('@')) {
    return { success: false, message: 'Founder email address is required.' };
  }

  const now = Date.now();
  const persisted = getPendingMasterPinReset();
  const existing = masterPinResetStore.get(normEmail) || (persisted?.email === normEmail ? persisted : undefined);
  if (existing && now - existing.lastSentAt < OTP_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((OTP_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
    return {
      success: false,
      message: `Please wait ${remainingSeconds} seconds before requesting another PIN reset code.`,
      cooldownSeconds: remainingSeconds,
      pendingRecord: existing
    };
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const delivery = await dispatchRealEmailViaEmailJS(normEmail, otpCode, 'MASTER_PIN_RESET');
  if (!delivery.ok) {
    return {
      success: false,
      message: delivery.error || 'Unable to send Master PIN reset code to your Gmail inbox.'
    };
  }

  const codeHash = await hashOTP(normEmail, `master_pin_reset:${otpCode}`);
  const pendingRecord: StoredOTP = {
    email: normEmail,
    codeHash,
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    lastSentAt: now
  };
  masterPinResetStore.set(normEmail, pendingRecord);
  try {
    safeSetItem(PENDING_MASTER_PIN_RESET_KEY, JSON.stringify(pendingRecord));
  } catch {
    // Ignore storage write failure
  }

  return {
    success: true,
    mode: 'EMAILJS_OTP',
    cooldownSeconds: OTP_COOLDOWN_SECONDS,
    pendingRecord,
    message: `A 6-digit Master Control PIN reset code has been sent to ${normEmail}. Check your Gmail/Email Inbox (and Spam folder).`
  };
}

export async function verifyMasterPinResetOTP(
  founderEmail: string,
  otpInput: string
): Promise<OTPVerifyResult> {
  const normEmail = (founderEmail || ROOT_SUPER_ADMIN_EMAIL).trim().toLowerCase();
  const cleanCode = String(otpInput || '').replace(/\D/g, '');
  const now = Date.now();

  if (cleanCode.length !== 6) {
    return { success: false, message: 'Please enter the 6-digit OTP code from your Gmail inbox.' };
  }

  const persisted = getPendingMasterPinReset();
  let record = masterPinResetStore.get(normEmail);
  if (!record && persisted && persisted.email === normEmail) {
    record = persisted;
    masterPinResetStore.set(normEmail, persisted);
  }

  if (!record || !record.codeHash) {
    return { success: false, message: 'No active PIN reset OTP found. Please request a new code to your Gmail inbox.' };
  }

  if (now > record.expiresAt) {
    clearPendingMasterPinReset();
    return { success: false, message: 'PIN reset code has expired. Please request a new code.' };
  }

  if (record.attempts >= 3) {
    clearPendingMasterPinReset();
    return { success: false, message: 'Too many incorrect attempts. Code invalidated for security.' };
  }

  const candidateHash = await hashOTP(normEmail, `master_pin_reset:${cleanCode}`);
  if (record.codeHash !== candidateHash) {
    const updated: StoredOTP = { ...record, attempts: record.attempts + 1 };
    const remaining = 3 - updated.attempts;
    if (remaining <= 0) {
      clearPendingMasterPinReset();
      return { success: false, message: 'Too many incorrect attempts. Code invalidated for security.' };
    }
    masterPinResetStore.set(normEmail, updated);
    try {
      safeSetItem(PENDING_MASTER_PIN_RESET_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
    return { success: false, message: `Incorrect OTP code. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.` };
  }

  clearPendingMasterPinReset();
  return { success: true, message: 'OTP verified.', verifiedEmail: normEmail };
}

// ----------------------------------------------------
// Salted SHA-256 Cloud + Local Password & Master PIN Credentials Store
// ----------------------------------------------------
const CREDENTIALS_STORAGE_KEY = 'kc_user_credentials_v1';

interface StoredCredentialEntry {
  passwordHash: string;
  updatedAt: number;
}

export async function hashSecretString(secret: string, salt = 'kifayat_sec_v1'): Promise<string> {
  return hashOTP(salt.trim().toLowerCase(), secret);
}

export async function computeUserPasswordHash(email: string, password: string): Promise<string> {
  const norm = email.trim().toLowerCase();
  return hashOTP(norm, `pwd:${password.trim()}`);
}

function readCredentialsMap(): Record<string, StoredCredentialEntry> {
  try {
    const raw = safeGetItem(CREDENTIALS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, StoredCredentialEntry>;
  } catch {
    return {};
  }
}

export function mirrorPasswordHashToLocalStorage(email: string, passwordHash: string): void {
  const norm = email.trim().toLowerCase();
  if (!norm || !passwordHash) return;
  try {
    const map = readCredentialsMap();
    map[norm] = { passwordHash, updatedAt: Date.now() };
    safeSetItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage write failure
  }
}

export function hasLocalPasswordCredential(email: string): boolean {
  const norm = email.trim().toLowerCase();
  if (!norm) return false;
  const map = readCredentialsMap();
  return Boolean(map[norm]?.passwordHash);
}

export async function saveLocalPasswordCredential(email: string, password: string): Promise<string> {
  const norm = email.trim().toLowerCase();
  if (!norm || !password) return '';
  const passwordHash = await computeUserPasswordHash(norm, password);
  try {
    const map = readCredentialsMap();
    map[norm] = { passwordHash, updatedAt: Date.now() };
    safeSetItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(map));

    // Also mirror into legacy recovery key for seamless cross-flow compatibility
    const emailHash = await hashOTP(norm, 'identity');
    safeSetItem(
      `kc_recovery_credential_${emailHash}`,
      JSON.stringify({ passwordHash, updatedAt: Date.now() })
    );
  } catch {
    // Non-blocking storage write
  }
  return passwordHash;
}

export async function verifyLocalPasswordCredential(
  email: string,
  password: string,
  cloudPasswordHash?: string
): Promise<boolean> {
  const norm = email.trim().toLowerCase();
  const cleanPwd = password.trim();
  if (!norm || !cleanPwd) return false;
  const candidateHash = await computeUserPasswordHash(norm, cleanPwd);

  // 1. Check authoritative Cloud Firestore hash first (survives app uninstall / new device!)
  if (cloudPasswordHash && cloudPasswordHash === candidateHash) {
    mirrorPasswordHashToLocalStorage(norm, cloudPasswordHash);
    return true;
  }

  // 2. Fallback to local credentials store
  const map = readCredentialsMap();
  if (map[norm]?.passwordHash && map[norm].passwordHash === candidateHash) {
    return true;
  }
  try {
    const emailHash = await hashOTP(norm, 'identity');
    const legacyRaw = safeGetItem(`kc_recovery_credential_${emailHash}`);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as { passwordHash?: string };
      if (legacy?.passwordHash === candidateHash) {
        map[norm] = { passwordHash: candidateHash, updatedAt: Date.now() };
        safeSetItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(map));
        return true;
      }
    }
  } catch {
    // Ignore parse error
  }
  return false;
}

// ----------------------------------------------------
// Firestore Database Synchronization Methods
// ----------------------------------------------------
function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(item => stripUndefinedDeep(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
      if (v !== undefined) {
        out[k] = stripUndefinedDeep(v);
      }
    });
    return out as T;
  }
  return value;
}

export function resolveUserApprovalStatus(user: Partial<User>): 'approved' | 'rejected' | 'pending' {
  if (user.isFounder || user.email?.trim().toLowerCase() === ROOT_SUPER_ADMIN_EMAIL.toLowerCase()) {
    return 'approved';
  }
  if (user.approvalStatus === 'approved' || user.status === 'approved') {
    return 'approved';
  }
  if (user.approvalStatus === 'rejected' || user.status === 'rejected' || user.membershipStatus === 'REJECTED') {
    return 'rejected';
  }
  if (
    user.approvalStatus === 'pending' ||
    user.status === 'pending' ||
    user.verificationStatus === 'PENDING' ||
    user.membershipStatus === 'PENDING_DISTRICT_REVIEW' ||
    user.membershipStatus === 'PENDING_REGIONAL_REVIEW' ||
    user.membershipStatus === 'RECOMMENDED_BY_DISTRICT' ||
    user.membershipStatus === 'RECOMMENDED_BY_REGION'
  ) {
    return 'pending';
  }
  return 'approved';
}

export function normalizeUserForCloud(
  user: User,
  options?: { isOnline?: boolean }
): Record<string, unknown> {
  const photo = user.photoUrl || user.avatarUrl || user.avatar || '';
  const memId = user.memberId || user.membershipId || '';
  const onlineFlag = options?.isOnline !== undefined ? options.isOnline : Boolean(user.isOnline);
  const resolvedApproval = resolveUserApprovalStatus(user);
  const nowIso = new Date().toISOString();
  const provinceVal = user.stateProvince || user.province || 'Punjab';
  return stripUndefinedDeep({
    ...user,
    email: (user.email || '').trim().toLowerCase(),
    uid: user.id,
    memberId: memId,
    membershipId: memId,
    photoUrl: photo,
    avatarUrl: photo,
    province: provinceVal,
    stateProvince: provinceVal,
    city: user.cityTown,
    uc: user.unionCouncil,
    isOnline: onlineFlag,
    lastActiveAt: onlineFlag
      ? (typeof user.lastActiveAt === 'number' && user.lastActiveAt > 0 ? user.lastActiveAt : Date.now())
      : 0,
    approvalStatus: resolvedApproval,
    status: resolvedApproval,
    profileCompleted: Boolean(user.profileCompleted),
    lastLoginAt: user.lastLoginAt || nowIso,
    isAuditOfficer: Boolean(user.isAuditOfficer),
    isMutedInChat: Boolean(user.isMutedInChat),
    createdAt: toIsoTimestamp(user.createdAt, user.joinDate || nowIso)
  });
}

export function isUserActuallyOnline(
  user?: Partial<User> | null,
  nowMs = Date.now()
): boolean {
  if (!user) return false;
  const lastActive = Number(user.lastActiveAt);
  return Boolean(
    user.isOnline &&
    user.lastActiveAt &&
    Number.isFinite(lastActive) &&
    lastActive > 0 &&
    nowMs - lastActive < 30000
  );
}

export function isUserEffectivelyOnline(
  user?: Partial<User> | null,
  _currentUserId?: string | null,
  nowMs = Date.now()
): boolean {
  return isUserActuallyOnline(user, nowMs);
}

async function tryEnsureSessionBestEffort(): Promise<void> {
  if (!auth.currentUser) {
    await ensureFirebaseAuthSession().catch(() => null);
  }
}

export async function saveUserToFirestore(
  user: User,
  options?: { isOnline?: boolean; useServerLastSeen?: boolean }
): Promise<void> {
  await tryEnsureSessionBestEffort();
  const path = `users/${user.id}`;
  const cloudPayload = normalizeUserForCloud(user, { isOnline: options?.isOnline });
  // Zero-Overwrite Lock: Never wipe existing cloud values (photo, CNIC, phone, tabbar, passwordHash) with blank strings
  const protectedStringFields = [
    'photoUrl',
    'avatarUrl',
    'avatar',
    'cnic',
    'phone',
    'address',
    'unionCouncil',
    'tabbarId',
    'tabbarUrdu',
    'tabbarEnglish',
    'passwordHash',
    'membershipId',
    'memberId'
  ];
  protectedStringFields.forEach((field) => {
    const val = cloudPayload[field];
    if (val === '' || val === null || val === undefined) {
      delete cloudPayload[field];
    }
  });
  if (cloudPayload.profileCompleted === false) {
    delete cloudPayload.profileCompleted;
  }
  if (options?.useServerLastSeen !== false) {
    cloudPayload.lastSeen = serverTimestamp();
  }
  try {
    await setDoc(doc(db, 'users', user.id), cloudPayload, { merge: true });
  } catch (err) {
    console.warn(`Firestore user write warning (${path}):`, err);
  }
}

export async function deleteUserPermanentlyFromFirestore(
  actorUser: User | null | undefined,
  targetUser: User
): Promise<{ success: boolean; error?: string }> {
  const actorIsFounder = Boolean(
    actorUser &&
    actorUser.isFounder &&
    actorUser.email?.trim().toLowerCase() === ROOT_SUPER_ADMIN_EMAIL.toLowerCase()
  );
  if (!actorIsFounder) {
    return {
      success: false,
      error: 'Zero-Deletion Lock: Only the Main Super Admin (Founder) can permanently delete a user record.'
    };
  }
  const targetIsFounder = Boolean(
    targetUser.isFounder ||
    targetUser.email?.trim().toLowerCase() === ROOT_SUPER_ADMIN_EMAIL.toLowerCase() ||
    targetUser.id === 'usr_super_admin'
  );
  if (targetIsFounder) {
    return {
      success: false,
      error: 'Founder Protection: The Main Super Admin (Founder) account cannot be deleted.'
    };
  }

  await tryEnsureSessionBestEffort();
  const normEmail = (targetUser.email || '').trim().toLowerCase();
  const idsToDelete = new Set<string>([targetUser.id]);
  if (normEmail) {
    idsToDelete.add(buildSafeEmailUserId(normEmail));
    idsToDelete.add(normEmail);
  }

  try {
    if (normEmail) {
      const q = query(collection(db, 'users'), where('email', '==', normEmail));
      const snap = await getDocs(q).catch(() => null);
      snap?.forEach(d => {
        const data = d.data() as Partial<User>;
        if (!data.isFounder && data.email?.toLowerCase() !== ROOT_SUPER_ADMIN_EMAIL.toLowerCase()) {
          idsToDelete.add(d.id);
        }
      });
    }

    let deletedPrimary = false;
    for (const docId of idsToDelete) {
      try {
        await deleteDoc(doc(db, 'users', docId));
        if (docId === targetUser.id) deletedPrimary = true;
      } catch (err) {
        if (docId === targetUser.id && !deletedPrimary) {
          throw err;
        }
      }
    }
    return { success: true };
  } catch (err) {
    console.warn(`Firestore permanent delete failed for users/${targetUser.id}:`, err);
    return {
      success: false,
      error:
        err instanceof Error && err.message.includes('permission')
          ? 'Firestore security rules require Google-verified Founder session to permanently erase cloud records. Please sign in with Google as Founder or check rules.'
          : err instanceof Error
          ? err.message
          : 'Unable to delete user document from Firestore.'
    };
  }
}

export async function approveOrRejectUserInFirestore(
  user: User,
  decision: { approved: boolean; actorName: string; reason?: string }
): Promise<void> {
  await tryEnsureSessionBestEffort();
  const nowIso = new Date().toISOString();
  const approvalPayload = decision.approved
    ? {
        status: 'approved',
        approvalStatus: 'approved',
        approvedBy: decision.actorName,
        approvedAt: nowIso,
        membershipStatus: 'ACTIVE',
        verificationStatus: 'VERIFIED'
      }
    : {
        status: 'rejected',
        approvalStatus: 'rejected',
        rejectedBy: decision.actorName,
        rejectedAt: nowIso,
        rejectionReason: decision.reason || 'Rejected by administration.',
        membershipStatus: 'REJECTED',
        verificationStatus: 'UNVERIFIED'
      };
  try {
    await setDoc(
      doc(db, 'users', user.id),
      {
        ...normalizeUserForCloud(user),
        ...approvalPayload
      },
      { merge: true }
    );
  } catch (err) {
    console.warn(`Firestore approval write warning (users/${user.id}):`, err);
  }
}

export async function updateUserPresenceInFirestore(
  user: User,
  isOnline: boolean,
  nowMs = Date.now()
): Promise<void> {
  await tryEnsureSessionBestEffort();
  const payload = {
    isOnline,
    lastActiveAt: isOnline ? nowMs : 0,
    lastSeen: serverTimestamp()
  };
  try {
    await updateDoc(doc(db, 'users', user.id), payload);
  } catch {
    try {
      await setDoc(
        doc(db, 'users', user.id),
        {
          ...normalizeUserForCloud({ ...user, lastActiveAt: isOnline ? nowMs : 0 }, { isOnline }),
          ...payload
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore presence write warning:', err);
    }
  }
}

export async function markUserOfflineInFirestore(user: User): Promise<void> {
  await updateUserPresenceInFirestore(user, false, 0);
}

export async function fetchAllUsersFromFirestore(): Promise<User[]> {
  try {
    await tryEnsureSessionBestEffort();
    const snap = await getDocs(collection(db, 'users'));
    const list: User[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data() as Partial<User>;
      list.push({ ...data, id: data.id || docSnap.id } as User);
    });
    return list;
  } catch (err) {
    console.warn('Firestore users directory fetch warning:', err);
    return [];
  }
}

export async function generateAtomicSerialNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const counterDocId = `serial_kc_${year}`;
  const localKey = `kc_local_serial_counter_${year}`;
  const formatSerial = (num: number): string => `KC-${year}-${String(num).padStart(4, '0')}`;

  try {
    await tryEnsureSessionBestEffort();
    const counterRef = doc(db, 'counters', counterDocId);
    const txPromise = runTransaction(db, async (tx) => {
      const snap = await tx.get(counterRef);
      const nowIso = new Date().toISOString();
      if (!snap.exists()) {
        const seq = 1;
        const serial = formatSerial(seq);
        tx.set(counterRef, {
          id: counterDocId,
          year,
          nextNumber: 2,
          lastSerial: serial,
          updatedAt: nowIso
        });
        return { seq, serial };
      }
      const data = snap.data() as { nextNumber?: number };
      const currentNext = Number(data?.nextNumber);
      const seq = Number.isFinite(currentNext) && currentNext >= 2 ? Math.floor(currentNext) : 2;
      const serial = formatSerial(seq);
      tx.update(counterRef, {
        nextNumber: seq + 1,
        lastSerial: serial,
        updatedAt: nowIso
      });
      return { seq, serial };
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Counter transaction timeout')), 5500);
    });

    const result = await Promise.race([txPromise, timeoutPromise]);
    const localStored = Number(safeGetItem(localKey) || '1');
    const nextLocal = Math.max(Number.isFinite(localStored) ? localStored : 1, result.seq + 1);
    safeSetItem(localKey, String(nextLocal));
    return result.serial;
  } catch (err) {
    console.warn('Atomic Firestore counter fallback to local monotonic sequence:', err);
    const rawLocal = Number(safeGetItem(localKey) || '1');
    const seq = Number.isFinite(rawLocal) && rawLocal >= 1 ? Math.floor(rawLocal) : 1;
    safeSetItem(localKey, String(seq + 1));
    return formatSerial(seq);
  }
}

export async function saveApplicationToFirestore(app: MembershipApplication): Promise<void> {
  await tryEnsureSessionBestEffort();
  try {
    await setDoc(doc(db, 'applications', app.id), stripUndefinedDeep(app), { merge: true });
  } catch (err) {
    console.warn(`Firestore application write warning (applications/${app.id}):`, err);
  }
}

export async function savePaymentToFirestore(payment: PaymentTransaction): Promise<void> {
  await tryEnsureSessionBestEffort();
  try {
    await setDoc(doc(db, 'payments', payment.id), stripUndefinedDeep(payment), { merge: true });
  } catch (err) {
    console.warn(`Firestore payment write warning (payments/${payment.id}):`, err);
  }
}

export async function saveComplaintToFirestore(complaint: Complaint): Promise<void> {
  await tryEnsureSessionBestEffort();
  try {
    await setDoc(doc(db, 'complaints', complaint.id), stripUndefinedDeep(complaint), { merge: true });
  } catch (err) {
    console.warn(`Firestore complaint write warning (complaints/${complaint.id}):`, err);
  }
}

export async function saveAnnouncementToFirestore(announcement: Announcement): Promise<void> {
  await tryEnsureSessionBestEffort();
  try {
    await setDoc(doc(db, 'announcements', announcement.id), stripUndefinedDeep(announcement), { merge: true });
  } catch (err) {
    console.warn(`Firestore announcement write warning (announcements/${announcement.id}):`, err);
  }
}

export async function deleteAnnouncementFromFirestore(announcementId: string): Promise<void> {
  await tryEnsureSessionBestEffort();
  try {
    await deleteDoc(doc(db, 'announcements', announcementId));
  } catch (err) {
    console.warn(`Firestore announcement delete warning (announcements/${announcementId}):`, err);
  }
}

export async function saveAuditLogToFirestore(log: AuditLog): Promise<void> {
  await tryEnsureSessionBestEffort();
  try {
    await setDoc(doc(db, 'audit_logs', log.id), stripUndefinedDeep(log));
  } catch (err) {
    console.warn(`Firestore audit log write warning (audit_logs/${log.id}):`, err);
  }
}

export async function saveNotificationToFirestore(notif: AppNotification): Promise<void> {
  await tryEnsureSessionBestEffort();
  try {
    await setDoc(
      doc(db, 'notifications', notif.id),
      {
        ...stripUndefinedDeep(notif),
        createdAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (err) {
    console.warn(`Firestore notification write warning (notifications/${notif.id}):`, err);
  }
}

export async function sendApprovalRequestNotificationToFirestore(
  user: User,
  notifId?: string
): Promise<AppNotification> {
  const nowIso = new Date().toISOString();
  const id = notifId || `notif_approval_${user.id}_${Date.now()}`;
  const notif: AppNotification = {
    id,
    type: 'approval_request',
    targetRole: 'Super Admin',
    title: `Approval Request: ${user.name}`,
    message: `${user.name} (${user.district || 'Pakistan'}) — New profile awaiting approval`,
    memberId: user.membershipId || user.memberId || user.id,
    memberUid: user.id,
    memberName: user.name,
    memberEmail: user.email,
    district: user.district || user.stateProvince || 'Pakistan',
    read: false,
    timestamp: nowIso,
    linkTab: 'members',
    entityId: user.id
  };
  await saveNotificationToFirestore(notif);
  return notif;
}

export async function saveOfficeBearerToFirestore(ob: OfficeBearer): Promise<void> {
  await tryEnsureSessionBestEffort();
  try {
    await setDoc(doc(db, 'office_bearers', ob.id), stripUndefinedDeep(ob), { merge: true });
  } catch (err) {
    console.warn(`Firestore office bearer write warning (office_bearers/${ob.id}):`, err);
  }
}

export async function saveOfficeBearerHistoryToFirestore(obh: OfficeBearerHistory): Promise<void> {
  await tryEnsureSessionBestEffort();
  try {
    await setDoc(doc(db, 'office_bearer_history', obh.id), stripUndefinedDeep(obh));
  } catch (err) {
    console.warn(`Firestore office bearer history write warning:`, err);
  }
}

export async function saveAppUpdateToFirestore(update: AppUpdate): Promise<void> {
  await tryEnsureSessionBestEffort();
  try {
    await setDoc(doc(db, 'app_updates', update.id), stripUndefinedDeep(update), { merge: true });
  } catch (err) {
    console.warn(`Firestore app update write warning:`, err);
  }
}

export async function saveAppSettingsToFirestore(settings: AppSettings): Promise<void> {
  await tryEnsureSessionBestEffort();
  try {
    await setDoc(doc(db, 'app_settings', 'global'), stripUndefinedDeep(settings), { merge: true });
  } catch (err) {
    console.warn(`Firestore app settings write warning:`, err);
  }
}

export async function saveChatMessageToFirestore(msg: ChatMessage): Promise<void> {
  await tryEnsureSessionBestEffort();
  const participants = msg.participants || [msg.senderId, msg.recipientId].sort();
  const payload = {
    ...stripUndefinedDeep({
      ...msg,
      participants,
      createdAt: msg.createdAt || msg.timestamp || new Date().toISOString()
    }),
    serverCreatedAt: serverTimestamp()
  };
  await Promise.all([
    setDoc(doc(db, 'direct_messages', msg.id), payload, { merge: true }).catch(err => {
      console.warn(`Firestore direct_messages write warning (direct_messages/${msg.id}):`, err);
    }),
    setDoc(doc(db, 'chat_messages', msg.id), payload, { merge: true }).catch(err => {
      console.warn(`Firestore chat_messages mirror warning (chat_messages/${msg.id}):`, err);
    })
  ]);
}

export async function saveCommunityMessageToFirestore(msg: ChatMessage): Promise<void> {
  await tryEnsureSessionBestEffort();
  const payload = {
    ...stripUndefinedDeep({
      ...msg,
      createdAt: msg.createdAt || msg.timestamp || new Date().toISOString()
    }),
    serverCreatedAt: serverTimestamp()
  };
  await Promise.all([
    setDoc(doc(db, 'community_messages', msg.id), payload, { merge: true }).catch(err => {
      console.warn(`Firestore community_messages write warning (community_messages/${msg.id}):`, err);
    }),
    setDoc(doc(db, 'community_chat_messages', msg.id), payload, { merge: true }).catch(err => {
      console.warn(`Firestore community_chat_messages mirror warning:`, err);
    })
  ]);
}

export async function deleteCommunityMessageFromFirestore(messageId: string): Promise<void> {
  await tryEnsureSessionBestEffort();
  try {
    await Promise.all([
      deleteDoc(doc(db, 'community_messages', messageId)),
      deleteDoc(doc(db, 'community_chat_messages', messageId))
    ]);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `community_messages/${messageId}`);
  }
}

export async function deleteAllCommunityMessagesFromFirestore(): Promise<void> {
  await tryEnsureSessionBestEffort();
  try {
    const [primarySnap, legacySnap] = await Promise.all([
      getDocs(collection(db, 'community_messages')),
      getDocs(collection(db, 'community_chat_messages'))
    ]);
    const deleteTasks: Promise<void>[] = [];
    primarySnap.forEach((docSnap) => {
      deleteTasks.push(deleteDoc(doc(db, 'community_messages', docSnap.id)));
    });
    legacySnap.forEach((docSnap) => {
      deleteTasks.push(deleteDoc(doc(db, 'community_chat_messages', docSnap.id)));
    });
    if (deleteTasks.length > 0) {
      await Promise.all(deleteTasks);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'community_messages');
  }
}

export async function overwriteDeletedCommunityMessageInFirestore(msg: ChatMessage): Promise<void> {
  await tryEnsureSessionBestEffort();
  const deletedByLabel =
    msg.deletedBy || (msg.deletedByFounder ? 'Founder' : (msg.deletedByRole || 'MEMBER'));
  const updatePayload = {
    id: msg.id,
    chatId: msg.chatId || 'community_global_room',
    roomType: 'COMMUNITY' as const,
    senderId: msg.senderId,
    senderName: msg.senderName || 'Member',
    senderRole: msg.senderRole || 'MEMBER',
    senderIsFounder: Boolean(msg.senderIsFounder),
    timestamp: msg.timestamp || new Date().toISOString(),
    createdAt: msg.createdAt || msg.timestamp || new Date().toISOString(),
    text: '',
    imageUrl: '',
    audioUrl: '',
    media: null,
    attachmentUrl: '',
    attachmentName: '',
    attachmentType: null,
    voiceNote: null,
    islamicGifId: '',
    replyTo: null,
    reactions: {},
    isPinned: false,
    isHighlighted: false,
    isDeleted: true,
    isDeletedForEveryone: true,
    deletedBy: deletedByLabel,
    deletedByRole: msg.deletedByRole || 'MEMBER',
    deletedByFounder: Boolean(msg.deletedByFounder),
    deletedAt: msg.deletedAt || new Date().toISOString()
  };

  let primaryNotFound = false;
  let legacyUpdated = false;

  try {
    await updateDoc(doc(db, 'community_messages', msg.id), updatePayload);
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'not-found') {
      primaryNotFound = true;
    } else {
      handleFirestoreError(err, OperationType.UPDATE, `community_messages/${msg.id}`);
    }
  }

  try {
    await updateDoc(doc(db, 'community_chat_messages', msg.id), updatePayload);
    legacyUpdated = true;
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code !== 'not-found') {
      handleFirestoreError(err, OperationType.UPDATE, `community_chat_messages/${msg.id}`);
    }
  }

  if (primaryNotFound && !legacyUpdated) {
    try {
      await setDoc(doc(db, 'community_messages', msg.id), updatePayload, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `community_messages/${msg.id}`);
    }
  }
}

export async function hideCommunityMessageForUserInFirestore(messageId: string, userId: string): Promise<void> {
  await tryEnsureSessionBestEffort();
  const hideInCol = async (colName: string) => {
    try {
      await updateDoc(doc(db, colName, messageId), { hiddenForUsers: arrayUnion(userId) });
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== 'not-found') {
        console.warn(`Firestore hide community message warning (${colName}/${messageId}):`, err);
      }
    }
  };
  await Promise.all([
    hideInCol('community_messages'),
    hideInCol('community_chat_messages')
  ]);
}

export async function deleteDirectMessageFromFirestore(messageId: string): Promise<void> {
  await tryEnsureSessionBestEffort();
  await Promise.all([
    deleteDoc(doc(db, 'direct_messages', messageId)).catch(() => {}),
    deleteDoc(doc(db, 'chat_messages', messageId)).catch(() => {})
  ]);
}

export async function overwriteDeletedDirectMessageInFirestore(msg: ChatMessage): Promise<void> {
  await tryEnsureSessionBestEffort();
  const participants = msg.participants || [msg.senderId, msg.recipientId].sort();
  const payload = {
    id: msg.id,
    chatId: msg.chatId,
    senderId: msg.senderId,
    recipientId: msg.recipientId,
    participants,
    timestamp: msg.timestamp || new Date().toISOString(),
    createdAt: msg.createdAt || msg.timestamp || new Date().toISOString(),
    text: '',
    attachmentUrl: '',
    attachmentName: '',
    attachmentType: null,
    voiceNote: null,
    islamicGifId: '',
    replyTo: null,
    reactions: {},
    isDeleted: false,
    isDeletedForEveryone: true,
    deletedByRole: msg.deletedByRole || 'MEMBER',
    deletedByFounder: Boolean(msg.deletedByFounder),
    deletedAt: msg.deletedAt || new Date().toISOString()
  };
  await Promise.all([
    setDoc(doc(db, 'direct_messages', msg.id), payload, { merge: true }).catch(() => {}),
    setDoc(doc(db, 'chat_messages', msg.id), payload, { merge: true }).catch(() => {})
  ]);
}

export async function hideDirectMessageForUserInFirestore(messageId: string, userId: string): Promise<void> {
  await tryEnsureSessionBestEffort();
  await Promise.all([
    updateDoc(doc(db, 'direct_messages', messageId), { hiddenForUsers: arrayUnion(userId) }).catch(() => {}),
    updateDoc(doc(db, 'chat_messages', messageId), { hiddenForUsers: arrayUnion(userId) }).catch(() => {})
  ]);
}

export interface TypingRecord {
  id: string;
  chatId: string;
  userId: string;
  userName: string;
  updatedAt: number;
}

export async function setTypingStatusInFirestore(
  chatId: string,
  userId: string,
  userName: string,
  isTyping: boolean
): Promise<void> {
  await tryEnsureSessionBestEffort();
  const safeChat = chatId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
  const safeUser = userId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
  const typingId = `t_${safeChat}_${safeUser}`;
  try {
    if (!isTyping) {
      await deleteDoc(doc(db, 'chat_typing', typingId));
    } else {
      await setDoc(doc(db, 'chat_typing', typingId), {
        id: typingId,
        chatId,
        userId,
        userName: userName.slice(0, 100),
        updatedAt: Date.now()
      });
    }
  } catch {
    // Non-blocking ephemeral indicator
  }
}

export async function saveChatConversationToFirestore(chat: ChatConversation): Promise<void> {
  await tryEnsureSessionBestEffort();
  try {
    await setDoc(doc(db, 'chats', chat.id), stripUndefinedDeep(chat), { merge: true });
  } catch (err) {
    console.warn(`Firestore chats write warning (chats/${chat.id}):`, err);
  }
}

export function subscribeToFirestoreCollection<T>(
  collectionName: string,
  onData: (items: T[]) => void,
  userConstraint?: { field: string; value: string; op?: '==' | 'array-contains' },
  orderByConstraint?: { field: string; direction?: 'asc' | 'desc' }
): Unsubscribe {
  const path = collectionName;
  const colRef = collection(db, collectionName);

  let targetQuery = query(colRef);
  if (userConstraint && orderByConstraint) {
    targetQuery = query(
      colRef,
      where(userConstraint.field, userConstraint.op || '==', userConstraint.value),
      orderBy(orderByConstraint.field, orderByConstraint.direction || 'asc')
    );
  } else if (userConstraint) {
    targetQuery = query(colRef, where(userConstraint.field, userConstraint.op || '==', userConstraint.value));
  } else if (orderByConstraint) {
    targetQuery = query(colRef, orderBy(orderByConstraint.field, orderByConstraint.direction || 'asc'));
  }

  return onSnapshot(
    targetQuery,
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data() as Record<string, unknown>;
        items.push({ id: docSnap.id, ...raw } as T);
      });
      onData(items);
    },
    (error) => {
      if (
        (error as { code?: string })?.code === 'unavailable' ||
        error.message?.includes('offline') ||
        error.message?.includes('unavailable')
      ) {
        console.info(`Firestore collection "${collectionName}" operating in offline cache mode.`);
        return;
      }
      console.warn(`Firestore subscription warning on "${path}":`, error);
    }
  );
}

export { onAuthStateChanged, serverTimestamp };
export type { FirebaseUser };
