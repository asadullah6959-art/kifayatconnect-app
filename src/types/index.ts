export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'CO_ADMIN' | 'MEMBER';

export interface RolePermissions {
  canManageUsers: boolean;
  canVerifyPayments: boolean;
  canPostCommunityAnnouncements: boolean;
  canPostOfficialAnnouncements: boolean;
  canManageComplaints: boolean;
  canViewReports: boolean;
  canApproveMembers: boolean;
}

export function normalizeLegacyRole(role: string | undefined, email?: string): UserRole {
  if (email && email.trim().toLowerCase() === 'asadullah6959@gmail.com') {
    return 'SUPER_ADMIN';
  }
  switch (role) {
    case 'SUPER_ADMIN':
      return 'SUPER_ADMIN';
    case 'ADMIN':
    case 'FINANCE_OFFICER':
      return 'ADMIN';
    case 'CO_ADMIN':
      return 'CO_ADMIN';
    case 'MEMBER':
    default:
      return 'MEMBER';
  }
}

export type MembershipStatus = 
  | 'PENDING_DISTRICT_REVIEW' 
  | 'RECOMMENDED_BY_DISTRICT' 
  | 'PENDING_REGIONAL_REVIEW'
  | 'RECOMMENDED_BY_REGION'
  | 'ACTIVE' 
  | 'REJECTED' 
  | 'SUSPENDED';

export type PaymentStatus = 
  | 'PENDING_VERIFICATION' 
  | 'VERIFIED' 
  | 'REJECTED';

export type FundCategory = 
  | 'Monthly Contribution' 
  | 'Annual Welfare Fund' 
  | 'Emergency Relief' 
  | 'Zakat & Sadqah';

export type PaymentMethod = 
  | 'EasyPaisa' 
  | 'JazzCash' 
  | 'Bank Transfer' 
  | 'Cash'
  | 'Bank Transfer (Meezan/HBL)' 
  | 'Raast Instant ID' 
  | 'Cash Voucher';

export type ComplaintCategory = 
  | 'Fund Allocation' 
  | 'Membership Card' 
  | 'Receipt Inquiry' 
  | 'Welfare Support' 
  | 'District Activity' 
  | 'General';

export type ComplaintStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

export interface LocationHierarchy {
  country: string;
  stateProvince: string;
  district: string;
  tehsil: string;
  cityTown: string;
  unionCouncil: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isFounder?: boolean;
  isAuditOfficer?: boolean;
  isMutedInChat?: boolean;
  founderBubbleColor?: string;
  permissions?: RolePermissions;
  hasPassword?: boolean;
  country: string;
  stateProvince: string;
  district: string;
  tehsil: string;
  cityTown: string;
  unionCouncil: string;
  membershipId?: string; // e.g., KC-000001
  memberId?: string;
  membershipStatus: MembershipStatus;
  avatarUrl?: string;
  photoUrl?: string;
  avatar?: string;
  status?: string;
  profileCompleted?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  cnic: string;
  address: string;
  joinDate: string;
  validUntil?: string;
  monthlyPledge: number;
  annualPledge: number;
  totalContributed: number;
  isStaff: boolean;
  notes?: string;
  assignedOfficeTitle?: string;
  assignedDistrict?: string;
  assignedStateProvince?: string;
  isSuspended?: boolean;
  bio?: string;
  customCity?: string;
  verificationStatus?: 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
  region?: string; // Legacy fallback
}

export interface PaymentTransaction {
  id: string;
  receiptNumber: string;
  userId: string;
  userName: string;
  userMembershipId: string;
  country?: string;
  stateProvince?: string;
  district?: string;
  tehsil?: string;
  cityTown?: string;
  unionCouncil?: string;
  amount: number;
  fundCategory: FundCategory;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  date: string;
  status: PaymentStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  proofNote?: string;
  receiptImageUrl?: string;
  receiptImageName?: string;
  userRegion?: string; // Legacy fallback
}

export interface MembershipApplication {
  id: string;
  applicantName: string;
  email: string;
  phone: string;
  cnic: string;
  country: string;
  stateProvince: string;
  district: string;
  tehsil: string;
  cityTown: string;
  unionCouncil: string;
  address: string;
  submittedAt: string;
  status: MembershipStatus;
  isOldMemberVerification: boolean;
  oldMembershipNo?: string;
  districtAdminId?: string;
  districtAdminName?: string;
  districtRecommendation?: 'APPROVE' | 'REJECT';
  districtRemarks?: string;
  districtReviewedAt?: string;
  superAdminRemarks?: string;
  superAdminApprovedAt?: string;
  generatedMembershipId?: string;
  // Legacy compatibility fields
  regionalOfficerId?: string;
  regionalOfficerName?: string;
  regionalRecommendation?: 'APPROVE' | 'REJECT';
  regionalRemarks?: string;
  region?: string;
  supportingDocuments?: SupportingDocument[];
}

