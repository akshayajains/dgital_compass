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
  CheckCircle2
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

  // 3 Themes: "क्लासिक" (Classic), "चंदन" (Chandan), and "डार्क" (Dark)
  const [selectedStyle, setSelectedStyle] = useState<'classic' | 'chandan' | 'dark'>('classic');

  // Persisted Preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('hindi_compass_sound') !== 'false'; } catch { return true; }
  });

  const [useTrueNorth, setUseTrueNorth] = useState<boolean>(() => {
    try { return localStorage.getItem('hindi_compass_true_north') === 'true'; } catch { return false; }
  });

  const [hapticEnabled, setHapticEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('hindi_compass_haptic') !== 'false'; } catch { return true; }
  });

  // Simulator mode for web testing
  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(false);
  const dialRef = useRef<HTMLDivElement>(null);
  const isDraggingDialRef = useRef<boolean>(false);

  // Smoothing filters & refs
  const smoothedVectorRef = useRef<{ x: number; y: number } | null>(null);
  const smoothedPitchRef = useRef<number>(0);
  const smoothedRollRef = useRef<number>(0);
  const usingAbsoluteRef = useRef<boolean>(false);
  const lastVibratedZone = useRef<string | null>(null);
  const lastSoundZone = useRef<string | null>(null);
  const lastRotaryTickRef = useRef<number>(0);

  // Magnetic declination estimate (India avg ~0.5° - 1.5°)
  const declination = useMemo(() => {
    if (!location) return 0.8;
    // Simple declination estimate for Indian subcontinent
    const lat = location.latitude;
    const lon = location.longitude;
    return (28 - lat) * 0.1 + (lon - 77) * 0.05 + 0.5;
  }, [location]);

  // Haptic feedback trigger
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

  // Auspicious bell chord
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

  // Sun Azimuth Calculation
  const sunPos = useMemo(() => {
    if (!location) return null;
    try {
      const pos = SunCalc.getPosition(new Date(), location.latitude, location.longitude);
      return (pos.azimuth * 180 / Math.PI) + 180;
    } catch {
      return null;
    }
  }, [location]);

  // Orientation event handler with vector low-pass filter
  const handleOrientation = (event: any, isAbsolute: boolean) => {
    if (!isAbsolute && usingAbsoluteRef.current) return;

    let compassHeading: number | null = null;

    if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
      // iOS
      compassHeading = event.webkitCompassHeading;
    } else if (isAbsolute && event.alpha !== null && event.alpha !== undefined) {
      // Android absolute
      usingAbsoluteRef.current = true;
      compassHeading = (360 - event.alpha + 360) % 360;
    } else if (!usingAbsoluteRef.current && event.alpha !== null && event.alpha !== undefined) {
      // Android relative fallback with tilt compensation
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
      const targetX = Math.cos(targetRad);
      const targetY = Math.sin(targetRad);

      if (smoothedVectorRef.current === null) {
        smoothedVectorRef.current = { x: targetX, y: targetY };
      } else {
        const curRad = Math.atan2(smoothedVectorRef.current.y, smoothedVectorRef.current.x);
        let curDeg = curRad * (180 / Math.PI);
        if (curDeg < 0) curDeg += 360;

        let diff = compassHeading - curDeg;
        while (diff < -180) diff += 360;
        while (diff > 180) diff -= 360;
        const absDiff = Math.abs(diff);

        let factor: number;
        if (absDiff < 0.5) factor = 0.00;
        else if (absDiff < 3.0) factor = 0.04;
        else if (absDiff < 15.0) factor = 0.10;
        else factor = 0.16;

        const maxStepRad = 3.0 * (Math.PI / 180);
        const stepX = factor * (targetX - smoothedVectorRef.current.x);
        const stepY = factor * (targetY - smoothedVectorRef.current.y);
        const stepMag = Math.sqrt(stepX * stepX + stepY * stepY);
        const clampedMag = Math.min(stepMag, maxStepRad);
        const scale = stepMag > 0 ? clampedMag / stepMag : 0;

        smoothedVectorRef.current.x += stepX * scale;
        smoothedVectorRef.current.y += stepY * scale;

        const mag = Math.sqrt(smoothedVectorRef.current.x ** 2 + smoothedVectorRef.current.y ** 2);
        if (mag > 0) {
          smoothedVectorRef.current.x /= mag;
          smoothedVectorRef.current.y /= mag;
        }
      }

      const smoothRad = Math.atan2(smoothedVectorRef.current.y, smoothedVectorRef.current.x);
      let smoothed = smoothRad * (180 / Math.PI);
      if (smoothed < 0) smoothed += 360;
      setHeading(smoothed);

      // Micro-tick haptic on cardinal 45°
      if (hapticEnabled) {
        const tickStep = Math.floor(smoothed / 45) * 45;
        if (tickStep !== lastRotaryTickRef.current) {
          lastRotaryTickRef.current = tickStep;
          triggerHapticFeedback(ImpactStyle.Light);
        }
      }

      // Auspicious cardinal bell
      const cardinalZone = smoothed > 355 || smoothed < 5 ? 'North' : smoothed > 85 && smoothed < 95 ? 'East' : null;
      if (cardinalZone && cardinalZone !== lastSoundZone.current) {
        playBellSound(cardinalZone === 'North' ? 'bell' : 'chime');
      }
      lastSoundZone.current = cardinalZone;
    }

    // Pitch & Roll
    if (event.beta !== null && event.beta !== undefined && event.gamma !== null && event.gamma !== undefined) {
      smoothedPitchRef.current += 0.25 * (event.beta - smoothedPitchRef.current);
      smoothedRollRef.current += 0.25 * (event.gamma - smoothedRollRef.current);
      setPitch(smoothedPitchRef.current);
      setRoll(smoothedRollRef.current);
    }
  };

  useEffect(() => {
    const onAbsolute = (e: DeviceOrientationEvent) => handleOrientation(e, true);
    const onRelative = (e: DeviceOrientationEvent) => handleOrientation(e, false);

    window.addEventListener('deviceorientationabsolute', onAbsolute, true);
    window.addEventListener('deviceorientation', onRelative, true);

    const simTimeout = setTimeout(() => {
      if (heading === null) {
        setIsSimulatedMode(true);
        setHeading(0);
      }
    }, 800);

    return () => {
      clearTimeout(simTimeout);
      window.removeEventListener('deviceorientationabsolute', onAbsolute, true);
      window.removeEventListener('deviceorientation', onRelative, true);
    };
  }, []);

  // Pointer drag for web testing
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

  // Hindi Cardinal Helpers
  const getHindiCardinal = (deg: number | null) => {
    if (deg === null || isNaN(deg)) return 'उत्तर';
    const norm = ((deg % 360) + 360) % 360;
    if (norm >= 337.5 || norm < 22.5) return 'उत्तर';
    if (norm >= 22.5 && norm < 67.5) return 'ईशान्य';
    if (norm >= 67.5 && norm < 112.5) return 'पूर्व';
    if (norm >= 112.5 && norm < 157.5) return 'आग्नेय';
    if (norm >= 157.5 && norm < 202.5) return 'दक्षिण';
    if (norm >= 202.5 && norm < 247.5) return 'नैऋत्य';
    if (norm >= 247.5 && norm < 292.5) return 'पश्चिम';
    return 'वायव्य';
  };

  const displayHeading = useMemo(() => {
    if (heading === null) return 0;
    if (!useTrueNorth) return heading;
    return ((heading + declination) % 360 + 360) % 360;
  }, [heading, useTrueNorth, declination]);

  const isLevel = Math.abs(pitch) < 2.0 && Math.abs(roll) < 2.0;

  const copyCoordinates = async () => {
    triggerHapticFeedback();
    const lat = location ? location.latitude.toFixed(6) : '28.613900';
    const lng = location ? location.longitude.toFixed(6) : '77.209000';
    const text = `🧭 हिंदी कंपास रीडिंग:\nदिशा: ${Math.round(displayHeading)}° ${getHindiCardinal(displayHeading)}\nअक्षांश: ${lat}°N, देशांतर: ${lng}°E\nसमतल स्तर: पिच ${Math.round(pitch)}°, रोल ${Math.round(roll)}°`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'हिंदी कंपास रीडिंग', text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success('अक्षांश एवं देशांतर कॉपी हो गए!');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        toast.success('अक्षांश एवं देशांतर कॉपी हो गए!');
      } catch {}
    }
  };

  const formatTime = (d: Date | null) => {
    if (!d) return '--:--';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn(
      "w-full min-h-screen flex flex-col items-center pt-6 pb-10 px-4 select-none relative overflow-x-hidden transition-colors duration-300",
      theme === 'light' 
        ? "bg-gradient-to-b from-amber-50/60 via-stone-100 to-stone-200 text-stone-900" 
        : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#181510] via-[#0C0A08] to-[#050403] text-white"
    )}>
      {/* Background ambient gold glow */}
      <div className="absolute top-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full flex items-center justify-between py-2 px-1 mb-2 relative z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-[2px] shadow-lg shrink-0">
            <img 
              src="/icon.png" 
              alt="हिंदी कंपास" 
              className="w-full h-full rounded-[14px] object-cover" 
            />
          </div>
          <div className="flex flex-col text-left justify-center">
            <h1 className="text-xl font-black tracking-tight leading-snug pt-0.5 pb-0 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 dark:from-amber-400 dark:to-yellow-500 bg-clip-text text-transparent">
              हिंदी कंपास
            </h1>
            <span className={cn(
              "text-[10px] font-bold leading-tight -mt-0.5",
              theme === 'light' ? "text-stone-600" : "text-stone-400"
            )}>
              सटीक 360° दिशा एवं समतल स्तर
            </span>
          </div>
        </div>

        {/* Top Right Action: Settings Trigger */}
        <div className="relative">
          <button
            onClick={() => {
              triggerHapticFeedback();
              setShowSettings(!showSettings);
            }}
            className={cn(
              "p-2.5 rounded-2xl border transition-all active:scale-95 shadow-md flex items-center justify-center",
              showSettings 
                ? "bg-amber-500/20 text-amber-500 border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                : (theme === 'light' ? "bg-white text-stone-800 border-stone-200" : "bg-stone-900 text-stone-200 border-white/10")
            )}
            title="सेटिंग्स"
          >
            <Settings className={cn("w-5 h-5 transition-transform duration-300", showSettings && "rotate-90 text-amber-500")} />
          </button>

          {/* Settings Popup Menu */}
          {showSettings && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
              <div className={cn(
                "absolute right-0 mt-2 p-4 rounded-3xl border shadow-2xl backdrop-blur-xl flex flex-col gap-3 min-w-[16.5rem] z-50 animate-in fade-in zoom-in-95",
                theme === 'light' ? "bg-white border-stone-200 text-stone-900 shadow-stone-400/30" : "bg-stone-950/95 border-white/15 text-white"
              )}>
                <div className="text-[11px] font-black uppercase tracking-wider text-amber-500 pb-2 border-b border-stone-200/40 dark:border-white/10 flex items-center justify-between">
                  <span>सेटिंग्स एवं विकल्प</span>
                  <span className="text-[9px] text-stone-500">विकल्प</span>
                </div>

                {/* 1. Sound Effects */}
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2">
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-500" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
                    ध्वनि प्रभाव
                  </span>
                  <button
                    onClick={() => {
                      triggerHapticFeedback();
                      const next = !soundEnabled;
                      setSoundEnabled(next);
                      localStorage.setItem('hindi_compass_sound', next.toString());
                      if (next) playBellSound('chime');
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-xl text-[10px] font-black uppercase transition-all",
                      soundEnabled 
                        ? (theme === 'light' ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-amber-500/20 text-amber-300 border border-amber-500/40")
                        : (theme === 'light' ? "bg-stone-100 text-stone-600 border border-stone-300" : "bg-stone-800 text-stone-400 border border-white/10")
                    )}
                  >
                    {soundEnabled ? "चालू" : "बंद"}
                  </button>
                </div>

                {/* 2. True North */}
                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-stone-200/40 dark:border-white/5">
                  <span className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-sky-500 rotate-45" />
                    भौगोलिक उत्तर
                  </span>
                  <button
                    onClick={() => {
                      triggerHapticFeedback();
                      const next = !useTrueNorth;
                      setUseTrueNorth(next);
                      localStorage.setItem('hindi_compass_true_north', next.toString());
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-xl text-[10px] font-black uppercase transition-all",
                      useTrueNorth 
                        ? (theme === 'light' ? "bg-sky-100 text-sky-800 border border-sky-300" : "bg-sky-500/20 text-sky-300 border border-sky-500/40")
                        : (theme === 'light' ? "bg-stone-100 text-stone-600 border border-stone-300" : "bg-stone-800 text-stone-400 border border-white/10")
                    )}
                  >
                    {useTrueNorth ? "चालू" : "बंद"}
                  </button>
                </div>

                {/* 3. Cardinal Vibration Haptic */}
                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-white/5">
                  <span className="flex items-center gap-2">
                    <CircleDot className="w-4 h-4 text-emerald-400" />
                    दिशा कंपन
                  </span>
                  <button
                    onClick={() => {
                      triggerHapticFeedback();
                      const next = !hapticEnabled;
                      setHapticEnabled(next);
                      localStorage.setItem('hindi_compass_haptic', next.toString());
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-xl text-[10px] font-black uppercase transition-all",
                      hapticEnabled ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-stone-800 text-stone-400 border border-white/10"
                    )}
                  >
                    {hapticEnabled ? "चालू" : "बंद"}
                  </button>
                </div>

                {/* 4. Sensor Diagnostics */}
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
                    className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  >
                    जांचें
                  </button>
                </div>

                {/* 5. Calibration Guide */}
                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-white/5">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    8-आकृति कैलिब्रेशन
                  </span>
                  <button
                    onClick={() => {
                      triggerHapticFeedback();
                      setShowSettings(false);
                      setShowCalibrationModal(true);
                    }}
                    className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  >
                    देखें
                  </button>
                </div>

                {/* 6. Theme Mode Toggle */}
                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-white/5">
                  <span>थीम मोड</span>
                  <ThemeToggle />
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Primary Mode Switcher: Compass vs Minimal Level View */}
      <div className="w-full max-w-sm flex items-center justify-center p-1 rounded-2xl bg-stone-900/90 border border-white/10 mb-3 shadow-inner">
        <button
          onClick={() => {
            setMainTab('compass');
            triggerHapticFeedback();
          }}
          className={cn(
            "flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5",
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
            "flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5",
            mainTab === 'level'
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-stone-950 shadow-md scale-100"
              : "text-stone-400 hover:text-white"
          )}
        >
          <CircleDot className="w-3.5 h-3.5" />
          <span>समतल स्तर</span>
        </button>
      </div>

      {/* Theme Switcher: 3 Themes ("क्लासिक", "चंदन", "डिफरेंट") - Visible when in Compass mode */}
      {mainTab === 'compass' && (
        <div className="w-full max-w-xs flex items-center justify-center p-1 rounded-2xl bg-stone-950/60 border border-white/5 mb-3 shadow-sm">
          <button
            onClick={() => {
              setSelectedStyle('classic');
              triggerHapticFeedback();
            }}
            className={cn(
              "flex-1 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300",
              selectedStyle === 'classic'
                ? "bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-stone-950 shadow-md scale-100"
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
              "flex-1 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300",
              selectedStyle === 'chandan'
                ? "bg-gradient-to-r from-amber-700 to-yellow-600 text-amber-100 shadow-md scale-100"
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
              "flex-1 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300",
              selectedStyle === 'dark'
                ? "bg-white text-stone-950 shadow-md scale-100 border border-white"
                : "text-stone-400 hover:text-white"
            )}
          >
            डार्क
          </button>
        </div>
      )}

      {/* MAIN CONTENT: LEVEL VIEW vs COMPASS VIEW */}
      {mainTab === 'level' ? (
        /* DEDICATED MINIMAL 3D SPIRIT LEVEL VIEW */
        <div className="w-full max-w-sm flex flex-col items-center justify-center my-4 animate-in fade-in zoom-in-95">
          {/* Tare Zero Button & Level Angle Readout */}
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

          {/* Big Minimal 3D Bullseye Spirit Vial */}
          <div className={cn(
            "relative w-64 h-64 sm:w-72 sm:h-72 rounded-full flex items-center justify-center border-[14px] sm:border-[16px] shadow-2xl transition-all duration-300 overflow-hidden",
            isLevel 
              ? "border-emerald-500/70 bg-gradient-to-tr from-[#021A0F] via-[#042817] to-[#021A0F] shadow-[0_0_50px_rgba(16,185,129,0.4)]" 
              : "border-stone-800 bg-gradient-to-tr from-[#12161C] via-[#090C10] to-[#050709] shadow-[0_0_40px_rgba(0,0,0,0.8)]"
          )}>
            {/* Concentric Bullseye Rings */}
            <div className="absolute inset-8 rounded-full border border-white/15 pointer-events-none" />
            <div className="absolute inset-16 rounded-full border border-dashed border-white/10 pointer-events-none" />
            
            {/* Crosshairs */}
            <div className="absolute inset-x-0 top-1/2 h-[0.5px] bg-white/20 pointer-events-none" />
            <div className="absolute inset-y-0 left-1/2 w-[0.5px] bg-white/20 pointer-events-none" />

            {/* Target 0° Center Circle */}
            <div className={cn(
              "w-12 h-12 rounded-full border flex items-center justify-center transition-colors pointer-events-none",
              isLevel ? "border-emerald-400 bg-emerald-500/20 shadow-[0_0_20px_#10b981]" : "border-white/25 bg-white/5"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full transition-colors",
                isLevel ? "bg-emerald-400 shadow-[0_0_10px_#10b981]" : "bg-white/40"
              )} />
            </div>

            {/* Floating Spirit Bubble */}
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

          {/* Precise Angle Display Cards */}
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
        /* COMPASS VIEW CONTAINER */
        <>
          {/* Main Dial Container */}
          <div className="relative my-2 flex flex-col items-center justify-center">
            
            {/* Top Pointer Triangle on Outer Bezel (Crimson Red Arrowhead at 0°) */}
            <div className="absolute -top-3 z-30 flex flex-col items-center pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[14px] border-t-[#EF4444]" />
            </div>

            {/* Rotating Compass Dial Body */}
            <div
              ref={dialRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={cn(
                "w-[21.5rem] h-[21.5rem] sm:w-[23.5rem] sm:h-[23.5rem] rounded-full flex items-center justify-center relative transition-transform duration-75 ease-out select-none cursor-grab active:cursor-grabbing touch-none",
                selectedStyle === 'classic'
                  ? "border-[14px] sm:border-[18px] border-[#2A2E38] shadow-[0_18px_50px_rgba(0,0,0,0.95),inset_0_2px_4px_rgba(255,255,255,0.35),inset_0_-4px_10px_rgba(0,0,0,0.9)] bg-gradient-to-tr from-[#1A1D24] via-[#3E4554] to-[#14161C]"
                  : selectedStyle === 'chandan'
                  ? "border-[20px] sm:border-[24px] border-[#C29B70] shadow-[0_15px_45px_rgba(78,53,36,0.6),inset_0_3px_6px_rgba(255,255,255,0.7),inset_0_-6px_12px_rgba(78,53,36,0.9)] bg-gradient-to-br from-[#E6D2BA] via-[#C9A67E] to-[#8C6239]"
                  : "border-[14px] sm:border-[18px] border-[#1C1C1E] shadow-[0_15px_45px_rgba(0,0,0,0.95),inset_0_1px_2px_rgba(255,255,255,0.2)] bg-[#0C0C0E]"
              )}
              style={{
                transform: `rotate(${displayHeading !== null ? -displayHeading : 0}deg)`,
                willChange: 'transform'
              }}
            >
              {/* Dial Face Inner Canvas */}
              <div className={cn(
                "absolute inset-0 rounded-full overflow-hidden flex items-center justify-center",
                selectedStyle === 'classic'
                  ? "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#242933] via-[#171A21] to-[#0C0E12]"
                  : selectedStyle === 'chandan'
                  ? "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#F4E8D8] via-[#E2CEB5] to-[#C9A882]"
                  : "bg-black"
              )}>
                
                {/* Concentric Geometry Guides */}
                {selectedStyle !== 'dark' && (
                  <>
                    <div className="absolute inset-4 rounded-full border border-amber-500/20 pointer-events-none" />
                    <div className="absolute inset-8 rounded-full border border-dashed border-amber-500/15 pointer-events-none" />
                    <div className="absolute inset-14 rounded-full border border-amber-500/20 pointer-events-none" />
                    {/* Golden Wireframe Geometry for Classic Theme */}
                    {selectedStyle === 'classic' && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25" viewBox="0 0 200 200">
                        <polygon points="100,20 180,100 100,180 20,100" fill="none" stroke="#F59E0B" strokeWidth="0.5" />
                        <polygon points="100,20 156,156 44,156" fill="none" stroke="#F59E0B" strokeWidth="0.4" />
                        <polygon points="100,180 44,44 156,44" fill="none" stroke="#F59E0B" strokeWidth="0.4" />
                        <circle cx="100" cy="100" r="55" fill="none" stroke="#F59E0B" strokeWidth="0.5" strokeDasharray="3 3" />
                      </svg>
                    )}
                  </>
                )}

                {/* Dial Ticks for Classic and Chandan (Every 5° and 10°) */}
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
                            ? "w-[2px] h-3 bg-[#EF4444] shadow-sm" 
                            : isMid 
                            ? (selectedStyle === 'classic' ? "w-[1.5px] h-2.5 bg-amber-400/80" : "w-[1.5px] h-2.5 bg-[#8C5824]") 
                            : (selectedStyle === 'classic' ? "w-[1px] h-1.5 bg-amber-400/30" : "w-[1px] h-1.5 bg-[#8C5824]/40")
                        )} />
                      </div>
                    );
                  })
                )}

                {/* Dial Ticks for Dark Theme (180 Fine White Ticks every 2°) */}
                {selectedStyle === 'dark' && (
                  [...Array(180)].map((_, i) => {
                    const deg = i * 2;
                    const isCardinal = deg % 90 === 0;
                    const isMajor30 = deg % 30 === 0;
                    return (
                      <div key={deg} className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: `rotate(${deg}deg)` }}>
                        <div className={cn(
                          "rounded-full mt-1.5",
                          isCardinal ? "w-[2.5px] h-3.5 bg-white" :
                          isMajor30 ? "w-[2px] h-3 bg-white" :
                          "w-[1px] h-1.5 bg-white/40"
                        )} />
                      </div>
                    );
                  })
                )}

                {/* Inner Degree Numbers: 0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330 */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                  <div key={deg} className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: `rotate(${deg}deg)` }}>
                    <div className="flex flex-col items-center select-none mt-1">
                      <span className={cn(
                        "font-mono font-bold text-[0.52rem] drop-shadow-md",
                        selectedStyle === 'classic' ? "text-amber-200/90" : selectedStyle === 'chandan' ? "text-[#5C3818]" : "text-stone-300"
                      )}>
                        {deg}
                      </span>
                    </div>
                  </div>
                ))}

                {/* 8 Cardinal Directions in Hindi: उत्तर, ईशान्य, पूर्व, आग्नेय, दक्षिण, नैऋत्य, पश्चिम, वायव्य */}
                {[
                  { l: 'उत्तर', d: 0, isRed: true },
                  { l: 'ईशान्य', d: 45 },
                  { l: 'पूर्व', d: 90 },
                  { l: 'आग्नेय', d: 135 },
                  { l: 'दक्षिण', d: 180 },
                  { l: 'नैऋत्य', d: 225 },
                  { l: 'पश्चिम', d: 270 },
                  { l: 'वायव्य', d: 315 }
                ].map((pt) => (
                  <div key={pt.l} className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: `rotate(${pt.d}deg)` }}>
                    <div className="flex flex-col items-center select-none mt-6">
                      {selectedStyle === 'dark' && pt.isRed && (
                        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[7px] border-b-red-500 mb-0.5" />
                      )}
                      <span className={cn(
                        "font-black text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-tight",
                        pt.isRed 
                          ? "text-[#EF4444] text-base font-black scale-105" 
                          : (selectedStyle === 'chandan' ? "text-[#3E2718]" : "text-white")
                      )}>
                        {pt.l}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Dynamic Sun Position & Badge on Dial */}
                {sunPos !== null && (
                  <div className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: `rotate(${sunPos}deg)` }}>
                    <div className="flex flex-col items-center mt-12 animate-pulse">
                      <div className="flex items-center gap-1 bg-amber-500/90 text-stone-950 px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.8)] border border-amber-300">
                        <Sun className="w-3 h-3 fill-amber-300 text-stone-950" />
                        <span className="text-[8px] font-black tracking-wider leading-none">सूर्य</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

        {/* Overlay 3D Needle & Center Spirit Bubble Level (Stationary with Upright Orientation) */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none flex items-center justify-center overflow-visible z-20"
          style={{
            transform: `translate3d(${roll * 0.15}px, ${-pitch * 0.15}px, 0px)`
          }}
        >
          {/* Precision 3D Needle (Classic / Chandan) or Minimal Heading Pointer */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {selectedStyle === 'classic' ? (
              <svg className="w-full h-full p-4 drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]" viewBox="0 0 200 200">
                {/* Secondary 3D Diagonal Points (NE, SE, SW, NW) */}
                <polygon points="100,100 135,65 100,88" fill="#475569" opacity="0.7" />
                <polygon points="100,100 135,65 112,100" fill="#1E293B" opacity="0.7" />
                <polygon points="100,100 135,135 112,100" fill="#475569" opacity="0.7" />
                <polygon points="100,100 135,135 100,112" fill="#1E293B" opacity="0.7" />
                <polygon points="100,100 65,135 100,112" fill="#475569" opacity="0.7" />
                <polygon points="100,100 65,135 88,100" fill="#1E293B" opacity="0.7" />
                <polygon points="100,100 65,65 88,100" fill="#475569" opacity="0.7" />
                <polygon points="100,100 65,65 100,88" fill="#1E293B" opacity="0.7" />

                {/* East & West Points */}
                <polygon points="175,100 100,92 112,100" fill="#475569" opacity="0.8" />
                <polygon points="175,100 100,108 112,100" fill="#1E293B" opacity="0.8" />
                <polygon points="25,100 100,92 88,100" fill="#475569" opacity="0.8" />
                <polygon points="25,100 100,108 88,100" fill="#1E293B" opacity="0.8" />

                {/* South Point (3D Slate) */}
                <polygon points="100,175 88,100 100,112" fill="#64748B" />
                <polygon points="100,175 112,100 100,112" fill="#334155" />

                {/* Dashed Center Vector Line to North */}
                <line x1="100" y1="52" x2="100" y2="82" stroke="#FFFFFF" strokeWidth="1.8" strokeDasharray="3 3" opacity="0.85" />

                {/* North 3D Arrowhead (White & Slate split from reference image) */}
                <polygon points="100,10 84,55 100,46" fill="#FFFFFF" className="drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]" />
                <polygon points="100,10 116,55 100,46" fill="#94A3B8" />
              </svg>
            ) : selectedStyle === 'chandan' ? (
              <svg className="w-full h-full p-4 drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]" viewBox="0 0 200 200">
                {/* North Pointer (3D Split Vibrant Crimson Red) */}
                <polygon points="100,8 91,100 100,86" fill="#EF4444" className="drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]" />
                <polygon points="100,8 109,100 100,86" fill="#B91C1C" />
                <line x1="100" y1="10" x2="100" y2="86" stroke="#FDE047" strokeWidth="1.2" opacity="0.9" />

                {/* South Pointer (3D Split Slate Charcoal) */}
                <polygon points="100,192 91,100 100,114" fill="#64748B" />
                <polygon points="100,192 109,100 100,114" fill="#334155" />
                <line x1="100" y1="114" x2="100" y2="190" stroke="#94A3B8" strokeWidth="1.2" opacity="0.6" />

                {/* Outer Gold Spindle Ring */}
                <circle cx="100" cy="100" r="16" fill="none" stroke="#D4AF37" strokeWidth="2.5" className="drop-shadow-md" />
                <circle cx="100" cy="100" r="14" fill="none" stroke="#FFFBEB" strokeWidth="0.8" opacity="0.7" />
              </svg>
            ) : (
              /* Minimal Dark Style Top Heading Lubber Line */
              <div className="absolute top-2 w-[3.5px] h-6 bg-red-500 rounded-full shadow-[0_0_10px_#ef4444] z-30" />
            )}
          </div>

          {/* Center Precision Liquid Spirit Bubble Hub (with Live Heading and Green Target) */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className={cn(
              "w-16 h-16 rounded-full relative overflow-hidden flex flex-col items-center justify-center transition-all duration-300 backdrop-blur-md shadow-2xl",
              selectedStyle === 'classic'
                ? "border border-white/20 bg-[#1E232B]/90 shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
                : isLevel 
                ? "border-2 border-emerald-400/80 bg-emerald-950/50 shadow-[0_0_20px_rgba(52,211,153,0.5)] animate-pulse" 
                : "border border-amber-400/40 bg-stone-950/70 shadow-inner"
            )}>
              {/* Live Degree Angle in Center Hub */}
              <span className="font-mono font-black text-sm text-white tracking-tight leading-none z-10 drop-shadow-md">
                {displayHeading !== null ? Math.round(displayHeading) : 0}
              </span>

              {/* Crosshairs */}
              <div className="absolute w-full h-[0.5px] bg-white/20" />
              <div className="absolute h-full w-[0.5px] bg-white/20" />
              
              {/* Center Target Circle (Green Target from reference) */}
              <div className={cn(
                "absolute w-8 h-8 rounded-full border flex items-center justify-center transition-colors",
                isLevel ? "border-emerald-400/80 shadow-[0_0_12px_#10b981]" : "border-emerald-500/40"
              )}>
                <span className="text-[8px] font-black text-emerald-400/80 leading-none">उ</span>
              </div>

              {/* Dynamic Floating Spirit Bubble */}
              <div 
                className={cn(
                  "absolute w-4 h-4 rounded-full transition-transform duration-75 ease-out liquid-shine shadow-md",
                  isLevel 
                    ? "bg-emerald-400 shadow-[0_0_12px_#34d399] scale-110" 
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

      {/* Large Impactful Reading Display Pill (272° पश्चिम / Gold Glow Pill) */}
      <div className="w-full max-w-sm mt-3 flex flex-col items-center gap-2">
        <div className={cn(
          "w-full py-2.5 px-6 rounded-3xl border-2 flex items-center justify-between text-center transition-colors duration-300 shadow-xl",
          theme === 'light'
            ? "bg-gradient-to-r from-amber-50 via-white to-amber-50 border-amber-400/80 shadow-[0_4px_25px_rgba(245,158,11,0.2)] text-stone-900"
            : "bg-gradient-to-r from-stone-950 via-[#1C180E] to-stone-950 border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.35)] text-white"
        )}>
          <div className="flex flex-col text-left">
            <span className={cn(
              "text-2xl sm:text-3xl font-black tracking-tight leading-none",
              theme === 'light' ? "text-stone-900" : "text-white"
            )}>
              {displayHeading !== null ? `${Math.round(displayHeading)}° ` : '0° '}
              <span className={theme === 'light' ? "text-amber-600" : "text-amber-400"}>
                {getHindiCardinal(displayHeading)}
              </span>
            </span>
            <span className={cn(
              "text-[10px] font-bold mt-0.5",
              theme === 'light' ? "text-stone-600" : "text-stone-400"
            )}>
              {useTrueNorth ? 'भौगोलिक उत्तर (सटीक)' : 'चुंबकीय उत्तर'}
            </span>
          </div>

          <div className="flex flex-col items-end">
            <span className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border",
              isLevel 
                ? (theme === 'light' ? "bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse")
                : (theme === 'light' ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-amber-500/15 text-amber-400 border-amber-500/30")
            )}>
              {isLevel ? "✓ समतल (0°)" : "झुकाव"}
            </span>
            <span className={cn(
              "text-[10px] font-mono mt-1",
              theme === 'light' ? "text-stone-700" : "text-stone-400"
            )}>
              पिच: {Math.round(pitch)}° | रोल: {Math.round(roll)}°
            </span>
          </div>
        </div>

        {/* Live Coordinates & Altitude Card */}
        <div className={cn(
          "w-full rounded-2xl p-3 border flex items-center justify-between gap-2 text-xs backdrop-blur-md shadow-lg",
          theme === 'light' ? "bg-white border-stone-200 text-stone-900 shadow-stone-200/50" : "bg-stone-950/80 border-white/10 text-white"
        )}>
          <div className="flex flex-col text-left">
            <span className={cn("text-[11px] font-bold flex items-center gap-1", theme === 'light' ? "text-amber-600" : "text-amber-400")}>
              <span>📍</span> {location?.city ? `${location.city}, ${location.state || 'भारत'}` : 'वर्तमान स्थान'}
            </span>
            <span className={cn("font-mono text-[10px]", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
              अक्षांश: {location?.latitude ? location.latitude.toFixed(4) : '28.6139'}° उ. • देशांतर: {location?.longitude ? location.longitude.toFixed(4) : '77.2090'}° पू.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={cn(
              "text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl border",
              theme === 'light' ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-white/5 border-white/5 text-amber-300"
            )}>
              ⛰️ {location?.altitude ? `${Math.round(location.altitude * 3.28084)} फीट` : '708 फीट'}
            </span>
            <button
              onClick={copyCoordinates}
              className={cn(
                "p-2 rounded-xl border active:scale-95 transition-transform",
                theme === 'light' ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-amber-500/20 text-amber-300 border-amber-500/40"
              )}
              title="अक्षांश एवं देशांतर साझा करें"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sun Times Telemetry: Sunrise, Noon, Sunset */}
        <div className={cn(
          "w-full rounded-2xl p-2.5 border flex items-center justify-around text-xs shadow-md",
          theme === 'light' ? "bg-white border-stone-200 shadow-stone-200/50" : "bg-stone-950/60 border-white/5 text-stone-300"
        )}>
          <div className="flex items-center gap-1.5">
            <Sunrise className="w-3.5 h-3.5 text-amber-500" />
            <div className="flex flex-col text-left leading-tight">
              <span className={cn("text-[9px]", theme === 'light' ? "text-stone-600" : "text-stone-400")}>सूर्योदय</span>
              <span className={cn("font-mono font-bold text-[11px]", theme === 'light' ? "text-stone-900" : "text-white")}>
                {formatTime(times.sunrise)}
              </span>
            </div>
          </div>
          <div className={cn("h-5 w-[1px]", theme === 'light' ? "bg-stone-200" : "bg-white/10")} />
          <div className="flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-orange-500" />
            <div className="flex flex-col text-left leading-tight">
              <span className={cn("text-[9px]", theme === 'light' ? "text-stone-600" : "text-stone-400")}>मध्याह्न</span>
              <span className={cn("font-mono font-bold text-[11px]", theme === 'light' ? "text-stone-900" : "text-white")}>
                {formatTime(times.solarNoon)}
              </span>
            </div>
          </div>
          <div className={cn("h-5 w-[1px]", theme === 'light' ? "bg-stone-200" : "bg-white/10")} />
          <div className="flex items-center gap-1.5">
            <Sunset className="w-3.5 h-3.5 text-fuchsia-500" />
            <div className="flex flex-col text-left leading-tight">
              <span className={cn("text-[9px]", theme === 'light' ? "text-stone-600" : "text-stone-400")}>सूर्यास्त</span>
              <span className={cn("font-mono font-bold text-[11px]", theme === 'light' ? "text-stone-900" : "text-white")}>
                {formatTime(times.sunset)}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Web Testing Controls (Hidden on Native Mobile Devices) */}
        {!Capacitor.isNativePlatform() && (
          <div className="w-full mt-2 p-2 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-400 shrink-0">घूर्णन परीक्षण:</span>
            <input
              type="range"
              min="0"
              max="359"
              value={displayHeading !== null ? Math.round(displayHeading) : 0}
              onChange={(e) => {
                setIsSimulatedMode(true);
                setHeading(parseInt(e.target.value, 10));
              }}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-stone-700 rounded-lg"
            />
            <span className="font-mono text-xs font-black text-amber-400 w-10 text-right shrink-0">
              {Math.round(displayHeading)}°
            </span>
          </div>
        )}
      </div>
      </>
      )}

      {/* Modals */}
      <CalibrationGuideModal
        isOpen={showCalibrationModal}
        onClose={() => setShowCalibrationModal(false)}
        theme={theme}
      />
      <SensorsInspectorModal
        isOpen={showSensorsModal}
        onClose={() => setShowSensorsModal(false)}
        theme={theme}
        pitch={pitch}
        roll={roll}
        heading={displayHeading}
      />
    </div>
  );
};
