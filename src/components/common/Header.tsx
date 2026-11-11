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
  ShieldCheck
} from 'lucide-react';
import { GlobalSearchBar } from './GlobalSearchBar';

interface HeaderProps {
  onOpenRegisterModal: () => void;
  onOpenLoginModal: () => void;
  onOpenShortcutsModal?: () => void;
  onOpenNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenRegisterModal, 
  onOpenLoginModal,
  onOpenShortcutsModal,
  onOpenNotifications 
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
    logoutFirebaseAuth
  } = useApp();

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'FINANCE_OFFICER':
        return 'Finance Officer';
      case 'REGIONAL_OFFICER':
        return `Regional Officer · ${currentUser.region}`;
      case 'MEMBER':
        return `Member · ${currentUser.membershipId || 'KC-PENDING'}`;
      default:
        return role;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      {/* Zone 1: Single text element wordmark */}
      <div 
        onClick={() => setActiveTab('dashboard')} 
        className="flex items-center gap-2.5 cursor-pointer select-none whitespace-nowrap shrink-0"
      >
        <img 
          src="/src/assets/images/kifayat_emblem_logo_1794225902501.jpg" 
          alt="Kifayat Connect Crest" 
          className="w-8 h-8 rounded-lg object-cover border border-emerald-600/30 shadow-xs"
        />
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">
            {language === 'ur' ? 'کفایت کنیکٹ' : 'Kifayat Connect'}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium tracking-wide">
            {language === 'ur' ? 'ویلفیئر گورننس پلیٹ فارم' : 'Welfare & Governance Portal'}
          </span>
        </div>
      </div>

      {/* Zone 2: Clean single-line text navigation links */}
      <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'dashboard' ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400' : ''
          }`}
        >
          {language === 'ur' ? 'ڈیش بورڈ' : 'Dashboard'}
        </button>

        {currentUser.role !== 'MEMBER' && (
          <button
            onClick={() => setActiveTab('members')}
            className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'members' ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400' : ''
            }`}
          >
            {language === 'ur' ? 'ارکان' : 'Members'}
          </button>
        )}

        {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'REGIONAL_OFFICER') && (
          <button
            onClick={() => setActiveTab('approvals')}
            className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'approvals' ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400' : ''
            }`}
          >
            {language === 'ur' ? 'منظوریاں' : 'Approvals'}
          </button>
        )}

        <button
          onClick={() => setActiveTab('funds')}
          className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'funds' ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400' : ''
          }`}
        >
          {language === 'ur' ? 'فنڈز و وصولیاں' : 'Contributions'}
        </button>

        <button
          onClick={() => setActiveTab('complaints')}
          className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'complaints' ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400' : ''
          }`}
        >
          {language === 'ur' ? 'شکایات' : 'Grievances'}
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'announcements' ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400' : ''
          }`}
        >
          {language === 'ur' ? 'اعلانات' : 'Bulletins'}
        </button>
      </nav>

      {/* Global Role-Gated Search Bar */}
      <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-2">
        <GlobalSearchBar />
      </div>

      {/* Zone 3: 1 primary action & Account profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Keyboard Shortcuts Guide */}
        {onOpenShortcutsModal && (
          <button
            onClick={onOpenShortcutsModal}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0"
            title="Keyboard Shortcuts Guide (?)"
          >
            <Keyboard className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <kbd className="hidden md:inline-block font-mono text-[9px] px-1 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-500">
              ?
            </kbd>
          </button>
        )}

        {/* Language switch */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0"
          title="Switch Language (English / اردو)"
        >
          <Languages className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">{language === 'en' ? 'اردو' : 'English'}</span>
        </button>

        {/* Global Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
          title={language === 'ur' ? 'اطلاعات (الرٹس)' : 'Notifications & Alerts'}
          aria-label="Open notifications"
        >
          <Bell className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-xs">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* New Member Registration CTA */}
        <button
          onClick={onOpenRegisterModal}
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors whitespace-nowrap shrink-0 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{language === 'ur' ? 'نئی رکنیت' : 'New Member Onboarding'}</span>
        </button>

        {/* Current User Profile Pill with dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(prev => !prev)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
          >
            {currentUser.avatarUrl ? (
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.name} 
                className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-300 dark:border-emerald-800">
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div className="hidden lg:flex flex-col text-left leading-tight">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {getRoleBadge(currentUser.role)}
              </span>
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div 
              onMouseLeave={() => setShowProfileMenu(false)}
              className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg py-2 z-50 text-xs"
            >
              <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{currentUser.name}</p>
                  {isFirebaseLive && (
                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                      Google Live
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-[11px] truncate">{currentUser.email}</p>
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                  <span className="font-semibold">Role: {currentUser.role}</span>
                  <span>·</span>
                  <span>{currentUser.region}</span>
                </div>
              </div>

              {currentUser.role === 'MEMBER' && (
                <button
                  onClick={() => {
                    setSelectedCardUser(currentUser);
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-left cursor-pointer"
                >
                  <IdCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span>View Digital Membership Card</span>
                </button>
              )}

              <button
                onClick={() => {
                  setActiveTab('profile');
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-left cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Account Profile & Security</span>
              </button>

              {currentUser.role === 'SUPER_ADMIN' && (
                <button
                  onClick={() => {
                    setActiveTab('staff');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-left cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Staff & Role Access Control</span>
                </button>
              )}

              {onOpenShortcutsModal && (
                <button
                  onClick={() => {
                    onOpenShortcutsModal();
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Keyboard className="w-3.5 h-3.5 text-slate-500" />
                    <span>Keyboard Shortcuts</span>
                  </div>
                  <kbd className="font-mono text-[9px] px-1 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-500">
                    ?
                  </kbd>
                </button>
              )}

              <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1">
                {isFirebaseLive ? (
                  <button
                    onClick={async () => {
                      await logoutFirebaseAuth();
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-left cursor-pointer font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out from Google ({firebaseUser?.email})</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onOpenLoginModal();
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-left cursor-pointer font-medium"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Sign in with Google (Super Admin)</span>
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
