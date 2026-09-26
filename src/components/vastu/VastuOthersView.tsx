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
  MapPinned,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

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
import { JainPanel } from '@/components/compass/JainPanel';
import { FengShuiPanel } from '@/components/compass/FengShuiPanel';
import { JyotishPanel } from '@/components/compass/JyotishPanel';
import { NumerologyPanel } from '@/components/compass/NumerologyPanel';
import { VastuEnhancements } from '@/components/compass/VastuEnhancements';
import { DevtaPadaModal } from '@/components/compass/DevtaPadaModal';
import { VastuPada32 } from '@/lib/vastu32Devta';

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

  // Saved Rooms (persisted)
  const [savedRooms, setSavedRooms] = useState<SavedRoomEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('com.spiritual.compass.app_saved_rooms') || '[]'); } catch { return []; }
  });

  // 9-Grid Floorplan Mapper (sector keys — matches VastuPanel mapper UI + score)
  const [house9Grid, setHouse9Grid] = useState<Record<string, string>>({
    NW: 'bathroom',
    N: 'entrance',
    NE: 'pooja',
    W: 'study',
    CENTER: 'open',
    E: 'entrance',
    SW: 'master_bedroom',
    S: 'staircase',
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
  const [selectedPadaModal, setSelectedPadaModal] = useState<VastuPada32 | null>(null);

  // Persist Vastu sub-tab + selected room across sessions
  useEffect(() => {
    try { localStorage.setItem(VASTU_TAB_STORAGE_KEY, activeTab); } catch {}
  }, [activeTab]);
  useEffect(() => {
    try { localStorage.setItem(VASTU_ROOM_STORAGE_KEY, selectedRoom); } catch {}
  }, [selectedRoom]);
  useEffect(() => {
    try { localStorage.setItem('com.spiritual.compass.app_saved_rooms', JSON.stringify(savedRooms)); } catch {}
  }, [savedRooms]);

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
    let correct = 0;
    Object.keys(house9Grid).forEach(sector => {
      if (ideal[sector]?.includes(house9Grid[sector])) correct += 1;
    });
    return Math.round((correct / 9) * 100);
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
          { id: 'vastu', label: language === 'hi' ? 'वास्तु' : 'Vastu', icon: '✨' },
          { id: 'jyotish', label: language === 'hi' ? 'ज्योतिष' : 'Jyotish', icon: '⭐' },
          { id: 'numerology', label: language === 'hi' ? 'अंक शास्त्र' : 'Numerology', icon: '#' },
          { id: 'sadhana', label: language === 'hi' ? 'साधना' : 'Sadhana', icon: '⊙' },
          { id: 'feng_shui', label: language === 'hi' ? 'फेंग शुई' : 'Feng Shui', icon: '🧭' },
          { id: 'qibla', label: language === 'hi' ? 'किबला' : 'Qibla', icon: '↗' }
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
          <div 
            onClick={() => {
              triggerHaptic();
              setSelectedPadaModal(livePada);
            }}
            className={cn(
              "rounded-2xl border px-3 py-2 cursor-pointer transition-all active:scale-95 hover:border-amber-400",
              theme === 'light' ? "border-stone-200 bg-white shadow-sm" : "border-white/10 bg-black/25"
            )}
            title="Tap to inspect Devta Pada"
          >
            <div className={cn("flex items-center justify-between text-[9px] uppercase tracking-[0.18em]", theme === 'light' ? "text-stone-500" : "text-stone-500")}>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Pada</span>
              </div>
              <Sparkles className="w-2.5 h-2.5 text-amber-400 opacity-80" />
            </div>
            <div className={cn("mt-1 text-sm font-black flex items-center justify-between", theme === 'light' ? "text-stone-900" : "text-white")}>
              <span>{livePada.code}</span>
              <span className="text-[10px] font-bold text-amber-400 font-sans">{livePada.nameHi}</span>
            </div>
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
            <div className={cn("mt-1 text-sm font-black", theme === 'light' ? "text-stone-900" : "text-white")}>{houseGridScore}%</div>
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
          <span>{language === 'hi' ? 'लाइव प्रीमियम इनसाइट' : 'Live Premium Insight'}</span>
        </div>
        <p className={cn("text-sm font-black", theme === 'light' ? "text-emerald-900" : "text-white")}>{premiumInsight}</p>
        <p className={cn("text-[11px] leading-relaxed", theme === 'light' ? "text-emerald-800" : "text-stone-300")}>
          {language === 'hi' ? 'इसके लिए आदर्श:' : 'Ideal for:'} {liveHeadingAdvice.idealFor}. {language === 'hi' ? 'इससे बचें:' : 'Avoid for:'} {liveHeadingAdvice.avoidFor}.
        </p>
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
              ? (theme === 'light'
                  ? "border-emerald-400 bg-gradient-to-br from-emerald-50 via-teal-50 to-white shadow-[0_10px_35px_rgba(16,185,129,0.15)]"
                  : "border-emerald-500/50 bg-gradient-to-br from-[#062016] via-[#05150e] to-[#020805] shadow-[0_10px_35px_rgba(16,185,129,0.25)]")
              : (theme === 'light'
                  ? "border-stone-200 bg-white"
                  : "border-white/10 bg-stone-950/80")
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
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 border border-amber-500/50 text-amber-300">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    {language === 'hi' ? `शुभ वास्तु क्षेत्र (${liveZone.code})` : `AUSPICIOUS ZONE (${liveZone.code})`}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-stone-800 border border-stone-700 text-stone-300">
                    {language === 'hi' ? `दिशा क्षेत्र: ${liveZone.code}` : `ZONE: ${liveZone.code}`}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-bold">
                <span>{language === 'hi' ? 'लक्ष्य' : 'Target'}:</span>
                <span className="font-black text-cyan-300">{Math.round(activityDirections.targetDeg)}°</span>
              </div>
            </div>

            {/* Quick Activity Selector Chips */}
            <div className="w-full flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-stone-400">
                <span>{language === 'hi' ? 'उद्देश्य अनुसार दिशा जांचें' : 'Check Alignment For:'}</span>
                <span className="text-amber-400 font-bold">{activityDirections.title}</span>
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
                          ? "bg-amber-500 text-stone-950 border-amber-400 shadow-md font-extrabold"
                          : (theme === 'light'
                              ? "bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200"
                              : "bg-stone-900 border-white/10 text-stone-300 hover:bg-stone-800")
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
              "w-full rounded-2xl p-2.5 border text-xs flex flex-col gap-1.5",
              isActivityMatched
                ? (theme === 'light' ? "border-emerald-300 bg-emerald-100/60 text-emerald-950" : "border-emerald-500/30 bg-emerald-950/40 text-emerald-200")
                : (theme === 'light' ? "border-stone-200 bg-stone-50 text-stone-800" : "border-white/10 bg-white/5 text-stone-200")
            )}>
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  {isActivityMatched ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Target className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span>
                    {language === 'hi' ? 'वर्तमान मुख:' : 'Facing:'} {displayDeg}° {liveZone.nameHi.split(' ')[0]} ({liveZone.code})
                  </span>
                </span>
                <span className={cn("text-[10px] font-mono font-bold", isActivityMatched ? "text-emerald-400" : "text-amber-400")}>
                  {isActivityMatched
                    ? '✓ 100% MATCH'
                    : `${Math.abs(Math.round(headingDeviation))}° ${headingDeviation > 0 ? 'Left' : 'Right'}`}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                {isActivityMatched
                  ? (language === 'hi' ? `अत्यंत शुभ! ${activityDirections.facing}` : `Perfect alignment! ${activityDirections.facing}`)
                  : (language === 'hi'
                      ? `${activityDirections.title} के लिए ${Math.round(activityDirections.targetDeg)}° की ओर ${Math.abs(Math.round(headingDeviation))}° ${headingDeviation > 0 ? 'बाएं ↶' : 'दाएं ↷'} घूमें। ${activityDirections.facing}`
                      : `Turn ${Math.abs(Math.round(headingDeviation))}° ${headingDeviation > 0 ? 'Left ↶' : 'Right ↷'} towards ${Math.round(activityDirections.targetDeg)}° for optimal energy. ${activityDirections.facing}`)}
              </p>
              <div className="text-[10px] pt-1 border-t border-current/15 flex flex-col gap-0.5">
                <div><span className="font-black">{language === 'hi' ? 'आदर्श:' : 'Ideal:'}</span> {liveHeadingAdvice.idealFor}</div>
                <div><span className="font-black text-rose-400">{language === 'hi' ? 'वर्जित:' : 'Avoid:'}</span> {liveHeadingAdvice.avoidFor}</div>
              </div>
            </div>
          </div>

          <VastuPanel
            language={language}
            theme={theme}
            vastuScore={houseGridScore}
            selectedRoom={selectedRoom}
            setSelectedRoom={setSelectedRoom}
            doorDegree={doorDegree}
            setDoorDegree={setDoorDegree}
            house9Grid={house9Grid}
            setHouse9Grid={setHouse9Grid}
            onHaptic={triggerHaptic}
            currentDir={liveZone.code}
            savedRooms={savedRooms.map(r => ({ id: r.id, room: r.roomType, door: r.degrees, grid: {} }))}
            onSaveRoom={(name) => handleSaveRoom(name)}
            onLoadRoom={handleLoadRoom}
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
              <span>{language === 'hi' ? 'किबला दिशा (मक्का अल-मुकर्रमा)' : 'Qibla Direction (Makkah Al-Mukarramah)'}</span>
            </span>

            <div className={cn("p-3 rounded-2xl border flex flex-col items-center gap-1", theme === 'light' ? "bg-white border-stone-200" : "bg-black/40 border-white/10")}>
              <span className={cn("text-[10px] uppercase font-bold", theme === 'light' ? "text-stone-500" : "text-stone-400")}>{language === 'hi' ? 'आपके GPS से काबा बेयरिंग:' : 'Kaaba Bearing from Your GPS:'}</span>
              <span className={cn("text-3xl font-black font-mono", theme === 'light' ? "text-emerald-700" : "text-emerald-400")}>{qiblaData ? `${qiblaData.qiblaBearing}°` : '—'}</span>
              <span className={cn("text-[10.5px] font-bold", theme === 'light' ? "text-stone-600" : "text-stone-300")}>
                {qiblaData ? (language === 'hi' ? `दूरी: ${qiblaData.distanceKm} किमी` : `Distance: ${qiblaData.distanceKm} km`) : (language === 'hi' ? 'स्थान उपलब्ध नहीं' : 'Location unavailable')}
              </span>
            </div>

            <div className={cn(
              "p-3 rounded-2xl border flex items-center justify-center gap-2 font-black transition-all",
              qiblaData?.isFacingQibla
                ? (theme === 'light' ? "bg-emerald-100 text-emerald-800 border-emerald-400" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.5)]")
                : (theme === 'light' ? "bg-white text-stone-600 border-stone-300" : "bg-stone-900 text-stone-400 border-white/10")
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
