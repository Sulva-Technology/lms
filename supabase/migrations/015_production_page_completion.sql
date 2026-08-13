-- Production completion contracts for remaining LMS pages.

ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS instructions TEXT;

ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS max_score DECIMAL(7,2);
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS percentage DECIMAL(5,2);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_asset_id UUID REFERENCES video_assets(id) ON DELETE SET NULL;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS playback_url TEXT;

CREATE INDEX IF NOT EXISTS quizzes_section_published_idx ON quizzes(course_section_id, is_published, start_time);
CREATE INDEX IF NOT EXISTS quizzes_university_created_idx ON quizzes(university_id, created_at DESC);
CREATE INDEX IF NOT EXISTS quiz_questions_quiz_order_idx ON quiz_questions(quiz_id, order_index);
CREATE INDEX IF NOT EXISTS quiz_options_question_idx ON quiz_options(question_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_quiz_student_status_idx ON quiz_attempts(quiz_id, student_id, status);
CREATE INDEX IF NOT EXISTS support_tickets_status_priority_idx ON support_tickets(status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS platform_settings_updated_idx ON platform_settings(updated_at DESC);

DROP POLICY IF EXISTS "Lecturers manage assigned quizzes" ON quizzes;
CREATE POLICY "Lecturers manage assigned quizzes" ON quizzes
  FOR ALL
  USING (is_super_admin() OR is_university_admin(university_id) OR is_course_lecturer(course_section_id))
  WITH CHECK (is_super_admin() OR is_university_admin(university_id) OR is_course_lecturer(course_section_id));

DROP POLICY IF EXISTS "Students view published quizzes" ON quizzes;
CREATE POLICY "Students view published quizzes" ON quizzes
  FOR SELECT
  USING (
    is_published
    AND EXISTS (
      SELECT 1
      FROM course_enrollments
      WHERE course_enrollments.course_section_id = quizzes.course_section_id
        AND course_enrollments.student_id = auth.uid()
        AND course_enrollments.status = 'active'
    )
  );
