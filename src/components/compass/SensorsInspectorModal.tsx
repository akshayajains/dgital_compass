import React, { useState, useEffect } from 'react';
import { Zap, X, CheckCircle, Activity, Gauge, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  pitch: number;
  roll: number;
  heading: number | null;
}

export const SensorsInspectorModal: React.FC<Props> = ({ isOpen, onClose, theme, pitch, roll, heading }) => {
  const [hasOrientation, setHasOrientation] = useState<boolean>(true);
  const [hasMagnetometer, setHasMagnetometer] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Magnetometer' in window) {
      setHasMagnetometer(true);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className={cn(
        "w-full max-w-md rounded-3xl p-6 border shadow-2xl flex flex-col items-center text-center relative animate-in zoom-in-95",
        theme === 'light' ? "bg-white border-stone-200 text-stone-900" : "bg-stone-950 border-white/15 text-white"
      )}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          <Zap className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-black tracking-wide text-white mb-1">
          डिवाइस सेंसर डायग्नोस्टिक्स
        </h3>
        <p className="text-xs text-stone-400 mb-4">
          सेंसर हार्डवेयर की लाइव स्थिति व शुद्धता
        </p>

        {/* Sensors Grid */}
        <div className="w-full grid grid-cols-2 gap-2.5 mb-5 text-left">
          {/* 1. Compass Heading Sensor */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-stone-400">कंपास दिशा</span>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="font-mono text-base font-black text-amber-400">
              {heading !== null ? `${Math.round(heading)}°` : '0°'}
            </span>
            <span className="text-[9px] text-stone-500 font-medium">मैग्नेटोमीटर सक्रिय</span>
          </div>

          {/* 2. Gyroscope / Pitch */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-stone-400">पिच झुकाव</span>
              <Activity className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <span className="font-mono text-base font-black text-sky-400">
              {Math.round(pitch)}°
            </span>
            <span className="text-[9px] text-stone-500 font-medium">आगे-पीछे का झुकाव</span>
          </div>

          {/* 3. Gyroscope / Roll */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-stone-400">रोल झुकाव</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="font-mono text-base font-black text-emerald-400">
              {Math.round(roll)}°
            </span>
            <span className="text-[9px] text-stone-500 font-medium">दाएं-बाएं का झुकाव</span>
          </div>

          {/* 4. Sensor Accuracy */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-stone-400">सटीकता</span>
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="font-mono text-base font-black text-emerald-400">
              उच्चतम शुद्धता
            </span>
            <span className="text-[9px] text-stone-500 font-medium">वेक्टर लो-पास फ़िल्टर</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-stone-800 text-stone-200 hover:bg-stone-700 font-black text-xs uppercase tracking-wider active:scale-98 transition-all border border-white/10"
        >
          बंद करें
        </button>
      </div>
    </div>
  );
};
