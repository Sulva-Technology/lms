import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://uzhqvkshtphytiopjqkb.supabase.co";
const serviceRoleKey = "REDACTED_ROTATED_CREDENTIAL";

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seed() {
  console.log("--- Starting Comprehensive Seed ---");

  // 1. Get the REAL University ID for vui.edu
  const { data: uni, error: uniFetchError } = await admin
    .from('universities')
    .select('id')
    .eq('domain', 'vui.edu')
    .single();

  if (uniFetchError || !uni) {
    console.error("Could not find university vui.edu. Please ensure it exists.");
    return;
  }

  const REAL_UNI_ID = uni.id;
  console.log(`Found University 'vui.edu' with ID: ${REAL_UNI_ID}`);

  const users = [
    {
      id: '99999999-9999-9999-9999-999999999999', // Changed to avoid collision with uni ID
      email: 'superadmin@example.com',
      password: 'VuiDemo123!',
      role: 'super_admin',
      firstName: 'Super',
      lastName: 'Admin',
      universityId: null,
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      email: 'admin@example.com',
      password: 'VuiDemo123!',
      role: 'admin',
      firstName: 'Univ',
      lastName: 'Admin',
      universityId: REAL_UNI_ID,
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      email: 'lecturer@example.com',
      password: 'VuiDemo123!',
      role: 'lecturer',
      firstName: 'John',
      lastName: 'Lecturer',
      universityId: REAL_UNI_ID,
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      email: 'student@example.com',
      password: 'VuiDemo123!',
      role: 'student',
      firstName: 'Jane',
      lastName: 'Student',
      universityId: REAL_UNI_ID,
    },
  ];

  // 2. Cleanup broken users
  console.log("Cleaning up existing demo users...");
  for (const user of users) {
    await admin.auth.admin.deleteUser(user.id);
    // Also delete any existing auth users with these emails just in case
    const { data: { users: existing } } = await admin.auth.admin.listUsers();
    const match = existing.find(u => u.email === user.email);
    if (match) {
      await admin.auth.admin.deleteUser(match.id);
    }
  }

  // 3. Create users correctly via Admin API
  console.log("Creating users via Admin API...");
  for (const user of users) {
    const { data: authUser, error: createError } = await admin.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        role: user.role,
        university_id: user.universityId,
      },
    } as any);

    if (createError) {
      console.error(`Failed to create auth user ${user.email}:`, createError.message);
      continue;
    }

    console.log(`Created auth user: ${user.email}`);

    // 4. Create Profile
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id: user.id,
        university_id: user.universityId,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        role: user.role,
      });

    if (profileError) {
      console.error(`Failed to create profile for ${user.email}:`, profileError.message);
    } else {
      console.log(`Created profile for: ${user.email}`);
    }
  }

  console.log("--- Seed Finished ---");
}

seed();
