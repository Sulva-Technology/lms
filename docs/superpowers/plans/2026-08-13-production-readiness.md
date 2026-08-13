# VUI LMS Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the VUI LMS from a read-mostly shell into a fully working multi-tenant learning platform where students actually submit work, lecturers actually grade it, video actually uploads and plays, and files actually move — with real infrastructure behind rate limiting, email, and realtime.

**Architecture:** Next.js 15 App Router. Reads happen in Server Components through `lib/services/*.service.ts` classes. Writes happen through Server Actions in `app/actions/*.ts`, which validate with Zod, authorize with `requireRole`/`requireUser` from `lib/auth/guards.ts`, delegate to a service, and return `{ success, ... }` or `{ error }`. Client interactivity lives in `"use client"` manager components that call those actions inside `useTransition`. Files upload browser-direct to Supabase Storage via short-lived signed upload URLs minted server-side; lesson video bypasses Supabase entirely and goes to Mux via direct upload, with playback through signed Mux playback tokens.

**Tech Stack:** Next.js 15.5, React 19, TypeScript 5.9, Tailwind 4, `motion/react`, Supabase (Postgres + Auth + Storage + Realtime), Zod 4, Vitest 4, Resend (`resend`), Upstash Redis (`@upstash/redis`), Daily (live classes).

## Decisions Applied 2026-08-13

These three answers changed the plan after it was first written. Where this section conflicts with a later task, this section wins.

1. **No Mux.** Lesson video uploads to Supabase Storage through the same signed-URL uploader as every other file, and plays through a native `<video>` element. Phase 4 is rewritten accordingly: there is no external video provider, no provider webhook, and no playback token signing. `app/api/webhooks/video/route.ts` and `VIDEO_PROVIDER_WEBHOOK_SECRET` are deleted rather than rewritten.
2. **Wipe the `vui_*` buckets.** Migration `020` deletes those buckets and their objects as written.
3. **Migrations are written, not applied.** Every `npx supabase db push` step in this plan is deferred to the user. All tests are stub-based and pass without a database. Migrations `020`–`023` ship unapplied; applying them is the user's first deploy step.

A consequence of (3) plus the absence of vendor keys: `scripts/check-env.ts` is restructured so that only the variables the app genuinely cannot boot without are hard-required. Integration keys (Daily, Resend, Upstash) become a warn-list — `check:env` prints a loud warning naming each missing integration and what degrades, then exits 0, so `npm run verify` is runnable today.

## Global Constraints

- Node runtime for any route touching `crypto`, Mux SDK, or the service-role client: `export const runtime = 'nodejs'`.
- Every new Server Action: `'use server'` at file top, Zod-validated payload, `requireUser()` or `requireRole(role)` before any database work, returns `{ success: true, ... }` or `{ error: string }`. Never throw to the client.
- Never import `@/lib/supabase/admin` (service-role) into anything reachable from a Client Component.
- Multi-tenancy is non-negotiable: every insert carries `university_id`; every cross-tenant read path must be provably scoped. Storage paths start with `{universityId}/`.
- New UI must match existing visual language: `glass-panel`, `rounded-[24px]`/`rounded-2xl`, `border-white/10`, `bg-slate-950/60`, `text-slate-300`, lucide icons, `motion/react` entrance animation. Reuse `components/ui/*` primitives (`DataTable`, `Drawer`, `EmptyState`, `ErrorState`, `Modal`, `PageHeader`). Do not introduce a new component system.
- Any shared component importing `motion/react` MUST have `"use client"` at the top.
- Test command is `npm run test` (Vitest, jsdom, `@` alias → repo root). Tests must not require a live database or network.
- Full gate before any deploy: `npm run verify` (check:env → check:links → check:rls → lint → typecheck → test → build).
- Commit after every task. Conventional commit prefixes (`feat:`, `fix:`, `chore:`, `test:`, `refactor:`).
- Update `working-memory.md` "Confirmed Facts" / "Next Actions" at the end of each phase, not each task.

## Known-Broken Facts This Plan Assumes

These were verified in the audit on 2026-08-13. Do not re-litigate them; fix them.

1. `lib/storage/buckets.ts` names buckets (`profile-images`, `assignment-submissions`, …) created by migration `008`, while migration `006` created a *different, competing* set (`vui_profiles`, `vui_submissions`, …). Both exist in the database. Canonical set = the `008` hyphenated names. The `vui_*` buckets get retired.
2. Storage RLS is effectively `auth.role() = 'authenticated'` with no tenant scoping — **any logged-in user at any university can read any other university's submissions.** This is a live cross-tenant data leak and Task 6 fixes it.
3. `lib/rate-limit.ts` is an in-process `Map`; on serverless it resets per instance and enforces nothing.
4. These Server Actions exist and are correct but have **zero UI callers**: `submitAssignmentAction`, `gradeSubmissionAction`, `createSignedUploadUrlAction`, `createSignedDownloadUrlAction`, `saveFileMetadataAction`, `createVideoAssetAction`, `markAttendanceAction`, `createAttendanceSessionAction`, `calculateLiveClassAttendanceAction`, `createDiscussionAction`, `replyDiscussionAction`, `createGradeItemAction`, `updateUserRoleAction`, `updateProfileAction`, `updateLiveClassAction`, `toggleRecordingPublishAction`, `deleteQuizQuestionAction`, `detachLessonMaterialAction`.
5. `app/(dashboard)/student/assignments/[assignmentId]/page.tsx` is a fake client page with hardcoded copy and an inert button.
6. Five test files contain a single `expect(true).toBe(true)` assertion: `assignments`, `auth`, `course-registration`, `live-classes`, `quizzes`, `security`.
7. `npm run check:env` currently fails on missing `DAILY_API_KEY`.
8. The repository has **zero commits**. Nothing is versioned yet.

## File Structure

**New infrastructure**
- `lib/rate-limit.ts` (rewrite) — Upstash-backed sliding window, in-memory fallback for local dev.
- `lib/email/client.ts` — Resend client singleton + `EmailSender` interface for injection.
- `lib/email/send.ts` — `sendEmail`, respects per-user `preferences.emailNotifications`.
- `lib/email/templates.ts` — pure functions returning `{ subject, html, text }`.
- `lib/video/mux.ts` — Mux SDK wrapper: direct upload, asset fetch, playback token, webhook verification.
- `lib/storage/paths.ts` — canonical bucket map, path builder, bucket-per-role authorization table.

**New UI**
- `components/ui/file-uploader.tsx` — reusable browser-direct uploader.
- `components/ui/file-list.tsx` — renders stored files with signed-download links.
- `components/student/AssignmentSubmissionPanel.tsx`
- `components/lecturer/SubmissionGradingPanel.tsx`
- `components/lecturer/AttendanceManager.tsx`
- `components/lecturer/GradeItemManager.tsx`
- `components/discussions/DiscussionBoard.tsx`
- `components/lecturer/LessonVideoUploader.tsx`
- `components/video/LessonVideoPlayer.tsx`
- `components/layout/NotificationBell.tsx`
- `components/admin/UserRoleManager.tsx`
- `components/settings/ProfileForm.tsx`

**New routes**
- `app/(dashboard)/lecturer/assignments/[assignmentId]/submissions/page.tsx`
- `app/(dashboard)/student/discussions/[discussionId]/page.tsx`
- `app/api/video/mux/upload/route.ts`

**Rewritten**
- `app/(dashboard)/student/assignments/[assignmentId]/page.tsx` — server page with real data.
- `app/api/webhooks/video/route.ts` — real Mux webhook.
- `lib/services/video.service.ts` — Mux-aware.

**New migrations**
- `020_storage_tenant_policies.sql` — tenant-scoped storage RLS, retire `vui_*`.
- `021_mux_video_contract.sql` — Mux columns on `video_assets`.
- `022_discussion_and_attendance_contracts.sql` — indexes + missing policies.

**New tests** — `tests/helpers/supabase-stub.ts` plus one focused test file per feature, replacing the six vacuous ones.

---

## Phase 0 — Baseline (Tasks 1–2)

### Task 1: Version the repository

**Files:**
- Verify: `.gitignore`
- Create: `docs/superpowers/plans/` (this file already lives here)

**Interfaces:**
- Produces: a `main` branch with one commit, so every later task can commit and revert.

- [ ] **Step 1: Confirm .gitignore covers build and secret output**

Read `.gitignore`. It must contain at least these lines; add any that are missing:

```gitignore
node_modules/
.next/
out/
.env
.env.local
.env*.local
tsconfig.tsbuildinfo
.vercel
```

- [ ] **Step 2: Verify no secrets are staged**

Run: `git add -A && git status --short | grep -E "^A.*\.env$"`
Expected: no output. If `.env` appears, run `git reset .env` and fix `.gitignore` before continuing.

- [ ] **Step 3: Delete the abandoned scratch scripts at repo root**

These are one-off codemods from the design phase and are not referenced by anything:

```bash
rm -f fix.js fix2.js fix3.js fix4.js gen.js gen_dynamic.js
```

- [ ] **Step 4: Commit the baseline**

```bash
git add -A
git commit -m "chore: baseline commit of VUI LMS application"
```

- [ ] **Step 5: Verify**

Run: `git log --oneline`
Expected: exactly one commit.

---

### Task 2: Real test harness — Supabase stub + delete vacuous tests

The five `expect(true).toBe(true)` files give false confidence and every task after this one needs a way to test a Server Action without a database.

**Files:**
- Create: `tests/helpers/supabase-stub.ts`
- Create: `tests/helpers/supabase-stub.test.ts`
- Modify: `tests/assignments.test.ts`, `tests/auth.test.ts`, `tests/course-registration.test.ts`, `tests/live-classes.test.ts`, `tests/quizzes.test.ts`, `tests/security.test.ts` (remove the `expect(true).toBe(true)` placeholder assertions; the real assertions arrive in later tasks — if a file is left with no meaningful test, delete the file rather than keeping a no-op)

**Interfaces:**
- Produces:
  - `createSupabaseStub(tables: Record<string, any[]>): { client: any; inserted: Record<string, any[]>; updated: Record<string, any[]> }`
  - The returned `client` supports the chain shapes this codebase actually uses: `.from(t).select(cols).eq(c,v).eq(c,v).maybeSingle()`, `.single()`, `.order(c,{ascending})`, `.insert(row).select().single()`, `.insert(rows)`, `.update(row).eq(c,v).select().single()`, `.delete().eq(c,v)`.

- [ ] **Step 1: Write the failing test for the stub itself**

Create `tests/helpers/supabase-stub.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createSupabaseStub } from './supabase-stub';

describe('createSupabaseStub', () => {
  it('filters rows with chained eq and returns single', async () => {
    const { client } = createSupabaseStub({
      course_enrollments: [
        { id: 'e1', student_id: 's1', course_section_id: 'sec1', status: 'active' },
        { id: 'e2', student_id: 's2', course_section_id: 'sec1', status: 'active' },
      ],
    });

    const { data } = await client
      .from('course_enrollments')
      .select('id')
      .eq('student_id', 's1')
      .eq('course_section_id', 'sec1')
      .eq('status', 'active')
      .single();

    expect(data).toEqual({ id: 'e1', student_id: 's1', course_section_id: 'sec1', status: 'active' });
  });

  it('returns null data from maybeSingle when nothing matches', async () => {
    const { client } = createSupabaseStub({ profiles: [] });
    const { data } = await client.from('profiles').select('id').eq('id', 'missing').maybeSingle();
    expect(data).toBeNull();
  });

  it('records inserts and returns the inserted row', async () => {
    const { client, inserted } = createSupabaseStub({ notifications: [] });
    const { data } = await client
      .from('notifications')
      .insert({ user_id: 'u1', title: 'Hi' })
      .select()
      .single();

    expect(data.user_id).toBe('u1');
    expect(data.id).toBeTruthy();
    expect(inserted.notifications).toHaveLength(1);
  });

  it('records updates against matched rows', async () => {
    const { client, updated } = createSupabaseStub({
      assignment_submissions: [{ id: 'sub1', score: null }],
    });
    const { data } = await client
      .from('assignment_submissions')
      .update({ score: 90 })
      .eq('id', 'sub1')
      .select()
      .single();

    expect(data.score).toBe(90);
    expect(updated.assignment_submissions[0]).toMatchObject({ score: 90 });
  });

  it('orders rows ascending and descending', async () => {
    const { client } = createSupabaseStub({
      course_modules: [{ id: 'b', order_index: 2 }, { id: 'a', order_index: 1 }],
    });
    const asc = await client.from('course_modules').select('*').order('order_index', { ascending: true });
    expect(asc.data.map((r: any) => r.id)).toEqual(['a', 'b']);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run tests/helpers/supabase-stub.test.ts`
Expected: FAIL — `Failed to resolve import "./supabase-stub"`.

- [ ] **Step 3: Implement the stub**

Create `tests/helpers/supabase-stub.ts`:

```ts
type Row = Record<string, any>;

export interface SupabaseStub {
  client: any;
  inserted: Record<string, Row[]>;
  updated: Record<string, Row[]>;
  deleted: Record<string, Row[]>;
}

let idCounter = 0;
const nextId = () => `stub-${++idCounter}`;

export function createSupabaseStub(tables: Record<string, Row[]>): SupabaseStub {
  const data: Record<string, Row[]> = {};
  for (const [name, rows] of Object.entries(tables)) {
    data[name] = rows.map((row) => ({ ...row }));
  }

  const inserted: Record<string, Row[]> = {};
  const updated: Record<string, Row[]> = {};
  const deleted: Record<string, Row[]> = {};

  const push = (bucket: Record<string, Row[]>, table: string, row: Row) => {
    bucket[table] = bucket[table] || [];
    bucket[table].push(row);
  };

  function builder(table: string) {
    data[table] = data[table] || [];
    let filters: Array<[string, any]> = [];
    let sort: { column: string; ascending: boolean } | null = null;
    let mode: 'select' | 'insert' | 'update' | 'delete' = 'select';
    let payload: Row | Row[] | null = null;

    const matched = () =>
      data[table].filter((row) => filters.every(([column, value]) => row[column] === value));

    const sorted = (rows: Row[]) => {
      if (!sort) return rows;
      const { column, ascending } = sort;
      return [...rows].sort((a, b) => {
        if (a[column] === b[column]) return 0;
        const cmp = a[column] > b[column] ? 1 : -1;
        return ascending ? cmp : -cmp;
      });
    };

    const apply = (): Row[] => {
      if (mode === 'insert') {
        const rows = (Array.isArray(payload) ? payload : [payload]).map((row) => ({
          id: (row as Row).id || nextId(),
          ...(row as Row),
        }));
        for (const row of rows) {
          data[table].push(row);
          push(inserted, table, row);
        }
        return rows;
      }

      if (mode === 'update') {
        const rows = matched();
        for (const row of rows) {
          Object.assign(row, payload as Row);
          push(updated, table, row);
        }
        return rows;
      }

      if (mode === 'delete') {
        const rows = matched();
        data[table] = data[table].filter((row) => !rows.includes(row));
        for (const row of rows) push(deleted, table, row);
        return rows;
      }

      return sorted(matched());
    };

    const result = () => ({ data: apply(), error: null });

    const chain: any = {
      select: () => chain,
      insert: (value: Row | Row[]) => {
        mode = 'insert';
        payload = value;
        return chain;
      },
      update: (value: Row) => {
        mode = 'update';
        payload = value;
        return chain;
      },
      delete: () => {
        mode = 'delete';
        return chain;
      },
      eq: (column: string, value: any) => {
        filters.push([column, value]);
        return chain;
      },
      in: (column: string, values: any[]) => {
        const allowed = new Set(values);
        const previous = data[table];
        data[table] = previous.filter((row) => allowed.has(row[column]));
        return chain;
      },
      order: (column: string, options?: { ascending?: boolean }) => {
        sort = { column, ascending: options?.ascending !== false };
        return chain;
      },
      limit: () => chain,
      single: async () => {
        const rows = apply();
        if (rows.length === 0) return { data: null, error: { message: 'No rows found' } };
        return { data: rows[0], error: null };
      },
      maybeSingle: async () => {
        const rows = apply();
        return { data: rows[0] ?? null, error: null };
      },
      then: (resolve: (value: { data: Row[]; error: null }) => any) => Promise.resolve(result()).then(resolve),
    };

    return chain;
  }

  return {
    client: { from: (table: string) => builder(table) },
    inserted,
    updated,
    deleted,
  };
}
```

