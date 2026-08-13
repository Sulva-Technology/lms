import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

const ignoredTables = new Set([
  // Supabase-managed schemas are handled by Supabase itself. This audit covers
  // project-owned public tables in migration files.
  'schema_migrations',
]);

const normalizeTableName = (raw: string): string => {
  return raw
    .replace(/"/g, '')
    .split('.')
    .at(-1)!
    .trim()
    .toLowerCase();
};

const collectMatches = (sql: string, pattern: RegExp): Set<string> => {
  const matches = new Set<string>();
  for (const match of sql.matchAll(pattern)) {
    matches.add(normalizeTableName(match[1]));
  }
  return matches;
};

const migrationFiles = readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort();

const sql = migrationFiles
  .map((file) => readFileSync(path.join(migrationsDir, file), 'utf8'))
  .join('\n');

const createdTables = collectMatches(
  sql,
  /\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?((?:"?[a-zA-Z_][\w]*"?\.)?"?[a-zA-Z_][\w]*"?)/gi,
);

const rlsEnabledTables = collectMatches(
  sql,
  /\balter\s+table\s+(?:if\s+exists\s+)?((?:"?[a-zA-Z_][\w]*"?\.)?"?[a-zA-Z_][\w]*"?)\s+enable\s+row\s+level\s+security\b/gi,
);

const directPolicyTables = collectMatches(
  sql,
  /\bcreate\s+policy\s+[\s\S]*?\s+on\s+((?:"?[a-zA-Z_][\w]*"?\.)?"?[a-zA-Z_][\w]*"?)/gi,
);

const dynamicPolicyTables = new Set<string>();
for (const match of sql.matchAll(/\barray\s*\[([\s\S]*?)\]/gi)) {
  const blockStart = Math.max(0, match.index - 600);
  const blockEnd = Math.min(sql.length, match.index + match[0].length + 1200);
  const surroundingSql = sql.slice(blockStart, blockEnd).toLowerCase();

  if (!surroundingSql.includes('create policy')) {
    continue;
  }

  for (const tableMatch of match[1].matchAll(/'([a-zA-Z_][\w]*)'/g)) {
    dynamicPolicyTables.add(normalizeTableName(tableMatch[1]));
  }
}

const policyTables = new Set([...directPolicyTables, ...dynamicPolicyTables]);
const projectTables = [...createdTables].filter((table) => !ignoredTables.has(table)).sort();

const missingRls = projectTables.filter((table) => !rlsEnabledTables.has(table));
const missingPolicy = projectTables.filter((table) => !policyTables.has(table));

if (missingRls.length > 0 || missingPolicy.length > 0) {
  console.error('RLS migration audit failed.');

  if (missingRls.length > 0) {
    console.error(`Tables missing ENABLE ROW LEVEL SECURITY: ${missingRls.join(', ')}`);
  }

  if (missingPolicy.length > 0) {
    console.error(`Tables missing at least one CREATE POLICY: ${missingPolicy.join(', ')}`);
  }

  process.exit(1);
}

console.log(`RLS migration audit passed for ${projectTables.length} public tables.`);
