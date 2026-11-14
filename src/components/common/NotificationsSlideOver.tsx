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
    if (activeFilter === 'UNREAD') return !n.read;
    if (activeFilter === 'MEMBERSHIPS') {
      return (
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
      case 'MEMBERSHIP_APPROVED':
        return <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'MEMBERSHIP_PENDING_DISTRICT':
      case 'MEMBERSHIP_PENDING_REGIONAL':
      case 'MEMBERSHIP_RECOMMENDED':
        return <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'MEMBERSHIP_REJECTED':
        return <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'PAYMENT_VERIFIED':
        return <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'PAYMENT_PENDING':
        return <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'PAYMENT_REJECTED':
        return <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'COMPLAINT_UPDATE':
        return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'ANNOUNCEMENT_NEW':
        return <Megaphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'USER_SIGNUP':
        return <UserPlus className="w-5 h-5 text-emerald-500" />;
      case 'USER_LOGIN':
        return <LogIn className="w-5 h-5 text-[#F5D061]" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getNotificationBadgeClass = (type: NotificationType) => {
    switch (type) {
      case 'MEMBERSHIP_APPROVED':
      case 'PAYMENT_VERIFIED':
      case 'USER_SIGNUP':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'USER_LOGIN':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'MEMBERSHIP_PENDING_DISTRICT':
      case 'MEMBERSHIP_PENDING_REGIONAL':
      case 'MEMBERSHIP_RECOMMENDED':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'PAYMENT_PENDING':
      case 'COMPLAINT_UPDATE':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'MEMBERSHIP_REJECTED':
      case 'PAYMENT_REJECTED':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const handleNotificationClick = (notification: AppNotification) => {
    markNotificationAsRead(notification.id);

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
        className="fixed inset-0 bg-slate-950/75 transition-opacity duration-200 ease-out"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300 ease-out">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center relative">
                  <Bell className="w-5 h-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </span>
                  )}
                </div>
                <div>
                  <h2 id="slide-over-title" className="text-base font-semibold text-slate-900 dark:text-white">
                    {language === 'ur' ? 'اطلاعات و الرٹس' : 'Notifications'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'ur' 
                      ? `${unreadNotificationsCount} غیر خواندہ اطلاعات`
                      : `${unreadNotificationsCount} unread alert${unreadNotificationsCount === 1 ? '' : 's'}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close notifications"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs & Quick Actions */}
            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setActiveFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    activeFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {language === 'ur' ? 'سب' : 'All'}
                </button>
                <button
                  onClick={() => setActiveFilter('UNREAD')}
                  className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                    activeFilter === 'UNREAD'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{language === 'ur' ? 'غیر خواندہ' : 'Unread'}</span>
                  {unreadNotificationsCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  )}
                </button>
                <button
                  onClick={() => setActiveFilter('MEMBERSHIPS')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    activeFilter === 'MEMBERSHIPS'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {language === 'ur' ? 'ممبرشپ' : 'Members'}
                </button>
                <button
                  onClick={() => setActiveFilter('PAYMENTS')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    activeFilter === 'PAYMENTS'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                    className="p-1.5 text-xs text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                {userNotifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    title={language === 'ur' ? 'تمام صاف کریں' : 'Clear all'}
                    className="p-1.5 text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {language === 'ur' ? 'کوئی اطلاع نہیں ہے' : 'All caught up!'}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                  {activeFilter === 'UNREAD'
                    ? (language === 'ur' ? 'آپ کے پاس کوئی غیر خواندہ اطلاع نہیں ہے' : 'No unread notifications to display')
                    : (language === 'ur' ? 'اس کیٹیگری میں کوئی نیا الرٹ موجود نہیں ہے' : 'New status updates and administrative alerts will appear here')}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const badgeClass = getNotificationBadgeClass(notification.type);
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 transition-all cursor-pointer relative hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      !notification.read
                        ? 'bg-emerald-50/30 dark:bg-emerald-950/20'
                        : ''
                    }`}
                  >
                    {/* Unread indicator bar */}
                    {!notification.read && (
                      <span className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-500 rounded-r-md" />
                    )}

                    <div className="flex items-start gap-3 pl-1">
                      {/* Icon container */}
                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className={`text-xs font-semibold truncate ${
                            !notification.read 
                              ? 'text-slate-900 dark:text-white font-bold' 
                              : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {notification.title}
                          </h4>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0 whitespace-nowrap">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>

                        <div className="mt-2.5 flex items-center justify-between">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-sm border ${badgeClass}`}>
                            {notification.type.replace(/_/g, ' ')}
                          </span>

                          {notification.linkTab && (
                            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 group">
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
          <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
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
