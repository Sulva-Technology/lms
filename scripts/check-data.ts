import { adminClient } from './lib/clients';

const admin = adminClient();

async function check() {
  console.log("Checking auth users...");
  const { data: { users }, error } = await admin.auth.admin.listUsers();
  
  if (error) {
    console.error("Error listing users:", error.message);
    return;
  }

  console.log(`Found ${users.length} users.`);
  for (const user of users) {
    console.log(`- ${user.email} (${user.id})`);
    console.log(`  Identities: ${user.identities?.length || 0}`);
    console.log(`  Metadata: ${JSON.stringify(user.user_metadata)}`);
  }

  console.log("\nChecking profiles...");
  const { data: profiles, error: profileError } = await admin
    .from('profiles')
    .select('*');

  if (profileError) {
    console.error("Error fetching profiles:", profileError.message);
  } else {
    console.log(`Found ${profiles.length} profiles.`);
    for (const p of profiles) {
      console.log(`- ${p.email} (${p.id}) Role: ${p.role}`);
    }
  }
}

check();
