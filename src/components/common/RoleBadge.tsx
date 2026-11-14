import React from 'react';
import { UserRole } from '../../types';
import { useApp } from '../../context/AppContext';
import { getRoleDisplayLabel } from '../../data/translations';

interface RoleBadgeProps {
  role: UserRole;
  isFounder?: boolean;
  isAuditOfficer?: boolean;
  compact?: boolean;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = React.memo(({
  role,
  isFounder = false,
  isAuditOfficer = false,
  compact = false,
  className = ''
}) => {
  const { language } = useApp();
  const label = getRoleDisplayLabel(role, language);
  const sizeCls = compact ? 'px-2 py-0.5 text-[9px] gap-1' : 'px-2.5 py-0.5 text-[10px] gap-1.5';

  let primaryBadge: React.ReactNode;
  switch (role) {
    case 'SUPER_ADMIN':
      primaryBadge = (
        <span
          className={`inline-flex items-center font-extrabold uppercase tracking-wider rounded-lg border shadow-[0_2px_8px_rgba(212,175,55,0.28),inset_0_1px_0_rgba(255,245,190,0.45)] shrink-0 ${sizeCls}`}
          style={{
            background: 'linear-gradient(135deg, #3A2A0A 0%, #7A5816 50%, #2A1D06 100%)',
            borderColor: '#F5D061',
            color: '#FFF2B2'
          }}
        >
          <span aria-hidden="true" className="leading-none">👑</span>
          <span>{label}{isFounder ? (language === 'ur' ? ' · بانی' : ' · FOUNDER') : ''}</span>
        </span>
      );
      break;

    case 'ADMIN':
      primaryBadge = (
        <span
          className={`inline-flex items-center font-extrabold uppercase tracking-wider rounded-lg border shadow-[0_2px_8px_rgba(37,99,235,0.25),inset_0_1px_0_rgba(191,219,254,0.3)] shrink-0 ${sizeCls}`}
          style={{
            background: 'linear-gradient(135deg, #0E234E 0%, #1E40AF 55%, #0B1B3B 100%)',
            borderColor: '#D4AF37',
            color: '#DBEAFE'
          }}
        >
          <span aria-hidden="true" className="text-[#F5D061] leading-none">★</span>
          <span>{label}</span>
        </span>
      );
      break;

    case 'CO_ADMIN':
      primaryBadge = (
        <span
          className={`inline-flex items-center font-extrabold uppercase tracking-wider rounded-lg border shadow-[0_2px_8px_rgba(5,150,105,0.25),inset_0_1px_0_rgba(167,243,208,0.3)] shrink-0 ${sizeCls}`}
          style={{
            background: 'linear-gradient(135deg, #032B1E 0%, #046C4E 55%, #022016 100%)',
            borderColor: '#34D399',
            color: '#D1FAE5'
          }}
        >
          <span aria-hidden="true" className="text-[#F5D061] leading-none">✦</span>
          <span>{label}</span>
        </span>
      );
      break;

    case 'MEMBER':
    default:
      primaryBadge = (
        <span
          className={`inline-flex items-center font-extrabold uppercase tracking-wider rounded-lg border shadow-[0_2px_8px_rgba(126,34,206,0.25),inset_0_1px_0_rgba(233,213,255,0.28)] shrink-0 ${sizeCls}`}
          style={{
            background: 'linear-gradient(135deg, #271242 0%, #5B21B6 55%, #1D0B33 100%)',
            borderColor: '#C084FC',
            color: '#F3E8FF'
          }}
        >
          <span aria-hidden="true" className="leading-none">👥</span>
          <span>{label}</span>
        </span>
      );
      break;
  }

  if (!isAuditOfficer) {
    return className ? (
      <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>{primaryBadge}</span>
    ) : (
      <>{primaryBadge}</>
    );
  }

  const auditBadge = (
    <span
      className={`inline-flex items-center font-extrabold uppercase tracking-wider rounded-lg border shadow-[0_2px_8px_rgba(14,165,233,0.22),inset_0_1px_0_rgba(186,230,253,0.35)] shrink-0 ${sizeCls}`}
      style={{
        background: 'linear-gradient(135deg, #072A3E 0%, #0369A1 55%, #061D2C 100%)',
        borderColor: '#38BDF8',
        color: '#E0F2FE'
      }}
    >
      <span aria-hidden="true" className="text-[#F5D061] leading-none">🛡️</span>
      <span>{language === 'ur' ? 'آڈٹ آفیسر' : 'AUDIT OFFICER'}</span>
    </span>
  );

  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      {primaryBadge}
      {auditBadge}
    </span>
  );
});

RoleBadge.displayName = 'RoleBadge';
