import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  User as UserIcon, 
  Lock, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle,
  IdCard,
  Save,
  MapPin
} from 'lucide-react';
import { 
  PROVINCE_OPTIONS, 
  getDistrictsForProvince, 
  getTehsilsForDistrict, 
  getSampleUCsForDistrict, 
  getMajorCitiesForDistrict,
  COUNTRIES,
  formatFullLocationHierarchy
} from '../../data/locationData';

export const ProfileSettings: React.FC = () => {
  const { currentUser, updateUserProfile, setSelectedCardUser, language } = useApp();

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone);
  const [address, setAddress] = useState(currentUser.address);
  
  // Administrative Location Hierarchy
  const [country, setCountry] = useState(currentUser.country || 'Pakistan');
  const [stateProvince, setStateProvince] = useState(currentUser.stateProvince || 'Punjab');
  const [district, setDistrict] = useState(currentUser.district || 'Lahore');
  const [tehsil, setTehsil] = useState(currentUser.tehsil || 'Model Town');
  const [cityTown, setCityTown] = useState(currentUser.cityTown || 'Lahore');
  const [unionCouncil, setUnionCouncil] = useState(currentUser.unionCouncil || 'UC-112 Model Town');

  const [monthlyPledge, setMonthlyPledge] = useState(currentUser.monthlyPledge);
  const [annualPledge, setAnnualPledge] = useState(currentUser.annualPledge);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleProvinceChange = (newProvince: string) => {
    setStateProvince(newProvince);
    const availableDistricts = getDistrictsForProvince(newProvince);
    const newDistrict = availableDistricts[0] || '';
    setDistrict(newDistrict);
    
    const availableTehsils = getTehsilsForDistrict(newProvince, newDistrict);
    setTehsil(availableTehsils[0] || '');
    
    const cities = getMajorCitiesForDistrict(newProvince, newDistrict);
    setCityTown(cities[0] || newDistrict);

    const ucs = getSampleUCsForDistrict(newProvince, newDistrict);
    setUnionCouncil(ucs[0] || 'UC-01 Central');
  };

  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict);
    const availableTehsils = getTehsilsForDistrict(stateProvince, newDistrict);
    setTehsil(availableTehsils[0] || '');

    const cities = getMajorCitiesForDistrict(stateProvince, newDistrict);
    setCityTown(cities[0] || newDistrict);

    const ucs = getSampleUCsForDistrict(stateProvince, newDistrict);
    setUnionCouncil(ucs[0] || 'UC-01 Central');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      country,
      stateProvince,
      district,
      tehsil,
      cityTown,
      unionCouncil,
      region: `${district} Central`,
      monthlyPledge: Number(monthlyPledge),
      annualPledge: Number(annualPledge)
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const availableDistricts = getDistrictsForProvince(stateProvince);
  const availableTehsils = getTehsilsForDistrict(stateProvince, district);
  const sampleUCs = getSampleUCsForDistrict(stateProvince, district);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Identity & Profile Security
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-500">Administrative Hierarchy & Contact</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <UserIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Profile & Account Credentials</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your verified administrative address hierarchy, contact info, and welfare commitments.
          </p>
        </div>

        {currentUser.role === 'MEMBER' && (
          <button
            onClick={() => setSelectedCardUser(currentUser)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md border border-slate-700 shadow-xs transition-colors"
          >
            <IdCard className="w-3.5 h-3.5 text-emerald-400" />
            <span>View Digital Membership Card</span>
          </button>
        )}
      </div>

      {/* Role Authority Integrity Callout */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs">
        <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            Immutable Governance Identity Protection
          </p>
          <p className="text-slate-500 leading-relaxed">
            Your National Identity Number (CNIC), Membership ID (<code className="font-mono text-emerald-600">{currentUser.membershipId || 'KC-PENDING'}</code>), and official verified appointment (<strong className="text-slate-700 dark:text-slate-300">{currentUser.district || currentUser.region}, {currentUser.stateProvince || ''}</strong>) are locked by system rules to prevent identity fraud and ensure audit integrity.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profile changes and administrative location successfully updated!</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
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
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              National ID (CNIC) - [LOCKED]
            </label>
            <input
              type="text"
              disabled
              value={currentUser.cnic}
              className="w-full px-3 py-2 font-mono border border-slate-200 dark:border-slate-800 rounded bg-slate-100 dark:bg-slate-950 text-slate-500 text-xs cursor-not-allowed"
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
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Mobile Phone
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs"
            />
          </div>
        </div>

        {/* Administrative Location Hierarchy */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700 gap-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Administrative Location Hierarchy</span>
            </div>
            <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              {formatFullLocationHierarchy({ country, stateProvince, district, tehsil, cityTown, unionCouncil })}
            </div>
          </div>

          {/* Row 1: Country & State/Province */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-xs font-medium"
              >
                {COUNTRIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                State / Province <span className="text-rose-500">*</span>
              </label>
              <select
                value={stateProvince}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-xs font-semibold"
              >
                {PROVINCE_OPTIONS.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: District & Tehsil */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                District <span className="text-rose-500">*</span>
              </label>
              <select
                value={district}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
              >
                {availableDistricts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Tehsil / Sub-Division <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                list="tehsils-profile-list"
                value={tehsil}
                onChange={(e) => setTehsil(e.target.value)}
                placeholder="e.g. Model Town"
                className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-xs font-medium"
              />
              <datalist id="tehsils-profile-list">
                {availableTehsils.map(t => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Row 3: City/Town & Union Council */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                City / Town <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={cityTown}
                onChange={(e) => setCityTown(e.target.value)}
                placeholder="e.g. Lahore"
                className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Union Council (UC) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                list="ucs-profile-list"
                value={unionCouncil}
                onChange={(e) => setUnionCouncil(e.target.value)}
                placeholder="e.g. UC-112 Model Town"
                className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-xs font-medium"
              />
              <datalist id="ucs-profile-list">
                {sampleUCs.map(uc => (
                  <option key={uc} value={uc} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Street Address / House No.
          </label>
          <textarea
            rows={2}
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Monthly Welfare Pledge (PKR)
            </label>
            <input
              type="number"
              min={500}
              step={100}
              value={monthlyPledge}
              onChange={(e) => setMonthlyPledge(Number(e.target.value))}
              className="w-full px-3 py-2 font-mono font-bold border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Annual Welfare Pledge (PKR)
            </label>
            <input
              type="number"
              min={2000}
              step={500}
              value={annualPledge}
              onChange={(e) => setAnnualPledge(Number(e.target.value))}
              className="w-full px-3 py-2 font-mono font-bold border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Permitted Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
