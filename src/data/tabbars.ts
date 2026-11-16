import type { User } from '../types';

export interface TabbarClan {
  id: string;
  englishName: string;
  urduName: string;
  emblem: string;
  gradientBg: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
  isFlagship?: boolean;
}

export const CUSTOM_TABBAR_ID = 'custom';

export const TABBAR_CLANS: TabbarClan[] = [
  {
    id: 'faiz_khel',
    englishName: 'Faiz Khel',
    urduName: 'فیض خیل',
    emblem: '👑',
    gradientBg: 'linear-gradient(135deg, #022C22 0%, #064E3B 52%, #022C22 100%)',
    borderColor: '#D4AF37',
    textColor: '#FDE047',
    glowColor: 'rgba(212, 175, 55, 0.56)',
    isFlagship: true,
  },
  {
    id: 'swati_khel',
    englishName: 'Swati Khel',
    urduName: 'سواتی خیل',
    emblem: '🛡️',
    gradientBg: 'linear-gradient(135deg, #0F2D5C 0%, #1D4ED8 55%, #1E3A8A 100%)',
    borderColor: '#D4AF37',
    textColor: '#FDE68A',
    glowColor: 'rgba(29, 78, 216, 0.42)',
  },
  {
    id: 'rousa_khel',
    englishName: 'Rousa Khel',
    urduName: 'رؤسا خیل',
    emblem: '👑',
    gradientBg: 'linear-gradient(135deg, #3B0764 0%, #6B21A8 55%, #4C1D95 100%)',
    borderColor: '#E8C65B',
    textColor: '#FEF3C7',
    glowColor: 'rgba(107, 33, 168, 0.42)',
  },
  {
    id: 'malkhan_khel',
    englishName: 'Malkhan Khel',
    urduName: 'ملخان خیل',
    emblem: '⚔️',
    gradientBg: 'linear-gradient(135deg, #4C0519 0%, #9F1239 55%, #881337 100%)',
    borderColor: '#D4AF37',
    textColor: '#FDE68A',
    glowColor: 'rgba(159, 18, 57, 0.42)',
  },
  {
    id: 'surjam_khel',
    englishName: 'Surjam Khel',
    urduName: 'سرجام خیل',
    emblem: '🦁',
    gradientBg: 'linear-gradient(135deg, #451A03 0%, #B45309 55%, #78350F 100%)',
    borderColor: '#F5D061',
    textColor: '#FEF3C7',
    glowColor: 'rgba(180, 83, 9, 0.42)',
  },
  {
    id: 'akhar_khel',
    englishName: 'Akhar Khel',
    urduName: 'اکھار خیل',
    emblem: '💠',
    gradientBg: 'linear-gradient(135deg, #042F2E 0%, #0F766E 55%, #115E59 100%)',
    borderColor: '#D4AF37',
    textColor: '#FDE68A',
    glowColor: 'rgba(15, 118, 110, 0.42)',
  },
  {
    id: 'ulbaik_khel',
    englishName: 'Ulbaik Khel',
    urduName: 'البیک خیل',
    emblem: '✨',
    gradientBg: 'linear-gradient(135deg, #1E1B4B 0%, #3730A3 55%, #312E81 100%)',
    borderColor: '#E5C158',
    textColor: '#FEF3C7',
    glowColor: 'rgba(55, 48, 163, 0.42)',
  },
  {
    id: 'hakidad_khel',
    englishName: 'Hakidad Khel',
    urduName: 'حکیداد خیل',
    emblem: '🌹',
    gradientBg: 'linear-gradient(135deg, #4A0E22 0%, #881337 55%, #5E1029 100%)',
    borderColor: '#F3B6A0',
    textColor: '#FDE8E1',
    glowColor: 'rgba(243, 182, 160, 0.38)',
  },
  {
    id: 'zinwar_khel',
    englishName: 'Zinwar Khel',
    urduName: 'زینور خیل',
    emblem: '🌿',
    gradientBg: 'linear-gradient(135deg, #1A2E05 0%, #3F6212 55%, #365314 100%)',
    borderColor: '#D4AF37',
    textColor: '#FEF3C7',
    glowColor: 'rgba(63, 98, 18, 0.42)',
  },
  {
    id: 'mir_baz_khel',
    englishName: 'Mir Baz Khel',
    urduName: 'میر باز خیل',
    emblem: '🦅',
    gradientBg: 'linear-gradient(135deg, #3B0A16 0%, #701A2B 55%, #4C0D1C 100%)',
    borderColor: '#D4AF37',
    textColor: '#FDE68A',
    glowColor: 'rgba(112, 26, 43, 0.42)',
  },
  {
    id: 'chharo_khel',
    englishName: 'Chharo Khel',
    urduName: 'چھڑو خیل',
    emblem: '🏺',
    gradientBg: 'linear-gradient(135deg, #2C1A0B 0%, #784B1E 55%, #543211 100%)',
    borderColor: '#E5C158',
    textColor: '#FEF3C7',
    glowColor: 'rgba(120, 75, 30, 0.42)',
  },
];

