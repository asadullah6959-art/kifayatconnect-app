import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CheckSquare, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  MapPin,
  UserCheck,
  Send,
  Layers,
  Paperclip,
  FileText,
  FileCheck,
  Eye,
  FilePlus2,
  FileCheck2
} from 'lucide-react';
import { MembershipApplication } from '../../types';
import { 
  PROVINCE_OPTIONS, 
  getDistrictsForProvince, 
  formatFullLocationHierarchy, 
  formatShortLocation, 
  mapLegacyRegionToHierarchy 
} from '../../data/locationData';
import { DocumentUploadModal } from './DocumentUploadModal';
import { OldPaperRecordModal } from './OldPaperRecordModal';
import { LuxurySelect } from '../common/LuxurySelect';
import { TabbarBadge } from '../common/TabbarBadge';

export const ApprovalWorkflow: React.FC = () => {
  const { 
    currentUser, 
    applications, 
    recommendApplication, 
    finalApproveApplication, 
    rejectApplication,
    openRukniyatForm,
    language 
  } = useApp();
  const isUr = language === 'ur';

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isDistrictAdmin = currentUser?.role === 'ADMIN';

  const [activeTabFilter, setActiveTabFilter] = useState<'PENDING_REGIONAL' | 'RECOMMENDED' | 'ACTIVE' | 'REJECTED'>(
    'PENDING_REGIONAL'
  );

  const [filterProvince, setFilterProvince] = useState<string>('ALL');
  const [filterDistrict, setFilterDistrict] = useState<string>('ALL');
  const [isOldPaperModalOpen, setIsOldPaperModalOpen] = useState(false);

  // Recommendation interaction state (District Admin)
  const [reviewingApp, setReviewingApp] = useState<MembershipApplication | null>(null);
  const [recommendationChoice, setRecommendationChoice] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [regionalNotes, setRegionalNotes] = useState('');

  // Final Approval interaction state (Super Admin)
  const [finalApprovingApp, setFinalApprovingApp] = useState<MembershipApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Supporting Documents Dossier modal state
  const [activeDocAppId, setActiveDocAppId] = useState<string | null>(null);

  // Bulk processing interaction state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [bulkRemarks, setBulkRemarks] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const lastActionTsRef = useRef<number>(0);

  if (!currentUser) return null;

  // Helper to determine if an application is actionable for current user role
  const isActionable = (app: MembershipApplication) => {
    if (isDistrictAdmin) {
      return (app.status as any) === 'PENDING_REGIONAL_REVIEW' || (app.status as any) === 'PENDING_DISTRICT_REVIEW';
    }
    if (isSuperAdmin) {
      return (app.status as any) === 'RECOMMENDED_BY_REGION' || (app.status as any) === 'RECOMMENDED_BY_DISTRICT' || (app.status as any) === 'PENDING_REGIONAL_REVIEW' || (app.status as any) === 'PENDING_DISTRICT_REVIEW';
    }
    return false;
  };

  // Applications filtered by user role and tab
  const visibleApplications = applications.filter(app => {
    const fallback = mapLegacyRegionToHierarchy(app.region);
    const appProv = app.stateProvince || fallback.stateProvince;
    const appDist = app.district || fallback.district;

    // If District Admin: only see applications in assigned district
    if (isDistrictAdmin) {
      const myDist = currentUser.assignedDistrict || currentUser.district;
      if (appDist !== myDist && app.region !== currentUser.region) {
        return false;
      }
    }

    if (filterProvince !== 'ALL' && appProv !== filterProvince) {
      return false;
    }
    if (filterDistrict !== 'ALL' && appDist !== filterDistrict) {
      return false;
    }

    if (activeTabFilter === 'PENDING_REGIONAL') {
      return (app.status as any) === 'PENDING_REGIONAL_REVIEW' || (app.status as any) === 'PENDING_DISTRICT_REVIEW';
    }
    if (activeTabFilter === 'RECOMMENDED') {
      return (app.status as any) === 'RECOMMENDED_BY_REGION' || (app.status as any) === 'RECOMMENDED_BY_DISTRICT';
    }
    if (activeTabFilter === 'ACTIVE') {
      return app.status === 'ACTIVE';
    }
    if (activeTabFilter === 'REJECTED') {
      return app.status === 'REJECTED';
    }
    return true;
  });

  const actionableVisibleApps = visibleApplications.filter(isActionable);
  const isAllSelected = actionableVisibleApps.length > 0 && actionableVisibleApps.every(a => selectedIds.includes(a.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const actionableIds = new Set(actionableVisibleApps.map(a => a.id));
      setSelectedIds(prev => prev.filter(id => !actionableIds.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...actionableVisibleApps.map(a => a.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleRegionalSubmit = () => {
    const now = Date.now();
    if (now - lastActionTsRef.current < 500 || isSubmittingDecision) return;
    lastActionTsRef.current = now;
    if (!reviewingApp || !regionalNotes.trim()) return;
    recommendApplication(reviewingApp.id, recommendationChoice, regionalNotes.trim());
    setReviewingApp(null);
    setRegionalNotes('');
  };

  const handleSuperAdminFinalSubmit = async () => {
    const now = Date.now();
    if (now - lastActionTsRef.current < 500 || isSubmittingDecision) return;
    lastActionTsRef.current = now;
    if (!finalApprovingApp) return;
    setIsSubmittingDecision(true);
    try {
      await finalApproveApplication(finalApprovingApp.id, adminNotes.trim() || undefined);
      setFinalApprovingApp(null);
      setAdminNotes('');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleBulkSubmit = async () => {
    const now = Date.now();
    if (now - lastActionTsRef.current < 500 || isProcessingBulk) return;
    lastActionTsRef.current = now;
    if (!bulkAction || selectedIds.length === 0) return;
    setIsProcessingBulk(true);

    try {
      const selectedApps = applications.filter(a => selectedIds.includes(a.id));
      
      for (const app of selectedApps) {
        if (bulkAction === 'APPROVE') {
          if (isDistrictAdmin || (isSuperAdmin && ((app.status as any) === 'PENDING_REGIONAL_REVIEW' || (app.status as any) === 'PENDING_DISTRICT_REVIEW'))) {
            await recommendApplication(
              app.id, 
              'APPROVE', 
              bulkRemarks.trim() || 'Bulk verification & recommendation approved.'
            );
          } else if (isSuperAdmin && ((app.status as any) === 'RECOMMENDED_BY_REGION' || (app.status as any) === 'RECOMMENDED_BY_DISTRICT')) {
            await finalApproveApplication(
              app.id, 
              bulkRemarks.trim() || 'Bulk final approval granted under bylaws.'
            );
          }
        } else if (bulkAction === 'REJECT') {
          if (isDistrictAdmin) {
            await recommendApplication(
              app.id, 
              'REJECT', 
              bulkRemarks.trim() || 'Bulk review: Rejected during district field verification.'
            );
          } else {
            await rejectApplication(
              app.id, 
              bulkRemarks.trim() || 'Bulk review: Rejected by central administration.'
            );
          }
        }
      }
    } catch (err) {
      console.error('Error during bulk processing:', err);
    } finally {
      setIsProcessingBulk(false);
      setBulkAction(null);
      setBulkRemarks('');
      setSelectedIds([]);
    }
  };

  const localizeAppStatus = (status: string) => {
    if (!isUr) return status;
    if (status === 'PENDING_REGIONAL_REVIEW' || status === 'PENDING_DISTRICT_REVIEW') return 'ضلعی جائزے کے منتظر';
    if (status === 'RECOMMENDED_BY_REGION' || status === 'RECOMMENDED_BY_DISTRICT') return 'ضلع کی جانب سے تجویز کردہ';
    if (status === 'ACTIVE') return 'منظور شدہ و فعال';
    if (status === 'REJECTED') return 'مسترد شدہ';
    if (status === 'SUSPENDED') return 'معطل';
    return status;
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#F5D061] uppercase tracking-wider">
              {isUr ? 'گورننس اور تصدیقی پائپ لائن' : 'Governance & Verification Pipeline'}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-400">
              {isUr ? 'اختیارات کی تقسیم کا ورک فلو' : 'Separation of Powers Workflow'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-[#F5D061]" />
            <span>{isUr ? 'ممبرشپ کثیر الجہتی منظوری مرکز' : 'Membership Multi-Tier Approval Center'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isUr
              ? 'مرحلہ 1: ضلعی ایڈمن کی تصدیق و سفارش ← مرحلہ 2: سپر ایڈمن کی حتمی منظوری اور آئی ڈی کارڈ کا اجراء۔'
              : 'Stage 1: District Admin verification & recommendation → Stage 2: Super Admin final approval & ID issuance.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setIsOldPaperModalOpen(true)}
              className="kc-pressable flex items-center gap-1.5 px-3.5 py-2 bg-[#064E3B]/80 hover:bg-[#065F46] text-[#FEF08A] border border-[#D4AF37]/60 text-xs font-bold rounded-xl cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4 text-[#FDE047]" />
              <span>
                {isUr
                  ? '+ پرانا دستی ریکارڈ شامل کریں'
                  : '+ Add Old / By-Hand Record (پرانا دستی ریکارڈ شامل کریں)'}
              </span>
            </button>
          )}

          {/* Workflow Diagram Banner */}
          <div className="hidden lg:flex items-center gap-2 bg-[#111726] p-2.5 rounded-xl border border-[#D4AF37]/30 text-xs shadow-[inset_0_1px_0_rgba(252,227,138,0.12)]">
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <span className="w-5 h-5 rounded-full bg-[#090D16] border border-[#D4AF37]/30 text-[#F5D061] flex items-center justify-center text-[10px] font-bold tabular-nums">1</span>
              <span>{isUr ? 'رجسٹریشن' : 'Registration'}</span>
            </div>
            <span className="text-[#D4AF37]/60">→</span>
            <div className={`flex items-center gap-1.5 font-medium ${isDistrictAdmin ? 'text-[#F5D061] font-bold' : 'text-slate-300'}`}>
              <span className="w-5 h-5 rounded-full bg-[#090D16] border border-[#D4AF37]/40 text-[#F5D061] flex items-center justify-center text-[10px] font-bold tabular-nums">2</span>
              <span>{isUr ? 'ضلعی تصدیق' : 'District Verify'}</span>
            </div>
            <span className="text-[#D4AF37]/60">→</span>
            <div className={`flex items-center gap-1.5 font-medium ${isSuperAdmin ? 'text-[#38BDF8] font-bold' : 'text-slate-300'}`}>
              <span className="w-5 h-5 rounded-full bg-[#131C31] border border-[#38BDF8]/45 text-[#38BDF8] flex items-center justify-center text-[10px] font-bold tabular-nums">3</span>
              <span>{isUr ? 'سپر ایڈمن دستخط' : 'Super Admin Sign'}</span>
            </div>
            <span className="text-[#D4AF37]/60">→</span>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-5 h-5 rounded-full bg-[#090D16] border border-[#D4AF37]/30 text-slate-200 flex items-center justify-center text-[10px] font-bold tabular-nums">4</span>
              <span>{isUr ? 'آئی ڈی کارڈ جاری' : 'ID Card Issued'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Location Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 kc-tab-shell rounded-xl text-xs">
          <button
            onClick={() => setActiveTabFilter('PENDING_REGIONAL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer kc-pressable tabular-nums ${
              activeTabFilter === 'PENDING_REGIONAL'
                ? 'kc-gold-button font-bold'
                : 'text-slate-300 hover:text-white hover:bg-[#141B2D]'
            }`}
          >
            {isUr
              ? `مرحلہ 1: زیرِ التواء جائزہ (${applications.filter(a => (isDistrictAdmin ? a.district === (currentUser.assignedDistrict || currentUser.district) : true) && ((a.status as any) === 'PENDING_REGIONAL_REVIEW' || (a.status as any) === 'PENDING_DISTRICT_REVIEW')).length})`
              : `Stage 1: Pending Review (${applications.filter(a => (isDistrictAdmin ? a.district === (currentUser.assignedDistrict || currentUser.district) : true) && ((a.status as any) === 'PENDING_REGIONAL_REVIEW' || (a.status as any) === 'PENDING_DISTRICT_REVIEW')).length})`}
          </button>

          <button
            onClick={() => setActiveTabFilter('RECOMMENDED')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer kc-pressable tabular-nums ${
              activeTabFilter === 'RECOMMENDED'
                ? 'kc-gold-button font-bold'
                : 'text-slate-300 hover:text-white hover:bg-[#141B2D]'
            }`}
          >
            {isUr
              ? `مرحلہ 2: تجویز کردہ (${applications.filter(a => (isDistrictAdmin ? a.district === (currentUser.assignedDistrict || currentUser.district) : true) && ((a.status as any) === 'RECOMMENDED_BY_REGION' || (a.status as any) === 'RECOMMENDED_BY_DISTRICT')).length})`
              : `Stage 2: Recommended (${applications.filter(a => (isDistrictAdmin ? a.district === (currentUser.assignedDistrict || currentUser.district) : true) && ((a.status as any) === 'RECOMMENDED_BY_REGION' || (a.status as any) === 'RECOMMENDED_BY_DISTRICT')).length})`}
          </button>

          <button
            onClick={() => setActiveTabFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer kc-pressable ${
              activeTabFilter === 'ACTIVE'
                ? 'kc-gold-button font-bold'
                : 'text-slate-300 hover:text-white hover:bg-[#141B2D]'
            }`}
          >
            {isUr ? 'منظور شدہ و فعال' : 'Approved & Active'}
          </button>

          <button
            onClick={() => setActiveTabFilter('REJECTED')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer kc-pressable ${
              activeTabFilter === 'REJECTED'
                ? 'kc-gold-button font-bold'
                : 'text-slate-300 hover:text-white hover:bg-[#141B2D]'
            }`}
          >
            {isUr ? 'مسترد شدہ' : 'Rejected'}
          </button>
        </div>

        {/* State/Province & District Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-40">
            <LuxurySelect
              compact
              value={filterProvince}
              onChange={(val) => {
                setFilterProvince(val);
                setFilterDistrict('ALL');
              }}
              label={isUr ? 'صوبہ فلٹر' : 'Province Filter'}
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
              label={isUr ? 'ضلع فلٹر' : 'District Filter'}
              options={[
                { value: 'ALL', label: isUr ? 'تمام اضلاع' : 'All Districts' },
                ...(filterProvince !== 'ALL'
                  ? getDistrictsForProvince(filterProvince)
                  : PROVINCE_OPTIONS.flatMap(p => getDistrictsForProvince(p))
                ).map(d => ({ value: d, label: d }))
              ]}
            />
          </div>
        </div>
      </div>

      {/* Applications List & Header */}
      <div className="space-y-4">
        {/* Select All Bulk Toolbar Header */}
        {actionableVisibleApps.length > 0 && (
          <div className="flex items-center justify-between bg-[#111726] px-4 py-2.5 rounded-xl border border-[#D4AF37]/30 text-xs shadow-[inset_0_1px_0_rgba(252,227,138,0.1)]">
            <label className="flex items-center gap-2.5 font-medium text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-[#D4AF37]/50 bg-[#090D16] accent-[#D4AF37] cursor-pointer"
              />
              <span className="tabular-nums">
                {isUr
                  ? `تمام اہل درخواستیں منتخب کریں (${actionableVisibleApps.length})`
                  : `Select All Eligible (${actionableVisibleApps.length})`}
              </span>
            </label>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-[#F5D061] tabular-nums">
                  {isUr
                    ? `${actionableVisibleApps.length} میں سے ${selectedIds.length} منتخب`
                    : `${selectedIds.length} of ${actionableVisibleApps.length} selected`}
                </span>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-[11px] text-slate-300 hover:text-white underline underline-offset-2 ml-1 cursor-pointer"
                >
                  {isUr ? 'انتخاب ختم کریں' : 'Deselect all'}
                </button>
              </div>
            )}
          </div>
        )}

        {visibleApplications.length === 0 ? (
          <div className="p-12 text-center kc-obsidian-card rounded-2xl text-xs text-slate-300">
            {isUr
              ? 'اس مرحلے اور مقام کے فلٹر کے مطابق کوئی درخواست موجود نہیں ہے۔'
              : 'No applications match this workflow stage and location filter.'}
          </div>
        ) : (
          visibleApplications.map(app => {
            const locFallback = mapLegacyRegionToHierarchy(app.region);
            const prov = app.stateProvince || locFallback.stateProvince;
            const dist = app.district || locFallback.district;
            const teh = app.tehsil || locFallback.tehsil;
            const city = app.cityTown || locFallback.cityTown;
            const uc = app.unionCouncil || locFallback.unionCouncil;
            const actionable = isActionable(app);
            const isSelected = selectedIds.includes(app.id);

            return (
              <div 
                key={app.id}
                className={`p-5 kc-obsidian-card rounded-2xl transition-all space-y-3 ${
                  isSelected 
                    ? 'border-[#F5D061] ring-2 ring-[#F5D061]/30' 
                    : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {actionable && (
                    <div className="pt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(app.id)}
                        aria-label={`Select ${app.applicantName}`}
                        className="w-4 h-4 rounded border-[#D4AF37]/50 bg-[#090D16] accent-[#D4AF37] cursor-pointer"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-base text-white">
                          {app.applicantName}
                        </h3>
                        {app.serialNumber && (
                          <span className="text-[10px] font-mono font-extrabold text-[#FDE047] bg-[#070D14] px-2 py-0.5 rounded-lg border border-[#D4AF37]/50">
                            {app.serialNumber}
                          </span>
                        )}
                        <TabbarBadge
                          tabbarId={app.tabbarId}
                          tabbarEnglish={app.tabbarEnglish}
                          tabbarUrdu={app.tabbarUrdu}
                          compact
                          language={language}
                        />
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg font-medium bg-[#131C31] border border-[#38BDF8]/35 text-[#F8FAFC] text-xs">
                          <MapPin className="w-3 h-3 text-[#38BDF8] shrink-0" />
                          <span>{dist}, {prov}</span>
                        </div>
                        {app.isOldMemberVerification && (
                          <span className="text-[10px] font-semibold text-[#F5D061] bg-[#090D16] px-2 py-0.5 rounded-lg border border-[#D4AF37]/35">
                            {isUr ? 'پرانا ممبر نمبر:' : 'Legacy ID:'} {app.oldMembershipNo}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg ${
                          app.status === 'ACTIVE'
                            ? 'bg-[#131C31] text-[#38BDF8] border border-[#38BDF8]/40'
                            : (app.status as any) === 'RECOMMENDED_BY_REGION' || (app.status as any) === 'RECOMMENDED_BY_DISTRICT'
                            ? 'bg-[#090D16] text-[#F5D061] border border-[#D4AF37]/45'
                            : app.status === 'REJECTED'
                            ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                            : 'bg-[#090D16] text-sky-300 border border-sky-500/40'
                        }`}>
                          {localizeAppStatus(app.status)}
                        </span>
                      </div>
                    </div>

                    {/* Administrative Location Hierarchy Breadcrumb */}
                    <div className="px-3 py-2 rounded-xl bg-[#090D16] border border-[#D4AF37]/20 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-300">
                      <span className="text-[10px] uppercase font-bold text-[#D4AF37]">{isUr ? 'دائرہ کار:' : 'Jurisdiction:'}</span>
                      <span className="font-semibold text-white">{app.country || 'Pakistan'}</span>
                      <span className="text-slate-500">→</span>
                      <span className="font-semibold text-white">{prov}</span>
                      <span className="text-slate-500">→</span>
                      <span className="font-semibold text-emerald-300">{dist}</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-slate-200">{isUr ? 'تحصیل:' : 'Tehsil:'} {teh || (isUr ? 'جنرل' : 'General')}</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-slate-200">{isUr ? 'شہر:' : 'City:'} {city || dist}</span>
                      <span className="text-slate-500">→</span>
                      <span className="font-mono text-slate-200">{isUr ? 'یو سی:' : 'UC:'} {uc || 'N/A'}</span>
                    </div>

                    {/* Applicant Credentials Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-[#090D16] p-3.5 rounded-xl border border-[#D4AF37]/20">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">{isUr ? 'قومی شناختی کارڈ (CNIC)' : 'National ID (CNIC)'}</span>
                        <span className="font-mono text-white font-semibold tabular-nums">{app.cnic}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">{isUr ? 'فون نمبر' : 'Phone Number'}</span>
                        <span className="text-slate-200 font-mono tabular-nums">{app.phone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">{isUr ? 'ای میل' : 'Email'}</span>
                        <span className="text-slate-200 truncate block">{app.email}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">{isUr ? 'جمع کرانے کی تاریخ' : 'Submitted Date'}</span>
                        <span className="font-mono text-slate-200 tabular-nums">{new Date(app.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300">
                      <span className="text-slate-400">{isUr ? 'رہائشی پتہ: ' : 'Residential Address: '}</span>
                      {app.address}
                    </p>

                    {/* Workflow Audit Stamp Section */}
                    <div className="pt-2 border-t border-[#D4AF37]/15 space-y-1.5 text-xs">
                      {(app.districtRemarks || app.regionalRemarks) && (
                        <div className="p-2.5 rounded-xl bg-[#090D16] border border-[#D4AF37]/30">
                          <span className="font-semibold text-[#F5D061]">
                            {isUr
                              ? `ضلعی سفارش (${app.districtAdminName || app.regionalOfficerName || 'ضلعی ایڈمن'}):`
                              : `District Recommendation (${app.districtAdminName || app.regionalOfficerName || 'District Admin'}):`}
                          </span>
                          <p className="italic text-slate-200 mt-0.5">
                            "{app.districtRemarks || app.regionalRemarks}"
                          </p>
                        </div>
                      )}

                      {app.superAdminRemarks && (
                        <div className="p-2.5 rounded-xl bg-[#131C31]/90 border border-[#38BDF8]/35">
                          <span className="font-semibold text-[#38BDF8]">
                            {isUr ? 'سپر ایڈمن حتمی منظوری:' : 'Super Admin Final Sign-Off:'}
                          </span>
                          <p className="text-slate-200 mt-0.5">
                            {app.superAdminRemarks} · {isUr ? 'جاری کردہ ممبرشپ آئی ڈی:' : 'Issued Membership ID:'} <span className="font-mono font-bold text-[#F5D061] tabular-nums">{app.generatedMembershipId}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Supporting Documents Dossier Section */}
                    <div className="pt-2 border-t border-[#D4AF37]/15 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                          <Paperclip className="w-3 h-3 text-[#F5D061]" />
                          <span>{isUr ? 'معاون دستاویزات:' : 'Supporting Files:'}</span>
                        </span>

                        {(app.supportingDocuments && app.supportingDocuments.length > 0) ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {app.supportingDocuments.map(doc => (
                              <button
                                key={doc.id}
                                type="button"
                                onClick={() => setActiveDocAppId(app.id)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer kc-pressable ${
                                  doc.verificationStatus === 'VERIFIED'
                                    ? 'bg-[#131C31] text-[#38BDF8] border-[#38BDF8]/40'
                                    : doc.verificationStatus === 'FLAGGED'
                                    ? 'bg-rose-950/70 text-rose-200 border-rose-500/40'
                                    : 'bg-[#090D16] text-[#F5D061] border-[#D4AF37]/35'
                                }`}
                                title={isUr ? `${doc.name} - معائنے کے لیے کلک کریں` : `${doc.name} (${doc.type}) - Click to inspect`}
                              >
                                <span>{doc.type === 'IDENTIFICATION_CNIC' ? '🪪' : doc.type === 'EXPENSE_RECEIPT' || doc.type === 'DEPOSIT_SLIP' ? '🧾' : '📄'}</span>
                                <span className="max-w-[120px] truncate">{doc.name}</span>
                                {doc.verificationStatus === 'VERIFIED' && <span className="text-emerald-300 font-bold">✓</span>}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {isUr ? 'ابھی تک کوئی دستاویز منسلک نہیں' : 'No documents attached yet'}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveDocAppId(app.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#090D16] hover:bg-[#161F33] text-[#F5D061] border border-[#D4AF37]/40 transition-colors cursor-pointer kc-pressable"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-[#F5D061]" />
                        <span>
                          {app.supportingDocuments && app.supportingDocuments.length > 0 
                            ? (isUr ? `ڈوزیئر منظم کریں (${app.supportingDocuments.length})` : `Manage Dossier (${app.supportingDocuments.length})`)
                            : (isUr ? '+ معاون دستاویزات منسلک کریں' : '+ Attach Supporting Files')}
                        </span>
                      </button>
                    </div>

                    {/* Action Buttons depending on role & status */}
                    <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openRukniyatForm(app)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-[#022C22]/80 hover:bg-[#064E3B] text-[#FEF08A] border border-[#D4AF37]/50 cursor-pointer kc-pressable"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-[#FDE047]" />
                        <span>{isUr ? 'مکمل رکنیت فارم / مہر دیکھیں' : 'View Full Rukniyat Form / Mohar'}</span>
                      </button>

                      {/* District Admin Action (Stage 1) */}
                      {isDistrictAdmin && ((app.status as any) === 'PENDING_REGIONAL_REVIEW' || (app.status as any) === 'PENDING_DISTRICT_REVIEW') && (
                        <button
                          onClick={() => {
                            setReviewingApp(app);
                            setRecommendationChoice('APPROVE');
                            setRegionalNotes(isUr ? 'رہائشی پتہ اور کوائف کی تصدیق ہو گئی۔' : 'Residential address confirmed. Applicant background clean.');
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 kc-gold-button text-xs font-bold rounded-xl cursor-pointer"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>{isUr ? 'ضلعی سفارش جمع کرائیں' : 'Submit District Recommendation'}</span>
                        </button>
                      )}

                      {/* Super Admin Action (Stage 2) */}
                      {isSuperAdmin && ((app.status as any) === 'RECOMMENDED_BY_REGION' || (app.status as any) === 'RECOMMENDED_BY_DISTRICT' || (app.status as any) === 'PENDING_REGIONAL_REVIEW' || (app.status as any) === 'PENDING_DISTRICT_REVIEW') && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const now = Date.now();
                              if (now - lastActionTsRef.current < 500) return;
                              lastActionTsRef.current = now;
                              rejectApplication(app.id, isUr ? 'مرکزی قواعد و ضوابط پر پورا نہیں اترتی۔' : 'Does not satisfy central bylaws criteria.');
                            }}
                            className="px-3.5 py-2 text-xs font-semibold text-rose-300 bg-rose-950/60 hover:bg-rose-900/70 rounded-xl border border-rose-500/40 cursor-pointer kc-pressable"
                          >
                            {isUr ? 'درخواست مسترد کریں' : 'Reject Application'}
                          </button>
                          <button
                            onClick={() => {
                              setFinalApprovingApp(app);
                              setAdminNotes(isUr ? 'کفایت کنیکٹ کے قواعد کے تحت حتمی منظوری دے دی گئی۔' : 'Final approval granted under Kifayat Connect bylaws.');
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 kc-gold-button text-xs font-bold rounded-xl cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{isUr ? 'حتمی منظوری اور آئی ڈی جاری کریں' : 'Grant Final Approval & Issue ID'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: DISTRICT ADMIN RECOMMENDATION DIALOG */}
      {reviewingApp && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-[#090D16]/85 p-3 sm:p-4 overflow-y-auto">
          <div
            className="kc-luxury-modal rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 my-auto max-h-[92dvh] overflow-y-auto text-slate-100"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div>
              <span className="text-xs text-[#F5D061] uppercase font-bold tracking-wide">
                {isUr ? 'مرحلہ 1 جائزہ:' : 'Stage 1 Review:'} {reviewingApp.district || currentUser.district || (isUr ? 'ضلع دائرہ اختیار' : 'District Jurisdiction')} ({reviewingApp.stateProvince || currentUser.stateProvince || 'Pakistan'})
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                {isUr ? `سفارش: ${reviewingApp.applicantName}` : `Recommend ${reviewingApp.applicantName}`}
              </h3>
              <p className="text-xs text-slate-300">
                {isUr ? 'ضلع:' : 'District:'} <strong className="text-white">{reviewingApp.district || (isUr ? 'جنرل' : 'General')}</strong> · {isUr ? 'تحصیل:' : 'Tehsil:'} <strong className="text-white">{reviewingApp.tehsil || (isUr ? 'مرکزی' : 'Central')}</strong> · {isUr ? 'یو سی:' : 'UC:'} <strong className="text-white">{reviewingApp.unionCouncil || 'UC-01'}</strong>
              </p>
            </div>

            {/* Supporting Dossier Quick Check */}
            <div className="p-3 rounded-xl bg-[#090D16] border border-[#D4AF37]/25 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-[#F5D061]" />
                  <span>{isUr ? 'معاون دستاویزات:' : 'Supporting Documents:'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveDocAppId(reviewingApp.id)}
                  className="text-[#F5D061] font-bold hover:underline text-[11px] cursor-pointer"
                >
                  {isUr ? `ڈوزیئر دیکھیں (${reviewingApp.supportingDocuments?.length || 0})` : `Manage Dossier (${reviewingApp.supportingDocuments?.length || 0})`}
                </button>
              </div>

              {(!reviewingApp.supportingDocuments || reviewingApp.supportingDocuments.length === 0) ? (
                <p className="text-[11px] text-slate-400 italic">
                  {isUr ? 'ابھی تک کوئی معاون دستاویز اپلوڈ نہیں ہوئی۔' : 'No supporting documents uploaded yet.'}
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {reviewingApp.supportingDocuments.map(doc => (
                    <span 
                      key={doc.id}
                      onClick={() => setActiveDocAppId(reviewingApp.id)}
                      className="cursor-pointer text-[10px] font-medium px-2 py-0.5 rounded-lg bg-[#111726] border border-[#D4AF37]/30 text-slate-200 flex items-center gap-1 hover:border-[#F5D061]"
                    >
                      <span>{doc.type === 'IDENTIFICATION_CNIC' ? '🪪' : '🧾'}</span>
                      <span className="truncate max-w-[100px]">{doc.name}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${doc.verificationStatus === 'VERIFIED' ? 'bg-emerald-400' : 'bg-[#F5D061]'}`} />
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-200 block">
                {isUr ? 'سفارش:' : 'Recommendation:'}
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRecommendationChoice('APPROVE')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-colors flex items-center justify-center gap-1.5 cursor-pointer kc-pressable ${
                    recommendationChoice === 'APPROVE'
                      ? 'bg-[#131C31] text-[#38BDF8] border-[#38BDF8]/60'
                      : 'bg-[#090D16] text-slate-300 border-[#D4AF37]/25 hover:border-[#D4AF37]/50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isUr ? 'منظوری کی سفارش' : 'Recommend Approval'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecommendationChoice('REJECT')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-colors flex items-center justify-center gap-1.5 cursor-pointer kc-pressable ${
                    recommendationChoice === 'REJECT'
                      ? 'bg-rose-950 text-rose-300 border-rose-500/60'
                      : 'bg-[#090D16] text-slate-300 border-[#D4AF37]/25 hover:border-[#D4AF37]/50'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>{isUr ? 'مسترد کرنے کی سفارش' : 'Recommend Reject'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-200 block mb-1">
                {isUr ? 'فیلڈ تصدیق کے ریمارکس' : 'Field Verification Remarks'}
              </label>
              <textarea
                rows={3}
                required
                value={regionalNotes}
                onChange={(e) => setRegionalNotes(e.target.value)}
                placeholder={isUr ? 'تحریر کریں کہ کوائف اور رہائشی پتے کی تصدیق کیسے کی گئی...' : 'State how credentials and residential address were verified...'}
                className="w-full text-xs p-2.5 rounded-xl kc-luxury-input resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D4AF37]/20">
              <button
                type="button"
                onClick={() => setReviewingApp(null)}
                className="px-3.5 py-2 text-xs text-slate-300 hover:text-white rounded-xl bg-[#090D16] border border-[#D4AF37]/20 cursor-pointer kc-pressable"
              >
                {isUr ? 'منسوخ کریں' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleRegionalSubmit}
                className="px-4 py-2 kc-gold-button text-xs font-bold rounded-xl cursor-pointer"
              >
                {isUr ? 'سپر ایڈمن کو ارسال کریں' : 'Submit to Super Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUPER ADMIN FINAL APPROVAL DIALOG */}
      {finalApprovingApp && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-[#090D16]/85 p-3 sm:p-4 overflow-y-auto">
          <div
            className="kc-luxury-modal rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 my-auto max-h-[92dvh] overflow-y-auto text-slate-100"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div>
              <span className="text-xs text-emerald-300 uppercase font-bold tracking-wide">
                {isUr ? 'حتمی منظوری کا اختیار' : 'Final Authorization Authority'}
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                {isUr ? 'آفیشل ممبرشپ کارڈ جاری کریں' : 'Issue Official Membership Card'}
              </h3>
              <p className="text-xs text-slate-300">
                {isUr
                  ? `${finalApprovingApp.applicantName} (${finalApprovingApp.district || finalApprovingApp.region}) کی حتمی منظوری دیں۔ منفرد آئی ڈی کے ساتھ ڈیجیٹل ممبرشپ کارڈ فوری طور پر تیار ہو جائے گا۔`
                  : `Grant final approval for ${finalApprovingApp.applicantName} (${finalApprovingApp.district || finalApprovingApp.region}, ${finalApprovingApp.stateProvince || 'Pakistan'}). A digital membership card with unique ID will be instantly generated.`}
              </p>
            </div>

            <div className="p-3 bg-[#090D16] rounded-xl border border-[#D4AF37]/30 text-xs">
              <span className="font-semibold text-[#F5D061]">
                {isUr ? 'ریکارڈ پر ضلعی سفارش:' : 'District Recommendation On File:'}
              </span>
              <p className="italic text-slate-200 mt-0.5">
                "{finalApprovingApp.districtRemarks || finalApprovingApp.regionalRemarks || (isUr ? 'فیلڈ جائزہ جمع کرایا گیا۔' : 'Field review submitted.')}"
              </p>
              <span className="block text-[10px] text-slate-400 not-italic mt-1">
                {isUr ? 'تصدیق کنندہ:' : 'Verified by:'} {finalApprovingApp.districtAdminName || finalApprovingApp.regionalOfficerName || (isUr ? 'ضلعی ایڈمن' : 'District Admin')}
              </span>
            </div>

            {/* Supporting Dossier Quick Check */}
            <div className="p-3 rounded-xl bg-[#090D16] border border-[#D4AF37]/25 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F5D061]" />
                  <span>{isUr ? 'ڈوزیئر تصدیقی آڈٹ:' : 'Dossier Verification Audit:'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveDocAppId(finalApprovingApp.id)}
                  className="text-[#F5D061] font-bold hover:underline text-[11px] cursor-pointer"
                >
                  {isUr ? `سب دیکھیں (${finalApprovingApp.supportingDocuments?.length || 0})` : `Inspect All (${finalApprovingApp.supportingDocuments?.length || 0})`}
                </button>
              </div>

              {(!finalApprovingApp.supportingDocuments || finalApprovingApp.supportingDocuments.length === 0) ? (
                <p className="text-[11px] text-slate-400 italic">
                  {isUr ? 'ابھی تک کوئی معاون دستاویز اپلوڈ نہیں ہوئی۔' : 'No supporting documents uploaded yet.'}
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {finalApprovingApp.supportingDocuments.map(doc => (
                    <span 
                      key={doc.id}
                      onClick={() => setActiveDocAppId(finalApprovingApp.id)}
                      className="cursor-pointer text-[10px] font-medium px-2 py-0.5 rounded-lg bg-[#111726] border border-[#D4AF37]/30 text-slate-200 flex items-center gap-1 hover:border-[#F5D061]"
                    >
                      <span>{doc.type === 'IDENTIFICATION_CNIC' ? '🪪' : '🧾'}</span>
                      <span className="truncate max-w-[120px]">{doc.name}</span>
                      <span className={`text-[9px] font-bold ${doc.verificationStatus === 'VERIFIED' ? 'text-emerald-300' : 'text-[#F5D061]'}`}>
                        ({doc.verificationStatus || 'PENDING'})
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-200 block mb-1">
                {isUr ? 'سپر ایڈمن ریمارکس' : 'Super Admin Remarks / Minute Entry'}
              </label>
              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={isUr ? 'قواعد کے تحت حتمی منظوری درج کی گئی...' : 'Final approval recorded under bylaws...'}
                className="w-full text-xs px-3 py-2 rounded-xl kc-luxury-input"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D4AF37]/20">
              <button
                type="button"
                onClick={() => setFinalApprovingApp(null)}
                className="px-3.5 py-2 text-xs text-slate-300 hover:text-white rounded-xl bg-[#090D16] border border-[#D4AF37]/20 cursor-pointer kc-pressable"
              >
                {isUr ? 'منسوخ کریں' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSuperAdminFinalSubmit}
                className="px-4 py-2 kc-gold-button text-xs font-bold rounded-xl cursor-pointer"
              >
                {isUr ? 'حتمی منظوری کی تصدیق کریں' : 'Confirm Final Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION TOOLBAR WHEN ITEMS ARE SELECTED */}
      {selectedIds.length > 0 && (
        <aside 
          aria-label="Bulk action bar" 
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[calc(100%-1.5rem)] kc-luxury-modal text-white rounded-2xl px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#131C31] text-[#38BDF8] font-bold text-xs border border-[#38BDF8]/50 tabular-nums">
              {selectedIds.length}
            </div>
            <div>
              <p className="text-xs font-semibold text-white tabular-nums">
                {isUr
                  ? `${selectedIds.length} درخواستیں منتخب`
                  : `${selectedIds.length} ${selectedIds.length === 1 ? 'application' : 'applications'} selected`}
              </p>
              <p className="text-[11px] text-slate-300">
                {isUr ? 'اجتماعی کارروائی کے لیے تیار' : 'Ready for bulk processing'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              {isUr ? 'صاف کریں' : 'Clear'}
            </button>

            <button
              onClick={() => {
                setBulkRemarks(
                  isDistrictAdmin 
                    ? (isUr ? 'اجتماعی مستردگی: ضلعی فیلڈ تصدیق کے معیار پر پورا نہیں اتری۔' : 'Bulk rejection: Did not satisfy district field verification criteria.')
                    : (isUr ? 'اجتماعی مستردگی: مرکزی قواعد کے مطابق نہیں۔' : 'Bulk rejection: Central bylaws non-compliance.')
                );
                setBulkAction('REJECT');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-500/50 text-rose-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer kc-pressable"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{isUr ? 'سب مسترد کریں' : 'Bulk Reject'}</span>
            </button>

            <button
              onClick={() => {
                setBulkRemarks(
                  isDistrictAdmin 
                    ? (isUr ? 'اجتماعی ضلعی سفارش: پتہ اور کوائف کی تصدیق ہو گئی۔' : 'Bulk district recommendation: Address and credentials verified.')
                    : (isUr ? 'کفایت کنیکٹ کے قواعد کے تحت اجتماعی حتمی منظوری دے دی گئی۔' : 'Bulk final approval granted under Kifayat Connect bylaws.')
                );
                setBulkAction('APPROVE');
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 kc-gold-button text-xs font-bold rounded-xl cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {isUr
                  ? (isDistrictAdmin ? 'اجتماعی سفارش' : 'سب منظور کریں')
                  : `Bulk ${isDistrictAdmin ? 'Recommend' : 'Approve'}`}
              </span>
            </button>
          </div>
        </aside>
      )}

      {/* MODAL: BULK APPROVE / REJECT CONFIRMATION */}
      {bulkAction && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-[#090D16]/85 p-3 sm:p-4 overflow-y-auto">
          <div
            className="kc-luxury-modal rounded-2xl p-5 sm:p-6 max-w-lg w-full space-y-4 my-auto max-h-[92dvh] overflow-y-auto text-slate-100"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div>
              <span className={`text-xs uppercase font-bold tracking-wide tabular-nums ${bulkAction === 'APPROVE' ? 'text-emerald-300' : 'text-rose-300'}`}>
                {isUr ? `اجتماعی تصدیق · ${selectedIds.length} درخواستیں` : `Bulk Confirmation · ${selectedIds.length} Applications`}
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                {bulkAction === 'APPROVE' 
                  ? (isDistrictAdmin
                      ? (isUr ? 'اجتماعی ضلعی سفارش' : 'Bulk District Recommendation')
                      : (isUr ? 'اجتماعی حتمی منظوری اور کارڈ کا اجراء' : 'Bulk Final Approval & Card Generation'))
                  : (isUr ? 'درخواستوں کی اجتماعی مستردگی' : 'Bulk Rejection of Applications')}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {bulkAction === 'APPROVE'
                  ? (isUr
                      ? `کیا آپ واقعی منتخب کردہ ${selectedIds.length} ممبرشپ درخواستوں کو ایک ساتھ منظور کرنا چاہتے ہیں؟`
                      : `Are you sure you want to approve ${selectedIds.length} selected membership applications in a single action?`)
                  : (isUr
                      ? `کیا آپ واقعی منتخب کردہ ${selectedIds.length} درخواستوں کو مسترد کرنا چاہتے ہیں؟`
                      : `Are you sure you want to reject ${selectedIds.length} selected applications? This action will update applicant statuses.`)}
              </p>
            </div>

            <div className="max-h-36 overflow-y-auto p-2.5 rounded-xl bg-[#090D16] border border-[#D4AF37]/25 space-y-1 text-xs">
              {applications.filter(a => selectedIds.includes(a.id)).map(a => (
                <div key={a.id} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[#111726] border border-[#D4AF37]/20">
                  <span className="font-semibold text-white">{a.applicantName}</span>
                  <span className="text-[10px] text-slate-300 font-mono tabular-nums">{a.cnic} · {a.district || a.region}</span>
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-200 block mb-1">
                {bulkAction === 'APPROVE'
                  ? (isUr ? 'تصدیقی / منظوری کے ریمارکس' : 'Verification / Approval Remarks')
                  : (isUr ? 'مسترد کرنے کی وجہ' : 'Reason for Rejection')}
              </label>
              <textarea
                rows={3}
                value={bulkRemarks}
                onChange={(e) => setBulkRemarks(e.target.value)}
                placeholder={isUr ? 'آڈٹ لاگ میں ریکارڈ کرنے کے لیے سرکاری ریمارکس درج کریں...' : 'Enter official remarks to be recorded in audit log...'}
                className="w-full text-xs p-2.5 rounded-xl kc-luxury-input resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D4AF37]/20">
              <button
                type="button"
                disabled={isProcessingBulk}
                onClick={() => setBulkAction(null)}
                className="px-3.5 py-2 text-xs text-slate-300 hover:text-white rounded-xl bg-[#090D16] border border-[#D4AF37]/20 disabled:opacity-50 cursor-pointer kc-pressable"
              >
                {isUr ? 'منسوخ کریں' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isProcessingBulk}
                onClick={handleBulkSubmit}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 ${
                  bulkAction === 'APPROVE' 
                    ? 'kc-gold-button' 
                    : 'bg-rose-950 hover:bg-rose-900 border border-rose-500/50 text-rose-200 kc-pressable'
                }`}
              >
                {isProcessingBulk ? (
                  <span>{isUr ? 'پراسیس ہو رہا ہے...' : 'Processing...'}</span>
                ) : (
                  <>
                    {bulkAction === 'APPROVE' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span>
                      {bulkAction === 'APPROVE'
                        ? (isUr ? 'منظوری کی تصدیق کریں' : 'Confirm Approval')
                        : (isUr ? 'مسترد کرنے کی تصدیق کریں' : 'Confirm Rejection')}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUPPORTING DOCUMENT UPLOAD & AUDIT VIEWER */}
      {activeDocAppId && (() => {
        const targetApp = applications.find(a => a.id === activeDocAppId);
        if (!targetApp) return null;
        return (
          <DocumentUploadModal
            application={targetApp}
            onClose={() => setActiveDocAppId(null)}
          />
        );
      })()}

      {isSuperAdmin && (
        <OldPaperRecordModal
          isOpen={isOldPaperModalOpen}
          onClose={() => setIsOldPaperModalOpen(false)}
        />
      )}
    </div>
  );
};
