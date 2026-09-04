import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, RotateCw, ZoomIn, Eye, Sparkles, Check, Download, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FloorPlanOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentHeading: number | null;
  language: string;
  theme: string;
}

export const FloorPlanOverlayModal = ({
  isOpen,
  onClose,
  currentHeading,
  language,
  theme,
}: FloorPlanOverlayModalProps) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(currentHeading !== null ? -currentHeading : 0);
  const [scale, setScale] = useState<number>(1);
  const [gridOpacity, setGridOpacity] = useState<number>(0.8);
  const [gridType, setGridType] = useState<'9grid' | '16radial'>('9grid');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
        toast.success(language === 'hi' ? 'नक्शा लोड हुआ!' : 'Floor plan uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const autoAlignToCompass = () => {
    if (currentHeading !== null) {
      setRotation(-currentHeading);
      toast.success(language === 'hi' ? `कंपास (${Math.round(currentHeading)}°) से संरेखित हुआ` : `Aligned to Compass (${Math.round(currentHeading)}°)`);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[125] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className={cn(
            "w-full max-w-lg h-[90vh] max-h-[750px] rounded-[2.5rem] border flex flex-col justify-between overflow-hidden relative shadow-2xl",
            theme === 'light'
              ? "bg-amber-50/95 border-amber-500/30 text-amber-950"
              : "bg-[#141210] border-amber-500/20 text-amber-100"
          )}
        >
          {/* Top Bar */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-serif font-black text-sm text-white">
                  {language === 'hi' ? 'वास्तु ब्लूप्रिंट संरेखण' : 'Floor Plan Vastu Calibrator'}
                </h3>
                <p className="text-[10px] text-stone-400">
                  {language === 'hi' ? 'नक्शे पर 9x9 वास्तु मंडल ग्रिड बिछाएं' : 'Overlay 9x9 Vastu Purusha Mandala Grid'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-transform text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center Interactive Canvas View */}
          <div className="flex-1 relative overflow-hidden bg-stone-950 flex items-center justify-center p-2">
            {imageSrc ? (
              <div
                className="relative w-full h-full max-h-[420px] flex items-center justify-center overflow-hidden rounded-2xl border border-white/10"
              >
                {/* Background Floor Plan Image */}
                <img
                  src={imageSrc}
                  alt="Floor Plan Layout"
                  className="max-w-full max-h-full object-contain pointer-events-none transition-transform"
                  style={{ transform: `scale(${scale})` }}
                />

                {/* Overlaid Rotating Vastu Grid */}
                <div
                  className="absolute w-[80%] aspect-square pointer-events-none border-2 border-amber-400 transition-transform duration-200 ease-out"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    opacity: gridOpacity,
                  }}
                >
                  {gridType === '9grid' ? (
                    // 9x9 Vastu Purusha Mandala Grid
                    <div className="w-full h-full grid grid-cols-3 grid-rows-3 border border-amber-400">
                      {[
                        { code: 'NW', label: 'वायव्य (Air)', color: 'bg-sky-500/20' },
                        { code: 'N', label: 'उत्तर (Water)', color: 'bg-blue-500/20' },
                        { code: 'NE', label: 'ईशान (Divine)', color: 'bg-emerald-500/25 border-2 border-emerald-400' },
                        { code: 'W', label: 'पश्चिम (Space)', color: 'bg-stone-500/20' },
                        { code: 'CTR', label: 'ब्रह्मस्थान (Brahma)', color: 'bg-yellow-500/25 font-black' },
                        { code: 'E', label: 'पूर्व (Solar)', color: 'bg-orange-500/20' },
                        { code: 'SW', label: 'नैऋत्य (Earth)', color: 'bg-amber-800/30' },
                        { code: 'S', label: 'दक्षिण (Yama)', color: 'bg-red-800/20' },
                        { code: 'SE', label: 'आग्नेय (Fire)', color: 'bg-red-500/25 border-2 border-red-400' },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "border border-amber-400/60 p-1 flex flex-col items-center justify-center text-center backdrop-blur-[1px]",
                            item.color
                          )}
                        >
                          <span className="text-[11px] font-black text-amber-300 drop-shadow">{item.code}</span>
                          <span className="text-[8px] font-bold text-white/90 leading-tight">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // 16-Radial Zone Wheel
                    <div className="w-full h-full rounded-full border-2 border-amber-400 relative flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border border-dashed border-amber-300/50" />
                      <div className="absolute top-2 font-black text-[10px] text-emerald-400">TRUE NORTH (0°)</div>
                      <div className="absolute bottom-2 font-black text-[10px] text-red-400">SOUTH (180°)</div>
                      <div className="absolute right-2 font-black text-[10px] text-orange-400">EAST (90°)</div>
                      <div className="absolute left-2 font-black text-[10px] text-stone-300">WEST (270°)</div>
                    </div>
                  )}

                  {/* Center Pivot Indicator */}
                  <div className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]" />
                </div>
              </div>
            ) : (
              // Empty Upload State
              <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-white/20 rounded-3xl max-w-xs">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {language === 'hi' ? 'घर का नक्शा चुनें' : 'Upload House Blueprint'}
                </h4>
                <p className="text-xs text-stone-400 mb-4">
                  {language === 'hi' ? 'अपनी गैलरी या फाइल से 2D फ्लोर प्लान की फोटो अपलोड करें।' : 'Select architectural 2D floor plan image from your gallery.'}
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2.5 px-5 rounded-xl bg-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider active:scale-95 shadow-lg"
                >
                  {language === 'hi' ? 'फाइल चुनें' : 'Browse Plan'}
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* Bottom Calibration Controls */}
          {imageSrc && (
            <div className="p-4 bg-stone-900 border-t border-white/10 space-y-3">
              {/* Rotation Slider */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 w-16">
                  {language === 'hi' ? 'घूर्णन' : 'Rotate'}: {Math.round((rotation % 360 + 360) % 360)}°
                </span>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={(rotation % 360 + 360) % 360}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="flex-1 accent-amber-500"
                />
                <button
                  onClick={autoAlignToCompass}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase active:scale-90"
                >
                  Auto GPS
                </button>
              </div>

              {/* Scale & Grid Type Toggle */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-stone-400">Scale:</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.05"
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="w-24 accent-amber-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setGridType('9grid')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-black transition-all",
                      gridType === '9grid' ? "bg-amber-500 text-stone-950" : "text-stone-400 hover:text-white"
                    )}
                  >
                    9-Grid
                  </button>
                  <button
                    onClick={() => setGridType('16radial')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-black transition-all",
                      gridType === '16radial' ? "bg-amber-500 text-stone-950" : "text-stone-400 hover:text-white"
                    )}
                  >
                    16-Radial
                  </button>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-lg bg-stone-800 text-stone-300 hover:text-white active:scale-90"
                  title="Change Image"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
