import { useRef, useCallback, useEffect } from 'react';

/**
 * Singleton AudioContext manager — initializes once, prevents recreation on every call.
 * Extracted from CompassView to avoid AudioContext recreation on every bell sound call.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private initialized = false;

  getContext(): AudioContext | null {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch((e) => console.error('AudioContext resume failed:', e));
      }
      return this.ctx;
    }
    return null;
  }

  ensureContext(): AudioContext | null {
    if (this.initialized) return this.getContext();
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      this.ctx = new AudioContextClass();
      this.initialized = true;
      return this.ctx;
    } catch (e) {
      console.error('Failed to create AudioContext:', e);
      return null;
    }
  }

  playTick() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.018);
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.018);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.02);
  }

  playBell() {
    this.playChord([523.25, 659.25, 783.99]);
  }

  playChime() {
    this.playChord([587.33, 739.99, 880.00]);
  }

  playSingingBowl() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const harmonics = [
      { freq: 432.0, gain: 0.24, decay: 2.6, delay: 0 },
      { freq: 433.2, gain: 0.18, decay: 2.4, delay: 0.01 },
      { freq: 864.0, gain: 0.12, decay: 1.9, delay: 0.02 },
      { freq: 1296.0, gain: 0.06, decay: 1.4, delay: 0.03 },
    ];
    harmonics.forEach(h => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.frequency.value = h.freq;
      osc.type = 'sine';
      const startTime = ctx.currentTime + h.delay;
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(h.gain, startTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0005, startTime + h.decay);
      osc.start(startTime);
      osc.stop(startTime + h.decay + 0.1);
    });
  }

  private playChord(frequencies: number[]) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const startTime = ctx.currentTime + idx * 0.07;
      const duration = 1.4;
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);
    });
  }

  destroy() {
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch((e) => console.error('AudioContext close failed:', e));
    }
    this.ctx = null;
    this.initialized = false;
  }
}

const audioEngine = new AudioEngine();

/**
 * Hook for playing bell sounds, ticks, and singing bowl tones.
 * Uses a singleton AudioContext to avoid recreation.
 */
export function useAudioEngine() {
  const lastTickSoundTimeRef = useRef<number>(0);
  const lastCardinalSoundTimeRef = useRef<number>(0);
  const lastSpokenCardinalIndexRef = useRef<number>(-1);
  const lastCardinalSnapTimeRef = useRef<number>(0);
  const soundEnabledRef = useRef<boolean>(true);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    soundEnabledRef.current = enabled;
  }, []);

  const playSound = useCallback((type: 'tick' | 'bell' | 'chime' | 'singingBowl', forcePlay = false) => {
    if (!forcePlay && !soundEnabledRef.current) return;
    switch (type) {
      case 'tick':
        audioEngine.playTick();
        break;
      case 'bell':
        audioEngine.playBell();
        break;
      case 'chime':
        audioEngine.playChime();
        break;
      case 'singingBowl':
        audioEngine.playSingingBowl();
        break;
    }
  }, []);

  // Throttled tick sound for 5° crossings
  const playTickIfAllowed = useCallback(() => {
    const nowMs = Date.now();
    if (nowMs - lastTickSoundTimeRef.current >= 90) {
      lastTickSoundTimeRef.current = nowMs;
      audioEngine.playTick();
    }
  }, []);

  // Direction audio feedback with throttling
  const playDirectionSound = useCallback((octant: number) => {
    if (lastSpokenCardinalIndexRef.current === octant) return;
    const now = Date.now();
    if (now - lastCardinalSoundTimeRef.current < 900) return;

    lastSpokenCardinalIndexRef.current = octant;
    lastCardinalSoundTimeRef.current = now;

    if (octant === 0) {
      audioEngine.playSingingBowl();
    } else if (octant % 2 === 0) {
      audioEngine.playBell();
    } else {
      audioEngine.playChime();
    }
  }, []);

  // Cardinal snap haptic check
  const checkCardinalSnap = useCallback((heading: number, onSnap: () => void) => {
    const CARDINAL_ANGLES = [0, 90, 180, 270];
    const isCardinalSnap = CARDINAL_ANGLES.some(a => {
      const d = Math.abs(heading - a);
      return d <= 0.6 || Math.abs(d - 360) <= 0.6;
    });
    if (isCardinalSnap && Date.now() - lastCardinalSnapTimeRef.current > 1200) {
      lastCardinalSnapTimeRef.current = Date.now();
      onSnap();
    }
  }, []);

  useEffect(() => {
    return () => {
      audioEngine.destroy();
    };
  }, []);

  return {
    playSound,
    playTickIfAllowed,
    playDirectionSound,
    checkCardinalSnap,
    setSoundEnabled,
  };
}
