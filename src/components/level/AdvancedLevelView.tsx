import React, { useState } from 'react';
import { Target, Layers, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
  const t = translations[language];

  const [subMode, setSubMode] = useState<'bullseye' | 'vials'>('bullseye');

  const effPitch = pitch - (tareOffset?.pitch || 0);
  const effRoll = roll - (tareOffset?.roll || 0);
  const totalTilt = Math.sqrt(effPitch * effPitch + effRoll * effRoll);

  const isLevel = totalTilt < 1.0;
  const isHighTilt = totalTilt >= 3.0;

  // Calculate slope percentage: tan(deg) * 100
  const slopePercent = totalTilt > 89 ? '999+' : (Math.tan((totalTilt * Math.PI) / 180) * 100).toFixed(1);

  // Calculate roof ratio in X:12 format
  const roofRatio = totalTilt > 89 ? '999' : (Math.tan((totalTilt * Math.PI) / 180) * 12).toFixed(1);

  return (
    <div className="w-full max-w-sm flex flex-col items-center animate-in fade-in zoom-in-95">
      {/* Level Sub-Navigation Toolbar */}
      <div className="w-full flex items-center justify-between gap-1.5 p-1 rounded-2xl bg-stone-900/90 border border-white/10 mb-3 shadow-inner">
        <button
          onClick={() => {
            setSubMode('bullseye');
            triggerHaptic();
          }}
          className={cn(
            "flex-1 py-1.5 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5",
            subMode === 'bullseye'
              ? "bg-[#F59E0B] text-stone-950 shadow-md font-black scale-100"
              : "text-stone-400 hover:text-white"
          )}
        >
          <Target className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{t.subLevelBullseye}</span>
        </button>

        <button
          onClick={() => {
            setSubMode('vials');
            triggerHaptic();
          }}
          className={cn(
            "flex-1 py-1.5 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5",
            subMode === 'vials'
              ? "bg-[#F59E0B] text-stone-950 shadow-md font-black scale-100"
              : "text-stone-400 hover:text-white"
          )}
        >
          <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{t.subLevelDualVials}</span>
        </button>

        <button
          onClick={() => {
            onToggleTare();
            triggerHaptic();
          }}
          className={cn(
            "py-1.5 px-2.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all border flex items-center justify-center gap-1 active:scale-95",
            tareOffset
              ? "bg-amber-500/25 text-amber-300 border-amber-500/50"
              : "bg-white/5 text-stone-300 border-white/10 hover:text-white"
          )}
        >
          <RotateCcw className="w-3 h-3" />
          <span>{t.tareZero}</span>
        </button>
      </div>

      {subMode === 'bullseye' ? (
        /* 2D Bullseye Spirit Level Circular Gauge */
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full flex items-center justify-center border-[14px] sm:border-[18px] border-[#1C1F26] shadow-[0_20px_50px_rgba(0,0,0,0.95),inset_0_4px_10px_rgba(0,0,0,0.9)] bg-gradient-to-tr from-[#12161E] via-[#0E1117] to-[#0A0D12] overflow-hidden my-1">
          {/* Outer Ring Ticks */}
          <div className="absolute inset-4 rounded-full border border-white/15 pointer-events-none" />
          <div className="absolute inset-10 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute inset-16 rounded-full border border-dashed border-white/15 pointer-events-none" />
          <div className="absolute inset-24 rounded-full border border-white/20 pointer-events-none" />

          {/* Crosshairs */}
          <div className="absolute inset-x-0 top-1/2 h-[0.5px] bg-white/25 pointer-events-none" />
          <div className="absolute inset-y-0 left-1/2 w-[0.5px] bg-white/25 pointer-events-none" />

          {/* Central Target Circle (Gold normally, radiant emerald when level) */}
          <div className={cn(
            "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 pointer-events-none z-10",
            isLevel
              ? "border-emerald-400 bg-emerald-500/20 shadow-[0_0_25px_#10b981]"
              : "border-amber-400/80 bg-amber-400/5 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full transition-colors",
              isLevel ? "bg-emerald-400 shadow-[0_0_10px_#10b981]" : "bg-amber-400/60"
            )} />
          </div>

          {/* Floating Glowing Spirit Bubble with Center Dot */}
          <div
            className={cn(
              "absolute w-12 h-12 rounded-full transition-transform duration-75 ease-out shadow-2xl border border-white/90 flex items-center justify-center z-20",
              isLevel
                ? "bg-gradient-to-tr from-[#A7F3D0] via-[#34D399] to-[#059669] shadow-[0_0_25px_#10b981] scale-105"
                : "bg-gradient-to-tr from-[#C6F6D5] via-[#68D391] to-[#38A169] shadow-[0_0_20px_rgba(72,187,120,0.8)]"
            )}
            style={{
              transform: `translate(${Math.max(-88, Math.min(88, -effRoll * 5.5))}px, ${Math.max(-88, Math.min(88, -effPitch * 5.5))}px)`
            }}
          >
            {/* Liquid Highlight */}
            <div className="w-full h-full rounded-full liquid-shine flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-stone-900/60 shadow-sm" />
            </div>
          </div>
        </div>
      ) : (
        /* Dual Tubular Vials Mode */
        <div className="w-full flex flex-col gap-3 my-2 p-3 rounded-2xl bg-stone-950/80 border border-white/10 shadow-xl">
          {/* 1. Horizontal Vial (Roll) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-400 px-1">
              <span>{t.vialHorizontal}</span>
              <span className="font-mono text-emerald-400">{effRoll > 0 ? `+${effRoll.toFixed(1)}°` : `${effRoll.toFixed(1)}°`}</span>
            </div>

            <div className="w-full h-12 rounded-2xl bg-gradient-to-b from-[#111827] via-[#0F172A] to-[#020617] border-2 border-stone-700 relative overflow-hidden flex items-center justify-center shadow-inner">
              {/* Reference Grid lines */}
              <div className="absolute inset-y-0 left-1/4 w-[1px] bg-white/20" />
              <div className="absolute inset-y-0 right-1/4 w-[1px] bg-white/20" />
              <div className="absolute inset-y-1 left-1/2 w-8 -translate-x-1/2 border-x-2 border-amber-400/80 pointer-events-none" />

              {/* Liquid Bubble */}
              <div
                className="absolute w-9 h-8 rounded-xl bg-gradient-to-tr from-lime-300 via-emerald-400 to-teal-400 border border-white/80 shadow-[0_0_15px_#10b981] transition-transform duration-75 ease-out flex items-center justify-center"
                style={{
                  transform: `translateX(${Math.max(-110, Math.min(110, -effRoll * 7))}px)`
                }}
              >
                <div className="w-1 h-1 rounded-full bg-stone-900/50" />
              </div>
            </div>
          </div>

          {/* 2. Vertical Vial (Pitch) */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-400 px-1">
              <span>{t.vialVertical}</span>
              <span className="font-mono text-sky-400">{effPitch > 0 ? `+${effPitch.toFixed(1)}°` : `${effPitch.toFixed(1)}°`}</span>
            </div>

            <div className="w-full h-12 rounded-2xl bg-gradient-to-b from-[#111827] via-[#0F172A] to-[#020617] border-2 border-stone-700 relative overflow-hidden flex items-center justify-center shadow-inner">
              {/* Reference Grid lines */}
              <div className="absolute inset-y-0 left-1/4 w-[1px] bg-white/20" />
              <div className="absolute inset-y-0 right-1/4 w-[1px] bg-white/20" />
              <div className="absolute inset-y-1 left-1/2 w-8 -translate-x-1/2 border-x-2 border-amber-400/80 pointer-events-none" />

              {/* Liquid Bubble */}
              <div
                className="absolute w-9 h-8 rounded-xl bg-gradient-to-tr from-sky-300 via-cyan-400 to-blue-500 border border-white/80 shadow-[0_0_15px_#38bdf8] transition-transform duration-75 ease-out flex items-center justify-center"
                style={{
                  transform: `translateX(${Math.max(-110, Math.min(110, -effPitch * 7))}px)`
                }}
              >
                <div className="w-1 h-1 rounded-full bg-stone-900/50" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tilt Status Banner Card */}
      <div className={cn(
        "w-full rounded-2xl p-3 border mt-3 mb-2 flex items-center justify-between transition-all duration-300 shadow-md",
        isLevel
          ? "bg-[#021D12]/90 border-emerald-500/40 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          : isHighTilt
          ? "bg-[#250B0E]/90 border-red-500/40 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          : "bg-[#231707]/90 border-amber-500/40 text-amber-300"
      )}>
        <div className="flex items-center gap-2.5">
          {isLevel ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className={cn("w-5 h-5 shrink-0", isHighTilt ? "text-red-400 animate-pulse" : "text-amber-400")} />
          )}
          <div className="flex flex-col text-left leading-tight">
            <span className="text-xs font-black tracking-wide uppercase">
              {isLevel ? t.perfectLevelText : isHighTilt ? t.highTilt : t.tilt}
            </span>
            <span className="text-[10px] text-stone-400 font-bold mt-0.5">
              {t.totalTilt}: {totalTilt.toFixed(1)}°
            </span>
          </div>
        </div>

        <span className={cn(
          "font-mono text-xl font-black tracking-tight",
          isLevel ? "text-emerald-400" : isHighTilt ? "text-red-400" : "text-amber-400"
        )}>
          {totalTilt.toFixed(1)}°
        </span>
      </div>

      {/* 2x2 Telemetry Metric Cards */}
      <div className="w-full grid grid-cols-2 gap-2.5 my-1">
        {/* Pitch (X-Axis) */}
        <div className="p-3 rounded-2xl bg-stone-900/80 border border-white/10 flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">
            {t.pitchX}
          </span>
          <span className="text-lg font-black font-mono text-sky-400 mt-1">
            {effPitch > 0 ? `+${effPitch.toFixed(1)}°` : `${effPitch.toFixed(1)}°`}
          </span>
        </div>

        {/* Roll (Y-Axis) */}
        <div className="p-3 rounded-2xl bg-stone-900/80 border border-white/10 flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">
            {t.rollY}
          </span>
          <span className="text-lg font-black font-mono text-emerald-400 mt-1">
            {effRoll > 0 ? `+${effRoll.toFixed(1)}°` : `${effRoll.toFixed(1)}°`}
          </span>
        </div>

        {/* Slope (%) */}
        <div className="p-3 rounded-2xl bg-stone-900/80 border border-white/10 flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">
            {t.slopePercent}
          </span>
          <span className="text-lg font-black font-mono text-yellow-400 mt-1">
            {slopePercent}%
          </span>
        </div>

        {/* Roof Ratio */}
        <div className="p-3 rounded-2xl bg-stone-900/80 border border-white/10 flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">
            {t.roofRatio}
          </span>
          <span className="text-lg font-black font-mono text-cyan-400 mt-1">
            {roofRatio} : 12
          </span>
        </div>
      </div>
    </div>
  );
};
