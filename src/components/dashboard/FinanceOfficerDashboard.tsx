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
  FileCheck,
  ShieldAlert,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { mapLegacyRegionToHierarchy } from '../../data/locationData';
import { PaymentTransaction } from '../../types';

export const FinanceOfficerDashboard: React.FC = () => {
  const { 
    payments, 
    verifyPayment, 
    setSelectedReceipt, 
    language
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [rejectingTxId, setRejectingTxId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [previewTx, setPreviewTx] = useState<PaymentTransaction | null>(null);

  const pendingPayments = payments.filter(p => p.status === 'PENDING_VERIFICATION');
  const verifiedPayments = payments.filter(p => p.status === 'VERIFIED');

  // Today verified sum
  const todayStr = new Date().toISOString().split('T')[0];
  const todayVerified = verifiedPayments
    .filter(p => p.date === todayStr)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pendingTotalAmount = pendingPayments.reduce((acc, curr) => acc + curr.amount, 0);
  
  const monthlyTotal = verifiedPayments
    .filter(p => p.fundCategory === 'Monthly Contribution')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const annualTotal = verifiedPayments
    .filter(p => p.fundCategory === 'Annual Welfare Fund')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Filtered transactions for the search list
  const filteredTransactions = payments.filter(tx => {
    const fb = mapLegacyRegionToHierarchy(tx.userRegion);
    const tDist = tx.district || fb.district;
    const tProv = tx.stateProvince || fb.stateProvince;

    const matchesSearch = 
      tx.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.userMembershipId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tDist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tProv.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'ALL' || tx.fundCategory === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleConfirmReject = (txId: string) => {
    if (!rejectReason.trim()) return;
    verifyPayment(txId, false, rejectReason);
    setRejectingTxId(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Finance Officer Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {language === 'ur' ? 'مالیاتی شعبہ' : 'Finance Treasury Authority'}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-500">Central Accounts, Receipts & Verifications</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {language === 'ur' ? 'مالیاتی افسر ڈیش بورڈ' : 'Finance Officer Dashboard'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict jurisdiction: Verify incoming member payments, issue certified receipts, and maintain financial books.
          </p>
        </div>

        {/* Role Restriction Banner */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Role boundary: Financial authority only. Membership approvals restricted.</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Verified */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Today's Verified</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              PKR {todayVerified.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Cleared</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Directly credited to welfare operations
          </div>
        </div>

        {/* Pending Verification Queue */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-amber-300 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/10">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Verification</span>
            <Receipt className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {pendingPayments.length} Requests
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium font-mono">
              PKR {pendingTotalAmount.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
            Requires Finance verification sign-off
          </div>
        </div>

        {/* Monthly Contributions Total */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Monthly Contributions</span>
            <Coins className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              PKR {monthlyTotal.toLocaleString()}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Active</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Recurring monthly subscription pool
          </div>
        </div>

        {/* Annual Welfare Fund */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Annual Welfare Fund</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              PKR {annualTotal.toLocaleString()}
            </span>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Audited</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Dispensaries, scholarships & ration drives
          </div>
        </div>
      </div>

      {/* PRIORITY QUEUE: Pending Payment Verification */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-500" />
              Incoming Payment Verification Queue
            </h3>
            <p className="text-xs text-slate-500">
              Cross-verify bank deposit slips, Raast IDs, or JazzCash references before certifying official receipt
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
            {pendingPayments.length} Awaiting Verification
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {pendingPayments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              All payment submissions have been verified. Zero pending items in treasury queue!
            </div>
          ) : (
            pendingPayments.map(tx => (
              <div 
                key={tx.id}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-blue-400 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {tx.userName}
                      </span>
                      <span className="text-xs font-mono text-slate-500">({tx.userMembershipId})</span>
                      <span className="text-[10px] text-slate-400">· {tx.district || mapLegacyRegionToHierarchy(tx.userRegion).district}, {tx.stateProvince || mapLegacyRegionToHierarchy(tx.userRegion).stateProvince}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400">Fund: </span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{tx.fundCategory}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Gateway: </span>
                        <span className="font-medium">{tx.paymentMethod}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Ref / Slip: </span>
                        <span className="font-mono text-slate-900 dark:text-slate-100 font-semibold">{tx.referenceNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Date: </span>
                        <span className="font-mono">{tx.date}</span>
                      </div>
                    </div>

                    {tx.proofNote && (
                      <p className="text-[11px] text-slate-500 italic mt-1 bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-800">
                        Payer Note: "{tx.proofNote}"
                      </p>
                    )}

                    {tx.receiptImageUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewTx(tx)}
                        className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>View Uploaded Receipt Photo</span>
                      </button>
                    )}
                  </div>

                  {/* Actions & Amount */}
                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <span className="text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                      PKR {tx.amount.toLocaleString()}
                    </span>

                    {rejectingTxId === tx.id ? (
                      <div className="space-y-2 w-full sm:w-64">
                        <input
                          type="text"
                          placeholder="State rejection reason..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 rounded border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleConfirmReject(tx.id)}
                            className="px-2.5 py-1 text-[11px] bg-rose-600 text-white font-medium rounded hover:bg-rose-700"
                          >
                            Confirm Reject
                          </button>
                          <button
                            onClick={() => setRejectingTxId(null)}
                            className="px-2.5 py-1 text-[11px] text-slate-500 hover:text-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setRejectingTxId(tx.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded border border-rose-200 dark:border-rose-900 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>

                        <button
                          onClick={() => verifyPayment(tx.id, true)}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded shadow-xs transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify & Issue Receipt</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Financial Transactions Search & Verified Receipts Ledger */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Financial Transaction Ledger & Receipts
            </h3>
            <p className="text-xs text-slate-500">
              Search by receipt number, reference slip, or member name
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ledger..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-48 sm:w-64"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
            >
              <option value="ALL">All Funds</option>
              <option value="Monthly Contribution">Monthly</option>
              <option value="Annual Welfare Fund">Annual</option>
              <option value="Emergency Relief">Emergency</option>
              <option value="Zakat & Sadqah">Zakat</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-3">Receipt No.</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Member & ID</th>
                <th className="py-2.5 px-3">Fund Category</th>
                <th className="py-2.5 px-3">Payment Method</th>
                <th className="py-2.5 px-3 text-right">Amount (PKR)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {tx.receiptNumber}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                    {tx.date}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 block">{tx.userName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {tx.userMembershipId} · {tx.district || mapLegacyRegionToHierarchy(tx.userRegion).district}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-medium">
                    {tx.fundCategory}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                    <span>{tx.paymentMethod}</span>
                    <span className="block text-[10px] text-slate-400 font-mono">Ref: {tx.referenceNumber}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                    {tx.amount.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      tx.status === 'VERIFIED'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : tx.status === 'PENDING_VERIFICATION'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                    }`}>
                      {tx.status === 'VERIFIED' ? 'Approved' : tx.status === 'PENDING_VERIFICATION' ? 'Pending' : 'Rejected'}
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
                    ) : tx.receiptImageUrl ? (
                      <button
                        onClick={() => setPreviewTx(tx)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-amber-600 hover:underline font-medium"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>Proof</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Image Lightbox Modal */}
      {previewTx && previewTx.receiptImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  Payment Proof · {previewTx.receiptNumber}
                </h4>
                <p className="text-[11px] text-slate-500 truncate">
                  {previewTx.userName} · PKR {previewTx.amount.toLocaleString()} ({previewTx.paymentMethod})
                </p>
              </div>
              <button
                onClick={() => setPreviewTx(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950 flex justify-center">
              <img
                src={previewTx.receiptImageUrl}
                alt={previewTx.receiptImageName || 'Payment Receipt'}
                className="max-h-[65vh] rounded-lg object-contain border border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
