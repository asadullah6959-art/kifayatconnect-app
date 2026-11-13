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
  Award,
  Building2,
  Settings,
  Download,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { mapLegacyRegionToHierarchy } from '../../data/locationData';
import { INSTALLED_APP_VERSION } from '../../services/githubReleases';

export const SuperAdminDashboard: React.FC = () => {
  const { 
    users, 
    applications, 
    payments, 
    regionalStats, 
    officeBearers,
    latestPublishedUpdate,
    githubRelease,
    refreshGitHubRelease,
    setActiveTab, 
    language
  } = useApp();

  const totalMembers = users.filter(u => u.role === 'MEMBER').length;
  const activeMembers = users.filter(u => u.role === 'MEMBER' && u.membershipStatus === 'ACTIVE').length;
  
  const totalDistrictAdmins = users.filter(u => u.role === 'ADMIN').length;
  const totalStateCoAdmins = users.filter(u => u.role === 'CO_ADMIN').length;
  const totalFinanceOfficers = users.filter(u => u.role === 'FINANCE_OFFICER').length;

  const appointedOfficeBearers = officeBearers.filter(ob => ob.status === 'ACTIVE').length;
  const vacantOfficeBearers = officeBearers.filter(ob => ob.status === 'VACANT').length;

  const pendingApprovals = applications.filter(
    a => (a.status as any) === 'RECOMMENDED_BY_DISTRICT' || (a.status as any) === 'RECOMMENDED_BY_REGION'
  );

  const verifiedPayments = payments.filter(p => p.status === 'VERIFIED');
  const totalVerifiedFunds = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);

  // Dynamic District Aggregations from live users & verified payments
  const liveDistrictMap = new Map<string, {
    district: string;
    stateProvince: string;
    officerInCharge: string;
    totalMembers: number;
    totalCollected: number;
  }>();

  users.forEach(u => {
    const dist = u.district || 'Unassigned';
    const prov = u.stateProvince || 'Pakistan';
    const key = `${prov}__${dist}`;
    if (!liveDistrictMap.has(key)) {
      const distAdmin = users.find(a => a.role === 'ADMIN' && (a.assignedDistrict === dist || a.district === dist));
      liveDistrictMap.set(key, {
        district: dist,
        stateProvince: prov,
        officerInCharge: distAdmin?.name || 'Unassigned',
        totalMembers: 0,
        totalCollected: 0
      });
    }
    if (u.role === 'MEMBER') {
      liveDistrictMap.get(key)!.totalMembers += 1;
    }
  });

  verifiedPayments.forEach(p => {
    const dist = p.district || 'Unassigned';
    const prov = p.stateProvince || 'Pakistan';
    const key = `${prov}__${dist}`;
    if (!liveDistrictMap.has(key)) {
      liveDistrictMap.set(key, {
        district: dist,
        stateProvince: prov,
        officerInCharge: 'Unassigned',
        totalMembers: 0,
        totalCollected: 0
      });
    }
    liveDistrictMap.get(key)!.totalCollected += p.amount;
  });

  const districtRows = regionalStats.length > 0
    ? regionalStats.map(s => {
        const fb = mapLegacyRegionToHierarchy(s.region);
        return {
          district: s.district || fb.district,
          stateProvince: s.stateProvince || fb.stateProvince,
          officerInCharge: s.officerInCharge,
          totalMembers: s.totalMembers,
          totalCollected: s.totalCollected
        };
      })
    : Array.from(liveDistrictMap.values());

  const hasAdminOverride = Boolean(latestPublishedUpdate?.isPublished && latestPublishedUpdate?.apkDownloadUrl);
  const apkUrl = hasAdminOverride
    ? latestPublishedUpdate!.apkDownloadUrl
    : (githubRelease?.apkUrl || '');
  const activeReleaseTag = hasAdminOverride && latestPublishedUpdate
    ? `v${latestPublishedUpdate.version.replace(/^v/i, '')}`
    : (githubRelease?.tagName || `v${INSTALLED_APP_VERSION}`);

  return (
    <div className="space-y-6 max-w-full">
      {/* Top Banner with Executive Status & Quick Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
              {language === 'ur' ? 'مرکزی انتظام' : 'Super Admin Authority'}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-400 font-mono truncate">asadullah6959@gmail.com</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-amber-500 shrink-0" />
            <span>{language === 'ur' ? 'مرکزی گورننس ڈیش بورڈ' : 'Executive Governance Dashboard'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Full organizational jurisdiction across administrative districts, provinces, central treasury, office-bearer appointments, and mobile app updates.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('manage_app')}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-md shadow-amber-500/15 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Manage App Console</span>
          </button>

          <button
            onClick={() => setActiveTab('office_bearers')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl border border-amber-500/30 transition-colors cursor-pointer"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Office-Bearers ({appointedOfficeBearers}/13)</span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Approvals ({pendingApprovals.length})</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Cards (6-Stat Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Members */}
        <div 
          onClick={() => setActiveTab('members')}
          className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition-colors cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Members</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {totalMembers}
            </span>
          </div>
          <div className="mt-1 text-[10px] text-emerald-500 font-medium">
            {activeMembers} Active
          </div>
        </div>

        {/* Total District Admins */}
        <div 
          onClick={() => setActiveTab('staff')}
          className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition-colors cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">District Admins</span>
            <MapPin className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {totalDistrictAdmins}
            </span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            Max 10 per District
          </div>
        </div>

        {/* Total State Co-Admins */}
        <div 
          onClick={() => setActiveTab('staff')}
          className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition-colors cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">State Co-Admins</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {totalStateCoAdmins}
            </span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            Max 3 per Province
          </div>
        </div>

        {/* Finance Officers */}
        <div 
          onClick={() => setActiveTab('verification')}
          className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition-colors cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Finance Desk</span>
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {totalFinanceOfficers}
            </span>
          </div>
          <div className="mt-1 text-[10px] text-emerald-400">
            Treasury Officers
          </div>
        </div>

        {/* Office-Bearers */}
        <div 
          onClick={() => setActiveTab('office_bearers')}
          className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition-colors cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Office-Bearers</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {appointedOfficeBearers}/13
            </span>
          </div>
          <div className="mt-1 text-[10px] text-amber-400">
            {vacantOfficeBearers} Vacant Seats
          </div>
        </div>

        {/* Central Treasury Total */}
        <div 
          onClick={() => setActiveTab('funds')}
          className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition-colors cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Treasury</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              PKR {totalVerifiedFunds.toLocaleString()}
            </span>
          </div>
          <div className="mt-1 text-[10px] text-emerald-400">
            Audited & Verified
          </div>
        </div>
      </div>

      {/* App Updates & GitHub Releases Sync Card */}
      <div className="bg-gradient-to-r from-[#0a192f] via-slate-900 to-slate-900 p-5 rounded-2xl border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Download className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                App Updates & GitHub Releases Sync
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {apkUrl
                  ? `${activeReleaseTag} — APK Available`
                  : `v${INSTALLED_APP_VERSION} — Latest Version Installed`}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              {hasAdminOverride && latestPublishedUpdate
                ? latestPublishedUpdate.title
                : (githubRelease?.apkUrl ? githubRelease.releaseTitle : 'Kifayat Connect Mobile Release Center')}
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Automatically synced with GitHub repository releases (
              <a
                href="https://github.com/asadullah6959-art/kifayatconnect-app"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-amber-300 hover:underline"
              >
                asadullah6959-art/kifayatconnect-app
              </a>
              ). APK links appear only when a verified release binary is published.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {apkUrl && (
              <a
                href={apkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download APK ({activeReleaseTag})</span>
              </a>
            )}

            <button
              onClick={() => refreshGitHubRelease(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Check Releases</span>
            </button>

            <button
              onClick={() => setActiveTab('manage_app')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              <span>Manage Releases</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: District & Province Governance Matrix & Office-Bearers Quick Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: District & Province Governance Matrix */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500" />
                Pakistan Geographic & Governance Hierarchy
              </h3>
              <p className="text-xs text-slate-500">
                Audited membership counts and total welfare collections per administrative district
              </p>
            </div>
            <span className="text-xs text-amber-500 font-mono font-semibold">ALL DISTRICTS</span>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">District</th>
                  <th className="py-2.5 px-3">State / Province</th>
                  <th className="py-2.5 px-3">District Admin</th>
                  <th className="py-2.5 px-3 text-right">Members</th>
                  <th className="py-2.5 px-3 text-right">Quota</th>
                  <th className="py-2.5 px-3 text-right">Funds (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {districtRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No district activity recorded yet. Appoint District Admins or approve members to populate district metrics.
                    </td>
                  </tr>
                ) : (
                  districtRows.map((stat, idx) => {
                    const dist = stat.district;
                    const prov = stat.stateProvince;
                    const adminCount = users.filter(
                      u => u.role === 'ADMIN' && (u.assignedDistrict === dist || u.district === dist)
                    ).length;

                    return (
                      <tr key={dist ? `${prov}-${dist}` : `reg-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
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
                        <td className="py-2.5 px-3 text-right">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-400">
                            {adminCount}/10 Admins
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                          {stat.totalCollected.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Office-Bearers Quick Overview */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Office-Bearers
                </h3>
                <p className="text-[11px] text-slate-500">
                  10 Proposed Titles · 13 Constitutional Seats
                </p>
              </div>
              <button
                onClick={() => setActiveTab('office_bearers')}
                className="text-xs text-amber-500 hover:text-amber-400 font-semibold cursor-pointer"
              >
                View All →
              </button>
            </div>

            <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto space-y-1">
              {officeBearers.slice(0, 5).map(seat => (
                <div key={seat.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{seat.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {seat.status === 'ACTIVE' ? (
                        <span className="text-slate-300">{seat.assignedUserName}</span>
                      ) : (
                        <span className="text-amber-500/80 font-medium italic">Vacant Seat</span>
                      )}
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    seat.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {seat.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            <p className="leading-relaxed">
              Appointments preserve historical record and require Super Admin approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
