import React, { createContext, useContext, useState, useEffect } from 'react';
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
  FirebaseUser,
  ROOT_SUPER_ADMIN_EMAIL
} from '../services/firebase';

interface AppContextType {
  currentUser: User;
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
  
  // Navigation & UI
  setActiveTab: (tab: string) => void;
  setLanguage: (lang: 'en' | 'ur') => void;
  toggleLanguage: () => void;
  setSelectedReceipt: (tx: PaymentTransaction | null) => void;
  setSelectedCardUser: (user: User | null) => void;
  
  // Profile Viewer Modal
  inspectedUserProfile: User | null;
  setInspectedUserProfile: (user: User | null) => void;

  // Role & Session
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
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
  sendChatMessage: (recipientId: string, text: string, attachment?: { url: string; name: string; type: 'IMAGE' | 'DOCUMENT' }) => void;

  // App Updates Module
  appUpdates: AppUpdate[];
  latestPublishedUpdate: AppUpdate | null;
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
  requestOTP: (email: string) => { success: boolean; message: string; cooldownSeconds?: number; previewCode?: string };
  verifyOTP: (email: string, code: string) => { success: boolean; message: string; isSuperAdmin?: boolean };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistence in localStorage
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('kifayat_users_v2');
    if (!saved) return INITIAL_USERS;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('kifayat_current_user_v2') || INITIAL_USERS[0].id;
  });

  const [applications, setApplications] = useState<MembershipApplication[]>(() => {
    const saved = localStorage.getItem('kifayat_applications_v2');
    if (!saved) return INITIAL_MEMBERSHIP_APPLICATIONS;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_MEMBERSHIP_APPLICATIONS;
    }
  });

  const [payments, setPayments] = useState<PaymentTransaction[]>(() => {
    const saved = localStorage.getItem('kifayat_payments_v2');
    if (!saved) return INITIAL_PAYMENTS;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_PAYMENTS;
    }
  });

  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    const saved = localStorage.getItem('kifayat_complaints_v2');
    if (!saved) return INITIAL_COMPLAINTS;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_COMPLAINTS;
    }
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('kifayat_announcements_v2');
    if (!saved) return INITIAL_ANNOUNCEMENTS;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_ANNOUNCEMENTS;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('kifayat_audit_logs_v2');
    if (!saved) return INITIAL_AUDIT_LOGS;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('kifayat_notifications_v2');
    if (!saved) return INITIAL_NOTIFICATIONS;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // Office-Bearers
  const [officeBearers, setOfficeBearers] = useState<OfficeBearer[]>(() => {
    const saved = localStorage.getItem('kifayat_office_bearers');
    if (!saved) return INITIAL_OFFICE_BEARERS;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_OFFICE_BEARERS;
    }
  });

  const [officeBearerHistory, setOfficeBearerHistory] = useState<OfficeBearerHistory[]>(() => {
    const saved = localStorage.getItem('kifayat_office_bearer_history');
    if (!saved) return INITIAL_OFFICE_BEARER_HISTORY;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_OFFICE_BEARER_HISTORY;
    }
  });

  // App Updates
  const [appUpdates, setAppUpdates] = useState<AppUpdate[]>(() => {
    const saved = localStorage.getItem('kifayat_app_updates');
    if (!saved) return INITIAL_APP_UPDATES;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_APP_UPDATES;
    }
  });

  const [acknowledgedUpdateVersion, setAcknowledgedUpdateVersion] = useState<string | null>(() => {
    return localStorage.getItem('kifayat_ack_update_version');
  });

  // App Settings
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('kifayat_app_settings');
    if (!saved) return INITIAL_APP_SETTINGS;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_APP_SETTINGS;
    }
  });

  // Chats
  const [chats, setChats] = useState<ChatConversation[]>(() => {
    const saved = localStorage.getItem('kifayat_chats');
    if (!saved) return INITIAL_CHATS;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_CHATS;
    }
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('kifayat_chat_messages');
    if (!saved) return INITIAL_CHAT_MESSAGES;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_CHAT_MESSAGES;
    }
  });

  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  const [inspectedUserProfile, setInspectedUserProfile] = useState<User | null>(null);

  const [regionalStats] = useState<RegionalStats[]>(REGIONAL_STATS_DATA);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentTransaction | null>(null);
  const [selectedCardUser, setSelectedCardUser] = useState<User | null>(null);

  // Firebase Live Sync States
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseLive, setIsFirebaseLive] = useState<boolean>(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('kifayat_users_v2', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('kifayat_current_user_v2', currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('kifayat_applications_v2', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem('kifayat_payments_v2', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('kifayat_complaints_v2', JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem('kifayat_announcements_v2', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('kifayat_audit_logs_v2', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('kifayat_notifications_v2', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('kifayat_office_bearers', JSON.stringify(officeBearers));
  }, [officeBearers]);

  useEffect(() => {
    localStorage.setItem('kifayat_office_bearer_history', JSON.stringify(officeBearerHistory));
  }, [officeBearerHistory]);

  useEffect(() => {
    localStorage.setItem('kifayat_app_updates', JSON.stringify(appUpdates));
  }, [appUpdates]);

  useEffect(() => {
    localStorage.setItem('kifayat_app_settings', JSON.stringify(appSettings));
  }, [appSettings]);

  useEffect(() => {
    localStorage.setItem('kifayat_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('kifayat_chat_messages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  if (acknowledgedUpdateVersion) {
    localStorage.setItem('kifayat_ack_update_version', acknowledgedUpdateVersion);
  }

  // Active current user resolution
  const currentUser = users.find(u => u.id === currentUserId) || users[0];

  // Derived: Latest published update
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

          // Subscriptions to live collections
          const unsubApps = subscribeToFirestoreCollection<MembershipApplication>('applications', (remote) => {
            if (remote && remote.length > 0) setApplications(remote);
          });
          const unsubPayments = subscribeToFirestoreCollection<PaymentTransaction>('payments', (remote) => {
            if (remote && remote.length > 0) setPayments(remote);
          });
          const unsubComplaints = subscribeToFirestoreCollection<Complaint>('complaints', (remote) => {
            if (remote && remote.length > 0) setComplaints(remote);
          });
          const unsubAnnounce = subscribeToFirestoreCollection<Announcement>('announcements', (remote) => {
            if (remote && remote.length > 0) setAnnouncements(remote);
          });
          const unsubUpdates = subscribeToFirestoreCollection<AppUpdate>('app_updates', (remote) => {
            if (remote && remote.length > 0) setAppUpdates(remote);
          });
          const unsubOB = subscribeToFirestoreCollection<OfficeBearer>('office_bearers', (remote) => {
            if (remote && remote.length > 0) setOfficeBearers(remote);
          });

          unsubs = [unsubApps, unsubPayments, unsubComplaints, unsubAnnounce, unsubUpdates, unsubOB];
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
    return synced;
  };

  const logoutFirebaseAuth = async (): Promise<void> => {
    await logoutUser();
    setFirebaseUser(null);
    setIsFirebaseLive(false);
    setCurrentUserId(INITIAL_USERS[0].id);
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
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action,
      category,
      country: 'Pakistan',
      stateProvince: stateProvince || currentUser.stateProvince,
      district: district || currentUser.district,
      targetEntity,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveAuditLogToFirestore(newLog).catch(() => {});
  };

  // Notification methods
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

  // Filtered notifications for active user
  const userNotifications = notifications.filter(n => {
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
  });

  const unreadNotificationsCount = userNotifications.filter(n => !n.read).length;

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUserId(target.id);
      setActiveTab('dashboard');
    }
  };

  const switchRole = (role: UserRole) => {
    let target = users.find(u => u.role === role);
    if (!target) {
      if (role === 'SUPER_ADMIN') target = users[0];
      else if (role === 'FINANCE_OFFICER') target = users[1];
      else if (role === 'ADMIN') target = users.find(u => u.role === 'ADMIN') || users[2];
      else if (role === 'CO_ADMIN') target = users.find(u => u.role === 'CO_ADMIN') || users[3];
      else target = users.find(u => u.role === 'MEMBER') || users[5];
    }
    if (target) {
      setCurrentUserId(target.id);
      setActiveTab('dashboard');
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'ur' : 'en'));
  };

  // Permission Matrix Enforcement
  const canAccess = (permission: string): boolean => {
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
        return role === 'SUPER_ADMIN' || role === 'FINANCE_OFFICER';

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
    const targetApp = applications.find(a => a.id === appId);
    if (!targetApp) return;

    const updatedApp: MembershipApplication = {
      ...targetApp,
      status: recommendation === 'APPROVE' ? 'RECOMMENDED_BY_DISTRICT' : 'REJECTED',
      districtAdminId: currentUser.id,
      districtAdminName: currentUser.name,
      districtRecommendation: recommendation,
      districtRemarks: remarks,
      districtReviewedAt: new Date().toISOString(),
      // Legacy compatibility
      regionalOfficerId: currentUser.id,
      regionalOfficerName: currentUser.name,
      regionalRecommendation: recommendation,
      regionalRemarks: remarks
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
    const targetApp = applications.find(a => a.id === appId);
    if (!targetApp) return;

    const newMembershipId = `KC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const updatedApp: MembershipApplication = {
      ...targetApp,
      status: 'ACTIVE',
      superAdminRemarks: remarks || 'Final approval granted under Kifayat Connect bylaws.',
      superAdminApprovedAt: new Date().toISOString(),
      generatedMembershipId: newMembershipId
    };

    setApplications(prev => prev.map(app => app.id === appId ? updatedApp : app));
    saveApplicationToFirestore(updatedApp).catch(() => {});

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
      cnic: targetApp.cnic,
      address: targetApp.address,
      joinDate: new Date().toISOString().split('T')[0],
      validUntil: '2029-12-31',
      monthlyPledge: 2500,
      annualPledge: 10000,
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
    const targetApp = applications.find(a => a.id === appId);
    if (!targetApp) return { success: false, error: 'Application not found' };

    // Security check: validate size <= 5MB (5 * 1024 * 1024 bytes)
    if (docData.fileSize > 5 * 1024 * 1024) {
      return { success: false, error: 'File size exceeds 5MB limit.' };
    }

    // Security check: mime type
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
      tehsil: data.tehsil || loc.tehsil,
      cityTown: data.cityTown || loc.cityTown,
      unionCouncil: data.unionCouncil || loc.unionCouncil,
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
  }) => {
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
      proofNote: data.proofNote
    };

    setPayments(prev => [newTx, ...prev]);
    savePaymentToFirestore(newTx).catch(() => {});

    logAudit(
      'PAYMENT_SUBMITTED_FOR_VERIFICATION',
      'FINANCIAL',
      newTx.receiptNumber,
      `Member ${currentUser.name} submitted payment voucher of PKR ${data.amount.toLocaleString()} via ${data.paymentMethod}. Ref: ${data.referenceNumber}`,
      currentUser.district,
      currentUser.stateProvince
    );

    addNotification({
      type: 'PAYMENT_PENDING',
      title: 'New Contribution Awaiting Audit',
      message: `${currentUser.name} submitted PKR ${data.amount.toLocaleString()} for verification.`,
      targetRole: 'FINANCE_OFFICER',
      linkTab: 'funds',
      entityId: newTx.id
    });
  };

  const verifyPayment = (txId: string, approved: boolean, reason?: string) => {
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

    if (approved) {
      setUsers(prev => prev.map(u => {
        if (u.id === tx.userId) {
          return {
            ...u,
            totalContributed: (u.totalContributed || 0) + tx.amount
          };
        }
        return u;
      }));
    }

    logAudit(
      approved ? 'PAYMENT_RECEIPT_VERIFIED' : 'PAYMENT_RECEIPT_REJECTED',
      'FINANCIAL',
      tx.receiptNumber,
      `${currentUser.name} verified receipt ${tx.receiptNumber} (${approved ? 'APPROVED' : 'REJECTED'}). Amount: PKR ${tx.amount.toLocaleString()}`,
      tx.district,
      tx.stateProvince
    );

    addNotification({
      type: approved ? 'PAYMENT_VERIFIED' : 'PAYMENT_REJECTED',
      title: approved ? 'Payment Verified & Official Receipt Issued' : 'Payment Verification Declined',
      message: approved 
        ? `Your payment of PKR ${tx.amount.toLocaleString()} is verified. Receipt ${tx.receiptNumber} is now available.`
        : `Your payment was not verified. Reason: ${reason || 'Reference mismatch'}`,
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

  const publishAnnouncement = (data: {
    title: string;
    content: string;
    targetScope?: 'ALL' | 'PROVINCE' | 'DISTRICT';
    targetStateProvince?: string;
    targetDistrict?: string;
    urgency: 'NORMAL' | 'URGENT';
    isPinned: boolean;
  }) => {
    const newAnnounce: Announcement = {
      id: `ann_${Date.now()}`,
      title: data.title,
      content: data.content,
      targetScope: data.targetScope || 'ALL',
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

    logAudit(
      'BROADCAST_ANNOUNCEMENT_PUBLISHED',
      'SETTINGS',
      newAnnounce.title,
      `Published by ${currentUser.name} (${currentUser.role}). Target: ${data.targetScope || 'ALL'}`,
      data.targetDistrict,
      data.targetStateProvince
    );
  };

  // Staff & Admin Management with Quotas (10 Admins/District, 3 Co-Admins/State)
  const createOrUpdateStaff = (userData: Partial<User> & { id?: string }): { success: boolean; error?: string } => {
    const targetDistrict = userData.district || currentUser.district;
    const targetState = userData.stateProvince || currentUser.stateProvince;
    const requestedRole = userData.role || 'MEMBER';

    // Enforce 10 Admins per District quota
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

    // Enforce 3 Co-Admins per State quota
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
      // Update existing
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
      // Create new
      const newUser: User = {
        id: `usr_${Date.now()}`,
        name: userData.name || 'New Appointee',
        email: userData.email || '',
        phone: userData.phone || '+92 300 0000000',
        role: requestedRole,
        country: userData.country || 'Pakistan',
        stateProvince: targetState || 'Punjab',
        district: targetDistrict || 'Lahore',
        tehsil: userData.tehsil || 'Central',
        cityTown: userData.cityTown || targetDistrict || 'Lahore',
        unionCouncil: userData.unionCouncil || 'UC-01',
        membershipId: requestedRole === 'ADMIN' 
          ? `KC-ADM-${(targetDistrict || 'DIST').substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`
          : requestedRole === 'CO_ADMIN'
          ? `KC-COA-${(targetState || 'STATE').substring(0, 2).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`
          : `KC-STAFF-${Math.floor(100 + Math.random() * 900)}`,
        membershipStatus: 'ACTIVE',
        cnic: userData.cnic || '00000-0000000-0',
        address: userData.address || `${targetDistrict}, ${targetState}`,
        joinDate: new Date().toISOString().split('T')[0],
        validUntil: '2028-12-31',
        monthlyPledge: 3000,
        annualPledge: 15000,
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
    const updated: User = {
      ...currentUser,
      ...profileData
    };
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
    saveUserToFirestore(updated).catch(() => {});
  };

  // Office-Bearers Operations (10 Titles, 13 Seats)
  const appointOfficeBearer = (seatId: string, userId: string, notes?: string): { success: boolean; error?: string } => {
    if (currentUser.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Only Super Admin can appoint organizational office-bearers.' };
    }
    const targetSeat = officeBearers.find(ob => ob.seatId === seatId);
    const candidate = users.find(u => u.id === userId);
    if (!targetSeat || !candidate) {
      return { success: false, error: 'Selected seat or candidate not found.' };
    }

    // Terminate previous incumbent in history if seat was active
    if (targetSeat.status === 'ACTIVE' && targetSeat.assignedUserId) {
      const hist: OfficeBearerHistory = {
        id: `obh_${Date.now()}`,
        officeBearerId: targetSeat.id,
        title: targetSeat.title,
        seatLabel: targetSeat.seatLabel,
        userId: targetSeat.assignedUserId,
        userName: targetSeat.assignedUserName || 'Previous Incumbent',
        startDate: targetSeat.appointedDate || '2023-01-01',
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

    // Update user profile with assigned office title
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
    if (currentUser.role !== 'SUPER_ADMIN') {
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
        startDate: targetSeat.appointedDate || '2023-01-01',
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

  // Chat Operations
  const sendChatMessage = (
    recipientId: string, 
    text: string, 
    attachment?: { url: string; name: string; type: 'IMAGE' | 'DOCUMENT' }
  ) => {
    const recipient = users.find(u => u.id === recipientId);
    if (!recipient || !text.trim()) return;

    // Deterministic Chat ID for 1-to-1 conversation
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
      text: text.trim(),
      timestamp: new Date().toISOString(),
      read: false,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
      attachmentType: attachment?.type
    };

    setChatMessages(prev => [...prev, newMsg]);
    saveChatMessageToFirestore(newMsg).catch(() => {});

    // Update or create conversation summary
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
        lastMessage: text.trim(),
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
      message: text.length > 60 ? `${text.substring(0, 60)}...` : text,
      targetUserId: recipientId,
      linkTab: 'chat',
      entityId: chatId
    });
  };

  // App Updates Management
  const publishAppUpdate = (updateData: Omit<AppUpdate, 'id'>) => {
    if (currentUser.role !== 'SUPER_ADMIN') return;

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

    // Automatic broadcast notification to all user categories:
    addNotification({
      type: 'APP_UPDATE_AVAILABLE',
      title: 'Kifayat Connect Mobile App Update Available',
      message: 'Kifayat Connect ka naya update aa chuka hai. Behtar performance aur naye features ke liye app update karein.',
      targetRole: 'ALL',
      actionUrl: newUpdate.apkDownloadUrl,
      linkTab: 'dashboard'
    });
  };

  const toggleUpdatePublish = (updateId: string) => {
    if (currentUser.role !== 'SUPER_ADMIN') return;
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
    if (currentUser.role !== 'SUPER_ADMIN') return;
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
    localStorage.removeItem('kifayat_users_v2');
    localStorage.removeItem('kifayat_current_user_v2');
    localStorage.removeItem('kifayat_applications_v2');
    localStorage.removeItem('kifayat_payments_v2');
    localStorage.removeItem('kifayat_complaints_v2');
    localStorage.removeItem('kifayat_announcements_v2');
    localStorage.removeItem('kifayat_audit_logs_v2');
    localStorage.removeItem('kifayat_notifications_v2');
    localStorage.removeItem('kifayat_office_bearers');
    localStorage.removeItem('kifayat_office_bearer_history');
    localStorage.removeItem('kifayat_app_updates');
    localStorage.removeItem('kifayat_app_settings');
    localStorage.removeItem('kifayat_chats');
    localStorage.removeItem('kifayat_chat_messages');
    localStorage.removeItem('kifayat_ack_update_version');

    setUsers(INITIAL_USERS);
    setCurrentUserId(INITIAL_USERS[0].id);
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
        setActiveTab,
        setLanguage,
        toggleLanguage,
        setSelectedReceipt,
        setSelectedCardUser,
        inspectedUserProfile,
        setInspectedUserProfile,
        switchUser,
        switchRole,
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
        requestOTP: requestEmailOTP,
        verifyOTP: verifyEmailOTP
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
