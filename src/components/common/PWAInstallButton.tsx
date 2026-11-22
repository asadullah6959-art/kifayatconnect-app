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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#0D2A1F] text-[#059669] border border-[#059669]/35">
        <Check className="w-3.5 h-3.5 text-[#E5E4E2]" />
        <span>{language === 'ur' ? 'انسٹال شدہ' : 'PWA Ready'}</span>
      </span>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        title={language === 'ur' ? 'سوئی خیل اتحاد ایپ انسٹال کریں' : 'Install SUI KHEL ITTEHAD App'}
        className={`inline-flex items-center gap-1.5 rounded-xl font-bold kc-pressable cursor-pointer ${
          compact
            ? 'px-2.5 py-1.5 text-xs bg-[#0D2A1F] text-[#E5E4E2] hover:bg-[#1A233A] border border-[#E5E4E2]/40'
            : 'px-3.5 py-2 text-xs kc-gold-button font-extrabold'
        }`}
      >
        <Smartphone className="w-3.5 h-3.5 shrink-0" />
        <span>{language === 'ur' ? 'ایپ انسٹال کریں' : 'Install App'}</span>
      </button>

      {/* iOS or fallback modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-[95] kc-modal-backdrop bg-black/80 flex items-start sm:items-center justify-center overflow-y-auto">
          <div className="kc-luxury-modal kc-modal-panel rounded-2xl max-w-sm w-full p-5 pb-24 sm:pb-5 relative text-white my-auto overflow-y-auto">
            <div className="flex items-start justify-between gap-2.5 mb-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Smartphone className="w-5 h-5 text-[#E5E4E2] shrink-0" />
                <h4 className="font-extrabold text-sm text-white break-words whitespace-normal leading-snug">
                  {language === 'ur' ? 'سوئی خیل اتحاد انسٹال کریں' : 'Install SUI KHEL ITTEHAD'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                aria-label={language === 'ur' ? 'بند کریں' : 'Close'}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl bg-[#071812] hover:bg-[#1A233A] border border-[#E5E4E2]/30 text-slate-300 hover:text-white kc-pressable cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {language === 'ur'
                ? 'تیز رفتار رسائی اور آف لائن استعمال کے لیے سوئی خیل اتحاد کو اپنی ہوم اسکرین پر شامل کریں:'
                : 'Install SUI KHEL ITTEHAD on your home screen for quick offline access and fast native performance:'}
            </p>

            <div className="space-y-2.5 text-xs text-slate-200 bg-[#071812] p-3.5 rounded-xl border border-[#E5E4E2]/30">
              <div className="flex items-center gap-2.5">
                <Share className="w-4 h-4 text-[#E5E4E2] shrink-0" />
                <span>
                  {language === 'ur'
                    ? '1. براؤزر ٹول بار میں Share بٹن پر کلک کریں'
                    : <>1. Tap the <strong>Share</strong> button in browser toolbar</>}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <PlusSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {language === 'ur'
                    ? '2. Add to Home Screen منتخب کریں'
                    : <>2. Select <strong>Add to Home Screen</strong></>}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5E4E2]/25 flex justify-end">
              <button
                onClick={() => setShowIosModal(false)}
                className="px-4 py-2 rounded-xl kc-gold-button font-extrabold text-xs cursor-pointer"
              >
                {language === 'ur' ? 'سمجھ گیا' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
