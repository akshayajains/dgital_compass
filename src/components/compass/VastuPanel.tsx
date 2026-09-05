import { cn } from '@/lib/utils';
import { Grid, Save, Trash2 } from 'lucide-react';
import { ImpactStyle } from '@capacitor/haptics';

interface VastuPanelProps {
  language: string;
  theme: string;
  vastuScore: number | null;
  selectedRoom: string;
  setSelectedRoom: (v: string) => void;
  doorDegree: number;
  setDoorDegree: (v: number) => void;
  house9Grid: Record<string, string>;
  setHouse9Grid: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
  onHaptic: (style?: ImpactStyle) => void;
  currentDir: string;
  savedRooms: Array<{ id: string; room: string; door: number; grid: Record<string, string> }>;
  onSaveRoom: (name: string) => void;
  onLoadRoom: (id: string) => void;
  onDeleteRoom: (id: string) => void;
}

export const VastuPanel = ({
  language, theme, vastuScore, selectedRoom, setSelectedRoom,
  doorDegree, setDoorDegree, house9Grid, setHouse9Grid, onHaptic,
  currentDir, savedRooms, onSaveRoom, onLoadRoom, onDeleteRoom
}: VastuPanelProps) => {
  return (
    <div className="space-y-4">
      <div className={cn(
        "rounded-2xl p-4 border transition-all duration-300",
        theme === 'light'
          ? "bg-amber-50/50 border-amber-500/25 shadow-sm text-amber-950"
          : "bg-[#181510] border-amber-500/15 shadow-inner"
      )}>
        <div className="flex justify-between items-start mb-3">
          <h4 className={cn("font-extrabold text-sm transition-colors", theme === 'light' ? "text-amber-900" : "text-amber-200")}>{language === 'hi' ? 'वास्तु विश्लेषक' : 'Vastu Analyzer'}</h4>
          {vastuScore !== null && (
            <div className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-black border tracking-wider",
              vastuScore === 100 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
              vastuScore === 0 ? "bg-red-500/20 text-red-400 border-red-500/30" :
              (theme === 'light' ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-amber-500/20 text-amber-400 border-amber-500/30")
            )}>
              {language === 'hi' ? 'स्कोर: ' : 'Score: '}{vastuScore}%
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className={cn("text-[10px] uppercase font-black tracking-wider block mb-1.5", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
            {language === 'hi' ? 'कक्ष का प्रकार चुनें:' : 'Select Room Type:'}
          </label>
          <select
            value={selectedRoom}
            onChange={(e) => { setSelectedRoom(e.target.value); onHaptic(ImpactStyle.Medium); }}
            className={cn(
              "w-full text-sm font-extrabold px-3 py-2.5 rounded-xl appearance-none outline-none transition-all duration-300 border shadow-inner",
              theme === 'light'
                ? "bg-white border-amber-500/30 text-amber-900 focus:border-amber-500"
                : "bg-stone-950 border-amber-500/30 text-amber-100 focus:border-amber-400"
            )}
          >
            {[
              { id: 'entrance', label: language === 'hi' ? '🚪 मुख्य द्वार (Entrance)' : '🚪 Entrance / Main Door' },
              { id: 'master_bedroom', label: language === 'hi' ? '🛏️ मास्टर बेडरूम (Master Bed)' : '🛏️ Master Bedroom' },
              { id: 'kitchen', label: language === 'hi' ? '🍳 रसोई (Kitchen)' : '🍳 Kitchen / Rasoi' },
              { id: 'pooja', label: language === 'hi' ? '🕉️ पूजा घर (Mandir)' : '🕉️ Pooja / Mandir' },
              { id: 'study', label: language === 'hi' ? '📚 अध्ययन कक्ष (Study)' : '📚 Study Room' },
              { id: 'bathroom', label: language === 'hi' ? '🚿 बाथरूम (Bathroom)' : '🚿 Bathroom / Toilet' },
              { id: 'staircase', label: language === 'hi' ? '🪜 सीढ़ियाँ (Staircase)' : '🪜 Staircase' },
              { id: 'water_overhead', label: language === 'hi' ? '🚰 पानी की टंकी (ऊपर)' : '🚰 Overhead Water Tank' },
              { id: 'water_underground', label: language === 'hi' ? '💧 बोरवेल/टंकी (नीचे)' : '💧 Underground Tank / Well' },
              { id: 'guest', label: language === 'hi' ? '🛋️ अतिथि कक्ष (Guest Room)' : '🛋️ Guest Room' },
              { id: 'cash', label: language === 'hi' ? '💰 तिजोरी (Cash Locker)' : '💰 Cash / Locker' },
              { id: 'business', label: language === 'hi' ? '🏢 व्यापार / दुकान (Business)' : '🏢 Business / Shop' },
              { id: 'naukari', label: language === 'hi' ? '💼 नौकरी (Career)' : '💼 Job / Career' },
            ].map(room => (
              <option key={room.id} value={room.id}>{room.label}</option>
            ))}
          </select>
        </div>

        {/* Item 14: Dynamic dosha + remedy based on current heading */}
        {(() => {
          const remedies: Record<string, { bad: string[]; remedy: string; remedyHi: string }> = {
            entrance: { bad: ['S', 'SW', 'SE'], remedy: 'Place a brass Ganesha or a pair of yellow marigold garlands at the entrance.', remedyHi: 'प्रवेश द्वार पर पीतल का गणेश या पीले गेंदे के फूल रखें।' },
            master_bedroom: { bad: ['NE', 'SE'], remedy: 'Place a copper pyramid or a pair of red candles in the NE corner of the bedroom.', remedyHi: 'बेडरूम के ईशान कोने में तांबे का पिरामिड या लाल दीपक रखें।' },
            kitchen: { bad: ['NE', 'SW', 'N'], remedy: 'Keep the stove facing East and place a copper plate under it.', remedyHi: 'चूल्हा पूर्व की ओर रखें और उसके नीचे तांबे की प्लेट रखें।' },
            pooja: { bad: ['S', 'SW', 'NW'], remedy: 'Place a brass lamp (diya) in the NE corner and keep the mandir facing East.', remedyHi: 'ईशान कोने में पीतल का दीया रखें और मंदिर पूर्व की ओर रखें।' },
            study: { bad: [], remedy: '', remedyHi: '' },
            bathroom: { bad: ['NE', 'SW'], remedy: 'Keep a bowl of sea salt in the bathroom and replace it weekly.', remedyHi: 'बाथरूम में समुद्री नमक का कटोरा रखें और साप्ताहिक बदलें।' },
            staircase: { bad: ['NE', 'N'], remedy: 'Keep the staircase area well-lit and place a mirror on the wall.', remedyHi: 'सीढ़ियों का क्षेत्र रोशन रखें और दीवार पर दर्पण लगाएं।' },
            water_overhead: { bad: ['NE', 'SE'], remedy: 'Place a copper wire around the tank to neutralize negative energy.', remedyHi: 'टंकी के चारों ओर तांबे का तार लगाएं।' },
            water_underground: { bad: ['SW', 'S'], remedy: 'Keep the well area clean and place a tulsi plant nearby.', remedyHi: 'बोरवेल क्षेत्र साफ रखें और पास में तुलसी का पौधा लगाएं।' },
            guest: { bad: ['SW'], remedy: 'Place a mirror on the SW wall to deflect negative energy.', remedyHi: 'नैऋत्य दीवार पर दर्पण लगाएं।' },
            cash: { bad: ['S'], remedy: 'Face the locker towards North and place a silver coin inside.', remedyHi: 'तिजोरी उत्तर की ओर रखें और अंदर चांदी का सिक्का रखें।' },
            business: { bad: ['S'], remedy: 'Place a crystal or a small water fountain in the NE corner.', remedyHi: 'ईशान कोने में क्रिस्टल या छोटा फव्वारा रखें।' },
            naukari: { bad: ['S', 'SW'], remedy: 'Place a wooden desk facing the north and keep a small Ganesha on it.', remedyHi: 'डेस्क उत्तर की ओर रखें और उस पर छोटा गणेश रखें।' },
          };
          const r = remedies[selectedRoom];
          if (!r || r.bad.length === 0) return null;
          const isBad = r.bad.includes(currentDir);
          if (!isBad) return null;
          return (
            <div className={cn(
              "mt-3 p-3 rounded-xl border flex items-start gap-2.5 transition-colors duration-300",
              theme === 'light' ? "bg-red-50 border-red-300/50" : "bg-red-500/10 border-red-500/25"
            )}>
              <span className="text-lg leading-none">🛠️</span>
              <div>
                <p className={cn("text-[10px] font-black uppercase tracking-wider", theme === 'light' ? "text-red-700" : "text-red-400")}>
                  {language === 'hi' ? 'वास्तु दोष उपाय' : 'Vastu Dosha Remedy'}
                </p>
                <p className={cn("text-[11px] leading-relaxed font-medium mt-0.5", theme === 'light' ? "text-red-900" : "text-red-200")}>
                  {language === 'hi' ? r.remedyHi : r.remedy}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Item 13: Saved rooms */}
        <div className={cn("mt-3 pt-3 border-t", theme === 'light' ? "border-stone-200" : "border-white/5")}>
          <div className="flex items-center justify-between mb-2">
            <h5 className={cn("text-[10px] uppercase font-black tracking-wider", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
              {language === 'hi' ? 'सहेजे गए कक्ष' : 'Saved Rooms'}
            </h5>
            <button
              onClick={() => { onHaptic(ImpactStyle.Medium); onSaveRoom(selectedRoom); }}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all active:scale-95",
                theme === 'light' ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-amber-500/15 text-amber-400 border-amber-500/30"
              )}
            >
              <Save className="w-3 h-3" />
              {language === 'hi' ? 'सहेजें' : 'Save'}
            </button>
          </div>
          {savedRooms.length === 0 ? (
            <p className={cn("text-[10px] font-medium", theme === 'light' ? "text-stone-500" : "text-stone-500")}>
              {language === 'hi' ? 'अभी कोई कक्ष सहेजा नहीं गया।' : 'No saved rooms yet.'}
            </p>
          ) : (
            <div className="space-y-1.5">
              {savedRooms.map((r) => (
                <div key={r.id} className={cn(
                  "flex items-center justify-between gap-2 p-2 rounded-lg border transition-colors",
                  theme === 'light' ? "bg-white border-stone-200" : "bg-stone-900/60 border-stone-800"
                )}>
                  <button
                    onClick={() => { onHaptic(); onLoadRoom(r.id); }}
                    className="flex-1 text-left text-[11px] font-bold truncate"
                  >
                    {r.room} · {r.door}°
                  </button>
                  <button
                    onClick={() => { onHaptic(); onDeleteRoom(r.id); }}
                    className="text-stone-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 32 Padas Gate Checker */}
        <div className={cn("mt-4 pt-3 border-t space-y-2", theme === 'light' ? "border-stone-200" : "border-white/5")}>
          <label className={cn("text-[10px] uppercase font-black tracking-wider block mb-1", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
            {language === 'hi' ? 'मुख्य द्वार की दिशा (डिग्री):' : 'Main Door Direction (Degrees):'}
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="0"
              max="359"
              placeholder="e.g. 90"
              value={doorDegree}
              onChange={(e) => { setDoorDegree(Math.min(359, Math.max(0, parseInt(e.target.value) || 0))); onHaptic(ImpactStyle.Medium); }}
              className={cn(
                "w-24 text-sm font-extrabold px-3 py-2 rounded-xl outline-none border shadow-inner",
                theme === 'light'
                  ? "bg-white border-amber-500/30 text-amber-900 focus:border-amber-500"
                  : "bg-stone-950 border-amber-500/30 text-amber-100 focus:border-amber-400"
              )}
            />
            <span className={cn("text-xs font-bold", theme === 'light' ? "text-stone-600" : "text-stone-400")}>°</span>
          </div>

          {(() => {
            // Calculate Pada data
            const d = (doorDegree % 360 + 360) % 360;
            const index = Math.floor(((d + 5.625) % 360) / 11.25);

            const padas = [
              { id: 'N1', name: language === 'hi' ? 'शिखी (N1)' : 'Sikhi (N1)', quality: 'bad', effect: language === 'hi' ? 'दुर्घटना, आग का खतरा, वित्तीय हानि' : 'Accident hazard, losses' },
              { id: 'N2', name: language === 'hi' ? 'पर्जन्य (N2)' : 'Parjanya (N2)', quality: 'neutral', effect: language === 'hi' ? 'कन्या संतान वृद्धि, अधिक व्यय' : 'Female progeny increase, higher expenses' },
              { id: 'N3', name: language === 'hi' ? 'जयंत (N3)' : 'Jayant (N3)', quality: 'good', effect: language === 'hi' ? 'अत्यधिक धन लाभ, विजय, सफलता' : 'Huge financial gains, success, intelligence' },
              { id: 'N4', name: language === 'hi' ? 'महेन्द्र (N4)' : 'Mahendra (N4)', quality: 'good', effect: language === 'hi' ? 'उच्च सरकारी संबंध, अधिकार, प्रसिद्धि' : 'Government connection, authority, fame' },
              { id: 'N5', name: language === 'hi' ? 'सूर्य (N5)' : 'Surya (N5)', quality: 'neutral', effect: language === 'hi' ? 'क्रोध की अधिकता, कर्मठ जीवन' : 'Anger, active work life' },
              { id: 'N6', name: language === 'hi' ? 'सत्य (N6)' : 'Satya (N6)', quality: 'bad', effect: language === 'hi' ? 'झूठ बोलना, विश्वसनीयता में कमी' : 'Commitment issues, mistrust' },
              { id: 'N7', name: language === 'hi' ? 'भृश (N7)' : 'Bhrisha (N7)', quality: 'bad', effect: language === 'hi' ? 'क्रोध, कठोर स्वभाव' : 'Anger issues, harsh behavior' },
              { id: 'N8', name: language === 'hi' ? 'आकाश (N8)' : 'Akasha (N8)', quality: 'bad', effect: language === 'hi' ? 'चोरी, भारी वित्तीय नुकसान' : 'Theft, financial stress' },
              { id: 'E1', name: language === 'hi' ? 'अनिल (E1)' : 'Anila (E1)', quality: 'bad', effect: language === 'hi' ? 'व्यापार में घाटा, चोरी का भय' : 'Business losses, theft risk' },
              { id: 'E2', name: language === 'hi' ? 'पूषा (E2)' : 'Pusha (E2)', quality: 'bad', effect: language === 'hi' ? 'दूसरों की गुलामी, प्रगति में बाधा' : 'Servitude, progress blocks' },
              { id: 'E3', name: language === 'hi' ? 'वितथ (E3)' : 'Vitatha (E3)', quality: 'bad', effect: language === 'hi' ? 'अपमान, बदनामी, असफलता' : 'Dishonor, false allegations' },
              { id: 'E4', name: language === 'hi' ? 'गृहक्षत (E4)' : 'Grihakshata (E4)', quality: 'good', effect: language === 'hi' ? 'संतान सुख, अपार समृद्धि और धन' : 'Progeny growth, extreme wealth' },
              { id: 'E5', name: language === 'hi' ? 'यम (E5)' : 'Yama (E5)', quality: 'bad', effect: language === 'hi' ? 'कर्ज, कानूनी मुकदमे' : 'Heavy debt, legal suits' },
              { id: 'E6', name: language === 'hi' ? 'गंधर्व (E6)' : 'Gandharva (E6)', quality: 'neutral', effect: language === 'hi' ? 'कला और संगीत में रुचि, सामान्य लाभ' : 'Artistic inclinations, minor gains' },
              { id: 'E7', name: language === 'hi' ? 'भृंगराज (E7)' : 'Bhringaraja (E7)', quality: 'bad', effect: language === 'hi' ? 'गंभीर रोग, ऊर्जा की कमी' : 'Chronic health problems, low energy' },
              { id: 'E8', name: language === 'hi' ? 'मृग (E8)' : 'Mriga (E8)', quality: 'bad', effect: language === 'hi' ? 'धन की हानि, एकाकी जीवन' : 'Financial drain, isolation' },
              { id: 'S1', name: language === 'hi' ? 'पितृ (S1)' : 'Pritivi (S1)', quality: 'bad', effect: language === 'hi' ? 'संतान की प्रगति में बाधा, संघर्ष' : 'Obstacles for children' },
              { id: 'S2', name: language === 'hi' ? 'दौवारिक (S2)' : 'Dauvarika (S2)', quality: 'neutral', effect: language === 'hi' ? 'अत्यधिक मेहनत के बाद ही सामान्य सफलता' : 'Hard work, delayed success' },
              { id: 'S3', name: language === 'hi' ? 'सुग्रीव (S3)' : 'Sugriva (S3)', quality: 'good', effect: language === 'hi' ? 'ज्ञान में वृद्धि, धन संचय' : 'Knowledge growth, savings accumulation' },
              { id: 'S4', name: language === 'hi' ? 'पुष्पदंत (S4)' : 'Pushpadanta (S4)', quality: 'good', effect: language === 'hi' ? 'घर में निरंतर सुख-समृद्धि, लक्ष्मी वास' : 'Prosperity, constant flow of money' },
              { id: 'S5', name: language === 'hi' ? 'वरुण (S5)' : 'Varuna (S5)', quality: 'neutral', effect: language === 'hi' ? 'मिश्रित परिणाम, खर्चे अधिक' : 'Mixed results, high expenses' },
              { id: 'S6', name: language === 'hi' ? 'असुर (S6)' : 'Asura (S6)', quality: 'bad', effect: language === 'hi' ? 'मानसिक तनाव, डिप्रेशन, कलह' : 'Mental stress, depression' },
              { id: 'S7', name: language === 'hi' ? 'शोष (S7)' : 'Sosha (S7)', quality: 'bad', effect: language === 'hi' ? 'आर्थिक तंगी, असफलता' : 'Financial blocks, failure' },
              { id: 'S8', name: language === 'hi' ? 'रोग (S8)' : 'Papyakshma (S8)', quality: 'bad', effect: language === 'hi' ? 'गंभीर रोग, मानसिक अशांति' : 'Illnesses, severe health decay' },
              { id: 'W1', name: language === 'hi' ? 'रोग (W1)' : 'Roga (W1)', quality: 'bad', effect: language === 'hi' ? 'शत्रु भय, दुर्घटना का डर' : 'Fears, accidents' },
              { id: 'W2', name: language === 'hi' ? 'नाग (W2)' : 'Naga (W2)', quality: 'bad', effect: language === 'hi' ? 'कानूनी विवाद, कोर्ट-कचहरी' : 'Legal issues, court cases' },
              { id: 'W3', name: language === 'hi' ? 'मुख्य (W3)' : 'Mukhya (W3)', quality: 'good', effect: language === 'hi' ? 'अकस्मात धन लाभ, व्यापारिक तरक्की' : 'Sudden wealth, rapid business growth' },
              { id: 'W4', name: language === 'hi' ? 'भल्लाट (W4)' : 'Bhallata (W4)', quality: 'good', effect: language === 'hi' ? 'विरासत में धन मिलना, बैंक बैलेंस में वृद्धि' : 'Inherited wealth, massive bank balance' },
              { id: 'W5', name: language === 'hi' ? 'सोम (W5)' : 'Soma (W5)', quality: 'good', effect: language === 'hi' ? 'मानसिक शांति, घर में लक्ष्मी का स्थायी वास' : 'Inner peace, stable business' },
              { id: 'W6', name: language === 'hi' ? 'भुजंग (W6)' : 'Bhujanga (W6)', quality: 'bad', effect: language === 'hi' ? 'रिश्तेदारों से कलह, विश्वासघात' : 'Betrayal, relative arguments' },
              { id: 'W7', name: language === 'hi' ? 'अदिति (W7)' : 'Aditi (W7)', quality: 'neutral', effect: language === 'hi' ? 'पारिवारिक स्थिरता, सामान्य लाभ' : 'Stability, slow gains' },
              { id: 'W8', name: language === 'hi' ? 'दिति (W8)' : 'Diti (W8)', quality: 'good', effect: language === 'hi' ? 'ऊंचे विचार, आध्यात्मिक उन्नति' : 'Higher vision, spiritual growth' }
            ];

            const currentPada = padas[index % 32];

            return (
              <div className={cn(
                "p-3 rounded-xl border flex flex-col gap-1 text-[11px] transition-colors duration-300",
                currentPada.quality === 'good' ? (theme === 'light' ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-emerald-500/10 border-emerald-500/25 text-emerald-400") :
                currentPada.quality === 'bad' ? (theme === 'light' ? "bg-red-50 border-red-300 text-red-700" : "bg-red-500/10 border-red-500/25 text-red-400") :
                (theme === 'light' ? "bg-white border-stone-300 text-stone-700" : "bg-stone-900 border-white/5 text-stone-300")
              )}>
                <div className="flex justify-between items-center font-extrabold">
                  <span>{language === 'hi' ? 'द्वार पद (Pada):' : 'Gate Pada:'} {currentPada.name}</span>
                  <span className="uppercase text-[9px] px-1.5 py-0.5 rounded font-black">
                    {currentPada.quality === 'good' ? (language === 'hi' ? 'अति शुभ' : 'Auspicious') :
                     currentPada.quality === 'bad' ? (language === 'hi' ? 'अशुभ' : 'Inauspicious') :
                     (language === 'hi' ? 'सामान्य' : 'Neutral')}
                  </span>
                </div>
                <p className="mt-1 font-medium">{language === 'hi' ? 'प्रभाव/फल:' : 'Effect:'} {currentPada.effect}</p>
              </div>
            );
          })()}
        </div>

        <div className={cn(
          "p-3.5 rounded-xl border shadow-inner transition-colors duration-300 space-y-3",
          theme === 'light' ? "bg-white border-amber-500/20" : "bg-stone-950/80 border-stone-900"
        )}>
          <div>
            <h5 className={cn("text-[10px] uppercase font-black tracking-wider mb-1", theme === 'light' ? "text-stone-600" : "text-stone-500")}>{language === 'hi' ? 'वास्तु सुझाव' : 'Vastu Tips'}</h5>
            <p className={cn("text-[11px] leading-relaxed font-medium transition-colors", theme === 'light' ? "text-amber-900" : "text-stone-300")}>
              {language === 'hi'
                ? 'कम्पास डायल पर उत्तम (BEST) दिशाओं को देखें। कम्पास को घुमाएं जब तक वह अनुकूल दिशा पर न आ जाए।'
                : 'Look for the favorable BEST directions highlighted on the compass dial for optimal room placement.'}
            </p>
          </div>

          <div className={cn("pt-2 border-t", theme === 'light' ? "border-stone-200" : "border-white/5")}>
            <h5 className={cn("text-[10px] uppercase font-black tracking-wider mb-1", theme === 'light' ? "text-amber-700" : "text-amber-400")}>{language === 'hi' ? 'ब्रह्मस्थान (घर का केंद्र)' : 'Brahmasthan (Center Point)'}</h5>
            <p className={cn("text-[11px] leading-relaxed font-medium transition-colors", theme === 'light' ? "text-amber-900" : "text-stone-300")}>
              {language === 'hi'
                ? 'घर के ठीक केंद्र को ब्रह्मस्थान कहते हैं। इसे हमेशा साफ, खुला, हल्का और स्तंभों या भारी फर्नीचर से मुक्त रखें।'
                : 'The exact center of your home is the Brahmasthan. Keep it clean, empty, light, and free from heavy pillars, walls, toilets, or kitchens.'}
            </p>
          </div>

          <div className={cn("pt-2 border-t space-y-2", theme === 'light' ? "border-stone-200" : "border-white/5")}>
            <h5 className={cn("text-[10px] uppercase font-black tracking-wider", theme === 'light' ? "text-amber-700" : "text-amber-500")}>{language === 'hi' ? 'सरल वास्तु दोष उपाय' : 'Easy Vastu Remedies'}</h5>
            <div className={cn("space-y-1.5 text-[10px] leading-normal", theme === 'light' ? "text-stone-600" : "text-stone-300")}>
              <div className="flex flex-col gap-0.5">
                <span className={cn("font-extrabold", theme === 'light' ? "text-amber-700" : "text-amber-400")}>{language === 'hi' ? '🚽 उत्तर-पूर्व में शौचालय:' : '🚽 Toilet in North-East:'}</span>
                <span>{language === 'hi' ? 'शौचालय में समुद्री नमक का कटोरा रखें (साप्ताहिक बदलें) और बाहर तांबे का पिरामिड लगाएं।' : 'Keep sea salt bowl inside, place brass pyramid outside.'}</span>
              </div>
              <div className={cn("flex flex-col gap-0.5 pt-1.5 border-t", theme === 'light' ? "border-stone-200" : "border-white/5")}>
                <span className={cn("font-extrabold", theme === 'light' ? "text-amber-700" : "text-amber-400")}>{language === 'hi' ? '🍳 दक्षिण-पश्चिम में रसोई:' : '🍳 Kitchen in South-West:'}</span>
                <span>{language === 'hi' ? 'गैस चूल्हे के चारों ओर पीला टेप लगाएं या चूल्हे के नीचे तांबे की प्लेट रखें।' : 'Apply yellow tape around stove base or place a copper plate underneath.'}</span>
              </div>
              <div className={cn("flex flex-col gap-0.5 pt-1.5 border-t", theme === 'light' ? "border-stone-200" : "border-white/5")}>
                <span className={cn("font-extrabold", theme === 'light' ? "text-amber-700" : "text-amber-400")}>{language === 'hi' ? '🚪 दक्षिण-पश्चिम में मुख्य द्वार:' : '🚪 Main Door in South-West:'}</span>
                <span>{language === 'hi' ? 'दरवाजे को पीले रंग से पेंट करें या प्रवेश द्वार पर हनुमान जी की तस्वीर लगाएं।' : 'Paint the door golden-yellow or place lead metal helix.'}</span>
              </div>
            </div>
          </div>

          {/* Interactive 9-Grid Vastu House Floorplan Mapper */}
          <div className={cn("pt-3 border-t", theme === 'light' ? "border-stone-200" : "border-white/10")}>
            <div className="flex items-center justify-between mb-2">
              <h5 className={cn("text-[11px] uppercase font-black tracking-wider flex items-center gap-1.5", theme === 'light' ? "text-amber-800" : "text-amber-300")}>
                <Grid className="w-3.5 h-3.5 text-amber-400" />
                {language === 'hi' ? '9-ग्रिड संपूर्ण घर वास्तु विश्लेषक' : 'Interactive 9-Grid Floorplan Mapper'}
              </h5>
              <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border", vastuScore !== null ? (theme === 'light' ? "bg-emerald-100 text-emerald-800 border-emerald-400" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40") : (theme === 'light' ? "bg-stone-100 text-stone-500 border-stone-300" : "bg-white/5 text-stone-500 border-white/10"))}>
                {vastuScore !== null ? `${language === 'hi' ? 'वास्तु स्कोर: ' : 'Vastu Score: '}${vastuScore}%` : '—'}
              </span>
            </div>

            <div className={cn(
              "grid grid-cols-3 gap-1.5 p-2 rounded-xl border text-center",
              theme === 'light' ? "bg-stone-100 border-stone-300" : "bg-black/40 border-white/10"
            )}>
              {[
                { key: 'NW', label: 'वायव्य (NW)' },
                { key: 'N', label: 'उत्तर (N)' },
                { key: 'NE', label: 'ईशान (NE)' },
                { key: 'W', label: 'पश्चिम (W)' },
                { key: 'CENTER', label: 'ब्रह्मस्थान' },
                { key: 'E', label: 'पूर्व (E)' },
                { key: 'SW', label: 'नैऋत्य (SW)' },
                { key: 'S', label: 'दक्षिण (S)' },
                { key: 'SE', label: 'आग्नेय (SE)' }
              ].map(sec => (
                <div key={sec.key} className={cn(
                  "p-1.5 rounded-lg border flex flex-col justify-between",
                  theme === 'light' ? "border-stone-300 bg-white" : "border-white/10 bg-stone-900/60"
                )}>
                  <span className={cn("text-[7.5px] font-black uppercase", theme === 'light' ? "text-stone-500" : "text-stone-400")}>{sec.label}</span>
                  <select
                    value={house9Grid[sec.key] || 'open'}
                    onChange={(e) => setHouse9Grid(prev => ({ ...prev, [sec.key]: e.target.value }))}
                    className={cn(
                      "mt-1 text-[8.5px] font-bold border rounded px-0.5 py-0.5 outline-none",
                      theme === 'light' ? "bg-white text-amber-800 border-stone-300" : "bg-black text-amber-200 border-white/10"
                    )}
                  >
                    <option value="open">Open Space</option>
                    <option value="pooja">Pooja Mandir</option>
                    <option value="kitchen">Kitchen / Rasoi</option>
                    <option value="master_bedroom">Master Bed</option>
                    <option value="entrance">Main Entrance</option>
                    <option value="bathroom">Bathroom / Toilet</option>
                    <option value="cash">Cash Locker</option>
                    <option value="study">Study Room</option>
                    <option value="staircase">Staircase</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};