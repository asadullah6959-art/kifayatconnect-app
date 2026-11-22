import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X, Smartphone } from 'lucide-react';
import { isIphoneSafariBrowser } from '../../utils/iphoneShare';

const BANNER_DISMISSED_KEY = 'kc_ios_safari_banner_dismissed_v1';

export const IphoneSafariInstallBanner: React.FC<{ language: 'en' | 'ur' }> = ({ language }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!isIphoneSafariBrowser()) return;
      const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY) === '1';
      if (!dismissed) {
        setVisible(true);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(BANNER_DISMISSED_KEY, '1');
    } catch {
      // ignore
    }
  };

  return (
    <div
      role="region"
      aria-label={language === 'ur' ? 'آئی فون انسٹال گائیڈ' : 'iPhone Install Guide'}
      className="relative w-full rounded-2xl p-3 sm:p-3.5 border border-[#059669]/40 shadow-[0_10px_28px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(56,189,248,0.18)] text-[#F8FAFC]"
      style={{
        background: 'linear-gradient(135deg, #0D2A1F 0%, #1E293B 58%, #0F172A 100%)',
      }}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#071812] border border-[#059669]/45 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
            <Smartphone className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="min-w-0 space-y-1 text-[11px] leading-snug">
            <div className="flex items-center gap-1.5 flex-wrap font-extrabold text-[#E5E4E2]">
              <Share className="w-3.5 h-3.5 shrink-0 text-[#059669]" />
              <span>
                Install on iPhone: Tap Share (↑) then &apos;Add to Home Screen&apos;
              </span>
              <PlusSquare className="w-3.5 h-3.5 text-[#059669] shrink-0" />
            </div>
            <p className="font-bold text-[#F8FAFC] font-urdu-auto" dir="rtl">
              آئی فون پر انسٹال کریں: شیئر (↑) دبائیں اور &apos;Add to Home Screen&apos; منتخب کریں
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label={language === 'ur' ? 'بند کریں' : 'Dismiss'}
          className="p-1.5 rounded-lg bg-[#071812]/85 hover:bg-[#071812] border border-slate-400/25 text-[#94A3B8] hover:text-[#F8FAFC] shrink-0 cursor-pointer kc-pressable"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
