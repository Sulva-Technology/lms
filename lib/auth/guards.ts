import { getSession } from './session';
import { redirect } from 'next/navigation';
import { AuthRole } from '@/types/auth';
import { hasRequiredRole } from './permissions';

export async function requireUser() {
  const session = await getSession();
  if (!session.user || !session.profile) {
    redirect('/login');
  }
  return session as { user: NonNullable<typeof session.user>; profile: NonNullable<typeof session.profile> };
}

export async function requireRole(role: AuthRole) {
  const session = await requireUser();
  if (!hasRequiredRole(session.profile.role, role)) {
    // You could redirect to a 'not authorized' page, but usually we just send them to their dashboard
    const currentRole = session.profile.role;
    if (currentRole === 'super_admin') redirect('/superadmin');
    if (currentRole === 'admin') redirect('/admin');
    if (currentRole === 'lecturer') redirect('/lecturer');
    redirect('/student');
  }
  return session;
}

export async function requireUniversityAccess(targetUniversityId: string) {
  const session = await requireUser();
  if (session.profile.role === 'super_admin') {
    return session; // Super admin can access anywhere
  }
  
  if (session.profile.university_id !== targetUniversityId) {
    // Attempting to access resources from another university
    redirect('/unauthorized');
  }
  return session;
}

export async function getCurrentUserProfile() {
  const session = await getSession();
  return session.profile;
}

export async function getCurrentUserRole() {
  const session = await getSession();
  return session.profile?.role;
}
