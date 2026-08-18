# Wildcard Subdomain Multi-Tenancy — Design

Date: 2026-08-18
Status: Approved

## Goal

Each school (row in `universities`) is served on its own subdomain of a wildcard
root domain (`<subdomain>.<ROOT_DOMAIN>`). Only the platform `super_admin` can
create schools. Creating a school also invites that school's first `admin` user.

## Context

- Next.js 15 App Router + Supabase (SSR auth via `@supabase/ssr`).
- Tenant table `universities` already exists with `domain`, `status`
  (`active | trialing | suspended | archived`) columns; RLS scopes all data via
  `profiles.university_id` (`current_university_id()` helper).
- `createUniversityAction` in `app/actions/superadmin.ts` already gates creation
  behind `requireRole('super_admin')`.
- Nothing currently resolves hostname → tenant; middleware ignores `Host`.
- Hosting: Vercel + custom domain (wildcard `*.<root>` to be attached).
  Root domain not final yet → all code reads `NEXT_PUBLIC_ROOT_DOMAIN` env var.

## 1. Database (migration 034)

- `ALTER TABLE universities ADD COLUMN subdomain TEXT UNIQUE`.
- CHECK constraint: `subdomain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'` and
  `subdomain NOT IN (<reserved list>)`.
- Reserved names (blocked in both DB CHECK and zod): `www`, `app`, `api`,
  `admin`, `superadmin`, `mail`, `smtp`, `ftp`, `static`, `assets`, `cdn`,
  `docs`, `blog`, `status`, `support`, `dashboard`, `login`, `auth`, `dev`,
  `staging`, `test`, `demo`, `vercel`.
- Backfill existing rows: slugify `name`; on collision append `-2`, `-3`, …
  Then `SET NOT NULL`.
- Verify/repair RLS so `universities` INSERT/UPDATE/DELETE is super_admin only
  at the database level (action-level `requireRole` alone is insufficient).

## 2. Tenant resolution (middleware)

- New pure helper `lib/tenant/host.ts`: `parseTenantHost(host, rootDomain)` →
  `{ kind: 'root' } | { kind: 'tenant', subdomain } | { kind: 'unknown' }`.
  Handles port stripping, `www` → root, `*.localhost` for dev,
  Vercel preview URLs (`*.vercel.app` → root).
- `lib/supabase/middleware.ts` (`updateSession`):
  - Root host: landing page, `/login` (super_admin only), `/superadmin/*`.
    Tenant dashboard routes blocked (redirect to landing).
  - Tenant host: look up `universities` by `subdomain` using admin client with
    in-memory TTL cache (~60 s) keyed by subdomain. Inject request headers
    `x-university-id`, `x-university-subdomain` for server components/actions.
  - Unknown subdomain → rewrite to "school not found" page (404).
  - `status` = `suspended`/`archived` → rewrite to suspension page.
  - Authenticated user on tenant host must have
    `profile.university_id === tenant.id`; mismatch → sign out + redirect to
    tenant `/login` with error. `super_admin` exempt (may visit any tenant).
- `middleware.ts` matcher unchanged.

## 3. School creation (super_admin)

- Extend `universitySchema` + superadmin universities form with `subdomain` and
  `adminEmail` (plus optional admin first/last name).
- `createUniversityAction`:
  1. `requireRole('super_admin')` (unchanged).
  2. Insert university with `subdomain`.
  3. Service-role `auth.admin.inviteUserByEmail(adminEmail, { data: { university_id, role: 'admin' }, redirectTo: https://<sub>.<root>/invite })`.
  4. Invite failure → delete the just-created university (no orphan tenant),
     return error.
- Onboarding profile creation reads `university_id`/`role` from invite user
  metadata → creates `admin` profile. Reuses existing `/invite` + onboarding.
- Universities list UI shows tenant URL.

## 4. Login scoping

- Tenant login: after auth, if `profile.university_id` ≠ tenant → sign out,
  error "This account belongs to a different school."
- Root-domain login: only `super_admin` proceeds; others signed out with error
  directing them to their school's subdomain.
- Supabase auth cookies are host-scoped by default → per-subdomain sessions,
  isolation is desired. No cookie-domain change.

## 5. Vercel / DNS (ops, documented in runbook — not code)

- Attach apex + `*.<root>` to the Vercel project; wildcard CNAME at DNS.
- Set `NEXT_PUBLIC_ROOT_DOMAIN=<root>` in Vercel env.
- Dev: `NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000`; `unilag.localhost:3000`
  resolves natively in modern browsers.

## 6. Error handling

- Unknown subdomain: branded 404 "School not found."
- Suspended school: branded "School unavailable" page.
- Middleware tenant-lookup DB error: fail closed for tenant hosts (503-style
  page), fail open for root host.

## 7. Testing

- Unit (vitest): `parseTenantHost` (root, www, tenant, nested, ports,
  localhost, vercel.app); subdomain zod schema incl. reserved names.
- Action: `createUniversityAction` validation + rollback path (mocked
  Supabase).
- Manual E2E: create school on localhost → visit subdomain → invite email →
  admin onboarding → wrong-tenant login rejected.

## Out of scope

- Custom domains per school (existing `domain` column untouched).
- Billing/plan gating of school creation.
- Per-school theming/branding beyond existing `logo_url`.
