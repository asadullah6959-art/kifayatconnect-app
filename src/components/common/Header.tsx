import React, { useState, useEffect, useRef } from 'react';
import { useApp, isFounderUser } from '../../context/AppContext';
import {
  Languages,
  User as UserIcon,
  LogOut,
  IdCard,
  Plus,
  Bell,
  ShieldCheck,
  Crown,
  Menu,
  X,
  FileCheck2,
  HelpCircle
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { AppLogo } from './AppLogo';
import { RoleBadge } from './RoleBadge';
import { translate } from '../../data/translations';
import { isFounderIdentity } from '../../utils/permissions';

interface HeaderProps {
  onOpenRegisterModal: () => void;
  onOpenLoginModal: () => void;
  onOpenNotifications?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenRegisterModal,
  onOpenLoginModal,
  onOpenNotifications,
  onToggleSidebar,
  isSidebarOpen
}) => {
  const {
    currentUser,
    setActiveTab,
    language,
    toggleLanguage,
    setSelectedCardUser,
    unreadNotificationsCount,
    isFirebaseLive,
    logoutFirebaseAuth,
    appSettings,
    isOnline,
    openRukniyatForm,
    openTutorial
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
    '';

  return (
    <header className="ski-light-header shrink-0 z-40 w-full max-w-[100vw] box-border px-2.5 pt-[calc(env(safe-area-inset-top,12px)+8px)] pb-2 flex items-center justify-between gap-1.5 bg-gradient-to-b from-[#0D2A1F] via-[#0F172A] to-[#071812] border-b border-slate-400/20 text-[#F8FAFC] shadow-[0_8px_24px_rgba(0,0,0,0.6),inset_0_-1px_0_rgba(56,189,248,0.16)]">
      {/* Zone 1: Mobile Hamburger & Compact 3D Brand Emblem */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isSidebarOpen}
          className="relative z-50 min-w-[44px] min-h-[44px] p-2 rounded-xl text-[#059669] bg-[#0D2A1F] hover:bg-[#1E293B] transition-colors cursor-pointer flex items-center justify-center border border-slate-400/20 shrink-0 kc-pressable"
        >
          {isSidebarOpen ? (
            <X className="w-5 h-5 text-[#E5E4E2]" />
          ) : (
            <Menu className="w-5 h-5 text-[#059669]" />
          )}
        </button>

        <div
          onClick={() => {
            setActiveTab('dashboard');
            if (onToggleSidebar && isSidebarOpen) onToggleSidebar();
          }}
          className="flex items-center gap-1.5 cursor-pointer select-none flex-1 min-w-0 overflow-hidden"
        >
          <div className="shrink-0">
            <AppLogo size="sm" halo />
          </div>
          <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
            <span className={`text-[14px] font-extrabold tracking-tight kc-gold-gradient-text leading-tight truncate block ${language === 'ur' ? 'kc-font-urdu' : ''}`}>
              {displayAppName}
            </span>
            <span className="text-[9px] text-[#059669] font-semibold tracking-wide truncate block">
              {displayTagline}
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Top-Right Mobile Touch Controls */}
      <div className="flex items-center gap-[6px] shrink-0">
        {!isOnline && (
          <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {translate(language, 'offline')}
          </span>
        )}

        {/* 1. Compact Language Toggle (اردو / EN) */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="relative z-50 min-w-[44px] min-h-[44px] flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-[#E5E4E2] bg-[#0D2A1F] hover:bg-[#1E293B] border border-slate-400/20 rounded-full transition-all cursor-pointer shrink-0 whitespace-nowrap shadow-[inset_0_1px_0_rgba(248,250,252,0.08)] kc-pressable"
          title="Switch Language (English / اردو)"
          aria-label="Switch Language"
        >
          <Languages className="w-3.5 h-3.5 text-[#059669] shrink-0" />
          <span>{language === 'en' ? 'اردو' : 'EN'}</span>
        </button>

        {/* 2. Notification Bell Button */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative z-50 min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-slate-200 hover:text-[#059669] bg-[#0D2A1F] hover:bg-[#1E293B] rounded-xl transition-all shrink-0 cursor-pointer border border-slate-400/20 shadow-[inset_0_1px_0_rgba(248,250,252,0.08)] kc-pressable"
          title={translate(language, 'notifications')}
          aria-label={translate(language, 'notifications')}
        >
          <Bell className="w-4 h-4 text-[#E5E4E2]" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-extrabold text-[#071812] bg-[#059669] rounded-full shadow-xs tabular-nums">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* 3. Account / Profile Menu Button + Safe-Bound Dropdown */}
        <div className="relative z-50 shrink-0" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu(prev => !prev)}
            aria-expanded={showProfileMenu}
            aria-haspopup="menu"
            aria-label="Account Menu"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-1 rounded-full bg-[#0D2A1F] hover:bg-[#1E293B] transition-all text-start cursor-pointer border border-slate-400/20 shrink-0 shadow-[inset_0_1px_0_rgba(248,250,252,0.08)] kc-pressable"
          >
            {avatarSrc && !avatarFailed ? (
              <img
                src={avatarSrc}
                alt={currentUser.name}
                onError={() => setAvatarFailed(true)}
                className="w-8 h-8 rounded-full object-cover border border-[#E5E4E2]/60 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#1E293B] text-[#059669] flex items-center justify-center border border-[#059669]/40 shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
          </button>

          {showProfileMenu && (
            <div
              role="menu"
              className="fixed top-[calc(env(safe-area-inset-top,12px)+56px)] right-2.5 w-[272px] max-w-[calc(100vw-20px)] max-h-[80dvh] overflow-y-auto kc-luxury-modal rounded-2xl py-2 z-[90] text-xs text-slate-200"
            >
              {/* User Name, Email & 3D Role Badge */}
              <div className="px-3.5 py-2.5 border-b border-[#E5E4E2]/20">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-white truncate">{currentUser.name}</p>
                  {isFirebaseLive && (
                    <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/15 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 kc-live-pulse" />
                      {language === 'ur' ? 'لائیو' : 'Live'}
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
                className="w-full min-h-[44px] flex items-center gap-2 px-3.5 py-2 hover:bg-[#161D2C] text-[#E5E4E2] text-start cursor-pointer font-semibold"
              >
                <IdCard className="w-3.5 h-3.5 shrink-0" />
                <span>{translate(language, 'viewDigitalId')}</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  openRukniyatForm();
                  setShowProfileMenu(false);
                }}
                className="w-full min-h-[44px] flex items-center gap-2 px-3.5 py-2 hover:bg-[#161D2C] text-emerald-300 text-start cursor-pointer font-semibold"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-[#CBD5E1] shrink-0" />
                <span>{translate(language, 'navRukniyatForm')}</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  openTutorial();
                  setShowProfileMenu(false);
                }}
                className="w-full min-h-[44px] flex items-center gap-2 px-3.5 py-2 hover:bg-[#161D2C] text-[#059669] text-start cursor-pointer font-semibold"
              >
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{translate(language, 'navMemberGuide')}</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActiveTab('profile');
                  setShowProfileMenu(false);
                }}
                className="w-full min-h-[44px] flex items-center gap-2 px-3.5 py-2 hover:bg-[#161D2C] text-slate-200 text-start cursor-pointer"
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
                className="w-full min-h-[44px] flex items-center gap-2 px-3.5 py-2 hover:bg-[#161D2C] text-emerald-300 text-start cursor-pointer font-medium"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>+ {translate(language, 'registerBtn')}</span>
              </button>

              {isFounderIdentity(currentUser) && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActiveTab('manage_app');
                    setShowProfileMenu(false);
                  }}
                  className="w-full min-h-[44px] flex items-center gap-2 px-3.5 py-2 hover:bg-[#161D2C] text-[#E5E4E2] text-start cursor-pointer font-bold"
                >
                  <Crown className="w-3.5 h-3.5 shrink-0" />
                  <span>{translate(language, 'navMasterControl')} 👑</span>
                </button>
              )}

              <div className="px-3.5 py-2 border-t border-[#E5E4E2]/15">
                <PWAInstallButton compact />
              </div>

              <div className="border-t border-[#E5E4E2]/20 my-1 pt-1 space-y-0.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onOpenLoginModal();
                    setShowProfileMenu(false);
                  }}
                  className="w-full min-h-[44px] flex items-center gap-2 px-3.5 py-2 hover:bg-amber-500/10 text-[#E5E4E2] text-start cursor-pointer font-medium"
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
                  className="w-full min-h-[44px] flex items-center gap-2 px-3.5 py-2 hover:bg-rose-500/10 text-rose-400 text-start cursor-pointer font-semibold"
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

