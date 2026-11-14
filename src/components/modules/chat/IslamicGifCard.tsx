import React from 'react';

export interface IslamicGifPreset {
  id: string;
  arabic: string;
  title: string;
  urdu: string;
  gradient: string;
  accentColor: string;
  badge: string;
}

export const ISLAMIC_GIFS: IslamicGifPreset[] = [
  {
    id: 'assalamu_alaikum',
    arabic: 'السَّلَامُ عَلَيْكُمْ',
    title: 'Assalamu Alaikum',
    urdu: 'السلام علیکم ورحمۃ اللہ',
    gradient: 'from-[#043927] via-[#065239] to-[#0D1E19]',
    accentColor: '#F5D061',
    badge: '☪️ Peace & Blessings'
  },
  {
    id: 'jummah_mubarak',
    arabic: 'جُمُعَة مُبَارَكَة',
    title: 'Jummah Mubarak',
    urdu: 'جمعہ مبارک',
    gradient: 'from-[#0B1933] via-[#13294B] to-[#0A101E]',
    accentColor: '#F5D061',
    badge: '🕌 Blessed Friday'
  },
  {
    id: 'subhanallah',
    arabic: 'سُبْحَانَ اللّٰهِ',
    title: 'SubhanAllah',
    urdu: 'سبحان اللہ',
    gradient: 'from-[#062E2A] via-[#0A4A43] to-[#081A18]',
    accentColor: '#6EE7B7',
    badge: '✨ Glory Be To Allah'
  },
  {
    id: 'alhamdulillah',
    arabic: 'اَلْحَمْدُ لِلّٰهِ',
    title: 'Alhamdulillah',
    urdu: 'الحمد للہ رب العالمین',
    gradient: 'from-[#1F1706] via-[#3A2B0C] to-[#120E05]',
    accentColor: '#F5D061',
    badge: '🤲 Gratitude'
  },
  {
    id: 'allahu_akbar',
    arabic: 'اللّٰهُ أَكْبَرُ',
    title: 'Allahu Akbar',
    urdu: 'اللہ سب سے بڑا ہے',
    gradient: 'from-[#160F29] via-[#281A4B] to-[#0E0A19]',
    accentColor: '#FDE68A',
    badge: '🌟 Magnificence'
  },
  {
    id: 'mashaallah',
    arabic: 'مَا شَاءَ اللّٰهُ',
    title: 'MashaAllah',
    urdu: 'ماشاءاللہ تبارک اللہ',
    gradient: 'from-[#052E1D] via-[#094C31] to-[#071A11]',
    accentColor: '#F5D061',
    badge: '💎 Allah Has Willed It'
  },
  {
    id: 'jazakallah_khair',
    arabic: 'جَزَاكَ اللّٰهُ خَيْرًا',
    title: 'JazakAllah Khair',
    urdu: 'جزاک اللہ خیرا',
    gradient: 'from-[#0E1E2E] via-[#18334D] to-[#0A131C]',
    accentColor: '#7DD3FC',
    badge: '🌿 May Allah Reward You'
  },
  {
    id: 'dua_mubarak',
    arabic: 'رَبَّنَا تَقَبَّلْ مِنَّا',
    title: 'Dua Mubarak',
    urdu: 'اے اللہ ہماری دعائیں قبول فرما',
    gradient: 'from-[#240F1A] via-[#3D182C] to-[#140A10]',
    accentColor: '#F5D061',
    badge: '🤲 Ameen Ya Rabb'
  }
];

interface IslamicGifCardProps {
  gifId: string;
  compact?: boolean;
}

export const IslamicGifCard: React.FC<IslamicGifCardProps> = ({ gifId, compact = false }) => {
  const preset = ISLAMIC_GIFS.find(g => g.id === gifId) || ISLAMIC_GIFS[0];

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-[#D4AF37]/45 bg-gradient-to-br ${preset.gradient} ${
        compact ? 'p-2.5' : 'p-3.5 min-w-[200px] sm:min-w-[240px]'
      } shadow-md select-none`}
    >
      {/* Subtle geometric animated shimmer overlay (transform + opacity only) */}
      <div
        className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-transparent via-[#F5D061]/20 to-transparent kc-animate-shimmer pointer-events-none"
        aria-hidden="true"
      />
      {/* Twinkling star dots */}
      <div
        className="absolute top-2 right-3 w-1.5 h-1.5 rounded-full bg-[#F5D061] kc-scenic-twinkle pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-2 left-3 w-1 h-1 rounded-full bg-[#F5D061]/80 kc-scenic-twinkle pointer-events-none"
        style={{ animationDelay: '1.1s' }}
        aria-hidden="true"
      />

      <div className="relative z-10 text-center space-y-1">
        <span
          className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/35 border border-[#D4AF37]/30"
          style={{ color: preset.accentColor }}
        >
          {preset.badge}
        </span>

        <div
          dir="rtl"
          className={`${compact ? 'text-base' : 'text-xl sm:text-2xl'} font-extrabold leading-relaxed tracking-normal`}
          style={{ color: preset.accentColor }}
        >
          {preset.arabic}
        </div>

        <div className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold text-white`}>
          {preset.title}
        </div>

        {!compact && (
          <div dir="rtl" className="text-[11px] text-slate-200/90 font-urdu-auto">
            {preset.urdu}
          </div>
        )}
      </div>
    </div>
  );
};
