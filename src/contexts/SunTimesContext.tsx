import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import SunCalc from 'suncalc';
import { Geolocation } from '@capacitor/geolocation';

const LOCATION_STORAGE_KEY = 'com.spiritual.compass.app_location';

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

  // Live GPS tracking (speedometer) — active by default for instant speed telemetry.
  const [liveTracking, setLiveTracking] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('com.spiritual.compass.app_live_tracking');
      if (saved !== null) return saved === 'true';
      return true;
    } catch {
      return true;
    }
  });

  const lastFixRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const smoothedSpeedRef = useRef<number>(0);

  const toggleLiveTracking = () => {
    setLiveTracking((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('com.spiritual.compass.app_live_tracking', next.toString());
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

  // Haversine distance calculator for GPS noise deadbanding
  const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;
    const dp = ((lat2 - lat1) * Math.PI) / 180;
    const dl = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Continuous GPS watch for live speed and position.
  // Computes real-time speed from Doppler hardware + distance/time delta fallback.
  // maximumAge: 0 forces real-time hardware polling without 3s cache delays.
  useEffect(() => {
    if (!liveTracking) {
      lastFixRef.current = null;
      smoothedSpeedRef.current = 0;
      return;
    }
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = pos.timestamp || Date.now();
        const rawLat = pos.coords.latitude;
        const rawLng = pos.coords.longitude;
        const rawSpeed = pos.coords.speed; // hardware speed in m/s (null on many mobile web browsers)

        let calculatedSpeed = 0;
        let dist = 0;

        if (lastFixRef.current) {
          const dt = Math.max(0.1, (now - lastFixRef.current.time) / 1000); // seconds
          dist = calculateDistanceMeters(
            lastFixRef.current.lat,
            lastFixRef.current.lng,
            rawLat,
            rawLng
          );
          if (dt >= 0.4 && dt <= 10) {
            calculatedSpeed = dist / dt; // m/s
          }
        }
        lastFixRef.current = { lat: rawLat, lng: rawLng, time: now };

        // Determine final instantaneous speed:
        let instantSpeed = 0;
        if (typeof rawSpeed === 'number' && !isNaN(rawSpeed) && rawSpeed >= 0) {
          // Hardware GPS Doppler speed from chip
          instantSpeed = rawSpeed;
        } else if (dist >= 1.2 && calculatedSpeed >= 0.3) {
          // Derived from distance / time
          instantSpeed = calculatedSpeed;
        } else {
          // Stationary
          instantSpeed = 0;
        }

        // Noise deadband: speeds < 0.28 m/s (~1 km/h) are stationary noise
        if (instantSpeed < 0.28) {
          instantSpeed = 0;
        }

        // Smooth speed with fast-decay EMA:
        if (instantSpeed === 0) {
          smoothedSpeedRef.current = 0;
        } else {
          smoothedSpeedRef.current = smoothedSpeedRef.current * 0.25 + instantSpeed * 0.75;
        }

        const effectiveSpeed = smoothedSpeedRef.current;

        setLocationState((prev) => {
          if (!prev) {
            const initial: Location = {
              latitude: rawLat,
              longitude: rawLng,
              city: '',
              altitude: pos.coords.altitude ?? null,
              accuracy: pos.coords.accuracy ?? null,
              speed: effectiveSpeed,
            };
            return initial;
          }

          // Subtle coordinate deadband: only update coordinates if moved > 2.0 meters
          // This keeps table coordinate displays rock-solid while walking/driving updates smoothly
          const isCoordStationary = dist < 2.0 && effectiveSpeed === 0;
          const nextLat = isCoordStationary ? prev.latitude : rawLat;
          const nextLng = isCoordStationary ? prev.longitude : rawLng;

          const next: Location = {
            latitude: nextLat,
            longitude: nextLng,
            city: prev.city || '',
            state: prev.state,
            cityEn: prev.cityEn,
            stateEn: prev.stateEn,
            altitude: pos.coords.altitude ?? prev.altitude ?? null,
            accuracy: pos.coords.accuracy ?? prev.accuracy ?? null,
            speed: effectiveSpeed,
          };
          try {
            localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(next));
          } catch (e) {
            console.warn('Failed to save location', e);
          }
          return next;
        });
      },
      (err) => {
        console.warn('GPS watch error:', err);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 6000 }
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
