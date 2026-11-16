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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#131C31] text-[#38BDF8] border border-[#38BDF8]/35">
        <Check className="w-3.5 h-3.5 text-[#F5D061]" />
        <span>{language === 'ur' ? 'انسٹال شدہ' : 'PWA Ready'}</span>
      </span>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        title={language === 'ur' ? 'کفایت کنیکٹ ایپ انسٹال کریں' : 'Install Kifayat Connect App'}
        className={`inline-flex items-center gap-1.5 rounded-xl font-bold kc-pressable cursor-pointer ${
          compact
            ? 'px-2.5 py-1.5 text-xs bg-[#141B2D] text-[#F5D061] hover:bg-[#1A233A] border border-[#D4AF37]/40'
            : 'px-3.5 py-2 text-xs kc-gold-button font-extrabold'
        }`}
      >
        <Smartphone className="w-3.5 h-3.5 shrink-0" />
        <span>{language === 'ur' ? 'ایپ انسٹال کریں' : 'Install App'}</span>
      </button>

      {/* iOS or fallback modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="kc-luxury-modal rounded-2xl max-w-sm w-full p-5 relative text-white">
            <button
              onClick={() => setShowIosModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-[#090D16] hover:bg-[#1A233A] border border-[#D4AF37]/30 text-slate-300 hover:text-white kc-pressable cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-5 h-5 text-[#F5D061]" />
              <h4 className="font-extrabold text-sm text-white">
                {language === 'ur' ? 'کفایت کنیکٹ انسٹال کریں' : 'Install Kifayat Connect'}
              </h4>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {language === 'ur'
                ? 'تیز رفتار رسائی اور آف لائن استعمال کے لیے کفایت کنیکٹ کو اپنی ہوم اسکرین پر شامل کریں:'
                : 'Install Kifayat Connect on your home screen for quick offline access and fast native performance:'}
            </p>

            <div className="space-y-2.5 text-xs text-slate-200 bg-[#090D16] p-3.5 rounded-xl border border-[#D4AF37]/30">
              <div className="flex items-center gap-2.5">
                <Share className="w-4 h-4 text-[#F5D061] shrink-0" />
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

            <div className="mt-4 pt-3 border-t border-[#D4AF37]/25 flex justify-end">
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
