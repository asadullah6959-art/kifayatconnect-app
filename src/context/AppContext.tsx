import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  User, 
  UserRole,
  RolePermissions,
  MembershipApplication, 
  PaymentTransaction, 
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
  saveComplaintToFirestore,
  saveAnnouncementToFirestore,
  deleteAnnouncementFromFirestore,
  saveAuditLogToFirestore,
  saveNotificationToFirestore,
  saveUserToFirestore,
  saveOfficeBearerToFirestore,
  saveOfficeBearerHistoryToFirestore,
  saveAppUpdateToFirestore,
  saveAppSettingsToFirestore,
  saveChatMessageToFirestore,
  saveCommunityMessageToFirestore,
  saveChatConversationToFirestore,
  subscribeToFirestoreCollection,
  markUserOfflineInFirestore,
  findExistingFirestoreUserByEmail,
  buildSafeEmailUserId,
  toIsoTimestamp,
  requestEmailOTP,
  verifyEmailOTP,
  getPendingEmailOTP,
  clearPendingEmailOTP,
  saveLocalPasswordCredential,
  verifyLocalPasswordCredential,
  hasLocalPasswordCredential,
  StoredOTP,
  OTPRequestResult,
  OTPVerifyResult,
  FirebaseUser,
  ROOT_SUPER_ADMIN_EMAIL
} from '../services/firebase';
import { fetchLatestGitHubRelease, GitHubReleaseStatus } from '../services/githubReleases';

