import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { Shield, CreditCard, MapPin, User, RefreshCw, CheckCircle2 } from 'lucide-react';

export const RoleSwitcherBar: React.FC = () => {
  const { currentUser, switchUser, users, resetAllData } = useApp();

  const superAdmin = users.find(u => u.role === 'SUPER_ADMIN') || users[0];
  const financeOfficer = users.find(u => u.role === 'FINANCE_OFFICER') || users[1];
  const regionalOfficer = users.find(u => u.role === 'REGIONAL_OFFICER') || users[2];
  const member = users.find(u => u.role === 'MEMBER') || users[4];

  const roles = [
    {
      role: 'SUPER_ADMIN' as UserRole,
      label: 'Super Admin',
      subtitle: 'Full Organization Control',
      user: superAdmin,
      icon: Shield,
      accent: 'emerald',
      bgColor: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
    },
    {
      role: 'FINANCE_OFFICER' as UserRole,
      label: 'Finance Officer',
      subtitle: 'Treasury & Verification',
      user: financeOfficer,
      icon: CreditCard,
      accent: 'blue',
      bgColor: 'bg-blue-950/40 text-blue-300 border-blue-800/60'
    },
    {
      role: 'REGIONAL_OFFICER' as UserRole,
      label: 'Regional Officer',
      subtitle: `${regionalOfficer.region || 'Lahore'} Division`,
      user: regionalOfficer,
      icon: MapPin,
      accent: 'amber',
      bgColor: 'bg-amber-950/40 text-amber-300 border-amber-800/60'
    },
    {
      role: 'MEMBER' as UserRole,
      label: 'Member',
      subtitle: member.name,
      user: member,
      icon: User,
      accent: 'purple',
      bgColor: 'bg-purple-950/40 text-purple-300 border-purple-800/60'
    }
  ];

  return (
    <div className="no-print bg-slate-900 border-b border-slate-800 text-xs px-4 py-2 select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">Role Simulation</span>
          <span className="text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-400">Switch persona to test strict access permissions:</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          {roles.map(({ role, label, subtitle, user, icon: Icon }) => {
            const isActive = currentUser.id === user.id;
            return (
              <button
                key={role}
                onClick={() => switchUser(user.id)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded border transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm font-semibold'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
                title={`Switch to ${user.name} (${label})`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <div className="text-left flex flex-col leading-tight">
                  <span className="font-medium text-[11px]">{label}</span>
                  <span className={`text-[9px] ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {user.name.split(' ')[0]} ({(user.district || user.region || 'HQ').split(' ')[0]})
                  </span>
                </div>
                {isActive && <CheckCircle2 className="w-3 h-3 text-emerald-200 ml-0.5" />}
              </button>
            );
          })}

          <button
            onClick={resetAllData}
            title="Reset simulation state to original defaults"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-700 bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors ml-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="text-[10px]">Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
