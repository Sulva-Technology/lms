# Wildcard Subdomain Multi-Tenancy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve every school on its own wildcard subdomain (`<subdomain>.<ROOT_DOMAIN>`), creatable only by the platform `super_admin`, who simultaneously invites that school's first `admin`.

**Architecture:** A `subdomain` column on `universities` is the tenant key. A pure host-parsing helper turns the request `Host` header into `root | tenant | unknown`; `updateSession` in `lib/supabase/middleware.ts` resolves tenant hosts against a short-lived in-memory cache, injects `x-university-id` / `x-university-subdomain` request headers, blocks cross-tenant sessions, and rewrites unknown/suspended tenants to branded pages. Root-domain hosts serve landing + superadmin only.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (`@supabase/ssr`, service-role admin client), zod, vitest, Tailwind v4.

## Global Constraints

- Root domain comes from `NEXT_PUBLIC_ROOT_DOMAIN`; default `localhost:3000`. Never hardcode a domain.
- Subdomain slug rule (identical in DB CHECK and zod): `^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$`.
- Reserved subdomains (identical list in DB and TS): `www, app, api, admin, superadmin, mail, smtp, ftp, static, assets, cdn, docs, blog, status, support, dashboard, login, auth, dev, staging, test, demo, vercel`.
- Migrations are plain SQL files in `supabase/migrations/`, numbered sequentially, never edited after being committed.
- Tests are vitest, live in `tests/`, imported via the `@/` alias.
- Existing `universities.domain` column is untouched (reserved for future custom domains).
- Every task ends with `npm run test` passing and a commit.

## File Structure

- Create `supabase/migrations/034_school_subdomains.sql` — subdomain column, constraint, backfill, super_admin-only write policies.
- Create `lib/tenant/host.ts` — pure `parseTenantHost` + reserved-name list + slugify helper. No I/O, no Next imports.
- Create `lib/tenant/resolve.ts` — cached tenant lookup by subdomain via admin client.
- Create `lib/tenant/context.ts` — read tenant headers from `next/headers` inside server components/actions.
- Create `app/school-not-found/page.tsx` and `app/school-unavailable/page.tsx` — branded terminal pages.
- Modify `lib/env.ts` — add `NEXT_PUBLIC_ROOT_DOMAIN`.
- Modify `lib/supabase/middleware.ts` — host resolution, header injection, cross-tenant guard.
- Modify `app/actions/superadmin.ts` — subdomain + admin invite on school creation, rollback on failure.
- Modify `lib/auth/invites.ts` — accept an explicit `redirectTo` base URL so invites land on the school's own host.
- Modify `app/(dashboard)/superadmin/universities/page.tsx` and `lib/services/completion-read.service.ts` — new form fields, tenant URL column.
- Modify `app/actions/auth.ts` — reject cross-tenant login.
- Create `tests/tenant-host.test.ts`, `tests/tenant-resolve.test.ts`, `tests/school-creation.test.ts`.
- Modify `docs/RUNBOOK.md` — DNS/Vercel wildcard setup.

---

### Task 1: Host parsing helper

**Files:**
- Create: `lib/tenant/host.ts`
- Test: `tests/tenant-host.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type TenantHost = { kind: 'root' } | { kind: 'tenant'; subdomain: string } | { kind: 'unknown' }`
  - `parseTenantHost(host: string | null | undefined, rootDomain: string): TenantHost`
  - `RESERVED_SUBDOMAINS: readonly string[]`
  - `isValidSubdomain(value: string): boolean`
  - `slugifySubdomain(value: string): string`

- [ ] **Step 1: Write the failing test**

