import { describe, it, expect } from 'vitest';
import { createSupabaseStub } from './helpers/supabase-stub';
import { TrainingBuilderService, type TrainingInput } from '@/lib/services/training-builder.service';

function stub(courses: any[] = []) {
  return createSupabaseStub({
    courses,
    course_sections: [],
    course_lecturers: [{ id: 'cl0', course_section_id: 'stub-any', lecturer_id: 'owner1' }],
    course_modules: [],
    lessons: [],
    course_enrollments: [],
    training_assignments: [],
    // A person's team is a fact about their place in one organisation, so it
    // lives on the membership. profiles never had these columns.
    memberships: [
      { user_id: 'stu1', university_id: 'uni1', department_id: 'team1', role: 'student', deleted_at: null },
      { user_id: 'stu2', university_id: 'uni1', department_id: 'team1', role: 'student', deleted_at: null },
    ],
  });
}

const input = (overrides: Partial<TrainingInput> = {}): TrainingInput => ({
  name: 'Client Confidentiality',
  description: 'What every paralegal must know before touching a matter file.',
  material: [
    { title: 'Why it matters', kind: 'written', body: 'Read this first.' },
    { title: 'Walkthrough', kind: 'video', body: 'uni1/video/owner1/intro.mp4' },
    { title: 'Policy PDF', kind: 'document', body: 'uni1/docs/owner1/policy.pdf' },
  ],
  passMark: 80,
  validForMonths: 12,
  startsOn: '2026-09-01',
  dueOn: '2026-09-30',
  assignTo: {},
  publish: true,
  ...overrides,
});

describe('TrainingBuilderService.createTraining', () => {
  it('builds the course, cohort, module and lessons from one submission', async () => {
    const { client, inserted } = stub();

    const result = await new TrainingBuilderService(client).createTraining({
      universityId: 'uni1',
      ownerId: 'owner1',
      input: input(),
    });

    expect(inserted.courses).toHaveLength(1);
    expect(inserted.course_sections).toHaveLength(1);
    expect(inserted.course_modules).toHaveLength(1);
    expect(inserted.lessons).toHaveLength(3);
    expect(result.lessons).toBe(3);
  });

  it('creates a training that needs no department and no term', async () => {
    const { client, inserted } = stub();

    await new TrainingBuilderService(client).createTraining({
      universityId: 'uni1', ownerId: 'owner1', input: input(),
    });

    expect(inserted.courses[0].department_id).toBeNull();
    expect(inserted.course_sections[0].semester_id).toBeNull();
    expect(inserted.course_sections[0].starts_on).toBe('2026-09-01');
  });

  it('keeps the material in the order it was written', async () => {
    const { client, inserted } = stub();

    await new TrainingBuilderService(client).createTraining({
      universityId: 'uni1', ownerId: 'owner1', input: input(),
    });

    expect(inserted.lessons.map((l: any) => [l.title, l.order_index, l.resource_type])).toEqual([
      ['Why it matters', 0, 'document'],
      ['Walkthrough', 1, 'video'],
      ['Policy PDF', 2, 'document'],
    ]);
  });

  it('makes the builder the trainer, so they can mark and certify', async () => {
    const { client, inserted } = stub();

    await new TrainingBuilderService(client).createTraining({
      universityId: 'uni1', ownerId: 'owner1', input: input(),
    });

    expect(inserted.course_lecturers[0]).toMatchObject({ lecturer_id: 'owner1', is_primary: true });
  });

  it('carries the pass mark and the repeat period onto the training', async () => {
    const { client, inserted } = stub();

    await new TrainingBuilderService(client).createTraining({
      universityId: 'uni1', ownerId: 'owner1', input: input(),
    });

    expect(inserted.courses[0]).toMatchObject({ pass_mark: 80, valid_for_months: 12 });
  });

  it('never publishes before the material exists', async () => {
    const { client, inserted, updated } = stub();

    await new TrainingBuilderService(client).createTraining({
      universityId: 'uni1', ownerId: 'owner1', input: input(),
    });

    // Inserted as a draft, promoted only once the lessons are in, so a learner
    // can never open a training that has nothing in it yet.
    expect(inserted.courses[0].status).toBe('draft');
    expect(updated.courses[0].status).toBe('published');
    expect(inserted.lessons).toHaveLength(3);
  });

  it('leaves a draft unpublished and its lessons hidden', async () => {
    const { client, inserted, updated } = stub();

    await new TrainingBuilderService(client).createTraining({
      universityId: 'uni1', ownerId: 'owner1', input: input({ publish: false }),
    });

    expect(inserted.courses[0].status).toBe('draft');
    expect(updated.courses).toBeUndefined();
    expect(inserted.lessons.every((l: any) => l.is_published === false)).toBe(true);
  });

  it('assigns the people and teams chosen, with the deadline', async () => {
    const { client, inserted } = stub();

    const result = await new TrainingBuilderService(client).createTraining({
      universityId: 'uni1',
      ownerId: 'owner1',
      input: input({ assignTo: { learnerIds: ['stu1'], teamIds: ['team1'] } }),
    });

    // stu1 directly, plus both members of team1; the upsert keys on
    // (section, student) so stu1 is not assigned twice.
    expect(result.assigned).toBe(3);
    expect(inserted.training_assignments.every((a: any) => a.due_on === '2026-09-30')).toBe(true);
  });

  it('does not collide when the same training name is used twice', async () => {
    const { client, inserted } = stub([{ id: 'c0', university_id: 'uni1', code: 'CLIENT-CONFI' }]);

    await new TrainingBuilderService(client).createTraining({
      universityId: 'uni1', ownerId: 'owner1', input: input(),
    });

    expect(inserted.courses[0].code).toBe('CLIENT-CONFI-2');
  });
});
