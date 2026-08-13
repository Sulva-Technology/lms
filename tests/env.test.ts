import { describe, expect, it } from 'vitest';
import { resolveAppUrl } from '@/lib/env-url';

describe('environment URL resolution', () => {
  it('prefers explicit app URL over Vercel URL', () => {
    expect(resolveAppUrl('http://localhost:3000', 'preview.vercel.app')).toBe('http://localhost:3000');
  });

  it('uses Vercel URL only when explicit app URL is missing', () => {
    expect(resolveAppUrl(undefined, 'preview.vercel.app')).toBe('https://preview.vercel.app');
  });
});
