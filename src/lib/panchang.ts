/**
 * Panchang, Rahu-Kal, Yamaganda, and Abhijit Muhurta calculations
 *
 * Uses simplified Vedic astronomy approximations suitable for mobile apps.
 * For production-grade accuracy, consider integrating a full Jyotish library.
 */

export interface PanchangData {
  tithi: string;
  tithiHi: string;
  nakshatra: string;
  nakshatraHi: string;
  yoga: string;
  yogaHi: string;
  karana: string;
  karanaHi: string;
  vara: string;
  varaHi: string;
  paksha: string; // Shukla (waxing) or Krishna (waning)
  rahuKalStart: string; // "HH:MM"
  rahuKalEnd: string;
  yamagandaStart: string;
  yamagandaEnd: string;
  abhijitStart: string;
  abhijitEnd: string;
}

// Tithi names (English/Hindi)
const TITHIS_EN = [
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima/Amavasya'
];
const TITHIS_HI = [
  'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी',
  'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पौर्णमासी/अमावस्या'
];

// Nakshatras (27 lunar mansions)
const NAKSHATRAS_EN = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];
const NAKSHATRAS_HI = [
  'अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा',
  'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा', 'पूर्व फाल्गुनी', 'उत्तर फाल्गुनी',
  'हस्त', 'चित्रा', 'स्वाती', 'विशाखा', 'अनुराधा', 'ज्येष्ठा',
  'मूला', 'पूर्वाषाढा', 'उत्तराषाढा', 'श्रवण', 'धनिष्ठा', 'शतभिषा',
  'पूर्व भाद्रपदा', 'उत्तर भाद्रपदा', 'रेवती'
];

// Yogas (27)
const YOGAS_EN = [
  'Shubha', 'Kratu', 'Vighata', 'Siddhi', 'Vyatipata', 'Harigana',
  'Vajra', 'Siddha', 'Rudra', 'Kara', 'Naga', 'Simha',
  'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Shrinkhala', 'Mandala',
  'Parijata', 'Priti', 'Ayushman', 'Sobhana', 'Atiganda', 'Sukarma',
  'Dhata', 'Shoola', 'Ghata'
];
const YOGAS_HI = [
  'शुभ', 'क्रतु', 'विघट', 'सिद्धि', 'व्यातिपात', 'हरिगण',
  'वज्र', 'सिद्ध', 'रुद्र', 'कर', 'नाग', 'सिंह',
  'गंद', 'वृद्धि', 'ध्रुव', 'व्याघाट', 'शृंखला', 'मंडल',
  'परिजात', 'प्रीति', 'आयुष्मान', 'सोभन', 'अतिगंद', 'सुकर्म',
  'धात', 'शूल', 'घाट'
];

// Karanas (15, first 8 repeat)
const KARANAS_EN = [
  'Taitila', 'Paatiya', 'Kaulava', 'Taitula', 'Gara', 'Vanija', 'Vishti', 'Shakuni',
  'Chatushpada', 'Naga', 'Kimstughna', 'Naga', 'Kimstughna', 'Naga', 'Kimstughna'
];
const KARANAS_HI = [
  'तैतिल', 'पाटिया', 'कौलव', 'तैतूल', 'गर', 'वणिज', 'विष्टि', 'शकुनि',
  'चतुष्पद', 'नाग', 'किंस्तugh्न', 'नाग', 'किंस्तugh्न', 'नाग', 'किंस्तugh्न'
];

// Varas (days of week)
const VARAS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const VARAS_HI = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

/**
 * Calculate the moon's approximate elongation (0-360°) from the sun.
 * This determines the tithi.
 */
function getMoonElongation(date: Date): number {
  // Simplified lunar phase calculation
  // Uses a known new moon epoch and the synodic month period
  const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14, 0)); // Jan 6, 2000
  const synodicMonth = 29.53058867; // days
  const diffDays = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  const phase = ((diffDays % synodicMonth) + synodicMonth) % synodicMonth;
  return (phase / synodicMonth) * 360;
}

/**
 * Calculate the moon's approximate longitude (0-360°).
 */
function getMoonLongitude(date: Date): number {
  // Simplified: moon moves ~13.176°/day relative to fixed stars
  const knownEpoch = new Date(Date.UTC(2000, 0, 1, 12, 0, 0)); // J2000.0
  const diffDays = (date.getTime() - knownEpoch.getTime()) / (1000 * 60 * 60 * 24);
  const moonLon = (218.316 + 13.176396 * diffDays) % 360;
  return ((moonLon % 360) + 360) % 360;
}

/**
 * Calculate the sun's approximate longitude (0-360°).
 */
function getSunLongitude(date: Date): number {
  const knownEpoch = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
  const diffDays = (date.getTime() - knownEpoch.getTime()) / (1000 * 60 * 60 * 24);
  const sunLon = (280.460 + 0.9856474 * diffDays) % 360;
  return ((sunLon % 360) + 360) % 360;
}

/**
 * Calculate Panchang for a given date and timezone offset.
 */
