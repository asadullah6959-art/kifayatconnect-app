import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  Search, 
  MapPin, 
  IdCard, 
  Coins, 
  ShieldAlert, 
  CheckCircle2, 
  Filter,
  Eye
} from 'lucide-react';
import { User } from '../../types';
import { 
  PROVINCE_OPTIONS, 
  getDistrictsForProvince, 
  formatFullLocationHierarchy, 
  formatShortLocation, 
  mapLegacyRegionToHierarchy 
} from '../../data/locationData';

export const MemberDirectory: React.FC = () => {
  const { 
    currentUser, 
    users, 
    setSelectedCardUser, 
    language 
  } = useApp();

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isRegionalOfficer = currentUser.role === 'REGIONAL_OFFICER';
  const isFinanceOfficer = currentUser.role === 'FINANCE_OFFICER';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState<string>(
    isRegionalOfficer ? (currentUser.stateProvince || mapLegacyRegionToHierarchy(currentUser.region).stateProvince) : 'ALL'
  );
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>(
    isRegionalOfficer ? (currentUser.district || mapLegacyRegionToHierarchy(currentUser.region).district) : 'ALL'
  );
  const [selectedMemberForHierarchy, setSelectedMemberForHierarchy] = useState<User | null>(null);

  // Scoped members based on role
  const allowedMembers = users.filter(u => {
    if (u.role !== 'MEMBER') return false;
    if (isRegionalOfficer) {
      const myDistrict = currentUser.district || mapLegacyRegionToHierarchy(currentUser.region).district;
      const memberDistrict = u.district || mapLegacyRegionToHierarchy(u.region).district;
      return memberDistrict === myDistrict || u.region === currentUser.region;
    }
    return true;
  });

  const filteredMembers = allowedMembers.filter(member => {
    const memLoc = mapLegacyRegionToHierarchy(member.region);
    const mProvince = member.stateProvince || memLoc.stateProvince;
    const mDistrict = member.district || memLoc.district;
    const mTehsil = member.tehsil || memLoc.tehsil || '';
    const mCity = member.cityTown || memLoc.cityTown || '';
    const mUC = member.unionCouncil || memLoc.unionCouncil || '';

    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.membershipId && member.membershipId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      member.cnic.includes(searchTerm) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mDistrict.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mProvince.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mTehsil.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mUC.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProvince = selectedProvinceFilter === 'ALL' || mProvince === selectedProvinceFilter;
    const matchesDistrict = selectedDistrictFilter === 'ALL' || mDistrict === selectedDistrictFilter;

    return matchesSearch && matchesProvince && matchesDistrict;
  });

  if (currentUser.role === 'MEMBER') {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
          Access Restricted
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Members are restricted from viewing the central directory containing other members' private records and addresses.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {isRegionalOfficer ? `${currentUser.region} Registry` : 'Central Registry'}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-500">
              {isRegionalOfficer ? 'Regional Member Records' : 'Organization-Wide Community Database'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Member Directory & Records</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isRegionalOfficer 
              ? `Strict Regional Scope: Displaying verified residents within ${currentUser.region}.` 
              : 'Full directory with CNIC identity verification, digital cards, and contribution totals.'}
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search member, ID, CNIC, District..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-52 sm:w-64"
            />
          </div>

          {!isRegionalOfficer && (
            <>
              {/* State/Province Filter */}
              <select
                value={selectedProvinceFilter}
                onChange={(e) => {
                  setSelectedProvinceFilter(e.target.value);
                  setSelectedDistrictFilter('ALL');
                }}
                className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
              >
                <option value="ALL">All Provinces</option>
                {PROVINCE_OPTIONS.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>

              {/* District Filter */}
              <select
                value={selectedDistrictFilter}
                onChange={(e) => setSelectedDistrictFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
              >
                <option value="ALL">All Districts</option>
                {(selectedProvinceFilter !== 'ALL'
                  ? getDistrictsForProvince(selectedProvinceFilter)
                  : Object.values(PROVINCE_OPTIONS).flatMap(p => getDistrictsForProvince(p))
                ).map(dist => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 font-medium">
                <th className="py-3 px-4">Member Name & ID</th>
                <th className="py-3 px-4">Administrative Location</th>
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
                    No members match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredMembers.map(member => {
                  const fallback = mapLegacyRegionToHierarchy(member.region);
                  const prov = member.stateProvince || fallback.stateProvince;
                  const dist = member.district || fallback.district;
                  const teh = member.tehsil || fallback.tehsil;
                  const uc = member.unionCouncil || fallback.unionCouncil;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={member.avatarUrl || '/src/assets/images/member_avatar_sample_1794225903658.jpg'} 
                            alt={member.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-700 shrink-0" 
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {member.name}
                            </span>
                            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              {member.membershipId}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {dist}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-600 dark:text-slate-300 font-medium">
                            {prov}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>Tehsil: <strong className="font-medium text-slate-700 dark:text-slate-300">{teh || 'N/A'}</strong></span>
                          {uc && (
                            <>
                              <span className="text-slate-400">·</span>
                              <span>UC: <strong className="font-medium text-slate-700 dark:text-slate-300">{uc}</strong></span>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedMemberForHierarchy(member)}
                            className="ml-1 text-[9px] text-emerald-600 hover:text-emerald-700 font-semibold underline"
                          >
                            Details
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-800 dark:text-slate-200">
                        {isFinanceOfficer ? `${member.cnic.slice(0, 5)}...` : member.cnic}
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        <div>{member.phone}</div>
                        <div className="text-[10px] truncate max-w-[140px]">{member.email}</div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                        PKR {member.totalContributed.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {member.membershipStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedCardUser(member)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium transition-colors"
                          >
                            <IdCard className="w-3.5 h-3.5 text-emerald-600" />
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

      {/* ADMINISTRATIVE LOCATION HIERARCHY MODAL */}
      {selectedMemberForHierarchy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Administrative Location Hierarchy
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedMemberForHierarchy.name} ({selectedMemberForHierarchy.membershipId})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMemberForHierarchy(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Complete 6-Level Hierarchy Flow */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider block mb-2">
                Verified Civic Jurisdiction Trail
              </span>
              {(() => {
                const fb = mapLegacyRegionToHierarchy(selectedMemberForHierarchy.region);
                const steps = [
                  { label: 'Country', val: selectedMemberForHierarchy.country || fb.country || 'Pakistan' },
                  { label: 'State / Province', val: selectedMemberForHierarchy.stateProvince || fb.stateProvince },
                  { label: 'District', val: selectedMemberForHierarchy.district || fb.district },
                  { label: 'Tehsil / Sub-division', val: selectedMemberForHierarchy.tehsil || fb.tehsil || 'Central' },
                  { label: 'City / Town', val: selectedMemberForHierarchy.cityTown || fb.cityTown || fb.district },
                  { label: 'Union Council (UC)', val: selectedMemberForHierarchy.unionCouncil || fb.unionCouncil || 'UC-01' },
                ];
                return (
                  <div className="space-y-2">
                    {steps.map((st, idx) => (
                      <div key={st.label} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/50 dark:border-slate-800/50 last:border-0">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          {st.label}:
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {st.val}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {selectedMemberForHierarchy.address && (
              <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800/40 p-2.5 rounded">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">Residential Street Address:</span>
                {selectedMemberForHierarchy.address}
              </div>
            )}

            <div className="text-right pt-2">
              <button
                onClick={() => setSelectedMemberForHierarchy(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded"
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
