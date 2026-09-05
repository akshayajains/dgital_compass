import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  CloudSun, 
  Sun, 
  CloudRain, 
  CloudLightning, 
  Cloud, 
  Wind, 
  Droplets, 
  Gauge, 
  Navigation,
  CloudDrizzle,
  ArrowLeft,
  X,
  Moon as MoonIcon,
  Sparkles,
  MapPin
} from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import SunCalc from 'suncalc';

export interface HourlyForecastItem {
  time: string;
  tempC: number;
  condition: string;
  icon: 'sun' | 'cloud-sun' | 'cloud' | 'rain' | 'thunder';
}

export interface WeatherData {
  tempC: number;
  tempF: number;
  tempMinC: number;
  tempMaxC: number;
  apparentTempC: number;
  humidity: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  pressureHpa: number;
  precipitationMm: number;
  cloudCoverPct: number;
  condition: string;
  conditionIcon: 'sun' | 'cloud-sun' | 'cloud' | 'rain' | 'thunder';
  uvIndex: number;
  visibilityKm: number;
  lastUpdated: string;
  hourly: HourlyForecastItem[];
}

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  theme: string;
  weather: WeatherData | null;
  sunriseTime?: string;
  sunsetTime?: string;
  cityName?: string;
  latitude?: number;
  longitude?: number;
}

