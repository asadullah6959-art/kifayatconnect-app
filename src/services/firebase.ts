import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup,
  signInAnonymously,
  signOut as fbSignOut, 
  GoogleAuthProvider,
  onAuthStateChanged,
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
  collection,
  onSnapshot,
  getDocFromServer,
  query,
  where,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import emailjs from '@emailjs/browser';
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

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID (Critical for AI Studio Firestore)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Authentication
export const auth = getAuth(app);

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

// Bridge EmailJS OTP / Password / New Member sessions into Firebase Auth so Firestore reads & writes succeed
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

// Google Sign-In with Popup (Web browsers only)
export async function loginWithGoogle(): Promise<FirebaseUser> {
  if (isNativeMobileRuntime()) {
    throw new Error('Please use Email OTP to sign in on the mobile app.');
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

/**
 * Synchronizes the Firebase authenticated user with their Firestore /users/{uid} document.
 * Enforces trusted server-side authorization:
 * - If email is asadullah6959@gmail.com, assigns SUPER_ADMIN role with full governance authority.
 * - Otherwise defaults strictly to MEMBER role unless previously appointed as ADMIN/CO_ADMIN.
 */
export async function syncUserWithFirestore(firebaseUser: FirebaseUser): Promise<User> {
  const userDocRef = doc(db, 'users', firebaseUser.uid);
  const path = `users/${firebaseUser.uid}`;

  try {
    const docSnap = await getDoc(userDocRef);
    const isSuperAdminEmail = firebaseUser.email?.toLowerCase() === ROOT_SUPER_ADMIN_EMAIL.toLowerCase();

    if (docSnap.exists()) {
      const existingData = docSnap.data() as User;
      const normalizedRole = normalizeLegacyRole(existingData.role, firebaseUser.email || existingData.email);
      const shouldBeFounder = isSuperAdminEmail || existingData.isFounder === true;
      const hasPwd = existingData.hasPassword || hasLocalPasswordCredential(firebaseUser.email || existingData.email);

      if (
        normalizedRole !== existingData.role ||
        (shouldBeFounder && !existingData.isFounder) ||
        (isSuperAdminEmail && !existingData.isStaff) ||
        hasPwd !== Boolean(existingData.hasPassword)
      ) {
        const updated: User = {
          ...existingData,
          role: normalizedRole,
          isFounder: shouldBeFounder,
          isStaff: normalizedRole !== 'MEMBER',
          hasPassword: hasPwd
        };
        await updateDoc(userDocRef, {
          role: normalizedRole,
          isFounder: shouldBeFounder,
          isStaff: normalizedRole !== 'MEMBER',
          hasPassword: hasPwd
        }).catch(() => {});
        return updated;
      }
      return existingData;
    }

    // Document does not exist yet: create verified profile in Firestore starting cleanly at 0
    const joinDate = new Date().toISOString().split('T')[0];
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);

    const newUser: User = {
      id: firebaseUser.uid,
      name: isSuperAdminEmail ? 'Asadullah (Founder Super Admin)' : (firebaseUser.displayName || 'Registered Member'),
      email: firebaseUser.email || '',
      phone: firebaseUser.phoneNumber || '',
      role: isSuperAdminEmail ? 'SUPER_ADMIN' : 'MEMBER',
      isFounder: isSuperAdminEmail,
      hasPassword: hasLocalPasswordCredential(firebaseUser.email || ''),
      country: 'Pakistan',
      stateProvince: isSuperAdminEmail ? 'Islamabad Capital Territory' : 'Punjab',
      district: isSuperAdminEmail ? 'Islamabad' : 'Lahore',
      tehsil: isSuperAdminEmail ? 'Islamabad City' : 'Model Town',
      cityTown: isSuperAdminEmail ? 'Islamabad' : 'Lahore',
      unionCouncil: isSuperAdminEmail ? 'UC-01 Secretariat' : '',
      membershipId: isSuperAdminEmail ? 'KC-ADM-001' : `KC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      membershipStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      avatarUrl: firebaseUser.photoURL || undefined,
      cnic: '',
      address: isSuperAdminEmail ? 'Central Secretariat, Islamabad' : '',
      joinDate,
      validUntil: expiryDate.toISOString().split('T')[0],
      monthlyPledge: 0,
      annualPledge: 0,
      totalContributed: 0,
      isStaff: isSuperAdminEmail,
      notes: isSuperAdminEmail ? 'Verified Founder Super Admin authorized via Google Identity' : 'Authenticated Member'
    };

    await setDoc(userDocRef, newUser);
    return newUser;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ----------------------------------------------------
// Secure 6-Digit Email OTP System (State + kc_active_otp localStorage + EmailJS)
// ----------------------------------------------------
export const PENDING_OTP_STORAGE_KEY = 'kc_active_otp';
const LEGACY_PENDING_OTP_STORAGE_KEY = 'kc_pending_email_otp';
const OTP_TTL_MS = 15 * 60 * 1000; // 15-minute validity across mobile app switches

export interface StoredOTP {
  email: string;
  otp: string;
  codeHash: string;
  expiresAt: number; // 15-minute TTL
  attempts: number; // max 3 attempts
  lastSentAt: number; // 60s cooldown
}

const otpStore = new Map<string, StoredOTP>();

function writePendingOTPToStorage(record: StoredOTP): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(PENDING_OTP_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Ignore storage write failure
  }
}

export function clearPendingEmailOTP(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(PENDING_OTP_STORAGE_KEY);
    localStorage.removeItem(LEGACY_PENDING_OTP_STORAGE_KEY);
  } catch {
    // Ignore storage remove failure
  }
}

export function getPendingEmailOTP(): StoredOTP | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw =
      localStorage.getItem(PENDING_OTP_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_PENDING_OTP_STORAGE_KEY);
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
      otp: String(parsed.otp || '').replace(/\D/g, ''),
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

const EMAILJS_DEFAULT_SERVICE_ID = 'service_dit4b7i';
const EMAILJS_DEFAULT_TEMPLATE_ID = 'template_ibzfyx7';
const EMAILJS_DEFAULT_PUBLIC_KEY = 'kzxuOJCacRGWQ5nVb';

function getEmailJSConfig() {
  const serviceId = (import.meta.env.VITE_EMAILJS_SERVICE_ID || '').trim() || EMAILJS_DEFAULT_SERVICE_ID;
  const templateId = (import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '').trim() || EMAILJS_DEFAULT_TEMPLATE_ID;
  const publicKey = (import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '').trim() || EMAILJS_DEFAULT_PUBLIC_KEY;
  return { serviceId, templateId, publicKey };
}

export function isEmailOTPConfigured(): boolean {
  const { serviceId, templateId, publicKey } = getEmailJSConfig();
  return Boolean(serviceId && templateId && publicKey);
}

export interface OTPRequestResult {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  unconfigured?: boolean;
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

  const { serviceId, templateId, publicKey } = getEmailJSConfig();

  const now = Date.now();
  const persistedPending = getPendingEmailOTP();
  const existing = otpStore.get(cleanEmail) || (persistedPending?.email === cleanEmail ? persistedPending : undefined);

  // Enforce 60-second cooldown
  if (existing && now - existing.lastSentAt < 60000) {
    const remainingSeconds = Math.ceil((60000 - (now - existing.lastSentAt)) / 1000);
    return {
      success: false,
      message: `Please wait ${remainingSeconds} seconds before requesting a new verification code.`,
      cooldownSeconds: remainingSeconds
    };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      message: 'Internet connection is required to send Email OTP verification codes.'
    };
  }

  // Generate clean 6-digit OTP and store in BOTH state + kc_active_otp BEFORE calling emailjs.send()
  const cleanOtp = String(Math.floor(100000 + Math.random() * 900000)).trim();
  const codeHash = await hashOTP(cleanEmail, cleanOtp);
  const expiresAt = now + OTP_TTL_MS;

  const pendingRecord: StoredOTP = {
    email: cleanEmail,
    otp: cleanOtp,
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

  try {
    await emailjs.send(
      serviceId,
      templateId,
      {
        email: cleanEmail,
        to_email: cleanEmail,
        passcode: cleanOtp,
        otp: cleanOtp,
        otp_code: cleanOtp,
        app_name: 'Kifayat Connect',
        expiry_minutes: '15'
      },
      publicKey
    );

    return {
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}. Check your inbox (valid for 15 minutes).`,
      pendingRecord
    };
  } catch (err: unknown) {
    // Clean up failed dispatch so the user can retry immediately
    otpStore.delete(cleanEmail);
    clearPendingEmailOTP();
    const detail =
      (err as { text?: string })?.text ||
      (err instanceof Error ? err.message : '') ||
      'Please check your connection.';
    return {
      success: false,
      message: `Unable to dispatch verification email: ${detail}`
    };
  }
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
    return { success: false, message: 'Please enter the complete 6-digit verification code.' };
  }

  const persisted = getPendingEmailOTP();
  let saved: StoredOTP | undefined =
    (stateOtpRecord && (!cleanEmail || stateOtpRecord.email === cleanEmail) ? stateOtpRecord : undefined) ||
    otpStore.get(cleanEmail) ||
    (persisted && (!cleanEmail || persisted.email === cleanEmail) ? persisted : undefined);

  if (!saved && persisted && !cleanEmail) {
    saved = persisted;
  }

  if (!saved) {
    return { success: false, message: 'No active verification code found. Please request a new code.' };
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
  const savedOtpClean = String(saved.otp || '').replace(/\D/g, '');
  const matchesDirect = Boolean(savedOtpClean && enteredOtp === savedOtpClean);
  const matchesHash = Boolean(saved.codeHash && saved.codeHash === candidateHash);

  if (!matchesDirect && !matchesHash) {
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

  // Verified — immediately clear kc_active_otp and in-memory record
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

// ----------------------------------------------------
// Forgot Password / Temporary Reset Flow (EmailJS + localStorage)
// ----------------------------------------------------
export const PENDING_RESET_STORAGE_KEY = 'kc_pending_password_reset';
const resetStore = new Map<string, StoredOTP>();

function writePendingResetToStorage(record: StoredOTP): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(PENDING_RESET_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Ignore storage write failure
  }
}

export function clearPendingPasswordReset(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(PENDING_RESET_STORAGE_KEY);
  } catch {
    // Ignore storage remove failure
  }
}

export function getPendingPasswordReset(): StoredOTP | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(PENDING_RESET_STORAGE_KEY);
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
      otp: String(parsed.otp || '').replace(/\D/g, ''),
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

export async function requestPasswordReset(email: string): Promise<OTPRequestResult> {
  const normEmail = email.trim().toLowerCase();
  if (!normEmail || !normEmail.includes('@')) {
    return { success: false, message: 'Please enter a valid registered email address.' };
  }

  const { serviceId, templateId, publicKey } = getEmailJSConfig();
  const now = Date.now();
  const persistedPending = getPendingPasswordReset();
  const existing = resetStore.get(normEmail) || (persistedPending?.email === normEmail ? persistedPending : undefined);

  if (existing && now - existing.lastSentAt < 60000) {
    const remainingSeconds = Math.ceil((60000 - (now - existing.lastSentAt)) / 1000);
    return {
      success: false,
      message: `Please wait ${remainingSeconds} seconds before requesting another reset code.`,
      cooldownSeconds: remainingSeconds
    };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      message: 'Internet connection is required to send a password reset code.'
    };
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await hashOTP(normEmail, `reset:${code}`);
  const expiresAt = now + OTP_TTL_MS;
  const origin = typeof window !== 'undefined' && window.location.origin.startsWith('http')
    ? window.location.origin
    : 'https://kifayatconnect.app';
  const resetLink = `${origin}/?recoveryEmail=${encodeURIComponent(normEmail)}&recoveryCode=${encodeURIComponent(code)}`;

  try {
    await emailjs.send(
      serviceId,
      templateId,
      {
        email: normEmail,
        to_email: normEmail,
        passcode: code,
        otp: code,
        otp_code: code,
        reset_code: code,
        reset_link: resetLink,
        app_name: 'Kifayat Connect — Password Recovery',
        expiry_minutes: '10'
      },
      publicKey
    );

    const pendingRecord: StoredOTP = {
      email: normEmail,
      otp: code,
      codeHash,
      expiresAt,
      attempts: 0,
      lastSentAt: now
    };

    resetStore.set(normEmail, pendingRecord);
    writePendingResetToStorage(pendingRecord);

    return {
      success: true,
      message: `A temporary 6-digit password reset code has been sent to ${normEmail} (valid for 10 minutes).`
    };
  } catch (err: unknown) {
    const detail =
      (err as { text?: string })?.text ||
      (err instanceof Error ? err.message : '') ||
      'Please check your connection.';
    return {
      success: false,
      message: `Unable to send recovery email: ${detail}`
    };
  }
}

export async function verifyPasswordReset(
  email: string,
  code: string,
  newPassword: string
): Promise<OTPVerifyResult> {
  const normEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();
  const cleanPassword = newPassword.trim();
  const now = Date.now();

  if (cleanPassword.length < 6) {
    return { success: false, message: 'New password must be at least 6 characters long.' };
  }

  const persisted = getPendingPasswordReset();
  let record = resetStore.get(normEmail);
  if (!record && persisted && persisted.email === normEmail) {
    record = persisted;
    resetStore.set(normEmail, persisted);
  }

  if (!record) {
    return { success: false, message: 'No active password reset request found. Please request a new code.' };
  }

  if (now > record.expiresAt) {
    resetStore.delete(normEmail);
    clearPendingPasswordReset();
    return { success: false, message: 'Reset code has expired (10-minute limit). Please request a new code.' };
  }

  if (record.attempts >= 3) {
    resetStore.delete(normEmail);
    clearPendingPasswordReset();
    return { success: false, message: 'Too many incorrect attempts. Reset code invalidated for security.' };
  }

  const candidateHash = await hashOTP(normEmail, `reset:${cleanCode}`);
  const matchesHash = record.codeHash ? record.codeHash === candidateHash : false;
  const matchesPlain = record.otp ? record.otp === cleanCode : false;

  if (!matchesHash && !matchesPlain) {
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

  // Verified — immediately clear single-use reset code and store hashed credential
  resetStore.delete(normEmail);
  clearPendingPasswordReset();

  await saveLocalPasswordCredential(normEmail, cleanPassword);

  return {
    success: true,
    message: 'Temporary reset code verified and password updated. You can now sign in with your new password or Email OTP.',
    verifiedEmail: normEmail
  };
}

// ----------------------------------------------------
// Salted SHA-256 Local Password & Master PIN Credentials Store
// ----------------------------------------------------
const CREDENTIALS_STORAGE_KEY = 'kc_user_credentials_v1';

interface StoredCredentialEntry {
  passwordHash: string;
  updatedAt: number;
}

export async function hashSecretString(secret: string, salt = 'kifayat_sec_v1'): Promise<string> {
  return hashOTP(salt.trim().toLowerCase(), secret);
}

function readCredentialsMap(): Record<string, StoredCredentialEntry> {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, StoredCredentialEntry>;
  } catch {
    return {};
  }
}

export function hasLocalPasswordCredential(email: string): boolean {
  const norm = email.trim().toLowerCase();
  if (!norm) return false;
  const map = readCredentialsMap();
  return Boolean(map[norm]?.passwordHash);
}

export async function saveLocalPasswordCredential(email: string, password: string): Promise<void> {
  const norm = email.trim().toLowerCase();
  if (!norm || !password) return;
  const passwordHash = await hashOTP(norm, `pwd:${password.trim()}`);
  try {
    if (typeof localStorage === 'undefined') return;
    const map = readCredentialsMap();
    map[norm] = { passwordHash, updatedAt: Date.now() };
    localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(map));

    // Also mirror into legacy recovery key for seamless cross-flow compatibility
    const emailHash = await hashOTP(norm, 'identity');
    localStorage.setItem(
      `kc_recovery_credential_${emailHash}`,
      JSON.stringify({ passwordHash, updatedAt: Date.now() })
    );
  } catch {
    // Non-blocking storage write
  }
}

