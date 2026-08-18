'use server'

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from '@/lib/validation/auth';
import { getRoleRedirectPath } from '@/lib/auth/redirects';
import { normalizeRoleParam } from '@/lib/auth/roles';
import { getTenantContext } from '@/lib/tenant/context';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getAuthErrorMessage } from '@/utils/auth-errors';

export async function loginAction(formData: FormData) {
  try {
    const parsed = loginSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      return { error: getAuthErrorMessage(error) };
    }

    let profile: { role: string | null; university_id: string | null } | null = null;
    let profileError: unknown = null;

    try {
      // Fetch with the server-only admin client so first-login navigation does not
      // depend on RLS seeing a just-issued auth cookie in the same server action.
      const adminClient = createAdminClient();
      const result = await adminClient
        .from('profiles')
        .select('role, university_id')
        .eq('id', data.user.id)
        .maybeSingle();
      profile = result.data;
      profileError = result.error;
    } catch (error) {
      profileError = error;
    }

    if (profileError) {
      console.error('Admin profile fetch during login failed:', profileError);
      const fallback = await supabase
        .from('profiles')
        .select('role, university_id')
        .eq('id', data.user.id)
        .maybeSingle();
      profile = fallback.data;
      profileError = fallback.error;
    }

    const role = normalizeRoleParam(profile?.role) || normalizeRoleParam(data.user.user_metadata?.role);

    if (profileError && !role) {
      console.error('Error fetching user profile during login:', profileError);
      return { error: getAuthErrorMessage(profileError) };
    }

    // A school host only accepts accounts belonging to that school. The platform
    // domain only accepts the platform operator.
    const tenant = await getTenantContext();
    if (role !== 'super_admin') {
      if (tenant && profile && profile.university_id !== tenant.universityId) {
        await supabase.auth.signOut();
        return { error: 'This account belongs to a different school.' };
      }
      if (!tenant) {
        await supabase.auth.signOut();
        return { error: 'Sign in from your school web address instead of the platform site.' };
      }
    }

    if (!role) {
      return { success: true, redirectTo: '/onboarding/profile' };
    }

    return { success: true, redirectTo: getRoleRedirectPath(role) };
  } catch (error) {
    console.error('Unexpected login action error:', error);
    return { error: getAuthErrorMessage(error) };
  }
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  return redirect('/login');
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  
  // Use origin from request or fallback to env var
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
  });

  if (error) return { error: error.message };
  
  return { success: true, message: 'Password reset instructions sent to your email.' };
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password
  });

  if (error) return { error: error.message };
  
  return { success: true, redirectTo: '/login?message=Password%20updated%20successfully' };
}
