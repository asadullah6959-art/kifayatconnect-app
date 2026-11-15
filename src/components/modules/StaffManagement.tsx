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
import { LuxurySelect } from '../common/LuxurySelect';
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
    assignAuditOfficer,
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
      <div className="kc-obsidian-card p-12 text-center rounded-2xl">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-base font-bold text-white mt-3">
          {language === 'ur' ? 'سپر ایڈمن کی اجازت درکار ہے' : 'Super Admin Authorization Required'}
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#F5D061] uppercase tracking-wider">
              {language === 'ur' ? 'قیادت اور رسائی کا اختیار' : 'Governance & Access Delegation'}
            </span>
            <span className="text-[#D4AF37]/50">·</span>
            <span className="text-xs text-slate-300">
              {language === 'ur' ? '4-سطحی نظام' : 'Strict 4-Role Hierarchy'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#F5D061]" />
            <span>{t('navStaff')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'ur'
              ? 'صرف چار عہدے: سپر ایڈمن، ایڈمن، کو ایڈمن، اور ممبر۔ ہر تبدیلی آڈٹ لاگ میں محفوظ ہوتی ہے۔'
              : 'Appoint, promote, or suspend officials across our 4-role architecture: Super Admin, Admin, Co-Admin, and Member.'}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="kc-pressable kc-gold-button flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{language === 'ur' ? 'نیا عہدیدار مقرر کریں' : 'Appoint New Official'}</span>
        </button>
      </div>

      {actionFeedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            actionFeedback.type === 'ok'
              ? 'kc-emerald-panel text-emerald-200'
              : 'bg-rose-950/60 border-rose-500/45 text-rose-200'
          }`}
        >
          {actionFeedback.type === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{actionFeedback.msg}</span>
        </div>
      )}

      {/* Security Principles Banner */}
      <div className="kc-emerald-panel p-4 text-white rounded-2xl flex items-start gap-3">
        <Lock className="w-5 h-5 text-[#F5D061] shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-[#F5D061]">
            {language === 'ur'
              ? 'بانی کا تحفظ اور 4-سطحی کردار'
              : 'Founder Protection & Strict 4-Role Governance'}
          </span>
          <p className="text-slate-200 mt-1 leading-relaxed">
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
              className={`kc-obsidian-card p-4 rounded-2xl flex flex-col justify-between space-y-3 ${
                staffIsFounder
                  ? '!border-[#F5D061]/70'
                  : staff.isSuspended
                  ? '!border-rose-500/45 opacity-80'
                  : ''
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-white truncate">
                        {staff.name}
                      </h3>
                      {staffIsFounder && (
                        <span
                          title="Main Super Admin (Founder) — Protected"
                          className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#D4AF37]/20 text-[#F5D061] border border-[#D4AF37]/45 shrink-0"
                        >
                          <Crown className="w-2.5 h-2.5" />
                          Founder
                        </span>
                      )}
                      {staff.isSuspended && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-500/45 shrink-0">
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
                    isAuditOfficer={Boolean(staff.isAuditOfficer)}
                    compact
                    className="shrink-0"
                  />
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-300 border-t border-[#D4AF37]/20 pt-2.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#F5D061] shrink-0" />
                    <span>
                      Jurisdiction:{' '}
                      <strong className="text-white">
                        {staff.district
                          ? `${staff.district}, ${staff.stateProvince || 'Pakistan'}`
                          : staff.region || 'Pakistan'}
                      </strong>
                    </span>
                  </div>
                  {(staff.tehsil || staff.unionCouncil) && (
                    <div className="text-[11px] text-slate-400 pl-5">
                      Tehsil: {staff.tehsil || 'All'} · UC: {staff.unionCouncil || 'All'}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400">
                    CNIC: <span className="font-mono text-slate-200">{staff.cnic}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Phone: <span className="font-mono text-slate-200">{staff.phone}</span>
                  </div>
                </div>

                {staff.notes && (
                  <p className="text-[11px] text-slate-300 italic mt-2 bg-[#090D16] p-2.5 rounded-xl border border-[#D4AF37]/20">
                    "{staff.notes}"
                  </p>
                )}
              </div>

              <div className="pt-2.5 border-t border-[#D4AF37]/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[10px] font-mono text-[#F5D061]/80">
                  {staff.membershipId || 'KC-STF'}
                </span>

                {lockedByFounder ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#F5D061]">
                    <Lock className="w-3 h-3" />
                    Founder Protected
                  </span>
                ) : staff.id === currentUser.id ? (
                  <span className="text-[10px] font-semibold text-emerald-400 italic">
                    Current Session
                  </span>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => openEditModal(staff)}
                      className="kc-pressable flex items-center gap-1 text-[11px] font-semibold text-[#F5D061] hover:text-white cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    {currentIsFounder && staff.role !== 'SUPER_ADMIN' && (
                      <button
                        onClick={() => handlePromote(staff)}
                        className="kc-pressable flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                        title="Promote to Additional Super Admin"
                      >
                        <ArrowUpCircle className="w-3 h-3" />
                        <span>Promote SA</span>
                      </button>
                    )}

                    {currentIsFounder && staff.role === 'SUPER_ADMIN' && !staffIsFounder && (
                      <button
                        onClick={() => handleDemote(staff)}
                        className="kc-pressable flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 cursor-pointer"
                        title="Demote Additional Super Admin to District Admin"
                      >
                        <ArrowDownCircle className="w-3 h-3" />
                        <span>Demote</span>
                      </button>
                    )}

                    {currentIsFounder && !staffIsFounder && (
                      <button
                        onClick={() => {
                          const res = assignAuditOfficer(staff.id, !staff.isAuditOfficer);
                          if (!res.success) showToast('err', res.error || 'Could not update Audit Officer role.');
                          else showToast('ok', `${staff.name} ${staff.isAuditOfficer ? 'removed from' : 'assigned as'} Audit Officer.`);
                        }}
                        className="kc-pressable flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 cursor-pointer"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>{staff.isAuditOfficer ? 'Revoke Audit' : 'Make Audit Officer'}</span>
                      </button>
                    )}

                    {!staffIsFounder && (
                      <button
                        onClick={() => handleToggleSuspend(staff)}
                        className={`kc-pressable flex items-center gap-1 text-[11px] font-semibold cursor-pointer ${
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
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/85 p-3 sm:p-4 overflow-y-auto">
          <div className="kc-luxury-modal relative w-full max-w-lg rounded-2xl my-auto max-h-[92dvh] flex flex-col overflow-hidden text-white">
            <div className="px-6 py-4 border-b border-[#D4AF37]/25 bg-[#090D16] shrink-0">
              <h3 className="text-base font-bold text-[#F5D061]">
                {editingStaff ? `Modify Official: ${editingStaff.name}` : 'Appoint New Official'}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
            {formError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/45 text-xs text-rose-200 font-medium">
                {formError}
              </div>
            )}

            <form id="kc-staff-modal-form" onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">
                    Official Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Full Legal Name"
                    className="kc-luxury-input w-full text-xs px-3 py-2.5 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="official@kifayatconnect.org"
                    className="kc-luxury-input w-full text-xs px-3 py-2.5 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">
                    CNIC Identity Number
                  </label>
                  <input
                    type="text"
                    required
                    value={formCnic}
                    onChange={(e) => setFormCnic(e.target.value)}
                    placeholder="35201-1234567-1"
                    className="kc-luxury-input w-full text-xs font-mono px-3 py-2.5 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">
                    Official Phone Contact
                  </label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="kc-luxury-input w-full text-xs px-3 py-2.5 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">
                    Assigned Role (4-Role Hierarchy)
                  </label>
                  <LuxurySelect
                    label="Assigned Role"
                    value={formRole}
                    onChange={(val) => setFormRole(val as UserRole)}
                    options={[
                      { value: 'ADMIN', label: 'Admin — District Operations & Verifications (Max 10/District)' },
                      { value: 'CO_ADMIN', label: 'Co-Admin — Provincial Coordination (Max 3/Province)' },
                      ...(currentIsFounder
                        ? [{ value: 'SUPER_ADMIN', label: 'Super Admin — Central Governance (Founder Appointment)' }]
                        : [])
                    ]}
                    compact
                  />
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
                  <label className="text-xs font-semibold text-slate-200 block mb-1">
                    Union Council (UC) <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formUnionCouncil}
                    onChange={(e) => setFormUnionCouncil(e.target.value)}
                    placeholder="e.g. UC-112 or All"
                    className="kc-luxury-input w-full text-xs px-3 py-2.5 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">
                  Appointment Notes / Administrative Terms
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Authorized to oversee district verifications"
                  className="kc-luxury-input w-full text-xs px-3 py-2.5 rounded-xl"
                />
              </div>

            </form>
            </div>

            <div className="px-6 py-3.5 border-t border-[#D4AF37]/25 bg-[#090D16] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="kc-pressable px-3.5 py-2 text-xs text-slate-300 hover:text-white font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="kc-staff-modal-form"
                className="kc-pressable kc-gold-button flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{editingStaff ? 'Save Role Changes' : 'Approve Credentials'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
