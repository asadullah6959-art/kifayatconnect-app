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
import { canAccessRouteTab, isFounderIdentity } from '../../utils/permissions';

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

  const isFounder = isFounderIdentity(currentUser);
  const vis = appSettings.dashboardVisibility || {
    showKpiGrid: true,
    showQuickActions: true,
    showApkSyncBanner: true,
    showDistrictMatrix: true,
    showOfficeBearersWidget: true,
    showAnnouncementsFeed: true
  };
  const showOfficeBearers = vis.showOfficeBearersWidget && canAccessRouteTab(currentUser, 'office_bearers');

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
    ...(isFounder
      ? [
          {
            label: translate(language, 'actionMasterPanel'),
            sub: language === 'ur' ? 'پن کنسول 👑' : 'PIN Console 👑',
            icon: Settings,
            accent: 'from-[#3A2A0A] to-[#0D2A1F] border-[#E5E4E2]/55 text-[#E5E4E2]',
            onClick: () => setActiveTab('manage_app')
          },
          {
            label: translate(language, 'actionManageRoles'),
            sub: language === 'ur' ? `${totalSuperAdmins + totalAdmins + totalCoAdmins} عملہ` : `${totalSuperAdmins + totalAdmins + totalCoAdmins} Staff`,
            icon: Crown,
            accent: 'from-[#0D2A1F] to-[#0F172A] border-[#059669]/40 text-[#059669]',
            onClick: () => setActiveTab('staff')
          }
        ]
      : []),
    {
      label: translate(language, 'actionVerifyPayments'),
      sub: language === 'ur'
        ? `${payments.filter(p => p.status === 'PENDING_VERIFICATION').length} زیر التواء`
        : `${payments.filter(p => p.status === 'PENDING_VERIFICATION').length} Pending`,
      icon: Receipt,
      accent: 'from-[#0D2A1F] to-[#0E1422] border-[#E5E4E2]/35 text-[#E5E4E2]',
      onClick: () => setActiveTab('funds')
    },
    {
      label: translate(language, 'actionAnnouncements'),
      sub: language === 'ur' ? 'آفیشل 👑 اور کمیونٹی' : 'Official 👑 & Community',
      icon: Megaphone,
      accent: 'from-[#0D2A1F] to-[#0E1422] border-[#E5E4E2]/35 text-amber-300',
      onClick: () => setActiveTab('announcements')
    },
    {
      label: translate(language, 'actionOpenChat'),
      sub: language === 'ur' ? 'لائیو ان باکس' : 'Live Inbox',
      icon: MessageSquare,
      accent: 'from-[#0D2A1F] to-[#0E1422] border-emerald-500/35 text-emerald-300',
      onClick: () => setActiveTab('chat')
    },
    {
      label: translate(language, 'actionDigitalId'),
      sub: language === 'ur' ? 'وی آئی پی کارڈ' : 'VIP Card',
      icon: IdCard,
      accent: 'from-[#0D2A1F] to-[#0E1422] border-[#E5E4E2]/35 text-[#E5E4E2]',
      onClick: () => currentUser && setSelectedCardUser(currentUser)
    }
  ];

  return (
    <div className="space-y-6 max-w-full">
      {/* Top Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E4E2]/25">
        <div className="flex items-center gap-3 min-w-0">
          <BrandEmblem3D size="sm" halo />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-[#E5E4E2] uppercase tracking-wider">
                {language === 'ur' ? 'سپر ایڈمن گورننس' : 'Super Admin Authority'}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-slate-400 font-mono truncate">{currentUser?.email}</span>
            </div>
            <h1 className={`text-xl sm:text-2xl font-extrabold text-white mt-0.5 truncate ${language === 'ur' ? 'kc-font-urdu' : ''}`}>
              {language === 'ur' ? 'مرکزی گورننس ڈیش بورڈ' : 'Executive Governance Dashboard'}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isFounder && (
            <button
              type="button"
              onClick={() => setActiveTab('manage_app')}
              className="flex items-center gap-1.5 px-3.5 py-2 kc-gold-button text-xs font-extrabold rounded-xl cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>{translate(language, 'navMasterControl')} 👑</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className="flex items-center gap-1.5 px-3.5 py-2 kc-emerald-panel hover:brightness-110 text-emerald-100 text-xs font-bold rounded-xl kc-pressable cursor-pointer"
          >
            <CheckSquare className="w-4 h-4 text-[#E5E4E2]" />
            <span className="tabular-nums">{translate(language, 'navApprovals')} ({pendingApprovals.length})</span>
          </button>
        </div>
      </div>

      {/* Apollo Telenor-style Quick Action Tiles */}
      {vis.showQuickActions && (
        <div className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#E5E4E2]">
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
                  className={`p-3.5 rounded-2xl bg-gradient-to-br ${act.accent} kc-glass-bevel kc-gold-touch text-left transition-transform hover:-translate-y-0.5 kc-pressable cursor-pointer`}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#071812] border border-[#E5E4E2]/40 flex items-center justify-center mb-2.5 shadow-inner">
                    <Icon className="w-4 h-4 text-[#E5E4E2]" />
                  </div>
                  <p className="text-xs font-extrabold text-white truncate">{act.label}</p>
                  <p className="text-[10px] text-slate-300 mt-0.5 truncate tabular-nums">{act.sub}</p>
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
            className="p-3.5 kc-obsidian-card rounded-2xl hover:border-[#E5E4E2]/65 kc-pressable cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">{translate(language, 'kpiTotalMembers')}</span>
              <Users className="w-4 h-4 text-[#E5E4E2]" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-white font-mono tabular-nums">{totalMembers}</span>
            </div>
            <div className="mt-1 text-[10px] text-emerald-400 font-semibold tabular-nums">
              {language === 'ur' ? `${activeMembers} فعال` : `${activeMembers} Active`}
            </div>
          </div>

          <div
            onClick={() => isFounder && setActiveTab('staff')}
            className={`p-3.5 kc-obsidian-card rounded-2xl ${isFounder ? 'hover:border-[#E5E4E2]/65 kc-pressable cursor-pointer' : ''}`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">{translate(language, 'roleSuperAdmin')}</span>
              <Crown className="w-4 h-4 text-[#E5E4E2]" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-white font-mono tabular-nums">{totalSuperAdmins}</span>
            </div>
            <div className="mt-1 text-[10px] text-[#E5E4E2] font-semibold">
              {translate(language, 'founderProtected')}
            </div>
          </div>

          <div
            onClick={() => isFounder && setActiveTab('staff')}
            className={`p-3.5 kc-obsidian-card rounded-2xl ${isFounder ? 'hover:border-[#E5E4E2]/65 kc-pressable cursor-pointer' : ''}`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">{translate(language, 'roleAdmin')}</span>
              <MapPin className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-white font-mono tabular-nums">{totalAdmins}</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-400 tabular-nums">
              {language === 'ur'
                ? `حد: ${appSettings.maxAdminsPerDistrict} فی ضلع`
                : `Max ${appSettings.maxAdminsPerDistrict}/District`}
            </div>
          </div>

          <div
            onClick={() => isFounder && setActiveTab('staff')}
            className={`p-3.5 kc-obsidian-card rounded-2xl ${isFounder ? 'hover:border-[#E5E4E2]/65 kc-pressable cursor-pointer' : ''}`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">{translate(language, 'roleCoAdmin')}</span>
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-white font-mono tabular-nums">{totalCoAdmins}</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-400 tabular-nums">
              {language === 'ur'
                ? `حد: ${appSettings.maxCoAdminsPerState} فی صوبہ`
                : `Max ${appSettings.maxCoAdminsPerState}/State`}
            </div>
          </div>

          <div
            onClick={() => setActiveTab('complaints')}
            className="p-3.5 kc-obsidian-card rounded-2xl hover:border-[#E5E4E2]/65 kc-pressable cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">{translate(language, 'kpiOpenTickets')}</span>
              <MessageSquareWarning className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold text-white font-mono tabular-nums">{openComplaintsCount}</span>
            </div>
            <div className="mt-1 text-[10px] text-amber-400 tabular-nums">
              {language === 'ur'
                ? `${appointedOfficeBearers}/13 عہدیداران مقرر`
                : `${appointedOfficeBearers}/13 Office-Bearers`}
            </div>
          </div>

          <div
            onClick={() => setActiveTab('funds')}
            className="p-3.5 kc-obsidian-card rounded-2xl hover:border-[#E5E4E2]/65 kc-pressable cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">{translate(language, 'kpiVerifiedFunds')}</span>
              <Coins className="w-4 h-4 text-[#E5E4E2]" />
            </div>
            <div className="mt-2">
              <span className="text-sm font-extrabold text-[#E5E4E2] font-mono tabular-nums">
                PKR {totalVerifiedFunds.toLocaleString()}
              </span>
            </div>
            <div className="mt-1 text-[10px] text-emerald-400">
              {language === 'ur' ? 'آڈٹ و تصدیق شدہ' : 'Audited & Verified'}
            </div>
          </div>
        </div>
      )}

      {/* App Updates & GitHub Releases Sync Card (PRESERVED) */}
      {vis.showApkSyncBanner && (
        <div className="kc-emerald-panel p-5 rounded-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Download className="w-4 h-4 text-[#E5E4E2]" />
                <span className="text-xs font-bold text-[#E5E4E2] uppercase tracking-wider">
                  {translate(language, 'apkUpdateSection')}
                </span>
                <span className="text-[11px] font-mono tabular-nums font-bold px-2 py-0.5 rounded-md bg-[#071812] text-emerald-300 border border-[#E5E4E2]/35">
                  {apkUrl
                    ? `${activeReleaseTag} — ${language === 'ur' ? 'APK دستیاب ہے' : 'APK Available'}`
                    : `v${INSTALLED_APP_VERSION} — ${translate(language, 'latestVersionInstalled')}`}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {hasAdminOverride && latestPublishedUpdate
                  ? latestPublishedUpdate.title
                  : (githubRelease?.apkUrl
                      ? githubRelease.releaseTitle
                      : (language === 'ur' ? 'سوئی خیل اتحاد موبائل ریلیز سینٹر' : 'SUI KHEL ITTEHAD Mobile Release Center'))}
              </h3>
              <p className="text-xs text-slate-200 max-w-2xl leading-relaxed">
                {language === 'ur' ? 'گٹ ہب ریلیزز سے منسلک (' : 'Synced with GitHub Releases ('}
                <a
                  href="https://github.com/asadullah6959-art/kifayatconnect-app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[#E5E4E2] hover:underline"
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
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl kc-gold-button font-extrabold text-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{translate(language, 'downloadApkBtn')} ({activeReleaseTag})</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => refreshGitHubRelease(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#071812] hover:bg-[#0D2A1F] text-[#E5E4E2] text-xs font-semibold border border-[#E5E4E2]/35 kc-pressable cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{translate(language, 'checkUpdatesBtn')}</span>
              </button>

              {isFounder && (
                <button
                  type="button"
                  onClick={() => setActiveTab('manage_app')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#071812] hover:bg-[#0D2A1F] text-slate-200 text-xs font-medium border border-[#E5E4E2]/30 kc-pressable cursor-pointer"
                >
                  <span>{translate(language, 'navMasterControl')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: District Governance Matrix & Office-Bearers */}
      {(vis.showDistrictMatrix || showOfficeBearers) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {vis.showDistrictMatrix && (
            <div className={`${showOfficeBearers ? 'lg:col-span-2' : 'lg:col-span-3'} kc-obsidian-card rounded-2xl p-5`}>
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E4E2]/20">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#E5E4E2]" />
                    <span>{language === 'ur' ? 'پاکستان جغرافیائی اور گورننس نظام' : 'Pakistan Geographic & Governance Hierarchy'}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {language === 'ur' ? 'ہر ضلع میں ممبران کی تعداد اور تصدیق شدہ ویلفیئر فنڈز' : 'Membership counts and verified welfare collections per district'}
                  </p>
                </div>
                <span className="text-xs text-[#E5E4E2] font-mono font-semibold">
                  {language === 'ur' ? 'تمام اضلاع' : 'ALL DISTRICTS'}
                </span>
              </div>

              <div className="mt-3 space-y-2.5">
                {districtRows.length === 0 ? (
                  <div className="py-8 px-4 text-center text-xs text-slate-400 rounded-xl border border-[#E5E4E2]/20 bg-[#071812]">
                    {language === 'ur'
                      ? 'ابھی تک کسی ضلع کی سرگرمی ریکارڈ نہیں ہوئی۔ ضلعی ایڈمن مقرر کریں یا ممبران کی منظوری دیں۔'
                      : 'No district activity recorded yet. Appoint Admins or approve members to populate district metrics.'}
                  </div>
                ) : (
                  districtRows.map((stat, idx) => {
                    const dist = stat.district;
                    const prov = stat.stateProvince;
                    const adminCount = users.filter(
                      u => u.role === 'ADMIN' && (u.assignedDistrict === dist || u.district === dist)
                    ).length;

                    return (
                      <div
                        key={dist ? `${prov}-${dist}` : `reg-${idx}`}
                        className="p-3 rounded-xl border border-[#E5E4E2]/25 bg-[#071812] space-y-1.5 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate">{dist}</span>
                            <span className="text-[11px] text-slate-400 block truncate">{prov}</span>
                          </div>
                          <span className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded bg-[#0D2A1F] border border-[#E5E4E2]/30 text-[#E5E4E2] shrink-0">
                            {language === 'ur' ? 'کوٹہ:' : 'Quota:'} {adminCount}/{appSettings.maxAdminsPerDistrict}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#E5E4E2]/15">
                          <span className="text-[11px] text-slate-300 truncate">
                            {stat.officerInCharge} · <span className="font-mono text-slate-200">{stat.totalMembers}</span> {language === 'ur' ? 'ممبران' : 'members'}
                          </span>
                          <span className="font-mono tabular-nums font-bold text-emerald-300 shrink-0">
                            PKR {stat.totalCollected.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {showOfficeBearers && (
            <div className={`${vis.showDistrictMatrix ? '' : 'lg:col-span-3'} kc-obsidian-card rounded-2xl p-5 flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E4E2]/20">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#E5E4E2]" />
                      <span>{translate(language, 'navOfficeBearers')}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 tabular-nums">
                      {language === 'ur'
                        ? `10 عہدے · 13 آئینی نشستیں (${vacantOfficeBearers} خالی)`
                        : `10 Proposed Titles · 13 Constitutional Seats (${vacantOfficeBearers} Vacant)`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('office_bearers')}
                    className="text-xs text-[#E5E4E2] hover:underline font-semibold cursor-pointer"
                  >
                    {language === 'ur' ? 'سب دیکھیں →' : 'View All →'}
                  </button>
                </div>

                <div className="mt-3 divide-y divide-[#E5E4E2]/10 max-h-72 overflow-y-auto space-y-1">
                  {officeBearers.slice(0, 5).map(seat => (
                    <div key={seat.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">{seat.title}</p>
                        <p className="text-[11px] text-slate-400">
                          {seat.status === 'ACTIVE' ? (
                            <span className="text-slate-300">{seat.assignedUserName}</span>
                          ) : (
                            <span className="text-[#E5E4E2]/80 italic">{language === 'ur' ? 'خالی نشست' : 'Vacant Seat'}</span>
                          )}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          seat.status === 'ACTIVE'
                            ? 'bg-[#0D2A1F] text-[#059669] border border-[#059669]/35'
                            : 'bg-[#071812] text-[#E5E4E2] border border-[#E5E4E2]/30'
                        }`}
                      >
                        {seat.status === 'ACTIVE' ? translate(language, 'activeLabel') : (language === 'ur' ? 'خالی' : seat.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-3 bg-[#071812] rounded-xl border border-[#E5E4E2]/25 text-[11px] text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#E5E4E2] shrink-0" />
                <span>
                  {language === 'ur'
                    ? 'تقرریاں تاریخی ریکارڈ محفوظ رکھتی ہیں اور ان کے لیے سپر ایڈمن کی منظوری ضروری ہے۔'
                    : 'Appointments preserve historical records and require Super Admin approval.'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
