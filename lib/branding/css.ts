import { buildPalette, type BrandPalette } from './palette';

/**
 * Emits the custom properties the token layer in globals.css reads.
 *
 * Both modes are written in one pass so switching `data-theme` needs no server
 * round trip, and the selectors are attribute-based rather than :root-only so a
 * single dark section inside a light page inherits the dark-mode accent.
 */
function block(selector: string, palette: BrandPalette): string {
  const { primary, secondary } = palette;
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
    '}',
  ].join('');
}

export function buildBrandStyle(
  primaryHex: string | null | undefined,
  secondaryHex: string | null | undefined,
): string {
  return [
    block(':root,[data-theme="light"]', buildPalette(primaryHex, secondaryHex, 'light')),
    block('[data-theme="dark"]', buildPalette(primaryHex, secondaryHex, 'dark')),
  ].join('');
}
