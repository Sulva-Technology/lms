-- One account, many organisations.
--
-- profiles carried a single university_id and role, so a person invited to a
-- second school could not accept: inviteUserByEmail rejects an address that is
-- already registered, and the middleware signed them out of the second host
-- for not matching the first. The tenant and the role move to a row per
-- (person, organisation) instead.
--
-- membership_claims is a mirror of the active memberships, and it exists for
-- one reason. The helper functions below are called by policies on memberships
-- itself, so a helper that read memberships would re-enter the policy that
-- asked the question: 42P17, the failure migration 041 removed. Pointing the
-- helpers at a table whose own policy names auth.uid() and nothing else breaks
-- the cycle, and means no helper depends on SECURITY DEFINER actually
-- bypassing RLS - an assumption about provisioning the schema cannot make.

CREATE TABLE IF NOT EXISTS memberships (
    user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    role          user_role NOT NULL,
    student_id    TEXT,
    -- TrainingAssignmentService.assignTeam already filters on a department for
    -- a person; the column it filtered has never existed on profiles.
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ,
    PRIMARY KEY (user_id, university_id),
    -- A matric number is issued by one school and means nothing at another.
    UNIQUE (university_id, student_id),
    -- Platform administration is not a membership in any organisation.
    CHECK (role <> 'super_admin')
);

CREATE INDEX IF NOT EXISTS idx_memberships_university_role
  ON memberships (university_id, role) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS membership_claims (
    user_id       UUID NOT NULL,
    university_id UUID NOT NULL,
    role          user_role NOT NULL,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, university_id)
);

CREATE TABLE IF NOT EXISTS platform_admins (
    user_id    UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Backfill. Soft-deletes are preserved, so a deactivated person stays
-- deactivated and an active one is not locked out the moment this is applied.
-- ---------------------------------------------------------------------------
INSERT INTO memberships (user_id, university_id, role, student_id, deleted_at)
SELECT id, university_id, role, student_id, deleted_at
FROM profiles
WHERE university_id IS NOT NULL AND role <> 'super_admin'
ON CONFLICT (user_id, university_id) DO NOTHING;

INSERT INTO platform_admins (user_id)
SELECT id FROM profiles WHERE role = 'super_admin'
ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- The mirror follows memberships by trigger, so a write that skips the service
-- layer cannot leave a stale claim. A deactivated membership is removed from
-- the mirror rather than flagged, which keeps every helper a plain EXISTS.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_membership_claim()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    DELETE FROM membership_claims
      WHERE user_id = OLD.user_id AND university_id = OLD.university_id;
    RETURN OLD;
  END IF;

  IF NEW.deleted_at IS NOT NULL THEN
    DELETE FROM membership_claims
      WHERE user_id = NEW.user_id AND university_id = NEW.university_id;
    RETURN NEW;
  END IF;

  INSERT INTO membership_claims (user_id, university_id, role)
  VALUES (NEW.user_id, NEW.university_id, NEW.role)
  ON CONFLICT (user_id, university_id) DO UPDATE
    SET role = EXCLUDED.role, updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS sync_membership_claim_trigger ON memberships;
CREATE TRIGGER sync_membership_claim_trigger
  AFTER INSERT OR UPDATE OR DELETE ON memberships
  FOR EACH ROW EXECUTE FUNCTION sync_membership_claim();

INSERT INTO membership_claims (user_id, university_id, role)
SELECT user_id, university_id, role FROM memberships WHERE deleted_at IS NULL
ON CONFLICT (user_id, university_id) DO UPDATE
  SET role = EXCLUDED.role, updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Helpers. Every one reads membership_claims or platform_admins, and nothing
-- else, so each touches only rows the caller can already see under those
-- tables' own policies.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_member_of(check_uni_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM membership_claims
    WHERE user_id = auth.uid() AND university_id = check_uni_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION role_in(check_uni_id UUID) RETURNS user_role AS $$
  SELECT role FROM membership_claims
  WHERE user_id = auth.uid() AND university_id = check_uni_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION in_same_tenant(tenant_id UUID) RETURNS BOOLEAN AS $$
  SELECT is_super_admin() OR is_member_of(tenant_id);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_university_admin(check_uni_id UUID) RETURNS BOOLEAN AS $$
  SELECT role_in(check_uni_id) = 'admin'::user_role;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Staffness becomes a fact about a person in one organisation rather than a
-- global property of the account.
CREATE OR REPLACE FUNCTION is_staff_in(check_uni_id UUID) RETURNS BOOLEAN AS $$
  SELECT is_super_admin()
      OR role_in(check_uni_id) IN ('lecturer', 'department_admin', 'admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- Policies. The service role is the only writer of all three tables, as it
-- already is for profiles, so no INSERT, UPDATE or DELETE policy exists.
-- ---------------------------------------------------------------------------
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own membership claims" ON membership_claims;
CREATE POLICY "Users read own membership claims" ON membership_claims
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users read own platform admin row" ON platform_admins;
CREATE POLICY "Users read own platform admin row" ON platform_admins
FOR SELECT USING (user_id = auth.uid());

-- Safe to call a helper here: the helpers read membership_claims, not this
-- table, so this policy cannot re-enter itself.
DROP POLICY IF EXISTS "Members read organisation memberships" ON memberships;
CREATE POLICY "Members read organisation memberships" ON memberships
FOR SELECT USING (is_member_of(university_id));

GRANT SELECT ON public.memberships TO authenticated;
GRANT SELECT ON public.membership_claims TO authenticated;
GRANT SELECT ON public.platform_admins TO authenticated;
GRANT ALL ON public.memberships TO service_role;
GRANT ALL ON public.membership_claims TO service_role;
GRANT ALL ON public.platform_admins TO service_role;
