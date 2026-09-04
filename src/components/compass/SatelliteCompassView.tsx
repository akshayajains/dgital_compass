import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { MapPin, ExternalLink, Maximize2, Orbit, ScanSearch, Sparkles, Mountain, Gauge, Compass as CompassIcon } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { MapCompassView } from '@/components/compass/MapCompassView';

interface SatelliteCompassViewProps {
  heading: number | null;
  pitch: number;
  roll: number;
  location: { latitude: number; longitude: number; city?: string; state?: string; altitude?: number | null } | null;
  language: string;
  theme: string;
  magneticField?: number;
  onOpenLevel?: () => void;
  onOpenAR?: () => void;
  onOpenMap?: () => void;
  mode: 'standard' | 'telescope' | 'satellite' | 'map';
  onModeChange: (mode: 'standard' | 'telescope' | 'satellite' | 'map') => void;
}

export const SatelliteCompassView: React.FC<SatelliteCompassViewProps> = ({
  heading,
  pitch,
  roll,
  location,
  language,
  magneticField = 66,
  onOpenLevel,
  onOpenAR,
  onOpenMap,
  mode,
  onModeChange
}) => {
  const [internalMode, setInternalMode] = useState<'satellite' | 'map'>(mode === 'map' ? 'map' : 'satellite');
  const displayHeading = heading !== null ? ((heading % 360) + 360) % 360 : 0;
  const city = location?.city || 'Los Angeles';
  const lat = location?.latitude || 34.0522;
  const lng = location?.longitude || -118.2437;
  const currentMode = mode === 'map' || mode === 'satellite' ? mode : internalMode;
  const totalTilt = Math.sqrt(pitch * pitch + roll * roll);
  const levelQuality = totalTilt < 1 ? 'LOCKED' : totalTilt < 3 ? 'STABLE' : 'DRIFT';
  const altitudeFeet = Math.round((location?.altitude || 0) * 3.28084);
  const precisionScore = useMemo(() => Math.max(72, Math.min(99, Math.round(99 - totalTilt * 4.5))), [totalTilt]);
  const copy = language === 'hi'
    ? { telescope: 'टेलीस्कोप', satellite: 'सैटेलाइट', map: 'नक्शा', heading: 'दिशा', level: 'लेवल', altitude: 'ऊंचाई', sync: 'सिंक', fullMap: 'पूरा नक्शा', maps: 'मैप्स', magnetic: 'चुंबकीय क्षेत्र', trueHeading: 'सच्ची दिशा', axis: 'अक्ष', insight: 'प्रीमियम दिशा सुझाव', satelliteTip: 'सैटेलाइट लॉक वास्तु व्यवस्था से पहले स्थान की दिशा सत्यापित करता है।', mapTip: 'नक्शा मोड कमरे के उद्देश्य को वास्तविक दिशा से मिलाने में मदद करता है।', steady: 'आपका उपकरण कंपास, लेवल और एआर वास्तु रीडिंग के लिए स्थिर है।', holdFlat: 'अंतिम दिशा निर्णय से पहले अधिक सटीक लॉक के लिए फोन को समतल रखें।' }
    : { telescope: 'Telescope', satellite: 'Satellite', map: 'Map', heading: 'Heading', level: 'Level', altitude: 'Altitude', sync: 'Sync', fullMap: 'Full Map', maps: 'Maps', magnetic: 'Magnetic Field', trueHeading: 'True Heading', axis: 'Axis', insight: 'Premium Direction Insight', satelliteTip: 'Satellite lock helps validate site orientation before vastu placement.', mapTip: 'Map mode helps compare room intent with real-world alignment.', steady: 'Your device is steady enough for accurate compass, level, and AR vastu readings.', holdFlat: 'Hold flatter for a cleaner lock before finalizing compass or vastu decisions.' };

  const getCardinal = (deg: number) => {
    const val = Math.floor(deg / 22.5 + 0.5);
    const arr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return arr[val % 16];
  };

  const openGoogleMaps = () => {
    try { Haptics.impact({ style: ImpactStyle.Light }); } catch {}
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  return (
    <div className="w-full flex flex-col items-center select-none relative overflow-hidden rounded-[2.5rem] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.9)] my-2 min-h-[580px] bg-[#04070c]">
      <div className="absolute inset-0 z-0 overflow-hidden">
        {currentMode === 'satellite' ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=85'), url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 40%'
            }}
          />
        ) : (
          <MapCompassView heading={heading} location={location} />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_50%_70%,rgba(239,68,68,0.14),transparent_24%)]" />
        <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:28px_28px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/80" />
      </div>

      <div className="w-full z-10 pt-4 px-3 flex flex-col items-center gap-3">
        <div className="w-full flex items-center justify-between px-1">
          <div className="flex items-center gap-2 rounded-full bg-black/55 border border-white/10 px-3 py-1.5 backdrop-blur-md">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.95)]" />
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/90">
              {language === 'hi' ? 'ऑर्बिटल वास्तु सूट' : 'Orbital Vastu Suite'}
            </span>
          </div>
          <div className="rounded-full bg-black/55 border border-white/10 px-3 py-1.5 backdrop-blur-md">
            <span className="text-[10px] font-mono font-black uppercase tracking-[0.18em] text-cyan-300">{precisionScore}% {copy.sync}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/70 border border-white/15 backdrop-blur-md shadow-2xl">
          {[
            { id: 'telescope', label: copy.telescope },
            { id: 'satellite', label: copy.satellite },
            { id: 'map', label: copy.map }
          ].map((tab) => {
            const isActive = (tab.id === 'satellite' && currentMode === 'satellite') || (tab.id === 'map' && currentMode === 'map');
            return (
              <button
                key={tab.id}
                onClick={() => {
                  try { Haptics.impact({ style: ImpactStyle.Light }); } catch {}
                  if (tab.id === 'telescope') onOpenAR?.();
                  else if (tab.id === 'map') {
                    setInternalMode('map');
                    onModeChange('map');
                  } else {
                    setInternalMode('satellite');
                    onModeChange('satellite');
                  }
                }}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-300 active:scale-95",
                  isActive ? "bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white shadow-[0_0_15px_rgba(239,68,68,0.8)] scale-105" : "text-stone-300 hover:text-white hover:bg-white/10"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="w-full flex items-center justify-between px-3">
          <div className="flex items-center gap-1.5 bg-black/45 px-3 py-1.5 rounded-full border border-white/15 backdrop-blur-md shadow-md">
            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 fill-red-500 animate-pulse" />
            <span className="text-xs font-bold text-white tracking-wide drop-shadow">{city}</span>
          </div>

          <div className="flex items-center gap-2">
            {currentMode === 'map' && (
              <div className="flex items-center gap-1">
                {onOpenMap && (
                  <button onClick={onOpenMap} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600/80 hover:bg-emerald-600 border border-emerald-400/50 text-white text-[10px] font-bold shadow-md active:scale-90 transition-transform" title="Open Interactive Floor Plan & Map">
                    <Maximize2 className="w-3 h-3" />
                    <span>{copy.fullMap}</span>
                  </button>
                )}
                <button onClick={openGoogleMaps} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-600/80 hover:bg-sky-600 border border-sky-400/50 text-white text-[10px] font-bold shadow-md active:scale-90 transition-transform" title="Open in Google Maps">
                  <ExternalLink className="w-3 h-3" />
                  <span>{copy.maps}</span>
                </button>
              </div>
            )}

            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-stone-400 via-stone-200 to-white p-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.8)] flex items-center justify-center cursor-pointer active:scale-90 transition-transform" title="North Heading Indicator">
              <div className="w-full h-full rounded-full bg-[#1A222D] border border-stone-400 flex items-center justify-center relative overflow-hidden">
                <div className="w-full h-full relative flex items-center justify-center transition-transform duration-200" style={{ transform: `rotate(${-displayHeading}deg)`, willChange: 'transform' }}>
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[12px] border-b-red-600 absolute top-1.5 drop-shadow" />
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[12px] border-t-stone-300 absolute bottom-1.5" />
                  <div className="w-2 h-2 rounded-full bg-white z-10 shadow border border-stone-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full z-10 px-4 mt-1 grid grid-cols-3 gap-2">
        {[
          { label: copy.heading, value: `${Math.round(displayHeading)}° ${getCardinal(displayHeading)}`, icon: CompassIcon, tone: 'text-cyan-300' },
          { label: copy.level, value: levelQuality, icon: Gauge, tone: totalTilt < 1 ? 'text-emerald-300' : totalTilt < 3 ? 'text-amber-300' : 'text-rose-300' },
          { label: copy.altitude, value: `${altitudeFeet || 0} ft`, icon: Mountain, tone: 'text-white' }
        ].map((item) => (
          <div key={item.label} className="rounded-[1.35rem] border border-white/10 bg-black/45 px-3 py-2.5 backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">
              <item.icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </div>
            <div className={cn("mt-2 text-[12px] font-mono font-black", item.tone)}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="relative w-[21.5rem] h-[21.5rem] sm:w-[23.5rem] sm:h-[23.5rem] rounded-full flex items-center justify-center my-3 z-10">
        <div className="absolute -inset-3 rounded-full border border-cyan-300/20 bg-cyan-300/5 blur-[1px]" />
        <div className="absolute -inset-1 rounded-full border border-amber-300/25 shadow-[0_0_28px_rgba(34,211,238,0.18),inset_0_0_24px_rgba(251,191,36,0.08)]" />
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center">
          <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[16px] border-t-[#EF4444] drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]" />
          <div className="w-2 h-2 rounded-full bg-white -mt-1 shadow-[0_0_8px_#ffffff]" />
        </div>
        <div className="absolute inset-0 rounded-full border-[12px] sm:border-[14px] border-[#0F172A]/85 shadow-[0_0_40px_rgba(0,0,0,0.9),0_0_22px_rgba(34,211,238,0.18),inset_0_0_20px_rgba(255,255,255,0.12)] backdrop-blur-md bg-[conic-gradient(from_210deg,#0f172a,#164e63,#1e293b,#713f12,#0f172a)]" />
        <div className="absolute inset-3.5 rounded-full border border-white/25 pointer-events-none" />
        <div className="absolute inset-6 rounded-full border border-teal-400/30 pointer-events-none" />

        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-out pointer-events-none" style={{ transform: `rotate(${-displayHeading}deg)`, willChange: 'transform' }}>
          {[...Array(72)].map((_, i) => {
            const deg = i * 5;
            const isMajor = deg % 45 === 0;
            const isMid = deg % 15 === 0;
            return (
              <div key={deg} className="absolute inset-0 flex justify-center" style={{ transform: `rotate(${deg}deg)` }}>
                <div className={cn("rounded-full mt-4", isMajor ? "w-[2px] h-3 bg-teal-300 shadow-[0_0_8px_#2dd4bf]" : isMid ? "w-[1.5px] h-2 bg-white/70" : "w-[1px] h-1.5 bg-white/30")} />
              </div>
            );
          })}

          {[
            { l: 'N', d: 0, isRed: true },
            { l: 'NE', d: 45, isRed: false },
            { l: 'E', d: 90, isRed: false },
            { l: 'SE', d: 135, isRed: false },
            { l: 'S', d: 180, isRed: false },
            { l: 'SW', d: 225, isRed: false },
            { l: 'W', d: 270, isRed: false },
            { l: 'NW', d: 315, isRed: false }
          ].map((pt) => (
            <div key={pt.l} className="absolute inset-0 flex justify-center" style={{ transform: `rotate(${pt.d}deg)` }}>
              <div className="flex flex-col items-center select-none mt-6">
                <span className={cn("font-black font-sans tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]", pt.isRed ? "text-red-500 text-lg font-black" : pt.l.length === 1 ? "text-white text-base font-black" : "text-teal-300 text-xs font-bold")}>{pt.l}</span>
              </div>
            </div>
          ))}

          <div className="absolute inset-0 flex items-center justify-center opacity-90">
            <svg className="w-[84%] h-[84%]" viewBox="0 0 200 200">
              <polygon points="100,100 148,52 100,88" fill="#1E293B" />
              <polygon points="100,100 148,52 112,100" fill="#0F172A" />
              <polygon points="100,100 148,148 112,100" fill="#1E293B" />
              <polygon points="100,100 148,148 100,112" fill="#0F172A" />
              <polygon points="100,100 52,148 100,112" fill="#1E293B" />
              <polygon points="100,100 52,148 88,100" fill="#0F172A" />
              <polygon points="100,100 52,52 88,100" fill="#1E293B" />
              <polygon points="100,100 52,52 100,88" fill="#0F172A" />
              <polygon points="100,10 88,100 100,88" fill="#F1F5F9" />
              <polygon points="100,10 112,100 100,88" fill="#94A3B8" />
              <polygon points="100,190 88,100 100,112" fill="#475569" />
              <polygon points="100,190 112,100 100,112" fill="#1E293B" />
              <polygon points="190,100 100,88 112,100" fill="#475569" />
              <polygon points="190,100 100,112 112,100" fill="#1E293B" />
              <polygon points="10,100 100,88 88,100" fill="#475569" />
              <polygon points="10,100 100,112 88,100" fill="#1E293B" />
              <circle cx="100" cy="100" r="15" fill="#052E22" stroke="#6EE7B7" strokeWidth="3" className="drop-shadow-lg" />
              <circle cx="100" cy="100" r="10" fill="#064E3B" stroke="#34D399" strokeWidth="1" />
            </svg>
          </div>
        </div>

        <div className="absolute z-20 flex flex-col items-center justify-center pointer-events-none mt-20">
          <span className="text-xl sm:text-2xl font-black font-sans tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">{Math.round(displayHeading)}° {getCardinal(displayHeading)}</span>
        </div>
      </div>

      <div className="w-full z-10 px-3 pb-4 flex items-end justify-between gap-2 mt-auto">
        <div onClick={onOpenLevel} className="relative cursor-pointer active:scale-95 transition-transform shrink-0 flex flex-col items-center" title="Tap to open full Level & Inclinometer">
          <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full p-1 bg-gradient-to-tr from-stone-500 via-stone-200 to-white shadow-[0_10px_25px_rgba(0,0,0,0.9)] flex items-center justify-center overflow-hidden">
            <div className="w-full h-full rounded-full bg-gradient-to-b from-[#0A0D12] via-[#111827] to-[#0A0D12] border border-white/20 relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-x-0 top-1/2 h-[0.5px] bg-white/25 pointer-events-none" />
              <div className="absolute inset-y-0 left-1/2 w-[0.5px] bg-white/25 pointer-events-none" />
              <div className="w-6 h-6 rounded-full border border-white/25 pointer-events-none" />
              <span className="absolute top-1 text-[7.5px] font-black text-red-500 leading-none">0°</span>
              <span className="absolute right-1 text-[7px] font-black text-white leading-none">90°</span>
              <span className="absolute bottom-1 text-[7px] font-black text-white leading-none">180°</span>
              <span className="absolute left-1 text-[7px] font-black text-white leading-none">270°</span>
              <div className={cn("absolute w-3 h-3 rounded-full shadow-[0_0_8px_currentColor] border border-white transition-transform duration-75", totalTilt < 1 ? "bg-emerald-400 text-emerald-400 shadow-emerald-400" : "bg-red-500 text-red-500 shadow-red-500")} style={{ transform: `translate(${Math.max(-18, Math.min(18, -roll * 1.5))}px, ${Math.max(-18, Math.min(18, -pitch * 1.5))}px)` }} />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/35 rounded-full pointer-events-none" />
            </div>
          </div>
          <span className="text-[10px] font-mono font-black text-white drop-shadow mt-1">{totalTilt.toFixed(2)}°</span>
        </div>

        <div className="flex items-center gap-1.5 pb-1">
          <div className="w-14 sm:w-16 py-2 px-1 rounded-2xl bg-black/75 border border-white/15 backdrop-blur-md shadow-xl flex flex-col items-center justify-center text-center">
            <span className="text-[7.5px] uppercase font-bold text-red-500 leading-tight text-center">{copy.magnetic}</span>
            <span className="text-xs font-mono font-black text-white mt-1 leading-none">{magneticField} µT</span>
          </div>
          <div className="w-14 sm:w-16 py-2 px-1 rounded-2xl bg-black/75 border border-white/15 backdrop-blur-md shadow-xl flex flex-col items-center justify-center text-center">
            <span className="text-[7.5px] uppercase font-bold text-amber-400 leading-tight text-center">{copy.trueHeading}</span>
            <span className="text-xs font-mono font-black text-white mt-1 leading-none">{Math.round(displayHeading)} {getCardinal(displayHeading)}</span>
          </div>
          <div className="w-14 sm:w-16 py-2 px-1 rounded-2xl bg-black/75 border border-white/15 backdrop-blur-md shadow-xl flex flex-col items-center justify-center text-center">
            <span className="text-[7.5px] uppercase font-bold text-emerald-400 leading-tight text-center">{copy.axis}</span>
            <span className="text-[9px] font-mono font-black text-white mt-1 leading-none">X {(-roll * 0.1).toFixed(2)}°</span>
            <span className="text-[9px] font-mono font-black text-white mt-0.5 leading-none">Y {(pitch * 0.1).toFixed(2)}°</span>
          </div>
        </div>
      </div>

      <div className="w-full z-10 px-4 pb-4 -mt-1">
        <div className="rounded-[1.8rem] border border-white/10 bg-black/55 backdrop-blur-xl px-4 py-3 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{copy.insight}</span>
              </div>
              <p className="mt-1 text-sm font-black text-white">{currentMode === 'satellite' ? copy.satelliteTip : copy.mapTip}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-stone-300">{totalTilt < 1.2 ? copy.steady : copy.holdFlat}</p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button onClick={onOpenAR} className="flex items-center gap-1.5 rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300 active:scale-95 transition-transform">
                <ScanSearch className="w-3.5 h-3.5" />
                <span>AR</span>
              </button>
              <button onClick={onOpenMap} className="flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300 active:scale-95 transition-transform">
                <Orbit className="w-3.5 h-3.5" />
                <span>{currentMode === 'map' ? 'Overlay' : 'Map'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
