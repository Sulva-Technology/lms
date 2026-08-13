import { z } from 'zod'
import { resolveAppUrl } from './env-url'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  LIVE_CLASS_PROVIDER_WEBHOOK_SECRET: z.string().optional(),
  DAILY_API_KEY: z.string().optional(),
  DAILY_API_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
})

// Validation will throw if required env vars are missing
export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_APP_URL: resolveAppUrl(process.env.NEXT_PUBLIC_APP_URL, process.env.VERCEL_URL),
  LIVE_CLASS_PROVIDER_WEBHOOK_SECRET: process.env.LIVE_CLASS_PROVIDER_WEBHOOK_SECRET,
  DAILY_API_KEY: process.env.DAILY_API_KEY,
  DAILY_API_URL: process.env.DAILY_API_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
})
