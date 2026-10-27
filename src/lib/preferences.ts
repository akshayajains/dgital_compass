import { useCallback } from 'react';
import { STORAGE_KEYS } from './config';

/**
 * Safe localStorage wrapper with error handling and quota management.
 * Prevents crashes when storage is unavailable (e.g., private browsing).
 */
class SafeStorage {
  private isAvailable: boolean;

  constructor() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      this.isAvailable = true;
    } catch {
      this.isAvailable = false;
    }
  }

  getItem(key: string): string | null {
    if (!this.isAvailable) return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error(`SafeStorage.getItem failed for key "${key}":`, e);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    if (!this.isAvailable) return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded for key:', key);
      } else {
        console.error(`SafeStorage.setItem failed for key "${key}":`, e);
      }
    }
  }

  removeItem(key: string): void {
    if (!this.isAvailable) return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`SafeStorage.removeItem failed for key "${key}":`, e);
    }
  }
}

const storage = new SafeStorage();

/**
 * Parse a boolean from localStorage. Returns `fallback` if key is missing or invalid.
 */
export function loadBool(key: string, fallback: boolean): boolean {
  const raw = storage.getItem(key);
  if (raw === null) return fallback;
  return raw === 'true';
}

/**
 * Parse a JSON value from localStorage. Returns `fallback` on any error.
 */
export function loadJson<T>(key: string, fallback: T): T {
  const raw = storage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`loadJson failed for key "${key}":`, e);
    return fallback;
  }
}

/**
 * Save a JSON value to localStorage.
 */
export function saveJson<T>(key: string, value: T): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`saveJson failed for key "${key}":`, e);
  }
}

/**
 * Unified preferences hook — centralizes all app preference access.
 * Replaces scattered localStorage calls throughout CompassView.
 */
