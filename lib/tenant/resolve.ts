import { createAdminClient } from '@/lib/supabase/admin';

export interface TenantRecord {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  logo_url: string | null;
}

export type TenantLookup = { ok: true; tenant: TenantRecord | null } | { ok: false };

const TTL_MS = 60_000;

// Middleware runs per request on a warm serverless instance, so a small
// in-process cache removes a database round trip from nearly every page view
// while still picking up status changes within a minute.
const cache = new Map<string, { value: TenantRecord | null; expiresAt: number }>();

export function clearTenantCache(): void {
  cache.clear();
}

export async function resolveTenant(subdomain: string): Promise<TenantLookup> {
  const cached = cache.get(subdomain);
  if (cached && cached.expiresAt > Date.now()) {
    return { ok: true, tenant: cached.value };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('universities')
      .select('id,name,subdomain,status,logo_url')
      .eq('subdomain', subdomain)
      .maybeSingle();

    if (error) {
      console.error('Tenant lookup failed:', error);
      return { ok: false };
    }

    const tenant = (data as TenantRecord | null) ?? null;
    cache.set(subdomain, { value: tenant, expiresAt: Date.now() + TTL_MS });
    return { ok: true, tenant };
  } catch (error) {
    console.error('Tenant lookup threw:', error);
    return { ok: false };
  }
}
