import type { AuthRole } from '@/types/auth';
import { effectiveRole, getMembership, isPlatformAdmin, type SupabaseLike } from './membership';

export interface Access {
  /** Whether onboarding has run for this account at all. */
  hasProfile: boolean;
  /** The role held at the host organisation; null means no access here. */
  role: AuthRole | null;
  isPlatformAdmin: boolean;
}

/**
 * What an authenticated account may do on one host.
 *
 * Kept out of the middleware itself so it can be tested without a request, and
 * so the middleware reads as routing rather than as authorisation.
 */
export async function resolveAccess(
  client: SupabaseLike,
  userId: string,
  tenantId: string | null,
): Promise<Access> {
  const { data: profile, error } = await client
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Middleware profile fetch error:', error);
  }

  const [membership, platformAdmin] = await Promise.all([
    tenantId ? getMembership(client, userId, tenantId) : Promise.resolve(null),
    isPlatformAdmin(client, userId),
  ]);

  return {
    hasProfile: Boolean(profile),
    role: effectiveRole(membership, platformAdmin),
    isPlatformAdmin: platformAdmin,
  };
}
