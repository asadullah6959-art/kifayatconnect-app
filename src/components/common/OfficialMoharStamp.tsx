import React from 'react';

interface OfficialMoharStampProps {
  variant?: 'OFFICIAL' | 'VERIFIED';
  serialNumber?: string;
  size?: number;
  className?: string;
}

/**
 * Mandatory Circular 3D Royal Gold & Emerald Green Official App Stamp / Mohar.
 * Used across Rukniyat Form Section 4 ("برائے دفتری کارروائی") and approved Payment Receipts ("رسید وصولی").
 */
export const OfficialMoharStamp: React.FC<OfficialMoharStampProps> = React.memo(
  ({ variant = 'OFFICIAL', serialNumber, size = 126, className = '' }) => {
    const uid = React.useId().replace(/:/g, '');
    const bottomText =
      variant === 'VERIFIED'
        ? 'SUI KHEL ITTEHAD · VERIFIED SEAL'
        : 'SUI KHEL ITTEHAD · OFFICIAL SEAL';

    return (
      <div
        className={`inline-flex items-center justify-center select-none shrink-0 ${className}`}
        style={{ width: size, height: size }}
        aria-label="Official SUI KHEL ITTEHAD / SUI KHEL ITTEHAD Seal"
      >
        <svg
          viewBox="0 0 220 220"
          width={size}
          height={size}
          className="w-full h-full drop-shadow-[0_6px_16px_rgba(212,175,55,0.35)]"
        >
          <defs>
            <radialGradient id={`kcMoharBg_${uid}`} cx="50%" cy="42%" r="60%">
              <stop offset="0%" stopColor="#0D6E52" />
              <stop offset="55%" stopColor="#043B2B" />
              <stop offset="100%" stopColor="#021D15" />
            </radialGradient>
            <linearGradient id={`kcMoharGold_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E5E4E2" />
              <stop offset="38%" stopColor="#CBD5E1" />
              <stop offset="72%" stopColor="#E5E4E2" />
              <stop offset="100%" stopColor="#92600A" />
            </linearGradient>
            <path
              id={`kcTopArc_${uid}`}
              d="M 32,110 A 78,78 0 1,1 188,110"
            />
            <path
              id={`kcBotArc_${uid}`}
              d="M 192,114 A 82,82 0 0,1 28,114"
            />
          </defs>

          {/* Outer Beveled 3D Metallic Gold Ring */}
          <circle
            cx="110"
            cy="110"
            r="105"
            fill={`url(#kcMoharBg_${uid})`}
            stroke={`url(#kcMoharGold_${uid})`}
            strokeWidth="4.5"
          />
          <circle
            cx="110"
            cy="110"
            r="97"
            fill="none"
            stroke={`url(#kcMoharGold_${uid})`}
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.88"
          />
          <circle
            cx="110"
            cy="110"
            r="64"
            fill="rgba(2, 29, 21, 0.72)"
            stroke={`url(#kcMoharGold_${uid})`}
            strokeWidth="2.2"
          />

          {/* Curved Top Urdu Organization Text */}
          <text
            fill="#E5E4E2"
            fontSize="14.5"
            fontWeight="800"
            letterSpacing="0.5"
            textAnchor="middle"
          >
            <textPath href={`#kcTopArc_${uid}`} startOffset="50%">
              ★ مہر سوئی خیل اتحاد ★
            </textPath>
          </text>

          {/* Curved Bottom Official / Verified Seal Text */}
          <text
            fill="#CBD5E1"
            fontSize="9.8"
            fontWeight="800"
            letterSpacing="1.35"
            textAnchor="middle"
          >
            <textPath href={`#kcBotArc_${uid}`} startOffset="50%">
              {bottomText}
            </textPath>
          </text>

          {/* Center Crown & Monogram */}
          <path
            d="M 88 86 L 95 72 L 110 81 L 125 72 L 132 86 Z"
            fill={`url(#kcMoharGold_${uid})`}
            stroke="#FEF9C3"
            strokeWidth="0.9"
          />
          <circle cx="95" cy="70" r="2.3" fill="#E5E4E2" />
          <circle cx="110" cy="67" r="2.8" fill="#E5E4E2" />
          <circle cx="125" cy="70" r="2.3" fill="#E5E4E2" />

          <text
            x="110"
            y="112"
            textAnchor="middle"
            fill={`url(#kcMoharGold_${uid})`}
            fontSize="24"
            fontWeight="900"
            fontFamily="Plus Jakarta Sans, sans-serif"
            letterSpacing="2"
          >
            KC
          </text>

          <text
            x="110"
            y="129"
            textAnchor="middle"
            fill="#A7F3D0"
            fontSize="10.5"
            fontWeight="700"
          >
            {variant === 'VERIFIED' ? 'تصدیق شدہ' : 'منظور شدہ'}
          </text>

          {serialNumber ? (
            <text
              x="110"
              y="147"
              textAnchor="middle"
              fill="#CBD5E1"
              fontSize="8.8"
              fontWeight="800"
              fontFamily="JetBrains Mono, monospace"
            >
              {serialNumber.slice(0, 16)}
            </text>
          ) : (
            <text
              x="110"
              y="147"
              textAnchor="middle"
              fill="#CBD5E1"
              fontSize="8.2"
              fontWeight="700"
              letterSpacing="1"
            >
              SUI KHEL UNION
            </text>
          )}
        </svg>
      </div>
    );
  }
);

OfficialMoharStamp.displayName = 'OfficialMoharStamp';

/**
 * Draws the exact Circular 3D Royal Gold & Emerald Mohar Stamp onto an HTML5 2D Canvas
 * for high-resolution downloadable PDF receipts and official forms.
 */
export function drawMoharStampOnCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  options: { variant?: 'OFFICIAL' | 'VERIFIED'; serialNumber?: string } = {}
): void {
  const { variant = 'VERIFIED', serialNumber } = options;
  ctx.save();

  // Emerald gradient disk
  const bgGrad = ctx.createRadialGradient(cx, cy - radius * 0.16, radius * 0.1, cx, cy, radius);
  bgGrad.addColorStop(0, '#0D6E52');
  bgGrad.addColorStop(0.58, '#043B2B');
  bgGrad.addColorStop(1, '#021D15');

  const goldGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  goldGrad.addColorStop(0, '#E5E4E2');
  goldGrad.addColorStop(0.4, '#CBD5E1');
  goldGrad.addColorStop(0.75, '#E5E4E2');
  goldGrad.addColorStop(1, '#92600A');

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = bgGrad;
  ctx.fill();
  ctx.lineWidth = Math.max(3, radius * 0.05);
  ctx.strokeStyle = goldGrad;
  ctx.stroke();

  // Dashed inner ring
  ctx.save();
  ctx.setLineDash([radius * 0.06, radius * 0.045]);
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.89, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1.5, radius * 0.018);
  ctx.strokeStyle = '#CBD5E1';
  ctx.stroke();
  ctx.restore();

  // Core disk
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(2, 29, 21, 0.78)';
  ctx.fill();
  ctx.lineWidth = Math.max(2, radius * 0.024);
  ctx.strokeStyle = goldGrad;
  ctx.stroke();

  // Top & Bottom Seal Captions
  ctx.fillStyle = '#E5E4E2';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${Math.round(radius * 0.155)}px "Noto Nastaliq Urdu", "Plus Jakarta Sans", sans-serif`;
  ctx.fillText('مہر سوئی خیل اتحاد', cx, cy - radius * 0.72);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = `800 ${Math.round(radius * 0.115)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText(
    variant === 'VERIFIED' ? 'SUI KHEL ITTEHAD · VERIFIED' : 'SUI KHEL ITTEHAD · OFFICIAL',
    cx,
    cy + radius * 0.74
  );

  // Center Monogram
  ctx.fillStyle = goldGrad;
  ctx.font = `900 ${Math.round(radius * 0.34)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText('KC', cx, cy - radius * 0.08);

  ctx.fillStyle = '#A7F3D0';
  ctx.font = `700 ${Math.round(radius * 0.145)}px "Noto Nastaliq Urdu", sans-serif`;
  ctx.fillText(variant === 'VERIFIED' ? 'تصدیق شدہ' : 'منظور شدہ', cx, cy + radius * 0.2);

  if (serialNumber) {
    ctx.fillStyle = '#CBD5E1';
    ctx.font = `800 ${Math.round(radius * 0.115)}px monospace`;
    ctx.fillText(serialNumber.slice(0, 16), cx, cy + radius * 0.42);
  }

  ctx.restore();
}
