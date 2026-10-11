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
  SunMedium,
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
  Share2,
  Clock,
  Thermometer,
  Timer,
  Vibrate,
  MoonStar,
  AlertTriangle,
  Volume2,
  VolumeX,
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
import { CreatorBanner } from '@/components/CreatorBanner';
import { get32Pada, VastuPada32 } from '@/lib/vastu32Devta';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Share } from '@capacitor/share';
import { DevtaPadaModal } from '@/components/compass/DevtaPadaModal';
import { calculateMagneticDeclination } from '@/lib/wmmDeclination';

// Lazy-loaded heavy views (only fetched when their tab is first opened)
const AdvancedLevelView = React.lazy(() => import('@/components/level/AdvancedLevelView').then(m => ({ default: m.AdvancedLevelView })));
const VastuOthersView = React.lazy(() => import('@/components/vastu/VastuOthersView').then(m => ({ default: m.VastuOthersView })));
const SatelliteCompassView = React.lazy(() => import('@/components/compass/SatelliteCompassView').then(m => ({ default: m.SatelliteCompassView })));
const TelescopeCameraCompass = React.lazy(() => import('@/components/compass/TelescopeCameraCompass1').then(m => ({ default: m.TelescopeCameraCompass })));

// Lazy-loaded heavy modals (only fetched when first opened)
const CalibrationGuideModal = React.lazy(() => import('@/components/compass/CalibrationGuideModal').then(m => ({ default: m.CalibrationGuideModal })));
const SensorsInspectorModal = React.lazy(() => import('@/components/compass/SensorsInspectorModal').then(m => ({ default: m.SensorsInspectorModal })));
const StyleSelectorModal = React.lazy(() => import('@/components/compass/StyleSelectorModal').then(m => ({ default: m.StyleSelectorModal })));
const WeatherModal = React.lazy(() => import('@/components/compass/WeatherModal').then(m => ({ default: m.WeatherModal })));
const FeatureExplorerModal = React.lazy(() => import('@/components/compass/FeatureExplorerModal').then(m => ({ default: m.FeatureExplorerModal })));
import type { WeatherData } from '@/components/compass/WeatherModal';

const STYLE_STORAGE_KEY = 'com.spiritual.compass.app_style';
const CARDINAL_SNAP_ANGLES = [0, 90, 180, 270];

