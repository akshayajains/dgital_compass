import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import SunCalc from 'suncalc';
import { Geolocation } from '@capacitor/geolocation';

const LOCATION_STORAGE_KEY = 'com.hcompass.app_location';

export interface Location {
  latitude: number;
  longitude: number;
  city: string;
  state?: string;
  cityEn?: string;
  stateEn?: string;
  altitude?: number | null;
  accuracy?: number | null;
  speed?: number | null;
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
    return null;
  });

  const [loading, setLoading] = useState<boolean>(true);
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

  const reverseGeocode = async (lat: number, lng: number): Promise<{ city: string; state: string; cityEn: string; stateEn: string }> => {
    const fetchNames = async (lang: string): Promise<{ city: string; state: string }> => {
      try {
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=${lang}`);
        if (res.ok) {
          const data = await res.json();
          const city = data.city || data.locality || data.principalSubdivision || '';
          const state = data.principalSubdivision || '';
          return { city, state };
        }
      } catch {
        try {
          const res2 = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${lang}`);
          if (res2.ok) {
            const data2 = await res2.json();
            const city = data2.address?.city || data2.address?.town || data2.address?.district || '';
            const state = data2.address?.state || '';
            return { city, state };
          }
        } catch {}
      }
      return { city: '', state: '' };
    };
    const hi = await fetchNames('hi');
    const en = await fetchNames('en');
    return {
      city: hi.city,
      state: hi.state,
      cityEn: en.city || hi.city,
      stateEn: en.state || hi.state
    };
  };

  const fetchCurrentLocation = async () => {
    setLoading(true);
    setError(null);

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const alt = pos.coords.altitude;
          const acc = pos.coords.accuracy;
          const spd = pos.coords.speed;
          const { city, state, cityEn, stateEn } = await reverseGeocode(lat, lng);
          setLocation({
            latitude: lat,
            longitude: lng,
            city: city || 'नई दिल्ली',
            state: state || ' भारत',
            cityEn: cityEn || 'New Delhi',
            stateEn: stateEn || 'India',
            altitude: alt,
            accuracy: acc,
            speed: spd
          });
          setLoading(false);
        },
        async (err) => {
          try {
            const ipRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
            if (ipRes.ok) {
              const ipData = await ipRes.json();
              const lat = parseFloat(ipData.latitude);
              const lng = parseFloat(ipData.longitude);
              if (!isNaN(lat) && !isNaN(lng)) {
                const { city, state, cityEn, stateEn } = await reverseGeocode(lat, lng);
                setLocation({
                  latitude: lat,
                  longitude: lng,
                  city: city || ipData.city || 'नई दिल्ली',
                  state: state || ipData.region || '',
                  cityEn: cityEn || ipData.city || 'New Delhi',
                  stateEn: stateEn || ipData.region || '',
                  altitude: null,
                  accuracy: 1000,
                  speed: null
                });
              }
            }
          } catch (ipErr) {
            console.warn("IP Geolocation failed:", ipErr);
          } finally {
            setLoading(false);
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
      );
    } else {
      try {
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 8000
        });
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const { city, state, cityEn, stateEn } = await reverseGeocode(lat, lng);
        setLocation({
          latitude: lat,
          longitude: lng,
          city: city || 'नई दिल्ली',
          state: state || '',
          cityEn: cityEn || 'New Delhi',
          stateEn: stateEn || '',
          altitude: pos.coords.altitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed
        });
      } catch (err) {
        console.warn('Capacitor geolocation fallback:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const times = React.useMemo(() => {
    if (!location) {
      return {
        sunrise: null,
        sunset: null,
        solarNoon: null
      };
    }
    const lat = location.latitude;
    const lng = location.longitude;
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
  }, [location]);

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
