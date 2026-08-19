# Sulva LMS Runbook

Operational reference for running, deploying, and debugging this application.

## 1. Environment variables

`npm run check:env` classifies these. Missing a **required** variable is a hard failure; missing an **integration** variable prints a warning naming exactly what degrades.

### Required — the app will not boot without these

| Variable | Where it comes from | Breaks if missing |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API | Everything |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API | Everything |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API | Login role resolution, invites, webhooks |
| `NEXT_PUBLIC_APP_URL` | Your deployment origin | Invite and password-reset links, email links |

### Integrations — the app runs without these, one feature degrades

| Variable | Feature | Degradation |
| --- | --- | --- |
| `DAILY_API_KEY` | Live classes | Scheduling a live class fails; rooms cannot be created |
| `LIVE_CLASS_PROVIDER_WEBHOOK_SECRET` | Live class recordings | Recording callbacks are rejected, so recordings never appear |
| `RESEND_API_KEY`, `EMAIL_FROM` | Transactional email | Notifications stay in-app only; no email is sent |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limiting | Limits fall back to a per-instance in-memory counter, which enforces little on serverless |

`.env` is git-ignored and must stay that way. `.env.example` documents every name.

## 2. Applying migrations

Migrations live in `supabase/migrations/` and apply in numeric order.

```bash
npx supabase db push
```

If the CLI is not linked to the project, paste each unapplied file into the Supabase SQL editor in order.

**Migrations 020–030 ship unapplied.** They must be applied before the corresponding features work:

| Migration | What it does | Blocking for |
| --- | --- | --- |
| `020_storage_tenant_policies.sql` | Replaces blanket `authenticated` storage policies with tenant-scoped ones; creates the `lesson-video` bucket; drops the legacy `vui_*` policies | All file upload and download |
| `021_submission_file_metadata.sql` | `file_metadata` JSONB on submissions | Assignment attachments rendering with real names |
| `022_gradebook_assignment_link.sql` | `grade_items.assignment_id`, `grades.graded_by/graded_at`, unique indexes | Grading writing to the gradebook at all |
| `023_lesson_video_contract.sql` | `storage_path` and file columns on `video_assets` | Lesson video |
| `024_discussion_contracts.sql` | `answered_by` / `answered_at`, board indexes | Marking a discussion answered |
| `025_realtime_notifications.sql` | Adds `notifications` to the realtime publication | Live notification bell |
| `026_data_api_grants.sql` | Explicit `anon` / `authenticated` / `service_role` grants | Everything, on a project created after Supabase stopped auto-granting |
| `027_student_resubmission_policy.sql` | Students may update their own ungraded submission | Resubmission |
| `028_lecturer_gradebook_policies.sql` | Lecturers may manage grade items and grades for their sections | Grade items, and the gradebook mirror when grading |
| `029_discussion_and_attendance_write_paths.sql` | Discussion post/reply/resolve policies; non-partial attendance unique index | Discussions, and taking attendance |
| `030_lecturer_content_write_policies.sql` | Lecturers may write announcements, quiz questions and options | Announcements and quiz authoring |

The legacy `vui_*` buckets are left in place because Supabase Storage blocks
direct `DELETE` on `storage.objects` from SQL. Their policies are dropped, so
RLS denies all access; remove the empty buckets from the dashboard if you want
them gone.

Verify 020 landed:

```sql
select policyname, cmd from pg_policies where schemaname = 'storage' and tablename = 'objects' order by policyname;
```

There must be no policy on `assignment-submissions` whose only condition is `auth.role() = 'authenticated'`.

## 3. Storage layout

Every object key is `{university_id}/{scope}/{owner_id}/{uuid}-{file_name}`, built by `buildStoragePath` in [lib/storage/paths.ts](../lib/storage/paths.ts). Storage RLS reads segment 1 as the tenant and segment 3 as the owner, so **this shape is load-bearing** — changing it requires changing migration 020 in the same commit.

Signed download URLs bypass RLS once issued, so `createSignedDownloadUrlAction` re-applies the ownership checks at mint time. Any new bucket needs both a policy in migration 020 and an entry in the `WRITE_MATRIX`.

## 4. Seeding a demo environment

```bash
npm run db:seed:auth
```

```bash
npm run db:seed:demo
```

