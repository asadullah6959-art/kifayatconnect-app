import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  mirrorSessionToIndexedDB,
  readSessionFromIndexedDB
} from '../utils/safeStorage';
import { 
  User, 
  UserRole,
  RolePermissions,
  MembershipApplication, 
  PaymentTransaction, 
  FundTier,
  Complaint, 
  Announcement,
  AnnouncementType,
  AuditLog, 
  RegionalStats,
  ComplaintStatus,
  AppNotification,
  NotificationType,
  OfficeBearer,
  OfficeBearerHistory,
  AppUpdate,
  AppSettings,
  ChatMessage,
  ChatConversation,
  ChatReplySnapshot,
  ChatVoiceNote,
  CommunityScenicThemeId,
  SupportingDocument,
  SupportingDocumentType,
  normalizeLegacyRole
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_MEMBERSHIP_APPLICATIONS, 
  INITIAL_PAYMENTS, 
  INITIAL_COMPLAINTS, 
  INITIAL_ANNOUNCEMENTS, 
  INITIAL_AUDIT_LOGS, 
  REGIONAL_STATS_DATA,
  INITIAL_NOTIFICATIONS,
  INITIAL_OFFICE_BEARERS,
  INITIAL_OFFICE_BEARER_HISTORY,
  INITIAL_APP_UPDATES,
  INITIAL_APP_SETTINGS,
  INITIAL_CHATS,
  INITIAL_CHAT_MESSAGES
} from '../data/initialData';
import { mapLegacyRegionToHierarchy } from '../data/locationData';
import { 
  auth, 
  onAuthStateChanged, 
  loginWithGoogle, 
  logoutUser, 
  syncUserWithFirestore,
  ensureFirebaseAuthSession,
  testFirestoreConnection,
  fetchAllUsersFromFirestore,
  saveApplicationToFirestore,
  savePaymentToFirestore,
  generateAtomicSerialNumber,
  saveComplaintToFirestore,
  saveAnnouncementToFirestore,
  deleteAnnouncementFromFirestore,
  saveAuditLogToFirestore,
  saveNotificationToFirestore,
  saveUserToFirestore,
  deleteUserPermanentlyFromFirestore,
  saveOfficeBearerToFirestore,
  saveOfficeBearerHistoryToFirestore,
  saveAppUpdateToFirestore,
  saveAppSettingsToFirestore,
  saveChatMessageToFirestore,
  saveCommunityMessageToFirestore,
  deleteCommunityMessageFromFirestore,
  hideCommunityMessageForUserInFirestore,
  deleteDirectMessageFromFirestore,
  hideDirectMessageForUserInFirestore,
  saveChatConversationToFirestore,
  subscribeToFirestoreCollection,
  updateUserPresenceInFirestore,
  markUserOfflineInFirestore,
  findExistingFirestoreUserByEmail,
  buildSafeEmailUserId,
  toIsoTimestamp,
  requestEmailOTP,
  verifyEmailOTP,
  verifyPasswordReset,
  getPendingEmailOTP,
  clearPendingEmailOTP,
  saveLocalPasswordCredential,
  verifyLocalPasswordCredential,
  hasLocalPasswordCredential,
  computeUserPasswordHash,
  mirrorPasswordHashToLocalStorage,
  approveOrRejectUserInFirestore,
  sendApprovalRequestNotificationToFirestore,
  resolveUserApprovalStatus,
  StoredOTP,
  OTPRequestResult,
  OTPVerifyResult,
  FirebaseUser,
  ROOT_SUPER_ADMIN_EMAIL
} from '../services/firebase';
import { mintMembershipSerial } from '../services/membershipSerialService';
import { resolveUserTabbar } from '../data/tabbars';
import { fetchLatestGitHubRelease, GitHubReleaseStatus } from '../services/githubReleases';
import { shareKifayatForIphone } from '../utils/iphoneShare';
import { isFounderIdentity, isChatModerator } from '../utils/permissions';
import { isValid13DigitCnic, formatCnicDisplay, getCnicLockAlertMessage, normalizeCnicDigits } from '../utils/cnic';

const STORAGE_KEYS = {
  USERS: 'kifayat_users_v3',
  CURRENT_USER: 'kifayat_current_user',
  CURRENT_USER_ID: 'kifayat_current_user_v3',
  APPLICATIONS: 'kifayat_applications_v3',
  PAYMENTS: 'kifayat_payments_v3',
  COMPLAINTS: 'kifayat_complaints_v3',
  ANNOUNCEMENTS: 'kifayat_announcements_v3',
  AUDIT_LOGS: 'kifayat_audit_logs_v3',
  NOTIFICATIONS: 'kifayat_notifications_v3',
  OFFICE_BEARERS: 'kifayat_office_bearers_v3',
  OFFICE_BEARER_HISTORY: 'kifayat_office_bearer_history_v3',
  APP_UPDATES: 'kifayat_app_updates_v3',
  ACK_VERSION: 'kifayat_ack_update_version_v3',
  APP_SETTINGS: 'kifayat_app_settings_v3',
  CHATS: 'kifayat_chats_v3',
  CHAT_MESSAGES: 'kifayat_chat_messages_v3',
  COMMUNITY_MESSAGES: 'kifayat_community_chat_v1',
  OFFLINE_CHAT_QUEUE: 'kc_offline_chat_queue_v1',
  DELETED_COMMUNITY_MSG_IDS: 'kc_deleted_cmsg_ids_v1',
  HIDDEN_COMMUNITY_MSG_IDS_PREFIX: 'kc_hidden_cmsg_ids_',
  DELETED_DIRECT_MSG_IDS: 'kc_deleted_dmsg_ids_v1',
  HIDDEN_DIRECT_MSG_IDS_PREFIX: 'kc_hidden_dmsg_ids_',
  LANGUAGE: 'kifayat_lang_v3'
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = safeGetItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    try {
      if (key !== STORAGE_KEYS.CURRENT_USER && key !== STORAGE_KEYS.CURRENT_USER_ID) {
        safeRemoveItem(key);
      }
    } catch {
      // Ignore cleanup errors
    }
    return fallback;
  }
}

function persistCurrentUserToStorage(user: User | null): void {
  try {
    if (!user) {
      safeRemoveItem(STORAGE_KEYS.CURRENT_USER);
      safeRemoveItem(STORAGE_KEYS.CURRENT_USER_ID);
      void mirrorSessionToIndexedDB(STORAGE_KEYS.CURRENT_USER, null);
      void mirrorSessionToIndexedDB(STORAGE_KEYS.CURRENT_USER_ID, null);
      return;
    }
    safeSetItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
    void mirrorSessionToIndexedDB(STORAGE_KEYS.CURRENT_USER_ID, user.id);
    const fullSerialized = JSON.stringify(user);
    if (!safeSetItem(STORAGE_KEYS.CURRENT_USER, fullSerialized)) {
      // Fallback if oversized base64 photo triggers storage quota limit
      const compactUser: User = {
        ...user,
        photoUrl: user.photoUrl && user.photoUrl.startsWith('data:') && user.photoUrl.length > 48000 ? undefined : user.photoUrl,
        avatarUrl: user.avatarUrl && user.avatarUrl.startsWith('data:') && user.avatarUrl.length > 48000 ? undefined : user.avatarUrl,
        avatar: user.avatar && user.avatar.startsWith('data:') && user.avatar.length > 48000 ? undefined : user.avatar
      };
      const compactSerialized = JSON.stringify(compactUser);
      safeSetItem(STORAGE_KEYS.CURRENT_USER, compactSerialized);
      void mirrorSessionToIndexedDB(STORAGE_KEYS.CURRENT_USER, compactSerialized);
    } else {
      void mirrorSessionToIndexedDB(STORAGE_KEYS.CURRENT_USER, fullSerialized);
    }
  } catch {
    // Ignore storage unavailable errors
  }
}

function readIdSetFromStorage(key: string): Set<string> {
  const arr = readStorage<string[]>(key, []);
  return new Set(Array.isArray(arr) ? arr.filter(Boolean) : []);
}

function addIdsToStorageSet(key: string, ids: string[]): Set<string> {
  const set = readIdSetFromStorage(key);
  ids.forEach(id => {
    if (id) set.add(id);
  });
  const trimmed = Array.from(set).slice(-1200);
  try {
    safeSetItem(key, JSON.stringify(trimmed));
  } catch {
    // Ignore quota errors
  }
  return new Set(trimmed);
}

export function isFounderUser(user?: User | null): boolean {
  return isFounderIdentity(user);
}

function normalizeUserRecord(u: User): User {
  const isFounder = isFounderUser(u);
  const role = normalizeLegacyRole(u.role, u.email);
  const photo = u.photoUrl || u.avatarUrl || u.avatar;
  const memId = u.memberId || u.membershipId;
  const profileCompleted = isFounder
    ? true
    : u.profileCompleted !== undefined
    ? Boolean(u.profileCompleted)
    : Boolean((u.cnic && u.cnic.trim()) || (u.address && u.address.trim()) || role !== 'MEMBER');
  const onlineFlag = u.isOnline !== undefined ? Boolean(u.isOnline) : u.status === 'online';
  const safeLastLogin = toIsoTimestamp(u.lastLoginAt, '');
  const safeLastSeen = toIsoTimestamp(u.lastSeen, safeLastLogin || u.joinDate || '');
  const safeCreatedAt = toIsoTimestamp(u.createdAt, u.joinDate || new Date().toISOString());
  const prov = u.stateProvince || u.province || 'Punjab';

  const resolvedApproval = resolveUserApprovalStatus({ ...u, isFounder });
  const normEmail = (u.email || '').trim().toLowerCase();
  const pwdHash = u.passwordHash || undefined;
  if (pwdHash && normEmail) {
    mirrorPasswordHashToLocalStorage(normEmail, pwdHash);
  }

  return {
    ...u,
    email: normEmail,
    role,
    isFounder,
    isAuditOfficer: Boolean(u.isAuditOfficer),
    isMutedInChat: isFounder ? false : Boolean(u.isMutedInChat),
    profileCompleted,
    stateProvince: prov,
    province: prov,
    avatarUrl: photo,
    photoUrl: photo,
    membershipId: memId,
    memberId: memId,
    isOnline: onlineFlag,
    lastActiveAt: typeof u.lastActiveAt === 'number' ? u.lastActiveAt : undefined,
    lastSeen: safeLastSeen,
    lastLoginAt: safeLastLogin || safeLastSeen || undefined,
    approvalStatus: resolvedApproval,
    status: resolvedApproval,
    createdAt: safeCreatedAt,
    isStaff: role !== 'MEMBER',
    passwordHash: pwdHash,
    otpVerifiedOnce: Boolean(u.otpVerifiedOnce ?? (profileCompleted || role !== 'MEMBER')),
    hasPassword: Boolean(u.hasPassword || pwdHash || hasLocalPasswordCredential(normEmail))
  };
}

function mergeUsersLists(localList: User[], remoteList: User[], preferRemote = false): User[] {
  const byKey = new Map<string, User>();
  const getKey = (u: User) => (u.email?.trim().toLowerCase() || u.id);

  localList.forEach(raw => {
    const norm = normalizeUserRecord(raw);
    byKey.set(getKey(norm), norm);
  });

  remoteList.forEach(raw => {
    const rem = normalizeUserRecord(raw);
    const key = getKey(rem);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, rem);
    } else {
      const photo = rem.photoUrl || rem.avatarUrl || existing.photoUrl || existing.avatarUrl;
      const remDecisionTs = rem.approvedAt || rem.rejectedAt || '';
      const extDecisionTs = existing.approvedAt || existing.rejectedAt || '';
      const keepLocalDecision = extDecisionTs > remDecisionTs;
      const mergedApproval = keepLocalDecision
        ? existing.approvalStatus
        : rem.approvalStatus || existing.approvalStatus;
      const mergedPwdHash = rem.passwordHash || existing.passwordHash;

      byKey.set(key, normalizeUserRecord({
        ...existing,
        ...rem,
        id: preferRemote ? (rem.id || existing.id) : (existing.id || rem.id),
        name: rem.name || existing.name,
        phone: rem.phone || existing.phone,
        cnic: rem.cnic || existing.cnic,
        address: rem.address || existing.address,
        unionCouncil: rem.unionCouncil || existing.unionCouncil,
        stateProvince: rem.stateProvince || existing.stateProvince,
        province: rem.province || rem.stateProvince || existing.province || existing.stateProvince,
        district: rem.district || existing.district,
        tehsil: rem.tehsil || existing.tehsil,
        cityTown: rem.cityTown || existing.cityTown,
        membershipId: rem.membershipId || existing.membershipId,
        memberId: rem.memberId || existing.memberId,
        avatarUrl: photo,
        photoUrl: photo,
        passwordHash: mergedPwdHash,
        hasPassword: Boolean(rem.hasPassword || existing.hasPassword || mergedPwdHash),
        otpVerifiedOnce: Boolean(rem.otpVerifiedOnce || existing.otpVerifiedOnce),
        tabbarId: (rem.tabbarId && rem.tabbarId.trim()) ? rem.tabbarId : existing.tabbarId,
        tabbarUrdu: (rem.tabbarUrdu && rem.tabbarUrdu.trim()) ? rem.tabbarUrdu : existing.tabbarUrdu,
        tabbarEnglish: (rem.tabbarEnglish && rem.tabbarEnglish.trim()) ? rem.tabbarEnglish : existing.tabbarEnglish,
        isOnline: preferRemote
          ? Boolean(rem.isOnline)
          : Boolean(rem.isOnline ?? existing.isOnline),
        lastActiveAt: rem.lastActiveAt !== undefined ? rem.lastActiveAt : existing.lastActiveAt,
        lastSeen: rem.lastSeen || existing.lastSeen,
        approvalStatus: mergedApproval,
        status: mergedApproval,
        membershipStatus: keepLocalDecision ? existing.membershipStatus : (rem.membershipStatus || existing.membershipStatus),
        verificationStatus: keepLocalDecision ? existing.verificationStatus : (rem.verificationStatus || existing.verificationStatus),
        approvedBy: keepLocalDecision ? existing.approvedBy : (rem.approvedBy || existing.approvedBy),
        approvedAt: keepLocalDecision ? existing.approvedAt : (rem.approvedAt || existing.approvedAt),
        rejectedBy: keepLocalDecision ? existing.rejectedBy : (rem.rejectedBy || existing.rejectedBy),
        rejectedAt: keepLocalDecision ? existing.rejectedAt : (rem.rejectedAt || existing.rejectedAt),
        profileCompleted: isFounderUser(existing) || isFounderUser(rem)
          ? true
          : Boolean(rem.profileCompleted || existing.profileCompleted),
        approvalRequestSentAt: rem.approvalRequestSentAt || existing.approvalRequestSentAt,
        isFounder: isFounderUser(existing) || isFounderUser(rem),
        isAuditOfficer: Boolean(rem.isAuditOfficer ?? existing.isAuditOfficer),
        isMutedInChat: isFounderUser(existing) || isFounderUser(rem) ? false : Boolean(rem.isMutedInChat ?? existing.isMutedInChat)
      }));
    }
  });

  return Array.from(byKey.values());
}

function mergeAppSettings(raw: Partial<AppSettings> | null | undefined): AppSettings {
  if (!raw) return INITIAL_APP_SETTINGS;
  return {
    ...INITIAL_APP_SETTINGS,
    ...raw,
    chatLockMessages: Boolean(raw.chatLockMessages),
    chatLockVoiceNotes: Boolean(raw.chatLockVoiceNotes),
    chatLockFullRoom: Boolean(raw.chatLockFullRoom),
    chatMemberControls: { ...(raw.chatMemberControls || {}) },
    dashboardVisibility: {
      ...INITIAL_APP_SETTINGS.dashboardVisibility!,
      ...(raw.dashboardVisibility || {})
    },
    featureToggles: {
      ...INITIAL_APP_SETTINGS.featureToggles!,
      ...(raw.featureToggles || {})
    },
    textOverrides: {
      ...INITIAL_APP_SETTINGS.textOverrides!,
      ...(raw.textOverrides || {})
    },
    roleDefaults: {
      ADMIN: {
        ...INITIAL_APP_SETTINGS.roleDefaults!.ADMIN,
        ...(raw.roleDefaults?.ADMIN || {})
      },
      CO_ADMIN: {
        ...INITIAL_APP_SETTINGS.roleDefaults!.CO_ADMIN,
        ...(raw.roleDefaults?.CO_ADMIN || {})
      },
      MEMBER: {
        ...INITIAL_APP_SETTINGS.roleDefaults!.MEMBER,
        ...(raw.roleDefaults?.MEMBER || {})
      }
    }
  };
}

