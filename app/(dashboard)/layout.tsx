import type { Metadata } from 'next';
import { AppShell, AppShellUser } from '@/components/layout/AppShell';
import { requireUser } from '@/lib/auth/guards';
import { redirect } from 'next/navigation';
import { toDisplayName } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { getTenantVocabulary } from '@/lib/ui/tenant-vocabulary';
import { getTenantMode } from '@/lib/tenant/mode';

// Everything under the shell is signed-in, school-private data. Nothing here
// should ever reach a search index, whatever a stray public link says.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();

  // A profile alone is not access. Someone signed in with no standing at this
  // school has no role to render a shell around; the middleware turns them away
  // first, and this keeps the layout from depending on that silently.
  if (!session.role) redirect('/unauthorized');

  const supabase = await createClient();

  let university: AppShellUser['university'] = null;
  if (session.universityId) {
    const { data } = await supabase
      .from('universities')
      .select('id, name, logo_url')
      .eq('id', session.universityId)
      .maybeSingle();

    if (data) {
      university = {
        id: data.id,
        name: data.name,
        logoUrl: data.logo_url,
      };
    }
  }

  const vocabulary = await getTenantVocabulary(supabase as any, session.universityId);
  // Decides which menu this organisation gets, not merely what it is called.
  const mode = await getTenantMode(supabase as any, session.universityId);

  const { count: unreadNotifications } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', session.user.id)
    .eq('is_read', false);

  const user: AppShellUser = {
    id: session.user.id,
    email: session.user.email,
    name: toDisplayName(session.profile.first_name, session.profile.last_name, session.user.email),
    role: session.role,
    avatarUrl: session.profile.avatar_url,
    unreadNotifications: unreadNotifications ?? 0,
    vocabulary,
    mode,
    university,
  };

  return <AppShell user={user}>{children}</AppShell>;
}
