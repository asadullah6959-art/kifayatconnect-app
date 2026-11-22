import React, { useEffect, useState } from 'react';
import { AppLogo } from './AppLogo';

interface SplashScreenProps {
  appName?: string;
  tagline?: string;
  language?: 'en' | 'ur';
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  appName = 'SUI KHEL ITTEHAD',
  tagline = 'Together for a Better Tomorrow',
  language = 'en',
  onFinish
}) => {
  const [stage, setStage] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const stageTimers = [900, 900, 900].map((duration, index) =>
      setTimeout(() => setStage(index + 1), duration * (index + 1))
    );
    const fadeTimer = setTimeout(() => setFadingOut(true), 3150);
    const doneTimer = setTimeout(onFinish, 3420);
    return () => {
      stageTimers.forEach(clearTimeout);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#071812] overflow-hidden select-none transition-opacity duration-250 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="SUI KHEL ITTEHAD (SKI) Splash Screen"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(5,150,105,0.32) 0%, rgba(4,99,7,0.22) 42%, #071812 100%)'
        }}
      />
      <div className="relative z-10 flex h-full max-h-[680px] w-full max-w-lg flex-col items-center justify-center text-center px-6">
        <div className={`relative transition-all duration-700 ${stage === 0 ? 'scale-75 opacity-0' : 'scale-100 opacity-100'}`}>
          <div className="absolute -inset-8 rounded-full border border-[#E5E4E2]/20" />
          <div className="absolute -inset-16 rounded-full border border-[#059669]/20" />
          <AppLogo size="xl" animated halo />
        </div>
        {stage >= 1 && (
          <div className="mt-7 flex items-end justify-center gap-2" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((person) => (
              <span
                key={person}
                className="block origin-bottom rounded-t-full bg-gradient-to-b from-[#E5E4E2] to-[#046307]"
                style={{
                  width: `${18 + person * 2}px`,
                  height: `${54 + (person % 3) * 10}px`,
                  opacity: 0.72 + person * 0.05,
                  transform: `translateY(${stage >= 2 ? 4 : 18}px)`,
                  transition: 'all 700ms ease',
                  clipPath: 'polygon(34% 0,66% 0,72% 26%,100% 100%,0 100%,28% 26%)'
                }}
              />
            ))}
          </div>
        )}
        {stage >= 3 && (
          <div className="mt-5 flex items-center justify-center gap-3 animate-pulse" aria-label="Unity hands joining">
            <span className="h-2 w-14 -rotate-12 rounded-full bg-[#E5E4E2]" />
            <span className="h-3 w-3 rotate-45 rounded-sm bg-[#059669]" />
            <span className="h-2 w-14 rotate-12 rounded-full bg-[#046307]" />
          </div>
        )}
        <h1 className="mt-7 max-w-full break-words text-xl sm:text-4xl font-extrabold leading-tight tracking-[0.12em] uppercase text-[#E5E4E2] drop-shadow-lg">
          {language === 'ur' ? 'سوئی خیل اتحاد (SKI)' : appName}
        </h1>
        <p className="mt-2 text-xs sm:text-sm font-semibold tracking-[0.12em] text-[#7DD3A7]">
          {stage === 0 ? 'UNITY EMBLEM' : stage === 1 ? 'PEOPLE GATHERING' : stage === 2 ? 'STRENGTH THROUGH UNITY' : 'WELCOME'}
        </p>
        <div className="mt-8 flex gap-2" aria-hidden="true">
          {[0, 1, 2, 3].map((dot) => (
            <span key={dot} className={`h-1.5 rounded-full transition-all duration-500 ${stage === dot ? 'w-8 bg-[#059669]' : 'w-2 bg-[#CBD5E1]/50'}`} />
          ))}
        </div>
      </div>
    </div>
  );
};
