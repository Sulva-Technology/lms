import type { AuthRole } from '@/types/auth';
import { addMembership, type SupabaseLike } from './membership';
import { isEmailConfigured, sendEmail } from '@/lib/email/send';
import { renderOrganisationAddedEmail } from '@/lib/email/templates';

export interface InviteResult {
  userId: string | null;
  added: 'invited' | 'membership';
}

/**
 * Adds an account that already exists to another organisation.
 *
 * inviteUserByEmail refuses a registered address, and re-inviting would be
 * wrong anyway: the person has a password and an identity already, and only
 * their standing at this organisation is new. So this writes the membership
 * and tells them, rather than sending them through onboarding a second time.
 *
 * Kept apart from invites.ts, which resolves the service-role client and so
 * cannot be loaded without the server environment.
 */
export async function addExistingAccountToOrganisation(
  client: SupabaseLike,
  input: {
    userId: string;
    email: string;
    firstName?: string;
    universityId: string;
    role: AuthRole;
    organisationName: string;
    baseUrl: string;
  },
): Promise<InviteResult> {
  const { created } = await addMembership(client, {
    userId: input.userId,
    universityId: input.universityId,
    role: input.role,
  });

  // Someone who was already a member gets no second announcement.
  if (created && isEmailConfigured()) {
    const body = renderOrganisationAddedEmail({
      name: input.firstName || 'there',
      organisationName: input.organisationName,
      url: `${input.baseUrl}/login`,
    });
    await sendEmail({ to: input.email, ...body });
  }

  return { userId: input.userId, added: 'membership' };
}
