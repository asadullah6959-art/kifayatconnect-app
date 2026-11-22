import React from 'react';

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
      data-locked-logo="sui-khel-ittehad-unity"
      className={`kc-app-logo-locked relative inline-flex items-center justify-center select-none shrink-0 rounded-full ${SIZE_MAP[size]} ${
        animated ? 'kc-animate-crown-float' : ''
      } ${className}`}
      style={{
        filter: 'none',
        WebkitFilter: 'none',
        mixBlendMode: 'normal',
      }}
      aria-label="SUI KHEL ITTEHAD (SKI) Unity"
    >
      {showHalo && (
        <span
          aria-hidden="true"
          className="absolute -inset-1.5 rounded-full kc-unity-halo"
        />
      )}
      <img
        src="/kc-emblem.svg"
        alt="SUI KHEL ITTEHAD Unity"
        draggable={false}
        className="kc-app-logo-locked relative z-10 w-full h-full rounded-full object-contain ring-1 ring-[#E5E4E2]/55 drop-shadow-[0_6px_14px_rgba(5,150,105,0.38)]"
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
