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

/**
 * A full 50..950 ramp derived from one brand colour.
 *
 * This exists for the screens still written against Tailwind's literal `blue-*`
 * scale. Those utilities compile to `var(--color-blue-N)`, so redefining the
 * ramp inside the legacy shell rebrands several hundred call sites without
 * touching them — and each one retires naturally when its screen is rebuilt on
 * the semantic tokens.
 */
export const RAMP_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

export type RampShade = (typeof RAMP_SHADES)[number];

// Lightness per shade, and how much of the brand's chroma each one keeps. The
// ends of a ramp are washed out or nearly black, so holding full chroma there
// produces colours that read as a different hue.
const RAMP_STEPS: Record<RampShade, { l: number; c: number }> = {
  50: { l: 0.971, c: 0.14 },
  100: { l: 0.943, c: 0.24 },
  200: { l: 0.885, c: 0.44 },
  300: { l: 0.808, c: 0.64 },
  400: { l: 0.723, c: 0.85 },
  500: { l: 0.645, c: 1 },
  600: { l: 0.565, c: 1 },
  700: { l: 0.487, c: 0.94 },
  800: { l: 0.409, c: 0.84 },
  900: { l: 0.337, c: 0.7 },
  950: { l: 0.241, c: 0.55 },
};

export type BrandRamp = Record<RampShade, string>;

export function buildRamp(hex: string | null | undefined, mode: ThemeMode): BrandRamp {
  const source = normalizeHex(hex || '') || DEFAULT_PRIMARY;
  // Start from the fitted accent so the ramp sits around a colour that is
  // already legible in this mode rather than around the raw input.
  const anchor = hexToOklch(accent(source, mode).base);

  const ramp = {} as BrandRamp;
  for (const shade of RAMP_SHADES) {
    const step = RAMP_STEPS[shade];
    ramp[shade] = oklchToHex({ l: step.l, c: anchor.c * step.c, h: anchor.h });
  }
  return ramp;
}
