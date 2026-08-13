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
});
