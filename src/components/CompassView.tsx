import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Compass, 
  CircleDot,
  Settings,
  Zap,
  Sparkles,
  Camera,
  Layers,
  Target,
  Copy,
  Lock,
  Unlock,
  Bookmark,
  Globe,
  Mountain,
  ArrowRight,
  Sun,
  Sunset,
  Sunrise,
  Droplets,
  Wind,
  Gauge,
  X,
  Languages,
  Grid,
  Palette
} from 'lucide-react';
import { useSunTimes } from '@/hooks/useSunTimes';
import SunCalc from 'suncalc';
import { cn } from '@/lib/utils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CalibrationGuideModal } from '@/components/compass/CalibrationGuideModal';
import { SensorsInspectorModal } from '@/components/compass/SensorsInspectorModal';
import { StyleSelectorModal } from '@/components/compass/StyleSelectorModal';
import { CompassDialRenderer } from '@/components/compass/CompassDialRenderer';
import { COMPASS_STYLES } from '@/components/compass/CompassStyles';
import { CompassStyleId, WeatherData } from '@/types/compass';
import { getVastuDetails, getWeatherDescription, translations } from '@/lib/translations';
import { AdvancedLevelView } from '@/components/level/AdvancedLevelView';
import { VastuOthersView } from '@/components/vastu/VastuOthersView';
import { CreatorBanner } from '@/components/CreatorBanner';

const STYLE_STORAGE_KEY = 'com.hcompass.app_style';

