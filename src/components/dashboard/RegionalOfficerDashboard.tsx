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
  Clock,
  Send,
  Eye
} from 'lucide-react';

import { mapLegacyRegionToHierarchy } from '../../data/locationData';

export const RegionalOfficerDashboard: React.FC = () => {
  const { 
    currentUser, 
    users, 
    applications, 
    complaints, 
    announcements, 
    recommendApplication, 
    publishAnnouncement,
    updateComplaintStatus,
    setSelectedCardUser,
    setActiveTab,
    language 
  } = useApp();

  // Strict District & Regional Scoping:
  const locFallback = mapLegacyRegionToHierarchy(currentUser.region);
  const assignedDistrict = currentUser.district || locFallback.district;
  const assignedProvince = currentUser.stateProvince || locFallback.stateProvince;
  const assignedRegion = currentUser.region;

  const regionalMembers = users.filter(u => {
    if (u.role !== 'MEMBER') return false;
    const uDist = u.district || mapLegacyRegionToHierarchy(u.region).district;
    return uDist === assignedDistrict || u.region === assignedRegion;
  });

  const regionalApplications = applications.filter(a => {
    const aDist = a.district || mapLegacyRegionToHierarchy(a.region).district;
    return aDist === assignedDistrict || a.region === assignedRegion;
  });

  const pendingRegionalApps = regionalApplications.filter(a => a.status === 'PENDING_REGIONAL_REVIEW');

  const regionalComplaints = complaints.filter(c => {
    const cDist = c.district || mapLegacyRegionToHierarchy(c.region).district;
    return cDist === assignedDistrict || c.region === assignedRegion;
  });

  const regionalAnnouncements = announcements.filter(a => {
    if (a.targetScope === 'ALL' || a.targetRegion === 'ALL_REGIONS') return true;
    if (a.targetScope === 'PROVINCE' && a.targetStateProvince === assignedProvince) return true;
    if (a.targetDistrict === assignedDistrict) return true;
    return a.targetRegion === assignedRegion;
  });

  // Review interaction state
  const [reviewingAppId, setReviewingAppId] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [remarks, setRemarks] = useState<string>('');

  // Complaint response state
  const [activeComplaintId, setActiveComplaintId] = useState<string | null>(null);
  const [complaintNote, setComplaintNote] = useState<string>('');

  // New regional bulletin state
  const [isCreatingAnnouncement, setIsCreatingAnnouncement] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementUrgency, setAnnouncementUrgency] = useState<'NORMAL' | 'URGENT'>('NORMAL');

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
      targetRegion: assignedRegion,
      urgency: announcementUrgency,
      isPinned: false
    });
    setAnnouncementTitle('');
    setAnnouncementContent('');
    setIsCreatingAnnouncement(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Regional Authority */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              {language === 'ur' ? 'علاقائی دفتر' : 'District Administration'}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-500">{assignedDistrict} ({assignedProvince})</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{assignedDistrict} – District Officer Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Presiding Officer: {currentUser.name} · Direct oversight of member verifications and welfare execution for {assignedDistrict}, {assignedProvince}.
          </p>
        </div>

        {/* Data Separation Notice */}
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>District Jurisdiction: Scoped exclusively to {assignedDistrict} ({assignedProvince}).</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Regional Members */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">District Members</span>
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {regionalMembers.length}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{assignedDistrict}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Active verified community contributors in {assignedDistrict}
          </div>
        </div>

        {/* Pending Regional Verification */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-amber-300 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/10">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Verification</span>
            <CheckSquare className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {pendingRegionalApps.length}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Awaiting Review</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Requires field address & CNIC check
          </div>
        </div>

        {/* Regional Grievances */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Assigned Complaints</span>
            <MessageSquareWarning className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {regionalComplaints.length}
            </span>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {regionalComplaints.filter(c => c.status === 'OPEN').length} Open
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Member support and ration inquiries
          </div>
        </div>

        {/* Regional Bulletins */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Regional Bulletins</span>
            <Megaphone className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {regionalAnnouncements.length}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Published</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Direct notices to {assignedRegion}
          </div>
        </div>
      </div>

      {/* CORE WORKFLOW: Regional Officer Verification & Recommendation */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              Workflow Stage 1: Regional Onboarding Verification & Recommendation
            </h3>
            <p className="text-xs text-slate-500">
              Regional Officers inspect applicant credentials, physically confirm residential address, and submit recommendation to Super Admin
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
            {pendingRegionalApps.length} In Queue
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {pendingRegionalApps.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No new applications pending regional review for {assignedRegion}.
            </div>
          ) : (
            pendingRegionalApps.map(app => (
              <div 
                key={app.id}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {app.applicantName}
                      </h4>
                      {app.isOldMemberVerification && (
                        <span className="text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                          Old Member Verification: {app.oldMembershipNo}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5 text-xs text-slate-600 dark:text-slate-300 pt-1">
                      <p><span className="text-slate-400">CNIC:</span> <span className="font-mono">{app.cnic}</span></p>
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
                      <div className="w-full sm:w-80 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                        <span className="text-[11px] font-semibold text-slate-900 dark:text-slate-100 block">
                          Submit Recommendation to Super Admin:
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setRecommendation('APPROVE')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded border transition-colors flex items-center justify-center gap-1 ${
                              recommendation === 'APPROVE'
                                ? 'bg-emerald-600 text-white border-emerald-500'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Recommend Approval</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRecommendation('REJECT')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded border transition-colors flex items-center justify-center gap-1 ${
                              recommendation === 'REJECT'
                                ? 'bg-rose-600 text-white border-rose-500'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Recommend Reject</span>
                          </button>
                        </div>

                        <textarea
                          placeholder="State regional verification remarks (e.g. physical address checked, background verified)..."
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          rows={2}
                          className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 resize-none"
                        />

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => setReviewingAppId(null)}
                            className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSubmitRecommendation(app.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded shadow-xs"
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
                          setRemarks('Identity documents physically cross-verified. Candidate recommended for community membership.');
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
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

      {/* Grid: Regional Member Directory & Regional Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Member Directory */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {assignedRegion} Member Directory
              </h3>
              <p className="text-xs text-slate-500">
                Active registered residents in your regional jurisdiction
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {regionalMembers.length} Members
            </span>
          </div>

          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/60">
            {regionalMembers.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No active members in {assignedRegion} yet.
              </div>
            ) : (
              regionalMembers.map(member => (
                <div key={member.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{member.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {member.membershipId} · CNIC: {member.cnic}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCardUser(member)}
                      className="px-2 py-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors flex items-center gap-1 font-medium"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Card</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assigned Complaints Resolution */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Assigned Regional Grievances
              </h3>
              <p className="text-xs text-slate-500">
                Tickets submitted by members in {assignedRegion}
              </p>
            </div>
            <span className="text-xs font-mono text-rose-500 font-bold">
              {regionalComplaints.length} Tickets
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {regionalComplaints.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No active complaints filed in {assignedRegion}.
              </div>
            ) : (
              regionalComplaints.map(cmp => (
                <div key={cmp.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{cmp.subject}</span>
                      <p className="text-[11px] text-slate-500">From {cmp.userName} · Category: {cmp.category}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      cmp.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}>
                      {cmp.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1.5">
                    {cmp.description}
                  </p>

                  {cmp.responseNote && (
                    <div className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 p-1.5 rounded">
                      <span className="font-medium">Officer Action:</span> {cmp.responseNote}
                    </div>
                  )}

                  {cmp.status !== 'RESOLVED' && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      {activeComplaintId === cmp.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Resolution notes / action taken..."
                            value={complaintNote}
                            onChange={(e) => setComplaintNote(e.target.value)}
                            className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setActiveComplaintId(null)}
                              className="text-[11px] text-slate-400 hover:text-slate-600"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                updateComplaintStatus(cmp.id, 'RESOLVED', complaintNote);
                                setActiveComplaintId(null);
                                setComplaintNote('');
                              }}
                              className="px-2.5 py-1 text-[11px] bg-emerald-600 text-white rounded font-medium"
                            >
                              Mark Resolved
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveComplaintId(cmp.id)}
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
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

      {/* Regional Bulletins Publisher */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-emerald-600" />
              Regional Announcement Dispatcher
            </h3>
            <p className="text-xs text-slate-500">
              Publish local ration distribution dates, healthcare camps, or urgent alerts targeted to {assignedRegion} members
            </p>
          </div>

          {!isCreatingAnnouncement && (
            <button
              onClick={() => setIsCreatingAnnouncement(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-semibold rounded transition-colors"
            >
              Post Regional Bulletin
            </button>
          )}
        </div>

        {isCreatingAnnouncement && (
          <form onSubmit={handleCreateAnnouncement} className="mt-4 space-y-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Announcement Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Free Medical Checkup Camp at Model Town Community Hall..."
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Announcement Details
              </label>
              <textarea
                required
                rows={3}
                placeholder="Detailed instructions for local members, timing, venue, and required documents..."
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <input
                    type="radio"
                    name="urgency"
                    checked={announcementUrgency === 'NORMAL'}
                    onChange={() => setAnnouncementUrgency('NORMAL')}
                  />
                  <span>Normal Notice</span>
                </label>
                <label className="flex items-center gap-1.5 text-rose-600 font-medium">
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
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast to {assignedRegion}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
