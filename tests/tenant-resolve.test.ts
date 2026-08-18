import { beforeEach, describe, expect, it, vi } from 'vitest';

const maybeSingle = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));

const loadModule = async () => {
  const mod = await import('@/lib/tenant/resolve');
  mod.clearTenantCache();
  return mod;
};

describe('resolveTenant', () => {
  beforeEach(() => {
    maybeSingle.mockReset();
    vi.resetModules();
  });

  it('returns the tenant row for a known subdomain', async () => {
    maybeSingle.mockResolvedValue({
      data: { id: 'uni-1', name: 'Unilag', subdomain: 'unilag', status: 'active', logo_url: null },
      error: null,
    });
    const { resolveTenant } = await loadModule();
    const result = await resolveTenant('unilag');
    expect(result).toEqual({ ok: true, tenant: expect.objectContaining({ id: 'uni-1' }) });
  });

  it('caches repeat lookups within the TTL', async () => {
    maybeSingle.mockResolvedValue({
      data: { id: 'uni-1', name: 'Unilag', subdomain: 'unilag', status: 'active', logo_url: null },
      error: null,
    });
    const { resolveTenant } = await loadModule();
    await resolveTenant('unilag');
    await resolveTenant('unilag');
    expect(maybeSingle).toHaveBeenCalledTimes(1);
  });

  it('reports a missing school as ok with a null tenant', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const { resolveTenant } = await loadModule();
    expect(await resolveTenant('nope')).toEqual({ ok: true, tenant: null });
  });

  it('reports a lookup failure distinctly from a missing school', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'connection reset' } });
    const { resolveTenant } = await loadModule();
    expect(await resolveTenant('unilag')).toEqual({ ok: false });
  });
});
