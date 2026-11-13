import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  Smartphone,
  Users,
  MapPin,
  Sliders,
  Upload,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  ShieldCheck,
  ExternalLink,
  Layers,
  RefreshCw,
  Download
} from 'lucide-react';
import { PROVINCE_OPTIONS, getAllDistricts, addCustomDistrict } from '../../data/locationData';
import { SearchableLocationSelect, SelectedLocationValue } from '../common/SearchableLocationSelect';
import { RoleBadge } from '../common/RoleBadge';

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
    githubRelease,
    refreshGitHubRelease
  } = useApp();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'UPDATES' | 'STAFF_QUOTAS' | 'LOCATIONS' | 'GENERAL'>('UPDATES');
  const [checkingGitHub, setCheckingGitHub] = useState(false);

  // New App Update Form State
  const [version, setVersion] = useState('1.1.0');
  const [title, setTitle] = useState('Kifayat Connect — Release');
  const [description, setDescription] = useState('Kifayat Connect ka naya update aa chuka hai. Behtar performance aur naye features ke liye app update karein.');
  const [releaseNotesText, setReleaseNotesText] = useState(
    'Verified Android APK release\nMobile layout lock & banking UI enhancements\nReal-time sync and offline persistence'
  );
  const [apkDownloadUrl, setApkDownloadUrl] = useState('');
  const [pwaUpdateUrl, setPwaUpdateUrl] = useState(typeof window !== 'undefined' ? window.location.origin : '');
  const [isMandatory, setIsMandatory] = useState(false);
  const [updatePublishSuccess, setUpdatePublishSuccess] = useState(false);

  // New Staff / Admin Appointment Form State
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffRole, setStaffRole] = useState<'ADMIN' | 'CO_ADMIN' | 'FINANCE_OFFICER'>('ADMIN');
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffCnic, setStaffCnic] = useState('');
  const [staffLocation, setStaffLocation] = useState<SelectedLocationValue>({
    stateProvince: 'Punjab',
    district: 'Lahore',
    cityTown: 'Lahore',
    tehsil: 'Model Town'
  });
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

  if (!currentUser) return null;

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Restricted Access</h2>
        <p className="text-xs text-slate-500 mt-1">
          The Manage App console is strictly reserved for the verified Super Admin.
        </p>
      </div>
    );
  }

  const handleCheckGitHub = async () => {
    setCheckingGitHub(true);
    try {
      await refreshGitHubRelease(true);
    } finally {
      setCheckingGitHub(false);
    }
  };

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
      stateProvince: staffLocation.stateProvince,
      district: staffLocation.district,
      cityTown: staffLocation.cityTown,
      tehsil: staffLocation.tehsil || staffLocation.cityTown
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
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Central Executive Control
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-500" />
            <span>Manage App Console</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            GitHub APK release sync, District/State quota appointments, location directory, and global settings.
          </p>
        </div>

        <span className="text-xs px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-lg font-semibold flex items-center gap-1.5 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Root Super Admin Verified</span>
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('UPDATES')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'UPDATES'
              ? 'bg-[#0a192f] text-amber-400 dark:bg-amber-500 dark:text-slate-950 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>APK & Updates</span>
        </button>

        <button
          onClick={() => setActiveTab('STAFF_QUOTAS')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'STAFF_QUOTAS'
              ? 'bg-[#0a192f] text-amber-400 dark:bg-amber-500 dark:text-slate-950 font-bold'
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
              ? 'bg-[#0a192f] text-amber-400 dark:bg-amber-500 dark:text-slate-950 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Location Master</span>
        </button>

        <button
          onClick={() => setActiveTab('GENERAL')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'GENERAL'
              ? 'bg-[#0a192f] text-amber-400 dark:bg-amber-500 dark:text-slate-950 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>System Settings</span>
        </button>
      </div>

      {/* Tab 1: App Updates Management + Auto GitHub Sync */}
      {activeTab === 'UPDATES' && (
        <div className="space-y-6">
          {/* Live GitHub Releases Sync Card */}
          <div className="p-5 bg-[#0a192f] text-white rounded-xl border border-amber-500/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  GitHub Releases Auto-Sync
                </span>
                <a
                  href="https://github.com/asadullah6959-art/kifayatconnect-app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono text-slate-300 hover:text-amber-300 hover:underline inline-flex items-center gap-1"
                >
                  <span>asadullah6959-art/kifayatconnect-app</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <h3 className="text-sm sm:text-base font-bold">
                {githubRelease?.apkUrl
                  ? `Latest Release: ${githubRelease.tagName}`
                  : githubRelease?.releaseTitle || 'Latest Version Installed'}
              </h3>
              <p className="text-xs text-slate-300">
                Installed Build: <strong className="font-mono text-amber-300">v{githubRelease?.installedVersion || '1.0.0'}</strong>
                {githubRelease?.apkUrl
                  ? ` · Verified Android APK (${githubRelease.tagName}) ready from GitHub Releases.`
                  : ' · Latest Version Installed. APK download activates automatically once a GitHub Release is published.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {githubRelease?.apkUrl && (
                <a
                  href={githubRelease.apkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download APK ({githubRelease.tagName})</span>
                </a>
              )}
              <button
                type="button"
                onClick={handleCheckGitHub}
                disabled={checkingGitHub}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-semibold text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${checkingGitHub ? 'animate-spin' : ''}`} />
                <span>{checkingGitHub ? 'Checking...' : 'Check Releases'}</span>
              </button>
            </div>
          </div>

          {updatePublishSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Manual App Update published successfully!</span>
            </div>
          )}

          <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-500" />
                <span>Manual Update Broadcast Override</span>
              </h3>
              <p className="text-xs text-slate-500">
                Publish a verified APK link manually if needed.
              </p>
            </div>

            <form onSubmit={handleCreateUpdate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Version Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="1.1.0"
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Broadcast Notification Message *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Release Notes (One per line)
                </label>
                <textarea
                  rows={3}
                  value={releaseNotesText}
                  onChange={(e) => setReleaseNotesText(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Direct Android APK Download URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={apkDownloadUrl}
                    onChange={(e) => setApkDownloadUrl(e.target.value)}
                    placeholder="https://github.com/asadullah6959-art/kifayatconnect-app/releases/download/v1.1.0/app-release.apk"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    PWA Web App URL
                  </label>
                  <input
                    type="url"
                    value={pwaUpdateUrl}
                    onChange={(e) => setPwaUpdateUrl(e.target.value)}
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
                    Require users to acknowledge or install before continuing.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isMandatory}
                  onChange={(e) => setIsMandatory(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Publish Update Override</span>
                </button>
              </div>
            </form>
          </div>

          {appUpdates.length > 0 && (
            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Manual Update History</h3>
              {appUpdates.map(upd => (
                <div
                  key={upd.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">v{upd.version}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{upd.title}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{upd.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                      <span>Date: {upd.releaseDate}</span>
                      {upd.apkDownloadUrl && (
                        <a href={upd.apkDownloadUrl} target="_blank" rel="noreferrer" className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
                          <span>APK Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleUpdatePublish(upd.id)}
                    className={`px-3 py-1.5 rounded-lg font-medium shrink-0 ${
                      upd.isPublished
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        : 'bg-emerald-600 text-white font-bold'
                    }`}
                  >
                    {upd.isPublished ? 'Unpublish' : 'Activate'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Admin Quotas */}
      {activeTab === 'STAFF_QUOTAS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Constitutional Admin Quotas</h3>
              <p className="text-slate-500 mt-0.5">
                Maximum <strong>10 District Admins</strong> per District and <strong>3 State Co-Admins</strong> per Province/State.
              </p>
            </div>
            <button
              onClick={() => setStaffModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-xs self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Appoint Officer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span>District Admins ({users.filter(u => u.role === 'ADMIN').length})</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">Max 10 / District</span>
              </div>

              <div className="space-y-2">
                {users.filter(u => u.role === 'ADMIN').length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No District Admins appointed yet.</p>
                ) : (
                  users.filter(u => u.role === 'ADMIN').map(admin => (
                    <div key={admin.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white block truncate">{admin.name}</span>
                        <span className="text-[11px] text-slate-500">{admin.district}, {admin.stateProvince}</span>
                      </div>
                      <RoleBadge role={admin.role} compact />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>State Co-Admins ({users.filter(u => u.role === 'CO_ADMIN').length})</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">Max 3 / State</span>
              </div>

              <div className="space-y-2">
                {users.filter(u => u.role === 'CO_ADMIN').length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No State Co-Admins appointed yet.</p>
                ) : (
                  users.filter(u => u.role === 'CO_ADMIN').map(coadmin => (
                    <div key={coadmin.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white block truncate">{coadmin.name}</span>
                        <span className="text-[11px] text-slate-500">{coadmin.stateProvince}</span>
                      </div>
                      <RoleBadge role={coadmin.role} compact />
                    </div>
                  ))
                )}
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

          <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-500" />
              <span>Add Custom District or Town to Master Directory</span>
            </h3>

            <form onSubmit={handleAddLocation} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Province / Territory *
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
                    placeholder="Enter district name"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City / Town
                  </label>
                  <input
                    type="text"
                    value={newCityName}
                    onChange={(e) => setNewCityName(e.target.value)}
                    placeholder="Enter city or tehsil"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-sm"
                >
                  Register Location
                </button>
              </div>
            </form>
          </div>

          <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Registered Pakistan Districts ({getAllDistricts().length})
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
        <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Global Organization Settings</h3>
              <p className="text-xs text-slate-500">Update branding, helpline contact, and feature toggles.</p>
            </div>
            {settingsSuccess && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Saved</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveGeneralSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Application Title</label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Official Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Helpline Number</label>
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
                  <span className="font-semibold text-slate-900 dark:text-white block">1-on-1 Chat System</span>
                  <span className="text-[11px] text-slate-500">Allow direct messaging between members and officers.</span>
                </div>
                <input
                  type="checkbox"
                  checked={chatEnabled}
                  onChange={(e) => setChatEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 cursor-pointer"
                />
              </label>

              <label className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">Public Registration</span>
                  <span className="text-[11px] text-slate-500">Allow new community members to apply online.</span>
                </div>
                <input
                  type="checkbox"
                  checked={registrationOpen}
                  onChange={(e) => setRegistrationOpen(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 cursor-pointer"
                />
              </label>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-sm"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Appointment Modal */}
      {staffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                Super Admin Appointment
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                Appoint Officer / Admin
              </h3>
              <p className="text-xs text-slate-500">
                Max 10 Admins/District and max 3 Co-Admins/State.
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
                  Role *
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
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Enter full legal name"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email *
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
                    Phone *
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

              <SearchableLocationSelect
                value={staffLocation}
                onChange={setStaffLocation}
                label="Assigned District / City across Pakistan"
                required
              />

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
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-sm"
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
