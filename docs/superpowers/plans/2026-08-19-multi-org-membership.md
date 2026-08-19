# Multi-Organisation Membership Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One account can belong to many organisations, holding a different role in each, instead of `profiles` carrying a single `university_id` and `role`.

**Architecture:** A `memberships` table holds `(user_id, university_id, role)`. A `membership_claims` mirror, kept by trigger, is the only thing the RLS helper functions read, which keeps every policy free of recursion. `platform_admins` holds platform administration, which is a property of the account rather than a membership. Three existing helpers keep their signatures, so no policy in migrations 005–041 is edited. Rollout is expand → migrate → contract across two deploys.

**Tech Stack:** Next.js 15 App Router, Supabase (Postgres + RLS + `@supabase/ssr`), TypeScript, Vitest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-19-multi-org-membership-design.md`.
- Migrations are append-only, numbered `NNN_name.sql` in `supabase/migrations/`. Never edit an applied migration.
- **No helper function may read `profiles` or `memberships`.** Helpers read `membership_claims` and `platform_admins` only. A helper that reads a table which has a policy calling that helper produces `42P17`.
- **No policy may read the table it guards.** `npm run check:drift` fails on this.
- Every membership check requires `deleted_at IS NULL`.
- Tests are static analysis of migration SQL (see `tests/profile-claims.test.ts`) or unit tests against `tests/helpers/supabase-stub.ts`. No test requires a live database.
- Gate for every task: `npm run test`. Gate before the final commit: `npm run verify`.
- Do NOT apply migration `045` in the same deploy as the application changes. Tasks 1–8 ship together; Task 9 ships after.
- Commit after every task.

---

### Task 1: Membership tables, claims mirror, and RLS helpers

**Files:**
- Create: `supabase/migrations/043_memberships.sql`
- Test: `tests/memberships.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: SQL functions `is_member_of(UUID) RETURNS BOOLEAN`, `role_in(UUID) RETURNS user_role`, `is_staff_in(UUID) RETURNS BOOLEAN`; redefined `is_super_admin() RETURNS BOOLEAN`, `in_same_tenant(UUID) RETURNS BOOLEAN`, `is_university_admin(UUID) RETURNS BOOLEAN`. Tables `memberships`, `membership_claims`, `platform_admins`.

- [ ] **Step 1: Write the failing test**

Create `tests/memberships.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), 'supabase', 'migrations', file), 'utf8');

const migration = read('043_memberships.sql');

/** Bodies of every CREATE OR REPLACE FUNCTION in the migration. */
const functionBodies = migration.split('CREATE OR REPLACE FUNCTION').slice(1);

describe('membership schema', () => {
  it('keys a membership by the pair, not by the account', () => {
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS memberships');
    expect(migration).toMatch(/PRIMARY KEY \(user_id, university_id\)/);
  });

  it('carries the per-organisation facts that used to sit on profiles', () => {
    expect(migration).toMatch(/student_id\s+TEXT/);
    expect(migration).toMatch(/department_id\s+UUID REFERENCES departments\(id\)/);
    expect(migration).toMatch(/UNIQUE \(university_id, student_id\)/);
  });

  it('lets one organisation deactivate someone without touching the account', () => {
    expect(migration).toMatch(/deleted_at\s+TIMESTAMPTZ/);
  });

  it('keeps the platform role out of the tenant table', () => {
    expect(migration).toMatch(/CHECK \(role <> 'super_admin'\)/);
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS platform_admins');
  });

  it('backfills every existing profile so nobody is locked out on deploy', () => {
    expect(migration).toMatch(
      /INSERT INTO memberships[\s\S]*?SELECT id, university_id, role, student_id, deleted_at[\s\S]*?FROM profiles/,
    );
    expect(migration).toMatch(
      /INSERT INTO platform_admins[\s\S]*?FROM profiles WHERE role = 'super_admin'/,
    );
  });
});

describe('membership claims mirror', () => {
  it('exists, and is kept in step by trigger rather than by application code', () => {
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS membership_claims');
    expect(migration).toContain('sync_membership_claim_trigger');
    expect(migration).toContain('ON memberships');
  });

  it('is readable only as the caller, so nothing it does can re-enter a policy', () => {
    const policy = migration.slice(migration.indexOf('CREATE POLICY "Users read own membership claims"'));
    const using = policy.slice(0, policy.indexOf(';'));

    expect(using).toContain('user_id = auth.uid()');
    expect(using).not.toMatch(/\bmemberships\b/);
    expect(using).not.toMatch(/\bprofiles\b/);
  });

  it('leaves the API no way to write a claim or a membership', () => {
    expect(migration).not.toMatch(
      /CREATE POLICY[\s\S]{0,200}?ON (membership_claims|memberships|platform_admins)[\s\S]{0,200}?FOR (INSERT|UPDATE|DELETE)/,
    );
  });
});

describe('rls helpers', () => {
  it('never read profiles or memberships, which is what stops 42P17', () => {
    const offenders = functionBodies.filter((body) =>
      /FROM\s+(public\.)?(profiles|memberships)\b/.test(body),
    );

    expect(offenders).toEqual([]);
  });

  it('keep the three signatures every existing policy already calls', () => {
    expect(migration).toMatch(/FUNCTION in_same_tenant\(tenant_id UUID\) RETURNS BOOLEAN/);
    expect(migration).toMatch(/FUNCTION is_university_admin\(check_uni_id UUID\) RETURNS BOOLEAN/);
    expect(migration).toMatch(/FUNCTION is_super_admin\(\) RETURNS BOOLEAN/);
  });

  it('read platform administration from its own table', () => {
    expect(migration).toMatch(/is_super_admin\(\)[\s\S]*?FROM platform_admins/);
  });

  it('ignore a membership that has been deactivated', () => {
    const memberOf = migration.slice(migration.indexOf('FUNCTION is_member_of'));
    expect(memberOf.slice(0, memberOf.indexOf('$$;') + 3)).toContain('membership_claims');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/memberships.test.ts
```

Expected: FAIL — `ENOENT: no such file or directory ... 043_memberships.sql`.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/043_memberships.sql`:

```sql
-- One account, many organisations.
--
-- profiles carried a single university_id and role, so a person invited to a
-- second school could not accept: inviteUserByEmail rejects an address that is
-- already registered, and the middleware signed them out of the second host
-- for not matching the first. The tenant and the role move to a row per
-- (person, organisation) instead.
--
-- membership_claims is a mirror of the active memberships, and it exists for
-- one reason. The helper functions below are called by policies on memberships
-- itself, so a helper that read memberships would re-enter the policy that
-- asked the question: 42P17, the failure migration 041 removed. Pointing the
-- helpers at a table whose own policy names auth.uid() and nothing else breaks
-- the cycle, and means no helper depends on SECURITY DEFINER actually
-- bypassing RLS - an assumption about provisioning the schema cannot make.

CREATE TABLE IF NOT EXISTS memberships (
    user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    role          user_role NOT NULL,
    student_id    TEXT,
    -- TrainingAssignmentService.assignTeam already filters on a department for
    -- a person; the column it filtered has never existed on profiles.
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ,
    PRIMARY KEY (user_id, university_id),
    -- A matric number is issued by one school and means nothing at another.
    UNIQUE (university_id, student_id),
    -- Platform administration is not a membership in any organisation.
    CHECK (role <> 'super_admin')
);

CREATE INDEX IF NOT EXISTS idx_memberships_university_role
  ON memberships (university_id, role) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS membership_claims (
    user_id       UUID NOT NULL,
    university_id UUID NOT NULL,
    role          user_role NOT NULL,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, university_id)
);

