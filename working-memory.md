# Working Memory

## Problem Summary
- Take the VUI LMS from a read-mostly shell to a fully working multi-tenant platform: students submit work, lecturers grade it, files and video actually move, and infrastructure (rate limiting, email, realtime) is real rather than simulated.

## Product Goal
- Users land on production-backed LMS pages with clear actions, useful empty/error states, responsive premium VUI styling, and validated role-scoped mutations instead of placeholder or mock-only screens.

## Stack and Runtime
- Framework: Next.js App Router 15.5.
- Language: TypeScript/React 19.
- UI styling: Tailwind CSS 4 with glass panel utility classes and `motion/react`.
- Backend/runtime: Server Components plus Server Actions.
- Database: Supabase Postgres with RLS; Supabase Storage for all files including lesson video.
- Integrations: Daily (live classes), Resend (email), Upstash Redis (rate limiting), Supabase Realtime (notifications).
- Deployment assumptions: Vercel-compatible standalone output.

## Confirmed Facts (2026-08-14 local end-to-end verification)
- The whole migration set `001`–`030` plus `supabase/seed.sql` was replayed from scratch against a local Supabase stack in Docker (`npx supabase db reset`) and applies cleanly.
- Migration `020` originally failed on every database: Supabase Storage installs a `storage.protect_delete()` trigger that rejects direct `DELETE` on `storage.objects`. The migration no longer deletes the legacy `vui_*` rows; it drops their policies instead, which closes the leak without a destructive step. The earlier "back up storage before applying 020" warning no longer applies.
- `service_role` and `authenticated` had no grants on any public table. Supabase used to auto-grant new tables; new projects do not, and the legacy behaviour is removed on 2026-10-30. Migration `026_data_api_grants.sql` makes the grants explicit. Without it a freshly provisioned project fails with "permission denied for table ...".
- `grades` never had `graded_by` / `graded_at`, and `GradeService` wrote both without checking the error, so the gradebook mirror failed silently on every grading. Fixed in migration `022` plus an error check.
- Students had no UPDATE policy on `assignment_submissions`, so resubmission always failed with "Cannot coerce the result to a single JSON object" despite the UI offering it. Fixed in migration `027`.
- Lecturers had no write access to `grade_items` / `grades` (migration `028`), `discussions` / `discussion_replies` (migration `029`), or `announcements` / `quiz_questions` / `quiz_options` (migration `030`). Every one of those features was dead at the database layer.
- `attendance_records` had only a partial unique index on `(session_id, student_id)`, which Postgres will not use as an `ON CONFLICT` arbiter, so every roll call failed. Replaced with a full unique index in migration `029`.
- `notifications` has no INSERT policy by design, so notification writes now go through the service-role client. Previously every cross-user notification failed.
- `/auth/callback` only handled the PKCE `code` parameter, so every emailed link (invite, magic link, recovery) landed on `/login?error=auth_callback_failed`. It now also handles `token_hash` + `type`.
- `scripts/seed-demo-users.ts` read `process.env` directly and could not see `.env`, so the documented `npm run db:seed:auth` never worked from a env file. It now uses the shared loader.
- `supabase/seed.sql` referenced three columns that do not exist (`course_lecturers.role`, `grades.graded_by` before migration 022, and omitted the NOT NULL `live_class_recordings.provider`/`asset_id`), so seeding always failed partway.
- `scripts/comprehensive-seed.ts` guessed four column names that do not exist (`semesters` needs `academic_session_id`; `programs` has no `duration_years`; `courses` has no `level`; `quiz_options` needs `university_id`).
- New `npm run check:writes` signs in as the demo lecturer and student and exercises 21 write paths plus negative cases against a real database. All 21 pass on a freshly reset stack.
- Verified interactively in the browser against the local stack: student submission, resubmission, lecturer grading, gradebook mirror, and the lecturer notification.

## Confirmed Facts (2026-08-13 production readiness pass)
- The repository now has git history; the first commit is `e207552`. Before this pass it had zero commits.
- `scripts/comprehensive-seed.ts`, `scripts/check-data.ts`, and `scripts/test-login.ts` contained a hardcoded live Supabase project URL, anon key, and **service-role key**. They now read from the environment via `scripts/lib/clients.ts`, and `tests/secrets.test.ts` fails the build if a Supabase JWT reappears anywhere in the repo. The leaked service-role key still exists in the baseline commit and must be rotated in the Supabase dashboard.
- Storage RLS previously granted every authenticated user read access to every object in a bucket, including other universities' assignment submissions. Migration `020_storage_tenant_policies.sql` replaces those with tenant-scoped and owner-scoped policies.
- Object keys are now `{university_id}/{scope}/{owner_id}/{uuid}-{file_name}`, built server-side by `buildStoragePath`. Storage RLS reads segment 1 as tenant and segment 3 as owner, so the path shape is load-bearing.
- Signed download URLs bypass storage RLS once issued, so `createSignedDownloadUrlAction` re-applies ownership checks at mint time.
- `app/api/files/*` duplicated the file Server Actions with weaker authorization and no callers; both routes were deleted.
- `GradeService` previously looked up a grade item by a name it never wrote, creating a duplicate grade item on every grading call. Grade items are now keyed to `assignment_id` (migration `022`).
- `RecordingService.togglePublish` authorized on `created_by`, which webhooks never populate, so publishing could never succeed. It now authorizes on section assignment.
- `StudentReadService.getRecordings` had a `|| true` in its section filter, returning every recording regardless of enrollment. Fixed, and students now see only published recordings.
- Lesson video is hosted in Supabase Storage (private `lesson-video` bucket) and played through a signed URL minted per page render. There is no external video provider; the stub `app/api/webhooks/video` route and `VIDEO_PROVIDER_WEBHOOK_SECRET` were removed.
- `check:env` now hard-fails only on boot-critical variables and warns per missing integration, so `npm run verify` is runnable without vendor keys.
- `next.config.ts` no longer allows `picsum.photos`; `eslint.ignoreDuringBuilds` is now `false` so a build cannot hide lint errors.
- Test count went from 20 (six files containing only `expect(true).toBe(true)`) to 90 across 18 files, including a Supabase stub harness at `tests/helpers/supabase-stub.ts`.
- `tests/page-completion.test.ts` now fails if any exported Server Action has no UI caller, and if third-party placeholder imagery reappears.
- `npm run verify` passes end to end: `check:env`, `check:links` (101 routes), `check:rls` (49 tables), `lint`, `typecheck`, `test` (90 tests, 18 files), and `build`.
- Removed the unused `@google/genai` and `firebase-tools` dependencies, which carried 6 of the 10 production audit advisories (hono, fast-uri, ip-address, body-parser). Neither was imported anywhere.

