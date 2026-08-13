# Working Memory

## Problem Summary
- Fix auth flow instability: onboarding completion looped/hung, and first login showed a database error before the second login worked.

## Product Goal
- Users should land on production-backed LMS pages with clear actions, useful empty/error states, responsive premium VUI styling, and validated role-scoped mutations instead of placeholder or mock-only screens.

## Stack and Runtime
- Framework: Next.js App Router 15.5.15.
- Language: TypeScript/React 19.
- UI styling: Tailwind CSS 4 with glass panel utility classes and `motion/react`.
- Backend/runtime: Server Components plus Server Actions.
- Database: Supabase Postgres with RLS.
- Deployment assumptions: Vercel-compatible standalone output; fresh local dev server verified on `http://localhost:3002` because a protected stale process still owns port 3000.

## Confirmed Facts
- Repo is at `C:\sulvatech\lms`; Git is present, but this shell reports it as an unsafe repository unless `safe.directory` is configured.
- The onboarding form manually calls `completeOnboardingAction` from a client submit handler.
- The previous onboarding action called `redirect()` directly, which can throw through a manually awaited Server Action and leave the client loading state unresolved.
- The login form manually calls `loginAction` from a client submit handler, and the previous login action also called `redirect()` directly.
- The first-login profile lookup used the request-scoped Supabase client immediately after `signInWithPassword`; that can surface a profile/database error before the newly issued auth cookies are visible to subsequent navigation.
- Middleware, `getSession()`, onboarding profile load, lecturer settings load, and several API routes previously relied on RLS-backed `profiles` reads for current-user authorization state.
- The existing `profiles` RLS policies did not include an explicit self-select policy for `profiles.id = auth.uid()`.
- Live Supabase contract check for `student@example.com` succeeds: the auth user id matches the `profiles.id`, and the profile has `role = student`.
- Multiple `next dev --turbopack` processes were running against the same `.next` directory, causing `ENOENT ... app-build-manifest.json` runtime failures.
- `npm run lint`, `npx tsc --noEmit --pretty false`, and the full `npm run test` suite pass after the auth/runtime fixes.
- Shared UI primitives that import `motion/react` must be Client Components before Server Components can render them safely.
- A stale/corrupt `.next` directory can make Next serve plain 500/404 responses for valid routes; clearing `.next` allowed a clean production build to complete.
- Student, lecturer, and superadmin dashboard overview pages now use independent fallbacks for secondary dashboard datasets instead of blanking the entire page when one read fails.
- Login server action now catches unexpected exceptions and falls back from admin profile lookup to authenticated/RLS profile lookup plus user metadata role before returning a role redirect.
- Sidebar badge counts were static mock values and have been removed until they can be backed by real unread/upcoming counts.
- Clear placeholder pages existed at `/lecturer/quizzes` and `/lecturer/settings`.
- Previous quiz submission wrote `submitted`, but the base enum supports `completed`; the action now writes `completed`.
- `npm run lint`, `npm run test`, `npx next typegen`, and `npx tsc --noEmit --pretty false` pass.
- `npm run build` passes after clearing stale `.next` output.
- Academic admin CRUD stubs have been replaced with production actions/services for faculties, departments, programs, courses, course sections, and lecturer assignment management.
- Lecturer-facing content, assignment, announcement, and live-class management now have active client flows backed by Server Actions.
- Runtime mock markers are absent from `app`, `components`, `lib`, `types`, and `tests`; the previous mock data files and mock live-class provider were removed.
- `npm run lint`, `npx tsc --noEmit --pretty false`, `npm run test`, and `npm run build` pass after the full-functionality implementation pass.
- Production readiness pass on 2026-06-01 added local/CI release gates: `typecheck`, `verify`, env-file-aware `check:env`, and a static migration-backed `check:rls`.
- `check:rls` now audits all project-owned public tables and passes for 49 tables after migration `018_rls_policy_coverage.sql`.
- `npm audit --audit-level=high --omit=dev` passes after dependency updates; remaining production audit findings are moderate advisories in Next's transitive `postcss` package that require an upstream-safe framework update rather than `npm audit fix --force`.
- Live class recording pass on 2026-06-01 fixed the Daily recording webhook contract, removed mock webhook signature verification, unified both live-class webhook endpoints, and added missing recording schema columns in migration `019_live_recording_contract.sql`.
- `DAILY_API_KEY` and `LIVE_CLASS_PROVIDER_WEBHOOK_SECRET` are now required by `check:env` because live classes and recording are first-class production features.
- Link audit pass on 2026-06-01 added `check:links`, which validates internal App Router links, redirects, route config hrefs, and landing-page anchors across 100 app routes.
- Removed remaining placeholder `href="#"` landing/lecturer links, replaced fake design-system GitHub links with local docs routes, added `/unauthorized`, and replaced the mock `/student/courses/[courseId]/live` call UI with a production-backed course live-class list.
- Public middleware now bypasses Supabase session refresh for `/`, `/login`, auth utility pages, `/design-system`, `/docs`, `/unauthorized`, and `/api/*`, preventing stale-cookie Supabase fetch retry noise on public links.

