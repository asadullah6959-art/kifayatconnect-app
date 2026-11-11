import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, CheckCircle2, ShieldCheck, ArrowRight, UserPlus, MapPin } from 'lucide-react';
import { 
  PROVINCE_OPTIONS, 
  getDistrictsForProvince, 
  getTehsilsForDistrict, 
  getSampleUCsForDistrict, 
  getMajorCitiesForDistrict,
  COUNTRIES
} from '../../data/locationData';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose }) => {
  const { registerMember, language } = useApp();

  const [applicantName, setApplicantName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+92 300 ');
  const [cnic, setCnic] = useState('');
  
  // Administrative Location Hierarchy: Country → State/Province → District → Tehsil → City/Town → Union Council
  const [country, setCountry] = useState('Pakistan');
  const [stateProvince, setStateProvince] = useState('Punjab');
  const [district, setDistrict] = useState('Lahore');
  const [tehsil, setTehsil] = useState('Model Town');
  const [cityTown, setCityTown] = useState('Lahore');
  const [unionCouncil, setUnionCouncil] = useState('UC-112 Model Town');
  const [address, setAddress] = useState('');
  const [isOldMember, setIsOldMember] = useState(false);
  const [oldMembershipNo, setOldMembershipNo] = useState('');

  const [submitted, setSubmitted] = useState(false);

  // When State/Province changes, update District, Tehsil, City, and UC
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

  // When District changes, update Tehsil, City, and UC
  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict);
    const availableTehsils = getTehsilsForDistrict(stateProvince, newDistrict);
    setTehsil(availableTehsils[0] || '');

    const cities = getMajorCitiesForDistrict(stateProvince, newDistrict);
    setCityTown(cities[0] || newDistrict);

    const ucs = getSampleUCsForDistrict(stateProvince, newDistrict);
    setUnionCouncil(ucs[0] || 'UC-01 Central');
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !cnic.trim()) return;

    registerMember({
      applicantName: applicantName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      cnic: cnic.trim(),
      country,
      stateProvince,
      district,
      tehsil,
      cityTown,
      unionCouncil,
      region: `${district} Central`,
      address: address.trim(),
      isOldMember,
      oldMembershipNo: isOldMember ? oldMembershipNo.trim() : undefined
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
      // Reset form
      setApplicantName('');
      setEmail('');
      setPhone('+92 300 ');
      setCnic('');
      setAddress('');
      setIsOldMember(false);
      setOldMembershipNo('');
    }, 2500);
  };

  const availableDistricts = getDistrictsForProvince(stateProvince);
  const availableTehsils = getTehsilsForDistrict(stateProvince, district);
  const sampleUCs = getSampleUCsForDistrict(stateProvince, district);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 my-6 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <img 
              src="/src/assets/images/kifayat_emblem_logo_1794225902501.jpg" 
              alt="Logo" 
              className="w-8 h-8 rounded-lg object-cover border border-emerald-600/40"
            />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'ur' ? 'نئی رکنیت رجسٹریشن' : 'New Member Onboarding Registration'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Kifayat Connect Welfare Organization · Official Intake
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-10 text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-base text-slate-900 dark:text-white">
              Application Submitted to {district}, {stateProvince}!
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Your application has entered Stage 1 review under <span className="font-semibold text-slate-700 dark:text-slate-300">{unionCouncil}, Tehsil {tehsil}, District {district}</span>. The Field Verification Officer will inspect your residential credentials and submit a formal recommendation to the Super Admin for final membership card issuance.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Applicant Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asadullah Tariq"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  National ID (CNIC)
                </label>
                <input
                  type="text"
                  required
                  placeholder="35201-1234567-1"
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                  className="w-full px-3 py-2 font-mono border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            {/* Administrative Location Hierarchy (Country → State/Province → District → Tehsil → City/Town → Union Council) */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Administrative Location Hierarchy</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  Country → Province → District → Tehsil → City → UC
                </span>
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

              {/* Row 2: District & Tehsil (Separate fields) */}
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
                    list="tehsils-list"
                    value={tehsil}
                    onChange={(e) => setTehsil(e.target.value)}
                    placeholder="e.g. Model Town"
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-xs font-medium"
                  />
                  <datalist id="tehsils-list">
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
                    list="ucs-list"
                    value={unionCouncil}
                    onChange={(e) => setUnionCouncil(e.target.value)}
                    placeholder="e.g. UC-112 Model Town"
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-xs font-medium"
                  />
                  <datalist id="ucs-list">
                    {sampleUCs.map(uc => (
                      <option key={uc} value={uc} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Permanent Residential Address
              </label>
              <textarea
                required
                rows={2}
                placeholder="House / Street / Sector / City..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs resize-none"
              />
            </div>

            {/* Old Member Verification Toggle */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOldMember}
                  onChange={(e) => setIsOldMember(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  I am an existing member from the old manual register
                </span>
              </label>

              {isOldMember && (
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">
                    Previous Manual Membership Card / Record Number
                  </label>
                  <input
                    type="text"
                    required={isOldMember}
                    placeholder="e.g. OLD-LHR-1984"
                    value={oldMembershipNo}
                    onChange={(e) => setOldMembershipNo(e.target.value)}
                    className="w-full px-2.5 py-1.5 font-mono border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Regional officer will cross-check historical welfare registers.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400">
                Step 1 of 2: Regional verification
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded shadow-xs"
                >
                  <span>Submit Application</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