export type SupportingDocumentType = 
  | 'IDENTIFICATION_CNIC' 
  | 'EXPENSE_RECEIPT' 
  | 'INCOME_PROOF' 
  | 'UTILITY_BILL' 
  | 'DEPOSIT_SLIP' 
  | 'OTHER';

export interface SupportingDocument {
  id: string;
  name: string;
  type: SupportingDocumentType;
  fileUrl: string; // data URL or remote URL
  fileSize: number; // in bytes
  fileMime: string;
  uploadedAt: string;
  uploadedBy: string;
  uploadedByName: string;
  notes?: string;
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'FLAGGED';
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
}

export interface Complaint {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  country?: string;
  stateProvince?: string;
  district?: string;
  tehsil?: string;
  cityTown?: string;
  unionCouncil?: string;
  category: ComplaintCategory;
  subject: string;
  description: string;
  status: ComplaintStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  resolvedAt?: string;
  assignedOfficerName?: string;
  responseNote?: string;
  region?: string;
}

export type AnnouncementType = 'OFFICIAL_APP' | 'COMMUNITY';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  announcementType?: AnnouncementType;
  targetScope?: 'ALL' | 'PROVINCE' | 'DISTRICT';
  targetStateProvince?: string;
  targetDistrict?: string;
  publishedBy: string;
  publisherRole: UserRole;
  publishedAt: string;
  isPinned: boolean;
  urgency: 'NORMAL' | 'URGENT';
  expiresAt?: string;
  pinnedUntil?: string;
  targetRegion?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  category: 'SECURITY' | 'FINANCIAL' | 'MEMBERSHIP' | 'STAFF_MANAGEMENT' | 'OFFICE_BEARER' | 'APP_UPDATE' | 'SETTINGS' | 'ROLE_MANAGEMENT' | 'REGIONAL';
  country?: string;
  stateProvince?: string;
  district?: string;
  tehsil?: string;
  cityTown?: string;
  unionCouncil?: string;
  targetEntity: string;
  details: string;
  region?: string;
}

export interface AdministrativeStats {
  country?: string;
  stateProvince: string;
  district: string;
  totalMembers: number;
  activeMembers: number;
  pendingApprovals: number;
  totalCollected: number;
  pendingComplaints: number;
  officerInCharge: string;
  region?: string;
}

export type RegionalStats = AdministrativeStats;

export type NotificationType = 
  | 'APP_UPDATE_AVAILABLE'
  | 'MEMBERSHIP_PENDING_DISTRICT'
  | 'MEMBERSHIP_PENDING_REGIONAL'
  | 'MEMBERSHIP_RECOMMENDED'
  | 'MEMBERSHIP_APPROVED'
  | 'MEMBERSHIP_REJECTED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_VERIFIED'
  | 'PAYMENT_REJECTED'
  | 'COMPLAINT_UPDATE'
  | 'ANNOUNCEMENT_NEW'
  | 'STAFF_ROLE_CHANGE'
  | 'OFFICE_BEARER_APPOINTMENT'
  | 'CHAT_MESSAGE';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetUserId?: string;
  targetRole?: UserRole | 'ALL';
  targetStateProvince?: string;
  targetDistrict?: string;
  linkTab?: string;
  entityId?: string;
  actionUrl?: string;
}

// ----------------------------------------------------
// Organizational Office-Bearers (10 Proposed Titles, 13 Seats)
// ----------------------------------------------------
export interface OfficeBearer {
  id: string;
  seatId: string; // e.g., 'pres-1', 'vp-1', 'vp-2', 'vp-3', 'vp-4'
  title: string; // 'President', 'Senior Vice President', 'Vice President', etc.
  seatLabel: string; // e.g., 'Vice President (Seat 1 of 4)'
  seatIndex: number;
  assignedUserId?: string;
  assignedUserName?: string;
  assignedUserCnic?: string;
  assignedUserPhone?: string;
  assignedUserEmail?: string;
  assignedUserLocation?: string;
  jurisdiction: 'NATIONAL' | 'STATE' | 'DISTRICT';
  stateProvince?: string;
  district?: string;
  appointedDate?: string;
  termYears: number; // typically 2 or 3 years
  status: 'ACTIVE' | 'VACANT' | 'EXPIRED';
  appointedBy: string;
  approvalReference?: string;
  notes?: string;
}

export interface OfficeBearerHistory {
  id: string;
  officeBearerId: string;
  title: string;
  seatLabel: string;
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
  termYears: number;
  terminatedBy: string;
  reason: string;
}

