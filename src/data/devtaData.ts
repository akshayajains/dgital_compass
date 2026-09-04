// Devta (Deity) Pada data for the 32-pada Vastu Purusha Mandala.
// Each pada spans 11.25° (360 / 32). Used by the AR Vastu Scanner and
// the 32 Devta Chakra visual.

export interface DevtaPada {
  id: string;      // e.g. 'N1'
  name: string;    // English name
  nameHi: string;  // Hindi name
  element: string; // Element (Water, Air, Fire, Earth, Space)
  startDeg: number;
  endDeg: number;
  centerDeg: number;
  isAuspicious: boolean;
}

export const DEVTA_32_PADAS: DevtaPada[] = [
  // North (N1 - N8)
  { id: 'N1', name: 'Sikhi', nameHi: 'शिखी', element: 'Water', startDeg: 337.5, endDeg: 348.75, centerDeg: 343.125, isAuspicious: false },
  { id: 'N2', name: 'Parjanya', nameHi: 'पर्जन्य', element: 'Water', startDeg: 348.75, endDeg: 0, centerDeg: 354.375, isAuspicious: false },
  { id: 'N3', name: 'Jayant', nameHi: 'जयंत', element: 'Water', startDeg: 0, endDeg: 11.25, centerDeg: 5.625, isAuspicious: true },
  { id: 'N4', name: 'Mahendra', nameHi: 'महेन्द्र', element: 'Water', startDeg: 11.25, endDeg: 22.5, centerDeg: 16.875, isAuspicious: true },
  { id: 'N5', name: 'Surya', nameHi: 'सूर्य', element: 'Water', startDeg: 22.5, endDeg: 33.75, centerDeg: 28.125, isAuspicious: false },
  { id: 'N6', name: 'Satya', nameHi: 'सत्य', element: 'Water', startDeg: 33.75, endDeg: 45, centerDeg: 39.375, isAuspicious: false },
  { id: 'N7', name: 'Bhrisha', nameHi: 'भृश', element: 'Water', startDeg: 45, endDeg: 56.25, centerDeg: 50.625, isAuspicious: false },
  { id: 'N8', name: 'Akasha', nameHi: 'आकाश', element: 'Water', startDeg: 56.25, endDeg: 67.5, centerDeg: 61.875, isAuspicious: false },

  // East (E1 - E8)
  { id: 'E1', name: 'Anila', nameHi: 'अनिल', element: 'Fire', startDeg: 67.5, endDeg: 78.75, centerDeg: 73.125, isAuspicious: false },
  { id: 'E2', name: 'Pusha', nameHi: 'पूषा', element: 'Fire', startDeg: 78.75, endDeg: 90, centerDeg: 84.375, isAuspicious: false },
  { id: 'E3', name: 'Vitatha', nameHi: 'वितथ', element: 'Fire', startDeg: 90, endDeg: 101.25, centerDeg: 95.625, isAuspicious: false },
  { id: 'E4', name: 'Grihakshata', nameHi: 'गृहक्षत', element: 'Fire', startDeg: 101.25, endDeg: 112.5, centerDeg: 106.875, isAuspicious: true },
  { id: 'E5', name: 'Yama', nameHi: 'यम', element: 'Fire', startDeg: 112.5, endDeg: 123.75, centerDeg: 118.125, isAuspicious: false },
  { id: 'E6', name: 'Gandharva', nameHi: 'गंधर्व', element: 'Fire', startDeg: 123.75, endDeg: 135, centerDeg: 129.375, isAuspicious: false },
  { id: 'E7', name: 'Bhringaraja', nameHi: 'भृंगराज', element: 'Fire', startDeg: 135, endDeg: 146.25, centerDeg: 140.625, isAuspicious: false },
  { id: 'E8', name: 'Mriga', nameHi: 'मृग', element: 'Fire', startDeg: 146.25, endDeg: 157.5, centerDeg: 151.875, isAuspicious: false },

  // South (S1 - S8)
  { id: 'S1', name: 'Pitri', nameHi: 'पितृ', element: 'Earth', startDeg: 157.5, endDeg: 168.75, centerDeg: 163.125, isAuspicious: false },
  { id: 'S2', name: 'Dauvarika', nameHi: 'दौवारिक', element: 'Earth', startDeg: 168.75, endDeg: 180, centerDeg: 174.375, isAuspicious: false },
  { id: 'S3', name: 'Sugriva', nameHi: 'सुग्रीव', element: 'Earth', startDeg: 180, endDeg: 191.25, centerDeg: 185.625, isAuspicious: true },
  { id: 'S4', name: 'Pushpadanta', nameHi: 'पुष्पदंत', element: 'Earth', startDeg: 191.25, endDeg: 202.5, centerDeg: 196.875, isAuspicious: true },
  { id: 'S5', name: 'Varuna', nameHi: 'वरुण', element: 'Earth', startDeg: 202.5, endDeg: 213.75, centerDeg: 208.125, isAuspicious: false },
  { id: 'S6', name: 'Asura', nameHi: 'असुर', element: 'Earth', startDeg: 213.75, endDeg: 225, centerDeg: 219.375, isAuspicious: false },
  { id: 'S7', name: 'Sosha', nameHi: 'शोष', element: 'Earth', startDeg: 225, endDeg: 236.25, centerDeg: 230.625, isAuspicious: false },
  { id: 'S8', name: 'Roga', nameHi: 'रोग', element: 'Earth', startDeg: 236.25, endDeg: 247.5, centerDeg: 241.875, isAuspicious: false },

  // West (W1 - W8)
  { id: 'W1', name: 'Papyakshma', nameHi: 'पापयक्ष्मा', element: 'Air', startDeg: 247.5, endDeg: 258.75, centerDeg: 253.125, isAuspicious: false },
  { id: 'W2', name: 'Naga', nameHi: 'नाग', element: 'Air', startDeg: 258.75, endDeg: 270, centerDeg: 264.375, isAuspicious: false },
  { id: 'W3', name: 'Mukhya', nameHi: 'मुख्य', element: 'Air', startDeg: 270, endDeg: 281.25, centerDeg: 275.625, isAuspicious: true },
  { id: 'W4', name: 'Bhallata', nameHi: 'भल्लाट', element: 'Air', startDeg: 281.25, endDeg: 292.5, centerDeg: 286.875, isAuspicious: true },
  { id: 'W5', name: 'Soma', nameHi: 'सोम', element: 'Air', startDeg: 292.5, endDeg: 303.75, centerDeg: 298.125, isAuspicious: false },
  { id: 'W6', name: 'Bhujanga', nameHi: 'भुजंग', element: 'Air', startDeg: 303.75, endDeg: 315, centerDeg: 309.375, isAuspicious: false },
  { id: 'W7', name: 'Aditi', nameHi: 'अदिति', element: 'Air', startDeg: 315, endDeg: 326.25, centerDeg: 320.625, isAuspicious: false },
  { id: 'W8', name: 'Diti', nameHi: 'दिति', element: 'Air', startDeg: 326.25, endDeg: 337.5, centerDeg: 331.875, isAuspicious: false },
];

export const getDevtaPadaAtDegree = (degree: number): DevtaPada => {
  const norm = ((degree % 360) + 360) % 360;
  const match = DEVTA_32_PADAS.find(p => {
    if (p.startDeg <= p.endDeg) {
      return norm >= p.startDeg && norm < p.endDeg;
    }
    // Wrap-around pada (e.g. N2: 348.75 -> 0)
    return norm >= p.startDeg || norm < p.endDeg;
  });
  return match || DEVTA_32_PADAS[0];
};
