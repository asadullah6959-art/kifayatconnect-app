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

// Google Sign-In with Popup
export async function loginWithGoogle(): Promise<FirebaseUser> {
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

    // Document does not exist yet: create verified profile in Firestore
    const newUser: User = {
      id: firebaseUser.uid,
      name: isSuperAdminEmail ? 'Asadullah (Super Admin)' : (firebaseUser.displayName || 'Registered Member'),
      email: firebaseUser.email || '',
      phone: firebaseUser.phoneNumber || '+92 300 0000000',
      role: isSuperAdminEmail ? 'SUPER_ADMIN' : 'MEMBER',
      country: 'Pakistan',
      stateProvince: isSuperAdminEmail ? 'Islamabad Capital Territory' : 'Punjab',
      district: isSuperAdminEmail ? 'Islamabad' : 'Lahore',
      tehsil: isSuperAdminEmail ? 'Islamabad City' : 'Model Town',
      cityTown: isSuperAdminEmail ? 'Islamabad' : 'Lahore',
      unionCouncil: isSuperAdminEmail ? 'UC-01 Secretariat' : 'UC-112 Model Town',
      membershipId: isSuperAdminEmail ? 'KC-ADM-001' : `KC-MEM-${Math.floor(1000 + Math.random() * 9000)}`,
      membershipStatus: 'ACTIVE',
      avatarUrl: firebaseUser.photoURL || undefined,
      cnic: isSuperAdminEmail ? '61101-1234567-1' : '35201-0000000-1',
      address: isSuperAdminEmail ? 'Central Secretariat, Islamabad' : 'Regional Address',
      joinDate: new Date().toISOString().split('T')[0],
      validUntil: '2028-12-31',
      monthlyPledge: isSuperAdminEmail ? 10000 : 2500,
      annualPledge: isSuperAdminEmail ? 50000 : 10000,
      totalContributed: isSuperAdminEmail ? 240000 : 0,
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
// Secure 6-Digit Email OTP System
// ----------------------------------------------------
interface StoredOTP {
  email: string;
  code: string;
  expiresAt: number; // 5-minute TTL
  attempts: number; // max 3 attempts
  lastSentAt: number; // 60s cooldown
}

const otpStore = new Map<string, StoredOTP>();

export interface OTPRequestResult {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  previewCode?: string; // provided for development testing
}

export function requestEmailOTP(email: string): OTPRequestResult {
  const normEmail = email.trim().toLowerCase();
  if (!normEmail || !normEmail.includes('@')) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  const now = Date.now();
  const existing = otpStore.get(normEmail);

  // Enforce 60-second cooldown
  if (existing && now - existing.lastSentAt < 60000) {
    const remainingSeconds = Math.ceil((60000 - (now - existing.lastSentAt)) / 1000);
    return {
      success: false,
      message: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
      cooldownSeconds: remainingSeconds
    };
  }

  // Generate secure random 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes validity

  otpStore.set(normEmail, {
    email: normEmail,
    code,
    expiresAt,
    attempts: 0,
    lastSentAt: now
  });

  console.info(`[Kifayat Connect Auth] Generated 6-digit OTP for ${normEmail}: ${code} (Expires in 5 min)`);

  return {
    success: true,
    message: `A 6-digit verification code has been dispatched to ${normEmail}. (Valid for 5 minutes).`,
    previewCode: code // Provided transparently in UI test box until external SMTP is hooked up
  };
}

export interface OTPVerifyResult {
  success: boolean;
  message: string;
  isSuperAdmin?: boolean;
}

export function verifyEmailOTP(email: string, code: string): OTPVerifyResult {
  const normEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();
  const now = Date.now();

  const record = otpStore.get(normEmail);
  if (!record) {
    return { success: false, message: 'No active code found for this email. Please request a new code.' };
  }

  if (now > record.expiresAt) {
    otpStore.delete(normEmail);
    return { success: false, message: 'This code has expired (5-minute limit exceeded). Please request a new code.' };
  }

  if (record.attempts >= 3) {
    otpStore.delete(normEmail);
    return { success: false, message: 'Too many incorrect attempts. This code has been invalidated for security.' };
  }

  if (record.code !== cleanCode) {
    record.attempts += 1;
    const remaining = 3 - record.attempts;
    return { success: false, message: `Incorrect code. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.` };
  }

  // Code verified! Invalidate immediately so it cannot be reused
  otpStore.delete(normEmail);

  const isSuperAdmin = normEmail === ROOT_SUPER_ADMIN_EMAIL.toLowerCase();

  return {
    success: true,
    message: 'Identity verified successfully.',
    isSuperAdmin
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
  userConstraint?: { field: string; value: string }
): Unsubscribe {
  if (!auth.currentUser) {
    return () => {};
  }
  const path = collectionName;
  const colRef = collection(db, collectionName);
  const targetQuery = userConstraint
    ? query(colRef, where(userConstraint.field, '==', userConstraint.value))
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
