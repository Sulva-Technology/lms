import { afterEach, describe, expect, it } from 'vitest';
import { __setEmailSenderForTests } from '@/lib/email/send';
import { renderOrganisationAddedEmail } from '@/lib/email/templates';
import { createSupabaseStub } from './helpers/supabase-stub';
import { addExistingAccountToOrganisation } from '@/lib/auth/organisation-invite';

afterEach(() => __setEmailSenderForTests(null));

describe('renderOrganisationAddedEmail', () => {
  it('names the organisation and links to its own address', () => {
    const body = renderOrganisationAddedEmail({
      name: 'Ada',
      organisationName: 'Sulva Institute',
      url: 'https://sulva-institute.sulva.com/login',
    });

    expect(body.subject).toContain('Sulva Institute');
    expect(body.html).toContain('https://sulva-institute.sulva.com/login');
    expect(body.text).toContain('Sulva Institute');
  });

  it('says the existing password still works, so nobody resets one they have', () => {
    const body = renderOrganisationAddedEmail({
      name: 'Ada',
      organisationName: 'Sulva Institute',
      url: 'https://sulva-institute.sulva.com/login',
    });

    expect(body.text.toLowerCase()).toContain('password you already use');
  });
});

describe('addExistingAccountToOrganisation', () => {
  it('creates the membership and reports it, without touching auth', async () => {
    const sent: any[] = [];
    __setEmailSenderForTests({
      async send(message) {
        sent.push(message);
      },
    });

    const stub = createSupabaseStub({
      profiles: [
        { id: 'user-ada', email: 'ada@example.com', first_name: 'Ada', last_name: 'Lovelace' },
      ],
      memberships: [],
      platform_admins: [],
    });

    const result = await addExistingAccountToOrganisation(stub.client, {
      userId: 'user-ada',
      email: 'ada@example.com',
      firstName: 'Ada',
      universityId: 'uni-school',
      role: 'lecturer',
      organisationName: 'Sulva Institute',
      baseUrl: 'https://sulva-institute.sulva.com',
    });

    expect(result).toEqual({ userId: 'user-ada', added: 'membership' });
    expect(stub.inserted.memberships?.[0]).toMatchObject({
      user_id: 'user-ada',
      university_id: 'uni-school',
      role: 'lecturer',
    });
    expect(sent[0].to).toBe('ada@example.com');
    expect(sent[0].subject).toContain('Sulva Institute');
  });

  it('is idempotent: adding an existing member sends nothing', async () => {
    const sent: any[] = [];
    __setEmailSenderForTests({
      async send(message) {
        sent.push(message);
      },
    });

    const stub = createSupabaseStub({
      profiles: [{ id: 'user-ada', email: 'ada@example.com' }],
      memberships: [
        {
          user_id: 'user-ada',
          university_id: 'uni-school',
          role: 'lecturer',
          student_id: null,
          department_id: null,
          deleted_at: null,
        },
      ],
      platform_admins: [],
    });

    await addExistingAccountToOrganisation(stub.client, {
      userId: 'user-ada',
      email: 'ada@example.com',
      firstName: 'Ada',
      universityId: 'uni-school',
      role: 'lecturer',
      organisationName: 'Sulva Institute',
      baseUrl: 'https://sulva-institute.sulva.com',
    });

    expect(sent).toEqual([]);
  });
});
