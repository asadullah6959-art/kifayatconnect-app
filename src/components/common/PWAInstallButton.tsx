import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Check, Share, PlusSquare, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    // Check if iOS Safari
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIos && !(window.navigator as any).standalone) {
      setShowIosModal(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Direct APK or instructions
      setShowIosModal(true);
    }
  };

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <Check className="w-3.5 h-3.5" />
        <span>{language === 'ur' ? 'انسٹال شدہ' : 'PWA Ready'}</span>
      </span>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        title={language === 'ur' ? 'کفایت کنیکٹ ایپ انسٹال کریں' : 'Install Kifayat Connect App'}
        className={`inline-flex items-center gap-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
          compact
            ? 'px-2 py-1 text-xs bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
            : 'px-3 py-1.5 text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/15'
        }`}
      >
        <Smartphone className="w-3.5 h-3.5 shrink-0" />
        <span>{language === 'ur' ? 'ایپ انسٹال کریں' : 'Install App'}</span>
      </button>

      {/* iOS or fallback modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative text-white">
            <button
              onClick={() => setShowIosModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-5 h-5 text-amber-400" />
              <h4 className="font-bold text-sm">Install Kifayat Connect</h4>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Install Kifayat Connect on your home screen for quick offline access and fast native performance:
            </p>

            <div className="space-y-2.5 text-xs text-slate-300 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2.5">
                <Share className="w-4 h-4 text-blue-400 shrink-0" />
                <span>1. Tap the <strong>Share</strong> button in browser toolbar</span>
              </div>
              <div className="flex items-center gap-2.5">
                <PlusSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>2. Select <strong>Add to Home Screen</strong></span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowIosModal(false)}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