CREATE TABLE IF NOT EXISTS platform_admins (
    user_id    UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Backfill. Soft-deletes are preserved, so a deactivated person stays
-- deactivated and an active one is not locked out the moment this is applied.
-- ---------------------------------------------------------------------------
INSERT INTO memberships (user_id, university_id, role, student_id, deleted_at)
SELECT id, university_id, role, student_id, deleted_at
FROM profiles
WHERE university_id IS NOT NULL AND role <> 'super_admin'
ON CONFLICT (user_id, university_id) DO NOTHING;

INSERT INTO platform_admins (user_id)
SELECT id FROM profiles WHERE role = 'super_admin'
ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- The mirror follows memberships by trigger, so a write that skips the service
-- layer cannot leave a stale claim. A deactivated membership is removed from
-- the mirror rather than flagged, which keeps every helper a plain EXISTS.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_membership_claim()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    DELETE FROM membership_claims
      WHERE user_id = OLD.user_id AND university_id = OLD.university_id;
    RETURN OLD;
  END IF;

  IF NEW.deleted_at IS NOT NULL THEN
    DELETE FROM membership_claims
      WHERE user_id = NEW.user_id AND university_id = NEW.university_id;
    RETURN NEW;
  END IF;

  INSERT INTO membership_claims (user_id, university_id, role)
  VALUES (NEW.user_id, NEW.university_id, NEW.role)
  ON CONFLICT (user_id, university_id) DO UPDATE
    SET role = EXCLUDED.role, updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS sync_membership_claim_trigger ON memberships;
CREATE TRIGGER sync_membership_claim_trigger
  AFTER INSERT OR UPDATE OR DELETE ON memberships
  FOR EACH ROW EXECUTE FUNCTION sync_membership_claim();

INSERT INTO membership_claims (user_id, university_id, role)
SELECT user_id, university_id, role FROM memberships WHERE deleted_at IS NULL
ON CONFLICT (user_id, university_id) DO UPDATE
  SET role = EXCLUDED.role, updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Helpers. Every one reads membership_claims or platform_admins, and nothing
-- else, so each touches only rows the caller can already see under those
-- tables' own policies.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_member_of(check_uni_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM membership_claims
    WHERE user_id = auth.uid() AND university_id = check_uni_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION role_in(check_uni_id UUID) RETURNS user_role AS $$
  SELECT role FROM membership_claims
  WHERE user_id = auth.uid() AND university_id = check_uni_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION in_same_tenant(tenant_id UUID) RETURNS BOOLEAN AS $$
  SELECT is_super_admin() OR is_member_of(tenant_id);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_university_admin(check_uni_id UUID) RETURNS BOOLEAN AS $$
  SELECT role_in(check_uni_id) = 'admin'::user_role;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Staffness becomes a fact about a person in one organisation rather than a
-- global property of the account.
CREATE OR REPLACE FUNCTION is_staff_in(check_uni_id UUID) RETURNS BOOLEAN AS $$
  SELECT is_super_admin()
      OR role_in(check_uni_id) IN ('lecturer', 'department_admin', 'admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- Policies. The service role is the only writer of all three tables, as it
-- already is for profiles, so no INSERT, UPDATE or DELETE policy exists.
-- ---------------------------------------------------------------------------
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own membership claims" ON membership_claims;
CREATE POLICY "Users read own membership claims" ON membership_claims
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users read own platform admin row" ON platform_admins;
CREATE POLICY "Users read own platform admin row" ON platform_admins
FOR SELECT USING (user_id = auth.uid());

-- Safe to call a helper here: the helpers read membership_claims, not this
-- table, so this policy cannot re-enter itself.
DROP POLICY IF EXISTS "Members read organisation memberships" ON memberships;
CREATE POLICY "Members read organisation memberships" ON memberships
FOR SELECT USING (is_member_of(university_id));

GRANT SELECT ON public.memberships TO authenticated;
GRANT SELECT ON public.membership_claims TO authenticated;
GRANT SELECT ON public.platform_admins TO authenticated;
GRANT ALL ON public.memberships TO service_role;
GRANT ALL ON public.membership_claims TO service_role;
GRANT ALL ON public.platform_admins TO service_role;
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run tests/memberships.test.ts
```

Expected: PASS, 12 tests.

- [ ] **Step 5: Run the whole suite, to catch a regression in the existing SQL tests**

```bash
npm run test
```

Expected: PASS. `tests/profile-claims.test.ts` still passes — migration 040 is untouched, and 043 replaces the helper bodies without editing it.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/043_memberships.sql tests/memberships.test.ts
git commit -m "feat: hold the tenant and role on a membership, not the account"
```

---

### Task 2: Storage policies read membership

**Files:**
- Create: `supabase/migrations/044_storage_membership_policies.sql`
- Test: `tests/storage-membership-policies.test.ts`
- Reference (do not edit): `supabase/migrations/020_storage_tenant_policies.sql`

**Interfaces:**
- Consumes: `is_member_of(UUID)`, `is_staff_in(UUID)` from Task 1; `storage_tenant_id(TEXT) RETURNS UUID` from migration 020, unchanged.
- Produces: nothing later tasks call.

- [ ] **Step 1: Write the failing test**

Create `tests/storage-membership-policies.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
const read = (file: string) => fs.readFileSync(path.join(migrationsDir, file), 'utf8');

const migration = read('044_storage_membership_policies.sql');

describe('storage policies under membership', () => {
  it('scopes every bucket to a membership rather than to one tenant column', () => {
    expect(migration).not.toContain('current_university_id()');
    expect(migration).not.toContain('current_user_is_staff()');
    expect(migration).toContain('is_member_of(public.storage_tenant_id(name))');
  });

  it('makes staffness a fact about one organisation', () => {
    expect(migration).toContain('is_staff_in(public.storage_tenant_id(name))');
  });

  it('replaces every policy migration 020 created, leaving none behind', () => {
    const created = [...read('020_storage_tenant_policies.sql').matchAll(
      /CREATE POLICY "([^"]+)" ON storage\.objects/g,
    )].map((match) => match[1]);

    expect(created.length).toBeGreaterThan(0);

    for (const name of created) {
      expect(migration).toContain(`DROP POLICY IF EXISTS "${name}" ON storage.objects`);
    }
  });

  it('leaves the key convention alone, so no stored object has to move', () => {
    expect(migration).not.toContain('CREATE OR REPLACE FUNCTION public.storage_tenant_id');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/storage-membership-policies.test.ts
```

Expected: FAIL — `ENOENT ... 044_storage_membership_policies.sql`.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/044_storage_membership_policies.sql`:

```sql
-- Storage under membership.
--
-- Migration 020 scoped every bucket with
-- "storage_tenant_id(name) = current_university_id()", which asks which single
-- organisation the caller belongs to. That question no longer has one answer,
-- so each policy asks whether the caller belongs to the organisation that owns
-- the path instead.
--
-- current_user_is_staff() becomes is_staff_in(tenant): a lecturer at one school
-- is not staff everywhere, and under 020 that only held because the staff check
-- was ANDed with a single-tenant comparison that is now gone.
--
-- The key convention is unchanged - {university_id}/{scope}/{owner_id}/{file} -
-- so no stored object moves.

DROP POLICY IF EXISTS "Tenant read course resources" ON storage.objects;
DROP POLICY IF EXISTS "Staff upload course resources" ON storage.objects;
DROP POLICY IF EXISTS "Tenant read lesson video" ON storage.objects;
DROP POLICY IF EXISTS "Staff upload lesson video" ON storage.objects;
DROP POLICY IF EXISTS "Students upload own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Students read own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Staff read tenant submissions" ON storage.objects;
DROP POLICY IF EXISTS "Tenant read lecture thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Staff upload lecture thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Tenant read transcripts" ON storage.objects;
DROP POLICY IF EXISTS "Owner read exports" ON storage.objects;
DROP POLICY IF EXISTS "Staff create exports" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Owners update own objects" ON storage.objects;
DROP POLICY IF EXISTS "Owners delete own objects" ON storage.objects;

CREATE POLICY "Members read course resources" ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-resources'
  AND is_member_of(public.storage_tenant_id(name))
);

CREATE POLICY "Staff upload course resources" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-resources'
  AND is_staff_in(public.storage_tenant_id(name))
);

CREATE POLICY "Members read lesson video" ON storage.objects FOR SELECT
USING (
  bucket_id = 'lesson-video'
  AND is_member_of(public.storage_tenant_id(name))
);

CREATE POLICY "Staff upload lesson video" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-video'
  AND is_staff_in(public.storage_tenant_id(name))
);

CREATE POLICY "Students upload own submissions" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assignment-submissions'
  AND is_member_of(public.storage_tenant_id(name))
  AND split_part(name, '/', 3) = auth.uid()::text
);

CREATE POLICY "Students read own submissions" ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignment-submissions'
  AND split_part(name, '/', 3) = auth.uid()::text
);

CREATE POLICY "Staff read organisation submissions" ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignment-submissions'
  AND is_staff_in(public.storage_tenant_id(name))
);

CREATE POLICY "Members read lecture thumbnails" ON storage.objects FOR SELECT
USING (
  bucket_id = 'lecture-thumbnails'
  AND is_member_of(public.storage_tenant_id(name))
);

CREATE POLICY "Staff upload lecture thumbnails" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lecture-thumbnails'
  AND is_staff_in(public.storage_tenant_id(name))
);

