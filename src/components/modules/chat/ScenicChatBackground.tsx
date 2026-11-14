import React, { useState } from 'react';
import { CommunityScenicThemeId } from '../../../types';

export interface ScenicThemeOption {
  id: CommunityScenicThemeId;
  label: string;
  subtitle: string;
  previewGradient: string;
  emoji: string;
}

export const SCENIC_THEME_PRESETS: ScenicThemeOption[] = [
  {
    id: 'OBSIDIAN_GOLD',
    label: 'Royal Black & Gold',
    subtitle: 'Signature luxury obsidian & gold glow',
    previewGradient: 'from-[#0A0D12] via-[#172033] to-[#291F09]',
    emoji: '👑'
  },
  {
    id: 'JUNGLE',
    label: 'Live Lush Jungle',
    subtitle: 'Swaying tropical canopy & golden fireflies',
    previewGradient: 'from-[#063B29] via-[#0B5D41] to-[#0E3F2E]',
    emoji: '🌿'
  },
  {
    id: 'SUNSET_DESERT',
    label: 'Golden Sunset Desert',
    subtitle: 'Warm amber sunset & rolling dunes',
    previewGradient: 'from-[#2A1120] via-[#7C2D12] to-[#261409]',
    emoji: '🌅'
  },
  {
    id: 'STARRY_OASIS',
    label: 'Starry Night Oasis',
    subtitle: 'Twinkling night sky, crescent moon & oasis',
    previewGradient: 'from-[#061026] via-[#112A54] to-[#08332E]',
    emoji: '🌌'
  },
  {
    id: 'NORTHERN_VALLEY',
    label: 'Northern Valley',
    subtitle: 'Snow-capped Hunza peaks & alpine mist',
    previewGradient: 'from-[#0A2233] via-[#144058] to-[#0B2936]',
    emoji: '🏔️'
  },
  {
    id: 'MADINAH_NOOR',
    label: 'Madinah Noor',
    subtitle: 'Radiant emerald dome & golden minarets',
    previewGradient: 'from-[#04291E] via-[#074A36] to-[#1D1707]',
    emoji: '🕌'
  }
];

interface ScenicChatBackgroundProps {
  themeId?: CommunityScenicThemeId;
  customBgUrl?: string;
}

