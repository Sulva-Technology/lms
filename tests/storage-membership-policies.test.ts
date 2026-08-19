import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
const read = (file: string) => fs.readFileSync(path.join(migrationsDir, file), 'utf8');

const migration = read('044_storage_membership_policies.sql');

/** The migration without its comments, which name the helpers being retired. */
const statements = migration
  .split('\n')
  .filter((line) => !line.trimStart().startsWith('--'))
  .join('\n');

describe('storage policies under membership', () => {
  it('scopes every bucket to a membership rather than to one tenant column', () => {
    expect(statements).not.toContain('current_university_id()');
    expect(statements).not.toContain('current_user_is_staff()');
    expect(statements).toContain('is_member_of(public.storage_tenant_id(name))');
  });

  it('makes staffness a fact about one organisation', () => {
    expect(migration).toContain('is_staff_in(public.storage_tenant_id(name))');
  });

  it('replaces every policy migration 020 created, leaving none behind', () => {
    const created = [
      ...read('020_storage_tenant_policies.sql').matchAll(
        /CREATE POLICY "([^"]+)" ON storage\.objects/g,
      ),
    ].map((match) => match[1]);

    expect(created.length).toBeGreaterThan(0);

    for (const name of created) {
      expect(migration).toContain(`DROP POLICY IF EXISTS "${name}" ON storage.objects`);
    }
  });

  it('leaves the key convention alone, so no stored object has to move', () => {
    expect(migration).not.toContain('CREATE OR REPLACE FUNCTION public.storage_tenant_id');
  });
});
