// Creates or promotes the platform's first super admin.
//
// The password is read from the environment and never written to disk or to
// this file: a credential committed to a repository is a credential leaked, and
// this project has already had to purge one out of its history.
//
//   SUPER_ADMIN_EMAIL=you@example.com SUPER_ADMIN_PASSWORD='...' npm run db:seed:superadmin
//
// Safe to run twice. An existing account is promoted rather than duplicated,
// and its password is only reset when RESET_PASSWORD=true is passed.
import { adminClient } from './lib/clients';

const admin = adminClient();

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}.`);
    console.error("Pass it on the command line so it never lands in a file:");
    console.error("  SUPER_ADMIN_EMAIL=you@example.com SUPER_ADMIN_PASSWORD='...' npm run db:seed:superadmin");
    process.exit(1);
  }
  return value;
};

async function findUserByEmail(email: string) {
  // listUsers is paginated; a platform can easily outgrow one page.
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function main() {
  const email = required('SUPER_ADMIN_EMAIL').trim().toLowerCase();
  const password = required('SUPER_ADMIN_PASSWORD');
  const firstName = process.env.SUPER_ADMIN_FIRST_NAME?.trim() || 'Platform';
  const lastName = process.env.SUPER_ADMIN_LAST_NAME?.trim() || 'Owner';
  const resetPassword = process.env.RESET_PASSWORD === 'true';

  if (password.length < 10) {
    console.error('Refusing a password shorter than 10 characters for a platform owner account.');
    process.exit(1);
  }

  const existing = await findUserByEmail(email);
  let userId: string;

  if (existing) {
    userId = existing.id;
    console.log(`Auth user already exists: ${email}`);

    const { error } = await admin.auth.admin.updateUserById(userId, {
      ...(resetPassword ? { password } : {}),
      email_confirm: true,
      user_metadata: { ...existing.user_metadata, role: 'super_admin', university_id: null },
    });
    if (error) throw error;
    console.log(resetPassword ? 'Password reset and metadata updated.' : 'Metadata updated (password left as it was).');
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'super_admin', university_id: null, first_name: firstName, last_name: lastName },
    });
    if (error) throw error;
    userId = data.user!.id;
    console.log(`Created auth user: ${email}`);
  }

  // No trigger mirrors auth.users into profiles, and the app reads the role
  // from profiles, so the row has to be written here or the account signs in
  // with no role at all.
  const { error: profileError } = await admin
    .from('profiles')
    .upsert(
      {
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        role: 'super_admin',
        // Platform administration is not scoped to any one tenant.
        university_id: null,
      },
      { onConflict: 'id' },
    );

  if (profileError) throw profileError;

  const { error: auditError } = await admin.from('audit_logs').insert({
    university_id: null,
    user_id: userId,
    action: 'SUPER_ADMIN_SEEDED',
    entity_type: 'profiles',
    entity_id: userId,
    metadata: { email },
  });
  if (auditError) console.warn(`Audit log entry failed: ${auditError.message}`);

  console.log(`\nSuper admin ready: ${email}`);
  console.log('Sign in at the root domain, then open /superadmin.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
