import React, { useState } from 'react';
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
  Eye
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
import { LuxurySelect } from '../common/LuxurySelect';

export const ApprovalWorkflow: React.FC = () => {
  const { 
    currentUser, 
    applications, 
    recommendApplication, 
    finalApproveApplication, 
    rejectApplication,
    language 
  } = useApp();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isDistrictAdmin = currentUser?.role === 'ADMIN';

  const [activeTabFilter, setActiveTabFilter] = useState<'PENDING_REGIONAL' | 'RECOMMENDED' | 'ACTIVE' | 'REJECTED'>(
    isSuperAdmin ? 'RECOMMENDED' : 'PENDING_REGIONAL'
  );

  const [filterProvince, setFilterProvince] = useState<string>('ALL');
  const [filterDistrict, setFilterDistrict] = useState<string>('ALL');

  // Recommendation interaction state (District Admin)
  const [reviewingApp, setReviewingApp] = useState<MembershipApplication | null>(null);
  const [recommendationChoice, setRecommendationChoice] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [regionalNotes, setRegionalNotes] = useState('');

  // Final Approval interaction state (Super Admin)
  const [finalApprovingApp, setFinalApprovingApp] = useState<MembershipApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Supporting Documents Dossier modal state
  const [activeDocAppId, setActiveDocAppId] = useState<string | null>(null);

  // Bulk processing interaction state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [bulkRemarks, setBulkRemarks] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

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
    if (!reviewingApp || !regionalNotes.trim()) return;
    recommendApplication(reviewingApp.id, recommendationChoice, regionalNotes.trim());
    setReviewingApp(null);
    setRegionalNotes('');
  };

  const handleSuperAdminFinalSubmit = () => {
    if (!finalApprovingApp) return;
    finalApproveApplication(finalApprovingApp.id, adminNotes.trim() || undefined);
    setFinalApprovingApp(null);
    setAdminNotes('');
  };

  const handleBulkSubmit = async () => {
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

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Governance & Verification Pipeline
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-500">Separation of Powers Workflow</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Membership Multi-Tier Approval Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Stage 1: District Admin verification & recommendation → Stage 2: Super Admin final approval & ID issuance.
          </p>
        </div>

        {/* Workflow Diagram Banner */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">1</span>
            <span>Registration</span>
          </div>
          <span className="text-slate-400">→</span>
          <div className={`flex items-center gap-1.5 font-medium ${isDistrictAdmin ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-[10px] font-bold">2</span>
            <span>District Verify</span>
          </div>
          <span className="text-slate-400">→</span>
          <div className={`flex items-center gap-1.5 font-medium ${isSuperAdmin ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[10px] font-bold">3</span>
            <span>Super Admin Sign</span>
          </div>
          <span className="text-slate-400">→</span>
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">4</span>
            <span>ID Card Issued</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Location Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
          <button
            onClick={() => setActiveTabFilter('PENDING_REGIONAL')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTabFilter === 'PENDING_REGIONAL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Stage 1: Pending Review ({applications.filter(a => (isDistrictAdmin ? a.district === (currentUser.assignedDistrict || currentUser.district) : true) && ((a.status as any) === 'PENDING_REGIONAL_REVIEW' || (a.status as any) === 'PENDING_DISTRICT_REVIEW')).length})
          </button>

          <button
            onClick={() => setActiveTabFilter('RECOMMENDED')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTabFilter === 'RECOMMENDED'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Stage 2: Recommended ({applications.filter(a => (isDistrictAdmin ? a.district === (currentUser.assignedDistrict || currentUser.district) : true) && ((a.status as any) === 'RECOMMENDED_BY_REGION' || (a.status as any) === 'RECOMMENDED_BY_DISTRICT')).length})
          </button>

          <button
            onClick={() => setActiveTabFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTabFilter === 'ACTIVE'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Approved & Active
          </button>

          <button
            onClick={() => setActiveTabFilter('REJECTED')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTabFilter === 'REJECTED'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Rejected
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
              label="Province Filter"
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
              label="District Filter"
              options={[
                { value: 'ALL', label: 'All Districts' },
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
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
            <label className="flex items-center gap-2.5 font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span>
                Select All Eligible ({actionableVisibleApps.length})
              </span>
            </label>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {selectedIds.length} of {actionableVisibleApps.length} selected
                </span>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline underline-offset-2 ml-1"
                >
                  Deselect all
                </button>
              </div>
            )}
          </div>
        )}

        {visibleApplications.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
            No applications match this workflow stage and location filter.
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
                className={`p-5 bg-white dark:bg-slate-900 rounded-lg border transition-all space-y-3 ${
                  isSelected 
                    ? 'border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm' 
                    : 'border-slate-200 dark:border-slate-800 shadow-xs'
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
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {app.applicantName}
                        </h3>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded font-medium bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{dist}, {prov}</span>
                        </div>
                        {app.isOldMemberVerification && (
                          <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                            Legacy ID: {app.oldMembershipNo}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded ${
                          app.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : (app.status as any) === 'RECOMMENDED_BY_REGION' || (app.status as any) === 'RECOMMENDED_BY_DISTRICT'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : app.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                    </div>

                    {/* Administrative Location Hierarchy Breadcrumb */}
                    <div className="px-3 py-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Jurisdiction:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{app.country || 'Pakistan'}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{prov}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{dist}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-slate-700 dark:text-slate-300">Tehsil: {teh || 'General'}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-slate-700 dark:text-slate-300">City: {city || dist}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">UC: {uc || 'N/A'}</span>
                    </div>

                    {/* Applicant Credentials Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">National ID (CNIC)</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{app.cnic}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Phone Number</span>
                        <span className="text-slate-800 dark:text-slate-200">{app.phone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Email</span>
                        <span className="text-slate-800 dark:text-slate-200 truncate block">{app.email}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Submitted Date</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">{new Date(app.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400">Residential Address: </span>
                      {app.address}
                    </p>

                    {/* Workflow Audit Stamp Section */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-1.5 text-xs">
                      {(app.districtRemarks || app.regionalRemarks) && (
                        <div className="p-2.5 rounded bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
                          <span className="font-semibold text-amber-800 dark:text-amber-300">
                            District Recommendation ({app.districtAdminName || app.regionalOfficerName || 'District Admin'}):
                          </span>
                          <p className="italic text-slate-700 dark:text-slate-300 mt-0.5">
                            "{app.districtRemarks || app.regionalRemarks}"
                          </p>
                        </div>
                      )}

                      {app.superAdminRemarks && (
                        <div className="p-2.5 rounded bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                          <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                            Super Admin Final Sign-Off:
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                            {app.superAdminRemarks} · Issued Membership ID: <span className="font-mono font-bold text-emerald-600">{app.generatedMembershipId}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Supporting Documents Dossier Section */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Paperclip className="w-3 h-3 text-amber-500" />
                          <span>Supporting Files:</span>
                        </span>

                        {(app.supportingDocuments && app.supportingDocuments.length > 0) ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {app.supportingDocuments.map(doc => (
                              <button
                                key={doc.id}
                                type="button"
                                onClick={() => setActiveDocAppId(app.id)}
                                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                                  doc.verificationStatus === 'VERIFIED'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                    : doc.verificationStatus === 'FLAGGED'
                                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                }`}
                                title={`${doc.name} (${doc.type}) - Click to inspect`}
                              >
                                <span>{doc.type === 'IDENTIFICATION_CNIC' ? '🪪' : doc.type === 'EXPENSE_RECEIPT' || doc.type === 'DEPOSIT_SLIP' ? '🧾' : '📄'}</span>
                                <span className="max-w-[120px] truncate">{doc.name}</span>
                                {doc.verificationStatus === 'VERIFIED' && <span className="text-emerald-600 font-bold">✓</span>}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            No documents attached yet
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveDocAppId(app.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 transition-colors"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          {app.supportingDocuments && app.supportingDocuments.length > 0 
                            ? `Manage Dossier (${app.supportingDocuments.length})` 
                            : '+ Attach Supporting Files'}
                        </span>
                      </button>
                    </div>

                    {/* Action Buttons depending on role & status */}
                    <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
                      {/* District Admin Action (Stage 1) */}
                      {isDistrictAdmin && ((app.status as any) === 'PENDING_REGIONAL_REVIEW' || (app.status as any) === 'PENDING_DISTRICT_REVIEW') && (
                        <button
                          onClick={() => {
                            setReviewingApp(app);
                            setRecommendationChoice('APPROVE');
                            setRegionalNotes('Residential address confirmed. Applicant background clean.');
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded shadow-xs transition-colors"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Submit District Recommendation</span>
                        </button>
                      )}

                      {/* Super Admin Action (Stage 2) */}
                      {isSuperAdmin && ((app.status as any) === 'RECOMMENDED_BY_REGION' || (app.status as any) === 'RECOMMENDED_BY_DISTRICT') && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => rejectApplication(app.id, 'Does not satisfy central bylaws criteria.')}
                            className="px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 rounded border border-rose-200 dark:border-rose-800"
                          >
                            Reject Application
                          </button>
                          <button
                            onClick={() => {
                              setFinalApprovingApp(app);
                              setAdminNotes('Final approval granted under Kifayat Connect bylaws.');
                            }}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded shadow-xs transition-colors"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Grant Final Approval & Issue ID</span>
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
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-950/85 p-3 sm:p-4 overflow-y-auto">
          <div
            className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 my-auto max-h-[92dvh] overflow-y-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div>
              <span className="text-xs text-amber-600 uppercase font-bold tracking-wide">
                Stage 1 Review: {reviewingApp.district || currentUser.district || 'District Jurisdiction'} ({reviewingApp.stateProvince || currentUser.stateProvince || 'Pakistan'})
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                Recommend {reviewingApp.applicantName}
              </h3>
              <p className="text-xs text-slate-500">
                District: <strong>{reviewingApp.district || 'General'}</strong> · Tehsil: <strong>{reviewingApp.tehsil || 'Central'}</strong> · UC: <strong>{reviewingApp.unionCouncil || 'UC-01'}</strong>
              </p>
            </div>

            {/* Supporting Dossier Quick Check */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-amber-500" />
                  <span>Supporting Documents:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveDocAppId(reviewingApp.id)}
                  className="text-amber-600 dark:text-amber-400 font-bold hover:underline text-[11px]"
                >
                  Manage Dossier ({reviewingApp.supportingDocuments?.length || 0})
                </button>
              </div>

              {(!reviewingApp.supportingDocuments || reviewingApp.supportingDocuments.length === 0) ? (
                <p className="text-[11px] text-slate-500 italic">No supporting documents uploaded yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {reviewingApp.supportingDocuments.map(doc => (
                    <span 
                      key={doc.id}
                      onClick={() => setActiveDocAppId(reviewingApp.id)}
                      className="cursor-pointer text-[10px] font-medium px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center gap-1 hover:border-amber-400"
                    >
                      <span>{doc.type === 'IDENTIFICATION_CNIC' ? '🪪' : '🧾'}</span>
                      <span className="truncate max-w-[100px]">{doc.name}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${doc.verificationStatus === 'VERIFIED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Recommendation:
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRecommendationChoice('APPROVE')}
                  className={`flex-1 py-2 text-xs font-bold rounded border transition-colors flex items-center justify-center gap-1.5 ${
                    recommendationChoice === 'APPROVE'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Recommend Approval</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecommendationChoice('REJECT')}
                  className={`flex-1 py-2 text-xs font-bold rounded border transition-colors flex items-center justify-center gap-1.5 ${
                    recommendationChoice === 'REJECT'
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Recommend Reject</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Field Verification Remarks
              </label>
              <textarea
                rows={3}
                required
                value={regionalNotes}
                onChange={(e) => setRegionalNotes(e.target.value)}
                placeholder="State how credentials and residential address were verified..."
                className="w-full text-xs p-2.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReviewingApp(null)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRegionalSubmit}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded shadow-xs"
              >
                Submit to Super Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUPER ADMIN FINAL APPROVAL DIALOG */}
      {finalApprovingApp && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-950/85 p-3 sm:p-4 overflow-y-auto">
          <div
            className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 my-auto max-h-[92dvh] overflow-y-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div>
              <span className="text-xs text-emerald-600 uppercase font-bold tracking-wide">
                Final Authorization Authority
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                Issue Official Membership Card
              </h3>
              <p className="text-xs text-slate-500">
                Grant final approval for {finalApprovingApp.applicantName} ({finalApprovingApp.district || finalApprovingApp.region}, {finalApprovingApp.stateProvince || 'Pakistan'}). A digital membership card with unique ID will be instantly generated.
              </p>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded border border-amber-200 dark:border-amber-800 text-xs">
              <span className="font-semibold text-amber-800 dark:text-amber-300">
                District Recommendation On File:
              </span>
              <p className="italic text-slate-700 dark:text-slate-300 mt-0.5">
                "{finalApprovingApp.districtRemarks || finalApprovingApp.regionalRemarks || 'Field review submitted.'}"
              </p>
              <span className="block text-[10px] text-slate-500 not-italic mt-1">
                Verified by: {finalApprovingApp.districtAdminName || finalApprovingApp.regionalOfficerName || 'District Admin'}
              </span>
            </div>

            {/* Supporting Dossier Quick Check */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>Dossier Verification Audit:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveDocAppId(finalApprovingApp.id)}
                  className="text-amber-600 dark:text-amber-400 font-bold hover:underline text-[11px]"
                >
                  Inspect All ({finalApprovingApp.supportingDocuments?.length || 0})
                </button>
              </div>

              {(!finalApprovingApp.supportingDocuments || finalApprovingApp.supportingDocuments.length === 0) ? (
                <p className="text-[11px] text-slate-500 italic">No supporting documents uploaded yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {finalApprovingApp.supportingDocuments.map(doc => (
                    <span 
                      key={doc.id}
                      onClick={() => setActiveDocAppId(finalApprovingApp.id)}
                      className="cursor-pointer text-[10px] font-medium px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center gap-1 hover:border-amber-400"
                    >
                      <span>{doc.type === 'IDENTIFICATION_CNIC' ? '🪪' : '🧾'}</span>
                      <span className="truncate max-w-[120px]">{doc.name}</span>
                      <span className={`text-[9px] font-bold ${doc.verificationStatus === 'VERIFIED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        ({doc.verificationStatus || 'PENDING'})
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Super Admin Remarks / Minute Entry
              </label>
              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Final approval recorded under bylaws..."
                className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setFinalApprovingApp(null)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSuperAdminFinalSubmit}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded shadow-xs"
              >
                Confirm Final Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION TOOLBAR WHEN ITEMS ARE SELECTED */}
      {selectedIds.length > 0 && (
        <aside 
          aria-label="Bulk action bar" 
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[calc(100%-1.5rem)] bg-slate-900 text-white shadow-2xl rounded-2xl px-4 sm:px-5 py-3.5 border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
              {selectedIds.length}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-100">
                {selectedIds.length} {selectedIds.length === 1 ? 'application' : 'applications'} selected
              </p>
              <p className="text-[11px] text-slate-400">
                Ready for bulk processing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded transition-colors"
            >
              Clear
            </button>

            <button
              onClick={() => {
                setBulkRemarks(
                  isDistrictAdmin 
                    ? 'Bulk rejection: Did not satisfy district field verification criteria.'
                    : 'Bulk rejection: Central bylaws non-compliance.'
                );
                setBulkAction('REJECT');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Bulk Reject</span>
            </button>

            <button
              onClick={() => {
                setBulkRemarks(
                  isDistrictAdmin 
                    ? 'Bulk district recommendation: Address and credentials verified.'
                    : 'Bulk final approval granted under Kifayat Connect bylaws.'
                );
                setBulkAction('APPROVE');
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Bulk {isDistrictAdmin ? 'Recommend' : 'Approve'}</span>
            </button>
          </div>
        </aside>
      )}

      {/* MODAL: BULK APPROVE / REJECT CONFIRMATION */}
      {bulkAction && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-950/85 p-3 sm:p-4 overflow-y-auto">
          <div
            className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-auto max-h-[92dvh] overflow-y-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div>
              <span className={`text-xs uppercase font-bold tracking-wide ${bulkAction === 'APPROVE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                Bulk Confirmation · {selectedIds.length} Applications
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {bulkAction === 'APPROVE' 
                  ? (isDistrictAdmin ? 'Bulk District Recommendation' : 'Bulk Final Approval & Card Generation')
                  : 'Bulk Rejection of Applications'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {bulkAction === 'APPROVE'
                  ? `Are you sure you want to approve ${selectedIds.length} selected membership applications in a single action?`
                  : `Are you sure you want to reject ${selectedIds.length} selected applications? This action will update applicant statuses.`}
              </p>
            </div>

            <div className="max-h-36 overflow-y-auto p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
              {applications.filter(a => selectedIds.includes(a.id)).map(a => (
                <div key={a.id} className="flex items-center justify-between py-1 px-2 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{a.applicantName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{a.cnic} · {a.district || a.region}</span>
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {bulkAction === 'APPROVE' ? 'Verification / Approval Remarks' : 'Reason for Rejection'}
              </label>
              <textarea
                rows={3}
                value={bulkRemarks}
                onChange={(e) => setBulkRemarks(e.target.value)}
                placeholder="Enter official remarks to be recorded in audit log..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 resize-none text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isProcessingBulk}
                onClick={() => setBulkAction(null)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingBulk}
                onClick={handleBulkSubmit}
                className={`flex items-center gap-1.5 px-4 py-2 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors ${
                  bulkAction === 'APPROVE' 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'bg-rose-600 hover:bg-rose-700'
                } disabled:opacity-50`}
              >
                {isProcessingBulk ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    {bulkAction === 'APPROVE' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span>Confirm {bulkAction === 'APPROVE' ? 'Approval' : 'Rejection'}</span>
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
    </div>
  );
};
