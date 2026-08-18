import { describe, expect, it } from 'vitest';
import {
  RESERVED_SUBDOMAINS,
  isValidSubdomain,
  parseTenantHost,
  slugifySubdomain,
} from '@/lib/tenant/host';

describe('parseTenantHost', () => {
  it('treats the bare root domain and www as root', () => {
    expect(parseTenantHost('sulva.com', 'sulva.com')).toEqual({ kind: 'root' });
    expect(parseTenantHost('www.sulva.com', 'sulva.com')).toEqual({ kind: 'root' });
    expect(parseTenantHost('SULVA.COM', 'sulva.com')).toEqual({ kind: 'root' });
  });

  it('extracts a tenant subdomain', () => {
    expect(parseTenantHost('unilag.sulva.com', 'sulva.com')).toEqual({ kind: 'tenant', subdomain: 'unilag' });
  });

  it('ignores ports on both sides', () => {
    expect(parseTenantHost('unilag.localhost:3000', 'localhost:3000')).toEqual({ kind: 'tenant', subdomain: 'unilag' });
    expect(parseTenantHost('localhost:3000', 'localhost:3000')).toEqual({ kind: 'root' });
  });

  it('treats vercel preview hosts as root', () => {
    expect(parseTenantHost('lms-git-main-team.vercel.app', 'sulva.com')).toEqual({ kind: 'root' });
  });

  it('rejects nested, reserved, and foreign hosts', () => {
    expect(parseTenantHost('a.b.sulva.com', 'sulva.com')).toEqual({ kind: 'unknown' });
    expect(parseTenantHost('api.sulva.com', 'sulva.com')).toEqual({ kind: 'unknown' });
    expect(parseTenantHost('evil.com', 'sulva.com')).toEqual({ kind: 'unknown' });
    expect(parseTenantHost(null, 'sulva.com')).toEqual({ kind: 'unknown' });
  });
});

describe('isValidSubdomain', () => {
  it('accepts slugs and rejects malformed or reserved values', () => {
    expect(isValidSubdomain('unilag')).toBe(true);
    expect(isValidSubdomain('uni-lag-2')).toBe(true);
    expect(isValidSubdomain('-lead')).toBe(false);
    expect(isValidSubdomain('trail-')).toBe(false);
    expect(isValidSubdomain('Upper')).toBe(false);
    expect(isValidSubdomain('has_underscore')).toBe(false);
    expect(isValidSubdomain('')).toBe(false);
    expect(isValidSubdomain('www')).toBe(false);
    expect(RESERVED_SUBDOMAINS).toContain('api');
  });
});

describe('slugifySubdomain', () => {
  it('normalises free text into a slug', () => {
    expect(slugifySubdomain('University of Lagos')).toBe('university-of-lagos');
    expect(slugifySubdomain('  Ahmadu   Bello!! ')).toBe('ahmadu-bello');
  });
});
