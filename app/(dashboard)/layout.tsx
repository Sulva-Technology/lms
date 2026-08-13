import { AppShell, AppShellUser } from '@/components/layout/AppShell';
import { requireUser } from '@/lib/auth/guards';
import { toDisplayName } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  const supabase = await createClient();

  let university: AppShellUser['university'] = null;
  if (session.profile.university_id) {
    const { data } = await supabase
      .from('universities')
      .select('id, name, logo_url')
      .eq('id', session.profile.university_id)
      .maybeSingle();

    if (data) {
      university = {
        id: data.id,
        name: data.name,
        logoUrl: data.logo_url,
      };
    }
  }

  const { count: unreadNotifications } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', session.user.id)
    .eq('is_read', false);

  const user: AppShellUser = {
    id: session.user.id,
    email: session.user.email,
    name: toDisplayName(session.profile.first_name, session.profile.last_name, session.user.email),
    role: session.profile.role,
    avatarUrl: session.profile.avatar_url,
    unreadNotifications: unreadNotifications ?? 0,
    university,
  };

  return <AppShell user={user}>{children}</AppShell>;
}
