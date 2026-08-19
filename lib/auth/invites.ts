import { createAdminClient } from '@/lib/supabase/admin';
import { AuthRole } from '@/types/auth';
import { env } from '@/lib/env';
import type { SupabaseLike } from './membership';
import { addExistingAccountToOrganisation, type InviteResult } from './organisation-invite';

export { addExistingAccountToOrganisation } from './organisation-invite';
export type { InviteResult } from './organisation-invite';

export interface UserInvitePayload {
  email: string;
  role: AuthRole;
  universityId?: string | null;
  firstName?: string;
  lastName?: string;
  /** Origin the invite link should land on, e.g. https://unilag.sulva.com. */
  baseUrl?: string;
  /** Shown in the email when the address already has an account. */
  organisationName?: string;
}

/**
 * Sends a secure invite via the Supabase Service Role client.
 * This guarantees role assignment and prevents client-side tampering.
 */
export async function sendUserInvite(payload: UserInvitePayload): Promise<InviteResult> {
  const adminClient = createAdminClient();
  const appUrl = payload.baseUrl || env.NEXT_PUBLIC_APP_URL;
  const normalizedUniversityId = payload.role === 'super_admin' ? null : payload.universityId;

  const { data: existing } = await adminClient
    .from('profiles')
    .select('id, first_name')
    .eq('email', payload.email)
    .maybeSingle();

  let result: InviteResult;

  if (existing && normalizedUniversityId) {
    result = await addExistingAccountToOrganisation(adminClient as unknown as SupabaseLike, {
      userId: existing.id,
      email: payload.email,
      firstName: payload.firstName || existing.first_name || undefined,
      universityId: normalizedUniversityId,
      role: payload.role,
      organisationName: payload.organisationName || 'your new organisation',
      baseUrl: appUrl,
    });
  } else {
    // Issue invite with raw metadata overriding the defaults
    const { data: { user }, error: authError } = await adminClient.auth.admin.inviteUserByEmail(payload.email, {
      data: {
        role: payload.role,
        university_id: normalizedUniversityId,
        first_name: payload.firstName,
        last_name: payload.lastName,
      },
      redirectTo: `${appUrl}/auth/callback?next=/onboarding/profile`,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    result = { userId: user?.id ?? null, added: 'invited' };
  }

  // Record audit log event strictly serverside
  await adminClient.from('audit_logs').insert({
    university_id: normalizedUniversityId,
    user_id: result.userId,
    action: 'USER_INVITED',
    entity_type: 'auth_users',
    metadata: { email: payload.email, role: payload.role, method: result.added },
  });

  return result;
}
