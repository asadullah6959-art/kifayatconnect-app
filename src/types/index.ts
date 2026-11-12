export type UserRole = 'SUPER_ADMIN' | 'FINANCE_OFFICER' | 'ADMIN' | 'CO_ADMIN' | 'MEMBER';

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
  | 'Bank Transfer (Meezan/HBL)' 
  | 'EasyPaisa' 
  | 'JazzCash' 
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
  country: string;
  stateProvince: string;
  district: string;
  tehsil: string;
  cityTown: string;
  unionCouncil: string;
  membershipId?: string; // e.g., KC-2024-8841
  membershipStatus: MembershipStatus;
  avatarUrl?: string;
  avatar?: string;
  status?: string;
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

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetScope?: 'ALL' | 'PROVINCE' | 'DISTRICT';
  targetStateProvince?: string;
  targetDistrict?: string;
  publishedBy: string;
  publisherRole: UserRole;
  publishedAt: string;
  isPinned: boolean;
  urgency: 'NORMAL' | 'URGENT';
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
export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  recipientName: string;
  text: string;
  timestamp: string;
  read: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: 'IMAGE' | 'DOCUMENT';
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
// In-App Administration & Settings
// ----------------------------------------------------
export interface AppSettings {
  appName: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  accentGoldColor: string;
  registrationOpen: boolean;
  maintenanceMode: boolean;
  profileVisibility: 'PUBLIC' | 'MEMBERS_ONLY' | 'PRIVATE';
  chatEnabled: boolean;
  maxAdminsPerDistrict: number; // exactly 10
  maxCoAdminsPerState: number; // exactly 3
  contactEmail: string;
  contactHelpline: string;
  updatedAt: string;
  updatedBy: string;
}

// Backward-compatibility alias
export type Region = string;