export const WeatherModal: React.FC<WeatherModalProps> = ({
  isOpen,
  onClose,
  language,
  theme,
  weather,
  cityName,
  latitude,
  longitude
}) => {
  const [activeTab, setActiveTab] = useState<'weather' | 'moon'>('weather');

  if (!isOpen) return null;

  const now = new Date();

  // Format a numeric value as "—" when it's NaN (weather unavailable)
  const fmt = (v: number, suffix = '') => (Number.isNaN(v) ? '—' : `${v}${suffix}`);

  // Moon calculations via SunCalc
  const moonIllum = SunCalc.getMoonIllumination(now);
  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';
  const moonTimes = hasCoords ? SunCalc.getMoonTimes(now, latitude, longitude) : { rise: null, set: null };

  const getMoonPhaseName = (phase: number) => {
    if (phase < 0.03 || phase > 0.97) return language === 'hi' ? 'अमावस्या (New Moon)' : 'New Moon';
    if (phase < 0.22) return language === 'hi' ? 'शुक्ल पक्ष बालचंद्र (Waxing Crescent)' : 'Waxing Crescent';
    if (phase < 0.28) return language === 'hi' ? 'प्रथम चरण (First Quarter)' : 'First Quarter';
    if (phase < 0.47) return language === 'hi' ? 'शुक्ल पक्ष कुब्ज (Waxing Gibbous)' : 'Waxing Gibbous';
    if (phase < 0.53) return language === 'hi' ? 'पूर्णिमा (Full Moon)' : 'Full Moon';
    if (phase < 0.72) return language === 'hi' ? 'कृष्ण पक्ष कुब्ज (Waning Gibbous)' : 'Waning Gibbous';
    if (phase < 0.78) return language === 'hi' ? 'अंतिम चरण (Last Quarter)' : 'Last Quarter';
    return language === 'hi' ? 'कृष्ण पक्ष बालचंद्र (Waning Crescent)' : 'Waning Crescent';
  };

  const getWindCardinal = (deg: number) => {
    const val = Math.floor((deg / 22.5) + 0.5);
    const arr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return arr[val % 16];
  };

  const formatHourTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const current: WeatherData = weather || {
    tempC: NaN,
    tempF: NaN,
    tempMinC: NaN,
    tempMaxC: NaN,
    apparentTempC: NaN,
    humidity: NaN,
    windSpeedKmh: NaN,
    windDirectionDeg: NaN,
    pressureHpa: NaN,
    precipitationMm: NaN,
    cloudCoverPct: NaN,
    condition: language === 'hi' ? 'मौसम उपलब्ध नहीं' : 'Weather Unavailable',
    conditionIcon: 'cloud',
    uvIndex: NaN,
    visibilityKm: NaN,
    lastUpdated: '',
    hourly: []
  };

  const formattedDate = now.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className={cn(
          "w-full max-w-sm rounded-[2rem] border p-0 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden relative transition-colors duration-300",
          theme === 'light' 
            ? "bg-white border-stone-200 text-stone-900" 
            : "bg-[#11141A] border-white/10 text-white"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header matching Screenshot */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                try { Haptics.impact({ style: ImpactStyle.Light }); } catch {}
                onClose();
              }}
              className="p-1 rounded-full hover:bg-white/10 active:scale-90 transition-transform"
            >
              <ArrowLeft className="w-5 h-5 text-stone-200" />
            </button>
            <h2 className="text-base font-bold tracking-tight">
              {language === 'hi' ? 'मौसम और चंद्र' : 'Weather & Moon'}
            </h2>
          </div>

          <button
            onClick={() => {
              try { Haptics.impact({ style: ImpactStyle.Light }); } catch {}
              onClose();
            }}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 text-stone-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Top Navigation Tabs: WEATHER | MOON */}
        <div className="flex border-b border-white/10 shrink-0 select-none">
          <button
            onClick={() => {
              try { Haptics.impact({ style: ImpactStyle.Light }); } catch {}
              setActiveTab('weather');
            }}
            className={cn(
              "flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all relative",
              activeTab === 'weather'
                ? "text-white"
                : "text-stone-500 hover:text-stone-300"
            )}
          >
            <span>{language === 'hi' ? 'मौसम' : 'WEATHER'}</span>
            {activeTab === 'weather' && (
              <div className="absolute bottom-0 inset-x-0 h-[2.5px] bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
            )}
          </button>

          <button
            onClick={() => {
              try { Haptics.impact({ style: ImpactStyle.Light }); } catch {}
              setActiveTab('moon');
            }}
            className={cn(
              "flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all relative",
              activeTab === 'moon'
                ? "text-white"
                : "text-stone-500 hover:text-stone-300"
            )}
          >
            <span>{language === 'hi' ? 'चंद्रमा' : 'MOON'}</span>
            {activeTab === 'moon' && (
              <div className="absolute bottom-0 inset-x-0 h-[2.5px] bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
            )}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {activeTab === 'weather' ? (
            /* ================= WEATHER TAB (Screenshot 1:1) ================= */
            <>
              {/* Date Header (city moved into hero line) */}
              <div className="text-center flex flex-col items-center">
                <span className="text-xs text-stone-400 font-medium mt-0.5">
                  {formattedDate}
                </span>
              </div>

              {/* Main Weather Hero Card */}
              <div className="flex items-center justify-between px-2 pt-1 pb-2">
                <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-stone-400">
                      {current.condition} • {cityName ? cityName : (latitude && longitude ? `${latitude.toFixed(2)}, ${longitude.toFixed(2)}` : '')}
                    </span>
                    <span className="text-4xl sm:text-5xl font-black font-sans tracking-tight text-white mt-0.5">
                      {fmt(current.tempC, '°C')}
                    </span>
                    <span className="text-xs font-medium text-stone-400 mt-1">
                      {fmt(current.tempMaxC, '°C')} / {fmt(current.tempMinC, '°C')}
                    </span>
                </div>

                {/* 3D Sun / Weather Art */}
                <div className="flex flex-col items-center justify-center relative pr-2">
                  <div className="relative flex items-center justify-center">
                    <Sun className="w-20 h-20 text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.65)] animate-spin-slow" />
                  </div>
                  <span className="text-[8.5px] text-stone-500 font-mono mt-2">
                    last update: {current.lastUpdated}
                  </span>
                </div>
              </div>

              {/* 6-Grid Telemetry matching Screenshot */}
              <div className="grid grid-cols-3 gap-y-4 gap-x-2 pt-3 border-t border-white/10 text-left">
                {/* 1. Precipitation */}
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-stone-400">
                    PRECIPITATION
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <CloudDrizzle className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="text-xs font-black text-white font-mono">{fmt(current.precipitationMm, 'mm')}</span>
                  </div>
                </div>

                {/* 2. Wind */}
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-stone-400">
                    WIND
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Wind className="w-4 h-4 text-stone-300 shrink-0" />
                    <span className="text-xs font-black text-white font-mono">{fmt(current.windSpeedKmh, 'km/h')}</span>
                  </div>
                </div>

                {/* 3. Pressure */}
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-stone-400">
                    PRESSURE
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Gauge className="w-4 h-4 text-stone-300 shrink-0" />
                    <span className="text-xs font-black text-white font-mono">{fmt(current.pressureHpa, 'hPa')}</span>
                  </div>
                </div>

                {/* 4. Humidity */}
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-stone-400">
                    HUMIDITY
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Droplets className="w-4 h-4 text-stone-400 shrink-0" />
                    <span className="text-xs font-black text-white font-mono">{fmt(current.humidity, '%')}</span>
                  </div>
                </div>

                {/* 5. Wind Direction */}
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-stone-400">
                    WIND DIRECTION
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Navigation className="w-3.5 h-3.5 text-stone-400 -rotate-45 shrink-0" />
                    <span className="text-xs font-black text-white font-mono">{getWindCardinal(current.windDirectionDeg)}</span>
                  </div>
                </div>

                {/* 6. Clouds */}
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-stone-400">
                    CLOUDS
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Cloud className="w-4 h-4 text-stone-400 shrink-0" />
                    <span className="text-xs font-black text-white font-mono">{fmt(current.cloudCoverPct, '%')}</span>
                  </div>
                </div>
              </div>

              {/* NEXT HOURS Forecast Carousel matching Screenshot */}
              <div className="pt-3 border-t border-white/10 text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block mb-2">
                  NEXT HOURS
                </span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {(current.hourly && current.hourly.length > 0 ? current.hourly : []).slice(0, 6).map((h, i) => (
                    <div key={i} className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/5 text-center min-w-[68px] shrink-0">
                      <span className="text-[10px] text-stone-400 font-mono">{h.time}</span>
                      <span className="text-xs font-black text-white font-mono my-1">{h.tempC}°C</span>
                      <div className="w-6 h-6 flex items-center justify-center">
                        {h.icon === 'sun' ? <Sun className="w-5 h-5 text-amber-400" /> :
                         h.icon === 'cloud-sun' ? <CloudSun className="w-5 h-5 text-amber-300" /> :
                         h.icon === 'rain' ? <CloudRain className="w-5 h-5 text-sky-400" /> :
                         h.icon === 'thunder' ? <CloudLightning className="w-5 h-5 text-yellow-400" /> :
                         <Cloud className="w-5 h-5 text-stone-400" />}
                      </div>
                      <span className="text-[7px] text-stone-500 font-bold mt-0.5 truncate max-w-[64px]">{h.condition}</span>
                    </div>
                  ))}
                  {(!current.hourly || current.hourly.length === 0) && (
                    <div className="w-full text-center text-[10px] text-stone-500 py-2">
                      {language === 'hi' ? 'घंटेवार पूर्वानुमान उपलब्ध नहीं' : 'Hourly forecast unavailable'}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* ================= MOON TAB ================= */
            <>
              {/* Moon Hero Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-indigo-950/40 via-stone-900 to-black border border-indigo-500/20 flex flex-col items-center text-center relative overflow-hidden shadow-xl">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-100 via-slate-200 to-stone-400 shadow-[0_0_30px_rgba(254,243,199,0.3)] flex items-center justify-center relative mb-3 border-2 border-amber-200/40">
                  <div className="absolute inset-1 rounded-full border border-white/20 opacity-70" />
                  <MoonIcon className="w-12 h-12 text-slate-800/80 fill-slate-900/60" />
                </div>

                <h3 className="text-base font-black text-white tracking-wide">
                  {getMoonPhaseName(moonIllum.phase)}
                </h3>
                <p className="text-xs font-mono font-bold text-amber-300 mt-1">
                  {Math.round(moonIllum.fraction * 100)}% {language === 'hi' ? 'प्रकाशित' : 'Illuminated'}
                </p>
                <span className="text-[10px] text-stone-400 mt-1">
                  {language === 'hi' ? `चंद्र चक्र: दिन ${(moonIllum.phase * 29.53).toFixed(1)} / 29.5 दिन` : `Lunar Age: Day ${(moonIllum.phase * 29.53).toFixed(1)} of 29.5`}
                </span>
              </div>

              {/* Moon Telemetry Grid */}
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">
                    {language === 'hi' ? 'चंद्रोदय (Moonrise)' : 'MOONRISE'}
                  </span>
                  <span className="text-xs font-mono font-black text-white mt-1">
                    {moonTimes.rise ? formatHourTime(moonTimes.rise) : '—'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">
                    {language === 'hi' ? 'चंद्रास्त (Moonset)' : 'MOONSET'}
                  </span>
                  <span className="text-xs font-mono font-black text-white mt-1">
                    {moonTimes.set ? formatHourTime(moonTimes.set) : '—'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">
                    {language === 'hi' ? 'अगली पूर्णिमा' : 'NEXT FULL MOON'}
                  </span>
                  <span className="text-xs font-mono font-black text-amber-300 mt-1">
                    {new Date(now.getTime() + (1 - moonIllum.phase) * 29.53 * 86400000).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">
                    {language === 'hi' ? 'दूरी' : 'DISTANCE'}
                  </span>
                  <span className="text-xs font-mono font-black text-sky-300 mt-1">
                    384,400 km
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 flex items-center justify-between text-[10px] text-stone-400 shrink-0 bg-black/20">
          <span className="flex items-center gap-1 font-medium text-stone-400">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span>{language === 'hi' ? 'सटीक उपग्रह एवं मौसम पूर्वानुमान' : 'Live Precision Satellite Weather'}</span>
          </span>
          <button
            onClick={onClose}
            className="py-1 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-[11px] uppercase tracking-wider active:scale-95 transition-all shadow-md"
          >
            {language === 'hi' ? 'पूर्ण' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
