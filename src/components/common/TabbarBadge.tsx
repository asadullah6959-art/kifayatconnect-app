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
          boxShadow: isFlagship
            ? `0 2px 10px ${clan.glowColor}, inset 0 1px 0 rgba(255,255,255,0.34), inset 0 -1px 0 rgba(0,0,0,0.45)`
            : `0 2px 7px ${clan.glowColor}, inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.4)`,
        }}
        className={`inline-flex items-center gap-1 rounded-md border font-bold tracking-wide select-none align-middle ${
          compact ? 'px-1.5 py-0.5 text-[10px] leading-tight' : 'px-2 py-0.5 text-[11px] leading-tight'
        } ${isFlagship ? 'ring-1 ring-[#FCE38A]/45' : ''} ${className}`}
      >
        <span aria-hidden="true" className={compact ? 'text-[10px]' : 'text-[11px]'}>
          {clan.emblem}
        </span>
        {compact ? (
          <span className="truncate max-w-[125px] font-urdu-auto">
            {language === 'ur' ? urduName : `${urduName} · ${englishName}`}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 truncate max-w-[190px]">
            <span className="font-urdu-auto">{urduName}</span>
            <span className="opacity-65">•</span>
            <span className="uppercase tracking-wider text-[9.5px] opacity-95">{englishName}</span>
          </span>
        )}
      </span>
    );
  }
);

TabbarBadge.displayName = 'TabbarBadge';