```ts
// tests/tenant-host.test.ts
import { describe, expect, it } from 'vitest';
import {
  RESERVED_SUBDOMAINS,
  isValidSubdomain,
  parseTenantHost,
  slugifySubdomain,
} from '@/lib/tenant/host';

describe('parseTenantHost', () => {
  it('treats the bare root domain and www as root', () => {
    expect(parseTenantHost('sulva.com', 'sulva.com')).toEqual({ kind: 'root' });
    expect(parseTenantHost('www.sulva.com', 'sulva.com')).toEqual({ kind: 'root' });
    expect(parseTenantHost('SULVA.COM', 'sulva.com')).toEqual({ kind: 'root' });
  });

  it('extracts a tenant subdomain', () => {
    expect(parseTenantHost('unilag.sulva.com', 'sulva.com')).toEqual({ kind: 'tenant', subdomain: 'unilag' });
  });

  it('ignores ports on both sides', () => {
    expect(parseTenantHost('unilag.localhost:3000', 'localhost:3000')).toEqual({ kind: 'tenant', subdomain: 'unilag' });
    expect(parseTenantHost('localhost:3000', 'localhost:3000')).toEqual({ kind: 'root' });
  });

  it('treats vercel preview hosts as root', () => {
    expect(parseTenantHost('lms-git-main-team.vercel.app', 'sulva.com')).toEqual({ kind: 'root' });
  });

  it('rejects nested, reserved, and foreign hosts', () => {
    expect(parseTenantHost('a.b.sulva.com', 'sulva.com')).toEqual({ kind: 'unknown' });
    expect(parseTenantHost('api.sulva.com', 'sulva.com')).toEqual({ kind: 'unknown' });
    expect(parseTenantHost('evil.com', 'sulva.com')).toEqual({ kind: 'unknown' });
    expect(parseTenantHost(null, 'sulva.com')).toEqual({ kind: 'unknown' });
  });
});

describe('isValidSubdomain', () => {
  it('accepts slugs and rejects malformed or reserved values', () => {
    expect(isValidSubdomain('unilag')).toBe(true);
    expect(isValidSubdomain('uni-lag-2')).toBe(true);
    expect(isValidSubdomain('-lead')).toBe(false);
    expect(isValidSubdomain('trail-')).toBe(false);
    expect(isValidSubdomain('Upper')).toBe(false);
    expect(isValidSubdomain('has_underscore')).toBe(false);
    expect(isValidSubdomain('')).toBe(false);
    expect(isValidSubdomain('www')).toBe(false);
    expect(RESERVED_SUBDOMAINS).toContain('api');
  });
});

describe('slugifySubdomain', () => {
  it('normalises free text into a slug', () => {
    expect(slugifySubdomain('University of Lagos')).toBe('university-of-lagos');
    expect(slugifySubdomain('  Ahmadu   Bello!! ')).toBe('ahmadu-bello');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/tenant-host.test.ts`
Expected: FAIL — cannot resolve `@/lib/tenant/host`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/tenant/host.ts
export type TenantHost =
  | { kind: 'root' }
  | { kind: 'tenant'; subdomain: string }
  | { kind: 'unknown' };

/**
 * Names that must never become a school subdomain: platform hostnames, common
 * infrastructure records, and words we may want for first-party surfaces.
 * Kept byte-identical to the CHECK constraint in migration 034.
 */
export const RESERVED_SUBDOMAINS = [
  'www', 'app', 'api', 'admin', 'superadmin', 'mail', 'smtp', 'ftp',
  'static', 'assets', 'cdn', 'docs', 'blog', 'status', 'support',
  'dashboard', 'login', 'auth', 'dev', 'staging', 'test', 'demo', 'vercel',
] as const;

const SUBDOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

const stripPort = (value: string) => value.split(':')[0].trim().toLowerCase();

export function isValidSubdomain(value: string): boolean {
  if (!SUBDOMAIN_PATTERN.test(value)) return false;
  return !RESERVED_SUBDOMAINS.includes(value as (typeof RESERVED_SUBDOMAINS)[number]);
}

export function slugifySubdomain(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
    .replace(/-+$/g, '');
}

