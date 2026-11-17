import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { AuthWelcomeGate } from './components/auth/AuthWelcomeGate';
import { BrandEmblem3D } from './components/common/BrandEmblem3D';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Dashboards (Strict 4 Roles)
import { SuperAdminDashboard } from './components/dashboard/SuperAdminDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { CoAdminDashboard } from './components/dashboard/CoAdminDashboard';
import { MemberDashboard } from './components/dashboard/MemberDashboard';

// Modules
import { MemberDirectory } from './components/modules/MemberDirectory';
import { ApprovalWorkflow } from './components/modules/ApprovalWorkflow';
import { FundsAndPayments } from './components/modules/FundsAndPayments';
import { ComplaintsManager } from './components/modules/ComplaintsManager';
import { AnnouncementsManager } from './components/modules/AnnouncementsManager';
import { StaffManagement } from './components/modules/StaffManagement';
import { AuditLogsView } from './components/modules/AuditLogsView';
import { ReportsView } from './components/modules/ReportsView';
import { ProfileSettings } from './components/modules/ProfileSettings';
import { ChatModule } from './components/modules/ChatModule';
import { OfficeBearersModule } from './components/modules/OfficeBearersModule';
import { ManageAppModule } from './components/modules/ManageAppModule';

// Modals
import { DigitalReceiptModal } from './components/modules/DigitalReceiptModal';
import { DigitalCardModal } from './components/modules/DigitalCardModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { LoginModal } from './components/auth/LoginModal';
import { KeyboardShortcutsModal } from './components/common/KeyboardShortcutsModal';
import { GlobalShortcutsHandler } from './components/common/GlobalShortcutsHandler';
import { NotificationsSlideOver } from './components/common/NotificationsSlideOver';
import { AppUpdateModal } from './components/common/AppUpdateModal';
import { MemberProfileModal } from './components/modules/MemberProfileModal';
import { IphoneSafariInstallBanner } from './components/common/IphoneSafariInstallBanner';

