import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Award, 
  ShieldCheck, 
  UserCheck, 
  Clock, 
  AlertCircle, 
  History, 
  PlusCircle, 
  UserX, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  CheckCircle2,
  FileText,
  Search,
  Building
} from 'lucide-react';
import { OfficeBearer, OfficeBearerHistory, User } from '../../types';
import { LuxurySelect } from '../common/LuxurySelect';

export const OfficeBearersModule: React.FC = () => {
  const { 
    currentUser, 
    users, 
    officeBearers, 
    officeBearerHistory, 
    appointOfficeBearer, 
    vacateOfficeBearer,
    setInspectedUserProfile
  } = useApp();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [activeSubTab, setActiveSubTab] = useState<'SEATS' | 'HISTORY'>('SEATS');
  const [filterJurisdiction, setFilterJurisdiction] = useState<'ALL' | 'NATIONAL' | 'STATE' | 'DISTRICT'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'VACANT'>('ALL');

  // Modal state for appointing
  const [selectedSeatForAppoint, setSelectedSeatForAppoint] = useState<OfficeBearer | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [appointmentNotes, setAppointmentNotes] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Modal state for vacating
  const [selectedSeatForVacate, setSelectedSeatForVacate] = useState<OfficeBearer | null>(null);
  const [vacateReason, setVacateReason] = useState<string>('');

  if (!currentUser) return null;

  const filteredSeats = officeBearers.filter(ob => {
    if (filterJurisdiction !== 'ALL' && ob.jurisdiction !== filterJurisdiction) return false;
    if (filterStatus !== 'ALL' && ob.status !== filterStatus) return false;
    return true;
  });

  const activeCount = officeBearers.filter(ob => ob.status === 'ACTIVE').length;
  const vacantCount = officeBearers.filter(ob => ob.status === 'VACANT').length;

  const handleAppointSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeatForAppoint || !selectedUserId) return;
    const res = appointOfficeBearer(selectedSeatForAppoint.seatId, selectedUserId, appointmentNotes);
    if (!res.success) {
      setActionError(res.error || 'Failed to appoint office-bearer.');
    } else {
      setSelectedSeatForAppoint(null);
      setSelectedUserId('');
      setAppointmentNotes('');
      setActionError(null);
    }
  };

  const handleVacateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeatForVacate) return;
    const res = vacateOfficeBearer(selectedSeatForVacate.seatId, vacateReason.trim() || 'Term superseded or completed.');
    if (!res.success) {
      setActionError(res.error || 'Failed to vacate seat.');
    } else {
      setSelectedSeatForVacate(null);
      setVacateReason('');
      setActionError(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Constitutional Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#F5D061] uppercase tracking-wider">
              Organizational Leadership & Governance
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-400">10 Proposed Titles · 13 Constitutional Seats</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-0.5 flex items-center gap-2">
            <Award className="w-6 h-6 text-[#F5D061]" />
            <span>Office-Bearers Management Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Maintain official appointments, terms, jurisdictions, and immutable historical succession records.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3 kc-obsidian-card px-4 py-2.5 rounded-xl text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Seats</span>
            <span className="font-mono font-bold text-white tabular-nums">13</span>
          </div>
          <div className="h-6 w-px bg-[#D4AF37]/25" />
          <div>
            <span className="text-[10px] text-emerald-300 block uppercase font-bold">Occupied</span>
            <span className="font-mono font-bold text-emerald-300 tabular-nums">{activeCount}</span>
          </div>
          <div className="h-6 w-px bg-[#D4AF37]/25" />
          <div>
            <span className="text-[10px] text-[#F5D061] block uppercase font-bold">Vacant</span>
            <span className="font-mono font-bold text-[#F5D061] tabular-nums">{vacantCount}</span>
          </div>
        </div>
      </div>

      {/* Official Constitutional Disclaimer Banner */}
      <div className="p-4 rounded-2xl kc-emerald-panel flex items-start gap-3 text-xs text-slate-100">
        <AlertCircle className="w-5 h-5 text-[#F5D061] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-[#F5D061]">Proposed Constitutional Governance Notice</p>
          <p className="text-slate-200 leading-relaxed">
            These 10 titles and 13 seats (including all 4 distinct Vice President seats) are proposed organizational positions subject to final verification against the official Dastoor (Constitution). Appointment to an organizational office title does not automatically grant technical app privileges; software permissions are managed strictly through Role-Based Access Control.
          </p>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1.5 kc-tab-shell rounded-xl text-xs">
          <button
            onClick={() => setActiveSubTab('SEATS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer kc-pressable tabular-nums ${
              activeSubTab === 'SEATS'
                ? 'kc-gold-button font-bold'
                : 'text-slate-300 hover:text-white hover:bg-[#141B2D]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Active Seats ({officeBearers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('HISTORY')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer kc-pressable tabular-nums ${
              activeSubTab === 'HISTORY'
                ? 'kc-gold-button font-bold'
                : 'text-slate-300 hover:text-white hover:bg-[#141B2D]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Succession History ({officeBearerHistory.length})</span>
          </button>
        </div>

        {activeSubTab === 'SEATS' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-44">
              <LuxurySelect
                compact
                value={filterJurisdiction}
                onChange={(val) => setFilterJurisdiction(val as 'ALL' | 'NATIONAL' | 'STATE' | 'DISTRICT')}
                label="Jurisdiction"
                options={[
                  { value: 'ALL', label: 'All Jurisdictions' },
                  { value: 'NATIONAL', label: 'National Level' },
                  { value: 'STATE', label: 'State / Province Level' },
                  { value: 'DISTRICT', label: 'District Level' }
                ]}
              />
            </div>

            <div className="w-36">
              <LuxurySelect
                compact
                value={filterStatus}
                onChange={(val) => setFilterStatus(val as 'ALL' | 'ACTIVE' | 'VACANT')}
                label="Seat Status"
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'ACTIVE', label: 'Occupied Only' },
                  { value: 'VACANT', label: 'Vacant Only' }
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {/* Subtab 1: Active 13 Seats Grid */}
      {activeSubTab === 'SEATS' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSeats.map(ob => {
            const isOccupied = ob.status === 'ACTIVE' && ob.assignedUserName;
            return (
              <div 
                key={ob.id}
                className={`p-5 rounded-2xl transition-all space-y-3 flex flex-col justify-between ${
                  isOccupied
                    ? 'kc-obsidian-card'
                    : 'bg-[#090D16] border border-dashed border-[#D4AF37]/45 shadow-[inset_0_1px_0_rgba(252,227,138,0.08)]'
                }`}
              >
                <div>
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#D4AF37]/20">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5D061]">
                        {ob.jurisdiction} JURISDICTION {ob.stateProvince ? `· ${ob.stateProvince}` : ''}
                      </span>
                      <h3 className="font-bold text-base text-white leading-tight mt-0.5">
                        {ob.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {ob.seatLabel}
                      </p>
                    </div>

                    <span className={`text-[10px] px-2.5 py-0.5 rounded-lg font-bold uppercase shrink-0 ${
                      isOccupied
                        ? 'bg-[#042920] text-emerald-300 border border-emerald-500/45'
                        : 'bg-[#111726] text-[#F5D061] border border-[#D4AF37]/40'
                    }`}>
                      {ob.status}
                    </span>
                  </div>

                  {/* Incumbent Details */}
                  {isOccupied ? (
                    <div className="pt-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-sm">
                          {ob.assignedUserName}
                        </span>
                        {ob.assignedUserId && (
                          <button
                            onClick={() => {
                              const found = users.find(u => u.id === ob.assignedUserId);
                              if (found) setInspectedUserProfile(found);
                            }}
                            className="text-[11px] text-[#F5D061] hover:underline flex items-center gap-0.5 cursor-pointer font-semibold"
                          >
                            Profile
                          </button>
                        )}
                      </div>

                      <div className="space-y-1 text-slate-300 text-[11px]">
                        {ob.assignedUserLocation && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                            <span>{ob.assignedUserLocation}</span>
                          </div>
                        )}
                        {ob.assignedUserPhone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                            <span className="font-mono tabular-nums">{ob.assignedUserPhone}</span>
                          </div>
                        )}
                        {ob.appointedDate && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                            <span className="tabular-nums">Appointed: {ob.appointedDate} ({ob.termYears}-Year Term)</span>
                          </div>
                        )}
                      </div>

                      {ob.notes && (
                        <p className="text-[11px] italic text-slate-300 pt-2 border-t border-[#D4AF37]/15">
                          "{ob.notes}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-[#F5D061] space-y-1">
                      <AlertCircle className="w-6 h-6 mx-auto opacity-80" />
                      <p className="font-semibold">Position Currently Vacant</p>
                      <p className="text-[11px] text-slate-400">
                        {isSuperAdmin 
                          ? 'Click below to appoint an eligible active member.'
                          : 'Super Admin appointment pending.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Super Admin Action Controls */}
                {isSuperAdmin && (
                  <div className="pt-3 border-t border-[#D4AF37]/20 flex items-center justify-end gap-2 text-xs">
                    {isOccupied ? (
                      <>
                        <button
                          onClick={() => setSelectedSeatForVacate(ob)}
                          className="px-3 py-1.5 text-rose-300 bg-rose-950/60 hover:bg-rose-900/70 rounded-xl border border-rose-500/40 transition-colors cursor-pointer kc-pressable font-semibold"
                        >
                          Declare Vacant
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSeatForAppoint(ob);
                            setSelectedUserId(ob.assignedUserId || '');
                            setAppointmentNotes(ob.notes || '');
                          }}
                          className="px-3.5 py-1.5 kc-gold-button font-bold rounded-xl cursor-pointer"
                        >
                          Reassign
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedSeatForAppoint(ob);
                          setSelectedUserId('');
                          setAppointmentNotes('');
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 kc-gold-button font-bold rounded-xl cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Appoint Office-Bearer</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Subtab 2: Succession & Historical Record Log */
        <div className="kc-obsidian-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#D4AF37]/25 bg-[#090D16] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">
                Historical Succession Registry
              </h3>
              <p className="text-xs text-slate-400">
                Preserved record of all past appointments. Records are never deleted or overwritten.
              </p>
            </div>
            <span className="text-xs font-mono text-[#F5D061] tabular-nums">
              {officeBearerHistory.length} total historical entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#D4AF37]/25 text-[#F5D061] bg-[#090D16] font-semibold">
                  <th className="py-3 px-4">Seat / Office Title</th>
                  <th className="py-3 px-4">Incumbent Name</th>
                  <th className="py-3 px-4">Term Tenure</th>
                  <th className="py-3 px-4">Termination Authority</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4AF37]/15">
                {officeBearerHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No historical appointments recorded yet.
                    </td>
                  </tr>
                ) : (
                  officeBearerHistory.map(hist => (
                    <tr key={hist.id} className="hover:bg-[#161F33]/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">
                        <div>{hist.title}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{hist.seatLabel}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {hist.userName}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300 tabular-nums">
                        {hist.startDate} → {hist.endDate} ({hist.termYears}y)
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {hist.terminatedBy}
                      </td>
                      <td className="py-3 px-4 text-slate-400 italic max-w-xs truncate">
                        "{hist.reason}"
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Appoint Office-Bearer */}
      {selectedSeatForAppoint && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-[#090D16]/85 p-3 sm:p-4 overflow-y-auto">
          <div
            className="kc-luxury-modal rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 my-auto max-h-[92dvh] overflow-y-auto text-slate-100"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div>
              <span className="text-[10px] font-bold text-[#F5D061] uppercase tracking-wider">
                Super Admin Appointment Authority
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Appoint to {selectedSeatForAppoint.title}
              </h3>
              <p className="text-xs text-slate-300">
                {selectedSeatForAppoint.seatLabel} ({selectedSeatForAppoint.jurisdiction} Jurisdiction)
              </p>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleAppointSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-200 mb-1">
                  Select Active Appointee / Member *
                </label>
                <LuxurySelect
                  searchable
                  value={selectedUserId}
                  onChange={setSelectedUserId}
                  placeholder="-- Choose Member or Admin --"
                  label="Select Appointee"
                  options={users.map(u => ({
                    value: u.id,
                    label: u.name,
                    sublabel: `${u.role.replace('_', ' ')} — ${u.district}, ${u.stateProvince}`
                  }))}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">
                  Appointment Reference / Resolution Remarks
                </label>
                <textarea
                  rows={3}
                  value={appointmentNotes}
                  onChange={(e) => setAppointmentNotes(e.target.value)}
                  placeholder="Appointed under bylaws minute. Approved by CEC..."
                  className="w-full p-2.5 rounded-xl kc-luxury-input resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D4AF37]/20">
                <button
                  type="button"
                  onClick={() => setSelectedSeatForAppoint(null)}
                  className="px-3.5 py-2 text-slate-300 hover:text-white bg-[#090D16] border border-[#D4AF37]/20 rounded-xl font-medium cursor-pointer kc-pressable"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 kc-gold-button font-bold rounded-xl cursor-pointer"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Declare Seat Vacant */}
      {selectedSeatForVacate && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-[#090D16]/85 p-3 sm:p-4 overflow-y-auto">
          <div
            className="kc-luxury-modal rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 my-auto max-h-[92dvh] overflow-y-auto text-slate-100"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div>
              <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">
                Termination of Office Term
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Declare {selectedSeatForVacate.seatLabel} Vacant?
              </h3>
              <p className="text-xs text-slate-300">
                Current Incumbent: <strong className="text-white">{selectedSeatForVacate.assignedUserName}</strong>. A historical tenure record will be preserved automatically.
              </p>
            </div>

            <form onSubmit={handleVacateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-200 mb-1">
                  Reason for Vacating *
                </label>
                <textarea
                  required
                  rows={3}
                  value={vacateReason}
                  onChange={(e) => setVacateReason(e.target.value)}
                  placeholder="Term completed, resignation, or administrative restructuring..."
                  className="w-full p-2.5 rounded-xl kc-luxury-input resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D4AF37]/20">
                <button
                  type="button"
                  onClick={() => setSelectedSeatForVacate(null)}
                  className="px-3.5 py-2 text-slate-300 hover:text-white bg-[#090D16] border border-[#D4AF37]/20 rounded-xl font-medium cursor-pointer kc-pressable"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-600 border border-rose-500/50 text-white font-bold rounded-xl cursor-pointer kc-pressable"
                >
                  Declare Vacant & Record History
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
