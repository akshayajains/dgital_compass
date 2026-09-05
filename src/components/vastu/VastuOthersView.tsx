import React, { useState, useMemo, useEffect } from 'react';
import { 
  Compass, 
  Home, 
  Wind, 
  Bed, 
  Camera, 
  Layers, 
  Zap, 
  Target, 
  Copy, 
  Lock, 
  Activity, 
  Save, 
  Sun,
  Navigation,
  Check,
  ScanSearch,
  ShieldCheck,
  Gauge,
  MapPinned
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { CompassStyleId } from '@/types/compass';
import { CompassDialRenderer } from '@/components/compass/CompassDialRenderer';
import { VASTU_16_ZONES } from '@/data/vastuKnowledgeBase';
import { get32Pada } from '@/lib/vastu32Devta';
import { getChoghadiyaData, VEDIC_RASHIS } from '@/lib/choghadiya';
import { VastuPanel } from '@/components/compass/VastuPanel';
import { JainPanel } from '@/components/compass/JainPanel';
import { FengShuiPanel } from '@/components/compass/FengShuiPanel';
import { JyotishPanel } from '@/components/compass/JyotishPanel';
import { NumerologyPanel } from '@/components/compass/NumerologyPanel';
import { VastuEnhancements } from '@/components/compass/VastuEnhancements';

// Lazy-loaded heavy modals (only fetched when first opened)
const ARVastuScanner = React.lazy(() => import('@/components/compass/ARVastuScanner').then(m => ({ default: m.ARVastuScanner })));
const FloorPlanOverlayModal = React.lazy(() => import('@/components/compass/FloorPlanOverlayModal').then(m => ({ default: m.FloorPlanOverlayModal })));
const WeatherModal = React.lazy(() => import('@/components/compass/WeatherModal').then(m => ({ default: m.WeatherModal })));

interface Props {
  currentHeading: number | null;
  pitch?: number;
  roll?: number;
  sunPos?: number | null;
  isLevel?: boolean;
  selectedStyle?: CompassStyleId;
  customAccentColor?: string;
  variantId?: string | null;
  dialRef?: React.RefObject<HTMLDivElement>;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  weather?: any;
  location?: any;
  declination?: number;
  triggerHaptic: () => void;
  onCopyCoordinates?: () => void;
  onToggleTorch?: () => void;
  isTorchOn?: boolean;
}

export type VastuSubTab = 'vastu' | 'jyotish' | 'numerology' | 'sadhana' | 'feng_shui' | 'qibla';

const VASTU_TAB_STORAGE_KEY = 'com.hcompass.app_vastu_tab';
const VASTU_ROOM_STORAGE_KEY = 'com.hcompass.app_vastu_room';

interface SavedRoomEntry {
  id: string;
  roomType: string;
  degrees: number;
  padaCode: string;
  isAuspicious: boolean;
  timestamp: string;
}

export const VastuOthersView: React.FC<Props> = ({
  currentHeading,
  pitch = 0,
  roll = 0,
  sunPos = null,
  isLevel = false,
  selectedStyle = 'vedic_mandala',
  customAccentColor = '#EF4444',
  variantId,
  dialRef,
  onPointerDown = () => {},
  onPointerMove = () => {},
  onPointerUp = () => {},
  weather,
  location,
  declination = -0.2,
  triggerHaptic,
  onCopyCoordinates = () => {},
  onToggleTorch = () => {},
  isTorchOn = false
}) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isHi = language === 'hi';

  const fallbackDialRef = React.useRef<HTMLDivElement>(null);
  const effectiveDialRef = dialRef || fallbackDialRef;

  // Active Sub-tab (Vastu | Jyotish | Numerology | Sadhana | Feng Shui | Qibla)
  const [activeTab, setActiveTab] = useState<VastuSubTab>(() => {
    try {
      const saved = localStorage.getItem(VASTU_TAB_STORAGE_KEY);
      if (saved === 'vastu' || saved === 'jyotish' || saved === 'numerology' || saved === 'sadhana' || saved === 'feng_shui' || saved === 'qibla') return saved;
    } catch {}
    return 'vastu';
  });

  // Reverse Finder Activity (ONLY for VASTU)
  const [targetActivity, setTargetActivity] = useState<string>('study');

  // Vastu Analyzer Accordion State
  const [isVastuAnalyzerOpen, setIsVastuAnalyzerOpen] = useState<boolean>(true);
  const [analyzerRoomType, setAnalyzerRoomType] = useState<string>('entrance');
  const [analyzerDegrees, setAnalyzerDegrees] = useState<number>(() => {
    return currentHeading !== null ? Math.round(((currentHeading % 360) + 360) % 360) : 0;
  });

  // Saved Rooms
  const [savedRooms, setSavedRooms] = useState<SavedRoomEntry[]>([]);

  // 9-Grid Floorplan Mapper
  const [gridAssignments, setGridAssignments] = useState<Record<string, string>>({
    NW: 'bathroom',
    N: 'main_entrance',
    NE: 'pooja_mandir',
    W: 'study_room',
    Center: 'open_space',
    E: 'cash_locker',
    SW: 'master_bedroom',
    S: 'open_space',
    SE: 'kitchen'
  });

  // Feng Shui Bagua State
  const [isFengShuiOpen, setIsFengShuiOpen] = useState<boolean>(true);
  const [baguaDoorFacing, setBaguaDoorFacing] = useState<string>('NORTH DOOR');

  // Jyotish State
  const [selectedRashiId, setSelectedRashiId] = useState<string>('aries');
  const [choghadiyaTimeSlot, setChoghadiyaTimeSlot] = useState<'day' | 'night'>('night');

  // Numerology State (Default to 21/04/1979 as in screenshot)
  const [birthDay, setBirthDay] = useState<string>('21');
  const [birthMonth, setBirthMonth] = useState<string>('04');
  const [birthYear, setBirthYear] = useState<string>('1979');
  const [isNumerologyOpen, setIsNumerologyOpen] = useState<boolean>(true);

  // Sadhana State
  const [japaCount, setJapaCount] = useState<number>(0);
  const [japaTarget] = useState<number>(108);
  const [sadhanaRoutine, setSadhanaRoutine] = useState<'dhyan' | 'study' | 'sleep' | 'eating'>('dhyan');
  const [setupFacing, setSetupFacing] = useState<boolean>(true);
  const [setupAsan, setSetupAsan] = useState<boolean>(true);
  const [setupPeace, setSetupPeace] = useState<boolean>(true);
  const [selectedRoom, setSelectedRoom] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(VASTU_ROOM_STORAGE_KEY);
      if (saved) return saved;
    } catch {}
    return 'entrance';
  });
  const [doorDegree, setDoorDegree] = useState<number>(() => {
    const h = currentHeading ?? 0;
    return Math.round(((h % 360) + 360) % 360);
  });
  const [house9Grid, setHouse9Grid] = useState<Record<string, string>>({
    '1': 'wealth', '2': 'health', '3': 'knowledge', '4': 'family', '5': 'center',
    '6': 'children', '7': 'marriage', '8': 'career', '9': 'spirituality'
  });
  const [jainActivity, setJainActivity] = useState<string>('dhyan');
  const [jainChecklist, setJainChecklist] = useState<Record<string, boolean>>({
    'meditation': true, 'prayer': true, 'charity': false, 'study': false, 'fasting': false
  });
  const [fengshuiDoor, setFengshuiDoor] = useState<number>(() => {
    const h = currentHeading ?? 0;
    return Math.round(((h % 360) + 360) % 360);
  });
  const [jyotishRashi, setJyotishRashi] = useState<string>('aries');
  const [numerologyDob, setNumerologyDob] = useState<string>('1979-04-21');
  const [numerologyPhone, setNumerologyPhone] = useState<string>('');
  const [numerologyHouse, setNumerologyHouse] = useState<string>('');
  const [numerologyVehicle, setNumerologyVehicle] = useState<string>('');
  const [showARScanner, setShowARScanner] = useState<boolean>(false);
  const [showFloorPlan, setShowFloorPlan] = useState<boolean>(false);
  const [showWeather, setShowWeather] = useState<boolean>(false);

  // Persist Vastu sub-tab + selected room across sessions
  useEffect(() => {
    try { localStorage.setItem(VASTU_TAB_STORAGE_KEY, activeTab); } catch {}
  }, [activeTab]);
  useEffect(() => {
    try { localStorage.setItem(VASTU_ROOM_STORAGE_KEY, selectedRoom); } catch {}
  }, [selectedRoom]);

  const reduceToSingle = (n: number): number => {
    let sum = n;
    while (sum > 9) {
      sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
    }
    return sum;
  };

  const phoneTotal = numerologyPhone.replace(/\D/g, '').length > 0
    ? reduceToSingle(numerologyPhone.replace(/\D/g, '').split('').reduce((a, c) => a + parseInt(c, 10), 0))
    : null;
  const houseTotal = numerologyHouse.replace(/\D/g, '').length > 0
    ? reduceToSingle(numerologyHouse.replace(/\D/g, '').split('').reduce((a, c) => a + parseInt(c, 10), 0))
    : null;
  const vehicleTotal = numerologyVehicle.replace(/\D/g, '').length > 0
    ? reduceToSingle(numerologyVehicle.replace(/\D/g, '').split('').reduce((a, c) => a + parseInt(c, 10), 0))
    : null;

  const numerologyFromDob = useMemo(() => {
    try {
      const parts = numerologyDob.split('-');
      const d = parseInt(parts[2], 10) || 1;
      const m = parseInt(parts[1], 10) || 1;
      const y = parseInt(parts[0], 10) || 1980;
      const mulank = reduceToSingle(d);
      const digitsSum = `${d}${m}${y}`.split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
      const bhagyank = reduceToSingle(digitsSum);
      const allDigits = `${d}${m}${y}`.replace(/0/g, '');
      const loShuCounts: Record<number, number> = {};
      for (let i = 1; i <= 9; i++) loShuCounts[i] = 0;
      for (const char of allDigits) {
        const num = parseInt(char, 10);
        if (num >= 1 && num <= 9) loShuCounts[num] = (loShuCounts[num] || 0) + 1;
      }
      return { mulank, bhagyank, loShuCounts };
    } catch {
      return { mulank: 3, bhagyank: 6, loShuCounts: { 4: 1, 9: 2, 2: 1, 3: 1, 7: 1, 1: 2, 6: 1 } };
    }
  }, [numerologyDob]);

  // Qibla Math
  const qiblaData = useMemo(() => {
    if (!location) return null;
    const userLat = location.latitude;
    const userLng = location.longitude;
    const makkahLat = 21.4225;
    const makkahLng = 39.8262;

    const phi1 = (userLat * Math.PI) / 180;
    const phi2 = (makkahLat * Math.PI) / 180;
    const deltaLambda = ((makkahLng - userLng) * Math.PI) / 180;

    const y = Math.sin(deltaLambda);
    const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);
    let qiblaBearing = (Math.atan2(y, x) * 180) / Math.PI;
    qiblaBearing = (qiblaBearing + 360) % 360;

    const R = 6371; // km
    const dLat = ((makkahLat - userLat) * Math.PI) / 180;
    const dLon = deltaLambda;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = Math.round(R * c);

    const headingDiff = Math.abs(((currentHeading || 0) - qiblaBearing + 540) % 360 - 180);
    const isFacingQibla = headingDiff < 4;

    return { qiblaBearing: Math.round(qiblaBearing), distanceKm, isFacingQibla };
  }, [location, currentHeading]);

  // Display Heading & Tilts
  const displayDeg = currentHeading !== null ? Math.round(((currentHeading % 360) + 360) % 360) : 0;
  const totalTilt = Math.sqrt(pitch * pitch + roll * roll);

  // Live Zone & Pada
  const liveZone = useMemo(() => {
    return VASTU_16_ZONES.find(z => {
      if (z.code === 'N') {
        return displayDeg >= 348.75 || displayDeg < 11.25;
      }
      return displayDeg >= z.startDeg && displayDeg < z.endDeg;
    }) || VASTU_16_ZONES[0];
  }, [displayDeg]);

  const livePada = useMemo(() => get32Pada(currentHeading), [currentHeading]);
  const analyzerPada = useMemo(() => get32Pada(analyzerDegrees), [analyzerDegrees]);

  // Choghadiya Data
  const choghadiya = useMemo(() => getChoghadiyaData(new Date()), []);

  // Selected Rashi Info
  const selectedRashi = useMemo(() => {
    return VEDIC_RASHIS.find(r => r.id === selectedRashiId) || VEDIC_RASHIS[0];
  }, [selectedRashiId]);

  // Numerology Details Calculation (matches Driver 3, Conductor 6 for 21/04/1979)
  const numerologyDetails = useMemo(() => {
    try {
      const d = parseInt(birthDay, 10) || 1;
      const m = parseInt(birthMonth, 10) || 1;
      const y = parseInt(birthYear, 10) || 1980;

      const reduce = (n: number): number => {
        let sum = n;
        while (sum > 9) {
          sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
        }
        return sum;
      };

      const mulank = reduce(d);
      const digitsSum = `${d}${m}${y}`.split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
      const bhagyank = reduce(digitsSum);

      // Lo Shu Magic Square Frequency Counter
      const allDigits = `${d}${m}${y}`.replace(/0/g, '');
      const loShuCounts: Record<number, number> = {};
      for (let i = 1; i <= 9; i++) loShuCounts[i] = 0;
      for (const char of allDigits) {
        const num = parseInt(char, 10);
        if (num >= 1 && num <= 9) loShuCounts[num] = (loShuCounts[num] || 0) + 1;
      }

      return {
        mulank,
        bhagyank,
        loShuCounts
      };
    } catch {
      return { mulank: 3, bhagyank: 6, loShuCounts: { 4: 1, 9: 2, 2: 1, 3: 1, 7: 1, 1: 2, 6: 1 } };
    }
  }, [birthDay, birthMonth, birthYear]);

  // Live heading advice (for Vastu)
  const liveHeadingAdvice = useMemo(() => {
    switch (liveZone.code) {
      case 'N':
        return { idealFor: 'Wealth Accumulation, Career Opportunities, Safe/Locker', avoidFor: 'Kitchen Fire, Toilet, Heavy Clutter' };
      case 'NNE':
        return { idealFor: 'Medicine Cabinet, Health Healing, Recovery', avoidFor: 'Toilet, Dustbin' };
      case 'NE':
        return { idealFor: 'Pooja Mandir, Meditation, Spiritual Focus, Study', avoidFor: 'Toilet (Major Dosha), Kitchen, Heavy Stairs' };
      case 'ENE':
        return { idealFor: 'Recreation, Family Lounge, Refreshment', avoidFor: 'Toilet, Heavy Junk' };
      case 'E':
        return { idealFor: 'Social Networking, Main Entrance, East-facing Study', avoidFor: 'Toilet, Dark Clutter, Blocked Windows' };
      case 'ESE':
        return { idealFor: 'Churning, Mixer/Grinder, Washing Machine', avoidFor: 'Bedroom (Severe Anxiety & Insomnia), Mandir' };
      case 'SE':
        return { idealFor: 'Kitchen Gas Stove, Fire Element, Electrical Inverter', avoidFor: 'Water Tank, Bedroom, Blue/Black Colors' };
      case 'SSE':
        return { idealFor: 'Gym, Workout, Physical Stamina, Grains', avoidFor: 'Toilet, Underground Pit' };
      case 'S':
        return { idealFor: 'Deep Restful Sleep, Heavy Furniture, Rest', avoidFor: 'Underground Tank, Water Fountains' };
      case 'SSW':
        return { idealFor: 'Toilet & Septic Tank (Ideal Zone of Disposal)', avoidFor: 'Bedroom, Cash Safe, Mandir' };
      case 'SW':
        return { idealFor: 'Master Bedroom, Head of Family, Stability, Overhead Tank', avoidFor: 'Toilet, Underground Tank, Mandir' };
      case 'WSW':
        return { idealFor: 'Vidya Pada: Study Desk, Books, Knowledge, Savings', avoidFor: 'Toilet (Washes away education), Kitchen' };
      case 'W':
        return { idealFor: 'Business Profits, Gains, Dining Room, Kids Bedroom', avoidFor: 'Underground Water Tank' };
      case 'WNW':
        return { idealFor: 'Emotional Detoxing, Releasing Grief, Waste Paper', avoidFor: 'Bedroom (Depression), Study Desk' };
      case 'NW':
        return { idealFor: 'Guest Room, Banking, Support, Ready Goods', avoidFor: 'Master Bedroom, Heavy Fixed Vaults' };
      case 'NNW':
        return { idealFor: 'Newly Married Couple, Romance, Charm, Attire', avoidFor: 'Children Study Desk, Toilet' };
      default:
        return { idealFor: 'General Work', avoidFor: 'Clutter' };
    }
  }, [liveZone.code]);

  // Reverse activity finder (for Vastu)
  const activityDirections = useMemo(() => {
    switch (targetActivity) {
      case 'study':
        return { title: 'Study & Competitive Exams', bestZones: ['WSW (236°-258°)', 'NE (34°-56°)', 'East (79°-101°)'], facing: 'Face East (Retention) or North (Analytical focus).', targetDeg: 247.5, color: 'text-indigo-400' };
      case 'work':
        return { title: 'Work From Home & Office', bestZones: ['North (349°-11°)', 'West (259°-281°)', 'East (79°-101°)'], facing: 'Sit facing North (Career opportunities) or East.', targetDeg: 0, color: 'text-sky-400' };
      case 'sleep':
        return { title: 'Master Bedroom & Sleep', bestZones: ['SW (214°-236°)', 'South (169°-191°)', 'West (259°-281°)'], facing: 'Head towards South (Best) or East. Never North.', targetDeg: 225, color: 'text-amber-400' };
      case 'mandir':
        return { title: 'Pooja Mandir & Spiritual Space', bestZones: ['NE (34°-56°)', 'East (79°-101°)', 'North (349°-11°)'], facing: 'Devotee faces East or North during prayer.', targetDeg: 45, color: 'text-yellow-400' };
      case 'kitchen':
        return { title: 'Kitchen & Gas Stove', bestZones: ['SE (124°-146°)', 'SSE (146°-169°)', 'NW (304°-326°)'], facing: 'Cook must face East while cooking.', targetDeg: 135, color: 'text-orange-400' };
      case 'cash':
        return { title: 'Cash Vault & Wealth Safe', bestZones: ['North (349°-11°)', 'SW (214°-236°)', 'West (259°-281°)'], facing: 'Locker door must open towards North (Lord Kuber).', targetDeg: 0, color: 'text-emerald-400' };
      case 'toilet':
        return { title: 'Toilet & Septic Tank', bestZones: ['SSW (191°-214°)', 'WNW (281°-304°)', 'ESE (101°-124°)'], facing: 'Commode user should face North or South.', targetDeg: 202.5, color: 'text-purple-400' };
      default:
        return { title: 'Study Room', bestZones: ['WSW', 'NE', 'East'], facing: 'Face East or North.', targetDeg: 247.5, color: 'text-indigo-400' };
    }
  }, [targetActivity]);

  // 9-grid score
  const floorplanScore = useMemo(() => {
    let score = 0;
    if (gridAssignments.NW === 'bathroom' || gridAssignments.NW === 'guest_room') score += 11;
    if (gridAssignments.N === 'main_entrance' || gridAssignments.N === 'cash_locker') score += 12;
    if (gridAssignments.NE === 'pooja_mandir') score += 15;
    if (gridAssignments.W === 'study_room') score += 11;
    if (gridAssignments.Center === 'open_space') score += 12;
    if (gridAssignments.E === 'cash_locker' || gridAssignments.E === 'living_room') score += 11;
    if (gridAssignments.SW === 'master_bedroom') score += 15;
    if (gridAssignments.S === 'open_space') score += 8;
    if (gridAssignments.SE === 'kitchen') score += 15;
    return Math.max(30, Math.min(100, score));
  }, [gridAssignments]);

  const premiumInsight = useMemo(() => {
    if (activeTab === 'qibla') return 'Compass, tilt, and sacred-direction guidance are aligned in one calibrated view.';
    if (livePada.isAuspicious) return `Current ${livePada.code} pada is supportive for ${liveHeadingAdvice.idealFor.toLowerCase()}.`;
    return `Current heading is better avoided for ${liveHeadingAdvice.avoidFor.toLowerCase()}; use the reverse finder below.`;
  }, [activeTab, livePada, liveHeadingAdvice]);

  const handleSaveRoom = () => {
    const newEntry: SavedRoomEntry = {
      id: Date.now().toString(),
      roomType: analyzerRoomType,
      degrees: analyzerDegrees,
      padaCode: analyzerPada.code,
      isAuspicious: analyzerPada.isAuspicious,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setSavedRooms(prev => [newEntry, ...prev]);
    triggerHaptic();
  };

  return (
    <div className={cn(
      "w-full max-w-sm flex flex-col items-center select-none pb-14 animate-in fade-in",
      theme === 'light' ? "text-stone-900" : "text-white"
    )}>

      {/* ========================================================================= */}
      {/* 1. THE 6 SUB-TABS (Vastu | Jyotish | Numerology | Sadhana | Feng Shui | Qibla) */}
      {/* ========================================================================= */}
      <div 
        className="w-full max-w-sm flex items-center gap-2 overflow-x-auto no-scrollbar py-1 my-1 touch-pan-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {[
          { id: 'vastu', label: 'Vastu', icon: '✨' },
          { id: 'jyotish', label: 'Jyotish', icon: '⭐' },
          { id: 'numerology', label: 'Numerology', icon: '#' },
          { id: 'sadhana', label: 'Sadhana', icon: '⊙' },
          { id: 'feng_shui', label: 'Feng Shui', icon: '🧭' },
          { id: 'qibla', label: 'Qibla', icon: '↗' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as VastuSubTab);
                triggerHaptic();
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-[11px] font-black tracking-wider whitespace-nowrap transition-all duration-200 shrink-0 border flex items-center gap-1.5 shadow-sm active:scale-95",
                isActive
                  ? (theme === 'light' ? "bg-stone-800 text-white border-white/40 shadow-[0_0_12px_rgba(0,0,0,0.15)] scale-[1.03]" : "bg-stone-800 text-white border-white/40 shadow-[0_0_12px_rgba(255,255,255,0.25)] scale-[1.03]")
                  : (theme === 'light' ? "bg-white text-stone-600 border-stone-300 hover:text-stone-900 hover:border-stone-400" : "bg-stone-950/80 text-stone-400 border-white/10 hover:text-white hover:border-white/25")
              )}
            >
              <span className="text-xs">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 2. COMPASS DIAL (MOUNTED AT TOP OF VASTU VIEW) */}
      {/* ========================================================================= */}
      <div className="w-full flex flex-col items-center relative my-1">
        <CompassDialRenderer
          styleId={selectedStyle}
          language={language}
          displayHeading={currentHeading}
          pitch={pitch}
          roll={roll}
          sunPos={sunPos}
          isQiblaMode={activeTab === 'qibla'}
          qiblaBearing={qiblaData?.qiblaBearing ?? 0}
          qiblaDistanceKm={qiblaData?.distanceKm ?? 0}
          isFacingQibla={qiblaData?.isFacingQibla ?? false}
          vastuGridEnabled={true}
          isLevel={isLevel}
          dialRef={effectiveDialRef}
          customAccentColor={customAccentColor}
          variantId={variantId}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      </div>

      {/* Crimson Quick Dashboard Card */}
      <div className={cn(
        "w-full max-w-sm rounded-[28px] p-4 border flex flex-col gap-3 my-2",
        theme === 'light'
          ? "border-red-200 bg-gradient-to-b from-[#FFF7F7] via-[#FEF2F2] to-[#FDE8E8] shadow-[0_15px_50px_rgba(0,0,0,0.12)]"
          : "border-red-900/60 bg-gradient-to-b from-[#18090C] via-[#120608] to-[#0A0304] shadow-[0_15px_50px_rgba(0,0,0,0.95)]"
      )}>
        {/* Top Badges & Actions */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[9px] font-black uppercase tracking-wider",
              location?.accuracy != null
                ? location.accuracy <= 15
                  ? (theme === 'light' ? "text-emerald-700" : "text-emerald-400")
                  : location.accuracy <= 50
                  ? (theme === 'light' ? "text-amber-700" : "text-amber-400")
                  : "text-red-400"
                : (theme === 'light' ? "text-emerald-700" : "text-emerald-400")
            )}>
              {location?.accuracy != null
                ? `${location.accuracy <= 15 ? 'HIGH' : location.accuracy <= 50 ? 'MED' : 'LOW'} ACC ±${Math.round(location.accuracy)}m`
                : 'HIGH ACC'}
            </span>
            <span className={cn("text-[9px] font-black uppercase tracking-wider", theme === 'light' ? "text-sky-700" : "text-sky-400")}>
              Δ {declination > 0 ? `+${declination}°` : `${declination}°`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button onClick={onCopyCoordinates} className={cn(
              "w-8 h-8 rounded-full border flex items-center justify-center active:scale-95 transition-all shadow-sm",
              theme === 'light' ? "bg-amber-100 border-amber-400 text-amber-800" : "bg-amber-500/20 border-amber-500/40 text-amber-300"
            )}>
              <Camera className={cn("w-4 h-4", theme === 'light' ? "text-amber-700" : "text-amber-400")} />
            </button>
            <button onClick={onToggleTorch} className={cn("w-8 h-8 rounded-full border flex items-center justify-center active:scale-95 transition-all shadow-sm", isTorchOn ? "bg-emerald-500 text-stone-950 border-emerald-400" : (theme === 'light' ? "bg-emerald-100 text-emerald-800 border-emerald-400" : "bg-emerald-950/60 text-emerald-400 border-emerald-500/40"))}>
              <Zap className="w-4 h-4" />
            </button>
            <button onClick={onCopyCoordinates} className={cn(
              "w-8 h-8 rounded-full border flex items-center justify-center active:scale-95 transition-all shadow-sm",
              theme === 'light' ? "bg-white border-stone-300 text-stone-600" : "bg-stone-800/80 border-white/15 text-stone-300"
            )}>
              <Copy className={cn("w-4 h-4", theme === 'light' ? "text-stone-600" : "text-stone-300")} />
            </button>
          </div>
        </div>

        {/* Big Heading Readout Box: 89° पूर्व (E) True North */}
        <div className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-[#FBF3E8] via-[#EFE2CE] to-[#DCBF9E] text-stone-950 flex items-center justify-between shadow-lg">
          <span className="text-xl font-black font-serif tracking-tight">
            {displayDeg}° {liveZone.nameHi.split(' ')[0]} ({liveZone.code})
          </span>
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-stone-900/10 border border-stone-800/20 text-stone-900">
            True North
          </span>
        </div>

        {/* Location & Coordinates (single line to save space) */}
        <div className="text-center">
          <div className={cn("text-[11px] font-black uppercase tracking-wider", theme === 'light' ? "text-stone-700" : "text-stone-300")}>
            {location?.city
              ? `${language === 'hi' ? location.city : (location.cityEn || location.city)}${location.state ? `, ${language === 'hi' ? location.state : (location.stateEn || location.state)}` : ''}`
              : (language === 'hi' ? 'स्थान उपलब्ध नहीं' : 'Location unavailable')}
            <span className="text-[10px] font-mono font-bold text-stone-500 ml-1.5">
              • {location ? `${location.latitude.toFixed(4)}°N, ${location.longitude.toFixed(4)}°E` : ''}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className={cn("rounded-2xl border px-3 py-2", theme === 'light' ? "border-stone-200 bg-white" : "border-white/10 bg-black/25")}>
            <div className={cn("flex items-center gap-1 text-[9px] uppercase tracking-[0.18em]", theme === 'light' ? "text-stone-500" : "text-stone-500")}>
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Pada</span>
            </div>
            <div className={cn("mt-1 text-sm font-black", theme === 'light' ? "text-stone-900" : "text-white")}>{livePada.code}</div>
          </div>
          <div className={cn("rounded-2xl border px-3 py-2", theme === 'light' ? "border-stone-200 bg-white" : "border-white/10 bg-black/25")}>
            <div className={cn("flex items-center gap-1 text-[9px] uppercase tracking-[0.18em]", theme === 'light' ? "text-stone-500" : "text-stone-500")}>
              <Gauge className="w-3 h-3 text-cyan-400" />
              <span>Tilt</span>
            </div>
            <div className={cn("mt-1 text-sm font-black", theme === 'light' ? "text-stone-900" : "text-white")}>{totalTilt.toFixed(1)}°</div>
          </div>
          <div className={cn("rounded-2xl border px-3 py-2", theme === 'light' ? "border-stone-200 bg-white" : "border-white/10 bg-black/25")}>
            <div className={cn("flex items-center gap-1 text-[9px] uppercase tracking-[0.18em]", theme === 'light' ? "text-stone-500" : "text-stone-500")}>
              <MapPinned className="w-3 h-3 text-amber-400" />
              <span>Score</span>
            </div>
            <div className={cn("mt-1 text-sm font-black", theme === 'light' ? "text-stone-900" : "text-white")}>{floorplanScore}%</div>
          </div>
        </div>

        {/* Pitch / Roll / Level integrated into bottom of dashboard */}
        <div className={cn("w-full flex items-center justify-between px-3 py-2 rounded-2xl border", theme === 'light' ? "border-stone-200 bg-white" : "border-white/10 bg-black/25")}>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-[0.18em] text-stone-500">PITCH</span>
            <span className={cn("text-sm font-black font-mono", theme === 'light' ? "text-amber-700" : "text-amber-400")}>{Math.round(pitch)}°</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-[0.18em] text-stone-500">ROLL</span>
            <span className={cn("text-sm font-black font-mono", theme === 'light' ? "text-amber-700" : "text-amber-400")}>{Math.round(roll)}°</span>
          </div>
          <span className={cn(
            "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider",
            isLevel
              ? (theme === 'light' ? "bg-emerald-100 text-emerald-800 border-emerald-400" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.4)]")
              : (theme === 'light' ? "bg-rose-100 text-rose-700 border-rose-400" : "bg-rose-950/60 text-rose-300 border-rose-500/40")
          )}>
            {isLevel ? 'LEVEL' : 'TILT'}
          </span>
        </div>
      </div>

      <div className={cn(
        "w-full max-w-sm rounded-[26px] p-4 border flex flex-col gap-2 mb-2",
        theme === 'light'
          ? "border-emerald-500/30 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.10),transparent_35%),linear-gradient(180deg,#f0fdf4_0%,#dcfce7_100%)] shadow-[0_15px_40px_rgba(0,0,0,0.12)]"
          : "border-emerald-500/20 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_35%),linear-gradient(180deg,#07130F_0%,#050806_100%)] shadow-[0_15px_40px_rgba(0,0,0,0.75)]"
      )}>
        <div className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em]", theme === 'light' ? "text-emerald-700" : "text-emerald-300")}>
          <ScanSearch className="w-3.5 h-3.5" />
          <span>Live Premium Insight</span>
        </div>
        <p className={cn("text-sm font-black", theme === 'light' ? "text-emerald-900" : "text-white")}>{premiumInsight}</p>
        <p className={cn("text-[11px] leading-relaxed", theme === 'light' ? "text-emerald-800" : "text-stone-300")}>
          Ideal for: {liveHeadingAdvice.idealFor}. Avoid for: {liveHeadingAdvice.avoidFor}.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB CONTENT: 1. VASTU (LIVE DIRECTION & FIND BEST DIRECTION LIVE HERE) */}
      {/* ========================================================================= */}
      {activeTab === 'vastu' && (
        <div className="w-full flex flex-col gap-3">
          <VastuPanel
            language={language}
            theme={theme}
            vastuScore={floorplanScore}
            selectedRoom={selectedRoom}
            setSelectedRoom={setSelectedRoom}
            doorDegree={doorDegree}
            setDoorDegree={setDoorDegree}
            house9Grid={house9Grid}
            setHouse9Grid={setHouse9Grid}
            onHaptic={triggerHaptic}
            currentDir={liveZone.code}
            savedRooms={savedRooms.map(r => ({ id: r.id, room: r.roomType, door: r.degrees, grid: {} }))}
            onSaveRoom={(name) => handleSaveRoom()}
            onLoadRoom={(id) => {}}
            onDeleteRoom={(id) => setSavedRooms(prev => prev.filter(r => r.id !== id))}
          />

          {/* AR Vastu Scanner & Floor Plan & Weather quick actions — compact strip */}
          <div className="w-full flex items-center gap-1.5">
            <button
              onClick={() => { setShowARScanner(true); triggerHaptic(); }}
              className={cn(
                "flex-1 py-2 rounded-xl border text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all",
                theme === 'light' ? "bg-white border-amber-400 text-amber-800" : "bg-stone-900 border-amber-500/30 text-amber-300"
              )}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>AR Scan</span>
            </button>
            <button
              onClick={() => { setShowFloorPlan(true); triggerHaptic(); }}
              className={cn(
                "flex-1 py-2 rounded-xl border text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all",
                theme === 'light' ? "bg-white border-amber-400 text-amber-800" : "bg-stone-900 border-amber-500/30 text-amber-300"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Floor Plan</span>
            </button>
            <button
              onClick={() => { setShowWeather(true); triggerHaptic(); }}
              className={cn(
                "flex-1 py-2 rounded-xl border text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all",
                theme === 'light' ? "bg-white border-amber-400 text-amber-800" : "bg-stone-900 border-amber-500/30 text-amber-300"
              )}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Weather</span>
            </button>
          </div>

          <div className={cn("w-full rounded-2xl border px-3.5 py-2.5 shadow-xl", theme === 'light' ? "border-stone-200 bg-white" : "border-white/10 bg-stone-950/70")}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className={cn("text-[9px] font-black uppercase tracking-[0.2em]", theme === 'light' ? "text-cyan-700" : "text-cyan-300")}>Best Direction Live</div>
                <div className={cn("mt-0.5 text-[13px] font-black truncate", theme === 'light' ? "text-stone-900" : "text-white")}>{activityDirections.title}</div>
                <div className={cn("mt-0.5 text-[10px] font-bold truncate", activityDirections.color)}>{activityDirections.facing}</div>
              </div>
              <div className={cn("rounded-xl border px-2.5 py-1.5 text-center shrink-0", theme === 'light' ? "border-cyan-500/30 bg-cyan-500/10" : "border-cyan-500/20 bg-cyan-500/10")}>
                <div className="text-[8px] uppercase tracking-[0.18em] text-stone-500">Target</div>
                <div className={cn("text-base font-black font-mono", theme === 'light' ? "text-cyan-700" : "text-cyan-300")}>{Math.round(activityDirections.targetDeg)}°</div>
              </div>
            </div>
          </div>

          {/* Vastu Enhancements: 8-zone map, lookup, dosha, muhurat, share */}
          <VastuEnhancements
            language={language}
            theme={theme}
            currentHeading={currentHeading}
            onHaptic={triggerHaptic}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB CONTENT: 2. JYOTISH (VEDIC ASTROLOGY & CHOGHADIYA) */}
      {/* ========================================================================= */}
      {activeTab === 'jyotish' && (
        <div className="w-full flex flex-col gap-3">
          <JyotishPanel
            language={language}
            theme={theme}
            jyotishRashi={jyotishRashi}
            setJyotishRashi={setJyotishRashi}
            onHaptic={triggerHaptic}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB CONTENT: 3. NUMEROLOGY (MATCHING SCREENSHOT media_1788369729061.png) */}
      {/* ========================================================================= */}
      {activeTab === 'numerology' && (
        <div className="w-full flex flex-col gap-3">
          <NumerologyPanel
            language={language}
            theme={theme}
            numerologyDob={numerologyDob}
            setNumerologyDob={setNumerologyDob}
            mulank={numerologyFromDob.mulank}
            numerologyNumber={numerologyFromDob.bhagyank}
            loShuGrid={numerologyFromDob.loShuCounts}
            numerologyPhone={numerologyPhone}
            setNumerologyPhone={setNumerologyPhone}
            phoneTotal={phoneTotal}
            numerologyHouse={numerologyHouse}
            setNumerologyHouse={setNumerologyHouse}
            houseTotal={houseTotal}
            numerologyVehicle={numerologyVehicle}
            setNumerologyVehicle={setNumerologyVehicle}
            vehicleTotal={vehicleTotal}
            onHaptic={triggerHaptic}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB CONTENT: 4. SADHANA (MATCHING SCREENSHOT media_1788369685841.png) */}
      {/* ========================================================================= */}
      {activeTab === 'sadhana' && (
        <div className="w-full flex flex-col gap-3">
          <JainPanel
            language={language}
            theme={theme}
            jaapCount={japaCount}
            incrementJaap={() => { setJapaCount(prev => (prev + 1) % 109); triggerHaptic(); }}
            resetJaap={() => { setJapaCount(0); triggerHaptic(); }}
            jainActivity={jainActivity}
            setJainActivity={setJainActivity}
            checklist={jainChecklist}
            toggleChecklistItem={(key) => { setJainChecklist(prev => ({ ...prev, [key]: !prev[key] })); triggerHaptic(); }}
            onHaptic={triggerHaptic}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB CONTENT: 5. FENG SHUI (BAGUA MAP FROM SCREENSHOT) */}
      {/* ========================================================================= */}
      {activeTab === 'feng_shui' && (
        <div className="w-full flex flex-col gap-3">
          <FengShuiPanel
            language={language}
            theme={theme}
            fengshuiDoor={fengshuiDoor}
            setFengshuiDoor={setFengshuiDoor}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. TAB CONTENT: 6. QIBLA (LIVE KAABA BEARING) */}
      {/* ========================================================================= */}
      {activeTab === 'qibla' && (
        <div className="w-full flex flex-col gap-3">
          <div className={cn(
            "w-full rounded-3xl p-4 border flex flex-col gap-3 text-xs text-center",
            theme === 'light'
              ? "border-emerald-900/30 bg-gradient-to-b from-[#ECFDF5] to-[#D1FAE5] shadow-2xl"
              : "border-emerald-900/40 bg-gradient-to-b from-[#0A1E14] to-[#040E0A] shadow-2xl"
          )}>
            <span className={cn("font-black text-sm uppercase tracking-wider flex items-center justify-center gap-1.5", theme === 'light' ? "text-emerald-800" : "text-emerald-300")}>
              <span>↗</span>
              <span>Qibla Direction (Makkah Al-Mukarramah)</span>
            </span>

            <div className={cn("p-3 rounded-2xl border flex flex-col items-center gap-1", theme === 'light' ? "bg-white border-stone-200" : "bg-black/40 border-white/10")}>
              <span className={cn("text-[10px] uppercase font-bold", theme === 'light' ? "text-stone-500" : "text-stone-400")}>Kaaba Bearing from Your GPS:</span>
              <span className={cn("text-3xl font-black font-mono", theme === 'light' ? "text-emerald-700" : "text-emerald-400")}>{qiblaData ? `${qiblaData.qiblaBearing}°` : '—'}</span>
              <span className={cn("text-[10.5px] font-bold", theme === 'light' ? "text-stone-600" : "text-stone-300")}>
                {qiblaData ? `Distance: ${qiblaData.distanceKm} km` : (language === 'hi' ? 'स्थान उपलब्ध नहीं' : 'Location unavailable')}
              </span>
            </div>

            <div className={cn(
              "p-3 rounded-2xl border flex items-center justify-center gap-2 font-black transition-all",
              qiblaData?.isFacingQibla
                ? (theme === 'light' ? "bg-emerald-100 text-emerald-800 border-emerald-400" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.5)]")
                : (theme === 'light' ? "bg-white text-stone-600 border-stone-300" : "bg-stone-900 text-stone-400 border-white/10")
            )}>
              <Navigation className="w-4 h-4" />
              <span>{qiblaData ? (qiblaData.isFacingQibla ? "ALIGNED WITH KAABA ✓" : `Rotate to ${qiblaData.qiblaBearing}° to face Qibla`) : (language === 'hi' ? 'स्थान उपलब्ध नहीं' : 'Location unavailable')}</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. CREATOR BRANDING FOOTER CARD (EXACTLY AS IN ALL SCREENSHOTS) */}
      {/* ========================================================================= */}
      <div className={cn(
        "w-full max-w-sm rounded-[24px] p-4 border shadow-2xl flex flex-col items-center justify-center text-center mt-4",
        theme === 'light'
          ? "bg-gradient-to-r from-[#FEF3C7] via-[#FDE68A] to-[#FCD34D] border-amber-400"
          : "bg-gradient-to-r from-[#181109] via-[#2A180B] to-[#140C04] border-amber-500/40"
      )}>
        <div className="flex items-center gap-2 mb-1">
          <h4 className={cn("text-sm font-serif font-black tracking-wider uppercase", theme === 'light' ? "text-amber-900" : "text-amber-300")}>
            BY AADISH JAIN
          </h4>
          <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-amber-500 text-stone-950 shadow-sm">
            CREATOR
          </span>
        </div>

        <p className={cn("text-[10.5px] font-bold tracking-wide", theme === 'light' ? "text-amber-900" : "text-stone-300")}>
          Spiritual & Vastu Guidance Services
        </p>

        <span className={cn("text-[9px] mt-1 flex items-center gap-1 font-bold", theme === 'light' ? "text-amber-800" : "text-stone-400")}>
          <span>Made with</span>
          <span className="text-rose-500">❤️</span>
          <span>for Spiritual Alignment</span>
        </span>
      </div>

      {/* AR Vastu Scanner Modal */}
      <React.Suspense fallback={null}>
        <ARVastuScanner
          isOpen={showARScanner}
          onClose={() => setShowARScanner(false)}
          heading={currentHeading}
          directionName={liveZone.code}
          selectedRoom={selectedRoom}
          language={language}
          themeColor={customAccentColor}
          onHaptic={triggerHaptic}
        />
      </React.Suspense>

      {/* Floor Plan Overlay Modal */}
      <React.Suspense fallback={null}>
        <FloorPlanOverlayModal
          isOpen={showFloorPlan}
          onClose={() => setShowFloorPlan(false)}
          currentHeading={currentHeading}
          language={language}
          theme={theme}
        />
      </React.Suspense>

      {/* Weather Modal */}
      <React.Suspense fallback={null}>
        <WeatherModal
          isOpen={showWeather}
          onClose={() => setShowWeather(false)}
          language={language}
          theme={theme}
          weather={weather}
          latitude={location?.latitude}
          longitude={location?.longitude}
          cityName={location?.city}
        />
      </React.Suspense>
    </div>
  );
};
