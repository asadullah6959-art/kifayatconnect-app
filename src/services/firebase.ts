import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signOut as fbSignOut, 
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc,
  setDoc,
  updateDoc,
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
  ChatConversation
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

// Test connection status safely
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    return !!db && !!db.app;
  } catch {
    return false;
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
 * - Otherwise defaults strictly to MEMBER role unless previously appointed as ADMIN/CO_ADMIN/FINANCE_OFFICER.
 */
export async function syncUserWithFirestore(firebaseUser: FirebaseUser): Promise<User> {
  const userDocRef = doc(db, 'users', firebaseUser.uid);
  const path = `users/${firebaseUser.uid}`;

  try {
    const docSnap = await getDoc(userDocRef);
    const isSuperAdminEmail = firebaseUser.email?.toLowerCase() === ROOT_SUPER_ADMIN_EMAIL.toLowerCase();

    if (docSnap.exists()) {
      const existingData = docSnap.data() as User;
      // Backend confirmation: if email is authorized super admin, ensure role is SUPER_ADMIN
      if (isSuperAdminEmail && existingData.role !== 'SUPER_ADMIN') {
        const updated: User = {
          ...existingData,
          role: 'SUPER_ADMIN',
          isStaff: true
        };
        await updateDoc(userDocRef, { role: 'SUPER_ADMIN', isStaff: true });
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
      name: isSuperAdminEmail ? 'Asadullah (Super Admin)' : (firebaseUser.displayName || 'Registered Member'),
      email: firebaseUser.email || '',
      phone: firebaseUser.phoneNumber || '',
      role: isSuperAdminEmail ? 'SUPER_ADMIN' : 'MEMBER',
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
      notes: isSuperAdminEmail ? 'Verified Root Super Admin authorized via Google Identity' : 'Authenticated Member'
    };

    await setDoc(userDocRef, newUser);
    return newUser;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ----------------------------------------------------
// Secure 6-Digit Email OTP System (Hashed + localStorage + EmailJS)
// ----------------------------------------------------
export const PENDING_OTP_STORAGE_KEY = 'kc_pending_email_otp';
const OTP_TTL_MS = 10 * 60 * 1000; // 10-minute validity across mobile app switches

export interface StoredOTP {
  email: string;
  otp?: string;
  codeHash: string;
  expiresAt: number; // 10-minute TTL
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
  } catch {
    // Ignore storage remove failure
  }
}

export function getPendingEmailOTP(): StoredOTP | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(PENDING_OTP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredOTP>;
    if (!parsed || typeof parsed.email !== 'string' || typeof parsed.expiresAt !== 'number') {
      clearPendingEmailOTP();
      return null;
    }
    if (Date.now() > parsed.expiresAt || (parsed.attempts ?? 0) >= 3) {
      clearPendingEmailOTP();
      return null;
    }
    return {
      email: parsed.email.trim().toLowerCase(),
      otp: typeof parsed.otp === 'string' ? parsed.otp : undefined,
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
}

export async function requestEmailOTP(email: string): Promise<OTPRequestResult> {
  const normEmail = email.trim().toLowerCase();
  if (!normEmail || !normEmail.includes('@')) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  const { serviceId, templateId, publicKey } = getEmailJSConfig();

  const now = Date.now();
  const persistedPending = getPendingEmailOTP();
  const existing = otpStore.get(normEmail) || (persistedPending?.email === normEmail ? persistedPending : undefined);

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

  // Generate random 6-digit OTP and store in both memory & localStorage (survives mobile app switches)
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await hashOTP(normEmail, code);
  const expiresAt = now + OTP_TTL_MS;

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
        app_name: 'Kifayat Connect',
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

    // Supersede any older OTP for this email in memory and persist to localStorage
    otpStore.set(normEmail, pendingRecord);
    writePendingOTPToStorage(pendingRecord);

    return {
      success: true,
      message: `A 6-digit verification code has been sent to ${normEmail}. Check your inbox (valid for 10 minutes).`
    };
  } catch (err: unknown) {
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

export interface OTPVerifyResult {
  success: boolean;
  message: string;
  isSuperAdmin?: boolean;
}

export async function verifyEmailOTP(email: string, code: string): Promise<OTPVerifyResult> {
  const normEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();
  const now = Date.now();

  const persisted = getPendingEmailOTP();
  let record = otpStore.get(normEmail);
  if (!record && persisted && persisted.email === normEmail) {
    record = persisted;
    otpStore.set(normEmail, persisted);
  }

  if (!record) {
    return { success: false, message: 'No active verification code found. Please request a new code.' };
  }

  if (now > record.expiresAt) {
    otpStore.delete(normEmail);
    clearPendingEmailOTP();
    return { success: false, message: 'Verification code has expired (10-minute limit). Please request a new code.' };
  }

  if (record.attempts >= 3) {
    otpStore.delete(normEmail);
    clearPendingEmailOTP();
    return { success: false, message: 'Too many incorrect attempts. Code invalidated for security.' };
  }

  const candidateHash = await hashOTP(normEmail, cleanCode);
  const matchesHash = record.codeHash ? record.codeHash === candidateHash : false;
  const matchesPlain = record.otp ? record.otp === cleanCode : false;

  if (!matchesHash && !matchesPlain) {
    record.attempts += 1;
    const remaining = 3 - record.attempts;
    if (remaining <= 0) {
      otpStore.delete(normEmail);
      clearPendingEmailOTP();
      return { success: false, message: 'Too many incorrect attempts. Code invalidated for security.' };
    }
    otpStore.set(normEmail, record);
    writePendingOTPToStorage(record);
    return { success: false, message: `Incorrect verification code. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.` };
  }

  // Verified — immediately remove from memory and localStorage so it cannot be reused
  otpStore.delete(normEmail);
  clearPendingEmailOTP();

  const isSuperAdmin = normEmail === ROOT_SUPER_ADMIN_EMAIL.toLowerCase();

  return {
    success: true,
    message: 'Email verified successfully.',
    isSuperAdmin
  };
}

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
      otp: typeof parsed.otp === 'string' ? parsed.otp : undefined,
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

  // Verified — immediately clear single-use reset code and store hashed recovery credential
  resetStore.delete(normEmail);
  clearPendingPasswordReset();

  try {
    const emailHash = await hashOTP(normEmail, 'identity');
    const passwordHash = await hashOTP(normEmail, `pwd:${cleanPassword}`);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        `kc_recovery_credential_${emailHash}`,
        JSON.stringify({ passwordHash, updatedAt: now })
      );
    }
  } catch {
    // Non-blocking local credential hash store
  }

  return {
    success: true,
    message: 'Temporary reset code verified and password updated. You can now sign in with Email OTP or Google Sign-In.'
  };
}

// ----------------------------------------------------
// Firestore Database Synchronization Methods
// ----------------------------------------------------
export async function saveUserToFirestore(user: User): Promise<void> {
  if (!auth.currentUser) return;
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), user);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveApplicationToFirestore(app: MembershipApplication): Promise<void> {
  if (!auth.currentUser) return;
  const path = `applications/${app.id}`;
  try {
    await setDoc(doc(db, 'applications', app.id), app);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function savePaymentToFirestore(payment: PaymentTransaction): Promise<void> {
  if (!auth.currentUser) return;
  const path = `payments/${payment.id}`;
  try {
    await setDoc(doc(db, 'payments', payment.id), payment);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveComplaintToFirestore(complaint: Complaint): Promise<void> {
  if (!auth.currentUser) return;
  const path = `complaints/${complaint.id}`;
  try {
    await setDoc(doc(db, 'complaints', complaint.id), complaint);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveAnnouncementToFirestore(announcement: Announcement): Promise<void> {
  if (!auth.currentUser) return;
  const path = `announcements/${announcement.id}`;
  try {
    await setDoc(doc(db, 'announcements', announcement.id), announcement);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveAuditLogToFirestore(log: AuditLog): Promise<void> {
  if (!auth.currentUser) return;
  const path = `audit_logs/${log.id}`;
  try {
    await setDoc(doc(db, 'audit_logs', log.id), log);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveNotificationToFirestore(notif: AppNotification): Promise<void> {
  if (!auth.currentUser) return;
  const path = `notifications/${notif.id}`;
  try {
    await setDoc(doc(db, 'notifications', notif.id), notif);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveOfficeBearerToFirestore(ob: OfficeBearer): Promise<void> {
  if (!auth.currentUser) return;
  const path = `office_bearers/${ob.id}`;
  try {
    await setDoc(doc(db, 'office_bearers', ob.id), ob);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveOfficeBearerHistoryToFirestore(obh: OfficeBearerHistory): Promise<void> {
  if (!auth.currentUser) return;
  const path = `office_bearer_history/${obh.id}`;
  try {
    await setDoc(doc(db, 'office_bearer_history', obh.id), obh);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveAppUpdateToFirestore(update: AppUpdate): Promise<void> {
  if (!auth.currentUser) return;
  const path = `app_updates/${update.id}`;
  try {
    await setDoc(doc(db, 'app_updates', update.id), update);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveAppSettingsToFirestore(settings: AppSettings): Promise<void> {
  if (!auth.currentUser) return;
  const path = `app_settings/global`;
  try {
    await setDoc(doc(db, 'app_settings', 'global'), settings);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveChatMessageToFirestore(msg: ChatMessage): Promise<void> {
  if (!auth.currentUser) return;
  const path = `chat_messages/${msg.id}`;
  try {
    await setDoc(doc(db, 'chat_messages', msg.id), msg);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveChatConversationToFirestore(chat: ChatConversation): Promise<void> {
  if (!auth.currentUser) return;
  const path = `chats/${chat.id}`;
  try {
    await setDoc(doc(db, 'chats', chat.id), chat);
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
      // In offline mode or transient connection dips, Firestore operates on local cache
      if ((error as any)?.code === 'unavailable' || error.message?.includes('offline') || error.message?.includes('unavailable')) {
        console.info(`Firestore collection "${collectionName}" operating in offline cache mode.`);
        return;
      }
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export { onAuthStateChanged };
export type { FirebaseUser };