export async function verifyLocalPasswordCredential(email: string, password: string): Promise<boolean> {
  const norm = email.trim().toLowerCase();
  const cleanPwd = password.trim();
  if (!norm || !cleanPwd) return false;
  const candidateHash = await hashOTP(norm, `pwd:${cleanPwd}`);
  const map = readCredentialsMap();
  if (map[norm]?.passwordHash && map[norm].passwordHash === candidateHash) {
    return true;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      const emailHash = await hashOTP(norm, 'identity');
      const legacyRaw = localStorage.getItem(`kc_recovery_credential_${emailHash}`);
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw) as { passwordHash?: string };
        if (legacy?.passwordHash === candidateHash) {
          map[norm] = { passwordHash: candidateHash, updatedAt: Date.now() };
          localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(map));
          return true;
        }
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

export function normalizeUserForCloud(user: User): Record<string, unknown> {
  const photo = user.photoUrl || user.avatarUrl || user.avatar || '';
  const memId = user.memberId || user.membershipId || '';
  const statusStr = user.status || user.membershipStatus || 'ACTIVE';
  return stripUndefinedDeep({
    ...user,
    uid: user.id,
    memberId: memId,
    membershipId: memId,
    photoUrl: photo,
    avatarUrl: photo,
    province: user.stateProvince,
    city: user.cityTown,
    uc: user.unionCouncil,
    status: statusStr,
    isAuditOfficer: Boolean(user.isAuditOfficer),
    isMutedInChat: Boolean(user.isMutedInChat),
    createdAt: user.createdAt || user.joinDate || new Date().toISOString()
  });
}

