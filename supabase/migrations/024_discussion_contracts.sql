-- Discussion boards are read by section and sorted by recency on every view,
-- and replies are read in posting order within a thread.
CREATE INDEX IF NOT EXISTS idx_discussions_section_created
  ON discussions (course_section_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_discussion_replies_discussion_created
  ON discussion_replies (discussion_id, created_at ASC);

-- Record who closed a question, so a resolved thread can be audited.
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS answered_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS answered_at TIMESTAMPTZ;
