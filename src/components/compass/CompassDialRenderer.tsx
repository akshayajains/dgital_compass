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
  /** Magnetic declination in degrees (from NOAA WMM) */
  declination?: number;
  /** Whether True North mode is active (adjusts declination) */
  useTrueNorth?: boolean;
  /** Target bearing for Course Deviation Indicator (CDI) */
  targetBearing?: number | null;
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
  declination = 0,
  useTrueNorth = false,
  targetBearing,
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
  // Minimal Onyx is now an iOS Compass variant (was a standalone theme)
  const isMinimalOnyx = styleId === 'ios_compass' && variantId === 'ios_minimal';

  // ── Standalone styles that render their own center needle ──
  const STANDALONE_NEEDLE_STYLES = new Set([
    'cyberpunk', 'cosmic_galaxy',
    'satellite_earth', 'vedic_mandala', 'sandalwood', 'royal_gold',
  ] as CompassStyleId[]);

  // Grouped themes always have center needles
  const hasCenterNeedle = isGrouped ? (activeVariant?.hasCenterNeedle ?? true) : STANDALONE_NEEDLE_STYLES.has(styleId);

  // Per-style apex Y coordinate for the center needle (easier to fine-tune per-theme)
  const APEX_Y_MAP: Record<string, number> = {
    cyberpunk: 30,
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
        return 'border-[18px] sm:border-[22px] border-transparent shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_55px_rgba(212,175,55,0.65),inset_0_2px_8px_rgba(255,255,230,0.95),inset_0_-8px_20px_rgba(60,35,10,0.95)] bg-[linear-gradient(135deg,#5C380C_0%,#A87818_15%,#FFE680_35%,#FFFDF5_46%,#D4AF37_60%,#9E6C18_80%,#4A2A08_100%)] bg-origin-border';
      case 'cyberpunk':
        return 'border-[14px] sm:border-[18px] border-[#0F172A] shadow-[0_0_40px_rgba(0,240,255,0.4),inset_0_0_20px_rgba(0,240,255,0.3)] bg-gradient-to-tr from-[#020617] via-[#0b1329] to-[#020617]';
      case 'vedic_mandala':
        return 'border-[18px] sm:border-[22px] border-[#D97706] shadow-[0_20px_60px_rgba(0,0,0,0.95),inset_0_3px_8px_rgba(254,240,138,0.7),inset_0_-8px_16px_rgba(180,83,9,0.9)] bg-gradient-to-tr from-[#D97706] via-[#FBBF24] to-[#B45309]';
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
        return 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FFFDF0] via-[#FCE38A] 35%, via-[#E5B53A] 70%, to-[#9E6E18] shadow-[inset_0_0_40px_rgba(90,55,10,0.5)]';
      case 'cyberpunk':
        return 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#081226] via-[#040914] to-[#010308]';
      case 'vedic_mandala':
        return 'bg-[#0B131B]';
      case 'cosmic_galaxy':
        return 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#190F36] via-[#0E0720] to-[#05020D]';
      default:
        return 'bg-[#0A0A0A]';
    }
  };

  return (
    <div className="relative my-2 flex flex-col items-center justify-center">
      {/* Precision stationary needle — overlaid perfectly centered on the dial using inset-0.
          The needle SVG pivot is at (100,100) in 200×200 viewbox = exact geometric center.
          This div uses absolute inset-0 so it never shifts regardless of bezel border width. */}
      {!hasCenterNeedle && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
          {/* w-full h-full fills the same bounding box as the rotating dial exactly */}
          <div className="w-full h-full relative flex items-center justify-center">
            <svg
              className="absolute inset-0 w-full h-full drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)]"
              viewBox="0 0 200 200"
              style={{ pointerEvents: 'none' }}
            >
              {/* ── North half (pointing UP) — white left + crimson right, pivot at (100,100) ── */}
              {/* Tip y=24, waist at y=88..112, hub cleared at r=10 → y=90 */}
              <polygon points="100,24 86,91 100,87" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.7" strokeLinejoin="round" />
              <polygon points="100,24 114,91 100,87" fill="#EF233C" stroke="#B91C1C" strokeWidth="0.7" strokeLinejoin="round" />
              {/* 3D spinal highlight */}
              <line x1="100" y1="26" x2="100" y2="86" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />

              {/* ── South half (pointing DOWN) — silver/graphite, shorter so hub text is fully clear ── */}
              {/* Tip y=162 (not 174) keeps south blade well away from hub edge */}
              <polygon points="100,162 86,109 100,113" fill="#D1D5DB" stroke="#9CA3AF" strokeWidth="0.7" strokeLinejoin="round" />
              <polygon points="100,162 114,109 100,113" fill="#6B7280" stroke="#4B5563" strokeWidth="0.7" strokeLinejoin="round" />

              {/* ── Center jewel bearing hub — layered circles for depth ── */}
              <circle cx="100" cy="100" r="11" fill="#111827" stroke="#E5E7EB" strokeWidth="2.5" />
              <circle cx="100" cy="100" r="6"  fill="#EF233C" />
              <circle cx="100" cy="100" r="2.5" fill="#FDE047" />
            </svg>
          </div>
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
          "w-[21.5rem] h-[21.5rem] sm:w-[23.5rem] sm:h-[23.5rem] rounded-full flex items-center justify-center relative select-none cursor-grab active:cursor-grabbing touch-none",
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
              {/* Luxury 24K Gold Guilloché & Astrolabe Dial Background */}
              <div className="absolute inset-0 rounded-full pointer-events-none flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-full h-full pointer-events-none">
                  <defs>
                    {/* Metallic 24K Gold Gradients */}
                    <radialGradient id="shahi-gold-dial" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FFFDF5" />
                      <stop offset="25%" stopColor="#FFF2B8" />
                      <stop offset="55%" stopColor="#F5D061" />
                      <stop offset="82%" stopColor="#C99427" />
                      <stop offset="100%" stopColor="#8C5C0E" />
                    </radialGradient>
                    <linearGradient id="shahi-gold-rim" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="30%" stopColor="#FFE680" />
                      <stop offset="60%" stopColor="#D4AF37" />
                      <stop offset="85%" stopColor="#925E10" />
                      <stop offset="100%" stopColor="#5A3205" />
                    </linearGradient>
                    {/* Pigeon-Blood Ruby Gemstone Gradient */}
                    <radialGradient id="shahi-ruby-gem" cx="35%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#FF7597" />
                      <stop offset="25%" stopColor="#E11D48" />
                      <stop offset="70%" stopColor="#9F1239" />
                      <stop offset="100%" stopColor="#4C0519" />
                    </radialGradient>
                    {/* Petal Chiseled Gradients */}
                    <linearGradient id="shahi-petal-light" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#D4AF37" />
                      <stop offset="55%" stopColor="#FDE047" />
                      <stop offset="100%" stopColor="#FFFFFF" />
                    </linearGradient>
                    <linearGradient id="shahi-petal-shade" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#D4AF37" />
                      <stop offset="50%" stopColor="#9E6C18" />
                      <stop offset="100%" stopColor="#5A3205" />
                    </linearGradient>
                  </defs>

                  {/* Gold Sunburst Base Dial Face */}
                  <circle cx="100" cy="100" r="98" fill="url(#shahi-gold-dial)" />

                  {/* 36-Ray Precision Guilloché Sunburst Rays */}
                  {Array.from({ length: 36 }).map((_, idx) => (
                    <line
                      key={idx}
                      x1="100"
                      y1="10"
                      x2="100"
                      y2="100"
                      stroke="#8C5C0E"
                      strokeWidth={idx % 4 === 0 ? "0.65" : "0.25"}
                      opacity={idx % 4 === 0 ? "0.4" : "0.18"}
                      transform={`rotate(${idx * 10} 100 100)`}
                    />
                  ))}

                  {/* Concentric Engine-Turned Horology Guilloché Rings */}
                  <circle cx="100" cy="100" r="95" fill="none" stroke="#4A2A08" strokeWidth="0.8" opacity="0.65" />
                  <circle cx="100" cy="100" r="92" fill="none" stroke="#FFFDF0" strokeWidth="0.5" strokeDasharray="1 2" opacity="0.85" />
                  <circle cx="100" cy="100" r="85" fill="none" stroke="#6E440A" strokeWidth="0.7" opacity="0.5" />
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#8C5C0E" strokeWidth="0.4" strokeDasharray="2 3" opacity="0.4" />
                  <circle cx="100" cy="100" r="54" fill="none" stroke="#5A3205" strokeWidth="0.6" opacity="0.4" />
                  <circle cx="100" cy="100" r="36" fill="none" stroke="#4A2A08" strokeWidth="0.8" opacity="0.45" />

                  {/* 8-Point Chiseled 24K Gold Compass Star */}
                  {/* 4 Major Cardinal Petals */}
                  <polygon points="100,20 100,100 93,100" fill="url(#shahi-petal-light)" opacity="0.95" />
                  <polygon points="100,20 100,100 107,100" fill="url(#shahi-petal-shade)" opacity="0.9" />
                  <polygon points="180,100 100,100 100,93" fill="url(#shahi-petal-light)" opacity="0.9" />
                  <polygon points="180,100 100,100 100,107" fill="url(#shahi-petal-shade)" opacity="0.95" />
                  <polygon points="100,180 100,100 107,100" fill="url(#shahi-petal-light)" opacity="0.9" />
                  <polygon points="100,180 100,100 93,100" fill="url(#shahi-petal-shade)" opacity="0.95" />
                  <polygon points="20,100 100,100 100,107" fill="url(#shahi-petal-light)" opacity="0.9" />
                  <polygon points="20,100 100,100 100,93" fill="url(#shahi-petal-shade)" opacity="0.95" />

                  {/* 4 Diagonal Petals */}
                  <polygon points="154,46 100,100 96,96" fill="#FDE047" opacity="0.75" />
                  <polygon points="154,46 100,100 104,104" fill="#78350F" opacity="0.85" />
                  <polygon points="154,154 100,100 104,96" fill="#FDE047" opacity="0.75" />
                  <polygon points="154,154 100,100 96,104" fill="#78350F" opacity="0.85" />
                  <polygon points="46,154 100,100 104,104" fill="#FDE047" opacity="0.75" />
                  <polygon points="46,154 100,100 96,96" fill="#78350F" opacity="0.85" />
                  <polygon points="46,46 100,100 96,104" fill="#FDE047" opacity="0.75" />
                  <polygon points="46,46 100,100 104,96" fill="#78350F" opacity="0.85" />

                  {/* 8 Inlaid Genuine Pigeon-Blood Ruby Gemstones in 24K Gold Bezel Collets */}
                  {[
                    { cx: 100, cy: 16, isMajor: true },
                    { cx: 160, cy: 40, isMajor: false },
                    { cx: 184, cy: 100, isMajor: true },
                    { cx: 160, cy: 160, isMajor: false },
                    { cx: 100, cy: 184, isMajor: true },
                    { cx: 40, cy: 160, isMajor: false },
                    { cx: 16, cy: 100, isMajor: true },
                    { cx: 40, cy: 40, isMajor: false },
                  ].map((gem, gIdx) => (
                    <g key={gIdx} className="drop-shadow-[0_2px_6px_rgba(60,25,5,0.75)]">
                      <circle cx={gem.cx} cy={gem.cy} r={gem.isMajor ? "5.5" : "4.2"} fill="#4A2A08" />
                      <circle cx={gem.cx} cy={gem.cy} r={gem.isMajor ? "4.5" : "3.4"} fill="#FDE047" stroke="#92400E" strokeWidth="0.6" />
                      <circle cx={gem.cx} cy={gem.cy} r={gem.isMajor ? "3.2" : "2.4"} fill="url(#shahi-ruby-gem)" />
                      <ellipse cx={gem.cx - (gem.isMajor ? 0.9 : 0.6)} cy={gem.cy - (gem.isMajor ? 0.9 : 0.6)} rx={gem.isMajor ? "1" : "0.7"} ry={gem.isMajor ? "0.6" : "0.4"} fill="#FFFFFF" opacity="0.9" />
                    </g>
                  ))}
                </svg>
              </div>
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
              {/* Inner Circle Ambient Rings */}
              <div className="absolute inset-16 rounded-full border border-amber-400/30 pointer-events-none shadow-[0_0_15px_rgba(245,158,11,0.25)]" />
              <div className="absolute inset-24 rounded-full border border-amber-500/20 pointer-events-none" />

              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
                {/* 32 Vastu Devta Outer Annular Ring Sectors */}
                {VASTU_32_PADAS.map((pada) => (
                  <g key={pada.code} transform={`rotate(${pada.centerDeg}, 100, 100)`}>
                    {/* Sector Arc Background */}
                    <path
                      d="M 90.69,5.46 A 95,95 0 0,1 109.31,5.46 L 106.57,33.32 A 67,67 0 0,0 93.43,33.32 Z"
                      fill={pada.isAuspicious ? '#047857' : pada.color}
                      stroke={pada.isAuspicious ? '#FCD34D' : '#92400E'}
                      strokeWidth={pada.isAuspicious ? '0.75' : '0.35'}
                      opacity={pada.isAuspicious ? 0.98 : 0.88}
                    />

                    {/* Pada Code: N3*, E1, etc. */}
                    <text
                      x="100"
                      y="11.5"
                      textAnchor="middle"
                      fill={pada.isAuspicious ? '#FEF08A' : '#FDE047'}
                      fontSize="3.5"
                      fontWeight="900"
                    >
                      {pada.code}
                    </text>

                    {/* Hindi/Sanskrit Deity Name */}
                    <text
                      x="100"
                      y="18.5"
                      textAnchor="middle"
                      fill={pada.isAuspicious ? '#FFFFFF' : '#F8FAFC'}
                      fontSize="4.2"
                      fontWeight="800"
                    >
                      {pada.nameHi}
                    </text>

                    {/* English Deity Name */}
                    <text
                      x="100"
                      y="25.2"
                      textAnchor="middle"
                      fill={pada.isAuspicious ? '#A7F3D0' : '#94A3B8'}
                      fontSize="2.7"
                      fontWeight="600"
                    >
                      {pada.nameEn}
                    </text>
                  </g>
                ))}

                {/* Inner Double Boundary Ring with Beaded Accents */}
                <circle cx="100" cy="100" r="67" fill="none" stroke="#F59E0B" strokeWidth="0.9" />
                <circle cx="100" cy="100" r="65" fill="none" stroke="#D97706" strokeWidth="0.4" strokeDasharray="1.2 2.2" />

                {/* 16-Petal Shodasha Dala Padma (16 Vastu Directions / Kalas) */}
                {Array.from({ length: 16 }).map((_, i) => (
                  <path
                    key={`lotus16-${i}`}
                    d="M 100,35 C 95,46 95,54 100,64 C 105,54 105,46 100,35 Z"
                    fill="rgba(245, 158, 11, 0.05)"
                    stroke="#F59E0B"
                    strokeWidth="0.45"
                    transform={`rotate(${i * 22.5}, 100, 100)`}
                  />
                ))}

                {/* 8-Petal Ashta Dala Padma (Ashta Dikpalas) */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <path
                    key={`lotus8-${i}`}
                    d="M 100,52 C 94,62 94,70 100,76 C 106,70 106,62 100,52 Z"
                    fill="rgba(254, 240, 138, 0.08)"
                    stroke="#FDE047"
                    strokeWidth="0.55"
                    transform={`rotate(${i * 45}, 100, 100)`}
                  />
                ))}

                {/* Sanskrit Cardinal Direction Labels inside the Sacred Lotus */}
                <text x="100" y="46" textAnchor="middle" fill="#EF4444" fontSize="4.2" fontWeight="900" className="drop-shadow-[0_0_6px_#ef4444]">उत्तर</text>
                <text x="154" y="101.5" textAnchor="middle" fill="#FDE047" fontSize="4.2" fontWeight="900" className="drop-shadow-[0_0_6px_rgba(245,158,11,0.7)]">पूर्व</text>
                <text x="100" y="157" textAnchor="middle" fill="#FDE047" fontSize="4.2" fontWeight="900" className="drop-shadow-[0_0_6px_rgba(245,158,11,0.7)]">दक्षिण</text>
                <text x="46" y="101.5" textAnchor="middle" fill="#FDE047" fontSize="4.2" fontWeight="900" className="drop-shadow-[0_0_6px_rgba(245,158,11,0.7)]">पश्चिम</text>

                {/* Central Sacred Sri Yantra Concentric Rings & Interlocking Triangles */}
                <circle cx="100" cy="100" r="26" fill="rgba(11, 19, 27, 0.85)" stroke="#F59E0B" strokeWidth="0.75" />
                <circle cx="100" cy="100" r="23" fill="none" stroke="#FDE047" strokeWidth="0.35" strokeDasharray="1 1.5" />
                {/* Shiva Triangles (Upward) */}
                <polygon points="100,78 82,111 118,111" fill="none" stroke="#F59E0B" strokeWidth="0.5" />
                <polygon points="100,83 87,108 113,108" fill="none" stroke="#FBBF24" strokeWidth="0.4" />
                {/* Shakti Triangles (Downward) */}
                <polygon points="100,122 82,89 118,89" fill="none" stroke="#EF4444" strokeWidth="0.5" />
                <polygon points="100,117 87,92 113,92" fill="none" stroke="#F87171" strokeWidth="0.4" />
                {/* Inner Bindu Ring */}
                <circle cx="100" cy="100" r="5" fill="none" stroke="#FDE047" strokeWidth="0.45" />
                <circle cx="100" cy="100" r="1.8" fill="#FDE047" />
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
              {(styleId as string) !== 'minimal_onyx' && !isMinimalOnyx && (
              <>
              <div className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: 'rotate(45deg)' }}>
                <div className="flex flex-col items-center mt-14 select-none">
                  <div className={cn("w-1.5 h-1.5 rounded-full mb-0.5", styleId === 'royal_gold' ? "bg-[#88001B] shadow-[0_0_6px_#e11d48]" : "bg-amber-400 shadow-[0_0_6px_#f59e0b]")} />
                  <span className={cn("text-[9px] font-black leading-none", styleId === 'royal_gold' ? "text-[#3B1F05] drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]" : "text-amber-400")}>{isHi ? 'ईशान' : 'NE'}</span>
                  <span className={cn("text-[7.5px] font-bold tracking-wide leading-none mt-0.5", styleId === 'royal_gold' ? "text-[#6E420C]" : "text-amber-300/90")}>{isHi ? 'मंदिर' : 'Temple'}</span>
                </div>
              </div>

              <div className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: 'rotate(135deg)' }}>
                <div className="flex flex-col items-center mt-14 select-none">
                  <div className={cn("w-1.5 h-1.5 rounded-full mb-0.5", styleId === 'royal_gold' ? "bg-[#88001B] shadow-[0_0_6px_#e11d48]" : "bg-orange-400 shadow-[0_0_6px_#f97316]")} />
                  <span className={cn("text-[9px] font-black leading-none", styleId === 'royal_gold' ? "text-[#3B1F05] drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]" : "text-orange-400")}>{isHi ? 'आग्नेय' : 'SE'}</span>
                  <span className={cn("text-[7.5px] font-bold tracking-wide leading-none mt-0.5", styleId === 'royal_gold' ? "text-[#6E420C]" : "text-orange-300/90")}>{isHi ? 'रसोई' : 'Kitchen'}</span>
                </div>
              </div>

              <div className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: 'rotate(225deg)' }}>
                <div className="flex flex-col items-center mt-14 select-none">
                  <div className={cn("w-1.5 h-1.5 rounded-full mb-0.5", styleId === 'royal_gold' ? "bg-[#88001B] shadow-[0_0_6px_#e11d48]" : "bg-yellow-400 shadow-[0_0_6px_#eab308]")} />
                  <span className={cn("text-[9px] font-black leading-none", styleId === 'royal_gold' ? "text-[#3B1F05] drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]" : "text-yellow-400")}>{isHi ? 'नैऋत्य' : 'SW'}</span>
                  <span className={cn("text-[7.5px] font-bold tracking-wide leading-none mt-0.5", styleId === 'royal_gold' ? "text-[#6E420C]" : "text-yellow-300/90")}>{isHi ? 'शयन' : 'Master'}</span>
                </div>
              </div>

              <div className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: 'rotate(315deg)' }}>
                <div className="flex flex-col items-center mt-14 select-none">
                  <div className={cn("w-1.5 h-1.5 rounded-full mb-0.5", styleId === 'royal_gold' ? "bg-[#88001B] shadow-[0_0_6px_#e11d48]" : "bg-sky-400 shadow-[0_0_6px_#38bdf8]")} />
                  <span className={cn("text-[9px] font-black leading-none", styleId === 'royal_gold' ? "text-[#3B1F05] drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]" : "text-sky-400")}>{isHi ? 'वायव्य' : 'NW'}</span>
                  <span className={cn("text-[7.5px] font-bold tracking-wide leading-none mt-0.5", styleId === 'royal_gold' ? "text-[#6E420C]" : "text-sky-300/90")}>{isHi ? 'अतिथि' : 'Guest'}</span>
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
                        : isNautical ? "w-[2.5px] h-3.5 bg-[#8C5824]"
                        : styleId === 'royal_gold' ? "w-[2.5px] h-4 bg-[#3E2205] shadow-[0_0_3px_rgba(255,255,255,0.6)]"
                        : styleId === 'sandalwood' ? "w-[2.5px] h-3.5 bg-[#8C6239] shadow-[0_0_4px_rgba(140,98,57,0.4)]"
                        : isGraphite ? "w-[2.5px] h-3.5 bg-[#D1D5DB] shadow-[0_0_5px_rgba(209,213,219,0.5)]"
                        : "w-[2.5px] h-3.5 bg-[#EF4444] shadow-sm")
                    : isMid
                    ? (vTickMid
                        ? "w-[1.8px] h-2.5"
                        : styleId === 'cyberpunk' ? "w-[1.8px] h-3 bg-magenta-400/80"
                        : styleId === 'royal_gold' ? "w-[1.8px] h-3 bg-[#5C360A]"
                        : isNautical ? "w-[1.5px] h-2.5 bg-[#8C5824]"
                        : styleId === 'sandalwood' ? "w-[1.8px] h-2.5 bg-[#8C6239]/60"
                        : isGraphite ? "w-[1.8px] h-2.5 bg-[#9CA3AF]/80"
                        : "w-[1.8px] h-2.5 bg-white/60")
                    : (vTickMinor
                        ? "w-[1px] h-1.5"
                        : styleId === 'cyberpunk' ? "w-[1px] h-1.5 bg-cyan-400/30"
                        : isNautical ? "w-[1px] h-1.5 bg-[#8C5824]/40"
                        : styleId === 'royal_gold' ? "w-[1px] h-1.5 bg-[#78470E]/70"
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
          {styleId !== 'vedic_mandala' && [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <div key={deg} className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: `rotate(${deg}deg)` }}>
              <div className="flex flex-col items-center select-none mt-1">
                <span className={cn(
                  "font-mono font-bold text-[0.52rem] drop-shadow-md",
                  styleId === 'cyberpunk' ? "text-cyan-300 font-mono" :
                  styleId === 'cosmic_galaxy' ? "text-indigo-200" :
                  styleId === 'royal_gold' ? "text-[#3B1F05] font-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]" :
                  isGraphite ? "text-slate-300 font-semibold" :
                  activeVariant?.degreeColor ? activeVariant.degreeColor : "text-stone-300 font-semibold"
                )}>
                  {deg}
                </span>
              </div>
            </div>
          ))}

          {/* Cardinal Badges */}
          {styleId === 'vedic_mandala' ? null : styleId === 'sandalwood' ? (
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
                <div className="flex flex-col items-center select-none mt-5">
                  <span className={cn(
                    "font-black tracking-tight",
                    styleId === 'royal_gold'
                      ? (pt.isNorth
                          ? "text-[#4A0208] text-lg font-black font-serif drop-shadow-[0_1px_0px_#FFFFFF] drop-shadow-[0_0_2px_#FDE047] scale-110"
                          : "text-[#2D1603] text-sm font-black font-serif drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]")
                      : pt.isNorth
                      ? "text-[#EF4444] text-base font-black scale-110 drop-shadow-[0_0_8px_#ef4444] animate-pulse-subtle"
                      : styleId === 'satellite_earth'
                      ? (['NE', 'SE', 'SW', 'NW'].includes(pt.code) ? "text-[#00F0FF] text-sm font-black drop-shadow-[0_0_8px_#00f0ff]" : "text-white text-sm font-black")
                      : styleId === 'cyberpunk'
                      ? "text-cyan-300 text-sm"
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
          {sunPos !== null && (styleId as string) !== 'minimal_onyx' && !isMinimalOnyx && (
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

          {/* Target Bearing Reticle on Dial */}
          {targetBearing !== null && targetBearing !== undefined && !isQiblaMode && (
            <div className="absolute inset-0 flex justify-center pointer-events-none" style={{ transform: `rotate(${targetBearing}deg)` }}>
              <div className="flex flex-col items-center mt-3 z-30 animate-pulse">
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[9px] border-t-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.9)]" />
                <span className="px-1.5 py-0.5 mt-0.5 rounded-full text-[7.5px] font-black bg-amber-500 text-stone-950 shadow-md">
                  {Math.round(targetBearing)}°
                </span>
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

      {/* Stationary Center Needle Overlay — permanently fixed at central pivot with zero drift */}
      <div className="absolute inset-0 rounded-full pointer-events-none flex items-center justify-center overflow-visible z-20">
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          
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

          {/* 3. Minimal Stealth Pointer (for iOS Minimal Onyx variant) */}
          {isMinimalOnyx && (
            <div className="absolute inset-x-0 top-4 flex flex-col items-center pointer-events-none z-30">
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

          {/* 8. Vedic 32 Devta Sacred Surya Trishul & Sudarshana Lance Needle */}
          {styleId === 'vedic_mandala' && (
            <svg className="w-full h-full p-2.5 drop-shadow-[0_8px_24px_rgba(0,0,0,0.95)]" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="vedicTrishulGold" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFF2A3" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#B45309" />
                </linearGradient>
                <linearGradient id="vedicRubySpine" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FF4D4D" />
                  <stop offset="100%" stopColor="#990000" />
                </linearGradient>
                <radialGradient id="vedicRubyGem" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FF6B6B" />
                  <stop offset="70%" stopColor="#B91C1C" />
                  <stop offset="100%" stopColor="#450A0A" />
                </radialGradient>
              </defs>

              {/* South Dark Bronze & Slate Spear with Golden Crescent */}
              <polygon points="100,186 92,100 100,108" fill="#475569" />
              <polygon points="100,186 108,100 100,108" fill="#1E293B" />
              {/* South Crescent Finial */}
              <path d="M 93,186 C 96,183 104,183 107,186 C 104,188 96,188 93,186 Z" fill="#D97706" />

              {/* North Sacred Multifaceted Spear */}
              {/* Left facet - Bright Gold */}
              <polygon points={`100,${apexY} 90,100 100,95`} fill="#FDE047" className="drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
              {/* Right facet - Deep Antique Gold */}
              <polygon points={`100,${apexY} 110,100 100,95`} fill="#D97706" />
              {/* Vermilion Ruby Center Spine */}
              <line x1="100" y1={apexY + 2} x2="100" y2="95" stroke="url(#vedicRubySpine)" strokeWidth="2.2" strokeLinecap="round" className="drop-shadow-[0_0_8px_#ef4444]" />

              {/* Sacred Trishul (Trident) Wings at Apex */}
              {/* Left Wing */}
              <path
                d={`M 100,${apexY + 10} Q 91,${apexY + 9} 91,${apexY + 4} Q 95,${apexY + 5} 98,${apexY + 8} Z`}
                fill="url(#vedicTrishulGold)"
                stroke="#B45309"
                strokeWidth="0.4"
                className="drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]"
              />
              {/* Right Wing */}
              <path
                d={`M 100,${apexY + 10} Q 109,${apexY + 9} 109,${apexY + 4} Q 105,${apexY + 5} 102,${apexY + 8} Z`}
                fill="url(#vedicTrishulGold)"
                stroke="#B45309"
                strokeWidth="0.4"
                className="drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]"
              />
              {/* Center Trishul Diamond Finial */}
              <polygon points={`100,${apexY} 96.5,${apexY + 6} 100,${apexY + 9} 103.5,${apexY + 6}`} fill="#FFF7ED" stroke="#F59E0B" strokeWidth="0.5" />

              {/* Sudarshana Chakra Center Pivot */}
              <circle cx="100" cy="100" r="16" fill="none" stroke="#F59E0B" strokeWidth="1.8" className="drop-shadow-[0_0_12px_rgba(245,158,11,0.9)]" />
              <circle cx="100" cy="100" r="13" fill="none" stroke="#FDE047" strokeWidth="0.6" strokeDasharray="2 1.5" />
              {/* 8 Chakra Spokes */}
              {Array.from({ length: 8 }).map((_, i) => (
                <line
                  key={`spoke-${i}`}
                  x1="100"
                  y1="87"
                  x2="100"
                  y2="93"
                  stroke="#F59E0B"
                  strokeWidth="1"
                  transform={`rotate(${i * 45}, 100, 100)`}
                />
              ))}
              {/* Ruby Gem Bindu at Center */}
              <circle cx="100" cy="100" r="6.5" fill="url(#vedicRubyGem)" stroke="#FDE047" strokeWidth="0.8" className="drop-shadow-[0_0_6px_#ef4444]" />
              <circle cx="100" cy="100" r="2" fill="#FEF08A" />
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
          {/* 11. Imperial Royal Gold Needle — Handcrafted 24K Gold with Faceted Ruby Spire & Gems */}
          {/* 11. Shahi (Royal Gold) Navratna Masterpiece Needle — 24K Sculpted Gold with Emeralds, Rubies & Diamond Crown */}
          {styleId === 'royal_gold' && (
            <svg className="w-full h-full p-2 drop-shadow-[0_16px_36px_rgba(40,20,5,0.95)]" viewBox="0 0 200 200">
              <defs>
                {/* 24K Polished Gold Blade Gradients */}
                <linearGradient id="shahi-gold-blade-l" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="25%" stopColor="#FFF2B8" />
                  <stop offset="60%" stopColor="#F5D061" />
                  <stop offset="100%" stopColor="#D4A738" />
                </linearGradient>
                <linearGradient id="shahi-gold-blade-r" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#D4A738" />
                  <stop offset="40%" stopColor="#A16207" />
                  <stop offset="80%" stopColor="#6E3B06" />
                  <stop offset="100%" stopColor="#3E1E02" />
                </linearGradient>

                {/* Deep Pigeon-Blood Burmese Ruby Gemstone Gradients */}
                <radialGradient id="shahi-ruby-cabochon" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#FFA4B6" />
                  <stop offset="25%" stopColor="#F43F5E" />
                  <stop offset="60%" stopColor="#BE123C" />
                  <stop offset="85%" stopColor="#881337" />
                  <stop offset="100%" stopColor="#4C0519" />
                </radialGradient>
                <linearGradient id="shahi-ruby-lance-l" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF4D6D" />
                  <stop offset="40%" stopColor="#E11D48" />
                  <stop offset="100%" stopColor="#9F1239" />
                </linearGradient>
                <linearGradient id="shahi-ruby-lance-r" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#BE123C" />
                  <stop offset="50%" stopColor="#881337" />
                  <stop offset="100%" stopColor="#4C0519" />
                </linearGradient>

                {/* Royal Colombian Emerald Gemstone Gradients */}
                <radialGradient id="shahi-emerald-cabochon" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#A7F3D0" />
                  <stop offset="25%" stopColor="#34D399" />
                  <stop offset="60%" stopColor="#059669" />
                  <stop offset="85%" stopColor="#047857" />
                  <stop offset="100%" stopColor="#022C22" />
                </radialGradient>

                {/* Imperial Midnight Sapphire & Gold South Spear */}
                <linearGradient id="shahi-sapphire-l" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#60A5FA" />
                  <stop offset="35%" stopColor="#2563EB" />
                  <stop offset="80%" stopColor="#1E3A8A" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>
                <linearGradient id="shahi-sapphire-r" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1E3A8A" />
                  <stop offset="50%" stopColor="#0F172A" />
                  <stop offset="100%" stopColor="#020617" />
                </linearGradient>

                {/* Diamond Sparkle Gradient */}
                <linearGradient id="shahi-diamond" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="50%" stopColor="#F8FAFC" />
                  <stop offset="100%" stopColor="#E2E8F0" />
                </linearGradient>
              </defs>

              {/* === SOUTH ARROW: IMPERIAL SAPPHIRE & 24K GOLD LANCE WITH EMERALD FINIAL === */}
              {/* South Spear Blades (stops at y=174 so it never clashes with S/दक्षिण) */}
              <polygon points="100,174 91,102 100,108" fill="url(#shahi-sapphire-l)" />
              <polygon points="100,174 109,102 100,108" fill="url(#shahi-sapphire-r)" />
              {/* 24K Gold Inlay Chevron Lines on South Spear */}
              <polyline points="93,125 100,130 107,125" fill="none" stroke="#FDE047" strokeWidth="0.8" opacity="0.85" />
              <polyline points="94,142 100,147 106,142" fill="none" stroke="#FDE047" strokeWidth="0.8" opacity="0.85" />
              {/* Royal Pierced Fleur Counterweight with Emerald Cabochon */}
              <circle cx="100" cy="158" r="5.5" fill="#FDE047" stroke="#3E1E02" strokeWidth="0.9" className="drop-shadow-md" />
              <circle cx="100" cy="158" r="3.8" fill="url(#shahi-emerald-cabochon)" stroke="#064E3B" strokeWidth="0.5" className="drop-shadow-[0_0_6px_#10b981]" />
              <ellipse cx="99" cy="156.8" rx="1.1" ry="0.7" fill="#FFFFFF" opacity="0.95" />
              <path d="M 94,166 Q 100,174 106,166 Q 100,160 94,166 Z" fill="#D4AF37" stroke="#3E1E02" strokeWidth="0.5" />

              {/* === NORTH ARROW: 24K SCULPTED GOLD LANCE, RUBY DAGGER, EMERALD WINGS & DIAMOND APEX === */}
              {/* Main 24K Gold Spear Blades */}
              <polygon points={`100,${apexY} 84,98 100,94`} fill="url(#shahi-gold-blade-l)" />
              <polygon points={`100,${apexY} 116,98 100,94`} fill="url(#shahi-gold-blade-r)" />

              {/* Filigree Shoulder Wings encrusted with Royal Emerald (पन्ना) Cabochons */}
              {/* Left Wing & Emerald */}
              <path d="M 84,98 C 76,94 76,84 84,82 C 89,84 89,94 84,98 Z" fill="#FFE680" stroke="#78350F" strokeWidth="0.8" />
              <circle cx="82" cy="88" r="4.2" fill="#D4AF37" stroke="#5A3205" strokeWidth="0.6" />
              <circle cx="82" cy="88" r="3.2" fill="url(#shahi-emerald-cabochon)" stroke="#064E3B" strokeWidth="0.5" className="drop-shadow-[0_0_8px_#10b981]" />
              <ellipse cx="81" cy="86.8" rx="0.9" ry="0.6" fill="#FFFFFF" opacity="0.95" />

              {/* Right Wing & Emerald */}
              <path d="M 116,98 C 124,94 124,84 116,82 C 111,84 111,94 116,98 Z" fill="#FFE680" stroke="#78350F" strokeWidth="0.8" />
              <circle cx="118" cy="88" r="4.2" fill="#D4AF37" stroke="#5A3205" strokeWidth="0.6" />
              <circle cx="118" cy="88" r="3.2" fill="url(#shahi-emerald-cabochon)" stroke="#064E3B" strokeWidth="0.5" className="drop-shadow-[0_0_8px_#10b981]" />
              <ellipse cx="117" cy="86.8" rx="0.9" ry="0.6" fill="#FFFFFF" opacity="0.95" />

              {/* Embedded Faceted Royal Pigeon-Blood Ruby Dagger Blade */}
              {/* Left Ruby Facet */}
              <polygon points={`100,${apexY + 5} 93,52 95,86 100,88`} fill="url(#shahi-ruby-lance-l)" className="drop-shadow-[0_0_10px_rgba(225,29,72,0.9)]" />
              {/* Right Ruby Facet */}
              <polygon points={`100,${apexY + 5} 107,52 105,86 100,88`} fill="url(#shahi-ruby-lance-r)" />

              {/* Gold Filigree Chevron Inlays along the Ruby Blade */}
              <line x1="100" y1={apexY + 5} x2="100" y2="88" stroke="#FFFDF0" strokeWidth="0.9" strokeLinecap="round" />
              <polyline points="96,56 100,60 104,56" fill="none" stroke="#FDE047" strokeWidth="0.75" opacity="0.9" />
              <polyline points="96,70 100,74 104,70" fill="none" stroke="#FDE047" strokeWidth="0.75" opacity="0.9" />

              {/* Specular Light Reflection Star on Ruby */}
              <circle cx="98.5" cy={apexY + 16} r="1.3" fill="#FFFFFF" opacity="0.95" />

              {/* Royal Teardrop Ruby right below Diamond Apex */}
              <path d={`M 100,${apexY + 4} C 97,${apexY + 8} 97,${apexY + 12} 100,${apexY + 14} C 103,${apexY + 12} 103,${apexY + 8} 100,${apexY + 4} Z`} fill="url(#shahi-ruby-cabochon)" stroke="#FFE680" strokeWidth="0.5" className="drop-shadow-[0_0_6px_#ef4444]" />

              {/* Apex Diamond Crown Finial (Koh-i-Noor Star Diamond) */}
              <polygon points={`100,${apexY - 2} 97,${apexY + 3} 100,${apexY + 6} 103,${apexY + 3}`} fill="url(#shahi-diamond)" stroke="#FDE047" strokeWidth="0.6" className="drop-shadow-[0_0_8px_#ffffff]" />
              <circle cx="100" cy={`${apexY + 2}`} r="1" fill="#FFFFFF" />

              {/* === NAVRATNA PIVOT MEDALLION (Emerald & Ruby Bezel Settings) === */}
              {/* 24K Gold Coin-Edge Hub */}
              <circle cx="100" cy="100" r="17" fill="none" stroke="#FFE680" strokeWidth="2" strokeDasharray="1.5 1.5" className="drop-shadow-[0_0_12px_rgba(212,175,55,0.8)]" />
              <circle cx="100" cy="100" r="14" fill="#D4AF37" stroke="#5A3205" strokeWidth="0.8" />
              <circle cx="100" cy="100" r="11" fill="#1E0F04" />

              {/* Central Star Ruby Gemstone */}
              <circle cx="100" cy="100" r="8.5" fill="url(#shahi-ruby-cabochon)" stroke="#FFE680" strokeWidth="1" className="drop-shadow-[0_0_14px_rgba(225,29,72,0.95)]" />
              {/* 6-Ray Asterism Star Light Refraction */}
              <line x1="92.5" y1="100" x2="107.5" y2="100" stroke="#FFA4B6" strokeWidth="0.8" opacity="0.9" />
              <line x1="96.2" y1="93.5" x2="103.8" y2="106.5" stroke="#FFA4B6" strokeWidth="0.8" opacity="0.9" />
              <line x1="96.2" y1="106.5" x2="103.8" y2="93.5" stroke="#FFA4B6" strokeWidth="0.8" opacity="0.9" />
              <circle cx="100" cy="100" r="1.5" fill="#FFFFFF" opacity="0.98" />
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

        {/* Center angle readout — clean 2-row: degree + wind name only (μ is shown below the dial) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {styleId === 'satellite_earth' ? (
            <div className="flex flex-col items-center justify-center pointer-events-none gap-1.5">
              <div className="flex flex-col items-center justify-center h-[3.75rem] w-[3.75rem] rounded-full border-[3.5px] border-emerald-300 bg-emerald-950/95 shadow-[0_0_20px_rgba(52,211,153,0.75),inset_0_0_12px_rgba(0,0,0,0.95)]">
                <span className="text-[14px] font-black font-mono text-emerald-100 leading-none">{displayAngle}°</span>
                <span className="text-[7px] font-bold uppercase tracking-widest text-emerald-400 mt-0.5">{get16WindName(displayHeading)}</span>
              </div>
              <div className="text-center select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
                  {displayHeading !== null ? Math.round(displayHeading) : 0}° {get16WindName(displayHeading)}
                </span>
              </div>
            </div>
          ) : styleId === 'royal_gold' ? (
            <div className="flex flex-col items-center justify-center h-12 w-12 rounded-full border-[2px] border-[#FFE680] bg-gradient-to-br from-[#1E0F04] via-[#120802] to-[#080301] text-[#FFF8DC] shadow-[0_4px_22px_rgba(40,20,5,0.95),inset_0_1px_4px_rgba(255,240,180,0.5)] relative">
              {/* 4 Inlaid Alternating Emerald & Ruby Gemstones */}
              <div className="absolute -top-1 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-800 border border-[#FFE680] shadow-[0_0_8px_#10b981]" />
              <div className="absolute -bottom-1 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-800 border border-[#FFE680] shadow-[0_0_8px_#10b981]" />
              <div className="absolute -left-1 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-rose-400 to-rose-800 border border-[#FFE680] shadow-[0_0_8px_#e11d48]" />
              <div className="absolute -right-1 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-rose-400 to-rose-800 border border-[#FFE680] shadow-[0_0_8px_#e11d48]" />
              <span className="text-[13px] font-black leading-none text-[#FFFDF0] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{displayAngle}°</span>
              <span className="text-[6.5px] font-bold uppercase tracking-widest text-[#FDE047] mt-0.5">{get16WindName(displayHeading)}</span>
            </div>
          ) : isGraphite ? (
            <div className="flex flex-col items-center justify-center h-14 w-14 rounded-full border-2 border-slate-400 bg-[#0B0F14]/95 text-slate-100 shadow-[0_0_18px_rgba(148,163,184,0.5),inset_0_0_12px_rgba(0,0,0,0.9)]">
              <span className="text-[15px] font-black leading-none">{displayAngle}°</span>
              <span className="text-[7px] font-bold uppercase tracking-widest text-slate-300 mt-0.5">{get16WindName(displayHeading)}</span>
            </div>
          ) : styleId === 'vedic_mandala' ? (
            <div className="flex flex-col items-center justify-center h-11 w-11 rounded-full border-[1.5px] border-amber-400 bg-gradient-to-br from-[#2E1202] via-[#180A02] to-[#0A0400] text-amber-100 shadow-[0_0_16px_rgba(245,158,11,0.7),inset_0_1px_3px_rgba(254,240,138,0.5)]">
              <span className="text-[12px] font-mono font-black leading-none text-[#FDE047] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{displayAngle}°</span>
              <span className="text-[6.5px] font-bold uppercase tracking-wider text-amber-300 mt-0.5">{get16WindName(displayHeading)}</span>
            </div>
          ) : styleId === 'sandalwood' ? (
            <div className="flex flex-col items-center justify-center h-14 w-14 rounded-full border-2 border-emerald-300 bg-emerald-950/85 shadow-[0_0_18px_rgba(52,211,153,0.72)]">
              <span className="text-[15px] font-black text-emerald-100 leading-none">{displayAngle}°</span>
              <span className="text-[7px] font-bold uppercase tracking-widest text-emerald-300 mt-0.5">{get16WindName(displayHeading)}</span>
            </div>
          ) : isGrouped ? (
            /* Grouped theme (ios_compass / color_palette) */
            <div className="w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 border-emerald-300/60 bg-emerald-950/85 shadow-[0_0_18px_rgba(52,211,153,0.5)]">
              <span className="text-[14px] font-black text-emerald-100 leading-none">{displayAngle}°</span>
              <span className="text-[7px] font-bold uppercase tracking-widest text-emerald-300 mt-0.5">{get16WindName(displayHeading)}</span>
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 border-emerald-300 bg-emerald-950/85 shadow-[0_0_18px_rgba(52,211,153,0.72)]">
              <span className="text-[14px] font-black text-emerald-100 leading-none">{displayAngle}°</span>
              <span className="text-[7px] font-bold uppercase tracking-widest text-emerald-300 mt-0.5">{get16WindName(displayHeading)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
