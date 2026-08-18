import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSupabaseStub } from './helpers/supabase-stub';

const stubRef = { current: createSupabaseStub({}) };

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => stubRef.current.client,
}));

const seed = (overrides: Record<string, any[]> = {}) => {
  stubRef.current = createSupabaseStub({
    universities: [
      {
        id: 'uni-1',
        name: 'Sulvatech University',
        subdomain: 'sulvatech',
        logo_url: 'https://cdn.example.com/logo.png',
        domain: 'sulvatech.com',
        created_at: '2024-03-04T00:00:00.000Z',
      },
    ],
    university_settings: [{ university_id: 'uni-1', settings: { vocabulary: 'organization' } }],
    faculties: [
      { id: 'f-1', university_id: 'uni-1' },
      { id: 'f-2', university_id: 'uni-1' },
      { id: 'f-other', university_id: 'uni-2' },
    ],
    departments: [{ id: 'd-1', university_id: 'uni-1' }],
    programs: [
      { id: 'p-1', university_id: 'uni-1' },
      { id: 'p-2', university_id: 'uni-1' },
      { id: 'p-3', university_id: 'uni-1' },
    ],
    courses: [
      { id: 'c-1', university_id: 'uni-1', status: 'published' },
      { id: 'c-2', university_id: 'uni-1', status: 'draft' },
      { id: 'c-3', university_id: 'uni-2', status: 'published' },
    ],
    ...overrides,
  });
};

const loadModule = async () => {
  const mod = await import('@/lib/tenant/profile');
  mod.clearTenantProfileCache();
  return mod;
};

describe('getTenantProfile', () => {
  beforeEach(() => {
    vi.resetModules();
    seed();
  });

  it('returns the school identity and its headline counts', async () => {
    const { getTenantProfile } = await loadModule();
    const profile = await getTenantProfile('uni-1');

    expect(profile).toMatchObject({
      id: 'uni-1',
      name: 'Sulvatech University',
      subdomain: 'sulvatech',
      logoUrl: 'https://cdn.example.com/logo.png',
      domain: 'sulvatech.com',
      establishedYear: 2024,
      vocabulary: 'organization',
    });
    expect(profile?.stats).toEqual({ faculties: 2, departments: 1, programs: 3, courses: 1 });
  });

  it('counts only this school and only published courses', async () => {
    const { getTenantProfile } = await loadModule();
    const profile = await getTenantProfile('uni-1');

    // uni-2 rows and the draft course must not reach a public page.
    expect(profile?.stats.faculties).toBe(2);
    expect(profile?.stats.courses).toBe(1);
  });

  it('falls back to academic wording when the school has chosen none', async () => {
    seed({ university_settings: [] });
    const { getTenantProfile } = await loadModule();
    expect((await getTenantProfile('uni-1'))?.vocabulary).toBe('academic');
  });

  it('returns null for a school that does not exist', async () => {
    const { getTenantProfile } = await loadModule();
    expect(await getTenantProfile('uni-missing')).toBeNull();
  });

  it('caches repeat reads within the TTL', async () => {
    const { getTenantProfile } = await loadModule();
    await getTenantProfile('uni-1');
    const fromSpy = vi.spyOn(stubRef.current.client, 'from');
    await getTenantProfile('uni-1');
    expect(fromSpy).not.toHaveBeenCalled();
  });
});
