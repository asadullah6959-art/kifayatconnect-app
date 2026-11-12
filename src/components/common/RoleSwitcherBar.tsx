import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { Shield, CreditCard, MapPin, Building2, User, RefreshCw, CheckCircle2 } from 'lucide-react';

export const RoleSwitcherBar: React.FC = () => {
  const { currentUser, switchUser, users, resetAllData } = useApp();

  const superAdmin = users.find(u => u.role === 'SUPER_ADMIN') || users[0];
  const financeOfficer = users.find(u => u.role === 'FINANCE_OFFICER') || users[1];
  const districtAdmin = users.find(u => u.role === 'ADMIN') || users[2];
  const stateCoAdmin = users.find(u => u.role === 'CO_ADMIN') || users[3];
  const member = users.find(u => u.role === 'MEMBER') || users[4];

  const roles = [
    {
      role: 'SUPER_ADMIN' as UserRole,
      label: 'Super Admin',
      subtitle: 'Central HQ (asadullah6959@gmail.com)',
      user: superAdmin,
      icon: Shield,
      accent: 'amber'
    },
    {
      role: 'FINANCE_OFFICER' as UserRole,
      label: 'Finance Officer',
      subtitle: 'Treasury & Audit',
      user: financeOfficer,
      icon: CreditCard,
      accent: 'emerald'
    },
    {
      role: 'ADMIN' as UserRole,
      label: 'District Admin',
      subtitle: `${districtAdmin.assignedDistrict || districtAdmin.district || 'Lahore'} (10/dist)`,
      user: districtAdmin,
      icon: MapPin,
      accent: 'blue'
    },
    {
      role: 'CO_ADMIN' as UserRole,
      label: 'State Co-Admin',
      subtitle: `${stateCoAdmin.assignedStateProvince || stateCoAdmin.stateProvince || 'Punjab'} (3/state)`,
      user: stateCoAdmin,
      icon: Building2,
      accent: 'indigo'
    },
    {
      role: 'MEMBER' as UserRole,
      label: 'Member',
      subtitle: member.name,
      user: member,
      icon: User,
      accent: 'purple'
    }
  ];

  return (
    <div className="no-print bg-[#0a192f] border-b border-slate-800 text-xs px-4 py-2 select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">Role Simulation</span>
          <span className="text-slate-700">|</span>
          <span className="hidden sm:inline text-slate-400 text-[11px]">Switch persona to test strict access permissions:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {roles.map(({ role, label, subtitle, user, icon: Icon }) => {
            const isActive = currentUser.id === user.id;
            return (
              <button
                key={role}
                onClick={() => switchUser(user.id)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-sm font-bold'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
                title={`Switch to ${user.name} (${label})`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                <div className="text-left flex flex-col leading-tight">
                  <span className="font-semibold text-[11px]">{label}</span>
                  <span className={`text-[9px] ${isActive ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                    {user.name.split(' ')[0]} ({user.assignedDistrict || user.assignedStateProvince || 'HQ'})
                  </span>
                </div>
                {isActive && <CheckCircle2 className="w-3 h-3 text-slate-950 ml-0.5" />}
              </button>
            );
          })}

          <button
            onClick={resetAllData}
            title="Reset simulation state to original defaults"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors ml-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="text-[10px]">Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
