import { describe, it, expect } from 'vitest';
import { createSupabaseStub } from './helpers/supabase-stub';
import { GradeService } from '@/lib/services/grade.service';

function stub(options: { assigned: boolean; totalPoints: number; existingGradeItem?: boolean }) {
  return createSupabaseStub({
    assignment_submissions: [
      {
        id: 'sub1',
        student_id: 'stu1',
        assignment_id: 'a1',
        assignments: { course_section_id: 'sec1', total_points: options.totalPoints, title: 'Essay 1' },
      },
    ],
    course_lecturers: options.assigned ? [{ id: 'cl1', course_section_id: 'sec1', lecturer_id: 'lec1' }] : [],
    grade_items: options.existingGradeItem
      ? [{ id: 'gi1', assignment_id: 'a1', course_section_id: 'sec1' }]
      : [],
    grades: [],
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

    expect(updated.assignment_submissions[0]).toMatchObject({
      score: 88,
      feedback: 'Solid work',
      status: 'graded',
    });
  });

  it('returns the student and assignment so callers can notify', async () => {
    const { client } = stub({ assigned: true, totalPoints: 100 });
    const service = new GradeService(client);

    const result = await service.gradeSubmission('uni1', 'lec1', 'sub1', 70);

    expect(result.student_id).toBe('stu1');
    expect(result.assignment_id).toBe('a1');
    expect(result.assignment_title).toBe('Essay 1');
    expect(result.total_points).toBe(100);
  });

  it('creates one grade item per assignment', async () => {
    const { client, inserted } = stub({ assigned: true, totalPoints: 100 });
    const service = new GradeService(client);

    await service.gradeSubmission('uni1', 'lec1', 'sub1', 70);

    expect(inserted.grade_items).toHaveLength(1);
    expect(inserted.grade_items[0]).toMatchObject({ assignment_id: 'a1', name: 'Essay 1' });
  });

  it('reuses an existing grade item instead of creating a duplicate', async () => {
    const { client, inserted } = stub({ assigned: true, totalPoints: 100, existingGradeItem: true });
    const service = new GradeService(client);

    await service.gradeSubmission('uni1', 'lec1', 'sub1', 70);

    expect(inserted.grade_items).toBeUndefined();
  });
});
