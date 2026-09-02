import React, { useMemo } from 'react';
import { CompassStyleId, Language } from '@/types/compass';
import { Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  styleId: CompassStyleId;
  language: Language;
  displayHeading: number | null;
  pitch: number;
  roll: number;
  sunPos: number | null;
  isQiblaMode: boolean;
  qiblaBearing: number;
  qiblaDistanceKm: number;
  isFacingQibla: boolean;
  vastuGridEnabled: boolean;
  isLevel: boolean;
  dialRef: React.RefObject<HTMLDivElement>;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}

export const CompassDialRenderer: React.FC<Props> = ({
  styleId,
  language,
  displayHeading,
  pitch,
  roll,
  sunPos,
  isQiblaMode,
  qiblaBearing,
  qiblaDistanceKm,
  isFacingQibla,
  vastuGridEnabled,
  isLevel,
  dialRef,
  onPointerDown,
  onPointerMove,
  onPointerUp
}) => {
  const isHi = language === 'hi';

  const cardinalPoints = useMemo(() => {
    if (isHi) {
      return [
        { label: 'उत्तर', deg: 0, isNorth: true, code: 'N' },
        { label: 'ईशान', deg: 45, isNorth: false, code: 'NE' },
        { label: 'पूर्व', deg: 90, isNorth: false, code: 'E' },
        { label: 'आग्नेय', deg: 135, isNorth: false, code: 'SE' },
        { label: 'दक्षिण', deg: 180, isNorth: false, code: 'S' },
        { label: 'नैऋत्य', deg: 225, isNorth: false, code: 'SW' },
        { label: 'पश्चिम', deg: 270, isNorth: false, code: 'W' },
        { label: 'वायव्य', deg: 315, isNorth: false, code: 'NW' }
      ];
    }
    return [
      { label: 'N', deg: 0, isNorth: true, code: 'N' },
      { label: 'NE', deg: 45, isNorth: false, code: 'NE' },
      { label: 'E', deg: 90, isNorth: false, code: 'E' },
      { label: 'SE', deg: 135, isNorth: false, code: 'SE' },
      { label: 'S', deg: 180, isNorth: false, code: 'S' },
      { label: 'SW', deg: 225, isNorth: false, code: 'SW' },
      { label: 'W', deg: 270, isNorth: false, code: 'W' },
      { label: 'NW', deg: 315, isNorth: false, code: 'NW' }
    ];
  }, [isHi]);

  // Outer bezel styling classes
  const getBezelClass = () => {
    switch (styleId) {
      case 'royal_gold':
        return 'border-[18px] sm:border-[22px] border-[#382613] shadow-[0_20px_60px_rgba(0,0,0,0.95),inset_0_4px_8px_rgba(245,158,11,0.5),inset_0_-8px_16px_rgba(0,0,0,0.95)] bg-gradient-to-tr from-[#25180A] via-[#4A3419] to-[#1C1004]';
      case 'cyberpunk':
        return 'border-[14px] sm:border-[18px] border-[#0F172A] shadow-[0_0_40px_rgba(0,240,255,0.4),inset_0_0_20px_rgba(0,240,255,0.3)] bg-gradient-to-tr from-[#020617] via-[#0b1329] to-[#020617]';
      case 'nautical':
        return 'border-[20px] sm:border-[24px] border-[#C29B70] shadow-[0_15px_45px_rgba(78,53,36,0.7),inset_0_3px_6px_rgba(255,255,255,0.7),inset_0_-6px_12px_rgba(78,53,36,0.9)] bg-gradient-to-br from-[#E6D2BA] via-[#C9A67E] to-[#8C6239]';
      case 'minimal_onyx':
        return 'border-[16px] sm:border-[20px] border-[#1E1E24] shadow-[0_25px_60px_rgba(0,0,0,0.98),inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-5px_12px_rgba(0,0,0,0.95)] bg-[#0C0C0E]';
      case 'emerald_aurora':
        return 'border-[16px] sm:border-[20px] border-[#042817] shadow-[0_0_45px_rgba(16,185,129,0.35),inset_0_0_15px_rgba(16,185,129,0.3)] bg-gradient-to-tr from-[#02180E] via-[#08331E] to-[#02180E]';
      case 'vedic_mandala':
        return 'border-[18px] sm:border-[22px] border-[#3B1705] shadow-[0_20px_50px_rgba(0,0,0,0.95),inset_0_3px_8px_rgba(245,158,11,0.6)] bg-gradient-to-tr from-[#311102] via-[#5C2307] to-[#240A00]';
      case 'tactical_ops':
        return 'border-[16px] sm:border-[20px] border-[#1C261D] shadow-[0_20px_50px_rgba(0,0,0,0.95),inset_0_0_15px_rgba(34,197,94,0.2)] bg-gradient-to-tr from-[#121A13] via-[#233125] to-[#0D140E]';
      case 'cosmic_galaxy':
        return 'border-[16px] sm:border-[20px] border-[#1E1238] shadow-[0_0_45px_rgba(129,140,248,0.35),inset_0_0_20px_rgba(192,132,252,0.2)] bg-gradient-to-tr from-[#0A0517] via-[#1A0C38] to-[#070312]';
      case 'rose_gold':
        return 'border-[18px] sm:border-[22px] border-[#5E2B35] shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_3px_6px_rgba(251,113,133,0.5),inset_0_-6px_14px_rgba(0,0,0,0.9)] bg-gradient-to-tr from-[#38151D] via-[#632936] to-[#260C12]';
      case 'steampunk':
        return 'border-[20px] sm:border-[24px] border-[#4A250B] shadow-[0_20px_60px_rgba(0,0,0,0.95),inset_0_3px_6px_rgba(249,115,22,0.5)] bg-gradient-to-tr from-[#261003] via-[#52290E] to-[#1C0A02]';
      case 'crystal_glass':
        return 'border-[16px] sm:border-[20px] border-sky-900/60 shadow-[0_0_40px_rgba(56,189,248,0.25),inset_0_0_20px_rgba(255,255,255,0.2)] bg-gradient-to-tr from-slate-900/90 via-sky-950/80 to-slate-900/90 backdrop-blur-xl';
      case 'sunset_aura':
        return 'border-[16px] sm:border-[20px] border-[#4A102A] shadow-[0_0_45px_rgba(251,146,60,0.3),inset_0_0_20px_rgba(225,29,72,0.3)] bg-gradient-to-tr from-[#2A0516] via-[#541232] to-[#1C020E]';
      default:
        return 'border-[16px] sm:border-[20px] border-stone-800 bg-stone-950';
    }
  };

  // Dial face background
  const getDialFaceBg = () => {
    switch (styleId) {
      case 'royal_gold':
        return 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#241A10] via-[#150F09] to-[#0A0704]';
      case 'cyberpunk':
        return 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#081226] via-[#040914] to-[#010308]';
      case 'nautical':
        return 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#F5EADB] via-[#E5D2B8] to-[#CBB08E]';
      case 'minimal_onyx':
        return 'bg-[#080809]';
      case 'emerald_aurora':
        return 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#032314] via-[#01140B] to-[#000804]';
      case 'vedic_mandala':
        return 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#3A1402] via-[#200A01] to-[#0F0400]';
      case 'tactical_ops':
        return 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#141C15] via-[#0B110C] to-[#050805]';
      case 'cosmic_galaxy':
        return 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#190F36] via-[#0E0720] to-[#05020D]';
      case 'rose_gold':
        return 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2D161C] via-[#1A0A0E] to-[#0B0305]';
      case 'steampunk':
        return 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2E1504] via-[#170A01] to-[#0A0300]';
      case 'crystal_glass':
        return 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/90 via-slate-950/95 to-black';
      case 'sunset_aura':
        return 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#380E24] via-[#1E0513] to-[#0A0106]';
      default:
        return 'bg-[#0A0A0A]';
    }
  };

  return (
    <div className="relative my-2 flex flex-col items-center justify-center">
      {/* Top Fixed Heading Indicator Pip */}
      <div className="absolute -top-3 z-30 flex flex-col items-center pointer-events-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
        <div className={cn(
          "w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[14px]",
          styleId === 'cyberpunk' ? "border-t-[#00F0FF] drop-shadow-[0_0_8px_#00F0FF]" :
          styleId === 'emerald_aurora' ? "border-t-[#34D399] drop-shadow-[0_0_8px_#34D399]" :
          styleId === 'tactical_ops' ? "border-t-[#F97316] drop-shadow-[0_0_8px_#F97316]" :
          styleId === 'cosmic_galaxy' ? "border-t-[#C084FC] drop-shadow-[0_0_8px_#C084FC]" :
          "border-t-[#EF4444]"
        )} />
      </div>

      {/* Rotating Dial Container */}
      <div
        ref={dialRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={cn(
          "w-[21.5rem] h-[21.5rem] sm:w-[23.5rem] sm:h-[23.5rem] rounded-full flex items-center justify-center relative transition-transform duration-75 ease-out select-none cursor-grab active:cursor-grabbing touch-none",
          getBezelClass()
        )}
        style={{
          transform: `rotate(${displayHeading !== null ? -displayHeading : 0}deg)`,
          willChange: 'transform'
        }}
      >
        <div className={cn(
          "absolute inset-0 rounded-full overflow-hidden flex items-center justify-center",
          getDialFaceBg()
        )}>
          
          {/* Background Decorative Rings / Graphics */}
          {styleId === 'royal_gold' && (
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

          {styleId === 'cyberpunk' && (
            <>
              <div className="absolute inset-3 rounded-full border border-cyan-400/40 pointer-events-none shadow-[0_0_20px_rgba(0,240,255,0.2)]" />
              <div className="absolute inset-10 rounded-full border border-dashed border-magenta-500/30 pointer-events-none" />
              <div className="absolute inset-20 rounded-full border border-cyan-400/20 pointer-events-none" />
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="35" fill="none" stroke="#00F0FF" strokeWidth="0.5" strokeDasharray="4 2" />
                <line x1="100" y1="10" x2="100" y2="190" stroke="#FF0055" strokeWidth="0.4" strokeDasharray="5 5" />
                <line x1="10" y1="100" x2="190" y2="100" stroke="#00F0FF" strokeWidth="0.4" strokeDasharray="5 5" />
                <rect x="70" y="70" width="60" height="60" fill="none" stroke="#00F0FF" strokeWidth="0.4" strokeDasharray="2 2" />
              </svg>
            </>
          )}

          {styleId === 'vedic_mandala' && (
            <>
              <div className="absolute inset-3 rounded-full border border-amber-500/40 pointer-events-none shadow-[0_0_20px_rgba(245,158,11,0.25)]" />
              <div className="absolute inset-8 rounded-full border border-red-500/30 pointer-events-none" />
              <div className="absolute inset-16 rounded-full border border-dashed border-amber-400/25 pointer-events-none" />
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 200 200">
                {/* Sri Yantra Sacred Geometry Triangles */}
                <polygon points="100,30 155,145 45,145" fill="none" stroke="#F59E0B" strokeWidth="0.6" />
                <polygon points="100,170 155,55 45,55" fill="none" stroke="#F59E0B" strokeWidth="0.6" />
                <polygon points="100,45 145,135 55,135" fill="none" stroke="#EF4444" strokeWidth="0.5" />
                <polygon points="100,155 145,65 55,65" fill="none" stroke="#EF4444" strokeWidth="0.5" />
                <circle cx="100" cy="100" r="24" fill="none" stroke="#F59E0B" strokeWidth="0.5" strokeDasharray="2 2" />
                <circle cx="100" cy="100" r="12" fill="none" stroke="#EF4444" strokeWidth="0.6" />
              </svg>
            </>
          )}

          {styleId === 'tactical_ops' && (
            <>
              <div className="absolute inset-2.5 rounded-full border border-green-500/40 pointer-events-none shadow-[0_0_15px_rgba(34,197,94,0.2)]" />
              <div className="absolute inset-9 rounded-full border border-dashed border-emerald-500/25 pointer-events-none" />
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-35" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="60" fill="none" stroke="#22C55E" strokeWidth="0.5" strokeDasharray="3 3" />
                <circle cx="100" cy="100" r="30" fill="none" stroke="#22C55E" strokeWidth="0.4" />
                <line x1="100" y1="12" x2="100" y2="188" stroke="#22C55E" strokeWidth="0.5" />
                <line x1="12" y1="100" x2="188" y2="100" stroke="#22C55E" strokeWidth="0.5" />
                <line x1="38" y1="38" x2="162" y2="162" stroke="#F97316" strokeWidth="0.3" strokeDasharray="2 2" />
                <line x1="162" y1="38" x2="38" y2="162" stroke="#F97316" strokeWidth="0.3" strokeDasharray="2 2" />
              </svg>
            </>
          )}

          {styleId === 'cosmic_galaxy' && (
            <>
              <div className="absolute inset-3 rounded-full border border-indigo-400/35 pointer-events-none shadow-[0_0_25px_rgba(129,140,248,0.3)]" />
              <div className="absolute inset-10 rounded-full border border-dashed border-purple-400/25 pointer-events-none" />
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 200 200">
                <ellipse cx="100" cy="100" rx="60" ry="30" fill="none" stroke="#818CF8" strokeWidth="0.5" transform="rotate(30 100 100)" />
                <ellipse cx="100" cy="100" rx="60" ry="30" fill="none" stroke="#C084FC" strokeWidth="0.5" transform="rotate(-30 100 100)" />
                <circle cx="100" cy="100" r="18" fill="none" stroke="#E879F9" strokeWidth="0.5" strokeDasharray="3 2" />
              </svg>
            </>
          )}

          {/* Vastu Grid Overlay (for Vedic/Dark/Any when enabled) */}
          {vastuGridEnabled && (
            <>
              <div className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: 'rotate(45deg)' }}>
                <div className="flex flex-col items-center mt-14 select-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mb-0.5 shadow-[0_0_6px_#f59e0b]" />
                  <span className="text-[9px] font-black text-amber-400 leading-none">{isHi ? 'ईशान' : 'NE'}</span>
                  <span className="text-[7.5px] font-bold text-amber-300/90 tracking-wide leading-none mt-0.5">{isHi ? 'मंदिर' : 'Temple'}</span>
                </div>
              </div>

              <div className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: 'rotate(135deg)' }}>
                <div className="flex flex-col items-center mt-14 select-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mb-0.5 shadow-[0_0_6px_#f97316]" />
                  <span className="text-[9px] font-black text-orange-400 leading-none">{isHi ? 'आग्नेय' : 'SE'}</span>
                  <span className="text-[7.5px] font-bold text-orange-300/90 tracking-wide leading-none mt-0.5">{isHi ? 'रसोई' : 'Kitchen'}</span>
                </div>
              </div>

              <div className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: 'rotate(225deg)' }}>
                <div className="flex flex-col items-center mt-14 select-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mb-0.5 shadow-[0_0_6px_#eab308]" />
                  <span className="text-[9px] font-black text-yellow-400 leading-none">{isHi ? 'नैऋत्य' : 'SW'}</span>
                  <span className="text-[7.5px] font-bold text-yellow-300/90 tracking-wide leading-none mt-0.5">{isHi ? 'शयन' : 'Master'}</span>
                </div>
              </div>

              <div className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: 'rotate(315deg)' }}>
                <div className="flex flex-col items-center mt-14 select-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mb-0.5 shadow-[0_0_6px_#38bdf8]" />
                  <span className="text-[9px] font-black text-sky-400 leading-none">{isHi ? 'वायव्य' : 'NW'}</span>
                  <span className="text-[7.5px] font-bold text-sky-300/90 tracking-wide leading-none mt-0.5">{isHi ? 'अतिथि' : 'Guest'}</span>
                </div>
              </div>
            </>
          )}

          {/* Dial Tick Marks (72 ticks for 5-degree increments) */}
          {[...Array(72)].map((_, i) => {
            const deg = i * 5;
            const isMajor = deg % 45 === 0;
            const isMid = deg % 15 === 0;
            return (
              <div key={deg} className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: `rotate(${deg}deg)` }}>
                <div className={cn(
                  "rounded-full mt-2",
                  isMajor
                    ? (styleId === 'cyberpunk' ? "w-[2.5px] h-3.5 bg-cyan-400 shadow-[0_0_6px_#00F0FF]" :
                       styleId === 'emerald_aurora' ? "w-[2.5px] h-3.5 bg-emerald-400 shadow-[0_0_6px_#10B981]" :
                       styleId === 'tactical_ops' ? "w-[2.5px] h-3.5 bg-orange-500 shadow-[0_0_6px_#F97316]" :
                       styleId === 'nautical' ? "w-[2.5px] h-3.5 bg-[#8C5824]" :
                       "w-[2.5px] h-3.5 bg-[#EF4444] shadow-sm")
                    : isMid
                    ? (styleId === 'cyberpunk' ? "w-[1.8px] h-3 bg-magenta-400/80" :
                       styleId === 'royal_gold' ? "w-[1.8px] h-3 bg-amber-400/90 shadow-[0_0_4px_rgba(245,158,11,0.5)]" :
                       styleId === 'nautical' ? "w-[1.5px] h-2.5 bg-[#8C5824]" :
                       styleId === 'emerald_aurora' ? "w-[1.8px] h-3 bg-emerald-400/70" :
                       "w-[1.8px] h-2.5 bg-white/60")
                    : (styleId === 'cyberpunk' ? "w-[1px] h-1.5 bg-cyan-400/30" :
                       styleId === 'nautical' ? "w-[1px] h-1.5 bg-[#8C5824]/40" :
                       styleId === 'royal_gold' ? "w-[1px] h-1.5 bg-amber-400/35" :
                       "w-[1px] h-1.5 bg-white/25")
                )} />
              </div>
            );
          })}

          {/* 30-Degree Numerical Labels */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <div key={deg} className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: `rotate(${deg}deg)` }}>
              <div className="flex flex-col items-center select-none mt-1">
                <span className={cn(
                  "font-mono font-bold text-[0.52rem] drop-shadow-md",
                  styleId === 'royal_gold' ? "text-amber-200/90" :
                  styleId === 'cyberpunk' ? "text-cyan-300 font-mono" :
                  styleId === 'nautical' ? "text-[#5C3818] font-serif" :
                  styleId === 'emerald_aurora' ? "text-emerald-200" :
                  styleId === 'vedic_mandala' ? "text-amber-200" :
                  styleId === 'tactical_ops' ? "text-green-400 font-mono" :
                  styleId === 'cosmic_galaxy' ? "text-indigo-200" :
                  styleId === 'rose_gold' ? "text-rose-200" :
                  styleId === 'steampunk' ? "text-orange-300 font-mono" :
                  "text-stone-300 font-semibold"
                )}>
                  {deg}
                </span>
              </div>
            </div>
          ))}

          {/* Cardinal Badges */}
          {cardinalPoints.map((pt) => (
            <div key={pt.deg} className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: `rotate(${pt.deg}deg)` }}>
              <div className="flex flex-col items-center select-none mt-5">
                <span className={cn(
                  "font-black text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-tight",
                  pt.isNorth
                    ? "text-[#EF4444] text-base font-black scale-110 drop-shadow-[0_0_8px_#ef4444]"
                    : styleId === 'nautical'
                    ? "text-[#3E2718]"
                    : styleId === 'cyberpunk'
                    ? "text-cyan-300"
                    : styleId === 'emerald_aurora'
                    ? "text-emerald-300"
                    : styleId === 'tactical_ops'
                    ? "text-green-400"
                    : "text-amber-100"
                )}>
                  {pt.label}
                </span>
              </div>
            </div>
          ))}

          {/* Sun Badge (Real-time Solar Position) */}
          {sunPos !== null && (
            <div className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: `rotate(${sunPos}deg)` }}>
              <div className="flex flex-col items-center mt-12 animate-pulse">
                <div className="flex items-center gap-1 bg-amber-500/90 text-stone-950 px-1.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.9)] border border-amber-300">
                  <Sun className="w-3 h-3 fill-amber-300 text-stone-950" />
                  <span className="text-[8px] font-black tracking-wider leading-none">{isHi ? 'सूर्य' : 'Sun'}</span>
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
                    <span className="text-[9px] font-black tracking-wider">
                      {isHi ? `किबला ${qiblaBearing}°` : `Qibla ${qiblaBearing}°`}
                    </span>
                    <span className="text-[7px] font-bold opacity-80 mt-0.5">
                      {qiblaDistanceKm.toLocaleString(isHi ? 'hi-IN' : 'en-US')} {isHi ? 'किमी' : 'km'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stationary Center Needle Overlay */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none flex items-center justify-center overflow-visible z-20"
        style={{
          transform: `translate3d(${roll * 0.15}px, ${-pitch * 0.15}px, 0px)`
        }}
      >
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          
          {/* 1. Ornate Spear Needle (Nautical) */}
          {styleId === 'nautical' && (
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
          )}

          {/* 2. Cyberpunk Laser HUD Needle */}
          {styleId === 'cyberpunk' && (
            <svg className="w-full h-full p-2.5 drop-shadow-[0_0_20px_rgba(0,240,255,0.8)]" viewBox="0 0 200 200">
              <line x1="100" y1="20" x2="100" y2="70" stroke="#00F0FF" strokeWidth="3" strokeLinecap="round" className="animate-pulse" />
              <polygon points="100,15 92,35 108,35" fill="#00F0FF" />
              <line x1="100" y1="130" x2="100" y2="180" stroke="#FF0055" strokeWidth="2.5" strokeDasharray="3 3" />
              <circle cx="100" cy="100" r="18" fill="none" stroke="#00F0FF" strokeWidth="1.5" strokeDasharray="5 3" />
              <circle cx="100" cy="100" r="12" fill="none" stroke="#FF0055" strokeWidth="1" />
            </svg>
          )}

          {/* 3. Tactical Reticle Needle */}
          {styleId === 'tactical_ops' && (
            <svg className="w-full h-full p-2.5 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]" viewBox="0 0 200 200">
              <polygon points="100,24 88,76 100,64" fill="#22C55E" />
              <polygon points="100,24 100,64 112,76" fill="#15803D" />
              <line x1="100" y1="64" x2="100" y2="136" stroke="#F97316" strokeWidth="1.5" strokeDasharray="2 2" />
              <polygon points="100,176 92,136 100,144" fill="#374151" />
              <polygon points="100,176 100,144 108,136" fill="#1F2937" />
              <circle cx="100" cy="100" r="16" fill="none" stroke="#22C55E" strokeWidth="1.5" />
            </svg>
          )}

          {/* 4. Vedic Chakra Arrow Needle */}
          {styleId === 'vedic_mandala' && (
            <svg className="w-full h-full p-2.5 drop-shadow-[0_6px_20px_rgba(245,158,11,0.6)]" viewBox="0 0 200 200">
              <polygon points="100,18 84,80 100,66" fill="#F59E0B" />
              <polygon points="100,18 100,66 116,80" fill="#EF4444" />
              <polygon points="100,182 90,120 100,134" fill="#78350F" />
              <polygon points="100,182 100,134 110,120" fill="#451A03" />
              <circle cx="100" cy="100" r="16" fill="none" stroke="#F59E0B" strokeWidth="2" />
              <circle cx="100" cy="100" r="10" fill="none" stroke="#EF4444" strokeWidth="1" strokeDasharray="2 2" />
            </svg>
          )}

          {/* 5. Minimal Stealth Pointer */}
          {styleId === 'minimal_onyx' && (
            <div className="absolute top-2 flex flex-col items-center z-30">
              <div className="w-[4px] h-10 bg-gradient-to-b from-red-500 to-orange-500 rounded-full shadow-[0_0_14px_#ef4444]" />
              <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff] -mt-1" />
            </div>
          )}

          {/* 6. Cosmic Galaxy Pulsar Needle */}
          {styleId === 'cosmic_galaxy' && (
            <svg className="w-full h-full p-2.5 drop-shadow-[0_0_20px_rgba(192,132,252,0.8)]" viewBox="0 0 200 200">
              <polygon points="100,16 86,78 100,65" fill="#C084FC" />
              <polygon points="100,16 100,65 114,78" fill="#818CF8" />
              <polygon points="100,184 90,122 100,135" fill="#312E81" />
              <polygon points="100,184 100,135 110,122" fill="#1E1B4B" />
              <circle cx="100" cy="100" r="16" fill="none" stroke="#C084FC" strokeWidth="1.5" />
            </svg>
          )}

          {/* 7. Default 3D Bicolor Delta Arrow (Royal Gold, Emerald, Rose Gold, Steampunk, Crystal, Sunset) */}
          {(styleId === 'royal_gold' || styleId === 'emerald_aurora' || styleId === 'rose_gold' || styleId === 'steampunk' || styleId === 'crystal_glass' || styleId === 'sunset_aura') && (
            <svg className="w-full h-full p-2.5 drop-shadow-[0_12px_28px_rgba(0,0,0,0.95)]" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="needleSilver" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="60%" stopColor="#E2E8F0" />
                  <stop offset="100%" stopColor="#CBD5E1" />
                </linearGradient>
                <linearGradient id="needleCrimson" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="50%" stopColor="#DC2626" />
                  <stop offset="100%" stopColor="#991B1B" />
                </linearGradient>
              </defs>

              <polygon
                points="100,34 78,76 100,64"
                fill="url(#needleSilver)"
                stroke="#94A3B8"
                strokeWidth="0.8"
                strokeLinejoin="round"
                className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
              />
              <polygon
                points="100,34 100,64 122,76"
                fill="url(#needleCrimson)"
                stroke="#7F1D1D"
                strokeWidth="0.8"
                strokeLinejoin="round"
                className="drop-shadow-[0_4px_16px_rgba(239,68,68,0.7)]"
              />
              <line x1="100" y1="34" x2="100" y2="64" stroke="#475569" strokeWidth="1" />
              <circle cx="100" cy="100" r="14" fill="none" stroke="#D4AF37" strokeWidth="1.8" />
            </svg>
          )}
        </div>

        {/* Center Precision Liquid Spirit Bubble Hub */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className={cn(
            "w-14 h-14 rounded-full relative overflow-hidden flex flex-col items-center justify-center transition-all duration-300 backdrop-blur-md shadow-2xl",
            isLevel
              ? "border-2 border-emerald-400/80 bg-emerald-950/60 shadow-[0_0_20px_rgba(52,211,153,0.6)] animate-pulse"
              : styleId === 'cyberpunk'
              ? "border border-cyan-400/60 bg-slate-950/90 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
              : styleId === 'royal_gold'
              ? "border-2 border-amber-400/60 bg-[#1E232B]/95 shadow-[0_4px_25px_rgba(245,158,11,0.3)]"
              : "border border-amber-400/40 bg-stone-950/80 shadow-inner"
          )}>
            <div className="absolute w-full h-[0.5px] bg-white/20" />
            <div className="absolute h-full w-[0.5px] bg-white/20" />
            
            <div className={cn(
              "w-7 h-7 rounded-full border flex items-center justify-center transition-colors",
              isLevel ? "border-emerald-400/80 shadow-[0_0_12px_#10b981]" : "border-emerald-500/40"
            )}>
              <span className="text-[8px] font-black text-emerald-400/80 leading-none">
                {isHi ? 'उ' : 'N'}
              </span>
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
  );
};
