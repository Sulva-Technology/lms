-- Completion certificates.
--
-- Training organisations need evidence a person finished a programme, which the
-- schema had nowhere to record: progress and grades existed, but nothing turned
-- them into something a learner could show an employer or a regulator.

-- Optional bar a learner must clear on the gradebook before a certificate can
-- be issued. NULL means completion of the material is enough on its own.
ALTER TABLE courses ADD COLUMN IF NOT EXISTS pass_mark SMALLINT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'courses_pass_mark_range') THEN
    ALTER TABLE courses
      ADD CONSTRAINT courses_pass_mark_range CHECK (pass_mark IS NULL OR pass_mark BETWEEN 0 AND 100);
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    course_section_id UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    -- Public, unguessable, and printed on the certificate itself.
    serial TEXT NOT NULL UNIQUE,
    issued_by UUID REFERENCES profiles(id),
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lessons_completed INTEGER NOT NULL DEFAULT 0,
    lessons_total INTEGER NOT NULL DEFAULT 0,
    final_score NUMERIC(5,2),
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    -- Frozen copy of the names as they read at issue time, so a later rename of
    -- a course or a person never rewrites history on an issued certificate.
    snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (course_section_id, student_id)
);

CREATE INDEX IF NOT EXISTS certificates_student_idx ON certificates (student_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS certificates_section_idx ON certificates (course_section_id, issued_at DESC);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'certificates'
      AND policyname = 'Students view own certificates'
  ) THEN
    CREATE POLICY "Students view own certificates" ON certificates
    FOR SELECT USING (student_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'certificates'
      AND policyname = 'Course staff view certificates'
  ) THEN
    CREATE POLICY "Course staff view certificates" ON certificates
    FOR SELECT USING (
      is_course_lecturer(course_section_id) OR is_university_admin(university_id) OR is_super_admin()
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'certificates'
      AND policyname = 'Course staff issue certificates'
  ) THEN
    CREATE POLICY "Course staff issue certificates" ON certificates
    FOR INSERT WITH CHECK (
      in_same_tenant(university_id)
      AND (is_course_lecturer(course_section_id) OR is_university_admin(university_id) OR is_super_admin())
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'certificates'
      AND policyname = 'Course staff revoke certificates'
  ) THEN
    -- Revocation is an UPDATE; there is deliberately no DELETE policy, so an
    -- issued certificate can be withdrawn but never quietly disappear.
    CREATE POLICY "Course staff revoke certificates" ON certificates
    FOR UPDATE USING (
      is_course_lecturer(course_section_id) OR is_university_admin(university_id) OR is_super_admin()
    );
  END IF;
END;
$$;

GRANT SELECT, INSERT, UPDATE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