export const CUSTOM_TABBAR_STYLE: TabbarClan = {
  id: CUSTOM_TABBAR_ID,
  englishName: 'Other Tabbar',
  urduName: 'دیگر ٹبر',
  emblem: '🏛️',
  gradientBg: 'linear-gradient(135deg, #111726 0%, #1F2937 55%, #090D16 100%)',
  borderColor: '#D4AF37',
  textColor: '#F5D061',
  glowColor: 'rgba(212, 175, 55, 0.30)',
};

export function getTabbarById(id?: string | null): TabbarClan | undefined {
  if (!id) return undefined;
  const norm = id.trim().toLowerCase();
  return TABBAR_CLANS.find(
    (c) =>
      c.id === norm ||
      c.englishName.toLowerCase() === norm ||
      c.urduName === id.trim()
  );
}

export function resolveUserTabbar(input?: Partial<User> & {
  tabbarId?: string;
  tabbarEnglish?: string;
  tabbarUrdu?: string;
}): {
  id: string;
  englishName: string;
  urduName: string;
  isCustom: boolean;
  clan: TabbarClan;
} | null {
  if (!input) return null;
  const byId = getTabbarById(input.tabbarId);
  if (byId) {
    return {
      id: byId.id,
      englishName: input.tabbarEnglish?.trim() || byId.englishName,
      urduName: input.tabbarUrdu?.trim() || byId.urduName,
      isCustom: false,
      clan: byId,
    };
  }
  const byEng = getTabbarById(input.tabbarEnglish);
  if (byEng) {
    return {
      id: byEng.id,
      englishName: byEng.englishName,
      urduName: input.tabbarUrdu?.trim() || byEng.urduName,
      isCustom: false,
      clan: byEng,
    };
  }
  const byUr = getTabbarById(input.tabbarUrdu);
  if (byUr) {
    return {
      id: byUr.id,
      englishName: input.tabbarEnglish?.trim() || byUr.englishName,
      urduName: byUr.urduName,
      isCustom: false,
      clan: byUr,
    };
  }

  const eng = (input.tabbarEnglish || '').trim();
  const ur = (input.tabbarUrdu || '').trim();
  if (!eng && !ur) return null;

  return {
    id: input.tabbarId === CUSTOM_TABBAR_ID || !input.tabbarId ? CUSTOM_TABBAR_ID : input.tabbarId,
    englishName: eng || ur,
    urduName: ur || transliterateTabbarToUrdu(eng),
    isCustom: true,
    clan: CUSTOM_TABBAR_STYLE,
  };
}

