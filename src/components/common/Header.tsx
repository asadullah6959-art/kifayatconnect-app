import React, { useState } from 'react';
import { useApp, isFounderUser } from '../../context/AppContext';
import { 
  Languages, 
  User as UserIcon, 
  LogOut, 
  IdCard, 
  Plus, 
  Keyboard, 
  Bell, 
  ShieldCheck,
  MessageSquare,
  Award,
  Crown,
  Menu,
  X
} from 'lucide-react';
import { GlobalSearchBar } from './GlobalSearchBar';
import { PWAInstallButton } from './PWAInstallButton';
import { BrandEmblem3D } from './BrandEmblem3D';
import { RoleBadge } from './RoleBadge';
import { translate } from '../../data/translations';

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
    appSettings,
    isOnline
  } = useApp();

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  if (!currentUser) return null;

  const displayAppName = language === 'ur'
    ? (appSettings.appNameUr || translate('ur', 'appTitleShort'))
    : (appSettings.appName || translate('en', 'appTitleShort'));

  return (
    <header className="shrink-0 z-30 w-full max-w-full flex items-center justify-between gap-2 sm:gap-4 md:gap-6 px-2.5 sm:px-4 md:px-6 py-2.5 bg-[#0A0D12] border-b border-[#D4AF37]/25 text-white shadow-md">
      {/* Zone 1: Mobile Hamburger & 3D Brand Emblem */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isSidebarOpen}
          className="md:hidden p-2 rounded-xl text-[#F5D061] hover:bg-[#161D2C] transition-colors cursor-pointer flex items-center justify-center border border-[#D4AF37]/30 shrink-0"
        >
          {isSidebarOpen ? (
            <X className="w-5 h-5 text-[#F5D061]" />
          ) : (
            <Menu className="w-5 h-5 text-[#F5D061]" />
          )}
        </button>

        <div 
          onClick={() => {
            setActiveTab('dashboard');
            if (onToggleSidebar && isSidebarOpen) onToggleSidebar();
          }} 
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none whitespace-nowrap shrink-0"
        >
          <BrandEmblem3D size="sm" />
          <div className="flex flex-col">
            <span className="text-sm sm:text-base md:text-lg font-extrabold tracking-tight kc-gold-gradient-text leading-none flex items-center gap-1.5">
              {displayAppName}
            </span>
            <span className="text-[9px] sm:text-[10px] text-emerald-400 font-semibold tracking-wide mt-0.5">
              {language === 'ur'
                ? (appSettings.taglineUr || translate('ur', 'tagline'))
                : (appSettings.tagline || translate('en', 'tagline'))}
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Desktop Quick Nav */}
      <nav className="hidden xl:flex items-center gap-5 text-xs font-semibold text-slate-300">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`hover:text-[#F5D061] transition-colors py-1 cursor-pointer ${
            activeTab === 'dashboard' ? 'text-[#F5D061] font-bold border-b-2 border-[#D4AF37]' : ''
          }`}
        >
          {translate(language, 'navDashboard')}
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`hover:text-[#F5D061] transition-colors py-1 flex items-center gap-1 cursor-pointer ${
            activeTab === 'chat' ? 'text-[#F5D061] font-bold border-b-2 border-[#D4AF37]' : ''
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{translate(language, 'navChat')}</span>
        </button>

        <button
          onClick={() => setActiveTab('office_bearers')}
          className={`hover:text-[#F5D061] transition-colors py-1 flex items-center gap-1 cursor-pointer ${
            activeTab === 'office_bearers' ? 'text-[#F5D061] font-bold border-b-2 border-[#D4AF37]' : ''
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>{translate(language, 'navOfficeBearers')}</span>
        </button>

        {currentUser.role !== 'MEMBER' && (
          <button
            onClick={() => setActiveTab('members')}
            className={`hover:text-[#F5D061] transition-colors py-1 cursor-pointer ${
              activeTab === 'members' ? 'text-[#F5D061] font-bold border-b-2 border-[#D4AF37]' : ''
            }`}
          >
            {translate(language, 'navMembers')}
          </button>
        )}

        {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') && (
          <button
            onClick={() => setActiveTab('approvals')}
            className={`hover:text-[#F5D061] transition-colors py-1 cursor-pointer ${
              activeTab === 'approvals' ? 'text-[#F5D061] font-bold border-b-2 border-[#D4AF37]' : ''
            }`}
          >
            {translate(language, 'navApprovals')}
          </button>
        )}

        <button
          onClick={() => setActiveTab('funds')}
          className={`hover:text-[#F5D061] transition-colors py-1 cursor-pointer ${
            activeTab === 'funds' ? 'text-[#F5D061] font-bold border-b-2 border-[#D4AF37]' : ''
          }`}
        >
          {translate(language, 'navFunds')}
        </button>

        <button
          onClick={() => setActiveTab('complaints')}
          className={`hover:text-[#F5D061] transition-colors py-1 cursor-pointer ${
            activeTab === 'complaints' ? 'text-[#F5D061] font-bold border-b-2 border-[#D4AF37]' : ''
          }`}
        >
          {translate(language, 'navComplaints')}
        </button>
      </nav>

      {/* Global Search Bar */}
      <div className="hidden sm:block flex-1 max-w-xs md:max-w-md mx-1 min-w-0">
        <GlobalSearchBar />
      </div>

      {/* Zone 3: Actions & Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 shrink-0">
        {!isOnline && (
          <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {translate(language, 'offline')}
          </span>
        )}

        <div className="hidden sm:block">
          <PWAInstallButton />
        </div>

        {onOpenShortcutsModal && (
          <button
            onClick={onOpenShortcutsModal}
            className="hidden md:flex items-center gap-1 px-2 py-1.5 text-xs text-slate-300 hover:bg-[#161D2C] rounded-lg transition-colors cursor-pointer"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard className="w-3.5 h-3.5 text-slate-400" />
            <kbd className="font-mono text-[9px] px-1 py-0.5 bg-[#111622] border border-[#D4AF37]/30 rounded text-slate-400">
              ?
            </kbd>
          </button>
        )}

        {/* Language switch */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold text-[#F5D061] bg-[#111622] hover:bg-[#161D2C] border border-[#D4AF37]/30 rounded-xl transition-colors cursor-pointer"
          title="Switch Language (English / اردو)"
        >
          <Languages className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>{translate(language, 'languageToggle')}</span>
        </button>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-300 hover:text-[#F5D061] hover:bg-[#161D2C] rounded-xl transition-colors shrink-0 cursor-pointer border border-transparent hover:border-[#D4AF37]/25"
          title={translate(language, 'notifications')}
          aria-label={translate(language, 'notifications')}
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-[#0A0D12] bg-[#F5D061] rounded-full shadow-xs">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* VIP Digital ID Quick Pill */}
        <button
          onClick={() => setSelectedCardUser(currentUser)}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl kc-gold-button hover:brightness-110 transition-all cursor-pointer"
        >
          <IdCard className="w-3.5 h-3.5" />
          <span>{translate(language, 'viewDigitalId')}</span>
        </button>

        {/* Profile Pill + Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(prev => !prev)}
            className="flex items-center gap-2 p-1 rounded-xl bg-[#111622] hover:bg-[#161D2C] transition-colors text-start cursor-pointer border border-[#D4AF37]/30"
          >
            <img 
              src={currentUser.avatarUrl || currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=043927&color=F5D061&size=64`}
              alt={currentUser.name} 
              className="w-8 h-8 rounded-full object-cover border border-[#D4AF37]/60"
            />
            <div className="hidden lg:flex flex-col text-start leading-tight pe-1.5">
              <span className="text-xs font-bold text-white whitespace-nowrap max-w-[130px] truncate">
                {currentUser.name}
              </span>
              <div className="mt-0.5">
                <RoleBadge role={currentUser.role} isFounder={isFounderUser(currentUser)} compact />
              </div>
            </div>
          </button>

          {showProfileMenu && (
            <div 
              onMouseLeave={() => setShowProfileMenu(false)}
              className="absolute end-0 mt-2 w-68 bg-[#111622] border border-[#D4AF37]/35 rounded-2xl shadow-2xl py-2 z-50 text-xs text-slate-200"
            >
              <div className="px-3.5 py-2.5 border-b border-[#D4AF37]/20">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-white truncate">{currentUser.name}</p>
                  {isFirebaseLive && (
                    <span className="text-[9px] bg-emerald-500/15 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30 shrink-0">
                      Live
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-[11px] truncate font-mono mt-0.5">{currentUser.email}</p>
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <RoleBadge role={currentUser.role} isFounder={isFounderUser(currentUser)} compact />
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedCardUser(currentUser);
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-[#161D2C] text-[#F5D061] text-start cursor-pointer font-semibold"
              >
                <IdCard className="w-3.5 h-3.5" />
                <span>{translate(language, 'viewDigitalId')}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('profile');
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-[#161D2C] text-slate-200 text-start cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>{translate(language, 'navProfile')}</span>
              </button>

              <button
                onClick={() => {
                  onOpenRegisterModal();
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-[#161D2C] text-emerald-300 text-start cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{translate(language, 'registerBtn')}</span>
              </button>

              {currentUser.role === 'SUPER_ADMIN' && (
                <button
                  onClick={() => {
                    setActiveTab('manage_app');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-[#161D2C] text-[#F5D061] text-start cursor-pointer font-bold"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>{translate(language, 'navMasterControl')} 👑</span>
                </button>
              )}

              <div className="border-t border-[#D4AF37]/20 my-1 pt-1 space-y-0.5">
                {!isFirebaseLive && (
                  <button
                    onClick={() => {
                      onOpenLoginModal();
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-amber-500/10 text-[#F5D061] text-start cursor-pointer font-medium"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{translate(language, 'signInBtn')}</span>
                  </button>
                )}
                <button
                  onClick={async () => {
                    await logoutFirebaseAuth();
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-rose-500/10 text-rose-400 text-start cursor-pointer font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isFirebaseLive && firebaseUser?.email ? `${translate(language, 'logout')} (${firebaseUser.email})` : translate(language, 'logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
