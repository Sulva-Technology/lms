-- Ensure newly onboarded users can read their own profile immediately.
-- Tenant-wide profile visibility depends on current_university_id(), which itself
-- reads profiles. This explicit policy keeps auth redirects deterministic.

DROP POLICY IF EXISTS "Users view own profile" ON profiles;
CREATE POLICY "Users view own profile" ON profiles
FOR SELECT USING (id = auth.uid());
