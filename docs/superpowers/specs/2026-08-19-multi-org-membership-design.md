# Multi-Organisation Membership — Design

Date: 2026-08-19
Status: Approved

## Goal

One account, many organisations. A person invited to a second school or firm
signs in with the account they already have, holding a different role in each.
Today they cannot: `profiles` carries one `university_id` and one `role`, so a
second invite to the same email fails outright and, if forced past that, the
middleware signs them out of the second school.

## Context

- Next.js 15 App Router + Supabase (SSR auth via `@supabase/ssr`).
- Each tenant is served on its own subdomain
  (`2026-08-18-wildcard-subdomain-tenancy-design.md`). Session cookies carry no
  `Domain` attribute, so **each subdomain already has its own session**. The
  host is the organisation switch; no active-organisation state is needed
  anywhere.
- `profiles.id` is the `auth.users.id`, and the row carries `university_id`,
  `role` and `student_id` — the whole single-tenant assumption in one place.
- Every RLS policy across migrations 005–041 reaches the tenant through four
  helpers in `004_rls_helpers.sql`, and three of them already take a tenant
  argument. This is why the change is contained.
- `profile_claims` (migration 040) exists to break a `42P17` recursion: a
  policy on `profiles` must never read `profiles`. `SECURITY DEFINER` was
  deliberately *not* trusted to bypass RLS, because that depends on how the
  database was provisioned. That constraint governs this design too.

## Decisions

| Question | Decision | Why |
| --- | --- | --- |
| Keep `profiles.university_id` / `role`? | Drop them | Two sources of truth for authorisation drift silently; a role changed in one and not the other is an auth bug with no symptom until it matters. |
| How is `super_admin` represented? | `platform_admins` table | Platform admin is a property of the account, not a membership in any organisation. A boolean on `profiles` would make `is_super_admin()` read `profiles`, re-entering the `profiles` policy that calls it — the exact `42P17` that migration 041 removed. |
| Invite to an email that already exists? | Add membership, notify by email | `inviteUserByEmail` throws `A user with this email address has already been registered` for existing accounts. Adding someone to an organisation without telling them is surprising and generates support load. |
| Rollout | Expand → migrate → contract, two deploys | Dropping `profiles.role` in the same deploy as the app change returns 500 from every warm serverless instance still running the old code. |

## 1. Schema — migration `043_memberships.sql` (expand)

```sql
CREATE TABLE memberships (
    user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    role          user_role NOT NULL,
    student_id    TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ,
    PRIMARY KEY (user_id, university_id),
    UNIQUE (university_id, student_id),
    CHECK (role <> 'super_admin')
);

CREATE TABLE membership_claims (
    user_id       UUID NOT NULL,
    university_id UUID NOT NULL,
    role          user_role NOT NULL,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, university_id)
);

CREATE TABLE platform_admins (
    user_id    UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- `deleted_at` is per membership. Deactivating someone at one organisation must
  leave their account and their other memberships untouched. Every membership
  check requires `deleted_at IS NULL`.
- `student_id` moves off `profiles`, carrying its `UNIQUE (university_id,
  student_id)` with it. A matric number is issued by one school and means
  nothing at another. NULLs stay distinct under Postgres, so members without
  one are unaffected — same semantics as the constraint on `profiles` today.
- `department_id` is new. `TrainingAssignmentService.assignTeam()` already
  filters `profiles` by a `department_id` column that has never existed, so
  "assign this training to a department" fails with `42703` every time it is
  called. A person's department is a fact about their place in one
  organisation, so `memberships` is where it belongs, and adding it makes an
  existing feature work rather than adding a new one. Backfills as NULL —
  there is no source for it — so `assignTeam` returns an empty list until
  departments are assigned, instead of erroring.
- `role <> 'super_admin'` keeps the platform role out of the tenant table, so
  there is one representation of platform administration rather than two.

Backfill, preserving soft-deletes so nobody is locked out on deploy:

```sql
INSERT INTO memberships (user_id, university_id, role, student_id, deleted_at)
SELECT id, university_id, role, student_id, deleted_at
FROM profiles
WHERE university_id IS NOT NULL AND role <> 'super_admin';

