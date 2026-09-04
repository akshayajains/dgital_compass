import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Sparkles, AlertTriangle, CheckCircle2, RefreshCw, Zap, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDevtaPadaAtDegree } from '@/data/devtaData';
import { toast } from 'sonner';

interface ARVastuScannerProps {
  isOpen: boolean;
  onClose: () => void;
  heading: number | null;
  directionName: string;
  selectedRoom: string;
  language: string;
  themeColor: string;
  onHaptic: () => void;
}

const ROOM_VASTU_DATA: Record<string, { label: string; labelHi: string; goodZones: string[]; badZones: string[]; remedy: string; remedyHi: string }> = {
  entrance: {
    label: 'Main Door / Entrance',
    labelHi: 'मुख्य द्वार',
    goodZones: ['N', 'NE', 'E', 'NW'],
    badZones: ['S', 'SW', 'SE'],
    remedy: 'Place a brass Swastika or a pair of marigold garlands outside.',
    remedyHi: 'प्रवेश द्वार पर पीतल का स्वस्तिक अथवा तांबे का पिरामिड लगाएं।'
  },
  pooja: {
    label: 'Pooja / Mandir',
    labelHi: 'पूजा घर / मंदिर',
    goodZones: ['NE', 'E', 'N'],
    badZones: ['S', 'SW', 'NW', 'SE'],
    remedy: 'Keep the idols facing East or West, ensure a brass Diya is lit daily in Ishanya.',
    remedyHi: 'मंदिर में शुद्ध जल का कलश रखें और दीप ईशान कोण में प्रज्वलित करें।'
  },
  kitchen: {
    label: 'Kitchen / Stove',
    labelHi: 'रसोईघर / चूल्हा',
    goodZones: ['SE', 'NW'],
    badZones: ['NE', 'SW', 'N'],
    remedy: 'Place a natural green marble stone or copper plate beneath the stove.',
    remedyHi: 'चूल्हे के नीचे प्राकृतिक हरा मार्बल या तांबे की प्लेट रखें।'
  },
  master_bedroom: {
    label: 'Master Bedroom',
    labelHi: 'मास्टर बेडरूम',
    goodZones: ['SW', 'S', 'W'],
    badZones: ['NE', 'SE', 'NW'],
    remedy: 'Sleep with head towards South or East. Avoid mirrors facing the bed.',
    remedyHi: 'सिर दक्षिण अथवा पूर्व दिशा में रखकर सोएं। बिस्तर के सामने दर्पण न रखें।'
  },
  cash: {
    label: 'Cash Locker / Wealth',
    labelHi: 'तिजोरी / धन स्थान',
    goodZones: ['N', 'NE', 'E'],
    badZones: ['S', 'SW', 'SE'],
    remedy: 'Face the locker door towards North (Kubera direction) with a silver coin inside.',
    remedyHi: 'तिजोरी का मुख उत्तर की ओर रखें और अंदर चांदी का सिक्का रखें।'
  },
  study: {
    label: 'Study / Library',
    labelHi: 'अध्ययन कक्ष',
    goodZones: ['NE', 'E', 'W', 'N'],
    badZones: ['S', 'SW'],
    remedy: 'Sit facing East or North while studying with a crystal pyramid on table.',
    remedyHi: 'अध्ययन करते समय मुख उत्तर अथवा पूर्व की ओर रखें।'
  },
  bathroom: {
    label: 'Toilet / Bathroom',
    labelHi: 'शौचालय / बाथरूम',
    goodZones: ['NW', 'W', 'S'],
    badZones: ['NE', 'SW', 'SE'],
    remedy: 'Keep a bowl of coarse sea salt inside and replace weekly.',
    remedyHi: 'बाथरूम में समुद्री नमक का कटोरा रखें और साप्ताहिक बदलें।'
  }
};

