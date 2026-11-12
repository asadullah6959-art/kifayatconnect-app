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

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_super_admin',
    name: 'Asadullah (Super Admin)',
    email: 'asadullah6959@gmail.com',
    phone: '+92 300 1234567',
    role: 'SUPER_ADMIN',
    country: 'Pakistan',
    stateProvince: 'Islamabad Capital Territory',
    district: 'Islamabad',
    tehsil: 'Islamabad City',
    cityTown: 'Islamabad',
    unionCouncil: 'UC-01 Secretariat',
    membershipId: 'KC-ADM-001',
    membershipStatus: 'ACTIVE',
    cnic: '61101-1234567-1',
    address: 'Central Secretariat, Islamabad',
    joinDate: '2023-01-15',
    validUntil: '2028-12-31',
    monthlyPledge: 10000,
    annualPledge: 50000,
    totalContributed: 240000,
    isStaff: true,
    notes: 'Root Super Admin with supreme organizational governance authority.'
  },
  {
    id: 'usr_finance_officer',
    name: 'Ayesha Siddiqui',
    email: 'ayesha.siddiqui@kifayatconnect.org',
    phone: '+92 321 9876543',
    role: 'FINANCE_OFFICER',
    country: 'Pakistan',
    stateProvince: 'Punjab',
    district: 'Lahore',
    tehsil: 'Model Town',
    cityTown: 'Lahore',
    unionCouncil: 'UC-95 Gulberg III',
    membershipId: 'KC-FIN-002',
    membershipStatus: 'ACTIVE',
    cnic: '35202-7654321-2',
    address: 'Gulberg III, Lahore',
    joinDate: '2023-03-10',
    validUntil: '2027-12-31',
    monthlyPledge: 5000,
    annualPledge: 25000,
    totalContributed: 135000,
    isStaff: true,
    notes: 'Finance Officer authorized for treasury accounts and receipt audits.'
  },
  {
    id: 'usr_admin_lahore',
    name: 'Bilal Ahmed (Admin)',
    email: 'bilal.ahmed@kifayatconnect.org',
    phone: '+92 333 4455667',
    role: 'ADMIN',
    country: 'Pakistan',
    stateProvince: 'Punjab',
    district: 'Lahore',
    tehsil: 'Model Town',
    cityTown: 'Lahore',
    unionCouncil: 'UC-112 Model Town',
    membershipId: 'KC-ADM-LHR-01',
    membershipStatus: 'ACTIVE',
    cnic: '35201-3344556-3',
    address: 'Model Town Block C, Lahore',
    joinDate: '2023-06-01',
    validUntil: '2027-12-31',
    monthlyPledge: 3000,
    annualPledge: 15000,
    totalContributed: 68000,
    isStaff: true,
    notes: 'District Admin appointed for District Lahore (Punjab). Manages local members and stage-1 verifications.'
  },
  {
    id: 'usr_coadmin_punjab',
    name: 'Tariq Mahmood (Co-Admin)',
    email: 'tariq.coadmin@kifayatconnect.org',
    phone: '+92 300 9988771',
    role: 'CO_ADMIN',
    country: 'Pakistan',
    stateProvince: 'Punjab',
    district: 'Rawalpindi',
    tehsil: 'Rawalpindi',
    cityTown: 'Rawalpindi',
    unionCouncil: 'UC-41 Satellite Town',
    membershipId: 'KC-COA-PB-01',
    membershipStatus: 'ACTIVE',
    cnic: '37405-1122334-5',
    address: 'Satellite Town, Rawalpindi',
    joinDate: '2023-07-15',
    validUntil: '2027-12-31',
    monthlyPledge: 4000,
    annualPledge: 20000,
    totalContributed: 82000,
    isStaff: true,
    notes: 'State Co-Admin appointed for Punjab Province (Seat 1 of 3).'
  },
  {
    id: 'usr_admin_karachi',
    name: 'Zainab Bibi (Admin)',
    email: 'zainab.bibi@kifayatconnect.org',
    phone: '+92 345 5566778',
    role: 'ADMIN',
    country: 'Pakistan',
    stateProvince: 'Sindh',
    district: 'Karachi South',
    tehsil: 'Saddar',
    cityTown: 'Karachi',
    unionCouncil: 'UC-45 Clifton / DHA',
    membershipId: 'KC-ADM-KHI-01',
    membershipStatus: 'ACTIVE',
    cnic: '42201-9988776-4',
    address: 'DHA Phase 5, Karachi',
    joinDate: '2023-08-15',
    validUntil: '2027-12-31',
    monthlyPledge: 3000,
    annualPledge: 15000,
    totalContributed: 54000,
    isStaff: true,
    notes: 'District Admin appointed for District Karachi South (Sindh).'
  },
  {
    id: 'usr_member_hamza',
    name: 'Hamza Malik',
    email: 'hamza.malik@outlook.com',
    phone: '+92 301 8877665',
    role: 'MEMBER',
    country: 'Pakistan',
    stateProvince: 'Punjab',
    district: 'Lahore',
    tehsil: 'Lahore Cantt',
    cityTown: 'Lahore',
    unionCouncil: 'UC-119 Cavalry Ground',
    membershipId: 'KC-2024-8841',
    membershipStatus: 'ACTIVE',
    avatarUrl: '/src/assets/images/member_avatar_sample_1794225903658.jpg',
    cnic: '35202-8841290-5',
    address: 'House # 42, Street 8, Cavalry Ground, Lahore',
    joinDate: '2024-02-18',
    validUntil: '2027-02-18',
    monthlyPledge: 2500,
    annualPledge: 10000,
    totalContributed: 42500,
    isStaff: false,
    notes: 'Active contributing welfare member.'
  },
  {
    id: 'usr_member_fatima',
    name: 'Fatima Noor',
    email: 'fatima.noor@gmail.com',
    phone: '+92 322 7766554',
    role: 'MEMBER',
    country: 'Pakistan',
    stateProvince: 'Sindh',
    district: 'Karachi South',
    tehsil: 'Saddar',
    cityTown: 'Karachi',
    unionCouncil: 'UC-11 Saddar Bazaar',
    membershipId: 'KC-2024-9120',
    membershipStatus: 'ACTIVE',
    cnic: '42301-9120443-6',
    address: 'Apartment 4B, Sea View Apartments, Clifton, Karachi',
    joinDate: '2024-03-01',
    validUntil: '2027-03-01',
    monthlyPledge: 2000,
    annualPledge: 8000,
    totalContributed: 30000,
    isStaff: false,
    notes: 'Community member.'
  }
];

