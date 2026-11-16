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
    : (language === 'ur'
        ? 'کفایت کنیکٹ کا نیا مستند ورژن بہتر رفتار اور سیکیورٹی کے ساتھ دستیاب ہے۔'
        : 'A newer verified release of Kifayat Connect is available with improved stability and performance.');

  const notes = hasAdminUpdate && latestPublishedUpdate?.releaseNotes?.length
    ? latestPublishedUpdate.releaseNotes
    : (githubRelease?.releaseNotes || []);

  const releaseDate = hasAdminUpdate && latestPublishedUpdate
    ? latestPublishedUpdate.releaseDate
    : (githubRelease?.publishedAt ? new Date(githubRelease.publishedAt).toLocaleDateString() : (language === 'ur' ? 'تازہ ترین' : 'Latest'));

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
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
      <div className="kc-luxury-modal rounded-2xl max-w-lg w-full overflow-hidden relative text-white">
        <div className="h-1.5 bg-gradient-to-r from-[#FCE38A] via-[#D4AF37] to-[#8A6218]" />

        <div className="p-5 sm:p-6 pb-4 relative bg-[#090D16] border-b border-[#D4AF37]/25">
          {!isMandatory && (
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-[#141B2D] hover:bg-[#1A233A] border border-[#D4AF37]/30 text-slate-300 hover:text-white kc-pressable cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FCE38A] via-[#D4AF37] to-[#8A6218] flex items-center justify-center text-[#090D16] shadow-lg border border-[#FCE38A]/60">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono tabular-nums font-bold px-2.5 py-0.5 rounded-full bg-[#042920] text-[#F5D061] border border-[#D4AF37]/40">
                  v{activeVersion}
                </span>
                {isMandatory && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/40">
                    {language === 'ur' ? 'لازمی اپڈیٹ' : 'Required Update'}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white mt-1">
                {title}
              </h3>
            </div>
          </div>

          <p className="text-xs text-slate-400 font-mono tabular-nums">
            {language === 'ur' ? `جاری کردہ: ${releaseDate}` : `Released: ${releaseDate}`}
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-xs text-slate-200 leading-relaxed">
            {description}
          </p>

          {notes.length > 0 && (
            <div className="bg-[#090D16] p-4 rounded-xl border border-[#D4AF37]/25 space-y-2">
              <span className="text-xs font-bold text-[#F5D061] block uppercase tracking-wider">
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
              className="w-full py-2.5 px-4 rounded-xl bg-[#042920] hover:bg-[#063B2E] text-emerald-100 font-semibold text-xs flex items-center justify-center gap-2 border border-[#D4AF37]/40 kc-pressable cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-[#F5D061]" />
              <span>
                {language === 'ur' ? 'ویب / PWA اپڈیٹ ریفریش کریں' : 'Refresh & Update Web / PWA App'}
              </span>
            </button>

            {!isMandatory && (
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full py-2 text-center text-xs text-slate-400 hover:text-[#F5D061] transition-colors cursor-pointer"
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
