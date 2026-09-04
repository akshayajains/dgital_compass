import { cn } from '@/lib/utils';
import { ImpactStyle } from '@capacitor/haptics';

interface JyotishPanelProps {
  language: string;
  theme: string;
  jyotishRashi: string;
  setJyotishRashi: (v: string) => void;
  onHaptic: (style?: ImpactStyle) => void;
}

export const JyotishPanel = ({ language, theme, jyotishRashi, setJyotishRashi, onHaptic }: JyotishPanelProps) => {
  return (
    <div className="space-y-4">
      <div className={cn(
        "rounded-2xl p-4 border transition-all duration-300",
        theme === 'light'
          ? "bg-fuchsia-50/50 border-fuchsia-500/25 shadow-sm text-fuchsia-900"
          : "bg-[#1a1224] border-fuchsia-500/20 shadow-inner"
      )}>
        <div className="flex justify-between items-start mb-3">
          <h4 className={cn("font-extrabold text-sm transition-colors", theme === 'light' ? "text-fuchsia-900" : "text-fuchsia-300")}>{language === 'hi' ? 'ज्योतिष दिशा (Jyotish)' : 'Vedic Astrology'}</h4>
        </div>

        <div className="mb-4">
          <label className="text-[10px] text-stone-400 uppercase font-black tracking-wider block mb-1.5">
            {language === 'hi' ? 'अपनी राशि चुनें:' : 'Select Your Zodiac (Rashi):'}
          </label>
          <select
            value={jyotishRashi}
            onChange={(e) => { setJyotishRashi(e.target.value); onHaptic(ImpactStyle.Medium); }}
            className={cn(
              "w-full text-sm font-extrabold px-3 py-2.5 rounded-xl appearance-none outline-none transition-all duration-300 border shadow-inner",
              theme === 'light'
                ? "bg-white border-fuchsia-500/30 text-fuchsia-900 focus:border-fuchsia-500"
                : "bg-stone-950 border-fuchsia-500/30 text-fuchsia-200 focus:border-fuchsia-400"
            )}
          >
            {[
              { id: 'aries', label: '♈ मेष (Aries) - East' },
              { id: 'taurus', label: '♉ वृषभ (Taurus) - South' },
              { id: 'gemini', label: '♊ मिथुन (Gemini) - West' },
              { id: 'cancer', label: '♋ कर्क (Cancer) - North' },
              { id: 'leo', label: '♌ सिंह (Leo) - East' },
              { id: 'virgo', label: '♍ कन्या (Virgo) - South' },
              { id: 'libra', label: '♎ तुला (Libra) - West' },
              { id: 'scorpio', label: '♏ वृश्चिक (Scorpio) - North' },
              { id: 'sagittarius', label: '♐ धनु (Sagittarius) - East' },
              { id: 'capricorn', label: '♑ मकर (Capricorn) - South' },
              { id: 'aquarius', label: '♒ कुंभ (Aquarius) - West' },
              { id: 'pisces', label: '♓ मीन (Pisces) - North' }
            ].map(rashi => (
              <option key={rashi.id} value={rashi.id}>{rashi.label}</option>
            ))}
          </select>
        </div>

        <div className={cn(
          "p-3 rounded-xl border shadow-inner transition-colors duration-300",
          theme === 'light' ? "bg-white border-fuchsia-500/20" : "bg-stone-950/80 border-stone-800"
        )}>
          <h5 className="text-[10px] text-stone-500 uppercase font-black tracking-wider mb-2">{language === 'hi' ? 'ज्योतिष सुझाव' : 'Astrology Tips'}</h5>
          <p className={cn("text-[11px] leading-relaxed font-medium transition-colors", theme === 'light' ? "text-fuchsia-900" : "text-stone-300")}>
            {language === 'hi'
              ? 'आपकी राशि के अनुसार शुभ दिशा को कम्पास पर हाइलाइट किया गया है।'
              : 'Your auspicious direction based on your Rashi is highlighted on the compass.'}
          </p>
        </div>
      </div>
    </div>
  );
};