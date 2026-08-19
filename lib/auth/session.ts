import { createClient } from '../supabase/server';
import { createAdminClient } from '../supabase/admin';
import { getTenantContext } from '../tenant/context';
import { buildSession, EMPTY_SESSION } from './session-build';
import type { SupabaseLike } from './membership';
import { SessionData } from '@/types/auth';

export { buildSession } from './session-build';

/**
 * The signed-in person, and their standing at the organisation whose host this
 * request arrived on. Someone may hold a different role at another
 * organisation; that one is not this request's business.
 */
export async function getSession(): Promise<SessionData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return EMPTY_SESSION;

  const tenant = await getTenantContext();

  return buildSession(
    createAdminClient() as unknown as SupabaseLike,
    { id: user.id, email: user.email || '' },
    tenant?.universityId ?? null,
  );
}

export async function clearSession() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
