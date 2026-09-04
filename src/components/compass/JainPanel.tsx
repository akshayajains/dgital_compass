import { cn } from '@/lib/utils';
import { CheckCircle2, CircleDot, Heart, RotateCcw, Sparkles, Sun } from 'lucide-react';
import { ImpactStyle } from '@capacitor/haptics';

interface JainPanelProps {
  language: string;
  theme: string;
  jaapCount: number;
  incrementJaap: () => void;
  resetJaap: () => void;
  jainActivity: string;
  setJainActivity: (v: string) => void;
  checklist: Record<string, boolean>;
  toggleChecklistItem: (key: string) => void;
  onHaptic: (style?: ImpactStyle) => void;
}

export const JainPanel = ({
  language, theme, jaapCount, incrementJaap, resetJaap,
  jainActivity, setJainActivity, checklist, toggleChecklistItem, onHaptic
}: JainPanelProps) => {
  return (
    <div className="space-y-4">
      <div className={cn(
        "rounded-2xl p-5 text-center border relative overflow-hidden transition-all duration-300",
        theme === 'light'
          ? "bg-amber-50/40 border-amber-500/25 shadow-sm text-amber-900"
          : "bg-[#1a1510] border border-amber-500/20 shadow-inner"
      )}>
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 opacity-50" />

        <h4 className={cn("font-serif font-black text-sm uppercase tracking-widest mb-4 transition-colors", theme === 'light' ? "text-amber-800" : "text-amber-400")}>
          {language === 'hi' ? 'डिजिटल माला (Jaap)' : 'Digital Mala'}
        </h4>

        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="rgba(245, 158, 11, 0.1)" strokeWidth="8" fill="none" />
              <circle
                cx="64" cy="64" r="56"
                stroke="rgba(245, 158, 11, 0.8)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={351.85}
                strokeDashoffset={351.85 - (351.85 * (jaapCount / 108))}
                className="transition-all duration-300 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-4xl font-black transition-all", theme === 'light' ? "text-amber-900" : "text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]")}>
                {jaapCount}
              </span>
              <span className={cn("text-[10px] font-bold tracking-widest uppercase", theme === 'light' ? "text-amber-700/70" : "text-amber-500/70")}>/ 108</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={resetJaap}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-inner active:scale-95 border",
              theme === 'light'
                ? "bg-white border-stone-200 text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                : "bg-stone-900 border-stone-800 text-stone-500 hover:text-stone-300 hover:bg-stone-800"
            )}
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={incrementJaap}
            className="w-32 h-12 rounded-full bg-gradient-to-r from-amber-600 to-orange-500 text-white font-black text-lg shadow-[0_4px_12px_rgba(245,158,11,0.3)] active:scale-95 active:shadow-[0_2px_6px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center gap-2 border border-amber-300/50"
          >
            <CircleDot className="w-5 h-5" />
            {language === 'hi' ? 'जाप' : 'COUNT'}
          </button>
        </div>
      </div>

      <div className={cn(
        "p-4 rounded-xl border shadow-inner transition-colors duration-300",
        theme === 'light' ? "bg-white border-amber-500/20" : "bg-stone-950/80 border-stone-800"
      )}>
        <h5 className="text-[10px] text-stone-500 uppercase font-black tracking-wider mb-3">
          {language === 'hi' ? 'साधना चेकलिस्ट' : 'Sadhana Setup'}
        </h5>
        <div className="space-y-2">
          {[
            { id: 'direction', text: language === 'hi' ? 'सही दिशा की ओर मुख' : 'Facing correct direction' },
            { id: 'katasanu', text: language === 'hi' ? 'कटआसनु (आसन) बिछाया गया' : 'Katasanu (Asan) properly placed' },
            { id: 'peaceful', text: language === 'hi' ? 'शांत वातावरण' : 'Peaceful environment' }
          ].map(item => (
            <div
              key={item.id}
              onClick={() => toggleChecklistItem(item.id)}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg cursor-pointer active:scale-[0.99] border transition-colors duration-300",
                theme === 'light'
                  ? "bg-amber-50/30 border-amber-500/10 hover:bg-amber-50/60"
                  : "bg-stone-900/50 border-stone-800/50 hover:bg-stone-900"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded flex items-center justify-center border transition-all duration-300",
                checklist[item.id]
                  ? "bg-amber-500 border-amber-400 text-stone-950"
                  : (theme === 'light' ? "bg-white border-stone-300 text-transparent" : "bg-stone-950 border-stone-700 text-transparent")
              )}>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span className={cn(
                "text-xs font-medium transition-colors",
                checklist[item.id]
                  ? (theme === 'light' ? "text-amber-900" : "text-amber-100")
                  : "text-stone-400"
              )}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={cn(
        "p-4 rounded-xl border shadow-inner transition-colors duration-300",
        theme === 'light' ? "bg-white border-amber-500/20" : "bg-stone-950/80 border-stone-800"
      )}>
        <h5 className="text-[10px] text-stone-500 uppercase font-black tracking-wider mb-3">
          {language === 'hi' ? 'दैनिक चर्या दिशा निर्देश' : 'Daily Routine Directions'}
        </h5>
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
          {[
            { id: 'dhyan', label: language === 'hi' ? 'ध्यान / सामायिक' : 'Dhyan / Jaap', icon: <CircleDot className="w-5 h-5 mb-1" />, grad: 'from-amber-500 to-orange-500', glow: 'shadow-[0_0_12px_rgba(245,158,11,0.4)]' },
            { id: 'study', label: language === 'hi' ? 'स्वाध्याय' : 'Study', icon: <Heart className="w-5 h-5 mb-1" />, grad: 'from-rose-500 to-pink-500', glow: 'shadow-[0_0_12px_rgba(244,63,94,0.4)]' },
            { id: 'sleep', label: language === 'hi' ? 'निद्रा' : 'Sleep', icon: <Sun className="w-5 h-5 mb-1" />, grad: 'from-violet-500 to-indigo-500', glow: 'shadow-[0_0_12px_rgba(139,92,246,0.4)]' },
            { id: 'eat', label: language === 'hi' ? 'आहार' : 'Eating', icon: <Sparkles className="w-5 h-5 mb-1" />, grad: 'from-emerald-500 to-teal-500', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.4)]' }
          ].map(activity => (
            <button
              key={activity.id}
              onClick={() => {
                setJainActivity(activity.id);
                onHaptic();
              }}
              className={cn(
                "min-w-[7.5rem] snap-center py-4 px-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border flex flex-col items-center justify-center active:scale-95 bg-gradient-to-br text-white",
                activity.grad,
                jainActivity === activity.id
                  ? cn("border-white/70 scale-[1.03]", activity.glow)
                  : "border-white/20 opacity-80 hover:opacity-100"
              )}
            >
              {activity.icon}
              {activity.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};