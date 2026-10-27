import { useEffect, useRef } from 'react';

/**
 * Consolidated Wake Lock hook — replaces the TWO duplicate wake lock useEffects in CompassView.
 * Requests screen wake lock when enabled, releases on unmount or when disabled.
 */
export function useWakeLock(enabled: boolean = true) {
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    let wakeLock: any = null;

    const request = async () => {
      try {
        if ('wakeLock' in navigator && (navigator as any).wakeLock) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          wakeLockRef.current = wakeLock;
        }
      } catch (e) {
        console.error('Wake Lock request failed:', e);
      }
    };

    const release = async () => {
      if (wakeLock && typeof wakeLock.release === 'function') {
        try { await wakeLock.release(); } catch (e) { console.error('Wake Lock release failed:', e); }
      }
      wakeLockRef.current = null;
    };

    if (enabled) {
      request();
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && enabled) {
        request();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      release();
    };
  }, [enabled]);
}
