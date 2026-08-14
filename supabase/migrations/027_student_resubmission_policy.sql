-- Resubmission.
--
-- `assignments.max_resubmissions` and the "Resubmit" button both promise a
-- student can replace their work before it is graded, but the only UPDATE
-- policy on assignment_submissions was "Lecturers grade submissions". Every
-- resubmission therefore updated zero rows and surfaced as
-- "Cannot coerce the result to a single JSON object".
--
-- A student may update their own submission while it is still ungraded. The
-- WITH CHECK clause repeats the ownership test so the row cannot be reassigned
-- to another student, and blocks a student from marking their own work graded.
CREATE POLICY "Students update own ungraded submissions" ON assignment_submissions
FOR UPDATE
USING (
  student_id = auth.uid()
  AND COALESCE(status, 'submitted') <> 'graded'
)
WITH CHECK (
  student_id = auth.uid()
  AND COALESCE(status, 'submitted') <> 'graded'
);
