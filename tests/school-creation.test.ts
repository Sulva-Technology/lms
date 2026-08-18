import { describe, expect, it } from 'vitest';
import { tenantOrigin } from '@/lib/tenant/url';

describe('tenantOrigin', () => {
  it('uses http for local development hosts', () => {
    expect(tenantOrigin('unilag', 'localhost:3000')).toBe('http://unilag.localhost:3000');
  });

  it('uses https for real domains', () => {
    expect(tenantOrigin('unilag', 'sulva.com')).toBe('https://unilag.sulva.com');
  });
});
