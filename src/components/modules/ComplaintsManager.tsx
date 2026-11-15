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
import { LuxurySelect } from '../common/LuxurySelect';
import { ProfileCompletionGate, needsProfileCompletion } from '../common/ProfileCompletionGate';

export const ComplaintsManager: React.FC = () => {
  const { 
    currentUser, 
    complaints, 
    submitComplaint, 
    updateComplaintStatus, 
    openCompleteProfileModal,
    language 
  } = useApp();
  const requiresProfileCompletion = needsProfileCompletion(currentUser);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isDistrictAdmin = currentUser?.role === 'ADMIN';
  const isCoAdmin = currentUser?.role === 'CO_ADMIN';
  const isMember = currentUser?.role === 'MEMBER';

  const [activeTab, setActiveTab] = useState<'ALL' | 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterProvince, setFilterProvince] = useState<string>(
    isCoAdmin || isDistrictAdmin ? (currentUser?.assignedStateProvince || currentUser?.stateProvince || 'Punjab') : 'ALL'
  );
  const [filterDistrict, setFilterDistrict] = useState<string>(
    isDistrictAdmin ? (currentUser?.assignedDistrict || currentUser?.district || 'Lahore') : 'ALL'
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

  if (!currentUser) return null;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#F5D061] uppercase tracking-wider">
              Member Grievances & Resolution
            </span>
            <span className="text-[#D4AF37]/50">·</span>
            <span className="text-xs text-slate-300">
              {isMember ? 'My Tickets' : isDistrictAdmin ? `${currentUser.assignedDistrict || currentUser.district || 'District'} Desk` : isCoAdmin ? `${currentUser.assignedStateProvince || currentUser.stateProvince || 'State'} Desk` : 'Central Desk'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <MessageSquareWarning className="w-6 h-6 text-[#F5D061]" />
            <span>Complaints & Support Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isMember 
              ? 'Submit inquiries, report membership card delivery issues, or request welfare support.' 
              : 'Review and resolve tickets submitted by community members in your jurisdiction.'}
          </p>
        </div>

        <button
          onClick={() => {
            if (requiresProfileCompletion) {
              openCompleteProfileModal();
            } else {
              setIsSubmitModalOpen(true);
            }
          }}
          className="kc-pressable kc-gold-button flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>File New Grievance Ticket</span>
        </button>
      </div>

      {requiresProfileCompletion && (
        <ProfileCompletionGate compact featureName="Complaints & Support" />
      )}

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="kc-tab-shell flex items-center gap-1 p-1 rounded-xl flex-wrap">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`kc-pressable px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer tabular-nums ${
              activeTab === 'ALL'
                ? 'kc-gold-button'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            All Tickets ({visibleComplaints.length})
          </button>
          <button
            onClick={() => setActiveTab('OPEN')}
            className={`kc-pressable px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer tabular-nums ${
              activeTab === 'OPEN'
                ? 'kc-gold-button'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Open ({visibleComplaints.filter(c => c.status === 'OPEN').length})
          </button>
          <button
            onClick={() => setActiveTab('UNDER_REVIEW')}
            className={`kc-pressable px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer tabular-nums ${
              activeTab === 'UNDER_REVIEW'
                ? 'kc-gold-button'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Under Review ({visibleComplaints.filter(c => c.status === 'UNDER_REVIEW').length})
          </button>
          <button
            onClick={() => setActiveTab('RESOLVED')}
            className={`kc-pressable px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer tabular-nums ${
              activeTab === 'RESOLVED'
                ? 'kc-gold-button'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Resolved ({visibleComplaints.filter(c => c.status === 'RESOLVED').length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-44">
            <LuxurySelect
              compact
              value={filterCategory}
              onChange={setFilterCategory}
              label="Ticket Category"
              options={[
                { value: 'ALL', label: 'All Categories' },
                { value: 'Membership Card', label: 'Membership Card' },
                { value: 'Receipt Inquiry', label: 'Receipt Inquiry' },
                { value: 'Fund Allocation', label: 'Fund Allocation' },
                { value: 'Welfare Support', label: 'Welfare Support' },
                { value: 'District Activity', label: 'District Activity' },
                { value: 'General', label: 'General' }
              ]}
            />
          </div>

          {!isDistrictAdmin && !isCoAdmin && (
            <>
              <div className="w-40">
                <LuxurySelect
                  compact
                  value={filterProvince}
                  onChange={(val) => {
                    setFilterProvince(val);
                    setFilterDistrict('ALL');
                  }}
                  label="Province"
                  options={[
                    { value: 'ALL', label: 'All Provinces' },
                    ...PROVINCE_OPTIONS.map(p => ({ value: p, label: p }))
                  ]}
                />
              </div>

              <div className="w-44">
                <LuxurySelect
                  compact
                  searchable
                  value={filterDistrict}
                  onChange={setFilterDistrict}
                  label="District"
                  options={[
                    { value: 'ALL', label: 'All Districts' },
                    ...(filterProvince !== 'ALL'
                      ? getDistrictsForProvince(filterProvince)
                      : PROVINCE_OPTIONS.flatMap(p => getDistrictsForProvince(p))
                    ).map(d => ({ value: d, label: d }))
                  ]}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredComplaints.length === 0 ? (
          <div className="kc-obsidian-card p-12 text-center rounded-2xl text-xs text-slate-400">
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
                className="kc-obsidian-card p-5 rounded-2xl space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[#F5D061] font-bold">{cmp.ticketNumber}</span>
                      <span className="font-bold text-sm text-white">{cmp.subject}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span>From: <strong className="text-slate-200">{cmp.userName}</strong></span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                        <MapPin className="w-3 h-3" />
                        {cDist}, {cProv}
                      </span>
                      {cTeh && <span>(Tehsil: {cTeh}{cUC ? `, UC: ${cUC}` : ''})</span>}
                      <span>·</span>
                      <span>Category: <strong className="text-slate-200">{cmp.category}</strong></span>
                      <span>·</span>
                      <span>Priority: <strong className="text-[#F5D061]">{cmp.priority}</strong></span>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase shrink-0 ${
                    cmp.status === 'RESOLVED'
                      ? 'bg-[#042920] text-emerald-300 border border-emerald-500/45'
                      : cmp.status === 'UNDER_REVIEW'
                      ? 'bg-amber-500/15 text-[#F5D061] border border-[#D4AF37]/45'
                      : 'bg-rose-950/80 text-rose-300 border border-rose-500/45'
                  }`}>
                    {cmp.status}
                  </span>
                </div>

                <p className="text-slate-200 leading-relaxed bg-[#090D16] p-3.5 rounded-xl border border-[#D4AF37]/20">
                  {cmp.description}
                </p>

                {cmp.responseNote && (
                  <div className="p-3.5 rounded-xl kc-emerald-panel text-xs">
                    <span className="font-bold text-[#F5D061]">
                      Official Response ({cmp.assignedOfficerName}):
                    </span>
                    <p className="text-slate-100 mt-1">
                      {cmp.responseNote}
                    </p>
                    {cmp.resolvedAt && (
                      <span className="block text-[10px] text-emerald-300/80 font-mono mt-1">
                        Resolved: {new Date(cmp.resolvedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                {(isSuperAdmin || isDistrictAdmin || isCoAdmin) && (
                  <div className="pt-2.5 border-t border-[#D4AF37]/20 flex justify-end">
                    <button
                      onClick={() => handleOpenResponse(cmp)}
                      className="kc-pressable flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#063B2E] to-[#0B664F] hover:brightness-110 border border-emerald-400/45 text-white text-xs font-bold rounded-lg shadow-md cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
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
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/85 p-3 sm:p-4 overflow-y-auto">
          <div
            className="kc-luxury-modal relative w-full max-w-lg rounded-2xl p-5 sm:p-6 my-auto max-h-[92dvh] overflow-y-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <h3 className="text-base font-bold text-[#F5D061] pb-2.5 border-b border-[#D4AF37]/25">
              Submit Grievance or Inquiry Ticket
            </h3>

            <form onSubmit={handleNewTicketSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">
                    Category
                  </label>
                  <LuxurySelect
                    compact
                    value={cmpCategory}
                    onChange={(val) => setCmpCategory(val as ComplaintCategory)}
                    label="Category"
                    options={[
                      { value: 'Membership Card', label: 'Membership Card Delivery' },
                      { value: 'Receipt Inquiry', label: 'Receipt Inquiry' },
                      { value: 'Fund Allocation', label: 'Fund Allocation' },
                      { value: 'Welfare Support', label: 'Welfare Support' },
                      { value: 'District Activity', label: 'District Activity' },
                      { value: 'General', label: 'General Inquiry' }
                    ]}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">
                    Urgency Priority
                  </label>
                  <LuxurySelect
                    compact
                    value={cmpPriority}
                    onChange={(val) => setCmpPriority(val as 'LOW' | 'MEDIUM' | 'HIGH')}
                    label="Urgency Priority"
                    options={[
                      { value: 'LOW', label: 'Low' },
                      { value: 'MEDIUM', label: 'Medium' },
                      { value: 'HIGH', label: 'High' }
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  placeholder="State the primary reason for your request..."
                  value={cmpSubject}
                  onChange={(e) => setCmpSubject(e.target.value)}
                  className="kc-luxury-input w-full text-xs px-3 py-2.5 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">
                  Detailed Explanation
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Please provide full details..."
                  value={cmpDescription}
                  onChange={(e) => setCmpDescription(e.target.value)}
                  className="kc-luxury-input w-full text-xs p-3 rounded-xl resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D4AF37]/20">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="kc-pressable px-3.5 py-2 text-xs text-slate-300 hover:text-white font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="kc-pressable kc-gold-button flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/85 p-3 sm:p-4 overflow-y-auto">
          <div
            className="kc-luxury-modal rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 text-xs my-auto max-h-[92dvh] overflow-y-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div>
              <span className="text-[#F5D061] uppercase font-mono font-bold">
                {respondingTicket.ticketNumber}
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Respond to: {respondingTicket.subject}
              </h3>
              <p className="text-slate-400 mt-1">
                Filer: {respondingTicket.userName} ({respondingTicket.district || 'Pakistan'})
              </p>
            </div>

            <div>
              <label className="font-semibold text-slate-200 block mb-1">
                Update Status
              </label>
              <LuxurySelect
                compact
                value={responseStatus}
                onChange={(val) => setResponseStatus(val as ComplaintStatus)}
                label="Update Status"
                options={[
                  { value: 'UNDER_REVIEW', label: 'Keep Under Review' },
                  { value: 'RESOLVED', label: 'Mark as Resolved' },
                  { value: 'DISMISSED', label: 'Dismiss Ticket' }
                ]}
              />
            </div>

            <div>
              <label className="font-semibold text-slate-200 block mb-1">
                Official Resolution Response
              </label>
              <textarea
                rows={3}
                required
                value={responseRemarks}
                onChange={(e) => setResponseRemarks(e.target.value)}
                placeholder="State the action taken or delivery details..."
                className="kc-luxury-input w-full p-3 rounded-xl resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D4AF37]/20">
              <button
                type="button"
                onClick={() => setRespondingTicket(null)}
                className="kc-pressable px-3.5 py-2 text-slate-300 hover:text-white font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveResponse}
                className="kc-pressable kc-gold-button px-4 py-2 font-extrabold rounded-xl cursor-pointer"
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
