import React from 'react';
import { X, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Target, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VASTU_32_PADAS, VastuPada32 } from '@/lib/vastu32Devta';
import { toast } from 'sonner';

interface DevtaPadaModalProps {
  pada: VastuPada32 | null;
  onClose: () => void;
  onSelectPada: (pada: VastuPada32) => void;
  onLockBearing?: (deg: number) => void;
  language: string;
  theme: string;
}

export const DevtaPadaModal: React.FC<DevtaPadaModalProps> = ({
  pada,
  onClose,
  onSelectPada,
  onLockBearing,
  language,
  theme
}) => {
  if (!pada) return null;

  const isDark = theme !== 'light';
  const isHi = language === 'hi';

  const currentIndex = VASTU_32_PADAS.findIndex(p => p.code === pada.code);
  const prevPada = VASTU_32_PADAS[(currentIndex - 1 + VASTU_32_PADAS.length) % VASTU_32_PADAS.length];
  const nextPada = VASTU_32_PADAS[(currentIndex + 1) % VASTU_32_PADAS.length];

  const handleShare = async () => {
    const text = `🏛️ 32 Devta Pada: ${pada.nameHi} (${pada.code} / ${pada.nameEn})\n` +
      `🧭 Range: ${pada.startDeg}° – ${pada.endDeg}° (Center: ${pada.centerDeg}°)\n` +
      `✨ Status: ${pada.isAuspicious ? '★ Auspicious / शुभ द्वार' : 'Non-Auspicious / विचारणीय'}\n` +
      `🌊 Element: ${pada.elementNameHi} (${pada.element})\n` +
      `📜 Effect: ${isHi ? pada.resultHi : pada.resultEn}\n` +
      `🏠 Ideal Usage: ${isHi ? pada.usageHi : pada.usageEn}\n` +
      `— Digital Compass Vastu Suite`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        toast.success(isHi ? 'पद विवरण कॉपी हो गया!' : 'Devta Pada details copied!');
      }
    } catch {
      toast.info('Copied details');
    }
  };

  const getZoneLabel = (zone: string) => {
    switch (zone) {
      case 'N': return isHi ? 'उत्तर (North - कुबेर क्षेत्र)' : 'North (Kubera Zone)';
      case 'E': return isHi ? 'पूर्व (East - इंद्र/सूर्य क्षेत्र)' : 'East (Indra/Surya Zone)';
      case 'S': return isHi ? 'दक्षिण (South - यम क्षेत्र)' : 'South (Yama Zone)';
      case 'W': return isHi ? 'पश्चिम (West - वरुण क्षेत्र)' : 'West (Varuna Zone)';
      default: return zone;
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div 
        className={cn(
          "relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]",
          isDark 
            ? "bg-gradient-to-b from-stone-900 via-stone-950 to-black border-amber-500/30 text-white" 
            : "bg-gradient-to-b from-amber-50 via-stone-100 to-amber-100/90 border-amber-300 text-stone-900"
        )}
      >
        {/* Top Header */}
        <div className={cn(
          "px-5 py-4 border-b flex items-center justify-between",
          pada.isAuspicious 
            ? (isDark ? "bg-emerald-950/40 border-emerald-500/30" : "bg-emerald-100/70 border-emerald-300")
            : (isDark ? "bg-stone-900/60 border-amber-500/20" : "bg-amber-100/70 border-amber-200")
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-md",
              pada.isAuspicious 
                ? "bg-emerald-500 text-stone-950 ring-2 ring-emerald-300" 
                : "bg-amber-500/20 border border-amber-500 text-amber-400"
            )}>
              {pada.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">{pada.nameHi}</h3>
                <span className="text-xs font-semibold opacity-70">({pada.nameEn})</span>
              </div>
              <p className="text-[11px] font-mono text-amber-400 font-bold">
                {pada.startDeg}° – {pada.endDeg}° <span className="opacity-60">| Center: {pada.centerDeg}°</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className={cn(
                "p-2 rounded-full border transition-all active:scale-95",
                isDark ? "bg-stone-800/80 border-white/10 hover:bg-stone-700 text-stone-300" : "bg-white border-stone-300 text-stone-700 hover:bg-stone-100"
              )}
              title="Share / Copy"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-full border transition-all active:scale-95",
                isDark ? "bg-stone-800/80 border-white/10 hover:bg-stone-700 text-white" : "bg-white border-stone-300 text-stone-900 hover:bg-stone-100"
              )}
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Auspicious Status Pill */}
          <div className={cn(
            "p-3.5 rounded-2xl border flex items-center gap-3",
            pada.isAuspicious 
              ? (isDark ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300" : "bg-emerald-50 border-emerald-300 text-emerald-900")
              : (isDark ? "bg-amber-950/30 border-amber-500/30 text-amber-200" : "bg-amber-50 border-amber-300 text-amber-900")
          )}>
            {pada.isAuspicious ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
            )}
            <div>
              <span className="text-xs font-black uppercase tracking-wider block">
                {pada.isAuspicious
                  ? (isHi ? '★ अत्यंत शुभ मुख्य द्वार (Auspicious Gate)' : '★ Highly Auspicious Entrance')
                  : (isHi ? 'सामान्य / विचारणीय द्वार (Non-Ideal Entrance)' : 'Cautionary for Main Entrance')}
              </span>
              <p className="text-[11px] opacity-90 mt-0.5">
                {isHi ? pada.resultHi : pada.resultEn}
              </p>
            </div>
          </div>

          {/* Key Attributes Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Cardinal Zone */}
            <div className={cn(
              "p-3 rounded-2xl border",
              isDark ? "bg-stone-900/60 border-white/10" : "bg-white/80 border-stone-200"
            )}>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                {isHi ? 'दिशा क्षेत्र' : 'Cardinal Zone'}
              </span>
              <span className="text-xs font-black text-amber-400 mt-1 block">
                {getZoneLabel(pada.zone)}
              </span>
            </div>

            {/* Element */}
            <div className={cn(
              "p-3 rounded-2xl border",
              isDark ? "bg-stone-900/60 border-white/10" : "bg-white/80 border-stone-200"
            )}>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                {isHi ? 'पंचतत्व' : 'Element'}
              </span>
              <span className="text-xs font-black text-cyan-400 mt-1 block">
                {pada.elementNameHi} ({pada.element})
              </span>
            </div>
          </div>

          {/* Ideal Usages & Placements */}
          <div className={cn(
            "p-4 rounded-2xl border space-y-1.5",
            isDark ? "bg-stone-900/50 border-white/10" : "bg-white/90 border-stone-200"
          )}>
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isHi ? 'आदर्श कक्ष एवं उपयोग' : 'Ideal Room & Placement Usage'}</span>
            </div>
            <p className={cn("text-xs font-medium leading-relaxed", isDark ? "text-stone-300" : "text-stone-700")}>
              {isHi ? pada.usageHi : pada.usageEn}
            </p>
          </div>

          {/* Vastu Remedy Guidance if Not Auspicious */}
          {!pada.isAuspicious && (
            <div className={cn(
              "p-4 rounded-2xl border space-y-1.5",
              isDark ? "bg-amber-950/20 border-amber-500/20" : "bg-amber-50/80 border-amber-200"
            )}>
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>{isHi ? 'वास्तु दोष निवारण उपाय' : 'Vastu Remedy / Balancing'}</span>
              </div>
              <p className={cn("text-xs font-medium leading-relaxed", isDark ? "text-stone-300" : "text-stone-700")}>
                {isHi
                  ? 'यदि इस पद पर द्वार या खिड़की हो तो चौखट पर पीतल या तांबे की पट्टी लगाएं, और मुख्य द्वार पर ओंकार या स्वस्तिक स्थापित करें।'
                  : 'If an entrance exists in this pada, install a copper/brass wire strip on the threshold and place a brass Swastika above the lintel.'}
              </p>
            </div>
          )}

          {/* Lock Bearing on this Pada Action */}
          {onLockBearing && (
            <button
              onClick={() => {
                onLockBearing(pada.centerDeg);
                onClose();
                toast.success(
                  isHi
                    ? `लक्ष्य दिशा ${pada.centerDeg}° (${pada.nameHi}) पर लॉक हुई`
                    : `Locked target bearing to ${pada.centerDeg}° (${pada.nameEn})`
                );
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Target className="w-4 h-4" />
              <span>{isHi ? `इस पद पर कंपास लॉक करें (${pada.centerDeg}°)` : `Lock Compass to ${pada.nameEn} (${pada.centerDeg}°)`}</span>
            </button>
          )}
        </div>

        {/* Bottom Pagination Controls */}
        <div className={cn(
          "px-5 py-3 border-t flex items-center justify-between",
          isDark ? "bg-black/50 border-white/10" : "bg-stone-100 border-stone-200"
        )}>
          <button
            onClick={() => onSelectPada(prevPada)}
            className={cn(
              "flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all active:scale-95",
              isDark ? "bg-stone-900 border-white/10 text-stone-300 hover:text-white" : "bg-white border-stone-300 text-stone-700"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{prevPada.nameHi} ({prevPada.code})</span>
          </button>

          <span className="text-[11px] font-mono font-bold text-stone-400">
            {currentIndex + 1} / 32
          </span>

          <button
            onClick={() => onSelectPada(nextPada)}
            className={cn(
              "flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all active:scale-95",
              isDark ? "bg-stone-900 border-white/10 text-stone-300 hover:text-white" : "bg-white border-stone-300 text-stone-700"
            )}
          >
            <span>{nextPada.nameHi} ({nextPada.code})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
