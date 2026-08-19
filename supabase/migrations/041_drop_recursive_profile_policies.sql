-- Removes two policies that were added directly to the database and never
-- existed in a migration, one of which caused 42P17 on every page that lists
-- people.
--
--   "Super admin view all profiles"
--     USING (EXISTS (SELECT 1 FROM profiles p
--                     WHERE p.id = auth.uid() AND p.role = 'super_admin'))
--
-- A policy on profiles whose USING clause selects from profiles re-enters
-- itself: evaluating it requires evaluating it. The helper functions exist
-- precisely so a policy never has to read the table it guards, and this policy
-- went around them.
--
-- It was also redundant. in_same_tenant() already reads
-- "is_super_admin() OR tenant_id = current_university_id()", so a super admin
-- could already see every profile through the tenant policy. Dropping it
-- restores that route rather than removing access.
DROP POLICY IF EXISTS "Super admin view all profiles" ON profiles;

-- Stated explicitly all the same, so a later narrowing of in_same_tenant cannot
-- quietly take platform administration away. is_super_admin() reads
-- profile_claims, so this cannot recurse.
DO $BODY$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'Super admins view every profile'
  ) THEN
    CREATE POLICY "Super admins view every profile" ON profiles
    FOR SELECT USING (is_super_admin());
  END IF;
END;
$BODY$;

-- Exact duplicate of "Users view own profile" from migration 016. Permissive
-- policies are OR'd, so it granted nothing the other did not, and two names for
-- one rule is drift waiting to be misread.
DROP POLICY IF EXISTS "Safe profile access" ON profiles;
