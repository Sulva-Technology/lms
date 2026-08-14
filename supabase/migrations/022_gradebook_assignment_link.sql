-- Grading an assignment submission upserts a row into the generic `grades`
-- table, which needs a `grade_items` row to hang off. Previously that lookup
-- keyed on a name built from the submission id while the insert used a fixed
-- name, so the lookup never matched and every grading call created another
-- duplicate grade item.
--
-- Linking grade items to their assignment gives that lookup a real key.
ALTER TABLE grade_items ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_grade_items_assignment
  ON grade_items (assignment_id) WHERE assignment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_grade_items_section ON grade_items (course_section_id);

-- `grades` is upserted on (grade_item_id, student_id); make that conflict
-- target real so the upsert cannot silently duplicate.
CREATE UNIQUE INDEX IF NOT EXISTS idx_grades_item_student ON grades (grade_item_id, student_id);

-- GradeService records who graded and when when it mirrors a submission score
-- into the gradebook. Those columns never existed, so the upsert failed
-- silently and the gradebook stayed empty.
ALTER TABLE grades ADD COLUMN IF NOT EXISTS graded_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE grades ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ;
