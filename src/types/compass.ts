export type Language = 'hi' | 'en';

export type NeedleType =
  | 'delta_bicolor'
  | 'ornate_spear'
  | 'laser_hud'
  | 'stealth_needle'
  | 'chakra_arrow'
  | 'tactical_crosshair'
  | 'pulsar_pointer'
  | 'ios_needle'
  | 'metal_needle'
  | 'graphite_needle';

export type CompassStyleId =
  | 'ios_compass'
  | 'color_palette'
  | 'satellite_earth'
  | 'sandalwood'
  | 'royal_gold'
  | 'cyberpunk'
  | 'minimal_onyx'
  | 'vedic_mandala'
  | 'tactical_ops'
  | 'cosmic_galaxy';

export interface CompassStyleVariant {
  id: string;
  nameHi: string;
  nameEn: string;
  colorSwatch: string;
  primaryColor: string;
  accentColor: string;
  previewBg: string;
  bezelClass: string;
  dialFaceBg: string;
  needleType: NeedleType;
  apexY?: number;
  hasCenterNeedle?: boolean;
  tickMajorColor?: string;
  tickMidColor?: string;
  tickMinorColor?: string;
  degreeColor?: string;
  cardinalColor?: string;
  northColor?: string;
}

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
  premium?: boolean;
  needleType: NeedleType;
  variants?: CompassStyleVariant[];
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
