-- A tenant is either a school or an organisation running internal training.
-- The difference is structural, not cosmetic: a firm has no faculties and no
-- semesters, and fabricating them made every report read as though it does.

ALTER TABLE universities ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'academic';

DO $BODY$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'universities_mode_values') THEN
    ALTER TABLE universities
      ADD CONSTRAINT universities_mode_values CHECK (mode IN ('academic', 'training'));
  END IF;
END;
$BODY$;

-- The chain becomes optional. Existing rows already satisfy it, so no backfill.
ALTER TABLE courses ALTER COLUMN department_id DROP NOT NULL;
ALTER TABLE course_sections ALTER COLUMN semester_id DROP NOT NULL;

-- A cohort carries its own dates rather than borrowing a semester's.
ALTER TABLE course_sections ADD COLUMN IF NOT EXISTS starts_on DATE;
ALTER TABLE course_sections ADD COLUMN IF NOT EXISTS ends_on DATE;

DO $BODY$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_sections_date_order') THEN
    ALTER TABLE course_sections
      ADD CONSTRAINT course_sections_date_order
      CHECK (starts_on IS NULL OR ends_on IS NULL OR ends_on >= starts_on);
  END IF;

  -- A section with neither a semester nor its own start date is unschedulable
  -- in either mode, so at least one of the two must be present.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_sections_schedulable') THEN
    ALTER TABLE course_sections
      ADD CONSTRAINT course_sections_schedulable
      CHECK (semester_id IS NOT NULL OR starts_on IS NOT NULL);
  END IF;
END;
$BODY$;
