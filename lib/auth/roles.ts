import { AuthRole } from '@/types/auth';

export const roleLabels: Record<AuthRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  department_admin: 'Department Admin',
  lecturer: 'Lecturer',
  student: 'Student',
};

export function getRoleRedirectPath(role?: AuthRole | null): string {
  switch (role) {
    case 'super_admin':
      return '/superadmin';
    case 'admin':
    case 'department_admin':
      return '/admin';
    case 'lecturer':
      return '/lecturer';
    case 'student':
      return '/student';
    default:
      return '/login';
  }
}

export function getRequiredRoleForPath(pathname: string): AuthRole | null {
  if (pathname === '/superadmin' || pathname.startsWith('/superadmin/')) return 'super_admin';
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'admin';
  if (pathname === '/lecturer' || pathname.startsWith('/lecturer/')) return 'lecturer';
  if (pathname === '/student' || pathname.startsWith('/student/')) return 'student';
  return null;
}

export function canAccessRolePath(userRole: AuthRole, requiredRole: AuthRole): boolean {
  if (requiredRole === 'admin') {
    return userRole === 'admin' || userRole === 'department_admin' || userRole === 'super_admin';
  }

  return userRole === requiredRole || userRole === 'super_admin';
}

export function normalizeRoleParam(value: unknown): AuthRole | null {
  if (
    value === 'super_admin' ||
    value === 'admin' ||
    value === 'department_admin' ||
    value === 'lecturer' ||
    value === 'student'
  ) {
    return value;
  }

  return null;
}

export function toDisplayName(firstName?: string | null, lastName?: string | null, fallback = 'VUI User') {
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  return fullName || fallback;
}