## Unknowns / Needs Confirmation
- Whether the deployed Supabase project has migrations `015`–`025` applied. All are written; none were applied by this pass.
- Whether the leaked Supabase service-role key has been rotated.
- Whether payment-provider automation is planned beyond platform subscription records (explicitly out of scope on 2026-08-13).

## Active Files / Surfaces
- Plan: `docs/superpowers/plans/2026-08-13-production-readiness.md`.
- Runbook: `docs/RUNBOOK.md`.
- Infrastructure: `lib/rate-limit.ts`, `lib/email/send.ts`, `lib/email/templates.ts`, `lib/storage/paths.ts`, `lib/ui/identity.ts`, `scripts/lib/clients.ts`.
- Shared UI: `components/ui/file-uploader.tsx`, `components/ui/file-list.tsx`, `components/ui/avatar.tsx`.
- Assignment loop: `app/(dashboard)/student/assignments/[assignmentId]/page.tsx`, `components/student/AssignmentSubmissionPanel.tsx`, `app/(dashboard)/lecturer/assignments/[assignmentId]/submissions/page.tsx`, `components/lecturer/SubmissionGradingPanel.tsx`.
- Video: `components/lecturer/LessonVideoUploader.tsx`, `lib/services/video.service.ts`, `components/video/LessonWorkspace.tsx`.
- Attendance: `components/lecturer/AttendanceManager.tsx`, `app/(dashboard)/lecturer/attendance/page.tsx`.
- Discussions: `components/discussions/DiscussionBoard.tsx`, `lib/discussions/shape.ts`, student and lecturer list plus thread routes.
- Other write paths: `components/lecturer/GradeItemManager.tsx`, `components/admin/UserRoleManager.tsx`, `components/settings/ProfileForm.tsx`, `components/lecturer/RecordingManager.tsx`.
- Notifications: `components/layout/NotificationBell.tsx`, `app/(dashboard)/notifications/page.tsx`.
- New migrations: `020_storage_tenant_policies.sql` through `025_realtime_notifications.sql`.

## Decisions
- Video is hosted on Supabase Storage rather than Mux, to avoid a vendor account on the critical path. Trade-off: no transcoding or adaptive bitrate.
- Payments and subscription billing stay out of scope; plans and subscriptions remain superadmin-managed records.
- Migrations are written but not applied by the agent; applying them is the operator's first deploy step.
- Integration credentials warn rather than fail in `check:env`, so a deploy without email or Redis is possible but never silent.
- Email is best-effort: `sendEmail` swallows provider errors so a mail outage never fails the database write that triggered it.
- Rate limiting degrades to an in-process counter when Redis is unreachable rather than failing requests closed.
- Server Actions are the canonical mutation path; duplicate API routes with weaker authorization were deleted rather than patched.
- Course art and avatars are generated locally from a deterministic hue, never fetched from a placeholder service.

## Risks / Watchouts
- **The Supabase service-role key in commit `e207552` must be rotated.** It grants full RLS bypass to anyone who reads the history.
- Migrations `020`–`030` are unapplied on the hosted project. Storage, resubmission, grading, discussions, attendance, announcements and quiz authoring all depend on them.
- `check:rls` is static and cannot catch an admin-only write policy on a lecturer-facing feature. Run `npm run check:writes` against a seeded database after any policy change.
- The local stack's `storage-api` container reports unhealthy on this machine even though it serves requests; `npx supabase start --ignore-health-check -x studio,edge-runtime,logflare,vector,imgproxy` works around it.
- Without `DAILY_API_KEY`, scheduling a live class fails at the provider call.
- Supabase Storage serves video as a single file with no adaptive bitrate; large lecture recordings will be slow on poor connections.
- 4 high advisories remain in `next/node_modules/sharp` (bundled libvips) plus moderate ones in Next's transitive `postcss`. Both are pinned inside Next; forcing `sharp@0.35` risks breaking image optimization, so they are tracked for the next Next upgrade rather than forced.

## Next Actions
- Rotate the Supabase service-role key, then update `SUPABASE_SERVICE_ROLE_KEY` in every environment.
- Delete `.env.local` when finished with the local stack; while it exists the app and every script talk to Docker instead of the hosted project.
- Apply migrations `015`–`025` to the target Supabase project, taking a storage backup first.
- Configure `DAILY_API_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, and the Upstash pair before serving real users.
- Run `npm run db:seed:auth` then `npm run db:seed:demo`, and browser-test the four demo logins end to end.
- Run `npm run verify` before each production deploy.