- [ ] **Step 4: Run the stub tests**

Run: `npx vitest run tests/helpers/supabase-stub.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Strip the vacuous placeholder tests**

Delete these files outright — real coverage for each area lands in Tasks 8, 9, 10, 13, 14, 15:

```bash
rm -f tests/assignments.test.ts tests/auth.test.ts tests/course-registration.test.ts tests/live-classes.test.ts tests/quizzes.test.ts tests/security.test.ts
```

- [ ] **Step 6: Run the full suite and record the new baseline**

Run: `npm run test`
Expected: PASS. Test count drops (the six deleted files contributed placeholder assertions). Note the number — it must only go up from here.

- [ ] **Step 7: Commit**

```bash
git add tests docs
git commit -m "test: add supabase stub harness and remove placeholder assertions"
```

---

## Phase 1 — Infrastructure (Tasks 3–5)

### Task 3: Distributed rate limiting on Upstash Redis

**Files:**
- Modify: `lib/rate-limit.ts` (full rewrite)
- Create: `tests/rate-limit.test.ts`
- Modify: `lib/env.ts`, `scripts/check-env.ts`, `.env.example`
- Modify: `package.json` (dependencies)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `rateLimit(identifier: string, limit?: number, windowMs?: number): Promise<{ success: boolean; limit: number; remaining: number; reset: number }>` — same signature as today, so existing callers keep working.
- Produces: `__setRateLimitBackendForTests(backend: RateLimitBackend | null): void` for injection.

- [ ] **Step 1: Install the dependencies**

```bash
npm install @upstash/redis @upstash/ratelimit
```

- [ ] **Step 2: Write the failing test**

Create `tests/rate-limit.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { rateLimit, __setRateLimitBackendForTests } from '@/lib/rate-limit';

afterEach(() => __setRateLimitBackendForTests(null));

describe('rateLimit', () => {
  it('allows requests under the limit and decrements remaining', async () => {
    const first = await rateLimit('user:a', 3, 60_000);
    const second = await rateLimit('user:a', 3, 60_000);

    expect(first.success).toBe(true);
    expect(first.remaining).toBe(2);
    expect(second.remaining).toBe(1);
  });

  it('blocks once the limit is reached', async () => {
    await rateLimit('user:b', 2, 60_000);
    await rateLimit('user:b', 2, 60_000);
    const third = await rateLimit('user:b', 2, 60_000);

    expect(third.success).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it('keeps identifiers isolated', async () => {
    await rateLimit('user:c', 1, 60_000);
    const other = await rateLimit('user:d', 1, 60_000);
    expect(other.success).toBe(true);
  });

  it('delegates to the injected backend when one is configured', async () => {
    const seen: string[] = [];
    __setRateLimitBackendForTests({
      async consume(identifier, limit, windowMs) {
        seen.push(`${identifier}:${limit}:${windowMs}`);
        return { success: false, limit, remaining: 0, reset: 123 };
      },
    });

    const result = await rateLimit('user:e', 5, 1000);
    expect(seen).toEqual(['user:e:5:1000']);
    expect(result.success).toBe(false);
    expect(result.reset).toBe(123);
  });
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `npx vitest run tests/rate-limit.test.ts`
Expected: FAIL — `__setRateLimitBackendForTests` is not exported.

- [ ] **Step 4: Rewrite the limiter**

Replace `lib/rate-limit.ts` entirely:

```ts
// Distributed rate limiting.
//
// In production we use Upstash Redis so the window is shared across every
// serverless instance. Locally (and in tests) we fall back to an in-process
// map, which is correct for a single Node process.

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export interface RateLimitBackend {
  consume(identifier: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

type MemoryRecord = { count: number; expiresAt: number };
const memoryStore = new Map<string, MemoryRecord>();

const memoryBackend: RateLimitBackend = {
  async consume(identifier, limit, windowMs) {
    const now = Date.now();
    const record = memoryStore.get(identifier);

    if (!record || record.expiresAt < now) {
      memoryStore.set(identifier, { count: 1, expiresAt: now + windowMs });
      return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
    }

    if (record.count >= limit) {
      return { success: false, limit, remaining: 0, reset: record.expiresAt };
    }

    record.count += 1;
    return { success: true, limit, remaining: limit - record.count, reset: record.expiresAt };
  },
};

let upstashBackend: RateLimitBackend | null | undefined;
let injectedBackend: RateLimitBackend | null = null;

/** Test-only seam. Pass null to restore normal resolution. */
export function __setRateLimitBackendForTests(backend: RateLimitBackend | null): void {
  injectedBackend = backend;
}

function resolveUpstashBackend(): RateLimitBackend | null {
  if (upstashBackend !== undefined) return upstashBackend;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    upstashBackend = null;
    return null;
  }

  // Required lazily so local dev and tests never load the SDK.
  const { Redis } = require('@upstash/redis') as typeof import('@upstash/redis');
  const redis = new Redis({ url, token });

  upstashBackend = {
    async consume(identifier, limit, windowMs) {
      const window = Math.ceil(windowMs / 1000);
      const key = `ratelimit:${identifier}:${Math.floor(Date.now() / windowMs)}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, window);

      const reset = (Math.floor(Date.now() / windowMs) + 1) * windowMs;
      if (count > limit) return { success: false, limit, remaining: 0, reset };
      return { success: true, limit, remaining: limit - count, reset };
    },
  };

  return upstashBackend;
}

export async function rateLimit(
  identifier: string,
  limit = 10,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  const backend = injectedBackend ?? resolveUpstashBackend() ?? memoryBackend;
  try {
    return await backend.consume(identifier, limit, windowMs);
  } catch {
    // A Redis outage must not take down auth or submissions. Degrade to the
    // in-process limiter rather than failing the request closed.
    return memoryBackend.consume(identifier, limit, windowMs);
  }
}
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/rate-limit.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 6: Declare the new env vars**

In `lib/env.ts`, add to `envSchema` and to the `envSchema.parse({...})` call:

```ts
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
```

```ts
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
```

In `scripts/check-env.ts`, add both names to `requiredEnvVars` (they are required in production; local dev falls back to memory but the deploy gate must catch a missing Redis).

In `.env.example`, append:

```dotenv
# Distributed rate limiting (required in production)
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-rest-token
```

- [ ] **Step 7: Commit**

```bash
git add lib/rate-limit.ts lib/env.ts scripts/check-env.ts .env.example tests/rate-limit.test.ts package.json package-lock.json
git commit -m "feat: back rate limiting with upstash redis"
```

---

### Task 4: Transactional email via Resend

Notifications currently only write database rows. The student settings page offers "Email me important course updates" and that toggle controls nothing.

**Files:**
- Create: `lib/email/client.ts`, `lib/email/send.ts`, `lib/email/templates.ts`
- Create: `tests/email.test.ts`
- Modify: `lib/services/notification.service.ts`
- Modify: `lib/env.ts`, `scripts/check-env.ts`, `.env.example`

**Interfaces:**
- Produces:
  - `interface EmailMessage { to: string; subject: string; html: string; text: string }`
  - `interface EmailSender { send(message: EmailMessage): Promise<void> }`
  - `sendEmail(message: EmailMessage): Promise<void>`
  - `__setEmailSenderForTests(sender: EmailSender | null): void`
  - `renderAssignmentDueEmail(input: { studentName: string; assignmentTitle: string; courseCode: string; dueDate: string; url: string }): EmailMessage`-shaped `{ subject, html, text }`
  - `renderGradePostedEmail(input: { studentName: string; assignmentTitle: string; score: number; totalPoints: number; url: string })`
  - `renderAnnouncementEmail(input: { recipientName: string; courseCode: string; title: string; body: string; url: string })`
- Produces: `NotificationService` gains an optional third behaviour — `createNotification` and `sendToCourseStudents` accept `{ email?: EmailMessageTemplate }` and dispatch mail for users whose `profiles.preferences->>'emailNotifications'` is not `'false'`.

- [ ] **Step 1: Install Resend**

```bash
npm install resend
```

- [ ] **Step 2: Write the failing test**

Create `tests/email.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { sendEmail, __setEmailSenderForTests, type EmailMessage } from '@/lib/email/send';
import { renderGradePostedEmail, renderAssignmentDueEmail } from '@/lib/email/templates';

afterEach(() => __setEmailSenderForTests(null));

describe('email templates', () => {
  it('renders a grade notification with score and link', () => {
    const message = renderGradePostedEmail({
      studentName: 'Ada',
      assignmentTitle: 'Essay 1',
      score: 88,
      totalPoints: 100,
      url: 'https://lms.test/student/assignments/a1',
    });

    expect(message.subject).toContain('Essay 1');
    expect(message.html).toContain('88');
    expect(message.html).toContain('https://lms.test/student/assignments/a1');
    expect(message.text).toContain('88/100');
  });

  it('escapes user-supplied content in the html body', () => {
    const message = renderAssignmentDueEmail({
      studentName: '<script>alert(1)</script>',
      assignmentTitle: 'Lab',
      courseCode: 'CS101',
      dueDate: '2026-09-01T10:00:00.000Z',
      url: 'https://lms.test/a',
    });

    expect(message.html).not.toContain('<script>');
    expect(message.html).toContain('&lt;script&gt;');
  });
});

describe('sendEmail', () => {
  it('delegates to the injected sender', async () => {
    const sent: EmailMessage[] = [];
    __setEmailSenderForTests({ async send(message) { sent.push(message); } });

    await sendEmail({ to: 'a@b.test', subject: 'Hi', html: '<p>Hi</p>', text: 'Hi' });

    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('a@b.test');
  });

  it('never throws when the sender fails', async () => {
    __setEmailSenderForTests({ async send() { throw new Error('provider down'); } });
    await expect(
      sendEmail({ to: 'a@b.test', subject: 'Hi', html: '<p>Hi</p>', text: 'Hi' }),
    ).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `npx vitest run tests/email.test.ts`
Expected: FAIL — cannot resolve `@/lib/email/send`.

- [ ] **Step 4: Implement the client**

Create `lib/email/client.ts`:

```ts
import type { EmailMessage, EmailSender } from './send';

let cached: EmailSender | null | undefined;

