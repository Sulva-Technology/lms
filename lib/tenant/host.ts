export type TenantHost =
  | { kind: 'root' }
  | { kind: 'tenant'; subdomain: string }
  | { kind: 'unknown' };

/**
 * Names that must never become a school subdomain: platform hostnames, common
 * infrastructure records, and words we may want for first-party surfaces.
 * Kept byte-identical to the CHECK constraint in migration 034.
 */
export const RESERVED_SUBDOMAINS = [
  'www', 'app', 'api', 'admin', 'superadmin', 'mail', 'smtp', 'ftp',
  'static', 'assets', 'cdn', 'docs', 'blog', 'status', 'support',
  'dashboard', 'login', 'auth', 'dev', 'staging', 'test', 'demo', 'vercel',
] as const;

const SUBDOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

const stripPort = (value: string) => value.split(':')[0].trim().toLowerCase();

export function isValidSubdomain(value: string): boolean {
  if (!SUBDOMAIN_PATTERN.test(value)) return false;
  return !RESERVED_SUBDOMAINS.includes(value as (typeof RESERVED_SUBDOMAINS)[number]);
}

export function slugifySubdomain(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
    .replace(/-+$/g, '');
}

export function parseTenantHost(host: string | null | undefined, rootDomain: string): TenantHost {
  if (!host) return { kind: 'unknown' };

  const hostname = stripPort(host);
  const root = stripPort(rootDomain);
  if (!hostname || !root) return { kind: 'unknown' };

  // Vercel preview/production deployment URLs have no tenant, so they behave
  // like the root domain instead of 404-ing every preview build.
  if (hostname.endsWith('.vercel.app')) return { kind: 'root' };

  if (hostname === root || hostname === `www.${root}`) return { kind: 'root' };
  if (!hostname.endsWith(`.${root}`)) return { kind: 'unknown' };

  const label = hostname.slice(0, -(root.length + 1));
  if (label.includes('.')) return { kind: 'unknown' };
  if (!isValidSubdomain(label)) return { kind: 'unknown' };

  return { kind: 'tenant', subdomain: label };
}
