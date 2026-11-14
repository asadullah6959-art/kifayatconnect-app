import { 
  User, 
  MembershipApplication, 
  PaymentTransaction, 
  Complaint, 
  Announcement, 
  AuditLog, 
  RegionalStats,
  AppNotification,
  OfficeBearer,
  OfficeBearerHistory,
  ChatConversation,
  ChatMessage,
  AppUpdate,
  AppSettings
} from '../types';

// Complete zero-state initial collections (no dummy/placeholder records)
export const INITIAL_USERS: User[] = [];

export const INITIAL_MEMBERSHIP_APPLICATIONS: MembershipApplication[] = [];

export const INITIAL_PAYMENTS: PaymentTransaction[] = [];

export const INITIAL_COMPLAINTS: Complaint[] = [];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const REGIONAL_STATS_DATA: RegionalStats[] = [];

// Organizational Office-Bearers Seat Blueprint (all seats initialize cleanly as VACANT)
export const INITIAL_OFFICE_BEARERS: OfficeBearer[] = [
  {
    id: 'ob_01',
    seatId: 'pres-1',
    title: 'President',
    seatLabel: 'President (Supreme Seat)',
    seatIndex: 1,
    jurisdiction: 'NATIONAL',
    termYears: 3,
    status: 'VACANT',
    appointedBy: 'Central Executive Council'
  },
  {
    id: 'ob_02',
    seatId: 'svp-1',
    title: 'Senior Vice President',
    seatLabel: 'Senior Vice President (Seat 1)',
    seatIndex: 1,
    jurisdiction: 'NATIONAL',
    termYears: 3,
    status: 'VACANT',
    appointedBy: 'Super Admin'
  },
  {
    id: 'ob_03',
    seatId: 'vp-1',
    title: 'Vice President',
    seatLabel: 'Vice President (Seat 1 of 4 — Punjab Jurisdiction)',
    seatIndex: 1,
    jurisdiction: 'STATE',
    stateProvince: 'Punjab',
    termYears: 2,
    status: 'VACANT',
    appointedBy: 'Super Admin'
  },
  {
    id: 'ob_04',
    seatId: 'vp-2',
    title: 'Vice President',
    seatLabel: 'Vice President (Seat 2 of 4 — Sindh Jurisdiction)',
    seatIndex: 2,
    jurisdiction: 'STATE',
    stateProvince: 'Sindh',
    termYears: 2,
    status: 'VACANT',
    appointedBy: 'Super Admin'
  },
  {
    id: 'ob_05',
    seatId: 'vp-3',
    title: 'Vice President',
    seatLabel: 'Vice President (Seat 3 of 4 — KP & North)',
    seatIndex: 3,
    status: 'VACANT',
    jurisdiction: 'STATE',
    stateProvince: 'Khyber Pakhtunkhwa',
    termYears: 2,
    appointedBy: 'Super Admin'
  },
  {
    id: 'ob_06',
    seatId: 'vp-4',
    title: 'Vice President',
    seatLabel: 'Vice President (Seat 4 of 4 — Balochistan & West)',
    seatIndex: 4,
    status: 'VACANT',
    jurisdiction: 'STATE',
    stateProvince: 'Balochistan',
    termYears: 2,
    appointedBy: 'Super Admin'
  },
  {
    id: 'ob_07',
    seatId: 'gs-1',
    title: 'General Secretary',
    seatLabel: 'General Secretary (Seat 1)',
    seatIndex: 1,
    jurisdiction: 'NATIONAL',
    termYears: 3,
    status: 'VACANT',
    appointedBy: 'Super Admin'
  },
  {
    id: 'ob_08',
    seatId: 'dgs-1',
    title: 'Deputy General Secretary',
    seatLabel: 'Deputy General Secretary (Seat 1)',
    seatIndex: 1,
    status: 'VACANT',
    jurisdiction: 'NATIONAL',
    termYears: 2,
    appointedBy: 'Super Admin'
  },
  {
    id: 'ob_09',
    seatId: 'ib-1',
    title: 'Information and Broadcasting Secretary',
    seatLabel: 'Information & Broadcasting Secretary (Seat 1)',
    seatIndex: 1,
    jurisdiction: 'NATIONAL',
    termYears: 2,
    status: 'VACANT',
    appointedBy: 'Super Admin'
  },
  {
    id: 'ob_10',
    seatId: 'dib-1',
    title: 'Deputy Information and Broadcasting Secretary',
    seatLabel: 'Deputy Information & Broadcasting Secretary (Seat 1)',
    seatIndex: 1,
    status: 'VACANT',
    jurisdiction: 'NATIONAL',
    termYears: 2,
    appointedBy: 'Super Admin'
  },
  {
    id: 'ob_11',
    seatId: 'fs-1',
    title: 'Finance Secretary',
    seatLabel: 'Finance Secretary (Seat 1)',
    seatIndex: 1,
    jurisdiction: 'NATIONAL',
    termYears: 3,
    status: 'VACANT',
    appointedBy: 'Super Admin'
  },
  {
    id: 'ob_12',
    seatId: 'dfs-1',
    title: 'Deputy Finance Secretary',
    seatLabel: 'Deputy Finance Secretary (Seat 1)',
    seatIndex: 1,
    status: 'VACANT',
    jurisdiction: 'NATIONAL',
    termYears: 2,
    appointedBy: 'Super Admin'
  },
  {
    id: 'ob_13',
    seatId: 'os-1',
    title: 'Office Secretary',
    seatLabel: 'Office Secretary (Seat 1)',
    seatIndex: 1,
    jurisdiction: 'NATIONAL',
    termYears: 2,
    status: 'VACANT',
    appointedBy: 'Super Admin'
  }
];

