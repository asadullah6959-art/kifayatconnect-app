import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';

interface GlobalShortcutsHandlerProps {
  onOpenRegisterModal: () => void;
  onOpenShortcutsModal: () => void;
  onOpenNotifications?: () => void;
}

export const GlobalShortcutsHandler: React.FC<GlobalShortcutsHandlerProps> = ({
  onOpenRegisterModal,
  onOpenShortcutsModal,
  onOpenNotifications
}) => {
  const { 
    currentUser, 
    users, 
    switchUser, 
    setActiveTab, 
    toggleLanguage,
    setSelectedCardUser,
    setSelectedReceipt
  } = useApp();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 1800);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA' || activeElement?.tagName === 'SELECT';

      // 1. Help shortcut: '?' (Shift + /) when not inside an input field
      if (!isInput && e.key === '?' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onOpenShortcutsModal();
        return;
      }

      // 2. Language switch: Alt+L or Ctrl+Shift+L
      if ((e.altKey && (e.key === 'l' || e.key === 'L')) || (e.ctrlKey && e.shiftKey && (e.key === 'L' || e.key === 'l'))) {
        e.preventDefault();
        toggleLanguage();
        showToast('Language toggled (Alt+L)');
        return;
      }

      // 3. New Member Onboarding: Alt+N
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        onOpenRegisterModal();
        showToast('Opened Registration (Alt+N)');
        return;
      }

      // 4. Notifications Slide-Over: Alt+I
      if (e.altKey && (e.key === 'i' || e.key === 'I') && onOpenNotifications) {
        e.preventDefault();
        onOpenNotifications();
        showToast('Opened Notifications (Alt+I)');
        return;
      }

      // 5. Digital Card: Alt+C
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setSelectedCardUser(currentUser);
        showToast('Opened Digital Card (Alt+C)');
        return;
      }

      // 5. Role Persona Switching: Alt + Shift + 1/2/3/4
      if (e.altKey && e.shiftKey) {
        if (e.key === '!' || e.key === '1') {
          e.preventDefault();
          const admin = users.find(u => u.role === 'SUPER_ADMIN');
          if (admin) {
            switchUser(admin.id);
            showToast('Switched to Super Admin: Tariq Khan');
          }
          return;
        }
        if (e.key === '@' || e.key === '2') {
          e.preventDefault();
          const finance = users.find(u => u.role === 'FINANCE_OFFICER');
          if (finance) {
            switchUser(finance.id);
            showToast('Switched to Finance Officer: Ayesha Siddiqui');
          }
          return;
        }
        if (e.key === '#' || e.key === '3') {
          e.preventDefault();
          const regional = users.find(u => u.role === 'REGIONAL_OFFICER');
          if (regional) {
            switchUser(regional.id);
            showToast(`Switched to Regional Officer: Bilal Ahmed (${regional.region})`);
          }
          return;
        }
        if (e.key === '$' || e.key === '4') {
          e.preventDefault();
          const member = users.find(u => u.role === 'MEMBER');
          if (member) {
            switchUser(member.id);
            showToast('Switched to Member: Hamza Malik');
          }
          return;
        }
      }

      // 6. Navigation Hotkeys: Alt + [0-9]
      if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setActiveTab('dashboard');
            showToast('Navigated to Dashboard (Alt+1)');
            break;
          case '2':
            e.preventDefault();
            if (currentUser.role !== 'MEMBER') {
              setActiveTab('members');
              showToast('Navigated to Member Directory (Alt+2)');
            } else {
              showToast('Access Denied: Members cannot view central directory');
            }
            break;
          case '3':
            e.preventDefault();
            if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'REGIONAL_OFFICER') {
              setActiveTab('approvals');
              showToast('Navigated to Approvals Center (Alt+3)');
            } else {
              showToast('Access Denied: Approvals restricted to administrative officers');
            }
            break;
          case '4':
            e.preventDefault();
            setActiveTab('funds');
            showToast('Navigated to Funds & Contributions (Alt+4)');
            break;
          case '5':
            e.preventDefault();
            if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'FINANCE_OFFICER') {
              setActiveTab('verification');
              showToast('Navigated to Payment Verification (Alt+5)');
            } else {
              showToast('Access Denied: Payment verification restricted to Treasury');
            }
            break;
          case '6':
            e.preventDefault();
            setActiveTab('complaints');
            showToast('Navigated to Grievances & Complaints (Alt+6)');
            break;
          case '7':
            e.preventDefault();
            setActiveTab('announcements');
            showToast('Navigated to Bulletins & News (Alt+7)');
            break;
          case '8':
            e.preventDefault();
            if (currentUser.role === 'SUPER_ADMIN') {
              setActiveTab('staff');
              showToast('Navigated to Staff & RBAC (Alt+8)');
            } else {
              showToast('Access Denied: Staff RBAC is Super Admin exclusive');
            }
            break;
          case '9':
            e.preventDefault();
            setActiveTab('reports');
            showToast('Navigated to Audited Reports (Alt+9)');
            break;
          case '0':
            e.preventDefault();
            setActiveTab('audit');
            showToast('Navigated to Immutable Audit Logs (Alt+0)');
            break;
          case 'p':
          case 'P':
            e.preventDefault();
            setActiveTab('funds');
            showToast('Navigated to Contributions Ledger (Alt+P)');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser, users, switchUser, setActiveTab, toggleLanguage, onOpenRegisterModal, onOpenShortcutsModal, setSelectedCardUser]);

  return (
    <>
      {/* Floating shortcut toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 pointer-events-none transition-all duration-300 transform translate-y-0 opacity-100">
          <div className="bg-slate-900/95 text-white text-xs px-3.5 py-2 rounded-lg shadow-xl border border-emerald-500/40 backdrop-blur-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </>
  );
};
