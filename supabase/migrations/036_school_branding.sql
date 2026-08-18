-- Per-school brand colours.
--
-- A school on its own subdomain should not look like a generic tenant of
-- somebody else's product, so it picks the two accents the interface is built
-- from. The values live on `universities` rather than in `university_settings`
-- because middleware already reads and caches this row per request: putting
-- them here keeps branding free of an extra query on every page view.
--
-- NULL means "use the platform brand". Only these two columns are ever written
-- by a school admin, and that write goes through a server action guarded by
-- requireRole('department_admin'); RLS on this table stays super-admin-only
-- because Postgres row policies cannot restrict which columns an update touches.

ALTER TABLE universities ADD COLUMN IF NOT EXISTS primary_color TEXT;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS secondary_color TEXT;

-- Stored values are interpolated into an inline <style> element, so the format
-- is constrained at the database level and not merely in the action that writes it.
ALTER TABLE universities DROP CONSTRAINT IF EXISTS universities_primary_color_format;
ALTER TABLE universities
    ADD CONSTRAINT universities_primary_color_format CHECK (
        primary_color IS NULL OR primary_color ~ '^#[0-9a-f]{6}$'
    );

ALTER TABLE universities DROP CONSTRAINT IF EXISTS universities_secondary_color_format;
ALTER TABLE universities
    ADD CONSTRAINT universities_secondary_color_format CHECK (
        secondary_color IS NULL OR secondary_color ~ '^#[0-9a-f]{6}$'
    );
