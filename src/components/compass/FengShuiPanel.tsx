import React, { memo, useState } from 'react';
import { cn } from '@/lib/utils';
import { BAGUA_AREAS, getFengShuiCures, FengShuiCure } from '@/lib/fengshuiCures';
import { ChevronDown, ChevronUp, Leaf, Droplets, Gem, Palette, Lightbulb, Music, Wind, Sparkles } from 'lucide-react';
import { Language } from '@/types/compass';

interface FengShuiPanelProps {
  language: string;
  theme: string;
  fengshuiDoor: number;
  setFengshuiDoor: (v: number) => void;
}

const cureIcons: Record<string, React.ReactNode> = {
  plant: <Leaf className="w-3 h-3 text-emerald-400" />,
  water: <Droplets className="w-3 h-3 text-sky-400" />,
  crystal: <Gem className="w-3 h-3 text-purple-400" />,
  color: <Palette className="w-3 h-3 text-rose-400" />,
  light: <Lightbulb className="w-3 h-3 text-amber-400" />,
  sound: <Music className="w-3 h-3 text-cyan-400" />,
  object: <Sparkles className="w-3 h-3 text-yellow-400" />,
  mirror: <Wind className="w-3 h-3 text-blue-400" />,
};

const priorityColors: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
};

const baguaAreaIds = ['wealth', 'love', 'career', 'family', 'fame', 'children', 'knowledge', 'helpers'];

