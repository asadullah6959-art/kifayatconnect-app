import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Settings, 
  Smartphone, 
  Users, 
  MapPin, 
  Sliders, 
  Download, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  PlusCircle, 
  Edit2, 
  Trash2, 
  Bell, 
  Globe, 
  ShieldCheck, 
  ExternalLink,
  Layers,
  FileCode
} from 'lucide-react';
import { AppUpdate, User } from '../../types';
import { PROVINCE_OPTIONS, getAllDistricts, addCustomDistrict } from '../../data/locationData';

export const ManageAppModule: React.FC = () => {
  const { 
    currentUser, 
    users, 
    appUpdates, 
    publishAppUpdate, 
    toggleUpdatePublish, 
    appSettings, 
    updateAppSettings,
    createOrUpdateStaff,
    auditLogs
  } = useApp();

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'UPDATES' | 'STAFF_QUOTAS' | 'LOCATIONS' | 'GENERAL'>('UPDATES');

  // New App Update Form State
  const [version, setVersion] = useState('1.3.0');
  const [title, setTitle] = useState('Kifayat Connect — Performance & Security Upgrade');
  const [description, setDescription] = useState('Kifayat Connect ka naya update aa chuka hai. Behtar performance aur naye features ke liye app update karein.');
  const [releaseNotesText, setReleaseNotesText] = useState(
    'Added real-time chat with photo/document attachments.\n10-title Office-Bearers governance module.\nDistrict Admin (10 per district) and State Co-Admin (3 per state) role separation.\nDirect Android debug APK download link.'
  );
  const [apkDownloadUrl, setApkDownloadUrl] = useState('https://github.com/asadullah6959-art/kifayatconnect-app/releases/latest/download/app-debug.apk');
  const [pwaUpdateUrl, setPwaUpdateUrl] = useState(window.location.origin);
  const [isMandatory, setIsMandatory] = useState(false);
  const [updatePublishSuccess, setUpdatePublishSuccess] = useState(false);

  // New Staff / Admin Appointment Form State
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffRole, setStaffRole] = useState<'ADMIN' | 'CO_ADMIN' | 'FINANCE_OFFICER'>('ADMIN');
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffCnic, setStaffCnic] = useState('');
  const [staffProvince, setStaffProvince] = useState('Punjab');
  const [staffDistrict, setStaffDistrict] = useState('Lahore');
  const [staffQuotaError, setStaffQuotaError] = useState<string | null>(null);

  // Location Hierarchy Addition Form State
  const [locProvince, setLocProvince] = useState('Punjab');
  const [newDistrictName, setNewDistrictName] = useState('');
  const [newCityName, setNewCityName] = useState('');
  const [locationSuccessMsg, setLocationSuccessMsg] = useState<string | null>(null);

  // General Settings Form State
  const [appName, setAppName] = useState(appSettings.appName);
  const [tagline, setTagline] = useState(appSettings.tagline);
  const [contactEmail, setContactEmail] = useState(appSettings.contactEmail);
  const [contactHelpline, setContactHelpline] = useState(appSettings.contactHelpline);
  const [chatEnabled, setChatEnabled] = useState(appSettings.chatEnabled);
  const [registrationOpen, setRegistrationOpen] = useState(appSettings.registrationOpen);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Restricted Access</h2>
        <p className="text-xs text-slate-500 mt-1">
          The "Manage App" administration panel is strictly reserved for Authorized Super Admin ({currentUser.email}).
        </p>
      </div>
    );
  }

  const handleCreateUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!version.trim() || !title.trim() || !apkDownloadUrl.trim()) return;

    publishAppUpdate({
      version: version.trim(),
      title: title.trim(),
      description: description.trim(),
      releaseNotes: releaseNotesText.split('\n').filter(line => line.trim().length > 0),
      releaseDate: new Date().toISOString().split('T')[0],
      apkDownloadUrl: apkDownloadUrl.trim(),
      pwaUpdateUrl: pwaUpdateUrl.trim() || window.location.origin,
      isMandatory,
      isPublished: true
    });

    setUpdatePublishSuccess(true);
    setTimeout(() => setUpdatePublishSuccess(false), 5000);
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffQuotaError(null);

    const res = createOrUpdateStaff({
      name: staffName,
      email: staffEmail,
      phone: staffPhone,
      cnic: staffCnic,
      role: staffRole,
      stateProvince: staffProvince,
      district: staffDistrict
    });

    if (!res.success) {
      setStaffQuotaError(res.error || 'Failed to appoint staff.');
    } else {
      setStaffModalOpen(false);
      setStaffName('');
      setStaffEmail('');
      setStaffPhone('');
      setStaffCnic('');
    }
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDistrictName.trim()) return;
    addCustomDistrict(locProvince, newDistrictName.trim(), newCityName.trim() || undefined);
    setLocationSuccessMsg(`Successfully registered ${newDistrictName.trim()} under ${locProvince}.`);
    setNewDistrictName('');
    setNewCityName('');
    setTimeout(() => setLocationSuccessMsg(null), 4000);
  };

  const handleSaveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateAppSettings({
      appName,
      tagline,
      contactEmail,
      contactHelpline,
      chatEnabled,
      registrationOpen
    });
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Central Executive Control
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-500">Super Admin In-App Administration</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-500" />
            <span>Manage App Console</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure mobile app releases, enforce District/State quota appointments, customize settings, and manage geographic records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-lg font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Root Super Admin: asadullah6959@gmail.com</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('UPDATES')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'UPDATES'
              ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>App Updates ({appUpdates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('STAFF_QUOTAS')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'STAFF_QUOTAS'
              ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Admin Quotas (10 Dist / 3 State)</span>
        </button>

        <button
          onClick={() => setActiveTab('LOCATIONS')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'LOCATIONS'
              ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Location Hierarchy Manager</span>
        </button>

        <button
          onClick={() => setActiveTab('GENERAL')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'GENERAL'
              ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>System Settings</span>
        </button>
      </div>

      {/* Tab 1: App Updates Management */}
      {activeTab === 'UPDATES' && (
        <div className="space-y-6">
          {updatePublishSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>New App Update published successfully! Broadcast notification dispatched to all members and staff.</span>
            </div>
          )}

          {/* Create New App Update Card */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-amber-500" />
                  <span>Publish New Mobile Application Update</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Publish an Android debug APK link and PWA update. An in-app alert and update popup will be shown to all active users.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateUpdate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Version Number * (e.g. 1.3.0)
                  </label>
                  <input
                    type="text"
                    required
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="1.3.0"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Release Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Kifayat Connect — Performance & Chat Upgrade"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Urdu Broadcast Notification Message *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kifayat Connect ka naya update aa chuka hai. Behtar performance aur naye features ke liye app update karein."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Release Notes & Changelog (One bullet per line)
                </label>
                <textarea
                  rows={3}
                  value={releaseNotesText}
                  onChange={(e) => setReleaseNotesText(e.target.value)}
                  placeholder="Feature 1...&#10;Feature 2..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Direct Android Debug APK Download URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={apkDownloadUrl}
                    onChange={(e) => setApkDownloadUrl(e.target.value)}
                    placeholder="https://github.com/USER/REPO/releases/latest/download/app-debug.apk"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    PWA Progressive Web App URL
                  </label>
                  <input
                    type="url"
                    value={pwaUpdateUrl}
                    onChange={(e) => setPwaUpdateUrl(e.target.value)}
                    placeholder="https://your-domain.app"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Mandatory Update Enforcement
                  </span>
                  <span className="text-[11px] text-slate-500">
                    If enabled, users must update before accessing restricted dashboard features.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isMandatory}
                  onChange={(e) => setIsMandatory(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Publish Update & Send Broadcast Notification</span>
                </button>
              </div>
            </form>
          </div>

          {/* Previous Releases List */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Release History & Published Versions
            </h3>

            <div className="space-y-3">
              {appUpdates.map(upd => (
                <div 
                  key={upd.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                        v{upd.version}
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {upd.title}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        upd.isPublished 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {upd.isPublished ? 'Live & Published' : 'Unpublished Draft'}
                      </span>
                      {upd.isMandatory && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          Mandatory
                        </span>
                      )}
                    </div>

                    <p className="text-slate-600 dark:text-slate-400">
                      {upd.description}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                      <span>Date: {upd.releaseDate}</span>
                      <span>·</span>
                      <a href={upd.apkDownloadUrl} target="_blank" rel="noreferrer" className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
                        <span>APK Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleUpdatePublish(upd.id)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        upd.isPublished
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold'
                      }`}
                    >
                      {upd.isPublished ? 'Unpublish' : 'Make Active'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Admin Quotas (10 District / 3 State) */}
      {activeTab === 'STAFF_QUOTAS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                Constitutional Admin Quotas
              </h3>
              <p className="text-slate-500 mt-0.5">
                Maximum <strong>10 District Admins</strong> per District and <strong>3 State Co-Admins</strong> per State/Province.
              </p>
            </div>
            <button
              onClick={() => setStaffModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Appoint District / Co-Admin</span>
            </button>
          </div>

          {/* Active Admins & Co-Admins List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* District Admins */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span>District Admins ({users.filter(u => u.role === 'ADMIN').length})</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">Max 10 / District</span>
              </div>

              <div className="space-y-2">
                {users.filter(u => u.role === 'ADMIN').map(admin => (
                  <div key={admin.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{admin.name}</span>
                      <span className="text-[11px] text-slate-500">{admin.district}, {admin.stateProvince}</span>
                      <span className="text-[10px] font-mono text-slate-400 block">{admin.membershipId} · {admin.phone}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      District Admin
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* State Co-Admins */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>State Co-Admins ({users.filter(u => u.role === 'CO_ADMIN').length})</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">Max 3 / State</span>
              </div>

              <div className="space-y-2">
                {users.filter(u => u.role === 'CO_ADMIN').map(coadmin => (
                  <div key={coadmin.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{coadmin.name}</span>
                      <span className="text-[11px] text-slate-500">{coadmin.stateProvince} (Jurisdiction)</span>
                      <span className="text-[10px] font-mono text-slate-400 block">{coadmin.membershipId} · {coadmin.phone}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                      State Co-Admin
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Location Hierarchy Manager */}
      {activeTab === 'LOCATIONS' && (
        <div className="space-y-6">
          {locationSuccessMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
              {locationSuccessMsg}
            </div>
          )}

          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-500" />
              <span>Add Custom District or City to Location Master</span>
            </h3>
            <p className="text-xs text-slate-500">
              Super Admin can expand Pakistan geographic records. New districts immediately become available across registration, staff appointments, and search filters.
            </p>

            <form onSubmit={handleAddLocation} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Province / State *
                  </label>
                  <select
                    value={locProvince}
                    onChange={(e) => setLocProvince(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {PROVINCE_OPTIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    District Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDistrictName}
                    onChange={(e) => setNewDistrictName(e.target.value)}
                    placeholder="e.g. Sheikhupura, Bahawalpur"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Major City / Headquarter
                  </label>
                  <input
                    type="text"
                    value={newCityName}
                    onChange={(e) => setNewCityName(e.target.value)}
                    placeholder="e.g. Sheikhupura City"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-sm"
                >
                  Register New District
                </button>
              </div>
            </form>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Currently Registered Administrative Districts in Master Dataset
            </h4>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {getAllDistricts().map(({ province, district }) => (
                <span key={`${province}-${district}`} className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {district} <span className="text-[10px] text-slate-400">({province})</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: General Settings */}
      {activeTab === 'GENERAL' && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Global Organization Settings
              </h3>
              <p className="text-xs text-slate-500">
                Update core branding, helpline contact, and feature toggles without modifying source code.
              </p>
            </div>
            {settingsSuccess && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Settings Saved</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveGeneralSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Application Title
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Contact Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Helpline Contact Number
                </label>
                <input
                  type="text"
                  value={contactHelpline}
                  onChange={(e) => setContactHelpline(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <label className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">Real-Time Chat System</span>
                  <span className="text-[11px] text-slate-500">Allow 1-to-1 direct messaging between members and admins.</span>
                </div>
                <input
                  type="checkbox"
                  checked={chatEnabled}
                  onChange={(e) => setChatEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
              </label>

              <label className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">Public Registration Portal</span>
                  <span className="text-[11px] text-slate-500">Enable new community members to apply for membership online.</span>
                </div>
                <input
                  type="checkbox"
                  checked={registrationOpen}
                  onChange={(e) => setRegistrationOpen(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
              </label>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-sm"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Appointment Modal */}
      {staffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                Super Admin Appointment
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                Appoint District Admin or State Co-Admin
              </h3>
              <p className="text-xs text-slate-500">
                Enforcing max 10 Admins/District and max 3 Co-Admins/State.
              </p>
            </div>

            {staffQuotaError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-xs font-semibold">
                {staffQuotaError}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Appointment Role *
                </label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="ADMIN">District Admin (Max 10 per District)</option>
                  <option value="CO_ADMIN">State Co-Admin (Max 3 per State)</option>
                  <option value="FINANCE_OFFICER">Finance Officer (Treasury Desk)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Tariq Mahmood"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  CNIC Number *
                </label>
                <input
                  type="text"
                  required
                  value={staffCnic}
                  onChange={(e) => setStaffCnic(e.target.value)}
                  placeholder="35201-1234567-1"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    State / Province *
                  </label>
                  <select
                    value={staffProvince}
                    onChange={(e) => {
                      setStaffProvince(e.target.value);
                      const d = getAllDistricts().filter(item => item.province === e.target.value);
                      if (d.length > 0) setStaffDistrict(d[0].district);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {PROVINCE_OPTIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned District *
                  </label>
                  <input
                    type="text"
                    required
                    value={staffDistrict}
                    onChange={(e) => setStaffDistrict(e.target.value)}
                    placeholder="Lahore, Karachi South, etc."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStaffModalOpen(false)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-sm"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