// ----------------------------------------------------
// Chat System Models
// ----------------------------------------------------
export type MessageDeliveryStatus = 'QUEUED' | 'DELIVERED' | 'SEEN';

export type CommunityScenicThemeId =
  | 'OBSIDIAN_GOLD'
  | 'JUNGLE'
  | 'SUNSET_DESERT'
  | 'STARRY_OASIS'
  | 'NORTHERN_VALLEY'
  | 'MADINAH_NOOR'
  | 'CUSTOM';

export interface ChatReplySnapshot {
  id: string;
  senderName: string;
  text: string;
  isVoiceNote?: boolean;
}

export interface ChatVoiceNote {
  url: string;
  durationSec: number;
  waveform: number[];
}

export interface ChatMessage {
  id: string;
  chatId: string;
  roomType?: 'DIRECT' | 'COMMUNITY';
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderIsFounder?: boolean;
  senderIsAuditOfficer?: boolean;
  senderBubbleColor?: string;
  recipientId: string;
  recipientName: string;
  text: string;
  timestamp: string;
  read: boolean;
  deliveryStatus?: MessageDeliveryStatus;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: 'IMAGE' | 'DOCUMENT';
  voiceNote?: ChatVoiceNote;
  islamicGifId?: string;
  replyTo?: ChatReplySnapshot;
  reactions?: Record<string, string[]>;
  isHighlighted?: boolean;
  highlightedBy?: string;
  isPinned?: boolean;
  pinnedBy?: string;
  isDeleted?: boolean;
  deletedBy?: string;
}

export interface ChatConversation {
  id: string;
  participantIds: string[];
  participants: {
    [userId: string]: {
      id: string;
      name: string;
      role: UserRole;
      avatarUrl?: string;
      district?: string;
      stateProvince?: string;
      officeTitle?: string;
    };
  };
  lastMessage: string;
  lastMessageTime: string;
  lastMessageSenderId: string;
  unreadCounts: {
    [userId: string]: number;
  };
  unreadCount?: number;
}

// ----------------------------------------------------
// App Updates Management Models
// ----------------------------------------------------
export interface AppUpdate {
  id: string;
  version: string; // e.g., '1.3.0'
  title: string;
  description: string;
  releaseNotes: string[];
  releaseDate: string;
  apkDownloadUrl: string;
  pwaUpdateUrl: string;
  isMandatory: boolean;
  isPublished: boolean;
  publishedAt?: string;
  publishedBy?: string;
}

// ----------------------------------------------------
// In-App Administration & Master Control Panel Settings
// ----------------------------------------------------
export type ThemePresetId = 'OBSIDIAN_GOLD' | 'EMERALD_GOLD' | 'MIDNIGHT_ROYAL' | 'IMPERIAL_ONYX';

export interface DashboardSectionVisibility {
  showKpiGrid: boolean;
  showQuickActions: boolean;
  showApkSyncBanner: boolean;
  showDistrictMatrix: boolean;
  showOfficeBearersWidget: boolean;
  showAnnouncementsFeed: boolean;
}

export interface FeatureToggles {
  allowPasswordLogin: boolean;
  allowCommunityAnnouncements: boolean;
  allowDigitalIdDownload: boolean;
  allowMemberPayments: boolean;
  allowComplaintsDesk: boolean;
}

export interface CustomCopyOverrides {
  welcomeHeadlineEn: string;
  welcomeHeadlineUr: string;
  maintenanceMessageEn: string;
  maintenanceMessageUr: string;
  idCardFooterEn: string;
  idCardFooterUr: string;
}

export interface AppSettings {
  appName: string;
  appNameUr?: string;
  tagline: string;
  taglineUr?: string;
  logoUrl: string;
  primaryColor: string;
  accentGoldColor: string;
  themePreset?: ThemePresetId;
  liveChatTheme?: CommunityScenicThemeId;
  liveChatCustomBgUrl?: string;
  founderBubbleColor?: string;
  registrationOpen: boolean;
  maintenanceMode: boolean;
  profileVisibility: 'PUBLIC' | 'MEMBERS_ONLY' | 'PRIVATE';
  chatEnabled: boolean;
  maxAdminsPerDistrict: number; // exactly 10
  maxCoAdminsPerState: number; // exactly 3
  contactEmail: string;
  contactHelpline: string;
  masterPinHash?: string;
  dashboardVisibility?: DashboardSectionVisibility;
  featureToggles?: FeatureToggles;
  textOverrides?: CustomCopyOverrides;
  roleDefaults?: {
    ADMIN: RolePermissions;
    CO_ADMIN: RolePermissions;
    MEMBER: RolePermissions;
  };
  updatedAt: string;
  updatedBy: string;
}

// Backward-compatibility alias
export type Region = string;
