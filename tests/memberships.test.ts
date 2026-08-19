import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), 'supabase', 'migrations', file), 'utf8');

const migration = read('043_memberships.sql');

/**
 * Every dollar-quoted function body in the migration, keyed by function name.
 * Splitting on the CREATE line alone would sweep up the plain SQL that follows
 * the last statement of a function, which is not part of any body.
 */
const functionBodies = new Map<string, string>(
  [...migration.matchAll(/CREATE OR REPLACE FUNCTION\s+(\w+)[\s\S]*?AS \$\$([\s\S]*?)\$\$/g)].map(
    (match) => [match[1], match[2]],
  ),
);

describe('membership schema', () => {
  it('keys a membership by the pair, not by the account', () => {
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS memberships');
    expect(migration).toMatch(/PRIMARY KEY \(user_id, university_id\)/);
  });

  it('carries the per-organisation facts that used to sit on profiles', () => {
    expect(migration).toMatch(/student_id\s+TEXT/);
    expect(migration).toMatch(/department_id\s+UUID REFERENCES departments\(id\)/);
    expect(migration).toMatch(/UNIQUE \(university_id, student_id\)/);
  });

  it('lets one organisation deactivate someone without touching the account', () => {
    expect(migration).toMatch(/deleted_at\s+TIMESTAMPTZ/);
  });

  it('keeps the platform role out of the tenant table', () => {
    expect(migration).toMatch(/CHECK \(role <> 'super_admin'\)/);
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS platform_admins');
  });

  it('backfills every existing profile so nobody is locked out on deploy', () => {
    expect(migration).toMatch(
      /INSERT INTO memberships[\s\S]*?SELECT id, university_id, role, student_id, deleted_at[\s\S]*?FROM profiles/,
    );
    expect(migration).toMatch(
      /INSERT INTO platform_admins[\s\S]*?FROM profiles WHERE role = 'super_admin'/,
    );
  });
});

describe('membership claims mirror', () => {
  it('exists, and is kept in step by trigger rather than by application code', () => {
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS membership_claims');
    expect(migration).toContain('sync_membership_claim_trigger');
    expect(migration).toContain('ON memberships');
  });

  it('is readable only as the caller, so nothing it does can re-enter a policy', () => {
    const policy = migration.slice(
      migration.indexOf('CREATE POLICY "Users read own membership claims"'),
    );
    const using = policy.slice(0, policy.indexOf(';'));

    expect(using).toContain('user_id = auth.uid()');
    expect(using).not.toMatch(/\bmemberships\b/);
    expect(using).not.toMatch(/\bprofiles\b/);
  });

  it('leaves the API no way to write a claim or a membership', () => {
    expect(migration).not.toMatch(
      /CREATE POLICY[\s\S]{0,200}?ON (membership_claims|memberships|platform_admins)[\s\S]{0,200}?FOR (INSERT|UPDATE|DELETE)/,
    );
  });
});

describe('rls helpers', () => {
  it('never read profiles or memberships, which is what stops 42P17', () => {
    const offenders = [...functionBodies]
      .filter(([, body]) => /FROM\s+(public\.)?(profiles|memberships)\b/.test(body))
      .map(([name]) => name);

    expect(offenders).toEqual([]);
  });

  it('keep the three signatures every existing policy already calls', () => {
    expect(migration).toMatch(/FUNCTION in_same_tenant\(tenant_id UUID\) RETURNS BOOLEAN/);
    expect(migration).toMatch(/FUNCTION is_university_admin\(check_uni_id UUID\) RETURNS BOOLEAN/);
    expect(migration).toMatch(/FUNCTION is_super_admin\(\) RETURNS BOOLEAN/);
  });

  it('read platform administration from its own table', () => {
    expect(migration).toMatch(/is_super_admin\(\)[\s\S]*?FROM platform_admins/);
  });

  it('ask the mirror, which holds active memberships only', () => {
    // The mirror carries no deleted_at: the trigger removes a deactivated
    // membership from it, so every helper stays a plain EXISTS.
    expect(functionBodies.get('is_member_of')).toContain('FROM membership_claims');
    expect(functionBodies.get('role_in')).toContain('FROM membership_claims');
  });
});
