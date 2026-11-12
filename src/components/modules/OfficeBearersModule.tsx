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

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Organizational Leadership & Governance
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-500">10 Proposed Titles · 13 Constitutional Seats</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            <span>Office-Bearers Management Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain official appointments, terms, jurisdictions, and immutable historical succession records.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Seats</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">13</span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
          <div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block uppercase font-bold">Occupied</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
          <div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 block uppercase font-bold">Vacant</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{vacantCount}</span>
          </div>
        </div>
      </div>

      {/* Official Constitutional Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Proposed Constitutional Governance Notice</p>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            These 10 titles and 13 seats (including all 4 distinct Vice President seats) are proposed organizational positions subject to final verification against the official Dastoor (Constitution). Appointment to an organizational office title does not automatically grant technical app privileges; software permissions are managed strictly through Role-Based Access Control.
          </p>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
          <button
            onClick={() => setActiveSubTab('SEATS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-medium transition-colors ${
              activeSubTab === 'SEATS'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Active Seats ({officeBearers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('HISTORY')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-medium transition-colors ${
              activeSubTab === 'HISTORY'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Succession History ({officeBearerHistory.length})</span>
          </button>
        </div>

        {activeSubTab === 'SEATS' && (
          <div className="flex items-center gap-2">
            <select
              value={filterJurisdiction}
              onChange={(e) => setFilterJurisdiction(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Jurisdictions</option>
              <option value="NATIONAL">National Level</option>
              <option value="STATE">State / Province Level</option>
              <option value="DISTRICT">District Level</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Occupied Only</option>
              <option value="VACANT">Vacant Only</option>
            </select>
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
                className={`p-5 rounded-xl border bg-white dark:bg-slate-900 transition-all space-y-3 flex flex-col justify-between ${
                  isOccupied
                    ? 'border-slate-200 dark:border-slate-800 shadow-xs'
                    : 'border-dashed border-amber-300 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/10'
                }`}
              >
                <div>
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        {ob.jurisdiction} JURISDICTION {ob.stateProvince ? `· ${ob.stateProvince}` : ''}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight mt-0.5">
                        {ob.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {ob.seatLabel}
                      </p>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                      isOccupied
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}>
                      {ob.status}
                    </span>
                  </div>

                  {/* Incumbent Details */}
                  {isOccupied ? (
                    <div className="pt-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                          {ob.assignedUserName}
                        </span>
                        {ob.assignedUserId && (
                          <button
                            onClick={() => {
                              const found = users.find(u => u.id === ob.assignedUserId);
                              if (found) setInspectedUserProfile(found);
                            }}
                            className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5"
                          >
                            Profile
                          </button>
                        )}
                      </div>

                      <div className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                        {ob.assignedUserLocation && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{ob.assignedUserLocation}</span>
                          </div>
                        )}
                        {ob.assignedUserPhone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{ob.assignedUserPhone}</span>
                          </div>
                        )}
                        {ob.appointedDate && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Appointed: {ob.appointedDate} ({ob.termYears}-Year Term)</span>
                          </div>
                        )}
                      </div>

                      {ob.notes && (
                        <p className="text-[11px] italic text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/40">
                          "{ob.notes}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-amber-700 dark:text-amber-400 space-y-1">
                      <AlertCircle className="w-6 h-6 mx-auto opacity-70" />
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
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 text-xs">
                    {isOccupied ? (
                      <>
                        <button
                          onClick={() => setSelectedSeatForVacate(ob)}
                          className="px-2.5 py-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded border border-rose-200 dark:border-rose-800 transition-colors"
                        >
                          Declare Vacant
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSeatForAppoint(ob);
                            setSelectedUserId(ob.assignedUserId || '');
                            setAppointmentNotes(ob.notes || '');
                          }}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 font-bold rounded transition-colors shadow-xs"
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
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-xs transition-colors"
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
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Historical Succession Registry
              </h3>
              <p className="text-xs text-slate-500">
                Preserved record of all past appointments. Records are never deleted or overwritten.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {officeBearerHistory.length} total historical entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 bg-slate-50/50 dark:bg-slate-950/50 font-semibold">
                  <th className="py-3 px-4">Seat / Office Title</th>
                  <th className="py-3 px-4">Incumbent Name</th>
                  <th className="py-3 px-4">Term Tenure</th>
                  <th className="py-3 px-4">Termination Authority</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {officeBearerHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No historical appointments recorded yet.
                    </td>
                  </tr>
                ) : (
                  officeBearerHistory.map(hist => (
                    <tr key={hist.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        <div>{hist.title}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{hist.seatLabel}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {hist.userName}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {hist.startDate} → {hist.endDate} ({hist.termYears}y)
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {hist.terminatedBy}
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                Super Admin Appointment Authority
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                Appoint to {selectedSeatForAppoint.title}
              </h3>
              <p className="text-xs text-slate-500">
                {selectedSeatForAppoint.seatLabel} ({selectedSeatForAppoint.jurisdiction} Jurisdiction)
              </p>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleAppointSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Active Appointee / Member *
                </label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">-- Choose Member or Admin --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role.replace('_', ' ')}) — {u.district}, {u.stateProvince}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Appointment Reference / Resolution Remarks
                </label>
                <textarea
                  rows={3}
                  value={appointmentNotes}
                  onChange={(e) => setAppointmentNotes(e.target.value)}
                  placeholder="Appointed under bylaws minute. Approved by CEC..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedSeatForAppoint(null)}
                  className="px-3.5 py-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div>
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                Termination of Office Term
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                Declare {selectedSeatForVacate.seatLabel} Vacant?
              </h3>
              <p className="text-xs text-slate-500">
                Current Incumbent: <strong>{selectedSeatForVacate.assignedUserName}</strong>. A historical tenure record will be preserved automatically.
              </p>
            </div>

            <form onSubmit={handleVacateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Vacating *
                </label>
                <textarea
                  required
                  rows={3}
                  value={vacateReason}
                  onChange={(e) => setVacateReason(e.target.value)}
                  placeholder="Term completed, resignation, or administrative restructuring..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedSeatForVacate(null)}
                  className="px-3.5 py-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm"
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