CREATE POLICY "Members read transcripts" ON storage.objects FOR SELECT
USING (
  bucket_id = 'transcripts'
  AND is_member_of(public.storage_tenant_id(name))
);

CREATE POLICY "Owner read exports" ON storage.objects FOR SELECT
USING (bucket_id = 'exports' AND split_part(name, '/', 3) = auth.uid()::text);

CREATE POLICY "Staff create exports" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exports'
  AND is_staff_in(public.storage_tenant_id(name))
);

-- Profile images stay public-read because they render as avatars, and a person
-- has one avatar across every organisation, so this is not tenant-scoped.
CREATE POLICY "Users upload own profile image" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images'
  AND split_part(name, '/', 3) = auth.uid()::text
);

CREATE POLICY "Owners update own objects" ON storage.objects FOR UPDATE
USING (split_part(name, '/', 3) = auth.uid()::text)
WITH CHECK (split_part(name, '/', 3) = auth.uid()::text);

CREATE POLICY "Owners delete own objects" ON storage.objects FOR DELETE
USING (split_part(name, '/', 3) = auth.uid()::text);
```

- [ ] **Step 4: Run the tests**

```bash
npx vitest run tests/storage-membership-policies.test.ts && npm run test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/044_storage_membership_policies.sql tests/storage-membership-policies.test.ts
git commit -m "feat: scope storage to a membership rather than to one tenant column"
```

---

### Task 3: Membership lookup module

**Files:**
- Create: `lib/auth/membership.ts`
- Create: `tests/membership-lookup.test.ts`

**Interfaces:**
- Consumes: `AuthRole` from `types/auth`; `createSupabaseStub` from `tests/helpers/supabase-stub` (tests only).
- Produces, relied on by Tasks 4–8:
  - `interface Membership { userId: string; universityId: string; role: AuthRole; studentId: string | null; departmentId: string | null }`
  - `getMembership(client: SupabaseLike, userId: string, universityId: string): Promise<Membership | null>`
  - `isPlatformAdmin(client: SupabaseLike, userId: string): Promise<boolean>`
  - `addMembership(client: SupabaseLike, input: { userId: string; universityId: string; role: AuthRole; studentId?: string | null }): Promise<{ created: boolean }>`
  - `effectiveRole(membership: Membership | null, platformAdmin: boolean): AuthRole | null`
  - `type SupabaseLike = { from: (table: string) => any }`

- [ ] **Step 1: Write the failing test**

Create `tests/membership-lookup.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createSupabaseStub } from './helpers/supabase-stub';
import {
  addMembership,
  effectiveRole,
  getMembership,
  isPlatformAdmin,
} from '@/lib/auth/membership';

const ADA = 'user-ada';
const SCHOOL = 'uni-school';
const FIRM = 'uni-firm';

const seed = () =>
  createSupabaseStub({
    memberships: [
      {
        user_id: ADA,
        university_id: SCHOOL,
        role: 'student',
        student_id: 'SULVA/2026/0001',
        department_id: null,
        deleted_at: null,
      },
      {
        user_id: ADA,
        university_id: FIRM,
        role: 'lecturer',
        student_id: null,
        department_id: 'dept-1',
        deleted_at: null,
      },
    ],
    platform_admins: [{ user_id: 'user-root' }],
  });

describe('getMembership', () => {
  it('returns the role the person holds at that organisation, not another', async () => {
    const stub = seed();

    expect(await getMembership(stub.client, ADA, SCHOOL)).toEqual({
      userId: ADA,
      universityId: SCHOOL,
      role: 'student',
      studentId: 'SULVA/2026/0001',
      departmentId: null,
    });

    expect((await getMembership(stub.client, ADA, FIRM))?.role).toBe('lecturer');
  });

  it('returns null for an organisation the person does not belong to', async () => {
    const stub = seed();
    expect(await getMembership(stub.client, ADA, 'uni-other')).toBeNull();
  });

  it('treats a deactivated membership as no membership', async () => {
    const stub = createSupabaseStub({
      memberships: [
        {
          user_id: ADA,
          university_id: SCHOOL,
          role: 'student',
          student_id: null,
          department_id: null,
          deleted_at: '2026-08-01T00:00:00Z',
        },
      ],
    });

    expect(await getMembership(stub.client, ADA, SCHOOL)).toBeNull();
  });
});

describe('isPlatformAdmin', () => {
  it('is true only for an account in platform_admins', async () => {
    const stub = seed();
    expect(await isPlatformAdmin(stub.client, 'user-root')).toBe(true);
    expect(await isPlatformAdmin(stub.client, ADA)).toBe(false);
  });
});

describe('addMembership', () => {
  it('creates a membership for an account that already has one elsewhere', async () => {
    const stub = seed();

    const result = await addMembership(stub.client, {
      userId: ADA,
      universityId: 'uni-third',
      role: 'admin',
    });

    expect(result).toEqual({ created: true });
    expect(stub.inserted.memberships?.[0]).toMatchObject({
      user_id: ADA,
      university_id: 'uni-third',
      role: 'admin',
    });
  });

  it('reports an existing membership as not created, rather than as an error', async () => {
    const stub = seed();

    const result = await addMembership(stub.client, {
      userId: ADA,
      universityId: SCHOOL,
      role: 'student',
    });

    expect(result).toEqual({ created: false });
  });
});

