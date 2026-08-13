# VUI LMS

VUI LMS is a production-oriented Next.js App Router learning management system backed by Supabase. It includes role-scoped student, lecturer, admin, and super-admin workflows, server-side validation, Supabase RLS migrations, and a premium glassmorphism UI system.

## Stack

- Next.js App Router 15
- React 19 and TypeScript
- Tailwind CSS 4
- Motion for React micro-interactions
- Supabase Auth, Postgres, Storage, and RLS
- Vitest for focused contract tests

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

3. Fill in the Supabase values in `.env`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   DAILY_API_KEY=
   LIVE_CLASS_PROVIDER_WEBHOOK_SECRET=
   ```

4. Apply Supabase migrations in order, then seed local data if needed:

   ```bash
   supabase db reset
   npm run db:seed:auth
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

## Production Gates

Run the full release gate before deploying:

```bash
npm run verify
```

This runs:

- `check:env`: loads Next env files and confirms required Supabase and Daily live-class variables.
- `check:links`: audits internal App Router links, redirects, route hrefs, and anchor targets.
- `check:rls`: audits migrations so every public table has RLS enabled and at least one policy.
- `lint`: validates code quality with Next ESLint.
- `typecheck`: runs TypeScript without emit.
- `test`: runs the Vitest suite.
- `build`: creates the optimized production build.

For dependency security, run:

```bash
npm audit --audit-level=high --omit=dev
```

The app currently gates on high-severity production advisories. Moderate advisories inside upstream framework internals should be tracked and resolved through normal dependency updates rather than forced downgrades.

## Required Deployment Environment

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `DAILY_API_KEY`
- `LIVE_CLASS_PROVIDER_WEBHOOK_SECRET`

Optional integrations:

- `VIDEO_PROVIDER_WEBHOOK_SECRET`
- `DAILY_API_URL`
- `GEMINI_API_KEY`

Daily webhook signing expects the webhook HMAC secret in base64 form as `LIVE_CLASS_PROVIDER_WEBHOOK_SECRET`. Configure Daily to send recording webhooks to `/api/webhooks/live-class-provider`; `/api/webhooks/live-class` is kept as a compatibility alias.

## Supabase Notes

Migrations are the source of truth for schema, indexes, archival contracts, and RLS. Apply all migrations through `019_live_recording_contract.sql` before promoting this app to production.

The RLS audit is static by design: it catches missing policy coverage before deployment. It does not prove that the target Supabase project has received the latest migrations, so deployment runbooks should still verify migration status in the target environment.
