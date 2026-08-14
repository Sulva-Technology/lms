-- Data API privileges.
--
-- Supabase used to auto-grant every new table in `public` to the Data API roles
-- (`anon`, `authenticated`, `service_role`). New projects no longer do this, and
-- the legacy behaviour is removed entirely on 2026-10-30. Without explicit
-- grants the application fails on a freshly provisioned project with
-- "permission denied for table ...", even though RLS is configured correctly.
--
-- RLS remains the security boundary. These grants are the coarse layer beneath
-- it: they decide which roles may reach a table at all, while the policies from
-- migrations 005, 018 and 020 decide which rows.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Signed-in users reach every project table through PostgREST; RLS filters rows.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- The service role is used only by server-only code paths (login role lookup,
-- invites, webhooks, maintenance scripts) and bypasses RLS by design.
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Anonymous visitors need exactly one table: the university picker on the login
-- and onboarding screens. Everything else stays unreachable before sign-in.
GRANT SELECT ON public.universities TO anon;

-- Future tables inherit the same shape, so a later migration cannot silently
-- ship a table the application cannot read.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO authenticated, service_role;