export function calculatePanchang(date: Date, timezoneOffsetMinutes: number = 0): PanchangData {
  // Adjust for timezone
  const utcDate = new Date(date.getTime() + timezoneOffsetMinutes * 60000);

  const moonLon = getMoonLongitude(utcDate);
  const sunLon = getSunLongitude(utcDate);
  const moonElongation = getMoonElongation(utcDate);

  // Tithi: based on moon-sun elongation (360°/30 = 12° per tithi)
  const tithiIndex = Math.floor(moonElongation / 12) % 10;
  const paksha = moonElongation < 180 ? 'Shukla Paksha (Waxing)' : 'Krishna Paksha (Waning)';

  // Nakshatra: based on moon longitude (360°/27 = 13.33° per nakshatra)
  const nakshatraIndex = Math.floor(moonLon / (360 / 27)) % 27;

  // Yoga: based on sun + moon longitude sum (360°/27)
  const yogaSum = ((sunLon + moonLon) % 360);
  const yogaIndex = Math.floor(yogaSum / (360 / 27)) % 27;

  // Karana: based on moon elongation (360°/15 = 24° per karana, but first 8 repeat)
  const karanaDeg = moonElongation * 2; // Each karana is ~10.93° of elongation
  const karanaIndex = Math.floor(karanaDeg / 24) % 15;

  // Vara: day of week
  const varaIndex = utcDate.getDay();

  // Rahu-Kal: inauspicious 48-minute window, varies by day
  const rahuKalSlot = getRahuKalSlot(varaIndex);
  const sunrise = getApproxSunrise(utcDate);
  const sunset = getApproxSunset(utcDate);
  const { start: rahuKalStart, end: rahuKalEnd } = getTimeSlot(sunrise, sunset, rahuKalSlot, 8);

  // Yamaganda: another inauspicious window
  const yamagandaSlot = getYamagandaSlot(varaIndex);
  const { start: yamagandaStart, end: yamagandaEnd } = getTimeSlot(sunrise, sunset, yamagandaSlot, 8);

  // Abhijit Muhurta: auspicious midday ~48-minute window
  const abhijitMid = (sunrise.getTime() + sunset.getTime()) / 2;
  const abhijitMinutes = 48;
  const abhijitStart = new Date(abhijitMid - (abhijitMinutes / 2) * 60000);
  const abhijitEnd = new Date(abhijitMid + (abhijitMinutes / 2) * 60000);

  return {
    tithi: TITHIS_EN[tithiIndex],
    tithiHi: TITHIS_HI[tithiIndex],
    nakshatra: NAKSHATRAS_EN[nakshatraIndex],
    nakshatraHi: NAKSHATRAS_HI[nakshatraIndex],
    yoga: YOGAS_EN[yogaIndex],
    yogaHi: YOGAS_HI[yogaIndex],
    karana: KARANAS_EN[karanaIndex],
    karanaHi: KARANAS_HI[karanaIndex],
    vara: VARAS_EN[varaIndex],
    varaHi: VARAS_HI[varaIndex],
    paksha,
    rahuKalStart: formatTime(rahuKalStart),
    rahuKalEnd: formatTime(rahuKalEnd),
    yamagandaStart: formatTime(yamagandaStart),
    yamagandaEnd: formatTime(yamagandaEnd),
    abhijitStart: formatTime(abhijitStart),
    abhijitEnd: formatTime(abhijitEnd),
  };
}

/**
 * Rahu-Kal slot (1-8) by day of week.
 * Sunday=1, Monday=2, ..., Saturday=0
 */
function getRahuKalSlot(dayOfWeek: number): number {
  // Rahu-Kal slots: Sun=1, Mon=8, Tue=7, Wed=4, Thu=2, Fri=3, Sat=6
  const slots = [1, 8, 7, 4, 2, 3, 6];
  return slots[dayOfWeek];
}

/**
 * Yamaganda slot (1-8) by day of week.
 */
function getYamagandaSlot(dayOfWeek: number): number {
  // Yamaganda slots: Sun=8, Mon=1, Tue=2, Wed=5, Thu=7, Fri=6, Sat=4
  const slots = [8, 1, 2, 5, 7, 6, 4];
  return slots[dayOfWeek];
}

/**
 * Approximate sunrise time for a date (simplified, no lat/lon correction).
 * Returns a Date object for the given date.
 */
function getApproxSunrise(date: Date): Date {
  // Simplified: assume 6:00 AM local as base
  const sunrise = new Date(date);
  sunrise.setHours(6, 0, 0, 0);
  return sunrise;
}

/**
 * Approximate sunset time for a date (simplified, no lat/lon correction).
 */
function getApproxSunset(date: Date): Date {
  // Simplified: assume 6:00 PM local as base
  const sunset = new Date(date);
  sunset.setHours(18, 0, 0, 0);
  return sunset;
}

/**
 * Divide the day (sunrise to sunset) into 8 equal slots and return the start/end of a given slot.
 */
function getTimeSlot(sunrise: Date, sunset: Date, slot: number, totalSlots: number): { start: Date; end: Date } {
  const dayDuration = sunset.getTime() - sunrise.getTime();
  const slotDuration = dayDuration / totalSlots;
  const start = new Date(sunrise.getTime() + (slot - 1) * slotDuration);
  const end = new Date(sunrise.getTime() + slot * slotDuration);
  return { start, end };
}

/**
 * Format a Date as "HH:MM" in 24-hour format.
 */
function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Get Panchang for today in the user's local timezone.
 */
export function getTodayPanchang(): PanchangData {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset();
  return calculatePanchang(now, tzOffset);
}
