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

export const GlobalSearchBar: React.FC = () => {
  const { 
    currentUser, 
    users, 
    payments, 
    applications, 
    complaints, 
    setActiveTab, 
    setSelectedReceipt, 
    setSelectedCardUser 
  } = useApp();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isFinanceOfficer = currentUser.role === 'FINANCE_OFFICER';
  const isDistrictAdmin = currentUser.role === 'ADMIN';
  const isCoAdmin = currentUser.role === 'CO_ADMIN';
  const isMember = currentUser.role === 'MEMBER';

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
        user.cnic.includes(q) ||
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

    // All roles can access relevant reports
    reportsCatalog.push({
      id: 'rep_q4_stmt',
      title: 'Q4 2026 Audited Welfare Statement',
      type: 'Financial Statement',
      description: isMember 
        ? 'Personal contribution balance & tax receipt breakdown' 
        : 'Reconciled collections across central treasury ledgers',
      targetTab: 'reports'
    });

    if (isSuperAdmin || isFinanceOfficer) {
      reportsCatalog.push({
        id: 'rep_treasury_ledger',
        title: 'Central Treasury Ledger & Receipt Vouchers',
        type: 'Audit Ledger',
        description: 'Complete verified bank deposits and digital voucher history',
        targetTab: 'funds'
      });
      reportsCatalog.push({
        id: 'rep_annual_fund',
        title: 'Annual Welfare & Healthcare Fund Summary',
        type: 'Fund Report',
        description: 'Dispensary and education scholarship allocation matrix',
        targetTab: 'reports'
      });
    }

    if (isSuperAdmin || isDistrictAdmin || isCoAdmin) {
      reportsCatalog.push({
        id: 'rep_regional_quota',
        title: `${isDistrictAdmin ? (currentUser.assignedDistrict || 'District') : isCoAdmin ? (currentUser.assignedStateProvince || 'State') : 'Administrative'} Quota & Verification Report`,
        type: 'Governance Report',
        description: `Active member onboarding and compliance statistics`,
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

  // 4. Applications / Approvals search (for Super Admin & Regional Officer):
  const searchApplications = (): MembershipApplication[] => {
    if (isMember || isFinanceOfficer) return [];

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
    if (isSuperAdmin) return 'Super Admin Scope: Organization-Wide Search';
    if (isFinanceOfficer) return 'Finance Scope: Treasury, Transactions & Financial Reports';
    if (isDistrictAdmin) return `District Scope: Strictly ${currentUser.assignedDistrict || currentUser.district || 'Assigned District'} Records`;
    if (isCoAdmin) return `State Scope: Strictly ${currentUser.assignedStateProvince || currentUser.stateProvince || 'Assigned State'} Records`;
    return 'Member Scope: Personal Receipts & Welfare Reports';
  };

  const getPlaceholder = () => {
    if (isSuperAdmin) return 'Search members, receipts, reports (⌘K)...';
    if (isFinanceOfficer) return 'Search transactions, receipts, reports (⌘K)...';
    if (isDistrictAdmin) return `Search ${(currentUser.assignedDistrict || currentUser.district || 'District')} records (⌘K)...`;
    if (isCoAdmin) return `Search ${(currentUser.assignedStateProvince || currentUser.stateProvince || 'State')} records (⌘K)...`;
    return 'Search my receipts & reports (⌘K)...';
  };

  return (
    <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
          className="w-full text-xs pl-8 pr-12 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-2xs"
        />
        
        {query ? (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center gap-0.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-400 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 shadow-2xs">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden text-xs max-h-[85vh] flex flex-col"
        >
          {/* Top Scope Status Tag */}
          <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 truncate">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{getScopeDescription()}</span>
            </span>
            {query.trim() && (
              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                {totalResultsCount} results
              </span>
            )}
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-2">
            {/* If empty query and no typing: Quick Shortcuts */}
            {!query.trim() ? (
              <div className="p-2 space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Quick Access Reports & Ledgers
                </span>
                <div className="space-y-1">
                  {reportResults.map(rep => (
                    <button
                      key={rep.id}
                      onClick={() => handleSelectReport(rep)}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate">
                            {rep.title}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {rep.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Type to search members, receipt vouchers, or reference IDs</span>
                  <span className="font-mono">ESC to close</span>
                </div>
              </div>
            ) : totalResultsCount === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                <p>No matching records found for "{query}".</p>
                {isMember && (
                  <p className="text-[11px] text-slate-500">
                    Note: Members can only search their personal receipts and public reports.
                  </p>
                )}
                {isDistrictAdmin && (
                  <p className="text-[11px] text-slate-500">
                    Note: District Admin search is strictly scoped to {currentUser.assignedDistrict || currentUser.district}.
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* 1. MEMBERS SECTION (If allowed) */}
                {memberResults.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 block mb-1">
                      Members ({memberResults.length})
                    </span>
                    <div className="space-y-0.5">
                      {memberResults.map(member => (
                        <button
                          key={member.id}
                          onClick={() => handleSelectMember(member)}
                          className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
                              {member.name.charAt(0)}
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                {member.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {member.membershipId} · {member.region}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 ml-2">
                            <span className="font-mono text-[10px] font-bold text-slate-800 dark:text-slate-200">
                              PKR {member.totalContributed.toLocaleString()}
                            </span>
                            <span className="block text-[9px] text-emerald-600">View ID Card →</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. TRANSACTIONS & RECEIPTS SECTION */}
                {transactionResults.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 block mb-1">
                      Transactions & Receipts ({transactionResults.length})
                    </span>
                    <div className="space-y-0.5">
                      {transactionResults.map(tx => (
                        <button
                          key={tx.id}
                          onClick={() => handleSelectTransaction(tx)}
                          className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div className="truncate">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                                  {tx.receiptNumber}
                                </span>
                                <span className={`text-[9px] font-semibold px-1.5 rounded ${
                                  tx.status === 'VERIFIED'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                }`}>
                                  {tx.status}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 truncate">
                                {tx.userName} · {tx.fundCategory} · Ref: {tx.referenceNumber}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 ml-2">
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                              PKR {tx.amount.toLocaleString()}
                            </span>
                            <span className="block text-[9px] text-emerald-600">
                              {tx.status === 'VERIFIED' ? 'Open E-Receipt →' : 'View in Queue →'}
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
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 block mb-1">
                      Reports & Ledgers ({reportResults.length})
                    </span>
                    <div className="space-y-0.5">
                      {reportResults.map(rep => (
                        <button
                          key={rep.id}
                          onClick={() => handleSelectReport(rep)}
                          className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                            <div className="truncate">
                              <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                                {rep.title}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {rep.description}
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] text-blue-600 font-medium shrink-0 ml-2">Open →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. APPLICATIONS SECTION (If allowed) */}
                {applicationResults.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 block mb-1">
                      Membership Approvals ({applicationResults.length})
                    </span>
                    <div className="space-y-0.5">
                      {applicationResults.map(app => (
                        <button
                          key={app.id}
                          onClick={handleSelectApplication}
                          className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <CheckSquare className="w-4 h-4 text-amber-500 shrink-0" />
                            <div className="truncate">
                              <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                {app.applicantName}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {app.region} · {app.status}
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] text-amber-600 font-medium shrink-0 ml-2">Review →</span>
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
