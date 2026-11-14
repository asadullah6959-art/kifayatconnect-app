import React, { useState, useEffect, useRef } from 'react';
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
    logoutFirebaseAuth,
    appSettings,
    isOnline
  } = useApp();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAvatarFailed(false);
  }, [currentUser?.photoUrl, currentUser?.avatarUrl, currentUser?.avatar, currentUser?.id]);

  useEffect(() => {
    if (!showProfileMenu) return;

    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowProfileMenu(false);
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showProfileMenu]);

  if (!currentUser) return null;

  const displayAppName = language === 'ur'
    ? (appSettings.appNameUr || translate('ur', 'appTitleShort'))
    : (appSettings.appName || translate('en', 'appTitleShort'));

  const displayTagline = language === 'ur'
    ? (appSettings.taglineUr || translate('ur', 'tagline'))
    : (appSettings.tagline || translate('en', 'tagline'));

  const avatarSrc =
    currentUser.photoUrl ||
    currentUser.avatarUrl ||
    currentUser.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=043927&color=F5D061&size=64`;

  return (
    <header className="shrink-0 z-30 w-full max-w-[100vw] box-border px-[10px] py-[8px] sm:px-4 md:px-6 sm:py-2.5 flex items-center justify-between gap-[6px] sm:gap-3 md:gap-5 bg-[#0A0D12] border-b border-[#D4AF37]/25 text-white shadow-md">
      {/* Zone 1: Mobile Hamburger & Compact 3D Brand Emblem */}
      <div className="flex items-center gap-[6px] sm:gap-3 flex-1 xl:flex-initial min-w-0 overflow-hidden">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isSidebarOpen}
          className="md:hidden p-1.5 rounded-xl text-[#F5D061] hover:bg-[#161D2C] transition-colors cursor-pointer flex items-center justify-center border border-[#D4AF37]/30 shrink-0"
        >
          {isSidebarOpen ? (
            <X className="w-4 h-4 text-[#F5D061]" />
          ) : (
            <Menu className="w-4 h-4 text-[#F5D061]" />
          )}
        </button>

        <div
          onClick={() => {
            setActiveTab('dashboard');
            if (onToggleSidebar && isSidebarOpen) onToggleSidebar();
          }}
          className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer select-none flex-1 min-w-0 overflow-hidden"
        >
          <div className="shrink-0">
            <BrandEmblem3D size="sm" />
          </div>
          <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
            <span className="text-[14px] sm:text-base md:text-lg font-extrabold tracking-tight kc-gold-gradient-text leading-tight truncate block">
              {displayAppName}
            </span>
            <span className="text-[9px] sm:text-[10px] text-emerald-400 font-semibold tracking-wide truncate block">
              {displayTagline}
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Desktop Quick Nav */}
      <nav className="hidden xl:flex items-center gap-5 text-xs font-semibold text-slate-300 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`hover:text-[#F5D061] transition-colors py-1 cursor-pointer ${
            activeTab === 'dashboard' ? 'text-[#F5D061] font-bold border-b-2 border-[#D4AF37]' : ''
          }`}
        >
          {translate(language, 'navDashboard')}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`hover:text-[#F5D061] transition-colors py-1 flex items-center gap-1 cursor-pointer ${
            activeTab === 'chat' ? 'text-[#F5D061] font-bold border-b-2 border-[#D4AF37]' : ''
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{translate(language, 'navChat')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('office_bearers')}
          className={`hover:text-[#F5D061] transition-colors py-1 flex items-center gap-1 cursor-pointer ${
            activeTab === 'office_bearers' ? 'text-[#F5D061] font-bold border-b-2 border-[#D4AF37]' : ''
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>{translate(language, 'navOfficeBearers')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`hover:text-[#F5D061] transition-colors py-1 cursor-pointer ${
            activeTab === 'members' ? 'text-[#F5D061] font-bold border-b-2 border-[#D4AF37]' : ''
          }`}
        >
          {translate(language, 'navMembers')}
        </button>

        {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') && (
          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`hover:text-[#F5D061] transition-colors py-1 cursor-pointer ${
              activeTab === 'approvals' ? 'text-[#F5D061] font-bold border-b-2 border-[#D4AF37]' : ''
            }`}
          >
            {translate(language, 'navApprovals')}
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('funds')}
          className={`hover:text-[#F5D061] transition-colors py-1 cursor-pointer ${
            activeTab === 'funds' ? 'text-[#F5D061] font-bold border-b-2 border-[#D4AF37]' : ''
          }`}
        >
          {translate(language, 'navFunds')}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('complaints')}
          className={`hover:text-[#F5D061] transition-colors py-1 cursor-pointer ${
            activeTab === 'complaints' ? 'text-[#F5D061] font-bold border-b-2 border-[#D4AF37]' : ''
          }`}
        >
          {translate(language, 'navComplaints')}
        </button>
      </nav>

      {/* Global Search Bar (Hidden on narrow mobile viewports) */}
      <div className="hidden sm:block flex-1 max-w-xs md:max-w-md mx-1 min-w-0">
        <GlobalSearchBar />
      </div>

      {/* Zone 3: Top-Right Controls (Always Visible on Mobile & Desktop) */}
      <div className="flex items-center gap-[6px] sm:gap-2 shrink-0">
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
            type="button"
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

        {/* 1. Compact Language Toggle (اردو / EN) */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-bold text-[#F5D061] bg-[#111622] hover:bg-[#161D2C] border border-[#D4AF37]/35 rounded-full sm:rounded-xl transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          title="Switch Language (English / اردو)"
          aria-label="Switch Language"
        >
          <Languages className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
          <span>{language === 'en' ? 'اردو' : 'EN'}</span>
        </button>

        {/* 2. Notification Bell Button */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative p-1.5 sm:p-2 text-slate-200 hover:text-[#F5D061] bg-[#111622] hover:bg-[#161D2C] rounded-xl transition-colors shrink-0 cursor-pointer border border-[#D4AF37]/30"
          title={translate(language, 'notifications')}
          aria-label={translate(language, 'notifications')}
        >
          <Bell className="w-4 h-4 text-[#F5D061]" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-extrabold text-[#0A0D12] bg-[#F5D061] rounded-full shadow-xs">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* VIP Digital ID Quick Pill (Desktop) */}
        <button
          type="button"
          onClick={() => setSelectedCardUser(currentUser)}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl kc-gold-button hover:brightness-110 transition-all cursor-pointer shrink-0"
        >
          <IdCard className="w-3.5 h-3.5" />
          <span>{translate(language, 'viewDigitalId')}</span>
        </button>

        {/* 3. Account / Profile Menu Button + Safe-Bound Dropdown */}
        <div className="relative shrink-0" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu(prev => !prev)}
            aria-expanded={showProfileMenu}
            aria-haspopup="menu"
            aria-label="Account Menu"
            className="flex items-center gap-1.5 p-0.5 sm:p-1 rounded-full lg:rounded-xl bg-[#111622] hover:bg-[#161D2C] transition-colors text-start cursor-pointer border border-[#D4AF37]/40 shrink-0"
          >
            {!avatarFailed ? (
              <img
                src={avatarSrc}
                alt={currentUser.name}
                onError={() => setAvatarFailed(true)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-[#D4AF37]/60 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#043927] text-[#F5D061] flex items-center justify-center border border-[#D4AF37]/60 shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
            )}

            <div className="hidden lg:flex flex-col text-start leading-tight pe-1.5">
              <span className="text-xs font-bold text-white whitespace-nowrap max-w-[130px] truncate">
                {currentUser.name}
              </span>
              <div className="mt-0.5">
                <RoleBadge
                  role={currentUser.role}
                  isFounder={isFounderUser(currentUser)}
                  isAuditOfficer={Boolean(currentUser.isAuditOfficer)}
                  compact
                />
              </div>
            </div>
          </button>

          {showProfileMenu && (
            <div
              role="menu"
              className={`fixed top-[54px] ${
                language === 'ur'
                  ? 'left-[8px] sm:left-0 sm:right-auto'
                  : 'right-[8px] sm:right-0 sm:left-auto'
              } sm:absolute sm:top-full sm:mt-2 w-[272px] max-w-[calc(100vw-16px)] bg-[#111622] border border-[#D4AF37]/45 rounded-2xl shadow-2xl py-2 z-50 text-xs text-slate-200`}
            >
              {/* User Name, Email & 3D Role Badge */}
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
                  <RoleBadge
                    role={currentUser.role}
                    isFounder={isFounderUser(currentUser)}
                    isAuditOfficer={Boolean(currentUser.isAuditOfficer)}
                    compact
                  />
                </div>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setSelectedCardUser(currentUser);
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-[#161D2C] text-[#F5D061] text-start cursor-pointer font-semibold"
              >
                <IdCard className="w-3.5 h-3.5 shrink-0" />
                <span>{translate(language, 'viewDigitalId')}</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActiveTab('profile');
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-[#161D2C] text-slate-200 text-start cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{translate(language, 'navProfile')}</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onOpenRegisterModal();
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-[#161D2C] text-emerald-300 text-start cursor-pointer font-medium"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>+ {translate(language, 'registerBtn')}</span>
              </button>

              {currentUser.role === 'SUPER_ADMIN' && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActiveTab('manage_app');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-[#161D2C] text-[#F5D061] text-start cursor-pointer font-bold"
                >
                  <Crown className="w-3.5 h-3.5 shrink-0" />
                  <span>{translate(language, 'navMasterControl')} 👑</span>
                </button>
              )}

              <div className="border-t border-[#D4AF37]/20 my-1 pt-1 space-y-0.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onOpenLoginModal();
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-amber-500/10 text-[#F5D061] text-start cursor-pointer font-medium"
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>{translate(language, 'signInBtn')}</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={async () => {
                    setShowProfileMenu(false);
                    await logoutFirebaseAuth();
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-rose-500/10 text-rose-400 text-start cursor-pointer font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>{translate(language, 'logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

