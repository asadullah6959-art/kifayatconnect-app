import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  X, 
  Users, 
  Receipt, 
  FileText, 
  CheckSquare, 
  ShieldCheck, 
  MapPin, 
  ArrowRight,
  MessageSquareWarning,
  Coins
} from 'lucide-react';
import { PaymentTransaction, User, MembershipApplication } from '../../types';
import { mapLegacyRegionToHierarchy } from '../../data/locationData';
import { canAccessRouteTab } from '../../utils/permissions';
import { canViewUserCnic } from '../../utils/privacy';

export const GlobalSearchBar: React.FC = () => {
  const { 
    currentUser, 
    users, 
    payments, 
    applications, 
    complaints, 
    setActiveTab, 
    setSelectedReceipt, 
    setSelectedCardUser,
    language
  } = useApp();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isDistrictAdmin = currentUser?.role === 'ADMIN';
  const isCoAdmin = currentUser?.role === 'CO_ADMIN';
  const isMember = currentUser?.role === 'MEMBER';

  // Keyboard shortcut listener (Cmd+K / Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Members search - Permission Enforced:
  const searchMembers = (): User[] => {
    // Members have NO permission to search or view directory
    if (isMember) return [];
    
    return users.filter(user => {
      if (user.role !== 'MEMBER') return false;
      const uFb = mapLegacyRegionToHierarchy(user.region);
      const uDist = user.district || uFb.district;
      const uProv = user.stateProvince || uFb.stateProvince;
      const uTeh = user.tehsil || uFb.tehsil || '';
      const uUC = user.unionCouncil || uFb.unionCouncil || '';

      // District Admin is strictly restricted to assigned district
      if (isDistrictAdmin) {
        const myDist = currentUser.assignedDistrict || currentUser.district;
        if (uDist !== myDist && user.region !== currentUser.region) return false;
      }
      if (isCoAdmin) {
        const myProv = currentUser.assignedStateProvince || currentUser.stateProvince;
        if (uProv !== myProv) return false;
      }
      
      const q = query.toLowerCase();
      return (
        user.name.toLowerCase().includes(q) ||
        (user.membershipId && user.membershipId.toLowerCase().includes(q)) ||
        (canViewUserCnic(currentUser, user) && user.cnic.includes(q)) ||
        uDist.toLowerCase().includes(q) ||
        uProv.toLowerCase().includes(q) ||
        uTeh.toLowerCase().includes(q) ||
        uUC.toLowerCase().includes(q) ||
        (user.region ? user.region.toLowerCase().includes(q) : false)
      );
    }).slice(0, 4);
  };

  // 2. Transactions / Receipts search - Permission Enforced:
  const searchTransactions = (): PaymentTransaction[] => {
    return payments.filter(tx => {
      const txFb = mapLegacyRegionToHierarchy(tx.userRegion);
      const txDist = tx.district || txFb.district;
      const txProv = tx.stateProvince || txFb.stateProvince;

      // Members only see their own transactions
      if (isMember && tx.userId !== currentUser.id) return false;
      // District Admins only see transactions from their district
      if (isDistrictAdmin) {
        const myDist = currentUser.assignedDistrict || currentUser.district;
        if (txDist !== myDist && tx.userRegion !== currentUser.region) return false;
      }
      if (isCoAdmin) {
        const myProv = currentUser.assignedStateProvince || currentUser.stateProvince;
        if (txProv !== myProv) return false;
      }

      const q = query.toLowerCase();
      return (
        tx.receiptNumber.toLowerCase().includes(q) ||
        tx.userName.toLowerCase().includes(q) ||
        tx.referenceNumber.toLowerCase().includes(q) ||
        tx.fundCategory.toLowerCase().includes(q) ||
        tx.amount.toString().includes(q) ||
        txDist.toLowerCase().includes(q) ||
        txProv.toLowerCase().includes(q)
      );
    }).slice(0, 4);
  };

  // 3. Reports search - Permission Enforced:
  interface ReportResult {
    id: string;
    title: string;
    type: string;
    description: string;
    targetTab: string;
  }

  const searchReports = (): ReportResult[] => {
    const reportsCatalog: ReportResult[] = [];
    const canViewReportsTab = canAccessRouteTab(currentUser, 'reports');

    if (canViewReportsTab) {
      reportsCatalog.push({
        id: 'rep_q4_stmt',
        title: language === 'ur' ? 'سہ ماہی 2026 آڈٹ شدہ ویلفیئر گوشوارہ' : 'Q4 2026 Audited Welfare Statement',
        type: language === 'ur' ? 'مالی گوشوارہ' : 'Financial Statement',
        description: language === 'ur' ? 'مرکزی خزانے کے کھاتوں کی تصدیق شدہ وصولیاں' : 'Reconciled collections across central treasury ledgers',
        targetTab: 'reports'
      });
    }

    if (isSuperAdmin) {
      reportsCatalog.push({
        id: 'rep_treasury_ledger',
        title: language === 'ur' ? 'مرکزی خزانہ لیجر اور رسید واؤچرز' : 'Central Treasury Ledger & Receipt Vouchers',
        type: language === 'ur' ? 'آڈٹ لیجر' : 'Audit Ledger',
        description: language === 'ur' ? 'تصدیق شدہ بینک ڈپازٹس اور ڈیجیٹل واؤچر ریکارڈ' : 'Complete verified bank deposits and digital voucher history',
        targetTab: 'funds'
      });
      if (canViewReportsTab) {
        reportsCatalog.push({
          id: 'rep_annual_fund',
          title: language === 'ur' ? 'سالانہ ویلفیئر اور صحت فنڈ خلاصہ' : 'Annual Welfare & Healthcare Fund Summary',
          type: language === 'ur' ? 'فنڈ رپورٹ' : 'Fund Report',
          description: language === 'ur' ? 'ڈسپنسری اور تعلیمی وظائف کی تقسیم کا ریکارڈ' : 'Dispensary and education scholarship allocation matrix',
          targetTab: 'reports'
        });
      }
    } else if (isMember) {
      reportsCatalog.push({
        id: 'rep_my_funds',
        title: language === 'ur' ? 'ذاتی ماہانہ فنڈ اور رسیدیں' : 'My Monthly Fund & Receipts',
        type: language === 'ur' ? 'ادائیگی' : 'Payments',
        description: language === 'ur' ? 'ذاتی ادائیگی کی تاریخ اور ڈیجیٹل رسیدیں دیکھیں' : 'Personal contribution history and verified digital receipts',
        targetTab: 'funds'
      });
    }

    if (canViewReportsTab && (isDistrictAdmin || isCoAdmin)) {
      reportsCatalog.push({
        id: 'rep_regional_quota',
        title: language === 'ur'
          ? `${isDistrictAdmin ? (currentUser.assignedDistrict || 'ضلع') : (currentUser.assignedStateProvince || 'صوبہ')} کوٹہ اور تصدیقی رپورٹ`
          : `${isDistrictAdmin ? (currentUser.assignedDistrict || 'District') : (currentUser.assignedStateProvince || 'State')} Quota & Verification Report`,
        type: language === 'ur' ? 'گورننس رپورٹ' : 'Governance Report',
        description: language === 'ur' ? 'فعال ممبران اور منظوریوں کے اعداد و شمار' : 'Active member onboarding and compliance statistics',
        targetTab: 'reports'
      });
    }

    if (!query.trim()) return reportsCatalog.slice(0, 3);

    const q = query.toLowerCase();
    return reportsCatalog.filter(rep => 
      rep.title.toLowerCase().includes(q) || 
      rep.description.toLowerCase().includes(q) ||
      rep.type.toLowerCase().includes(q)
    );
  };

  // 4. Applications / Approvals search (for Super Admin & District Admin):
  const searchApplications = (): MembershipApplication[] => {
    if (!canAccessRouteTab(currentUser, 'approvals')) return [];

    return applications.filter(app => {
      const aFb = mapLegacyRegionToHierarchy(app.region);
      const aDist = app.district || aFb.district;
      const aProv = app.stateProvince || aFb.stateProvince;

      if (isDistrictAdmin) {
        const myDist = currentUser.assignedDistrict || currentUser.district;
        if (aDist !== myDist && app.region !== currentUser.region) return false;
      }
      if (isCoAdmin) {
        const myProv = currentUser.assignedStateProvince || currentUser.stateProvince;
        if (aProv !== myProv) return false;
      }

      const q = query.toLowerCase();
      return (
        app.applicantName.toLowerCase().includes(q) ||
        app.cnic.includes(q) ||
        aDist.toLowerCase().includes(q) ||
        aProv.toLowerCase().includes(q) ||
        (app.tehsil && app.tehsil.toLowerCase().includes(q)) ||
        (app.oldMembershipNo && app.oldMembershipNo.toLowerCase().includes(q))
      );
    }).slice(0, 3);
  };

  const memberResults = query.trim() ? searchMembers() : [];
  const transactionResults = query.trim() ? searchTransactions() : [];
  const reportResults = searchReports();
  const applicationResults = query.trim() ? searchApplications() : [];

  const totalResultsCount = 
    memberResults.length + 
    transactionResults.length + 
    (query.trim() ? reportResults.length : 0) + 
    applicationResults.length;

  const handleSelectMember = (member: User) => {
    setSelectedCardUser(member);
    setIsOpen(false);
    setQuery('');
  };

  const handleSelectTransaction = (tx: PaymentTransaction) => {
    if (tx.status === 'VERIFIED') {
      setSelectedReceipt(tx);
    } else {
      setActiveTab('funds');
    }
    setIsOpen(false);
    setQuery('');
  };

  const handleSelectReport = (rep: ReportResult) => {
    setActiveTab(rep.targetTab);
    setIsOpen(false);
    setQuery('');
  };

  const handleSelectApplication = () => {
    setActiveTab('approvals');
    setIsOpen(false);
    setQuery('');
  };

  // Role scope explanation badge for transparency
  const getScopeDescription = () => {
    if (isSuperAdmin) return language === 'ur' ? 'سپر ایڈمن دائرہ کار: مکمل تنظیم میں تلاش' : 'Super Admin Scope: Organization-Wide Search';
    if (isDistrictAdmin) return language === 'ur' ? `ضلعی دائرہ کار: صرف ${currentUser.assignedDistrict || currentUser.district || 'متعلقہ ضلع'}` : `District Scope: Strictly ${currentUser.assignedDistrict || currentUser.district || 'Assigned District'} Records`;
    if (isCoAdmin) return language === 'ur' ? `صوبائی دائرہ کار: صرف ${currentUser.assignedStateProvince || currentUser.stateProvince || 'متعلقہ صوبہ'}` : `State Scope: Strictly ${currentUser.assignedStateProvince || currentUser.stateProvince || 'Assigned State'} Records`;
    return language === 'ur' ? 'ممبر دائرہ کار: ذاتی رسیدیں اور رپورٹس' : 'Member Scope: Personal Receipts & Welfare Reports';
  };

  const getPlaceholder = () => {
    if (language === 'ur') {
      if (isSuperAdmin) return 'ممبران، رسیدیں، رپورٹس تلاش کریں...';
      if (isDistrictAdmin) return `${currentUser.assignedDistrict || currentUser.district || 'ضلع'} ریکارڈ تلاش کریں...`;
      if (isCoAdmin) return `${currentUser.assignedStateProvince || currentUser.stateProvince || 'صوبہ'} ریکارڈ تلاش کریں...`;
      return 'اپنی رسیدیں اور رپورٹس تلاش کریں...';
    }
    if (isSuperAdmin) return 'Search members, receipts, reports...';
    if (isDistrictAdmin) return `Search ${(currentUser.assignedDistrict || currentUser.district || 'District')} records...`;
    if (isCoAdmin) return `Search ${(currentUser.assignedStateProvince || currentUser.stateProvince || 'State')} records...`;
    return 'Search my receipts & reports...';
  };

  if (!currentUser) return null;

  return (
    <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-[#E5E4E2] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder={getPlaceholder()}
          className="kc-luxury-input w-full text-xs pl-8 pr-12 py-1.5 rounded-xl"
        />
        
        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#E5E4E2] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="kc-luxury-modal absolute left-0 right-0 mt-2 rounded-2xl z-50 overflow-hidden text-xs max-h-[85vh] flex flex-col"
        >
          {/* Top Scope Status Tag */}
          <div className="px-3.5 py-2 bg-[#071812] border-b border-[#E5E4E2]/25 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5 truncate">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{getScopeDescription()}</span>
            </span>
            {query.trim() && (
              <span className="text-[10px] text-[#E5E4E2] font-mono tabular-nums shrink-0">
                {language === 'ur' ? `${totalResultsCount} نتائج` : `${totalResultsCount} results`}
              </span>
            )}
          </div>

          <div className="overflow-y-auto divide-y divide-[#E5E4E2]/15 p-2 space-y-2">
            {/* If empty query and no typing: Quick Shortcuts */}
            {!query.trim() ? (
              <div className="p-2 space-y-3">
                <span className="text-[10px] uppercase font-bold text-[#E5E4E2] tracking-wider block">
                  {language === 'ur' ? 'فوری رپورٹس اور کھاتے' : 'Quick Access Reports & Ledgers'}
                </span>
                <div className="space-y-1">
                  {reportResults.map(rep => (
                    <button
                      key={rep.id}
                      onClick={() => handleSelectReport(rep)}
                      className="kc-pressable w-full text-left p-2 rounded-xl hover:bg-[#161F33] transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-white text-xs truncate">
                            {rep.title}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {rep.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#E5E4E2] shrink-0 ml-2" />
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#E5E4E2]/20 text-[10px] text-slate-400 flex items-center justify-between gap-2">
                  <span>{language === 'ur' ? 'ممبران، رسیدیں یا ریفرنس آئی ڈی تلاش کرنے کے لیے لکھیں' : 'Type to search members, receipt vouchers, or reference IDs'}</span>
                  <span className="font-mono text-[#E5E4E2] shrink-0">{language === 'ur' ? 'بند کرنے کے لیے باہر ٹیپ کریں' : 'Tap outside to close'}</span>
                </div>
              </div>
            ) : totalResultsCount === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                <p>{language === 'ur' ? `"${query}" کے لیے کوئی ریکارڈ نہیں ملا۔` : `No matching records found for "${query}".`}</p>
                {isMember && (
                  <p className="text-[11px] text-slate-500">
                    {language === 'ur' ? 'نوٹ: ممبران صرف اپنی ذاتی رسیدیں اور عوامی رپورٹس تلاش کر سکتے ہیں۔' : 'Note: Members can only search their personal receipts and public reports.'}
                  </p>
                )}
                {isDistrictAdmin && (
                  <p className="text-[11px] text-slate-500">
                    {language === 'ur' ? `نوٹ: ضلعی ایڈمن کی تلاش ${currentUser.assignedDistrict || currentUser.district} تک محدود ہے۔` : `Note: District Admin search is strictly scoped to ${currentUser.assignedDistrict || currentUser.district}.`}
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* 1. MEMBERS SECTION (If allowed) */}
                {memberResults.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] uppercase font-bold text-[#E5E4E2] tracking-wider px-2 block mb-1">
                      {language === 'ur' ? `ممبران (${memberResults.length})` : `Members (${memberResults.length})`}
                    </span>
                    <div className="space-y-0.5">
                      {memberResults.map(member => (
                        <button
                          key={member.id}
                          onClick={() => handleSelectMember(member)}
                          className="kc-pressable w-full text-left p-2 rounded-xl hover:bg-[#161F33] transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div className="w-7 h-7 rounded-full bg-[#0D2A1F] border border-[#059669]/40 text-[#059669] font-bold flex items-center justify-center text-xs shrink-0">
                              {member.name.charAt(0)}
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-white text-xs">
                                {member.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {member.membershipId} · {member.region}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 ml-2">
                            <span className="font-mono tabular-nums text-[10px] font-bold text-[#E5E4E2]">
                              PKR {member.totalContributed.toLocaleString()}
                            </span>
                            <span className="block text-[9px] text-emerald-400">
                              {language === 'ur' ? 'آئی ڈی کارڈ دیکھیں →' : 'View ID Card →'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. TRANSACTIONS & RECEIPTS SECTION */}
                {transactionResults.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-bold text-[#E5E4E2] tracking-wider px-2 block mb-1">
                      {language === 'ur' ? `ادائیگیاں اور رسیدیں (${transactionResults.length})` : `Transactions & Receipts (${transactionResults.length})`}
                    </span>
                    <div className="space-y-0.5">
                      {transactionResults.map(tx => (
                        <button
                          key={tx.id}
                          onClick={() => handleSelectTransaction(tx)}
                          className="kc-pressable w-full text-left p-2 rounded-xl hover:bg-[#161F33] transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Receipt className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div className="truncate">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-white text-xs">
                                  {tx.receiptNumber}
                                </span>
                                <span className={`text-[9px] font-semibold px-1.5 rounded border ${
                                  tx.status === 'VERIFIED'
                                    ? 'bg-[#0D2A1F] text-[#059669] border-[#059669]/45'
                                    : 'bg-amber-500/15 text-[#E5E4E2] border-[#E5E4E2]/45'
                                }`}>
                                  {tx.status}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 truncate">
                                {tx.userName} · {tx.fundCategory} · {language === 'ur' ? 'حوالہ:' : 'Ref:'} {tx.referenceNumber}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 ml-2">
                            <span className="font-mono tabular-nums text-xs font-bold text-white">
                              PKR {tx.amount.toLocaleString()}
                            </span>
                            <span className="block text-[9px] text-emerald-400">
                              {tx.status === 'VERIFIED'
                                ? (language === 'ur' ? 'ای-رسید کھولیں →' : 'Open E-Receipt →')
                                : (language === 'ur' ? 'قطار دیکھیں →' : 'View in Queue →')}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. REPORTS SECTION */}
                {reportResults.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-bold text-[#E5E4E2] tracking-wider px-2 block mb-1">
                      {language === 'ur' ? `رپورٹس اور کھاتے (${reportResults.length})` : `Reports & Ledgers (${reportResults.length})`}
                    </span>
                    <div className="space-y-0.5">
                      {reportResults.map(rep => (
                        <button
                          key={rep.id}
                          onClick={() => handleSelectReport(rep)}
                          className="kc-pressable w-full text-left p-2 rounded-xl hover:bg-[#161F33] transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                            <div className="truncate">
                              <p className="font-semibold text-white text-xs">
                                {rep.title}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {rep.description}
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] text-[#E5E4E2] font-medium shrink-0 ml-2">
                            {language === 'ur' ? 'کھولیں →' : 'Open →'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. APPLICATIONS SECTION (If allowed) */}
                {applicationResults.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-bold text-[#E5E4E2] tracking-wider px-2 block mb-1">
                      {language === 'ur' ? `ممبرشپ منظوریاں (${applicationResults.length})` : `Membership Approvals (${applicationResults.length})`}
                    </span>
                    <div className="space-y-0.5">
                      {applicationResults.map(app => (
                        <button
                          key={app.id}
                          onClick={handleSelectApplication}
                          className="kc-pressable w-full text-left p-2 rounded-xl hover:bg-[#161F33] transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <CheckSquare className="w-4 h-4 text-[#E5E4E2] shrink-0" />
                            <div className="truncate">
                              <p className="font-bold text-white text-xs">
                                {app.applicantName}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {app.region} · {app.status}
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] text-[#E5E4E2] font-medium shrink-0 ml-2">
                            {language === 'ur' ? 'جائزہ لیں →' : 'Review →'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
