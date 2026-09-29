import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Compass, 
  Share2, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp,
  Info,
  Check,
  Building,
  Flame,
  Droplets,
  Wind,
  Mountain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export interface VastuAuditScorecardProps {
  language: string;
  theme: string;
  currentHeading: number | null;
  onHaptic?: (style?: ImpactStyle) => void;
}

export interface RoomDefinition {
  id: string;
  nameEn: string;
  nameHi: string;
  icon: string;
  weight: number;
  auspiciousDirections: string[];
  neutralDirections: string[];
  doshaDirections: string[];
  remedyEn: string;
  remedyHi: string;
}

export const VASTU_ROOM_DEFINITIONS: RoomDefinition[] = [
  {
    id: 'entrance',
    nameEn: 'Main Entrance (मुख्य द्वार)',
    nameHi: 'मुख्य द्वार (Main Door)',
    icon: '🚪',
    weight: 18,
    auspiciousDirections: ['N', 'NE', 'E'],
    neutralDirections: ['NW', 'W'],
    doshaDirections: ['S', 'SE', 'SW'],
    remedyEn: 'Place a brass Swastika, yellow marble threshold, or Surya Yantra at the entrance to block negative energy.',
    remedyHi: 'प्रवेश द्वार पर पीतल का स्वास्तिक, सूर्य यंत्र या पंचधातु पिरामिड लगाएं। दहलीज पर पीला रंग शुभ फल देता है।'
  },
  {
    id: 'pooja',
    nameEn: 'Mandir / Pooja Room',
    nameHi: 'पूजा घर / मंदिर (Mandir)',
    icon: '🪔',
    weight: 16,
    auspiciousDirections: ['NE', 'E', 'N'],
    neutralDirections: ['W'],
    doshaDirections: ['S', 'SW', 'SE', 'NW'],
    remedyEn: 'Keep deities facing East or West so worshipper faces East/North. Place copper kalash with Gangajal in Northeast.',
    remedyHi: 'ईशान कोण में गंगाजल रखें। भगवान का मुख पूर्व/पश्चिम रखें। सफेद या हल्के पीले संगमरमर का प्रयोग करें।'
  },
  {
    id: 'kitchen',
    nameEn: 'Kitchen / Fire Element',
    nameHi: 'रसोई घर (Kitchen)',
    icon: '🍳',
    weight: 16,
    auspiciousDirections: ['SE', 'NW'],
    neutralDirections: ['E', 'S'],
    doshaDirections: ['NE', 'SW', 'N'],
    remedyEn: 'Ensure cook faces East. If kitchen is in Northeast or Southwest, place a zinc/copper pyramid under the stove.',
    remedyHi: 'खाना बनाते समय मुख पूर्व दिशा में होना चाहिए। ईशान दोष होने पर गैस चूल्हे के नीचे तांबे/कांस्य का पिरामिड रखें।'
  },
  {
    id: 'master_bedroom',
    nameEn: 'Master Bedroom',
    nameHi: 'मास्टर शयन कक्ष (Master Bedroom)',
    icon: '🛏️',
    weight: 14,
    auspiciousDirections: ['SW', 'S', 'W'],
    neutralDirections: ['NW'],
    doshaDirections: ['NE', 'SE', 'N'],
    remedyEn: 'Sleep with head towards South or East for grounding energy. Avoid mirrors directly reflecting the bed.',
    remedyHi: 'सोते समय सिर दक्षिण या पूर्व दिशा में रखें। शयनकक्ष में भारी लकड़ी का पलंग और भूरे/हल्के रंग शांति प्रदान करते हैं।'
  },
  {
    id: 'living_room',
    nameEn: 'Living / Drawing Room',
    nameHi: 'बैठक कक्ष (Living Room)',
    icon: '🛋️',
    weight: 10,
    auspiciousDirections: ['N', 'E', 'NE', 'NW'],
    neutralDirections: ['W', 'S'],
    doshaDirections: ['SW'],
    remedyEn: 'Keep heavy furniture towards South and West; keep Northeast light and open with natural ventilation.',
    remedyHi: 'भारी फर्नीचर दक्षिण और पश्चिम में रखें। उत्तर-पूर्व को खुला, स्वच्छ और हल्के इनडोर पौधों से सजाएं।'
  },
  {
    id: 'study',
    nameEn: 'Study / Home Office',
    nameHi: 'अध्ययन कक्ष / ऑफिस (Study Room)',
    icon: '📚',
    weight: 8,
    auspiciousDirections: ['E', 'NE', 'N', 'W'],
    neutralDirections: ['NW'],
    doshaDirections: ['S', 'SW', 'SE'],
    remedyEn: 'Sit facing North or East while studying or working. Place a crystal globe or Saraswati Yantra on desk.',
    remedyHi: 'पढ़ते या काम करते समय मुख उत्तर या पूर्व में रखें। मेज पर स्फटिक ग्लोब या विद्या यंत्र लाभकारी होता है।'
  },
  {
    id: 'toilet',
    nameEn: 'Toilet / Washroom',
    nameHi: 'शौचालय / बाथरूम (Toilet)',
    icon: '🚻',
    weight: 10,
    auspiciousDirections: ['NW', 'W', 'S'],
    neutralDirections: ['SE'],
    doshaDirections: ['NE', 'SW', 'N', 'E'],
    remedyEn: 'Major dosha if in Northeast or Center. Keep sea salt in an open glass bowl, keep door closed, install zinc strip.',
    remedyHi: 'उत्तर-पूर्व या केंद्र में शौचालय महादोष है। कांच की कटोरी में साबुत समुद्री नमक रखें और शौचालय का दरवाजा बंद रखें।'
  },
  {
    id: 'water_tank',
    nameEn: 'Overhead / Water Tank',
    nameHi: 'जल संचय / टंकी (Water Tank)',
    icon: '💧',
    weight: 8,
    auspiciousDirections: ['SW', 'W', 'S'],
    neutralDirections: ['NW'],
    doshaDirections: ['NE', 'SE', 'N'],
    remedyEn: 'Overhead tanks should be in Southwest/West for stability. Underground storage must be in Northeast.',
    remedyHi: 'छत की भारी पानी की टंकी दक्षिण-पश्चिम (नैऋत्य) में होनी चाहिए। भूमिगत जल संचय ईशान कोण में श्रेष्ठ है।'
  }
];

