import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createSupabaseStub } from './helpers/supabase-stub';
import { getTenantMode, isTrainingTenant } from '@/lib/tenant/mode';
import { courseSectionSchema as sectionSchema } from '@/lib/validation/admin';

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

describe('cohort sections', () => {
  const COURSE = '11111111-1111-4111-8111-111111111111';
  const SEMESTER = '22222222-2222-4222-8222-222222222222';

  it('accepts a cohort with dates and no semester', () => {
    const parsed = sectionSchema.safeParse({
      courseId: COURSE,
      name: 'January intake',
      startsOn: '2026-01-06',
      endsOn: '2026-02-06',
    });

    expect(parsed.success).toBe(true);
  });

  it('accepts an academic section with a semester and no dates', () => {
    const parsed = sectionSchema.safeParse({ courseId: COURSE, semesterId: SEMESTER, name: 'Group A' });

    expect(parsed.success).toBe(true);
  });

  it('rejects a section that is neither scheduled nor dated', () => {
    const parsed = sectionSchema.safeParse({ courseId: COURSE, name: 'Nowhere' });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toBe('Give the cohort a start date, or attach it to a term.');
    }
  });

  it('rejects a cohort that ends before it starts', () => {
    const parsed = sectionSchema.safeParse({
      courseId: COURSE,
      name: 'Backwards',
      startsOn: '2026-02-06',
      endsOn: '2026-01-06',
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toBe('The cohort cannot end before it starts.');
    }
  });
});
