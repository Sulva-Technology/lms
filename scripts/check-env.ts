import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

/**
 * Variables the application cannot boot without. Missing any of these is a
 * hard failure: the Supabase clients throw at import time.
 */
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

/**
 * Integration credentials. The app boots and every core flow works without
 * them, but the named feature degrades. These warn loudly rather than failing
 * the build, so a deploy that intentionally ships without (say) email is
 * possible while the gap stays visible in CI output.
 */
const integrationEnvVars: Array<{ name: string; feature: string; degradation: string }> = [
  {
    name: 'DAILY_API_KEY',
    feature: 'Live classes',
    degradation: 'rooms cannot be created; scheduling a live class will fail',
  },
  {
    name: 'LIVE_CLASS_PROVIDER_WEBHOOK_SECRET',
    feature: 'Live class recordings',
    degradation: 'recording webhooks are rejected, so recordings never appear',
  },
  {
    name: 'RESEND_API_KEY',
    feature: 'Transactional email',
    degradation: 'notifications are in-app only; no email is sent',
  },
  {
    name: 'EMAIL_FROM',
    feature: 'Transactional email',
    degradation: 'notifications are in-app only; no email is sent',
  },
  {
    name: 'UPSTASH_REDIS_REST_URL',
    feature: 'Distributed rate limiting',
    degradation: 'rate limits are per-instance only and enforce little on serverless',
  },
  {
    name: 'UPSTASH_REDIS_REST_TOKEN',
    feature: 'Distributed rate limiting',
    degradation: 'rate limits are per-instance only and enforce little on serverless',
  },
];

const optionalEnvVars = ['NEXT_PUBLIC_APP_URL', 'DAILY_API_URL', 'NEXT_PUBLIC_ROOT_DOMAIN'];

const checkEnv = (): void => {
  const missingRequired = requiredEnvVars.filter((name) => !process.env[name]);

  if (missingRequired.length > 0) {
    for (const name of missingRequired) {
      console.error(`Missing required environment variable: ${name}`);
    }
    console.error('Environment check failed.');
    process.exit(1);
  }

  console.log('Environment check passed. Required variables are set.');

  const missingIntegrations = integrationEnvVars.filter((entry) => !process.env[entry.name]);
  if (missingIntegrations.length > 0) {
    console.warn('');
    console.warn('WARNING: the following integrations are not configured.');
    for (const entry of missingIntegrations) {
      console.warn(`  - ${entry.name} (${entry.feature}): ${entry.degradation}`);
    }
    console.warn('');
    console.warn('Set these before serving real users. See docs/RUNBOOK.md.');
  }

  const configuredOptional = optionalEnvVars.filter((name) => process.env[name]);
  if (configuredOptional.length > 0) {
    console.log(`Optional settings configured: ${configuredOptional.join(', ')}`);
  }
};

checkEnv();
