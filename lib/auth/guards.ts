import { getSession } from './session';
import { redirect } from 'next/navigation';
import { AuthRole, SessionData } from '@/types/auth';
import { hasRequiredRole } from './permissions';

export type ActiveSession = SessionData & {
  user: NonNullable<SessionData['user']>;
  profile: NonNullable<SessionData['profile']>;
};

export async function requireUser(): Promise<ActiveSession> {
  const session = await getSession();
  if (!session.user || !session.profile) {
    redirect('/login');
  }
  return session as ActiveSession;
}

export async function requireRole(role: AuthRole): Promise<ActiveSession> {
  const session = await requireUser();

  // No membership at this organisation means no role here, whatever the person
  // holds elsewhere.
  if (!session.role || !hasRequiredRole(session.role, role)) {
    if (session.role === 'super_admin') redirect('/superadmin');
    if (session.role === 'admin' || session.role === 'department_admin') redirect('/admin');
    if (session.role === 'lecturer') redirect('/lecturer');
    if (session.role === 'student') redirect('/student');
    redirect('/unauthorized');
  }

  return session;
}

export async function requireUniversityAccess(targetUniversityId: string): Promise<ActiveSession> {
  const session = await requireUser();
  if (session.isPlatformAdmin) return session;

  if (session.membership?.universityId !== targetUniversityId) {
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
  return session.role;
}
