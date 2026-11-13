import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  X 
} from 'lucide-react';
import { compareVersions, INSTALLED_APP_VERSION } from '../../services/githubReleases';

export const AppUpdateModal: React.FC = () => {
  const { 
    latestPublishedUpdate, 
    githubRelease,
    acknowledgedUpdateVersion, 
    acknowledgeUpdate,
    language 
  } = useApp();

  // Determine whether an authentic update exists either from GitHub Releases or Super Admin manual release
  const hasGitHubUpdate = Boolean(githubRelease?.status === 'AVAILABLE' && githubRelease.apkUrl);
  const hasAdminUpdate = Boolean(
    latestPublishedUpdate &&
    compareVersions(latestPublishedUpdate.version, INSTALLED_APP_VERSION) > 0
  );

  if (!hasGitHubUpdate && !hasAdminUpdate) return null;

  const activeVersion = hasAdminUpdate && latestPublishedUpdate
    ? latestPublishedUpdate.version
    : (githubRelease?.latestVersion || INSTALLED_APP_VERSION);

  const isMandatory = Boolean(hasAdminUpdate && latestPublishedUpdate?.isMandatory);

  if (acknowledgedUpdateVersion === activeVersion && !isMandatory) {
    return null;
  }

  const apkUrl = hasAdminUpdate && latestPublishedUpdate?.apkDownloadUrl
    ? latestPublishedUpdate.apkDownloadUrl
    : githubRelease?.apkUrl || null;

  const title = hasAdminUpdate && latestPublishedUpdate
    ? latestPublishedUpdate.title
    : (githubRelease?.releaseTitle || `Kifayat Connect v${activeVersion}`);

  const description = hasAdminUpdate && latestPublishedUpdate
    ? latestPublishedUpdate.description
    : 'A newer verified release of Kifayat Connect is available with improved stability and performance.';

  const notes = hasAdminUpdate && latestPublishedUpdate?.releaseNotes?.length
    ? latestPublishedUpdate.releaseNotes
    : (githubRelease?.releaseNotes || []);

  const releaseDate = hasAdminUpdate && latestPublishedUpdate
    ? latestPublishedUpdate.releaseDate
    : (githubRelease?.publishedAt ? new Date(githubRelease.publishedAt).toLocaleDateString() : 'Latest');

  const handlePwaUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        for (const reg of regs) {
          reg.update();
        }
      });
    }
    window.location.reload();
  };

  const handleDismiss = () => {
    if (!isMandatory) {
      acknowledgeUpdate(activeVersion);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden relative text-white">
        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500" />

        <div className="p-5 sm:p-6 pb-4 relative bg-[#0a192f] border-b border-slate-800">
          {!isMandatory && (
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  v{activeVersion}
                </span>
                {isMandatory && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Required Update
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                {title}
              </h3>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Released: {releaseDate}
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            {description}
          </p>

          {notes.length > 0 && (
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-200 block uppercase tracking-wider">
                What&apos;s New:
              </span>
              <ul className="space-y-1.5">
                {notes.map((note, index) => (
                  <li key={index} className="text-xs text-slate-300 flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2 space-y-3">
            {apkUrl && (
              <a
                href={apkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2.5 shadow-xl transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  {language === 'ur' ? 'اینڈرائیڈ APK ڈاؤنلوڈ کریں' : `Download Android APK (v${activeVersion})`}
                </span>
              </a>
            )}

            <button
              type="button"
              onClick={handlePwaUpdate}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span>
                {language === 'ur' ? 'ویب / PWA اپڈیٹ ریفریش کریں' : 'Refresh & Update Web / PWA App'}
              </span>
            </button>

            {!isMandatory && (
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {language === 'ur' ? 'بعد میں یاد دلائیں' : 'Remind Me Later'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