export const INITIAL_MEMBERSHIP_APPLICATIONS: MembershipApplication[] = [
  {
    id: 'app_001',
    applicantName: 'Muhammad Salman',
    email: 'salman.muhammad@gmail.com',
    phone: '+92 312 3456789',
    cnic: '35201-4455667-7',
    country: 'Pakistan',
    stateProvince: 'Punjab',
    district: 'Lahore',
    tehsil: 'Model Town',
    cityTown: 'Lahore',
    unionCouncil: 'UC-108 Johar Town',
    address: 'House # 12, Block G-3, Johar Town, Lahore',
    submittedAt: '2026-03-25T10:30:00Z',
    status: 'RECOMMENDED_BY_DISTRICT',
    isOldMemberVerification: false,
    districtAdminId: 'usr_admin_lahore',
    districtAdminName: 'Bilal Ahmed',
    districtRecommendation: 'APPROVE',
    districtRemarks: 'Verified residential address and CNIC in Johar Town. Community reference positive.',
    districtReviewedAt: '2026-03-26T14:15:00Z',
    supportingDocuments: [
      {
        id: 'doc_cnic_front_001',
        name: 'CNIC_Smart_Card_Front.jpg',
        type: 'IDENTIFICATION_CNIC',
        fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
        fileSize: 184320,
        fileMime: 'image/jpeg',
        uploadedAt: '2026-03-25T10:32:00Z',
        uploadedBy: 'salman.muhammad@gmail.com',
        uploadedByName: 'Muhammad Salman',
        notes: 'Original NADRA Smart Card scanned (front side)',
        verificationStatus: 'VERIFIED',
        verifiedBy: 'Bilal Ahmed (District Admin)',
        verifiedAt: '2026-03-26T14:10:00Z'
      },
      {
        id: 'doc_receipt_001',
        name: 'Meezan_Bank_Deposit_Slip_2500.png',
        type: 'EXPENSE_RECEIPT',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
        fileSize: 327680,
        fileMime: 'image/png',
        uploadedAt: '2026-03-25T10:35:00Z',
        uploadedBy: 'salman.muhammad@gmail.com',
        uploadedByName: 'Muhammad Salman',
        notes: 'Monthly contribution deposit receipt ref #MZ-99410',
        verificationStatus: 'VERIFIED',
        verifiedBy: 'Bilal Ahmed (District Admin)',
        verifiedAt: '2026-03-26T14:12:00Z'
      }
    ]
  },
  {
    id: 'app_002',
    applicantName: 'Rashid Minhas',
    email: 'rashid.minhas@gmail.com',
    phone: '+92 334 1122334',
    cnic: '42101-5566778-9',
    country: 'Pakistan',
    stateProvince: 'Sindh',
    district: 'Karachi South',
    tehsil: 'Civil Lines',
    cityTown: 'Karachi',
    unionCouncil: 'UC-08 PECHS Phase 1',
    address: 'House 88, Street 4, PECHS, Karachi',
    submittedAt: '2026-03-28T16:45:00Z',
    status: 'PENDING_DISTRICT_REVIEW',
    isOldMemberVerification: true,
    oldMembershipNo: 'KC-OLD-1994',
    supportingDocuments: [
      {
        id: 'doc_cnic_002',
        name: 'Rashid_CNIC_NADRA.jpg',
        type: 'IDENTIFICATION_CNIC',
        fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
        fileSize: 245760,
        fileMime: 'image/jpeg',
        uploadedAt: '2026-03-28T16:47:00Z',
        uploadedBy: 'rashid.minhas@gmail.com',
        uploadedByName: 'Rashid Minhas',
        notes: 'CNIC scanned copy for identification',
        verificationStatus: 'PENDING'
      },
      {
        id: 'doc_util_002',
        name: 'KElectric_Bill_Feb2026.pdf',
        type: 'UTILITY_BILL',
        fileUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
        fileSize: 524288,
        fileMime: 'application/pdf',
        uploadedAt: '2026-03-28T16:50:00Z',
        uploadedBy: 'rashid.minhas@gmail.com',
        uploadedByName: 'Rashid Minhas',
        notes: 'Electric bill showing PECHS residential address',
        verificationStatus: 'PENDING'
      },
      {
        id: 'doc_old_id_002',
        name: 'Historical_Membership_Card_1994.jpg',
        type: 'OTHER',
        fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
        fileSize: 419430,
        fileMime: 'image/jpeg',
        uploadedAt: '2026-03-28T16:52:00Z',
        uploadedBy: 'rashid.minhas@gmail.com',
        uploadedByName: 'Rashid Minhas',
        notes: 'Original 1994 membership slip for grandfathered seniority',
        verificationStatus: 'PENDING'
      }
    ]
  },
  {
    id: 'app_003',
    applicantName: 'Farhan Ali Qureshi',
    email: 'farhan.ali@gmail.com',
    phone: '+92 300 7788990',
    cnic: '35202-3322110-1',
    country: 'Pakistan',
    stateProvince: 'Punjab',
    district: 'Lahore',
    tehsil: 'Shalimar',
    cityTown: 'Lahore',
    unionCouncil: 'UC-74 Shadman',
    address: 'Shadman Market Road, Lahore',
    submittedAt: '2026-03-20T09:00:00Z',
    status: 'ACTIVE',
    isOldMemberVerification: false,
    districtAdminId: 'usr_admin_lahore',
    districtAdminName: 'Bilal Ahmed',
    districtRecommendation: 'APPROVE',
    districtRemarks: 'Verified in Shalimar sector.',
    districtReviewedAt: '2026-03-21T11:00:00Z',
    superAdminRemarks: 'Approved by Super Admin under central bylaws.',
    superAdminApprovedAt: '2026-03-22T10:00:00Z',
    generatedMembershipId: 'KC-2026-9042'
  }
];

