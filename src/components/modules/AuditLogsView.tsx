import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Clock, 
  Search, 
  ShieldCheck, 
  Coins, 
  Users, 
  MapPin, 
  Filter,
  Lock
} from 'lucide-react';
import { AuditLog } from '../../types';
import { mapLegacyRegionToHierarchy } from '../../data/locationData';

export const AuditLogsView: React.FC = () => {
  const { currentUser, auditLogs, language } = useApp();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isDistrictAdmin = currentUser?.role === 'ADMIN';
  const isCoAdmin = currentUser?.role === 'CO_ADMIN';
  const isMember = currentUser?.role === 'MEMBER';

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  if (!currentUser) return null;

  // Strict role-scoped audit visibility per matrix:
  const allowedLogs = auditLogs.filter(log => {
    if (isSuperAdmin) return true; // Super Admin sees all organization logs
    if (isDistrictAdmin) {
      const myDist = currentUser.assignedDistrict || currentUser.district;
      const logDist = log.district || (log.region ? mapLegacyRegionToHierarchy(log.region).district : '');
      return logDist === myDist || log.region === currentUser.region || log.category === 'REGIONAL';
    }
    if (isCoAdmin) {
      const myProv = currentUser.assignedStateProvince || currentUser.stateProvince;
      const logProv = log.stateProvince || (log.region ? mapLegacyRegionToHierarchy(log.region).stateProvince : '');
      return logProv === myProv;
    }
    if (isMember) {
      return log.actorId === currentUser.id || log.targetEntity.includes(currentUser.name); // Own activity only
    }
    return false;
  });

  const filteredLogs = allowedLogs.filter(log => {
    const fb = log.region ? mapLegacyRegionToHierarchy(log.region) : { district: '', stateProvince: '' };
    const lDist = log.district || fb.district;
    const lProv = log.stateProvince || fb.stateProvince;

    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetEntity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lDist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lProv.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || log.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (category: AuditLog['category']) => {
    switch (category) {
      case 'ROLE_MANAGEMENT':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'FINANCIAL':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'MEMBERSHIP':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'REGIONAL':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'SECURITY':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Compliance & Accountability
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-500">
              {isSuperAdmin && 'Master Organization Audit Trail'}
              {isDistrictAdmin && `${currentUser.assignedDistrict || currentUser.district} Activity Audit Trail`}
              {isCoAdmin && `${currentUser.assignedStateProvince || currentUser.stateProvince} Activity Audit Trail`}
              {isMember && 'My Personal Account Activity Trail'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Immutable Governance Audit Log</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSuperAdmin 
              ? 'Complete historical ledger of approvals, payment certifications, role changes, and administrative actions.' 
              : 'Strictly filtered to records necessary for your operational role.'}
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full sm:w-64"
            />
          </div>

          {isSuperAdmin && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
            >
              <option value="ALL">All Categories</option>
              <option value="ROLE_MANAGEMENT">Role Management</option>
              <option value="FINANCIAL">Financial Verifications</option>
              <option value="MEMBERSHIP">Membership Approvals</option>
              <option value="REGIONAL">District / State Decisions</option>
              <option value="SECURITY">Security Events</option>
            </select>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 font-medium">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor & Role</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Detailed Statement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No audit records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                        {log.actorName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {log.actorRole} {log.district ? `· ${log.district}, ${log.stateProvince || 'Pakistan'}` : log.region ? `· ${log.region}` : ''}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {log.action}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${getCategoryBadge(log.category)}`}>
                        {log.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                      {log.targetEntity}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
