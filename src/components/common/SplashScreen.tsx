import React, { useEffect, useState } from 'react';
import { BrandEmblem3D } from './BrandEmblem3D';

interface SplashScreenProps {
  appName?: string;
  tagline?: string;
  language?: 'en' | 'ur';
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  appName = 'KIFAYAT CONNECT',
  tagline = 'Together for a Better Tomorrow',
  language = 'en',
  onFinish
}) => {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadingOut(true), 1850);
    const doneTimer = setTimeout(() => onFinish(), 2200);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0A0D12] overflow-hidden select-none transition-opacity duration-350 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="Kifayat Connect Splash Screen"
    >
      {/* Subtle radial obsidian-emerald atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(4, 57, 39, 0.42) 0%, rgba(10, 13, 18, 0.96) 62%, #0A0D12 100%)'
        }}
      />

      {/* Apollo-Style 3D Perspective Stage */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 kc-animate-tilt-3d">
        <div className="relative p-5 rounded-3xl bg-[#111622] border border-[#D4AF37]/40 shadow-[0_20px_60px_rgba(212,175,55,0.18)] overflow-hidden">
          {/* Moving Golden Light-Sweep Shimmer (GPU transform/opacity only) */}
          <div
            className="absolute inset-y-0 left-0 w-1/2 pointer-events-none kc-animate-shimmer"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(245, 208, 97, 0.22) 50%, transparent 100%)'
            }}
          />
          <BrandEmblem3D size="xl" animated />
        </div>

        {/* Metallic Gold Brand Typography */}
        <h1 className="mt-7 text-2xl sm:text-4xl font-extrabold tracking-[0.18em] uppercase kc-gold-gradient-text drop-shadow-sm">
          {language === 'ur' ? 'کفایت کنیکٹ' : appName.toUpperCase()}
        </h1>

        <div className="mt-2.5 flex items-center justify-center gap-2">
          <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#D4AF37]" />
          <p className="text-xs sm:text-sm font-semibold tracking-wider text-emerald-300/95">
            {language === 'ur' ? 'بہتر کل کے لیے ایک ساتھ' : tagline}
          </p>
          <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[#D4AF37]" />
        </div>

        {/* Minimal Apollo-style Progress Accent */}
        <div className="mt-8 w-44 h-1 rounded-full bg-[#161D2C] overflow-hidden border border-[#D4AF37]/20">
          <div
            className="h-full w-full origin-left bg-gradient-to-r from-[#043927] via-[#D4AF37] to-[#F5D061]"
            style={{
              animation: 'kcShimmer 1.6s ease-in-out infinite'
            }}
          />
        </div>
      </div>
    </div>
  );
};
