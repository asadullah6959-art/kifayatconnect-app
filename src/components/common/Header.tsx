import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Languages, 
  User as UserIcon, 
  LogOut, 
  ExternalLink, 
  IdCard, 
  Plus, 
  Keyboard, 
  Bell, 
  ShieldCheck,
  MessageSquare,
  Award,
  Sparkles,
  Download,
  Menu,
  X
} from 'lucide-react';
import { GlobalSearchBar } from './GlobalSearchBar';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  onOpenRegisterModal: () => void;
  onOpenLoginModal: () => void;
  onOpenShortcutsModal?: () => void;
  onOpenNotifications?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenRegisterModal, 
  onOpenLoginModal,
  onOpenShortcutsModal,
  onOpenNotifications,
  onToggleSidebar,
  isSidebarOpen 
}) => {
  const { 
    currentUser, 
    activeTab, 
    setActiveTab, 
    language, 
    toggleLanguage,
    setSelectedCardUser,
    unreadNotificationsCount,
    isFirebaseLive,
    firebaseUser,
    logoutFirebaseAuth,
    latestPublishedUpdate
  } = useApp();

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'FINANCE_OFFICER':
        return 'Finance Officer';
      case 'ADMIN':
        return `District Admin · ${currentUser.assignedDistrict || currentUser.district || 'District'}`;
      case 'CO_ADMIN':
        return `State Co-Admin · ${currentUser.assignedStateProvince || currentUser.stateProvince || 'State'}`;
      case 'MEMBER':
        return `Member · ${currentUser.membershipId || 'KC-PENDING'}`;
      default:
        return role;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 md:gap-6 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 bg-[#0a192f] border-b border-slate-800 text-white shadow-md">
      {/* Zone 1: Mobile Hamburger Button (☰) & Wordmark */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Hamburger Menu Button (☰) on Mobile screens */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isSidebarOpen}
          className="md:hidden p-2 rounded-xl text-amber-400 hover:text-amber-300 hover:bg-slate-800/80 active:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center border border-amber-500/30 shrink-0"
          title="Toggle Navigation Menu (☰)"
        >
          {isSidebarOpen ? (
            <X className="w-5 h-5 text-amber-400" />
          ) : (
            <Menu className="w-5 h-5 text-amber-400" />
          )}
        </button>

        <div 
          onClick={() => {
            setActiveTab('dashboard');
            if (onToggleSidebar && isSidebarOpen) onToggleSidebar();
          }} 
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none whitespace-nowrap shrink-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
            <span className="font-serif text-base sm:text-lg leading-none">KC</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-white leading-none flex items-center gap-1.5">
              {language === 'ur' ? 'کفایت کنیکٹ' : 'Kifayat Connect'}
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hidden xs:inline-block">
                v2.1
              </span>
            </span>
            <span className="text-[9px] sm:text-[10px] text-amber-400 font-medium tracking-wide">
              {language === 'ur' ? 'ویلفیئر و گورننس' : 'Welfare & Governance'}
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden xl:flex items-center gap-5 text-xs font-semibold text-slate-300">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`hover:text-amber-400 transition-colors py-1 cursor-pointer ${
            activeTab === 'dashboard' ? 'text-amber-400 font-bold border-b-2 border-amber-400' : ''
          }`}
        >
          {language === 'ur' ? 'ڈیش بورڈ' : 'Dashboard'}
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`hover:text-amber-400 transition-colors py-1 flex items-center gap-1 cursor-pointer ${
            activeTab === 'chat' ? 'text-amber-400 font-bold border-b-2 border-amber-400' : ''
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{language === 'ur' ? 'چیٹ' : 'Chat'}</span>
        </button>

        <button
          onClick={() => setActiveTab('office_bearers')}
          className={`hover:text-amber-400 transition-colors py-1 flex items-center gap-1 cursor-pointer ${
            activeTab === 'office_bearers' ? 'text-amber-400 font-bold border-b-2 border-amber-400' : ''
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>{language === 'ur' ? 'عہدیداران' : 'Office-Bearers'}</span>
        </button>

        {currentUser.role !== 'MEMBER' && (
          <button
            onClick={() => setActiveTab('members')}
            className={`hover:text-amber-400 transition-colors py-1 cursor-pointer ${
              activeTab === 'members' ? 'text-amber-400 font-bold border-b-2 border-amber-400' : ''
            }`}
          >
            {language === 'ur' ? 'ارکان' : 'Members'}
          </button>
        )}

        {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') && (
          <button
            onClick={() => setActiveTab('approvals')}
            className={`hover:text-amber-400 transition-colors py-1 cursor-pointer ${
              activeTab === 'approvals' ? 'text-amber-400 font-bold border-b-2 border-amber-400' : ''
            }`}
          >
            {language === 'ur' ? 'منظوریاں' : 'Approvals'}
          </button>
        )}

        <button
          onClick={() => setActiveTab('funds')}
          className={`hover:text-amber-400 transition-colors py-1 cursor-pointer ${
            activeTab === 'funds' ? 'text-amber-400 font-bold border-b-2 border-amber-400' : ''
          }`}
        >
          {language === 'ur' ? 'فنڈز' : 'Contributions'}
        </button>

        <button
          onClick={() => setActiveTab('complaints')}
          className={`hover:text-amber-400 transition-colors py-1 cursor-pointer ${
            activeTab === 'complaints' ? 'text-amber-400 font-bold border-b-2 border-amber-400' : ''
          }`}
        >
          {language === 'ur' ? 'شکایات' : 'Grievances'}
        </button>
      </nav>

      {/* Global Role-Gated Search Bar */}
      <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-1">
        <GlobalSearchBar />
      </div>

      {/* Zone 3: Actions & Account profile */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* PWA Install Button */}
        <div className="hidden sm:block">
          <PWAInstallButton />
        </div>

        {/* Keyboard Shortcuts Guide */}
        {onOpenShortcutsModal && (
          <button
            onClick={onOpenShortcutsModal}
            className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Keyboard Shortcuts Guide (?)"
          >
            <Keyboard className="w-3.5 h-3.5 text-slate-400" />
            <kbd className="hidden md:inline-block font-mono text-[9px] px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">
              ?
            </kbd>
          </button>
        )}

        {/* Language switch */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Switch Language (English / اردو)"
        >
          <Languages className="w-3.5 h-3.5 text-amber-400" />
          <span>{language === 'en' ? 'اردو' : 'English'}</span>
        </button>

        {/* Global Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0 cursor-pointer"
          title={language === 'ur' ? 'اطلاعات (الرٹس)' : 'Notifications & Alerts'}
          aria-label="Open notifications"
        >
          <Bell className="w-4 h-4 text-slate-300" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-slate-950 bg-amber-400 rounded-full shadow-xs">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* New Member Registration CTA */}
        <button
          onClick={onOpenRegisterModal}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{language === 'ur' ? 'نئی رکنیت' : 'Join Member'}</span>
        </button>

        {/* Current User Profile Pill with dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(prev => !prev)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 transition-colors text-left cursor-pointer border border-slate-800 hover:border-slate-700"
          >
            <img 
              src={currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=0a192f&color=d4af37&size=64`}
              alt={currentUser.name} 
              className="w-8 h-8 rounded-full object-cover border border-amber-500/30"
            />
            <div className="hidden lg:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-white whitespace-nowrap">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-amber-400/90 whitespace-nowrap font-mono">
                {getRoleBadge(currentUser.role)}
              </span>
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div 
              onMouseLeave={() => setShowProfileMenu(false)}
              className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 text-xs text-slate-200"
            >
              <div className="px-3.5 py-2.5 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-white">{currentUser.name}</p>
                  {isFirebaseLive && (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                      Live Firebase
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-[11px] truncate font-mono mt-0.5">{currentUser.email}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold">
                  <span>{currentUser.role}</span>
                  <span>·</span>
                  <span>{currentUser.assignedDistrict || currentUser.assignedStateProvince || 'Headquarters'}</span>
                </div>
              </div>

              {currentUser.role === 'MEMBER' && (
                <button
                  onClick={() => {
                    setSelectedCardUser(currentUser);
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-800 text-slate-200 text-left cursor-pointer"
                >
                  <IdCard className="w-3.5 h-3.5 text-amber-400" />
                  <span>View Digital Membership Card</span>
                </button>
              )}

              <button
                onClick={() => {
                  setActiveTab('profile');
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-800 text-slate-200 text-left cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Account Profile & Security</span>
              </button>

              {currentUser.role === 'SUPER_ADMIN' && (
                <button
                  onClick={() => {
                    setActiveTab('manage_app');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-800 text-amber-400 text-left cursor-pointer font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Manage App & Update Center</span>
                </button>
              )}

              <div className="border-t border-slate-800 my-1 pt-1">
                {isFirebaseLive ? (
                  <button
                    onClick={async () => {
                      await logoutFirebaseAuth();
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-rose-500/10 text-rose-400 text-left cursor-pointer font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out from Firebase ({firebaseUser?.email})</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onOpenLoginModal();
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-amber-500/10 text-amber-400 text-left cursor-pointer font-medium"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Sign in / Verify Email OTP</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
