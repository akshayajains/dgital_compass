import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Compass, 
  CircleDot,
  Settings,
  Zap,
  Flashlight as FlashlightIcon,
  Sparkles,
  Camera,
  Target,
  Copy,
  Lock,
  Unlock,
  Bookmark,
  Globe,
  Mountain,
  ChevronRight,
  MapPin,
  Navigation,
  Sun,
  Sunset,
  Sunrise,
  Droplets,
  Wind,
  Gauge,
  Crosshair,
  X,
  Languages,
  Grid,
  Palette,
  Pin,
  Check,
} from 'lucide-react';
import { useSunTimes } from '@/hooks/useSunTimes';
import SunCalc from 'suncalc';
import { cn } from '@/lib/utils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CompassDialRenderer } from '@/components/compass/CompassDialRenderer';
import { COMPASS_STYLES, getDefaultVariantId } from '@/components/compass/CompassStyles';
import { CompassStyleId } from '@/types/compass';
import { getVastuDetails, getWeatherDescription, translations } from '@/lib/translations';
import { AdvancedLevelView } from '@/components/level/AdvancedLevelView';
import { VastuOthersView } from '@/components/vastu/VastuOthersView';
import { CreatorBanner } from '@/components/CreatorBanner';
import { SatelliteCompassView } from '@/components/compass/SatelliteCompassView';
import { TelescopeCameraCompass } from '@/components/compass/TelescopeCameraCompass1';
import { get32Pada } from '@/lib/vastu32Devta';

// Lazy-loaded heavy modals (only fetched when first opened)
const CalibrationGuideModal = React.lazy(() => import('@/components/compass/CalibrationGuideModal').then(m => ({ default: m.CalibrationGuideModal })));
const SensorsInspectorModal = React.lazy(() => import('@/components/compass/SensorsInspectorModal').then(m => ({ default: m.SensorsInspectorModal })));
const StyleSelectorModal = React.lazy(() => import('@/components/compass/StyleSelectorModal').then(m => ({ default: m.StyleSelectorModal })));
const WeatherModal = React.lazy(() => import('@/components/compass/WeatherModal').then(m => ({ default: m.WeatherModal })));
import type { WeatherData } from '@/components/compass/WeatherModal';

const STYLE_STORAGE_KEY = 'com.hcompass.app_style';

