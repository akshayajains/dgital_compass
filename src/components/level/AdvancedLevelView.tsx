import React, { useState, useEffect, useRef } from 'react';
import { Target, Layers, RotateCcw, AlertTriangle, CheckCircle2, Lock, Unlock, TrendingUp, Ruler, Volume2, VolumeX, Crosshair, Copy, Check, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, RefreshCw, Hand, History, Plus, Trash2 } from 'lucide-react';
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
  const t = translations[language];
  const [subMode, setSubMode] = useState<'bullseye' | 'vials'>('bullseye');
  const [isLocked, setIsLocked] = useState(false);
  const [lockedPitch, setLockedPitch] = useState(0);
  const [lockedRoll, setLockedRoll] = useState(0);
  const [lockedTotal, setLockedTotal] = useState(0);
  const [flatnessScore, setFlatnessScore] = useState(100);
  const historyRef = useRef<number[]>([]);

  // ── New feature state ──
  // Hold to measure / freeze-on-tap
  const [isHeld, setIsHeld] = useState(false);
  const [heldPitch, setHeldPitch] = useState(0);
  const [heldRoll, setHeldRoll] = useState(0);
  const [heldTotal, setHeldTotal] = useState(0);
  // Surface angle mode: relative (tare-based) vs absolute (from horizontal)
  const [angleMode, setAngleMode] = useState<'relative' | 'absolute'>('relative');
  // Sound on level toggle (persisted)
  const [soundOnLevel, setSoundOnLevel] = useState<boolean>(() => {
    try { return localStorage.getItem('com.hcompass.app_level_sound') !== 'false'; } catch { return true; }
  });
  // Reference lock: hold current as 0°
  const [referenceLock, setReferenceLock] = useState<{ pitch: number; roll: number } | null>(null);
  // Max/Min tilt recorder
  const [maxTilt, setMaxTilt] = useState(0);
  const [minTilt, setMinTilt] = useState(0);
  // Level history sparkline
  const [history, setHistory] = useState<number[]>([]);
  // Copy feedback
  const [copied, setCopied] = useState(false);
  // Haptic-on-level guard
  const wasLevelRef = useRef(false);

  // ── Feature 6: dead-center celebration ──
  const [celebrate, setCelebrate] = useState(false);
  const celebrateTimerRef = useRef<number | null>(null);

  // ── Feature 7: target angle mode ──
  const [targetMode, setTargetMode] = useState(false);
  const [targetAngle, setTargetAngle] = useState(30);

  // ── Feature 8: reading history log (persisted) ──
  interface ReadingEntry { id: number; time: string; pitch: number; roll: number; total: number; }
  const [readings, setReadings] = useState<ReadingEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('com.hcompass.app_readings') || '[]'); } catch { return []; }
  });

  // Effective values (tare + reference lock applied)
  const tarePitch = tareOffset?.pitch || 0;
  const tareRoll = tareOffset?.roll || 0;
  const refPitch = referenceLock?.pitch || 0;
  const refRoll = referenceLock?.roll || 0;

  // Absolute angle from horizontal (device flat = 0)
  const absPitch = pitch;
  const absRoll = roll;
  // Relative angle (tare + reference applied)
  const relPitch = pitch - tarePitch - refPitch;
  const relRoll = roll - tareRoll - refRoll;

  const effPitch = angleMode === 'absolute' ? absPitch : relPitch;
  const effRoll = angleMode === 'absolute' ? absRoll : relRoll;
  const totalTilt = Math.sqrt(effPitch * effPitch + effRoll * effRoll);
  const isLevel = totalTilt < 1.0;
  const isHighTilt = totalTilt >= 3.0;

  // Flatness tracker: accumulate recent tilt readings
  useEffect(() => {
    historyRef.current.push(totalTilt);
    if (historyRef.current.length > 60) historyRef.current.shift();
    const readings = historyRef.current;
    if (readings.length < 5) { setFlatnessScore(100); return; }
    const avg = readings.reduce((a, b) => a + b, 0) / readings.length;
    const variance = readings.reduce((s, v) => s + (v - avg) ** 2, 0) / readings.length;
    const stdDev = Math.sqrt(variance);
    const score = Math.max(0, Math.min(100, Math.round(100 - stdDev * 20)));
    setFlatnessScore(score);
  }, [totalTilt]);

  // Max/Min tilt recorder + history sparkline
  useEffect(() => {
    setMaxTilt((m) => Math.max(m, totalTilt));
    setMinTilt((m) => (m === 0 ? totalTilt : Math.min(m, totalTilt)));
    setHistory((h) => {
      const next = [...h, totalTilt];
      if (next.length > 30) next.shift();
      return next;
    });
  }, [totalTilt]);

  // Haptic + sound feedback when reaching level (+ celebration burst)
  useEffect(() => {
    if (isLevel && !wasLevelRef.current) {
      triggerHaptic();
      if (soundOnLevel && playSound) playSound('chime');
      setCelebrate(true);
      if (celebrateTimerRef.current) window.clearTimeout(celebrateTimerRef.current);
      celebrateTimerRef.current = window.setTimeout(() => setCelebrate(false), 1400);
    }
    wasLevelRef.current = isLevel;
  }, [isLevel, soundOnLevel, triggerHaptic, playSound]);

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

  // Hold to measure / freeze-on-tap
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

  // Reference lock: set current as 0°
  const handleReferenceLock = () => {
    triggerHaptic();
    if (referenceLock) {
      setReferenceLock(null);
    } else {
      setReferenceLock({ pitch, roll });
    }
  };

  // Copy reading
  const handleCopy = () => {
    triggerHaptic();
    const text = `Pitch: ${displayPitch.toFixed(1)}°, Roll: ${displayRoll.toFixed(1)}°, Total Tilt: ${displayTotal.toFixed(1)}°`;
    try {
      navigator.clipboard?.writeText(text);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset max/min
  const handleResetMaxMin = () => {
    triggerHaptic();
    setMaxTilt(0);
    setMinTilt(0);
  };

  const displayPitch = isLocked ? lockedPitch : isHeld ? heldPitch : effPitch;
  const displayRoll = isLocked ? lockedRoll : isHeld ? heldRoll : effRoll;
  const displayTotal = isLocked ? lockedTotal : isHeld ? heldTotal : totalTilt;
  const displayLevel = isLocked ? lockedTotal < 1.0 : isHeld ? heldTotal < 1.0 : isLevel;
  const displayHigh = isLocked ? lockedTotal >= 3.0 : isHeld ? heldTotal >= 3.0 : isHighTilt;

  // ── Feature 7: target angle mode derived state ──
  const targetDelta = Math.abs(displayTotal - targetAngle);
  const onTarget = targetMode && targetDelta < 1.0;
  const bannerLevel = targetMode ? onTarget : displayLevel;
  const bannerHigh = targetMode ? false : displayHigh;
  const bannerTitle = targetMode
    ? (onTarget ? (isHi ? 'लक्ष्य प्राप्त' : 'ON TARGET') : (isHi ? `लक्ष्य ${targetAngle}°` : `TARGET ${targetAngle}°`))
    : (displayLevel ? t.levelAchieved : displayHigh ? t.highTilt : t.tilt);
  const bannerSub = targetMode
    ? `${isHi ? 'अंतर' : 'OFF'} ${targetDelta.toFixed(1)}°`
    : `${t.totalTilt}: ${displayTotal.toFixed(1)}°`;

  // ── Feature 8: log current reading ──
  const handleLogReading = () => {
    triggerHaptic();
    const entry: ReadingEntry = { id: Date.now(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), pitch: displayPitch, roll: displayRoll, total: displayTotal };
    const next = [entry, ...readings].slice(0, 20);
    setReadings(next);
    try { localStorage.setItem('com.hcompass.app_readings', JSON.stringify(next)); } catch {}
  };
  const handleClearReadings = () => {
    triggerHaptic();
    setReadings([]);
    try { localStorage.removeItem('com.hcompass.app_readings'); } catch {}
  };

  // Directional guidance arrows
  const guidance = (() => {
    if (displayLevel) return null;
    const p = displayPitch;
    const r = displayRoll;
    const parts: { icon: React.ReactNode; label: string }[] = [];
    if (Math.abs(r) > 0.5) parts.push({ icon: r > 0 ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />, label: r > 0 ? t.tiltLeft : t.tiltRight });
    if (Math.abs(p) > 0.5) parts.push({ icon: p > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />, label: p > 0 ? t.tiltForward : t.tiltBack });
    return parts;
  })();

  const flatnessLabel = flatnessScore >= 90 ? (isHi ? 'बहुत सपाट' : 'Very Flat')
    : flatnessScore >= 70 ? (isHi ? 'सपाट' : 'Flat')
    : flatnessScore >= 40 ? (isHi ? 'थोड़ा टेढ़ा' : 'Uneven')
    : (isHi ? 'बहुत टेढ़ा' : 'Very Uneven');
  const flatnessColor = flatnessScore >= 90 ? (theme === 'light' ? 'text-emerald-700' : 'text-emerald-400') : flatnessScore >= 70 ? (theme === 'light' ? 'text-teal-700' : 'text-teal-400') : flatnessScore >= 40 ? (theme === 'light' ? 'text-amber-700' : 'text-amber-400') : 'text-red-400';

  return (
    <div className={cn(
      "w-full max-w-sm flex flex-col items-center rounded-[24px] border p-2.5 animate-in fade-in zoom-in-95",
      theme === 'light'
        ? "border-emerald-500/30 bg-[radial-gradient(circle_at_50%_35%,rgba(16,185,129,0.10),transparent_35%),linear-gradient(180deg,#f0fdf4_0%,#dcfce7_100%)] shadow-[0_20px_45px_rgba(0,0,0,0.15)]"
        : "border-emerald-500/15 bg-[radial-gradient(circle_at_50%_35%,rgba(16,185,129,0.13),transparent_35%),linear-gradient(180deg,#07130e_0%,#030705_100%)] shadow-[0_20px_45px_rgba(0,0,0,0.7)]"
    )}>
      {/* Header row — compact */}
      <div className="mb-1.5 flex w-full items-center justify-between px-1">
        <span className={cn("text-[9px] font-black uppercase tracking-[0.22em]", theme === 'light' ? "text-emerald-700" : "text-emerald-300")}>Precision Spirit Level</span>
        <div className="flex items-center gap-1.5">
          <button onClick={handleLock} className={cn(
            "rounded-full border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 transition-all active:scale-95",
            isLocked
              ? (theme === 'light' ? "border-amber-500 bg-amber-100 text-amber-800" : "border-amber-400/50 bg-amber-400/10 text-amber-300")
              : (theme === 'light' ? "border-stone-300 bg-white text-stone-600 hover:text-stone-900" : "border-white/10 bg-white/5 text-stone-400 hover:text-white")
          )}>
            {isLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
            {isLocked ? (isHi ? 'लॉक' : 'Lock') : (isHi ? 'अनलॉक' : 'Open')}
          </button>
          <span className={cn("rounded-full border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider", bannerLevel ? (theme === 'light' ? "border-emerald-500 bg-emerald-100 text-emerald-800" : "border-emerald-400/50 bg-emerald-400/10 text-emerald-300") : (theme === 'light' ? "border-amber-500 bg-amber-100 text-amber-800" : "border-amber-400/40 bg-amber-400/10 text-amber-300"))}>
            {bannerLevel ? (targetMode ? (isHi ? 'लक्ष्य पर' : 'On Target') : (isHi ? 'सपाट' : 'Flat')) : (targetMode ? (isHi ? 'लक्ष्य' : 'Target') : (isHi ? 'खोज' : 'Searching'))}
          </span>
        </div>
      </div>

      {/* ── NEW: Large glanceable LEVEL status banner with directional guidance ── */}
      <div className={cn(
        "w-full rounded-2xl p-2.5 mb-1.5 border flex items-center justify-between transition-all duration-300",
        celebrate && "scale-[1.02]",
        bannerLevel
          ? (theme === 'light' ? "bg-emerald-500 text-white border-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.4)]" : "bg-emerald-500 text-stone-950 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]")
          : bannerHigh
          ? (theme === 'light' ? "bg-red-500 text-white border-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]" : "bg-red-600 text-white border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]")
          : (theme === 'light' ? "bg-amber-500 text-white border-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.4)]" : "bg-amber-500 text-stone-950 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]")
      )}>
        <div className="flex items-center gap-2">
          {bannerLevel
            ? <CheckCircle2 className="w-6 h-6 shrink-0 animate-pulse" />
            : <AlertTriangle className={cn("w-6 h-6 shrink-0", bannerHigh && "animate-pulse")} />}
          <div className="flex flex-col text-left leading-tight">
            <span className="text-sm font-black uppercase tracking-wide">
              {bannerTitle}
            </span>
            <span className="text-[10px] font-bold opacity-90">
              {bannerSub}
            </span>
          </div>
        </div>
        {/* Directional guidance arrows */}
        {!bannerLevel && guidance && guidance.length > 0 && (
          <div className="flex items-center gap-1.5">
            {guidance.map((g, i) => (
              <span key={i} className="flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider bg-white/20 rounded-lg px-1.5 py-1">
                {g.icon}
                {g.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Sub-mode + Tare + new quick actions — compact pill buttons */}
      <div className={cn("w-full flex items-center justify-between gap-1 p-0.5 rounded-xl border mb-1.5", theme === 'light' ? "bg-stone-100 border-stone-300" : "bg-stone-900/90 border-white/10")}>
        <button
          onClick={() => { setSubMode('bullseye'); triggerHaptic(); }}
          className={cn(
            "flex-1 py-1 px-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1",
            subMode === 'bullseye' ? "bg-[#F59E0B] text-stone-950 shadow-md scale-100" : (theme === 'light' ? "text-stone-600 hover:text-stone-900" : "text-stone-400 hover:text-white")
          )}
        >
          <Target className="w-3 h-3 stroke-[2.5]" />
          <span>{t.subLevelBullseye}</span>
        </button>
        <button
          onClick={() => { setSubMode('vials'); triggerHaptic(); }}
          className={cn(
            "flex-1 py-1 px-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1",
            subMode === 'vials' ? "bg-[#F59E0B] text-stone-950 shadow-md scale-100" : (theme === 'light' ? "text-stone-600 hover:text-stone-900" : "text-stone-400 hover:text-white")
          )}
        >
          <Layers className="w-3 h-3 stroke-[2.5]" />
          <span>{t.subLevelDualVials}</span>
        </button>
        <button
          onClick={() => { onToggleTare(); triggerHaptic(); }}
          className={cn(
            "py-1 px-2 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all border flex items-center justify-center gap-0.5 active:scale-95",
            tareOffset
              ? (theme === 'light' ? "bg-amber-100 text-amber-800 border-amber-500" : "bg-amber-500/25 text-amber-300 border-amber-500/50")
              : (theme === 'light' ? "bg-white text-stone-600 border-stone-300 hover:text-stone-900" : "bg-white/5 text-stone-300 border-white/10 hover:text-white")
          )}
        >
          <RotateCcw className="w-2.5 h-2.5" />
          <span>{t.tareZero}</span>
        </button>
      </div>

      {/* ── NEW: Feature quick-action row (Hold, Angle mode, Sound, Ref lock, Calibrate) ── */}
      <div className={cn("w-full grid grid-cols-5 gap-1 mb-1.5", theme === 'light' ? "" : "")}>
        {/* Hold to measure */}
        <button
          onClick={handleHold}
          title={t.levelHoldHint}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl border transition-all active:scale-95",
            isHeld
              ? "bg-amber-500 text-stone-950 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              : (theme === 'light' ? "bg-white border-stone-300 text-stone-600 hover:text-stone-900" : "bg-white/5 border-white/10 text-stone-300 hover:text-white")
          )}
        >
          <Hand className="w-3.5 h-3.5" />
          <span className="text-[7px] font-black uppercase tracking-wider">{t.levelHold}</span>
        </button>
        {/* Angle mode toggle */}
        <button
          onClick={() => { setAngleMode(angleMode === 'relative' ? 'absolute' : 'relative'); triggerHaptic(); }}
          title={t.levelAngleMode}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl border transition-all active:scale-95",
            angleMode === 'absolute'
              ? "bg-sky-500 text-white border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
              : (theme === 'light' ? "bg-white border-stone-300 text-stone-600 hover:text-stone-900" : "bg-white/5 border-white/10 text-stone-300 hover:text-white")
          )}
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span className="text-[7px] font-black uppercase tracking-wider">{angleMode === 'absolute' ? t.angleAbsolute : t.angleRelative}</span>
        </button>
        {/* Sound on level */}
        <button
          onClick={() => { setSoundOnLevel(!soundOnLevel); triggerHaptic(); }}
          title={t.soundOnLevel}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl border transition-all active:scale-95",
            soundOnLevel
              ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              : (theme === 'light' ? "bg-white border-stone-300 text-stone-600 hover:text-stone-900" : "bg-white/5 border-white/10 text-stone-300 hover:text-white")
          )}
        >
          {soundOnLevel ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="text-[7px] font-black uppercase tracking-wider">{isHi ? 'ध्वनि' : 'Sound'}</span>
        </button>
        {/* Reference lock */}
        <button
          onClick={handleReferenceLock}
          title={t.referenceLockHint}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl border transition-all active:scale-95",
            referenceLock
              ? "bg-violet-500 text-white border-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
              : (theme === 'light' ? "bg-white border-stone-300 text-stone-600 hover:text-stone-900" : "bg-white/5 border-white/10 text-stone-300 hover:text-white")
          )}
        >
          <Lock className="w-3.5 h-3.5" />
          <span className="text-[7px] font-black uppercase tracking-wider">{t.referenceLock}</span>
        </button>
        {/* Calibrate */}
        <button
          onClick={() => { onCalibrate?.(); }}
          title={t.calibrate}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl border transition-all active:scale-95",
            theme === 'light' ? "bg-white border-stone-300 text-stone-600 hover:text-stone-900" : "bg-white/5 border-white/10 text-stone-300 hover:text-white"
          )}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="text-[7px] font-black uppercase tracking-wider">{t.calibrate}</span>
        </button>
      </div>

      {/* ── Feature 7: Target angle control row ── */}
      <div className={cn("w-full flex items-center justify-between gap-1 p-1 rounded-xl border mb-1.5", targetMode ? (theme === 'light' ? "bg-sky-50 border-sky-400" : "bg-sky-500/10 border-sky-500/40") : (theme === 'light' ? "bg-stone-100 border-stone-300" : "bg-stone-900/90 border-white/10"))}>
        <button
          onClick={() => { setTargetMode(!targetMode); triggerHaptic(); }}
          title={isHi ? 'लक्ष्य कोण मोड' : 'Target angle mode'}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all active:scale-95",
            targetMode ? "bg-sky-500 text-white" : (theme === 'light' ? "text-stone-600 hover:text-stone-900" : "text-stone-400 hover:text-white")
          )}
        >
          <Crosshair className="w-3 h-3" />
          {isHi ? 'लक्ष्य कोण' : 'Target Angle'}
        </button>
        {targetMode && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setTargetAngle(Math.max(0, targetAngle - 5)); triggerHaptic(); }}
              className={cn("w-7 h-7 rounded-lg border flex items-center justify-center text-sm font-black transition-all active:scale-95", theme === 'light' ? "bg-white border-stone-300 text-stone-700" : "bg-white/5 border-white/10 text-stone-300")}
            >−</button>
            <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-black font-mono border", theme === 'light' ? "bg-white border-sky-300 text-sky-700" : "bg-black/40 border-sky-500/40 text-sky-300")}>
              {targetAngle}°
            </span>
            <button
              onClick={() => { setTargetAngle(Math.min(90, targetAngle + 5)); triggerHaptic(); }}
              className={cn("w-7 h-7 rounded-lg border flex items-center justify-center text-sm font-black transition-all active:scale-95", theme === 'light' ? "bg-white border-stone-300 text-stone-700" : "bg-white/5 border-white/10 text-stone-300")}
            >+</button>
          </div>
        )}
      </div>

      {/* Main visualization */}
      {subMode === 'bullseye' ? (
        <div className={cn(
          "relative w-52 h-52 sm:w-60 sm:h-60 rounded-full flex items-center justify-center border overflow-hidden my-0.5",
          theme === 'light'
            ? "border-emerald-400 bg-[radial-gradient(circle_at_center,#d1fae5_0%,#a7f3d0_55%,#6ee7b7_100%)] shadow-[0_0_34px_rgba(16,185,129,0.25),inset_0_0_30px_rgba(16,185,129,0.15)]"
            : "border-emerald-400 bg-[radial-gradient(circle_at_center,#123f31_0%,#071e16_55%,#020806_100%)] shadow-[0_0_34px_rgba(16,185,129,0.32),inset_0_0_30px_rgba(16,185,129,0.18)]"
        )}>
          <div className={cn("absolute inset-2.5 rounded-full border pointer-events-none", theme === 'light' ? "border-emerald-600/25" : "border-emerald-300/25")} />
          <div className={cn("absolute inset-8 rounded-full border pointer-events-none", theme === 'light' ? "border-emerald-600/20" : "border-emerald-300/20")} />
          <div className={cn("absolute inset-14 rounded-full border border-dashed pointer-events-none", theme === 'light' ? "border-emerald-600/25" : "border-emerald-300/25")} />
          <div className={cn("absolute inset-20 rounded-full border pointer-events-none", theme === 'light' ? "border-emerald-600/30" : "border-emerald-300/30")} />
          <div className={cn("absolute inset-x-0 top-1/2 h-px pointer-events-none", theme === 'light' ? "bg-emerald-700/25" : "bg-emerald-200/25")} />
          <div className={cn("absolute inset-y-0 left-1/2 w-px pointer-events-none", theme === 'light' ? "bg-emerald-700/25" : "bg-emerald-200/25")} />

          {/* Center target ring */}
          <div className={cn("w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 pointer-events-none z-10", displayLevel ? "border-emerald-500 bg-emerald-500/20 shadow-[0_0_25px_#10b981]" : "border-amber-400/80 bg-amber-400/5 shadow-[0_0_12px_rgba(245,158,11,0.3)]")}>
            <div className={cn("w-1.5 h-1.5 rounded-full transition-colors", displayLevel ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-amber-400/60")} />
          </div>

          {/* ── Feature 6: dead-center celebration pulse rings ── */}
          {celebrate && (
            <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
              <div className="absolute w-14 h-14 rounded-full border-2 border-emerald-400 animate-ping" />
              <div className="absolute w-24 h-24 rounded-full border border-emerald-300/80 animate-ping" style={{ animationDelay: '150ms' }} />
              <div className="absolute w-36 h-36 rounded-full border border-emerald-200/60 animate-ping" style={{ animationDelay: '300ms' }} />
              <span className={cn("absolute -top-1 text-[10px] font-black uppercase tracking-widest animate-bounce", theme === 'light' ? "text-emerald-700" : "text-emerald-300")}>
                {isHi ? 'सपाट!' : 'LEVEL!'}
              </span>
            </div>
          )}

          {/* Bubble */}
          <div
            className={cn(
              "absolute w-9 h-9 rounded-full transition-transform duration-75 ease-out shadow-2xl border flex items-center justify-center z-20",
              theme === 'light'
                ? (displayLevel ? "bg-gradient-to-tr from-[#059669] via-[#10b981] to-[#34d399] border-white shadow-[0_0_25px_#10b981] scale-105" : "bg-gradient-to-tr from-[#059669] via-[#10b981] to-[#34d399] border-white shadow-[0_0_20px_rgba(16,185,129,0.8)]")
                : (displayLevel ? "bg-gradient-to-tr from-[#A7F3D0] via-[#34D399] to-[#059669] border-white/90 shadow-[0_0_25px_#10b981] scale-105" : "bg-gradient-to-tr from-[#C6F6D5] via-[#68D391] to-[#38A169] border-white/90 shadow-[0_0_20px_rgba(72,187,120,0.8)]")
            )}
            style={{ transform: `translate(${Math.max(-70, Math.min(70, -displayRoll * 4.5))}px, ${Math.max(-70, Math.min(70, -displayPitch * 4.5))}px)` }}
          >
            <div className="w-full h-full rounded-full liquid-shine flex items-center justify-center">
              <div className={cn("w-1 h-1 rounded-full shadow-sm", theme === 'light' ? "bg-white/80" : "bg-stone-900/60")} />
            </div>
          </div>

          {/* ── NEW: Live degree readout overlay on bullseye ── */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30">
            <span className={cn("px-1.5 py-0.5 rounded-md text-[8px] font-black font-mono border", theme === 'light' ? "bg-white/80 text-emerald-800 border-emerald-300" : "bg-black/50 text-emerald-300 border-emerald-500/40")}>
              P {displayPitch > 0 ? `+${displayPitch.toFixed(1)}°` : `${displayPitch.toFixed(1)}°`}
            </span>
            <span className={cn("px-1.5 py-0.5 rounded-md text-[8px] font-black font-mono border", theme === 'light' ? "bg-white/80 text-sky-800 border-sky-300" : "bg-black/50 text-sky-300 border-sky-500/40")}>
              R {displayRoll > 0 ? `+${displayRoll.toFixed(1)}°` : `${displayRoll.toFixed(1)}°`}
            </span>
          </div>
        </div>
      ) : (
        <div className={cn("w-full flex flex-col gap-2 my-1 p-2 rounded-xl border shadow-xl", theme === 'light' ? "bg-white border-stone-300" : "bg-stone-950/80 border-white/10")}>
          <div className="flex flex-col gap-1">
            <div className={cn("flex items-center justify-between text-[10px] font-bold px-0.5", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
              <span>{t.vialHorizontal}</span>
              <span className="font-mono text-emerald-400">{displayRoll > 0 ? `+${displayRoll.toFixed(1)}°` : `${displayRoll.toFixed(1)}°`}</span>
            </div>
            <div className="w-full h-9 rounded-xl bg-gradient-to-b from-[#111827] via-[#0F172A] to-[#020617] border border-stone-700 relative overflow-hidden flex items-center justify-center shadow-inner">
              <div className="absolute inset-y-0 left-1/4 w-[1px] bg-white/20" />
              <div className="absolute inset-y-0 right-1/4 w-[1px] bg-white/20" />
              <div className="absolute inset-y-0.5 left-1/2 w-6 -translate-x-1/2 border-x-2 border-amber-400/80 pointer-events-none" />
              <div className="absolute w-7 h-6 rounded-lg bg-gradient-to-tr from-lime-300 via-emerald-400 to-teal-400 border border-white/80 shadow-[0_0_15px_#10b981] transition-transform duration-75 ease-out flex items-center justify-center" style={{ transform: `translateX(${Math.max(-90, Math.min(90, -displayRoll * 6))}px)` }}>
                <div className="w-0.5 h-0.5 rounded-full bg-stone-900/50" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1 pt-0.5">
            <div className={cn("flex items-center justify-between text-[10px] font-bold px-0.5", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
              <span>{t.vialVertical}</span>
              <span className="font-mono text-sky-400">{displayPitch > 0 ? `+${displayPitch.toFixed(1)}°` : `${displayPitch.toFixed(1)}°`}</span>
            </div>
            <div className="w-full h-9 rounded-xl bg-gradient-to-b from-[#111827] via-[#0F172A] to-[#020617] border border-stone-700 relative overflow-hidden flex items-center justify-center shadow-inner">
              <div className="absolute inset-y-0 left-1/4 w-[1px] bg-white/20" />
              <div className="absolute inset-y-0 right-1/4 w-[1px] bg-white/20" />
              <div className="absolute inset-y-0.5 left-1/2 w-6 -translate-x-1/2 border-x-2 border-amber-400/80 pointer-events-none" />
              <div className="absolute w-7 h-6 rounded-lg bg-gradient-to-tr from-sky-300 via-cyan-400 to-blue-500 border border-white/80 shadow-[0_0_15px_#38bdf8] transition-transform duration-75 ease-out flex items-center justify-center" style={{ transform: `translateX(${Math.max(-90, Math.min(90, -displayPitch * 6))}px)` }}>
                <div className="w-0.5 h-0.5 rounded-full bg-stone-900/50" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact metrics grid — 2x2 */}
      <div className="w-full grid grid-cols-2 gap-1.5 my-0.5">
        <div className={cn("p-1.5 rounded-xl border flex flex-col items-center", theme === 'light' ? "bg-white border-stone-300" : "bg-stone-900/80 border-white/10")}>
          <span className={cn("text-[8px] font-bold uppercase tracking-wider", theme === 'light' ? "text-stone-600" : "text-stone-400")}>{t.pitchX}</span>
          <span className="text-sm font-black font-mono text-sky-400">{displayPitch > 0 ? `+${displayPitch.toFixed(1)}°` : `${displayPitch.toFixed(1)}°`}</span>
        </div>
        <div className={cn("p-1.5 rounded-xl border flex flex-col items-center", theme === 'light' ? "bg-white border-stone-300" : "bg-stone-900/80 border-white/10")}>
          <span className={cn("text-[8px] font-bold uppercase tracking-wider", theme === 'light' ? "text-stone-600" : "text-stone-400")}>{t.rollY}</span>
          <span className="text-sm font-black font-mono text-emerald-400">{displayRoll > 0 ? `+${displayRoll.toFixed(1)}°` : `${displayRoll.toFixed(1)}°`}</span>
        </div>
        <div className={cn("p-1.5 rounded-xl border flex flex-col items-center", theme === 'light' ? "bg-white border-stone-300" : "bg-stone-900/80 border-white/10")}>
          <span className={cn("text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5", theme === 'light' ? "text-stone-600" : "text-stone-400")}><TrendingUp className="w-2 h-2" />{isHi ? 'ढलान' : 'Slope'}</span>
          <span className="text-sm font-black font-mono text-amber-400">{displayTotal > 89 ? '999+' : (Math.tan((displayTotal * Math.PI) / 180) * 100).toFixed(1)}%</span>
        </div>
        <div className={cn("p-1.5 rounded-xl border flex flex-col items-center", theme === 'light' ? "bg-white border-stone-300" : "bg-stone-900/80 border-white/10")}>
          <span className={cn("text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5", theme === 'light' ? "text-stone-600" : "text-stone-400")}><Ruler className="w-2 h-2" />{isHi ? 'छत' : 'Roof'}</span>
          <span className="text-sm font-black font-mono text-orange-400">1:{displayTotal > 89 ? '999' : (Math.tan((displayTotal * Math.PI) / 180) * 12).toFixed(1)}</span>
        </div>
      </div>

      {/* ── NEW: Max/Min tilt + stability sparkline + copy ── */}
      <div className={cn("w-full rounded-xl p-2 border my-0.5", theme === 'light' ? "bg-white border-stone-300" : "bg-stone-900/80 border-white/10")}>
        <div className="flex items-center justify-between mb-1">
          <span className={cn("text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
            <TrendingUp className="w-2 h-2" />{t.maxTilt} / {t.minTilt}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleResetMaxMin}
              className={cn("text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border transition-all active:scale-95", theme === 'light' ? "bg-stone-100 border-stone-300 text-stone-600 hover:text-stone-900" : "bg-white/5 border-white/10 text-stone-400 hover:text-white")}
            >
              <RefreshCw className="w-2 h-2 inline mr-0.5" />{t.resetMaxMin}
            </button>
            <button
              onClick={handleCopy}
              className={cn("text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border transition-all active:scale-95", copied ? "bg-emerald-500 text-white border-emerald-400" : (theme === 'light' ? "bg-stone-100 border-stone-300 text-stone-600 hover:text-stone-900" : "bg-white/5 border-white/10 text-stone-400 hover:text-white"))}
            >
              {copied ? <Check className="w-2 h-2 inline mr-0.5" /> : <Copy className="w-2 h-2 inline mr-0.5" />}
              {copied ? (isHi ? 'कॉपी!' : 'Copied') : t.copyReading}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-black font-mono", theme === 'light' ? "text-red-600" : "text-red-400")}>{maxTilt.toFixed(1)}°</span>
          <span className={cn("text-[8px] font-bold", theme === 'light' ? "text-stone-500" : "text-stone-500")}>/</span>
          <span className={cn("text-sm font-black font-mono", theme === 'light' ? "text-emerald-600" : "text-emerald-400")}>{minTilt.toFixed(1)}°</span>
          {/* Stability sparkline */}
          <div className="flex-1 flex items-end gap-[2px] h-6 ml-1">
            {history.map((v, i) => (
              <div
                key={i}
                className={cn("w-[3px] rounded-sm transition-all duration-300", v < 1 ? "bg-emerald-400" : v < 3 ? "bg-amber-400" : "bg-red-400")}
                style={{ height: `${Math.max(8, Math.min(100, v * 12))}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Surface flatness indicator — compact */}
      <div className={cn("w-full rounded-xl p-2 border my-0.5", theme === 'light' ? "bg-white border-stone-300" : "bg-stone-900/80 border-white/10")}>
        <div className="flex items-center justify-between mb-1">
          <span className={cn("text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
            {isHi ? 'सतह की सपाटता' : 'Surface Flatness'}
          </span>
          <span className={cn("text-[9px] font-black", flatnessColor)}>{flatnessLabel}</span>
        </div>
        <div className={cn("w-full h-1.5 rounded-full overflow-hidden", theme === 'light' ? "bg-stone-200" : "bg-stone-800")}>
          <div
            className={cn("h-full rounded-full transition-all duration-500", flatnessScore >= 90 ? "bg-emerald-400" : flatnessScore >= 70 ? "bg-teal-400" : flatnessScore >= 40 ? "bg-amber-400" : "bg-red-400")}
            style={{ width: `${flatnessScore}%` }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className={cn("text-[7px] font-bold", theme === 'light' ? "text-stone-500" : "text-stone-500")}>{isHi ? 'अस्थिर' : 'Unstable'}</span>
          <span className={cn("text-[7px] font-bold", theme === 'light' ? "text-stone-500" : "text-stone-500")}>{isHi ? 'सपाट' : 'Flat'}</span>
        </div>
      </div>

      {/* ── Feature 8: Reading history log ── */}
      <div className={cn("w-full rounded-xl p-2 border my-0.5", theme === 'light' ? "bg-white border-stone-300" : "bg-stone-900/80 border-white/10")}>
        <div className="flex items-center justify-between mb-1">
          <span className={cn("text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
            <History className="w-2.5 h-2.5" />{isHi ? 'रीडिंग लॉग' : 'Reading Log'} ({readings.length})
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleLogReading}
              className={cn("text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border flex items-center gap-0.5 transition-all active:scale-95", theme === 'light' ? "bg-stone-100 border-stone-300 text-stone-600 hover:text-stone-900" : "bg-white/5 border-white/10 text-stone-400 hover:text-white")}
            >
              <Plus className="w-2 h-2" />{isHi ? 'लॉग' : 'Log'}
            </button>
            {readings.length > 0 && (
              <button
                onClick={handleClearReadings}
                className={cn("text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border flex items-center gap-0.5 transition-all active:scale-95", theme === 'light' ? "bg-stone-100 border-stone-300 text-stone-600 hover:text-stone-900" : "bg-white/5 border-white/10 text-stone-400 hover:text-white")}
              >
                <Trash2 className="w-2 h-2" />{isHi ? 'साफ़' : 'Clear'}
              </button>
            )}
          </div>
        </div>
        {readings.length > 0 ? (
          <div className="flex flex-col gap-0.5 max-h-24 overflow-y-auto">
            {readings.map((r) => (
              <div key={r.id} className={cn("flex items-center justify-between text-[8px] font-mono px-1.5 py-0.5 rounded-md", theme === 'light' ? "bg-stone-100" : "bg-white/5")}>
                <span className={theme === 'light' ? "text-stone-500" : "text-stone-500"}>{r.time}</span>
                <span className={theme === 'light' ? "text-stone-700" : "text-stone-300"}>P {r.pitch.toFixed(1)}° R {r.roll.toFixed(1)}°</span>
                <span className={r.total < 1 ? "text-emerald-400 font-black" : "text-amber-400 font-black"}>{r.total.toFixed(1)}°</span>
              </div>
            ))}
          </div>
        ) : (
          <p className={cn("text-[8px] font-bold text-center py-1", theme === 'light' ? "text-stone-400" : "text-stone-500")}>
            {isHi ? 'कोई रीडिंग नहीं — + लॉग दबाएं' : 'No readings yet — tap + Log'}
          </p>
        )}
      </div>

      {/* Figure-8 calibration — compact */}
      <div className={cn(
        "w-full rounded-xl p-2 border mt-0.5 text-center",
        theme === 'light' ? "border-amber-500/40 bg-gradient-to-b from-[#FEF3C7] to-[#FDE68A]" : "border-amber-500/30 bg-gradient-to-b from-[#211707] to-[#100b03]"
      )}>
        <div className={cn("text-[9px] font-black uppercase tracking-[0.20em]", theme === 'light' ? "text-amber-800" : "text-amber-300")}>Figure-8 Calibration</div>
        <p className={cn("mt-0.5 text-[9px] leading-snug", theme === 'light' ? "text-amber-900" : "text-stone-300")}>
          {isLevel
            ? (isHi ? 'स्तर लॉक प्राप्त। सतह माउंटिंग, फ्रेमिंग, वास्तु फ्लोर-प्लान, या कैमरा ऑडिट के लिए तैयार।' : 'Level lock achieved. Surface is ready for mounting, framing, vastu floor-plan, or camera audits.')
            : (isHi ? 'उपकरण को 8 में घुमाएं, रेफरेंस प्लेन पर टेयर सेट करें, फिर बबल केंद्र तक सपाट करें।' : 'Move device in a figure-8, set tare on reference plane, then flatten until bubble centers.')}
        </p>
      </div>
    </div>
  );
};