The second script builds CSC101 end to end — faculty, department, program, course, section, lecturer assignment, student enrollment, two published lessons, an assignment due in seven days, a published quiz, an announcement, and a discussion with an endorsed reply. It is idempotent; run it as often as you like.

Demo logins are all `VuiDemo123!`: `superadmin@example.com`, `admin@example.com`, `lecturer@example.com`, `student@example.com`.

## 5. Pre-deploy gate

```bash
npm run verify
```

Runs, in order: `check:env` → `check:links` → `check:rls` → `lint` → `typecheck` → `test` → `build`. Do not skip a stage. `check:links` must be re-run after any change to navigation, redirects, or route names.

### Write-path audit

`check:rls` is static — it proves every table has RLS on with at least one
policy, which is not the same as proving the app can perform the writes it
offers. Several features shipped with a read policy and an admin-only write
policy, so the UI worked while the database silently refused.

Against a seeded database (local, or a disposable staging project — it writes
real rows):

```bash
npm run check:writes
```

It signs in as the demo lecturer and student, performs one representative write
per feature through PostgREST, and asserts the negative cases too (a student
must not take attendance, write another user's folder, or reach another
university's storage). Run it after any policy or schema change.

```bash
npm audit --audit-level=high --omit=dev
```

Known and accepted: 4 high advisories in `next/node_modules/sharp` (bundled
libvips) and moderate advisories in Next's transitive `postcss`. Both live
inside Next's own dependency pins. `npm audit fix --force` proposes a breaking
framework downgrade and must not be run; re-check these after each Next upgrade.

## 6. Debugging

**Live class will not start.** Check `DAILY_API_KEY` is set in the deployed environment, then check the Daily dashboard for the room. `app/actions/live-classes.ts` surfaces the provider error verbatim.

**Recordings never appear.** The webhook is rejected without `LIVE_CLASS_PROVIDER_WEBHOOK_SECRET` matching the secret registered in Daily. Check the Daily webhook delivery log for 401s.

**Lesson video will not play.** Playback uses a signed URL minted per page render against the private `lesson-video` bucket. If it 400s, migration 020 has not been applied, so the bucket does not exist. If the player is empty, check `video_assets.storage_path` for that lesson.

**A file upload fails with a permission error.** The role is not in `WRITE_MATRIX` for that bucket, or migration 020 is unapplied. The action returns the reason verbatim.

**Emails are not arriving.** `sendEmail` swallows provider failures by design so a mail outage never fails a database write — check server logs for `[email] delivery failed`. Also check the recipient's `profiles.preferences.emailNotifications`, which suppresses mail when `false`.

**Notification bell does not update live.** Migration 025 adds `notifications` to the `supabase_realtime` publication; without it the badge only refreshes on navigation.

**Rate limiting seems ineffective.** Without Upstash credentials the limiter is per-instance. Check server logs for `[rate-limit] backend failed`.

**Stale `.next` output.** A corrupt build directory can make Next serve 500s for valid routes. `rm -rf .next && npm run build`.

## 7. Rolling back

Application code: redeploy the previous commit. The app is stateless apart from Supabase.

Migrations are not automatically reversible. `020` is destructive — it deletes the `vui_*` buckets and every object inside them. Take a storage backup before applying it in an environment with real user data.

## 8. Credential rotation

`RESEND_API_KEY`, `DAILY_API_KEY`, and the Upstash token are all rotated in the provider dashboard, then updated in the deployment's environment settings. No code change is required.

To rotate Supabase keys, use Project Settings → API → "Reset". Everything reads them from the environment; no key is committed.

## 9. Wildcard school subdomains

Each school is served at `<subdomain>.<NEXT_PUBLIC_ROOT_DOMAIN>`. The subdomain is
the tenant routing key (`universities.subdomain`), resolved from the `Host` header
in middleware, which then injects `x-university-id` / `x-university-subdomain` for
the rest of the request.

1. In Vercel → Project → Domains, add both the apex domain and `*.<root domain>`.
2. At the DNS provider, add the records Vercel shows: an A/ALIAS record for the
   apex and a `CNAME *` record pointing at `cname.vercel-dns.com`.
3. Set `NEXT_PUBLIC_ROOT_DOMAIN` (this deployment uses `lms.sulvatech.com`) in Vercel for all
   environments. Vercel issues the wildcard TLS certificate automatically.
4. In Supabase → Authentication → URL Configuration, add `https://*.<root domain>/**`
   to the redirect allow list. Invite and password-reset links land on the school's
   own host and are rejected without this entry.
5. Locally, leave `NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000`; browsers resolve
   `anything.localhost` without a hosts-file entry.

Creating a school is a super-admin-only action at `/superadmin/universities` on the
root domain. It inserts the tenant and emails an invite to the school's first admin,
whose link lands on that school's own subdomain. If the invite fails to send, the
school row is rolled back so no tenant is left without an administrator.

School hosts never serve `/superadmin`, and a session belonging to another school is
signed out on arrival. Setting a school's status to `suspended` or `archived` takes
its subdomain offline within the 60-second tenant cache TTL.

Reserved subdomains that can never be assigned: `www, app, api, admin, superadmin,
mail, smtp, ftp, static, assets, cdn, docs, blog, status, support, dashboard, login,
auth, dev, staging, test, demo, vercel`.

## Training tenants

A tenant is created as either a school or an organisation running internal
training. `universities.mode` records which, and it defaults to `academic`, so
every tenant that existed before this option behaves exactly as it did.

The difference is structural, not cosmetic. `courses.department_id` and
`course_sections.semester_id` are nullable, so a training tenant owns courses
directly and schedules cohorts by their own `starts_on` / `ends_on` dates. No
faculty, department, academic session or term is created for one — earlier
builds fabricated all four and renamed them in the UI, which made every report
read as though a law firm had a Faculty of Training.

A section must still be schedulable: it carries either a semester or a start
date. Both modes are held to that by a CHECK constraint, and the same rule is
mirrored in `courseSectionSchema` so a mistake is refused with a sentence
rather than a constraint violation.

Wording follows the mode unless someone overrides it in Admin → Settings. A
training tenant reads trainer, trainee, programme and cohort; a school reads
lecturer, student, course and semester. Only navigation and role badges follow
the vocabulary today — individual page headings still read academically.

### Running required training

1. Create the course, then a cohort with its start date.
2. Assign it at **Admin → Compliance**, to one person or to a whole team.
   Assigning also enrols them, so the training opens as soon as they sign in.
   Leaving the deadline empty is allowed; that training never counts as overdue.
3. Learners see their deadlines at **My Training**, and are notified when
   something is assigned.
4. Set `courses.valid_for_months` for anything that must be repeated. A
   certificate issued against it expires that many months later, and the
   verification page reads *expired* rather than *valid*.
5. **Admin → Compliance** shows the compliance rate, who is overdue, what falls
   due within a fortnight, and which certificates lapse within thirty days.
   Renewing is assigning the training again.

Withdrawing an assignment leaves the row in place and stops it counting against
anyone; there is no way to delete one, the same rule certificates follow.

Issuing a certificate closes any open assignment for that learner and cohort, so
compliance stops chasing someone who has already finished.

Nothing renews automatically. Expiring certificates surface in the compliance
view and a person assigns the training again.

## Schema drift audit

The migrations describe what the database should contain. Nothing stopped
someone adding to it directly, and twice that happened on `profiles` — once
with a policy that read `profiles` from inside a policy on `profiles`, which
took down every page that lists people with `42P17`.

```bash
npm run check:drift
```

Needs `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, and migration
`042` applied. It reads schema metadata only — names and definitions of
policies, indexes and constraints, never a row of application data — through a
function whose EXECUTE is granted to the service role alone.

It reports three things and exits non-zero on any of them:

- **Policies that read the table they guard.** The `42P17` shape, caught
  wherever it appears rather than only where a migration introduced it.
- **In the database, declared by no migration.** Something was added by hand.
  Either write the migration that declares it, or drop it.
- **Declared by a migration, missing from the database.** Usually a migration
  that has not been applied. Worth checking against
  `supabase_migrations.schema_migrations`, since `supabase db push` skips
  versions already recorded there even when the objects are absent.

Constraints Postgres names itself from inline `CREATE TABLE` clauses are
ignored, since no migration ever names them. Anything named deliberately is
compared.

This is not part of `npm run verify`, which must run without a database.