export const ScenicChatBackground: React.FC<ScenicChatBackgroundProps> = ({
  themeId = 'OBSIDIAN_GOLD',
  customBgUrl
}) => {
  const [imgError, setImgError] = useState(false);

  if (themeId === 'CUSTOM' && customBgUrl && !imgError) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
        <img
          src={customBgUrl}
          alt=""
          onError={() => setImgError(true)}
          className="w-full h-full object-cover opacity-95"
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
      {themeId === 'JUNGLE' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#063A29] via-[#0B5A3E] to-[#06261B]" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-emerald-400/20" />
          <svg
            viewBox="0 0 400 240"
            preserveAspectRatio="none"
            className="absolute -top-2 -left-4 w-72 h-44 opacity-70 kc-scenic-sway"
          >
            <path
              d="M0,0 C70,18 140,55 190,115 C120,90 72,72 15,92 C52,115 105,145 135,195 C85,168 38,148 0,152 Z"
              fill="#10B981"
            />
            <path
              d="M30,0 C110,12 190,42 250,82 C175,65 125,52 70,70 Z"
              fill="#059669"
            />
          </svg>
          <svg
            viewBox="0 0 400 240"
            preserveAspectRatio="none"
            className="absolute -top-2 -right-4 w-72 h-44 opacity-65 kc-scenic-sway"
            style={{ animationDelay: '1.8s' }}
          >
            <path
              d="M400,0 C330,18 260,55 210,115 C280,90 328,72 385,92 C348,115 295,145 265,195 C315,168 362,148 400,152 Z"
              fill="#34D399"
            />
          </svg>
          <svg
            viewBox="0 0 800 180"
            preserveAspectRatio="none"
            className="absolute bottom-0 inset-x-0 w-full h-36 opacity-55"
          >
            <path d="M0,180 L0,110 Q140,65 280,120 T560,95 T800,115 L800,180 Z" fill="#043927" />
          </svg>
          <div className="absolute bottom-28 left-[16%] w-2.5 h-2.5 rounded-full bg-[#F5D061] kc-scenic-twinkle" />
          <div className="absolute top-32 right-[20%] w-2 h-2 rounded-full bg-emerald-200 kc-scenic-twinkle" style={{ animationDelay: '1.1s' }} />
          <div className="absolute bottom-44 right-[32%] w-2.5 h-2.5 rounded-full bg-[#F5D061] kc-scenic-twinkle" style={{ animationDelay: '2.2s' }} />
          <div className="absolute top-1/2 left-[38%] w-1.5 h-1.5 rounded-full bg-emerald-300 kc-scenic-twinkle" style={{ animationDelay: '0.7s' }} />
        </>
      )}

      {themeId === 'SUNSET_DESERT' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#2A1025] via-[#7C2D12] to-[#24130A]" />
          <div className="absolute top-14 right-12 w-36 h-36 rounded-full bg-gradient-to-br from-[#FDE68A]/70 via-[#F59E0B]/45 to-[#EA580C]/20 kc-scenic-drift" />
          <svg
            viewBox="0 0 800 280"
            preserveAspectRatio="none"
            className="absolute bottom-0 inset-x-0 w-full h-56 opacity-80"
          >
            <path d="M0,170 Q180,75 400,150 T800,120 L800,280 L0,280 Z" fill="#9A3412" />
            <path d="M0,210 Q240,145 510,195 T800,180 L800,280 L0,280 Z" fill="#431407" />
          </svg>
        </>
      )}

      {themeId === 'STARRY_OASIS' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#061028] via-[#122D59] to-[#082E29]" />
          <svg viewBox="0 0 120 120" className="absolute top-10 right-10 w-20 h-20 opacity-85 kc-scenic-drift">
            <path
              d="M72 18A38 38 0 1 0 104 82A30 30 0 1 1 72 18Z"
              fill="#F5D061"
            />
          </svg>
          {[
            { top: '12%', left: '16%', delay: '0s', size: 'w-2 h-2' },
            { top: '24%', left: '42%', delay: '0.8s', size: 'w-1.5 h-1.5' },
            { top: '18%', left: '68%', delay: '1.5s', size: 'w-2 h-2' },
            { top: '38%', left: '25%', delay: '2.1s', size: 'w-1.5 h-1.5' },
            { top: '45%', left: '78%', delay: '0.5s', size: 'w-2 h-2' },
            { top: '62%', left: '14%', delay: '1.2s', size: 'w-1.5 h-1.5' },
            { top: '54%', left: '52%', delay: '1.9s', size: 'w-1.5 h-1.5' }
          ].map((star, idx) => (
            <div
              key={idx}
              style={{ top: star.top, left: star.left, animationDelay: star.delay }}
              className={`absolute ${star.size} rounded-full bg-[#FDE68A] kc-scenic-twinkle`}
            />
          ))}
          <svg viewBox="0 0 800 200" preserveAspectRatio="none" className="absolute bottom-0 inset-x-0 w-full h-40 opacity-75">
            <path d="M0,130 Q250,65 480,120 T800,95 L800,200 L0,200 Z" fill="#0B4F46" />
          </svg>
        </>
      )}

      {themeId === 'NORTHERN_VALLEY' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A2236] via-[#16445E] to-[#0A202B]" />
          <svg viewBox="0 0 800 300" preserveAspectRatio="none" className="absolute bottom-0 inset-x-0 w-full h-60 opacity-85">
            <polygon points="0,300 130,90 265,220 400,55 555,205 690,85 800,205 800,300" fill="#13384C" />
            <polygon points="400,55 352,115 388,104 412,120 444,106" fill="#E2E8F0" opacity="0.55" />
            <polygon points="130,90 95,140 124,132 142,145 164,135" fill="#E2E8F0" opacity="0.45" />
            <polygon points="690,85 656,135 684,128 704,138 725,126" fill="#E2E8F0" opacity="0.4" />
            <path d="M0,245 Q260,195 520,240 T800,220 L800,300 L0,300 Z" fill="#08242E" />
          </svg>
          <div className="absolute top-16 left-10 w-44 h-12 rounded-full bg-cyan-200/15 kc-scenic-drift" />
          <div className="absolute top-28 right-12 w-48 h-14 rounded-full bg-emerald-200/15 kc-scenic-drift" style={{ animationDelay: '2.5s' }} />
        </>
      )}

      {themeId === 'MADINAH_NOOR' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#04281C] via-[#084A35] to-[#171308]" />
          <svg viewBox="0 0 800 260" preserveAspectRatio="none" className="absolute bottom-0 inset-x-0 w-full h-52 opacity-75">
            <path
              d="M250,260 L250,175 Q400,45 550,175 L550,260 Z"
              fill="#059669"
            />
            <rect x="175" y="95" width="26" height="165" fill="#065F46" />
            <polygon points="188,60 172,95 204,95" fill="#F5D061" />
            <rect x="599" y="95" width="26" height="165" fill="#065F46" />
            <polygon points="612,60 596,95 628,95" fill="#F5D061" />
          </svg>
          <div className="absolute top-14 left-[22%] w-2.5 h-2.5 rounded-full bg-[#F5D061] kc-scenic-twinkle" />
          <div className="absolute top-20 right-[24%] w-2.5 h-2.5 rounded-full bg-[#F5D061] kc-scenic-twinkle" style={{ animationDelay: '1.4s' }} />
          <div className="absolute top-1/3 left-[50%] w-2 h-2 rounded-full bg-[#FDE68A] kc-scenic-twinkle" style={{ animationDelay: '0.8s' }} />
        </>
      )}

      {(themeId === 'OBSIDIAN_GOLD' || (themeId === 'CUSTOM' && (!customBgUrl || imgError))) && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#090D14] via-[#131C2E] to-[#1C1608]" />
          <div className="absolute top-12 right-10 w-44 h-44 rounded-full bg-[#D4AF37]/20 kc-scenic-drift" />
          <div className="absolute bottom-16 left-8 w-36 h-36 rounded-full bg-[#059669]/25 kc-scenic-drift" style={{ animationDelay: '2.1s' }} />
          <div className="absolute top-24 left-[20%] w-2 h-2 rounded-full bg-[#F5D061] kc-scenic-twinkle" />
          <div className="absolute top-44 right-[30%] w-1.5 h-1.5 rounded-full bg-[#F5D061] kc-scenic-twinkle" style={{ animationDelay: '1.3s' }} />
          <div className="absolute bottom-32 right-[18%] w-2 h-2 rounded-full bg-[#FDE68A] kc-scenic-twinkle" style={{ animationDelay: '2.2s' }} />
        </>
      )}

      {/* Subtle readability tint preserving crisp text contrast */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }} />
    </div>
  );
};
