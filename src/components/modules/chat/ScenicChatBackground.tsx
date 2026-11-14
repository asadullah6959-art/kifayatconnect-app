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
    label: 'Obsidian & Royal Gold',
    subtitle: 'Signature luxury particles',
    previewGradient: 'from-[#0A0D12] via-[#131A29] to-[#1D1607]',
    emoji: '👑'
  },
  {
    id: 'JUNGLE',
    label: 'Emerald Jungle Canopy',
    subtitle: 'Swaying tropical leaves & fireflies',
    previewGradient: 'from-[#031F16] via-[#053827] to-[#0A251B]',
    emoji: '🌿'
  },
  {
    id: 'SUNSET_DESERT',
    label: 'Golden Desert Sunset',
    subtitle: 'Warm dunes & amber horizon',
    previewGradient: 'from-[#1B0E0A] via-[#3A1B0E] to-[#160F1D]',
    emoji: '🌅'
  },
  {
    id: 'STARRY_OASIS',
    label: 'Starry Desert Oasis',
    subtitle: 'Twinkling night sky & crescent',
    previewGradient: 'from-[#050B18] via-[#0B1933] to-[#062421]',
    emoji: '🌌'
  },
  {
    id: 'NORTHERN_VALLEY',
    label: 'Northern Peaks & Mist',
    subtitle: 'Pakistan Hunza mountain silhouette',
    previewGradient: 'from-[#071521] via-[#0F2A38] to-[#091A22]',
    emoji: '🏔️'
  },
  {
    id: 'MADINAH_NOOR',
    label: 'Madinah Noor Sanctuary',
    subtitle: 'Emerald dome & golden lanterns',
    previewGradient: 'from-[#031A13] via-[#062D21] to-[#141106]',
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
          className="w-full h-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0D12]/75 via-[#0A0D12]/60 to-[#0A0D12]/85" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
      {themeId === 'JUNGLE' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#031B13] via-[#052D20] to-[#071A13]" />
          <svg
            viewBox="0 0 400 220"
            preserveAspectRatio="none"
            className="absolute -top-2 -left-4 w-56 h-32 opacity-35 kc-scenic-sway"
          >
            <path
              d="M0,0 C60,15 120,45 165,95 C110,75 65,58 15,75 C45,95 95,120 120,165 C75,140 35,125 0,130 Z"
              fill="#10B981"
            />
            <path
              d="M25,0 C95,10 165,35 215,70 C155,55 110,45 65,60 Z"
              fill="#047857"
            />
          </svg>
          <svg
            viewBox="0 0 400 220"
            preserveAspectRatio="none"
            className="absolute -top-2 -right-4 w-56 h-32 opacity-30 kc-scenic-sway"
            style={{ animationDelay: '1.8s' }}
          >
            <path
              d="M400,0 C340,15 280,45 235,95 C290,75 335,58 385,75 C355,95 305,120 280,165 C325,140 365,125 400,130 Z"
              fill="#34D399"
            />
          </svg>
          <div className="absolute bottom-24 left-[18%] w-2 h-2 rounded-full bg-[#F5D061] kc-scenic-twinkle" />
          <div className="absolute top-28 right-[22%] w-1.5 h-1.5 rounded-full bg-emerald-300 kc-scenic-twinkle" style={{ animationDelay: '1.1s' }} />
          <div className="absolute bottom-36 right-[35%] w-2 h-2 rounded-full bg-[#F5D061] kc-scenic-twinkle" style={{ animationDelay: '2.2s' }} />
        </>
      )}

      {themeId === 'SUNSET_DESERT' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#170C1A] via-[#3B1810] to-[#120D0A]" />
          <div className="absolute top-8 right-12 w-28 h-28 rounded-full bg-gradient-to-br from-[#F5D061]/30 to-[#EA580C]/10 kc-scenic-drift" />
          <svg
            viewBox="0 0 800 240"
            preserveAspectRatio="none"
            className="absolute bottom-0 inset-x-0 w-full h-40 opacity-50"
          >
            <path d="M0,160 Q180,85 390,145 T800,120 L800,240 L0,240 Z" fill="#451A03" />
            <path d="M0,195 Q240,135 510,185 T800,170 L800,240 L0,240 Z" fill="#1C0F08" />
          </svg>
        </>
      )}

      {themeId === 'STARRY_OASIS' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#040915] via-[#0B1933] to-[#051B19]" />
          <svg viewBox="0 0 120 120" className="absolute top-6 right-8 w-16 h-16 opacity-60 kc-scenic-drift">
            <path
              d="M72 18A38 38 0 1 0 104 82A30 30 0 1 1 72 18Z"
              fill="#F5D061"
            />
          </svg>
          {[
            { top: '12%', left: '16%', delay: '0s', size: 'w-1.5 h-1.5' },
            { top: '24%', left: '42%', delay: '0.8s', size: 'w-1 h-1' },
            { top: '18%', left: '68%', delay: '1.5s', size: 'w-1.5 h-1.5' },
            { top: '38%', left: '25%', delay: '2.1s', size: 'w-1 h-1' },
            { top: '45%', left: '78%', delay: '0.5s', size: 'w-1.5 h-1.5' },
            { top: '62%', left: '14%', delay: '1.2s', size: 'w-1 h-1' },
          ].map((star, idx) => (
            <div
              key={idx}
              style={{ top: star.top, left: star.left, animationDelay: star.delay }}
              className={`absolute ${star.size} rounded-full bg-[#F5D061] kc-scenic-twinkle`}
            />
          ))}
          <svg viewBox="0 0 800 180" preserveAspectRatio="none" className="absolute bottom-0 inset-x-0 w-full h-28 opacity-40">
            <path d="M0,120 Q250,70 480,115 T800,95 L800,180 L0,180 Z" fill="#062925" />
          </svg>
        </>
      )}

      {themeId === 'NORTHERN_VALLEY' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#06131E] via-[#0E2635] to-[#08151D]" />
          <svg viewBox="0 0 800 260" preserveAspectRatio="none" className="absolute bottom-0 inset-x-0 w-full h-44 opacity-55">
            <polygon points="0,260 120,90 250,210 390,60 540,200 680,85 800,200 800,260" fill="#0B1F2A" />
            <polygon points="390,60 352,106 382,98 402,112 426,102" fill="#E2E8F0" opacity="0.25" />
            <polygon points="120,90 92,130 116,124 134,134 150,126" fill="#E2E8F0" opacity="0.2" />
            <path d="M0,225 Q260,185 520,220 T800,205 L800,260 L0,260 Z" fill="#051319" />
          </svg>
          <div className="absolute top-12 left-10 w-32 h-10 rounded-full bg-cyan-200/5 kc-scenic-drift" />
          <div className="absolute top-24 right-14 w-36 h-12 rounded-full bg-emerald-200/5 kc-scenic-drift" style={{ animationDelay: '2.5s' }} />
        </>
      )}

      {themeId === 'MADINAH_NOOR' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#031711] via-[#062C20] to-[#0E0E08]" />
          <svg viewBox="0 0 800 240" preserveAspectRatio="none" className="absolute bottom-0 inset-x-0 w-full h-36 opacity-35">
            <path
              d="M270,240 L270,175 Q400,60 530,175 L530,240 Z"
              fill="#047857"
            />
            <rect x="190" y="105" width="22" height="135" fill="#064E3B" />
            <polygon points="201,75 188,105 214,105" fill="#D4AF37" />
            <rect x="588" y="105" width="22" height="135" fill="#064E3B" />
            <polygon points="599,75 586,105 612,105" fill="#D4AF37" />
          </svg>
          <div className="absolute top-10 left-[22%] w-2 h-2 rounded-full bg-[#F5D061] kc-scenic-twinkle" />
          <div className="absolute top-16 right-[24%] w-2 h-2 rounded-full bg-[#F5D061] kc-scenic-twinkle" style={{ animationDelay: '1.4s' }} />
        </>
      )}

      {(themeId === 'OBSIDIAN_GOLD' || (themeId === 'CUSTOM' && (!customBgUrl || imgError))) && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#080B10] via-[#0F1522] to-[#0A0D12]" />
          <div className="absolute top-10 right-10 w-36 h-36 rounded-full bg-[#D4AF37]/8 kc-scenic-drift" />
          <div className="absolute bottom-14 left-8 w-28 h-28 rounded-full bg-[#043927]/25 kc-scenic-drift" style={{ animationDelay: '2.1s' }} />
          <div className="absolute top-20 left-[20%] w-1.5 h-1.5 rounded-full bg-[#F5D061]/70 kc-scenic-twinkle" />
          <div className="absolute top-40 right-[30%] w-1 h-1 rounded-full bg-[#F5D061]/60 kc-scenic-twinkle" style={{ animationDelay: '1.3s' }} />
        </>
      )}

      {/* Subtle readability gradient overlay */}
      <div className="absolute inset-0 bg-[#0A0D12]/35" />
    </div>
  );
};
