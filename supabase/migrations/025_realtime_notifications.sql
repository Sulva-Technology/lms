-- The topbar bell subscribes to notification inserts for the signed-in user, so
-- the table has to be part of the realtime publication. RLS still applies to
-- realtime payloads, so a user only receives their own rows.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, is_read, created_at DESC);
