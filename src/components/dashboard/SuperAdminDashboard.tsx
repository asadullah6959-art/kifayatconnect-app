import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  Coins, 
  Receipt, 
  MessageSquareWarning, 
  MapPin, 
  CheckSquare, 
  ShieldCheck, 
  TrendingUp, 
  ArrowUpRight,
  Clock
} from 'lucide-react';

import { mapLegacyRegionToHierarchy } from '../../data/locationData';

export const SuperAdminDashboard: React.FC = () => {
  const { 
    users, 
    applications, 
    payments, 
    complaints, 
    regionalStats, 
    setActiveTab, 
    language,
    setSelectedCardUser
  } = useApp();

  const totalMembers = users.filter(u => u.role === 'MEMBER').length;
  const activeMembers = users.filter(u => u.role === 'MEMBER' && u.membershipStatus === 'ACTIVE').length;
  
  const pendingApprovals = applications.filter(a => a.status === 'RECOMMENDED_BY_REGION');
  const pendingPayments = payments.filter(p => p.status === 'PENDING_VERIFICATION');
  const openComplaints = complaints.filter(c => c.status === 'OPEN' || c.status === 'UNDER_REVIEW');

  // Financial totals
  const verifiedPayments = payments.filter(p => p.status === 'VERIFIED');
  const totalVerifiedFunds = verifiedPayments.reduce((acc, curr) => acc + curr.amount, 0);
  const monthlyFunds = verifiedPayments
    .filter(p => p.fundCategory === 'Monthly Contribution')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const annualFunds = verifiedPayments
    .filter(p => p.fundCategory === 'Annual Welfare Fund')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner with Executive Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {language === 'ur' ? 'مرکزی انتظام' : 'Super Admin Authority'}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-500">Organization-Wide Command & Oversight</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {language === 'ur' ? 'مرکزی گورننس ڈیش بورڈ' : 'Executive Governance Dashboard'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full organizational jurisdiction across administrative districts, provinces, central treasury, and official appointments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('approvals')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Review Approvals ({pendingApprovals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md border border-slate-700 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Staff Roles & RBAC</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members */}
        <div 
          onClick={() => setActiveTab('members')}
          className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Registered Members</span>
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {totalMembers}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
              {activeMembers} Active <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span>All Districts</span>
            <span>·</span>
            <span>{applications.length} Total Submissions</span>
          </div>
        </div>

        {/* Total Collections */}
        <div 
          onClick={() => setActiveTab('funds')}
          className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Verified Funds</span>
            <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              PKR {totalVerifiedFunds.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Audited</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span>Monthly: PKR {monthlyFunds.toLocaleString()}</span>
            <span>·</span>
            <span>Annual: PKR {annualFunds.toLocaleString()}</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div 
          onClick={() => setActiveTab('approvals')}
          className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Final Approval Queue</span>
            <CheckSquare className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {pendingApprovals.length}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Regional Verified
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Awaiting Super Admin final authorization
          </div>
        </div>

        {/* Pending Payments & Grievances */}
        <div 
          onClick={() => setActiveTab('verification')}
          className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Tasks</span>
            <Receipt className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {pendingPayments.length + openComplaints.length}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">In Queue</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span>{pendingPayments.length} Payments</span>
            <span>·</span>
            <span>{openComplaints.length} Complaints</span>
          </div>
        </div>
      </div>

      {/* Main Grid: District & Province Governance Matrix & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: District & Province Governance Matrix */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                District & Province Governance Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Audited membership counts and total welfare collections per administrative hierarchy
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">ALL JURISDICTIONS</span>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">District</th>
                  <th className="py-2.5 px-3">State / Province</th>
                  <th className="py-2.5 px-3">Officer in Charge</th>
                  <th className="py-2.5 px-3 text-right">Total Members</th>
                  <th className="py-2.5 px-3 text-right">Active %</th>
                  <th className="py-2.5 px-3 text-right">Total Funds (PKR)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {regionalStats.map(stat => {
                  const fb = mapLegacyRegionToHierarchy(stat.region);
                  const dist = stat.district || fb.district;
                  const prov = stat.stateProvince || fb.stateProvince;

                  return (
                    <tr key={stat.region} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                        {dist}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-600 dark:text-slate-300">
                        {prov}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {stat.officerInCharge}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {stat.totalMembers}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                        {Math.round((stat.activeMembers / stat.totalMembers) * 100)}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                        {stat.totalCollected.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          Operational
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Approvals Needing Super Admin Final Signature */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Approvals Requiring Final Sign-off
                </h3>
                <p className="text-xs text-slate-500">
                  Recommended by Regional Officers
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                {pendingApprovals.length} PENDING
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {pendingApprovals.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No applications currently awaiting final Super Admin approval.
                </div>
              ) : (
                pendingApprovals.map(app => (
                  <div 
                    key={app.id} 
                    className="p-3 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">
                          {app.applicantName}
                        </h4>
                        <p className="text-slate-500 text-[11px]">
                          {app.district || mapLegacyRegionToHierarchy(app.region).district}, {app.stateProvince || mapLegacyRegionToHierarchy(app.region).stateProvince} · CNIC: {app.cnic}
                        </p>
                      </div>
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold uppercase">
                        Recommended
                      </span>
                    </div>

                    <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                      "{app.regionalRemarks}"
                      <span className="block text-[9px] text-slate-400 not-italic mt-0.5">
                        By: {app.regionalOfficerName}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setActiveTab('approvals')}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] rounded transition-colors"
                      >
                        Authorize & Grant ID
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('approvals')}
            className="w-full mt-4 py-2 text-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors"
          >
            Open Full Approvals Center →
          </button>
        </div>
      </div>

      {/* Quick Member Spotlight Card */}
      <div className="p-4 bg-slate-900 text-white rounded-lg border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img 
            src="/src/assets/images/kifayat_emblem_logo_1794225902501.jpg" 
            alt="Emblem" 
            className="w-12 h-12 rounded-lg object-cover border border-emerald-400"
          />
          <div>
            <h4 className="font-bold text-sm text-emerald-300">
              Role Authority Rule #1: Super Admin Integrity
            </h4>
            <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
              Super Admin possesses ultimate approval authority for staff creation and membership issuance. All financial modifications are immutably logged into the audit ledger.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('audit')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>View Full Audit Logs</span>
          </button>
        </div>
      </div>
    </div>
  );
};
