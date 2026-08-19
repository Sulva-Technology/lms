import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Whether this account already has a password.
 *
 * An invited account has none until onboarding sets one, and it signs in with
 * a one-time link, which Supabase records in the token's `amr` as `otp`. Once
 * a password exists the person signs in with `password`. Onboarding has to
 * know the difference: Supabase rejects setting a password identical to the
 * current one, so asking again would hand a working account a dead end.
 */
export async function accountHasPassword(supabase: SupabaseClient): Promise<boolean> {
  const { data } = await supabase.auth.getClaims();
  const amr = data?.claims?.amr;

  if (!Array.isArray(amr)) return false;

  return amr.some((entry) => (entry as { method?: string } | null)?.method === 'password');
}