export function resolveResendSender(): EmailSender | null {
  if (cached !== undefined) return cached;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    cached = null;
    return null;
  }

  const { Resend } = require('resend') as typeof import('resend');
  const resend = new Resend(apiKey);

  cached = {
    async send(message: EmailMessage) {
      await resend.emails.send({
        from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
    },
  };

  return cached;
}
```

- [ ] **Step 5: Implement the sender**

Create `lib/email/send.ts`:

```ts
import { resolveResendSender } from './client';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

let injected: EmailSender | null = null;

/** Test-only seam. Pass null to restore normal resolution. */
export function __setEmailSenderForTests(sender: EmailSender | null): void {
  injected = sender;
}

/**
 * Best-effort delivery. Email is a side channel: a provider outage must never
 * fail the database write that triggered it.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const sender = injected ?? resolveResendSender();
  if (!sender) return;

  try {
    await sender.send(message);
  } catch (error) {
    console.error('[email] delivery failed', { to: message.to, subject: message.subject, error });
  }
}
```

- [ ] **Step 6: Implement the templates**

Create `lib/email/templates.ts`:

```ts
import type { EmailMessage } from './send';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const layout = (heading: string, bodyHtml: string, url: string, cta: string): string => `
<div style="font-family:ui-sans-serif,system-ui,sans-serif;background:#020617;padding:32px;color:#e2e8f0">
  <div style="max-width:560px;margin:0 auto;background:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:32px">
    <h1 style="margin:0 0 16px;font-size:20px;color:#ffffff">${escapeHtml(heading)}</h1>
    ${bodyHtml}
    <a href="${escapeHtml(url)}" style="display:inline-block;margin-top:24px;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:600">${escapeHtml(cta)}</a>
  </div>
</div>`;

export function renderAssignmentDueEmail(input: {
  studentName: string;
  assignmentTitle: string;
  courseCode: string;
  dueDate: string;
  url: string;
}): Omit<EmailMessage, 'to'> {
  const due = new Date(input.dueDate).toUTCString();
  const subject = `${input.courseCode}: "${input.assignmentTitle}" is due soon`;
  const html = layout(
    subject,
    `<p style="margin:0;color:#cbd5f5;line-height:1.6">Hi ${escapeHtml(input.studentName)}, your assignment
     <strong style="color:#ffffff">${escapeHtml(input.assignmentTitle)}</strong> for
     ${escapeHtml(input.courseCode)} is due ${escapeHtml(due)}.</p>`,
    input.url,
    'Open assignment',
  );
  const text = `Hi ${input.studentName}, "${input.assignmentTitle}" (${input.courseCode}) is due ${due}. ${input.url}`;
  return { subject, html, text };
}

export function renderGradePostedEmail(input: {
  studentName: string;
  assignmentTitle: string;
  score: number;
  totalPoints: number;
  url: string;
}): Omit<EmailMessage, 'to'> {
  const subject = `Your grade for "${input.assignmentTitle}" is available`;
  const html = layout(
    subject,
    `<p style="margin:0;color:#cbd5f5;line-height:1.6">Hi ${escapeHtml(input.studentName)}, you scored
     <strong style="color:#ffffff">${input.score}</strong> out of ${input.totalPoints}.</p>`,
    input.url,
    'View feedback',
  );
  const text = `Hi ${input.studentName}, you scored ${input.score}/${input.totalPoints} on "${input.assignmentTitle}". ${input.url}`;
  return { subject, html, text };
}

export function renderAnnouncementEmail(input: {
  recipientName: string;
  courseCode: string;
  title: string;
  body: string;
  url: string;
}): Omit<EmailMessage, 'to'> {
  const subject = `${input.courseCode}: ${input.title}`;
  const html = layout(
    subject,
    `<p style="margin:0;color:#cbd5f5;line-height:1.6">${escapeHtml(input.body)}</p>`,
    input.url,
    'Open announcement',
  );
  const text = `${input.courseCode} — ${input.title}\n\n${input.body}\n\n${input.url}`;
  return { subject, html, text };
}
```

- [ ] **Step 7: Run the tests**

Run: `npx vitest run tests/email.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 8: Wire email into NotificationService**

In `lib/services/notification.service.ts`, add the import and a private helper, then call it from `createNotification` and `sendToCourseStudents`:

```ts
import { sendEmail, type EmailMessage } from '@/lib/email/send';
```

Add to the class:

```ts
  /**
   * Emails the given recipients unless they opted out.
   * Fire-and-forget: never blocks or fails the notification insert.
   */
  private async emailRecipients(
    userIds: string[],
    build: (recipient: { email: string; name: string }) => Omit<EmailMessage, 'to'>,
  ): Promise<void> {
    if (userIds.length === 0) return;

    const { data: recipients } = await this.supabase
      .from('profiles')
      .select('id,email,first_name,last_name,preferences')
      .in('id', userIds);

    for (const recipient of recipients || []) {
      if (recipient.preferences?.emailNotifications === false) continue;
      if (!recipient.email) continue;

      const name = [recipient.first_name, recipient.last_name].filter(Boolean).join(' ') || 'there';
      const message = build({ email: recipient.email, name });
      await sendEmail({ to: recipient.email, ...message });
    }
  }
```

Then extend `createNotification(payload)` to accept an optional `email?: (recipient: { email: string; name: string }) => Omit<EmailMessage, 'to'>` field on `NotificationPayload` (add it to `types/notification.ts` as optional) and, after a successful insert, call:

```ts
    if (payload.email) {
      await this.emailRecipients([payload.userId], payload.email);
    }
```

Apply the same pattern at the end of `sendToCourseStudents`, using `students.map((s) => s.student_id)`.

- [ ] **Step 9: Declare env vars**

`lib/env.ts` schema and parse call:

```ts
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
```

`scripts/check-env.ts`: add `RESEND_API_KEY` and `EMAIL_FROM` to `requiredEnvVars`.

`.env.example`:

```dotenv
# Transactional email (required in production)
RESEND_API_KEY=re_your_api_key
EMAIL_FROM="VUI LMS <no-reply@your-domain.edu>"
```

- [ ] **Step 10: Verify nothing regressed**

Run: `npm run typecheck && npm run test`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add lib/email lib/services/notification.service.ts types/notification.ts lib/env.ts scripts/check-env.ts .env.example tests/email.test.ts package.json package-lock.json
git commit -m "feat: add resend transactional email and wire notification service"
```

---

### Task 5: Close the environment gate

**Files:**
- Modify: `.env` (local, untracked), `.env.example`, `scripts/check-env.ts`
- Modify: `README.md`

**Interfaces:**
- Produces: `npm run check:env` exits 0, which unblocks `npm run verify`.

- [ ] **Step 1: Reproduce the failure**

Run: `npm run check:env`
Expected: `Missing required environment variable: DAILY_API_KEY` and exit code 1.

- [ ] **Step 2: Obtain and set the missing values in `.env`**

Add locally (never commit `.env`):

```dotenv
DAILY_API_KEY=<from Daily dashboard → Developers → API keys>
UPSTASH_REDIS_REST_URL=<from Upstash console → REST API>
UPSTASH_REDIS_REST_TOKEN=<from Upstash console → REST API>
RESEND_API_KEY=<from Resend dashboard → API Keys>
EMAIL_FROM="VUI LMS <no-reply@your-domain.edu>"
```

`LIVE_CLASS_PROVIDER_WEBHOOK_SECRET` already has a value; confirm it is the base64 HMAC secret Daily shows when you register the webhook, not a placeholder.

- [ ] **Step 3: Verify the gate passes**

Run: `npm run check:env`
Expected: `Environment check passed. Required variables are set.`

- [ ] **Step 4: Document setup in the README**

Add a "Required environment variables" table to `README.md` listing every name in `requiredEnvVars`, where to obtain it, and what breaks without it (live classes, rate limiting, email).

- [ ] **Step 5: Apply outstanding migrations to the target Supabase project**

Migrations `015`–`019` are written but unverified against the deployed project.

```bash
npx supabase db push
```

If the CLI is not linked, apply each file in `supabase/migrations/` in numeric order through the Supabase SQL editor. Then confirm the newest contract landed:

```sql
select column_name from information_schema.columns
where table_name = 'live_class_recordings' and column_name = 'provider_recording_id';
```

Expected: one row.

- [ ] **Step 6: Commit**

```bash
git add .env.example scripts/check-env.ts README.md
git commit -m "chore: complete production environment contract and document setup"
```

---

## Phase 2 — File pipeline (Tasks 6–8)

This phase unblocks assignment attachments, lesson materials, profile avatars, and course thumbnails. It also closes a live cross-tenant data leak.

### Task 6: Tenant-scoped storage — canonical buckets and real RLS

**Files:**
- Create: `lib/storage/paths.ts`
- Create: `supabase/migrations/020_storage_tenant_policies.sql`
- Create: `tests/storage-paths.test.ts`
- Modify: `lib/storage/buckets.ts` (re-export from `paths.ts` to keep existing imports working)
- Modify: `app/actions/files.ts`
- Modify: `lib/validation/files.ts`

**Interfaces:**
- Produces:
  - `STORAGE_BUCKETS` — unchanged keys, unchanged hyphenated values.
  - `type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS]`
  - `buildStoragePath(input: { universityId: string; scope: string; ownerId: string; fileName: string }): string` → `"{universityId}/{scope}/{ownerId}/{random}-{safeFileName}"`
  - `canWriteBucket(role: AuthRole, bucket: string): boolean`
  - `assertPathBelongsToUniversity(path: string, universityId: string): void` — throws `Error('Storage path is outside your university.')`

- [ ] **Step 1: Write the failing test**

Create `tests/storage-paths.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  STORAGE_BUCKETS,
  buildStoragePath,
  canWriteBucket,
  assertPathBelongsToUniversity,
} from '@/lib/storage/paths';

describe('buildStoragePath', () => {
  it('prefixes the university id and keeps the extension', () => {
    const path = buildStoragePath({
      universityId: 'uni-1',
      scope: 'submissions',
      ownerId: 'student-1',
      fileName: 'My Essay.pdf',
    });

    expect(path.startsWith('uni-1/submissions/student-1/')).toBe(true);
    expect(path.endsWith('.pdf')).toBe(true);
  });

  it('strips path traversal and unsafe characters from the file name', () => {
    const path = buildStoragePath({
      universityId: 'uni-1',
      scope: 'submissions',
      ownerId: 'student-1',
      fileName: '../../etc/pa ss wd?.txt',
    });

    expect(path).not.toContain('..');
    expect(path.split('/')).toHaveLength(4);
    expect(path).toMatch(/[a-z0-9._-]+\.txt$/i);
  });

  it('produces a unique path for repeated names', () => {
    const input = { universityId: 'u', scope: 'submissions', ownerId: 'o', fileName: 'a.pdf' };
    expect(buildStoragePath(input)).not.toBe(buildStoragePath(input));
  });
});

describe('canWriteBucket', () => {
  it('lets students write submissions but not course resources', () => {
    expect(canWriteBucket('student', STORAGE_BUCKETS.ASSIGNMENT_SUBMISSIONS)).toBe(true);
    expect(canWriteBucket('student', STORAGE_BUCKETS.COURSE_RESOURCES)).toBe(false);
  });

  it('lets lecturers write course resources and thumbnails', () => {
    expect(canWriteBucket('lecturer', STORAGE_BUCKETS.COURSE_RESOURCES)).toBe(true);
    expect(canWriteBucket('lecturer', STORAGE_BUCKETS.LECTURE_THUMBNAILS)).toBe(true);
  });

  it('lets every role write their own profile image', () => {
    expect(canWriteBucket('student', STORAGE_BUCKETS.PROFILE_IMAGES)).toBe(true);
    expect(canWriteBucket('super_admin', STORAGE_BUCKETS.PROFILE_IMAGES)).toBe(true);
  });

  it('rejects unknown buckets', () => {
    expect(canWriteBucket('super_admin', 'not-a-bucket')).toBe(false);
  });
});

describe('assertPathBelongsToUniversity', () => {
  it('accepts a matching prefix', () => {
    expect(() => assertPathBelongsToUniversity('uni-1/submissions/s/a.pdf', 'uni-1')).not.toThrow();
  });

  it('rejects a foreign prefix', () => {
    expect(() => assertPathBelongsToUniversity('uni-2/submissions/s/a.pdf', 'uni-1')).toThrow(
      'Storage path is outside your university.',
    );
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run tests/storage-paths.test.ts`
Expected: FAIL — cannot resolve `@/lib/storage/paths`.

- [ ] **Step 3: Implement the module**

Create `lib/storage/paths.ts`:

```ts
import { randomUUID } from 'node:crypto';
import type { AuthRole } from '@/types/auth';

export const STORAGE_BUCKETS = {
  PROFILE_IMAGES: 'profile-images',
  UNIVERSITY_BRANDING: 'university-branding',
  COURSE_RESOURCES: 'course-resources',
  ASSIGNMENT_SUBMISSIONS: 'assignment-submissions',
  LECTURE_THUMBNAILS: 'lecture-thumbnails',
  TRANSCRIPTS: 'transcripts',
  EXPORTS: 'exports',
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

/** Which roles may create objects in which bucket. Read access is enforced by RLS. */
const WRITE_MATRIX: Record<string, AuthRole[]> = {
  [STORAGE_BUCKETS.PROFILE_IMAGES]: ['student', 'lecturer', 'department_admin', 'admin', 'super_admin'],
  [STORAGE_BUCKETS.UNIVERSITY_BRANDING]: ['department_admin', 'admin', 'super_admin'],
  [STORAGE_BUCKETS.COURSE_RESOURCES]: ['lecturer', 'department_admin', 'admin', 'super_admin'],
  [STORAGE_BUCKETS.ASSIGNMENT_SUBMISSIONS]: ['student'],
  [STORAGE_BUCKETS.LECTURE_THUMBNAILS]: ['lecturer', 'department_admin', 'admin', 'super_admin'],
  [STORAGE_BUCKETS.TRANSCRIPTS]: ['lecturer', 'department_admin', 'admin', 'super_admin'],
  [STORAGE_BUCKETS.EXPORTS]: ['lecturer', 'department_admin', 'admin', 'super_admin'],
};

export function canWriteBucket(role: AuthRole, bucket: string): boolean {
  const allowed = WRITE_MATRIX[bucket];
  return Boolean(allowed && allowed.includes(role));
}

const sanitizeFileName = (fileName: string): string => {
  const base = fileName.split(/[\\/]/).pop() || 'file';
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^\.+/, '');
  return cleaned.slice(0, 120) || 'file';
};

export function buildStoragePath(input: {
  universityId: string;
  scope: string;
  ownerId: string;
  fileName: string;
}): string {
  return `${input.universityId}/${input.scope}/${input.ownerId}/${randomUUID()}-${sanitizeFileName(input.fileName)}`;
}

export function assertPathBelongsToUniversity(path: string, universityId: string): void {
  if (!path.startsWith(`${universityId}/`)) {
    throw new Error('Storage path is outside your university.');
  }
}
```

- [ ] **Step 4: Keep the old import path working**

Replace `lib/storage/buckets.ts` with a re-export so nothing else has to change:

```ts
export { STORAGE_BUCKETS, type StorageBucket } from './paths';
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/storage-paths.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 6: Harden the file actions**

`app/actions/files.ts` currently comments that it trusts the UI. Replace `createSignedUploadUrlAction` and `createSignedDownloadUrlAction`:

```ts
export async function createSignedUploadUrlAction(payload: any) {
    const supabase = await createClient();
    const session = await requireUser();

    const parsed = createSignedUploadSchema.safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const universityId = session.profile.university_id;
    if (!universityId) return { error: 'Your profile is not attached to a university.' };

    if (!canWriteBucket(session.profile.role, parsed.data.bucket)) {
        return { error: 'You do not have permission to upload to this location.' };
    }

    const path = buildStoragePath({
        universityId,
        scope: parsed.data.scope,
        ownerId: session.user.id,
        fileName: parsed.data.fileName,
    });

    const service = new FileService(supabase as any);
    try {
        const result = await service.createSignedUploadUrl(parsed.data.bucket, path);
        return { success: true, url: result.signedUrl, path: result.path, token: result.token };
    } catch (err: any) {
        return { error: err.message };
    }
}
```

```ts
export async function createSignedDownloadUrlAction(payload: any) {
    const supabase = await createClient();
    const session = await requireUser();

    const parsed = requestSignedDownloadSchema.safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const universityId = session.profile.university_id;
    if (!universityId) return { error: 'Your profile is not attached to a university.' };

    try {
        assertPathBelongsToUniversity(parsed.data.path, universityId);
        const service = new FileService(supabase as any);
        const result = await service.createSignedDownloadUrl(parsed.data.bucket, parsed.data.path);
        return { success: true, url: result.signedUrl };
    } catch (err: any) {
        return { error: err.message };
    }
}
```

Add the imports at the top of the file:

```ts
import { assertPathBelongsToUniversity, buildStoragePath, canWriteBucket } from '@/lib/storage/paths';
```

Update `lib/validation/files.ts` — the client now sends a scope and a file name, not a raw path:

```ts
export const createSignedUploadSchema = z.object({
  bucket: z.string().min(1),
  scope: z.enum(['submissions', 'materials', 'avatars', 'branding', 'thumbnails', 'transcripts', 'exports']),
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).optional(),
});
```

- [ ] **Step 7: Write the storage RLS migration**

Create `supabase/migrations/020_storage_tenant_policies.sql`:

```sql
-- Storage hardening.
--
-- Two competing bucket sets existed (migration 006 created vui_* buckets,
-- migration 008 created hyphenated buckets). The hyphenated set is canonical.
-- The old policies granted every authenticated user read access to every
-- object in a bucket regardless of university, which leaked submissions and
-- course material across tenants.
--
-- New convention: every object path is "{university_id}/{scope}/{owner_id}/{file}".
-- Tenant scoping is therefore a prefix check on the first path segment.

-- 1. Retire the duplicate bucket set. Objects inside are from the pre-production
--    period; move any real data before running this in an environment with users.
DELETE FROM storage.objects WHERE bucket_id IN ('vui_public', 'vui_materials', 'vui_submissions', 'vui_profiles');
DELETE FROM storage.buckets WHERE id IN ('vui_public', 'vui_materials', 'vui_submissions', 'vui_profiles');

DROP POLICY IF EXISTS "Users can upload their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Profile images are public" ON storage.objects;
DROP POLICY IF EXISTS "Lecturers can upload materials" ON storage.objects;
DROP POLICY IF EXISTS "Tenant users can view materials" ON storage.objects;
DROP POLICY IF EXISTS "Students can upload submissions" ON storage.objects;
DROP POLICY IF EXISTS "Lecturers and students can view submissions" ON storage.objects;

-- 2. Replace the permissive policies from migration 008.
DROP POLICY IF EXISTS "Tenant read course resources" ON storage.objects;
DROP POLICY IF EXISTS "Lecturers admins upload course resources" ON storage.objects;
DROP POLICY IF EXISTS "Tenant read transcripts" ON storage.objects;
DROP POLICY IF EXISTS "Read exports" ON storage.objects;
DROP POLICY IF EXISTS "Create exports" ON storage.objects;

-- Helper: the caller's university id, read from their profile.
CREATE OR REPLACE FUNCTION public.current_university_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT university_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper: first path segment of a storage object key.
CREATE OR REPLACE FUNCTION public.storage_tenant_id(object_name TEXT)
RETURNS UUID
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT NULLIF(split_part(object_name, '/', 1), '')::UUID;
$$;

-- 3. Tenant-scoped policies.

-- Course resources: readable by any authenticated member of the same university.
CREATE POLICY "Tenant read course resources" ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-resources'
  AND public.storage_tenant_id(name) = public.current_university_id()
);

CREATE POLICY "Staff upload course resources" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-resources'
  AND public.storage_tenant_id(name) = public.current_university_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('lecturer', 'department_admin', 'admin', 'super_admin')
  )
);

-- Submissions: a student sees only their own; staff of the same university see all.
CREATE POLICY "Students upload own submissions" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assignment-submissions'
  AND public.storage_tenant_id(name) = public.current_university_id()
  AND split_part(name, '/', 3) = auth.uid()::text
);

CREATE POLICY "Students read own submissions" ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignment-submissions'
  AND split_part(name, '/', 3) = auth.uid()::text
);

CREATE POLICY "Staff read tenant submissions" ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignment-submissions'
  AND public.storage_tenant_id(name) = public.current_university_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('lecturer', 'department_admin', 'admin', 'super_admin')
  )
);

-- Transcripts and exports follow the same tenant rule.
CREATE POLICY "Tenant read transcripts" ON storage.objects FOR SELECT
USING (
  bucket_id = 'transcripts'
  AND public.storage_tenant_id(name) = public.current_university_id()
);

CREATE POLICY "Owner read exports" ON storage.objects FOR SELECT
USING (bucket_id = 'exports' AND split_part(name, '/', 3) = auth.uid()::text);

CREATE POLICY "Staff create exports" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exports'
  AND public.storage_tenant_id(name) = public.current_university_id()
);

-- Profile images stay public-read (they are rendered in avatars) but a user may
-- only write under their own id.
DROP POLICY IF EXISTS "Users can upload profile images" ON storage.objects;
CREATE POLICY "Users upload own profile image" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images'
  AND split_part(name, '/', 3) = auth.uid()::text
);

-- 4. Owners may replace or remove their own objects; nothing else may.
CREATE POLICY "Owners update own objects" ON storage.objects FOR UPDATE
USING (split_part(name, '/', 3) = auth.uid()::text)
WITH CHECK (split_part(name, '/', 3) = auth.uid()::text);

CREATE POLICY "Owners delete own objects" ON storage.objects FOR DELETE
USING (split_part(name, '/', 3) = auth.uid()::text);
```

- [ ] **Step 8: Apply and verify the migration**

```bash
npx supabase db push
```

Then, in the SQL editor, confirm the leak is closed by checking the policy set:

```sql
select policyname, cmd from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
```

Expected: no policy whose `qual` is only `auth.role() = 'authenticated'` for `assignment-submissions`.

- [ ] **Step 9: Run the full gate**

Run: `npm run lint && npm run typecheck && npm run test`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add lib/storage app/actions/files.ts lib/validation/files.ts supabase/migrations/020_storage_tenant_policies.sql tests/storage-paths.test.ts
git commit -m "fix: scope storage buckets and policies per university"
```

