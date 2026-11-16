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
  Filter,
  Mic,
  Square,
  AudioLines
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
import { useSpeechDictation, appendDictatedText } from '../../hooks/useSpeechDictation';

export const ComplaintsManager: React.FC = () => {
  const { 
    currentUser, 
    complaints, 
    submitComplaint, 
    updateComplaintStatus, 
    openCompleteProfileModal,
    language 
  } = useApp();
  const isUr = language === 'ur';
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

  // Web Speech API dictation state
  type DictationField = 'SUBJECT' | 'DESCRIPTION' | 'RESPONSE';
  const [dictationTarget, setDictationTarget] = useState<DictationField | null>(null);
  const [dictationLocale, setDictationLocale] = useState<'en-US' | 'ur-PK'>(
    language === 'ur' ? 'ur-PK' : 'en-US'
  );

  const speech = useSpeechDictation({
    language,
    speechLangOverride: dictationLocale,
    onFinalTranscript: (spoken) => {
      if (dictationTarget === 'SUBJECT') {
        setCmpSubject(prev => appendDictatedText(prev, spoken));
      } else if (dictationTarget === 'DESCRIPTION') {
        setCmpDescription(prev => appendDictatedText(prev, spoken));
      } else if (dictationTarget === 'RESPONSE') {
        setResponseRemarks(prev => appendDictatedText(prev, spoken));
      }
    }
  });

  const handleToggleFieldDictation = (field: DictationField) => {
    speech.clearError();
    if (speech.isListening && dictationTarget === field) {
      speech.stopDictation();
      setDictationTarget(null);
      return;
    }
    setDictationTarget(field);
    speech.startDictation(dictationLocale);
  };

  const stopComplaintDictation = () => {
    speech.stopDictation();
    speech.clearError();
    setDictationTarget(null);
  };

  if (!currentUser) return null;

  const localizeStatus = (status: ComplaintStatus) => {
    if (!isUr) return status;
    if (status === 'OPEN') return 'کھلی شکایت';
    if (status === 'UNDER_REVIEW') return 'زیرِ غور';
    if (status === 'RESOLVED') return 'حل شدہ';
    if (status === 'DISMISSED') return 'خارج شدہ';
    return status;
  };

  const localizePriority = (priority: string) => {
    if (!isUr) return priority;
    if (priority === 'LOW') return 'کم';
    if (priority === 'MEDIUM') return 'درمیانی';
    if (priority === 'HIGH') return 'فوری / ہائی';
    return priority;
  };

  const localizeCategory = (cat: string) => {
    if (!isUr) return cat;
    if (cat === 'Membership Card') return 'ممبرشپ کارڈ';
    if (cat === 'Receipt Inquiry') return 'رسید سے متعلق استفسار';
    if (cat === 'Fund Allocation') return 'فنڈ کی تقسیم';
    if (cat === 'Welfare Support') return 'فلاحی امداد';
    if (cat === 'District Activity') return 'ضلعی سرگرمی';
    if (cat === 'General') return 'عمومی';
    return cat;
  };

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
    stopComplaintDictation();
    setRespondingTicket(cmp);
    setResponseStatus(cmp.status === 'RESOLVED' ? 'RESOLVED' : 'RESOLVED');
    setResponseRemarks(cmp.responseNote || '');
  };

  const handleSaveResponse = () => {
    if (!respondingTicket) return;
    stopComplaintDictation();
    updateComplaintStatus(respondingTicket.id, responseStatus, responseRemarks);
    setRespondingTicket(null);
    setResponseRemarks('');
  };

  const handleNewTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmpSubject.trim() || !cmpDescription.trim()) return;
    stopComplaintDictation();

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
              {isUr ? 'اراکین کی شکایات و حل' : 'Member Grievances & Resolution'}
            </span>
            <span className="text-[#D4AF37]/50">·</span>
            <span className="text-xs text-slate-300">
              {isMember
                ? (isUr ? 'میرے ٹکٹ' : 'My Tickets')
                : isDistrictAdmin
                ? (isUr ? `${currentUser.assignedDistrict || currentUser.district || 'ضلع'} ڈیسک` : `${currentUser.assignedDistrict || currentUser.district || 'District'} Desk`)
                : isCoAdmin
                ? (isUr ? `${currentUser.assignedStateProvince || currentUser.stateProvince || 'صوبہ'} ڈیسک` : `${currentUser.assignedStateProvince || currentUser.stateProvince || 'State'} Desk`)
                : (isUr ? 'مرکزی ڈیسک' : 'Central Desk')}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <MessageSquareWarning className="w-6 h-6 text-[#F5D061]" />
            <span>{isUr ? 'شکایات اور معاونت مرکز' : 'Complaints & Support Center'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isMember 
              ? (isUr ? 'استفسارات درج کریں، ممبرشپ کارڈ کی ترسیل کا مسئلہ بتائیں یا فلاحی مدد کی درخواست کریں۔' : 'Submit inquiries, report membership card delivery issues, or request welfare support.')
              : (isUr ? 'اپنے دائرہ اختیار میں کمیونٹی اراکین کی جانب سے جمع کرائے گئے ٹکٹس کا جائزہ لیں اور حل کریں۔' : 'Review and resolve tickets submitted by community members in your jurisdiction.')}
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
          <span>{isUr ? 'نیا شکایت ٹکٹ درج کریں' : 'File New Grievance Ticket'}</span>
        </button>
      </div>

      {requiresProfileCompletion && (
        <ProfileCompletionGate compact featureName={isUr ? 'شکایات اور معاونت' : 'Complaints & Support'} />
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
            {isUr ? `تمام ٹکٹ (${visibleComplaints.length})` : `All Tickets (${visibleComplaints.length})`}
          </button>
          <button
            onClick={() => setActiveTab('OPEN')}
            className={`kc-pressable px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer tabular-nums ${
              activeTab === 'OPEN'
                ? 'kc-gold-button'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {isUr ? `کھلے (${visibleComplaints.filter(c => c.status === 'OPEN').length})` : `Open (${visibleComplaints.filter(c => c.status === 'OPEN').length})`}
          </button>
          <button
            onClick={() => setActiveTab('UNDER_REVIEW')}
            className={`kc-pressable px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer tabular-nums ${
              activeTab === 'UNDER_REVIEW'
                ? 'kc-gold-button'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {isUr ? `زیرِ غور (${visibleComplaints.filter(c => c.status === 'UNDER_REVIEW').length})` : `Under Review (${visibleComplaints.filter(c => c.status === 'UNDER_REVIEW').length})`}
          </button>
          <button
            onClick={() => setActiveTab('RESOLVED')}
            className={`kc-pressable px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer tabular-nums ${
              activeTab === 'RESOLVED'
                ? 'kc-gold-button'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {isUr ? `حل شدہ (${visibleComplaints.filter(c => c.status === 'RESOLVED').length})` : `Resolved (${visibleComplaints.filter(c => c.status === 'RESOLVED').length})`}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-44">
            <LuxurySelect
              compact
              value={filterCategory}
              onChange={setFilterCategory}
              label={isUr ? 'ٹکٹ کی قسم' : 'Ticket Category'}
              options={[
                { value: 'ALL', label: isUr ? 'تمام اقسام' : 'All Categories' },
                { value: 'Membership Card', label: isUr ? 'ممبرشپ کارڈ' : 'Membership Card' },
                { value: 'Receipt Inquiry', label: isUr ? 'رسید سے متعلق استفسار' : 'Receipt Inquiry' },
                { value: 'Fund Allocation', label: isUr ? 'فنڈ کی تقسیم' : 'Fund Allocation' },
                { value: 'Welfare Support', label: isUr ? 'فلاحی امداد' : 'Welfare Support' },
                { value: 'District Activity', label: isUr ? 'ضلعی سرگرمی' : 'District Activity' },
                { value: 'General', label: isUr ? 'عمومی' : 'General' }
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
                  label={isUr ? 'صوبہ' : 'Province'}
                  options={[
                    { value: 'ALL', label: isUr ? 'تمام صوبے' : 'All Provinces' },
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
                  label={isUr ? 'ضلع' : 'District'}
                  options={[
                    { value: 'ALL', label: isUr ? 'تمام اضلاع' : 'All Districts' },
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
            {isUr ? 'اس منظر میں کوئی شکایت موجود نہیں ہے۔' : 'No complaints found under this view.'}
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
                      <span>{isUr ? 'از:' : 'From:'} <strong className="text-slate-200">{cmp.userName}</strong></span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                        <MapPin className="w-3 h-3" />
                        {cDist}, {cProv}
                      </span>
                      {cTeh && <span>({isUr ? 'تحصیل:' : 'Tehsil:'} {cTeh}{cUC ? `, ${isUr ? 'یو سی:' : 'UC:'} ${cUC}` : ''})</span>}
                      <span>·</span>
                      <span>{isUr ? 'قسم:' : 'Category:'} <strong className="text-slate-200">{localizeCategory(cmp.category)}</strong></span>
                      <span>·</span>
                      <span>{isUr ? 'اہمیت:' : 'Priority:'} <strong className="text-[#F5D061]">{localizePriority(cmp.priority)}</strong></span>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase shrink-0 ${
                    cmp.status === 'RESOLVED'
                      ? 'bg-[#042920] text-emerald-300 border border-emerald-500/45'
                      : cmp.status === 'UNDER_REVIEW'
                      ? 'bg-amber-500/15 text-[#F5D061] border border-[#D4AF37]/45'
                      : 'bg-rose-950/80 text-rose-300 border border-rose-500/45'
                  }`}>
                    {localizeStatus(cmp.status)}
                  </span>
                </div>

                <p className="text-slate-200 leading-relaxed bg-[#090D16] p-3.5 rounded-xl border border-[#D4AF37]/20">
                  {cmp.description}
                </p>

                {cmp.responseNote && (
                  <div className="p-3.5 rounded-xl kc-emerald-panel text-xs">
                    <span className="font-bold text-[#F5D061]">
                      {isUr ? `سرکاری جواب (${cmp.assignedOfficerName}):` : `Official Response (${cmp.assignedOfficerName}):`}
                    </span>
                    <p className="text-slate-100 mt-1">
                      {cmp.responseNote}
                    </p>
                    {cmp.resolvedAt && (
                      <span className="block text-[10px] text-emerald-300/80 font-mono mt-1">
                        {isUr ? 'حل ہونے کا وقت:' : 'Resolved:'} {new Date(cmp.resolvedAt).toLocaleString()}
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
                      <span>{isUr ? 'ٹکٹ اپڈیٹ اور جواب دیں' : 'Update Ticket & Respond'}</span>
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
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#D4AF37]/25">
              <h3 className="text-base font-bold text-[#F5D061]">
                {isUr ? 'شکایت یا استفسار کا ٹکٹ درج کریں' : 'Submit Grievance or Inquiry Ticket'}
              </h3>

              {/* Speech Recognition Language Selector */}
              <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-[#090D16] border border-[#D4AF37]/30 text-[10px]">
                <span className="px-1.5 text-slate-400 font-semibold flex items-center gap-1">
                  <AudioLines className="w-3 h-3 text-[#F5D061]" />
                  <span>{isUr ? 'آواز:' : 'Voice:'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDictationLocale('en-US');
                    if (speech.isListening && dictationTarget) {
                      speech.startDictation('en-US');
                    }
                  }}
                  className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                    dictationLocale === 'en-US'
                      ? 'kc-gold-button'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDictationLocale('ur-PK');
                    if (speech.isListening && dictationTarget) {
                      speech.startDictation('ur-PK');
                    }
                  }}
                  className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                    dictationLocale === 'ur-PK'
                      ? 'kc-gold-button'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  اردو
                </button>
              </div>
            </div>

            {speech.error && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/45 text-rose-200 text-[11px] flex items-center justify-between gap-2">
                <span>{speech.error}</span>
                <button
                  type="button"
                  onClick={speech.clearError}
                  className="text-rose-200 hover:text-white font-bold px-1.5 cursor-pointer shrink-0"
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleNewTicketSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">
                    {isUr ? 'قسم' : 'Category'}
                  </label>
                  <LuxurySelect
                    compact
                    value={cmpCategory}
                    onChange={(val) => setCmpCategory(val as ComplaintCategory)}
                    label={isUr ? 'قسم' : 'Category'}
                    options={[
                      { value: 'Membership Card', label: isUr ? 'ممبرشپ کارڈ کی ترسیل' : 'Membership Card Delivery' },
                      { value: 'Receipt Inquiry', label: isUr ? 'رسید سے متعلق استفسار' : 'Receipt Inquiry' },
                      { value: 'Fund Allocation', label: isUr ? 'فنڈ کی تقسیم' : 'Fund Allocation' },
                      { value: 'Welfare Support', label: isUr ? 'فلاحی امداد' : 'Welfare Support' },
                      { value: 'District Activity', label: isUr ? 'ضلعی سرگرمی' : 'District Activity' },
                      { value: 'General', label: isUr ? 'عمومی استفسار' : 'General Inquiry' }
                    ]}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">
                    {isUr ? 'فوری اہمیت' : 'Urgency Priority'}
                  </label>
                  <LuxurySelect
                    compact
                    value={cmpPriority}
                    onChange={(val) => setCmpPriority(val as 'LOW' | 'MEDIUM' | 'HIGH')}
                    label={isUr ? 'فوری اہمیت' : 'Urgency Priority'}
                    options={[
                      { value: 'LOW', label: isUr ? 'کم' : 'Low' },
                      { value: 'MEDIUM', label: isUr ? 'درمیانی' : 'Medium' },
                      { value: 'HIGH', label: isUr ? 'فوری / ہائی' : 'High' }
                    ]}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="text-xs font-semibold text-slate-200">
                    {isUr ? 'موضوع' : 'Subject Line'}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleToggleFieldDictation('SUBJECT')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                      speech.isListening && dictationTarget === 'SUBJECT'
                        ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                        : 'bg-[#090D16] border-[#D4AF37]/35 text-[#F5D061] hover:bg-[#161F33]'
                    }`}
                    title={isUr ? 'موضوع بول کر لکھیں' : 'Dictate subject using microphone'}
                  >
                    {speech.isListening && dictationTarget === 'SUBJECT' ? (
                      <>
                        <Square className="w-2.5 h-2.5 fill-current" />
                        <span>{isUr ? 'روکیں' : 'Stop'}</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3 h-3" />
                        <span>{isUr ? 'بول کر لکھیں' : 'Dictate'}</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder={isUr ? 'اپنی درخواست کی بنیادی وجہ تحریر کریں...' : 'State the primary reason for your request...'}
                  value={cmpSubject}
                  onChange={(e) => setCmpSubject(e.target.value)}
                  className="kc-luxury-input w-full text-xs px-3 py-2.5 rounded-xl"
                />
                {speech.isListening && dictationTarget === 'SUBJECT' && (
                  <p className="mt-1 text-[11px] text-[#F5D061] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 kc-scenic-twinkle shrink-0" />
                    <span className="truncate">
                      {speech.interimTranscript
                        ? speech.interimTranscript
                        : (isUr ? 'سن رہے ہیں... اب بولیں' : `Listening (${dictationLocale})... speak now`)}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="text-xs font-semibold text-slate-200">
                    {isUr ? 'تفصیلی وضاحت' : 'Detailed Explanation'}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleToggleFieldDictation('DESCRIPTION')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                      speech.isListening && dictationTarget === 'DESCRIPTION'
                        ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                        : 'bg-[#090D16] border-[#D4AF37]/35 text-[#F5D061] hover:bg-[#161F33]'
                    }`}
                    title={isUr ? 'شکایت بول کر لکھیں' : 'Dictate detailed explanation using microphone'}
                  >
                    {speech.isListening && dictationTarget === 'DESCRIPTION' ? (
                      <>
                        <Square className="w-2.5 h-2.5 fill-current" />
                        <span>{isUr ? 'ڈکٹیشن روکیں' : 'Stop Dictation'}</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3 h-3" />
                        <span>{isUr ? 'وائس ڈکٹیشن' : 'Voice Dictation'}</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  required
                  rows={4}
                  placeholder={isUr ? 'براہ کرم مکمل تفصیلات لکھیں یا بول کر درج کریں...' : 'Please provide full details or dictate by voice...'}
                  value={cmpDescription}
                  onChange={(e) => setCmpDescription(e.target.value)}
                  className="kc-luxury-input w-full text-xs p-3 rounded-xl resize-none"
                />
                {speech.isListening && dictationTarget === 'DESCRIPTION' && (
                  <div className="mt-1.5 px-3 py-2 rounded-xl bg-[#042920] border border-[#D4AF37]/40 text-[11px] text-[#F5D061] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 kc-scenic-twinkle shrink-0" />
                      <span className="truncate">
                        {speech.interimTranscript
                          ? speech.interimTranscript
                          : (isUr ? 'سن رہے ہیں... اپنی شکایت بیان کریں' : `Listening (${dictationLocale})... speak your complaint`)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={stopComplaintDictation}
                      className="text-[10px] font-extrabold text-rose-300 hover:text-white shrink-0 cursor-pointer"
                    >
                      {isUr ? 'بند کریں' : 'Done'}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D4AF37]/20">
                <button
                  type="button"
                  onClick={() => {
                    stopComplaintDictation();
                    setIsSubmitModalOpen(false);
                  }}
                  className="kc-pressable px-3.5 py-2 text-xs text-slate-300 hover:text-white font-medium cursor-pointer"
                >
                  {isUr ? 'منسوخ کریں' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="kc-pressable kc-gold-button flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isUr ? 'ٹکٹ جمع کرائیں' : 'Submit Ticket'}</span>
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
                {isUr ? `جواب دیں: ${respondingTicket.subject}` : `Respond to: ${respondingTicket.subject}`}
              </h3>
              <p className="text-slate-400 mt-1">
                {isUr ? 'درخواست گزار:' : 'Filer:'} {respondingTicket.userName} ({respondingTicket.district || (isUr ? 'پاکستان' : 'Pakistan')})
              </p>
            </div>

            <div>
              <label className="font-semibold text-slate-200 block mb-1">
                {isUr ? 'حیثیت اپڈیٹ کریں' : 'Update Status'}
              </label>
              <LuxurySelect
                compact
                value={responseStatus}
                onChange={(val) => setResponseStatus(val as ComplaintStatus)}
                label={isUr ? 'حیثیت اپڈیٹ کریں' : 'Update Status'}
                options={[
                  { value: 'UNDER_REVIEW', label: isUr ? 'زیرِ غور رکھیں' : 'Keep Under Review' },
                  { value: 'RESOLVED', label: isUr ? 'حل شدہ قرار دیں' : 'Mark as Resolved' },
                  { value: 'DISMISSED', label: isUr ? 'ٹکٹ مسترد کریں' : 'Dismiss Ticket' }
                ]}
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="font-semibold text-slate-200">
                  {isUr ? 'سرکاری حل / جواب' : 'Official Resolution Response'}
                </label>
                <button
                  type="button"
                  onClick={() => handleToggleFieldDictation('RESPONSE')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    speech.isListening && dictationTarget === 'RESPONSE'
                      ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                      : 'bg-[#090D16] border-[#D4AF37]/35 text-[#F5D061] hover:bg-[#161F33]'
                  }`}
                  title={isUr ? 'جواب بول کر لکھیں' : 'Dictate official response'}
                >
                  {speech.isListening && dictationTarget === 'RESPONSE' ? (
                    <>
                      <Square className="w-2.5 h-2.5 fill-current" />
                      <span>{isUr ? 'روکیں' : 'Stop'}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3 h-3" />
                      <span>{isUr ? 'وائس ڈکٹیشن' : 'Dictate'}</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                rows={3}
                required
                value={responseRemarks}
                onChange={(e) => setResponseRemarks(e.target.value)}
                placeholder={isUr ? 'کی گئی کارروائی یا ترسیل کی تفصیل لکھیں...' : 'State the action taken or delivery details...'}
                className="kc-luxury-input w-full p-3 rounded-xl resize-none"
              />
              {speech.isListening && dictationTarget === 'RESPONSE' && (
                <p className="mt-1 text-[11px] text-[#F5D061] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 kc-scenic-twinkle shrink-0" />
                  <span className="truncate">
                    {speech.interimTranscript
                      ? speech.interimTranscript
                      : (isUr ? 'سن رہے ہیں... اب بولیں' : `Listening (${dictationLocale})... speak response`)}
                  </span>
                </p>
              )}
              {speech.error && (
                <p className="mt-1 text-[11px] text-rose-300">{speech.error}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D4AF37]/20">
              <button
                type="button"
                onClick={() => {
                  stopComplaintDictation();
                  setRespondingTicket(null);
                }}
                className="kc-pressable px-3.5 py-2 text-slate-300 hover:text-white font-medium cursor-pointer"
              >
                {isUr ? 'منسوخ کریں' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveResponse}
                className="kc-pressable kc-gold-button px-4 py-2 font-extrabold rounded-xl cursor-pointer"
              >
                {isUr ? 'محفوظ کریں اور ممبر کو مطلع کریں' : 'Save & Notify Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
