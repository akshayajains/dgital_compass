import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';

interface Props {
  className?: string;
}

export const CreatorBanner: React.FC<Props> = ({ className }) => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className={cn("w-full max-w-sm flex flex-col items-center mt-3 mb-2 animate-in fade-in", className)}>
      {/* Creator Card */}
      <div className="w-full p-4 rounded-3xl border border-amber-500/25 bg-gradient-to-r from-[#23170e]/95 via-[#342013]/95 to-[#1c120a]/95 shadow-[0_10px_30px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(245,158,11,0.25)] relative overflow-hidden backdrop-blur-md">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-16 bg-amber-500/15 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] sm:text-sm font-serif font-black tracking-widest uppercase bg-gradient-to-r from-[#FDE68A] via-[#F59E0B] to-[#D97706] bg-clip-text text-transparent drop-shadow-sm">
              {t.creatorTitle}
            </span>
          </div>

          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border border-amber-500/40 bg-amber-500/15 text-amber-300 shadow-sm">
            {t.creatorBadge}
          </span>
        </div>

        <p className="text-[10px] sm:text-[11px] font-medium text-amber-200/80 tracking-wide mt-0.5">
          {t.creatorSubtitle}
        </p>
      </div>

      {/* Footer Tagline */}
      <div className="flex items-center gap-1 mt-2 text-[10px] font-medium text-stone-400/90 tracking-wide">
        <span>{t.creatorFooter}</span>
      </div>
    </div>
  );
};
