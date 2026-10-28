import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Sparkles, Compass, Heart, ShieldCheck, Zap, Layers } from 'lucide-react';

interface Props {
  className?: string;
}

interface FeatureChip {
  label: string;
  dotColor: string;
}

interface Slide {
  badge: string;
  badgeBg: string;
  title: string;
  subtitle: string;
  features: FeatureChip[];
  gradient: string;
  glow: string;
  accent: string;
  borderStyle: string;
}

export const CreatorBanner: React.FC<Props> = ({ className }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [index, setIndex] = useState(0);

  const isLight = theme === 'light';

  const slides: Slide[] = [
    // Card 1: Creator & App Purpose + Key App Features
    {
      badge: 'CREATOR',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      title: language === 'hi' ? 'आदिश जैन द्वारा निर्मित' : 'CREATED BY AADISH JAIN',
      subtitle: language === 'hi' 
        ? 'सटीक दिशा, स्पिरिट लेवल व वास्तु 6-इन-1 आध्यात्मिक संरेखण' 
        : 'Precision 360° Compass, Spirit Level & Vastu Suite',
      features: [
        { label: language === 'hi' ? '100% निःशुल्क' : '100% Free', dotColor: 'bg-emerald-400' },
        { label: language === 'hi' ? 'शून्य विज्ञापन' : 'Zero Ads', dotColor: 'bg-sky-400' },
        { label: language === 'hi' ? 'सटीक सेंसर' : 'High Precision', dotColor: 'bg-amber-400' },
        { label: language === 'hi' ? 'ऑफ़लाइन' : 'Offline', dotColor: 'bg-purple-400' },
      ],
      gradient: isLight 
        ? 'from-amber-600 via-amber-700 to-amber-900' 
        : 'from-[#FDE68A] via-[#F59E0B] to-[#D97706]',
      glow: 'rgba(245, 158, 11, 0.28)',
      accent: isLight ? 'text-amber-800' : 'text-amber-300',
      borderStyle: isLight ? 'border-amber-400/40 shadow-amber-900/5' : 'border-amber-500/30 shadow-amber-500/10',
    },
    // Card 2: 6-in-1 Suite & Capabilities
    {
      badge: '6-IN-1 SUITE',
      badgeBg: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
      title: language === 'hi' ? 'वास्तु • फेंगशुई • न्यूमरोलॉजी • ज्योतिष' : 'VASTU • FENG SHUI • NUMEROLOGY',
      subtitle: language === 'hi'
        ? '16 ज़ोन, 32 देवता पद, लो-शू ग्रिड, दिशा शूल व स्पिरिट लेवल'
        : '16 Zones, 32 Devta Padas, Lo-Shu Grid & Multi-Unit Level',
      features: [
        { label: language === 'hi' ? '16 वास्तु ज़ोन' : '16 Vastu Zones', dotColor: 'bg-amber-400' },
        { label: language === 'hi' ? 'स्पिरिट लेवल 4 यूनिट' : '4-Unit Level', dotColor: 'bg-emerald-400' },
        { label: language === 'hi' ? 'लो-शू व कुआ' : 'Lo-Shu & Kua', dotColor: 'bg-fuchsia-400' },
        { label: language === 'hi' ? 'AR स्कैनर' : 'AR Scanner', dotColor: 'bg-cyan-400' },
      ],
      gradient: isLight 
        ? 'from-violet-700 via-purple-700 to-indigo-900' 
        : 'from-[#E9D5FF] via-[#C084FC] to-[#9333EA]',
      glow: 'rgba(147, 51, 234, 0.28)',
      accent: isLight ? 'text-violet-800' : 'text-violet-300',
      borderStyle: isLight ? 'border-violet-400/40 shadow-violet-900/5' : 'border-purple-500/30 shadow-purple-500/10',
    },
  ];

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const id = setInterval(next, 4500);
    return () => clearInterval(id);
  }, [next]);

  const current = slides[index];

  return (
    <div className={cn("w-full max-w-xl flex flex-col items-center mt-2.5 mb-2 animate-in fade-in select-none", className)}>
      {/* Compact Interactive Info Card */}
      <div 
        onClick={next}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') next(); }}
        className={cn(
          "w-full px-3.5 py-2.5 rounded-2xl border transition-all duration-500 relative overflow-hidden backdrop-blur-md cursor-pointer",
          isLight
            ? "bg-white/95 shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
            : "bg-[#0d0d0f]/95 shadow-[0_8px_25px_rgba(0,0,0,0.7)]",
          current.borderStyle
        )}
      >
        {/* Soft Radial Ambient Glow */}
        <div
          className="absolute -top-8 left-1/2 -translate-x-1/2 w-48 h-20 rounded-full blur-2xl pointer-events-none transition-colors duration-700"
          style={{ backgroundColor: current.glow }}
        />

        {/* Carousel Slide Content */}
        <div className="relative min-h-[58px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full flex flex-col"
            >
              {/* Header: Title + Badge */}
              <div className="flex items-center justify-between gap-1.5 mb-0.5">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {index === 0 ? (
                    <Sparkles className={cn("w-3.5 h-3.5 shrink-0 transition-colors duration-500", current.accent)} />
                  ) : (
                    <Compass className={cn("w-3.5 h-3.5 shrink-0 transition-colors duration-500", current.accent)} />
                  )}
                  <h4 className={cn(
                    "text-[11px] sm:text-[11.5px] font-serif font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r truncate",
                    current.gradient
                  )}>
                    {current.title}
                  </h4>
                </div>

                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border shrink-0 transition-all duration-500",
                  current.badgeBg
                )}>
                  {current.badge}
                </span>
              </div>

              {/* Subtitle / Description */}
              <p className={cn(
                "text-[10.5px] sm:text-[11px] leading-tight font-medium tracking-wide mb-1.5 truncate",
                isLight ? "text-stone-800" : "text-stone-300"
              )}>
                {current.subtitle}
              </p>

              {/* Quick Feature Badges / App Highlights */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {current.features.map((feat, fIdx) => (
                  <span
                    key={fIdx}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] sm:text-[9.5px] font-bold tracking-tight border",
                      isLight 
                        ? "bg-stone-100 text-stone-900 border-stone-300" 
                        : "bg-white/[0.08] text-stone-200 border-white/15"
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", feat.dotColor)} />
                    {feat.label}
                  </span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots + Tap Hint footer */}
        <div className="relative flex items-center justify-between mt-2 pt-1 border-t border-stone-200 dark:border-white/5">
          <span className={cn(
            "text-[9.5px] font-bold tracking-wide flex items-center gap-1",
            isLight ? "text-stone-700" : "text-stone-400"
          )}>
            <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
            <span>{language === 'hi' ? 'सटीक व विश्वसनीय' : '100% Ad-Free & Accurate'}</span>
          </span>

          <div className="flex items-center gap-1">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(i);
                }}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  i === index 
                    ? (isLight ? "w-4 bg-amber-600" : "w-4 bg-amber-400") 
                    : (isLight ? "w-1.5 bg-stone-300" : "w-1.5 bg-white/20")
                )}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
