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
      { id: 'stu1', university_id: 'uni1', department_id: 'dep1', role: 'student', first_name: 'Ada', last_name: 'Obi' },
      { id: 'stu2', university_id: 'uni1', department_id: 'dep1', role: 'student', first_name: 'Bola', last_name: 'Eze' },
      { id: 'lec1', university_id: 'uni1', department_id: 'dep1', role: 'lecturer', first_name: 'Ken', last_name: 'Udo' },
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

  it('treats the due date as ending at midnight, not starting at it', () => {
    // Due today is not yet overdue.
    expect(deriveStatus({ due_on: '2026-08-18', completed_at: null, cancelled_at: null }, NOW)).toBe('due_soon');
  });
});

describe('TrainingAssignmentService.assign', () => {
  it('refuses a trainer who does not run the cohort', async () => {
    const { client } = createSupabaseStub({ course_lecturers: [] });

    await expect(
      new TrainingAssignmentService(client).assign({
        universityId: 'uni1', courseSectionId: 'sec1', studentId: 'stu1',
        dueOn: '2026-09-01', assignedBy: 'someone-else',
      }),
    ).rejects.toThrow('Unauthorized: not assigned to this course section');
  });

  it('enrolls the learner so assigned training is actually reachable', async () => {
    const { client, inserted } = stub();

    await new TrainingAssignmentService(client).assign({
      universityId: 'uni1', courseSectionId: 'sec1', studentId: 'stu1',
      dueOn: '2026-09-01', assignedBy: 'lec1',
    });

    expect(inserted.training_assignments).toHaveLength(1);
    expect(inserted.training_assignments[0].due_on).toBe('2026-09-01');
    // An assignment the learner cannot open is a deadline with no door.
    expect(inserted.course_enrollments[0]).toMatchObject({
      course_section_id: 'sec1', student_id: 'stu1', status: 'active',
    });
  });

  it('reassigning clears a previous cancellation rather than duplicating', async () => {
    const { client, upsertConflicts } = stub();

    await new TrainingAssignmentService(client).assign({
      universityId: 'uni1', courseSectionId: 'sec1', studentId: 'stu1', assignedBy: 'lec1',
    });

    expect(upsertConflicts.training_assignments).toEqual(['course_section_id', 'student_id']);
  });
});

describe('TrainingAssignmentService.assignTeam', () => {
  it('assigns every learner on the team and nobody else', async () => {
    const { client, inserted } = stub();

    const assigned = await new TrainingAssignmentService(client).assignTeam({
      universityId: 'uni1', courseSectionId: 'sec1', departmentId: 'dep1',
      dueOn: '2026-09-01', assignedBy: 'lec1',
    });

    // The lecturer shares the department but is not a learner.
    expect(assigned).toHaveLength(2);
    expect(inserted.training_assignments.map((row: any) => row.student_id).sort()).toEqual(['stu1', 'stu2']);
  });
});