export const FengShuiPanel = memo(({ language, theme, fengshuiDoor, setFengshuiDoor }: FengShuiPanelProps) => {
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const lang = language as Language;

  return (
    <div className="space-y-4">
      <div className={cn(
        "border rounded-2xl p-5 text-left transition-colors duration-300",
        theme === 'light'
          ? "bg-blue-50/60 border-blue-500/25 text-blue-900 shadow-sm"
          : "bg-blue-500/10 border border-blue-500/20"
      )}>
        <div className="flex justify-between items-start mb-2">
          <h3 className={cn("font-serif font-black mb-1 transition-colors", theme === 'light' ? "text-blue-800" : "text-blue-400")}>{language === 'hi' ? 'बागुआ मैप' : 'Bagua Map'}</h3>
          <select
            value={fengshuiDoor}
            onChange={(e) => setFengshuiDoor(Number(e.target.value))}
            className={cn(
              "text-[10px] uppercase font-black px-2 py-1 rounded outline-none border transition-all duration-300",
              theme === 'light'
                ? "bg-white border-stone-200 text-stone-700"
                : "bg-stone-900 border border-stone-800 text-stone-300"
            )}
          >
            <option value="0">{language === 'hi' ? 'उत्तर द्वार' : 'North Door'}</option>
            <option value="45">{language === 'hi' ? 'ईशान द्वार' : 'NE Door'}</option>
            <option value="90">{language === 'hi' ? 'पूर्व द्वार' : 'East Door'}</option>
            <option value="135">{language === 'hi' ? 'आग्नेय द्वार' : 'SE Door'}</option>
            <option value="180">{language === 'hi' ? 'दक्षिण द्वार' : 'South Door'}</option>
            <option value="225">{language === 'hi' ? 'नैऋत्य द्वार' : 'SW Door'}</option>
            <option value="270">{language === 'hi' ? 'पश्चिम द्वार' : 'West Door'}</option>
            <option value="315">{language === 'hi' ? 'वायव्य द्वार' : 'NW Door'}</option>
          </select>
        </div>
        <p className={cn("text-[11px] leading-relaxed mb-3 transition-colors", theme === 'hi' ? "text-stone-600" : "text-stone-300")}>
          {language === 'hi'
            ? 'अपने मुख्य द्वार की दिशा चुनें। कम्पास पर बागुआ मैप आपके घर के अनुसार घूम जाएगा।'
            : 'Select your front door facing direction to align the Bagua map dynamically.'}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className={cn(
            "p-2 rounded-lg border transition-colors duration-300",
            theme === 'light' ? "bg-white border-blue-500/10" : "bg-stone-900 border-stone-800"
          )}>
            <span className="text-[10px] text-stone-600 uppercase font-black">{language === 'hi' ? 'धन-सम्पत्ति' : 'Wealth'}</span>
            <p className="text-[10px] text-blue-500 font-bold">{language === 'hi' ? 'दक्षिण-पूर्व' : 'South-East'}</p>
          </div>
          <div className={cn(
            "p-2 rounded-lg border transition-colors duration-300",
            theme === 'light' ? "bg-white border-blue-500/10" : "bg-stone-900 border-stone-800"
          )}>
            <span className="text-[10px] text-stone-600 uppercase font-black">{language === 'hi' ? 'प्रेम / विवाह' : 'Love'}</span>
            <p className="text-[10px] text-pink-500 font-bold">{language === 'hi' ? 'दक्षिण-पश्चिम' : 'South-West'}</p>
          </div>
          <div className={cn(
            "p-2 rounded-lg border transition-colors duration-300",
            theme === 'light' ? "bg-white border-blue-500/10" : "bg-stone-900 border-stone-800"
          )}>
            <span className="text-[10px] text-stone-600 uppercase font-black">{language === 'hi' ? 'कैरियर' : 'Career'}</span>
            <p className="text-[10px] text-sky-500 font-bold">{language === 'hi' ? 'उत्तर' : 'North'}</p>
          </div>
          <div className={cn(
            "p-2 rounded-lg border transition-colors duration-300",
            theme === 'light' ? "bg-white border-blue-500/10" : "bg-stone-900 border-stone-800"
          )}>
            <span className="text-[10px] text-stone-600 uppercase font-black">{language === 'hi' ? 'परिवार' : 'Family'}</span>
            <p className="text-[10px] text-emerald-500 font-bold">{language === 'hi' ? 'पूर्व' : 'East'}</p>
          </div>
        </div>
      </div>

      {/* Feng Shui Curing Suggestions */}
      <div className={cn(
        "border rounded-2xl p-4 text-left transition-colors duration-300",
        theme === 'light'
          ? "bg-teal-50/60 border-teal-500/25 shadow-sm"
          : "bg-emerald-500/10 border border-emerald-500/20"
      )}>
        <h3 className={cn("font-serif font-black mb-1 transition-colors text-sm", theme === 'light' ? "text-teal-800" : "text-emerald-400")}>
          {language === 'hi' ? '🌿 फेंग शूई उपचार सुझाव' : '🌿 Feng Shui Curing Suggestions'}
        </h3>
        <p className={cn("text-[10px] leading-relaxed mb-3", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
          {language === 'hi'
            ? 'प्रत्येक बागुआ क्षेत्र के लिए उपचार चुनने के लिए उस पर टैप करें।'
            : 'Tap on any Bagua area below to see personalized curing suggestions.'}
        </p>

        <div className="space-y-2">
          {baguaAreaIds.map((areaId) => {
            const area = BAGUA_AREAS[areaId];
            if (!area) return null;
            const isExpanded = expandedArea === areaId;
            const cures = getFengShuiCures(areaId, fengshuiDoor, lang);

            return (
              <div key={areaId} className={cn(
                "rounded-xl border overflow-hidden transition-all duration-300",
                theme === 'light' ? "bg-white border-stone-200" : "bg-stone-900/60 border-stone-800"
              )}>
                <button
                  onClick={() => setExpandedArea(isExpanded ? null : areaId)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 text-left transition-colors",
                    theme === 'light' ? "hover:bg-stone-50" : "hover:bg-stone-800/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: area.color.toLowerCase() === 'green' ? '#22c55e' : area.color.toLowerCase() === 'pink' ? '#ec4899' : area.color.toLowerCase() === 'blue' ? '#3b82f6' : area.color.toLowerCase() === 'red' ? '#ef4444' : area.color.toLowerCase() === 'white' ? '#e5e7eb' : area.color.toLowerCase() === 'yellow' ? '#eab308' : '#94a3b8' }} />
                    <span className={cn("text-xs font-bold", theme === 'light' ? "text-stone-700" : "text-stone-300")}>
                      {lang === 'hi' ? area.lifeAspect.hi : area.lifeAspect.en}
                    </span>
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-bold", theme === 'light' ? "bg-stone-100 text-stone-500" : "bg-stone-800 text-stone-500")}>
                      {lang === 'hi' ? area.elementHi : area.element}
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-stone-600" /> : <ChevronDown className="w-4 h-4 text-stone-600" />}
                </button>

                {isExpanded && (
                  <div className={cn("px-3 pb-3 space-y-2 border-t", theme === 'light' ? "border-stone-100" : "border-stone-800")}>
                    {/* Warnings */}
                    {area.warnings.map((warning, wi) => (
                      <div key={wi} className={cn(
                        "text-[9px] px-2 py-1.5 rounded-lg mt-2",
                        theme === 'light' ? "bg-amber-50 text-amber-700" : "bg-amber-500/10 text-amber-400"
                      )}>
                        ⚠️ {warning}
                      </div>
                    ))}

                    {/* Cures */}
                    {cures.map((cure: FengShuiCure, ci: number) => (
                      <div key={ci} className={cn(
                        "p-2.5 rounded-lg border space-y-1",
                        theme === 'light' ? "bg-stone-50 border-stone-200" : "bg-stone-950/50 border-stone-800"
                      )}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {cureIcons[cure.type]}
                            <span className={cn("text-[11px] font-bold", theme === 'light' ? "text-stone-700" : "text-stone-300")}>
                              {lang === 'hi' ? cure.title.hi : cure.title.en}
                            </span>
                          </div>
                          <span className={cn(
                            "text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase border",
                            priorityColors[cure.priority]
                          )}>
                            {cure.priority}
                          </span>
                        </div>
                        <p className={cn("text-[10px] leading-relaxed", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
                          {lang === 'hi' ? cure.description.hi : cure.description.en}
                        </p>
                      </div>
                    ))}

                    {/* Enhancements */}
                    <div className={cn(
                      "text-[9px] px-2 py-1.5 rounded-lg",
                      theme === 'light' ? "bg-teal-50 text-teal-700" : "bg-emerald-500/10 text-emerald-400"
                    )}>
                      ✨ {language === 'hi' ? 'सुधार:' : 'Enhancements:'} {area.enhancements.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});