# Training Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an organisation run compulsory, recurring internal training — assign a course to people with a due date, track who is overdue, and issue certificates that expire and must be renewed — without pretending the organisation is a university.

**Architecture:** A tenant declares a `mode`: `academic` (today's behaviour, unchanged) or `training`. The academic chain becomes optional rather than fabricated — `courses.department_id` and `course_sections.semester_id` become nullable, and a section carries its own `starts_on` / `ends_on` so it can be a cohort instead of a semester slot. On top of that sit three new capabilities: training assignments (who must complete what, by when), certificate validity periods (certificates that lapse), and a compliance view that reads both.

**Tech Stack:** Next.js App Router 15.5, React 19, TypeScript, Supabase Postgres with RLS, Vitest with the stub harness at `tests/helpers/supabase-stub.ts`.

## Global Constraints

- **Never break academic tenants.** `universities.mode` defaults to `'academic'`; every existing read and write path must behave exactly as it does today for those tenants. Any test that passes before a task must pass after it.
- **Migrations are sequential and additive**, starting at `037`. The last migration in the tree is `036_school_branding.sql`, added by concurrent work. Use `IF NOT EXISTS` / `pg_policies` guards, matching the style of `031`–`036`.
- **Every new table needs RLS policies and explicit grants**, following `026_data_api_grants.sql`: `GRANT ... TO authenticated` plus `GRANT ALL ... TO service_role`. RLS enabled with no policy means deny-all — that bug has already cost this project twice (`live_classes`, lecturer write paths).
- **Server Actions are the canonical mutation path.** Do not add API routes that duplicate an action; `tests/page-completion.test.ts` fails if an exported Server Action has no UI caller.
- **`npm run verify` must pass before every commit.** It runs `check:env`, `check:links`, `check:rls`, `lint`, `typecheck`, `test`, `build`.
- **Commit messages** are conventional (`feat:`, `fix:`, `refactor:`) and end with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- **No credential ever enters a file.** Scripts read secrets from the environment.
- **Dates that a human sets are `DATE`**; instants the system records are `TIMESTAMPTZ`.

## File Structure

**New files**

| File | Responsibility |
|---|---|
| `supabase/migrations/037_tenant_mode.sql` | `universities.mode`, nullable `department_id` / `semester_id`, cohort dates on sections |
| `supabase/migrations/038_training_assignments.sql` | `training_assignments` table, RLS, grants |
| `supabase/migrations/039_certificate_validity.sql` | `courses.valid_for_months`, `certificates.expires_at` |
| `lib/tenant/mode.ts` | Reads and caches a tenant's mode; `isTrainingTenant()` |
| `lib/services/training-assignment.service.ts` | Assign, bulk-assign, list, cancel, and status derivation |
| `lib/services/compliance.service.ts` | Per-course and per-person compliance rollups |
| `app/actions/training.ts` | Server Actions for assignment and renewal |
| `components/training/AssignTrainingPanel.tsx` | Trainer/admin UI to assign a cohort or a team |
| `components/training/ComplianceTable.tsx` | Overdue / due soon / expiring view |
| `app/(dashboard)/admin/compliance/page.tsx` | Compliance page for admins |
| `app/(dashboard)/student/training/page.tsx` | A learner's required training with due dates |
| `tests/tenant-mode.test.ts` | Mode gating and the optional academic chain |
| `tests/training-assignment.test.ts` | Assignment lifecycle and status derivation |
| `tests/compliance.test.ts` | Rollups, overdue maths, expiry windows |

**Modified files**

| File | Change |
|---|---|
| `lib/validation/admin.ts:22-29` | `departmentId` optional on `courseSchema` |
| `lib/services/admin/course.service.ts:7-24` | Accept a course with no department |
| `app/actions/admin/courses.ts` | `semesterId` optional on the section schema |
| `components/admin/CourseSectionManager.tsx:160-167` | Cohort dates; hide semester in training mode |
| `lib/services/certificate.service.ts` | Set `expires_at` at issue; expose expiry in `verify()` |
| `app/certificates/[serial]/page.tsx` | Show expired distinctly from revoked |
| `lib/services/tenant-bootstrap.ts` | Skip the academic chain for training tenants |
| `app/actions/superadmin.ts` | Accept `mode` when creating a school |
| `lib/ui/tenant-vocabulary.ts` | Derive vocabulary from mode when unset |
| `lib/navigation.ts` | Add Compliance (admin) and My Training (student) |
| `docs/RUNBOOK.md` | Document training mode and the compliance workflow |

---

### Task 1: Tenant mode and an optional academic chain

Makes the academic hierarchy optional instead of fabricated. After this task a training tenant can own a course with no department and a cohort with no semester.

**Files:**
- Create: `supabase/migrations/037_tenant_mode.sql`
- Create: `lib/tenant/mode.ts`
- Create: `tests/tenant-mode.test.ts`
- Modify: `lib/validation/admin.ts:22-29`
- Modify: `lib/services/admin/course.service.ts:7-44`
- Modify: `lib/services/tenant-bootstrap.ts`
- Modify: `app/actions/superadmin.ts`

**Interfaces:**
- Produces: `getTenantMode(client, universityId): Promise<'academic' | 'training'>`, type `TenantMode`, `isTrainingTenant(mode): boolean`
- Produces: `courses.department_id` nullable, `course_sections.semester_id` nullable, `course_sections.starts_on` / `ends_on` (DATE, nullable), `universities.mode`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/037_tenant_mode.sql
-- A tenant is either a school or an organisation running internal training.
-- The difference is structural, not cosmetic: a firm has no faculties and no
-- semesters, and fabricating them makes every report read as though it does.

ALTER TABLE universities ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'academic';

DO $BODY$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'universities_mode_values') THEN
    ALTER TABLE universities
      ADD CONSTRAINT universities_mode_values CHECK (mode IN ('academic', 'training'));
  END IF;
END;
$BODY$;

-- The chain becomes optional. Existing rows already satisfy it, so no backfill.
ALTER TABLE courses ALTER COLUMN department_id DROP NOT NULL;
ALTER TABLE course_sections ALTER COLUMN semester_id DROP NOT NULL;

