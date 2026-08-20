import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const read = (...segments: string[]) =>
  fs.readFileSync(path.join(process.cwd(), ...segments), 'utf8');

describe('the guided training form', () => {
  const builder = read('components', 'training', 'TrainingBuilder.tsx');

  it('asks in plain language, not in schema terms', () => {
    expect(builder).toContain('What is this training?');
    expect(builder).toContain('What will they work through?');
    expect(builder).toContain('Who has to do it?');
    expect(builder).toContain('When, and how often?');

    // The words the database uses must never reach the person filling this in.
    for (const jargon of ['Semester', 'Faculty', 'Department', 'Course section', 'Cohort id']) {
      expect(builder).not.toContain(jargon);
    }
  });

  it('offers all four kinds of material', () => {
    expect(builder).toContain('Written lesson');
    expect(builder).toContain('Video');
    expect(builder).toContain('Document');
    expect(builder).toContain('before they are certified');
  });

  it('treats repeating as a checkbox rather than a column name', () => {
    expect(builder).toContain('This has to be repeated');
    expect(builder).toContain('Certificate valid for (months)');
  });

  it('surfaces a failure instead of navigating away from it', () => {
    expect(builder).toContain('Could not create this training.');
    // The action returns a union; the success branch must be narrowed, not assumed.
    expect(builder).toContain('"success" in result');
  });
});

describe('the training hub', () => {
  const hub = read('app', '(dashboard)', 'admin', 'trainings', 'page.tsx');

  it('answers assigned, finished and overdue at a glance', () => {
    expect(hub).toContain('assigned');
    expect(hub).toContain('finished');
    expect(hub).toContain('overdue');
  });

  it('does not count a withdrawn assignment against anyone', () => {
    expect(hub).toContain('!a.cancelled_at');
  });
});

describe('the people page', () => {
  const people = read('app', '(dashboard)', 'admin', 'people', 'page.tsx');

  it('names roles the way an organisation says them', () => {
    expect(people).toContain('Owner');
    expect(people).toContain('Team lead');
    expect(people).toContain('Trainer');
    expect(people).toContain('Learner');
  });

  it('reads membership rather than the columns that were dropped', () => {
    expect(people).toContain("from(\"memberships\")");
    expect(people).not.toMatch(/profiles[\s\S]{0,40}\.eq\("role"/);
  });
});
