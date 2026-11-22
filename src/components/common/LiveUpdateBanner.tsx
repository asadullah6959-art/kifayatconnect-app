import React from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
interface LiveUpdateBannerProps {
  visible: boolean;
  versionLabel: string;
  isRefreshing: boolean;
  language: 'en' | 'ur';
  onRefresh: () => void;
  onDismiss: () => void;
}

export const LiveUpdateBanner: React.FC<LiveUpdateBannerProps> = ({
  visible,
  versionLabel,
  isRefreshing,
  language,
  onRefresh,
  onDismiss,
}) => {
  if (!visible) return null;

  const isUr = language === 'ur';

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full rounded-2xl bg-gradient-to-r from-[#071812] via-[#0D2A1F] to-[#071812] border border-[#E5E4E2]/75 shadow-[0_10px_28px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(249,226,156,0.22)] px-3 py-2.5 flex items-center justify-between gap-2 text-xs"
    >
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex-1 min-w-0 flex items-center gap-2.5 text-start cursor-pointer kc-pressable disabled:opacity-75"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FCE38A] via-[#E5E4E2] to-[#8A6218] text-[#071812] flex items-center justify-center shrink-0 shadow-md">
          {isRefreshing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-[#E5E4E2] break-words whitespace-normal leading-snug">
            {isRefreshing
              ? isUr
                ? 'نیا ورژن لوڈ ہو رہا ہے...'
                : 'Applying Latest Update...'
              : isUr
              ? 'نئی اپڈیٹ دستیاب ہے — ریفریش کرنے کے لیے ٹیپ کریں'
              : 'New Update Available — Tap to Refresh'}
          </div>
          <div className="text-[10px] text-slate-300 font-mono tabular-nums truncate">
            {isUr
              ? `لائیو ورژن v${versionLabel} · بغیر لاگ آؤٹ فوری اپڈیٹ`
              : `Live v${versionLabel} · Instant OTA refresh (keeps your session)`}
          </div>
        </div>
        <span className="shrink-0 px-2.5 py-1.5 rounded-xl kc-gold-button text-[11px] font-black inline-flex items-center gap-1">
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isUr ? 'ریفریش' : 'Refresh'}</span>
        </span>
      </button>

      <button
        type="button"
        onClick={onDismiss}
        aria-label={isUr ? 'اپڈیٹ بینر بند کریں' : 'Dismiss update banner'}
        className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-[#071812]/80 hover:bg-[#1E293B] border border-[#E5E4E2]/30 text-slate-300 hover:text-white shrink-0 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
