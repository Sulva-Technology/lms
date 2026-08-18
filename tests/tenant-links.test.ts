import { describe, expect, it } from 'vitest';
import { emailLinkOrigin, tenantOrigin } from '@/lib/tenant/url';

const ROOT = 'sulva.com';
const PLATFORM = 'https://sulva.com';

describe('emailLinkOrigin', () => {
  it('sends a school member back to their own school', () => {
    expect(emailLinkOrigin('unilag', ROOT, PLATFORM)).toBe('https://unilag.sulva.com');
  });

  it('falls back to the platform when the request has no tenant', () => {
    expect(emailLinkOrigin(null, ROOT, PLATFORM)).toBe(PLATFORM);
    expect(emailLinkOrigin(undefined, ROOT, PLATFORM)).toBe(PLATFORM);
    expect(emailLinkOrigin('', ROOT, PLATFORM)).toBe(PLATFORM);
  });

  it('stays on http for local development', () => {
    expect(emailLinkOrigin('unilag', 'localhost:3000', 'http://localhost:3000')).toBe(
      'http://unilag.localhost:3000',
    );
  });

  it('builds the host from the resolved subdomain, never from free text', () => {
    // The caller only ever passes a subdomain that middleware resolved against
    // the database, and the root domain comes from configuration — so the
    // origin cannot be pointed somewhere else by a request header.
    expect(tenantOrigin('unilag', ROOT)).toBe('https://unilag.sulva.com');
    expect(emailLinkOrigin('unilag', ROOT, PLATFORM).endsWith(`.${ROOT}`)).toBe(true);
  });
});
