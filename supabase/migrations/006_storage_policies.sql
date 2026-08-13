-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('vui_public', 'vui_public', true),
('vui_materials', 'vui_materials', false),
('vui_submissions', 'vui_submissions', false),
('vui_profiles', 'vui_profiles', true)
ON CONFLICT DO NOTHING;

-- RLS for storage.objects
-- Profiles: Any authenticated user can upload their own profile pic
CREATE POLICY "Users can upload their own profile image" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'vui_profiles' AND auth.role() = 'authenticated');

CREATE POLICY "Profile images are public" ON storage.objects FOR SELECT 
USING (bucket_id = 'vui_profiles');

-- Materials: Lecturers/Admins can upload
CREATE POLICY "Lecturers can upload materials" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vui_materials' AND auth.role() = 'authenticated');

CREATE POLICY "Tenant users can view materials" ON storage.objects FOR SELECT
USING (bucket_id = 'vui_materials' AND auth.role() = 'authenticated');

-- Submissions: Students upload to submissions
CREATE POLICY "Students can upload submissions" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vui_submissions' AND auth.role() = 'authenticated');

CREATE POLICY "Lecturers and students can view submissions" ON storage.objects FOR SELECT
USING (bucket_id = 'vui_submissions' AND auth.role() = 'authenticated');
