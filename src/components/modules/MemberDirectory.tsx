import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Search,
  MapPin,
  IdCard,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';
import { User } from '../../types';
import {
  PROVINCE_OPTIONS,
  getDistrictsForProvince,
  mapLegacyRegionToHierarchy
} from '../../data/locationData';
import { RoleBadge } from '../common/RoleBadge';

interface MemberRowProps {
  member: User;
  onInspect: (u: User) => void;
  onCard: (u: User) => void;
  onMessage: (u: User) => void;
  onShowLocation: (u: User) => void;
}

const MemberCardMobile: React.FC<MemberRowProps> = React.memo(({
  member,
  onInspect,
  onCard,
  onMessage
}) => {
  const fallback = mapLegacyRegionToHierarchy(member.region);
  const prov = member.stateProvince || fallback.stateProvince;
  const dist = member.district || fallback.district;

  return (
    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 shadow-2xs">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={member.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#0a192f] text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
              {member.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">{member.name}</span>
            <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-semibold block">
              {member.membershipId || 'KC-PENDING'}
            </span>
          </div>
        </div>
        <RoleBadge role={member.role} isFounder={member.isFounder} compact />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1 truncate">
          <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
          <span className="truncate">{member.cityTown || dist}, {prov}</span>
        </span>
        <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
          PKR {(member.totalContributed || 0).toLocaleString()}
        </span>
      </div>

      {member.cnic && (
        <div className="text-[10px] font-mono text-slate-400">
          CNIC: {member.cnic}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => onMessage(member)}
          className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Message</span>
        </button>
        <button
          onClick={() => onInspect(member)}
          className="py-1.5 px-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-[11px] rounded-lg"
        >
          Profile
        </button>
        <button
          onClick={() => onCard(member)}
          className="py-1.5 px-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-[11px] rounded-lg"
        >
          Card
        </button>
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
    setActiveTab
  } = useApp();

  const isDistrictAdmin = currentUser?.role === 'ADMIN';
  const isCoAdmin = currentUser?.role === 'CO_ADMIN';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState<string>(
    isCoAdmin || isDistrictAdmin ? (currentUser?.assignedStateProvince || currentUser?.stateProvince || 'ALL') : 'ALL'
  );
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>(
    isDistrictAdmin ? (currentUser?.assignedDistrict || currentUser?.district || 'ALL') : 'ALL'
  );
  const [selectedMemberForHierarchy, setSelectedMemberForHierarchy] = useState<User | null>(null);

  if (!currentUser) return null;

  if (currentUser.role === 'MEMBER') {
    return (
      <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
          Access Restricted
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Members are restricted from viewing the central directory containing other members&apos; private records and addresses.
        </p>
      </div>
    );
  }

  const allowedMembers = users.filter(u => {
    if (u.role !== 'MEMBER') return false;
    if (isDistrictAdmin) {
      const myDistrict = currentUser.assignedDistrict || currentUser.district;
      const memberDistrict = u.district || u.assignedDistrict;
      return memberDistrict === myDistrict;
    }
    if (isCoAdmin) {
      const myProvince = currentUser.assignedStateProvince || currentUser.stateProvince;
      return u.stateProvince === myProvince || u.assignedStateProvince === myProvince;
    }
    return true;
  });

  const filteredMembers = allowedMembers.filter(member => {
    const memLoc = mapLegacyRegionToHierarchy(member.region);
    const mProvince = member.stateProvince || memLoc.stateProvince;
    const mDistrict = member.district || memLoc.district;
    const mTehsil = member.tehsil || memLoc.tehsil || '';
    const mCity = member.cityTown || memLoc.cityTown || '';

    const q = searchTerm.toLowerCase();
    const matchesSearch =
      member.name.toLowerCase().includes(q) ||
      (member.membershipId && member.membershipId.toLowerCase().includes(q)) ||
      (member.cnic && member.cnic.includes(searchTerm)) ||
      member.email.toLowerCase().includes(q) ||
      mDistrict.toLowerCase().includes(q) ||
      mProvince.toLowerCase().includes(q) ||
      mTehsil.toLowerCase().includes(q) ||
      mCity.toLowerCase().includes(q);

    const matchesProvince = selectedProvinceFilter === 'ALL' || mProvince === selectedProvinceFilter;
    const matchesDistrict = selectedDistrictFilter === 'ALL' || mDistrict === selectedDistrictFilter;

    return matchesSearch && matchesProvince && matchesDistrict;
  });

  const handleOpenMessage = (member: User) => {
    setActiveChatUser(member);
    setActiveTab('chat');
  };

  return (
    <div className="space-y-5 max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              {isDistrictAdmin
                ? `${currentUser.assignedDistrict || currentUser.district} Registry`
                : isCoAdmin
                ? `${currentUser.assignedStateProvince || currentUser.stateProvince} Registry`
                : 'Central Registry'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500 shrink-0" />
            <span>Member Directory & Records</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isDistrictAdmin
              ? `Displaying members registered in ${currentUser.assignedDistrict || currentUser.district}.`
              : isCoAdmin
              ? `Displaying members registered across ${currentUser.assignedStateProvince || currentUser.stateProvince}.`
              : 'Organization-wide verified member records, profiles, and direct messaging.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search member, ID, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 w-full sm:w-56"
            />
          </div>

          {!isDistrictAdmin && !isCoAdmin && (
            <>
              <select
                value={selectedProvinceFilter}
                onChange={(e) => {
                  setSelectedProvinceFilter(e.target.value);
                  setSelectedDistrictFilter('ALL');
                }}
                className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <option value="ALL">All Provinces</option>
                {PROVINCE_OPTIONS.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>

              <select
                value={selectedDistrictFilter}
                onChange={(e) => setSelectedDistrictFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <option value="ALL">All Districts</option>
                {(selectedProvinceFilter !== 'ALL'
                  ? getDistrictsForProvince(selectedProvinceFilter)
                  : PROVINCE_OPTIONS.flatMap(p => getDistrictsForProvince(p))
                ).map(dist => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredMembers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            No registered members found yet.
          </div>
        ) : (
          filteredMembers.map(member => (
            <MemberCardMobile
              key={member.id}
              member={member}
              onInspect={setInspectedUserProfile}
              onCard={setSelectedCardUser}
              onMessage={handleOpenMessage}
              onShowLocation={setSelectedMemberForHierarchy}
            />
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 font-medium">
                <th className="py-3 px-4">Member Name & ID</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">CNIC Number</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-right">Total Contributed</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
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

                  return (
                    <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#0a192f] text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">{member.name}</span>
                            <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                              {member.membershipId || 'KC-PENDING'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="font-bold text-slate-900 dark:text-slate-100">{member.cityTown || dist}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-600 dark:text-slate-300">{prov}</span>
                        </div>
                        <button
                          onClick={() => setSelectedMemberForHierarchy(member)}
                          className="text-[10px] text-emerald-600 hover:underline font-semibold mt-0.5"
                        >
                          Location Trail
                        </button>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-800 dark:text-slate-200">
                        {member.cnic || '—'}
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        <div>{member.phone || '—'}</div>
                        <div className="text-[10px] truncate max-w-[150px]">{member.email}</div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                        PKR {(member.totalContributed || 0).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <RoleBadge role={member.role} isFounder={member.isFounder} compact />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenMessage(member)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-bold transition-colors cursor-pointer"
                            title="Send Direct Message"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Message</span>
                          </button>
                          <button
                            onClick={() => setInspectedUserProfile(member)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-medium cursor-pointer"
                          >
                            <span>Profile</span>
                          </button>
                          <button
                            onClick={() => setSelectedCardUser(member)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium cursor-pointer"
                          >
                            <IdCard className="w-3.5 h-3.5 text-amber-500" />
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

      {/* Location Hierarchy Modal */}
      {selectedMemberForHierarchy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Administrative Location</h3>
                  <p className="text-[11px] text-slate-500">{selectedMemberForHierarchy.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMemberForHierarchy(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              {[
                { label: 'Country', val: selectedMemberForHierarchy.country || 'Pakistan' },
                { label: 'Province / State', val: selectedMemberForHierarchy.stateProvince || 'Punjab' },
                { label: 'District', val: selectedMemberForHierarchy.district || 'Lahore' },
                { label: 'City / Town', val: selectedMemberForHierarchy.customCity || selectedMemberForHierarchy.cityTown || selectedMemberForHierarchy.district },
                { label: 'Union Council', val: selectedMemberForHierarchy.unionCouncil || '—' }
              ].map((st) => (
                <div key={st.label} className="flex items-center justify-between py-1 border-b border-slate-200/50 dark:border-slate-800/50 last:border-0">
                  <span className="text-slate-500">{st.label}:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{st.val}</span>
                </div>
              ))}
            </div>

            <div className="text-right">
              <button
                onClick={() => setSelectedMemberForHierarchy(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
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
