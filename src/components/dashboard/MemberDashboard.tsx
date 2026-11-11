import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CreditCard, 
  Coins, 
  Receipt, 
  MessageSquareWarning, 
  Megaphone, 
  ShieldCheck, 
  ArrowUpRight, 
  Plus, 
  QrCode, 
  Printer, 
  CheckCircle2, 
  Clock,
  IdCard,
  Send,
  Eye
} from 'lucide-react';
import { FundCategory, PaymentMethod, ComplaintCategory } from '../../types';
import { mapLegacyRegionToHierarchy } from '../../data/locationData';

export const MemberDashboard: React.FC = () => {
  const { 
    currentUser, 
    payments, 
    complaints, 
    announcements, 
    submitPayment, 
    submitComplaint, 
    setSelectedReceipt, 
    setSelectedCardUser,
    language 
  } = useApp();

  const memLoc = mapLegacyRegionToHierarchy(currentUser.region);
  const memberDistrict = currentUser.district || memLoc.district;
  const memberProvince = currentUser.stateProvince || memLoc.stateProvince;
  const memberTehsil = currentUser.tehsil || memLoc.tehsil;
  const memberUC = currentUser.unionCouncil || memLoc.unionCouncil;

  // Scoped to member's own records only:
  const ownPayments = payments.filter(p => p.userId === currentUser.id);
  const ownComplaints = complaints.filter(c => c.userId === currentUser.id);
  const relevantAnnouncements = announcements.filter(
    a => a.targetScope === 'ALL' || a.targetRegion === 'ALL_REGIONS' || 
         (a.targetScope === 'PROVINCE' && a.targetStateProvince === memberProvince) ||
         a.targetDistrict === memberDistrict ||
         a.targetRegion === currentUser.region
  );

  // Financial calculations
  const totalVerifiedContributed = ownPayments
    .filter(p => p.status === 'VERIFIED')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pendingPayments = ownPayments.filter(p => p.status === 'PENDING_VERIFICATION');

  // Submit payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(currentUser.monthlyPledge || 2500);
  const [payFund, setPayFund] = useState<FundCategory>('Monthly Contribution');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Bank Transfer (Meezan/HBL)');
  const [payReference, setPayReference] = useState('');
  const [payNote, setPayNote] = useState('');
  const [paymentSubmittedSuccess, setPaymentSubmittedSuccess] = useState(false);

  // Submit complaint modal state
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [cmpCategory, setCmpCategory] = useState<ComplaintCategory>('Membership Card');
  const [cmpSubject, setCmpSubject] = useState('');
  const [cmpDescription, setCmpDescription] = useState('');
  const [cmpPriority, setCmpPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payReference.trim() || payAmount <= 0) return;

    submitPayment({
      amount: Number(payAmount),
      fundCategory: payFund,
      paymentMethod: payMethod,
      referenceNumber: payReference.trim(),
      proofNote: payNote.trim() || undefined
    });

    setPaymentSubmittedSuccess(true);
    setTimeout(() => {
      setPaymentSubmittedSuccess(false);
      setIsPaymentModalOpen(false);
      setPayReference('');
      setPayNote('');
    }, 1500);
  };

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
      {/* Member Welcome & ID Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              {language === 'ur' ? 'ذاتی ممبرشپ' : 'Member Self-Service'}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-500">{memberDistrict}, {memberProvince}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {language === 'ur' ? `خوش آمدید، ${currentUser.name}` : `Welcome back, ${currentUser.name}`}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Membership ID: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{currentUser.membershipId || 'KC-PENDING'}</span> · Status: Active Contributor
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSelectedCardUser(currentUser)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md border border-slate-700 transition-colors shadow-xs"
          >
            <IdCard className="w-3.5 h-3.5 text-emerald-400" />
            <span>Digital ID Card</span>
          </button>

          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit Payment / Contribution</span>
          </button>
        </div>
      </div>

      {/* Hero 2-Column Split: Digital Card Preview (Left) + Pledge & Contribution Stats (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Col (5 cols): Interactive Digital Card Preview */}
        <div 
          onClick={() => setSelectedCardUser(currentUser)}
          className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-xl p-5 text-white shadow-lg border border-emerald-500/30 cursor-pointer hover:border-emerald-400 transition-colors flex flex-col justify-between group relative overflow-hidden"
        >
          {/* Subtle watermark */}
          <div 
            className="absolute right-3 bottom-3 w-32 h-32 opacity-10 pointer-events-none rounded-full bg-cover"
            style={{ backgroundImage: `url('/src/assets/images/kifayat_emblem_logo_1794225902501.jpg')` }}
          />

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <img 
                src="/src/assets/images/kifayat_emblem_logo_1794225902501.jpg" 
                alt="Emblem" 
                className="w-9 h-9 rounded-lg object-cover border border-emerald-400/40"
              />
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-300">
                  Kifayat Connect
                </h4>
                <p className="text-[10px] text-slate-300">Official Membership ID</p>
              </div>
            </div>

            <span className="text-[10px] font-mono font-semibold text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              ACTIVE
            </span>
          </div>

          <div className="flex items-center gap-3.5 my-4">
            <img 
              src={currentUser.avatarUrl || '/src/assets/images/member_avatar_sample_1794225903658.jpg'} 
              alt={currentUser.name} 
              className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-400/50 shadow-md"
            />
            <div className="min-w-0">
              <h3 className="font-bold text-base text-white truncate">{currentUser.name}</h3>
              <p className="text-[11px] font-mono text-emerald-300 mt-0.5">
                {currentUser.membershipId || 'KC-2024-8841'}
              </p>
              <p className="text-[10px] text-slate-300 truncate">
                {memberDistrict}, {memberProvince}{memberTehsil ? ` · ${memberTehsil}` : ''} · CNIC: {currentUser.cnic}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-emerald-800/60 flex items-center justify-between text-[10px] text-slate-400">
            <div>
              <span>VALID THRU: </span>
              <span className="font-mono text-emerald-300 font-bold">{currentUser.validUntil || '2027-12-31'}</span>
            </div>
            <span className="text-emerald-300 group-hover:underline flex items-center gap-1">
              Click to view & print full card →
            </span>
          </div>
        </div>

        {/* Right Col (7 cols): Contribution & Pledge Status Grid */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Total Verified Contributed */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-medium uppercase tracking-wider">Total Contributed</span>
                <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                  PKR {totalVerifiedContributed.toLocaleString()}
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Verified</span>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between">
              <span>{ownPayments.filter(p => p.status === 'VERIFIED').length} Cleared Transactions</span>
              <span className="text-emerald-600 font-medium">Audited</span>
            </div>
          </div>

          {/* Monthly Pledge Status */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-medium uppercase tracking-wider">Monthly Pledge</span>
                <Receipt className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                  PKR {currentUser.monthlyPledge.toLocaleString()}
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Recurring</span>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between">
              <span>Status: Current for Nov 2026</span>
              <span className="text-blue-600 font-medium">Up to date</span>
            </div>
          </div>

          {/* Annual Welfare Fund Status */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-medium uppercase tracking-wider">Annual Welfare Pledge</span>
                <Coins className="w-4 h-4 text-purple-500" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                  PKR {currentUser.annualPledge.toLocaleString()}
                </span>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Annual</span>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between">
              <span>Education & Healthcare Dispensary</span>
              <span className="text-purple-600 font-medium">Fulfillable in Nov</span>
            </div>
          </div>

          {/* Pending Verifications */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-medium uppercase tracking-wider">Verification Status</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                  {pendingPayments.length} Pending
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">In Review</span>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2">
              {pendingPayments.length > 0 
                ? 'Finance officer is cross-verifying transaction slip.' 
                : 'All submitted payments have been verified!'}
            </div>
          </div>
        </div>
      </div>

      {/* Member Payment History & Receipts */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              My Payment Records & Certified Receipts
            </h3>
            <p className="text-xs text-slate-500">
              Only your private transactions are accessible according to Kifayat Connect permission policy
            </p>
          </div>

          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Make New Payment</span>
          </button>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-3">Receipt No.</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Fund Category</th>
                <th className="py-2.5 px-3">Payment Method</th>
                <th className="py-2.5 px-3">Reference Slip</th>
                <th className="py-2.5 px-3 text-right">Amount (PKR)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Receipt Voucher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {ownPayments.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {tx.receiptNumber}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                    {tx.date}
                  </td>
                  <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-medium">
                    {tx.fundCategory}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                    {tx.paymentMethod}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                    {tx.referenceNumber}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                    {tx.amount.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      tx.status === 'VERIFIED'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                    }`}>
                      {tx.status === 'VERIFIED' ? 'Verified' : 'Verification Pending'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {tx.status === 'VERIFIED' ? (
                      <button
                        onClick={() => setSelectedReceipt(tx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium transition-colors"
                      >
                        <Printer className="w-3 h-3 text-emerald-600" />
                        <span>Print Receipt</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">Processing</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: My Grievances & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Support & Grievances */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Support Tickets & Grievances
              </h3>
              <p className="text-xs text-slate-500">
                Direct communication with your Regional Officer ({currentUser.region})
              </p>
            </div>
            <button
              onClick={() => setIsComplaintModalOpen(true)}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              + File Ticket
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {ownComplaints.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                You have not filed any grievances. Everything is smooth!
              </div>
            ) : (
              ownComplaints.map(cmp => (
                <div key={cmp.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{cmp.subject}</span>
                      <p className="text-[10px] text-slate-400">Ticket: {cmp.ticketNumber} · Category: {cmp.category}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      cmp.status === 'RESOLVED' 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {cmp.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1.5">
                    {cmp.description}
                  </p>

                  {cmp.responseNote && (
                    <div className="mt-2 text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded border border-emerald-200 dark:border-emerald-800/60">
                      <span className="font-bold">Officer Response ({cmp.assignedOfficerName}):</span> {cmp.responseNote}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Welfare Bulletins & Announcements */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Welfare Announcements & News
              </h3>
              <p className="text-xs text-slate-500">
                Official notices from Central HQ & {currentUser.region}
              </p>
            </div>
            <Megaphone className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="mt-3 space-y-3">
            {relevantAnnouncements.map(ann => (
              <div 
                key={ann.id} 
                className={`p-3 rounded-lg border text-xs ${
                  ann.urgency === 'URGENT'
                    ? 'border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">
                    {ann.title}
                  </h4>
                  {ann.urgency === 'URGENT' && (
                    <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wide">Urgent</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {ann.content}
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200 dark:border-slate-800/60 pt-1.5">
                  <span>From: {ann.publishedBy}</span>
                  <span>{new Date(ann.publishedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL: SUBMIT NEW PAYMENT */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 my-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Submit Payment / Welfare Contribution
            </h3>

            {paymentSubmittedSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Payment Submitted Successfully!
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Your transaction has entered the Finance Officer's verification queue. Once cleared, your official digital receipt will be automatically generated.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Select Welfare Fund Category
                  </label>
                  <select
                    value={payFund}
                    onChange={(e) => setPayFund(e.target.value as FundCategory)}
                    className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Monthly Contribution">Monthly Contribution (Subscription)</option>
                    <option value="Annual Welfare Fund">Annual Welfare Fund (Healthcare & Education)</option>
                    <option value="Emergency Relief">Emergency Relief & Disaster Aid</option>
                    <option value="Zakat & Sadqah">Zakat & Sadqah Deserving Families</option>
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
                      Payment Gateway / Method
                    </label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                      className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="Bank Transfer (Meezan/HBL)">Bank Transfer (Meezan/HBL)</option>
                      <option value="Raast Instant ID">Raast Instant ID (P2P)</option>
                      <option value="EasyPaisa">EasyPaisa Mobile Account</option>
                      <option value="JazzCash">JazzCash Wallet</option>
                      <option value="Cash Voucher">Cash Voucher / Physical Desk</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Bank Deposit Slip No. / Transaction Reference ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MEEZAN-FT-99281726 or JC-88192039"
                    value={payReference}
                    onChange={(e) => setPayReference(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Finance officers match this exact ID with treasury bank statements.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Optional Proof Remarks / Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. November 2026 dues transferred from personal account"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="px-3.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit for Finance Verification</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT SUPPORT TICKET / COMPLAINT */}
      {isComplaintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 my-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              File Support Ticket or Grievance
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Your ticket will be routed directly to your Regional Officer in {currentUser.region}.
            </p>

            <form onSubmit={handleComplaintSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Grievance Category
                  </label>
                  <select
                    value={cmpCategory}
                    onChange={(e) => setCmpCategory(e.target.value as ComplaintCategory)}
                    className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Membership Card">Membership Card Delivery / Issue</option>
                    <option value="Receipt Inquiry">Receipt Tax / Record Correction</option>
                    <option value="Fund Allocation">Fund Allocation Transparency</option>
                    <option value="Welfare Support">Welfare Support Nomination</option>
                    <option value="Regional Activity">Regional Activity Question</option>
                    <option value="General">General Inquiries</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Urgency Priority
                  </label>
                  <select
                    value={cmpPriority}
                    onChange={(e) => setCmpPriority(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High (Urgent Attention)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inquire about physical RFID card delivery..."
                  value={cmpSubject}
                  onChange={(e) => setCmpSubject(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Description of Request or Issue
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Please provide full details, addresses or reference numbers to help the regional officer assist you quickly..."
                  value={cmpDescription}
                  onChange={(e) => setCmpDescription(e.target.value)}
                  className="w-full text-xs p-3 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsComplaintModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
