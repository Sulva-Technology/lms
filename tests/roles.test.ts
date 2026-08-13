import { describe, expect, it } from 'vitest';
import { canAccessRolePath, getRequiredRoleForPath, getRoleRedirectPath } from '@/lib/auth/roles';

describe('role routing', () => {
  it('maps database roles to dashboard routes', () => {
    expect(getRoleRedirectPath('student')).toBe('/student');
    expect(getRoleRedirectPath('lecturer')).toBe('/lecturer');
    expect(getRoleRedirectPath('department_admin')).toBe('/admin');
    expect(getRoleRedirectPath('admin')).toBe('/admin');
    expect(getRoleRedirectPath('super_admin')).toBe('/superadmin');
  });

  it('detects protected role route prefixes', () => {
    expect(getRequiredRoleForPath('/student/courses')).toBe('student');
    expect(getRequiredRoleForPath('/admin/users')).toBe('admin');
    expect(getRequiredRoleForPath('/superadmin/settings')).toBe('super_admin');
    expect(getRequiredRoleForPath('/onboarding/profile')).toBeNull();
  });

  it('allows department admins into admin routes without granting superadmin routes', () => {
    expect(canAccessRolePath('department_admin', 'admin')).toBe(true);
    expect(canAccessRolePath('department_admin', 'super_admin')).toBe(false);
  });
});