export const INITIAL_PAYMENTS: PaymentTransaction[] = [
  {
    id: 'tx_001',
    receiptNumber: 'REC-2026-8812',
    userId: 'usr_member_hamza',
    userName: 'Hamza Malik',
    userMembershipId: 'KC-2024-8841',
    country: 'Pakistan',
    stateProvince: 'Punjab',
    district: 'Lahore',
    tehsil: 'Lahore Cantt',
    cityTown: 'Lahore',
    unionCouncil: 'UC-119 Cavalry Ground',
    amount: 5000,
    fundCategory: 'Monthly Contribution',
    paymentMethod: 'Bank Transfer (Meezan/HBL)',
    referenceNumber: 'MEEZ-TXN-9988221',
    date: '2026-03-28',
    status: 'VERIFIED',
    verifiedBy: 'Ayesha Siddiqui (Finance Officer)',
    verifiedAt: '2026-03-29T10:15:00Z',
    proofNote: 'Online bank deposit slip verified with Meezan Bank statement.'
  },
  {
    id: 'tx_002',
    receiptNumber: 'REC-2026-8813',
    userId: 'usr_member_fatima',
    userName: 'Fatima Noor',
    userMembershipId: 'KC-2024-9120',
    country: 'Pakistan',
    stateProvince: 'Sindh',
    district: 'Karachi South',
    tehsil: 'Saddar',
    cityTown: 'Karachi',
    unionCouncil: 'UC-11 Saddar Bazaar',
    amount: 10000,
    fundCategory: 'Annual Welfare Fund',
    paymentMethod: 'EasyPaisa',
    referenceNumber: 'EP-994411223',
    date: '2026-03-29',
    status: 'PENDING_VERIFICATION',
    proofNote: 'Mobile wallet transaction ID submitted. Awaiting finance confirmation.'
  }
];

