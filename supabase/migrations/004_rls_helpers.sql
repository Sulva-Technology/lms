-- RLS Helper Functions

CREATE OR REPLACE FUNCTION auth_user_id() RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_profile_id() RETURNS UUID AS $$
  SELECT id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_university_id() RETURNS UUID AS $$
  SELECT university_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_role() RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
  SELECT current_user_role() = 'super_admin'::user_role;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_university_admin(check_uni_id UUID) RETURNS BOOLEAN AS $$
  SELECT (current_user_role() = 'admin'::user_role AND current_university_id() = check_uni_id);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_course_lecturer(check_section_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM course_lecturers 
    WHERE course_section_id = check_section_id AND lecturer_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_course_student(check_section_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM course_enrollments 
    WHERE course_section_id = check_section_id AND student_id = auth.uid() AND status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION in_same_tenant(tenant_id UUID) RETURNS BOOLEAN AS $$
  SELECT is_super_admin() OR tenant_id = current_university_id();
$$ LANGUAGE sql STABLE SECURITY DEFINER;
