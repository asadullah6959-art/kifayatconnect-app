import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Coins, 
  Receipt, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Printer, 
  TrendingUp, 
  ShieldCheck,
  Plus,
  Send,
  FileDown,
  Download
} from 'lucide-react';
import { FundCategory, PaymentMethod } from '../../types';
import { exportTransactionsToCSV } from '../../utils/exportUtils';
import { 
  PROVINCE_OPTIONS, 
  getDistrictsForProvince, 
  formatShortLocation, 
  mapLegacyRegionToHierarchy 
} from '../../data/locationData';
import { MapPin } from 'lucide-react';

export const FundsAndPayments: React.FC = () => {
  const { 
    currentUser, 
    payments, 
    verifyPayment, 
    submitPayment, 
    setSelectedReceipt, 
    language 
  } = useApp();

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isFinanceOfficer = currentUser.role === 'FINANCE_OFFICER';
  const isDistrictAdmin = currentUser.role === 'ADMIN';
  const isCoAdmin = currentUser.role === 'CO_ADMIN';
  const isMember = currentUser.role === 'MEMBER';

  const canVerify = isSuperAdmin || isFinanceOfficer;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterFund, setFilterFund] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterProvince, setFilterProvince] = useState<string>(
    isCoAdmin || isDistrictAdmin ? (currentUser.assignedStateProvince || currentUser.stateProvince || 'Punjab') : 'ALL'
  );
  const [filterDistrict, setFilterDistrict] = useState<string>(
    isDistrictAdmin ? (currentUser.assignedDistrict || currentUser.district || 'Lahore') : 'ALL'
  );

  // Submit payment modal (for Members or manual desk entry)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(2500);
  const [payFund, setPayFund] = useState<FundCategory>('Monthly Contribution');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Bank Transfer (Meezan/HBL)');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Scoped transactions
  const visibleTransactions = payments.filter(p => {
    if (isMember) return p.userId === currentUser.id;
    if (isDistrictAdmin) {
      const myDist = currentUser.assignedDistrict || currentUser.district;
      const txDist = p.district || mapLegacyRegionToHierarchy(p.userRegion).district;
      return txDist === myDist || p.userRegion === currentUser.region;
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

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payRef.trim() || payAmount <= 0) return;

    submitPayment({
      amount: Number(payAmount),
      fundCategory: payFund,
      paymentMethod: payMethod,
      referenceNumber: payRef.trim(),
      proofNote: payNotes.trim() || undefined
    });

    setIsSubmitModalOpen(false);
    setPayRef('');
    setPayNotes('');
  };

  const [downloadToast, setDownloadToast] = useState(false);

  const handleExportCSV = () => {
    exportTransactionsToCSV(
      filteredTransactions,
      currentUser,
      `Category: ${filterFund} · Status: ${filterStatus}`
    );
    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 2500);
  };

  const handlePrintLedger = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {downloadToast && (
        <div className="fixed top-5 right-5 z-50 pointer-events-none no-print">
          <div className="bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl border border-emerald-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">Branded financial ledger CSV downloaded!</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {isMember ? 'Personal Ledger' : isDistrictAdmin ? `${currentUser.assignedDistrict || currentUser.district} Funds` : isCoAdmin ? `${currentUser.assignedStateProvince || currentUser.stateProvince} Funds` : 'Central Treasury Ledger'}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-500">Audited Financial Contributions</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Coins className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Funds & Contributions Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {canVerify 
              ? 'Authorized to verify bank slips, clear transactions, and issue certified digital vouchers.' 
              : isDistrictAdmin 
              ? `District view-only summary of welfare contributions from ${currentUser.assignedDistrict || currentUser.district}.`
              : isCoAdmin
              ? `Provincial view-only summary of welfare contributions from ${currentUser.assignedStateProvince || currentUser.stateProvince}.`
              : 'Detailed history of your membership dues and welfare funds.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-md shadow-2xs transition-colors"
            title="Download CSV spreadsheet with organization headers"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintLedger}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-md shadow-2xs transition-colors"
            title="Print or Save PDF of the financial ledger"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit Payment / Contribution</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500 block">
            Total Verified Funds
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              PKR {totalVerifiedSum.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Cleared</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {verifiedPayments.length} verified transactions
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-amber-300 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/10">
          <span className="text-xs font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
            Pending Verifications
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-800 dark:text-amber-300 font-mono tabular-nums">
              PKR {pendingSum.toLocaleString()}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold font-mono">
              {pendingPayments.length} Queue
            </span>
          </div>
          <p className="text-[11px] text-amber-600/80 mt-1">
            {canVerify ? 'Awaiting Finance Officer review' : 'Under treasury audit'}
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500 block">
            Primary Fund Target
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              100%
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Audited</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            All receipts certified with digital stamp & QR hash
          </p>
        </div>
      </div>

      {/* Transactions Table & Filters (PRINTABLE & BRANDED) */}
      <div className="report-print-area bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 space-y-4 relative overflow-hidden">
        {/* Official Print Header for PDF Export */}
        <div className="hidden print:flex items-start justify-between border-b border-slate-300 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <img 
              src="/src/assets/images/kifayat_emblem_logo_1794225902501.jpg" 
              alt="Logo" 
              className="w-12 h-12 rounded-lg object-cover border border-emerald-600"
            />
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase">
                Kifayat Connect Welfare Trust
              </h2>
              <p className="text-xs text-slate-600">
                Official Financial Ledger & Audit Transactions Statement
              </p>
              <p className="text-[10px] text-slate-500">
                Generated By: {currentUser.name} ({currentUser.role} · {currentUser.region})
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-500 block">Trust Reg # ICT-8841-KC</span>
            <span className="text-xs font-mono font-bold text-emerald-700 block">NTN: 8492019-3</span>
            <span className="text-[10px] text-slate-500 block">Date: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 no-print">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Ledger Transactions
            </h3>
            <p className="text-xs text-slate-500">
              Filtered records with voucher numbers and verification signatures
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ref, member, district..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-44 sm:w-56"
              />
            </div>

            <select
              value={filterFund}
              onChange={(e) => setFilterFund(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
            >
              <option value="ALL">All Categories</option>
              <option value="Monthly Contribution">Monthly Contribution</option>
              <option value="Annual Welfare Fund">Annual Welfare Fund</option>
              <option value="Emergency Relief">Emergency Relief</option>
              <option value="Zakat & Sadqah">Zakat & Sadqah</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {!isDistrictAdmin && !isCoAdmin && (
              <>
                <select
                  value={filterProvince}
                  onChange={(e) => {
                    setFilterProvince(e.target.value);
                    setFilterDistrict('ALL');
                  }}
                  className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
                >
                  <option value="ALL">All Provinces</option>
                  {PROVINCE_OPTIONS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                <select
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
                >
                  <option value="ALL">All Districts</option>
                  {(filterProvince !== 'ALL'
                    ? getDistrictsForProvince(filterProvince)
                    : Object.values(PROVINCE_OPTIONS).flatMap(p => getDistrictsForProvince(p))
                  ).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 font-medium">
                <th className="py-2.5 px-3">Receipt No.</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Member & Administrative Location</th>
                <th className="py-2.5 px-3">Fund Category</th>
                <th className="py-2.5 px-3">Payment Method & Ref</th>
                <th className="py-2.5 px-3 text-right">Amount (PKR)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No transactions match your search filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const fallback = mapLegacyRegionToHierarchy(tx.userRegion);
                  const prov = tx.stateProvince || fallback.stateProvince;
                  const dist = tx.district || fallback.district;
                  const teh = tx.tehsil || fallback.tehsil;
                  const uc = tx.unionCouncil || fallback.unionCouncil;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {tx.receiptNumber}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {tx.date}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block">{tx.userName}</span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                          <span>{dist}, {prov}</span>
                        </div>
                        {(teh || uc) && (
                          <span className="text-[9px] text-slate-400 block">
                            Tehsil: {teh || 'General'}{uc ? ` · UC: ${uc}` : ''}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-medium">
                        {tx.fundCategory}
                      </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      <div>{tx.paymentMethod}</div>
                      <div className="text-[10px] font-mono text-slate-400">Ref: {tx.referenceNumber}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                      {tx.amount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        tx.status === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : tx.status === 'PENDING_VERIFICATION'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {tx.status === 'VERIFIED' ? (
                        <button
                          onClick={() => setSelectedReceipt(tx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium transition-colors"
                        >
                          <Printer className="w-3 h-3 text-emerald-600" />
                          <span>Receipt</span>
                        </button>
                      ) : canVerify && tx.status === 'PENDING_VERIFICATION' ? (
                        <button
                          onClick={() => verifyPayment(tx.id, true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verify</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">In Verification</span>
                      )}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Printable Footer with Official Verification Seal (PDF only) */}
        <div className="hidden print:flex items-center justify-between border-t border-slate-300 pt-4 mt-4 text-xs">
          <div className="flex items-center gap-3">
            <img 
              src="/src/assets/images/receipt_watermark_seal_1794225904149.jpg" 
              alt="Seal" 
              className="w-12 h-12 rounded-full object-cover border border-emerald-600"
            />
            <div>
              <p className="font-semibold text-slate-800">Kifayat Connect Treasury Verification</p>
              <p className="text-[10px] text-slate-500">Document certified for legal and tax auditing purposes</p>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-500 font-mono">
            <span>AUDITED LEDGER VOUCHER · NTN 8492019-3</span>
          </div>
        </div>
      </div>

      {/* Manual Payment Submission Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 my-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Record Welfare Contribution / Payment
            </h3>

            <form onSubmit={handleManualSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Fund Purpose / Category
                </label>
                <select
                  value={payFund}
                  onChange={(e) => setPayFund(e.target.value as FundCategory)}
                  className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Monthly Contribution">Monthly Contribution</option>
                  <option value="Annual Welfare Fund">Annual Welfare Fund</option>
                  <option value="Emergency Relief">Emergency Relief</option>
                  <option value="Zakat & Sadqah">Zakat & Sadqah</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Amount (PKR)
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    step={100}
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full text-xs font-mono font-bold px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Payment Gateway
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                    className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Bank Transfer (Meezan/HBL)">Bank Transfer (Meezan/HBL)</option>
                    <option value="Raast Instant ID">Raast Instant ID (P2P)</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Cash Voucher">Cash Voucher</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Bank Reference ID / Voucher Slip Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PK-RAAST-2026-991827"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Payer Remarks / Detail Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deposited via mobile app banking"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
