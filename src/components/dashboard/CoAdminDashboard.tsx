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
  Compass
} from 'lucide-react';
import { PAKISTAN_LOCATION_DATA } from '../../data/locationData';

export const CoAdminDashboard: React.FC = () => {
  const { 
    currentUser, 
    users, 
    applications, 
    complaints, 
    announcements, 
    publishAnnouncement,
    setInspectedUserProfile,
    setActiveTab,
    setActiveChatUser,
    language 
  } = useApp();

  const assignedState = currentUser.assignedStateProvince || currentUser.stateProvince || 'Punjab';

  // Province-level data scoping
  const stateMembers = users.filter(u => {
    if (u.role !== 'MEMBER') return false;
    return u.stateProvince === assignedState || u.assignedStateProvince === assignedState;
  });

  const stateAdmins = users.filter(u => {
    return u.role === 'ADMIN' && (u.assignedStateProvince === assignedState || u.stateProvince === assignedState);
  });

  const stateCoAdmins = users.filter(u => {
    return u.role === 'CO_ADMIN' && (u.assignedStateProvince === assignedState || u.stateProvince === assignedState);
  });

  const stateApplications = applications.filter(a => {
    return a.stateProvince === assignedState || a.region?.includes(assignedState);
  });

  const stateComplaints = complaints.filter(c => {
    return c.stateProvince === assignedState || c.region?.includes(assignedState);
  });

  // Location hierarchy for this province
  const stateLocationInfo = PAKISTAN_LOCATION_DATA.find(s => s.stateProvince === assignedState);
  const districtList = stateLocationInfo ? stateLocationInfo.districts.map(d => d.district) : ['Lahore', 'Faisalabad', 'Rawalpindi', 'Multan'];

  // State Announcement State
  const [isCreatingAnnouncement, setIsCreatingAnnouncement] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>('ALL');

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim()) return;

    publishAnnouncement({
      title: announcementTitle,
      content: announcementContent,
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
      {/* Top Banner with State Co-Admin Authority */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              {language === 'ur' ? 'صوبائی کو-ایڈمنسٹریشن' : 'State / Provincial Co-Administration'}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-400 font-medium">{assignedState} Province</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-indigo-400 shrink-0" />
            <span>{assignedState} – Provincial Co-Admin Console</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Co-Admin: <strong className="text-slate-700 dark:text-slate-200">{currentUser.name}</strong> · Provincial coordination and district monitoring across all districts in {assignedState}.
          </p>
        </div>

        {/* Quota Badge */}
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/30 text-[11px] text-indigo-300">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>Provincial Quota: Max 3 State Co-Admins for {assignedState}.</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Province Members */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Provincial Members</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {stateMembers.length}
            </span>
            <span className="text-xs text-indigo-400 font-medium">{assignedState}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Across {districtList.length} districts in {assignedState}
          </div>
        </div>

        {/* Appointed District Admins */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">District Admins</span>
            <MapPin className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {stateAdmins.length}
            </span>
            <span className="text-xs text-amber-500 font-medium">10/dist limit</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Field administrators under Super Admin
          </div>
        </div>

        {/* State Applications in Review */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">New Registrations</span>
            <CheckSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {stateApplications.length}
            </span>
            <span className="text-xs text-emerald-400 font-medium">Applications</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Total onboarding pipeline in {assignedState}
          </div>
        </div>

        {/* State Grievances */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Open Complaints</span>
            <MessageSquareWarning className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {stateComplaints.filter(c => c.status === 'OPEN').length}
            </span>
            <span className="text-xs text-rose-400 font-medium">Active</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Require local district escalation
          </div>
        </div>
      </div>

      {/* Grid: District Admins Overview & Provincial Bulletins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* District Admins in Province */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500" />
                District Admins in {assignedState}
              </h3>
              <p className="text-xs text-slate-500">
                Super Admin-appointed field officers across districts
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
              {stateAdmins.length} Admins
            </span>
          </div>

          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80 overflow-y-auto">
            {stateAdmins.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No District Admins currently assigned in {assignedState}.
              </div>
            ) : (
              stateAdmins.map(admin => (
                <div key={admin.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={admin.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name)}&background=0a192f&color=d4af37&size=64`}
                      alt={admin.name}
                      className="w-8 h-8 rounded-full border border-amber-500/30 object-cover"
                    />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{admin.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        District: <strong className="text-amber-400">{admin.assignedDistrict || admin.district || 'Unassigned'}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInspectedUserProfile(admin)}
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="View Admin Profile"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenChat(admin)}
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Coordinate in Chat"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* State Announcement Dispatcher */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-400" />
                Provincial Announcement Dispatcher
              </h3>
              <p className="text-xs text-slate-500">
                Broadcast official updates to all members or specific districts in {assignedState}
              </p>
            </div>

            {!isCreatingAnnouncement && (
              <button
                onClick={() => setIsCreatingAnnouncement(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Post State Notice
              </button>
            )}
          </div>

          {isCreatingAnnouncement ? (
            <form onSubmit={handleCreateAnnouncement} className="mt-4 space-y-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Target District in {assignedState}
                </label>
                <select
                  value={selectedDistrictFilter}
                  onChange={(e) => setSelectedDistrictFilter(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white"
                >
                  <option value="ALL">All Districts in {assignedState}</option>
                  {districtList.map(dist => (
                    <option key={dist} value={dist}>{dist} District</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Notice Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Provincial Coordination Meeting Schedule..."
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Message Content
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Notice details for provincial and district members..."
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreatingAnnouncement(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast Notice</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-2">
              <p>
                As State Co-Admin, you represent the provincial leadership of <strong>{assignedState}</strong>.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-300">
                <li>Monitor member registration progress across all {districtList.length} districts.</li>
                <li>Coordinate with appointed District Admins to resolve grievances.</li>
                <li>Submit provincial recommendations to the Super Admin.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
