-- Lecturer write access for announcements and quiz content.
--
-- Both tables carried only a tenant SELECT policy plus an admin ALL policy, so
-- the lecturer-facing "Post announcement" and "Add question" flows failed with
-- "new row violates row-level security policy". Migration 015 added lecturer
-- policies for `quizzes` but not for the question and option rows underneath.
--
-- Scope in every case is the section the lecturer is assigned to teach.

CREATE POLICY "Lecturers manage section announcements" ON announcements
FOR ALL
USING (is_course_lecturer(course_section_id))
WITH CHECK (is_course_lecturer(course_section_id));

CREATE POLICY "Lecturers manage own quiz questions" ON quiz_questions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM quizzes q
    WHERE q.id = quiz_questions.quiz_id
      AND is_course_lecturer(q.course_section_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quizzes q
    WHERE q.id = quiz_questions.quiz_id
      AND is_course_lecturer(q.course_section_id)
  )
);

CREATE POLICY "Lecturers manage own quiz options" ON quiz_options
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM quiz_questions qq
    JOIN quizzes q ON q.id = qq.quiz_id
    WHERE qq.id = quiz_options.question_id
      AND is_course_lecturer(q.course_section_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quiz_questions qq
    JOIN quizzes q ON q.id = qq.quiz_id
    WHERE qq.id = quiz_options.question_id
      AND is_course_lecturer(q.course_section_id)
  )
);
