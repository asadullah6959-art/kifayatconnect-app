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
  Building2,
  FileCheck
} from 'lucide-react';
import { RoleBadge } from '../common/RoleBadge';

export const AdminDashboard: React.FC = () => {
  const { 
    currentUser, 
    users, 
    applications, 
    complaints, 
    announcements, 
    recommendApplication, 
    publishAnnouncement,
    updateComplaintStatus,
    setInspectedUserProfile,
    setActiveTab,
    setActiveChatUser,
    language 
  } = useApp();

  const assignedDistrict = currentUser?.assignedDistrict || currentUser?.district || 'Lahore';
  const assignedState = currentUser?.assignedStateProvince || currentUser?.stateProvince || 'Punjab';

  // Review interaction state
  const [reviewingAppId, setReviewingAppId] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [remarks, setRemarks] = useState<string>('');

  // Complaint response state
  const [activeComplaintId, setActiveComplaintId] = useState<string | null>(null);
  const [complaintNote, setComplaintNote] = useState<string>('');

  // New announcement state
  const [isCreatingAnnouncement, setIsCreatingAnnouncement] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementUrgency, setAnnouncementUrgency] = useState<'NORMAL' | 'URGENT'>('NORMAL');

  if (!currentUser) return null;

  // Strictly filter to assigned district
  const districtMembers = users.filter(u => {
    if (u.role !== 'MEMBER') return false;
    return (u.district === assignedDistrict) || (u.assignedDistrict === assignedDistrict);
  });

  const districtApplications = applications.filter(a => {
    return a.district === assignedDistrict || a.region?.includes(assignedDistrict);
  });

  const pendingDistrictApps = districtApplications.filter(
    a => (a.status as any) === 'PENDING_DISTRICT_REVIEW' || (a.status as any) === 'PENDING_REGIONAL_REVIEW'
  );

  const districtComplaints = complaints.filter(c => {
    return c.district === assignedDistrict || c.region?.includes(assignedDistrict);
  });

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
      {/* Top Banner with District Admin Authority */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
              {language === 'ur' ? 'ڈسٹرکٹ ایڈمنسٹریشن' : 'District Administration'}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-400 font-medium">{assignedDistrict} District ({assignedState})</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2.5">
            <MapPin className="w-6 h-6 text-amber-500 shrink-0" />
            <span>{assignedDistrict} – District Admin Console</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Admin: <strong className="text-slate-700 dark:text-slate-200">{currentUser.name}</strong> · Responsible for member verification, community grievance handling, and local welfare delivery in {assignedDistrict}.
          </p>
        </div>

        {/* Security / Quota Badge */}
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 rounded-xl border border-amber-500/30 text-[11px] text-amber-400">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>District Scope: 10 Authorized Admins quota per District enforced.</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* District Members */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">District Members</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {districtMembers.length}
            </span>
            <span className="text-xs text-amber-500 font-medium">{assignedDistrict}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Active verified community members
          </div>
        </div>

        {/* Pending Stage 1 Verifications */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-amber-500/40 bg-amber-500/5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Verification</span>
            <CheckSquare className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {pendingDistrictApps.length}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Stage 1 Queue</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Requires field address and CNIC review
          </div>
        </div>

        {/* District Grievances */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">District Grievances</span>
            <MessageSquareWarning className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {districtComplaints.length}
            </span>
            <span className="text-xs text-rose-500 font-medium">
              {districtComplaints.filter(c => c.status === 'OPEN').length} Open
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Member inquiries & welfare tickets
          </div>
        </div>

        {/* District Bulletins */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Local Bulletins</span>
            <Megaphone className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {districtAnnouncements.length}
            </span>
            <span className="text-xs text-blue-500 font-medium">Published</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Dispatched to {assignedDistrict} members
          </div>
        </div>
      </div>

      {/* CORE WORKFLOW: Stage 1 District Verification & Recommendation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-500" />
              Stage 1: District Verification & Recommendation to Super Admin
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              District Admins physically confirm applicant address, check CNIC validity, and send formal recommendation
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
            {pendingDistrictApps.length} in Queue
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {pendingDistrictApps.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No pending applications awaiting District verification for {assignedDistrict}.
            </div>
          ) : (
            pendingDistrictApps.map(app => (
              <div 
                key={app.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {app.applicantName}
                      </h4>
                      {app.isOldMemberVerification && (
                        <span className="text-[10px] bg-purple-500/10 text-purple-400 font-semibold px-2 py-0.5 rounded border border-purple-500/30">
                          Old Member: {app.oldMembershipNo}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5 text-xs text-slate-600 dark:text-slate-300 pt-1">
                      <p><span className="text-slate-400">CNIC:</span> <span className="font-mono text-slate-800 dark:text-slate-200">{app.cnic}</span></p>
                      <p><span className="text-slate-400">Phone:</span> {app.phone}</p>
                      <p><span className="text-slate-400">Email:</span> {app.email}</p>
                      <p><span className="text-slate-400">Address:</span> {app.address}</p>
                    </div>

                    <p className="text-[11px] text-slate-400 pt-1">
                      Submitted: {new Date(app.submittedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Review Action Trigger */}
                  <div className="shrink-0">
                    {reviewingAppId === app.id ? (
                      <div className="w-full sm:w-80 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-amber-500/30 shadow-lg space-y-2.5">
                        <span className="text-[11px] font-semibold text-slate-200 block">
                          Submit Recommendation to Super Admin:
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setRecommendation('APPROVE')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                              recommendation === 'APPROVE'
                                ? 'bg-emerald-600 text-white border-emerald-500'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Recommend</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRecommendation('REJECT')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                              recommendation === 'REJECT'
                                ? 'bg-rose-600 text-white border-rose-500'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>

                        <textarea
                          placeholder="District verification remarks (e.g. physical address checked, documents verified)..."
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          rows={2}
                          className="w-full text-xs p-2 rounded-lg border border-slate-700 bg-slate-800 text-white resize-none"
                        />

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => setReviewingAppId(null)}
                            className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSubmitRecommendation(app.id)}
                            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                          >
                            Send to Super Admin
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setReviewingAppId(app.id);
                          setRecommendation('APPROVE');
                          setRemarks('District documents & residence verified. Recommended for membership.');
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-md shadow-amber-500/15 transition-all cursor-pointer"
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
        {/* District Member Directory */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {assignedDistrict} Community Members
              </h3>
              <p className="text-xs text-slate-500">
                Registered members in your district
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-amber-500">
              {districtMembers.length} Members
            </span>
          </div>

          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80 overflow-y-auto">
            {districtMembers.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No active members in {assignedDistrict} yet.
              </div>
            ) : (
              districtMembers.map(member => (
                <div key={member.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    {(member.avatarUrl || member.avatar) ? (
                      <img
                        src={member.avatarUrl || member.avatar}
                        alt={member.name}
                        className="w-8 h-8 rounded-full border border-amber-500/30 object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#0a192f] text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{member.name}</p>
                        <RoleBadge role={member.role} compact />
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono truncate">
                        {member.membershipId} · {member.cityTown || member.district}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setInspectedUserProfile(member)}
                      className="p-1.5 text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="View Member Profile"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenChat(member)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-[#0a192f] text-amber-400 hover:bg-slate-800 rounded-lg border border-amber-500/30 transition-colors cursor-pointer"
                      title="Message in Chat"
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

        {/* District Complaints */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                District Grievance Tickets
              </h3>
              <p className="text-xs text-slate-500">
                Support requests from {assignedDistrict}
              </p>
            </div>
            <span className="text-xs font-mono text-rose-500 font-bold">
              {districtComplaints.length} Tickets
            </span>
          </div>

          <div className="mt-3 space-y-3 max-h-80 overflow-y-auto">
            {districtComplaints.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No active complaints filed in {assignedDistrict}.
              </div>
            ) : (
              districtComplaints.map(cmp => (
                <div key={cmp.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{cmp.subject}</span>
                      <p className="text-[11px] text-slate-500">From {cmp.userName} · Category: {cmp.category}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      cmp.status === 'RESOLVED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {cmp.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1.5">
                    {cmp.description}
                  </p>

                  {cmp.status !== 'RESOLVED' && (
                    <div className="mt-2 pt-2 border-t border-slate-800">
                      {activeComplaintId === cmp.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Resolution notes / action taken..."
                            value={complaintNote}
                            onChange={(e) => setComplaintNote(e.target.value)}
                            className="w-full text-xs p-1.5 border border-slate-700 rounded-lg bg-slate-800 text-white"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setActiveComplaintId(null)}
                              className="text-[11px] text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                updateComplaintStatus(cmp.id, 'RESOLVED', complaintNote);
                                setActiveComplaintId(null);
                                setComplaintNote('');
                              }}
                              className="px-2.5 py-1 text-[11px] bg-emerald-600 text-white rounded-md font-medium"
                            >
                              Mark Resolved
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveComplaintId(cmp.id)}
                          className="text-[11px] text-amber-400 hover:underline font-medium cursor-pointer"
                        >
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

      {/* District Bulletins Publisher */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-500" />
              District Announcement Dispatcher
            </h3>
            <p className="text-xs text-slate-500">
              Publish local notices, camps, or community alerts targeted to {assignedDistrict} members
            </p>
          </div>

          {!isCreatingAnnouncement && (
            <button
              onClick={() => setIsCreatingAnnouncement(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Post District Bulletin
            </button>
          )}
        </div>

        {isCreatingAnnouncement && (
          <form onSubmit={handleCreateAnnouncement} className="mt-4 space-y-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Announcement Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Free Medical Checkup Camp at Model Town..."
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Announcement Details
              </label>
              <textarea
                required
                rows={3}
                placeholder="Detailed instructions for district members..."
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 text-slate-400">
                  <input
                    type="radio"
                    name="urgency"
                    checked={announcementUrgency === 'NORMAL'}
                    onChange={() => setAnnouncementUrgency('NORMAL')}
                  />
                  <span>Normal Notice</span>
                </label>
                <label className="flex items-center gap-1.5 text-rose-400 font-medium">
                  <input
                    type="radio"
                    name="urgency"
                    checked={announcementUrgency === 'URGENT'}
                    onChange={() => setAnnouncementUrgency('URGENT')}
                  />
                  <span>Urgent Community Action</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingAnnouncement(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                >
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
