-- Close RLS policy coverage gaps surfaced by the production migration audit.

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant users view university settings" ON university_settings;
CREATE POLICY "Tenant users view university settings" ON university_settings
FOR SELECT USING (in_same_tenant(university_id));

DROP POLICY IF EXISTS "Admins manage university settings" ON university_settings;
CREATE POLICY "Admins manage university settings" ON university_settings
FOR ALL USING (is_university_admin(university_id) OR is_super_admin())
WITH CHECK (is_university_admin(university_id) OR is_super_admin());

DROP POLICY IF EXISTS "Tenant users view course lecturers" ON course_lecturers;
CREATE POLICY "Tenant users view course lecturers" ON course_lecturers
FOR SELECT USING (in_same_tenant(university_id));

DROP POLICY IF EXISTS "Admins manage course lecturers" ON course_lecturers;
CREATE POLICY "Admins manage course lecturers" ON course_lecturers
FOR ALL USING (is_university_admin(university_id) OR is_super_admin())
WITH CHECK (is_university_admin(university_id) OR is_super_admin());

DROP POLICY IF EXISTS "Students manage own lesson progress" ON lesson_progress;
CREATE POLICY "Students manage own lesson progress" ON lesson_progress
FOR ALL USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Course staff view lesson progress" ON lesson_progress;
CREATE POLICY "Course staff view lesson progress" ON lesson_progress
FOR SELECT USING (
  is_university_admin(university_id)
  OR is_super_admin()
  OR EXISTS (
    SELECT 1
    FROM lessons
    JOIN course_modules ON course_modules.id = lessons.module_id
    JOIN course_sections ON course_sections.course_id = course_modules.course_id
    WHERE lessons.id = lesson_progress.lesson_id
      AND is_course_lecturer(course_sections.id)
  )
);

DROP POLICY IF EXISTS "Tenant users view video assets" ON video_assets;
CREATE POLICY "Tenant users view video assets" ON video_assets
FOR SELECT USING (in_same_tenant(university_id));

DROP POLICY IF EXISTS "Course staff manage video assets" ON video_assets;
CREATE POLICY "Course staff manage video assets" ON video_assets
FOR ALL USING (
  is_university_admin(university_id)
  OR is_super_admin()
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM course_sections
    WHERE course_sections.course_id = video_assets.course_id
      AND is_course_lecturer(course_sections.id)
  )
  OR EXISTS (
    SELECT 1
    FROM lessons
    JOIN course_modules ON course_modules.id = lessons.module_id
    JOIN course_sections ON course_sections.course_id = course_modules.course_id
    WHERE lessons.id = video_assets.lesson_id
      AND is_course_lecturer(course_sections.id)
  )
) WITH CHECK (
  is_university_admin(university_id)
  OR is_super_admin()
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM course_sections
    WHERE course_sections.course_id = video_assets.course_id
      AND is_course_lecturer(course_sections.id)
  )
  OR EXISTS (
    SELECT 1
    FROM lessons
    JOIN course_modules ON course_modules.id = lessons.module_id
    JOIN course_sections ON course_sections.course_id = course_modules.course_id
    WHERE lessons.id = video_assets.lesson_id
      AND is_course_lecturer(course_sections.id)
  )
);

DROP POLICY IF EXISTS "Tenant users view live class recordings" ON live_class_recordings;
CREATE POLICY "Tenant users view live class recordings" ON live_class_recordings
FOR SELECT USING (in_same_tenant(university_id));

DROP POLICY IF EXISTS "Course staff manage live class recordings" ON live_class_recordings;
CREATE POLICY "Course staff manage live class recordings" ON live_class_recordings
FOR ALL USING (
  is_university_admin(university_id)
  OR is_super_admin()
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM live_classes
    WHERE live_classes.id = live_class_recordings.live_class_id
      AND is_course_lecturer(live_classes.course_section_id)
  )
) WITH CHECK (
  is_university_admin(university_id)
  OR is_super_admin()
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM live_classes
    WHERE live_classes.id = live_class_recordings.live_class_id
      AND is_course_lecturer(live_classes.course_section_id)
  )
);

DROP POLICY IF EXISTS "Authenticated users view role permissions" ON role_permissions;
CREATE POLICY "Authenticated users view role permissions" ON role_permissions
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Super admins manage role permissions" ON role_permissions;
CREATE POLICY "Super admins manage role permissions" ON role_permissions
FOR ALL USING (is_super_admin())
WITH CHECK (is_super_admin());
