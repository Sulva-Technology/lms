import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/onboarding/profile';
  }

  return value;
}

/**
 * Auth landing route.
 *
 * Supabase sends users here two different ways and both have to work:
 *
 * - `?code=` for the PKCE flow, used by OAuth and by password reset when the
 *   client initiated the request.
 * - `?token_hash=&type=` for email links (invite, magic link, signup
 *   confirmation, recovery). Handling only `code` sent every invited user to
 *   `/login?error=auth_callback_failed`.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null;
  const next = safeNextPath(requestUrl.searchParams.get('next'));

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', requestUrl.origin));
}
