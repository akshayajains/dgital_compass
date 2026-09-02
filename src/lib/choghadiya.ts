export interface ChoghadiyaSlot {
  name: string;
  nameHi: string;
  type: 'good' | 'neutral' | 'avoid';
  startTime: string;
  endTime: string;
  startMinutes: number;
  endMinutes: number;
  effect: string;
  effectHi: string;
  color: string;
}

export interface ChoghadiyaDayData {
  dayName: string;
  dateStr: string;
  currentSlot: ChoghadiyaSlot;
  nextGoodSlot: ChoghadiyaSlot | null;
  goodCount: number;
  avoidCount: number;
  totalSlots: number;
  daySlots: ChoghadiyaSlot[];
  nightSlots: ChoghadiyaSlot[];
}

const CHOGHADIYA_ORDER = ['udveg', 'chal', 'labh', 'amrit', 'kaal', 'shubh', 'rog'];

const CHOGHADIYA_INFO: Record<string, { name: string; nameHi: string; type: 'good' | 'neutral' | 'avoid'; effect: string; effectHi: string; color: string }> = {
  amrit: {
    name: 'Amrit',
    nameHi: 'अमृत',
    type: 'good',
    effect: 'All auspicious work, spiritual peace, prosperity',
    effectHi: 'सर्व कार्य सिद्धि, शांति एवं समृद्धि',
    color: 'text-emerald-400'
  },
  shubh: {
    name: 'Shubh',
    nameHi: 'शुभ',
    type: 'good',
    effect: 'New beginnings, ceremonies, investments',
    effectHi: 'नवीन कार्य आरंभ, मांगलिक कार्य, निवेश',
    color: 'text-emerald-400'
  },
  labh: {
    name: 'Labh',
    nameHi: 'लाभ',
    type: 'good',
    effect: 'Business profits, commerce, financial gains',
    effectHi: 'व्यापारिक लाभ, धन वृद्धि, क्रय-विक्रय',
    color: 'text-emerald-400'
  },
  chal: {
    name: 'Char',
    nameHi: 'चल',
    type: 'neutral',
    effect: 'Travel, movement, vehicles, shifting',
    effectHi: 'यात्रा, गतिशीलता, वाहन, स्थानांतरण',
    color: 'text-sky-400'
  },
  udveg: {
    name: 'Udveg',
    nameHi: 'उद्वेग',
    type: 'avoid',
    effect: 'Avoid new work, government disputes, stress',
    effectHi: 'मानसिक तनाव, सरकारी बाधा, कार्य टालें',
    color: 'text-rose-400'
  },
  rog: {
    name: 'Rog',
    nameHi: 'रोग',
    type: 'avoid',
    effect: 'Health risks, quarrels, loss of energy',
    effectHi: 'स्वास्थ्य हानि, विवाद, शारीरिक कष्ट',
    color: 'text-rose-400'
  },
  kaal: {
    name: 'Kaal',
    nameHi: 'काल',
    type: 'avoid',
    effect: 'Accident hazard, grave losses, inauspicious',
    effectHi: 'दुर्घटना भय, आर्थिक हानि, पूर्ण वर्जित',
    color: 'text-rose-400'
  }
};

// Starting choghadiya indices in CHOGHADIYA_ORDER (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
const DAY_STARTS = [0, 3, 6, 2, 5, 1, 4];   // Sun: Udveg, Mon: Amrit, Tue: Rog, Wed: Labh, Thu: Shubh, Fri: Chal, Sat: Kaal
const NIGHT_STARTS = [5, 1, 4, 0, 3, 6, 2]; // Sun: Shubh, Mon: Chal, Tue: Kaal, Wed: Udveg, Thu: Amrit, Fri: Rog, Sat: Labh

