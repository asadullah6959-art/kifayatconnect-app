import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  CheckSquare,
  MessageSquareWarning,
  Megaphone,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Eye,
  Send,
  FileCheck,
  Receipt,
  IdCard
} from 'lucide-react';
import { RoleBadge } from '../common/RoleBadge';
import { translate } from '../../data/translations';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    users,
    applications,
    complaints,
    announcements,
    appSettings,
    recommendApplication,
    publishAnnouncement,
    updateComplaintStatus,
    setInspectedUserProfile,
    setActiveTab,
    setActiveChatUser,
    setSelectedCardUser,
    language
  } = useApp();

  const assignedDistrict = currentUser?.assignedDistrict || currentUser?.district || 'Lahore';
  const assignedState = currentUser?.assignedStateProvince || currentUser?.stateProvince || 'Punjab';

  const [reviewingAppId, setReviewingAppId] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [remarks, setRemarks] = useState<string>('');

  const [activeComplaintId, setActiveComplaintId] = useState<string | null>(null);
  const [complaintNote, setComplaintNote] = useState<string>('');

  const [isCreatingAnnouncement, setIsCreatingAnnouncement] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementUrgency, setAnnouncementUrgency] = useState<'NORMAL' | 'URGENT'>('NORMAL');

  if (!currentUser) return null;

  const vis = appSettings.dashboardVisibility || {
    showKpiGrid: true,
    showQuickActions: true,
    showApkSyncBanner: true,
    showDistrictMatrix: true,
    showOfficeBearersWidget: true,
    showAnnouncementsFeed: true
  };

  const districtMembers = users.filter(u => {
    if (u.role !== 'MEMBER') return false;
    return u.district === assignedDistrict || u.assignedDistrict === assignedDistrict;
  });

  const districtApplications = applications.filter(
    a => a.district === assignedDistrict || a.region?.includes(assignedDistrict)
  );

  const pendingDistrictApps = districtApplications.filter(
    a => (a.status as string) === 'PENDING_DISTRICT_REVIEW' || (a.status as string) === 'PENDING_REGIONAL_REVIEW'
  );

  const districtComplaints = complaints.filter(
    c => c.district === assignedDistrict || c.region?.includes(assignedDistrict)
  );

  const districtAnnouncements = announcements.filter(a => {
    if (a.targetScope === 'ALL') return true;
    if (a.targetScope === 'PROVINCE' && a.targetStateProvince === assignedState) return true;
    return a.targetDistrict === assignedDistrict;
  });

  const handleSubmitRecommendation = (appId: string) => {
    if (!remarks.trim()) return;
    recommendApplication(appId, recommendation, remarks);
    setReviewingAppId(null);
    setRemarks('');
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim()) return;
    publishAnnouncement({
      title: announcementTitle,
      content: announcementContent,
      announcementType: 'COMMUNITY',
      targetScope: 'DISTRICT',
      targetDistrict: assignedDistrict,
      targetStateProvince: assignedState,
      urgency: announcementUrgency,
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
            <span className="text-[11px] font-bold text-[#F5D061] uppercase tracking-wider">
              {language === 'ur' ? 'ڈسٹرکٹ ایڈمن پینل' : 'District Administration'}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-400 font-medium">{assignedDistrict} ({assignedState})</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1 flex items-center gap-2.5">
            <MapPin className="w-6 h-6 text-[#F5D061] shrink-0" />
            <span>{assignedDistrict} – {translate(language, 'roleAdmin')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Admin: <strong className="text-white">{currentUser.name}</strong> · Member verification, payment verification, & local community care.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-[#043927]/50 rounded-xl border border-[#D4AF37]/35 text-[11px] text-[#F5D061]">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Max {appSettings.maxAdminsPerDistrict} District Admins per District enforced.</span>
        </div>
      </div>

      {/* Apollo-Style Quick Actions */}
      {vis.showQuickActions && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: translate(language, 'actionVerifyPayments'), icon: Receipt, onClick: () => setActiveTab('funds') },
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
              <span className="text-xs font-semibold uppercase tracking-wider">District Members</span>
              <Users className="w-4 h-4 text-[#F5D061]" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-mono tabular-nums">{districtMembers.length}</span>
              <span className="text-xs text-[#F5D061] font-semibold">{assignedDistrict}</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">Active verified community members</div>
          </div>

          <div className="p-4 bg-[#111622] rounded-2xl border border-[#F5D061]/40">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Verification</span>
              <CheckSquare className="w-4 h-4 text-[#F5D061]" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-mono tabular-nums">{pendingDistrictApps.length}</span>
              <span className="text-xs text-[#F5D061] font-semibold">Stage 1 Queue</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">Requires address & CNIC check</div>
          </div>

          <div className="p-4 bg-[#111622] rounded-2xl border border-[#D4AF37]/25">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">District Grievances</span>
              <MessageSquareWarning className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-mono tabular-nums">{districtComplaints.length}</span>
              <span className="text-xs text-rose-400 font-semibold">
                {districtComplaints.filter(c => c.status === 'OPEN').length} Open
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">Member support tickets</div>
          </div>

          <div className="p-4 bg-[#111622] rounded-2xl border border-[#D4AF37]/25">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Local Bulletins</span>
              <Megaphone className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-mono tabular-nums">{districtAnnouncements.length}</span>
              <span className="text-xs text-emerald-400 font-semibold">Published</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">Dispatched to {assignedDistrict}</div>
          </div>
        </div>
      )}

      {/* Stage 1 District Verification */}
      <div className="bg-[#111622] rounded-2xl border border-[#D4AF37]/25 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#F5D061]" />
              <span>Stage 1: District Verification & Recommendation to Super Admin</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Confirm applicant address, inspect CNIC validity, and submit recommendation
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#F5D061] bg-amber-500/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
            {pendingDistrictApps.length} in Queue
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {pendingDistrictApps.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No pending applications awaiting District verification for {assignedDistrict}.
            </div>
          ) : (
            pendingDistrictApps.map(app => (
              <div key={app.id} className="p-4 rounded-xl border border-slate-800 bg-[#0A0D12]">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">{app.applicantName}</h4>
                      {app.isOldMemberVerification && (
                        <span className="text-[10px] bg-purple-500/15 text-purple-300 font-semibold px-2 py-0.5 rounded border border-purple-500/30">
                          Old Member: {app.oldMembershipNo}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5 text-xs text-slate-300 pt-1">
                      <p><span className="text-slate-500">CNIC:</span> <span className="font-mono">{app.cnic}</span></p>
                      <p><span className="text-slate-500">Phone:</span> {app.phone}</p>
                      <p><span className="text-slate-500">Email:</span> {app.email}</p>
                      <p><span className="text-slate-500">Address:</span> {app.address}</p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {reviewingAppId === app.id ? (
                      <div className="w-full sm:w-80 bg-[#111622] p-3.5 rounded-xl border border-[#D4AF37]/40 shadow-lg space-y-2.5">
                        <span className="text-[11px] font-semibold text-slate-200 block">
                          Submit Recommendation to Super Admin:
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setRecommendation('APPROVE')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1 cursor-pointer ${
                              recommendation === 'APPROVE'
                                ? 'bg-emerald-700 text-white border-emerald-500'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Recommend</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRecommendation('REJECT')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1 cursor-pointer ${
                              recommendation === 'REJECT'
                                ? 'bg-rose-700 text-white border-rose-500'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>

                        <textarea
                          placeholder="District verification remarks..."
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          rows={2}
                          className="w-full text-xs p-2 rounded-lg border border-slate-700 bg-[#0A0D12] text-white resize-none"
                        />

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button type="button" onClick={() => setReviewingAppId(null)} className="px-2.5 py-1 text-xs text-slate-400 hover:text-white cursor-pointer">
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSubmitRecommendation(app.id)}
                            className="px-3 py-1.5 kc-gold-button text-xs font-extrabold rounded-lg cursor-pointer"
                          >
                            Send to Super Admin
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setReviewingAppId(app.id);
                          setRecommendation('APPROVE');
                          setRemarks('District documents & residence verified. Recommended for membership.');
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 kc-gold-button text-xs font-extrabold rounded-xl cursor-pointer"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Verify & Recommend</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Grid: District Member Directory & Grievances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111622] rounded-2xl border border-[#D4AF37]/25 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">{assignedDistrict} Community Members</h3>
              <p className="text-xs text-slate-400">Registered members in your district</p>
            </div>
            <span className="text-xs font-mono font-semibold text-[#F5D061]">{districtMembers.length} Members</span>
          </div>

          <div className="mt-3 divide-y divide-slate-800/70 max-h-80 overflow-y-auto">
            {districtMembers.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">No active members in {assignedDistrict} yet.</div>
            ) : (
              districtMembers.map(member => (
                <div key={member.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    {(member.avatarUrl || member.avatar) ? (
                      <img src={member.avatarUrl || member.avatar} alt={member.name} className="w-8 h-8 rounded-full border border-[#D4AF37]/40 object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#043927] text-[#F5D061] border border-[#D4AF37]/40 flex items-center justify-center font-bold text-xs shrink-0">
                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-white truncate">{member.name}</p>
                        <RoleBadge role={member.role} isFounder={member.isFounder} isAuditOfficer={Boolean(member.isAuditOfficer)} compact />
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        {member.membershipId} · {member.cityTown || member.district}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setInspectedUserProfile(member)}
                      className="p-1.5 text-slate-400 hover:text-[#F5D061] hover:bg-slate-800 rounded-lg cursor-pointer"
                      title="View Member Profile"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenChat(member)}
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
              <h3 className="text-sm font-bold text-white">District Grievance Tickets</h3>
              <p className="text-xs text-slate-400">Support requests from {assignedDistrict}</p>
            </div>
            <span className="text-xs font-mono text-rose-400 font-bold">{districtComplaints.length} Tickets</span>
          </div>

          <div className="mt-3 space-y-3 max-h-80 overflow-y-auto">
            {districtComplaints.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">No active complaints filed in {assignedDistrict}.</div>
            ) : (
              districtComplaints.map(cmp => (
                <div key={cmp.id} className="p-3 rounded-xl border border-slate-800 bg-[#0A0D12] text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-white">{cmp.subject}</span>
                      <p className="text-[11px] text-slate-400">From {cmp.userName} · {cmp.category}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      cmp.status === 'RESOLVED'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}>
                      {cmp.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1.5">{cmp.description}</p>
                  {cmp.status !== 'RESOLVED' && (
                    <div className="mt-2 pt-2 border-t border-slate-800">
                      {activeComplaintId === cmp.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Resolution notes..."
                            value={complaintNote}
                            onChange={(e) => setComplaintNote(e.target.value)}
                            className="w-full text-xs p-1.5 border border-slate-700 rounded-lg bg-[#111622] text-white"
                          />
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setActiveComplaintId(null)} className="text-[11px] text-slate-400 hover:text-white cursor-pointer">
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                updateComplaintStatus(cmp.id, 'RESOLVED', complaintNote);
                                setActiveComplaintId(null);
                                setComplaintNote('');
                              }}
                              className="px-2.5 py-1 text-[11px] bg-emerald-600 text-white rounded-md font-semibold cursor-pointer"
                            >
                              Mark Resolved
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setActiveComplaintId(cmp.id)} className="text-[11px] text-[#F5D061] hover:underline font-medium cursor-pointer">
                          Respond & Mark Resolved →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* District Bulletins Dispatcher */}
      <div className="p-5 bg-[#111622] rounded-2xl border border-[#D4AF37]/25">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#F5D061]" />
              <span>District Community Announcement Dispatcher</span>
            </h3>
            <p className="text-xs text-slate-400">
              Publish local notices, camps, or community alerts targeted to {assignedDistrict} members
            </p>
          </div>
          {!isCreatingAnnouncement && (
            <button
              type="button"
              onClick={() => setIsCreatingAnnouncement(true)}
              className="px-3.5 py-1.5 kc-gold-button text-xs font-extrabold rounded-xl cursor-pointer"
            >
              Post District Notice
            </button>
          )}
        </div>

        {isCreatingAnnouncement && (
          <form onSubmit={handleCreateAnnouncement} className="mt-4 space-y-3 bg-[#0A0D12] p-4 rounded-xl border border-slate-800">
            <input
              type="text"
              required
              placeholder="e.g. Free Medical Checkup Camp at Model Town..."
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-700 bg-[#111622] text-white"
            />
            <textarea
              required
              rows={3}
              placeholder="Detailed instructions for district members..."
              value={announcementContent}
              onChange={(e) => setAnnouncementContent(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-700 bg-[#111622] text-white resize-none"
            />
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 text-slate-300">
                  <input type="radio" name="urgency" checked={announcementUrgency === 'NORMAL'} onChange={() => setAnnouncementUrgency('NORMAL')} />
                  <span>Normal</span>
                </label>
                <label className="flex items-center gap-1.5 text-rose-400 font-semibold">
                  <input type="radio" name="urgency" checked={announcementUrgency === 'URGENT'} onChange={() => setAnnouncementUrgency('URGENT')} />
                  <span>Urgent</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setIsCreatingAnnouncement(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="flex items-center gap-1.5 px-4 py-1.5 kc-gold-button text-xs font-extrabold rounded-xl cursor-pointer">
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast to {assignedDistrict}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
