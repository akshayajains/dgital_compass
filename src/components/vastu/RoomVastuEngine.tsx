import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Navigation2, 
  ShieldCheck, 
  Save, 
  ChevronRight, 
  Flame, 
  Droplets, 
  Wind, 
  Mountain, 
  Compass,
  Layers,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Language, CompassStyleId } from '@/types/compass';
import { getAppThemePalette } from '@/lib/themePalettes';
import { VASTU_16_ZONES, ROOM_GUIDANCE_CATALOG, RoomGuidance, VastuZone } from '@/data/vastuKnowledgeBase';
import { get32Pada, VastuPada32 } from '@/lib/vastu32Devta';

interface RoomVastuEngineProps {
  currentHeading: number | null;
  language: Language;
  theme?: string;
  selectedStyle?: CompassStyleId;
  variantId?: string | null;
  onHaptic: () => void;
  onSaveRoomAudit?: (entry: {
    roomType: string;
    roomName: string;
    degrees: number;
    zoneCode: string;
    verdict: 'auspicious' | 'acceptable' | 'dosha';
    score: number;
    remedySummary: string;
  }) => void;
}

// Extended catalog including Entrance and Staircase
const FULL_ROOM_CATALOG: RoomGuidance[] = [
  ...ROOM_GUIDANCE_CATALOG,
  {
    id: 'main_entrance',
    nameEn: 'Main Entrance (Mukhya Dwar)',
    nameHi: 'मुख्य प्रवेश द्वार (सिंह द्वार)',
    icon: '🚪',
    idealZones: ['N', 'E', 'NE'],
    acceptableZones: ['NW', 'W', 'S'],
    negativeZones: ['SW', 'SSW', 'ESE', 'WNW'],
    bestFacingEn: 'Door opening clockwise inward towards North or East.',
    bestFacingHi: 'द्वार अंदर की ओर दक्षिणावर्त (Clockwise) पूर्व या उत्तर में खुलना चाहिए।',
    keyRulesEn: [
      'Supreme Main Door Padas per 32-Pada Vastu: N3 (Mukhya), N4 (Bhallat), E3 (Jayanta), E4 (Indra), S4 (Brihatkshata), W3 (Sugriva), W4 (Pushpadanta).',
      'The main door should always be the largest door in the entire house.',
      'Ensure the entrance threshold (Dehleez) is elevated to prevent positive energy from leaking out.',
      'Never place a shoe rack or dustbin directly facing the main entrance threshold.',
      'Do not place a mirror facing the entrance door (it bounces incoming prosperity back out).'
    ],
    keyRulesHi: [
      '32-पद वास्तु के सर्वश्रेष्ठ 8 शुभ द्वार: N3 (मुख्य), N4 (भल्लाट), E3 (जयंत), E4 (इंद्र), S4 (बृहत्क्षत), W3 (सुग्रीव), W4 (पुष्पदंत)।',
      'मुख्य द्वार घर के अन्य सभी कमरों के दरवाजों से बड़ा और भव्य होना चाहिए।',
      'दहलीज (चौखट) अवश्य होनी चाहिए, इससे घर की लक्ष्मी और सकारात्मक ऊर्जा बाहर नहीं जाती।',
      'दरवाजे के ठीक सामने जूते-चप्पल या कूड़ेदान न रखें।',
      'मुख्य दरवाजे के सामने शीशा न लगाएं, यह आती हुई समृद्धि को वापस लौटा देता है।'
    ],
    colorsEn: 'Teak wood natural, soft cream, ivory white, light yellow. Avoid dark black and charcoal.',
    colorsHi: 'प्राकृतिक लकड़ी (सागवान), क्रीम, सफेद या हल्का पीला। काले रंग से बचें।',
    remediesEn: [
      'If entrance is in South-West: Install a 3-inch Brass strip embedded in the threshold along with 3 Brass Pyramids.',
      'If entrance is in South-East: Install a 3-inch Copper strip in the floor and place a Siddha Swastika outside.',
      'Hang a Panchmukhi Hanuman ji picture or auspicious Toran (mango/ashoka leaves) above the lintel.'
    ],
    remediesHi: [
      'यदि मुख्य द्वार नैऋत्य (SW) में हो: चौखट पर 3-इंच की पीतल की पट्टी और 3 पीतल के पिरामिड स्थापित करें।',
      'यदि मुख्य द्वार आग्नेय (SE) में हो: दहलीज पर तांबे की पट्टी लगाएं और बाहर तांबे का स्वस्तिक लगाएं।',
      'द्वार के ऊपर पंचमुखी हनुमान जी का चित्र या आम के पत्तों का तोरण लगाएं।'
    ]
  },
  {
    id: 'staircase',
    nameEn: 'Staircase (Internal / External)',
    nameHi: 'सीढ़ियां (आंतरिक / बाहरी)',
    icon: '🪜',
    idealZones: ['S', 'SW', 'W'],
    acceptableZones: ['SE', 'NW'],
    negativeZones: ['NE', 'N', 'E'],
    bestFacingEn: 'Ascend from East to West, or North to South (Clockwise ascent).',
    bestFacingHi: 'सीढ़ियां पूर्व से पश्चिम या उत्तर से दक्षिण की ओर चढ़नी चाहिए (Clockwise घुमाव)।',
    keyRulesEn: [
      'Stairs represent heavy load/weight and belong naturally in South, South-West or West to anchor family stability.',
      'FATAL FLAW: Staircase in North-East (Ishanya) crushes the cosmic skull of Vastu Purusha, causing ruin and health paralysis.',
      'Never build a toilet, kitchen, or pooja altar underneath a staircase.',
      'Total number of steps should always be an odd number (15, 17, 19, 21), ending on the right foot.',
      'Staircase should always turn clockwise (Pradakshina order) while climbing up.'
    ],
    keyRulesHi: [
      'सीढ़ियां भारी भार का प्रतीक हैं, इसलिए इन्हें केवल दक्षिण, नैऋत्य (SW) या पश्चिम में होना चाहिए।',
      'महादोष: ईशान कोण (NE) में सीढ़ियां वास्तु पुरुष के मस्तिष्क पर भार डालती हैं, जिससे प्रगति रुक जाती है।',
      'सीढ़ियों के नीचे कभी भी शौचालय, रसोई या पूजा घर न बनाएं।',
      'सीढ़ियों की संख्या हमेशा विषम (15, 17, 19, 21) होनी चाहिए।',
      'सीढ़ियां हमेशा दक्षिणावर्त (Clockwise) दिशा में ऊपर की ओर घूमनी चाहिए।'
    ],
    colorsEn: 'Off-white, beige, light stone grey, warm cream. Avoid dark red or pitch black.',
    colorsHi: 'हल्का क्रीम, बेज या स्लेटी रंग।',
    remediesEn: [
      'If staircase is in North-East: Place two live green money plants under the landing and affix a Brass Pyramid strip.',
      'If stairs turn counter-clockwise: Place a concave copper mirror or energy balancing crystal at the turn.',
      'Ensure the staircase area is brightly illuminated with warm white LED light.'
    ],
    remediesHi: [
      'यदि सीढ़ियां ईशान (NE) में हों: नीचे दो हरे मनी प्लांट रखें और पीतल के 9 पिरामिड लगाएं।',
      'यदि सीढ़ियां एंटी-क्लॉकवाइज हों: घुमाव पर ऊर्जा संतुलन हेतु क्रिस्टल बॉल या तांबे का स्वस्तिक लगाएं।',
      'सीढ़ियों के नीचे कबाड़ इकट्ठा न होने दें और पर्याप्त रोशनी रखें।'
    ]
  }
];

