import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Coins,
  MessageSquareWarning,
  MapPin,
  CheckSquare,
  ShieldCheck,
  Award,
  Building2,
  Settings,
  Download,
  RefreshCw,
  ChevronRight,
  Crown,
  Megaphone,
  MessageSquare,
  IdCard,
  Receipt
} from 'lucide-react';
import { mapLegacyRegionToHierarchy } from '../../data/locationData';
import { INSTALLED_APP_VERSION } from '../../services/githubReleases';
import { translate } from '../../data/translations';
import { BrandEmblem3D } from '../common/BrandEmblem3D';

export const SuperAdminDashboard: React.FC = () => {
  const {
    currentUser,
    users,
    applications,
    payments,
    complaints,
    regionalStats,
    officeBearers,
    latestPublishedUpdate,
    githubRelease,
    refreshGitHubRelease,
    appSettings,
    setActiveTab,
    setSelectedCardUser,
    language
  } = useApp();

  const vis = appSettings.dashboardVisibility || {
    showKpiGrid: true,
    showQuickActions: true,
    showApkSyncBanner: true,
    showDistrictMatrix: true,
    showOfficeBearersWidget: true,
    showAnnouncementsFeed: true
  };

  const totalMembers = users.filter(u => u.role === 'MEMBER').length;
  const activeMembers = users.filter(u => u.role === 'MEMBER' && u.membershipStatus === 'ACTIVE').length;
  const totalAdmins = users.filter(u => u.role === 'ADMIN').length;
  const totalCoAdmins = users.filter(u => u.role === 'CO_ADMIN').length;
  const totalSuperAdmins = users.filter(u => u.role === 'SUPER_ADMIN').length;

  const appointedOfficeBearers = officeBearers.filter(ob => ob.status === 'ACTIVE').length;
  const vacantOfficeBearers = officeBearers.filter(ob => ob.status === 'VACANT').length;

  const pendingApprovals = applications.filter(
    a => (a.status as string) === 'RECOMMENDED_BY_DISTRICT' || (a.status as string) === 'PENDING_DISTRICT_REVIEW'
  );

  const openComplaintsCount = complaints.filter(c => c.status === 'OPEN' || c.status === 'UNDER_REVIEW').length;
  const verifiedPayments = payments.filter(p => p.status === 'VERIFIED');
  const totalVerifiedFunds = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);

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

  const apolloActions = [
    {
      label: translate(language, 'actionMasterPanel'),
      sub: 'PIN Console 👑',
      icon: Settings,
      accent: 'from-[#3A2A0A] to-[#161D2C] border-[#F5D061]/50 text-[#F5D061]',
      onClick: () => setActiveTab('manage_app')
    },
    {
      label: translate(language, 'actionManageRoles'),
      sub: `${totalSuperAdmins + totalAdmins + totalCoAdmins} Staff`,
      icon: Crown,
      accent: 'from-[#043927] to-[#111622] border-[#D4AF37]/40 text-emerald-300',
      onClick: () => setActiveTab('staff')
    },
    {
      label: translate(language, 'actionVerifyPayments'),
      sub: `${payments.filter(p => p.status === 'PENDING_VERIFICATION').length} Pending`,
      icon: Receipt,
      accent: 'from-[#111622] to-[#161D2C] border-[#D4AF37]/30 text-[#F5D061]',
      onClick: () => setActiveTab('funds')
    },
    {
      label: translate(language, 'actionAnnouncements'),
      sub: 'Official 👑 & Community',
      icon: Megaphone,
      accent: 'from-[#111622] to-[#161D2C] border-[#D4AF37]/30 text-amber-300',
      onClick: () => setActiveTab('announcements')
    },
    {
      label: translate(language, 'actionOpenChat'),
      sub: 'Live Inbox',
      icon: MessageSquare,
      accent: 'from-[#111622] to-[#161D2C] border-emerald-500/30 text-emerald-300',
      onClick: () => setActiveTab('chat')
    },
    {
      label: translate(language, 'actionDigitalId'),
      sub: 'VIP Card',
      icon: IdCard,
      accent: 'from-[#111622] to-[#161D2C] border-[#D4AF37]/30 text-[#F5D061]',
      onClick: () => currentUser && setSelectedCardUser(currentUser)
    }
  ];

  return (
    <div className="space-y-6 max-w-full">
      {/* Top Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div className="flex items-center gap-3 min-w-0">
          <BrandEmblem3D size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-[#F5D061] uppercase tracking-wider">
                {language === 'ur' ? 'سپر ایڈمن گورننس' : 'Super Admin Authority'}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-slate-400 font-mono truncate">{currentUser?.email}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5 truncate">
              {language === 'ur' ? 'مرکزی گورننس ڈیش بورڈ' : 'Executive Governance Dashboard'}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('manage_app')}
            className="flex items-center gap-1.5 px-3.5 py-2 kc-gold-button text-xs font-extrabold rounded-xl cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>{translate(language, 'navMasterControl')} 👑</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#043927] hover:bg-emerald-900 text-emerald-100 border border-[#D4AF37]/40 text-xs font-bold rounded-xl cursor-pointer"
          >
            <CheckSquare className="w-4 h-4 text-[#F5D061]" />
            <span>{translate(language, 'navApprovals')} ({pendingApprovals.length})</span>
          </button>
        </div>
      </div>

      {/* Apollo Telenor-style Quick Action Tiles */}
      {vis.showQuickActions && (
        <div className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F5D061]">
            {translate(language, 'quickActionsTitle')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {apolloActions.map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.label}
                  type="button"
                  onClick={act.onClick}
                  className={`p-3.5 rounded-2xl bg-gradient-to-br ${act.accent} border text-left transition-transform hover:-translate-y-0.5 active:scale-[0.98] shadow-lg cursor-pointer`}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#0A0D12]/80 border border-[#D4AF37]/30 flex items-center justify-center mb-2.5">
                    <Icon className="w-4 h-4 text-[#F5D061]" />
                  </div>
                  <p className="text-xs font-extrabold text-white truncate">{act.label}</p>
                  <p className="text-[10px] text-slate-300 mt-0.5 truncate">{act.sub}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary KPI Metric Cards (Strict 4-Role Stats) */}
      {vis.showKpiGrid && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div
            onClick={() => setActiveTab('members')}
            className="p-3.5 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 hover:border-[#F5D061]/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">{translate(language, 'kpiTotalMembers')}</span>
              <Users className="w-4 h-4 text-[#F5D061]" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-white font-mono tabular-nums">{totalMembers}</span>
            </div>
            <div className="mt-1 text-[10px] text-emerald-400 font-semibold">{activeMembers} Active</div>
          </div>

          <div
            onClick={() => setActiveTab('staff')}
            className="p-3.5 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 hover:border-[#F5D061]/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">{translate(language, 'roleSuperAdmin')}</span>
              <Crown className="w-4 h-4 text-[#F5D061]" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-white font-mono tabular-nums">{totalSuperAdmins}</span>
            </div>
            <div className="mt-1 text-[10px] text-[#F5D061] font-semibold">Founder Protected</div>
          </div>

          <div
            onClick={() => setActiveTab('staff')}
            className="p-3.5 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 hover:border-[#F5D061]/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">{translate(language, 'roleAdmin')}</span>
              <MapPin className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-white font-mono tabular-nums">{totalAdmins}</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-400">Max {appSettings.maxAdminsPerDistrict}/District</div>
          </div>

          <div
            onClick={() => setActiveTab('staff')}
            className="p-3.5 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 hover:border-[#F5D061]/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">{translate(language, 'roleCoAdmin')}</span>
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-white font-mono tabular-nums">{totalCoAdmins}</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-400">Max {appSettings.maxCoAdminsPerState}/State</div>
          </div>

          <div
            onClick={() => setActiveTab('complaints')}
            className="p-3.5 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 hover:border-[#F5D061]/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">{translate(language, 'kpiOpenTickets')}</span>
              <MessageSquareWarning className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-white font-mono tabular-nums">{openComplaintsCount}</span>
            </div>
            <div className="mt-1 text-[10px] text-amber-400">{appointedOfficeBearers}/13 Office-Bearers</div>
          </div>

          <div
            onClick={() => setActiveTab('funds')}
            className="p-3.5 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 hover:border-[#F5D061]/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">{translate(language, 'kpiVerifiedFunds')}</span>
              <Coins className="w-4 h-4 text-[#F5D061]" />
            </div>
            <div className="mt-2">
              <span className="text-sm font-extrabold text-[#F5D061] font-mono tabular-nums">
                PKR {totalVerifiedFunds.toLocaleString()}
              </span>
            </div>
            <div className="mt-1 text-[10px] text-emerald-400">Audited & Verified</div>
          </div>
        </div>
      )}

      {/* App Updates & GitHub Releases Sync Card (PRESERVED) */}
      {vis.showApkSyncBanner && (
        <div className="bg-gradient-to-r from-[#043927]/70 via-[#111622] to-[#111622] p-5 rounded-2xl border border-[#D4AF37]/35 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Download className="w-4 h-4 text-[#F5D061]" />
                <span className="text-xs font-bold text-[#F5D061] uppercase tracking-wider">
                  {translate(language, 'apkUpdateSection')}
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {apkUrl
                    ? `${activeReleaseTag} — APK Available`
                    : `v${INSTALLED_APP_VERSION} — ${translate(language, 'latestVersionInstalled')}`}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {hasAdminOverride && latestPublishedUpdate
                  ? latestPublishedUpdate.title
                  : (githubRelease?.apkUrl ? githubRelease.releaseTitle : 'Kifayat Connect Mobile Release Center')}
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Synced with GitHub Releases (
                <a
                  href="https://github.com/asadullah6959-art/kifayatconnect-app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[#F5D061] hover:underline"
                >
                  asadullah6959-art/kifayatconnect-app
                </a>
                ).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {apkUrl && (
                <a
                  href={apkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl kc-gold-button font-extrabold text-xs shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{translate(language, 'downloadApkBtn')} ({activeReleaseTag})</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => refreshGitHubRelease(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0A0D12] hover:bg-slate-800 text-[#F5D061] text-xs font-semibold border border-[#D4AF37]/30 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{translate(language, 'checkUpdatesBtn')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manage_app')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A0D12] hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer"
              >
                <span>Master Control</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: District Governance Matrix & Office-Bearers */}
      {(vis.showDistrictMatrix || vis.showOfficeBearersWidget) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {vis.showDistrictMatrix && (
            <div className={`${vis.showOfficeBearersWidget ? 'lg:col-span-2' : 'lg:col-span-3'} bg-[#111622] rounded-2xl border border-[#D4AF37]/25 p-5 shadow-xs`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#F5D061]" />
                    <span>Pakistan Geographic & Governance Hierarchy</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Membership counts and verified welfare collections per district
                  </p>
                </div>
                <span className="text-xs text-[#F5D061] font-mono font-semibold">ALL DISTRICTS</span>
              </div>

              <div className="overflow-x-auto mt-3">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-medium">
                      <th className="py-2.5 px-3">District</th>
                      <th className="py-2.5 px-3">State / Province</th>
                      <th className="py-2.5 px-3">Admin</th>
                      <th className="py-2.5 px-3 text-right">Members</th>
                      <th className="py-2.5 px-3 text-right">Quota</th>
                      <th className="py-2.5 px-3 text-right">Funds (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {districtRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No district activity recorded yet. Appoint Admins or approve members to populate district metrics.
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
                          <tr key={dist ? `${prov}-${dist}` : `reg-${idx}`} className="hover:bg-[#161D2C] transition-colors">
                            <td className="py-2.5 px-3 font-bold text-white">{dist}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-300">{prov}</td>
                            <td className="py-2.5 px-3 text-slate-400">{stat.officerInCharge}</td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-200">{stat.totalMembers}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0A0D12] border border-[#D4AF37]/30 text-[#F5D061]">
                                {adminCount}/{appSettings.maxAdminsPerDistrict}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-300">
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
          )}

          {vis.showOfficeBearersWidget && (
            <div className={`${vis.showDistrictMatrix ? '' : 'lg:col-span-3'} bg-[#111622] rounded-2xl border border-[#D4AF37]/25 p-5 shadow-xs flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#F5D061]" />
                      <span>Office-Bearers</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      10 Proposed Titles · 13 Constitutional Seats ({vacantOfficeBearers} Vacant)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('office_bearers')}
                    className="text-xs text-[#F5D061] hover:underline font-semibold cursor-pointer"
                  >
                    View All →
                  </button>
                </div>

                <div className="mt-3 divide-y divide-slate-800/70 max-h-72 overflow-y-auto space-y-1">
                  {officeBearers.slice(0, 5).map(seat => (
                    <div key={seat.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">{seat.title}</p>
                        <p className="text-[11px] text-slate-400">
                          {seat.status === 'ACTIVE' ? (
                            <span className="text-slate-300">{seat.assignedUserName}</span>
                          ) : (
                            <span className="text-[#F5D061]/80 italic">Vacant Seat</span>
                          )}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          seat.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-[#F5D061] border border-amber-500/20'
                        }`}
                      >
                        {seat.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-3 bg-[#0A0D12] rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#F5D061] shrink-0" />
                <span>Appointments preserve historical records and require Super Admin approval.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
