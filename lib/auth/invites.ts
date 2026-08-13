import { createAdminClient } from '@/lib/supabase/admin';
import { AuthRole } from '@/types/auth';
import { env } from '@/lib/env';

export interface UserInvitePayload {
  email: string;
  role: AuthRole;
  universityId?: string | null;
  firstName?: string;
  lastName?: string;
}

/**
 * Sends a secure invite via the Supabase Service Role client.
 * This guarantees role assignment and prevents client-side tampering.
 */
export async function sendUserInvite(payload: UserInvitePayload) {
  const adminClient = createAdminClient();
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const normalizedUniversityId = payload.role === 'super_admin' ? null : payload.universityId;

  // Issue invite with raw metadata overriding the defaults
  const { data: { user }, error: authError } = await adminClient.auth.admin.inviteUserByEmail(payload.email, {
    data: {
      role: payload.role,
      university_id: normalizedUniversityId,
      first_name: payload.firstName,
      last_name: payload.lastName,
    },
    redirectTo: `${appUrl}/auth/callback?next=/onboarding/profile`
  });

  if (authError) {
    throw new Error(authError.message);
  }

  // Record audit log event strictly serverside
  await adminClient.from('audit_logs').insert({
    university_id: normalizedUniversityId,
    user_id: user?.id || null,
    action: 'USER_INVITED',
    entity_type: 'auth_users',
    metadata: { email: payload.email, role: payload.role }
  });

  return user;
}
