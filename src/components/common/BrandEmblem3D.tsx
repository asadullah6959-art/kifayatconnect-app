import React, { useId } from 'react';

interface BrandEmblem3DProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
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
  className = ''
}) => {
  const uid = useId().replace(/:/g, '');
  const goldGrad = `kcGold_${uid}`;
  const goldBright = `kcGoldBright_${uid}`;
  const emeraldGrad = `kcEmerald_${uid}`;
  const obsidianGrad = `kcObsidian_${uid}`;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${SIZE_MAP[size]} ${
        animated ? 'kc-animate-crown-float' : ''
      } ${className}`}
      aria-label="Kifayat Connect Royal Emblem"
    >
      <svg
        viewBox="0 0 120 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_6px_14px_rgba(212,175,55,0.28)]"
      >
        <defs>
          <linearGradient id={goldGrad} x1="12" y1="6" x2="108" y2="122" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F5D061" />
            <stop offset="48%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#8A6218" />
          </linearGradient>
          <linearGradient id={goldBright} x1="20" y1="8" x2="96" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF2B2" />
            <stop offset="50%" stopColor="#F5D061" />
            <stop offset="100%" stopColor="#B88725" />
          </linearGradient>
          <linearGradient id={emeraldGrad} x1="20" y1="34" x2="100" y2="116" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#086E4E" />
            <stop offset="55%" stopColor="#043927" />
            <stop offset="100%" stopColor="#021F15" />
          </linearGradient>
          <linearGradient id={obsidianGrad} x1="26" y1="40" x2="94" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#171E2E" />
            <stop offset="100%" stopColor="#0A0D12" />
          </linearGradient>
        </defs>

        {/* 3D Royal Golden Crown above the Community Crest */}
        <g>
          {/* Crown Base Bevel */}
          <path
            d="M35 31L29 14L46 22L60 7L74 22L91 14L85 31H35Z"
            fill={`url(#${goldBright})`}
            stroke="#5C3D09"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Crown Rim */}
          <rect
            x="33"
            y="29.5"
            width="54"
            height="5.5"
            rx="2.5"
            fill={`url(#${goldGrad})`}
            stroke="#5C3D09"
            strokeWidth="1.2"
          />
          {/* Crown Jewels */}
          <circle cx="29" cy="13" r="2.6" fill="#F5D061" stroke="#5C3D09" strokeWidth="1" />
          <circle cx="60" cy="6.5" r="3.2" fill="#FFF2B2" stroke="#5C3D09" strokeWidth="1" />
          <circle cx="91" cy="13" r="2.6" fill="#F5D061" stroke="#5C3D09" strokeWidth="1" />
          <circle cx="60" cy="21" r="2.8" fill="#086E4E" stroke="#FFF2B2" strokeWidth="1" />
        </g>

        {/* Outer 3D Beveled Gold Shield Crest */}
        <path
          d="M60 37L102 51V76C102 99 83 116 60 123C37 116 18 99 18 76V51L60 37Z"
          fill={`url(#${goldGrad})`}
        />
        {/* Inner Royal Emerald Surface */}
        <path
          d="M60 41.5L97.5 54V75.5C97.5 96 80.5 111.5 60 118C39.5 111.5 22.5 96 22.5 75.5V54L60 41.5Z"
          fill={`url(#${emeraldGrad})`}
        />
        {/* Inner Recessed Obsidian Octagon Medallion */}
        <path
          d="M60 47L91 57.5V75C91 92 77 105.5 60 111.5C43 105.5 29 92 29 75V57.5L60 47Z"
          fill={`url(#${obsidianGrad})`}
          stroke={`url(#${goldGrad})`}
          strokeWidth="1.6"
        />

        {/* Interlocking Community Crest Monogram "KC" */}
        <path
          d="M42 63V92M42 77.5L55.5 63M47.5 72L56.5 92"
          stroke={`url(#${goldBright})`}
          strokeWidth="4.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M80.5 68C78.2 64.5 74.2 62.6 69.8 63C63.6 63.5 59.5 69.5 59.5 77.5C59.5 85.5 63.8 91.5 70 92C74.5 92.3 78.5 90.2 80.7 86.5"
          stroke={`url(#${goldBright})`}
          strokeWidth="4.6"
          strokeLinecap="round"
        />

        {/* Community Foundation Arc */}
        <path
          d="M42 100C47.5 103.5 53.5 105.2 60 105.2C66.5 105.2 72.5 103.5 78 100"
          stroke={`url(#${goldGrad})`}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
});

BrandEmblem3D.displayName = 'BrandEmblem3D';
