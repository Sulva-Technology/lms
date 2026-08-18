-- Real presence tracking for live classes.
--
-- `tracking_rule` was collected in the schedule form, stored on `live_classes`
-- and read by nothing: attendance was join based whatever the lecturer chose.
-- `left_at` had a column since 001 and no writer, because the provider's
-- participant events were never handled. These columns give the duration rule
-- something true to work from.

ALTER TABLE live_class_participants
  ADD COLUMN IF NOT EXISTS provider_joined_at TIMESTAMPTZ;

-- Accumulated across rejoins: a participant who drops and comes back keeps one
-- row, so presence has to add up rather than overwrite.
ALTER TABLE live_class_participants
  ADD COLUMN IF NOT EXISTS total_seconds INTEGER NOT NULL DEFAULT 0;

-- Share of the scheduled duration a student must be present for under the
-- duration rule. Below half of it they are absent, in between they are late.
ALTER TABLE live_classes
  ADD COLUMN IF NOT EXISTS attendance_threshold_percent SMALLINT NOT NULL DEFAULT 75;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'live_classes_attendance_threshold_range'
  ) THEN
    ALTER TABLE live_classes
      ADD CONSTRAINT live_classes_attendance_threshold_range
      CHECK (attendance_threshold_percent BETWEEN 1 AND 100);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS live_class_participants_class_presence_idx
  ON live_class_participants (live_class_id, total_seconds);