INSERT INTO platform_admins (user_id)
SELECT id FROM profiles WHERE role = 'super_admin';
```

### Why there is a claims mirror

`membership_claims` holds the `(user_id, university_id, role)` of every *active*
membership, kept in step by trigger. It exists for one reason: the helper
functions must read a table whose policy names `auth.uid()` and nothing else.

The alternative fails concretely. `CoreReadService.getAdminUsers()` runs under
RLS — its callers pass `createClient()`, not the admin client — and backs
`/admin/users`, `/admin/students` and `/admin/lecturers`. So `profiles` must
keep a policy that lets one member see another, which in turn requires reading
the *target's* memberships, which requires `memberships` to carry a policy
beyond "your own rows". The moment `memberships` has a policy calling
`is_university_admin()` or `is_member_of()`, and those helpers read
`memberships`, the policy re-enters itself: `42P17`, the same failure migration
041 removed.

Pointing the helpers at the mirror breaks the cycle. Reads chain
`profiles → memberships → membership_claims`, three distinct relations, and the
chain terminates because nothing reads `membership_claims` except helpers, and
its policy touches no other table.

This supersedes `profile_claims` entirely, which migration 045 drops.

### Policies

```sql
-- The mirror and the platform table: caller's own rows, nothing else.
CREATE POLICY "Users read own membership claims" ON membership_claims
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users read own platform admin row" ON platform_admins
FOR SELECT USING (user_id = auth.uid());