const DIRECTION_LABELS: Record<string, { en: string; hi: string; element: string }> = {
  'N': { en: 'North', hi: 'उत्तर', element: 'Water (जल)' },
  'NE': { en: 'Northeast', hi: 'ईशान', element: 'Water/Spirit (ईशान्य)' },
  'E': { en: 'East', hi: 'पूर्व', element: 'Air (वायु)' },
  'SE': { en: 'Southeast', hi: 'आग्नेय', element: 'Fire (अग्नि)' },
  'S': { en: 'South', hi: 'दक्षिण', element: 'Earth (पृथ्वी)' },
  'SW': { en: 'Southwest', hi: 'नैऋत्य', element: 'Earth (पृथ्वी)' },
  'W': { en: 'West', hi: 'पश्चिम', element: 'Space (आकाश)' },
  'NW': { en: 'Northwest', hi: 'वायव्य', element: 'Air (वायु)' },
};

const ALL_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export const VastuAuditScorecard: React.FC<VastuAuditScorecardProps> = ({
  language,
  theme,
  currentHeading,
  onHaptic
}) => {
  const isHi = language === 'hi';

  // State: Record of room_id -> selected direction code ('N', 'NE', etc.)
  const [roomDirections, setRoomDirections] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('com.spiritual.compass.vastu_audit_rooms');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Sensible standard default
    return {
      entrance: 'N',
      pooja: 'NE',
      kitchen: 'SE',
      master_bedroom: 'SW',
      living_room: 'E',
      study: 'E',
      toilet: 'NW',
      water_tank: 'SW'
    };
  });

  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);
  const [showDoshaOnly, setShowDoshaOnly] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Persist room directions
  useEffect(() => {
    try {
      localStorage.setItem('com.spiritual.compass.vastu_audit_rooms', JSON.stringify(roomDirections));
    } catch {}
  }, [roomDirections]);

  const handleSelectDirection = (roomId: string, dir: string) => {
    setRoomDirections(prev => ({ ...prev, [roomId]: dir }));
    try {
      Haptics.impact({ style: ImpactStyle.Light });
    } catch {}
    onHaptic?.(ImpactStyle.Light);
  };

  const handleTagWithCurrentHeading = (roomId: string) => {
    if (currentHeading === null) return;
    const norm = ((currentHeading % 360) + 360) % 360;
    const index = Math.round(norm / 45) % 8;
    const dir = ALL_DIRECTIONS[index];
    handleSelectDirection(roomId, dir);
  };

  // Calculate room status and overall score
  const { totalScore, roomEvaluations, doshaCount, auspiciousCount } = useMemo(() => {
    let earnedWeight = 0;
    let totalPossibleWeight = 0;
    let doshas = 0;
    let auspicious = 0;

    const evals = VASTU_ROOM_DEFINITIONS.map(room => {
      const selectedDir = roomDirections[room.id] || 'N';
      totalPossibleWeight += room.weight;

      let status: 'auspicious' | 'neutral' | 'dosha' = 'neutral';
      let scorePercent = 0.5;

      if (room.auspiciousDirections.includes(selectedDir)) {
        status = 'auspicious';
        scorePercent = 1.0;
        earnedWeight += room.weight;
        auspicious++;
      } else if (room.doshaDirections.includes(selectedDir)) {
        status = 'dosha';
        scorePercent = 0.0;
        earnedWeight += 0;
        doshas++;
      } else {
        status = 'neutral';
        scorePercent = 0.55;
        earnedWeight += room.weight * 0.55;
      }

      return {
        ...room,
        selectedDir,
        status,
        scorePercent
      };
    });

    const finalPercent = Math.round((earnedWeight / totalPossibleWeight) * 100);

    return {
      totalScore: finalPercent,
      roomEvaluations: evals,
      doshaCount: doshas,
      auspiciousCount: auspicious
    };
  }, [roomDirections]);

  // Overall Vastu Rating Badge
  const ratingDetails = useMemo(() => {
    if (totalScore >= 88) {
      return {
        titleEn: 'Param Shubh (Excellent Vastu)',
        titleHi: 'परम शुभ (सर्वोत्तम वास्तु संतुलन)',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/15 border-emerald-500/40',
        barColor: 'from-emerald-500 to-green-400'
      };
    }
    if (totalScore >= 70) {
      return {
        titleEn: 'Shubh (Good Vastu Harmony)',
        titleHi: 'शुभ (सकारात्मक वास्तु ऊर्जा)',
        color: 'text-emerald-300',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        barColor: 'from-teal-500 to-emerald-400'
      };
    }
    if (totalScore >= 50) {
      return {
        titleEn: 'Madhyam (Moderate — Remedies Suggested)',
        titleHi: 'मध्यम (साधारण — दोष निवारण आवश्यक)',
        color: 'text-amber-400',
        bg: 'bg-amber-500/15 border-amber-500/40',
        barColor: 'from-amber-500 to-yellow-400'
      };
    }
    return {
      titleEn: 'Dosha Prabal (Significant Remedies Needed)',
      titleHi: 'दोष प्रबल (तत्काल वास्तु उपाय अनुशंसित)',
      color: 'text-red-400',
      bg: 'bg-red-500/15 border-red-500/40',
      barColor: 'from-red-500 to-rose-400'
    };
  }, [totalScore]);

  const handleShareReport = async () => {
    const lines = [
      `🏡 ${isHi ? 'डिजिटल कंपास — वास्तु ऑडिट स्कोरकार्ड' : 'Digital Compass — Vastu Audit Scorecard'}`,
      `${isHi ? 'समग्र वास्तु स्कोर' : 'Overall Vastu Score'}: ${totalScore}% (${isHi ? ratingDetails.titleHi : ratingDetails.titleEn})`,
      `${isHi ? 'शुभ कक्ष' : 'Auspicious Rooms'}: ${auspiciousCount} | ${isHi ? 'वास्तु दोष' : 'Doshas'}: ${doshaCount}\n`,
      ...roomEvaluations.map(r => {
        const symbol = r.status === 'auspicious' ? '✅' : r.status === 'dosha' ? '⚠️' : '🔹';
        const dirName = isHi ? DIRECTION_LABELS[r.selectedDir]?.hi : DIRECTION_LABELS[r.selectedDir]?.en;
        return `${symbol} ${isHi ? r.nameHi : r.nameEn}: ${dirName} (${r.status.toUpperCase()})`;
      })
    ];
    const text = lines.join('\n');

    try {
      if (navigator.share) {
        await navigator.share({
          title: isHi ? 'वास्तु ऑडिट रिपोर्ट' : 'Vastu Audit Report',
          text
        });
      } else {
        await navigator.clipboard.writeText(text);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2500);
      }
    } catch {}
  };

  const handleResetDefaults = () => {
    setRoomDirections({
      entrance: 'N',
      pooja: 'NE',
      kitchen: 'SE',
      master_bedroom: 'SW',
      living_room: 'E',
      study: 'E',
      toilet: 'NW',
      water_tank: 'SW'
    });
    try {
      Haptics.impact({ style: ImpactStyle.Medium });
    } catch {}
  };

  const filteredEvaluations = showDoshaOnly 
    ? roomEvaluations.filter(r => r.status === 'dosha')
    : roomEvaluations;

  return (
    <div className={cn(
      "w-full rounded-2xl border p-4 sm:p-5 transition-all duration-300 shadow-md",
      theme === 'light'
        ? "bg-gradient-to-b from-amber-50/70 via-stone-50 to-amber-50/40 border-amber-500/25 text-stone-900"
        : "bg-gradient-to-b from-[#14120f] via-[#0e0c0a] to-[#070605] border-amber-500/20 text-stone-100"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className={cn("text-base font-black tracking-tight flex items-center gap-1.5", theme === 'light' ? "text-amber-950" : "text-amber-200")}>
              <span>{isHi ? 'वास्तु लाइव ऑडिट स्कोरकार्ड' : 'Vastu Live Audit Scorecard'}</span>
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            </h3>
            <p className={cn("text-[10px] font-semibold", theme === 'light' ? "text-stone-500" : "text-stone-400")}>
              {isHi ? 'गृह व कार्यालय कक्ष संरेखण और वैदिक दोष निवारण' : 'Vedic home alignment & instant remedial guide'}
            </p>
          </div>
        </div>

        <button
          onClick={handleResetDefaults}
          title={isHi ? "रीसेट करें" : "Reset defaults"}
          className={cn(
            "p-2 rounded-lg border text-xs transition-transform active:scale-90",
            theme === 'light' ? "border-stone-300 text-stone-600 hover:bg-stone-200/60" : "border-white/10 text-stone-400 hover:bg-white/5"
          )}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Score Hero Card */}
      <div className={cn("p-4 rounded-2xl border mb-5 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm", ratingDetails.bg)}>
        {/* Left Score Meter */}
        <div className="flex items-center gap-4">
          <div className="relative w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className={theme === 'light' ? "stroke-stone-200" : "stroke-white/10"}
                strokeWidth="3.5"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="stroke-current transition-all duration-1000 ease-out"
                strokeWidth="3.8"
                strokeDasharray={`${totalScore}, 100`}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                style={{ stroke: totalScore >= 70 ? '#10B981' : totalScore >= 50 ? '#F59E0B' : '#EF4444' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black font-mono leading-none tracking-tight">{totalScore}%</span>
              <span className="text-[7.5px] font-bold uppercase tracking-wider text-stone-400 mt-0.5">{isHi ? 'स्कोर' : 'SCORE'}</span>
            </div>
          </div>

          <div className="flex flex-col text-left">
            <span className={cn("text-xs font-black tracking-wide", ratingDetails.color)}>
              {isHi ? ratingDetails.titleHi : ratingDetails.titleEn}
            </span>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ✓ {auspiciousCount} {isHi ? 'शुभ' : 'Auspicious'}
              </span>
              <span className={cn(
                "px-2 py-0.5 rounded-full border",
                doshaCount > 0 ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-stone-500/10 text-stone-400 border-stone-500/20"
              )}>
                ⚠ {doshaCount} {isHi ? 'दोष' : 'Dosha'}
              </span>
            </div>
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShareReport}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
        >
          {copiedShare ? (
            <>
              <Check className="w-4 h-4 text-stone-950" />
              <span>{isHi ? 'कॉपी हुआ!' : 'Copied!'}</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-stone-950" />
              <span>{isHi ? 'रिपोर्ट साझा करें' : 'Share Report'}</span>
            </>
          )}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={cn("text-xs font-extrabold uppercase tracking-wider", theme === 'light' ? "text-stone-700" : "text-stone-300")}>
          {isHi ? 'कक्ष व दिशा निर्धारण:' : 'Room & Direction Audit:'}
        </span>
        <button
          onClick={() => setShowDoshaOnly(!showDoshaOnly)}
          className={cn(
            "text-[10px] font-black px-2.5 py-1 rounded-full border transition-all active:scale-95",
            showDoshaOnly
              ? "bg-red-500 text-white border-red-600 shadow-sm"
              : (theme === 'light' ? "bg-stone-200/80 text-stone-600 border-stone-300" : "bg-white/10 text-stone-300 border-white/10")
          )}
        >
          {showDoshaOnly ? (isHi ? 'दोष केवल (सक्रिय)' : 'Doshas Only') : (isHi ? 'सभी कक्ष' : 'All Rooms')}
        </button>
      </div>

      {/* Room Audit Cards */}
      <div className="space-y-2.5">
        {filteredEvaluations.map((room) => {
          const isExpanded = expandedRoomId === room.id;
          const isAuspicious = room.status === 'auspicious';
          const isDosha = room.status === 'dosha';

          return (
            <div
              key={room.id}
              className={cn(
                "rounded-xl border transition-all duration-200 overflow-hidden",
                isAuspicious 
                  ? (theme === 'light' ? "bg-emerald-50/60 border-emerald-500/30" : "bg-emerald-950/20 border-emerald-500/25")
                  : isDosha
                  ? (theme === 'light' ? "bg-red-50/70 border-red-500/35" : "bg-red-950/20 border-red-500/30")
                  : (theme === 'light' ? "bg-white/70 border-stone-200" : "bg-[#181512]/60 border-white/10")
              )}
            >
              {/* Main Room Row */}
              <div 
                onClick={() => setExpandedRoomId(isExpanded ? null : room.id)}
                className="p-3 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl shrink-0">{room.icon}</span>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-black leading-tight">
                      {isHi ? room.nameHi : room.nameEn}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold mt-0.5 flex items-center gap-1",
                      isAuspicious ? "text-emerald-500" : isDosha ? "text-red-400" : "text-amber-500"
                    )}>
                      {isAuspicious ? '✓ ' + (isHi ? 'शुभ स्थिति' : 'Auspicious') : isDosha ? '⚠ ' + (isHi ? 'वास्तु दोष' : 'Vastu Dosha') : '• ' + (isHi ? 'सामान्य' : 'Neutral')}
                      {' '}({isHi ? DIRECTION_LABELS[room.selectedDir]?.hi : DIRECTION_LABELS[room.selectedDir]?.en})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Current Direction Badge */}
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg font-black text-xs font-mono border tracking-tight",
                    isAuspicious 
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : isDosha
                      ? "bg-red-500/20 text-red-400 border-red-500/40"
                      : (theme === 'light' ? "bg-stone-200 text-stone-800 border-stone-300" : "bg-white/10 text-white border-white/20")
                  )}>
                    {room.selectedDir}
                  </span>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-stone-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-400" />
                  )}
                </div>
              </div>

              {/* Expanded Direction Selector & Remedy Accordion */}
              {isExpanded && (
                <div className={cn(
                  "p-3 pt-0 border-t flex flex-col gap-3",
                  theme === 'light' ? "border-stone-200 bg-stone-50/50" : "border-white/10 bg-black/20"
                )}>
                  {/* Direction Picker Buttons */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        {isHi ? 'दिशा चुनें:' : 'Select Direction:'}
                      </span>
                      {currentHeading !== null && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTagWithCurrentHeading(room.id);
                          }}
                          className="flex items-center gap-1 text-[9px] font-black text-amber-500 hover:text-amber-400"
                        >
                          <Compass className="w-3 h-3" />
                          <span>{isHi ? 'वर्तमान दिशा टैग करें' : 'Tag Live Compass Direction'}</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                      {ALL_DIRECTIONS.map(dir => {
                        const isSelected = room.selectedDir === dir;
                        const isDirAuspicious = room.auspiciousDirections.includes(dir);
                        const isDirDosha = room.doshaDirections.includes(dir);

                        return (
                          <button
                            key={dir}
                            onClick={() => handleSelectDirection(room.id, dir)}
                            className={cn(
                              "py-1.5 px-1 rounded-lg text-xs font-black font-mono border transition-all active:scale-95 flex flex-col items-center",
                              isSelected
                                ? (isDirAuspicious
                                    ? "bg-emerald-500 text-stone-950 border-emerald-400 shadow-md font-black"
                                    : isDirDosha
                                    ? "bg-red-500 text-white border-red-400 shadow-md font-black"
                                    : "bg-amber-500 text-stone-950 border-amber-400 shadow-md font-black")
                                : (theme === 'light'
                                    ? "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
                                    : "bg-white/5 text-stone-300 border-white/10 hover:bg-white/10")
                            )}
                          >
                            <span>{dir}</span>
                            <span className="text-[7.5px] font-bold opacity-80 mt-0.5">
                              {isHi ? DIRECTION_LABELS[dir]?.hi : DIRECTION_LABELS[dir]?.en}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Remedial Guidance Box */}
                  <div className={cn(
                    "p-2.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2",
                    isDosha
                      ? "bg-red-500/10 border-red-500/30 text-red-200"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-200"
                  )}>
                    <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-400 block mb-0.5">
                        {isDosha ? (isHi ? 'दोष निवारण उपाय:' : 'Vedic Remedy:') : (isHi ? 'वास्तु मार्गदर्शन:' : 'Vedic Guidance:')}
                      </span>
                      <span className={theme === 'light' ? "text-stone-700" : "text-stone-300"}>
                        {isHi ? room.remedyHi : room.remedyEn}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
