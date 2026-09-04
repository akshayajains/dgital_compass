import React, { useState, useEffect, useRef } from 'react';
import { Target, Layers, RotateCcw, AlertTriangle, CheckCircle2, Lock, Unlock, TrendingUp, Ruler } from 'lucide-react';
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
}

export const AdvancedLevelView: React.FC<Props> = ({
  pitch,
  roll,
  tareOffset,
  onToggleTare,
  triggerHaptic
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

  const effPitch = pitch - (tareOffset?.pitch || 0);
  const effRoll = roll - (tareOffset?.roll || 0);
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
    // Lower variance = flatter surface. Score 0–100
    const score = Math.max(0, Math.min(100, Math.round(100 - stdDev * 20)));
    setFlatnessScore(score);
  }, [totalTilt]);

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

  const displayPitch = isLocked ? lockedPitch : effPitch;
  const displayRoll = isLocked ? lockedRoll : effRoll;
  const displayTotal = isLocked ? lockedTotal : totalTilt;
  const displayLevel = isLocked ? lockedTotal < 1.0 : isLevel;
  const displayHigh = isLocked ? lockedTotal >= 3.0 : isHighTilt;

  const flatnessLabel = flatnessScore >= 90 ? (isHi ? 'बहुत सपाट' : 'Very Flat')
    : flatnessScore >= 70 ? (isHi ? 'सपाट' : 'Flat')
    : flatnessScore >= 40 ? (isHi ? 'थोड़ा टेढ़ा' : 'Uneven')
    : (isHi ? 'बहुत टेढ़ा' : 'Very Uneven');
  const flatnessColor = flatnessScore >= 90 ? 'text-emerald-400' : flatnessScore >= 70 ? 'text-teal-400' : flatnessScore >= 40 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="w-full max-w-sm flex flex-col items-center rounded-[24px] border border-emerald-500/15 bg-[radial-gradient(circle_at_50%_35%,rgba(16,185,129,0.13),transparent_35%),linear-gradient(180deg,#07130e_0%,#030705_100%)] p-2.5 shadow-[0_20px_45px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in-95">
      {/* Header row — compact */}
      <div className="mb-1.5 flex w-full items-center justify-between px-1">
        <span className="text-[9px] font-black uppercase tracking-[0.22em] text-emerald-300">Precision Spirit Level</span>
        <div className="flex items-center gap-1.5">
          <button onClick={handleLock} className={cn(
            "rounded-full border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 transition-all active:scale-95",
            isLocked ? "border-amber-400/50 bg-amber-400/10 text-amber-300" : "border-white/10 bg-white/5 text-stone-400 hover:text-white"
          )}>
            {isLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
            {isLocked ? (isHi ? 'लॉक' : 'Lock') : (isHi ? 'अनलॉक' : 'Open')}
          </button>
          <span className={cn("rounded-full border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider", displayLevel ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300" : "border-amber-400/40 bg-amber-400/10 text-amber-300")}>
            {displayLevel ? (isHi ? 'सपाट' : 'Flat') : (isHi ? 'खोज' : 'Searching')}
          </span>
        </div>
      </div>

      {/* Sub-mode + Tare — compact pill buttons */}
      <div className="w-full flex items-center justify-between gap-1 p-0.5 rounded-xl bg-stone-900/90 border border-white/10 mb-1.5">
        <button
          onClick={() => { setSubMode('bullseye'); triggerHaptic(); }}
          className={cn(
            "flex-1 py-1 px-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1",
            subMode === 'bullseye' ? "bg-[#F59E0B] text-stone-950 shadow-md scale-100" : "text-stone-400 hover:text-white"
          )}
        >
          <Target className="w-3 h-3 stroke-[2.5]" />
          <span>{t.subLevelBullseye}</span>
        </button>
        <button
          onClick={() => { setSubMode('vials'); triggerHaptic(); }}
          className={cn(
            "flex-1 py-1 px-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1",
            subMode === 'vials' ? "bg-[#F59E0B] text-stone-950 shadow-md scale-100" : "text-stone-400 hover:text-white"
          )}
        >
          <Layers className="w-3 h-3 stroke-[2.5]" />
          <span>{t.subLevelDualVials}</span>
        </button>
        <button
          onClick={() => { onToggleTare(); triggerHaptic(); }}
          className={cn(
            "py-1 px-2 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all border flex items-center justify-center gap-0.5 active:scale-95",
            tareOffset ? "bg-amber-500/25 text-amber-300 border-amber-500/50" : "bg-white/5 text-stone-300 border-white/10 hover:text-white"
          )}
        >
          <RotateCcw className="w-2.5 h-2.5" />
          <span>{t.tareZero}</span>
        </button>
      </div>

      {/* Main visualization */}
      {subMode === 'bullseye' ? (
        <div className="relative w-52 h-52 sm:w-60 sm:h-60 rounded-full flex items-center justify-center border border-emerald-400 shadow-[0_0_34px_rgba(16,185,129,0.32),inset_0_0_30px_rgba(16,185,129,0.18)] bg-[radial-gradient(circle_at_center,#123f31_0%,#071e16_55%,#020806_100%)] overflow-hidden my-0.5">
          <div className="absolute inset-2.5 rounded-full border border-emerald-300/25 pointer-events-none" />
          <div className="absolute inset-8 rounded-full border border-emerald-300/20 pointer-events-none" />
          <div className="absolute inset-14 rounded-full border border-dashed border-emerald-300/25 pointer-events-none" />
          <div className="absolute inset-20 rounded-full border border-emerald-300/30 pointer-events-none" />
          <div className="absolute inset-x-0 top-1/2 h-px bg-emerald-200/25 pointer-events-none" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-emerald-200/25 pointer-events-none" />

          <div className={cn("w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 pointer-events-none z-10", displayLevel ? "border-emerald-400 bg-emerald-500/20 shadow-[0_0_25px_#10b981]" : "border-amber-400/80 bg-amber-400/5 shadow-[0_0_12px_rgba(245,158,11,0.3)]")}>
            <div className={cn("w-1.5 h-1.5 rounded-full transition-colors", displayLevel ? "bg-emerald-400 shadow-[0_0_10px_#10b981]" : "bg-amber-400/60")} />
          </div>

          <div
            className={cn(
              "absolute w-9 h-9 rounded-full transition-transform duration-75 ease-out shadow-2xl border border-white/90 flex items-center justify-center z-20",
              displayLevel ? "bg-gradient-to-tr from-[#A7F3D0] via-[#34D399] to-[#059669] shadow-[0_0_25px_#10b981] scale-105" : "bg-gradient-to-tr from-[#C6F6D5] via-[#68D391] to-[#38A169] shadow-[0_0_20px_rgba(72,187,120,0.8)]"
            )}
            style={{ transform: `translate(${Math.max(-70, Math.min(70, -displayRoll * 4.5))}px, ${Math.max(-70, Math.min(70, -displayPitch * 4.5))}px)` }}
          >
            <div className="w-full h-full rounded-full liquid-shine flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-stone-900/60 shadow-sm" />
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-2 my-1 p-2 rounded-xl bg-stone-950/80 border border-white/10 shadow-xl">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 px-0.5">
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
            <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 px-0.5">
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

      {/* Main tilt readout — compact */}
      <div className={cn("w-full rounded-xl p-2 border mb-1 flex items-center justify-between transition-all duration-300 shadow-md", displayLevel ? "bg-[#021D12]/90 border-emerald-500/40 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : displayHigh ? "bg-[#250B0E]/90 border-red-500/40 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.2)]" : "bg-[#231707]/90 border-amber-500/40 text-amber-300")}>
        <div className="flex items-center gap-1.5">
          {displayLevel ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <AlertTriangle className={cn("w-3.5 h-3.5 shrink-0", displayHigh ? "text-red-400 animate-pulse" : "text-amber-400")} />}
          <div className="flex flex-col text-left leading-tight">
            <span className="text-[10px] font-black tracking-wide uppercase">{displayLevel ? t.perfectLevelText : displayHigh ? t.highTilt : t.tilt}</span>
            <span className="text-[8px] text-stone-400 font-bold">{t.totalTilt}: {displayTotal.toFixed(1)}°</span>
          </div>
        </div>
        <span className={cn("font-mono text-2xl font-black tracking-tight", displayLevel ? "text-emerald-400" : displayHigh ? "text-red-400" : "text-amber-400")}>{displayTotal.toFixed(1)}°</span>
      </div>

      {/* Compact metrics grid — 2x2 */}
      <div className="w-full grid grid-cols-2 gap-1.5 my-0.5">
        <div className="p-1.5 rounded-xl bg-stone-900/80 border border-white/10 flex flex-col items-center">
          <span className="text-[8px] font-bold uppercase text-stone-400 tracking-wider">{t.pitchX}</span>
          <span className="text-sm font-black font-mono text-sky-400">{displayPitch > 0 ? `+${displayPitch.toFixed(1)}°` : `${displayPitch.toFixed(1)}°`}</span>
        </div>
        <div className="p-1.5 rounded-xl bg-stone-900/80 border border-white/10 flex flex-col items-center">
          <span className="text-[8px] font-bold uppercase text-stone-400 tracking-wider">{t.rollY}</span>
          <span className="text-sm font-black font-mono text-emerald-400">{displayRoll > 0 ? `+${displayRoll.toFixed(1)}°` : `${displayRoll.toFixed(1)}°`}</span>
        </div>
        <div className="p-1.5 rounded-xl bg-stone-900/80 border border-white/10 flex flex-col items-center">
          <span className="text-[8px] font-bold uppercase text-stone-400 tracking-wider flex items-center gap-0.5"><TrendingUp className="w-2 h-2" />{isHi ? 'ढलान' : 'Slope'}</span>
          <span className="text-sm font-black font-mono text-amber-400">{displayTotal > 89 ? '999+' : (Math.tan((displayTotal * Math.PI) / 180) * 100).toFixed(1)}%</span>
        </div>
        <div className="p-1.5 rounded-xl bg-stone-900/80 border border-white/10 flex flex-col items-center">
          <span className="text-[8px] font-bold uppercase text-stone-400 tracking-wider flex items-center gap-0.5"><Ruler className="w-2 h-2" />{isHi ? 'छत' : 'Roof'}</span>
          <span className="text-sm font-black font-mono text-orange-400">1:{displayTotal > 89 ? '999' : (Math.tan((displayTotal * Math.PI) / 180) * 12).toFixed(1)}</span>
        </div>
      </div>

      {/* Surface flatness indicator — compact */}
      <div className="w-full rounded-xl p-2 border border-white/10 bg-stone-900/80 my-0.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] font-black uppercase tracking-wider text-stone-400 flex items-center gap-0.5">
            {isHi ? 'सतह की सपाटता' : 'Surface Flatness'}
          </span>
          <span className={cn("text-[9px] font-black", flatnessColor)}>{flatnessLabel}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-stone-800 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", flatnessScore >= 90 ? "bg-emerald-400" : flatnessScore >= 70 ? "bg-teal-400" : flatnessScore >= 40 ? "bg-amber-400" : "bg-red-400")}
            style={{ width: `${flatnessScore}%` }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[7px] text-stone-500 font-bold">{isHi ? 'अस्थिर' : 'Unstable'}</span>
          <span className="text-[7px] text-stone-500 font-bold">{isHi ? 'सपाट' : 'Flat'}</span>
        </div>
      </div>

      {/* Figure-8 calibration — compact */}
      <div className="w-full rounded-xl p-2 border border-amber-500/30 bg-gradient-to-b from-[#211707] to-[#100b03] mt-0.5 text-center">
        <div className="text-[9px] font-black uppercase tracking-[0.20em] text-amber-300">Figure-8 Calibration</div>
        <p className="mt-0.5 text-[9px] leading-snug text-stone-300">
          {isLevel
            ? (isHi ? 'स्तर लॉक प्राप्त। सतह माउंटिंग, फ्रेमिंग, वास्तु फ्लोर-प्लान, या कैमरा ऑडिट के लिए तैयार।' : 'Level lock achieved. Surface is ready for mounting, framing, vastu floor-plan, or camera audits.')
            : (isHi ? 'उपकरण को 8 में घुमाएं, रेफरेंस प्लेन पर टेयर सेट करें, फिर बबल केंद्र तक सपाट करें।' : 'Move device in a figure-8, set tare on reference plane, then flatten until bubble centers.')}
        </p>
      </div>
    </div>
  );
};
