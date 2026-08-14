// Reads credentials through the shared loader so `.env` / `.env.local` work the
// same way here as they do for the app.
import { adminClient } from './lib/clients';

const admin = adminClient();

const users = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'superadmin@example.com',
    password: 'VuiDemo123!',
    role: 'super_admin',
    university_id: null,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'admin@example.com',
    password: 'VuiDemo123!',
    role: 'admin',
    university_id: '00000000-0000-0000-0000-000000000001',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'lecturer@example.com',
    password: 'VuiDemo123!',
    role: 'lecturer',
    university_id: '00000000-0000-0000-0000-000000000001',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    email: 'student@example.com',
    password: 'VuiDemo123!',
    role: 'student',
    university_id: '00000000-0000-0000-0000-000000000001',
  },
];

async function main() {
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw error;

  for (const user of users) {
    const exists = data.users.some((candidate) => candidate.email === user.email);
    if (exists) {
      console.log(`Demo auth user exists: ${user.email}`);
      continue;
    }

    const { error: createError } = await admin.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        role: user.role,
        university_id: user.university_id,
      },
    } as any);

    if (createError) throw createError;
    console.log(`Created demo auth user: ${user.email}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