export const CompassView = () => {
  const { location, times, liveTracking, toggleLiveTracking, loading: locationLoading, error: locationError } = useSunTimes();
  const { theme } = useTheme();
  const { language, toggleLanguage, setLanguage } = useLanguage();
  const t = translations[language];

  const [heading, setHeading] = useState<number | null>(null);
  const [pitch, setPitch] = useState<number>(0);
  const [roll, setRoll] = useState<number>(0);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showCalibrationModal, setShowCalibrationModal] = useState<boolean>(false);
  const [showSensorsModal, setShowSensorsModal] = useState<boolean>(false);
  const [showStyleModal, setShowStyleModal] = useState<boolean>(false);
  const [showWeatherModal, setShowWeatherModal] = useState<boolean>(false);
  const [showFeatureExplorer, setShowFeatureExplorer] = useState<boolean>(false);
  const [activeVastuSubTab, setActiveVastuSubTab] = useState<'vastu' | 'jyotish' | 'numerology' | 'sadhana' | 'feng_shui' | 'qibla'>('vastu');
  const [openARSignal, setOpenARSignal] = useState<number>(0);
  const [openFloorPlanSignal, setOpenFloorPlanSignal] = useState<number>(0);
  const [satelliteMode, setSatelliteMode] = useState<'standard' | 'telescope' | 'satellite' | 'map'>('satellite');
  const [selectedPadaModal, setSelectedPadaModal] = useState<VastuPada32 | null>(null);
  const [mainTab, setMainTab] = useState<'compass' | 'level' | 'vastu'>('compass');
  const [tareOffset, setTareOffset] = useState<{ pitch: number; roll: number } | null>(() => {
    try {
      const raw = localStorage.getItem('com.spiritual.compass.app_tare_offset');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.pitch === 'number' && typeof parsed?.roll === 'number') {
          return parsed;
        }
      }
    } catch {}
    return null;
  });
  const [isHeadingLocked, setIsHeadingLocked] = useState<boolean>(false);
  const [targetHeading, setTargetHeading] = useState<number | null>(null);
  const [magneticFlux, setMagneticFlux] = useState<number | null>(null);
  const [isMagneticInterference, setIsMagneticInterference] = useState<boolean>(false);
  const lastCardinalSoundTimeRef = useRef<number>(0);
  const lastCardinalSnapTimeRef = useRef<number>(0);
  const userInteractedRef = useRef<boolean>(false);

  // Screen Keep-Awake WakeLock Integration
  useEffect(() => {
    let wakeLockSentinel: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && (navigator as any).wakeLock) {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        }
      } catch {}
    };

    requestWakeLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLockSentinel && typeof wakeLockSentinel.release === 'function') {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, []);

  // Android Hardware Back Button Handler
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cleanupPromise: Promise<any> | null = null;
    try {
      cleanupPromise = App.addListener('backButton', ({ canGoBack }) => {
        if (selectedPadaModal !== null) {
          setSelectedPadaModal(null);
          return;
        }
        if (showFeatureExplorer) {
          setShowFeatureExplorer(false);
          return;
        }
        if (showWeatherModal) {
          setShowWeatherModal(false);
          return;
        }
        if (showSensorsModal) {
          setShowSensorsModal(false);
          return;
        }
        if (showCalibrationModal) {
          setShowCalibrationModal(false);
          return;
        }
        if (showStyleModal) {
          setShowStyleModal(false);
          return;
        }
        if (satelliteMode === 'telescope') {
          setSatelliteMode('satellite');
          return;
        }
        if (mainTab !== 'compass') {
          setMainTab('compass');
          return;
        }
        if (canGoBack) {
          window.history.back();
        } else {
          App.exitApp();
        }
      });
    } catch (e) {
      // Not supported
    }

    return () => {
      if (cleanupPromise) {
        cleanupPromise.then((handle) => {
          if (handle && typeof handle.remove === 'function') {
            handle.remove();
          }
        }).catch(() => {});
      }
    };
  }, [
    selectedPadaModal,
    showWeatherModal,
    showSensorsModal,
    showCalibrationModal,
    showStyleModal,
    satelliteMode,
    mainTab
  ]);

  useEffect(() => {
    const markInteracted = () => {
      userInteractedRef.current = true;
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
            audioCtxRef.current = new AudioContextClass();
          }
          if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume().catch(() => {});
          }
        }
      } catch {}
    };
    window.addEventListener('pointerdown', markInteracted, { passive: true });
    window.addEventListener('touchstart', markInteracted, { passive: true });
    window.addEventListener('keydown', markInteracted, { passive: true });
    window.addEventListener('click', markInteracted, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', markInteracted);
      window.removeEventListener('touchstart', markInteracted);
      window.removeEventListener('keydown', markInteracted);
      window.removeEventListener('click', markInteracted);
    };
  }, []);

  // Weather state
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // 12 Trending Styles
  const [selectedStyle, setSelectedStyle] = useState<CompassStyleId>(() => {
    try {
      const saved = localStorage.getItem(STYLE_STORAGE_KEY) as CompassStyleId;
      if (saved && COMPASS_STYLES.some(s => s.id === saved)) return saved;
    } catch {}
    return 'color_palette';
  });

  // Variant state for grouped themes (ios_compass → ios_white, color_palette → cp_rose)
  const VARIANT_STORAGE_KEY = 'com.spiritual.compass.app_variant';
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
    try { return localStorage.getItem('com.spiritual.compass.app_sound') !== 'false'; } catch { return true; }
  });
  const soundEnabledRef = useRef<boolean>(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastTickSoundTimeRef = useRef<number>(0);
  const lastSpokenCardinalIndexRef = useRef<number>(-1);

  const [useTrueNorth, setUseTrueNorth] = useState<boolean>(() => {
    try { return localStorage.getItem('com.spiritual.compass.app_true_north') !== 'false'; } catch { return true; }
  });

  const [needleTracksNorth, setNeedleTracksNorth] = useState<boolean>(() => {
    try { return localStorage.getItem('com.spiritual.compass.needle_tracks_north') === 'true'; } catch { return false; }
  });

  const [hapticEnabled, setHapticEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('com.spiritual.compass.app_haptic') !== 'false'; } catch { return true; }
  });

  // ── Settings: units, haptics, keep-awake (feature 12) ──
  const [tempUnit, setTempUnit] = useState<'c' | 'f'>(() => {
    try { return localStorage.getItem('com.spiritual.compass.app_temp_unit') === 'f' ? 'f' : 'c'; } catch { return 'c'; }
  });
  const [speedUnit, setSpeedUnit] = useState<'kmh' | 'mph'>(() => {
    try { return localStorage.getItem('com.spiritual.compass.app_speed_unit') === 'mph' ? 'mph' : 'kmh'; } catch { return 'kmh'; }
  });
  const [altUnit, setAltUnit] = useState<'ft' | 'm'>(() => {
    try { return localStorage.getItem('com.spiritual.compass.app_alt_unit') === 'm' ? 'm' : 'ft'; } catch { return 'ft'; }
  });
  const toggleAltUnit = useCallback(() => {
    setAltUnit(prev => {
      const next = prev === 'ft' ? 'm' : 'ft';
      try { localStorage.setItem('com.spiritual.compass.app_alt_unit', next); } catch {}
      return next;
    });
    triggerHapticFeedback(ImpactStyle.Light);
  }, []);
  const [timeFormat, setTimeFormat] = useState<'12' | '24'>(() => {
    try { return localStorage.getItem('com.spiritual.compass.app_time_format') === '24' ? '24' : '12'; } catch { return '12'; }
  });
  const [keepAwake, setKeepAwake] = useState<boolean>(() => {
    try { return localStorage.getItem('com.spiritual.compass.app_keep_awake') === 'true'; } catch { return false; }
  });

  // Keep screen awake while app is open (Web Wake Lock API — works in Android WebView)
  useEffect(() => {
    let wakeLock: any = null;
    const request = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch {}
    };
    if (keepAwake) request();
    const onVis = () => {
      if (keepAwake && document.visibilityState === 'visible') request();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      try { wakeLock?.release?.(); } catch {}
    };
  }, [keepAwake]);

  // Always-visible (pin compass) preference
  const [alwaysVisible, setAlwaysVisible] = useState<boolean>(() => {
    try { return localStorage.getItem('com.spiritual.compass.always_visible') === 'true'; } catch { return false; }
  });

  // Vastu Grid Overlay State
  const [vastuGridEnabled, setVastuGridEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('com.spiritual.compass.app_vastu') !== 'false'; } catch { return true; }
  });

  // Flashlight / Torch State
  const [isFlashlightOn, setIsFlashlightOn] = useState<boolean>(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Qibla (Kaaba) Direction Mode State
  const [isQiblaMode, setIsQiblaMode] = useState<boolean>(false);

  // Inline Vastu Suggestions Panel State
  const [showVastuPanel, setShowVastuPanel] = useState<boolean>(false);

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
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index,visibility&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_hours=6`);
          if (!res.ok) {
            return;
          }
          const data = await res.json();
          if (data && data.current) {
            const c = data.current;
            const code = c.weather_code;
            const icon = code === 0 || code === 1 ? 'sun' : (code === 2 ? 'cloud-sun' : (code === 3 ? 'cloud' : (code >= 51 && code <= 67 ? 'rain' : (code >= 95 ? 'thunder' : 'cloud')))) as 'sun' | 'cloud-sun' | 'cloud' | 'rain' | 'thunder';
            const condition = getWeatherDescription(code, language);
            const now = new Date();
            const hourly = (data.hourly && data.hourly.time && data.hourly.temperature_2m)
              ? data.hourly.time.slice(0, 6).map((t: string, i: number) => {
                  const hc = data.hourly.weather_code?.[i] ?? 0;
                  const hIcon = (hc === 0 || hc === 1 ? 'sun' : (hc === 2 ? 'cloud-sun' : (hc === 3 ? 'cloud' : (hc >= 51 && hc <= 67 ? 'rain' : (hc >= 95 ? 'thunder' : 'cloud'))))) as 'sun' | 'cloud-sun' | 'cloud' | 'rain' | 'thunder';
                  return {
                    time: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    tempC: Math.round(data.hourly.temperature_2m[i]),
                    condition: getWeatherDescription(hc, language),
                    icon: hIcon
                  };
                })
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
  const smoothedVectorRef = useRef<{ x: number; y: number } | null>(null);
  const smoothedPitchRef = useRef<number>(0);
  const smoothedRollRef = useRef<number>(0);
  const usingAbsoluteRef = useRef<boolean>(false);
  const usingNativeSensorRef = useRef<boolean>(false);
  // Ref-based callbacks for sensor handlers — avoids stale closure re-registration on every render
  const handleOrientationRef = useRef<((event: any, isAbsolute: boolean) => void) | null>(null);
  const handleNativeCompassRef = useRef<((h: number, p: number, r: number, flux: number, acc: number) => void) | null>(null);
  // iOS / Android compass accuracy (degrees of uncertainty; >25 means figure-8 calibration needed)
  const [compassAccuracy, setCompassAccuracy] = useState<number | null>(null);
  // NOAA throttle: track last fetch location to avoid redundant API calls
  const lastDeclinationFetchRef = useRef<{ lat: number; lon: number; time: number } | null>(null);

  // Live clock tick so the sun position and solar countdown stay fresh (updates every 30s)
  const [nowTick, setNowTick] = useState<number>(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  // Magnetic declination — offline WMM calculation with NOAA online refinement
  const [declination, setDeclination] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('com.spiritual.compass.app_declination');
      if (saved !== null && !isNaN(parseFloat(saved))) return parseFloat(saved);
    } catch {}
    return -0.2;
  });

  useEffect(() => {
    if (!location) return;
    const lat = location.latitude;
    const lon = location.longitude;

    // High-precision offline World Magnetic Model (WMM) calculation
    const wmmDec = calculateMagneticDeclination(lat, lon);
    setDeclination(wmmDec);
    try { localStorage.setItem('com.spiritual.compass.app_declination', wmmDec.toString()); } catch {}
  }, [location?.latitude, location?.longitude]);

  const triggerHapticFeedback = async (style = ImpactStyle.Light) => {
    if (!hapticEnabled) return;
    // Chromium User Activation guard: prevent "[Intervention] Blocked call to navigator.vibrate"
    const hasActivation = typeof navigator !== 'undefined' && (
      Boolean((navigator as any).userActivation?.hasBeenActive) ||
      userInteractedRef.current
    );
    if (!hasActivation) return;

    try {
      await Haptics.impact({ style });
    } catch {
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(style === ImpactStyle.Medium ? 50 : 25);
        }
      } catch {}
    }
  };

  const playBellSound = (type: 'tick' | 'bell' | 'chime' | 'singingBowl' = 'bell', forcePlay = false) => {
    if (!forcePlay && !soundEnabledRef.current) return;
    const hasActivation = forcePlay || (typeof navigator !== 'undefined' && (
      Boolean((navigator as any).userActivation?.hasBeenActive) ||
      userInteractedRef.current
    ));
    if (!hasActivation) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContextClass();
      }
      const audioCtx = audioCtxRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }

      if (type === 'tick') {
        // Crisp horological mechanical tick when dial rotates across 5° marks
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(420, audioCtx.currentTime + 0.018);
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.018);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.02);
        return;
      }

      if (type === 'singingBowl') {
        // Tibetan Singing Bowl Harmonic Tone: 432 Hz root, 864 Hz harmonic octave, 1296 Hz shimmer
        const harmonics = [
          { freq: 432.0, gain: 0.24, decay: 2.6, delay: 0 },
          { freq: 433.2, gain: 0.18, decay: 2.4, delay: 0.01 },
          { freq: 864.0, gain: 0.12, decay: 1.9, delay: 0.02 },
          { freq: 1296.0, gain: 0.06, decay: 1.4, delay: 0.03 },
        ];
        harmonics.forEach(h => {
          const osc = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          osc.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          osc.frequency.value = h.freq;
          osc.type = 'sine';
          const startTime = audioCtx.currentTime + h.delay;
          gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
          gainNode.gain.linearRampToValueAtTime(h.gain, startTime + 0.03);
          gainNode.gain.exponentialRampToValueAtTime(0.0005, startTime + h.decay);
          osc.start(startTime);
          osc.stop(startTime + h.decay + 0.1);
        });
        return;
      }

      const frequencies = type === 'bell' ? [523.25, 659.25, 783.99] : [587.33, 739.99, 880.00];
      frequencies.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        const startTime = audioCtx.currentTime + idx * 0.07;
        const duration = 1.4;
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
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
  }, [location, nowTick]);

  const applySmoothedHeading = (rawHeading: number) => {
    const compassHeading = ((rawHeading % 360) + 360) % 360;
    const targetRad = compassHeading * (Math.PI / 180);
    const targetVec = { x: Math.sin(targetRad), y: Math.cos(targetRad) };

    if (!smoothedVectorRef.current) {
      smoothedVectorRef.current = targetVec;
      setHeading(compassHeading);
    } else {
      const prevHeading = ((Math.atan2(smoothedVectorRef.current.x, smoothedVectorRef.current.y) * (180 / Math.PI)) + 360) % 360;
      const deltaDeg = Math.abs(((compassHeading - prevHeading + 540) % 360) - 180);

      // Deadband of 0.45° filters out magnetometer micro-tremor & sensor thermal noise
      if (deltaDeg >= 0.45) {
        // Adaptive fluid factor: subtle smooth response for gentle movements (0.16),
        // gracefully scaling up for deliberate phone rotations (up to 0.45)
        const factor = Math.min(0.45, Math.max(0.16, deltaDeg * 0.05));
        smoothedVectorRef.current = {
          x: smoothedVectorRef.current.x + (targetVec.x - smoothedVectorRef.current.x) * factor,
          y: smoothedVectorRef.current.y + (targetVec.y - smoothedVectorRef.current.y) * factor
        };

        const smoothedRad = Math.atan2(smoothedVectorRef.current.x, smoothedVectorRef.current.y);
        const finalHeading = (smoothedRad * (180 / Math.PI) + 360) % 360;
        setHeading(finalHeading);
      }
    }
  };

  // Native Android Hardware Sensor Fusion Callback (from MainActivity.java SensorManager)
  const handleNativeCompass = (
    nativeHeading: number,
    nativePitch: number,
    nativeRoll: number,
    nativeFlux: number,
    nativeAcc: number
  ) => {
    usingNativeSensorRef.current = true;
    if (isHeadingLocked) return;

    if (!isNaN(nativeHeading) && nativeHeading >= 0) {
      applySmoothedHeading(nativeHeading);
    }

    if (!isNaN(nativePitch)) {
      const diffBeta = Math.abs(nativePitch - smoothedPitchRef.current);
      if (diffBeta >= 0.15) {
        smoothedPitchRef.current += (nativePitch - smoothedPitchRef.current) * 0.28;
        const nextPitch = Math.abs(smoothedPitchRef.current) < 0.08 ? 0 : Math.round(smoothedPitchRef.current * 10) / 10;
        setPitch(nextPitch);
      }
    }

    if (!isNaN(nativeRoll)) {
      const diffGamma = Math.abs(nativeRoll - smoothedRollRef.current);
      if (diffGamma >= 0.15) {
        smoothedRollRef.current += (nativeRoll - smoothedRollRef.current) * 0.28;
        const nextRoll = Math.abs(smoothedRollRef.current) < 0.08 ? 0 : Math.round(smoothedRollRef.current * 10) / 10;
        setRoll(nextRoll);
      }
    }

    if (nativeFlux > 0) {
      const roundedFlux = Math.round(nativeFlux);
      setMagneticFlux(roundedFlux);
      const isAnomalousFlux = roundedFlux > 75 || roundedFlux < 20;
      const isLowAccuracy = nativeAcc >= 0 && nativeAcc <= 1; // SENSOR_STATUS_UNRELIABLE (0) or LOW (1)
      setIsMagneticInterference(isAnomalousFlux || isLowAccuracy);
    }

    // Map Android SensorManager accuracy (3=HIGH, 2=MEDIUM, 1=LOW, 0=UNRELIABLE) to degree uncertainty
    if (nativeAcc >= 0) {
      const mappedAcc = nativeAcc === 3 ? 5 : nativeAcc === 2 ? 15 : 35;
      setCompassAccuracy(mappedAcc);
    }
  };
  handleNativeCompassRef.current = handleNativeCompass;

  const handleOrientation = (event: any, isAbsolute: boolean) => {
    // If native Android hardware sensor fusion is active, ignore WebView orientation events completely
    if (usingNativeSensorRef.current) return;
    if (isHeadingLocked) return;

    const hasIOSHeading = event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null;
    // Only trust geomagnetic absolute orientation events (deviceorientationabsolute or explicit event.absolute === true)
    // NEVER use non-absolute gyroscope-only alpha for compass heading — its 0° is an arbitrary startup direction!
    const isGeomagneticAbsolute = isAbsolute || event.absolute === true;

    if (isAbsolute) {
      usingAbsoluteRef.current = true;
    }

    if (event.webkitCompassAccuracy !== undefined && event.webkitCompassAccuracy !== null) {
      setCompassAccuracy(event.webkitCompassAccuracy);
      if (event.webkitCompassAccuracy < 0 || event.webkitCompassAccuracy > 25) {
        setIsMagneticInterference(true);
      } else if (magneticFlux === null) {
        setIsMagneticInterference(false);
      }
    }

    let compassHeading: number | null = null;

    if (hasIOSHeading) {
      // iOS: webkitCompassHeading is already tilt-compensated magnetic north (0–360°, CW)
      compassHeading = event.webkitCompassHeading;
    } else if (isGeomagneticAbsolute && event.alpha !== null && event.alpha !== undefined) {
      // W3C DeviceOrientation 3D Rotation Matrix R = Z(alpha) * X'(beta) * Y''(gamma)
      // Computes true 3D tilt- & gimbal-lock-compensated compass heading without 180° flips when held upright
      const degToRad = Math.PI / 180;
      const alphaRad = event.alpha * degToRad;
      const betaRad = (event.beta ?? 0) * degToRad;
      const gammaRad = (event.gamma ?? 0) * degToRad;

      const cA = Math.cos(alphaRad);
      const sA = Math.sin(alphaRad);
      const cB = Math.cos(betaRad);
      const sB = Math.sin(betaRad);
      const cG = Math.cos(gammaRad);
      const sG = Math.sin(gammaRad);

      // Device +Y axis (screen top edge) in Earth frame (X=East, Y=North, Z=Up)
      const yEast = -sA * cB;
      const yNorth = cA * cB;
      const yUp = sB;

      // Device -Z axis (back of phone / camera forward vector) in Earth frame
      const negZEast = -cA * sG - sA * sB * cG;
      const negZNorth = -sA * sG + cA * sB * cG;
      const zUp = cB * cG;

      // Smoothly blend +Y (when phone is flat) and -Z (when phone is held upright / tilted past 90°)
      const wY = Math.max(0, zUp);
      const wZ = Math.max(0, yUp);

      let fEast: number;
      let fNorth: number;
      if (wY + wZ > 0.1) {
        fEast = wY * yEast + wZ * negZEast;
        fNorth = wY * yNorth + wZ * negZNorth;
      } else {
        fEast = yEast;
        fNorth = yNorth;
      }

      if (fEast * fEast + fNorth * fNorth > 1e-6) {
        compassHeading = ((Math.atan2(fEast, fNorth) * (180 / Math.PI)) + 360) % 360;
      } else {
        compassHeading = (360 - event.alpha + 360) % 360;
      }

      // Screen orientation compensation (portrait=0, landscape-right=90, etc.)
      const screenAngle = (typeof window !== 'undefined' && window.screen?.orientation?.angle !== undefined)
        ? window.screen.orientation.angle
        : (typeof (window as any)?.orientation === 'number' ? (window as any).orientation : 0);

      if (screenAngle !== 0) {
        compassHeading = (compassHeading + screenAngle + 360) % 360;
      }
    }

    if (compassHeading !== null) {
      applySmoothedHeading(compassHeading);
    }

    // Pitch & roll can safely update from either absolute or standard event (skip standard if absolute is active)
    if (!isAbsolute && usingAbsoluteRef.current) return;

    if (event.beta !== null && event.beta !== undefined) {
      const diffBeta = Math.abs(event.beta - smoothedPitchRef.current);
      if (diffBeta >= 0.15) {
        smoothedPitchRef.current += (event.beta - smoothedPitchRef.current) * 0.25;
        setPitch(Math.abs(smoothedPitchRef.current) < 0.08 ? 0 : Math.round(smoothedPitchRef.current * 10) / 10);
      }
    }
    if (event.gamma !== null && event.gamma !== undefined) {
      const diffGamma = Math.abs(event.gamma - smoothedRollRef.current);
      if (diffGamma >= 0.15) {
        smoothedRollRef.current += (event.gamma - smoothedRollRef.current) * 0.25;
        setRoll(Math.abs(smoothedRollRef.current) < 0.08 ? 0 : Math.round(smoothedRollRef.current * 10) / 10);
      }
    }
  };
  handleOrientationRef.current = handleOrientation;

  useEffect(() => {
    let removeListener: (() => void) | null = null;

    // Register Native Android Hardware Sensor Fusion bridge on window
    (window as any).__onNativeCompassUpdate = (
      h: number,
      p: number,
      r: number,
      flux: number,
      acc: number
    ) => {
      handleNativeCompassRef.current?.(h, p, r, flux, acc);
    };

    const setupSensors = async () => {
      if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
        try {
          const res = await (DeviceOrientationEvent as any).requestPermission();
          if (res !== 'granted') return;
        } catch {}
      }

      const onAbsolute = (e: any) => handleOrientationRef.current?.(e, true);
      const onStandard = (e: any) => handleOrientationRef.current?.(e, false);

      // Register absolute FIRST so it takes priority over standard events
      window.addEventListener('deviceorientationabsolute' as any, onAbsolute, true);
      window.addEventListener('deviceorientation', onStandard, true);

      // Raw Magnetometer API for direct metal / magnetic interference detection (Web fallback)
      let magSensor: any = null;
      if (typeof window !== 'undefined' && 'Magnetometer' in window) {
        try {
          magSensor = new (window as any).Magnetometer({ frequency: 10 });
          magSensor.addEventListener('reading', () => {
            if (usingNativeSensorRef.current) return;
            const { x, y, z } = magSensor;
            if (x !== undefined && y !== undefined && z !== undefined) {
              const flux = Math.round(Math.sqrt(x * x + y * y + z * z));
              setMagneticFlux(flux);
              // Earth natural magnetic flux is 30 - 65 uT. Strong local metal / EMI causes > 75 uT or near-zero collapse
              setIsMagneticInterference(flux > 75 || (flux < 20 && flux > 0));
            }
          });
          magSensor.addEventListener('error', () => {});
          magSensor.start();
        } catch {}
      }

      removeListener = () => {
        window.removeEventListener('deviceorientationabsolute' as any, onAbsolute, true);
        window.removeEventListener('deviceorientation', onStandard, true);
        if (magSensor) {
          try { magSensor.stop(); } catch {}
        }
      };
    };

    setupSensors();
    return () => {
      delete (window as any).__onNativeCompassUpdate;
      if (removeListener) removeListener();
    };
  }, []);

  // Dial is read-only — pointer events are intentionally no-ops
  const handlePointerDown = useCallback((_e: React.PointerEvent) => {}, []);
  const handlePointerMove = useCallback((_e: React.PointerEvent) => {}, []);
  const handlePointerUp = useCallback((_e: React.PointerEvent) => {}, []);

  // Re-center: clear smoothed vector so next sensor event snaps to true current heading.
  // Also unlocks heading if it was locked. Like Google Maps' re-center button.
  const handleRecenter = useCallback(() => {
    smoothedVectorRef.current = null;
    if (isHeadingLocked) setIsHeadingLocked(false);
    triggerHapticFeedback(ImpactStyle.Medium);
    toast.success(language === 'hi' ? 'कंपास पुनः केंद्रित हुआ ✓' : 'Compass Re-centered ✓');
  }, [isHeadingLocked, language]);

  const handleSelectPada = useCallback((pada: VastuPada32) => {
    triggerHapticFeedback(ImpactStyle.Light);
    setSelectedPadaModal(pada);
  }, []);

  const displayHeading = useMemo(() => {
    if (heading === null) return 0;
    if (!useTrueNorth) return heading;
    return ((heading + declination) % 360 + 360) % 360;
  }, [heading, useTrueNorth, declination]);

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
      // Premium fluid damping — 0.16 ease factor delivers luxurious fluid-damped compass motion without nervous jitter
      const easeFactor = 0.16;
      const next = current + diff * easeFactor;
      smoothHeadingRef.current = next;
      setSmoothHeading(Math.round(next * 10) / 10);

      // Track 5° crossing for mechanical watchmaker tick sound (only on deliberate turning, diff > 1.2°)
      const norm = ((next % 360) + 360) % 360;
      const cardinal = Math.round(norm / 5);
      if (cardinal !== lastCardinalRef.current && Math.abs(diff) > 1.2) {
        lastCardinalRef.current = cardinal;
        const nowMs = Date.now();
        if (nowMs - lastTickSoundTimeRef.current >= 90) {
          lastTickSoundTimeRef.current = nowMs;
          playBellSound('tick');
        }
      }

      // 8-Direction Audio & Haptic Feedback: N (0°), NE (45°), E (90°), SE (135°), S (180°), SW (225°), W (270°), NW (315°)
      const nearestOctant = Math.round(norm / 45) % 8;
      const octantAngle = nearestOctant * 45;
      let distToOctant = Math.abs(norm - octantAngle);
      if (distToOctant > 180) distToOctant = 360 - distToOctant;

      if (distToOctant <= 2.2) {
        if (lastSpokenCardinalIndexRef.current !== nearestOctant && Date.now() - lastCardinalSoundTimeRef.current > 900) {
          lastSpokenCardinalIndexRef.current = nearestOctant;
          lastCardinalSoundTimeRef.current = Date.now();
          if (nearestOctant === 0) {
            // Pure North (0°): Sacred Tibetan Singing Bowl
            playBellSound('singingBowl');
            triggerHapticFeedback(ImpactStyle.Medium);
          } else if (nearestOctant % 2 === 0) {
            // Principal Cardinals: East (90°), South (180°), West (270°)
            playBellSound('bell');
            triggerHapticFeedback(ImpactStyle.Medium);
          } else {
            // Intercardinals: NE (45°), SE (135°), SW (225°), NW (315°)
            playBellSound('chime');
            triggerHapticFeedback(ImpactStyle.Light);
          }
        }
      } else if (distToOctant > 4.5) {
        lastSpokenCardinalIndexRef.current = -1;
      }

      // Micro Cardinal Snap Haptic on exact North (0°), East (90°), South (180°), West (270°)
      const isCardinalSnap = CARDINAL_SNAP_ANGLES.some(a => {
        const d = Math.abs(norm - a);
        return d <= 0.6 || Math.abs(d - 360) <= 0.6;
      });
      if (isCardinalSnap && Date.now() - lastCardinalSnapTimeRef.current > 1200) {
        lastCardinalSnapTimeRef.current = Date.now();
        triggerHapticFeedback(ImpactStyle.Light);
      }

      // Settle deadband at 0.22° to prevent spinning continuous 60fps rAF loop when phone is stationary
      if (Math.abs(diff) > 0.22) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        smoothHeadingRef.current = target;
        setSmoothHeading(Math.round(target * 10) / 10);
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [displayHeading]);

  // renderedHeading is purely sensor-driven (no drag offset)
  const renderedHeading = ((smoothHeading % 360) + 360) % 360;

  const courseDeviation = useMemo(() => {
    if (targetHeading === null) return 0;
    return ((renderedHeading - targetHeading + 540) % 360) - 180;
  }, [renderedHeading, targetHeading]);

  const isOnCourse = useMemo(() => {
    return targetHeading !== null && Math.abs(courseDeviation) <= 3;
  }, [targetHeading, courseDeviation]);

  const isFacingQibla = useMemo(() => {
    if (heading === null) return false;
    // Qibla bearing is a true geographic bearing, so compare against true heading regardless of display toggle
    const trueHeading = ((heading + declination) % 360 + 360) % 360;
    let diff = Math.abs(trueHeading - qiblaBearing);
    if (diff > 180) diff = 360 - diff;
    return diff <= 3.5;
  }, [heading, declination, qiblaBearing]);

  const effectivePitch = pitch - (tareOffset?.pitch ?? 0);
  const effectiveRoll = roll - (tareOffset?.roll ?? 0);
  const totalTilt = Math.sqrt(effectivePitch * effectivePitch + effectiveRoll * effectiveRoll);
  const isLevel = totalTilt <= 1.5;

  const roundedHeading = useMemo(() => {
    return heading !== null ? Math.round(((renderedHeading % 360) + 360) % 360) % 360 : null;
  }, [heading, renderedHeading]);

  const vastuInfo = useMemo(() => getVastuDetails(roundedHeading ?? 0, language), [roundedHeading, language]);
  const currentPada = useMemo(() => get32Pada(roundedHeading ?? 0), [roundedHeading]);

  const copyCoordinates = async () => {
    triggerHapticFeedback();
    const lat = location ? location.latitude.toFixed(6) : '—';
    const lng = location ? location.longitude.toFixed(6) : '—';
    const deg = roundedHeading ?? 0;
    const vastu = getVastuDetails(displayHeading, language);
    const text = language === 'hi'
      ? `🧭 डिजिटल कंपास 360°:\nदिशा: ${deg}° (${vastu.name})\nअक्षांश/देशांतर: ${lat}°, ${lng}°\nऊंचाई: ${location?.altitude ? Math.round(location.altitude * 3.28084) : '—'} FT`
      : `🧭 Digital Compass 360°:\nHeading: ${deg}° (${vastu.name})\nCoordinates: ${lat}°, ${lng}°\nSea Level: ${location?.altitude ? Math.round(location.altitude * 3.28084) : '—'} FT`;
    
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

  // Dedicated share button — always prefers the native share sheet
  const shareCoordinates = async () => {
    triggerHapticFeedback();
    const lat = location ? location.latitude.toFixed(6) : '—';
    const lng = location ? location.longitude.toFixed(6) : '—';
    const text = language === 'hi'
      ? `📍 मेरा स्थान: ${lat}°, ${lng}°`
      : `📍 My location: ${lat}°, ${lng}°`;
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
    return date.toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: timeFormat === '12' });
  };

  // Sun countdown: sunrise / sunset / next sunrise (feature 3)
  const sunCountdown = useMemo(() => {
    const now = new Date(nowTick);
    const fmtDur = (ms: number) => {
      const mins = Math.max(0, Math.round(ms / 60000));
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };
    if (times.sunrise && now < times.sunrise) {
      return { label: language === 'hi' ? 'सूर्योदय में' : 'Sunrise in', ms: times.sunrise.getTime() - now.getTime() };
    }
    if (times.sunset && now < times.sunset) {
      return { label: language === 'hi' ? 'सूर्यास्त में' : 'Sunset in', ms: times.sunset.getTime() - now.getTime() };
    }
    if (times.sunrise) {
      const tomorrow = new Date(times.sunrise);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { label: language === 'hi' ? 'कल सूर्योदय में' : 'Sunrise tomorrow in', ms: tomorrow.getTime() - now.getTime() };
    }
    return null;
  }, [times, nowTick, language]);

  return (
    <div
      className={cn(
        "w-full min-h-screen flex flex-col items-center pb-8 px-4 select-none relative overflow-x-hidden transition-colors duration-300",
        theme === 'light' 
          ? "bg-[radial-gradient(circle_at_50%_-10%,#fff7df_0%,#f6ead2_35%,#e8edf0_100%)] text-stone-900" 
          : "bg-[radial-gradient(circle_at_50%_-10%,#2a2a2a_0%,#1a1a1a_36%,#121212_100%)] text-white"
      )}
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)'
      }}
    >
      {/* Layered ambient color keeps the home surface premium without hurting contrast. */}
      <div className="absolute -top-16 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-300/30 dark:bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-[32rem] -left-24 h-64 w-64 rounded-full bg-cyan-300/20 dark:bg-neutral-500/[0.04] blur-3xl pointer-events-none" />
      <div className="absolute top-[48rem] -right-24 h-64 w-64 rounded-full bg-rose-300/20 dark:bg-red-500/[0.05] blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-md flex items-center justify-between py-1 px-1 mb-2 relative z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.45)] shrink-0 overflow-hidden">
            <img 
              src="/icon-192.png?v=2" 
              alt={t.appTitle} 
              className="w-full h-full rounded-full object-cover scale-[1.02]" 
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

        {/* Header Controls: All Tools & Settings Cog */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setShowFeatureExplorer(true);
              triggerHapticFeedback();
            }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border active:scale-95 transition-all shadow-sm",
              theme === 'light'
                ? "bg-amber-100 hover:bg-amber-200/90 text-amber-950 border-amber-300 shadow-stone-200"
                : "bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 text-amber-300 hover:text-amber-200 border-amber-500/35"
            )}
            title={language === 'hi' ? 'सभी 13+ टूल्स एवं फीचर्स (टूलबॉक्स)' : 'All 13+ Tools & Features (Toolbox)'}
          >
            <Sparkles className={cn("w-3.5 h-3.5 animate-pulse", theme === 'light' ? "text-amber-700" : "text-amber-400")} />
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
              {language === 'hi' ? 'टूलबॉक्स' : 'All Tools'}
            </span>
          </button>

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

      {/* 3 Mode Navigation Tabs: COMPASS | LEVEL | VASTU & OTHERS (Distinct Signature Color Accents for Intuitive Exploration) */}
      <div className={cn(
        "w-full max-w-sm flex items-center justify-between p-1.5 rounded-2xl border mb-2 shadow-inner transition-all gap-1.5",
        theme === 'light'
          ? "bg-stone-200/80 border-stone-300"
          : "bg-stone-900/95 border-white/10"
      )}>
        {/* Tab 1: COMPASS (Amber Gold Flagship Theme) */}
        <button
          onClick={() => {
            setMainTab('compass');
            triggerHapticFeedback();
          }}
          className={cn(
            "py-2 px-2.5 rounded-xl text-xs sm:text-[13px] font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 relative border",
            mainTab === 'compass'
              ? (theme === 'light'
                  ? "flex-[1.35] bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 border-amber-400 shadow-[0_4px_16px_rgba(245,158,11,0.4)] font-black scale-[1.01]"
                  : "flex-[1.35] bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-stone-950 border-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.5)] font-black scale-[1.01]")
              : (theme === 'light'
                  ? "flex-1 bg-amber-100/90 border-amber-300 text-amber-950 hover:bg-amber-200/90 font-bold"
                  : "flex-1 bg-amber-500/10 border-amber-500/25 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200")
          )}
        >
          <Compass className={cn("w-4 h-4 shrink-0", mainTab === 'compass' ? "text-stone-950 stroke-[2.5]" : theme === 'light' ? "text-amber-800" : "text-amber-400")} />
          <span className="truncate">{t.tabCompass}</span>
        </button>

        {/* Tab 2: LEVEL (Cyan Tool Theme) */}
        <button
          onClick={() => {
            setMainTab('level');
            triggerHapticFeedback();
          }}
          className={cn(
            "py-2 px-2.5 rounded-xl text-xs sm:text-[13px] font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 relative border",
            mainTab === 'level'
              ? (theme === 'light'
                  ? "flex-[1.25] bg-gradient-to-r from-cyan-500 to-teal-500 text-stone-950 border-cyan-400 shadow-[0_4px_16px_rgba(6,182,212,0.4)] font-black scale-[1.01]"
                  : "flex-[1.25] bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-300 text-stone-950 border-cyan-200 shadow-[0_0_18px_rgba(6,182,212,0.5)] font-black scale-[1.01]")
              : (theme === 'light'
                  ? "flex-[0.9] bg-cyan-100/90 border-cyan-300 text-cyan-950 hover:bg-cyan-200/90 font-bold"
                  : "flex-[0.9] bg-cyan-500/10 border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-200")
          )}
        >
          <CircleDot className={cn("w-4 h-4 shrink-0", mainTab === 'level' ? "text-stone-950 stroke-[2.5]" : theme === 'light' ? "text-cyan-800" : "text-cyan-400")} />
          <span className="truncate">{t.tabLevel}</span>
        </button>

        {/* Tab 3: VASTU & SPIRITUAL (Rose / Purple Theme with 6-in-1 Suite Badge) */}
        <button
          onClick={() => {
            setMainTab('vastu');
            triggerHapticFeedback();
          }}
          className={cn(
            "py-2 px-2.5 rounded-xl text-xs sm:text-[13px] font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 whitespace-nowrap relative border",
            mainTab === 'vastu'
              ? (theme === 'light'
                  ? "flex-[1.4] bg-gradient-to-r from-rose-500 to-pink-600 text-white border-rose-400 shadow-[0_4px_16px_rgba(244,63,94,0.4)] font-black scale-[1.01]"
                  : "flex-[1.4] bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 text-white border-rose-300 shadow-[0_0_18px_rgba(244,63,94,0.5)] font-black scale-[1.01]")
              : (theme === 'light'
                  ? "flex-[1.1] bg-rose-100/90 border-rose-300 text-rose-950 hover:bg-rose-200/90 font-bold"
                  : "flex-[1.1] bg-rose-500/10 border-rose-500/25 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200")
          )}
        >
          <Sparkles className={cn("w-4 h-4 shrink-0", mainTab === 'vastu' ? "text-white" : theme === 'light' ? "text-rose-800" : "text-rose-400")} />
          <span className="truncate">{t.tabVastu}</span>
          <span className={cn(
            "text-[9px] px-1 py-0.2 rounded-md font-mono font-black border leading-none ml-0.5",
            mainTab === 'vastu'
              ? "bg-white/20 border-white/40 text-white"
              : theme === 'light'
                ? "bg-rose-200 border-rose-400/60 text-rose-900"
                : "bg-rose-500/20 border-rose-500/30 text-rose-300"
          )}>
            6-in-1
          </span>
        </button>
      </div>

      {/* Feature Explorer / Quick Discovery Strip */}
      <div className="w-full max-w-sm mb-2">
        <button
          onClick={() => {
            setShowFeatureExplorer(true);
            triggerHapticFeedback();
          }}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-2xl border transition-all active:scale-[0.98] shadow-md group",
            theme === 'light'
              ? "bg-gradient-to-r from-amber-100 via-orange-100/90 to-amber-100 border-amber-300 text-stone-900 hover:border-amber-400"
              : "bg-gradient-to-r from-stone-900/90 via-[#221c16] to-stone-900/90 border-amber-500/30 text-stone-100 hover:border-amber-500/50"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-stone-950 font-black shadow-sm shrink-0">
              <Sparkles className="w-4 h-4 text-stone-950" />
            </span>
            <div className="flex flex-col text-left">
              <span className="text-[10.5px] font-black uppercase tracking-wider flex items-center gap-1.5 text-stone-900 dark:text-stone-100">
                {language === 'hi' ? 'सुविधाएं व टूलबॉक्स (13+ फीचर्स)' : 'Feature Explorer & Toolbox'}
                <span className={cn(
                  "px-1.5 py-0.2 rounded-full text-[8.5px] font-bold border",
                  theme === 'light'
                    ? "bg-amber-200 border-amber-400 text-amber-950"
                    : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                )}>
                  13 TOOLS
                </span>
              </span>
              <span className={cn(
                "text-[9px] font-semibold leading-none mt-0.5",
                theme === 'light' ? "text-stone-700" : "text-stone-400"
              )}>
                {language === 'hi' ? 'ज्योतिष, वास्तु, लेवल, किबला, साधना, AR' : 'Vastu, Jyotish, Spirit Level, Qibla, AR & more'}
              </span>
            </div>
          </div>
          <ChevronRight className={cn(
            "w-4 h-4 group-hover:translate-x-0.5 transition-transform shrink-0",
            theme === 'light' ? "text-amber-800" : "text-amber-400"
          )} />
        </button>
      </div>

      {/* Tab 1: COMPASS VIEW */}
      {mainTab === 'compass' && (
        <>
          {/* Theme Header Strip */}
          <div className={cn(
            "w-full max-w-sm flex items-center justify-between text-[9.5px] font-black uppercase tracking-widest px-1 mb-1",
            theme === 'light' ? 'text-stone-800' : 'text-stone-300'
          )}>
            <span>{language === 'hi' ? 'कंपास थीम शैली' : 'COMPASS THEME STYLE'}</span>
            <span className={cn("flex items-center gap-0.5 text-[9px] font-bold", theme === 'light' ? 'text-stone-800' : 'text-stone-400')}>
              <span>{language === 'hi' ? 'स्वाइप करें' : 'SWIPE'}</span>
              <span className={cn("font-bold", theme === 'light' ? 'text-amber-700' : 'text-amber-400')}>›</span>
            </span>
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
                    ? st.id === 'satellite_earth'
                      ? "bg-gradient-to-r from-rose-500 to-red-600 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.8)] scale-[1.02]"
                      : st.id === 'vedic_mandala'
                      ? theme === 'light'
                        ? "bg-teal-400/90 text-teal-950 border-teal-600 shadow-[0_0_15px_rgba(20,184,166,0.5)] scale-[1.02]"
                        : "bg-[#00F0FF]/30 text-teal-200 border-teal-400 shadow-[0_0_15px_rgba(0,240,255,0.6)] scale-[1.02]"
                      : st.id === 'royal_gold'
                      ? "bg-gradient-to-r from-[#8C5F1A] via-[#D4AF37] to-[#E8C547] text-[#1A1008] border-[#E8C547] shadow-[0_0_18px_rgba(212,175,55,0.7)] scale-[1.03] font-black"
                      : st.id === 'sandalwood'
                      ? "bg-gradient-to-r from-[#D2B48C] via-[#E8D7C2] to-[#C9A67E] text-[#4A2E16] border-[#8C6239] shadow-[0_0_16px_rgba(140,98,57,0.5)] scale-[1.03] font-black"
                      : st.id === 'color_palette'
                      ? "bg-gradient-to-r from-[#374151] via-[#4B5563] to-[#1F2937] text-white border-slate-300 shadow-[0_0_16px_rgba(255,255,255,0.4)] scale-[1.02] font-black"
                      : "bg-gradient-to-r from-amber-300 to-yellow-400 text-stone-950 border-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.45)] scale-[1.02]"
                    : theme === 'light'
                      ? "bg-white text-stone-900 border-stone-300 shadow-sm hover:border-stone-500 font-bold"
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
                    : "bg-[#1e1e1e]/90 border-white/10"
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
                <React.Suspense fallback={null}>
                  <TelescopeCameraCompass
                    heading={renderedHeading}
                    pitch={effectivePitch}
                    roll={effectiveRoll}
                    location={location}
                    language={language}
                    onClose={() => {
                      setSatelliteMode('satellite');
                      triggerHapticFeedback();
                    }}
                  />
                </React.Suspense>
              </div>
            ) : (
              <React.Suspense fallback={null}>
                <SatelliteCompassView
                  heading={renderedHeading}
                  pitch={effectivePitch}
                  roll={effectiveRoll}
                  location={location}
                  language={language}
                  theme={theme}
                  magneticField={magneticFlux ?? 66}
                  mode={satelliteMode}
                  onModeChange={(m) => setSatelliteMode(m)}
                  onOpenLevel={() => {
                    setMainTab('level');
                    triggerHapticFeedback();
                  }}
                  onOpenAR={() => {
                    if (mediaStreamRef.current) {
                      mediaStreamRef.current.getTracks().forEach((t) => {
                        try { t.stop(); } catch {}
                      });
                      mediaStreamRef.current = null;
                      setIsFlashlightOn(false);
                    }
                    setSatelliteMode('telescope');
                    triggerHapticFeedback();
                  }}
                  onOpenMap={() => {
                    setSatelliteMode('map');
                    triggerHapticFeedback();
                  }}
                />
              </React.Suspense>
            )
            ) : (
            /* Regular Dial for Other Styles */
            <CompassDialRenderer
              styleId={selectedStyle}
              language={language}
              displayHeading={renderedHeading}
              sunPos={sunPos}
              isQiblaMode={isQiblaMode}
              qiblaBearing={qiblaBearing}
              qiblaDistanceKm={qiblaDistanceKm}
              isFacingQibla={isFacingQibla}
              vastuGridEnabled={vastuGridEnabled}
              dialRef={dialRef}
              customAccentColor="#EF4444"
              declination={declination}
              useTrueNorth={useTrueNorth}
              targetBearing={targetHeading}
              variantId={selectedVariant}
              pitch={effectivePitch}
              roll={effectiveRoll}
              isLevel={isLevel}
              onSelectPada={handleSelectPada}
              onRecenter={handleRecenter}
              needleTracksNorth={needleTracksNorth}
              isFrozen={isHeadingLocked}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />
          )}
          </div>

          {/* Inline Calibration Nudge & Magnetic Interference HUD */}
          {(heading === null || (compassAccuracy !== null && compassAccuracy > 25) || isMagneticInterference) && (
            <button
              onClick={() => {
                triggerHapticFeedback();
                setShowCalibrationModal(true);
              }}
              className={cn(
                "w-full max-w-sm flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl border text-xs sm:text-[13px] font-bold uppercase tracking-wider transition-all active:scale-[0.98] my-1 shadow-lg",
                isMagneticInterference
                  ? "bg-rose-950/80 text-rose-200 border-rose-500/70 shadow-[0_0_20px_rgba(244,63,94,0.35)] animate-pulse"
                  : theme === 'light'
                  ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                  : "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
              )}
            >
              <span className="flex items-center gap-2">
                {isMagneticInterference ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="font-black text-rose-300">
                      {language === 'hi' ? 'चुंबकीय हस्तक्षेप (धातु / EMI)' : 'MAGNETIC INTERFERENCE DETECTED'}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{language === 'hi' ? 'कैलिब्रेट करने के लिए टैप करें' : 'TAP TO CALIBRATE'}</span>
                  </>
                )}
              </span>
              <span className="text-[10px] sm:text-[11px] font-mono opacity-80 font-bold">
                {isMagneticInterference
                  ? (magneticFlux ? `${magneticFlux} μT (HIGH)` : (language === 'hi' ? '8 आकार में घुमाएं' : 'MOVE IN 8'))
                  : heading === null
                  ? (language === 'hi' ? 'सेंसर नहीं मिला' : 'NO SENSOR FIX')
                  : (language === 'hi' ? `अशुद्धि ±${Math.round(compassAccuracy!)}°` : `POOR ACC ±${Math.round(compassAccuracy!)}°`)}
              </span>
            </button>
          )}

          {/* Main Crimson Obsidian Dashboard Card */}
          <div className={cn(
            "w-full max-w-md rounded-[28px] p-4 border flex flex-col gap-3 my-2",
            theme === 'light'
              ? "border-red-200 bg-gradient-to-b from-[#FFF7F7] via-[#FEF2F2] to-[#FDE8E8] shadow-[0_15px_50px_rgba(0,0,0,0.12),0_0_30px_rgba(220,38,38,0.08)] text-stone-900"
              : "border-neutral-700/60 bg-gradient-to-b from-[#1e1e1e] via-[#191919] to-[#141414] shadow-[0_15px_50px_rgba(0,0,0,0.60),0_0_30px_rgba(245,158,11,0.08)] text-white"
          )}>
            
            {/* Top Quick Actions Row: 8 Signature Tools */}
            <div className="w-full flex items-center justify-between">
              {/* Primary Tools: Torch, Awake, Copy, Sound, Qibla */}
              <div className="flex items-center gap-1.5">
                {/* 1. Flashlight Torch */}
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

                {/* 2. Always On / Keep Screen Awake */}
                <button
                  onClick={() => {
                    const next = !keepAwake;
                    setKeepAwake(next);
                    try { localStorage.setItem('com.spiritual.compass.app_keep_awake', next.toString()); } catch {}
                    triggerHapticFeedback(ImpactStyle.Light);
                    if (next) {
                      toast.success(language === 'hi' ? 'स्क्रीन हमेशा चालू: सक्रिय (स्क्रीन बंद नहीं होगी)' : 'Always On Display: Screen will stay awake');
                    } else {
                      toast.info(language === 'hi' ? 'स्क्रीन हमेशा चालू: बंद (सामान्य स्क्रीन टाइमआउट)' : 'Always On Display: Screen will sleep normally');
                    }
                  }}
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all duration-200 border",
                    keepAwake
                      ? "bg-amber-500 text-stone-950 border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.6)]"
                      : (theme === 'light' ? "bg-white border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-400" : "bg-stone-800/80 border-white/12 text-stone-300 hover:text-white hover:border-white/25")
                  )}
                  title={language === 'hi' ? 'स्क्रीन हमेशा चालू रखें' : 'Always On (Keep Screen Awake)'}
                >
                  <SunMedium className={cn("w-4 h-4", !keepAwake && (theme === 'light' ? "text-amber-600" : "text-amber-400"))} />
                </button>

                {/* 3. Copy Coordinates */}
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

                {/* 4. Sound Effects On/Off Quick-Toggle */}
                <button
                  onClick={() => {
                    const next = !soundEnabled;
                    soundEnabledRef.current = next;
                    setSoundEnabled(next);
                    try { localStorage.setItem('com.spiritual.compass.app_sound', next.toString()); } catch {}
                    triggerHapticFeedback(ImpactStyle.Light);
                    if (next) {
                      playBellSound('bell', true);
                      toast.success(language === 'hi' ? 'ध्वनि प्रभाव: चालू' : 'Sound Effects: ON');
                    } else {
                      toast.info(language === 'hi' ? 'ध्वनि प्रभाव: म्यूट' : 'Sound Effects: Muted');
                    }
                  }}
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all duration-200 border",
                    soundEnabled
                      ? "bg-amber-500 text-stone-950 border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.6)]"
                      : (theme === 'light' ? "bg-white border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-400" : "bg-stone-800/80 border-white/12 text-stone-300 hover:text-white hover:border-white/25")
                  )}
                  title={soundEnabled ? (language === 'hi' ? 'ध्वनि बंद करें' : 'Mute Sound') : (language === 'hi' ? 'ध्वनि चालू करें' : 'Enable Sound')}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-stone-950 stroke-[2.5]" />
                  ) : (
                    <VolumeX className={cn("w-4 h-4", theme === 'light' ? "text-stone-400" : "text-stone-500")} />
                  )}
                </button>

                {/* 5. Qibla Toggle */}
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

              {/* Secondary Tools: Lock, CDI Target, Share */}
              <div className="flex items-center gap-1.5">
                {/* 6. Lock/Unlock Heading (Freeze) */}
                <button
                  onClick={() => {
                    const next = !isHeadingLocked;
                    setIsHeadingLocked(next);
                    triggerHapticFeedback(ImpactStyle.Medium);
                    toast.info(
                      next 
                        ? (language === 'hi' ? `❄ रीडिंग लॉक: ${roundedHeading ?? 0}° पर स्थिर` : `❄ Reading Frozen at ${roundedHeading ?? 0}°`)
                        : (language === 'hi' ? 'लाइव कंपास पुनः चालू' : 'Live Compass Resumed')
                    );
                  }}
                  className={cn(
                    "w-9 h-9 rounded-xl border flex items-center justify-center active:scale-95 transition-all duration-200",
                    isHeadingLocked 
                      ? "bg-amber-500 text-stone-950 border-amber-400 shadow-[0_0_14px_#f59e0b]" 
                      : (theme === 'light' ? "bg-white border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-400" : "bg-stone-800/80 border-white/12 text-stone-300 hover:text-white hover:border-white/25")
                  )}
                  title={language === 'hi' ? 'रीडिंग होल्ड / लॉक करें' : 'Hold / Lock Heading'}
                >
                  {isHeadingLocked ? <Lock className="w-4 h-4 stroke-[2.5]" /> : <Unlock className={cn("w-4 h-4", theme === 'light' ? "text-rose-600" : "text-rose-400")} />}
                </button>

                {/* 7. Set Target Course (CDI) */}
                <button
                  onClick={() => {
                    if (targetHeading !== null) {
                      setTargetHeading(null);
                      toast.info(language === 'hi' ? 'लक्ष्य हटाया गया' : 'Target Cleared');
                    } else {
                      const tgt = Math.round(renderedHeading);
                      setTargetHeading(tgt);
                      toast.success(language === 'hi' ? `लक्ष्य ${tgt}° पर सेट (कोर्स ट्रैकिंग)` : `Target Course set at ${tgt}°`);
                    }
                    triggerHapticFeedback(ImpactStyle.Medium);
                  }}
                  className={cn(
                    "w-9 h-9 rounded-xl border flex items-center justify-center active:scale-95 transition-all duration-200",
                    targetHeading !== null
                      ? "bg-amber-500 text-stone-950 border-amber-400 shadow-[0_0_14px_#f59e0b]"
                      : (theme === 'light' ? "bg-white border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-400" : "bg-stone-800/80 border-white/12 text-stone-300 hover:text-white hover:border-white/25")
                  )}
                  title={language === 'hi' ? 'लक्ष्य कोर्स सेट करें' : 'Set Target Course'}
                >
                  <Target className={cn("w-4 h-4", targetHeading === null && (theme === 'light' ? "text-orange-600" : "text-orange-400"))} />
                </button>

                {/* 8. Share Vastu Audit Report */}
                <button
                  onClick={async () => {
                    triggerHapticFeedback(ImpactStyle.Light);
                    const deg = roundedHeading ?? 0;
                    const text = `🧭 DIGITAL COMPASS & VASTU AUDIT\n` +
                      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                      `📍 Live Heading: ${deg}° (${vastuInfo.code} - ${vastuInfo.name})\n` +
                      `🏛️ 32 Devta Pada: ${language === 'hi' ? currentPada.nameHi : currentPada.nameEn} (${currentPada.code})\n` +
                      `✨ Status: ${currentPada.isAuspicious ? (language === 'hi' ? '★ शुभ द्वार (Auspicious)' : '★ Auspicious') : (language === 'hi' ? 'विचारणीय (Non-Auspicious)' : 'Non-Auspicious')}\n` +
                      `🌊 Element: ${language === 'hi' ? currentPada.elementNameHi : currentPada.element}\n` +
                      `📜 Result: ${language === 'hi' ? currentPada.resultHi : currentPada.resultEn}\n` +
                      `🏠 Ideal Usage: ${language === 'hi' ? currentPada.usageHi : currentPada.usageEn}\n` +
                      (location ? `🌐 GPS: ${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°\n` : '') +
                      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                      `Generated with Digital Compass & Vastu Suite`;

                    try {
                      if (typeof navigator !== 'undefined' && (navigator as any).share) {
                        await (navigator as any).share({
                          title: 'Digital Compass Vastu Audit',
                          text
                        });
                      } else {
                        await navigator.clipboard.writeText(text);
                        toast.success(language === 'hi' ? 'वास्तु रिपोर्ट कॉपी हो गई!' : 'Vastu Audit Report copied to clipboard!');
                      }
                    } catch {
                      try {
                        await navigator.clipboard.writeText(text);
                        toast.success(language === 'hi' ? 'वास्तु रिपोर्ट कॉपी हो गई!' : 'Vastu Audit Report copied to clipboard!');
                      } catch {}
                    }
                  }}
                  className={cn(
                    "w-9 h-9 rounded-xl border flex items-center justify-center active:scale-95 transition-all duration-200",
                    theme === 'light' ? "bg-white border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-400" : "bg-stone-800/80 border-white/12 text-stone-300 hover:text-white hover:border-white/25"
                  )}
                  title={language === 'hi' ? 'वास्तु रिपोर्ट साझा करें' : 'Share Vastu Report'}
                >
                  <Share2 className={cn("w-4 h-4", theme === 'light' ? "text-amber-600" : "text-amber-400")} />
                </button>
              </div>
            </div>

            {/* Center Heading Readout */}
            {selectedStyle === 'vedic_mandala' ? (
              (() => {
                return (
                  <div 
                    onClick={() => {
                      triggerHapticFeedback(ImpactStyle.Light);
                      setSelectedPadaModal(currentPada);
                    }}
                    className={cn(
                      "w-full p-3 sm:p-3.5 rounded-2xl border flex flex-col gap-2.5 shadow-[0_6px_24px_rgba(0,0,0,0.7)] my-1 transition-all duration-300 cursor-pointer hover:scale-[1.01] active:scale-[0.99]",
                      theme === 'light'
                        ? "bg-gradient-to-br from-amber-50/95 via-orange-50/80 to-amber-100/70 border-amber-300 text-stone-900"
                        : "bg-gradient-to-br from-[#1C1408] via-[#140E05] to-[#0A0702] border-amber-500/50 text-white"
                    )}
                  >
                    {/* Top Row: Pada Code, Deity Name, Degree Span, and Auspicious Badge */}
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={cn(
                          "px-2.5 py-1 rounded-xl font-mono font-black text-xs sm:text-sm border flex items-center gap-1.5 shadow-sm",
                          currentPada.isAuspicious
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                            : "bg-amber-500/15 text-amber-300 border-amber-500/40"
                        )}>
                          <span>{currentPada.code}</span>
                          <span className="opacity-40">•</span>
                          <span>{language === 'hi' ? currentPada.nameHi : `${currentPada.nameHi} (${currentPada.nameEn})`}</span>
                        </span>
                        <span className={cn(
                          "text-xs font-mono font-bold px-2 py-0.5 rounded-lg border",
                          theme === 'light' ? "bg-amber-100/80 border-amber-200 text-stone-700" : "bg-white/5 border-white/10 text-stone-300"
                        )}>
                          {currentPada.startDeg.toFixed(1)}° - {currentPada.endDeg.toFixed(1)}°
                        </span>
                      </div>

                      {/* Auspicious Gate Status Badge */}
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10.5px] sm:text-[11px] font-black tracking-wide border flex items-center gap-1",
                        currentPada.isAuspicious
                          ? "bg-emerald-500/25 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                          : "bg-rose-950/60 text-rose-300 border-rose-500/30"
                      )}>
                        {currentPada.isAuspicious ? (
                          <>
                            <span className="text-amber-400 text-xs">★</span>
                            <span>{language === 'hi' ? 'श्रेष्ठ मुख्य द्वार' : 'AUSPICIOUS ENTRANCE'}</span>
                          </>
                        ) : (
                          <span>{language === 'hi' ? 'सामान्य / वर्जित द्वार' : 'NON-GATE ZONE'}</span>
                        )}
                      </span>
                    </div>

                    {/* Vedic Shastra Result & Recommended Usage */}
                    <div className={cn(
                      "p-2.5 rounded-xl text-xs sm:text-[13px] flex flex-col gap-1.5 border",
                      theme === 'light' ? "bg-white/85 border-amber-200" : "bg-black/40 border-amber-500/20"
                    )}>
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold text-amber-500 shrink-0 text-xs sm:text-[13px]">
                          {language === 'hi' ? 'फल:' : 'Vedic Effect:'}
                        </span>
                        <span className={cn(
                          "leading-relaxed font-medium text-xs sm:text-[13px]",
                          currentPada.isAuspicious
                            ? (theme === 'light' ? "text-emerald-800 font-semibold" : "text-emerald-300 font-semibold")
                            : (theme === 'light' ? "text-stone-700" : "text-stone-300")
                        )}>
                          {language === 'hi' ? currentPada.resultHi : currentPada.resultEn}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold shrink-0 text-xs">
                          {language === 'hi' ? currentPada.elementNameHi : `${currentPada.element} Element`}
                        </span>
                        <span className="text-xs text-amber-400 font-bold flex items-center gap-1 opacity-90">
                          <span>{language === 'hi' ? 'विवरण देखें' : 'Tap for details'}</span>
                          <Sparkles className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              (() => {
                // Theme-aware center readout box — each theme gets its own colors
                // Direction name (localized)
                const dirName = language === 'hi'
                  ? vastuInfo.name
                  : (
                      vastuInfo.code === 'N' ? 'NORTH' :
                      vastuInfo.code === 'NE' ? 'NORTH-EAST' :
                      vastuInfo.code === 'E' ? 'EAST' :
                      vastuInfo.code === 'SE' ? 'SOUTH-EAST' :
                      vastuInfo.code === 'S' ? 'SOUTH' :
                      vastuInfo.code === 'SW' ? 'SOUTH-WEST' :
                      vastuInfo.code === 'W' ? 'WEST' :
                      vastuInfo.code === 'NW' ? 'NORTH-WEST' :
                      vastuInfo.name.toUpperCase()
                    );

                // Box background + text colors per theme
                const box = (() => {
                  switch (selectedStyle) {
                    case 'sandalwood':
                      return { bg: 'bg-gradient-to-r from-[#FAF3E8] via-[#F3E6D3] to-[#E9D4B8]', border: 'border-[#C9A67E]', heading: 'text-[#3E2718]', dir: 'text-red-700', btn: 'bg-[#3E2718]/10 hover:bg-[#3E2718]/15 border-[#8C6239]/40 text-[#5C3A1E]' };
                    case 'royal_gold':
                      return { bg: 'bg-gradient-to-r from-[#2A1806] via-[#1E1004] to-[#120802]', border: 'border-[#FDE047]/75 shadow-[0_4px_25px_rgba(212,175,55,0.35)]', heading: 'text-[#FFF8DC] drop-shadow-[0_0_12px_rgba(245,158,11,0.7)]', dir: 'text-[#FDE047]', btn: 'bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border-[#FDE047]/60 text-[#FDE047]' };
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
                  <div className={cn("w-full px-3.5 py-2.5 rounded-2xl border flex flex-col gap-1.5 shadow-md my-0.5", box.bg, box.border)}>
                    {/* Line 1: Angle + Direction Name (e.g. NORTH (N)) on Left, Vastu Element & Declination on Right */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-2 min-w-0">
                        <span className={cn("text-3xl sm:text-4xl font-black font-serif leading-none animate-heading-glow shrink-0", box.heading)}>
                          {roundedHeading ?? 0}°
                        </span>
                        <span className={cn("text-base sm:text-lg font-black font-serif leading-none tracking-wide whitespace-nowrap truncate", box.dir)}>
                          {dirName} ({vastuInfo.code})
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Magnetic Declination μ indicator */}
                        <span className="text-xs font-mono font-bold text-cyan-400 opacity-90 flex items-center gap-0.5">
                          <span className="text-xs font-black text-cyan-300">μ</span>
                          <span>{declination === 0 ? '0.0°' : declination > 0 ? `+${declination.toFixed(1)}°` : `−${Math.abs(declination).toFixed(1)}°`}</span>
                          <span className="text-[9px] text-white/50 font-sans uppercase font-bold">{declination > 0 ? 'E' : declination < 0 ? 'W' : ''}</span>
                        </span>
                        {/* Element Badge */}
                        <span className={cn(
                          "text-[10.5px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 leading-none",
                          selectedStyle === 'sandalwood'
                            ? "bg-amber-900/10 border-amber-700/30 text-amber-950"
                            : "bg-white/10 border-white/15 text-stone-200"
                        )}>
                          <span>{vastuInfo.element === 'Fire' ? '🔥' : vastuInfo.element === 'Water' ? '💧' : vastuInfo.element === 'Air' ? '💨' : vastuInfo.element === 'Earth' ? '🌍' : '✨'}</span>
                          <span>{language === 'hi' ? vastuInfo.element : vastuInfo.element}</span>
                        </span>
                      </div>
                    </div>

                    {/* Line 2: Sea Level on Left, Magnetic / True North Toggle on Right (no separator line, tight vertical spacing) */}
                    <div className="flex items-center justify-between gap-2">
                      {/* Sea Level / Altitude — Tap to toggle FT / M */}
                      <button
                        onClick={toggleAltUnit}
                        title={language === 'hi' ? 'इकाई बदलें (FT/M)' : 'Toggle Altitude Unit (FT/M)'}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-sm transition-all active:scale-95 text-left cursor-pointer",
                          selectedStyle === 'sandalwood'
                            ? "bg-white/60 border-[#8C6239]/35 text-[#3E2718] hover:border-amber-600"
                            : "bg-white/5 border-white/12 text-stone-200 hover:border-white/25"
                        )}
                      >
                        <Mountain className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <div className="flex items-center gap-1 leading-none">
                          <span className="text-[9.5px] uppercase font-bold text-stone-400 tracking-wider">
                            {language === 'hi' ? 'समुद्र तल' : 'SEA LEVEL'}
                          </span>
                          <span className="text-xs sm:text-[13px] font-mono font-black">
                            {location?.altitude
                              ? (altUnit === 'm' ? Math.round(location.altitude) : Math.round(location.altitude * 3.28084))
                              : '—'}{' '}
                            <span className="text-[9px] font-bold text-amber-400 uppercase">{altUnit.toUpperCase()}</span>
                          </span>
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-300 border-white/10 bg-white/5 shrink-0 leading-none">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{location?.city ? (language === 'hi' ? location.city : (location.cityEn || location.city)) : (language === 'hi' ? 'सटीक 360°' : 'GPS 360°')}</span>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Target Bearing & Course Deviation Indicator (CDI) HUD */}
            {targetHeading !== null && (
              <div className={cn(
                "w-full p-2.5 rounded-2xl border flex flex-col gap-2 transition-all duration-300 my-1 shadow-md",
                isOnCourse
                  ? "bg-emerald-950/80 border-emerald-500/70 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                  : "bg-amber-950/70 border-amber-500/60 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
              )}>
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center border shrink-0",
                      isOnCourse
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 animate-pulse"
                        : "bg-amber-500/20 border-amber-400 text-amber-300"
                    )}>
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-stone-300">
                          {language === 'hi' ? 'लक्ष्य कोर्स:' : 'Target Course:'}
                        </span>
                        <span className="text-xs font-mono font-black text-amber-300">
                          {Math.round(targetHeading)}°
                        </span>
                      </div>
                      <div className="text-xs font-black tracking-tight mt-0.5">
                        {isOnCourse ? (
                          <span className="text-emerald-400 font-black flex items-center gap-1">
                            ✓ {language === 'hi' ? 'कोर्स पर हैं (0° विचलन)' : 'ON COURSE (0° DEVIATION)'}
                          </span>
                        ) : courseDeviation > 0 ? (
                          <span className="text-amber-300 font-bold">
                            ↶ {language === 'hi' ? `बाएं घूमें ${Math.abs(Math.round(courseDeviation))}°` : `TURN LEFT ${Math.abs(Math.round(courseDeviation))}°`}
                          </span>
                        ) : (
                          <span className="text-amber-300 font-bold">
                            {language === 'hi' ? `दाएं घूमें ${Math.abs(Math.round(courseDeviation))}° ↷` : `TURN RIGHT ${Math.abs(Math.round(courseDeviation))}° ↷`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setTargetHeading(null);
                      triggerHapticFeedback();
                      toast.info(language === 'hi' ? 'लक्ष्य हटाया गया' : 'Target Cleared');
                    }}
                    className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition-colors border border-white/10"
                    title={language === 'hi' ? 'लक्ष्य हटाएं' : 'Clear Target'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Avionics Course Deviation Bar */}
                <div className="w-full flex items-center gap-1.5 px-1 pt-1 border-t border-white/10">
                  <span className="text-[8px] font-mono text-stone-400 shrink-0">L 30°</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden flex justify-end">
                    {courseDeviation > 1 && (
                      <div 
                        className="h-full bg-amber-400 rounded-full transition-all" 
                        style={{ width: `${Math.min(100, (Math.abs(courseDeviation) / 30) * 100)}%` }} 
                      />
                    )}
                  </div>
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full border shrink-0 transition-all",
                    isOnCourse 
                      ? "bg-emerald-400 border-white shadow-[0_0_8px_#10b981] scale-125" 
                      : "bg-white/30 border-white/50"
                  )} />
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    {courseDeviation < -1 && (
                      <div 
                        className="h-full bg-amber-400 rounded-full transition-all" 
                        style={{ width: `${Math.min(100, (Math.abs(courseDeviation) / 30) * 100)}%` }} 
                      />
                    )}
                  </div>
                  <span className="text-[8px] font-mono text-stone-400 shrink-0">30° R</span>
                </div>
              </div>
            )}

            {/* GPS Coordinates & Accuracy */}
            <div className={cn("w-full flex items-center justify-between text-xs pt-1 border-t", theme === 'light' ? "border-stone-200" : "border-white/10")}>
              <button
                onClick={copyCoordinates}
                className={cn("flex items-center gap-1.5 font-mono font-bold hover:opacity-80 transition-colors", theme === 'light' ? "text-amber-700" : "text-amber-300 hover:text-amber-200")}
              >
                <Globe className={cn("w-4 h-4", theme === 'light' ? "text-amber-600" : "text-amber-400")} />
                <div className="flex flex-col items-start text-left">
                  <span className={cn("text-[10px] sm:text-[11px] font-bold uppercase tracking-wider", theme === 'light' ? "text-stone-500" : "text-stone-400")}>
                    {location?.city
                      ? `${language === 'hi' ? location.city : (location.cityEn || location.city)}${location.state ? `, ${language === 'hi' ? location.state : (location.stateEn || location.state)}` : ''}`
                      : ''}
                  </span>
                  <span className="text-xs sm:text-[13px] font-mono font-black opacity-90">
                    {location
                      ? `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°`
                      : locationLoading
                        ? (language === 'hi' ? 'स्थान प्राप्त हो रहा है…' : 'Locating…')
                        : locationError === 'ip'
                          ? (language === 'hi' ? 'अनुमानित स्थान (IP)' : 'Approx. location (IP)')
                          : (language === 'hi' ? 'स्थान उपलब्ध नहीं' : 'Location unavailable')}
                  </span>
                </div>
              </button>

              <div className="flex items-center gap-1.5 shrink-0">
                {location?.gpsHeading != null && (
                  <button
                    onClick={() => {
                      const cog = Math.round(((location.gpsHeading! % 360) + 360) % 360) % 360;
                      setTargetHeading(cog);
                      triggerHapticFeedback(ImpactStyle.Light);
                      toast.success(
                        language === 'hi'
                          ? `जीपीएस कोर्स ${cog}° लक्ष्य के रूप में सेट किया गया`
                          : `GPS Course (${cog}°) locked as target bearing`
                      );
                    }}
                    title={language === 'hi' ? 'जीपीएस गति की दिशा (टैप कर लक्ष्य लॉक करें)' : 'GPS Course-Over-Ground (Tap to lock as target course)'}
                    className={cn(
                      "text-[10.5px] sm:text-[11px] font-black uppercase tracking-wider flex items-center gap-1 px-2.5 py-1 rounded-xl border shadow-sm active:scale-95 transition-all",
                      theme === 'light'
                        ? "bg-sky-50 text-sky-800 border-sky-300"
                        : "bg-sky-950/60 text-sky-300 border-sky-500/40"
                    )}
                  >
                    <Navigation className="w-3 h-3 shrink-0" />
                    <span>COG {Math.round(((location.gpsHeading % 360) + 360) % 360) % 360}°</span>
                  </button>
                )}
                {location?.accuracy != null ? (
                  <span className={cn(
                    "text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center gap-1 px-2.5 py-1 rounded-xl border shadow-sm",
                    location.accuracy <= 15
                      ? (theme === 'light' ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-emerald-950/50 text-emerald-300 border-emerald-500/40")
                      : location.accuracy <= 50
                      ? (theme === 'light' ? "bg-amber-50 text-amber-800 border-amber-300" : "bg-amber-950/50 text-amber-300 border-amber-500/40")
                      : (theme === 'light' ? "bg-rose-50 text-rose-800 border-rose-300" : "bg-rose-950/50 text-rose-300 border-rose-500/40")
                  )}>
                    <Crosshair className="w-3.5 h-3.5 shrink-0" />
                    <span>{location.accuracy <= 15 ? 'HIGH' : location.accuracy <= 50 ? 'MED' : 'LOW'} ±{Math.round(location.accuracy)}m</span>
                  </span>
                ) : (
                  <span className={cn("text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center gap-1 px-2.5 py-1 rounded-xl border", theme === 'light' ? "bg-stone-50 border-stone-200 text-stone-500" : "bg-white/5 border-white/10 text-stone-400")}>
                    <Crosshair className="w-3.5 h-3.5 shrink-0" />
                    <span>{locationError === 'ip' ? 'IP LOC' : 'ACC —'}</span>
                  </span>
                )}
              </div>
              {/* Speed readout — always visible, prominent for driving. Tap to toggle live GPS tracking. */}
              <button
                onClick={() => { toggleLiveTracking(); triggerHapticFeedback(ImpactStyle.Light); }}
                title={liveTracking
                  ? (language === 'hi' ? 'लाइव ट्रैकिंग चालू — बंद करने के लिए टैप करें' : 'Live tracking ON — tap to stop')
                  : (language === 'hi' ? 'लाइव ट्रैकिंग बंद — चालू करने के लिए टैप करें' : 'Live tracking OFF — tap to start')}
                className={cn(
                  "px-3 py-1 rounded-xl border text-xs sm:text-[13px] font-black flex items-center gap-1.5 shrink-0 active:scale-95 transition-all",
                  liveTracking
                    ? (theme === 'light' ? "bg-emerald-500 text-white border-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.4)]" : "bg-emerald-500 text-stone-950 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]")
                    : (theme === 'light' ? "bg-emerald-100 border-emerald-400 text-emerald-800 hover:bg-emerald-200" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20")
                )}
              >
                <Gauge className={cn("w-4 h-4", liveTracking && "animate-pulse")} />
                <span className="font-mono">
                  {liveTracking
                    ? (location?.speed != null ? Math.round(location.speed * (speedUnit === 'mph' ? 2.23694 : 3.6)) : 0)
                    : '—'}{' '}
                  <span className="text-[8px] font-bold uppercase tracking-wider">{speedUnit === 'mph' ? 'mph' : 'km/h'}</span>
                </span>
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

            {/* Surface Level: Pitch, Roll + Mini Bubble Preview + Open Level Tab */}
            <div className={cn("w-full flex items-center justify-between text-xs pt-1.5 border-t", theme === 'light' ? "border-stone-200" : "border-white/10")}>
              <div className="flex items-center gap-2">
                {/* Mini Live Spirit Bubble Indicator */}
                <div className={cn(
                  "w-11 h-5 rounded-full border relative flex items-center justify-center overflow-hidden transition-colors shrink-0",
                  isLevel 
                    ? "bg-emerald-950/60 border-emerald-400/80 shadow-[0_0_8px_rgba(16,185,129,0.3)]" 
                    : "bg-stone-900/60 border-amber-500/40"
                )}>
                  {/* Center Crosshair Pip */}
                  <div className="absolute inset-y-0 left-1/2 w-[1px] bg-white/20 -translate-x-1/2" />
                  <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/20 -translate-y-1/2" />
                  {/* Live Floating Bubble */}
                  <div 
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-transform duration-75 shadow-sm",
                      isLevel ? "bg-emerald-400 shadow-[0_0_6px_#10b981]" : "bg-amber-400 shadow-[0_0_6px_#f59e0b]"
                    )}
                    style={{
                      transform: `translate(${Math.max(-14, Math.min(14, effectiveRoll * 1.4))}px, ${Math.max(-3.5, Math.min(3.5, effectivePitch * 0.7))}px)`
                    }}
                  />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className={cn("text-[9px] font-bold uppercase tracking-wider flex items-center gap-1", theme === 'light' ? "text-stone-500" : "text-stone-400")}>
                    <span>{language === 'hi' ? 'सतह स्तर' : 'SURFACE LEVEL'}</span>
                    {tareOffset && <span className="text-amber-400 font-black text-[8px]">TARE</span>}
                    {isLevel && <span className="text-emerald-400 font-black text-[8px]">✓ LEVEL</span>}
                  </span>
                  <span className={cn("text-[10px] font-mono font-bold", theme === 'light' ? "text-stone-600" : "text-stone-300")}>
                    PITCH {effectivePitch.toFixed(1)}° • ROLL {effectiveRoll.toFixed(1)}°
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

            {/* Solar Cycle Times: RISE | LIVE COUNTDOWN | SET */}
            <div className={cn("w-full flex items-center justify-between text-[10px] font-bold px-1 font-mono", theme === 'light' ? "text-stone-600" : "text-stone-300")}>
              <div className={cn("flex items-center gap-1", theme === 'light' ? "text-amber-700" : "text-amber-400")}>
                <Sunrise className="w-3.5 h-3.5 shrink-0" />
                <span>RISE: {formatTime(times.sunrise, '06:21 AM')}</span>
              </div>
              {sunCountdown && (
                <div className={cn("flex items-center gap-1 text-[9px] font-black uppercase tracking-wider", theme === 'light' ? "text-amber-800" : "text-amber-300/90")}>
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>{sunCountdown.label}</span>
                  <span className="font-mono">{sunCountdown.ms > 0 ? `${Math.floor(sunCountdown.ms / 3600000)}h ${Math.round((sunCountdown.ms % 3600000) / 60000)}m` : '—'}</span>
                </div>
              )}
              <div className={cn("flex items-center gap-1", theme === 'light' ? "text-purple-700" : "text-purple-400")}>
                <Sunset className="w-3.5 h-3.5 shrink-0" />
                <span>SET: {formatTime(times.sunset, '—')}</span>
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
                <span className="text-sm leading-none">{weather ? (weather.conditionIcon === 'sun' ? '☀️' : weather.conditionIcon === 'cloud-sun' ? '🌤️' : weather.conditionIcon === 'cloud' ? '☁️' : weather.conditionIcon === 'rain' ? '🌧️' : '⛈️') : '—'}</span>
                <span className="font-mono uppercase text-[10px] font-bold">
                  {weather ? `${tempUnit === 'f' ? weather.tempF : weather.tempC}°${tempUnit === 'f' ? 'F' : 'C'} • ${weather.condition.toUpperCase()}` : (language === 'hi' ? 'मौसम उपलब्ध नहीं' : 'WEATHER UNAVAILABLE')}
                </span>
              </div>

              <div className={cn("flex items-center gap-3 font-mono text-[10px] font-bold", theme === 'light' ? "text-stone-500" : "text-stone-400")}>
                <span className="flex items-center gap-1">
                  <Droplets className={cn("w-3 h-3", theme === 'light' ? "text-sky-600" : "text-sky-400")} />
                  {weather ? `${weather.humidity}%` : '—'}
                </span>
                <span className="flex items-center gap-1">
                  <Wind className={cn("w-3 h-3", theme === 'light' ? "text-teal-600" : "text-teal-400")} />
                  {weather ? `${weather.windSpeedKmh} km/h` : '—'}
                </span>
                <span className="flex items-center gap-1">
                  <Gauge className={cn("w-3 h-3", theme === 'light' ? "text-red-600" : "text-red-400")} />
                  {weather ? `${weather.pressureHpa} hPa` : '—'}
                </span>
                <ChevronRight className={cn("w-3 h-3", theme === 'light' ? "text-stone-400" : "text-stone-500")} />
              </div>
            </button>

          </div>

          {/* Inline Vastu Suggestions Panel — shown when Vastu button tapped */}
          {showVastuPanel && (
            <div className="w-full max-w-sm rounded-[22px] border border-amber-500/40 bg-gradient-to-b from-[#222222] via-[#1c1c1c] to-[#161616] shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(245,158,11,0.12)] p-4 flex flex-col gap-3 my-1.5 text-white animate-in slide-in-from-top-2 fade-in duration-300">
              
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
                    {roundedHeading ?? 0}° — {vastuInfo.name}
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
                      : vastuInfo.code === 'S' ? (language === 'hi' ? 'भंडारण / भारी वार्डरोब' : 'Storage / Heavy Wardrobes')
                      : vastuInfo.code === 'SW' ? (language === 'hi' ? 'मास्टर बेडरूम / तिजोरी' : 'Master Bedroom / Safe')
                      : vastuInfo.code === 'W' ? (language === 'hi' ? 'डाइनिंग / बच्चों का कमरा' : "Dining / Children's Room")
                      : (language === 'hi' ? 'अतिथि कक्ष / वायु स्थान' : 'Guest Room / Air Zone')}
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
                      : vastuInfo.code === 'S' ? (language === 'hi' ? 'भारी वार्डरोब या स्टोर रूम दक्षिण में रखें' : 'Keep heavy wardrobes or storage in South')
                      : vastuInfo.code === 'SW' ? (language === 'hi' ? 'नैऋत्य (SW) में मास्टर बेडरूम व भारी फर्नीचर रखें' : 'Place master bedroom & heavy furniture in SW')
                      : vastuInfo.code === 'W' ? (language === 'hi' ? 'पश्चिम में डाइनिंग या बच्चों का कमरा बनाएं' : "Place dining or children's room in West")
                      : (language === 'hi' ? 'वायव्य (NW) में अतिथि कक्ष व अच्छा वेंटिलेशन रखें' : 'Keep guest room & fresh ventilation in NW')}
                  </span>
                </div>

                {/* Don't */}
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-rose-400/80">
                    {language === 'hi' ? 'न करें' : "DON'T"}
                  </span>
                  <span className="text-[10px] font-bold text-rose-200 leading-tight">
                    {vastuInfo.code === 'N' ? (language === 'hi' ? 'भारी निर्माण या कूड़ा न रखें' : 'No heavy clutter or waste in North')
                      : vastuInfo.code === 'NE' ? (language === 'hi' ? 'शौचालय या भारी सामान न रखें' : 'No toilet or heavy items')
                      : vastuInfo.code === 'E' ? (language === 'hi' ? 'भारी दीवार न बनाएं' : 'No heavy walls blocking')
                      : vastuInfo.code === 'SE' ? (language === 'hi' ? 'पानी का स्रोत न रखें' : 'No water source here')
                      : vastuInfo.code === 'S' ? (language === 'hi' ? 'मुख्य द्वार या जल स्रोत न बनाएं' : 'No main entrance or water tank')
                      : vastuInfo.code === 'SW' ? (language === 'hi' ? 'जल, भूमिगत टैंक या मंदिर न रखें' : 'No underground water tank or temple')
                      : vastuInfo.code === 'W' ? (language === 'hi' ? 'कचरा घर न बनाएं' : 'No waste area')
                      : (language === 'hi' ? 'मास्टर बेडरूम या भारी तिजोरी न रखें' : 'Avoid master bedroom or heavy safe here')}
                  </span>
                </div>
              </div>

              {/* 32-Pada Main Entrance (Mukhya Dwar) Auspiciousness Finder Banner */}
              {(() => {
                const AUSPICIOUS_ENTRANCE_PADAS = ['N3', 'N4', 'E3', 'E4', 'S4', 'W3', 'W4', 'W5'];
                const isBestEntrance = AUSPICIOUS_ENTRANCE_PADAS.includes(currentPada.code);
                return (
                  <div className={cn(
                    "w-full p-3 rounded-2xl border flex flex-col gap-1.5",
                    isBestEntrance
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-100"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-100"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-[13px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        <span>🚪</span>
                        <span>
                          {language === 'hi'
                            ? `मुख्य द्वार निर्णय (${currentPada.code} - ${currentPada.nameHi})`
                            : `Main Entrance Verdict (${currentPada.code} - ${currentPada.nameEn})`}
                        </span>
                      </span>
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] sm:text-[10.5px] font-black uppercase tracking-wide",
                        isBestEntrance ? "bg-emerald-500 text-stone-950" : "bg-amber-500/25 text-amber-300 border border-amber-400/40"
                      )}>
                        {isBestEntrance
                          ? (language === 'hi' ? '✓ श्रेष्ठ द्वार' : '✓ AUSPICIOUS DOOR')
                          : (language === 'hi' ? 'सावधान / उपाय करें' : 'NEEDS REMEDY')}
                      </span>
                    </div>
                    <p className="text-xs sm:text-[12.5px] leading-relaxed opacity-95">
                      {isBestEntrance
                        ? (language === 'hi'
                            ? `${currentPada.code} (${currentPada.nameHi}) मुख्य प्रवेश द्वार के लिए 8 सर्वश्रेष्ठ पदों में से एक है—धन, स्वास्थ्य और उन्नति प्रदान करता है।`
                            : `${currentPada.code} (${currentPada.nameEn}) is one of the 8 Supreme Main Entrance Padas—brings prosperity, health & career growth.`)
                        : (language === 'hi'
                            ? `मुख्य द्वार के लिए N3, N4, E3, E4, S4, W3, W4 सर्वोत्तम हैं। यदि द्वार ${currentPada.code} में है, तो चौखट पर तांबे/पीतल की पट्टी या स्वस्तिक लगाएं।`
                            : `Best Entrance Padas are N3, N4, E3, E4, S4, W3, W4. If your door is in ${currentPada.code}, place a brass/copper threshold strip & Swastika.`)}
                    </p>
                  </div>
                );
              })()}

              {/* Location Context */}
              <div className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs sm:text-[12.5px] text-stone-300 font-medium leading-snug">
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
        <React.Suspense fallback={null}>
          <AdvancedLevelView
            pitch={pitch}
            roll={roll}
            tareOffset={tareOffset}
            onToggleTare={() => {
              if (tareOffset) {
                setTareOffset(null);
                try { localStorage.removeItem('com.spiritual.compass.app_tare_offset'); } catch {}
              } else {
                const next = { pitch, roll };
                setTareOffset(next);
                try { localStorage.setItem('com.spiritual.compass.app_tare_offset', JSON.stringify(next)); } catch {}
              }
            }}
            theme={theme}
            triggerHaptic={triggerHapticFeedback}
            onCalibrate={() => { setShowCalibrationModal(true); triggerHapticFeedback(); }}
            playSound={playBellSound}
          />
        </React.Suspense>
      )}

      {/* Tab 3: VASTU & OTHERS VIEW */}
      {mainTab === 'vastu' && (
        <React.Suspense fallback={null}>
          <VastuOthersView
            currentHeading={renderedHeading}
            pitch={effectivePitch}
            roll={effectiveRoll}
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
            useTrueNorth={useTrueNorth}
            onRecenter={handleRecenter}
            triggerHaptic={() => triggerHapticFeedback(ImpactStyle.Light)}
            onCopyCoordinates={copyCoordinates}
            onToggleTorch={toggleFlashlight}
            isTorchOn={isFlashlightOn}
            isHeadingLocked={isHeadingLocked}
            onToggleHeadingLock={() => {
              const next = !isHeadingLocked;
              setIsHeadingLocked(next);
              triggerHapticFeedback(ImpactStyle.Medium);
              toast.info(
                next
                  ? (language === 'hi' ? `रीडिंग लॉक: ${roundedHeading ?? 0}° पर स्थिर` : `Reading Held at ${roundedHeading ?? 0}°`)
                  : (language === 'hi' ? 'लाइव सेंसर फिर से शुरू' : 'Live Compass Resumed')
              );
            }}
            activeSubTab={activeVastuSubTab}
            onSubTabChange={(t) => setActiveVastuSubTab(t)}
            openARScannerSignal={openARSignal}
            openFloorPlanSignal={openFloorPlanSignal}
          />
        </React.Suspense>
      )}

      {/* Creator Branding Card: Shown for compass & level tabs */}
      {mainTab !== 'vastu' && <CreatorBanner />}

      {/* Settings Modal — Grouped & Streamlined */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className={cn(
            "w-full max-w-sm p-4 sm:p-5 rounded-3xl border shadow-2xl flex flex-col gap-3.5 z-50 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto",
            theme === 'light' ? "bg-white border-stone-200 text-stone-900" : "bg-[#1e1e1e] border-white/15 text-white"
          )}>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-200/50 dark:border-white/10">
              <span className="text-sm font-black tracking-wide text-amber-500 uppercase">{t.settings}</span>
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

            {/* GROUP 1: रूप-रंग एवं डिस्प्ले (Appearance & Display) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500/90 pl-1">
                {language === 'hi' ? '🎨 रूप-रंग एवं डिस्प्ले' : '🎨 Appearance & Display'}
              </span>
              <div className={cn(
                "p-3 rounded-2xl border space-y-2.5",
                theme === 'light' ? "bg-stone-50 border-stone-200/70" : "bg-white/[0.03] border-white/8"
              )}>
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
                        language === 'hi' ? "bg-amber-500 text-stone-950 shadow-sm" : (theme === 'light' ? "text-stone-500" : "text-stone-400")
                      )}
                    >
                      हिंदी
                    </button>
                    <button
                      onClick={() => setLanguage('en')}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all",
                        language === 'en' ? "bg-amber-500 text-stone-950 shadow-sm" : (theme === 'light' ? "text-stone-500" : "text-stone-400")
                      )}
                    >
                      English
                    </button>
                  </div>
                </div>

                {/* Theme Mode */}
                <div className={cn(
                  "flex items-center justify-between text-xs font-bold pt-2 border-t",
                  theme === 'light' ? "border-stone-200/60" : "border-white/5"
                )}>
                  <span>{t.themeMode}</span>
                  <ThemeToggle />
                </div>

                {/* Dial Styles Gallery */}
                <div className={cn(
                  "flex items-center justify-between text-xs font-bold pt-2 border-t",
                  theme === 'light' ? "border-stone-200/60" : "border-white/5"
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
                    {language === 'hi' ? 'शैलियां देखें' : 'View Styles'}
                  </button>
                </div>

                {/* Vastu Grid Overlay */}
                <div className={cn(
                  "flex items-center justify-between text-xs font-bold pt-2 border-t",
                  theme === 'light' ? "border-stone-200/60" : "border-white/5"
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
                      localStorage.setItem('com.spiritual.compass.app_vastu', next.toString());
                    }}
                    className={cn(
                      "px-3 py-1 rounded-xl text-[10px] font-black uppercase transition-all",
                      vastuGridEnabled ? "bg-amber-500 text-stone-950 font-bold shadow-sm" : (theme === 'light' ? "bg-stone-200 text-stone-600" : "bg-stone-800 text-stone-400")
                    )}
                  >
                    {vastuGridEnabled ? (language === 'hi' ? "चालू" : "ON") : (language === 'hi' ? "बंद" : "OFF")}
                  </button>
                </div>
              </div>
            </div>

            {/* GROUP 2: इकाइयां एवं प्रारूप (Units & Format) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500/90 pl-1">
                {language === 'hi' ? '📏 इकाइयां एवं प्रारूप' : '📏 Units & Format'}
              </span>
              <div className={cn(
                "p-3 rounded-2xl border space-y-2.5",
                theme === 'light' ? "bg-stone-50 border-stone-200/70" : "bg-white/[0.03] border-white/8"
              )}>
                {/* Temperature Unit */}
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-amber-500" />
                    {language === 'hi' ? 'तापमान इकाई' : 'Temperature Unit'}
                  </span>
                  <div className={cn("flex items-center p-0.5 rounded-xl border", theme === 'light' ? "bg-stone-100 border-stone-300" : "bg-stone-800 border-white/10")}>
                    <button
                      onClick={() => { setTempUnit('c'); try { localStorage.setItem('com.spiritual.compass.app_temp_unit', 'c'); } catch {} triggerHapticFeedback(); }}
                      className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all", tempUnit === 'c' ? "bg-amber-500 text-stone-950 shadow-sm" : (theme === 'light' ? "text-stone-500" : "text-stone-400"))}
                    >°C</button>
                    <button
                      onClick={() => { setTempUnit('f'); try { localStorage.setItem('com.spiritual.compass.app_temp_unit', 'f'); } catch {} triggerHapticFeedback(); }}
                      className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all", tempUnit === 'f' ? "bg-amber-500 text-stone-950 shadow-sm" : (theme === 'light' ? "text-stone-500" : "text-stone-400"))}
                    >°F</button>
                  </div>
                </div>

                {/* Speed Unit */}
                <div className={cn(
                  "flex items-center justify-between text-xs font-bold pt-2 border-t",
                  theme === 'light' ? "border-stone-200/60" : "border-white/5"
                )}>
                  <span className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-emerald-500" />
                    {language === 'hi' ? 'गति इकाई' : 'Speed Unit'}
                  </span>
                  <div className={cn("flex items-center p-0.5 rounded-xl border", theme === 'light' ? "bg-stone-100 border-stone-300" : "bg-stone-800 border-white/10")}>
                    <button
                      onClick={() => { setSpeedUnit('kmh'); try { localStorage.setItem('com.spiritual.compass.app_speed_unit', 'kmh'); } catch {} triggerHapticFeedback(); }}
                      className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all", speedUnit === 'kmh' ? "bg-amber-500 text-stone-950 shadow-sm" : (theme === 'light' ? "text-stone-500" : "text-stone-400"))}
                    >km/h</button>
                    <button
                      onClick={() => { setSpeedUnit('mph'); try { localStorage.setItem('com.spiritual.compass.app_speed_unit', 'mph'); } catch {} triggerHapticFeedback(); }}
                      className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all", speedUnit === 'mph' ? "bg-amber-500 text-stone-950 shadow-sm" : (theme === 'light' ? "text-stone-500" : "text-stone-400"))}
                    >mph</button>
                  </div>
                </div>

                {/* Altitude Unit */}
                <div className={cn(
                  "flex items-center justify-between text-xs font-bold pt-2 border-t",
                  theme === 'light' ? "border-stone-200/60" : "border-white/5"
                )}>
                  <span className="flex items-center gap-2">
                    <Mountain className="w-4 h-4 text-amber-500" />
                    {language === 'hi' ? 'ऊंचाई इकाई' : 'Altitude Unit'}
                  </span>
                  <div className={cn("flex items-center p-0.5 rounded-xl border", theme === 'light' ? "bg-stone-100 border-stone-300" : "bg-stone-800 border-white/10")}>
                    <button
                      onClick={() => { setAltUnit('ft'); try { localStorage.setItem('com.spiritual.compass.app_alt_unit', 'ft'); } catch {} triggerHapticFeedback(); }}
                      className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all", altUnit === 'ft' ? "bg-amber-500 text-stone-950 shadow-sm" : (theme === 'light' ? "text-stone-500" : "text-stone-400"))}
                    >FT</button>
                    <button
                      onClick={() => { setAltUnit('m'); try { localStorage.setItem('com.spiritual.compass.app_alt_unit', 'm'); } catch {} triggerHapticFeedback(); }}
                      className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all", altUnit === 'm' ? "bg-amber-500 text-stone-950 shadow-sm" : (theme === 'light' ? "text-stone-500" : "text-stone-400"))}
                    >M</button>
                  </div>
                </div>

                {/* Time Format */}
                <div className={cn(
                  "flex items-center justify-between text-xs font-bold pt-2 border-t",
                  theme === 'light' ? "border-stone-200/60" : "border-white/5"
                )}>
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-500" />
                    {language === 'hi' ? 'समय प्रारूप' : 'Time Format'}
                  </span>
                  <div className={cn("flex items-center p-0.5 rounded-xl border", theme === 'light' ? "bg-stone-100 border-stone-300" : "bg-stone-800 border-white/10")}>
                    <button
                      onClick={() => { setTimeFormat('12'); try { localStorage.setItem('com.spiritual.compass.app_time_format', '12'); } catch {} triggerHapticFeedback(); }}
                      className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all", timeFormat === '12' ? "bg-amber-500 text-stone-950 shadow-sm" : (theme === 'light' ? "text-stone-500" : "text-stone-400"))}
                    >12h</button>
                    <button
                      onClick={() => { setTimeFormat('24'); try { localStorage.setItem('com.spiritual.compass.app_time_format', '24'); } catch {} triggerHapticFeedback(); }}
                      className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all", timeFormat === '24' ? "bg-amber-500 text-stone-950 shadow-sm" : (theme === 'light' ? "text-stone-500" : "text-stone-400"))}
                    >24h</button>
                  </div>
                </div>
              </div>
            </div>

            {/* GROUP 3: डिवाइस एवं सिस्टम (Device & System) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500/90 pl-1">
                {language === 'hi' ? '⚙️ डिवाइस एवं सिस्टम' : '⚙️ Device & System'}
              </span>
              <div className={cn(
                "p-3 rounded-2xl border space-y-2.5",
                theme === 'light' ? "bg-stone-50 border-stone-200/70" : "bg-white/[0.03] border-white/8"
              )}>
                {/* Keep Screen Awake (Single source of truth — replaces and eliminates duplicate Always Visible) */}
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2">
                    <MoonStar className="w-4 h-4 text-indigo-500" />
                    <div>
                      <div>{language === 'hi' ? 'स्क्रीन जागृत रखें' : 'Keep Screen Awake'}</div>
                      <div className="text-[9px] font-normal text-stone-400">{language === 'hi' ? 'स्क्रीन बंद नहीं होगी' : 'Prevent screen timeout'}</div>
                    </div>
                  </span>
                  <button
                    onClick={() => {
                      const next = !keepAwake;
                      setKeepAwake(next);
                      try { localStorage.setItem('com.spiritual.compass.app_keep_awake', next.toString()); } catch {}
                      triggerHapticFeedback();
                    }}
                    className={cn(
                      "px-3 py-1 rounded-xl text-[10px] font-black uppercase transition-all",
                      keepAwake ? "bg-amber-500 text-stone-950 font-bold shadow-sm" : (theme === 'light' ? "bg-stone-200 text-stone-600" : "bg-stone-800 text-stone-400")
                    )}
                  >
                    {keepAwake ? (language === 'hi' ? 'चालू' : 'ON') : (language === 'hi' ? 'बंद' : 'OFF')}
                  </button>
                </div>

                {/* Haptics Feedback */}
                <div className={cn(
                  "flex items-center justify-between text-xs font-bold pt-2 border-t",
                  theme === 'light' ? "border-stone-200/60" : "border-white/5"
                )}>
                  <span className="flex items-center gap-2">
                    <Vibrate className="w-4 h-4 text-fuchsia-500" />
                    {language === 'hi' ? 'हैप्टिक फीडबैक' : 'Haptic Feedback'}
                  </span>
                  <button
                    onClick={() => {
                      const next = !hapticEnabled;
                      setHapticEnabled(next);
                      try { localStorage.setItem('com.spiritual.compass.app_haptic', next.toString()); } catch {}
                      if (next) triggerHapticFeedback();
                    }}
                    className={cn(
                      "px-3 py-1 rounded-xl text-[10px] font-black uppercase transition-all",
                      hapticEnabled ? "bg-amber-500 text-stone-950 font-bold shadow-sm" : (theme === 'light' ? "bg-stone-200 text-stone-600" : "bg-stone-800 text-stone-400")
                    )}
                  >
                    {hapticEnabled ? (language === 'hi' ? 'चालू' : 'ON') : (language === 'hi' ? 'बंद' : 'OFF')}
                  </button>
                </div>

                {/* Sensor Diagnostics */}
                <div className={cn(
                  "flex items-center justify-between text-xs font-bold pt-2 border-t",
                  theme === 'light' ? "border-stone-200/60" : "border-white/5"
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
                  theme === 'light' ? "border-stone-200/60" : "border-white/5"
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
              </div>
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
            magneticField={magneticFlux}
            compassAccuracy={compassAccuracy}
            heading={renderedHeading}
            pitch={effectivePitch}
            roll={effectiveRoll}
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
            heading={renderedHeading}
            pitch={pitch}
            roll={roll}
            magneticInterference={isMagneticInterference}
            onCalibrationComplete={() => {
              smoothedVectorRef.current = null;
              triggerHapticFeedback(ImpactStyle.Heavy);
            }}
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

      {/* 32 Devta Pada Inspector Modal */}
      {selectedPadaModal && (
        <DevtaPadaModal
          pada={selectedPadaModal}
          onClose={() => setSelectedPadaModal(null)}
          onSelectPada={(pada) => setSelectedPadaModal(pada)}
          onLockBearing={(deg) => setTargetHeading(deg)}
          language={language}
          theme={theme}
        />
      )}

      {/* 13-in-1 Feature Explorer & Toolbox Modal */}
      {showFeatureExplorer && (
        <React.Suspense fallback={null}>
          <FeatureExplorerModal
            isOpen={showFeatureExplorer}
            onClose={() => setShowFeatureExplorer(false)}
            language={language}
            theme={theme}
            onSelectTab={(tab) => {
              setMainTab(tab);
              setShowFeatureExplorer(false);
            }}
            onOpenARScanner={() => {
              setMainTab('vastu');
              setOpenARSignal(prev => prev + 1);
              setShowFeatureExplorer(false);
            }}
            onOpenFloorPlan={() => {
              setMainTab('vastu');
              setOpenFloorPlanSignal(prev => prev + 1);
              setShowFeatureExplorer(false);
            }}
            onOpenWeather={() => {
              setShowWeatherModal(true);
              setShowFeatureExplorer(false);
            }}
            onOpenSettings={() => {
              setShowSettings(true);
              setShowFeatureExplorer(false);
            }}
            onSelectVastuSubTab={(subTab) => {
              setActiveVastuSubTab(subTab);
              setMainTab('vastu');
              setShowFeatureExplorer(false);
            }}
            onToggleTorch={toggleFlashlight}
            isTorchOn={isFlashlightOn}
          />
        </React.Suspense>
      )}
    </div>
  );
};