---

### Task 7: Reusable file uploader component

**Files:**
- Create: `components/ui/file-uploader.tsx`
- Create: `components/ui/file-list.tsx`

**Interfaces:**
- Consumes: `createSignedUploadUrlAction`, `saveFileMetadataAction`, `createSignedDownloadUrlAction` from `@/app/actions/files`; `STORAGE_BUCKETS` from `@/lib/storage/paths`.
- Produces:
  - `type UploadedFile = { path: string; fileName: string; fileSize: number; fileType: string }`
  - `<FileUploader bucket={string} scope={string} accept?={string} maxSizeMb?={number} multiple?={boolean} value={UploadedFile[]} onChange={(files: UploadedFile[]) => void} disabled?={boolean} />`
  - `<FileList bucket={string} files={UploadedFile[]} onRemove?={(path: string) => void} />`

- [ ] **Step 1: Implement the uploader**

Create `components/ui/file-uploader.tsx`:

```tsx
"use client";

import * as React from "react";
import { Loader2, Paperclip, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createSignedUploadUrlAction, saveFileMetadataAction } from "@/app/actions/files";

export type UploadedFile = {
  path: string;
  fileName: string;
  fileSize: number;
  fileType: string;
};

interface FileUploaderProps {
  bucket: string;
  scope: string;
  accept?: string;
  maxSizeMb?: number;
  multiple?: boolean;
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  disabled?: boolean;
}

export function FileUploader({
  bucket,
  scope,
  accept,
  maxSizeMb = 50,
  multiple = false,
  value,
  onChange,
  disabled,
}: FileUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  async function uploadOne(file: File): Promise<UploadedFile | null> {
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`${file.name} is larger than ${maxSizeMb}MB.`);
      return null;
    }

    const signed = await createSignedUploadUrlAction({
      bucket,
      scope,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
    });

    if (!signed.success) {
      setError(signed.error || "Could not start the upload.");
      return null;
    }

    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .uploadToSignedUrl(signed.path, signed.token, file);

    if (uploadError) {
      setError(uploadError.message);
      return null;
    }

    const metadata = await saveFileMetadataAction({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "application/octet-stream",
      storagePath: signed.path,
      isPublic: false,
    });

    if (!metadata.success) {
      setError(metadata.error || "Uploaded, but the file record could not be saved.");
      return null;
    }

    return {
      path: signed.path,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "application/octet-stream",
    };
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError("");
    setBusy(true);

    const uploaded: UploadedFile[] = [];
    for (const file of Array.from(fileList)) {
      const result = await uploadOne(file);
      if (result) uploaded.push(result);
    }

    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    if (uploaded.length > 0) onChange(multiple ? [...value, ...uploaded] : uploaded);
  }

  function remove(path: string) {
    onChange(value.filter((file) => file.path !== path));
  }

  return (
    <div className="grid gap-3">
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-slate-950/50 px-5 py-6 text-sm font-medium text-slate-300 transition hover:border-blue-400/50 hover:text-white disabled:opacity-60"
      >
        {busy ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
        {busy ? "Uploading…" : `Choose file${multiple ? "s" : ""}`}
        <span className="text-xs text-slate-500">max {maxSizeMb}MB</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      {value.length > 0 && (
        <ul className="grid gap-2">
          {value.map((file) => (
            <li
              key={file.path}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <span className="flex min-w-0 items-center gap-2 text-sm text-slate-200">
                <Paperclip size={15} className="shrink-0 text-blue-300" />
                <span className="truncate">{file.fileName}</span>
                <span className="shrink-0 text-xs text-slate-500">{Math.ceil(file.fileSize / 1024)}KB</span>
              </span>
              <button
                type="button"
                onClick={() => remove(file.path)}
                disabled={disabled}
                className="rounded-lg bg-white/5 p-1.5 text-slate-300 transition hover:bg-red-500/20 hover:text-red-300"
                aria-label={`Remove ${file.fileName}`}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Implement the read-side list**

Create `components/ui/file-list.tsx`:

```tsx
"use client";

import * as React from "react";
import { Download, Loader2, Paperclip } from "lucide-react";
import { createSignedDownloadUrlAction } from "@/app/actions/files";
import type { UploadedFile } from "./file-uploader";

