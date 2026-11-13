import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User as UserIcon,
  Lock,
  CheckCircle2,
  IdCard,
  Save,
  Camera
} from 'lucide-react';
import { SearchableLocationSelect, SelectedLocationValue } from '../common/SearchableLocationSelect';
import { RoleBadge } from '../common/RoleBadge';
import { compressImageFile } from '../../utils/imageCompression';

export const ProfileSettings: React.FC = () => {
  const { currentUser, updateUserProfile, setSelectedCardUser } = useApp();

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [unionCouncil, setUnionCouncil] = useState(currentUser?.unionCouncil || '');
  const [location, setLocation] = useState<SelectedLocationValue>({
    stateProvince: currentUser?.stateProvince || 'Punjab',
    district: currentUser?.district || 'Lahore',
    cityTown: currentUser?.cityTown || 'Lahore',
    tehsil: currentUser?.tehsil || 'Model Town'
  });

  const [monthlyPledge, setMonthlyPledge] = useState(currentUser?.monthlyPledge || 0);
  const [annualPledge, setAnnualPledge] = useState(currentUser?.annualPledge || 0);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  if (!currentUser) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    try {
      const compressed = await compressImageFile(file, 400, 0.78);
      setAvatarUrl(compressed.dataUrl);
      updateUserProfile({ avatarUrl: compressed.dataUrl });
    } catch (err: any) {
      setAvatarError(err?.message || 'Unable to process selected profile image.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      bio: bio.trim(),
      avatarUrl: avatarUrl || undefined,
      country: 'Pakistan',
      stateProvince: location.stateProvince,
      district: location.district,
      tehsil: location.tehsil || location.cityTown,
      cityTown: location.cityTown,
      unionCouncil: unionCouncil.trim(),
      monthlyPledge: Number(monthlyPledge),
      annualPledge: Number(annualPledge)
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Identity & Profile
            </span>
            <RoleBadge role={currentUser.role} compact />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <UserIcon className="w-6 h-6 text-amber-500" />
            <span>My Profile & Account</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Update your profile photo, Pakistan location, contact info, and welfare pledge.
          </p>
        </div>

        <button
          onClick={() => setSelectedCardUser(currentUser)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0a192f] hover:bg-slate-800 text-white text-xs font-semibold rounded-lg border border-amber-500/40 shadow-xs transition-colors self-start sm:self-auto"
        >
          <IdCard className="w-3.5 h-3.5 text-amber-400" />
          <span>View Digital Card</span>
        </button>
      </div>

      {/* Profile Photo & Identity Banner */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={currentUser.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/50"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#0a192f] text-amber-400 flex items-center justify-center font-bold text-2xl border-2 border-amber-500/40">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <label className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center cursor-pointer shadow-md border-2 border-white dark:border-slate-900">
              <Camera className="w-3.5 h-3.5" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>

          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</h2>
            <p className="text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold">
              {currentUser.membershipId || 'KC-PENDING'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tap the camera icon to upload a compressed profile photo
            </p>
            {avatarError && <p className="text-[11px] text-rose-500 mt-1">{avatarError}</p>}
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 max-w-xs">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>CNIC and Membership ID are audit-protected and verified by leadership.</span>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profile updated and synced!</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Full Legal Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              National ID (CNIC) - [LOCKED]
            </label>
            <input
              type="text"
              disabled
              value={currentUser.cnic || 'Not linked'}
              className="w-full px-3 py-2.5 font-mono border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-100 dark:bg-slate-950 text-slate-500 text-xs cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Contact Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Mobile Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 1234567"
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Short Bio / Community Role
          </label>
          <input
            type="text"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="e.g. Community volunteer in Lahore"
            className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SearchableLocationSelect
            value={location}
            onChange={setLocation}
            label="City / Tehsil / District (All Pakistan)"
            required
          />

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
              Union Council / Sector
            </label>
            <input
              type="text"
              value={unionCouncil}
              onChange={(e) => setUnionCouncil(e.target.value)}
              placeholder="e.g. UC-12 Central"
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Street Address / House No.
          </label>
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Monthly Welfare Pledge (PKR)
            </label>
            <input
              type="number"
              min={0}
              step={100}
              value={monthlyPledge}
              onChange={(e) => setMonthlyPledge(Number(e.target.value))}
              className="w-full px-3 py-2.5 font-mono font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Annual Welfare Pledge (PKR)
            </label>
            <input
              type="number"
              min={0}
              step={500}
              value={annualPledge}
              onChange={(e) => setAnnualPledge(Number(e.target.value))}
              className="w-full px-3 py-2.5 font-mono font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
