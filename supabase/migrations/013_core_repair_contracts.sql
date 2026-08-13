-- Core repair contracts for invite-first LMS runtime.

-- Live classes: keep the original title/end_time contract while supporting
-- service-layer fields used by the app.
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS lecturer_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS duration INTEGER;

UPDATE live_classes
SET topic = COALESCE(topic, title)
WHERE topic IS NULL;

UPDATE live_classes lc
SET course_id = cs.course_id
FROM course_sections cs
WHERE lc.course_section_id = cs.id
  AND lc.course_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_live_classes_lecturer ON live_classes(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_section_time ON live_classes(course_section_id, start_time);

-- Participants need to support lecturers/hosts as well as students.
ALTER TABLE live_class_participants ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE live_class_participants ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('host', 'guest'));
ALTER TABLE live_class_participants ALTER COLUMN student_id DROP NOT NULL;

UPDATE live_class_participants
SET user_id = COALESCE(user_id, student_id),
    role = COALESCE(role, 'guest')
WHERE user_id IS NULL OR role IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS live_class_participants_class_user_key
ON live_class_participants(live_class_id, user_id)
WHERE user_id IS NOT NULL;

-- The initial schema created attendance_records before attendance_sessions.
-- Add the session-based columns expected by the application while preserving
-- the original course/date columns.
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS attendance_records_session_student_key
ON attendance_records(session_id, student_id)
WHERE session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS attendance_sessions_section_date_key
ON attendance_sessions(course_section_id, date);

-- Gradebook service compatibility.
ALTER TABLE grade_items ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE grade_items ADD COLUMN IF NOT EXISTS max_score DECIMAL(5,2) NOT NULL DEFAULT 100;
ALTER TABLE grade_items ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2);

UPDATE grade_items
SET name = COALESCE(name, title),
    weight = COALESCE(weight, weight_percentage)
WHERE name IS NULL OR weight IS NULL;

-- Platform-level audit events, such as super-admin invites, do not belong to
-- a single tenant.
ALTER TABLE audit_logs ALTER COLUMN university_id DROP NOT NULL;

-- RLS policies for tables introduced or repaired after the original catch-all.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'course_registrations' AND policyname = 'View course registrations'
  ) THEN
    CREATE POLICY "View course registrations" ON course_registrations
    FOR SELECT USING (student_id = auth.uid() OR is_university_admin(university_id) OR is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'course_registrations' AND policyname = 'Students create own registrations'
  ) THEN
    CREATE POLICY "Students create own registrations" ON course_registrations
    FOR INSERT WITH CHECK (student_id = auth.uid() OR is_university_admin(university_id) OR is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'course_registrations' AND policyname = 'Students update own registrations'
  ) THEN
    CREATE POLICY "Students update own registrations" ON course_registrations
    FOR UPDATE USING (student_id = auth.uid() OR is_university_admin(university_id) OR is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'live_class_participants' AND policyname = 'Users join visible live classes'
  ) THEN
    CREATE POLICY "Users join visible live classes" ON live_class_participants
    FOR INSERT WITH CHECK (user_id = auth.uid() OR student_id = auth.uid() OR is_university_admin(university_id) OR is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'live_class_participants' AND policyname = 'Users view live participants'
  ) THEN
    CREATE POLICY "Users view live participants" ON live_class_participants
    FOR SELECT USING (in_same_tenant(university_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'live_class_participants' AND policyname = 'Users update own live participant row'
  ) THEN
    CREATE POLICY "Users update own live participant row" ON live_class_participants
    FOR UPDATE USING (user_id = auth.uid() OR student_id = auth.uid() OR is_university_admin(university_id) OR is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendance_sessions' AND policyname = 'View attendance sessions'
  ) THEN
    CREATE POLICY "View attendance sessions" ON attendance_sessions
    FOR SELECT USING (in_same_tenant(university_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendance_sessions' AND policyname = 'Lecturers manage attendance sessions'
  ) THEN
    CREATE POLICY "Lecturers manage attendance sessions" ON attendance_sessions
    FOR ALL USING (is_university_admin(university_id) OR is_super_admin() OR is_course_lecturer(course_section_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendance_records' AND policyname = 'View attendance records'
  ) THEN
    CREATE POLICY "View attendance records" ON attendance_records
    FOR SELECT USING (student_id = auth.uid() OR is_university_admin(university_id) OR is_super_admin() OR is_course_lecturer(course_section_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendance_records' AND policyname = 'Lecturers manage attendance records'
  ) THEN
    CREATE POLICY "Lecturers manage attendance records" ON attendance_records
    FOR ALL USING (is_university_admin(university_id) OR is_super_admin() OR is_course_lecturer(course_section_id));
  END IF;
END;
$$;
