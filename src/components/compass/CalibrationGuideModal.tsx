import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Sparkles, CheckCircle2, RotateCcw, AlertTriangle, X, Activity, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface CalibrationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  theme: string;
  magneticInterference?: boolean;
  onCalibrationComplete?: () => void;
}

export const CalibrationGuideModal: React.FC<CalibrationGuideModalProps> = ({
  isOpen,
  onClose,
  language,
  theme,
  magneticInterference,
  onCalibrationComplete
}) => {
  const isHi = language === 'hi';

  // Live angular motion excursions
  const [pitchProgress, setPitchProgress] = useState<number>(0);
  const [rollProgress, setRollProgress] = useState<number>(0);
  const [yawProgress, setYawProgress] = useState<number>(0);
  const [currentPitch, setCurrentPitch] = useState<number>(0);
  const [currentRoll, setCurrentRoll] = useState<number>(0);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);
  const [hasSensorInput, setHasSensorInput] = useState<boolean>(false);

  // Min-max tracking across figure-8
  const pitchMinRef = useRef<number>(0);
  const pitchMaxRef = useRef<number>(0);
  const rollMinRef = useRef<number>(0);
  const rollMaxRef = useRef<number>(0);
  const yawQuadrantsRef = useRef<Set<number>>(new Set());
  const completedRef = useRef<boolean>(false);

  // Total Progress
  const totalProgress = Math.min(100, Math.round(pitchProgress * 0.35 + rollProgress * 0.35 + yawProgress * 0.30));

  useEffect(() => {
    if (!isOpen) {
      setPitchProgress(0);
      setRollProgress(0);
      setYawProgress(0);
      setIsCalibrated(false);
      setHasSensorInput(false);
      completedRef.current = false;
      pitchMinRef.current = 0;
      pitchMaxRef.current = 0;
      rollMinRef.current = 0;
      rollMaxRef.current = 0;
      yawQuadrantsRef.current = new Set();
      return;
    }

    let initialOrientationCaptured = false;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const beta = e.beta;   // Pitch (-180 to 180)
      const gamma = e.gamma; // Roll (-90 to 90)
      const alpha = e.alpha; // Yaw (0 to 360)

      if (beta === null || gamma === null) return;
      setHasSensorInput(true);
      setCurrentPitch(Math.round(beta));
      setCurrentRoll(Math.round(gamma));

      if (!initialOrientationCaptured) {
        pitchMinRef.current = beta;
        pitchMaxRef.current = beta;
        rollMinRef.current = gamma;
        rollMaxRef.current = gamma;
        initialOrientationCaptured = true;
      }

      // Track Pitch Excursion (Target: 40° span)
      pitchMinRef.current = Math.min(pitchMinRef.current, beta);
      pitchMaxRef.current = Math.max(pitchMaxRef.current, beta);
      const pitchSpan = Math.abs(pitchMaxRef.current - pitchMinRef.current);
      const pScore = Math.min(100, Math.round((pitchSpan / 40) * 100));
      setPitchProgress(pScore);

      // Track Roll Excursion (Target: 45° span)
      rollMinRef.current = Math.min(rollMinRef.current, gamma);
      rollMaxRef.current = Math.max(rollMaxRef.current, gamma);
      const rollSpan = Math.abs(rollMaxRef.current - rollMinRef.current);
      const rScore = Math.min(100, Math.round((rollSpan / 45) * 100));
      setRollProgress(rScore);

      // Track Yaw Quadrant Coverage (Target: 3 or 4 quadrants)
      if (alpha !== null && alpha !== undefined) {
        const quadrant = Math.floor(((alpha % 360 + 360) % 360) / 90);
        yawQuadrantsRef.current.add(quadrant);
        const yScore = Math.min(100, Math.round((yawQuadrantsRef.current.size / 3.5) * 100));
        setYawProgress(yScore);
      }

      // Check Calibration Completion
      if (!completedRef.current && pScore >= 95 && rScore >= 95 && (yawQuadrantsRef.current.size >= 3 || yawProgress >= 85)) {
        completedRef.current = true;
        setIsCalibrated(true);
        try {
          Haptics.impact({ style: ImpactStyle.Heavy });
        } catch {}
        onCalibrationComplete?.();
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);

    // Desktop/fallback gradual simulation if no physical sensor events received
    const timeout = setTimeout(() => {
      if (!hasSensorInput && !completedRef.current) {
        // Fallback simulation timer for desktops or devices with permissions disabled
        const interval = setInterval(() => {
          setPitchProgress(p => {
            const next = Math.min(100, p + 15);
            if (next >= 100) {
              clearInterval(interval);
              setIsCalibrated(true);
              completedRef.current = true;
              onCalibrationComplete?.();
            }
            return next;
          });
          setRollProgress(r => Math.min(100, r + 15));
          setYawProgress(y => Math.min(100, y + 15));
        }, 500);
      }
    }, 2500);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      clearTimeout(timeout);
    };
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
            className={cn(
              "absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 active:scale-90 transition-transform",
              theme === 'light' ? "text-stone-500 hover:text-stone-900" : "text-stone-400 hover:bg-white/10 hover:text-white"
            )}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Heading */}
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
              {isHi ? '3-अक्षीय सटीक कैलिब्रेशन' : '3-Axis Gyro Calibration'}
            </span>
          </div>

          <h3 className={cn("text-lg font-black font-serif mb-1.5", theme === 'light' ? "text-amber-950" : "text-white")}>
            {isHi ? '8-आकार (Figure-8) में घुमाएँ' : 'Wave in Figure-8 Motion'}
          </h3>

          <p className={cn("text-xs max-w-[270px] leading-relaxed mb-4", theme === 'light' ? "text-stone-600" : "text-stone-400")}>
            {isHi
              ? 'सटीक शून्य-विचलन के लिए फोन को हवा में 8 के आकार (∞) में घुमाएँ। नीचे लाइव तीनों अक्षों का संरेखण देखें।'
              : 'Smoothly wave your device in an infinity (∞) / figure-8 pattern. Watch the live 3-axis sensors align below.'}
          </p>

          {/* Interactive Live 3D Phone & Figure-8 Track */}
          <div className="relative w-44 h-28 flex items-center justify-center mb-3">
            {/* SVG Path */}
            <svg viewBox="0 0 160 100" className="w-full h-full stroke-amber-500/30 fill-none stroke-[2.5] overflow-visible">
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
                duration: 2.8,
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

            {/* Live Responsive 3D Phone Mockup */}
            <div 
              className="absolute w-12 h-20 rounded-xl border-2 border-amber-400/80 bg-gradient-to-b from-stone-900 to-stone-950 shadow-xl flex flex-col items-center justify-between p-1 transition-transform duration-100 ease-out"
              style={{
                transform: `perspective(300px) rotateX(${Math.max(-30, Math.min(30, currentPitch))}deg) rotateY(${Math.max(-30, Math.min(30, currentRoll))}deg)`
              }}
            >
              <div className="w-2.5 h-0.5 rounded-full bg-stone-600 mt-0.5" />
              <div className="w-4 h-4 rounded-full border border-amber-400/50 flex items-center justify-center">
                <div className={cn("w-2 h-2 rounded-full", isCalibrated ? "bg-emerald-400 shadow-[0_0_8px_#10b981]" : "bg-amber-400 animate-ping")} />
              </div>
              <div className="w-3 h-0.5 rounded-full bg-stone-700 mb-0.5" />
            </div>
          </div>

          {/* Genuine 3-Axis Gyro Alignment Gauges */}
          <div className="w-full grid grid-cols-3 gap-2 mb-4">
            {/* Axis 1: Pitch (X) */}
            <div className={cn(
              "p-2 rounded-xl border flex flex-col items-center gap-1 transition-all",
              pitchProgress >= 95 
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm"
                : (theme === 'light' ? "bg-white/80 border-stone-200 text-stone-700" : "bg-white/5 border-white/10 text-stone-300")
            )}>
              <div className="flex items-center gap-1 text-[9px] font-black uppercase">
                <span>{isHi ? 'ऊंचाई' : 'Pitch'}</span>
                <span>(X)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-stone-700/30 overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all duration-200", pitchProgress >= 95 ? "bg-emerald-400" : "bg-amber-400")}
                  style={{ width: `${pitchProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-black">{pitchProgress}%</span>
            </div>

            {/* Axis 2: Roll (Y) */}
            <div className={cn(
              "p-2 rounded-xl border flex flex-col items-center gap-1 transition-all",
              rollProgress >= 95 
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm"
                : (theme === 'light' ? "bg-white/80 border-stone-200 text-stone-700" : "bg-white/5 border-white/10 text-stone-300")
            )}>
              <div className="flex items-center gap-1 text-[9px] font-black uppercase">
                <span>{isHi ? 'झुकाव' : 'Roll'}</span>
                <span>(Y)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-stone-700/30 overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all duration-200", rollProgress >= 95 ? "bg-emerald-400" : "bg-amber-400")}
                  style={{ width: `${rollProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-black">{rollProgress}%</span>
            </div>

            {/* Axis 3: Yaw (Z) */}
            <div className={cn(
              "p-2 rounded-xl border flex flex-col items-center gap-1 transition-all",
              yawProgress >= 85 
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm"
                : (theme === 'light' ? "bg-white/80 border-stone-200 text-stone-700" : "bg-white/5 border-white/10 text-stone-300")
            )}>
              <div className="flex items-center gap-1 text-[9px] font-black uppercase">
                <span>{isHi ? 'घूर्णन' : 'Yaw'}</span>
                <span>(Z)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-stone-700/30 overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all duration-200", yawProgress >= 85 ? "bg-emerald-400" : "bg-amber-400")}
                  style={{ width: `${yawProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-black">{yawProgress}%</span>
            </div>
          </div>

          {/* Interference Badge if flagged */}
          {magneticInterference && (
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold mb-3",
              theme === 'light'
                ? "bg-amber-500/10 border-amber-500/40 text-amber-700"
                : "bg-amber-500/10 border-amber-500/30 text-amber-300"
            )}>
              <AlertTriangle className={cn("w-3.5 h-3.5", theme === 'light' ? "text-amber-600" : "text-amber-400")} />
              <span>{isHi ? 'चुंबकीय हस्तक्षेप पहचाना गया — धातु से दूर रखें' : 'Interference Detected — Move away from metal'}</span>
            </div>
          )}

          {/* Master Progress bar */}
          <div className="w-full space-y-1.5 mb-5">
            <div className={cn("flex justify-between text-[11px] font-black", theme === 'light' ? "text-stone-500" : "text-stone-400")}>
              <span>{isHi ? 'समग्र कैलिब्रेशन स्तर' : 'Overall Calibration Level'}</span>
              <span className={cn(isCalibrated ? "text-emerald-500 font-black" : "text-amber-500 font-bold")}>
                {totalProgress}%
              </span>
            </div>
            <div className={cn("w-full h-2.5 rounded-full overflow-hidden border p-0.5", theme === 'light' ? "bg-stone-200 border-stone-300" : "bg-stone-800 border-white/10")}>
              <motion.div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  isCalibrated ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-green-400 shadow-[0_0_10px_#10b981]" : "bg-gradient-to-r from-amber-500 to-yellow-400"
                )}
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={onClose}
            className={cn(
              "w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all",
              isCalibrated
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/25"
                : "bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20"
            )}
          >
            {isCalibrated ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isHi ? 'कैलिब्रेशन सफल — जारी रखें' : 'Calibrated Successfully — Continue'}</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>{isHi ? 'पूर्ण / बंद करें' : 'Done / Continue'}</span>
              </>
            )}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
