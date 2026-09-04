import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';
import { Sparkles, Compass, Heart } from 'lucide-react';

interface Props {
  className?: string;
}

interface Slide {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  gradient: string;
  glow: string;
  accent: string;
}

export const CreatorBanner: React.FC<Props> = ({ className }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const [index, setIndex] = useState(0);

  const slides: Slide[] = [
    {
      icon: <Sparkles className="w-4 h-4" />,
      title: t.creatorTitle,
      subtitle: t.creatorSubtitle,
      gradient: 'from-[#FDE68A] via-[#F59E0B] to-[#D97706]',
      glow: 'rgba(245,158,11,0.35)',
      accent: 'text-amber-300',
    },
    {
      icon: <Compass className="w-4 h-4" />,
      title: language === 'hi' ? 'वास्तु • फेंगशुई • न्यूमरोलॉजी • ज्योतिष • साधना' : 'Vastu • Feng Shui • Numerology • Jyotish • Sadhana',
      subtitle: language === 'hi' ? 'दिशा, तत्व एवं आध्यात्मिक संरेखण' : 'Direction, Element & Spiritual Alignment',
      gradient: 'from-[#C4B5FD] via-[#8B5CF6] to-[#6D28D9]',
      glow: 'rgba(139,92,246,0.35)',
      accent: 'text-violet-300',
    },
  ];

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const id = setInterval(next, 3500);
    return () => clearInterval(id);
  }, [next]);

  const current = slides[index];

  return (
    <div className={cn("w-full max-w-sm flex flex-col items-center mt-3 mb-2 animate-in fade-in", className)}>
      {/* Creator Card */}
      <div className="w-full p-4 rounded-3xl border border-white/10 bg-[#0d0b09]/95 shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-md">
        {/* Ambient Glow */}
        <div
          className="absolute -top-6 left-1/2 -translate-x-1/2 w-40 h-20 rounded-full blur-2xl pointer-events-none transition-colors duration-700"
          style={{ backgroundColor: current.glow }}
        />

        {/* Slide content */}
        <div className="relative min-h-[64px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className={cn("transition-colors duration-700", current.accent)}>
                    {current.icon}
                  </span>
                  <span className={cn(
                    "text-[13px] sm:text-sm font-serif font-black tracking-widest uppercase bg-clip-text text-transparent drop-shadow-sm bg-gradient-to-r transition-all duration-700",
                    current.gradient
                  )}>
                    {current.title}
                  </span>
                </div>

                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border shadow-sm transition-colors duration-700",
                  current.accent,
                  "border-white/20 bg-white/10"
                )}>
                  {t.creatorBadge}
                </span>
              </div>

              <p className={cn("flex items-center gap-1 text-[10px] sm:text-[11px] font-medium tracking-wide mt-0.5 transition-colors duration-700", current.accent)}>
                {index === 0 && <Heart className="w-3 h-3 fill-current" />}
                {current.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel dots */}
        <div className="relative flex items-center justify-center gap-1.5 mt-3">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-5" : "w-1.5 bg-white/20 hover:bg-white/40"
              )}
              style={i === index ? { backgroundColor: current.glow } : undefined}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
