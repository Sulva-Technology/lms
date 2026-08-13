import { describe, it, expect } from 'vitest';
import { createSupabaseStub } from './helpers/supabase-stub';
import { SubmissionService } from '@/lib/services/submission.service';

const future = new Date(Date.now() + 86_400_000).toISOString();
const past = new Date(Date.now() - 86_400_000).toISOString();

function stubFor(assignment: Record<string, any>, enrolled = true) {
  return createSupabaseStub({
    assignments: [
      {
        id: 'a1',
        course_section_id: 'sec1',
        is_published: true,
        max_resubmissions: 2,
        allow_late_submissions: false,
        ...assignment,
      },
    ],
    course_enrollments: enrolled
      ? [{ id: 'e1', course_section_id: 'sec1', student_id: 'stu1', status: 'active' }]
      : [],
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

  it('returns the course section so callers can notify lecturers', async () => {
    const { client } = stubFor({ due_date: future });
    const service = new SubmissionService(client);

    const result = await service.submitAssignment('uni1', 'stu1', 'a1', 'Answer', []);
    expect(result.course_section_id).toBe('sec1');
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

  it('rejects once the resubmission limit is reached', async () => {
    const stub = stubFor({ due_date: future, max_resubmissions: 1 });
    stub.tables.assignment_submissions.push({
      id: 'sub1',
      assignment_id: 'a1',
      student_id: 'stu1',
      attempt_count: 1,
    });
    const service = new SubmissionService(stub.client);

    await expect(service.submitAssignment('uni1', 'stu1', 'a1', 'Again', [])).rejects.toThrow(
      'Maximum number of resubmissions reached.',
    );
  });
});
