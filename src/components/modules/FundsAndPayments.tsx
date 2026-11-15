import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Coins,
  CheckCircle2,
  XCircle,
  Search,
  Printer,
  Plus,
  Send,
  FileDown,
  MapPin,
  Upload,
  Image as ImageIcon,
  Eye,
  X,
  ArrowRight,
  ArrowLeft,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { FundCategory, PaymentMethod, PaymentTransaction } from '../../types';
import { exportTransactionsToCSV } from '../../utils/exportUtils';
import {
  PROVINCE_OPTIONS,
  getDistrictsForProvince,
  mapLegacyRegionToHierarchy
} from '../../data/locationData';
import { compressImageFile } from '../../utils/imageCompression';
import { LuxurySelect } from '../common/LuxurySelect';
import { ProfileCompletionGate, needsProfileCompletion } from '../common/ProfileCompletionGate';

const PAYMENT_METHODS: Array<{ id: PaymentMethod; label: string; hint: string }> = [
  { id: 'EasyPaisa', label: 'EasyPaisa', hint: 'Mobile Wallet / Till' },
  { id: 'JazzCash', label: 'JazzCash', hint: 'Mobile Account' },
  { id: 'Bank Transfer', label: 'Bank Transfer', hint: 'IBFT / Raast / Bank' },
  { id: 'Cash', label: 'Cash', hint: 'District Office / Receipt' }
];

