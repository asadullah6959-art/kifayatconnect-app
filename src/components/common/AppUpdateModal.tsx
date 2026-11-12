import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Smartphone, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';

export const AppUpdateModal: React.FC = () => {
  const { 
    latestPublishedUpdate, 
    acknowledgedUpdateVersion, 
    acknowledgeUpdate,
    language 
  } = useApp();

  if (!latestPublishedUpdate) return null;

  // Don't show if user has already dismissed this version, UNLESS it is mandatory
  if (acknowledgedUpdateVersion === latestPublishedUpdate.version && !latestPublishedUpdate.isMandatory) {
    return null;
  }

  const handleDownloadAPK = () => {
    if (latestPublishedUpdate.apkDownloadUrl) {
      window.location.href = latestPublishedUpdate.apkDownloadUrl;
    }
  };

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
    if (!latestPublishedUpdate.isMandatory) {
      acknowledgeUpdate(latestPublishedUpdate.version);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden relative text-white">
        {/* Top Gold Accent Bar */}
        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500" />

        {/* Modal Header */}
        <div className="p-6 pb-4 relative bg-gradient-to-b from-[#0a192f] to-slate-900 border-b border-slate-800">
          {!latestPublishedUpdate.isMandatory && (
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {latestPublishedUpdate.version}
                </span>
                {latestPublishedUpdate.isMandatory && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Required Update
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                {latestPublishedUpdate.title}
              </h3>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Released on: {latestPublishedUpdate.releaseDate}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Urgent Urdu Broadcast Callout */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-right space-y-1">
            <p className="text-xs font-semibold text-amber-300 font-urdu leading-relaxed">
              کفایت کنیکٹ کا نیا اپڈیٹ آ چکا ہے۔ بہتر کارکردگی اور نئے فیچرز کے لیے ابھی ایپ اپڈیٹ کریں۔
            </p>
            <p className="text-[11px] text-amber-200/80 text-left">
              "Kifayat Connect ka naya update aa chuka hai. Behtar performance aur naye features ke liye app update karein."
            </p>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-300 leading-relaxed">
            {latestPublishedUpdate.description}
          </p>

          {/* Release Notes */}
          {latestPublishedUpdate.releaseNotes && latestPublishedUpdate.releaseNotes.length > 0 && (
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-200 block uppercase tracking-wider">
                What's New in this Release:
              </span>
              <ul className="space-y-1.5">
                {latestPublishedUpdate.releaseNotes.map((note, index) => (
                  <li key={index} className="text-xs text-slate-300 flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Area */}
          <div className="pt-2 space-y-3">
            {latestPublishedUpdate.apkDownloadUrl && (
              <a
                href={latestPublishedUpdate.apkDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDownloadAPK}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  {language === 'ur' ? 'اینڈرائیڈ APK ڈاؤنلوڈ کریں' : 'Download Android APK (Direct Link)'}
                </span>
                <span className="text-[10px] bg-slate-950/20 px-2 py-0.5 rounded-full font-mono">
                  .apk
                </span>
              </a>
            )}

            <button
              onClick={handlePwaUpdate}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span>
                {language === 'ur' ? 'ویب / PWA اپڈیٹ ریفریش کریں' : 'Refresh & Update Web / PWA App'}
              </span>
            </button>

            {!latestPublishedUpdate.isMandatory ? (
              <button
                onClick={handleDismiss}
                className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {language === 'ur' ? 'بعد میں یاد دلائیں' : 'Remind Me Later'}
              </button>
            ) : (
              <p className="text-[11px] text-center text-rose-400 font-medium">
                {language === 'ur' 
                  ? 'جاری رکھنے کے لیے اس اپڈیٹ کا انسٹال ہونا لازمی ہے۔' 
                  : 'This update is mandatory to ensure database sync and security.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
