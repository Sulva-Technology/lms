import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';

loadEnvConfig(process.cwd());

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    console.error('Set it in .env (or .env.local) before running this script.');
    process.exit(1);
  }
  return value;
};

/**
 * Service-role client for maintenance scripts. Bypasses RLS entirely, so it is
 * read from the environment and never committed.
 */
export function adminClient() {
  return createClient(required('NEXT_PUBLIC_SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Anon client, for exercising the same path a browser would take. */
export function anonClient() {
  return createClient(required('NEXT_PUBLIC_SUPABASE_URL'), required('NEXT_PUBLIC_SUPABASE_ANON_KEY'));
}
