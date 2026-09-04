import { cn } from '@/lib/utils';

interface FengShuiPanelProps {
  language: string;
  theme: string;
  fengshuiDoor: number;
  setFengshuiDoor: (v: number) => void;
}

export const FengShuiPanel = ({ language, theme, fengshuiDoor, setFengshuiDoor }: FengShuiPanelProps) => {
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
        <p className={cn("text-[11px] leading-relaxed mb-3 transition-colors", theme === 'light' ? "text-stone-600" : "text-stone-300")}>
          {language === 'hi'
            ? 'अपने मुख्य द्वार की दिशा चुनें। कम्पास पर बागुआ मैप आपके घर के अनुसार घूम जाएगा।'
            : 'Select your front door facing direction to align the Bagua map dynamically.'}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className={cn(
            "p-2 rounded-lg border transition-colors duration-300",
            theme === 'light' ? "bg-white border-blue-500/10" : "bg-stone-900 border-stone-800"
          )}>
            <span className="text-[10px] text-stone-500 uppercase font-black">{language === 'hi' ? 'धन-सम्पत्ति' : 'Wealth'}</span>
            <p className="text-[10px] text-blue-500 font-bold">{language === 'hi' ? 'दक्षिण-पूर्व' : 'South-East'}</p>
          </div>
          <div className={cn(
            "p-2 rounded-lg border transition-colors duration-300",
            theme === 'light' ? "bg-white border-blue-500/10" : "bg-stone-900 border-stone-800"
          )}>
            <span className="text-[10px] text-stone-500 uppercase font-black">{language === 'hi' ? 'प्रेम / विवाह' : 'Love'}</span>
            <p className="text-[10px] text-pink-500 font-bold">{language === 'hi' ? 'दक्षिण-पश्चिम' : 'South-West'}</p>
          </div>
          <div className={cn(
            "p-2 rounded-lg border transition-colors duration-300",
            theme === 'light' ? "bg-white border-blue-500/10" : "bg-stone-900 border-stone-800"
          )}>
            <span className="text-[10px] text-stone-500 uppercase font-black">{language === 'hi' ? 'कैरियर' : 'Career'}</span>
            <p className="text-[10px] text-sky-500 font-bold">{language === 'hi' ? 'उत्तर' : 'North'}</p>
          </div>
          <div className={cn(
            "p-2 rounded-lg border transition-colors duration-300",
            theme === 'light' ? "bg-white border-blue-500/10" : "bg-stone-900 border-stone-800"
          )}>
            <span className="text-[10px] text-stone-500 uppercase font-black">{language === 'hi' ? 'परिवार' : 'Family'}</span>
            <p className="text-[10px] text-emerald-500 font-bold">{language === 'hi' ? 'पूर्व' : 'East'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};