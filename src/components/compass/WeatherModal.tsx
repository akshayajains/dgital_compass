import React, { useState, memo } from 'react';
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

export const WeatherModal = memo<WeatherModalProps>(({
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
            ? "bg-[#FAF9F5] border-stone-300 text-stone-900 shadow-2xl" 
            : "bg-[#11141A] border-white/10 text-white"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header matching Screenshot */}
        <div className={cn(
          "flex items-center justify-between px-4 pt-4 pb-2 border-b shrink-0",
          theme === 'light' ? "border-stone-200" : "border-white/10"
        )}>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                try { Haptics.impact({ style: ImpactStyle.Light }); } catch (e) { console.error('Haptics failed in WeatherModal back button:', e); }
                onClose();
              }}
              className={cn("p-1.5 rounded-full transition-transform active:scale-90", theme === 'light' ? "hover:bg-stone-200/80 text-stone-700" : "hover:bg-white/10 text-stone-200")}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className={cn("text-base font-bold tracking-tight", theme === 'light' ? "text-stone-900" : "text-white")}>
              {language === 'hi' ? 'मौसम और चंद्र' : 'Weather & Moon'}
            </h2>
          </div>

          <button
            onClick={() => {
              try { Haptics.impact({ style: ImpactStyle.Light }); } catch (e) { console.error('Haptics failed in WeatherModal close button:', e); }
              onClose();
            }}
            className={cn("w-7 h-7 rounded-full flex items-center justify-center border transition-colors",
              theme === 'light'
                ? "bg-stone-100 border-stone-300 hover:bg-stone-200 text-stone-700"
                : "bg-white/5 border-white/10 hover:bg-white/10 text-stone-300"
            )}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Top Navigation Tabs: WEATHER | MOON */}
        <div className={cn("flex border-b shrink-0 select-none", theme === 'light' ? "border-stone-200 bg-stone-100/70" : "border-white/10 bg-black/20")}>
          <button
            onClick={() => {
              try { Haptics.impact({ style: ImpactStyle.Light }); } catch (e) { console.error('Haptics failed in WeatherModal weather tab:', e); }
              setActiveTab('weather');
            }}
            className={cn(
              "flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all relative",
              activeTab === 'weather'
                ? (theme === 'light' ? "text-stone-950 font-black" : "text-white font-black")
                : (theme === 'light' ? "text-stone-500 hover:text-stone-800" : "text-stone-400 hover:text-stone-200")
            )}
          >
            <span>{language === 'hi' ? 'मौसम' : 'WEATHER'}</span>
            {activeTab === 'weather' && (
              <div className="absolute bottom-0 inset-x-0 h-[2.5px] bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
            )}
          </button>

          <button
            onClick={() => {
              try { Haptics.impact({ style: ImpactStyle.Light }); } catch (e) { console.error('Haptics failed in WeatherModal moon tab:', e); }
              setActiveTab('moon');
            }}
            className={cn(
              "flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all relative",
              activeTab === 'moon'
                ? (theme === 'light' ? "text-stone-950 font-black" : "text-white font-black")
                : (theme === 'light' ? "text-stone-500 hover:text-stone-800" : "text-stone-400 hover:text-stone-200")
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
            /* ================= WEATHER TAB ================= */
            <>
              {/* Date Header */}
              <div className="text-center flex flex-col items-center">
                <span className={cn("text-xs font-semibold mt-0.5", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
                  {formattedDate}
                </span>
              </div>

              {/* Main Weather Hero Card */}
              <div className="flex items-center justify-between px-2 pt-1 pb-2">
                <div className="flex flex-col text-left">
                  <span className={cn("text-xs font-bold", theme === 'light' ? "text-stone-700" : "text-stone-300")}>
                    {current.condition} • {cityName ? cityName : (latitude && longitude ? `${latitude.toFixed(2)}, ${longitude.toFixed(2)}` : '')}
                  </span>
                  <span className={cn("text-4xl sm:text-5xl font-black font-sans tracking-tight mt-0.5", theme === 'light' ? "text-stone-950" : "text-white")}>
                    {fmt(current.tempC, '°C')}
                  </span>
                  <span className={cn("text-xs font-semibold mt-1", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
                    {fmt(current.tempMaxC, '°C')} / {fmt(current.tempMinC, '°C')}
                  </span>
                </div>

                {/* 3D Sun / Weather Art */}
                <div className="flex flex-col items-center justify-center relative pr-2">
                  <div className="relative flex items-center justify-center">
                    <Sun className="w-20 h-20 text-amber-500 drop-shadow-[0_0_25px_rgba(251,191,36,0.5)] animate-spin-slow" />
                  </div>
                  <span className={cn("text-[9px] font-mono mt-2 font-medium", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
                    last update: {current.lastUpdated}
                  </span>
                </div>
              </div>

              {/* 6-Grid Telemetry matching Screenshot */}
              <div className={cn("grid grid-cols-3 gap-2 pt-3 border-t text-left", theme === 'light' ? "border-stone-200" : "border-white/10")}>
                {/* 1. Precipitation */}
                <div className={cn("flex flex-col p-2.5 rounded-xl border", theme === 'light' ? "bg-white border-stone-200/90 shadow-sm" : "bg-white/5 border-white/10")}>
                  <span className={cn("text-[9px] uppercase tracking-wider font-bold", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
                    PRECIPITATION
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <CloudDrizzle className="w-4 h-4 text-sky-500 shrink-0" />
                    <span className={cn("text-xs font-black font-mono", theme === 'light' ? "text-stone-900" : "text-white")}>{fmt(current.precipitationMm, 'mm')}</span>
                  </div>
                </div>

                {/* 2. Wind */}
                <div className={cn("flex flex-col p-2.5 rounded-xl border", theme === 'light' ? "bg-white border-stone-200/90 shadow-sm" : "bg-white/5 border-white/10")}>
                  <span className={cn("text-[9px] uppercase tracking-wider font-bold", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
                    WIND
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Wind className="w-4 h-4 text-teal-500 shrink-0" />
                    <span className={cn("text-xs font-black font-mono", theme === 'light' ? "text-stone-900" : "text-white")}>{fmt(current.windSpeedKmh, 'km/h')}</span>
                  </div>
                </div>

                {/* 3. Pressure */}
                <div className={cn("flex flex-col p-2.5 rounded-xl border", theme === 'light' ? "bg-white border-stone-200/90 shadow-sm" : "bg-white/5 border-white/10")}>
                  <span className={cn("text-[9px] uppercase tracking-wider font-bold", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
                    PRESSURE
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Gauge className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className={cn("text-xs font-black font-mono", theme === 'light' ? "text-stone-900" : "text-white")}>{fmt(current.pressureHpa, 'hPa')}</span>
                  </div>
                </div>

                {/* 4. Humidity */}
                <div className={cn("flex flex-col p-2.5 rounded-xl border", theme === 'light' ? "bg-white border-stone-200/90 shadow-sm" : "bg-white/5 border-white/10")}>
                  <span className={cn("text-[9px] uppercase tracking-wider font-bold", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
                    HUMIDITY
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Droplets className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className={cn("text-xs font-black font-mono", theme === 'light' ? "text-stone-900" : "text-white")}>{fmt(current.humidity, '%')}</span>
                  </div>
                </div>

                {/* 5. Wind Direction */}
                <div className={cn("flex flex-col p-2.5 rounded-xl border", theme === 'light' ? "bg-white border-stone-200/90 shadow-sm" : "bg-white/5 border-white/10")}>
                  <span className={cn("text-[9px] uppercase tracking-wider font-bold", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
                    WIND DIRECTION
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Navigation className="w-3.5 h-3.5 text-indigo-500 -rotate-45 shrink-0" />
                    <span className={cn("text-xs font-black font-mono", theme === 'light' ? "text-stone-900" : "text-white")}>{getWindCardinal(current.windDirectionDeg)}</span>
                  </div>
                </div>

                {/* 6. Clouds */}
                <div className={cn("flex flex-col p-2.5 rounded-xl border", theme === 'light' ? "bg-white border-stone-200/90 shadow-sm" : "bg-white/5 border-white/10")}>
                  <span className={cn("text-[9px] uppercase tracking-wider font-bold", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
                    CLOUDS
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Cloud className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className={cn("text-xs font-black font-mono", theme === 'light' ? "text-stone-900" : "text-white")}>{fmt(current.cloudCoverPct, '%')}</span>
                  </div>
                </div>
              </div>

              {/* NEXT HOURS Forecast Carousel matching Screenshot */}
              <div className={cn("pt-3 border-t text-left", theme === 'light' ? "border-stone-200" : "border-white/10")}>
                <span className={cn("text-[10px] font-black uppercase tracking-wider block mb-2", theme === 'light' ? "text-stone-800" : "text-stone-300")}>
                  NEXT HOURS
                </span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {(current.hourly && current.hourly.length > 0 ? current.hourly : []).slice(0, 6).map((h, i) => (
                    <div key={i} className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-xl border text-center min-w-[68px] shrink-0",
                      theme === 'light' ? "bg-white border-stone-200 shadow-sm" : "bg-white/5 border-white/5"
                    )}>
                      <span className={cn("text-[10px] font-mono font-bold", theme === 'light' ? "text-stone-600" : "text-stone-400")}>{h.time}</span>
                      <span className={cn("text-xs font-black font-mono my-1", theme === 'light' ? "text-stone-950" : "text-white")}>{h.tempC}°C</span>
                      <div className="w-6 h-6 flex items-center justify-center">
                        {h.icon === 'sun' ? <Sun className="w-5 h-5 text-amber-500" /> :
                         h.icon === 'cloud-sun' ? <CloudSun className="w-5 h-5 text-amber-500" /> :
                         h.icon === 'rain' ? <CloudRain className="w-5 h-5 text-sky-500" /> :
                         h.icon === 'thunder' ? <CloudLightning className="w-5 h-5 text-yellow-500" /> :
                         <Cloud className="w-5 h-5 text-slate-500" />}
                      </div>
                      <span className={cn("text-[7.5px] font-bold mt-0.5 truncate max-w-[64px]", theme === 'light' ? "text-stone-700" : "text-stone-400")}>{h.condition}</span>
                    </div>
                  ))}
                  {(!current.hourly || current.hourly.length === 0) && (
                    <div className={cn("w-full text-center text-[10px] py-2", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
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
              <div className={cn(
                "p-4 rounded-2xl border flex flex-col items-center text-center relative overflow-hidden shadow-xl",
                theme === 'light'
                  ? "bg-gradient-to-b from-indigo-100 via-amber-50 to-white border-amber-200/80 shadow-md"
                  : "bg-gradient-to-b from-indigo-950/40 via-stone-900 to-black border-indigo-500/20"
              )}>
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-100 via-slate-200 to-stone-400 shadow-[0_0_30px_rgba(254,243,199,0.3)] flex items-center justify-center relative mb-3 border-2 border-amber-200/40">
                  <div className="absolute inset-1 rounded-full border border-white/20 opacity-70" />
                  <MoonIcon className="w-12 h-12 text-slate-800/80 fill-slate-900/60" />
                </div>

                <h3 className={cn("text-base font-black tracking-wide", theme === 'light' ? "text-stone-950" : "text-white")}>
                  {getMoonPhaseName(moonIllum.phase)}
                </h3>
                <p className={cn("text-xs font-mono font-bold mt-1", theme === 'light' ? "text-amber-800" : "text-amber-300")}>
                  {Math.round(moonIllum.fraction * 100)}% {language === 'hi' ? 'प्रकाशित' : 'Illuminated'}
                </p>
                <span className={cn("text-[10.5px] mt-1 font-medium", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
                  {language === 'hi' ? `चंद्र चक्र: दिन ${(moonIllum.phase * 29.53).toFixed(1)} / 29.5 दिन` : `Lunar Age: Day ${(moonIllum.phase * 29.53).toFixed(1)} of 29.5`}
                </span>
              </div>

              {/* Moon Telemetry Grid */}
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className={cn("p-3 rounded-xl border flex flex-col", theme === 'light' ? "bg-white border-stone-200/90 shadow-sm" : "bg-white/5 border-white/10")}>
                  <span className={cn("text-[9px] uppercase tracking-wider font-bold", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
                    {language === 'hi' ? 'चंद्रोदय (Moonrise)' : 'MOONRISE'}
                  </span>
                  <span className={cn("text-xs font-mono font-black mt-1", theme === 'light' ? "text-stone-900" : "text-white")}>
                    {moonTimes.rise ? formatHourTime(moonTimes.rise) : '—'}
                  </span>
                </div>

                <div className={cn("p-3 rounded-xl border flex flex-col", theme === 'light' ? "bg-white border-stone-200/90 shadow-sm" : "bg-white/5 border-white/10")}>
                  <span className={cn("text-[9px] uppercase tracking-wider font-bold", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
                    {language === 'hi' ? 'चंद्रास्त (Moonset)' : 'MOONSET'}
                  </span>
                  <span className={cn("text-xs font-mono font-black mt-1", theme === 'light' ? "text-stone-900" : "text-white")}>
                    {moonTimes.set ? formatHourTime(moonTimes.set) : '—'}
                  </span>
                </div>

                <div className={cn("p-3 rounded-xl border flex flex-col", theme === 'light' ? "bg-white border-stone-200/90 shadow-sm" : "bg-white/5 border-white/10")}>
                  <span className={cn("text-[9px] uppercase tracking-wider font-bold", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
                    {language === 'hi' ? 'अगली पूर्णिमा' : 'NEXT FULL MOON'}
                  </span>
                  <span className={cn("text-xs font-mono font-black mt-1", theme === 'light' ? "text-amber-700" : "text-amber-300")}>
                    {new Date(now.getTime() + (1 - moonIllum.phase) * 29.53 * 86400000).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <div className={cn("p-3 rounded-xl border flex flex-col", theme === 'light' ? "bg-white border-stone-200/90 shadow-sm" : "bg-white/5 border-white/10")}>
                  <span className={cn("text-[9px] uppercase tracking-wider font-bold", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
                    {language === 'hi' ? 'दूरी' : 'DISTANCE'}
                  </span>
                  <span className={cn("text-xs font-mono font-black mt-1", theme === 'light' ? "text-sky-700" : "text-sky-300")}>
                    384,400 km
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={cn("p-3 border-t flex items-center justify-between text-[10px] shrink-0", theme === 'light' ? "border-stone-200 bg-stone-100/70 text-stone-600" : "border-white/10 bg-black/20 text-stone-400")}>
          <span className="flex items-center gap-1 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
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
});

export default WeatherModal;
