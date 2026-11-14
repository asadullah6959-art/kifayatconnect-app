import React, { useState } from 'react';
import { useApp, isFounderUser } from '../../context/AppContext';
import {
  ShieldCheck,
  UserPlus,
  MapPin,
  Lock,
  CheckCircle2,
  ShieldAlert,
  Edit2,
  Crown,
  ArrowUpCircle,
  ArrowDownCircle,
  Ban,
  UserCheck
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { mapLegacyRegionToHierarchy } from '../../data/locationData';
import { RoleBadge } from '../common/RoleBadge';
import { SearchableLocationSelect } from '../common/SearchableLocationSelect';
import { translate } from '../../data/translations';

export const StaffManagement: React.FC = () => {
  const {
    currentUser,
    users,
    language,
    appSettings,
    createOrUpdateStaff,
    promoteToSuperAdmin,
    demoteSuperAdmin,
    toggleUserSuspension
  } = useApp();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const currentIsFounder = isFounderUser(currentUser);
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key, appSettings.textOverrides);

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
  const [actionFeedback, setActionFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  if (!currentUser) return null;

  if (!isSuperAdmin) {
    return (
      <div className="p-12 text-center bg-white dark:bg-[#111622] rounded-xl border border-slate-200 dark:border-[#D4AF37]/20">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">
          {language === 'ur' ? 'سپر ایڈمن کی اجازت درکار ہے' : 'Super Admin Authorization Required'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          {language === 'ur'
            ? 'صرف سپر ایڈمن کو انتظامی عملے کی تقرری، عہدہ تبدیلی یا معطلی کا اختیار ہے۔'
            : 'Under Kifayat Connect governance bylaws, only a Super Admin can appoint, promote, suspend, or reassign administrative leadership roles.'}
        </p>
      </div>
    );
  }

  const staffMembers = users.filter(u => u.isStaff || u.role !== 'MEMBER');

  const showToast = (type: 'ok' | 'err', msg: string) => {
    setActionFeedback({ type, msg });
    setTimeout(() => setActionFeedback(null), 3500);
  };

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
    if (isFounderUser(staff) && !currentIsFounder) {
      showToast('err', 'Founder Protection: The Main Super Admin account cannot be modified.');
      return;
    }
    const fallback = mapLegacyRegionToHierarchy(staff.region);
    setEditingStaff(staff);
    setFormName(staff.name);
    setFormEmail(staff.email);
    setFormPhone(staff.phone);
    setFormCnic(staff.cnic);
    setFormRole(staff.role === 'MEMBER' ? 'ADMIN' : staff.role);
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
    showToast('ok', editingStaff ? 'Staff role updated and logged.' : 'Official appointed and logged.');
  };

  const handlePromote = (staff: User) => {
    const res = promoteToSuperAdmin(staff.id);
    if (!res.success) showToast('err', res.error || 'Could not promote to Super Admin.');
    else showToast('ok', `${staff.name} promoted to Additional Super Admin.`);
  };

  const handleDemote = (staff: User) => {
    const res = demoteSuperAdmin(staff.id);
    if (!res.success) showToast('err', res.error || 'Could not demote Super Admin.');
    else showToast('ok', `${staff.name} reassigned to District Admin.`);
  };

  const handleToggleSuspend = (staff: User) => {
    const res = toggleUserSuspension(staff.id, !staff.isSuspended);
    if (!res.success) showToast('err', res.error || 'Unable to update suspension status.');
    else showToast('ok', `${staff.name} ${staff.isSuspended ? 'reactivated' : 'suspended'}.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#D4AF37]/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">
              {language === 'ur' ? 'قیادت اور رسائی کا اختیار' : 'Governance & Access Delegation'}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'ur' ? '4-سطحی نظام' : 'Strict 4-Role Hierarchy'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
            <span>{t('navStaff')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'ur'
              ? 'صرف چار عہدے: سپر ایڈمن، ایڈمن، کو ایڈمن، اور ممبر۔ ہر تبدیلی آڈٹ لاگ میں محفوظ ہوتی ہے۔'
              : 'Appoint, promote, or suspend officials across our 4-role architecture: Super Admin, Admin, Co-Admin, and Member.'}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#F5D061] via-[#D4AF37] to-[#8A6218] text-[#0A0D12] text-xs font-extrabold rounded-lg shadow-md hover:brightness-110 transition-all"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{language === 'ur' ? 'نیا عہدیدار مقرر کریں' : 'Appoint New Official'}</span>
        </button>
      </div>

      {actionFeedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            actionFeedback.type === 'ok'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}
        >
          {actionFeedback.type === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 shrink-0" />
          )}
          <span>{actionFeedback.msg}</span>
        </div>
      )}

      {/* Security Principles Banner */}
      <div className="p-4 bg-[#111622] text-white rounded-xl border border-[#D4AF37]/30 flex items-start gap-3">
        <Lock className="w-5 h-5 text-[#F5D061] shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-[#F5D061]">
            {language === 'ur'
              ? 'بانی کا تحفظ اور 4-سطحی کردار'
              : 'Founder Protection & Strict 4-Role Governance'}
          </span>
          <p className="text-slate-300 mt-1 leading-relaxed">
            {language === 'ur'
              ? 'سپر ایڈمن پورے نظام کی نگرانی کرتا ہے، ایڈمن اپنے ضلع اور فنڈز کی تصدیق سنبھالتے ہیں (فی ضلع زیادہ سے زیادہ 10)، کو ایڈمن صوبائی کوآرڈینیشن سنبھالتے ہیں (فی صوبہ 3)۔ کوئی اضافی سپر ایڈمن بانی کے اکاؤنٹ میں تبدیلی نہیں کر سکتا۔'
              : 'District Admins manage district operations and payment verification (max 10/district); State Co-Admins oversee provincial coordination (max 3/province). Only the Main Super Admin (Founder) can promote/demote Additional Super Admins, and the Founder account is permanently protected from edits or suspension.'}
          </p>
        </div>
      </div>

      {/* Staff Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffMembers.map(staff => {
          const staffIsFounder = isFounderUser(staff);
          const lockedByFounder = staffIsFounder && !currentIsFounder;

          return (
            <div
              key={staff.id}
              className={`p-4 bg-white dark:bg-[#111622] rounded-xl border flex flex-col justify-between space-y-3 shadow-xs ${
                staffIsFounder
                  ? 'border-[#D4AF37]/60'
                  : staff.isSuspended
                  ? 'border-rose-500/40 opacity-80'
                  : 'border-slate-200 dark:border-[#D4AF37]/20'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {staff.name}
                      </h3>
                      {staffIsFounder && (
                        <span
                          title="Main Super Admin (Founder) — Protected"
                          className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#D4AF37]/20 text-[#F5D061] border border-[#D4AF37]/40 shrink-0"
                        >
                          <Crown className="w-2.5 h-2.5" />
                          Founder
                        </span>
                      )}
                      {staff.isSuspended && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/40 shrink-0">
                          Suspended
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 truncate block">
                      {staff.email}
                    </span>
                  </div>

                  <RoleBadge
                    role={staff.role}
                    isFounder={staffIsFounder}
                    compact
                    className="shrink-0"
                  />
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/80 pt-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                    <span>
                      Jurisdiction:{' '}
                      <strong className="text-slate-900 dark:text-slate-100">
                        {staff.district
                          ? `${staff.district}, ${staff.stateProvince || 'Pakistan'}`
                          : staff.region || 'Pakistan'}
                      </strong>
                    </span>
                  </div>
                  {(staff.tehsil || staff.unionCouncil) && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-5">
                      Tehsil: {staff.tehsil || 'All'} · UC: {staff.unionCouncil || 'All'}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    CNIC: <span className="font-mono">{staff.cnic}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Phone: <span>{staff.phone}</span>
                  </div>
                </div>

                {staff.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-2 bg-slate-50 dark:bg-[#0A0D12] p-2 rounded border border-slate-100 dark:border-slate-800">
                    "{staff.notes}"
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[10px] font-mono text-slate-400">
                  {staff.membershipId || 'KC-STF'}
                </span>

                {lockedByFounder ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#D4AF37]">
                    <Lock className="w-3 h-3" />
                    Founder Protected
                  </span>
                ) : staff.id === currentUser.id ? (
                  <span className="text-[10px] font-semibold text-slate-400 italic">
                    Current Session
                  </span>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => openEditModal(staff)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#D4AF37] hover:text-[#F5D061]"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    {currentIsFounder && staff.role !== 'SUPER_ADMIN' && (
                      <button
                        onClick={() => handlePromote(staff)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 hover:text-emerald-400"
                        title="Promote to Additional Super Admin"
                      >
                        <ArrowUpCircle className="w-3 h-3" />
                        <span>Promote SA</span>
                      </button>
                    )}

                    {currentIsFounder && staff.role === 'SUPER_ADMIN' && !staffIsFounder && (
                      <button
                        onClick={() => handleDemote(staff)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-amber-500 hover:text-amber-400"
                        title="Demote Additional Super Admin to District Admin"
                      >
                        <ArrowDownCircle className="w-3 h-3" />
                        <span>Demote</span>
                      </button>
                    )}

                    {!staffIsFounder && (
                      <button
                        onClick={() => handleToggleSuspend(staff)}
                        className={`flex items-center gap-1 text-[11px] font-semibold ${
                          staff.isSuspended
                            ? 'text-emerald-400 hover:text-emerald-300'
                            : 'text-rose-400 hover:text-rose-300'
                        }`}
                      >
                        {staff.isSuspended ? (
                          <>
                            <UserCheck className="w-3 h-3" />
                            <span>Activate</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3 h-3" />
                            <span>Suspend</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* APPOINT / MODIFY STAFF MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#111622] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#D4AF37]/30 p-6 my-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-[#F5D061] pb-2 border-b border-slate-100 dark:border-[#D4AF37]/20">
              {editingStaff ? `Modify Official: ${editingStaff.name}` : 'Appoint New Official'}
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
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D12] text-slate-900 dark:text-white"
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
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D12] text-slate-900 dark:text-white"
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
                    className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D12] text-slate-900 dark:text-white"
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
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D12] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Assigned Role (4-Role Hierarchy)
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D12] text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="ADMIN">Admin — District Operations & Verifications (Max 10/District)</option>
                    <option value="CO_ADMIN">Co-Admin — Provincial Coordination (Max 3/Province)</option>
                    {currentIsFounder && (
                      <option value="SUPER_ADMIN">Super Admin — Central Governance (Founder Appointment)</option>
                    )}
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
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D12] text-slate-900 dark:text-white"
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
                  placeholder="e.g. Authorized to oversee district verifications"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A0D12] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-[#F5D061] via-[#D4AF37] to-[#8A6218] text-[#0A0D12] text-xs font-extrabold rounded-lg shadow-xs hover:brightness-110"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editingStaff ? 'Save Role Changes' : 'Approve Credentials'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
