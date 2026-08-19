import { describe, expect, it } from 'vitest';
import { createSupabaseStub } from './helpers/supabase-stub';
import { completeOnboardingProfile } from '@/lib/auth/onboarding-write';

const ADA = 'user-ada';
const SCHOOL = 'uni-school';

const input = {
  userId: ADA,
  email: 'ada@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  avatarUrl: null,
  studentId: 'SULVA/2026/0001',
  role: 'student' as const,
  universityId: SCHOOL,
};

describe('completeOnboardingProfile', () => {
  it('writes the identity to profiles and the standing to memberships', async () => {
    const stub = createSupabaseStub({ profiles: [], memberships: [], platform_admins: [] });

    const result = await completeOnboardingProfile(stub.client, input);

    expect(result.redirectTo).toBe('/student');
    expect(stub.inserted.profiles?.[0]).toMatchObject({ id: ADA, first_name: 'Ada' });
    expect(stub.inserted.profiles?.[0]).not.toHaveProperty('role');
    expect(stub.inserted.profiles?.[0]).not.toHaveProperty('university_id');
    expect(stub.inserted.memberships?.[0]).toMatchObject({
      user_id: ADA,
      university_id: SCHOOL,
      role: 'student',
      student_id: 'SULVA/2026/0001',
    });
  });

  it('adds a second organisation to an account that already has a profile', async () => {
    const stub = createSupabaseStub({
      profiles: [{ id: ADA, first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com' }],
      memberships: [
        {
          user_id: ADA,
          university_id: 'uni-firm',
          role: 'lecturer',
          student_id: null,
          department_id: null,
          deleted_at: null,
        },
      ],
      platform_admins: [],
    });

    await completeOnboardingProfile(stub.client, input);

    expect(stub.inserted.memberships?.[0]).toMatchObject({
      user_id: ADA,
      university_id: SCHOOL,
      role: 'student',
    });
  });

  it('treats an existing membership as success, not as an error', async () => {
    const stub = createSupabaseStub({
      profiles: [{ id: ADA, first_name: 'Ada', last_name: 'Lovelace' }],
      memberships: [
        {
          user_id: ADA,
          university_id: SCHOOL,
          role: 'student',
          student_id: null,
          department_id: null,
          deleted_at: null,
        },
      ],
      platform_admins: [],
    });

    const result = await completeOnboardingProfile(stub.client, input);

    expect(result.redirectTo).toBe('/student');
    expect(stub.inserted.memberships ?? []).toEqual([]);
  });

  it('records a platform administrator in platform_admins, never as a membership', async () => {
    const stub = createSupabaseStub({ profiles: [], memberships: [], platform_admins: [] });

    const result = await completeOnboardingProfile(stub.client, {
      ...input,
      role: 'super_admin',
      universityId: null,
      studentId: null,
    });

    expect(result.redirectTo).toBe('/superadmin');
    expect(stub.inserted.platform_admins?.[0]).toMatchObject({ user_id: ADA });
    expect(stub.inserted.memberships ?? []).toEqual([]);
  });

  it('refuses a tenant role with no organisation to attach it to', async () => {
    const stub = createSupabaseStub({ profiles: [], memberships: [], platform_admins: [] });

    await expect(
      completeOnboardingProfile(stub.client, { ...input, universityId: null }),
    ).rejects.toThrow(/university assignment metadata/);
  });
});
