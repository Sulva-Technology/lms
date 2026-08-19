import type { AuthRole } from '@/types/auth';
import { getRoleRedirectPath } from './redirects';
import { addMembership, type SupabaseLike } from './membership';

export interface OnboardingInput {
  userId: string;
  email: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  studentId: string | null;
  role: AuthRole;
  universityId: string | null;
}

/**
 * Writes what onboarding produces: one identity, and one standing at one
 * organisation.
 *
 * The identity is shared across every organisation the person joins, so a
 * second invite adds a membership and leaves the profile as it was. That is
 * why the profile is upserted rather than inserted: arriving here with an
 * account that already exists is the normal second-organisation path, not a
 * conflict to report.
 */
export async function completeOnboardingProfile(
  client: SupabaseLike,
  input: OnboardingInput,
): Promise<{ redirectTo: string }> {
  const { error: profileError } = await client.from('profiles').upsert(
    {
      id: input.userId,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      avatar_url: input.avatarUrl,
    },
    { onConflict: 'id' },
  );

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (input.role === 'super_admin') {
    const { error } = await client
      .from('platform_admins')
      .upsert({ user_id: input.userId }, { onConflict: 'user_id' });
    if (error) throw new Error(error.message);
    return { redirectTo: getRoleRedirectPath('super_admin') };
  }

  if (!input.universityId) {
    throw new Error(
      'This account is missing university assignment metadata. Ask an administrator to resend the invite.',
    );
  }

  await addMembership(client, {
    userId: input.userId,
    universityId: input.universityId,
    role: input.role,
    studentId: input.role === 'student' ? input.studentId : null,
  });

  return { redirectTo: getRoleRedirectPath(input.role) };
}