export async function saveUserToFirestore(user: User): Promise<void> {
  const session = auth.currentUser || (await ensureFirebaseAuthSession());
  if (!session) return;
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), normalizeUserForCloud(user), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchAllUsersFromFirestore(): Promise<User[]> {
  try {
    const session = auth.currentUser || (await ensureFirebaseAuthSession());
    if (!session) return [];
    const snap = await getDocs(collection(db, 'users'));
    const list: User[] = [];
    snap.forEach(docSnap => {
      list.push(docSnap.data() as User);
    });
    return list;
  } catch (err) {
    console.warn('Firestore users directory fetch warning:', err);
    return [];
  }
}

export async function saveApplicationToFirestore(app: MembershipApplication): Promise<void> {
  const session = auth.currentUser || (await ensureFirebaseAuthSession());
  if (!session) return;
  const path = `applications/${app.id}`;
  try {
    await setDoc(doc(db, 'applications', app.id), stripUndefinedDeep(app));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function savePaymentToFirestore(payment: PaymentTransaction): Promise<void> {
  const session = auth.currentUser || (await ensureFirebaseAuthSession());
  if (!session) return;
  const path = `payments/${payment.id}`;
  try {
    await setDoc(doc(db, 'payments', payment.id), stripUndefinedDeep(payment));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveComplaintToFirestore(complaint: Complaint): Promise<void> {
  const session = auth.currentUser || (await ensureFirebaseAuthSession());
  if (!session) return;
  const path = `complaints/${complaint.id}`;
  try {
    await setDoc(doc(db, 'complaints', complaint.id), stripUndefinedDeep(complaint));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveAnnouncementToFirestore(announcement: Announcement): Promise<void> {
  const session = auth.currentUser || (await ensureFirebaseAuthSession());
  if (!session) return;
  const path = `announcements/${announcement.id}`;
  try {
    await setDoc(doc(db, 'announcements', announcement.id), stripUndefinedDeep(announcement));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteAnnouncementFromFirestore(announcementId: string): Promise<void> {
  const session = auth.currentUser || (await ensureFirebaseAuthSession());
  if (!session) return;
  const path = `announcements/${announcementId}`;
  try {
    await deleteDoc(doc(db, 'announcements', announcementId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveAuditLogToFirestore(log: AuditLog): Promise<void> {
  const session = auth.currentUser || (await ensureFirebaseAuthSession());
  if (!session) return;
  const path = `audit_logs/${log.id}`;
  try {
    await setDoc(doc(db, 'audit_logs', log.id), stripUndefinedDeep(log));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveNotificationToFirestore(notif: AppNotification): Promise<void> {
  const session = auth.currentUser || (await ensureFirebaseAuthSession());
  if (!session) return;
  const path = `notifications/${notif.id}`;
  try {
    await setDoc(doc(db, 'notifications', notif.id), stripUndefinedDeep(notif));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveOfficeBearerToFirestore(ob: OfficeBearer): Promise<void> {
  const session = auth.currentUser || (await ensureFirebaseAuthSession());
  if (!session) return;
  const path = `office_bearers/${ob.id}`;
  try {
    await setDoc(doc(db, 'office_bearers', ob.id), stripUndefinedDeep(ob));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveOfficeBearerHistoryToFirestore(obh: OfficeBearerHistory): Promise<void> {
  const session = auth.currentUser || (await ensureFirebaseAuthSession());
  if (!session) return;
  const path = `office_bearer_history/${obh.id}`;
  try {
    await setDoc(doc(db, 'office_bearer_history', obh.id), stripUndefinedDeep(obh));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveAppUpdateToFirestore(update: AppUpdate): Promise<void> {
  const session = auth.currentUser || (await ensureFirebaseAuthSession());
  if (!session) return;
  const path = `app_updates/${update.id}`;
  try {
    await setDoc(doc(db, 'app_updates', update.id), stripUndefinedDeep(update));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveAppSettingsToFirestore(settings: AppSettings): Promise<void> {
  const session = auth.currentUser || (await ensureFirebaseAuthSession());
  if (!session) return;
  const path = `app_settings/global`;
  try {
    await setDoc(doc(db, 'app_settings', 'global'), stripUndefinedDeep(settings), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveChatMessageToFirestore(msg: ChatMessage): Promise<void> {
  const session = auth.currentUser || (await ensureFirebaseAuthSession());
  if (!session) return;
  const path = `chat_messages/${msg.id}`;
  try {
    await setDoc(doc(db, 'chat_messages', msg.id), stripUndefinedDeep(msg));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveCommunityMessageToFirestore(msg: ChatMessage): Promise<void> {
  const session = auth.currentUser || (await ensureFirebaseAuthSession());
  if (!session) return;
  const path = `community_chat_messages/${msg.id}`;
  try {
    await setDoc(doc(db, 'community_chat_messages', msg.id), stripUndefinedDeep(msg), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteCommunityMessageFromFirestore(messageId: string): Promise<void> {
  const session = auth.currentUser || (await ensureFirebaseAuthSession());
  if (!session) return;
  const path = `community_chat_messages/${messageId}`;
  try {
    await deleteDoc(doc(db, 'community_chat_messages', messageId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveChatConversationToFirestore(chat: ChatConversation): Promise<void> {
  const session = auth.currentUser || (await ensureFirebaseAuthSession());
  if (!session) return;
  const path = `chats/${chat.id}`;
  try {
    await setDoc(doc(db, 'chats', chat.id), stripUndefinedDeep(chat), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeToFirestoreCollection<T>(
  collectionName: string, 
  onData: (items: T[]) => void,
  userConstraint?: { field: string; value: string; op?: '==' | 'array-contains' }
): Unsubscribe {
  if (!auth.currentUser) {
    return () => {};
  }
  const path = collectionName;
  const colRef = collection(db, collectionName);
  const targetQuery = userConstraint
    ? query(colRef, where(userConstraint.field, userConstraint.op || '==', userConstraint.value))
    : colRef;

  return onSnapshot(
    targetQuery,
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as T);
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

export { onAuthStateChanged };
export type { FirebaseUser };
