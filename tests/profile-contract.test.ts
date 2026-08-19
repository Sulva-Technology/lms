import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const migration = fs.readFileSync(
  path.join(process.cwd(), 'supabase', 'migrations', '045_drop_profile_tenant_columns.sql'),
  'utf8',
);

describe('retiring the single-tenant profile', () => {
  it('replaces both policies that name the columns being dropped', () => {
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Users view profiles in same university" ON profiles',
    );
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Admins manage university profiles" ON profiles',
    );
    expect(migration).toContain(
      'CREATE POLICY "Users view profiles sharing an organisation" ON profiles',
    );
    expect(migration).toContain(
      'CREATE POLICY "Admins manage organisation profiles" ON profiles',
    );
  });

  it('keeps the replacements off profiles, so neither can recurse', () => {
    const policies = migration.split('CREATE POLICY').slice(1);
    const onProfiles = policies.filter((body) => /ON profiles/.test(body));

    expect(onProfiles.length).toBe(2);
    for (const body of onProfiles) {
      const clause = body.slice(0, body.indexOf(';'));
      expect(clause).toMatch(/FROM memberships/);
      expect(clause).not.toMatch(/FROM\s+profiles\b/);
    }
  });

  it('drops the columns the single-tenant model needed', () => {
    expect(migration).toContain('ALTER TABLE profiles DROP COLUMN IF EXISTS university_id');
    expect(migration).toContain('ALTER TABLE profiles DROP COLUMN IF EXISTS role');
    expect(migration).toContain('ALTER TABLE profiles DROP COLUMN IF EXISTS student_id');
  });

  it('retires profile_claims, which membership_claims supersedes', () => {
    expect(migration).toContain('DROP TRIGGER IF EXISTS sync_profile_claim_trigger ON profiles');
    expect(migration).toContain('DROP FUNCTION IF EXISTS sync_profile_claim()');
    expect(migration).toContain('DROP TABLE IF EXISTS profile_claims');
  });

  it('removes the helpers that assumed one organisation per account', () => {
    expect(migration).toContain('DROP FUNCTION IF EXISTS current_university_id()');
    expect(migration).toContain('DROP FUNCTION IF EXISTS current_user_role()');
    expect(migration).toContain('DROP FUNCTION IF EXISTS current_user_is_staff()');
  });
});
