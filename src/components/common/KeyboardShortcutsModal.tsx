import React from 'react';
import { X, Command, Navigation, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, language } = useApp();

  if (!isOpen || !currentUser) return null;

  const sections = [
    {
      title: language === 'ur' ? 'عالمی اور تلاش' : 'Global & Search',
      icon: Command,
      shortcuts: [
        { keys: ['Ctrl', 'K'], label: language === 'ur' ? 'گلوبل سرچ کھولیں' : 'Open Global Search & Command Palette' },
        { keys: ['/'], label: language === 'ur' ? 'تلاش بار پر جائیں' : 'Quick Focus Search Bar' },
        { keys: ['?'], label: language === 'ur' ? 'شارٹ کٹ گائیڈ کھولیں' : 'Open Keyboard Shortcuts Guide' },
        { keys: ['Esc'], label: language === 'ur' ? 'موڈل بند کریں / تلاش صاف کریں' : 'Close Active Modal / Clear Search' },
        { keys: ['Alt', 'L'], label: language === 'ur' ? 'زبان تبدیل کریں (اردو / English)' : 'Toggle Language (English / اردو)' },
      ]
    },
    {
      title: language === 'ur' ? 'ماڈیول نیویگیشن' : 'Module Navigation',
      icon: Navigation,
      shortcuts: [
        { keys: ['Alt', '1'], label: language === 'ur' ? 'مرکزی ڈیش بورڈ' : 'Overview Dashboard' },
        { keys: ['Alt', '2'], label: language === 'ur' ? 'ممبران ڈائریکٹری' : 'Member Directory (Staff & Admin)' },
        { keys: ['Alt', '3'], label: language === 'ur' ? 'منظوری اور تصدیق' : 'Approvals & Verification (Stage 1 & 2)' },
        { keys: ['Alt', '4'], label: language === 'ur' ? 'فنڈز اور ادائیگیاں' : 'Funds & Contribution Ledger' },
        { keys: ['Alt', '5'], label: language === 'ur' ? 'ادائیگی تصدیق قطار' : 'Payment Verification Queue' },
        { keys: ['Alt', '6'], label: language === 'ur' ? 'شکایات ڈیسک' : 'Grievance & Complaints Desk' },
        { keys: ['Alt', '7'], label: language === 'ur' ? 'اعلانات اور بلیٹن' : 'Announcements & Bulletins' },
        { keys: ['Alt', '8'], label: language === 'ur' ? 'کردار اور عملہ' : 'Staff Roles & RBAC (Super Admin)' },
        { keys: ['Alt', '9'], label: language === 'ur' ? 'مالی رپورٹس' : 'Audited Financial Statements & Reports' },
        { keys: ['Alt', '0'], label: language === 'ur' ? 'آڈٹ لاگز' : 'Immutable Audit Trail' },
      ]
    },
    {
      title: language === 'ur' ? 'فوری اقدامات' : 'Quick Actions',
      icon: Zap,
      shortcuts: [
        { keys: ['Alt', 'N'], label: language === 'ur' ? 'نیا ممبر اندراج فارم' : 'Open New Member Onboarding Form' },
        { keys: ['Alt', 'I'], label: language === 'ur' ? 'اطلاعات پینل کھولیں' : 'Open Global Notifications Slide-Over' },
        { keys: ['Alt', 'P'], label: language === 'ur' ? 'نئی ادائیگی جمع کروائیں' : 'Submit New Contribution / Payment' },
        { keys: ['Alt', 'C'], label: language === 'ur' ? 'وی آئی پی ڈیجیٹل آئی ڈی کارڈ' : 'View Digital Membership Card' },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-[95] kc-modal-backdrop flex items-start sm:items-center justify-center bg-black/85 overflow-y-auto">
      <div className="kc-luxury-modal kc-modal-panel relative w-full max-w-2xl rounded-2xl p-5 sm:p-6 pb-24 sm:pb-6 my-auto overflow-y-auto text-xs">
        <div className="flex items-start justify-between gap-2.5 pb-3 border-b border-[#D4AF37]/25">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className="p-2 bg-[#131C31] border border-[#38BDF8]/40 text-[#F5D061] rounded-lg shrink-0">
              <Command className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white break-words whitespace-normal leading-snug">
                {language === 'ur' ? 'کی بورڈ شارٹ کٹس گائیڈ' : 'Global Keyboard Shortcuts Guide'}
              </h3>
              <p className="text-[11px] text-slate-400 break-words whitespace-normal leading-snug mt-0.5">
                {language === 'ur' ? 'عہدیداران اور ممبران کے لیے تیز رفتار ورک فلو شارٹ کٹس' : 'Operational workflow shortcuts for administrative officers and members'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={language === 'ur' ? 'بند کریں' : 'Close'}
            className="kc-pressable min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl bg-[#090D16] border border-[#D4AF37]/30 text-slate-300 hover:text-[#F5D061] hover:bg-[#161F33] cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div 
                key={section.title}
                className="p-3.5 rounded-xl border border-[#D4AF37]/25 bg-[#090D16] space-y-2.5"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#F5D061] border-b border-[#D4AF37]/20 pb-1.5">
                  <Icon className="w-3.5 h-3.5 text-[#F5D061]" />
                  <span>{section.title}</span>
                </div>

                <div className="space-y-1.5">
                  {section.shortcuts.map((sc, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-300 truncate">
                        {sc.label}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {sc.keys.map((k, idx) => (
                          <kbd 
                            key={idx}
                            className="px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#F5D061] bg-[#141B2D] border border-[#D4AF37]/35 rounded shadow-2xs"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-[#D4AF37]/20 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>
            {language === 'ur' ? 'فعال عہدہ:' : 'Active Role:'} <strong className="text-[#F5D061]">{currentUser.role}</strong> ({currentUser.district || (language === 'ur' ? 'پاکستان' : 'Pakistan')})
          </span>
          <span className="font-mono text-[10px]">
            {language === 'ur' ? 'بند کرنے کے لیے Esc دبائیں' : <>Press <kbd className="px-1 py-0.5 bg-[#141B2D] border border-[#D4AF37]/35 rounded text-[#F5D061]">Esc</kbd> to close</>}
          </span>
        </div>
      </div>
    </div>
  );
};
