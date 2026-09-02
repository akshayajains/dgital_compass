export type Language = 'hi' | 'en';

export type CompassStyleId =
  | 'satellite_earth'
  | 'sandalwood'
  | 'royal_gold'
  | 'cyberpunk'
  | 'nautical'
  | 'minimal_onyx'
  | 'emerald_aurora'
  | 'vedic_mandala'
  | 'tactical_ops'
  | 'cosmic_galaxy'
  | 'rose_gold'
  | 'steampunk'
  | 'crystal_glass'
  | 'sunset_aura';

export interface CompassStyleInfo {
  id: CompassStyleId;
  nameHi: string;
  nameEn: string;
  tagHi: string;
  tagEn: string;
  category: 'classic' | 'modern' | 'tactical' | 'luxury' | 'mystic';
  primaryColor: string;
  accentColor: string;
  previewBg: string;
  needleType: 'delta_bicolor' | 'ornate_spear' | 'laser_hud' | 'stealth_needle' | 'chakra_arrow' | 'tactical_crosshair' | 'pulsar_pointer' | 'luxury_sword' | 'nixie_needle' | 'crystal_prism';
}

export interface DirectionInfo {
  name: string;
  code: string;
  vastuTitle: string;
  vastuDesc: string;
  color: string;
  element: string;
  deity: string;
}

export interface WeatherData {
  temp: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  code: number;
}
