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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              {language === 'ur' ? 'صوبائی کو ایڈمن پینل' : 'State / Provincial Co-Administration'}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-400 font-medium">{assignedState} Province</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-[#F5D061] shrink-0" />
            <span>{assignedState} – {translate(language, 'roleCoAdmin')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Co-Admin: <strong className="text-white">{currentUser.name}</strong> · Provincial coordination across districts in {assignedState}.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-[#043927]/50 rounded-xl border border-[#D4AF37]/35 text-[11px] text-[#F5D061]">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Quota: Max {appSettings.maxCoAdminsPerState} State Co-Admins for {assignedState}.</span>
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
                className="p-3.5 rounded-2xl bg-gradient-to-br from-[#111622] to-[#161D2C] border border-[#D4AF37]/30 hover:border-[#F5D061]/60 text-left transition-transform hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-[#043927]/80 border border-[#D4AF37]/35 flex items-center justify-center mb-2">
                  <Icon className="w-4 h-4 text-[#F5D061]" />
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
          <div className="p-4 bg-[#111622] rounded-2xl border border-[#D4AF37]/25">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Provincial Members</span>
              <Users className="w-4 h-4 text-[#F5D061]" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-mono tabular-nums">{stateMembers.length}</span>
              <span className="text-xs text-emerald-400 font-semibold">{assignedState}</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">Across {districtList.length} districts</div>
          </div>

          <div className="p-4 bg-[#111622] rounded-2xl border border-[#D4AF37]/25">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">District Admins</span>
              <MapPin className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-mono tabular-nums">{stateAdmins.length}</span>
              <span className="text-xs text-[#F5D061] font-semibold">{appSettings.maxAdminsPerDistrict}/dist limit</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">Field administrators</div>
          </div>

          <div className="p-4 bg-[#111622] rounded-2xl border border-[#D4AF37]/25">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Applications</span>
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-mono tabular-nums">{stateApplications.length}</span>
              <span className="text-xs text-emerald-400 font-semibold">Pipeline</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">Onboarding in {assignedState}</div>
          </div>

          <div className="p-4 bg-[#111622] rounded-2xl border border-[#D4AF37]/25">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Open Complaints</span>
              <MessageSquareWarning className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                {stateComplaints.filter(c => c.status === 'OPEN').length}
              </span>
              <span className="text-xs text-rose-400 font-semibold">Active</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">Provincial grievances</div>
          </div>
        </div>
      )}

      {/* Grid: District Admins Overview & Provincial Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111622] rounded-2xl border border-[#D4AF37]/25 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#F5D061]" />
                <span>District Admins in {assignedState}</span>
              </h3>
              <p className="text-xs text-slate-400">Appointed field officers across districts</p>
            </div>
            <span className="text-xs font-mono font-bold text-[#F5D061] bg-amber-500/10 px-2 py-0.5 rounded-full">
              {stateAdmins.length} Admins
            </span>
          </div>

          <div className="mt-3 divide-y divide-slate-800/70 max-h-80 overflow-y-auto">
            {stateAdmins.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No District Admins currently assigned in {assignedState}.
              </div>
            ) : (
              stateAdmins.map(admin => (
                <div key={admin.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    {(admin.avatarUrl || admin.avatar) ? (
                      <img src={admin.avatarUrl || admin.avatar} alt={admin.name} className="w-8 h-8 rounded-full border border-[#D4AF37]/40 object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#043927] text-[#F5D061] border border-[#D4AF37]/40 flex items-center justify-center font-bold text-xs shrink-0">
                        {admin.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-white truncate">{admin.name}</p>
                        <RoleBadge role={admin.role} isFounder={admin.isFounder} compact />
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        District: <strong className="text-[#F5D061]">{admin.assignedDistrict || admin.district || 'Unassigned'}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setInspectedUserProfile(admin)}
                      className="p-1.5 text-slate-400 hover:text-[#F5D061] hover:bg-slate-800 rounded-lg cursor-pointer"
                      title="View Admin Profile"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenChat(admin)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-[#043927] text-[#F5D061] hover:bg-emerald-900 rounded-lg border border-[#D4AF37]/35 cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Chat</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#111622] rounded-2xl border border-[#D4AF37]/25 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#F5D061]" />
                <span>Provincial Community Dispatcher</span>
              </h3>
              <p className="text-xs text-slate-400">
                Broadcast updates to all members or specific districts in {assignedState}
              </p>
            </div>

            {!isCreatingAnnouncement && (
              <button
                type="button"
                onClick={() => setIsCreatingAnnouncement(true)}
                className="px-3.5 py-1.5 kc-gold-button text-xs font-extrabold rounded-xl cursor-pointer"
              >
                Post State Notice
              </button>
            )}
          </div>

          {isCreatingAnnouncement ? (
            <form onSubmit={handleCreateAnnouncement} className="mt-4 space-y-3 bg-[#0A0D12] p-4 rounded-xl border border-slate-800">
              <select
                value={selectedDistrictFilter}
                onChange={(e) => setSelectedDistrictFilter(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-700 bg-[#111622] text-white"
              >
                <option value="ALL">All Districts in {assignedState}</option>
                {districtList.map(dist => (
                  <option key={dist} value={dist}>{dist} District</option>
                ))}
              </select>

              <input
                type="text"
                required
                placeholder="e.g. Provincial Coordination Meeting Schedule..."
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-700 bg-[#111622] text-white"
              />

              <textarea
                required
                rows={3}
                placeholder="Notice details for provincial and district members..."
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-700 bg-[#111622] text-white resize-none"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" onClick={() => setIsCreatingAnnouncement(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="flex items-center gap-1.5 px-4 py-1.5 kc-gold-button text-xs font-extrabold rounded-xl cursor-pointer">
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast Notice</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-4 p-4 rounded-xl bg-[#0A0D12] border border-slate-800 text-xs text-slate-300 space-y-2">
              <p>
                As State Co-Admin, you coordinate provincial operations across <strong className="text-white">{assignedState}</strong>.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>Monitor member growth across {districtList.length} districts.</li>
                <li>Coordinate with appointed District Admins to resolve grievances.</li>
                <li>Publish provincial community notices directly to member inboxes.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
