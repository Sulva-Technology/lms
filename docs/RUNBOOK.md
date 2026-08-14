# VUI LMS Runbook

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
