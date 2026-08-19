-- Lets a maintenance script read what the database actually contains, so it can
-- be compared against what the migrations declare.
--
-- Two policies once existed on profiles that were in no migration, one of them
-- recursive enough to take down every page that listed people. Nothing in the
-- repository could have seen them, because the repository was not where they
-- lived.
--
-- Metadata only: names and definitions of policies, indexes and constraints.
-- No row of application data passes through it, and EXECUTE is granted to the
-- service role alone.
CREATE OR REPLACE FUNCTION public.schema_drift_snapshot()
RETURNS TABLE (kind TEXT, object_name TEXT, table_name TEXT, definition TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $BODY$
  SELECT 'policy', pol.polname::text, rel.relname::text,
         COALESCE(pg_get_expr(pol.polqual, pol.polrelid), '')::text
  FROM pg_policy pol
  JOIN pg_class rel ON rel.oid = pol.polrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'

  UNION ALL
  SELECT 'index', idx.relname::text, tab.relname::text, pg_get_indexdef(idx.oid)::text
  FROM pg_index i
  JOIN pg_class idx ON idx.oid = i.indexrelid
  JOIN pg_class tab ON tab.oid = i.indrelid
  JOIN pg_namespace nsp ON nsp.oid = tab.relnamespace
  WHERE nsp.nspname = 'public'
    -- Indexes that exist only to back a PRIMARY KEY or UNIQUE constraint are
    -- reported as the constraint instead, so they are not counted twice.
    AND NOT i.indisprimary
    AND NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = i.indexrelid)

  UNION ALL
  SELECT 'constraint', con.conname::text, rel.relname::text, pg_get_constraintdef(con.oid)::text
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'

  UNION ALL
  SELECT 'table', rel.relname::text, rel.relname::text,
         CASE WHEN rel.relrowsecurity THEN 'rls=on' ELSE 'rls=off' END
  FROM pg_class rel
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public' AND rel.relkind = 'r';
$BODY$;

REVOKE ALL ON FUNCTION public.schema_drift_snapshot() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.schema_drift_snapshot() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.schema_drift_snapshot() TO service_role;