-- memberships may use the helpers, because they read the mirror.
CREATE POLICY "Members read organisation memberships" ON memberships
FOR SELECT USING (is_member_of(university_id));
```

No INSERT, UPDATE or DELETE policy exists on any of the three. The service role
is the only writer, which is how the application already manages `profiles`.
`membership_claims` is written only by the trigger on `memberships`.

## 2. RLS helpers — same migration

Three helpers keep their signatures, so **no policy in migrations 005–041 is
touched**:

```sql
is_super_admin()          -- EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
is_member_of(uni)         -- NEW: EXISTS in membership_claims for (auth.uid(), uni)
role_in(uni)              -- NEW: membership_claims.role for (auth.uid(), uni)
in_same_tenant(uni)       -- is_super_admin() OR is_member_of(uni)
is_university_admin(uni)  -- role_in(uni) = 'admin'
is_staff_in(uni)          -- NEW: role_in(uni) IN (lecturer, department_admin, admin) OR is_super_admin()
```

All are `STABLE SECURITY DEFINER SET search_path = public`, and every one reads
only `membership_claims` or `platform_admins` — never `profiles`, never
`memberships`. Each therefore touches only rows the caller can already see
under those tables' own policies, so none depends on `SECURITY DEFINER`
actually bypassing RLS, and none can recurse.

Removed once nothing calls them: `current_university_id()`,
`current_user_role()`, `current_user_is_staff()`, `current_profile_id()`. The
first has no meaning once an account can belong to several organisations, and
that is the point — a request's tenant comes from the host, and every policy
already has the row's `university_id` to compare against.

## 3. Storage — migration `044_storage_membership_policies.sql`

The eleven policies in `020_storage_tenant_policies.sql` are rewritten:

- `storage_tenant_id(name) = current_university_id()` → `is_member_of(storage_tenant_id(name))`
- `current_user_is_staff()` → `is_staff_in(storage_tenant_id(name))`

The second is a tightening as well as a port: staffness becomes a fact about a
person *in one organisation* rather than a global property of the account.

Key convention (`{university_id}/{scope}/{owner_id}/{uuid}-{file}`) is
unchanged, so no object needs moving.

## 4. Application

- **`lib/auth/session.ts`** — `getSession()` reads the host tenant from
  `getTenantContext()` and returns
  `{ user, profile, membership, isPlatformAdmin }`, plus a `role` convenience
  (`membership?.role ?? (isPlatformAdmin ? 'super_admin' : null)`). The
  convenience keeps the 31 existing `profile.role` reads to a one-line change
  each instead of a rewrite.
- **`lib/supabase/middleware.ts`** — the membership for `(user, tenantId)`
  replaces the `profile.university_id !== tenantId` comparison. A signed-in
  person who is not a member and not a platform admin keeps the existing
  `signOut` + `?error=wrong-school` treatment; because cookies are host-only,
  that never touches their session at another school. Role-gated routes read
  the role from the membership.
- **`app/actions/onboarding.ts`** — upsert the profile, then insert the
  membership from the invite metadata. `23505` on the membership means the
  person is already a member, which is success, not an error.
- **`lib/auth/invites.ts`** — look up the email first. Existing account:
  insert the membership and send a "you have been added to X" email built on
  `getEmailLinkOrigin()`, so the link lands on that organisation's subdomain;
  they sign in with the password they already have. New email:
  `inviteUserByEmail` exactly as today.
- **`app/actions/admin/users.ts`, `app/api/admin/users/route.ts`** — list and
  manage members by joining `memberships` to `profiles`, scoped to the host
  tenant. Removing a person sets `memberships.deleted_at`; it never touches the
  profile, which may belong to other organisations.
- **`lib/services/*`** — six services read `profiles.university_id`. Each moves
  to `memberships`, keeping its current client: `CoreReadService.getAdminUsers`
  and `ReportService.getUniversityOverview` run under RLS, which the new
  `memberships` and `profiles` policies support without a service-role
  escalation. `DiscussionService.replyToDiscussion` reads a role for one user
  and now needs the tenant it is already passed.

## 5. Testing

Tests follow the established pattern in `tests/profile-claims.test.ts`: static
analysis of the migration SQL, no live database, so they run in `npm run
verify` on every change.

- `tests/memberships.test.ts` — table shape and constraints; the backfill
  covers every profile with a tenant; each new table has exactly one policy and
  it names only `auth.uid()`; no helper body selects from `profiles`; no
  migration still references `current_university_id()`.
- `tests/profile-claims.test.ts` — rewritten for the contract migration:
  asserts `profile_claims` and its trigger are gone.
- `tests/roles.test.ts`, `tests/onboarding.test.ts`, `tests/storage-paths.test.ts`
  — extended for per-tenant roles and the new storage helpers.
- `npm run check:drift` and `npm run check:rls` against a live database confirm
  the deployed schema matches, including that no policy reads its own table.

## 6. Rollout

1. Apply `043` and `044`. The old columns and `profile_claims` still exist, and
   the old helper definitions are replaced in place, so both the old and new
   application code read correct answers.
2. Deploy the application changes.
3. Apply `045_drop_profile_tenant_columns.sql`. Two policies on `profiles`
   name the columns being dropped and must be replaced first
   (`005_rls_policies.sql:45,47`):

   ```sql
   DROP POLICY IF EXISTS "Users view profiles in same university" ON profiles;
   CREATE POLICY "Users view profiles sharing an organisation" ON profiles
   FOR SELECT USING (
     EXISTS (SELECT 1 FROM memberships m
             WHERE m.user_id = profiles.id AND m.deleted_at IS NULL
               AND is_member_of(m.university_id))
   );

   DROP POLICY IF EXISTS "Admins manage university profiles" ON profiles;
   CREATE POLICY "Admins manage organisation profiles" ON profiles
   FOR ALL USING (
     is_super_admin() OR EXISTS (
       SELECT 1 FROM memberships m
       WHERE m.user_id = profiles.id AND m.deleted_at IS NULL
         AND is_university_admin(m.university_id))
   );
   ```

   Both preserve today's semantics exactly: a member sees everyone in an
   organisation they belong to, an admin manages everyone in theirs. Then drop
   `profiles.university_id`, `profiles.role`, `profiles.student_id` and its
   unique constraint, followed by `profile_claims`, its trigger and
   `sync_profile_claim()`.

Step 3 is a separate deploy on purpose. Between steps 1 and 2 the database
answers both models; only after every instance runs the new code is it safe to
remove the columns the old code reads.

## Out of scope

- An organisation switcher in the UI. The subdomain is the switch, and each one
  has its own session.
- Self-service joining. Membership is created by invitation only, as today.
- Cross-organisation search, or any view that spans a person's organisations.
