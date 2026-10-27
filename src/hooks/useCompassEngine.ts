import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Manages device orientation sensors, heading smoothing, and magnetic declination.
 * Extracted from CompassView to separate sensor logic from UI rendering.
 */
export interface CompassEngineState {
  heading: number | null;
  pitch: number;
  roll: number;
  smoothHeading: number;
  renderedHeading: number;
  magneticFlux: number | null;
  isMagneticInterference: boolean;
  compassAccuracy: number | null;
  declination: number;
}

export interface CompassEngineOptions {
  onHeadingChange?: (heading: number) => void;
  initialDeclination?: number;
}

export function useCompassEngine(options: CompassEngineOptions = {}) {
  const { onHeadingChange, initialDeclination = -0.2 } = options;

  const [heading, setHeading] = useState<number | null>(null);
  const [pitch, setPitch] = useState<number>(0);
  const [roll, setRoll] = useState<number>(0);
  const [magneticFlux, setMagneticFlux] = useState<number | null>(null);
  const [isMagneticInterference, setIsMagneticInterference] = useState<boolean>(false);
  const [compassAccuracy, setCompassAccuracy] = useState<number | null>(null);
  const [declination, setDeclination] = useState<number>(initialDeclination);

  const smoothedVectorRef = useRef<{ x: number; y: number } | null>(null);
  const smoothedPitchRef = useRef<number>(0);
  const smoothedRollRef = useRef<number>(0);
  const usingAbsoluteRef = useRef<boolean>(false);
  const usingNativeSensorRef = useRef<boolean>(false);

  const handleOrientationRef = useRef<((event: any, isAbsolute: boolean) => void) | null>(null);
  const handleNativeCompassRef = useRef<((h: number, p: number, r: number, flux: number, acc: number) => void) | null>(null);

  // Smooth heading animation
  const [smoothHeading, setSmoothHeading] = useState<number>(0);
  const smoothHeadingRef = useRef<number>(0);
  const targetHeadingRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  const applySmoothedHeading = useCallback((rawHeading: number) => {
    const compassHeading = ((rawHeading % 360) + 360) % 360;
    const targetRad = compassHeading * (Math.PI / 180);
    const targetVec = { x: Math.sin(targetRad), y: Math.cos(targetRad) };

    if (!smoothedVectorRef.current) {
      smoothedVectorRef.current = targetVec;
      setHeading(compassHeading);
    } else {
      const prevHeading = ((Math.atan2(smoothedVectorRef.current.x, smoothedVectorRef.current.y) * (180 / Math.PI)) + 360) % 360;
      const deltaDeg = Math.abs(((compassHeading - prevHeading + 540) % 360) - 180);

      if (deltaDeg >= 0.45) {
        const factor = Math.min(0.45, Math.max(0.16, deltaDeg * 0.05));
        smoothedVectorRef.current = {
          x: smoothedVectorRef.current.x + (targetVec.x - smoothedVectorRef.current.x) * factor,
          y: smoothedVectorRef.current.y + (targetVec.y - smoothedVectorRef.current.y) * factor
        };

        const smoothedRad = Math.atan2(smoothedVectorRef.current.x, smoothedVectorRef.current.y);
        const finalHeading = (smoothedRad * (180 / Math.PI) + 360) % 360;
        setHeading(finalHeading);
      }
    }
  }, []);

  // Native Android Hardware Sensor Fusion Callback
  const handleNativeCompass = useCallback((
    nativeHeading: number,
    nativePitch: number,
    nativeRoll: number,
    nativeFlux: number,
    nativeAcc: number
  ) => {
    usingNativeSensorRef.current = true;

    if (!isNaN(nativeHeading) && nativeHeading >= 0) {
      applySmoothedHeading(nativeHeading);
    }

    if (!isNaN(nativePitch)) {
      const diffBeta = Math.abs(nativePitch - smoothedPitchRef.current);
      if (diffBeta >= 0.15) {
        smoothedPitchRef.current += (nativePitch - smoothedPitchRef.current) * 0.28;
        const nextPitch = Math.abs(smoothedPitchRef.current) < 0.08 ? 0 : Math.round(smoothedPitchRef.current * 10) / 10;
        setPitch(nextPitch);
      }
    }

    if (!isNaN(nativeRoll)) {
      const diffGamma = Math.abs(nativeRoll - smoothedRollRef.current);
      if (diffGamma >= 0.15) {
        smoothedRollRef.current += (nativeRoll - smoothedRollRef.current) * 0.28;
        const nextRoll = Math.abs(smoothedRollRef.current) < 0.08 ? 0 : Math.round(smoothedRollRef.current * 10) / 10;
        setRoll(nextRoll);
      }
    }

    if (nativeFlux > 0) {
      const roundedFlux = Math.round(nativeFlux);
      setMagneticFlux(roundedFlux);
      const isAnomalousFlux = roundedFlux > 75 || roundedFlux < 20;
      const isLowAccuracy = nativeAcc >= 0 && nativeAcc <= 1;
      setIsMagneticInterference(isAnomalousFlux || isLowAccuracy);
    }

    if (nativeAcc >= 0) {
      const mappedAcc = nativeAcc === 3 ? 5 : nativeAcc === 2 ? 15 : 35;
      setCompassAccuracy(mappedAcc);
    }
  }, [applySmoothedHeading]);

  handleNativeCompassRef.current = handleNativeCompass;

  const handleOrientation = useCallback((event: any, isAbsolute: boolean) => {
    if (usingNativeSensorRef.current) return;

    const hasIOSHeading = event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null;
    const isGeomagneticAbsolute = isAbsolute || event.absolute === true;

    if (isAbsolute) {
      usingAbsoluteRef.current = true;
    }

    if (event.webkitCompassAccuracy !== undefined && event.webkitCompassAccuracy !== null) {
      setCompassAccuracy(event.webkitCompassAccuracy);
      if (event.webkitCompassAccuracy < 0 || event.webkitCompassAccuracy > 25) {
        setIsMagneticInterference(true);
      } else if (magneticFlux === null) {
        setIsMagneticInterference(false);
      }
    }

    let compassHeading: number | null = null;

    if (hasIOSHeading) {
      compassHeading = event.webkitCompassHeading;
    } else if (isGeomagneticAbsolute && event.alpha !== null && event.alpha !== undefined) {
      const degToRad = Math.PI / 180;
      const alphaRad = event.alpha * degToRad;
      const betaRad = (event.beta ?? 0) * degToRad;
      const gammaRad = (event.gamma ?? 0) * degToRad;

      const cA = Math.cos(alphaRad);
      const sA = Math.sin(alphaRad);
      const cB = Math.cos(betaRad);
      const sB = Math.sin(betaRad);
      const cG = Math.cos(gammaRad);
      const sG = Math.sin(gammaRad);

      const yEast = -sA * cB;
      const yNorth = cA * cB;
      const yUp = sB;

      const negZEast = -cA * sG - sA * sB * cG;
      const negZNorth = -sA * sG + cA * sB * cG;
      const zUp = cB * cG;

      const wY = Math.max(0, zUp);
      const wZ = Math.max(0, yUp);

      let fEast: number;
      let fNorth: number;
      if (wY + wZ > 0.1) {
        fEast = wY * yEast + wZ * negZEast;
        fNorth = wY * yNorth + wZ * negZNorth;
      } else {
        fEast = yEast;
        fNorth = yNorth;
      }

      if (fEast * fEast + fNorth * fNorth > 1e-6) {
        compassHeading = ((Math.atan2(fEast, fNorth) * (180 / Math.PI)) + 360) % 360;
      } else {
        compassHeading = (360 - event.alpha + 360) % 360;
      }

      const screenAngle = (typeof window !== 'undefined' && window.screen?.orientation?.angle !== undefined)
        ? window.screen.orientation.angle
        : (typeof (window as any)?.orientation === 'number' ? (window as any).orientation : 0);

      if (screenAngle !== 0) {
        compassHeading = (compassHeading + screenAngle + 360) % 360;
      }
    }

    if (compassHeading !== null) {
      applySmoothedHeading(compassHeading);
    }

    if (!isAbsolute && usingAbsoluteRef.current) return;

    if (event.beta !== null && event.beta !== undefined) {
      const diffBeta = Math.abs(event.beta - smoothedPitchRef.current);
      if (diffBeta >= 0.15) {
        smoothedPitchRef.current += (event.beta - smoothedPitchRef.current) * 0.25;
        setPitch(Math.abs(smoothedPitchRef.current) < 0.08 ? 0 : Math.round(smoothedPitchRef.current * 10) / 10);
      }
    }
    if (event.gamma !== null && event.gamma !== undefined) {
      const diffGamma = Math.abs(event.gamma - smoothedRollRef.current);
      if (diffGamma >= 0.15) {
        smoothedRollRef.current += (event.gamma - smoothedRollRef.current) * 0.25;
        setRoll(Math.abs(smoothedRollRef.current) < 0.08 ? 0 : Math.round(smoothedRollRef.current * 10) / 10);
      }
    }
  }, [applySmoothedHeading, magneticFlux]);

  handleOrientationRef.current = handleOrientation;

  // Smooth dial rotation animation
  useEffect(() => {
    const currentHeading = heading ?? 0;
    targetHeadingRef.current = currentHeading;
    if (rafRef.current !== null) return;

    const step = () => {
      const current = smoothHeadingRef.current;
      const target = targetHeadingRef.current;
      let diff = (target - current) % 360;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      const easeFactor = 0.16;
      const next = current + diff * easeFactor;
      smoothHeadingRef.current = next;
      setSmoothHeading(Math.round(next * 10) / 10);

      if (Math.abs(diff) > 0.22) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        smoothHeadingRef.current = target;
        setSmoothHeading(Math.round(target * 10) / 10);
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [heading]);

  const renderedHeading = ((smoothHeading % 360) + 360) % 360;

  // Sensor setup
  useEffect(() => {
    let removeListener: (() => void) | null = null;

    // Register Native Android Hardware Sensor Fusion bridge
    (window as any).__onNativeCompassUpdate = (
      h: number, p: number, r: number, flux: number, acc: number
    ) => {
      handleNativeCompassRef.current?.(h, p, r, flux, acc);
    };

    const setupSensors = async () => {
      if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
        try {
          const res = await (DeviceOrientationEvent as any).requestPermission();
          if (res !== 'granted') return;
        } catch (e) {
          console.error('Device orientation permission denied:', e);
        }
      }

      const onAbsolute = (e: any) => handleOrientationRef.current?.(e, true);
      const onStandard = (e: any) => handleOrientationRef.current?.(e, false);

      window.addEventListener('deviceorientationabsolute' as any, onAbsolute, true);
      window.addEventListener('deviceorientation', onStandard, true);

      // Raw Magnetometer API
      let magSensor: any = null;
      if (typeof window !== 'undefined' && 'Magnetometer' in window) {
        try {
          magSensor = new (window as any).Magnetometer({ frequency: 10 });
          magSensor.addEventListener('reading', () => {
            if (usingNativeSensorRef.current) return;
            const { x, y, z } = magSensor;
            if (x !== undefined && y !== undefined && z !== undefined) {
              const flux = Math.round(Math.sqrt(x * x + y * y + z * z));
              setMagneticFlux(flux);
              setIsMagneticInterference(flux > 75 || (flux < 20 && flux > 0));
            }
          });
          magSensor.addEventListener('error', (e: any) => console.error('Magnetometer error:', e));
          magSensor.start();
        } catch (e) {
          console.error('Failed to start magnetometer:', e);
        }
      }

      removeListener = () => {
        window.removeEventListener('deviceorientationabsolute' as any, onAbsolute, true);
        window.removeEventListener('deviceorientation', onStandard, true);
        if (magSensor) {
          try { magSensor.stop(); } catch (e) { console.error('Failed to stop magnetometer:', e); }
        }
      };
    };

    setupSensors();
    return () => {
      delete (window as any).__onNativeCompassUpdate;
      if (removeListener) removeListener();
    };
  }, []);

  // Recenter: clear smoothed vector
  const handleRecenter = useCallback(() => {
    smoothedVectorRef.current = null;
  }, []);

  return {
    heading,
    pitch,
    roll,
    smoothHeading,
    renderedHeading,
    magneticFlux,
    isMagneticInterference,
    compassAccuracy,
    declination,
    setDeclination,
    handleRecenter,
    setPitch,
    setRoll,
  };
}
