// Devta (Deity) Pada data for the 32-pada Vastu Purusha Mandala.
// Derived directly from VASTU_32_PADAS in @/lib/vastu32Devta so AR Vastu Scanner
// and the 32 Devta Mandala always share the exact same degree boundaries and deities.

import { VASTU_32_PADAS, get32Pada } from '@/lib/vastu32Devta';

export interface DevtaPada {
  id: string;      // e.g. 'N5'
  name: string;    // English name
  nameHi: string;  // Hindi name
  element: string; // Element (Water, Air, Fire, Earth, Space)
  elementNameHi: string; // Hindi element name
  startDeg: number;
  endDeg: number;
  centerDeg: number;
  isAuspicious: boolean;
}

const ELEMENT_MAP: Record<string, string> = {
  Jal: 'Water',
  Vayu: 'Air',
  Agni: 'Fire',
  Prithvi: 'Earth',
  Akash: 'Space'
};

const ELEMENT_HI_MAP: Record<string, string> = {
  Jal: 'जल तत्व',
  Vayu: 'वायु तत्व',
  Agni: 'अग्नि तत्व',
  Prithvi: 'पृथ्वी तत्व',
  Akash: 'आकाश तत्व'
};

export const DEVTA_32_PADAS: DevtaPada[] = VASTU_32_PADAS.map((p) => ({
  id: p.code.replace('*', ''),
  name: p.nameEn,
  nameHi: p.nameHi,
  element: ELEMENT_MAP[p.element] || p.element,
  elementNameHi: p.elementNameHi,
  startDeg: p.startDeg,
  endDeg: p.endDeg,
  centerDeg: p.centerDeg,
  isAuspicious: p.isAuspicious
}));

export const getDevtaPadaAtDegree = (degree: number): DevtaPada => {
  const pada = get32Pada(degree);
  return {
    id: pada.code.replace('*', ''),
    name: pada.nameEn,
    nameHi: pada.nameHi,
    element: ELEMENT_MAP[pada.element] || pada.element,
    elementNameHi: pada.elementNameHi,
    startDeg: pada.startDeg,
    endDeg: pada.endDeg,
    centerDeg: pada.centerDeg,
    isAuspicious: pada.isAuspicious
  };
};
