import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
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
  MapPinned,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getAppThemePalette } from '@/lib/themePalettes';

export const VASTU_ACTIVITIES = [
  { id: 'study', labelEn: 'Study', labelHi: 'अध्ययन', icon: '📚' },
  { id: 'work', labelEn: 'Work', labelHi: 'ऑफिस', icon: '💼' },
  { id: 'sleep', labelEn: 'Sleep', labelHi: 'शयन', icon: '🛏️' },
  { id: 'mandir', labelEn: 'Mandir', labelHi: 'मंदिर', icon: '🪔' },
  { id: 'kitchen', labelEn: 'Kitchen', labelHi: 'रसोई', icon: '🍳' },
  { id: 'cash', labelEn: 'Cash', labelHi: 'तिजोरी', icon: '💰' },
  { id: 'toilet', labelEn: 'Toilet', labelHi: 'शौचालय', icon: '🚻' },
] as const;
import { CompassStyleId } from '@/types/compass';
import { CompassDialRenderer } from '@/components/compass/CompassDialRenderer';
import { VASTU_16_ZONES } from '@/data/vastuKnowledgeBase';
import { get32Pada } from '@/lib/vastu32Devta';
import { getChoghadiyaData, VEDIC_RASHIS } from '@/lib/choghadiya';
import { VastuPanel } from '@/components/compass/VastuPanel';
import { VastuEnhancements } from '@/components/compass/VastuEnhancements';
import { DevtaPadaModal } from '@/components/compass/DevtaPadaModal';
import { VastuPada32 } from '@/lib/vastu32Devta';
import { VastuAuditScorecard } from './VastuAuditScorecard';
import { RoomVastuEngine } from './RoomVastuEngine';

// Lazy-loaded secondary sub-tabs & heavy modals (only fetched when opened)
const JainPanel = React.lazy(() => import('@/components/compass/JainPanel').then(m => ({ default: m.JainPanel })));
const FengShuiPanel = React.lazy(() => import('@/components/compass/FengShuiPanel').then(m => ({ default: m.FengShuiPanel })));
const JyotishPanel = React.lazy(() => import('@/components/compass/JyotishPanel').then(m => ({ default: m.JyotishPanel })));
const NumerologyPanel = React.lazy(() => import('@/components/compass/NumerologyPanel').then(m => ({ default: m.NumerologyPanel })));
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
  useTrueNorth?: boolean;
  onRecenter?: () => void;
  triggerHaptic: () => void;
  onCopyCoordinates?: () => void;
  onToggleTorch?: () => void;
  isTorchOn?: boolean;
  isHeadingLocked?: boolean;
  onToggleHeadingLock?: () => void;
  activeSubTab?: VastuSubTab;
  onSubTabChange?: (tab: VastuSubTab) => void;
  openARScannerSignal?: number;
  openFloorPlanSignal?: number;
}

export type VastuSubTab = 'vastu' | 'jyotish' | 'numerology' | 'sadhana' | 'feng_shui' | 'qibla';