export const CompassView = () => {
  const { location, times, liveTracking, toggleLiveTracking } = useSunTimes();
  const { theme } = useTheme();
  const { language, toggleLanguage, setLanguage } = useLanguage();
  const t = translations[language];

  const [heading, setHeading] = useState<number | null>(null);
  const [pitch, setPitch] = useState<number>(3);
  const [roll, setRoll] = useState<number>(0);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showCalibrationModal, setShowCalibrationModal] = useState<boolean>(false);
  const [showSensorsModal, setShowSensorsModal] = useState<boolean>(false);
  const [showStyleModal, setShowStyleModal] = useState<boolean>(false);
  const [mainTab, setMainTab] = useState<'compass' | 'level' | 'vastu'>('compass');
  const [tareOffset, setTareOffset] = useState<{ pitch: number; roll: number } | null>(null);
  const [isHeadingLocked, setIsHeadingLocked] = useState<boolean>(false);
  const [targetHeading, setTargetHeading] = useState<number | null>(null);

  // Satellite Earth Mode States
  // New SatelliteCompassView mode state
  const [satelliteMode, setSatelliteMode] = useState<'standard' | 'telescope' | 'satellite' | 'map'>('satellite');

  // Weather state
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // 12 Trending Styles
  const [selectedStyle, setSelectedStyle] = useState<CompassStyleId>(() => {
    try {
      const saved = localStorage.getItem(STYLE_STORAGE_KEY) as CompassStyleId;
      if (saved && COMPASS_STYLES.some(s => s.id === saved)) return saved;
    } catch {}
    return 'ios_compass';
  });

  // Variant state for grouped themes (ios_compass → ios_white, color_palette → cp_rose)
  const VARIANT_STORAGE_KEY = 'com.hcompass.app_variant';
  const [selectedVariant, setSelectedVariant] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(VARIANT_STORAGE_KEY);
      if (saved) return saved;
    } catch {}
    return getDefaultVariantId(selectedStyle) || null;
  });

  const handleSelectStyle = (id: CompassStyleId) => {
    setSelectedStyle(id);
    try {
      localStorage.setItem(STYLE_STORAGE_KEY, id);
    } catch {}
    // Auto-select default variant for grouped themes
    const defaultVar = getDefaultVariantId(id);
    if (defaultVar) {
      setSelectedVariant(defaultVar);
      try { localStorage.setItem(VARIANT_STORAGE_KEY, defaultVar); } catch {}
    } else {
      setSelectedVariant(null);
      try { localStorage.removeItem(VARIANT_STORAGE_KEY); } catch {}
    }
    triggerHapticFeedback(ImpactStyle.Light);
  };

  const handleSelectVariant = (styleId: CompassStyleId, variantId: string) => {
    setSelectedStyle(styleId);
    setSelectedVariant(variantId);
    try {
      localStorage.setItem(STYLE_STORAGE_KEY, styleId);
      localStorage.setItem(VARIANT_STORAGE_KEY, variantId);
    } catch {}
    triggerHapticFeedback(ImpactStyle.Light);
  };

  // Persisted Preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('com.hcompass.app_sound') !== 'false'; } catch { return true; }
  });

  const [useTrueNorth, setUseTrueNorth] = useState<boolean>(() => {
    try { return localStorage.getItem('com.hcompass.app_true_north') === 'true'; } catch { return false; }
  });

  const [hapticEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('com.hcompass.app_haptic') !== 'false'; } catch { return true; }
  });

  // Always-visible (pin compass) preference
  const [alwaysVisible, setAlwaysVisible] = useState<boolean>(() => {
    try { return localStorage.getItem('com.hcompass.always_visible') === 'true'; } catch { return false; }
  });

  // Vastu Grid Overlay State
  const [vastuGridEnabled, setVastuGridEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('com.hcompass.app_vastu') !== 'false'; } catch { return true; }
  });

  // Flashlight / Torch State
  const [isFlashlightOn, setIsFlashlightOn] = useState<boolean>(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Qibla (Kaaba) Direction Mode State
  const [isQiblaMode, setIsQiblaMode] = useState<boolean>(false);

  // Inline Vastu Suggestions Panel State
  const [showVastuPanel, setShowVastuPanel] = useState<boolean>(false);

  // Weather detail modal
  const [showWeatherModal, setShowWeatherModal] = useState<boolean>(false);

  // Geodesic Qibla Angle Calculation to Makkah (21.4225° N, 39.8262° E)
  const qiblaBearing = useMemo(() => {
    if (!location) return 268;
    const lat1 = (location.latitude * Math.PI) / 180;
    const lon1 = (location.longitude * Math.PI) / 180;
    const lat2 = (21.4225 * Math.PI) / 180;
    const lon2 = (39.8262 * Math.PI) / 180;
    const dLon = lon2 - lon1;
    const y = Math.sin(dLon);
    const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(dLon);
    let qibla = (Math.atan2(y, x) * 180) / Math.PI;
    return Math.round((qibla + 360) % 360);
  }, [location]);

  // Exact Distance to Holy Kaaba (Makkah) in Kilometers
  const qiblaDistanceKm = useMemo(() => {
    if (!location) return 3850;
    const R = 6371;
    const dLat = ((21.4225 - location.latitude) * Math.PI) / 180;
    const dLon = ((39.8262 - location.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((location.latitude * Math.PI) / 180) *
        Math.cos((21.4225 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }, [location]);

  // Fetch real-time Weather
  useEffect(() => {
    if (!location) return;
    // Debounce weather fetch so rapid location changes don't spam the API
    const timer = window.setTimeout(() => {
      const fetchWeather = async () => {
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index,visibility&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
          const data = await res.json();
          if (data && data.current) {
            const c = data.current;
            const code = c.weather_code;
            const icon = code === 0 || code === 1 ? 'sun' : (code === 2 ? 'cloud-sun' : (code === 3 ? 'cloud' : (code >= 51 && code <= 67 ? 'rain' : (code >= 95 ? 'thunder' : 'cloud')))) as 'sun' | 'cloud-sun' | 'cloud' | 'rain' | 'thunder';
            const condition = getWeatherDescription(code, language);
            const now = new Date();
            const hourly = (data.hourly && data.hourly.time && data.hourly.temperature_2m)
              ? data.hourly.time.slice(0, 4).map((t: string, i: number) => ({
                  time: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  tempC: Math.round(data.hourly.temperature_2m[i]),
                  condition: 'Forecast',
                  icon: 'cloud-sun' as const
                }))
              : [];
            setWeather({
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
              lastUpdated: `${now.toLocaleDateString('en-GB')}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              hourly
            });
          }
        } catch (e) {
          console.warn("Weather fetch fallback", e);
        }
      };
      fetchWeather();
    }, 400);
    return () => clearTimeout(timer);
  }, [location?.latitude, location?.longitude]);

  const getWeatherIcon = (code?: number) => {
    if (code === undefined || code === null) return '☀️';
    if (code === 0) return '☀️';
    if (code >= 1 && code <= 3) return '🌤️';
    if (code === 45 || code === 48) return '🌫️';
    if (code >= 51 && code <= 65) return '🌧️';
    if (code >= 80 && code <= 82) return '🌦️';
    if (code >= 95) return '⛈️';
    return '🌤️';
  };

  // Toggle Hardware Flashlight
  const toggleFlashlight = async () => {
    triggerHapticFeedback(ImpactStyle.Medium);
    if (isFlashlightOn) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          try {
            (track as any).applyConstraints?.({ advanced: [{ torch: false }] });
          } catch {}
          track.stop();
        });
        mediaStreamRef.current = null;
      }
      setIsFlashlightOn(false);
      return;
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        });
        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities = typeof (track as any).getCapabilities === 'function' ? (track as any).getCapabilities() : null;
          if (capabilities && capabilities.torch) {
            try {
              await (track as any).applyConstraints({
                advanced: [{ torch: true }]
              });
              mediaStreamRef.current = stream;
            } catch (torchErr) {
              track.stop();
            }
          } else {
            track.stop();
          }
        }
      }
    } catch (err) {
      console.info("Visual torch mode.");
    }

    setIsFlashlightOn(true);
  };

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const dialRef = useRef<HTMLDivElement>(null);
  const isDraggingDialRef = useRef<boolean>(false);
  const longPressRef = useRef<{ x: number; y: number; fired: boolean } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const smoothedVectorRef = useRef<{ x: number; y: number } | null>(null);
  const smoothedPitchRef = useRef<number>(3);
  const smoothedRollRef = useRef<number>(0);
  const usingAbsoluteRef = useRef<boolean>(false);
  const lastRotaryTickRef = useRef<number>(0);

  const declination = useMemo(() => {
    if (!location) return -0.2;
    const lat = location.latitude;
    const lon = location.longitude;
    const calc = (28 - lat) * 0.1 + (lon - 77) * 0.05 - 0.2;
    return parseFloat(calc.toFixed(1));
  }, [location]);

  const triggerHapticFeedback = async (style = ImpactStyle.Light) => {
    if (!hapticEnabled) return;
    try {
      await Haptics.impact({ style });
    } catch {
      if (navigator.vibrate) {
        navigator.vibrate(style === ImpactStyle.Medium ? 50 : 25);
      }
    }
  };

  const playBellSound = (type: 'bell' | 'chime' = 'bell') => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const frequencies = type === 'bell' ? [523.25, 659.25, 783.99] : [587.33, 739.99, 880.00];
      frequencies.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        const startTime = audioCtx.currentTime + idx * 0.08;
        const duration = 1.8;
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.1);
      });
    } catch {}
  };

  const sunPos = useMemo(() => {
    if (!location) return 135;
    try {
      const pos = SunCalc.getPosition(new Date(), location.latitude, location.longitude);
      return (pos.azimuth * 180 / Math.PI) + 180;
    } catch {
      return 135;
    }
  }, [location]);

  const handleOrientation = (event: any, isAbsolute: boolean) => {
    if (isHeadingLocked) return;
    if (!isAbsolute && usingAbsoluteRef.current) return;
    let compassHeading: number | null = null;

    if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
      compassHeading = event.webkitCompassHeading;
    } else if (isAbsolute && event.alpha !== null && event.alpha !== undefined) {
      usingAbsoluteRef.current = true;
      compassHeading = (360 - event.alpha + 360) % 360;
    } else if (!usingAbsoluteRef.current && event.alpha !== null && event.alpha !== undefined) {
      const alpha = event.alpha;
      const beta = event.beta ?? 0;
      const gamma = event.gamma ?? 0;
      const toRad = Math.PI / 180;
      const bRad = beta * toRad;
      const gRad = gamma * toRad;
      const aRad = alpha * toRad;

      const Xh = Math.cos(aRad) * Math.sin(gRad) + Math.sin(aRad) * Math.sin(bRad) * Math.cos(gRad);
      const Yh = Math.sin(aRad) * Math.sin(gRad) - Math.cos(aRad) * Math.sin(bRad) * Math.cos(gRad);
      let head = Math.atan2(Xh, Yh) * (180 / Math.PI);
      if (head < 0) head += 360;
      compassHeading = (head + 360) % 360;
    }

    if (compassHeading !== null) {
      compassHeading = ((compassHeading % 360) + 360) % 360;
      const targetRad = compassHeading * (Math.PI / 180);
      const targetVec = { x: Math.sin(targetRad), y: Math.cos(targetRad) };

      if (!smoothedVectorRef.current) {
        smoothedVectorRef.current = targetVec;
      } else {
        const factor = 0.15;
        smoothedVectorRef.current = {
          x: smoothedVectorRef.current.x + (targetVec.x - smoothedVectorRef.current.x) * factor,
          y: smoothedVectorRef.current.y + (targetVec.y - smoothedVectorRef.current.y) * factor
        };
      }

      const smoothedRad = Math.atan2(smoothedVectorRef.current.x, smoothedVectorRef.current.y);
      let finalHeading = smoothedRad * (180 / Math.PI);
      if (finalHeading < 0) finalHeading += 360;
      setHeading(finalHeading);

      const currentTick = Math.floor(finalHeading / 15);
      if (currentTick !== lastRotaryTickRef.current) {
        lastRotaryTickRef.current = currentTick;
        triggerHapticFeedback(ImpactStyle.Light);
      }
    }

    if (event.beta !== null && event.beta !== undefined) {
      smoothedPitchRef.current += (event.beta - smoothedPitchRef.current) * 0.2;
      setPitch(smoothedPitchRef.current);
    }
    if (event.gamma !== null && event.gamma !== undefined) {
      smoothedRollRef.current += (event.gamma - smoothedRollRef.current) * 0.2;
      setRoll(smoothedRollRef.current);
    }
  };

  useEffect(() => {
    let removeListener: (() => void) | null = null;
    const setupSensors = async () => {
      if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
        try {
          const res = await (DeviceOrientationEvent as any).requestPermission();
          if (res !== 'granted') return;
        } catch {}
      }

      const onAbsolute = (e: any) => handleOrientation(e, true);
      const onStandard = (e: any) => handleOrientation(e, false);

      window.addEventListener('deviceorientationabsolute' as any, onAbsolute, true);
      window.addEventListener('deviceorientation', onStandard, true);

      removeListener = () => {
        window.removeEventListener('deviceorientationabsolute' as any, onAbsolute, true);
        window.removeEventListener('deviceorientation', onStandard, true);
      };
    };

    setupSensors();
    return () => {
      if (removeListener) removeListener();
    };
  }, [isHeadingLocked]);

  const updateHeadingFromPointer = useCallback((clientX: number, clientY: number) => {
    if (isHeadingLocked || !dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    let angle = (Math.atan2(dy, dx) * 180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    setHeading(Math.round(angle));
  }, [isHeadingLocked]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isHeadingLocked) return;
    isDraggingDialRef.current = true;
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch {}
    updateHeadingFromPointer(e.clientX, e.clientY);
    // Long-press to lock heading
    longPressRef.current = { x: e.clientX, y: e.clientY, fired: false };
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = window.setTimeout(() => {
      if (longPressRef.current && !longPressRef.current.fired) {
        longPressRef.current.fired = true;
        setIsHeadingLocked(true);
        triggerHapticFeedback(ImpactStyle.Medium);
        toast.success(language === 'hi' ? 'दिशा लॉक हो गई' : 'Heading Locked');
      }
    }, 600);
  }, [isHeadingLocked, updateHeadingFromPointer, language]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingDialRef.current || isHeadingLocked) return;
    // Cancel long-press if moved significantly
    if (longPressRef.current && !longPressRef.current.fired) {
      const dx = e.clientX - longPressRef.current.x;
      const dy = e.clientY - longPressRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 12) {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        longPressRef.current.fired = true;
      }
    }
    updateHeadingFromPointer(e.clientX, e.clientY);
  }, [isHeadingLocked, updateHeadingFromPointer]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDraggingDialRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressRef.current = null;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
  }, []);

  const displayHeading = useMemo(() => {
    if (targetHeading !== null) return targetHeading;
    if (heading === null) return 76;
    if (!useTrueNorth) return heading;
    return ((heading + declination) % 360 + 360) % 360;
  }, [heading, useTrueNorth, declination, targetHeading]);

  // ── Smooth dial rotation: ease the rendered heading toward the live heading ──
  const [smoothHeading, setSmoothHeading] = useState<number>(displayHeading);
  const smoothHeadingRef = useRef<number>(displayHeading);
  const targetHeadingRef = useRef<number>(displayHeading);
  const rafRef = useRef<number | null>(null);
  const lastCardinalRef = useRef<number>(-1);

  useEffect(() => {
    targetHeadingRef.current = displayHeading;
    if (rafRef.current !== null) return; // animation already running
    const step = () => {
      const current = smoothHeadingRef.current;
      const target = targetHeadingRef.current;
      // Shortest angular path
      let diff = (target - current) % 360;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      const next = current + diff * 0.18; // ease factor
      smoothHeadingRef.current = next;
      setSmoothHeading(next);

      // Haptic tick on cardinal crossing (every 45°)
      const norm = ((next % 360) + 360) % 360;
      const cardinal = Math.round(norm / 45);
      if (cardinal !== lastCardinalRef.current && Math.abs(diff) > 0.5) {
        lastCardinalRef.current = cardinal;
        triggerHapticFeedback(ImpactStyle.Light);
      }

      if (Math.abs(diff) > 0.05) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        smoothHeadingRef.current = target;
        setSmoothHeading(target);
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [displayHeading]);

  const renderedHeading = targetHeading !== null ? targetHeading : smoothHeading;

  const isFacingQibla = useMemo(() => {
    if (displayHeading === null) return false;
    let diff = Math.abs(displayHeading - qiblaBearing);
    if (diff > 180) diff = 360 - diff;
    return diff <= 3.5;
  }, [displayHeading, qiblaBearing]);

  const totalTilt = Math.sqrt(pitch * pitch + roll * roll);
  const isLevel = totalTilt < 1.0;

  const copyCoordinates = async () => {
    triggerHapticFeedback();
    const lat = location ? location.latitude.toFixed(6) : '18.550434';
    const lng = location ? location.longitude.toFixed(6) : '73.920091';
    const vastu = getVastuDetails(displayHeading, language);
    const text = language === 'hi'
      ? `🧭 डिजिटल कंपास 360°:\nदिशा: ${Math.round(displayHeading)}° (${vastu.name})\nअक्षांश/देशांतर: ${lat}°, ${lng}°\nऊंचाई: ${location?.altitude ? Math.round(location.altitude * 3.28084) : 1632} FT`
      : `🧭 Digital Compass 360°:\nHeading: ${Math.round(displayHeading)}° (${vastu.name})\nCoordinates: ${lat}°, ${lng}°\nSea Level: ${location?.altitude ? Math.round(location.altitude * 3.28084) : 1632} FT`;
    
    try {
      if (navigator.share) {
        await navigator.share({ title: t.appTitle, text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success(t.copiedToast);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        toast.success(t.copiedToast);
      } catch {}
    }
  };

  const formatTime = (date: Date | null, fallback: string) => {
    if (!date) return fallback;
    return date.toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const vastuInfo = useMemo(() => getVastuDetails(displayHeading, language), [displayHeading, language]);

  return (
    <div className={cn(
      "w-full min-h-screen flex flex-col items-center pt-3 pb-8 px-4 select-none relative overflow-x-hidden transition-colors duration-300",
      theme === 'light' 
        ? "bg-[radial-gradient(circle_at_50%_-10%,#fff7df_0%,#f6ead2_35%,#e8edf0_100%)] text-stone-900" 
        : "bg-[radial-gradient(circle_at_50%_-10%,#3a1420_0%,#180a10_36%,#07090e_100%)] text-white"
    )}>
      {/* Layered ambient color keeps the home surface premium without hurting contrast. */}
      <div className="absolute -top-16 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-300/30 dark:bg-red-600/14 blur-3xl pointer-events-none" />
      <div className="absolute top-[32rem] -left-24 h-64 w-64 rounded-full bg-cyan-300/20 dark:bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-[48rem] -right-24 h-64 w-64 rounded-full bg-rose-300/20 dark:bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-md flex items-center justify-between py-1 px-1 mb-2 relative z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 p-[2px] shadow-lg shrink-0">
            <img 
              src="/icon.png" 
              alt={t.appTitle} 
              className="w-full h-full rounded-[14px] object-cover" 
            />
          </div>
          <div className="flex flex-col text-left justify-center">
            <h1 className="text-base sm:text-lg font-black tracking-tight leading-snug pt-0.5 pb-0">
              <span className={cn(
                "bg-clip-text text-transparent",
                theme === 'light'
                  ? "bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]"
                  : "bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 drop-shadow-[0_1px_2px_rgba(217,119,6,0.3)]"
              )}>
                DIGITAL{' '}
              </span>
              <span className={cn(
                "bg-clip-text text-transparent",
                theme === 'light'
                  ? "bg-gradient-to-r from-rose-700 via-red-700 to-rose-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]"
                  : "bg-gradient-to-r from-rose-400 via-red-500 to-rose-600 drop-shadow-[0_1px_2px_rgba(220,38,38,0.3)]"
              )}>
                COMPASS
              </span>
            </h1>
            <span className={cn(
              "text-[8.5px] sm:text-[9.5px] font-bold tracking-widest uppercase leading-tight -mt-0.5",
              theme === 'light' ? "text-stone-600" : "text-amber-200/80"
            )}>
              {language === 'hi' ? 'सटीक 360° एवं सैटेलाइट सूट' : 'PRECISION 360° & SATELLITE SUITE'}
            </span>
          </div>
        </div>

        {/* Header Controls: Settings Cog */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setShowSettings(true);
              triggerHapticFeedback();
            }}
            className="p-2 rounded-xl bg-stone-800/80 text-stone-200 hover:text-white border border-white/10 active:scale-95 transition-all shadow-sm"
            title={t.settings}
          >
            <Settings className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </header>

      {/* 3 Mode Navigation Tabs: COMPASS | LEVEL | VASTU & OTHERS */}
      <div className="w-full max-w-sm flex items-center justify-between p-1 rounded-2xl bg-stone-900/90 border border-white/10 mb-2 shadow-inner">
        <button
          onClick={() => {
            setMainTab('compass');
            triggerHapticFeedback();
          }}
          className={cn(
            "flex-1 py-1.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-0.5",
            mainTab === 'compass'
              ? "bg-gradient-to-r from-[#1C2433] via-[#2A3447] to-[#1C2433] text-white border border-white/20 shadow-md scale-100"
              : "text-stone-400 hover:text-white"
          )}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>{t.tabCompass}</span>
        </button>

        <button
          onClick={() => {
            setMainTab('level');
            triggerHapticFeedback();
          }}
          className={cn(
            "flex-1 py-1.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-0.5",
            mainTab === 'level'
              ? "bg-gradient-to-r from-[#1C2433] via-[#2A3447] to-[#1C2433] text-white border border-white/20 shadow-md scale-100"
              : "text-stone-400 hover:text-white"
          )}
        >
          <CircleDot className="w-3.5 h-3.5" />
          <span>{t.tabLevel}</span>
        </button>

        <button
          onClick={() => {
            setMainTab('vastu');
            triggerHapticFeedback();
          }}
          className={cn(
            "flex-1 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-0.5 whitespace-nowrap",
            mainTab === 'vastu'
              ? "bg-gradient-to-r from-[#1C2433] via-[#2A3447] to-[#1C2433] text-white border border-white/20 shadow-md scale-100"
              : "text-stone-400 hover:text-white"
          )}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.tabVastu}</span>
        </button>
      </div>

      {/* Tab 1: COMPASS VIEW */}
      {mainTab === 'compass' && (
        <>
          {/* Theme Header Strip */}
          <div className={cn(
            "w-full max-w-sm flex items-center justify-between text-[9.5px] font-black uppercase tracking-widest px-1 mb-1",
            theme === 'light' ? 'text-stone-700' : 'text-stone-300'
          )}>
            <span>{language === 'hi' ? 'कंपास थीम शैली' : 'COMPASS THEME STYLE'}</span>
            <span className={theme === 'light' ? 'text-stone-600' : 'text-stone-400'}>{language === 'hi' ? 'अधिक के लिए स्क्रॉल करें' : 'SCROLL FOR MORE'}</span>
          </div>

          {/* Horizontal Theme Pill Chips */}
          <div 
            className="w-full max-w-sm flex items-center gap-1.5 mb-1.5 overflow-x-auto no-scrollbar py-0.5 touch-pan-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {COMPASS_STYLES.map((st) => (
              <button
                key={st.id}
                onClick={() => handleSelectStyle(st.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-[10.5px] uppercase font-black tracking-wider whitespace-nowrap transition-all duration-200 shrink-0 border flex items-center gap-1.5",
                  selectedStyle === st.id
                    ? st.id === 'ios_compass'
                      ? "bg-white text-black font-black border-white shadow-[0_0_18px_rgba(255,255,255,0.85)] scale-[1.03]"
                      : st.id === 'satellite_earth'
                      ? "bg-gradient-to-r from-rose-500 to-red-600 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.8)] scale-[1.02]"
                      : st.id === 'vedic_mandala'
                      ? theme === 'light'
                        ? "bg-[#00F0FF]/40 text-teal-900 border-teal-500 shadow-[0_0_15px_rgba(0,240,255,0.5)] scale-[1.02]"
                        : "bg-[#00F0FF]/30 text-teal-200 border-teal-400 shadow-[0_0_15px_rgba(0,240,255,0.6)] scale-[1.02]"
                      : st.id === 'royal_gold'
                      ? "bg-gradient-to-r from-[#8C5F1A] via-[#D4AF37] to-[#E8C547] text-[#1A1008] border-[#E8C547] shadow-[0_0_18px_rgba(212,175,55,0.7)] scale-[1.03] font-black"
                      : st.id === 'color_palette'
                      ? "bg-gradient-to-r from-[#9F1239] via-[#FB7185] to-[#FDA4AF] text-white border-[#FB7185] shadow-[0_0_15px_rgba(251,113,133,0.6)] scale-[1.02]"
                      : "bg-gradient-to-r from-amber-300 to-yellow-400 text-stone-950 border-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.45)] scale-[1.02]"
                    : theme === 'light'
                      ? "bg-white/80 text-stone-700 border-stone-300 hover:text-stone-950 hover:border-stone-400"
                      : "bg-stone-900/90 text-stone-300 border-white/10 hover:text-white hover:border-white/25"
                )}
              >
                <span>
                  {(language === 'hi' ? st.nameHi : st.nameEn).toUpperCase()}
                </span>
              </button>
            ))}
          </div>

          {/* Variant Color Swatches — shown below grouped themes (iOS Compass / Color Palette) */}
          {(() => {
            const activeStyle = COMPASS_STYLES.find(s => s.id === selectedStyle);
            if (!activeStyle?.variants || activeStyle.variants.length === 0) return null;
            return (
              <div className="w-full max-w-sm flex items-center justify-center mb-1.5">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md shadow-lg",
                  theme === 'light'
                    ? "bg-white/85 border-stone-300"
                    : "bg-[#12161F]/90 border-white/10"
                )}>
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest shrink-0",
                    theme === 'light' ? "text-stone-500" : "text-stone-400"
                  )}>
                    {language === 'hi' ? 'रंग' : 'COLOR'}
                  </span>
                  {activeStyle.variants.map((v) => {
                    const isActive = selectedVariant === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => handleSelectVariant(activeStyle.id, v.id)}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center shrink-0 active:scale-90",
                          isActive
                            ? "border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)] scale-110"
                            : theme === 'light'
                              ? "border-stone-400 hover:border-stone-600 hover:scale-105"
                              : "border-white/20 hover:border-white/50 hover:scale-105"
                        )}
                        style={{ backgroundColor: v.colorSwatch }}
                        title={language === 'hi' ? v.nameHi : v.nameEn}
                      >
                        {isActive && (
                          <Check className="w-3 h-3 text-stone-950 stroke-[3]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Satellite Earth Suite Container (NEW SatelliteCompassView) */}
          <div className={cn(alwaysVisible ? 'fixed bottom-6 left-1/2 transform -translate-x-1/2 z-60' : 'relative w-full') }>
          {selectedStyle === 'satellite_earth' ? (
            satelliteMode === 'telescope' ? (
              <div className="w-full flex flex-col items-center">
                <TelescopeCameraCompass
                  heading={displayHeading}
                  pitch={pitch}
                  roll={roll}
                  location={location}
                  language={language}
                  onClose={() => {
                    setSatelliteMode('satellite');
                    triggerHapticFeedback();
                  }}
                />
              </div>
            ) : (
              <SatelliteCompassView
                heading={displayHeading}
                pitch={pitch}
                roll={roll}
                location={location}
                language={language}
                theme={theme}
                magneticField={66}
                mode={satelliteMode}
                onModeChange={(m) => setSatelliteMode(m)}
                onOpenLevel={() => {
                  setMainTab('level');
                  triggerHapticFeedback();
                }}
                onOpenAR={() => {
                  setSatelliteMode('telescope');
                  triggerHapticFeedback();
                }}
                onOpenMap={() => {
                  setSatelliteMode('map');
                  triggerHapticFeedback();
                }}
              />
            )
            ) : (
            /* Regular Dial for Other Styles */
            <CompassDialRenderer
              styleId={selectedStyle}
              language={language}
              displayHeading={renderedHeading}
              pitch={pitch}
              roll={roll}
              sunPos={sunPos}
              isQiblaMode={isQiblaMode}
              qiblaBearing={qiblaBearing}
              qiblaDistanceKm={qiblaDistanceKm}
              isFacingQibla={isFacingQibla}
              vastuGridEnabled={vastuGridEnabled}
              isLevel={isLevel}
              dialRef={dialRef}
              customAccentColor="#EF4444"
              variantId={selectedVariant}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />
          )}
          </div>

          {/* Inline Calibration Nudge — shown when no sensor heading is available */}
          {heading === null && (
            <button
              onClick={() => {
                triggerHapticFeedback();
                setShowCalibrationModal(true);
              }}
              className={cn(
                "w-full max-w-sm flex items-center justify-between gap-2 px-3 py-2 rounded-2xl border text-[10px] font-bold uppercase tracking-wider transition-all active:scale-[0.98] my-1",
                theme === 'light'
                  ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                  : "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
              )}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {language === 'hi' ? 'कैलिब्रेट करने के लिए टैप करें' : 'TAP TO CALIBRATE'}
              </span>
              <span className="text-[9px] opacity-70">{language === 'hi' ? 'सेंसर नहीं मिला' : 'NO SENSOR FIX'}</span>
            </button>
          )}

          {/* Main Crimson Obsidian Dashboard Card */}
          <div className={cn(
            "w-full max-w-sm rounded-[28px] p-4 border flex flex-col gap-3 my-2",
            theme === 'light'
              ? "border-red-200 bg-gradient-to-b from-[#FFF7F7] via-[#FEF2F2] to-[#FDE8E8] shadow-[0_15px_50px_rgba(0,0,0,0.12),0_0_30px_rgba(220,38,38,0.08)] text-stone-900"
              : "border-red-900/60 bg-gradient-to-b from-[#18090C] via-[#120608] to-[#0A0304] shadow-[0_15px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(220,38,38,0.18)] text-white"
          )}>
            
            {/* Top Quick Actions Row */}
            <div className="w-full flex items-center justify-between">
              {/* Primary Tools: Torch, Vastu, Copy, Qibla */}
              <div className="flex items-center gap-1.5">
                {/* Flashlight Torch */}
                <button
                  onClick={toggleFlashlight}
                  className={cn(
                    "w-9 h-9 rounded-xl border flex items-center justify-center active:scale-95 transition-all duration-200",
                    isFlashlightOn 
                      ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_14px_#10b981]" 
                      : (theme === 'light' ? "bg-white border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-400" : "bg-stone-800/80 border-white/12 text-stone-300 hover:text-white hover:border-white/25")
                  )}
                  title={t.torch}
                >
                  <FlashlightIcon className={cn("w-4 h-4", !isFlashlightOn && (theme === 'light' ? "text-amber-600" : "text-amber-400"))} />
                </button>

                {/* Vastu Inline Toggle */}
                <button
                  onClick={() => {
                    setShowVastuPanel(!showVastuPanel);
                    triggerHapticFeedback(ImpactStyle.Light);
                  }}
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all duration-200 border",
                    showVastuPanel
                      ? "bg-amber-500 text-stone-950 border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.6)]"
                      : (theme === 'light' ? "bg-white border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-400" : "bg-stone-800/80 border-white/12 text-stone-300 hover:text-white hover:border-white/25")
                  )}
                  title={language === 'hi' ? 'वास्तु मार्गदर्शन' : 'Vastu Guidance'}
                >
                  <Sparkles className={cn("w-4 h-4", !showVastuPanel && (theme === 'light' ? "text-emerald-600" : "text-emerald-400"))} />
                </button>

                {/* Copy Coordinates */}
                <button
                  onClick={copyCoordinates}
                  className={cn(
                    "w-9 h-9 rounded-xl border flex items-center justify-center active:scale-95 transition-all duration-200",
                    theme === 'light' ? "bg-white border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-400" : "bg-stone-800/80 border-white/12 text-stone-300 hover:text-white hover:border-white/25"
                  )}
                  title={language === 'hi' ? 'कॉपी करें' : 'Copy Coordinates'}
                >
                  <Copy className={cn("w-4 h-4", theme === 'light' ? "text-sky-600" : "text-sky-400")} />
                </button>

                {/* Qibla Toggle */}
                <button
                  onClick={() => {
                    setIsQiblaMode(!isQiblaMode);
                    triggerHapticFeedback(ImpactStyle.Light);
                    toast.info(isQiblaMode ? (language === 'hi' ? 'किबला मोड बंद' : 'Qibla Off') : (language === 'hi' ? `किबला ${qiblaBearing}° पर सक्रिय` : `Qibla at ${qiblaBearing}°`));
                  }}
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all duration-200 border",
                    isQiblaMode
                      ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.6)]"
                      : (theme === 'light' ? "bg-white border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-400" : "bg-stone-800/80 border-white/12 text-stone-300 hover:text-white hover:border-white/25")
                  )}
                  title={language === 'hi' ? 'किबला दिशा' : 'Qibla Direction'}
                >
                  <Navigation className={cn("w-4 h-4", !isQiblaMode && (theme === 'light' ? "text-teal-600" : "text-teal-400"))} />
                </button>
              </div>

              {/* Secondary Tools: Lock, Styles */}
              <div className="flex items-center gap-1.5">
                {/* Lock/Unlock Heading */}
                <button
                  onClick={() => {
                    setIsHeadingLocked(!isHeadingLocked);
                    triggerHapticFeedback(ImpactStyle.Medium);
                    toast.info(isHeadingLocked ? "Heading Unlocked" : "Heading Locked");
                  }}
                  className={cn(
                    "w-9 h-9 rounded-xl border flex items-center justify-center active:scale-95 transition-all duration-200",
                    isHeadingLocked 
                      ? "bg-amber-500 text-stone-950 border-amber-400 shadow-[0_0_14px_#f59e0b]" 
                      : (theme === 'light' ? "bg-white border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-400" : "bg-stone-800/80 border-white/12 text-stone-300 hover:text-white hover:border-white/25")
                  )}
                  title="Lock Heading"
                >
                  {isHeadingLocked ? <Lock className="w-4 h-4" /> : <Unlock className={cn("w-4 h-4", theme === 'light' ? "text-rose-600" : "text-rose-400")} />}
                </button>

                {/* Set Target + Lock */}
                <button
                  onClick={() => {
                    if (targetHeading !== null) {
                      setTargetHeading(null);
                      setIsHeadingLocked(false);
                      toast.info(language === 'hi' ? 'लक्ष्य हटाया गया' : 'Target Cleared');
                    } else {
                      setTargetHeading(displayHeading);
                      setIsHeadingLocked(true);
                      toast.success(language === 'hi' ? `लक्ष्य ${Math.round(displayHeading)}° पर सेट` : `Target set at ${Math.round(displayHeading)}°`);
                    }
                    triggerHapticFeedback(ImpactStyle.Medium);
                  }}
                  className={cn(
                    "w-9 h-9 rounded-xl border flex items-center justify-center active:scale-95 transition-all duration-200",
                    targetHeading !== null
                      ? "bg-amber-500 text-stone-950 border-amber-400 shadow-[0_0_14px_#f59e0b]"
                      : (theme === 'light' ? "bg-white border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-400" : "bg-stone-800/80 border-white/12 text-stone-300 hover:text-white hover:border-white/25")
                  )}
                  title={language === 'hi' ? 'लक्ष्य सेट करें' : 'Set Target'}
                >
                  <Target className={cn("w-4 h-4", targetHeading === null && (theme === 'light' ? "text-orange-600" : "text-orange-400"))} />
                </button>

                {/* Pin / Always Visible */}
                <button
                  onClick={() => {
                    const next = !alwaysVisible;
                    setAlwaysVisible(next);
                    try { localStorage.setItem('com.hcompass.always_visible', next.toString()); } catch {}
                    triggerHapticFeedback();
                  }}
                  className={cn(
                    "w-9 h-9 rounded-xl border flex items-center justify-center active:scale-95 transition-all duration-200",
                    alwaysVisible
                      ? "bg-amber-500 text-stone-950 border-amber-400 shadow-[0_0_14px_#f59e0b]"
                      : (theme === 'light' ? "bg-white border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-400" : "bg-stone-800/80 border-white/12 text-stone-300 hover:text-white hover:border-white/25")
                  )}
                  title={language === 'hi' ? 'हमेशा दिखाएं' : 'Pin (Always Visible)'}
                >
                  <Pin className={cn("w-4 h-4", !alwaysVisible && (theme === 'light' ? "text-violet-600" : "text-violet-400"))} />
                </button>

                {/* Vastu Report */}
                <button
                  onClick={() => {
                    setMainTab('vastu');
                    triggerHapticFeedback();
                  }}
                  className={cn(
                    "w-9 h-9 rounded-xl border flex items-center justify-center active:scale-95 transition-all duration-200",
                    theme === 'light' ? "bg-white border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-400" : "bg-stone-800/80 border-white/12 text-stone-300 hover:text-white hover:border-white/25"
                  )}
                  title={language === 'hi' ? 'वास्तु रिपोर्ट' : 'Vastu Report'}
                >
                  <Bookmark className={cn("w-4 h-4", theme === 'light' ? "text-fuchsia-600" : "text-fuchsia-400")} />
                </button>
              </div>
            </div>

            {/* Center Heading Readout */}
            {selectedStyle === 'vedic_mandala' ? (
              <div className={cn(
                "w-full p-2.5 rounded-2xl border flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.8)] my-1",
                theme === 'light' ? "bg-white border-amber-500/40 text-stone-900" : "bg-[#14120E] border-amber-500/50 text-white"
              )}>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-black text-xs border border-amber-500/40">
                    {get32Pada(displayHeading).code} • {get32Pada(displayHeading).nameHi}
                  </span>
                  <span className={cn("text-xs font-mono font-bold", theme === 'light' ? "text-stone-600" : "text-stone-300")}>
                    {get32Pada(displayHeading).startDeg.toFixed(1)}° - {get32Pada(displayHeading).endDeg.toFixed(1)}°
                  </span>
                </div>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                  get32Pada(displayHeading).isAuspicious
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_8px_#10b981]"
                    : "bg-rose-950/70 text-rose-300 border-rose-500/40 shadow-sm"
                )}>
                  {get32Pada(displayHeading).isAuspicious ? "AUSPICIOUS" : "INAUSPICIOUS"}
                </span>
              </div>
            ) : (
              (() => {
                // Theme-aware center readout box — each theme gets its own colors
                // Direction name (localized)
                const dirName = language === 'hi'
                  ? vastuInfo.name.split(' ')[0]
                  : (vastuInfo.code === 'E' ? 'EAST' : vastuInfo.code === 'N' ? 'NORTH' : vastuInfo.code === 'S' ? 'SOUTH' : vastuInfo.code === 'W' ? 'WEST' : vastuInfo.name.split(' ')[0].toUpperCase());

                // Box background + text colors per theme
                const box = (() => {
                  switch (selectedStyle) {
                    case 'sandalwood':
                      return { bg: 'bg-gradient-to-r from-[#FAF3E8] via-[#F3E6D3] to-[#E9D4B8]', border: 'border-[#C9A67E]', heading: 'text-[#3E2718]', dir: 'text-red-700', btn: 'bg-[#3E2718]/10 hover:bg-[#3E2718]/15 border-[#8C6239]/40 text-[#5C3A1E]' };
                    case 'royal_gold':
                      return { bg: 'bg-gradient-to-r from-[#3b2a12] via-[#2a1c0c] to-[#1a1008]', border: 'border-[#D4AF37]/60', heading: 'text-[#F7E8A0]', dir: 'text-[#E8C547]', btn: 'bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border-[#D4AF37]/50 text-[#F7E8A0]' };
                    case 'cyberpunk':
                      return { bg: 'bg-gradient-to-r from-[#050b14] via-[#0a0f1e] to-[#100520]', border: 'border-cyan-400/50', heading: 'text-cyan-300', dir: 'text-fuchsia-400', btn: 'bg-cyan-400/10 hover:bg-cyan-400/20 border-cyan-400/40 text-cyan-300' };
                    case 'minimal_onyx':
                      return { bg: 'bg-gradient-to-r from-[#18181B] via-[#101013] to-[#09090B]', border: 'border-white/15', heading: 'text-white', dir: 'text-stone-300', btn: 'bg-white/5 hover:bg-white/10 border-white/20 text-stone-300' };
                    case 'tactical_ops':
                      return { bg: 'bg-gradient-to-r from-[#0F1710] via-[#0C120D] to-[#0A0E0B]', border: 'border-green-500/50', heading: 'text-green-400', dir: 'text-orange-400', btn: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/40 text-green-300' };
                    case 'cosmic_galaxy':
                      return { bg: 'bg-gradient-to-r from-[#110B29] via-[#0D0820] to-[#070314]', border: 'border-indigo-400/50', heading: 'text-indigo-200', dir: 'text-purple-300', btn: 'bg-indigo-400/10 hover:bg-indigo-400/20 border-indigo-400/40 text-indigo-200' };
                    case 'satellite_earth':
                      return { bg: 'bg-gradient-to-r from-[#1E293B] via-[#16202E] to-[#0F172A]', border: 'border-sky-400/50', heading: 'text-sky-200', dir: 'text-red-400', btn: 'bg-sky-400/10 hover:bg-sky-400/20 border-sky-400/40 text-sky-200' };
                    case 'ios_compass':
                      return { bg: 'bg-gradient-to-r from-[#161C24] via-[#1F2937] to-[#0B0F14]', border: 'border-slate-400/40', heading: 'text-slate-100', dir: 'text-red-400', btn: 'bg-slate-400/10 hover:bg-slate-400/20 border-slate-400/40 text-slate-200' };
                    case 'color_palette':
                      return { bg: 'bg-gradient-to-r from-[#1a1a1f] via-[#141419] to-[#0d0d10]', border: 'border-white/15', heading: 'text-white', dir: 'text-red-400', btn: 'bg-white/5 hover:bg-white/10 border-white/20 text-stone-300' };
                    default:
                      return { bg: 'bg-gradient-to-r from-[#1a1a1f] via-[#141419] to-[#0d0d10]', border: 'border-white/15', heading: 'text-white', dir: 'text-red-400', btn: 'bg-white/5 hover:bg-white/10 border-white/20 text-stone-300' };
                  }
                })();

                return (
                  <div className={cn("w-full p-2.5 rounded-2xl border flex items-center justify-between shadow-md my-1", box.bg, box.border)}>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-3xl sm:text-4xl font-black font-serif animate-heading-glow", box.heading)}>
                        {displayHeading !== null ? Math.round(displayHeading) : 80}°
                      </span>
                      <span className={cn("text-sm sm:text-base font-black font-serif", box.dir)}>
                        {dirName} ({vastuInfo.code})
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setUseTrueNorth(!useTrueNorth);
                        triggerHapticFeedback();
                      }}
                      className={cn("px-2.5 py-1 rounded-full border text-[9.5px] font-black uppercase tracking-wider transition-colors shadow-sm", box.btn)}
                    >
                      {useTrueNorth ? 'True North' : 'Magnetic'}
                    </button>
                  </div>
                );
              })()
            )}

            {/* GPS Coordinates & Accuracy */}
            <div className={cn("w-full flex items-center justify-between text-xs pt-1 border-t", theme === 'light' ? "border-stone-200" : "border-white/10")}>
              <button
                onClick={copyCoordinates}
                className={cn("flex items-center gap-1.5 font-mono font-bold hover:opacity-80 transition-colors", theme === 'light' ? "text-amber-700" : "text-amber-300 hover:text-amber-200")}
              >
                <Globe className={cn("w-3.5 h-3.5", theme === 'light' ? "text-amber-600" : "text-amber-400")} />
                <div className="flex flex-col items-start text-left">
                  <span className={cn("text-[9px] font-bold uppercase tracking-wider", theme === 'light' ? "text-stone-500" : "text-stone-400")}>
                    {location?.city
                      ? `${language === 'hi' ? location.city : (location.cityEn || location.city)}${location.state ? `, ${language === 'hi' ? location.state : (location.stateEn || location.state)}` : ''}`
                      : ''}
                  </span>
                  <span className="text-[10px] font-mono font-bold opacity-80">
                    {location ? `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°` : '18.5504°, 73.9201°'}
                  </span>
                </div>
              </button>

              <div className="flex items-center gap-2">
                {location?.accuracy != null ? (
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-wider flex items-center gap-1",
                    location.accuracy <= 15
                      ? (theme === 'light' ? "text-emerald-700" : "text-emerald-400")
                      : location.accuracy <= 50
                      ? (theme === 'light' ? "text-amber-700" : "text-amber-400")
                      : "text-red-400"
                  )}>
                    <Crosshair className="w-3 h-3" />
                    <span>{location.accuracy <= 15 ? 'HIGH' : location.accuracy <= 50 ? 'MED' : 'LOW'} ACC ±{Math.round(location.accuracy)}m</span>
                  </span>
                ) : (
                  <span className={cn("text-[9px] font-black uppercase tracking-wider flex items-center gap-1", theme === 'light' ? "text-emerald-700" : "text-emerald-400")}>
                    <Crosshair className="w-3 h-3" />
                    <span>HIGH ACC</span>
                  </span>
                )}
                <span className={cn("text-[9px] font-bold uppercase tracking-wider flex items-center gap-1", theme === 'light' ? "text-stone-500" : "text-stone-400")}>
                  <Mountain className={cn("w-3 h-3", theme === 'light' ? "text-stone-400" : "text-stone-500")} />
                  <span>SEA LEVEL: {location?.altitude ? Math.round(location.altitude * 3.28084) : 1632} FT</span>
                </span>
              </div>
              {/* Speed readout — always visible, prominent for driving. Tap to toggle live GPS tracking. */}
              <button
                onClick={() => { toggleLiveTracking(); triggerHapticFeedback(ImpactStyle.Light); }}
                title={liveTracking
                  ? (language === 'hi' ? 'लाइव ट्रैकिंग चालू — बंद करने के लिए टैप करें' : 'Live tracking ON — tap to stop')
                  : (language === 'hi' ? 'लाइव ट्रैकिंग बंद — चालू करने के लिए टैप करें' : 'Live tracking OFF — tap to start')}
                className={cn(
                  "px-2.5 py-1 rounded-xl border text-[11px] font-black flex items-center gap-1.5 shrink-0 active:scale-95 transition-all",
                  liveTracking
                    ? (theme === 'light' ? "bg-emerald-500 text-white border-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.4)]" : "bg-emerald-500 text-stone-950 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]")
                    : (theme === 'light' ? "bg-emerald-100 border-emerald-400 text-emerald-800 hover:bg-emerald-200" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20")
                )}
              >
                <Gauge className={cn("w-3.5 h-3.5", liveTracking && "animate-pulse")} />
                <span className="font-mono">{location?.speed != null ? Math.round(location.speed * 3.6) : 0} <span className="text-[8px] font-bold uppercase tracking-wider">km/h</span></span>
                {/* Clear state + affordance indicator */}
                <span className={cn(
                  "text-[7.5px] font-black uppercase tracking-wider px-1 py-0.5 rounded-md border",
                  liveTracking
                    ? (theme === 'light' ? "bg-white/25 text-white border-white/40" : "bg-stone-950/20 text-stone-950 border-stone-950/30")
                    : (theme === 'light' ? "bg-amber-100 text-amber-800 border-amber-400" : "bg-amber-500/20 text-amber-300 border-amber-500/40")
                )}>
                  {liveTracking ? (language === 'hi' ? 'लाइव' : 'LIVE') : (language === 'hi' ? 'चालू करें' : 'TAP')}
                </span>
              </button>
            </div>

            {/* Surface Level: Pitch, Roll + Open Level Tab */}
            <div className={cn("w-full flex items-center justify-between text-xs pt-1 border-t", theme === 'light' ? "border-stone-200" : "border-white/10")}>
              <div className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                <div className="flex flex-col items-start text-left">
                  <span className={cn("text-[9px] font-bold uppercase tracking-wider", theme === 'light' ? "text-stone-500" : "text-stone-400")}>
                    {language === 'hi' ? 'सतह स्तर' : 'SURFACE LEVEL'}
                  </span>
                  <span className={cn("text-[10px] font-mono font-bold", theme === 'light' ? "text-stone-600" : "text-stone-300")}>
                    PITCH {pitch.toFixed(1)}° • ROLL {roll.toFixed(1)}°
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setMainTab('level');
                  triggerHapticFeedback();
                }}
                className={cn(
                  "px-3 py-1 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors",
                  theme === 'light' ? "bg-emerald-100 border-emerald-400 text-emerald-800 hover:bg-emerald-200" : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                )}
              >
                <Gauge className="w-3 h-3" />
                <span>{language === 'hi' ? 'खोलें' : 'OPEN'}</span>
              </button>
            </div>

            {/* Solar Cycle Times: RISE | NOON | SET */}
            <div className={cn("w-full flex items-center justify-between text-[10px] font-bold px-1 font-mono", theme === 'light' ? "text-stone-600" : "text-stone-300")}>
              <div className={cn("flex items-center gap-1", theme === 'light' ? "text-amber-700" : "text-amber-400")}>
                <Sunrise className="w-3.5 h-3.5" />
                <span>RISE: {formatTime(times.sunrise, '06:21 AM')}</span>
              </div>
              <div className={cn("flex items-center gap-1", theme === 'light' ? "text-amber-700" : "text-amber-300")}>
                <Sun className={cn("w-3.5 h-3.5", theme === 'light' ? "text-amber-500" : "text-yellow-400")} />
                <span>NOON: {formatTime(times.solarNoon, '12:35 PM')}</span>
              </div>
              <div className={cn("flex items-center gap-1", theme === 'light' ? "text-purple-700" : "text-purple-400")}>
                <Sunset className="w-3.5 h-3.5" />
                <span>SET: {formatTime(times.sunset, '06:50 PM')}</span>
              </div>
            </div>

            {/* Weather Telemetry Row (click to open detail) */}
            <button
              onClick={() => { setShowWeatherModal(true); triggerHapticFeedback(); }}
              className={cn(
                "w-full flex items-center justify-between text-[10.5px] font-bold pt-2 border-t rounded-lg transition-colors",
                theme === 'light' ? "border-stone-200 text-stone-700 hover:bg-stone-100/60" : "border-white/10 text-stone-300 hover:bg-white/[0.03]"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm leading-none">{weather ? (weather.conditionIcon === 'sun' ? '☀️' : weather.conditionIcon === 'cloud-sun' ? '🌤️' : weather.conditionIcon === 'cloud' ? '☁️' : weather.conditionIcon === 'rain' ? '🌧️' : '⛈️') : '☀️'}</span>
                <span className="font-mono uppercase text-[10px] font-bold">
                  {weather ? `${weather.tempC}°C • ${weather.condition.toUpperCase()}` : '24°C • PARTLY CLOUDY'}
                </span>
              </div>

              <div className={cn("flex items-center gap-3 font-mono text-[10px] font-bold", theme === 'light' ? "text-stone-500" : "text-stone-400")}>
                <span className="flex items-center gap-1">
                  <Droplets className={cn("w-3 h-3", theme === 'light' ? "text-sky-600" : "text-sky-400")} />
                  {weather ? `${weather.humidity}%` : '82%'}
                </span>
                <span className="flex items-center gap-1">
                  <Wind className={cn("w-3 h-3", theme === 'light' ? "text-teal-600" : "text-teal-400")} />
                  {weather ? `${weather.windSpeedKmh} km/h` : '15 km/h'}
                </span>
                <span className="flex items-center gap-1">
                  <Gauge className={cn("w-3 h-3", theme === 'light' ? "text-red-600" : "text-red-400")} />
                  {weather ? `${weather.pressureHpa} hPa` : '947 hPa'}
                </span>
                <ChevronRight className={cn("w-3 h-3", theme === 'light' ? "text-stone-400" : "text-stone-500")} />
              </div>
            </button>

          </div>

          {/* Inline Vastu Suggestions Panel — shown when Vastu button tapped */}
          {showVastuPanel && (
            <div className="w-full max-w-sm rounded-[22px] border border-amber-500/40 bg-gradient-to-b from-[#1A1408] via-[#140F06] to-[#0A0804] shadow-[0_12px_40px_rgba(0,0,0,0.9),0_0_20px_rgba(245,158,11,0.15)] p-4 flex flex-col gap-3 my-1.5 text-white animate-in slide-in-from-top-2 fade-in duration-300">
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                      {language === 'hi' ? 'वास्तु मार्गदर्शन' : 'VASTU GUIDANCE'}
                    </span>
                    <p className="text-[9px] text-stone-400 font-medium">
                      {language === 'hi' ? 'आपकी वर्तमान दिशा के लिए सुझाव' : 'Suggestions for your current heading'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVastuPanel(false)}
                  className="p-1.5 rounded-full bg-white/5 border border-white/10 text-stone-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Current Direction Info */}
              <div className="w-full p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300/70">
                    {language === 'hi' ? 'वर्तमान दिशा' : 'Current Direction'}
                  </span>
                  <span className="text-sm font-black text-amber-400">
                    {Math.round(displayHeading)}° — {vastuInfo.name}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                    {language === 'hi' ? 'तत्व' : 'Element'}
                  </span>
                  <span className="text-[11px] font-bold text-stone-300">{vastuInfo.element}</span>
                </div>
              </div>

              {/* Vastu Suggestions Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Room Recommendation */}
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-400/80">
                    {language === 'hi' ? 'उपयुक्त कमरा' : 'Ideal Room'}
                  </span>
                  <span className="text-[11px] font-bold text-white leading-tight">
                    {vastuInfo.code === 'N' ? (language === 'hi' ? 'कोषागार / कार्यालय' : 'Treasury / Office') 
                      : vastuInfo.code === 'NE' ? (language === 'hi' ? 'मंदिर / ध्यान कक्ष' : 'Prayer / Meditation')
                      : vastuInfo.code === 'E' ? (language === 'hi' ? 'मुख्य प्रवेश द्वार' : 'Main Entrance')
                      : vastuInfo.code === 'SE' ? (language === 'hi' ? 'रसोई / अग्नि स्थान' : 'Kitchen / Fire Zone')
                      : vastuInfo.code === 'S' ? (language === 'hi' ? 'मास्टर बेडरूम' : 'Master Bedroom')
                      : vastuInfo.code === 'SW' ? (language === 'hi' ? 'भंडारण / भारी सामान' : 'Storage / Heavy Items')
                      : vastuInfo.code === 'W' ? (language === 'hi' ? 'बच्चों का कमरा' : "Children's Room")
                      : (language === 'hi' ? 'अध्ययन कक्ष' : 'Study Room')}
                  </span>
                </div>

                {/* Deity / Ruling Energy */}
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400/80">
                    {language === 'hi' ? 'शासक ऊर्जा' : 'Ruling Energy'}
                  </span>
                  <span className="text-[11px] font-bold text-white leading-tight">
                    {vastuInfo.deity}
                  </span>
                  <span className="text-[9px] text-stone-400 leading-tight">
                    {vastuInfo.vastuDesc}
                  </span>
                </div>

                {/* Tip / Do */}
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400/80">
                    {language === 'hi' ? 'करें' : 'DO'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-200 leading-tight">
                    {vastuInfo.code === 'N' ? (language === 'hi' ? 'उत्तर दिशा में तिजोरी रखें, कुबेर मंत्र का जाप करें' : 'Place treasury in North, chant Kuber mantra')
                      : vastuInfo.code === 'NE' ? (language === 'hi' ? 'पूजा कक्ष यहां बनाएं, रोज़ प्रार्थना करें' : 'Build prayer room here, pray daily')
                      : vastuInfo.code === 'E' ? (language === 'hi' ? 'मुख्य द्वार पूर्व में खोलें' : 'Open main entrance facing East')
                      : vastuInfo.code === 'SE' ? (language === 'hi' ? 'रसोई यहां बनाएं, अग्नि तत्व रखें' : 'Place kitchen here, fire element')
                      : vastuInfo.code === 'S' ? (language === 'hi' ? 'मास्टर बेडरूम दक्षिण में बनाएं' : 'Master bedroom in South')
                      : vastuInfo.code === 'SW' ? (language === 'hi' ? 'भारी फर्नीचर यहां रखें' : 'Place heavy furniture here')
                      : vastuInfo.code === 'W' ? (language === 'hi' ? 'पश्चिम में बच्चों का कमरा' : "Children's room in West")
                      : (language === 'hi' ? 'पूर्व-उत्तर में अध्ययन कक्ष' : 'Study in North-East')}
                  </span>
                </div>

                {/* Don't */}
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-rose-400/80">
                    {language === 'hi' ? 'न करें' : "DON'T"}
                  </span>
                  <span className="text-[10px] font-bold text-rose-200 leading-tight">
                    {vastuInfo.code === 'N' ? (language === 'hi' ? 'दक्षिण में जल न रखें' : 'No water body in South')
                      : vastuInfo.code === 'NE' ? (language === 'hi' ? 'शौचालय या भारी सामान न रखें' : 'No toilet or heavy items')
                      : vastuInfo.code === 'E' ? (language === 'hi' ? 'भारी दीवार न बनाएं' : 'No heavy walls blocking')
                      : vastuInfo.code === 'SE' ? (language === 'hi' ? 'पानी का स्रोत न रखें' : 'No water source here')
                      : vastuInfo.code === 'S' ? (language === 'hi' ? 'मुख्य द्वार न बनाएं' : 'No main entrance')
                      : vastuInfo.code === 'SW' ? (language === 'hi' ? 'जल या मंदिर न रखें' : 'No water or temple')
                      : vastuInfo.code === 'W' ? (language === 'hi' ? 'कचरा घर न बनाएं' : 'No waste area')
                      : (language === 'hi' ? 'रसोई न बनाएं' : 'No kitchen here')}
                  </span>
                </div>
              </div>

              {/* Location Context */}
              <div className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[10px] text-stone-300 font-medium">
                  {language === 'hi' 
                    ? `${location?.city || '—'} में ${vastuInfo.code} दिशा ${vastuInfo.vastuTitle} — ${vastuInfo.deity} का प्रभाव क्षेत्र`
                    : `In ${location?.city || '—'}, ${vastuInfo.code} direction is ${vastuInfo.vastuTitle} — ruled by ${vastuInfo.deity}`}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab 2: ADVANCED SPIRIT LEVEL VIEW */}
      {mainTab === 'level' && (
        <AdvancedLevelView
          pitch={pitch}
          roll={roll}
          tareOffset={tareOffset}
          onToggleTare={() => {
            if (tareOffset) setTareOffset(null);
            else setTareOffset({ pitch, roll });
          }}
          theme={theme}
          triggerHaptic={triggerHapticFeedback}
          onCalibrate={() => { setShowCalibrationModal(true); triggerHapticFeedback(); }}
          playSound={playBellSound}
        />
      )}

      {/* Tab 3: VASTU & OTHERS VIEW */}
      {mainTab === 'vastu' && (
        <VastuOthersView
          currentHeading={displayHeading}
          pitch={pitch}
          roll={roll}
          sunPos={sunPos}
          isLevel={isLevel}
          selectedStyle={selectedStyle}
          customAccentColor="#EF4444"
          variantId={selectedVariant}
          dialRef={dialRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          weather={weather}
          location={location}
          declination={declination}
          triggerHaptic={() => triggerHapticFeedback(ImpactStyle.Light)}
          onCopyCoordinates={copyCoordinates}
          onToggleTorch={toggleFlashlight}
          isTorchOn={isFlashlightOn}
        />
      )}

      {/* Creator Branding Card: Shown for compass & level tabs */}
      {mainTab !== 'vastu' && <CreatorBanner />}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className={cn(
            "w-full max-w-sm p-5 rounded-3xl border shadow-2xl flex flex-col gap-3.5 z-50 animate-in zoom-in-95",
            theme === 'light' ? "bg-white border-stone-200 text-stone-900" : "bg-[#14120E] border-white/15 text-white"
          )}>
            <div className="flex items-center justify-between pb-2 border-b border-stone-200/40 dark:border-white/10">
              <span className="text-sm font-black tracking-wide text-amber-500">{t.settings}</span>
              <button 
                onClick={() => setShowSettings(false)}
                className={cn(
                  "p-1.5 rounded-full transition-colors",
                  theme === 'light' ? "hover:bg-stone-200" : "hover:bg-white/10"
                )}
              >
                <X className="w-4 h-4 text-stone-400" />
              </button>
            </div>

            {/* Language Switch */}
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-amber-500" />
                {t.language}
              </span>
              <div className={cn(
                "flex items-center p-0.5 rounded-xl border",
                theme === 'light' ? "bg-stone-100 border-stone-300" : "bg-stone-800 border-white/10"
              )}>
                <button
                  onClick={() => setLanguage('hi')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all",
                    language === 'hi' ? "bg-amber-500 text-stone-950" : (theme === 'light' ? "text-stone-500" : "text-stone-400")
                  )}
                >
                  हिंदी
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all",
                    language === 'en' ? "bg-amber-500 text-stone-950" : (theme === 'light' ? "text-stone-500" : "text-stone-400")
                  )}
                >
                  English
                </button>
              </div>
            </div>

            {/* 12 Styles Gallery Trigger */}
            <div className={cn(
              "flex items-center justify-between text-xs font-bold pt-2 border-t",
              theme === 'light' ? "border-stone-200" : "border-white/5"
            )}>
              <span className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-500" />
                {t.styles}
              </span>
              <button
                onClick={() => {
                  triggerHapticFeedback();
                  setShowSettings(false);
                  setShowStyleModal(true);
                }}
                className={cn(
                  "px-3 py-1 rounded-xl text-[10px] font-black uppercase border transition-all",
                  theme === 'light'
                    ? "bg-amber-100 text-amber-800 border-amber-400 hover:bg-amber-200"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                )}>
                {language === 'hi' ? '12+ शैलियां देखें' : 'View 12+ Styles'}
              </button>
            </div>

            {/* Vastu Grid Toggle */}
            <div className={cn(
              "flex items-center justify-between text-xs font-bold pt-2 border-t",
              theme === 'light' ? "border-stone-200" : "border-white/5"
            )}>
              <span className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-amber-500" />
                {t.vastuGrid}
              </span>
              <button
                onClick={() => {
                  triggerHapticFeedback();
                  const next = !vastuGridEnabled;
                  setVastuGridEnabled(next);
                  localStorage.setItem('com.hcompass.app_vastu', next.toString());
                }}
                className={cn(
                  "px-3 py-1 rounded-xl text-[10px] font-black uppercase transition-all",
                  vastuGridEnabled ? "bg-amber-500 text-stone-950" : (theme === 'light' ? "bg-stone-200 text-stone-600" : "bg-stone-800 text-stone-400")
                )}
              >
                {vastuGridEnabled ? (language === 'hi' ? "चालू" : "ON") : (language === 'hi' ? "बंद" : "OFF")}
              </button>
            </div>

            {/* Sensor Diagnostics */}
            <div className={cn(
              "flex items-center justify-between text-xs font-bold pt-2 border-t",
              theme === 'light' ? "border-stone-200" : "border-white/5"
            )}>
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                {t.sensorDiagnostics}
              </span>
              <button
                onClick={() => {
                  triggerHapticFeedback();
                  setShowSettings(false);
                  setShowSensorsModal(true);
                }}
                className={cn(
                  "px-3 py-1 rounded-xl text-[10px] font-black uppercase border transition-all",
                  theme === 'light'
                    ? "bg-emerald-100 text-emerald-800 border-emerald-400 hover:bg-emerald-200"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                )}>
                {t.check}
              </button>
            </div>

            {/* Calibration Guide */}
            <div className={cn(
              "flex items-center justify-between text-xs font-bold pt-2 border-t",
              theme === 'light' ? "border-stone-200" : "border-white/5"
            )}>
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                {t.calibrationGuide}
              </span>
              <button
                onClick={() => {
                  triggerHapticFeedback();
                  setShowSettings(false);
                  setShowCalibrationModal(true);
                }}
                className={cn(
                  "px-3 py-1 rounded-xl text-[10px] font-black uppercase border transition-all",
                  theme === 'light'
                    ? "bg-amber-100 text-amber-800 border-amber-400 hover:bg-amber-200"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                )}>
                {t.view}
              </button>
            </div>

            {/* Theme Switcher */}
            <div className={cn(
              "flex items-center justify-between text-xs font-bold pt-2 border-t",
              theme === 'light' ? "border-stone-200" : "border-white/5"
            )}>
              <span>{t.themeMode}</span>
              <ThemeToggle />
            </div>

            {/* Always Visible (Pin Compass) */}
            <div className={cn(
              "flex items-center justify-between text-xs font-bold pt-2 border-t",
              theme === 'light' ? "border-stone-200" : "border-white/5"
            )}>
              <span>Always Visible</span>
              <button
                onClick={() => {
                  const next = !alwaysVisible;
                  setAlwaysVisible(next);
                  try { localStorage.setItem('com.hcompass.always_visible', next.toString()); } catch {}
                }}
                className={cn(
                  "px-3 py-1 rounded-xl text-[10px] font-black uppercase transition-all",
                  alwaysVisible ? "bg-amber-500 text-stone-950" : (theme === 'light' ? "bg-stone-200 text-stone-600" : "bg-stone-800 text-stone-400")
                )}
              >
                {alwaysVisible ? (language === 'hi' ? 'देखते रहें' : 'Pinned') : (language === 'hi' ? 'बंद' : 'Off')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sensors Inspector Modal */}
      {showSensorsModal && (
        <React.Suspense fallback={null}>
          <SensorsInspectorModal 
            isOpen={showSensorsModal} 
            onClose={() => setShowSensorsModal(false)}
            theme={theme}
            language={language}
            heading={heading}
            pitch={pitch}
            roll={roll}
          />
        </React.Suspense>
      )}

      {/* Calibration Guide Modal */}
      {showCalibrationModal && (
        <React.Suspense fallback={null}>
          <CalibrationGuideModal
            isOpen={showCalibrationModal}
            onClose={() => setShowCalibrationModal(false)}
            theme={theme}
            language={language}
          />
        </React.Suspense>
      )}

      {/* Style Selector Modal */}
      {showStyleModal && (
        <React.Suspense fallback={null}>
          <StyleSelectorModal
            isOpen={showStyleModal}
            onClose={() => setShowStyleModal(false)}
            selectedStyle={selectedStyle}
            onSelectStyle={handleSelectStyle}
            language={language}
            theme={theme}
            selectedVariantId={selectedVariant}
            onSelectVariant={handleSelectVariant}
          />
        </React.Suspense>
      )}

      {/* Weather Detail Modal */}
      <React.Suspense fallback={null}>
        <WeatherModal
          isOpen={showWeatherModal}
          onClose={() => setShowWeatherModal(false)}
          language={language}
          theme={theme}
          weather={weather}
          cityName={location?.city}
          latitude={location?.latitude}
          longitude={location?.longitude}
        />
      </React.Suspense>
    </div>
  );
};
