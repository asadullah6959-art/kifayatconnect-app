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
  UserCheck,
  X
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
  // CRITICAL: Never hardcode any real CNIC as default value or placeholder; keep input completely empty and editable.
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
            : 'Under SUI KHEL ITTEHAD governance bylaws, only a Super Admin can appoint, promote, suspend, or reassign administrative leadership roles.'}
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

  const isUr = language === 'ur';

  const openEditModal = (staff: User) => {
    if (isFounderUser(staff) && !currentIsFounder) {
      showToast('err', isUr ? 'بانی کا تحفظ: مرکزی سپر ایڈمن اکاؤنٹ میں تبدیلی نہیں کی جا سکتی۔' : 'Founder Protection: The Main Super Admin account cannot be modified.');
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

  const handleFormSubmit = async (e: React.FormEvent) => {
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

    const res = await createOrUpdateStaff({
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
      setFormError(res.error || (isUr ? 'عملے کی تقرری محفوظ نہیں ہو سکی۔' : 'Unable to save staff appointment.'));
      return;
    }

    setIsModalOpen(false);
    showToast(
      'ok',
      editingStaff
        ? (isUr ? 'عملے کا عہدہ اپ ڈیٹ اور لاگ میں محفوظ ہو گیا۔' : 'Staff role updated and logged.')
        : (isUr ? 'عہدیدار مقرر کر دیا گیا اور لاگ میں محفوظ ہو گیا۔' : 'Official appointed and logged.')
    );
  };

  const handlePromote = async (staff: User) => {
    const res = await promoteToSuperAdmin(staff.id);
    if (!res.success) showToast('err', res.error || (isUr ? 'سپر ایڈمن پر ترقی نہیں دی جا سکی۔' : 'Could not promote to Super Admin.'));
    else showToast('ok', isUr ? `${staff.name} کو اضافی سپر ایڈمن بنا دیا گیا۔` : `${staff.name} promoted to Additional Super Admin.`);
  };

  const handleDemote = async (staff: User) => {
    const res = await demoteSuperAdmin(staff.id);
    if (!res.success) showToast('err', res.error || (isUr ? 'سپر ایڈمن سے عہدہ کم نہیں کیا جا سکا۔' : 'Could not demote Super Admin.'));
    else showToast('ok', isUr ? `${staff.name} کو دوبارہ ضلعی ایڈمن بنا دیا گیا۔` : `${staff.name} reassigned to District Admin.`);
  };

  const handleToggleSuspend = (staff: User) => {
    const res = toggleUserSuspension(staff.id, !staff.isSuspended);
    if (!res.success) showToast('err', res.error || (isUr ? 'معطلی کی حیثیت تبدیل نہیں ہو سکی۔' : 'Unable to update suspension status.'));
    else showToast(
      'ok',
      isUr
        ? `${staff.name} کا اکاؤنٹ ${staff.isSuspended ? 'بحال' : 'معطل'} کر دیا گیا۔`
        : `${staff.name} ${staff.isSuspended ? 'reactivated' : 'suspended'}.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E4E2]/25">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#E5E4E2] uppercase tracking-wider">
              {language === 'ur' ? 'قیادت اور رسائی کا اختیار' : 'Governance & Access Delegation'}
            </span>
            <span className="text-[#E5E4E2]/50">·</span>
            <span className="text-xs text-slate-300">
              {language === 'ur' ? '4-سطحی نظام' : 'Strict 4-Role Hierarchy'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#E5E4E2]" />
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
        <Lock className="w-5 h-5 text-[#E5E4E2] shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-[#E5E4E2]">
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
                  ? '!border-[#E5E4E2]/70'
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
                          title={isUr ? 'مرکزی سپر ایڈمن (بانی) — محفوظ شدہ' : 'Main Super Admin (Founder) — Protected'}
                          className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#E5E4E2]/20 text-[#E5E4E2] border border-[#E5E4E2]/45 shrink-0"
                        >
                          <Crown className="w-2.5 h-2.5" />
                          {isUr ? 'بانی' : 'Founder'}
                        </span>
                      )}
                      {staff.isSuspended && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-500/45 shrink-0">
                          {isUr ? 'معطل' : 'Suspended'}
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

                <div className="mt-3 space-y-1 text-xs text-slate-300 border-t border-[#E5E4E2]/20 pt-2.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#E5E4E2] shrink-0" />
                    <span>
                      {isUr ? 'دائرہ اختیار:' : 'Jurisdiction:'}{' '}
                      <strong className="text-white">
                        {staff.district
                          ? `${staff.district}, ${staff.stateProvince || 'Pakistan'}`
                          : staff.region || 'Pakistan'}
                      </strong>
                    </span>
                  </div>
                  {(staff.tehsil || staff.unionCouncil) && (
                    <div className="text-[11px] text-slate-400 pl-5">
                      {isUr ? 'تحصیل:' : 'Tehsil:'} {staff.tehsil || (isUr ? 'تمام' : 'All')} · {isUr ? 'یوسی:' : 'UC:'} {staff.unionCouncil || (isUr ? 'تمام' : 'All')}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400">
                    {isUr ? 'شناختی کارڈ:' : 'CNIC:'} <span className="font-mono text-slate-200">{staff.cnic}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {isUr ? 'فون:' : 'Phone:'} <span className="font-mono text-slate-200">{staff.phone}</span>
                  </div>
                </div>

                {staff.notes && (
                  <p className="text-[11px] text-slate-300 italic mt-2 bg-[#071812] p-2.5 rounded-xl border border-[#E5E4E2]/20">
                    "{staff.notes}"
                  </p>
                )}
              </div>

              <div className="pt-2.5 border-t border-[#E5E4E2]/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[10px] font-mono text-[#E5E4E2]/80">
                  {staff.membershipId || 'KC-STF'}
                </span>

                {lockedByFounder ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#E5E4E2]">
                    <Lock className="w-3 h-3" />
                    {isUr ? 'بانی محفوظ' : 'Founder Protected'}
                  </span>
                ) : staff.id === currentUser.id ? (
                  <span className="text-[10px] font-semibold text-emerald-400 italic">
                    {isUr ? 'موجودہ سیشن' : 'Current Session'}
                  </span>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => openEditModal(staff)}
                      className="kc-pressable flex items-center gap-1 text-[11px] font-semibold text-[#E5E4E2] hover:text-white cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>{isUr ? 'ترمیم' : 'Edit'}</span>
                    </button>

                    {currentIsFounder && staff.role !== 'SUPER_ADMIN' && (
                      <button
                        onClick={() => handlePromote(staff)}
                        className="kc-pressable flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                        title={isUr ? 'اضافی سپر ایڈمن پر ترقی دیں' : 'Promote to Additional Super Admin'}
                      >
                        <ArrowUpCircle className="w-3 h-3" />
                        <span>{isUr ? 'سپر ایڈمن بنائیں' : 'Promote SA'}</span>
                      </button>
                    )}

                    {currentIsFounder && staff.role === 'SUPER_ADMIN' && !staffIsFounder && (
                      <button
                        onClick={() => handleDemote(staff)}
                        className="kc-pressable flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 cursor-pointer"
                        title={isUr ? 'اضافی سپر ایڈمن کو ضلعی ایڈمن بنائیں' : 'Demote Additional Super Admin to District Admin'}
                      >
                        <ArrowDownCircle className="w-3 h-3" />
                        <span>{isUr ? 'عہدہ کم کریں' : 'Demote'}</span>
                      </button>
                    )}

                    {currentIsFounder && !staffIsFounder && (
                      <button
                        onClick={async () => {
                          const res = await assignAuditOfficer(staff.id, !staff.isAuditOfficer);
                          if (!res.success) showToast('err', res.error || (isUr ? 'آڈٹ آفیسر کا عہدہ تبدیل نہیں ہو سکا۔' : 'Could not update Audit Officer role.'));
                          else showToast(
                            'ok',
                            isUr
                              ? `${staff.name} کو آڈٹ آفیسر ${staff.isAuditOfficer ? 'سے ہٹا دیا گیا' : 'مقرر کر دیا گیا'}۔`
                              : `${staff.name} ${staff.isAuditOfficer ? 'removed from' : 'assigned as'} Audit Officer.`
                          );
                        }}
                        className="kc-pressable flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 cursor-pointer"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>
                          {staff.isAuditOfficer
                            ? (isUr ? 'آڈٹ ختم کریں' : 'Revoke Audit')
                            : (isUr ? 'آڈٹ آفیسر بنائیں' : 'Make Audit Officer')}
                        </span>
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
                            <span>{isUr ? 'بحال کریں' : 'Activate'}</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3 h-3" />
                            <span>{isUr ? 'معطل کریں' : 'Suspend'}</span>
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
        <div className="fixed inset-0 z-[95] kc-modal-backdrop flex items-start sm:items-center justify-center bg-black/85 overflow-y-auto">
          <div className="kc-luxury-modal kc-modal-panel relative w-full max-w-lg rounded-2xl my-auto flex flex-col overflow-hidden text-white">
            <div className="px-4 sm:px-6 py-3.5 border-b border-[#E5E4E2]/25 bg-[#071812] flex items-start justify-between gap-2.5 shrink-0">
              <h3 className="text-base font-bold text-[#E5E4E2] flex-1 min-w-0 break-words whitespace-normal leading-snug pt-1">
                {editingStaff
                  ? (isUr ? `عہدیدار میں ترمیم: ${editingStaff.name}` : `Modify Official: ${editingStaff.name}`)
                  : (isUr ? 'نیا عہدیدار مقرر کریں' : 'Appoint New Official')}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label={isUr ? 'بند کریں' : 'Close'}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl bg-[#0D2A1F] border border-[#E5E4E2]/30 text-slate-300 hover:text-white cursor-pointer shrink-0 kc-pressable"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 pb-24 sm:pb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
            {formError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/45 text-xs text-rose-200 font-medium">
                {formError}
              </div>
            )}

            <form id="kc-staff-modal-form" onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">
                    {isUr ? 'عہدیدار کا مکمل نام' : 'Official Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={isUr ? 'مکمل قانونی نام' : 'Full Legal Name'}
                    className="kc-luxury-input w-full text-xs px-3 py-2.5 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">
                    {isUr ? 'سرکاری ای میل' : 'Official Email'}
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="official@suikhelittehad.org"
                    className="kc-luxury-input w-full text-xs px-3 py-2.5 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">
                    {isUr ? 'شناختی کارڈ نمبر' : 'CNIC Identity Number'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formCnic}
                    onChange={(e) => setFormCnic(e.target.value)}
                    placeholder="e.g. 00000-0000000-0"
                    className="kc-luxury-input w-full text-xs font-mono px-3 py-2.5 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">
                    {isUr ? 'سرکاری فون رابطہ' : 'Official Phone Contact'}
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
                    {isUr ? 'تفویض کردہ عہدہ (4-سطحی نظام)' : 'Assigned Role (4-Role Hierarchy)'}
                  </label>
                  <LuxurySelect
                    label={isUr ? 'تفویض کردہ عہدہ' : 'Assigned Role'}
                    value={formRole}
                    onChange={(val) => setFormRole(val as UserRole)}
                    options={[
                      {
                        value: 'ADMIN',
                        label: isUr
                          ? 'ایڈمن — ضلعی امور و تصدیقات (زیادہ سے زیادہ 10/ضلع)'
                          : 'Admin — District Operations & Verifications (Max 10/District)'
                      },
                      {
                        value: 'CO_ADMIN',
                        label: isUr
                          ? 'کو ایڈمن — صوبائی کوآرڈینیشن (زیادہ سے زیادہ 3/صوبہ)'
                          : 'Co-Admin — Provincial Coordination (Max 3/Province)'
                      },
                      ...(currentIsFounder
                        ? [{
                            value: 'SUPER_ADMIN',
                            label: isUr
                              ? 'سپر ایڈمن — مرکزی گورننس (بانی کی تقرری)'
                              : 'Super Admin — Central Governance (Founder Appointment)'
                          }]
                        : [])
                    ]}
                    compact
                  />
                </div>

                <SearchableLocationSelect
                  label={isUr ? 'تفویض کردہ دائرہ اختیار (پاکستان کا ضلع / شہر)' : 'Assigned Jurisdiction (District / City across Pakistan)'}
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
                    {isUr ? 'یونین کونسل (UC)' : 'Union Council (UC)'}{' '}
                    <span className="text-[10px] text-slate-400 font-normal">{isUr ? '(اختیاری)' : '(Optional)'}</span>
                  </label>
                  <input
                    type="text"
                    value={formUnionCouncil}
                    onChange={(e) => setFormUnionCouncil(e.target.value)}
                    placeholder={isUr ? 'مثال: UC-112 یا تمام' : 'e.g. UC-112 or All'}
                    className="kc-luxury-input w-full text-xs px-3 py-2.5 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">
                  {isUr ? 'تقرری کے نوٹس / انتظامی شرائط' : 'Appointment Notes / Administrative Terms'}
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder={isUr ? 'مثال: ضلعی تصدیقات کی نگرانی کا مجاز' : 'e.g. Authorized to oversee district verifications'}
                  className="kc-luxury-input w-full text-xs px-3 py-2.5 rounded-xl"
                />
              </div>

            </form>
            </div>

            <div className="px-6 py-3.5 border-t border-[#E5E4E2]/25 bg-[#071812] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="kc-pressable px-3.5 py-2 text-xs text-slate-300 hover:text-white font-medium cursor-pointer"
              >
                {isUr ? 'منسوخ کریں' : 'Cancel'}
              </button>
              <button
                type="submit"
                form="kc-staff-modal-form"
                className="kc-pressable kc-gold-button flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {editingStaff
                    ? (isUr ? 'تبدیلیاں محفوظ کریں' : 'Save Role Changes')
                    : (isUr ? 'تقرری کی منظوری دیں' : 'Approve Credentials')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
