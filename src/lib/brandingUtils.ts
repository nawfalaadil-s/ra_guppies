import { BrandingSettings } from './types';

// ============================================================================
// RA GUPPY — BRANDING & ACCESSIBILITY COLOR CALCULATIONS
// ============================================================================

export const PRIMARY_PRESETS = [
  { name: 'Royal Navy (Default)', hex: '#1e3a8a' },
  { name: 'Ocean Sapphire', hex: '#0284c7' },
  { name: 'Emerald Aquascape', hex: '#059669' },
  { name: 'Deep Indigo', hex: '#4338ca' },
  { name: 'Velvet Midnight', hex: '#0f172a' },
  { name: 'Royal Amethyst', hex: '#7c3aed' },
];

export const SECONDARY_PRESETS = [
  { name: 'RA Crimson (Default)', hex: '#dc2626' },
  { name: 'Flame Coral', hex: '#ea580c' },
  { name: 'Amber Gold', hex: '#d97706' },
  { name: 'Tropical Magenta', hex: '#db2777' },
  { name: 'Cyan Electric', hex: '#06b6d4' },
];

/**
 * Validates a standard 3 or 6 digit hex color code
 */
export function isValidHex(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex.trim());
}

/**
 * Normalizes hex to full 6-digit #RRGGBB
 */
export function normalizeHex(hex: string, fallback = '#1e3a8a'): string {
  if (!isValidHex(hex)) return fallback;
  let clean = hex.trim();
  if (clean.length === 4) {
    clean = `#${clean[1]}${clean[1]}${clean[2]}${clean[2]}${clean[3]}${clean[3]}`;
  }
  return clean.toLowerCase();
}

/**
 * Converts Hex to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const norm = normalizeHex(hex);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(norm);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Converts RGB to Hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * Calculates WCAG 2.2 Relative Luminance
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 */
export function calculateLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const a = [rgb.r, rgb.g, rgb.b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calculates WCAG 2.2 Contrast Ratio: (L1 + 0.05) / (L2 + 0.05)
 */
export function calculateContrastRatio(hex1: string, hex2: string): number {
  const lum1 = calculateLuminance(hex1);
  const lum2 = calculateLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  const ratio = (brightest + 0.05) / (darkest + 0.05);
  return Number(ratio.toFixed(2));
}

/**
 * Determines contrast-safe foreground text color:
 * Compares against white (#ffffff) and dark slate (#0f172a), returning whichever
 * achieves higher contrast to ensure buttons and badges remain WCAG AA accessible.
 */
export function getAccessibleTextColor(bgHex: string): string {
  const whiteRatio = calculateContrastRatio(bgHex, '#ffffff');
  const darkRatio = calculateContrastRatio(bgHex, '#0f172a');
  return whiteRatio >= darkRatio ? '#ffffff' : '#0f172a';
}

/**
 * Computes WCAG compliance level
 */
export function getWcagRating(ratio: number): {
  passAA: boolean;
  passAAA: boolean;
  label: string;
  badgeClass: string;
} {
  if (ratio >= 7.0) {
    return {
      passAA: true,
      passAAA: true,
      label: 'Passes AAA (Excellent)',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    };
  }
  if (ratio >= 4.5) {
    return {
      passAA: true,
      passAAA: false,
      label: 'Passes AA (Compliant)',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
  if (ratio >= 3.0) {
    return {
      passAA: false,
      passAAA: false,
      label: 'Large Text Only (3.0:1)',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }
  return {
    passAA: false,
    passAAA: false,
    label: 'Fails WCAG (Low Contrast)',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
  };
}

/**
 * Adjusts brightness by a percentage for hover/active states (-20% to +20%)
 */
export function adjustBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = 1 + percent / 100;
  return rgbToHex(rgb.r * factor, rgb.g * factor, rgb.b * factor);
}

/**
 * Generates soft pastel background tint (e.g. 10% opacity equivalent blended on white)
 */
export function getPastelTint(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#eff6ff';

  // Blend 12% color with 88% white (#ffffff)
  const r = Math.round(rgb.r * 0.12 + 255 * 0.88);
  const g = Math.round(rgb.g * 0.12 + 255 * 0.88);
  const b = Math.round(rgb.b * 0.12 + 255 * 0.88);
  return rgbToHex(r, g, b);
}

/**
 * Injects dynamic CSS variables directly into :root
 */
export function applyBrandingCssVariables(settings: BrandingSettings): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const primary = normalizeHex(settings.primary_color, '#1e3a8a');
  const secondary = normalizeHex(settings.secondary_color, '#dc2626');
  const accent = normalizeHex(settings.accent_color || '#0284c7', '#0284c7');
  const bg = normalizeHex(settings.background_color || '#f8fafc', '#f8fafc');
  const text = normalizeHex(settings.text_color || '#0f172a', '#0f172a');

  // Compute accessible foreground text
  const primaryText = getAccessibleTextColor(primary);
  const secondaryText = getAccessibleTextColor(secondary);
  const accentText = getAccessibleTextColor(accent);

  // Compute derived interactive shades
  const primaryHover = calculateLuminance(primary) > 0.6 ? adjustBrightness(primary, -15) : adjustBrightness(primary, 15);
  const secondaryHover = calculateLuminance(secondary) > 0.6 ? adjustBrightness(secondary, -15) : adjustBrightness(secondary, 15);
  const primaryLight = getPastelTint(primary);
  const secondaryLight = getPastelTint(secondary);

  // Set CSS Custom Properties on document root
  root.style.setProperty('--brand-primary', primary);
  root.style.setProperty('--brand-primary-hover', primaryHover);
  root.style.setProperty('--brand-primary-light', primaryLight);
  root.style.setProperty('--brand-primary-text', primaryText);

  root.style.setProperty('--brand-secondary', secondary);
  root.style.setProperty('--brand-secondary-hover', secondaryHover);
  root.style.setProperty('--brand-secondary-light', secondaryLight);
  root.style.setProperty('--brand-secondary-text', secondaryText);

  root.style.setProperty('--brand-accent', accent);
  root.style.setProperty('--brand-accent-text', accentText);
  root.style.setProperty('--brand-bg', bg);
  root.style.setProperty('--brand-text', text);

  // Dynamically update browser tab favicon if provided
  if (settings.favicon_url) {
    try {
      let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      const cacheBust = settings.version ? `?v=${settings.version}` : '';
      link.href = `${settings.favicon_url}${cacheBust}`;
    } catch (e) {
      // Ignored in non-browser environments
    }
  }
}
