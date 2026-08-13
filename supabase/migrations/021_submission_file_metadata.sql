-- Submissions keep an array of storage paths for backwards compatibility and a
-- structured JSONB copy carrying the original file name, size, and MIME type,
-- because a bare path cannot be rendered as a readable attachment label.
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS file_metadata JSONB DEFAULT '[]'::jsonb;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS feedback_file_metadata JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_student
  ON assignment_submissions (assignment_id, student_id);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status
  ON assignment_submissions (assignment_id, status);
