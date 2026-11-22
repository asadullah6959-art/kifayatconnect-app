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
import { applyOtaCacheBustAndReload } from '../../utils/otaUpdate';

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
    : (githubRelease?.releaseTitle || `SUI KHEL ITTEHAD v${activeVersion}`);

  const description = hasAdminUpdate && latestPublishedUpdate
    ? latestPublishedUpdate.description
    : (language === 'ur'
        ? 'سوئی خیل اتحاد کا نیا مستند ورژن بہتر رفتار اور سیکیورٹی کے ساتھ دستیاب ہے۔'
        : 'A newer verified release of SUI KHEL ITTEHAD is available with improved stability and performance.');

  const notes = hasAdminUpdate && latestPublishedUpdate?.releaseNotes?.length
    ? latestPublishedUpdate.releaseNotes
    : (githubRelease?.releaseNotes || []);

  const releaseDate = hasAdminUpdate && latestPublishedUpdate
    ? latestPublishedUpdate.releaseDate
    : (githubRelease?.publishedAt ? new Date(githubRelease.publishedAt).toLocaleDateString() : (language === 'ur' ? 'تازہ ترین' : 'Latest'));

  const handlePwaUpdate = () => {
    void applyOtaCacheBustAndReload(activeVersion);
  };

  const handleDismiss = () => {
    if (!isMandatory) {
      acknowledgeUpdate(activeVersion);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] kc-modal-backdrop bg-black/80 flex items-start sm:items-center justify-center overflow-y-auto">
      <div className="kc-luxury-modal kc-modal-panel rounded-2xl max-w-lg w-full flex flex-col overflow-hidden relative text-white my-auto">
        <div className="h-1.5 bg-gradient-to-r from-[#FCE38A] via-[#E5E4E2] to-[#8A6218] shrink-0" />

        <div className="p-4 sm:p-6 pb-4 bg-[#071812] border-b border-[#E5E4E2]/25 shrink-0">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FCE38A] via-[#E5E4E2] to-[#8A6218] flex items-center justify-center text-[#071812] shadow-lg border border-[#FCE38A]/60 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono tabular-nums font-bold px-2.5 py-0.5 rounded-full bg-[#0D2A1F] text-[#059669] border border-[#059669]/40">
                    v{activeVersion}
                  </span>
                  {isMandatory && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/40">
                      {language === 'ur' ? 'لازمی اپڈیٹ' : 'Required Update'}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-white mt-1 break-words whitespace-normal leading-snug">
                  {title}
                </h3>
                <p className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                  {language === 'ur' ? `جاری کردہ: ${releaseDate}` : `Released: ${releaseDate}`}
                </p>
              </div>
            </div>

            {!isMandatory && (
              <button
                type="button"
                onClick={handleDismiss}
                aria-label={language === 'ur' ? 'بند کریں' : 'Close'}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-full bg-[#0D2A1F] hover:bg-[#1A233A] border border-[#E5E4E2]/30 text-slate-300 hover:text-white kc-pressable cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 pb-24 sm:pb-6 space-y-4">
          <p className="text-xs text-slate-200 leading-relaxed">
            {description}
          </p>

          {notes.length > 0 && (
            <div className="bg-[#071812] p-4 rounded-xl border border-[#E5E4E2]/25 space-y-2">
              <span className="text-xs font-bold text-[#E5E4E2] block uppercase tracking-wider">
                {language === 'ur' ? 'نئی تبدیلیاں:' : "What's New:"}
              </span>
              <ul className="space-y-1.5">
                {notes.map((note, index) => (
                  <li key={index} className="text-xs text-slate-200 flex items-start gap-2">
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
                className="w-full py-3 px-4 rounded-xl kc-gold-button font-extrabold text-xs flex items-center justify-center gap-2.5 cursor-pointer"
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
              className="w-full py-2.5 px-4 rounded-xl bg-[#0D2A1F] hover:bg-[#1E293B] text-[#F8FAFC] font-semibold text-xs flex items-center justify-center gap-2 border border-[#059669]/40 kc-pressable cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-[#E5E4E2]" />
              <span>
                {language === 'ur' ? 'ویب / PWA اپڈیٹ ریفریش کریں' : 'Refresh & Update Web / PWA App'}
              </span>
            </button>

            {!isMandatory && (
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full py-2 text-center text-xs text-slate-400 hover:text-[#E5E4E2] transition-colors cursor-pointer"
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
