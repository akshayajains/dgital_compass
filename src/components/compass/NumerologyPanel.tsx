import React, { memo, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { ImpactStyle } from '@capacitor/haptics';
import { generateAnnualForecast, AnnualForecast } from '@/lib/annualNumerology';
import { ChevronDown, ChevronUp, Calendar, TrendingUp, DollarSign, Heart, Brain, Sparkles, Gem as GemIcon, Palette as PaletteIcon } from 'lucide-react';
import { Language } from '@/types/compass';

interface NumerologyPanelProps {
  language: string;
  theme: string;
  numerologyDob: string;
  setNumerologyDob: (v: string) => void;
  mulank: number;
  numerologyNumber: number;
  loShuGrid: Record<number, number> | null;
  numerologyPhone: string;
  setNumerologyPhone: (v: string) => void;
  phoneTotal: number | null;
  numerologyHouse: string;
  setNumerologyHouse: (v: string) => void;
  houseTotal: number | null;
  numerologyVehicle: string;
  setNumerologyVehicle: (v: string) => void;
  vehicleTotal: number | null;
  onHaptic: (style?: ImpactStyle) => void;
}

export const NumerologyPanel = memo(({
  language, theme, numerologyDob, setNumerologyDob, mulank, numerologyNumber,
  loShuGrid, numerologyPhone, setNumerologyPhone, phoneTotal,
  numerologyHouse, setNumerologyHouse, houseTotal,
  numerologyVehicle, setNumerologyVehicle, vehicleTotal, onHaptic
}: NumerologyPanelProps) => {
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const [showForecast, setShowForecast] = useState(false);
  const lang = language as Language;

  const forecast = useMemo<AnnualForecast | null>(() => {
    if (!numerologyDob) return null;
    try {
      return generateAnnualForecast(numerologyDob, new Date().getFullYear(), lang);
    } catch {
      return null;
    }
  }, [numerologyDob, lang]);
  return (
    <div className="space-y-4">
      <div className={cn(
        "rounded-2xl p-4 border transition-all duration-300",
        theme === 'light'
          ? "bg-cyan-50/50 border-cyan-500/25 shadow-sm text-cyan-900"
          : "bg-[#121a24] border border-cyan-500/20 shadow-inner"
      )}>
        <div className="flex justify-between items-start mb-3">
          <h4 className={cn("font-extrabold text-sm transition-colors", theme === 'light' ? "text-cyan-900" : "text-cyan-300")}>{language === 'hi' ? 'अंक शास्त्र (Numerology)' : 'Numerology Alignment'}</h4>
        </div>

        <div className="mb-4">
          <label className={cn("text-[12px] uppercase font-black tracking-wider block mb-1.5", theme === 'light' ? "text-stone-500" : "text-stone-300")}>
            {language === 'hi' ? 'अपनी जन्म तिथि दर्ज करें:' : 'Enter Your Date of Birth:'}
          </label>
          <input
            type="date"
            value={numerologyDob}
            onChange={(e) => { setNumerologyDob(e.target.value); onHaptic(ImpactStyle.Medium); }}
            className={cn(
              "w-full text-sm font-extrabold px-3 py-2.5 rounded-xl outline-none transition-all duration-300 border shadow-inner mb-3",
              theme === 'light'
                ? "bg-white border-cyan-500/30 text-cyan-900 focus:border-cyan-500"
                : "bg-stone-950 border-cyan-500/30 text-cyan-200 focus:border-cyan-400"
            )}
          />

          {!numerologyDob ? (
            <div className={cn(
              "p-3 rounded-xl border text-center my-2",
              theme === 'light' ? "bg-white/80 border-cyan-200 text-stone-500" : "bg-black/30 border-white/10 text-stone-300"
            )}>
              <p className="text-xs font-semibold">
                {language === 'hi'
                  ? '📅 अपना मूलांक, भाग्यांक, शुभ दिशाएं व लो-शू चक्र देखने के लिए जन्म तिथि चुनें।'
                  : '📅 Select your date of birth above to view your Mulank, Bhagyank, auspicious zones & Lo-Shu Grid.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {/* Driver / Conductor Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className={cn(
                  "p-3 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center text-center",
                  theme === 'light' ? "bg-cyan-50/50 border-cyan-500/20" : "bg-cyan-950/20 border-cyan-900/40"
                )}>
                  <span className="text-[11.5px] text-stone-500 font-bold uppercase tracking-wider">{language === 'hi' ? 'ड्राइवर (मूलांक)' : 'Driver (Mulank)'}</span>
                  <span className={cn("text-2xl font-black mt-1", theme === 'light' ? "text-cyan-700" : "text-cyan-400")}>{mulank}</span>
                </div>
                <div className={cn(
                  "p-3 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center text-center",
                  theme === 'light' ? "bg-cyan-50/50 border-cyan-500/20" : "bg-cyan-900/40 border-cyan-900/40"
                )}>
                  <span className="text-[11.5px] text-stone-500 font-bold uppercase tracking-wider">{language === 'hi' ? 'कंडक्टर (भाग्यांक)' : 'Conductor (Bhagyank)'}</span>
                  <span className={cn("text-2xl font-black mt-1", theme === 'light' ? "text-cyan-700" : "text-cyan-400")}>{numerologyNumber}</span>
                </div>
              </div>

              {/* Lo Shu Grid */}
              {loShuGrid && (
                <div className={cn(
                  "p-3 rounded-2xl border transition-all duration-300 space-y-2",
                  theme === 'light' ? "bg-white border-cyan-500/20" : "bg-stone-950/80 border-stone-900"
                )}>
                  <h5 className={cn("text-[12px] uppercase font-black tracking-wider text-center", theme === 'light' ? "text-cyan-700" : "text-cyan-400")}>
                    {language === 'hi' ? 'लो शू ग्रिड (Lo Shu Grid)' : 'Lo Shu Grid Magic Square'}
                  </h5>
                  <div className="grid grid-cols-3 gap-1.5 max-w-[12rem] mx-auto">
                    {[
                      [4, 9, 2],
                      [3, 5, 7],
                      [8, 1, 6]
                    ].map((row, rIdx) =>
                      row.map((cellNum) => {
                        const frequency = loShuGrid[cellNum] || 0;
                        return (
                          <div
                            key={cellNum}
                            className={cn(
                              "h-10 rounded-lg flex flex-col items-center justify-center border transition-all duration-300 relative shadow-sm",
                              frequency > 0
                                ? cn("border-cyan-500/40", theme === 'light' ? "bg-cyan-500/10 text-cyan-800" : "bg-cyan-500/10 text-cyan-200")
                                : "bg-stone-900/40 border-stone-800 text-stone-500 opacity-40"
                            )}
                          >
                            <span className="text-sm font-black">{cellNum}</span>
                            {frequency > 0 && (
                              <span className="absolute bottom-0.5 right-1 text-[11px] font-black bg-cyan-500/35 text-white px-0.5 rounded leading-none">
                                x{frequency}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed text-center text-stone-500 font-bold max-w-[15rem] mx-auto mt-1">
                    {language === 'hi'
                      ? 'हाइलाइट किए गए अंक आपके चार्ट में उपस्थित ऊर्जा को दर्शाते हैं।'
                      : 'Highlighted numbers are present in your chart. Dimmed numbers represent missing energies.'}
                  </p>
                </div>
              )}

              {/* Detailed Vedic Numerology Report Card */}
              <div className={cn(
                "p-4 rounded-2xl border flex flex-col gap-2.5 transition-colors duration-300 text-xs",
                theme === 'light' ? "bg-white border-cyan-500/20" : "bg-stone-950/80 border-stone-800"
              )}>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-stone-500 font-bold">{language === 'hi' ? 'स्वामी ग्रह:' : 'Ruling Planet:'}</span>
                  <span className={cn("font-extrabold", theme === 'light' ? "text-cyan-700" : "text-cyan-300")}>
                    {
                      ['Sun (Surya)', 'Moon (Chandra)', 'Jupiter (Guru)', 'Rahu', 'Mercury (Budh)', 'Venus (Shukra)', 'Ketu', 'Saturn (Shani)', 'Mars (Mangal)'][numerologyNumber - 1]
                    }
                  </span>
                </div>

                <div className="flex flex-col gap-0.5 border-b border-white/5 pb-2">
                  <span className="text-stone-500 font-bold mb-0.5">{language === 'hi' ? 'मूलांक व्यक्तित्व लक्षण:' : 'Key Personality Traits:'}</span>
                  <span className="font-semibold text-[11px] leading-relaxed text-stone-300">
                    {
                      [
                        language === 'hi' ? 'नेतृत्व क्षमता, अधिकार, ऊर्जा, स्वतंत्रता, रचनात्मकता' : 'Leadership, Authority, Vitality, Independence, Creativity',
                        language === 'hi' ? 'संवेदनशीलता, रचनात्मकता, सहयोग, कूटनीति, सहानुभूति' : 'Creativity, Emotion, Cooperation, Diplomacy, Empathy',
                        language === 'hi' ? 'बुद्धि, ज्ञान, अनुशासन, विस्तार, उदारता, आशावाद' : 'Wisdom, Expansion, Discipline, Generosity, Optimism',
                        language === 'hi' ? 'नवाचार, लीक से हटकर सोच, व्यावहारिक, कड़ी मेहनत, तीव्रता' : 'Innovation, Out-of-the-box thinking, Practical, Hard Work, Intensity',
                        language === 'hi' ? 'तेज दिमाग, संचार कौशल, अनुकूलनशीलता, व्यापार बुद्धिमत्ता' : 'Communication, Adaptability, Fast Intelligence, Trade Skill',
                        language === 'hi' ? 'आकर्षण, सौंदर्य, सद्भाव, कलात्मक रुचि, प्रेम, विलासिता' : 'Art, Beauty, Harmony, Luxury, Love, Domestic Responsibility',
                        language === 'hi' ? 'अंतर्ज्ञान, आध्यात्मिकता, विश्लेषणात्मक मन, अनुसंधान, रहस्यवाद' : 'Intuition, Spirituality, Research, Analytical Mind, Mystery',
                        language === 'hi' ? 'धन संचय, न्यायप्रिय, संगठन कौशल, कर्म फल, धैर्य' : 'Wealth, Karma, Executive Power, Patience, Judgment',
                        language === 'hi' ? 'साहस, दृढ़ संकल्प, त्वरित कार्यवाही, उग्र स्वभाव, मानवता' : 'Courage, Action, Vitality, Determination, Humanitarian Spirit'
                      ][mulank - 1]
                    }
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[12px] border-b border-white/5 pb-2">
                  <div>
                    <span className="text-stone-500 font-bold block">{language === 'hi' ? 'शुभ रंग:' : 'Lucky Colors:'}</span>
                    <span className="font-extrabold text-amber-500">
                      {
                        language === 'hi'
                          ? ['सोना, नारंगी, पीला', 'सफेद, चांदी, क्रीम', 'पीला, सोना, केसरिया', 'नीला, ग्रे, इलेक्ट्रिक ब्लू', 'हरा, पन्ना हरा', 'गुलाबी, सफेद, चांदी', 'पेस्टल शेड्स, हल्का हरा', 'नीला, काला, गहरा नीला', 'लाल, गुलाबी, मूंगा'][mulank - 1]
                          : ['Gold, Orange, Yellow', 'White, Silver, Cream', 'Yellow, Gold, Saffron', 'Blue, Grey, Electric Blue', 'Green, Emerald Green', 'Pink, White, Silver', 'Pastel Shades, Light Green', 'Blue, Black, Dark Blue', 'Red, Pink, Coral'][mulank - 1]
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 font-bold block">{language === 'hi' ? 'शुभ रत्न:' : 'Lucky Gemstone:'}</span>
                    <span className="font-extrabold text-amber-500">
                      {
                        ['Ruby (माणिक)', 'Pearl (मोती)', 'Yellow Sapphire (पुखराज)', 'Hessonite (गोमेद)', 'Emerald (पन्ना)', 'Diamond (हीरा)', 'Cat\'s Eye (लहसुनिया)', 'Blue Sapphire (नीलम)', 'Red Coral (मूंगा)'][mulank - 1]
                      }
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[12px] border-b border-white/5 pb-2">
                  <div>
                    <span className="text-stone-500 font-bold block">{language === 'hi' ? 'मित्र अंक (Friendly):' : 'Friendly Numbers:'}</span>
                    <span className="font-extrabold text-emerald-400">
                      {
                        ['1, 2, 3, 5, 9', '1, 2, 5, 7', '1, 3, 5, 7, 9', '1, 4, 5, 6', '1, 3, 5, 6', '4, 5, 6, 8', '1, 3, 5, 7', '3, 5, 6, 8', '1, 3, 5, 9'][mulank - 1]
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 font-bold block">{language === 'hi' ? 'शत्रु अंक (Enemy):' : 'Enemy Numbers:'}</span>
                    <span className="font-extrabold text-rose-500">
                      {
                        ['8', '8, 9', '6', '8, 9', '2', '3', '8', '1, 2, 4, 7', '2, 4, 8'][mulank - 1]
                      }
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[12px] border-b border-white/5 pb-2">
                  <div>
                    <span className="text-stone-500 font-bold block">{language === 'hi' ? 'क्या खरीदें/पास रखें:' : 'What to Buy/Carry:'}</span>
                    <span className={cn("font-extrabold", theme === 'light' ? "text-cyan-700" : "text-cyan-300")}>
                      {
                        [
                          language === 'hi' ? 'तांबे की वस्तुएं, लाल धागा' : 'Copper items, Red thread',
                          language === 'hi' ? 'चांदी का सिक्का, मोती' : 'Silver coin, Pearl',
                          language === 'hi' ? 'सोना, केसर, पीली वस्तुएं' : 'Gold, Saffron, Yellow items',
                          language === 'hi' ? 'स्टील, नीले रंग की वस्तुएं' : 'Steel, Blue colored items',
                          language === 'hi' ? 'हरा पेन, पन्ना, कांसे की वस्तुएं' : 'Green pen, Emerald, Bronze',
                          language === 'hi' ? 'चांदी, इत्र, रेशमी वस्त्र' : 'Silver, Perfume, Silk clothes',
                          language === 'hi' ? 'लहसुनिया रत्न, बहु-रंगी वस्त्र' : 'Cat\'s eye gem, Multi-colored items',
                          language === 'hi' ? 'लोहे की अंगूठी, काली वस्तुएं' : 'Iron ring, Black items',
                          language === 'hi' ? 'तांबे का बर्तन, मूंगा' : 'Copper vessel, Red coral'
                        ][mulank - 1]
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 font-bold block">{language === 'hi' ? 'शुभ दिन:' : 'Lucky Days:'}</span>
                    <span className={cn("font-extrabold", theme === 'light' ? "text-cyan-700" : "text-cyan-300")}>
                      {
                        ['Sunday, Monday', 'Monday, Sunday', 'Thursday, Tuesday', 'Wednesday, Friday', 'Wednesday, Friday', 'Friday, Wednesday', 'Monday, Sunday', 'Saturday, Friday', 'Tuesday, Thursday'][mulank - 1]
                      }
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-0.5 text-[12px]">
                  <span className="text-stone-500 font-bold block">{language === 'hi' ? 'क्या करें (दैनिक उपाय):' : 'What You Should Do (Remedy):'}</span>
                  <span className="font-semibold text-stone-300 leading-relaxed text-[12px]">
                    {
                      [
                        language === 'hi' ? 'सूर्य को जल दें, पिता का आशीर्वाद लें, पूर्व की ओर काम करें।' : 'Offer water to the Sun, respect father, face East while working.',
                        language === 'hi' ? 'माता का सम्मान करें, चांदी के बर्तन में जल पीएं, उत्तर की ओर बैठें।' : 'Respect mother, drink water from silver glass, face North.',
                        language === 'hi' ? 'गुरुओं का आदर करें, माथे पर केसर का तिलक लगाएं, उत्तर-पूर्व मुख रखें।' : 'Respect teachers, apply saffron tilak, face North-East.',
                        language === 'hi' ? 'कुत्तों को रोटी दें, घर साफ रखें, दक्षिण-पश्चिम का उपयोग करें।' : 'Feed street dogs, keep home clean, align with South-West.',
                        language === 'hi' ? 'गाय को हरी घास खिलाएं, बहनों की मदद करें, उत्तर मुख बैठें।' : 'Feed green grass to cows, help sisters, face North.',
                        language === 'hi' ? 'इत्र लगाएं, स्त्रियों का सम्मान करें, दक्षिण-पूर्व की ओर तिजोरी रखें।' : 'Use perfume, respect women, place cash safe towards South-East.',
                        language === 'hi' ? 'पक्षियों को दाना डालें, योग-ध्यान करें, उत्तर-पूर्व का उपयोग करें।' : 'Feed birds, practice meditation, align study desk to North-East.',
                        language === 'hi' ? 'मजदूरों की मदद करें, शनिवार को दीप जलाएं, पश्चिम मुख काम करें।' : 'Help the needy/laborers, light oil lamp on Saturday, face West.',
                        language === 'hi' ? 'भाई-बहनों की मदद करें, हनुमान चालीसा पढ़ें, दक्षिण मुख सोएं।' : 'Help siblings, read spiritual texts, keep head towards South when sleeping.'
                      ][mulank - 1]
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Phone & House Number Compatibility Section */}
          {numerologyDob && (
            <div className={cn(
              "p-4 rounded-2xl border transition-all duration-300 space-y-4 text-xs mt-3",
              theme === 'light' ? "bg-white border-cyan-500/20" : "bg-stone-950/80 border-stone-900"
            )}>
              <h4 className={cn("text-[12px] font-black uppercase tracking-wider", theme === 'light' ? "text-cyan-700" : "text-cyan-400")}>
                {language === 'hi' ? 'अंक अनुकूलता कैलकुलेटर' : 'Ank Compatibility Calculators'}
              </h4>

              {/* Phone Compatibility */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-stone-500 font-bold uppercase block">
                  {language === 'hi' ? 'मोबाईल नंबर चेक करें:' : 'Check Mobile Number:'}
                </label>
                <input
                  type="tel"
                  maxLength={15}
                  placeholder="e.g. 9876543210"
                  value={numerologyPhone}
                  onChange={(e) => { setNumerologyPhone(e.target.value.replace(/\D/g, '')); onHaptic(ImpactStyle.Medium); }}
                  className={cn(
                    "w-full text-xs font-extrabold px-3 py-2 rounded-xl outline-none border transition-all duration-300 shadow-inner",
                    theme === 'light' ? "bg-stone-50 border-cyan-500/20 focus:border-cyan-500" : "bg-stone-900 border-cyan-500/10 focus:border-cyan-500"
                  )}
                />
                {phoneTotal !== null && (() => {
                  const isFriendly = [
                    [1, 2, 3, 5, 9], // 1
                    [1, 2, 5, 7],    // 2
                    [1, 3, 5, 7, 9], // 3
                    [1, 4, 5, 6],    // 4
                    [1, 3, 5, 6],    // 5
                    [4, 5, 6, 8],    // 6
                    [1, 3, 5, 7],    // 7
                    [3, 5, 6, 8],    // 8
                    [1, 3, 5, 9]     // 9
                  ][mulank - 1]?.includes(phoneTotal);

                  return (
                    <div className="flex items-center justify-between mt-1 text-[12px]">
                      <span>{language === 'hi' ? `कुल योग: ${phoneTotal}` : `Sum Total: ${phoneTotal}`}</span>
                      <span className={cn("font-bold px-2 py-0.5 rounded-full text-[11px] uppercase border", isFriendly
                        ? (theme === 'light' ? "bg-teal-100 text-teal-800 border-teal-300" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40")
                        : (theme === 'light' ? "bg-red-100 text-red-800 border-red-300" : "bg-rose-500/20 text-rose-400 border-rose-500/40"))}>
                        {isFriendly
                          ? (language === 'hi' ? 'अति शुभ / मित्र' : 'Highly Auspicious')
                          : (language === 'hi' ? 'सामान्य / शत्रु' : 'Inimical / Neutral')}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* House Compatibility */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <label className="text-[11px] text-stone-500 font-bold uppercase block">
                  {language === 'hi' ? 'घर/फ्लैट नंबर चेक करें:' : 'Check House / Flat Number:'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. 402"
                  value={numerologyHouse}
                  onChange={(e) => { setNumerologyHouse(e.target.value); onHaptic(ImpactStyle.Medium); }}
                  className={cn(
                    "w-full text-xs font-extrabold px-3 py-2 rounded-xl outline-none border transition-all duration-300 shadow-inner",
                    theme === 'light' ? "bg-stone-50 border-cyan-500/20 focus:border-cyan-500" : "bg-stone-900 border-cyan-500/10 focus:border-cyan-500"
                  )}
                />
                {houseTotal !== null && (() => {
                  const isFriendly = [
                    [1, 2, 3, 5, 9], // 1
                    [1, 2, 5, 7],    // 2
                    [1, 3, 5, 7, 9], // 3
                    [1, 4, 5, 6],    // 4
                    [1, 3, 5, 6],    // 5
                    [4, 5, 6, 8],    // 6
                    [1, 3, 5, 7],    // 7
                    [3, 5, 6, 8],    // 8
                    [1, 3, 5, 9]     // 9
                  ][mulank - 1]?.includes(houseTotal);

                  return (
                    <div className="flex items-center justify-between mt-1 text-[12px]">
                      <span>{language === 'hi' ? `कुल योग: ${houseTotal}` : `Sum Total: ${houseTotal}`}</span>
                      <span className={cn("font-bold px-2 py-0.5 rounded-full text-[11px] uppercase border", isFriendly
                        ? (theme === 'light' ? "bg-teal-100 text-teal-800 border-teal-300" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40")
                        : (theme === 'light' ? "bg-red-100 text-red-800 border-red-300" : "bg-rose-500/20 text-rose-400 border-rose-500/40"))}>
                        {isFriendly
                          ? (language === 'hi' ? 'शुभ / अनुकूल' : 'Lucky Alignment')
                          : (language === 'hi' ? 'सामान्य / शत्रु' : 'Inimical / Neutral')}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Vehicle Compatibility */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <label className="text-[11px] text-stone-500 font-bold uppercase block">
                  {language === 'hi' ? 'वाहन/गाड़ी नंबर चेक करें (उदा. MH12GP4567):' : 'Check Car / Vehicle Number:'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. MH12GP4567"
                  value={numerologyVehicle}
                  onChange={(e) => { setNumerologyVehicle(e.target.value); onHaptic(ImpactStyle.Medium); }}
                  className={cn(
                    "w-full text-xs font-extrabold px-3 py-2 rounded-xl outline-none border transition-all duration-300 shadow-inner",
                    theme === 'light' ? "bg-stone-50 border-cyan-500/20 focus:border-cyan-500" : "bg-stone-900 border-cyan-500/10 focus:border-cyan-500"
                  )}
                />
                {vehicleTotal !== null && (() => {
                  const isFriendly = [
                    [1, 2, 3, 5, 9], // 1
                    [1, 2, 5, 7],    // 2
                    [1, 3, 5, 7, 9], // 3
                    [1, 4, 5, 6],    // 4
                    [1, 3, 5, 6],    // 5
                    [4, 5, 6, 8],    // 6
                    [1, 3, 5, 7],    // 7
                    [3, 5, 6, 8],    // 8
                    [1, 3, 5, 9]     // 9
                  ][mulank - 1]?.includes(vehicleTotal);

                  return (
                    <div className="flex items-center justify-between mt-1 text-[12px]">
                      <span>{language === 'hi' ? `कुल योग: ${vehicleTotal}` : `Sum Total: ${vehicleTotal}`}</span>
                      <span className={cn("font-bold px-2 py-0.5 rounded-full text-[11px] uppercase border", isFriendly
                        ? (theme === 'light' ? "bg-teal-100 text-teal-800 border-teal-300" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40")
                        : (theme === 'light' ? "bg-red-100 text-red-800 border-red-300" : "bg-rose-500/20 text-rose-400 border-rose-500/40"))}>
                        {isFriendly
                          ? (language === 'hi' ? 'शुभ / मित्र' : 'Lucky Alignment')
                          : (language === 'hi' ? 'सामान्य / शत्रु' : 'Inimical / Neutral')}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Annual Numerology Forecast */}
        {forecast && (
          <div className={cn(
            "rounded-2xl border overflow-hidden transition-all duration-300",
            theme === 'light'
              ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-500/25 shadow-sm"
              : "bg-gradient-to-br from-amber-950/20 to-orange-950/20 border border-amber-500/20 shadow-inner"
          )}>
            <button
              onClick={() => { setShowForecast(!showForecast); onHaptic(ImpactStyle.Medium); }}
              className={cn(
                "w-full flex items-center justify-between p-4 text-left transition-colors",
                theme === 'light' ? "hover:bg-amber-100/50" : "hover:bg-amber-900/20"
              )}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <div>
                  <h4 className={cn("font-extrabold text-sm", theme === 'light' ? "text-amber-900" : "text-amber-300")}>
                    {language === 'hi' ? `📅 वार्षिक अंक ज्योतिष ${new Date().getFullYear()}` : `📅 Annual Numerology ${new Date().getFullYear()}`}
                  </h4>
                  <p className={cn("text-[12px] font-bold", theme === 'light' ? "text-amber-700" : "text-amber-400")}>
                    {language === 'hi' ? `व्यक्तिगत वर्ष ${forecast.personalYear}: ${forecast.theme.hi}` : `Personal Year ${forecast.personalYear}: ${forecast.theme.en}`}
                  </p>
                </div>
              </div>
              {showForecast ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4 text-amber-500" />}
            </button>

            {showForecast && (
              <div className="px-4 pb-4 space-y-4">
                {/* Overview */}
                <div className={cn(
                  "p-3 rounded-xl border",
                  theme === 'light' ? "bg-white/80 border-amber-200" : "bg-stone-900/60 border-stone-800"
                )}>
                  <p className={cn("text-[11px] leading-relaxed", theme === 'light' ? "text-stone-500" : "text-stone-300")}>
                    {lang === 'hi' ? forecast.overview.hi : forecast.overview.en}
                  </p>
                </div>

                {/* Category Forecasts */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: <TrendingUp className="w-3.5 h-3.5 text-blue-400" />, label: { en: 'Career', hi: 'करियर' }, data: forecast.career },
                    { icon: <DollarSign className="w-3.5 h-3.5 text-emerald-400" />, label: { en: 'Finance', hi: 'वित्त' }, data: forecast.finance },
                    { icon: <Heart className="w-3.5 h-3.5 text-rose-400" />, label: { en: 'Health', hi: 'स्वास्थ्य' }, data: forecast.health },
                    { icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />, label: { en: 'Love', hi: 'प्रेम' }, data: forecast.relationships },
                    { icon: <Brain className="w-3.5 h-3.5 text-cyan-400" />, label: { en: 'Spiritual', hi: 'आध्यात्मिक' }, data: forecast.spirituality },
                  ].map((cat, i) => (
                    <div key={i} className={cn(
                      "p-2.5 rounded-xl border space-y-1",
                      theme === 'light' ? "bg-white/60 border-stone-200" : "bg-stone-900/40 border-stone-800"
                    )}>
                      <div className="flex items-center gap-1.5">
                        {cat.icon}
                        <span className={cn("text-[12px] font-bold uppercase", theme === 'light' ? "text-stone-500" : "text-stone-300")}>
                          {lang === 'hi' ? cat.label.hi : cat.label.en}
                        </span>
                      </div>
                      <p className={cn("text-[11px] leading-relaxed", theme === 'light' ? "text-stone-500" : "text-stone-300")}>
                        {lang === 'hi' ? cat.data.hi : cat.data.en}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Lucky Colors & Gemstones */}
                <div className="grid grid-cols-2 gap-2">
                  <div className={cn(
                    "p-2.5 rounded-xl border flex items-center gap-2",
                    theme === 'light' ? "bg-white/60 border-stone-200" : "bg-stone-900/40 border-stone-800"
                  )}>
                    <PaletteIcon className="w-3.5 h-3.5 text-amber-400" />
                    <div>
                      <span className={cn("text-[11px] font-bold uppercase block", theme === 'light' ? "text-stone-500" : "text-stone-300")}>
                        {language === 'hi' ? 'शुभ रंग' : 'Lucky Colors'}
                      </span>
                      <span className={cn("text-[12px] font-bold", theme === 'light' ? "text-amber-700" : "text-amber-400")}>
                        {forecast.luckyColors.join(', ')}
                      </span>
                    </div>
                  </div>
                  <div className={cn(
                    "p-2.5 rounded-xl border flex items-center gap-2",
                    theme === 'light' ? "bg-white/60 border-stone-200" : "bg-stone-900/40 border-stone-800"
                  )}>
                    <GemIcon className="w-3.5 h-3.5 text-purple-400" />
                    <div>
                      <span className={cn("text-[11px] font-bold uppercase block", theme === 'light' ? "text-stone-500" : "text-stone-300")}>
                        {language === 'hi' ? 'शुभ रत्न' : 'Lucky Gem'}
                      </span>
                      <span className={cn("text-[12px] font-bold", theme === 'light' ? "text-purple-700" : "text-purple-400")}>
                        {forecast.luckyGemstones.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remedies */}
                <div className={cn(
                  "p-3 rounded-xl border",
                  theme === 'light' ? "bg-amber-50 border-amber-200" : "bg-amber-950/20 border-amber-900/40"
                )}>
                  <h5 className={cn("text-[12px] font-bold uppercase mb-2", theme === 'light' ? "text-amber-800" : "text-amber-400")}>
                    {language === 'hi' ? '🙏 दैनिक उपाय' : '🙏 Daily Remedies'}
                  </h5>
                  <ul className="space-y-1.5">
                    {forecast.remedies.map((remedy, ri) => (
                      <li key={ri} className={cn("text-[12px] leading-relaxed flex gap-1.5", theme === 'light' ? "text-stone-500" : "text-stone-300")}>
                        <span className="text-amber-500 mt-0.5">•</span>
                        {lang === 'hi' ? remedy.hi : remedy.en}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Monthly Forecasts */}
                <div>
                  <h5 className={cn("text-[12px] font-bold uppercase mb-2", theme === 'light' ? "text-amber-800" : "text-amber-400")}>
                    {language === 'hi' ? '📆 मासिक भविष्य' : '📆 Monthly Forecast'}
                  </h5>
                  <div className="space-y-1.5">
                    {forecast.monthlyForecasts.map((month) => {
                      const isExpanded = expandedMonth === month.monthNumber;
                      return (
                        <div key={month.monthNumber} className={cn(
                          "rounded-lg border overflow-hidden",
                          theme === 'light' ? "bg-white/60 border-stone-200" : "bg-stone-900/40 border-stone-800"
                        )}>
                          <button
                            onClick={() => setExpandedMonth(isExpanded ? null : month.monthNumber)}
                            className={cn(
                              "w-full flex items-center justify-between p-2.5 text-left",
                              theme === 'light' ? "hover:bg-stone-50" : "hover:bg-stone-800/50"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className={cn("text-[11px] font-bold", theme === 'light' ? "text-stone-700" : "text-stone-300")}>
                                {lang === 'hi' ? month.monthHi : month.month}
                              </span>
                              <span className={cn(
                                "text-[12px] px-1.5 py-0.5 rounded-full font-bold",
                                theme === 'light' ? "bg-amber-100 text-amber-700" : "bg-amber-900/40 text-amber-400"
                              )}>
                                {language === 'hi' ? `वibration ${month.vibration}` : `Vibration ${month.vibration}`}
                              </span>
                            </div>
                            {isExpanded ? <ChevronUp className="w-3 h-3 text-stone-500" /> : <ChevronDown className="w-3 h-3 text-stone-500" />}
                          </button>
                          {isExpanded && (
                            <div className={cn("px-2.5 pb-2.5 space-y-1.5 border-t", theme === 'light' ? "border-stone-100" : "border-stone-800")}>
                              <p className={cn("text-[12px] leading-relaxed pt-1.5", theme === 'light' ? "text-stone-500" : "text-stone-300")}>
                                {lang === 'hi' ? month.advice.hi : month.advice.en}
                              </p>
                              <p className={cn("text-[11px] leading-relaxed", theme === 'light' ? "text-amber-600" : "text-amber-400")}>
                                ⚠️ {lang === 'hi' ? month.caution.hi : month.caution.en}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {month.luckyDays.map((day) => (
                                  <span key={day} className={cn(
                                    "text-[12px] px-1 py-0.5 rounded font-bold",
                                    theme === 'light' ? "bg-teal-100 text-teal-700" : "bg-emerald-900/40 text-emerald-400"
                                  )}>
                                    {day}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className={cn(
          "p-3 rounded-xl border shadow-inner transition-colors duration-300",
          theme === 'light' ? "bg-white border-cyan-500/20" : "bg-stone-950/80 border-stone-800"
        )}>
          <h5 className="text-[12px] text-stone-500 uppercase font-black tracking-wider mb-2">{language === 'hi' ? 'कम्पास का क्या महत्व है?' : 'Why use a Compass?'}</h5>
          <p className={cn("text-[11px] leading-relaxed font-medium transition-colors", theme === 'light' ? "text-cyan-900" : "text-stone-300")}>
            {language === 'hi'
              ? 'अंक वास्तु में, आपके मूलांक के अनुकूल शुभ दिशा (डायल पर हाइलाइटेड) की ओर मुख करके कार्य करने, अध्ययन करने या सोते समय सिर रखने से सकारात्मक ऊर्जा और सफलता आकर्षित होती है।'
              : 'In Ank Vastu, facing your ruling planet\'s auspicious direction (glowing sector on dial) while working, studying, or sleeping helps channel cosmic energy for success and mental clarity.'}
          </p>
        </div>
      </div>
    </div>
  );
});