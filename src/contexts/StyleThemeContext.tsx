import React, { createContext, useContext, useState, useCallback } from 'react';

export interface StyleThemeColors {
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  bgGradient: string;
  textColor: string;
  // Light mode variants
  lightBgGradient: string;
  lightBgColor: string;
  // Ambient glow color for background orbs
  ambientGlow: string;
  ambientGlow2: string;
  ambientGlow3: string;
  // Card/surface colors for panels (Vastu, etc.)
  cardBg: string;
  cardBgLight: string;
  cardBorder: string;
  cardText: string;
  cardTextLight: string;
}

interface StyleThemeContextValue {
  styleColors: StyleThemeColors | null;
  setStyleColors: (colors: StyleThemeColors | null) => void;
}

const defaultColors: StyleThemeColors = {
  primaryColor: '#9CA3AF',
  accentColor: '#EF4444',
  bgColor: '#0F172A',
  bgGradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
  textColor: '#F8FAFC',
  lightBgGradient: 'radial-gradient(circle at 50% -10%, #fff7df 0%, #f6ead2 35%, #e8edf0 100%)',
  lightBgColor: '#fff7df',
  ambientGlow: 'rgba(245, 158, 11, 0.10)',
  ambientGlow2: 'rgba(6, 182, 212, 0.04)',
  ambientGlow3: 'rgba(236, 72, 153, 0.05)',
  cardBg: '#181510',
  cardBgLight: 'rgba(251, 247, 230, 0.5)',
  cardBorder: 'rgba(245, 158, 11, 0.15)',
  cardText: '#F5DEB3',
  cardTextLight: '#78350F',
};

const StyleThemeContext = createContext<StyleThemeContextValue>({
  styleColors: null,
  setStyleColors: () => {},
});

export function StyleThemeProvider({ children }: { children: React.ReactNode }) {
  const [styleColors, setStyleColors] = useState<StyleThemeColors | null>(null);

  return (
    <StyleThemeContext.Provider value={{ styleColors, setStyleColors }}>
      {children}
    </StyleThemeContext.Provider>
  );
}

export const useStyleTheme = () => {
  const context = useContext(StyleThemeContext);
  if (context === undefined)
    throw new Error('useStyleTheme must be used within a StyleThemeProvider');
  return context;
};

/**
 * Derive a full background theme from a compass variant's color properties.
 * Creates a subtle gradient background that complements the compass dial colors
 * while maintaining readable text contrast.
 */
