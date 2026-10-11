import React, { useState } from 'react';
import { 
  Compass, 
  CircleDot, 
  Sparkles, 
  Camera, 
  Layers, 
  Sun, 
  Moon, 
  Hash, 
  Navigation, 
  Activity, 
  Wind, 
  Zap, 
  DoorOpen, 
  X, 
  Search,
  ExternalLink,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Language } from '@/types/compass';

export interface FeatureItem {
  id: string;
  category: 'compass' | 'vastu' | 'spiritual' | 'utility';
  titleEn: string;
  titleHi: string;
  descEn: string;
  descHi: string;
  icon: React.ReactNode;
  iconBg: string;
  tagEn: string;
  tagHi: string;
  action: () => void;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  theme: string;
  onSelectTab: (tab: 'compass' | 'level' | 'vastu') => void;
  onOpenARScanner: () => void;
  onOpenFloorPlan: () => void;
  onOpenWeather: () => void;
  onOpenSettings: () => void;
  onSelectVastuSubTab: (subTab: 'vastu' | 'jyotish' | 'numerology' | 'sadhana' | 'feng_shui' | 'qibla') => void;
  onToggleTorch: () => void;
  isTorchOn?: boolean;
}

export const FeatureExplorerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  language,
  theme,
  onSelectTab,
  onOpenARScanner,
  onOpenFloorPlan,
  onOpenWeather,
  onOpenSettings,
  onSelectVastuSubTab,
  onToggleTorch,
  isTorchOn = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'compass' | 'vastu' | 'spiritual' | 'utility'>('all');
  const isHi = language === 'hi';

  if (!isOpen) return null;

  const features: FeatureItem[] = [
    {
      id: 'compass',
      category: 'compass',
      titleEn: '360° Luxury Digital Compass',
      titleHi: '360° लग्जरी डिजिटल कंपास',
      descEn: 'Precision sensor heading, 6 luxury dials (Royal Gold, Sandalwood, Vedic), hold reading & GPS.',
      descHi: 'सटीक सेंसर हेडिंग, 6 प्रीमियम शैलियां (शाही गोल्ड, चंदन, वैदिक) एवं GPS ऊंचाई।',
      icon: <Compass className="w-5 h-5 text-amber-400" />,
      iconBg: 'bg-amber-500/20 border-amber-500/40',
      tagEn: 'Precision',
      tagHi: 'सटीक',
      action: () => {
        onSelectTab('compass');
        onClose();
      }
    },
    {
      id: 'spirit_level',
      category: 'utility',
      titleEn: 'Precision Spirit Level (2D & Tubular)',
      titleHi: 'सटीक स्पिरिट लेवल (समतल मापक)',
      descEn: 'Bullseye surface flatness bubble, dual tubular vials, pitch & roll with zero-tare calibration.',
      descHi: '2D वृत्ताकार सतह बबल, दोहरी ट्यूब वायल, दीवार एवं सतह का समतल कोण मापक।',
      icon: <CircleDot className="w-5 h-5 text-emerald-400" />,
      iconBg: 'bg-emerald-500/20 border-emerald-500/40',
      tagEn: 'Hardware Sensor',
      tagHi: 'सेंसर मापक',
      action: () => {
        onSelectTab('level');
        onClose();
      }
    },
    {
      id: 'vastu_16zones',
      category: 'vastu',
      titleEn: '16 MahaVastu Zones & Energy Map',
      titleHi: '16 महावास्तु क्षेत्र एवं ऊर्जा मानचित्र',
      descEn: 'Authentic 16-direction Vedic architecture guidelines for kitchen, bedroom, temple & cash.',
      descHi: 'रसोई, मंदिर, बेडरूम व तिजोरी हेतु 16 वैदिक वास्तु दिशाओं का प्रामाणिक मार्गदर्शन।',
      icon: <Sparkles className="w-5 h-5 text-orange-400" />,
      iconBg: 'bg-orange-500/20 border-orange-500/40',
      tagEn: 'Vedic Architecture',
      tagHi: 'वैदिक वास्तु',
      action: () => {
        onSelectTab('vastu');
        onSelectVastuSubTab('vastu');
        onClose();
      }
    },
    {
      id: 'mukhya_dwar',
      category: 'vastu',
      titleEn: '32 Devta Pada Main Door Verdict',
      titleHi: '32 देवता पद मुख्य द्वार निर्णय',
      descEn: 'Check if your main entrance falls in one of the 8 Supreme Auspicious Padas with remedies.',
      descHi: 'जांचें कि मुख्य प्रवेश द्वार 8 सर्वश्रेष्ठ शुभ पदों में है या नहीं, साथ ही प्रामाणिक उपाय।',
      icon: <DoorOpen className="w-5 h-5 text-amber-300" />,
      iconBg: 'bg-amber-500/20 border-amber-500/40',
      tagEn: 'Entrance Finder',
      tagHi: 'द्वार परीक्षक',
      action: () => {
        onSelectTab('vastu');
        onSelectVastuSubTab('vastu');
        onClose();
      }
    },
    {
      id: 'ar_camera_scanner',
      category: 'vastu',
      titleEn: 'Live AR Camera Vastu Scanner',
      titleHi: 'लाइव AR कैमरा वास्तु स्कैनर',
      descEn: 'Look through camera to audit rooms, doors & energy alignment with real-time HUD and snapshot.',
      descHi: 'कैमरे से लाइव कमरे व द्वार की वास्तु दिशा जांचें और ऑडिट फोटो सहेजें।',
      icon: <Camera className="w-5 h-5 text-cyan-400" />,
      iconBg: 'bg-cyan-500/20 border-cyan-500/40',
      tagEn: 'Augmented Reality',
      tagHi: 'AR कैमरा',
      action: () => {
        onOpenARScanner();
        onClose();
      }
    },
    {
      id: 'floor_plan',
      category: 'vastu',
      titleEn: 'Floor Plan 16-Zone Grid Overlay',
      titleHi: 'फ्लोर प्लान 16-क्षेत्र ग्रिड मैप',
      descEn: 'Overlay 16 MahaVastu energy zones directly on your house/office architectural blueprint.',
      descHi: 'अपने घर या ऑफिस के नक्शे पर 16 महावास्तु ऊर्जा क्षेत्रों का सुपरइम्पोजिशन।',
      icon: <Layers className="w-5 h-5 text-indigo-400" />,
      iconBg: 'bg-indigo-500/20 border-indigo-500/40',
      tagEn: 'Blueprint',
      tagHi: 'नक्शा ग्रिड',
      action: () => {
        onOpenFloorPlan();
        onClose();
      }
    },
    {
      id: 'jyotish_choghadiya',
      category: 'spiritual',
      titleEn: 'Jyotish & Choghadiya Muhurat',
      titleHi: 'ज्योतिष एवं चौघड़िया मुहूर्त',
      descEn: 'Real-time auspicious Muhurats (Shubh, Labh, Amrit) calculated from local GPS sunrise/sunset.',
      descHi: 'स्थानीय सूर्योदय/सूर्यास्त अनुसार शुभ, लाभ, अमृत मुहूर्त एवं 12 राशियों का दैनिक मार्गदर्शन।',
      icon: <Sun className="w-5 h-5 text-yellow-400" />,
      iconBg: 'bg-yellow-500/20 border-yellow-500/40',
      tagEn: 'Muhurat',
      tagHi: 'शुभ मुहूर्त',
      action: () => {
        onSelectTab('vastu');
        onSelectVastuSubTab('jyotish');
        onClose();
      }
    },
    {
      id: 'numerology_loshu',
      category: 'spiritual',
      titleEn: 'Lo Shu Grid & Numerology Calculator',
      titleHi: 'लो शू ग्रिड एवं अंक शास्त्र कैलकुलेटर',
      descEn: 'Calculate Mulank, Bhagyank, 3x3 Lo Shu Grid, and audit phone, house & vehicle compatibility.',
      descHi: 'मूलांक, भाग्यांक, 3x3 लो शू ग्रिड तथा मोबाइल, मकान व वाहन नंबर की अनुकूलता जांचें।',
      icon: <Hash className="w-5 h-5 text-teal-400" />,
      iconBg: 'bg-teal-500/20 border-teal-500/40',
      tagEn: 'Numerology',
      tagHi: 'अंक शास्त्र',
      action: () => {
        onSelectTab('vastu');
        onSelectVastuSubTab('numerology');
        onClose();
      }
    },
    {
      id: 'qibla_finder',
      category: 'spiritual',
      titleEn: 'Qibla (Kaaba Makkah) Compass',
      titleHi: 'किबला (काबा मक्का) दिशा सूचक',
      descEn: 'Geodesic Kaaba bearing calculation from your GPS with exact kilometer distance and align chime.',
      descHi: 'आपके GPS से पवित्र काबा की सटीक बेयरिंग व दूरी तथा संरेखण संकेत।',
      icon: <Navigation className="w-5 h-5 text-rose-400" />,
      iconBg: 'bg-rose-500/20 border-rose-500/40',
      tagEn: 'Geodesic',
      tagHi: 'किबला',
      action: () => {
        onSelectTab('vastu');
        onSelectVastuSubTab('qibla');
        onClose();
      }
    },
    {
      id: 'jain_sadhana',
      category: 'spiritual',
      titleEn: 'Jain Sadhana & 108 Jaap Counter',
      titleHi: 'जैन साधना एवं 108 नवकार जाप',
      descEn: 'Interactive Navkar Mahamantra rosary counter with haptic feedback & daily spiritual checklist.',
      descHi: '108 नवकार महामंत्र जाप काउंटर (हैप्टिक कंपन सहित) एवं दैनिक साधना चेकलिस्ट।',
      icon: <Activity className="w-5 h-5 text-orange-400" />,
      iconBg: 'bg-orange-500/20 border-orange-500/40',
      tagEn: 'Sadhana',
      tagHi: 'जाप माला',
      action: () => {
        onSelectTab('vastu');
        onSelectVastuSubTab('sadhana');
        onClose();
      }
    },
    {
      id: 'feng_shui',
      category: 'spiritual',
      titleEn: 'Feng Shui Bagua Energy Compass',
      titleHi: 'फेंग शुई बागुआ ऊर्जा कंपास',
      descEn: 'Traditional 8-trigram Bagua energy map to harmonize wealth, fame, career & relationships.',
      descHi: 'धन, प्रसिद्धि, करियर व पारिवारिक सौहार्द हेतु 8 त्रिकोण बागुआ ऊर्जा गाइड।',
      icon: <Wind className="w-5 h-5 text-emerald-400" />,
      iconBg: 'bg-emerald-500/20 border-emerald-500/40',
      tagEn: 'Harmony',
      tagHi: 'फेंग शुई',
      action: () => {
        onSelectTab('vastu');
        onSelectVastuSubTab('feng_shui');
        onClose();
      }
    },
    {
      id: 'weather_solar',
      category: 'utility',
      titleEn: 'Live Weather & Solar Cycle Telemetry',
      titleHi: 'मौसम एवं सूर्योदय-सूर्यास्त चक्र',
      descEn: 'Live atmospheric pressure, humidity, wind, UV, and exact sunrise & sunset countdown.',
      descHi: 'वायुमंडलीय दबाव, आर्द्रता, हवा की गति, तापमान व सूर्योदय-सूर्यास्त का लाइव काउंटडाउन।',
      icon: <Sun className="w-5 h-5 text-amber-400" />,
      iconBg: 'bg-amber-500/20 border-amber-500/40',
      tagEn: 'Live Forecast',
      tagHi: 'लाइव मौसम',
      action: () => {
        onOpenWeather();
        onClose();
      }
    },
    {
      id: 'torch_utility',
      category: 'utility',
      titleEn: 'Flashlight Torch / Screen Awake',
      titleHi: 'फ्लैशलाइट टॉर्च एवं स्क्रीन चालू मोड',
      descEn: 'Instant night torch for surveying and Always-On display lock while reading.',
      descHi: 'सर्वेक्षण हेतु तुरंत फ्लैशलाइट टॉर्च एवं स्क्रीन बंद होने से रोकने वाला मोड।',
      icon: <Zap className="w-5 h-5 text-yellow-300" />,
      iconBg: 'bg-yellow-500/20 border-yellow-500/40',
      tagEn: isTorchOn ? 'Torch ON' : 'Utility',
      tagHi: isTorchOn ? 'टॉर्च चालू' : 'उपयोगिता',
      action: () => {
        onToggleTorch();
        onClose();
      }
    }
  ];

  const filteredFeatures = features.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;
    const matchesQuery = 
      item.titleEn.toLowerCase().includes(query) ||
      item.titleHi.toLowerCase().includes(query) ||
      item.descEn.toLowerCase().includes(query) ||
      item.descHi.toLowerCase().includes(query) ||
      item.tagEn.toLowerCase().includes(query) ||
      item.tagHi.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={cn(
        "w-full max-w-lg max-h-[90vh] rounded-[32px] border flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200",
        theme === 'light' 
          ? "bg-white border-stone-200 text-stone-900" 
          : "bg-[#141414] border-white/15 text-white"
      )}>
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight leading-none">
                {isHi ? '✨ संपूर्ण सुविधा डायरेक्टरी (Toolbox)' : '✨ All Features & Toolbox Explorer'}
              </h3>
              <p className="text-[11px] text-stone-400 font-medium mt-1">
                {isHi ? 'किसी भी टूल पर 1-टैप करके सीधे उपयोग करें' : 'Explore all compass, Vastu & spiritual tools with 1 tap'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white border border-white/10 active:scale-90 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Category Filter Pills */}
        <div className="p-3 sm:p-4 border-b border-white/5 flex flex-col gap-2.5 bg-black/10">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isHi ? "टूल या सुविधा खोजें (जैसे: वास्तु, कैमरा, मुहूर्त, किबला)..." : "Search feature (e.g., Vastu, AR Camera, Muhurat, Qibla)..."}
              className={cn(
                "w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium border focus:outline-none transition-colors",
                theme === 'light'
                  ? "bg-stone-100 border-stone-300 text-stone-900 placeholder:text-stone-400 focus:border-amber-500"
                  : "bg-stone-900/90 border-white/10 text-white placeholder:text-stone-500 focus:border-amber-400/60"
              )}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', labelEn: 'All Tools', labelHi: 'सभी टूल्स', count: features.length },
              { id: 'compass', labelEn: '🧭 Compass', labelHi: '🧭 कंपास', count: 1 },
              { id: 'vastu', labelEn: '✨ Vastu & AR', labelHi: '✨ वास्तु व AR', count: 3 },
              { id: 'spiritual', labelEn: '⭐ Vedic & Wisdom', labelHi: '⭐ वैदिक व ज्योतिष', count: 5 },
              { id: 'utility', labelEn: '📐 Sensors & Tools', labelHi: '📐 सेंसर्स व टूल्स', count: 3 }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={cn(
                  "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border shrink-0",
                  activeCategory === cat.id
                    ? "bg-amber-500 text-stone-950 border-amber-300 shadow-md scale-[1.02]"
                    : theme === 'light'
                    ? "bg-stone-100 border-stone-200 text-stone-600 hover:text-stone-900"
                    : "bg-stone-900 border-white/10 text-stone-400 hover:text-white"
                )}
              >
                {isHi ? cat.labelHi : cat.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Cards Grid (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[58vh]">
          {filteredFeatures.map((feat) => (
            <div
              key={feat.id}
              onClick={feat.action}
              className={cn(
                "p-3 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-[0.98] group flex flex-col justify-between gap-2 shadow-sm",
                theme === 'light'
                  ? "bg-stone-50/90 border-stone-200/90 hover:border-amber-400 hover:bg-amber-50/40"
                  : "bg-white/[0.03] border-white/10 hover:border-amber-400/50 hover:bg-white/[0.06]"
              )}
            >
              <div className="flex items-start gap-2.5">
                <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-sm", feat.iconBg)}>
                  {feat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-black truncate group-hover:text-amber-400 transition-colors">
                      {isHi ? feat.titleHi : feat.titleEn}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[8.5px] font-bold uppercase tracking-wider bg-white/10 border border-white/10 text-stone-300 shrink-0">
                      {isHi ? feat.tagHi : feat.tagEn}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-snug line-clamp-2">
                    {isHi ? feat.descHi : feat.descEn}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] font-bold text-amber-400">
                <span>{isHi ? 'खोलें / शुरू करें' : 'Open Feature'}</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}

          {filteredFeatures.length === 0 && (
            <div className="col-span-full py-8 text-center text-stone-400 text-xs">
              {isHi ? 'कोई टूल नहीं मिला। कृपया अन्य शब्द खोजें।' : 'No matching tools found. Try another search term.'}
            </div>
          )}
        </div>

        {/* Modal Footer Quick Action Bar */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-black/20 flex items-center justify-between gap-2">
          <span className="text-[10px] text-stone-400 font-bold">
            {isHi ? `कुल ${features.length} प्रीमियम सुविधाएं सक्रिय` : `All ${features.length} Precision Features Included`}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider active:scale-95 transition-all shadow-md"
          >
            {isHi ? 'पूर्ण' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
