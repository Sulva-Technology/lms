/**
 * Deterministic visual identity for records that have no uploaded image.
 * A stable hue per seed keeps course cards and avatars recognisable between
 * renders without reaching for an external placeholder service.
 */
const hueFor = (seed: string): number => {
  let total = 0;
  for (let index = 0; index < seed.length; index += 1) {
    total = (total + seed.charCodeAt(index) * (index + 1)) % 360;
  }
  return total;
};

export function gradientFor(seed: string): string {
  const hue = hueFor(seed || 'vui');
  return `linear-gradient(135deg, hsl(${hue} 68% 34%), hsl(${(hue + 48) % 360} 70% 18%))`;
}

/** Up to two uppercase initials, falling back to a single neutral letter. */
export function initialsFor(name: string): string {
  const parts = (name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return 'U';
  return parts.map((part) => part[0]!.toUpperCase()).join('');
}
