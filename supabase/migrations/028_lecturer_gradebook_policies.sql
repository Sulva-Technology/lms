-- Gradebook write access for lecturers.
--
-- `grade_items` and `grades` only had "Admin manage ..." policies, so a
-- lecturer could not create a grade item and, more quietly, the mirror step in
-- GradeService could not write the row it creates when grading a submission.
-- Grading a submission therefore looked successful while the gradebook stayed
-- empty.
--
-- Scope: a lecturer may manage grade items for sections they are assigned to,
-- and the grades hanging off those items. `is_course_lecturer` already
-- encapsulates the assignment check.

CREATE POLICY "Lecturers manage own section grade_items" ON grade_items
FOR ALL
USING (is_course_lecturer(course_section_id))
WITH CHECK (is_course_lecturer(course_section_id));

CREATE POLICY "Lecturers manage own section grades" ON grades
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM grade_items gi
    WHERE gi.id = grades.grade_item_id
      AND is_course_lecturer(gi.course_section_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM grade_items gi
    WHERE gi.id = grades.grade_item_id
      AND is_course_lecturer(gi.course_section_id)
  )
);

-- Students must be able to read their own grades even when the tenant-wide
-- SELECT policy is later tightened.
CREATE POLICY "Students view own grades" ON grades
FOR SELECT
USING (student_id = auth.uid());
