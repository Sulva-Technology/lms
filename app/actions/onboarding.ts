'use server'

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { onboardingSchema } from '@/lib/validation/auth';
import { AuthRole } from '@/types/auth';
import { normalizeRoleParam } from '@/lib/auth/roles';
import { accountHasPassword } from '@/lib/auth/password-status';
import { completeOnboardingProfile } from '@/lib/auth/onboarding-write';
import type { SupabaseLike } from '@/lib/auth/membership';

export async function completeOnboardingAction(formData: FormData) {
  const parsed = onboardingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Retrieve securely assigned metadata via an invite. Client-submitted role or
  // university values are intentionally ignored in the invite-first flow.
  const finalRole = normalizeRoleParam(user.user_metadata?.role) as AuthRole | null;
  const finalUniversityId = user.user_metadata?.university_id as string | undefined;

  if (!finalRole) {
    return { error: 'This account is missing invite role metadata. Ask an administrator to resend the invite.' };
  }

  // Validate university assignment
  if (finalRole !== 'super_admin' && !finalUniversityId) {
    return { error: 'This account is missing university assignment metadata. Ask an administrator to resend the invite.' };
  }

  // An invited account has no password until now, so set it before the profile
  // exists — otherwise onboarding finishes and the person cannot sign back in.
  // Someone who already set one during recovery is only here for the profile.
  const password = parsed.data.password || null;

  if (password) {
    const { error: passwordError } = await supabase.auth.updateUser({ password });

    // Re-submitting the password already on the account is not a failure to
    // report; the account ends up in the state onboarding wanted either way.
    if (passwordError && (passwordError as { code?: string }).code !== 'same_password') {
      return { error: passwordError.message };
    }
  } else if (!(await accountHasPassword(supabase))) {
    return { error: 'Choose a password so you can sign in after this.' };
  }

  const adminClient = createAdminClient();

  // Service role, to write the profile and membership before any policy that
  // depends on them exists for this person.
  let redirectTo: string;
  try {
    ({ redirectTo } = await completeOnboardingProfile(adminClient as unknown as SupabaseLike, {
      userId: user.id,
      email: user.email ?? null,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      avatarUrl: parsed.data.avatarUrl || null,
      studentId: parsed.data.studentId || null,
      role: finalRole,
      universityId: finalRole === 'super_admin' ? null : finalUniversityId ?? null,
    }));
  } catch (thrown) {
    console.error('Profile creation error:', thrown);
    return { error: 'Failed to complete profile. Try again.' };
  }

  // Audit Log Entry
  await adminClient.from('audit_logs').insert({
    university_id: finalUniversityId || null,
    user_id: user.id,
    action: 'USER_ONBOARDED',
    entity_type: 'profiles',
    entity_id: user.id,
    metadata: { role: finalRole, method: 'invite' },
  });

  return { success: true, redirectTo };
}

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Use raw Supabase object to avoid passing massive string keys if users try to manipulate the form
  const updates: Record<string, any> = {};
  
  const firstName = formData.get('firstName')?.toString();
  if (firstName && firstName.trim().length > 0) updates['first_name'] = firstName.trim();
  
  const lastName = formData.get('lastName')?.toString();
  if (lastName && lastName.trim().length > 0) updates['last_name'] = lastName.trim();

  const avatarUrl = formData.get('avatarUrl')?.toString();
  if (avatarUrl) updates['avatar_url'] = avatarUrl;

  if (Object.keys(updates).length === 0) {
    return { error: 'No valid updates provided' };
  }

  // Process updates strictly under RLS - user can only update their own profile
  const { error } = await adminClient
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: 'Profile updated successfully' };
}
