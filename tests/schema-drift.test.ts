import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  collectDeclaredObjects,
  isSelfReferencingPolicy,
  isSystemNamedConstraint,
  policyKey,
} from '@/lib/schema/declared-objects';

describe('collectDeclaredObjects', () => {
  it('records a policy against its table', () => {
    const declared = collectDeclaredObjects([
      'CREATE POLICY "Users read own claim" ON profile_claims FOR SELECT USING (user_id = auth.uid());',
    ]);

    expect(declared.policies.has(policyKey('profile_claims', 'Users read own claim'))).toBe(true);
  });

  it('forgets a policy a later migration drops', () => {
    const declared = collectDeclaredObjects([
      'CREATE POLICY "Super admin view all profiles" ON profiles FOR SELECT USING (true);',
      'DROP POLICY IF EXISTS "Super admin view all profiles" ON profiles;',
    ]);

    expect(declared.policies.size).toBe(0);
  });

  it('replays in order, so a dropped-then-recreated policy still counts', () => {
    const declared = collectDeclaredObjects([
      'CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (id = auth.uid());',
      'DROP POLICY IF EXISTS "Users view own profile" ON profiles;\nCREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (id = auth.uid());',
    ]);

    expect(declared.policies.has(policyKey('profiles', 'Users view own profile'))).toBe(true);
  });

  it('sees policies created inside a DO block', () => {
    const declared = collectDeclaredObjects([
      `DO $BODY$ BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Course staff view certificates') THEN
           CREATE POLICY "Course staff view certificates" ON certificates FOR SELECT USING (true);
         END IF;
       END; $BODY$;`,
    ]);

    expect(declared.policies.has(policyKey('certificates', 'Course staff view certificates'))).toBe(true);
  });

  it('tracks indexes and constraints through create and drop', () => {
    const declared = collectDeclaredObjects([
      'CREATE UNIQUE INDEX IF NOT EXISTS attendance_records_session_student_key ON attendance_records (session_id, student_id);',
      'ALTER TABLE courses ADD CONSTRAINT courses_pass_mark_range CHECK (pass_mark BETWEEN 0 AND 100);',
      'DROP INDEX IF EXISTS attendance_sessions_section_date_key;',
    ]);

    expect(declared.indexes.has('attendance_records_session_student_key')).toBe(true);
    expect(declared.indexes.has('attendance_sessions_section_date_key')).toBe(false);
    expect(declared.constraints.has('courses_pass_mark_range')).toBe(true);
  });
});

describe('isSystemNamedConstraint', () => {
  it('recognises the names Postgres gives inline table clauses', () => {
    expect(isSystemNamedConstraint('profiles', 'profiles_pkey')).toBe(true);
    expect(isSystemNamedConstraint('certificates', 'certificates_course_section_id_student_id_key')).toBe(true);
    expect(isSystemNamedConstraint('courses', 'courses_department_id_fkey')).toBe(true);
  });

  it('does not excuse a constraint someone named themselves', () => {
    expect(isSystemNamedConstraint('courses', 'courses_pass_mark_range')).toBe(false);
    expect(isSystemNamedConstraint('universities', 'universities_mode_values')).toBe(false);
  });
});

describe('isSelfReferencingPolicy', () => {
  it('catches the policy that took /admin/students down', () => {
    const using =
      "(EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = auth.uid()) AND (p.role = 'super_admin'::user_role))))";

    expect(isSelfReferencingPolicy('profiles', using)).toBe(true);
  });

  it('leaves a policy that reads a different table alone', () => {
    expect(isSelfReferencingPolicy('certificates', 'is_course_lecturer(course_section_id)')).toBe(false);
    expect(isSelfReferencingPolicy('grades', '(EXISTS ( SELECT 1 FROM grade_items gi))')).toBe(false);
  });

  it('is not fooled by a table whose name merely starts the same', () => {
    expect(isSelfReferencingPolicy('profiles', '(EXISTS ( SELECT 1 FROM profile_claims))')).toBe(false);
  });
});

describe('the repository declares what production should have', () => {
  it('no longer declares the recursive profiles policy', () => {
    const dir = path.join(process.cwd(), 'supabase', 'migrations');
    const declared = collectDeclaredObjects(
      fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
        .map((f) => fs.readFileSync(path.join(dir, f), 'utf8')),
    );

    expect(declared.policies.has(policyKey('profiles', 'Super admin view all profiles'))).toBe(false);
    expect(declared.policies.has(policyKey('profiles', 'Safe profile access'))).toBe(false);
    expect(declared.policies.has(policyKey('profiles', 'Super admins view every profile'))).toBe(true);
  });
});