export function getChoghadiyaData(now: Date = new Date(), sunriseHour: number = 6.35, sunsetHour: number = 18.83): ChoghadiyaDayData {
  const dayOfWeek = now.getDay();
  const dayName = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][dayOfWeek];
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const sunriseMin = Math.round(sunriseHour * 60);
  const sunsetMin = Math.round(sunsetHour * 60);
  const nextSunriseMin = sunriseMin + 24 * 60;

  const dayDurationMin = sunsetMin - sunriseMin;
  const nightDurationMin = nextSunriseMin - sunsetMin;

  const daySlotDuration = dayDurationMin / 8;
  const nightSlotDuration = nightDurationMin / 8;

  const formatMin = (totalMin: number) => {
    const normMin = ((totalMin % (24 * 60)) + (24 * 60)) % (24 * 60);
    const h = Math.floor(normMin / 60);
    const m = Math.floor(normMin % 60);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  // Build 8 day slots
  const dayStartIndex = DAY_STARTS[dayOfWeek];
  const daySlots: ChoghadiyaSlot[] = [];
  for (let i = 0; i < 8; i++) {
    const key = CHOGHADIYA_ORDER[(dayStartIndex + i) % 7];
    const info = CHOGHADIYA_INFO[key];
    const sMin = Math.round(sunriseMin + i * daySlotDuration);
    const eMin = Math.round(sunriseMin + (i + 1) * daySlotDuration);
    daySlots.push({
      name: info.name,
      nameHi: info.nameHi,
      type: info.type,
      startTime: formatMin(sMin),
      endTime: formatMin(eMin),
      startMinutes: sMin,
      endMinutes: eMin,
      effect: info.effect,
      effectHi: info.effectHi,
      color: info.color
    });
  }

  // Build 8 night slots
  const nightStartIndex = NIGHT_STARTS[dayOfWeek];
  const nightSlots: ChoghadiyaSlot[] = [];
  for (let i = 0; i < 8; i++) {
    const key = CHOGHADIYA_ORDER[(nightStartIndex + i) % 7];
    const info = CHOGHADIYA_INFO[key];
    const sMin = Math.round(sunsetMin + i * nightSlotDuration);
    const eMin = Math.round(sunsetMin + (i + 1) * nightSlotDuration);
    nightSlots.push({
      name: info.name,
      nameHi: info.nameHi,
      type: info.type,
      startTime: formatMin(sMin),
      endTime: formatMin(eMin),
      startMinutes: sMin,
      endMinutes: eMin,
      effect: info.effect,
      effectHi: info.effectHi,
      color: info.color
    });
  }

  // Find active slot
  let allSlots = [...daySlots, ...nightSlots];
  let currentSlot = daySlots[0];
  for (const s of allSlots) {
    if (currentMinutes >= (s.startMinutes % (24 * 60)) && currentMinutes < (s.endMinutes % (24 * 60))) {
      currentSlot = s;
      break;
    }
  }

  // If time past midnight
  if (!currentSlot) {
    currentSlot = nightSlots[nightSlots.length - 1];
  }

  // Find next good slot
  const nextGoodSlot = allSlots.find(s => s.type === 'good' && s.startMinutes > currentMinutes) || daySlots.find(s => s.type === 'good') || null;

  const goodCount = allSlots.filter(s => s.type === 'good').length;
  const avoidCount = allSlots.filter(s => s.type === 'avoid').length;

  return {
    dayName,
    dateStr,
    currentSlot,
    nextGoodSlot,
    goodCount,
    avoidCount,
    totalSlots: allSlots.length,
    daySlots,
    nightSlots
  };
}

export interface RashiInfo {
  id: string;
  nameHi: string;
  nameEn: string;
  symbol: string;
  direction: string;
  directionHi: string;
  degSpan: string;
  element: string;
  rulingPlanet: string;
  auspiciousTip: string;
}

