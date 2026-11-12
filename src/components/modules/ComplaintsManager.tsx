import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  MessageSquareWarning, 
  Send, 
  CheckCircle2, 
  Clock, 
  Plus, 
  ShieldCheck, 
  AlertCircle,
  Filter
} from 'lucide-react';
import { Complaint, ComplaintCategory, ComplaintStatus } from '../../types';
import { 
  PROVINCE_OPTIONS, 
  getDistrictsForProvince, 
  formatShortLocation, 
  mapLegacyRegionToHierarchy 
} from '../../data/locationData';
import { MapPin } from 'lucide-react';

export const ComplaintsManager: React.FC = () => {
  const { 
    currentUser, 
    complaints, 
    submitComplaint, 
    updateComplaintStatus, 
    language 
  } = useApp();

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isDistrictAdmin = currentUser.role === 'ADMIN';
  const isCoAdmin = currentUser.role === 'CO_ADMIN';
  const isFinanceOfficer = currentUser.role === 'FINANCE_OFFICER';
  const isMember = currentUser.role === 'MEMBER';

  const [activeTab, setActiveTab] = useState<'ALL' | 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterProvince, setFilterProvince] = useState<string>(
    isCoAdmin || isDistrictAdmin ? (currentUser.assignedStateProvince || currentUser.stateProvince || 'Punjab') : 'ALL'
  );
  const [filterDistrict, setFilterDistrict] = useState<string>(
    isDistrictAdmin ? (currentUser.assignedDistrict || currentUser.district || 'Lahore') : 'ALL'
  );

  // Submit modal state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [cmpCategory, setCmpCategory] = useState<ComplaintCategory>('Membership Card');
  const [cmpSubject, setCmpSubject] = useState('');
  const [cmpDescription, setCmpDescription] = useState('');
  const [cmpPriority, setCmpPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  // Response dialog state
  const [respondingTicket, setRespondingTicket] = useState<Complaint | null>(null);
  const [responseStatus, setResponseStatus] = useState<ComplaintStatus>('RESOLVED');
  const [responseRemarks, setResponseRemarks] = useState('');

  // Scoped complaints according to role
  const visibleComplaints = complaints.filter(cmp => {
    if (isMember) return cmp.userId === currentUser.id;
    const fb = mapLegacyRegionToHierarchy(cmp.region);
    const cDist = cmp.district || fb.district;
    const cProv = cmp.stateProvince || fb.stateProvince;

    if (isDistrictAdmin) {
      const myDist = currentUser.assignedDistrict || currentUser.district;
      return cDist === myDist || cmp.region === currentUser.region;
    }
    if (isCoAdmin) {
      const myProv = currentUser.assignedStateProvince || currentUser.stateProvince;
      return cProv === myProv;
    }
    if (isFinanceOfficer) return false;
    return true; // Super Admin sees all
  });

  const filteredComplaints = visibleComplaints.filter(cmp => {
    const fb = mapLegacyRegionToHierarchy(cmp.region);
    const cDist = cmp.district || fb.district;
    const cProv = cmp.stateProvince || fb.stateProvince;

    const matchesTab = activeTab === 'ALL' || cmp.status === activeTab;
    const matchesCategory = filterCategory === 'ALL' || cmp.category === filterCategory;
    const matchesProvince = filterProvince === 'ALL' || cProv === filterProvince;
    const matchesDistrict = filterDistrict === 'ALL' || cDist === filterDistrict;

    return matchesTab && matchesCategory && matchesProvince && matchesDistrict;
  });

  const handleOpenResponse = (cmp: Complaint) => {
    setRespondingTicket(cmp);
    setResponseStatus(cmp.status === 'RESOLVED' ? 'RESOLVED' : 'RESOLVED');
    setResponseRemarks(cmp.responseNote || '');
  };

  const handleSaveResponse = () => {
    if (!respondingTicket) return;
    updateComplaintStatus(respondingTicket.id, responseStatus, responseRemarks);
    setRespondingTicket(null);
    setResponseRemarks('');
  };

  const handleNewTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmpSubject.trim() || !cmpDescription.trim()) return;

    submitComplaint({
      category: cmpCategory,
      subject: cmpSubject.trim(),
      description: cmpDescription.trim(),
      priority: cmpPriority
    });

    setIsSubmitModalOpen(false);
    setCmpSubject('');
    setCmpDescription('');
  };

  if (isFinanceOfficer) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
        <MessageSquareWarning className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">
          Module Restricted for Finance Role
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Per Kifayat Connect permission matrix, grievances are managed exclusively by Regional Officers for their assigned divisions and Super Admin centrally.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Member Grievances & Resolution
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-500">
              {isMember ? 'My Tickets' : isDistrictAdmin ? `${currentUser.assignedDistrict || currentUser.district || 'District'} Desk` : isCoAdmin ? `${currentUser.assignedStateProvince || currentUser.stateProvince || 'State'} Desk` : 'Central Desk'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <MessageSquareWarning className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            <span>Complaints & Support Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isMember 
              ? 'Submit inquiries, report membership card delivery issues, or request welfare support.' 
              : 'Review and resolve tickets submitted by community members in your jurisdiction.'}
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>File New Grievance Ticket</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All Tickets ({visibleComplaints.length})
          </button>
          <button
            onClick={() => setActiveTab('OPEN')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'OPEN'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Open ({visibleComplaints.filter(c => c.status === 'OPEN').length})
          </button>
          <button
            onClick={() => setActiveTab('UNDER_REVIEW')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'UNDER_REVIEW'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Under Review ({visibleComplaints.filter(c => c.status === 'UNDER_REVIEW').length})
          </button>
          <button
            onClick={() => setActiveTab('RESOLVED')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'RESOLVED'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Resolved ({visibleComplaints.filter(c => c.status === 'RESOLVED').length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
          >
            <option value="ALL">All Categories</option>
            <option value="Membership Card">Membership Card</option>
            <option value="Receipt Inquiry">Receipt Inquiry</option>
            <option value="Fund Allocation">Fund Allocation</option>
            <option value="Welfare Support">Welfare Support</option>
            <option value="Regional Activity">Regional Activity</option>
            <option value="General">General</option>
          </select>

          {!isDistrictAdmin && !isCoAdmin && (
            <>
              <select
                value={filterProvince}
                onChange={(e) => {
                  setFilterProvince(e.target.value);
                  setFilterDistrict('ALL');
                }}
                className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
              >
                <option value="ALL">All Provinces</option>
                {PROVINCE_OPTIONS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              <select
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
              >
                <option value="ALL">All Districts</option>
                {(filterProvince !== 'ALL'
                  ? getDistrictsForProvince(filterProvince)
                  : Object.values(PROVINCE_OPTIONS).flatMap(p => getDistrictsForProvince(p))
                ).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredComplaints.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
            No complaints found under this view.
          </div>
        ) : (
          filteredComplaints.map(cmp => {
            const fb = mapLegacyRegionToHierarchy(cmp.region);
            const cDist = cmp.district || fb.district;
            const cProv = cmp.stateProvince || fb.stateProvince;
            const cTeh = cmp.tehsil || fb.tehsil;
            const cUC = cmp.unionCouncil || fb.unionCouncil;

            return (
              <div 
                key={cmp.id}
                className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 font-bold">{cmp.ticketNumber}</span>
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{cmp.subject}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span>From: <strong>{cmp.userName}</strong></span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <MapPin className="w-3 h-3" />
                        {cDist}, {cProv}
                      </span>
                      {cTeh && <span>(Tehsil: {cTeh}{cUC ? `, UC: ${cUC}` : ''})</span>}
                      <span>·</span>
                      <span>Category: <strong className="text-slate-700 dark:text-slate-300">{cmp.category}</strong></span>
                      <span>·</span>
                      <span>Priority: {cmp.priority}</span>
                    </div>
                  </div>

                <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold uppercase ${
                  cmp.status === 'RESOLVED'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : cmp.status === 'UNDER_REVIEW'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}>
                  {cmp.status}
                </span>
              </div>

              <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                {cmp.description}
              </p>

              {cmp.responseNote && (
                <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-xs">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">
                    Official Response ({cmp.assignedOfficerName}):
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 mt-1">
                    {cmp.responseNote}
                  </p>
                  {cmp.resolvedAt && (
                    <span className="block text-[10px] text-slate-400 font-mono mt-1">
                      Resolved: {new Date(cmp.resolvedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              {/* Action buttons */}
              {(isSuperAdmin || isDistrictAdmin || isCoAdmin) && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => handleOpenResponse(cmp)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-semibold rounded shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Update Ticket & Respond</span>
                  </button>
                </div>
              )}
            </div>
            );
          })
        )}
      </div>

      {/* MODAL: SUBMIT COMPLAINT */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 my-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Submit Grievance or Inquiry Ticket
            </h3>

            <form onSubmit={handleNewTicketSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={cmpCategory}
                    onChange={(e) => setCmpCategory(e.target.value as ComplaintCategory)}
                    className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Membership Card">Membership Card Delivery</option>
                    <option value="Receipt Inquiry">Receipt Inquiry</option>
                    <option value="Fund Allocation">Fund Allocation</option>
                    <option value="Welfare Support">Welfare Support</option>
                    <option value="Regional Activity">Regional Activity</option>
                    <option value="General">General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Urgency Priority
                  </label>
                  <select
                    value={cmpPriority}
                    onChange={(e) => setCmpPriority(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  placeholder="State the primary reason for your request..."
                  value={cmpSubject}
                  onChange={(e) => setCmpSubject(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Detailed Explanation
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Please provide full details..."
                  value={cmpDescription}
                  onChange={(e) => setCmpDescription(e.target.value)}
                  className="w-full text-xs p-3 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPDATE TICKET & RESPOND (STAFF ONLY) */}
      {respondingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-xs">
            <div>
              <span className="text-slate-400 uppercase font-mono font-bold">
                {respondingTicket.ticketNumber}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                Respond to: {respondingTicket.subject}
              </h3>
              <p className="text-slate-500 mt-1">
                Filer: {respondingTicket.userName} ({respondingTicket.region})
              </p>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Update Status
              </label>
              <select
                value={responseStatus}
                onChange={(e) => setResponseStatus(e.target.value as ComplaintStatus)}
                className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
              >
                <option value="UNDER_REVIEW">Keep Under Review</option>
                <option value="RESOLVED">Mark as Resolved</option>
                <option value="DISMISSED">Dismiss Ticket</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Official Resolution Response
              </label>
              <textarea
                rows={3}
                required
                value={responseRemarks}
                onChange={(e) => setResponseRemarks(e.target.value)}
                placeholder="State the action taken or delivery details..."
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRespondingTicket(null)}
                className="px-3 py-1.5 text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveResponse}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded shadow-xs"
              >
                Save & Notify Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
