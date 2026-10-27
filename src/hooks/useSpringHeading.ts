import { useRef, useCallback, useEffect } from 'react';

/**
 * Spring physics animation hook for smooth compass dial rotation.
 * Replaces linear easing with a damped spring simulation for natural,
 * luxurious fluid-damped compass motion without nervous jitter.
 *
 * Uses a simplified Verlet integration spring model:
 * - Stiffness (k): controls how quickly the spring pulls toward target
 * - Damping: controls how quickly oscillations decay
 * - Velocity: carries momentum for overshoot effect
 */
export function useSpringHeading(target: number, stiffness = 0.12, damping = 0.75) {
  const valueRef = useRef<number>(target);
  const velocityRef = useRef<number>(0);
  const targetRef = useRef<number>(target);
  const rafRef = useRef<number | null>(null);
  const setValue = useCallback((cb: (v: number) => void) => {}, []);

  // Track the shortest angular path for circular values (0-360)
  const getShortestDiff = useCallback((current: number, target: number): number => {
    let diff = (target - current) % 360;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return diff;
  }, []);

  const animate = useCallback((onUpdate: (value: number) => void) => {
    const step = () => {
      const current = valueRef.current;
      const target = targetRef.current;
      const diff = getShortestDiff(current, target);

      // Spring force: F = k * displacement
      const force = diff * stiffness;
      
      // Update velocity with spring force and damping
      velocityRef.current = (velocityRef.current + force) * damping;

      // Update position
      const next = current + velocityRef.current;
      valueRef.current = next;

      // Normalize to 0-360
      const normalized = ((next % 360) + 360) % 360;
      onUpdate(Math.round(normalized * 10) / 10);

      // Stop animation when close enough and velocity is low
      const threshold = 0.01;
      if (Math.abs(diff) < threshold && Math.abs(velocityRef.current) < threshold) {
        valueRef.current = target;
        const finalNorm = ((target % 360) + 360) % 360;
        onUpdate(Math.round(finalNorm * 10) / 10);
        return;
      }

      rafRef.current = requestAnimationFrame(step);
    };

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(step);
    }
  }, [stiffness, damping, getShortestDiff]);

  // Update target when it changes
  useEffect(() => {
    targetRef.current = target;
    // If velocity is near zero, kickstart the animation
    if (Math.abs(velocityRef.current) < 0.05 && rafRef.current === null) {
      // Will be started on next render cycle
    }
  }, [target]);

  // Reset velocity on demand (e.g., when recentering)
  const reset = useCallback(() => {
    velocityRef.current = 0;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return { animate, reset, getValue: () => valueRef.current };
}

/**
 * Simplified spring easing function for one-off animations
 * (e.g., modal open/close, button press feedback)
 */
export function springEase(t: number, stiffness = 0.15, damping = 0.7): number {
  // Approximate damped spring response
  const omega = Math.sqrt(stiffness);
  const zeta = damping / (2 * Math.sqrt(stiffness));
  
  if (zeta < 1) {
    // Underdamped — oscillatory
    const wd = omega * Math.sqrt(1 - zeta * zeta);
    const expDecay = Math.exp(-zeta * omega * t);
    return 1 - expDecay * (Math.cos(wd * t) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * t));
  }
  
  // Critically damped or overdamped — no oscillation
  return 1 - Math.exp(-omega * t) * (1 + omega * t);
}
