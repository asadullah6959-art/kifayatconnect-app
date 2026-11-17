import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCheck, 
  Trash2, 
  Bell, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Receipt, 
  CreditCard, 
  UserCheck, 
  AlertTriangle, 
  Megaphone,
  ArrowRight,
  UserPlus,
  LogIn
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppNotification, NotificationType } from '../../types';

interface NotificationsSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabFilter = 'ALL' | 'UNREAD' | 'MEMBERSHIPS' | 'PAYMENTS';

export const NotificationsSlideOver: React.FC<NotificationsSlideOverProps> = ({ isOpen, onClose }) => {
  const { 
    userNotifications, 
    unreadNotificationsCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    clearAllNotifications,
    setActiveTab,
    payments,
    setSelectedReceipt,
    setSelectedCardUser,
    jumpToMemberApproval,
    currentUser,
    language
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<TabFilter>('ALL');

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-mark unread notifications as read when opened so 9+ badge clears immediately
  useEffect(() => {
    if (isOpen && unreadNotificationsCount > 0) {
      markAllNotificationsAsRead();
    }
  }, [isOpen, unreadNotificationsCount, markAllNotificationsAsRead]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !currentUser) return null;

  // Filter notifications
  const filteredNotifications = userNotifications.filter(n => {
    if (activeFilter === 'UNREAD') return !n.read && !n.isRead;
    if (activeFilter === 'MEMBERSHIPS') {
      return (
        n.type === 'approval_request' ||
        n.type === 'USER_SIGNUP' ||
        n.type === 'MEMBERSHIP_PENDING_DISTRICT' ||
        (n.type as any) === 'MEMBERSHIP_PENDING_REGIONAL' ||
        n.type === 'MEMBERSHIP_RECOMMENDED' ||
        n.type === 'MEMBERSHIP_APPROVED' ||
        n.type === 'MEMBERSHIP_REJECTED'
      );
    }
    if (activeFilter === 'PAYMENTS') {
      return (
        n.type === 'PAYMENT_PENDING' ||
        n.type === 'PAYMENT_VERIFIED' ||
        n.type === 'PAYMENT_REJECTED'
      );
    }
    return true;
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'approval_request':
        return <UserPlus className="w-5 h-5 text-[#F5D061]" />;
      case 'MEMBERSHIP_APPROVED':
        return <UserCheck className="w-5 h-5 text-emerald-400" />;
      case 'MEMBERSHIP_PENDING_DISTRICT':
      case 'MEMBERSHIP_PENDING_REGIONAL':
      case 'MEMBERSHIP_RECOMMENDED':
        return <FileText className="w-5 h-5 text-sky-400" />;
      case 'MEMBERSHIP_REJECTED':
        return <AlertCircle className="w-5 h-5 text-rose-400" />;
      case 'PAYMENT_VERIFIED':
        return <Receipt className="w-5 h-5 text-emerald-400" />;
      case 'PAYMENT_PENDING':
        return <Clock className="w-5 h-5 text-[#F5D061]" />;
      case 'PAYMENT_REJECTED':
        return <AlertCircle className="w-5 h-5 text-rose-400" />;
      case 'COMPLAINT_UPDATE':
        return <AlertTriangle className="w-5 h-5 text-[#F5D061]" />;
      case 'ANNOUNCEMENT_NEW':
        return <Megaphone className="w-5 h-5 text-indigo-400" />;
      case 'USER_SIGNUP':
        return <UserPlus className="w-5 h-5 text-emerald-400" />;
      case 'USER_LOGIN':
        return <LogIn className="w-5 h-5 text-[#F5D061]" />;
      default:
        return <Bell className="w-5 h-5 text-slate-300" />;
    }
  };

  const getNotificationBadgeClass = (type: NotificationType) => {
    switch (type) {
      case 'approval_request':
        return 'bg-amber-500/15 text-[#F5D061] border-[#D4AF37]/50';
      case 'MEMBERSHIP_APPROVED':
      case 'PAYMENT_VERIFIED':
      case 'USER_SIGNUP':
        return 'bg-[#131C31] text-[#38BDF8] border-[#38BDF8]/40';
      case 'USER_LOGIN':
        return 'bg-amber-500/15 text-[#F5D061] border-[#D4AF37]/45';
      case 'MEMBERSHIP_PENDING_DISTRICT':
      case 'MEMBERSHIP_PENDING_REGIONAL':
      case 'MEMBERSHIP_RECOMMENDED':
        return 'bg-sky-950/60 text-sky-300 border-sky-500/45';
      case 'PAYMENT_PENDING':
      case 'COMPLAINT_UPDATE':
        return 'bg-amber-500/15 text-[#F5D061] border-[#D4AF37]/45';
      case 'MEMBERSHIP_REJECTED':
      case 'PAYMENT_REJECTED':
        return 'bg-rose-950/60 text-rose-300 border-rose-500/45';
      default:
        return 'bg-[#090D16] text-slate-300 border-[#D4AF37]/25';
    }
  };

  const handleNotificationClick = (notification: AppNotification) => {
    markNotificationAsRead(notification.id);

    if (notification.type === 'approval_request') {
      jumpToMemberApproval(notification.memberUid || notification.entityId || null);
      onClose();
      return;
    }

    // Direct action handlers
    if (notification.type === 'PAYMENT_VERIFIED' && notification.entityId) {
      const tx = payments.find(p => p.id === notification.entityId || p.receiptNumber === notification.entityId);
      if (tx) {
        setSelectedReceipt(tx);
        onClose();
        return;
      }
    }

    if (notification.type === 'MEMBERSHIP_APPROVED' && notification.linkTab === 'card') {
      setSelectedCardUser(currentUser);
      onClose();
      return;
    }

    if (notification.linkTab) {
      setActiveTab(notification.linkTab);
      onClose();
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) return language === 'ur' ? 'ابھی' : 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}${language === 'ur' ? ' منٹ قبل' : 'm ago'}`;
      if (diffHours < 24) return `${diffHours}${language === 'ur' ? ' گھنٹے قبل' : 'h ago'}`;
      if (diffDays < 7) return `${diffDays}${language === 'ur' ? ' دن قبل' : 'd ago'}`;
      return date.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 transition-opacity duration-200 ease-out"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 w-full sm:w-auto max-w-full flex justify-end pl-0 sm:pl-10">
        <div className="w-full max-w-[100vw] sm:max-w-md box-border bg-gradient-to-b from-[#141B2D] to-[#0B101C] shadow-[0_24px_70px_rgba(0,0,0,0.92)] flex flex-col border-l border-[#D4AF37]/45 animate-in slide-in-from-right duration-200 ease-out overflow-hidden">
          
          {/* Header */}
          <div className="px-4 sm:px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-4 border-b border-[#D4AF37]/25 bg-[#070D14] shrink-0">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-[#131C31] border border-[#38BDF8]/40 text-[#F5D061] flex items-center justify-center relative shrink-0">
                  <Bell className="w-5 h-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums">
                      {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 id="slide-over-title" className="text-base font-bold text-white truncate">
                    {language === 'ur' ? 'اطلاعات و الرٹس' : 'Notifications'}
                  </h2>
                  <p className="text-xs text-slate-400 tabular-nums truncate">
                    {language === 'ur' 
                      ? `${unreadNotificationsCount} غیر خواندہ اطلاعات`
                      : `${unreadNotificationsCount} unread alert${unreadNotificationsCount === 1 ? '' : 's'}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="kc-pressable min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl bg-[#131C31] border border-slate-400/20 text-slate-200 hover:text-[#F5D061] hover:bg-[#1E293B] transition-colors cursor-pointer"
                  aria-label="Close notifications"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs & Quick Actions */}
            <div className="mt-3.5 flex items-center justify-between gap-2 min-w-0">
              <div className="kc-tab-shell flex items-center gap-1 p-1 rounded-xl text-[11px] sm:text-xs font-semibold overflow-x-auto max-w-full min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setActiveFilter('ALL')}
                  className={`kc-pressable px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeFilter === 'ALL'
                      ? 'kc-gold-button'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {language === 'ur' ? 'سب' : 'All'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('UNREAD')}
                  className={`kc-pressable px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer ${
                    activeFilter === 'UNREAD'
                      ? 'kc-gold-button'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <span>{language === 'ur' ? 'غیر خواندہ' : 'Unread'}</span>
                  {unreadNotificationsCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('MEMBERSHIPS')}
                  className={`kc-pressable px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeFilter === 'MEMBERSHIPS'
                      ? 'kc-gold-button'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {language === 'ur' ? 'ممبرشپ' : 'Members'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('PAYMENTS')}
                  className={`kc-pressable px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeFilter === 'PAYMENTS'
                      ? 'kc-gold-button'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {language === 'ur' ? 'ادائیگی' : 'Payments'}
                </button>
              </div>

              {/* Mark all as read */}
              <div className="flex items-center gap-1">
                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    title={language === 'ur' ? 'تمام کو پڑھا ہوا نشان زد کریں' : 'Mark all as read'}
                    className="kc-pressable p-1.5 text-xs text-slate-300 hover:text-emerald-400 hover:bg-[#161F33] rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                {userNotifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    title={language === 'ur' ? 'تمام صاف کریں' : 'Clear all'}
                    className="kc-pressable p-1.5 text-xs text-slate-300 hover:text-rose-400 hover:bg-[#161F33] rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#D4AF37]/15">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center h-64 text-slate-400">
                <div className="w-12 h-12 rounded-full bg-[#090D16] border border-[#D4AF37]/30 flex items-center justify-center mb-3 text-[#F5D061]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-white">
                  {language === 'ur' ? 'کوئی اطلاع نہیں ہے' : 'All caught up!'}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  {activeFilter === 'UNREAD'
                    ? (language === 'ur' ? 'آپ کے پاس کوئی غیر خواندہ اطلاع نہیں ہے' : 'No unread notifications to display')
                    : (language === 'ur' ? 'اس کیٹیگری میں کوئی نیا الرٹ موجود نہیں ہے' : 'New status updates and administrative alerts will appear here')}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const isNotifUnread = !notification.read && !notification.isRead;
                const badgeClass = getNotificationBadgeClass(notification.type);
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3.5 sm:p-4 transition-all cursor-pointer relative hover:bg-[#161F33]/80 ${
                      isNotifUnread
                        ? 'bg-[#131C31]/75'
                        : ''
                    }`}
                  >
                    {/* Unread indicator bar */}
                    {isNotifUnread && (
                      <span className="absolute left-0 top-3 bottom-3 w-1 bg-[#F5D061] rounded-r-md" />
                    )}

                    <div className="flex items-start gap-2.5 sm:gap-3 pl-1 min-w-0">
                      {/* Icon container */}
                      <div className="w-9 h-9 rounded-xl bg-[#070D14] border border-[#D4AF37]/30 flex items-center justify-center shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
                          <h4 className={`text-xs font-semibold truncate ${
                            isNotifUnread
                              ? 'text-white font-bold'
                              : 'text-slate-200'
                          }`}>
                            {notification.title}
                          </h4>
                          <span className="text-[10px] sm:text-[11px] text-slate-400 shrink-0 whitespace-nowrap tabular-nums">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed break-words">
                          {notification.message}
                        </p>

                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border truncate max-w-[65%] ${badgeClass}`}>
                            {notification.type.replace(/_/g, ' ')}
                          </span>

                          {notification.linkTab && (
                            <span className="text-[11px] font-semibold text-[#F5D061] hover:text-white flex items-center gap-1 group shrink-0">
                              <span>
                                {notification.type === 'PAYMENT_VERIFIED' 
                                  ? (language === 'ur' ? 'رسید دیکھیں' : 'View Receipt')
                                  : notification.type === 'MEMBERSHIP_APPROVED' && notification.linkTab === 'card'
                                  ? (language === 'ur' ? 'کارڈ کھولیں' : 'View Card')
                                  : (language === 'ur' ? 'تفصیلات' : 'Open')}
                              </span>
                              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="px-4 py-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] border-t border-[#D4AF37]/25 bg-[#070D14] text-center shrink-0">
            <p className="text-[11px] text-slate-400">
              {language === 'ur'
                ? `کردار کی بنیاد پر محفوظ سیکیورٹی: ${currentUser.role}`
                : `Role-Scoped Feed • Logged in as ${currentUser.role.replace('_', ' ')}`}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
