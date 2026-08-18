-- Live classes had RLS enabled in 005 but only ever received the catch-all
-- tenant SELECT plus an admin FOR ALL policy. Lecturers could therefore never
-- insert, update, or cancel a live class: the Daily room was created and the
-- database write was refused, leaving an orphan room behind.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'live_classes'
      AND policyname = 'Lecturers schedule live classes'
  ) THEN
    CREATE POLICY "Lecturers schedule live classes" ON live_classes
    FOR INSERT WITH CHECK (
      in_same_tenant(university_id)
      AND lecturer_id = auth.uid()
      AND is_course_lecturer(course_section_id)
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'live_classes'
      AND policyname = 'Lecturers update own live classes'
  ) THEN
    CREATE POLICY "Lecturers update own live classes" ON live_classes
    FOR UPDATE
    USING (in_same_tenant(university_id) AND is_course_lecturer(course_section_id))
    WITH CHECK (in_same_tenant(university_id) AND is_course_lecturer(course_section_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'live_classes'
      AND policyname = 'Lecturers delete own live classes'
  ) THEN
    CREATE POLICY "Lecturers delete own live classes" ON live_classes
    FOR DELETE USING (
      in_same_tenant(university_id) AND is_course_lecturer(course_section_id)
    );
  END IF;
END;
$$;
