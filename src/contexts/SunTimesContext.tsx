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
  liveTracking: boolean;
  toggleLiveTracking: () => void;
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

  // Live GPS tracking (speedometer) — off by default to save battery.
  const [liveTracking, setLiveTracking] = useState<boolean>(() => {
    try {
      return localStorage.getItem('com.hcompass.app_live_tracking') === 'true';
    } catch {
      return false;
    }
  });

  const toggleLiveTracking = () => {
    setLiveTracking((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('com.hcompass.app_live_tracking', next.toString());
      } catch (e) {
        console.warn('Failed to save live tracking pref', e);
      }
      return next;
    });
  };

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
            city: city || '',
            state: state || '',
            cityEn: cityEn || '',
            stateEn: stateEn || '',
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
                  city: city || ipData.city || '',
                  state: state || ipData.region || '',
                  cityEn: cityEn || ipData.city || '',
                  stateEn: stateEn || ipData.region || '',
                  altitude: null,
                  accuracy: 1000,
                  speed: null
                });
                setError('ip');
              } else {
                setError('location');
              }
            } else {
              setError('location');
            }
          } catch (ipErr) {
            console.warn("IP Geolocation failed:", ipErr);
            setError('location');
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
          city: city || '',
          state: state || '',
          cityEn: cityEn || '',
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

  // Continuous GPS watch for live speed/heading while driving.
  // Only runs when liveTracking is enabled (toggleable to save battery).
  // Only updates speed + coordinates (no reverse-geocode spam) to keep it light.
  useEffect(() => {
    if (!liveTracking) return;
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocationState((prev) => {
          const next: Location = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            city: prev?.city || '',
            state: prev?.state,
            cityEn: prev?.cityEn,
            stateEn: prev?.stateEn,
            altitude: pos.coords.altitude ?? prev?.altitude ?? null,
            accuracy: pos.coords.accuracy ?? prev?.accuracy ?? null,
            speed: pos.coords.speed ?? prev?.speed ?? null,
          };
          try {
            localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(next));
          } catch (e) {
            console.warn('Failed to save location', e);
          }
          return next;
        });
      },
      () => {
        // Ignore watch errors — the initial getCurrentPosition already gave us a fix.
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [liveTracking]);

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
        setLocation,
        liveTracking,
        toggleLiveTracking
      }}
    >
      {children}
    </SunTimesContext.Provider>
  );
};
