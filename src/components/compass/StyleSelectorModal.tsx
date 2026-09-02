import React, { useState } from 'react';
import { X, Sparkles, Check, Compass } from 'lucide-react';
import { CompassStyleId, Language } from '@/types/compass';
import { COMPASS_STYLES } from '@/components/compass/CompassStyles';
import { translations } from '@/lib/translations';
import { cn } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedStyle: CompassStyleId;
  onSelectStyle: (id: CompassStyleId) => void;
  language: Language;
  theme: string;
}

export const StyleSelectorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  selectedStyle,
  onSelectStyle,
  language,
  theme
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const t = translations[language];

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: t.categories.all },
    { id: 'classic', label: t.categories.classic },
    { id: 'modern', label: t.categories.modern },
    { id: 'tactical', label: t.categories.tactical },
    { id: 'luxury', label: t.categories.luxury },
    { id: 'mystic', label: t.categories.mystic }
  ];

  const filteredStyles = selectedCategory === 'all'
    ? COMPASS_STYLES
    : COMPASS_STYLES.filter(s => s.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className={cn(
        "w-full max-w-lg max-h-[88vh] rounded-t-3xl sm:rounded-3xl p-5 border shadow-2xl flex flex-col relative animate-in slide-in-from-bottom-5 sm:zoom-in-95 overflow-hidden",
        theme === 'light' ? "bg-stone-50 border-stone-200 text-stone-900" : "bg-[#12100D] border-white/15 text-white"
      )}>
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <h3 className="text-sm font-black tracking-wide text-amber-400">
                {t.styleGallery}
              </h3>
              <span className="text-[10px] text-stone-400">
                {language === 'hi' ? '12+ ट्रेंडिंग व विशिष्ट डायल शैलियां' : '12+ Trending premium compass dialers'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 py-3 overflow-x-auto no-scrollbar shrink-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all duration-200",
                selectedCategory === cat.id
                  ? "bg-amber-500 text-stone-950 font-black shadow-md"
                  : "bg-white/5 text-stone-400 hover:text-white border border-white/5"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Styles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pr-1 pb-4 pt-1">
          {filteredStyles.map((style) => {
            const isSelected = selectedStyle === style.id;
            return (
              <button
                key={style.id}
                onClick={() => {
                  onSelectStyle(style.id);
                }}
                className={cn(
                  "p-3 rounded-2xl border text-left transition-all duration-300 relative group flex flex-col justify-between overflow-hidden",
                  isSelected
                    ? "border-amber-400 ring-2 ring-amber-400/40 shadow-lg scale-[1.02]"
                    : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                )}
                style={{ background: style.previewBg }}
              >
                {/* Active Badge */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shadow-md">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                {/* Dial Graphic Mini Preview */}
                <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center border-2 shadow-inner relative"
                  style={{ borderColor: style.primaryColor, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: style.accentColor }} />
                  <div className="absolute w-2.5 h-2.5 rounded-full" style={{ backgroundColor: style.primaryColor }} />
                </div>

                <div className="flex flex-col mt-1">
                  <span className="text-xs font-black text-white leading-tight drop-shadow-sm">
                    {language === 'hi' ? style.nameHi : style.nameEn}
                  </span>
                  <span className="text-[9px] text-stone-300 font-medium leading-tight mt-0.5 line-clamp-2 opacity-80">
                    {language === 'hi' ? style.tagHi : style.tagEn}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Close */}
        <div className="pt-2 border-t border-white/10 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black text-xs uppercase tracking-wider shadow-lg active:scale-98 transition-all"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