export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'cmp_001',
    ticketNumber: 'TKT-2026-101',
    userId: 'usr_member_hamza',
    userName: 'Hamza Malik',
    userRole: 'MEMBER',
    country: 'Pakistan',
    stateProvince: 'Punjab',
    district: 'Lahore',
    tehsil: 'Lahore Cantt',
    cityTown: 'Lahore',
    unionCouncil: 'UC-119 Cavalry Ground',
    category: 'Receipt Inquiry',
    subject: 'Receipt generation delay for March contribution',
    description: 'Submitted 5,000 PKR through Meezan Bank on March 28. Kindly verify receipt.',
    status: 'RESOLVED',
    priority: 'MEDIUM',
    createdAt: '2026-03-28T11:00:00Z',
    resolvedAt: '2026-03-29T10:20:00Z',
    assignedOfficerName: 'Ayesha Siddiqui',
    responseNote: 'Bank deposit verified and digital receipt REC-2026-8812 has been issued to your dashboard.'
  },
  {
    id: 'cmp_002',
    ticketNumber: 'TKT-2026-102',
    userId: 'usr_member_fatima',
    userName: 'Fatima Noor',
    userRole: 'MEMBER',
    country: 'Pakistan',
    stateProvince: 'Sindh',
    district: 'Karachi South',
    tehsil: 'Saddar',
    cityTown: 'Karachi',
    unionCouncil: 'UC-11 Saddar Bazaar',
    category: 'Membership Card',
    subject: 'Request for updated physical QR card delivery',
    description: 'Please confirm if physical smart cards are dispatched to Clifton district office for collection.',
    status: 'UNDER_REVIEW',
    priority: 'LOW',
    createdAt: '2026-03-30T09:30:00Z',
    assignedOfficerName: 'Zainab Bibi',
    responseNote: 'Digital card is active. Physical cards batch will arrive at Saddar office on April 5th.'
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_001',
    title: 'Kifayat Connect Mobile App Update Available',
    content: 'Kifayat Connect ka naya update aa chuka hai. Behtar performance aur naye features ke liye app update karein.',
    targetScope: 'ALL',
    publishedBy: 'Asadullah (Super Admin)',
    publisherRole: 'SUPER_ADMIN',
    publishedAt: '2026-03-31T08:00:00Z',
    isPinned: true,
    urgency: 'URGENT'
  },
  {
    id: 'ann_002',
    title: 'Central Welfare Fund Disbursement for Ramadan & Eid Relief',
    content: 'Special emergency and ration funds allocated across all approved districts. Contact your assigned District Admin for applicant lists.',
    targetScope: 'ALL',
    publishedBy: 'Asadullah (Super Admin)',
    publisherRole: 'SUPER_ADMIN',
    publishedAt: '2026-03-25T10:00:00Z',
    isPinned: true,
    urgency: 'NORMAL'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud_001',
    timestamp: '2026-03-31T08:00:00Z',
    actorId: 'usr_super_admin',
    actorName: 'Asadullah',
    actorRole: 'SUPER_ADMIN',
    action: 'APP_UPDATE_PUBLISHED',
    category: 'APP_UPDATE',
    targetEntity: 'App Release v1.2.5',
    details: 'Published new Android APK and PWA release with broadcast alert to all members and admins.'
  },
  {
    id: 'aud_002',
    timestamp: '2026-03-29T10:15:00Z',
    actorId: 'usr_finance_officer',
    actorName: 'Ayesha Siddiqui',
    actorRole: 'FINANCE_OFFICER',
    action: 'PAYMENT_VERIFIED',
    category: 'FINANCIAL',
    targetEntity: 'REC-2026-8812',
    details: 'Verified PKR 5,000 contribution for Hamza Malik (Meezan Bank confirmation).'
  },
  {
    id: 'aud_003',
    timestamp: '2026-03-26T14:15:00Z',
    actorId: 'usr_admin_lahore',
    actorName: 'Bilal Ahmed',
    actorRole: 'ADMIN',
    action: 'DISTRICT_RECOMMENDATION',
    category: 'MEMBERSHIP',
    targetEntity: 'app_001',
    details: 'Recommended approval for Muhammad Salman in District Lahore after background check.'
  }
];

