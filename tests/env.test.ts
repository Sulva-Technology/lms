import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveAppUrl } from '@/lib/env-url';

describe('environment URL resolution', () => {
  it('prefers explicit app URL over Vercel URL', () => {
    expect(resolveAppUrl('http://localhost:3000', 'preview.vercel.app')).toBe('http://localhost:3000');
  });

  it('uses Vercel URL only when explicit app URL is missing', () => {
    expect(resolveAppUrl(undefined, 'preview.vercel.app')).toBe('https://preview.vercel.app');
  });
});

describe('root domain', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  const stubRequired = () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
  };

  it('falls back to the local dev host when unset', async () => {
    stubRequired();
    vi.stubEnv('NEXT_PUBLIC_ROOT_DOMAIN', '');
    vi.resetModules();
    const { env } = await import('@/lib/env');
    expect(env.NEXT_PUBLIC_ROOT_DOMAIN).toBe('localhost:3000');
  });

  it('falls back to the deployment host when only the app URL is set', async () => {
    stubRequired();
    vi.stubEnv('NEXT_PUBLIC_ROOT_DOMAIN', '');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://lms.example.com');
    vi.resetModules();
    const { env } = await import('@/lib/env');
    expect(env.NEXT_PUBLIC_ROOT_DOMAIN).toBe('lms.example.com');
  });

  it('uses the configured root domain without a protocol', async () => {
    stubRequired();
    vi.stubEnv('NEXT_PUBLIC_ROOT_DOMAIN', 'sulva.com');
    vi.resetModules();
    const { env } = await import('@/lib/env');
    expect(env.NEXT_PUBLIC_ROOT_DOMAIN).toBe('sulva.com');
    expect(env.NEXT_PUBLIC_ROOT_DOMAIN).not.toContain('://');
  });
});
