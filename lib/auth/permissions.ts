import { AuthRole } from '@/types/auth';

export const roleHierarchy: Record<AuthRole, number> = {
  student: 1,
  lecturer: 2,
  department_admin: 3,
  admin: 4,
  super_admin: 5,
};

export function hasRequiredRole(userRole: AuthRole, requiredRole: AuthRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function isUniversityMember(userUniversityId: string | null, targetUniversityId: string | null): boolean {
  if (!userUniversityId || !targetUniversityId) return false;
  return userUniversityId === targetUniversityId;
}
