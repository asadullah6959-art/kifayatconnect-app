import React, { useState } from 'react';
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
  Lock
} from 'lucide-react';
import { User } from '../../types';
import {
  PROVINCE_OPTIONS,
  getDistrictsForProvince,
  mapLegacyRegionToHierarchy
} from '../../data/locationData';
import { RoleBadge } from '../common/RoleBadge';
import { LuxurySelect } from '../common/LuxurySelect';
import { AssignRoleModal } from '../common/AssignRoleModal';

interface MemberRowProps {
  member: User;
  canViewSensitive: boolean;
  canAssignRole: boolean;
  onInspect: (u: User) => void;
  onCard: (u: User) => void;
  onMessage: (u: User) => void;
  onShowLocation: (u: User) => void;
  onAssignRole: (u: User) => void;
}

const MemberCardMobile: React.FC<MemberRowProps> = React.memo(({
  member,
  canViewSensitive,
  canAssignRole,
  onInspect,
  onCard,
  onMessage,
  onAssignRole
}) => {
  const fallback = mapLegacyRegionToHierarchy(member.region);
  const prov = member.stateProvince || fallback.stateProvince;
  const dist = member.district || fallback.district;
  const isProfilePending = member.profileCompleted === false && !member.isFounder;
  const avatarSrc = member.avatarUrl || member.photoUrl;

  return (
    <div className="p-3.5 rounded-xl border border-[#D4AF37]/25 bg-[#111622] space-y-2.5 shadow-2xs">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={member.name}
              className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]/40 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#043927] text-[#F5D061] border border-[#D4AF37]/40 flex items-center justify-center font-bold text-sm shrink-0">
              {member.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <span className="font-bold text-xs text-white block truncate">{member.name}</span>
            <span className="font-mono text-[10px] text-[#F5D061] font-semibold block">
              {member.membershipId || 'KC-PENDING'}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <RoleBadge
            role={member.role}
            isFounder={member.isFounder}
            isAuditOfficer={Boolean(member.isAuditOfficer)}
            compact
          />
          {isProfilePending && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/50 text-[#F5D061] text-[9px] font-extrabold uppercase">
              Profile Pending
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
          <span className="font-mono font-bold text-white shrink-0">
            PKR {(member.totalContributed || 0).toLocaleString()}
          </span>
        )}
      </div>

      {canViewSensitive ? (
        member.cnic && (
          <div className="text-[10px] font-mono text-slate-400">
            CNIC: {member.cnic}
          </div>
        )
      ) : (
        <div className="text-[10px] text-slate-500 flex items-center gap-1">
          <Lock className="w-3 h-3 shrink-0" />
          <span>Contact &amp; CNIC Protected</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={() => onMessage(member)}
          className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2.5 kc-gold-button font-bold text-[11px] rounded-lg cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Message</span>
        </button>
        <button
          type="button"
          onClick={() => onInspect(member)}
          className="py-1.5 px-2.5 bg-[#161D2C] text-slate-200 border border-slate-700 font-semibold text-[11px] rounded-lg cursor-pointer"
        >
          Profile
        </button>
        <button
          type="button"
          onClick={() => onCard(member)}
          className="py-1.5 px-2.5 bg-[#161D2C] text-slate-200 border border-slate-700 font-semibold text-[11px] rounded-lg cursor-pointer"
        >
          Card
        </button>
        {canAssignRole && (
          <button
            type="button"
            onClick={() => onAssignRole(member)}
            className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-[#231D0B] hover:bg-[#332A10] border border-[#F5D061]/55 text-[#F5D061] font-extrabold text-[11px] rounded-lg cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Assign Role</span>
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
    setSelectedCardUser,
    setInspectedUserProfile,
    setActiveChatUser,
    setActiveTab,
    syncAllUsersToCloud
  } = useApp();

  const currentIsFounder = isFounderUser(currentUser);
  const isPrivilegedViewer = Boolean(
    currentUser &&
      (currentUser.role === 'SUPER_ADMIN' ||
        currentUser.role === 'ADMIN' ||
        currentUser.role === 'CO_ADMIN' ||
        currentUser.isAuditOfficer)
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'MEMBER' | 'STAFF'>('ALL');
  const [isSyncingDir, setIsSyncingDir] = useState(false);
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState<string>('ALL');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>('ALL');
  const [selectedMemberForHierarchy, setSelectedMemberForHierarchy] = useState<User | null>(null);
  const [roleModalUser, setRoleModalUser] = useState<User | null>(null);
  const [roleFeedback, setRoleFeedback] = useState<string | null>(null);

  if (!currentUser) return null;

  const allowedMembers = users.filter(u => {
    if (roleFilter === 'MEMBER' && u.role !== 'MEMBER') return false;
    if (roleFilter === 'STAFF' && u.role === 'MEMBER' && !u.isAuditOfficer) return false;
    return true;
  });

  const filteredMembers = allowedMembers.filter(member => {
    const memLoc = mapLegacyRegionToHierarchy(member.region);
    const mProvince = member.stateProvince || memLoc.stateProvince;
    const mDistrict = member.district || memLoc.district;
    const mTehsil = member.tehsil || memLoc.tehsil || '';
    const mCity = member.cityTown || memLoc.cityTown || '';

    const canSeeMemberPII = isPrivilegedViewer || member.id === currentUser.id;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      member.name.toLowerCase().includes(q) ||
      (member.membershipId && member.membershipId.toLowerCase().includes(q)) ||
      (canSeeMemberPII && member.cnic && member.cnic.includes(searchTerm)) ||
      (canSeeMemberPII && member.email.toLowerCase().includes(q)) ||
      mDistrict.toLowerCase().includes(q) ||
      mProvince.toLowerCase().includes(q) ||
      mTehsil.toLowerCase().includes(q) ||
      mCity.toLowerCase().includes(q);

    const matchesProvince = selectedProvinceFilter === 'ALL' || mProvince === selectedProvinceFilter;
    const matchesDistrict = selectedDistrictFilter === 'ALL' || mDistrict === selectedDistrictFilter;

    return matchesSearch && matchesProvince && matchesDistrict;
  });

  const handleManualCloudSync = async () => {
    setIsSyncingDir(true);
    try {
      await syncAllUsersToCloud();
    } finally {
      setIsSyncingDir(false);
    }
  };

  const handleOpenMessage = (member: User) => {
    setActiveChatUser(member);
    setActiveTab('chat');
  };

  return (
    <div className="space-y-5 max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#F5D061] uppercase tracking-wider">
              Live Community Registry
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#F5D061] shrink-0" />
            <span>Member Directory &amp; Records</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Live Firebase directory showing all synced members, leadership badges, and direct messaging.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleManualCloudSync}
            disabled={isSyncingDir}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161D2C] border border-[#D4AF37]/40 text-[#F5D061] text-xs font-bold hover:border-[#D4AF37] transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDir ? 'animate-spin' : ''}`} />
            <span>Sync Cloud ({allowedMembers.length})</span>
          </button>

          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search member, ID, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-[#0A0D12] border border-[#D4AF37]/30 rounded-xl text-white focus:outline-none focus:border-[#D4AF37] w-full sm:w-52"
            />
          </div>

          <div className="w-40">
            <LuxurySelect
              label="Account Scope"
              value={roleFilter}
              onChange={(val) => setRoleFilter(val as 'ALL' | 'MEMBER' | 'STAFF')}
              options={[
                { value: 'ALL', label: 'All Accounts' },
                { value: 'MEMBER', label: 'Members Only' },
                { value: 'STAFF', label: 'Officials & Audit' }
              ]}
              compact
            />
          </div>

          <div className="w-44">
            <LuxurySelect
              label="Province Filter"
              value={selectedProvinceFilter}
              onChange={(val) => {
                setSelectedProvinceFilter(val);
                setSelectedDistrictFilter('ALL');
              }}
              options={[
                { value: 'ALL', label: 'All Provinces' },
                ...PROVINCE_OPTIONS.map(p => ({ value: p, label: p }))
              ]}
              compact
            />
          </div>

          <div className="w-44">
            <LuxurySelect
              label="District Filter"
              value={selectedDistrictFilter}
              onChange={setSelectedDistrictFilter}
              options={[
                { value: 'ALL', label: 'All Districts' },
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

      {roleFeedback && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2">
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

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredMembers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-[#111622] rounded-xl border border-[#D4AF37]/25">
            No registered members found yet.
          </div>
        ) : (
          filteredMembers.map(member => (
            <MemberCardMobile
              key={member.id}
              member={member}
              canViewSensitive={isPrivilegedViewer || member.id === currentUser.id}
              canAssignRole={currentIsFounder && !isFounderUser(member)}
              onInspect={setInspectedUserProfile}
              onCard={setSelectedCardUser}
              onMessage={handleOpenMessage}
              onShowLocation={setSelectedMemberForHierarchy}
              onAssignRole={setRoleModalUser}
            />
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-[#111622] rounded-xl border border-[#D4AF37]/25 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0A0D12] text-slate-400 font-medium">
                <th className="py-3 px-4">Member Name &amp; ID</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">CNIC Number</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-right">Total Contributed</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No registered members found yet.
                  </td>
                </tr>
              ) : (
                filteredMembers.map(member => {
                  const fallback = mapLegacyRegionToHierarchy(member.region);
                  const prov = member.stateProvince || fallback.stateProvince;
                  const dist = member.district || fallback.district;
                  const canSeeSensitive = isPrivilegedViewer || member.id === currentUser.id;
                  const isProfilePending = member.profileCompleted === false && !member.isFounder;
                  const avatarSrc = member.avatarUrl || member.photoUrl;

                  return (
                    <tr key={member.id} className="hover:bg-[#161D2C]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {avatarSrc ? (
                            <img
                              src={avatarSrc}
                              alt={member.name}
                              className="w-8 h-8 rounded-full object-cover border border-[#D4AF37]/40 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#043927] text-[#F5D061] border border-[#D4AF37]/40 flex items-center justify-center font-bold text-xs shrink-0">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-white block">{member.name}</span>
                            <span className="font-mono text-[11px] text-[#F5D061] font-semibold">
                              {member.membershipId || 'KC-PENDING'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#F5D061] shrink-0" />
                          <span className="font-bold text-white">{member.cityTown || dist}</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-300">{prov}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedMemberForHierarchy(member)}
                          className="text-[10px] text-emerald-400 hover:underline font-semibold mt-0.5 cursor-pointer"
                        >
                          Location Trail
                        </button>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-300">
                        {canSeeSensitive ? (
                          member.cnic || '—'
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <Lock className="w-3 h-3" />
                            <span>Protected</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {canSeeSensitive ? (
                          <>
                            <div>{member.phone || '—'}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{member.email}</div>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <Lock className="w-3 h-3" />
                            <span>Protected</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-white">
                        {canSeeSensitive ? `PKR ${(member.totalContributed || 0).toLocaleString()}` : '—'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <RoleBadge
                            role={member.role}
                            isFounder={member.isFounder}
                            isAuditOfficer={Boolean(member.isAuditOfficer)}
                            compact
                          />
                          {isProfilePending && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/50 text-[#F5D061] text-[9px] font-extrabold uppercase">
                              Profile Pending
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {currentIsFounder && !isFounderUser(member) && (
                            <button
                              type="button"
                              onClick={() => setRoleModalUser(member)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#231D0B] hover:bg-[#332A10] border border-[#F5D061]/55 text-[#F5D061] rounded font-extrabold cursor-pointer"
                            >
                              <Crown className="w-3 h-3" />
                              <span>Assign Role</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenMessage(member)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 kc-gold-button rounded font-bold transition-colors cursor-pointer"
                            title="Send Direct Message"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Message</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setInspectedUserProfile(member)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#161D2C] hover:bg-slate-800 border border-slate-700 text-slate-200 rounded font-medium cursor-pointer"
                          >
                            <span>Profile</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedCardUser(member)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#161D2C] hover:bg-slate-800 border border-slate-700 text-slate-200 rounded font-medium cursor-pointer"
                          >
                            <IdCard className="w-3.5 h-3.5 text-[#F5D061]" />
                            <span>Card</span>
                          </button>
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

      {/* Founder Role Assignment Modal */}
      <AssignRoleModal
        targetUser={roleModalUser}
        onClose={() => setRoleModalUser(null)}
        onAssigned={(msg) => setRoleFeedback(msg)}
      />

      {/* Location Hierarchy Modal */}
      {selectedMemberForHierarchy && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-[#0A0D12]/90 p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-[#111622] rounded-xl shadow-2xl border border-[#D4AF37]/35 p-5 space-y-4 my-auto text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#F5D061]" />
                <div>
                  <h3 className="text-sm font-bold text-white">Administrative Location</h3>
                  <p className="text-[11px] text-slate-400">{selectedMemberForHierarchy.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMemberForHierarchy(null)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-[#0A0D12] rounded-lg border border-slate-800 space-y-2 text-xs">
              {[
                { label: 'Country', val: selectedMemberForHierarchy.country || 'Pakistan' },
                { label: 'Province / State', val: selectedMemberForHierarchy.stateProvince || 'Punjab' },
                { label: 'District', val: selectedMemberForHierarchy.district || 'Lahore' },
                { label: 'City / Town', val: selectedMemberForHierarchy.customCity || selectedMemberForHierarchy.cityTown || selectedMemberForHierarchy.district },
                { label: 'Union Council', val: selectedMemberForHierarchy.unionCouncil || '—' }
              ].map((st) => (
                <div key={st.label} className="flex items-center justify-between py-1 border-b border-slate-800/70 last:border-0">
                  <span className="text-slate-400">{st.label}:</span>
                  <span className="font-bold text-white">{st.val}</span>
                </div>
              ))}
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setSelectedMemberForHierarchy(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
