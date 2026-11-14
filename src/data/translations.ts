import { CustomCopyOverrides, UserRole } from '../types';

export type AppLanguage = 'en' | 'ur';

export const TRANSLATIONS = {
  en: {
    // Brand & Splash
    appName: 'KIFAYAT CONNECT',
    appTitleShort: 'Kifayat Connect',
    tagline: 'Together for a Better Tomorrow',
    loadingWorkspace: 'Preparing Luxury Governance Suite...',
    maintenanceTitle: 'Scheduled System Maintenance',
    maintenanceDesc: 'Kifayat Connect is currently undergoing maintenance by the Founder Super Admin. Please check back shortly.',
    founderProtected: 'Founder Protected',

    // Roles
    roleSuperAdmin: 'SUPER ADMIN',
    roleAdmin: 'ADMIN',
    roleCoAdmin: 'CO-ADMIN',
    roleMember: 'MEMBER',

    // Auth & Gate
    welcomeSignInTitle: 'Sign In to Kifayat Connect',
    welcomeSubtitle: 'Secure Community Governance, Payments & VIP Digital Identity',
    signInBtn: 'Sign In',
    registerBtn: 'Create Account',
    emailLabel: 'Gmail / Email Address',
    passwordLabel: 'Password',
    confirmPasswordLabel: 'Confirm Password',
    otpCodeLabel: '6-Digit Verification Code',
    tabPasswordLogin: 'Password Login',
    tabOtpLogin: 'Email OTP',
    sendOtpBtn: 'Send 6-Digit Code',
    resendOtpBtn: 'Resend Code',
    verifySignInBtn: 'Verify & Sign In',
    signInWithPasswordBtn: 'Sign In with Password',
    forgotPasswordLink: 'Forgot Password?',
    resetPasswordTitle: 'Reset Password via Email OTP',
    sendResetCodeBtn: 'Send Reset Code',
    newPasswordLabel: 'New Password (min 6 chars)',
    confirmResetBtn: 'Verify & Update Password',
    backToSignIn: 'Back to Sign In',
    continueGoogleBtn: 'Continue with Google (Web Only)',
    mobileGoogleNotice: 'Please use Password Login or Email OTP on the mobile app.',
    rememberSessionBadge: 'Persistent Login Enabled — stays signed in until Logout',
    noPasswordYetNote: 'Existing account without password? Sign in with Email OTP anytime or reset password.',
    step1VerifyEmail: 'Step 1: Verify Email via OTP',
    step2CreatePassword: 'Step 2: Create Account Password',
    step3CompleteProfile: 'Step 3: Community Details',
    completeSignupBtn: 'Complete Registration',

    // Navigation & Header
    navDashboard: 'Dashboard',
    navChat: 'Messages',
    navFunds: 'Funds & Payments',
    navAnnouncements: 'Announcements',
    navProfile: 'My Profile',
    navMembers: 'Member Directory',
    navApprovals: 'Approval Pipeline',
    navComplaints: 'Complaints Desk',
    navOfficeBearers: 'Office Bearers',
    navStaff: 'Roles & Staff',
    navReports: 'Reports & Export',
    navAudit: 'Audit Logs',
    navMasterControl: 'Master Control',
    mobileNavHome: 'Home',
    mobileNavChat: 'Chat',
    mobileNavPay: 'Pay',
    mobileNavElaanat: 'Elaanat',
    mobileNavProfile: 'Profile',
    logout: 'Logout',
    online: 'Online',
    offline: 'Offline',
    languageToggle: 'اردو',
    notifications: 'Notifications',
    searchPlaceholder: 'Search members, receipts, announcements...',
    viewDigitalId: 'VIP Digital ID',

    // Dashboards & Apollo Quick Actions
    quickActionsTitle: 'Quick Actions',
    kpiTotalMembers: 'Total Members',
    kpiVerifiedFunds: 'Verified Funds',
    kpiPendingApprovals: 'Pending Approvals',
    kpiOpenTickets: 'Open Tickets',
    actionPayFunds: 'Submit Payment',
    actionOpenChat: 'Direct Message',
    actionDigitalId: 'VIP ID Card',
    actionAnnouncements: 'Announcements',
    actionComplaints: 'File Complaint',
    actionMasterPanel: 'Master Control',
    actionVerifyPayments: 'Verify Receipts',
    actionManageRoles: 'Manage Roles',
    apkUpdateSection: 'Android APK & App Version',
    latestVersionInstalled: 'Latest Version Installed',
    downloadApkBtn: 'Download Latest APK',
    checkUpdatesBtn: 'Check GitHub Release',

    // Chat
    chatHeader: 'Encrypted Community Messaging',
    chatSubtitle: 'Real-time communication with offline message queue',
    chatSearchPlaceholder: 'Search members or staff...',
    chatTypeMessage: 'Type a message...',
    chatSend: 'Send',
    chatOfflineBanner: 'Offline Mode — Messages are queued (🕒) and auto-send when back online.',
    statusQueued: 'Queued (Offline)',
    statusDelivered: 'Delivered',
    statusSeen: 'Seen',
    noConversations: 'Select any community member or leader to start a conversation.',

    // Announcements
    announcementsHeader: 'Community & Official Announcements',
    tabOfficialApp: 'Official App 👑',
    tabCommunity: 'Community 📢',
    tabArchive: 'History Archive',
    publishAnnouncementBtn: 'Publish Announcement',
    pinToTop: 'Pin to Top',
    pinnedBadge: 'Pinned',
    urgentBadge: 'Urgent',
    expiryLabel: 'Expiry Date & Time (Optional)',
    expiresOn: 'Expires',
    expiredOn: 'Expired',
    noAnnouncements: 'No active announcements in this channel.',
    noArchivedAnnouncements: 'No expired or archived announcements yet.',

    // VIP Digital ID Card
    vipCardTitle: 'Luxury VIP Digital Membership Card',
    vipPremiumMember: 'PREMIUM MEMBER',
    vipMemberIdPrefix: 'MEMBER ID',
    vipFlipHint: 'Tap card to flip for QR Verification & Seal',
    vipDownloadBtn: 'Download ID Card',
    vipVerifyQrBtn: 'Verify QR Code',
    vipPrintBtn: 'Print Card',
    vipVerifiedAuthentic: 'Verified Authentic Kifayat Connect Member',
    vipBackTitle: 'OFFICIAL VERIFICATION SEAL',
    vipIssuedBy: 'Authorized by Central Executive Council',

    // Master Control Panel
    masterControlTitle: 'Super Admin Master Control Panel',
    masterPinLockedTitle: 'Master Control Panel Locked',
    masterPinCreateTitle: 'Set 4–6 Digit Master Control PIN',
    masterPinEnterPrompt: 'Enter your 4–6 digit PIN to unlock live configuration controls.',
    masterPinUnlockBtn: 'Unlock Master Control',
    masterPinSaveBtn: 'Save Master PIN',
    masterPinResetOtp: 'Reset PIN via Email OTP',

    // Generic
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    close: 'Close',
    approve: 'Approve',
    reject: 'Reject',
    suspend: 'Suspend',
    activate: 'Activate',
    promote: 'Promote',
    demote: 'Demote',
    deleteLabel: 'Delete',
    statusLabel: 'Status',
    dateLabel: 'Date',
    allLabel: 'All'
  },
  ur: {
    // Brand & Splash
    appName: 'کفایت کنیکٹ',
    appTitleShort: 'کفایت کنیکٹ',
    tagline: 'بہتر کل کے لیے ایک ساتھ',
    loadingWorkspace: 'گورننس پینل لوڈ ہو رہا ہے...',
    maintenanceTitle: 'سسٹم کی مرمت اور اپڈیٹ جاری ہے',
    maintenanceDesc: 'کفایت کنیکٹ اس وقت سپر ایڈمن کی جانب سے مرمت کے مرحلے میں ہے۔ براہ کرم کچھ دیر بعد کوشش کریں۔',
    founderProtected: 'بانی تحفظ فعال',

    // Roles
    roleSuperAdmin: 'سپر ایڈمن',
    roleAdmin: 'ایڈمن',
    roleCoAdmin: 'کو ایڈمن',
    roleMember: 'ممبر',

    // Auth & Gate
    welcomeSignInTitle: 'کفایت کنیکٹ میں سائن ان کریں',
    welcomeSubtitle: 'محفوظ کمیونٹی گورننس، ادائیگیاں اور وی آئی پی ڈیجیٹل شناخت',
    signInBtn: 'سائن ان',
    registerBtn: 'نیا اکاؤنٹ بنائیں',
    emailLabel: 'جی میل / ای میل ایڈریس',
    passwordLabel: 'پاس ورڈ',
    confirmPasswordLabel: 'پاس ورڈ کی تصدیق کریں',
    otpCodeLabel: '6 ہندسوں کا تصدیقی کوڈ',
    tabPasswordLogin: 'پاس ورڈ لاگ ان',
    tabOtpLogin: 'ای میل او ٹی پی',
    sendOtpBtn: '6 ہندسوں کا کوڈ بھیجیں',
    resendOtpBtn: 'دوبارہ کوڈ بھیجیں',
    verifySignInBtn: 'تصدیق کریں اور سائن ان ہوں',
    signInWithPasswordBtn: 'پاس ورڈ کے ساتھ سائن ان کریں',
    forgotPasswordLink: 'پاس ورڈ بھول گئے؟',
    resetPasswordTitle: 'ای میل کوڈ سے پاس ورڈ تبدیل کریں',
    sendResetCodeBtn: 'ری سیٹ کوڈ بھیجیں',
    newPasswordLabel: 'نیا پاس ورڈ (کم از کم 6 حروف)',
    confirmResetBtn: 'تصدیق اور پاس ورڈ اپڈیٹ کریں',
    backToSignIn: 'سائن ان پر واپس جائیں',
    continueGoogleBtn: 'گوگل کے ساتھ جاری رکھیں (صرف ویب)',
    mobileGoogleNotice: 'موبائل ایپ پر براہ کرم پاس ورڈ یا ای میل او ٹی پی استعمال کریں۔',
    rememberSessionBadge: 'مستقل سیشن فعال — لاگ آؤٹ تک لاگ ان رہے گا',
    noPasswordYetNote: 'اگر پرانا اکاؤنٹ ہے تو ای میل او ٹی پی سے سائن ان کریں یا پاس ورڈ سیٹ کریں۔',
    step1VerifyEmail: 'مرحلہ 1: ای میل او ٹی پی تصدیق',
    step2CreatePassword: 'مرحلہ 2: اکاؤنٹ پاس ورڈ بنائیں',
    step3CompleteProfile: 'مرحلہ 3: ممبرشپ تفصیلات',
    completeSignupBtn: 'رجسٹریشن مکمل کریں',

    // Navigation & Header
    navDashboard: 'ڈیش بورڈ',
    navChat: 'پیغامات',
    navFunds: 'فنڈز اور ادائیگیاں',
    navAnnouncements: 'اعلانات',
    navProfile: 'میری پروفائل',
    navMembers: 'ممبران ڈائریکٹری',
    navApprovals: 'منظوری کا نظام',
    navComplaints: 'شکایات سیل',
    navOfficeBearers: 'عہدیداران',
    navStaff: 'کردار اور عملہ',
    navReports: 'رپورٹس اور ایکسپورٹ',
    navAudit: 'آڈٹ لاگز',
    navMasterControl: 'ماسٹر کنٹرول',
    mobileNavHome: 'ہوم',
    mobileNavChat: 'چیٹ',
    mobileNavPay: 'ادائیگی',
    mobileNavElaanat: 'اعلانات',
    mobileNavProfile: 'پروفائل',
    logout: 'لاگ آؤٹ',
    online: 'آن لائن',
    offline: 'آف لائن',
    languageToggle: 'English',
    notifications: 'اطلاعات',
    searchPlaceholder: 'ممبر، رسید یا اعلان تلاش کریں...',
    viewDigitalId: 'وی آئی پی آئی ڈی کارڈ',

    // Dashboards & Apollo Quick Actions
    quickActionsTitle: 'فوری اقدامات',
    kpiTotalMembers: 'کل ممبران',
    kpiVerifiedFunds: 'تصدیق شدہ فنڈز',
    kpiPendingApprovals: 'زیر التواء منظوریاں',
    kpiOpenTickets: 'جاری شکایات',
    actionPayFunds: 'ادائیگی جمع کروائیں',
    actionOpenChat: 'براہ راست پیغام',
    actionDigitalId: 'وی آئی پی آئی ڈی کارڈ',
    actionAnnouncements: 'اعلانات دیکھیں',
    actionComplaints: 'شکایت درج کریں',
    actionMasterPanel: 'ماسٹر کنٹرول پینل',
    actionVerifyPayments: 'رسیدوں کی تصدیق',
    actionManageRoles: 'کرداروں کا انتظام',
    apkUpdateSection: 'اینڈرائیڈ اے پی کے اور ایپ ورژن',
    latestVersionInstalled: 'تازہ ترین ورژن انسٹال ہے',
    downloadApkBtn: 'تازہ ترین اے پی کے ڈاؤن لوڈ کریں',
    checkUpdatesBtn: 'گٹ ہب ریلیز چیک کریں',

    // Chat
    chatHeader: 'محفوظ کمیونٹی پیغام رسانی',
    chatSubtitle: 'آف لائن قطار کے ساتھ فوری پیغام رسانی',
    chatSearchPlaceholder: 'ممبران یا عہدیدار تلاش کریں...',
    chatTypeMessage: 'پیغام لکھیں...',
    chatSend: 'بھیجیں',
    chatOfflineBanner: 'آف لائن موڈ — پیغامات قطار (🕒) میں محفوظ ہیں اور آن لائن ہوتے ہی خودکار بھیجے جائیں گے۔',
    statusQueued: 'قطار میں (آف لائن)',
    statusDelivered: 'پہنچ گیا',
    statusSeen: 'پڑھ لیا گیا',
    noConversations: 'گفتگو شروع کرنے کے لیے کسی بھی ممبر یا عہدیدار کو منتخب کریں۔',

    // Announcements
    announcementsHeader: 'آفیشل ایپ اور کمیونٹی اعلانات',
    tabOfficialApp: 'آفیشل ایپ 👑',
    tabCommunity: 'کمیونٹی 📢',
    tabArchive: 'تاریخی ریکارڈ',
    publishAnnouncementBtn: 'نیا اعلان شائع کریں',
    pinToTop: 'اوپر پن کریں',
    pinnedBadge: 'پن شدہ',
    urgentBadge: 'فوری',
    expiryLabel: 'اختتامی تاریخ اور وقت (اختیاری)',
    expiresOn: 'میعاد ختم',
    expiredOn: 'ختم شدہ',
    noAnnouncements: 'اس چینل میں کوئی فعال اعلان موجود نہیں۔',
    noArchivedAnnouncements: 'کوئی پرانا یا ختم شدہ اعلان موجود نہیں۔',

    // VIP Digital ID Card
    vipCardTitle: 'لگژری وی آئی پی ڈیجیٹل ممبرشپ کارڈ',
    vipPremiumMember: 'پریمیئم ممبر',
    vipMemberIdPrefix: 'ممبر آئی ڈی',
    vipFlipHint: 'کیو آر تصدیق اور مہر دیکھنے کے لیے کارڈ کو ٹیپ کریں',
    vipDownloadBtn: 'آئی ڈی کارڈ ڈاؤن لوڈ کریں',
    vipVerifyQrBtn: 'کیو آر کوڈ تصدیق',
    vipPrintBtn: 'کارڈ پرنٹ کریں',
    vipVerifiedAuthentic: 'کفایت کنیکٹ کا تصدیق شدہ مستند ممبر',
    vipBackTitle: 'آفیشل تصدیقی مہر',
    vipIssuedBy: 'مرکزی ایگزیکٹو کونسل سے مجاز',

    // Master Control Panel
    masterControlTitle: 'سپر ایڈمن ماسٹر کنٹرول پینل',
    masterPinLockedTitle: 'ماسٹر کنٹرول پینل مقفل ہے',
    masterPinCreateTitle: '4 تا 6 ہندسوں کا ماسٹر پن بنائیں',
    masterPinEnterPrompt: 'لائیو سیٹنگز کھولنے کے لیے اپنا 4 تا 6 ہندسوں کا پن درج کریں۔',
    masterPinUnlockBtn: 'ماسٹر کنٹرول کھولیں',
    masterPinSaveBtn: 'ماسٹر پن محفوظ کریں',
    masterPinResetOtp: 'ای میل او ٹی پی سے پن ری سیٹ کریں',

    // Generic
    saveChanges: 'تبدیلیاں محفوظ کریں',
    cancel: 'منسوخ کریں',
    close: 'بند کریں',
    approve: 'منظور کریں',
    reject: 'مسترد کریں',
    suspend: 'معطل کریں',
    activate: 'فعال کریں',
    promote: 'ترقی دیں',
    demote: 'تنزلی کریں',
    deleteLabel: 'حذف کریں',
    statusLabel: 'حیثیت',
    dateLabel: 'تاریخ',
    allLabel: 'تمام'
  }
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.en;

export function translate(
  language: AppLanguage,
  key: TranslationKey,
  overrides?: CustomCopyOverrides
): string {
  if (overrides) {
    if (key === 'welcomeSignInTitle') {
      const val = language === 'ur' ? overrides.welcomeHeadlineUr : overrides.welcomeHeadlineEn;
      if (val?.trim()) return val;
    }
    if (key === 'maintenanceDesc') {
      const val = language === 'ur' ? overrides.maintenanceMessageUr : overrides.maintenanceMessageEn;
      if (val?.trim()) return val;
    }
    if (key === 'tagline') {
      const val = language === 'ur' ? overrides.idCardFooterUr : overrides.idCardFooterEn;
      if (val?.trim()) return val;
    }
  }
  return TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key];
}

export function getRoleDisplayLabel(role: UserRole | string, language: AppLanguage): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return TRANSLATIONS[language].roleSuperAdmin;
    case 'ADMIN':
      return TRANSLATIONS[language].roleAdmin;
    case 'CO_ADMIN':
      return TRANSLATIONS[language].roleCoAdmin;
    default:
      return TRANSLATIONS[language].roleMember;
  }
}
