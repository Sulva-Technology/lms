-- Registration & Extended LMS Entities

CREATE TABLE registration_windows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    add_drop_deadline TIMESTAMPTZ NOT NULL,
    min_credits INTEGER NOT NULL DEFAULT 12,
    max_credits INTEGER NOT NULL DEFAULT 24,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE course_prerequisites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    prerequisite_course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(course_id, prerequisite_course_id)
);

CREATE TABLE program_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    level INTEGER NOT NULL,
    is_compulsory BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(program_id, course_id)
);

CREATE TABLE course_registration_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    registration_id UUID NOT NULL REFERENCES course_registrations(id) ON DELETE CASCADE,
    course_section_id UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'registered',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(registration_id, course_section_id)
);

CREATE TABLE student_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    video_timestamp INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers
CREATE TRIGGER update_reg_windows_modtime BEFORE UPDATE ON registration_windows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_notes_modtime BEFORE UPDATE ON student_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS enable
ALTER TABLE registration_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_registration_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "View reg windows" ON registration_windows FOR SELECT USING (in_same_tenant(university_id));
CREATE POLICY "Admin manage reg windows" ON registration_windows FOR ALL USING (is_university_admin(university_id) OR is_super_admin());

CREATE POLICY "Public prereqs" ON course_prerequisites FOR SELECT USING (true);
CREATE POLICY "Admin manage prereqs" ON course_prerequisites FOR ALL USING (is_super_admin() OR is_university_admin((SELECT university_id FROM courses WHERE courses.id = course_id)));

CREATE POLICY "Public program courses" ON program_courses FOR SELECT USING (true);
CREATE POLICY "Admin manage program courses" ON program_courses FOR ALL USING (is_super_admin() OR is_university_admin((SELECT university_id FROM programs WHERE programs.id = program_id LIMIT 1)));

CREATE POLICY "View reg items" ON course_registration_items FOR SELECT USING (
    in_same_tenant(university_id)
);
CREATE POLICY "Insert own reg items" ON course_registration_items FOR INSERT WITH CHECK (
    (SELECT student_id FROM course_registrations WHERE course_registrations.id = registration_id LIMIT 1) = auth.uid()
    OR is_university_admin(university_id) OR is_super_admin()
);
CREATE POLICY "Update own reg items" ON course_registration_items FOR UPDATE USING (
    (SELECT student_id FROM course_registrations WHERE course_registrations.id = registration_id LIMIT 1) = auth.uid()
    OR is_university_admin(university_id) OR is_super_admin()
);

CREATE POLICY "Student own notes" ON student_notes FOR ALL USING (student_id = auth.uid());
