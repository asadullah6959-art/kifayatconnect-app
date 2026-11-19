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
  Building,
  X
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
    setInspectedUserProfile,
    language
  } = useApp();
  const isUr = language === 'ur';

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
      setActionError(res.error || (isUr ? 'عہدیدار مقرر کرنے میں ناکامی۔' : 'Failed to appoint office-bearer.'));
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
    const res = vacateOfficeBearer(
      selectedSeatForVacate.seatId,
      vacateReason.trim() || (isUr ? 'مدت مکمل یا عہدہ تبدیل ہو گیا۔' : 'Term superseded or completed.')
    );
    if (!res.success) {
      setActionError(res.error || (isUr ? 'نشست خالی کرنے میں ناکامی۔' : 'Failed to vacate seat.'));
    } else {
      setSelectedSeatForVacate(null);
      setVacateReason('');
      setActionError(null);
    }
  };

  const localizeJurisdiction = (jur: string) => {
    if (!isUr) return jur;
    if (jur === 'NATIONAL') return 'قومی';
    if (jur === 'STATE') return 'صوبائی';
    if (jur === 'DISTRICT') return 'ضلعی';
    return jur;
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Constitutional Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#F5D061] uppercase tracking-wider">
              {isUr ? 'تنظیمی قیادت اور گورننس' : 'Organizational Leadership & Governance'}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-400">
              {isUr ? '10 مجوزہ عہدے · 13 آئینی نشستیں' : '10 Proposed Titles · 13 Constitutional Seats'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-0.5 flex items-center gap-2">
            <Award className="w-6 h-6 text-[#F5D061]" />
            <span>{isUr ? 'عہدیداران مینجمنٹ سینٹر' : 'Office-Bearers Management Center'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isUr
              ? 'سرکاری تقرریوں، مدتِ عہدہ، دائرہ اختیار اور تاریخی جانشینی کے ریکارڈ کا نظم کریں۔'
              : 'Maintain official appointments, terms, jurisdictions, and immutable historical succession records.'}
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3 kc-obsidian-card px-4 py-2.5 rounded-xl text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold">{isUr ? 'کل نشستیں' : 'Total Seats'}</span>
            <span className="font-mono font-bold text-white tabular-nums">13</span>
          </div>
          <div className="h-6 w-px bg-[#D4AF37]/25" />
          <div>
            <span className="text-[10px] text-emerald-300 block uppercase font-bold">{isUr ? 'پُر' : 'Occupied'}</span>
            <span className="font-mono font-bold text-emerald-300 tabular-nums">{activeCount}</span>
          </div>
          <div className="h-6 w-px bg-[#D4AF37]/25" />
          <div>
            <span className="text-[10px] text-[#F5D061] block uppercase font-bold">{isUr ? 'خالی' : 'Vacant'}</span>
            <span className="font-mono font-bold text-[#F5D061] tabular-nums">{vacantCount}</span>
          </div>
        </div>
      </div>

      {/* Official Constitutional Disclaimer Banner */}
      <div className="p-4 rounded-2xl kc-emerald-panel flex items-start gap-3 text-xs text-slate-100">
        <AlertCircle className="w-5 h-5 text-[#F5D061] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-[#F5D061]">
            {isUr ? 'مجوزہ آئینی گورننس نوٹس' : 'Proposed Constitutional Governance Notice'}
          </p>
          <p className="text-slate-200 leading-relaxed">
            {isUr
              ? 'یہ 10 عہدے اور 13 نشستیں (بشمول 4 مختلف نائب صدور کی نشستیں) سرکاری دستور کے مطابق حتمی توثیق سے مشروط مجوزہ تنظیمی عہدے ہیں۔ تنظیمی عہدے پر تقرری سے ایپ کے تکنیکی اختیارات خود بخود منتقل نہیں ہوتے؛ سافٹ ویئر اختیارات رول بیسڈ کنٹرول کے تحت چلتے ہیں۔'
              : 'These 10 titles and 13 seats (including all 4 distinct Vice President seats) are proposed organizational positions subject to final verification against the official Dastoor (Constitution). Appointment to an organizational office title does not automatically grant technical app privileges; software permissions are managed strictly through Role-Based Access Control.'}
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
            <span>{isUr ? `فعال نشستیں (${officeBearers.length})` : `Active Seats (${officeBearers.length})`}</span>
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
            <span>{isUr ? `تاریخی ریکارڈ (${officeBearerHistory.length})` : `Succession History (${officeBearerHistory.length})`}</span>
          </button>
        </div>

        {activeSubTab === 'SEATS' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-44">
              <LuxurySelect
                compact
                value={filterJurisdiction}
                onChange={(val) => setFilterJurisdiction(val as 'ALL' | 'NATIONAL' | 'STATE' | 'DISTRICT')}
                label={isUr ? 'دائرہ اختیار' : 'Jurisdiction'}
                options={[
                  { value: 'ALL', label: isUr ? 'تمام دائرہ ہائے اختیار' : 'All Jurisdictions' },
                  { value: 'NATIONAL', label: isUr ? 'قومی سطح' : 'National Level' },
                  { value: 'STATE', label: isUr ? 'صوبائی سطح' : 'State / Province Level' },
                  { value: 'DISTRICT', label: isUr ? 'ضلعی سطح' : 'District Level' }
                ]}
              />
            </div>

            <div className="w-36">
              <LuxurySelect
                compact
                value={filterStatus}
                onChange={(val) => setFilterStatus(val as 'ALL' | 'ACTIVE' | 'VACANT')}
                label={isUr ? 'نشست کی حیثیت' : 'Seat Status'}
                options={[
                  { value: 'ALL', label: isUr ? 'تمام حیثیتیں' : 'All Statuses' },
                  { value: 'ACTIVE', label: isUr ? 'صرف پُر نشستیں' : 'Occupied Only' },
                  { value: 'VACANT', label: isUr ? 'صرف خالی نشستیں' : 'Vacant Only' }
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
                        {localizeJurisdiction(ob.jurisdiction)} {isUr ? 'دائرہ اختیار' : 'JURISDICTION'} {ob.stateProvince ? `· ${ob.stateProvince}` : ''}
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
                        ? 'bg-[#131C31] text-[#38BDF8] border border-[#38BDF8]/45'
                        : 'bg-[#111726] text-[#F5D061] border border-[#D4AF37]/40'
                    }`}>
                      {isUr ? (ob.status === 'ACTIVE' ? 'فعال' : 'خالی') : ob.status}
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
                            {isUr ? 'پروفائل' : 'Profile'}
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
                            <span className="tabular-nums">
                              {isUr
                                ? `تقرری: ${ob.appointedDate} (${ob.termYears} سالہ مدت)`
                                : `Appointed: ${ob.appointedDate} (${ob.termYears}-Year Term)`}
                            </span>
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
                      <p className="font-semibold">{isUr ? 'یہ نشست فی الحال خالی ہے' : 'Position Currently Vacant'}</p>
                      <p className="text-[11px] text-slate-400">
                        {isSuperAdmin 
                          ? (isUr ? 'اہل فعال ممبر مقرر کرنے کے لیے نیچے کلک کریں۔' : 'Click below to appoint an eligible active member.')
                          : (isUr ? 'سپر ایڈمن کی جانب سے تقرری زیرِ التواء ہے۔' : 'Super Admin appointment pending.')}
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
                          {isUr ? 'خالی قرار دیں' : 'Declare Vacant'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSeatForAppoint(ob);
                            setSelectedUserId(ob.assignedUserId || '');
                            setAppointmentNotes(ob.notes || '');
                          }}
                          className="px-3.5 py-1.5 kc-gold-button font-bold rounded-xl cursor-pointer"
                        >
                          {isUr ? 'دوبارہ تقرری' : 'Reassign'}
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
                        <span>{isUr ? 'عہدیدار مقرر کریں' : 'Appoint Office-Bearer'}</span>
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
                {isUr ? 'تاریخی جانشینی رجسٹری' : 'Historical Succession Registry'}
              </h3>
              <p className="text-xs text-slate-400">
                {isUr
                  ? 'تمام سابقہ تقرریوں کا محفوظ ریکارڈ۔ ریکارڈز کبھی حذف یا تبدیل نہیں ہوتے۔'
                  : 'Preserved record of all past appointments. Records are never deleted or overwritten.'}
              </p>
            </div>
            <span className="text-xs font-mono text-[#F5D061] tabular-nums">
              {isUr ? `کل ${officeBearerHistory.length} تاریخی اندراجات` : `${officeBearerHistory.length} total historical entries`}
            </span>
          </div>

          <div className="p-3 sm:p-4 space-y-2.5">
            {officeBearerHistory.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {isUr ? 'ابھی تک کوئی تاریخی تقرری ریکارڈ نہیں ہوئی۔' : 'No historical appointments recorded yet.'}
              </div>
            ) : (
              officeBearerHistory.map(hist => (
                <div
                  key={hist.id}
                  className="p-3.5 rounded-xl bg-[#090D16] border border-[#D4AF37]/25 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{hist.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{hist.seatLabel}</p>
                    </div>
                    <span className="text-[10px] font-mono text-[#F5D061] bg-[#141B2D] border border-[#D4AF37]/30 px-2 py-0.5 rounded shrink-0 tabular-nums">
                      {hist.startDate} → {hist.endDate} ({hist.termYears}y)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-[#D4AF37]/15 text-[11px]">
                    <span className="font-semibold text-slate-200">{hist.userName}</span>
                    <span className="text-slate-400">{hist.terminatedBy}</span>
                  </div>
                  {hist.reason && (
                    <p className="text-[11px] text-slate-400 italic break-words">
                      "{hist.reason}"
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: Appoint Office-Bearer */}
      {selectedSeatForAppoint && (
        <div className="fixed inset-0 z-[95] kc-modal-backdrop flex items-start sm:items-center justify-center bg-[#090D16]/85 overflow-y-auto">
          <div
            className="kc-luxury-modal kc-modal-panel rounded-2xl p-5 sm:p-6 pb-24 sm:pb-6 max-w-md w-full space-y-4 my-auto overflow-y-auto text-slate-100"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-[#F5D061] uppercase tracking-wider block">
                  {isUr ? 'سپر ایڈمن تقرری کا اختیار' : 'Super Admin Appointment Authority'}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5 break-words whitespace-normal leading-snug">
                  {isUr ? `${selectedSeatForAppoint.title} پر تقرری` : `Appoint to ${selectedSeatForAppoint.title}`}
                </h3>
                <p className="text-xs text-slate-300 break-words whitespace-normal leading-snug mt-0.5">
                  {selectedSeatForAppoint.seatLabel} ({localizeJurisdiction(selectedSeatForAppoint.jurisdiction)} {isUr ? 'دائرہ اختیار' : 'Jurisdiction'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSeatForAppoint(null)}
                aria-label={isUr ? 'بند کریں' : 'Close'}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl bg-[#090D16] border border-[#D4AF37]/30 text-slate-300 hover:text-white cursor-pointer shrink-0 kc-pressable"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleAppointSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-200 mb-1">
                  {isUr ? 'فعال عہدیدار / ممبر منتخب کریں *' : 'Select Active Appointee / Member *'}
                </label>
                <LuxurySelect
                  searchable
                  value={selectedUserId}
                  onChange={setSelectedUserId}
                  placeholder={isUr ? '-- ممبر یا ایڈمن منتخب کریں --' : '-- Choose Member or Admin --'}
                  label={isUr ? 'منتخب کردہ امیدوار' : 'Select Appointee'}
                  options={users.map(u => ({
                    value: u.id,
                    label: u.name,
                    sublabel: `${u.role.replace('_', ' ')} — ${u.district}, ${u.stateProvince}`
                  }))}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">
                  {isUr ? 'تقرری کا حوالہ / قرارداد کے نوٹس' : 'Appointment Reference / Resolution Remarks'}
                </label>
                <textarea
                  rows={3}
                  value={appointmentNotes}
                  onChange={(e) => setAppointmentNotes(e.target.value)}
                  placeholder={isUr ? 'دستور کے تحت تقرری اور مجلسِ عاملہ کی منظوری...' : 'Appointed under bylaws minute. Approved by CEC...'}
                  className="w-full p-2.5 rounded-xl kc-luxury-input resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D4AF37]/20">
                <button
                  type="button"
                  onClick={() => setSelectedSeatForAppoint(null)}
                  className="px-3.5 py-2 text-slate-300 hover:text-white bg-[#090D16] border border-[#D4AF37]/20 rounded-xl font-medium cursor-pointer kc-pressable"
                >
                  {isUr ? 'منسوخ کریں' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 kc-gold-button font-bold rounded-xl cursor-pointer"
                >
                  {isUr ? 'تقرری کی تصدیق کریں' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Declare Seat Vacant */}
      {selectedSeatForVacate && (
        <div className="fixed inset-0 z-[95] kc-modal-backdrop flex items-start sm:items-center justify-center bg-[#090D16]/85 overflow-y-auto">
          <div
            className="kc-luxury-modal kc-modal-panel rounded-2xl p-5 sm:p-6 pb-24 sm:pb-6 max-w-md w-full space-y-4 my-auto overflow-y-auto text-slate-100"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider block">
                  {isUr ? 'عہدے کی مدت کا اختتام' : 'Termination of Office Term'}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5 break-words whitespace-normal leading-snug">
                  {isUr ? `کیا ${selectedSeatForVacate.seatLabel} خالی قرار دیں؟` : `Declare ${selectedSeatForVacate.seatLabel} Vacant?`}
                </h3>
                <p className="text-xs text-slate-300 break-words whitespace-normal leading-snug mt-0.5">
                  {isUr ? 'موجودہ عہدیدار:' : 'Current Incumbent:'}{' '}
                  <strong className="text-white">{selectedSeatForVacate.assignedUserName}</strong>.{' '}
                  {isUr ? 'تاریخی مدت کا ریکارڈ خود بخود محفوظ ہو جائے گا۔' : 'A historical tenure record will be preserved automatically.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSeatForVacate(null)}
                aria-label={isUr ? 'بند کریں' : 'Close'}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl bg-[#090D16] border border-[#D4AF37]/30 text-slate-300 hover:text-white cursor-pointer shrink-0 kc-pressable"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVacateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-200 mb-1">
                  {isUr ? 'خالی قرار دینے کی وجہ *' : 'Reason for Vacating *'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={vacateReason}
                  onChange={(e) => setVacateReason(e.target.value)}
                  placeholder={isUr ? 'مدت کی تکمیل، استعفیٰ یا انتظامی تبدیلی...' : 'Term completed, resignation, or administrative restructuring...'}
                  className="w-full p-2.5 rounded-xl kc-luxury-input resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D4AF37]/20">
                <button
                  type="button"
                  onClick={() => setSelectedSeatForVacate(null)}
                  className="px-3.5 py-2 text-slate-300 hover:text-white bg-[#090D16] border border-[#D4AF37]/20 rounded-xl font-medium cursor-pointer kc-pressable"
                >
                  {isUr ? 'منسوخ کریں' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-600 border border-rose-500/50 text-white font-bold rounded-xl cursor-pointer kc-pressable"
                >
                  {isUr ? 'خالی قرار دیں اور تاریخ محفوظ کریں' : 'Declare Vacant & Record History'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
