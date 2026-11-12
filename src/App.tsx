import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { RoleSwitcherBar } from './components/common/RoleSwitcherBar';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';

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

const MainLayout: React.FC = () => {
  const { 
    currentUser, 
    activeTab, 
    selectedReceipt, 
    setSelectedReceipt,
    selectedCardUser,
    setSelectedCardUser,
    inspectedUserProfile,
    setInspectedUserProfile
  } = useApp();

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Render content based on current active tab & role
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (currentUser.role === 'SUPER_ADMIN') {
          return <SuperAdminDashboard />;
        } else if (currentUser.role === 'FINANCE_OFFICER') {
          return <FinanceOfficerDashboard />;
        } else if (currentUser.role === 'ADMIN') {
          return <AdminDashboard />;
        } else if (currentUser.role === 'CO_ADMIN') {
          return <CoAdminDashboard />;
        } else {
          return <MemberDashboard />;
        }

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
        return <SuperAdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans">
      {/* Top Demo Simulation Persona Bar */}
      <RoleSwitcherBar />

      {/* Global Keyboard Shortcuts Handler & Notification Toasts */}
      <GlobalShortcutsHandler
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Top Navigation Bar complying with 3-zone contract */}
      <Header 
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        isSidebarOpen={isMobileSidebarOpen}
      />

      {/* Main App Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Docked Sidebar (Permanently docked in normal flow on md+ screens, hidden on mobile) */}
        <aside className="hidden md:flex md:w-64 md:shrink-0 h-full border-r border-slate-800 bg-[#0a192f] select-none z-20">
          <Sidebar />
        </aside>

        {/* Mobile Sidebar Overlay (Sits completely as an overlay on mobile screens when active, never pushing main content) */}
        <div className="md:hidden">
          {/* Backdrop Dimming Layer */}
          <div 
            onClick={() => setIsMobileSidebarOpen(false)}
            className={`fixed inset-0 bg-black/75 backdrop-blur-xs z-50 transition-opacity duration-300 ease-in-out cursor-pointer ${
              isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            aria-hidden={!isMobileSidebarOpen}
          />

          {/* Slide-Over Drawer Container (Floating panel with high z-index above main content) */}
          <aside 
            className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-full shadow-2xl border-r border-slate-800 transition-transform duration-300 ease-out transform ${
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

        {/* Primary Content Viewport (Takes full 100% width on mobile, completely unpushed) */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 w-full min-w-0 relative z-10">
          <div className="max-w-7xl mx-auto w-full">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* In-App Update Modal Prompt */}
      <AppUpdateModal />

      {/* Member Profile Inspector Modal */}
      {inspectedUserProfile && (
        <MemberProfileModal
          user={inspectedUserProfile}
          onClose={() => setInspectedUserProfile(null)}
        />
      )}

      {/* Global Interactive Modals & Slide-Overs */}
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
