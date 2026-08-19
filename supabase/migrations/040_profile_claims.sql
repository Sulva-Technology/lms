-- Breaks the recursion in the profiles policies.
--
-- "Users view profiles in same university" calls in_same_tenant(), which calls
-- current_university_id(), which selects from profiles. Reading anyone else's
-- profile therefore re-enters the policy that asked the question, and Postgres
-- stops it with 42P17: infinite recursion detected in policy for relation
-- "profiles". Reading your own profile never showed it, because that is matched
-- by the self policy from migration 016 first.
--
-- SECURITY DEFINER was supposed to prevent this by bypassing RLS, and it only
-- does so while the function owner also owns the table and row security is not
-- forced. That is an assumption about how the database was provisioned, not
-- something the schema controls, so the dependency is removed instead.
--
-- profile_claims holds the two facts the policies need. Its own policy names
-- only auth.uid() and touches no other table, so nothing it does can re-enter a
-- policy.

CREATE TABLE IF NOT EXISTS profile_claims (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    university_id UUID,
    role user_role NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO profile_claims (user_id, university_id, role)
SELECT id, university_id, role FROM profiles
ON CONFLICT (user_id) DO UPDATE
  SET university_id = EXCLUDED.university_id,
      role = EXCLUDED.role,
      updated_at = NOW();

-- Kept in step with profiles by trigger rather than by application code, so a
-- write that skips the service layer cannot leave the claim stale.
CREATE OR REPLACE FUNCTION sync_profile_claim()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profile_claims (user_id, university_id, role)
  VALUES (NEW.id, NEW.university_id, NEW.role)
  ON CONFLICT (user_id) DO UPDATE
    SET university_id = EXCLUDED.university_id,
        role = EXCLUDED.role,
        updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS sync_profile_claim_trigger ON profiles;
CREATE TRIGGER sync_profile_claim_trigger
  AFTER INSERT OR UPDATE OF university_id, role ON profiles
  FOR EACH ROW EXECUTE FUNCTION sync_profile_claim();

ALTER TABLE profile_claims ENABLE ROW LEVEL SECURITY;

DO $BODY$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profile_claims'
      AND policyname = 'Users read own claim'
  ) THEN
    -- Deliberately the only policy, and deliberately self-referential to the
    -- session user alone: no INSERT, UPDATE or DELETE from the API, because the
    -- trigger is the only writer.
    CREATE POLICY "Users read own claim" ON profile_claims
    FOR SELECT USING (user_id = auth.uid());
  END IF;
END;
$BODY$;

GRANT SELECT ON public.profile_claims TO authenticated;
GRANT ALL ON public.profile_claims TO service_role;

-- The helpers now read the claim instead of the profile. Everything built on
-- them - is_super_admin, is_university_admin, in_same_tenant, and every policy
-- across the schema that calls those - is fixed by these two definitions.
CREATE OR REPLACE FUNCTION current_university_id() RETURNS UUID AS $$
  SELECT university_id FROM profile_claims WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION current_user_role() RETURNS user_role AS $$
  SELECT role FROM profile_claims WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION current_profile_id() RETURNS UUID AS $$
  SELECT user_id FROM profile_claims WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
