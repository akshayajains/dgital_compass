import React, { useState, useRef, useEffect } from 'react';
import { Layers, Plus, Minus, Navigation2, Compass, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  heading: number | null;
  location: { latitude: number; longitude: number } | null;
  onCenterUser?: () => void;
}

// Slippy map tile math
function lon2tile(lon: number, zoom: number) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}
function lat2tile(lat: number, zoom: number) {
  return Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
}

export const MapCompassView: React.FC<Props> = ({
  heading,
  location
}) => {
  const defaultLat = 18.5204;
  const defaultLon = 73.8567;
  const lat = location?.latitude ?? defaultLat;
  const lon = location?.longitude ?? defaultLon;

  const [zoom, setZoom] = useState<number>(15);
  const [mapType, setMapType] = useState<'satellite' | 'streets' | 'dark'>('satellite');
  const [headingUp, setHeadingUp] = useState<boolean>(false);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const displayDeg = heading !== null ? Math.round(((heading % 360) + 360) % 360) : 0;

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    setPanOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const resetToCenter = () => {
    setPanOffset({ x: 0, y: 0 });
  };

  // Generate 3x3 tiles around center
  const centerTileX = lon2tile(lon, zoom);
  const centerTileY = lat2tile(lat, zoom);
  const tileRange = [-1, 0, 1];

  const getTileUrl = (x: number, y: number, z: number) => {
    switch (mapType) {
      case 'satellite':
        return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
      case 'dark':
        return `https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`;
      default:
        return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    }
  };

  return (
    <div 
      className="w-full relative rounded-3xl overflow-hidden bg-[#0A0E14] border border-slate-700 shadow-2xl flex flex-col items-center select-none aspect-[4/5] sm:aspect-square touch-none cursor-grab active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* 1. Map Canvas Container with Optional Heading-Up Rotation */}
      <div 
        className="absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-out"
        style={{
          transform: headingUp ? `rotate(${-displayDeg}deg)` : undefined
        }}
      >
        {/* Tile Grid Container */}
        <div 
          className="relative w-[768px] h-[768px] flex-shrink-0 grid grid-cols-3 grid-rows-3"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`
          }}
        >
          {tileRange.map((dy) =>
            tileRange.map((dx) => {
              const tileX = centerTileX + dx;
              const tileY = centerTileY + dy;
              return (
                <div key={`${tileX}-${tileY}-${zoom}`} className="w-[256px] h-[256px] relative overflow-hidden bg-slate-900 border border-white/5">
                  <img
                    src={getTileUrl(tileX, tileY, zoom)}
                    alt=""
                    className="w-full h-full object-cover select-none pointer-events-none"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback tile on network failure
                      (e.target as HTMLImageElement).src = 'https://tile.openstreetmap.org/0/0/0.png';
                    }}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. User Center Marker & Cone of Vision (Heading Beam) */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`
        }}
      >
        {/* Field of View Heading Cone */}
        <div 
          className="absolute w-44 h-44 -translate-y-22 flex items-center justify-center transition-transform duration-75 ease-out"
          style={{
            transform: `rotate(${headingUp ? 0 : displayDeg}deg)`,
            transformOrigin: '50% 100%'
          }}
        >
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100">
            <defs>
              <radialGradient id="coneGlow" cx="50%" cy="100%" r="90%">
                <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.75" />
                <stop offset="40%" stopColor="#00F0FF" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
              </radialGradient>
            </defs>
            <polygon points="50,100 10,0 90,0" fill="url(#coneGlow)" />
            <line x1="50" y1="100" x2="50" y2="10" stroke="#00F0FF" strokeWidth="1.8" strokeDasharray="3 2" className="drop-shadow-[0_0_8px_#00f0ff]" />
          </svg>
        </div>

        {/* User GPS Pin Pulsar */}
        <div className="relative flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-cyan-400/30 animate-ping absolute" />
          <div className="w-5 h-5 rounded-full bg-cyan-500 border-2 border-white shadow-[0_0_15px_#00f0ff] flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
        </div>
      </div>

      {/* 3. Top Telemetry Banner */}
      <div className="absolute top-3 inset-x-3 z-30 flex items-center justify-between pointer-events-none">
        <div className="px-3 py-1.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/15 text-white flex items-center gap-2 shadow-lg">
          <MapPin className="w-3.5 h-3.5 text-red-500" />
          <span className="text-[11px] font-mono font-bold">
            {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
          </span>
        </div>

        <div className="px-3 py-1.5 rounded-2xl bg-black/70 backdrop-blur-md border border-cyan-400/50 text-cyan-400 flex items-center gap-1.5 shadow-lg">
          <Navigation2 className="w-3.5 h-3.5 fill-cyan-400" />
          <span className="text-xs font-mono font-black">{displayDeg}°</span>
        </div>
      </div>

      {/* 4. Map Control Overlays (Top Right & Bottom Right) */}
      <div className="absolute top-14 right-3 z-30 flex flex-col gap-1.5 pointer-events-auto">
        {/* Layer Switcher */}
        <button
          onClick={() => {
            const types: Array<'satellite' | 'streets' | 'dark'> = ['satellite', 'streets', 'dark'];
            const next = types[(types.indexOf(mapType) + 1) % types.length];
            setMapType(next);
          }}
          className="w-8 h-8 rounded-xl bg-black/70 backdrop-blur-md border border-white/15 text-white hover:text-cyan-400 flex items-center justify-center shadow-lg active:scale-95 transition-all"
          title="Switch Map Layer"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Heading Up vs North Up */}
        <button
          onClick={() => setHeadingUp(!headingUp)}
          className={cn(
            "w-8 h-8 rounded-xl backdrop-blur-md border flex items-center justify-center shadow-lg active:scale-95 transition-all text-[10px] font-mono font-black",
            headingUp
              ? "bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_#00f0ff]"
              : "bg-black/70 text-white border-white/15 hover:text-cyan-400"
          )}
          title="Toggle Heading Up Map Rotation"
        >
          {headingUp ? 'HDG' : 'N-UP'}
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-3 inset-x-3 z-30 flex items-center justify-between pointer-events-auto">
        {/* Zoom In/Out Buttons */}
        <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-2xl border border-white/15 shadow-lg">
          <button
            onClick={() => setZoom(Math.min(18, zoom + 1))}
            className="w-7 h-7 rounded-xl bg-stone-800 text-white hover:text-cyan-400 flex items-center justify-center active:scale-95"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(Math.max(10, zoom - 1))}
            className="w-7 h-7 rounded-xl bg-stone-800 text-white hover:text-cyan-400 flex items-center justify-center active:scale-95"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Recenter Button */}
        <button
          onClick={resetToCenter}
          className="px-3 py-1.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.5)] active:scale-95 transition-all"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>CENTER GPS</span>
        </button>
      </div>
    </div>
  );
};
