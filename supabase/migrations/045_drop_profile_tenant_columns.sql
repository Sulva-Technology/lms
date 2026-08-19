-- The contract half of the membership change.
--
-- Apply only once every running instance reads memberships. The code before
-- that release still selects these columns, and dropping them under it returns
-- 500 from every page.
--
-- Two policies on profiles name the columns going away, so they are replaced
-- first. Both preserve today's meaning exactly: a member sees everyone in an
-- organisation they belong to, an admin manages everyone in theirs. Neither
-- reads profiles, so neither can recurse; the chain runs
-- profiles -> memberships -> membership_claims and terminates, because the
-- helpers read only the mirror.

DROP POLICY IF EXISTS "Users view profiles in same university" ON profiles;
CREATE POLICY "Users view profiles sharing an organisation" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = profiles.id
      AND m.deleted_at IS NULL
      AND is_member_of(m.university_id)
  )
);

DROP POLICY IF EXISTS "Admins manage university profiles" ON profiles;
CREATE POLICY "Admins manage organisation profiles" ON profiles
FOR ALL USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = profiles.id
      AND m.deleted_at IS NULL
      AND is_university_admin(m.university_id)
  )
);

-- profile_claims answered "which organisation, and which role" for an account
-- that had exactly one of each. membership_claims answers it per organisation.
DROP TRIGGER IF EXISTS sync_profile_claim_trigger ON profiles;
DROP FUNCTION IF EXISTS sync_profile_claim();
DROP TABLE IF EXISTS profile_claims;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_university_id_student_id_key;
ALTER TABLE profiles DROP COLUMN IF EXISTS university_id;
ALTER TABLE profiles DROP COLUMN IF EXISTS role;
ALTER TABLE profiles DROP COLUMN IF EXISTS student_id;

-- These asked which single organisation the caller belongs to. The question no
-- longer has one answer, and nothing calls them after migration 044.
DROP FUNCTION IF EXISTS current_university_id();
DROP FUNCTION IF EXISTS current_user_role();
DROP FUNCTION IF EXISTS current_user_is_staff();
DROP FUNCTION IF EXISTS current_profile_id();
