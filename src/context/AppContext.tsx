import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  UserRole, 
  Region, 
  MembershipApplication, 
  PaymentTransaction, 
  Complaint, 
  Announcement, 
  AuditLog, 
  RegionalStats,
  ComplaintStatus,
  AppNotification,
  NotificationType
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_MEMBERSHIP_APPLICATIONS, 
  INITIAL_PAYMENTS, 
  INITIAL_COMPLAINTS, 
  INITIAL_ANNOUNCEMENTS, 
  INITIAL_AUDIT_LOGS, 
  REGIONAL_STATS_DATA,
  INITIAL_NOTIFICATIONS
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
  subscribeToFirestoreCollection,
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
  
  // Role & Session
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  canAccess: (permission: string) => boolean;

  // Workflows
  recommendApplication: (appId: string, recommendation: 'APPROVE' | 'REJECT', remarks: string) => void;
  finalApproveApplication: (appId: string, remarks?: string) => void;
  rejectApplication: (appId: string, remarks: string) => void;
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
    region?: Region | string;
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
    targetRegion?: Region | 'ALL_REGIONS';
    urgency: 'NORMAL' | 'URGENT';
    isPinned: boolean;
  }) => void;
  createOrUpdateStaff: (userData: Partial<User> & { id?: string }) => void;
  updateUserProfile: (profileData: Partial<User>) => void;
  resetAllData: () => void;

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
    targetRegion?: Region | 'ALL_REGIONS';
    linkTab?: string;
    entityId?: string;
  }) => void;

  // Firebase Auth & Cloud Firestore Realtime Sync
  firebaseUser: FirebaseUser | null;
  isFirebaseLive: boolean;
  isCloudSyncing: boolean;
  loginWithGoogleAuth: () => Promise<User>;
  logoutFirebaseAuth: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistence in localStorage
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('kifayat_users');
    if (!saved) return INITIAL_USERS;
    try {
      const parsed: User[] = JSON.parse(saved);
      return parsed.map(u => {
        if (!u.district || !u.stateProvince) {
          const mapped = mapLegacyRegionToHierarchy(u.region);
          return {
            ...mapped,
            ...u,
            country: u.country || mapped.country,
            stateProvince: u.stateProvince || mapped.stateProvince,
            district: u.district || mapped.district,
            tehsil: u.tehsil || mapped.tehsil,
            cityTown: u.cityTown || mapped.cityTown,
            unionCouncil: u.unionCouncil || mapped.unionCouncil
          };
        }
        return u;
      });
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('kifayat_current_uid') || 'usr_super_admin';
  });

  const [applications, setApplications] = useState<MembershipApplication[]>(() => {
    const saved = localStorage.getItem('kifayat_applications');
    if (!saved) return INITIAL_MEMBERSHIP_APPLICATIONS;
    try {
      const parsed: MembershipApplication[] = JSON.parse(saved);
      return parsed.map(a => {
        if (!a.district || !a.stateProvince) {
          const mapped = mapLegacyRegionToHierarchy(a.region);
          return {
            ...mapped,
            ...a,
            country: a.country || mapped.country,
            stateProvince: a.stateProvince || mapped.stateProvince,
            district: a.district || mapped.district,
            tehsil: a.tehsil || mapped.tehsil,
            cityTown: a.cityTown || mapped.cityTown,
            unionCouncil: a.unionCouncil || mapped.unionCouncil
          };
        }
        return a;
      });
    } catch {
      return INITIAL_MEMBERSHIP_APPLICATIONS;
    }
  });

  const [payments, setPayments] = useState<PaymentTransaction[]>(() => {
    const saved = localStorage.getItem('kifayat_payments');
    if (!saved) return INITIAL_PAYMENTS;
    try {
      const parsed: PaymentTransaction[] = JSON.parse(saved);
      return parsed.map(p => {
        if (!p.district || !p.stateProvince) {
          const mapped = mapLegacyRegionToHierarchy(p.userRegion);
          return {
            ...mapped,
            ...p,
            country: p.country || mapped.country,
            stateProvince: p.stateProvince || mapped.stateProvince,
            district: p.district || mapped.district,
            tehsil: p.tehsil || mapped.tehsil,
            cityTown: p.cityTown || mapped.cityTown,
            unionCouncil: p.unionCouncil || mapped.unionCouncil
          };
        }
        return p;
      });
    } catch {
      return INITIAL_PAYMENTS;
    }
  });

  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    const saved = localStorage.getItem('kifayat_complaints');
    if (!saved) return INITIAL_COMPLAINTS;
    try {
      const parsed: Complaint[] = JSON.parse(saved);
      return parsed.map(c => {
        if (!c.district || !c.stateProvince) {
          const mapped = mapLegacyRegionToHierarchy(c.region);
          return {
            ...mapped,
            ...c,
            country: c.country || mapped.country,
            stateProvince: c.stateProvince || mapped.stateProvince,
            district: c.district || mapped.district,
            tehsil: c.tehsil || mapped.tehsil,
            cityTown: c.cityTown || mapped.cityTown,
            unionCouncil: c.unionCouncil || mapped.unionCouncil
          };
        }
        return c;
      });
    } catch {
      return INITIAL_COMPLAINTS;
    }
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('kifayat_announcements');
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('kifayat_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('kifayat_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentTransaction | null>(null);
  const [selectedCardUser, setSelectedCardUser] = useState<User | null>(null);

  // Firebase Auth & Cloud Sync States
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseLive, setIsFirebaseLive] = useState<boolean>(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('kifayat_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('kifayat_current_uid', currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('kifayat_applications', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem('kifayat_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('kifayat_complaints', JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem('kifayat_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('kifayat_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('kifayat_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Phase 1 & 2: Firebase Auth State Listener & Real-Time Cloud Firestore Sync
  useEffect(() => {
    let unsubApps: (() => void) | undefined;
    let unsubPayments: (() => void) | undefined;
    let unsubComplaints: (() => void) | undefined;
    let unsubAnnouncements: (() => void) | undefined;

    const cleanupSubscriptions = () => {
      if (unsubApps) { unsubApps(); unsubApps = undefined; }
      if (unsubPayments) { unsubPayments(); unsubPayments = undefined; }
      if (unsubComplaints) { unsubComplaints(); unsubComplaints = undefined; }
      if (unsubAnnouncements) { unsubAnnouncements(); unsubAnnouncements = undefined; }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        setIsFirebaseLive(true);
        try {
          const verifiedUser = await syncUserWithFirestore(fbUser);
          setUsers(prev => {
            const exists = prev.some(u => u.id === verifiedUser.id || u.email.toLowerCase() === verifiedUser.email.toLowerCase());
            if (exists) {
              return prev.map(u => (u.id === verifiedUser.id || u.email.toLowerCase() === verifiedUser.email.toLowerCase()) ? verifiedUser : u);
            }
            return [verifiedUser, ...prev];
          });
          setCurrentUserId(verifiedUser.id);
        } catch (err) {
          console.warn('Firestore user profile sync error:', err);
        }

        // Attach subscriptions ONLY when user is authenticated
        cleanupSubscriptions();
        const isSuperAdminUser = fbUser.email?.toLowerCase() === ROOT_SUPER_ADMIN_EMAIL.toLowerCase();

        try {
          unsubApps = subscribeToFirestoreCollection<MembershipApplication>(
            'applications',
            (items) => {
              if (items && items.length > 0) setApplications(items);
            },
            isSuperAdminUser ? undefined : { field: 'email', value: fbUser.email || '' }
          );

          unsubPayments = subscribeToFirestoreCollection<PaymentTransaction>(
            'payments',
            (items) => {
              if (items && items.length > 0) setPayments(items);
            },
            isSuperAdminUser ? undefined : { field: 'userId', value: fbUser.uid }
          );

          unsubComplaints = subscribeToFirestoreCollection<Complaint>(
            'complaints',
            (items) => {
              if (items && items.length > 0) setComplaints(items);
            },
            isSuperAdminUser ? undefined : { field: 'userId', value: fbUser.uid }
          );

          unsubAnnouncements = subscribeToFirestoreCollection<Announcement>(
            'announcements',
            (items) => {
              if (items && items.length > 0) setAnnouncements(items);
            }
          );
        } catch (e) {
          console.warn('Firestore subscription initialized in offline/fallback mode');
        }
      } else {
        setFirebaseUser(null);
        setIsFirebaseLive(false);
        cleanupSubscriptions();
      }
    });

    return () => {
      unsubscribeAuth();
      cleanupSubscriptions();
    };
  }, []);

  const currentUser = users.find(u => u.id === currentUserId) || users[0];

  const loginWithGoogleAuth = async (): Promise<User> => {
    setIsCloudSyncing(true);
    try {
      const fbUser = await loginWithGoogle();
      const verifiedUser = await syncUserWithFirestore(fbUser);
      setFirebaseUser(fbUser);
      setIsFirebaseLive(true);

      setUsers(prev => {
        const exists = prev.some(u => u.id === verifiedUser.id || u.email.toLowerCase() === verifiedUser.email.toLowerCase());
        if (exists) {
          return prev.map(u => (u.id === verifiedUser.id || u.email.toLowerCase() === verifiedUser.email.toLowerCase()) ? verifiedUser : u);
        }
        return [verifiedUser, ...prev];
      });
      setCurrentUserId(verifiedUser.id);

      return verifiedUser;
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const logoutFirebaseAuth = async (): Promise<void> => {
    await logoutUser();
    setFirebaseUser(null);
    setIsFirebaseLive(false);
    setCurrentUserId('usr_super_admin');
  };

  // Helper to append audit log
  const logAudit = (
    action: string, 
    category: AuditLog['category'], 
    targetEntity: string, 
    details: string,
    regionOverride?: Region
  ) => {
    const newLog: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action,
      category,
      region: regionOverride || currentUser.region,
      targetEntity,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveAuditLogToFirestore(newLog).catch(() => {});
  };

  // Role-scoped notifications for current user
  const userNotifications = notifications.filter(n => {
    if (n.targetUserId) {
      return n.targetUserId === currentUser.id;
    }
    if (n.targetRole === 'ALL') {
      return true;
    }
    if (n.targetRole === currentUser.role) {
      if (currentUser.role === 'REGIONAL_OFFICER' && n.targetRegion && n.targetRegion !== 'ALL_REGIONS') {
        return n.targetRegion === currentUser.region;
      }
      return true;
    }
    if (currentUser.role === 'SUPER_ADMIN') {
      return n.targetRole === 'SUPER_ADMIN';
    }
    return false;
  });

  const unreadNotificationsCount = userNotifications.filter(n => !n.read).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    const userNotifIds = new Set(userNotifications.map(n => n.id));
    setNotifications(prev => prev.map(n => userNotifIds.has(n.id) ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    const userNotifIds = new Set(userNotifications.map(n => n.id));
    setNotifications(prev => prev.filter(n => !userNotifIds.has(n.id)));
  };

  const addNotification = (data: {
    type: NotificationType;
    title: string;
    message: string;
    targetUserId?: string;
    targetRole?: UserRole | 'ALL';
    targetRegion?: Region | 'ALL_REGIONS';
    linkTab?: string;
    entityId?: string;
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

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUserId(target.id);
      setActiveTab('dashboard');
    }
  };

  const switchRole = (role: UserRole) => {
    // Find representative user for role
    let target = users.find(u => u.role === role);
    if (!target) {
      if (role === 'SUPER_ADMIN') target = users[0];
      else if (role === 'FINANCE_OFFICER') target = users[1];
      else if (role === 'REGIONAL_OFFICER') target = users[2];
      else target = users[4];
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
      case 'MANAGE_ALL_MEMBERS':
        return role === 'SUPER_ADMIN';
      case 'VIEW_MEMBERS':
        return role === 'SUPER_ADMIN' || role === 'FINANCE_OFFICER' || role === 'REGIONAL_OFFICER';
      case 'APPROVE_MEMBERSHIP_FINAL':
        return role === 'SUPER_ADMIN';
      case 'RECOMMEND_MEMBERSHIP':
        return role === 'SUPER_ADMIN' || role === 'REGIONAL_OFFICER';
      case 'MANAGE_FUNDS':
        return role === 'SUPER_ADMIN' || role === 'FINANCE_OFFICER';
      case 'VERIFY_PAYMENTS':
        return role === 'SUPER_ADMIN' || role === 'FINANCE_OFFICER';
      case 'GENERATE_RECEIPTS':
        return role === 'SUPER_ADMIN' || role === 'FINANCE_OFFICER' || role === 'MEMBER';
      case 'MANAGE_ALL_COMPLAINTS':
        return role === 'SUPER_ADMIN';
      case 'MANAGE_REGIONAL_COMPLAINTS':
        return role === 'SUPER_ADMIN' || role === 'REGIONAL_OFFICER';
      case 'PUBLISH_GLOBAL_ANNOUNCEMENTS':
        return role === 'SUPER_ADMIN';
      case 'PUBLISH_REGIONAL_ANNOUNCEMENTS':
        return role === 'SUPER_ADMIN' || role === 'REGIONAL_OFFICER';
      case 'MANAGE_STAFF':
      case 'MANAGE_ROLES':
        return role === 'SUPER_ADMIN';
      case 'VIEW_AUDIT_LOGS':
        return true; // Filtered per role in viewer
      default:
        return false;
    }
  };

  // Workflow 1: Regional Officer Recommends New Membership
  const recommendApplication = (appId: string, recommendation: 'APPROVE' | 'REJECT', remarks: string) => {
    const targetApp = applications.find(a => a.id === appId);
    if (!targetApp) return;

    const updatedApp: MembershipApplication = {
      ...targetApp,
      status: recommendation === 'APPROVE' ? 'RECOMMENDED_BY_REGION' : 'REJECTED',
      regionalOfficerId: currentUser.id,
      regionalOfficerName: currentUser.name,
      regionalRecommendation: recommendation,
      regionalRemarks: remarks,
      regionalReviewedAt: new Date().toISOString()
    };

    setApplications(prev => prev.map(app => app.id === appId ? updatedApp : app));
    saveApplicationToFirestore(updatedApp).catch(() => {});

    logAudit(
      'REGIONAL_RECOMMENDATION_SUBMITTED',
      'MEMBERSHIP',
      `Application ${appId}`,
      `Officer ${currentUser.name} recorded recommendation: ${recommendation}. Remarks: "${remarks}"`,
      currentUser.region
    );

    addNotification({
      type: recommendation === 'APPROVE' ? 'MEMBERSHIP_RECOMMENDED' : 'MEMBERSHIP_REJECTED',
      title: recommendation === 'APPROVE' ? 'Regional Recommendation Awaiting Review' : 'Regional Application Rejected',
      message: `${currentUser.name} (${currentUser.region}) ${recommendation === 'APPROVE' ? 'recommended' : 'declined'} ${targetApp?.applicantName || appId}. Remarks: "${remarks}"`,
      targetRole: 'SUPER_ADMIN',
      linkTab: 'approvals',
      entityId: appId
    });
  };

  // Workflow 2: Super Admin Final Approves Application
  const finalApproveApplication = (appId: string, remarks?: string) => {
    const targetApp = applications.find(a => a.id === appId);
    if (!targetApp) return;

    const newMembershipId = `KC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const updatedApp: MembershipApplication = {
      ...targetApp,
      status: 'ACTIVE',
      superAdminRemarks: remarks || 'Approved after regional verification.',
      superAdminApprovedAt: new Date().toISOString(),
      generatedMembershipId: newMembershipId
    };

    setApplications(prev => prev.map(app => app.id === appId ? updatedApp : app));
    saveApplicationToFirestore(updatedApp).catch(() => {});

    // Create active member user in system
    const newMemberUser: User = {
      id: `usr_${Date.now()}`,
      name: targetApp.applicantName,
      email: targetApp.email,
      phone: targetApp.phone,
      role: 'MEMBER',
      country: targetApp.country || 'Pakistan',
      stateProvince: targetApp.stateProvince || 'Punjab',
      district: targetApp.district || 'Lahore',
      tehsil: targetApp.tehsil || 'Model Town',
      cityTown: targetApp.cityTown || 'Lahore',
      unionCouncil: targetApp.unionCouncil || 'UC-01 Central',
      region: targetApp.region || `${targetApp.district || 'Lahore'} Central`,
      membershipId: newMembershipId,
      membershipStatus: 'ACTIVE',
      avatarUrl: '/src/assets/images/member_avatar_sample_1794225903658.jpg',
      cnic: targetApp.cnic,
      address: targetApp.address,
      joinDate: new Date().toISOString().split('T')[0],
      validUntil: `${new Date().getFullYear() + 3}-12-31`,
      monthlyPledge: 2500,
      annualPledge: 10000,
      totalContributed: 0,
      isStaff: false,
      notes: targetApp.isOldMemberVerification ? `Verified legacy membership: ${targetApp.oldMembershipNo}` : 'Direct onboarding.'
    };

    setUsers(prev => [...prev, newMemberUser]);
    saveUserToFirestore(newMemberUser).catch(() => {});

    logAudit(
      'MEMBERSHIP_FINAL_APPROVED',
      'MEMBERSHIP',
      `Member ${newMemberUser.name} (${newMembershipId})`,
      `Super Admin ${currentUser.name} granted final approval for ${newMemberUser.district}, ${newMemberUser.stateProvince}. Assigned ID: ${newMembershipId}.`,
      targetApp.region
    );

    addNotification({
      type: 'MEMBERSHIP_APPROVED',
      title: 'Membership Approved & Card Issued',
      message: `Welcome ${newMemberUser.name}! Your membership ${newMembershipId} has been approved. Your official digital card is active.`,
      targetUserId: newMemberUser.id,
      targetRole: 'MEMBER',
      linkTab: 'card',
      entityId: newMembershipId
    });

    addNotification({
      type: 'MEMBERSHIP_APPROVED',
      title: 'New Member Enrolled in District',
      message: `Super Admin issued ${newMembershipId} to ${newMemberUser.name} (${targetApp.district || targetApp.region}, ${targetApp.stateProvince || ''}).`,
      targetRole: 'REGIONAL_OFFICER',
      targetRegion: targetApp.region,
      linkTab: 'members',
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
      'MEMBERSHIP_REJECTED',
      'MEMBERSHIP',
      `Application ${appId}`,
      `Rejected with remarks: "${remarks}"`,
      targetApp?.region
    );

    addNotification({
      type: 'MEMBERSHIP_REJECTED',
      title: 'Application Rejected by Super Admin',
      message: `Application for ${targetApp?.applicantName || appId} was rejected. Reason: "${remarks}"`,
      targetRole: 'REGIONAL_OFFICER',
      targetRegion: targetApp?.region,
      linkTab: 'approvals',
      entityId: appId
    });
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
    region?: Region | string;
    address: string;
    isOldMember: boolean;
    oldMembershipNo?: string;
  }) => {
    const fallbackLocation = mapLegacyRegionToHierarchy(data.region as string);
    const country = data.country || fallbackLocation.country;
    const stateProvince = data.stateProvince || fallbackLocation.stateProvince;
    const district = data.district || fallbackLocation.district;
    const tehsil = data.tehsil || fallbackLocation.tehsil;
    const cityTown = data.cityTown || fallbackLocation.cityTown;
    const unionCouncil = data.unionCouncil || fallbackLocation.unionCouncil;
    const region = data.region || `${district} Central`;

    const newApp: MembershipApplication = {
      id: `app_${Date.now()}`,
      applicantName: data.applicantName,
      email: data.email,
      phone: data.phone,
      cnic: data.cnic,
      country,
      stateProvince,
      district,
      tehsil,
      cityTown,
      unionCouncil,
      region,
      address: data.address,
      submittedAt: new Date().toISOString(),
      status: 'PENDING_REGIONAL_REVIEW',
      isOldMemberVerification: data.isOldMember,
      oldMembershipNo: data.oldMembershipNo
    };

    setApplications(prev => [newApp, ...prev]);
    saveApplicationToFirestore(newApp).catch(() => {});

    logAudit(
      'MEMBERSHIP_APPLICATION_SUBMITTED',
      'MEMBERSHIP',
      `Applicant ${data.applicantName}`,
      `New membership application submitted for ${district}, ${stateProvince}.${data.isOldMember ? ' Claimed old ID: ' + data.oldMembershipNo : ''}`,
      region
    );

    addNotification({
      type: 'MEMBERSHIP_PENDING_REGIONAL',
      title: 'New Membership Application',
      message: `${data.applicantName} submitted application in ${district}, ${stateProvince}. Review and recommendation requested.`,
      targetRole: 'REGIONAL_OFFICER',
      targetRegion: region,
      linkTab: 'approvals',
      entityId: newApp.id
    });

    addNotification({
      type: 'MEMBERSHIP_PENDING_REGIONAL',
      title: 'New Applicant Pipeline',
      message: `${data.applicantName} registered under ${district}, ${stateProvince}.`,
      targetRole: 'SUPER_ADMIN',
      linkTab: 'approvals',
      entityId: newApp.id
    });
  };

  // Payment Workflow: Member submits payment -> Pending verification
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
      country: currentUser.country || 'Pakistan',
      stateProvince: currentUser.stateProvince || 'Punjab',
      district: currentUser.district || 'Lahore',
      tehsil: currentUser.tehsil || 'Model Town',
      cityTown: currentUser.cityTown || 'Lahore',
      unionCouncil: currentUser.unionCouncil || 'UC-01 Central',
      userRegion: currentUser.region || `${currentUser.district || 'Lahore'} Central`,
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
      'PAYMENT_SUBMITTED',
      'FINANCIAL',
      `Transaction ${newTx.receiptNumber}`,
      `Member ${currentUser.name} (${currentUser.district || currentUser.region}) submitted PKR ${data.amount.toLocaleString()} via ${data.paymentMethod}. Ref: ${data.referenceNumber}`,
      currentUser.region
    );

    addNotification({
      type: 'PAYMENT_PENDING',
      title: 'Payment Awaiting Verification',
      message: `${currentUser.name} submitted PKR ${data.amount.toLocaleString()} for ${data.fundCategory} (${data.paymentMethod}). Ref: ${data.referenceNumber}`,
      targetRole: 'FINANCE_OFFICER',
      linkTab: 'funds',
      entityId: newTx.id
    });

    if (data.amount >= 15000) {
      addNotification({
        type: 'PAYMENT_PENDING',
        title: 'High-Value Payment Alert',
        message: `${currentUser.name} submitted PKR ${data.amount.toLocaleString()} requiring financial verification.`,
        targetRole: 'SUPER_ADMIN',
        linkTab: 'funds',
        entityId: newTx.id
      });
    }
  };

  // Payment Workflow: Finance Officer verifies payment
  const verifyPayment = (txId: string, approved: boolean, reason?: string) => {
    const targetTx = payments.find(p => p.id === txId);
    if (!targetTx) return;

    const updatedTx: PaymentTransaction = {
      ...targetTx,
      status: approved ? 'VERIFIED' : 'REJECTED',
      verifiedBy: `${currentUser.name} (${currentUser.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Finance Officer'})`,
      verifiedAt: new Date().toISOString(),
      rejectionReason: approved ? undefined : reason
    };

    setPayments(prev => prev.map(p => p.id === txId ? updatedTx : p));
    savePaymentToFirestore(updatedTx).catch(() => {});

    if (approved) {
      // Update member totalContributed
      setUsers(prev => prev.map(u => {
        if (u.id === targetTx.userId) {
          const updatedUser = {
            ...u,
            totalContributed: u.totalContributed + targetTx.amount
          };
          saveUserToFirestore(updatedUser).catch(() => {});
          return updatedUser;
        }
        return u;
      }));
    }

    logAudit(
      approved ? 'PAYMENT_VERIFIED' : 'PAYMENT_REJECTED',
      'FINANCIAL',
      `Transaction ${targetTx.receiptNumber}`,
      approved 
        ? `Verified PKR ${targetTx.amount.toLocaleString()} for ${targetTx.userName}. Official receipt generated.`
        : `Payment rejected. Reason: ${reason || 'Invalid gateway reference'}`,
      targetTx.userRegion
    );

    addNotification({
      type: approved ? 'PAYMENT_VERIFIED' : 'PAYMENT_REJECTED',
      title: approved ? 'Payment Verified & Receipt Ready' : 'Payment Verification Declined',
      message: approved
        ? `Your payment of PKR ${targetTx.amount.toLocaleString()} has been verified. Official receipt ${targetTx.receiptNumber} is now available.`
        : `Your payment of PKR ${targetTx.amount.toLocaleString()} (Ref: ${targetTx.referenceNumber}) was declined: ${reason || 'Transaction verification unsuccessful'}.`,
      targetUserId: targetTx.userId,
      targetRole: 'MEMBER',
      linkTab: 'funds',
      entityId: targetTx.id
    });

    if (approved) {
      addNotification({
        type: 'PAYMENT_VERIFIED',
        title: 'Payment Verification Completed',
        message: `PKR ${targetTx.amount.toLocaleString()} for ${targetTx.userName} verified by ${currentUser.name}.`,
        targetRole: 'SUPER_ADMIN',
        linkTab: 'funds',
        entityId: targetTx.id
      });
    }
  };

  // Complaints
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
      country: currentUser.country || 'Pakistan',
      stateProvince: currentUser.stateProvince || 'Punjab',
      district: currentUser.district || 'Lahore',
      tehsil: currentUser.tehsil || 'Model Town',
      cityTown: currentUser.cityTown || 'Lahore',
      unionCouncil: currentUser.unionCouncil || 'UC-01 Central',
      region: currentUser.region,
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
      'COMPLAINT_FILED',
      'REGIONAL',
      `Ticket ${newComplaint.ticketNumber}`,
      `${currentUser.name} (${currentUser.district || currentUser.region}) filed complaint under category ${data.category}: "${data.subject}"`,
      currentUser.region
    );
  };

  const updateComplaintStatus = (complaintId: string, status: ComplaintStatus, responseNote?: string) => {
    const target = complaints.find(c => c.id === complaintId);
    if (!target) return;

    const updatedComplaint: Complaint = {
      ...target,
      status,
      responseNote: responseNote || target.responseNote,
      assignedOfficerName: `${currentUser.name} (${currentUser.district || currentUser.region}, ${currentUser.stateProvince || ''})`,
      resolvedAt: status === 'RESOLVED' ? new Date().toISOString() : target.resolvedAt
    };

    setComplaints(prev => prev.map(c => c.id === complaintId ? updatedComplaint : c));
    saveComplaintToFirestore(updatedComplaint).catch(() => {});

    logAudit(
      'COMPLAINT_STATUS_UPDATED',
      'REGIONAL',
      `Ticket ${target.ticketNumber}`,
      `Status changed to ${status} by ${currentUser.name}. Note: "${responseNote || 'Updated'}"`,
      target.region
    );

    addNotification({
      type: 'COMPLAINT_UPDATE',
      title: `Grievance Ticket ${status}`,
      message: `Ticket ${target.ticketNumber} regarding "${target.subject}" was marked as ${status}.${responseNote ? ' Note: ' + responseNote : ''}`,
      targetUserId: target.userId,
      targetRole: 'MEMBER',
      linkTab: 'complaints',
      entityId: target.id
    });
  };

  // Announcements
  const publishAnnouncement = (data: {
    title: string;
    content: string;
    targetScope?: 'ALL' | 'PROVINCE' | 'DISTRICT';
    targetStateProvince?: string;
    targetDistrict?: string;
    targetRegion?: Region | 'ALL_REGIONS';
    urgency: 'NORMAL' | 'URGENT';
    isPinned: boolean;
  }) => {
    const targetReg = data.targetRegion || (data.targetDistrict ? `${data.targetDistrict} Central` : 'ALL_REGIONS');
    const newAnnouncement: Announcement = {
      id: `ann_${Date.now()}`,
      title: data.title,
      content: data.content,
      targetScope: data.targetScope || 'ALL',
      targetStateProvince: data.targetStateProvince,
      targetDistrict: data.targetDistrict,
      targetRegion: targetReg,
      publishedBy: `${currentUser.name} (${currentUser.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Administrative Officer'})`,
      publisherRole: currentUser.role,
      publishedAt: new Date().toISOString(),
      isPinned: data.isPinned,
      urgency: data.urgency
    };

    setAnnouncements(prev => [newAnnouncement, ...prev]);
    saveAnnouncementToFirestore(newAnnouncement).catch(() => {});

    logAudit(
      'ANNOUNCEMENT_PUBLISHED',
      'REGIONAL',
      `Announcement: ${data.title}`,
      `Published to scope: ${data.targetDistrict || data.targetStateProvince || 'All Jurisdictions'}. Urgency: ${data.urgency}`,
      data.targetRegion === 'ALL_REGIONS' ? undefined : data.targetRegion
    );

    addNotification({
      type: 'ANNOUNCEMENT_NEW',
      title: data.urgency === 'URGENT' ? `[URGENT] ${data.title}` : data.title,
      message: data.content.slice(0, 120) + (data.content.length > 120 ? '...' : ''),
      targetRole: 'ALL',
      targetRegion: data.targetRegion,
      linkTab: 'announcements',
      entityId: newAnnouncement.id
    });
  };

  // Staff & Role Management (Super Admin Exclusive)
  const createOrUpdateStaff = (userData: Partial<User> & { id?: string }) => {
    if (userData.id) {
      // Update
      const oldUser = users.find(u => u.id === userData.id);
      const oldRole = oldUser?.role;
      const newRole = userData.role || oldRole;

      const updatedUser = {
        ...oldUser,
        ...userData,
        isStaff: (newRole !== 'MEMBER')
      } as User;

      setUsers(prev => prev.map(u => u.id === userData.id ? updatedUser : u));
      saveUserToFirestore(updatedUser).catch(() => {});

      logAudit(
        'STAFF_ROLE_MODIFIED',
        'ROLE_MANAGEMENT',
        `User ${oldUser?.name}`,
        `Super Admin ${currentUser.name} updated staff profile. Old Role: ${oldRole} -> New Role: ${newRole}. District: ${userData.district || oldUser?.district}, Province: ${userData.stateProvince || oldUser?.stateProvince}`,
        userData.region || oldUser?.region
      );
    } else {
      // Create new staff
      const fallbackLoc = mapLegacyRegionToHierarchy(userData.region);
      const newStaffId = `usr_staff_${Date.now()}`;
      const newStaff: User = {
        id: newStaffId,
        name: userData.name || 'New Staff Member',
        email: userData.email || 'staff@kifayatconnect.org',
        phone: userData.phone || '+92 300 0000000',
        role: userData.role || 'REGIONAL_OFFICER',
        country: userData.country || fallbackLoc.country,
        stateProvince: userData.stateProvince || fallbackLoc.stateProvince,
        district: userData.district || fallbackLoc.district,
        tehsil: userData.tehsil || fallbackLoc.tehsil,
        cityTown: userData.cityTown || fallbackLoc.cityTown,
        unionCouncil: userData.unionCouncil || fallbackLoc.unionCouncil,
        region: userData.region || `${userData.district || fallbackLoc.district} Central`,
        membershipId: `KC-STF-${Math.floor(100 + Math.random() * 900)}`,
        membershipStatus: 'ACTIVE',
        cnic: userData.cnic || '35201-0000000-1',
        address: userData.address || 'Regional Secretariat',
        joinDate: new Date().toISOString().split('T')[0],
        validUntil: '2028-12-31',
        monthlyPledge: 3000,
        annualPledge: 15000,
        totalContributed: 0,
        isStaff: true,
        notes: userData.notes || 'Created by Super Admin'
      };

      setUsers(prev => [...prev, newStaff]);
      saveUserToFirestore(newStaff).catch(() => {});

      logAudit(
        'STAFF_ACCOUNT_CREATED',
        'ROLE_MANAGEMENT',
        `Staff ${newStaff.name} (${newStaff.role})`,
        `Super Admin created staff credential for District: ${newStaff.district}, Province: ${newStaff.stateProvince}`,
        newStaff.region
      );
    }
  };

  const updateUserProfile = (profileData: Partial<User>) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== currentUser.id) return u;
      return { ...u, ...profileData };
    }));
  };

  const resetAllData = () => {
    localStorage.clear();
    setUsers(INITIAL_USERS);
    setCurrentUserId('usr_super_admin');
    setApplications(INITIAL_MEMBERSHIP_APPLICATIONS);
    setPayments(INITIAL_PAYMENTS);
    setComplaints(INITIAL_COMPLAINTS);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setActiveTab('dashboard');
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
        regionalStats: REGIONAL_STATS_DATA,
        activeTab,
        language,
        selectedReceipt,
        selectedCardUser,
        setActiveTab,
        setLanguage,
        toggleLanguage,
        setSelectedReceipt,
        setSelectedCardUser,
        switchUser,
        switchRole,
        canAccess,
        recommendApplication,
        finalApproveApplication,
        rejectApplication,
        registerMember,
        submitPayment,
        verifyPayment,
        submitComplaint,
        updateComplaintStatus,
        publishAnnouncement,
        createOrUpdateStaff,
        updateUserProfile,
        resetAllData,
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
        logoutFirebaseAuth
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
