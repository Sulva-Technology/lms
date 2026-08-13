import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DAILY_API_KEY',
  'LIVE_CLASS_PROVIDER_WEBHOOK_SECRET',
];

const optionalEnvVars = [
  'NEXT_PUBLIC_APP_URL',
  'VIDEO_PROVIDER_WEBHOOK_SECRET',
  'DAILY_API_URL',
];

const checkEnv = (): void => {
  let missing = false;

  requiredEnvVars.forEach((v) => {
    if (!process.env[v]) {
      console.error(`Missing required environment variable: ${v}`);
      missing = true;
    }
  });

  if (missing) {
    console.error('Environment check failed.');
    process.exit(1);
  }

  console.log('Environment check passed. Required variables are set.');

  const configuredOptional = optionalEnvVars.filter((v) => process.env[v]);
  if (configuredOptional.length > 0) {
    console.log(`Optional integrations configured: ${configuredOptional.join(', ')}`);
  }
};

checkEnv();
