import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://uzhqvkshtphytiopjqkb.supabase.co";
const supabaseAnonKey = "REDACTED_ROTATED_CREDENTIAL";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const email = 'superadmin@example.com';
  const password = 'VuiDemo123!';

  console.log(`Testing login for ${email}...`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Login Error:', error.message);
    console.error('Error Code:', (error as any).code);
    return;
  }

  console.log('Login Successful!');
  console.log('User ID:', data.user.id);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError) {
    console.error('Profile Fetch Error:', profileError.message);
    console.error('Error Code:', profileError.code);
  } else {
    console.log('Profile found:', profile.first_name, profile.last_name, profile.role);
  }
}

test();