export const REGIONAL_STATS_DATA: RegionalStats[] = [
  {
    country: 'Pakistan',
    stateProvince: 'Punjab',
    district: 'Lahore',
    totalMembers: 480,
    activeMembers: 452,
    pendingApprovals: 8,
    totalCollected: 2450000,
    pendingComplaints: 2,
    officerInCharge: 'Bilal Ahmed (Admin)'
  },
  {
    country: 'Pakistan',
    stateProvince: 'Sindh',
    district: 'Karachi South',
    totalMembers: 390,
    activeMembers: 365,
    pendingApprovals: 5,
    totalCollected: 1980000,
    pendingComplaints: 3,
    officerInCharge: 'Zainab Bibi (Admin)'
  },
  {
    country: 'Pakistan',
    stateProvince: 'Islamabad Capital Territory',
    district: 'Islamabad',
    totalMembers: 210,
    activeMembers: 202,
    pendingApprovals: 2,
    totalCollected: 1250000,
    pendingComplaints: 1,
    officerInCharge: 'Asadullah (Super Admin)'
  }
];

// ----------------------------------------------------
// Proposed Office-Bearers (10 Titles, 13 Seats)
// ----------------------------------------------------
export const INITIAL_OFFICE_BEARERS: OfficeBearer[] = [
  {
    id: 'ob_01',
    seatId: 'pres-1',
    title: 'President',
    seatLabel: 'President (Supreme Seat)',
    seatIndex: 1,
    assignedUserId: 'usr_super_admin',
    assignedUserName: 'Asadullah (Super Admin)',
    assignedUserPhone: '+92 300 1234567',
    assignedUserLocation: 'Islamabad Capital Territory',
    jurisdiction: 'NATIONAL',
    stateProvince: 'Islamabad Capital Territory',
    district: 'Islamabad',
    appointedDate: '2023-01-15',
    termYears: 3,
    status: 'ACTIVE',
    appointedBy: 'Central Executive Council',
    approvalReference: 'CEC-MIN-2023-01',
    notes: 'Presiding officer of Kifayat Connect national council.'
  },
  {
    id: 'ob_02',
    seatId: 'svp-1',
    title: 'Senior Vice President',
    seatLabel: 'Senior Vice President (Seat 1)',
    seatIndex: 1,
    assignedUserId: 'usr_coadmin_punjab',
    assignedUserName: 'Tariq Mahmood',
    assignedUserPhone: '+92 300 9988771',
    assignedUserLocation: 'Rawalpindi, Punjab',
    jurisdiction: 'NATIONAL',
    stateProvince: 'Punjab',
    district: 'Rawalpindi',
    appointedDate: '2023-06-01',
    termYears: 3,
    status: 'ACTIVE',
    appointedBy: 'Asadullah (Super Admin)',
    approvalReference: 'CEC-MIN-2023-04',
    notes: 'Senior executive oversight.'
  },
  {
    id: 'ob_03',
    seatId: 'vp-1',
    title: 'Vice President',
    seatLabel: 'Vice President (Seat 1 of 4 — Punjab Jurisdiction)',
    seatIndex: 1,
    assignedUserId: 'usr_admin_lahore',
    assignedUserName: 'Bilal Ahmed',
    assignedUserPhone: '+92 333 4455667',
    assignedUserLocation: 'Lahore, Punjab',
    jurisdiction: 'STATE',
    stateProvince: 'Punjab',
    district: 'Lahore',
    appointedDate: '2023-06-15',
    termYears: 2,
    status: 'ACTIVE',
    appointedBy: 'Asadullah (Super Admin)',
    approvalReference: 'CEC-VP-2023-01',
    notes: 'Oversees organizational affairs in Punjab division.'
  },
  {
    id: 'ob_04',
    seatId: 'vp-2',
    title: 'Vice President',
    seatLabel: 'Vice President (Seat 2 of 4 — Sindh Jurisdiction)',
    seatIndex: 2,
    assignedUserId: 'usr_admin_karachi',
    assignedUserName: 'Zainab Bibi',
    assignedUserPhone: '+92 345 5566778',
    assignedUserLocation: 'Karachi South, Sindh',
    jurisdiction: 'STATE',
    stateProvince: 'Sindh',
    district: 'Karachi South',
    appointedDate: '2023-08-01',
    termYears: 2,
    status: 'ACTIVE',
    appointedBy: 'Asadullah (Super Admin)',
    approvalReference: 'CEC-VP-2023-02',
    notes: 'Oversees organizational affairs in Sindh division.'
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
    appointedBy: 'Super Admin',
    notes: 'Vacant — open for nomination by Super Admin.'
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
    appointedBy: 'Super Admin',
    notes: 'Vacant — open for nomination by Super Admin.'
  },
  {
    id: 'ob_07',
    seatId: 'gs-1',
    title: 'General Secretary',
    seatLabel: 'General Secretary (Seat 1)',
    seatIndex: 1,
    assignedUserName: 'Dr. Arshad Farooq',
    assignedUserPhone: '+92 300 5544332',
    assignedUserLocation: 'Islamabad',
    jurisdiction: 'NATIONAL',
    stateProvince: 'Islamabad Capital Territory',
    district: 'Islamabad',
    appointedDate: '2023-02-01',
    termYears: 3,
    status: 'ACTIVE',
    appointedBy: 'Asadullah (Super Admin)',
    approvalReference: 'CEC-GS-2023-01',
    notes: 'Administrative secretary in charge of central correspondence.'
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
    appointedBy: 'Super Admin',
    notes: 'Vacant — candidate vetting in progress.'
  },
  {
    id: 'ob_09',
    seatId: 'ib-1',
    title: 'Information and Broadcasting Secretary',
    seatLabel: 'Information & Broadcasting Secretary (Seat 1)',
    seatIndex: 1,
    assignedUserName: 'Shahid Mehmood',
    assignedUserPhone: '+92 313 7766554',
    assignedUserLocation: 'Lahore, Punjab',
    jurisdiction: 'NATIONAL',
    stateProvince: 'Punjab',
    district: 'Lahore',
    appointedDate: '2023-04-10',
    termYears: 2,
    status: 'ACTIVE',
    appointedBy: 'Asadullah (Super Admin)',
    approvalReference: 'CEC-IB-2023-01',
    notes: 'Press releases, media relations, and digital announcements.'
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
    appointedBy: 'Super Admin',
    notes: 'Vacant — pending nomination.'
  },
  {
    id: 'ob_11',
    seatId: 'fs-1',
    title: 'Finance Secretary',
    seatLabel: 'Finance Secretary (Seat 1)',
    seatIndex: 1,
    assignedUserId: 'usr_finance_officer',
    assignedUserName: 'Ayesha Siddiqui',
    assignedUserPhone: '+92 321 9876543',
    assignedUserLocation: 'Lahore, Punjab',
    jurisdiction: 'NATIONAL',
    stateProvince: 'Punjab',
    district: 'Lahore',
    appointedDate: '2023-03-10',
    termYears: 3,
    status: 'ACTIVE',
    appointedBy: 'Asadullah (Super Admin)',
    approvalReference: 'CEC-FS-2023-01',
    notes: 'Authorized signatory for accounts and financial statements.'
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
    appointedBy: 'Super Admin',
    notes: 'Vacant — auditing qualification required.'
  },
  {
    id: 'ob_13',
    seatId: 'os-1',
    title: 'Office Secretary',
    seatLabel: 'Office Secretary (Seat 1)',
    seatIndex: 1,
    assignedUserName: 'Kamran Haider',
    assignedUserPhone: '+92 331 4433221',
    assignedUserLocation: 'Islamabad',
    jurisdiction: 'NATIONAL',
    stateProvince: 'Islamabad Capital Territory',
    district: 'Islamabad',
    appointedDate: '2023-05-01',
    termYears: 2,
    status: 'ACTIVE',
    appointedBy: 'Asadullah (Super Admin)',
    approvalReference: 'CEC-OS-2023-01',
    notes: 'Day-to-day office registry and member record keeping.'
  }
];