const VASTU_TAB_STORAGE_KEY = 'com.spiritual.compass.app_vastu_tab';
const VASTU_ROOM_STORAGE_KEY = 'com.spiritual.compass.app_vastu_room';

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
  useTrueNorth = true,
  onRecenter,
  triggerHaptic,
  onCopyCoordinates = () => {},
  onToggleTorch = () => {},
  isTorchOn = false,
  isHeadingLocked = false,
  onToggleHeadingLock,
  activeSubTab,
  onSubTabChange,
  openARScannerSignal,
  openFloorPlanSignal,
}) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const palette = useMemo(() => getAppThemePalette(selectedStyle, variantId), [selectedStyle, variantId]);
  const isHi = language === 'hi';

  const fallbackDialRef = React.useRef<HTMLDivElement>(null);
  const effectiveDialRef = dialRef || fallbackDialRef;

  // Active Sub-tab (Vastu | Jyotish | Numerology | Sadhana | Feng Shui | Qibla)
  const [activeTab, setActiveTab] = useState<VastuSubTab>(() => {
    if (activeSubTab) return activeSubTab;
    try {
      const saved = localStorage.getItem(VASTU_TAB_STORAGE_KEY);
      if (saved === 'vastu' || saved === 'jyotish' || saved === 'numerology' || saved === 'sadhana' || saved === 'feng_shui' || saved === 'qibla') return saved;
    } catch (e) {
      console.error('Failed to load Vastu tab preference:', e);
    }
    return 'vastu';
  });

  // Sync external tab navigation
  useEffect(() => {
    if (activeSubTab && activeSubTab !== activeTab) {
      setActiveTab(activeSubTab);
    }
  }, [activeSubTab]);

  // Reverse Finder Activity (ONLY for VASTU)
  const [targetActivity, setTargetActivity] = useState<string>('study');

  // Vastu Analyzer Accordion State
  const [isVastuAnalyzerOpen, setIsVastuAnalyzerOpen] = useState<boolean>(true);
  const [analyzerRoomType, setAnalyzerRoomType] = useState<string>('entrance');
  const [analyzerDegrees, setAnalyzerDegrees] = useState<number>(() => {
    return currentHeading !== null ? Math.round(((currentHeading % 360) + 360) % 360) : 0;
  });

  // Saved Rooms (persisted)
  const [savedRooms, setSavedRooms] = useState<SavedRoomEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('com.spiritual.compass.app_saved_rooms') || '[]'); } catch { return []; }
  });

  // 9-Grid Floorplan Mapper (sector keys — matches VastuPanel mapper UI + score)
  const [house9Grid, setHouse9Grid] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('com.spiritual.compass.vastu_9grid');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem('com.spiritual.compass.vastu_9grid', JSON.stringify(house9Grid));
    } catch {}
  }, [house9Grid]);

  // Feng Shui Bagua State
  const [isFengShuiOpen, setIsFengShuiOpen] = useState<boolean>(true);
  const [baguaDoorFacing, setBaguaDoorFacing] = useState<string>('NORTH DOOR');

  // Jyotish State
  const [selectedRashiId, setSelectedRashiId] = useState<string>('aries');
  const [choghadiyaTimeSlot, setChoghadiyaTimeSlot] = useState<'day' | 'night'>('night');

  // Sadhana State
  const [japaCount, setJapaCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('com.spiritual.compass.japa_count');
      if (saved) return parseInt(saved, 10);
    } catch {}
    return 0;
  });
  const [japaTarget] = useState<number>(108);
  const [sadhanaRoutine, setSadhanaRoutine] = useState<'dhyan' | 'study' | 'sleep' | 'eating'>('dhyan');
  const [setupFacing, setSetupFacing] = useState<boolean>(true);
  const [setupAsan, setSetupAsan] = useState<boolean>(true);
  const [setupPeace, setSetupPeace] = useState<boolean>(true);
  const [selectedRoom, setSelectedRoom] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(VASTU_ROOM_STORAGE_KEY);
      if (saved) return saved;
    } catch (e) {
      console.error('Failed to load Vastu room preference:', e);
    }
    return 'entrance';
  });
  const [doorDegree, setDoorDegree] = useState<number>(() => {
    const h = currentHeading ?? 0;
    return Math.round(((h % 360) + 360) % 360);
  });
  const [jainActivity, setJainActivity] = useState<string>('dhyan');
  const [jainChecklist, setJainChecklist] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('com.spiritual.compass.jain_checklist');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { direction: false, katasanu: false, peaceful: false };
  });
  const [fengshuiDoor, setFengshuiDoor] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('com.spiritual.compass.fengshui_door');
      if (saved !== null) return parseInt(saved, 10);
    } catch {}
    const h = currentHeading ?? 0;
    return Math.round(((h % 360) + 360) % 360);
  });
  const [jyotishRashi, setJyotishRashi] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('com.spiritual.compass.jyotish_rashi');
      if (saved) return saved;
    } catch {}
    return 'aries';
  });
  const [numerologyDob, setNumerologyDob] = useState<string>(() => {
    try {
      return localStorage.getItem('com.spiritual.compass.numerology_dob') || '';
    } catch {}
    return '';
  });
  const [numerologyPhone, setNumerologyPhone] = useState<string>(() => {
    try { return localStorage.getItem('com.spiritual.compass.numerology_phone') || ''; } catch { return ''; }
  });
  const [numerologyHouse, setNumerologyHouse] = useState<string>(() => {
    try { return localStorage.getItem('com.spiritual.compass.numerology_house') || ''; } catch { return ''; }
  });
  const [numerologyVehicle, setNumerologyVehicle] = useState<string>(() => {
    try { return localStorage.getItem('com.spiritual.compass.numerology_vehicle') || ''; } catch { return ''; }
  });
  const [showARScanner, setShowARScanner] = useState<boolean>(false);
  const [showFloorPlan, setShowFloorPlan] = useState<boolean>(false);
  const [showWeather, setShowWeather] = useState<boolean>(false);
  const [selectedPadaModal, setSelectedPadaModal] = useState<VastuPada32 | null>(null);

  // Persist Vastu sub-tab + preferences across sessions
  useEffect(() => {
    try { localStorage.setItem(VASTU_TAB_STORAGE_KEY, activeTab); } catch (e) { console.error('Failed to save Vastu tab:', e); }
  }, [activeTab]);
  useEffect(() => {
    try { localStorage.setItem(VASTU_ROOM_STORAGE_KEY, selectedRoom); } catch (e) { console.error('Failed to save Vastu room:', e); }
  }, [selectedRoom]);
  useEffect(() => {
    try { localStorage.setItem('com.spiritual.compass.app_saved_rooms', JSON.stringify(savedRooms)); } catch (e) { console.error('Failed to save Vastu rooms:', e); }
  }, [savedRooms]);
  useEffect(() => {
    try { localStorage.setItem('com.spiritual.compass.japa_count', japaCount.toString()); } catch {}
  }, [japaCount]);
  useEffect(() => {
    try { localStorage.setItem('com.spiritual.compass.jain_checklist', JSON.stringify(jainChecklist)); } catch {}
  }, [jainChecklist]);
  useEffect(() => {
    try { localStorage.setItem('com.spiritual.compass.fengshui_door', fengshuiDoor.toString()); } catch {}
  }, [fengshuiDoor]);
  useEffect(() => {
    try { localStorage.setItem('com.spiritual.compass.jyotish_rashi', jyotishRashi); } catch {}
  }, [jyotishRashi]);
  useEffect(() => {
    try {
      if (numerologyDob) localStorage.setItem('com.spiritual.compass.numerology_dob', numerologyDob);
    } catch {}
  }, [numerologyDob]);
  useEffect(() => {
    try {
      if (numerologyPhone) localStorage.setItem('com.spiritual.compass.numerology_phone', numerologyPhone);
    } catch {}
  }, [numerologyPhone]);
  useEffect(() => {
    try {
      if (numerologyHouse) localStorage.setItem('com.spiritual.compass.numerology_house', numerologyHouse);
    } catch {}
  }, [numerologyHouse]);
  useEffect(() => {
    try {
      if (numerologyVehicle) localStorage.setItem('com.spiritual.compass.numerology_vehicle', numerologyVehicle);
    } catch {}
  }, [numerologyVehicle]);

  // Handle external signals from FeatureExplorer
  useEffect(() => {
    if (openARScannerSignal && openARScannerSignal > 0) {
      setShowARScanner(true);
    }
  }, [openARScannerSignal]);

  useEffect(() => {
    if (openFloorPlanSignal && openFloorPlanSignal > 0) {
      setShowFloorPlan(true);
    }
  }, [openFloorPlanSignal]);

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
    if (!numerologyDob) {
      return { mulank: 0, bhagyank: 0, loShuCounts: null };
    }
    try {
      const parts = numerologyDob.split('-');
      if (parts.length < 3) return { mulank: 0, bhagyank: 0, loShuCounts: null };
      const d = parseInt(parts[2], 10);
      const m = parseInt(parts[1], 10);
      const y = parseInt(parts[0], 10);
      if (!d || !m || !y) return { mulank: 0, bhagyank: 0, loShuCounts: null };
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
      return { mulank: 0, bhagyank: 0, loShuCounts: null };
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

    const rawH = currentHeading || 0;
    const trueH = useTrueNorth ? rawH : ((rawH + declination) % 360 + 360) % 360;
    const headingDiff = Math.abs(((trueH - qiblaBearing + 540) % 360) - 180);
    const isFacingQibla = headingDiff <= 3.5;

    return { qiblaBearing: Math.round(qiblaBearing), distanceKm, isFacingQibla };
  }, [location, currentHeading, useTrueNorth, declination]);

  // Display Heading & Tilts
  const normHeading = currentHeading !== null ? ((currentHeading % 360) + 360) % 360 : 0;
  const displayDeg = currentHeading !== null ? Math.round(normHeading) % 360 : 0;
  const totalTilt = Math.sqrt(pitch * pitch + roll * roll);

  // Live 8-Direction Zone (Primary 8 directions only: N, NE, E, SE, S, SW, W, NW)
  const live8Zone = useMemo(() => {
    const CARDINAL_8 = [
      { code: 'N', nameEn: 'North', nameHi: 'उत्तर' },
      { code: 'NE', nameEn: 'North-East', nameHi: 'ईशान' },
      { code: 'E', nameEn: 'East', nameHi: 'पूर्व' },
      { code: 'SE', nameEn: 'South-East', nameHi: 'आग्नेय' },
      { code: 'S', nameEn: 'South', nameHi: 'दक्षिण' },
      { code: 'SW', nameEn: 'South-West', nameHi: 'नैऋत्य' },
      { code: 'W', nameEn: 'West', nameHi: 'पश्चिम' },
      { code: 'NW', nameEn: 'North-West', nameHi: 'वायव्य' }
    ];
    const octant = Math.round(normHeading / 45) % 8;
    return CARDINAL_8[octant];
  }, [normHeading]);

  // Live Zone & Pada (16 sub-zones for internal astrological advice lookup)
  const liveZone = useMemo(() => {
    return VASTU_16_ZONES.find(z => {
      if (z.code === 'N') {
        return normHeading >= 348.75 || normHeading < 11.25;
      }
      return normHeading >= z.startDeg && normHeading < z.endDeg;
    }) || VASTU_16_ZONES[0];
  }, [normHeading]);

  const livePada = useMemo(() => get32Pada(currentHeading), [currentHeading]);
  const analyzerPada = useMemo(() => get32Pada(analyzerDegrees), [analyzerDegrees]);

  // Choghadiya Data
  const choghadiya = useMemo(() => getChoghadiyaData(new Date()), []);

  // Selected Rashi Info
  const selectedRashi = useMemo(() => {
    return VEDIC_RASHIS.find(r => r.id === selectedRashiId) || VEDIC_RASHIS[0];
  }, [selectedRashiId]);

  // Live heading advice (for Vastu)
  const liveHeadingAdvice = useMemo(() => {
    const hi = language === 'hi';
    switch (liveZone.code) {
      case 'N':
        return hi ? { idealFor: 'धन संचय, करियर अवसर, तिजोरी/लॉकर', avoidFor: 'रसोई की आग, शौचालय, भारी अव्यवस्था' } : { idealFor: 'Wealth Accumulation, Career Opportunities, Safe/Locker', avoidFor: 'Kitchen Fire, Toilet, Heavy Clutter' };
      case 'NNE':
        return hi ? { idealFor: 'दवा कैबिनेट, स्वास्थ्य उपचार, रिकवरी', avoidFor: 'शौचालय, कूड़ेदान' } : { idealFor: 'Medicine Cabinet, Health Healing, Recovery', avoidFor: 'Toilet, Dustbin' };
      case 'NE':
        return hi ? { idealFor: 'पूजा मंदिर, ध्यान, आध्यात्मिक फोकस, अध्ययन', avoidFor: 'शौचालय (प्रमुख दोष), रसोई, भारी सीढ़ियां' } : { idealFor: 'Pooja Mandir, Meditation, Spiritual Focus, Study', avoidFor: 'Toilet (Major Dosha), Kitchen, Heavy Stairs' };
      case 'ENE':
        return hi ? { idealFor: 'मनोरंजन, पारिवारिक लाउंज, ताजगी', avoidFor: 'शौचालय, भारी कबाड़' } : { idealFor: 'Recreation, Family Lounge, Refreshment', avoidFor: 'Toilet, Heavy Junk' };
      case 'E':
        return hi ? { idealFor: 'सामाजिक नेटवर्किंग, मुख्य प्रवेश द्वार, पूर्व मुख अध्ययन', avoidFor: 'शौचालय, अंधेरा कबाड़, बंद खिड़कियां' } : { idealFor: 'Social Networking, Main Entrance, East-facing Study', avoidFor: 'Toilet, Dark Clutter, Blocked Windows' };
      case 'ESE':
        return hi ? { idealFor: 'मिक्सर/ग्राइंडर, वॉशिंग मशीन, मंथन', avoidFor: 'शयनकक्ष (गंभीर चिंता और अनिद्रा), मंदिर' } : { idealFor: 'Churning, Mixer/Grinder, Washing Machine', avoidFor: 'Bedroom (Severe Anxiety & Insomnia), Mandir' };
      case 'SE':
        return hi ? { idealFor: 'रसोई गैस चूल्हा, अग्नि तत्व, बिजली इन्वर्टर', avoidFor: 'पानी की टंकी, शयनकक्ष, नीले/काले रंग' } : { idealFor: 'Kitchen Gas Stove, Fire Element, Electrical Inverter', avoidFor: 'Water Tank, Bedroom, Blue/Black Colors' };
      case 'SSE':
        return hi ? { idealFor: 'जिम, कसरत, शारीरिक सहनशक्ति, अनाज', avoidFor: 'शौचालय, भूमिगत गड्ढा' } : { idealFor: 'Gym, Workout, Physical Stamina, Grains', avoidFor: 'Toilet, Underground Pit' };
      case 'S':
        return hi ? { idealFor: 'गहरी नींद, भारी फर्नीचर, आराम', avoidFor: 'भूमिगत टंकी, पानी के फव्वारे' } : { idealFor: 'Deep Restful Sleep, Heavy Furniture, Rest', avoidFor: 'Underground Tank, Water Fountains' };
      case 'SSW':
        return hi ? { idealFor: 'शौचालय और सेप्टिक टैंक (निपटान का आदर्श क्षेत्र)', avoidFor: 'शयनकक्ष, नकद तिजोरी, मंदिर' } : { idealFor: 'Toilet & Septic Tank (Ideal Zone of Disposal)', avoidFor: 'Bedroom, Cash Safe, Mandir' };
      case 'SW':
        return hi ? { idealFor: 'मास्टर बेडरूम, परिवार मुखिया, स्थिरता, ओवरहेड टैंक', avoidFor: 'शौचालय, भूमिगत टंकी, मंदिर' } : { idealFor: 'Master Bedroom, Head of Family, Stability, Overhead Tank', avoidFor: 'Toilet, Underground Tank, Mandir' };
      case 'WSW':
        return hi ? { idealFor: 'विद्या पद: अध्ययन डेस्क, किताबें, ज्ञान, बचत', avoidFor: 'शौचालय (शिक्षा बहा देता है), रसोई' } : { idealFor: 'Vidya Pada: Study Desk, Books, Knowledge, Savings', avoidFor: 'Toilet (Washes away education), Kitchen' };
      case 'W':
        return hi ? { idealFor: 'व्यापार लाभ, लाभ, भोजन कक्ष, बच्चों का बेडरूम', avoidFor: 'भूमिगत पानी की टंकी' } : { idealFor: 'Business Profits, Gains, Dining Room, Kids Bedroom', avoidFor: 'Underground Water Tank' };
      case 'WNW':
        return hi ? { idealFor: 'भावनात्मक डिटॉक्स, शोक मुक्ति, बेकार कागज', avoidFor: 'शयनकक्ष (अवसाद), अध्ययन डेस्क' } : { idealFor: 'Emotional Detoxing, Releasing Grief, Waste Paper', avoidFor: 'Bedroom (Depression), Study Desk' };
      case 'NW':
        return hi ? { idealFor: 'अतिथि कक्ष, बैंकिंग, सहायता, तैयार माल', avoidFor: 'मास्टर बेडरूम, भारी स्थिर तिजोरी' } : { idealFor: 'Guest Room, Banking, Support, Ready Goods', avoidFor: 'Master Bedroom, Heavy Fixed Vaults' };
      case 'NNW':
        return hi ? { idealFor: 'नवविवाहित जोड़ा, रोमांस, आकर्षण, वस्त्र', avoidFor: 'बच्चों का अध्ययन डेस्क, शौचालय' } : { idealFor: 'Newly Married Couple, Romance, Charm, Attire', avoidFor: 'Children Study Desk, Toilet' };
      default:
        return hi ? { idealFor: 'सामान्य कार्य', avoidFor: 'अव्यवस्था' } : { idealFor: 'General Work', avoidFor: 'Clutter' };
    }
  }, [liveZone.code, language]);

  // Reverse activity finder (for Vastu)
  const activityDirections = useMemo(() => {
    switch (targetActivity) {
      case 'study':
        return {
          title: language === 'hi' ? 'अध्ययन एवं प्रतियोगी परीक्षाएं' : 'Study & Competitive Exams',
          bestCodes: ['WSW', 'NE', 'E', 'N'],
          bestZones: ['WSW (236°-258°)', 'NE (34°-56°)', 'East (79°-101°)'],
          facing: language === 'hi' ? 'पूर्व या उत्तर दिशा की ओर मुख करके अध्ययन करें।' : 'Face East (Retention) or North (Analytical focus).',
          targetDeg: 247.5,
          color: 'text-indigo-400'
        };
      case 'work':
        return {
          title: language === 'hi' ? 'घर से कार्य एवं कार्यालय' : 'Work From Home & Office',
          bestCodes: ['N', 'W', 'E', 'NE'],
          bestZones: ['North (349°-11°)', 'West (259°-281°)', 'East (79°-101°)'],
          facing: language === 'hi' ? 'उत्तर (करियर अवसर) या पूर्व की ओर मुख करके बैठें।' : 'Sit facing North (Career opportunities) or East.',
          targetDeg: 0,
          color: 'text-sky-400'
        };
      case 'sleep':
        return {
          title: language === 'hi' ? 'मास्टर बेडरूम एवं शयन' : 'Master Bedroom & Sleep',
          bestCodes: ['SW', 'S', 'W'],
          bestZones: ['SW (214°-236°)', 'South (169°-191°)', 'West (259°-281°)'],
          facing: language === 'hi' ? 'सिर दक्षिण (सर्वोत्तम) या पूर्व की ओर रखें। उत्तर में कभी नहीं।' : 'Head towards South (Best) or East. Never North.',
          targetDeg: 225,
          color: 'text-amber-400'
        };
      case 'mandir':
        return {
          title: language === 'hi' ? 'पूजा मंदिर एवं ध्यान' : 'Pooja Mandir & Spiritual Space',
          bestCodes: ['NE', 'E', 'N'],
          bestZones: ['NE (34°-56°)', 'East (79°-101°)', 'North (349°-11°)'],
          facing: language === 'hi' ? 'प्रार्थना के समय मुख पूर्व या उत्तर की ओर होना चाहिए।' : 'Devotee faces East or North during prayer.',
          targetDeg: 45,
          color: 'text-yellow-400'
        };
      case 'kitchen':
        return {
          title: language === 'hi' ? 'रसोई एवं गैस चूल्हा' : 'Kitchen & Gas Stove',
          bestCodes: ['SE', 'SSE', 'NW'],
          bestZones: ['SE (124°-146°)', 'SSE (146°-169°)', 'NW (304°-326°)'],
          facing: language === 'hi' ? 'खाना बनाते समय मुख पूर्व की ओर होना चाहिए।' : 'Cook must face East while cooking.',
          targetDeg: 135,
          color: 'text-orange-400'
        };
      case 'cash':
        return {
          title: language === 'hi' ? 'तिजोरी एवं धन लॉकर' : 'Cash Vault & Wealth Safe',
          bestCodes: ['N', 'SW', 'W'],
          bestZones: ['North (349°-11°)', 'SW (214°-236°)', 'West (259°-281°)'],
          facing: language === 'hi' ? 'तिजोरी का दरवाजा उत्तर (कुबेर स्थान) की ओर खुलना चाहिए।' : 'Locker door must open towards North (Lord Kuber).',
          targetDeg: 0,
          color: 'text-emerald-400'
        };
      case 'toilet':
        return {
          title: language === 'hi' ? 'शौचालय एवं सेप्टिक टैंक' : 'Toilet & Septic Tank',
          bestCodes: ['SSW', 'WNW', 'ESE'],
          bestZones: ['SSW (191°-214°)', 'WNW (281°-304°)', 'ESE (101°-124°)'],
          facing: language === 'hi' ? 'शौच करते समय मुख उत्तर या दक्षिण की ओर होना चाहिए।' : 'Commode user should face North or South.',
          targetDeg: 202.5,
          color: 'text-purple-400'
        };
      default:
        return {
          title: language === 'hi' ? 'अध्ययन कक्ष' : 'Study Room',
          bestCodes: ['WSW', 'NE', 'E'],
          bestZones: ['WSW', 'NE', 'East'],
          facing: language === 'hi' ? 'पूर्व या उत्तर की ओर मुख करें।' : 'Face East or North.',
          targetDeg: 247.5,
          color: 'text-indigo-400'
        };
    }
  }, [targetActivity, language]);

  const isActivityMatched = useMemo(() => {
    return activityDirections.bestCodes.includes(liveZone.code);
  }, [activityDirections.bestCodes, liveZone.code]);

  const isAuspiciousDirection = useMemo(() => {
    return ['NE', 'N', 'E', 'SE', 'SW'].includes(liveZone.code);
  }, [liveZone.code]);

  const headingDeviation = useMemo(() => {
    return ((displayDeg - activityDirections.targetDeg + 540) % 360) - 180;
  }, [displayDeg, activityDirections.targetDeg]);

  // 9-grid score — single source of truth (drives dashboard card + VastuPanel header/badge)
  const houseGridScore = useMemo(() => {
    const ideal: Record<string, string[]> = {
      NW: ['bathroom', 'guest', 'kitchen'],
      N: ['entrance', 'cash', 'business', 'naukari', 'study'],
      NE: ['pooja', 'water_underground', 'study'],
      W: ['study', 'bathroom', 'water_overhead'],
      CENTER: ['open'],
      E: ['entrance', 'study', 'pooja'],
      SW: ['master_bedroom', 'staircase', 'water_overhead'],
      S: ['staircase', 'naukari'],
      SE: ['kitchen']
    };
    const sectors = Object.keys(house9Grid).filter(k => Boolean(house9Grid[k]));
    if (sectors.length === 0) return null;
    let correct = 0;
    sectors.forEach(sector => {
      if (ideal[sector]?.includes(house9Grid[sector])) correct += 1;
    });
    return Math.round((correct / Math.max(sectors.length, 1)) * 100);
  }, [house9Grid]);

  const premiumInsight = useMemo(() => {
    const hi = language === 'hi';
    if (activeTab === 'qibla') return hi ? 'कम्पास, झुकाव और पवित्र दिशा मार्गदर्शन एक कैलिब्रेटेड दृश्य में संरेखित हैं।' : 'Compass, tilt, and sacred-direction guidance are aligned in one calibrated view.';
    if (livePada.isAuspicious) return hi ? `वर्तमान ${livePada.code} पद ${liveHeadingAdvice.idealFor.toLowerCase()} के लिए सहायक है।` : `Current ${livePada.code} pada is supportive for ${liveHeadingAdvice.idealFor.toLowerCase()}.`;
    return hi ? `वर्तमान दिशा ${liveHeadingAdvice.avoidFor.toLowerCase()} के लिए टालना बेहतर है; नीचे रिवर्स फाइंडर का उपयोग करें।` : `Current heading is better avoided for ${liveHeadingAdvice.avoidFor.toLowerCase()}; use the reverse finder below.`;
  }, [activeTab, livePada, liveHeadingAdvice, language]);

  const handleSaveRoom = (name?: string) => {
    const newEntry: SavedRoomEntry = {
      id: Date.now().toString(),
      roomType: name || analyzerRoomType,
      degrees: analyzerDegrees,
      padaCode: analyzerPada.code,
      isAuspicious: analyzerPada.isAuspicious,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setSavedRooms(prev => [newEntry, ...prev]);
    triggerHaptic();
    toast.success(language === 'hi' ? `${newEntry.roomType} सहेजा गया!` : `${newEntry.roomType} saved!`);
  };

  const handleLoadRoom = (id: string) => {
    const room = savedRooms.find(r => r.id === id);
    if (!room) return;
    setAnalyzerRoomType(room.roomType);
    setAnalyzerDegrees(room.degrees);
    setSelectedRoom(room.roomType);
    triggerHaptic();
  };

  return (
    <div className={cn(
      "w-full max-w-xl flex flex-col items-center select-none pb-28 sm:pb-32 animate-in fade-in",
      palette.isLight ? "text-stone-900" : "text-white"
    )}>

      {/* ========================================================================= */}
      {/* 1. THE 6 SUB-TABS (Vastu | Jyotish | Numerology | Sadhana | Feng Shui | Qibla) */}
      {/* ========================================================================= */}
      <div className="w-full max-w-xl flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className={cn(
            "text-[11px] sm:text-[11.5px] font-black uppercase tracking-wider",
            palette.isLight ? 'text-stone-900 font-extrabold' : 'text-stone-100'
          )}>
            {language === 'hi' ? 'वास्तु 6-इन-1 सुइट' : 'VASTU 6-IN-1 SUITE'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowARScanner(true);
              triggerHaptic();
            }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-xl border font-black text-[11px] sm:text-xs tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer",
              palette.isLight
                ? "bg-purple-100 text-purple-950 border-purple-300 hover:bg-purple-200 shadow-purple-500/10"
                : "bg-purple-600/30 text-purple-100 border-purple-400/60 hover:bg-purple-600/40 shadow-[0_0_12px_rgba(168,85,247,0.35)]"
            )}
            title="AR Vastu Camera"
          >
            <Camera className="w-3.5 h-3.5 shrink-0 stroke-[2.5] text-purple-700 dark:text-purple-300" />
            <span>{language === 'hi' ? 'AR वास्तु' : 'AR Vastu'}</span>
          </button>
          <button
            onClick={() => {
              setShowFloorPlan(true);
              triggerHaptic();
            }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-xl border font-black text-[11px] sm:text-xs tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer",
              palette.isLight
                ? "bg-cyan-100 text-cyan-950 border-cyan-300 hover:bg-cyan-200 shadow-cyan-500/10"
                : "bg-cyan-600/30 text-cyan-100 border-cyan-400/60 hover:bg-cyan-600/40 shadow-[0_0_12px_rgba(6,182,212,0.35)]"
            )}
            title="Floor Plan Blueprint"
          >
            <Layers className="w-3.5 h-3.5 shrink-0 stroke-[2.5] text-cyan-700 dark:text-cyan-300" />
            <span>{language === 'hi' ? 'नक्शा Blueprint' : 'Blueprint'}</span>
          </button>
        </div>
      </div>

      <div 
        className="w-full max-w-xl flex items-center gap-2 overflow-x-auto no-scrollbar py-1 my-1 touch-pan-x overscroll-contain"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {[
          { id: 'vastu', label: language === 'hi' ? 'वास्तु' : 'Vastu', icon: '✨', activeBg: 'bg-amber-500 text-stone-950 border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.5)]', inactiveLight: 'bg-amber-100 text-amber-900 border-amber-300', inactiveDark: 'bg-amber-500/10 text-amber-300 border-amber-500/25' },
          { id: 'jyotish', label: language === 'hi' ? 'ज्योतिष' : 'Jyotish', icon: '⭐', activeBg: 'bg-purple-600 text-white border-purple-400 shadow-[0_0_14px_rgba(168,85,247,0.5)]', inactiveLight: 'bg-purple-100 text-purple-900 border-purple-300', inactiveDark: 'bg-purple-500/10 text-purple-300 border-purple-500/25' },
          { id: 'numerology', label: language === 'hi' ? 'अंक शास्त्र' : 'Numerology', icon: '#', activeBg: 'bg-cyan-500 text-stone-950 border-cyan-400 shadow-[0_0_14px_rgba(6,182,212,0.5)]', inactiveLight: 'bg-cyan-100 text-cyan-900 border-cyan-300', inactiveDark: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25' },
          { id: 'sadhana', label: language === 'hi' ? 'साधना' : 'Sadhana', icon: '⊙', activeBg: 'bg-orange-500 text-white border-orange-400 shadow-[0_0_14px_rgba(249,115,22,0.5)]', inactiveLight: 'bg-orange-100 text-orange-900 border-orange-300', inactiveDark: 'bg-orange-500/10 text-orange-300 border-orange-500/25' },
          { id: 'feng_shui', label: language === 'hi' ? 'फेंग शुई' : 'Feng Shui', icon: '🧭', activeBg: 'bg-teal-600 text-white border-teal-400 shadow-[0_0_14px_rgba(13,148,136,0.5)]', inactiveLight: 'bg-teal-100 text-teal-900 border-teal-300', inactiveDark: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' },
          { id: 'qibla', label: language === 'hi' ? 'किबला' : 'Qibla', icon: '↗', activeBg: 'bg-teal-600 text-white border-teal-400 shadow-[0_0_14px_rgba(13,148,136,0.5)]', inactiveLight: 'bg-teal-100 text-teal-900 border-teal-300', inactiveDark: 'bg-teal-500/10 text-teal-300 border-teal-500/25' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                const newTab = tab.id as VastuSubTab;
                setActiveTab(newTab);
                onSubTabChange?.(newTab);
                triggerHaptic();
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-[11px] font-black tracking-wider whitespace-nowrap transition-all duration-200 shrink-0 border flex items-center gap-1.5 shadow-sm active:scale-95",
                isActive
                  ? `${tab.activeBg} scale-[1.03]`
                  : (palette.isLight ? `${tab.inactiveLight} hover:scale-[1.02]` : `${tab.inactiveDark} hover:scale-[1.02]`)
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
          declination={declination}
          useTrueNorth={useTrueNorth}
          needleTracksNorth={false}
          isFrozen={isHeadingLocked}
          onSelectPada={(pada) => {
            triggerHaptic();
            setSelectedPadaModal(pada);
          }}
          onRecenter={onRecenter}
          dialRef={effectiveDialRef}
          customAccentColor={customAccentColor}
          variantId={variantId}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />

        {/* Quick Hold / Freeze Reading Pill directly below Vastu Dial */}
        {onToggleHeadingLock && (
          <div className="flex items-center justify-center gap-2 mt-1">
            <button
              onClick={onToggleHeadingLock}
              className={cn(
                "px-3.5 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shadow-md",
                isHeadingLocked
                  ? "bg-amber-500 text-stone-950 border-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.55)]"
                  : palette.isLight
                    ? "bg-white/95 text-stone-800 border-stone-300 hover:border-amber-400"
                    : "bg-stone-900/90 text-stone-200 border-white/15 hover:border-amber-500/40"
              )}
              title={language === 'hi' ? 'वास्तु रीडिंग पढ़ने के लिए दिशा स्थिर करें (Hold / Freeze)' : 'Hold / Freeze compass reading while inspecting Vastu remedies'}
            >
              <Lock className={cn("w-3.5 h-3.5", isHeadingLocked ? "text-stone-950" : "text-amber-400")} />
              <span>
                {isHeadingLocked
                  ? (language === 'hi' ? `लॉक: ${displayDeg}° (${livePada.code})` : `HELD: ${displayDeg}° (${livePada.code})`)
                  : (language === 'hi' ? 'रीडिंग होल्ड करें' : 'HOLD READING')}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Vastu Quick Dashboard Card — Matches active dial palette */}
      <div className={cn(
        "w-full max-w-xl rounded-[28px] p-4 border flex flex-col gap-3 my-2 transition-all duration-300",
        palette.telemetryCardBg,
        palette.telemetryCardBorder
      )}>
        {/* Top Badges & Actions */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[9px] font-black uppercase tracking-wider",
              location?.accuracy != null
                ? location.accuracy <= 15
                  ? (palette.isLight ? "text-teal-700" : "text-emerald-400")
                  : location.accuracy <= 50
                  ? (palette.isLight ? "text-amber-700" : "text-amber-400")
                  : "text-red-400"
                : (palette.isLight ? "text-teal-700" : "text-emerald-400")
            )}>
              {location?.accuracy != null
                ? `${location.accuracy <= 15 ? 'HIGH' : location.accuracy <= 50 ? 'MED' : 'LOW'} ACC ±${Math.round(location.accuracy)}m`
                : 'HIGH ACC'}
            </span>
            <span className={cn("text-[9px] font-black uppercase tracking-wider", palette.isLight ? "text-sky-700" : "text-sky-400")}>
              Δ {declination > 0 ? `+${declination}°` : `${declination}°`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button onClick={() => { setShowARScanner(true); triggerHaptic(); }} className={cn(
              "w-8 h-8 rounded-full border flex items-center justify-center active:scale-95 transition-all shadow-sm",
              palette.isLight ? "bg-amber-100 border-amber-400 text-amber-800" : "bg-amber-500/20 border-amber-500/40 text-amber-300"
            )} title={language === 'hi' ? 'लाइव AR वास्तु स्कैनर' : 'Open AR Vastu Scanner'}>
              <Camera className={cn("w-4 h-4", palette.isLight ? "text-amber-700" : "text-amber-400")} />
            </button>
            <button onClick={onToggleTorch} className={cn("w-8 h-8 rounded-full border flex items-center justify-center active:scale-95 transition-all shadow-sm", isTorchOn ? "bg-emerald-500 text-stone-950 border-emerald-400" : (palette.isLight ? "bg-teal-100 text-teal-800 border-teal-400" : "bg-emerald-950/60 text-emerald-400 border-emerald-500/40"))}>
              <Zap className="w-4 h-4" />
            </button>
            <button onClick={onCopyCoordinates} className={cn(
              "w-8 h-8 rounded-full border flex items-center justify-center active:scale-95 transition-all shadow-sm",
              palette.isLight ? "bg-white border-stone-300 text-stone-700" : "bg-stone-800/80 border-white/15 text-stone-300"
            )}>
              <Copy className={cn("w-4 h-4", palette.isLight ? "text-stone-700" : "text-stone-300")} />
            </button>
          </div>
        </div>

        {/* Big Heading Readout Box: 16 Authentic Vastu Zones (e.g. 336° North-North-West (NNW)) */}
        <div className={cn(
          "w-full p-2.5 rounded-2xl flex items-center justify-between shadow-md gap-2 border transition-all duration-300",
          palette.isLight
            ? "bg-white/80 border-stone-300/80 text-stone-900 shadow-sm"
            : "bg-black/35 border-white/15 text-white"
        )}>
          <div className="flex flex-col text-left min-w-0">
            <span className={cn("text-lg sm:text-xl font-black font-serif tracking-tight truncate", palette.headingText)}>
              {displayDeg}° {language === 'hi' ? liveZone.nameHi : liveZone.nameEn} ({liveZone.code})
            </span>
            <span className={cn(
              "text-[10px] font-bold tracking-wider",
              palette.isLight ? "text-stone-600" : "text-stone-300"
            )}>
              {language === 'hi' ? `${liveZone.elementHi} • ${liveZone.deityHi}` : `${liveZone.element} • ${liveZone.deity}`} ({liveZone.startDeg}° - {liveZone.endDeg}°)
            </span>
          </div>
          <span className={cn(
            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 border transition-colors",
            palette.pillBg,
            palette.pillBorder,
            palette.pillUnitText
          )}>
            16 ZONES
          </span>
        </div>

        {/* Location & Coordinates (single clean line to save space) */}
        <div className="text-center px-1">
          <div className={cn("text-[11px] font-black uppercase tracking-wider truncate", palette.isLight ? "text-stone-700" : "text-stone-200")}>
            {location?.city
              ? `${language === 'hi' ? location.city : (location.cityEn || location.city)}${location.state ? `, ${language === 'hi' ? location.state : (location.stateEn || location.state)}` : ''}`
              : (language === 'hi' ? 'स्थान उपलब्ध नहीं' : 'Location unavailable')}
            <span className={cn("text-[10px] font-mono font-bold ml-1.5", palette.isLight ? "text-stone-600" : "text-stone-400")}>
              • {location ? `${location.latitude.toFixed(4)}°N, ${location.longitude.toFixed(4)}°E` : ''}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div 
            onClick={() => {
              triggerHaptic();
              setSelectedPadaModal(livePada);
            }}
            className={cn(
              "rounded-2xl border px-3 py-2 cursor-pointer transition-all active:scale-95",
              palette.isLight ? "border-stone-300/80 bg-white/70 shadow-sm" : "border-white/10 bg-black/25"
            )}
            title="Tap to inspect Devta Pada"
          >
            <div className={cn("flex items-center justify-between text-[9px] uppercase tracking-[0.18em]", palette.isLight ? "text-stone-600" : "text-stone-400")}>
              <div className="flex items-center gap-1">
                <ShieldCheck className={cn("w-3 h-3", palette.pillUnitText)} />
                <span>Pada</span>
              </div>
              <Sparkles className="w-2.5 h-2.5 opacity-80" />
            </div>
            <div className={cn("mt-1 text-sm font-black flex items-center justify-between", palette.headingText)}>
              <span>{livePada.code}</span>
              <span className={cn("text-[10px] font-bold font-sans", palette.pillUnitText)}>{language === 'hi' ? livePada.nameHi : livePada.nameEn}</span>
            </div>
          </div>
          <div className={cn("rounded-2xl border px-3 py-2", palette.isLight ? "border-stone-300/80 bg-white/70 shadow-sm" : "border-white/10 bg-black/25")}>
            <div className={cn("flex items-center gap-1 text-[9px] uppercase tracking-[0.18em]", palette.isLight ? "text-stone-600" : "text-stone-400")}>
              <Gauge className={cn("w-3 h-3", palette.pillUnitText)} />
              <span>Tilt</span>
            </div>
            <div className={cn("mt-1 text-sm font-black", palette.headingText)}>{totalTilt.toFixed(1)}°</div>
          </div>
          <div className={cn("rounded-2xl border px-3 py-2", palette.isLight ? "border-stone-300/80 bg-white/70 shadow-sm" : "border-white/10 bg-black/25")}>
            <div className={cn("flex items-center gap-1 text-[9px] uppercase tracking-[0.18em]", palette.isLight ? "text-stone-600" : "text-stone-400")}>
              <MapPinned className={cn("w-3 h-3", palette.pillUnitText)} />
              <span>Score</span>
            </div>
            <div className={cn("mt-1 text-sm font-black", palette.headingText)}>
              {houseGridScore !== null ? `${houseGridScore}%` : '—'}
            </div>
          </div>
        </div>

        {/* Pitch / Roll / Level integrated into bottom of dashboard */}
        <div className={cn("w-full flex items-center justify-between px-3 py-2 rounded-2xl border", palette.isLight ? "border-stone-300/80 bg-white/70" : "border-white/10 bg-black/25")}>
          <div className="flex items-center gap-1.5">
            <span className={cn("text-[9px] uppercase tracking-[0.18em]", palette.isLight ? "text-stone-600" : "text-stone-400")}>PITCH</span>
            <span className={cn("text-sm font-black font-mono", palette.pillUnitText)}>{Math.round(pitch)}°</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn("text-[9px] uppercase tracking-[0.18em]", palette.isLight ? "text-stone-600" : "text-stone-400")}>ROLL</span>
            <span className={cn("text-sm font-black font-mono", palette.pillUnitText)}>{Math.round(roll)}°</span>
          </div>
          <span className={cn(
            "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider",
            isLevel
              ? (palette.isLight ? "bg-emerald-100 text-emerald-800 border-emerald-400" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.4)]")
              : (palette.isLight ? "bg-rose-100 text-rose-700 border-rose-400" : "bg-rose-950/60 text-rose-300 border-rose-500/40")
          )}>
            {isLevel ? 'LEVEL' : 'TILT'}
          </span>
        </div>
      </div>

      {/* Live Premium Insight & 32-Pada Main Entrance Banner — Styled to active dial theme palette */}
      <div className={cn(
        "w-full max-w-xl rounded-[26px] p-4 border flex flex-col gap-2 mb-2 transition-all duration-300",
        palette.telemetryCardBg,
        palette.telemetryCardBorder
      )}>
        <div className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em]", palette.headingText)}>
          <ScanSearch className="w-3.5 h-3.5" />
          <span>{language === 'hi' ? 'लाइव प्रीमियम इनसाइट' : 'Live Premium Insight'}</span>
        </div>
        <p className={cn("text-sm font-black", palette.headingText)}>{premiumInsight}</p>
        <p className={cn("text-[11px] leading-relaxed", palette.isLight ? "text-stone-700" : "text-stone-300")}>
          {language === 'hi' ? 'इसके लिए आदर्श:' : 'Ideal for:'} <span className={palette.pillUnitText}>{liveHeadingAdvice.idealFor}</span>. {language === 'hi' ? 'इससे बचें:' : 'Avoid for:'} <span className={palette.dirText}>{liveHeadingAdvice.avoidFor}</span>.
        </p>

        {/* 32-Pada Main Entrance (Mukhya Dwar) Auspiciousness Finder Banner */}
        {(() => {
          const SUPREME_ENTRANCE_PADAS = ['N3', 'N4', 'E3', 'E4', 'S4', 'W3', 'W4', 'W5'];
          const SEVERE_ENTRANCE_PADAS = ['S5', 'S6', 'S7', 'S8', 'W1', 'W2', 'E1', 'E8', 'N1', 'N8'];
          const isBestEntrance = SUPREME_ENTRANCE_PADAS.includes(livePada.code);
          const isSevereEntrance = SEVERE_ENTRANCE_PADAS.includes(livePada.code);
          return (
            <div
              onClick={() => {
                triggerHaptic();
                setSelectedPadaModal(livePada);
              }}
              className={cn(
                "mt-1.5 p-2.5 rounded-2xl border cursor-pointer transition-all active:scale-[0.99] flex flex-col gap-1 shadow-sm",
                palette.isLight
                  ? "bg-white/80 border-stone-300/80 text-stone-900"
                  : "bg-black/35 border-white/15 text-stone-100"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={cn("text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5", palette.headingText)}>
                  <span>🚪</span>
                  <span>
                    {language === 'hi'
                      ? `मुख्य द्वार निर्णय: ${livePada.code} (${livePada.nameHi})`
                      : `Main Door Verdict: ${livePada.code} (${livePada.nameEn})`}
                  </span>
                </span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase shrink-0 border",
                  isBestEntrance
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-black shadow-sm"
                    : isSevereEntrance
                    ? "bg-rose-500/20 text-rose-400 border-rose-500/40 font-black"
                    : `${palette.pillBg} ${palette.pillBorder} ${palette.pillUnitText} font-black`
                )}>
                  {isBestEntrance
                    ? (language === 'hi' ? '✓ सर्वोच्च शुभ द्वार' : '✓ SUPREME ENTRANCE')
                    : isSevereEntrance
                    ? (language === 'hi' ? '⚠ वर्जित द्वार (उपाय करें)' : '⚠ AVOID / REMEDY')
                    : (language === 'hi' ? 'सामान्य द्वार' : 'MODERATE DOOR')}
                </span>
              </div>
              <p className={cn("text-[10.5px] leading-snug", palette.isLight ? "text-stone-700" : "text-stone-300")}>
                {isBestEntrance
                  ? (language === 'hi'
                      ? `32-पद वास्तु के अनुसार ${livePada.code} (${livePada.nameHi}) मुख्य प्रवेश द्वार के लिए 8 सर्वश्रेष्ठ शुभ पदों में से एक है।`
                      : `Per 32-Pada Vastu, ${livePada.code} (${livePada.nameEn}) is one of the 8 Supreme Auspicious Main Entrance Padas (${SUPREME_ENTRANCE_PADAS.join(', ')}).`)
                  : (language === 'hi'
                      ? `सर्वश्रेष्ठ मुख्य द्वार पद: N3, N4, E3, E4, S4, W3, W4, W5। प्रभाव: ${livePada.resultHi}। उपाय: चौखट पर तांबे/पीतल की पट्टी या स्वस्तिक लगाएं।`
                      : `Supreme Main Door Padas: N3, N4, E3, E4, S4, W3, W4, W5. Effect: ${livePada.resultEn}. Remedy: Apply brass/copper threshold strip or Swastika.`)}
              </p>
            </div>
          );
        })()}
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB CONTENT: 1. VASTU (LIVE DIRECTION & FIND BEST DIRECTION LIVE HERE) */}
      {/* ========================================================================= */}
      {activeTab === 'vastu' && (
        <div className="w-full flex flex-col gap-3">
          {/* Live Best Direction Match & Interactive Activity Matcher Card */}
          <div className={cn(
            "w-full rounded-[26px] p-4 border flex flex-col gap-3 transition-all duration-300 shadow-xl",
            isActivityMatched
              ? (palette.isLight
                  ? "border-emerald-500/60 bg-emerald-50/80 shadow-[0_10px_35px_rgba(16,185,129,0.15)]"
                  : "border-emerald-500/50 bg-emerald-950/40 shadow-[0_10px_35px_rgba(16,185,129,0.25)]")
              : `${palette.telemetryCardBg} ${palette.telemetryCardBorder}`
          )}>
            {/* Top Row: Auspicious Status & Target Degree */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {isActivityMatched ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-stone-950 shadow-md animate-pulse">
                    <Sparkles className="w-3 h-3 text-stone-950 fill-stone-950" />
                    {language === 'hi' ? '⭐ सर्वोत्तम दिशा सुमेलित' : '⭐ BEST DIRECTION MATCH'}
                  </span>
                ) : isAuspiciousDirection ? (
                  <span className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                    palette.pillBg,
                    palette.pillBorder,
                    palette.pillUnitText
                  )}>
                    <Sparkles className="w-3 h-3" />
                    {language === 'hi' ? `शुभ वास्तु क्षेत्र (${liveZone.code})` : `AUSPICIOUS ZONE (${liveZone.code})`}
                  </span>
                ) : (
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                    palette.isLight ? "bg-white/60 border-stone-300 text-stone-700" : "bg-black/40 border-white/10 text-stone-300"
                  )}>
                    {language === 'hi' ? `दिशा क्षेत्र: ${liveZone.code}` : `ZONE: ${liveZone.code}`}
                  </span>
                )}
              </div>

              <div className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] font-mono font-bold",
                palette.pillBg,
                palette.pillBorder,
                palette.pillUnitText
              )}>
                <span>{language === 'hi' ? 'लक्ष्य' : 'Target'}:</span>
                <span className="font-black">{Math.round(activityDirections.targetDeg)}°</span>
              </div>
            </div>

            {/* Quick Activity Selector Chips */}
            <div className="w-full flex flex-col gap-1.5">
              <div className={cn("flex items-center justify-between text-[9px] font-black uppercase tracking-widest", palette.isLight ? "text-stone-600" : "text-stone-400")}>
                <span>{language === 'hi' ? 'उद्देश्य अनुसार दिशा जांचें' : 'Check Alignment For:'}</span>
                <span className={cn("font-bold", palette.headingText)}>{activityDirections.title}</span>
              </div>
              <div className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {VASTU_ACTIVITIES.map(act => {
                  const isSelected = targetActivity === act.id;
                  return (
                    <button
                      key={act.id}
                      onClick={() => {
                        setTargetActivity(act.id);
                        triggerHaptic();
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-xl text-[10px] font-black whitespace-nowrap flex items-center gap-1 transition-all active:scale-95 shrink-0 border",
                        isSelected
                          ? `${palette.pillBg} ${palette.pillBorder} ${palette.headingText} font-extrabold shadow-md scale-[1.02]`
                          : (palette.isLight
                              ? "bg-white/70 border-stone-300 text-stone-700 hover:bg-white"
                              : "bg-black/35 border-white/10 text-stone-300 hover:bg-black/50")
                      )}
                    >
                      <span>{act.icon}</span>
                      <span>{language === 'hi' ? act.labelHi : act.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direction Match Live Feedback & Turn Guidance */}
            <div className={cn(
              "w-full rounded-2xl p-3 border text-xs flex flex-col gap-2 shadow-md transition-all duration-300",
              isActivityMatched
                ? (palette.isLight
                    ? "border-emerald-300 bg-emerald-100/70 text-emerald-950 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                    : "border-emerald-500/40 bg-emerald-950/60 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.35)]")
                : (palette.isLight ? "border-stone-300/80 bg-white/70 text-stone-900" : "border-white/10 bg-black/30 text-stone-200")
            )}>
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  {isActivityMatched ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
                  ) : (
                    <Target className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span>
                    {language === 'hi' ? 'वर्तमान मुख:' : 'Facing:'} {displayDeg}° {language === 'hi' ? liveZone.nameHi.split(' ')[0] : liveZone.nameEn.split(' ')[0]} ({liveZone.code})
                  </span>
                </span>
                <span className={cn("text-[10px] font-mono font-black", isActivityMatched ? "text-emerald-400" : "text-amber-400")}>
                  {isActivityMatched
                    ? '✓ 100% MATCH'
                    : `${Math.abs(Math.round(headingDeviation))}° ${headingDeviation > 0 ? (language === 'hi' ? 'बाएं ↶' : 'Left ↶') : (language === 'hi' ? 'दाएं ↷' : 'Right ↷')}`}
                </span>
              </div>

              {/* Dynamic Turn Compass Navigator & Alignment Gauge */}
              {!isActivityMatched && (
                <div className="w-full flex items-center gap-2 py-1.5 px-2.5 rounded-xl bg-black/15 border border-white/5">
                  <div className="flex items-center gap-1 text-[11px] font-black text-amber-400 shrink-0">
                    {headingDeviation > 0 ? (
                      <>
                        <span className="text-base animate-bounce">↶</span>
                        <span>{language === 'hi' ? `बाएं ${Math.abs(Math.round(headingDeviation))}° घूमें` : `Turn ${Math.abs(Math.round(headingDeviation))}° Left`}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-base animate-bounce">↷</span>
                        <span>{language === 'hi' ? `दाएं ${Math.abs(Math.round(headingDeviation))}° घूमें` : `Turn ${Math.abs(Math.round(headingDeviation))}° Right`}</span>
                      </>
                    )}
                  </div>
                  <div className="flex-1 h-1.5 rounded-full bg-stone-700/40 overflow-hidden relative">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-150"
                      style={{ width: `${Math.max(10, 100 - Math.min(100, Math.abs(headingDeviation) * 1.5))}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono font-bold opacity-75">{Math.round(Math.max(10, 100 - Math.min(100, Math.abs(headingDeviation) * 1.5)))}%</span>
                </div>
              )}

              <p className="text-[11px] leading-relaxed opacity-90">
                {isActivityMatched
                  ? (language === 'hi' ? `अत्यंत शुभ! ${activityDirections.facing}` : `Perfect alignment! ${activityDirections.facing}`)
                  : (language === 'hi'
                      ? `${activityDirections.title} के लिए ${Math.round(activityDirections.targetDeg)}° की ओर ${Math.abs(Math.round(headingDeviation))}° ${headingDeviation > 0 ? 'बाएं ↶' : 'दाएं ↷'} घूमें। ${activityDirections.facing}`
                      : `Turn ${Math.abs(Math.round(headingDeviation))}° ${headingDeviation > 0 ? 'Left ↶' : 'Right ↷'} towards ${Math.round(activityDirections.targetDeg)}° for optimal energy. ${activityDirections.facing}`)}
              </p>
              <div className="text-[10px] pt-1.5 border-t border-current/15 flex flex-col gap-0.5">
                <div><span className="font-black">{language === 'hi' ? 'आदर्श कार्य:' : 'Ideal for:'}</span> {liveHeadingAdvice.idealFor}</div>
                <div><span className="font-black text-rose-400">{language === 'hi' ? 'वर्जित कार्य:' : 'Avoid for:'}</span> {liveHeadingAdvice.avoidFor}</div>
              </div>
            </div>
          </div>

          {/* Instant Room-by-Room Vastu Verdict & Remedy Engine */}
          <RoomVastuEngine
            currentHeading={currentHeading}
            language={language}
            theme={theme}
            selectedStyle={selectedStyle}
            variantId={variantId}
            onHaptic={triggerHaptic}
            onSaveRoomAudit={(audit) => {
              handleSaveRoom(`${audit.roomName} (${audit.zoneCode})`);
            }}
          />

          {/* Interactive Vastu Live Audit Scorecard */}
          <VastuAuditScorecard
            language={language}
            theme={theme}
            selectedStyle={selectedStyle}
            variantId={variantId}
            currentHeading={currentHeading}
            onHaptic={triggerHaptic}
          />

          <VastuPanel
            language={language}
            theme={theme}
            selectedStyle={selectedStyle}
            variantId={variantId}
            vastuScore={houseGridScore}
            selectedRoom={selectedRoom}
            setSelectedRoom={setSelectedRoom}
            doorDegree={doorDegree}
            setDoorDegree={setDoorDegree}
            currentHeading={currentHeading}
            house9Grid={house9Grid}
            setHouse9Grid={setHouse9Grid}
            onHaptic={triggerHaptic}
            currentDir={liveZone.code}
            savedRooms={savedRooms.map(r => ({ id: r.id, room: r.roomType, door: r.degrees, grid: {} }))}
            onSaveRoom={(name) => handleSaveRoom(name)}
            onLoadRoom={handleLoadRoom}
            onDeleteRoom={(id) => {
              setSavedRooms(prev => prev.filter(r => r.id !== id));
              triggerHaptic();
              toast.info(language === 'hi' ? 'कक्ष हटाया गया' : 'Room deleted');
            }}
          />

          {/* AR Vastu Scanner & Floor Plan & Weather quick actions — compact strip */}
          <div className="w-full flex items-center gap-1.5">
            <button
              onClick={() => { setShowARScanner(true); triggerHaptic(); }}
              className={cn(
                "flex-1 py-2 rounded-xl border text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm",
                palette.pillBg,
                palette.pillBorder,
                palette.headingText
              )}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>AR Scan</span>
            </button>
            <button
              onClick={() => { setShowFloorPlan(true); triggerHaptic(); }}
              className={cn(
                "flex-1 py-2 rounded-xl border text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm",
                palette.pillBg,
                palette.pillBorder,
                palette.headingText
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Floor Plan</span>
            </button>
            <button
              onClick={() => { setShowWeather(true); triggerHaptic(); }}
              className={cn(
                "flex-1 py-2 rounded-xl border text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm",
                palette.pillBg,
                palette.pillBorder,
                palette.headingText
              )}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Weather</span>
            </button>
          </div>

          {/* Vastu Enhancements: 8-zone map, lookup, dosha, muhurat, share */}
          <VastuEnhancements
            language={language}
            theme={theme}
            selectedStyle={selectedStyle}
            variantId={variantId}
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
          <React.Suspense fallback={null}>
            <JyotishPanel
              language={language}
              theme={theme}
              jyotishRashi={jyotishRashi}
              setJyotishRashi={setJyotishRashi}
              onHaptic={triggerHaptic}
            />
          </React.Suspense>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB CONTENT: 3. NUMEROLOGY (MATCHING SCREENSHOT media_1788369729061.png) */}
      {/* ========================================================================= */}
      {activeTab === 'numerology' && (
        <div className="w-full flex flex-col gap-3">
          <React.Suspense fallback={null}>
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
          </React.Suspense>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB CONTENT: 4. SADHANA (MATCHING SCREENSHOT media_1788369685841.png) */}
      {/* ========================================================================= */}
      {activeTab === 'sadhana' && (
        <div className="w-full flex flex-col gap-3">
          <React.Suspense fallback={null}>
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
          </React.Suspense>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB CONTENT: 5. FENG SHUI (BAGUA MAP FROM SCREENSHOT) */}
      {/* ========================================================================= */}
      {activeTab === 'feng_shui' && (
        <div className="w-full flex flex-col gap-3">
          <React.Suspense fallback={null}>
            <FengShuiPanel
              language={language}
              theme={theme}
              fengshuiDoor={fengshuiDoor}
              setFengshuiDoor={setFengshuiDoor}
            />
          </React.Suspense>
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
            <span className={cn("font-black text-sm uppercase tracking-wider flex items-center justify-center gap-1.5", palette.isLight ? "text-emerald-800" : "text-emerald-300")}>
              <span>↗</span>
              <span>{language === 'hi' ? 'किबला दिशा (मक्का अल-मुकर्रमा)' : 'Qibla Direction (Makkah Al-Mukarramah)'}</span>
            </span>

            <div className={cn("p-3 rounded-2xl border flex flex-col items-center gap-1", palette.isLight ? "bg-white border-stone-200" : "bg-black/40 border-white/10")}>
              <span className={cn("text-[10px] uppercase font-bold", palette.isLight ? "text-stone-600" : "text-stone-400")}>{language === 'hi' ? 'आपके GPS से काबा बेयरिंग:' : 'Kaaba Bearing from Your GPS:'}</span>
              <span className={cn("text-3xl font-black font-mono", palette.isLight ? "text-teal-700" : "text-emerald-400")}>{qiblaData ? `${qiblaData.qiblaBearing}°` : '—'}</span>
              <span className={cn("text-[10.5px] font-bold", palette.isLight ? "text-stone-600" : "text-stone-300")}>
                {qiblaData ? (language === 'hi' ? `दूरी: ${qiblaData.distanceKm} किमी` : `Distance: ${qiblaData.distanceKm} km`) : (language === 'hi' ? 'स्थान उपलब्ध नहीं' : 'Location unavailable')}
              </span>
            </div>

            <div className={cn(
              "p-3 rounded-2xl border flex items-center justify-center gap-2 font-black transition-all",
              qiblaData?.isFacingQibla
                ? (palette.isLight ? "bg-teal-100 text-teal-800 border-teal-400" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.5)]")
                : (palette.isLight ? "bg-white text-stone-700 border-stone-300" : "bg-stone-900 text-stone-400 border-white/10")
            )}>
              <Navigation className="w-4 h-4" />
              <span>{qiblaData ? (qiblaData.isFacingQibla ? (language === 'hi' ? 'काबा की ओर संरेखित ✓' : 'ALIGNED WITH KAABA ✓') : (language === 'hi' ? `किबला की ओर मुड़ने के लिए ${qiblaData.qiblaBearing}° घुमाएं` : `Rotate to ${qiblaData.qiblaBearing}° to face Qibla`)) : (language === 'hi' ? 'स्थान उपलब्ध नहीं' : 'Location unavailable')}</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. CREATOR BRANDING FOOTER CARD (EXACTLY AS IN ALL SCREENSHOTS) */}
      {/* ========================================================================= */}
      <div className={cn(
        "w-full max-w-xl rounded-[24px] p-4 border shadow-2xl flex flex-col items-center justify-center text-center mt-4",
        theme === 'light'
          ? "bg-gradient-to-r from-[#FEF3C7] via-[#FDE68A] to-[#FCD34D] border-amber-400"
          : "bg-gradient-to-r from-[#181109] via-[#2A180B] to-[#140C04] border-amber-500/40"
      )}>
        <div className="flex items-center gap-2 mb-1">
          <h4 className={cn("text-sm font-serif font-black tracking-wider uppercase", palette.isLight ? "text-amber-900" : "text-amber-300")}>
            BY AADISH JAIN
          </h4>
          <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-amber-500 text-stone-950 shadow-sm">
            CREATOR
          </span>
        </div>

        <p className={cn("text-[10.5px] font-bold tracking-wide", palette.isLight ? "text-amber-900" : "text-stone-300")}>
          Spiritual & Vastu Guidance Services
        </p>

        <span className={cn("text-[9px] mt-1 flex items-center gap-1 font-bold", palette.isLight ? "text-amber-700" : "text-stone-400")}>
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
          directionName={live8Zone.code}
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

      {/* 32 Devta Pada Inspector Modal */}
      {selectedPadaModal && (
        <DevtaPadaModal
          pada={selectedPadaModal}
          onClose={() => setSelectedPadaModal(null)}
          onSelectPada={(pada) => setSelectedPadaModal(pada)}
          language={language}
          theme={theme}
        />
      )}
    </div>
  );
};

export default VastuOthersView;

