-- Compulsory training.
--
-- An enrollment says a person may take a course. An assignment says they must,
-- and by when. Enrollment cannot express a deadline, and a deadline is the
-- whole of what compliance reporting reads.

CREATE TABLE IF NOT EXISTS training_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    course_section_id UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    due_on DATE,
    assigned_by UUID REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    -- Set when this assignment exists to renew a certificate that lapsed.
    renews_certificate_id UUID REFERENCES certificates(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (course_section_id, student_id)
);

CREATE INDEX IF NOT EXISTS training_assignments_student_idx
  ON training_assignments (student_id, due_on);
CREATE INDEX IF NOT EXISTS training_assignments_section_idx
  ON training_assignments (course_section_id, due_on);
CREATE INDEX IF NOT EXISTS training_assignments_outstanding_idx
  ON training_assignments (university_id, due_on)
  WHERE completed_at IS NULL AND cancelled_at IS NULL;

ALTER TABLE training_assignments ENABLE ROW LEVEL SECURITY;

DO $BODY$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'training_assignments'
      AND policyname = 'Learners view own assignments'
  ) THEN
    CREATE POLICY "Learners view own assignments" ON training_assignments
    FOR SELECT USING (student_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'training_assignments'
      AND policyname = 'Course staff view assignments'
  ) THEN
    CREATE POLICY "Course staff view assignments" ON training_assignments
    FOR SELECT USING (
      is_course_lecturer(course_section_id) OR is_university_admin(university_id) OR is_super_admin()
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'training_assignments'
      AND policyname = 'Course staff assign training'
  ) THEN
    CREATE POLICY "Course staff assign training" ON training_assignments
    FOR INSERT WITH CHECK (
      in_same_tenant(university_id)
      AND (is_course_lecturer(course_section_id) OR is_university_admin(university_id) OR is_super_admin())
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'training_assignments'
      AND policyname = 'Course staff update assignments'
  ) THEN
    -- Completion and cancellation are updates. There is deliberately no DELETE
    -- policy: a withdrawn assignment is evidence, like a revoked certificate.
    CREATE POLICY "Course staff update assignments" ON training_assignments
    FOR UPDATE USING (
      is_course_lecturer(course_section_id) OR is_university_admin(university_id) OR is_super_admin()
    );
  END IF;
END;
$BODY$;

GRANT SELECT, INSERT, UPDATE ON public.training_assignments TO authenticated;
GRANT ALL ON public.training_assignments TO service_role;
