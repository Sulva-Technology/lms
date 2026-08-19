import { describe, expect, it } from 'vitest';
import {
  buildBrandStyle,
  buildPalette,
  buildRamp,
  hexToOklch as toOklch,
  RAMP_SHADES,
  CANVAS,
  contrastRatio,
  DEFAULT_PRIMARY,
  hexToOklch,
  normalizeHex,
  oklchToHex,
} from '@/lib/branding';

const MODES = ['light', 'dark'] as const;

// Colours an admin might realistically pick, including the ones that break a
// naive implementation: near-white, near-black, and fully saturated yellow.
const SAMPLES = [
  '#690dab',
  '#0b6b4f',
  '#ffff00',
  '#fffbe6',
  '#000000',
  '#ffffff',
  '#ff0000',
  '#123456',
];

describe('hex parsing', () => {
  it('accepts shorthand, missing hash, and uppercase', () => {
    expect(normalizeHex('690DAB')).toBe('#690dab');
    expect(normalizeHex('#ABC')).toBe('#aabbcc');
    expect(normalizeHex('  #690dab  ')).toBe('#690dab');
  });

  it('rejects anything that is not a colour', () => {
    expect(normalizeHex('purple')).toBeNull();
    expect(normalizeHex('#12345')).toBeNull();
    expect(normalizeHex('#12345g')).toBeNull();
    expect(normalizeHex('')).toBeNull();
  });
});

describe('oklch round trip', () => {
  it('returns the original colour within one 8-bit step', () => {
    for (const hex of SAMPLES) {
      expect(oklchToHex(hexToOklch(hex))).toBe(hex);
    }
  });
});

describe('derived palette', () => {
  it('keeps label text readable on every accent surface', () => {
    for (const mode of MODES) {
      for (const hex of SAMPLES) {
        const palette = buildPalette(hex, hex, mode);
        for (const accent of [palette.primary, palette.secondary]) {
          expect(contrastRatio(accent.base, accent.contrast)).toBeGreaterThanOrEqual(4.5);
          expect(contrastRatio(accent.soft, accent.softContrast)).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it('keeps the accent distinguishable from the canvas it sits on', () => {
    for (const mode of MODES) {
      for (const hex of SAMPLES) {
        const { primary } = buildPalette(hex, hex, mode);
        expect(contrastRatio(primary.base, CANVAS[mode])).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('preserves the hue the admin picked', () => {
    for (const mode of MODES) {
      const source = hexToOklch('#690dab');
      const { primary } = buildPalette('#690dab', null, mode);
      const derived = hexToOklch(primary.base);
      const delta = Math.abs(((derived.h - source.h + 540) % 360) - 180);
      expect(delta).toBeLessThan(2);
    }
  });

  it('moves hover away from the canvas so buttons react in both modes', () => {
    const light = buildPalette('#690dab', null, 'light').primary;
    const dark = buildPalette('#690dab', null, 'dark').primary;
    expect(hexToOklch(light.hover).l).toBeLessThan(hexToOklch(light.base).l);
    expect(hexToOklch(dark.hover).l).toBeGreaterThan(hexToOklch(dark.base).l);
  });

  it('falls back to the platform brand for missing or invalid input', () => {
    const fallback = buildPalette(null, undefined, 'light');
    const explicit = buildPalette(DEFAULT_PRIMARY, null, 'light');
    expect(fallback.primary.base).toBe(explicit.primary.base);
    expect(buildPalette('not-a-colour', null, 'light').primary.base).toBe(explicit.primary.base);
  });

  it('is deterministic', () => {
    expect(buildPalette('#ffff00', '#123456', 'dark')).toEqual(
      buildPalette('#ffff00', '#123456', 'dark'),
    );
  });
});

describe('legacy ramp', () => {
  it('produces every shade as a valid colour', () => {
    for (const mode of MODES) {
      for (const hex of SAMPLES) {
        const ramp = buildRamp(hex, mode);
        for (const shade of RAMP_SHADES) {
          expect(ramp[shade]).toMatch(/^#[0-9a-f]{6}$/);
        }
      }
    }
  });

  it('gets darker as the shade number rises', () => {
    for (const mode of MODES) {
      const ramp = buildRamp('#690dab', mode);
      const lightness = RAMP_SHADES.map((shade) => toOklch(ramp[shade]).l);
      for (let i = 1; i < lightness.length; i += 1) {
        expect(lightness[i]).toBeLessThan(lightness[i - 1]);
      }
    }
  });

  it('carries the brand hue through the whole scale', () => {
    const source = toOklch('#0b6b4f');
    const ramp = buildRamp('#0b6b4f', 'dark');
    // The palest and darkest shades hold little chroma, so hue is only
    // meaningful — and only checked — through the usable middle of the scale.
    for (const shade of [300, 400, 500, 600, 700] as const) {
      const delta = Math.abs(((toOklch(ramp[shade]).h - source.h + 540) % 360) - 180);
      expect(delta).toBeLessThan(4);
    }
  });

  it('falls back to the platform brand when a school has picked nothing', () => {
    expect(buildRamp(null, 'dark')).toEqual(buildRamp('#690dab', 'dark'));
  });
});

describe('brand stylesheet', () => {
  it('defines both modes and emits only colour declarations', () => {
    const css = buildBrandStyle('#690dab', '#0b6b4f');
    expect(css).toContain(':root,[data-theme="light"]{');
    expect(css).toContain('[data-theme="dark"]{');
    expect(css).toContain('--brand-primary:');
    expect(css).toContain('--brand-secondary-soft-contrast:');
    expect(css).toContain('--brand-ramp-500:');
    expect(css).toContain('--brand-ramp-950:');
    // Nothing but hex values reaches the inline <style>, so a stored value can
    // never close the tag or smuggle a declaration.
    expect(css).not.toMatch(/[<>;]\s*[a-z-]+\s*:\s*(?!#)/i);
  });

  it('cannot be escaped by a hostile stored value', () => {
    const css = buildBrandStyle('#690dab</style><script>alert(1)</script>', null);
    expect(css).not.toContain('<');
    expect(css).not.toContain('script');
  });
});