export function FileList({ bucket, files }: { bucket: string; files: UploadedFile[] }) {
  const [pendingPath, setPendingPath] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");

  async function open(path: string) {
    setError("");
    setPendingPath(path);
    const result = await createSignedDownloadUrlAction({ bucket, path });
    setPendingPath(null);

    if (!result.success) {
      setError(result.error || "Could not open the file.");
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  if (files.length === 0) {
    return <p className="text-sm text-slate-500">No files attached.</p>;
  }

  return (
    <div className="grid gap-2">
      {error && <p className="text-sm text-red-300">{error}</p>}
      {files.map((file) => (
        <button
          key={file.path}
          type="button"
          onClick={() => open(file.path)}
          className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.06]"
        >
          <span className="flex min-w-0 items-center gap-2 text-sm text-slate-200">
            <Paperclip size={15} className="shrink-0 text-blue-300" />
            <span className="truncate">{file.fileName}</span>
          </span>
          {pendingPath === file.path ? (
            <Loader2 size={15} className="animate-spin text-slate-400" />
          ) : (
            <Download size={15} className="text-slate-400" />
          )}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS. If `uploadToSignedUrl` is flagged, confirm `@supabase/supabase-js` is at `^2.104.1` — the method exists from v2.

- [ ] **Step 4: Commit**

```bash
git add components/ui/file-uploader.tsx components/ui/file-list.tsx
git commit -m "feat: add reusable signed-url file uploader and file list"
```

---

### Task 8: Store submission files as structured metadata

`assignment_submissions.file_urls` is `TEXT[]`, which loses the original file name and size. The uploader produces objects. Add a JSONB column and migrate the reader.

**Files:**
- Create: `supabase/migrations/021_submission_file_metadata.sql`
- Modify: `lib/services/submission.service.ts`
- Modify: `lib/validation/submission.ts`
- Create: `tests/submission.test.ts`

**Interfaces:**
- Consumes: `createSupabaseStub` from `tests/helpers/supabase-stub`; `UploadedFile` shape from Task 7.
- Produces: `submitAssignmentSchema` now accepts `{ content?: string; files?: UploadedFile[] }`; `SubmissionService.submitAssignment(universityId, studentId, assignmentId, content?, files?)` writes both `file_urls` (paths, for backwards compatibility) and `file_metadata` (JSONB).

- [ ] **Step 1: Write the failing test**

Create `tests/submission.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createSupabaseStub } from './helpers/supabase-stub';
import { SubmissionService } from '@/lib/services/submission.service';

const future = new Date(Date.now() + 86_400_000).toISOString();
const past = new Date(Date.now() - 86_400_000).toISOString();

function stubFor(assignment: Record<string, any>, enrolled = true) {
  return createSupabaseStub({
    assignments: [{ id: 'a1', course_section_id: 'sec1', is_published: true, max_resubmissions: 2, allow_late_submissions: false, ...assignment }],
    course_enrollments: enrolled ? [{ id: 'e1', course_section_id: 'sec1', student_id: 'stu1', status: 'active' }] : [],
    assignment_submissions: [],
    audit_logs: [],
  });
}

describe('SubmissionService.submitAssignment', () => {
  it('stores file metadata alongside plain paths', async () => {
    const { client, inserted } = stubFor({ due_date: future });
    const service = new SubmissionService(client);

    await service.submitAssignment('uni1', 'stu1', 'a1', 'My answer', [
      { path: 'uni1/submissions/stu1/x-essay.pdf', fileName: 'essay.pdf', fileSize: 1024, fileType: 'application/pdf' },
    ]);

    const row = inserted.assignment_submissions[0];
    expect(row.file_urls).toEqual(['uni1/submissions/stu1/x-essay.pdf']);
    expect(row.file_metadata[0].fileName).toBe('essay.pdf');
    expect(row.status).toBe('submitted');
    expect(row.is_late).toBe(false);
  });

  it('marks a submission late when past the due date', async () => {
    const { client, inserted } = stubFor({ due_date: past, allow_late_submissions: true });
    const service = new SubmissionService(client);

    await service.submitAssignment('uni1', 'stu1', 'a1', 'Late answer', []);
    expect(inserted.assignment_submissions[0].is_late).toBe(true);
  });

  it('rejects a late submission when late submissions are disallowed', async () => {
    const { client } = stubFor({ due_date: past, allow_late_submissions: false });
    const service = new SubmissionService(client);

    await expect(service.submitAssignment('uni1', 'stu1', 'a1', 'Late', [])).rejects.toThrow(
      'Submission deadline has passed and late submissions are not allowed.',
    );
  });

  it('rejects a student who is not enrolled', async () => {
    const { client } = stubFor({ due_date: future }, false);
    const service = new SubmissionService(client);

    await expect(service.submitAssignment('uni1', 'stu1', 'a1', 'Answer', [])).rejects.toThrow(
      'Unauthorized: Student not enrolled in this course',
    );
  });

  it('rejects an unpublished assignment', async () => {
    const { client } = stubFor({ due_date: future, is_published: false });
    const service = new SubmissionService(client);

    await expect(service.submitAssignment('uni1', 'stu1', 'a1', 'Answer', [])).rejects.toThrow(
      'Assignment is not published',
    );
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run tests/submission.test.ts`
Expected: FAIL on the first test — `file_metadata` is undefined.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/021_submission_file_metadata.sql`:

```sql
-- Submissions keep an array of storage paths for backwards compatibility and a
-- structured JSONB copy carrying the original file name, size, and MIME type.
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS file_metadata JSONB DEFAULT '[]'::jsonb;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS feedback_file_metadata JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_student
  ON assignment_submissions (assignment_id, student_id);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status
  ON assignment_submissions (assignment_id, status);
```

- [ ] **Step 4: Update the validation schema**

Replace `lib/validation/submission.ts`:

```ts
import { z } from 'zod';

export const uploadedFileSchema = z.object({
  path: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
  fileType: z.string().min(1),
});

export const submitAssignmentSchema = z.object({
  content: z.string().optional(),
  files: z.array(uploadedFileSchema).max(10).optional(),
});

export type UploadedFileInput = z.infer<typeof uploadedFileSchema>;
```

- [ ] **Step 5: Update the service**

In `lib/services/submission.service.ts`, change the signature and the payload:

```ts
  async submitAssignment(
    universityId: string,
    studentId: string,
    assignmentId: string,
    content?: string,
    files?: Array<{ path: string; fileName: string; fileSize: number; fileType: string }>,
  ) {
```

and inside, replace the `file_urls` line in `payload`:

```ts
      file_urls: (files || []).map((file) => file.path),
      file_metadata: files || [],
```

- [ ] **Step 6: Update the action to pass files through**

In `app/actions/submissions.ts`, change the service call's last argument from `parsed.data.fileUrls` to `parsed.data.files`.

- [ ] **Step 7: Run the tests**

Run: `npx vitest run tests/submission.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 8: Apply the migration**

```bash
npx supabase db push
```

- [ ] **Step 9: Commit**

```bash
git add supabase/migrations/021_submission_file_metadata.sql lib/services/submission.service.ts lib/validation/submission.ts app/actions/submissions.ts tests/submission.test.ts
git commit -m "feat: store structured file metadata on assignment submissions"
```

---

## Phase 3 — The assignment loop (Tasks 9–10)

### Task 9: Student assignment detail and submission

This replaces the fake page identified in the audit.

**Files:**
- Rewrite: `app/(dashboard)/student/assignments/[assignmentId]/page.tsx`
- Create: `components/student/AssignmentSubmissionPanel.tsx`
- Modify: `app/actions/submissions.ts` (notification + email on submit)

**Interfaces:**
- Consumes: `FileUploader`, `FileList`, `UploadedFile` (Task 7); `submitAssignmentAction`; `STORAGE_BUCKETS.ASSIGNMENT_SUBMISSIONS`.
- Produces: `<AssignmentSubmissionPanel assignment={AssignmentDetail} submission={SubmissionRecord | null} />` where
  - `AssignmentDetail = { id, title, description, due_date, total_points, allow_late_submissions, max_resubmissions, course_code }`
  - `SubmissionRecord = { id, content, file_metadata, status, score, feedback, is_late, attempt_count, submitted_at }`

- [ ] **Step 1: Rewrite the page as a Server Component**

Replace `app/(dashboard)/student/assignments/[assignmentId]/page.tsx` entirely:

```tsx
import { AssignmentSubmissionPanel } from "@/components/student/AssignmentSubmissionPanel";
import { GenericList } from "@/components/academic/GenericList";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const session = await requireRole("student");
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("assignments")
    .select(
      "id,title,description,due_date,total_points,allow_late_submissions,max_resubmissions,is_published,course_section_id,course_sections(id,name,courses(code,title))",
    )
    .eq("id", assignmentId)
    .maybeSingle();

  const section = Array.isArray(assignment?.course_sections)
    ? assignment?.course_sections[0]
    : assignment?.course_sections;
  const course = Array.isArray(section?.courses) ? section?.courses[0] : section?.courses;

  const { data: enrollment } = assignment
    ? await supabase
        .from("course_enrollments")
        .select("id")
        .eq("student_id", session.user.id)
        .eq("course_section_id", assignment.course_section_id)
        .eq("status", "active")
        .maybeSingle()
    : { data: null };

  const { data: submission } = assignment
    ? await supabase
        .from("assignment_submissions")
        .select("id,content,file_metadata,status,score,feedback,is_late,attempt_count,submitted_at")
        .eq("assignment_id", assignmentId)
        .eq("student_id", session.user.id)
        .maybeSingle()
    : { data: null };

  return (
    <GenericList title={assignment?.title || "Assignment"} icon={FileText}>
      <div className="mb-4">
        <Link
          href="/student/assignments"
          className="flex items-center gap-2 font-medium text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft size={16} /> Back to Assignments
        </Link>
      </div>

      {!assignment || !assignment.is_published ? (
        <EmptyState
          title="Assignment unavailable"
          description="This assignment does not exist or has not been published yet."
        />
      ) : !enrollment ? (
        <EmptyState
          title="Not enrolled"
          description="You need an active enrollment in this course section to view the assignment."
        />
      ) : (
        <AssignmentSubmissionPanel
          assignment={{
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.due_date,
            totalPoints: assignment.total_points,
            allowLateSubmissions: assignment.allow_late_submissions,
            maxResubmissions: assignment.max_resubmissions,
            courseCode: course?.code || section?.name || "Course",
          }}
          submission={submission ?? null}
        />
      )}
    </GenericList>
  );
}
```

- [ ] **Step 2: Build the submission panel**

Create `components/student/AssignmentSubmissionPanel.tsx`:

```tsx
"use client";

import * as React from "react";
import { motion } from "motion/react";
import { AlertTriangle, CheckCircle2, Clock, Loader2, Send } from "lucide-react";
import { submitAssignmentAction } from "@/app/actions/submissions";
import { FileUploader, type UploadedFile } from "@/components/ui/file-uploader";
import { FileList } from "@/components/ui/file-list";
import { STORAGE_BUCKETS } from "@/lib/storage/paths";

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  totalPoints: number;
  allowLateSubmissions: boolean;
  maxResubmissions: number;
  courseCode: string;
};

type Submission = {
  id: string;
  content: string | null;
  file_metadata: UploadedFile[] | null;
  status: string;
  score: number | null;
  feedback: string | null;
  is_late: boolean;
  attempt_count: number;
  submitted_at: string | null;
};

export function AssignmentSubmissionPanel({
  assignment,
  submission,
}: {
  assignment: Assignment;
  submission: Submission | null;
}) {
  const [current, setCurrent] = React.useState<Submission | null>(submission);
  const [content, setContent] = React.useState(submission?.content || "");
  const [files, setFiles] = React.useState<UploadedFile[]>(submission?.file_metadata || []);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const due = new Date(assignment.dueDate);
  const isPastDue = Date.now() > due.getTime();
  const isGraded = current?.status === "graded" || current?.score != null;
  const attemptsUsed = current?.attempt_count || 0;
  const attemptsLeft = assignment.maxResubmissions - attemptsUsed;
  const locked = isGraded || attemptsLeft <= 0 || (isPastDue && !assignment.allowLateSubmissions);

  function submit() {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await submitAssignmentAction(assignment.id, { content, files });
      if (!result.success) {
        setError(result.error || "Submission failed.");
        return;
      }
      setCurrent(result.submission as Submission);
      setMessage("Submission received.");
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-6 xl:grid-cols-[1fr_320px]"
    >
      <section className="space-y-6">
        <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-6 backdrop-blur-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">{assignment.courseCode}</p>
          <h2 className="mt-2 font-outfit text-2xl font-bold text-white">{assignment.title}</h2>
          {assignment.description && (
            <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-300">{assignment.description}</p>
          )}
        </div>

        <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-6 backdrop-blur-2xl">
          <h3 className="font-outfit text-lg font-semibold text-white">Your submission</h3>

          {locked ? (
            <div className="mt-4 grid gap-4">
              <p className="text-sm text-slate-400">
                {isGraded
                  ? "This submission has been graded and can no longer be changed."
                  : attemptsLeft <= 0
                    ? "You have used all available attempts."
                    : "The deadline has passed and late submissions are not allowed."}
              </p>
              {current?.content && (
                <p className="whitespace-pre-wrap rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
                  {current.content}
                </p>
              )}
              <FileList bucket={STORAGE_BUCKETS.ASSIGNMENT_SUBMISSIONS} files={current?.file_metadata || []} />
            </div>
          ) : (
            <div className="mt-4 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-slate-300">
                Written answer
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={8}
                  className="rounded-xl border border-white/10 bg-slate-950/70 p-4 text-sm text-white outline-none transition focus:border-blue-400"
                  placeholder="Type your answer, or attach files below."
                />
              </label>

              <div className="grid gap-2 text-sm font-medium text-slate-300">
                Attachments
                <FileUploader
                  bucket={STORAGE_BUCKETS.ASSIGNMENT_SUBMISSIONS}
                  scope="submissions"
                  multiple
                  maxSizeMb={50}
                  value={files}
                  onChange={setFiles}
                  disabled={pending}
                />
              </div>

              {(error || message) && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    error
                      ? "border-red-500/20 bg-red-500/10 text-red-300"
                      : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  }`}
                >
                  {error || message}
                </div>
              )}

              <button
                onClick={submit}
                disabled={pending || (!content.trim() && files.length === 0)}
                className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-glow-blue transition hover:bg-blue-500 disabled:opacity-60"
              >
                {pending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {current ? "Resubmit" : "Submit assignment"}
              </button>
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-6 backdrop-blur-2xl">
          <h3 className="font-outfit text-sm font-semibold uppercase tracking-wide text-slate-400">Status</h3>
          <div className="mt-4 grid gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-200">
              {isGraded ? (
                <CheckCircle2 size={16} className="text-emerald-300" />
              ) : current ? (
                <CheckCircle2 size={16} className="text-blue-300" />
              ) : isPastDue ? (
                <AlertTriangle size={16} className="text-amber-300" />
              ) : (
                <Clock size={16} className="text-slate-400" />
              )}
              {isGraded ? "Graded" : current ? "Submitted" : isPastDue ? "Overdue" : "Not submitted"}
            </div>
            <div>
              <p className="text-xs text-slate-500">Due</p>
              <p className="text-slate-200">{due.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Points</p>
              <p className="text-slate-200">
                {current?.score != null ? `${current.score} / ${assignment.totalPoints}` : `${assignment.totalPoints} available`}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Attempts</p>
              <p className="text-slate-200">
                {attemptsUsed} of {assignment.maxResubmissions} used
              </p>
            </div>
            {current?.is_late && <p className="text-xs font-medium text-amber-300">Submitted late</p>}
          </div>
        </div>

        {current?.feedback && (
          <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-6 backdrop-blur-2xl">
            <h3 className="font-outfit text-sm font-semibold uppercase tracking-wide text-slate-400">
              Lecturer feedback
            </h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">{current.feedback}</p>
          </div>
        )}
      </aside>
    </motion.div>
  );
}
```

- [ ] **Step 3: Notify the lecturer on submit**

In `app/actions/submissions.ts`, after `revalidatePath`, add a notification for the assigned lecturers. Import `NotificationService` and resolve the section's lecturers:

```ts
        const { data: lecturers } = await supabase
            .from('course_lecturers')
            .select('lecturer_id, course_sections(id, courses(code))')
            .eq('course_section_id', (result as any).course_section_id ?? '');

        const notifications = new NotificationService(supabase as any);
        for (const lecturer of lecturers || []) {
            await notifications.createNotification({
                universityId: session.profile.university_id!,
                userId: lecturer.lecturer_id,
                title: 'New submission received',
                message: 'A student submitted work for grading.',
                type: 'assignment',
                linkUrl: `/lecturer/assignments/${assignmentId}/submissions`,
            });
        }
```

If `result` does not carry `course_section_id`, read it from the `assignments` row you already have in `SubmissionService`; simplest is to have `submitAssignment` return `{ ...submission, course_section_id: assignment.course_section_id }`. Make that change in the service and keep the type loose (`any`), matching the surrounding code.

- [ ] **Step 4: Verify the route renders**

Run: `npm run build`
Expected: build succeeds and `/student/assignments/[assignmentId]` appears in the route list as a dynamic server route (ƒ), not static.

- [ ] **Step 5: Manual smoke test**

Start the dev server (`npm run dev`), sign in as `student@example.com`, open an assignment from `/student/assignments`, attach a PDF, submit. Confirm: success banner appears, the sidebar status flips to "Submitted", reloading the page shows the attachment, and clicking the attachment opens a signed URL.

- [ ] **Step 6: Commit**

```bash
git add "app/(dashboard)/student/assignments/[assignmentId]/page.tsx" components/student/AssignmentSubmissionPanel.tsx app/actions/submissions.ts lib/services/submission.service.ts
git commit -m "feat: build real student assignment detail and submission flow"
```

---

### Task 10: Lecturer submission grading

**Files:**
- Create: `app/(dashboard)/lecturer/assignments/[assignmentId]/submissions/page.tsx`
- Create: `components/lecturer/SubmissionGradingPanel.tsx`
- Modify: `components/lecturer/AssignmentManager.tsx` (link each row to its submissions)
- Modify: `app/actions/grades.ts` (notification + email on grade)
- Create: `tests/grading.test.ts`

**Interfaces:**
- Consumes: `gradeSubmissionAction(submissionId: string, payload: { score: number; feedback?: string; feedbackFileUrls?: string[] })`; `FileList`; `GradeService`.
- Produces: `<SubmissionGradingPanel assignment={{ id, title, totalPoints }} submissions={SubmissionRow[]} />` where `SubmissionRow = { id, student_name, student_id, status, score, feedback, is_late, submitted_at, content, file_metadata }`.

- [ ] **Step 1: Write the failing test for grade authorization and bounds**

Create `tests/grading.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createSupabaseStub } from './helpers/supabase-stub';
import { GradeService } from '@/lib/services/grade.service';

function stub(options: { assigned: boolean; totalPoints: number }) {
  return createSupabaseStub({
    assignment_submissions: [
      { id: 'sub1', assignment_id: 'a1', assignments: { course_section_id: 'sec1', total_points: options.totalPoints } },
    ],
    course_lecturers: options.assigned ? [{ id: 'cl1', course_section_id: 'sec1', lecturer_id: 'lec1' }] : [],
    audit_logs: [],
  });
}

describe('GradeService.gradeSubmission', () => {
  it('rejects a score above the assignment maximum', async () => {
    const { client } = stub({ assigned: true, totalPoints: 100 });
    const service = new GradeService(client);

    await expect(service.gradeSubmission('uni1', 'lec1', 'sub1', 101)).rejects.toThrow(
      'Score cannot exceed maximum points (100)',
    );
  });

  it('rejects a lecturer who is not assigned to the section', async () => {
    const { client } = stub({ assigned: false, totalPoints: 100 });
    const service = new GradeService(client);

    await expect(service.gradeSubmission('uni1', 'lec1', 'sub1', 50)).rejects.toThrow(
      'Unauthorized: Lecturer not assigned to this course section',
    );
  });

  it('writes the score and feedback for an assigned lecturer', async () => {
    const { client, updated } = stub({ assigned: true, totalPoints: 100 });
    const service = new GradeService(client);

    await service.gradeSubmission('uni1', 'lec1', 'sub1', 88, 'Solid work');

    expect(updated.assignment_submissions[0]).toMatchObject({ score: 88, feedback: 'Solid work' });
  });
});
```

- [ ] **Step 2: Run it**

Run: `npx vitest run tests/grading.test.ts`
Expected: The first two tests pass (the guards already exist). The third may fail if `gradeSubmission` writes fields the stub does not model — read the failure, and adjust the stub fixture (not the service) so it reflects the real schema.

- [ ] **Step 3: Build the grading page**

Create `app/(dashboard)/lecturer/assignments/[assignmentId]/submissions/page.tsx`:

```tsx
import { SubmissionGradingPanel } from "@/components/lecturer/SubmissionGradingPanel";
import { GenericList } from "@/components/academic/GenericList";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import Link from "next/link";

export default async function LecturerSubmissionsPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const session = await requireRole("lecturer");
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("assignments")
    .select("id,title,total_points,course_section_id")
    .eq("id", assignmentId)
    .maybeSingle();

  const { data: assigned } = assignment
    ? await supabase
        .from("course_lecturers")
        .select("id")
        .eq("course_section_id", assignment.course_section_id)
        .eq("lecturer_id", session.user.id)
        .maybeSingle()
    : { data: null };

  const submissions = assigned
    ? await readOr(
        supabase
          .from("assignment_submissions")
          .select(
            "id,student_id,content,file_metadata,status,score,feedback,is_late,submitted_at,profiles(first_name,last_name,email)",
          )
          .eq("assignment_id", assignmentId)
          .order("submitted_at", { ascending: false })
          .then(({ data }) => data || []),
        [],
      )
    : [];

  return (
    <GenericList title={`Submissions — ${assignment?.title || "Assignment"}`} icon={ClipboardCheck}>
      <div className="mb-4">
        <Link
          href="/lecturer/assignments"
          className="flex items-center gap-2 font-medium text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft size={16} /> Back to Assignments
        </Link>
      </div>

      {!assignment || !assigned ? (
        <EmptyState
          title="Assignment unavailable"
          description="This assignment does not exist, or you are not assigned to its course section."
        />
      ) : submissions.length === 0 ? (
        <EmptyState title="No submissions yet" description="Student submissions will appear here as they arrive." />
      ) : (
        <SubmissionGradingPanel
          assignment={{ id: assignment.id, title: assignment.title, totalPoints: assignment.total_points }}
          submissions={submissions.map((row: any) => {
            const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
            return {
              ...row,
              student_name:
                [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.email || "Student",
            };
          })}
        />
      )}
    </GenericList>
  );
}
```

- [ ] **Step 4: Build the grading panel**

Create `components/lecturer/SubmissionGradingPanel.tsx`:

```tsx
"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { gradeSubmissionAction } from "@/app/actions/grades";
import { DataTable } from "@/components/ui/data-table";
import { Drawer } from "@/components/ui/drawer";
import { FileList } from "@/components/ui/file-list";
import { STORAGE_BUCKETS } from "@/lib/storage/paths";
import type { UploadedFile } from "@/components/ui/file-uploader";

type SubmissionRow = {
  id: string;
  student_id: string;
  student_name: string;
  content: string | null;
  file_metadata: UploadedFile[] | null;
  status: string;
  score: number | null;
  feedback: string | null;
  is_late: boolean;
  submitted_at: string | null;
};

export function SubmissionGradingPanel({
  assignment,
  submissions,
}: {
  assignment: { id: string; title: string; totalPoints: number };
  submissions: SubmissionRow[];
}) {
  const [rows, setRows] = React.useState(submissions);
  const [active, setActive] = React.useState<SubmissionRow | null>(null);
  const [score, setScore] = React.useState("");
  const [feedback, setFeedback] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function open(row: SubmissionRow) {
    setActive(row);
    setScore(row.score != null ? String(row.score) : "");
    setFeedback(row.feedback || "");
    setError("");
    setMessage("");
  }

  function save() {
    if (!active) return;
    const numericScore = Number(score);

    if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > assignment.totalPoints) {
      setError(`Score must be between 0 and ${assignment.totalPoints}.`);
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await gradeSubmissionAction(active.id, { score: numericScore, feedback });
      if (!result.success) {
        setError(result.error || "Could not save the grade.");
        return;
      }
      setRows((current) =>
        current.map((row) =>
          row.id === active.id ? { ...row, score: numericScore, feedback, status: "graded" } : row,
        ),
      );
      setMessage(`Saved grade for ${active.student_name}.`);
      setActive(null);
    });
  }

  const graded = rows.filter((row) => row.score != null).length;

  return (
    <div className="space-y-4">
      <div className="glass-panel flex items-center justify-between rounded-2xl border border-white/10 p-4">
        <div>
          <p className="text-sm font-semibold text-white">
            {graded} of {rows.length} graded
          </p>
          <p className="text-xs text-slate-400">Out of {assignment.totalPoints} points.</p>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      )}

      <DataTable
        data={rows}
        keyExtractor={(row) => row.id}
        columns={[
          {
            key: "student",
            header: "Student",
            cell: (row) => <span className="font-medium text-white">{row.student_name}</span>,
          },
          {
            key: "submitted",
            header: "Submitted",
            cell: (row) => (row.submitted_at ? new Date(row.submitted_at).toLocaleString() : "—"),
          },
          { key: "late", header: "Late", cell: (row) => (row.is_late ? "Yes" : "No") },
          {
            key: "score",
            header: "Score",
            cell: (row) => (row.score == null ? "Ungraded" : `${row.score}/${assignment.totalPoints}`),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (row) => (
              <button
                onClick={() => open(row)}
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500"
              >
                {row.score == null ? "Grade" : "Edit grade"}
              </button>
            ),
          },
        ]}
      />

      <Drawer
        isOpen={Boolean(active)}
        onClose={() => setActive(null)}
        title={active ? `Grade — ${active.student_name}` : "Grade"}
        className="max-w-2xl"
      >
        {active && (
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Written answer</p>
              <p className="mt-2 whitespace-pre-wrap rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
                {active.content || "No written answer."}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attachments</p>
              <div className="mt-2">
                <FileList
                  bucket={STORAGE_BUCKETS.ASSIGNMENT_SUBMISSIONS}
                  files={active.file_metadata || []}
                />
              </div>
            </div>

            <label className="grid gap-2 text-sm font-medium text-slate-300">
              Score (max {assignment.totalPoints})
              <input
                type="number"
                min={0}
                max={assignment.totalPoints}
                value={score}
                onChange={(event) => setScore(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-blue-400"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-300">
              Feedback
              <textarea
                rows={6}
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-blue-400"
              />
            </label>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              onClick={save}
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save grade
            </button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
```

- [ ] **Step 5: Link assignments to their submissions**

In `components/lecturer/AssignmentManager.tsx`, add a link button to the `actions` column, before the edit button:

```tsx
              <a
                href={`/lecturer/assignments/${item.id}/submissions`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
              >
                <ClipboardCheck size={13} /> Submissions
              </a>
```

Add `ClipboardCheck` to the existing `lucide-react` import.

- [ ] **Step 6: Notify the student when a grade lands**

In `app/actions/grades.ts`, after a successful `service.gradeSubmission(...)`, add:

```ts
        const notifications = new NotificationService(supabase as any);
        await notifications.createNotification({
            universityId: session.profile.university_id!,
            userId: (result as any).student_id,
            title: 'Your assignment has been graded',
            message: `You scored ${parsed.data.score}.`,
            type: 'grade',
            linkUrl: `/student/assignments/${(result as any).assignment_id}`,
            email: ({ name }) =>
                renderGradePostedEmail({
                    studentName: name,
                    assignmentTitle: (result as any).assignments?.title || 'your assignment',
                    score: parsed.data.score,
                    totalPoints: (result as any).assignments?.total_points || parsed.data.score,
                    url: `${env.NEXT_PUBLIC_APP_URL}/student/assignments/${(result as any).assignment_id}`,
                }),
        });
```

with imports:

```ts
import { NotificationService } from '@/lib/services/notification.service';
import { renderGradePostedEmail } from '@/lib/email/templates';
import { env } from '@/lib/env';
```

Ensure `GradeService.gradeSubmission` returns the updated submission including `student_id` and `assignment_id` — extend its final `.select()` if needed.

- [ ] **Step 7: Run the gate**

Run: `npm run lint && npm run typecheck && npm run test && npm run check:links`
Expected: PASS. `check:links` must recognize the new `/lecturer/assignments/[assignmentId]/submissions` route.

- [ ] **Step 8: Manual smoke test**

Sign in as `lecturer@example.com`, open `/lecturer/assignments`, click "Submissions" on the assignment the student just submitted to, grade it. Then sign in as the student and confirm the score and feedback appear on the assignment page, a notification row exists at `/student/notifications`, and (if `RESEND_API_KEY` is live) an email arrives.

- [ ] **Step 9: Commit**

```bash
git add "app/(dashboard)/lecturer/assignments" components/lecturer/SubmissionGradingPanel.tsx components/lecturer/AssignmentManager.tsx app/actions/grades.ts lib/services/grade.service.ts tests/grading.test.ts
git commit -m "feat: add lecturer submission grading workflow"
```

---

## Phase 4 — Video on Mux (Tasks 11–13)

### Task 11: Mux server wrapper and direct upload

**Files:**
- Create: `lib/video/mux.ts`
- Create: `app/api/video/mux/upload/route.ts`
- Create: `supabase/migrations/022_mux_video_contract.sql`
- Create: `tests/mux.test.ts`
- Modify: `lib/env.ts`, `scripts/check-env.ts`, `.env.example`

**Interfaces:**
- Produces:
  - `createMuxDirectUpload(input: { corsOrigin: string; passthrough: string }): Promise<{ uploadId: string; uploadUrl: string }>`
  - `getMuxAsset(assetId: string): Promise<{ id: string; status: string; duration: number | null; playbackId: string | null }>`
  - `createMuxPlaybackToken(playbackId: string, expiresInSeconds?: number): string`
  - `verifyMuxWebhook(rawBody: string, signatureHeader: string, secret: string): boolean`
  - `parseMuxWebhookEvent(rawBody: string): { type: string; assetId: string | null; uploadId: string | null; playbackId: string | null; duration: number | null; passthrough: string | null }`

- [ ] **Step 1: Install the SDKs**

```bash
npm install @mux/mux-node @mux/mux-player-react
```

- [ ] **Step 2: Write the failing test**

Create `tests/mux.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { verifyMuxWebhook, parseMuxWebhookEvent } from '@/lib/video/mux';

const secret = 'test-secret';

function signedHeader(body: string, timestamp = Math.floor(Date.now() / 1000)) {
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

describe('verifyMuxWebhook', () => {
  it('accepts a correctly signed body', () => {
    const body = JSON.stringify({ type: 'video.asset.ready' });
    expect(verifyMuxWebhook(body, signedHeader(body), secret)).toBe(true);
  });

  it('rejects a tampered body', () => {
    const body = JSON.stringify({ type: 'video.asset.ready' });
    const header = signedHeader(body);
    expect(verifyMuxWebhook(JSON.stringify({ type: 'video.asset.errored' }), header, secret)).toBe(false);
  });

  it('rejects a malformed header', () => {
    expect(verifyMuxWebhook('{}', 'garbage', secret)).toBe(false);
  });

  it('rejects a stale timestamp', () => {
    const body = '{}';
    const stale = Math.floor(Date.now() / 1000) - 3600;
    expect(verifyMuxWebhook(body, signedHeader(body, stale), secret)).toBe(false);
  });
});

describe('parseMuxWebhookEvent', () => {
  it('extracts asset, playback, duration and passthrough from video.asset.ready', () => {
    const body = JSON.stringify({
      type: 'video.asset.ready',
      data: {
        id: 'asset-1',
        duration: 123.4,
        passthrough: 'lesson-9',
        upload_id: 'upload-1',
        playback_ids: [{ id: 'pb-1', policy: 'signed' }],
      },
    });

    expect(parseMuxWebhookEvent(body)).toEqual({
      type: 'video.asset.ready',
      assetId: 'asset-1',
      uploadId: 'upload-1',
      playbackId: 'pb-1',
      duration: 123,
      passthrough: 'lesson-9',
    });
  });

  it('returns nulls for an event without asset data', () => {
    const parsed = parseMuxWebhookEvent(JSON.stringify({ type: 'video.upload.created', data: {} }));
    expect(parsed.assetId).toBeNull();
    expect(parsed.playbackId).toBeNull();
  });
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `npx vitest run tests/mux.test.ts`
Expected: FAIL — cannot resolve `@/lib/video/mux`.

- [ ] **Step 4: Implement the wrapper**

Create `lib/video/mux.ts`:

```ts
import crypto from 'node:crypto';

export interface MuxDirectUpload {
  uploadId: string;
  uploadUrl: string;
}

export interface MuxAssetSummary {
  id: string;
  status: string;
  duration: number | null;
  playbackId: string | null;
}

export interface MuxWebhookEvent {
  type: string;
  assetId: string | null;
  uploadId: string | null;
  playbackId: string | null;
  duration: number | null;
  passthrough: string | null;
}

const MUX_WEBHOOK_TOLERANCE_SECONDS = 300;

function muxClient() {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  if (!tokenId || !tokenSecret) {
    throw new Error('Mux is not configured. Set MUX_TOKEN_ID and MUX_TOKEN_SECRET.');
  }

  const Mux = require('@mux/mux-node').default as typeof import('@mux/mux-node').default;
  return new Mux({ tokenId, tokenSecret });
}

/**
 * Creates a Mux direct upload. The browser PUTs the file straight to the
 * returned URL, so large video never passes through our server.
 * `passthrough` carries our lesson id back on the webhook.
 */
export async function createMuxDirectUpload(input: {
  corsOrigin: string;
  passthrough: string;
}): Promise<MuxDirectUpload> {
  const mux = muxClient();
  const upload = await mux.video.uploads.create({
    cors_origin: input.corsOrigin,
    new_asset_settings: {
      playback_policy: ['signed'],
      passthrough: input.passthrough,
      encoding_tier: 'smart',
    },
  });

  return { uploadId: upload.id, uploadUrl: upload.url };
}

export async function getMuxAsset(assetId: string): Promise<MuxAssetSummary> {
  const mux = muxClient();
  const asset = await mux.video.assets.retrieve(assetId);

  return {
    id: asset.id,
    status: asset.status,
    duration: asset.duration ? Math.round(asset.duration) : null,
    playbackId: asset.playback_ids?.[0]?.id ?? null,
  };
}

/**
 * Signs a short-lived playback token so private lesson video cannot be shared
 * by copying the playback id.
 */
export function createMuxPlaybackToken(playbackId: string, expiresInSeconds = 60 * 60 * 6): string {
  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const keySecretBase64 = process.env.MUX_SIGNING_KEY_SECRET;
  if (!keyId || !keySecretBase64) {
    throw new Error('Mux playback signing is not configured. Set MUX_SIGNING_KEY_ID and MUX_SIGNING_KEY_SECRET.');
  }

  const header = { alg: 'RS256', typ: 'JWT', kid: keyId };
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: playbackId, aud: 'v', exp: now + expiresInSeconds, kid: keyId };

  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');

  const signingInput = `${encode(header)}.${encode(payload)}`;
  const privateKey = Buffer.from(keySecretBase64, 'base64').toString('utf8');
  const signature = crypto.sign('RSA-SHA256', Buffer.from(signingInput), privateKey).toString('base64url');

  return `${signingInput}.${signature}`;
}

/** Mux signs webhooks as "t=<unix>,v1=<hex hmac of `${t}.${body}`>". */
export function verifyMuxWebhook(rawBody: string, signatureHeader: string, secret: string): boolean {
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((piece) => piece.split('=') as [string, string]),
  );

  const timestamp = Number(parts.t);
  const provided = parts.v1;
  if (!Number.isFinite(timestamp) || !provided) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - timestamp);
  if (age > MUX_WEBHOOK_TOLERANCE_SECONDS) return false;

  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  if (expectedBuffer.length !== providedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

export function parseMuxWebhookEvent(rawBody: string): MuxWebhookEvent {
  const parsed = JSON.parse(rawBody) as { type?: string; data?: Record<string, any> };
  const data = parsed.data || {};

  return {
    type: parsed.type || 'unknown',
    assetId: data.id ?? null,
    uploadId: data.upload_id ?? null,
    playbackId: data.playback_ids?.[0]?.id ?? null,
    duration: typeof data.duration === 'number' ? Math.round(data.duration) : null,
    passthrough: data.passthrough ?? null,
  };
}
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/mux.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 6: Add the direct-upload route**

Create `app/api/video/mux/upload/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { createMuxDirectUpload } from '@/lib/video/mux';
import { rateLimit } from '@/lib/rate-limit';
import { env } from '@/lib/env';
import { z } from 'zod';

export const runtime = 'nodejs';

const bodySchema = z.object({
  lessonId: z.string().uuid(),
  courseId: z.string().uuid(),
});

export async function POST(request: Request) {
  const session = await requireRole('lecturer');

  const limit = await rateLimit(`mux-upload:${session.user.id}`, 20, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many upload requests. Try again shortly.' }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const supabase = await createClient();

  // The lecturer must own the section that owns this lesson.
  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, course_modules(course_id)')
    .eq('id', parsed.data.lessonId)
    .maybeSingle();

  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });
  }

  const { data: assignment } = await supabase
    .from('course_lecturers')
    .select('id, course_sections!inner(course_id)')
    .eq('lecturer_id', session.user.id)
    .eq('course_sections.course_id', parsed.data.courseId)
    .maybeSingle();

  if (!assignment) {
    return NextResponse.json({ error: 'You are not assigned to this course.' }, { status: 403 });
  }

  try {
    const upload = await createMuxDirectUpload({
      corsOrigin: env.NEXT_PUBLIC_APP_URL,
      passthrough: parsed.data.lessonId,
    });

    const { data: asset, error } = await supabase
      .from('video_assets')
      .insert({
        university_id: session.profile.university_id,
        created_by: session.user.id,
        lesson_id: parsed.data.lessonId,
        course_id: parsed.data.courseId,
        provider: 'mux',
        asset_id: null,
        mux_upload_id: upload.uploadId,
        status: 'uploading',
        visibility: 'private',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ uploadUrl: upload.uploadUrl, videoAssetId: asset.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not start the upload.';
    console.error('[mux upload]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 7: Write the schema migration**

Create `supabase/migrations/022_mux_video_contract.sql`:

```sql
-- Mux is the lesson video provider. Uploads are direct-to-Mux, so we track the
-- upload id before an asset id exists, then fill in asset + playback ids when
-- the video.asset.ready webhook arrives.
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS mux_upload_id TEXT;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS mux_asset_id TEXT;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE video_assets ALTER COLUMN asset_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_video_assets_mux_upload_id
  ON video_assets (mux_upload_id) WHERE mux_upload_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_video_assets_mux_asset_id
  ON video_assets (mux_asset_id) WHERE mux_asset_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_video_assets_lesson ON video_assets (lesson_id);
```

If `asset_id` was not declared `NOT NULL`, the `ALTER COLUMN` line is a no-op; leave it in — it is idempotent in practice and documents intent.

- [ ] **Step 8: Declare env vars**

`lib/env.ts` schema and parse call:

```ts
  MUX_TOKEN_ID: z.string().optional(),
  MUX_TOKEN_SECRET: z.string().optional(),
  MUX_WEBHOOK_SECRET: z.string().optional(),
  MUX_SIGNING_KEY_ID: z.string().optional(),
  MUX_SIGNING_KEY_SECRET: z.string().optional(),
```

`scripts/check-env.ts`: add all five to `requiredEnvVars`.

`.env.example`:

```dotenv
# Mux video (required in production)
MUX_TOKEN_ID=your-mux-access-token-id
MUX_TOKEN_SECRET=your-mux-secret-key
MUX_WEBHOOK_SECRET=your-mux-webhook-signing-secret
MUX_SIGNING_KEY_ID=your-mux-playback-signing-key-id
MUX_SIGNING_KEY_SECRET=your-base64-encoded-mux-signing-private-key
```

- [ ] **Step 9: Apply the migration and run the gate**

```bash
npx supabase db push
npm run typecheck && npm run test
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add lib/video app/api/video supabase/migrations/022_mux_video_contract.sql lib/env.ts scripts/check-env.ts .env.example tests/mux.test.ts package.json package-lock.json
git commit -m "feat: add mux direct upload pipeline"
```

---

### Task 12: Real Mux webhook

The existing `app/api/webhooks/video/route.ts` verifies a hand-rolled `x-webhook-signature` against a dummy payload shape. Replace it.

**Files:**
- Rewrite: `app/api/webhooks/video/route.ts`
- Modify: `lib/services/video.service.ts`
- Create: `tests/video-webhook.test.ts`

**Interfaces:**
- Consumes: `verifyMuxWebhook`, `parseMuxWebhookEvent` (Task 11).
- Produces: `VideoAssetService.applyMuxEvent(event: MuxWebhookEvent): Promise<void>` — idempotent; matches an existing `video_assets` row by `mux_upload_id` or `mux_asset_id`, updates status/playback/duration, and writes `lessons.video_asset_id` + `lessons.video_duration`.

- [ ] **Step 1: Write the failing test**

Create `tests/video-webhook.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createSupabaseStub } from './helpers/supabase-stub';
import { VideoAssetService } from '@/lib/services/video.service';

describe('VideoAssetService.applyMuxEvent', () => {
  it('promotes an uploading row to ready and stamps playback details', async () => {
    const { client, updated } = createSupabaseStub({
      video_assets: [{ id: 'va1', lesson_id: 'lesson-1', mux_upload_id: 'upload-1', status: 'uploading' }],
      lessons: [{ id: 'lesson-1' }],
    });
    const service = new VideoAssetService(client);

    await service.applyMuxEvent({
      type: 'video.asset.ready',
      assetId: 'asset-1',
      uploadId: 'upload-1',
      playbackId: 'pb-1',
      duration: 300,
      passthrough: 'lesson-1',
    });

    expect(updated.video_assets[0]).toMatchObject({
      status: 'ready',
      mux_asset_id: 'asset-1',
      playback_id: 'pb-1',
      duration: 300,
    });
    expect(updated.lessons[0]).toMatchObject({ video_asset_id: 'va1', video_duration: 300 });
  });

  it('records an error for video.asset.errored', async () => {
    const { client, updated } = createSupabaseStub({
      video_assets: [{ id: 'va1', mux_upload_id: 'upload-1', status: 'uploading' }],
      lessons: [],
    });
    const service = new VideoAssetService(client);

    await service.applyMuxEvent({
      type: 'video.asset.errored',
      assetId: 'asset-1',
      uploadId: 'upload-1',
      playbackId: null,
      duration: null,
      passthrough: null,
    });

    expect(updated.video_assets[0].status).toBe('errored');
  });

  it('ignores events that match no known asset', async () => {
    const { client, updated } = createSupabaseStub({ video_assets: [], lessons: [] });
    const service = new VideoAssetService(client);

    await service.applyMuxEvent({
      type: 'video.asset.ready',
      assetId: 'asset-x',
      uploadId: 'upload-x',
      playbackId: 'pb-x',
      duration: 10,
      passthrough: null,
    });

    expect(updated.video_assets).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run tests/video-webhook.test.ts`
Expected: FAIL — `applyMuxEvent` is not a function.

- [ ] **Step 3: Extend the service**

Add to `lib/services/video.service.ts`:

```ts
import type { MuxWebhookEvent } from '@/lib/video/mux';
```

```ts
  /**
   * Applies a Mux webhook event to our records. Idempotent: Mux retries
   * deliveries, so re-applying the same event must be harmless.
   */
  async applyMuxEvent(event: MuxWebhookEvent): Promise<void> {
    const lookupColumn = event.uploadId ? 'mux_upload_id' : 'mux_asset_id';
    const lookupValue = event.uploadId ?? event.assetId;
    if (!lookupValue) return;

    const { data: existing } = await this.supabase
      .from('video_assets')
      .select('id, lesson_id')
      .eq(lookupColumn, lookupValue)
      .maybeSingle();

    if (!existing) return;

    if (event.type === 'video.asset.errored') {
      await this.supabase
        .from('video_assets')
        .update({ status: 'errored', error_message: 'Mux reported an encoding error.' })
        .eq('id', existing.id)
        .select()
        .single();
      return;
    }

    if (event.type !== 'video.asset.ready') return;

    await this.supabase
      .from('video_assets')
      .update({
        status: 'ready',
        mux_asset_id: event.assetId,
        asset_id: event.assetId,
        playback_id: event.playbackId,
        duration: event.duration,
      })
      .eq('id', existing.id)
      .select()
      .single();

    const lessonId = existing.lesson_id || event.passthrough;
    if (lessonId) {
      await this.supabase
        .from('lessons')
        .update({ video_asset_id: existing.id, video_duration: event.duration })
        .eq('id', lessonId)
        .select()
        .single();
    }
  }
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/video-webhook.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Rewrite the webhook route**

Replace `app/api/webhooks/video/route.ts` entirely:

```ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { VideoAssetService } from '@/lib/services/video.service';
import { parseMuxWebhookEvent, verifyMuxWebhook } from '@/lib/video/mux';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const secret = process.env.MUX_WEBHOOK_SECRET;
  const signature = request.headers.get('mux-signature');
  const rawBody = await request.text();

  if (!secret) {
    console.error('[mux webhook] MUX_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  if (!signature || !verifyMuxWebhook(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const event = parseMuxWebhookEvent(rawBody);
    const service = new VideoAssetService(createAdminClient() as any);
    await service.applyMuxEvent(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[mux webhook] processing failed', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

- [ ] **Step 6: Register the webhook in Mux**

In the Mux dashboard → Settings → Webhooks, add `https://<your-domain>/api/webhooks/video`, subscribe to `video.asset.ready` and `video.asset.errored`, and copy the signing secret into `MUX_WEBHOOK_SECRET`.

- [ ] **Step 7: Run the gate**

Run: `npm run lint && npm run typecheck && npm run test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add app/api/webhooks/video/route.ts lib/services/video.service.ts tests/video-webhook.test.ts
git commit -m "feat: replace stub video webhook with verified mux webhook"
```

---

### Task 13: Lesson video upload and signed playback

**Files:**
- Create: `components/lecturer/LessonVideoUploader.tsx`
- Create: `components/video/LessonVideoPlayer.tsx`
- Modify: `components/lecturer/CourseContentManager.tsx`
- Modify: `components/video/LessonWorkspace.tsx`
- Modify: `app/(dashboard)/student/courses/[courseId]/lessons/[lessonId]/page.tsx`

**Interfaces:**
- Consumes: `POST /api/video/mux/upload` → `{ uploadUrl: string; videoAssetId: string }`; `createMuxPlaybackToken` (server side only).
- Produces:
  - `<LessonVideoUploader lessonId={string} courseId={string} currentStatus={string | null} />`
  - `<LessonVideoPlayer playbackId={string} token={string} poster?={string} onComplete?={() => void} />`

- [ ] **Step 1: Build the uploader**

Create `components/lecturer/LessonVideoUploader.tsx`:

```tsx
"use client";

import * as React from "react";
import { CheckCircle2, Film, Loader2, Upload } from "lucide-react";

export function LessonVideoUploader({
  lessonId,
  courseId,
  currentStatus,
}: {
  lessonId: string;
  courseId: string;
  currentStatus: string | null;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [status, setStatus] = React.useState(currentStatus);
  const [error, setError] = React.useState("");

  async function upload(file: File) {
    setError("");
    setProgress(0);

    const response = await fetch("/api/video/mux/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, courseId }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setProgress(null);
      setError(payload.error || "Could not start the upload.");
      return;
    }

    // XHR rather than fetch: we need upload progress events.
    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", payload.uploadUrl);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setStatus("processing");
        } else {
          setError(`Upload failed with status ${xhr.status}.`);
        }
        setProgress(null);
        resolve();
      };
      xhr.onerror = () => {
        setError("Upload failed. Check your connection and try again.");
        setProgress(null);
        resolve();
      };
      xhr.send(file);
    });

    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Film size={16} className="text-violet-300" /> Lesson video
      </div>

      {status === "ready" ? (
        <p className="flex items-center gap-2 text-sm text-emerald-300">
          <CheckCircle2 size={15} /> Video is published and ready to play.
        </p>
      ) : status === "processing" || status === "uploading" ? (
        <p className="flex items-center gap-2 text-sm text-blue-300">
          <Loader2 size={15} className="animate-spin" /> Mux is encoding this video. It will appear for students
          automatically when it is ready.
        </p>
      ) : (
        <p className="text-sm text-slate-400">No video attached yet.</p>
      )}

      {progress !== null && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      <button
        type="button"
        disabled={progress !== null}
        onClick={() => inputRef.current?.click()}
        className="inline-flex w-fit items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60"
      >
        {progress !== null ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {progress !== null ? `Uploading ${progress}%` : status === "ready" ? "Replace video" : "Upload video"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Build the player**

Create `components/video/LessonVideoPlayer.tsx`:

```tsx
"use client";

import MuxPlayer from "@mux/mux-player-react";

export function LessonVideoPlayer({
  playbackId,
  token,
  poster,
  onComplete,
}: {
  playbackId: string;
  token: string;
  poster?: string;
  onComplete?: () => void;
}) {
  return (
    <MuxPlayer
      playbackId={playbackId}
      tokens={{ playback: token }}
      poster={poster}
      streamType="on-demand"
      accentColor="#2563eb"
      onEnded={onComplete}
      style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: "24px", overflow: "hidden" }}
    />
  );
}
```

- [ ] **Step 3: Mint the playback token server-side**

In `app/(dashboard)/student/courses/[courseId]/lessons/[lessonId]/page.tsx`, after loading the lesson and confirming enrollment, compute the token and pass it into `LessonWorkspace`:

```tsx
import { createMuxPlaybackToken } from "@/lib/video/mux";
```

```tsx
  const videoAsset = lesson?.video_assets?.[0];
  let playbackToken: string | null = null;
  if (videoAsset?.playback_id && videoAsset.status === "ready") {
    try {
      playbackToken = createMuxPlaybackToken(videoAsset.playback_id);
    } catch (error) {
      console.error("[lesson] could not sign playback token", error);
    }
  }
```

Pass `playbackToken={playbackToken}` to `<LessonWorkspace />`.

- [ ] **Step 4: Render the player in the workspace**

In `components/video/LessonWorkspace.tsx`, accept the new prop and replace the raw `<video>` element:

```tsx
export function LessonWorkspace({
  lesson,
  courseId,
  playbackToken,
}: {
  lesson: any;
  courseId: string;
  playbackToken: string | null;
}) {
```

Replace the `{videoUrl ? (<video .../>) : (...)}` block with:

```tsx
            {video?.playback_id && playbackToken ? (
              <LessonVideoPlayer
                playbackId={video.playback_id}
                token={playbackToken}
                poster={video.thumbnail_url || undefined}
                onComplete={() => { if (!completed) void markComplete(); }}
              />
            ) : video?.status === "processing" || video?.status === "uploading" ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <Loader2 size={48} className="mx-auto animate-spin text-blue-300" />
                  <p className="mt-4 text-sm text-slate-400">This video is still processing.</p>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <PlayCircle size={64} className="mx-auto text-blue-300" />
                  <p className="mt-4 text-sm text-slate-400">{lesson.resource_type || "Lesson"} content</p>
                </div>
              </div>
            )}
```

Add the import: `import { LessonVideoPlayer } from "./LessonVideoPlayer";`

- [ ] **Step 5: Add the uploader to the lecturer content manager**

In `components/lecturer/CourseContentManager.tsx`, render `<LessonVideoUploader lessonId={lesson.id} courseId={courseId} currentStatus={lesson.video_assets?.[0]?.status ?? null} />` inside each lesson's editing panel. The component needs `courseId` in scope — thread it down from the page if it is not already a prop.

- [ ] **Step 6: Run the gate**

Run: `npm run lint && npm run typecheck && npm run test && npm run build`
Expected: PASS.

- [ ] **Step 7: End-to-end smoke test**

As lecturer: open a course section, pick a lesson, upload a short MP4. The status should move `uploading` → `processing`. Wait for the Mux webhook (usually under a minute for a short clip), refresh, and confirm `ready`. As the enrolled student: open the lesson and confirm the Mux player streams. Watch to the end and confirm the lesson auto-marks complete.

- [ ] **Step 8: Commit**

```bash
git add components/lecturer/LessonVideoUploader.tsx components/video/LessonVideoPlayer.tsx components/video/LessonWorkspace.tsx components/lecturer/CourseContentManager.tsx "app/(dashboard)/student/courses"
git commit -m "feat: upload lesson video to mux and play with signed tokens"
```

---

## Phase 5 — Remaining write paths (Tasks 14–17)

### Task 14: Attendance capture

Three actions exist with no caller: `createAttendanceSessionAction`, `markAttendanceAction`, `calculateLiveClassAttendanceAction`.

**Files:**
- Create: `components/lecturer/AttendanceManager.tsx`
- Modify: `app/(dashboard)/lecturer/attendance/page.tsx`
- Create: `tests/attendance.test.ts`

**Interfaces:**
- Consumes: `createAttendanceSessionAction({ courseSectionId, title, date, liveClassId? })`, `markAttendanceAction(payload)` (shape defined by `markAttendanceSchema` in `lib/validation/attendance.ts` — read it before writing the component and match it exactly), `calculateLiveClassAttendanceAction(liveClassId)`.
- Produces: `<AttendanceManager sections={Section[]} sessions={AttendanceSession[]} roster={Record<string, Student[]>} liveClasses={LiveClass[]} />`.

- [ ] **Step 1: Read the existing contract**

Open `lib/validation/attendance.ts` and `lib/services/attendance.service.ts`. Write down the exact `markAttendanceSchema` field names and the allowed status values. The component in Step 3 must send precisely those; do not invent field names.

- [ ] **Step 2: Write the failing test for the service guard**

Create `tests/attendance.test.ts` mirroring the structure of `tests/grading.test.ts`: build a `createSupabaseStub` fixture with `course_lecturers`, `course_enrollments`, `attendance_sessions`, and `attendance_records`; assert that
1. marking attendance for a section the lecturer is not assigned to throws,
2. marking a student who is not enrolled throws or is skipped (assert the behaviour the service actually implements — read it first),
3. a successful mark inserts one `attendance_records` row per student with the submitted status.

Write the assertions against the real method signature you read in Step 1.

- [ ] **Step 3: Build the manager**

Create `components/lecturer/AttendanceManager.tsx` following the exact structure of `components/lecturer/AssignmentManager.tsx`: `"use client"`, `useState` + `useTransition`, a `run(action, onSuccess, successMessage)` helper, a `glass-panel` header row, an inline error/success banner, a `DataTable` of sessions, and a `Drawer` containing:
- a "New session" form (course section `<select>`, title, `datetime-local` date) calling `createAttendanceSessionAction`;
- a roll-call list for the selected session — one row per enrolled student with `present` / `absent` / `late` / `excused` radio buttons — submitting through `markAttendanceAction`;
- a "Pull from live class" button per session that has `live_class_id`, calling `calculateLiveClassAttendanceAction(liveClassId)`.

- [ ] **Step 4: Feed the page**

Rewrite `app/(dashboard)/lecturer/attendance/page.tsx` to load, via `readOr`: the lecturer's section ids, their `attendance_sessions`, the enrolled students per section (`course_enrollments` joined to `profiles`), and their `live_classes`. Pass all four into `<AttendanceManager />`. Keep the `GenericList` + `EmptyState` shell already used on that page.

- [ ] **Step 5: Run the gate**

Run: `npm run lint && npm run typecheck && npm run test`
Expected: PASS.

- [ ] **Step 6: Smoke test**

As lecturer, create an attendance session, mark three students with different statuses, reload, and confirm the marks persisted. As one of those students, open `/student/attendance` and confirm the record appears.

- [ ] **Step 7: Commit**

```bash
git add components/lecturer/AttendanceManager.tsx "app/(dashboard)/lecturer/attendance/page.tsx" tests/attendance.test.ts
git commit -m "feat: add lecturer attendance capture UI"
```

---

### Task 15: Discussions — ask, reply, resolve

**Files:**
- Create: `components/discussions/DiscussionBoard.tsx`
- Create: `app/(dashboard)/student/discussions/[discussionId]/page.tsx`
- Modify: `app/(dashboard)/student/discussions/page.tsx`
- Modify: `app/(dashboard)/lecturer/questions/page.tsx`
- Create: `supabase/migrations/023_discussion_contracts.sql`
- Create: `tests/discussions.test.ts`

**Interfaces:**
- Consumes: `createDiscussionAction({ courseSectionId, title, body })`, `replyDiscussionAction(payload)` — read `lib/validation/discussion.ts` for the reply payload shape before writing the component.
- Produces: `<DiscussionBoard mode={"student" | "lecturer"} sections={Section[]} discussion={Discussion | null} discussions={Discussion[]} />`.

- [ ] **Step 1: Read the existing contract**

Open `lib/validation/discussion.ts` and `lib/services/discussion.service.ts`. Note the exact field names for replies and whether a "mark as answered"/endorse method already exists. If `markAnswered` does not exist on the service, add it in Step 4 with a lecturer-assignment guard identical to `GradeService.checkLecturerAccess`.

- [ ] **Step 2: Write the failing test**

Create `tests/discussions.test.ts` asserting, through `createSupabaseStub`:
1. `createDiscussion` inserts with the caller's `university_id` and `course_section_id`;
2. `replyToDiscussion` inserts a reply bound to the discussion id;
3. marking a discussion answered by a lecturer who is not assigned to that section throws `Unauthorized: Lecturer not assigned to this course section`.

- [ ] **Step 3: Add the missing index/policy migration**

Create `supabase/migrations/023_discussion_contracts.sql`:

```sql
-- Discussions are read by section and sorted by recency on every board view.
CREATE INDEX IF NOT EXISTS idx_discussions_section_created
  ON discussions (course_section_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_discussion_replies_discussion_created
  ON discussion_replies (discussion_id, created_at ASC);

ALTER TABLE discussions ADD COLUMN IF NOT EXISTS answered_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS answered_at TIMESTAMPTZ;
```

- [ ] **Step 4: Build the board**

Create `components/discussions/DiscussionBoard.tsx` as a `"use client"` component using the same visual grammar as `AssignmentSubmissionPanel`:
- when `discussion` is null, render the list plus an "Ask a question" `Drawer` (section select, title, body) calling `createDiscussionAction`;
- when `discussion` is set, render the question, the reply thread in chronological order, a reply composer calling `replyDiscussionAction`, and — only when `mode === "lecturer"` — a "Mark as answered" button.

- [ ] **Step 5: Wire the routes**

- `app/(dashboard)/student/discussions/page.tsx`: keep the existing server read, but replace the read-only `DataTable` with `<DiscussionBoard mode="student" ... />` and make each row link to `/student/discussions/[discussionId]`.
- Create `app/(dashboard)/student/discussions/[discussionId]/page.tsx`: `requireRole("student")`, load the discussion with its replies and author profiles, verify the student is enrolled in the discussion's section, render `<DiscussionBoard mode="student" discussion={...} />`, and show an `EmptyState` when not enrolled.
- `app/(dashboard)/lecturer/questions/page.tsx`: render `<DiscussionBoard mode="lecturer" ... />` over the lecturer's sections.

- [ ] **Step 6: Apply, gate, smoke test**

```bash
npx supabase db push
npm run lint && npm run typecheck && npm run test && npm run check:links
```

Then: as a student ask a question; as the lecturer reply and mark it answered; as the student confirm the reply and the "Answered" status appear.

- [ ] **Step 7: Commit**

```bash
git add components/discussions "app/(dashboard)/student/discussions" "app/(dashboard)/lecturer/questions/page.tsx" supabase/migrations/023_discussion_contracts.sql tests/discussions.test.ts lib/services/discussion.service.ts
git commit -m "feat: add discussion ask, reply, and resolve flows"
```

---

### Task 16: Gradebook items, user roles, and profile settings

Three more orphaned actions: `createGradeItemAction`, `updateUserRoleAction`, `updateProfileAction`.

**Files:**
- Create: `components/lecturer/GradeItemManager.tsx`
- Create: `components/admin/UserRoleManager.tsx`
- Create: `components/settings/ProfileForm.tsx`
- Modify: `app/(dashboard)/lecturer/gradebook/page.tsx`
- Modify: `app/(dashboard)/admin/users/page.tsx`
- Modify: `app/(dashboard)/student/settings/page.tsx`

**Interfaces:**
- Consumes: `createGradeItemAction`, `updateUserRoleAction`, `updateProfileAction` — read each action's Zod schema before writing its form and match the field names exactly. `FileUploader` (Task 7) for the avatar.
- Produces:
  - `<GradeItemManager sections={Section[]} items={GradeItem[]} />`
  - `<UserRoleManager users={UserRow[]} />`
  - `<ProfileForm profile={Profile} />`

- [ ] **Step 1: Grade items**

Create `components/lecturer/GradeItemManager.tsx` following `AssignmentManager.tsx`'s structure — a `Drawer` form (section select, name, max score, weight percentage) calling `createGradeItemAction`, plus the existing `DataTable` of items moved in from the page. Replace the read-only table in `app/(dashboard)/lecturer/gradebook/page.tsx` with this component, keeping the server read.

- [ ] **Step 2: User roles**

Create `components/admin/UserRoleManager.tsx` — a `DataTable` of the university's users with a role `<select>` and a Save button per row, calling `updateUserRoleAction`. Guard in the UI: a `department_admin` must not be offered `super_admin`; read `lib/auth/permissions.ts` and mirror whatever the action already enforces server-side. Wire it into `app/(dashboard)/admin/users/page.tsx`.

- [ ] **Step 3: Profile settings**

Create `components/settings/ProfileForm.tsx` — first name, last name, phone, bio, plus an avatar `FileUploader` (`bucket={STORAGE_BUCKETS.PROFILE_IMAGES}`, `scope="avatars"`, single file, `accept="image/*"`, `maxSizeMb={5}`) whose resulting path is submitted as `avatarUrl`. Calls `updateProfileAction`. Add it to `app/(dashboard)/student/settings/page.tsx` above the existing preferences form, and to `components/lecturer/LecturerSettingsForm.tsx`'s page if the lecturer settings page lacks profile fields.

- [ ] **Step 4: Gate and smoke test**

Run: `npm run lint && npm run typecheck && npm run test`
Then verify each of the three flows manually: create a grade item, change a user's role, upload an avatar and confirm it renders in the topbar.

- [ ] **Step 5: Commit**

```bash
git add components/lecturer/GradeItemManager.tsx components/admin/UserRoleManager.tsx components/settings/ProfileForm.tsx "app/(dashboard)"
git commit -m "feat: wire grade items, user role management, and profile editing"
```

---

### Task 17: Live class edit/cancel and recording publication

**Files:**
- Modify: `components/lecturer/LiveClassManager.tsx`
- Modify: `app/(dashboard)/lecturer/recordings/page.tsx`
- Create: `components/lecturer/RecordingManager.tsx`

**Interfaces:**
- Consumes: `updateLiveClassAction`, `cancelLiveClassAction`, `toggleRecordingPublishAction`.
- Produces: `<RecordingManager recordings={Recording[]} />`.

- [ ] **Step 1: Add edit and cancel to the live class manager**

`components/lecturer/LiveClassManager.tsx` already creates classes. Add an `editing` state exactly as `AssignmentManager.tsx` does: an edit button per row that opens the same `Drawer` prefilled, submitting through `updateLiveClassAction` instead of `createLiveClassAction`, plus a Cancel button calling `cancelLiveClassAction` with a confirm step.

- [ ] **Step 2: Build the recording manager**

Create `components/lecturer/RecordingManager.tsx` — a `DataTable` of recordings (title, live class, duration, published) with a publish/unpublish toggle per row calling `toggleRecordingPublishAction`. Follow `AssignmentManager`'s `run()` helper pattern. Replace the read-only table in `app/(dashboard)/lecturer/recordings/page.tsx`.

- [ ] **Step 3: Gate**

Run: `npm run lint && npm run typecheck && npm run test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/lecturer/LiveClassManager.tsx components/lecturer/RecordingManager.tsx "app/(dashboard)/lecturer/recordings/page.tsx"
git commit -m "feat: add live class editing and recording publication controls"
```

---

## Phase 6 — Realtime, cleanup, and release (Tasks 18–21)

### Task 18: Live notification bell

The topbar bell is inert and shows a permanently-lit unread dot.

**Files:**
- Create: `components/layout/NotificationBell.tsx`
- Modify: `components/layout/Topbar.tsx`
- Modify: `components/layout/AppShell.tsx` (pass the unread count down)

**Interfaces:**
- Consumes: `setupNotificationChannel(supabase, userId, onNotification)` from `lib/realtime/channels.ts`; `markAllNotificationsAsRead` from `app/actions/notifications`.
- Produces: `<NotificationBell userId={string} initialUnread={number} />`.

- [ ] **Step 1: Build the bell**

Create `components/layout/NotificationBell.tsx`:

```tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { setupNotificationChannel } from "@/lib/realtime/channels";

export function NotificationBell({ userId, initialUnread }: { userId: string; initialUnread: number }) {
  const [unread, setUnread] = React.useState(initialUnread);

  React.useEffect(() => {
    const supabase = createClient();
    const channel = setupNotificationChannel(supabase, userId, () => {
      setUnread((current) => current + 1);
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <Link
      href="/notifications"
      className="relative rounded-full p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
      aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
    >
      <Bell size={20} />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
```

The `/notifications` href must resolve per role. Read `lib/navigation.ts` and use the role-appropriate path (`/student/notifications`, etc.) — pass it as a `href` prop rather than hardcoding, so `npm run check:links` stays green.

- [ ] **Step 2: Swap it into the topbar**

In `components/layout/Topbar.tsx`, replace the inert `<button>` with `<NotificationBell userId={user.id} initialUnread={user.unreadNotifications ?? 0} href={...} />`. Extend the `AppShellUser` type in `components/layout/AppShell.tsx` with `unreadNotifications: number` and populate it in whatever server component builds that object — a `count` query on `notifications` where `user_id = <id> and is_read = false`.

- [ ] **Step 3: Enable realtime on the table**

In the Supabase dashboard → Database → Replication, add `notifications` to the `supabase_realtime` publication. Equivalently, add to a migration:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

- [ ] **Step 4: Gate and smoke test**

Run: `npm run lint && npm run typecheck && npm run test && npm run check:links`

Then, with a student session open in one browser and a lecturer session in another, grade the student's assignment and confirm the student's bell count increments without a refresh.

- [ ] **Step 5: Commit**

```bash
git add components/layout supabase/migrations
git commit -m "feat: add realtime notification bell"
```

---

### Task 19: Remove dead design-phase code

These components are not imported by any route. They are simulated UI (fake progress timers, `picsum.photos` frames) that will mislead the next engineer.

**Files:**
- Delete: `components/video/VideoPlayerShell.tsx`, `components/video/VideoTabs.tsx`
- Delete: `components/live/ChatPanel.tsx`, `components/live/VideoTile.tsx`, `components/live/LiveControlBar.tsx`, `components/live/ParticipantPanel.tsx`, `components/live/WaitingRoom.tsx`
- Delete: `components/courses/CourseHero.tsx`, `components/courses/CourseTabs.tsx`, `components/courses/CourseAssignments.tsx`, `components/courses/CourseModuleAccordion.tsx`
- Modify: `components/student/StudentCourseCard.tsx`, `components/lecturer/LecturerCourseCard.tsx`, `components/course-card.tsx`
- Modify: `app/(dashboard)/lecturer/courses/page.tsx`
- Modify: `next.config.ts`
- Modify: `tests/page-completion.test.ts`

- [ ] **Step 1: Confirm each file is genuinely unreferenced**

Run: `grep -rn "VideoPlayerShell\|VideoTabs\|ChatPanel\|VideoTile\|LiveControlBar\|ParticipantPanel\|WaitingRoom\|CourseHero\|CourseTabs\|CourseAssignments\|CourseModuleAccordion" app components --include=*.tsx --include=*.ts`
Expected: matches only inside the files being deleted themselves. `components/live/LiveClassCard.tsx` and `LiveClassList.tsx` ARE used — do not delete those. If any other file references a deletion target, stop and resolve that first.

- [ ] **Step 2: Delete them**

```bash
rm -f components/video/VideoPlayerShell.tsx components/video/VideoTabs.tsx
rm -f components/live/ChatPanel.tsx components/live/VideoTile.tsx components/live/LiveControlBar.tsx components/live/ParticipantPanel.tsx components/live/WaitingRoom.tsx
rm -f components/courses/CourseHero.tsx components/courses/CourseTabs.tsx components/courses/CourseAssignments.tsx components/courses/CourseModuleAccordion.tsx
```

- [ ] **Step 3: Replace picsum course art with real thumbnails**

In `components/student/StudentCourseCard.tsx`, `components/lecturer/LecturerCourseCard.tsx`, and `components/course-card.tsx`, replace `src={`https://picsum.photos/seed/${...}/...`}` with the course's own `thumbnail_url` and a deterministic CSS gradient fallback keyed off the course code:

```tsx
const gradientFor = (seed: string) => {
  const hue = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0) % 360;
  return `linear-gradient(135deg, hsl(${hue} 70% 32%), hsl(${(hue + 48) % 360} 70% 18%))`;
};
```

```tsx
{course.thumbnail_url ? (
  <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover" />
) : (
  <div className="h-full w-full" style={{ background: gradientFor(course.code || course.title) }} />
)}
```

Then remove the `picsum.photos` entry from `next.config.ts` `images.remotePatterns`. Add the Supabase storage hostname in its place so uploaded thumbnails render:

```ts
      {
        protocol: 'https',
        hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname,
      },
```

- [ ] **Step 4: Remove the inert "Add Material" button**

In `app/(dashboard)/lecturer/courses/page.tsx`, the header button does nothing. Either delete it, or turn it into a `Link` to the lecturer's first course section content page. Prefer deleting — content is managed per section at `/lecturer/courses/[sectionId]`.

- [ ] **Step 5: Extend the placeholder guard test**

In `tests/page-completion.test.ts`, add `picsum.photos` and `ui-avatars.com` to the forbidden-marker list, so the fake-image pattern cannot return. If the topbar still uses `ui-avatars.com` for a default avatar, replace it with an initials-based `<div>` first.

- [ ] **Step 6: Gate**

Run: `npm run lint && npm run typecheck && npm run test && npm run build`
Expected: PASS with no unresolved imports.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: remove simulated design-phase components and placeholder imagery"
```

---

### Task 20: Seed data that exercises the real flows

The demo seeds create users but the app is only convincing with content behind them.

**Files:**
- Modify: `scripts/comprehensive-seed.ts`
- Modify: `tests/seed-contract.test.ts`
- Modify: `README.md`

- [ ] **Step 1: Read the current seed**

Open `scripts/comprehensive-seed.ts` and note exactly which tables it populates and in what order.

- [ ] **Step 2: Extend it**

Add, for the seeded university and in dependency order: one semester, one faculty → department → program → course → course section, the lecturer assigned to that section via `course_lecturers`, the student enrolled via `course_enrollments` with `status = 'active'`, one course module with two lessons, one published assignment due in seven days, one published quiz with two questions, one attendance session, and one discussion with a reply. Every insert must be idempotent (`upsert` on a natural key, or select-then-insert), because the script will be run repeatedly.

- [ ] **Step 3: Assert the contract**

Extend `tests/seed-contract.test.ts` so it parses `scripts/comprehensive-seed.ts` and asserts the script references every table listed above. This is a static guard against the seed silently drifting from the schema — the same approach `tests/page-completion.test.ts` already uses.

- [ ] **Step 4: Run it**

```bash
npx tsx scripts/comprehensive-seed.ts
```

Expected: exits 0. Run it twice in a row to prove idempotency.

- [ ] **Step 5: Document it in the README**

Add a "Local demo data" section covering `npm run db:seed:auth`, then `npx tsx scripts/comprehensive-seed.ts`, and the four demo logins.

- [ ] **Step 6: Commit**

```bash
git add scripts/comprehensive-seed.ts tests/seed-contract.test.ts README.md
git commit -m "feat: seed a complete demo course with content and enrollments"
```

---

### Task 21: Release gate

**Files:**
- Modify: `package.json`
- Modify: `working-memory.md`
- Create: `docs/RUNBOOK.md`

- [ ] **Step 1: Run the whole gate**

Run: `npm run verify`
Expected: every stage passes — `check:env`, `check:links`, `check:rls`, `lint`, `typecheck`, `test`, `build`. Fix anything that fails before continuing; do not skip a stage.

- [ ] **Step 2: Re-audit for orphaned actions**

Run this and confirm the list is empty or contains only actions you consciously left for a later phase:

```bash
grep -rhn "export async function" app/actions | sed 's/.*export async function //;s/(.*//' | sort -u | while read a; do c=$(grep -rl "\b$a\b" --include=*.tsx --include=*.ts app components | grep -v "^app/actions/" | wc -l); if [ "$c" -eq 0 ]; then echo "UNUSED: $a"; fi; done
```

Expected after this plan: at most `detachLessonMaterialAction` and `deleteQuizQuestionAction` remain. If you want a fully clean sheet, wire those two into `CourseContentManager` and `LecturerQuizManager` now.

- [ ] **Step 3: Check the production dependency audit**

Run: `npm audit --audit-level=high --omit=dev`
Expected: exit 0. Moderate advisories in Next's transitive `postcss` are acceptable and already documented; do not run `npm audit fix --force`.

- [ ] **Step 4: Write the runbook**

Create `docs/RUNBOOK.md` covering: required env vars and where each comes from; how to apply migrations; how to register the Mux and Daily webhooks; how to rotate the Resend key; what to check first when video stays in `processing` (Mux dashboard → the asset's status, then our webhook delivery log); what to check when live classes fail to start (`DAILY_API_KEY`); and how to roll back a bad deploy.

- [ ] **Step 5: Update working memory**

In `working-memory.md`, move every item this plan completed out of "Next Actions" and into "Confirmed Facts" with the date `2026-08-13`. Add the new risks: Mux costs scale with delivery minutes; the storage migration `020` deletes the `vui_*` buckets, so any data in them must be migrated first in an environment that has real users.

- [ ] **Step 6: Final commit and branch**

```bash
git add -A
git commit -m "docs: add production runbook and update working memory"
```

---

## Self-Review Notes

**Spec coverage** — every blocker from the 2026-08-13 audit maps to a task: env gate → Task 5; migrations → Tasks 5, 6, 8, 11, 15; student submission → Task 9; grading → Task 10; file upload → Tasks 6–7; attendance → Task 14; discussions → Task 15; orphaned actions → Tasks 14–17 and re-audited in Task 21; rate limiter → Task 3; email → Task 4; realtime bell → Task 18; dead components and picsum → Task 19; thin tests → Task 2 plus a test file in every feature task; zero commits → Task 1.

**Deliberately out of scope** — payments and subscription billing. Plans, subscriptions, and invoices stay superadmin-managed records, per the decision on 2026-08-13. If that changes, it is a separate plan.

**Known sequencing constraints** — Task 7 depends on Task 6's `buildStoragePath` and the reshaped `createSignedUploadSchema`. Tasks 9 and 10 depend on Task 7. Task 13 depends on Tasks 11 and 12. Task 18 depends on the notification writes added in Tasks 9 and 10. Everything else can be reordered.

**Type consistency check** — `UploadedFile` is defined once in `components/ui/file-uploader.tsx` and imported everywhere else (`file-list.tsx`, `AssignmentSubmissionPanel`, `SubmissionGradingPanel`). Its server-side twin is `uploadedFileSchema` in `lib/validation/submission.ts`; the four field names (`path`, `fileName`, `fileSize`, `fileType`) match exactly. `MuxWebhookEvent` is defined once in `lib/video/mux.ts` and consumed by `VideoAssetService.applyMuxEvent`. `STORAGE_BUCKETS` is defined once in `lib/storage/paths.ts` and re-exported from the old `lib/storage/buckets.ts` path.
