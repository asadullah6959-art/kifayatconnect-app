import React, { useState, useCallback } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { AuthWelcomeGate } from './components/auth/AuthWelcomeGate';
import { SplashScreen } from './components/common/SplashScreen';
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

import {
  LayoutDashboard,
  MessageSquare,
  Coins,
  Megaphone,
  User as UserIcon,
  LogOut,
  Wrench,
  X
} from 'lucide-react';
import { translate } from './data/translations';

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
    hideLiveChat
  } = useApp();

  const [showSplash, setShowSplash] = useState(true);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (showSplash) {
    return (
      <SplashScreen
        appName={appSettings.appName}
        tagline={language === 'ur' ? appSettings.taglineUr : appSettings.tagline}
        language={language}
        onFinish={handleSplashFinish}
      />
    );
  }

  // Signed-out gate
  if (!currentUser) {
    return (
      <>
        <AuthWelcomeGate onOpenRegisterModal={() => setIsRegisterModalOpen(true)} />
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
      <div className="min-h-[100dvh] w-full bg-[#0A0D12] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-[#111622] border border-[#D4AF37]/35 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="flex flex-col items-center gap-3">
            <BrandEmblem3D size="lg" />
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 border border-[#D4AF37]/40 text-[#F5D061] text-[11px] font-bold uppercase">
              <Wrench className="w-3.5 h-3.5" />
              <span>{translate(language, 'maintenanceTitle')}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {translate(language, 'maintenanceDesc', appSettings.textOverrides)}
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            {appSettings.contactHelpline} · {appSettings.contactEmail}
          </p>
          <button
            type="button"
            onClick={logoutFirebaseAuth}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
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

  // Render content based on current active tab & strict 4-role hierarchy
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (currentUser.role === 'SUPER_ADMIN') return <SuperAdminDashboard />;
        if (currentUser.role === 'ADMIN') return <AdminDashboard />;
        if (currentUser.role === 'CO_ADMIN') return <CoAdminDashboard />;
        return <MemberDashboard />;

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
        if (currentUser.role === 'SUPER_ADMIN') return <SuperAdminDashboard />;
        if (currentUser.role === 'ADMIN') return <AdminDashboard />;
        if (currentUser.role === 'CO_ADMIN') return <CoAdminDashboard />;
        return <MemberDashboard />;
    }
  };

  const mobileNavTabs = [
    { id: 'dashboard', label: translate(language, 'mobileNavHome'), icon: LayoutDashboard },
    { id: 'chat', label: translate(language, 'mobileNavChat'), icon: MessageSquare, badge: totalUnreadMessages },
    { id: 'funds', label: translate(language, 'mobileNavPay'), icon: Coins },
    { id: 'announcements', label: translate(language, 'mobileNavElaanat'), icon: Megaphone },
    { id: 'profile', label: translate(language, 'mobileNavProfile'), icon: UserIcon }
  ];

  const isRtl = language === 'ur';

  return (
    <div
      className="h-[100vh] h-[100dvh] w-full max-w-full overflow-hidden flex flex-col font-sans text-slate-100"
      style={{ backgroundColor: 'var(--kc-bg, #0A0D12)' }}
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
          className={`hidden md:flex md:w-64 md:shrink-0 h-full select-none z-20 ${
            isRtl ? 'border-l border-[#D4AF37]/20' : 'border-r border-[#D4AF37]/20'
          }`}
          style={{ backgroundColor: 'var(--kc-surface, #111622)' }}
        >
          <Sidebar />
        </aside>

        {/* Mobile Sidebar Overlay (zero blur) */}
        <div className="md:hidden">
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className={`fixed inset-0 bg-[#0A0D12]/85 z-50 transition-opacity duration-200 cursor-pointer ${
              isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            aria-hidden={!isMobileSidebarOpen}
          />

          <aside
            className={`fixed inset-y-0 ${
              isRtl ? 'right-0 border-l' : 'left-0 border-r'
            } z-50 w-72 max-w-[85vw] h-full shadow-2xl border-[#D4AF37]/25 transition-transform duration-200 ease-out transform ${
              isMobileSidebarOpen
                ? 'translate-x-0 pointer-events-auto'
                : isRtl
                ? 'translate-x-full pointer-events-none'
                : '-translate-x-full pointer-events-none'
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
          >
            <Sidebar
              onClose={() => setIsMobileSidebarOpen(false)}
              isMobileDrawer={true}
            />
          </aside>
        </div>

        {/* Scrollable Center Content Viewport */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 md:p-7 w-full min-w-0 max-w-full relative z-10">
          <div className="max-w-7xl mx-auto w-full min-w-0">
            <ErrorBoundary key={activeTab} title="View Recovery Shield">
              {renderContent()}
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Fixed Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Primary Navigation"
        className="md:hidden shrink-0 w-full max-w-full bg-[#111622] border-t border-[#D4AF37]/25 px-1.5 py-1.5 z-30 flex items-center justify-around select-none"
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
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
                isActive ? 'text-[#F5D061] bg-[#043927]/60 border border-[#D4AF37]/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4 mb-0.5" />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#F5D061] text-[#0A0D12] text-[9px] font-extrabold flex items-center justify-center leading-none">
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
        <div className="fixed bottom-[72px] md:bottom-5 right-3 sm:right-5 z-40 flex items-center rounded-full bg-[#111622] border-2 border-[#D4AF37] shadow-[0_8px_28px_rgba(212,175,55,0.28)] overflow-hidden transition-transform duration-200 hover:-translate-y-0.5">
          <button
            type="button"
            onClick={restoreLiveChat}
            className="flex items-center gap-2 pl-3.5 pr-2.5 py-2 text-xs font-extrabold text-[#F5D061] hover:bg-[#161D2C] cursor-pointer"
            title="Restore Live Chat Room"
          >
            <span className="relative flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-[#F5D061]" />
              {unreadCommunityCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center leading-none border border-[#0A0D12]">
                  {unreadCommunityCount > 99 ? '99+' : unreadCommunityCount}
                </span>
              )}
            </span>
            <span className="whitespace-nowrap">Live Chat</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              hideLiveChat();
            }}
            aria-label="Hide Live Chat bubble"
            title="Hide Live Chat bubble"
            className="px-2.5 py-2 text-slate-400 hover:text-white hover:bg-rose-950/60 border-l border-[#D4AF37]/25 cursor-pointer"
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
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
