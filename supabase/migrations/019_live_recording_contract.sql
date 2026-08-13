-- Align Daily recording webhooks, recording lists, and unified video assets.

ALTER TABLE live_class_recordings ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE live_class_recordings ADD COLUMN IF NOT EXISTS provider_recording_id TEXT;
ALTER TABLE live_class_recordings ADD COLUMN IF NOT EXISTS recording_url TEXT;
ALTER TABLE live_class_recordings ADD COLUMN IF NOT EXISTS playback_url TEXT;
ALTER TABLE live_class_recordings ADD COLUMN IF NOT EXISTS s3_key TEXT;
ALTER TABLE live_class_recordings ADD COLUMN IF NOT EXISTS provider_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE live_class_recordings lcr
SET course_id = live_classes.course_id
FROM live_classes
WHERE live_classes.id = lcr.live_class_id
  AND lcr.course_id IS NULL;

UPDATE live_class_recordings
SET recording_url = COALESCE(recording_url, playback_url),
    playback_url = COALESCE(playback_url, recording_url)
WHERE recording_url IS NULL OR playback_url IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS live_class_recordings_provider_recording_key
ON live_class_recordings(provider_recording_id)
WHERE provider_recording_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS live_class_recordings_course_created_idx
ON live_class_recordings(course_id, created_at DESC);
