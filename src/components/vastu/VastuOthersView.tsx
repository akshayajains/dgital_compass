import React, { useState, useMemo, useEffect } from 'react';
import { 
  Compass, 
  Sparkles, 
  Home, 
  Shield, 
  Flame, 
  Droplet, 
  Wind, 
  Mountain, 
  Moon, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Bed, 
  GraduationCap, 
  Utensils, 
  Bath, 
  ChevronDown, 
  ChevronUp, 
  Camera, 
  Layers, 
  Zap, 
  Target, 
  Copy, 
  Lock, 
  Unlock, 
  Bookmark, 
  Calendar, 
  Eye, 
  Activity, 
  Save, 
  Trash2,
  Clock,
  Star,
  Sun,
  Navigation,
  Check,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { CompassStyleId } from '@/types/compass';
import { CompassDialRenderer } from '@/components/compass/CompassDialRenderer';
import { VASTU_16_ZONES, ROOM_GUIDANCE_CATALOG } from '@/data/vastuKnowledgeBase';
import { VASTU_32_PADAS, get32Pada } from '@/lib/vastu32Devta';
import { getChoghadiyaData, VEDIC_RASHIS, RashiInfo } from '@/lib/choghadiya';

interface Props {
  currentHeading: number | null;
  pitch?: number;
  roll?: number;
  sunPos?: number | null;
  isLevel?: boolean;
  selectedStyle?: CompassStyleId;
  customAccentColor?: string;
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
  const isHi = language === 'hi';

  const fallbackDialRef = React.useRef<HTMLDivElement>(null);
  const effectiveDialRef = dialRef || fallbackDialRef;

  // Active Sub-tab (Vastu | Jyotish | Numerology | Sadhana | Feng Shui | Qibla)
  const [activeTab, setActiveTab] = useState<VastuSubTab>('vastu');

  // Reverse Finder Activity
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

  // Numerology State
  const [birthDate, setBirthDate] = useState<string>('1995-08-15');

  // Sadhana State
  const [japaCount, setJapaCount] = useState<number>(0);
  const [japaTarget] = useState<number>(108);

  // Qibla Math
  const qiblaData = useMemo(() => {
    const userLat = location?.latitude || 18.5504;
    const userLng = location?.longitude || 73.9201;
    const makkahLat = 21.4225;
    const makkahLng = 39.8262;

    const phi1 = (userLat * Math.PI) / 180;
    const phi2 = (makkahLat * Math.PI) / 180;
    const deltaLambda = ((makkahLng - userLng) * Math.PI) / 180;

    const y = Math.sin(deltaLambda);
    const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);
    let qiblaBearing = (Math.atan2(y, x) * 180) / Math.PI;
    qiblaBearing = (qiblaBearing + 360) % 360;

    // Haversine Distance
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

  // Numerology Details
  const numerologyDetails = useMemo(() => {
    try {
      const parts = birthDate.split('-');
      const day = parseInt(parts[2], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[0], 10);

      const reduce = (n: number): number => {
        let sum = n;
        while (sum > 9) {
          sum = sum.toString().split('').reduce((acc, d) => acc + parseInt(d, 10), 0);
        }
        return sum;
      };

      const mulank = reduce(day);
      const bhagyank = reduce(day + month + year);

      // Lo Shu Magic Square Frequency Counter
      const allDigits = `${day}${month}${year}`.replace(/0/g, '');
      const loShuCounts: Record<number, number> = {};
      for (let i = 1; i <= 9; i++) loShuCounts[i] = 0;
      for (const char of allDigits) {
        const d = parseInt(char, 10);
        if (d >= 1 && d <= 9) loShuCounts[d] = (loShuCounts[d] || 0) + 1;
      }

      const luckyDirs: Record<number, { dir: string; deg: string; lord: string; color: string }> = {
        1: { dir: 'East (पूर्व)', deg: '79°-101°', lord: 'Surya (Sun)', color: 'text-amber-400' },
        2: { dir: 'North-West (वायव्य)', deg: '304°-326°', lord: 'Chandra (Moon)', color: 'text-cyan-400' },
        3: { dir: 'North-East (ईशान)', deg: '34°-56°', lord: 'Brihaspati (Jupiter)', color: 'text-yellow-400' },
        4: { dir: 'South-West (नैऋत्य)', deg: '214°-236°', lord: 'Rahu', color: 'text-purple-400' },
        5: { dir: 'North (उत्तर)', deg: '349°-11°', lord: 'Budha (Mercury)', color: 'text-emerald-400' },
        6: { dir: 'South-East (आग्नेय)', deg: '124°-146°', lord: 'Shukra (Venus)', color: 'text-rose-400' },
        7: { dir: 'North-East / South-West', deg: '34°-56°', lord: 'Ketu', color: 'text-indigo-400' },
        8: { dir: 'West (पश्चिम)', deg: '259°-281°', lord: 'Shani (Saturn)', color: 'text-blue-400' },
        9: { dir: 'South (दक्षिण)', deg: '169°-191°', lord: 'Mangal (Mars)', color: 'text-red-400' }
      };

      return {
        mulank,
        bhagyank,
        loShuCounts,
        lucky: luckyDirs[mulank] || luckyDirs[1]
      };
    } catch {
      return { mulank: 1, bhagyank: 1, loShuCounts: {}, lucky: { dir: 'East', deg: '79°-101°', lord: 'Sun', color: 'text-amber-400' } };
    }
  }, [birthDate]);

  // Live heading advice
  const liveHeadingAdvice = useMemo(() => {
    switch (liveZone.code) {
      case 'N':
        return { idealFor: isHi ? 'धन संचय, व्यापारिक अवसर, कुबेर स्थान, तिजोरी' : 'Wealth Accumulation, Career Opportunities, Safe/Locker', avoidFor: isHi ? 'रसोई, शौचालय, भारी गोदाम' : 'Kitchen Fire, Toilet, Heavy Clutter' };
      case 'NNE':
        return { idealFor: isHi ? 'औषधि, स्वास्थ्य सुधार, योग, रोग मुक्ति' : 'Medicine Cabinet, Health Healing, Recovery', avoidFor: isHi ? 'शौचालय (गंभीर रोग कारक), कबाड़' : 'Toilet, Dustbin' };
      case 'NE':
        return { idealFor: isHi ? 'पूजा मंदिर, ध्यान, आध्यात्मिक साधना, गहरा अध्ययन' : 'Pooja Mandir, Meditation, Spiritual Focus, Study', avoidFor: isHi ? 'शौचालय, रसोई, भारी सीढ़ी, मास्टर बेडरूम' : 'Toilet (Major Dosha), Kitchen, Heavy Stairs' };
      case 'ENE':
        return { idealFor: isHi ? 'मनोरंजन, ताजगी, पारिवारिक लाउंज' : 'Recreation, Family Lounge, Refreshment', avoidFor: isHi ? 'शौचालय, कबाड़' : 'Toilet, Heavy Junk' };
      case 'E':
        return { idealFor: isHi ? 'सामाजिक संपर्क, मुख्य द्वार, पूर्व मुखी अध्ययन' : 'Social Networking, Main Entrance, East-facing Study', avoidFor: isHi ? 'शौचालय, अंधेरा, भारी दीवारें' : 'Toilet, Dark Clutter, Blocked Windows' };
      case 'ESE':
        return { idealFor: isHi ? 'मंथन, मिक्सी, वाशिंग मशीन' : 'Churning, Mixer/Grinder, Washing Machine', avoidFor: isHi ? 'शयनकक्ष (अनिद्रा व अत्यधिक चिंता), मंदिर' : 'Bedroom (Severe Anxiety & Insomnia), Mandir' };
      case 'SE':
        return { idealFor: isHi ? 'रसोई (गैस चूल्हा), अग्नि तत्व, विद्युत उपकरण' : 'Kitchen Gas Stove, Fire Element, Electrical Inverter', avoidFor: isHi ? 'भूमिगत पानी टैंक, बेडरूम, नीला/काला रंग' : 'Water Tank, Bedroom, Blue/Black Colors' };
      case 'SSE':
        return { idealFor: isHi ? 'व्यायामशाला, शारीरिक शक्ति, अन्न भंडारण' : 'Gym, Workout, Physical Stamina, Grains', avoidFor: isHi ? 'शौचालय, पानी का गड्ढा' : 'Toilet, Underground Pit' };
      case 'S':
        return { idealFor: isHi ? 'गहरी शांत नींद, विश्राम, भारी अलमारी' : 'Deep Restful Sleep, Heavy Furniture, Rest', avoidFor: isHi ? 'भूमिगत पानी, खुला स्थान' : 'Underground Tank, Water Fountains' };
      case 'SSW':
        return { idealFor: isHi ? 'शौचालय, सेप्टिक टैंक, कचरा विसर्जन' : 'Toilet & Septic Tank (Ideal Zone of Disposal)', avoidFor: isHi ? 'बेडरूम (स्वास्थ्य हानि), तिजोरी, मंदिर' : 'Bedroom, Cash Safe, Mandir' };
      case 'SW':
        return { idealFor: isHi ? 'मास्टर बेडरूम, स्थायित्व, गृहस्वामी, भारी ओवरहेड टंकी' : 'Master Bedroom, Head of Family, Stability, Overhead Tank', avoidFor: isHi ? 'शौचालय (पारिवारिक कलह), भूमिगत टैंक, मंदिर' : 'Toilet, Underground Tank, Mandir' };
      case 'WSW':
        return { idealFor: isHi ? 'विद्या पद: अध्ययन कक्ष, स्टडी टेबल, पुस्तकें, बचत' : 'Vidya Pada: Study Desk, Books, Knowledge, Savings', avoidFor: isHi ? 'शौचालय (विद्या का नाश), रसोई' : 'Toilet (Washes away education), Kitchen' };
      case 'W':
        return { idealFor: isHi ? 'व्यापारिक लाभ, डाइनिंग टेबल, बच्चों का बेडरूम' : 'Business Profits, Gains, Dining Room, Kids Bedroom', avoidFor: isHi ? 'भूमिगत जल टैंक' : 'Underground Water Tank' };
      case 'WNW':
        return { idealFor: isHi ? 'डिटॉक्स, विरेचन, रद्दी कागज' : 'Emotional Detoxing, Releasing Grief, Waste Paper', avoidFor: isHi ? 'बेडरूम (उदासी व अवसाद), स्टडी टेबल' : 'Bedroom (Depression), Study Desk' };
      case 'NW':
        return { idealFor: isHi ? 'अतिथि कक्ष, बैंक दस्तावेज, सहयोग, तैयार माल' : 'Guest Room, Banking, Support, Ready Goods', avoidFor: isHi ? 'मास्टर बेडरूम, भारी स्थायी सामान' : 'Master Bedroom, Heavy Fixed Vaults' };
      case 'NNW':
        return { idealFor: isHi ? 'नवविवाहित युगल, आकर्षण, इत्र व सौंदर्य' : 'Newly Married Couple, Romance, Charm, Attire', avoidFor: isHi ? 'बच्चों का अध्ययन कक्ष, शौचालय' : 'Children Study Desk, Toilet' };
      default:
        return { idealFor: isHi ? 'सामान्य कार्य' : 'General Work', avoidFor: isHi ? 'कबाड़' : 'Clutter' };
    }
  }, [liveZone.code, isHi]);

  // Reverse activity finder
  const activityDirections = useMemo(() => {
    switch (targetActivity) {
      case 'study':
        return { title: isHi ? 'अध्ययन एवं परीक्षा (Study / Exams)' : 'Study & Competitive Exams', bestZones: ['WSW (236°-258°)', 'NE (34°-56°)', 'East (79°-101°)'], facing: isHi ? 'पढ़ते समय मुख पूर्व (याददाश्त) या उत्तर (एकाग्रता) रखें।' : 'Face East (Retention) or North (Analytical focus).', targetDeg: 247.5, color: 'text-indigo-400' };
      case 'work':
        return { title: isHi ? 'वर्क फ्रॉम होम / ऑफिस (Work / Office)' : 'Work From Home & Office', bestZones: ['North (349°-11°)', 'West (259°-281°)', 'East (79°-101°)'], facing: isHi ? 'बैठते समय मुख उत्तर या पूर्व की ओर रखें।' : 'Sit facing North (Career opportunities) or East.', targetDeg: 0, color: 'text-sky-400' };
      case 'sleep':
        return { title: isHi ? 'मास्टर बेडरूम व शयन (Master Bedroom)' : 'Master Bedroom & Sleep', bestZones: ['SW (214°-236°)', 'South (169°-191°)', 'West (259°-281°)'], facing: isHi ? 'सिर हमेशा दक्षिण (सर्वोत्तम) या पूर्व में रखें। उत्तर में सिर कभी न करें।' : 'Head towards South (Best) or East. Never North.', targetDeg: 225, color: 'text-amber-400' };
      case 'mandir':
        return { title: isHi ? 'पूजा मंदिर व ध्यान (Pooja Mandir)' : 'Pooja Mandir & Spiritual Space', bestZones: ['NE (34°-56°)', 'East (79°-101°)', 'North (349°-11°)'], facing: isHi ? 'पूजा करते समय उपासक का मुख पूर्व या उत्तर की ओर होना चाहिए।' : 'Devotee faces East or North during prayer.', targetDeg: 45, color: 'text-yellow-400' };
      case 'kitchen':
        return { title: isHi ? 'रसोईघर व गैस चूल्हा (Kitchen Stove)' : 'Kitchen & Gas Stove', bestZones: ['SE (124°-146°)', 'SSE (146°-169°)', 'NW (304°-326°)'], facing: isHi ? 'खाना बनाते समय मुख हमेशा पूर्व दिशा की ओर होना चाहिए।' : 'Cook must face East while cooking.', targetDeg: 135, color: 'text-orange-400' };
      case 'cash':
        return { title: isHi ? 'तिजोरी व धन स्थान (Cash Vault)' : 'Cash Vault & Wealth Safe', bestZones: ['North (349°-11°)', 'SW (214°-236°)', 'West (259°-281°)'], facing: isHi ? 'तिजोरी का द्वार हमेशा उत्तर की ओर खुलना चाहिए (कुबेर का वास)।' : 'Locker door must open towards North (Lord Kuber).', targetDeg: 0, color: 'text-emerald-400' };
      case 'toilet':
        return { title: isHi ? 'शौचालय व सेप्टिक टैंक (Toilet)' : 'Toilet & Septic Tank', bestZones: ['SSW (191°-214°)', 'WNW (281°-304°)', 'ESE (101°-124°)'], facing: isHi ? 'बैठते समय मुख उत्तर या दक्षिण की ओर होना चाहिए।' : 'Commode user should face North or South.', targetDeg: 202.5, color: 'text-purple-400' };
      default:
        return { title: isHi ? 'अध्ययन कक्ष' : 'Study Room', bestZones: ['WSW', 'NE', 'East'], facing: isHi ? 'मुख पूर्व या उत्तर रखें।' : 'Face East or North.', targetDeg: 247.5, color: 'text-indigo-400' };
    }
  }, [targetActivity, isHi]);

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
    <div className="w-full max-w-sm flex flex-col items-center select-none text-white pb-14 animate-in fade-in">

      {/* ========================================================================= */}
      {/* 1. COMPASS DIAL (MOUNTED AT TOP OF VASTU VIEW) */}
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
          qiblaBearing={qiblaData.qiblaBearing}
          qiblaDistanceKm={qiblaData.distanceKm}
          isFacingQibla={qiblaData.isFacingQibla}
          vastuGridEnabled={true}
          isLevel={isLevel}
          dialRef={effectiveDialRef}
          customAccentColor={customAccentColor}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      </div>

      {/* Pitch / Roll / Tilt Indicator Strip */}
      <div className="w-full max-w-sm flex items-center justify-between px-4 py-2 rounded-2xl bg-stone-900/90 border border-white/10 my-1 text-xs font-bold shadow-md">
        <div className="flex items-center gap-1">
          <span className="text-stone-400 text-[10.5px] uppercase font-black tracking-wider">PITCH:</span>
          <span className="text-amber-400 font-mono font-black text-sm">{Math.round(pitch)}°</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-stone-400 text-[10.5px] uppercase font-black tracking-wider">ROLL:</span>
          <span className="text-amber-400 font-mono font-black text-sm">{Math.round(roll)}°</span>
        </div>
        <span className={cn(
          "px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase border tracking-wider",
          isLevel ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-rose-950/60 text-rose-300 border-rose-500/40"
        )}>
          {isLevel ? 'LEVEL' : 'TILT'}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-stone-400 text-[10.5px] uppercase font-black tracking-wider">TILT:</span>
          <span className="text-amber-400 font-mono font-black text-sm">{Math.round(totalTilt)}°</span>
        </div>
      </div>

      {/* Crimson Quick Dashboard Card */}
      <div className="w-full max-w-sm rounded-[28px] p-4 border border-red-900/60 bg-gradient-to-b from-[#18090C] via-[#120608] to-[#0A0304] shadow-[0_15px_50px_rgba(0,0,0,0.95)] flex flex-col gap-3 my-2">
        {/* Top Badges & Actions */}
        <div className="w-full flex items-start justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 flex items-center gap-1 shadow-sm">
              <span>✦</span>
              <span>HIGH ACC</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-sky-500/40 bg-sky-950/40 text-sky-300 flex items-center gap-1 shadow-sm w-fit">
              <span>Δ</span>
              <span>{declination > 0 ? `+${declination}°` : `${declination}°`}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button onClick={onCopyCoordinates} className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center active:scale-95 transition-all shadow-sm">
              <Camera className="w-4 h-4 text-amber-400" />
            </button>
            <button onClick={onToggleTorch} className={cn("w-8 h-8 rounded-full border flex items-center justify-center active:scale-95 transition-all shadow-sm", isTorchOn ? "bg-emerald-500 text-stone-950 border-emerald-400" : "bg-emerald-950/60 text-emerald-400 border-emerald-500/40")}>
              <Zap className="w-4 h-4" />
            </button>
            <button onClick={onCopyCoordinates} className="w-8 h-8 rounded-full bg-stone-800/80 border border-white/15 text-stone-300 flex items-center justify-center active:scale-95 transition-all shadow-sm">
              <Copy className="w-4 h-4 text-stone-300" />
            </button>
          </div>
        </div>

        {/* Big Heading Readout Box: 91° पूर्व (E) True North */}
        <div className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-[#FBF3E8] via-[#EFE2CE] to-[#DCBF9E] text-stone-950 flex items-center justify-between shadow-lg">
          <span className="text-xl font-black font-serif tracking-tight">
            {displayDeg}° {liveZone.nameHi.split(' ')[0]} ({liveZone.code})
          </span>
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-stone-900/10 border border-stone-800/20 text-stone-900">
            True North
          </span>
        </div>

        {/* Location & Coordinates */}
        <div className="text-center text-[11px] font-bold text-stone-400">
          <span>{location?.city || 'Pune'}, {location?.region || 'Maharashtra'}</span>
          <span className="mx-1.5">•</span>
          <span className="font-mono">{location ? `${location.latitude.toFixed(4)}°N, ${location.longitude.toFixed(4)}°E` : '18.5504°N, 73.9201°E'}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE 6 SUB-TABS (EXACTLY AS IN USER SCREENSHOTS) */}
      {/* ========================================================================= */}
      <div className="w-full max-w-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 my-1">
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
                  ? "bg-stone-800 text-white border-white/40 shadow-[0_0_12px_rgba(255,255,255,0.25)] scale-[1.03]"
                  : "bg-stone-950/80 text-stone-400 border-white/10 hover:text-white hover:border-white/25"
              )}
            >
              <span className="text-xs">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. LIVE DIRECTION ADVICE & REVERSE FINDER (PRESENT IN VASTU SUITE) */}
      {/* ========================================================================= */}
      <div className="w-full rounded-2xl p-3 border border-amber-500/40 bg-gradient-to-r from-[#1E140C] via-[#2A180E] to-[#140A04] shadow-xl my-1.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-black uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span>{isHi ? 'लाइव दिशा सुझाव (Live Advice)' : 'Live Direction Recommendation'}</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {liveZone.code} • {isHi ? liveZone.elementHi : liveZone.element}
          </span>
        </div>

        <div className="text-xs font-bold leading-snug">
          <span className="text-emerald-400 font-black block">
            {isHi ? '✓ इसके लिए उत्तम:' : '✓ Optimal For:'} <span className="text-white">{liveHeadingAdvice.idealFor}</span>
          </span>
          <span className="text-rose-400 font-bold text-[11px] block mt-0.5">
            {isHi ? '✕ इससे बचें:' : '✕ Strictly Avoid:'} <span className="text-stone-300">{liveHeadingAdvice.avoidFor}</span>
          </span>
        </div>
      </div>

      {/* Reverse Finder: "What do you want to place?" */}
      <div className="w-full rounded-2xl p-3 bg-black/60 border border-white/10 my-1 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span>{isHi ? 'किस कार्य हेतु दिशा चाहिए?' : 'Find Best Direction For:'}</span>
          </span>
          <select
            value={targetActivity}
            onChange={(e) => {
              setTargetActivity(e.target.value);
              triggerHaptic();
            }}
            className="p-1 px-2 rounded-lg bg-stone-900 border border-white/20 text-xs font-black text-amber-300 focus:outline-none"
          >
            <option value="study">{isHi ? '📚 अध्ययन / पढ़ाई (Study)' : '📚 Study & Reading'}</option>
            <option value="work">{isHi ? '💻 वर्क फ्रॉम होम / ऑफिस' : '💻 Work / Home Office'}</option>
            <option value="sleep">{isHi ? '🛏️ मास्टर बेडरूम / शयन' : '🛏️ Master Bedroom'}</option>
            <option value="mandir">{isHi ? '🪔 पूजा घर / मंदिर' : '🪔 Pooja Mandir'}</option>
            <option value="kitchen">{isHi ? '🍳 रसोई / गैस चूल्हा' : '🍳 Kitchen / Cooking'}</option>
            <option value="cash">{isHi ? '💰 तिजोरी / रोकड़' : '💰 Cash Safe / Vault'}</option>
            <option value="toilet">{isHi ? '🚿 शौचालय / निष्कासन' : '🚿 Toilet / Disposal'}</option>
          </select>
        </div>

        <div className="p-2.5 rounded-xl bg-stone-900/90 border border-amber-500/30 flex flex-col gap-1 text-xs">
          <div className="flex items-center justify-between">
            <span className={cn("font-black text-sm", activityDirections.color)}>
              {activityDirections.title}
            </span>
            <span className="text-[9px] font-bold text-stone-400">
              {isHi ? 'लक्ष्य कोण:' : 'Target Angle:'} <strong className="text-white font-mono">{activityDirections.targetDeg}°</strong>
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-stone-200">
            <strong className="text-emerald-400">{isHi ? 'सर्वोत्तम दिशाएं:' : 'Best Zones:'}</strong>
            <span>{activityDirections.bestZones.join(', ')}</span>
          </div>
          <p className="text-[11px] text-amber-200/90 font-bold leading-snug">
            {activityDirections.facing}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB CONTENT: 1. VASTU */}
      {/* ========================================================================= */}
      {activeTab === 'vastu' && (
        <div className="w-full flex flex-col gap-3">
          {/* VASTU ANALYZER (COLLAPSIBLE ACCORDION) */}
          <div className="w-full rounded-3xl border border-amber-500/40 bg-gradient-to-b from-[#1E140C] via-[#140D07] to-[#0D0704] shadow-2xl overflow-hidden">
            <button
              onClick={() => {
                setIsVastuAnalyzerOpen(!isVastuAnalyzerOpen);
                triggerHaptic();
              }}
              className="w-full p-3.5 flex items-center justify-between bg-[#19110B] border-b border-white/10 text-left"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="font-black text-sm text-amber-400 uppercase tracking-wider">
                  {isHi ? 'वास्तु विश्लेषक (Vastu Analyzer)' : 'VASTU ANALYZER'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Score: 100%
                </span>
                {isVastuAnalyzerOpen ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
              </div>
            </button>

            {isVastuAnalyzerOpen && (
              <div className="p-4 flex flex-col gap-3 text-xs">
                {/* 1. Select Room Type */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                    {isHi ? 'कक्ष का प्रकार चुनें (SELECT ROOM TYPE):' : 'SELECT ROOM TYPE:'}
                  </label>
                  <select
                    value={analyzerRoomType}
                    onChange={(e) => setAnalyzerRoomType(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-stone-900 border border-white/20 text-white font-black text-xs focus:outline-none"
                  >
                    <option value="entrance">🚪 Entrance / Main Door</option>
                    <option value="master_bedroom">🛏️ Master Bedroom</option>
                    <option value="study_room">📚 Study Room / Desk</option>
                    <option value="kitchen">🍳 Kitchen / Cooking</option>
                    <option value="pooja_mandir">🪔 Pooja Mandir</option>
                    <option value="cash_locker">💰 Cash Locker / Safe</option>
                    <option value="toilet">🚿 Toilet / Bathroom</option>
                  </select>
                </div>

                {/* 2. Direction Input (Degrees) */}
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                    {isHi ? 'मुख्य द्वार दिशा (अंश):' : 'MAIN DOOR DIRECTION (DEGREES):'}
                  </label>
                  <button
                    onClick={() => {
                      setAnalyzerDegrees(displayDeg);
                      triggerHaptic();
                    }}
                    className="text-[9px] font-bold text-cyan-400 hover:underline"
                  >
                    {isHi ? 'लाइव दिशा लें' : 'Use Live Compass'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={359}
                    value={analyzerDegrees}
                    onChange={(e) => setAnalyzerDegrees(parseInt(e.target.value, 10) || 0)}
                    className="w-24 p-2 rounded-xl bg-stone-900 border border-white/20 text-white font-mono font-black text-base text-center focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-stone-300 font-bold">°</span>
                  <button
                    onClick={handleSaveRoom}
                    className="ml-auto px-3 py-2 rounded-xl bg-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-md active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isHi ? 'सहेजें' : 'SAVE'}</span>
                  </button>
                </div>

                {/* Saved Rooms */}
                {savedRooms.length > 0 && (
                  <div className="flex flex-col gap-1 p-2 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[9.5px] font-black text-stone-400 uppercase">
                      {isHi ? 'सहेजे गए कक्ष:' : 'SAVED ROOMS:'}
                    </span>
                    {savedRooms.map(rm => (
                      <div key={rm.id} className="flex items-center justify-between text-[11px] py-0.5">
                        <span className="font-bold text-stone-200">{rm.roomType} ({rm.degrees}°)</span>
                        <span className={rm.isAuspicious ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                          {rm.padaCode} • {rm.isAuspicious ? 'Auspicious' : 'Inauspicious'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Gate Pada Result Card */}
                <div className={cn(
                  "w-full rounded-2xl p-3 border flex flex-col gap-1",
                  analyzerPada.isAuspicious ? "bg-emerald-950/40 border-emerald-500/50" : "bg-rose-950/40 border-rose-500/50"
                )}>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-white">
                      Gate Pada: {analyzerPada.nameEn} ({analyzerPada.code})
                    </span>
                    <span className={cn(
                      "font-black text-xs uppercase tracking-wider",
                      analyzerPada.isAuspicious ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {analyzerPada.isAuspicious ? 'AUSPICIOUS' : 'INAUSPICIOUS'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-200 font-bold">
                    {analyzerPada.isAuspicious 
                      ? (isHi ? 'प्रभाव: समृद्धि, धन लाभ, पारिवारिक सुख' : 'Effect: Prosperity, wealth influx, family harmony')
                      : (isHi ? 'प्रभाव: दुर्घटना भय, अकारण धन हानि, चिंता' : 'Effect: Accident hazard, losses, restlessness')}
                  </p>
                </div>

                {/* Vastu Tips & Brahmasthan */}
                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-amber-400 font-black text-[10px] uppercase tracking-wider">
                    {isHi ? 'वास्तु परामर्श (VASTU TIPS):' : 'VASTU TIPS'}
                  </span>
                  <p className="text-[11px] text-stone-300 leading-snug">
                    Look for the favorable BEST directions highlighted on the compass dial for optimal room placement.
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-amber-400 font-black text-[10px] uppercase tracking-wider">
                    {isHi ? 'ब्रह्मस्थान (केंद्र बिंदु):' : 'BRAHMASTHAN (CENTER POINT)'}
                  </span>
                  <p className="text-[11px] text-stone-300 leading-snug">
                    The exact center of your home is the Brahmasthan. Keep it clean, empty, light, and free from heavy pillars, walls, toilets, or kitchens.
                  </p>
                </div>

                {/* Easy Vastu Remedies */}
                <div className="flex flex-col gap-1.5 mt-1 pt-2 border-t border-white/10">
                  <span className="text-amber-400 font-black text-[10px] uppercase tracking-wider">
                    {isHi ? 'सरल वास्तु उपाय (EASY VASTU REMEDIES):' : 'EASY VASTU REMEDIES'}
                  </span>
                  <div className="flex flex-col gap-1 text-[11px] text-stone-300">
                    <div>
                      <strong className="text-white block">🚽 Toilet in North-East:</strong>
                      <span>Keep sea salt bowl inside, place brass pyramid outside.</span>
                    </div>
                    <div>
                      <strong className="text-white block">🍳 Kitchen in South-West:</strong>
                      <span>Apply yellow tape around stove base or place a copper plate underneath.</span>
                    </div>
                    <div>
                      <strong className="text-white block">🚪 Main Door in South-West:</strong>
                      <span>Paint the door golden-yellow or place lead metal helix.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* INTERACTIVE 9-GRID FLOORPLAN MAPPER */}
          <div className="w-full rounded-3xl p-4 border border-amber-500/40 bg-gradient-to-b from-[#1C140E] to-[#0A0503] shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-sm">▦</span>
                <span className="font-black text-xs text-amber-400 uppercase tracking-wider">
                  {isHi ? 'इंटरैक्टिव ९-ग्रिड नक्शा' : 'INTERACTIVE 9-GRID FLOORPLAN MAPPER'}
                </span>
              </div>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border",
                floorplanScore >= 80 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50" : "bg-amber-500/20 text-amber-300 border-amber-500/50"
              )}>
                Vastu Score: {floorplanScore}%
              </span>
            </div>

            {/* 3x3 Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-2xl bg-stone-900 border border-white/15 flex flex-col gap-1">
                <span className="text-[10px] font-black text-stone-400">वायव्य (NW)</span>
                <select
                  value={gridAssignments.NW}
                  onChange={(e) => setGridAssignments(prev => ({ ...prev, NW: e.target.value }))}
                  className="w-full p-1 rounded-lg bg-stone-800 text-[10px] font-black text-white focus:outline-none"
                >
                  <option value="bathroom">Bathroom ⌵</option>
                  <option value="guest_room">Guest Room ⌵</option>
                  <option value="kitchen">Kitchen ⌵</option>
                </select>
              </div>

              <div className="p-2 rounded-2xl bg-stone-900 border border-white/15 flex flex-col gap-1">
                <span className="text-[10px] font-black text-stone-400">उत्तर (N)</span>
                <select
                  value={gridAssignments.N}
                  onChange={(e) => setGridAssignments(prev => ({ ...prev, N: e.target.value }))}
                  className="w-full p-1 rounded-lg bg-stone-800 text-[10px] font-black text-white focus:outline-none"
                >
                  <option value="main_entrance">Main Entra ⌵</option>
                  <option value="cash_locker">Cash Locker ⌵</option>
                  <option value="bathroom">Bathroom ⌵</option>
                </select>
              </div>

              <div className="p-2 rounded-2xl bg-stone-900 border border-white/15 flex flex-col gap-1">
                <span className="text-[10px] font-black text-stone-400">ईशान (NE)</span>
                <select
                  value={gridAssignments.NE}
                  onChange={(e) => setGridAssignments(prev => ({ ...prev, NE: e.target.value }))}
                  className="w-full p-1 rounded-lg bg-stone-800 text-[10px] font-black text-white focus:outline-none"
                >
                  <option value="pooja_mandir">Pooja Mand ⌵</option>
                  <option value="study_room">Study Room ⌵</option>
                  <option value="kitchen">Kitchen ⌵</option>
                </select>
              </div>

              <div className="p-2 rounded-2xl bg-stone-900 border border-white/15 flex flex-col gap-1">
                <span className="text-[10px] font-black text-stone-400">पश्चिम (W)</span>
                <select
                  value={gridAssignments.W}
                  onChange={(e) => setGridAssignments(prev => ({ ...prev, W: e.target.value }))}
                  className="w-full p-1 rounded-lg bg-stone-800 text-[10px] font-black text-white focus:outline-none"
                >
                  <option value="study_room">Study Room ⌵</option>
                  <option value="dining">Dining ⌵</option>
                  <option value="bedroom">Bedroom ⌵</option>
                </select>
              </div>

              <div className="p-2 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex flex-col gap-1">
                <span className="text-[10px] font-black text-amber-300">ब्रह्मस्थान</span>
                <select
                  value={gridAssignments.Center}
                  onChange={(e) => setGridAssignments(prev => ({ ...prev, Center: e.target.value }))}
                  className="w-full p-1 rounded-lg bg-stone-800 text-[10px] font-black text-white focus:outline-none"
                >
                  <option value="open_space">Open Spac ⌵</option>
                  <option value="courtyard">Courtyard ⌵</option>
                  <option value="kitchen">Kitchen ⌵</option>
                </select>
              </div>

              <div className="p-2 rounded-2xl bg-stone-900 border border-white/15 flex flex-col gap-1">
                <span className="text-[10px] font-black text-stone-400">पूर्व (E)</span>
                <select
                  value={gridAssignments.E}
                  onChange={(e) => setGridAssignments(prev => ({ ...prev, E: e.target.value }))}
                  className="w-full p-1 rounded-lg bg-stone-800 text-[10px] font-black text-white focus:outline-none"
                >
                  <option value="cash_locker">Cash Lock ⌵</option>
                  <option value="living_room">Living Room ⌵</option>
                  <option value="bathroom">Bathroom ⌵</option>
                </select>
              </div>

              <div className="p-2 rounded-2xl bg-stone-900 border border-white/15 flex flex-col gap-1">
                <span className="text-[10px] font-black text-stone-400">नैऋत्य (SW)</span>
                <select
                  value={gridAssignments.SW}
                  onChange={(e) => setGridAssignments(prev => ({ ...prev, SW: e.target.value }))}
                  className="w-full p-1 rounded-lg bg-stone-800 text-[10px] font-black text-white focus:outline-none"
                >
                  <option value="master_bedroom">Master Bed ⌵</option>
                  <option value="kitchen">Kitchen ⌵</option>
                  <option value="bathroom">Bathroom ⌵</option>
                </select>
              </div>

              <div className="p-2 rounded-2xl bg-stone-900 border border-white/15 flex flex-col gap-1">
                <span className="text-[10px] font-black text-stone-400">दक्षिण (S)</span>
                <select
                  value={gridAssignments.S}
                  onChange={(e) => setGridAssignments(prev => ({ ...prev, S: e.target.value }))}
                  className="w-full p-1 rounded-lg bg-stone-800 text-[10px] font-black text-white focus:outline-none"
                >
                  <option value="open_space">Open Spac ⌵</option>
                  <option value="bedroom">Bedroom ⌵</option>
                  <option value="storage">Storage ⌵</option>
                </select>
              </div>

              <div className="p-2 rounded-2xl bg-stone-900 border border-white/15 flex flex-col gap-1">
                <span className="text-[10px] font-black text-stone-400">आग्नेय (SE)</span>
                <select
                  value={gridAssignments.SE}
                  onChange={(e) => setGridAssignments(prev => ({ ...prev, SE: e.target.value }))}
                  className="w-full p-1 rounded-lg bg-stone-800 text-[10px] font-black text-white focus:outline-none"
                >
                  <option value="kitchen">Kitchen / R ⌵</option>
                  <option value="bedroom">Bedroom ⌵</option>
                  <option value="bathroom">Bathroom ⌵</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB CONTENT: 2. JYOTISH (VEDIC ASTROLOGY & CHOGHADIYA) */}
      {/* ========================================================================= */}
      {activeTab === 'jyotish' && (
        <div className="w-full flex flex-col gap-3">
          {/* Card 1: Today's Best Muhurat */}
          <div className="w-full rounded-3xl p-4 border border-fuchsia-900/40 bg-gradient-to-b from-[#1E0B24] to-[#0D0410] shadow-2xl flex flex-col gap-2">
            <span className="text-sm font-black text-fuchsia-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-fuchsia-400" />
              <span>Today's Best Muhurat</span>
            </span>
            <div className="flex items-center justify-between text-xs font-bold pt-1">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase">Now:</span>
                <span className="text-amber-400 font-mono font-black text-sm">
                  {choghadiya.currentSlot.name.toUpperCase()} • {choghadiya.currentSlot.startTime}–{choghadiya.currentSlot.endTime}
                </span>
              </div>
              <div className="text-right">
                <span className="text-stone-400 block text-[10px] uppercase">Next good:</span>
                <span className="text-emerald-400 font-mono font-black text-sm">
                  {choghadiya.nextGoodSlot ? `${choghadiya.nextGoodSlot.name} • ${choghadiya.nextGoodSlot.startTime}` : 'Amrit • Morning'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Vedic Astrology (Rashi & Direction) */}
          <div className="w-full rounded-3xl p-4 border border-fuchsia-900/40 bg-gradient-to-b from-[#1C0A20] to-[#0A030C] shadow-2xl flex flex-col gap-3">
            <span className="text-sm font-black text-fuchsia-300">
              Vedic Astrology
            </span>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                SELECT YOUR ZODIAC (RASHI):
              </label>
              <select
                value={selectedRashiId}
                onChange={(e) => {
                  setSelectedRashiId(e.target.value);
                  triggerHaptic();
                }}
                className="w-full p-3 rounded-2xl bg-stone-900 border border-white/20 text-white font-black text-sm focus:outline-none"
              >
                {VEDIC_RASHIS.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.symbol} {r.nameHi} - {r.direction}
                  </option>
                ))}
              </select>
            </div>

            {/* Astrology Tips */}
            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-1 text-xs">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                ASTROLOGY TIPS
              </span>
              <p className="text-stone-300 leading-snug">
                Your auspicious direction based on your Rashi is highlighted on the compass: <strong className="text-amber-300">{selectedRashi.direction} ({selectedRashi.degSpan})</strong>.
              </p>
              <p className="text-[11px] text-emerald-300 mt-0.5">
                {selectedRashi.auspiciousTip}
              </p>
            </div>
          </div>

          {/* Card 3: Choghadiya Full Schedule */}
          <div className="w-full rounded-3xl p-4 border border-amber-900/40 bg-gradient-to-b from-[#1C120A] to-[#0A0602] shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <div>
                  <h3 className="text-sm font-black text-white">Choghadiya</h3>
                  <span className="text-[9.5px] font-bold text-stone-400 uppercase">{choghadiya.dateStr.toUpperCase()}</span>
                </div>
              </div>
              <button className="px-2.5 py-1 rounded-xl bg-stone-800 border border-white/15 text-[10px] font-black uppercase text-amber-300 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-400" />
                <span>Weekly</span>
              </button>
            </div>

            {/* Now vs Next Good Prominent Blocks */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col">
                <span className="text-[9px] font-black uppercase text-stone-400">NOW</span>
                <span className="text-xl font-serif font-black text-emerald-400 leading-tight mt-0.5">
                  {choghadiya.currentSlot.name}
                </span>
                <span className="text-[10px] font-mono text-stone-300 font-bold mt-1">
                  {choghadiya.currentSlot.startTime} - {choghadiya.currentSlot.endTime}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col">
                <span className="text-[9px] font-black uppercase text-stone-400">NEXT GOOD</span>
                <span className="text-xl font-serif font-black text-emerald-400 leading-tight mt-0.5">
                  {choghadiya.nextGoodSlot?.name || 'Amrit'}
                </span>
                <span className="text-[10px] font-mono text-stone-300 font-bold mt-1">
                  {choghadiya.nextGoodSlot ? `${choghadiya.nextGoodSlot.startTime} - ${choghadiya.nextGoodSlot.endTime}` : 'Morning Slot'}
                </span>
              </div>
            </div>

            {/* Summary Row */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
              <div className="p-2 rounded-xl bg-black/40 border border-white/10 flex flex-col items-center">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 mb-0.5" />
                <span className="text-base text-white">{choghadiya.goodCount}</span>
                <span className="text-[8px] uppercase text-stone-400">GOOD</span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-white/10 flex flex-col items-center">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mb-0.5" />
                <span className="text-base text-white">{choghadiya.avoidCount}</span>
                <span className="text-[8px] uppercase text-stone-400">AVOID</span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-white/10 flex flex-col items-center">
                <Activity className="w-3.5 h-3.5 text-sky-400 mb-0.5" />
                <span className="text-base text-white">8</span>
                <span className="text-[8px] uppercase text-stone-400">SLOTS</span>
              </div>
            </div>

            {/* Day / Night Toggle */}
            <div className="flex items-center p-1 rounded-2xl bg-black/60 border border-white/10">
              <button
                onClick={() => setChoghadiyaTimeSlot('day')}
                className={cn(
                  "flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all",
                  choghadiyaTimeSlot === 'day' ? "bg-amber-500 text-stone-950 font-black shadow-sm" : "text-stone-400"
                )}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Daily Day</span>
              </button>
              <button
                onClick={() => setChoghadiyaTimeSlot('night')}
                className={cn(
                  "flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all",
                  choghadiyaTimeSlot === 'night' ? "bg-stone-800 text-white font-black shadow-sm" : "text-stone-400"
                )}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Night</span>
              </button>
            </div>

            {/* Slot List */}
            <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto no-scrollbar text-xs">
              {(choghadiyaTimeSlot === 'day' ? choghadiya.daySlots : choghadiya.nightSlots).map((slot, idx) => (
                <div 
                  key={idx}
                  className="p-2.5 rounded-2xl bg-stone-900/80 border border-white/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2.5 py-1 rounded-xl font-bold text-[10.5px] uppercase border",
                      slot.type === 'good' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50" :
                      slot.type === 'avoid' ? "bg-rose-950/60 text-rose-300 border-rose-500/40" :
                      "bg-sky-950/60 text-sky-300 border-sky-500/40"
                    )}>
                      {slot.name}
                    </span>
                    <div className="flex flex-col text-left">
                      <span className="font-mono font-bold text-white text-xs">{slot.startTime} - {slot.endTime}</span>
                      <span className="text-[9.5px] text-stone-400">{slot.effect}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB CONTENT: 3. NUMEROLOGY (LO SHU GRID & LUCKY DIRECTIONS) */}
      {/* ========================================================================= */}
      {activeTab === 'numerology' && (
        <div className="w-full flex flex-col gap-3">
          <div className="w-full rounded-3xl p-4 border border-purple-900/40 bg-gradient-to-b from-[#180A24] to-[#0B0412] shadow-2xl flex flex-col gap-3 text-xs">
            <span className="font-black text-sm text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>#</span>
              <span>Numerology & Lo Shu Grid</span>
            </span>

            {/* Birth Date Picker */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-900 border border-white/10">
              <span className="text-[10.5px] font-black text-stone-300 uppercase">
                {isHi ? 'जन्म तिथि दर्ज करें:' : 'Birth Date:'}
              </span>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="bg-black text-white p-1.5 px-2 rounded-xl border border-white/20 text-xs font-mono font-bold focus:outline-none"
              />
            </div>

            {/* Driver & Conductor */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/40">
                <span className="text-[9.5px] font-black text-purple-300 uppercase block">
                  {isHi ? 'मूलांक (Driver):' : 'Driver (Mulank):'}
                </span>
                <span className="text-3xl font-black text-white font-mono">{numerologyDetails.mulank}</span>
                <span className="text-[9px] text-stone-400 block mt-0.5">{numerologyDetails.lucky.lord}</span>
              </div>

              <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/40">
                <span className="text-[9.5px] font-black text-purple-300 uppercase block">
                  {isHi ? 'भाग्यांक (Conductor):' : 'Conductor (Bhagyank):'}
                </span>
                <span className="text-3xl font-black text-white font-mono">{numerologyDetails.bhagyank}</span>
                <span className="text-[9px] text-stone-400 block mt-0.5">Destiny Path</span>
              </div>
            </div>

            {/* Lo Shu 3x3 Magic Grid */}
            <div className="p-3 rounded-2xl bg-black/50 border border-white/10 flex flex-col gap-2">
              <span className="text-[10px] font-black text-purple-300 uppercase">
                Lo Shu 3x3 Magic Grid Mapping:
              </span>
              <div className="grid grid-cols-3 gap-2 text-center font-mono font-black text-base">
                {[4, 9, 2, 3, 5, 7, 8, 1, 6].map((num) => {
                  const count = numerologyDetails.loShuCounts[num] || 0;
                  const isPresent = count > 0;
                  return (
                    <div 
                      key={num}
                      className={cn(
                        "p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all",
                        isPresent ? "bg-purple-600/30 border-purple-400/60 text-white shadow-sm" : "bg-stone-900/60 border-white/10 text-stone-600"
                      )}
                    >
                      <span>{num}</span>
                      <span className="text-[8px] font-sans font-bold text-stone-400">
                        {isPresent ? `${count}x` : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lucky Direction Card */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/50 flex flex-col gap-1">
              <span className="text-purple-300 font-black text-[11px] uppercase">
                🎯 {isHi ? 'आपके मूलांक की शुभ दिशा:' : 'Personal Lucky Compass Direction:'}
              </span>
              <span className="text-base font-black text-white">
                {numerologyDetails.lucky.dir} ({numerologyDetails.lucky.deg})
              </span>
              <p className="text-[11px] text-stone-300 leading-snug">
                Align your study desk or work chair to face <strong className="text-white">{numerologyDetails.lucky.dir}</strong> to activate positive cosmic vibrations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB CONTENT: 4. SADHANA (MEDITATION POSTURE & SACRED ALIGNMENT) */}
      {/* ========================================================================= */}
      {activeTab === 'sadhana' && (
        <div className="w-full flex flex-col gap-3">
          <div className="w-full rounded-3xl p-4 border border-amber-900/40 bg-gradient-to-b from-[#241A08] to-[#0E0A02] shadow-2xl flex flex-col gap-3 text-xs">
            <span className="font-black text-sm text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>⊙</span>
              <span>Sadhana & Meditation Direction</span>
            </span>

            {/* Sacred Directions Rules */}
            <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex flex-col gap-1.5 text-[11px] text-stone-200">
              <strong className="text-amber-300">Sacred Facing Rules for Sadhana:</strong>
              <p>• <strong>Face East (पूर्व मुखी):</strong> Ideal for Gayatri Japa, Surya Sadhana, mental clarity, and intellectual light.</p>
              <p>• <strong>Face North (उत्तर मुखी):</strong> Ideal for Lakshmi, Kuber, and mental stillness.</p>
              <p>• <strong>Face North-East (ईशान मुखी):</strong> Supreme for Mahadev, Guru Mantra, Kundalini, and Moksha.</p>
              <p className="text-rose-400 font-bold mt-0.5">• Never face South for routine daily peaceful meditation.</p>
            </div>

            {/* Interactive Japa Mala Counter */}
            <div className="p-4 rounded-2xl bg-stone-900/90 border border-amber-500/40 flex flex-col items-center text-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                108 MALA JAPA COUNTER
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black font-mono text-amber-300">{japaCount}</span>
                <span className="text-stone-400 text-sm">/ {japaTarget}</span>
              </div>

              <div className="flex items-center gap-3 mt-1">
                <button
                  onClick={() => {
                    setJapaCount(prev => (prev + 1) % 109);
                    triggerHaptic();
                  }}
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all"
                >
                  COUNT JAPA 📿
                </button>
                <button
                  onClick={() => {
                    setJapaCount(0);
                    triggerHaptic();
                  }}
                  className="p-2 rounded-full bg-stone-800 text-stone-400 hover:text-white"
                  title="Reset"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. TAB CONTENT: 5. FENG SHUI (BAGUA MAP FROM SCREENSHOT) */}
      {/* ========================================================================= */}
      {activeTab === 'feng_shui' && (
        <div className="w-full flex flex-col gap-3">
          {/* FENG SHUI ACCORDION (EXACTLY AS IN SCREENSHOT) */}
          <div className="w-full rounded-3xl border border-sky-900/40 bg-gradient-to-b from-[#081524] via-[#040C16] to-[#02060C] shadow-2xl overflow-hidden">
            <button
              onClick={() => {
                setIsFengShuiOpen(!isFengShuiOpen);
                triggerHaptic();
              }}
              className="w-full p-3.5 flex items-center justify-between bg-[#06121E] border-b border-white/10 text-left"
            >
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-sky-400" />
                <span className="font-black text-sm text-sky-400 uppercase tracking-wider">
                  FENG SHUI
                </span>
              </div>
              {isFengShuiOpen ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
            </button>

            {isFengShuiOpen && (
              <div className="p-4 flex flex-col gap-3 text-xs">
                {/* Bagua Map Header with Door Dropdown */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-sky-300 font-serif">
                    Bagua Map
                  </h3>
                  <select
                    value={baguaDoorFacing}
                    onChange={(e) => {
                      setBaguaDoorFacing(e.target.value);
                      triggerHaptic();
                    }}
                    className="p-1.5 px-3 rounded-xl bg-stone-900 border border-white/20 text-white font-black text-[10px] uppercase focus:outline-none"
                  >
                    <option value="NORTH DOOR">NORTH DOOR ⌵</option>
                    <option value="EAST DOOR">EAST DOOR ⌵</option>
                    <option value="SOUTH DOOR">SOUTH DOOR ⌵</option>
                    <option value="WEST DOOR">WEST DOOR ⌵</option>
                    <option value="NE DOOR">NE DOOR ⌵</option>
                    <option value="SE DOOR">SE DOOR ⌵</option>
                    <option value="SW DOOR">SW DOOR ⌵</option>
                    <option value="NW DOOR">NW DOOR ⌵</option>
                  </select>
                </div>

                <p className="text-[11px] text-stone-300 leading-snug">
                  Select your front door facing direction to align the Bagua map dynamically.
                </p>

                {/* 4/8 Bagua Quadrant Cards (Matching User Screenshot) */}
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="p-3 rounded-2xl bg-stone-900/80 border border-white/10 flex flex-col">
                    <span className="text-[9.5px] font-black uppercase text-stone-400">WEALTH</span>
                    <span className="text-sm font-black text-sky-400 mt-0.5">South-East</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-900/80 border border-white/10 flex flex-col">
                    <span className="text-[9.5px] font-black uppercase text-stone-400">LOVE</span>
                    <span className="text-sm font-black text-pink-400 mt-0.5">South-West</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-900/80 border border-white/10 flex flex-col">
                    <span className="text-[9.5px] font-black uppercase text-stone-400">CAREER</span>
                    <span className="text-sm font-black text-cyan-400 mt-0.5">North</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-900/80 border border-white/10 flex flex-col">
                    <span className="text-[9.5px] font-black uppercase text-stone-400">FAMILY</span>
                    <span className="text-sm font-black text-emerald-400 mt-0.5">East</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-900/80 border border-white/10 flex flex-col">
                    <span className="text-[9.5px] font-black uppercase text-stone-400">FAME</span>
                    <span className="text-sm font-black text-rose-400 mt-0.5">South</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-900/80 border border-white/10 flex flex-col">
                    <span className="text-[9.5px] font-black uppercase text-stone-400">CHILDREN</span>
                    <span className="text-sm font-black text-slate-300 mt-0.5">West</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-900/80 border border-white/10 flex flex-col">
                    <span className="text-[9.5px] font-black uppercase text-stone-400">KNOWLEDGE</span>
                    <span className="text-sm font-black text-yellow-400 mt-0.5">North-East</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-900/80 border border-white/10 flex flex-col">
                    <span className="text-[9.5px] font-black uppercase text-stone-400">HELPFUL PEOPLE</span>
                    <span className="text-sm font-black text-indigo-400 mt-0.5">North-West</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. TAB CONTENT: 6. QIBLA (LIVE KAABA BEARING) */}
      {/* ========================================================================= */}
      {activeTab === 'qibla' && (
        <div className="w-full flex flex-col gap-3">
          <div className="w-full rounded-3xl p-4 border border-emerald-900/40 bg-gradient-to-b from-[#0A1E14] to-[#040E0A] shadow-2xl flex flex-col gap-3 text-xs text-center">
            <span className="font-black text-sm text-emerald-300 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <span>↗</span>
              <span>Qibla Direction (Makkah Al-Mukarramah)</span>
            </span>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center gap-1">
              <span className="text-[10px] uppercase text-stone-400 font-bold">Kaaba Bearing from Your GPS:</span>
              <span className="text-3xl font-black font-mono text-emerald-400">{qiblaData.qiblaBearing}°</span>
              <span className="text-[10.5px] text-stone-300 font-bold">
                Distance: {qiblaData.distanceKm} km
              </span>
            </div>

            <div className={cn(
              "p-3 rounded-2xl border flex items-center justify-center gap-2 font-black transition-all",
              qiblaData.isFacingQibla ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-stone-900 text-stone-400 border-white/10"
            )}>
              <Navigation className="w-4 h-4" />
              <span>{qiblaData.isFacingQibla ? "ALIGNED WITH KAABA ✓" : `Rotate to ${qiblaData.qiblaBearing}° to face Qibla`}</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. CREATOR BRANDING FOOTER CARD (EXACTLY AS IN ALL SCREENSHOTS) */}
      {/* ========================================================================= */}
      <div className="w-full max-w-sm rounded-[24px] p-4 bg-gradient-to-r from-[#181109] via-[#2A180B] to-[#140C04] border border-amber-500/40 shadow-2xl flex flex-col items-center justify-center text-center mt-4">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm font-serif font-black tracking-wider text-amber-300 uppercase">
            BY AADISH JAIN
          </h4>
          <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-amber-500 text-stone-950 shadow-sm">
            CREATOR
          </span>
        </div>

        <p className="text-[10.5px] text-stone-300 font-bold tracking-wide">
          Spiritual & Vastu Guidance Services
        </p>

        <span className="text-[9px] text-stone-400 mt-1 flex items-center gap-1 font-bold">
          <span>Made with</span>
          <span className="text-rose-500">❤️</span>
          <span>for Spiritual Alignment</span>
        </span>
      </div>

    </div>
  );
};
