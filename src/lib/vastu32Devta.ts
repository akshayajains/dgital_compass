export interface VastuPada32 {
  code: string;
  nameHi: string;
  nameEn: string;
  startDeg: number;
  endDeg: number;
  centerDeg: number;
  isAuspicious: boolean;
  zone: 'E' | 'S' | 'W' | 'N';
  color: string;
}

export const VASTU_32_PADAS: VastuPada32[] = [
  // North (N3 to N8, N1 to N2)
  { code: 'N3*', nameHi: 'मुख्य', nameEn: 'Mukhya', startDeg: 0, endDeg: 11.25, centerDeg: 5.625, isAuspicious: true, zone: 'N', color: '#00F0FF' },
  { code: 'N4*', nameHi: 'भल्लाट', nameEn: 'Bhallat', startDeg: 11.25, endDeg: 22.5, centerDeg: 16.875, isAuspicious: true, zone: 'N', color: '#00F0FF' },
  { code: 'N5', nameHi: 'सोम', nameEn: 'Soma', startDeg: 22.5, endDeg: 33.75, centerDeg: 28.125, isAuspicious: false, zone: 'N', color: '#1E3A5F' },
  { code: 'N6', nameHi: 'भुजंग', nameEn: 'Bhujaga', startDeg: 33.75, endDeg: 45, centerDeg: 39.375, isAuspicious: false, zone: 'N', color: '#1E3A5F' },
  { code: 'N7', nameHi: 'अदिति', nameEn: 'Aditi', startDeg: 45, endDeg: 56.25, centerDeg: 50.625, isAuspicious: false, zone: 'N', color: '#162C48' },
  { code: 'N8', nameHi: 'दिति', nameEn: 'Diti', startDeg: 56.25, endDeg: 67.5, centerDeg: 61.875, isAuspicious: false, zone: 'N', color: '#162C48' },

  // East (E1 to E8)
  { code: 'E1', nameHi: 'शिखी', nameEn: 'Shikhi', startDeg: 67.5, endDeg: 78.75, centerDeg: 73.125, isAuspicious: false, zone: 'E', color: '#5B2612' },
  { code: 'E2', nameHi: 'पर्जन्य', nameEn: 'Parjanya', startDeg: 78.75, endDeg: 90, centerDeg: 84.375, isAuspicious: false, zone: 'E', color: '#4A1D0C' },
  { code: 'E3*', nameHi: 'जयंत', nameEn: 'Jayant', startDeg: 90, endDeg: 101.25, centerDeg: 95.625, isAuspicious: true, zone: 'E', color: '#00F0FF' },
  { code: 'E4*', nameHi: 'इंद्र', nameEn: 'Indra', startDeg: 101.25, endDeg: 112.5, centerDeg: 106.875, isAuspicious: true, zone: 'E', color: '#00F0FF' },
  { code: 'E5', nameHi: 'सूर्य', nameEn: 'Surya', startDeg: 112.5, endDeg: 123.75, centerDeg: 118.125, isAuspicious: false, zone: 'E', color: '#3B1407' },
  { code: 'E6', nameHi: 'सत्य', nameEn: 'Satya', startDeg: 123.75, endDeg: 135, centerDeg: 129.375, isAuspicious: false, zone: 'E', color: '#2B0F05' },
  { code: 'E7', nameHi: 'भृश', nameEn: 'Bhrisha', startDeg: 135, endDeg: 146.25, centerDeg: 140.625, isAuspicious: false, zone: 'E', color: '#3A1E24' },
  { code: 'E8', nameHi: 'अंतरिक्ष', nameEn: 'Antariksha', startDeg: 146.25, endDeg: 157.5, centerDeg: 151.875, isAuspicious: false, zone: 'E', color: '#291419' },

  // South (S1 to S8)
  { code: 'S1', nameHi: 'अनिल', nameEn: 'Anila', startDeg: 157.5, endDeg: 168.75, centerDeg: 163.125, isAuspicious: false, zone: 'S', color: '#3A2812' },
  { code: 'S2', nameHi: 'पूषा', nameEn: 'Pusha', startDeg: 168.75, endDeg: 180, centerDeg: 174.375, isAuspicious: false, zone: 'S', color: '#2B1C0A' },
  { code: 'S3*', nameHi: 'वितथ', nameEn: 'Vitatha', startDeg: 180, endDeg: 191.25, centerDeg: 185.625, isAuspicious: true, zone: 'S', color: '#00F0FF' },
  { code: 'S4*', nameHi: 'गृहक्षत', nameEn: 'Grihakshat', startDeg: 191.25, endDeg: 202.5, centerDeg: 196.875, isAuspicious: true, zone: 'S', color: '#00F0FF' },
  { code: 'S5', nameHi: 'यम', nameEn: 'Yama', startDeg: 202.5, endDeg: 213.75, centerDeg: 208.125, isAuspicious: false, zone: 'S', color: '#3D2513' },
  { code: 'S6', nameHi: 'गन्धर्व', nameEn: 'Gandharva', startDeg: 213.75, endDeg: 225, centerDeg: 219.375, isAuspicious: false, zone: 'S', color: '#28170B' },
  { code: 'S7', nameHi: 'भृंगराज', nameEn: 'Bhringraj', startDeg: 225, endDeg: 236.25, centerDeg: 230.625, isAuspicious: false, zone: 'S', color: '#231308' },
  { code: 'S8', nameHi: 'मृग', nameEn: 'Mriga', startDeg: 236.25, endDeg: 247.5, centerDeg: 241.875, isAuspicious: false, zone: 'S', color: '#1B0E05' },

  // West (W1 to W8)
  { code: 'W1', nameHi: 'पितृ', nameEn: 'Pitra', startDeg: 247.5, endDeg: 258.75, centerDeg: 253.125, isAuspicious: false, zone: 'W', color: '#24252E' },
  { code: 'W2', nameHi: 'दौवारिक', nameEn: 'Dauvarika', startDeg: 258.75, endDeg: 270, centerDeg: 264.375, isAuspicious: false, zone: 'W', color: '#1A1B22' },
  { code: 'W3*', nameHi: 'सुग्रीव', nameEn: 'Sugriva', startDeg: 270, endDeg: 281.25, centerDeg: 275.625, isAuspicious: true, zone: 'W', color: '#00F0FF' },
  { code: 'W4*', nameHi: 'पुष्पदंत', nameEn: 'Pushpadanta', startDeg: 281.25, endDeg: 292.5, centerDeg: 286.875, isAuspicious: true, zone: 'W', color: '#00F0FF' },
  { code: 'W5', nameHi: 'वरुण', nameEn: 'Varuna', startDeg: 292.5, endDeg: 303.75, centerDeg: 298.125, isAuspicious: false, zone: 'W', color: '#1D2430' },
  { code: 'W6', nameHi: 'असुर', nameEn: 'Asura', startDeg: 303.75, endDeg: 315, centerDeg: 309.375, isAuspicious: false, zone: 'W', color: '#141A24' },
  { code: 'W7', nameHi: 'शोष', nameEn: 'Shosha', startDeg: 315, endDeg: 326.25, centerDeg: 320.625, isAuspicious: false, zone: 'W', color: '#121820' },
  { code: 'W8', nameHi: 'पापयक्ष्मा', nameEn: 'Papyakshma', startDeg: 326.25, endDeg: 337.5, centerDeg: 331.875, isAuspicious: false, zone: 'W', color: '#0F141A' },

  // Remaining North (N1 and N2)
  { code: 'N1', nameHi: 'रोग', nameEn: 'Roga', startDeg: 337.5, endDeg: 348.75, centerDeg: 343.125, isAuspicious: false, zone: 'N', color: '#162232' },
  { code: 'N2', nameHi: 'नाग', nameEn: 'Naga', startDeg: 348.75, endDeg: 360, centerDeg: 354.375, isAuspicious: false, zone: 'N', color: '#101B28' }
];

export const get32Pada = (heading: number | null): VastuPada32 => {
  if (heading === null) {
    // Default fallback to N8 (Diti: 56.3° - 67.5°)
    return VASTU_32_PADAS[5];
  }
  const norm = ((heading % 360) + 360) % 360;
  const match = VASTU_32_PADAS.find(p => norm >= p.startDeg && norm < p.endDeg);
  return match || VASTU_32_PADAS[0];
};
