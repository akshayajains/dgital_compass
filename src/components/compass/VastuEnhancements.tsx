import { useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Share2, Search, AlertTriangle, Clock, Home } from 'lucide-react';
import { getChoghadiyaData } from '@/lib/choghadiya';

interface VastuEnhancementsProps {
  language: string;
  theme: string;
  currentHeading: number | null;
  onHaptic: () => void;
}

// 8-zone Vastu data
const ZONES = [
  { code: 'N', nameHi: 'उत्तर', nameEn: 'North', ideal: ['entrance', 'cash', 'study', 'business'], color: 'from-sky-500/30 to-sky-500/10 border-sky-400/40', icon: '🧭' },
  { code: 'NE', nameHi: 'ईशान', nameEn: 'North-East', ideal: ['pooja', 'study', 'water_underground'], color: 'from-emerald-500/30 to-emerald-500/10 border-emerald-400/40', icon: '🕉️' },
  { code: 'E', nameHi: 'पूर्व', nameEn: 'East', ideal: ['entrance', 'study', 'pooja'], color: 'from-amber-500/30 to-amber-500/10 border-amber-400/40', icon: '🌅' },
  { code: 'SE', nameHi: 'आग्नेय', nameEn: 'South-East', ideal: ['kitchen'], color: 'from-orange-500/30 to-orange-500/10 border-orange-400/40', icon: '🔥' },
  { code: 'S', nameHi: 'दक्षिण', nameEn: 'South', ideal: ['staircase', 'naukari'], color: 'from-red-500/30 to-red-500/10 border-red-400/40', icon: '🛏️' },
  { code: 'SW', nameHi: 'नैऋत्य', nameEn: 'South-West', ideal: ['master_bedroom', 'staircase', 'water_overhead'], color: 'from-rose-500/30 to-rose-500/10 border-rose-400/40', icon: '🏠' },
  { code: 'W', nameHi: 'पश्चिम', nameEn: 'West', ideal: ['study', 'bathroom', 'water_overhead'], color: 'from-violet-500/30 to-violet-500/10 border-violet-400/40', icon: '🌇' },
  { code: 'NW', nameHi: 'वायव्य', nameEn: 'North-West', ideal: ['bathroom', 'guest', 'kitchen'], color: 'from-indigo-500/30 to-indigo-500/10 border-indigo-400/40', icon: '💨' },
];

// Best direction lookup data
const ACTIVITIES = [
  { id: 'study', labelHi: '📚 अध्ययन / पढ़ाई', labelEn: '📚 Study', best: ['NE', 'E', 'N'], facing: 'Face East or North' },
  { id: 'work', labelHi: '💼 काम / ऑफिस', labelEn: '💼 Work / Office', best: ['N', 'W', 'E'], facing: 'Face North or East' },
  { id: 'sleep', labelHi: '🛏️ नींद / बेडरूम', labelEn: '🛏️ Sleep / Bedroom', best: ['SW', 'S', 'W'], facing: 'Head towards South' },
  { id: 'mandir', labelHi: '🕉️ पूजा / मंदिर', labelEn: '🕉️ Pooja / Mandir', best: ['NE', 'E', 'N'], facing: 'Face East or North' },
  { id: 'kitchen', labelHi: '🍳 रसोई', labelEn: '🍳 Kitchen', best: ['SE', 'NW'], facing: 'Cook facing East' },
  { id: 'cash', labelHi: '💰 तिजोरी / धन', labelEn: '💰 Cash / Wealth', best: ['N', 'SW', 'W'], facing: 'Locker opens North' },
  { id: 'guest', labelHi: '🛋️ अतिथि कक्ष', labelEn: '🛋️ Guest Room', best: ['NW', 'W'], facing: 'Guest faces North' },
  { id: 'bathroom', labelHi: '🚿 बाथरूम', labelEn: '🚿 Bathroom', best: ['NW', 'W'], facing: '—' },
  { id: 'staircase', labelHi: '🪜 सीढ़ियाँ', labelEn: '🪜 Staircase', best: ['SW', 'S'], facing: '—' },
  { id: 'water', labelHi: '💧 पानी की टंकी', labelEn: '💧 Water Tank', best: ['SW', 'W', 'NW'], facing: '—' },
];

