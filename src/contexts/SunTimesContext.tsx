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
  gpsHeading?: number | null;
  isOffline?: boolean;
  source?: 'gps' | 'ip' | 'cached' | 'default';
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
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          speed: 0,
          gpsHeading: null,
          isOffline: true,
          source: (parsed.source || 'cached') as 'gps' | 'ip' | 'cached' | 'default'
        };
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
        } catch (e) {
          console.error('Nominatim reverse geocode fallback failed:', e);
        }
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

  const triedElevKeyRef = useRef<string | null>(null);

  const fetchElevationFallback = async (lat: number, lng: number): Promise<number | null> => {
    const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
    try {
      const cachedRaw = localStorage.getItem('compass_elev_cache_v1');
      if (cachedRaw) {
        const cachedMap = JSON.parse(cachedRaw);
        if (typeof cachedMap?.[cacheKey] === 'number') {
          return cachedMap[cacheKey];
        }
      }
    } catch (e) {
      console.error('Failed to read elevation cache:', e);
    }

    const saveCache = (elev: number) => {
      try {
        const cachedRaw = localStorage.getItem('compass_elev_cache_v1');
        const cachedMap = cachedRaw ? JSON.parse(cachedRaw) : {};
        cachedMap[cacheKey] = elev;
        localStorage.setItem('compass_elev_cache_v1', JSON.stringify(cachedMap));
      } catch (e) {
        console.error('Failed to save elevation cache:', e);
      }
    };

    const lat4 = lat.toFixed(4);
    const lng4 = lng.toFixed(4);

    // Primary: Open-Meteo Elevation API
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat4}&longitude=${lng4}`);
      if (res.ok) {
        const data = await res.json();
        const elev = data?.elevation?.[0];
        if (typeof elev === 'number' && !isNaN(elev)) {
          saveCache(elev);
          return elev;
        }
      }
    } catch (e) {
      console.error('Open-Meteo elevation API failed:', e);
    }

    // Secondary Fallback: Open-Elevation API (when Open-Meteo returns 503 / Service Unavailable)
    try {
      const res2 = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat4},${lng4}`);
      if (res2.ok) {
        const data2 = await res2.json();
        const elev2 = data2?.results?.[0]?.elevation;
        if (typeof elev2 === 'number' && !isNaN(elev2)) {
          saveCache(elev2);
          return elev2;
        }
      }
    } catch (e) {
      console.error('Open-Elevation API fallback failed:', e);
    }

    return null;
  };

  const fetchCurrentLocation = async () => {
    setLoading(true);
    setError(null);

    const applyCoords = async (coords: GeolocationCoordinates) => {
      const lat = coords.latitude;
      const lng = coords.longitude;
      const alt = coords.altitude ?? (await fetchElevationFallback(lat, lng));
      const acc = coords.accuracy;
      const spd = coords.speed;
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
        speed: spd,
        isOffline: false,
        source: 'gps'
      });
      setLoading(false);
    };

    const fallbackToIpLocation = async () => {
      try {
        const ipRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          const lat = parseFloat(ipData.latitude);
          const lng = parseFloat(ipData.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            const [{ city, state, cityEn, stateEn }, elev] = await Promise.all([
              reverseGeocode(lat, lng),
              fetchElevationFallback(lat, lng)
            ]);
            setLocation({
              latitude: lat,
              longitude: lng,
              city: city || ipData.city || '',
              state: state || ipData.region || '',
              cityEn: cityEn || ipData.city || '',
              stateEn: stateEn || ipData.region || '',
              altitude: elev,
              accuracy: 1000,
              speed: null,
              isOffline: true,
              source: 'ip'
            });
            setError('ip');
          } else {
            setError('location');
          }
        } else {
          setError('location');
        }
      } catch {
        setError('location');
      } finally {
        setLoading(false);
      }
    };

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { applyCoords(pos.coords); },
        () => {
          // Retry once with network/coarse location if high-accuracy GPS timed out
          navigator.geolocation.getCurrentPosition(
            (pos2) => { applyCoords(pos2.coords); },
            () => { fallbackToIpLocation(); },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
          );
        },
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 15000 }
      );
    } else {
      try {
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 8000
        });
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const [{ city, state, cityEn, stateEn }, elev] = await Promise.all([
          reverseGeocode(lat, lng),
          pos.coords.altitude != null ? Promise.resolve(pos.coords.altitude) : fetchElevationFallback(lat, lng)
        ]);
        setLocation({
          latitude: lat,
          longitude: lng,
          city: city || '',
          state: state || '',
          cityEn: cityEn || '',
          stateEn: stateEn || '',
          altitude: elev,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed
        });
      } catch {
        await fallbackToIpLocation();
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  useEffect(() => {
    if (location && location.altitude == null && !isNaN(location.latitude) && !isNaN(location.longitude)) {
      let active = true;
      fetchElevationFallback(location.latitude, location.longitude).then((elev) => {
        if (active && elev !== null) {
          setLocationState((prev) => {
            if (!prev || prev.altitude != null) return prev;
            const updated = { ...prev, altitude: elev };
            try { localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(updated)); } catch (e) { console.error('Failed to save location with altitude:', e); }
            return updated;
          });
        }
      });
      return () => { active = false; };
    }
  }, [location?.latitude, location?.longitude, location?.altitude]);

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

  // True forward azimuth between two GPS points (Course-Over-Ground fallback)
  const calculateBearingDegrees = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;
    const dl = ((lon2 - lon1) * Math.PI) / 180;
    const y = Math.sin(dl) * Math.cos(p2);
    const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  };

  // Continuous GPS watch for live speed and position.
  // Computes real-time speed from Doppler hardware + distance/time delta fallback.
  useEffect(() => {
    if (!liveTracking) {
      lastFixRef.current = null;
      smoothedSpeedRef.current = 0;
      setLocationState((prev) => prev ? { ...prev, speed: 0, gpsHeading: null } : prev);
      return;
    }
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    let watchId: number | null = null;
    let cancelled = false;

    const onWatchSuccess = (pos: GeolocationPosition) => {
      if (cancelled) return;
      const now = pos.timestamp || Date.now();
      const rawLat = pos.coords.latitude;
      const rawLng = pos.coords.longitude;
      const rawSpeed = pos.coords.speed; // hardware speed in m/s (null on many mobile web browsers)
      const rawHeading = pos.coords.heading; // hardware COG in degrees (0-360)

      let calculatedSpeed = 0;
      let dist = 0;
      let calculatedBearing: number | null = null;

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
        if (dist >= 2.5) {
          calculatedBearing = calculateBearingDegrees(
            lastFixRef.current.lat,
            lastFixRef.current.lng,
            rawLat,
            rawLng
          );
        }
      }
      lastFixRef.current = { lat: rawLat, lng: rawLng, time: now };

      const accuracy = typeof pos.coords.accuracy === 'number' && !isNaN(pos.coords.accuracy) ? pos.coords.accuracy : 999;

      // Determine final instantaneous speed:
      let instantSpeed = 0;
      if (typeof rawSpeed === 'number' && !isNaN(rawSpeed) && rawSpeed >= 0) {
        // Hardware Doppler speed is authoritative when available (smartphones with GPS lock)
        instantSpeed = rawSpeed;
      } else if (accuracy <= 15 && dist >= Math.max(accuracy * 0.75, 4.0) && calculatedSpeed >= 0.6) {
        // Only synthesize speed from coordinate displacement if GPS accuracy is tight (<= 15m)
        // and movement exceeds circle of uncertainty.
        // Stationary laptops, desktops, and indoor Wi-Fi triangulation have accuracy > 20m,
        // strictly preventing stationary Wi-Fi jitter from registering false 20+ km/h.
        instantSpeed = calculatedSpeed;
      } else {
        instantSpeed = 0;
      }

      // Noise deadband: speeds < 0.4 m/s (~1.4 km/h) are stationary noise
      if (instantSpeed < 0.4) {
        instantSpeed = 0;
      }

      // Smooth speed with fast-decay EMA:
      if (instantSpeed === 0) {
        smoothedSpeedRef.current = 0;
      } else {
        smoothedSpeedRef.current = smoothedSpeedRef.current * 0.25 + instantSpeed * 0.75;
      }

      const effectiveSpeed = smoothedSpeedRef.current;

      // Determine GPS Course-Over-Ground (valid when moving >= 1.2 m/s ~ 4.3 km/h)
      let nextGpsHeading: number | null = null;
      if (effectiveSpeed >= 1.2) {
        if (typeof rawHeading === 'number' && !isNaN(rawHeading) && rawHeading >= 0) {
          nextGpsHeading = ((rawHeading % 360) + 360) % 360;
        } else if (calculatedBearing !== null) {
          nextGpsHeading = calculatedBearing;
        }
      }

      setLocationState((prev) => {
        if (!prev) {
          return {
            latitude: rawLat,
            longitude: rawLng,
            city: '',
            altitude: pos.coords.altitude ?? null,
            accuracy: pos.coords.accuracy ?? null,
            speed: effectiveSpeed,
            gpsHeading: nextGpsHeading,
          };
        }

        // Subtle coordinate deadband: only update coordinates if moved > 2.0 meters
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
          gpsHeading: effectiveSpeed >= 1.2 ? (nextGpsHeading ?? prev.gpsHeading ?? null) : null,
          isOffline: false,
          source: 'gps'
        };
        try {
          localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(next));
        } catch (e) {
          console.error('Failed to save location cache:', e);
        }
        return next;
      });
    };

    const startWatch = (highAccuracy: boolean) => {
      if (cancelled) return;
      watchId = navigator.geolocation.watchPosition(
        onWatchSuccess,
        (err) => {
          // If high-accuracy GPS times out (code 3) or is unavailable (code 2), downgrade to network watch silently
          if (highAccuracy && (err.code === 3 || err.code === 2)) {
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
            startWatch(false);
          }
        },
        {
          enableHighAccuracy: highAccuracy,
          maximumAge: highAccuracy ? 3000 : 15000,
          timeout: highAccuracy ? 12000 : 25000
        }
      );
    };

    startWatch(true);

    return () => {
      cancelled = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
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
