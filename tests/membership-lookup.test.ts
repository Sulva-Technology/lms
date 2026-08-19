import { describe, expect, it } from 'vitest';
import { createSupabaseStub } from './helpers/supabase-stub';
import {
  addMembership,
  effectiveRole,
  getMembership,
  isPlatformAdmin,
} from '@/lib/auth/membership';

const ADA = 'user-ada';
const SCHOOL = 'uni-school';
const FIRM = 'uni-firm';

const seed = () =>
  createSupabaseStub({
    memberships: [
      {
        user_id: ADA,
        university_id: SCHOOL,
        role: 'student',
        student_id: 'SULVA/2026/0001',
        department_id: null,
        deleted_at: null,
      },
      {
        user_id: ADA,
        university_id: FIRM,
        role: 'lecturer',
        student_id: null,
        department_id: 'dept-1',
        deleted_at: null,
      },
    ],
    platform_admins: [{ user_id: 'user-root' }],
  });

describe('getMembership', () => {
  it('returns the role the person holds at that organisation, not another', async () => {
    const stub = seed();

    expect(await getMembership(stub.client, ADA, SCHOOL)).toEqual({
      userId: ADA,
      universityId: SCHOOL,
      role: 'student',
      studentId: 'SULVA/2026/0001',
      departmentId: null,
    });

    expect((await getMembership(stub.client, ADA, FIRM))?.role).toBe('lecturer');
  });

  it('returns null for an organisation the person does not belong to', async () => {
    const stub = seed();
    expect(await getMembership(stub.client, ADA, 'uni-other')).toBeNull();
  });

  it('treats a deactivated membership as no membership', async () => {
    const stub = createSupabaseStub({
      memberships: [
        {
          user_id: ADA,
          university_id: SCHOOL,
          role: 'student',
          student_id: null,
          department_id: null,
          deleted_at: '2026-08-01T00:00:00Z',
        },
      ],
    });

    expect(await getMembership(stub.client, ADA, SCHOOL)).toBeNull();
  });
});

describe('isPlatformAdmin', () => {
  it('is true only for an account in platform_admins', async () => {
    const stub = seed();
    expect(await isPlatformAdmin(stub.client, 'user-root')).toBe(true);
    expect(await isPlatformAdmin(stub.client, ADA)).toBe(false);
  });
});

describe('addMembership', () => {
  it('creates a membership for an account that already has one elsewhere', async () => {
    const stub = seed();

    const result = await addMembership(stub.client, {
      userId: ADA,
      universityId: 'uni-third',
      role: 'admin',
    });

    expect(result).toEqual({ created: true });
    expect(stub.inserted.memberships?.[0]).toMatchObject({
      user_id: ADA,
      university_id: 'uni-third',
      role: 'admin',
    });
  });

  it('reports an existing membership as not created, rather than as an error', async () => {
    const stub = seed();

    const result = await addMembership(stub.client, {
      userId: ADA,
      universityId: SCHOOL,
      role: 'student',
    });

    expect(result).toEqual({ created: false });
    expect(stub.inserted.memberships ?? []).toEqual([]);
  });
});

describe('effectiveRole', () => {
  it('prefers the membership at the organisation being visited', () => {
    const membership = {
      userId: ADA,
      universityId: SCHOOL,
      role: 'student' as const,
      studentId: null,
      departmentId: null,
    };

    expect(effectiveRole(membership, false)).toBe('student');
    expect(effectiveRole(membership, true)).toBe('student');
  });

  it('falls back to super_admin only when there is no membership here', () => {
    expect(effectiveRole(null, true)).toBe('super_admin');
    expect(effectiveRole(null, false)).toBeNull();
  });
});
