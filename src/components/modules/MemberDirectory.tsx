import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useApp, isFounderUser } from '../../context/AppContext';
import {
  Users,
  Search,
  MapPin,
  IdCard,
  MessageSquare,
  RefreshCw,
  Crown,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  Phone,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { canViewUserCnic } from '../../utils/privacy';
import { User } from '../../types';
import {
  PROVINCE_OPTIONS,
  getDistrictsForProvince,
  mapLegacyRegionToHierarchy
} from '../../data/locationData';
import { resolveUserApprovalStatus, isUserActuallyOnline } from '../../services/firebase';
import { TABBAR_CLANS, CUSTOM_TABBAR_ID, resolveUserTabbar } from '../../data/tabbars';
import { translate, AppLanguage } from '../../data/translations';
import { RoleBadge } from '../common/RoleBadge';
import { TabbarBadge, FaizKhelVipCrownIcon } from '../common/TabbarBadge';
import { isFaizKhelUser } from '../../utils/dastoor';
import { LuxurySelect } from '../common/LuxurySelect';
import { AssignRoleModal } from '../common/AssignRoleModal';

interface MemberRowProps {
  member: User;
  isCurrentUser: boolean;
  isOnlineNow: boolean;
  language: AppLanguage;
  isFocused: boolean;
  canViewSensitive: boolean;
  canViewCnic: boolean;
  canAssignRole: boolean;
  canApprove: boolean;
  onInspect: (u: User) => void;
  onCard: (u: User) => void;
  onMessage: (u: User) => void;
  onShowLocation: (u: User) => void;
  onAssignRole: (u: User) => void;
  onApproveDecision: (u: User, approved: boolean) => void;
}

const MemberCardMobile: React.FC<MemberRowProps> = React.memo(({
  member,
  isOnlineNow,
  language,
  isFocused,
  canViewSensitive,
  canViewCnic,
  canAssignRole,
  canApprove,
  onInspect,
  onCard,
  onMessage,
  onAssignRole,
  onApproveDecision
}) => {
  const fallback = mapLegacyRegionToHierarchy(member.region);
  const prov = member.stateProvince || fallback.stateProvince;
  const dist = member.district || fallback.district;
  const isProfilePending = member.profileCompleted === false && !member.isFounder;
  const avatarSrc = member.avatarUrl || member.photoUrl;
  const onlineNow = isOnlineNow;
  const approvalState = resolveUserApprovalStatus(member);
  const targetIsFounder = isFounderUser(member);
  const isFaizKhel = isFaizKhelUser(member);

  return (
    <div
      id={`member-card-${member.id}`}
      style={
        isFaizKhel
          ? {
              background: 'linear-gradient(135deg, #2B1F06 0%, #42300A 52%, #1C1404 100%)',
              boxShadow: '0 10px 28px rgba(212, 175, 55, 0.28), 0 0 16px rgba(253, 224, 71, 0.16), inset 0 1px 0 rgba(254, 240, 138, 0.34)',
            }
          : undefined
      }
      className={`relative overflow-hidden p-3.5 rounded-2xl space-y-2.5 transition-colors ${
        isFaizKhel
          ? 'border-[1.5px] border-[#FDE047]'
          : 'kc-obsidian-card'
      } ${
        isFocused
          ? 'border-[#38BDF8] ring-2 ring-[#38BDF8]/45'
          : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={member.name}
                loading="lazy"
                decoding="async"
                className={`w-10 h-10 rounded-full object-cover ${
                  isFaizKhel ? 'border-2 border-[#FDE047]' : 'border border-slate-400/30'
                }`}
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  isFaizKhel
                    ? 'bg-[#1C1404] text-[#FEF08A] border-2 border-[#FDE047]'
                    : 'bg-[#131C31] text-[#38BDF8] border border-[#38BDF8]/40'
                }`}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#090D16] ${
                onlineNow ? 'bg-emerald-500' : 'bg-slate-500'
              }`}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              {isFaizKhel && <FaizKhelVipCrownIcon className="w-[22px] h-[22px]" />}
              <span className={`font-bold text-xs truncate ${isFaizKhel ? 'text-[#FEF08A]' : 'text-[#F8FAFC]'}`}>
                {member.name}
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                  onlineNow
                    ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {onlineNow
                  ? `🟢 ${translate(language, 'online')}`
                  : `⚫ ${translate(language, 'offline')}`}
              </span>
            </div>
            <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
              <span className="font-mono text-[10px] text-[#F5D061] font-semibold">
                {member.membershipId || 'KC-PENDING'}
              </span>
              <TabbarBadge user={member} language={language} compact />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <RoleBadge
            role={member.role}
            isFounder={member.isFounder}
            isAuditOfficer={Boolean(member.isAuditOfficer)}
            compact
          />
          {approvalState === 'pending' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/50 text-[#F5D061] text-[9px] font-extrabold uppercase">
              <Clock className="w-2.5 h-2.5" />
              <span>
                {isProfilePending
                  ? (language === 'ur' ? 'پروفائل نامکمل' : 'Profile Pending')
                  : (language === 'ur' ? 'منظوری زیر التواء' : 'Pending Approval')}
              </span>
            </span>
          )}
          {approvalState === 'approved' && !targetIsFounder && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[9px] font-extrabold uppercase">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>{language === 'ur' ? 'منظور شدہ' : 'Approved'}</span>
            </span>
          )}
          {approvalState === 'rejected' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[9px] font-extrabold uppercase">
              <XCircle className="w-2.5 h-2.5" />
              <span>{translate(language, 'rejectedLabel')}</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-300">
        <span className="flex items-center gap-1 truncate">
          <MapPin className="w-3 h-3 text-[#F5D061] shrink-0" />
          <span className="truncate">{member.cityTown || dist}, {prov}</span>
        </span>
        {canViewSensitive && (
          <span className="font-mono tabular-nums font-bold text-white shrink-0">
            PKR {(member.totalContributed || 0).toLocaleString()}
          </span>
        )}
      </div>

      {member.phone && (
        <div className="text-[11px] font-mono text-slate-200 flex items-center gap-1.5">
          <Phone className="w-3 h-3 text-[#38BDF8] shrink-0" />
          <span className="tabular-nums">{member.phone}</span>
        </div>
      )}

      {canViewCnic ? (
        member.cnic && (
          <div className="text-[10px] font-mono text-slate-400">
            CNIC: {member.cnic}
          </div>
        )
      ) : (
        <div className="text-[10px] text-slate-500 flex items-center gap-1">
          <Lock className="w-3 h-3 shrink-0" />
          <span>{language === 'ur' ? 'شناختی کارڈ محفوظ ہے' : 'CNIC Protected'}</span>
        </div>
      )}

      {canApprove && !targetIsFounder && approvalState !== 'approved' && (
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onApproveDecision(member, true)}
            className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl kc-pressable cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{translate(language, 'approve')}</span>
          </button>
          {approvalState !== 'rejected' && (
            <button
              type="button"
              onClick={() => onApproveDecision(member, false)}
              className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-200 font-bold text-xs rounded-xl kc-pressable cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>{translate(language, 'reject')}</span>
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#D4AF37]/15">
        <button
          type="button"
          onClick={() => onMessage(member)}
          className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 py-2 px-3 kc-gold-button font-bold text-xs rounded-xl cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{language === 'ur' ? 'پیغام' : 'Message'}</span>
        </button>
        <button
          type="button"
          onClick={() => onInspect(member)}
          className="min-h-[44px] py-2 px-3 bg-[#090D16] hover:bg-[#1A233A] text-slate-200 border border-[#D4AF37]/25 font-semibold text-xs rounded-xl kc-pressable cursor-pointer"
        >
          {language === 'ur' ? 'پروفائل' : 'Profile'}
        </button>
        <button
          type="button"
          onClick={() => onCard(member)}
          className="min-h-[44px] inline-flex items-center gap-1.5 py-2 px-3 bg-[#090D16] hover:bg-[#1A233A] text-slate-200 border border-[#D4AF37]/25 font-semibold text-xs rounded-xl kc-pressable cursor-pointer"
        >
          <IdCard className="w-3.5 h-3.5 text-[#F5D061]" />
          <span>{language === 'ur' ? 'کارڈ' : 'Card'}</span>
        </button>
        {canAssignRole && (
          <button
            type="button"
            onClick={() => onAssignRole(member)}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#090D16] hover:bg-[#1A233A] border border-[#F5D061]/55 text-[#F5D061] font-extrabold text-xs rounded-xl kc-pressable cursor-pointer"
          >
            <Crown className="w-4 h-4" />
            <span>{language === 'ur' ? 'عہدہ مقرر کریں' : 'Assign Role'}</span>
          </button>
        )}
      </div>
    </div>
  );
});

MemberCardMobile.displayName = 'MemberCardMobile';

export const MemberDirectory: React.FC = () => {
  const {
    currentUser,
    users,
    language,
    setSelectedCardUser,
    setInspectedUserProfile,
    openPersonalMessage,
    syncAllUsersToCloud,
    approveMemberAccount,
    focusedMemberId,
    setFocusedMemberId,
    memberDirectoryFilter,
    setMemberDirectoryFilter
  } = useApp();

  const currentIsFounder = isFounderUser(currentUser);
  const canApproveMembers = Boolean(
    currentUser &&
      (currentUser.role === 'SUPER_ADMIN' ||
        currentUser.role === 'ADMIN' ||
        currentUser.permissions?.canApproveMembers)
  );
  const isPrivilegedViewer = Boolean(
    currentUser &&
      (currentUser.role === 'SUPER_ADMIN' ||
        currentUser.role === 'ADMIN' ||
        currentUser.role === 'CO_ADMIN' ||
        currentUser.isAuditOfficer)
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [rolePillFilter, setRolePillFilter] = useState<'ALL' | 'SUPER_ADMIN' | 'ADMIN' | 'CO_ADMIN' | 'AUDIT_OFFICER' | 'MEMBER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED' | 'ONLINE' | 'OFFLINE'>('ALL');
  const [tabbarFilter, setTabbarFilter] = useState<string>('ALL');
  const [isSyncingDir, setIsSyncingDir] = useState(false);
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState<string>('ALL');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>('ALL');
  const [selectedMemberForHierarchy, setSelectedMemberForHierarchy] = useState<User | null>(null);
  const [roleModalUser, setRoleModalUser] = useState<User | null>(null);
  const [roleFeedback, setRoleFeedback] = useState<string | null>(null);
  const [presenceNowMs, setPresenceNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      setPresenceNowMs(Date.now());
    }, 10000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!focusedMemberId) return;
    const timer = window.setTimeout(() => {
      const mobileEl = document.getElementById(`member-card-${focusedMemberId}`);
      const desktopEl = document.getElementById(`member-row-${focusedMemberId}`);
      const target = (desktopEl && desktopEl.offsetParent !== null) ? desktopEl : mobileEl;
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
    return () => window.clearTimeout(timer);
  }, [focusedMemberId, memberDirectoryFilter]);

  const pendingApprovalsCount = useMemo(
    () => users.filter(u => !isFounderUser(u) && resolveUserApprovalStatus(u) === 'pending').length,
    [users]
  );

  const roleCounts = useMemo(() => {
    let superAdmin = 0;
    let admin = 0;
    let coAdmin = 0;
    let auditOfficer = 0;
    let member = 0;
    users.forEach(u => {
      if (u.role === 'SUPER_ADMIN' || isFounderUser(u)) superAdmin++;
      else if (u.role === 'ADMIN') admin++;
      else if (u.role === 'CO_ADMIN') coAdmin++;
      else member++;
      if (u.isAuditOfficer) auditOfficer++;
    });
    return { superAdmin, admin, coAdmin, auditOfficer, member };
  }, [users]);

  const tabbarCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    TABBAR_CLANS.forEach(c => { counts[c.id] = 0; });
    counts[CUSTOM_TABBAR_ID] = 0;
    users.forEach(u => {
      const res = resolveUserTabbar(u);
      if (!res) return;
      if (res.isCustom) {
        counts[CUSTOM_TABBAR_ID] = (counts[CUSTOM_TABBAR_ID] || 0) + 1;
      } else {
        counts[res.id] = (counts[res.id] || 0) + 1;
      }
    });
    return counts;
  }, [users]);

  const statusCounts = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let rejected = 0;
    let online = 0;
    let offline = 0;
    users.forEach(u => {
      const approval = resolveUserApprovalStatus(u);
      if (approval === 'approved') approved++;
      else if (approval === 'pending' && !isFounderUser(u)) pending++;
      else if (approval === 'rejected') rejected++;
      if (isUserActuallyOnline(u, presenceNowMs)) online++;
      else offline++;
    });
    return { approved, pending, rejected, online, offline };
  }, [users, presenceNowMs]);

  const effectiveStatusFilter = memberDirectoryFilter === 'PENDING_APPROVAL' ? 'PENDING' : statusFilter;

  const allowedMembers = useMemo(() => {
    return users.filter(u => {
      const approval = resolveUserApprovalStatus(u);
      if (effectiveStatusFilter === 'PENDING') {
        if (isFounderUser(u) || approval !== 'pending') return false;
      } else if (effectiveStatusFilter === 'APPROVED') {
        if (approval !== 'approved') return false;
      } else if (effectiveStatusFilter === 'REJECTED') {
        if (approval !== 'rejected') return false;
      } else if (effectiveStatusFilter === 'ONLINE') {
        if (!isUserActuallyOnline(u, presenceNowMs)) return false;
      } else if (effectiveStatusFilter === 'OFFLINE') {
        if (isUserActuallyOnline(u, presenceNowMs)) return false;
      }

      if (rolePillFilter === 'SUPER_ADMIN' && u.role !== 'SUPER_ADMIN' && !isFounderUser(u)) return false;
      if (rolePillFilter === 'ADMIN' && u.role !== 'ADMIN') return false;
      if (rolePillFilter === 'CO_ADMIN' && u.role !== 'CO_ADMIN') return false;
      if (rolePillFilter === 'AUDIT_OFFICER' && !u.isAuditOfficer) return false;
      if (rolePillFilter === 'MEMBER' && u.role !== 'MEMBER') return false;

      if (tabbarFilter !== 'ALL') {
        const res = resolveUserTabbar(u);
        if (!res) return false;
        if (tabbarFilter === CUSTOM_TABBAR_ID) {
          if (!res.isCustom) return false;
        } else if (res.id !== tabbarFilter) {
          return false;
        }
      }
      return true;
    });
  }, [users, effectiveStatusFilter, rolePillFilter, tabbarFilter, presenceNowMs]);

  const filteredMembers = useMemo(() => {
    if (!currentUser) return [];
    const q = searchTerm.toLowerCase();
    return allowedMembers.filter(member => {
      const memLoc = mapLegacyRegionToHierarchy(member.region);
      const mProvince = member.stateProvince || memLoc.stateProvince;
      const mDistrict = member.district || memLoc.district;
      const mTehsil = member.tehsil || memLoc.tehsil || '';
      const mCity = member.cityTown || memLoc.cityTown || '';
      const resolvedTab = resolveUserTabbar(member);

      const canSeeMemberPII = isPrivilegedViewer || member.id === currentUser.id;
      const matchesSearch =
        !q ||
        member.name.toLowerCase().includes(q) ||
        (member.membershipId && member.membershipId.toLowerCase().includes(q)) ||
        (member.tabbarEnglish && member.tabbarEnglish.toLowerCase().includes(q)) ||
        (member.tabbarUrdu && member.tabbarUrdu.toLowerCase().includes(q)) ||
        (resolvedTab && (resolvedTab.englishName.toLowerCase().includes(q) || resolvedTab.urduName.toLowerCase().includes(q))) ||
        (member.phone && member.phone.includes(searchTerm)) ||
        (canViewUserCnic(currentUser, member) && member.cnic && member.cnic.includes(searchTerm)) ||
        (canSeeMemberPII && member.email.toLowerCase().includes(q)) ||
        mDistrict.toLowerCase().includes(q) ||
        mProvince.toLowerCase().includes(q) ||
        mTehsil.toLowerCase().includes(q) ||
        mCity.toLowerCase().includes(q);

      const matchesProvince = selectedProvinceFilter === 'ALL' || mProvince === selectedProvinceFilter;
      const matchesDistrict = selectedDistrictFilter === 'ALL' || mDistrict === selectedDistrictFilter;

      return matchesSearch && matchesProvince && matchesDistrict;
    });
  }, [allowedMembers, currentUser, isPrivilegedViewer, searchTerm, selectedProvinceFilter, selectedDistrictFilter]);

  const handleOpenMessage = useCallback((member: User) => {
    openPersonalMessage(member);
  }, [openPersonalMessage]);

  const handleApproveDecision = useCallback((member: User, approved: boolean) => {
    const res = approveMemberAccount(member.id, approved);
    setRoleFeedback(res.message);
    if (focusedMemberId === member.id) {
      setFocusedMemberId(null);
    }
  }, [approveMemberAccount, focusedMemberId, setFocusedMemberId]);

  if (!currentUser) return null;

  const handleManualCloudSync = async () => {
    setIsSyncingDir(true);
    try {
      await syncAllUsersToCloud();
    } finally {
      setIsSyncingDir(false);
    }
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#F5D061] uppercase tracking-wider">
              {language === 'ur' ? 'لائیو کمیونٹی رجسٹری' : 'Live Community Registry'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#F5D061] shrink-0" />
            <span>{language === 'ur' ? 'ممبران ڈائریکٹری اور ریکارڈز' : 'Member Directory & Records'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'ur'
              ? 'لائیو فائربیس ڈائریکٹری: تمام ممبران، ٹبر/شاخ کے بیجز، عہدے اور فوری پیغام رسانی۔'
              : 'Live Firebase directory showing all synced members, Tabbar clans, leadership badges, and direct messaging.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleManualCloudSync}
            disabled={isSyncingDir}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131C31] border border-[#38BDF8]/35 text-[#38BDF8] text-xs font-bold hover:border-[#F5D061] hover:text-[#F5D061] kc-pressable cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDir ? 'animate-spin' : ''}`} />
            <span className="tabular-nums">
              {language === 'ur' ? `کلاؤڈ سنک (${filteredMembers.length})` : `Sync Cloud (${filteredMembers.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* Dynamic Real-Time Search & Role/Status Filter Bar */}
      <div className="p-3 rounded-2xl bg-[#090D16]/90 border border-[#D4AF37]/30 space-y-2.5 shadow-lg shadow-black/25">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#F5D061] uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>{language === 'ur' ? 'تلاش اور فلٹر بار' : 'Search & Filter Directory'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-300 font-bold tabular-nums">
              {language === 'ur'
                ? `${filteredMembers.length} / ${users.length} ممبران`
                : `Showing ${filteredMembers.length} of ${users.length}`}
            </span>
            {(searchTerm ||
              rolePillFilter !== 'ALL' ||
              effectiveStatusFilter !== 'ALL' ||
              tabbarFilter !== 'ALL' ||
              selectedProvinceFilter !== 'ALL' ||
              selectedDistrictFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setRolePillFilter('ALL');
                  setStatusFilter('ALL');
                  setMemberDirectoryFilter('ALL');
                  setTabbarFilter('ALL');
                  setSelectedProvinceFilter('ALL');
                  setSelectedDistrictFilter('ALL');
                  setFocusedMemberId(null);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-200 text-[10px] font-bold hover:bg-rose-900 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>{language === 'ur' ? 'سب صاف کریں' : 'Reset'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Dynamic Real-Time Search Input */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="w-3.5 h-3.5 text-[#D4AF37] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={
                language === 'ur'
                  ? 'نام، ٹبر، آئی ڈی، فون یا شہر تلاش کریں...'
                  : 'Search name, Tabbar, ID, phone, city...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-8 py-2 min-h-[40px] text-xs kc-luxury-input rounded-xl w-full"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Real-Time Member Role Filter */}
          <div>
            <LuxurySelect
              label={language === 'ur' ? 'عہدہ فلٹر' : 'Role Filter'}
              value={rolePillFilter}
              onChange={(val) =>
                setRolePillFilter(
                  val as 'ALL' | 'SUPER_ADMIN' | 'ADMIN' | 'CO_ADMIN' | 'AUDIT_OFFICER' | 'MEMBER'
                )
              }
              options={[
                { value: 'ALL', label: `${language === 'ur' ? 'تمام عہدے' : 'All Roles'} (${users.length})` },
                { value: 'SUPER_ADMIN', label: `${translate(language, 'roleSuperAdmin')} (${roleCounts.superAdmin})` },
                { value: 'ADMIN', label: `${translate(language, 'roleAdmin')} (${roleCounts.admin})` },
                { value: 'CO_ADMIN', label: `${translate(language, 'roleCoAdmin')} (${roleCounts.coAdmin})` },
                { value: 'AUDIT_OFFICER', label: `${translate(language, 'roleAuditOfficer')} (${roleCounts.auditOfficer})` },
                { value: 'MEMBER', label: `${translate(language, 'roleMember')} (${roleCounts.member})` },
              ]}
              compact
            />
          </div>

          {/* Real-Time Member Status Filter */}
          <div>
            <LuxurySelect
              label={language === 'ur' ? 'اسٹیٹس فلٹر' : 'Status Filter'}
              value={effectiveStatusFilter}
              onChange={(val) => {
                const nextStatus = val as 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED' | 'ONLINE' | 'OFFLINE';
                setStatusFilter(nextStatus);
                setMemberDirectoryFilter(nextStatus === 'PENDING' ? 'PENDING_APPROVAL' : 'ALL');
              }}
              options={[
                { value: 'ALL', label: `${language === 'ur' ? 'تمام اسٹیٹس' : 'All Statuses'} (${users.length})` },
                { value: 'APPROVED', label: `${language === 'ur' ? 'منظور شدہ' : 'Approved'} (${statusCounts.approved})` },
                { value: 'PENDING', label: `${language === 'ur' ? 'زیرِ منظوری' : 'Pending Approval'} (${pendingApprovalsCount})` },
                { value: 'REJECTED', label: `${translate(language, 'rejectedLabel')} (${statusCounts.rejected})` },
                { value: 'ONLINE', label: `🟢 ${translate(language, 'online')} (${statusCounts.online})` },
                { value: 'OFFLINE', label: `⚫ ${translate(language, 'offline')} (${statusCounts.offline})` },
              ]}
              compact
            />
          </div>

          {/* Province + District Filter */}
          <div className="grid grid-cols-2 gap-2">
            <LuxurySelect
              label={language === 'ur' ? 'صوبہ' : 'Province'}
              value={selectedProvinceFilter}
              onChange={(val) => {
                setSelectedProvinceFilter(val);
                setSelectedDistrictFilter('ALL');
              }}
              options={[
                { value: 'ALL', label: language === 'ur' ? 'تمام صوبے' : 'All Prov.' },
                ...PROVINCE_OPTIONS.map(p => ({ value: p, label: p }))
              ]}
              compact
            />
            <LuxurySelect
              label={language === 'ur' ? 'ضلع' : 'District'}
              value={selectedDistrictFilter}
              onChange={setSelectedDistrictFilter}
              options={[
                { value: 'ALL', label: language === 'ur' ? 'تمام اضلاع' : 'All Dist.' },
                ...(selectedProvinceFilter !== 'ALL'
                  ? getDistrictsForProvince(selectedProvinceFilter)
                  : PROVINCE_OPTIONS.flatMap(p => getDistrictsForProvince(p))
                ).map(dist => ({ value: dist, label: dist }))
              ]}
              searchable
              compact
            />
          </div>
        </div>
      </div>

      {/* Primary Quick-Filter Pills: All / Status / Role Filters */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 kc-tab-shell rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setMemberDirectoryFilter('ALL');
              setStatusFilter('ALL');
              setRolePillFilter('ALL');
              setTabbarFilter('ALL');
              setFocusedMemberId(null);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold kc-pressable cursor-pointer ${
              effectiveStatusFilter === 'ALL' && rolePillFilter === 'ALL' && tabbarFilter === 'ALL'
                ? 'kc-gold-button'
                : 'text-slate-300 hover:text-white hover:bg-[#141B2D]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="tabular-nums">{translate(language, 'tabbarAllFilter')} ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const nextPending = effectiveStatusFilter !== 'PENDING';
              setStatusFilter(nextPending ? 'PENDING' : 'ALL');
              setMemberDirectoryFilter(nextPending ? 'PENDING_APPROVAL' : 'ALL');
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold kc-pressable cursor-pointer ${
              effectiveStatusFilter === 'PENDING'
                ? 'kc-gold-button'
                : 'text-[#F5D061] hover:bg-[#141B2D]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{translate(language, 'pendingApprovalsFilter')}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black tabular-nums ${
                effectiveStatusFilter === 'PENDING'
                  ? 'bg-[#090D16] text-[#F5D061]'
                  : pendingApprovalsCount > 0
                  ? 'bg-rose-600 text-white'
                  : 'bg-[#141B2D] text-slate-400'
              }`}
            >
              {pendingApprovalsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMemberDirectoryFilter('ALL');
              setStatusFilter(effectiveStatusFilter === 'APPROVED' ? 'ALL' : 'APPROVED');
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold kc-pressable cursor-pointer ${
              effectiveStatusFilter === 'APPROVED'
                ? 'kc-gold-button font-extrabold'
                : 'bg-[#090D16]/75 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>{language === 'ur' ? 'منظور شدہ' : 'Approved'}</span>
            <span className="tabular-nums opacity-80">({statusCounts.approved})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMemberDirectoryFilter('ALL');
              setStatusFilter(effectiveStatusFilter === 'ONLINE' ? 'ALL' : 'ONLINE');
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold kc-pressable cursor-pointer ${
              effectiveStatusFilter === 'ONLINE'
                ? 'kc-gold-button font-extrabold'
                : 'bg-[#090D16]/75 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400'
            }`}
          >
            <span>🟢 {translate(language, 'online')}</span>
            <span className="tabular-nums opacity-80">({statusCounts.online})</span>
          </button>

          <div className="h-5 w-px bg-[#D4AF37]/20 hidden sm:block mx-0.5" />

          {([
            { id: 'SUPER_ADMIN', label: translate(language, 'roleSuperAdmin'), count: roleCounts.superAdmin },
            { id: 'ADMIN', label: translate(language, 'roleAdmin'), count: roleCounts.admin },
            { id: 'CO_ADMIN', label: translate(language, 'roleCoAdmin'), count: roleCounts.coAdmin },
            { id: 'AUDIT_OFFICER', label: translate(language, 'roleAuditOfficer'), count: roleCounts.auditOfficer },
            { id: 'MEMBER', label: translate(language, 'roleMember'), count: roleCounts.member },
          ] as const).map(rp => {
            const active = rolePillFilter === rp.id;
            return (
              <button
                key={rp.id}
                type="button"
                onClick={() => setRolePillFilter(active ? 'ALL' : rp.id)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold kc-pressable cursor-pointer ${
                  active
                    ? 'kc-gold-button font-extrabold'
                    : 'bg-[#090D16]/75 text-slate-300 border border-[#D4AF37]/20 hover:border-[#D4AF37]/50'
                }`}
              >
                <span>{rp.label}</span>
                <span className="tabular-nums opacity-80">({rp.count})</span>
              </button>
            );
          })}
        </div>

        {/* 11 Official Tabbar Clan Quick-Filter Pills */}
        <div className="p-2 rounded-2xl bg-[#090D16]/90 border border-[#D4AF37]/25 space-y-1.5">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-[10px] font-extrabold text-[#F5D061] uppercase tracking-wider">
              {translate(language, 'tabbarFilterLabel')}
            </span>
            {tabbarFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setTabbarFilter('ALL')}
                className="text-[10px] text-emerald-300 hover:underline font-bold cursor-pointer"
              >
                {language === 'ur' ? 'فلٹر صاف کریں' : 'Clear Tabbar Filter'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setTabbarFilter('ALL')}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold border kc-pressable cursor-pointer ${
                tabbarFilter === 'ALL'
                  ? 'kc-gold-button border-[#FCE38A]'
                  : 'bg-[#111726] border-[#D4AF37]/25 text-slate-300 hover:border-[#D4AF37]/55'
              }`}
            >
              {translate(language, 'allLabel')} ({users.length})
            </button>
            {TABBAR_CLANS.map(clan => {
              const count = tabbarCounts[clan.id] || 0;
              const isSelected = tabbarFilter === clan.id;
              const isFlagship = Boolean(clan.isFlagship);
              return (
                <button
                  key={clan.id}
                  type="button"
                  onClick={() => setTabbarFilter(isSelected ? 'ALL' : clan.id)}
                  style={
                    isSelected
                      ? { background: clan.gradientBg, borderColor: clan.borderColor, color: clan.textColor }
                      : isFlagship
                      ? { background: 'linear-gradient(135deg, #2B1F06 0%, #42300A 52%, #1C1404 100%)', borderColor: '#FDE047', color: '#FEF08A' }
                      : undefined
                  }
                  className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border kc-pressable cursor-pointer ${
                    isSelected
                      ? 'ring-1 ring-[#FDE047]/65 shadow-md'
                      : isFlagship
                      ? 'border-[1.5px] hover:brightness-110 shadow-[0_2px_10px_rgba(253,224,71,0.22)]'
                      : 'bg-[#131C31] border-slate-400/20 text-[#F8FAFC] hover:border-[#38BDF8]/50'
                  }`}
                >
                  {isFlagship ? <FaizKhelVipCrownIcon className="w-[22px] h-[22px]" /> : <span className="text-xs leading-none">{clan.emblem}</span>}
                  <span className="font-urdu-auto">
                    {language === 'ur' ? clan.urduName : `${clan.urduName} · ${clan.englishName}`}
                  </span>
                  {isFlagship && (
                    <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#FEF08A] via-[#FDE047] to-[#D4AF37] text-[#1C1404] text-[9px] font-black uppercase leading-none">
                      VIP
                    </span>
                  )}
                  <span className="tabular-nums text-[10px] opacity-80">({count})</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setTabbarFilter(tabbarFilter === CUSTOM_TABBAR_ID ? 'ALL' : CUSTOM_TABBAR_ID)}
              className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border kc-pressable cursor-pointer ${
                tabbarFilter === CUSTOM_TABBAR_ID
                  ? 'kc-gold-button border-[#FCE38A]'
                  : 'bg-[#111726] border-[#D4AF37]/25 text-slate-300 hover:border-[#D4AF37]/55'
              }`}
            >
              <span>🏛️</span>
              <span>{language === 'ur' ? 'دیگر ٹبر' : 'Custom'}</span>
              <span className="tabular-nums text-[10px] opacity-80">({tabbarCounts[CUSTOM_TABBAR_ID] || 0})</span>
            </button>
          </div>
        </div>
      </div>

      {roleFeedback && (
        <div className="p-3.5 rounded-2xl kc-emerald-panel text-emerald-100 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#F5D061] shrink-0" />
            <span>{roleFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setRoleFeedback(null)}
            className="text-[#F5D061] hover:text-white text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Mobile-First Member Cards */}
      <div className="space-y-3">
        {filteredMembers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 kc-obsidian-card rounded-2xl">
            {memberDirectoryFilter === 'PENDING_APPROVAL'
              ? (language === 'ur' ? 'اس وقت کوئی منظوری زیر التواء نہیں ہے۔' : 'No pending member approvals right now.')
              : translate(language, 'noResultsFound')}
          </div>
        ) : (
          filteredMembers.map(member => (
            <MemberCardMobile
              key={member.id}
              member={member}
              isCurrentUser={member.id === currentUser.id}
              isOnlineNow={isUserActuallyOnline(member, presenceNowMs)}
              language={language}
              isFocused={focusedMemberId === member.id}
              canViewSensitive={isPrivilegedViewer || member.id === currentUser.id}
              canViewCnic={canViewUserCnic(currentUser, member)}
              canAssignRole={currentIsFounder && !isFounderUser(member)}
              canApprove={canApproveMembers}
              onInspect={setInspectedUserProfile}
              onCard={setSelectedCardUser}
              onMessage={handleOpenMessage}
              onShowLocation={setSelectedMemberForHierarchy}
              onAssignRole={setRoleModalUser}
              onApproveDecision={handleApproveDecision}
            />
          ))
        )}
      </div>

      {/* Founder Role Assignment Modal */}
      <AssignRoleModal
        targetUser={roleModalUser}
        onClose={() => setRoleModalUser(null)}
        onAssigned={(msg) => setRoleFeedback(msg)}
      />

      {/* Location Hierarchy Modal */}
      {selectedMemberForHierarchy && (
        <div className="fixed inset-0 z-[95] kc-modal-backdrop flex items-start sm:items-center justify-center bg-black/80 overflow-y-auto">
          <div className="w-full max-w-md kc-luxury-modal kc-modal-panel rounded-2xl p-5 pb-24 sm:pb-5 space-y-4 my-auto overflow-y-auto text-white">
            <div className="flex items-start justify-between gap-2.5 pb-3 border-b border-[#D4AF37]/20">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <MapPin className="w-5 h-5 text-[#F5D061] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white break-words whitespace-normal leading-snug">
                    {language === 'ur' ? 'انتظامی مقام و پتہ' : 'Administrative Location'}
                  </h3>
                  <p className="text-[11px] text-slate-400 break-words whitespace-normal leading-snug mt-0.5">{selectedMemberForHierarchy.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMemberForHierarchy(null)}
                aria-label={language === 'ur' ? 'بند کریں' : 'Close'}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl bg-[#090D16] border border-[#D4AF37]/30 text-slate-300 hover:text-white kc-pressable cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-[#090D16] rounded-xl border border-[#D4AF37]/25 space-y-2 text-xs">
              {[
                { label: language === 'ur' ? 'ملک' : 'Country', val: selectedMemberForHierarchy.country || 'Pakistan' },
                { label: language === 'ur' ? 'صوبہ / ریاست' : 'Province / State', val: selectedMemberForHierarchy.stateProvince || 'Punjab' },
                { label: language === 'ur' ? 'ضلع' : 'District', val: selectedMemberForHierarchy.district || 'Lahore' },
                { label: language === 'ur' ? 'شہر / قصبہ' : 'City / Town', val: selectedMemberForHierarchy.customCity || selectedMemberForHierarchy.cityTown || selectedMemberForHierarchy.district },
                { label: language === 'ur' ? 'یونین کونسل' : 'Union Council', val: selectedMemberForHierarchy.unionCouncil || '—' }
              ].map((st) => (
                <div key={st.label} className="flex items-center justify-between py-1 border-b border-[#D4AF37]/10 last:border-0">
                  <span className="text-slate-400">{st.label}:</span>
                  <span className="font-bold text-white">{st.val}</span>
                </div>
              ))}
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setSelectedMemberForHierarchy(null)}
                className="px-4 py-1.5 bg-[#090D16] hover:bg-[#1A233A] border border-[#D4AF37]/30 text-white text-xs font-semibold rounded-xl kc-pressable cursor-pointer"
              >
                {translate(language, 'close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
