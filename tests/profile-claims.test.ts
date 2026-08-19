import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const migration = fs.readFileSync(
  path.join(process.cwd(), 'supabase', 'migrations', '040_profile_claims.sql'),
  'utf8',
);

describe('profiles policy recursion', () => {
  it('reads the tenant and role from a table profiles policies do not guard', () => {
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS profile_claims');
    expect(migration).toMatch(/current_university_id\(\)[\s\S]*?FROM profile_claims/);
    expect(migration).toMatch(/current_user_role\(\)[\s\S]*?FROM profile_claims/);
  });

  it('never lets the claim lookup read profiles again', () => {
    // The whole point: nothing in this migration's function bodies may select
    // from profiles, or the recursion comes straight back.
    const functionBodies = migration.split('CREATE OR REPLACE FUNCTION').slice(1);
    const readers = functionBodies.filter((body) => /SELECT[\s\S]*?FROM profiles\b/.test(body));

    expect(readers).toEqual([]);
  });

  it('keeps the claim policy free of any other table', () => {
    const policy = migration.slice(migration.indexOf('CREATE POLICY "Users read own claim"'));
    const using = policy.slice(0, policy.indexOf(';'));

    expect(using).toContain('user_id = auth.uid()');
    expect(using).not.toMatch(/\bprofiles\b/);
  });

  it('keeps the claim in step with the profile by trigger, not by application code', () => {
    expect(migration).toContain('sync_profile_claim_trigger');
    expect(migration).toContain('AFTER INSERT OR UPDATE OF university_id, role ON profiles');
    expect(migration).toContain('SECURITY DEFINER SET search_path = public');
  });

  it('backfills existing profiles so nobody is locked out on deploy', () => {
    expect(migration).toMatch(/INSERT INTO profile_claims[\s\S]*?SELECT id, university_id, role FROM profiles/);
  });

  it('leaves the API no way to write a claim', () => {
    expect(migration).not.toMatch(/CREATE POLICY[\s\S]*?ON profile_claims[\s\S]*?FOR (INSERT|UPDATE|DELETE)/);
    expect(migration).toContain('GRANT SELECT ON public.profile_claims TO authenticated');
  });
});