export const CompassView = () => {
  const { location, times } = useSunTimes();
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

  // Weather state
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // 12 Trending Styles
  const [selectedStyle, setSelectedStyle] = useState<CompassStyleId>(() => {
    try {
      const saved = localStorage.getItem(STYLE_STORAGE_KEY) as CompassStyleId;
      if (saved && COMPASS_STYLES.some(s => s.id === saved)) return saved;
    } catch {}
    return 'royal_gold';
  });

  const handleSelectStyle = (id: CompassStyleId) => {
    setSelectedStyle(id);
    try {
      localStorage.setItem(STYLE_STORAGE_KEY, id);
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

  // Vastu Grid Overlay State
  const [vastuGridEnabled, setVastuGridEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('com.hcompass.app_vastu') !== 'false'; } catch { return true; }
  });

  // Flashlight / Torch State
  const [isFlashlightOn, setIsFlashlightOn] = useState<boolean>(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Qibla (Kaaba) Direction Mode State
  const [isQiblaMode, setIsQiblaMode] = useState<boolean>(false);

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
    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,surface_pressure,weather_code,wind_speed_10m`);
        const data = await res.json();
        if (data && data.current) {
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            humidity: data.current.relative_humidity_2m,
            pressure: Math.round(data.current.surface_pressure),
            windSpeed: Math.round(data.current.wind_speed_10m),
            code: data.current.weather_code
          });
        }
      } catch (e) {
        console.warn("Weather fetch fallback", e);
      }
    };
    fetchWeather();
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

  const updateHeadingFromPointer = (clientX: number, clientY: number) => {
    if (isHeadingLocked || !dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    let angle = (Math.atan2(dy, dx) * 180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    setHeading(Math.round(angle));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isHeadingLocked) return;
    isDraggingDialRef.current = true;
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch {}
    updateHeadingFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingDialRef.current || isHeadingLocked) return;
    updateHeadingFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingDialRef.current = false;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
  };

  const displayHeading = useMemo(() => {
    if (heading === null) return 76;
    if (!useTrueNorth) return heading;
    return ((heading + declination) % 360 + 360) % 360;
  }, [heading, useTrueNorth, declination]);

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
        ? "bg-gradient-to-b from-amber-50/70 via-stone-100 to-stone-200 text-stone-900" 
        : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#180A0C] via-[#0D0406] to-[#040102] text-white"
    )}>
      {/* Top Ambient Glow */}
      <div className="absolute top-12 w-80 h-80 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />

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
              <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                DIGITAL{' '}
              </span>
              <span className="bg-gradient-to-r from-rose-500 via-red-500 to-red-600 bg-clip-text text-transparent">
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

        {/* Quick Header Controls: Language Toggle, Theme Toggle & Settings Cog */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              toggleLanguage();
              triggerHapticFeedback();
            }}
            className={cn(
              "px-2.5 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1 active:scale-95 shadow-sm",
              theme === 'light'
                ? "bg-white border-stone-200 text-stone-800 hover:bg-stone-50"
                : "bg-stone-900/90 border-white/10 text-amber-400 hover:text-white"
            )}
            title={language === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
          >
            <Languages className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === 'hi' ? 'EN' : 'हिं'}</span>
          </button>

          <ThemeToggle />

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
            "flex-1 py-1.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1",
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
            "flex-1 py-1.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1",
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
            "flex-1 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1 whitespace-nowrap",
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
          {/* Horizontal 12+ Compass Styles Quick Bar */}
          <div className="w-full max-w-sm flex items-center gap-1.5 mb-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => {
                setShowStyleModal(true);
                triggerHapticFeedback();
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/25 border border-amber-500/50 text-amber-300 hover:text-white text-[11px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.25)] active:scale-95 transition-all"
            >
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'hi' ? '12+ शैलियां' : '12+ Styles'}</span>
            </button>

            {COMPASS_STYLES.map((st) => (
              <button
                key={st.id}
                onClick={() => handleSelectStyle(st.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all duration-200 shrink-0 border flex items-center gap-1.5",
                  selectedStyle === st.id
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 border-amber-300 font-black shadow-lg scale-[1.03]"
                    : "bg-stone-900/90 text-stone-300 border-white/10 hover:text-white hover:border-white/25"
                )}
              >
                <div 
                  className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: st.primaryColor }}
                />
                <span>{language === 'hi' ? st.nameHi : st.nameEn}</span>
              </button>
            ))}
          </div>

          {/* Astrolabe Compass Dial */}
          <CompassDialRenderer
            styleId={selectedStyle}
            language={language}
            displayHeading={displayHeading}
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
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />

          {/* Sub-Dial Intermediate Status Strip: PITCH: 3° | ROLL: 0° | [LEVEL] | TILT: 3° */}
          <div className="w-full max-w-sm flex items-center justify-between px-4 py-2 rounded-2xl bg-stone-900/90 border border-white/10 my-1 text-xs font-bold shadow-md">
            <div className="flex items-center gap-1">
              <span className="text-stone-400 text-[10.5px] uppercase font-black tracking-wider">PITCH:</span>
              <span className="text-amber-400 font-mono font-black text-sm">{Math.round(pitch)}°</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-stone-400 text-[10.5px] uppercase font-black tracking-wider">ROLL:</span>
              <span className="text-amber-400 font-mono font-black text-sm">{Math.round(roll)}°</span>
            </div>
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase border tracking-wider",
              isLevel 
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.4)]" 
                : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
            )}>
              LEVEL
            </span>
            <div className="flex items-center gap-1">
              <span className="text-stone-400 text-[10.5px] uppercase font-black tracking-wider">TILT:</span>
              <span className="text-amber-400 font-mono font-black text-sm">{Math.round(totalTilt)}°</span>
            </div>
          </div>

          {/* Main Crimson Obsidian Dashboard Card */}
          <div className="w-full max-w-sm rounded-[28px] p-4 border border-red-900/60 bg-gradient-to-b from-[#18090C] via-[#120608] to-[#0A0304] shadow-[0_15px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(220,38,38,0.18)] flex flex-col gap-3 my-2 text-white">
            
            {/* Top Quick Actions Row */}
            <div className="w-full flex items-start justify-between">
              {/* Left Badges */}
              <div className="flex flex-col gap-1.5">
                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-rose-500/40 bg-rose-950/40 text-rose-300 flex items-center gap-1 shadow-sm">
                  <span>✦</span>
                  <span>LOW ACC</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-sky-500/40 bg-sky-950/40 text-sky-300 flex items-center gap-1 shadow-sm w-fit">
                  <span>Δ</span>
                  <span>{declination > 0 ? `+${declination}°` : `${declination}°`}</span>
                </span>
              </div>

              {/* Right Quick Circular Buttons Grid */}
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1.5">
                  {/* Camera / Snapshot */}
                  <button
                    onClick={copyCoordinates}
                    className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:text-white flex items-center justify-center active:scale-95 transition-all shadow-sm"
                    title="Snapshot / Share"
                  >
                    <Camera className="w-4 h-4 text-amber-400" />
                  </button>

                  {/* Layers / Styles */}
                  <button
                    onClick={() => {
                      setShowStyleModal(true);
                      triggerHapticFeedback();
                    }}
                    className="w-8 h-8 rounded-full bg-stone-800/80 border border-white/15 text-stone-300 hover:text-white flex items-center justify-center active:scale-95 transition-all shadow-sm"
                    title={t.styleGallery}
                  >
                    <Layers className="w-4 h-4 text-stone-300" />
                  </button>

                  {/* Flashlight Torch */}
                  <button
                    onClick={toggleFlashlight}
                    className={cn(
                      "w-8 h-8 rounded-full border flex items-center justify-center active:scale-95 transition-all shadow-sm",
                      isFlashlightOn 
                        ? "bg-emerald-500 text-stone-950 border-emerald-400 shadow-[0_0_12px_#10b981]" 
                        : "bg-emerald-950/60 text-emerald-400 border-emerald-500/40 hover:bg-emerald-900/60"
                    )}
                    title={t.torch}
                  >
                    <Zap className="w-4 h-4" />
                  </button>

                  {/* Target Calibration */}
                  <button
                    onClick={() => {
                      setShowCalibrationModal(true);
                      triggerHapticFeedback();
                    }}
                    className="w-8 h-8 rounded-full bg-stone-800/80 border border-white/15 text-stone-300 hover:text-white flex items-center justify-center active:scale-95 transition-all shadow-sm"
                    title={t.calibrationGuide}
                  >
                    <Target className="w-4 h-4 text-stone-300" />
                  </button>

                  {/* Copy / Clipboard */}
                  <button
                    onClick={copyCoordinates}
                    className="w-8 h-8 rounded-full bg-stone-800/80 border border-white/15 text-stone-300 hover:text-white flex items-center justify-center active:scale-95 transition-all shadow-sm"
                    title="Copy Coordinates"
                  >
                    <Copy className="w-4 h-4 text-stone-300" />
                  </button>
                </div>

                {/* Sub-row: Lock Heading & Bookmark */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setIsHeadingLocked(!isHeadingLocked);
                      triggerHapticFeedback(ImpactStyle.Medium);
                      toast.info(isHeadingLocked ? "Heading Unlocked" : "Heading Locked");
                    }}
                    className={cn(
                      "w-8 h-8 rounded-full border flex items-center justify-center active:scale-95 transition-all shadow-sm",
                      isHeadingLocked 
                        ? "bg-amber-500 text-stone-950 border-amber-400 shadow-[0_0_12px_#f59e0b]" 
                        : "bg-stone-800/80 border-white/15 text-stone-400 hover:text-white"
                    )}
                    title="Lock/Unlock Heading"
                  >
                    {isHeadingLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => {
                      setMainTab('vastu');
                      triggerHapticFeedback();
                    }}
                    className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:text-white flex items-center justify-center active:scale-95 transition-all shadow-sm"
                    title="Vastu Guidance"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Center Heading Readout: 76° EAST */}
            <div className="flex flex-col items-center justify-center my-0.5">
              <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white leading-none">
                {displayHeading !== null ? Math.round(displayHeading) : 76}°
              </span>
              <span className="text-lg sm:text-xl font-black tracking-widest text-red-500 uppercase mt-1">
                {language === 'hi' ? vastuInfo.name.split(' ')[0] : (vastuInfo.code === 'E' ? 'EAST' : vastuInfo.code === 'N' ? 'NORTH' : vastuInfo.code === 'S' ? 'SOUTH' : vastuInfo.code === 'W' ? 'WEST' : vastuInfo.name.split(' ')[0].toUpperCase())}
              </span>
            </div>

            {/* GPS Coordinates & Sea Level */}
            <div className="w-full flex items-center justify-between text-xs pt-1 border-t border-white/10">
              <button
                onClick={copyCoordinates}
                className="flex items-center gap-1.5 text-amber-300 font-mono font-bold hover:text-amber-200 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {location ? `${location.latitude.toFixed(6)}°, ${location.longitude.toFixed(6)}°` : '18.550434°, 73.920091°'}
                </span>
              </button>

              <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-stone-300 flex items-center gap-1">
                <Mountain className="w-3 h-3 text-stone-400" />
                <span>SEA LEVEL: {location?.altitude ? Math.round(location.altitude * 3.28084) : 1632} FT</span>
              </span>
            </div>

            {/* Surface Level (Bubble Level) Quick Preview Card */}
            <div className="w-full p-2.5 rounded-2xl bg-stone-900/90 border border-white/10 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2.5">
                {/* Mini 2D Bubble Level Indicator */}
                <div className="w-8 h-8 rounded-full border border-white/20 bg-stone-950 relative overflow-hidden flex items-center justify-center shrink-0">
                  <div className="absolute inset-x-0 top-1/2 h-[0.5px] bg-white/20" />
                  <div className="absolute inset-y-0 left-1/2 w-[0.5px] bg-white/20" />
                  <div 
                    className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] transition-transform duration-75 ease-out"
                    style={{
                      transform: `translate(${Math.max(-8, Math.min(8, -roll * 0.8))}px, ${Math.max(-8, Math.min(8, -pitch * 0.8))}px)`
                    }}
                  />
                </div>

                <div className="flex flex-col text-left leading-tight">
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                    SURFACE LEVEL (BUBBLE LEVEL)
                  </span>
                  <span className="text-xs text-stone-300 font-bold mt-0.5 font-mono">
                    Pitch: {Math.round(pitch)}° | Roll: {Math.round(roll)}°
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setMainTab('level');
                  triggerHapticFeedback();
                }}
                className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-wider text-stone-300 hover:text-white flex items-center gap-1 active:scale-95 transition-all"
              >
                <span>OPEN</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Solar Cycle Times: RISE | NOON | SET */}
            <div className="w-full flex items-center justify-between text-[10px] font-bold px-1 text-stone-300 font-mono">
              <div className="flex items-center gap-1 text-amber-400">
                <Sunrise className="w-3.5 h-3.5" />
                <span>RISE: {formatTime(times.sunrise, '06:21 AM')}</span>
              </div>
              <div className="flex items-center gap-1 text-amber-300">
                <Sun className="w-3.5 h-3.5 text-yellow-400" />
                <span>NOON: {formatTime(times.solarNoon, '12:35 PM')}</span>
              </div>
              <div className="flex items-center gap-1 text-purple-400">
                <Sunset className="w-3.5 h-3.5" />
                <span>SET: {formatTime(times.sunset, '06:50 PM')}</span>
              </div>
            </div>

            {/* Weather Telemetry Row */}
            <div className="w-full flex items-center justify-between text-[10.5px] font-bold pt-2 border-t border-white/10 text-stone-300">
              <div className="flex items-center gap-1.5">
                <span className="text-sm leading-none">{getWeatherIcon(weather?.code)}</span>
                <span className="font-mono uppercase">
                  {weather ? `${weather.temp}°C • ${getWeatherDescription(weather.code, language).toUpperCase()}` : '24°C • PARTLY CLOUDY'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-stone-400 font-mono text-[10px]">
                <span className="flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-sky-400" />
                  {weather ? `${weather.humidity}%` : '82%'}
                </span>
                <span className="flex items-center gap-1">
                  <Wind className="w-3 h-3 text-teal-400" />
                  {weather ? `${weather.windSpeed} km/h` : '15 km/h'}
                </span>
                <span className="flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-red-400" />
                  {weather ? `${weather.pressure} hPa` : '947 hPa'}
                </span>
              </div>
            </div>

          </div>
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
        />
      )}

      {/* Tab 3: VASTU & OTHERS VIEW */}
      {mainTab === 'vastu' && (
        <VastuOthersView
          currentHeading={displayHeading}
          triggerHaptic={triggerHapticFeedback}
        />
      )}

      {/* Creator Branding Card: Always at the bottom */}
      <CreatorBanner />

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
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
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
              <div className="flex items-center p-0.5 rounded-xl bg-stone-800 border border-white/10">
                <button
                  onClick={() => setLanguage('hi')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all",
                    language === 'hi' ? "bg-amber-500 text-stone-950" : "text-stone-400"
                  )}
                >
                  हिंदी
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all",
                    language === 'en' ? "bg-amber-500 text-stone-950" : "text-stone-400"
                  )}
                >
                  English
                </button>
              </div>
            </div>

            {/* 12 Styles Gallery Trigger */}
            <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-white/5">
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
                className="px-3 py-1 rounded-xl text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30">
                {language === 'hi' ? '12+ शैलियां देखें' : 'View 12+ Styles'}
              </button>
            </div>

            {/* Vastu Grid Toggle */}
            <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-white/5">
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
                  vastuGridEnabled ? "bg-amber-500 text-stone-950" : "bg-stone-800 text-stone-400"
                )}
              >
                {vastuGridEnabled ? (language === 'hi' ? "चालू" : "ON") : (language === 'hi' ? "बंद" : "OFF")}
              </button>
            </div>

            {/* Sensor Diagnostics */}
            <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-white/5">
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
                className="px-3 py-1 rounded-xl text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {t.check}
              </button>
            </div>

            {/* Calibration Guide */}
            <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-white/5">
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
                className="px-3 py-1 rounded-xl text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {t.view}
              </button>
            </div>

            {/* Theme Switcher */}
            <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-white/5">
              <span>{t.themeMode}</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}

      {/* Sensors Inspector Modal */}
      {showSensorsModal && (
        <SensorsInspectorModal 
          isOpen={showSensorsModal} 
          onClose={() => setShowSensorsModal(false)}
          theme={theme}
          language={language}
          heading={heading}
          pitch={pitch}
          roll={roll}
        />
      )}

      {/* Calibration Guide Modal */}
      {showCalibrationModal && (
        <CalibrationGuideModal
          isOpen={showCalibrationModal}
          onClose={() => setShowCalibrationModal(false)}
          theme={theme}
          language={language}
        />
      )}

      {/* Style Selector Modal */}
      {showStyleModal && (
        <StyleSelectorModal
          isOpen={showStyleModal}
          onClose={() => setShowStyleModal(false)}
          selectedStyle={selectedStyle}
          onSelectStyle={handleSelectStyle}
          language={language}
          theme={theme}
        />
      )}
    </div>
  );
};
