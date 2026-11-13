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
  Clock,
  MessageSquare,
  Award,
  Settings,
  Sparkles,
  Download,
  X
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobileDrawer?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose, isMobileDrawer }) => {
  const { 
    currentUser, 
    activeTab, 
    setActiveTab, 
    applications, 
    payments, 
    complaints, 
    chats,
    appUpdates,
    language,
    setSelectedCardUser
  } = useApp();

  if (!currentUser) return null;

  // Pending counts
  const pendingApprovalsCount = currentUser.role === 'SUPER_ADMIN'
    ? applications.filter(a => a.status === 'RECOMMENDED_BY_DISTRICT' || a.status === 'RECOMMENDED_BY_REGION').length
    : currentUser.role === 'ADMIN'
    ? applications.filter(a => (a.district === (currentUser.assignedDistrict || currentUser.district)) && (a.status === 'PENDING_DISTRICT_REVIEW' || a.status === 'PENDING_REGIONAL_REVIEW')).length
    : 0;

  const pendingPaymentsCount = (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'FINANCE_OFFICER' || currentUser.role === 'ADMIN')
    ? payments.filter(p => p.status === 'PENDING_VERIFICATION').length
    : 0;

  const openComplaintsCount = currentUser.role === 'SUPER_ADMIN'
    ? complaints.filter(c => c.status === 'OPEN' || c.status === 'UNDER_REVIEW').length
    : currentUser.role === 'ADMIN'
    ? complaints.filter(c => (c.district === (currentUser.assignedDistrict || currentUser.district)) && (c.status === 'OPEN' || c.status === 'UNDER_REVIEW')).length
    : currentUser.role === 'CO_ADMIN'
    ? complaints.filter(c => (c.stateProvince === (currentUser.assignedStateProvince || currentUser.stateProvince)) && (c.status === 'OPEN' || c.status === 'UNDER_REVIEW')).length
    : currentUser.role === 'MEMBER'
    ? complaints.filter(c => c.userId === currentUser.id && c.status === 'OPEN').length
    : 0;

  const totalUnreadMessages = chats.reduce((acc, c) => acc + (c.unreadCount || (c.unreadCounts && c.unreadCounts[currentUser.id]) || 0), 0);

  // Nav item list tailored to role
  const navItems = [
    {
      id: 'dashboard',
      label: language === 'ur' ? 'ڈیش بورڈ' : 'Overview Dashboard',
      icon: LayoutDashboard,
      visible: true
    },
    {
      id: 'chat',
      label: language === 'ur' ? 'پیغامات و چیٹ' : 'Chat & Messages',
      icon: MessageSquare,
      visible: true,
      badge: totalUnreadMessages > 0 ? totalUnreadMessages : null,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold'
    },
    {
      id: 'office_bearers',
      label: language === 'ur' ? 'عہدیداران تنظیم' : 'Office-Bearers',
      icon: Award,
      visible: true
    },
    {
      id: 'members',
      label: language === 'ur' 
        ? 'ممبر ڈائریکٹری' 
        : currentUser.role === 'ADMIN'
        ? `${currentUser.assignedDistrict || currentUser.district || 'District'} Members`
        : currentUser.role === 'CO_ADMIN'
        ? `${currentUser.assignedStateProvince || currentUser.stateProvince || 'State'} Directory`
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
        : 'District Verification',
      icon: CheckSquare,
      visible: currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN',
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold'
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
      id: 'manage_app',
      label: language === 'ur' ? 'ایپ سیٹنگز و اپڈیٹس' : 'Manage App Console',
      icon: Settings,
      visible: currentUser.role === 'SUPER_ADMIN',
      badge: 'Admin',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
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
    <div className="w-full h-full flex flex-col select-none text-slate-300 bg-[#0a192f] overflow-hidden">
      {/* Mobile Drawer Header with Close Button */}
      {(isMobileDrawer || onClose) && (
        <div className="md:hidden flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold font-serif text-sm shadow-sm">
              KC
            </div>
            <div>
              <span className="font-bold text-sm text-white block leading-tight">
                {language === 'ur' ? 'کفایت کنیکٹ' : 'Kifayat Connect'}
              </span>
              <span className="text-[10px] text-amber-400 font-medium">
                {language === 'ur' ? 'شعبہ جاتی مینو' : 'Navigation Menu'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-amber-400" />
          </button>
        </div>
      )}

      {/* Scope / Role Identity Indicator */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 shrink-0">
        <div className="flex items-center gap-2.5">
          <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="truncate">
            <span className="text-[11px] font-semibold text-slate-200 block truncate">
              {currentUser.role === 'SUPER_ADMIN' && 'Central Headquarters'}
              {currentUser.role === 'FINANCE_OFFICER' && 'Central Treasury Desk'}
              {currentUser.role === 'ADMIN' && `${currentUser.assignedDistrict || currentUser.district || 'District'} Admin`}
              {currentUser.role === 'CO_ADMIN' && `${currentUser.assignedStateProvince || currentUser.stateProvince || 'State'} Co-Admin`}
              {currentUser.role === 'MEMBER' && 'Member Self-Service'}
            </span>
            <span className="text-[10px] text-amber-400/90 block truncate font-mono">
              {currentUser.role === 'MEMBER' 
                ? `ID: ${currentUser.membershipId || 'KC-PENDING'}` 
                : currentUser.assignedOfficeTitle ? currentUser.assignedOfficeTitle : `Role: ${currentUser.role}`}
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
                // Automatically close sidebar on mobile so dashboard takes full screen width
                if (onClose) {
                  onClose();
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/15'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-amber-400/80'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== null && item.badge !== undefined && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold leading-none ${item.badgeColor || 'bg-slate-800 text-white'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* PWA & Install Callout in Sidebar Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-slate-400">Mobile & Desktop App</span>
          <PWAInstallButton compact />
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          Installable PWA & Direct Android APK build ready.
        </p>
      </div>
    </div>
  );
};
