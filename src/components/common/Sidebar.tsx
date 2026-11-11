import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Coins, 
  Receipt, 
  MessageSquareWarning, 
  Megaphone, 
  ShieldCheck, 
  FileText, 
  IdCard,
  Building2,
  Clock
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { 
    currentUser, 
    activeTab, 
    setActiveTab, 
    applications, 
    payments, 
    complaints, 
    language,
    setSelectedCardUser
  } = useApp();

  // Pending counts
  const pendingApprovalsCount = currentUser.role === 'SUPER_ADMIN'
    ? applications.filter(a => a.status === 'RECOMMENDED_BY_REGION').length
    : currentUser.role === 'REGIONAL_OFFICER'
    ? applications.filter(a => a.region === currentUser.region && a.status === 'PENDING_REGIONAL_REVIEW').length
    : 0;

  const pendingPaymentsCount = (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'FINANCE_OFFICER')
    ? payments.filter(p => p.status === 'PENDING_VERIFICATION').length
    : 0;

  const openComplaintsCount = currentUser.role === 'SUPER_ADMIN'
    ? complaints.filter(c => c.status === 'OPEN' || c.status === 'UNDER_REVIEW').length
    : currentUser.role === 'REGIONAL_OFFICER'
    ? complaints.filter(c => c.region === currentUser.region && (c.status === 'OPEN' || c.status === 'UNDER_REVIEW')).length
    : currentUser.role === 'MEMBER'
    ? complaints.filter(c => c.userId === currentUser.id && c.status === 'OPEN').length
    : 0;

  // Nav item list tailored to role
  const navItems = [
    {
      id: 'dashboard',
      label: language === 'ur' ? 'ڈیش بورڈ' : 'Overview Dashboard',
      icon: LayoutDashboard,
      visible: true
    },
    {
      id: 'members',
      label: language === 'ur' 
        ? 'ممبر ڈائریکٹری' 
        : currentUser.role === 'REGIONAL_OFFICER' 
        ? `${(currentUser.district || currentUser.region || 'District').split(' ')[0]} Members` 
        : 'Member Directory',
      icon: Users,
      visible: currentUser.role !== 'MEMBER',
      badge: null
    },
    {
      id: 'approvals',
      label: language === 'ur' 
        ? 'رکنیت منظوریاں' 
        : currentUser.role === 'SUPER_ADMIN' 
        ? 'Final Approvals' 
        : 'Regional Verification',
      icon: CheckSquare,
      visible: currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'REGIONAL_OFFICER',
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
      badgeColor: 'bg-amber-500 text-white'
    },
    {
      id: 'funds',
      label: language === 'ur' 
        ? 'فنڈز و رقوم' 
        : currentUser.role === 'MEMBER' 
        ? 'My Contributions' 
        : 'Funds & Accounts',
      icon: Coins,
      visible: true
    },
    {
      id: 'verification',
      label: language === 'ur' ? 'ادائیگیوں کی تصدیق' : 'Payment Verification',
      icon: Receipt,
      visible: currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'FINANCE_OFFICER',
      badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : null,
      badgeColor: 'bg-emerald-600 text-white'
    },
    {
      id: 'digital-card',
      label: language === 'ur' ? 'ڈیجیٹل کارڈ' : 'Digital Member ID Card',
      icon: IdCard,
      visible: currentUser.role === 'MEMBER'
    },
    {
      id: 'complaints',
      label: language === 'ur' 
        ? 'شکایات کا ازالہ' 
        : currentUser.role === 'MEMBER' 
        ? 'Grievance & Support' 
        : 'Complaints Desk',
      icon: MessageSquareWarning,
      visible: true,
      badge: openComplaintsCount > 0 ? openComplaintsCount : null,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      id: 'announcements',
      label: language === 'ur' ? 'اعلانات و خبریں' : 'Bulletins & News',
      icon: Megaphone,
      visible: true
    },
    {
      id: 'staff',
      label: language === 'ur' ? 'انتظامی افسران' : 'Staff & Roles (RBAC)',
      icon: ShieldCheck,
      visible: currentUser.role === 'SUPER_ADMIN'
    },
    {
      id: 'reports',
      label: language === 'ur' ? 'مالیاتی و علاقائی رپورٹس' : 'Statements & Reports',
      icon: FileText,
      visible: true
    },
    {
      id: 'audit',
      label: language === 'ur' ? 'آڈٹ لاگز' : 'Audit Trail',
      icon: Clock,
      visible: true
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Scope / Role Identity Indicator */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="truncate">
            <span className="text-[11px] font-semibold text-slate-200 block truncate">
              {currentUser.role === 'SUPER_ADMIN' && 'Headquarters Executive'}
              {currentUser.role === 'FINANCE_OFFICER' && 'Central Treasury Desk'}
              {currentUser.role === 'REGIONAL_OFFICER' && `${currentUser.region} Office`}
              {currentUser.role === 'MEMBER' && 'Member Self-Service Portal'}
            </span>
            <span className="text-[10px] text-slate-400 block truncate">
              {currentUser.role === 'MEMBER' 
                ? `ID: ${currentUser.membershipId || 'KC-PENDING'}` 
                : `Role: ${currentUser.role}`}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="p-3 flex-1 overflow-y-auto space-y-1">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-2 py-1 block">
          {language === 'ur' ? 'شعبہ جات' : 'Management Modules'}
        </span>

        {navItems.filter(item => item.visible).map(item => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'digital-card') {
                  setSelectedCardUser(currentUser);
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-md transition-colors text-left ${
                isActive
                  ? 'bg-emerald-600 text-white font-medium shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== null && item.badge !== undefined && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold leading-none ${item.badgeColor || 'bg-slate-700 text-white'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Security & Authority Rules Callout */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-slate-300">Access Authority</span>
          <span className="text-[10px] text-emerald-400 font-mono">ENFORCED</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          {currentUser.role === 'SUPER_ADMIN' && 'Full organization control & final approval rights.'}
          {currentUser.role === 'FINANCE_OFFICER' && 'Financial transactions & receipt generation only.'}
          {currentUser.role === 'REGIONAL_OFFICER' && `Restricted to ${currentUser.region} regional data.`}
          {currentUser.role === 'MEMBER' && 'Personal membership, receipts, and grievance filing.'}
        </p>
      </div>
    </aside>
  );
};
