import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, ZoomIn, Sun, Crosshair, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  heading: number | null;
  pitch: number;
  roll: number;
  location: { latitude: number; longitude: number } | null;
}

export const TelescopeCameraCompass: React.FC<Props> = ({
  heading,
  pitch,
  roll,
  location
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [reticleColor, setReticleColor] = useState<'cyan' | 'emerald' | 'amber' | 'crimson'>('cyan');
  const [flashOn, setFlashOn] = useState<boolean>(false);

  const displayDeg = heading !== null ? Math.round(((heading % 360) + 360) % 360) : 0;

  // Start camera stream
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    try {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      setCameraError(null);
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(err.message || 'Camera permission denied or unavailable');
      setCameraActive(false);
    }
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [facingMode]);

  // Flip camera
  const toggleFacingMode = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
  };

  // Toggle Torch if supported
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.torch) {
        try {
          await (track as any).applyConstraints({
            advanced: [{ torch: !flashOn }]
          });
          setFlashOn(!flashOn);
        } catch {
          toast.error('Flashlight not supported');
        }
      } else {
        toast.error('Torch not supported on this device');
      }
    }
  };

  // Take Snapshot with burned-in compass HUD
  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw camera image
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw HUD overlay
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width * 0.1, canvas.height * 0.1, canvas.width * 0.8, canvas.height * 0.8);

    // Draw Crosshair
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 30, canvas.height / 2);
    ctx.lineTo(canvas.width / 2 + 30, canvas.height / 2);
    ctx.moveTo(canvas.width / 2, canvas.height / 2 - 30);
    ctx.lineTo(canvas.width / 2, canvas.height / 2 + 30);
    ctx.stroke();

    // Burn text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`HEADING: ${displayDeg}°`, 30, 40);
    ctx.fillText(`PITCH: ${Math.round(pitch)}° | ROLL: ${Math.round(roll)}°`, 30, 75);
    if (location) {
      ctx.fillText(`GPS: ${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°`, 30, 110);
    }

    try {
      const dataUrl = canvas.toDataURL('image/jpeg');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Telescope_Compass_${displayDeg}deg_${Date.now()}.jpg`;
      a.click();
      toast.success('Telescope snapshot saved with compass telemetry!');
    } catch {
      toast.info('Captured telescope viewfinder!');
    }
  };

  const getReticleStyle = () => {
    switch (reticleColor) {
      case 'emerald':
        return { stroke: '#10B981', glow: 'shadow-[0_0_12px_#10b981]', text: 'text-emerald-400' };
      case 'amber':
        return { stroke: '#F59E0B', glow: 'shadow-[0_0_12px_#f59e0b]', text: 'text-amber-400' };
      case 'crimson':
        return { stroke: '#EF4444', glow: 'shadow-[0_0_12px_#ef4444]', text: 'text-rose-400' };
      default:
        return { stroke: '#00F0FF', glow: 'shadow-[0_0_12px_#00f0ff]', text: 'text-cyan-400' };
    }
  };

  const reticle = getReticleStyle();

  return (
    <div className="w-full relative rounded-3xl overflow-hidden bg-black border border-slate-700 shadow-2xl flex flex-col items-center select-none aspect-[4/5] sm:aspect-square">
      {/* 1. Camera Video Element */}
      {cameraActive && (
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        />
      )}

      {/* Fallback Simulation if Camera Permission Denied / Desktop */}
      {!cameraActive && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-black flex flex-col items-center justify-center p-6 text-center z-10">
          <Crosshair className="w-16 h-16 text-cyan-400 animate-pulse mb-3" />
          <p className="text-stone-300 text-xs font-bold uppercase tracking-wider mb-1">
            AR TELESCOPE CAMERA VIEW
          </p>
          <p className="text-stone-400 text-[11px] max-w-xs mb-4">
            {cameraError ? cameraError : 'Enable camera permissions to view the live optical telescope camera with compass telemetry.'}
          </p>
          <button
            onClick={() => startCamera()}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Enable Camera Stream</span>
          </button>
        </div>
      )}

      {/* 2. Tactical Scope Vignette & Lens Mask */}
      <div className="absolute inset-0 pointer-events-none rounded-3xl border-[20px] sm:border-[28px] border-black/85 shadow-[inset_0_0_60px_rgba(0,0,0,0.95)] z-20" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.75)_80%,rgba(0,0,0,0.95)_100%)] z-20" />

      {/* 3. Top Scrolling Bearing Azimuth Tape */}
      <div className="absolute top-4 inset-x-8 z-30 flex flex-col items-center pointer-events-none">
        <div className="px-4 py-1 rounded-full bg-black/70 backdrop-blur-md border border-cyan-400/40 text-white flex items-center gap-3 shadow-lg">
          <span className="text-[10px] font-mono text-stone-400">{(displayDeg - 15 + 360) % 360}°</span>
          <span className="text-sm font-mono font-black text-cyan-400 tracking-wider">
            {displayDeg}°
          </span>
          <span className="text-[10px] font-mono text-stone-400">{(displayDeg + 15) % 360}°</span>
        </div>
        {/* Reticle Caret */}
        <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-cyan-400 drop-shadow-[0_0_6px_#00f0ff] -mt-0.5" />
      </div>

      {/* 4. Mil-Dot Optical Crosshairs & Pitch/Roll Horizon */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
        {/* Rotating Horizon Level Bar based on Roll */}
        <div 
          className="w-48 h-[1px] bg-cyan-400/60 transition-transform duration-75 relative"
          style={{ transform: `rotate(${-roll}deg)` }}
        >
          <div className="absolute -top-3 left-0 w-2 h-2 border-l border-t border-cyan-400" />
          <div className="absolute -top-3 right-0 w-2 h-2 border-r border-t border-cyan-400" />
          <div className="absolute left-1/2 -top-1.5 w-1 h-3 -translate-x-1/2 bg-cyan-400" />
        </div>

        {/* Center Optical Scope Reticle */}
        <svg className="absolute w-56 h-56" viewBox="0 0 200 200">
          {/* Outer Crosshair Circle */}
          <circle cx="100" cy="100" r="75" fill="none" stroke={reticle.stroke} strokeWidth="1" strokeDasharray="6 3" opacity="0.6" />
          <circle cx="100" cy="100" r="45" fill="none" stroke={reticle.stroke} strokeWidth="0.8" opacity="0.8" />
          <circle cx="100" cy="100" r="2" fill={reticle.stroke} />

          {/* Mil-dot Ticks along crosshair lines */}
          <line x1="100" y1="20" x2="100" y2="180" stroke={reticle.stroke} strokeWidth="0.8" opacity="0.7" />
          <line x1="20" y1="100" x2="180" y2="100" stroke={reticle.stroke} strokeWidth="0.8" opacity="0.7" />

          {/* Mil Ticks */}
          {[60, 75, 88, 112, 125, 140].map((pos) => (
            <React.Fragment key={pos}>
              <line x1={pos} y1="97" x2={pos} y2="103" stroke={reticle.stroke} strokeWidth="0.8" />
              <line x1="97" y1={pos} x2="103" y2={pos} stroke={reticle.stroke} strokeWidth="0.8" />
            </React.Fragment>
          ))}
        </svg>

        {/* Rangefinder Readout */}
        <div className="absolute bottom-20 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/15 text-[10px] font-mono font-bold text-white flex items-center gap-2">
          <span>PITCH: {Math.round(pitch)}°</span>
          <span className="text-white/30">|</span>
          <span>ROLL: {Math.round(roll)}°</span>
          <span className="text-white/30">|</span>
          <span className={reticle.text}>{zoomLevel}X OPTICAL</span>
        </div>
      </div>

      {/* 5. Bottom Interactive Tactical Controls */}
      <div className="absolute bottom-3 inset-x-4 z-40 flex items-center justify-between pointer-events-auto">
        {/* Zoom Toggles */}
        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-md">
          {[1, 2, 5].map((z) => (
            <button
              key={z}
              onClick={() => setZoomLevel(z)}
              className={cn(
                "px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all",
                zoomLevel === z ? "bg-cyan-500 text-black shadow-sm" : "text-stone-400 hover:text-white"
              )}
            >
              {z}X
            </button>
          ))}
        </div>

        {/* Center Snapshot Trigger */}
        <button
          onClick={takeSnapshot}
          className="w-12 h-12 rounded-full border-2 border-white bg-red-600 hover:bg-red-500 active:scale-90 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.7)] transition-all"
          title="Capture Telescope Photo"
        >
          <Camera className="w-5 h-5 text-white" />
        </button>

        {/* Reticle Color & Camera Switcher */}
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-md">
          <button
            onClick={() => {
              const colors: Array<'cyan' | 'emerald' | 'amber' | 'crimson'> = ['cyan', 'emerald', 'amber', 'crimson'];
              const next = colors[(colors.indexOf(reticleColor) + 1) % colors.length];
              setReticleColor(next);
            }}
            className="w-7 h-7 rounded-lg bg-stone-800 text-white flex items-center justify-center text-[10px] font-bold"
            title="Switch Reticle Color"
          >
            🎨
          </button>
          <button
            onClick={toggleFacingMode}
            className="w-7 h-7 rounded-lg bg-stone-800 text-white flex items-center justify-center"
            title="Flip Camera"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleTorch}
            className="w-7 h-7 rounded-lg bg-stone-800 text-white flex items-center justify-center"
            title="Toggle Flashlight"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hidden Canvas for High-Resolution Snapshot Capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
