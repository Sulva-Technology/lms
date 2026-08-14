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

3. Fill in the Supabase values in `.env`. Only four variables are required to
   boot; every other entry enables one integration and warns loudly when absent.
   See [docs/RUNBOOK.md](docs/RUNBOOK.md) for the full table.

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Apply Supabase migrations in order:

   ```bash
   npx supabase db push
   ```

5. Seed demo users and a complete demo course:

   ```bash
   npm run db:seed:auth
   ```

   ```bash
   npm run db:seed:demo
   ```

   This creates CSC101 with a lecturer assigned, a student enrolled, published
   lessons, an assignment, a quiz, an announcement, and a discussion. Demo
   logins all use the password `VuiDemo123!`.

6. Start the app:

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

This currently reports 4 high advisories, all in the `sharp`/`libvips` copy that
Next pins for image optimization (`next/node_modules/sharp@0.34.x`). Next has
not yet moved to `sharp@0.35`, and forcing it through an override risks breaking
image optimization at runtime, so it is tracked rather than forced. Re-check
after each Next upgrade. No other production advisory is outstanding; the
unused `@google/genai` and `firebase-tools` dependencies that carried the rest
were removed.

## Deployment Environment

Required (the app will not boot without them):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

Integrations (the app runs without them; one feature degrades each):

| Variable | Feature | Degradation |
| --- | --- | --- |
| `DAILY_API_KEY` | Live classes | Scheduling fails; rooms cannot be created |
| `LIVE_CLASS_PROVIDER_WEBHOOK_SECRET` | Recordings | Webhooks rejected; recordings never appear |
| `RESEND_API_KEY`, `EMAIL_FROM` | Email | Notifications stay in-app only |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limiting | Per-instance counters only |
| `DAILY_API_URL` | Optional | Defaults to the public Daily API endpoint |

Daily webhook signing expects the webhook HMAC secret in base64 form as `LIVE_CLASS_PROVIDER_WEBHOOK_SECRET`. Configure Daily to send recording webhooks to `/api/webhooks/live-class-provider`; `/api/webhooks/live-class` is kept as a compatibility alias.

## Media and Files

All uploads go browser-direct to Supabase Storage through short-lived signed
upload URLs. The server derives every object key as
`{university_id}/{scope}/{owner_id}/{uuid}-{file_name}`, and storage RLS reads
segment 1 as the tenant and segment 3 as the owner — so that path shape is part
of the security model, not a convention. Lesson video uses the same pipeline
into a private `lesson-video` bucket and plays through a signed URL minted per
page render. There is no external video provider.

## Supabase Notes

Migrations are the source of truth for schema, indexes, archival contracts, and RLS. Apply all migrations through `030_lecturer_content_write_policies.sql` before promoting this app to production. Migrations `020`–`030` ship unapplied. See [docs/RUNBOOK.md](docs/RUNBOOK.md) for what each one blocks.

The full migration set plus `supabase/seed.sql` was replayed from scratch against a local Supabase stack on 2026-08-14, and `npm run check:writes` exercises every feature's write path against a real database.

The RLS audit is static by design: it catches missing policy coverage before deployment. It does not prove that the target Supabase project has received the latest migrations, so deployment runbooks should still verify migration status in the target environment.
