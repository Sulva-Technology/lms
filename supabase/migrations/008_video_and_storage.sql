-- Alter video_assets to add requested fields
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS captions_url TEXT;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS transcript_url TEXT;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private';
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS download_permission BOOLEAN DEFAULT false;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS watermark_setting TEXT;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS live_class_id UUID REFERENCES live_classes(id) ON DELETE SET NULL;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS recording_id UUID REFERENCES live_class_recordings(id) ON DELETE SET NULL;

-- Ensure storage buckets exist
INSERT INTO storage.buckets (id, name, public) VALUES 
('profile-images', 'profile-images', true),
('university-branding', 'university-branding', true),
('course-resources', 'course-resources', false),
('assignment-submissions', 'assignment-submissions', false),
('lecture-thumbnails', 'lecture-thumbnails', true),
('transcripts', 'transcripts', false),
('exports', 'exports', false)
ON CONFLICT DO NOTHING;

-- Set up proper Storage RLS
CREATE POLICY "Public profile images viewable" ON storage.objects FOR SELECT USING (bucket_id = 'profile-images');
CREATE POLICY "Users can upload profile images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-images' AND auth.role() = 'authenticated');

CREATE POLICY "Public university branding" ON storage.objects FOR SELECT USING (bucket_id = 'university-branding');
CREATE POLICY "Admins upload university branding" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'university-branding' AND is_university_admin((auth.jwt() ->> 'university_id')::uuid));

CREATE POLICY "Tenant read course resources" ON storage.objects FOR SELECT USING (bucket_id = 'course-resources' AND auth.role() = 'authenticated');
CREATE POLICY "Lecturers admins upload course resources" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'course-resources' AND auth.role() = 'authenticated');

CREATE POLICY "Tenant view lecture thumbnails" ON storage.objects FOR SELECT USING (bucket_id = 'lecture-thumbnails');

CREATE POLICY "Tenant read transcripts" ON storage.objects FOR SELECT USING (bucket_id = 'transcripts' AND auth.role() = 'authenticated');

CREATE POLICY "Read exports" ON storage.objects FOR SELECT USING (bucket_id = 'exports' AND auth.role() = 'authenticated' AND (owner = auth.uid()));
CREATE POLICY "Create exports" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'exports' AND auth.role() = 'authenticated');
