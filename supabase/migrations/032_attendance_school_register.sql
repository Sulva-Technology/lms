-- Attendance as a school register rather than a per-course sign-in sheet.
--
-- Four gaps closed here:
--   1. Only one roll call per section per calendar day was possible, so a
--      section meeting twice in a day silently overwrote its first register.
--   2. Records could not carry a reason, even though "excused" is a status.
--   3. Corrections overwrote in place with no way to reconstruct who changed
--      what, which most institutions need for a disputed record.
--   4. Nothing recorded who marked a record, only who created the session.

-- ---------------------------------------------------------------------------
-- 1. Periods: a section may meet several times in one day.
-- ---------------------------------------------------------------------------
ALTER TABLE attendance_sessions
  ADD COLUMN IF NOT EXISTS period SMALLINT NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'attendance_sessions_period_range'
  ) THEN
    ALTER TABLE attendance_sessions
      ADD CONSTRAINT attendance_sessions_period_range CHECK (period BETWEEN 1 AND 20);
  END IF;
END;
$$;

DROP INDEX IF EXISTS attendance_sessions_section_date_key;

CREATE UNIQUE INDEX IF NOT EXISTS attendance_sessions_section_date_period_key
  ON attendance_sessions (course_section_id, date, period);

-- The initial schema constrained one record per student per section per day,
-- which contradicts per-period registers. Row identity is the session, so the
-- (session_id, student_id) index from migration 029 is the correct one.
DO $$
DECLARE
  conflicting_constraint text;
BEGIN
  SELECT con.conname INTO conflicting_constraint
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'attendance_records'
    AND con.contype = 'u'
    AND (
      SELECT array_agg(att.attname ORDER BY att.attname)
      FROM unnest(con.conkey) AS k(attnum)
      JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = k.attnum
    ) = ARRAY['course_section_id', 'record_date', 'student_id'];

  IF conflicting_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE attendance_records DROP CONSTRAINT %I', conflicting_constraint);
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Reasons, and who actually marked the record.
-- ---------------------------------------------------------------------------
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id);

-- ---------------------------------------------------------------------------
-- 3. Immutable change log.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_record_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    course_section_id UUID REFERENCES course_sections(id) ON DELETE CASCADE,
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    record_id UUID REFERENCES attendance_records(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    previous_notes TEXT,
    new_notes TEXT,
    changed_by UUID REFERENCES profiles(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS attendance_record_changes_session_idx
  ON attendance_record_changes (session_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS attendance_record_changes_student_idx
  ON attendance_record_changes (student_id, changed_at DESC);

ALTER TABLE attendance_record_changes ENABLE ROW LEVEL SECURITY;

-- Read-only from the API. Rows arrive through the SECURITY DEFINER trigger
-- below, so there is deliberately no INSERT, UPDATE or DELETE policy: the log
-- cannot be rewritten by the same people it audits.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'attendance_record_changes'
      AND policyname = 'Course staff view attendance changes'
  ) THEN
    CREATE POLICY "Course staff view attendance changes" ON attendance_record_changes
    FOR SELECT USING (
      is_course_lecturer(course_section_id)
      OR is_university_admin(university_id)
      OR is_super_admin()
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'attendance_record_changes'
      AND policyname = 'Students view own attendance changes'
  ) THEN
    CREATE POLICY "Students view own attendance changes" ON attendance_record_changes
    FOR SELECT USING (student_id = auth.uid());
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION log_attendance_record_change()
RETURNS TRIGGER AS $$
DECLARE
  section_id UUID;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status::text IS NOT DISTINCT FROM OLD.status::text
     AND NEW.notes IS NOT DISTINCT FROM OLD.notes THEN
    RETURN NEW;
  END IF;

  section_id := NEW.course_section_id;
  IF section_id IS NULL AND NEW.session_id IS NOT NULL THEN
    SELECT course_section_id INTO section_id
    FROM attendance_sessions WHERE id = NEW.session_id;
  END IF;

  INSERT INTO attendance_record_changes (
    university_id, course_section_id, session_id, record_id, student_id,
    previous_status, new_status, previous_notes, new_notes, changed_by
  ) VALUES (
    NEW.university_id,
    section_id,
    NEW.session_id,
    NEW.id,
    NEW.student_id,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.status::text ELSE NULL END,
    NEW.status::text,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.notes ELSE NULL END,
    NEW.notes,
    COALESCE(auth.uid(), NEW.updated_by, NEW.created_by)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS log_attendance_record_change_trigger ON attendance_records;
CREATE TRIGGER log_attendance_record_change_trigger
  AFTER INSERT OR UPDATE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION log_attendance_record_change();

-- ---------------------------------------------------------------------------
-- 4. Data API grants, matching migration 026.
-- ---------------------------------------------------------------------------
GRANT SELECT ON public.attendance_record_changes TO authenticated;
GRANT ALL ON public.attendance_record_changes TO service_role;
