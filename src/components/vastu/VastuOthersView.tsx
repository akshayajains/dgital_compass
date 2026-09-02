import React, { useState } from 'react';
import { Compass, Sparkles, Home, Shield, Flame, Droplet, Wind, Mountain, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations, getVastuDetails } from '@/lib/translations';

interface Props {
  currentHeading: number | null;
  triggerHaptic: () => void;
}

export const VastuOthersView: React.FC<Props> = ({ currentHeading, triggerHaptic }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const isHi = language === 'hi';

  const [selectedDirection, setSelectedDirection] = useState<number>(() => {
    return currentHeading !== null ? Math.round(currentHeading) : 0;
  });

  const activeVastu = getVastuDetails(selectedDirection, language);
  const currentLiveVastu = getVastuDetails(currentHeading, language);

  const vastuSectors = [
    { deg: 0, code: 'N', nameHi: 'उत्तर (कुबेर)', nameEn: 'North (Kuber)', icon: Droplet, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30' },
    { deg: 45, code: 'NE', nameHi: 'ईशान (मंदिर)', nameEn: 'North-East (Temple)', icon: Sparkles, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
    { deg: 90, code: 'E', nameHi: 'पूर्व (इंद्र)', nameEn: 'East (Indra)', icon: Wind, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
    { deg: 135, code: 'SE', nameHi: 'आग्नेय (रसोई)', nameEn: 'South-East (Kitchen)', icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
    { deg: 180, code: 'S', nameHi: 'दक्षिण (यम)', nameEn: 'South (Yama)', icon: Mountain, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
    { deg: 225, code: 'SW', nameHi: 'नैऋत्य (शयन)', nameEn: 'South-West (Master)', icon: Shield, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
    { deg: 270, code: 'W', nameHi: 'पश्चिम (वरुण)', nameEn: 'West (Varuna)', icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30' },
    { deg: 315, code: 'NW', nameHi: 'वायव्य (अतिथि)', nameEn: 'North-West (Guest)', icon: Home, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' }
  ];

  return (
    <div className="w-full max-w-sm flex flex-col items-center animate-in fade-in zoom-in-95 my-1">
      {/* Live Orientation Banner */}
      <div className="w-full rounded-2xl p-3 border border-amber-500/30 bg-gradient-to-r from-[#20150b]/90 via-[#2f1c0e]/90 to-[#180f06]/90 shadow-lg mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            {isHi ? 'लाइव कंपास वास्तु संरेखण' : 'Live Compass Vastu Alignment'}
          </span>
          <span className="font-mono text-xs font-black text-white">
            {currentHeading !== null ? `${Math.round(currentHeading)}°` : '0°'}
          </span>
        </div>

        <div className="flex items-baseline gap-2 mt-1">
          <span className={cn("text-base font-black", currentLiveVastu.color)}>
            {currentLiveVastu.name}
          </span>
          <span className="text-xs font-bold text-amber-200/90">
            • {currentLiveVastu.vastuTitle}
          </span>
        </div>

        <p className="text-[11px] text-stone-300 mt-1 leading-snug">
          {currentLiveVastu.vastuDesc}
        </p>
      </div>

      {/* 8 Directions Selector Grid */}
      <div className="w-full grid grid-cols-4 gap-1.5 mb-3">
        {vastuSectors.map((sec) => {
          const isSelected = Math.abs(selectedDirection - sec.deg) < 22.5 || (sec.deg === 0 && selectedDirection >= 337.5);
          const Icon = sec.icon;
          return (
            <button
              key={sec.deg}
              onClick={() => {
                setSelectedDirection(sec.deg);
                triggerHaptic();
              }}
              className={cn(
                "p-2 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95",
                isSelected
                  ? "bg-amber-500 text-stone-950 border-amber-400 font-black shadow-md scale-105 ring-2 ring-amber-400/40"
                  : "bg-stone-900/80 text-stone-300 border-white/10 hover:bg-stone-800"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", isSelected ? "text-stone-950" : sec.color)} />
              <span className="text-[10px] font-black leading-tight">
                {sec.code}
              </span>
              <span className="text-[8px] opacity-80 leading-none">
                {sec.deg}°
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Direction Deep-Dive Card */}
      <div className="w-full rounded-3xl p-4 border border-white/15 bg-stone-950/80 shadow-2xl flex flex-col gap-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex flex-col text-left">
            <span className="text-xs font-black uppercase text-amber-400">
              {activeVastu.name} ({activeVastu.code})
            </span>
            <span className="text-sm font-black text-white mt-0.5">
              {activeVastu.vastuTitle}
            </span>
          </div>

          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-white/5 border border-white/10 text-stone-300">
            {selectedDirection}°
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-left text-xs">
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[9px] uppercase font-bold text-stone-400 block">
              {isHi ? 'तत्व (Element)' : 'Element'}
            </span>
            <span className="font-bold text-stone-200 mt-0.5 block">
              {activeVastu.element}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[9px] uppercase font-bold text-stone-400 block">
              {isHi ? 'अधिष्ठाता देव (Deity)' : 'Ruling Deity'}
            </span>
            <span className="font-bold text-amber-300 mt-0.5 block">
              {activeVastu.deity}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left">
          <span className="text-[10px] uppercase font-black text-amber-400 block mb-1">
            {isHi ? 'वास्तु सुझाव एवं प्रभाव' : 'Vastu Recommendation & Energy Flow'}
          </span>
          <p className="text-xs text-stone-200 leading-relaxed font-medium">
            {activeVastu.vastuDesc}
          </p>
        </div>
      </div>
    </div>
  );
};
