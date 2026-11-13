import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  User, 
  UserRole, 
  MembershipApplication, 
  PaymentTransaction, 
  Complaint, 
  Announcement, 
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
  SupportingDocument,
  SupportingDocumentType
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
  saveApplicationToFirestore,
  savePaymentToFirestore,
  saveComplaintToFirestore,
  saveAnnouncementToFirestore,
  saveAuditLogToFirestore,
  saveNotificationToFirestore,
  saveUserToFirestore,
  saveOfficeBearerToFirestore,
  saveOfficeBearerHistoryToFirestore,
  saveAppUpdateToFirestore,
  saveAppSettingsToFirestore,
  saveChatMessageToFirestore,
  saveChatConversationToFirestore,
  subscribeToFirestoreCollection,
  requestEmailOTP,
  verifyEmailOTP,
  getPendingEmailOTP,
  clearPendingEmailOTP,
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
  }) => void;
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
    targetScope?: 'ALL' | 'PROVINCE' | 'DISTRICT';
    targetStateProvince?: string;
    targetDistrict?: string;
    urgency: 'NORMAL' | 'URGENT';
    isPinned: boolean;
  }) => void;
  createOrUpdateStaff: (userData: Partial<User> & { id?: string }) => { success: boolean; error?: string };
  updateUserProfile: (profileData: Partial<User>) => void;
  resetAllData: () => void;

  // Office-Bearers Module
  officeBearers: OfficeBearer[];
  officeBearerHistory: OfficeBearerHistory[];
  appointOfficeBearer: (seatId: string, userId: string, notes?: string) => { success: boolean; error?: string };
  vacateOfficeBearer: (seatId: string, reason: string) => { success: boolean; error?: string };

  // Chat Module
  chats: ChatConversation[];
  chatMessages: ChatMessage[];
  activeChatUser: User | null;
  setActiveChatUser: (user: User | null) => void;
  sendChatMessage: (recipientId: string, text: string, attachment?: { url: string; name: string; type: 'IMAGE' | 'DOCUMENT' }) => { success: boolean; error?: string };

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

  // Auth & Email OTP
  firebaseUser: FirebaseUser | null;
  isFirebaseLive: boolean;
  isCloudSyncing: boolean;
  loginWithGoogleAuth: () => Promise<User>;
  logoutFirebaseAuth: () => Promise<void>;
  requestOTP: (email: string) => Promise<OTPRequestResult>;
  verifyOTP: (email: string, code: string) => Promise<OTPVerifyResult & { user?: User }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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
  const [users, setUsers] = useState<User[]>(() => readStorage(STORAGE_KEYS.USERS, INITIAL_USERS));
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
  const [appSettings, setAppSettings] = useState<AppSettings>(() => readStorage(STORAGE_KEYS.APP_SETTINGS, INITIAL_APP_SETTINGS));
  const [chats, setChats] = useState<ChatConversation[]>(() => readStorage(STORAGE_KEYS.CHATS, INITIAL_CHATS));
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => readStorage(STORAGE_KEYS.CHAT_MESSAGES, INITIAL_CHAT_MESSAGES));

  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  const [inspectedUserProfile, setInspectedUserProfile] = useState<User | null>(null);
  const [regionalStats] = useState<RegionalStats[]>(REGIONAL_STATS_DATA);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [language, setLanguage] = useState<'en' | 'ur'>(() => (localStorage.getItem(STORAGE_KEYS.LANGUAGE) === 'ur' ? 'ur' : 'en'));
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentTransaction | null>(null);
  const [selectedCardUser, setSelectedCardUser] = useState<User | null>(null);
  const [githubRelease, setGithubRelease] = useState<GitHubReleaseStatus | null>(null);

  // Firebase Live Sync & Active OTP States
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseLive, setIsFirebaseLive] = useState<boolean>(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [activeOtpRecord, setActiveOtpRecord] = useState<StoredOTP | null>(() => getPendingEmailOTP());

  // Online / Offline Connectivity Listeners & Hybrid Re-Sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
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

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [users, applications, payments, complaints, announcements]);

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
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.LANGUAGE, language); }, [language]);
  useEffect(() => {
    if (acknowledgedUpdateVersion) {
      localStorage.setItem(STORAGE_KEYS.ACK_VERSION, acknowledgedUpdateVersion);
    }
  }, [acknowledgedUpdateVersion]);

  const currentUser = currentUserId ? (users.find(u => u.id === currentUserId) || null) : null;
  const latestPublishedUpdate = appUpdates.find(u => u.isPublished) || null;

  // Firebase Auth Lifecycle & Subscriptions
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setIsFirebaseLive(true);
        setIsCloudSyncing(true);

        try {
          const syncedProfile = await syncUserWithFirestore(fbUser);
          if (syncedProfile) {
            setUsers(prev => {
              const idx = prev.findIndex(u => u.id === syncedProfile.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = syncedProfile;
                return next;
              }
              return [syncedProfile, ...prev];
            });
            setCurrentUserId(syncedProfile.id);
          }

          const role = syncedProfile?.role || 'MEMBER';
          const uid = syncedProfile?.id || fbUser.uid;
          const userEmail = syncedProfile?.email || fbUser.email || '';

          const unsubUsers = subscribeToFirestoreCollection<User>('users', (remote) => {
            if (remote && remote.length > 0) setUsers(remote);
          });
          const unsubApps = subscribeToFirestoreCollection<MembershipApplication>(
            'applications',
            (remote) => {
              if (remote && remote.length > 0) setApplications(remote);
            },
            syncedProfile?.isStaff ? undefined : { field: 'email', value: userEmail }
          );
          const unsubPayments = subscribeToFirestoreCollection<PaymentTransaction>(
            'payments',
            (remote) => {
              if (remote && remote.length > 0) setPayments(remote);
            },
            (role === 'SUPER_ADMIN' || role === 'FINANCE_OFFICER' || role === 'ADMIN')
              ? undefined
              : { field: 'userId', value: uid }
          );
          const unsubComplaints = subscribeToFirestoreCollection<Complaint>(
            'complaints',
            (remote) => {
              if (remote && remote.length > 0) setComplaints(remote);
            },
            (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'CO_ADMIN')
              ? undefined
              : { field: 'userId', value: uid }
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
          const unsubChats = subscribeToFirestoreCollection<ChatConversation>(
            'chats',
            (remote) => {
              if (remote && remote.length > 0) setChats(remote);
            },
            role === 'SUPER_ADMIN'
              ? undefined
              : { field: 'participantIds', value: uid, op: 'array-contains' }
          );

          const mergeMessages = (incoming: ChatMessage[]) => {
            if (!incoming || incoming.length === 0) return;
            setChatMessages(prev => {
              const map = new Map<string, ChatMessage>();
              prev.forEach(m => map.set(m.id, m));
              incoming.forEach(m => map.set(m.id, m));
              return Array.from(map.values()).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
            });
          };

          const unsubMsgsSent = subscribeToFirestoreCollection<ChatMessage>(
            'chat_messages',
            mergeMessages,
            { field: 'senderId', value: uid }
          );
          const unsubMsgsRecv = subscribeToFirestoreCollection<ChatMessage>(
            'chat_messages',
            mergeMessages,
            { field: 'recipientId', value: uid }
          );

          unsubs = [unsubUsers, unsubApps, unsubPayments, unsubComplaints, unsubAnnounce, unsubUpdates, unsubOB, unsubChats, unsubMsgsSent, unsubMsgsRecv];
        } catch (err) {
          console.warn('Firestore live sync init warning:', err);
        } finally {
          setIsCloudSyncing(false);
        }
      } else {
        setIsFirebaseLive(false);
        unsubs.forEach(u => u());
        unsubs = [];
      }
    });

    return () => {
      unsubscribeAuth();
      unsubs.forEach(u => u());
    };
  }, []);

  const loginWithGoogleAuth = async (): Promise<User> => {
    const fbUser = await loginWithGoogle();
    const synced = await syncUserWithFirestore(fbUser);
    setUsers(prev => {
      const idx = prev.findIndex(u => u.id === synced.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = synced;
        return next;
      }
      return [synced, ...prev];
    });
    setCurrentUserId(synced.id);
    setActiveTab('dashboard');
    return synced;
  };

  const logoutFirebaseAuth = async (): Promise<void> => {
    try {
      await logoutUser();
    } catch {
      // Ignore if signed in purely via OTP
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

  const verifyOTP = async (email: string, code: string): Promise<OTPVerifyResult & { user?: User }> => {
    const res = await verifyEmailOTP(email, code, activeOtpRecord);
    if (!res.success) {
      if (!getPendingEmailOTP()) setActiveOtpRecord(null);
      return res;
    }

    setActiveOtpRecord(null);
    clearPendingEmailOTP();

    const normEmail = (res.verifiedEmail || email).trim().toLowerCase();
    const existing = users.find(u => u.email.toLowerCase() === normEmail);

    if (normEmail === ROOT_SUPER_ADMIN_EMAIL.toLowerCase()) {
      if (existing) {
        const updatedSuperAdmin: User = existing.role === 'SUPER_ADMIN'
          ? existing
          : { ...existing, role: 'SUPER_ADMIN', isStaff: true };
        if (updatedSuperAdmin !== existing) {
          setUsers(prev => prev.map(u => (u.id === existing.id ? updatedSuperAdmin : u)));
        }
        setCurrentUserId(updatedSuperAdmin.id);
        setActiveTab('dashboard');
        return { ...res, user: updatedSuperAdmin };
      }

      const joinDate = new Date().toISOString().split('T')[0];
      const exp = new Date();
      exp.setFullYear(exp.getFullYear() + 5);

      const superAdminUser: User = {
        id: 'usr_super_admin',
        name: 'Asadullah (Super Admin)',
        email: normEmail,
        phone: '',
        role: 'SUPER_ADMIN',
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
        notes: 'Verified Root Super Admin via Email OTP'
      };

      setUsers(prev => [superAdminUser, ...prev]);
      setCurrentUserId(superAdminUser.id);
      setActiveTab('dashboard');
      return { ...res, user: superAdminUser };
    }

    if (existing) {
      setCurrentUserId(existing.id);
      setActiveTab('dashboard');
      return { ...res, user: existing };
    }

    // Create clean Member account at zero balance
    const joinDate = new Date().toISOString().split('T')[0];
    const exp = new Date();
    exp.setFullYear(exp.getFullYear() + 3);

    const newMember: User = {
      id: `usr_${Date.now()}`,
      name: normEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      email: normEmail,
      phone: '',
      role: 'MEMBER',
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
      notes: 'Verified via Email OTP'
    };

    setUsers(prev => [newMember, ...prev]);
    setCurrentUserId(newMember.id);
    setActiveTab('dashboard');
    saveUserToFirestore(newMember).catch(() => {});
    return { ...res, user: newMember };
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
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const userNotifications = currentUser
    ? notifications.filter(n => {
        if (n.targetUserId && n.targetUserId === currentUser.id) return true;
        if (n.targetRole === 'ALL' || !n.targetRole) return true;
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
    switch (permission) {
      case 'SUPER_ADMIN_CONTROL':
      case 'MANAGE_APP':
      case 'MANAGE_APP_UPDATES':
      case 'APPOINT_ADMINS':
      case 'APPOINT_CO_ADMINS':
      case 'APPOINT_OFFICE_BEARERS':
      case 'MANAGE_APP_SETTINGS':
        return role === 'SUPER_ADMIN';

      case 'VIEW_MEMBERS':
        return role === 'SUPER_ADMIN' || role === 'FINANCE_OFFICER' || role === 'ADMIN' || role === 'CO_ADMIN';

      case 'APPROVE_MEMBERSHIP_FINAL':
        return role === 'SUPER_ADMIN';

      case 'RECOMMEND_MEMBERSHIP':
        return role === 'SUPER_ADMIN' || role === 'ADMIN';

      case 'MANAGE_FUNDS':
      case 'VERIFY_PAYMENTS':
        return role === 'SUPER_ADMIN' || role === 'FINANCE_OFFICER' || role === 'ADMIN';

      case 'GENERATE_RECEIPTS':
        return true;

      case 'MANAGE_ALL_COMPLAINTS':
        return role === 'SUPER_ADMIN';

      case 'MANAGE_DISTRICT_COMPLAINTS':
        return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'CO_ADMIN';

      case 'PUBLISH_GLOBAL_ANNOUNCEMENTS':
        return role === 'SUPER_ADMIN';

      case 'PUBLISH_DISTRICT_ANNOUNCEMENTS':
        return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'CO_ADMIN';

      case 'CHAT_MESSAGING':
        return appSettings.chatEnabled;

      case 'VIEW_AUDIT_LOGS':
        return role === 'SUPER_ADMIN' || role === 'FINANCE_OFFICER' || role === 'ADMIN' || role === 'CO_ADMIN';

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
      title: 'Application Recommended by District Admin',
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

    const newMemberUser: User = {
      id: `usr_${Date.now()}`,
      name: targetApp.applicantName,
      email: targetApp.email,
      phone: targetApp.phone,
      role: 'MEMBER',
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
      targetUserId: newMemberUser.id,
      linkTab: 'dashboard',
      entityId: newMemberUser.id
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

  const registerMember = (data: {
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
  }) => {
    const loc = mapLegacyRegionToHierarchy('');
    const prov = data.stateProvince || loc.stateProvince;
    const dist = data.district || loc.district;

    const newApp: MembershipApplication = {
      id: `app_${Date.now()}`,
      applicantName: data.applicantName,
      email: data.email,
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
    saveApplicationToFirestore(newApp).catch(() => {});

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
      targetRole: 'FINANCE_OFFICER',
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

  // Announcements (Elaanat) with automatic personal inbox + notification broadcast
  const publishAnnouncement = (data: {
    title: string;
    content: string;
    targetScope?: 'ALL' | 'PROVINCE' | 'DISTRICT';
    targetStateProvince?: string;
    targetDistrict?: string;
    urgency: 'NORMAL' | 'URGENT';
    isPinned: boolean;
  }) => {
    if (!currentUser) return;
    const scope = data.targetScope || 'ALL';

    const newAnnounce: Announcement = {
      id: `ann_${Date.now()}`,
      title: data.title,
      content: data.content,
      targetScope: scope,
      targetStateProvince: data.targetStateProvince,
      targetDistrict: data.targetDistrict,
      publishedBy: currentUser.name,
      publisherRole: currentUser.role,
      publishedAt: new Date().toISOString(),
      isPinned: data.isPinned,
      urgency: data.urgency
    };

    setAnnouncements(prev => [newAnnounce, ...prev]);
    saveAnnouncementToFirestore(newAnnounce).catch(() => {});

    // Automatically deliver notification alert to targeted users
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

    // Automatically deliver personal inbox message to each targeted member
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
      const broadcastText = `📢 OFFICIAL ELAAN: ${data.title}\n\n${data.content}`;
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
          read: false
        };
        newMessages.push(msg);
        saveChatMessageToFirestore(msg).catch(() => {});

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
          lastMessage: `📢 ${data.title}`,
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
      `Published by ${currentUser.name} (${currentUser.role}). Target: ${scope}. Dispatched to ${recipients.length} member inbox(es).`,
      data.targetDistrict,
      data.targetStateProvince
    );
  };

  // Staff & Admin Management with Quotas (10 Admins/District, 3 Co-Admins/State)
  const createOrUpdateStaff = (userData: Partial<User> & { id?: string }): { success: boolean; error?: string } => {
    if (!currentUser) return { success: false, error: 'Authentication required.' };
    const targetDistrict = userData.district || currentUser.district;
    const targetState = userData.stateProvince || currentUser.stateProvince;
    const requestedRole = userData.role || 'MEMBER';

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
          error: `District quota exceeded! Maximum 10 District Admins are allowed for ${targetDistrict}. Current count: ${existingAdminsInDistrict.length}.`
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
          error: `State quota exceeded! Maximum 3 State Co-Admins are allowed for ${targetState}. Current count: ${existingCoAdminsInState.length}.`
        };
      }
    }

    if (userData.id) {
      const existing = users.find(u => u.id === userData.id);
      if (!existing) return { success: false, error: 'User not found.' };

      const updated: User = {
        ...existing,
        ...userData,
        isStaff: requestedRole !== 'MEMBER'
      };

      setUsers(prev => prev.map(u => u.id === userData.id ? updated : u));
      saveUserToFirestore(updated).catch(() => {});

      logAudit(
        'STAFF_RECORD_UPDATED',
        'STAFF_MANAGEMENT',
        updated.name,
        `Updated role to ${updated.role} in ${updated.district}, ${updated.stateProvince}.`,
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
        email: userData.email || '',
        phone: userData.phone || '',
        role: requestedRole,
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
          : `KC-STAFF-${Math.floor(100 + Math.random() * 900)}`,
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
        notes: `Appointed by Super Admin ${currentUser.name}.`
      };

      setUsers(prev => [newUser, ...prev]);
      saveUserToFirestore(newUser).catch(() => {});

      logAudit(
        'STAFF_APPOINTMENT_CREATED',
        'STAFF_MANAGEMENT',
        newUser.name,
        `Appointed as ${newUser.role} for ${newUser.district}, ${newUser.stateProvince}.`,
        newUser.district,
        newUser.stateProvince
      );

      return { success: true };
    }
  };

  const updateUserProfile = (profileData: Partial<User>) => {
    if (!currentUser) return;
    const updated: User = {
      ...currentUser,
      ...profileData
    };
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
    saveUserToFirestore(updated).catch(() => {});
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

  // Chat Operations (Online required for live 1-on-1 messaging)
  const sendChatMessage = (
    recipientId: string, 
    text: string, 
    attachment?: { url: string; name: string; type: 'IMAGE' | 'DOCUMENT' }
  ): { success: boolean; error?: string } => {
    if (!currentUser) return { success: false, error: 'Authentication required.' };
    if (!isOnline) {
      return { success: false, error: 'Internet connection required for live messaging.' };
    }
    const recipient = users.find(u => u.id === recipientId);
    if (!recipient || (!text.trim() && !attachment)) {
      return { success: false, error: 'Recipient or message cannot be empty.' };
    }

    const cleanText = text.trim() || (attachment ? `📎 ${attachment.name}` : '');
    const sortedIds = [currentUser.id, recipientId].sort();
    const chatId = `chat_${sortedIds[0]}_${sortedIds[1]}`;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      chatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      recipientId,
      recipientName: recipient.name,
      text: cleanText,
      timestamp: new Date().toISOString(),
      read: false,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
      attachmentType: attachment?.type
    };

    setChatMessages(prev => [...prev, newMsg]);
    saveChatMessageToFirestore(newMsg).catch(() => {});

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

      saveChatConversationToFirestore(conversation).catch(() => {});
      return [conversation, ...prev.filter(c => c.id !== chatId)];
    });

    addNotification({
      type: 'CHAT_MESSAGE',
      title: `Message from ${currentUser.name}`,
      message: cleanText.length > 60 ? `${cleanText.substring(0, 60)}...` : cleanText,
      targetUserId: recipientId,
      linkTab: 'chat',
      entityId: chatId
    });

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
    const updated: AppSettings = {
      ...appSettings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name
    };
    setAppSettings(updated);
    saveAppSettingsToFirestore(updated).catch(() => {});

    logAudit(
      'APP_SETTINGS_MODIFIED',
      'SETTINGS',
      'System Configuration',
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
        createOrUpdateStaff,
        updateUserProfile,
        resetAllData,
        officeBearers,
        officeBearerHistory,
        appointOfficeBearer,
        vacateOfficeBearer,
        chats,
        chatMessages,
        activeChatUser,
        setActiveChatUser,
        sendChatMessage,
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