import {
  LayoutDashboard,
  MessageSquare,
  Coins,
  Megaphone,
  User as UserIcon,
  LogOut,
  Wrench,
  X,
  UserCheck,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { translate } from './data/translations';
import { canAccessRouteTab } from './utils/permissions';

const MainLayout: React.FC = () => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    selectedReceipt,
    setSelectedReceipt,
    selectedCardUser,
    setSelectedCardUser,
    inspectedUserProfile,
    setInspectedUserProfile,
    chats,
    language,
    appSettings,
    logoutFirebaseAuth,
    isCompleteProfileModalOpen,
    closeCompleteProfileModal,
    liveChatDisplayMode,
    unreadCommunityCount,
    restoreLiveChat,
    hideLiveChat,
    userNotifications,
    markNotificationAsRead,
    jumpToMemberApproval,
    iphoneShareNotice,
    dismissIphoneShareNotice
  } = useApp();

  const location = useLocation();
  const navigate = useNavigate();

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const prevSignedInRef = React.useRef<boolean>(Boolean(currentUser));
  useEffect(() => {
    const isNowSignedIn = Boolean(currentUser);
    if (!prevSignedInRef.current && isNowSignedIn) {
      setIsRegisterModalOpen(false);
      setIsLoginModalOpen(false);
    }
    prevSignedInRef.current = isNowSignedIn;
  }, [currentUser]);

  // Redirect unauthorized tabs back to dashboard cleanly
  useEffect(() => {
    if (!currentUser) return;
    if (!canAccessRouteTab(currentUser, activeTab || 'dashboard')) {
      setActiveTab('dashboard');
      return;
    }
    const expectedPath = `/${activeTab || 'dashboard'}`;
    if (location.pathname !== expectedPath) {
      navigate(expectedPath, { replace: true });
    }
  }, [activeTab, currentUser, location.pathname, navigate, setActiveTab]);

  // Signed-out gate (Instant Non-Blocking Boot within <100ms)
  if (!currentUser) {
    return (
      <>
        <div className="relative">
          <div className="fixed top-[max(0.5rem,env(safe-area-inset-top))] inset-x-3 z-50 max-w-md mx-auto pointer-events-auto">
            <IphoneSafariInstallBanner language={language} />
          </div>
          <AuthWelcomeGate onOpenRegisterModal={() => setIsRegisterModalOpen(true)} />
        </div>
        <RegisterModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
        />
      </>
    );
  }

  // Maintenance Screen for non-Super-Admin users when Maintenance Mode is enabled
  if (appSettings.maintenanceMode && currentUser.role !== 'SUPER_ADMIN') {
    return (
      <div
        className="min-h-[100dvh] w-full text-[#F8FAFC] flex flex-col items-center justify-center p-6 kc-safe-top kc-safe-bottom text-center"
        style={{
          backgroundColor: '#090D16',
          backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.12), transparent 55%), radial-gradient(circle at 15% 85%, rgba(212, 175, 55, 0.08), transparent 52%)'
        }}
      >
        <div className="max-w-md w-full kc-luxury-modal rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="flex flex-col items-center gap-3">
            <BrandEmblem3D size="lg" />
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#131C31] border border-[#38BDF8]/35 text-[#38BDF8] text-[11px] font-bold uppercase shadow-sm">
              <Wrench className="w-3.5 h-3.5" />
              <span>{translate(language, 'maintenanceTitle')}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {translate(language, 'maintenanceDesc', appSettings.textOverrides)}
          </p>
          <p className="text-[11px] text-slate-400 font-mono tabular-nums">
            {appSettings.contactHelpline} · {appSettings.contactEmail}
          </p>
          <button
            type="button"
            onClick={logoutFirebaseAuth}
            className="w-full py-2.5 rounded-xl bg-[#090D16] hover:bg-[#161F33] border border-[#D4AF37]/30 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer kc-pressable"
          >
            <LogOut className="w-4 h-4 text-[#F5D061]" />
            <span>{translate(language, 'logout')}</span>
          </button>
        </div>
      </div>
    );
  }

  const totalUnreadMessages = chats.reduce(
    (acc, c) => acc + ((c.unreadCounts && c.unreadCounts[currentUser.id]) || c.unreadCount || 0),
    0
  );

  // Render content based on current active tab & strict 4-role hierarchy + Founder governance rules
  const renderContent = () => {
    const renderDefaultDashboard = () => {
      if (currentUser.role === 'SUPER_ADMIN') return <SuperAdminDashboard />;
      if (currentUser.role === 'ADMIN') return <AdminDashboard />;
      if (currentUser.role === 'CO_ADMIN') return <CoAdminDashboard />;
      return <MemberDashboard />;
    };

    if (!canAccessRouteTab(currentUser, activeTab)) {
      return renderDefaultDashboard();
    }

    switch (activeTab) {
      case 'dashboard':
        return renderDefaultDashboard();
      case 'chat':
        return <ChatModule />;
      case 'office_bearers':
        return <OfficeBearersModule />;
      case 'manage_app':
        return <ManageAppModule />;
      case 'members':
        return <MemberDirectory />;
      case 'approvals':
        return <ApprovalWorkflow />;
      case 'funds':
      case 'verification':
        return <FundsAndPayments />;
      case 'complaints':
        return <ComplaintsManager />;
      case 'announcements':
        return <AnnouncementsManager />;
      case 'staff':
        return <StaffManagement />;
      case 'reports':
        return <ReportsView />;
      case 'audit':
        return <AuditLogsView />;
      case 'profile':
        return <ProfileSettings />;
      default:
        return renderDefaultDashboard();
    }
  };

  const mobileNavTabs = [
    { id: 'dashboard', label: translate(language, 'mobileNavHome'), icon: LayoutDashboard },
    { id: 'chat', label: translate(language, 'mobileNavChat'), icon: MessageSquare, badge: totalUnreadMessages },
    { id: 'funds', label: translate(language, 'mobileNavPay'), icon: Coins },
    { id: 'announcements', label: translate(language, 'mobileNavElaanat'), icon: Megaphone },
    { id: 'profile', label: translate(language, 'mobileNavProfile'), icon: UserIcon }
  ];

  const liveApprovalAlert =
    currentUser.role === 'SUPER_ADMIN'
      ? userNotifications.find(n => n.type === 'approval_request' && !n.read && !n.isRead) || null
      : null;

  return (
    <div
      className="h-[100vh] h-[100dvh] min-h-[100dvh] w-full max-w-full overflow-hidden overscroll-none touch-pan-y flex flex-col font-sans text-[#F8FAFC]"
      style={{
        backgroundColor: 'var(--kc-bg, #070D14)',
        backgroundImage:
          'radial-gradient(circle at 82% 6%, rgba(56, 189, 248, 0.10), transparent 44%), radial-gradient(circle at 12% 88%, rgba(212, 175, 55, 0.08), transparent 54%)'
      }}
    >
      {/* Global Keyboard Shortcuts Handler */}
      <GlobalShortcutsHandler
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Fixed Top Navigation Bar */}
      <Header
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        isSidebarOpen={isMobileSidebarOpen}
      />

      {/* Main App Workspace */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative w-full max-w-full">
        {/* Desktop Docked Sidebar */}
        <aside
          className="hidden md:flex md:w-64 md:shrink-0 h-full select-none z-20 border-r border-slate-400/15"
          style={{ backgroundColor: 'var(--kc-surface, #131C31)' }}
        >
          <Sidebar />
        </aside>

        {/* Mobile Sidebar Overlay (zero blur for 60FPS mobile performance) */}
        <div className="md:hidden overscroll-none touch-pan-y">
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className={`fixed inset-0 bg-[#090D16]/85 z-50 transition-opacity duration-200 cursor-pointer overscroll-none touch-pan-y ${
              isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            aria-hidden={!isMobileSidebarOpen}
          />

          <aside
            className={`fixed inset-y-0 left-0 border-r z-50 w-72 max-w-[85vw] h-full shadow-2xl border-slate-400/20 transition-transform duration-200 ease-out transform overscroll-none touch-pan-y ${
              isMobileSidebarOpen
                ? 'translate-x-0 pointer-events-auto'
                : '-translate-x-full pointer-events-none'
            }`}
            role="dialog"
            aria-modal="true"
            aria-label={language === 'ur' ? 'موبائل نیویگیشن مینو' : 'Mobile Navigation Menu'}
          >
            <Sidebar
              onClose={() => setIsMobileSidebarOpen(false)}
              isMobileDrawer={true}
            />
          </aside>
        </div>

        {/* Scrollable Center Content Viewport */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-none touch-pan-y p-3 sm:p-5 md:p-7 w-full min-w-0 max-w-full relative z-10">
          <div className="max-w-7xl mx-auto w-full min-w-0 space-y-4">
            <IphoneSafariInstallBanner language={language} />
            {liveApprovalAlert && (
              <div className="p-3.5 rounded-xl kc-emerald-panel flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#090D16] border border-[#D4AF37]/50 flex items-center justify-center shrink-0 shadow-inner">
                    <UserCheck className="w-4 h-4 text-[#F5D061]" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-[#F5D061] truncate">
                      {liveApprovalAlert.title}
                    </div>
                    <div className="text-[11px] text-slate-200 truncate">
                      {liveApprovalAlert.message}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      markNotificationAsRead(liveApprovalAlert.id);
                      jumpToMemberApproval(liveApprovalAlert.memberUid || liveApprovalAlert.entityId || null);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg kc-gold-button font-extrabold text-[11px] cursor-pointer"
                  >
                    <span>{translate(language, 'reviewApproveBtn')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => markNotificationAsRead(liveApprovalAlert.id)}
                    aria-label={language === 'ur' ? 'منظوری الرٹ بند کریں' : 'Dismiss approval alert'}
                    className="p-1.5 rounded-lg bg-[#090D16]/80 hover:bg-[#161F33] border border-[#D4AF37]/25 text-slate-300 cursor-pointer kc-pressable"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <ErrorBoundary key={activeTab} title={translate(language, 'viewRecoveryShield')}>
              {renderContent()}
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Fixed Mobile Bottom Navigation Bar with Android/iPhone Gesture Safe-Area Inset */}
      <nav
        aria-label="Mobile Primary Navigation"
        className="md:hidden shrink-0 w-full max-w-full bg-gradient-to-t from-[#090D16] to-[#131C31] border-t border-slate-400/20 px-1.5 pt-1.5 pb-[calc(env(safe-area-inset-bottom,12px)+8px)] z-50 flex items-center justify-around select-none overscroll-none touch-pan-y shadow-[0_-8px_24px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(148,163,184,0.14)]"
      >
        {mobileNavTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setIsMobileSidebarOpen(false);
              }}
              className={`relative z-50 min-w-[48px] min-h-[48px] flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl text-[10px] font-semibold transition-transform cursor-pointer kc-pressable ${
                isActive
                  ? 'text-[#38BDF8] bg-[#1E293B] border border-[#38BDF8]/45 shadow-[0_4px_14px_rgba(14,165,233,0.22),inset_0_1px_0_rgba(56,189,248,0.22)]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] border border-transparent'
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4 mb-0.5" />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#D4AF37] text-[#090D16] text-[9px] font-extrabold flex items-center justify-center leading-none tabular-nums">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="truncate max-w-full">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Modals & Slide-Overs */}
      <AppUpdateModal />

      {inspectedUserProfile && (
        <MemberProfileModal
          user={inspectedUserProfile}
          onClose={() => setInspectedUserProfile(null)}
        />
      )}

      <NotificationsSlideOver
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {selectedReceipt && (
        <DigitalReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {selectedCardUser && (
        <DigitalCardModal
          user={selectedCardUser}
          onClose={() => setSelectedCardUser(null)}
        />
      )}

      {/* Floating Golden Chat Bubble when Live Chat is Minimized */}
      {liveChatDisplayMode === 'MINIMIZED' && activeTab !== 'chat' && (
        <div className="fixed bottom-[72px] md:bottom-5 right-3 sm:right-5 z-40 flex items-center rounded-full bg-[#111726] border border-[#D4AF37]/70 shadow-[0_12px_32px_rgba(0,0,0,0.75),0_4px_18px_rgba(212,175,55,0.28),inset_0_1px_0_rgba(252,227,138,0.22)] overflow-hidden transition-transform duration-200 hover:-translate-y-0.5">
          <button
            type="button"
            onClick={restoreLiveChat}
            className="flex items-center gap-2 pl-3.5 pr-2.5 py-2 text-xs font-extrabold text-[#F5D061] hover:bg-[#161F33] cursor-pointer kc-pressable"
            title="Restore Live Chat Room"
          >
            <span className="relative flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-[#F5D061]" />
              {unreadCommunityCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center leading-none border border-[#090D16] tabular-nums">
                  {unreadCommunityCount > 99 ? '99+' : unreadCommunityCount}
                </span>
              )}
            </span>
            <span className="whitespace-nowrap">{translate(language, 'liveChatBtn')}</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              hideLiveChat();
            }}
            aria-label={language === 'ur' ? 'لائیو چیٹ ببل چھپائیں' : 'Hide Live Chat bubble'}
            title={language === 'ur' ? 'لائیو چیٹ ببل چھپائیں' : 'Hide Live Chat bubble'}
            className="px-2.5 py-2 text-slate-400 hover:text-white hover:bg-rose-950/60 border-l border-[#D4AF37]/30 cursor-pointer kc-pressable"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <RegisterModal
        isOpen={isRegisterModalOpen || isCompleteProfileModalOpen}
        onClose={() => {
          setIsRegisterModalOpen(false);
          closeCompleteProfileModal();
        }}
        completeProfileUser={isCompleteProfileModalOpen ? currentUser : null}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {iphoneShareNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-[max(4.25rem,calc(env(safe-area-inset-top)+3.75rem))] inset-x-3 sm:inset-x-auto sm:right-5 z-[90] sm:max-w-md rounded-2xl p-3.5 border border-[#38BDF8]/45 shadow-[0_14px_34px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(56,189,248,0.22)] text-[#F8FAFC]"
          style={{
            background: 'linear-gradient(135deg, #131C31 0%, #1E293B 58%, #0F172A 100%)',
          }}
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
              <div className="min-w-0 space-y-1 text-xs">
                <p className="font-extrabold text-[#F8FAFC] leading-snug">
                  Link copied! Send it on WhatsApp to iPhone users.
                </p>
                <p className="font-bold text-[#38BDF8] font-urdu-auto leading-snug" dir="rtl">
                  لنک کاپی ہو گیا! آئی فون ممبران کو واٹس ایپ پر بھیج دیں۔
                </p>
                <p className="text-[10px] font-mono text-[#94A3B8] truncate pt-0.5">
                  {iphoneShareNotice.url}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissIphoneShareNotice}
              aria-label={language === 'ur' ? 'بند کریں' : 'Close'}
              className="p-1 rounded-lg bg-[#090D16]/80 border border-slate-400/25 text-slate-300 hover:text-white shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary isRoot>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </ErrorBoundary>
  );
}
