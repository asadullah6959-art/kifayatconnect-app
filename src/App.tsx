import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { AuthWelcomeGate } from './components/auth/AuthWelcomeGate';

// Dashboards
import { SuperAdminDashboard } from './components/dashboard/SuperAdminDashboard';
import { FinanceOfficerDashboard } from './components/dashboard/FinanceOfficerDashboard';
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

import { LayoutDashboard, MessageSquare, Coins, Megaphone, User as UserIcon } from 'lucide-react';

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
    language
  } = useApp();

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Clean signed-out gate when no session exists (zero dummy users)
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

  const totalUnreadMessages = chats.reduce(
    (acc, c) => acc + (c.unreadCount || (c.unreadCounts && c.unreadCounts[currentUser.id]) || 0),
    0
  );

  // Render content based on current active tab & role
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (currentUser.role === 'SUPER_ADMIN') return <SuperAdminDashboard />;
        if (currentUser.role === 'FINANCE_OFFICER') return <FinanceOfficerDashboard />;
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
        return <FundsAndPayments />;
      case 'verification':
        return <FinanceOfficerDashboard />;
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
        if (currentUser.role === 'FINANCE_OFFICER') return <FinanceOfficerDashboard />;
        if (currentUser.role === 'ADMIN') return <AdminDashboard />;
        if (currentUser.role === 'CO_ADMIN') return <CoAdminDashboard />;
        return <MemberDashboard />;
    }
  };

  const mobileNavTabs = [
    { id: 'dashboard', label: language === 'ur' ? 'ہوم' : 'Home', icon: LayoutDashboard },
    { id: 'chat', label: language === 'ur' ? 'چیٹ' : 'Chat', icon: MessageSquare, badge: totalUnreadMessages },
    { id: 'funds', label: language === 'ur' ? 'ادائیگی' : 'Pay', icon: Coins },
    { id: 'announcements', label: language === 'ur' ? 'اعلانات' : 'Elaanat', icon: Megaphone },
    { id: 'profile', label: language === 'ur' ? 'پروفائل' : 'Profile', icon: UserIcon }
  ];

  return (
    <div className="h-[100vh] h-[100dvh] w-full max-w-full overflow-hidden bg-slate-100 dark:bg-slate-950 flex flex-col font-sans">
      {/* Global Keyboard Shortcuts Handler & Notification Toasts */}
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

      {/* Main App Workspace: only middle main area scrolls vertically */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative w-full max-w-full">
        {/* Desktop Docked Sidebar */}
        <aside className="hidden md:flex md:w-64 md:shrink-0 h-full border-r border-slate-800 bg-[#0a192f] select-none z-20">
          <Sidebar />
        </aside>

        {/* Mobile Sidebar Overlay (low-RAM solid translucent backdrop, zero blur) */}
        <div className="md:hidden">
          <div 
            onClick={() => setIsMobileSidebarOpen(false)}
            className={`fixed inset-0 bg-slate-950/85 z-50 transition-opacity duration-200 cursor-pointer ${
              isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            aria-hidden={!isMobileSidebarOpen}
          />

          <aside 
            className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-full shadow-2xl border-r border-slate-800 transition-transform duration-200 ease-out transform ${
              isMobileSidebarOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'
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
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Fixed Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Primary Navigation"
        className="md:hidden shrink-0 w-full max-w-full bg-[#0a192f] border-t border-slate-800 px-1.5 py-1.5 z-30 flex items-center justify-around select-none"
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
                isActive ? 'text-amber-400 bg-slate-900/90' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4 mb-0.5" />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-bold flex items-center justify-center leading-none">
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

      <RegisterModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
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
