import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, 
  Sparkles, 
  Layers, 
  Palette, 
  Activity, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  X,
  Gauge,
  Home,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  theme: string;
  onHaptic?: () => void;
}

interface OnboardingSlide {
  id: string;
  icon: React.ReactNode;
  titleEn: string;
  titleHi: string;
  subtitleEn: string;
  subtitleHi: string;
  descEn: string;
  descHi: string;
  badgeEn: string;
  badgeHi: string;
  badgeColor: string;
  highlightsEn: string[];
  highlightsHi: string[];
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'compass_level',
    icon: <Compass className="w-8 h-8 text-amber-400 animate-spin-slow" />,
    titleEn: 'Precision Compass & Spirit Level',
    titleHi: 'सटीक 360° कम्पास व स्पिरिट लेवल',
    subtitleEn: 'Dual-Axis Sensor Fusion & 4-Unit Clinometer',
    subtitleHi: 'सेंसर संतुलन व 4-इंजीनियरिंग यूनिट्स',
    descEn: 'Instant calibrated 360° True North guidance paired with a professional 2D Bullseye & Tubular Spirit Level.',
    descHi: 'सटीक चुंबकीय व वास्तविक उत्तर (True North) दिशा और 2D बुलआई व ट्यूबुलर स्पिरिट लेवल।',
    badgeEn: 'Dual-Axis Sensor Fusion',
    badgeHi: 'सेंसर संतुलन',
    badgeColor: 'border-amber-400/50 text-amber-300 bg-amber-500/10',
    highlightsEn: [
      'Switch between ° DEG, % SLOPE, mm/m, and in/ft',
      'High-contrast 2D Bullseye reticle with 0.1° accuracy',
      'True North declination from NOAA magnetic model'
    ],
    highlightsHi: [
      'डिग्री (°), स्लोप (%), mm/m व in/ft में आसानी से बदलें',
      '0.1° सटीकता वाला 2D बुलआई लेवल व वाइब्रेशन अलर्ट',
      'NOAA चुंबकीय मॉडल आधारित वास्तविक उत्तर (True North)'
    ]
  },
  {
    id: 'vastu_suite',
    icon: <Home className="w-8 h-8 text-emerald-400" />,
    titleEn: 'Room-by-Room Vastu & 16 Zones',
    titleHi: 'कमरा-दर-कमरा वास्तु व 16 दिशाएं',
    subtitleEn: 'Instant Verdicts & Practical Zero-Demolition Cures',
    subtitleHi: 'लाइव वास्तु निर्णय व बिना तोड़फोड़ के अचूक उपाय',
    descEn: 'Point your phone at any room to get instant auspiciousness verdicts, elemental clash warnings, and non-destructive cures.',
    descHi: 'किसी भी कमरे (मंदिर, रसोई, बेडरूम) पर फोन इंगित करें और तुरंत शुभता स्कोर व सरल उपाय पाएं।',
    badgeEn: '32 Devta Padas • 16 Zones',
    badgeHi: '32 वैदिक पद • 16 दिशाएं',
    badgeColor: 'border-emerald-400/50 text-emerald-300 bg-emerald-500/10',
    highlightsEn: [
      'Instant Auspicious, Neutral & Dosha room verdicts',
      'Dynamic Turn Navigator to align to ideal directions',
      '5 Vedic Elements (Water, Air, Fire, Earth, Space) on dial'
    ],
    highlightsHi: [
      'कमरे के लिए तुरंत शुभ, मध्यम व वास्तु दोष का लाइव निर्णय',
      'सही दिशा में घूमने हेतु रियल-टाइम नेविगेटर गाइड',
      'कम्पास डायल पर 5 पंचमहाभूत (जल, वायु, अग्नि, पृथ्वी, आकाश)'
    ]
  },
  {
    id: 'luxury_dials',
    icon: <Palette className="w-8 h-8 text-sky-400" />,
    titleEn: 'Curated Palettes & Astrolabe Dials',
    titleHi: 'लग्जरी डायल्स व सुरुचिपूर्ण रंग',
    subtitleEn: 'Pitch Black, Graphite Grey, Vintage Beige & Gold',
    subtitleHi: 'पिच ब्लैक, ग्रेफाइट ग्रे, विंटेज बेज व 24K गोल्ड',
    descEn: 'Personalize your dial with Black, Grey, and Beige defaults, or experience 24K Royal Gold, Sandalwood, and Vedic Astrolabes.',
    descHi: 'अपनी पसंद के अनुसार ब्लैक, ग्रे, बेज कलर पैलेट चुनें या 24K शाही गोल्ड व चंदन डायल का अनुभव लें।',
    badgeEn: '10+ Luxury Styles',
    badgeHi: '10+ लग्जरी डायल्स',
    badgeColor: 'border-sky-400/50 text-sky-300 bg-sky-500/10',
    highlightsEn: [
      'Default Color Palette: Black, Grey, Beige, White & Jewel Tones',
      'Ornate 24K Shahi Gold & Sandalwood handcrafted dials',
      'One-tap toggle for dark, light, and AMOLED themes'
    ],
    highlightsHi: [
      'प्राथमिक रंग: ब्लैक, ग्रे, बेज, सफ़ेद व रत्न शैलियां',
      '24K शाही गोल्ड व नक्काशीदार चंदन वुडन कंपास',
      'AMOLED डार्क व लाइट थीम में एक-टैप स्विचिंग'
    ]
  },
  {
    id: 'sensors_calibration',
    icon: <Activity className="w-8 h-8 text-purple-400" />,
    titleEn: 'Live Sensors & Easy Calibration',
    titleHi: 'लाइव सेंसर्स व आसान कैलिब्रेशन',
    subtitleEn: 'Magnetic Shield, GPS Altitude & Circular Calibration',
    subtitleHi: 'चुंबकीय सुरक्षा, जीपीएस ऊंचाई व गोलाकार कैलिब्रेशन',
    descEn: 'Built-in sensor fusion continuously monitors hardware accuracy. Simply tilt your phone to roll the ball along the circle whenever needed.',
    descHi: 'सेंसर सुरक्षा प्रणाली चुंबकीय हस्तक्षेप की चेतावनी देती है। सटीकता बढ़ाने हेतु फोन को झुकाकर गेंद को वृत्त में घुमाएं।',
    badgeEn: 'Automatic Accuracy Sync',
    badgeHi: 'स्वतः सेंसर संतुलन',
    badgeColor: 'border-purple-400/50 text-purple-300 bg-purple-500/10',
    highlightsEn: [
      'Real-time magnetic interference alerts & signal health',
      'GPS altitude, barometric air pressure & weather data',
      'Smooth rolling ball circular calibration in seconds'
    ],
    highlightsHi: [
      'चुंबकीय हस्तक्षेप और सेंसर सिग्नल स्वास्थ्य की लाइव निगरानी',
      'GPS ऊंचाई, बैरोमीटर वायुदाब और मौसम इनसाइट्स',
      'कुछ ही सेकंड में आसान गोलाकार (Rolling Ball) कैलिब्रेशन'
    ]
  }
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  language,
  theme,
  onHaptic
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const isHi = language === 'hi';
  const slide = ONBOARDING_SLIDES[currentSlideIndex];
  const isLastSlide = currentSlideIndex === ONBOARDING_SLIDES.length - 1;

  if (!isOpen) return null;

  const handleNext = () => {
    onHaptic?.();
    if (isLastSlide) {
      handleComplete();
    } else {
      setCurrentSlideIndex(prev => Math.min(ONBOARDING_SLIDES.length - 1, prev + 1));
    }
  };

  const handleBack = () => {
    onHaptic?.();
    setCurrentSlideIndex(prev => Math.max(0, prev - 1));
  };

  const handleComplete = () => {
    onHaptic?.();
    try {
      localStorage.setItem('com.spiritual.compass.onboarding_completed', 'true');
    } catch (e) {
      console.error('Failed to save onboarding completion:', e);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={handleComplete}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={cn(
            "relative w-full max-w-sm rounded-[32px] border p-5 flex flex-col justify-between overflow-hidden shadow-2xl z-10 min-h-[490px]",
            theme === 'light'
              ? "bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5ECE1] border-amber-300/80 text-stone-900 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
              : "bg-gradient-to-b from-[#141416] via-[#0E0E10] to-[#070708] border-white/15 text-white shadow-[0_25px_70px_rgba(0,0,0,0.95)]"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle Ambient Background Radial Glow */}
          <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

          {/* Top Header Bar */}
          <div className="w-full flex items-center justify-between pb-2 border-b border-current/10">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-black uppercase tracking-[0.2em] opacity-60">
                {isHi ? 'ऐप गाइड' : 'WELCOME GUIDE'}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-current/15 opacity-75">
                {currentSlideIndex + 1} / {ONBOARDING_SLIDES.length}
              </span>
            </div>

            <button
              onClick={handleComplete}
              className="px-2.5 py-1 rounded-full text-[12px] font-black uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1"
            >
              <span>{isHi ? 'छोड़ें' : 'Skip'}</span>
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Slide Content Area with AnimatePresence */}
          <div className="flex-1 flex flex-col justify-center py-4 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col gap-3"
              >
                {/* Hero Icon & Badge */}
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner",
                    theme === 'light' ? "bg-white border-amber-300" : "bg-white/5 border-white/10"
                  )}>
                    {slide.icon}
                  </div>

                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border",
                    slide.badgeColor
                  )}>
                    {isHi ? slide.badgeHi : slide.badgeEn}
                  </span>
                </div>

                {/* Title & Subtitle */}
                <div>
                  <h2 className="text-lg font-black tracking-tight leading-tight">
                    {isHi ? slide.titleHi : slide.titleEn}
                  </h2>
                  <p className="text-[11.5px] font-semibold text-amber-400 mt-0.5">
                    {isHi ? slide.subtitleHi : slide.subtitleEn}
                  </p>
                </div>

                {/* Narrative Description */}
                <p className="text-[11.5px] leading-relaxed opacity-85">
                  {isHi ? slide.descHi : slide.descEn}
                </p>

                {/* 3 Key Highlights */}
                <div className={cn(
                  "rounded-2xl p-3 border flex flex-col gap-1.5",
                  theme === 'light' ? "bg-white/70 border-stone-200" : "bg-white/[0.04] border-white/10"
                )}>
                  {(isHi ? slide.highlightsHi : slide.highlightsEn).map((hl, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] leading-snug">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="opacity-95">{hl}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Navigation & Pagination Controls */}
          <div className="w-full pt-3 border-t border-current/10 flex items-center justify-between gap-3">
            {/* Dot Indicators */}
            <div className="flex items-center gap-1.5">
              {ONBOARDING_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onHaptic?.();
                    setCurrentSlideIndex(idx);
                  }}
                  className={cn(
                    "transition-all duration-300 rounded-full",
                    idx === currentSlideIndex
                      ? "w-6 h-2 bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                      : "w-2 h-2 bg-stone-500/40 hover:bg-stone-500/70"
                  )}
                  title={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Buttons: Back & Next/Done */}
            <div className="flex items-center gap-2">
              {currentSlideIndex > 0 && (
                <button
                  onClick={handleBack}
                  className={cn(
                    "w-9 h-9 rounded-full border flex items-center justify-center transition-all active:scale-95",
                    theme === 'light'
                      ? "bg-stone-100 border-stone-300 text-stone-700 hover:bg-stone-200"
                      : "bg-white/5 border-white/10 text-stone-300 hover:bg-white/10"
                  )}
                  title={isHi ? 'पीछे' : 'Back'}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={handleNext}
                className={cn(
                  "px-4 py-2 rounded-full font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shadow-md",
                  isLastSlide
                    ? "bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 border border-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.6)]"
                    : theme === 'light'
                    ? "bg-stone-900 text-white border border-stone-800 hover:bg-stone-800"
                    : "bg-amber-500 text-stone-950 border border-amber-300 hover:bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)]"
                )}
              >
                <span>{isLastSlide ? (isHi ? 'शुरू करें' : 'Get Started') : (isHi ? 'आगे' : 'Next')}</span>
                {isLastSlide ? <Sparkles className="w-3.5 h-3.5 fill-current" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