-- A cohort carries its own dates rather than borrowing a semester's.
ALTER TABLE course_sections ADD COLUMN IF NOT EXISTS starts_on DATE;
ALTER TABLE course_sections ADD COLUMN IF NOT EXISTS ends_on DATE;

DO $BODY$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_sections_date_order') THEN
    ALTER TABLE course_sections
      ADD CONSTRAINT course_sections_date_order
      CHECK (starts_on IS NULL OR ends_on IS NULL OR ends_on >= starts_on);
  END IF;

  -- A section with neither a semester nor its own start date is unschedulable
  -- in either mode, so exactly one of the two must be present.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_sections_schedulable') THEN
    ALTER TABLE course_sections
      ADD CONSTRAINT course_sections_schedulable
      CHECK (semester_id IS NOT NULL OR starts_on IS NOT NULL);
  END IF;
END;
$BODY$;
```

- [ ] **Step 2: Write the failing test**

```typescript
// tests/tenant-mode.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createSupabaseStub } from './helpers/supabase-stub';
import { getTenantMode, isTrainingTenant } from '@/lib/tenant/mode';

describe('getTenantMode', () => {
  it('reads the mode a tenant declared', async () => {
    const { client } = createSupabaseStub({ universities: [{ id: 'uni1', mode: 'training' }] });
    expect(await getTenantMode(client, 'uni1')).toBe('training');
  });

  it('falls back to academic for an unknown tenant', async () => {
    const { client } = createSupabaseStub({ universities: [] });
    expect(await getTenantMode(client, 'missing')).toBe('academic');
  });

  it('falls back to academic rather than failing a page render', async () => {
    const client = { from() { throw new Error('database unreachable'); } } as any;
    expect(await getTenantMode(client, 'uni1')).toBe('academic');
  });

  it('treats only training as training', () => {
    expect(isTrainingTenant('training')).toBe(true);
    expect(isTrainingTenant('academic')).toBe(false);
  });
});