export function parseTenantHost(host: string | null | undefined, rootDomain: string): TenantHost {
  if (!host) return { kind: 'unknown' };

  const hostname = stripPort(host);
  const root = stripPort(rootDomain);
  if (!hostname || !root) return { kind: 'unknown' };

  // Vercel preview/production deployment URLs have no tenant, so they behave
  // like the root domain instead of 404-ing every preview build.
  if (hostname.endsWith('.vercel.app')) return { kind: 'root' };

  if (hostname === root || hostname === `www.${root}`) return { kind: 'root' };
  if (!hostname.endsWith(`.${root}`)) return { kind: 'unknown' };

  const label = hostname.slice(0, -(root.length + 1));
  if (label.includes('.')) return { kind: 'unknown' };
  if (!isValidSubdomain(label)) return { kind: 'unknown' };

  return { kind: 'tenant', subdomain: label };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/tenant-host.test.ts`
Expected: PASS (3 suites).

- [ ] **Step 5: Commit**

```bash
git add lib/tenant/host.ts tests/tenant-host.test.ts
git commit -m "feat: parse request hosts into tenant subdomains"
```

---

### Task 2: Root domain environment variable

**Files:**
- Modify: `lib/env.ts:4-39`
- Modify: `scripts/check-env.ts:54`
- Test: `tests/env.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `env.NEXT_PUBLIC_ROOT_DOMAIN: string` (defaults to `localhost:3000`).

- [ ] **Step 1: Write the failing test**

Append to `tests/env.test.ts`:

```ts
describe('root domain', () => {
  it('defaults to the local dev host when unset', async () => {
    const { env } = await import('@/lib/env');
    expect(env.NEXT_PUBLIC_ROOT_DOMAIN).toBeTruthy();
    expect(env.NEXT_PUBLIC_ROOT_DOMAIN).not.toContain('://');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/env.test.ts`
Expected: FAIL — `NEXT_PUBLIC_ROOT_DOMAIN` is undefined.

- [ ] **Step 3: Add the variable**

In `lib/env.ts`, add to `envSchema`:

```ts
  NEXT_PUBLIC_ROOT_DOMAIN: z.string().min(1).default('localhost:3000'),
```

and to the `envSchema.parse({ ... })` call:

```ts
  NEXT_PUBLIC_ROOT_DOMAIN: optional(process.env.NEXT_PUBLIC_ROOT_DOMAIN),
```

In `scripts/check-env.ts`, extend `optionalEnvVars`:

```ts
const optionalEnvVars = ['NEXT_PUBLIC_APP_URL', 'DAILY_API_URL', 'NEXT_PUBLIC_ROOT_DOMAIN'];
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/env.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/env.ts scripts/check-env.ts tests/env.test.ts
git commit -m "feat: add NEXT_PUBLIC_ROOT_DOMAIN setting"
```

---

### Task 3: Database subdomain column and write policies

**Files:**
- Create: `supabase/migrations/034_school_subdomains.sql`

**Interfaces:**
- Consumes: `RESERVED_SUBDOMAINS` from Task 1 (list duplicated verbatim in SQL).
- Produces: `universities.subdomain TEXT NOT NULL UNIQUE`; super_admin-only INSERT/UPDATE/DELETE on `universities`.

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/034_school_subdomains.sql
-- Each school is served from <subdomain>.<root domain>. The column is the
-- tenant routing key, so it is unique, slug-shaped, and never a reserved name.

ALTER TABLE universities ADD COLUMN IF NOT EXISTS subdomain TEXT;

-- Backfill: slugify the name, then de-duplicate with a numeric suffix.
WITH slugged AS (
    SELECT
        id,
        NULLIF(trim(both '-' FROM regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')), '') AS base,
        row_number() OVER (
            PARTITION BY NULLIF(trim(both '-' FROM regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')), '')
            ORDER BY created_at, id
        ) AS dupe_rank
    FROM universities
    WHERE subdomain IS NULL
)
UPDATE universities u
SET subdomain = CASE
        WHEN s.base IS NULL THEN 'school-' || left(replace(u.id::text, '-', ''), 8)
        WHEN s.dupe_rank = 1 THEN left(s.base, 63)
        ELSE left(s.base, 58) || '-' || s.dupe_rank
    END
FROM slugged s
WHERE u.id = s.id;

-- Any backfilled value that collided with a reserved name gets prefixed.
UPDATE universities
SET subdomain = 'school-' || subdomain
WHERE subdomain IN (
    'www','app','api','admin','superadmin','mail','smtp','ftp','static','assets',
    'cdn','docs','blog','status','support','dashboard','login','auth','dev',
    'staging','test','demo','vercel'
);

ALTER TABLE universities ALTER COLUMN subdomain SET NOT NULL;

ALTER TABLE universities
    DROP CONSTRAINT IF EXISTS universities_subdomain_key;
ALTER TABLE universities
    ADD CONSTRAINT universities_subdomain_key UNIQUE (subdomain);

ALTER TABLE universities
    DROP CONSTRAINT IF EXISTS universities_subdomain_format;
ALTER TABLE universities
    ADD CONSTRAINT universities_subdomain_format CHECK (
        subdomain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'
        AND subdomain NOT IN (
            'www','app','api','admin','superadmin','mail','smtp','ftp','static','assets',
            'cdn','docs','blog','status','support','dashboard','login','auth','dev',
            'staging','test','demo','vercel'
        )
    );

CREATE INDEX IF NOT EXISTS idx_universities_subdomain ON universities (subdomain);

-- Creation must be a super_admin-only act at the database level, not merely in
-- the server action. The pre-existing FOR ALL policy had no WITH CHECK, so an
-- INSERT was accepted from any authenticated session.
DROP POLICY IF EXISTS "Super admins can manage universities" ON universities;
CREATE POLICY "Super admins can manage universities" ON universities
    FOR ALL
    USING (is_super_admin())
    WITH CHECK (is_super_admin());
```

- [ ] **Step 2: Verify the SQL applies**

Run: `npx supabase db reset` (local Supabase running) — or apply `supabase/migrations/034_school_subdomains.sql` in the Supabase SQL editor for the hosted project.
Expected: no errors; `select subdomain from universities;` returns a non-null slug per row.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/034_school_subdomains.sql
git commit -m "feat: add school subdomain column and lock university writes to super admins"
```

---

### Task 4: Cached tenant lookup

**Files:**
- Create: `lib/tenant/resolve.ts`
- Test: `tests/tenant-resolve.test.ts`

**Interfaces:**
- Consumes: `createAdminClient` from `@/lib/supabase/admin`.
- Produces:
  - `interface TenantRecord { id: string; name: string; subdomain: string; status: string; logo_url: string | null }`
  - `resolveTenant(subdomain: string): Promise<{ ok: true; tenant: TenantRecord | null } | { ok: false }>` — `tenant: null` means no such school; `ok: false` means the lookup itself failed.
  - `clearTenantCache(): void` (test seam).

- [ ] **Step 1: Write the failing test**

```ts
// tests/tenant-resolve.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const maybeSingle = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));

const loadModule = async () => {
  const mod = await import('@/lib/tenant/resolve');
  mod.clearTenantCache();
  return mod;
};

describe('resolveTenant', () => {
  beforeEach(() => {
    maybeSingle.mockReset();
    vi.resetModules();
  });

  it('returns the tenant row for a known subdomain', async () => {
    maybeSingle.mockResolvedValue({
      data: { id: 'uni-1', name: 'Unilag', subdomain: 'unilag', status: 'active', logo_url: null },
      error: null,
    });
    const { resolveTenant } = await loadModule();
    const result = await resolveTenant('unilag');
    expect(result).toEqual({ ok: true, tenant: expect.objectContaining({ id: 'uni-1' }) });
  });

  it('caches repeat lookups within the TTL', async () => {
    maybeSingle.mockResolvedValue({
      data: { id: 'uni-1', name: 'Unilag', subdomain: 'unilag', status: 'active', logo_url: null },
      error: null,
    });
    const { resolveTenant } = await loadModule();
    await resolveTenant('unilag');
    await resolveTenant('unilag');
    expect(maybeSingle).toHaveBeenCalledTimes(1);
  });

  it('reports a missing school as ok with a null tenant', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const { resolveTenant } = await loadModule();
    expect(await resolveTenant('nope')).toEqual({ ok: true, tenant: null });
  });

  it('reports a lookup failure distinctly from a missing school', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'connection reset' } });
    const { resolveTenant } = await loadModule();
    expect(await resolveTenant('unilag')).toEqual({ ok: false });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/tenant-resolve.test.ts`
Expected: FAIL — cannot resolve `@/lib/tenant/resolve`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/tenant/resolve.ts
import { createAdminClient } from '@/lib/supabase/admin';

export interface TenantRecord {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  logo_url: string | null;
}

export type TenantLookup = { ok: true; tenant: TenantRecord | null } | { ok: false };

const TTL_MS = 60_000;

// Middleware runs per request on a warm serverless instance, so a small
// in-process cache removes a database round trip from nearly every page view
// while still picking up status changes within a minute.
const cache = new Map<string, { value: TenantRecord | null; expiresAt: number }>();

export function clearTenantCache(): void {
  cache.clear();
}

export async function resolveTenant(subdomain: string): Promise<TenantLookup> {
  const cached = cache.get(subdomain);
  if (cached && cached.expiresAt > Date.now()) {
    return { ok: true, tenant: cached.value };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('universities')
      .select('id,name,subdomain,status,logo_url')
      .eq('subdomain', subdomain)
      .maybeSingle();

    if (error) {
      console.error('Tenant lookup failed:', error);
      return { ok: false };
    }

    const tenant = (data as TenantRecord | null) ?? null;
    cache.set(subdomain, { value: tenant, expiresAt: Date.now() + TTL_MS });
    return { ok: true, tenant };
  } catch (error) {
    console.error('Tenant lookup threw:', error);
    return { ok: false };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/tenant-resolve.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/tenant/resolve.ts tests/tenant-resolve.test.ts
git commit -m "feat: resolve schools by subdomain with a short-lived cache"
```

---

### Task 5: Terminal pages for unknown and unavailable schools

**Files:**
- Create: `app/school-not-found/page.tsx`
- Create: `app/school-unavailable/page.tsx`

**Interfaces:**
- Consumes: `env.NEXT_PUBLIC_ROOT_DOMAIN` (Task 2).
- Produces: routes `/school-not-found` and `/school-unavailable` that the middleware rewrites to.

- [ ] **Step 1: Write the not-found page**

```tsx
// app/school-not-found/page.tsx
import { env } from '@/lib/env';

export default function SchoolNotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="max-w-md rounded-[28px] border border-white/10 bg-slate-900/60 p-10 text-center shadow-2xl backdrop-blur-2xl">
        <h1 className="text-2xl font-semibold text-white">School not found</h1>
        <p className="mt-3 text-sm text-slate-400">
          No school is registered at this address. Check the link with your institution, or
          visit <span className="text-slate-200">{env.NEXT_PUBLIC_ROOT_DOMAIN}</span>.
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Write the unavailable page**

```tsx
// app/school-unavailable/page.tsx
export default function SchoolUnavailablePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="max-w-md rounded-[28px] border border-white/10 bg-slate-900/60 p-10 text-center shadow-2xl backdrop-blur-2xl">
        <h1 className="text-2xl font-semibold text-white">This school is unavailable</h1>
        <p className="mt-3 text-sm text-slate-400">
          Access has been paused for this institution. Your school administrator can restore it
          by contacting platform support.
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify they build**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/school-not-found/page.tsx app/school-unavailable/page.tsx
git commit -m "feat: add branded pages for unknown and paused schools"
```

---

### Task 6: Middleware tenant resolution and cross-tenant guard

**Files:**
- Modify: `lib/supabase/middleware.ts:7-122`
- Create: `lib/tenant/context.ts`

**Interfaces:**
- Consumes: `parseTenantHost` (Task 1), `env.NEXT_PUBLIC_ROOT_DOMAIN` (Task 2), `resolveTenant` (Task 4), routes from Task 5.
- Produces:
  - Request headers `x-university-id`, `x-university-subdomain` on tenant hosts.
  - `getTenantContext(): Promise<{ universityId: string; subdomain: string } | null>` from `lib/tenant/context.ts`.

- [ ] **Step 1: Write the tenant context reader**

```ts
// lib/tenant/context.ts
import { headers } from 'next/headers';

export interface TenantContext {
  universityId: string;
  subdomain: string;
}

/**
 * Reads the tenant the middleware resolved for this request. Returns null on
 * root-domain requests, which are not scoped to any school.
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const headerList = await headers();
  const universityId = headerList.get('x-university-id');
  const subdomain = headerList.get('x-university-subdomain');
  if (!universityId || !subdomain) return null;
  return { universityId, subdomain };
}
```

- [ ] **Step 2: Rewrite `updateSession` host handling**

Replace the whole body of `lib/supabase/middleware.ts` with:

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { AuthRole } from '@/types/auth'
import { canAccessRolePath, getRequiredRoleForPath, getRoleRedirectPath } from '@/lib/auth/roles'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseTenantHost } from '@/lib/tenant/host'
import { resolveTenant } from '@/lib/tenant/resolve'
import { env } from '@/lib/env'

const PUBLIC_PREFIXES = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/invite',
  '/verify',
  '/design-system',
  '/docs',
  '/unauthorized',
  '/api/',
  '/school-not-found',
  '/school-unavailable',
]

const isPublicPath = (pathname: string) =>
  pathname === '/' || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))

const rewriteTo = (request: NextRequest, pathname: string) => {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = ''
  return NextResponse.rewrite(url)
}

export const updateSession = async (request: NextRequest) => {
  try {
    const { pathname } = request.nextUrl
    const host = request.headers.get('host')
    const tenantHost = parseTenantHost(host, env.NEXT_PUBLIC_ROOT_DOMAIN)

    if (tenantHost.kind === 'unknown') {
      return rewriteTo(request, '/school-not-found')
    }

    // Superadmin lives on the platform domain only; school hosts never expose it.
    if (tenantHost.kind === 'root' && pathname.startsWith('/superadmin')) {
      // fall through to the normal auth checks below
    }

    let tenantId: string | null = null
    let tenantSubdomain: string | null = null

    if (tenantHost.kind === 'tenant') {
      const lookup = await resolveTenant(tenantHost.subdomain)
      if (!lookup.ok) {
        return rewriteTo(request, '/school-unavailable')
      }
      if (!lookup.tenant) {
        return rewriteTo(request, '/school-not-found')
      }
      if (lookup.tenant.status === 'suspended' || lookup.tenant.status === 'archived') {
        return rewriteTo(request, '/school-unavailable')
      }
      tenantId = lookup.tenant.id
      tenantSubdomain = lookup.tenant.subdomain

      // Platform administration is not reachable from a school host.
      if (pathname.startsWith('/superadmin')) {
        const url = request.nextUrl.clone()
        url.pathname = '/unauthorized'
        url.search = ''
        return NextResponse.redirect(url)
      }
    }

    const requestHeaders = new Headers(request.headers)
    if (tenantId && tenantSubdomain) {
      requestHeaders.set('x-university-id', tenantId)
      requestHeaders.set('x-university-subdomain', tenantSubdomain)
    } else {
      requestHeaders.delete('x-university-id')
      requestHeaders.delete('x-university-subdomain')
    }

    if (isPublicPath(pathname)) {
      return NextResponse.next({ request: { headers: requestHeaders } })
    }

    let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })

    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }

    const adminClient = createAdminClient()
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role, university_id')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Middleware profile fetch error:', profileError)
    }

    // Authenticated invited users without a profile must finish onboarding.
    if (!profile && !pathname.startsWith('/onboarding') && !pathname.startsWith('/reset-password')) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding/profile'
      url.search = ''
      return NextResponse.redirect(url)
    }

    // A session from another school must not be usable on this school's host.
    if (
      profile &&
      tenantId &&
      profile.role !== 'super_admin' &&
      profile.university_id !== tenantId
    ) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.search = '?error=wrong-school'
      return NextResponse.redirect(url)
    }

    // Completed users should not re-enter onboarding.
    if (profile && pathname.startsWith('/onboarding')) {
      const url = request.nextUrl.clone()
      url.pathname = getRoleRedirectPath(profile.role as AuthRole)
      url.search = ''
      return NextResponse.redirect(url)
    }

    const requiredRole = getRequiredRoleForPath(pathname)
    if (profile && requiredRole && !canAccessRolePath(profile.role as AuthRole, requiredRole)) {
      const url = request.nextUrl.clone()
      url.pathname = getRoleRedirectPath(profile.role as AuthRole)
      url.search = ''
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (e) {
    console.error('Middleware supbase client creation error', e)
    return NextResponse.next({ request })
  }
}
```

Note: the previous `/login` branch that redirected authenticated users away is dropped because `/login` is a public path and now returns before the auth lookup; the login page itself redirects a signed-in user.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Run the full suite**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/middleware.ts lib/tenant/context.ts
git commit -m "feat: resolve the school tenant from the request host in middleware"
```