export const INITIAL_OFFICE_BEARER_HISTORY: OfficeBearerHistory[] = [];

export const INITIAL_APP_UPDATES: AppUpdate[] = [];

export const INITIAL_APP_SETTINGS: AppSettings = {
  appName: 'Kifayat Connect',
  appNameUr: 'کفایت کنیکٹ',
  tagline: 'Together for a Better Tomorrow',
  taglineUr: 'بہتر کل کے لیے ایک ساتھ',
  logoUrl: '',
  primaryColor: '#043927',
  accentGoldColor: '#D4AF37',
  themePreset: 'OBSIDIAN_GOLD',
  registrationOpen: true,
  maintenanceMode: false,
  profileVisibility: 'MEMBERS_ONLY',
  chatEnabled: true,
  maxAdminsPerDistrict: 10,
  maxCoAdminsPerState: 3,
  contactEmail: 'support@kifayatconnect.org',
  contactHelpline: '+92 51 111 8841',
  dashboardVisibility: {
    showKpiGrid: true,
    showQuickActions: true,
    showApkSyncBanner: true,
    showDistrictMatrix: true,
    showOfficeBearersWidget: true,
    showAnnouncementsFeed: true
  },
  featureToggles: {
    allowPasswordLogin: true,
    allowCommunityAnnouncements: true,
    allowDigitalIdDownload: true,
    allowMemberPayments: true,
    allowComplaintsDesk: true
  },
  textOverrides: {
    welcomeHeadlineEn: 'Sign In to Kifayat Connect',
    welcomeHeadlineUr: 'کفایت کنیکٹ میں سائن ان کریں',
    maintenanceMessageEn: 'Kifayat Connect is currently undergoing scheduled maintenance by the Founder Super Admin.',
    maintenanceMessageUr: 'کفایت کنیکٹ اس وقت سپر ایڈمن کی جانب سے مرمت کے مرحلے میں ہے۔',
    idCardFooterEn: 'TOGETHER FOR A BETTER TOMORROW',
    idCardFooterUr: 'بہتر کل کے لیے ایک ساتھ'
  },
  roleDefaults: {
    ADMIN: {
      canManageUsers: true,
      canVerifyPayments: true,
      canPostCommunityAnnouncements: true,
      canPostOfficialAnnouncements: false,
      canManageComplaints: true,
      canViewReports: true,
      canApproveMembers: true
    },
    CO_ADMIN: {
      canManageUsers: false,
      canVerifyPayments: false,
      canPostCommunityAnnouncements: true,
      canPostOfficialAnnouncements: false,
      canManageComplaints: true,
      canViewReports: true,
      canApproveMembers: false
    },
    MEMBER: {
      canManageUsers: false,
      canVerifyPayments: false,
      canPostCommunityAnnouncements: false,
      canPostOfficialAnnouncements: false,
      canManageComplaints: false,
      canViewReports: false,
      canApproveMembers: false
    }
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'System Initialization'
};

export const INITIAL_CHATS: ChatConversation[] = [];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
