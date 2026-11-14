import React, { useState } from 'react';
import { X, Crown, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { User, UserRole } from '../../types';
import { useApp, isFounderUser } from '../../context/AppContext';
import { RoleBadge } from './RoleBadge';

interface AssignRoleModalProps {
  targetUser: User | null;
  onClose: () => void;
  onAssigned?: (message: string) => void;
}

interface RolePresetOption {
  id: string;
  label: string;
  subtitle: string;
  role: UserRole;
  isAuditOfficer: boolean;
  accent: string;
}

const ROLE_OPTIONS: RolePresetOption[] = [
  {
    id: 'SUPER_ADMIN',
    label: 'Super Admin',
    subtitle: 'Full national leadership & master control access',
    role: 'SUPER_ADMIN',
    isAuditOfficer: false,
    accent: 'border-[#F5D061]/60 bg-[#231D0B]/70 text-[#F5D061]'
  },
  {
    id: 'ADMIN',
    label: 'Admin',
    subtitle: 'District administration, approvals & treasury verification',
    role: 'ADMIN',
    isAuditOfficer: false,
    accent: 'border-blue-500/45 bg-blue-950/40 text-blue-200'
  },
  {
    id: 'CO_ADMIN',
    label: 'Co-Admin',
    subtitle: 'Provincial coordination, grievances & announcements',
    role: 'CO_ADMIN',
    isAuditOfficer: false,
    accent: 'border-emerald-500/45 bg-emerald-950/40 text-emerald-200'
  },
  {
    id: 'AUDIT_OFFICER',
    label: 'Audit Officer',
    subtitle: 'Read-only financial receipts, reports & audit logs verification',
    role: 'MEMBER',
    isAuditOfficer: true,
    accent: 'border-cyan-400/50 bg-cyan-950/40 text-cyan-200'
  },
  {
    id: 'MEMBER',
    label: 'Member',
    subtitle: 'Standard verified community member',
    role: 'MEMBER',
    isAuditOfficer: false,
    accent: 'border-slate-700 bg-[#0A0D12] text-slate-200'
  }
];

export const AssignRoleModal: React.FC<AssignRoleModalProps> = ({
  targetUser,
  onClose,
  onAssigned
}) => {
  const { currentUser, assignMemberRole } = useApp();
  const [error, setError] = useState<string | null>(null);

  if (!targetUser || !currentUser || !isFounderUser(currentUser)) return null;

  const targetIsFounder = isFounderUser(targetUser);

  const handleSelectRole = (opt: RolePresetOption) => {
    setError(null);
    const res = assignMemberRole(targetUser.id, {
      role: opt.role,
      isAuditOfficer: opt.isAuditOfficer
    });
    if (!res.success) {
      setError(res.error || 'Unable to assign role.');
      return;
    }
    if (onAssigned) {
      onAssigned(`${targetUser.name} is now assigned as ${opt.label}.`);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-[#0A0D12]/90 p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#111622] border border-[#D4AF37]/45 rounded-2xl shadow-2xl p-5 space-y-4 my-auto max-h-[92dvh] overflow-y-auto text-xs text-white"
        style={{ WebkitOverflowScrolling: 'touch' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-[#F5D061] flex items-center gap-1.5">
              <Crown className="w-4 h-4 shrink-0" />
              <span>Assign Role Directly</span>
            </h3>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {targetUser.name} · {targetUser.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#161D2C] text-slate-300 hover:text-white cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-[#0A0D12] border border-slate-800 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400">Current Role:</span>
          <RoleBadge
            role={targetUser.role}
            isFounder={targetIsFounder}
            isAuditOfficer={Boolean(targetUser.isAuditOfficer)}
            compact
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          {ROLE_OPTIONS.map((opt) => {
            const isCurrent =
              opt.id === 'AUDIT_OFFICER'
                ? targetUser.role === 'MEMBER' && Boolean(targetUser.isAuditOfficer)
                : targetUser.role === opt.role && Boolean(targetUser.isAuditOfficer) === opt.isAuditOfficer;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectRole(opt)}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors hover:border-[#F5D061] cursor-pointer ${opt.accent}`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-extrabold text-xs">{opt.label}</span>
                  </div>
                  <p className="text-[10px] opacity-80 mt-0.5 leading-snug">{opt.subtitle}</p>
                </div>
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F5D061] text-[#0A0D12] text-[10px] font-extrabold shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
