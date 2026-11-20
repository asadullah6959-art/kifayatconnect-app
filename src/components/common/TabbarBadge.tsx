import React, { useId } from 'react';
import type { User } from '../../types';
import { resolveUserTabbar } from '../../data/tabbars';

interface TabbarBadgeProps {
  user?: Partial<User>;
  tabbarId?: string;
  tabbarEnglish?: string;
  tabbarUrdu?: string;
  compact?: boolean;
  language?: 'en' | 'ur';
  className?: string;
}

/**
 * Largest, sharpest 3D Metallic Royal Gold Crown SVG (default 24px) exclusively for Faiz Khel (فیض خیل)
 */
export const FaizKhelVipCrownIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => {
  const uid = useId().replace(/:/g, '');
  const goldFaceId = `fkGoldFace_${uid}`;
  const goldDarkId = `fkGoldDark_${uid}`;
  const goldRimId = `fkGoldRim_${uid}`;

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-[0_0_8px_rgba(253,224,71,0.72)] ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={goldFaceId} x1="3" y1="4" x2="29" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="35%" stopColor="#FDE047" />
          <stop offset="70%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id={goldDarkId} x1="16" y1="6" x2="16" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <linearGradient id={goldRimId} x1="5" y1="22" x2="27" y2="27" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
      </defs>

      {/* Back crown arches for 3D depth */}
      <path
        d="M6.5 21.5L9.5 11.5L13.5 16L16 9.5L18.5 16L22.5 11.5L25.5 21.5H6.5Z"
        fill={`url(#${goldDarkId})`}
      />

      {/* Main 3D Faceted Metallic Royal Crown */}
      <path
        d="M5.5 22.5L3.8 11.2L10.4 15.6L16 6.8L21.6 15.6L28.2 11.2L26.5 22.5H5.5Z"
        fill={`url(#${goldFaceId})`}
        stroke="#78350F"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Specular center facet highlight */}
      <path
        d="M16 7.4L12.6 16.5L16 21.8L19.4 16.5L16 7.4Z"
        fill="#FEF9C3"
        fillOpacity="0.45"
      />

      {/* Royal Crown Rim Band */}
      <rect
        x="5"
        y="22.3"
        width="22"
        height="4.2"
        rx="1.8"
        fill={`url(#${goldRimId})`}
        stroke="#78350F"
        strokeWidth="0.9"
      />
      <line x1="7" y1="23.4" x2="25" y2="23.4" stroke="#FEF9C3" strokeWidth="0.7" strokeOpacity="0.75" />

      {/* Tip Jewels */}
      <circle cx="3.8" cy="10.2" r="1.9" fill="#FEF08A" stroke="#78350F" strokeWidth="0.8" />
      <circle cx="16" cy="5.6" r="2.3" fill="#FEF9C3" stroke="#78350F" strokeWidth="0.8" />
      <circle cx="28.2" cy="10.2" r="1.9" fill="#FEF08A" stroke="#78350F" strokeWidth="0.8" />

      {/* Center Faceted Royal Jewels */}
      <path d="M16 14.5L18.1 17.3L16 20.1L13.9 17.3L16 14.5Z" fill="#E11D48" stroke="#FEF08A" strokeWidth="0.7" />
      <circle cx="10.3" cy="18.6" r="1.15" fill="#38BDF8" stroke="#FEF08A" strokeWidth="0.5" />
      <circle cx="21.7" cy="18.6" r="1.15" fill="#38BDF8" stroke="#FEF08A" strokeWidth="0.5" />
    </svg>
  );
};

/**
 * Compact 14px simple crown exclusively for standard tier Rousa Khel (strictly smaller than Faiz Khel)
 */
const StandardSimpleCrownIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    <path
      d="M2.5 11.5L1.8 5.2L5.3 8L8 4L10.7 8L14.2 5.2L13.5 11.5H2.5Z"
      fill="#E9D5FF"
      fillOpacity="0.9"
      stroke="#D8B4FE"
      strokeWidth="0.9"
      strokeLinejoin="round"
    />
    <rect x="2.5" y="12.2" width="11" height="1.5" rx="0.75" fill="#E9D5FF" />
  </svg>
);

export const TabbarBadge: React.FC<TabbarBadgeProps> = React.memo(
  ({
    user,
    tabbarId,
    tabbarEnglish,
    tabbarUrdu,
    compact = false,
    language = 'en',
    className = '',
  }) => {
    const resolved = resolveUserTabbar({
      tabbarId: tabbarId ?? user?.tabbarId,
      tabbarEnglish: tabbarEnglish ?? user?.tabbarEnglish,
      tabbarUrdu: tabbarUrdu ?? user?.tabbarUrdu,
    });

    if (!resolved) return null;

    const { clan, englishName, urduName } = resolved;
    const isFlagship = Boolean(clan.isFlagship);
    const isRousaKhel = clan.id === 'rousa_khel';

    return (
      <span
        dir="ltr"
        title={`${urduName} • ${englishName}`}
        style={{
          background: clan.gradientBg,
          borderColor: clan.borderColor,
          color: clan.textColor,
          borderWidth: isFlagship ? '1.5px' : '1px',
          boxShadow: isFlagship
            ? `0 3px 16px ${clan.glowColor}, inset 0 1px 0 rgba(254, 240, 138, 0.42), inset 0 -1px 0 rgba(0, 0, 0, 0.55)`
            : `0 2px 7px ${clan.glowColor}, inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.4)`,
        }}
        className={`relative overflow-hidden inline-flex items-center gap-1.5 rounded-lg border-solid font-bold tracking-wide select-none align-middle ${
          isFlagship
            ? compact
              ? 'px-2 py-0.5 text-[11px] leading-tight ring-1 ring-[#FDE047]/45'
              : 'px-3 py-1 text-xs leading-tight ring-1 ring-[#FDE047]/55'
            : compact
            ? 'px-1.5 py-0.5 text-[10px] leading-tight'
            : 'px-2.5 py-0.5 text-[11px] leading-tight'
        } ${className}`}
      >
        {isFlagship && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-transparent via-[#FEF08A]/25 to-transparent kc-animate-shimmer"
          />
        )}

        {isFlagship ? (
          <FaizKhelVipCrownIcon className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
        ) : isRousaKhel ? (
          <StandardSimpleCrownIcon className="w-3 h-3" />
        ) : (
          <span aria-hidden="true" className="text-[12px] leading-none">
            {clan.emblem}
          </span>
        )}

        {compact ? (
          <span className="relative z-10 whitespace-nowrap font-urdu-auto text-[9px]">
            {language === 'ur' ? urduName : `${englishName} | ${urduName}`}
          </span>
        ) : (
          <span className="relative z-10 inline-flex items-center gap-1 whitespace-nowrap text-[9px]">
            <span className="uppercase tracking-wider font-extrabold">{englishName}</span>
            <span className="opacity-70">|</span>
            <span className="font-urdu-auto font-bold">{urduName}</span>
          </span>
        )}

        {isFlagship && (
          <span className="relative z-10 shrink-0 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#FEF08A] via-[#FDE047] to-[#D4AF37] text-[#1C1404] text-[8px] font-black px-1 py-0 tracking-wider uppercase leading-none shadow-xs">
            VIP
          </span>
        )}
      </span>
    );
  }
);

TabbarBadge.displayName = 'TabbarBadge';
