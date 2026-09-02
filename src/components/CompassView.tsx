import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Compass, 
  Sunrise,
  Sunset,
  Volume2,
  VolumeX,
  CircleDot,
  Navigation,
  Share2,
  Settings,
  Zap,
  RotateCcw,
  Sparkles,
  Flashlight,
  FlashlightOff,
  Grid,
  Wind,
  Droplets,
  X,
  Palette,
  Languages
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

const STYLE_STORAGE_KEY = 'com.hcompass.app_style';

export const CompassView = () => {
  const { location, times } = useSunTimes();
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
  const [mainTab, setMainTab] = useState<'compass' | 'level'>('compass');
  const [tareOffset, setTareOffset] = useState<{ pitch: number; roll: number } | null>(null);

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
  const smoothedPitchRef = useRef<number>(0);
  const smoothedRollRef = useRef<number>(0);
  const usingAbsoluteRef = useRef<boolean>(false);
  const lastRotaryTickRef = useRef<number>(0);

  const declination = useMemo(() => {
    if (!location) return 0.8;
    const lat = location.latitude;
    const lon = location.longitude;
    return (28 - lat) * 0.1 + (lon - 77) * 0.05 + 0.5;
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
    if (!location) return null;
    try {
      const pos = SunCalc.getPosition(new Date(), location.latitude, location.longitude);
      return (pos.azimuth * 180 / Math.PI) + 180;
    } catch {
      return null;
    }
  }, [location]);

  const handleOrientation = (event: any, isAbsolute: boolean) => {
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
  }, []);

  const updateHeadingFromPointer = (clientX: number, clientY: number) => {
    if (!dialRef.current) return;
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
    isDraggingDialRef.current = true;
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch {}
    updateHeadingFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingDialRef.current) return;
    updateHeadingFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingDialRef.current = false;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
  };

  const displayHeading = useMemo(() => {
    if (heading === null) return 0;
    if (!useTrueNorth) return heading;
    return ((heading + declination) % 360 + 360) % 360;
  }, [heading, useTrueNorth, declination]);

  const isFacingQibla = useMemo(() => {
    if (displayHeading === null) return false;
    let diff = Math.abs(displayHeading - qiblaBearing);
    if (diff > 180) diff = 360 - diff;
    return diff <= 3.5;
  }, [displayHeading, qiblaBearing]);

  const isLevel = Math.abs(pitch) < 2.0 && Math.abs(roll) < 2.0;

  const copyCoordinates = async () => {
    triggerHapticFeedback();
    const lat = location ? location.latitude.toFixed(6) : '18.520400';
    const lng = location ? location.longitude.toFixed(6) : '73.856700';
    const vastu = getVastuDetails(displayHeading, language);
    const text = language === 'hi'
      ? `🧭 हिंदी कंपास:\nउत्तर: ${Math.round(displayHeading)}° (${vastu.name})\nस्थान: Lat ${lat}°N, Lon ${lng}°E`
      : `🧭 Digital Compass:\nHeading: ${Math.round(displayHeading)}° (${vastu.name})\nLocation: Lat ${lat}°N, Lon ${lng}°E`;
    
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

  const formatTime = (date: Date | null) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const vastuInfo = useMemo(() => getVastuDetails(displayHeading, language), [displayHeading, language]);

  return (
    <div className={cn(
      "w-full min-h-screen flex flex-col items-center pt-3 pb-8 px-4 select-none relative overflow-x-hidden transition-colors duration-300",
      theme === 'light' 
        ? "bg-gradient-to-b from-amber-50/70 via-stone-100 to-stone-200 text-stone-900" 
        : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#181410] via-[#0C0A08] to-[#050403] text-white"
    )}>
      <div className="absolute top-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-md flex items-center justify-between py-1 px-1 mb-2 relative z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-[2px] shadow-lg shrink-0">
            <img 
              src="/icon.png" 
              alt={t.appTitle} 
              className="w-full h-full rounded-[14px] object-cover" 
            />
          </div>
          <div className="flex flex-col text-left justify-center">
            <h1 className="text-lg font-black tracking-tight leading-snug pt-0.5 pb-0 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 dark:from-amber-400 dark:to-yellow-500 bg-clip-text text-transparent">
              {t.appTitle}
            </h1>
            <span className={cn(
              "text-[10px] font-bold leading-tight -mt-0.5",
              theme === 'light' ? "text-stone-600" : "text-stone-400"
            )}>
              {t.appSubtitle}
            </span>
          </div>
        </div>

        {/* Quick Header Controls: Language Toggle & Theme Toggle */}
        <div className="flex items-center gap-1.5">
          {/* Language Toggle Button */}
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
        </div>
      </header>

      {/* Mode Switcher: Compass vs Spirit Level */}
      <div className="w-full max-w-sm flex items-center justify-center p-1 rounded-2xl bg-stone-900/90 border border-white/10 mb-2 shadow-inner">
        <button
          onClick={() => {
            setMainTab('compass');
            triggerHapticFeedback();
          }}
          className={cn(
            "flex-1 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5",
            mainTab === 'compass'
              ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 shadow-md scale-100"
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
            "flex-1 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5",
            mainTab === 'level'
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-stone-950 shadow-md scale-100"
              : "text-stone-400 hover:text-white"
          )}
        >
          <CircleDot className="w-3.5 h-3.5" />
          <span>{t.tabLevel}</span>
        </button>
      </div>

      {mainTab === 'compass' && (
        /* Horizontal Style Quick-Bar with Gallery Opener */
        <div className="w-full max-w-sm flex items-center gap-1.5 mb-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => {
              setShowStyleModal(true);
              triggerHapticFeedback();
            }}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-400 hover:text-amber-300 text-[11px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'hi' ? '12+ शैलियां' : '12+ Styles'}</span>
          </button>

          {COMPASS_STYLES.map((st) => (
            <button
              key={st.id}
              onClick={() => handleSelectStyle(st.id)}
              className={cn(
                "px-2.5 py-1 rounded-xl text-[10.5px] font-bold whitespace-nowrap transition-all duration-200 shrink-0 border",
                selectedStyle === st.id
                  ? "bg-amber-500 text-stone-950 border-amber-400 font-black shadow-md scale-100"
                  : "bg-stone-900/80 text-stone-400 border-white/10 hover:text-white"
              )}
            >
              {language === 'hi' ? st.nameHi : st.nameEn}
            </button>
          ))}
        </div>
      )}

      {mainTab === 'level' ? (
        /* 3D Spirit Level View */
        <div className="w-full max-w-sm flex flex-col items-center justify-center my-4 animate-in fade-in zoom-in-95">
          <div className="w-full flex items-center justify-between mb-4 px-2">
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border",
              isLevel 
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse" 
                : "bg-amber-500/15 text-amber-400 border-amber-500/30"
            )}>
              {isLevel ? t.perfectLevel : `${t.tilt}: ${Math.max(Math.abs(Math.round(pitch - (tareOffset?.pitch || 0))), Math.abs(Math.round(roll - (tareOffset?.roll || 0))))}°`}
            </span>

            <button
              onClick={() => {
                triggerHapticFeedback(ImpactStyle.Medium);
                if (tareOffset) setTareOffset(null);
                else setTareOffset({ pitch, roll });
              }}
              className={cn(
                "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border flex items-center gap-1 active:scale-95",
                tareOffset 
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40" 
                  : "bg-white/5 text-stone-400 border-white/10 hover:text-white"
              )}
            >
              <RotateCcw className="w-3 h-3" />
              <span>{tareOffset ? t.resetTare : t.setTare}</span>
            </button>
          </div>

          <div className={cn(
            "relative w-64 h-64 sm:w-72 sm:h-72 rounded-full flex items-center justify-center border-[14px] sm:border-[16px] shadow-2xl transition-all duration-300 overflow-hidden",
            isLevel 
              ? "border-emerald-500/70 bg-gradient-to-tr from-[#021A0F] via-[#042817] to-[#021A0F] shadow-[0_0_50px_rgba(16,185,129,0.4)]" 
              : "border-stone-800 bg-gradient-to-tr from-[#12161C] via-[#090C10] to-[#050709] shadow-[0_0_40px_rgba(0,0,0,0.8)]"
          )}>
            <div className="absolute inset-8 rounded-full border border-white/15 pointer-events-none" />
            <div className="absolute inset-16 rounded-full border border-dashed border-white/10 pointer-events-none" />
            <div className="absolute inset-x-0 top-1/2 h-[0.5px] bg-white/20 pointer-events-none" />
            <div className="absolute inset-y-0 left-1/2 w-[0.5px] bg-white/20 pointer-events-none" />

            <div className={cn(
              "w-12 h-12 rounded-full border flex items-center justify-center transition-colors pointer-events-none",
              isLevel ? "border-emerald-400 bg-emerald-500/20 shadow-[0_0_20px_#10b981]" : "border-white/25 bg-white/5"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full transition-colors",
                isLevel ? "bg-emerald-400 shadow-[0_0_10px_#10b981]" : "bg-white/40"
              )} />
            </div>

            <div
              className={cn(
                "absolute w-12 h-12 rounded-full transition-transform duration-75 ease-out liquid-shine shadow-xl border border-white/80",
                isLevel 
                  ? "bg-gradient-to-tr from-lime-400 to-emerald-300 shadow-[0_0_25px_#10b981] scale-105" 
                  : "bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-[0_0_15px_rgba(245,158,11,0.8)]"
              )}
              style={{
                transform: `translate(${Math.max(-95, Math.min(95, -(roll - (tareOffset?.roll || 0)) * 4.5))}px, ${Math.max(-95, Math.min(95, -(pitch - (tareOffset?.pitch || 0)) * 4.5))}px)`
              }}
            />
          </div>

          <div className="w-full grid grid-cols-2 gap-3 mt-6">
            <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-white/10 flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase text-stone-400">{t.pitch}</span>
              <span className="text-xl font-black font-mono text-sky-400 mt-0.5">
                {Math.round(pitch - (tareOffset?.pitch || 0))}°
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-white/10 flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase text-stone-400">{t.roll}</span>
              <span className="text-xl font-black font-mono text-emerald-400 mt-0.5">
                {Math.round(roll - (tareOffset?.roll || 0))}°
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Dynamic Compass Dial View with Selected Style */
        <>
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

          {/* Degree & Cardinal / Vastu Readout */}
          <div className="w-full max-w-sm flex flex-col items-center text-center my-1 animate-in fade-in zoom-in-95">
            <div className="flex items-baseline justify-center gap-2.5">
              <span className={cn(
                "text-4xl sm:text-5xl font-black font-mono tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] leading-none",
                theme === 'light' ? "text-stone-900" : "text-white"
              )}>
                {displayHeading !== null ? Math.round(displayHeading) : 0}<span className="text-2xl sm:text-3xl text-stone-400">°</span>
              </span>
              <span className={cn(
                "text-2xl sm:text-3xl font-black tracking-wide drop-shadow-md",
                vastuInfo.color || "text-amber-400"
              )}>
                {vastuInfo.name}
              </span>
            </div>

            <span className={cn(
              "text-xs sm:text-sm font-semibold mt-1 px-2 text-center",
              theme === 'light' ? "text-stone-600" : "text-stone-300"
            )}>
              {isQiblaMode ? (
                <span className={cn(
                  "px-3 py-1 rounded-full inline-flex items-center gap-1.5 border shadow-sm transition-all",
                  isFacingQibla 
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse font-bold" 
                    : "bg-emerald-950/40 text-emerald-300/90 border-emerald-500/30"
                )}>
                  <span>🕋</span>
                  {isFacingQibla 
                    ? `${t.facingQibla} • ${t.distance}: ${qiblaDistanceKm.toLocaleString(language === 'hi' ? 'hi-IN' : 'en-US')} ${t.km}` 
                    : `${t.qiblaBearing}: ${qiblaBearing}° • ${t.distance}: ${qiblaDistanceKm.toLocaleString(language === 'hi' ? 'hi-IN' : 'en-US')} ${t.km}`}
                </span>
              ) : (
                `${vastuInfo.vastuTitle} • ${vastuInfo.vastuDesc}`
              )}
            </span>
          </div>

          {/* Weather & Environmental Telemetry */}
          <div className="w-full max-w-sm my-1.5 animate-in fade-in">
            <div className={cn(
              "w-full rounded-2xl p-2.5 border flex items-center justify-between text-xs backdrop-blur-md shadow-md",
              theme === 'light' ? "bg-white border-stone-200 text-stone-900" : "bg-stone-950/70 border-white/10 text-stone-200"
            )}>
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">{getWeatherIcon(weather?.code)}</span>
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-[11px] font-bold">
                    {weather ? `${weather.temp}°C • ${getWeatherDescription(weather.code, language)}` : `28°C • ${getWeatherDescription(0, language)}`}
                  </span>
                  <span className={cn("text-[9px]", theme === 'light' ? "text-stone-500" : "text-stone-400")}>
                    📍 {location?.city ? `${location.city}, ${location.state || ''}` : (language === 'hi' ? 'नई दिल्ली, भारत' : 'New Delhi, India')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-[10px] font-mono font-bold text-stone-400">
                <span className="flex items-center gap-1">
                  <Wind className="w-3 h-3 text-sky-400" />
                  {weather ? `${weather.windSpeed} km/h` : '12 km/h'}
                </span>
                <span className="flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-emerald-400" />
                  {weather ? `${weather.humidity}%` : '48%'}
                </span>
              </div>
            </div>
          </div>

          {/* Sun Times & Altitude */}
          <div className="w-full max-w-sm grid grid-cols-2 gap-2 my-1 animate-in fade-in">
            <div className={cn(
              "p-2 rounded-2xl border flex items-center justify-between text-xs backdrop-blur-md shadow-sm",
              theme === 'light' ? "bg-white border-stone-200 text-stone-900" : "bg-stone-950/70 border-white/10 text-stone-200"
            )}>
              <div className="flex items-center gap-1.5">
                <Sunrise className="w-3.5 h-3.5 text-amber-500" />
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-[8px] text-stone-400 uppercase font-bold">{t.sunrise}</span>
                  <span className="font-mono font-bold text-[11px]">{formatTime(times.sunrise)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Sunset className="w-3.5 h-3.5 text-red-500" />
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-[8px] text-stone-400 uppercase font-bold">{t.sunset}</span>
                  <span className="font-mono font-bold text-[11px]">{formatTime(times.sunset)}</span>
                </div>
              </div>
            </div>

            <div className={cn(
              "p-2 rounded-2xl border flex items-center justify-between text-xs backdrop-blur-md shadow-sm",
              theme === 'light' ? "bg-white border-stone-200 text-stone-900" : "bg-stone-950/70 border-white/10 text-stone-200"
            )}>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[8px] text-stone-400 uppercase font-bold">{t.altitude}</span>
                <span className="font-mono font-bold text-[11px] text-amber-400">
                  ⛰️ {location?.altitude ? `${Math.round(location.altitude * 3.28084)} ${t.feet}` : `708 ${t.feet}`}
                </span>
              </div>
              <span className={cn(
                "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border",
                isLevel ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-amber-500/15 text-amber-400 border-amber-500/30"
              )}>
                {isLevel ? (language === 'hi' ? "0° समतल" : "0° Level") : `${Math.round(pitch)}° ${t.tilt}`}
              </span>
            </div>
          </div>

          {/* Bottom Action Dock */}
          <div className="w-full max-w-sm flex items-center justify-between p-1.5 rounded-2xl bg-stone-900/90 border border-white/10 shadow-xl mt-2">
            <button
              onClick={toggleFlashlight}
              className={cn(
                "flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-[10px] font-bold",
                isFlashlightOn 
                  ? "bg-amber-400 text-stone-950 shadow-[0_0_15px_rgba(251,191,36,0.6)] font-black" 
                  : "text-stone-300 hover:text-white"
              )}
            >
              {isFlashlightOn ? <Flashlight className="w-4 h-4 text-stone-950 fill-stone-950" /> : <FlashlightOff className="w-4 h-4" />}
              <span>{t.torch}</span>
            </button>

            <button
              onClick={() => {
                triggerHapticFeedback(ImpactStyle.Medium);
                const next = !isQiblaMode;
                setIsQiblaMode(next);
                if (next) {
                  toast.success(`${t.qiblaBearing}: ${qiblaBearing}°`);
                }
              }}
              className={cn(
                "flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-[10px] font-bold",
                isQiblaMode 
                  ? "bg-emerald-500 text-stone-950 shadow-[0_0_15px_rgba(16,185,129,0.6)] font-black" 
                  : "text-stone-300 hover:text-white"
              )}
            >
              <span className="text-sm leading-none">🕋</span>
              <span>{t.qibla}</span>
            </button>

            <button
              onClick={() => {
                triggerHapticFeedback();
                const next = !soundEnabled;
                setSoundEnabled(next);
                localStorage.setItem('com.hcompass.app_sound', next.toString());
                if (next) playBellSound('chime');
              }}
              className={cn(
                "flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-[10px] font-bold",
                soundEnabled ? "text-amber-400 font-black" : "text-stone-500"
              )}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{t.sound}</span>
            </button>

            <button
              onClick={() => {
                triggerHapticFeedback();
                const next = !useTrueNorth;
                setUseTrueNorth(next);
                localStorage.setItem('com.hcompass.app_true_north', next.toString());
              }}
              className={cn(
                "flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-[10px] font-bold",
                useTrueNorth ? "text-sky-400 font-black" : "text-stone-500"
              )}
            >
              <Navigation className="w-4 h-4 rotate-45" />
              <span>{useTrueNorth ? t.trueNorth : t.magneticNorth}</span>
            </button>

            <button
              onClick={copyCoordinates}
              className="flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-[10px] font-bold text-stone-300 hover:text-white"
            >
              <Share2 className="w-4 h-4" />
              <span>{t.share}</span>
            </button>

            <button
              onClick={() => {
                triggerHapticFeedback();
                setShowSettings(true);
              }}
              className="flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-[10px] font-bold text-stone-300 hover:text-white"
            >
              <Settings className="w-4 h-4" />
              <span>{t.settings}</span>
            </button>
          </div>

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
        </>
      )}
    </div>
  );
};
