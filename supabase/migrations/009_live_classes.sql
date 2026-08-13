-- Add fields to abstract live class
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS is_recording_enabled BOOLEAN DEFAULT false;
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS is_waiting_room_enabled BOOLEAN DEFAULT false;
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS join_before_host BOOLEAN DEFAULT false;
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS tracking_rule TEXT DEFAULT 'duration'; -- 'duration' or 'join'
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS provider_session_id TEXT;

-- Update participant table
ALTER TABLE live_class_participants ADD COLUMN IF NOT EXISTS join_token TEXT;
ALTER TABLE live_class_participants ADD COLUMN IF NOT EXISTS provider_participant_id TEXT;

-- Enhance live class recordings
ALTER TABLE live_class_recordings ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE live_class_recordings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'processing';
ALTER TABLE live_class_recordings ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
