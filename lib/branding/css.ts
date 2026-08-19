import { buildPalette, buildRamp, RAMP_SHADES, type BrandPalette } from './palette';

/**
 * Emits the custom properties the token layer in globals.css reads.
 *
 * Both modes are written in one pass so switching `data-theme` needs no server
 * round trip, and the selectors are attribute-based rather than :root-only so a
 * single dark section inside a light page inherits the dark-mode accent.
 */
function block(selector: string, palette: BrandPalette, rampSource: string | null | undefined): string {
  const { primary, secondary } = palette;
  const ramp = buildRamp(rampSource, palette.mode);
  return [
    `${selector}{`,
    `--brand-primary:${primary.base};`,
    `--brand-primary-hover:${primary.hover};`,
    `--brand-primary-contrast:${primary.contrast};`,
    `--brand-primary-soft:${primary.soft};`,
    `--brand-primary-soft-contrast:${primary.softContrast};`,
    `--brand-secondary:${secondary.base};`,
    `--brand-secondary-hover:${secondary.hover};`,
    `--brand-secondary-contrast:${secondary.contrast};`,
    `--brand-secondary-soft:${secondary.soft};`,
    `--brand-secondary-soft-contrast:${secondary.softContrast};`,
    ...RAMP_SHADES.map((shade) => `--brand-ramp-${shade}:${ramp[shade]};`),
    '}',
  ].join('');
}

export function buildBrandStyle(
  primaryHex: string | null | undefined,
  secondaryHex: string | null | undefined,
): string {
  return [
    block(':root,[data-theme="light"]', buildPalette(primaryHex, secondaryHex, 'light'), primaryHex),
    block('[data-theme="dark"]', buildPalette(primaryHex, secondaryHex, 'dark'), primaryHex),
  ].join('');
}
