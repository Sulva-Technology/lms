-- Training that must be repeated needs a certificate that lapses.
--
-- The compliance question is never "was this ever earned" but "is it still
-- valid", and a certificate with no expiry cannot answer it. NULL keeps the
-- existing behaviour: a certificate that never expires.

ALTER TABLE courses ADD COLUMN IF NOT EXISTS valid_for_months SMALLINT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

DO $BODY$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'courses_valid_for_months_range') THEN
    ALTER TABLE courses
      ADD CONSTRAINT courses_valid_for_months_range
      CHECK (valid_for_months IS NULL OR valid_for_months BETWEEN 1 AND 120);
  END IF;
END;
$BODY$;

CREATE INDEX IF NOT EXISTS certificates_expiring_idx
  ON certificates (university_id, expires_at)
  WHERE revoked_at IS NULL AND expires_at IS NOT NULL;
