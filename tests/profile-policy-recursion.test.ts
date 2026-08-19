import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
const sql = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .map((file) => fs.readFileSync(path.join(migrationsDir, file), 'utf8'))
  .join('\n');

describe('profiles policies never read profiles', () => {
  it('drops the hand-added policy that recursed', () => {
    expect(sql).toContain('DROP POLICY IF EXISTS "Super admin view all profiles" ON profiles');
  });

  it('keeps super admin access through a helper rather than a subquery', () => {
    const policy = sql.slice(sql.indexOf('CREATE POLICY "Super admins view every profile"'));
    const statement = policy.slice(0, policy.indexOf(';'));

    expect(statement).toContain('is_super_admin()');
    expect(statement).not.toMatch(/SELECT[\s\S]*FROM profiles/i);
  });

  it('has no policy on profiles whose USING clause selects from profiles', () => {
    // 42P17: a policy that has to read the table it guards can never finish.
    const offenders = [...sql.matchAll(/CREATE POLICY\s+"([^"]+)"\s+ON\s+profiles\b([\s\S]*?);/gi)]
      .filter(([, , body]) => /SELECT[\s\S]*?\bFROM\s+profiles\b/i.test(body))
      .map(([, name]) => name);

    expect(offenders).toEqual([]);
  });
});
