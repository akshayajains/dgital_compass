import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Sun, Crosshair, CheckCircle2, AlertTriangle, ChevronDown, Zap, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { VASTU_16_ZONES } from '@/data/vastuKnowledgeBase';

interface Props {
  heading: number | null;
  pitch: number;
  roll: number;
  location: { latitude: number; longitude: number } | null;
  selectedRoom?: string;
  language?: string;
  onClose?: () => void;
}

interface RoomVastuConfig {
  label: string;
  labelHi: string;
  goodZones: string[];
  badZones: string[];
  remedy: string;
  remedyHi: string;
}

const ROOM_VASTU_DATA: Record<string, RoomVastuConfig> = {
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
  },
  living_room: {
    label: 'Living Room',
    labelHi: 'बैठक कक्ष',
    goodZones: ['N', 'E', 'NE', 'W'],
    badZones: ['S', 'SW'],
    remedy: 'Arrange seating facing North or East, keep the centre of the room clutter-free.',
    remedyHi: 'बैठने की व्यवस्था उत्तर अथवा पूर्व की ओर रखें, कमरे का मध्य भाग खाली रखें।'
  },
  guest: {
    label: 'Guest Room',
    labelHi: 'अतिथि कक्ष',
    goodZones: ['NW', 'N', 'W'],
    badZones: ['SE', 'SW'],
    remedy: 'Place the guest bed in the North-West corner with a warm lamp near the door.',
    remedyHi: 'अतिथि बिस्तर उत्तर-पश्चिम कोने में रखें और द्वार के पास गर्म दीपक लगाएं।'
  },
  staircase: {
    label: 'Staircase',
    labelHi: 'सीढ़ियाँ',
    goodZones: ['SW', 'S', 'W'],
    badZones: ['NE', 'E'],
    remedy: 'Build the staircase in the South-West or South zone, never in the North-East.',
    remedyHi: 'सीढ़ियाँ दक्षिण-पश्चिम अथवा दक्षिण क्षेत्र में बनाएं, ईशान कोण में कभी नहीं।'
  },
  water_overhead: {
    label: 'Overhead Water Tank',
    labelHi: 'ऊपरी जल टंकी',
    goodZones: ['SW', 'W', 'S'],
    badZones: ['NE', 'E'],
    remedy: 'Place the overhead tank in the South-West or West, never in the North-East.',
    remedyHi: 'ऊपरी टंकी दक्षिण-पश्चिम अथवा पश्चिम में रखें, ईशान कोण में कभी नहीं।'
  },
  water_underground: {
    label: 'Underground Water Tank',
    labelHi: 'भूमिगत जल टंकी',
    goodZones: ['NE', 'N', 'E'],
    badZones: ['SW', 'S', 'SE'],
    remedy: 'Place the underground tank in the North-East (Ishanya) corner.',
    remedyHi: 'भूमिगत टंकी ईशान (उत्तर-पूर्व) कोण में रखें।'
  },
  business: {
    label: 'Business / Office',
    labelHi: 'व्यवसाय / कार्यालय',
    goodZones: ['N', 'NE', 'E', 'W'],
    badZones: ['S', 'SW', 'SE'],
    remedy: 'Face the desk towards North or East, keep the cash counter in the North.',
    remedyHi: 'डेस्क उत्तर अथवा पूर्व की ओर रखें, कैश काउंटर उत्तर में रखें।'
  },
  naukari: {
    label: 'Job / Career',
    labelHi: 'नौकरी / करियर',
    goodZones: ['N', 'NE', 'E'],
    badZones: ['S', 'SW'],
    remedy: 'Place a small water fountain in the North to boost career growth.',
    remedyHi: 'करियर वृद्धि के लिए उत्तर दिशा में छोटा जल फव्वारा रखें।'
  }
};

