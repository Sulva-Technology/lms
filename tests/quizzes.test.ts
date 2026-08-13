import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Quizzes validation', () => {
  it('uses the production quiz attempt status contract', () => {
    const action = fs.readFileSync(path.join(process.cwd(), 'app', 'actions', 'quizzes.ts'), 'utf8');

    expect(action).toContain('status: "completed"');
    expect(action).not.toContain('status: "submitted"');
  });

  it('adds production quiz management fields and indexes', () => {
    const migration = fs.readFileSync(path.join(process.cwd(), 'supabase', 'migrations', '015_production_page_completion.sql'), 'utf8');

    expect(migration).toContain('ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS is_published');
    expect(migration).toContain('quizzes_section_published_idx');
    expect(migration).toContain('quiz_attempts_quiz_student_status_idx');
  });
});
