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
            {language === 'ur'
              ? <>ایڈمن: <strong className="text-white">{currentUser.name}</strong> · ممبر تصدیق، ادائیگیوں کا جائزہ اور مقامی کمیونٹی کی خدمت۔</>
              : <>Admin: <strong className="text-white">{currentUser.name}</strong> · Member verification, payment verification, & local community care.</>}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 kc-emerald-panel rounded-xl text-[11px] text-[#F5D061]">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span className="tabular-nums">
            {language === 'ur'
              ? `فی ضلع زیادہ سے زیادہ ${appSettings.maxAdminsPerDistrict} ڈسٹرکٹ ایڈمن کی حد فعال ہے۔`
              : `Max ${appSettings.maxAdminsPerDistrict} District Admins per District enforced.`}
          </span>
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
                className="p-3.5 rounded-2xl kc-obsidian-card hover:border-[#F5D061]/65 text-left transition-transform hover:-translate-y-0.5 kc-pressable cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl kc-emerald-panel flex items-center justify-center mb-2">
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
          <div className="p-4 kc-obsidian-card rounded-2xl">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {language === 'ur' ? 'ضلعی ممبران' : 'District Members'}
              </span>
              <Users className="w-4 h-4 text-[#F5D061]" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-mono tabular-nums">{districtMembers.length}</span>
              <span className="text-xs text-[#F5D061] font-semibold">{assignedDistrict}</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              {language === 'ur' ? 'فعال تصدیق شدہ کمیونٹی ممبران' : 'Active verified community members'}
            </div>
          </div>

          <div className="p-4 kc-obsidian-card rounded-2xl border-[#F5D061]/50">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {language === 'ur' ? 'زیر التواء تصدیق' : 'Pending Verification'}
              </span>
              <CheckSquare className="w-4 h-4 text-[#F5D061]" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-mono tabular-nums">{pendingDistrictApps.length}</span>
              <span className="text-xs text-[#F5D061] font-semibold">
                {language === 'ur' ? 'مرحلہ 1 قطار' : 'Stage 1 Queue'}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              {language === 'ur' ? 'پتہ اور شناختی کارڈ کی جانچ درکار ہے' : 'Requires address & CNIC check'}
            </div>
          </div>

          <div className="p-4 kc-obsidian-card rounded-2xl">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {language === 'ur' ? 'ضلعی شکایات' : 'District Grievances'}
              </span>
              <MessageSquareWarning className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-mono tabular-nums">{districtComplaints.length}</span>
              <span className="text-xs text-rose-400 font-semibold tabular-nums">
                {districtComplaints.filter(c => c.status === 'OPEN').length} {language === 'ur' ? 'جاری' : 'Open'}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              {language === 'ur' ? 'ممبران کے سپورٹ ٹکٹس' : 'Member support tickets'}
            </div>
          </div>

          <div className="p-4 kc-obsidian-card rounded-2xl">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {language === 'ur' ? 'مقامی اعلانات' : 'Local Bulletins'}
              </span>
              <Megaphone className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-mono tabular-nums">{districtAnnouncements.length}</span>
              <span className="text-xs text-emerald-400 font-semibold">
                {language === 'ur' ? 'شائع شدہ' : 'Published'}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              {language === 'ur' ? `${assignedDistrict} کو بھیجے گئے` : `Dispatched to ${assignedDistrict}`}
            </div>
          </div>
        </div>
      )}

      {/* Stage 1 District Verification */}
      <div className="kc-obsidian-card rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D4AF37]/20">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#F5D061]" />
              <span>
                {language === 'ur'
                  ? 'مرحلہ 1: ضلعی تصدیق اور سپر ایڈمن کو سفارش'
                  : 'Stage 1: District Verification & Recommendation to Super Admin'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'ur'
                ? 'درخواست گزار کا پتہ، شناختی کارڈ چیک کریں اور سفارش جمع کروائیں'
                : 'Confirm applicant address, inspect CNIC validity, and submit recommendation'}
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums font-bold text-[#F5D061] bg-[#090D16] px-2.5 py-1 rounded-full border border-[#D4AF37]/35">
            {language === 'ur' ? `${pendingDistrictApps.length} قطار میں` : `${pendingDistrictApps.length} in Queue`}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {pendingDistrictApps.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              {language === 'ur'
                ? `${assignedDistrict} کے لیے کوئی زیر التواء درخواست موجود نہیں ہے۔`
                : `No pending applications awaiting District verification for ${assignedDistrict}.`}
            </div>
          ) : (
            pendingDistrictApps.map(app => (
              <div key={app.id} className="p-4 rounded-xl border border-[#D4AF37]/25 bg-[#090D16]">
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
                      <p><span className="text-slate-500">{language === 'ur' ? 'شناختی کارڈ:' : 'CNIC:'}</span> <span className="font-mono">{app.cnic}</span></p>
                      <p><span className="text-slate-500">{language === 'ur' ? 'فون:' : 'Phone:'}</span> {app.phone}</p>
                      <p><span className="text-slate-500">{language === 'ur' ? 'ای میل:' : 'Email:'}</span> {app.email}</p>
                      <p><span className="text-slate-500">{language === 'ur' ? 'پتہ:' : 'Address:'}</span> {app.address}</p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {reviewingAppId === app.id ? (
                      <div className="w-full sm:w-80 kc-obsidian-card p-3.5 rounded-xl space-y-2.5">
                        <span className="text-[11px] font-semibold text-slate-200 block">
                          {language === 'ur' ? 'سپر ایڈمن کو سفارش جمع کروائیں:' : 'Submit Recommendation to Super Admin:'}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setRecommendation('APPROVE')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1 kc-pressable cursor-pointer ${
                              recommendation === 'APPROVE'
                                ? 'bg-emerald-700 text-white border-emerald-500'
                                : 'bg-[#090D16] text-slate-300 border-[#D4AF37]/25'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{language === 'ur' ? 'سفارش کریں' : 'Recommend'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRecommendation('REJECT')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1 kc-pressable cursor-pointer ${
                              recommendation === 'REJECT'
                                ? 'bg-rose-700 text-white border-rose-500'
                                : 'bg-[#090D16] text-slate-300 border-[#D4AF37]/25'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{translate(language, 'reject')}</span>
                          </button>
                        </div>

                        <textarea
                          placeholder={language === 'ur' ? 'ضلعی تصدیق کے ریمارکس...' : 'District verification remarks...'}
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          rows={2}
                          className="w-full text-xs p-2 rounded-lg kc-luxury-input resize-none"
                        />

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button type="button" onClick={() => setReviewingAppId(null)} className="px-2.5 py-1 text-xs text-slate-400 hover:text-white cursor-pointer">
                            {translate(language, 'cancel')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSubmitRecommendation(app.id)}
                            className="px-3 py-1.5 kc-gold-button text-xs font-extrabold rounded-lg cursor-pointer"
                          >
                            {language === 'ur' ? 'سپر ایڈمن کو بھیجیں' : 'Send to Super Admin'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setReviewingAppId(app.id);
                          setRecommendation('APPROVE');
                          setRemarks(
                            language === 'ur'
                              ? 'ضلعی دستاویزات اور رہائش کی تصدیق مکمل ہو گئی۔ ممبرشپ کی سفارش کی جاتی ہے۔'
                              : 'District documents & residence verified. Recommended for membership.'
                          );
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 kc-gold-button text-xs font-extrabold rounded-xl cursor-pointer"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>{language === 'ur' ? 'تصدیق اور سفارش کریں' : 'Verify & Recommend'}</span>
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
        <div className="kc-obsidian-card rounded-2xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/20">
            <div>
              <h3 className="text-sm font-bold text-white">
                {language === 'ur' ? `${assignedDistrict} کے کمیونٹی ممبران` : `${assignedDistrict} Community Members`}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'ur' ? 'آپ کے ضلع میں رجسٹرڈ ممبران' : 'Registered members in your district'}
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums font-semibold text-[#F5D061]">
              {districtMembers.length} {language === 'ur' ? 'ممبران' : 'Members'}
            </span>
          </div>

          <div className="mt-3 divide-y divide-[#D4AF37]/10 max-h-80 overflow-y-auto">
            {districtMembers.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {language === 'ur' ? `${assignedDistrict} میں ابھی کوئی فعال ممبر نہیں ہے۔` : `No active members in ${assignedDistrict} yet.`}
              </div>
            ) : (
              districtMembers.map(member => (
                <div key={member.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    {(member.avatarUrl || member.avatar) ? (
                      <img src={member.avatarUrl || member.avatar} alt={member.name} className="w-8 h-8 rounded-full border border-[#D4AF37]/40 object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#042920] text-[#F5D061] border border-[#D4AF37]/40 flex items-center justify-center font-bold text-xs shrink-0">
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
                      className="p-1.5 text-slate-300 hover:text-[#F5D061] hover:bg-[#1A233A] rounded-lg kc-pressable cursor-pointer"
                      title="View Member Profile"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenChat(member)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-[#042920] text-[#F5D061] hover:bg-[#063B2E] rounded-lg border border-[#D4AF37]/40 kc-pressable cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>{translate(language, 'mobileNavChat')}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="kc-obsidian-card rounded-2xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/20">
            <div>
              <h3 className="text-sm font-bold text-white">
                {language === 'ur' ? 'ضلعی شکایات ٹکٹس' : 'District Grievance Tickets'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'ur' ? `${assignedDistrict} سے موصولہ درخواستیں` : `Support requests from ${assignedDistrict}`}
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-rose-400 font-bold">
              {districtComplaints.length} {language === 'ur' ? 'ٹکٹس' : 'Tickets'}
            </span>
          </div>

          <div className="mt-3 space-y-3 max-h-80 overflow-y-auto">
            {districtComplaints.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {language === 'ur' ? `${assignedDistrict} میں کوئی فعال شکایت درج نہیں۔` : `No active complaints filed in ${assignedDistrict}.`}
              </div>
            ) : (
              districtComplaints.map(cmp => (
                <div key={cmp.id} className="p-3 rounded-xl border border-[#D4AF37]/25 bg-[#090D16] text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-white">{cmp.subject}</span>
                      <p className="text-[11px] text-slate-400">
                        {language === 'ur' ? `از ${cmp.userName}` : `From ${cmp.userName}`} · {cmp.category}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      cmp.status === 'RESOLVED'
                        ? 'bg-[#042920] text-emerald-300 border border-emerald-500/35'
                        : 'bg-rose-950/70 text-rose-300 border border-rose-500/35'
                    }`}>
                      {cmp.status === 'RESOLVED' ? translate(language, 'resolvedLabel') : translate(language, 'openLabel')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1.5">{cmp.description}</p>
                  {cmp.status !== 'RESOLVED' && (
                    <div className="mt-2 pt-2 border-t border-[#D4AF37]/15">
                      {activeComplaintId === cmp.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder={language === 'ur' ? 'حل کا نوٹ درج کریں...' : 'Resolution notes...'}
                            value={complaintNote}
                            onChange={(e) => setComplaintNote(e.target.value)}
                            className="w-full text-xs p-2 kc-luxury-input rounded-lg"
                          />
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setActiveComplaintId(null)} className="text-[11px] text-slate-400 hover:text-white cursor-pointer">
                              {translate(language, 'cancel')}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                updateComplaintStatus(cmp.id, 'RESOLVED', complaintNote);
                                setActiveComplaintId(null);
                                setComplaintNote('');
                              }}
                              className="px-2.5 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-semibold kc-pressable cursor-pointer"
                            >
                              {language === 'ur' ? 'حل شدہ نشان زد کریں' : 'Mark Resolved'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setActiveComplaintId(cmp.id)} className="text-[11px] text-[#F5D061] hover:underline font-medium cursor-pointer">
                          {language === 'ur' ? 'جواب دیں اور حل کریں →' : 'Respond & Mark Resolved →'}
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
      <div className="p-5 kc-obsidian-card rounded-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/20">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#F5D061]" />
              <span>{language === 'ur' ? 'ضلعی کمیونٹی اعلانات پینل' : 'District Community Announcement Dispatcher'}</span>
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'ur'
                ? `${assignedDistrict} کے ممبران کے لیے مقامی اعلانات، کیمپس اور پیغامات شائع کریں`
                : `Publish local notices, camps, or community alerts targeted to ${assignedDistrict} members`}
            </p>
          </div>
          {!isCreatingAnnouncement && (
            <button
              type="button"
              onClick={() => setIsCreatingAnnouncement(true)}
              className="px-3.5 py-1.5 kc-gold-button text-xs font-extrabold rounded-xl cursor-pointer"
            >
              {language === 'ur' ? 'ضلعی اعلان شائع کریں' : 'Post District Notice'}
            </button>
          )}
        </div>

        {isCreatingAnnouncement && (
          <form onSubmit={handleCreateAnnouncement} className="mt-4 space-y-3 bg-[#090D16] p-4 rounded-xl border border-[#D4AF37]/25">
            <input
              type="text"
              required
              placeholder={language === 'ur' ? 'مثلاً: ماڈل ٹاؤن میں مفت میڈیکل کیمپ...' : 'e.g. Free Medical Checkup Camp at Model Town...'}
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl kc-luxury-input"
            />
            <textarea
              required
              rows={3}
              placeholder={language === 'ur' ? 'ضلعی ممبران کے لیے تفصیلی ہدایات...' : 'Detailed instructions for district members...'}
              value={announcementContent}
              onChange={(e) => setAnnouncementContent(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl kc-luxury-input resize-none"
            />
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 text-slate-300">
                  <input type="radio" name="urgency" checked={announcementUrgency === 'NORMAL'} onChange={() => setAnnouncementUrgency('NORMAL')} />
                  <span>{language === 'ur' ? 'معمول' : 'Normal'}</span>
                </label>
                <label className="flex items-center gap-1.5 text-rose-400 font-semibold">
                  <input type="radio" name="urgency" checked={announcementUrgency === 'URGENT'} onChange={() => setAnnouncementUrgency('URGENT')} />
                  <span>{translate(language, 'urgentBadge')}</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setIsCreatingAnnouncement(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer">
                  {translate(language, 'cancel')}
                </button>
                <button type="submit" className="flex items-center gap-1.5 px-4 py-1.5 kc-gold-button text-xs font-extrabold rounded-xl cursor-pointer">
                  <Send className="w-3.5 h-3.5" />
                  <span>{language === 'ur' ? `${assignedDistrict} میں شائع کریں` : `Broadcast to ${assignedDistrict}`}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