const ROOM_OPTIONS: Array<{ id: string; label: string; labelHi: string }> = [
  { id: 'entrance', label: 'Main Door / Entrance', labelHi: 'मुख्य द्वार' },
  { id: 'pooja', label: 'Pooja / Mandir', labelHi: 'पूजा घर / मंदिर' },
  { id: 'kitchen', label: 'Kitchen / Stove', labelHi: 'रसोईघर / चूल्हा' },
  { id: 'master_bedroom', label: 'Master Bedroom', labelHi: 'मास्टर बेडरूम' },
  { id: 'cash', label: 'Cash Locker / Wealth', labelHi: 'तिजोरी / धन स्थान' },
  { id: 'study', label: 'Study / Library', labelHi: 'अध्ययन कक्ष' },
  { id: 'bathroom', label: 'Toilet / Bathroom', labelHi: 'शौचालय / बाथरूम' },
  { id: 'living_room', label: 'Living Room', labelHi: 'बैठक कक्ष' },
  { id: 'guest', label: 'Guest Room', labelHi: 'अतिथि कक्ष' },
  { id: 'staircase', label: 'Staircase', labelHi: 'सीढ़ियाँ' },
  { id: 'water_overhead', label: 'Overhead Water Tank', labelHi: 'ऊपरी जल टंकी' },
  { id: 'water_underground', label: 'Underground Water Tank', labelHi: 'भूमिगत जल टंकी' },
  { id: 'business', label: 'Business / Office', labelHi: 'व्यवसाय / कार्यालय' },
  { id: 'naukari', label: 'Job / Career', labelHi: 'नौकरी / करियर' }
];

