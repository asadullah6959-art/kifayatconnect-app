import React from 'react';
import { useApp, isFounderUser } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Coins, 
  MessageSquareWarning, 
  Megaphone, 
  ShieldCheck, 
  FileText, 
  IdCard,
  Clock,
  MessageSquare,
  Award,
  Crown,
  X
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { BrandEmblem3D } from './BrandEmblem3D';
import { RoleBadge } from './RoleBadge';
import { translate } from '../../data/translations';

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
    language,
    appSettings,
    setSelectedCardUser
  } = useApp();

  if (!currentUser) return null;

  const pendingApprovalsCount = currentUser.role === 'SUPER_ADMIN'
    ? applications.filter(a => a.status === 'RECOMMENDED_BY_DISTRICT' || a.status === 'RECOMMENDED_BY_REGION').length
    : currentUser.role === 'ADMIN'
    ? applications.filter(a => (a.district === (currentUser.assignedDistrict || currentUser.district)) && (a.status === 'PENDING_DISTRICT_REVIEW' || a.status === 'PENDING_REGIONAL_REVIEW')).length
    : 0;

  const pendingPaymentsCount = (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN')
    ? payments.filter(p => p.status === 'PENDING_VERIFICATION').length
    : 0;

  const openComplaintsCount = currentUser.role === 'SUPER_ADMIN'
    ? complaints.filter(c => c.status === 'OPEN' || c.status === 'UNDER_REVIEW').length
    : currentUser.role === 'ADMIN'
    ? complaints.filter(c => (c.district === (currentUser.assignedDistrict || currentUser.district)) && (c.status === 'OPEN' || c.status === 'UNDER_REVIEW')).length
    : currentUser.role === 'CO_ADMIN'
    ? complaints.filter(c => (c.stateProvince === (currentUser.assignedStateProvince || currentUser.stateProvince)) && (c.status === 'OPEN' || c.status === 'UNDER_REVIEW')).length
    : complaints.filter(c => c.userId === currentUser.id && c.status === 'OPEN').length;

  const totalUnreadMessages = chats.reduce((acc, c) => acc + (c.unreadCount || (c.unreadCounts && c.unreadCounts[currentUser.id]) || 0), 0);

  const navItems = [
    {
      id: 'dashboard',
      label: translate(language, 'navDashboard'),
      icon: LayoutDashboard,
      visible: true
    },
    {
      id: 'chat',
      label: translate(language, 'navChat'),
      icon: MessageSquare,
      visible: true,
      badge: totalUnreadMessages > 0 ? totalUnreadMessages : null,
      badgeColor: 'bg-[#F5D061] text-[#0A0D12] font-bold'
    },
    {
      id: 'office_bearers',
      label: translate(language, 'navOfficeBearers'),
      icon: Award,
      visible: true
    },
    {
      id: 'members',
      label: translate(language, 'navMembers'),
      icon: Users,
      visible: true
    },
    {
      id: 'approvals',
      label: translate(language, 'navApprovals'),
      icon: CheckSquare,
      visible: currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN',
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
      badgeColor: 'bg-[#F5D061] text-[#0A0D12] font-bold'
    },
    {
      id: 'funds',
      label: translate(language, 'navFunds'),
      icon: Coins,
      visible: true,
      badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : null,
      badgeColor: 'bg-emerald-600 text-white'
    },
    {
      id: 'digital-card',
      label: translate(language, 'viewDigitalId'),
      icon: IdCard,
      visible: true
    },
    {
      id: 'complaints',
      label: translate(language, 'navComplaints'),
      icon: MessageSquareWarning,
      visible: true,
      badge: openComplaintsCount > 0 ? openComplaintsCount : null,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      id: 'announcements',
      label: translate(language, 'navAnnouncements'),
      icon: Megaphone,
      visible: true
    },
    {
      id: 'staff',
      label: translate(language, 'navStaff'),
      icon: ShieldCheck,
      visible: currentUser.role === 'SUPER_ADMIN'
    },
    {
      id: 'manage_app',
      label: `${translate(language, 'navMasterControl')} 👑`,
      icon: Crown,
      visible: currentUser.role === 'SUPER_ADMIN',
      badge: 'VIP',
      badgeColor: 'bg-[#D4AF37]/20 text-[#F5D061] border border-[#D4AF37]/40'
    },
    {
      id: 'reports',
      label: translate(language, 'navReports'),
      icon: FileText,
      visible: true
    },
    {
      id: 'audit',
      label: translate(language, 'navAudit'),
      icon: Clock,
      visible: currentUser.role !== 'MEMBER' || Boolean(currentUser.isAuditOfficer)
    }
  ];

  const appDisplayName = language === 'ur'
    ? (appSettings.appNameUr || translate('ur', 'appTitleShort'))
    : (appSettings.appName || translate('en', 'appTitleShort'));

  return (
    <div className="w-full h-full flex flex-col select-none text-slate-300 bg-[#0A0D12] overflow-hidden overscroll-none touch-pan-y">
      {/* Mobile Drawer Header */}
      {(isMobileDrawer || onClose) && (
        <div className="md:hidden flex items-center justify-between px-4 py-3.5 border-b border-[#D4AF37]/20 bg-[#111622] shrink-0">
          <div className="flex items-center gap-2.5">
            <BrandEmblem3D size="xs" />
            <div>
              <span className="font-extrabold text-sm kc-gold-gradient-text block leading-tight">
                {appDisplayName}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">
                {translate(language, 'tagline')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#161D2C] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-[#F5D061]" />
          </button>
        </div>
      )}

      {/* Role & Jurisdiction Card */}
      <div className="p-4 border-b border-[#D4AF37]/20 bg-[#111622]/90 shrink-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <RoleBadge
            role={currentUser.role}
            isFounder={isFounderUser(currentUser)}
            isAuditOfficer={Boolean(currentUser.isAuditOfficer)}
            compact
          />
        </div>
        <div className="truncate">
          <span className="text-xs font-bold text-white block truncate">
            {currentUser.name}
          </span>
          <span className="text-[10px] text-[#D4AF37] block truncate font-mono mt-0.5">
            {currentUser.membershipId || 'KC-PENDING'} · {currentUser.district || 'Pakistan'}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="p-3 flex-1 overflow-y-auto overscroll-none touch-pan-y space-y-1">
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
                if (onClose) onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-xl transition-all text-start cursor-pointer ${
                isActive
                  ? 'kc-gold-button font-bold'
                  : 'text-slate-300 hover:bg-[#161D2C] hover:text-white border border-transparent hover:border-[#D4AF37]/20'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0A0D12]' : 'text-[#D4AF37]'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== null && item.badge !== undefined && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold leading-none ${item.badgeColor || 'bg-[#161D2C] text-white'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Install Widget */}
      <div className="p-3 border-t border-[#D4AF37]/20 bg-[#111622] space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-slate-400">
            {language === 'ur' ? 'موبائل ایپ' : 'Mobile & PWA App'}
          </span>
          <PWAInstallButton compact />
        </div>
      </div>
    </div>
  );
};
