/**
 * Centralized API configuration — extract hardcoded URLs to avoid scattering them.
 * In production, replace with environment variables or a build-time define.
 */

export const API_CONFIG = {
  // Weather API (Open-Meteo, free, no key required)
  weather: {
    baseUrl: 'https://api.open-meteo.com/v1/forecast',
    cacheTtlMs: 15 * 60 * 1000, // 15 minutes
  },
  // Geocoding / reverse geocoding
  geocoding: {
    baseUrl: 'https://api.bigdatacloud.net/data/reverse-geocode-client',
  },
  // IP-based location fallback
  ipLocation: {
    baseUrl: 'https://get.geojs.io/v1/ip/geo.json',
  },
} as const;

/**
 * Storage keys namespace — all app preferences use this prefix.
 */
export const STORAGE_PREFIX = 'com.spiritual.compass.app_';

export const STORAGE_KEYS = {
  language: `${STORAGE_PREFIX}language`,
  theme: 'digital-compass-theme',
  style: `${STORAGE_PREFIX}style`,
  variant: `${STORAGE_PREFIX}variant`,
  sound: `${STORAGE_PREFIX}sound`,
  trueNorth: `${STORAGE_PREFIX}true_north`,
  needleTracksNorth: `${STORAGE_PREFIX}needle_tracks_north`,
  haptic: `${STORAGE_PREFIX}haptic`,
  tempUnit: `${STORAGE_PREFIX}temp_unit`,
  speedUnit: `${STORAGE_PREFIX}speed_unit`,
  altUnit: `${STORAGE_PREFIX}alt_unit`,
  timeFormat: `${STORAGE_PREFIX}time_format`,
  keepAwake: `${STORAGE_PREFIX}keep_awake`,
  alwaysVisible: `${STORAGE_PREFIX}always_visible`,
  vastuGrid: `${STORAGE_PREFIX}vastu`,
  declination: `${STORAGE_PREFIX}declination`,
  tareOffset: `${STORAGE_PREFIX}tare_offset`,
  onboardingCompleted: `${STORAGE_PREFIX}onboarding_completed`,
  firstLaunch: `${STORAGE_PREFIX}first_launch`,
  numerologyDob: `${STORAGE_PREFIX}numerology_dob`,
  numerologyPhone: `${STORAGE_PREFIX}numerology_phone`,
  numerologyHouse: `${STORAGE_PREFIX}numerology_house`,
  numerologyVehicle: `${STORAGE_PREFIX}numerology_vehicle`,
  fengshuiDoor: `${STORAGE_PREFIX}fengshui_door`,
} as const;
