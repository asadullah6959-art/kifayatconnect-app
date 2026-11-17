import React from 'react';

/**
 * Sui Khel Qaumi Ittehad emblem — the handshake mark inside a gear ring.
 * Drawn as vector so it prints crisply at any size and needs no asset file.
 * This is the ORGANISATION's emblem; it must never be replaced by Kifayat
 * Connect branding on the Rukniyat Form or the Raseed Wasooli.
 */
export const SqiEmblem: React.FC<{ className?: string; title?: string }> = ({
  className = 'sqi-emblem',
  title = 'Sui Khel Qaumi Ittehad emblem',
}) => (
  <svg viewBox="0 0 120 120" className={className} role="img" aria-label={title}>
    <title>{title}</title>
    <defs>
      <linearGradient id="sqiGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e8cf8a" />
        <stop offset="45%" stopColor="#b8912f" />
        <stop offset="100%" stopColor="#7c5c14" />
      </linearGradient>
    </defs>

    {/* gear ring */}
    <circle cx="60" cy="60" r="57" fill="none" stroke="url(#sqiGold)" strokeWidth="2.4" />
    <circle cx="60" cy="60" r="51.5" fill="none" stroke="url(#sqiGold)" strokeWidth="1" />
    {Array.from({ length: 24 }).map((_, i) => {
      const angle = (i * 360) / 24;
      return (
        <rect
          key={i}
          x="58.6"
          y="0.6"
          width="2.8"
          height="6"
          fill="url(#sqiGold)"
          transform={`rotate(${angle} 60 60)`}
        />
      );
    })}

    {/* inner field */}
    <circle cx="60" cy="60" r="45" fill="#fdfbf4" stroke="url(#sqiGold)" strokeWidth="1.2" />

    {/* SQI lettering */}
    <text
      x="60"
      y="36"
      textAnchor="middle"
      fontFamily="Georgia, 'Times New Roman', serif"
      fontSize="14"
      fontWeight="700"
      letterSpacing="1.6"
      fill="#7c5c14"
    >
      SQI
    </text>

    {/* handshake */}
    <g stroke="#7c5c14" strokeWidth="3.4" strokeLinecap="round" fill="none">
      <path d="M34 62 L48 62 L54 68 L60 68" />
      <path d="M86 62 L72 62 L66 68 L60 68" />
      <path d="M44 56 L54 62" />
      <path d="M76 56 L66 62" />
      <path d="M52 72 L58 78 L64 72" />
    </g>
    <g fill="url(#sqiGold)">
      <rect x="30" y="58" width="8" height="9" rx="2" />
      <rect x="82" y="58" width="8" height="9" rx="2" />
    </g>

    {/* unity marks */}
    <text
      x="60"
      y="94"
      textAnchor="middle"
      fontFamily="'Noto Nastaliq Urdu', serif"
      fontSize="9"
      fill="#7c5c14"
    >
      اتحاد
    </text>
  </svg>
);

export default SqiEmblem;
