import React from 'react';
import kcUnityEmblem from '../../assets/images/kc-unity-emblem.png';

interface BrandEmblem3DProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  halo?: boolean;
  className?: string;
}

const SIZE_MAP: Record<NonNullable<BrandEmblem3DProps['size']>, string> = {
  xs: 'w-7 h-7',
  sm: 'w-9 h-9',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28'
};

export const BrandEmblem3D: React.FC<BrandEmblem3DProps> = React.memo(({
  size = 'md',
  animated = false,
  halo = false,
  className = ''
}) => {
  const showHalo = halo || animated;
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none shrink-0 rounded-full ${SIZE_MAP[size]} ${
        animated ? 'kc-animate-crown-float' : ''
      } ${className}`}
      aria-label="Kifayat Connect Unity Emblem"
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
        className="relative z-10 w-full h-full rounded-full object-contain ring-1 ring-[#D4AF37]/45 drop-shadow-[0_6px_14px_rgba(212,175,55,0.34)]"
      />
    </div>
  );
});

BrandEmblem3D.displayName = 'BrandEmblem3D';
