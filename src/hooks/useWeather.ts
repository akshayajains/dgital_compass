import { useState, useEffect, useRef, useCallback } from 'react';
import { API_CONFIG } from '@/lib/config';
import { getWeatherDescription } from '@/lib/translations';

export interface WeatherData {
  tempC: number;
  tempF: number;
  tempMinC: number;
  tempMaxC: number;
  apparentTempC: number;
  humidity: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  pressureHpa: number;
  precipitationMm: number;
  cloudCoverPct: number;
  condition: string;
  conditionIcon: 'sun' | 'cloud-sun' | 'cloud' | 'rain' | 'thunder';
  uvIndex: number;
  visibilityKm: number;
  lastUpdated: string;
  hourly?: Array<{
    time: string;
    tempC: number;
    condition: string;
    icon: 'sun' | 'cloud-sun' | 'cloud' | 'rain' | 'thunder';
  }>;
}

interface Location {
  latitude: number;
  longitude: number;
  city?: string;
}

/**
 * Weather fetching hook with improved caching.
 * - Grids cache key to 0.5° instead of 0.01° to prevent repeated fetches on GPS drift.
 * - Debounces location-based fetches.
 * - Falls back to cached data on 503/429 errors.
 */
export function useWeather(location: Location | null, language: string) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const weatherCacheRef = useRef<{ [key: string]: { data: WeatherData; timestamp: number } }>({});
  const debounceTimerRef = useRef<number | null>(null);

  // Grid cache key to 0.5° to prevent repeated fetches on GPS drift (2.2)
  const gridKey = useCallback((lat: number, lon: number): string => {
    const gLat = Math.round(lat * 2) / 2; // 0.5° grid
    const gLon = Math.round(lon * 2) / 2;
    return `${gLat},${gLon}`;
  }, []);

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    const cacheKey = gridKey(lat, lon);
    const now = Date.now();
    const cached = weatherCacheRef.current[cacheKey];

    // Memory cache hit within TTL
    if (cached && now - cached.timestamp < API_CONFIG.weather.cacheTtlMs) {
      setWeather(cached.data);
      return;
    }

    // localStorage cache fallback
    if (!cached || now - cached.timestamp >= API_CONFIG.weather.cacheTtlMs) {
      try {
        const stored = localStorage.getItem(`weather_cache_${cacheKey}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (now - parsed.timestamp < API_CONFIG.weather.cacheTtlMs) {
            weatherCacheRef.current[cacheKey] = parsed;
            setWeather(parsed.data);
            return;
          }
        }
      } catch (e) {
        console.error('Weather localStorage cache read failed:', e);
      }
    }

    try {
      const latStr = lat.toFixed(4);
      const lonStr = lon.toFixed(4);
      const res = await fetch(
        `${API_CONFIG.weather.baseUrl}?latitude=${latStr}&longitude=${lonStr}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index,visibility&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_hours=6`
      );

      if (!res.ok) {
        // Fall back to any cached data on 503/429
        const anyCache = Object.values(weatherCacheRef.current)[0];
        if (anyCache) setWeather(anyCache.data);
        return;
      }

      const data = await res.json();
      if (data && data.current) {
        const c = data.current;
        const code = c.weather_code;
        const icon = code === 0 || code === 1 ? 'sun' : (code === 2 ? 'cloud-sun' : (code === 3 ? 'cloud' : (code >= 51 && code <= 67 ? 'rain' : (code >= 95 ? 'thunder' : 'cloud')))) as WeatherData['conditionIcon'];
        const condition = getWeatherDescription(code, language as 'hi' | 'en');
        const nowDate = new Date();

        const hourly = (data.hourly && data.hourly.time && data.hourly.temperature_2m)
          ? data.hourly.time.slice(0, 6).map((t: string, i: number) => {
              const hc = data.hourly.weather_code?.[i] ?? 0;
              const hIcon = (hc === 0 || hc === 1 ? 'sun' : (hc === 2 ? 'cloud-sun' : (hc === 3 ? 'cloud' : (hc >= 51 && hc <= 67 ? 'rain' : (hc >= 95 ? 'thunder' : 'cloud'))))) as WeatherData['conditionIcon'];
              return {
                time: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                tempC: Math.round(data.hourly.temperature_2m[i]),
                condition: getWeatherDescription(hc, language as 'hi' | 'en'),
                icon: hIcon
              };
            })
          : [];

        const weatherObj: WeatherData = {
          tempC: Math.round(c.temperature_2m),
          tempF: Math.round(c.temperature_2m * 9 / 5 + 32),
          tempMinC: data.daily ? Math.round(data.daily.temperature_2m_min[0]) : Math.round(c.temperature_2m),
          tempMaxC: data.daily ? Math.round(data.daily.temperature_2m_max[0]) : Math.round(c.temperature_2m),
          apparentTempC: Math.round(c.apparent_temperature ?? c.temperature_2m),
          humidity: c.relative_humidity_2m,
          windSpeedKmh: Math.round(c.wind_speed_10m),
          windDirectionDeg: c.wind_direction_10m ?? 0,
          pressureHpa: Math.round(c.surface_pressure),
          precipitationMm: c.precipitation ?? 0,
          cloudCoverPct: c.cloud_cover ?? 0,
          condition,
          conditionIcon: icon,
          uvIndex: c.uv_index ?? 0,
          visibilityKm: c.visibility ? Math.round(c.visibility / 1000) : 10,
          lastUpdated: `${nowDate.toLocaleDateString('en-GB')}, ${nowDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          hourly
        };

        setWeather(weatherObj);
        weatherCacheRef.current[cacheKey] = { data: weatherObj, timestamp: Date.now() };
        try {
          localStorage.setItem(`weather_cache_${cacheKey}`, JSON.stringify({ data: weatherObj, timestamp: Date.now() }));
        } catch (e) {
          console.error('Weather localStorage cache write failed:', e);
        }
      }
    } catch (e) {
      console.error('Weather fetch failed:', e);
      // Fallback to cache silently
      const anyCache = Object.values(weatherCacheRef.current)[0];
      if (anyCache) setWeather(anyCache.data);
    }
  }, [gridKey, language]);

  useEffect(() => {
    if (!location) return;

    // Debounce: wait 600ms after location stabilizes before fetching
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      fetchWeather(location.latitude, location.longitude);
    }, 600);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [location?.latitude, location?.longitude, fetchWeather]);

  return weather;
}