// Dosha detector data
const DOSHAS = [
  { zone: 'NE', issue: 'toilet', labelHi: 'ईशान में शौचालय', labelEn: 'Toilet in North-East', severity: 'major', remedyHi: 'शौचालय में समुद्री नमक रखें, बाहर तांबे का पिरामिड लगाएं', remedyEn: 'Keep sea salt inside, brass pyramid outside' },
  { zone: 'NE', issue: 'kitchen', labelHi: 'ईशान में रसोई', labelEn: 'Kitchen in North-East', severity: 'major', remedyHi: 'रसोई को आग्नेय (SE) में स्थानांतरित करें', remedyEn: 'Move kitchen to South-East' },
  { zone: 'SW', issue: 'toilet', labelHi: 'नैऋत्य में शौचालय', labelEn: 'Toilet in South-West', severity: 'major', remedyHi: 'शौचालय को वायव्य (NW) में स्थानांतरित करें', remedyEn: 'Move toilet to North-West' },
  { zone: 'S', issue: 'water', labelHi: 'दक्षिण में पानी', labelEn: 'Water in South', severity: 'moderate', remedyHi: 'दक्षिण में जल स्रोत न रखें', remedyEn: 'No water source in South' },
  { zone: 'N', issue: 'kitchen', labelHi: 'उत्तर में रसोई', labelEn: 'Kitchen in North', severity: 'moderate', remedyHi: 'रसोई को आग्नेय में रखें', remedyEn: 'Move kitchen to South-East' },
  { zone: 'center', issue: 'heavy', labelHi: 'ब्रह्मस्थान में भारी सामान', labelEn: 'Heavy items in center', severity: 'moderate', remedyHi: 'केंद्र को खाली और हल्का रखें', remedyEn: 'Keep center empty and light' },
];