const STORAGE_KEYS = {
  USERS: 'kifayat_users_v3',
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
  LANGUAGE: 'kifayat_lang_v3'
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function isFounderUser(user?: User | null): boolean {
  if (!user) return false;
  return Boolean(user.isFounder || user.email?.trim().toLowerCase() === ROOT_SUPER_ADMIN_EMAIL.toLowerCase());
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

  return {
    ...u,
    email: (u.email || '').trim().toLowerCase(),
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
    lastSeen: safeLastSeen,
    lastLoginAt: safeLastLogin || safeLastSeen || undefined,
    status: onlineFlag ? 'online' : 'offline',
    createdAt: safeCreatedAt,
    isStaff: role !== 'MEMBER',
    hasPassword: u.hasPassword || hasLocalPasswordCredential(u.email)
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
      byKey.set(key, normalizeUserRecord({
        ...existing,
        ...rem,
        id: preferRemote ? (rem.id || existing.id) : (existing.id || rem.id),
        avatarUrl: photo,
        photoUrl: photo,
        isOnline: preferRemote
          ? Boolean(rem.isOnline)
          : Boolean(rem.isOnline ?? existing.isOnline),
        lastSeen: rem.lastSeen || existing.lastSeen,
        profileCompleted: isFounderUser(existing) || isFounderUser(rem)
          ? true
          : Boolean(rem.profileCompleted || existing.profileCompleted),
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

  // Profile Completion Modal Trigger
  isCompleteProfileModalOpen: boolean;
  openCompleteProfileModal: () => void;
  closeCompleteProfileModal: () => void;

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
  finalApproveApplication: (appId: string, remarks?: string) => void;
  rejectApplication: (appId: string, remarks: string) => void;
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
    isOldMember: boolean;
    oldMembershipNo?: string;
    password?: string;
    avatarUrl?: string;
  }) => Promise<void> | void;
  submitPayment: (data: {
    amount: number;
    fundCategory: any;
    paymentMethod: any;
    referenceNumber: string;
    proofNote?: string;
    receiptImageUrl?: string;
    receiptImageName?: string;
  }) => void;
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
  toggleUserSuspension: (userId: string, suspended: boolean) => { success: boolean; error?: string };
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
  muteChatUser: (userId: string, muted: boolean) => { success: boolean; error?: string };
  updateLiveChatAppearance: (data: {
    liveChatTheme?: CommunityScenicThemeId;
    liveChatCustomBgUrl?: string;
    founderBubbleColor?: string;
  }) => { success: boolean; error?: string };

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
    targetRole?: UserRole | 'ALL';
    targetStateProvince?: string;
    targetDistrict?: string;
    linkTab?: string;
    entityId?: string;
    actionUrl?: string;
  }) => void;

  // Auth, Password & Email OTP
  firebaseUser: FirebaseUser | null;
  isFirebaseLive: boolean;
  isCloudSyncing: boolean;
  loginWithGoogleAuth: () => Promise<User>;
  loginWithPassword: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User; needsPasswordSetup?: boolean }>;
  completePasswordAfterOtp: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
  setOrChangeUserPassword: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logoutFirebaseAuth: () => Promise<void>;
  requestOTP: (email: string) => Promise<OTPRequestResult>;
  verifyOTP: (email: string, code: string) => Promise<OTPVerifyResult & { user?: User }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const THEME_PRESET_VARS: Record<NonNullable<AppSettings['themePreset']>, Record<string, string>> = {
  OBSIDIAN_GOLD: {
    '--kc-bg': '#0A0D12',
    '--kc-surface': '#111622',
    '--kc-surface-elevated': '#161D2C',
    '--kc-border': 'rgba(212, 175, 55, 0.25)',
    '--kc-accent': '#D4AF37',
    '--kc-emerald': '#043927'
  },
  EMERALD_GOLD: {
    '--kc-bg': '#06130F',
    '--kc-surface': '#0B1F18',
    '--kc-surface-elevated': '#102B22',
    '--kc-border': 'rgba(212, 175, 55, 0.3)',
    '--kc-accent': '#F5D061',
    '--kc-emerald': '#065F46'
  },
  MIDNIGHT_ROYAL: {
    '--kc-bg': '#070B16',
    '--kc-surface': '#0F172A',
    '--kc-surface-elevated': '#17233E',
    '--kc-border': 'rgba(212, 175, 55, 0.25)',
    '--kc-accent': '#EAB308',
    '--kc-emerald': '#043927'
  },
  IMPERIAL_ONYX: {
    '--kc-bg': '#08080A',
    '--kc-surface': '#121216',
    '--kc-surface-elevated': '#1B1B21',
    '--kc-border': 'rgba(245, 208, 97, 0.28)',
    '--kc-accent': '#D4AF37',
    '--kc-emerald': '#064E3B'
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Purge legacy v2 dummy storage once on upgrade
  useEffect(() => {
    if (!localStorage.getItem('kifayat_migrated_clean_v3')) {
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
      ].forEach(k => localStorage.removeItem(k));
      localStorage.setItem('kifayat_migrated_clean_v3', 'true');
    }
  }, []);

  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [users, setUsers] = useState<User[]>(() => {
    const raw = readStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    return raw.map(normalizeUserRecord);
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID));
  const [applications, setApplications] = useState<MembershipApplication[]>(() => readStorage(STORAGE_KEYS.APPLICATIONS, INITIAL_MEMBERSHIP_APPLICATIONS));
  const [payments, setPayments] = useState<PaymentTransaction[]>(() => readStorage(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS));
  const [complaints, setComplaints] = useState<Complaint[]>(() => readStorage(STORAGE_KEYS.COMPLAINTS, INITIAL_COMPLAINTS));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => readStorage(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => readStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => readStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS));
  const [officeBearers, setOfficeBearers] = useState<OfficeBearer[]>(() => readStorage(STORAGE_KEYS.OFFICE_BEARERS, INITIAL_OFFICE_BEARERS));
  const [officeBearerHistory, setOfficeBearerHistory] = useState<OfficeBearerHistory[]>(() => readStorage(STORAGE_KEYS.OFFICE_BEARER_HISTORY, INITIAL_OFFICE_BEARER_HISTORY));
  const [appUpdates, setAppUpdates] = useState<AppUpdate[]>(() => readStorage(STORAGE_KEYS.APP_UPDATES, INITIAL_APP_UPDATES));
  const [acknowledgedUpdateVersion, setAcknowledgedUpdateVersion] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.ACK_VERSION));
  const [appSettings, setAppSettings] = useState<AppSettings>(() => mergeAppSettings(readStorage(STORAGE_KEYS.APP_SETTINGS, INITIAL_APP_SETTINGS)));
  const [chats, setChats] = useState<ChatConversation[]>(() => readStorage(STORAGE_KEYS.CHATS, INITIAL_CHATS));
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => readStorage(STORAGE_KEYS.CHAT_MESSAGES, INITIAL_CHAT_MESSAGES));
  const [communityMessages, setCommunityMessages] = useState<ChatMessage[]>(() => readStorage(STORAGE_KEYS.COMMUNITY_MESSAGES, []));
  const [offlineChatQueue, setOfflineChatQueue] = useState<ChatMessage[]>(() => readStorage(STORAGE_KEYS.OFFLINE_CHAT_QUEUE, []));

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

  const openCompleteProfileModal = useCallback(() => setIsCompleteProfileModalOpen(true), []);
  const closeCompleteProfileModal = useCallback(() => setIsCompleteProfileModalOpen(false), []);

  const setActiveTab = useCallback((tab: string) => {
    if (tab !== 'chat') {
      lastNonChatTabRef.current = tab;
    } else {
      setLiveChatDisplayMode('FULL');
      setUnreadCommunityCount(0);
    }
    setActiveTabState(tab);
  }, []);

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

  const [language, setLanguage] = useState<'en' | 'ur'>(() => (localStorage.getItem(STORAGE_KEYS.LANGUAGE) === 'ur' ? 'ur' : 'en'));
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentTransaction | null>(null);
  const [selectedCardUser, setSelectedCardUser] = useState<User | null>(null);
  const [githubRelease, setGithubRelease] = useState<GitHubReleaseStatus | null>(null);

  // Firebase Live Sync & Active OTP States
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseLive, setIsFirebaseLive] = useState<boolean>(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [activeOtpRecord, setActiveOtpRecord] = useState<StoredOTP | null>(() => getPendingEmailOTP());

  // Sync RTL / LTR document direction & language
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [language]);

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

  // Initial GitHub Release fetch
  const refreshGitHubRelease = useCallback(async (force = false) => {
    const status = await fetchLatestGitHubRelease(force);
    setGithubRelease(status);
  }, []);

  useEffect(() => {
    refreshGitHubRelease(false);
  }, [refreshGitHubRelease]);

  // Sync collections to localStorage
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); }, [users]);
  useEffect(() => {
    if (currentUserId) localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
    else localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  }, [currentUserId]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications)); }, [applications]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments)); }, [payments]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints)); }, [complaints]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements)); }, [announcements]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.OFFICE_BEARERS, JSON.stringify(officeBearers)); }, [officeBearers]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.OFFICE_BEARER_HISTORY, JSON.stringify(officeBearerHistory)); }, [officeBearerHistory]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.APP_UPDATES, JSON.stringify(appUpdates)); }, [appUpdates]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(appSettings)); }, [appSettings]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats)); }, [chats]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(chatMessages)); }, [chatMessages]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.COMMUNITY_MESSAGES, JSON.stringify(communityMessages)); }, [communityMessages]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.OFFLINE_CHAT_QUEUE, JSON.stringify(offlineChatQueue)); }, [offlineChatQueue]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.LANGUAGE, language); }, [language]);
  useEffect(() => {
    if (acknowledgedUpdateVersion) {
      localStorage.setItem(STORAGE_KEYS.ACK_VERSION, acknowledgedUpdateVersion);
    }
  }, [acknowledgedUpdateVersion]);

  const currentUser = currentUserId ? (users.find(u => u.id === currentUserId) || null) : null;
  const latestPublishedUpdate = appUpdates.find(u => u.isPublished) || null;

  // Test Firestore connection on boot and bridge local logged-in user into Firebase Auth if needed
  useEffect(() => {
    testFirestoreConnection().catch(() => {});
    if (currentUserId && !auth.currentUser) {
      ensureFirebaseAuthSession().catch(() => null);
    }
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
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser && !fbUser.isAnonymous) {
        try {
          const syncedProfileRaw = await syncUserWithFirestore(fbUser);
          const activeProfile = normalizeUserRecord({
            ...syncedProfileRaw,
            isOnline: true,
            status: 'online'
          });
          setUsers(prev => mergeUsersLists(prev, [activeProfile], true));
          setCurrentUserId(activeProfile.id);
        } catch (err) {
          console.warn('Google auth sync warning:', err);
        }
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Effect B: True Real-Time Firestore Subscriptions (Works for BOTH Google & Email OTP/APK Users!)
  useEffect(() => {
    const activeUid = currentUserId || (firebaseUser && !firebaseUser.isAnonymous ? firebaseUser.uid : null);
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
        const normalizedNotifs: AppNotification[] = remote.map(n => ({
          ...n,
          timestamp: toIsoTimestamp(n.timestamp || n.createdAt, new Date().toISOString()),
          read: Boolean(n.read)
        }));
        setNotifications(prev => {
          const map = new Map<string, AppNotification>();
          prev.forEach(n => map.set(n.id, n));
          normalizedNotifs.forEach(n => map.set(n.id, n));
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

    const unsubUpdates = subscribeToFirestoreCollection<AppUpdate>('app_updates', (remote) => {
      if (remote && remote.length > 0) setAppUpdates(remote);
    });

    const unsubOB = subscribeToFirestoreCollection<OfficeBearer>('office_bearers', (remote) => {
      if (remote && remote.length > 0) setOfficeBearers(remote);
    });

    const unsubSettings = subscribeToFirestoreCollection<AppSettings & { id?: string }>('app_settings', (remote) => {
      if (remote && remote.length > 0) {
        setAppSettings(prev => mergeAppSettings({ ...prev, ...remote[0] }));
      }
    });

    const unsubAuditLogs = subscribeToFirestoreCollection<AuditLog>('audit_logs', (remote) => {
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

    const mergeDirectMessages = (incoming: (ChatMessage & { serverCreatedAt?: unknown })[]) => {
      if (!incoming || incoming.length === 0) return;
      setChatMessages(prev => {
        const map = new Map<string, ChatMessage>();
        prev.forEach(m => map.set(m.id, m));
        incoming.forEach(m => {
          const safeTs = toIsoTimestamp(m.timestamp || m.createdAt || m.serverCreatedAt, new Date().toISOString());
          const safeCreated = toIsoTimestamp(m.createdAt || m.serverCreatedAt || m.timestamp, safeTs);
          map.set(m.id, {
            ...m,
            timestamp: safeTs,
            createdAt: safeCreated,
            deliveryStatus: m.read ? 'SEEN' : (m.deliveryStatus || 'DELIVERED')
          });
        });
        return Array.from(map.values()).sort((a, b) =>
          (a.createdAt || a.timestamp).localeCompare(b.createdAt || b.timestamp)
        );
      });
    };

    const unsubDirectMsgs = subscribeToFirestoreCollection<ChatMessage>(
      'direct_messages',
      mergeDirectMessages,
      { field: 'participants', value: activeUid, op: 'array-contains' }
    );
    const unsubMsgsSent = subscribeToFirestoreCollection<ChatMessage>(
      'chat_messages',
      mergeDirectMessages,
      { field: 'senderId', value: activeUid }
    );
    const unsubMsgsRecv = subscribeToFirestoreCollection<ChatMessage>(
      'chat_messages',
      mergeDirectMessages,
      { field: 'recipientId', value: activeUid }
    );

    const mergeCommunityMessages = (incoming: (ChatMessage & { serverCreatedAt?: unknown })[]) => {
      if (!incoming || incoming.length === 0) return;
      setCommunityMessages(prev => {
        const map = new Map<string, ChatMessage>();
        prev.forEach(m => map.set(m.id, m));
        incoming.forEach(m => {
          const safeTs = toIsoTimestamp(m.timestamp || m.createdAt || m.serverCreatedAt, new Date().toISOString());
          const safeCreated = toIsoTimestamp(m.createdAt || m.serverCreatedAt || m.timestamp, safeTs);
          map.set(m.id, {
            ...m,
            timestamp: safeTs,
            createdAt: safeCreated,
            deliveryStatus: 'DELIVERED'
          });
        });
        return Array.from(map.values()).sort((a, b) =>
          (a.createdAt || a.timestamp).localeCompare(b.createdAt || b.timestamp)
        );
      });
    };

    const unsubCommunityMsgsPrimary = subscribeToFirestoreCollection<ChatMessage>(
      'community_messages',
      mergeCommunityMessages,
      undefined,
      { field: 'createdAt', direction: 'asc' }
    );
    const unsubCommunityMsgsLegacy = subscribeToFirestoreCollection<ChatMessage>(
      'community_chat_messages',
      mergeCommunityMessages
    );

    return () => {
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
  }, [currentUserId, firebaseUser?.uid]);

  // Effect C: Live Online/Offline Presence Heartbeat & Page-Close Marker
  useEffect(() => {
    if (!currentUserId || !isOnline) return;
    const active = users.find(u => u.id === currentUserId);
    if (!active) return;

    saveUserToFirestore(active, { isOnline: true }).catch(() => {});

    const heartbeat = window.setInterval(() => {
      saveUserToFirestore(active, { isOnline: true }).catch(() => {});
    }, 60000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        saveUserToFirestore(active, { isOnline: true }).catch(() => {});
      }
    };

    const handlePageHide = () => {
      markUserOfflineInFirestore(active).catch(() => {});
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
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
    const synced = normalizeUserRecord({
      ...rawSynced,
      isOnline: true,
      status: 'online'
    });
    const existed = users.some(u => u.email.toLowerCase() === synced.email.toLowerCase());
    setUsers(prev => mergeUsersLists(prev, [synced], true));
    setCurrentUserId(synced.id);
    setActiveTab('dashboard');
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
            ? { ...u, isOnline: false, status: 'offline', lastSeen: new Date().toISOString() }
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
    options?: { hasPassword?: boolean; name?: string; remoteExisting?: User | null }
  ): { user: User; isNewSignup: boolean } => {
    const localExisting = users.find(u => u.email.toLowerCase() === normEmail);
    const existing = options?.remoteExisting
      ? normalizeUserRecord({ ...(localExisting || {}), ...options.remoteExisting })
      : localExisting;
    const isFounderEmail = normEmail === ROOT_SUPER_ADMIN_EMAIL.toLowerCase();
    const nowIso = new Date().toISOString();

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
          status: 'online',
          lastLoginAt: nowIso,
          hasPassword: options?.hasPassword ?? (existing.hasPassword || hasLocalPasswordCredential(normEmail))
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
        status: 'online',
        lastLoginAt: nowIso,
        createdAt: nowIso,
        hasPassword: options?.hasPassword ?? hasLocalPasswordCredential(normEmail),
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
      const updatedExisting = normalizeUserRecord({
        ...existing,
        isOnline: true,
        lastSeen: nowIso,
        status: 'online',
        lastLoginAt: nowIso,
        hasPassword: options?.hasPassword ?? (existing.hasPassword || hasLocalPasswordCredential(normEmail))
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
      status: 'online',
      lastLoginAt: nowIso,
      createdAt: nowIso,
      hasPassword: options?.hasPassword ?? hasLocalPasswordCredential(normEmail),
      country: 'Pakistan',
      stateProvince: 'Punjab',
      district: 'Lahore',
      tehsil: 'Model Town',
      cityTown: 'Lahore',
      unionCouncil: '',
      membershipId: `KC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      membershipStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
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
    const { user: matched, isNewSignup } = upsertVerifiedUserByEmail(normEmail, { remoteExisting });
    if (matched.isSuspended && !isFounderUser(matched)) {
      return {
        success: false,
        message: 'This account is suspended. Contact the Super Admin.'
      };
    }

    setCurrentUserId(matched.id);
    setActiveTab('dashboard');
    saveUserToFirestore(matched, { isOnline: true }).catch(() => {});
    emitAuthAlertNotification(isNewSignup ? 'USER_SIGNUP' : 'USER_LOGIN', matched);
    return { ...res, user: matched };
  };

  const loginWithPassword = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string; user?: User; needsPasswordSetup?: boolean }> => {
    const normEmail = email.trim().toLowerCase();
    if (!normEmail || !normEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid Gmail or email address.' };
    }
    if (!password.trim()) {
      return { success: false, message: 'Please enter your password.' };
    }

    const remoteExisting = await findExistingFirestoreUserByEmail(normEmail);
    const existing = remoteExisting || users.find(u => u.email.toLowerCase() === normEmail);
    const hasPwd = hasLocalPasswordCredential(normEmail);

    if (!hasPwd) {
      return {
        success: false,
        needsPasswordSetup: true,
        message: 'No password is set for this email yet. Use Email OTP to sign in or click "Forgot Password?" to create one.'
      };
    }

    const ok = await verifyLocalPasswordCredential(normEmail, password);
    if (!ok) {
      return {
        success: false,
        message: 'Incorrect email or password. Try again or use Forgot Password / Email OTP.'
      };
    }

    if (existing?.isSuspended && !isFounderUser(existing)) {
      return {
        success: false,
        message: 'This account has been suspended by the Super Admin.'
      };
    }

    const { user: loggedInUser, isNewSignup } = upsertVerifiedUserByEmail(normEmail, {
      hasPassword: true,
      remoteExisting
    });
    setCurrentUserId(loggedInUser.id);
    setActiveTab('dashboard');
    saveUserToFirestore(loggedInUser, { isOnline: true }).catch(() => {});
    emitAuthAlertNotification(isNewSignup ? 'USER_SIGNUP' : 'USER_LOGIN', loggedInUser);
    return { success: true, message: 'Signed in successfully.', user: loggedInUser };
  };

  const completePasswordAfterOtp = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string; user?: User }> => {
    const normEmail = email.trim().toLowerCase();
    if (password.trim().length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }
    await saveLocalPasswordCredential(normEmail, password);
    const remoteExisting = await findExistingFirestoreUserByEmail(normEmail);
    const { user, isNewSignup } = upsertVerifiedUserByEmail(normEmail, {
      hasPassword: true,
      remoteExisting
    });
    setCurrentUserId(user.id);
    setActiveTab('dashboard');
    saveUserToFirestore(user, { isOnline: true }).catch(() => {});
    emitAuthAlertNotification(isNewSignup ? 'USER_SIGNUP' : 'USER_LOGIN', user);
    return { success: true, message: 'Password saved and signed in.', user };
  };

  const setOrChangeUserPassword = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    const normEmail = email.trim().toLowerCase();
    if (password.trim().length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }
    await saveLocalPasswordCredential(normEmail, password);
    setUsers(prev =>
      prev.map(u => {
        if (u.email.toLowerCase() === normEmail) {
          const updated = { ...u, hasPassword: true };
          saveUserToFirestore(updated, { isOnline: u.id === currentUserId }).catch(() => {});
          return updated;
        }
        return u;
      })
    );
    return { success: true, message: 'Password updated successfully.' };
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
    targetRole?: UserRole | 'ALL';
    targetStateProvince?: string;
    targetDistrict?: string;
    linkTab?: string;
    entityId?: string;
    actionUrl?: string;
  }) => {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...data
    };
    setNotifications(prev => [newNotif, ...prev]);
    saveNotificationToFirestore(newNotif).catch(() => {});
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => {
        if (n.id === id) {
          const updated = { ...n, read: true };
          saveNotificationToFirestore(updated).catch(() => {});
          return updated;
        }
        return n;
      })
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev =>
      prev.map(n => {
        if (!n.read) {
          const updated = { ...n, read: true };
          saveNotificationToFirestore(updated).catch(() => {});
          return updated;
        }
        return n;
      })
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const userNotifications = currentUser
    ? notifications.filter(n => {
        if (n.targetUserId && n.targetUserId === currentUser.id) return true;
        if (n.targetRole === 'ALL' || !n.targetRole) return true;
        if (currentUser.role === 'SUPER_ADMIN' && n.type === 'PAYMENT_PENDING') return true;
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
      })
    : [];

  const unreadNotificationsCount = userNotifications.filter(n => !n.read).length;

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

  // Workflow 2: Super Admin Final Approval
  const finalApproveApplication = (appId: string, remarks?: string) => {
    if (!currentUser) return;
    const targetApp = applications.find(a => a.id === appId);
    if (!targetApp) return;

    const newMembershipId = `KC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const updatedApp: MembershipApplication = {
      ...targetApp,
      status: 'ACTIVE',
      superAdminRemarks: remarks || 'Final approval granted under Kifayat Connect bylaws.',
      superAdminApprovedAt: new Date().toISOString(),
      generatedMembershipId: newMembershipId
    };

    setApplications(prev => prev.map(app => app.id === appId ? updatedApp : app));
    saveApplicationToFirestore(updatedApp).catch(() => {});

    const exp = new Date();
    exp.setFullYear(exp.getFullYear() + 3);

    const existingMember = users.find(u => u.email.toLowerCase() === targetApp.email.toLowerCase());
    if (existingMember) {
      const updatedMember: User = {
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
        membershipId: existingMember.membershipId || newMembershipId,
        membershipStatus: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        validUntil: exp.toISOString().split('T')[0]
      };
      setUsers(prev => prev.map(u => u.id === existingMember.id ? updatedMember : u));
      saveUserToFirestore(updatedMember).catch(() => {});
    } else {
      const newMemberUser: User = {
        id: `usr_${Date.now()}`,
        name: targetApp.applicantName,
        email: targetApp.email,
        phone: targetApp.phone,
        role: 'MEMBER',
        isFounder: false,
        hasPassword: hasLocalPasswordCredential(targetApp.email),
        country: targetApp.country,
        stateProvince: targetApp.stateProvince,
        district: targetApp.district,
        tehsil: targetApp.tehsil,
        cityTown: targetApp.cityTown,
        unionCouncil: targetApp.unionCouncil,
        membershipId: newMembershipId,
        membershipStatus: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        cnic: targetApp.cnic,
        address: targetApp.address,
        joinDate: new Date().toISOString().split('T')[0],
        validUntil: exp.toISOString().split('T')[0],
        monthlyPledge: 0,
        annualPledge: 0,
        totalContributed: 0,
        isStaff: false,
        notes: targetApp.isOldMemberVerification 
          ? `Verified legacy member. Old ID: ${targetApp.oldMembershipNo}` 
          : 'Newly verified member via two-stage governance pipeline.'
      };
      setUsers(prev => [newMemberUser, ...prev]);
      saveUserToFirestore(newMemberUser).catch(() => {});
    }

    logAudit(
      'FINAL_MEMBERSHIP_APPROVAL_GRANTED',
      'MEMBERSHIP',
      newMembershipId,
      `Super Admin ${currentUser.name} issued permanent membership ID ${newMembershipId} for ${targetApp.applicantName}.`,
      targetApp.district,
      targetApp.stateProvince
    );

    addNotification({
      type: 'MEMBERSHIP_APPROVED',
      title: 'Membership Approved & ID Issued',
      message: `Congratulations ${targetApp.applicantName}! Your membership is active. Membership ID: ${newMembershipId}.`,
      targetUserId: existingMember?.id,
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
    isOldMember: boolean;
    oldMembershipNo?: string;
    password?: string;
    avatarUrl?: string;
  }) => {
    const loc = mapLegacyRegionToHierarchy('');
    const prov = data.stateProvince || loc.stateProvince;
    const dist = data.district || loc.district;
    const normEmail = data.email.trim().toLowerCase();

    if (data.password && data.password.trim().length >= 6) {
      await saveLocalPasswordCredential(normEmail, data.password.trim());
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
      submittedAt: new Date().toISOString(),
      status: 'PENDING_DISTRICT_REVIEW',
      isOldMemberVerification: data.isOldMember,
      oldMembershipNo: data.oldMembershipNo
    };

    setApplications(prev => [newApp, ...prev]);
    ensureFirebaseAuthSession().then(() => saveApplicationToFirestore(newApp)).catch(() => {});

    const remoteRegMatch = await findExistingFirestoreUserByEmail(normEmail);
    const existing = remoteRegMatch || users.find(u => u.email.toLowerCase() === normEmail);
    const exp = new Date();
    exp.setFullYear(exp.getFullYear() + 3);
    const joinDate = new Date().toISOString().split('T')[0];

    const photo = data.avatarUrl || existing?.avatarUrl || existing?.photoUrl;
    const nowIso = new Date().toISOString();
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
          profileCompleted: true,
          isOnline: true,
          lastSeen: nowIso,
          status: 'online',
          lastLoginAt: nowIso,
          hasPassword: Boolean(data.password) || existing.hasPassword || hasLocalPasswordCredential(normEmail)
        })
      : normalizeUserRecord({
          id: buildSafeEmailUserId(normEmail),
          name: data.applicantName,
          email: normEmail,
          phone: data.phone,
          role: 'MEMBER',
          isFounder: normEmail === ROOT_SUPER_ADMIN_EMAIL.toLowerCase(),
          isAuditOfficer: false,
          profileCompleted: true,
          status: 'online',
          lastLoginAt: nowIso,
          hasPassword: Boolean(data.password) || hasLocalPasswordCredential(normEmail),
          country: data.country || 'Pakistan',
          stateProvince: prov,
          district: dist,
          tehsil: data.tehsil || data.cityTown || dist,
          cityTown: data.cityTown || dist,
          unionCouncil: data.unionCouncil || '',
          membershipId: `KC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          membershipStatus: 'ACTIVE',
          verificationStatus: 'VERIFIED',
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
          notes: 'Registered via Email OTP + Password flow'
        });

    setUsers(prev => mergeUsersLists(prev, [registeredUser], true));
    saveUserToFirestore(registeredUser, { isOnline: true }).catch(() => {});
    setCurrentUserId(registeredUser.id);
    setActiveTab('dashboard');
    emitAuthAlertNotification('USER_SIGNUP', registeredUser);

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
      linkTab: 'approvals',
      entityId: newApp.id
    });
  };

  const submitPayment = (data: {
    amount: number;
    fundCategory: any;
    paymentMethod: any;
    referenceNumber: string;
    proofNote?: string;
    receiptImageUrl?: string;
    receiptImageName?: string;
  }) => {
    if (!currentUser) return;
    const newTx: PaymentTransaction = {
      id: `tx_${Date.now()}`,
      receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userMembershipId: currentUser.membershipId || 'KC-PENDING',
      country: currentUser.country,
      stateProvince: currentUser.stateProvince,
      district: currentUser.district,
      tehsil: currentUser.tehsil,
      cityTown: currentUser.cityTown,
      unionCouncil: currentUser.unionCouncil,
      amount: data.amount,
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
      `Member ${currentUser.name} submitted payment of PKR ${data.amount.toLocaleString()} via ${data.paymentMethod}. Ref: ${data.referenceNumber}`,
      currentUser.district,
      currentUser.stateProvince
    );

    addNotification({
      type: 'PAYMENT_PENDING',
      title: 'New Contribution Awaiting Verification',
      message: `${currentUser.name} submitted PKR ${data.amount.toLocaleString()} (${data.paymentMethod}) for approval.`,
      targetRole: 'ADMIN',
      targetDistrict: currentUser.district,
      linkTab: 'funds',
      entityId: newTx.id
    });
  };

  const verifyPayment = (txId: string, approved: boolean, reason?: string) => {
    if (!currentUser) return;
    const tx = payments.find(p => p.id === txId);
    if (!tx) return;

    const updatedTx: PaymentTransaction = {
      ...tx,
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
      tx.receiptNumber,
      `${currentUser.name} marked receipt ${tx.receiptNumber} as ${approved ? 'APPROVED' : 'REJECTED'}. Amount: PKR ${tx.amount.toLocaleString()}`,
      tx.district,
      tx.stateProvince
    );

    addNotification({
      type: approved ? 'PAYMENT_VERIFIED' : 'PAYMENT_REJECTED',
      title: approved ? 'Payment Approved & Receipt Issued' : 'Payment Declined',
      message: approved 
        ? `Your payment of PKR ${tx.amount.toLocaleString()} is approved. Receipt ${tx.receiptNumber} is ready.`
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

  const updateUserProfile = (profileData: Partial<User>) => {
    if (!currentUser) return;
    const hasDetailsCompleted = Boolean(
      profileData.profileCompleted ||
      currentUser.profileCompleted ||
      ((profileData.cnic ?? currentUser.cnic)?.trim() && (profileData.address ?? currentUser.address)?.trim())
    );
    const updated: User = normalizeUserRecord({
      ...currentUser,
      ...profileData,
      role: currentUser.role,
      isFounder: isFounderUser(currentUser),
      profileCompleted: isFounderUser(currentUser) ? true : hasDetailsCompleted,
      lastLoginAt: new Date().toISOString()
    });
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
    ensureFirebaseAuthSession().then(() => saveUserToFirestore(updated)).catch(() => {});
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
    const canUploadGallery = isFounder || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
    if (currentUser.isMutedInChat && !isFounder) {
      return { success: false, error: 'You are currently muted in Community Chat by an administrator.' };
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
    const target = communityMessages.find(m => m.id === messageId);
    if (!target) return { success: false, error: 'Message not found.' };
    const nextPinned = !target.isPinned;

    const changed: ChatMessage[] = [];
    setCommunityMessages(prev =>
      prev.map(m => {
        if (m.id === messageId) {
          const u = { ...m, isPinned: nextPinned, pinnedBy: nextPinned ? currentUser.name : undefined };
          changed.push(u);
          return u;
        }
        if (nextPinned && m.isPinned) {
          const u = { ...m, isPinned: false, pinnedBy: undefined };
          changed.push(u);
          return u;
        }
        return m;
      })
    );
    changed.forEach(u => saveCommunityMessageToFirestore(u).catch(() => {}));
    return { success: true };
  };

  const deleteCommunityMessage = (messageId: string): { success: boolean; error?: string } => {
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

    const updated: ChatMessage = {
      ...target,
      isDeleted: true,
      isPinned: false,
      deletedBy: currentUser.name,
      text: `Message removed by ${currentUser.name}`,
      attachmentUrl: undefined,
      voiceNote: undefined,
      islamicGifId: undefined
    };
    setCommunityMessages(prev => prev.map(m => (m.id === messageId ? updated : m)));
    saveCommunityMessageToFirestore(updated).catch(() => {});
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

  const resetAllData = () => {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    setUsers(INITIAL_USERS);
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
        isCompleteProfileModalOpen,
        openCompleteProfileModal,
        closeCompleteProfileModal,
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
        toggleUserSuspension,
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
        muteChatUser,
        updateLiveChatAppearance,
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
        completePasswordAfterOtp,
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
