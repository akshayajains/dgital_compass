import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Target, 
  Layers, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  TrendingUp, 
  Ruler, 
  Volume2, 
  VolumeX, 
  Crosshair, 
  Copy, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  ArrowDown, 
  RefreshCw, 
  Hand, 
  History, 
  Plus, 
  Trash2,
  Sliders,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';

interface Props {
  pitch: number;
  roll: number;
  tareOffset: { pitch: number; roll: number } | null;
  onToggleTare: () => void;
  theme: string;
  triggerHaptic: () => void;
  onCalibrate?: () => void;
  playSound?: (type?: 'bell' | 'chime') => void;
}

interface ReadingEntry {
  id: number;
  time: string;
  pitch: number;
  roll: number;
  total: number;
}

export const AdvancedLevelView: React.FC<Props> = ({
  pitch,
  roll,
  tareOffset,
  onToggleTare,
  theme,
  triggerHaptic,
  onCalibrate,
  playSound
}) => {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const t = translations[language] || translations.en;

  // View mode: Bullseye 2D circular surface vs Dual Tubular Spirit Vials
  const [subMode, setSubMode] = useState<'bullseye' | 'vials'>('bullseye');

  // Freeze / Lock reading
  const [isLocked, setIsLocked] = useState(false);
  const [lockedPitch, setLockedPitch] = useState(0);
  const [lockedRoll, setLockedRoll] = useState(0);
  const [lockedTotal, setLockedTotal] = useState(0);

  // Hold to measure (quick toggle)
  const [isHeld, setIsHeld] = useState(false);
  const [heldPitch, setHeldPitch] = useState(0);
  const [heldRoll, setHeldRoll] = useState(0);
  const [heldTotal, setHeldTotal] = useState(0);

  // Surface angle mode: relative (tare-based) vs absolute (device hardware flat)
  const [angleMode, setAngleMode] = useState<'relative' | 'absolute'>('relative');

  // Sound toggle on reaching 0° level
  const [soundOnLevel, setSoundOnLevel] = useState<boolean>(() => {
    try { return localStorage.getItem('com.spiritual.compass.app_level_sound') !== 'false'; } catch { return true; }
  });

  // Reference lock: set current as 0°
  const [referenceLock, setReferenceLock] = useState<{ pitch: number; roll: number } | null>(null);

  // Target angle mode (e.g. 45° miter, 30° plumbing slope, 90° plumb)
  const [targetMode, setTargetMode] = useState(false);
  const [targetAngle, setTargetAngle] = useState(45);

  // Copy feedback
  const [copied, setCopied] = useState(false);

  // Celebration state on dead-center lock
  const [celebrate, setCelebrate] = useState(false);
  const celebrateTimerRef = useRef<number | null>(null);
  const wasLevelRef = useRef(false);

  // ── High-Performance Throttled Analytics State ──
  // Instead of updating React state at 60 Hz, stats are throttled to ~5 Hz (every 180ms)
  const [flatnessScore, setFlatnessScore] = useState(100);
  const [maxTilt, setMaxTilt] = useState(0);
  const [minTilt, setMinTilt] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const historyRef = useRef<number[]>([]);
  const lastStatsUpdateRef = useRef<number>(0);

  // Saved readings log (persisted)
  const [readings, setReadings] = useState<ReadingEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('com.spiritual.compass.app_readings') || '[]'); } catch { return []; }
  });

  // Web Audio chime generator fallback
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playWebAudioChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  }, []);

  // Effective tilt computation
  const tarePitch = tareOffset?.pitch || 0;
  const tareRoll = tareOffset?.roll || 0;
  const refPitch = referenceLock?.pitch || 0;
  const refRoll = referenceLock?.roll || 0;

  const absPitch = pitch;
  const absRoll = roll;
  const relPitch = pitch - tarePitch - refPitch;
  const relRoll = roll - tareRoll - refRoll;

  const effPitch = angleMode === 'absolute' ? absPitch : relPitch;
  const effRoll = angleMode === 'absolute' ? absRoll : relRoll;
  const totalTilt = Math.sqrt(effPitch * effPitch + effRoll * effRoll);

  // Magnetic center snapping (<0.35° snap to 0 for tactile precision feeling)
  const isDeadCenter = totalTilt < 0.4;
  const snappedPitch = isDeadCenter ? effPitch * 0.3 : effPitch;
  const snappedRoll = isDeadCenter ? effRoll * 0.3 : effRoll;
  const isLevel = totalTilt < 1.0;
  const isHighTilt = totalTilt >= 3.0;

  // ── Throttled Stats & Flatness Score Updater (5 Hz) ──
  useEffect(() => {
    const now = performance.now();
    historyRef.current.push(totalTilt);
    if (historyRef.current.length > 50) historyRef.current.shift();

    if (now - lastStatsUpdateRef.current >= 180) {
      lastStatsUpdateRef.current = now;

      // 1. Calculate flatness score from standard deviation
      const samples = historyRef.current;
      if (samples.length >= 5) {
        const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
        const variance = samples.reduce((s, v) => s + (v - avg) ** 2, 0) / samples.length;
        const stdDev = Math.sqrt(variance);
        const score = Math.max(0, Math.min(100, Math.round(100 - stdDev * 22)));
        setFlatnessScore(score);
      }

      // 2. Max/Min tracking
      setMaxTilt(m => Math.max(m, totalTilt));
      setMinTilt(m => (m === 0 ? totalTilt : Math.min(m, totalTilt)));

      // 3. Sparkline history
      setHistory(h => {
        const next = [...h, Math.round(totalTilt * 10) / 10];
        if (next.length > 24) next.shift();
        return next;
      });
    }
  }, [totalTilt]);

  // Haptic + chime audio feedback when entering level
  useEffect(() => {
    if (isLevel && !wasLevelRef.current) {
      triggerHaptic();
      if (soundOnLevel) {
        if (playSound) playSound('chime');
        else playWebAudioChime();
      }
      setCelebrate(true);
      if (celebrateTimerRef.current) window.clearTimeout(celebrateTimerRef.current);
      celebrateTimerRef.current = window.setTimeout(() => setCelebrate(false), 1400);
    }
    wasLevelRef.current = isLevel;
  }, [isLevel, soundOnLevel, triggerHaptic, playSound, playWebAudioChime]);

  // Handle freeze / hold
  const handleLock = () => {
    triggerHaptic();
    if (isLocked) {
      setIsLocked(false);
    } else {
      setLockedPitch(effPitch);
      setLockedRoll(effRoll);
      setLockedTotal(totalTilt);
      setIsLocked(true);
    }
  };

  const handleHold = () => {
    triggerHaptic();
    if (isHeld) {
      setIsHeld(false);
    } else {
      setHeldPitch(effPitch);
      setHeldRoll(effRoll);
      setHeldTotal(totalTilt);
      setIsHeld(true);
    }
  };

  const handleReferenceLock = () => {
    triggerHaptic();
    if (referenceLock) {
      setReferenceLock(null);
    } else {
      setReferenceLock({ pitch, roll });
    }
  };

  const handleResetMaxMin = () => {
    triggerHaptic();
    setMaxTilt(0);
    setMinTilt(0);
  };

  const handleCopy = () => {
    triggerHaptic();
    const text = `Spirit Level: Pitch: ${displayPitch.toFixed(1)}°, Roll: ${displayRoll.toFixed(1)}°, Total Tilt: ${displayTotal.toFixed(1)}°, Grade: ${(Math.tan((displayTotal * Math.PI) / 180) * 100).toFixed(1)}%`;
    try {
      navigator.clipboard?.writeText(text);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogReading = () => {
    triggerHaptic();
    const entry: ReadingEntry = {
      id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      pitch: displayPitch,
      roll: displayRoll,
      total: displayTotal
    };
    const next = [entry, ...readings].slice(0, 20);
    setReadings(next);
    try { localStorage.setItem('com.spiritual.compass.app_readings', JSON.stringify(next)); } catch {}
  };

  const handleClearReadings = () => {
    triggerHaptic();
    setReadings([]);
    try { localStorage.removeItem('com.spiritual.compass.app_readings'); } catch {}
  };

  // Display values (locked vs held vs live)
  const displayPitch = isLocked ? lockedPitch : isHeld ? heldPitch : effPitch;
  const displayRoll = isLocked ? lockedRoll : isHeld ? heldRoll : effRoll;
  const displayVisualPitch = isLocked ? lockedPitch : isHeld ? heldPitch : snappedPitch;
  const displayVisualRoll = isLocked ? lockedRoll : isHeld ? heldRoll : snappedRoll;
  const displayTotal = isLocked ? lockedTotal : isHeld ? heldTotal : totalTilt;
  const displayLevel = isLocked ? lockedTotal < 1.0 : isHeld ? heldTotal < 1.0 : isLevel;
  const displayHigh = isLocked ? lockedTotal >= 3.0 : isHeld ? heldTotal >= 3.0 : isHighTilt;

  // Target angle mode calculations
  const targetDelta = Math.abs(displayTotal - targetAngle);
  const onTarget = targetMode && targetDelta < 1.0;
  const bannerLevel = targetMode ? onTarget : displayLevel;
  const bannerHigh = targetMode ? false : displayHigh;

  // Directional guidance arrows (assist user in flattening the surface)
  const guidance = useMemo(() => {
    if (displayLevel) return null;
    const p = displayPitch;
    const r = displayRoll;
    const parts: { icon: React.ReactNode; label: string; offset: string }[] = [];
    if (Math.abs(r) > 0.4) {
      parts.push({
        icon: r > 0 ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />,
        label: r > 0 ? (isHi ? 'बाएं उठाएं' : 'Raise Left') : (isHi ? 'दाएं उठाएं' : 'Raise Right'),
        offset: `${Math.abs(r).toFixed(1)}°`
      });
    }
    if (Math.abs(p) > 0.4) {
      parts.push({
        icon: p > 0 ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />,
        label: p > 0 ? (isHi ? 'शीर्ष उठाएं' : 'Raise Top') : (isHi ? 'नीचे उठाएं' : 'Raise Bottom'),
        offset: `${Math.abs(p).toFixed(1)}°`
      });
    }
    return parts;
  }, [displayLevel, displayPitch, displayRoll, isHi]);

  // Derived engineering metrics
  const slopePercent = displayTotal > 89 ? '999+' : (Math.tan((displayTotal * Math.PI) / 180) * 100).toFixed(1);
  const roofRatio = displayTotal > 89 ? '999' : (Math.tan((displayTotal * Math.PI) / 180) * 12).toFixed(1);
  const mmPerMeter = displayTotal > 89 ? '999+' : (Math.tan((displayTotal * Math.PI) / 180) * 1000).toFixed(0);

  const flatnessLabel = flatnessScore >= 90 ? (isHi ? 'अति सपाट' : 'Ultra Flat')
    : flatnessScore >= 70 ? (isHi ? 'सपाट' : 'Flat')
    : flatnessScore >= 40 ? (isHi ? 'थोड़ा टेढ़ा' : 'Uneven')
    : (isHi ? 'अत्यंत टेढ़ा' : 'Very Uneven');

  const flatnessColor = flatnessScore >= 90
    ? (theme === 'light' ? 'text-emerald-700' : 'text-emerald-400')
    : flatnessScore >= 70
    ? (theme === 'light' ? 'text-teal-700' : 'text-teal-400')
    : flatnessScore >= 40
    ? (theme === 'light' ? 'text-amber-700' : 'text-amber-400')
    : 'text-red-400';

  return (
    <div className={cn(
      "w-full max-w-sm flex flex-col items-center rounded-[28px] border p-3 select-none transition-all duration-300 shadow-2xl",
      theme === 'light'
        ? "border-emerald-500/25 bg-gradient-to-b from-[#FAFDFB] via-[#F0FDF4] to-[#E8FBEF] text-stone-900 shadow-[0_20px_50px_rgba(16,185,129,0.12)]"
        : "border-emerald-500/20 bg-gradient-to-b from-[#091510] via-[#050D0A] to-[#020604] text-white shadow-[0_20px_50px_rgba(0,0,0,0.85)]"
    )}>

      {/* ── Top Header Row ── */}
      <div className="w-full flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-1.5">
          <div className={cn("w-2 h-2 rounded-full animate-pulse", bannerLevel ? "bg-emerald-400" : "bg-amber-400")} />
          <span className={cn(
            "text-[10px] font-black uppercase tracking-[0.20em]",
            theme === 'light' ? "text-emerald-800" : "text-emerald-300"
          )}>
            {isHi ? 'सटीक स्पिरिट लेवल' : 'Precision Spirit Level'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Tare Zero active badge */}
          {tareOffset && (
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border",
              theme === 'light' ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-amber-500/20 text-amber-300 border-amber-500/40"
            )}>
              TARED
            </span>
          )}

          {/* Freeze / Lock toggle */}
          <button
            onClick={handleLock}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95 shadow-sm",
              isLocked
                ? (theme === 'light' ? "border-amber-500 bg-amber-100 text-amber-900" : "border-amber-400/60 bg-amber-400/20 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]")
                : (theme === 'light' ? "border-stone-300 bg-white text-stone-600 hover:text-stone-900" : "border-white/10 bg-white/5 text-stone-400 hover:text-white")
            )}
          >
            {isLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
            {isLocked ? (isHi ? 'लॉक' : 'Locked') : (isHi ? 'लाइव' : 'Live')}
          </button>
        </div>
      </div>

      {/* ── HERO GLANCEABLE LEVEL STATUS BANNER ── */}
      <div className={cn(
        "w-full rounded-2xl p-3 mb-2 border flex items-center justify-between transition-all duration-300 shadow-lg relative overflow-hidden",
        celebrate && "scale-[1.02]",
        bannerLevel
          ? (theme === 'light'
              ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.35)]"
              : "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-stone-950 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)]")
          : bannerHigh
          ? (theme === 'light'
              ? "bg-gradient-to-r from-red-500 to-rose-600 text-white border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.35)]"
              : "bg-gradient-to-r from-red-600 to-rose-700 text-white border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.45)]")
          : (theme === 'light'
              ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              : "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-stone-950 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.45)]")
      )}>
        <div className="flex items-center gap-2.5 z-10">
          {bannerLevel ? (
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <CheckCircle2 className="w-5 h-5 text-current animate-pulse" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-black/15 flex items-center justify-center shrink-0">
              <AlertTriangle className={cn("w-5 h-5 text-current", bannerHigh && "animate-pulse")} />
            </div>
          )}
          <div className="flex flex-col text-left leading-tight">
            <span className="text-sm font-black uppercase tracking-wider">
              {targetMode
                ? (onTarget ? (isHi ? 'लक्ष्य प्राप्त ✓' : 'ON TARGET ✓') : (isHi ? `लक्ष्य कोण: ${targetAngle}°` : `TARGET: ${targetAngle}°`))
                : (displayLevel ? (isHi ? 'समतल स्तर प्राप्त ✓' : 'PERFECT LEVEL ✓') : displayHigh ? (isHi ? 'अत्यधिक झुकाव' : 'HIGH TILT') : (isHi ? 'झुकाव में' : 'TILTED'))}
            </span>
            <span className="text-[10px] font-extrabold opacity-90 mt-0.5">
              {targetMode
                ? `${isHi ? 'अंतर' : 'Offset'}: ${targetDelta.toFixed(1)}°`
                : `${isHi ? 'कुल झुकाव कोण' : 'Total Tilt'}: ${displayTotal.toFixed(1)}°`}
            </span>
          </div>
        </div>

        {/* Directional Guidance Chips */}
        {!bannerLevel && guidance && guidance.length > 0 && (
          <div className="flex flex-col gap-1 items-end z-10">
            {guidance.map((g, i) => (
              <span key={i} className="flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider bg-black/20 text-current rounded-md px-1.5 py-0.5 shadow-sm">
                {g.icon}
                <span>{g.label}</span>
                <span className="font-mono text-[8px] opacity-80">{g.offset}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Mode Switcher & Tare Row ── */}
      <div className={cn(
        "w-full flex items-center justify-between gap-1 p-1 rounded-2xl border mb-2",
        theme === 'light' ? "bg-white border-stone-200/80 shadow-sm" : "bg-stone-900/90 border-white/10 shadow-inner"
      )}>
        <button
          onClick={() => { setSubMode('bullseye'); triggerHaptic(); }}
          className={cn(
            "flex-1 py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm active:scale-95",
            subMode === 'bullseye'
              ? "bg-amber-500 text-stone-950 font-black shadow-md scale-[1.02]"
              : (theme === 'light' ? "text-stone-600 hover:text-stone-900" : "text-stone-400 hover:text-white")
          )}
        >
          <Target className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{isHi ? '2D बुलआई' : '2D Bullseye'}</span>
        </button>

        <button
          onClick={() => { setSubMode('vials'); triggerHaptic(); }}
          className={cn(
            "flex-1 py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm active:scale-95",
            subMode === 'vials'
              ? "bg-amber-500 text-stone-950 font-black shadow-md scale-[1.02]"
              : (theme === 'light' ? "text-stone-600 hover:text-stone-900" : "text-stone-400 hover:text-white")
          )}
        >
          <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{isHi ? 'ड्यूल वायल' : 'Dual Vials'}</span>
        </button>

        <button
          onClick={() => { onToggleTare(); triggerHaptic(); }}
          className={cn(
            "py-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border flex items-center justify-center gap-1 active:scale-95 shadow-sm",
            tareOffset
              ? (theme === 'light' ? "bg-amber-100 text-amber-900 border-amber-400" : "bg-amber-500/25 text-amber-300 border-amber-500/50")
              : (theme === 'light' ? "bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200" : "bg-white/5 text-stone-300 border-white/10 hover:text-white")
          )}
        >
          <RotateCcw className="w-3 h-3" />
          <span>{isHi ? 'शून्य तय करें' : 'Zero Tare'}</span>
        </button>
      </div>

      {/* ── Quick Tools Grid (Hold, Sound, Mode, Target, Calibrate) ── */}
      <div className="w-full grid grid-cols-5 gap-1.5 mb-2">
        {/* Hold to Freeze */}
        <button
          onClick={handleHold}
          title={isHi ? 'रीडिंग फ्रीज़ करें' : 'Hold / Freeze Reading'}
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-2 rounded-xl border transition-all active:scale-95 shadow-sm",
            isHeld
              ? "bg-amber-500 text-stone-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
              : (theme === 'light' ? "bg-white border-stone-200 text-stone-600 hover:text-stone-900" : "bg-white/5 border-white/10 text-stone-300 hover:text-white")
          )}
        >
          <Hand className="w-3.5 h-3.5" />
          <span className="text-[7.5px] font-black uppercase tracking-wider">{isHeld ? (isHi ? 'फ्रीज़' : 'Held') : (isHi ? 'रोकें' : 'Hold')}</span>
        </button>

        {/* Relative vs Absolute Angle */}
        <button
          onClick={() => { setAngleMode(angleMode === 'relative' ? 'absolute' : 'relative'); triggerHaptic(); }}
          title={isHi ? 'कोण मोड (सापेक्ष / निरपेक्ष)' : 'Angle Mode (Relative / Absolute)'}
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-2 rounded-xl border transition-all active:scale-95 shadow-sm",
            angleMode === 'absolute'
              ? "bg-sky-500 text-white border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.4)]"
              : (theme === 'light' ? "bg-white border-stone-200 text-stone-600 hover:text-stone-900" : "bg-white/5 border-white/10 text-stone-300 hover:text-white")
          )}
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span className="text-[7.5px] font-black uppercase tracking-wider">{angleMode === 'absolute' ? (isHi ? 'निरपेक्ष' : 'Absolute') : (isHi ? 'सापेक्ष' : 'Relative')}</span>
        </button>

        {/* Audio Chime on Level */}
        <button
          onClick={() => {
            const next = !soundOnLevel;
            setSoundOnLevel(next);
            try { localStorage.setItem('com.spiritual.compass.app_level_sound', next.toString()); } catch {}
            triggerHaptic();
            if (next) playWebAudioChime();
          }}
          title={isHi ? 'समतल पर ध्वनि' : 'Sound Chime on Level'}
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-2 rounded-xl border transition-all active:scale-95 shadow-sm",
            soundOnLevel
              ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
              : (theme === 'light' ? "bg-white border-stone-200 text-stone-600 hover:text-stone-900" : "bg-white/5 border-white/10 text-stone-300 hover:text-white")
          )}
        >
          {soundOnLevel ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="text-[7.5px] font-black uppercase tracking-wider">{soundOnLevel ? (isHi ? 'ध्वनि' : 'Sound') : (isHi ? 'मूक' : 'Mute')}</span>
        </button>

        {/* Reference Lock */}
        <button
          onClick={handleReferenceLock}
          title={isHi ? 'वर्तमान कोण को संदर्भ बनाएं' : 'Lock Current Angle as Reference'}
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-2 rounded-xl border transition-all active:scale-95 shadow-sm",
            referenceLock
              ? "bg-purple-500 text-white border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]"
              : (theme === 'light' ? "bg-white border-stone-200 text-stone-600 hover:text-stone-900" : "bg-white/5 border-white/10 text-stone-300 hover:text-white")
          )}
        >
          <Lock className="w-3.5 h-3.5" />
          <span className="text-[7.5px] font-black uppercase tracking-wider">{referenceLock ? (isHi ? 'रेफरेंस' : 'Ref Locked') : (isHi ? 'रेफरेंस' : 'Ref Lock')}</span>
        </button>

        {/* 8-Motion Calibrate */}
        <button
          onClick={() => { onCalibrate?.(); }}
          title={isHi ? 'सेंसर कैलिब्रेशन' : 'Calibrate Sensors'}
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-2 rounded-xl border transition-all active:scale-95 shadow-sm",
            theme === 'light' ? "bg-white border-stone-200 text-stone-600 hover:text-stone-900" : "bg-white/5 border-white/10 text-stone-300 hover:text-white"
          )}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="text-[7.5px] font-black uppercase tracking-wider">{isHi ? 'कैलिब्रेट' : 'Calibrate'}</span>
        </button>
      </div>

      {/* ── Optional Target Angle Mode Drawer ── */}
      <div className={cn(
        "w-full flex items-center justify-between gap-1 p-1.5 rounded-2xl border mb-2 transition-all",
        targetMode
          ? (theme === 'light' ? "bg-sky-50 border-sky-300 shadow-sm" : "bg-sky-500/10 border-sky-500/40")
          : (theme === 'light' ? "bg-white border-stone-200" : "bg-stone-900/60 border-white/10")
      )}>
        <button
          onClick={() => { setTargetMode(!targetMode); triggerHaptic(); }}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all active:scale-95",
            targetMode ? "bg-sky-500 text-white shadow-sm" : (theme === 'light' ? "text-stone-600" : "text-stone-400")
          )}
        >
          <Target className="w-3 h-3" />
          <span>{isHi ? 'लक्ष्य कोण (Target Angle)' : 'Target Angle Mode'}</span>
        </button>

        {targetMode && (
          <div className="flex items-center gap-1.5">
            {[30, 45, 90].map(deg => (
              <button
                key={deg}
                onClick={() => { setTargetAngle(deg); triggerHaptic(); }}
                className={cn(
                  "px-2 py-0.5 rounded-lg text-[9px] font-mono font-black border transition-all",
                  targetAngle === deg
                    ? "bg-sky-500 text-white border-sky-400"
                    : (theme === 'light' ? "bg-white text-stone-700 border-stone-300" : "bg-white/5 text-stone-300 border-white/10")
                )}
              >
                {deg}°
              </button>
            ))}
            <div className="flex items-center gap-0.5 ml-1">
              <button
                onClick={() => { setTargetAngle(Math.max(0, targetAngle - 1)); triggerHaptic(); }}
                className={cn("w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-black transition-all active:scale-95", theme === 'light' ? "bg-white border-stone-300" : "bg-white/10 border-white/10")}
              >
                -
              </button>
              <span className={cn("px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-black border", theme === 'light' ? "bg-white border-sky-300 text-sky-800" : "bg-black/50 border-sky-500/40 text-sky-300")}>
                {targetAngle}°
              </span>
              <button
                onClick={() => { setTargetAngle(Math.min(90, targetAngle + 1)); triggerHaptic(); }}
                className={cn("w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-black transition-all active:scale-95", theme === 'light' ? "bg-white border-stone-300" : "bg-white/10 border-white/10")}
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MAIN VISUALIZATION: BULLSEYE VS DUAL VIALS ── */}
      {subMode === 'bullseye' ? (
        <div className={cn(
          "relative w-64 h-64 sm:w-72 sm:h-72 rounded-full flex items-center justify-center border-2 overflow-hidden my-1 shadow-2xl transition-all",
          theme === 'light'
            ? "border-emerald-400 bg-[radial-gradient(circle_at_center,#ECFDF5_0%,#D1FAE5_45%,#A7F3D0_80%,#6EE7B7_100%)] shadow-[0_0_40px_rgba(16,185,129,0.22),inset_0_0_35px_rgba(16,185,129,0.20)]"
            : "border-emerald-500/40 bg-[radial-gradient(circle_at_center,#0C2E23_0%,#071C15_45%,#030C09_80%,#010504_100%)] shadow-[0_0_40px_rgba(16,185,129,0.35),inset_0_0_35px_rgba(16,185,129,0.22)]"
        )}>
          {/* Calibrated Concentric Degree Rings: 1°, 2°, 3°, 5° */}
          <div className={cn("absolute w-12 h-12 rounded-full border pointer-events-none transition-colors", displayLevel ? "border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : (theme === 'light' ? "border-emerald-700/30" : "border-emerald-300/30"))} />
          <div className={cn("absolute w-24 h-24 rounded-full border pointer-events-none", theme === 'light' ? "border-emerald-700/25" : "border-emerald-300/25")} />
          <div className={cn("absolute w-36 h-36 rounded-full border border-dashed pointer-events-none", theme === 'light' ? "border-emerald-700/30" : "border-emerald-300/30")} />
          <div className={cn("absolute w-48 h-48 rounded-full border pointer-events-none", theme === 'light' ? "border-emerald-700/25" : "border-emerald-300/25")} />

          {/* Precision Crosshairs */}
          <div className={cn("absolute inset-x-0 top-1/2 h-[1px] pointer-events-none", theme === 'light' ? "bg-emerald-800/30" : "bg-emerald-300/30")} />
          <div className={cn("absolute inset-y-0 left-1/2 w-[1px] pointer-events-none", theme === 'light' ? "bg-emerald-800/30" : "bg-emerald-300/30")} />

          {/* Micro Degree Calibration Markings */}
          <span className={cn("absolute top-3 left-1/2 -translate-x-1/2 text-[7.5px] font-black font-mono pointer-events-none", theme === 'light' ? "text-emerald-800/60" : "text-emerald-300/60")}>5°</span>
          <span className={cn("absolute bottom-3 left-1/2 -translate-x-1/2 text-[7.5px] font-black font-mono pointer-events-none", theme === 'light' ? "text-emerald-800/60" : "text-emerald-300/60")}>5°</span>
          <span className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-[7.5px] font-black font-mono pointer-events-none", theme === 'light' ? "text-emerald-800/60" : "text-emerald-300/60")}>5°</span>
          <span className={cn("absolute right-3 top-1/2 -translate-y-1/2 text-[7.5px] font-black font-mono pointer-events-none", theme === 'light' ? "text-emerald-800/60" : "text-emerald-300/60")}>5°</span>

          {/* Center Target Deadzone Ring */}
          <div className={cn(
            "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 pointer-events-none z-10",
            displayLevel
              ? "border-emerald-400 bg-emerald-500/25 shadow-[0_0_30px_#10B981]"
              : "border-amber-400/80 bg-amber-400/10 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full transition-colors",
              displayLevel ? "bg-emerald-400 shadow-[0_0_12px_#10B981]" : "bg-amber-400/70"
            )} />
          </div>

          {/* Dead-Center Celebration Pulse Rings */}
          {celebrate && (
            <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
              <div className="absolute w-16 h-16 rounded-full border-2 border-emerald-400 animate-ping" />
              <div className="absolute w-28 h-28 rounded-full border border-emerald-300 animate-ping" style={{ animationDelay: '150ms' }} />
              <div className="absolute w-44 h-44 rounded-full border border-emerald-200/60 animate-ping" style={{ animationDelay: '300ms' }} />
              <div className="absolute -top-1 px-3 py-1 rounded-full bg-emerald-500 text-stone-950 text-[10px] font-black uppercase tracking-widest animate-bounce shadow-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-stone-950" />
                <span>{isHi ? 'पूर्ण समतल!' : 'PERFECT LEVEL!'}</span>
              </div>
            </div>
          )}

          {/* High-Precision Fluid Mineral Spirit Bubble */}
          <div
            className={cn(
              "absolute w-10 h-10 rounded-full transition-transform duration-100 ease-out shadow-2xl border flex items-center justify-center z-20 pointer-events-none",
              displayLevel
                ? "bg-gradient-to-tr from-[#059669] via-[#10B981] to-[#34D399] border-white shadow-[0_0_30px_#10B981] scale-105"
                : (theme === 'light'
                    ? "bg-gradient-to-tr from-[#047857] via-[#10B981] to-[#6EE7B7] border-white shadow-[0_0_20px_rgba(16,185,129,0.8)]"
                    : "bg-gradient-to-tr from-[#A7F3D0] via-[#34D399] to-[#059669] border-white/90 shadow-[0_0_20px_rgba(16,185,129,0.8)]")
            )}
            style={{
              transform: `translate(${Math.max(-82, Math.min(82, -displayVisualRoll * 4.8))}px, ${Math.max(-82, Math.min(82, -displayVisualPitch * 4.8))}px)`
            }}
          >
            {/* Liquid Surface Shine & Specular Highlight */}
            <div className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden">
              <div className="absolute top-1 left-2 w-3 h-1.5 rounded-full bg-white/70 blur-[0.5px]" />
              <div className={cn("w-1.5 h-1.5 rounded-full shadow-sm", theme === 'light' ? "bg-white/90" : "bg-stone-950/70")} />
            </div>
          </div>

          {/* Live Floating Signed Degree Badges */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30 pointer-events-none">
            <span className={cn(
              "px-2 py-0.5 rounded-lg text-[9px] font-black font-mono border shadow-sm",
              theme === 'light' ? "bg-white/90 text-emerald-800 border-emerald-300" : "bg-black/60 text-emerald-300 border-emerald-500/40"
            )}>
              P {displayPitch >= 0 ? `+${displayPitch.toFixed(1)}°` : `${displayPitch.toFixed(1)}°`}
            </span>
            <span className={cn(
              "px-2 py-0.5 rounded-lg text-[9px] font-black font-mono border shadow-sm",
              theme === 'light' ? "bg-white/90 text-sky-800 border-sky-300" : "bg-black/60 text-sky-300 border-sky-500/40"
            )}>
              R {displayRoll >= 0 ? `+${displayRoll.toFixed(1)}°` : `${displayRoll.toFixed(1)}°`}
            </span>
          </div>
        </div>
      ) : (
        /* ── DUAL TUBULAR SPIRIT VIALS (HORIZONTAL ROLL & VERTICAL PITCH) ── */
        <div className={cn(
          "w-full flex flex-col gap-3 my-1 p-3 rounded-2xl border shadow-xl",
          theme === 'light' ? "bg-white border-stone-200" : "bg-stone-950/90 border-white/10"
        )}>
          {/* Horizontal Roll Vial */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold px-1">
              <span className={theme === 'light' ? "text-stone-600" : "text-stone-300"}>
                {isHi ? 'क्षैतिज वायल (रोल / Roll X)' : 'Horizontal Vial (Roll)'}
              </span>
              <span className="font-mono font-black text-emerald-400">
                {displayRoll >= 0 ? `+${displayRoll.toFixed(1)}°` : `${displayRoll.toFixed(1)}°`}
              </span>
            </div>
            <div className="w-full h-11 rounded-2xl bg-gradient-to-b from-[#111827] via-[#0F172A] to-[#030712] border-2 border-stone-700 relative overflow-hidden flex items-center justify-center shadow-inner">
              {/* Tick Graduations */}
              <div className="absolute inset-y-0 left-1/4 w-[1px] bg-white/20" />
              <div className="absolute inset-y-0 right-1/4 w-[1px] bg-white/20" />
              <div className="absolute inset-y-1 left-1/2 w-8 -translate-x-1/2 border-x-2 border-amber-400/90 pointer-events-none" />

              {/* Gliding Bubble */}
              <div
                className="absolute w-9 h-8 rounded-xl bg-gradient-to-tr from-lime-300 via-emerald-400 to-teal-400 border border-white/90 shadow-[0_0_18px_#10B981] transition-transform duration-100 ease-out flex items-center justify-center"
                style={{ transform: `translateX(${Math.max(-105, Math.min(105, -displayVisualRoll * 6.5))}px)` }}
              >
                <div className="w-1 h-1 rounded-full bg-stone-950/50" />
              </div>
            </div>
          </div>

          {/* Vertical Pitch Vial */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold px-1">
              <span className={theme === 'light' ? "text-stone-600" : "text-stone-300"}>
                {isHi ? 'ऊर्ध्वाधर वायल (पिच / Pitch Y)' : 'Vertical Vial (Pitch)'}
              </span>
              <span className="font-mono font-black text-sky-400">
                {displayPitch >= 0 ? `+${displayPitch.toFixed(1)}°` : `${displayPitch.toFixed(1)}°`}
              </span>
            </div>
            <div className="w-full h-11 rounded-2xl bg-gradient-to-b from-[#111827] via-[#0F172A] to-[#030712] border-2 border-stone-700 relative overflow-hidden flex items-center justify-center shadow-inner">
              {/* Tick Graduations */}
              <div className="absolute inset-y-0 left-1/4 w-[1px] bg-white/20" />
              <div className="absolute inset-y-0 right-1/4 w-[1px] bg-white/20" />
              <div className="absolute inset-y-1 left-1/2 w-8 -translate-x-1/2 border-x-2 border-amber-400/90 pointer-events-none" />

              {/* Gliding Bubble */}
              <div
                className="absolute w-9 h-8 rounded-xl bg-gradient-to-tr from-sky-300 via-cyan-400 to-blue-500 border border-white/90 shadow-[0_0_18px_#38BDF8] transition-transform duration-100 ease-out flex items-center justify-center"
                style={{ transform: `translateX(${Math.max(-105, Math.min(105, -displayVisualPitch * 6.5))}px)` }}
              >
                <div className="w-1 h-1 rounded-full bg-stone-950/50" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ENGINEERING METRICS GRID (PITCH, ROLL, SLOPE %, ROOF 1:X, MM/M) ── */}
      <div className="w-full grid grid-cols-4 gap-1.5 my-1.5">
        <div className={cn("p-2 rounded-xl border flex flex-col items-center shadow-sm", theme === 'light' ? "bg-white border-stone-200" : "bg-stone-900/80 border-white/10")}>
          <span className={cn("text-[7.5px] font-black uppercase tracking-wider", theme === 'light' ? "text-stone-500" : "text-stone-400")}>{isHi ? 'पिच (X)' : 'Pitch (X)'}</span>
          <span className="text-xs font-black font-mono text-sky-400 mt-0.5">{displayPitch >= 0 ? `+${displayPitch.toFixed(1)}°` : `${displayPitch.toFixed(1)}°`}</span>
        </div>
        <div className={cn("p-2 rounded-xl border flex flex-col items-center shadow-sm", theme === 'light' ? "bg-white border-stone-200" : "bg-stone-900/80 border-white/10")}>
          <span className={cn("text-[7.5px] font-black uppercase tracking-wider", theme === 'light' ? "text-stone-500" : "text-stone-400")}>{isHi ? 'रोल (Y)' : 'Roll (Y)'}</span>
          <span className="text-xs font-black font-mono text-emerald-400 mt-0.5">{displayRoll >= 0 ? `+${displayRoll.toFixed(1)}°` : `${displayRoll.toFixed(1)}°`}</span>
        </div>
        <div className={cn("p-2 rounded-xl border flex flex-col items-center shadow-sm", theme === 'light' ? "bg-white border-stone-200" : "bg-stone-900/80 border-white/10")}>
          <span className={cn("text-[7.5px] font-black uppercase tracking-wider flex items-center gap-0.5", theme === 'light' ? "text-stone-500" : "text-stone-400")}>
            <TrendingUp className="w-2 h-2" />{isHi ? 'ढलान %' : 'Slope %'}
          </span>
          <span className="text-xs font-black font-mono text-amber-400 mt-0.5">{slopePercent}%</span>
        </div>
        <div className={cn("p-2 rounded-xl border flex flex-col items-center shadow-sm", theme === 'light' ? "bg-white border-stone-200" : "bg-stone-900/80 border-white/10")}>
          <span className={cn("text-[7.5px] font-black uppercase tracking-wider flex items-center gap-0.5", theme === 'light' ? "text-stone-500" : "text-stone-400")}>
            <Ruler className="w-2 h-2" />{isHi ? 'छत (Roof)' : 'Roof'}
          </span>
          <span className="text-xs font-black font-mono text-orange-400 mt-0.5">1:{roofRatio}</span>
        </div>
      </div>

      {/* ── STABILITY SPARKLINE & MAX/MIN TRACKER ── */}
      <div className={cn(
        "w-full rounded-2xl p-2.5 border my-1 shadow-sm",
        theme === 'light' ? "bg-white border-stone-200" : "bg-stone-900/80 border-white/10"
      )}>
        <div className="flex items-center justify-between mb-1.5">
          <span className={cn("text-[8px] font-black uppercase tracking-wider flex items-center gap-1", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
            <TrendingUp className="w-2.5 h-2.5" />
            <span>{isHi ? 'अधिकतम / न्यूनतम झुकाव' : 'Max / Min Tilt Tracking'}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleResetMaxMin}
              className={cn(
                "text-[7.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border transition-all active:scale-95",
                theme === 'light' ? "bg-stone-100 border-stone-300 text-stone-600 hover:text-stone-900" : "bg-white/5 border-white/10 text-stone-300 hover:text-white"
              )}
            >
              <RefreshCw className="w-2 h-2 inline mr-0.5" />
              {isHi ? 'रीसेट' : 'Reset'}
            </button>
            <button
              onClick={handleCopy}
              className={cn(
                "text-[7.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border transition-all active:scale-95",
                copied ? "bg-emerald-500 text-white border-emerald-400" : (theme === 'light' ? "bg-stone-100 border-stone-300 text-stone-600" : "bg-white/5 border-white/10 text-stone-300")
              )}
            >
              {copied ? <Check className="w-2 h-2 inline mr-0.5" /> : <Copy className="w-2 h-2 inline mr-0.5" />}
              {copied ? (isHi ? 'कॉपी हुआ!' : 'Copied!') : (isHi ? 'कॉपी' : 'Copy')}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-baseline gap-1">
            <span className={cn("text-xs font-black font-mono", theme === 'light' ? "text-red-600" : "text-red-400")}>{maxTilt.toFixed(1)}°</span>
            <span className="text-[9px] text-stone-400 font-bold">/</span>
            <span className={cn("text-xs font-black font-mono", theme === 'light' ? "text-emerald-600" : "text-emerald-400")}>{minTilt.toFixed(1)}°</span>
          </div>

          {/* Throttled 24-point stability sparkline bar chart */}
          <div className="flex-1 flex items-end gap-[3px] h-6 ml-2">
            {history.map((v, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-sm transition-all duration-200",
                  v < 1 ? "bg-emerald-400" : v < 3 ? "bg-amber-400" : "bg-red-400"
                )}
                style={{ height: `${Math.max(10, Math.min(100, v * 15))}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── SURFACE FLATNESS SCORE BAR ── */}
      <div className={cn(
        "w-full rounded-2xl p-2.5 border my-1 shadow-sm",
        theme === 'light' ? "bg-white border-stone-200" : "bg-stone-900/80 border-white/10"
      )}>
        <div className="flex items-center justify-between mb-1">
          <span className={cn("text-[8px] font-black uppercase tracking-wider flex items-center gap-1", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
            <Sliders className="w-2.5 h-2.5" />
            {isHi ? 'सतह की सपाटता (Surface Flatness)' : 'Surface Flatness Score'}
          </span>
          <span className={cn("text-[9px] font-black", flatnessColor)}>{flatnessLabel} ({flatnessScore}%)</span>
        </div>
        <div className={cn("w-full h-1.5 rounded-full overflow-hidden", theme === 'light' ? "bg-stone-200" : "bg-stone-800")}>
          <div
            className={cn("h-full rounded-full transition-all duration-300", flatnessScore >= 90 ? "bg-emerald-400" : flatnessScore >= 70 ? "bg-teal-400" : flatnessScore >= 40 ? "bg-amber-400" : "bg-red-400")}
            style={{ width: `${flatnessScore}%` }}
          />
        </div>
      </div>

      {/* ── READING LOG / SAVED MEASUREMENTS ── */}
      <div className={cn(
        "w-full rounded-2xl p-2.5 border my-1 shadow-sm",
        theme === 'light' ? "bg-white border-stone-200" : "bg-stone-900/80 border-white/10"
      )}>
        <div className="flex items-center justify-between mb-1.5">
          <span className={cn("text-[8px] font-black uppercase tracking-wider flex items-center gap-1", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
            <History className="w-2.5 h-2.5" />
            {isHi ? 'रीडिंग इतिहास' : 'Reading Log'} ({readings.length})
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleLogReading}
              className={cn(
                "text-[7.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-0.5 transition-all active:scale-95 shadow-sm",
                theme === 'light' ? "bg-stone-100 border-stone-300 text-stone-700 hover:text-stone-900" : "bg-white/5 border-white/10 text-stone-300 hover:text-white"
              )}
            >
              <Plus className="w-2 h-2" />
              {isHi ? 'लॉग' : '+ Log'}
            </button>
            {readings.length > 0 && (
              <button
                onClick={handleClearReadings}
                className={cn(
                  "text-[7.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-0.5 transition-all active:scale-95 shadow-sm",
                  theme === 'light' ? "bg-stone-100 border-stone-300 text-stone-700 hover:text-stone-900" : "bg-white/5 border-white/10 text-stone-300 hover:text-white"
                )}
              >
                <Trash2 className="w-2 h-2" />
                {isHi ? 'साफ़' : 'Clear'}
              </button>
            )}
          </div>
        </div>

        {readings.length > 0 ? (
          <div className="flex flex-col gap-1 max-h-24 overflow-y-auto no-scrollbar">
            {readings.map((r) => (
              <div key={r.id} className={cn("flex items-center justify-between text-[8px] font-mono px-2 py-1 rounded-lg border", theme === 'light' ? "bg-stone-50 border-stone-200" : "bg-white/5 border-white/5")}>
                <span className={theme === 'light' ? "text-stone-500" : "text-stone-400"}>{r.time}</span>
                <span className={theme === 'light' ? "text-stone-700" : "text-stone-300"}>P {r.pitch >= 0 ? `+${r.pitch.toFixed(1)}°` : `${r.pitch.toFixed(1)}°`} R {r.roll >= 0 ? `+${r.roll.toFixed(1)}°` : `${r.roll.toFixed(1)}°`}</span>
                <span className={r.total < 1.0 ? "text-emerald-400 font-black" : "text-amber-400 font-black"}>{r.total.toFixed(1)}°</span>
              </div>
            ))}
          </div>
        ) : (
          <p className={cn("text-[8px] font-bold text-center py-1", theme === 'light' ? "text-stone-400" : "text-stone-500")}>
            {isHi ? 'कोई रीडिंग नहीं — + लॉग दबाएं' : 'No readings yet — tap + Log to record'}
          </p>
        )}
      </div>

      {/* ── Calibration Footer Guide ── */}
      <div className={cn(
        "w-full rounded-2xl p-2.5 border mt-1 text-center shadow-sm",
        theme === 'light' ? "border-amber-400/50 bg-amber-50 text-amber-950" : "border-amber-500/25 bg-amber-950/20 text-stone-300"
      )}>
        <div className={cn("text-[9px] font-black uppercase tracking-[0.20em]", theme === 'light' ? "text-amber-800" : "text-amber-300")}>
          {isHi ? '8-आकृति सेंसर कैलिब्रेशन' : 'Figure-8 Sensor Calibration'}
        </div>
        <p className="mt-0.5 text-[8.5px] leading-relaxed opacity-90">
          {displayLevel
            ? (isHi ? '✓ समतल लॉक प्राप्त। सतह माउंटिंग, फ्लोर-प्लान व कैमरा ऑडिट के लिए तैयार।' : '✓ Perfect level lock achieved. Ready for mounting, framing, and surface audits.')
            : (isHi ? 'सटीक शून्य विचलन के लिए फोन को 8 की आकृति में घुमाएं और बबल केंद्र पर लाएं।' : 'Rotate phone in a smooth figure-8 motion, zero tare if needed, and align bubble to dead center.')}
        </p>
      </div>

    </div>
  );
};
