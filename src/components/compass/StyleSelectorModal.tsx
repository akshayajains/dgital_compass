import React, { useState } from 'react';
import { X, Sparkles, Check, LayoutGrid } from 'lucide-react';
import { CompassStyleId, CompassStyleInfo, Language } from '@/types/compass';
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
  /** Currently active variant id (for grouped themes) */
  selectedVariantId?: string | null;
  /** Callback when a variant swatch is tapped */
  onSelectVariant?: (styleId: CompassStyleId, variantId: string) => void;
}

export const StyleSelectorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  selectedStyle,
  onSelectStyle,
  language,
  theme,
  selectedVariantId,
  onSelectVariant,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const t = translations[language];
  const isHi = language === 'hi';

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

  const dark = theme !== 'light';

  // Render a representative needle for the mini preview based on the theme's needle type.
  // This makes each theme's preview visually distinct instead of a generic needle.
  const renderMiniNeedle = (style: CompassStyleInfo, themeColor?: string) => {
    const p = style.primaryColor;
    const a = style.accentColor;
    switch (style.needleType) {
      case 'ios_needle':
        return (
          <>
            <polygon points="100,34 90,112 100,98" fill="#EF4444" />
            <polygon points="100,34 110,112 100,98" fill="#B91C1C" />
            <polygon points="100,168 92,112 100,120" fill="#E2E8F0" />
            <polygon points="100,168 108,112 100,120" fill="#CBD5E1" />
          </>
        );
      case 'metal_needle':
        return (
          <>
            <polygon points="100,34 88,112 100,98" fill="#E2E8F0" />
            <polygon points="100,34 112,112 100,98" fill="#94A3B8" />
            <polygon points="100,168 90,112 100,120" fill="#475569" />
            <polygon points="100,168 110,112 100,120" fill="#1E293B" />
          </>
        );
      case 'delta_bicolor':
        return (
          <>
            <polygon points="100,34 82,80 100,66" fill={themeColor ?? '#E2E8F0'} />
            <polygon points="100,34 100,66 118,80" fill="#EF4444" />
          </>
        );
      case 'ornate_spear':
        return (
          <>
            <polygon points="100,34 88,112 100,98" fill={a} />
            <polygon points="100,34 112,112 100,98" fill={p} />
            <polygon points="100,168 90,112 100,120" fill="#8C6239" />
            <polygon points="100,168 110,112 100,120" fill="#52361B" />
          </>
        );
      case 'laser_hud':
        return (
          <>
            <line x1="100" y1="30" x2="100" y2="90" stroke={a} strokeWidth="4" strokeLinecap="round" />
            <polygon points="100,34 92,60 108,60" fill={a} />
          </>
        );
      case 'stealth_needle':
        return (
          <>
            <line x1="100" y1="30" x2="100" y2="100" stroke={a} strokeWidth="3" strokeLinecap="round" />
            <circle cx="100" cy="34" r="3" fill="#FFFFFF" />
          </>
        );
      case 'chakra_arrow':
        return (
          <>
            <polygon points="100,34 88,112 100,98" fill="#EF4444" />
            <polygon points="100,34 112,112 100,98" fill="#B91C1C" />
            <polygon points="100,168 90,112 100,120" fill="#78350F" />
            <polygon points="100,168 110,112 100,120" fill="#451A03" />
          </>
        );
      case 'tactical_crosshair':
        return (
          <>
            <polygon points="100,34 90,80 100,66" fill="#22C55E" />
            <polygon points="100,34 100,66 110,80" fill="#15803D" />
            <line x1="100" y1="66" x2="100" y2="140" stroke="#F97316" strokeWidth="2" strokeDasharray="3 3" />
          </>
        );
      case 'pulsar_pointer':
        return (
          <>
            <polygon points="100,34 88,80 100,66" fill="#C084FC" />
            <polygon points="100,34 100,66 112,80" fill="#818CF8" />
            <polygon points="100,168 92,120 100,130" fill="#312E81" />
            <polygon points="100,168 108,120 100,130" fill="#1E1B4B" />
          </>
        );
      case 'graphite_needle':
        return (
          <>
            <polygon points="100,34 88,112 100,98" fill="#D1D5DB" />
            <polygon points="100,34 112,112 100,98" fill="#6B7280" />
            <polygon points="100,168 90,112 100,120" fill="#6B7280" />
            <polygon points="100,168 110,112 100,120" fill="#1F2937" />
            <circle cx="100" cy="36" r="3" fill="#EF4444" />
          </>
        );
      default:
        return (
          <>
            <polygon points="100,30 88,112 100,96" fill={a} opacity="0.95" />
            <polygon points="100,30 112,112 100,96" fill={p} opacity="0.85" />
          </>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className={cn(
        "w-full max-w-lg max-h-[88vh] rounded-t-3xl sm:rounded-3xl flex flex-col relative animate-in slide-in-from-bottom-5 sm:zoom-in-95 overflow-hidden border",
        dark ? "bg-[#0E0C0A] border-white/10" : "bg-stone-50 border-stone-200"
      )}>
        {/* Ambient glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-40 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        {/* ── Header ── */}
        <div className="relative flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center border shadow-lg",
              dark ? "bg-gradient-to-br from-amber-500/25 to-amber-600/10 text-amber-400 border-amber-500/30" : "bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-400"
            )}>
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
              <h3 className={cn("text-base font-black tracking-wide", dark ? "text-amber-400" : "text-amber-600")}>
                {t.styleGallery}
              </h3>
              <span className={cn("text-[10px]", dark ? "text-stone-400" : "text-stone-500")}>
                {isHi ? `${COMPASS_STYLES.length} प्रीमियम डायल शैलियां` : `${COMPASS_STYLES.length} premium compass dialers`}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-full transition-colors",
              dark ? "hover:bg-white/10 text-stone-400 hover:text-white" : "hover:bg-stone-200 text-stone-500 hover:text-stone-900"
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Category Tabs ── */}
        <div className="relative flex items-center gap-1.5 px-5 py-2.5 overflow-x-auto no-scrollbar shrink-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all duration-200 border",
                selectedCategory === cat.id
                  ? "bg-amber-500 text-stone-950 font-black shadow-md border-amber-400 scale-105"
                  : dark
                    ? "bg-white/5 text-stone-400 hover:text-white border-white/10"
                    : "bg-white text-stone-500 hover:text-stone-900 border-stone-200"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ── Styles Grid ── */}
        <div className="relative grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto px-5 pb-4 pt-2">
          {filteredStyles.map((style) => {
            const isSelected = selectedStyle === style.id;
            const hasVariants = !!style.variants && style.variants.length > 0;
            // For grouped themes, reflect the currently selected variant's colors in the preview
            const activeVariant = hasVariants
              ? style.variants!.find((v) => v.id === selectedVariantId) ?? style.variants![0]
              : undefined;
            const previewPrimary = activeVariant?.primaryColor ?? style.primaryColor;
            const previewAccent = activeVariant?.accentColor ?? style.accentColor;
            const previewBg = activeVariant?.previewBg ?? style.previewBg;

            return (
              <div
                key={style.id}
                className={cn(
                  "rounded-2xl border text-left transition-all duration-300 relative group flex flex-col overflow-hidden",
                  isSelected
                    ? "border-amber-400 ring-2 ring-amber-400/40 shadow-lg scale-[1.02]"
                    : dark
                      ? "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                      : "border-stone-200 bg-white hover:border-amber-300 hover:shadow-md"
                )}
                style={{ background: previewBg }}
              >
                {/* Main clickable card */}
                <button
                  onClick={() => {
                    onSelectStyle(style.id);
                    if (hasVariants && onSelectVariant) {
                      onSelectVariant(style.id, style.variants![0].id);
                    }
                  }}
                  className="p-3 text-left w-full"
                >
                  {/* Active Badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shadow-md z-10">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Dial Graphic Mini Preview */}
                  <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center border-2 shadow-inner relative overflow-hidden group-hover:scale-105 transition-transform duration-300"
                    style={{ borderColor: previewPrimary, background: previewBg }}>
                    <svg viewBox="0 0 200 200" className="w-full h-full pointer-events-none">
                      <defs>
                        <radialGradient id={`rg-${style.id}`} cx="30%" cy="30%" r="60%">
                          <stop offset="0%" stopColor={previewPrimary} stopOpacity="0.3" />
                          <stop offset="60%" stopColor={previewPrimary} stopOpacity="0.08" />
                          <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
                        </radialGradient>
                        <linearGradient id={`nl-${style.id}`} x1="0%" y1="100%" x2="0%" y2="0%">
                          <stop offset="0%" stopColor={previewPrimary} stopOpacity="0.8" />
                          <stop offset="100%" stopColor={previewAccent} stopOpacity="1" />
                        </linearGradient>
                        <linearGradient id={`ns-${style.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={previewPrimary} stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#000000" stopOpacity="0.8" />
                        </linearGradient>
                      </defs>

                      <circle cx="100" cy="100" r="86" fill="none" stroke={previewPrimary} strokeWidth="4" opacity="0.5" />
                      <circle cx="100" cy="100" r="72" fill={`url(#rg-${style.id})`} />
                      <circle cx="100" cy="100" r="72" fill="none" stroke={previewPrimary} strokeWidth="1.5" opacity="0.35" />
                      <circle cx="100" cy="100" r="50" fill="none" stroke={previewPrimary} strokeWidth="0.5" strokeDasharray="3 3" opacity="0.25" />
                      {/* Theme-specific needle */}
                      {renderMiniNeedle(style, style.id === 'color_palette' ? previewPrimary : undefined)}
                      {/* Center hub */}
                      <circle cx="100" cy="100" r="8" fill={previewPrimary} opacity="0.4" />
                      <circle cx="100" cy="100" r="4" fill={previewAccent} opacity="0.8" />

                      {style.premium && (
                        <g className="transition-transform duration-300 group-hover:scale-110">
                          <circle cx="155" cy="40" r="7" fill="#FDE047" opacity="0.95" />
                          <path d="M154 36 L156 44 M150 40 L158 40" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
                        </g>
                      )}
                    </svg>
                    {style.premium && (
                      <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shadow-sm shadow-[0_0_12px_rgba(245,158,11,0.6)]">
                        <Sparkles className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col mt-1">
                    <span className="text-xs font-black text-white leading-tight drop-shadow-sm">
                      {isHi ? style.nameHi : style.nameEn}
                    </span>
                    <span className="text-[9px] text-stone-300 font-medium leading-tight mt-0.5 line-clamp-2 opacity-80">
                      {isHi ? style.tagHi : style.tagEn}
                    </span>
                  </div>
                </button>

                {/* ── Variant Color Swatches ── */}
                {hasVariants && (
                  <div className="px-3 pb-3 pt-1 flex flex-col gap-1.5">
                    <span className="text-[8px] font-black uppercase tracking-[0.18em] text-stone-500">
                      {isHi ? 'रंग चुनें' : 'COLORS'}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {style.variants!.map((v) => {
                        const activeVariant = isSelected && selectedVariantId === v.id;
                        return (
                          <button
                            key={v.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isSelected) {
                                onSelectStyle(style.id);
                              }
                              if (onSelectVariant) {
                                onSelectVariant(style.id, v.id);
                              }
                            }}
                            className={cn(
                              "w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center shrink-0 active:scale-90",
                              activeVariant
                                ? "border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)] scale-110"
                                : "border-white/20 hover:border-white/50 hover:scale-105"
                            )}
                            style={{ backgroundColor: v.colorSwatch }}
                            title={isHi ? v.nameHi : v.nameEn}
                          >
                            {activeVariant && (
                              <Check className="w-3 h-3 text-stone-950 stroke-[3]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {isSelected && selectedVariantId && (
                      <span className="text-[8px] font-bold text-amber-400/80 leading-none">
                        {(() => {
                          const activeV = style.variants!.find(v => v.id === selectedVariantId);
                          if (!activeV) return null;
                          return isHi ? activeV.nameHi : activeV.nameEn;
                        })()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div className="relative pt-2 pb-4 px-5 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black text-xs uppercase tracking-wider shadow-lg active:scale-98 transition-all"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
