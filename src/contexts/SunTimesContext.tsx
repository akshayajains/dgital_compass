import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import SunCalc from 'suncalc';
import { Geolocation } from '@capacitor/geolocation';

const LOCATION_STORAGE_KEY = 'hindi_compass_location';

export interface Location {
  latitude: number;
  longitude: number;
  city: string;
  state?: string;
  altitude?: number | null;
  accuracy?: number | null;
}

export interface SunTimes {
  sunrise: Date | null;
  sunset: Date | null;
  solarNoon: Date | null;
}

interface SunTimesContextType {
  times: SunTimes;
  location: Location | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  setLocation: (location: Location | null) => void;
}

export const SunTimesContext = createContext<SunTimesContextType | undefined>(undefined);

export const SunTimesProvider = ({ children }: { children: ReactNode }) => {
  const [location, setLocationState] = useState<Location | null>(() => {
    try {
      const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse saved location', e);
    }
    // Default: New Delhi, India
    return {
      latitude: 28.6139,
      longitude: 77.2090,
      city: 'नई दिल्ली',
      state: 'दिल्ली',
      altitude: 216,
      accuracy: 10
    };
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const setLocation = (newLoc: Location | null) => {
    setLocationState(newLoc);
    if (newLoc) {
      try {
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLoc));
      } catch (e) {
        console.warn('Failed to save location', e);
      }
    }
  };

  const fetchCurrentLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        const req = await Geolocation.requestPermissions();
        if (req.location !== 'granted') {
          setLoading(false);
          return;
        }
      }

      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const alt = pos.coords.altitude;
      const acc = pos.coords.accuracy;

      let city = 'वर्तमान स्थान';
      let state = '';

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=hi`);
        if (res.ok) {
          const data = await res.json();
          city = data.address?.city || data.address?.town || data.address?.district || data.address?.suburb || 'वर्तमान स्थान';
          state = data.address?.state || '';
        }
      } catch {}

      setLocation({
        latitude: lat,
        longitude: lng,
        city,
        state,
        altitude: alt,
        accuracy: acc
      });
    } catch (err: any) {
      console.warn('Geolocation lookup failed:', err);
      setError(err?.message || 'स्थान प्राप्त नहीं हो सका');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const times = React.useMemo(() => {
    const lat = location?.latitude || 28.6139;
    const lng = location?.longitude || 77.2090;
    const now = new Date();
    try {
      const calc = SunCalc.getTimes(now, lat, lng);
      return {
        sunrise: calc.sunrise,
        sunset: calc.sunset,
        solarNoon: calc.solarNoon
      };
    } catch {
      return {
        sunrise: null,
        sunset: null,
        solarNoon: null
      };
    }
  }, [location?.latitude, location?.longitude]);

  return (
    <SunTimesContext.Provider
      value={{
        times,
        location,
        loading,
        error,
        refetch: fetchCurrentLocation,
        setLocation
      }}
    >
      {children}
    </SunTimesContext.Provider>
  );
};