export const ARVastuScanner = ({
  isOpen,
  onClose,
  heading,
  directionName,
  selectedRoom,
  language,
  themeColor,
  onHaptic,
}: ARVastuScannerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const curDeg = heading !== null ? heading : 0;
  const currentDevta = getDevtaPadaAtDegree(curDeg);
  const roomConfig = ROOM_VASTU_DATA[selectedRoom] || ROOM_VASTU_DATA.entrance;

  // Determine current cardinal sector (N, NE, E, SE, S, SW, W, NW)
  const getSectorCode = (deg: number): string => {
    const d = ((deg % 360) + 360) % 360;
    if (d >= 337.5 || d < 22.5) return 'N';
    if (d >= 22.5 && d < 67.5) return 'NE';
    if (d >= 67.5 && d < 112.5) return 'E';
    if (d >= 112.5 && d < 157.5) return 'SE';
    if (d >= 157.5 && d < 202.5) return 'S';
    if (d >= 202.5 && d < 247.5) return 'SW';
    if (d >= 247.5 && d < 292.5) return 'W';
    return 'NW';
  };

  const sectorCode = getSectorCode(curDeg);
  const isAuspicious = roomConfig.goodZones.includes(sectorCode);
  const isSevereDosha = roomConfig.badZones.includes(sectorCode);

  // Start Camera
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    let active = true;
    setCameraError(null);

    const startStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });

        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.warn('AR Camera error:', err);
        setCameraError(
          err?.name === 'NotAllowedError'
            ? (language === 'hi' ? 'कैमरा अनुमति आवश्यक है। सेटिंग्स में जाकर अनुमति दें।' : 'Camera permission denied. Enable in app settings.')
            : (language === 'hi' ? 'कैमरा शुरू करने में असमर्थ' : 'Camera stream unavailable.')
        );
      }
    };

    startStream();

    return () => {
      active = false;
      stopCamera();
    };
  }, [isOpen, language]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
      streamRef.current = null;
    }
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && (track.getCapabilities as any)?.().torch) {
      try {
        await (track.applyConstraints as any)({
          advanced: [{ torch: !torchOn }]
        });
        setTorchOn(!torchOn);
        onHaptic();
      } catch (e) {
        toast.info('Torch not supported on this lens');
      }
    } else {
      toast.info('Flashlight not supported on this device lens');
    }
  };

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    onHaptic();
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Draw watermark and HUD telemetry
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(20, canvas.height - 120, canvas.width - 40, 100);
      
      ctx.fillStyle = '#DAA520';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`JAIN COMPASS AR VASTU AUDIT - ${Math.round(curDeg)}° ${directionName}`, 40, canvas.height - 80);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '18px sans-serif';
      ctx.fillText(`Zone: ${sectorCode} | Pada: ${currentDevta.name} (${currentDevta.id}) | Room: ${roomConfig.label}`, 40, canvas.height - 45);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
      toast.success(language === 'hi' ? 'फोटो सहेजी गई!' : 'AR Audit Photo captured!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] bg-black flex flex-col justify-between overflow-hidden">
      {/* Live Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Top HUD Controls & Compass Tape */}
      <div className="relative z-20 pt-6 px-4 flex flex-col items-center bg-gradient-to-b from-black/80 via-black/40 to-transparent pb-6">
        <div className="w-full flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white drop-shadow">
              {language === 'hi' ? 'लाइव AR वास्तु स्कैनर' : 'LIVE AR VASTU SCANNER'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md active:scale-90 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Floating Compass Tape (Degrees Ribbon) */}
        <div className="w-full max-w-sm h-12 bg-black/50 backdrop-blur-md rounded-2xl border border-white/20 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-y-0 w-1 bg-amber-400 z-10" />
          <div
            className="flex items-center gap-8 text-white font-mono text-xs font-bold transition-transform duration-100 ease-out"
            style={{ transform: `translateX(${-((curDeg % 360) * 4)}px)` }}
          >
            {Array.from({ length: 72 }).map((_, i) => {
              const deg = i * 10;
              const isCard = deg % 90 === 0;
              return (
                <div key={i} className="flex flex-col items-center shrink-0 w-8">
                  <span className={cn("text-[10px]", isCard ? "text-amber-400 font-black text-xs" : "text-stone-300")}>
                    {isCard ? (deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : 'W') : `${deg}°`}
                  </span>
                  <div className={cn("w-0.5 bg-white/40", isCard ? "h-3 bg-amber-400" : "h-1.5")} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Center Holographic Reticle & Vastu Status */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center pointer-events-none p-4">
        {/* Holographic Target Rings */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          <div className={cn(
            "absolute inset-0 rounded-full border-2 border-dashed animate-[spin_20s_linear_infinite] opacity-60",
            isAuspicious ? "border-emerald-400" : isSevereDosha ? "border-red-500" : "border-amber-400"
          )} />
          
          <div className={cn(
            "w-48 h-48 rounded-full border border-white/30 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-3 shadow-2xl transition-colors duration-500",
            isAuspicious ? "bg-emerald-950/30 border-emerald-400/50" : isSevereDosha ? "bg-red-950/30 border-red-500/50" : "bg-amber-950/30 border-amber-400/50"
          )}>
            <span className="text-3xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              {Math.round(curDeg)}°
            </span>
            <span className="text-sm font-black uppercase tracking-widest mt-0.5" style={{ color: themeColor }}>
              {directionName}
            </span>

            {/* Devta Pada Badge */}
            <div className="mt-2 px-2.5 py-0.5 rounded-full bg-black/60 border border-white/20 text-[10px] font-black text-amber-300">
              {currentDevta.name} ({currentDevta.id})
            </div>
          </div>
        </div>

        {/* Floating Zone & Dosha Diagnosis Pill */}
        <div className="mt-4 w-full max-w-xs px-4 py-3 rounded-2xl bg-black/70 backdrop-blur-md border border-white/20 text-center shadow-xl">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            {isAuspicious ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className={cn("w-4 h-4 shrink-0", isSevereDosha ? "text-red-400" : "text-amber-400")} />
            )}
            <span className={cn(
              "text-xs font-black uppercase tracking-wider",
              isAuspicious ? "text-emerald-400" : isSevereDosha ? "text-red-400" : "text-amber-400"
            )}>
              {roomConfig.label}: {isAuspicious ? (language === 'hi' ? 'शुभ दिशा' : 'Auspicious Zone') : (language === 'hi' ? 'वास्तु दोष' : 'Dosha Detected')}
            </span>
          </div>

          <p className="text-[11px] text-stone-300 leading-snug">
            {language === 'hi' ? roomConfig.remedyHi : roomConfig.remedy}
          </p>
        </div>
      </div>

      {/* Bottom Action Controls & Snapshot */}
      <div className="relative z-20 pb-8 px-6 flex items-center justify-between bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-6">
        <div className="text-left">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
            {language === 'hi' ? 'सक्रिय कमरा' : 'Target Room'}
          </span>
          <span className="text-xs font-black text-white">
            {language === 'hi' ? roomConfig.labelHi : roomConfig.label}
          </span>
        </div>

        {/* Shutter Button */}
        <button
          onClick={captureSnapshot}
          className="w-16 h-16 rounded-full bg-white/20 border-4 border-white flex items-center justify-center active:scale-90 transition-transform shadow-2xl backdrop-blur-md"
        >
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center">
            <Camera className="w-5 h-5 text-stone-950" />
          </div>
        </button>

        {/* Torch / Quick Tools (moved here from top) */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={toggleTorch}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-95",
              torchOn ? "bg-amber-500 text-stone-950 border-amber-400" : "bg-black/40 text-white border-white/20"
            )}
            title={language === 'hi' ? 'टॉर्च' : 'Toggle flashlight'}
          >
            <Zap className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setCapturedImage(null);
              stopCamera();
              onClose();
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center border bg-black/40 text-white border-white/20 active:scale-95"
            title={language === 'hi' ? 'बंद करें' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
            {language === 'hi' ? 'तत्व' : 'Element'}
          </span>
          <span className="text-xs font-black text-amber-300">
            {currentDevta.element}
          </span>
        </div>
      </div>

      {/* Preview Modal for Captured Photo */}
      {capturedImage && (
        <div className="fixed inset-0 z-[140] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative max-w-sm w-full bg-stone-900 rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
            <img src={capturedImage} alt="AR Snapshot" className="w-full h-auto object-cover" />
            <div className="p-4 flex gap-3">
              <a
                href={capturedImage}
                download={`Vastu_AR_${Date.now()}.jpg`}
                className="flex-1 py-3 rounded-2xl bg-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Download className="w-4 h-4" />
                <span>{language === 'hi' ? 'गैलरी में सहेजें' : 'Save Image'}</span>
              </a>
              <button
                onClick={() => setCapturedImage(null)}
                className="py-3 px-5 rounded-2xl bg-stone-800 text-white font-bold text-xs uppercase active:scale-95 transition-transform"
              >
                {language === 'hi' ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Error Banner */}
      {cameraError && (
        <div className="absolute top-20 inset-x-4 mx-auto max-w-sm p-4 rounded-2xl bg-red-950/90 border border-red-500/50 text-red-200 text-xs font-bold text-center backdrop-blur-md z-30">
          {cameraError}
        </div>
      )}
    </div>
  );
};
