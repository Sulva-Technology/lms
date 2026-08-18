-- Each school is served from <subdomain>.<root domain>. The column is the
-- tenant routing key, so it is unique, slug-shaped, and never a reserved name.

ALTER TABLE universities ADD COLUMN IF NOT EXISTS subdomain TEXT;

-- Backfill: slugify the name, then de-duplicate with a numeric suffix.
WITH slugged AS (
    SELECT
        id,
        NULLIF(trim(both '-' FROM regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')), '') AS base,
        row_number() OVER (
            PARTITION BY NULLIF(trim(both '-' FROM regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')), '')
            ORDER BY created_at, id
        ) AS dupe_rank
    FROM universities
    WHERE subdomain IS NULL
)
UPDATE universities u
SET subdomain = CASE
        WHEN s.base IS NULL THEN 'school-' || left(replace(u.id::text, '-', ''), 8)
        WHEN s.dupe_rank = 1 THEN left(s.base, 63)
        ELSE left(s.base, 58) || '-' || s.dupe_rank
    END
FROM slugged s
WHERE u.id = s.id;

-- Any backfilled value that collided with a reserved name gets prefixed.
UPDATE universities
SET subdomain = 'school-' || subdomain
WHERE subdomain IN (
    'www','app','api','admin','superadmin','mail','smtp','ftp','static','assets',
    'cdn','docs','blog','status','support','dashboard','login','auth','dev',
    'staging','test','demo','vercel'
);

ALTER TABLE universities ALTER COLUMN subdomain SET NOT NULL;

ALTER TABLE universities
    DROP CONSTRAINT IF EXISTS universities_subdomain_key;
ALTER TABLE universities
    ADD CONSTRAINT universities_subdomain_key UNIQUE (subdomain);

ALTER TABLE universities
    DROP CONSTRAINT IF EXISTS universities_subdomain_format;
ALTER TABLE universities
    ADD CONSTRAINT universities_subdomain_format CHECK (
        subdomain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'
        AND subdomain NOT IN (
            'www','app','api','admin','superadmin','mail','smtp','ftp','static','assets',
            'cdn','docs','blog','status','support','dashboard','login','auth','dev',
            'staging','test','demo','vercel'
        )
    );

CREATE INDEX IF NOT EXISTS idx_universities_subdomain ON universities (subdomain);

-- Creation must be a super_admin-only act at the database level, not merely in
-- the server action. The pre-existing FOR ALL policy had no WITH CHECK, so an
-- INSERT was accepted from any authenticated session.
DROP POLICY IF EXISTS "Super admins can manage universities" ON universities;
CREATE POLICY "Super admins can manage universities" ON universities
    FOR ALL
    USING (is_super_admin())
    WITH CHECK (is_super_admin());