export const VEDIC_RASHIS: RashiInfo[] = [
  { id: 'aries', nameHi: 'मेष (Aries)', nameEn: 'Aries', symbol: '♈', direction: 'East', directionHi: 'पूर्व', degSpan: '78°-102°', element: 'Fire (अग्नि)', rulingPlanet: 'Mars (मंगल)', auspiciousTip: 'Face East for high energy, courageous leadership, and victory in disputes.' },
  { id: 'taurus', nameHi: 'वृषभ (Taurus)', nameEn: 'Taurus', symbol: '♉', direction: 'South', directionHi: 'दक्षिण', degSpan: '168°-192°', element: 'Earth (पृथ्वी)', rulingPlanet: 'Venus (शुक्र)', auspiciousTip: 'Align with South for grounded financial savings, luxury, and artistic pursuits.' },
  { id: 'gemini', nameHi: 'मिथुन (Gemini)', nameEn: 'Gemini', symbol: '♊', direction: 'West', directionHi: 'पश्चिम', degSpan: '258°-282°', element: 'Air (वायु)', rulingPlanet: 'Mercury (बुध)', auspiciousTip: 'Face West for sharp intellect, communication, commercial profits, and study.' },
  { id: 'cancer', nameHi: 'कर्क (Cancer)', nameEn: 'Cancer', symbol: '♋', direction: 'North', directionHi: 'उत्तर', degSpan: '348°-12°', element: 'Water (जल)', rulingPlanet: 'Moon (चंद्र)', auspiciousTip: 'Face North for inner emotional peace, intuition, domestic bliss, and fluid wealth.' },
  { id: 'leo', nameHi: 'सिंह (Leo)', nameEn: 'Leo', symbol: '♌', direction: 'East', directionHi: 'पूर्व', degSpan: '78°-102°', element: 'Fire (अग्नि)', rulingPlanet: 'Sun (सूर्य)', auspiciousTip: 'Face East to invoke the supreme authority of Surya, fame, and executive respect.' },
  { id: 'virgo', nameHi: 'कन्या (Virgo)', nameEn: 'Virgo', symbol: '♍', direction: 'South', directionHi: 'दक्षिण', degSpan: '168°-192°', element: 'Earth (पृथ्वी)', rulingPlanet: 'Mercury (बुध)', auspiciousTip: 'Face South for meticulous analysis, accounting precision, and health mastery.' },
  { id: 'libra', nameHi: 'तुला (Libra)', nameEn: 'Libra', symbol: '♎', direction: 'West', directionHi: 'पश्चिम', degSpan: '258°-282°', element: 'Air (वायु)', rulingPlanet: 'Venus (शुक्र)', auspiciousTip: 'Face West for harmonious marital relationships, diplomacy, and business contracts.' },
  { id: 'scorpio', nameHi: 'वृश्चिक (Scorpio)', nameEn: 'Scorpio', symbol: '♏', direction: 'North', directionHi: 'उत्तर', degSpan: '348°-12°', element: 'Water (जल)', rulingPlanet: 'Mars (मंगल)', auspiciousTip: 'Face North for deep occult focus, spiritual transformation, and debt clearance.' },
  { id: 'sagittarius', nameHi: 'धनु (Sagittarius)', nameEn: 'Sagittarius', symbol: '♐', direction: 'East', directionHi: 'पूर्व', degSpan: '78°-102°', element: 'Fire (अग्नि)', rulingPlanet: 'Jupiter (गुरु)', auspiciousTip: 'Face East or North-East for higher spiritual wisdom, guru blessings, and academic luck.' },
  { id: 'capricorn', nameHi: 'मकर (Capricorn)', nameEn: 'Capricorn', symbol: '♑', direction: 'South', directionHi: 'दक्षिण', degSpan: '168°-192°', element: 'Earth (पृथ्वी)', rulingPlanet: 'Saturn (शनि)', auspiciousTip: 'Face South or South-West for disciplined long-term empire building and career stability.' },
  { id: 'aquarius', nameHi: 'कुंभ (Aquarius)', nameEn: 'Aquarius', symbol: '♒', direction: 'West', directionHi: 'पश्चिम', degSpan: '258°-282°', element: 'Air (वायु)', rulingPlanet: 'Saturn (शनि)', auspiciousTip: 'Face West for breakthrough innovation, social networking gains, and technology mastery.' },
  { id: 'pisces', nameHi: 'मीन (Pisces)', nameEn: 'Pisces', symbol: '♓', direction: 'North', directionHi: 'उत्तर', degSpan: '348°-12°', element: 'Water (जल)', rulingPlanet: 'Jupiter (गुरु)', auspiciousTip: 'Face North or North-East for transcendental meditation, charitable grace, and mental calm.' }
];