export const TelescopeCameraCompass: React.FC<Props> = ({
  heading,
  pitch,
  roll,
  location,
  selectedRoom = 'entrance',
  language = 'en',
  onClose
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
  const [roomSelectorOpen, setRoomSelectorOpen] = useState<boolean>(false);
  const [room, setRoom] = useState<string>(selectedRoom);

  // Sync internal room when the prop changes (e.g. from the Vastu panel)
  useEffect(() => {
    setRoom(selectedRoom);
  }, [selectedRoom]);

  const displayDeg = heading !== null ? Math.round(((heading % 360) + 360) % 360) : 0;

  // ---- Vastu Suggestion computation ----
  const currentZone = VASTU_16_ZONES.find((z) => {
    if (z.startDeg <= z.endDeg) {
      return displayDeg >= z.startDeg && displayDeg < z.endDeg;
    }
    // Wrap-around zone (e.g. N: 348-11)
    return displayDeg >= z.startDeg || displayDeg < z.endDeg;
  }) || VASTU_16_ZONES[0];

  const roomConfig = ROOM_VASTU_DATA[room] || ROOM_VASTU_DATA.entrance;

  // Map 16-zone code to its 8-sector root (N, NE, E, SE, S, SW, W, NW)
  const sectorRoot = (code: string): string => {
    if (code.startsWith('NNE') || code.startsWith('NNW')) return 'N';
    if (code.startsWith('ENE') || code.startsWith('ESE')) return 'E';
    if (code.startsWith('SSE') || code.startsWith('SSW')) return 'S';
    if (code.startsWith('WSW') || code.startsWith('WNW')) return 'W';
    if (code === 'NE') return 'NE';
    if (code === 'SE') return 'SE';
    if (code === 'SW') return 'SW';
    if (code === 'NW') return 'NW';
    return code;
  };

  const currentSector = sectorRoot(currentZone.code);
  const isAuspicious = roomConfig.goodZones.includes(currentSector);
  const isSevereDosha = roomConfig.badZones.includes(currentSector);
  const verdict = isAuspicious ? 'auspicious' : isSevereDosha ? 'dosha' : 'neutral';

  const selectedRoomLabel = language === 'hi' ? roomConfig.labelHi : roomConfig.label;
  const scannerCopy = language === 'hi'
    ? {
        title: 'लाइव एआर वास्तु स्कैनर', close: 'सैटेलाइट पर वापस जाएं', torch: 'टॉर्च बदलें',
        targetRoom: 'लक्ष्य कक्ष', element: 'तत्व', capture: 'एआर वास्तु स्कैन कैप्चर करें',
        flip: 'कैमरा बदलें', zoom: 'ज़ूम बदलें', auspicious: 'शुभ क्षेत्र', alert: 'वास्तु चेतावनी', check: 'संरेखण जांच'
      }
    : {
        title: 'Live AR Vastu Scanner', close: 'Back to satellite', torch: 'Toggle flashlight',
        targetRoom: 'Target room', element: 'Element', capture: 'Capture AR Vastu scan',
        flip: 'Flip camera', zoom: 'Change zoom', auspicious: 'Auspicious Zone', alert: 'Vastu Alert', check: 'Alignment Check'
      };

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
      // Map common MediaDevice errors to friendlier messages
      const msg = (err && err.name) || (err && err.message) || '';
      if (/NotReadableError|NotReadable|TrackStartError/i.test(msg) || /device in use/i.test(msg)) {
        setCameraError(language === 'hi' ? 'कैमरा उपयोग में है — अन्य ऐप बंद करें और पुनः प्रयास करें।' : 'Camera is currently in use by another application. Close it and try again.');
      } else if (/NotAllowedError|PermissionDenied|SecurityError/i.test(msg)) {
        setCameraError(language === 'hi' ? 'कैमरा अनुमति आवश्यक है। सेटिंग्स में जाकर अनुमति दें।' : 'Camera permission denied. Enable in app settings.');
      } else if (/OverconstrainedError|Overconstrained/i.test(msg)) {
        setCameraError(language === 'hi' ? 'डिवाइस अनुकूलन समस्या: कैमरा उपलब्ध नहीं है।' : 'Camera constraints could not be satisfied for this device.');
      } else {
        setCameraError(err.message || 'Camera permission denied or unavailable');
      }
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

      {/* Preserve camera contrast while leaving room for the AR scanner UI. */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,rgba(0,0,0,0.48)_0%,transparent_30%,transparent_62%,rgba(0,0,0,0.68)_100%)] z-20" />

      {/* 3. Top Scrolling Bearing Azimuth Tape */}
      <div className="hidden absolute top-4 inset-x-8 z-30 flex-col items-center pointer-events-none">
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
      <div className="hidden absolute inset-0 pointer-events-none items-center justify-center z-30">
        {/* Rotating Horizon Level Bar based on Roll */}
        <div 
          className="w-48 h-[1px] bg-cyan-400/60 transition-transform duration-75 relative"
          style={{ transform: `rotate(${-roll}deg)`, willChange: 'transform' }}
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
      <div className="hidden absolute bottom-3 inset-x-4 z-40 items-center justify-between pointer-events-auto">
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

      {/* 6. Vastu Suggestion Overlay (Target Room + Element + Details) */}
      <div className="hidden absolute top-14 left-3 z-40 flex-col items-start gap-2 pointer-events-auto">
        {/* Room Selector */}
        <div className="relative">
          <button
            onClick={() => setRoomSelectorOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white text-[11px] font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all"
          >
            <span className="text-amber-300">🏠</span>
            <span>{selectedRoomLabel}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 text-stone-400 transition-transform", roomSelectorOpen && "rotate-180")} />
          </button>
          {roomSelectorOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 max-h-64 overflow-y-auto rounded-2xl bg-black/90 backdrop-blur-md border border-white/20 shadow-2xl p-1.5 z-50">
              {ROOM_OPTIONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setRoom(r.id);
                    setRoomSelectorOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold transition-colors",
                    r.id === room ? "bg-amber-500/20 text-amber-300" : "text-stone-200 hover:bg-white/10"
                  )}
                >
                  {language === 'hi' ? r.labelHi : r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Vastu Suggestion Card */}
        <div className={cn(
          "w-60 rounded-2xl bg-black/75 backdrop-blur-md border shadow-xl overflow-hidden",
          verdict === 'auspicious' ? "border-emerald-400/50" : verdict === 'dosha' ? "border-red-500/50" : "border-amber-400/50"
        )}>
          {/* Header */}
          <div className={cn(
            "px-3 py-2 flex items-center justify-between border-b border-white/10",
            verdict === 'auspicious' ? "bg-emerald-950/40" : verdict === 'dosha' ? "bg-red-950/40" : "bg-amber-950/40"
          )}>
            <div className="flex items-center gap-1.5">
              {verdict === 'auspicious' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className={cn("w-3.5 h-3.5", verdict === 'dosha' ? "text-red-400" : "text-amber-400")} />
              )}
              <span className={cn(
                "text-[10px] font-black uppercase tracking-wider",
                verdict === 'auspicious' ? "text-emerald-400" : verdict === 'dosha' ? "text-red-400" : "text-amber-400"
              )}>
                {language === 'hi'
                  ? (verdict === 'auspicious' ? 'शुभ दिशा' : verdict === 'dosha' ? 'वास्तु दोष' : 'सामान्य')
                  : (verdict === 'auspicious' ? 'Auspicious' : verdict === 'dosha' ? 'Vastu Dosha' : 'Neutral')}
              </span>
            </div>
            <span className="text-[9px] font-mono text-stone-400">{displayDeg}°</span>
          </div>

          {/* Body */}
          <div className="px-3 py-2.5 space-y-2">
            {/* Target Room */}
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                {language === 'hi' ? 'लक्ष्य कमरा' : 'Target Room'}
              </span>
              <span className="text-[11px] font-black text-white text-right">{selectedRoomLabel}</span>
            </div>

            {/* Element */}
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                {language === 'hi' ? 'तत्व' : 'Element'}
              </span>
              <span className="text-[11px] font-black text-amber-300">
                {language === 'hi' ? currentZone.elementHi : currentZone.element}
              </span>
            </div>

            {/* Current Direction */}
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                {language === 'hi' ? 'दिशा' : 'Direction'}
              </span>
              <span className="text-[11px] font-black text-cyan-300">
                {language === 'hi' ? currentZone.nameHi : currentZone.nameEn} ({currentZone.code})
              </span>
            </div>

            {/* Remedy */}
            <div className="pt-1.5 border-t border-white/10">
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                {language === 'hi' ? 'उपाय' : 'Remedy'}
              </span>
              <p className="text-[10px] text-stone-300 leading-snug">
                {language === 'hi' ? roomConfig.remedyHi : roomConfig.remedy}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reference-style AR Vastu scanner HUD. */}
      <div className="absolute inset-0 z-50 text-white pointer-events-none">
        <div className="absolute top-7 left-7 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.9)]" />
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.2em]">{scannerCopy.title}</span>
        </div>

        <div className="absolute top-5 right-5 flex items-center gap-2 pointer-events-auto">
          <button onClick={toggleTorch} className={cn("grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/65 backdrop-blur-md transition-colors", flashOn && "bg-amber-400 text-black")} title={scannerCopy.torch}>
            <Zap className="h-5 w-5" />
          </button>
          <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/75 backdrop-blur-md" title={scannerCopy.close}>
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="absolute top-[78px] left-6 right-6 h-[60px] overflow-hidden rounded-2xl border border-white/10 bg-black/70 backdrop-blur-md shadow-xl">
          <div className="absolute top-0 bottom-0 left-1/2 z-10 w-1 -translate-x-1/2 bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)]" />
          <div className="flex h-full items-center justify-between px-5 text-[10px] font-black text-stone-300">
            {[-30, -20, -10, 0, 10, 20, 30].map((offset) => {
              const degree = (displayDeg + offset + 360) % 360;
              return <span key={offset} className={offset === 0 ? 'text-amber-300' : ''}>{degree}°<i className="mx-auto mt-1 block h-1.5 w-px bg-current opacity-70" /></span>;
            })}
          </div>
        </div>

        <div className="absolute left-1/2 top-[49%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center">
          <div className="absolute h-64 w-64 rounded-full border-2 border-dashed border-emerald-400/65 animate-[spin_22s_linear_infinite]" />
          <div className="absolute h-48 w-48 rounded-full border border-emerald-400/70 bg-slate-950/35 backdrop-blur-[2px]" />
          <div className="relative flex h-48 w-48 flex-col items-center justify-center text-center">
            <span className="text-4xl font-black tracking-tight drop-shadow-md">{displayDeg}°</span>
            <span className="mt-1 text-sm font-black uppercase tracking-[0.16em] text-red-400">{currentZone.code}</span>
            <span className="mt-3 rounded-full bg-black/80 px-3 py-1 text-[10px] font-black text-amber-300 shadow-lg">{currentZone.nameEn} ({currentZone.deity.split(' ')[0]})</span>
          </div>
        </div>

        <div className="absolute bottom-[92px] left-1/2 w-[min(82%,25rem)] -translate-x-1/2 rounded-2xl border border-white/10 bg-stone-950/85 px-5 py-3 text-center shadow-2xl backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-center gap-2">
            {verdict === 'auspicious' ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertTriangle className={cn('h-5 w-5', verdict === 'dosha' ? 'text-red-400' : 'text-amber-300')} />}
            <span className={cn('text-xs font-black uppercase tracking-wide', verdict === 'auspicious' ? 'text-emerald-400' : verdict === 'dosha' ? 'text-red-400' : 'text-amber-300')}>
              {selectedRoomLabel}: {verdict === 'auspicious' ? scannerCopy.auspicious : verdict === 'dosha' ? scannerCopy.alert : scannerCopy.check}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-stone-200">{language === 'hi' ? roomConfig.remedyHi : roomConfig.remedy}</p>
        </div>

        <div className="absolute bottom-5 left-7 pointer-events-auto">
          <span className="block text-[8px] font-black uppercase tracking-wide text-stone-400">{scannerCopy.targetRoom}</span>
          <div className="relative mt-1">
            <button onClick={() => setRoomSelectorOpen((value) => !value)} className="flex max-w-[128px] items-center gap-1 text-left text-[11px] font-black leading-tight text-white">
              <span>{selectedRoomLabel}</span><ChevronDown className={cn('h-4 w-4 text-stone-300 transition-transform', roomSelectorOpen && 'rotate-180')} />
            </button>
            {roomSelectorOpen && <div className="absolute bottom-full left-0 mb-2 max-h-64 w-56 overflow-y-auto rounded-2xl border border-white/15 bg-black/90 p-1.5 shadow-2xl backdrop-blur-xl">
              {ROOM_OPTIONS.map((option) => <button key={option.id} onClick={() => { setRoom(option.id); setRoomSelectorOpen(false); }} className={cn('w-full rounded-xl px-3 py-2 text-left text-[11px] font-bold', option.id === room ? 'bg-amber-400/15 text-amber-300' : 'text-stone-200 hover:bg-white/10')}>
                {language === 'hi' ? option.labelHi : option.label}
              </button>)}
            </div>}
          </div>
        </div>

        <div className="absolute bottom-5 right-7 text-right">
          <span className="block text-[8px] font-black uppercase tracking-wide text-stone-400">{scannerCopy.element}</span>
          <span className="mt-1 block text-[11px] font-black text-amber-300">{language === 'hi' ? currentZone.elementHi : currentZone.element}</span>
        </div>

        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-3 pointer-events-auto">
          <button onClick={toggleFacingMode} className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/70 backdrop-blur-md" title={scannerCopy.flip}><RefreshCw className="h-4 w-4" /></button>
          <button onClick={takeSnapshot} className="grid h-16 w-16 place-items-center rounded-full border-4 border-white bg-white/20 shadow-[0_0_0_5px_rgba(255,255,255,0.28)] backdrop-blur-md transition-transform active:scale-90" title={scannerCopy.capture}><span className="grid h-11 w-11 place-items-center rounded-full bg-white text-stone-950"><Camera className="h-5 w-5" /></span></button>
          <button onClick={() => setZoomLevel((value) => value === 1 ? 2 : value === 2 ? 5 : 1)} className="h-9 rounded-full border border-white/20 bg-black/70 px-3 text-[10px] font-black backdrop-blur-md" title={scannerCopy.zoom}>{zoomLevel}X</button>
        </div>
      </div>

      {/* Hidden Canvas for High-Resolution Snapshot Capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
