import React, { useState } from 'react';
import { Compass, Layers, Grid3x3, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

const ONBOARDING_KEY = 'com.hcompass.app_onboarded';

interface Slide {
  icon: React.ReactNode;
  title: string;
  titleHi: string;
  desc: string;
  descHi: string;
  accent: string;
}

export const OnboardingOverlay: React.FC = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isHi = language === 'hi';
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const slides: Slide[] = [
    {
      icon: <Compass className="w-10 h-10" />,
      title: 'Live Compass',
      titleHi: 'लाइव कम्पास',
      desc: 'Real-time heading with True/Magnetic toggle, automatic declination, sunrise & sunset timers, and one-tap share.',
      descHi: 'वास्तविक समय दिशा, ट्रू/मैग्नेटिक टॉगल, स्वचालित डिक्लिनेशन, सूर्योदय-सूर्यास्त टाइमर और एक-टैप शेयर।',
      accent: 'text-sky-400'
    },
    {
      icon: <Layers className="w-10 h-10" />,
      title: 'Precision Level',
      titleHi: 'प्रिसिजन लेवल',
      desc: 'Bullseye & dual-vial modes, target angle tracking, hold-to-measure, reading history log, and haptic feedback.',
      descHi: 'बुल्सआई और डुअल-वायल मोड, लक्ष्य कोण ट्रैकिंग, होल्ड-टू-मेजर, रीडिंग हिस्ट्री लॉग और हैप्टिक फीडबैक।',
      accent: 'text-emerald-400'
    },
    {
      icon: <Grid3x3 className="w-10 h-10" />,
      title: 'Vastu Analyzer',
      titleHi: 'वास्तु विश्लेषक',
      desc: 'Interactive 9-grid floorplan mapper with live score, 32-pada gate checker, saved rooms, and remedies.',
      descHi: 'लाइव स्कोर के साथ 9-ग्रिड फ्लोरप्लान मैपर, 32-पद द्वार जांच, सहेजे गए कक्ष और उपाय।',
      accent: 'text-amber-400'
    }
  ];

  const finish = () => {
    try { localStorage.setItem(ONBOARDING_KEY, 'true'); } catch {}
    setDismissed(true);
  };

  const slide = slides[step];
  const isLast = step === slides.length - 1;

  if (dismissed) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md",
      theme === 'light' ? "bg-stone-100/90" : "bg-stone-950/90"
    )}>
      <div className={cn(
        "w-full max-w-sm rounded-[28px] border p-6 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 fade-in",
        theme === 'light'
          ? "bg-white border-stone-200 shadow-[0_25px_60px_rgba(0,0,0,0.18)]"
          : "bg-stone-900 border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)]"
      )}>
        {/* Skip */}
        <button
          onClick={finish}
          className={cn("absolute top-4 right-4 p-1.5 rounded-full transition-colors", theme === 'light' ? "text-stone-400 hover:text-stone-700" : "text-stone-500 hover:text-white")}
          title={isHi ? 'छोड़ें' : 'Skip'}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className={cn(
          "w-20 h-20 rounded-3xl border flex items-center justify-center mb-4",
          theme === 'light' ? "bg-stone-50 border-stone-200" : "bg-white/5 border-white/10"
        )}>
          <span className={slide.accent}>{slide.icon}</span>
        </div>

        {/* Title */}
        <h2 className={cn("text-lg font-black tracking-tight", theme === 'light' ? "text-stone-900" : "text-white")}>
          {isHi ? slide.titleHi : slide.title}
        </h2>

        {/* Description */}
        <p className={cn("mt-2 text-[12px] leading-relaxed font-medium", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
          {isHi ? slide.descHi : slide.desc}
        </p>

        {/* Dots */}
        <div className="flex items-center gap-1.5 mt-5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === step ? "w-6 bg-amber-500" : (theme === 'light' ? "w-1.5 bg-stone-300" : "w-1.5 bg-stone-700")
              )}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 w-full mt-5">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className={cn(
                "flex items-center gap-1 px-3 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all active:scale-95",
                theme === 'light' ? "bg-white border-stone-300 text-stone-600" : "bg-white/5 border-white/10 text-stone-300"
              )}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {isHi ? 'पीछे' : 'Back'}
            </button>
          )}
          <button
            onClick={() => {
              if (isLast) finish();
              else setStep(step + 1);
            }}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95",
              isLast ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]" : "bg-amber-500 text-stone-950 shadow-[0_0_20px_rgba(245,158,11,0.35)]"
            )}
          >
            {isLast ? (isHi ? 'शुरू करें' : 'Get Started') : (isHi ? 'आगे' : 'Next')}
            {!isLast && <ChevronRight className="w-3.5 h-3.5 inline ml-1" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export const shouldShowOnboarding = (): boolean => {
  try { return localStorage.getItem(ONBOARDING_KEY) !== 'true'; } catch { return false; }
};