export const VastuEnhancements = ({ language, theme, currentHeading, onHaptic }: VastuEnhancementsProps) => {
  const isHi = language === 'hi';
  const [activeSection, setActiveSection] = useState<'zones' | 'lookup' | 'dosha' | 'muhurat'>('zones');
  const [searchActivity, setSearchActivity] = useState<string>('study');
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  // Determine current zone from heading
  const currentZone = (() => {
    if (currentHeading === null) return 'N';
    const d = ((currentHeading % 360) + 360) % 360;
    if (d >= 337.5 || d < 22.5) return 'N';
    if (d >= 22.5 && d < 67.5) return 'NE';
    if (d >= 67.5 && d < 112.5) return 'E';
    if (d >= 112.5 && d < 157.5) return 'SE';
    if (d >= 157.5 && d < 202.5) return 'S';
    if (d >= 202.5 && d < 247.5) return 'SW';
    if (d >= 247.5 && d < 292.5) return 'W';
    return 'NW';
  })();

  // Muhurat data
  const choghadiya = getChoghadiyaData(new Date());

  const handleShare = () => {
    onHaptic();
    const text = isHi
      ? `🧭 वास्तु रिपोर्ट\nदिशा: ${currentZone} (${currentHeading !== null ? Math.round(currentHeading) : '—'}°)\nमुहूर्त: ${choghadiya.currentSlot.nameHi} (${choghadiya.currentSlot.startTime}-${choghadiya.currentSlot.endTime})\nअगला शुभ: ${choghadiya.nextGoodSlot ? choghadiya.nextGoodSlot.nameHi + ' ' + choghadiya.nextGoodSlot.startTime : '—'}`
      : `🧭 Vastu Report\nDirection: ${currentZone} (${currentHeading !== null ? Math.round(currentHeading) : '—'}°)\nMuhurat: ${choghadiya.currentSlot.name} (${choghadiya.currentSlot.startTime}-${choghadiya.currentSlot.endTime})\nNext Good: ${choghadiya.nextGoodSlot ? choghadiya.nextGoodSlot.name + ' ' + choghadiya.nextGoodSlot.startTime : '—'}`;
    try {
      if (navigator.share) {
        navigator.share({ text });
      } else {
        navigator.clipboard?.writeText(text);
        setShareMsg(isHi ? 'रिपोर्ट कॉपी हो गई!' : 'Report copied!');
        setTimeout(() => setShareMsg(null), 2000);
      }
    } catch {
      setShareMsg(isHi ? 'रिपोर्ट कॉपी हो गई!' : 'Report copied!');
      setTimeout(() => setShareMsg(null), 2000);
    }
  };

  const sectionBtn = (id: 'zones' | 'lookup' | 'dosha' | 'muhurat', label: string, icon: ReactNode) => (
    <button
      onClick={() => { setActiveSection(id); onHaptic(); }}
      className={cn(
        "flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider flex flex-col items-center gap-1 border transition-all active:scale-95",
        activeSection === id
          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
          : (theme === 'light' ? "bg-white border-stone-200 text-stone-500" : "bg-stone-900 border-stone-800 text-stone-400")
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="space-y-3">
      {/* Section switcher */}
      <div className="w-full flex gap-1.5">
        {sectionBtn('zones', isHi ? 'दिशा' : 'Zones', <Home className="w-3.5 h-3.5" />)}
        {sectionBtn('lookup', isHi ? 'खोजें' : 'Lookup', <Search className="w-3.5 h-3.5" />)}
        {sectionBtn('dosha', isHi ? 'दोष' : 'Dosha', <AlertTriangle className="w-3.5 h-3.5" />)}
        {sectionBtn('muhurat', isHi ? 'मुहूर्त' : 'Muhurat', <Clock className="w-3.5 h-3.5" />)}
      </div>

      {/* ── 8-Zone Visual Floor Plan ── */}
      {activeSection === 'zones' && (
        <div className={cn(
          "rounded-2xl p-4 border transition-colors duration-300",
          theme === 'light' ? "bg-white border-amber-500/20" : "bg-stone-950/80 border-stone-800"
        )}>
          <h5 className="text-[10px] text-stone-500 uppercase font-black tracking-wider mb-3 flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5 text-amber-400" />
            {isHi ? '8-दिशा वास्तु नक्शा' : '8-Zone Vastu Map'}
          </h5>

          {/* Octagonal-ish 3x3 grid with center */}
          <div className="grid grid-cols-3 gap-1.5 p-2 bg-black/40 rounded-xl border border-white/10 text-center">
            {[
              { code: 'NW', name: isHi ? 'वायव्य' : 'NW' },
              { code: 'N', name: isHi ? 'उत्तर' : 'N' },
              { code: 'NE', name: isHi ? 'ईशान' : 'NE' },
              { code: 'W', name: isHi ? 'पश्चिम' : 'W' },
              { code: 'C', name: isHi ? 'केंद्र' : 'Center' },
              { code: 'E', name: isHi ? 'पूर्व' : 'E' },
              { code: 'SW', name: isHi ? 'नैऋत्य' : 'SW' },
              { code: 'S', name: isHi ? 'दक्षिण' : 'S' },
              { code: 'SE', name: isHi ? 'आग्नेय' : 'SE' },
            ].map(sec => {
              const zone = ZONES.find(z => z.code === sec.code);
              const isCurrent = sec.code === currentZone;
              return (
                <div
                  key={sec.code}
                  className={cn(
                    "p-2 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all",
                    isCurrent
                      ? "bg-amber-500/25 border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.4)] scale-[1.03]"
                      : zone
                      ? cn("bg-gradient-to-br border", zone.color)
                      : "bg-stone-900/60 border-white/10"
                  )}
                >
                  <span className="text-[8px] font-black uppercase text-stone-300">{sec.name}</span>
                  {zone && <span className="text-[10px]">{zone.icon}</span>}
                  {isCurrent && <span className="text-[7px] font-black text-amber-300 animate-pulse">●</span>}
                </div>
              );
            })}
          </div>

          {/* Current zone detail */}
          <div className="mt-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                {isHi ? 'वर्तमान दिशा' : 'Current Direction'}
              </span>
              <span className="text-[10px] font-black text-amber-300">{currentZone}</span>
            </div>
            <p className="text-[11px] font-medium text-stone-300 mt-1">
              {isHi
                ? `${ZONES.find(z => z.code === currentZone)?.nameHi} — ${currentHeading !== null ? Math.round(currentHeading) : '—'}°`
                : `${ZONES.find(z => z.code === currentZone)?.nameEn} — ${currentHeading !== null ? Math.round(currentHeading) : '—'}°`}
            </p>

            {/* Auto-rotation suggestion: align to ideal zone for selected activity */}
            {currentHeading !== null && (() => {
              const act = ACTIVITIES.find(a => a.id === searchActivity) || ACTIVITIES[0];
              const idealZone = act.best[0];
              const zoneAngles: Record<string, number> = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
              const target = zoneAngles[idealZone] ?? 0;
              let diff = ((target - currentHeading) % 360 + 360) % 360;
              if (diff > 180) diff -= 360;
              const dir = diff >= 0 ? (isHi ? 'दक्षिणावर्त' : 'clockwise') : (isHi ? 'वामावर्त' : 'counter-clockwise');
              const abs = Math.round(Math.abs(diff));
              if (abs < 5) return null;
              return (
                <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-center gap-2">
                  <span className="text-[10px] font-black text-amber-300">↻</span>
                  <span className="text-[10px] font-bold text-stone-300">
                    {isHi
                      ? `सर्वोत्तम (${idealZone}) के लिए ${abs}° ${dir} घुमाएं`
                      : `Rotate ${abs}° ${dir} to align with ${idealZone}`}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Best Direction Quick Lookup ── */}
      {activeSection === 'lookup' && (
        <div className={cn(
          "rounded-2xl p-4 border transition-colors duration-300",
          theme === 'light' ? "bg-white border-amber-500/20" : "bg-stone-950/80 border-stone-800"
        )}>
          <h5 className="text-[10px] text-stone-500 uppercase font-black tracking-wider mb-3 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-amber-400" />
            {isHi ? 'किसके लिए सर्वोत्तम दिशा?' : 'Best Direction For...'}
          </h5>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2">
            {ACTIVITIES.map(a => (
              <button
                key={a.id}
                onClick={() => { setSearchActivity(a.id); onHaptic(); }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-black whitespace-nowrap border transition-all active:scale-95",
                  searchActivity === a.id
                    ? "bg-amber-500 text-stone-950 border-amber-400"
                    : (theme === 'light' ? "bg-stone-50 border-stone-200 text-stone-600" : "bg-stone-900 border-stone-800 text-stone-400")
                )}
              >
                {isHi ? a.labelHi : a.labelEn}
              </button>
            ))}
          </div>

          {(() => {
            const act = ACTIVITIES.find(a => a.id === searchActivity) || ACTIVITIES[0];
            return (
              <div className="mt-2 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                    {isHi ? 'सर्वोत्तम दिशाएं' : 'Best Zones'}
                  </span>
                  <span className="text-[10px] font-black text-amber-300">{act.best.join(', ')}</span>
                </div>
                <p className="text-[11px] font-medium text-stone-300 mt-1.5">
                  {isHi ? act.facing : act.facing}
                </p>
                <div className="flex gap-1.5 mt-2">
                  {act.best.map(z => {
                    const zone = ZONES.find(x => x.code === z);
                    return (
                      <span key={z} className={cn("px-2 py-0.5 rounded-full text-[9px] font-black border", zone?.color)}>
                        {zone?.icon} {z}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Vastu Dosha Detector ── */}
      {activeSection === 'dosha' && (
        <div className={cn(
          "rounded-2xl p-4 border transition-colors duration-300",
          theme === 'light' ? "bg-white border-amber-500/20" : "bg-stone-950/80 border-stone-800"
        )}>
          <h5 className="text-[10px] text-stone-500 uppercase font-black tracking-wider mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            {isHi ? 'वास्तु दोष डिटेक्टर' : 'Vastu Dosha Detector'}
          </h5>

          <div className="space-y-2">
            {DOSHAS.map((d, i) => (
              <div key={i} className={cn(
                "p-2.5 rounded-xl border flex items-start gap-2.5",
                d.severity === 'major'
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-amber-500/10 border-amber-500/30"
              )}>
                <span className="text-base leading-none">{d.severity === 'major' ? '🔴' : '🟡'}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-[10px] font-black uppercase tracking-wider", d.severity === 'major' ? "text-red-400" : "text-amber-400")}>
                      {isHi ? d.labelHi : d.labelEn}
                    </span>
                    <span className={cn("text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border", d.severity === 'major' ? "text-red-400 border-red-500/40" : "text-amber-400 border-amber-500/40")}>
                      {d.severity === 'major' ? (isHi ? 'गंभीर' : 'Major') : (isHi ? 'मध्यम' : 'Moderate')}
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-stone-300 mt-1">
                    {isHi ? d.remedyHi : d.remedyEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Muhurat Mini Card ── */}
      {activeSection === 'muhurat' && (
        <div className={cn(
          "rounded-2xl p-4 border transition-colors duration-300",
          theme === 'light' ? "bg-white border-amber-500/20" : "bg-stone-950/80 border-stone-800"
        )}>
          <h5 className="text-[10px] text-stone-500 uppercase font-black tracking-wider mb-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            {isHi ? 'आज का मुहूर्त' : "Today's Muhurat"}
          </h5>

          <div className={cn(
            "p-3 rounded-xl border flex items-center justify-between",
            choghadiya.currentSlot.type === 'good'
              ? "bg-emerald-500/10 border-emerald-500/30"
              : choghadiya.currentSlot.type === 'avoid'
              ? "bg-red-500/10 border-red-500/30"
              : "bg-sky-500/10 border-sky-500/30"
          )}>
            <div>
              <div className={cn("text-[10px] font-black uppercase tracking-wider", choghadiya.currentSlot.color)}>
                {isHi ? choghadiya.currentSlot.nameHi : choghadiya.currentSlot.name}
              </div>
              <div className="text-[10px] font-bold text-stone-300 mt-0.5">
                {choghadiya.currentSlot.startTime} - {choghadiya.currentSlot.endTime}
              </div>
            </div>
            <span className={cn("text-[9px] font-black uppercase px-2 py-1 rounded-full border", choghadiya.currentSlot.color)}>
              {choghadiya.currentSlot.type === 'good' ? (isHi ? 'शुभ' : 'Good') : choghadiya.currentSlot.type === 'avoid' ? (isHi ? 'वर्जित' : 'Avoid') : (isHi ? 'सामान्य' : 'Neutral')}
            </span>
          </div>

          {choghadiya.nextGoodSlot && (
            <div className="mt-2 p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                {isHi ? 'अगला शुभ मुहूर्त' : 'Next Good Muhurat'}
              </span>
              <span className="text-[10px] font-black text-emerald-300">
                {isHi ? choghadiya.nextGoodSlot.nameHi : choghadiya.nextGoodSlot.name} · {choghadiya.nextGoodSlot.startTime}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Share Report */}
      <button
        onClick={handleShare}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
      >
        <Share2 className="w-4 h-4" />
        {isHi ? 'वास्तु रिपोर्ट साझा करें' : 'Share Vastu Report'}
      </button>
      {shareMsg && (
        <div className="text-center text-[11px] font-bold text-emerald-400 animate-in fade-in">
          {shareMsg}
        </div>
      )}
    </div>
  );
};
