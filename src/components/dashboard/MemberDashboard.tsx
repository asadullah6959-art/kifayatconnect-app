import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Coins,
  Receipt,
  Megaphone,
  ShieldCheck,
  Plus,
  Printer,
  CheckCircle2,
  Clock,
  IdCard,
  Send,
  XCircle,
  MessageSquare,
  MessageSquareWarning,
  Users,
  FileCheck2,
  HelpCircle,
  X
} from 'lucide-react';
import { ComplaintCategory } from '../../types';
import { mapLegacyRegionToHierarchy } from '../../data/locationData';
import { BrandEmblem3D } from '../common/BrandEmblem3D';
import { RoleBadge } from '../common/RoleBadge';
import { TabbarBadge, FaizKhelVipCrownIcon } from '../common/TabbarBadge';
import { LuxurySelect } from '../common/LuxurySelect';
import { ProfileCompletionGate, needsProfileCompletion } from '../common/ProfileCompletionGate';
import { isFaizKhelUser } from '../../utils/dastoor';
import { normalizeCnicDigits } from '../../utils/cnic';
import { resolveReceiptFundTierLabel } from '../../utils/receiptExport';
import { translate } from '../../data/translations';

export const MemberDashboard: React.FC = () => {
  const {
    currentUser,
    applications,
    payments,
    complaints,
    announcements,
    appSettings,
    submitComplaint,
    setSelectedReceipt,
    setSelectedCardUser,
    setActiveTab,
    openCompleteProfileModal,
    openRukniyatForm,
    openTutorial,
    language
  } = useApp();
  const requiresProfileCompletion = needsProfileCompletion(currentUser);

  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [cmpCategory, setCmpCategory] = useState<ComplaintCategory>('Membership Card');
  const [cmpSubject, setCmpSubject] = useState('');
  const [cmpDescription, setCmpDescription] = useState('');
  const [cmpPriority, setCmpPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  if (!currentUser) return null;

  const vis = appSettings.dashboardVisibility || {
    showKpiGrid: true,
    showQuickActions: true,
    showApkSyncBanner: true,
    showDistrictMatrix: true,
    showOfficeBearersWidget: true,
    showAnnouncementsFeed: true
  };
  const allowPayments = appSettings.featureToggles?.allowMemberPayments !== false;
  const allowComplaints = appSettings.featureToggles?.allowComplaintsDesk !== false;

  const memLoc = mapLegacyRegionToHierarchy(currentUser.region);
  const memberDistrict = currentUser.district || memLoc.district;
  const memberProvince = currentUser.stateProvince || memLoc.stateProvince;
  const memberTehsil = currentUser.tehsil || memLoc.tehsil;

  const currentMonthLabel = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });
  const currentMonthShort = new Date().toLocaleString('en-US', { month: 'short' });

  const ownPayments = payments.filter(p => p.userId === currentUser.id);
  const ownComplaints = complaints.filter(c => c.userId === currentUser.id);
  const relevantAnnouncements = announcements.filter(
    a =>
      a.announcementType === 'OFFICIAL_APP' ||
      a.targetScope === 'ALL' ||
      a.targetRegion === 'ALL_REGIONS' ||
      (a.targetScope === 'PROVINCE' && a.targetStateProvince === memberProvince) ||
      a.targetDistrict === memberDistrict ||
      a.targetRegion === currentUser.region
  );

  const totalVerifiedContributed = ownPayments
    .filter(p => p.status === 'VERIFIED')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pendingPayments = ownPayments.filter(p => p.status === 'PENDING_VERIFICATION');

  const currentUserCnicDigits = normalizeCnicDigits(currentUser.cnic);
  const ownRukniyatApp = applications.find(
    a =>
      (a.email && currentUser.email && a.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      (currentUserCnicDigits.length === 13 && normalizeCnicDigits(a.cnic) === currentUserCnicDigits) ||
      (currentUser.membershipId && a.generatedMembershipId === currentUser.membershipId)
  );

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmpSubject.trim() || !cmpDescription.trim()) return;

    submitComplaint({
      category: cmpCategory,
      subject: cmpSubject.trim(),
      description: cmpDescription.trim(),
      priority: cmpPriority
    });

    setIsComplaintModalOpen(false);
    setCmpSubject('');
    setCmpDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E4E2]/25">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#E5E4E2] uppercase tracking-wider">
              {language === 'ur' ? 'ذاتی ممبرشپ پورٹل' : 'Member Self-Service'}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-400">{memberDistrict}, {memberProvince}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            {language === 'ur' ? `خوش آمدید، ${currentUser.name}` : `Welcome back, ${currentUser.name}`}
          </h1>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span className="text-xs text-slate-400">
              ID: <strong className="font-mono text-[#E5E4E2]">{currentUser.membershipId || 'KC-PENDING'}</strong>
            </span>
            <RoleBadge
              role={currentUser.role}
              isFounder={currentUser.isFounder}
              isAuditOfficer={Boolean(currentUser.isAuditOfficer)}
              compact
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => openTutorial()}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0D2A1F] hover:bg-[#1E293B] border border-[#059669]/45 text-[#059669] text-xs font-bold rounded-xl kc-pressable cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{language === 'ur' ? 'ایپ گائیڈ' : 'App Guide'}</span>
          </button>

          <button
            type="button"
            onClick={() => openRukniyatForm(ownRukniyatApp || null)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#022C22] hover:bg-[#064E3B] border border-[#E5E4E2]/60 text-[#E5E4E2] text-xs font-extrabold rounded-xl kc-pressable cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4 text-[#CBD5E1]" />
            <span>{language === 'ur' ? 'رکنیت فارم (Rukniyat Form)' : 'Rukniyat Form (رکنیت فارم)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCardUser(currentUser)}
            className="flex items-center gap-1.5 px-3.5 py-2 kc-obsidian-card hover:border-[#E5E4E2]/70 text-white text-xs font-bold rounded-xl kc-pressable cursor-pointer"
          >
            <IdCard className="w-4 h-4 text-[#E5E4E2]" />
            <span>{translate(language, 'viewDigitalId')}</span>
          </button>

          {allowPayments && (
            <button
              type="button"
              onClick={() => {
                if (requiresProfileCompletion) {
                  openCompleteProfileModal();
                } else {
                  setActiveTab('funds');
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 kc-gold-button text-xs font-extrabold rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{translate(language, 'navFunds')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Rukniyat Form Status Banner / Quick Entry */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#022C22]/85 via-[#0F172A] to-[#0D2A1F] border border-[#E5E4E2]/45 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#071812] border border-[#E5E4E2]/60 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-5 h-5 text-[#CBD5E1]" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-extrabold text-[#E5E4E2]">
                {language === 'ur'
                  ? 'رکنیت فارم (سوئی خیل اتحاد)'
                  : 'Official Rukniyat Form (رکنیت فارم)'}
              </h3>
              {ownRukniyatApp?.serialNumber && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#071812] border border-[#E5E4E2]/50 text-[#CBD5E1]">
                  {ownRukniyatApp.serialNumber}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300">
              {ownRukniyatApp
                ? ownRukniyatApp.status === 'ACTIVE'
                  ? (language === 'ur'
                      ? 'مبارک ہو! آپ کا رکنیت فارم مہر اور دستخط کے ساتھ منظور ہو چکا ہے۔'
                      : 'Approved & Verified with Official Mohar Stamp.')
                  : (language === 'ur'
                      ? 'آپ کا رکنیت فارم جمع ہو چکا ہے اور ایڈمن منظوری کے لیے زیرِ التواء ہے۔'
                      : 'Submitted · Pending Admin Approval.')
                : (language === 'ur'
                    ? '13 ہندسوں کے شناختی کارڈ اور عہد نامہ کے ساتھ اپنا دو لسانی رکنیت فارم مکمل کریں۔'
                    : 'Submit your bilingual Rukniyat Form with mandatory 13-digit CNIC & oath signature.')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openRukniyatForm(ownRukniyatApp || null)}
          className="kc-pressable kc-gold-button px-4 py-2 rounded-xl text-xs font-extrabold shrink-0 cursor-pointer self-start sm:self-center"
        >
          {ownRukniyatApp
            ? (language === 'ur' ? 'فارم و مہر دیکھیں' : 'View Form & Mohar')
            : (language === 'ur' ? 'رکنیت فارم پُر کریں' : 'Fill Rukniyat Form')}
        </button>
      </div>

      {requiresProfileCompletion && (
        <ProfileCompletionGate featureName={language === 'ur' ? 'ادائیگی، لائیو چیٹ اور شکایات' : 'payments, Live Chat & complaints'} />
      )}

      {/* Quick Action Cards */}
      {vis.showQuickActions && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {allowPayments && (
            <button
              type="button"
              onClick={() => {
                if (requiresProfileCompletion) {
                  openCompleteProfileModal();
                } else {
                  setActiveTab('funds');
                }
              }}
              className="p-3.5 rounded-2xl kc-emerald-panel hover:border-[#E5E4E2]/75 text-left transition-transform hover:-translate-y-0.5 kc-pressable kc-gold-touch cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-[#071812] border border-[#E5E4E2]/40 flex items-center justify-center mb-2">
                <Coins className="w-4 h-4 text-[#E5E4E2]" />
              </div>
              <span className="text-xs font-extrabold text-white block truncate">{translate(language, 'navFunds')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSelectedCardUser(currentUser)}
            className="p-3.5 rounded-2xl kc-obsidian-card hover:border-[#E5E4E2]/65 text-left transition-transform hover:-translate-y-0.5 kc-pressable kc-gold-touch cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#071812] border border-[#E5E4E2]/30 flex items-center justify-center mb-2">
              <IdCard className="w-4 h-4 text-[#E5E4E2]" />
            </div>
            <span className="text-xs font-extrabold text-white block truncate">{translate(language, 'actionDigitalId')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className="p-3.5 rounded-2xl kc-obsidian-card hover:border-[#E5E4E2]/65 text-left transition-transform hover:-translate-y-0.5 kc-pressable kc-gold-touch cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#071812] border border-[#E5E4E2]/30 flex items-center justify-center mb-2">
              <Users className="w-4 h-4 text-[#E5E4E2]" />
            </div>
            <span className="text-xs font-extrabold text-white block truncate">{translate(language, 'navMembers')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className="p-3.5 rounded-2xl kc-obsidian-card hover:border-[#E5E4E2]/65 text-left transition-transform hover:-translate-y-0.5 kc-pressable kc-gold-touch cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#071812] border border-emerald-500/35 flex items-center justify-center mb-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs font-extrabold text-white block truncate">{translate(language, 'actionOpenChat')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            className="p-3.5 rounded-2xl kc-obsidian-card hover:border-[#E5E4E2]/65 text-left transition-transform hover:-translate-y-0.5 kc-pressable kc-gold-touch cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#071812] border border-[#E5E4E2]/30 flex items-center justify-center mb-2">
              <Megaphone className="w-4 h-4 text-[#E5E4E2]" />
            </div>
            <span className="text-xs font-extrabold text-white block truncate">{translate(language, 'actionAnnouncements')}</span>
          </button>

          {allowComplaints && (
            <button
              type="button"
              onClick={() => {
                if (requiresProfileCompletion) {
                  openCompleteProfileModal();
                } else {
                  setIsComplaintModalOpen(true);
                }
              }}
              className="p-3.5 rounded-2xl kc-obsidian-card hover:border-[#E5E4E2]/65 text-left transition-transform hover:-translate-y-0.5 kc-pressable kc-gold-touch cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-[#071812] border border-rose-500/35 flex items-center justify-center mb-2">
                <MessageSquareWarning className="w-4 h-4 text-rose-400" />
              </div>
              <span className="text-xs font-extrabold text-white block truncate">{translate(language, 'actionComplaints')}</span>
            </button>
          )}
        </div>
      )}

      {/* Hero Split: Fintech Slate / Faiz Khel Royal Imperial Gold VIP Card Preview + KPI Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div
          onClick={() => setSelectedCardUser(currentUser)}
          className={`lg:col-span-5 rounded-2xl p-5 text-[#F8FAFC] shadow-xl cursor-pointer transition-colors flex flex-col justify-between relative overflow-hidden kc-glass-bevel kc-gold-touch ${
            isFaizKhelUser(currentUser)
              ? 'border-[1.5px] border-[#CBD5E1] shadow-[0_12px_32px_rgba(212,175,55,0.28)]'
              : 'hover:border-[#E5E4E2]/75'
          }`}
          style={{
            background: isFaizKhelUser(currentUser)
              ? 'linear-gradient(135deg, #2B1F06 0%, #42300A 52%, #1C1404 100%)'
              : 'linear-gradient(145deg, #0D2A1F 0%, #1E293B 55%, #071812 100%)'
          }}
        >
          {/* Holographic Gold Foil Light Shimmer */}
          <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1/2 kc-vip-foil-shimmer z-0" />

          {/* Embossed "SUI KHEL ITTEHAD UNITY" Circular Vector Crest Watermark */}
          <svg
            aria-hidden="true"
            viewBox="0 0 180 180"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-32 h-32 opacity-[0.075] pointer-events-none z-0"
          >
            <defs>
              <path id="kcDashCrestPath" d="M 90, 90 m -66, 0 a 66,66 0 1,1 132,0 a 66,66 0 1,1 -132,0" />
            </defs>
            <circle cx="90" cy="90" r="82" fill="none" stroke="#F9E29C" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx="90" cy="90" r="52" fill="none" stroke="#E5E4E2" strokeWidth="1.5" />
            <text fill="#F9E29C" fontSize="10.5" fontWeight="800" letterSpacing="3.4">
              <textPath href="#kcDashCrestPath" startOffset="4%">
                ★ SUI KHEL ITTEHAD UNITY ★ OFFICIAL VIP
              </textPath>
            </text>
            <text x="90" y="96" textAnchor="middle" fill="#E5E4E2" fontSize="18" fontWeight="900">
              KC
            </text>
          </svg>

          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <BrandEmblem3D size="xs" halo />
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider kc-gold-gradient-text">
                  SUI KHEL ITTEHAD 👑
                </h4>
                <p className="text-[10px] text-[#059669] font-semibold">{translate(language, 'vipPremiumMember')}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {isFaizKhelUser(currentUser) && <FaizKhelVipCrownIcon className="w-6 h-6" />}
              <span className="text-[10px] font-mono font-bold text-[#059669] bg-[#071812] px-2 py-0.5 rounded-md border border-[#059669]/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 kc-live-pulse" />
                <ShieldCheck className="w-3 h-3 text-[#E5E4E2]" />
                <span>{translate(language, 'activeLabel')}</span>
              </span>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3.5 my-4">
            {(currentUser.avatarUrl || currentUser.avatar) ? (
              <img
                src={currentUser.avatarUrl || currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 rounded-xl object-cover border-2 border-[#E5E4E2] shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-[#0F172A] border-2 border-[#E5E4E2] flex items-center justify-center text-[#E5E4E2] font-extrabold text-lg shadow-md shrink-0">
                {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 space-y-1">
              <h3 className={`font-extrabold text-base truncate ${isFaizKhelUser(currentUser) ? 'text-[#E5E4E2]' : 'text-[#F8FAFC]'}`}>
                {currentUser.name}
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-[11px] font-mono tabular-nums text-[#E5E4E2]">{currentUser.membershipId || 'KC-PENDING'}</p>
                <TabbarBadge user={currentUser} language={language} compact />
              </div>
              <p className="text-[10px] text-[#94A3B8] truncate">
                {memberDistrict}, {memberProvince}{memberTehsil ? ` · ${memberTehsil}` : ''}
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-2 border-t border-slate-400/20 flex items-center justify-between text-[10px] text-[#94A3B8]">
            <div>
              <span>{language === 'ur' ? 'میعاد:' : 'VALID THRU:'} </span>
              <span className="font-mono tabular-nums text-[#E5E4E2] font-bold">{currentUser.validUntil || '2028-12-31'}</span>
            </div>
            <span className="text-[#059669] font-semibold">
              {language === 'ur' ? 'وی آئی پی کارڈ اور QR دیکھیں →' : 'Tap for VIP Card & QR →'}
            </span>
          </div>
        </div>

        {vis.showKpiGrid && (
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 kc-obsidian-card kc-gold-touch rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {language === 'ur' ? 'کل جمع شدہ فنڈ' : 'Total Contributed'}
                  </span>
                  <Coins className="w-4 h-4 text-[#E5E4E2]" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    PKR {totalVerifiedContributed.toLocaleString()}
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold">{translate(language, 'verifiedLabel')}</span>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 border-t border-[#E5E4E2]/15 pt-2 flex items-center justify-between">
                <span className="tabular-nums">
                  {language === 'ur'
                    ? `${ownPayments.filter(p => p.status === 'VERIFIED').length} تصدیق شدہ ادائیگیاں`
                    : `${ownPayments.filter(p => p.status === 'VERIFIED').length} Cleared Transactions`}
                </span>
                <span className="text-emerald-400 font-semibold">{language === 'ur' ? 'آڈٹ شدہ' : 'Audited'}</span>
              </div>
            </div>

            <div className="p-4 kc-obsidian-card rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {language === 'ur' ? 'ماہانہ تعاون' : 'Monthly Pledge'}
                  </span>
                  <Receipt className="w-4 h-4 text-blue-400" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    PKR {currentUser.monthlyPledge.toLocaleString()}
                  </span>
                  <span className="text-xs text-blue-400 font-semibold">{language === 'ur' ? 'ماہانہ' : 'Recurring'}</span>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 border-t border-[#E5E4E2]/15 pt-2 flex items-center justify-between">
                <span>{language === 'ur' ? `دورانیہ (${currentMonthLabel})` : `Cycle (${currentMonthLabel})`}</span>
                <span className="text-blue-400 font-semibold">{translate(language, 'activeLabel')}</span>
              </div>
            </div>

            <div className="p-4 kc-obsidian-card rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {language === 'ur' ? 'سالانہ ویلفیئر عہد' : 'Annual Welfare Pledge'}
                  </span>
                  <Coins className="w-4 h-4 text-purple-400" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    PKR {currentUser.annualPledge.toLocaleString()}
                  </span>
                  <span className="text-xs text-purple-400 font-semibold">{language === 'ur' ? 'سالانہ' : 'Annual'}</span>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 border-t border-[#E5E4E2]/15 pt-2 flex items-center justify-between">
                <span>{language === 'ur' ? 'تعلیم اور صحت' : 'Education & Healthcare'}</span>
                <span className="text-purple-400 font-semibold">{currentMonthShort}</span>
              </div>
            </div>

            <div className="p-4 kc-obsidian-card rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {language === 'ur' ? 'تصدیق کی حیثیت' : 'Verification Status'}
                  </span>
                  <Clock className="w-4 h-4 text-[#E5E4E2]" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    {pendingPayments.length} {translate(language, 'pendingLabel')}
                  </span>
                  <span className="text-xs text-[#E5E4E2] font-semibold">
                    {language === 'ur' ? 'زیر جائزہ' : 'In Review'}
                  </span>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 border-t border-[#E5E4E2]/15 pt-2">
                {pendingPayments.length > 0
                  ? (language === 'ur' ? 'ایڈمن / قیادت آپ کی رسید کی تصدیق کر رہی ہے۔' : 'Admin / Leadership is cross-verifying transaction slip.')
                  : (language === 'ur' ? 'آپ کی تمام ادائیگیاں تصدیق ہو چکی ہیں!' : 'All submitted payments have been verified!')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Member Payment History */}
      <div className="kc-obsidian-card rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E4E2]/20">
          <div>
            <h3 className="text-sm font-bold text-white">
              {language === 'ur' ? 'میری ادائیگیوں کا ریکارڈ اور مصدقہ رسیدیں' : 'My Payment Records & Certified Receipts'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'ur' ? 'سوئی خیل اتحاد پرائیویسی قوانین کے تحت صرف آپ کی ذاتی ادائیگیاں دکھائی جاتی ہیں' : 'Only your private transactions are shown under SUI KHEL ITTEHAD privacy rules'}
            </p>
          </div>

          {allowPayments && (
            <button
              type="button"
              onClick={() => setActiveTab('funds')}
              className="flex items-center gap-1.5 px-3.5 py-2 kc-gold-button text-xs font-extrabold rounded-xl cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{translate(language, 'navFunds')}</span>
            </button>
          )}
        </div>

        <div className="mt-3 space-y-2.5">
          {ownPayments.length === 0 ? (
            <div className="py-8 px-4 text-center text-xs text-slate-400 rounded-xl border border-[#E5E4E2]/20 bg-[#071812]">
              {language === 'ur'
                ? 'ابھی کوئی ادائیگی جمع نہیں کروائی گئی۔ ادائیگی کے لیے "فنڈز اور ادائیگیاں" کھولیں۔'
                : 'No contributions submitted yet. Open "Funds & Payments" to submit your contribution.'}
            </div>
          ) : (
            ownPayments.map(tx => (
              <div
                key={tx.id}
                className="p-3.5 rounded-xl border border-[#E5E4E2]/25 bg-[#071812] space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-[#E5E4E2] block truncate">
                      {tx.serialNumber || tx.receiptNumber}
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-slate-400 block mt-0.5">
                      {tx.date} · {tx.paymentMethod}
                    </span>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-semibold shrink-0 ${
                    tx.status === 'VERIFIED'
                      ? 'bg-[#0D2A1F] text-[#059669] border border-[#059669]/40'
                      : tx.status === 'REJECTED'
                      ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                      : 'bg-[#071812] text-[#E5E4E2] border border-[#E5E4E2]/40'
                  }`}>
                    {tx.status === 'VERIFIED' ? <CheckCircle2 className="w-3 h-3" /> : tx.status === 'REJECTED' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    <span>
                      {tx.status === 'VERIFIED'
                        ? (language === 'ur' ? 'منظور شدہ ✓' : 'Approved ✓')
                        : tx.status === 'REJECTED'
                        ? translate(language, 'rejectedLabel')
                        : (language === 'ur' ? 'زیرِ جائزہ' : 'Under Review')}
                    </span>
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#E5E4E2]/15">
                  <div className="min-w-0">
                    <span className="text-emerald-300 font-semibold block truncate">
                      {language === 'ur' ? resolveReceiptFundTierLabel(tx).ur : resolveReceiptFundTierLabel(tx).en}
                    </span>
                    {(tx.periodLabelUr || tx.periodLabelEn) && (
                      <span className="text-[10px] text-[#E5E4E2] font-semibold block truncate">
                        {language === 'ur' ? tx.periodLabelUr || tx.periodLabelEn : tx.periodLabelEn || tx.periodLabelUr}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-400 block truncate">
                      {language === 'ur' ? 'حوالہ:' : 'Ref:'} {tx.referenceNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono tabular-nums font-extrabold text-sm text-white">
                      PKR {tx.amount.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedReceipt(tx)}
                      className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-[#0D2A1F] hover:bg-[#1A233A] text-[#E5E4E2] border border-[#E5E4E2]/35 rounded-xl font-semibold kc-pressable cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{language === 'ur' ? 'رسید' : 'Receipt'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Grid: My Grievances & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="kc-obsidian-card rounded-2xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E4E2]/20">
            <div>
              <h3 className="text-sm font-bold text-white">
                {language === 'ur' ? 'سپورٹ ٹکٹس اور شکایات' : 'Support Tickets & Grievances'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'ur' ? `آپ کے ضلعی ایڈمن (${memberDistrict}) کو بھیجی جاتی ہیں` : `Routed to your District Admin (${memberDistrict})`}
              </p>
            </div>
            {allowComplaints && (
              <button type="button" onClick={() => setIsComplaintModalOpen(true)} className="text-xs text-[#E5E4E2] hover:underline font-bold cursor-pointer">
                {language === 'ur' ? '+ شکایت درج کریں' : '+ File Ticket'}
              </button>
            )}
          </div>

          <div className="mt-3 space-y-3">
            {ownComplaints.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {language === 'ur' ? 'آپ نے ابھی کوئی شکایت درج نہیں کروائی۔' : 'You have not filed any grievances.'}
              </div>
            ) : (
              ownComplaints.map(cmp => (
                <div key={cmp.id} className="p-3 rounded-xl border border-[#E5E4E2]/25 bg-[#071812] text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-white">{cmp.subject}</span>
                      <p className="text-[10px] text-slate-400 font-mono">{cmp.ticketNumber} · {cmp.category}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      cmp.status === 'RESOLVED' ? 'bg-[#0D2A1F] text-[#059669] border border-[#059669]/35' : 'bg-amber-950/60 text-[#E5E4E2] border border-[#E5E4E2]/35'
                    }`}>
                      {cmp.status === 'RESOLVED' ? translate(language, 'resolvedLabel') : translate(language, 'openLabel')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1.5">{cmp.description}</p>
                  {cmp.responseNote && (
                    <div className="mt-2 text-[11px] text-emerald-100 kc-emerald-panel p-2.5 rounded-lg">
                      <span className="font-bold text-[#E5E4E2]">
                        {language === 'ur' ? `جواب (${cmp.assignedOfficerName}):` : `Response (${cmp.assignedOfficerName}):`}
                      </span> {cmp.responseNote}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {vis.showAnnouncementsFeed && (
          <div className="kc-obsidian-card rounded-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E4E2]/20">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {language === 'ur' ? 'اعلانات اور آفیشل نوٹس' : 'Announcements & Official Notices'}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'ur' ? `تازہ ترین آفیشل ایپ 👑 اور ${memberDistrict} کے اعلانات` : `Latest Official App 👑 & ${memberDistrict} notices`}
                </p>
              </div>
              <Megaphone className="w-4 h-4 text-[#E5E4E2]" />
            </div>

            <div className="mt-3 space-y-3">
              {relevantAnnouncements.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  {translate(language, 'noAnnouncements')}
                </div>
              ) : (
                relevantAnnouncements.slice(0, 5).map(ann => (
                  <div
                    key={ann.id}
                    className={`p-3 rounded-xl border text-xs ${
                      ann.urgency === 'URGENT'
                        ? 'border-rose-500/45 bg-rose-950/25'
                        : 'border-[#E5E4E2]/25 bg-[#071812]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-white">{ann.title}</h4>
                      <span className="text-[9px] font-bold text-[#E5E4E2] shrink-0">
                        {ann.announcementType === 'OFFICIAL_APP'
                          ? (language === 'ur' ? '👑 آفیشل' : '👑 OFFICIAL')
                          : (language === 'ur' ? '📢 کمیونٹی' : '📢 COMMUNITY')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{ann.content}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-[#E5E4E2]/15 pt-1.5">
                      <span>{language === 'ur' ? `از: ${ann.publishedBy}` : `From: ${ann.publishedBy}`}</span>
                      <span className="font-mono tabular-nums">{new Date(ann.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: COMPLAINT */}
      {isComplaintModalOpen && (
        <div className="fixed inset-0 z-[95] kc-modal-backdrop flex items-start sm:items-center justify-center bg-black/80 overflow-y-auto">
          <div
            className="relative w-full max-w-lg kc-luxury-modal kc-modal-panel rounded-2xl p-5 sm:p-6 pb-24 sm:pb-6 my-auto overflow-y-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex items-start justify-between gap-2.5 pb-2 border-b border-[#E5E4E2]/20">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white break-words whitespace-normal leading-snug">
                  {language === 'ur' ? 'سپورٹ ٹکٹ یا شکایت درج کریں' : 'File Support Ticket or Grievance'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 break-words whitespace-normal leading-snug">
                  {language === 'ur'
                    ? `براہ راست آپ کے ضلعی ایڈمن (${memberDistrict}, ${memberProvince}) کو بھیجی جائے گی۔`
                    : `Routed directly to your District Admin in ${memberDistrict}, ${memberProvince}.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsComplaintModalOpen(false)}
                aria-label={language === 'ur' ? 'بند کریں' : 'Close'}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl bg-[#071812] border border-[#E5E4E2]/30 text-slate-300 hover:text-white cursor-pointer shrink-0 kc-pressable"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleComplaintSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {language === 'ur' ? 'زمرہ' : 'Category'}
                  </label>
                  <LuxurySelect
                    compact
                    value={cmpCategory}
                    onChange={(val) => setCmpCategory(val as ComplaintCategory)}
                    label={language === 'ur' ? 'زمرہ' : 'Category'}
                    options={[
                      { value: 'Membership Card', label: language === 'ur' ? 'ممبرشپ کارڈ مسئلہ / ترسیل' : 'Membership Card Delivery / Issue' },
                      { value: 'Receipt Inquiry', label: language === 'ur' ? 'رسید یا ریکارڈ کی درستگی' : 'Receipt Tax / Record Correction' },
                      { value: 'Fund Allocation', label: language === 'ur' ? 'فنڈز کی تقسیم و شفافیت' : 'Fund Allocation Transparency' },
                      { value: 'Welfare Support', label: language === 'ur' ? 'ویلفیئر امداد نامزدگی' : 'Welfare Support Nomination' },
                      { value: 'District Activity', label: language === 'ur' ? 'ضلعی سرگرمی کا سوال' : 'District Activity Question' },
                      { value: 'General', label: language === 'ur' ? 'عمومی سوالات' : 'General Inquiries' }
                    ]}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {language === 'ur' ? 'ترجیح' : 'Urgency Priority'}
                  </label>
                  <LuxurySelect
                    compact
                    value={cmpPriority}
                    onChange={(val) => setCmpPriority(val as 'LOW' | 'MEDIUM' | 'HIGH')}
                    label={language === 'ur' ? 'ترجیح' : 'Urgency Priority'}
                    options={[
                      { value: 'LOW', label: language === 'ur' ? 'کم (معمول)' : 'Low' },
                      { value: 'MEDIUM', label: language === 'ur' ? 'درمیانی' : 'Medium' },
                      { value: 'HIGH', label: language === 'ur' ? 'زیادہ (فوری توجہ)' : 'High (Urgent Attention)' }
                    ]}
                  />
                </div>
              </div>

              <input
                type="text"
                required
                placeholder={language === 'ur' ? 'موضوع...' : 'Subject line...'}
                value={cmpSubject}
                onChange={(e) => setCmpSubject(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl kc-luxury-input"
              />

              <textarea
                required
                rows={4}
                placeholder={language === 'ur' ? 'مکمل تفصیلات لکھیں...' : 'Provide full details...'}
                value={cmpDescription}
                onChange={(e) => setCmpDescription(e.target.value)}
                className="w-full text-xs p-3 rounded-xl kc-luxury-input resize-none"
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E4E2]/20">
                <button type="button" onClick={() => setIsComplaintModalOpen(false)} className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer">
                  {translate(language, 'cancel')}
                </button>
                <button type="submit" className="flex items-center gap-1.5 px-4 py-2 kc-gold-button text-xs font-extrabold rounded-xl cursor-pointer">
                  <Send className="w-3.5 h-3.5" />
                  <span>{language === 'ur' ? 'شکایت جمع کروائیں' : 'Submit Ticket'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
