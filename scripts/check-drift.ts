// Compares the live database against what the migrations declare.
//
// Reads schema metadata through the schema_drift_snapshot() function from
// migration 042 with the service-role client, so it needs the same environment
// as the other maintenance scripts and never runs in the browser.
//
//   npm run check:drift
//
// Exits non-zero when something exists in the database that no migration
// declares, when a migration declares something the database lacks, or when a
// policy on a table reads that same table.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { adminClient } from './lib/clients';
import {
  collectDeclaredObjects,
  isSelfReferencingPolicy,
  isSystemNamedConstraint,
  policyKey,
} from '../lib/schema/declared-objects';

type SnapshotRow = { kind: string; object_name: string; table_name: string; definition: string };

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

const readMigrations = () =>
  readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => readFileSync(path.join(migrationsDir, file), 'utf8'));

const heading = (text: string) => `\n${text}\n${'-'.repeat(text.length)}`;

async function main() {
  const declared = collectDeclaredObjects(readMigrations());

  const { data, error } = await adminClient().rpc('schema_drift_snapshot');

  if (error) {
    console.error(`Could not read the schema: ${error.message}`);
    if (error.message.includes('schema_drift_snapshot')) {
      console.error('Apply migration 042_schema_drift_snapshot.sql first.');
    }
    process.exit(1);
  }

  const rows = (data || []) as SnapshotRow[];
  const undeclared: string[] = [];
  const missing: string[] = [];
  const recursive: string[] = [];

  const livePolicies = new Set<string>();
  const liveIndexes = new Set<string>();
  const liveConstraints = new Set<string>();

  for (const row of rows) {
    if (row.kind === 'policy') {
      const key = policyKey(row.table_name, row.object_name);
      livePolicies.add(key);

      if (!declared.policies.has(key)) {
        undeclared.push(`policy      ${key}\n              USING ${row.definition || '(none)'}`);
      }
      if (isSelfReferencingPolicy(row.table_name, row.definition)) {
        recursive.push(`${key}\n              USING ${row.definition}`);
      }
    }

    if (row.kind === 'index') {
      liveIndexes.add(row.object_name);
      if (!declared.indexes.has(row.object_name)) {
        undeclared.push(`index       ${row.table_name}.${row.object_name}`);
      }
    }

    if (row.kind === 'constraint') {
      liveConstraints.add(row.object_name);
      if (
        !declared.constraints.has(row.object_name) &&
        !isSystemNamedConstraint(row.table_name, row.object_name)
      ) {
        undeclared.push(`constraint  ${row.table_name}.${row.object_name}  ${row.definition}`);
      }
    }
  }

  for (const key of declared.policies) if (!livePolicies.has(key)) missing.push(`policy      ${key}`);
  for (const name of declared.indexes) if (!liveIndexes.has(name)) missing.push(`index       ${name}`);
  for (const name of declared.constraints) {
    if (!liveConstraints.has(name)) missing.push(`constraint  ${name}`);
  }

  if (recursive.length > 0) {
    console.error(heading('Policies that read the table they guard (42P17)'));
    for (const entry of recursive) console.error(`  ${entry}`);
  }

  if (undeclared.length > 0) {
    console.error(heading('In the database, declared by no migration'));
    for (const entry of undeclared.sort()) console.error(`  ${entry}`);
  }

  if (missing.length > 0) {
    console.error(heading('Declared by a migration, missing from the database'));
    for (const entry of missing.sort()) console.error(`  ${entry}`);
    console.error('\n  Usually means a migration has not been applied yet.');
  }

  const failures = recursive.length + undeclared.length + missing.length;

  if (failures === 0) {
    console.log(`Schema drift audit passed. ${rows.length} objects match the migrations.`);
    return;
  }

  console.error(
    `\nSchema drift audit failed: ${recursive.length} recursive, ${undeclared.length} undeclared, ${missing.length} missing.`,
  );
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