export const INITIAL_OFFICE_BEARER_HISTORY: OfficeBearerHistory[] = [
  {
    id: 'obh_01',
    officeBearerId: 'ob_01',
    title: 'President',
    seatLabel: 'President (Supreme Seat)',
    userId: 'usr_super_admin',
    userName: 'Asadullah',
    startDate: '2020-01-01',
    endDate: '2022-12-31',
    termYears: 3,
    terminatedBy: 'Central Council',
    reason: 'Term completed successfully; re-appointed for 2023–2026.'
  }
];

// ----------------------------------------------------
// App Updates History & Active Release
// ----------------------------------------------------
export const INITIAL_APP_UPDATES: AppUpdate[] = [
  {
    id: 'upd_v125',
    version: '1.2.5',
    title: 'Kifayat Connect — Performance & Chat Upgrade',
    description: 'Kifayat Connect ka naya update aa chuka hai. Behtar performance aur naye features ke liye app update karein.',
    releaseNotes: [
      'Added direct 1-to-1 Member and Admin private messaging.',
      'Comprehensive 10-title, 13-seat Office-Bearers governance pipeline.',
      'Dedicated District Admin (10/district) and State Co-Admin (3/state) role systems.',
      'Direct Android debug APK download link and PWA auto-update support.',
      'Enhanced security with server-enforced role authorization.'
    ],
    releaseDate: '2026-03-31',
    apkDownloadUrl: 'https://github.com/asadullah6959-art/kifayatconnect-app/releases/latest/download/app-debug.apk',
    pwaUpdateUrl: window.location.origin,
    isMandatory: false,
    isPublished: true,
    publishedAt: '2026-03-31T08:00:00Z',
    publishedBy: 'Asadullah (Super Admin)'
  },
  {
    id: 'upd_v120',
    version: '1.2.0',
    title: 'Multi-Tier Approval & Firestore Live Synchronization',
    description: 'Cloud Firestore live synchronization with 6-level administrative location hierarchy.',
    releaseNotes: [
      'Real-time Firestore listeners for applications and transactions.',
      'Offline state resilience with optimistic UI updates.',
      'Comprehensive Pakistan location hierarchy (Country to District and City).'
    ],
    releaseDate: '2026-03-15',
    apkDownloadUrl: 'https://github.com/asadullah6959-art/kifayatconnect-app/releases/latest/download/app-debug.apk',
    pwaUpdateUrl: window.location.origin,
    isMandatory: false,
    isPublished: true,
    publishedAt: '2026-03-15T12:00:00Z',
    publishedBy: 'Asadullah (Super Admin)'
  }
];

