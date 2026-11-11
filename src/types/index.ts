export type UserRole = 'SUPER_ADMIN' | 'FINANCE_OFFICER' | 'REGIONAL_OFFICER' | 'MEMBER';

export type Region = 
  | 'Lahore Central'
  | 'Karachi South'
  | 'Islamabad Capital'
  | 'Peshawar North'
  | 'Quetta West'
  | 'Multan Division'
  | 'Faisalabad East'
  | (string & {});

export type MembershipStatus = 
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
  | 'Regional Activity' 
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
  region?: string; // Legacy fallback
  membershipId?: string; // e.g., KC-2024-8841
  membershipStatus: MembershipStatus;
  avatarUrl?: string;
  cnic: string;
  address: string;
  joinDate: string;
  validUntil?: string;
  monthlyPledge: number;
  annualPledge: number;
  totalContributed: number;
  isStaff: boolean;
  notes?: string;
}

export interface PaymentTransaction {
  id: string;
  receiptNumber: string; // e.g., REC-2026-0492
  userId: string;
  userName: string;
  userMembershipId: string;
  country?: string;
  stateProvince?: string;
  district?: string;
  tehsil?: string;
  cityTown?: string;
  unionCouncil?: string;
  userRegion?: string; // Legacy fallback
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
  region?: string; // Legacy fallback
  address: string;
  submittedAt: string;
  status: MembershipStatus;
  isOldMemberVerification: boolean;
  oldMembershipNo?: string;
  regionalOfficerId?: string;
  regionalOfficerName?: string;
  regionalRecommendation?: 'APPROVE' | 'REJECT';
  regionalRemarks?: string;
  regionalReviewedAt?: string;
  superAdminRemarks?: string;
  superAdminApprovedAt?: string;
  generatedMembershipId?: string;
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
  region?: string; // Legacy fallback
  category: ComplaintCategory;
  subject: string;
  description: string;
  status: ComplaintStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  resolvedAt?: string;
  assignedOfficerName?: string;
  responseNote?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetScope?: 'ALL' | 'PROVINCE' | 'DISTRICT';
  targetStateProvince?: string;
  targetDistrict?: string;
  targetRegion?: string; // Legacy compatibility
  publishedBy: string;
  publisherRole: UserRole;
  publishedAt: string;
  isPinned: boolean;
  urgency: 'NORMAL' | 'URGENT';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  category: 'SECURITY' | 'FINANCIAL' | 'MEMBERSHIP' | 'REGIONAL' | 'ROLE_MANAGEMENT';
  country?: string;
  stateProvince?: string;
  district?: string;
  tehsil?: string;
  cityTown?: string;
  unionCouncil?: string;
  region?: string; // Legacy fallback
  targetEntity: string;
  details: string;
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
  region?: string; // Legacy fallback
}

export type RegionalStats = AdministrativeStats;

export type NotificationType = 
  | 'MEMBERSHIP_PENDING_REGIONAL'
  | 'MEMBERSHIP_RECOMMENDED'
  | 'MEMBERSHIP_APPROVED'
  | 'MEMBERSHIP_REJECTED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_VERIFIED'
  | 'PAYMENT_REJECTED'
  | 'COMPLAINT_UPDATE'
  | 'ANNOUNCEMENT_NEW'
  | 'STAFF_ROLE_CHANGE';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetUserId?: string;
  targetRole?: UserRole | 'ALL';
  targetRegion?: string;
  targetStateProvince?: string;
  targetDistrict?: string;
  linkTab?: string;
  entityId?: string;
}
