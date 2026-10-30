import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, RotateCcw, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface CalibrationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  theme: string;
  heading?: number | null;
  pitch?: number;
  roll?: number;
  magneticInterference?: boolean;
  onCalibrationComplete?: () => void;
}

const CX = 125;
const CY = 125;
const RADIUS = 100;
const VIEWBOX_SIZE = 250;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TOTAL_SEGMENTS = 36;
const COMPLETE_THRESHOLD = 85;

export const CalibrationGuideModal: React.FC<CalibrationGuideModalProps> = ({
  isOpen,
  onClose,
  language,
  theme,
  heading = null,
  pitch = 0,
  roll = 0,
  magneticInterference,
  onCalibrationComplete,
}) => {
  const isHi = language === 'hi';

  const [ballAngleDeg, setBallAngleDeg] = useState<number>(0);
  const [visitedSegments, setVisitedSegments] = useState<Set<number>>(new Set());
  const [progress, setProgress] = useState<number>(0);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);

  const completedRef = useRef<boolean>(false);
  const hasSensorRef = useRef<boolean>(false);
  const visitedRef = useRef<Set<number>>(new Set());

  const angleRad = (ballAngleDeg * Math.PI) / 180;
  const ballX = CX + Math.sin(angleRad) * RADIUS;
  const ballY = CY - Math.cos(angleRad) * RADIUS;

  // Highlight circle — static at top (0°) as a starting guide
  const highlightX = CX;
  const highlightY = CY - RADIUS;

  const progressOffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  const ingestSample = useCallback(
    (beta: number, gamma: number) => {
      hasSensorRef.current = true;
      const rad = Math.atan2(gamma, -beta);
      const deg = ((rad * 180) / Math.PI + 360) % 360;
      setBallAngleDeg(deg);

      const seg = Math.floor(deg / 10) % TOTAL_SEGMENTS;
      if (!visitedRef.current.has(seg)) {
        const next = new Set(visitedRef.current);
        next.add(seg);
        visitedRef.current = next;
        setVisitedSegments(new Set(next));

        const pct = Math.round((next.size / TOTAL_SEGMENTS) * 100);
        setProgress(pct);

        if (!completedRef.current && pct >= COMPLETE_THRESHOLD) {
          completedRef.current = true;
          setIsCalibrated(true);
          try {
            Haptics.impact({ style: ImpactStyle.Heavy });
          } catch (e) {
            console.error('Calibration haptic feedback failed:', e);
          }
          onCalibrationComplete?.();
        }
      }
    },
    [onCalibrationComplete]
  );

  // Drive from native sensor props (Android/Capacitor)
  useEffect(() => {
    if (!isOpen) return;
    if (heading !== null || pitch !== 0 || roll !== 0) {
      ingestSample(pitch, roll);
    }
  }, [isOpen, heading, pitch, roll, ingestSample]);

  // Reset on close; add deviceorientation listener + desktop simulation fallback
  useEffect(() => {
    if (!isOpen) {
      setBallAngleDeg(0);
      setVisitedSegments(new Set());
      setProgress(0);
      setIsCalibrated(false);
      completedRef.current = false;
      hasSensorRef.current = false;
      visitedRef.current = new Set();
      return;
    }

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      ingestSample(e.beta, e.gamma);
    };
    window.addEventListener('deviceorientation', handleOrientation);

    let simInterval: ReturnType<typeof setInterval> | null = null;
    let simAngle = 0;
    const timeout = setTimeout(() => {
      if (!hasSensorRef.current && !completedRef.current) {
        simInterval = setInterval(() => {
          if (completedRef.current) {
            if (simInterval) clearInterval(simInterval);
            return;
          }
          simAngle = (simAngle + 8) % 360;
          const rad = (simAngle * Math.PI) / 180;
          const simPitch = -Math.cos(rad) * 20;
          const simRoll = Math.sin(rad) * 20;
          ingestSample(simPitch, simRoll);
        }, 100);
      }
    }, 2500);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      clearTimeout(timeout);
      if (simInterval) clearInterval(simInterval);
    };
  }, [isOpen, ingestSample]);

  if (!isOpen) return null;

  const isLight = theme === 'light';
  const palette = {
    card: isLight
      ? 'bg-gradient-to-b from-amber-50/95 to-amber-100/90 border-amber-500/30 text-amber-950'
      : 'bg-gradient-to-b from-[#1c1917]/95 via-[#181512]/95 to-black/95 border-amber-500/20 text-amber-100',
    closeBtn: isLight
      ? 'text-stone-500 hover:text-stone-900'
      : 'text-stone-300 hover:bg-white/10 hover:text-white',
    subText: isLight ? 'text-stone-500' : 'text-stone-300',
    trackCircle: isLight ? '#d97706' : '#92400e',
    progressRing: isCalibrated ? '#10b981' : '#f59e0b',
    interfereBg: isLight
      ? 'bg-amber-500/10 border-amber-500/40 text-amber-700'
      : 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    interfereIcon: isLight ? 'text-amber-600' : 'text-amber-400',
    centerBg: isLight ? '#fef3c7' : '#1c1917',
    actionBtn: isCalibrated
      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/25'
      : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20',
  };

  const coveredPct = Math.round((visitedSegments.size / TOTAL_SEGMENTS) * 100);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className={cn(
            'w-full max-w-sm rounded-[2rem] border p-6 shadow-2xl relative overflow-hidden flex flex-col items-center text-center',
            palette.card
          )}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className={cn(
              'absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 active:scale-90 transition-transform',
              palette.closeBtn
            )}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Heading badge */}
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="text-[12px] font-black uppercase tracking-[0.2em] text-amber-500">
              {isHi ? 'कम्पास कैलिब्रेशन' : 'Compass Calibration'}
            </span>
          </div>

          <h3
            className={cn(
              'text-lg font-black font-serif mb-1.5',
              isLight ? 'text-amber-950' : 'text-white'
            )}
          >
            {isHi ? 'गेंद को घेरे में घुमाएँ' : 'Roll the Ball Around the Circle'}
          </h3>

          <p className={cn('text-xs max-w-[270px] leading-relaxed mb-4', palette.subText)}>
            {isHi
              ? 'स्क्रीन को झुकाएं ताकि लाल गेंद पूरे वृत्त पर घूमे।'
              : 'Tilt the screen to roll the ball around the circle.'}
          </p>

          {/* Rolling Ball Circle Calibration */}
          <div className="relative mb-5" style={{ width: 200, height: 210 }}>
            <svg
              viewBox={'0 0 ' + VIEWBOX_SIZE + ' ' + VIEWBOX_SIZE}
              width={200}
              height={200}
              style={{ overflow: 'visible' }}
            >
              {/* Dashed track circle */}
              <circle
                cx={CX}
                cy={CY}
                r={RADIUS}
                fill="none"
                stroke={palette.trackCircle}
                strokeWidth={2.5}
                strokeDasharray="6 4"
                opacity={0.4}
              />

              {/* Progress arc ring */}
              <circle
                cx={CX}
                cy={CY}
                r={RADIUS}
                fill="none"
                stroke={palette.progressRing}
                strokeWidth={5}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
                transform={'rotate(-90 ' + CX + ' ' + CY + ')'}
                style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.4s ease' }}
              />

              {/* Highlighted circle — static at top as starting guide */}
              <circle
                cx={highlightX}
                cy={highlightY}
                r={14}
                fill="none"
                stroke={palette.progressRing}
                strokeWidth={3}
                opacity={0.85}
              />
              <circle
                cx={highlightX}
                cy={highlightY}
                r={18}
                fill="none"
                stroke={palette.progressRing}
                strokeWidth={1.5}
                opacity={0.35}
              />

              {/* Center icon */}
              <circle cx={CX} cy={CY} r={18} fill={palette.centerBg} />
              <text
                x={CX}
                y={CY + 6}
                textAnchor="middle"
                fontSize={16}
                fill={isCalibrated ? '#10b981' : '#f59e0b'}
              >
                {isCalibrated ? '✓' : '⌖'}
              </text>

              {/* Ball glow filter */}
              <defs>
                <filter id="ballGlow" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Rolling ball */}
              <circle
                cx={ballX}
                cy={ballY}
                r={10}
                fill={isCalibrated ? '#10b981' : '#ef4444'}
                filter="url(#ballGlow)"
                style={{ transition: 'cx 0.08s linear, cy 0.08s linear, fill 0.4s ease' }}
              />
              {/* Ball shine */}
              <circle
                cx={ballX - 3}
                cy={ballY - 3}
                r={3}
                fill="rgba(255,255,255,0.45)"
                style={{ transition: 'cx 0.08s linear, cy 0.08s linear' }}
              />
            </svg>

            {/* Progress % label */}
            <div
              className={cn(
                'absolute left-1/2 -translate-x-1/2 text-xs font-black tabular-nums',
                isCalibrated ? 'text-emerald-500' : 'text-amber-500'
              )}
              style={{ bottom: 0 }}
            >
              {progress}%
            </div>
          </div>

          {/* Interference Badge */}
          {magneticInterference && (
            <div
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full border text-[12px] font-bold mb-3',
                palette.interfereBg
              )}
            >
              <AlertTriangle className={cn('w-3.5 h-3.5', palette.interfereIcon)} />
              <span>
                {isHi
                  ? 'चुंबकीय हस्तक्षेप पहचाना गया — धातु से दूर रखें'
                  : 'Interference Detected — Move away from metal'}
              </span>
            </div>
          )}

          {/* Status text */}
          <p
            className={cn(
              'text-[11px] font-bold mb-4 transition-all',
              isCalibrated ? 'text-emerald-500' : palette.subText
            )}
          >
            {isCalibrated
              ? (isHi ? '✓ कैलिब्रेशन पूर्ण!' : '✓ Calibration Complete!')
              : (isHi ? (coveredPct + '% क्षेत्र कवर हुआ') : (coveredPct + '% of circle covered'))}
          </p>

          {/* Action button */}
          <button
            onClick={onClose}
            className={cn(
              'w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all',
              palette.actionBtn
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

export default CalibrationGuideModal;
