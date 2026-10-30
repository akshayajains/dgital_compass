import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TourStep {
  targetId: string;
  titleEn: string;
  titleHi: string;
  descEn: string;
  descHi: string;
  icon: string;
  accentColor: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tab-compass',
    titleEn: 'This is Compass (360° Heading)',
    titleHi: 'यह कम्पास है (360° दिशा)',
    descEn: 'Tap here for precision 360° azimuth, True North calibration & live coordinates.',
    descHi: 'सटीक 360° दिशा, वास्तविक उत्तर (True North) व लाइव अक्षांश-देशांतर देखें।',
    icon: '🧭',
    accentColor: '#F59E0B'
  },
  {
    targetId: 'tab-level',
    titleEn: 'This is Spirit Level (4 Units)',
    titleHi: 'यह स्पिरिट लेवल है (4 यूनिट्स)',
    descEn: 'Tap here for dual-axis 2D Bullseye & clinometer (Deg °, Slope %, mm/m, in/ft).',
    descHi: '2D बुलआई स्पिरिट लेवल व ढलान कोण (डिग्री, स्लोप %, mm/m, in/ft)।',
    icon: '📐',
    accentColor: '#06B6D4'
  },
  {
    targetId: 'tab-vastu',
    titleEn: 'This is Vastu 6-in-1 Suite',
    titleHi: 'यह वास्तु 6-इन-1 है',
    descEn: 'Instant Room-by-room verdict, 16 Zones, 32 Vedic Devta Padas & zero-demolition remedies.',
    descHi: 'कमरा वास्तु परीक्षक, 16 दिशाएं, 32 देवता पद व बिना तोड़फोड़ के सरल उपाय।',
    icon: '🏛️',
    accentColor: '#EC4899'
  },
  {
    targetId: 'color-swatches',
    titleEn: 'This is Color Palette',
    titleHi: 'यह रंग पैलेट है',
    descEn: 'Tap to instantly switch colors: Black, Grey, Beige, White & luxury jewel tones.',
    descHi: 'कंपास का रंग तुरंत बदलें: ब्लैक, ग्रे, बेज, सफ़ेद व अन्य खूबसूरत रंग।',
    icon: '🎨',
    accentColor: '#8B5CF6'
  },
  {
    targetId: 'hold-button',
    titleEn: 'Hold / Freeze Reading',
    titleHi: 'रीडिंग होल्ड / लॉक करें',
    descEn: 'Lock live degrees anytime so you can easily inspect directions without phone movement.',
    descHi: 'दिशा को स्थिर (Lock) करें ताकि फोन हिलाने पर भी वास्तु रीडिंग सुरक्षित रहे।',
    icon: '🔒',
    accentColor: '#10B981'
  }
];

interface SpotlightArrowTourProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  theme: string;
  onHaptic?: () => void;
}

