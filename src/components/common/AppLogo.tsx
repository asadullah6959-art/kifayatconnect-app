// CRITICAL: DO NOT REPLACE, MODIFY, OR OVERWRITE THIS LOGO IN ANY FUTURE UPDATE
// Permanently locked official Kifayat Connect circular Gold & Emerald Royal Crown Unity logo.
// Single source of truth used across Top Header, Mobile Menu / Side Drawer, Login Screen,
// Splash Screen, Digital ID Cards, Official Receipts, Rukniyat Forms, and Live Community Room.

import React from 'react';
import kcUnityEmblem from '../../assets/images/kc-unity-emblem.png';

export interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  halo?: boolean;
  className?: string;
}

const SIZE_MAP: Record<NonNullable<AppLogoProps['size']>, string> = {
  xs: 'w-7 h-7',
  sm: 'w-9 h-9',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28',
};

export const AppLogo: React.FC<AppLogoProps> = React.memo(({
  size = 'md',
  animated = false,
  halo = false,
  className = '',
}) => {
  const showHalo = halo || animated;
  return (
    <div
      data-locked-logo="kifayat-connect-unity"
      className={`kc-app-logo-locked relative inline-flex items-center justify-center select-none shrink-0 rounded-full ${SIZE_MAP[size]} ${
        animated ? 'kc-animate-crown-float' : ''
      } ${className}`}
      style={{
        filter: 'none',
        WebkitFilter: 'none',
        mixBlendMode: 'normal',
      }}
      aria-label="Kifayat Connect Unity"
    >
      {showHalo && (
        <span
          aria-hidden="true"
          className="absolute -inset-1.5 rounded-full kc-unity-halo"
        />
      )}
      <img
        src={kcUnityEmblem}
        alt="Kifayat Connect Unity"
        draggable={false}
        className="kc-app-logo-locked relative z-10 w-full h-full rounded-full object-contain ring-1 ring-[#D4AF37]/45 drop-shadow-[0_6px_14px_rgba(212,175,55,0.34)]"
        style={{
          filter: 'none',
          WebkitFilter: 'none',
          mixBlendMode: 'normal',
          backgroundColor: 'transparent',
        }}
      />
    </div>
  );
});

AppLogo.displayName = 'AppLogo';