---

### Task 7: Invite helper accepts a school host

**Files:**
- Modify: `lib/auth/invites.ts:5-47`

**Interfaces:**
- Consumes: `env.NEXT_PUBLIC_APP_URL`.
- Produces: `sendUserInvite(payload: UserInvitePayload)` where `UserInvitePayload` gains `baseUrl?: string`; when set, the invite `redirectTo` is built from it instead of `NEXT_PUBLIC_APP_URL`.

- [ ] **Step 1: Modify the helper**

```ts
export interface UserInvitePayload {
  email: string;
  role: AuthRole;
  universityId?: string | null;
  firstName?: string;
  lastName?: string;
  /** Origin the invite link should land on, e.g. https://unilag.sulva.com. */
  baseUrl?: string;
}
```

and inside `sendUserInvite`, replace the `appUrl` line:

```ts
  const appUrl = payload.baseUrl || env.NEXT_PUBLIC_APP_URL;
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/auth/invites.ts
git commit -m "feat: let invites land on a specific school host"
```

---

### Task 8: School creation with subdomain and admin invite

**Files:**
- Modify: `app/actions/superadmin.ts:24-28,73-87`
- Create: `lib/tenant/url.ts`
- Test: `tests/school-creation.test.ts`

**Interfaces:**
- Consumes: `isValidSubdomain`, `slugifySubdomain` (Task 1); `env.NEXT_PUBLIC_ROOT_DOMAIN` (Task 2); `sendUserInvite` (Task 7).
- Produces:
  - `lib/tenant/url.ts`: `tenantOrigin(subdomain: string, rootDomain: string): string` — `http://` for `localhost` hosts, `https://` otherwise.
  - `createUniversityAction(payload)` accepting `{ name, subdomain, domain?, status, adminEmail, adminFirstName?, adminLastName? }`, returning `{ success: true, url: string }` or `{ error: string }`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/school-creation.test.ts
