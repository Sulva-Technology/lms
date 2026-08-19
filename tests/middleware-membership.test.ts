import { describe, expect, it } from 'vitest';
import { createSupabaseStub } from './helpers/supabase-stub';
import { resolveAccess } from '@/lib/auth/membership-access';

const ADA = 'user-ada';
const SCHOOL = 'uni-school';
const FIRM = 'uni-firm';

const stubWith = (memberships: any[], platformAdmins: any[] = []) =>
  createSupabaseStub({
    profiles: [{ id: ADA, first_name: 'Ada', last_name: 'Lovelace' }],
    memberships,
    platform_admins: platformAdmins,
  });

describe('resolveAccess', () => {
  it('admits a member of the host organisation with the role they hold there', async () => {
    const stub = stubWith([
      {
        user_id: ADA,
        university_id: SCHOOL,
        role: 'admin',
        student_id: null,
        department_id: null,
        deleted_at: null,
      },
    ]);

    expect(await resolveAccess(stub.client, ADA, SCHOOL)).toEqual({
      hasProfile: true,
      role: 'admin',
      isPlatformAdmin: false,
    });
  });

  it('refuses a member of a different organisation', async () => {
    const stub = stubWith([
      {
        user_id: ADA,
        university_id: FIRM,
        role: 'admin',
        student_id: null,
        department_id: null,
        deleted_at: null,
      },
    ]);

    expect((await resolveAccess(stub.client, ADA, SCHOOL)).role).toBeNull();
  });

  it('refuses a membership that has been deactivated at this organisation', async () => {
    const stub = stubWith([
      {
        user_id: ADA,
        university_id: SCHOOL,
        role: 'admin',
        student_id: null,
        department_id: null,
        deleted_at: '2026-08-01T00:00:00Z',
      },
    ]);

    expect((await resolveAccess(stub.client, ADA, SCHOOL)).role).toBeNull();
  });

  it('admits a platform admin to any host', async () => {
    const stub = stubWith([], [{ user_id: ADA }]);

    expect(await resolveAccess(stub.client, ADA, SCHOOL)).toEqual({
      hasProfile: true,
      role: 'super_admin',
      isPlatformAdmin: true,
    });
  });

  it('reports a missing profile so the caller can send them to onboarding', async () => {
    const stub = createSupabaseStub({ profiles: [], memberships: [], platform_admins: [] });

    expect(await resolveAccess(stub.client, ADA, SCHOOL)).toEqual({
      hasProfile: false,
      role: null,
      isPlatformAdmin: false,
    });
  });
});
