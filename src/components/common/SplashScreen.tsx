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
    const stageTimers = [420, 880, 820].map((duration, index) =>
      window.setTimeout(() => setStage(index + 1), duration * (index + 1))
    );
    const fadeTimer = window.setTimeout(() => setFadingOut(true), 3200);
    const doneTimer = window.setTimeout(onFinish, 3480);
    return () => {
      stageTimers.forEach(window.clearTimeout);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`ski-splash ski-splash-stage-${stage} fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden select-none transition-opacity duration-300 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="SUI KHEL ITTEHAD (SKI) Splash Screen"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <div className="ski-splash-backdrop absolute inset-0 pointer-events-none" />
      <div className="ski-splash-particles absolute inset-0 pointer-events-none" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => (
          <span
            key={index}
            className="ski-splash-particle"
            style={{
              left: `${(index * 47 + 13) % 100}%`,
              top: `${(index * 61 + 8) % 100}%`,
              animationDelay: `${(index % 6) * -0.7}s`,
              animationDuration: `${4 + (index % 5)}s`
            }}
          />
        ))}
      </div>
      <div className="ski-splash-content relative z-10 flex h-full max-h-[680px] w-full max-w-lg flex-col items-center justify-center px-6 text-center">
        <div className="ski-splash-crest-wrap relative">
          <span className="ski-splash-aura absolute -inset-9 rounded-full" aria-hidden="true" />
          <span className="ski-splash-aura-inner absolute -inset-4 rounded-full" aria-hidden="true" />
          <AppLogo size="xl" halo className="ski-splash-logo" />
        </div>
        <h1 className="ski-splash-title mt-8 max-w-full break-words text-xl font-extrabold uppercase leading-tight tracking-[0.12em] sm:text-4xl">
          {language === 'ur' ? 'سوئی خیل اتحاد (SKI)' : appName}
        </h1>
        <p className="ski-splash-tagline mt-2 text-xs font-semibold tracking-[0.12em] sm:text-sm">
          {tagline}
        </p>
        <div className="mt-8 flex gap-2" aria-hidden="true">
          {[0, 1, 2, 3].map(dot => (
            <span
              key={dot}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                stage === dot ? 'w-8 bg-[#C8A45D]' : 'w-2 bg-[#102338]/25'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