export function usePreferences() {
  const getSoundEnabled = useCallback(() => loadBool(STORAGE_KEYS.sound, true), []);
  const setSoundEnabled = useCallback((v: boolean) => storage.setItem(STORAGE_KEYS.sound, String(v)), []);

  const getTrueNorth = useCallback(() => loadBool(STORAGE_KEYS.trueNorth, true), []);
  const setTrueNorth = useCallback((v: boolean) => storage.setItem(STORAGE_KEYS.trueNorth, String(v)), []);

  const getNeedleTracksNorth = useCallback(() => loadBool(STORAGE_KEYS.needleTracksNorth, false), []);
  const setNeedleTracksNorth = useCallback((v: boolean) => storage.setItem(STORAGE_KEYS.needleTracksNorth, String(v)), []);

  const getHapticEnabled = useCallback(() => loadBool(STORAGE_KEYS.haptic, true), []);
  const setHapticEnabled = useCallback((v: boolean) => storage.setItem(STORAGE_KEYS.haptic, String(v)), []);

  const getTempUnit = useCallback((): 'c' | 'f' => {
    return storage.getItem(STORAGE_KEYS.tempUnit) === 'f' ? 'f' : 'c';
  }, []);
  const setTempUnit = useCallback((u: 'c' | 'f') => storage.setItem(STORAGE_KEYS.tempUnit, u), []);

  const getSpeedUnit = useCallback((): 'kmh' | 'mph' => {
    return storage.getItem(STORAGE_KEYS.speedUnit) === 'mph' ? 'mph' : 'kmh';
  }, []);
  const setSpeedUnit = useCallback((u: 'kmh' | 'mph') => storage.setItem(STORAGE_KEYS.speedUnit, u), []);

  const getAltUnit = useCallback((): 'ft' | 'm' => {
    return storage.getItem(STORAGE_KEYS.altUnit) === 'm' ? 'm' : 'ft';
  }, []);
  const setAltUnit = useCallback((u: 'ft' | 'm') => storage.setItem(STORAGE_KEYS.altUnit, u), []);

  const getTimeFormat = useCallback((): '12' | '24' => {
    return storage.getItem(STORAGE_KEYS.timeFormat) === '24' ? '24' : '12';
  }, []);
  const setTimeFormat = useCallback((f: '12' | '24') => storage.setItem(STORAGE_KEYS.timeFormat, f), []);

  const getKeepAwake = useCallback(() => loadBool(STORAGE_KEYS.keepAwake, false), []);
  const setKeepAwake = useCallback((v: boolean) => storage.setItem(STORAGE_KEYS.keepAwake, String(v)), []);

  const getAlwaysVisible = useCallback(() => loadBool(STORAGE_KEYS.alwaysVisible, false), []);
  const setAlwaysVisible = useCallback((v: boolean) => storage.setItem(STORAGE_KEYS.alwaysVisible, String(v)), []);

  const getVastuGrid = useCallback(() => loadBool(STORAGE_KEYS.vastuGrid, true), []);
  const setVastuGrid = useCallback((v: boolean) => storage.setItem(STORAGE_KEYS.vastuGrid, String(v)), []);

  const getTareOffset = useCallback(
    (): { pitch: number; roll: number } | null => loadJson(STORAGE_KEYS.tareOffset, null),
    []
  );
  const setTareOffset = useCallback(
    (t: { pitch: number; roll: number } | null) => {
      if (t) saveJson(STORAGE_KEYS.tareOffset, t);
      else storage.removeItem(STORAGE_KEYS.tareOffset);
    },
    []
  );

  const getDeclination = useCallback((): number => {
    const raw = storage.getItem(STORAGE_KEYS.declination);
    if (raw !== null && !isNaN(parseFloat(raw))) return parseFloat(raw);
    return -0.2;
  }, []);
  const setDeclination = useCallback((d: number) => storage.setItem(STORAGE_KEYS.declination, d.toString()), []);

  const getOnboardingCompleted = useCallback(() => loadBool(STORAGE_KEYS.onboardingCompleted, false), []);
  const setOnboardingCompleted = useCallback(() => storage.setItem(STORAGE_KEYS.onboardingCompleted, 'true'), []);

  const isFirstLaunch = useCallback((): boolean => {
    return storage.getItem(STORAGE_KEYS.firstLaunch) !== 'false';
  }, []);
  const markLaunched = useCallback(() => storage.setItem(STORAGE_KEYS.firstLaunch, 'false'), []);

  const getNumerologyDob = useCallback(() => storage.getItem(STORAGE_KEYS.numerologyDob) ?? '', []);
  const setNumerologyDob = useCallback((v: string) => storage.setItem(STORAGE_KEYS.numerologyDob, v), []);

  const getNumerologyPhone = useCallback(() => storage.getItem(STORAGE_KEYS.numerologyPhone) ?? '', []);
  const setNumerologyPhone = useCallback((v: string) => storage.setItem(STORAGE_KEYS.numerologyPhone, v), []);

  const getNumerologyHouse = useCallback(() => storage.getItem(STORAGE_KEYS.numerologyHouse) ?? '', []);
  const setNumerologyHouse = useCallback((v: string) => storage.setItem(STORAGE_KEYS.numerologyHouse, v), []);

  const getNumerologyVehicle = useCallback(() => storage.getItem(STORAGE_KEYS.numerologyVehicle) ?? '', []);
  const setNumerologyVehicle = useCallback((v: string) => storage.setItem(STORAGE_KEYS.numerologyVehicle, v), []);

  const getFengshuiDoor = useCallback((): number => {
    const raw = storage.getItem(STORAGE_KEYS.fengshuiDoor);
    return raw ? parseInt(raw, 10) : 0;
  }, []);
  const setFengshuiDoor = useCallback((v: number) => storage.setItem(STORAGE_KEYS.fengshuiDoor, String(v)), []);

  return {
    getSoundEnabled, setSoundEnabled,
    getTrueNorth, setTrueNorth,
    getNeedleTracksNorth, setNeedleTracksNorth,
    getHapticEnabled, setHapticEnabled,
    getTempUnit, setTempUnit,
    getSpeedUnit, setSpeedUnit,
    getAltUnit, setAltUnit,
    getTimeFormat, setTimeFormat,
    getKeepAwake, setKeepAwake,
    getAlwaysVisible, setAlwaysVisible,
    getVastuGrid, setVastuGrid,
    getTareOffset, setTareOffset,
    getDeclination, setDeclination,
    getOnboardingCompleted, setOnboardingCompleted,
    isFirstLaunch, markLaunched,
    getNumerologyDob, setNumerologyDob,
    getNumerologyPhone, setNumerologyPhone,
    getNumerologyHouse, setNumerologyHouse,
    getNumerologyVehicle, setNumerologyVehicle,
    getFengshuiDoor, setFengshuiDoor,
  };
}
