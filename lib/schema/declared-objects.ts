/**
 * What the migrations say the database should contain.
 *
 * Read in filename order and replayed, so an object created in one migration
 * and dropped in a later one is not expected to exist. Names are the unit of
 * comparison: definitions drift for legitimate reasons (a CHECK reformatted by
 * Postgres, an index reordered), whereas an object nobody declared is always
 * worth a look.
 */
export type DeclaredObjects = {
  policies: Set<string>;
  indexes: Set<string>;
  constraints: Set<string>;
};

export type PolicyRef = { policy: string; table: string };

export const policyKey = (table: string, policy: string) => `${table}.${policy}`;

const unquote = (value: string) => value.replace(/^"|"$/g, '');

const CREATE_POLICY = /CREATE\s+POLICY\s+("(?:[^"]+)"|[A-Za-z_][\w$]*)\s+ON\s+(?:public\.)?("(?:[^"]+)"|[A-Za-z_][\w$]*)/gi;
const DROP_POLICY = /DROP\s+POLICY\s+(?:IF\s+EXISTS\s+)?("(?:[^"]+)"|[A-Za-z_][\w$]*)\s+ON\s+(?:public\.)?("(?:[^"]+)"|[A-Za-z_][\w$]*)/gi;
const CREATE_INDEX = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:CONCURRENTLY\s+)?(?:IF\s+NOT\s+EXISTS\s+)?("(?:[^"]+)"|[A-Za-z_][\w$]*)/gi;
const DROP_INDEX = /DROP\s+INDEX\s+(?:CONCURRENTLY\s+)?(?:IF\s+EXISTS\s+)?("(?:[^"]+)"|[A-Za-z_][\w$]*)/gi;
const ADD_CONSTRAINT = /ADD\s+CONSTRAINT\s+("(?:[^"]+)"|[A-Za-z_][\w$]*)/gi;
const DROP_CONSTRAINT = /DROP\s+CONSTRAINT\s+(?:IF\s+EXISTS\s+)?("(?:[^"]+)"|[A-Za-z_][\w$]*)/gi;

/** Replays every migration in order and returns what should exist at the end. */
export function collectDeclaredObjects(migrations: string[]): DeclaredObjects {
  const policies = new Set<string>();
  const indexes = new Set<string>();
  const constraints = new Set<string>();

  // Statements are applied in the order they appear, not grouped by kind: a
  // migration that drops a policy and immediately recreates it must end with
  // the policy present, which grouping gets backwards.
  const steps: Array<{ pattern: RegExp; apply: (match: RegExpMatchArray) => void }> = [
    { pattern: CREATE_POLICY, apply: (m) => policies.add(policyKey(unquote(m[2]), unquote(m[1]))) },
    { pattern: DROP_POLICY, apply: (m) => policies.delete(policyKey(unquote(m[2]), unquote(m[1]))) },
    { pattern: CREATE_INDEX, apply: (m) => indexes.add(unquote(m[1])) },
    { pattern: DROP_INDEX, apply: (m) => indexes.delete(unquote(m[1])) },
    { pattern: ADD_CONSTRAINT, apply: (m) => constraints.add(unquote(m[1])) },
    { pattern: DROP_CONSTRAINT, apply: (m) => constraints.delete(unquote(m[1])) },
  ];

  for (const sql of migrations) {
    const ordered: Array<{ index: number; match: RegExpMatchArray; apply: (m: RegExpMatchArray) => void }> = [];

    for (const step of steps) {
      for (const match of sql.matchAll(step.pattern)) {
        ordered.push({ index: match.index ?? 0, match, apply: step.apply });
      }
    }

    ordered.sort((a, b) => a.index - b.index);
    for (const entry of ordered) entry.apply(entry.match);
  }

  return { policies, indexes, constraints };
}

/**
 * Constraints Postgres names itself from an inline CREATE TABLE clause. The
 * migrations never name these, so they would otherwise be reported as
 * undeclared on every run.
 */
export function isSystemNamedConstraint(table: string, name: string): boolean {
  if (!name.startsWith(`${table}_`)) return false;
  return /_(pkey|key|fkey|check|excl)\d*$/.test(name);
}

/**
 * A policy on a table whose USING clause reads that same table cannot finish
 * evaluating: Postgres stops it with 42P17. This is the shape that took
 * /admin/students down, and it is worth catching wherever it appears rather
 * than only where a migration introduced it.
 */
export function isSelfReferencingPolicy(table: string, definition: string): boolean {
  const escaped = table.replace(/[^A-Za-z0-9_]/g, '');
  const pattern = new RegExp('\\bFROM\\s+(?:public\\.)?"?' + escaped + '"?\\b', 'i');
  return pattern.test(definition);
}
