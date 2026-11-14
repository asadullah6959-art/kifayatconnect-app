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
  Upload,
  XCircle,
  MessageSquare,
  MessageSquareWarning,
  Users
} from 'lucide-react';
import { FundCategory, PaymentMethod, ComplaintCategory } from '../../types';
import { mapLegacyRegionToHierarchy } from '../../data/locationData';
import { compressImageFile } from '../../utils/imageCompression';
import { BrandEmblem3D } from '../common/BrandEmblem3D';
import { RoleBadge } from '../common/RoleBadge';
import { LuxurySelect } from '../common/LuxurySelect';
import { ProfileCompletionGate, needsProfileCompletion } from '../common/ProfileCompletionGate';
import { translate } from '../../data/translations';

export const MemberDashboard: React.FC = () => {
  const {
    currentUser,
    payments,
    complaints,
    announcements,
    appSettings,
    submitPayment,
    submitComplaint,
    setSelectedReceipt,
    setSelectedCardUser,
    setActiveTab,
    openCompleteProfileModal,
    language
  } = useApp();
  const requiresProfileCompletion = needsProfileCompletion(currentUser);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(currentUser?.monthlyPledge || 2500);
  const [payFund, setPayFund] = useState<FundCategory>('Monthly Contribution');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('EasyPaisa');
  const [payReference, setPayReference] = useState('');
  const [payNote, setPayNote] = useState('');
  const [receiptImageUrl, setReceiptImageUrl] = useState('');
  const [receiptImageName, setReceiptImageName] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [paymentSubmittedSuccess, setPaymentSubmittedSuccess] = useState(false);

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

  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsCompressing(true);
    try {
      const compressed = await compressImageFile(file, 1080, 0.78);
      setReceiptImageUrl(compressed.dataUrl);
      setReceiptImageName(file.name);
    } catch (err: any) {
      setUploadError(err?.message || 'Unable to process receipt image.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;

    const cleanRef =
      payReference.trim() ||
      `${payMethod.replace(/\s+/g, '').substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`;

    submitPayment({
      amount: Number(payAmount),
      fundCategory: payFund,
      paymentMethod: payMethod,
      referenceNumber: cleanRef,
      proofNote: payNote.trim() || undefined,
      receiptImageUrl: receiptImageUrl || undefined,
      receiptImageName: receiptImageName || undefined
    });

    setPaymentSubmittedSuccess(true);
    setTimeout(() => {
      setPaymentSubmittedSuccess(false);
      setIsPaymentModalOpen(false);
      setPayReference('');
      setPayNote('');
      setReceiptImageUrl('');
      setReceiptImageName('');
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#F5D061] uppercase tracking-wider">
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
              ID: <strong className="font-mono text-[#F5D061]">{currentUser.membershipId || 'KC-PENDING'}</strong>
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
            onClick={() => setSelectedCardUser(currentUser)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#111622] hover:bg-slate-800 text-white text-xs font-bold rounded-xl border border-[#D4AF37]/40 cursor-pointer"
          >
            <IdCard className="w-4 h-4 text-[#F5D061]" />
            <span>{translate(language, 'viewDigitalId')}</span>
          </button>

          {allowPayments && (
            <button
              type="button"
              onClick={() => {
                if (requiresProfileCompletion) {
                  openCompleteProfileModal();
                } else {
                  setIsPaymentModalOpen(true);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 kc-gold-button text-xs font-extrabold rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{translate(language, 'actionPayFunds')}</span>
            </button>
          )}
        </div>
      </div>

      {requiresProfileCompletion && (
        <ProfileCompletionGate featureName="payments, Live Chat & complaints" />
      )}

      {/* Apollo Telenor-style Quick Action Cards */}
      {vis.showQuickActions && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {allowPayments && (
            <button
              type="button"
              onClick={() => {
                if (requiresProfileCompletion) {
                  openCompleteProfileModal();
                } else {
                  setIsPaymentModalOpen(true);
                }
              }}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-[#043927] to-[#111622] border border-[#D4AF37]/40 text-left transition-transform hover:-translate-y-0.5 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-[#0A0D12]/80 border border-[#D4AF37]/40 flex items-center justify-center mb-2">
                <Coins className="w-4 h-4 text-[#F5D061]" />
              </div>
              <span className="text-xs font-extrabold text-white block truncate">{translate(language, 'actionPayFunds')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSelectedCardUser(currentUser)}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-[#111622] to-[#161D2C] border border-[#D4AF37]/30 text-left transition-transform hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#0A0D12] border border-[#D4AF37]/30 flex items-center justify-center mb-2">
              <IdCard className="w-4 h-4 text-[#F5D061]" />
            </div>
            <span className="text-xs font-extrabold text-white block truncate">{translate(language, 'actionDigitalId')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-[#111622] to-[#161D2C] border border-[#D4AF37]/30 text-left transition-transform hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#0A0D12] border border-[#D4AF37]/30 flex items-center justify-center mb-2">
              <Users className="w-4 h-4 text-[#F5D061]" />
            </div>
            <span className="text-xs font-extrabold text-white block truncate">{translate(language, 'navMembers')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-[#111622] to-[#161D2C] border border-[#D4AF37]/30 text-left transition-transform hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#0A0D12] border border-emerald-500/30 flex items-center justify-center mb-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs font-extrabold text-white block truncate">{translate(language, 'actionOpenChat')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-[#111622] to-[#161D2C] border border-[#D4AF37]/30 text-left transition-transform hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#0A0D12] border border-[#D4AF37]/30 flex items-center justify-center mb-2">
              <Megaphone className="w-4 h-4 text-[#F5D061]" />
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
              className="p-3.5 rounded-2xl bg-gradient-to-br from-[#111622] to-[#161D2C] border border-[#D4AF37]/30 text-left transition-transform hover:-translate-y-0.5 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-[#0A0D12] border border-rose-500/30 flex items-center justify-center mb-2">
                <MessageSquareWarning className="w-4 h-4 text-rose-400" />
              </div>
              <span className="text-xs font-extrabold text-white block truncate">{translate(language, 'actionComplaints')}</span>
            </button>
          )}
        </div>
      )}

      {/* Hero Split: Black Velvet VIP Card Preview + KPI Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div
          onClick={() => setSelectedCardUser(currentUser)}
          className="lg:col-span-5 rounded-2xl p-5 text-white shadow-xl border-2 border-[#D4AF37] cursor-pointer hover:border-[#F5D061] transition-colors flex flex-col justify-between relative overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #080A0E 0%, #141821 55%, #090C11 100%)'
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <BrandEmblem3D size="xs" />
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider kc-gold-gradient-text">
                  KIFAYAT CONNECT 👑
                </h4>
                <p className="text-[10px] text-emerald-300 font-semibold">{translate(language, 'vipPremiumMember')}</p>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold text-emerald-300 bg-[#043927] px-2 py-0.5 rounded-md border border-[#D4AF37]/40 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#F5D061]" />
              <span>ACTIVE</span>
            </span>
          </div>

          <div className="flex items-center gap-3.5 my-4">
            {(currentUser.avatarUrl || currentUser.avatar) ? (
              <img
                src={currentUser.avatarUrl || currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 rounded-xl object-cover border-2 border-[#F5D061] shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-[#043927] border-2 border-[#F5D061] flex items-center justify-center text-[#F5D061] font-extrabold text-lg shadow-md shrink-0">
                {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 space-y-1">
              <h3 className="font-extrabold text-base text-white truncate">{currentUser.name}</h3>
              <p className="text-[11px] font-mono text-[#F5D061]">{currentUser.membershipId || 'KC-PENDING'}</p>
              <p className="text-[10px] text-slate-300 truncate">
                {memberDistrict}, {memberProvince}{memberTehsil ? ` · ${memberTehsil}` : ''}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#D4AF37]/25 flex items-center justify-between text-[10px] text-slate-400">
            <div>
              <span>VALID THRU: </span>
              <span className="font-mono text-[#F5D061] font-bold">{currentUser.validUntil || '2028-12-31'}</span>
            </div>
            <span className="text-[#F5D061] font-semibold">Tap for VIP Card & QR →</span>
          </div>
        </div>

        {vis.showKpiGrid && (
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Contributed</span>
                  <Coins className="w-4 h-4 text-[#F5D061]" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    PKR {totalVerifiedContributed.toLocaleString()}
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold">Verified</span>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex items-center justify-between">
                <span>{ownPayments.filter(p => p.status === 'VERIFIED').length} Cleared Transactions</span>
                <span className="text-emerald-400 font-semibold">Audited</span>
              </div>
            </div>

            <div className="p-4 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Monthly Pledge</span>
                  <Receipt className="w-4 h-4 text-blue-400" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    PKR {currentUser.monthlyPledge.toLocaleString()}
                  </span>
                  <span className="text-xs text-blue-400 font-semibold">Recurring</span>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex items-center justify-between">
                <span>Cycle ({currentMonthLabel})</span>
                <span className="text-blue-400 font-semibold">Active</span>
              </div>
            </div>

            <div className="p-4 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Annual Welfare Pledge</span>
                  <Coins className="w-4 h-4 text-purple-400" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    PKR {currentUser.annualPledge.toLocaleString()}
                  </span>
                  <span className="text-xs text-purple-400 font-semibold">Annual</span>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex items-center justify-between">
                <span>Education & Healthcare</span>
                <span className="text-purple-400 font-semibold">{currentMonthShort}</span>
              </div>
            </div>

            <div className="p-4 bg-[#111622] rounded-2xl border border-[#D4AF37]/25 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Verification Status</span>
                  <Clock className="w-4 h-4 text-[#F5D061]" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    {pendingPayments.length} Pending
                  </span>
                  <span className="text-xs text-[#F5D061] font-semibold">In Review</span>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-800 pt-2">
                {pendingPayments.length > 0
                  ? 'Admin / Leadership is cross-verifying transaction slip.'
                  : 'All submitted payments have been verified!'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Member Payment History */}
      <div className="bg-[#111622] rounded-2xl border border-[#D4AF37]/25 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white">My Payment Records & Certified Receipts</h3>
            <p className="text-xs text-slate-400">Only your private transactions are shown under Kifayat Connect privacy rules</p>
          </div>

          {allowPayments && (
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 kc-gold-button text-xs font-extrabold rounded-xl cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Make New Payment</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-3">Receipt No.</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3 text-right">Amount (PKR)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Voucher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {ownPayments.map(tx => (
                <tr key={tx.id} className="hover:bg-[#161D2C] transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-white">{tx.receiptNumber}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">{tx.date}</td>
                  <td className="py-2.5 px-3 text-emerald-300 font-medium">{tx.fundCategory}</td>
                  <td className="py-2.5 px-3 text-slate-300">{tx.paymentMethod}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{tx.referenceNumber}</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-white">{tx.amount.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                      tx.status === 'VERIFIED'
                        ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                        : tx.status === 'REJECTED'
                        ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-950/70 text-[#F5D061] border border-[#D4AF37]/40'
                    }`}>
                      {tx.status === 'VERIFIED' ? <CheckCircle2 className="w-3 h-3" /> : tx.status === 'REJECTED' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      <span>{tx.status === 'VERIFIED' ? 'Approved' : tx.status === 'REJECTED' ? 'Rejected' : 'Pending'}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {tx.status === 'VERIFIED' ? (
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(tx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-[#0A0D12] hover:bg-slate-800 text-[#F5D061] border border-[#D4AF37]/30 rounded-lg font-medium cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Receipt</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500">{tx.status === 'REJECTED' ? 'Declined' : 'Processing'}</span>
                    )}
                  </td>
                </tr>
              ))}
              {ownPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No contributions submitted yet. Click &quot;Make New Payment&quot; to submit your first contribution.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: My Grievances & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111622] rounded-2xl border border-[#D4AF37]/25 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Support Tickets & Grievances</h3>
              <p className="text-xs text-slate-400">Routed to your District Admin ({memberDistrict})</p>
            </div>
            {allowComplaints && (
              <button type="button" onClick={() => setIsComplaintModalOpen(true)} className="text-xs text-[#F5D061] hover:underline font-bold cursor-pointer">
                + File Ticket
              </button>
            )}
          </div>

          <div className="mt-3 space-y-3">
            {ownComplaints.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">You have not filed any grievances.</div>
            ) : (
              ownComplaints.map(cmp => (
                <div key={cmp.id} className="p-3 rounded-xl border border-slate-800 bg-[#0A0D12] text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-white">{cmp.subject}</span>
                      <p className="text-[10px] text-slate-400">{cmp.ticketNumber} · {cmp.category}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      cmp.status === 'RESOLVED' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-[#F5D061]'
                    }`}>
                      {cmp.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1.5">{cmp.description}</p>
                  {cmp.responseNote && (
                    <div className="mt-2 text-[11px] text-emerald-200 bg-[#043927]/50 p-2 rounded border border-emerald-500/30">
                      <span className="font-bold">Response ({cmp.assignedOfficerName}):</span> {cmp.responseNote}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {vis.showAnnouncementsFeed && (
          <div className="bg-[#111622] rounded-2xl border border-[#D4AF37]/25 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">Announcements & Official Notices</h3>
                <p className="text-xs text-slate-400">Latest Official App 👑 & {memberDistrict} notices</p>
              </div>
              <Megaphone className="w-4 h-4 text-[#F5D061]" />
            </div>

            <div className="mt-3 space-y-3">
              {relevantAnnouncements.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">No announcements published yet.</div>
              ) : (
                relevantAnnouncements.slice(0, 5).map(ann => (
                  <div
                    key={ann.id}
                    className={`p-3 rounded-xl border text-xs ${
                      ann.urgency === 'URGENT'
                        ? 'border-rose-500/40 bg-rose-950/25'
                        : 'border-slate-800 bg-[#0A0D12]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-white">{ann.title}</h4>
                      <span className="text-[9px] font-bold text-[#F5D061] shrink-0">
                        {ann.announcementType === 'OFFICIAL_APP' ? '👑 OFFICIAL' : '📢 COMMUNITY'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{ann.content}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800 pt-1.5">
                      <span>From: {ann.publishedBy}</span>
                      <span>{new Date(ann.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: SUBMIT PAYMENT (PRESERVED UPLOAD & COMPRESSION) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-[#0A0D12]/90 p-3 sm:p-4 overflow-y-auto">
          <div
            className="relative w-full max-w-lg bg-[#111622] rounded-2xl shadow-2xl border border-[#D4AF37]/35 p-5 sm:p-6 my-auto max-h-[92dvh] overflow-y-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <h3 className="text-base font-bold text-white pb-2 border-b border-slate-800">
              Submit Payment / Welfare Contribution
            </h3>

            {paymentSubmittedSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-sm text-white">Payment Submitted Successfully!</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Your transaction is pending verification by your Admin. Once approved, your certified receipt is automatically issued.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Select Welfare Fund Category</label>
                  <LuxurySelect
                    compact
                    value={payFund}
                    onChange={(val) => setPayFund(val as FundCategory)}
                    label="Welfare Fund Category"
                    options={[
                      { value: 'Monthly Contribution', label: 'Monthly Contribution' },
                      { value: 'Annual Welfare Fund', label: 'Annual Welfare Fund' },
                      { value: 'Emergency Relief', label: 'Emergency Relief' },
                      { value: 'Zakat & Sadqah', label: 'Zakat & Sadqah' }
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Amount (PKR)</label>
                    <input
                      type="number"
                      required
                      min={100}
                      step={50}
                      value={payAmount}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Payment Method</label>
                    <LuxurySelect
                      compact
                      value={payMethod}
                      onChange={(val) => setPayMethod(val as PaymentMethod)}
                      label="Payment Method"
                      options={[
                        { value: 'EasyPaisa', label: 'EasyPaisa' },
                        { value: 'JazzCash', label: 'JazzCash' },
                        { value: 'Bank Transfer', label: 'Bank Transfer' },
                        { value: 'Cash', label: 'Cash' }
                      ]}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Transaction Reference ID / Slip No. <span className="text-slate-500 font-normal">(Optional if photo uploaded)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EP-99281726 or Bank Ref"
                    value={payReference}
                    onChange={(e) => setPayReference(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Upload Payment Screenshot / Receipt Photo (Compressed)
                  </label>
                  <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[#D4AF37]/40 bg-[#0A0D12] cursor-pointer hover:border-[#F5D061] text-xs font-semibold text-slate-200">
                    <Upload className="w-4 h-4 text-[#F5D061]" />
                    <span>
                      {isCompressing
                        ? 'Compressing receipt...'
                        : receiptImageName
                        ? `Attached: ${receiptImageName}`
                        : 'Tap to attach receipt photo (JPG/PNG)'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleReceiptFileChange} className="hidden" />
                  </label>
                  {uploadError && <p className="text-[11px] text-rose-400 mt-1">{uploadError}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Optional Note</label>
                  <input
                    type="text"
                    placeholder={`e.g. ${currentMonthLabel} contribution`}
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" className="flex items-center gap-1.5 px-4 py-2 kc-gold-button text-xs font-extrabold rounded-xl cursor-pointer">
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Contribution</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: COMPLAINT */}
      {isComplaintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-[#0A0D12]/90 p-3 sm:p-4 overflow-y-auto">
          <div
            className="relative w-full max-w-lg bg-[#111622] rounded-2xl shadow-2xl border border-[#D4AF37]/35 p-5 sm:p-6 my-auto max-h-[92dvh] overflow-y-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <h3 className="text-base font-bold text-white pb-2 border-b border-slate-800">
              File Support Ticket or Grievance
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Routed directly to your District Admin in {memberDistrict}, {memberProvince}.
            </p>

            <form onSubmit={handleComplaintSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                  <LuxurySelect
                    compact
                    value={cmpCategory}
                    onChange={(val) => setCmpCategory(val as ComplaintCategory)}
                    label="Category"
                    options={[
                      { value: 'Membership Card', label: 'Membership Card Delivery / Issue' },
                      { value: 'Receipt Inquiry', label: 'Receipt Tax / Record Correction' },
                      { value: 'Fund Allocation', label: 'Fund Allocation Transparency' },
                      { value: 'Welfare Support', label: 'Welfare Support Nomination' },
                      { value: 'District Activity', label: 'District Activity Question' },
                      { value: 'General', label: 'General Inquiries' }
                    ]}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Urgency Priority</label>
                  <LuxurySelect
                    compact
                    value={cmpPriority}
                    onChange={(val) => setCmpPriority(val as 'LOW' | 'MEDIUM' | 'HIGH')}
                    label="Urgency Priority"
                    options={[
                      { value: 'LOW', label: 'Low' },
                      { value: 'MEDIUM', label: 'Medium' },
                      { value: 'HIGH', label: 'High (Urgent Attention)' }
                    ]}
                  />
                </div>
              </div>

              <input
                type="text"
                required
                placeholder="Subject line..."
                value={cmpSubject}
                onChange={(e) => setCmpSubject(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-700 bg-[#0A0D12] text-white"
              />

              <textarea
                required
                rows={4}
                placeholder="Provide full details..."
                value={cmpDescription}
                onChange={(e) => setCmpDescription(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-700 bg-[#0A0D12] text-white resize-none"
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsComplaintModalOpen(false)} className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="flex items-center gap-1.5 px-4 py-2 kc-gold-button text-xs font-extrabold rounded-xl cursor-pointer">
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
