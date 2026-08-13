import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('seed contract', () => {
  it('does not reference removed prototype schema names', () => {
    const seed = fs.readFileSync(path.join(process.cwd(), 'supabase', 'seed.sql'), 'utf8');

    expect(seed).not.toContain('course_registration_windows');
    expect(seed).not.toContain('student_levels');
    expect(seed).not.toContain('provider_meeting_id');
    expect(seed).not.toContain('host_id');
    expect(seed).not.toContain('"order"');
  });

  it('builds a complete demo course the demo logins can exercise', () => {
    const script = fs.readFileSync(path.join(process.cwd(), 'scripts', 'comprehensive-seed.ts'), 'utf8');

    // Each table below backs a flow a reviewer will click through after seeding.
    for (const table of [
      'semesters',
      'faculties',
      'departments',
      'programs',
      'courses',
      'course_sections',
      'course_lecturers',
      'course_enrollments',
      'course_modules',
      'lessons',
      'assignments',
      'quizzes',
      'quiz_questions',
      'quiz_options',
      'announcements',
      'discussions',
      'discussion_replies',
    ]) {
      expect(script, `seed script never touches ${table}`).toContain(`'${table}'`);
    }
  });
});