export const RoomVastuEngine: React.FC<RoomVastuEngineProps> = ({
  currentHeading,
  language,
  theme,
  selectedStyle,
  variantId,
  onHaptic,
  onSaveRoomAudit
}) => {
  const isHi = language === 'hi';
  const palette = useMemo(() => getAppThemePalette(selectedStyle, variantId), [selectedStyle, variantId]);
  const normHeading = currentHeading !== null ? ((currentHeading % 360) + 360) % 360 : 0;
  const displayDeg = currentHeading !== null ? Math.round(normHeading) % 360 : 0;

  // Selected room type
  const [selectedRoomId, setSelectedRoomId] = useState<string>('main_entrance');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Active room data
  const activeRoom = useMemo(() => {
    return FULL_ROOM_CATALOG.find(r => r.id === selectedRoomId) || FULL_ROOM_CATALOG[0];
  }, [selectedRoomId]);

  // Current 16-Zone lookup from heading
  const currentZone: VastuZone = useMemo(() => {
    return VASTU_16_ZONES.find(z => {
      if (z.code === 'N') {
        return normHeading >= 348.75 || normHeading < 11.25;
      }
      return normHeading >= z.startDeg && normHeading < z.endDeg;
    }) || VASTU_16_ZONES[0];
  }, [normHeading]);

  // 32-Pada lookup
  const currentPada: VastuPada32 = useMemo(() => {
    return get32Pada(currentHeading);
  }, [currentHeading]);

  // Real-time Vastu Verdict
  const verdictData = useMemo(() => {
    const code = currentZone.code;
    const isIdeal = activeRoom.idealZones.includes(code);
    const isAcceptable = activeRoom.acceptableZones.includes(code);
    const isNegative = activeRoom.negativeZones.includes(code) || (!isIdeal && !isAcceptable);

    // Score & Classification
    let verdict: 'auspicious' | 'acceptable' | 'dosha' = 'dosha';
    let score = 30;
    let badgeTitleEn = 'VASTU DOSHA (ELEMENT CONFLICT)';
    let badgeTitleHi = 'वास्तु दोष (तत्व विरोध)';

    if (isIdeal) {
      verdict = 'auspicious';
      score = 98;
      badgeTitleEn = 'SUPREME AUSPICIOUS (PERFECT ZONE)';
      badgeTitleHi = 'सर्वोच्च शुभ (उत्तम फलदायी)';
    } else if (isAcceptable) {
      verdict = 'acceptable';
      score = 75;
      badgeTitleEn = 'NEUTRAL / ACCEPTABLE (MODERATE)';
      badgeTitleHi = 'सामान्य / स्वीकार्य (मध्यम फल)';
    }

    // Specific elemental clash diagnosis
    let clashReasonEn = '';
    let clashReasonHi = '';
    if (verdict === 'dosha') {
      if (activeRoom.id === 'kitchen' && (code === 'NE' || code === 'N' || code === 'NNE')) {
        clashReasonEn = 'Severe Agni-Jal Clash! Fire in the sacred Water Zone burns mental peace, invites family illnesses and severe financial drains.';
        clashReasonHi = 'महा अग्नि-जल विरोध! पवित्र जल क्षेत्र में रसोई रखने से मानसिक तनाव, अकारण धन हानि और स्वास्थ्य विकार होते हैं।';
      } else if (activeRoom.id === 'toilet' && (code === 'NE' || code === 'E' || code === 'N')) {
        clashReasonEn = 'Fatal Ishanya Flaw! Commode/drainage in the divine portal suppresses intellect, creates chronic neurological strain, and blocks opportunities.';
        clashReasonHi = 'महा ईशान दोष! देव स्थान में शौचालय होने से बुद्धि व एकाग्रता कुंठित होती है और गंभीर शारीरिक व आर्थिक समस्याएं आती हैं।';
      } else if (activeRoom.id === 'master_bedroom' && (code === 'SE' || code === 'ESE')) {
        clashReasonEn = 'Earth-Fire Friction! Sleeping in the Fire Zone causes insomnia, high blood pressure, hot tempers, and marital disputes.';
        clashReasonHi = 'पृथ्वी-अग्नि टकराव! आग्नेय कोण में शयन से अनिद्रा, उच्च रक्तचाप, क्रोध और दांपत्य कलह की संभावना बढ़ती है।';
      } else if (activeRoom.id === 'locker_cash' && (code === 'SE' || code === 'SSW' || code === 'WNW')) {
        clashReasonEn = 'Wealth In Fire/Disposal! Money vanishes rapidly in unexpected hospital emergencies and wasteful expenditure.';
        clashReasonHi = 'धन अग्नि/विसर्जन क्षेत्र में! संचित धन तेजी से अप्रत्याशित खर्चों व चिकित्सा में व्यर्थ होता है।';
      } else if (activeRoom.id === 'main_entrance' && (code === 'SW' || code === 'SSW')) {
        clashReasonEn = 'Nairutya Entrance Dosha! Main door in South-West brings relationship instability, debt traps, and heavy energy drain.';
        clashReasonHi = 'नैऋत्य द्वार दोष! दक्षिण-पश्चिम में मुख्य द्वार होने से संबंध विच्छेद, कर्ज और भारी नकारात्मक ऊर्जा का प्रवेश होता है।';
      } else {
        clashReasonEn = `${activeRoom.nameEn} placed in ${currentZone.nameEn} (${currentZone.element}) disrupts harmonious elemental flow. Zero-demolition remedies recommended below.`;
        clashReasonHi = `${activeRoom.nameHi} को ${currentZone.nameHi} (${currentZone.elementHi}) में रखने से वास्तु चक्र असंतुलित होता है। नीचे दिए गए आसान उपाय करें।`;
      }
    }

    // Find nearest ideal zone & rotation angle needed
    let nearestTargetZone = VASTU_16_ZONES[0];
    let minDeviation = 999;
    activeRoom.idealZones.forEach(zCode => {
      const match = VASTU_16_ZONES.find(z => z.code === zCode);
      if (match) {
        const diff = ((match.centerDeg - normHeading + 540) % 360) - 180;
        if (Math.abs(diff) < Math.abs(minDeviation)) {
          minDeviation = diff;
          nearestTargetZone = match;
        }
      }
    });

    return {
      verdict,
      score,
      badgeTitle: isHi ? badgeTitleHi : badgeTitleEn,
      clashReason: isHi ? clashReasonHi : clashReasonEn,
      isIdeal,
      isAcceptable,
      isNegative,
      minDeviation: Math.round(minDeviation),
      nearestTargetZone
    };
  }, [activeRoom, currentZone, normHeading, isHi]);

  // Handle Save Audit
  const handleSaveAudit = () => {
    onHaptic();
    const remedySummary = verdictData.verdict === 'dosha'
      ? (isHi ? activeRoom.remediesHi[0] : activeRoom.remediesEn[0])
      : (isHi ? 'दिशा अनुकूल है (कोई उपाय आवश्यक नहीं)' : 'Harmonious alignment (No remedy required)');

    onSaveRoomAudit?.({
      roomType: activeRoom.id,
      roomName: isHi ? activeRoom.nameHi : activeRoom.nameEn,
      degrees: displayDeg,
      zoneCode: currentZone.code,
      verdict: verdictData.verdict,
      score: verdictData.score,
      remedySummary
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2200);
  };

  // Element badge icon
  const renderElementIcon = (elem: string) => {
    switch (elem) {
      case 'Water': return <Droplets className="w-3.5 h-3.5 text-sky-400" />;
      case 'Air': return <Wind className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Fire': return <Flame className="w-3.5 h-3.5 text-rose-500" />;
      case 'Earth': return <Mountain className="w-3.5 h-3.5 text-amber-500" />;
      case 'Space': return <Compass className="w-3.5 h-3.5 text-slate-400" />;
      default: return null;
    }
  };

  return (
    <div className={cn(
      "w-full rounded-[26px] px-2.5 py-3.5 sm:px-3.5 sm:py-4 border flex flex-col gap-3.5 transition-all duration-300 shadow-xl",
      palette.telemetryCardBg,
      palette.telemetryCardBorder,
      palette.isLight ? "text-stone-900" : "text-stone-100"
    )}>

      {/* Top Header & Fast Live Metric */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-base shadow-inner border",
            verdictData.verdict === 'auspicious'
              ? (palette.isLight ? "bg-teal-100 text-teal-700 border-teal-400" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40")
              : verdictData.verdict === 'acceptable'
              ? (palette.isLight ? "bg-amber-100 text-amber-700 border-amber-400" : "bg-amber-500/20 text-amber-400 border-amber-500/40")
              : (palette.isLight ? "bg-red-100 text-red-700 border-red-400" : "bg-rose-500/20 text-rose-400 border-rose-500/40")
          )}>
            {activeRoom.icon}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em]",
                palette.isLight ? "text-stone-700 font-extrabold" : "text-stone-300"
              )}>
                {isHi ? 'कमरा वास्तु परीक्षक' : 'ROOM VASTU ENGINE'}
              </span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[9px] font-black font-mono uppercase tracking-wider border",
                verdictData.verdict === 'auspicious'
                  ? (palette.isLight ? "bg-teal-100 text-teal-800 border-teal-400" : "bg-emerald-500/20 text-emerald-300 border-emerald-400/50")
                  : verdictData.verdict === 'acceptable'
                  ? (palette.isLight ? "bg-amber-100 text-amber-800 border-amber-400" : "bg-amber-500/20 text-amber-300 border-amber-400/50")
                  : (palette.isLight ? "bg-red-100 text-red-800 border-red-400" : "bg-rose-500/20 text-rose-300 border-rose-400/50")
              )}>
                {verdictData.score}% {isHi ? 'अनुकूल' : 'ALIGN'}
              </span>
            </div>
            <h3 className={cn("text-sm font-black tracking-tight leading-none mt-1", palette.headingText)}>
              {isHi ? activeRoom.nameHi : activeRoom.nameEn}
            </h3>
          </div>
        </div>

        {/* Live Heading Pill */}
        <div className={cn(
          "px-2.5 py-1 rounded-xl border flex flex-col items-end text-right",
          palette.isLight ? "bg-white/80 border-stone-300 text-stone-900" : "bg-black/40 border-white/10 text-white"
        )}>
          <div className="flex items-center gap-1 text-[9px] font-mono font-bold opacity-75">
            <span>{currentPada.code}</span>
            <span>•</span>
            <span>{displayDeg}°</span>
          </div>
          <div className="text-xs font-black flex items-center gap-1 text-amber-400">
            <span>{currentZone.code}</span>
            <span className="text-[10px] font-medium opacity-85">({isHi ? currentZone.nameHi.split(' ')[0] : currentZone.nameEn.split(' ')[0]})</span>
          </div>
        </div>
      </div>

      {/* 1. Fast Horizontal Room Selector Carousel */}
      <div className="w-full flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {FULL_ROOM_CATALOG.map((room) => {
          const isSelected = room.id === selectedRoomId;
          return (
            <button
              key={room.id}
              onClick={() => {
                setSelectedRoomId(room.id);
                onHaptic();
              }}
              className={cn(
                "px-2.5 py-1.5 rounded-full text-[10px] font-black tracking-wide whitespace-nowrap transition-all duration-200 shrink-0 border flex items-center gap-1 active:scale-95 shadow-sm",
                isSelected
                  ? `${palette.pillBg} ${palette.pillBorder} ${palette.headingText} font-extrabold scale-[1.03] shadow-md`
                  : (palette.isLight
                      ? "bg-white/80 text-stone-700 border-stone-300 hover:border-stone-400"
                      : "bg-black/35 text-stone-300 border-white/10 hover:border-white/20")
              )}
            >
              <span>{room.icon}</span>
              <span>{isHi ? room.nameHi.split(' ')[0] : room.nameEn.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* 2 & 3. Unified Real-Time Verdict & Practical Vedic Remedies Card */}
      <div className={cn(
        "w-full rounded-2xl p-3 sm:p-3.5 border flex flex-col gap-2.5 transition-all duration-300 shadow-md",
        palette.telemetryCardBg,
        palette.telemetryCardBorder,
        palette.isLight ? "text-stone-900" : "text-stone-100"
      )}>
        {/* Top Verdict & Element Header */}
        <div className="w-full flex items-center justify-between">
          <div className={cn(
            "flex items-center gap-1.5 font-black text-xs uppercase tracking-wide",
            verdictData.verdict === 'auspicious'
              ? (palette.isLight ? "text-emerald-700" : "text-emerald-400")
              : verdictData.verdict === 'acceptable'
              ? (palette.isLight ? "text-amber-700" : "text-amber-400")
              : (palette.isLight ? "text-rose-700" : "text-rose-400")
          )}>
            {verdictData.verdict === 'auspicious' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : verdictData.verdict === 'acceptable' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0 text-rose-500" />
            )}
            <span>{verdictData.badgeTitle}</span>
          </div>

          {/* Element Pill */}
          <div className={cn(
            "px-2 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 shrink-0",
            palette.pillBg,
            palette.pillBorder,
            palette.pillUnitText
          )}>
            {renderElementIcon(currentZone.element)}
            <span>{isHi ? currentZone.elementHi : `${currentZone.element} Element`}</span>
          </div>
        </div>

        {/* Dynamic Verdict Narrative & Alignment Banner */}
        <div className={cn(
          "w-full p-2.5 rounded-xl border text-[11.5px] leading-relaxed transition-colors",
          verdictData.verdict === 'auspicious'
            ? (palette.isLight ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950" : "bg-emerald-950/30 border-emerald-500/40 text-emerald-100")
            : verdictData.verdict === 'acceptable'
            ? (palette.isLight ? "bg-amber-500/10 border-amber-500/30 text-amber-950" : "bg-amber-950/30 border-amber-500/40 text-amber-100")
            : (palette.isLight ? "bg-rose-500/10 border-rose-500/30 text-rose-950" : "bg-rose-950/30 border-rose-500/40 text-rose-100")
        )}>
          {verdictData.verdict === 'auspicious' && (
            <p className="opacity-95">
              {isHi
                ? `वर्तमान दिशा ${currentZone.nameHi} (${currentZone.code}) ${activeRoom.nameHi} के लिए पूर्णतया अनुकूल है। ${activeRoom.bestFacingHi}`
                : `Pointing towards ${currentZone.nameEn} (${currentZone.code}) provides supreme positive resonance for ${activeRoom.nameEn}. ${activeRoom.bestFacingEn}`}
            </p>
          )}

          {verdictData.verdict === 'acceptable' && (
            <p className="opacity-95">
              {isHi
                ? `${currentZone.nameHi} (${currentZone.code}) सामान्य व स्वीकार्य क्षेत्र है। ${activeRoom.bestFacingHi}`
                : `${currentZone.nameEn} (${currentZone.code}) is a moderately supportive zone for this room. ${activeRoom.bestFacingEn}`}
            </p>
          )}

          {verdictData.verdict === 'dosha' && (
            <div className="flex flex-col gap-1.5">
              <p className="font-medium">
                {verdictData.clashReason}
              </p>

              {/* Dynamic Turn Navigator Gauge towards Nearest Ideal Zone */}
              <div className={cn(
                "w-full flex items-center justify-between p-2 rounded-lg border mt-0.5",
                palette.isLight ? "bg-white/80 border-rose-300/80" : "bg-black/50 border-rose-500/30"
              )}>
                <div className="flex items-center gap-1.5 text-xs font-black">
                  <Navigation2 className={cn(
                    "w-4 h-4 text-amber-500",
                    verdictData.minDeviation > 0 ? "-rotate-45" : "rotate-45"
                  )} />
                  <span className="text-amber-600 dark:text-amber-400">
                    {verdictData.minDeviation > 0
                      ? (isHi ? `बाएं ${Math.abs(verdictData.minDeviation)}° घूमें ↶` : `Turn ${Math.abs(verdictData.minDeviation)}° Left ↶`)
                      : (isHi ? `दाएं ${Math.abs(verdictData.minDeviation)}° घूमें ↷` : `Turn ${Math.abs(verdictData.minDeviation)}° Right ↷`)}
                  </span>
                </div>
                <span className="text-[10px] font-bold opacity-80">
                  {isHi ? `सर्वोत्तम: ${verdictData.nearestTargetZone.code} (${Math.round(verdictData.nearestTargetZone.centerDeg)}°)` : `Ideal: ${verdictData.nearestTargetZone.code} (${Math.round(verdictData.nearestTargetZone.centerDeg)}°)`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Remedies Header Row */}
        <div className="flex items-center justify-between pt-0.5">
          <div className={cn("flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider", palette.headingText)}>
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>{isHi ? 'बिना तोड़फोड़ के अचूक उपाय' : 'ZERO-DEMOLITION PRACTICAL REMEDIES'}</span>
          </div>
          <span className={cn(
            "text-[9px] font-mono px-2 py-0.5 rounded-full border shrink-0",
            palette.pillBg,
            palette.pillBorder,
            palette.pillUnitText
          )}>
            {isHi ? 'वैदिक समाधान' : 'VEDIC CURES'}
          </span>
        </div>

        {/* 3 Practical Remedies Bullets */}
        <div className="flex flex-col gap-1.5">
          {(isHi ? activeRoom.remediesHi : activeRoom.remediesEn).slice(0, 3).map((remedy, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px] leading-snug">
              <span className={cn("font-bold shrink-0 mt-0.5", palette.pillUnitText)}>•</span>
              <span className={palette.isLight ? "text-stone-800" : "text-stone-200"}>{remedy}</span>
            </div>
          ))}
        </div>

        {/* Best Facing & Color Tip Row */}
        <div className={cn(
          "w-full pt-2 border-t flex flex-col gap-1 text-[10.5px]",
          palette.isLight ? "border-stone-900/10" : "border-white/10"
        )}>
          <div>
            <span className={cn("font-black", palette.headingText)}>{isHi ? 'सर्वोत्तम मुख (Facing):' : 'Ideal Facing:'} </span>
            <span className={palette.isLight ? "text-stone-700" : "text-stone-300"}>{isHi ? activeRoom.bestFacingHi : activeRoom.bestFacingEn}</span>
          </div>
          <div>
            <span className={cn("font-black", palette.pillUnitText)}>{isHi ? 'शुभ रंग (Colors):' : 'Auspicious Colors:'} </span>
            <span className={palette.isLight ? "text-stone-700" : "text-stone-300"}>{isHi ? activeRoom.colorsHi : activeRoom.colorsEn}</span>
          </div>
        </div>
      </div>

      {/* 4. Action Row: Save Audit Record & Ideal Zones Reference */}
      <div className="w-full flex items-center justify-between gap-2 pt-0.5">
        <div className={cn("flex items-center gap-1 text-[10px] font-bold", palette.isLight ? "text-stone-800" : "text-stone-200")}>
          <span>{isHi ? 'आदर्श दिशाएं:' : 'Ideal Zones:'}</span>
          <span className={cn("font-mono font-black", palette.pillUnitText)}>{activeRoom.idealZones.join(', ')}</span>
        </div>

        <button
          onClick={handleSaveAudit}
          className={cn(
            "px-3.5 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shadow-md",
            savedSuccess
              ? "bg-emerald-500 text-stone-950 border-emerald-300"
              : `${palette.pillBg} ${palette.pillBorder} ${palette.headingText} hover:brightness-110`
          )}
        >
          <Save className="w-3.5 h-3.5" />
          <span>{savedSuccess ? (isHi ? 'सहेजा गया!' : 'SAVED!') : (isHi ? 'ऑडिट में जोड़ें' : 'SAVE TO AUDIT')}</span>
        </button>
      </div>

    </div>
  );
};