export const FundsAndPayments: React.FC = () => {
  const {
    currentUser,
    payments,
    verifyPayment,
    submitPayment,
    setSelectedReceipt,
    openCompleteProfileModal
  } = useApp();
  const requiresProfileCompletion = needsProfileCompletion(currentUser);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAuditOfficer = Boolean(currentUser?.isAuditOfficer);
  const hasFullAuditView = isSuperAdmin || isAuditOfficer;
  const isDistrictAdmin = currentUser?.role === 'ADMIN';
  const isCoAdmin = currentUser?.role === 'CO_ADMIN';
  const isMember = currentUser?.role === 'MEMBER';
  const canVerify = isSuperAdmin || isDistrictAdmin || Boolean(currentUser?.permissions?.canVerifyPayments);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterFund, setFilterFund] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterProvince, setFilterProvince] = useState<string>(
    !hasFullAuditView && (isCoAdmin || isDistrictAdmin)
      ? (currentUser?.assignedStateProvince || currentUser?.stateProvince || 'ALL')
      : 'ALL'
  );
  const [filterDistrict, setFilterDistrict] = useState<string>(
    !hasFullAuditView && isDistrictAdmin
      ? (currentUser?.assignedDistrict || currentUser?.district || 'ALL')
      : 'ALL'
  );

  // 3-Step Payment Submission Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payFund, setPayFund] = useState<FundCategory>('Monthly Contribution');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('EasyPaisa');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [receiptImageUrl, setReceiptImageUrl] = useState<string>('');
  const [receiptImageName, setReceiptImageName] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Preview / Reject modals
  const [previewTx, setPreviewTx] = useState<PaymentTransaction | null>(null);
  const [rejectTxId, setRejectTxId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [downloadToast, setDownloadToast] = useState(false);

  if (!currentUser) return null;

  const visibleTransactions = payments.filter(p => {
    if (isAuditOfficer || isSuperAdmin) return true;
    if (isMember) return p.userId === currentUser.id;
    if (isDistrictAdmin) {
      const myDist = currentUser.assignedDistrict || currentUser.district;
      const txDist = p.district || mapLegacyRegionToHierarchy(p.userRegion).district;
      return txDist === myDist;
    }
    if (isCoAdmin) {
      const myProv = currentUser.assignedStateProvince || currentUser.stateProvince;
      const txProv = p.stateProvince || mapLegacyRegionToHierarchy(p.userRegion).stateProvince;
      return txProv === myProv;
    }
    return true;
  });

  const filteredTransactions = visibleTransactions.filter(tx => {
    const fallback = mapLegacyRegionToHierarchy(tx.userRegion);
    const txProv = tx.stateProvince || fallback.stateProvince;
    const txDist = tx.district || fallback.district;

    const matchesSearch =
      tx.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txDist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txProv.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFund = filterFund === 'ALL' || tx.fundCategory === filterFund;
    const matchesStatus = filterStatus === 'ALL' || tx.status === filterStatus;
    const matchesProvince = filterProvince === 'ALL' || txProv === filterProvince;
    const matchesDistrict = filterDistrict === 'ALL' || txDist === filterDistrict;

    return matchesSearch && matchesFund && matchesStatus && matchesProvince && matchesDistrict;
  });

  const verifiedPayments = visibleTransactions.filter(p => p.status === 'VERIFIED');
  const totalVerifiedSum = verifiedPayments.reduce((acc, curr) => acc + curr.amount, 0);
  const pendingPayments = visibleTransactions.filter(p => p.status === 'PENDING_VERIFICATION');
  const pendingSum = pendingPayments.reduce((acc, curr) => acc + curr.amount, 0);

  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image exceeds 10MB limit. Please choose a smaller photo.');
      return;
    }
    setUploadError(null);
    setIsCompressing(true);
    try {
      const compressed = await compressImageFile(file, 1024, 0.75, 750 * 1024);
      setReceiptImageUrl(compressed.dataUrl);
      setReceiptImageName(file.name);
    } catch (err: any) {
      setUploadError(err?.message || 'Unable to process selected receipt photo.');
    } finally {
      setIsCompressing(false);
    }
  };

  const resetPaymentModal = () => {
    setIsSubmitModalOpen(false);
    setStep(1);
    setPayAmount('');
    setPayFund('Monthly Contribution');
    setPayMethod('EasyPaisa');
    setPayRef('');
    setPayNotes('');
    setReceiptImageUrl('');
    setReceiptImageName('');
    setUploadError(null);
  };

  const numericPayAmount = Number(payAmount);
  const isPayAmountValid = Boolean(payAmount.trim()) && Number.isFinite(numericPayAmount) && numericPayAmount > 0;

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPayAmountValid) return;

    const cleanRef =
      payRef.trim() ||
      `${payMethod.replace(/\s+/g, '').substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`;

    submitPayment({
      amount: Math.round(numericPayAmount),
      fundCategory: payFund,
      paymentMethod: payMethod,
      referenceNumber: cleanRef,
      proofNote: payNotes.trim() || undefined,
      receiptImageUrl: receiptImageUrl || undefined,
      receiptImageName: receiptImageName || undefined
    });

    resetPaymentModal();
  };

  const handleExportCSV = () => {
    exportTransactionsToCSV(
      filteredTransactions,
      currentUser,
      `Category: ${filterFund} · Status: ${filterStatus}`
    );
    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 2500);
  };

  const handleConfirmReject = () => {
    if (!rejectTxId) return;
    verifyPayment(rejectTxId, false, rejectReason.trim() || 'Receipt could not be verified.');
    setRejectTxId(null);
    setRejectReason('');
  };

  const renderStatusPill = (status: PaymentTransaction['status']) => {
    if (status === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-md font-bold bg-[#042920] text-emerald-300 border border-emerald-500/45">
          <CheckCircle2 className="w-3 h-3" />
          Approved
        </span>
      );
    }
    if (status === 'PENDING_VERIFICATION') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-md font-bold bg-[#D4AF37]/15 text-[#F5D061] border border-[#D4AF37]/45">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-md font-bold bg-rose-950/75 text-rose-300 border border-rose-500/45">
        <XCircle className="w-3 h-3" />
        Rejected
      </span>
    );
  };

  return (
    <div className="space-y-5 max-w-full">
      {downloadToast && (
        <div className="fixed top-5 right-5 z-50 pointer-events-none no-print">
          <div className="bg-[#090D16] text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl border border-[#D4AF37]/50 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">Financial ledger CSV downloaded!</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25 no-print">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#F5D061] uppercase tracking-wider">
              {isAuditOfficer && !isSuperAdmin
                ? 'Audit Officer Verification Ledger (Read-Only)'
                : isMember
                ? 'Personal Ledger'
                : isDistrictAdmin
                ? `${currentUser.assignedDistrict || currentUser.district} Funds`
                : isCoAdmin
                ? `${currentUser.assignedStateProvince || currentUser.stateProvince} Funds`
                : 'Central Treasury Ledger'}
            </span>
            <span className="text-[#D4AF37]/50">·</span>
            <span className="text-xs text-slate-400">Audited Welfare Contributions</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <Coins className="w-6 h-6 text-[#F5D061] shrink-0" />
            <span>Funds & Contributions</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {canVerify
              ? 'Review uploaded payment receipts, approve contributions, and issue certified vouchers.'
              : isAuditOfficer
              ? 'Read-only inspection of all member contributions and uploaded payment receipt proofs across Pakistan.'
              : 'Submit contributions in 3 simple steps with receipt upload and instant status tracking.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="kc-pressable flex items-center gap-1.5 px-3 py-2 bg-[#141B2D] hover:bg-[#1A233A] text-slate-200 border border-[#D4AF37]/40 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="kc-pressable flex items-center gap-1.5 px-3 py-2 bg-[#141B2D] hover:bg-[#1A233A] text-slate-200 border border-[#D4AF37]/40 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#F5D061]" />
            <span>Print</span>
          </button>

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
            <span>Submit Payment</span>
          </button>
        </div>
      </div>

      {requiresProfileCompletion && (
        <ProfileCompletionGate compact featureName="Contribution Payments" />
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="kc-obsidian-card p-4 rounded-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Approved Funds
          </span>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-xl sm:text-2xl font-extrabold text-white font-mono tabular-nums">
              PKR {totalVerifiedSum.toLocaleString()}
            </span>
            <span className="text-[11px] text-emerald-400 font-bold">Cleared</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
            {verifiedPayments.length} approved transactions
          </p>
        </div>

        <div className="kc-obsidian-card p-4 rounded-2xl !border-[#F5D061]/55">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#F5D061] block">
            Pending Verification
          </span>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-xl sm:text-2xl font-extrabold text-[#F5D061] font-mono tabular-nums">
              PKR {pendingSum.toLocaleString()}
            </span>
            <span className="text-[11px] text-[#F5D061] font-bold font-mono tabular-nums">
              {pendingPayments.length} Queue
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mt-1">
            {canVerify ? 'Awaiting officer verification' : 'Awaiting treasury approval'}
          </p>
        </div>

        <div className="kc-emerald-panel p-4 rounded-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block">
            Digital Ledger Integrity
          </span>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-xl sm:text-2xl font-extrabold text-white font-mono tabular-nums">
              {visibleTransactions.length}
            </span>
            <span className="text-[11px] text-[#F5D061] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Audited
            </span>
          </div>
          <p className="text-[11px] text-emerald-100/80 mt-1">
            Every approved payment issues an E-Receipt
          </p>
        </div>
      </div>

      {/* Filters + Ledger */}
      <div className="report-print-area kc-obsidian-card rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#D4AF37]/20 no-print">
          <div>
            <h3 className="text-sm font-bold text-[#F5D061]">
              Ledger Transactions
            </h3>
            <p className="text-xs text-slate-400">
              Receipt photos, reference numbers, and real-time approval status
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-[#F5D061] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ref, member, district..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="kc-luxury-input pl-8 pr-3 py-1.5 text-xs rounded-xl w-full sm:w-52"
              />
            </div>

            <div className="w-44">
              <LuxurySelect
                compact
                value={filterFund}
                onChange={setFilterFund}
                label="Fund Category"
                options={[
                  { value: 'ALL', label: 'All Categories' },
                  { value: 'Monthly Contribution', label: 'Monthly Contribution' },
                  { value: 'Annual Welfare Fund', label: 'Annual Welfare Fund' },
                  { value: 'Emergency Relief', label: 'Emergency Relief' },
                  { value: 'Zakat & Sadqah', label: 'Zakat & Sadqah' }
                ]}
              />
            </div>

            <div className="w-36">
              <LuxurySelect
                compact
                value={filterStatus}
                onChange={setFilterStatus}
                label="Status"
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'VERIFIED', label: 'Approved' },
                  { value: 'PENDING_VERIFICATION', label: 'Pending' },
                  { value: 'REJECTED', label: 'Rejected' }
                ]}
              />
            </div>

            {(hasFullAuditView || (!isDistrictAdmin && !isCoAdmin)) && (
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

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No transactions recorded yet. Tap "Submit Payment" to submit a contribution.
            </div>
          ) : (
            filteredTransactions.map(tx => {
              const fallback = mapLegacyRegionToHierarchy(tx.userRegion);
              const prov = tx.stateProvince || fallback.stateProvince;
              const dist = tx.district || fallback.district;

              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-xl border border-[#D4AF37]/35 bg-[#090D16] shadow-[inset_0_1px_0_rgba(252,227,138,0.08)] space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono font-bold text-xs text-[#F5D061] block">
                        {tx.receiptNumber}
                      </span>
                      <span className="text-xs font-semibold text-white block truncate">
                        {tx.userName} · {dist}, {prov}
                      </span>
                    </div>
                    {renderStatusPill(tx.status)}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#D4AF37]/15">
                    <div>
                      <span className="text-slate-300 block">{tx.paymentMethod}</span>
                      <span className="text-[10px] font-mono text-slate-400">Ref: {tx.referenceNumber}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono tabular-nums font-extrabold text-sm text-white">
                        PKR {tx.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block tabular-nums">{tx.date}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#D4AF37]/15">
                    {tx.receiptImageUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewTx(tx)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#F5D061] hover:underline cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Receipt Photo</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">No photo attached</span>
                    )}

                    <div className="flex items-center gap-1.5">
                      {tx.status === 'VERIFIED' && (
                        <button
                          onClick={() => setSelectedReceipt(tx)}
                          className="kc-pressable inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-[#141B2D] border border-[#D4AF37]/40 text-slate-100 rounded-md font-semibold cursor-pointer"
                        >
                          <Printer className="w-3 h-3 text-emerald-400" />
                          <span>E-Receipt</span>
                        </button>
                      )}
                      {canVerify && tx.status === 'PENDING_VERIFICATION' && (
                        <>
                          <button
                            onClick={() => verifyPayment(tx.id, true)}
                            className="kc-pressable inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-gradient-to-r from-[#063B2E] to-[#0B664F] border border-emerald-400/50 text-white rounded-md font-bold cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => setRejectTxId(tx.id)}
                            className="kc-pressable inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-rose-950/90 hover:bg-rose-900 border border-rose-500/45 text-rose-200 rounded-md font-semibold cursor-pointer"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-[#D4AF37]/25">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#D4AF37]/25 bg-[#090D16] text-[#F5D061] font-semibold">
                <th className="py-2.5 px-3">Receipt No.</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Member & Location</th>
                <th className="py-2.5 px-3">Fund Category</th>
                <th className="py-2.5 px-3">Method & Proof</th>
                <th className="py-2.5 px-3 text-right">Amount (PKR)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/15">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No transactions recorded yet. Submit a payment to get started.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const fallback = mapLegacyRegionToHierarchy(tx.userRegion);
                  const prov = tx.stateProvince || fallback.stateProvince;
                  const dist = tx.district || fallback.district;

                  return (
                    <tr key={tx.id} className="hover:bg-[#161F33]/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#F5D061]">
                        {tx.receiptNumber}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-300">
                        {tx.date}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-white block">{tx.userName}</span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-[#D4AF37] shrink-0" />
                          <span>{dist}, {prov}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-emerald-400 font-medium">
                        {tx.fundCategory}
                      </td>
                      <td className="py-2.5 px-3 text-slate-200">
                        <div className="flex items-center gap-2">
                          {tx.receiptImageUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewTx(tx)}
                              className="shrink-0 w-8 h-8 rounded border border-[#D4AF37]/50 overflow-hidden hover:opacity-80 cursor-pointer"
                              title="View uploaded receipt photo"
                            >
                              <img src={tx.receiptImageUrl} alt="Receipt" className="w-full h-full object-cover" />
                            </button>
                          )}
                          <div>
                            <div className="font-medium text-white">{tx.paymentMethod}</div>
                            <div className="text-[10px] font-mono text-slate-400">Ref: {tx.referenceNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-white">
                        {tx.amount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {renderStatusPill(tx.status)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {tx.status === 'VERIFIED' ? (
                            <button
                              onClick={() => setSelectedReceipt(tx)}
                              className="kc-pressable inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-[#141B2D] hover:bg-[#1A233A] border border-[#D4AF37]/40 text-slate-100 rounded font-medium transition-colors cursor-pointer"
                            >
                              <Printer className="w-3 h-3 text-emerald-400" />
                              <span>Receipt</span>
                            </button>
                          ) : canVerify && tx.status === 'PENDING_VERIFICATION' ? (
                            <>
                              <button
                                onClick={() => verifyPayment(tx.id, true)}
                                className="kc-pressable inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-gradient-to-r from-[#063B2E] to-[#0B664F] border border-emerald-400/50 text-white rounded font-bold transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => setRejectTxId(tx.id)}
                                className="kc-pressable inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-rose-950/90 hover:bg-rose-900 border border-rose-500/45 text-rose-200 rounded font-medium transition-colors cursor-pointer"
                              >
                                <XCircle className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              {tx.status === 'REJECTED' ? tx.rejectionReason || 'Declined' : 'In Verification'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3-Step Payment Submission Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/85 p-3 sm:p-4 overflow-y-auto">
          <div
            className="kc-luxury-modal relative w-full max-w-lg rounded-2xl p-5 sm:p-6 my-auto max-h-[92dvh] overflow-y-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/25">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5D061]">
                  Step {step} of 3
                </span>
                <h3 className="text-base font-bold text-white">
                  Submit Welfare Contribution
                </h3>
              </div>
              <button
                type="button"
                onClick={resetPaymentModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#F5D061] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="grid grid-cols-3 gap-2 my-4">
              {[
                { num: 1, label: 'Amount' },
                { num: 2, label: 'Method' },
                { num: 3, label: 'Receipt' }
              ].map(item => (
                <div
                  key={item.num}
                  className={`py-1.5 px-2 rounded-lg text-center text-[11px] font-bold border ${
                    step === item.num
                      ? 'bg-[#D4AF37]/20 text-[#F5D061] border-[#D4AF37]'
                      : step > item.num
                      ? 'bg-[#042920] text-emerald-300 border-emerald-500/45'
                      : 'bg-[#090D16] text-slate-400 border-[#D4AF37]/20'
                  }`}
                >
                  {item.num}. {item.label}
                </div>
              ))}
            </div>

            <form onSubmit={handleFinalSubmit} className="space-y-4">
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                      Fund Purpose / Category
                    </label>
                    <LuxurySelect
                      value={payFund}
                      onChange={(val) => setPayFund(val as FundCategory)}
                      label="Fund Purpose / Category"
                      options={[
                        { value: 'Monthly Contribution', label: 'Monthly Contribution' },
                        { value: 'Annual Welfare Fund', label: 'Annual Welfare Fund' },
                        { value: 'Emergency Relief', label: 'Emergency Relief' },
                        { value: 'Zakat & Sadqah', label: 'Zakat & Sadqah' }
                      ]}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                      Contribution Amount (PKR)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      step="any"
                      inputMode="numeric"
                      placeholder="Enter deposited amount in PKR"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="kc-luxury-input w-full text-sm font-mono tabular-nums font-bold px-3.5 py-2.5 rounded-xl"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={!isPayAmountValid}
                      onClick={() => setStep(2)}
                      className="kc-pressable kc-gold-button flex items-center gap-1.5 px-5 py-2.5 disabled:opacity-45 font-extrabold text-xs rounded-xl cursor-pointer"
                    >
                      <span>Next: Payment Method</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-200 block mb-2">
                      Select Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {PAYMENT_METHODS.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPayMethod(m.id)}
                          className={`kc-pressable p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            payMethod === m.id
                              ? 'bg-[#D4AF37]/15 border-[#F5D061] text-[#F5D061]'
                              : 'bg-[#090D16] border-[#D4AF37]/25 text-slate-200 hover:border-[#D4AF37]/55'
                          }`}
                        >
                          <div className="text-xs font-bold">{m.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{m.hint}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-200 block mb-1">
                      Transaction ID / Reference Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TID-84920192 (auto-generated for Cash if blank)"
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      className="kc-luxury-input w-full text-xs font-mono px-3 py-2.5 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-200 block mb-1">
                      Optional Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. April welfare contribution"
                      value={payNotes}
                      onChange={(e) => setPayNotes(e.target.value)}
                      className="kc-luxury-input w-full text-xs px-3 py-2.5 rounded-xl"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="kc-pressable flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-[#F5D061] cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="kc-pressable kc-gold-button flex items-center gap-1.5 px-5 py-2.5 font-extrabold text-xs rounded-xl cursor-pointer"
                    >
                      <span>Next: Upload Receipt</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-[#090D16] border border-[#D4AF37]/35 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block">{payFund} · {payMethod}</span>
                      <span className="font-mono tabular-nums font-bold text-[#F5D061]">
                        PKR {Math.round(numericPayAmount || 0).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#F5D061] border border-[#D4AF37]/35 font-bold">
                      Pending Approval
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                      Upload Payment Screenshot / Receipt Photo (Gallery or Camera)
                    </label>

                    <label className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-[#D4AF37]/45 hover:border-[#F5D061] bg-[#090D16] cursor-pointer transition-colors">
                      <Upload className="w-6 h-6 text-[#F5D061] mb-1.5" />
                      <span className="text-xs font-bold text-white">
                        {isCompressing ? 'Optimizing image...' : receiptImageUrl ? 'Change Receipt Photo' : 'Tap to Select or Capture Receipt'}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Supports up to 10MB · Auto-compressed for mobile
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptFileChange}
                        className="hidden"
                      />
                    </label>

                    {uploadError && (
                      <p className="text-xs text-rose-400 font-medium mt-1.5">{uploadError}</p>
                    )}

                    {receiptImageUrl && (
                      <div className="mt-3 p-2.5 rounded-xl kc-emerald-panel flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={receiptImageUrl}
                            alt="Receipt preview"
                            className="w-14 h-14 rounded-lg object-cover border border-[#D4AF37]/40 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white block truncate">
                              {receiptImageName || 'receipt.jpg'}
                            </span>
                            <span className="text-[10px] text-emerald-300 font-semibold">
                              Compressed & Ready
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptImageUrl('');
                            setReceiptImageName('');
                          }}
                          className="p-1.5 text-slate-300 hover:text-rose-400 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#D4AF37]/20">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="kc-pressable flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-[#F5D061] cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isCompressing || !isPayAmountValid}
                      className="kc-pressable flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-[#063B2E] to-[#0B664F] hover:brightness-110 disabled:opacity-50 text-[#F5D061] border border-[#D4AF37]/50 text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit for Approval</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Receipt Image Preview Modal */}
      {previewTx && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/85 p-3 sm:p-4 overflow-y-auto">
          <div className="kc-luxury-modal rounded-2xl max-w-md w-full p-4 space-y-3 my-auto max-h-[92dvh] overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="flex items-center justify-between pb-2 border-b border-[#D4AF37]/25">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#F5D061]" />
                  <span>{previewTx.receiptNumber} Proof</span>
                </h4>
                <p className="text-[11px] text-slate-400 tabular-nums">
                  {previewTx.userName} · PKR {previewTx.amount.toLocaleString()} ({previewTx.paymentMethod})
                </p>
              </div>
              <button
                onClick={() => setPreviewTx(null)}
                className="p-1 text-slate-300 hover:text-[#F5D061] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {previewTx.receiptImageUrl && (
              <img
                src={previewTx.receiptImageUrl}
                alt="Payment proof"
                className="w-full max-h-[60vh] object-contain rounded-xl bg-[#090D16] border border-[#D4AF37]/25"
              />
            )}
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectTxId && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/85 p-3 sm:p-4 overflow-y-auto">
          <div className="kc-luxury-modal rounded-2xl max-w-sm w-full p-5 space-y-3 my-auto">
            <h4 className="text-sm font-bold text-white">Reject Payment Proof</h4>
            <p className="text-xs text-slate-400">
              Provide a brief reason so the member can resubmit a valid receipt.
            </p>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Transaction ID mismatch or unclear receipt"
              className="kc-luxury-input w-full text-xs px-3 py-2.5 rounded-xl"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectTxId(null);
                  setRejectReason('');
                }}
                className="kc-pressable px-3 py-1.5 text-xs text-slate-300 hover:text-white font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="kc-pressable px-4 py-1.5 bg-rose-900 hover:bg-rose-800 border border-rose-500/50 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
