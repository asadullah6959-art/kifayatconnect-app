import React from 'react';
import { Crown, ShieldCheck, Building2, Wallet, BadgeCheck } from 'lucide-react';
import { UserRole } from '../../types';

interface RoleBadgeProps {
  role: UserRole;
  compact?: boolean;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = React.memo(({ role, compact = false, className = '' }) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider border rounded-md ${
            compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
          } bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 ${className}`}
        >
          <Crown className={compact ? 'w-2.5 h-2.5 text-amber-500' : 'w-3 h-3 text-amber-500'} />
          <span>Super Admin</span>
        </span>
      );
    case 'ADMIN':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider border rounded-md ${
            compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
          } bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40 ${className}`}
        >
          <ShieldCheck className={compact ? 'w-2.5 h-2.5 text-blue-500' : 'w-3 h-3 text-blue-500'} />
          <span>District Admin</span>
        </span>
      );
    case 'CO_ADMIN':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider border rounded-md ${
            compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
          } bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/40 ${className}`}
        >
          <Building2 className={compact ? 'w-2.5 h-2.5 text-indigo-500' : 'w-3 h-3 text-indigo-500'} />
          <span>State Co-Admin</span>
        </span>
      );
    case 'FINANCE_OFFICER':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider border rounded-md ${
            compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
          } bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 ${className}`}
        >
          <Wallet className={compact ? 'w-2.5 h-2.5 text-emerald-500' : 'w-3 h-3 text-emerald-500'} />
          <span>Finance Officer</span>
        </span>
      );
    case 'MEMBER':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider border rounded-md ${
            compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
          } bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 ${className}`}
        >
          <BadgeCheck className={compact ? 'w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400' : 'w-3 h-3 text-emerald-600 dark:text-emerald-400'} />
          <span>Verified Member</span>
        </span>
      );
  }
});

RoleBadge.displayName = 'RoleBadge';
