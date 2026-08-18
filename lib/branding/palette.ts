import { contrastRatio, hexToOklch, normalizeHex, oklchToHex, type Oklch } from './oklch';

export type ThemeMode = 'light' | 'dark';

/** The platform's own brand, used whenever a school has not picked one. */
export const DEFAULT_PRIMARY = '#690dab';
export const DEFAULT_SECONDARY = '#0b6b4f';

/** Canvas each mode paints on. Foreground contrast is measured against these. */
export const CANVAS: Record<ThemeMode, string> = {
  light: '#f7f6f8',
  dark: '#160d1b',
};

/**
 * Lightness band an accent may occupy per mode. A school can pick pale yellow
 * or near-black; the hue and chroma survive, the lightness is pulled into a
 * band where the colour can carry a readable label and still separate from the
 * canvas.
 */
const BAND: Record<ThemeMode, { min: number; max: number }> = {
  light: { min: 0.42, max: 0.63 },
  dark: { min: 0.62, max: 0.82 },
};

const AA_TEXT = 4.5;
const AA_LARGE = 3;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const withLightness = (base: Oklch, l: number): Oklch => ({ ...base, l: clamp(l, 0, 1) });

/** Black or white, whichever reads better on the given colour. */
export function contrastForeground(hex: string): string {
  return contrastRatio(hex, '#ffffff') >= contrastRatio(hex, '#0b0710') ? '#ffffff' : '#0b0710';
}

/**
 * Nudges lightness inside the band until the colour both carries a readable
 * foreground and stays distinguishable from the canvas. Returns the best
 * candidate found rather than failing: an admin never gets a blocked save, they
 * get an adjusted shade.
 */
function fit(base: Oklch, mode: ThemeMode): string {
  const band = BAND[mode];
  const canvas = CANVAS[mode];
  const start = clamp(base.l, band.min, band.max);

  let best = oklchToHex(withLightness(base, start));
  let bestScore = -Infinity;

  for (let step = 0; step <= 40; step += 1) {
    // Walk outward from the clamped start so the admin's own lightness wins
    // whenever it already works.
    const offset = (step % 2 === 0 ? 1 : -1) * Math.floor(step / 2) * 0.01;
    const l = clamp(start + offset, band.min, band.max);
    const candidate = oklchToHex(withLightness(base, l));

    const legible = contrastRatio(candidate, contrastForeground(candidate));
    const separated = contrastRatio(candidate, canvas);
    if (legible >= AA_TEXT && separated >= AA_LARGE) return candidate;

    const score = Math.min(legible / AA_TEXT, separated / AA_LARGE);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}

export interface AccentTokens {
  base: string;
  hover: string;
  contrast: string;
  soft: string;
  softContrast: string;
}

function accent(hex: string, mode: ThemeMode): AccentTokens {
  const base = hexToOklch(hex);
  const fitted = fit(base, mode);
  const fittedOklch = hexToOklch(fitted);

  // Hover moves toward the canvas in dark mode and away from it in light mode,
  // so the button always brightens under the cursor on dark and deepens on light.
  const hover = oklchToHex(
    withLightness(fittedOklch, fittedOklch.l + (mode === 'light' ? -0.06 : 0.07)),
  );

  const soft = oklchToHex({
    l: mode === 'light' ? 0.95 : 0.28,
    c: Math.min(fittedOklch.c, mode === 'light' ? 0.05 : 0.07),
    h: fittedOklch.h,
  });

  // The soft chip is a surface, so its label needs to clear AA against it; the
  // fitted accent usually does, and the ink fallback covers the rest.
  const softLabel = mode === 'light' ? fitted : oklchToHex(withLightness(fittedOklch, 0.86));
  const softContrast =
    contrastRatio(soft, softLabel) >= AA_TEXT
      ? softLabel
      : contrastForeground(soft);

  return {
    base: fitted,
    hover,
    contrast: contrastForeground(fitted),
    soft,
    softContrast,
  };
}

export interface BrandPalette {
  mode: ThemeMode;
  primary: AccentTokens;
  secondary: AccentTokens;
}

export function buildPalette(
  primaryHex: string | null | undefined,
  secondaryHex: string | null | undefined,
  mode: ThemeMode,
): BrandPalette {
  const primary = normalizeHex(primaryHex || '') || DEFAULT_PRIMARY;
  const secondary = normalizeHex(secondaryHex || '') || DEFAULT_SECONDARY;
  return {
    mode,
    primary: accent(primary, mode),
    secondary: accent(secondary, mode),
  };
}
