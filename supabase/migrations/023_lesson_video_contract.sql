-- Lesson video is hosted in Supabase Storage rather than an external provider.
-- A video asset therefore points at an object key in the private `lesson-video`
-- bucket, and playback happens through a short-lived signed URL minted per page
-- render. `asset_id` stays for provider-agnostic compatibility but is no longer
-- required, because there is no external asset to reference.
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS content_type TEXT;
ALTER TABLE video_assets ALTER COLUMN asset_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_video_assets_lesson ON video_assets (lesson_id);
CREATE INDEX IF NOT EXISTS idx_video_assets_course ON video_assets (course_id);

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_duration INTEGER;

-- A lesson has at most one active video asset. Replacing a video deletes the
-- previous row, so this stays a clean one-to-one.
CREATE UNIQUE INDEX IF NOT EXISTS idx_video_assets_one_per_lesson
  ON video_assets (lesson_id) WHERE lesson_id IS NOT NULL;
