import React from 'react';
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

export const FaizKhelVipCrownIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="fkGoldShieldGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="48%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#D4AF37" />
      </linearGradient>
    </defs>
    {/* Shield Silhouette */}
    <path
      d="M12 2L20 5.2V11.2C20 16.3 16.6 20.4 12 22C7.4 20.4 4 16.3 4 11.2V5.2L12 2Z"
      fill="#022C22"
      stroke="url(#fkGoldShieldGrad)"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    {/* Royal Crown inside Shield */}
    <path
      d="M7.2 14.2L6.5 9.6L9.5 11.4L12 8.2L14.5 11.4L17.5 9.6L16.8 14.2H7.2Z"
      fill="url(#fkGoldShieldGrad)"
      stroke="#8A6218"
      strokeWidth="0.6"
      strokeLinejoin="round"
    />
    <rect x="7.4" y="14.9" width="9.2" height="1.5" rx="0.7" fill="url(#fkGoldShieldGrad)" />
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
            ? `0 2px 14px ${clan.glowColor}, inset 0 1px 0 rgba(253, 224, 71, 0.36), inset 0 -1px 0 rgba(0, 0, 0, 0.55)`
            : `0 2px 7px ${clan.glowColor}, inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.4)`,
        }}
        className={`inline-flex items-center gap-1 rounded-md border-solid font-bold tracking-wide select-none align-middle ${
          compact ? 'px-1.5 py-0.5 text-[10px] leading-tight' : 'px-2.5 py-0.5 text-[11px] leading-tight'
        } ${isFlagship ? 'ring-1 ring-[#D4AF37]/45' : ''} ${className}`}
      >
        {isFlagship ? (
          <FaizKhelVipCrownIcon className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        ) : (
          <span aria-hidden="true" className={compact ? 'text-[10px]' : 'text-[11px]'}>
            {clan.emblem}
          </span>
        )}
        {compact ? (
          <span className="truncate max-w-[140px] font-urdu-auto">
            {language === 'ur' ? urduName : `${englishName} | ${urduName}`}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 truncate max-w-[215px]">
            <span className="uppercase tracking-wider text-[10px] font-extrabold">{englishName}</span>
            <span className="opacity-70">|</span>
            <span className="font-urdu-auto font-bold">{urduName}</span>
          </span>
        )}
      </span>
    );
  }
);

TabbarBadge.displayName = 'TabbarBadge';
