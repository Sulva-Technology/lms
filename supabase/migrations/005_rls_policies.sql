-- Enable RLS on ALL tables
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lecturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_class_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_class_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Universities
CREATE POLICY "Public universities viewable by all" ON universities FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Super admins can manage universities" ON universities FOR ALL USING (is_super_admin());

-- Profiles
CREATE POLICY "Users view profiles in same university" ON profiles FOR SELECT USING (in_same_tenant(university_id));
CREATE POLICY "Users edit own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins manage university profiles" ON profiles FOR ALL USING (is_university_admin(university_id) OR is_super_admin());

-- Academic Structure (Read-only for most, editable by admins)
CREATE POLICY "View academic structure" ON faculties FOR SELECT USING (in_same_tenant(university_id));
CREATE POLICY "Manage academic structure" ON faculties FOR ALL USING (is_university_admin(university_id) OR is_super_admin());

DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN SELECT unnest(ARRAY['departments', 'programs', 'academic_sessions', 'semesters', 'courses', 'course_sections'])
    LOOP
        EXECUTE format('CREATE POLICY "View %I" ON %I FOR SELECT USING (in_same_tenant(university_id));', t_name, t_name);
        EXECUTE format('CREATE POLICY "Admin manage %I" ON %I FOR ALL USING (is_university_admin(university_id) OR is_super_admin());', t_name, t_name);
    END LOOP;
END;
$$;

-- Lecturers can edit courses they teach
CREATE POLICY "Lecturers manage their course modules" ON course_modules FOR ALL 
USING (is_university_admin(university_id) OR is_super_admin() OR is_course_lecturer((SELECT course_sections.id FROM course_sections WHERE course_sections.course_id = course_modules.course_id LIMIT 1)));
CREATE POLICY "View modules" ON course_modules FOR SELECT USING (in_same_tenant(university_id));

CREATE POLICY "Lecturers manage their lessons" ON lessons FOR ALL 
USING (is_university_admin(university_id) OR is_super_admin() OR is_course_lecturer((SELECT course_sections.id FROM course_sections JOIN course_modules m ON m.course_id = course_sections.course_id WHERE m.id = lessons.module_id LIMIT 1)));
CREATE POLICY "View lessons" ON lessons FOR SELECT USING (in_same_tenant(university_id));

-- Enrollments: Students see their own, lecturers see their enrolled students
CREATE POLICY "View own enrollments" ON course_enrollments FOR SELECT USING (student_id = auth.uid() OR is_course_lecturer(course_section_id) OR is_university_admin(university_id) OR is_super_admin());

-- Submissions: Students manage own, lecturers read/grade
CREATE POLICY "Students insert own submissions" ON assignment_submissions FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students view/update own submissions" ON assignment_submissions FOR SELECT USING (student_id = auth.uid() OR is_course_lecturer((SELECT course_section_id FROM assignments WHERE assignments.id = assignment_submissions.assignment_id LIMIT 1)) OR is_university_admin(university_id));
CREATE POLICY "Lecturers grade submissions" ON assignment_submissions FOR UPDATE USING (is_course_lecturer((SELECT course_section_id FROM assignments WHERE assignments.id = assignment_submissions.assignment_id LIMIT 1)) OR is_university_admin(university_id));

-- Quizzes (Attempts & Answers)
CREATE POLICY "Students manage own attempts" ON quiz_attempts FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Lecturers view attempts" ON quiz_attempts FOR SELECT USING (is_course_lecturer((SELECT course_section_id FROM quizzes WHERE quizzes.id = quiz_attempts.quiz_id LIMIT 1)));

CREATE POLICY "Students manage own answers" ON quiz_answers FOR ALL USING ((SELECT student_id FROM quiz_attempts WHERE quiz_attempts.id = quiz_answers.attempt_id LIMIT 1) = auth.uid());
CREATE POLICY "Lecturers view answers" ON quiz_answers FOR SELECT USING (is_course_lecturer((SELECT course_section_id FROM quizzes JOIN quiz_attempts ON quiz_attempts.quiz_id = quizzes.id WHERE quiz_attempts.id = quiz_answers.attempt_id LIMIT 1)));

-- Notifications & Events
CREATE POLICY "View own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "View own events" ON calendar_events FOR SELECT USING (user_id = auth.uid() OR in_same_tenant(university_id));

-- Audit Logs
CREATE POLICY "Only super admins and admins view audit logs" ON audit_logs FOR SELECT USING (is_super_admin() OR is_university_admin(university_id));

-- Safety catch for remaining tables to let users view things in their tenant
DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN SELECT unnest(ARRAY['assignments', 'quizzes', 'quiz_questions', 'quiz_options', 'live_classes', 'files', 'announcements', 'discussions', 'discussion_replies', 'grade_items', 'grades'])
    LOOP
        EXECUTE format('CREATE POLICY "Tenant view %I" ON %I FOR SELECT USING (in_same_tenant(university_id));', t_name, t_name);
        EXECUTE format('CREATE POLICY "Admin manage %I" ON %I FOR ALL USING (is_university_admin(university_id) OR is_super_admin());', t_name, t_name);
    END LOOP;
END;
$$;
