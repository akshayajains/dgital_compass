import React from 'react';
import { X, CheckCircle2, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Language } from '@/types/compass';
import { translations } from '@/lib/translations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  language: Language;
}

export const CalibrationGuideModal: React.FC<Props> = ({ isOpen, onClose, theme, language }) => {
  if (!isOpen) return null;
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className={cn(
        "w-full max-w-sm rounded-3xl p-6 border shadow-2xl flex flex-col items-center text-center relative animate-in zoom-in-95",
        theme === 'light' ? "bg-white border-stone-200 text-stone-900" : "bg-stone-950 border-white/15 text-white"
      )}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
          <RotateCw className="w-7 h-7 animate-[spin_6s_linear_infinite]" />
        </div>

        <h3 className="text-lg font-black tracking-wide text-amber-400 mb-1">
          {t.calibTitle}
        </h3>
        <p className="text-xs text-stone-400 mb-5">
          {t.calibSubtitle}
        </p>

        {/* 8-Figure Vector Animation Graphic */}
        <div className="relative w-48 h-24 mb-5 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 200 100">
            {/* 8 Figure Track */}
            <path
              d="M 50,50 C 50,20 10,20 10,50 C 10,80 50,80 50,50 C 50,20 90,20 90,50 C 90,80 50,80 50,50 Z"
              fill="none"
              stroke="rgba(245, 158, 11, 0.3)"
              strokeWidth="4"
              strokeDasharray="4 4"
              transform="scale(2, 1)"
            />
            {/* Glowing Motion Particle */}
            <circle cx="100" cy="50" r="7" fill="#F59E0B" className="drop-shadow-[0_0_10px_#F59E0B] animate-pulse" />
          </svg>
        </div>

        {/* Instructions */}
        <div className="w-full flex flex-col gap-2.5 text-left text-xs mb-6">
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="text-stone-300 font-medium">{t.calibStep1}</span>
          </div>
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="text-stone-300 font-medium">{t.calibStep2}</span>
          </div>
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="text-stone-300 font-medium">{t.calibStep3}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black text-xs uppercase tracking-wider shadow-lg active:scale-98 transition-all hover:brightness-110"
        >
          {t.calibDone}
        </button>
      </div>
    </div>
  );
};
