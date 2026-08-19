'use server'

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { onboardingSchema } from '@/lib/validation/auth';
import { getRoleRedirectPath } from '@/lib/auth/redirects';
import { AuthRole } from '@/types/auth';
import { normalizeRoleParam } from '@/lib/auth/roles';
import { accountHasPassword } from '@/lib/auth/password-status';

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

  const redirectTo = getRoleRedirectPath(finalRole);

  // Create the profile using service role to bypass RLS initially during creation
  const { data: profile, error } = await adminClient
    .from('profiles')
    .insert({
      id: user.id,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      role: finalRole,
      university_id: finalRole === 'super_admin' ? null : finalUniversityId,
      student_id: finalRole === 'student' ? parsed.data.studentId || null : null,
      email: user.email,
      avatar_url: parsed.data.avatarUrl || null,
    })
    .select()
    .single();

  if (error) {
    // If error code indicates a conflict, it means profile already exists.
    if (error.code === '23505') {
      return { success: true, redirectTo };
    }
    console.error('Profile creation error:', error);
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

  return { success: true, redirectTo: getRoleRedirectPath(profile.role as AuthRole) };
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
