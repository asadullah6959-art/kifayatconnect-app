import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  UserPlus, 
  UserCheck, 
  MapPin, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert,
  Edit2
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { mapLegacyRegionToHierarchy } from '../../data/locationData';
import { RoleBadge } from '../common/RoleBadge';
import { SearchableLocationSelect } from '../common/SearchableLocationSelect';

export const StaffManagement: React.FC = () => {
  const { 
    currentUser, 
    users, 
    createOrUpdateStaff 
  } = useApp();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCnic, setFormCnic] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('ADMIN');
  const [formStateProvince, setFormStateProvince] = useState('Punjab');
  const [formDistrict, setFormDistrict] = useState('Lahore');
  const [formTehsil, setFormTehsil] = useState('');
  const [formCityTown, setFormCityTown] = useState('Lahore');
  const [formUnionCouncil, setFormUnionCouncil] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (!currentUser) return null;

  if (!isSuperAdmin) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">
          Super Admin Authorization Required
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Under Kifayat Connect bylaws, only the Super Admin has the constitutional authority to create, promote, suspend, or reassign administrative staff roles.
        </p>
      </div>
    );
  }

  const staffMembers = users.filter(u => u.isStaff || u.role !== 'MEMBER');

  const openCreateModal = () => {
    setEditingStaff(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('+92 300 ');
    setFormCnic('');
    setFormRole('ADMIN');
    setFormStateProvince('Punjab');
    setFormDistrict('Lahore');
    setFormTehsil('Lahore City');
    setFormCityTown('Lahore');
    setFormUnionCouncil('');
    setFormNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (staff: User) => {
    const fallback = mapLegacyRegionToHierarchy(staff.region);
    setEditingStaff(staff);
    setFormName(staff.name);
    setFormEmail(staff.email);
    setFormPhone(staff.phone);
    setFormCnic(staff.cnic);
    setFormRole(staff.role);
    setFormStateProvince(staff.stateProvince || fallback.stateProvince);
    setFormDistrict(staff.district || fallback.district);
    setFormTehsil(staff.tehsil || fallback.tehsil || '');
    setFormCityTown(staff.cityTown || fallback.cityTown || staff.district || '');
    setFormUnionCouncil(staff.unionCouncil || fallback.unionCouncil || '');
    setFormNotes(staff.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formName.trim() || !formEmail.trim()) return;

    const locPayload = {
      country: 'Pakistan',
      stateProvince: formStateProvince,
      district: formDistrict,
      assignedDistrict: formRole === 'ADMIN' ? formDistrict : undefined,
      assignedStateProvince: formRole === 'ADMIN' || formRole === 'CO_ADMIN' ? formStateProvince : undefined,
      tehsil: formTehsil.trim(),
      cityTown: formCityTown.trim() || formDistrict,
      unionCouncil: formUnionCouncil.trim(),
      region: `${formDistrict}, ${formStateProvince}` as any
    };

    const res = createOrUpdateStaff({
      ...(editingStaff ? { id: editingStaff.id } : {}),
      name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      cnic: formCnic.trim(),
      role: formRole,
      notes: formNotes.trim(),
      ...locPayload
    });

    if (!res.success) {
      setFormError(res.error || 'Unable to save staff appointment.');
      return;
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Governance & Access Delegation
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-500">Super Admin Exclusive Privilege</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Staff Roster & Role-Based Access Control</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, reassign, or suspend officers. Every administrative assignment is written to the immutable audit trail.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Appoint New Staff Officer</span>
        </button>
      </div>

      {/* Security Principles Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-lg border border-slate-800 flex items-start gap-3">
        <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-slate-200">Rule 8 & 10 Compliance: Backend-Enforced Permissions & Role Auditing</span>
          <p className="text-slate-400 mt-1 leading-relaxed">
            Staff access is strictly segregated. Finance Officers handle treasury & receipts only; District Admins are strictly locked to their assigned District (max 10/district) and State Co-Admins to their assigned Province (max 3/province). Every appointment records timestamp, former role, new role, and the Super Admin's ID.
          </p>
        </div>
      </div>

      {/* Staff Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffMembers.map(staff => (
          <div 
            key={staff.id}
            className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 shadow-xs"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {staff.name}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400 truncate block">
                    {staff.email}
                  </span>
                </div>

                <RoleBadge role={staff.role} compact className="shrink-0" />
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Jurisdiction:{' '}
                    <strong className="text-slate-900 dark:text-slate-100">
                      {staff.district ? `${staff.district}, ${staff.stateProvince || 'Pakistan'}` : (staff.region || 'Pakistan')}
                    </strong>
                  </span>
                </div>
                {(staff.tehsil || staff.unionCouncil) && (
                  <div className="text-[11px] text-slate-500 pl-5">
                    Tehsil: {staff.tehsil || 'All'} · UC: {staff.unionCouncil || 'All'}
                  </div>
                )}
                <div className="text-[11px] text-slate-500">
                  CNIC: <span className="font-mono">{staff.cnic}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Phone: <span>{staff.phone}</span>
                </div>
              </div>

              {staff.notes && (
                <p className="text-[11px] text-slate-500 italic mt-2 bg-slate-50 dark:bg-slate-950/40 p-2 rounded">
                  "{staff.notes}"
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400">
                Staff ID: {staff.membershipId || 'KC-STF'}
              </span>

              {staff.id !== currentUser.id ? (
                <button
                  onClick={() => openEditModal(staff)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Modify Role / Region</span>
                </button>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400 italic">Current Session</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* APPOINT / MODIFY STAFF MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 my-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              {editingStaff ? `Modify Staff Assignment: ${editingStaff.name}` : 'Appoint New Official'}
            </h3>

            {formError && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Official Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Full Legal Name"
                    className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="official@kifayatconnect.org"
                    className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    CNIC Identity Number
                  </label>
                  <input
                    type="text"
                    required
                    value={formCnic}
                    onChange={(e) => setFormCnic(e.target.value)}
                    placeholder="35201-1234567-1"
                    className="w-full text-xs font-mono px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Official Phone Contact
                  </label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    <option value="ADMIN">District Admin (Max 10 per District)</option>
                    <option value="CO_ADMIN">State Co-Admin (Max 3 per Province)</option>
                    <option value="FINANCE_OFFICER">Finance Officer (Treasury & Receipts)</option>
                    <option value="SUPER_ADMIN">Super Admin (Central Governance)</option>
                  </select>
                </div>

                <SearchableLocationSelect
                  label="Assigned Jurisdiction (District / City across Pakistan)"
                  required
                  value={{
                    stateProvince: formStateProvince,
                    district: formDistrict,
                    cityTown: formCityTown || formDistrict,
                    tehsil: formTehsil
                  }}
                  onChange={(loc) => {
                    setFormStateProvince(loc.stateProvince);
                    setFormDistrict(loc.district);
                    setFormCityTown(loc.cityTown);
                    setFormTehsil(loc.tehsil || loc.cityTown);
                  }}
                />

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Union Council (UC) <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formUnionCouncil}
                    onChange={(e) => setFormUnionCouncil(e.target.value)}
                    placeholder="e.g. UC-112 or All"
                    className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Appointment Notes / Administrative Terms
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Authorized to oversee division verifications"
                  className="w-full text-xs px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editingStaff ? 'Save Role Changes' : 'Approve Staff Credentials'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