## Unknowns / Needs Confirmation
- Whether the deployed Supabase project has migrations through `015_production_page_completion.sql` applied.
- Whether payment-provider automation is planned beyond platform subscription records.
- Whether the protected old Node process on port 3000 should be stopped by restarting the machine or closing its owning terminal/app.

## Active Files / Surfaces
- Login: `app/actions/auth.ts`, `components/auth/LoginForm.tsx`.
- Onboarding: `app/actions/onboarding.ts`, `components/auth/ProfileSetupForm.tsx`, `app/onboarding/profile/page.tsx`.
- Auth core: `lib/auth/session.ts`, `lib/supabase/middleware.ts`.
- API auth/profile reads: assignment, attendance, course registration, gradebook, report, file, and live-class route handlers.
- Dev runtime: `package.json`.
- Migration: `supabase/migrations/016_profiles_self_select_policy.sql`.
- Routes: `/lecturer/quizzes`, `/lecturer/settings`, `/student/quizzes/[quizId]`, `/student/courses/[courseId]/lessons/[lessonId]`, `/student/course-registration`, `/superadmin/plans`, `/superadmin/billing`, `/superadmin/support`, `/superadmin/settings`.
- Components: `components/lecturer/LecturerQuizManager.tsx`, `components/lecturer/LecturerSettingsForm.tsx`, `components/student/StudentQuizAttemptClient.tsx`, `components/video/LessonWorkspace.tsx`.
- Client-boundary UI primitives: `components/ui/empty-state.tsx`, `components/ui/accordion.tsx`, `components/ui/animated-list.tsx`, `components/ui/animated-page.tsx`, `components/ui/drawer.tsx`, `components/ui/error-state.tsx`, `components/ui/filter-dropdown.tsx`, `components/ui/loading-skeleton.tsx`, `components/ui/modal.tsx`, `components/ui/page-header.tsx`, `components/ui/progress-ring.tsx`, `components/ui/tabs.tsx`, `hooks/use-mobile.ts`.
- Dashboard overview pages: `app/(dashboard)/student/page.tsx`, `app/(dashboard)/lecturer/page.tsx`, `app/(dashboard)/superadmin/page.tsx`.
- Resilient list pages: student announcements/assignments/attendance/calendar/discussions/grades/live-classes/notifications/quizzes/recordings, lecturer assignments/attendance/gradebook/live-classes/questions/recordings, admin reports/storage/audit/settings, superadmin billing/plans/settings/support/universities/usage.
- Auth action: `app/actions/auth.ts`.
- Navigation: `lib/navigation.ts`.
- Helper: `lib/safe-read.ts`.
- Actions: `app/actions/quizzes.ts`, `app/actions/settings.ts`, `app/actions/superadmin.ts`.
- Services: `lib/services/quiz-management.service.ts`, `lib/services/completion-read.service.ts`.
- Migration: `supabase/migrations/015_production_page_completion.sql`.
- Tests: `tests/quizzes.test.ts`, `tests/page-completion.test.ts`.
- Full CRUD pass: `components/admin/AcademicCrudManager.tsx`, `components/lecturer/CourseContentManager.tsx`, `components/lecturer/LiveClassManager.tsx`, `components/lecturer/AssignmentManager.tsx`, `components/lecturer/AnnouncementManager.tsx`.
- New lecturer content route: `app/(dashboard)/lecturer/courses/[sectionId]/page.tsx`.
- New migration: `supabase/migrations/017_full_crud_archival_contracts.sql`.
- Release scripts: `scripts/check-env.ts`, `scripts/check-rls.ts`, `package.json`.
- Production docs: `README.md`, `.env.example`.
- New migration: `supabase/migrations/018_rls_policy_coverage.sql`.
- New migration: `supabase/migrations/019_live_recording_contract.sql`.
- Link audit script: `scripts/check-links.ts`.
- Public docs route: `app/docs/[slug]/page.tsx`.
- Unauthorized route: `app/unauthorized/page.tsx`.

