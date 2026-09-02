import React, { useState } from 'react';
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
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Bed, 
  GraduationCap, 
  Utensils, 
  Bath, 
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  VASTU_16_ZONES, 
  ROOM_GUIDANCE_CATALOG, 
  VASTU_DAILY_RULES, 
  VastuZone, 
  RoomGuidance 
} from '@/data/vastuKnowledgeBase';
import { VASTU_32_PADAS, get32Pada } from '@/lib/vastu32Devta';

interface Props {
  currentHeading: number | null;
  triggerHaptic: () => void;
}

type VastuTab = 'rooms' | 'checker' | 'zones' | 'daily' | 'entrances';

export const VastuOthersView: React.FC<Props> = ({ currentHeading, triggerHaptic }) => {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [activeTab, setActiveTab] = useState<VastuTab>('rooms');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('master_bedroom');
  const [selectedZoneCode, setSelectedZoneCode] = useState<string>('SW');
  const [checkerRoomId, setCheckerRoomId] = useState<string>('master_bedroom');
  const [checkerZoneCode, setCheckerZoneCode] = useState<string>('SW');

  // Normalize heading
  const displayDeg = currentHeading !== null ? Math.round(((currentHeading % 360) + 360) % 360) : 0;

  // Find live zone from heading
  const liveZone = VASTU_16_ZONES.find(z => {
    if (z.code === 'N') {
      return displayDeg >= 348.75 || displayDeg < 11.25;
    }
    return displayDeg >= z.startDeg && displayDeg < z.endDeg;
  }) || VASTU_16_ZONES[0];

  const livePada = get32Pada(currentHeading);

  // Selected room details
  const currentRoom = ROOM_GUIDANCE_CATALOG.find(r => r.id === selectedRoomId) || ROOM_GUIDANCE_CATALOG[0];
  const checkerRoom = ROOM_GUIDANCE_CATALOG.find(r => r.id === checkerRoomId) || ROOM_GUIDANCE_CATALOG[0];

  // Audit evaluation
  const getAuditResult = (room: RoomGuidance, zoneCode: string) => {
    if (room.idealZones.includes(zoneCode)) {
      return {
        status: 'excellent',
        badge: isHi ? 'अति उत्तम (शुभ)' : 'EXCELLENT / AUSPICIOUS',
        color: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50',
        icon: CheckCircle2,
        desc: isHi 
          ? `यह स्थान ${room.nameHi} के लिए सर्वोत्तम ऊर्जा प्रदान करता है।`
          : `This zone provides optimal cosmic alignment for ${room.nameEn}.`
      };
    }
    if (room.acceptableZones.includes(zoneCode)) {
      return {
        status: 'neutral',
        badge: isHi ? 'स्वीकार्य (मध्यम)' : 'ACCEPTABLE / NEUTRAL',
        color: 'text-amber-400 bg-amber-950/70 border-amber-500/50',
        icon: AlertTriangle,
        desc: isHi 
          ? `यह स्थान स्वीकार्य है, किंतु साधारण वास्तु सावधानियां बरतें।`
          : `This zone is acceptable with basic energy balancing.`
      };
    }
    return {
      status: 'negative',
      badge: isHi ? 'वास्तु दोष (अशुभ)' : 'VASTU DOSHA / INAUSPICIOUS',
      color: 'text-rose-400 bg-rose-950/70 border-rose-500/50',
      icon: XCircle,
      desc: isHi 
          ? `चेतावनी: यहाँ ${room.nameHi} होना वास्तु दोष उत्पन्न करता है। नीचे दिए गए उपाय अवश्य करें।`
          : `Warning: Having ${room.nameEn} here creates elemental conflict. Follow remedies below.`
    };
  };

  const auditVerdict = getAuditResult(checkerRoom, checkerZoneCode);

  return (
    <div className="w-full max-w-sm flex flex-col items-center animate-in fade-in zoom-in-95 my-1 text-white select-none pb-12">
      
      {/* 1. Live Compass Real-Time Heading Banner */}
      <div className="w-full rounded-2xl p-3 border border-amber-500/40 bg-gradient-to-r from-[#1C140E] via-[#2D1B11] to-[#140B05] shadow-xl mb-2.5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-black uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 animate-spin-slow" />
            <span>{isHi ? 'लाइव कंपास संरेखण' : 'Live Compass Alignment'}</span>
          </div>
          <span className="font-mono text-xs font-black text-amber-300">
            {displayDeg}° {liveZone.code}
          </span>
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <span className="text-base font-black text-white">
            {isHi ? liveZone.nameHi : liveZone.nameEn}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {isHi ? liveZone.elementHi : liveZone.element}
          </span>
        </div>

        <p className="text-[11px] text-stone-300 mt-1 leading-snug">
          {isHi ? liveZone.energyDescHi : liveZone.energyDescEn}
        </p>

        {/* Live Active Pada */}
        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
          <span className="text-stone-400">
            {isHi ? '32 देव पद:' : '32 Devta Pada:'} <strong className="text-amber-300">{livePada.code} • {isHi ? livePada.nameHi : livePada.nameEn}</strong>
          </span>
          <span className={cn(
            "px-2 py-0.5 rounded-full font-bold text-[8.5px] uppercase border",
            livePada.isAuspicious ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50" : "bg-rose-950/60 text-rose-300 border-rose-500/40"
          )}>
            {livePada.isAuspicious ? (isHi ? 'शुभ पद' : 'Auspicious') : (isHi ? 'अशुभ पद' : 'Inauspicious')}
          </span>
        </div>
      </div>

      {/* 2. Top Navigation Tabs */}
      <div className="w-full flex items-center p-1 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 mb-3 gap-1 overflow-x-auto no-scrollbar shadow-inner">
        {[
          { id: 'rooms', labelEn: 'Room Guide', labelHi: 'कक्ष वास्तु', icon: '🛏️' },
          { id: 'checker', labelEn: 'Auditor', labelHi: 'वास्तु परीक्षक', icon: '🔍' },
          { id: 'daily', labelEn: 'Daily Rules', labelHi: 'दिनचर्या', icon: '📜' },
          { id: 'zones', labelEn: '16 Zones', labelHi: '16 दिशाएं', icon: '🧭' },
          { id: 'entrances', labelEn: 'Entrances', labelHi: '32 द्वार', icon: '🏛️' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as VastuTab);
              triggerHaptic();
            }}
            className={cn(
              "flex-1 py-1.5 px-2.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center justify-center gap-1",
              activeTab === tab.id
                ? "bg-amber-500 text-stone-950 shadow-md scale-[1.02]"
                : "text-stone-400 hover:text-white"
            )}
          >
            <span>{tab.icon}</span>
            <span>{isHi ? tab.labelHi : tab.labelEn}</span>
          </button>
        ))}
      </div>

      {/* 3. TAB 1: ROOM GUIDE (SINGLE SOURCE OF TRUTH) */}
      {activeTab === 'rooms' && (
        <div className="w-full flex flex-col gap-3">
          {/* Room Horizontal Selector Strip */}
          <div className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {ROOM_GUIDANCE_CATALOG.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setSelectedRoomId(r.id);
                  triggerHaptic();
                }}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider whitespace-nowrap border flex items-center gap-1.5 transition-all shrink-0",
                  selectedRoomId === r.id
                    ? "bg-amber-500 text-stone-950 border-amber-400 shadow-md scale-105"
                    : "bg-stone-900/90 text-stone-300 border-white/10 hover:border-white/25"
                )}
              >
                <span>{r.icon}</span>
                <span>{isHi ? r.nameHi.split(' ')[0] : r.nameEn}</span>
              </button>
            ))}
          </div>

          {/* Deep-Dive Room Guidance Card */}
          <div className="w-full rounded-3xl p-4 border border-amber-500/30 bg-gradient-to-b from-[#1E1610] via-[#140E0A] to-[#0D0805] shadow-2xl flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentRoom.icon}</span>
                <div>
                  <h3 className="text-sm font-black text-amber-400 leading-tight">
                    {isHi ? currentRoom.nameHi : currentRoom.nameEn}
                  </h3>
                  <p className="text-[10px] text-stone-400 font-bold">
                    {isHi ? 'एकल सत्य स्रोत (Single Source of Truth)' : 'Definitive Vedic Standard'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Direction Badges */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col">
                <span className="text-emerald-400 font-black uppercase text-[9.5px]">
                  {isHi ? '✓ उत्तम दिशाएं (Ideal)' : '✓ Ideal Zones'}
                </span>
                <span className="text-white font-mono font-bold mt-0.5">
                  {currentRoom.idealZones.join(', ')}
                </span>
              </div>

              <div className="p-2 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex flex-col">
                <span className="text-rose-400 font-black uppercase text-[9.5px]">
                  {isHi ? '✕ वर्जित दिशाएं (Avoid)' : '✕ Prohibited Zones'}
                </span>
                <span className="text-white font-mono font-bold mt-0.5">
                  {currentRoom.negativeZones.join(', ')}
                </span>
              </div>
            </div>

            {/* Best Facing Rule */}
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <span className="text-amber-400 font-black text-[10px] uppercase block mb-0.5">
                {isHi ? '🎯 श्रेष्ठ मुख / सिर की दिशा:' : '🎯 Optimal Facing / Alignment:'}
              </span>
              <p className="text-xs text-stone-200 font-bold leading-snug">
                {isHi ? currentRoom.bestFacingHi : currentRoom.bestFacingEn}
              </p>
            </div>

            {/* Core Vastu Rules */}
            <div className="flex flex-col gap-1.5">
              <span className="text-stone-400 font-black text-[10px] uppercase tracking-wider">
                {isHi ? 'मुख्य नियम व सावधानियां:' : 'Golden Vastu Principles:'}
              </span>
              {(isHi ? currentRoom.keyRulesHi : currentRoom.keyRulesEn).map((rule, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-stone-300 leading-snug">
                  <span className="text-amber-400 mt-0.5">▪</span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>

            {/* Recommended Colors */}
            <div className="p-2 rounded-2xl bg-black/40 border border-white/10 text-xs">
              <span className="text-stone-400 font-bold text-[10px] uppercase block mb-0.5">
                {isHi ? '🎨 अनुशंसित रंग:' : '🎨 Recommended Colors:'}
              </span>
              <p className="text-stone-200 text-[11px]">
                {isHi ? currentRoom.colorsHi : currentRoom.colorsEn}
              </p>
            </div>

            {/* Actionable Remedies */}
            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-red-950/30 to-amber-950/30 border border-amber-500/30 flex flex-col gap-1">
              <span className="text-amber-400 font-black text-[10.5px] uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {isHi ? 'वास्तु दोष निवारण (बिना तोड़फोड़ उपाय):' : 'Remedies Without Demolition:'}
              </span>
              {(isHi ? currentRoom.remediesHi : currentRoom.remediesEn).map((rem, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-[11px] text-stone-300 leading-snug">
                  <span className="text-amber-400">✦</span>
                  <span>{rem}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: VASTU AUDITOR & ROOM CHECKER */}
      {activeTab === 'checker' && (
        <div className="w-full flex flex-col gap-3">
          <div className="w-full rounded-3xl p-4 border border-amber-500/40 bg-gradient-to-b from-[#1C140E] to-[#0A0503] shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider">
                  {isHi ? 'त्वरित वास्तु परीक्षक' : 'Instant Room Vastu Auditor'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setCheckerZoneCode(liveZone.code);
                  triggerHaptic();
                }}
                className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[9px] font-black uppercase"
              >
                {isHi ? 'लाइव दिशा लें' : 'Use Live Heading'}
              </button>
            </div>

            {/* 1. Select Room */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                {isHi ? '१. कक्ष / स्थान चुनें:' : '1. Select Space / Activity:'}
              </label>
              <select
                value={checkerRoomId}
                onChange={(e) => setCheckerRoomId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-stone-900 border border-white/20 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
              >
                {ROOM_GUIDANCE_CATALOG.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.icon} {isHi ? r.nameHi : r.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Select Zone */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                {isHi ? '२. वर्तमान दिशा / कोण चुनें:' : '2. Select Current Zone:'}
              </label>
              <select
                value={checkerZoneCode}
                onChange={(e) => setCheckerZoneCode(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-stone-900 border border-white/20 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
              >
                {VASTU_16_ZONES.map((z) => (
                  <option key={z.code} value={z.code}>
                    {z.code} - {isHi ? z.nameHi : z.nameEn} ({z.element})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Result Verdict Card */}
            <div className={cn(
              "w-full rounded-2xl p-3 border flex flex-col gap-2 mt-1 transition-all",
              auditVerdict.color
            )}>
              <div className="flex items-center gap-2">
                <auditVerdict.icon className="w-5 h-5 shrink-0" />
                <span className="font-black text-xs uppercase tracking-wider">
                  {auditVerdict.badge}
                </span>
              </div>
              <p className="text-xs text-white/90 leading-snug">
                {auditVerdict.desc}
              </p>

              {auditVerdict.status === 'negative' && (
                <div className="mt-1 pt-2 border-t border-white/10 text-[11px] text-white/90">
                  <span className="font-bold text-amber-300 block mb-0.5">
                    {isHi ? 'अनुशंसित उपाय:' : 'Recommended Action:'}
                  </span>
                  <p>{isHi ? checkerRoom.remediesHi[0] : checkerRoom.remediesEn[0]}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: DAILY RULES (SLEEPING & EATING) */}
      {activeTab === 'daily' && (
        <div className="w-full flex flex-col gap-3">
          {/* Sleeping Rules */}
          <div className="w-full rounded-3xl p-4 border border-amber-500/30 bg-gradient-to-b from-[#1C140E] to-[#0A0503] shadow-xl flex flex-col gap-2.5">
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-white/10">
              <Bed className="w-4 h-4" />
              <span>{isHi ? VASTU_DAILY_RULES.sleeping.titleHi : VASTU_DAILY_RULES.sleeping.titleEn}</span>
            </h3>

            <div className="flex flex-col gap-2">
              {VASTU_DAILY_RULES.sleeping.items.map((item, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "p-2.5 rounded-2xl border flex flex-col gap-1 text-xs",
                    item.status === 'excellent' ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200" :
                    item.status === 'good' ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-200" :
                    item.status === 'negative' ? "bg-rose-950/50 border-rose-500/50 text-rose-200" :
                    "bg-stone-900/60 border-white/10 text-stone-300"
                  )}
                >
                  <div className="flex items-center justify-between font-black">
                    <span>{isHi ? item.directionHi : item.directionEn}</span>
                    <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-black/40">
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-snug">
                    {isHi ? item.descHi : item.descEn}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Dining Rules */}
          <div className="w-full rounded-3xl p-4 border border-amber-500/30 bg-gradient-to-b from-[#1C140E] to-[#0A0503] shadow-xl flex flex-col gap-2.5">
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-white/10">
              <Utensils className="w-4 h-4" />
              <span>{isHi ? VASTU_DAILY_RULES.eating.titleHi : VASTU_DAILY_RULES.eating.titleEn}</span>
            </h3>

            <div className="flex flex-col gap-2">
              {VASTU_DAILY_RULES.eating.items.map((item, idx) => (
                <div key={idx} className="p-2 rounded-2xl bg-black/40 border border-white/10 text-xs">
                  <span className="font-black text-amber-300 block mb-0.5">
                    {isHi ? item.directionHi : item.directionEn}
                  </span>
                  <p className="text-[11px] text-stone-300 leading-snug">
                    {isHi ? item.descHi : item.descEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 4: 16 MAHAVASTU ZONES */}
      {activeTab === 'zones' && (
        <div className="w-full flex flex-col gap-2.5">
          {/* Zone Grid */}
          <div className="w-full grid grid-cols-4 gap-1.5 mb-1">
            {VASTU_16_ZONES.map((z) => (
              <button
                key={z.code}
                onClick={() => {
                  setSelectedZoneCode(z.code);
                  triggerHaptic();
                }}
                className={cn(
                  "p-2 rounded-2xl border flex flex-col items-center justify-center transition-all",
                  selectedZoneCode === z.code
                    ? "bg-amber-500 text-stone-950 border-amber-400 font-black shadow-md scale-105 ring-2 ring-amber-400/40"
                    : "bg-stone-900/80 text-stone-300 border-white/10 hover:bg-stone-800"
                )}
              >
                <span className="text-xs font-black">{z.code}</span>
                <span className="text-[8px] opacity-75">{z.centerDeg}°</span>
              </button>
            ))}
          </div>

          {/* Selected Zone Deep Dive */}
          {(() => {
            const currentZ = VASTU_16_ZONES.find(z => z.code === selectedZoneCode) || VASTU_16_ZONES[0];
            return (
              <div className="w-full rounded-3xl p-4 border border-amber-500/30 bg-gradient-to-b from-[#1C140E] to-[#0A0503] shadow-xl flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div>
                    <h3 className="text-sm font-black text-amber-400">
                      {currentZ.code} - {isHi ? currentZ.nameHi : currentZ.nameEn}
                    </h3>
                    <span className="text-[10px] text-stone-400">
                      {currentZ.startDeg}° - {currentZ.endDeg}° ({isHi ? currentZ.elementHi : currentZ.element})
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-stone-800 text-amber-300 border border-amber-500/30">
                    {currentZ.deity}
                  </span>
                </div>

                <p className="text-stone-300 text-xs leading-snug">
                  {isHi ? currentZ.energyDescHi : currentZ.energyDescEn}
                </p>

                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-emerald-400 font-black text-[10px] uppercase">
                    {isHi ? '✓ अनुशंसित गतिविधियां:' : '✓ Recommended Activities:'}
                  </span>
                  {(isHi ? currentZ.idealFor.hi : currentZ.idealFor.en).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-stone-300">
                      <span className="text-emerald-400">▪</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-rose-400 font-black text-[10px] uppercase">
                    {isHi ? '✕ वर्जित गतिविधियां:' : '✕ Strictly Avoid:'}
                  </span>
                  {(isHi ? currentZ.avoidFor.hi : currentZ.avoidFor.en).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-stone-300">
                      <span className="text-rose-400">▪</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 7. TAB 5: 32 ENTRANCE CHAKRAS */}
      {activeTab === 'entrances' && (
        <div className="w-full flex flex-col gap-2.5">
          <div className="w-full rounded-2xl p-3 bg-black/60 border border-white/10 text-xs">
            <span className="font-black text-amber-400 uppercase text-[10px] block mb-1">
              {isHi ? 'महावास्तु के ८ शुभ द्वार (Auspicious Entrances):' : 'The 8 Auspicious MahaVastu Entrances:'}
            </span>
            <div className="grid grid-cols-4 gap-1.5 text-center font-mono font-bold text-[10.5px]">
              <span className="p-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">N3* मुख्य</span>
              <span className="p-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">N4* भल्लाट</span>
              <span className="p-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">E3* जयंत</span>
              <span className="p-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">E4* इंद्र</span>
              <span className="p-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">S3* वितथ</span>
              <span className="p-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">S4* गृहक्षत</span>
              <span className="p-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">W3* सुग्रीव</span>
              <span className="p-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">W4* पुष्पदंत</span>
            </div>
          </div>

          <div className="w-full flex flex-col gap-1.5 max-h-[420px] overflow-y-auto no-scrollbar">
            {VASTU_32_PADAS.map((pada) => (
              <div 
                key={pada.code}
                className={cn(
                  "p-2.5 rounded-2xl border flex items-center justify-between text-xs transition-all",
                  pada.isAuspicious 
                    ? "bg-emerald-950/30 border-emerald-500/50 text-emerald-200" 
                    : "bg-stone-900/60 border-white/10 text-stone-300"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-lg font-mono font-black text-xs border",
                    pada.isAuspicious ? "bg-emerald-500 text-black border-emerald-300" : "bg-black/60 text-amber-300 border-white/10"
                  )}>
                    {pada.code}
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-white leading-none">
                      {isHi ? pada.nameHi : pada.nameEn}
                    </span>
                    <span className="text-[9.5px] text-stone-400 font-mono mt-0.5">
                      {pada.startDeg}° - {pada.endDeg}°
                    </span>
                  </div>
                </div>

                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-black uppercase border",
                  pada.isAuspicious ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50" : "bg-rose-950/60 text-rose-300 border-rose-500/40"
                )}>
                  {pada.isAuspicious ? (isHi ? 'शुभ' : 'Auspicious') : (isHi ? 'अशुभ' : 'Inauspicious')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
