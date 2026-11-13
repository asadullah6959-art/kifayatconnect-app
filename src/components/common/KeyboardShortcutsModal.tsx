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
      title: 'Global & Search',
      icon: Command,
      shortcuts: [
        { keys: ['Ctrl', 'K'], label: 'Open Global Search & Command Palette' },
        { keys: ['/'], label: 'Quick Focus Search Bar' },
        { keys: ['?'], label: 'Open Keyboard Shortcuts Guide' },
        { keys: ['Esc'], label: 'Close Active Modal / Clear Search' },
        { keys: ['Alt', 'L'], label: 'Toggle Language (English / اردو)' },
      ]
    },
    {
      title: 'Module Navigation',
      icon: Navigation,
      shortcuts: [
        { keys: ['Alt', '1'], label: 'Overview Dashboard' },
        { keys: ['Alt', '2'], label: 'Member Directory (Staff & Admin)' },
        { keys: ['Alt', '3'], label: 'Approvals & Verification (Stage 1 & 2)' },
        { keys: ['Alt', '4'], label: 'Funds & Contribution Ledger' },
        { keys: ['Alt', '5'], label: 'Payment Verification Queue' },
        { keys: ['Alt', '6'], label: 'Grievance & Complaints Desk' },
        { keys: ['Alt', '7'], label: 'Announcements & Bulletins' },
        { keys: ['Alt', '8'], label: 'Staff Roles & RBAC (Super Admin)' },
        { keys: ['Alt', '9'], label: 'Audited Financial Statements & Reports' },
        { keys: ['Alt', '0'], label: 'Immutable Audit Trail' },
      ]
    },
    {
      title: 'Quick Actions',
      icon: Zap,
      shortcuts: [
        { keys: ['Alt', 'N'], label: 'Open New Member Onboarding Form' },
        { keys: ['Alt', 'I'], label: 'Open Global Notifications Slide-Over' },
        { keys: ['Alt', 'P'], label: 'Submit New Contribution / Payment' },
        { keys: ['Alt', 'C'], label: 'View Digital Membership Card' },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 my-6 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-md">
              <Command className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'ur' ? 'کی بورڈ شارٹ کٹس گائیڈ' : 'Global Keyboard Shortcuts Guide'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Operational workflow shortcuts for administrative officers and members
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
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
                className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200/60 dark:border-slate-800/80 pb-1.5">
                  <Icon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{section.title}</span>
                </div>

                <div className="space-y-1.5">
                  {section.shortcuts.map((sc, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-600 dark:text-slate-300 truncate">
                        {sc.label}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {sc.keys.map((k, idx) => (
                          <kbd 
                            key={idx}
                            className="px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-2xs"
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

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>Active Role: <strong className="text-slate-700 dark:text-slate-200">{currentUser.role}</strong> ({currentUser.district || 'Pakistan'})</span>
          <span className="font-mono text-[10px]">Press <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
};
