-- Full CRUD archival contracts for production LMS management flows.

ALTER TABLE faculties ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE course_sections ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE course_modules ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS faculties_university_active_idx ON faculties(university_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS departments_university_active_idx ON departments(university_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS programs_university_active_idx ON programs(university_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS courses_university_active_idx ON courses(university_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS course_sections_university_active_idx ON course_sections(university_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS course_modules_course_active_idx ON course_modules(course_id, order_index) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS lessons_module_active_idx ON lessons(module_id, order_index) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS assignments_section_active_idx ON assignments(course_section_id, due_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS announcements_author_active_idx ON announcements(author_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS live_classes_section_active_idx ON live_classes(course_section_id, start_time) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS lesson_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    video_asset_id UUID REFERENCES video_assets(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    material_type TEXT NOT NULL CHECK (material_type IN ('file', 'link', 'video')),
    url TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_lesson_materials_modtime ON lesson_materials;
CREATE TRIGGER update_lesson_materials_modtime BEFORE UPDATE ON lesson_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE lesson_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lesson material visibility" ON lesson_materials;
CREATE POLICY "Lesson material visibility" ON lesson_materials FOR SELECT USING (
  in_same_tenant(university_id)
);

DROP POLICY IF EXISTS "Lesson material management" ON lesson_materials;
CREATE POLICY "Lesson material management" ON lesson_materials FOR ALL USING (
  is_super_admin()
  OR is_university_admin(university_id)
  OR EXISTS (
    SELECT 1
    FROM lessons
    JOIN course_modules ON course_modules.id = lessons.module_id
    JOIN course_sections ON course_sections.course_id = course_modules.course_id
    WHERE lessons.id = lesson_materials.lesson_id
      AND is_course_lecturer(course_sections.id)
  )
) WITH CHECK (
  is_super_admin()
  OR is_university_admin(university_id)
  OR EXISTS (
    SELECT 1
    FROM lessons
    JOIN course_modules ON course_modules.id = lessons.module_id
    JOIN course_sections ON course_sections.course_id = course_modules.course_id
    WHERE lessons.id = lesson_materials.lesson_id
      AND is_course_lecturer(course_sections.id)
  )
);
