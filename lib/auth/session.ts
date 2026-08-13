import { createClient } from '../supabase/server';
import { createAdminClient } from '../supabase/admin';
import { SessionData } from '@/types/auth';

export async function getSession(): Promise<SessionData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const adminClient = createAdminClient();
  const { data: profile, error } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Session profile fetch error:', error);
  }

  return {
    user: {
      id: user.id,
      email: user.email || '',
    },
    profile: profile ?? null,
  };
}

export async function clearSession() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
