import { useCallback, useRef, useEffect } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Haptic feedback hook with Chromium User Activation guard.
 * Prevents "[Intervention] Blocked call to navigator.vibrate" errors.
 */
export function useHaptics(initiallyEnabled: boolean = true) {
  const hapticEnabledRef = useRef(initiallyEnabled);
  const userInteractedRef = useRef<boolean>(false);

  const setEnabled = useCallback((enabled: boolean) => {
    hapticEnabledRef.current = enabled;
  }, []);

  // Mark user interaction for Chromium guard
  useEffect(() => {
    const markInteracted = () => {
      userInteractedRef.current = true;
    };
    window.addEventListener('pointerdown', markInteracted, { passive: true });
    window.addEventListener('touchstart', markInteracted, { passive: true });
    window.addEventListener('keydown', markInteracted, { passive: true });
    window.addEventListener('click', markInteracted, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', markInteracted);
      window.removeEventListener('touchstart', markInteracted);
      window.removeEventListener('keydown', markInteracted);
      window.removeEventListener('click', markInteracted);
    };
  }, []);

  const trigger = useCallback(async (style: ImpactStyle = ImpactStyle.Light) => {
    if (!hapticEnabledRef.current) return;
    const hasActivation = typeof navigator !== 'undefined' && (
      Boolean((navigator as any).userActivation?.hasBeenActive) ||
      userInteractedRef.current
    );
    if (!hasActivation) return;

    try {
      await Haptics.impact({ style });
    } catch {
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(style === ImpactStyle.Medium ? 50 : 25);
        }
      } catch (e) {
        console.error('Haptic vibration failed:', e);
      }
    }
  }, []);

  return { trigger, setEnabled };
}