export const SpotlightArrowTour: React.FC<SpotlightArrowTourProps> = ({
  isOpen,
  onClose,
  language,
  theme,
  onHaptic
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const isHi = language === 'hi';
  const step = TOUR_STEPS[currentStepIndex];
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  // Measure target bounding rect
  const updateRect = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(`[data-tour="${step.targetId}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (!isOpen) return;
    updateRect();
    const handleResize = () => updateRect();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    const timer = setTimeout(updateRect, 100);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
      clearTimeout(timer);
    };
  }, [isOpen, currentStepIndex, updateRect]);

  if (!isOpen) return null;

  const handleNext = () => {
    onHaptic?.();
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    onHaptic?.();
    setCurrentStepIndex(prev => Math.max(0, prev - 1));
  };

  const handleComplete = () => {
    onHaptic?.();
    try {
      localStorage.setItem('com.spiritual.compass.spotlight_arrow_tour_done', 'true');
    } catch (e) {
      console.error('Failed to save spotlight tour completion:', e);
    }
    onClose();
  };

  // Determine if tooltip should be above or below target
  const isBelow = targetRect ? (targetRect.bottom < window.innerHeight - 230) : true;

  return (
    <div className="fixed inset-0 z-[150] pointer-events-auto select-none overflow-hidden">
      {/* 1. Backdrop Overlay */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={handleComplete}
      />

      {/* 2. Spotlight Cutout / Glowing Halo around Target */}
      {targetRect && (
        <motion.div
          key={step.targetId}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12
          }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="absolute rounded-2xl pointer-events-none"
          style={{
            boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 20px ${step.accentColor}`,
            border: `2px solid ${step.accentColor}`
          }}
        >
          {/* Subtle pulse ring */}
          <span 
            className="absolute -inset-1 rounded-2xl animate-ping opacity-40 pointer-events-none"
            style={{ border: `2px solid ${step.accentColor}` }}
          />
        </motion.div>
      )}

      {/* 3. Floating Tooltip & Animated Arrow */}
      {targetRect && (
        <div
          className="absolute left-0 right-0 flex flex-col items-center px-4 pointer-events-none z-10"
          style={{
            top: isBelow ? `${targetRect.bottom + 12}px` : undefined,
            bottom: !isBelow ? `${window.innerHeight - targetRect.top + 12}px` : undefined
          }}
        >
          {/* Arrow pointing UP (if tooltip is below target) */}
          {isBelow && (
            <motion.div
              animate={{ y: [-4, 3, -4] }}
              transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
              className="flex items-center justify-center -mb-1"
            >
              <svg width="28" height="14" viewBox="0 0 28 14" fill="none" className="drop-shadow-[0_0_8px_rgba(245,158,11,0.9)]">
                <path d="M14 0L28 14H0L14 0Z" fill={step.accentColor} />
              </svg>
            </motion.div>
          )}

          {/* Tooltip Card */}
          <motion.div
            key={`card-${step.targetId}`}
            initial={{ opacity: 0, scale: 0.92, y: isBelow ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "w-full max-w-xs rounded-2xl p-4 border shadow-2xl pointer-events-auto flex flex-col gap-2.5",
              theme === 'light'
                ? "bg-white/95 border-amber-300 text-stone-900 shadow-[0_15px_40px_rgba(0,0,0,0.25)]"
                : "bg-[#141416]/95 border-white/20 text-white shadow-[0_20px_50px_rgba(0,0,0,0.95)]"
            )}
            style={{ borderColor: step.accentColor }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top row: step count & skip */}
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{step.icon}</span>
                <span 
                  className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border"
                  style={{ color: step.accentColor, borderColor: `${step.accentColor}60`, backgroundColor: `${step.accentColor}15` }}
                >
                  {isHi ? `चरण ${currentStepIndex + 1} / ${TOUR_STEPS.length}` : `STEP ${currentStepIndex + 1} OF ${TOUR_STEPS.length}`}
                </span>
              </div>

              <button
                onClick={handleComplete}
                className="text-[12px] font-bold opacity-60 hover:opacity-100 uppercase tracking-wider flex items-center gap-0.5"
              >
                <span>{isHi ? 'समझ गए (Skip)' : 'Skip'}</span>
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Title & Description */}
            <div>
              <h3 className="text-sm font-black tracking-tight leading-snug">
                {isHi ? step.titleHi : step.titleEn}
              </h3>
              <p className="text-[11.5px] leading-relaxed opacity-85 mt-1 font-medium">
                {isHi ? step.descHi : step.descEn}
              </p>
            </div>

            {/* Bottom Actions Row */}
            <div className="w-full flex items-center justify-between pt-1 border-t border-current/10">
              {/* Dots */}
              <div className="flex items-center gap-1">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === currentStepIndex ? "w-4 bg-amber-400" : "w-1.5 bg-stone-500/40"
                    )}
                  />
                ))}
              </div>

              {/* Back & Next buttons */}
              <div className="flex items-center gap-1.5">
                {currentStepIndex > 0 && (
                  <button
                    onClick={handleBack}
                    className="px-2.5 py-1 rounded-xl text-[12px] font-bold border border-current/15 opacity-75 hover:opacity-100"
                  >
                    {isHi ? 'पीछे' : 'Back'}
                  </button>
                )}

                <button
                  onClick={handleNext}
                  className="px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1 text-stone-950 shadow-md active:scale-95 transition-all"
                  style={{ backgroundColor: step.accentColor }}
                >
                  <span>{isLast ? (isHi ? 'शुरू करें ✓' : 'Got it! ✓') : (isHi ? 'आगे ›' : 'Next ›')}</span>
                  {!isLast && <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Arrow pointing DOWN (if tooltip is above target) */}
          {!isBelow && (
            <motion.div
              animate={{ y: [4, -3, 4] }}
              transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
              className="flex items-center justify-center -mt-1"
            >
              <svg width="28" height="14" viewBox="0 0 28 14" fill="none" className="drop-shadow-[0_0_8px_rgba(245,158,11,0.9)]">
                <path d="M14 14L0 0H28L14 14Z" fill={step.accentColor} />
              </svg>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};
