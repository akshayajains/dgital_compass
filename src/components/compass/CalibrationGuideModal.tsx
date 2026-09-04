import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Sparkles, CheckCircle2, RotateCcw, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface CalibrationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  theme: string;
  magneticInterference?: boolean;
}

export const CalibrationGuideModal = ({
  isOpen,
  onClose,
  language,
  theme,
  magneticInterference
}: CalibrationGuideModalProps) => {
  const [progress, setProgress] = useState<number>(10);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setProgress(10);
      setIsCalibrated(false);
      return;
    }

    let count = 0;
    const interval = setInterval(() => {
      count += 15;
      setProgress(Math.min(100, count));
      if (count >= 100) {
        clearInterval(interval);
        setIsCalibrated(true);
        try {
          Haptics.impact({ style: ImpactStyle.Heavy });
        } catch {}
      }
    }, 600);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className={cn(
            "w-full max-w-sm rounded-[2rem] border p-6 shadow-2xl relative overflow-hidden flex flex-col items-center text-center",
            theme === 'light'
              ? "bg-gradient-to-b from-amber-50/95 to-amber-100/90 border-amber-500/30 text-amber-950"
              : "bg-gradient-to-b from-[#1c1917]/95 via-[#181512]/95 to-black/95 border-amber-500/20 text-amber-100"
          )}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 active:scale-90 transition-transform text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Heading */}
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
              {language === 'hi' ? 'सटीकता कैलिब्रेशन' : 'Precision Calibration'}
            </span>
          </div>

          <h3 className="text-lg font-black font-serif text-white mb-2">
            {language === 'hi' ? '8-आकार (Figure-8) में घुमाएँ' : 'Wave in Figure-8 Motion'}
          </h3>

          <p className="text-xs text-stone-400 max-w-[260px] leading-relaxed mb-6">
            {language === 'hi'
              ? 'चुंबकीय सटीकता और शून्य-विचलन के लिए अपने फोन को हवा में 8 के आकार में 2-3 बार धीरे-धीरे घुमाएँ।'
              : 'Smoothly move your device in an infinity (∞) / figure-8 pattern in the air to calibrate magnetic sensors.'}
          </p>

          {/* Animated 3D Figure-8 Illustration */}
          <div className="relative w-40 h-28 flex items-center justify-center mb-6">
            {/* SVG Path */}
            <svg viewBox="0 0 160 100" className="w-full h-full stroke-amber-500/30 fill-none stroke-[3] overflow-visible">
              <path
                d="M 40,50 C 40,25 80,25 80,50 C 80,75 120,75 120,50 C 120,25 80,25 80,50 C 80,75 40,75 40,50 Z"
                strokeDasharray="6,4"
              />
            </svg>

            {/* Orbiting Satellite Indicator */}
            <motion.div
              animate={{
                offsetDistance: ['0%', '100%']
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                offsetPath: "path('M 40,50 C 40,25 80,25 80,50 C 80,75 120,75 120,50 C 120,25 80,25 80,50 C 80,75 40,75 40,50 Z')",
              }}
              className="absolute w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 shadow-[0_0_15px_rgba(251,191,36,0.9)] flex items-center justify-center"
            >
              <Compass className="w-3.5 h-3.5 text-stone-950 animate-spin" />
            </motion.div>
          </div>

          {/* Interference Badge if flagged */}
          {magneticInterference && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold mb-4">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'hi' ? 'चुंबकीय हस्तक्षेप पहचाना गया' : 'Interference Detected'}</span>
            </div>
          )}

          {/* Progress bar */}
          <div className="w-full space-y-1.5 mb-5">
            <div className="flex justify-between text-[11px] font-black text-stone-400">
              <span>{language === 'hi' ? 'सेंसर संरेखन' : 'Sensor Alignment'}</span>
              <span className={cn(isCalibrated ? "text-emerald-400" : "text-amber-400")}>{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden border border-white/10">
              <motion.div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  isCalibrated ? "bg-gradient-to-r from-emerald-500 to-green-400" : "bg-gradient-to-r from-amber-500 to-yellow-400"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={onClose}
            className={cn(
              "w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all",
              isCalibrated
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/20"
                : "bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20"
            )}
          >
            {isCalibrated ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{language === 'hi' ? 'कैलिब्रेशन पूर्ण' : 'Sensor Calibrated'}</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>{language === 'hi' ? 'जारी रखें' : 'Done / Continue'}</span>
              </>
            )}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