describe('effectiveRole', () => {
  it('prefers the membership at the organisation being visited', () => {
    const membership = {
      userId: ADA,
      universityId: SCHOOL,
      role: 'student' as const,
      studentId: null,
      departmentId: null,
    };

    expect(effectiveRole(membership, false)).toBe('student');
    expect(effectiveRole(membership, true)).toBe('student');
  });

  it('falls back to super_admin only when there is no membership here', () => {
    expect(effectiveRole(null, true)).toBe('super_admin');
    expect(effectiveRole(null, false)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/membership-lookup.test.ts
```

Expected: FAIL — cannot resolve `@/lib/auth/membership`.

- [ ] **Step 3: Write the implementation**

Create `lib/auth/membership.ts`:

```ts
import type { AuthRole } from '@/types/auth';

/** Just enough of a Supabase client to read a table, so tests can stub it. */
export type SupabaseLike = { from: (table: string) => any };

export interface Membership {
  userId: string;
  universityId: string;
  role: AuthRole;
  studentId: string | null;
  departmentId: string | null;
}

const MEMBERSHIP_COLUMNS = 'user_id, university_id, role, student_id, department_id';

/**
 * The person's standing at one organisation.
 *
 * A deactivated membership reads as no membership: one organisation removing
 * someone must not touch their account or their standing anywhere else.
 */
export async function getMembership(
  client: SupabaseLike,
  userId: string,
  universityId: string,
): Promise<Membership | null> {
  const { data, error } = await client
    .from('memberships')
    .select(MEMBERSHIP_COLUMNS)
    .eq('user_id', userId)
    .eq('university_id', universityId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    console.error('Membership lookup failed:', error);
    return null;
  }
  if (!data) return null;

  return {
    userId: data.user_id,
    universityId: data.university_id,
    role: data.role as AuthRole,
    studentId: data.student_id ?? null,
    departmentId: data.department_id ?? null,
  };
}

/** Platform administration is a property of the account, not of a membership. */
export async function isPlatformAdmin(client: SupabaseLike, userId: string): Promise<boolean> {
  const { data, error } = await client
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Platform admin lookup failed:', error);
    return false;
  }

  return Boolean(data);
}

/**
 * Adds someone to an organisation. Already being a member is the goal state,
 * not a failure, so it reports `created: false` rather than throwing.
 */
export async function addMembership(
  client: SupabaseLike,
  input: {
    userId: string;
    universityId: string;
    role: AuthRole;
    studentId?: string | null;
    departmentId?: string | null;
  },
): Promise<{ created: boolean }> {
  const existing = await getMembership(client, input.userId, input.universityId);
  if (existing) return { created: false };

  const { error } = await client.from('memberships').insert({
    user_id: input.userId,
    university_id: input.universityId,
    role: input.role,
    student_id: input.studentId ?? null,
    department_id: input.departmentId ?? null,
  });

  // 23505 means someone else won the race, which lands in the same state.
  if (error && (error as { code?: string }).code !== '23505') {
    throw new Error(error.message);
  }

  return { created: !error };
}

/**
 * The role to authorise this request with.
 *
 * The membership at the organisation being visited wins: a platform admin who
 * is also a lecturer somewhere acts as a lecturer there.
 */
export function effectiveRole(
  membership: Membership | null,
  platformAdmin: boolean,
): AuthRole | null {
  if (membership) return membership.role;
  return platformAdmin ? 'super_admin' : null;
}
```

- [ ] **Step 4: Run the tests**

```bash
npx vitest run tests/membership-lookup.test.ts
```

Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/membership.ts tests/membership-lookup.test.ts
git commit -m "feat: read a person's standing at one organisation"
```

---

### Task 4: Tenant-aware session and guards

**Files:**
- Modify: `types/auth.ts`
- Modify: `lib/auth/session.ts`
- Modify: `lib/auth/guards.ts`
- Create: `tests/session-membership.test.ts`

**Interfaces:**
- Consumes: `getMembership`, `isPlatformAdmin`, `effectiveRole`, `Membership` from Task 3; `getTenantContext()` from `lib/tenant/context`.
- Produces, relied on by Tasks 5–8: `SessionData` gains `membership: Membership | null`, `isPlatformAdmin: boolean`, `role: AuthRole | null`; `UserProfile` loses `university_id`, `role`, `student_id`. `requireUser()` and `requireRole()` keep their names and return the new `SessionData`. `requireUniversityAccess(targetUniversityId)` unchanged in name.

- [ ] **Step 1: Write the failing test**

Create `tests/session-membership.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildSession } from '@/lib/auth/session';
import { createSupabaseStub } from './helpers/supabase-stub';

const ADA = 'user-ada';
const SCHOOL = 'uni-school';

const profile = {
  id: ADA,
  first_name: 'Ada',
  last_name: 'Lovelace',
  avatar_url: null,
  email: 'ada@example.com',
};

describe('buildSession', () => {
  it('reports the role held at the organisation being visited', async () => {
    const stub = createSupabaseStub({
      profiles: [profile],
      memberships: [
        { user_id: ADA, university_id: SCHOOL, role: 'lecturer', student_id: null, department_id: null, deleted_at: null },
        { user_id: ADA, university_id: 'uni-firm', role: 'student', student_id: null, department_id: null, deleted_at: null },
      ],
      platform_admins: [],
    });

    const session = await buildSession(
      stub.client,
      { id: ADA, email: 'ada@example.com' },
      SCHOOL,
    );

    expect(session.role).toBe('lecturer');
    expect(session.membership?.universityId).toBe(SCHOOL);
    expect(session.isPlatformAdmin).toBe(false);
  });

  it('has no role at an organisation the person does not belong to', async () => {
    const stub = createSupabaseStub({
      profiles: [profile],
      memberships: [],
      platform_admins: [],
    });

    const session = await buildSession(stub.client, { id: ADA, email: 'ada@example.com' }, SCHOOL);

    expect(session.role).toBeNull();
    expect(session.membership).toBeNull();
    expect(session.profile?.id).toBe(ADA);
  });

  it('gives a platform admin a role on the root domain, where there is no tenant', async () => {
    const stub = createSupabaseStub({
      profiles: [{ ...profile, id: 'user-root' }],
      memberships: [],
      platform_admins: [{ user_id: 'user-root' }],
    });

    const session = await buildSession(stub.client, { id: 'user-root', email: 'root@sulva.com' }, null);

    expect(session.role).toBe('super_admin');
    expect(session.isPlatformAdmin).toBe(true);
  });

  it('returns an empty session when nobody is signed in', async () => {
    const stub = createSupabaseStub({ profiles: [], memberships: [], platform_admins: [] });

    const session = await buildSession(stub.client, null, SCHOOL);

    expect(session).toEqual({
      user: null,
      profile: null,
      membership: null,
      isPlatformAdmin: false,
      role: null,
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/session-membership.test.ts
```

Expected: FAIL — `buildSession` is not exported from `@/lib/auth/session`.

- [ ] **Step 3: Update the types**

In `types/auth.ts`, replace `UserProfile` and `SessionData`:

```ts
export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  email: string | null;
}

export interface SessionData {
  user: {
    id: string;
    email: string;
  } | null;
  profile: UserProfile | null;
  /** The person's standing at the organisation this request is for. */
  membership: import('@/lib/auth/membership').Membership | null;
  isPlatformAdmin: boolean;
  /** The role to authorise this request with; null when there is none. */
  role: AuthRole | null;
}
```

- [ ] **Step 4: Rewrite the session**

Replace the body of `lib/auth/session.ts`:

```ts
import { createClient } from '../supabase/server';
import { createAdminClient } from '../supabase/admin';
import { getTenantContext } from '../tenant/context';
import { effectiveRole, getMembership, isPlatformAdmin, type SupabaseLike } from './membership';
import { SessionData } from '@/types/auth';

const EMPTY: SessionData = {
  user: null,
  profile: null,
  membership: null,
  isPlatformAdmin: false,
  role: null,
};

/**
 * Assembles a session from an already-authenticated user and the organisation
 * the request is for. Separated from getSession so it can be tested without a
 * request, and so the tenant is an argument rather than ambient state.
 */
export async function buildSession(
  client: SupabaseLike,
  user: { id: string; email: string } | null,
  universityId: string | null,
): Promise<SessionData> {
  if (!user) return EMPTY;

  const { data: profile, error } = await client
    .from('profiles')
    .select('id, first_name, last_name, avatar_url, email')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Session profile fetch error:', error);
  }

  const [membership, platformAdmin] = await Promise.all([
    universityId ? getMembership(client, user.id, universityId) : Promise.resolve(null),
    isPlatformAdmin(client, user.id),
  ]);

  return {
    user,
    profile: profile ?? null,
    membership,
    isPlatformAdmin: platformAdmin,
    role: effectiveRole(membership, platformAdmin),
  };
}

export async function getSession(): Promise<SessionData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return EMPTY;

  const tenant = await getTenantContext();

  return buildSession(
    createAdminClient() as unknown as SupabaseLike,
    { id: user.id, email: user.email || '' },
    tenant?.universityId ?? null,
  );
}

export async function clearSession() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
```

- [ ] **Step 5: Update the guards**

Replace `lib/auth/guards.ts`:

```ts
import { getSession } from './session';
import { redirect } from 'next/navigation';
import { AuthRole, SessionData } from '@/types/auth';
import { hasRequiredRole } from './permissions';

export type ActiveSession = SessionData & {
  user: NonNullable<SessionData['user']>;
  profile: NonNullable<SessionData['profile']>;
};

export async function requireUser(): Promise<ActiveSession> {
  const session = await getSession();
  if (!session.user || !session.profile) {
    redirect('/login');
  }
  return session as ActiveSession;
}

export async function requireRole(role: AuthRole): Promise<ActiveSession> {
  const session = await requireUser();
  // No membership at this organisation means no role here, whatever the person
  // holds elsewhere.
  if (!session.role || !hasRequiredRole(session.role, role)) {
    if (session.role === 'super_admin') redirect('/superadmin');
    if (session.role === 'admin') redirect('/admin');
    if (session.role === 'lecturer') redirect('/lecturer');
    if (session.role === 'student') redirect('/student');
    redirect('/unauthorized');
  }
  return session;
}

export async function requireUniversityAccess(targetUniversityId: string): Promise<ActiveSession> {
  const session = await requireUser();
  if (session.isPlatformAdmin) return session;

  if (session.membership?.universityId !== targetUniversityId) {
    redirect('/unauthorized');
  }
  return session;
}

export async function getCurrentUserProfile() {
  const session = await getSession();
  return session.profile;
}

export async function getCurrentUserRole() {
  const session = await getSession();
  return session.role;
}
```

- [ ] **Step 6: Run the tests**

```bash
npx vitest run tests/session-membership.test.ts
```

Expected: PASS, 4 tests. `npm run typecheck` will still fail at this point — call sites reading `session.profile.role` are fixed in Task 8. That is expected and is why Task 8 exists.

- [ ] **Step 7: Commit**

```bash
git add types/auth.ts lib/auth/session.ts lib/auth/guards.ts tests/session-membership.test.ts
git commit -m "feat: resolve the session's role from the organisation being visited"
```

---

### Task 5: Middleware admits members of the host organisation

**Files:**
- Modify: `lib/supabase/middleware.ts:137-170`
- Create: `tests/middleware-membership.test.ts`

**Interfaces:**
- Consumes: `getMembership`, `isPlatformAdmin`, `effectiveRole` from Task 3.
- Produces: `resolveAccess(client, userId, tenantId)` exported from `lib/auth/membership-access.ts`, returning `{ hasProfile: boolean; role: AuthRole | null; isPlatformAdmin: boolean }`.

- [ ] **Step 1: Write the failing test**

Create `tests/middleware-membership.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createSupabaseStub } from './helpers/supabase-stub';
import { resolveAccess } from '@/lib/auth/membership-access';

const ADA = 'user-ada';
const SCHOOL = 'uni-school';
const FIRM = 'uni-firm';

const stubWith = (memberships: any[], platformAdmins: any[] = []) =>
  createSupabaseStub({
    profiles: [{ id: ADA, first_name: 'Ada', last_name: 'Lovelace' }],
    memberships,
    platform_admins: platformAdmins,
  });

describe('resolveAccess', () => {
  it('admits a member of the host organisation with the role they hold there', async () => {
    const stub = stubWith([
      { user_id: ADA, university_id: SCHOOL, role: 'admin', student_id: null, department_id: null, deleted_at: null },
    ]);

    expect(await resolveAccess(stub.client, ADA, SCHOOL)).toEqual({
      hasProfile: true,
      role: 'admin',
      isPlatformAdmin: false,
    });
  });

  it('refuses a member of a different organisation', async () => {
    const stub = stubWith([
      { user_id: ADA, university_id: FIRM, role: 'admin', student_id: null, department_id: null, deleted_at: null },
    ]);

    expect((await resolveAccess(stub.client, ADA, SCHOOL)).role).toBeNull();
  });

  it('refuses a membership that has been deactivated at this organisation', async () => {
    const stub = stubWith([
      { user_id: ADA, university_id: SCHOOL, role: 'admin', student_id: null, department_id: null, deleted_at: '2026-08-01T00:00:00Z' },
    ]);

    expect((await resolveAccess(stub.client, ADA, SCHOOL)).role).toBeNull();
  });

  it('admits a platform admin to any host', async () => {
    const stub = stubWith([], [{ user_id: ADA }]);

    expect(await resolveAccess(stub.client, ADA, SCHOOL)).toEqual({
      hasProfile: true,
      role: 'super_admin',
      isPlatformAdmin: true,
    });
  });

  it('reports a missing profile so the caller can send them to onboarding', async () => {
    const stub = createSupabaseStub({ profiles: [], memberships: [], platform_admins: [] });

    expect(await resolveAccess(stub.client, ADA, SCHOOL)).toEqual({
      hasProfile: false,
      role: null,
      isPlatformAdmin: false,
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/middleware-membership.test.ts
```

Expected: FAIL — cannot resolve `@/lib/auth/membership-access`.

- [ ] **Step 3: Write the implementation**

Create `lib/auth/membership-access.ts`:

```ts
import type { AuthRole } from '@/types/auth';
import { effectiveRole, getMembership, isPlatformAdmin, type SupabaseLike } from './membership';

export interface Access {
  /** Whether onboarding has run for this account at all. */
  hasProfile: boolean;
  /** The role held at the host organisation; null means no access here. */
  role: AuthRole | null;
  isPlatformAdmin: boolean;
}

/**
 * What an authenticated account may do on one host.
 *
 * Kept out of the middleware itself so it can be tested without a request, and
 * so the middleware reads as routing rather than as authorisation.
 */
export async function resolveAccess(
  client: SupabaseLike,
  userId: string,
  tenantId: string | null,
): Promise<Access> {
  const { data: profile, error } = await client
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Middleware profile fetch error:', error);
  }

  const [membership, platformAdmin] = await Promise.all([
    tenantId ? getMembership(client, userId, tenantId) : Promise.resolve(null),
    isPlatformAdmin(client, userId),
  ]);

  return {
    hasProfile: Boolean(profile),
    role: effectiveRole(membership, platformAdmin),
    isPlatformAdmin: platformAdmin,
  };
}
```

- [ ] **Step 4: Rewire the middleware**

In `lib/supabase/middleware.ts`, replace the block from `const adminClient = createAdminClient()` through the end of the role check with:

```ts
    const adminClient = createAdminClient()
    const access = await resolveAccess(adminClient as any, user.id, tenantId)

    // Authenticated invited users without a profile must finish onboarding.
    if (!access.hasProfile && !pathname.startsWith('/onboarding') && !pathname.startsWith('/reset-password')) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding/profile'
      url.search = ''
      return NextResponse.redirect(url)
    }

    // An account with no standing at this school must not be usable on its
    // host. Cookies carry no Domain attribute, so signing out here never
    // touches the person's session at another school.
    if (access.hasProfile && tenantId && !access.role) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.search = '?error=wrong-school'
      return NextResponse.redirect(url)
    }

    // Completed users should not re-enter onboarding.
    if (access.hasProfile && pathname.startsWith('/onboarding')) {
      const url = request.nextUrl.clone()
      url.pathname = getRoleRedirectPath(access.role)
      url.search = ''
      return NextResponse.redirect(url)
    }

    const requiredRole = getRequiredRoleForPath(pathname)
    if (access.role && requiredRole && !canAccessRolePath(access.role, requiredRole)) {
      const url = request.nextUrl.clone()
      url.pathname = getRoleRedirectPath(access.role)
      url.search = ''
      return NextResponse.redirect(url)
    }
```

Add the import at the top and drop the now-unused `AuthRole` import if TypeScript reports it:

```ts
import { resolveAccess } from '@/lib/auth/membership-access'
```

- [ ] **Step 5: Run the tests**

```bash
npx vitest run tests/middleware-membership.test.ts && npm run test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/auth/membership-access.ts lib/supabase/middleware.ts tests/middleware-membership.test.ts
git commit -m "feat: admit a person to a host by their membership of it"
```

---

### Task 6: Onboarding creates a membership

**Files:**
- Modify: `app/actions/onboarding.ts:56-95`
- Create: `tests/onboarding-membership.test.ts`

**Interfaces:**
- Consumes: `addMembership` from Task 3.
- Produces: `completeOnboardingProfile(client, input)` exported from `lib/auth/onboarding-write.ts`, returning `{ redirectTo: string }`.

- [ ] **Step 1: Write the failing test**

Create `tests/onboarding-membership.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createSupabaseStub } from './helpers/supabase-stub';
import { completeOnboardingProfile } from '@/lib/auth/onboarding-write';

const ADA = 'user-ada';
const SCHOOL = 'uni-school';

const input = {
  userId: ADA,
  email: 'ada@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  avatarUrl: null,
  studentId: 'SULVA/2026/0001',
  role: 'student' as const,
  universityId: SCHOOL,
};

describe('completeOnboardingProfile', () => {
  it('writes the identity to profiles and the standing to memberships', async () => {
    const stub = createSupabaseStub({ profiles: [], memberships: [], platform_admins: [] });

    const result = await completeOnboardingProfile(stub.client, input);

    expect(result.redirectTo).toBe('/student');
    expect(stub.inserted.profiles?.[0]).toMatchObject({ id: ADA, first_name: 'Ada' });
    expect(stub.inserted.profiles?.[0]).not.toHaveProperty('role');
    expect(stub.inserted.profiles?.[0]).not.toHaveProperty('university_id');
    expect(stub.inserted.memberships?.[0]).toMatchObject({
      user_id: ADA,
      university_id: SCHOOL,
      role: 'student',
      student_id: 'SULVA/2026/0001',
    });
  });

  it('adds a second organisation to an account that already has a profile', async () => {
    const stub = createSupabaseStub({
      profiles: [{ id: ADA, first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com' }],
      memberships: [
        { user_id: ADA, university_id: 'uni-firm', role: 'lecturer', student_id: null, department_id: null, deleted_at: null },
      ],
      platform_admins: [],
    });

    await completeOnboardingProfile(stub.client, input);

    expect(stub.inserted.memberships?.[0]).toMatchObject({
      user_id: ADA,
      university_id: SCHOOL,
      role: 'student',
    });
  });

  it('treats an existing membership as success, not as an error', async () => {
    const stub = createSupabaseStub({
      profiles: [{ id: ADA, first_name: 'Ada', last_name: 'Lovelace' }],
      memberships: [
        { user_id: ADA, university_id: SCHOOL, role: 'student', student_id: null, department_id: null, deleted_at: null },
      ],
      platform_admins: [],
    });

    const result = await completeOnboardingProfile(stub.client, input);

    expect(result.redirectTo).toBe('/student');
    expect(stub.inserted.memberships ?? []).toEqual([]);
  });

  it('records a platform administrator in platform_admins, never as a membership', async () => {
    const stub = createSupabaseStub({ profiles: [], memberships: [], platform_admins: [] });

    const result = await completeOnboardingProfile(stub.client, {
      ...input,
      role: 'super_admin',
      universityId: null,
      studentId: null,
    });

    expect(result.redirectTo).toBe('/superadmin');
    expect(stub.inserted.platform_admins?.[0]).toMatchObject({ user_id: ADA });
    expect(stub.inserted.memberships ?? []).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/onboarding-membership.test.ts
```

Expected: FAIL — cannot resolve `@/lib/auth/onboarding-write`.

- [ ] **Step 3: Write the implementation**

Create `lib/auth/onboarding-write.ts`:

```ts
import type { AuthRole } from '@/types/auth';
import { getRoleRedirectPath } from './redirects';
import { addMembership, type SupabaseLike } from './membership';

export interface OnboardingInput {
  userId: string;
  email: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  studentId: string | null;
  role: AuthRole;
  universityId: string | null;
}

/**
 * Writes what onboarding produces: one identity, and one standing at one
 * organisation. The identity is shared across every organisation the person
 * joins, so a second invite adds a membership and leaves the profile alone.
 */
export async function completeOnboardingProfile(
  client: SupabaseLike,
  input: OnboardingInput,
): Promise<{ redirectTo: string }> {
  const { error: profileError } = await client
    .from('profiles')
    .upsert(
      {
        id: input.userId,
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        avatar_url: input.avatarUrl,
      },
      { onConflict: 'id' },
    );

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (input.role === 'super_admin') {
    const { error } = await client
      .from('platform_admins')
      .upsert({ user_id: input.userId }, { onConflict: 'user_id' });
    if (error) throw new Error(error.message);
    return { redirectTo: getRoleRedirectPath('super_admin') };
  }

  if (!input.universityId) {
    throw new Error('This account is missing university assignment metadata. Ask an administrator to resend the invite.');
  }

  await addMembership(client, {
    userId: input.userId,
    universityId: input.universityId,
    role: input.role,
    studentId: input.role === 'student' ? input.studentId : null,
  });

  return { redirectTo: getRoleRedirectPath(input.role) };
}
```

- [ ] **Step 4: Rewire the action**

In `app/actions/onboarding.ts`, replace the `adminClient.from('profiles').insert(...)` block and the error handling that follows it (down to and including the `if (error) { ... }` block) with:

```ts
  const adminClient = createAdminClient();

  let redirectTo: string;
  try {
    ({ redirectTo } = await completeOnboardingProfile(adminClient as any, {
      userId: user.id,
      email: user.email ?? null,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      avatarUrl: parsed.data.avatarUrl || null,
      studentId: parsed.data.studentId || null,
      role: finalRole,
      universityId: finalRole === 'super_admin' ? null : finalUniversityId ?? null,
    }));
  } catch (thrown) {
    console.error('Profile creation error:', thrown);
    return { error: 'Failed to complete profile. Try again.' };
  }
```

Then change the audit log insert and the return to use the new value:

```ts
  await adminClient.from('audit_logs').insert({
    university_id: finalUniversityId || null,
    user_id: user.id,
    action: 'USER_ONBOARDED',
    entity_type: 'profiles',
    entity_id: user.id,
    metadata: { role: finalRole, method: 'invite' },
  });

  return { success: true, redirectTo };
```

Add the import:

```ts
import { completeOnboardingProfile } from '@/lib/auth/onboarding-write';
```

Delete the now-unused `getRoleRedirectPath` import if TypeScript reports it, and remove the earlier `const redirectTo = getRoleRedirectPath(finalRole);` line.

- [ ] **Step 5: Run the tests**

```bash
npx vitest run tests/onboarding-membership.test.ts tests/onboarding.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/auth/onboarding-write.ts app/actions/onboarding.ts tests/onboarding-membership.test.ts
git commit -m "feat: let onboarding add an organisation to an existing account"
```

---

### Task 7: Inviting an address that already has an account

**Files:**
- Modify: `lib/auth/invites.ts`
- Modify: `lib/email/templates.ts`
- Create: `tests/invite-existing-account.test.ts`

**Interfaces:**
- Consumes: `addMembership` from Task 3; `sendEmail`, `isEmailConfigured`, `EmailBody` from `lib/email/send`.
- Produces: `renderOrganisationAddedEmail(input)` from `lib/email/templates`; `sendUserInvite` gains a return shape of `{ userId: string | null; added: 'invited' | 'membership' }`.

- [ ] **Step 1: Write the failing test**

Create `tests/invite-existing-account.test.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest';
import { __setEmailSenderForTests } from '@/lib/email/send';
import { renderOrganisationAddedEmail } from '@/lib/email/templates';
import { createSupabaseStub } from './helpers/supabase-stub';
import { addExistingAccountToOrganisation } from '@/lib/auth/invites';

afterEach(() => __setEmailSenderForTests(null));

describe('renderOrganisationAddedEmail', () => {
  it('names the organisation and links to its own address', () => {
    const body = renderOrganisationAddedEmail({
      name: 'Ada',
      organisationName: 'Sulva Institute',
      url: 'https://sulva-institute.sulva.com/login',
    });

    expect(body.subject).toContain('Sulva Institute');
    expect(body.html).toContain('https://sulva-institute.sulva.com/login');
    expect(body.text).toContain('Sulva Institute');
  });

  it('says the existing password still works, so nobody resets one they have', () => {
    const body = renderOrganisationAddedEmail({
      name: 'Ada',
      organisationName: 'Sulva Institute',
      url: 'https://sulva-institute.sulva.com/login',
    });

    expect(body.text.toLowerCase()).toContain('password you already use');
  });
});

describe('addExistingAccountToOrganisation', () => {
  it('creates the membership and reports it, without touching auth', async () => {
    const sent: any[] = [];
    __setEmailSenderForTests({ async send(message) { sent.push(message); } });

    const stub = createSupabaseStub({
      profiles: [{ id: 'user-ada', email: 'ada@example.com', first_name: 'Ada', last_name: 'Lovelace' }],
      memberships: [],
      platform_admins: [],
    });

    const result = await addExistingAccountToOrganisation(stub.client, {
      userId: 'user-ada',
      email: 'ada@example.com',
      firstName: 'Ada',
      universityId: 'uni-school',
      role: 'lecturer',
      organisationName: 'Sulva Institute',
      baseUrl: 'https://sulva-institute.sulva.com',
    });

    expect(result).toEqual({ userId: 'user-ada', added: 'membership' });
    expect(stub.inserted.memberships?.[0]).toMatchObject({
      user_id: 'user-ada',
      university_id: 'uni-school',
      role: 'lecturer',
    });
    expect(sent[0].to).toBe('ada@example.com');
    expect(sent[0].subject).toContain('Sulva Institute');
  });

  it('is idempotent: adding an existing member sends nothing', async () => {
    const sent: any[] = [];
    __setEmailSenderForTests({ async send(message) { sent.push(message); } });

    const stub = createSupabaseStub({
      profiles: [{ id: 'user-ada', email: 'ada@example.com' }],
      memberships: [
        { user_id: 'user-ada', university_id: 'uni-school', role: 'lecturer', student_id: null, department_id: null, deleted_at: null },
      ],
      platform_admins: [],
    });

    await addExistingAccountToOrganisation(stub.client, {
      userId: 'user-ada',
      email: 'ada@example.com',
      firstName: 'Ada',
      universityId: 'uni-school',
      role: 'lecturer',
      organisationName: 'Sulva Institute',
      baseUrl: 'https://sulva-institute.sulva.com',
    });

    expect(sent).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/invite-existing-account.test.ts
```

Expected: FAIL — `renderOrganisationAddedEmail` is not exported.

- [ ] **Step 3: Add the template**

Append to `lib/email/templates.ts`:

```ts
export function renderOrganisationAddedEmail(input: {
  name: string;
  organisationName: string;
  url: string;
}): EmailBody {
  const subject = `You have been added to ${input.organisationName}`;
  const html = layout(
    subject,
    `<p style="margin:0;color:#cbd5f5;line-height:1.6">Hi ${escapeHtml(input.name)}, you now have access to
     <strong style="color:#ffffff">${escapeHtml(input.organisationName)}</strong> on Sulva.
     Sign in with the password you already use — there is nothing new to set up.</p>`,
    input.url,
    `Open ${input.organisationName}`,
  );
  const text = `Hi ${input.name}, you now have access to ${input.organisationName} on Sulva. Sign in with the password you already use: ${input.url}`;
  return { subject, html, text };
}
```

- [ ] **Step 4: Rewrite the invite**

Replace `lib/auth/invites.ts`:

```ts
import { createAdminClient } from '@/lib/supabase/admin';
import { AuthRole } from '@/types/auth';
import { env } from '@/lib/env';
import { addMembership, type SupabaseLike } from './membership';
import { isEmailConfigured, sendEmail } from '@/lib/email/send';
import { renderOrganisationAddedEmail } from '@/lib/email/templates';

export interface UserInvitePayload {
  email: string;
  role: AuthRole;
  universityId?: string | null;
  firstName?: string;
  lastName?: string;
  /** Origin the invite link should land on, e.g. https://unilag.sulva.com. */
  baseUrl?: string;
  /** Shown in the email when the address already has an account. */
  organisationName?: string;
}

export interface InviteResult {
  userId: string | null;
  added: 'invited' | 'membership';
}

/**
 * Adds an account that already exists to another organisation.
 *
 * inviteUserByEmail refuses a registered address, and re-inviting would be
 * wrong anyway: the person has a password and an identity already, and only
 * their standing at this organisation is new.
 */
export async function addExistingAccountToOrganisation(
  client: SupabaseLike,
  input: {
    userId: string;
    email: string;
    firstName?: string;
    universityId: string;
    role: AuthRole;
    organisationName: string;
    baseUrl: string;
  },
): Promise<InviteResult> {
  const { created } = await addMembership(client, {
    userId: input.userId,
    universityId: input.universityId,
    role: input.role,
  });

  if (created && isEmailConfigured()) {
    const body = renderOrganisationAddedEmail({
      name: input.firstName || 'there',
      organisationName: input.organisationName,
      url: `${input.baseUrl}/login`,
    });
    await sendEmail({ to: input.email, ...body });
  }

  return { userId: input.userId, added: 'membership' };
}

/**
 * Sends a secure invite via the Supabase Service Role client.
 * This guarantees role assignment and prevents client-side tampering.
 */
export async function sendUserInvite(payload: UserInvitePayload): Promise<InviteResult> {
  const adminClient = createAdminClient();
  const appUrl = payload.baseUrl || env.NEXT_PUBLIC_APP_URL;
  const normalizedUniversityId = payload.role === 'super_admin' ? null : payload.universityId;

  const { data: existing } = await adminClient
    .from('profiles')
    .select('id, first_name')
    .eq('email', payload.email)
    .maybeSingle();

  let result: InviteResult;

  if (existing && normalizedUniversityId) {
    result = await addExistingAccountToOrganisation(adminClient as unknown as SupabaseLike, {
      userId: existing.id,
      email: payload.email,
      firstName: payload.firstName || existing.first_name || undefined,
      universityId: normalizedUniversityId,
      role: payload.role,
      organisationName: payload.organisationName || 'your new organisation',
      baseUrl: appUrl,
    });
  } else {
    const { data: { user }, error: authError } = await adminClient.auth.admin.inviteUserByEmail(payload.email, {
      data: {
        role: payload.role,
        university_id: normalizedUniversityId,
        first_name: payload.firstName,
        last_name: payload.lastName,
      },
      redirectTo: `${appUrl}/auth/callback?next=/onboarding/profile`,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    result = { userId: user?.id ?? null, added: 'invited' };
  }

  await adminClient.from('audit_logs').insert({
    university_id: normalizedUniversityId,
    user_id: result.userId,
    action: 'USER_INVITED',
    entity_type: 'auth_users',
    metadata: { email: payload.email, role: payload.role, method: result.added },
  });

  return result;
}
```

- [ ] **Step 5: Run the tests**

```bash
npx vitest run tests/invite-existing-account.test.ts tests/email.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/auth/invites.ts lib/email/templates.ts tests/invite-existing-account.test.ts
git commit -m "feat: add an existing account to a second organisation by invite"
```

---

### Task 8: Move every remaining read off profiles.role and profiles.university_id

**Files:**
- Modify: `app/actions/admin/users.ts`
- Modify: `app/api/admin/users/route.ts`
- Modify: `lib/services/core-read.service.ts:363-374`
- Modify: `lib/services/report.service.ts:25-32`
- Modify: `lib/services/notification.service.ts:77-84`
- Modify: `lib/services/discussion.service.ts:19-24`
- Modify: `lib/services/training-assignment.service.ts:86-114`
- Modify: every remaining call site reporting a type error (enumerated in Step 1)

**Interfaces:**
- Consumes: `getMembership`, `addMembership` from Task 3; the new `SessionData` shape from Task 4.
- Produces: `CoreReadService.getAdminUsers(universityId, role?)` keeps its signature and return shape (`id, first_name, last_name, email, role, student_id, created_at`).

- [ ] **Step 1: List every call site the new session shape breaks**

```bash
npm run typecheck 2>&1 | grep -E "university_id|\.role" | sort -u
```

Expected: a list of errors in `app/`, `components/` and `lib/`. Work through it; the following steps cover the non-obvious ones. Every remaining site is the same mechanical change: `session.profile.role` → `session.role`, and `session.profile.university_id` → `session.membership?.universityId`.

- [ ] **Step 2: Rewrite the admin user listing**

In `lib/services/core-read.service.ts`, replace `getAdminUsers`:

```ts
  async getAdminUsers(universityId: string, role?: string) {
    // Members, not accounts: the same person may hold a different role at a
    // different organisation, and only this one's standing belongs here.
    let query = this.supabase
      .from('memberships')
      .select('role, student_id, created_at, profiles!inner(id, first_name, last_name, email)')
      .eq('university_id', universityId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (role) query = query.eq('role', role);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row: any) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return {
        id: profile?.id,
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        email: profile?.email,
        role: row.role,
        student_id: row.student_id,
        created_at: row.created_at,
      };
    });
  }
```

- [ ] **Step 3: Rewrite the remaining service reads**

`lib/services/report.service.ts`, in `getUniversityOverview`, replace the student count query:

```ts
      this.supabase.from('memberships').select('user_id', { count: 'exact', head: true }).eq('university_id', universityId).eq('role', 'student').is('deleted_at', null),
```

`lib/services/notification.service.ts`, in `sendToUniversityUsers`, replace the recipient query and the mapping that follows it:

```ts
    const { data: users } = await this.supabase
      .from('memberships')
      .select('user_id')
      .eq('university_id', universityId)
      .is('deleted_at', null);
    if (!users || users.length === 0) return;

    const payloads = users.map(u => ({
      university_id: universityId,
      user_id: u.user_id,
```

`lib/services/discussion.service.ts`, in `replyToDiscussion`, replace the role lookup:

```ts
    // Endorsement follows the role held at this organisation, not one held
    // somewhere else.
    const { data: membership } = await this.supabase
      .from('memberships')
      .select('role')
      .eq('user_id', authorId)
      .eq('university_id', universityId)
      .is('deleted_at', null)
      .maybeSingle();
    const isLecturer = membership?.role === 'lecturer';
```

`lib/services/training-assignment.service.ts`, in `assignTeam`, replace the member query:

```ts
    // profiles has never had a department_id, so this filter returned 42703 on
    // every call. The department is a fact about a person at one organisation,
    // so it lives on the membership.
    const { data: members } = await this.supabase
      .from('memberships')
      .select('user_id')
      .eq('university_id', params.universityId)
      .eq('department_id', params.departmentId)
      .eq('role', 'student')
      .is('deleted_at', null);

    const assigned = [];
    for (const member of members || []) {
      assigned.push(
        await this.assign({
          universityId: params.universityId,
          courseSectionId: params.courseSectionId,
          studentId: member.user_id,
          dueOn: params.dueOn,
          assignedBy: params.assignedBy,
        }),
      );
    }
    return assigned;
```

- [ ] **Step 4: Rewrite the admin actions**

In `app/actions/admin/users.ts`, replace `updateUserRoleAction`'s body between `const parsed = ...` and the audit log with:

```ts
    const universityId = session.membership?.universityId;
    if (!universityId) throw new Error('Forbidden');

    const { data: membership, error: membershipErr } = await adminClient
      .from('memberships')
      .select('user_id')
      .eq('user_id', userId)
      .eq('university_id', universityId)
      .is('deleted_at', null)
      .maybeSingle();
    if (!membership || membershipErr) throw new Error('User not found');

    const { error: updateErr } = await adminClient.from('memberships')
      .update({ role: parsed.role, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('university_id', universityId);

    if (updateErr) throw new Error(updateErr.message);
```

and change the audit entry's `universityId` and `entityType`:

```ts
      universityId,
      userId: session.user.id,
      action: 'ADMIN_USER_ROLE_CHANGED',
      entityType: 'memberships',
```

In `inviteUserAction`, replace the two `session.profile` reads and pass the organisation name through:

```ts
    const currentRole = session.role;
    const targetUniversityId = currentRole === 'super_admin'
      ? parsed.universityId ?? null
      : session.membership?.universityId ?? null;
```

and extend the `sendUserInvite` call with the tenant's name, which the email needs:

```ts
    const tenant = await getTenantContext();

    const invite = await sendUserInvite({
      email: parsed.email,
      role: parsed.role,
      universityId: targetUniversityId,
      firstName: parsed.firstName || undefined,
      lastName: parsed.lastName || undefined,
      organisationName: tenant?.name || 'your new organisation',
      // Without this the invitation lands on the platform root, where the
      // person it was sent to has no account and no school.
      baseUrl: await getEmailLinkOrigin(),
    });
```

then return `invite.userId` in place of `user?.id ?? null`, and add the import:

```ts
import { getTenantContext } from '@/lib/tenant/context';
```

- [ ] **Step 5: Rewrite the admin users API route**

In `app/api/admin/users/route.ts`, replace the query:

```ts
    const universityId = session.membership?.universityId;
    if (!universityId) throw new Error('Forbidden');

    let q = adminClient.from('memberships')
      .select('role, student_id, profiles!inner(id, first_name, last_name, email, avatar_url)')
      .eq('university_id', universityId)
      .is('deleted_at', null);

    if (query) {
      q = q.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`, { foreignTable: 'profiles' });
    }
```

and flatten the result before returning it:

```ts
    const { data, error } = await q.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    const users = (data || []).map((row: any) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return { ...profile, role: row.role, student_id: row.student_id };
    });

    return apiResponse(users);
```

- [ ] **Step 6: Work through the remaining type errors**

```bash
npm run typecheck
```

Expected: clean. Apply the mechanical substitution from Step 1 to each remaining error until it is.

- [ ] **Step 7: Run the whole verification gate**

```bash
npm run test && npm run lint && npm run typecheck && npm run build
```

Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: read role and organisation from the membership everywhere"
```

---

### Task 9: Contract — drop the columns the old model used

> **Do not run this task in the same deploy as Tasks 1–8.** Apply it only once every instance is running the new code.

**Files:**
- Create: `supabase/migrations/045_drop_profile_tenant_columns.sql`
- Modify: `tests/profile-claims.test.ts`

**Interfaces:**
- Consumes: `is_member_of(UUID)`, `is_university_admin(UUID)`, `is_super_admin()` from Task 1.
- Produces: nothing.

- [ ] **Step 1: Rewrite the failing test**

Replace `tests/profile-claims.test.ts` entirely:

```ts
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const migration = fs.readFileSync(
  path.join(process.cwd(), 'supabase', 'migrations', '045_drop_profile_tenant_columns.sql'),
  'utf8',
);

describe('retiring the single-tenant profile', () => {
  it('replaces both policies that name the columns being dropped', () => {
    expect(migration).toContain('DROP POLICY IF EXISTS "Users view profiles in same university" ON profiles');
    expect(migration).toContain('DROP POLICY IF EXISTS "Admins manage university profiles" ON profiles');
    expect(migration).toContain('CREATE POLICY "Users view profiles sharing an organisation" ON profiles');
    expect(migration).toContain('CREATE POLICY "Admins manage organisation profiles" ON profiles');
  });

  it('keeps the replacements off profiles, so neither can recurse', () => {
    const policies = migration.split('CREATE POLICY').slice(1);
    const onProfiles = policies.filter((body) => /ON profiles/.test(body));

    expect(onProfiles.length).toBe(2);
    for (const body of onProfiles) {
      const clause = body.slice(0, body.indexOf(';'));
      expect(clause).toMatch(/FROM memberships/);
      expect(clause).not.toMatch(/FROM\s+profiles\b/);
    }
  });

  it('drops the columns the single-tenant model needed', () => {
    expect(migration).toContain('ALTER TABLE profiles DROP COLUMN IF EXISTS university_id');
    expect(migration).toContain('ALTER TABLE profiles DROP COLUMN IF EXISTS role');
    expect(migration).toContain('ALTER TABLE profiles DROP COLUMN IF EXISTS student_id');
  });

  it('retires profile_claims, which membership_claims supersedes', () => {
    expect(migration).toContain('DROP TRIGGER IF EXISTS sync_profile_claim_trigger ON profiles');
    expect(migration).toContain('DROP FUNCTION IF EXISTS sync_profile_claim()');
    expect(migration).toContain('DROP TABLE IF EXISTS profile_claims');
  });

  it('removes the helpers that assumed one organisation per account', () => {
    expect(migration).toContain('DROP FUNCTION IF EXISTS current_university_id()');
    expect(migration).toContain('DROP FUNCTION IF EXISTS current_user_role()');
    expect(migration).toContain('DROP FUNCTION IF EXISTS current_user_is_staff()');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/profile-claims.test.ts
```

Expected: FAIL — `ENOENT ... 045_drop_profile_tenant_columns.sql`.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/045_drop_profile_tenant_columns.sql`:

```sql
-- The contract half of the membership change. Apply only once every running
-- instance reads memberships; the code before that release still selects these
-- columns, and dropping them under it returns 500 from every page.
--
-- Two policies on profiles name the columns going away, so they are replaced
-- first. Both preserve today's meaning exactly: a member sees everyone in an
-- organisation they belong to, an admin manages everyone in theirs. Neither
-- reads profiles, so neither can recurse; the chain runs
-- profiles -> memberships -> membership_claims and terminates.

DROP POLICY IF EXISTS "Users view profiles in same university" ON profiles;
CREATE POLICY "Users view profiles sharing an organisation" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = profiles.id
      AND m.deleted_at IS NULL
      AND is_member_of(m.university_id)
  )
);

