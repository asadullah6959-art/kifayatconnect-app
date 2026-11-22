import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  Users,
  MapPin,
  ShieldCheck,
  CheckSquare,
  MessageSquareWarning,
  Megaphone,
  Send,
  Eye,
  MessageSquare,
  IdCard
} from 'lucide-react';
import { PAKISTAN_LOCATION_DATA } from '../../data/locationData';
import { RoleBadge } from '../common/RoleBadge';
import { LuxurySelect } from '../common/LuxurySelect';
import { translate } from '../../data/translations';

export const CoAdminDashboard: React.FC = () => {
  const {
    currentUser,
    users,
    applications,
    complaints,
    appSettings,
    publishAnnouncement,
    setInspectedUserProfile,
    setActiveTab,
    setActiveChatUser,
    setSelectedCardUser,
    language
  } = useApp();

  const assignedState = currentUser?.assignedStateProvince || currentUser?.stateProvince || 'Punjab';

  const [isCreatingAnnouncement, setIsCreatingAnnouncement] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>('ALL');

  if (!currentUser) return null;

  const vis = appSettings.dashboardVisibility || {
    showKpiGrid: true,
    showQuickActions: true,
    showApkSyncBanner: true,
    showDistrictMatrix: true,
    showOfficeBearersWidget: true,
    showAnnouncementsFeed: true
  };

  const stateMembers = users.filter(
    u => u.role === 'MEMBER' && (u.stateProvince === assignedState || u.assignedStateProvince === assignedState)
  );

  const stateAdmins = users.filter(
    u => u.role === 'ADMIN' && (u.assignedStateProvince === assignedState || u.stateProvince === assignedState)
  );

  const stateApplications = applications.filter(
    a => a.stateProvince === assignedState || a.region?.includes(assignedState)
  );

  const stateComplaints = complaints.filter(
    c => c.stateProvince === assignedState || c.region?.includes(assignedState)
  );

  const stateLocationInfo = PAKISTAN_LOCATION_DATA.find(s => s.stateProvince === assignedState);
  const districtList = stateLocationInfo ? stateLocationInfo.districts.map(d => d.district) : ['Lahore', 'Faisalabad', 'Rawalpindi', 'Multan'];

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim()) return;

    publishAnnouncement({
      title: announcementTitle,
      content: announcementContent,
      announcementType: 'COMMUNITY',
      targetScope: selectedDistrictFilter === 'ALL' ? 'PROVINCE' : 'DISTRICT',
      targetStateProvince: assignedState,
      targetDistrict: selectedDistrictFilter === 'ALL' ? undefined : selectedDistrictFilter,
      urgency: 'NORMAL',
      isPinned: false
    });

    setAnnouncementTitle('');
    setAnnouncementContent('');
    setIsCreatingAnnouncement(false);
  };

  const handleOpenChat = (targetUser: any) => {
    setActiveChatUser(targetUser);
    setActiveTab('chat');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E4E2]/25">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              {language === 'ur' ? 'صوبائی کو ایڈمن پینل' : 'State / Provincial Co-Administration'}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-400 font-medium">
              {language === 'ur' ? `${assignedState} صوبہ` : `${assignedState} Province`}
            </span>
          </div>
          <h1 className={`text-xl sm:text-2xl font-extrabold text-white mt-1 flex items-center gap-2.5 ${language === 'ur' ? 'kc-font-urdu' : ''}`}>
            <Building2 className="w-6 h-6 text-[#E5E4E2] shrink-0" />
            <span>{assignedState} – {translate(language, 'roleCoAdmin')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'ur'
              ? <>کو ایڈمن: <strong className="text-white">{currentUser.name}</strong> · {assignedState} کے اضلاع میں صوبائی رابطہ کاری۔</>
              : <>Co-Admin: <strong className="text-white">{currentUser.name}</strong> · Provincial coordination across districts in {assignedState}.</>}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 kc-emerald-panel rounded-xl text-[11px] text-[#E5E4E2]">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span className="tabular-nums">
            {language === 'ur'
              ? `کوٹہ: ${assignedState} میں زیادہ سے زیادہ ${appSettings.maxCoAdminsPerState} صوبائی کو ایڈمن۔`
              : `Quota: Max ${appSettings.maxCoAdminsPerState} State Co-Admins for ${assignedState}.`}
          </span>
        </div>
      </div>

      {/* Apollo-Style Quick Actions */}
      {vis.showQuickActions && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: translate(language, 'navMembers'), icon: Users, onClick: () => setActiveTab('members') },
            { label: translate(language, 'actionAnnouncements'), icon: Megaphone, onClick: () => setActiveTab('announcements') },
            { label: translate(language, 'actionOpenChat'), icon: MessageSquare, onClick: () => setActiveTab('chat') },
            { label: translate(language, 'actionDigitalId'), icon: IdCard, onClick: () => setSelectedCardUser(currentUser) }
          ].map(card => {
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                type="button"
                onClick={card.onClick}
                className="p-3.5 rounded-2xl kc-obsidian-card kc-gold-touch hover:border-[#E5E4E2]/65 text-left transition-transform hover:-translate-y-0.5 kc-pressable cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl kc-emerald-panel flex items-center justify-center mb-2">
                  <Icon className="w-4 h-4 text-[#E5E4E2]" />
                </div>
                <span className="text-xs font-extrabold text-white block truncate">{card.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* KPI Cards */}
      {vis.showKpiGrid && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 kc-obsidian-card rounded-2xl">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {language === 'ur' ? 'صوبائی ممبران' : 'Provincial Members'}
              </span>
              <Users className="w-4 h-4 text-[#E5E4E2]" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-mono tabular-nums">{stateMembers.length}</span>
              <span className="text-xs text-emerald-400 font-semibold">{assignedState}</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400 tabular-nums">
              {language === 'ur' ? `${districtList.length} اضلاع میں` : `Across ${districtList.length} districts`}
            </div>
          </div>

          <div className="p-4 kc-obsidian-card rounded-2xl">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {language === 'ur' ? 'ضلعی ایڈمنز' : 'District Admins'}
              </span>
              <MapPin className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-mono tabular-nums">{stateAdmins.length}</span>
              <span className="text-xs text-[#E5E4E2] font-semibold tabular-nums">
                {language === 'ur' ? `حد ${appSettings.maxAdminsPerDistrict}/ضلع` : `${appSettings.maxAdminsPerDistrict}/dist limit`}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              {language === 'ur' ? 'فیلڈ عہدیداران' : 'Field administrators'}
            </div>
          </div>

          <div className="p-4 kc-obsidian-card rounded-2xl">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {language === 'ur' ? 'درخواستیں' : 'Applications'}
              </span>
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-mono tabular-nums">{stateApplications.length}</span>
              <span className="text-xs text-emerald-400 font-semibold">
                {language === 'ur' ? 'منظوری قطار' : 'Pipeline'}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              {language === 'ur' ? `${assignedState} میں رجسٹریشن` : `Onboarding in ${assignedState}`}
            </div>
          </div>

          <div className="p-4 kc-obsidian-card rounded-2xl">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {language === 'ur' ? 'جاری شکایات' : 'Open Complaints'}
              </span>
              <MessageSquareWarning className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                {stateComplaints.filter(c => c.status === 'OPEN').length}
              </span>
              <span className="text-xs text-rose-400 font-semibold">
                {translate(language, 'activeLabel')}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              {language === 'ur' ? 'صوبائی شکایات' : 'Provincial grievances'}
            </div>
          </div>
        </div>
      )}

      {/* Grid: District Admins Overview & Provincial Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="kc-obsidian-card rounded-2xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E4E2]/20">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#E5E4E2]" />
                <span>{language === 'ur' ? `${assignedState} کے ضلعی ایڈمنز` : `District Admins in ${assignedState}`}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'ur' ? 'اضلاع میں تعینات فیلڈ افسران' : 'Appointed field officers across districts'}
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums font-bold text-[#E5E4E2] bg-[#071812] border border-[#E5E4E2]/30 px-2.5 py-0.5 rounded-full">
              {stateAdmins.length} {language === 'ur' ? 'ایڈمنز' : 'Admins'}
            </span>
          </div>

          <div className="mt-3 divide-y divide-[#E5E4E2]/10 max-h-80 overflow-y-auto">
            {stateAdmins.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {language === 'ur'
                  ? `${assignedState} میں ابھی کوئی ضلعی ایڈمن مقرر نہیں ہے۔`
                  : `No District Admins currently assigned in ${assignedState}.`}
              </div>
            ) : (
              stateAdmins.map(admin => (
                <div key={admin.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    {(admin.avatarUrl || admin.avatar) ? (
                      <img src={admin.avatarUrl || admin.avatar} alt={admin.name} className="w-8 h-8 rounded-full border border-[#E5E4E2]/40 object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#0D2A1F] text-[#059669] border border-[#059669]/40 flex items-center justify-center font-bold text-xs shrink-0">
                        {admin.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-white truncate">{admin.name}</p>
                        <RoleBadge role={admin.role} isFounder={admin.isFounder} isAuditOfficer={Boolean(admin.isAuditOfficer)} compact />
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        District: <strong className="text-[#E5E4E2]">{admin.assignedDistrict || admin.district || 'Unassigned'}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setInspectedUserProfile(admin)}
                      className="p-1.5 text-slate-300 hover:text-[#E5E4E2] hover:bg-[#1A233A] rounded-lg kc-pressable cursor-pointer"
                      title="View Admin Profile"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenChat(admin)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-[#0D2A1F] text-[#059669] hover:bg-[#1E293B] rounded-lg border border-[#059669]/40 kc-pressable cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>{translate(language, 'mobileNavChat')}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="kc-obsidian-card rounded-2xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E4E2]/20">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#E5E4E2]" />
                <span>{language === 'ur' ? 'صوبائی کمیونٹی اعلانات پینل' : 'Provincial Community Dispatcher'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'ur'
                  ? `${assignedState} کے تمام یا مخصوص اضلاع میں پیغامات شائع کریں`
                  : `Broadcast updates to all members or specific districts in ${assignedState}`}
              </p>
            </div>

            {!isCreatingAnnouncement && (
              <button
                type="button"
                onClick={() => setIsCreatingAnnouncement(true)}
                className="px-3.5 py-1.5 kc-gold-button text-xs font-extrabold rounded-xl cursor-pointer"
              >
                {language === 'ur' ? 'صوبائی اعلان شائع کریں' : 'Post State Notice'}
              </button>
            )}
          </div>

          {isCreatingAnnouncement ? (
            <form onSubmit={handleCreateAnnouncement} className="mt-4 space-y-3 bg-[#071812] p-4 rounded-xl border border-[#E5E4E2]/25">
              <LuxurySelect
                compact
                searchable
                value={selectedDistrictFilter}
                onChange={setSelectedDistrictFilter}
                label={language === 'ur' ? `مطلوبہ ضلع (${assignedState})` : `Target District (${assignedState})`}
                options={[
                  { value: 'ALL', label: language === 'ur' ? `${assignedState} کے تمام اضلاع` : `All Districts in ${assignedState}` },
                  ...districtList.map(dist => ({ value: dist, label: language === 'ur' ? `ضلع ${dist}` : `${dist} District` }))
                ]}
              />

              <input
                type="text"
                required
                placeholder={language === 'ur' ? 'مثلاً: صوبائی رابطہ اجلاس کا شیڈول...' : 'e.g. Provincial Coordination Meeting Schedule...'}
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl kc-luxury-input"
              />

              <textarea
                required
                rows={3}
                placeholder={language === 'ur' ? 'صوبائی اور ضلعی ممبران کے لیے تفصیلات...' : 'Notice details for provincial and district members...'}
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl kc-luxury-input resize-none"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" onClick={() => setIsCreatingAnnouncement(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer">
                  {translate(language, 'cancel')}
                </button>
                <button type="submit" className="flex items-center gap-1.5 px-4 py-1.5 kc-gold-button text-xs font-extrabold rounded-xl cursor-pointer">
                  <Send className="w-3.5 h-3.5" />
                  <span>{language === 'ur' ? 'اعلان نشر کریں' : 'Broadcast Notice'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-4 p-4 rounded-xl bg-[#071812] border border-[#E5E4E2]/25 text-xs text-slate-300 space-y-2">
              <p>
                {language === 'ur'
                  ? <>صوبائی کو ایڈمن کے طور پر آپ <strong className="text-white">{assignedState}</strong> میں تمام سرگرمیوں کی نگرانی کرتے ہیں۔</>
                  : <>As State Co-Admin, you coordinate provincial operations across <strong className="text-white">{assignedState}</strong>.</>}
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li className="tabular-nums">
                  {language === 'ur' ? `${districtList.length} اضلاع میں ممبران کی شمولیت کی نگرانی کریں۔` : `Monitor member growth across ${districtList.length} districts.`}
                </li>
                <li>{language === 'ur' ? 'شکایات کے حل کے لیے ضلعی ایڈمنز سے رابطہ رکھیں۔' : 'Coordinate with appointed District Admins to resolve grievances.'}</li>
                <li>{language === 'ur' ? 'صوبائی کمیونٹی اعلانات براہ راست ممبران تک پہنچائیں۔' : 'Publish provincial community notices directly to member inboxes.'}</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
