import React, { useState, useEffect } from 'react';
import { useApp, isFounderUser } from '../../context/AppContext';
import { User } from '../../types';
import {
  X,
  Award,
  MapPin,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  IdCard,
  CheckCircle2,
  XCircle,
  Clock,
  Crown,
  Lock,
  Building2,
  Trash2
} from 'lucide-react';
import { RoleBadge } from '../common/RoleBadge';
import { TabbarBadge, FaizKhelVipCrownIcon } from '../common/TabbarBadge';
import { AssignRoleModal } from '../common/AssignRoleModal';
import { resolveUserApprovalStatus, isUserActuallyOnline } from '../../services/firebase';
import { isFaizKhelUser } from '../../utils/dastoor';
import { translate } from '../../data/translations';

interface MemberProfileModalProps {
  user: User | null;
  onClose: () => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({ user, onClose }) => {
  const {
    currentUser,
    users,
    openPersonalMessage,
    language,
    setSelectedCardUser,
    approveMemberAccount,
    deleteUserPermanently
  } = useApp();

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleFeedback, setRoleFeedback] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [presenceNowMs, setPresenceNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!user) return;
    setPresenceNowMs(Date.now());
    const id = window.setInterval(() => {
      setPresenceNowMs(Date.now());
    }, 10000);
    return () => window.clearInterval(id);
  }, [user]);

  if (!user || !currentUser) return null;

  const liveUser = users.find(u => u.id === user.id) || user;
  const isSelf = currentUser.id === liveUser.id;
  const isUserOnline = isUserActuallyOnline(liveUser, presenceNowMs);
  const currentIsFounder = isFounderUser(currentUser);
  const targetIsFounder = isFounderUser(liveUser);
  const canApproveMembers = Boolean(
    currentUser.role === 'SUPER_ADMIN' ||
      currentUser.role === 'ADMIN' ||
      currentUser.permissions?.canApproveMembers
  );
  const approvalState = resolveUserApprovalStatus(liveUser);
  const isPrivilegedViewer =
    currentUser.role === 'SUPER_ADMIN' ||
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'CO_ADMIN' ||
    Boolean(currentUser.isAuditOfficer);
  const showContact = isSelf || isPrivilegedViewer;

  const handleStartChat = () => {
    openPersonalMessage(liveUser);
    onClose();
  };

  const handleViewDigitalCard = () => {
    setSelectedCardUser(liveUser);
    onClose();
  };

  const handleApproveDecision = (approved: boolean) => {
    const res = approveMemberAccount(liveUser.id, approved);
    setRoleFeedback(res.message);
  };

  const avatarSrc = liveUser.avatarUrl || liveUser.photoUrl || liveUser.avatar;
  const isFaizKhel = isFaizKhelUser(liveUser);

  return (
    <>
      <div className="fixed inset-0 z-[10000] kc-modal-backdrop bg-black/85 flex items-start sm:items-center justify-center overflow-y-auto">
        <div
          className={`kc-luxury-modal kc-modal-panel rounded-2xl max-w-lg w-full overflow-y-auto relative my-auto ${
            isFaizKhel ? '!border-[1.5px] !border-[#FDE047] shadow-[0_18px_50px_rgba(28,20,4,0.88),0_0_28px_rgba(253,224,71,0.26)]' : ''
          }`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div
            className="h-24 p-4 relative border-b border-slate-400/20 overflow-hidden"
            style={{
              background: isFaizKhel
                ? 'linear-gradient(135deg, #2B1F06 0%, #42300A 52%, #1C1404 100%)'
                : 'linear-gradient(135deg, #1E293B 0%, #131C31 55%, #090D16 100%)',
            }}
          >
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-[#8A6218] via-[#FDE047] to-[#38BDF8]" />
            {isFaizKhel && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1C1404]/95 border-[1.5px] border-[#FDE047] text-[#FEF08A] text-[10px] font-extrabold shadow-[0_2px_12px_rgba(253,224,71,0.28)] pr-12">
                <FaizKhelVipCrownIcon className="w-6 h-6" />
                <span>{language === 'ur' ? 'شاہی وی آئی پی · فیض خیل' : 'ROYAL VIP · FAIZ KHEL'}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#FEF08A] via-[#FDE047] to-[#D4AF37] text-[#1C1404] text-[9px] font-black uppercase leading-none">
                  VIP
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="kc-pressable absolute top-2.5 right-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-full bg-[#090D16]/90 hover:bg-[#1E293B] border border-slate-400/25 text-slate-200 hover:text-[#38BDF8] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-5 sm:px-6 pb-24 sm:pb-6 pt-0 relative">
            <div className="flex items-end justify-between -mt-12 mb-4 gap-3">
              <div className="relative">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={liveUser.name}
                    className={`w-24 h-24 rounded-2xl border-4 object-cover shadow-xl bg-[#090D16] ${
                      isFaizKhel
                        ? 'border-[#FDE047] ring-2 ring-[#FDE047]/65'
                        : 'border-[#0F172A] ring-1 ring-[#38BDF8]/45'
                    }`}
                  />
                ) : (
                  <div
                    className={`w-24 h-24 rounded-2xl border-4 flex items-center justify-center font-bold text-3xl shadow-xl ${
                      isFaizKhel
                        ? 'border-[#FDE047] ring-2 ring-[#FDE047]/65 bg-[#2B1F06] text-[#FEF08A]'
                        : 'border-[#0F172A] ring-1 ring-[#38BDF8]/45 bg-[#131C31] text-[#38BDF8]'
                    }`}
                  >
                    {liveUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#0F172A] ${
                    isUserOnline ? 'bg-emerald-500' : 'bg-slate-500'
                  }`}
                />
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <RoleBadge
                  role={liveUser.role}
                  isFounder={Boolean(liveUser.isFounder)}
                  isAuditOfficer={Boolean(liveUser.isAuditOfficer)}
                />
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isUserOnline
                        ? 'bg-[#0F172A] text-emerald-300 border-emerald-500/45'
                        : 'bg-[#090D16] text-[#94A3B8] border-slate-400/20'
                    }`}
                  >
                    {isUserOnline
                      ? `🟢 ${translate(language, 'online')}`
                      : `⚫ ${translate(language, 'offline')}`}
                  </span>
                  {approvalState === 'pending' && !targetIsFounder && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-[#D4AF37]/50 text-[#F5D061] text-[10px] font-bold uppercase">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{translate(language, 'pendingLabel')}</span>
                    </span>
                  )}
                  {approvalState === 'rejected' && !targetIsFounder && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/45 text-rose-300 text-[10px] font-bold uppercase">
                      <XCircle className="w-2.5 h-2.5" />
                      <span>{translate(language, 'rejectedLabel')}</span>
                    </span>
                  )}
                  <span className="text-[11px] font-mono font-semibold text-[#F5D061] tabular-nums">
                    {liveUser.membershipId || 'KC-PENDING'}
                  </span>
                </div>
              </div>
            </div>

            {roleFeedback && (
              <div className="mb-3 p-2.5 rounded-xl kc-emerald-panel text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{roleFeedback}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRoleFeedback(null)}
                  className="text-emerald-300 hover:text-white text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="truncate">{liveUser.name}</span>
                {(liveUser.membershipStatus || liveUser.status) === 'ACTIVE' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </h2>

              <div className="mt-1.5 flex items-center flex-wrap gap-1.5">
                <TabbarBadge user={liveUser} language={language} />
              </div>

              {liveUser.assignedOfficeTitle ? (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#F5D061] text-xs font-medium">
                  <Award className="w-4 h-4 text-[#F5D061]" />
                  <span>{liveUser.assignedOfficeTitle}</span>
                </div>
              ) : (
                <p className="text-xs text-slate-300 mt-1">
                  {liveUser.bio ||
                    (liveUser.role === 'MEMBER'
                      ? (language === 'ur' ? 'تصدیق شدہ کمیونٹی ممبر' : 'Verified Community Member')
                      : (language === 'ur' ? 'تنظیمی عہدیدار' : 'Organizational Officer'))}
                </p>
              )}
            </div>

            <div className="mt-4 p-3.5 bg-[#090D16] rounded-xl border border-[#D4AF37]/30 shadow-[inset_0_1px_0_rgba(252,227,138,0.08)] space-y-2 text-xs text-slate-200">
              <div className="flex items-center gap-2 text-slate-200">
                <MapPin className="w-4 h-4 text-[#F5D061] shrink-0" />
                <span>
                  {[liveUser.customCity || liveUser.cityTown || liveUser.tehsil, liveUser.district, liveUser.stateProvince, liveUser.country || 'Pakistan']
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>

              {(liveUser.assignedDistrict || liveUser.assignedStateProvince) && (
                <div className="flex items-center gap-2 text-slate-300 pt-1.5 border-t border-[#D4AF37]/20">
                  <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {language === 'ur' ? 'دائرہ کار: ' : 'Jurisdiction: '}
                    <strong className="text-[#F5D061]">
                      {liveUser.assignedDistrict
                        ? (language === 'ur' ? `ضلع ${liveUser.assignedDistrict}` : `${liveUser.assignedDistrict} District`)
                        : (language === 'ur' ? `صوبہ ${liveUser.assignedStateProvince}` : `${liveUser.assignedStateProvince} Province`)}
                    </strong>
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-4 h-4 text-[#D4AF37]/80 shrink-0" />
                <span className="tabular-nums">
                  {language === 'ur' ? 'شمولیت:' : 'Joined:'}{' '}
                  {liveUser.joinDate || liveUser.createdAt || (language === 'ur' ? 'رجسٹرڈ ممبر' : 'Registered Member')}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-[#090D16] border border-[#D4AF37]/25">
                <div className="flex items-center gap-2 text-slate-200 min-w-0">
                  <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  {showContact ? (
                    <span className="font-mono text-slate-100 truncate">{liveUser.email}</span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1.5 font-mono truncate">
                      <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />{' '}
                      {liveUser.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}
                    </span>
                  )}
                </div>
                {!showContact && (
                  <span className="text-[10px] text-[#F5D061] bg-[#161F33] border border-[#D4AF37]/30 px-1.5 py-0.5 rounded shrink-0">
                    {language === 'ur' ? 'محفوظ' : 'Protected'}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-[#090D16] border border-[#D4AF37]/25">
                <div className="flex items-center gap-2 text-slate-200 min-w-0">
                  <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span className="font-mono tabular-nums text-slate-100">
                    {liveUser.phone || (language === 'ur' ? 'درج نہیں' : 'Not provided')}
                  </span>
                </div>
              </div>
            </div>

            {/* Governance Actions: Approve / Reject & Assign Role */}
            {((canApproveMembers && !targetIsFounder && approvalState !== 'approved') || (currentIsFounder && !targetIsFounder)) && (
              <div className="mt-4 pt-3 border-t border-[#D4AF37]/20 flex flex-wrap items-center gap-2">
                {canApproveMembers && !targetIsFounder && approvalState !== 'approved' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleApproveDecision(true)}
                      className="kc-pressable flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:brightness-110 border border-[#38BDF8]/60 text-[#090D16] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#090D16]" />
                      <span>{language === 'ur' ? 'منظور کریں' : 'Approve'}</span>
                    </button>
                    {approvalState !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleApproveDecision(false)}
                        className="kc-pressable flex-1 py-2 px-3 rounded-xl bg-rose-950/90 hover:bg-rose-900 border border-rose-500/45 text-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>{language === 'ur' ? 'مسترد کریں' : 'Reject'}</span>
                      </button>
                    )}
                  </>
                )}

                {currentIsFounder && !targetIsFounder && (
                  <button
                    type="button"
                    onClick={() => setRoleModalOpen(true)}
                    className="kc-pressable flex-1 py-2 px-3 rounded-xl bg-[#231D0B] hover:bg-[#332A10] border border-[#F5D061]/55 text-[#F5D061] font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Crown className="w-4 h-4" />
                    <span>{language === 'ur' ? 'عہدہ تفویض کریں' : 'Assign Role'}</span>
                  </button>
                )}

                {currentIsFounder && !targetIsFounder && !isSelf && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null);
                      setConfirmDeleteOpen(true);
                    }}
                    className="kc-pressable py-2 px-3 rounded-xl bg-rose-950/85 hover:bg-rose-900 border border-rose-500/45 text-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>{translate(language, 'deleteMemberPermBtn')}</span>
                  </button>
                )}
              </div>
            )}

            {confirmDeleteOpen && currentIsFounder && !targetIsFounder && !isSelf && (
              <div className="mt-3 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 space-y-2.5 text-xs">
                <p className="font-extrabold text-rose-200 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{translate(language, 'deleteMemberConfirmTitle')}</span>
                </p>
                <p className="text-[11px] text-rose-100/90 leading-relaxed">
                  {translate(language, 'deleteMemberConfirmDesc')} ({liveUser.name} — {liveUser.email})
                </p>
                {deleteError && (
                  <p className="text-[11px] text-amber-300 font-semibold">{deleteError}</p>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={deleteBusy}
                    onClick={async () => {
                      setDeleteBusy(true);
                      setDeleteError(null);
                      try {
                        const res = await deleteUserPermanently(liveUser.id);
                        if (res.success) {
                          setConfirmDeleteOpen(false);
                          onClose();
                        } else {
                          setDeleteError(res.error || res.message);
                        }
                      } finally {
                        setDeleteBusy(false);
                      }
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold cursor-pointer disabled:opacity-50"
                  >
                    {deleteBusy
                      ? (language === 'ur' ? 'حذف ہو رہا ہے...' : 'Deleting...')
                      : translate(language, 'confirmPermanentDeleteBtn')}
                  </button>
                  <button
                    type="button"
                    disabled={deleteBusy}
                    onClick={() => setConfirmDeleteOpen(false)}
                    className="px-3 py-2 rounded-lg bg-[#090D16] border border-slate-700 text-slate-300 font-semibold cursor-pointer"
                  >
                    {translate(language, 'cancel')}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-3">
              {!isSelf && (
                <button
                  type="button"
                  onClick={handleStartChat}
                  className="kc-pressable kc-gold-button flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{language === 'ur' ? 'ذاتی پیغام (💬)' : 'Personal Message'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleViewDigitalCard}
                className="kc-pressable py-2.5 px-4 rounded-xl bg-[#090D16] hover:bg-[#161F33] text-slate-100 font-semibold text-xs flex items-center justify-center gap-2 border border-[#D4AF37]/40 transition-colors cursor-pointer"
              >
                <IdCard className="w-4 h-4 text-[#F5D061]" />
                <span>{language === 'ur' ? 'شناختی کارڈ' : 'Digital Card'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {roleModalOpen && (
        <AssignRoleModal
          targetUser={liveUser}
          onClose={() => setRoleModalOpen(false)}
          onAssigned={(msg) => setRoleFeedback(msg)}
        />
      )}
    </>
  );
};

