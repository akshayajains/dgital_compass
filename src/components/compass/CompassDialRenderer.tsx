import React, { useMemo } from 'react';
import { CompassStyleId, Language, CompassStyleVariant } from '@/types/compass';
import { Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VASTU_32_PADAS } from '@/lib/vastu32Devta';
import { getVariant } from '@/components/compass/CompassStyles';

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
  customAccentColor?: string;
  /** Variant id for grouped themes (ios_compass, color_palette) */
  variantId?: string | null;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}

const get16WindName = (deg: number | null) => {
  if (deg === null) return 'ENE';
  const winds = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((deg % 360 + 360) % 360) / 22.5) % 16;
  return winds[index];
};

export const CompassDialRenderer = React.memo(function CompassDialRenderer({
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
  customAccentColor,
  variantId,
  onPointerDown,
  onPointerMove,
  onPointerUp
}: Props) {
  const isHi = language === 'hi';
  const displayAngle = displayHeading !== null ? Math.round(displayHeading) : 0;

  // Resolve active variant for grouped themes (ios_compass, color_palette)
  const activeVariant: CompassStyleVariant | null = variantId ? getVariant(styleId, variantId) : null;
  const isGrouped = activeVariant !== null;

  // Graphite is now an iOS Compass variant (was a standalone theme)
  const isGraphite = styleId === 'ios_compass' && variantId === 'ios_graphite';
  // Vintage Nautical is now an iOS Compass variant (was a standalone theme)
  const isNautical = styleId === 'ios_compass' && variantId === 'ios_nautical';

  // ── Standalone styles that render their own center needle ──
  const STANDALONE_NEEDLE_STYLES = new Set([
    'cyberpunk', 'tactical_ops', 'minimal_onyx', 'cosmic_galaxy',
    'satellite_earth', 'vedic_mandala', 'sandalwood', 'royal_gold',
  ] as CompassStyleId[]);

  // Grouped themes always have center needles
  const hasCenterNeedle = isGrouped ? (activeVariant?.hasCenterNeedle ?? true) : STANDALONE_NEEDLE_STYLES.has(styleId);

  // Per-style apex Y coordinate for the center needle (easier to fine-tune per-theme)
  const APEX_Y_MAP: Record<string, number> = {
    cyberpunk: 30,
    tactical_ops: 30,
    minimal_onyx: 36,
    cosmic_galaxy: 30,
    satellite_earth: 30,
    vedic_mandala: 30,
    sandalwood: 30,
    royal_gold: 32,
    ios_compass: activeVariant?.apexY ?? 32,
    color_palette: activeVariant?.apexY ?? 30,
  };
  const apexY = activeVariant?.apexY ?? (APEX_Y_MAP[styleId] ?? 30);

  const cardinalPoints = useMemo(() => {
    if (styleId === 'vedic_mandala') {
      return [
        { label: 'N', deg: 0, isNorth: true, code: 'N' },
        { label: 'E', deg: 90, isNorth: false, code: 'E' },
        { label: 'S', deg: 180, isNorth: false, code: 'S' },
        { label: 'W', deg: 270, isNorth: false, code: 'W' }
      ];
    }
    if (styleId === 'satellite_earth') {
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
    }
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
  }, [isHi, styleId]);

  // Outer bezel styling classes
  const getBezelClass = () => {
    // Grouped theme variant provides the bezel class directly
    if (activeVariant?.bezelClass) return activeVariant.bezelClass;

    switch (styleId) {
      case 'satellite_earth':
        return 'border-[16px] sm:border-[20px] border-[#1E293B] shadow-[0_25px_60px_rgba(0,0,0,0.95),inset_0_2px_6px_rgba(0,240,255,0.4),inset_0_-8px_16px_rgba(0,0,0,0.9)] bg-gradient-to-b from-[#2E3C4E] via-[#1E293B] to-[#0F172A]';
      case 'sandalwood':
        return 'border-[20px] sm:border-[24px] border-[#C9A67E] shadow-[0_20px_60px_rgba(78,53,36,0.7),inset_0_3px_8px_rgba(255,255,255,0.7),inset_0_-8px_16px_rgba(78,53,36,0.95)] bg-gradient-to-br from-[#E8D7C2] via-[#C9A67E] to-[#8C6239]';
      case 'royal_gold':
        return 'border-[18px] sm:border-[22px] border-transparent shadow-[0_24px_65px_rgba(0,0,0,0.95),0_0_35px_rgba(212,175,55,0.35),inset_0_2px_6px_rgba(255,240,180,0.5),inset_0_-8px_16px_rgba(60,40,10,0.9)] bg-[linear-gradient(135deg,#3B2A10,#6B4E1A_25%,#E8C547_50%,#F7D070_55%,#D4AF37_60%,#6B4E1A_78%,#2C1E0E)] bg-origin-border';
      case 'cyberpunk':
        return 'border-[14px] sm:border-[18px] border-[#0F172A] shadow-[0_0_40px_rgba(0,240,255,0.4),inset_0_0_20px_rgba(0,240,255,0.3)] bg-gradient-to-tr from-[#020617] via-[#0b1329] to-[#020617]';
      case 'minimal_onyx':
        return 'border-[16px] sm:border-[20px] border-[#1E1E24] shadow-[0_25px_60px_rgba(0,0,0,0.98),inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-5px_12px_rgba(0,0,0,0.95)] bg-[#0C0C0E]';
      case 'vedic_mandala':
        return 'border-[18px] sm:border-[22px] border-[#D97706] shadow-[0_20px_60px_rgba(0,0,0,0.95),inset_0_3px_8px_rgba(254,240,138,0.7),inset_0_-8px_16px_rgba(180,83,9,0.9)] bg-gradient-to-tr from-[#D97706] via-[#FBBF24] to-[#B45309]';
      case 'tactical_ops':
        return 'border-[16px] sm:border-[20px] border-[#1C261D] shadow-[0_20px_50px_rgba(0,0,0,0.95),inset_0_0_15px_rgba(34,197,94,0.2)] bg-gradient-to-tr from-[#121A13] via-[#233125] to-[#0D140E]';
      case 'cosmic_galaxy':
        return 'border-[16px] sm:border-[20px] border-[#1E1238] shadow-[0_0_45px_rgba(129,140,248,0.35),inset_0_0_20px_rgba(192,132,252,0.2)] bg-gradient-to-tr from-[#0A0517] via-[#1A0C38] to-[#070312]';
      default:
        return 'border-[16px] sm:border-[20px] border-stone-800 bg-stone-950';
    }
  };

  // Dial face background
  const getDialFaceBg = () => {
    // Grouped theme variant provides the dial face bg directly
    if (activeVariant?.dialFaceBg) return activeVariant.dialFaceBg;

    switch (styleId) {
      case 'satellite_earth':
        return 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1E2C3D] via-[#101824] to-[#080D14]';
      case 'sandalwood':
        return 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FAF3E8] via-[#EFE2CE] to-[#DCBF9E]';
      case 'royal_gold':
        return 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#3A2A10] via-[#1E1508] to-[#0A0603]';
      case 'cyberpunk':
        return 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#081226] via-[#040914] to-[#010308]';
      case 'minimal_onyx':
        return 'bg-[#080809]';
      case 'vedic_mandala':
        return 'bg-[#0B131B]';
      case 'tactical_ops':
        return 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#141C15] via-[#0B110C] to-[#050805]';
      case 'cosmic_galaxy':
        return 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#190F36] via-[#0E0720] to-[#05020D]';
      default:
        return 'bg-[#0A0A0A]';
    }
  };

  return (
    <div className="relative my-2 flex flex-col items-center justify-center">
      {/* Shared compact two-tone heading needle.
          Hidden for styles that render their own center needle to avoid duplicates. */}
      {!hasCenterNeedle && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 h-[4.25rem] w-[3.4rem] pointer-events-none drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)]">
          <svg viewBox="0 0 54 68" className="h-full w-full">
            <polygon points="27,6 3,50 27,41" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
            <polygon points="27,6 51,50 27,41" fill="#EF233C" stroke="#B91C1C" strokeWidth="1.5" />
            <path d="M27 8 L27 38" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" opacity="0.9" />
            <circle cx="27" cy="46" r="5.2" fill="#FFFFFF" stroke="#B91C1C" strokeWidth="2" />
          </svg>
        </div>
      )}
      

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
          {styleId === 'satellite_earth' && (
            <>
              {/* Outer Coordinate Rings */}
              <div className="absolute inset-2.5 rounded-full border border-slate-600/40 pointer-events-none" />
              <div className="absolute inset-7 rounded-full border border-cyan-400/30 pointer-events-none shadow-[0_0_12px_rgba(0,240,255,0.2)]" />
              <div className="absolute inset-16 rounded-full border border-dashed border-slate-500/25 pointer-events-none" />
              
              {/* Faceted 3D Compass Star */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
                {/* 4 Cardinal Cyan Accents */}
                <line x1="100" y1="12" x2="100" y2="24" stroke="#00F0FF" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#00f0ff]" />
                <line x1="188" y1="100" x2="176" y2="100" stroke="#00F0FF" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#00f0ff]" />
                <line x1="100" y1="188" x2="100" y2="176" stroke="#00F0FF" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#00f0ff]" />
                <line x1="12" y1="100" x2="24" y2="100" stroke="#00F0FF" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_#00f0ff]" />

                {/* 4 Diagonal Cyan Accents */}
                <line x1="162" y1="38" x2="154" y2="46" stroke="#00F0FF" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="162" y1="162" x2="154" y2="154" stroke="#00F0FF" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="38" y1="162" x2="46" y2="154" stroke="#00F0FF" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="38" y1="38" x2="46" y2="46" stroke="#00F0FF" strokeWidth="1.8" strokeLinecap="round" />

                {/* Faceted Star Wings */}
                <polygon points="100,24 100,100 88,100" fill="#94A3B8" opacity="0.6" />
                <polygon points="100,24 100,100 112,100" fill="#334155" opacity="0.8" />
                <polygon points="176,100 100,100 100,88" fill="#94A3B8" opacity="0.6" />
                <polygon points="176,100 100,100 100,112" fill="#334155" opacity="0.8" />
                <polygon points="100,176 100,100 112,100" fill="#94A3B8" opacity="0.6" />
                <polygon points="100,176 100,100 88,100" fill="#334155" opacity="0.8" />
                <polygon points="24,100 100,100 100,112" fill="#94A3B8" opacity="0.6" />
                <polygon points="24,100 100,100 100,88" fill="#334155" opacity="0.8" />

                {/* Concentric rings */}
                <circle cx="100" cy="100" r="45" fill="none" stroke="#475569" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />
                <circle cx="100" cy="100" r="28" fill="none" stroke="#00F0FF" strokeWidth="0.5" opacity="0.3" />
              </svg>
            </>
          )}

          {styleId === 'sandalwood' && (
            <>
              {/* Concentric Sandalwood rings */}
              <div className="absolute inset-2.5 rounded-full border border-[#8C6239]/40 pointer-events-none" />
              <div className="absolute inset-8 rounded-full border border-[#8C6239]/25 pointer-events-none" />
              <div className="absolute inset-16 rounded-full border border-dashed border-[#8C6239]/20 pointer-events-none" />
              <div className="absolute inset-24 rounded-full border border-[#8C6239]/15 pointer-events-none" />

              {/* 8-Point Faceted Compass Rose Star */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
                {/* 4 Major Points */}
                <polygon points="100,18 100,100 90,100" fill="#E6C885" opacity="0.95" />
                <polygon points="100,18 100,100 110,100" fill="#8C6239" opacity="0.9" />
                <polygon points="182,100 100,100 100,90" fill="#E6C885" opacity="0.95" />
                <polygon points="182,100 100,100 100,110" fill="#8C6239" opacity="0.9" />
                <polygon points="100,182 100,100 110,100" fill="#E6C885" opacity="0.95" />
                <polygon points="100,182 100,100 90,100" fill="#8C6239" opacity="0.9" />
                <polygon points="18,100 100,100 100,110" fill="#E6C885" opacity="0.95" />
                <polygon points="18,100 100,100 100,90" fill="#8C6239" opacity="0.9" />

                {/* 4 Diagonal Points */}
                <polygon points="155,45 100,100 96,96" fill="#F0DC9E" opacity="0.8" />
                <polygon points="155,45 100,100 104,104" fill="#6B4724" opacity="0.8" />
                <polygon points="155,155 100,100 104,96" fill="#F0DC9E" opacity="0.8" />
                <polygon points="155,155 100,100 96,104" fill="#6B4724" opacity="0.8" />
                <polygon points="45,155 100,100 104,104" fill="#F0DC9E" opacity="0.8" />
                <polygon points="45,155 100,100 96,96" fill="#6B4724" opacity="0.8" />
                <polygon points="45,45 100,100 96,104" fill="#F0DC9E" opacity="0.8" />
                <polygon points="45,45 100,100 104,96" fill="#6B4724" opacity="0.8" />

                {/* Coordinate Lines */}
                <circle cx="100" cy="100" r="32" fill="none" stroke="#8C6239" strokeWidth="0.5" opacity="0.4" />
                <circle cx="100" cy="100" r="62" fill="none" stroke="#8C6239" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />
              </svg>
            </>
          )}

          {styleId === 'royal_gold' && (
            <>
              {/* Outer ornamental filigree rings */}
              <div className="absolute inset-1.5 rounded-full pointer-events-none flex items-center justify-center">
                <svg viewBox="0 0 220 220" className="w-full h-full pointer-events-none">
                  <defs>
                    <linearGradient id="rg-bevel" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#F7E8A0" />
                      <stop offset="30%" stopColor="#E8C547" />
                      <stop offset="60%" stopColor="#D4AF37" />
                      <stop offset="100%" stopColor="#8C5F1A" />
                    </linearGradient>
                    <linearGradient id="rg-bevel-dark" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#5C4A24" />
                      <stop offset="100%" stopColor="#3B2E16" />
                    </linearGradient>
                    <radialGradient id="rg-core" cx="40%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="rgba(255,250,230,0.95)" stopOpacity="0.08" />
                      <stop offset="40%" stopColor="#2b1a09" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#0f0804" stopOpacity="1" />
                    </radialGradient>
                    <linearGradient id="rg-gold-shine" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFF7D6" stopOpacity="0.9" />
                      <stop offset="50%" stopColor="#E8C547" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#8C5F1A" stopOpacity="0.9" />
                    </linearGradient>
                  </defs>

                  {/* Double bezel rim — outer gold, inner dark inlay */}
                  <rect x="8" y="8" width="204" height="204" rx="28" ry="28" fill="url(#rg-bevel)" stroke="#F7E8A0" strokeWidth="1.5" />
                  <rect x="16" y="16" width="188" height="188" rx="20" ry="20" fill="url(#rg-bevel-dark)" stroke="#A67C2A" strokeWidth="0.8" />

                  {/* Lapis lazuli inset gems at corners */}
                  <circle cx="34" cy="34" r="4.5" fill="#0B1F4A" stroke="#E8C547" strokeWidth="1.2" />
                  <circle cx="186" cy="34" r="4.5" fill="#0B1F4A" stroke="#E8C547" strokeWidth="1.2" />
                  <circle cx="34" cy="186" r="4.5" fill="#0B1F4A" stroke="#E8C547" strokeWidth="1.2" />
                  <circle cx="186" cy="186" r="4.5" fill="#0B1F4A" stroke="#E8C547" strokeWidth="1.2" />

                  {/* Ruby accent gems at midpoints */}
                  <circle cx="110" cy="10" r="3" fill="#8B1A1A" stroke="#F7E8A0" strokeWidth="0.8" />
                  <circle cx="210" cy="110" r="3" fill="#8B1A1A" stroke="#F7E8A0" strokeWidth="0.8" />
                  <circle cx="110" cy="210" r="3" fill="#8B1A1A" stroke="#F7E8A0" strokeWidth="0.8" />
                  <circle cx="10" cy="110" r="3" fill="#8B1A1A" stroke="#F7E8A0" strokeWidth="0.8" />

                  {/* Core dial overlay */}
                  <circle cx="110" cy="110" r="60" fill="url(#rg-core)" opacity="0.95" />
                </svg>
              </div>

              {/* Ornate 8-point filigree compass rose */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
                <defs>
                  <linearGradient id="rg-gold-n" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#C7A035" />
                    <stop offset="60%" stopColor="#E8C547" />
                    <stop offset="100%" stopColor="#FFF7D6" />
                  </linearGradient>
                  <linearGradient id="rg-gold-s" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#C7A035" />
                    <stop offset="100%" stopColor="#6B4E1A" />
                  </linearGradient>
                  <linearGradient id="rg-gold-e" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#C7A035" />
                    <stop offset="100%" stopColor="#6B4E1A" />
                  </linearGradient>
                  <linearGradient id="rg-gold-w" x1="100%" y1="0%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#C7A035" />
                    <stop offset="100%" stopColor="#6B4E1A" />
                  </linearGradient>
                </defs>

                {/* Outer filigree ring with gold gradient */}
                <circle cx="100" cy="100" r="88" fill="none" stroke="url(#rg-gold-shine)" strokeWidth="1.2" opacity="0.5" />
                <circle cx="100" cy="100" r="85" fill="none" stroke="#D4AF37" strokeWidth="0.4" strokeDasharray="2 4" opacity="0.45" />

                {/* 4 Major Cardinal Petals — elongated, faceted, two-tone gold */}
                <polygon points="100,16 100,100 92,100" fill="url(#rg-gold-n)" opacity="0.92" />
                <polygon points="100,16 100,100 108,100" fill="url(#rg-gold-s)" opacity="0.88" />
                <polygon points="184,100 100,100 100,92" fill="url(#rg-gold-e)" opacity="0.88" />
                <polygon points="184,100 100,100 100,108" fill="url(#rg-gold-w)" opacity="0.92" />
                <polygon points="100,184 100,100 108,100" fill="url(#rg-gold-n)" opacity="0.88" />
                <polygon points="100,184 100,100 92,100" fill="url(#rg-gold-s)" opacity="0.92" />
                <polygon points="16,100 100,100 100,108" fill="url(#rg-gold-w)" opacity="0.88" />
                <polygon points="16,100 100,100 100,92" fill="url(#rg-gold-e)" opacity="0.92" />

                {/* 4 Diagonal Secondary Petals — shorter, warmer gold */}
                <polygon points="158,42 100,100 95,95" fill="#E8C547" opacity="0.75" />
                <polygon points="158,42 100,100 105,105" fill="#7A5A1C" opacity="0.78" />
                <polygon points="158,158 100,100 105,95" fill="#E8C547" opacity="0.75" />
                <polygon points="158,158 100,100 95,105" fill="#7A5A1C" opacity="0.78" />
                <polygon points="42,158 100,100 105,105" fill="#E8C547" opacity="0.75" />
                <polygon points="42,158 100,100 95,95" fill="#7A5A1C" opacity="0.78" />
                <polygon points="42,42 100,100 95,105" fill="#E8C547" opacity="0.75" />
                <polygon points="42,42 100,100 105,95" fill="#7A5A1C" opacity="0.78" />

                {/* Inner ornamental rings */}
                <circle cx="100" cy="100" r="70" fill="none" stroke="#E8C547" strokeWidth="0.8" opacity="0.55" />
                <circle cx="100" cy="100" r="50" fill="none" stroke="#D4AF37" strokeWidth="0.6" strokeDasharray="3 2" opacity="0.65" />
                <circle cx="100" cy="100" r="30" fill="none" stroke="#E8C547" strokeWidth="0.5" opacity="0.5" />

                {/* Decorative fleur-de-lis at cardinal tips */}
                <g opacity="0.7">
                  {/* North fleur */}
                  <circle cx="100" cy="18" r="2" fill="#E8C547" />
                  <circle cx="100" cy="18" r="0.8" fill="#0B1F4A" />
                  {/* East fleur */}
                  <circle cx="182" cy="100" r="2" fill="#E8C547" />
                  <circle cx="182" cy="100" r="0.8" fill="#0B1F4A" />
                  {/* South fleur */}
                  <circle cx="100" cy="182" r="2" fill="#E8C547" />
                  <circle cx="100" cy="182" r="0.8" fill="#0B1F4A" />
                  {/* West fleur */}
                  <circle cx="18" cy="100" r="2" fill="#E8C547" />
                  <circle cx="18" cy="100" r="0.8" fill="#0B1F4A" />
                </g>

                {/* Subtle coordinate crosshair */}
                <line x1="12" y1="100" x2="188" y2="100" stroke="#D4AF37" strokeWidth="0.4" strokeDasharray="5 4" opacity="0.55" />
                <line x1="100" y1="12" x2="100" y2="188" stroke="#D4AF37" strokeWidth="0.4" strokeDasharray="5 4" opacity="0.35" />
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
                {/* vertical guide removed for cyberpunk to avoid long needle visual */}
                <line x1="10" y1="100" x2="190" y2="100" stroke="#00F0FF" strokeWidth="0.4" strokeDasharray="5 5" />
                <rect x="70" y="70" width="60" height="60" fill="none" stroke="#00F0FF" strokeWidth="0.4" strokeDasharray="2 2" />
              </svg>
            </>
          )}

          {styleId === 'vedic_mandala' && (
            <>
              {/* Inner Circle Border */}
              <div className="absolute inset-16 rounded-full border border-amber-400/40 pointer-events-none shadow-[0_0_15px_rgba(245,158,11,0.2)]" />
              <div className="absolute inset-24 rounded-full border border-white/10 pointer-events-none" />

              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
                {/* 32 Vastu Devta Outer Annular Ring Sectors */}
                {VASTU_32_PADAS.map((pada) => (
                  <g key={pada.code} transform={`rotate(${pada.centerDeg}, 100, 100)`}>
                    {/* Sector Arc Background */}
                    <path
                      d="M 90.69,5.46 A 95,95 0 0,1 109.31,5.46 L 106.57,33.32 A 67,67 0 0,0 93.43,33.32 Z"
                      fill={pada.isAuspicious ? '#00F0FF' : pada.color}
                      stroke="#F59E0B"
                      strokeWidth="0.4"
                      opacity={pada.isAuspicious ? 0.95 : 0.85}
                    />

                    {/* Pada Code: N3*, E1, etc. */}
                    <text
                      x="100"
                      y="11.5"
                      textAnchor="middle"
                      fill={pada.isAuspicious ? '#020617' : '#FDE047'}
                      fontSize="3.6"
                      fontWeight="900"
                    >
                      {pada.code}
                    </text>

                    {/* Hindi/Sanskrit Deity Name */}
                    <text
                      x="100"
                      y="18.5"
                      textAnchor="middle"
                      fill={pada.isAuspicious ? '#020617' : '#FFFFFF'}
                      fontSize="4"
                      fontWeight="900"
                    >
                      {pada.nameHi}
                    </text>

                    {/* English Deity Name */}
                    <text
                      x="100"
                      y="25.5"
                      textAnchor="middle"
                      fill={pada.isAuspicious ? '#020617' : '#94A3B8'}
                      fontSize="3"
                      fontWeight="700"
                    >
                      {pada.nameEn}
                    </text>
                  </g>
                ))}

                {/* Inner Concentric Circles */}
                <circle cx="100" cy="100" r="67" fill="none" stroke="#F59E0B" strokeWidth="0.8" />
                <circle cx="100" cy="100" r="48" fill="none" stroke="#00F0FF" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.5" />
                <circle cx="100" cy="100" r="28" fill="none" stroke="#F59E0B" strokeWidth="0.6" opacity="0.6" />
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

          {isGraphite && (
            <>
              {/* Precision mil-ring — fine ticked outer ring */}
              <div className="absolute inset-2 rounded-full border border-slate-400/30 pointer-events-none" />
              <div className="absolute inset-5 rounded-full border border-slate-500/20 pointer-events-none" />
              {/* Brushed titanium inner ring */}
              <div className="absolute inset-9 rounded-full border border-slate-300/15 pointer-events-none shadow-[inset_0_0_18px_rgba(0,0,0,0.6)]" />
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
                {/* 60 fine mil ticks */}
                {[...Array(60)].map((_, i) => {
                  const a = (i * 6) * Math.PI / 180;
                  const r1 = 88, r2 = i % 5 === 0 ? 80 : 84;
                  return (
                    <line
                      key={i}
                      x1={100 + r1 * Math.sin(a)}
                      y1={100 - r1 * Math.cos(a)}
                      x2={100 + r2 * Math.sin(a)}
                      y2={100 - r2 * Math.cos(a)}
                      stroke={i % 5 === 0 ? '#D1D5DB' : '#6B7280'}
                      strokeWidth={i % 5 === 0 ? 1.2 : 0.5}
                      opacity={i % 5 === 0 ? 0.9 : 0.5}
                    />
                  );
                })}
                {/* Subtle crosshair */}
                <line x1="14" y1="100" x2="186" y2="100" stroke="#9CA3AF" strokeWidth="0.4" strokeDasharray="4 4" opacity="0.5" />
                <line x1="100" y1="14" x2="100" y2="186" stroke="#9CA3AF" strokeWidth="0.4" strokeDasharray="4 4" opacity="0.5" />
              </svg>
            </>
          )}

          {/* Vastu Grid Overlay (for Vedic/Dark/Any when enabled) */}
          {vastuGridEnabled && (
            <>
              {/* Diagonal cross lines — always shown (Minimal keeps only these lines) */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-white/10" />
                <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-white/10" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 rotate-45 bg-white/10" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 -rotate-45 bg-white/10" />
              </div>

              {/* Direction labels — hidden for minimal_onyx */}
              {styleId !== 'minimal_onyx' && (
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
            </>
          )}

          {/* Dial Tick Marks (72 ticks for 5-degree increments) */}
          {[...Array(72)].map((_, i) => {
            const deg = i * 5;
            const isMajor = deg % 45 === 0;
            const isMid = deg % 15 === 0;

            // Variant-based tick colors (ios_compass / color_palette)
            const vTickMajor = activeVariant?.tickMajorColor;
            const vTickMid = activeVariant?.tickMidColor;
            const vTickMinor = activeVariant?.tickMinorColor;

            return (
              <div key={deg} className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: `rotate(${deg}deg)` }}>
                <div className={cn(
                  "rounded-full mt-2",
                    isMajor
                    ? (vTickMajor
                        ? `w-[2.5px] h-3.5`
                        : styleId === 'cyberpunk' ? "w-[2.5px] h-3.5 bg-cyan-400 shadow-[0_0_6px_#00F0FF]"
                        : styleId === 'tactical_ops' ? "w-[2.5px] h-3.5 bg-orange-500 shadow-[0_0_6px_#F97316]"
                        : isNautical ? "w-[2.5px] h-3.5 bg-[#8C5824]"
                        : styleId === 'royal_gold' ? "w-[2.5px] h-4 bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.6)]"
                        : styleId === 'sandalwood' ? "w-[2.5px] h-3.5 bg-[#8C6239] shadow-[0_0_4px_rgba(140,98,57,0.4)]"
                        : isGraphite ? "w-[2.5px] h-3.5 bg-[#D1D5DB] shadow-[0_0_5px_rgba(209,213,219,0.5)]"
                        : "w-[2.5px] h-3.5 bg-[#EF4444] shadow-sm")
                    : isMid
                    ? (vTickMid
                        ? "w-[1.8px] h-2.5"
                        : styleId === 'cyberpunk' ? "w-[1.8px] h-3 bg-magenta-400/80"
                        : styleId === 'royal_gold' ? "w-[1.8px] h-3 bg-amber-400/90 shadow-[0_0_4px_rgba(245,158,11,0.5)]"
                        : isNautical ? "w-[1.5px] h-2.5 bg-[#8C5824]"
                        : styleId === 'sandalwood' ? "w-[1.8px] h-2.5 bg-[#8C6239]/60"
                        : isGraphite ? "w-[1.8px] h-2.5 bg-[#9CA3AF]/80"
                        : "w-[1.8px] h-2.5 bg-white/60")
                    : (vTickMinor
                        ? "w-[1px] h-1.5"
                        : styleId === 'cyberpunk' ? "w-[1px] h-1.5 bg-cyan-400/30"
                        : isNautical ? "w-[1px] h-1.5 bg-[#8C5824]/40"
                        : styleId === 'royal_gold' ? "w-[1px] h-1.5 bg-amber-400/35"
                        : styleId === 'sandalwood' ? "w-[1px] h-1.5 bg-[#8C6239]/30"
                        : isGraphite ? "w-[1px] h-1.5 bg-[#6B7280]/40"
                        : "w-[1px] h-1.5 bg-white/25")
                )}
                  style={vTickMajor && isMajor ? { backgroundColor: vTickMajor } : vTickMid && isMid ? { backgroundColor: vTickMid } : vTickMinor && !isMajor && !isMid ? { backgroundColor: vTickMinor } : undefined}
                />
              </div>
            );
          })}

          {/* 30-Degree Numerical Labels */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <div key={deg} className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: `rotate(${deg}deg)` }}>
              <div className="flex flex-col items-center select-none mt-1">
                <span className={cn(
                  "font-mono font-bold text-[0.52rem] drop-shadow-md",
                  styleId === 'cyberpunk' ? "text-cyan-300 font-mono" :
                  styleId === 'vedic_mandala' ? "text-amber-200" :
                  styleId === 'tactical_ops' ? "text-green-400 font-mono" :
                  styleId === 'cosmic_galaxy' ? "text-indigo-200" :
                  styleId === 'royal_gold' ? "text-[#E8C547]/85 font-semibold" :
                  isGraphite ? "text-slate-300 font-semibold" :
                  activeVariant?.degreeColor ? activeVariant.degreeColor : "text-stone-300 font-semibold"
                )}>
                  {deg}
                </span>
              </div>
            </div>
          ))}

          {/* Cardinal Badges */}
          {styleId === 'sandalwood' ? (
            [
              { en: 'N', hi: 'उत्तर', deg: 0, isCardinal: true },
              { en: 'NE', hi: 'ईशान्य', deg: 45, isCardinal: false },
              { en: 'E', hi: 'पूर्व', deg: 90, isCardinal: true },
              { en: 'SE', hi: 'आग्नेय', deg: 135, isCardinal: false },
              { en: 'S', hi: 'दक्षिण', deg: 180, isCardinal: true },
              { en: 'SW', hi: 'नैऋत्य', deg: 225, isCardinal: false },
              { en: 'W', hi: 'पश्चिम', deg: 270, isCardinal: true },
              { en: 'NW', hi: 'वायव्य', deg: 315, isCardinal: false }
            ].map((pt) => (
              <div key={pt.deg} className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: `rotate(${pt.deg}deg)` }}>
                <div className="flex flex-col items-center select-none mt-4">
                  {pt.isCardinal && (
                    <div className="w-1 h-3 bg-red-600 mb-0.5 rounded-full shadow-sm" />
                  )}
                  <span className={cn(
                    "font-serif font-black tracking-tight leading-none",
                    pt.isCardinal ? "text-red-700 text-sm font-black" : "text-[#4A2E16] text-xs font-bold"
                  )}>
                    {pt.en}
                  </span>
                  <span className="font-serif font-bold text-[8.5px] text-[#5C3A1E] leading-none mt-0.5 tracking-tight">
                    {pt.hi}
                  </span>
                  {pt.isCardinal && (
                    <span className="font-mono text-[7px] font-bold text-red-600 mt-0.5">
                      {pt.deg}°
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            cardinalPoints.map((pt) => (
              <div key={pt.deg} className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: `rotate(${pt.deg}deg)` }}>
                <div className={cn(
                  "flex flex-col items-center select-none",
                  styleId === 'vedic_mandala' ? "mt-2" : "mt-5"
                )}>
                  {styleId === 'vedic_mandala' && pt.isNorth && (
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-600 drop-shadow-[0_0_8px_#ef4444] mb-0.5" />
                  )}
                  <span className={cn(
                    "font-black tracking-tight",
                    pt.isNorth
                      ? "text-[#EF4444] text-base font-black scale-110 drop-shadow-[0_0_8px_#ef4444] animate-pulse-subtle"
                      : styleId === 'vedic_mandala'
                      ? "text-white text-base font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                      : styleId === 'satellite_earth'
                      ? (['NE', 'SE', 'SW', 'NW'].includes(pt.code) ? "text-[#00F0FF] text-sm font-black drop-shadow-[0_0_8px_#00f0ff]" : "text-white text-sm font-black")
                      : styleId === 'cyberpunk'
                      ? "text-cyan-300 text-sm"
                      : styleId === 'tactical_ops'
                      ? "text-green-400 text-sm"
                      : styleId === 'royal_gold'
                      ? (pt.isNorth ? "text-[#F7E8A0] text-base font-black drop-shadow-[0_0_8px_rgba(212,175,55,0.7)]" : "text-[#D4AF37] text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]")
                      : isGraphite
                      ? "text-slate-200 text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                      : activeVariant?.cardinalColor
                      ? activeVariant.cardinalColor
                      : ""
                  )}>
                    {pt.label}
                  </span>
                </div>
              </div>
            ))
          )}

          {/* Sun Badge (Real-time Solar Position) — hidden for minimal_onyx */}
          {sunPos !== null && styleId !== 'minimal_onyx' && (
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

      {/* Orbiting Satellite for satellite_earth theme */}
      {styleId === 'satellite_earth' && (
        <div className="absolute inset-0 rounded-full pointer-events-none z-15 overflow-visible">
          {/* Satellite orbit path (faint trail) */}
          <div className="absolute inset-6 rounded-full border border-cyan-500/10 pointer-events-none" style={{ borderStyle: 'dashed', borderWidth: '0.5px' }} />
          
          {/* Primary satellite - orbits clockwise along outer ring */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ animation: 'spin 12s linear infinite' }}
          >
            <div style={{ transform: 'translateY(-152px)' }}>
              <svg
                className="animate-satellite-blink"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                style={{ filter: 'drop-shadow(0 0 6px rgba(0,240,255,0.9))' }}
              >
                <rect x="9" y="9" width="6" height="6" rx="1" fill="#00F0FF" stroke="#0891B2" strokeWidth="0.5" />
                <rect x="2" y="10.5" width="6" height="3" rx="0.5" fill="#164E63" stroke="#00F0FF" strokeWidth="0.3" />
                <rect x="16" y="10.5" width="6" height="3" rx="0.5" fill="#164E63" stroke="#00F0FF" strokeWidth="0.3" />
                <line x1="12" y1="9" x2="12" y2="5" stroke="#00F0FF" strokeWidth="0.6" />
                <circle cx="12" cy="4.5" r="0.8" fill="#00F0FF" />
                <line x1="3.5" y1="10.5" x2="3.5" y2="13.5" stroke="#00F0FF" strokeWidth="0.2" opacity="0.5" />
                <line x1="5" y1="10.5" x2="5" y2="13.5" stroke="#00F0FF" strokeWidth="0.2" opacity="0.5" />
                <line x1="6.5" y1="10.5" x2="6.5" y2="13.5" stroke="#00F0FF" strokeWidth="0.2" opacity="0.5" />
                <line x1="17.5" y1="10.5" x2="17.5" y2="13.5" stroke="#00F0FF" strokeWidth="0.2" opacity="0.5" />
                <line x1="19" y1="10.5" x2="19" y2="13.5" stroke="#00F0FF" strokeWidth="0.2" opacity="0.5" />
                <line x1="20.5" y1="10.5" x2="20.5" y2="13.5" stroke="#00F0FF" strokeWidth="0.2" opacity="0.5" />
              </svg>
            </div>
          </div>
          
          {/* Secondary satellite - orbits counter-clockwise on inner ring */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ animation: 'spin 18s linear infinite reverse' }}
          >
            <div style={{ transform: 'translateY(-115px)' }}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                style={{ opacity: 0.55, filter: 'drop-shadow(0 0 4px rgba(0,240,255,0.6))' }}
              >
                <rect x="9" y="9" width="6" height="6" rx="1" fill="#22D3EE" stroke="#0891B2" strokeWidth="0.5" />
                <rect x="2" y="10.5" width="6" height="3" rx="0.5" fill="#0E7490" stroke="#22D3EE" strokeWidth="0.3" />
                <rect x="16" y="10.5" width="6" height="3" rx="0.5" fill="#0E7490" stroke="#22D3EE" strokeWidth="0.3" />
                <line x1="12" y1="9" x2="12" y2="6" stroke="#22D3EE" strokeWidth="0.6" />
                <circle cx="12" cy="5.5" r="0.6" fill="#22D3EE" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Stationary Center Needle Overlay (enabled: show style-specific center needles) */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none flex items-center justify-center overflow-visible z-20"
        style={{
          transform: `translate3d(${roll * 0.15}px, ${-pitch * 0.15}px, 0px)`
        }}
      >
        <div className="absolute inset-0 pointer-events-none items-center justify-center">
          
          {/* 1. Ornate Spear Needle (Nautical) */}
          {activeVariant?.needleType === 'ornate_spear' && (
            <svg className="w-full h-full p-2.5 drop-shadow-[0_8px_24px_rgba(78,53,36,0.95)]" viewBox="0 0 200 200">
              <polygon points="100,190 90,100 100,112" fill="#8C6239" />
              <polygon points="100,190 110,100 100,112" fill="#4E3524" />
              <line x1="100" y1="112" x2="100" y2="188" stroke="#D4AF37" strokeWidth="1" opacity="0.7" />

              <polygon points={`100,${apexY} 88,100 100,88`} fill="#EF4444" className="drop-shadow-[0_0_16px_rgba(239,68,68,0.85)]" />
              <polygon points={`100,${apexY} 112,100 100,88`} fill="#B91C1C" />
              <line x1="100" y1={apexY} x2="100" y2="88" stroke="#FDE047" strokeWidth="1.6" />

              <circle cx="100" cy="100" r="15" fill="none" stroke="#C29B70" strokeWidth="2.5" className="drop-shadow-md" />
              <circle cx="100" cy="100" r="12" fill="none" stroke="#FDE047" strokeWidth="0.8" opacity="0.8" />
            </svg>
          )}

          {/* 2. Cyberpunk Laser HUD Needle */}
          {styleId === 'cyberpunk' && (
            <svg className="w-full h-full p-2.5 drop-shadow-[0_0_20px_rgba(0,240,255,0.8)]" viewBox="0 0 200 200">
                <line x1="100" y1={apexY} x2="100" y2="70" stroke="#00F0FF" strokeWidth="3" strokeLinecap="round" className="animate-pulse" />
                <polygon points={`100,${apexY} 92,${apexY + 20} 108,${apexY + 20}`} fill="#00F0FF" />
              <line x1="100" y1="130" x2="100" y2="180" stroke="#FF0055" strokeWidth="2.5" strokeDasharray="3 3" />
              <circle cx="100" cy="100" r="18" fill="none" stroke="#00F0FF" strokeWidth="1.5" strokeDasharray="5 3" />
              <circle cx="100" cy="100" r="12" fill="none" stroke="#FF0055" strokeWidth="1" />
            </svg>
          )}

          {/* 3. Tactical Reticle Needle */}
          {styleId === 'tactical_ops' && (
            <svg className="w-full h-full p-2.5 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]" viewBox="0 0 200 200">
              <polygon points={`100,${apexY} 88,76 100,64`} fill="#22C55E" />
              <polygon points={`100,${apexY} 100,64 112,76`} fill="#15803D" />
              <line x1="100" y1="64" x2="100" y2="136" stroke="#F97316" strokeWidth="1.5" strokeDasharray="2 2" />
              <polygon points="100,176 92,136 100,144" fill="#374151" />
              <polygon points="100,176 100,144 108,136" fill="#1F2937" />
              <circle cx="100" cy="100" r="16" fill="none" stroke="#22C55E" strokeWidth="1.5" />
            </svg>
          )}

          {/* 4. Minimal Stealth Pointer */}
          {styleId === 'minimal_onyx' && (
            <div className="absolute top-4 flex flex-col items-center z-30">
              <div className="w-[4px] h-10 bg-gradient-to-b from-red-500 to-orange-500 rounded-full shadow-[0_0_14px_#ef4444]" />
              <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff] -mt-1" />
            </div>
          )}

          {/* 6. Cosmic Galaxy Pulsar Needle */}
          {styleId === 'cosmic_galaxy' && (
            <svg className="w-full h-full p-2.5 drop-shadow-[0_0_20px_rgba(192,132,252,0.8)]" viewBox="0 0 200 200">
              <polygon points={`100,${apexY} 86,78 100,65`} fill="#C084FC" />
              <polygon points={`100,${apexY} 100,65 114,78`} fill="#818CF8" />
              <polygon points="100,184 90,122 100,135" fill="#312E81" />
              <polygon points="100,184 100,135 110,122" fill="#1E1B4B" />
              <circle cx="100" cy="100" r="16" fill="none" stroke="#C084FC" strokeWidth="1.5" />
            </svg>
          )}

          {/* 7. Satellite Earth 3D Needle */}
          {styleId === 'satellite_earth' && (
            <svg className="w-full h-full p-2.5 drop-shadow-[0_12px_32px_rgba(0,0,0,0.95)]" viewBox="0 0 200 200">
              {/* South Dark Slate Spear */}
              <polygon points="100,188 90,100 100,110" fill="#475569" />
              <polygon points="100,188 110,100 100,110" fill="#1E293B" />

              {/* North Red Spear with Cyan Pointer */}
              <polygon points={`100,${apexY} 86,100 100,96`} fill="#EF4444" className="drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
              <polygon points={`100,${apexY} 114,100 100,96`} fill="#B91C1C" />
              <line x1="100" y1={apexY} x2="100" y2="60" stroke="#00F0FF" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_6px_#00f0ff]" />
            </svg>
          )}

          {/* 8. Vedic 32 Devta Chakra Needle — compact, high-visibility */}
          {styleId === 'vedic_mandala' && (
            <svg className="w-full h-full p-2.5 drop-shadow-[0_8px_24px_rgba(0,0,0,0.95)]" viewBox="0 0 200 200">
              {/* North compact crimson spear with gold tip */}
              <polygon points={`100,${apexY} 88,100 100,94`} fill="#EF4444" className="drop-shadow-[0_0_14px_rgba(239,68,68,0.9)]" />
              <polygon points={`100,${apexY} 112,100 100,94`} fill="#B91C1C" />
              {/* Gold tip finial */}
              <polygon points={`100,${apexY} 96,${apexY + 7} 104,${apexY + 7}`} fill="#F59E0B" stroke="#B45309" strokeWidth="0.5" />
              {/* Sacred geometry center — glowing gold ring with om dot */}
              <circle cx="100" cy="100" r="16" fill="none" stroke="#F59E0B" strokeWidth="2" className="drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
              <circle cx="100" cy="100" r="12" fill="none" stroke="#FDE047" strokeWidth="0.8" opacity="0.8" />
              <circle cx="100" cy="100" r="3" fill="#FDE047" />
            </svg>
          )}

          {/* 9. Sandalwood 3D Faceted Needle (Red & Gold North, Bronze & Gold South) */}
          {styleId === 'sandalwood' && (
            <svg className="w-full h-full p-2.5 drop-shadow-[0_8px_24px_rgba(78,53,36,0.85)]" viewBox="0 0 200 200">
              {/* South Bronze Faceted Spear */}
              <polygon points="100,188 90,100 100,110" fill="#8C6239" />
              <polygon points="100,188 110,100 100,110" fill="#52361B" />
              {/* removed vertical connector line for sandalwood (design requested) */}

              {/* North Red/Crimson Faceted Spear */}
              <polygon points={`100,${apexY} 88,100 100,96`} fill="#EF4444" className="drop-shadow-[0_0_14px_rgba(239,68,68,0.7)]" />
              <polygon points={`100,${apexY} 112,100 100,96`} fill="#B91C1C" />

              {/* Center Pivot Ring */}
              <circle cx="100" cy="100" r="14" fill="none" stroke="#D4AF37" strokeWidth="2" className="drop-shadow-md" />
              <circle cx="100" cy="100" r="11" fill="none" stroke="#FDE047" strokeWidth="0.8" opacity="0.8" />
            </svg>
          )}

          {/* 10. iOS Clean Precision Needle (Red North / White South) */}
          {(styleId === 'ios_compass' && activeVariant?.needleType === 'ios_needle') && (
            <svg className="w-full h-full p-2.5 drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]" viewBox="0 0 200 200">
              {/* South White Spear */}
              <polygon points="100,188 92,100 100,112" fill="#E2E8F0" />
              <polygon points="100,188 108,100 100,112" fill="#CBD5E1" />
              {/* North Red Spear */}
              <polygon points={`100,${apexY} 88,100 100,94`} fill="#EF4444" className="drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]" />
              <polygon points={`100,${apexY} 112,100 100,94`} fill="#B91C1C" />
              {/* White center line */}
              <line x1="100" y1={apexY} x2="100" y2="94" stroke="#FFFFFF" strokeWidth="1.4" />
              <polygon points={`100,${apexY} 97,${apexY + 12} 103,${apexY + 12}`} fill="#FFFFFF" />
              {/* Center Pivot Ring */}
              <circle cx="100" cy="100" r="14" fill="none" stroke="#64748B" strokeWidth="1.5" />
            </svg>
          )}

          {/* 10b. Metal Needle (Silver/Dark classic) */}
          {(styleId === 'ios_compass' && activeVariant?.needleType === 'metal_needle') && (
            <svg className="w-full h-full p-2.5 drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]" viewBox="0 0 200 200">
              {/* South Dark Slate Spear */}
              <polygon points="100,188 90,100 100,110" fill="#475569" />
              <polygon points="100,188 110,100 100,110" fill="#1E293B" />
              {/* North Silver Spear */}
              <polygon points={`100,${apexY} 86,100 100,96`} fill="#E2E8F0" className="drop-shadow-[0_0_10px_rgba(226,232,240,0.5)]" />
              <polygon points={`100,${apexY} 114,100 100,96`} fill="#94A3B8" />
              <line x1="100" y1={apexY} x2="100" y2="64" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
              {/* Center Pivot Ring */}
              <circle cx="100" cy="100" r="14" fill="none" stroke="#64748B" strokeWidth="2" />
              <circle cx="100" cy="100" r="10" fill="none" stroke="#94A3B8" strokeWidth="0.8" opacity="0.6" />
            </svg>
          )}

          {/* 11. Royal Gold Metallic Needle — polished brushed-gold, same structure as Steel */}
          {styleId === 'royal_gold' && (
            <svg className="w-full h-full p-2.5 drop-shadow-[0_8px_24px_rgba(0,0,0,0.7)]" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="rg-gold-n" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFF7D6" />
                  <stop offset="50%" stopColor="#E8C547" />
                  <stop offset="100%" stopColor="#B8860B" />
                </linearGradient>
                <linearGradient id="rg-gold-s" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8C5F1A" />
                  <stop offset="100%" stopColor="#4A3419" />
                </linearGradient>
              </defs>
              {/* South dark-gold split spear */}
              <polygon points="100,188 90,100 100,110" fill="url(#rg-gold-s)" />
              <polygon points="100,188 110,100 100,110" fill="#3B2A10" />
              {/* North polished-gold split spear */}
              <polygon points={`100,${apexY} 86,100 100,96`} fill="url(#rg-gold-n)" className="drop-shadow-[0_0_12px_rgba(232,197,71,0.6)]" />
              <polygon points={`100,${apexY} 114,100 100,96`} fill="#B8860B" />
              {/* Red cardinal line down the north spear */}
              <line x1="100" y1={apexY} x2="100" y2="64" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
              {/* Gold pivot rings — chronometer style */}
              <circle cx="100" cy="100" r="14" fill="none" stroke="#D4AF37" strokeWidth="2" />
              <circle cx="100" cy="100" r="10" fill="none" stroke="#F7D070" strokeWidth="0.8" opacity="0.7" />
            </svg>
          )}

          {/* 11b. Graphite Titanium Needle — sleek brushed-grey with red beacon tip */}
          {activeVariant?.needleType === 'graphite_needle' && (
            <svg className="w-full h-full p-2.5 drop-shadow-[0_8px_24px_rgba(0,0,0,0.7)]" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="gr-n" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F3F4F6" />
                  <stop offset="50%" stopColor="#D1D5DB" />
                  <stop offset="100%" stopColor="#9CA3AF" />
                </linearGradient>
                <linearGradient id="gr-s" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6B7280" />
                  <stop offset="100%" stopColor="#1F2937" />
                </linearGradient>
              </defs>
              {/* South dark graphite split spear */}
              <polygon points="100,188 90,100 100,110" fill="url(#gr-s)" />
              <polygon points="100,188 110,100 100,110" fill="#111827" />
              {/* North brushed-titanium split spear */}
              <polygon points={`100,${apexY} 86,100 100,96`} fill="url(#gr-n)" className="drop-shadow-[0_0_12px_rgba(209,213,219,0.5)]" />
              <polygon points={`100,${apexY} 114,100 100,96`} fill="#6B7280" />
              {/* Red beacon line down the north spear */}
              <line x1="100" y1={apexY} x2="100" y2="64" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
              {/* Red beacon tip */}
              <circle cx="100" cy={apexY + 2} r="2.5" fill="#EF4444" className="drop-shadow-[0_0_8px_#ef4444]" />
              {/* Graphite pivot rings */}
              <circle cx="100" cy="100" r="14" fill="none" stroke="#9CA3AF" strokeWidth="2" />
              <circle cx="100" cy="100" r="10" fill="none" stroke="#D1D5DB" strokeWidth="0.8" opacity="0.6" />
            </svg>
          )}

          {/* 12. 3D Bicolor Delta Arrow — all color_palette variants + ios_black variant */}
          {activeVariant?.needleType === 'delta_bicolor' && (
            <svg className="w-full h-full p-2.5 drop-shadow-[0_12px_28px_rgba(0,0,0,0.95)]" viewBox="0 0 200 200">
              <defs>
                {/* Left half: Color Palette uses the selected variant's theme color; iOS black keeps white/silver */}
                <linearGradient id={`needleTheme-${activeVariant.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={styleId === 'color_palette' ? activeVariant.primaryColor : '#FFFFFF'} />
                  <stop offset="60%" stopColor={styleId === 'color_palette' ? activeVariant.primaryColor : '#E2E8F0'} stopOpacity="0.75" />
                  <stop offset="100%" stopColor={styleId === 'color_palette' ? activeVariant.primaryColor : '#CBD5E1'} stopOpacity="0.55" />
                </linearGradient>
                <linearGradient id="needleCrimson" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="50%" stopColor="#DC2626" />
                  <stop offset="100%" stopColor="#991B1B" />
                </linearGradient>
              </defs>

              <polygon
                points={`100,${apexY} 78,76 100,64`}
                fill={`url(#needleTheme-${activeVariant.id})`}
                stroke={styleId === 'color_palette' ? activeVariant.primaryColor : '#94A3B8'}
                strokeWidth="0.8"
                strokeLinejoin="round"
                className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
              />
              <polygon
                points={`100,${apexY} 100,64 122,76`}
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

        {/* Center angle readout */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {styleId === 'satellite_earth' ? (
            <div className="flex flex-col items-center justify-center pointer-events-none">
              <div className="grid h-14 w-14 place-items-center rounded-full border-[4px] border-emerald-300 bg-emerald-950/90 text-sm font-black text-emerald-100 shadow-[0_0_20px_rgba(52,211,153,0.75),inset_0_0_12px_rgba(0,0,0,0.95)]">
                {displayAngle}°
              </div>
              <div className="mt-2 text-center select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
                  {displayHeading !== null ? Math.round(displayHeading) : 78}° {get16WindName(displayHeading)}
                </span>
              </div>
            </div>
          ) : styleId === 'royal_gold' ? (
            <div className="grid h-[4.25rem] w-[4.25rem] place-items-center rounded-full border-[3px] border-[#D4AF37] bg-[#15100A]/95 text-base font-black text-[#F7E8A0] shadow-[0_0_24px_rgba(212,175,55,0.7),inset_0_0_12px_rgba(212,175,55,0.15)]" style={{ borderStyle: 'double' }}>
              {displayAngle}°
            </div>
          ) : isGraphite ? (
            <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-slate-400 bg-[#0B0F14]/95 text-sm font-black text-slate-100 shadow-[0_0_18px_rgba(148,163,184,0.5),inset_0_0_12px_rgba(0,0,0,0.9)]">
              {displayAngle}°
            </div>
          ) : styleId === 'vedic_mandala' || styleId === 'sandalwood' ? (
            <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-emerald-300 bg-emerald-950/85 text-sm font-black text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.72)]">
              {displayAngle}°
            </div>
          ) : isGrouped ? (
            /* Grouped theme (ios_compass / color_palette) — use variant cardinalColor for styling */
            <div className="w-14 h-14 rounded-full relative overflow-hidden flex flex-col items-center justify-center border-2 border-emerald-300/60 bg-emerald-950/85 shadow-[0_0_18px_rgba(52,211,153,0.5)]">
              <span className="text-base font-black text-emerald-100">{displayAngle}°</span>
              <span className="mt-0.5 text-[7px] font-bold uppercase tracking-widest text-emerald-300">{get16WindName(displayHeading)}</span>
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full relative overflow-hidden flex flex-col items-center justify-center border-2 border-emerald-300 bg-emerald-950/85 shadow-[0_0_18px_rgba(52,211,153,0.72)]">
              <span className="text-base font-black text-emerald-100">{displayAngle}°</span>
              <span className="mt-0.5 text-[7px] font-bold uppercase tracking-widest text-emerald-300">{get16WindName(displayHeading)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
