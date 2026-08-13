import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const IGNORED_DIRECTORIES = new Set(['node_modules', '.next', '.git', 'coverage', 'dist', 'out']);

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (IGNORED_DIRECTORIES.has(entry.name)) return [];
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });

describe('committed secrets', () => {
  it('does not contain a hardcoded supabase jwt', () => {
    // Supabase anon and service-role keys are JWTs whose header always encodes
    // {"alg":"HS256","typ":"JWT"} to this prefix. A service-role key in the
    // repository bypasses RLS entirely for anyone who reads it.
    const jwtPrefix = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

    const offenders = walk(process.cwd())
      .filter((file) => /\.(ts|tsx|js|jsx|mjs|cjs|json|md|sql|ya?ml)$/.test(file))
      .filter((file) => path.basename(file) !== 'package-lock.json')
      .filter((file) => path.basename(file) !== 'secrets.test.ts')
      .filter((file) => fs.readFileSync(file, 'utf8').includes(jwtPrefix))
      .map((file) => path.relative(process.cwd(), file));

    expect(offenders).toEqual([]);
  });

  it('keeps maintenance scripts reading credentials from the environment', () => {
    const scripts = walk(path.join(process.cwd(), 'scripts')).filter((file) => file.endsWith('.ts'));

    for (const file of scripts) {
      const contents = fs.readFileSync(file, 'utf8');
      expect(contents, `${path.relative(process.cwd(), file)} hardcodes a Supabase URL`).not.toMatch(
        /const supabase(Url|_url)\s*=\s*["'`]https:\/\//,
      );
    }
  });
});
