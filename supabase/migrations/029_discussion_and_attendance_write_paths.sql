-- Two write paths that the UI offers but the database refused.

-- ---------------------------------------------------------------------------
-- 1. Discussions.
--
-- `discussions` and `discussion_replies` only had tenant SELECT plus an admin
-- ALL policy, so a student could read a board but never post to it, and a
-- lecturer could not answer or close a thread. Membership is the gate: active
-- enrollment for students, section assignment for lecturers.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_section_member(check_section_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    is_course_lecturer(check_section_id)
    OR EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_section_id = check_section_id
        AND student_id = auth.uid()
        AND status = 'active'
    );
$$;

CREATE POLICY "Members create discussions" ON discussions
FOR INSERT
WITH CHECK (author_id = auth.uid() AND is_section_member(course_section_id));

CREATE POLICY "Authors update own discussions" ON discussions
FOR UPDATE
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

-- Closing a question as answered is a lecturer action on someone else's row.
CREATE POLICY "Lecturers resolve section discussions" ON discussions
FOR UPDATE
USING (is_course_lecturer(course_section_id))
WITH CHECK (is_course_lecturer(course_section_id));

CREATE POLICY "Members reply to discussions" ON discussion_replies
FOR INSERT
WITH CHECK (
  author_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM discussions d
    WHERE d.id = discussion_replies.discussion_id
      AND is_section_member(d.course_section_id)
  )
);

CREATE POLICY "Authors update own replies" ON discussion_replies
FOR UPDATE
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. Attendance.
--
-- AttendanceService upserts on (session_id, student_id), but the only matching
-- unique index was partial (`WHERE session_id IS NOT NULL`). Postgres will not
-- use a partial index as an ON CONFLICT arbiter unless the statement repeats
-- the predicate, so every roll call failed with "there is no unique or
-- exclusion constraint matching the ON CONFLICT specification".
-- ---------------------------------------------------------------------------
DROP INDEX IF EXISTS attendance_records_session_student_key;

CREATE UNIQUE INDEX IF NOT EXISTS attendance_records_session_student_key
  ON attendance_records (session_id, student_id);
