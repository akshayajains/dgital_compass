import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Compass, 
  Sun, 
  Sunrise,
  Sunset,
  Volume2,
  VolumeX,
  Sliders,
  CircleDot,
  Navigation,
  Copy,
  Share2,
  Settings,
  Zap,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle2,
  Flashlight,
  FlashlightOff,
  Grid,
  CloudSun,
  Wind,
  Droplets,
  X
} from 'lucide-react';
import { useSunTimes } from '@/hooks/useSunTimes';
import SunCalc from 'suncalc';
import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { CalibrationGuideModal } from '@/components/compass/CalibrationGuideModal';
import { SensorsInspectorModal } from '@/components/compass/SensorsInspectorModal';

export const CompassView = () => {
  const { location, times } = useSunTimes();
  const { theme } = useTheme();

  const [heading, setHeading] = useState<number | null>(null);
  const [pitch, setPitch] = useState<number>(0);
  const [roll, setRoll] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [magneticInterference, setMagneticInterference] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showCalibrationModal, setShowCalibrationModal] = useState<boolean>(false);
  const [showSensorsModal, setShowSensorsModal] = useState<boolean>(false);
  const [mainTab, setMainTab] = useState<'compass' | 'level'>('compass');
  const [tareOffset, setTareOffset] = useState<{ pitch: number; roll: number } | null>(null);

  // Weather state
  const [weather, setWeather] = useState<{
    temp: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    code: number;
  } | null>(null);

  // 3 Themes: "classic", "chandan", and "dark"
  const [selectedStyle, setSelectedStyle] = useState<'classic' | 'chandan' | 'dark'>('classic');

  // Persisted Preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('com.hcompass.app_sound') !== 'false'; } catch { return true; }
  });

  const [useTrueNorth, setUseTrueNorth] = useState<boolean>(() => {
    try { return localStorage.getItem('com.hcompass.app_true_north') === 'true'; } catch { return false; }
  });

  const [hapticEnabled, setHapticEnabled] = useState<boolean>(() => {
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

  // Fully localized weather descriptions
  const getWeatherDesc = (code?: number) => {
    if (code === undefined || code === null) return 'साफ़ आसमान';
    if (code === 0) return 'साफ़ आसमान';
    if (code >= 1 && code <= 3) return 'हल्के बादल';
    if (code === 45 || code === 48) return 'कोहरा';
    if (code >= 51 && code <= 65) return 'वर्षा';
    if (code >= 80 && code <= 82) return 'बौछारें';
    if (code >= 95) return 'गरज के साथ वर्षा';
    return 'सुहावना मौसम';
  };

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

  // Toggle Hardware Flashlight (Safe)
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

  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(false);
  const dialRef = useRef<HTMLDivElement>(null);
  const isDraggingDialRef = useRef<boolean>(false);

  const smoothedVectorRef = useRef<{ x: number; y: number } | null>(null);
  const smoothedPitchRef = useRef<number>(0);
  const smoothedRollRef = useRef<number>(0);
  const usingAbsoluteRef = useRef<boolean>(false);
  const lastVibratedZone = useRef<string | null>(null);
  const lastSoundZone = useRef<string | null>(null);
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
          if (res !== 'granted') {
            setIsSimulatedMode(true);
            return;
          }
        } catch {
          setIsSimulatedMode(true);
        }
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
  }, [hapticEnabled, soundEnabled]);

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
    setIsSimulatedMode(true);
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

  // 100% Fully localized Vastu & Cardinal information
  const getVastuInfo = (deg: number | null) => {
    if (deg === null || isNaN(deg)) return { name: 'उत्तर (North)', code: 'N', vastuTitle: 'कुबेर स्थान (उत्तर)', vastuDesc: 'धन, व्यापार व समृद्धि • जल तत्व', color: 'text-red-400' };
    const norm = ((deg % 360) + 360) % 360;
    if (norm >= 337.5 || norm < 22.5) {
      return { name: 'उत्तर (North)', code: 'N', vastuTitle: 'कुबेर स्थान (उत्तर)', vastuDesc: 'धन, व्यापार व समृद्धि • जल तत्व', color: 'text-red-400' };
    }
    if (norm >= 22.5 && norm < 67.5) {
      return { name: 'ईशान (North-East)', code: 'NE', vastuTitle: 'मंदिर व पूजा स्थल', vastuDesc: 'देव स्थान • ध्यान व सकारात्मक ऊर्जा (शुभ)', color: 'text-yellow-400' };
    }
    if (norm >= 67.5 && norm < 112.5) {
      return { name: 'पूर्व (East)', code: 'E', vastuTitle: 'इंद्र स्थान (पूर्व)', vastuDesc: 'मुख्य द्वार, स्वास्थ्य व नव ऊर्जा', color: 'text-emerald-400' };
    }
    if (norm >= 112.5 && norm < 157.5) {
      return { name: 'आग्नेय (South-East)', code: 'SE', vastuTitle: 'रसोई व अग्नि तत्व (Rasoi)', vastuDesc: 'भोजन, ऊर्जा व पाचन शक्ति', color: 'text-orange-400' };
    }
    if (norm >= 157.5 && norm < 202.5) {
      return { name: 'दक्षिण (South)', code: 'S', vastuTitle: 'यम स्थान (दक्षिण)', vastuDesc: 'स्थिरता, विश्राम व भारी निर्माण', color: 'text-red-400' };
    }
    if (norm >= 202.5 && norm < 247.5) {
      return { name: 'नैऋत्य (South-West)', code: 'SW', vastuTitle: 'मुख्य शयन कक्ष (Shayan)', vastuDesc: 'गृहस्वामी कक्ष • नेतृत्व व स्थायित्व', color: 'text-yellow-400' };
    }
    if (norm >= 247.5 && norm < 292.5) {
      return { name: 'पश्चिम (West)', code: 'W', vastuTitle: 'वरुण स्थान (पश्चिम)', vastuDesc: 'अध्ययन कक्ष, लाभ व भोजन कक्ष', color: 'text-slate-200' };
    }
    return { name: 'वायव्य (North-West)', code: 'NW', vastuTitle: 'अतिथि कक्ष (Atithi)', vastuDesc: 'वायु तत्व • भंडार व संबंध', color: 'text-sky-400' };
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
    const text = `🧭 हिंदी कंपास:\nउत्तर: ${Math.round(displayHeading)}°\nLat: ${lat}°N, Lon: ${lng}°E`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'हिंदी कंपास', text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success('Coordinates copied!');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        toast.success('Coordinates copied!');
      } catch {}
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn(
      "w-full min-h-screen flex flex-col items-center pt-4 pb-8 px-4 select-none relative overflow-x-hidden transition-colors duration-300",
      theme === 'light' 
        ? "bg-gradient-to-b from-amber-50/60 via-stone-100 to-stone-200 text-stone-900" 
        : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#181510] via-[#0C0A08] to-[#050403] text-white"
    )}>
      <div className="absolute top-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="w-full flex items-center justify-between py-1 px-1 mb-2 relative z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-[2px] shadow-lg shrink-0">
            <img 
              src="/icon.png" 
              alt="हिंदी कंपास" 
              className="w-full h-full rounded-[14px] object-cover" 
            />
          </div>
          <div className="flex flex-col text-left justify-center">
            <h1 className="text-lg font-black tracking-tight leading-snug pt-0.5 pb-0 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 dark:from-amber-400 dark:to-yellow-500 bg-clip-text text-transparent">
              हिंदी कंपास
            </h1>
            <span className={cn(
              "text-[10px] font-bold leading-tight -mt-0.5",
              theme === 'light' ? "text-stone-600" : "text-stone-400"
            )}>
              सटीक 360° दिशा एवं वास्तु दर्शक
            </span>
          </div>
        </div>

        {/* Theme Switcher */}
        {mainTab === 'compass' && (
          <div className="flex items-center p-1 rounded-2xl bg-stone-950/70 border border-white/10 shadow-sm">
            <button
              onClick={() => {
                setSelectedStyle('classic');
                triggerHapticFeedback();
              }}
              className={cn(
                "px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300",
                selectedStyle === 'classic'
                  ? "bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-stone-950 shadow-md scale-100 font-black"
                  : "text-stone-400 hover:text-white"
              )}
            >
              क्लासिक
            </button>
            <button
              onClick={() => {
                setSelectedStyle('chandan');
                triggerHapticFeedback();
              }}
              className={cn(
                "px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300",
                selectedStyle === 'chandan'
                  ? "bg-gradient-to-r from-amber-700 to-yellow-600 text-amber-100 shadow-md scale-100 font-black"
                  : "text-stone-400 hover:text-white"
              )}
            >
              चंदन
            </button>
            <button
              onClick={() => {
                setSelectedStyle('dark');
                triggerHapticFeedback();
              }}
              className={cn(
                "px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300",
                selectedStyle === 'dark'
                  ? "bg-white text-stone-950 shadow-md scale-100 border border-white font-black"
                  : "text-stone-400 hover:text-white"
              )}
            >
              डार्क
            </button>
          </div>
        )}
      </header>

      {/* Mode Switcher */}
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
          <span>कंपास</span>
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
          <span>समतल स्तर</span>
        </button>
      </div>

      {mainTab === 'level' ? (
        /* Spirit Level View */
        <div className="w-full max-w-sm flex flex-col items-center justify-center my-4 animate-in fade-in zoom-in-95">
          <div className="w-full flex items-center justify-between mb-4 px-2">
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border",
              isLevel 
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse" 
                : "bg-amber-500/15 text-amber-400 border-amber-500/30"
            )}>
              {isLevel ? "✓ 0.0° पूर्ण समतल" : `झुकाव: ${Math.max(Math.abs(Math.round(pitch - (tareOffset?.pitch || 0))), Math.abs(Math.round(roll - (tareOffset?.roll || 0))))}°`}
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
              <span>{tareOffset ? "रीसेट करें" : "शून्य तय करें"}</span>
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
              <span className="text-[10px] font-bold uppercase text-stone-400">पिच (आगे-पीछे)</span>
              <span className="text-xl font-black font-mono text-sky-400 mt-0.5">
                {Math.round(pitch - (tareOffset?.pitch || 0))}°
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-white/10 flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase text-stone-400">रोल (दाएं-बाएं)</span>
              <span className="text-xl font-black font-mono text-emerald-400 mt-0.5">
                {Math.round(roll - (tareOffset?.roll || 0))}°
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Compass Dial View */
        <>
          <div className="relative my-2 flex flex-col items-center justify-center">
            <div className="absolute -top-3 z-30 flex flex-col items-center pointer-events-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
              <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[14px] border-t-[#EF4444]" />
            </div>

            <div
              ref={dialRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={cn(
                "w-[21.5rem] h-[21.5rem] sm:w-[23.5rem] sm:h-[23.5rem] rounded-full flex items-center justify-center relative transition-transform duration-75 ease-out select-none cursor-grab active:cursor-grabbing touch-none",
                selectedStyle === 'classic'
                  ? "border-[16px] sm:border-[20px] border-[#374151] shadow-[0_20px_60px_rgba(0,0,0,0.95),inset_0_3px_6px_rgba(251,191,36,0.4),inset_0_-6px_14px_rgba(0,0,0,0.95)] bg-gradient-to-tr from-[#1E293B] via-[#475569] to-[#0F172A]"
                  : selectedStyle === 'chandan'
                  ? "border-[20px] sm:border-[24px] border-[#C29B70] shadow-[0_15px_45px_rgba(78,53,36,0.6),inset_0_3px_6px_rgba(255,255,255,0.7),inset_0_-6px_12px_rgba(78,53,36,0.9)] bg-gradient-to-br from-[#E6D2BA] via-[#C9A67E] to-[#8C6239]"
                  : "border-[16px] sm:border-[20px] border-[#22201D] shadow-[0_25px_60px_rgba(0,0,0,0.98),inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-5px_12px_rgba(0,0,0,0.95)] bg-[#11100E]"
              )}
              style={{
                transform: `rotate(${displayHeading !== null ? -displayHeading : 0}deg)`,
                willChange: 'transform'
              }}
            >
              <div className={cn(
                "absolute inset-0 rounded-full overflow-hidden flex items-center justify-center",
                selectedStyle === 'classic'
                  ? "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1E232D] via-[#12161F] to-[#090B0F]"
                  : selectedStyle === 'chandan'
                  ? "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#F4E8D8] via-[#E2CEB5] to-[#C9A882]"
                  : "bg-[#09090A]"
              )}>
                
                {selectedStyle === 'classic' && (
                  <>
                    <div className="absolute inset-3.5 rounded-full border border-amber-400/35 pointer-events-none shadow-[0_0_15px_rgba(245,158,11,0.15)]" />
                    <div className="absolute inset-9 rounded-full border border-white/10 pointer-events-none" />
                    <div className="absolute inset-[4.2rem] rounded-full border border-amber-400/20 pointer-events-none" />
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 200 200">
                      <circle cx="100" cy="100" r="50" fill="none" stroke="#F59E0B" strokeWidth="0.6" strokeDasharray="2 2" />
                      <line x1="100" y1="18" x2="100" y2="182" stroke="#F59E0B" strokeWidth="0.4" strokeDasharray="3 3" />
                      <line x1="18" y1="100" x2="182" y2="100" stroke="#F59E0B" strokeWidth="0.4" strokeDasharray="3 3" />
                    </svg>
                  </>
                )}

                {selectedStyle === 'dark' && vastuGridEnabled && (
                  <>
                    <div className="absolute inset-10 rounded-full border border-amber-500/15 pointer-events-none" />
                    <div className="absolute inset-20 rounded-full border border-dashed border-amber-500/10 pointer-events-none" />
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 200 200">
                      <rect x="44" y="44" width="112" height="112" fill="none" stroke="#F59E0B" strokeWidth="0.5" strokeDasharray="2 2" />
                      <circle cx="100" cy="100" r="56" fill="none" stroke="#F59E0B" strokeWidth="0.5" />
                      <circle cx="100" cy="100" r="28" fill="none" stroke="#F59E0B" strokeWidth="0.4" />
                      <line x1="44" y1="44" x2="156" y2="156" stroke="#F59E0B" strokeWidth="0.4" strokeDasharray="2 2" />
                      <line x1="156" y1="44" x2="44" y2="156" stroke="#F59E0B" strokeWidth="0.4" strokeDasharray="2 2" />
                      <line x1="100" y1="16" x2="100" y2="184" stroke="#F59E0B" strokeWidth="0.4" />
                      <line x1="16" y1="100" x2="184" y2="100" stroke="#F59E0B" strokeWidth="0.4" />
                    </svg>

                    {/* Vastu Room Labels in native script */}
                    <div className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: 'rotate(45deg)' }}>
                      <div className="flex flex-col items-center mt-14 select-none">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mb-0.5 shadow-[0_0_6px_#f59e0b]" />
                        <span className="text-[9px] font-black text-amber-400 leading-none">ईशान</span>
                        <span className="text-[7.5px] font-bold text-amber-300/90 tracking-wide leading-none mt-0.5">मंदिर</span>
                      </div>
                    </div>

                    <div className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: 'rotate(135deg)' }}>
                      <div className="flex flex-col items-center mt-14 select-none">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mb-0.5 shadow-[0_0_6px_#f97316]" />
                        <span className="text-[9px] font-black text-orange-400 leading-none">आग्नेय</span>
                        <span className="text-[7.5px] font-bold text-orange-300/90 tracking-wide leading-none mt-0.5">रसोई</span>
                      </div>
                    </div>

                    <div className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: 'rotate(225deg)' }}>
                      <div className="flex flex-col items-center mt-14 select-none">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mb-0.5 shadow-[0_0_6px_#eab308]" />
                        <span className="text-[9px] font-black text-yellow-400 leading-none">नैऋत्य</span>
                        <span className="text-[7.5px] font-bold text-yellow-300/90 tracking-wide leading-none mt-0.5">शयन</span>
                      </div>
                    </div>

                    <div className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: 'rotate(315deg)' }}>
                      <div className="flex flex-col items-center mt-14 select-none">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mb-0.5 shadow-[0_0_6px_#38bdf8]" />
                        <span className="text-[9px] font-black text-sky-400 leading-none">वायव्य</span>
                        <span className="text-[7.5px] font-bold text-sky-300/90 tracking-wide leading-none mt-0.5">अतिथि</span>
                      </div>
                    </div>
                  </>
                )}

                {selectedStyle !== 'dark' && (
                  [...Array(72)].map((_, i) => {
                    const deg = i * 5;
                    const isMajor = deg % 45 === 0;
                    const isMid = deg % 15 === 0;
                    return (
                      <div key={deg} className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: `rotate(${deg}deg)` }}>
                        <div className={cn(
                          "rounded-full mt-2",
                          isMajor 
                            ? "w-[2.5px] h-3.5 bg-[#EF4444] shadow-sm" 
                            : isMid 
                            ? (selectedStyle === 'classic' ? "w-[1.8px] h-3 bg-amber-400/90 shadow-[0_0_4px_rgba(245,158,11,0.5)]" : "w-[1.5px] h-2.5 bg-[#8C5824]") 
                            : (selectedStyle === 'classic' ? "w-[1px] h-1.5 bg-amber-400/35" : "w-[1px] h-1.5 bg-[#8C5824]/40")
                        )} />
                      </div>
                    );
                  })
                )}

                {selectedStyle === 'dark' && (
                  [...Array(180)].map((_, i) => {
                    const deg = i * 2;
                    const isCardinal = deg % 90 === 0;
                    const isMajor30 = deg % 30 === 0;
                    const isMajor45 = deg % 45 === 0;
                    return (
                      <div key={deg} className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: `rotate(${deg}deg)` }}>
                        <div className={cn(
                          "rounded-full mt-1.5",
                          isCardinal ? "w-[2.5px] h-4 bg-red-500 shadow-[0_0_6px_#ef4444]" :
                          isMajor45 ? "w-[2px] h-3.5 bg-amber-400 shadow-[0_0_4px_#f59e0b]" :
                          isMajor30 ? "w-[2px] h-3 bg-white" :
                          "w-[1px] h-1.5 bg-white/30"
                        )} />
                      </div>
                    );
                  })
                )}

                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                  <div key={deg} className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: `rotate(${deg}deg)` }}>
                    <div className="flex flex-col items-center select-none mt-1">
                      <span className={cn(
                        "font-mono font-bold text-[0.52rem] drop-shadow-md",
                        selectedStyle === 'classic' ? "text-amber-200/90" : selectedStyle === 'chandan' ? "text-[#5C3818]" : "text-stone-400 font-semibold"
                      )}>
                        {deg}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Regional Cardinal Badges */}
                {selectedStyle === 'dark' ? (
                  [
                    { code: 'उत्तर', degNum: '0°', d: 0, color: 'text-red-500 font-black scale-105', barColor: 'bg-red-500' },
                    { code: 'ईशान', degNum: '45°', d: 45, color: 'text-yellow-400', barColor: 'bg-yellow-400' },
                    { code: 'पूर्व', degNum: '90°', d: 90, color: 'text-emerald-400', barColor: 'bg-emerald-400' },
                    { code: 'आग्नेय', degNum: '135°', d: 135, color: 'text-orange-400', barColor: 'bg-orange-400' },
                    { code: 'दक्षिण', degNum: '180°', d: 180, color: 'text-red-500 font-black scale-105', barColor: 'bg-red-500' },
                    { code: 'नैऋत्य', degNum: '225°', d: 225, color: 'text-yellow-400', barColor: 'bg-yellow-400' },
                    { code: 'पश्चिम', degNum: '270°', d: 270, color: 'text-slate-200', barColor: 'bg-slate-200' },
                    { code: 'वायव्य', degNum: '315°', d: 315, color: 'text-sky-400', barColor: 'bg-sky-400' }
                  ].map((pt) => (
                    <div key={pt.code} className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: `rotate(${pt.d}deg)` }}>
                      <div className="flex flex-col items-center select-none mt-5">
                        <div className={cn("w-1.5 h-2.5 rounded-full mb-0.5", pt.barColor)} />
                        <span className={cn("font-black text-[10px] tracking-tight drop-shadow-md leading-none", pt.color)}>
                          {pt.code}
                        </span>
                        <span className={cn("font-mono text-[7.5px] font-bold leading-none mt-0.5", pt.color)}>
                          {pt.degNum}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  [
                    { l: 'उत्तर', d: 0, isRed: true },
                    { l: 'ईशान', d: 45 },
                    { l: 'पूर्व', d: 90 },
                    { l: 'आग्नेय', d: 135 },
                    { l: 'दक्षिण', d: 180 },
                    { l: 'नैऋत्य', d: 225 },
                    { l: 'पश्चिम', d: 270 },
                    { l: 'वायव्य', d: 315 }
                  ].map((pt) => (
                    <div key={pt.l} className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: `rotate(${pt.d}deg)` }}>
                      <div className="flex flex-col items-center select-none mt-5">
                        <span className={cn(
                          "font-black text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-tight",
                          pt.isRed 
                            ? "text-[#EF4444] text-base font-black scale-105" 
                            : (selectedStyle === 'chandan' ? "text-[#3E2718]" : "text-amber-100")
                        )}>
                          {pt.l}
                        </span>
                      </div>
                    </div>
                  ))
                )}

                {/* Sun Badge */}
                {sunPos !== null && (
                  <div className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: `rotate(${sunPos}deg)` }}>
                    <div className="flex flex-col items-center mt-12 animate-pulse">
                      <div className="flex items-center gap-1 bg-amber-500/90 text-stone-950 px-1.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.9)] border border-amber-300">
                        <Sun className="w-3 h-3 fill-amber-300 text-stone-950" />
                        <span className="text-[8px] font-black tracking-wider leading-none">सूर्य</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Qibla Indicator on Dial */}
                {isQiblaMode && (
                  <div className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: `rotate(${qiblaBearing}deg)` }}>
                    <div className="flex flex-col items-center mt-9 animate-bounce">
                      <div className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-2xl transition-all duration-300",
                        isFacingQibla 
                          ? "bg-gradient-to-r from-emerald-400 to-teal-400 text-stone-950 border-emerald-200 shadow-[0_0_25px_#10b981] scale-110 font-black" 
                          : "bg-stone-950/95 text-emerald-300 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                      )}>
                        <span className="text-sm">🕋</span>
                        <div className="flex flex-col text-left leading-none">
                          <span className="text-[9px] font-black tracking-wider">किबला {qiblaBearing}°</span>
                          <span className="text-[7px] font-bold opacity-80 mt-0.5">{qiblaDistanceKm.toLocaleString('hi-IN')} किमी</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stationary Needle Overlay */}
            <div 
              className="absolute inset-0 rounded-full pointer-events-none flex items-center justify-center overflow-visible z-20"
              style={{
                transform: `translate3d(${roll * 0.15}px, ${-pitch * 0.15}px, 0px)`
              }}
            >
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {selectedStyle === 'classic' ? (
                  /* Classic: Bold 3D Bicolor Delta Arrow (Clean, zero overlap with North) */
                  <svg className="w-full h-full p-2.5 drop-shadow-[0_12px_28px_rgba(0,0,0,0.95)]" viewBox="0 0 200 200">
                    <defs>
                      <linearGradient id="classicGreyWhite" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="60%" stopColor="#E2E8F0" />
                        <stop offset="100%" stopColor="#CBD5E1" />
                      </linearGradient>
                      <linearGradient id="classicCrimsonRed" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#EF4444" />
                        <stop offset="50%" stopColor="#DC2626" />
                        <stop offset="100%" stopColor="#991B1B" />
                      </linearGradient>
                    </defs>

                    <polygon
                      points="100,36 78,76 100,64"
                      fill="url(#classicGreyWhite)"
                      stroke="#94A3B8"
                      strokeWidth="0.8"
                      strokeLinejoin="round"
                      className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                    />
                    <polygon
                      points="100,36 100,64 122,76"
                      fill="url(#classicCrimsonRed)"
                      stroke="#7F1D1D"
                      strokeWidth="0.8"
                      strokeLinejoin="round"
                      className="drop-shadow-[0_4px_16px_rgba(239,68,68,0.7)]"
                    />
                    <line x1="100" y1="36" x2="100" y2="64" stroke="#475569" strokeWidth="1" />
                    <circle cx="100" cy="100" r="14" fill="none" stroke="#D4AF37" strokeWidth="1.8" />
                  </svg>
                ) : selectedStyle === 'chandan' ? (
                  /* Chandan: Full Majestic 2-Sided 3D Needle */
                  <svg className="w-full h-full p-2.5 drop-shadow-[0_8px_24px_rgba(78,53,36,0.95)]" viewBox="0 0 200 200">
                    <polygon points="100,190 90,100 100,112" fill="#8C6239" />
                    <polygon points="100,190 110,100 100,112" fill="#4E3524" />
                    <line x1="100" y1="112" x2="100" y2="188" stroke="#D4AF37" strokeWidth="1" opacity="0.7" />

                    <polygon points="100,10 88,100 100,88" fill="#EF4444" className="drop-shadow-[0_0_16px_rgba(239,68,68,0.85)]" />
                    <polygon points="100,10 112,100 100,88" fill="#B91C1C" />
                    <line x1="100" y1="10" x2="100" y2="88" stroke="#FDE047" strokeWidth="1.6" />

                    <circle cx="100" cy="100" r="15" fill="none" stroke="#C29B70" strokeWidth="2.5" className="drop-shadow-md" />
                    <circle cx="100" cy="100" r="12" fill="none" stroke="#FDE047" strokeWidth="0.8" opacity="0.8" />
                  </svg>
                ) : (
                  /* Dark: Minimal pointer with emerald beacon */
                  <div className="absolute top-2 flex flex-col items-center z-30">
                    <div className="w-[3.5px] h-6 bg-gradient-to-b from-red-500 to-red-600 rounded-full shadow-[0_0_12px_#ef4444]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] -mt-1" />
                  </div>
                )}
              </div>

              {/* Center Precision Liquid Spirit Bubble Hub */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className={cn(
                  "w-14 h-14 rounded-full relative overflow-hidden flex flex-col items-center justify-center transition-all duration-300 backdrop-blur-md shadow-2xl",
                  selectedStyle === 'classic'
                    ? "border-2 border-amber-400/60 bg-[#1E232B]/95 shadow-[0_4px_25px_rgba(245,158,11,0.3)]"
                    : isLevel 
                    ? "border-2 border-emerald-400/80 bg-emerald-950/60 shadow-[0_0_20px_rgba(52,211,153,0.6)] animate-pulse" 
                    : "border border-amber-400/40 bg-stone-950/80 shadow-inner"
                )}>
                  <div className="absolute w-full h-[0.5px] bg-white/20" />
                  <div className="absolute h-full w-[0.5px] bg-white/20" />
                  
                  <div className={cn(
                    "absolute w-7 h-7 rounded-full border flex items-center justify-center transition-colors",
                    isLevel ? "border-emerald-400/80 shadow-[0_0_12px_#10b981]" : "border-emerald-500/40"
                  )}>
                    <span className="text-[8px] font-black text-emerald-400/80 leading-none">उ</span>
                  </div>

                  <div 
                    className={cn(
                      "absolute w-4 h-4 rounded-full transition-transform duration-75 ease-out liquid-shine shadow-md",
                      isLevel 
                        ? "bg-emerald-400 shadow-[0_0_14px_#34d399] scale-110" 
                        : "bg-emerald-300/80 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                    )}
                    style={{
                      transform: `translate(${Math.max(-14, Math.min(14, -roll * 0.5))}px, ${Math.max(-14, Math.min(14, -pitch * 0.5))}px)`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Same Line Degree & Cardinal Readout */}
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
                getVastuInfo(displayHeading).color || "text-amber-400"
              )}>
                {getVastuInfo(displayHeading).name}
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
                    ? `✓ मक्का किबला की सटीक दिशा • काबा दूरी: ${qiblaDistanceKm.toLocaleString('hi-IN')} किमी` 
                    : `मक्का (किबला) दिशा: ${qiblaBearing}° • दूरी: ${qiblaDistanceKm.toLocaleString('hi-IN')} किमी`}
                </span>
              ) : (
                `${getVastuInfo(displayHeading).vastuTitle} • ${getVastuInfo(displayHeading).vastuDesc}`
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
                    {weather ? `${weather.temp}°C • ${getWeatherDesc(weather.code)}` : `28°C • ${getWeatherDesc(0)}`}
                  </span>
                  <span className={cn("text-[9px]", theme === 'light' ? "text-stone-500" : "text-stone-400")}>
                    📍 {location?.city ? `${location.city}, ${location.state || ''}` : 'नई दिल्ली, भारत'}
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
                  <span className="text-[8px] text-stone-400 uppercase font-bold">सूर्योदय</span>
                  <span className="font-mono font-bold text-[11px]">{formatTime(times.sunrise)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Sunset className="w-3.5 h-3.5 text-red-500" />
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-[8px] text-stone-400 uppercase font-bold">सूर्यास्त</span>
                  <span className="font-mono font-bold text-[11px]">{formatTime(times.sunset)}</span>
                </div>
              </div>
            </div>

            <div className={cn(
              "p-2 rounded-2xl border flex items-center justify-between text-xs backdrop-blur-md shadow-sm",
              theme === 'light' ? "bg-white border-stone-200 text-stone-900" : "bg-stone-950/70 border-white/10 text-stone-200"
            )}>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[8px] text-stone-400 uppercase font-bold">ऊंचाई • झुकाव</span>
                <span className="font-mono font-bold text-[11px] text-amber-400">
                  ⛰️ {location?.altitude ? `${Math.round(location.altitude * 3.28084)} फीट` : `708 फीट`}
                </span>
              </div>
              <span className={cn(
                "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border",
                isLevel ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-amber-500/15 text-amber-400 border-amber-500/30"
              )}>
                {isLevel ? "0° समतल" : `${Math.round(pitch)}° झुकाव`}
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
              <span>टॉर्च</span>
            </button>

            <button
              onClick={() => {
                triggerHapticFeedback(ImpactStyle.Medium);
                const next = !isQiblaMode;
                setIsQiblaMode(next);
                if (next) {
                  toast.success(`किबला: ${qiblaBearing}°`);
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
              <span>किबला</span>
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
              <span>ध्वनि</span>
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
              <span>उत्तर</span>
            </button>

            <button
              onClick={copyCoordinates}
              className="flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-[10px] font-bold text-stone-300 hover:text-white"
            >
              <Share2 className="w-4 h-4" />
              <span>साझा</span>
            </button>

            <button
              onClick={() => {
                triggerHapticFeedback();
                setShowSettings(true);
              }}
              className="flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-[10px] font-bold text-stone-300 hover:text-white"
            >
              <Settings className="w-4 h-4" />
              <span>सेटिंग्स</span>
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
                  <span className="text-sm font-black tracking-wide text-amber-500">सेटिंग्स</span>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-stone-400" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2">
                    <Grid className="w-4 h-4 text-amber-500" />
                    वास्तु ग्रिड
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
                    {vastuGridEnabled ? "चालू" : "बंद"}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-white/5">
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    सेंसर परीक्षण
                  </span>
                  <button
                    onClick={() => {
                      triggerHapticFeedback();
                      setShowSettings(false);
                      setShowSensorsModal(true);
                    }}
                    className="px-3 py-1 rounded-xl text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    जांचें
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-white/5">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    कैलिब्रेशन गाइड
                  </span>
                  <button
                    onClick={() => {
                      triggerHapticFeedback();
                      setShowSettings(false);
                      setShowCalibrationModal(true);
                    }}
                    className="px-3 py-1 rounded-xl text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    देखें
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-white/5">
                  <span>थीम मोड</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          )}

          {showSensorsModal && (
            <SensorsInspectorModal 
              isOpen={showSensorsModal} 
              onClose={() => setShowSensorsModal(false)}
              theme={theme}
              heading={heading}
              pitch={pitch}
              roll={roll}
            />
          )}

          {showCalibrationModal && (
            <CalibrationGuideModal
              isOpen={showCalibrationModal}
              onClose={() => setShowCalibrationModal(false)}
              theme={theme}
            />
          )}
        </>
      )}
    </div>
  );
};