## Decisions
- Return `{ success, redirectTo }` from `completeOnboardingAction` and let the client call `router.replace()`/`router.refresh()` instead of throwing `redirect()` through a manually awaited action.
- Return `{ success, redirectTo }` from `loginAction` and let `LoginForm` navigate with `router.replace()`/`router.refresh()`.
- Use the server-only admin Supabase client for the post-login profile role lookup so first-login routing does not depend on same-action RLS cookie visibility.
- Use the server-only admin Supabase client for current-user profile reads in middleware and `getSession()` so role guards do not depend on `profiles` RLS.
- Replace scattered route-handler `auth.getSession()` and manual current-profile reads with centralized `getSession()`.
- Change `npm run dev` to `next dev` and keep Turbopack available as `npm run dev:turbo`; this repo has webpack config and Turbopack was corrupting manifests when multiple dev servers ran.
- Add an explicit self-profile read policy so the app and middleware can deterministically see a just-created profile.
- Use Server Actions for quiz/settings/platform mutations instead of adding public API routes.
- Keep role checks at the action boundary with `requireRole`.
- Add a course-registration alias route that redirects to the production `/student/registration` route.
- Delete unused mock-only LMS components that imported production-flow mock data.
- Preserve existing UI primitives and glass panel styling rather than introducing a new component system.
- Keep Framer Motion UI primitives as explicit Client Components, while keeping `lib/motion.ts` import type-only so animation constants remain safe to import from server-rendered pages.
- Dashboard overview pages should render useful empty states with zeroed metrics if noncritical dashboard reads fail; auth/role checks remain hard boundaries.
- Navigation badges should only appear when backed by real data; no mock counts in production navigation.
- Archive is the default destructive behavior for academic/content records with history; `deleted_at` hides records from active lists while preserving audit and dependent rows.
- Department admins may manage academic setup records, matching the existing `/admin/*` page role gates.
- Daily remains the only live-class provider in runtime code; local fake provider code was removed.

## API Contracts
- `upsertQuizAction`: lecturer-only; accepts quiz metadata and assigned `courseSectionId`; creates or updates `quizzes`.
- `upsertQuizQuestionAction`: lecturer-only; accepts quiz id, question text/type/points/order, and options; rewrites options for the question.
- `publishQuizAction`: lecturer-only; toggles `quizzes.is_published` and `published_at`.
- `submitQuizAttemptAction`: student-only; accepts `{ quizId, answers }`; validates enrollment and creates a completed attempt plus answer rows.
- `updateLecturerSettingsAction`: lecturer-only; updates public profile fields and `profiles.preferences`.
- `upsertPlatformSettingAction` and `updateSupportTicketStatusAction`: superadmin-only.
- `updateUniversitySubscriptionAction`: superadmin-only; upserts a university subscription.

## Data Model
- Added migration `016_profiles_self_select_policy.sql`, creating policy `"Users view own profile"` on `profiles` for `SELECT USING (id = auth.uid())`.
- Added quiz publication fields: `quizzes.is_published`, `published_at`, `instructions`.
- Added attempt result fields defensively: `quiz_attempts.submitted_at`, `max_score`, `percentage`.
- Added `profiles.preferences`, `lessons.video_asset_id`, `video_assets.playback_url`, and `live_classes.topic` if absent.
- Added indexes for quiz lists, question ordering, attempts, support triage, and platform settings.
- Added RLS policies for lecturer quiz management and student published quiz visibility.
- Added `deleted_at` archival columns and active-list indexes for faculties, departments, programs, courses, course sections, modules, lessons, assignments, announcements, and live classes.
- Added `lesson_materials` for link/file/video attachments on lessons, with tenant/lecturer/admin RLS policies.
- Added RLS policy coverage for `role_permissions`, `university_settings`, `course_lecturers`, `lesson_progress`, `video_assets`, and `live_class_recordings`.
- Added live recording contract columns: `course_id`, `provider_recording_id`, `recording_url`, `playback_url`, `s3_key`, and `provider_metadata` on `live_class_recordings`.

## Auth and Security
- Lecturer quiz actions verify the lecturer owns the course section through `course_lecturers`.
- Student quiz submissions verify active enrollment in the quiz course section.
- Platform settings, billing subscriptions, and ticket triage require `super_admin`.
- University settings still require `department_admin` per existing route/action behavior.