const WORD_REPLACEMENTS: Record<string, string> = {
  khel: 'خیل',
  khail: 'خیل',
  zay: 'زئی',
  zai: 'زئی',
  khan: 'خان',
  malik: 'ملک',
  syed: 'سید',
  shah: 'شاہ',
  mir: 'میر',
  baz: 'باز',
  faiz: 'فیض',
  swati: 'سواتی',
  rousa: 'رؤسا',
  malkhan: 'ملخان',
  surjam: 'سرجام',
  akhar: 'اکھار',
  ulbaik: 'البیک',
  hakidad: 'حکیداد',
  zinwar: 'زینور',
  chharo: 'چھڑو',
  afridi: 'آفریدی',
  yousafzai: 'یوسفزئی',
  yusufzai: 'یوسفزئی',
  khattak: 'خٹک',
  bangash: 'بنگش',
  wazir: 'وزیر',
  mahsud: 'محسود',
  mehsud: 'محسود',
  mohmand: 'مہمند',
  shinwari: 'شنواری',
  marwat: 'مروت',
  niazi: 'نیازی',
  awan: 'اعوان',
  abbasi: 'عباسی',
  qureshi: 'قریشی',
  rajput: 'راجپوت',
  mughal: 'مغل',
  sheikh: 'شیخ',
  baloch: 'بلوچ',
  jutt: 'جٹ',
  jat: 'جٹ',
  arain: 'آرائیں',
  gujjar: 'گجر',
  tanoli: 'تنولی',
  jadon: 'جدون',
  jadoon: 'جدون',
  mashwani: 'مشوانی',
  tareen: 'ترین',
  kakar: 'کاکڑ',
  achakzai: 'اچکزئی',
  durrani: 'درانی',
};

const DIGRAPH_MAP: Array<[string, string]> = [
  ['kh', 'خ'],
  ['gh', 'غ'],
  ['sh', 'ش'],
  ['ch', 'چ'],
  ['th', 'تھ'],
  ['ph', 'ف'],
  ['bh', 'بھ'],
  ['dh', 'دھ'],
  ['jh', 'جھ'],
  ['zh', 'ژ'],
  ['oo', 'و'],
  ['ee', 'ی'],
  ['ai', 'ی'],
  ['au', 'و'],
];

const CHAR_MAP: Record<string, string> = {
  a: 'ا',
  b: 'ب',
  c: 'ک',
  d: 'د',
  e: 'ی',
  f: 'ف',
  g: 'گ',
  h: 'ہ',
  i: 'ی',
  j: 'ج',
  k: 'ک',
  l: 'ل',
  m: 'م',
  n: 'ن',
  o: 'و',
  p: 'پ',
  q: 'ق',
  r: 'ر',
  s: 'س',
  t: 'ت',
  u: 'و',
  v: 'و',
  w: 'و',
  x: 'کس',
  y: 'ی',
  z: 'ز',
};

export function transliterateTabbarToUrdu(input: string): string {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';
  // If already contains Arabic/Urdu script, return directly
  if (/[\u0600-\u06FF]/.test(trimmed)) return trimmed;

  const words = trimmed.split(/\s+/);
  return words
    .map((rawWord) => {
      const clean = rawWord.toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (!clean) return rawWord;
      if (WORD_REPLACEMENTS[clean]) return WORD_REPLACEMENTS[clean];

      let out = '';
      let i = 0;
      while (i < clean.length) {
        const two = clean.slice(i, i + 2);
        const dig = DIGRAPH_MAP.find(([k]) => k === two);
        if (dig) {
          out += dig[1];
          i += 2;
          continue;
        }
        const ch = clean[i];
        if (i > 0 && (ch === 'a' || ch === 'e' || ch === 'i' || ch === 'o' || ch === 'u')) {
          if (i === clean.length - 1) {
            out += ch === 'a' ? 'ا' : ch === 'o' || ch === 'u' ? 'و' : 'ی';
          } else if (ch === 'o' || ch === 'u') {
            out += 'و';
          } else if (ch === 'i' || ch === 'e') {
            out += 'ی';
          }
        } else {
          out += CHAR_MAP[ch] ?? ch;
        }
        i += 1;
      }
      return out || rawWord;
    })
    .join(' ');
}