import { describe, expect, it } from 'vitest';
import { tenantOrigin } from '@/lib/tenant/url';

describe('tenantOrigin', () => {
  it('uses http for local development hosts', () => {
    expect(tenantOrigin('unilag', 'localhost:3000')).toBe('http://unilag.localhost:3000');
  });

  it('uses https for real domains', () => {
    expect(tenantOrigin('unilag', 'sulva.com')).toBe('https://unilag.sulva.com');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/school-creation.test.ts`
Expected: FAIL — cannot resolve `@/lib/tenant/url`.

- [ ] **Step 3: Write the URL helper**

```ts
// lib/tenant/url.ts
const isLocalHost = (rootDomain: string) =>
  rootDomain.startsWith('localhost') || rootDomain.startsWith('127.0.0.1');

export function tenantOrigin(subdomain: string, rootDomain: string): string {
  const protocol = isLocalHost(rootDomain) ? 'http' : 'https';
  return `${protocol}://${subdomain}.${rootDomain}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/school-creation.test.ts`
Expected: PASS.

- [ ] **Step 5: Rewrite the creation action**

In `app/actions/superadmin.ts`, replace `universitySchema` with:

```ts
const universitySchema = z.object({
  name: z.string().min(2),
  subdomain: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(63)
    .refine((value) => isValidSubdomain(value), {
      message: 'Subdomain must be lowercase letters, numbers, and hyphens, and not a reserved name.',
    }),
  domain: z.string().min(2).optional().or(z.literal('')),
  status: z.enum(['active', 'trialing', 'suspended', 'archived']).default('trialing'),
  adminEmail: z.string().email(),
  adminFirstName: z.string().trim().optional().or(z.literal('')),
  adminLastName: z.string().trim().optional().or(z.literal('')),
});
```

Add these imports at the top of the file:

```ts
import { createAdminClient } from '@/lib/supabase/admin';
import { sendUserInvite } from '@/lib/auth/invites';
import { isValidSubdomain, slugifySubdomain } from '@/lib/tenant/host';
import { tenantOrigin } from '@/lib/tenant/url';
import { env } from '@/lib/env';
```

Replace `createUniversityAction` with:

```ts
export async function createUniversityAction(payload: any) {
  const supabase = await createClient();
  await requireRole('super_admin');

  const normalized = {
    ...payload,
    subdomain: slugifySubdomain(String(payload?.subdomain || payload?.name || '')),
  };
  const parsed = universitySchema.safeParse(normalized);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data: created, error } = await supabase
    .from('universities')
    .insert({
      name: parsed.data.name,
      subdomain: parsed.data.subdomain,
      domain: parsed.data.domain || null,
      status: parsed.data.status,
    })
    .select('id,subdomain')
    .single();

  if (error) {
    if (error.code === '23505') return { error: 'That subdomain is already taken.' };
    return { error: error.message };
  }

  const url = tenantOrigin(created.subdomain, env.NEXT_PUBLIC_ROOT_DOMAIN);

  try {
    await sendUserInvite({
      email: parsed.data.adminEmail,
      role: 'admin',
      universityId: created.id,
      firstName: parsed.data.adminFirstName || undefined,
      lastName: parsed.data.adminLastName || undefined,
      baseUrl: url,
    });
  } catch (inviteError) {
    // A school with no reachable administrator is worse than no school at all,
    // so undo the tenant rather than leaving an orphan behind.
    await createAdminClient().from('universities').delete().eq('id', created.id);
    const message = inviteError instanceof Error ? inviteError.message : 'Failed to invite the school administrator.';
    return { error: `School was not created: ${message}` };
  }

  revalidatePath('/superadmin/universities');
  return { success: true, url };
}
```

- [ ] **Step 6: Typecheck and run the suite**

Run: `npm run typecheck && npm run test`
Expected: no type errors; all tests pass.

- [ ] **Step 7: Commit**

```bash
git add app/actions/superadmin.ts lib/tenant/url.ts tests/school-creation.test.ts
git commit -m "feat: create schools with a subdomain and invite their first admin"
```

---

### Task 9: Superadmin universities UI

**Files:**
- Modify: `app/(dashboard)/superadmin/universities/page.tsx:18-64`
- Modify: `lib/services/completion-read.service.ts:315-322`

**Interfaces:**
- Consumes: `createUniversityAction` (Task 8), `tenantOrigin` (Task 8), `env.NEXT_PUBLIC_ROOT_DOMAIN` (Task 2).
- Produces: no new exports.

- [ ] **Step 1: Select the new column**

In `lib/services/completion-read.service.ts`, change `getUniversities`'s select string to:

```ts
      .select("id,name,subdomain,domain,status,created_at,university_plan_subscriptions(status,platform_plans(name,slug))")
```

- [ ] **Step 2: Extend the creation form**

In `app/(dashboard)/superadmin/universities/page.tsx`, replace the `createUniversity` server function and the form with:

```tsx
  async function createUniversity(formData: FormData) {
    "use server";
    await createUniversityAction({
      name: String(formData.get("name") || ""),
      subdomain: String(formData.get("subdomain") || ""),
      domain: String(formData.get("domain") || ""),
      status: String(formData.get("status") || "trialing"),
      adminEmail: String(formData.get("adminEmail") || ""),
      adminFirstName: String(formData.get("adminFirstName") || ""),
      adminLastName: String(formData.get("adminLastName") || ""),
    });
  }
```

```tsx
      <form action={createUniversity} className="grid gap-4 rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-2xl lg:grid-cols-3">
        <input name="name" required placeholder="School name" className={inputClass} />
        <input name="subdomain" required placeholder="unilag" pattern="[a-z0-9-]+" className={inputClass} />
        <input name="domain" placeholder="domain.edu (optional)" className={inputClass} />
        <input name="adminEmail" type="email" required placeholder="School admin email" className={inputClass} />
        <input name="adminFirstName" placeholder="Admin first name" className={inputClass} />
        <input name="adminLastName" placeholder="Admin last name" className={inputClass} />
        <select name="status" defaultValue="trialing" className={inputClass}>
          {statusValues.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <p className="self-center text-xs text-slate-400 lg:col-span-1">
          The school goes live at <span className="text-slate-200">{`<subdomain>.${rootDomain}`}</span> and the admin receives an invite email.
        </p>
        <button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-glow-blue hover:bg-blue-500">Create school</button>
      </form>
```

Add near the top of the component body:

```tsx
  const rootDomain = env.NEXT_PUBLIC_ROOT_DOMAIN;
```

and import:

```tsx
import { env } from "@/lib/env";
import { tenantOrigin } from "@/lib/tenant/url";
```

- [ ] **Step 3: Show the school URL in the table**

Replace the `domain` column definition with:

```tsx
            { key: "address", header: "Address", cell: (item: any) => (
              <a href={tenantOrigin(item.subdomain, rootDomain)} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">
                {item.subdomain}.{rootDomain}
              </a>
            ) },
```

- [ ] **Step 4: Typecheck and build**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/superadmin/universities/page.tsx" lib/services/completion-read.service.ts
git commit -m "feat: capture subdomain and admin invite in the school creation form"
```

---

### Task 10: Cross-tenant login rejection

**Files:**
- Modify: `app/actions/auth.ts:12-75`

**Interfaces:**
- Consumes: `getTenantContext` (Task 6).
- Produces: `loginAction` returns `{ error: 'This account belongs to a different school.' }` when the signed-in profile's `university_id` does not match the host tenant.

- [ ] **Step 1: Modify the action**

Add the import:

```ts
import { getTenantContext } from '@/lib/tenant/context';
```

Change the profile select to include the tenant, i.e. in the admin-client block:

```ts
      const result = await adminClient
        .from('profiles')
        .select('role, university_id')
        .eq('id', data.user.id)
        .maybeSingle();
```

and in the RLS fallback block:

```ts
      const fallback = await supabase
        .from('profiles')
        .select('role, university_id')
        .eq('id', data.user.id)
        .maybeSingle();
```

Change the `profile` declaration to:

```ts
    let profile: { role: string | null; university_id: string | null } | null = null;
```

After `const role = ...` is computed, insert:

```ts
    // A school host only accepts accounts belonging to that school. The platform
    // domain only accepts the platform operator.
    const tenant = await getTenantContext();
    if (role !== 'super_admin') {
      if (tenant && profile && profile.university_id !== tenant.universityId) {
        await supabase.auth.signOut();
        return { error: 'This account belongs to a different school.' };
      }
      if (!tenant) {
        await supabase.auth.signOut();
        return { error: 'Sign in from your school web address instead of the platform site.' };
      }
    }
```

- [ ] **Step 2: Typecheck and run the suite**

Run: `npm run typecheck && npm run test`
Expected: no type errors; tests pass.

- [ ] **Step 3: Commit**

```bash
git add app/actions/auth.ts
git commit -m "feat: reject sign-ins from the wrong school host"
```

---

### Task 11: Runbook and full verification

**Files:**
- Modify: `docs/RUNBOOK.md`

**Interfaces:**
- Consumes: everything above.
- Produces: documented DNS/Vercel setup.

- [ ] **Step 1: Document the wildcard setup**

Append to `docs/RUNBOOK.md`:

```markdown
## Wildcard school subdomains

Each school is served at `<subdomain>.<NEXT_PUBLIC_ROOT_DOMAIN>`.

1. In Vercel → Project → Domains, add both the apex domain and `*.<root domain>`.
2. At the DNS provider, add the records Vercel shows: an A/ALIAS record for the
   apex and a `CNAME *` record pointing at `cname.vercel-dns.com`.
3. Set `NEXT_PUBLIC_ROOT_DOMAIN` (for example `sulva.com`) in Vercel for all
   environments. Vercel issues the wildcard TLS certificate automatically.
4. Locally, leave `NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000`; browsers resolve
   `anything.localhost` without a hosts-file entry.

Creating a school (super admin only, at `/superadmin/universities` on the root
domain) inserts the tenant and emails an invite to the school's first admin,
whose link lands on that school's own subdomain. If the invite fails to send,
the school row is rolled back.

Reserved subdomains that can never be assigned: `www, app, api, admin,
superadmin, mail, smtp, ftp, static, assets, cdn, docs, blog, status, support,
dashboard, login, auth, dev, staging, test, demo, vercel`.
```

- [ ] **Step 2: Run the whole verification pipeline**

Run: `npm run lint && npm run typecheck && npm run test && npm run build`
Expected: all four succeed.

- [ ] **Step 3: Commit**

```bash
git add docs/RUNBOOK.md
git commit -m "docs: document wildcard subdomain setup for schools"
```

---

## Manual verification (after deploy)

1. On the root domain, sign in as `super_admin` → `/superadmin/universities`.
2. Create a school with subdomain `demoschool` and an admin email you control.
3. Confirm the table shows `demoschool.<root>` and the invite email arrives.
4. Accept the invite → onboarding creates an `admin` profile scoped to the school.
5. Visit `nosuchschool.<root>` → "School not found".
6. Set the school's status to `suspended` → its subdomain shows "This school is unavailable" within a minute.
7. Try signing in with the school admin's account on a second school's subdomain → rejected with "This account belongs to a different school."