## UI System Notes
- New pages use high-contrast glass panels, solid table surfaces, lucide icons, hover/focus states, disabled states, and `motion/react` stagger/entrance animation.
- Dense operational data remains in `DataTable`; creation/triage controls sit in solid glass command panels.
- Student quiz and lesson pages include visible progress, completion, error, empty, and success states.

## Bugs Fixed
- Fixed first-login database error/second-login success behavior by avoiding same-action RLS profile reads and direct action redirects.
- Fixed onboarding completion loop/hanging loader by removing direct action redirects and adding a deterministic client navigation result.
- Added missing profile self-read RLS policy needed after profile creation.
- Fixed app-wide auth guard fragility by moving current-user profile reads out of RLS-dependent paths.
- Prevented repeated Turbopack manifest corruption in local dev by removing `--turbopack` from the default dev script.
- Replaced two explicit placeholder pages.
- Removed stale mock LMS components from `components/`.
- Fixed quiz attempt status mismatch from `submitted` to `completed`.
- Avoided JSX construction inside `try/catch` to satisfy lint rules.
- Removed mock course-registration route by redirecting to the production route.
- Fixed Server Component crashes caused by shared Framer Motion primitives missing `"use client"`.
- Fixed an adjacent client-boundary issue in `FilterDropdown`, `ErrorState`, and `useIsMobile`.
- Prevented `DataTable` from attaching a row click handler when no `onRowClick` callback is supplied.
- Cleared stale `.next` output and confirmed a clean production build succeeds.
- Hardened student, lecturer, and superadmin overview dashboards against partial Supabase read failures.
- Hardened lecturer login against thrown profile lookup errors so it returns a controlled redirect/error instead of the generic client catch message.
- Removed static fake sidebar counts for student live classes, student notifications, lecturer questions, and superadmin support.
- Hardened major list modules across student, lecturer, admin, and superadmin access levels to render empty states when secondary reads fail.
- Removed remaining admin `Not fully implemented` action stubs.
- Replaced inert lecturer buttons for course content, live classes, assignments, and announcements with active mutation flows.
- Removed runtime mock data files, the mock live-class provider, and fake recording provider metadata.

## Risks / Watchouts
- The new migration must be applied to the active Supabase project; otherwise an already-running local app may still bounce authenticated users back to onboarding if the profile read is blocked.
- A protected old Node process is still listening on port 3000 and could not be killed from this shell due to Windows access denial; fresh `next dev` fell back to port 3002 and verified `/student` and `/student/assignments` return 200 there.
- Latest fresh `next dev` fell back to port 3001 because the protected stale process still owns port 3000.
- Some workflows are production-backed but still intentionally lightweight; deeper editing experiences can be expanded later.
- Migration `017_full_crud_archival_contracts.sql` must be applied before the new archive filters and lesson material flows are used in a deployed Supabase project.
- Git safe.directory is configured for `C:/sulvatech/lms`; status/diff inspection works in this shell.
- Migration `018_rls_policy_coverage.sql` must be applied before relying on the updated RLS coverage in a deployed Supabase project.
- Migration `019_live_recording_contract.sql` must be applied before Daily recording webhooks can persist recordings correctly.
- This workspace does not currently show `DAILY_API_KEY` as configured, so real Daily room creation/recording cannot be end-to-end verified until the key is present.
- A protected dev server process still owns port 3001 and cannot be killed from this shell; it can serve stale/corrupt `.next` output and interfere with runtime smoke tests. Stop that terminal/process before final manual browser testing.
- NPM production audit still reports moderate transitive advisories for Next's bundled `postcss`; `npm audit fix --force` proposes breaking/dangerous changes and was not applied.

## Next Actions
- Apply Supabase migration `015_production_page_completion.sql` in the target environment.
- Apply Supabase migration `017_full_crud_archival_contracts.sql` in the target environment.
- Apply Supabase migration `018_rls_policy_coverage.sql` in the target environment.
- Apply Supabase migration `019_live_recording_contract.sql` in the target environment.
- Configure `DAILY_API_KEY` and a base64 Daily webhook HMAC secret in `LIVE_CLASS_PROVIDER_WEBHOOK_SECRET`.
- Run `npm run verify` before each production deploy.
- Run `npm run check:links` after changing navigation, landing footer links, redirects, or route names.
- Browser-test authenticated role flows with seeded users once credentials/session context are available.