describe('optional academic chain', () => {
  it('drops the NOT NULL that forced a fabricated hierarchy', () => {
    const migration = fs.readFileSync(
      path.join(process.cwd(), 'supabase', 'migrations', '037_tenant_mode.sql'),
      'utf8',
    );

    expect(migration).toContain('ALTER TABLE courses ALTER COLUMN department_id DROP NOT NULL');
    expect(migration).toContain('ALTER TABLE course_sections ALTER COLUMN semester_id DROP NOT NULL');
    expect(migration).toContain('course_sections_schedulable');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run tests/tenant-mode.test.ts`
Expected: FAIL with `Cannot find module '@/lib/tenant/mode'`

- [ ] **Step 4: Write the implementation**

```typescript
// lib/tenant/mode.ts
import { SupabaseClient } from '@supabase/supabase-js';

export type TenantMode = 'academic' | 'training';

export const isTrainingTenant = (mode: TenantMode): boolean => mode === 'training';

/**
 * A tenant that has not declared a mode is a school, because that is what every
 * tenant was before this column existed. Read failures degrade the same way:
 * layout and wording are never worth failing a render over.
 */
export async function getTenantMode(
  client: SupabaseClient<any>,
  universityId: string | null | undefined,
): Promise<TenantMode> {
  if (!universityId) return 'academic';

  try {
    const { data } = await client
      .from('universities')
      .select('mode')
      .eq('id', universityId)
      .maybeSingle();

    return data?.mode === 'training' ? 'training' : 'academic';
  } catch {
    return 'academic';
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/tenant-mode.test.ts`
Expected: PASS, 5 tests

- [ ] **Step 6: Make the department optional on a course**

In `lib/validation/admin.ts`, replace line 23 so `courseSchema` reads:

```typescript
export const courseSchema = z.object({
  // A training tenant has no departments. An academic tenant still gets one,
  // because its admin UI only ever submits a department id.
  departmentId: uuidSchema.optional().nullable(),
  title: z.string().min(2),
  code: z.string().min(2).max(20),
  description: z.string().optional(),
  credits: z.number().int().min(1).max(10).default(3),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});
```

In `lib/services/admin/course.service.ts`:
- `createCourse` writes `department_id: payload.departmentId ?? null` (line 12).
- `updateCourse` replaces `...(payload.departmentId && { department_id: payload.departmentId })` with `...(payload.departmentId !== undefined && { department_id: payload.departmentId || null })` (line 30).

- [ ] **Step 7: Stop the bootstrap fabricating a hierarchy**

In `lib/services/tenant-bootstrap.ts`, widen `BootstrapResult` so every id is `string | null`, then return early for a training tenant:

```typescript
export type BootstrapResult = {
  created: boolean;
  facultyId: string | null;
  departmentId: string | null;
  academicSessionId: string | null;
  semesterId: string | null;
};

export async function bootstrapAcademicStructure(
  client: SupabaseClient<any>,
  universityId: string,
  options: Partial<BootstrapNames> & { now?: Date; mode?: TenantMode } = {},
): Promise<BootstrapResult> {
  // A training tenant needs none of this: courses attach straight to the tenant
  // and cohorts carry their own dates. Creating a "Training" faculty containing
  // a "General" department was a costume, not a structure.
  if (options.mode === 'training') {
    return { created: false, facultyId: null, departmentId: null, academicSessionId: null, semesterId: null };
  }

  // ... rest of the existing body unchanged
}
```

In `app/actions/superadmin.ts`:
- Add `mode: z.enum(['academic', 'training']).default('academic')` to `universitySchema` (in `lib/validation/` wherever that schema lives; if it is declared inline in this file, add it there).
- Write `mode: parsed.data.mode` in the `universities` insert.
- Pass `{ mode: parsed.data.mode }` into the `bootstrapAcademicStructure` call.
- Add a mode selector to the create-school form in `app/(dashboard)/superadmin/universities/page.tsx`, defaulting to School.

- [ ] **Step 8: Run the full suite**

Run: `npm run verify`
Expected: exit 0. Existing tests must all still pass — `tests/tenant-bootstrap.test.ts` covers the academic path and must be untouched by this change.

- [ ] **Step 9: Commit**

```bash
git add supabase/migrations/037_tenant_mode.sql lib/tenant/mode.ts tests/tenant-mode.test.ts lib/validation/admin.ts lib/services/admin/course.service.ts lib/services/tenant-bootstrap.ts app/actions/superadmin.ts "app/(dashboard)/superadmin/universities/page.tsx" && git commit -m "feat: make the academic hierarchy optional for training tenants"
```

---

### Task 2: Cohorts with their own dates

A section stops needing a semester. In training mode the admin UI collects start and end dates instead.

**Files:**
- Modify: `app/actions/admin/courses.ts` (the `sectionSchema` near line 15)
- Modify: `components/admin/CourseSectionManager.tsx:34-52,160-167`
- Modify: `app/(dashboard)/admin/courses/page.tsx`
- Test: `tests/tenant-mode.test.ts` (append)

**Interfaces:**
- Consumes: `getTenantMode` from Task 1
- Produces: section payload `{ courseId, semesterId?, name, capacity?, startsOn?, endsOn? }`

- [ ] **Step 1: Write the failing test**

Append to `tests/tenant-mode.test.ts`:

```typescript
import { sectionSchema } from '@/app/actions/admin/courses';

describe('cohort sections', () => {
  it('accepts a cohort with dates and no semester', () => {
    const parsed = sectionSchema.safeParse({
      courseId: '11111111-1111-1111-1111-111111111111',
      name: 'January intake',
      startsOn: '2026-01-06',
      endsOn: '2026-02-06',
    });

    expect(parsed.success).toBe(true);
  });

  it('accepts an academic section with a semester and no dates', () => {
    const parsed = sectionSchema.safeParse({
      courseId: '11111111-1111-1111-1111-111111111111',
      semesterId: '22222222-2222-2222-2222-222222222222',
      name: 'Group A',
    });

    expect(parsed.success).toBe(true);
  });

  it('rejects a section that is neither scheduled nor dated', () => {
    const parsed = sectionSchema.safeParse({
      courseId: '11111111-1111-1111-1111-111111111111',
      name: 'Nowhere',
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects a cohort that ends before it starts', () => {
    const parsed = sectionSchema.safeParse({
      courseId: '11111111-1111-1111-1111-111111111111',
      name: 'Backwards',
      startsOn: '2026-02-06',
      endsOn: '2026-01-06',
    });

    expect(parsed.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/tenant-mode.test.ts`
Expected: FAIL — `sectionSchema` is not exported from `app/actions/admin/courses.ts`

- [ ] **Step 3: Write the implementation**

In `app/actions/admin/courses.ts`, export the schema and mirror the database constraints in it:

```typescript
export const sectionSchema = z
  .object({
    id: z.string().uuid().optional(),
    courseId: z.string().uuid(),
    semesterId: z.string().uuid().optional().nullable(),
    name: z.string().min(2),
    capacity: z.coerce.number().int().positive().optional().nullable(),
    startsOn: z.string().date().optional().nullable(),
    endsOn: z.string().date().optional().nullable(),
  })
  .refine((value) => Boolean(value.semesterId) || Boolean(value.startsOn), {
    message: 'Give the cohort a start date, or attach it to a term.',
    path: ['startsOn'],
  })
  .refine((value) => !value.startsOn || !value.endsOn || value.endsOn >= value.startsOn, {
    message: 'The cohort cannot end before it starts.',
    path: ['endsOn'],
  });
```

Update `upsertCourseSectionAction` in the same file to write `semester_id: parsed.data.semesterId ?? null`, `starts_on: parsed.data.startsOn ?? null`, `ends_on: parsed.data.endsOn ?? null`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/tenant-mode.test.ts`
Expected: PASS, 9 tests

- [ ] **Step 5: Update the section form**

`app/(dashboard)/admin/courses/page.tsx` reads the tenant mode with `getTenantMode(supabase, session.profile.university_id)` and passes `mode` into `CourseSectionManager`.

In `components/admin/CourseSectionManager.tsx`, add `mode` to the props, then in the create-section drawer (currently lines 160-167) swap the semester field for cohort dates when `mode === 'training'`:

```tsx
{mode === "training" ? (
  <div className="grid gap-4 sm:grid-cols-2">
    <label className="grid gap-2 text-sm font-medium text-slate-300">
      Starts on
      <input name="startsOn" type="date" required className={inputClass} />
    </label>
    <label className="grid gap-2 text-sm font-medium text-slate-300">
      Ends on
      <input name="endsOn" type="date" className={inputClass} />
    </label>
  </div>
) : (
  <label className="grid gap-2 text-sm font-medium text-slate-300">
    Semester
    <select name="semesterId" required className={inputClass}>
      {semesters.map((semester) => (
        <option key={semester.id} value={semester.id}>{semester.name}</option>
      ))}
    </select>
  </label>
)}
```

`createSection` builds the payload with `semesterId: formData.get("semesterId") || undefined`, `startsOn: formData.get("startsOn") || undefined`, `endsOn: formData.get("endsOn") || undefined`. Its submit button currently disables when `semesters.length === 0`; that guard must apply only in academic mode.

- [ ] **Step 6: Run the full suite**

Run: `npm run verify`
Expected: exit 0

- [ ] **Step 7: Commit**

```bash
git add app/actions/admin/courses.ts components/admin/CourseSectionManager.tsx "app/(dashboard)/admin/courses/page.tsx" tests/tenant-mode.test.ts && git commit -m "feat: let cohorts carry their own dates instead of a semester"
```

---

### Task 3: Training assignments

The core of the module: who must complete what, by when. Assignment is what makes training compulsory rather than available.

**Files:**
- Create: `supabase/migrations/038_training_assignments.sql`
- Create: `lib/services/training-assignment.service.ts`
- Create: `tests/training-assignment.test.ts`

**Interfaces:**
- Produces: `TrainingAssignmentService` with `assign(params)`, `assignTeam(params)`, `listForStudent(studentId)`, `listForSection(sectionId)`, `cancel(assignmentId, userId)`
- Produces: `deriveStatus(assignment, now): 'completed' | 'overdue' | 'due_soon' | 'assigned'`
- Produces: table `training_assignments`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/038_training_assignments.sql
-- Compulsory training. An enrollment says a person may take a course; an
-- assignment says they must, and by when. Enrollment alone cannot express a
-- deadline, which is the whole of what compliance reporting reads.

CREATE TABLE IF NOT EXISTS training_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    course_section_id UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    due_on DATE,
    assigned_by UUID REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    -- Set when the assignment exists to renew a certificate that lapsed.
    renews_certificate_id UUID REFERENCES certificates(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (course_section_id, student_id)
);

CREATE INDEX IF NOT EXISTS training_assignments_student_idx
  ON training_assignments (student_id, due_on);
CREATE INDEX IF NOT EXISTS training_assignments_section_idx
  ON training_assignments (course_section_id, due_on);
CREATE INDEX IF NOT EXISTS training_assignments_outstanding_idx
  ON training_assignments (university_id, due_on)
  WHERE completed_at IS NULL AND cancelled_at IS NULL;

ALTER TABLE training_assignments ENABLE ROW LEVEL SECURITY;

DO $BODY$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'training_assignments'
      AND policyname = 'Learners view own assignments'
  ) THEN
    CREATE POLICY "Learners view own assignments" ON training_assignments
    FOR SELECT USING (student_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'training_assignments'
      AND policyname = 'Course staff view assignments'
  ) THEN
    CREATE POLICY "Course staff view assignments" ON training_assignments
    FOR SELECT USING (
      is_course_lecturer(course_section_id) OR is_university_admin(university_id) OR is_super_admin()
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'training_assignments'
      AND policyname = 'Course staff assign training'
  ) THEN
    CREATE POLICY "Course staff assign training" ON training_assignments
    FOR INSERT WITH CHECK (
      in_same_tenant(university_id)
      AND (is_course_lecturer(course_section_id) OR is_university_admin(university_id) OR is_super_admin())
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'training_assignments'
      AND policyname = 'Course staff update assignments'
  ) THEN
    -- Completion and cancellation are updates. There is no DELETE policy: an
    -- assignment that was withdrawn is evidence, the same as a revoked
    -- certificate.
    CREATE POLICY "Course staff update assignments" ON training_assignments
    FOR UPDATE USING (
      is_course_lecturer(course_section_id) OR is_university_admin(university_id) OR is_super_admin()
    );
  END IF;
END;
$BODY$;

GRANT SELECT, INSERT, UPDATE ON public.training_assignments TO authenticated;
GRANT ALL ON public.training_assignments TO service_role;
```

- [ ] **Step 2: Write the failing test**

```typescript
// tests/training-assignment.test.ts
import { describe, it, expect } from 'vitest';
import { createSupabaseStub } from './helpers/supabase-stub';
import { TrainingAssignmentService, deriveStatus } from '@/lib/services/training-assignment.service';

const NOW = new Date('2026-08-18T00:00:00.000Z');

function stub(assignments: any[] = []) {
  return createSupabaseStub({
    course_lecturers: [{ id: 'cl1', course_section_id: 'sec1', lecturer_id: 'lec1' }],
    course_sections: [{ id: 'sec1', university_id: 'uni1', name: 'January intake' }],
    course_enrollments: [],
    profiles: [
      { id: 'stu1', university_id: 'uni1', department_id: 'dep1', first_name: 'Ada', last_name: 'Obi' },
      { id: 'stu2', university_id: 'uni1', department_id: 'dep1', first_name: 'Bola', last_name: 'Eze' },
    ],
    training_assignments: assignments,
  });
}

describe('deriveStatus', () => {
  it('reports completed regardless of the due date', () => {
    expect(deriveStatus({ due_on: '2026-01-01', completed_at: '2026-01-05T00:00:00Z', cancelled_at: null }, NOW))
      .toBe('completed');
  });

  it('reports overdue once the due date has passed', () => {
    expect(deriveStatus({ due_on: '2026-08-17', completed_at: null, cancelled_at: null }, NOW)).toBe('overdue');
  });

  it('reports due_soon inside the next fourteen days', () => {
    expect(deriveStatus({ due_on: '2026-08-25', completed_at: null, cancelled_at: null }, NOW)).toBe('due_soon');
  });

  it('reports assigned when the deadline is far off or absent', () => {
    expect(deriveStatus({ due_on: '2026-12-01', completed_at: null, cancelled_at: null }, NOW)).toBe('assigned');
    expect(deriveStatus({ due_on: null, completed_at: null, cancelled_at: null }, NOW)).toBe('assigned');
  });

  it('never reports a cancelled assignment as overdue', () => {
    expect(deriveStatus({ due_on: '2026-01-01', completed_at: null, cancelled_at: '2026-02-01T00:00:00Z' }, NOW))
      .toBe('cancelled');
  });
});

describe('TrainingAssignmentService.assign', () => {
  it('refuses a trainer who does not run the cohort', async () => {
    const { client } = createSupabaseStub({ course_lecturers: [] });

    await expect(
      new TrainingAssignmentService(client).assign({
        universityId: 'uni1',
        courseSectionId: 'sec1',
        studentId: 'stu1',
        dueOn: '2026-09-01',
        assignedBy: 'someone-else',
      }),
    ).rejects.toThrow('Unauthorized: not assigned to this course section');
  });

  it('enrolls the learner so assigned training is actually reachable', async () => {
    const { client, inserted } = stub();

    await new TrainingAssignmentService(client).assign({
      universityId: 'uni1',
      courseSectionId: 'sec1',
      studentId: 'stu1',
      dueOn: '2026-09-01',
      assignedBy: 'lec1',
    });

    expect(inserted.training_assignments).toHaveLength(1);
    // An assignment the learner cannot open is a deadline with no door.
    expect(inserted.course_enrollments[0]).toMatchObject({
      course_section_id: 'sec1',
      student_id: 'stu1',
      status: 'active',
    });
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run tests/training-assignment.test.ts`
Expected: FAIL — `Cannot find module '@/lib/services/training-assignment.service'`

- [ ] **Step 4: Write the implementation**

```typescript
// lib/services/training-assignment.service.ts
import { SupabaseClient } from '@supabase/supabase-js';

export type AssignmentStatus = 'completed' | 'cancelled' | 'overdue' | 'due_soon' | 'assigned';

/** Days before the due date at which an assignment starts warning. */
export const DUE_SOON_DAYS = 14;

export function deriveStatus(
  assignment: { due_on: string | null; completed_at: string | null; cancelled_at: string | null },
  now: Date = new Date(),
): AssignmentStatus {
  if (assignment.completed_at) return 'completed';
  if (assignment.cancelled_at) return 'cancelled';
  if (!assignment.due_on) return 'assigned';

  const due = new Date(`${assignment.due_on}T23:59:59.999Z`);
  if (due.getTime() < now.getTime()) return 'overdue';

  const days = (due.getTime() - now.getTime()) / 86_400_000;
  return days <= DUE_SOON_DAYS ? 'due_soon' : 'assigned';
}

export class TrainingAssignmentService {
  constructor(private supabase: SupabaseClient<any>) {}

  private async requireCourseStaff(courseSectionId: string, userId: string) {
    const { data } = await this.supabase
      .from('course_lecturers')
      .select('id')
      .eq('course_section_id', courseSectionId)
      .eq('lecturer_id', userId)
      .maybeSingle();
    if (!data) throw new Error('Unauthorized: not assigned to this course section');
  }

  async assign(params: {
    universityId: string;
    courseSectionId: string;
    studentId: string;
    dueOn?: string | null;
    assignedBy: string;
    renewsCertificateId?: string | null;
  }) {
    await this.requireCourseStaff(params.courseSectionId, params.assignedBy);

    // Assigning implies access: a deadline the learner cannot open is useless.
    const { error: enrollError } = await this.supabase.from('course_enrollments').upsert(
      {
        university_id: params.universityId,
        course_section_id: params.courseSectionId,
        student_id: params.studentId,
        status: 'active',
      },
      { onConflict: 'course_section_id,student_id' },
    );
    if (enrollError) throw enrollError;

    const { data, error } = await this.supabase
      .from('training_assignments')
      .upsert(
        {
          university_id: params.universityId,
          course_section_id: params.courseSectionId,
          student_id: params.studentId,
          due_on: params.dueOn ?? null,
          assigned_by: params.assignedBy,
          renews_certificate_id: params.renewsCertificateId ?? null,
          cancelled_at: null,
        },
        { onConflict: 'course_section_id,student_id' },
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /** Assigns every active member of a department. Returns what it created. */
  async assignTeam(params: {
    universityId: string;
    courseSectionId: string;
    departmentId: string;
    dueOn?: string | null;
    assignedBy: string;
  }) {
    await this.requireCourseStaff(params.courseSectionId, params.assignedBy);

    const { data: members } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('university_id', params.universityId)
      .eq('department_id', params.departmentId)
      .eq('role', 'student');

    const assigned = [];
    for (const member of members || []) {
      assigned.push(
        await this.assign({
          universityId: params.universityId,
          courseSectionId: params.courseSectionId,
          studentId: member.id,
          dueOn: params.dueOn,
          assignedBy: params.assignedBy,
        }),
      );
    }
    return assigned;
  }

  async cancel(assignmentId: string, userId: string) {
    const { data: assignment, error: readError } = await this.supabase
      .from('training_assignments')
      .select('id, course_section_id')
      .eq('id', assignmentId)
      .single();
    if (readError) throw readError;

    await this.requireCourseStaff(assignment.course_section_id, userId);

    const { error } = await this.supabase
      .from('training_assignments')
      .update({ cancelled_at: new Date().toISOString() })
      .eq('id', assignmentId);
    if (error) throw error;

    return { cancelled: true };
  }

  async listForStudent(studentId: string) {
    const { data, error } = await this.supabase
      .from('training_assignments')
      .select('id,course_section_id,due_on,assigned_at,completed_at,cancelled_at,course_sections(name,courses(title,code))')
      .eq('student_id', studentId)
      .order('due_on', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async listForSection(courseSectionId: string) {
    const { data, error } = await this.supabase
      .from('training_assignments')
      .select('id,student_id,due_on,assigned_at,completed_at,cancelled_at,profiles(first_name,last_name,email)')
      .eq('course_section_id', courseSectionId)
      .order('due_on', { ascending: true });
    if (error) throw error;
    return data || [];
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/training-assignment.test.ts`
Expected: PASS, 7 tests

- [ ] **Step 6: Run the full suite and commit**

Run: `npm run verify` (expect exit 0), then:

```bash
git add supabase/migrations/038_training_assignments.sql lib/services/training-assignment.service.ts tests/training-assignment.test.ts && git commit -m "feat: assign compulsory training with a due date"
```

---

### Task 4: Certificates that expire, and assignments that close themselves

A certificate that never lapses answers the wrong question. Compliance asks *is it still valid*, so validity has to be a property of the certificate, and issuing one has to close the assignment that demanded it.

**Files:**
- Create: `supabase/migrations/039_certificate_validity.sql`
- Modify: `lib/services/certificate.service.ts`
- Modify: `app/certificates/[serial]/page.tsx`
- Modify: `tests/certificates.test.ts` (append)

**Interfaces:**
- Consumes: `TrainingAssignmentService` from Task 3
- Produces: `certificates.expires_at`, `courses.valid_for_months`
- Produces: `verify()` result gains `status: 'valid' | 'revoked' | 'expired'`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/039_certificate_validity.sql
-- Training that must be repeated needs a certificate that lapses. NULL means
-- the certificate never expires, which is the existing behaviour.

ALTER TABLE courses ADD COLUMN IF NOT EXISTS valid_for_months SMALLINT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

DO $BODY$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'courses_valid_for_months_range') THEN
    ALTER TABLE courses
      ADD CONSTRAINT courses_valid_for_months_range
      CHECK (valid_for_months IS NULL OR valid_for_months BETWEEN 1 AND 120);
  END IF;
END;
$BODY$;

CREATE INDEX IF NOT EXISTS certificates_expiring_idx
  ON certificates (university_id, expires_at)
  WHERE revoked_at IS NULL AND expires_at IS NOT NULL;
```

- [ ] **Step 2: Write the failing test**

Append to `tests/certificates.test.ts`:

```typescript
describe('certificate validity', () => {
  it('leaves expiry unset when the course never lapses', async () => {
    const { client, inserted } = stub();

    await new CertificateService(client).issue({
      universityId: 'uni1', courseSectionId: 'sec1', studentId: 'stu1', issuedBy: 'lec1',
    });

    expect(inserted.certificates[0].expires_at).toBeNull();
  });

  it('dates expiry from the validity period on the course', async () => {
    const { client, inserted } = stub({ validForMonths: 12 });

    await new CertificateService(client).issue({
      universityId: 'uni1', courseSectionId: 'sec1', studentId: 'stu1', issuedBy: 'lec1',
      now: new Date('2026-08-18T00:00:00.000Z'),
    });

    expect(inserted.certificates[0].expires_at).toBe('2027-08-18T00:00:00.000Z');
  });

  it('reports an expired certificate as expired, not valid', async () => {
    const { client } = createSupabaseStub({
      certificates: [{
        serial: 'ABCD-EFGH-JKLM', issued_at: '2025-01-01T00:00:00Z',
        expires_at: '2026-01-01T00:00:00Z', revoked_at: null,
        lessons_completed: 2, lessons_total: 2, final_score: 90, snapshot: {},
      }],
    });

    const result = await new CertificateService(client).verify('ABCD-EFGH-JKLM', new Date('2026-08-18T00:00:00Z'));

    expect(result.found).toBe(true);
    expect(result.status).toBe('expired');
    expect(result.valid).toBe(false);
  });

  it('reports revoked ahead of expired when both are true', async () => {
    const { client } = createSupabaseStub({
      certificates: [{
        serial: 'ABCD-EFGH-JKLM', issued_at: '2025-01-01T00:00:00Z',
        expires_at: '2026-01-01T00:00:00Z', revoked_at: '2025-06-01T00:00:00Z',
        revoked_reason: 'Issued in error', lessons_completed: 2, lessons_total: 2, final_score: 90, snapshot: {},
      }],
    });

    const result = await new CertificateService(client).verify('ABCD-EFGH-JKLM', new Date('2026-08-18T00:00:00Z'));

    expect(result.status).toBe('revoked');
  });
});
```

The existing `stub()` helper in that file gains a `validForMonths` option, written onto the nested `courses` fixture as `valid_for_months`.

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run tests/certificates.test.ts`
Expected: FAIL — `expires_at` is undefined and `verify` has no `status`

- [ ] **Step 4: Write the implementation**

In `lib/services/certificate.service.ts`:

- `evaluate()` also selects `valid_for_months` from the joined course.
- `issue()` accepts an optional `now: Date` (defaulting to `new Date()`), and computes:

```typescript
const validForMonths: number | null = course?.valid_for_months ?? null;
const issuedAt = params.now ?? new Date();
const expiresAt = validForMonths
  ? new Date(Date.UTC(
      issuedAt.getUTCFullYear(),
      issuedAt.getUTCMonth() + validForMonths,
      issuedAt.getUTCDate(),
      issuedAt.getUTCHours(),
      issuedAt.getUTCMinutes(),
      issuedAt.getUTCSeconds(),
      issuedAt.getUTCMilliseconds(),
    )).toISOString()
  : null;
```

writing `expires_at: expiresAt` into the insert.

- After a successful insert, close any open assignment for the same learner and cohort. Failure here must not undo the certificate:

```typescript
try {
  await this.supabase
    .from('training_assignments')
    .update({ completed_at: new Date().toISOString() })
    .eq('course_section_id', params.courseSectionId)
    .eq('student_id', params.studentId)
    .is('completed_at', null);
} catch {
  // An assignment left open is a reporting wrinkle; a lost certificate is not.
}
```

- `verify()` takes an optional `now: Date` and returns a `status`:

```typescript
const status = data.revoked_at
  ? 'revoked'
  : data.expires_at && new Date(data.expires_at).getTime() <= (now ?? new Date()).getTime()
    ? 'expired'
    : 'valid';

return { found: true as const, status, valid: status === 'valid', certificate: data };
```

- [ ] **Step 5: Show expiry on the public page**

`app/certificates/[serial]/page.tsx` switches on `result.status`. Expired renders amber with "This certificate expired on <date>" and the expiry date is added to the `<dl>` whenever `expires_at` is set.

- [ ] **Step 6: Run the suite and commit**

Run: `npx vitest run tests/certificates.test.ts` (expect PASS), then `npm run verify` (expect exit 0):

```bash
git add supabase/migrations/039_certificate_validity.sql lib/services/certificate.service.ts "app/certificates/[serial]/page.tsx" tests/certificates.test.ts && git commit -m "feat: expire certificates and close the assignment they satisfy"
```

---

### Task 5: Compliance reporting

The question a training manager actually asks: who is overdue, and whose certificate lapses next month.

**Files:**
- Create: `lib/services/compliance.service.ts`
- Create: `tests/compliance.test.ts`

**Interfaces:**
- Consumes: `deriveStatus`, `DUE_SOON_DAYS` from Task 3; `certificates.expires_at` from Task 4
- Produces: `ComplianceService.getOverview(universityId, now?)` returning `{ totals, overdue, dueSoon, expiring }`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/compliance.test.ts
import { describe, it, expect } from 'vitest';
import { createSupabaseStub } from './helpers/supabase-stub';
import { ComplianceService } from '@/lib/services/compliance.service';

const NOW = new Date('2026-08-18T00:00:00.000Z');

function stub() {
  return createSupabaseStub({
    training_assignments: [
      { id: 'a1', university_id: 'uni1', student_id: 'stu1', course_section_id: 'sec1', due_on: '2026-08-01', completed_at: null, cancelled_at: null, profiles: { first_name: 'Ada', last_name: 'Obi' }, course_sections: { name: 'Jan', courses: { title: 'Confidentiality', code: 'C-1' } } },
      { id: 'a2', university_id: 'uni1', student_id: 'stu2', course_section_id: 'sec1', due_on: '2026-08-25', completed_at: null, cancelled_at: null, profiles: { first_name: 'Bola', last_name: 'Eze' }, course_sections: { name: 'Jan', courses: { title: 'Confidentiality', code: 'C-1' } } },
      { id: 'a3', university_id: 'uni1', student_id: 'stu3', course_section_id: 'sec1', due_on: '2026-08-01', completed_at: '2026-07-20T00:00:00Z', cancelled_at: null, profiles: { first_name: 'Chi', last_name: 'Nwo' }, course_sections: { name: 'Jan', courses: { title: 'Confidentiality', code: 'C-1' } } },
      { id: 'a4', university_id: 'uni1', student_id: 'stu4', course_section_id: 'sec1', due_on: '2026-08-01', completed_at: null, cancelled_at: '2026-07-01T00:00:00Z', profiles: { first_name: 'Dee', last_name: 'Ola' }, course_sections: { name: 'Jan', courses: { title: 'Confidentiality', code: 'C-1' } } },
    ],
    certificates: [
      { id: 'c1', university_id: 'uni1', student_id: 'stu5', serial: 'AAAA-BBBB-CCCC', expires_at: '2026-09-10T00:00:00Z', revoked_at: null, snapshot: { studentName: 'Eve Ade', courseTitle: 'Confidentiality' } },
      { id: 'c2', university_id: 'uni1', student_id: 'stu6', serial: 'DDDD-EEEE-FFFF', expires_at: '2027-05-10T00:00:00Z', revoked_at: null, snapshot: { studentName: 'Fay Ojo', courseTitle: 'Confidentiality' } },
      { id: 'c3', university_id: 'uni1', student_id: 'stu7', serial: 'GGGG-HHHH-IIII', expires_at: '2026-09-01T00:00:00Z', revoked_at: '2026-08-01T00:00:00Z', snapshot: { studentName: 'Gus Ibe', courseTitle: 'Confidentiality' } },
    ],
  });
}

describe('ComplianceService.getOverview', () => {
  it('counts an assignment past its due date as overdue', async () => {
    const overview = await new ComplianceService(stub().client).getOverview('uni1', NOW);

    expect(overview.overdue.map((row) => row.studentId)).toEqual(['stu1']);
    expect(overview.totals.overdue).toBe(1);
  });

  it('separates due soon from overdue', async () => {
    const overview = await new ComplianceService(stub().client).getOverview('uni1', NOW);

    expect(overview.dueSoon.map((row) => row.studentId)).toEqual(['stu2']);
  });

  it('excludes completed and cancelled assignments from both', async () => {
    const overview = await new ComplianceService(stub().client).getOverview('uni1', NOW);

    const flagged = [...overview.overdue, ...overview.dueSoon].map((row) => row.studentId);
    expect(flagged).not.toContain('stu3');
    expect(flagged).not.toContain('stu4');
    expect(overview.totals.completed).toBe(1);
  });

  it('lists certificates expiring within thirty days, ignoring revoked ones', async () => {
    const overview = await new ComplianceService(stub().client).getOverview('uni1', NOW);

    expect(overview.expiring.map((row) => row.serial)).toEqual(['AAAA-BBBB-CCCC']);
  });

  it('reports a compliance rate over the assignments that still count', async () => {
    const overview = await new ComplianceService(stub().client).getOverview('uni1', NOW);

    // Three live assignments, one completed.
    expect(overview.totals.active).toBe(3);
    expect(overview.totals.compliantPercent).toBe(33);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/compliance.test.ts`
Expected: FAIL — `Cannot find module '@/lib/services/compliance.service'`

- [ ] **Step 3: Write the implementation**

```typescript
// lib/services/compliance.service.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { deriveStatus } from './training-assignment.service';

/** Days ahead to warn about a certificate that is about to lapse. */
export const EXPIRING_WINDOW_DAYS = 30;

export type ComplianceRow = {
  assignmentId: string;
  studentId: string;
  studentName: string;
  courseTitle: string;
  cohortName: string;
  dueOn: string | null;
  status: string;
};

export type ExpiringRow = {
  certificateId: string;
  studentId: string;
  studentName: string;
  courseTitle: string;
  serial: string;
  expiresAt: string;
};

const one = (value: any) => (Array.isArray(value) ? value[0] : value);

export class ComplianceService {
  constructor(private supabase: SupabaseClient<any>) {}

  async getOverview(universityId: string, now: Date = new Date()) {
    const { data: assignments, error: assignmentError } = await this.supabase
      .from('training_assignments')
      .select('id,student_id,course_section_id,due_on,completed_at,cancelled_at,profiles(first_name,last_name,email),course_sections(name,courses(title,code))')
      .eq('university_id', universityId);
    if (assignmentError) throw assignmentError;

    const rows: Array<ComplianceRow & { completed: boolean; cancelled: boolean }> = (assignments || []).map(
      (row: any) => {
        const profile = one(row.profiles);
        const section = one(row.course_sections);
        const course = one(section?.courses);
        return {
          assignmentId: row.id,
          studentId: row.student_id,
          studentName:
            [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.email || 'Learner',
          courseTitle: course?.title || 'Course',
          cohortName: section?.name || '',
          dueOn: row.due_on,
          status: deriveStatus(row, now),
          completed: Boolean(row.completed_at),
          cancelled: Boolean(row.cancelled_at),
        };
      },
    );

    const live = rows.filter((row) => !row.cancelled);
    const overdue = live.filter((row) => row.status === 'overdue');
    const dueSoon = live.filter((row) => row.status === 'due_soon');
    const completed = live.filter((row) => row.completed);

    const { data: certificates, error: certificateError } = await this.supabase
      .from('certificates')
      .select('id,student_id,serial,expires_at,revoked_at,snapshot')
      .eq('university_id', universityId);
    if (certificateError) throw certificateError;

    const horizon = now.getTime() + EXPIRING_WINDOW_DAYS * 86_400_000;
    const expiring: ExpiringRow[] = (certificates || [])
      .filter((row: any) => !row.revoked_at && row.expires_at)
      .filter((row: any) => {
        const expiresAt = new Date(row.expires_at).getTime();
        return expiresAt > now.getTime() && expiresAt <= horizon;
      })
      .map((row: any) => ({
        certificateId: row.id,
        studentId: row.student_id,
        studentName: row.snapshot?.studentName || 'Learner',
        courseTitle: row.snapshot?.courseTitle || 'Course',
        serial: row.serial,
        expiresAt: row.expires_at,
      }))
      .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));

    return {
      totals: {
        active: live.length,
        overdue: overdue.length,
        dueSoon: dueSoon.length,
        completed: completed.length,
        expiring: expiring.length,
        compliantPercent: live.length === 0 ? 100 : Math.round((completed.length / live.length) * 100),
      },
      overdue,
      dueSoon,
      expiring,
    };
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/compliance.test.ts`
Expected: PASS, 5 tests

- [ ] **Step 5: Run the suite and commit**

Run: `npm run verify` (expect exit 0), then:

```bash
git add lib/services/compliance.service.ts tests/compliance.test.ts && git commit -m "feat: report who is overdue and whose certificate lapses next"
```

---

### Task 6: The screens

Everything above is invisible until someone can assign training and see the result.

**Files:**
- Create: `app/actions/training.ts`
- Create: `components/training/AssignTrainingPanel.tsx`
- Create: `components/training/ComplianceTable.tsx`
- Create: `app/(dashboard)/admin/compliance/page.tsx`
- Create: `app/(dashboard)/student/training/page.tsx`
- Modify: `lib/navigation.ts`

**Interfaces:**
- Consumes: `TrainingAssignmentService`, `ComplianceService`
- Produces: `assignTrainingAction`, `assignTeamTrainingAction`, `cancelTrainingAssignmentAction`

- [ ] **Step 1: Write the actions**

`app/actions/training.ts` follows the shape of `app/actions/certificates.ts`: zod schema per action, `requireRole('lecturer')` for assignment actions, `{ success: true, ... }` or `{ error }`, and `revalidatePath` for `/admin/compliance` and `/student/training`.

```typescript
const assignSchema = z.object({
  courseSectionId: z.string().uuid(),
  studentId: z.string().uuid(),
  dueOn: z.string().date().optional().nullable(),
});

const assignTeamSchema = z.object({
  courseSectionId: z.string().uuid(),
  departmentId: z.string().uuid(),
  dueOn: z.string().date().optional().nullable(),
});

const cancelSchema = z.object({ assignmentId: z.string().uuid() });
```

Each notifies the learner through the service-role `NotificationService`, exactly as `issueCertificateAction` does, with title `Training assigned` and `linkUrl: '/student/training'`. A failed notification is swallowed and never undoes the assignment.

- [ ] **Step 2: Build the assign panel**

`components/training/AssignTrainingPanel.tsx` is a client component taking `{ sections, learners, teams }`. It offers a cohort select, a radio for *one person* or *a whole team*, the matching select, and a due date. On submit it calls the matching action and prepends the result to a local list. Follow the state and error conventions in `components/certificates/CertificateManager.tsx`.

- [ ] **Step 3: Build the compliance table**

`components/training/ComplianceTable.tsx` takes the `getOverview` result and renders four stat tiles (Active, Overdue, Due soon, Expiring) then three `DataTable`s: overdue, due soon, expiring. Overdue rows are amber; nothing red — an overdue training is a task, not an incident.

- [ ] **Step 4: Wire the pages**

`app/(dashboard)/admin/compliance/page.tsx` calls `requireRole('department_admin')`, reads the overview through `readOr`, and renders `ComplianceTable` plus `AssignTrainingPanel`. `app/(dashboard)/student/training/page.tsx` calls `requireRole('student')`, uses `listForStudent`, and shows each assignment with its due date and derived status, linking to the course.

Add to `lib/navigation.ts`:

```typescript
{ id: "a-compliance", label: "Compliance", href: "/admin/compliance", icon: FileCheck2, role: ["admin", "department_admin"] },
{ id: "s-training", label: "My Training", href: "/student/training", icon: Target, role: ["student"] },
```

- [ ] **Step 5: Verify in the browser**

Start the preview and confirm: assigning a learner appears immediately in Overdue or Due soon per the date chosen; the learner's own page shows the same assignment. Screenshot both.

- [ ] **Step 6: Run the suite and commit**

Run: `npm run verify` (expect exit 0 — `check:links` must see the two new routes, and `tests/page-completion.test.ts` requires every new action to have a UI caller):

```bash
git add app/actions/training.ts components/training "app/(dashboard)/admin/compliance" "app/(dashboard)/student/training" lib/navigation.ts && git commit -m "feat: assign training and read compliance from the dashboard"
```

---

### Task 7: Mode drives vocabulary, and the runbook says so

**Files:**
- Modify: `lib/ui/tenant-vocabulary.ts`
- Modify: `docs/RUNBOOK.md`
- Modify: `tests/tenant-mode.test.ts` (append)

- [ ] **Step 1: Write the failing test**

```typescript
describe('vocabulary follows mode', () => {
  it('defaults a training tenant to organisation wording', async () => {
    const { client } = createSupabaseStub({
      universities: [{ id: 'uni1', mode: 'training' }],
      university_settings: [],
    });

    expect(await getTenantVocabulary(client, 'uni1')).toBe('organization');
  });

  it('lets an explicit setting override the mode default', async () => {
    const { client } = createSupabaseStub({
      universities: [{ id: 'uni1', mode: 'training' }],
      university_settings: [{ university_id: 'uni1', settings: { vocabulary: 'academic' } }],
    });

    expect(await getTenantVocabulary(client, 'uni1')).toBe('academic');
  });
});
```

- [ ] **Step 2: Implement**

`getTenantVocabulary` reads the explicit setting first; when unset it calls `getTenantMode` and returns `'organization'` for a training tenant, `'academic'` otherwise. The vocabulary layer stops being a standalone cosmetic switch and becomes a consequence of what the tenant is.

- [ ] **Step 3: Document**

Add a "Training tenants" section to `docs/RUNBOOK.md` covering: creating a school in training mode, that no faculty or semester is created, how cohorts use their own dates, assigning training with a due date, setting `valid_for_months` for recertification, and reading `/admin/compliance`. Correct the root-domain example in the existing wildcard section from `sulva.com` to `lms.sulvatech.com`.

- [ ] **Step 4: Run the suite and commit**

```bash
git add lib/ui/tenant-vocabulary.ts docs/RUNBOOK.md tests/tenant-mode.test.ts && git commit -m "feat: derive tenant vocabulary from tenant mode"
```

---

## Deferred, deliberately

- **Self-enrolment.** Still invite-only. Assignment covers the compulsory case, which is the one a firm has; open catalogues can come later.
- **Per-lesson due dates.** Deadlines are per assignment. Splitting them per lesson needs a scheduling model that nothing yet asks for.
- **Automated renewal.** Task 4 records expiry and Task 5 surfaces it; nothing yet auto-creates the renewal assignment. That wants a scheduled job, and belongs with the cron work, not here.
- **Vocabulary coverage.** Only navigation and role badges follow the tenant vocabulary. Individual page headings still read academically.