interface AppContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  users: User[];
  applications: MembershipApplication[];
  payments: PaymentTransaction[];
  complaints: Complaint[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
  regionalStats: RegionalStats[];
  activeTab: string;
  language: 'en' | 'ur';
  selectedReceipt: PaymentTransaction | null;
  selectedCardUser: User | null;
  isOnline: boolean;

  // Navigation & UI
  setActiveTab: (tab: string) => void;
  setLanguage: (lang: 'en' | 'ur') => void;
  toggleLanguage: () => void;
  setSelectedReceipt: (tx: PaymentTransaction | null) => void;
  setSelectedCardUser: (user: User | null) => void;
  focusedMemberId: string | null;
  setFocusedMemberId: (id: string | null) => void;
  memberDirectoryFilter: 'ALL' | 'PENDING_APPROVAL';
  setMemberDirectoryFilter: (filter: 'ALL' | 'PENDING_APPROVAL') => void;
  jumpToMemberApproval: (memberIdOrUid?: string | null) => void;

  // Profile Completion Modal Trigger
  isCompleteProfileModalOpen: boolean;
  openCompleteProfileModal: () => void;
  closeCompleteProfileModal: () => void;

  // Rukniyat Form Modal & Member Tutorial Modal Triggers
  isRukniyatFormOpen: boolean;
  inspectedRukniyatApp: MembershipApplication | null;
  openRukniyatForm: (inspectApp?: MembershipApplication | null) => void;
  closeRukniyatForm: () => void;
  isTutorialOpen: boolean;
  openTutorial: () => void;
  closeTutorial: () => void;

  // Live Chat Window Display Mode (Full / Minimized Bubble / Hidden)
  liveChatDisplayMode: 'FULL' | 'MINIMIZED' | 'HIDDEN';
  unreadCommunityCount: number;
  preferredChatMode: 'COMMUNITY' | 'DIRECT';
  setPreferredChatMode: (mode: 'COMMUNITY' | 'DIRECT') => void;
  minimizeLiveChat: () => void;
  hideLiveChat: () => void;
  closeAndHideLiveChat: () => void;
  restoreLiveChat: () => void;
  openPersonalMessage: (user: User) => void;

  // Profile Viewer Modal
  inspectedUserProfile: User | null;
  setInspectedUserProfile: (user: User | null) => void;

  // Access Control
  canAccess: (permission: string) => boolean;

  // Workflows
  recommendApplication: (appId: string, recommendation: 'APPROVE' | 'REJECT', remarks: string) => void;
  finalApproveApplication: (
    appId: string,
    remarks?: string,
    officeData?: {
      formFeeAmount?: number;
      officeSecretarySignature?: string;
      presidentSignature?: string;
    }
  ) => Promise<void> | void;
  rejectApplication: (appId: string, remarks: string) => void;
  submitRukniyatForm: (payload: {
    applicantName: string;
    fatherName: string;
    phone: string;
    email?: string;
    education?: string;
    experience?: string;
    profession?: string;
    maritalStatus?: string;
    currentArea?: string;
    ancestralArea?: string;
    dob?: string;
    age?: string;
    cnic: string;
    unit?: string;
    country?: string;
    stateProvince: string;
    district: string;
    tehsil?: string;
    cityTown?: string;
    unionCouncil?: string;
    tabbarId?: string;
    tabbarUrdu?: string;
    tabbarEnglish?: string;
    subBranch?: string;
    tabarRepName?: string;
    tabarRepSignature?: string;
    address: string;
    permanentAddress?: string;
    applicantPhotoUrl?: string;
    applicantSignature?: string;
    monthlyPledgeAmount?: number;
    isOldMemberVerification?: boolean;
    oldMembershipNo?: string;
  }) => Promise<{ success: boolean; serialNumber?: string; application?: MembershipApplication; error?: string }>;
  createOldPaperRecord: (data: {
    oldMembershipNo?: string;
    oldReceiptSerialNo?: string;
    date: string;
    applicantName: string;
    fatherName?: string;
    cnic: string;
    tabbarId?: string;
    tabbarUrdu?: string;
    tabbarEnglish?: string;
    amount: number;
    fundTier?: FundTier;
    unit?: string;
    phone?: string;
    email?: string;
    stateProvince?: string;
    district?: string;
    address?: string;
    paperFormPhotoUrl?: string;
  }) => Promise<{ success: boolean; serialNumber?: string; error?: string }>;
  attachDocumentToApplication: (appId: string, doc: { 
    name: string; 
    type: SupportingDocumentType; 
    fileUrl: string; 
    fileSize: number; 
    fileMime: string; 
    notes?: string 
  }) => { success: boolean; error?: string };
  removeDocumentFromApplication: (appId: string, docId: string) => { success: boolean };
  verifyApplicationDocument: (appId: string, docId: string, status: 'VERIFIED' | 'FLAGGED', notes?: string) => { success: boolean };
  registerMember: (data: {
    applicantName: string;
    email: string;
    phone: string;
    cnic: string;
    country?: string;
    stateProvince?: string;
    district?: string;
    tehsil?: string;
    cityTown?: string;
    unionCouncil?: string;
    address: string;
    tabbarId?: string;
    tabbarUrdu?: string;
    tabbarEnglish?: string;
    isOldMember: boolean;
    oldMembershipNo?: string;
    password?: string;
    avatarUrl?: string;
  }) => Promise<void> | void;
  submitPayment: (data: {
    amount: number;
    fundCategory: any;
    fundTier?: FundTier;
    yearsCount?: number;
    unit?: string;
    payerCnic?: string;
    paymentMethod: any;
    referenceNumber: string;
    proofNote?: string;
    receiptImageUrl?: string;
    receiptImageName?: string;
    paymentMode?: 'DASTOOR' | 'OTHER';
    monthsCount?: number;
    ratePerMonth?: number;
    startMonth?: number;
    startYear?: number;
    periodLabelEn?: string;
    periodLabelUr?: string;
  }) => Promise<{ success: boolean; transaction?: PaymentTransaction; error?: string }>;
  verifyPayment: (txId: string, approved: boolean, reason?: string) => void;
  submitComplaint: (data: {
    category: any;
    subject: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }) => void;
  updateComplaintStatus: (complaintId: string, status: ComplaintStatus, responseNote?: string) => void;
  publishAnnouncement: (data: {
    title: string;
    content: string;
    announcementType?: AnnouncementType;
    targetScope?: 'ALL' | 'PROVINCE' | 'DISTRICT';
    targetStateProvince?: string;
    targetDistrict?: string;
    targetRegion?: string;
    urgency: 'NORMAL' | 'URGENT';
    isPinned: boolean;
    expiresAt?: string;
  }) => void;
  deleteAnnouncement: (announcementId: string) => void;
  createOrUpdateStaff: (userData: Partial<User> & { id?: string }) => { success: boolean; error?: string };
  assignMemberRole: (userId: string, options: { role: UserRole; isAuditOfficer?: boolean }) => { success: boolean; error?: string };
  promoteToSuperAdmin: (userId: string) => { success: boolean; error?: string };
  demoteSuperAdmin: (userId: string) => { success: boolean; error?: string };
  assignAuditOfficer: (userId: string, assigned: boolean) => { success: boolean; error?: string };
  syncAllUsersToCloud: () => Promise<number>;
  approveMemberAccount: (userId: string, approved: boolean, reason?: string) => { success: boolean; message: string; error?: string };
  toggleUserSuspension: (userId: string, suspended: boolean) => { success: boolean; error?: string };
  deleteUserPermanently: (userId: string) => Promise<{ success: boolean; message: string; error?: string }>;
  updateUserPermissions: (userId: string, permissions: Partial<RolePermissions>) => { success: boolean; error?: string };
  broadcastAdminAlert: (title: string, message: string, target: 'ALL' | 'STAFF') => void;
  updateUserProfile: (profileData: Partial<User>) => void;
  resetAllData: () => void;

  // Office-Bearers Module
  officeBearers: OfficeBearer[];
  officeBearerHistory: OfficeBearerHistory[];
  appointOfficeBearer: (seatId: string, userId: string, notes?: string) => { success: boolean; error?: string };
  vacateOfficeBearer: (seatId: string, reason: string) => { success: boolean; error?: string };

  // Chat Module (Direct + Ultra-Luxury Live Community Room)
  chats: ChatConversation[];
  chatMessages: ChatMessage[];
  communityMessages: ChatMessage[];
  queuedMessageCount: number;
  activeChatUser: User | null;
  setActiveChatUser: (user: User | null) => void;
  sendChatMessage: (recipientId: string, text: string, attachment?: { url: string; name: string; type: 'IMAGE' | 'DOCUMENT' }) => { success: boolean; error?: string; queued?: boolean };
  markConversationAsSeen: (chatId: string) => void;
  sendCommunityMessage: (payload: {
    text?: string;
    replyTo?: ChatReplySnapshot;
    attachment?: { url: string; name: string; type: 'IMAGE' | 'DOCUMENT' };
    voiceNote?: ChatVoiceNote;
    islamicGifId?: string;
  }) => { success: boolean; error?: string };
  toggleCommunityReaction: (messageId: string, emoji: string) => void;
  toggleHighlightCommunityMessage: (messageId: string) => { success: boolean; error?: string };
  togglePinCommunityMessage: (messageId: string) => { success: boolean; error?: string };
  deleteCommunityMessage: (messageId: string) => { success: boolean; error?: string };
  deleteCommunityMessageForMe: (messageId: string) => { success: boolean; error?: string };
  deleteCommunityMessageForEveryone: (messageId: string) => { success: boolean; error?: string };
  clearOldCommunityMessages: (mode: 'OLDER_7_DAYS' | 'OLDER_24_HOURS' | 'ALL') => { success: boolean; count: number; error?: string };
  deleteDirectMessageForMe: (messageId: string) => { success: boolean; error?: string };
  deleteDirectMessageForEveryone: (messageId: string) => { success: boolean; error?: string };
  muteChatUser: (userId: string, muted: boolean) => { success: boolean; error?: string };
  updateLiveChatAppearance: (data: {
    liveChatTheme?: CommunityScenicThemeId;
    liveChatCustomBgUrl?: string;
    founderBubbleColor?: string;
  }) => { success: boolean; error?: string };
  updateChatRoomModeration: (data: {
    chatLockMessages?: boolean;
    chatLockVoiceNotes?: boolean;
    chatLockFullRoom?: boolean;
  }) => { success: boolean; error?: string };
  updateMemberChatControl: (
    userId: string,
    control: { lockMessages?: boolean; lockVoice?: boolean; removeFromRoom?: boolean }
  ) => { success: boolean; error?: string };

  // App Updates Module & GitHub Releases
  appUpdates: AppUpdate[];
  latestPublishedUpdate: AppUpdate | null;
  githubRelease: GitHubReleaseStatus | null;
  refreshGitHubRelease: (force?: boolean) => Promise<void>;
  acknowledgedUpdateVersion: string | null;
  acknowledgeUpdate: (version: string) => void;
  publishAppUpdate: (updateData: Omit<AppUpdate, 'id'>) => void;
  toggleUpdatePublish: (updateId: string) => void;

  // App Settings Module
  appSettings: AppSettings;
  updateAppSettings: (newSettings: Partial<AppSettings>) => void;

  // iPhone (iOS) App Link Sharing
  iphoneShareNotice: { url: string; id: number } | null;
  dismissIphoneShareNotice: () => void;
  triggerShareForIphone: () => Promise<void>;

  // Global Notifications System
  notifications: AppNotification[];
  userNotifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
  addNotification: (data: {
    type: NotificationType;
    title: string;
    message: string;
    targetUserId?: string;
    targetRole?: UserRole | 'ALL' | 'Super Admin';
    targetStateProvince?: string;
    targetDistrict?: string;
    linkTab?: string;
    entityId?: string;
    actionUrl?: string;
    memberId?: string;
    memberUid?: string;
    memberName?: string;
    memberEmail?: string;
    district?: string;
  }) => void;

  // Auth, Password & Email OTP
  firebaseUser: FirebaseUser | null;
  isFirebaseLive: boolean;
  isCloudSyncing: boolean;
  loginWithGoogleAuth: () => Promise<User>;
  loginWithPassword: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User; needsPasswordSetup?: boolean; existingAccountFound?: boolean }>;
  setupPasswordForExistingAccount: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
  completePasswordAfterOtp: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
  completePasswordResetAndSignIn: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; message: string; user?: User }>;
  setOrChangeUserPassword: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logoutFirebaseAuth: () => Promise<void>;
  requestOTP: (email: string) => Promise<OTPRequestResult>;
  verifyOTP: (email: string, code: string) => Promise<OTPVerifyResult & { user?: User }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const THEME_PRESET_VARS: Record<NonNullable<AppSettings['themePreset']>, Record<string, string>> = {
  OBSIDIAN_GOLD: {
    '--kc-bg': '#070D14',
    '--kc-surface': '#131C31',
    '--kc-surface-elevated': 'rgba(30, 41, 59, 0.82)',
    '--kc-border': 'rgba(148, 163, 184, 0.18)',
    '--kc-accent': '#38BDF8',
    '--kc-emerald': '#0EA5E9'
  },
  EMERALD_GOLD: {
    '--kc-bg': '#070D14',
    '--kc-surface': '#131C31',
    '--kc-surface-elevated': 'rgba(30, 41, 59, 0.82)',
    '--kc-border': 'rgba(56, 189, 248, 0.24)',
    '--kc-accent': '#D4AF37',
    '--kc-emerald': '#38BDF8'
  },
  MIDNIGHT_ROYAL: {
    '--kc-bg': '#070D14',
    '--kc-surface': '#131C31',
    '--kc-surface-elevated': '#1E293B',
    '--kc-border': 'rgba(148, 163, 184, 0.2)',
    '--kc-accent': '#38BDF8',
    '--kc-emerald': '#0EA5E9'
  },
  IMPERIAL_ONYX: {
    '--kc-bg': '#070D14',
    '--kc-surface': '#0F172A',
    '--kc-surface-elevated': '#1E293B',
    '--kc-border': 'rgba(212, 175, 55, 0.28)',
    '--kc-accent': '#F59E0B',
    '--kc-emerald': '#38BDF8'
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Purge legacy v2 dummy storage once on upgrade
  useEffect(() => {
    if (!safeGetItem('kifayat_migrated_clean_v3')) {
      [
        'kifayat_users_v2',
        'kifayat_current_user_v2',
        'kifayat_applications_v2',
        'kifayat_payments_v2',
        'kifayat_complaints_v2',
        'kifayat_announcements_v2',
        'kifayat_audit_logs_v2',
        'kifayat_notifications_v2',
        'kifayat_office_bearers',
        'kifayat_office_bearer_history',
        'kifayat_app_updates',
        'kifayat_app_settings',
        'kifayat_chats',
        'kifayat_chat_messages',
        'kifayat_ack_update_version'
      ].forEach(k => safeRemoveItem(k));
      safeSetItem('kifayat_migrated_clean_v3', 'true');
    }
  }, []);

  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [initialSession] = useState<{ users: User[]; currentUser: User | null }>(() => {
    const rawUsers = readStorage(STORAGE_KEYS.USERS, INITIAL_USERS).map(normalizeUserRecord);
    const savedSessionUser = readStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    const savedId = safeGetItem(STORAGE_KEYS.CURRENT_USER_ID);
    let resolvedUser: User | null = savedSessionUser ? normalizeUserRecord(savedSessionUser) : null;
    if (!resolvedUser && savedId) {
      const matched = rawUsers.find(u => u.id === savedId);
      if (matched) resolvedUser = matched;
    }
    const mergedUsers = resolvedUser ? mergeUsersLists(rawUsers, [resolvedUser], false) : rawUsers;
    if (resolvedUser) {
      const fromList = mergedUsers.find(
        u => u.id === resolvedUser!.id || (resolvedUser!.email && u.email?.toLowerCase() === resolvedUser!.email.toLowerCase())
      );
      if (fromList) resolvedUser = fromList;
      persistCurrentUserToStorage(resolvedUser);
    }
    return { users: mergedUsers, currentUser: resolvedUser };
  });
  const [users, setUsers] = useState<User[]>(initialSession.users);
  const [currentUserState, setCurrentUserState] = useState<User | null>(initialSession.currentUser);
  const [currentUserId, setCurrentUserId] = useState<string | null>(initialSession.currentUser?.id || null);

  // Restore session silently from IndexedDB if Safari cleared localStorage while IndexedDB kept it
  useEffect(() => {
    if (currentUserState) return;
    let active = true;
    readSessionFromIndexedDB(STORAGE_KEYS.CURRENT_USER).then((raw) => {
      if (!active || !raw) return;
      try {
        const parsed = JSON.parse(raw) as User;
        if (parsed && parsed.id) {
          const normalized = normalizeUserRecord(parsed);
          setCurrentUserState(prev => prev ?? normalized);
          setCurrentUserId(prev => prev ?? normalized.id);
          persistCurrentUserToStorage(normalized);
        }
      } catch {
        // Ignore corrupted IDB payload
      }
    });
    return () => {
      active = false;
    };
  }, [currentUserState]);

  const [applications, setApplications] = useState<MembershipApplication[]>(() => readStorage(STORAGE_KEYS.APPLICATIONS, INITIAL_MEMBERSHIP_APPLICATIONS));
  const [payments, setPayments] = useState<PaymentTransaction[]>(() => readStorage(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS));
  const [complaints, setComplaints] = useState<Complaint[]>(() => readStorage(STORAGE_KEYS.COMPLAINTS, INITIAL_COMPLAINTS));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => readStorage(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => readStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => readStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS));
  const [officeBearers, setOfficeBearers] = useState<OfficeBearer[]>(() => readStorage(STORAGE_KEYS.OFFICE_BEARERS, INITIAL_OFFICE_BEARERS));
  const [officeBearerHistory, setOfficeBearerHistory] = useState<OfficeBearerHistory[]>(() => readStorage(STORAGE_KEYS.OFFICE_BEARER_HISTORY, INITIAL_OFFICE_BEARER_HISTORY));
  const [appUpdates, setAppUpdates] = useState<AppUpdate[]>(() => readStorage(STORAGE_KEYS.APP_UPDATES, INITIAL_APP_UPDATES));
  const [acknowledgedUpdateVersion, setAcknowledgedUpdateVersion] = useState<string | null>(() => safeGetItem(STORAGE_KEYS.ACK_VERSION));
  const [appSettings, setAppSettings] = useState<AppSettings>(() => mergeAppSettings(readStorage(STORAGE_KEYS.APP_SETTINGS, INITIAL_APP_SETTINGS)));
  const [iphoneShareNotice, setIphoneShareNotice] = useState<{ url: string; id: number } | null>(null);
  const iphoneShareTimerRef = useRef<number | null>(null);
  const [chats, setChats] = useState<ChatConversation[]>(() => readStorage(STORAGE_KEYS.CHATS, INITIAL_CHATS));
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const deletedDirect = readIdSetFromStorage(STORAGE_KEYS.DELETED_DIRECT_MSG_IDS);
    const savedUid = safeGetItem(STORAGE_KEYS.CURRENT_USER_ID);
    const hiddenDirect = savedUid ? readIdSetFromStorage(`${STORAGE_KEYS.HIDDEN_DIRECT_MSG_IDS_PREFIX}${savedUid}`) : new Set<string>();
    return readStorage(STORAGE_KEYS.CHAT_MESSAGES, INITIAL_CHAT_MESSAGES).filter(
      m => !m.isDeleted && !deletedDirect.has(m.id) && !hiddenDirect.has(m.id) && (!savedUid || !m.hiddenForUsers?.includes(savedUid))
    );
  });
  const [communityMessages, setCommunityMessages] = useState<ChatMessage[]>(() => {
    const deletedComm = readIdSetFromStorage(STORAGE_KEYS.DELETED_COMMUNITY_MSG_IDS);
    const savedUid = safeGetItem(STORAGE_KEYS.CURRENT_USER_ID);
    const hiddenComm = savedUid ? readIdSetFromStorage(`${STORAGE_KEYS.HIDDEN_COMMUNITY_MSG_IDS_PREFIX}${savedUid}`) : new Set<string>();
    return readStorage<ChatMessage[]>(STORAGE_KEYS.COMMUNITY_MESSAGES, []).filter(
      m => !m.isDeleted && !deletedComm.has(m.id) && !hiddenComm.has(m.id) && (!savedUid || !m.hiddenForUsers?.includes(savedUid))
    );
  });
  const [offlineChatQueue, setOfflineChatQueue] = useState<ChatMessage[]>(() => readStorage<ChatMessage[]>(STORAGE_KEYS.OFFLINE_CHAT_QUEUE, []));
  const deletedCommunityIdsRef = useRef<Set<string>>(readIdSetFromStorage(STORAGE_KEYS.DELETED_COMMUNITY_MSG_IDS));
  const deletedDirectIdsRef = useRef<Set<string>>(readIdSetFromStorage(STORAGE_KEYS.DELETED_DIRECT_MSG_IDS));
  const hiddenCommunityIdsRef = useRef<Set<string>>(
    currentUserId ? readIdSetFromStorage(`${STORAGE_KEYS.HIDDEN_COMMUNITY_MSG_IDS_PREFIX}${currentUserId}`) : new Set<string>()
  );
  const hiddenDirectIdsRef = useRef<Set<string>>(
    currentUserId ? readIdSetFromStorage(`${STORAGE_KEYS.HIDDEN_DIRECT_MSG_IDS_PREFIX}${currentUserId}`) : new Set<string>()
  );
  const localRecentSentMsgsRef = useRef<Map<string, number>>(new Map());
  const locallyReadNotifIdsRef = useRef<Set<string>>(new Set());
  const pinActionDebounceRef = useRef<number>(0);

  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  const [inspectedUserProfile, setInspectedUserProfile] = useState<User | null>(null);
  const [regionalStats] = useState<RegionalStats[]>(REGIONAL_STATS_DATA);
  const [activeTab, setActiveTabState] = useState<string>('dashboard');
  const lastNonChatTabRef = useRef<string>('dashboard');
  const [liveChatDisplayMode, setLiveChatDisplayMode] = useState<'FULL' | 'MINIMIZED' | 'HIDDEN'>('FULL');
  const [preferredChatMode, setPreferredChatMode] = useState<'COMMUNITY' | 'DIRECT'>('COMMUNITY');
  const [unreadCommunityCount, setUnreadCommunityCount] = useState<number>(0);
  const lastSeenCommunityIdsRef = useRef<Set<string> | null>(null);
  const [isCompleteProfileModalOpen, setIsCompleteProfileModalOpen] = useState<boolean>(false);
  const [isRukniyatFormOpen, setIsRukniyatFormOpen] = useState<boolean>(false);
  const [inspectedRukniyatApp, setInspectedRukniyatApp] = useState<MembershipApplication | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [focusedMemberId, setFocusedMemberId] = useState<string | null>(null);
  const [memberDirectoryFilter, setMemberDirectoryFilter] = useState<'ALL' | 'PENDING_APPROVAL'>('ALL');

  const openCompleteProfileModal = useCallback(() => setIsCompleteProfileModalOpen(true), []);
  const closeCompleteProfileModal = useCallback(() => setIsCompleteProfileModalOpen(false), []);
  const openRukniyatForm = useCallback((inspectApp?: MembershipApplication | null) => {
    setInspectedRukniyatApp(inspectApp || null);
    setIsRukniyatFormOpen(true);
  }, []);
  const closeRukniyatForm = useCallback(() => {
    setIsRukniyatFormOpen(false);
    setInspectedRukniyatApp(null);
  }, []);
  const openTutorial = useCallback(() => setIsTutorialOpen(true), []);
  const closeTutorial = useCallback(() => {
    if (currentUserId) {
      safeSetItem(`kc_tutorial_seen_${currentUserId}`, 'true');
    }
    setIsTutorialOpen(false);
  }, [currentUserId]);

  // Auto-open Member Tutorial once for newly signed-in Members (dismissible in 1 click)
  useEffect(() => {
    if (!currentUserState) return;
    if (currentUserState.role !== 'MEMBER') return;
    if (!currentUserState.profileCompleted) return;
    const seenKey = `kc_tutorial_seen_${currentUserState.id}`;
    if (!safeGetItem(seenKey)) {
      const id = window.setTimeout(() => {
        setIsTutorialOpen(true);
      }, 650);
      return () => window.clearTimeout(id);
    }
  }, [currentUserState]);

  const setActiveTab = useCallback((tab: string) => {
    if (tab !== 'chat') {
      lastNonChatTabRef.current = tab;
    } else {
      setLiveChatDisplayMode('FULL');
      setUnreadCommunityCount(0);
    }
    setActiveTabState(tab);
  }, []);

  const jumpToMemberApproval = useCallback((memberIdOrUid?: string | null) => {
    setMemberDirectoryFilter('PENDING_APPROVAL');
    setFocusedMemberId(memberIdOrUid || null);
    setActiveTab('members');
  }, [setActiveTab]);

  const minimizeLiveChat = useCallback(() => {
    setLiveChatDisplayMode('MINIMIZED');
    const targetBackTab = lastNonChatTabRef.current && lastNonChatTabRef.current !== 'chat'
      ? lastNonChatTabRef.current
      : 'dashboard';
    setActiveTabState(targetBackTab);
  }, []);

  const hideLiveChat = useCallback(() => {
    setLiveChatDisplayMode('HIDDEN');
  }, []);

  const closeAndHideLiveChat = useCallback(() => {
    setLiveChatDisplayMode('HIDDEN');
    const targetBackTab = lastNonChatTabRef.current && lastNonChatTabRef.current !== 'chat'
      ? lastNonChatTabRef.current
      : 'dashboard';
    setActiveTabState(targetBackTab);
  }, []);

  const restoreLiveChat = useCallback(() => {
    setLiveChatDisplayMode('FULL');
    setPreferredChatMode('COMMUNITY');
    setUnreadCommunityCount(0);
    setActiveTabState('chat');
  }, []);

  const openPersonalMessage = useCallback((targetUser: User) => {
    setActiveChatUser(targetUser);
    setPreferredChatMode('DIRECT');
    setLiveChatDisplayMode('FULL');
    setActiveTabState('chat');
  }, []);

  useEffect(() => {
    if (lastSeenCommunityIdsRef.current === null) {
      lastSeenCommunityIdsRef.current = new Set(communityMessages.map(m => m.id));
      return;
    }
    const prevIds = lastSeenCommunityIdsRef.current;
    let newlyAdded = 0;
    for (const m of communityMessages) {
      if (!prevIds.has(m.id)) {
        prevIds.add(m.id);
        if (!m.isDeleted) {
          newlyAdded += 1;
        }
      }
    }
    if (activeTab === 'chat' && liveChatDisplayMode === 'FULL') {
      setUnreadCommunityCount(0);
    } else if (newlyAdded > 0) {
      setUnreadCommunityCount(c => c + newlyAdded);
    }
  }, [communityMessages, activeTab, liveChatDisplayMode]);

  const [language, setLanguage] = useState<'en' | 'ur'>(() => (safeGetItem(STORAGE_KEYS.LANGUAGE) === 'ur' ? 'ur' : 'en'));
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentTransaction | null>(null);
  const [selectedCardUser, setSelectedCardUser] = useState<User | null>(null);
  const [githubRelease, setGithubRelease] = useState<GitHubReleaseStatus | null>(null);

  // Firebase Live Sync & Active OTP States
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseLive, setIsFirebaseLive] = useState<boolean>(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [activeOtpRecord, setActiveOtpRecord] = useState<StoredOTP | null>(() => getPendingEmailOTP());

  // Always keep LTR layout direction even when Urdu language is active
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = 'ltr';
      document.documentElement.dataset.lang = language;
      document.documentElement.lang = language;
    }
  }, [language]);

  // Reload per-user hidden message sets when currentUserId changes
  useEffect(() => {
    hiddenCommunityIdsRef.current = currentUserId
      ? readIdSetFromStorage(`${STORAGE_KEYS.HIDDEN_COMMUNITY_MSG_IDS_PREFIX}${currentUserId}`)
      : new Set<string>();
    hiddenDirectIdsRef.current = currentUserId
      ? readIdSetFromStorage(`${STORAGE_KEYS.HIDDEN_DIRECT_MSG_IDS_PREFIX}${currentUserId}`)
      : new Set<string>();
  }, [currentUserId]);

  // Apply dynamic theme preset CSS variables
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const preset = appSettings.themePreset || 'OBSIDIAN_GOLD';
      const vars = THEME_PRESET_VARS[preset] || THEME_PRESET_VARS.OBSIDIAN_GOLD;
      Object.entries(vars).forEach(([k, v]) => {
        document.documentElement.style.setProperty(k, v);
      });
    }
  }, [appSettings.themePreset]);

  // Flush queued offline chat messages whenever device goes online
  const flushOfflineChatQueue = useCallback(() => {
    setOfflineChatQueue(prevQueue => {
      if (prevQueue.length === 0) return prevQueue;
      const deliveredIds = new Set(prevQueue.map(m => m.id));
      const deliveredMessages = prevQueue.map(m => ({
        ...m,
        deliveryStatus: 'DELIVERED' as const
      }));

      setChatMessages(prevMsgs =>
        prevMsgs.map(m => (deliveredIds.has(m.id) ? { ...m, deliveryStatus: 'DELIVERED' } : m))
      );

      deliveredMessages.forEach(msg => {
        saveChatMessageToFirestore(msg).catch(() => {});
      });

      return [];
    });
  }, []);

  // Online / Offline Connectivity Listeners & Hybrid Re-Sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushOfflineChatQueue();
      if (auth.currentUser) {
        users.forEach(u => saveUserToFirestore(u).catch(() => {}));
        applications.forEach(a => saveApplicationToFirestore(a).catch(() => {}));
        payments.forEach(p => savePaymentToFirestore(p).catch(() => {}));
        complaints.forEach(c => saveComplaintToFirestore(c).catch(() => {}));
        announcements.forEach(an => saveAnnouncementToFirestore(an).catch(() => {}));
      }
      fetchLatestGitHubRelease(false).then(setGithubRelease).catch(() => {});
    };
    const handleOffline = () => setIsOnline(false);

    if (typeof navigator !== 'undefined' && navigator.onLine && offlineChatQueue.length > 0) {
      flushOfflineChatQueue();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [users, applications, payments, complaints, announcements, offlineChatQueue.length, flushOfflineChatQueue]);

  // Deferred GitHub Release fetch so initial startup renders cleanly in <1s
  const refreshGitHubRelease = useCallback(async (force = false) => {
    const status = await fetchLatestGitHubRelease(force);
    setGithubRelease(status);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      refreshGitHubRelease(false);
    }, 850);
    return () => window.clearTimeout(id);
  }, [refreshGitHubRelease]);

  // Persist active user session cleanly in kifayat_current_user (ONLY cleared on explicit Logout or resetAllData)
  useEffect(() => {
    persistCurrentUserToStorage(currentUserState);
  }, [currentUserState]);
  useEffect(() => {
    const id = window.setTimeout(() => { safeSetItem(STORAGE_KEYS.USERS, JSON.stringify(users)); }, 0);
    return () => window.clearTimeout(id);
  }, [users]);
  useEffect(() => {
    const id = window.setTimeout(() => { safeSetItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications)); }, 0);
    return () => window.clearTimeout(id);
  }, [applications]);
  useEffect(() => {
    const id = window.setTimeout(() => { safeSetItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments)); }, 0);
    return () => window.clearTimeout(id);
  }, [payments]);
  useEffect(() => {
    const id = window.setTimeout(() => { safeSetItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints)); }, 0);
    return () => window.clearTimeout(id);
  }, [complaints]);
  useEffect(() => {
    const id = window.setTimeout(() => { safeSetItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements)); }, 0);
    return () => window.clearTimeout(id);
  }, [announcements]);
  useEffect(() => {
    const id = window.setTimeout(() => { safeSetItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs)); }, 0);
    return () => window.clearTimeout(id);
  }, [auditLogs]);
  useEffect(() => {
    const id = window.setTimeout(() => { safeSetItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications)); }, 0);
    return () => window.clearTimeout(id);
  }, [notifications]);
  useEffect(() => {
    const id = window.setTimeout(() => { safeSetItem(STORAGE_KEYS.OFFICE_BEARERS, JSON.stringify(officeBearers)); }, 0);
    return () => window.clearTimeout(id);
  }, [officeBearers]);
  useEffect(() => {
    const id = window.setTimeout(() => { safeSetItem(STORAGE_KEYS.OFFICE_BEARER_HISTORY, JSON.stringify(officeBearerHistory)); }, 0);
    return () => window.clearTimeout(id);
  }, [officeBearerHistory]);
  useEffect(() => {
    const id = window.setTimeout(() => { safeSetItem(STORAGE_KEYS.APP_UPDATES, JSON.stringify(appUpdates)); }, 0);
    return () => window.clearTimeout(id);
  }, [appUpdates]);
  useEffect(() => {
    const id = window.setTimeout(() => { safeSetItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(appSettings)); }, 0);
    return () => window.clearTimeout(id);
  }, [appSettings]);
  useEffect(() => {
    const id = window.setTimeout(() => { safeSetItem(STORAGE_KEYS.CHATS, JSON.stringify(chats)); }, 0);
    return () => window.clearTimeout(id);
  }, [chats]);
  useEffect(() => {
    const id = window.setTimeout(() => { safeSetItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(chatMessages)); }, 0);
    return () => window.clearTimeout(id);
  }, [chatMessages]);
  useEffect(() => {
    const id = window.setTimeout(() => { safeSetItem(STORAGE_KEYS.COMMUNITY_MESSAGES, JSON.stringify(communityMessages)); }, 0);
    return () => window.clearTimeout(id);
  }, [communityMessages]);
  useEffect(() => {
    const id = window.setTimeout(() => { safeSetItem(STORAGE_KEYS.OFFLINE_CHAT_QUEUE, JSON.stringify(offlineChatQueue)); }, 0);
    return () => window.clearTimeout(id);
  }, [offlineChatQueue]);
  useEffect(() => { safeSetItem(STORAGE_KEYS.LANGUAGE, language); }, [language]);
  useEffect(() => {
    if (acknowledgedUpdateVersion) {
      safeSetItem(STORAGE_KEYS.ACK_VERSION, acknowledgedUpdateVersion);
    }
  }, [acknowledgedUpdateVersion]);

  const currentUser = currentUserState;
  const isAuthenticated = Boolean(currentUserState);

  const establishUserSession = useCallback((rawUser: User, options?: { resetTab?: boolean }): User => {
    const normalized = normalizeUserRecord({
      ...rawUser,
      isOnline: true,
      lastActiveAt: Date.now(),
      lastLoginAt: rawUser.lastLoginAt || new Date().toISOString()
    });
    persistCurrentUserToStorage(normalized);
    setCurrentUserState(normalized);
    setCurrentUserId(normalized.id);
    setUsers(prev => mergeUsersLists(prev, [normalized], true));
    if (options?.resetTab) {
      setActiveTab('dashboard');
    }
    return normalized;
  }, [setActiveTab]);

  // Keep currentUserState updated cleanly when directory sync updates fields, NEVER clearing currentUserState
  useEffect(() => {
    setCurrentUserState(prev => {
      if (!prev) return null;
      const prevEmail = prev.email?.trim().toLowerCase();
      const matched = users.find(
        u => u.id === prev.id || (prevEmail && u.email?.trim().toLowerCase() === prevEmail)
      );
      if (!matched) return prev;
      if (matched.id !== currentUserId) {
        setCurrentUserId(matched.id);
      }
      const next = normalizeUserRecord({
        ...prev,
        ...matched,
        isOnline: matched.isOnline ?? prev.isOnline,
        lastActiveAt: matched.lastActiveAt !== undefined ? matched.lastActiveAt : prev.lastActiveAt
      });
      if (
        next.id === prev.id &&
        next.name === prev.name &&
        next.role === prev.role &&
        next.approvalStatus === prev.approvalStatus &&
        next.profileCompleted === prev.profileCompleted &&
        next.photoUrl === prev.photoUrl &&
        next.cnic === prev.cnic &&
        next.phone === prev.phone &&
        next.tabbarId === prev.tabbarId &&
        next.tabbarUrdu === prev.tabbarUrdu &&
        next.tabbarEnglish === prev.tabbarEnglish &&
        next.passwordHash === prev.passwordHash &&
        next.hasPassword === prev.hasPassword &&
        next.isAuditOfficer === prev.isAuditOfficer &&
        next.isSuspended === prev.isSuspended &&
        next.district === prev.district &&
        next.stateProvince === prev.stateProvince &&
        next.totalContributed === prev.totalContributed &&
        next.assignedOfficeTitle === prev.assignedOfficeTitle &&
        next.isMutedInChat === prev.isMutedInChat
      ) {
        return prev;
      }
      return next;
    });
  }, [users, currentUserId]);

  const latestPublishedUpdate = useMemo(
    () => appUpdates.find(u => u.isPublished) || null,
    [appUpdates]
  );

  // Deferred Firestore health probe + Firebase Auth bridge for fast startup
  useEffect(() => {
    const id = window.setTimeout(() => {
      testFirestoreConnection().catch(() => {});
    }, 600);
    if (currentUserId && !auth.currentUser) {
      ensureFirebaseAuthSession().catch(() => null);
    }
    return () => window.clearTimeout(id);
  }, [currentUserId]);

  // Helper to push all local users to cloud & merge remote directory
  const syncAllUsersToCloud = useCallback(async (): Promise<number> => {
    try {
      await ensureFirebaseAuthSession().catch(() => null);
      const remoteUsers = await fetchAllUsersFromFirestore();
      const remoteKeys = new Set(remoteUsers.map(r => (r.email?.trim().toLowerCase() || r.id)));
      const localMissingFromCloud = users.filter(u => !remoteKeys.has(u.email?.trim().toLowerCase() || u.id));

      await Promise.all(
        localMissingFromCloud.map(u => saveUserToFirestore(u, { isOnline: u.id === currentUserId }).catch(() => {}))
      );

      if (remoteUsers.length > 0) {
        const merged = mergeUsersLists(users, remoteUsers, true);
        setUsers(merged);
        return merged.length;
      }
      return users.length;
    } catch {
      return users.length;
    }
  }, [users, currentUserId]);

  const currentAuthIdentityRef = useRef<{ uid: string; role: UserRole; email: string; isStaff: boolean; isAuditor: boolean }>({
    uid: '',
    role: 'MEMBER',
    email: '',
    isStaff: false,
    isAuditor: false
  });
  currentAuthIdentityRef.current = {
    uid: currentUser?.id || currentUserId || firebaseUser?.uid || '',
    role: currentUser?.role || 'MEMBER',
    email: currentUser?.email || firebaseUser?.email || '',
    isStaff: Boolean(currentUser?.isStaff),
    isAuditor: Boolean(currentUser?.isAuditOfficer)
  };

  // Effect A: Firebase Google Auth Session Lifecycle
  // CRITICAL: NEVER wipe currentUser / currentUserId when fbUser is null or anonymous
  // because custom Email + Password & One-Time OTP accounts persist via kifayat_current_user.
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser || fbUser.isAnonymous) {
        return;
      }
      try {
        const syncedProfileRaw = await syncUserWithFirestore(fbUser);
        const activeProfile = normalizeUserRecord({
          ...syncedProfileRaw,
          isOnline: true,
          status: resolveUserApprovalStatus(syncedProfileRaw)
        });
        establishUserSession(activeProfile);
      } catch (err) {
        console.warn('Google auth sync warning:', err);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [establishUserSession]);

  // Effect B: True Real-Time Firestore Subscriptions (Works for BOTH Google & Email OTP/Password/APK Users!)
  const activeSessionUid =
    currentUserState?.id ||
    currentUserId ||
    (firebaseUser && !firebaseUser.isAnonymous ? firebaseUser.uid : null);

  useEffect(() => {
    const activeUid = activeSessionUid;
    if (!activeUid) {
      setIsFirebaseLive(false);
      return;
    }

    setIsFirebaseLive(true);
    setIsCloudSyncing(true);

    const identity = currentAuthIdentityRef.current;
    const role = identity.role;
    const userEmail = identity.email;
    const isAuditor = identity.isAuditor;

    const unsubUsers = subscribeToFirestoreCollection<User>('users', (remote) => {
      setIsCloudSyncing(false);
      if (remote && remote.length > 0) {
        const normalizedRemote = remote.map(u => normalizeUserRecord(u));
        setUsers(prev => mergeUsersLists(prev, normalizedRemote, true));
      }
    });

    const unsubNotifications = subscribeToFirestoreCollection<AppNotification & { createdAt?: unknown }>(
      'notifications',
      (remote) => {
        if (!remote) return;
        const normalizedNotifs: AppNotification[] = remote.map(n => {
          const markedRead = Boolean(n.read || n.isRead || locallyReadNotifIdsRef.current.has(n.id));
          return {
            ...n,
            timestamp: toIsoTimestamp(n.timestamp || n.createdAt, new Date().toISOString()),
            read: markedRead,
            isRead: markedRead
          };
        });
        setNotifications(prev => {
          const map = new Map<string, AppNotification>();
          prev.forEach(n => map.set(n.id, n));
          normalizedNotifs.forEach(n => {
            const existing = map.get(n.id);
            const finalRead = Boolean(n.read || n.isRead || existing?.read || existing?.isRead);
            map.set(n.id, { ...n, read: finalRead, isRead: finalRead });
          });
          return Array.from(map.values()).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        });
      }
    );

    const unsubApps = subscribeToFirestoreCollection<MembershipApplication>(
      'applications',
      (remote) => {
        if (remote && remote.length > 0) setApplications(remote);
      },
      (identity.isStaff || isAuditor) ? undefined : (userEmail ? { field: 'email', value: userEmail } : undefined)
    );

    const unsubPayments = subscribeToFirestoreCollection<PaymentTransaction>(
      'payments',
      (remote) => {
        if (remote && remote.length > 0) setPayments(remote);
      },
      (role === 'SUPER_ADMIN' || role === 'ADMIN' || isAuditor)
        ? undefined
        : { field: 'userId', value: activeUid }
    );

    const unsubComplaints = subscribeToFirestoreCollection<Complaint>(
      'complaints',
      (remote) => {
        if (remote && remote.length > 0) setComplaints(remote);
      },
      (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'CO_ADMIN')
        ? undefined
        : { field: 'userId', value: activeUid }
    );

    const unsubAnnounce = subscribeToFirestoreCollection<Announcement>('announcements', (remote) => {
      if (remote && remote.length > 0) setAnnouncements(remote);
    });

    const unsubSettings = subscribeToFirestoreCollection<AppSettings & { id?: string }>('app_settings', (remote) => {
      if (remote && remote.length > 0) {
        setAppSettings(prev => mergeAppSettings({ ...prev, ...remote[0] }));
      }
    });

    let unsubUpdates = () => {};
    let unsubOB = () => {};
    let unsubAuditLogs = () => {};
    const deferredListenersTimer = window.setTimeout(() => {
      unsubUpdates = subscribeToFirestoreCollection<AppUpdate>('app_updates', (remote) => {
        if (remote && remote.length > 0) setAppUpdates(remote);
      });

      unsubOB = subscribeToFirestoreCollection<OfficeBearer>('office_bearers', (remote) => {
        if (remote && remote.length > 0) setOfficeBearers(remote);
      });

      unsubAuditLogs = subscribeToFirestoreCollection<AuditLog>('audit_logs', (remote) => {
        if (remote && remote.length > 0) {
          setAuditLogs(prev => {
            const map = new Map<string, AuditLog>();
            prev.forEach(a => map.set(a.id, a));
            remote.forEach(a => map.set(a.id, a));
            return Array.from(map.values()).sort((a, b) =>
              toIsoTimestamp(b.timestamp, '').localeCompare(toIsoTimestamp(a.timestamp, ''))
            );
          });
        }
      });
    }, 450);

    const unsubChats = subscribeToFirestoreCollection<ChatConversation>(
      'chats',
      (remote) => {
        if (remote && remote.length > 0) {
          setChats(prev => {
            const map = new Map<string, ChatConversation>();
            prev.forEach(c => map.set(c.id, c));
            remote.forEach(c => map.set(c.id, c));
            return Array.from(map.values()).sort((a, b) =>
              toIsoTimestamp(b.lastMessageTime, '').localeCompare(toIsoTimestamp(a.lastMessageTime, ''))
            );
          });
        }
      },
      role === 'SUPER_ADMIN'
        ? undefined
        : { field: 'participantIds', value: activeUid, op: 'array-contains' }
    );

    const dmPrimaryMap = new Map<string, ChatMessage>();
    const dmSentMap = new Map<string, ChatMessage>();
    const dmRecvMap = new Map<string, ChatMessage>();

    const normalizeIncomingMsg = (m: ChatMessage & { serverCreatedAt?: unknown }, fallbackStatus: 'DELIVERED' | 'SEEN'): ChatMessage => {
      const safeTs = toIsoTimestamp(m.timestamp || m.createdAt || m.serverCreatedAt, new Date().toISOString());
      const safeCreated = toIsoTimestamp(m.createdAt || m.serverCreatedAt || m.timestamp, safeTs);
      return {
        ...m,
        timestamp: safeTs,
        createdAt: safeCreated,
        deliveryStatus: m.read ? 'SEEN' : (m.deliveryStatus || fallbackStatus)
      };
    };

    const reconcileDirectMessages = (targetMap: Map<string, ChatMessage>, incoming: (ChatMessage & { serverCreatedAt?: unknown })[]) => {
      targetMap.clear();
      (incoming || []).forEach(m => {
        if (
          m.isDeleted ||
          deletedDirectIdsRef.current.has(m.id) ||
          hiddenDirectIdsRef.current.has(m.id) ||
          m.hiddenForUsers?.includes(activeUid)
        ) {
          return;
        }
        targetMap.set(m.id, normalizeIncomingMsg(m, m.read ? 'SEEN' : 'DELIVERED'));
      });

      setChatMessages(prev => {
        const now = Date.now();
        const combined = new Map<string, ChatMessage>();
        dmSentMap.forEach((v, k) => combined.set(k, v));
        dmRecvMap.forEach((v, k) => combined.set(k, v));
        dmPrimaryMap.forEach((v, k) => combined.set(k, v));
        prev.forEach(m => {
          if (
            m.isDeleted ||
            deletedDirectIdsRef.current.has(m.id) ||
            hiddenDirectIdsRef.current.has(m.id) ||
            m.hiddenForUsers?.includes(activeUid)
          ) {
            return;
          }
          const sentAt = localRecentSentMsgsRef.current.get(m.id);
          if (m.deliveryStatus === 'QUEUED' || (sentAt && now - sentAt < 15000)) {
            if (!combined.has(m.id)) combined.set(m.id, m);
          }
        });
        return Array.from(combined.values()).sort((a, b) =>
          (a.createdAt || a.timestamp).localeCompare(b.createdAt || b.timestamp)
        );
      });
    };

    const unsubDirectMsgs = subscribeToFirestoreCollection<ChatMessage>(
      'direct_messages',
      (incoming) => reconcileDirectMessages(dmPrimaryMap, incoming),
      { field: 'participants', value: activeUid, op: 'array-contains' }
    );
    const unsubMsgsSent = subscribeToFirestoreCollection<ChatMessage>(
      'chat_messages',
      (incoming) => reconcileDirectMessages(dmSentMap, incoming),
      { field: 'senderId', value: activeUid }
    );
    const unsubMsgsRecv = subscribeToFirestoreCollection<ChatMessage>(
      'chat_messages',
      (incoming) => reconcileDirectMessages(dmRecvMap, incoming),
      { field: 'recipientId', value: activeUid }
    );

    const commPrimaryMap = new Map<string, ChatMessage>();
    const commLegacyMap = new Map<string, ChatMessage>();

    const reconcileCommunityMessages = (targetMap: Map<string, ChatMessage>, incoming: (ChatMessage & { serverCreatedAt?: unknown })[]) => {
      targetMap.clear();
      (incoming || []).forEach(m => {
        if (
          m.isDeleted ||
          deletedCommunityIdsRef.current.has(m.id) ||
          hiddenCommunityIdsRef.current.has(m.id) ||
          m.hiddenForUsers?.includes(activeUid)
        ) {
          return;
        }
        targetMap.set(m.id, normalizeIncomingMsg(m, 'DELIVERED'));
      });

      setCommunityMessages(prev => {
        const now = Date.now();
        const combined = new Map<string, ChatMessage>();
        commLegacyMap.forEach((v, k) => combined.set(k, v));
        commPrimaryMap.forEach((v, k) => combined.set(k, v));
        prev.forEach(m => {
          if (
            m.isDeleted ||
            deletedCommunityIdsRef.current.has(m.id) ||
            hiddenCommunityIdsRef.current.has(m.id) ||
            m.hiddenForUsers?.includes(activeUid)
          ) {
            return;
          }
          const sentAt = localRecentSentMsgsRef.current.get(m.id);
          if (m.deliveryStatus === 'QUEUED' || (sentAt && now - sentAt < 15000)) {
            if (!combined.has(m.id)) combined.set(m.id, m);
          }
        });
        return Array.from(combined.values()).sort((a, b) =>
          (a.createdAt || a.timestamp).localeCompare(b.createdAt || b.timestamp)
        );
      });
    };

    const unsubCommunityMsgsPrimary = subscribeToFirestoreCollection<ChatMessage>(
      'community_messages',
      (incoming) => reconcileCommunityMessages(commPrimaryMap, incoming),
      undefined,
      { field: 'createdAt', direction: 'asc' }
    );
    const unsubCommunityMsgsLegacy = subscribeToFirestoreCollection<ChatMessage>(
      'community_chat_messages',
      (incoming) => reconcileCommunityMessages(commLegacyMap, incoming)
    );

    return () => {
      window.clearTimeout(deferredListenersTimer);
      unsubUsers();
      unsubNotifications();
      unsubApps();
      unsubPayments();
      unsubComplaints();
      unsubAnnounce();
      unsubUpdates();
      unsubOB();
      unsubSettings();
      unsubAuditLogs();
      unsubChats();
      unsubDirectMsgs();
      unsubMsgsSent();
      unsubMsgsRecv();
      unsubCommunityMsgsPrimary();
      unsubCommunityMsgsLegacy();
    };
  }, [activeSessionUid]);

  const currentUserObjRef = useRef<User | null>(null);
  currentUserObjRef.current = currentUser;

  // Effect C: Live Real-Time Online/Offline Presence (Immediate + 15s Heartbeat + Native Background Listeners)
  useEffect(() => {
    if (!currentUserId || !isOnline) return;
    const active = currentUserObjRef.current || users.find(u => u.id === currentUserId);
    if (!active) return;

    const markOnlineNow = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      const target = currentUserObjRef.current || active;
      const nowMs = Date.now();
      setCurrentUserState(prev =>
        prev && prev.id === target.id ? { ...prev, isOnline: true, lastActiveAt: nowMs } : prev
      );
      setUsers(prev =>
        prev.map(u => (u.id === target.id ? { ...u, isOnline: true, lastActiveAt: nowMs } : u))
      );
      updateUserPresenceInFirestore(target, true, nowMs).catch(() => {});
    };

    const markOfflineNow = () => {
      const target = currentUserObjRef.current || active;
      setCurrentUserState(prev =>
        prev && prev.id === target.id ? { ...prev, isOnline: false, lastActiveAt: 0 } : prev
      );
      setUsers(prev =>
        prev.map(u => (u.id === target.id ? { ...u, isOnline: false, lastActiveAt: 0 } : u))
      );
      markUserOfflineInFirestore(target).catch(() => {});
    };

    if (typeof document === 'undefined' || document.visibilityState === 'visible') {
      markOnlineNow();
    } else {
      markOfflineNow();
    }

    const heartbeat = window.setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        markOnlineNow();
      }
    }, 15000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        markOnlineNow();
      } else {
        markOfflineNow();
      }
    };

    const handleFocus = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        markOnlineNow();
      }
    };
    const handlePageHide = () => markOfflineNow();
    const handleBeforeUnload = () => markOfflineNow();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);

    let capAppHandle: { remove?: () => void } | null = null;
    try {
      const capApp = (window as unknown as {
        Capacitor?: { Plugins?: { App?: { addListener?: (ev: string, cb: (s: { isActive?: boolean }) => void) => Promise<{ remove?: () => void }> | { remove?: () => void } } } };
      }).Capacitor?.Plugins?.App;
      if (capApp?.addListener) {
        const res = capApp.addListener('appStateChange', (state) => {
          if (state?.isActive) markOnlineNow();
          else markOfflineNow();
        });
        if (res && typeof (res as Promise<unknown>).then === 'function') {
          (res as Promise<{ remove?: () => void }>).then(h => {
            capAppHandle = h;
          }).catch(() => {});
        } else {
          capAppHandle = res as { remove?: () => void };
        }
      }
    } catch {
      // Ignore on web browsers without Capacitor App plugin
    }

    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      try {
        capAppHandle?.remove?.();
      } catch {
        // Ignore cleanup failure
      }
    };
  }, [currentUserId, isOnline]);

  const emitAuthAlertNotification = (eventType: 'USER_SIGNUP' | 'USER_LOGIN', targetUser: User) => {
    const locationPart = [targetUser.district, targetUser.stateProvince].filter(Boolean).join(', ');
    const notif: AppNotification = {
      id: `notif_${eventType.toLowerCase()}_${targetUser.id}_${Date.now()}`,
      type: eventType,
      title: eventType === 'USER_SIGNUP'
        ? `New Member Signed Up: ${targetUser.name}`
        : `Member Signed In: ${targetUser.name}`,
      message: `${targetUser.name} (${targetUser.email})${locationPart ? ` from ${locationPart}` : ''} is now Online.`,
      timestamp: new Date().toISOString(),
      read: false,
      targetRole: 'SUPER_ADMIN',
      linkTab: 'members',
      entityId: targetUser.id
    };
    setNotifications(prev => [notif, ...prev]);
    saveNotificationToFirestore(notif).catch(() => {});
  };

  const loginWithGoogleAuth = async (): Promise<User> => {
    const fbUser = await loginWithGoogle();
    const rawSynced = await syncUserWithFirestore(fbUser);
    const existed = users.some(u => u.email.toLowerCase() === rawSynced.email.toLowerCase());
    const synced = establishUserSession(rawSynced, { resetTab: true });
    saveUserToFirestore(synced, { isOnline: true }).catch(() => {});
    emitAuthAlertNotification(existed ? 'USER_LOGIN' : 'USER_SIGNUP', synced);
    return synced;
  };

  const logoutFirebaseAuth = async (): Promise<void> => {
    const exitingUser = currentUser;
    if (exitingUser) {
      setUsers(prev =>
        prev.map(u =>
          u.id === exitingUser.id
            ? { ...u, isOnline: false, lastActiveAt: 0, lastSeen: new Date().toISOString() }
            : u
        )
      );
      await markUserOfflineInFirestore(exitingUser).catch(() => {});
    }
    try {
      await logoutUser();
    } catch {
      // Ignore if signed in purely via OTP / Password
    }
    setFirebaseUser(null);
    setIsFirebaseLive(false);
    persistCurrentUserToStorage(null);
    setCurrentUserState(null);
    setCurrentUserId(null);
    setActiveChatUser(null);
    setActiveTab('dashboard');
  };

  const requestOTP = async (email: string): Promise<OTPRequestResult> => {
    const res = await requestEmailOTP(email, (preparedRecord) => {
      setActiveOtpRecord(preparedRecord);
    });
    if (!res.success && !getPendingEmailOTP()) {
      setActiveOtpRecord(null);
    }
    return res;
  };

  const upsertVerifiedUserByEmail = (
    normEmail: string,
    options?: {
      hasPassword?: boolean;
      passwordHash?: string;
      otpVerifiedOnce?: boolean;
      name?: string;
      remoteExisting?: User | null;
    }
  ): { user: User; isNewSignup: boolean } => {
    const localExisting = users.find(u => u.email.toLowerCase() === normEmail);
    const existing = options?.remoteExisting
      ? mergeUsersLists(localExisting ? [localExisting] : [], [options.remoteExisting], true)[0]
      : localExisting;
    const isFounderEmail = normEmail === ROOT_SUPER_ADMIN_EMAIL.toLowerCase();
    const nowIso = new Date().toISOString();
    const resolvedPwdHash = options?.passwordHash || existing?.passwordHash;
    if (resolvedPwdHash) {
      mirrorPasswordHashToLocalStorage(normEmail, resolvedPwdHash);
    }
    const resolvedHasPwd = Boolean(
      options?.hasPassword ||
      resolvedPwdHash ||
      existing?.hasPassword ||
      hasLocalPasswordCredential(normEmail)
    );

    if (isFounderEmail) {
      if (existing) {
        const updatedSuperAdmin: User = normalizeUserRecord({
          ...existing,
          id: existing.id || 'usr_super_admin',
          role: 'SUPER_ADMIN',
          isFounder: true,
          isStaff: true,
          isSuspended: false,
          profileCompleted: true,
          isOnline: true,
          lastSeen: nowIso,
          approvalStatus: 'approved',
          status: 'approved',
          lastLoginAt: nowIso,
          passwordHash: resolvedPwdHash,
          otpVerifiedOnce: Boolean(options?.otpVerifiedOnce ?? existing.otpVerifiedOnce ?? true),
          hasPassword: resolvedHasPwd
        });
        setUsers(prev => mergeUsersLists(prev, [updatedSuperAdmin], true));
        saveUserToFirestore(updatedSuperAdmin, { isOnline: true }).catch(() => {});
        return { user: updatedSuperAdmin, isNewSignup: false };
      }

      const joinDate = nowIso.split('T')[0];
      const exp = new Date();
      exp.setFullYear(exp.getFullYear() + 5);

      const founderUser: User = normalizeUserRecord({
        id: 'usr_super_admin',
        name: options?.name || 'Asadullah (Founder Super Admin)',
        email: normEmail,
        phone: '',
        role: 'SUPER_ADMIN',
        isFounder: true,
        profileCompleted: true,
        isOnline: true,
        lastSeen: nowIso,
        province: 'Islamabad Capital Territory',
        approvalStatus: 'approved',
        status: 'approved',
        lastLoginAt: nowIso,
        createdAt: nowIso,
        passwordHash: resolvedPwdHash,
        otpVerifiedOnce: Boolean(options?.otpVerifiedOnce ?? true),
        hasPassword: resolvedHasPwd,
        country: 'Pakistan',
        stateProvince: 'Islamabad Capital Territory',
        district: 'Islamabad',
        tehsil: 'Islamabad City',
        cityTown: 'Islamabad',
        unionCouncil: 'UC-01 Secretariat',
        membershipId: 'KC-ADM-001',
        membershipStatus: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        cnic: '',
        address: 'Central Secretariat, Islamabad',
        joinDate,
        validUntil: exp.toISOString().split('T')[0],
        monthlyPledge: 0,
        annualPledge: 0,
        totalContributed: 0,
        isStaff: true,
        notes: 'Verified Founder Super Admin'
      });
      setUsers(prev => mergeUsersLists(prev, [founderUser], true));
      saveUserToFirestore(founderUser, { isOnline: true }).catch(() => {});
      return { user: founderUser, isNewSignup: false };
    }

    if (existing) {
      const existingApproval = resolveUserApprovalStatus(existing);
      const updatedExisting = normalizeUserRecord({
        ...existing,
        isOnline: true,
        lastSeen: nowIso,
        approvalStatus: existingApproval,
        status: existingApproval,
        lastLoginAt: nowIso,
        passwordHash: resolvedPwdHash,
        otpVerifiedOnce: Boolean(options?.otpVerifiedOnce ?? existing.otpVerifiedOnce ?? true),
        hasPassword: resolvedHasPwd
      });
      setUsers(prev => mergeUsersLists(prev, [updatedExisting], true));
      saveUserToFirestore(updatedExisting, { isOnline: true }).catch(() => {});
      return { user: updatedExisting, isNewSignup: false };
    }

    const joinDate = nowIso.split('T')[0];
    const exp = new Date();
    exp.setFullYear(exp.getFullYear() + 3);
    const derivedName =
      options?.name ||
      normEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ||
      'New Member';

    const newMember: User = normalizeUserRecord({
      id: buildSafeEmailUserId(normEmail),
      name: derivedName,
      email: normEmail,
      phone: '',
      role: 'MEMBER',
      isFounder: false,
      profileCompleted: false,
      isOnline: true,
      lastSeen: nowIso,
      province: 'Punjab',
      approvalStatus: 'pending',
      status: 'pending',
      lastLoginAt: nowIso,
      createdAt: nowIso,
      passwordHash: resolvedPwdHash,
      otpVerifiedOnce: Boolean(options?.otpVerifiedOnce ?? true),
      hasPassword: resolvedHasPwd,
      country: 'Pakistan',
      stateProvince: 'Punjab',
      district: 'Lahore',
      tehsil: 'Model Town',
      cityTown: 'Lahore',
      unionCouncil: '',
      membershipId: `KC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      membershipStatus: 'PENDING_DISTRICT_REVIEW',
      verificationStatus: 'PENDING',
      cnic: '',
      address: '',
      joinDate,
      validUntil: exp.toISOString().split('T')[0],
      monthlyPledge: 0,
      annualPledge: 0,
      totalContributed: 0,
      isStaff: false,
      notes: 'Instant login cloud sync (Profile Pending)'
    });

    setUsers(prev => mergeUsersLists(prev, [newMember], true));
    saveUserToFirestore(newMember, { isOnline: true }).catch(() => {});
    return { user: newMember, isNewSignup: true };
  };

  const verifyOTP = async (email: string, code: string): Promise<OTPVerifyResult & { user?: User }> => {
    const res = await verifyEmailOTP(email, code, activeOtpRecord);
    if (!res.success) {
      if (!getPendingEmailOTP()) setActiveOtpRecord(null);
      return res;
    }

    setActiveOtpRecord(null);
    clearPendingEmailOTP();

    const normEmail = (res.verifiedEmail || email).trim().toLowerCase();
    const remoteExisting = await findExistingFirestoreUserByEmail(normEmail);
    const { user: matched, isNewSignup } = upsertVerifiedUserByEmail(normEmail, {
      remoteExisting,
      otpVerifiedOnce: true
    });
    if (matched.isSuspended && !isFounderUser(matched)) {
      return {
        success: false,
        message: 'This account is suspended. Contact the Super Admin.'
      };
    }

    const sessionUser = establishUserSession(matched, { resetTab: true });
    saveUserToFirestore(sessionUser, { isOnline: true }).catch(() => {});
    emitAuthAlertNotification(isNewSignup ? 'USER_SIGNUP' : 'USER_LOGIN', sessionUser);
    return { ...res, user: sessionUser };
  };

  const loginWithPassword = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string; user?: User; needsPasswordSetup?: boolean; existingAccountFound?: boolean }> => {
    const normEmail = email.trim().toLowerCase();
    if (!normEmail || !normEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid Gmail or email address.' };
    }
    if (!password.trim()) {
      return { success: false, message: 'Please enter your password.' };
    }

    const remoteExisting = await findExistingFirestoreUserByEmail(normEmail);
    const localExisting = users.find(u => u.email.toLowerCase() === normEmail);
    const existing = remoteExisting
      ? mergeUsersLists(localExisting ? [localExisting] : [], [remoteExisting], true)[0]
      : localExisting;
    const cloudPwdHash = remoteExisting?.passwordHash || existing?.passwordHash;
    const isFounderEmail = normEmail === ROOT_SUPER_ADMIN_EMAIL.toLowerCase();
    const hasPwd = Boolean(cloudPwdHash || hasLocalPasswordCredential(normEmail));

    if (!hasPwd) {
      return {
        success: false,
        needsPasswordSetup: true,
        existingAccountFound: Boolean(existing || isFounderEmail),
        message: (existing || isFounderEmail)
          ? 'Your existing account does not have a password set yet. Create your password below to sign in directly.'
          : 'No registered account found for this email. Tap Create Account to verify once via Email OTP.'
      };
    }

    const ok = await verifyLocalPasswordCredential(normEmail, password, cloudPwdHash);
    if (!ok) {
      return {
        success: false,
        message: 'Incorrect email or password. Try again or use Forgot Password.'
      };
    }

    if (existing?.isSuspended && !isFounderUser(existing)) {
      return {
        success: false,
        message: 'This account has been suspended by the Super Admin.'
      };
    }

    const ensuredPwdHash = cloudPwdHash || (await computeUserPasswordHash(normEmail, password));
    const { user: loggedInUser, isNewSignup } = upsertVerifiedUserByEmail(normEmail, {
      hasPassword: true,
      passwordHash: ensuredPwdHash,
      otpVerifiedOnce: true,
      remoteExisting
    });
    const sessionUser = establishUserSession(loggedInUser, { resetTab: true });
    saveUserToFirestore(sessionUser, { isOnline: true }).catch(() => {});
    emitAuthAlertNotification(isNewSignup ? 'USER_SIGNUP' : 'USER_LOGIN', sessionUser);
    return { success: true, message: 'Signed in successfully.', user: sessionUser };
  };

  const setupPasswordForExistingAccount = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string; user?: User }> => {
    const normEmail = email.trim().toLowerCase();
    if (!normEmail || !normEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid Gmail or email address.' };
    }
    if (password.trim().length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    const remoteExisting = await findExistingFirestoreUserByEmail(normEmail);
    const localExisting = users.find(u => u.email.toLowerCase() === normEmail);
    const existing = remoteExisting
      ? mergeUsersLists(localExisting ? [localExisting] : [], [remoteExisting], true)[0]
      : localExisting;
    const isFounderEmail = normEmail === ROOT_SUPER_ADMIN_EMAIL.toLowerCase();

    if (!existing && !isFounderEmail) {
      return {
        success: false,
        message: 'No existing account found for this email. Please use Create Account with one-time Email OTP.'
      };
    }

    // Security Guard: Only allow direct password setup if no passwordHash exists yet
    const existingHash = remoteExisting?.passwordHash || existing?.passwordHash;
    if (existingHash) {
      return {
        success: false,
        message: 'This account already has a password set. Sign in with your password or use Forgot Password.'
      };
    }

    const passwordHash = await saveLocalPasswordCredential(normEmail, password);
    const { user } = upsertVerifiedUserByEmail(normEmail, {
      hasPassword: true,
      passwordHash,
      otpVerifiedOnce: true,
      remoteExisting
    });
    const sessionUser = establishUserSession(user, { resetTab: true });
    saveUserToFirestore(sessionUser, { isOnline: true }).catch(() => {});
    emitAuthAlertNotification('USER_LOGIN', sessionUser);
    return { success: true, message: 'Password saved to Cloud and signed in!', user: sessionUser };
  };

  const completePasswordAfterOtp = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string; user?: User }> => {
    const normEmail = email.trim().toLowerCase();
    if (password.trim().length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }
    const passwordHash = await saveLocalPasswordCredential(normEmail, password);
    const remoteExisting = await findExistingFirestoreUserByEmail(normEmail);
    const { user, isNewSignup } = upsertVerifiedUserByEmail(normEmail, {
      hasPassword: true,
      passwordHash,
      otpVerifiedOnce: true,
      remoteExisting
    });
    const sessionUser = establishUserSession(user, { resetTab: true });
    saveUserToFirestore(sessionUser, { isOnline: true }).catch(() => {});
    emitAuthAlertNotification(isNewSignup ? 'USER_SIGNUP' : 'USER_LOGIN', sessionUser);
    return { success: true, message: 'Password saved and signed in.', user: sessionUser };
  };

  const completePasswordResetAndSignIn = async (
    email: string,
    code: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string; user?: User }> => {
    const res = await verifyPasswordReset(email, code, newPassword);
    if (!res.success) {
      return { success: false, message: res.message };
    }
    const normEmail = (res.verifiedEmail || email).trim().toLowerCase();
    const passwordHash = await computeUserPasswordHash(normEmail, newPassword);
    const remoteExisting = await findExistingFirestoreUserByEmail(normEmail);
    const { user, isNewSignup } = upsertVerifiedUserByEmail(normEmail, {
      hasPassword: true,
      passwordHash,
      otpVerifiedOnce: true,
      remoteExisting
    });
    if (user.isSuspended && !isFounderUser(user)) {
      return {
        success: false,
        message: 'Your password was updated, but this account is suspended. Contact the Super Admin.'
      };
    }
    const sessionUser = establishUserSession(user, { resetTab: true });
    saveUserToFirestore(sessionUser, { isOnline: true }).catch(() => {});
    emitAuthAlertNotification(isNewSignup ? 'USER_SIGNUP' : 'USER_LOGIN', sessionUser);
    return { success: true, message: res.message, user: sessionUser };
  };

  const setOrChangeUserPassword = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    const normEmail = email.trim().toLowerCase();
    if (password.trim().length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }
    const passwordHash = await saveLocalPasswordCredential(normEmail, password);
    setUsers(prev =>
      prev.map(u => {
        if (u.email.toLowerCase() === normEmail) {
          const updated = { ...u, hasPassword: true, passwordHash };
          saveUserToFirestore(updated, { isOnline: u.id === currentUserId }).catch(() => {});
          return updated;
        }
        return u;
      })
    );
    return { success: true, message: 'Password saved to Cloud and updated successfully.' };
  };

  const logAudit = (
    action: string, 
    category: AuditLog['category'], 
    targetEntity: string, 
    details: string,
    district?: string,
    stateProvince?: string
  ) => {
    const newLog: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser?.id || 'system_guest',
      actorName: currentUser?.name || 'Applicant',
      actorRole: currentUser?.role || 'MEMBER',
      action,
      category,
      country: 'Pakistan',
      stateProvince: stateProvince || currentUser?.stateProvince || 'Pakistan',
      district: district || currentUser?.district || '',
      targetEntity,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveAuditLogToFirestore(newLog).catch(() => {});
  };

  const addNotification = (data: {
    type: NotificationType;
    title: string;
    message: string;
    targetUserId?: string;
    targetRole?: UserRole | 'ALL' | 'Super Admin';
    targetStateProvince?: string;
    targetDistrict?: string;
    linkTab?: string;
    entityId?: string;
    actionUrl?: string;
    memberId?: string;
    memberUid?: string;
    memberName?: string;
    memberEmail?: string;
    district?: string;
  }) => {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
      isRead: false,
      ...data
    };
    setNotifications(prev => [newNotif, ...prev]);
    saveNotificationToFirestore(newNotif).catch(() => {});
  };

  const markNotificationAsRead = useCallback((id: string) => {
    locallyReadNotifIdsRef.current.add(id);
    setNotifications(prev => {
      const next = prev.map(n => {
        if (n.id === id) {
          const updated: AppNotification = { ...n, read: true, isRead: true };
          saveNotificationToFirestore(updated).catch(() => {});
          return updated;
        }
        return n;
      });
      safeSetItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(next));
      return next;
    });
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => {
      let hasChanges = false;
      const next = prev.map(n => {
        if (!n.read || !n.isRead) {
          hasChanges = true;
          locallyReadNotifIdsRef.current.add(n.id);
          const updated: AppNotification = { ...n, read: true, isRead: true };
          saveNotificationToFirestore(updated).catch(() => {});
          return updated;
        }
        return n;
      });
      if (hasChanges) {
        safeSetItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(next));
      }
      return hasChanges ? next : prev;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications(prev => {
      prev.forEach(n => {
        locallyReadNotifIdsRef.current.add(n.id);
        if (!n.read || !n.isRead) {
          saveNotificationToFirestore({ ...n, read: true, isRead: true }).catch(() => {});
        }
      });
      safeSetItem(STORAGE_KEYS.NOTIFICATIONS, '[]');
      return [];
    });
  }, []);

  const userNotifications = useMemo(() => {
    if (!currentUser) return [];
    return notifications.filter(n => {
      if (n.targetUserId && n.targetUserId === currentUser.id) return true;
      if (n.targetRole === 'ALL' || !n.targetRole) return true;
      if (currentUser.role === 'SUPER_ADMIN') {
        if (
          n.type === 'PAYMENT_PENDING' ||
          n.type === 'approval_request' ||
          n.targetRole === 'Super Admin' ||
          n.targetRole === 'SUPER_ADMIN'
        ) {
          return true;
        }
      }
      if (n.targetRole === currentUser.role) {
        if (currentUser.role === 'ADMIN' && n.targetDistrict && n.targetDistrict !== currentUser.district) {
          return false;
        }
        if (currentUser.role === 'CO_ADMIN' && n.targetStateProvince && n.targetStateProvince !== currentUser.stateProvince) {
          return false;
        }
        return true;
      }
      return false;
    });
  }, [currentUser, notifications]);

  const unreadNotificationsCount = useMemo(
    () => userNotifications.filter(n => !n.read && !n.isRead).length,
    [userNotifications]
  );

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'ur' : 'en'));
  };

  const canAccess = (permission: string): boolean => {
    if (!currentUser) return false;
    const role = currentUser.role;
    const perms = currentUser.permissions;

    switch (permission) {
      case 'SUPER_ADMIN_CONTROL':
      case 'MANAGE_APP':
      case 'MANAGE_APP_UPDATES':
      case 'APPOINT_ADMINS':
      case 'APPOINT_CO_ADMINS':
      case 'APPOINT_OFFICE_BEARERS':
      case 'MANAGE_APP_SETTINGS':
        return role === 'SUPER_ADMIN';

      case 'MANAGE_SUPER_ADMINS':
        return isFounderUser(currentUser);

      case 'VIEW_MEMBERS':
        return Boolean(currentUser);

      case 'APPROVE_MEMBERSHIP_FINAL':
        return role === 'SUPER_ADMIN' || Boolean(perms?.canApproveMembers);

      case 'RECOMMEND_MEMBERSHIP':
        return role === 'SUPER_ADMIN' || role === 'ADMIN' || Boolean(perms?.canApproveMembers);

      case 'MANAGE_FUNDS':
      case 'VERIFY_PAYMENTS':
        return role === 'SUPER_ADMIN' || role === 'ADMIN' || Boolean(currentUser.isAuditOfficer) || Boolean(perms?.canVerifyPayments);

      case 'GENERATE_RECEIPTS':
        return true;

      case 'MANAGE_ALL_COMPLAINTS':
        return role === 'SUPER_ADMIN';

      case 'MANAGE_DISTRICT_COMPLAINTS':
        return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'CO_ADMIN' || Boolean(perms?.canManageComplaints);

      case 'PUBLISH_GLOBAL_ANNOUNCEMENTS':
      case 'PUBLISH_OFFICIAL_ANNOUNCEMENTS':
        return role === 'SUPER_ADMIN' || Boolean(perms?.canPostOfficialAnnouncements);

      case 'PUBLISH_DISTRICT_ANNOUNCEMENTS':
        return (
          appSettings.featureToggles?.allowCommunityAnnouncements !== false &&
          (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'CO_ADMIN' || Boolean(perms?.canPostCommunityAnnouncements))
        );

      case 'CHAT_MESSAGING':
        return appSettings.chatEnabled;

      case 'VIEW_AUDIT_LOGS':
        return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'CO_ADMIN' || Boolean(currentUser.isAuditOfficer) || Boolean(perms?.canViewReports);

      default:
        return false;
    }
  };

  // Workflow 1: District Admin Recommends Membership
  const recommendApplication = (appId: string, recommendation: 'APPROVE' | 'REJECT', remarks: string) => {
    if (!currentUser) return;
    const targetApp = applications.find(a => a.id === appId);
    if (!targetApp) return;

    const updatedApp: MembershipApplication = {
      ...targetApp,
      status: recommendation === 'APPROVE' ? 'RECOMMENDED_BY_DISTRICT' : 'REJECTED',
      districtAdminId: currentUser.id,
      districtAdminName: currentUser.name,
      districtRecommendation: recommendation,
      districtRemarks: remarks,
      districtReviewedAt: new Date().toISOString()
    };

    setApplications(prev => prev.map(app => app.id === appId ? updatedApp : app));
    saveApplicationToFirestore(updatedApp).catch(() => {});

    logAudit(
      'DISTRICT_RECOMMENDATION_SUBMITTED',
      'MEMBERSHIP',
      `Application ${appId}`,
      `District Admin ${currentUser.name} recorded recommendation: ${recommendation}. Remarks: "${remarks}"`,
      targetApp.district,
      targetApp.stateProvince
    );

    addNotification({
      type: 'MEMBERSHIP_RECOMMENDED',
      title: 'Application Recommended by Admin',
      message: `${targetApp.applicantName} (${targetApp.district}) has been recommended for final approval.`,
      targetRole: 'SUPER_ADMIN',
      linkTab: 'approvals',
      entityId: appId
    });
  };

  // Workflow 2: Super Admin Final Approval (with Atomic Matching Serial & Official Notification)
  const finalApproveApplication = async (
    appId: string,
    remarks?: string,
    officeData?: {
      formFeeAmount?: number;
      officeSecretarySignature?: string;
      presidentSignature?: string;
    }
  ) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') return;
    const targetApp = applications.find(a => a.id === appId);
    if (!targetApp) return;

    const matchedSerial =
      targetApp.serialNumber ||
      targetApp.generatedMembershipId ||
      (await generateAtomicSerialNumber());

    const updatedApp: MembershipApplication = {
      ...targetApp,
      serialNumber: matchedSerial,
      status: 'ACTIVE',
      superAdminRemarks: remarks || 'Final approval granted under Kifayat Connect bylaws.',
      superAdminApprovedAt: new Date().toISOString(),
      generatedMembershipId: matchedSerial,
      formFeeAmount: officeData?.formFeeAmount ?? targetApp.formFeeAmount,
      officeSecretarySignature: officeData?.officeSecretarySignature || targetApp.officeSecretarySignature,
      presidentSignature: officeData?.presidentSignature || targetApp.presidentSignature
    };

    setApplications(prev => prev.map(app => app.id === appId ? updatedApp : app));
    saveApplicationToFirestore(updatedApp).catch(() => {});

    const exp = new Date();
    exp.setFullYear(exp.getFullYear() + 3);

    const normEmail = (targetApp.email || '').trim().toLowerCase();
    const normAppCnic = normalizeCnicDigits(targetApp.cnic);
    const existingMember = users.find(u =>
      (normEmail && u.email?.trim().toLowerCase() === normEmail) ||
      (normAppCnic.length === 13 && normalizeCnicDigits(u.cnic) === normAppCnic)
    );
    let targetNotifUserId = existingMember?.id;

    if (existingMember) {
      const updatedMember: User = normalizeUserRecord({
        ...existingMember,
        name: targetApp.applicantName || existingMember.name,
        phone: targetApp.phone || existingMember.phone,
        cnic: targetApp.cnic || existingMember.cnic,
        country: targetApp.country || existingMember.country,
        stateProvince: targetApp.stateProvince || existingMember.stateProvince,
        district: targetApp.district || existingMember.district,
        tehsil: targetApp.tehsil || existingMember.tehsil,
        cityTown: targetApp.cityTown || existingMember.cityTown,
        unionCouncil: targetApp.unionCouncil || existingMember.unionCouncil,
        address: targetApp.address || existingMember.address,
        tabbarId: targetApp.tabbarId || existingMember.tabbarId,
        tabbarUrdu: targetApp.tabbarUrdu || existingMember.tabbarUrdu,
        tabbarEnglish: targetApp.tabbarEnglish || existingMember.tabbarEnglish,
        monthlyPledge: targetApp.monthlyPledgeAmount || existingMember.monthlyPledge,
        membershipId: matchedSerial,
        memberId: matchedSerial,
        membershipStatus: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        approvalStatus: 'approved',
        status: 'approved',
        approvedBy: currentUser.name,
        approvedAt: new Date().toISOString(),
        validUntil: exp.toISOString().split('T')[0]
      });
      setUsers(prev => prev.map(u => u.id === existingMember.id ? updatedMember : u));
      saveUserToFirestore(updatedMember).catch(() => {});
    } else {
      const newMemberId = `usr_${Date.now()}`;
      targetNotifUserId = newMemberId;
      const newMemberUser: User = normalizeUserRecord({
        id: newMemberId,
        name: targetApp.applicantName,
        email: normEmail || `${matchedSerial.toLowerCase()}@member.kifayatconnect.org`,
        phone: targetApp.phone,
        role: 'MEMBER',
        isFounder: false,
        hasPassword: hasLocalPasswordCredential(normEmail),
        profileCompleted: true,
        approvalStatus: 'approved',
        status: 'approved',
        approvedBy: currentUser.name,
        approvedAt: new Date().toISOString(),
        country: targetApp.country || 'Pakistan',
        stateProvince: targetApp.stateProvince,
        district: targetApp.district,
        tehsil: targetApp.tehsil,
        cityTown: targetApp.cityTown,
        unionCouncil: targetApp.unionCouncil,
        tabbarId: targetApp.tabbarId,
        tabbarUrdu: targetApp.tabbarUrdu,
        tabbarEnglish: targetApp.tabbarEnglish,
        membershipId: matchedSerial,
        memberId: matchedSerial,
        membershipStatus: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        avatarUrl: targetApp.applicantPhotoUrl,
        photoUrl: targetApp.applicantPhotoUrl,
        cnic: targetApp.cnic,
        address: targetApp.address,
        joinDate: new Date().toISOString().split('T')[0],
        validUntil: exp.toISOString().split('T')[0],
        monthlyPledge: targetApp.monthlyPledgeAmount || 100,
        annualPledge: (targetApp.monthlyPledgeAmount || 100) * 12,
        totalContributed: 0,
        isStaff: false,
        notes: targetApp.isOldMemberVerification 
          ? `Verified legacy member. Old ID: ${targetApp.oldMembershipNo || matchedSerial}` 
          : 'Verified member via Rukniyat & governance pipeline.'
      });
      setUsers(prev => [newMemberUser, ...prev]);
      saveUserToFirestore(newMemberUser).catch(() => {});
    }

    logAudit(
      'FINAL_MEMBERSHIP_APPROVAL_GRANTED',
      'MEMBERSHIP',
      matchedSerial,
      `Super Admin ${currentUser.name} approved Rukniyat Serial ${matchedSerial} for ${targetApp.applicantName}.`,
      targetApp.district,
      targetApp.stateProvince
    );

    addNotification({
      type: 'MEMBERSHIP_APPROVED',
      title: `Approved! Official Raseed & Rukniyat Unlocked (${matchedSerial})`,
      message: '✅ Mubarak ho! Aapki payment / rukniyat approve ho gayi hai. Ab aap apni official Raseed (Receipt) le sakte hain aur download kar sakte hain.',
      targetUserId: targetNotifUserId,
      linkTab: 'dashboard',
      entityId: appId
    });
  };

  const rejectApplication = (appId: string, remarks: string) => {
    if (!currentUser) return;
    const targetApp = applications.find(a => a.id === appId);
    if (!targetApp) return;

    const updatedApp: MembershipApplication = {
      ...targetApp,
      status: 'REJECTED',
      superAdminRemarks: remarks
    };

    setApplications(prev => prev.map(app => app.id === appId ? updatedApp : app));
    saveApplicationToFirestore(updatedApp).catch(() => {});

    logAudit(
      'MEMBERSHIP_APPLICATION_REJECTED',
      'MEMBERSHIP',
      `Application ${appId}`,
      `Rejected by ${currentUser.name} (${currentUser.role}). Reason: "${remarks}"`,
      targetApp.district,
      targetApp.stateProvince
    );
  };

  const attachDocumentToApplication = (
    appId: string, 
    docData: { 
      name: string; 
      type: SupportingDocumentType; 
      fileUrl: string; 
      fileSize: number; 
      fileMime: string; 
      notes?: string 
    }
  ) => {
    if (!currentUser) return { success: false, error: 'Authentication required' };
    const targetApp = applications.find(a => a.id === appId);
    if (!targetApp) return { success: false, error: 'Application not found' };

    if (docData.fileSize > 5 * 1024 * 1024) {
      return { success: false, error: 'File size exceeds 5MB limit.' };
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimes.includes(docData.fileMime) && !docData.fileMime.startsWith('image/')) {
      return { success: false, error: 'Invalid file format. Only JPG, PNG, WEBP, and PDF documents are allowed.' };
    }

    const newDoc: SupportingDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: docData.name,
      type: docData.type,
      fileUrl: docData.fileUrl,
      fileSize: docData.fileSize,
      fileMime: docData.fileMime,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.name,
      notes: docData.notes,
      verificationStatus: 'PENDING'
    };

    const updatedApp: MembershipApplication = {
      ...targetApp,
      supportingDocuments: [...(targetApp.supportingDocuments || []), newDoc]
    };

    setApplications(prev => prev.map(a => a.id === appId ? updatedApp : a));
    saveApplicationToFirestore(updatedApp).catch(() => {});

    logAudit(
      'DOCUMENT_ATTACHED',
      'MEMBERSHIP',
      appId,
      `Supporting document "${docData.name}" (${docData.type}) attached by ${currentUser.name}.`,
      targetApp.district,
      targetApp.stateProvince
    );

    addNotification({
      type: 'MEMBERSHIP_PENDING_DISTRICT',
      title: 'Supporting Document Attached',
      message: `${currentUser.name} uploaded ${docData.name} (${docData.type}) to application ${targetApp.applicantName}.`,
      targetRole: 'SUPER_ADMIN',
      linkTab: 'approvals',
      entityId: appId
    });

    return { success: true };
  };

  const removeDocumentFromApplication = (appId: string, docId: string) => {
    if (!currentUser) return { success: false };
    const targetApp = applications.find(a => a.id === appId);
    if (!targetApp) return { success: false };

    const docToRemove = targetApp.supportingDocuments?.find(d => d.id === docId);
    const updatedApp: MembershipApplication = {
      ...targetApp,
      supportingDocuments: (targetApp.supportingDocuments || []).filter(d => d.id !== docId)
    };

    setApplications(prev => prev.map(a => a.id === appId ? updatedApp : a));
    saveApplicationToFirestore(updatedApp).catch(() => {});

    logAudit(
      'DOCUMENT_REMOVED',
      'MEMBERSHIP',
      appId,
      `Supporting document "${docToRemove?.name || docId}" removed by ${currentUser.name}.`,
      targetApp.district,
      targetApp.stateProvince
    );

    return { success: true };
  };

  const verifyApplicationDocument = (
    appId: string, 
    docId: string, 
    status: 'VERIFIED' | 'FLAGGED', 
    notes?: string
  ) => {
    if (!currentUser) return { success: false };
    const targetApp = applications.find(a => a.id === appId);
    if (!targetApp) return { success: false };

    const updatedDocs = (targetApp.supportingDocuments || []).map(doc => {
      if (doc.id === docId) {
        return {
          ...doc,
          verificationStatus: status,
          verifiedBy: currentUser.name,
          verifiedAt: new Date().toISOString(),
          verificationNotes: notes
        };
      }
      return doc;
    });

    const updatedApp: MembershipApplication = {
      ...targetApp,
      supportingDocuments: updatedDocs
    };

    setApplications(prev => prev.map(a => a.id === appId ? updatedApp : a));
    saveApplicationToFirestore(updatedApp).catch(() => {});

    logAudit(
      'DOCUMENT_VERIFIED',
      'MEMBERSHIP',
      appId,
      `Document ${docId} on application ${targetApp.applicantName} marked as ${status} by ${currentUser.name}.`,
      targetApp.district,
      targetApp.stateProvince
    );

    return { success: true };
  };

  const registerMember = async (data: {
    applicantName: string;
    email: string;
    phone: string;
    cnic: string;
    country?: string;
    stateProvince?: string;
    district?: string;
    tehsil?: string;
    cityTown?: string;
    unionCouncil?: string;
    address: string;
    tabbarId?: string;
    tabbarUrdu?: string;
    tabbarEnglish?: string;
    isOldMember: boolean;
    oldMembershipNo?: string;
    password?: string;
    avatarUrl?: string;
  }) => {
    const loc = mapLegacyRegionToHierarchy('');
    const prov = data.stateProvince || loc.stateProvince;
    const dist = data.district || loc.district;
    const normEmail = data.email.trim().toLowerCase();
    const resolvedTabbar = resolveUserTabbar({
      tabbarId: data.tabbarId,
      tabbarUrdu: data.tabbarUrdu,
      tabbarEnglish: data.tabbarEnglish
    });

    let savedPwdHash: string | undefined;
    if (data.password && data.password.trim().length >= 6) {
      savedPwdHash = await saveLocalPasswordCredential(normEmail, data.password.trim());
    }

    const newApp: MembershipApplication = {
      id: `app_${Date.now()}`,
      applicantName: data.applicantName,
      email: normEmail,
      phone: data.phone,
      cnic: data.cnic,
      country: data.country || 'Pakistan',
      stateProvince: prov,
      district: dist,
      tehsil: data.tehsil || data.cityTown || dist,
      cityTown: data.cityTown || dist,
      unionCouncil: data.unionCouncil || '',
      address: data.address,
      tabbarId: resolvedTabbar?.id || data.tabbarId,
      tabbarUrdu: resolvedTabbar?.urduName || data.tabbarUrdu,
      tabbarEnglish: resolvedTabbar?.englishName || data.tabbarEnglish,
      submittedAt: new Date().toISOString(),
      status: 'PENDING_DISTRICT_REVIEW',
      isOldMemberVerification: data.isOldMember,
      oldMembershipNo: data.oldMembershipNo
    };

    setApplications(prev => [newApp, ...prev]);
    ensureFirebaseAuthSession().then(() => saveApplicationToFirestore(newApp)).catch(() => {});

    const remoteRegMatch = await findExistingFirestoreUserByEmail(normEmail);
    const localRegMatch = users.find(u => u.email.toLowerCase() === normEmail);
    const existing = remoteRegMatch
      ? mergeUsersLists(localRegMatch ? [localRegMatch] : [], [remoteRegMatch], true)[0]
      : localRegMatch;
    const exp = new Date();
    exp.setFullYear(exp.getFullYear() + 3);
    const joinDate = new Date().toISOString().split('T')[0];

    const photo = data.avatarUrl || existing?.avatarUrl || existing?.photoUrl;
    const nowIso = new Date().toISOString();
    const isFounderEmail = normEmail === ROOT_SUPER_ADMIN_EMAIL.toLowerCase();
    const alreadyApproved = Boolean(
      isFounderEmail ||
      (existing && resolveUserApprovalStatus(existing) === 'approved' && existing.profileCompleted)
    );
    const nextApprovalStatus: 'approved' | 'pending' = alreadyApproved ? 'approved' : 'pending';
    const shouldEmitApprovalReq = !isFounderEmail && !alreadyApproved && !existing?.approvalRequestSentAt;
    const finalPwdHash = savedPwdHash || existing?.passwordHash;

    const registeredUser: User = existing
      ? normalizeUserRecord({
          ...existing,
          name: data.applicantName || existing.name,
          phone: data.phone || existing.phone,
          cnic: data.cnic || existing.cnic,
          avatarUrl: photo,
          photoUrl: photo,
          stateProvince: prov,
          province: prov,
          district: dist,
          tehsil: data.tehsil || data.cityTown || dist,
          cityTown: data.cityTown || dist,
          unionCouncil: data.unionCouncil || existing.unionCouncil,
          address: data.address || existing.address,
          tabbarId: resolvedTabbar?.id ?? data.tabbarId ?? existing.tabbarId,
          tabbarUrdu: resolvedTabbar?.urduName ?? data.tabbarUrdu ?? existing.tabbarUrdu,
          tabbarEnglish: resolvedTabbar?.englishName ?? data.tabbarEnglish ?? existing.tabbarEnglish,
          profileCompleted: true,
          approvalStatus: nextApprovalStatus,
          status: nextApprovalStatus,
          membershipStatus: alreadyApproved ? 'ACTIVE' : 'PENDING_DISTRICT_REVIEW',
          verificationStatus: alreadyApproved ? 'VERIFIED' : 'PENDING',
          approvalRequestSentAt: shouldEmitApprovalReq ? nowIso : existing.approvalRequestSentAt,
          isOnline: true,
          lastActiveAt: Date.now(),
          lastSeen: nowIso,
          lastLoginAt: nowIso,
          passwordHash: finalPwdHash,
          otpVerifiedOnce: true,
          hasPassword: Boolean(finalPwdHash) || existing.hasPassword || hasLocalPasswordCredential(normEmail)
        })
      : normalizeUserRecord({
          id: buildSafeEmailUserId(normEmail),
          name: data.applicantName,
          email: normEmail,
          phone: data.phone,
          role: 'MEMBER',
          isFounder: isFounderEmail,
          isAuditOfficer: false,
          profileCompleted: true,
          approvalStatus: nextApprovalStatus,
          status: nextApprovalStatus,
          approvalRequestSentAt: isFounderEmail ? undefined : nowIso,
          isOnline: true,
          lastActiveAt: Date.now(),
          lastLoginAt: nowIso,
          passwordHash: finalPwdHash,
          otpVerifiedOnce: true,
          hasPassword: Boolean(finalPwdHash) || hasLocalPasswordCredential(normEmail),
          country: data.country || 'Pakistan',
          stateProvince: prov,
          district: dist,
          tehsil: data.tehsil || data.cityTown || dist,
          cityTown: data.cityTown || dist,
          unionCouncil: data.unionCouncil || '',
          tabbarId: resolvedTabbar?.id ?? data.tabbarId,
          tabbarUrdu: resolvedTabbar?.urduName ?? data.tabbarUrdu,
          tabbarEnglish: resolvedTabbar?.englishName ?? data.tabbarEnglish,
          membershipId: `KC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          membershipStatus: isFounderEmail ? 'ACTIVE' : 'PENDING_DISTRICT_REVIEW',
          verificationStatus: isFounderEmail ? 'VERIFIED' : 'PENDING',
          avatarUrl: photo,
          photoUrl: photo,
          cnic: data.cnic,
          address: data.address,
          joinDate,
          createdAt: nowIso,
          validUntil: exp.toISOString().split('T')[0],
          monthlyPledge: 0,
          annualPledge: 0,
          totalContributed: 0,
          isStaff: false,
          notes: 'Registered via One-Time Email OTP + Password flow'
        });

    const sessionUser = establishUserSession(registeredUser, { resetTab: true });
    saveUserToFirestore(sessionUser, { isOnline: true }).catch(() => {});
    emitAuthAlertNotification('USER_SIGNUP', sessionUser);

    if (shouldEmitApprovalReq || !existing) {
      const approvalNotifId = `notif_approval_${registeredUser.id}_${Date.now()}`;
      const approvalNotif: AppNotification = {
        id: approvalNotifId,
        type: 'approval_request',
        targetRole: 'Super Admin',
        title: `Approval Request: ${registeredUser.name}`,
        message: `${registeredUser.name} (${registeredUser.district}) — New profile awaiting approval`,
        memberId: registeredUser.membershipId || registeredUser.id,
        memberUid: registeredUser.id,
        memberName: registeredUser.name,
        memberEmail: registeredUser.email,
        district: registeredUser.district,
        read: false,
        timestamp: nowIso,
        linkTab: 'members',
        entityId: registeredUser.id
      };
      setNotifications(prev => [approvalNotif, ...prev]);
      sendApprovalRequestNotificationToFirestore(registeredUser, approvalNotifId).catch(() => {});
    }

    logAudit(
      'NEW_MEMBERSHIP_APPLICATION_SUBMITTED',
      'MEMBERSHIP',
      newApp.id,
      `New membership application submitted by ${data.applicantName} (${dist}, ${prov}).`,
      dist,
      prov
    );

    addNotification({
      type: 'MEMBERSHIP_PENDING_DISTRICT',
      title: 'New Member Registration in District',
      message: `${data.applicantName} registered in ${dist}. Please conduct background verification.`,
      targetRole: 'ADMIN',
      targetDistrict: dist,
      linkTab: 'members',
      entityId: registeredUser.id
    });
  };

  const submitRukniyatForm: AppContextType['submitRukniyatForm'] = async (payload) => {
    if (!isValid13DigitCnic(payload.cnic)) {
      return { success: false, error: getCnicLockAlertMessage(language) };
    }
    const formattedCnic = formatCnicDisplay(payload.cnic);
    const serialNumber = await generateAtomicSerialNumber();
    const resolvedTabbar = resolveUserTabbar({
      tabbarId: payload.tabbarId,
      tabbarUrdu: payload.tabbarUrdu,
      tabbarEnglish: payload.tabbarEnglish
    });
    const normEmail = (payload.email || currentUser?.email || '').trim().toLowerCase();

    const newApp: MembershipApplication = {
      id: `app_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      serialNumber,
      applicantName: payload.applicantName.trim(),
      fatherName: payload.fatherName.trim(),
      email: normEmail,
      phone: payload.phone.trim(),
      cnic: formattedCnic,
      education: payload.education?.trim(),
      experience: payload.experience?.trim(),
      profession: payload.profession?.trim(),
      maritalStatus: payload.maritalStatus?.trim(),
      currentArea: payload.currentArea?.trim(),
      ancestralArea: payload.ancestralArea?.trim(),
      dob: payload.dob,
      age: payload.age?.trim(),
      unit: payload.unit?.trim() || payload.district,
      country: payload.country || 'Pakistan',
      stateProvince: payload.stateProvince,
      district: payload.district,
      tehsil: payload.tehsil || payload.district,
      cityTown: payload.cityTown || payload.district,
      unionCouncil: payload.unionCouncil || '',
      address: payload.address.trim(),
      permanentAddress: payload.permanentAddress?.trim(),
      tabbarId: resolvedTabbar?.id || payload.tabbarId,
      tabbarUrdu: resolvedTabbar?.urduName || payload.tabbarUrdu,
      tabbarEnglish: resolvedTabbar?.englishName || payload.tabbarEnglish,
      subBranch: payload.subBranch?.trim(),
      tabarRepName: payload.tabarRepName?.trim(),
      tabarRepSignature: payload.tabarRepSignature?.trim(),
      applicantPhotoUrl: payload.applicantPhotoUrl,
      applicantSignature: payload.applicantSignature,
      monthlyPledgeAmount: payload.monthlyPledgeAmount,
      isRukniyatForm: true,
      submittedAt: new Date().toISOString(),
      status: 'PENDING_DISTRICT_REVIEW',
      isOldMemberVerification: Boolean(payload.isOldMemberVerification),
      oldMembershipNo: payload.oldMembershipNo?.trim()
    };

    setApplications(prev => [newApp, ...prev]);
    ensureFirebaseAuthSession().then(() => saveApplicationToFirestore(newApp)).catch(() => {});

    // Safely fill missing CNIC / Tabar on signed-in applicant without altering approval/role state
    if (currentUser) {
      const updatedSelf = normalizeUserRecord({
        ...currentUser,
        cnic: isValid13DigitCnic(currentUser.cnic) ? currentUser.cnic : formattedCnic,
        phone: currentUser.phone || payload.phone.trim(),
        tabbarId: currentUser.tabbarId || newApp.tabbarId,
        tabbarUrdu: currentUser.tabbarUrdu || newApp.tabbarUrdu,
        tabbarEnglish: currentUser.tabbarEnglish || newApp.tabbarEnglish,
        monthlyPledge: payload.monthlyPledgeAmount || currentUser.monthlyPledge,
        membershipId: currentUser.membershipId || serialNumber,
        profileCompleted: true
      });
      setCurrentUserState(updatedSelf);
      persistCurrentUserToStorage(updatedSelf);
      setUsers(prev => prev.map(u => (u.id === currentUser.id ? updatedSelf : u)));
      saveUserToFirestore(updatedSelf, { isOnline: true }).catch(() => {});
    }

    logAudit(
      'RUKNIYAT_FORM_SUBMITTED',
      'MEMBERSHIP',
      serialNumber,
      `Rukniyat Form ${serialNumber} submitted by ${newApp.applicantName} (${newApp.district}).`,
      newApp.district,
      newApp.stateProvince
    );

    addNotification({
      type: 'MEMBERSHIP_PENDING_DISTRICT',
      title: `New Rukniyat Form (${serialNumber})`,
      message: `${newApp.applicantName} (${newApp.district}) submitted Rukniyat Form #${serialNumber} awaiting approval.`,
      targetRole: 'SUPER_ADMIN',
      linkTab: 'approvals',
      entityId: newApp.id
    });

    addNotification({
      type: 'MEMBERSHIP_PENDING_DISTRICT',
      title: `Rukniyat Form Review (${serialNumber})`,
      message: `${newApp.applicantName} (${newApp.district}) submitted Rukniyat Form #${serialNumber}.`,
      targetRole: 'ADMIN',
      targetDistrict: newApp.district,
      linkTab: 'approvals',
      entityId: newApp.id
    });

    return { success: true, serialNumber, application: newApp };
  };

  const createOldPaperRecord: AppContextType['createOldPaperRecord'] = async (data) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Only Founder or Super Admin can digitize old by-hand paper records.' };
    }
    if (!isValid13DigitCnic(data.cnic)) {
      return { success: false, error: getCnicLockAlertMessage(language) };
    }

    const formattedCnic = formatCnicDisplay(data.cnic);
    const normDigits = normalizeCnicDigits(formattedCnic);
    const serialNumber =
      (data.oldReceiptSerialNo && data.oldReceiptSerialNo.trim()) ||
      (await generateAtomicSerialNumber());
    const resolvedTabbar = resolveUserTabbar({
      tabbarId: data.tabbarId,
      tabbarUrdu: data.tabbarUrdu,
      tabbarEnglish: data.tabbarEnglish
    });
    const recordDate = data.date || new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();
    const prov = data.stateProvince || currentUser.stateProvince || 'Khyber Pakhtunkhwa';
    const dist = data.district || data.unit || currentUser.district || 'Mardan';
    const normEmail = (data.email || '').trim().toLowerCase();

    const matchedUser = users.find(u =>
      (normDigits.length === 13 && normalizeCnicDigits(u.cnic) === normDigits) ||
      (normEmail && u.email?.trim().toLowerCase() === normEmail) ||
      (data.oldMembershipNo && u.membershipId?.toLowerCase() === data.oldMembershipNo.trim().toLowerCase())
    );

    const membershipCode = (data.oldMembershipNo && data.oldMembershipNo.trim()) || matchedUser?.membershipId || serialNumber;
    let targetUserId = matchedUser?.id;

    if (matchedUser) {
      const safeUpdatedUser = normalizeUserRecord({
        ...matchedUser,
        cnic: isValid13DigitCnic(matchedUser.cnic) ? matchedUser.cnic : formattedCnic,
        phone: matchedUser.phone || data.phone || '',
        address: matchedUser.address || data.address || '',
        tabbarId: matchedUser.tabbarId || resolvedTabbar?.id || data.tabbarId,
        tabbarUrdu: matchedUser.tabbarUrdu || resolvedTabbar?.urduName || data.tabbarUrdu,
        tabbarEnglish: matchedUser.tabbarEnglish || resolvedTabbar?.englishName || data.tabbarEnglish,
        totalContributed: (matchedUser.totalContributed || 0) + (data.amount > 0 ? data.amount : 0)
      });
      setUsers(prev => prev.map(u => (u.id === matchedUser.id ? safeUpdatedUser : u)));
      saveUserToFirestore(safeUpdatedUser).catch(() => {});
    } else {
      targetUserId = `usr_old_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const exp = new Date();
      exp.setFullYear(exp.getFullYear() + 3);
      const historicalMember = normalizeUserRecord({
        id: targetUserId,
        name: data.applicantName.trim(),
        email: normEmail || `${membershipCode.toLowerCase().replace(/[^a-z0-9]/g, '')}@archive.kifayatconnect.org`,
        phone: (data.phone || '').trim(),
        role: 'MEMBER',
        isFounder: false,
        profileCompleted: true,
        approvalStatus: 'approved',
        status: 'approved',
        approvedBy: currentUser.name,
        approvedAt: nowIso,
        country: 'Pakistan',
        stateProvince: prov,
        district: dist,
        tehsil: dist,
        cityTown: dist,
        unionCouncil: '',
        tabbarId: resolvedTabbar?.id || data.tabbarId,
        tabbarUrdu: resolvedTabbar?.urduName || data.tabbarUrdu,
        tabbarEnglish: resolvedTabbar?.englishName || data.tabbarEnglish,
        membershipId: membershipCode,
        memberId: membershipCode,
        membershipStatus: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        cnic: formattedCnic,
        address: (data.address || '').trim() || dist,
        joinDate: recordDate,
        validUntil: exp.toISOString().split('T')[0],
        monthlyPledge: 100,
        annualPledge: 1200,
        totalContributed: data.amount > 0 ? data.amount : 0,
        isStaff: false,
        notes: `Digitized from Old Paper Form by ${currentUser.name}`
      });
      setUsers(prev => [historicalMember, ...prev]);
      saveUserToFirestore(historicalMember).catch(() => {});
    }

    const oldApp: MembershipApplication = {
      id: `app_old_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      serialNumber,
      applicantName: data.applicantName.trim(),
      fatherName: data.fatherName?.trim(),
      email: normEmail || matchedUser?.email || '',
      phone: (data.phone || matchedUser?.phone || '').trim(),
      cnic: formattedCnic,
      unit: data.unit?.trim() || dist,
      country: 'Pakistan',
      stateProvince: prov,
      district: dist,
      tehsil: dist,
      cityTown: dist,
      unionCouncil: '',
      address: (data.address || matchedUser?.address || dist).trim(),
      tabbarId: resolvedTabbar?.id || data.tabbarId,
      tabbarUrdu: resolvedTabbar?.urduName || data.tabbarUrdu,
      tabbarEnglish: resolvedTabbar?.englishName || data.tabbarEnglish,
      submittedAt: nowIso,
      status: 'ACTIVE',
      isOldMemberVerification: true,
      isOldPaperRecord: true,
      isRukniyatForm: true,
      oldMembershipNo: membershipCode,
      generatedMembershipId: membershipCode,
      paperFormPhotoUrl: data.paperFormPhotoUrl,
      superAdminRemarks: `Historical by-hand record digitized & approved by ${currentUser.name}`,
      superAdminApprovedAt: nowIso
    };
    setApplications(prev => [oldApp, ...prev]);
    saveApplicationToFirestore(oldApp).catch(() => {});

    if (data.amount > 0) {
      const fundTier: FundTier = data.fundTier || 'MAHANA';
      const oldTx: PaymentTransaction = {
        id: `tx_old_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        receiptNumber: serialNumber,
        serialNumber,
        userId: targetUserId!,
        userName: data.applicantName.trim(),
        userMembershipId: membershipCode,
        payerCnic: formattedCnic,
        unit: data.unit?.trim() || dist,
        userTabbarId: resolvedTabbar?.id || data.tabbarId,
        userTabbarUrdu: resolvedTabbar?.urduName || data.tabbarUrdu,
        userTabbarEnglish: resolvedTabbar?.englishName || data.tabbarEnglish,
        country: 'Pakistan',
        stateProvince: prov,
        district: dist,
        tehsil: dist,
        cityTown: dist,
        unionCouncil: '',
        amount: data.amount,
        fundTier,
        paymentMode: fundTier === 'HANGAMI' ? 'OTHER' : 'DASTOOR',
        fundCategory:
          fundTier === 'SALANA'
            ? 'Annual Welfare Fund'
            : fundTier === 'HANGAMI'
            ? 'Emergency Relief'
            : 'Monthly Contribution',
        paymentMethod: 'Cash',
        referenceNumber: `PAPER-${serialNumber}`,
        date: recordDate,
        status: 'VERIFIED',
        verifiedBy: `${currentUser.name} (By-Hand Archive)`,
        verifiedAt: nowIso,
        proofNote: `Old Paper Receipt #${serialNumber} (Old Member ID: ${membershipCode})`,
        receiptImageUrl: data.paperFormPhotoUrl,
        isOldPaperRecord: true,
        oldReceiptSerialNo: serialNumber,
        oldMembershipNo: membershipCode
      };
      setPayments(prev => [oldTx, ...prev]);
      savePaymentToFirestore(oldTx).catch(() => {});
    }

    logAudit(
      'OLD_PAPER_RECORD_DIGITIZED',
      'MEMBERSHIP',
      serialNumber,
      `${currentUser.name} digitized old by-hand record (${serialNumber}) for ${data.applicantName} (Amount: PKR ${data.amount}).`,
      dist,
      prov
    );

    return { success: true, serialNumber };
  };

  const submitPayment = async (data: {
    amount: number;
    fundCategory: any;
    fundTier?: FundTier;
    yearsCount?: number;
    unit?: string;
    payerCnic?: string;
    paymentMethod: any;
    referenceNumber: string;
    proofNote?: string;
    receiptImageUrl?: string;
    receiptImageName?: string;
    paymentMode?: 'DASTOOR' | 'OTHER';
    monthsCount?: number;
    ratePerMonth?: number;
    startMonth?: number;
    startYear?: number;
    periodLabelEn?: string;
    periodLabelUr?: string;
  }): Promise<{ success: boolean; transaction?: PaymentTransaction; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Authentication required.' };
    }
    const candidateCnic = (data.payerCnic || currentUser.cnic || '').trim();
    if (!isValid13DigitCnic(candidateCnic)) {
      return { success: false, error: getCnicLockAlertMessage(language) };
    }

    const formattedCnic = formatCnicDisplay(candidateCnic);
    if (!isValid13DigitCnic(currentUser.cnic)) {
      const syncedUser = normalizeUserRecord({
        ...currentUser,
        cnic: formattedCnic
      });
      setCurrentUserState(syncedUser);
      persistCurrentUserToStorage(syncedUser);
      setUsers(prev => prev.map(u => (u.id === currentUser.id ? syncedUser : u)));
      saveUserToFirestore(syncedUser, { isOnline: true }).catch(() => {});
    }

    const atomicSerial = await generateAtomicSerialNumber();

    const newTx: PaymentTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      receiptNumber: atomicSerial,
      serialNumber: atomicSerial,
      userId: currentUser.id,
      userName: currentUser.name,
      userMembershipId: currentUser.membershipId || atomicSerial,
      payerCnic: formattedCnic,
      unit: data.unit?.trim() || currentUser.district || 'Central Unit',
      userTabbarId: currentUser.tabbarId,
      userTabbarEnglish: currentUser.tabbarEnglish,
      userTabbarUrdu: currentUser.tabbarUrdu,
      country: currentUser.country,
      stateProvince: currentUser.stateProvince,
      district: currentUser.district,
      tehsil: currentUser.tehsil,
      cityTown: currentUser.cityTown,
      unionCouncil: currentUser.unionCouncil,
      amount: data.amount,
      fundTier: data.fundTier,
      paymentMode: data.paymentMode,
      monthsCount: data.monthsCount,
      yearsCount: data.yearsCount,
      ratePerMonth: data.ratePerMonth,
      startMonth: data.startMonth,
      startYear: data.startYear,
      periodLabelEn: data.periodLabelEn,
      periodLabelUr: data.periodLabelUr,
      fundCategory: data.fundCategory,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      date: new Date().toISOString().split('T')[0],
      status: 'PENDING_VERIFICATION',
      proofNote: data.proofNote,
      receiptImageUrl: data.receiptImageUrl,
      receiptImageName: data.receiptImageName
    };

    setPayments(prev => [newTx, ...prev]);
    savePaymentToFirestore(newTx).catch(() => {});

    logAudit(
      'PAYMENT_SUBMITTED_FOR_VERIFICATION',
      'FINANCIAL',
      newTx.receiptNumber,
      `Member ${currentUser.name} submitted payment of PKR ${data.amount.toLocaleString()} (${data.fundTier || data.fundCategory}) via ${data.paymentMethod}. Serial: ${atomicSerial}.`,
      currentUser.district,
      currentUser.stateProvince
    );

    addNotification({
      type: 'PAYMENT_PENDING',
      title: `New Contribution (${atomicSerial}) Awaiting Approval`,
      message: `${currentUser.name} submitted PKR ${data.amount.toLocaleString()} (${data.paymentMethod}) — Serial ${atomicSerial}.`,
      targetRole: 'SUPER_ADMIN',
      linkTab: 'funds',
      entityId: newTx.id
    });

    return { success: true, transaction: newTx };
  };

  const verifyPayment = async (txId: string, approved: boolean, reason?: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') return;
    const tx = payments.find(p => p.id === txId);
    if (!tx) return;

    // The official serial was minted ONCE, when the Rukniyat Form was submitted.
    // Approval must reuse it unchanged so the form (رکنیت نمبر) and the receipt
    // (رسید نمبر) print the identical number. mintMembershipSerial returns an already
    // issued serial untouched; only a legacy submission with no serial mints one here.
    let issuedSerial: string = tx.serialNumber || tx.receiptNumber || '';
    if (approved && tx.status !== 'VERIFIED') {
      const minted = await mintMembershipSerial(issuedSerial);
      issuedSerial = minted.serial;
    }

    const updatedTx: PaymentTransaction = {
      ...tx,
      serialNumber: issuedSerial || tx.serialNumber,
      receiptNumber: issuedSerial || tx.receiptNumber,
      status: approved ? 'VERIFIED' : 'REJECTED',
      verifiedBy: `${currentUser.name} (${currentUser.role})`,
      verifiedAt: new Date().toISOString(),
      rejectionReason: approved ? undefined : reason
    };

    setPayments(prev => prev.map(p => p.id === txId ? updatedTx : p));
    savePaymentToFirestore(updatedTx).catch(() => {});

    if (approved && tx.status !== 'VERIFIED') {
      setUsers(prev => prev.map(u => {
        if (u.id === tx.userId) {
          const updatedUser = {
            ...u,
            totalContributed: (u.totalContributed || 0) + tx.amount
          };
          saveUserToFirestore(updatedUser).catch(() => {});
          return updatedUser;
        }
        return u;
      }));
    }

    logAudit(
      approved ? 'PAYMENT_RECEIPT_VERIFIED' : 'PAYMENT_RECEIPT_REJECTED',
      'FINANCIAL',
      issuedSerial,
      `${currentUser.name} marked receipt ${issuedSerial} as ${approved ? 'APPROVED' : 'REJECTED'}. Amount: PKR ${tx.amount.toLocaleString()}`,
      tx.district,
      tx.stateProvince
    );

    addNotification({
      type: approved ? 'PAYMENT_VERIFIED' : 'PAYMENT_REJECTED',
      title: approved ? `Approved! Official Raseed Unlocked (${issuedSerial})` : 'Payment Declined',
      message: approved 
        ? '✅ Mubarak ho! Aapki payment / rukniyat approve ho gayi hai. Ab aap apni official Raseed (Receipt) le sakte hain aur download kar sakte hain.'
        : `Your payment of PKR ${tx.amount.toLocaleString()} was declined. Reason: ${reason || 'Verification mismatch'}`,
      targetUserId: tx.userId,
      linkTab: 'funds',
      entityId: tx.id
    });
  };

  const submitComplaint = (data: {
    category: any;
    subject: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }) => {
    if (!currentUser) return;
    const newComplaint: Complaint = {
      id: `cmp_${Date.now()}`,
      ticketNumber: `TKT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      country: currentUser.country,
      stateProvince: currentUser.stateProvince,
      district: currentUser.district,
      tehsil: currentUser.tehsil,
      cityTown: currentUser.cityTown,
      unionCouncil: currentUser.unionCouncil,
      category: data.category,
      subject: data.subject,
      description: data.description,
      status: 'OPEN',
      priority: data.priority,
      createdAt: new Date().toISOString()
    };

    setComplaints(prev => [newComplaint, ...prev]);
    saveComplaintToFirestore(newComplaint).catch(() => {});

    logAudit(
      'GRIEVANCE_TICKET_SUBMITTED',
      'MEMBERSHIP',
      newComplaint.ticketNumber,
      `User ${currentUser.name} filed grievance: "${data.subject}"`,
      currentUser.district,
      currentUser.stateProvince
    );
  };

  const updateComplaintStatus = (complaintId: string, status: ComplaintStatus, responseNote?: string) => {
    if (!currentUser) return;
    const cmp = complaints.find(c => c.id === complaintId);
    if (!cmp) return;

    const updatedCmp: Complaint = {
      ...cmp,
      status,
      responseNote: responseNote || cmp.responseNote,
      assignedOfficerName: currentUser.name,
      resolvedAt: status === 'RESOLVED' ? new Date().toISOString() : cmp.resolvedAt
    };

    setComplaints(prev => prev.map(c => c.id === complaintId ? updatedCmp : c));
    saveComplaintToFirestore(updatedCmp).catch(() => {});

    logAudit(
      'GRIEVANCE_TICKET_UPDATED',
      'MEMBERSHIP',
      cmp.ticketNumber,
      `Status changed to ${status} by ${currentUser.name}. Response: "${responseNote || 'None'}"`,
      cmp.district,
      cmp.stateProvince
    );
  };

  // Dual Announcements (Official App + Community) with Pin, Expiry & Automatic Chat Broadcast
  const publishAnnouncement = (data: {
    title: string;
    content: string;
    announcementType?: AnnouncementType;
    targetScope?: 'ALL' | 'PROVINCE' | 'DISTRICT';
    targetStateProvince?: string;
    targetDistrict?: string;
    targetRegion?: string;
    urgency: 'NORMAL' | 'URGENT';
    isPinned: boolean;
    expiresAt?: string;
  }) => {
    if (!currentUser) return;
    const announcementType: AnnouncementType =
      data.announcementType === 'OFFICIAL_APP' && currentUser.role === 'SUPER_ADMIN'
        ? 'OFFICIAL_APP'
        : 'COMMUNITY';
    const scope = announcementType === 'OFFICIAL_APP' ? 'ALL' : (data.targetScope || 'ALL');

    const newAnnounce: Announcement = {
      id: `ann_${Date.now()}`,
      title: data.title,
      content: data.content,
      announcementType,
      targetScope: scope,
      targetStateProvince: data.targetStateProvince,
      targetDistrict: data.targetDistrict,
      targetRegion: data.targetRegion,
      publishedBy: currentUser.name,
      publisherRole: currentUser.role,
      publishedAt: new Date().toISOString(),
      isPinned: data.isPinned,
      urgency: data.urgency,
      expiresAt: data.expiresAt || undefined
    };

    setAnnouncements(prev => [newAnnounce, ...prev]);
    saveAnnouncementToFirestore(newAnnounce).catch(() => {});

    const channelPrefix = announcementType === 'OFFICIAL_APP' ? '👑 OFFICIAL APP' : '📢 COMMUNITY';

    addNotification({
      type: 'ANNOUNCEMENT_NEW',
      title: `${data.urgency === 'URGENT' ? '[URGENT] ' : ''}${data.title}`,
      message: data.content.length > 120 ? `${data.content.substring(0, 120)}...` : data.content,
      targetRole: 'ALL',
      targetStateProvince: scope === 'PROVINCE' ? data.targetStateProvince : undefined,
      targetDistrict: scope === 'DISTRICT' ? data.targetDistrict : undefined,
      linkTab: 'announcements',
      entityId: newAnnounce.id
    });

    const recipients = users.filter(u => {
      if (u.id === currentUser.id) return false;
      if (scope === 'DISTRICT' && data.targetDistrict) {
        return u.district?.toLowerCase() === data.targetDistrict.toLowerCase();
      }
      if (scope === 'PROVINCE' && data.targetStateProvince) {
        return u.stateProvince?.toLowerCase() === data.targetStateProvince.toLowerCase();
      }
      return true;
    });

    if (recipients.length > 0) {
      const broadcastText = `${channelPrefix}: ${data.title}\n\n${data.content}`;
      const newMessages: ChatMessage[] = [];
      const updatedConvos: ChatConversation[] = [];

      recipients.forEach((recipient, idx) => {
        const sortedIds = [currentUser.id, recipient.id].sort();
        const chatId = `chat_${sortedIds[0]}_${sortedIds[1]}`;
        const nowIso = new Date().toISOString();

        const msg: ChatMessage = {
          id: `msg_ann_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`,
          chatId,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          recipientId: recipient.id,
          recipientName: recipient.name,
          text: broadcastText,
          timestamp: nowIso,
          read: false,
          deliveryStatus: isOnline ? 'DELIVERED' : 'QUEUED'
        };
        newMessages.push(msg);
        if (isOnline) saveChatMessageToFirestore(msg).catch(() => {});

        const existingConvo = chats.find(c => c.id === chatId);
        const convo: ChatConversation = {
          id: chatId,
          participantIds: sortedIds,
          participants: {
            [currentUser.id]: {
              id: currentUser.id,
              name: currentUser.name,
              role: currentUser.role,
              avatarUrl: currentUser.avatarUrl,
              district: currentUser.district,
              stateProvince: currentUser.stateProvince,
              officeTitle: currentUser.assignedOfficeTitle
            },
            [recipient.id]: {
              id: recipient.id,
              name: recipient.name,
              role: recipient.role,
              avatarUrl: recipient.avatarUrl,
              district: recipient.district,
              stateProvince: recipient.stateProvince,
              officeTitle: recipient.assignedOfficeTitle
            }
          },
          lastMessage: `${announcementType === 'OFFICIAL_APP' ? '👑' : '📢'} ${data.title}`,
          lastMessageTime: nowIso,
          lastMessageSenderId: currentUser.id,
          unreadCounts: {
            ...(existingConvo?.unreadCounts || {}),
            [currentUser.id]: 0,
            [recipient.id]: (existingConvo?.unreadCounts?.[recipient.id] || 0) + 1
          }
        };
        updatedConvos.push(convo);
        saveChatConversationToFirestore(convo).catch(() => {});
      });

      setChatMessages(prev => [...prev, ...newMessages]);
      setChats(prev => {
        const updatedIds = new Set(updatedConvos.map(c => c.id));
        return [...updatedConvos, ...prev.filter(c => !updatedIds.has(c.id))];
      });
    }

    logAudit(
      'BROADCAST_ANNOUNCEMENT_PUBLISHED',
      'SETTINGS',
      newAnnounce.title,
      `Published ${announcementType} by ${currentUser.name} (${currentUser.role}). Target: ${scope}. Dispatched to ${recipients.length} member inbox(es).`,
      data.targetDistrict,
      data.targetStateProvince
    );
  };

  const deleteAnnouncement = (announcementId: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') return;
    const target = announcements.find(a => a.id === announcementId);
    setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
    deleteAnnouncementFromFirestore(announcementId).catch(() => {});
    if (target) {
      logAudit(
        'ANNOUNCEMENT_DELETED',
        'SETTINGS',
        target.title,
        `Super Admin ${currentUser.name} removed announcement (${target.announcementType || 'COMMUNITY'}).`
      );
    }
  };

  // Staff & Role Management with Strict 4-Role Quotas + Founder Protection
  const createOrUpdateStaff = (userData: Partial<User> & { id?: string }): { success: boolean; error?: string } => {
    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && !currentUser.permissions?.canManageUsers)) {
      return { success: false, error: 'Insufficient authority to manage staff or roles.' };
    }
    const targetDistrict = userData.district || currentUser.district;
    const targetState = userData.stateProvince || currentUser.stateProvince;
    const requestedRole: UserRole = normalizeLegacyRole(userData.role, userData.email);

    if (requestedRole === 'SUPER_ADMIN' && !isFounderUser(currentUser)) {
      return { success: false, error: 'Only the Founder Super Admin can appoint Additional Super Admins.' };
    }

    if (requestedRole === 'ADMIN') {
      const existingAdminsInDistrict = users.filter(u => 
        u.role === 'ADMIN' && 
        u.district?.toLowerCase() === targetDistrict?.toLowerCase() &&
        u.id !== userData.id &&
        !u.isSuspended
      );
      if (existingAdminsInDistrict.length >= (appSettings.maxAdminsPerDistrict || 10)) {
        return {
          success: false,
          error: `District quota exceeded! Maximum ${appSettings.maxAdminsPerDistrict || 10} District Admins are allowed for ${targetDistrict}.`
        };
      }
    }

    if (requestedRole === 'CO_ADMIN') {
      const existingCoAdminsInState = users.filter(u => 
        u.role === 'CO_ADMIN' && 
        u.stateProvince?.toLowerCase() === targetState?.toLowerCase() &&
        u.id !== userData.id &&
        !u.isSuspended
      );
      if (existingCoAdminsInState.length >= (appSettings.maxCoAdminsPerState || 3)) {
        return {
          success: false,
          error: `State quota exceeded! Maximum ${appSettings.maxCoAdminsPerState || 3} State Co-Admins are allowed for ${targetState}.`
        };
      }
    }

    if (userData.id) {
      const existing = users.find(u => u.id === userData.id);
      if (!existing) return { success: false, error: 'User not found.' };

      // STRICT FOUNDER PROTECTION
      if (isFounderUser(existing) && !isFounderUser(currentUser)) {
        return { success: false, error: 'Founder Protection: No Additional Super Admin can edit, demote, or suspend the Main Super Admin (Founder).' };
      }

      if (existing.role === 'SUPER_ADMIN' && !isFounderUser(currentUser) && existing.id !== currentUser.id) {
        return { success: false, error: 'Only the Founder Super Admin can modify another Super Admin.' };
      }

      const safeRole: UserRole = isFounderUser(existing) ? 'SUPER_ADMIN' : requestedRole;
      const updated: User = {
        ...existing,
        ...userData,
        role: safeRole,
        isFounder: isFounderUser(existing),
        isSuspended: isFounderUser(existing) ? false : Boolean(userData.isSuspended ?? existing.isSuspended),
        isStaff: safeRole !== 'MEMBER'
      };

      setUsers(prev => prev.map(u => u.id === userData.id ? updated : u));
      saveUserToFirestore(updated).catch(() => {});

      logAudit(
        'ROLE_CHANGE_RECORDED',
        'ROLE_MANAGEMENT',
        updated.name,
        `${currentUser.name} updated ${updated.name} role to ${updated.role} in ${updated.district}, ${updated.stateProvince}.`,
        updated.district,
        updated.stateProvince
      );

      return { success: true };
    } else {
      const exp = new Date();
      exp.setFullYear(exp.getFullYear() + 3);

      const newUser: User = {
        id: `usr_${Date.now()}`,
        name: userData.name || 'New Appointee',
        email: (userData.email || '').trim().toLowerCase(),
        phone: userData.phone || '',
        role: requestedRole,
        isFounder: false,
        country: userData.country || 'Pakistan',
        stateProvince: targetState || 'Punjab',
        district: targetDistrict || 'Lahore',
        tehsil: userData.tehsil || targetDistrict || 'Central',
        cityTown: userData.cityTown || targetDistrict || 'Lahore',
        unionCouncil: userData.unionCouncil || '',
        membershipId: requestedRole === 'ADMIN' 
          ? `KC-ADM-${(targetDistrict || 'DIST').substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`
          : requestedRole === 'CO_ADMIN'
          ? `KC-COA-${(targetState || 'STATE').substring(0, 2).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`
          : requestedRole === 'SUPER_ADMIN'
          ? `KC-SA-${Math.floor(100 + Math.random() * 900)}`
          : `KC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        membershipStatus: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        cnic: userData.cnic || '',
        address: userData.address || `${targetDistrict}, ${targetState}`,
        joinDate: new Date().toISOString().split('T')[0],
        validUntil: exp.toISOString().split('T')[0],
        monthlyPledge: 0,
        annualPledge: 0,
        totalContributed: 0,
        isStaff: requestedRole !== 'MEMBER',
        notes: `Appointed by ${currentUser.name}.`
      };

      setUsers(prev => [newUser, ...prev]);
      saveUserToFirestore(newUser).catch(() => {});

      logAudit(
        'STAFF_APPOINTMENT_CREATED',
        'ROLE_MANAGEMENT',
        newUser.name,
        `Appointed as ${newUser.role} for ${newUser.district}, ${newUser.stateProvince}.`,
        newUser.district,
        newUser.stateProvince
      );

      return { success: true };
    }
  };

  // Direct Role Assignment exclusively by Main Super Admin (Founder)
  const assignMemberRole = (
    userId: string,
    options: { role: UserRole; isAuditOfficer?: boolean }
  ): { success: boolean; error?: string } => {
    if (!currentUser || !isFounderUser(currentUser)) {
      return {
        success: false,
        error: 'Founder Protection: Only the Main Super Admin (Founder) can directly assign member roles.'
      };
    }
    const target = users.find(u => u.id === userId);
    if (!target) return { success: false, error: 'Member not found.' };
    if (isFounderUser(target)) {
      return {
        success: false,
        error: 'Founder Protection: The Main Super Admin (Founder) retains supreme authority and cannot be reassigned.'
      };
    }

    const nextRole = normalizeLegacyRole(options.role, target.email);
    const nextAudit = options.isAuditOfficer !== undefined ? Boolean(options.isAuditOfficer) : false;

    const updated: User = normalizeUserRecord({
      ...target,
      role: nextRole,
      isStaff: nextRole !== 'MEMBER',
      isAuditOfficer: nextAudit,
      isFounder: false,
      isSuspended: false,
      membershipStatus: 'ACTIVE'
    });

    setUsers(prev => prev.map(u => (u.id === userId ? updated : u)));
    ensureFirebaseAuthSession().then(() => saveUserToFirestore(updated)).catch(() => {});

    const roleDisplay = nextAudit && nextRole === 'MEMBER'
      ? 'Audit Officer'
      : nextAudit
      ? `${nextRole} + Audit Officer`
      : nextRole === 'SUPER_ADMIN'
      ? 'Super Admin'
      : nextRole === 'ADMIN'
      ? 'Admin'
      : nextRole === 'CO_ADMIN'
      ? 'Co-Admin'
      : 'Member';

    logAudit(
      'MEMBER_ROLE_ASSIGNED_DIRECTLY',
      'ROLE_MANAGEMENT',
      target.name,
      `Founder ${currentUser.name} directly assigned role "${roleDisplay}" to ${target.name} (${target.email}).`,
      target.district,
      target.stateProvince
    );

    addNotification({
      type: 'STAFF_ROLE_CHANGE',
      title: `Role Updated: ${roleDisplay} 👑`,
      message: `${currentUser.name} assigned your account role to ${roleDisplay}.`,
      targetUserId: target.id,
      linkTab: 'dashboard'
    });

    return { success: true };
  };

  const promoteToSuperAdmin = (userId: string): { success: boolean; error?: string } => {
    if (!currentUser || !isFounderUser(currentUser)) {
      return { success: false, error: 'Founder Protection: Only the Main Super Admin (Founder) can promote Additional Super Admins.' };
    }
    const target = users.find(u => u.id === userId);
    if (!target) return { success: false, error: 'Member not found.' };
    if (isFounderUser(target)) return { success: false, error: 'Founder already holds supreme authority.' };

    const updated: User = {
      ...target,
      role: 'SUPER_ADMIN',
      isStaff: true,
      isFounder: false,
      isSuspended: false
    };
    setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    saveUserToFirestore(updated).catch(() => {});

    logAudit(
      'ADDITIONAL_SUPER_ADMIN_PROMOTED',
      'ROLE_MANAGEMENT',
      target.name,
      `Founder ${currentUser.name} promoted ${target.name} (${target.email}) to Additional Super Admin.`
    );
    addNotification({
      type: 'STAFF_ROLE_CHANGE',
      title: 'Promoted to Additional Super Admin 👑',
      message: `${currentUser.name} has promoted you to Additional Super Admin.`,
      targetUserId: target.id,
      linkTab: 'dashboard'
    });
    return { success: true };
  };

  const demoteSuperAdmin = (userId: string): { success: boolean; error?: string } => {
    if (!currentUser || !isFounderUser(currentUser)) {
      return { success: false, error: 'Founder Protection: Only the Main Super Admin (Founder) can demote Additional Super Admins.' };
    }
    const target = users.find(u => u.id === userId);
    if (!target) return { success: false, error: 'User not found.' };
    if (isFounderUser(target)) {
      return { success: false, error: 'Founder Protection: The Main Super Admin (Founder) cannot be demoted or removed.' };
    }

    const updated: User = {
      ...target,
      role: 'ADMIN',
      isStaff: true,
      isFounder: false
    };
    setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    saveUserToFirestore(updated).catch(() => {});

    logAudit(
      'ADDITIONAL_SUPER_ADMIN_DEMOTED',
      'ROLE_MANAGEMENT',
      target.name,
      `Founder ${currentUser.name} demoted Additional Super Admin ${target.name} to Admin.`
    );
    return { success: true };
  };

  // Audit Officer Assignment (Strictly Founder ONLY)
  const assignAuditOfficer = (userId: string, assigned: boolean): { success: boolean; error?: string } => {
    if (!currentUser || !isFounderUser(currentUser)) {
      return { success: false, error: 'Founder Protection: Only the Main Super Admin (Founder) can assign or revoke Audit Officer credentials.' };
    }
    const target = users.find(u => u.id === userId);
    if (!target) return { success: false, error: 'User not found.' };
    if (isFounderUser(target) && !assigned) {
      return { success: false, error: 'Founder retains ultimate oversight.' };
    }

    const updated: User = normalizeUserRecord({
      ...target,
      isAuditOfficer: assigned
    });
    setUsers(prev => prev.map(u => (u.id === userId ? updated : u)));
    saveUserToFirestore(updated).catch(() => {});

    logAudit(
      assigned ? 'AUDIT_OFFICER_ASSIGNED' : 'AUDIT_OFFICER_REVOKED',
      'ROLE_MANAGEMENT',
      target.name,
      `Founder ${currentUser.name} ${assigned ? 'assigned' : 'revoked'} Audit Officer verification access for ${target.name} (${target.email}).`,
      target.district,
      target.stateProvince
    );

    addNotification({
      type: 'STAFF_ROLE_CHANGE',
      title: assigned ? 'Audit Officer Appointed 🛡️' : 'Audit Officer Access Updated',
      message: assigned
        ? `${currentUser.name} has designated you as an Audit Officer with financial ledger, reports & audit trail verification access.`
        : `Your Audit Officer verification badge has been revoked by the Founder.`,
      targetUserId: target.id,
      linkTab: 'audit'
    });

    return { success: true };
  };

  const toggleUserSuspension = (userId: string, suspended: boolean): { success: boolean; error?: string } => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Only Super Admin can change account suspension status.' };
    }
    const target = users.find(u => u.id === userId);
    if (!target) return { success: false, error: 'User not found.' };
    if (isFounderUser(target)) {
      return { success: false, error: 'Founder Protection: The Main Super Admin (Founder) cannot be suspended or removed.' };
    }
    if (target.role === 'SUPER_ADMIN' && !isFounderUser(currentUser)) {
      return { success: false, error: 'Only the Founder can suspend or reinstate Additional Super Admins.' };
    }

    const updated: User = {
      ...target,
      isSuspended: suspended,
      membershipStatus: suspended ? 'SUSPENDED' : 'ACTIVE'
    };
    setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    saveUserToFirestore(updated).catch(() => {});

    logAudit(
      suspended ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_ACTIVATED',
      'SECURITY',
      target.name,
      `${currentUser.name} ${suspended ? 'suspended' : 'reactivated'} ${target.name} (${target.role}).`
    );
    return { success: true };
  };

  const updateUserPermissions = (userId: string, permissions: Partial<RolePermissions>): { success: boolean; error?: string } => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Only Super Admin can edit custom permissions.' };
    }
    const target = users.find(u => u.id === userId);
    if (!target) return { success: false, error: 'User not found.' };
    if (isFounderUser(target) && !isFounderUser(currentUser)) {
      return { success: false, error: 'Founder Protection: Cannot modify Founder permissions.' };
    }
    if (target.role === 'SUPER_ADMIN' && !isFounderUser(currentUser)) {
      return { success: false, error: 'Only Founder can adjust Additional Super Admin permissions.' };
    }

    const baseRole = target.role === 'SUPER_ADMIN'
      ? INITIAL_APP_SETTINGS.roleDefaults!.ADMIN
      : (appSettings.roleDefaults?.[target.role] || INITIAL_APP_SETTINGS.roleDefaults!.MEMBER);

    const updated: User = {
      ...target,
      permissions: {
        ...baseRole,
        ...(target.permissions || {}),
        ...permissions
      }
    };
    setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    saveUserToFirestore(updated).catch(() => {});

    logAudit(
      'USER_PERMISSIONS_UPDATED',
      'ROLE_MANAGEMENT',
      target.name,
      `${currentUser.name} updated granular permissions for ${target.name}.`
    );
    return { success: true };
  };

  const broadcastAdminAlert = (title: string, message: string, target: 'ALL' | 'STAFF') => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') return;
    if (target === 'ALL') {
      addNotification({
        type: 'ANNOUNCEMENT_NEW',
        title,
        message,
        targetRole: 'ALL',
        linkTab: 'announcements'
      });
    } else {
      (['SUPER_ADMIN', 'ADMIN', 'CO_ADMIN'] as UserRole[]).forEach(r => {
        addNotification({
          type: 'ANNOUNCEMENT_NEW',
          title,
          message,
          targetRole: r,
          linkTab: 'dashboard'
        });
      });
    }
    logAudit('MASTER_NOTIFICATION_BROADCAST', 'SETTINGS', title, `Dispatched live notification alert to ${target}.`);
  };

  // Instant One-Tap Member Approval (0ms Optimistic Update + Background Firestore Sync)
  const approveMemberAccount = useCallback((
    userId: string,
    approved: boolean,
    reason?: string
  ): { success: boolean; message: string; error?: string } => {
    if (!currentUser) {
      return { success: false, message: 'Authentication required.', error: 'Authentication required.' };
    }
    const hasAuthority =
      currentUser.role === 'SUPER_ADMIN' ||
      currentUser.role === 'ADMIN' ||
      Boolean(currentUser.permissions?.canApproveMembers);

    if (!hasAuthority) {
      return {
        success: false,
        message: 'Insufficient authority to approve or reject member accounts.',
        error: 'Insufficient authority to approve or reject member accounts.'
      };
    }

    const target = users.find(u => u.id === userId);
    if (!target) {
      return { success: false, message: 'Member account not found.', error: 'Member account not found.' };
    }
    if (!approved && isFounderUser(target)) {
      return {
        success: false,
        message: 'Founder Protection: Main Super Admin (Founder) cannot be rejected.',
        error: 'Founder Protection: Main Super Admin (Founder) cannot be rejected.'
      };
    }

    const nowIso = new Date().toISOString();
    const updatedUser: User = normalizeUserRecord({
      ...target,
      status: approved ? 'approved' : 'rejected',
      approvalStatus: approved ? 'approved' : 'rejected',
      approvedBy: approved ? currentUser.name : target.approvedBy,
      approvedAt: approved ? nowIso : target.approvedAt,
      rejectedBy: approved ? undefined : currentUser.name,
      rejectedAt: approved ? undefined : nowIso,
      rejectionReason: approved ? undefined : (reason || 'Rejected by administration.'),
      membershipStatus: approved ? 'ACTIVE' : 'REJECTED',
      verificationStatus: approved ? 'VERIFIED' : 'UNVERIFIED'
    });

    // 0ms Optimistic State Flip
    setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));

    // Also sync matching membership application optimistically
    setApplications(prev =>
      prev.map(app => {
        if (app.email.toLowerCase() === target.email.toLowerCase()) {
          const updatedApp: MembershipApplication = {
            ...app,
            status: approved ? 'ACTIVE' : 'REJECTED',
            superAdminRemarks: approved
              ? `Instant approval granted by ${currentUser.name}`
              : (reason || `Rejected by ${currentUser.name}`),
            superAdminApprovedAt: approved ? nowIso : app.superAdminApprovedAt,
            generatedMembershipId: approved ? (target.membershipId || app.generatedMembershipId) : app.generatedMembershipId
          };
          saveApplicationToFirestore(updatedApp).catch(() => {});
          return updatedApp;
        }
        return app;
      })
    );

    // Mark related approval_request notifications as read locally + Firestore
    setNotifications(prev =>
      prev.map(n => {
        if (
          n.type === 'approval_request' &&
          !n.read &&
          (n.memberUid === userId || n.entityId === userId || n.memberEmail?.toLowerCase() === target.email.toLowerCase())
        ) {
          const readNotif = { ...n, read: true };
          saveNotificationToFirestore(readNotif).catch(() => {});
          return readNotif;
        }
        return n;
      })
    );

    // Background Firestore write (non-blocking)
    approveOrRejectUserInFirestore(updatedUser, {
      approved,
      actorName: currentUser.name,
      reason
    }).catch(() => {});

    logAudit(
      approved ? 'MEMBER_ACCOUNT_INSTANT_APPROVED' : 'MEMBER_ACCOUNT_REJECTED',
      'MEMBERSHIP',
      target.name,
      `${currentUser.name} ${approved ? 'approved' : 'rejected'} member ${target.name} (${target.email}).`,
      target.district,
      target.stateProvince
    );

    addNotification({
      type: approved ? 'MEMBERSHIP_APPROVED' : 'MEMBERSHIP_REJECTED',
      title: approved ? 'Membership Approved ✅' : 'Membership Application Declined',
      message: approved
        ? `Congratulations ${target.name}! Your Kifayat Connect profile has been approved by ${currentUser.name}.`
        : `Your profile review was declined by ${currentUser.name}. ${reason ? `Reason: ${reason}` : ''}`.trim(),
      targetUserId: target.id,
      linkTab: 'dashboard',
      entityId: target.id
    });

    return {
      success: true,
      message: approved
        ? `${target.name} approved instantly ✅`
        : `${target.name} marked as rejected`
    };
  }, [currentUser, users]);

  const deleteUserPermanently = async (
    userId: string
  ): Promise<{ success: boolean; message: string; error?: string }> => {
    if (!currentUser || !isFounderUser(currentUser)) {
      const msg = 'Zero-Deletion Lock: Only the Main Super Admin (Founder) can permanently delete a member record.';
      return { success: false, message: msg, error: msg };
    }
    const target = users.find(u => u.id === userId);
    if (!target) {
      return { success: false, message: 'Member record not found.', error: 'Member record not found.' };
    }
    if (isFounderUser(target) || target.id === 'usr_super_admin') {
      const msg = 'Founder Protection: Main Super Admin (Founder) account cannot be deleted.';
      return { success: false, message: msg, error: msg };
    }

    const res = await deleteUserPermanentlyFromFirestore(currentUser, target);
    if (!res.success) {
      return {
        success: false,
        message: res.error || 'Failed to delete member record from Cloud Firestore.',
        error: res.error
      };
    }

    setUsers(prev => prev.filter(u => u.id !== target.id && u.email.toLowerCase() !== target.email.toLowerCase()));
    if (inspectedUserProfile?.id === target.id) {
      setInspectedUserProfile(null);
    }
    logAudit(
      'USER_RECORD_PERMANENTLY_DELETED',
      'SECURITY',
      target.name,
      `Founder (${currentUser.email}) permanently deleted user record for ${target.name} (${target.email}).`,
      target.district,
      target.stateProvince
    );
    return {
      success: true,
      message: `${target.name} (${target.email}) permanently deleted from Cloud & Directory.`
    };
  };

  const updateUserProfile = (profileData: Partial<User>) => {
    if (!currentUser) return;
    const nowIso = new Date().toISOString();
    const hasDetailsCompleted = Boolean(
      profileData.profileCompleted ||
      currentUser.profileCompleted ||
      ((profileData.cnic ?? currentUser.cnic)?.trim() && (profileData.address ?? currentUser.address)?.trim())
    );
    const nextProfileCompleted = isFounderUser(currentUser) ? true : hasDetailsCompleted;
    const isTransitioningToCompleted =
      !isFounderUser(currentUser) &&
      nextProfileCompleted &&
      (!currentUser.profileCompleted || !currentUser.approvalRequestSentAt) &&
      resolveUserApprovalStatus(currentUser) !== 'approved';

    const updated: User = normalizeUserRecord({
      ...currentUser,
      ...profileData,
      role: currentUser.role,
      isFounder: isFounderUser(currentUser),
      profileCompleted: nextProfileCompleted,
      approvalStatus: isTransitioningToCompleted ? 'pending' : currentUser.approvalStatus,
      status: isTransitioningToCompleted ? 'pending' : currentUser.status,
      verificationStatus: isTransitioningToCompleted ? 'PENDING' : currentUser.verificationStatus,
      membershipStatus: isTransitioningToCompleted ? 'PENDING_DISTRICT_REVIEW' : currentUser.membershipStatus,
      approvalRequestSentAt: isTransitioningToCompleted ? nowIso : currentUser.approvalRequestSentAt,
      lastLoginAt: nowIso
    });
    setCurrentUserState(updated);
    persistCurrentUserToStorage(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
    ensureFirebaseAuthSession().then(() => saveUserToFirestore(updated)).catch(() => {});

    if (isTransitioningToCompleted) {
      const approvalNotifId = `notif_approval_${updated.id}_${Date.now()}`;
      const approvalNotif: AppNotification = {
        id: approvalNotifId,
        type: 'approval_request',
        targetRole: 'Super Admin',
        title: `Approval Request: ${updated.name}`,
        message: `${updated.name} (${updated.district || 'Pakistan'}) — New profile awaiting approval`,
        memberId: updated.membershipId || updated.id,
        memberUid: updated.id,
        memberName: updated.name,
        memberEmail: updated.email,
        district: updated.district || updated.stateProvince || 'Pakistan',
        read: false,
        timestamp: nowIso,
        linkTab: 'members',
        entityId: updated.id
      };
      setNotifications(prev => [approvalNotif, ...prev]);
      sendApprovalRequestNotificationToFirestore(updated, approvalNotifId).catch(() => {});
    }
  };

  // Office-Bearers Operations
  const appointOfficeBearer = (seatId: string, userId: string, notes?: string): { success: boolean; error?: string } => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Only Super Admin can appoint organizational office-bearers.' };
    }
    const targetSeat = officeBearers.find(ob => ob.seatId === seatId);
    const candidate = users.find(u => u.id === userId);
    if (!targetSeat || !candidate) {
      return { success: false, error: 'Selected seat or candidate not found.' };
    }

    if (targetSeat.status === 'ACTIVE' && targetSeat.assignedUserId) {
      const hist: OfficeBearerHistory = {
        id: `obh_${Date.now()}`,
        officeBearerId: targetSeat.id,
        title: targetSeat.title,
        seatLabel: targetSeat.seatLabel,
        userId: targetSeat.assignedUserId,
        userName: targetSeat.assignedUserName || 'Previous Incumbent',
        startDate: targetSeat.appointedDate || new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        termYears: targetSeat.termYears,
        terminatedBy: currentUser.name,
        reason: 'Superseded by new appointment.'
      };
      setOfficeBearerHistory(prev => [hist, ...prev]);
      saveOfficeBearerHistoryToFirestore(hist).catch(() => {});
    }

    const updatedSeat: OfficeBearer = {
      ...targetSeat,
      assignedUserId: candidate.id,
      assignedUserName: candidate.name,
      assignedUserPhone: candidate.phone,
      assignedUserEmail: candidate.email,
      assignedUserCnic: candidate.cnic,
      assignedUserLocation: `${candidate.district}, ${candidate.stateProvince}`,
      appointedDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      appointedBy: currentUser.name,
      notes: notes || `Appointed under bylaws minute.`
    };

    setOfficeBearers(prev => prev.map(ob => ob.seatId === seatId ? updatedSeat : ob));
    saveOfficeBearerToFirestore(updatedSeat).catch(() => {});
    setUsers(prev => prev.map(u => u.id === candidate.id ? { ...u, assignedOfficeTitle: targetSeat.title } : u));

    logAudit(
      'OFFICE_BEARER_APPOINTED',
      'OFFICE_BEARER',
      `${targetSeat.seatLabel} -> ${candidate.name}`,
      `Appointed ${candidate.name} to ${targetSeat.seatLabel} (${targetSeat.jurisdiction}). Notes: "${notes || 'None'}"`,
      targetSeat.district,
      targetSeat.stateProvince
    );

    addNotification({
      type: 'OFFICE_BEARER_APPOINTMENT',
      title: 'Office-Bearer Appointment',
      message: `${candidate.name} has been appointed to ${targetSeat.seatLabel}.`,
      targetRole: 'ALL'
    });

    return { success: true };
  };

  const vacateOfficeBearer = (seatId: string, reason: string): { success: boolean; error?: string } => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Only Super Admin can vacate seats.' };
    }
    const targetSeat = officeBearers.find(ob => ob.seatId === seatId);
    if (!targetSeat) return { success: false, error: 'Seat not found.' };

    if (targetSeat.assignedUserId) {
      const hist: OfficeBearerHistory = {
        id: `obh_${Date.now()}`,
        officeBearerId: targetSeat.id,
        title: targetSeat.title,
        seatLabel: targetSeat.seatLabel,
        userId: targetSeat.assignedUserId,
        userName: targetSeat.assignedUserName || 'Incumbent',
        startDate: targetSeat.appointedDate || new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        termYears: targetSeat.termYears,
        terminatedBy: currentUser.name,
        reason
      };
      setOfficeBearerHistory(prev => [hist, ...prev]);
      saveOfficeBearerHistoryToFirestore(hist).catch(() => {});
    }

    const updatedSeat: OfficeBearer = {
      ...targetSeat,
      assignedUserId: undefined,
      assignedUserName: undefined,
      assignedUserPhone: undefined,
      assignedUserEmail: undefined,
      status: 'VACANT',
      notes: `Declared vacant on ${new Date().toLocaleDateString()}. Reason: ${reason}`
    };

    setOfficeBearers(prev => prev.map(ob => ob.seatId === seatId ? updatedSeat : ob));
    saveOfficeBearerToFirestore(updatedSeat).catch(() => {});

    logAudit(
      'OFFICE_BEARER_SEAT_VACATED',
      'OFFICE_BEARER',
      targetSeat.seatLabel,
      `Seat declared vacant by Super Admin. Reason: "${reason}"`
    );

    return { success: true };
  };

  // Chat Operations with Offline Message Queue (🕒 Queued -> ✓ Delivered -> ✓✓ Seen)
  const sendChatMessage = (
    recipientId: string, 
    text: string, 
    attachment?: { url: string; name: string; type: 'IMAGE' | 'DOCUMENT' }
  ): { success: boolean; error?: string; queued?: boolean } => {
    if (!currentUser) return { success: false, error: 'Authentication required.' };
    const recipient = users.find(u => u.id === recipientId);
    if (!recipient || (!text.trim() && !attachment)) {
      return { success: false, error: 'Recipient or message cannot be empty.' };
    }

    const cleanText = text.trim() || (attachment ? `📎 ${attachment.name}` : '');
    const sortedIds = [currentUser.id, recipientId].sort();
    const chatId = `chat_${sortedIds[0]}_${sortedIds[1]}`;
    const deliveryStatus = isOnline ? 'DELIVERED' : 'QUEUED';

    const nowIso = new Date().toISOString();
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      chatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      recipientId,
      recipientName: recipient.name,
      participants: sortedIds,
      text: cleanText,
      timestamp: nowIso,
      createdAt: nowIso,
      read: false,
      deliveryStatus,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
      attachmentType: attachment?.type
    };

    localRecentSentMsgsRef.current.set(newMsg.id, Date.now());
    setChatMessages(prev => [...prev, newMsg]);
    if (isOnline) {
      saveChatMessageToFirestore(newMsg).catch(() => {});
    } else {
      setOfflineChatQueue(prev => [...prev, newMsg]);
    }

    setChats(prev => {
      const existing = prev.find(c => c.id === chatId);
      const unread = (existing?.unreadCounts[recipientId] || 0) + 1;

      const conversation: ChatConversation = {
        id: chatId,
        participantIds: sortedIds,
        participants: {
          [currentUser.id]: {
            id: currentUser.id,
            name: currentUser.name,
            role: currentUser.role,
            avatarUrl: currentUser.avatarUrl,
            district: currentUser.district,
            stateProvince: currentUser.stateProvince,
            officeTitle: currentUser.assignedOfficeTitle
          },
          [recipientId]: {
            id: recipient.id,
            name: recipient.name,
            role: recipient.role,
            avatarUrl: recipient.avatarUrl,
            district: recipient.district,
            stateProvince: recipient.stateProvince,
            officeTitle: recipient.assignedOfficeTitle
          }
        },
        lastMessage: cleanText,
        lastMessageTime: new Date().toISOString(),
        lastMessageSenderId: currentUser.id,
        unreadCounts: {
          ...(existing?.unreadCounts || {}),
          [currentUser.id]: 0,
          [recipientId]: unread
        }
      };

      if (isOnline) saveChatConversationToFirestore(conversation).catch(() => {});
      return [conversation, ...prev.filter(c => c.id !== chatId)];
    });

    if (isOnline) {
      addNotification({
        type: 'CHAT_MESSAGE',
        title: `Message from ${currentUser.name}`,
        message: cleanText.length > 60 ? `${cleanText.substring(0, 60)}...` : cleanText,
        targetUserId: recipientId,
        linkTab: 'chat',
        entityId: chatId
      });
    }

    return { success: true, queued: !isOnline };
  };

  const markConversationAsSeen = useCallback((chatId: string) => {
    if (!currentUser) return;

    setChatMessages(prev => {
      let changed = false;
      const next = prev.map(m => {
        if (m.chatId === chatId && m.recipientId === currentUser.id && (!m.read || m.deliveryStatus !== 'SEEN')) {
          changed = true;
          const seenMsg: ChatMessage = { ...m, read: true, deliveryStatus: 'SEEN' };
          if (isOnline) saveChatMessageToFirestore(seenMsg).catch(() => {});
          return seenMsg;
        }
        return m;
      });
      return changed ? next : prev;
    });

    setChats(prev =>
      prev.map(c => {
        if (c.id === chatId && (c.unreadCounts?.[currentUser.id] || 0) > 0) {
          const updatedConvo: ChatConversation = {
            ...c,
            unreadCounts: {
              ...c.unreadCounts,
              [currentUser.id]: 0
            }
          };
          if (isOnline) saveChatConversationToFirestore(updatedConvo).catch(() => {});
          return updatedConvo;
        }
        return c;
      })
    );
  }, [currentUser, isOnline]);

  // ----------------------------------------------------
  // Ultra-Luxury Live Community Chat Room Actions
  // ----------------------------------------------------
  const sendCommunityMessage = (payload: {
    text?: string;
    replyTo?: ChatReplySnapshot;
    attachment?: { url: string; name: string; type: 'IMAGE' | 'DOCUMENT' };
    voiceNote?: ChatVoiceNote;
    islamicGifId?: string;
  }): { success: boolean; error?: string } => {
    if (!currentUser) return { success: false, error: 'Authentication required.' };
    const isFounder = isFounderUser(currentUser);
    const isModerator = isChatModerator(currentUser);
    const canUploadGallery = isFounder || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
    const memberControl = appSettings.chatMemberControls?.[currentUser.id];
    const isVoicePayload = Boolean(payload.voiceNote);

    if (!isFounder) {
      if (currentUser.isMutedInChat) {
        return { success: false, error: 'You are currently muted in Community Chat by an administrator.' };
      }
      if (!isModerator && appSettings.chatLockFullRoom) {
        return { success: false, error: 'Full Community Room is currently locked by leadership.' };
      }
      if (!isModerator && appSettings.chatLockMessages && !isVoicePayload) {
        return { success: false, error: 'Text messages are currently locked by leadership.' };
      }
      if (!isModerator && appSettings.chatLockVoiceNotes && isVoicePayload) {
        return { success: false, error: 'Voice notes are currently locked by leadership.' };
      }
      if (memberControl?.lockMessages && !isVoicePayload) {
        return { success: false, error: 'Your text messages in this room have been locked by leadership.' };
      }
      if (memberControl?.lockVoice && isVoicePayload) {
        return { success: false, error: 'Your voice notes in this room have been locked by leadership.' };
      }
    }

    if (payload.attachment && !canUploadGallery) {
      return { success: false, error: 'Gallery photo & GIF uploads are restricted to Super Admins and Admins.' };
    }

    const cleanText = (payload.text || '').trim() ||
      (payload.voiceNote ? `🎤 Voice Note (${payload.voiceNote.durationSec}s)` : '') ||
      (payload.islamicGifId ? '☪️ Islamic Greeting' : '') ||
      (payload.attachment ? `🖼️ ${payload.attachment.name}` : '');

    if (!cleanText) return { success: false, error: 'Cannot send an empty message.' };

    const nowIso = new Date().toISOString();
    const senderTabbar = resolveUserTabbar(currentUser);
    const msg: ChatMessage = {
      id: `cmsg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      chatId: 'community_global_room',
      roomType: 'COMMUNITY',
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderIsFounder: isFounder,
      senderIsAuditOfficer: Boolean(currentUser.isAuditOfficer),
      senderBubbleColor: isFounder ? (appSettings.founderBubbleColor || 'ROYAL_GOLD') : undefined,
      senderTabbarId: senderTabbar?.id ?? currentUser.tabbarId,
      senderTabbarUrdu: senderTabbar?.urduName ?? currentUser.tabbarUrdu,
      senderTabbarEnglish: senderTabbar?.englishName ?? currentUser.tabbarEnglish,
      recipientId: 'ALL',
      recipientName: 'Kifayat Community Room',
      text: cleanText,
      timestamp: nowIso,
      createdAt: nowIso,
      read: true,
      deliveryStatus: isOnline ? 'DELIVERED' : 'QUEUED',
      attachmentUrl: payload.attachment?.url,
      attachmentName: payload.attachment?.name,
      attachmentType: payload.attachment?.type,
      voiceNote: payload.voiceNote,
      islamicGifId: payload.islamicGifId,
      replyTo: payload.replyTo,
      reactions: {},
      isHighlighted: isFounder,
      highlightedBy: isFounder ? currentUser.name : undefined
    };

    localRecentSentMsgsRef.current.set(msg.id, Date.now());
    setCommunityMessages(prev => [...prev, msg]);
    saveCommunityMessageToFirestore(msg).catch(() => {});
    return { success: true };
  };

  const toggleCommunityReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;
    let updatedMsg: ChatMessage | null = null;
    setCommunityMessages(prev =>
      prev.map(m => {
        if (m.id !== messageId) return m;
        const currentReactions = { ...(m.reactions || {}) };
        const usersForEmoji = new Set(currentReactions[emoji] || []);
        if (usersForEmoji.has(currentUser.id)) {
          usersForEmoji.delete(currentUser.id);
        } else {
          usersForEmoji.add(currentUser.id);
        }
        currentReactions[emoji] = Array.from(usersForEmoji);
        updatedMsg = { ...m, reactions: currentReactions };
        return updatedMsg;
      })
    );
    if (updatedMsg) {
      saveCommunityMessageToFirestore(updatedMsg).catch(() => {});
    }
  };

  const toggleHighlightCommunityMessage = (messageId: string): { success: boolean; error?: string } => {
    if (!currentUser || !isFounderUser(currentUser)) {
      return { success: false, error: 'Only the Founder can highlight messages.' };
    }
    let updatedMsg: ChatMessage | null = null;
    setCommunityMessages(prev =>
      prev.map(m => {
        if (m.id !== messageId) return m;
        const nextVal = !m.isHighlighted;
        updatedMsg = { ...m, isHighlighted: nextVal, highlightedBy: nextVal ? currentUser.name : undefined };
        return updatedMsg;
      })
    );
    if (updatedMsg) saveCommunityMessageToFirestore(updatedMsg).catch(() => {});
    return { success: true };
  };

  const togglePinCommunityMessage = (messageId: string): { success: boolean; error?: string } => {
    if (!currentUser || !isFounderUser(currentUser)) {
      return { success: false, error: 'Only the Founder can pin messages to top.' };
    }
    const now = Date.now();
    if (now - pinActionDebounceRef.current < 500) {
      return { success: false };
    }
    pinActionDebounceRef.current = now;

    const target = communityMessages.find(m => m.id === messageId);
    if (!target) return { success: false, error: 'Message not found.' };
    const nextPinned = !target.isPinned;

    const changed: ChatMessage[] = [];
    const nextMessages = communityMessages.map(m => {
      if (m.id === messageId) {
        const u: ChatMessage = { ...m, isPinned: nextPinned, pinnedBy: nextPinned ? currentUser.name : undefined };
        changed.push(u);
        return u;
      }
      if (nextPinned && m.isPinned) {
        const u: ChatMessage = { ...m, isPinned: false, pinnedBy: undefined };
        changed.push(u);
        return u;
      }
      return m;
    });

    setCommunityMessages(nextMessages);
    changed.forEach(u => saveCommunityMessageToFirestore(u).catch(() => {}));
    return { success: true };
  };

  const deleteCommunityMessageForMe = (messageId: string): { success: boolean; error?: string } => {
    if (!currentUser) return { success: false, error: 'Authentication required.' };
    const key = `${STORAGE_KEYS.HIDDEN_COMMUNITY_MSG_IDS_PREFIX}${currentUser.id}`;
    hiddenCommunityIdsRef.current = addIdsToStorageSet(key, [messageId]);
    setCommunityMessages(prev => prev.filter(m => m.id !== messageId));
    hideCommunityMessageForUserInFirestore(messageId, currentUser.id).catch(() => {});
    return { success: true };
  };

  const deleteCommunityMessageForEveryone = (messageId: string): { success: boolean; error?: string } => {
    if (!currentUser) return { success: false, error: 'Authentication required.' };
    const target = communityMessages.find(m => m.id === messageId);
    if (!target) return { success: false, error: 'Message not found.' };

    const targetAuthor = users.find(u => u.id === target.senderId);
    const isTargetFounder = Boolean(target.senderIsFounder || isFounderUser(targetAuthor));

    // STRICT FOUNDER PROTECTION: 100% blocked on Founder messages for non-Founder users
    if (isTargetFounder && !isFounderUser(currentUser)) {
      return { success: false, error: 'Founder Protection: No administrator or moderator can delete Founder messages.' };
    }

    const canModerate =
      isFounderUser(currentUser) ||
      currentUser.role === 'SUPER_ADMIN' ||
      currentUser.role === 'ADMIN' ||
      currentUser.role === 'CO_ADMIN' ||
      target.senderId === currentUser.id;

    if (!canModerate) {
      return { success: false, error: 'Insufficient permission to delete this message.' };
    }

    deletedCommunityIdsRef.current = addIdsToStorageSet(STORAGE_KEYS.DELETED_COMMUNITY_MSG_IDS, [messageId]);
    setCommunityMessages(prev => prev.filter(m => m.id !== messageId));
    deleteCommunityMessageFromFirestore(messageId).catch(() => {});
    return { success: true };
  };

  const deleteCommunityMessage = deleteCommunityMessageForEveryone;

  const clearOldCommunityMessages = (
    mode: 'OLDER_7_DAYS' | 'OLDER_24_HOURS' | 'ALL'
  ): { success: boolean; count: number; error?: string } => {
    if (!currentUser || !isFounderUser(currentUser)) {
      return { success: false, count: 0, error: 'Founder Protection: Only the Founder Super Admin can clear room history.' };
    }
    const now = Date.now();
    const cutoff =
      mode === 'ALL'
        ? Number.POSITIVE_INFINITY
        : mode === 'OLDER_24_HOURS'
        ? now - 24 * 60 * 60 * 1000
        : now - 7 * 24 * 60 * 60 * 1000;

    const toDelete = communityMessages.filter(m => {
      if (mode === 'ALL') return true;
      const ms = new Date(m.createdAt || m.timestamp).getTime();
      return Number.isFinite(ms) && ms < cutoff;
    });

    if (toDelete.length === 0) {
      return { success: true, count: 0 };
    }

    const ids = toDelete.map(m => m.id);
    deletedCommunityIdsRef.current = addIdsToStorageSet(STORAGE_KEYS.DELETED_COMMUNITY_MSG_IDS, ids);
    const idSet = new Set(ids);
    setCommunityMessages(prev => prev.filter(m => !idSet.has(m.id)));
    Promise.all(ids.map(id => deleteCommunityMessageFromFirestore(id))).catch(() => {});
    return { success: true, count: ids.length };
  };

  const deleteDirectMessageForMe = (messageId: string): { success: boolean; error?: string } => {
    if (!currentUser) return { success: false, error: 'Authentication required.' };
    const key = `${STORAGE_KEYS.HIDDEN_DIRECT_MSG_IDS_PREFIX}${currentUser.id}`;
    hiddenDirectIdsRef.current = addIdsToStorageSet(key, [messageId]);
    setChatMessages(prev => prev.filter(m => m.id !== messageId));
    hideDirectMessageForUserInFirestore(messageId, currentUser.id).catch(() => {});
    return { success: true };
  };

  const deleteDirectMessageForEveryone = (messageId: string): { success: boolean; error?: string } => {
    if (!currentUser) return { success: false, error: 'Authentication required.' };
    const target = chatMessages.find(m => m.id === messageId);
    if (!target) return { success: false, error: 'Message not found.' };
    const canDelete = isFounderUser(currentUser) || target.senderId === currentUser.id;
    if (!canDelete) {
      return { success: false, error: 'Only the sender or Founder can delete this message for everyone.' };
    }
    deletedDirectIdsRef.current = addIdsToStorageSet(STORAGE_KEYS.DELETED_DIRECT_MSG_IDS, [messageId]);
    setChatMessages(prev => prev.filter(m => m.id !== messageId));
    deleteDirectMessageFromFirestore(messageId).catch(() => {});
    return { success: true };
  };

  const muteChatUser = (userId: string, muted: boolean): { success: boolean; error?: string } => {
    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN')) {
      return { success: false, error: 'Only Super Admins and District Admins can mute or unmute users.' };
    }
    const target = users.find(u => u.id === userId);
    if (!target) return { success: false, error: 'User not found.' };

    // STRICT FOUNDER PROTECTION: 100% blocked on Founder
    if (isFounderUser(target)) {
      return { success: false, error: 'Founder Protection: Main Super Admin (Founder) cannot be muted.' };
    }
    if (target.role === 'SUPER_ADMIN' && !isFounderUser(currentUser)) {
      return { success: false, error: 'Only the Founder can moderate Additional Super Admins.' };
    }

    const updated = normalizeUserRecord({ ...target, isMutedInChat: muted });
    setUsers(prev => prev.map(u => (u.id === userId ? updated : u)));
    saveUserToFirestore(updated).catch(() => {});
    logAudit(
      muted ? 'CHAT_USER_MUTED' : 'CHAT_USER_UNMUTED',
      'SECURITY',
      target.name,
      `${currentUser.name} ${muted ? 'muted' : 'unmuted'} ${target.name} in Live Community Chat.`
    );
    return { success: true };
  };

  const updateLiveChatAppearance = (data: {
    liveChatTheme?: CommunityScenicThemeId;
    liveChatCustomBgUrl?: string;
    founderBubbleColor?: string;
  }): { success: boolean; error?: string } => {
    if (!currentUser) return { success: false, error: 'Authentication required.' };
    const isFounder = isFounderUser(currentUser);
    const canUploadGallery = isFounder || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
    const isLeader = canUploadGallery || currentUser.role === 'CO_ADMIN';

    if (!isLeader) {
      return { success: false, error: 'Only leadership roles can customize Live Community Room themes.' };
    }
    if (data.founderBubbleColor !== undefined && !isFounder) {
      return { success: false, error: 'Founder bubble colors are strictly exclusive to the Founder.' };
    }
    if ((data.liveChatCustomBgUrl !== undefined || data.liveChatTheme === 'CUSTOM') && !canUploadGallery) {
      return { success: false, error: 'Custom scenic backgrounds are restricted to Super Admins and Admins.' };
    }

    const updated = mergeAppSettings({
      ...appSettings,
      liveChatTheme: data.liveChatTheme ?? appSettings.liveChatTheme,
      liveChatCustomBgUrl: data.liveChatCustomBgUrl !== undefined ? data.liveChatCustomBgUrl : appSettings.liveChatCustomBgUrl,
      founderBubbleColor: data.founderBubbleColor !== undefined ? data.founderBubbleColor : appSettings.founderBubbleColor,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name
    });
    setAppSettings(updated);
    saveAppSettingsToFirestore(updated).catch(() => {});
    return { success: true };
  };

  const updateChatRoomModeration = (data: {
    chatLockMessages?: boolean;
    chatLockVoiceNotes?: boolean;
    chatLockFullRoom?: boolean;
  }): { success: boolean; error?: string } => {
    if (!currentUser || !isChatModerator(currentUser)) {
      return { success: false, error: 'Only Founder, Super Admins, Admins, and Co-Admins can lock room controls.' };
    }
    const updated = mergeAppSettings({
      ...appSettings,
      chatLockMessages: data.chatLockMessages !== undefined ? data.chatLockMessages : appSettings.chatLockMessages,
      chatLockVoiceNotes: data.chatLockVoiceNotes !== undefined ? data.chatLockVoiceNotes : appSettings.chatLockVoiceNotes,
      chatLockFullRoom: data.chatLockFullRoom !== undefined ? data.chatLockFullRoom : appSettings.chatLockFullRoom,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name
    });
    setAppSettings(updated);
    saveAppSettingsToFirestore(updated).catch(() => {});
    logAudit(
      'CHAT_ROOM_MODERATION',
      'SECURITY',
      'Community Room',
      `${currentUser.name} updated room locks (Full: ${Boolean(updated.chatLockFullRoom)}, Text: ${Boolean(updated.chatLockMessages)}, Voice: ${Boolean(updated.chatLockVoiceNotes)}).`
    );
    return { success: true };
  };

  const updateMemberChatControl = (
    userId: string,
    control: { lockMessages?: boolean; lockVoice?: boolean; removeFromRoom?: boolean }
  ): { success: boolean; error?: string } => {
    if (!currentUser || !isChatModerator(currentUser)) {
      return { success: false, error: 'Insufficient authority to moderate room members.' };
    }
    const target = users.find(u => u.id === userId);
    if (!target) return { success: false, error: 'Member not found.' };

    // STRICT FOUNDER IMMUNITY: KC-ADM-001 can NEVER be muted, locked, or removed
    if (isFounderUser(target)) {
      return { success: false, error: 'Founder Protection: Founder (KC-ADM-001) is 100% immune and cannot be muted, locked, or removed.' };
    }
    if (target.role === 'SUPER_ADMIN' && !isFounderUser(currentUser)) {
      return { success: false, error: 'Only the Founder can moderate Additional Super Admins.' };
    }

    const currentControls = { ...(appSettings.chatMemberControls || {}) };
    const existingEntry = currentControls[userId] || {};
    const nextEntry = {
      lockMessages: control.removeFromRoom
        ? true
        : (control.lockMessages !== undefined ? control.lockMessages : Boolean(existingEntry.lockMessages)),
      lockVoice: control.removeFromRoom
        ? true
        : (control.lockVoice !== undefined ? control.lockVoice : Boolean(existingEntry.lockVoice))
    };

    if (!nextEntry.lockMessages && !nextEntry.lockVoice) {
      delete currentControls[userId];
    } else {
      currentControls[userId] = nextEntry;
    }

    const updatedSettings = mergeAppSettings({
      ...appSettings,
      chatMemberControls: currentControls,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name
    });
    setAppSettings(updatedSettings);
    saveAppSettingsToFirestore(updatedSettings).catch(() => {});

    if (control.removeFromRoom !== undefined) {
      const updatedUser = normalizeUserRecord({
        ...target,
        isMutedInChat: control.removeFromRoom
      });
      setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));
      saveUserToFirestore(updatedUser).catch(() => {});
    }

    logAudit(
      'CHAT_MEMBER_CONTROL',
      'SECURITY',
      target.name,
      `${currentUser.name} updated chat control for ${target.name} (lockMessages=${nextEntry.lockMessages}, lockVoice=${nextEntry.lockVoice}, removed=${Boolean(control.removeFromRoom)}).`
    );
    return { success: true };
  };

  // App Updates Management
  const publishAppUpdate = (updateData: Omit<AppUpdate, 'id'>) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') return;

    const newUpdate: AppUpdate = {
      id: `upd_${Date.now()}`,
      ...updateData,
      isPublished: true,
      publishedAt: new Date().toISOString(),
      publishedBy: currentUser.name
    };

    setAppUpdates(prev => [newUpdate, ...prev]);
    saveAppUpdateToFirestore(newUpdate).catch(() => {});

    logAudit(
      'APP_UPDATE_PUBLISHED',
      'APP_UPDATE',
      `Version ${newUpdate.version}`,
      `Published new release v${newUpdate.version} (${newUpdate.title}). Mandatory: ${newUpdate.isMandatory}`
    );

    addNotification({
      type: 'APP_UPDATE_AVAILABLE',
      title: 'Kifayat Connect Update Available',
      message: `Version v${newUpdate.version} (${newUpdate.title}) is now available.`,
      targetRole: 'ALL',
      actionUrl: newUpdate.apkDownloadUrl,
      linkTab: 'dashboard'
    });
  };

  const toggleUpdatePublish = (updateId: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') return;
    setAppUpdates(prev => prev.map(u => {
      if (u.id === updateId) {
        const nextState = !u.isPublished;
        const updated = { ...u, isPublished: nextState, publishedAt: nextState ? new Date().toISOString() : undefined };
        saveAppUpdateToFirestore(updated).catch(() => {});
        return updated;
      }
      return u;
    }));
  };

  const acknowledgeUpdate = (version: string) => {
    setAcknowledgedUpdateVersion(version);
  };

  const updateAppSettings = (newSettings: Partial<AppSettings>) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') return;
    const updated: AppSettings = mergeAppSettings({
      ...appSettings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name
    });
    setAppSettings(updated);
    saveAppSettingsToFirestore(updated).catch(() => {});

    logAudit(
      'APP_SETTINGS_MODIFIED',
      'SETTINGS',
      'Master Control Settings',
      `Super Admin ${currentUser.name} updated global app settings.`
    );
  };

  const dismissIphoneShareNotice = useCallback(() => {
    if (iphoneShareTimerRef.current) {
      window.clearTimeout(iphoneShareTimerRef.current);
      iphoneShareTimerRef.current = null;
    }
    setIphoneShareNotice(null);
  }, []);

  const triggerShareForIphone = useCallback(async () => {
    const result = await shareKifayatForIphone(appSettings.webAppLiveUrl);
    if (iphoneShareTimerRef.current) {
      window.clearTimeout(iphoneShareTimerRef.current);
    }
    const id = Date.now();
    setIphoneShareNotice({ url: result.url, id });
    iphoneShareTimerRef.current = window.setTimeout(() => {
      setIphoneShareNotice(prev => (prev && prev.id === id ? null : prev));
    }, 5500);
  }, [appSettings.webAppLiveUrl]);

  const resetAllData = () => {
    Object.values(STORAGE_KEYS).forEach(k => safeRemoveItem(k));
    setUsers(INITIAL_USERS);
    persistCurrentUserToStorage(null);
    setCurrentUserState(null);
    setCurrentUserId(null);
    setApplications(INITIAL_MEMBERSHIP_APPLICATIONS);
    setPayments(INITIAL_PAYMENTS);
    setComplaints(INITIAL_COMPLAINTS);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setOfficeBearers(INITIAL_OFFICE_BEARERS);
    setOfficeBearerHistory(INITIAL_OFFICE_BEARER_HISTORY);
    setAppUpdates(INITIAL_APP_UPDATES);
    setAppSettings(INITIAL_APP_SETTINGS);
    setChats(INITIAL_CHATS);
    setChatMessages(INITIAL_CHAT_MESSAGES);
    setOfflineChatQueue([]);
    setAcknowledgedUpdateVersion(null);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        users,
        applications,
        payments,
        complaints,
        announcements,
        auditLogs,
        regionalStats,
        activeTab,
        language,
        selectedReceipt,
        selectedCardUser,
        isOnline,
        setActiveTab,
        setLanguage,
        toggleLanguage,
        setSelectedReceipt,
        setSelectedCardUser,
        focusedMemberId,
        setFocusedMemberId,
        memberDirectoryFilter,
        setMemberDirectoryFilter,
        jumpToMemberApproval,
        isCompleteProfileModalOpen,
        openCompleteProfileModal,
        closeCompleteProfileModal,
        isRukniyatFormOpen,
        inspectedRukniyatApp,
        openRukniyatForm,
        closeRukniyatForm,
        isTutorialOpen,
        openTutorial,
        closeTutorial,
        liveChatDisplayMode,
        unreadCommunityCount,
        preferredChatMode,
        setPreferredChatMode,
        minimizeLiveChat,
        hideLiveChat,
        closeAndHideLiveChat,
        restoreLiveChat,
        openPersonalMessage,
        inspectedUserProfile,
        setInspectedUserProfile,
        canAccess,
        recommendApplication,
        finalApproveApplication,
        rejectApplication,
        submitRukniyatForm,
        createOldPaperRecord,
        attachDocumentToApplication,
        removeDocumentFromApplication,
        verifyApplicationDocument,
        registerMember,
        submitPayment,
        verifyPayment,
        submitComplaint,
        updateComplaintStatus,
        publishAnnouncement,
        deleteAnnouncement,
        createOrUpdateStaff,
        assignMemberRole,
        promoteToSuperAdmin,
        demoteSuperAdmin,
        assignAuditOfficer,
        syncAllUsersToCloud,
        approveMemberAccount,
        toggleUserSuspension,
        deleteUserPermanently,
        updateUserPermissions,
        broadcastAdminAlert,
        updateUserProfile,
        resetAllData,
        officeBearers,
        officeBearerHistory,
        appointOfficeBearer,
        vacateOfficeBearer,
        chats,
        chatMessages,
        communityMessages,
        queuedMessageCount: offlineChatQueue.length,
        activeChatUser,
        setActiveChatUser,
        sendChatMessage,
        markConversationAsSeen,
        sendCommunityMessage,
        toggleCommunityReaction,
        toggleHighlightCommunityMessage,
        togglePinCommunityMessage,
        deleteCommunityMessage,
        deleteCommunityMessageForMe,
        deleteCommunityMessageForEveryone,
        clearOldCommunityMessages,
        deleteDirectMessageForMe,
        deleteDirectMessageForEveryone,
        muteChatUser,
        updateLiveChatAppearance,
        updateChatRoomModeration,
        updateMemberChatControl,
        appUpdates,
        latestPublishedUpdate,
        githubRelease,
        refreshGitHubRelease,
        acknowledgedUpdateVersion,
        acknowledgeUpdate,
        publishAppUpdate,
        toggleUpdatePublish,
        appSettings,
        updateAppSettings,
        iphoneShareNotice,
        dismissIphoneShareNotice,
        triggerShareForIphone,
        notifications,
        userNotifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        addNotification,
        firebaseUser,
        isFirebaseLive,
        isCloudSyncing,
        loginWithGoogleAuth,
        loginWithPassword,
        setupPasswordForExistingAccount,
        completePasswordAfterOtp,
        completePasswordResetAndSignIn,
        setOrChangeUserPassword,
        logoutFirebaseAuth,
        requestOTP,
        verifyOTP
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
