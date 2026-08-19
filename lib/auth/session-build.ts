import { effectiveRole, getMembership, isPlatformAdmin, type SupabaseLike } from './membership';
import type { SessionData } from '@/types/auth';

export const EMPTY_SESSION: SessionData = {
  user: null,
  profile: null,
  membership: null,
  isPlatformAdmin: false,
  role: null,
  universityId: null,
};

/**
 * Assembles a session from an already-authenticated user and the organisation
 * the request is for.
 *
 * Kept apart from session.ts, which imports the server client and so cannot be
 * loaded without a request. Here the tenant is an argument rather than ambient
 * state, which is also what makes "the role held at this organisation" a thing
 * that can be stated plainly.
 */
export async function buildSession(
  client: SupabaseLike,
  user: { id: string; email: string } | null,
  universityId: string | null,
): Promise<SessionData> {
  if (!user) return EMPTY_SESSION;

  const { data: profile, error } = await client
    .from('profiles')
    .select('id, first_name, last_name, avatar_url, email')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Session profile fetch error:', error);
  }

  const [membership, platformAdmin] = await Promise.all([
    universityId ? getMembership(client, user.id, universityId) : Promise.resolve(null),
    isPlatformAdmin(client, user.id),
  ]);

  return {
    user,
    profile: profile ?? null,
    membership,
    isPlatformAdmin: platformAdmin,
    role: effectiveRole(membership, platformAdmin),
    universityId: membership?.universityId ?? (platformAdmin ? universityId : null),
  };
}
