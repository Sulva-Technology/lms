type Row = Record<string, any>;

export interface SupabaseStub {
  client: any;
  tables: Record<string, Row[]>;
  inserted: Record<string, Row[]>;
  updated: Record<string, Row[]>;
  deleted: Record<string, Row[]>;
}

let idCounter = 0;
const nextId = () => `stub-${++idCounter}`;

/**
 * A minimal in-memory stand-in for a Supabase client.
 *
 * It supports the query shapes this codebase actually uses:
 *   .from(t).select(cols).eq(c, v).maybeSingle()
 *   .from(t).select(cols).in(c, [v]).order(c, { ascending }).limit(n)
 *   .from(t).insert(row).select().single()
 *   .from(t).update(row).eq(c, v).select().single()
 *   .from(t).delete().eq(c, v)
 *
 * Every chain is awaitable directly, matching PostgrestBuilder's thenable
 * behaviour, and terminal helpers (`single`, `maybeSingle`) resolve to the
 * `{ data, error }` envelope the real client returns.
 */
export function createSupabaseStub(seed: Record<string, Row[]>): SupabaseStub {
  const tables: Record<string, Row[]> = {};
  for (const [name, rows] of Object.entries(seed)) {
    tables[name] = rows.map((row) => ({ ...row }));
  }

  const inserted: Record<string, Row[]> = {};
  const updated: Record<string, Row[]> = {};
  const deleted: Record<string, Row[]> = {};

  const record = (bucket: Record<string, Row[]>, table: string, row: Row) => {
    bucket[table] = bucket[table] || [];
    bucket[table].push(row);
  };

  function builder(table: string) {
    tables[table] = tables[table] || [];

    const equals: Array<[string, any]> = [];
    const memberships: Array<[string, Set<any>]> = [];
    const notNulls: string[] = [];
    let sort: { column: string; ascending: boolean } | null = null;
    let take: number | null = null;
    let mode: 'select' | 'insert' | 'update' | 'delete' = 'select';
    let payload: Row | Row[] | null = null;
    let settled: Row[] | null = null;

    const matches = (row: Row) =>
      equals.every(([column, value]) => row[column] === value) &&
      memberships.every(([column, values]) => values.has(row[column])) &&
      notNulls.every((column) => row[column] !== null && row[column] !== undefined);

    const run = (): Row[] => {
      if (settled) return settled;

      if (mode === 'insert') {
        const rows = (Array.isArray(payload) ? payload : [payload as Row]).map((row) => ({
          id: row.id ?? nextId(),
          ...row,
        }));
        for (const row of rows) {
          tables[table].push(row);
          record(inserted, table, row);
        }
        settled = rows;
        return settled;
      }

      if (mode === 'update') {
        const rows = tables[table].filter(matches);
        for (const row of rows) {
          Object.assign(row, payload as Row);
          record(updated, table, row);
        }
        settled = rows;
        return settled;
      }

      if (mode === 'delete') {
        const rows = tables[table].filter(matches);
        tables[table] = tables[table].filter((row) => !rows.includes(row));
        for (const row of rows) record(deleted, table, row);
        settled = rows;
        return settled;
      }

      let rows = tables[table].filter(matches);
      if (sort) {
        const { column, ascending } = sort;
        rows = [...rows].sort((a, b) => {
          if (a[column] === b[column]) return 0;
          const comparison = a[column] > b[column] ? 1 : -1;
          return ascending ? comparison : -comparison;
        });
      }
      if (take !== null) rows = rows.slice(0, take);

      settled = rows;
      return settled;
    };

    const chain: any = {
      select: () => chain,
      insert: (value: Row | Row[]) => {
        mode = 'insert';
        payload = value;
        return chain;
      },
      upsert: (value: Row | Row[]) => {
        mode = 'insert';
        payload = value;
        return chain;
      },
      update: (value: Row) => {
        mode = 'update';
        payload = value;
        return chain;
      },
      delete: () => {
        mode = 'delete';
        return chain;
      },
      eq: (column: string, value: any) => {
        equals.push([column, value]);
        return chain;
      },
      in: (column: string, values: any[]) => {
        memberships.push([column, new Set(values)]);
        return chain;
      },
      not: (column: string, operator: string) => {
        if (operator === 'is') notNulls.push(column);
        return chain;
      },
      order: (column: string, options?: { ascending?: boolean }) => {
        sort = { column, ascending: options?.ascending !== false };
        return chain;
      },
      limit: (count: number) => {
        take = count;
        return chain;
      },
      single: async () => {
        const rows = run();
        if (rows.length === 0) return { data: null, error: { message: 'No rows found' } };
        return { data: rows[0], error: null };
      },
      maybeSingle: async () => {
        const rows = run();
        return { data: rows[0] ?? null, error: null };
      },
      then: (resolve: (value: { data: Row[]; error: null }) => any, reject?: (reason: any) => any) =>
        Promise.resolve({ data: run(), error: null }).then(resolve, reject),
    };

    return chain;
  }

  return {
    client: { from: (table: string) => builder(table) },
    tables,
    inserted,
    updated,
    deleted,
  };
}
