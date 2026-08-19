import { describe, expect, it } from 'vitest';
import { buildSession } from '@/lib/auth/session-build';
import { createSupabaseStub } from './helpers/supabase-stub';

const ADA = 'user-ada';
const SCHOOL = 'uni-school';

const profile = {
  id: ADA,
  first_name: 'Ada',
  last_name: 'Lovelace',
  avatar_url: null,
  email: 'ada@example.com',
};

describe('buildSession', () => {
  it('reports the role held at the organisation being visited', async () => {
    const stub = createSupabaseStub({
      profiles: [profile],
      memberships: [
        {
          user_id: ADA,
          university_id: SCHOOL,
          role: 'lecturer',
          student_id: null,
          department_id: null,
          deleted_at: null,
        },
        {
          user_id: ADA,
          university_id: 'uni-firm',
          role: 'student',
          student_id: null,
          department_id: null,
          deleted_at: null,
        },
      ],
      platform_admins: [],
    });

    const session = await buildSession(stub.client, { id: ADA, email: 'ada@example.com' }, SCHOOL);

    expect(session.role).toBe('lecturer');
    expect(session.membership?.universityId).toBe(SCHOOL);
    expect(session.isPlatformAdmin).toBe(false);
  });

  it('has no role at an organisation the person does not belong to', async () => {
    const stub = createSupabaseStub({
      profiles: [profile],
      memberships: [],
      platform_admins: [],
    });

    const session = await buildSession(stub.client, { id: ADA, email: 'ada@example.com' }, SCHOOL);

    expect(session.role).toBeNull();
    expect(session.membership).toBeNull();
    expect(session.profile?.id).toBe(ADA);
  });

  it('gives a platform admin a role on the root domain, where there is no tenant', async () => {
    const stub = createSupabaseStub({
      profiles: [{ ...profile, id: 'user-root' }],
      memberships: [],
      platform_admins: [{ user_id: 'user-root' }],
    });

    const session = await buildSession(
      stub.client,
      { id: 'user-root', email: 'root@sulva.com' },
      null,
    );

    expect(session.role).toBe('super_admin');
    expect(session.isPlatformAdmin).toBe(true);
  });

  it('returns an empty session when nobody is signed in', async () => {
    const stub = createSupabaseStub({ profiles: [], memberships: [], platform_admins: [] });

    const session = await buildSession(stub.client, null, SCHOOL);

    expect(session).toEqual({
      user: null,
      profile: null,
      membership: null,
      isPlatformAdmin: false,
      role: null,
    });
  });
});