export function deriveBackgroundFromVariant(
  primaryColor: string,
  accentColor: string,
  dialFaceBg?: string
): StyleThemeColors {
  // Extract base hue from primary color to create a harmonious background
  const rgb = hexToRgb(primaryColor);
  if (!rgb) {
    return defaultColors;
  }

  // DARK MODE: Create a dark, muted version of the primary color for the background
  const darkness = 0.15;
  const bgR = Math.round(rgb.r * darkness + 15 * (1 - darkness));
  const bgG = Math.round(rgb.g * darkness + 23 * (1 - darkness));
  const bgB = Math.round(rgb.b * darkness + 42 * (1 - darkness));

  const lightness = 0.25;
  const bg2R = Math.round(rgb.r * lightness + 30 * (1 - lightness));
  const bg2G = Math.round(rgb.g * lightness + 41 * (1 - lightness));
  const bg2B = Math.round(rgb.b * lightness + 59 * (1 - lightness));

  const bgColor = `rgb(${bgR}, ${bgG}, ${bgB})`;
  const bgGradient = `radial-gradient(circle at 50% -10%, rgb(${bg2R}, ${bg2G}, ${bg2B}) 0%, rgb(${bgR}, ${bgG}, ${bgB}) 36%, rgb(${Math.max(0, bgR - 3)}, ${Math.max(0, bgG - 3)}, ${Math.max(0, bgB - 3)}) 100%)`;

  // LIGHT MODE: Soft, warm tint derived from the primary color
  const lDarkness = 0.06;
  const lbgR = Math.round(rgb.r * lDarkness + 245 * (1 - lDarkness));
  const lbgG = Math.round(rgb.g * lDarkness + 243 * (1 - lDarkness));
  const lbgB = Math.round(rgb.b * lDarkness + 235 * (1 - lDarkness));

  const lLightness = 0.12;
  const lbg2R = Math.round(rgb.r * lLightness + 252 * (1 - lLightness));
  const lbg2G = Math.round(rgb.g * lLightness + 250 * (1 - lLightness));
  const lbg2B = Math.round(rgb.b * lLightness + 244 * (1 - lLightness));

  const lbg3R = Math.round(rgb.r * 0.03 + 232 * (1 - 0.03));
  const lbg3G = Math.round(rgb.g * 0.03 + 237 * (1 - 0.03));
  const lbg3B = Math.round(rgb.b * 0.03 + 240 * (1 - 0.03));

  const lightBgGradient = `radial-gradient(circle at 50% -10%, rgb(${lbg2R}, ${lbg2G}, ${lbg2B}) 0%, rgb(${lbgR}, ${lbgG}, ${lbgB}) 35%, rgb(${lbg3R}, ${lbg3G}, ${lbg3B}) 100%)`;
  const lightBgColor = `rgb(${lbg2R}, ${lbg2G}, ${lbg2B})`;

  // AMBIENT GLOW: Soft colored orbs matching the primary color
  const glowAlpha = 0.12;
  const ambientGlow = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${glowAlpha})`;

  // Complementary glow from accent color
  const accentRgb = hexToRgb(accentColor);
  const glowAlpha2 = 0.05;
  const ambientGlow2 = accentRgb
    ? `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${glowAlpha2})`
    : `rgba(6, 182, 212, 0.04)`;

  // Third glow: blend of primary and accent
  const blendR = Math.round((rgb.r + (accentRgb?.r ?? 0)) / 2);
  const blendG = Math.round((rgb.g + (accentRgb?.g ?? 0)) / 2);
  const blendB = Math.round((rgb.b + (accentRgb?.b ?? 0)) / 2);
  const ambientGlow3 = `rgba(${blendR}, ${blendG}, ${blendB}, 0.05)`;

  // CARD/SURFACE colors for Vastu and other panels
  const cardDarkness = 0.08;
  const cardR = Math.round(rgb.r * cardDarkness + 24 * (1 - cardDarkness));
  const cardG = Math.round(rgb.g * cardDarkness + 24 * (1 - cardDarkness));
  const cardB = Math.round(rgb.b * cardDarkness + 20 * (1 - cardDarkness));
  const cardBg = `rgb(${cardR}, ${cardG}, ${cardB})`;

  const cardLightR = Math.round(rgb.r * 0.05 + 251 * (1 - 0.05));
  const cardLightG = Math.round(rgb.g * 0.05 + 247 * (1 - 0.05));
  const cardLightB = Math.round(rgb.b * 0.05 + 230 * (1 - 0.05));
  const cardBgLight = `rgba(${cardLightR}, ${cardLightG}, ${cardLightB}, 0.6)`;

  const cardBorder = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;

  // Card text: warm tint of primary for dark mode
  const textDarkness = 0.6;
  const textR = Math.round(rgb.r * textDarkness + 245 * (1 - textDarkness));
  const textG = Math.round(rgb.g * textDarkness + 222 * (1 - textDarkness));
  const textB = Math.round(rgb.b * textDarkness + 179 * (1 - textDarkness));
  const cardText = `rgb(${textR}, ${textG}, ${textB})`;

  const cardTextLight = `rgb(${Math.round(rgb.r * 0.4 + 30 * 0.6)}, ${Math.round(rgb.g * 0.4 + 30 * 0.6)}, ${Math.round(rgb.b * 0.4 + 30 * 0.6)})`;

  // Determine text color based on background brightness
  const brightness = (bgR * 299 + bgG * 587 + bgB * 114) / 1000;
  const textColor = brightness < 128 ? '#F8FAFC' : '#0F172A';

  return {
    primaryColor,
    accentColor,
    bgColor,
    bgGradient,
    textColor,
    lightBgGradient,
    lightBgColor,
    ambientGlow,
    ambientGlow2,
    ambientGlow3,
    cardBg,
    cardBgLight,
    cardBorder,
    cardText,
    cardTextLight,
  };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return { r, g, b };
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.substring(0, 2), 16);
    const g = parseInt(cleaned.substring(2, 4), 16);
    const b = parseInt(cleaned.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}
