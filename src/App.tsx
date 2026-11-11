import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { RoleSwitcherBar } from './components/common/RoleSwitcherBar';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';

// Dashboards
import { SuperAdminDashboard } from './components/dashboard/SuperAdminDashboard';
import { FinanceOfficerDashboard } from './components/dashboard/FinanceOfficerDashboard';
import { RegionalOfficerDashboard } from './components/dashboard/RegionalOfficerDashboard';
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

// Modals
import { DigitalReceiptModal } from './components/modules/DigitalReceiptModal';
import { DigitalCardModal } from './components/modules/DigitalCardModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { LoginModal } from './components/auth/LoginModal';
import { KeyboardShortcutsModal } from './components/common/KeyboardShortcutsModal';
import { GlobalShortcutsHandler } from './components/common/GlobalShortcutsHandler';
import { NotificationsSlideOver } from './components/common/NotificationsSlideOver';

const MainLayout: React.FC = () => {
  const { 
    currentUser, 
    activeTab, 
    selectedReceipt, 
    setSelectedReceipt,
    selectedCardUser,
    setSelectedCardUser 
  } = useApp();

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Render content based on current active tab & role
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (currentUser.role === 'SUPER_ADMIN') {
          return <SuperAdminDashboard />;
        } else if (currentUser.role === 'FINANCE_OFFICER') {
          return <FinanceOfficerDashboard />;
        } else if (currentUser.role === 'REGIONAL_OFFICER') {
          return <RegionalOfficerDashboard />;
        } else {
          return <MemberDashboard />;
        }

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
      />

      {/* Main App Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Role-Specific Sidebar */}
        <Sidebar />

        {/* Primary Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

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
