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
  Send,
  Award,
  Crown,
  X,
  FileCheck2,
  HelpCircle
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { BrandEmblem3D } from './BrandEmblem3D';
import { RoleBadge } from './RoleBadge';
import { translate } from '../../data/translations';
import { canAccessRouteTab } from '../../utils/permissions';

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
    setSelectedCardUser,
    openRukniyatForm,
    openTutorial,
    preferredChatMode,
    setPreferredChatMode,
    restoreLiveChat
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
      label: translate(language, 'communityRoomTab'),
      icon: MessageSquare,
      visible: true,
      badge: totalUnreadMessages > 0 ? totalUnreadMessages : null,
      badgeColor: 'bg-[#F5D061] text-[#0A0D12] font-bold'
    },
    {
      id: 'direct-chat',
      label: translate(language, 'actionOpenChat'),
      icon: Send,
      visible: true
    },
    {
      id: 'office_bearers',
      label: translate(language, 'navOfficeBearers'),
      icon: Award,
      visible: canAccessRouteTab(currentUser, 'office_bearers')
    },
    {
      id: 'members',
      label: translate(language, 'navMembers'),
      icon: Users,
      visible: canAccessRouteTab(currentUser, 'members')
    },
    {
      id: 'approvals',
      label: translate(language, 'navApprovals'),
      icon: CheckSquare,
      visible: canAccessRouteTab(currentUser, 'approvals'),
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
      badgeColor: 'bg-[#F5D061] text-[#0A0D12] font-bold'
    },
    {
      id: 'funds',
      label: translate(language, 'navFunds'),
      icon: Coins,
      visible: canAccessRouteTab(currentUser, 'funds'),
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
      id: 'rukn-form',
      label: translate(language, 'navRukniyatForm'),
      icon: FileCheck2,
      visible: true
    },
    {
      id: 'member-guide',
      label: translate(language, 'navMemberGuide'),
      icon: HelpCircle,
      visible: true
    },
    {
      id: 'complaints',
      label: translate(language, 'navComplaints'),
      icon: MessageSquareWarning,
      visible: canAccessRouteTab(currentUser, 'complaints'),
      badge: openComplaintsCount > 0 ? openComplaintsCount : null,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      id: 'announcements',
      label: translate(language, 'navAnnouncements'),
      icon: Megaphone,
      visible: canAccessRouteTab(currentUser, 'announcements')
    },
    {
      id: 'staff',
      label: translate(language, 'navStaff'),
      icon: ShieldCheck,
      visible: canAccessRouteTab(currentUser, 'staff')
    },
    {
      id: 'manage_app',
      label: `${translate(language, 'navMasterControl')} 👑`,
      icon: Crown,
      visible: canAccessRouteTab(currentUser, 'manage_app'),
      badge: language === 'ur' ? 'وی آئی پی' : 'VIP',
      badgeColor: 'bg-[#D4AF37]/20 text-[#F5D061] border border-[#D4AF37]/40'
    },
    {
      id: 'reports',
      label: translate(language, 'navReports'),
      icon: FileText,
      visible: canAccessRouteTab(currentUser, 'reports')
    },
    {
      id: 'audit',
      label: translate(language, 'navAudit'),
      icon: Clock,
      visible: canAccessRouteTab(currentUser, 'audit')
    }
  ];

  const appDisplayName = language === 'ur'
    ? (appSettings.appNameUr || translate('ur', 'appTitleShort'))
    : (appSettings.appName || translate('en', 'appTitleShort'));

  return (
    <div className="w-full h-full flex flex-col select-none text-[#94A3B8] bg-[#070D14] overflow-hidden overscroll-none touch-pan-y">
      {/* Mobile Drawer Header */}
      {(isMobileDrawer || onClose) && (
        <div className="flex items-center justify-between px-4 pt-[max(0.875rem,env(safe-area-inset-top))] pb-3.5 border-b border-slate-400/20 bg-[#131C31] shrink-0 shadow-[inset_0_1px_0_rgba(248,250,252,0.08)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandEmblem3D size="xs" />
            <div className="min-w-0">
              <span className="font-extrabold text-sm kc-gold-gradient-text block leading-tight truncate">
                {appDisplayName}
              </span>
              <span className="text-[10px] text-[#38BDF8] font-medium truncate block">
                {translate(language, 'tagline')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer kc-pressable shrink-0"
          >
            <X className="w-5 h-5 text-[#F5D061]" />
          </button>
        </div>
      )}

      {/* Role & Jurisdiction Card */}
      <div className="p-4 border-b border-slate-400/18 bg-gradient-to-b from-[#1E293B]/80 to-[#131C31] shrink-0 space-y-2 shadow-[inset_0_1px_0_rgba(248,250,252,0.06)]">
        <div className="flex items-center justify-between gap-2">
          <RoleBadge
            role={currentUser.role}
            isFounder={isFounderUser(currentUser)}
            isAuditOfficer={Boolean(currentUser.isAuditOfficer)}
            compact
          />
        </div>
        <div className="truncate">
          <span className="text-xs font-bold text-[#F8FAFC] block truncate">
            {currentUser.name}
          </span>
          <span className="text-[10px] text-[#38BDF8] block truncate font-mono mt-0.5 tabular-nums">
            {currentUser.membershipId || 'KC-PENDING'} · {currentUser.district || 'Pakistan'}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="p-3 flex-1 overflow-y-auto overscroll-none touch-pan-y space-y-1">
        {navItems.filter(item => item.visible).map(item => {
          const isActive =
            item.id === 'chat'
              ? activeTab === 'chat' && preferredChatMode === 'COMMUNITY'
              : item.id === 'direct-chat'
              ? activeTab === 'chat' && preferredChatMode === 'DIRECT'
              : activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'digital-card') {
                  setSelectedCardUser(currentUser);
                } else if (item.id === 'chat') {
                  restoreLiveChat();
                } else if (item.id === 'direct-chat') {
                  setPreferredChatMode('DIRECT');
                  setActiveTab('chat');
                } else if (item.id === 'rukn-form') {
                  openRukniyatForm();
                } else if (item.id === 'member-guide') {
                  openTutorial();
                } else {
                  setActiveTab(item.id);
                }
                if (onClose) onClose();
              }}
              className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 text-xs rounded-xl transition-all text-start cursor-pointer kc-pressable ${
                isActive
                  ? 'kc-gold-button font-bold'
                  : 'text-[#94A3B8] hover:bg-[#131C31] hover:text-[#F8FAFC] border border-transparent hover:border-slate-400/20'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#090D16]' : 'text-[#38BDF8]'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== null && item.badge !== undefined && (
                <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-full font-bold leading-none ${item.badgeColor || 'bg-[#131C31] text-[#F8FAFC]'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Install Widget */}
      <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-slate-400/18 bg-[#0F172A] space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-[#94A3B8]">
            {language === 'ur' ? 'موبائل ایپ' : 'Mobile & PWA App'}
          </span>
          <PWAInstallButton compact />
        </div>
      </div>
    </div>
  );
};