// ----------------------------------------------------
// Default App Settings
// ----------------------------------------------------
export const INITIAL_APP_SETTINGS: AppSettings = {
  appName: 'Kifayat Connect',
  tagline: 'Role-Based Governance, Transparency & Community Welfare System',
  logoUrl: '/src/assets/images/kifayat_emblem_logo_1794225902501.jpg',
  primaryColor: '#0a192f',
  accentGoldColor: '#d4af37',
  registrationOpen: true,
  maintenanceMode: false,
  profileVisibility: 'MEMBERS_ONLY',
  chatEnabled: true,
  maxAdminsPerDistrict: 10,
  maxCoAdminsPerState: 3,
  contactEmail: 'support@kifayatconnect.org',
  contactHelpline: '+92 51 111 8841',
  updatedAt: '2026-03-31T08:00:00Z',
  updatedBy: 'Asadullah (Super Admin)'
};

// ----------------------------------------------------
// Initial Chat Conversations & Messages
// ----------------------------------------------------
export const INITIAL_CHATS: ChatConversation[] = [
  {
    id: 'chat_hamza_bilal',
    participantIds: ['usr_member_hamza', 'usr_admin_lahore'],
    participants: {
      'usr_member_hamza': {
        id: 'usr_member_hamza',
        name: 'Hamza Malik',
        role: 'MEMBER',
        district: 'Lahore',
        stateProvince: 'Punjab'
      },
      'usr_admin_lahore': {
        id: 'usr_admin_lahore',
        name: 'Bilal Ahmed (Admin)',
        role: 'ADMIN',
        district: 'Lahore',
        stateProvince: 'Punjab',
        officeTitle: 'District Admin'
      }
    },
    lastMessage: 'Salam Bilal bhai, when will the next welfare ration distribution take place in Lahore Cantt?',
    lastMessageTime: '2026-03-31T09:30:00Z',
    lastMessageSenderId: 'usr_member_hamza',
    unreadCounts: {
      'usr_member_hamza': 0,
      'usr_admin_lahore': 1
    }
  },
  {
    id: 'chat_super_admin_bilal',
    participantIds: ['usr_super_admin', 'usr_admin_lahore'],
    participants: {
      'usr_super_admin': {
        id: 'usr_super_admin',
        name: 'Asadullah (Super Admin)',
        role: 'SUPER_ADMIN',
        district: 'Islamabad',
        stateProvince: 'Islamabad Capital Territory'
      },
      'usr_admin_lahore': {
        id: 'usr_admin_lahore',
        name: 'Bilal Ahmed (Admin)',
        role: 'ADMIN',
        district: 'Lahore',
        stateProvince: 'Punjab',
        officeTitle: 'District Admin'
      }
    },
    lastMessage: 'Please complete verification for the 8 pending applicants in Lahore by tomorrow.',
    lastMessageTime: '2026-03-31T08:45:00Z',
    lastMessageSenderId: 'usr_super_admin',
    unreadCounts: {
      'usr_super_admin': 0,
      'usr_admin_lahore': 1
    }
  }
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_001',
    chatId: 'chat_hamza_bilal',
    senderId: 'usr_member_hamza',
    senderName: 'Hamza Malik',
    senderRole: 'MEMBER',
    recipientId: 'usr_admin_lahore',
    recipientName: 'Bilal Ahmed (Admin)',
    text: 'Salam Bilal bhai, when will the next welfare ration distribution take place in Lahore Cantt?',
    timestamp: '2026-03-31T09:30:00Z',
    read: false
  },
  {
    id: 'msg_002',
    chatId: 'chat_super_admin_bilal',
    senderId: 'usr_super_admin',
    senderName: 'Asadullah (Super Admin)',
    senderRole: 'SUPER_ADMIN',
    recipientId: 'usr_admin_lahore',
    recipientName: 'Bilal Ahmed (Admin)',
    text: 'Please complete verification for the 8 pending applicants in Lahore by tomorrow.',
    timestamp: '2026-03-31T08:45:00Z',
    read: false
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_update_1',
    type: 'APP_UPDATE_AVAILABLE',
    title: 'Kifayat Connect Mobile App Update Available',
    message: 'Kifayat Connect ka naya update aa chuka hai. Behtar performance aur naye features ke liye app update karein.',
    timestamp: '2026-03-31T08:00:00Z',
    read: false,
    targetRole: 'ALL',
    actionUrl: 'https://github.com/asadullah6959-art/kifayatconnect-app/releases/latest/download/app-debug.apk'
  },
  {
    id: 'notif_sa_1',
    type: 'MEMBERSHIP_RECOMMENDED',
    title: 'District Admin Recommendation Awaiting Final Sign-Off',
    message: 'Bilal Ahmed (District Admin, Lahore) recommended Muhammad Salman (CNIC: 35201-4455667-7) for membership.',
    timestamp: '2026-03-31T08:30:00Z',
    read: false,
    targetRole: 'SUPER_ADMIN',
    linkTab: 'approvals',
    entityId: 'app_001'
  },
  {
    id: 'notif_sa_2',
    type: 'PAYMENT_PENDING',
    title: 'Large Contribution Alert',
    message: 'Fatima Noor contributed PKR 10,000 via EasyPaisa under Annual Welfare Fund.',
    timestamp: '2026-03-30T14:20:00Z',
    read: false,
    targetRole: 'SUPER_ADMIN',
    linkTab: 'funds',
    entityId: 'tx_002'
  },
  {
    id: 'notif_admin_1',
    type: 'MEMBERSHIP_PENDING_DISTRICT',
    title: 'New Member Registration in Lahore',
    message: 'Rashid Minhas registered in your district. Please conduct background identity verification.',
    timestamp: '2026-03-31T10:00:00Z',
    read: false,
    targetRole: 'ADMIN',
    targetDistrict: 'Lahore',
    linkTab: 'approvals',
    entityId: 'app_002'
  },
  {
    id: 'notif_mem_1',
    type: 'PAYMENT_VERIFIED',
    title: 'Payment Verified & Receipt Issued',
    message: 'Your payment of PKR 5,000 for Monthly Welfare Contribution has been verified. Official receipt REC-2026-8812 is available.',
    timestamp: '2026-03-31T09:00:00Z',
    read: false,
    targetUserId: 'usr_member_hamza',
    linkTab: 'funds',
    entityId: 'tx_001'
  }
];