DROP POLICY IF EXISTS "Admins manage university profiles" ON profiles;
CREATE POLICY "Admins manage organisation profiles" ON profiles
FOR ALL USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = profiles.id
      AND m.deleted_at IS NULL
      AND is_university_admin(m.university_id)
  )
);

-- profile_claims answered "which organisation, and which role" for an account
-- that had exactly one of each. membership_claims answers it per organisation.
DROP TRIGGER IF EXISTS sync_profile_claim_trigger ON profiles;
DROP FUNCTION IF EXISTS sync_profile_claim();
DROP TABLE IF EXISTS profile_claims;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_university_id_student_id_key;
ALTER TABLE profiles DROP COLUMN IF EXISTS university_id;
ALTER TABLE profiles DROP COLUMN IF EXISTS role;
ALTER TABLE profiles DROP COLUMN IF EXISTS student_id;

-- These asked which single organisation the caller belongs to. The question no
-- longer has one answer, and nothing calls them after migration 044.
DROP FUNCTION IF EXISTS current_university_id();
DROP FUNCTION IF EXISTS current_user_role();
DROP FUNCTION IF EXISTS current_user_is_staff();
DROP FUNCTION IF EXISTS current_profile_id();
```

- [ ] **Step 4: Run the tests**

```bash
npx vitest run tests/profile-claims.test.ts && npm run test
```

Expected: PASS.

- [ ] **Step 5: Rename the test file to match what it now covers**

```bash
git mv tests/profile-claims.test.ts tests/profile-contract.test.ts
npm run test
```

Expected: PASS.

- [ ] **Step 6: Full gate**

```bash
npm run verify
```

Expected: PASS. `check:drift` and `check:rls` need a live database with all migrations applied; run them against the deployed database after applying 045.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/045_drop_profile_tenant_columns.sql tests/profile-contract.test.ts
git commit -m "feat: retire the single-tenant columns on profiles"
```

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
| --- | --- |
| §1 schema, claims mirror, policies | 1 |
| §2 helpers | 1 |
| §3 storage | 2 |
| §4 session and guards | 3, 4 |
| §4 middleware | 5 |
| §4 onboarding | 6 |
| §4 invites | 7 |
| §4 admin actions, API route, services | 8 |
| §5 testing | every task |
| §6 rollout, `profiles` policy replacement | 9 |

**Type consistency:** `Membership` (Task 3) is consumed unchanged by Tasks 4–8. `SupabaseLike` is the single stub-friendly client type across `membership.ts`, `membership-access.ts`, `onboarding-write.ts` and `invites.ts`. `effectiveRole(membership, platformAdmin)` has one signature, used by `buildSession` and `resolveAccess`. `getRoleRedirectPath` accepts `AuthRole | null | undefined` already, so passing `access.role` in Task 5 needs no change.

**Known gap, deliberately not closed:** nothing in the admin UI sets `memberships.department_id`, so `assignTeam` returns an empty list rather than the `42703` it returns today. Wiring department assignment into the admin user forms is separate work.
