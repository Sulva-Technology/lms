-- 012_communications.sql

-- Announcements
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_scope TEXT DEFAULT 'course_section' CHECK (target_scope IN ('university', 'faculty', 'department', 'course_section'));
-- Already has course_section_id for course announcements. Let's add generic target_id for others if needed, 
-- or we can repurpose course_section_id logically, but a generic target_id works better.
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_id UUID;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- Discussions
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS is_answered BOOLEAN DEFAULT false;
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS is_moderated BOOLEAN DEFAULT false;
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;

-- Discussion Replies
ALTER TABLE discussion_replies ADD COLUMN IF NOT EXISTS is_endorsed BOOLEAN DEFAULT false; -- e.g. Lecturer response
ALTER TABLE discussion_replies ADD COLUMN IF NOT EXISTS is_moderated BOOLEAN DEFAULT false;
ALTER TABLE discussion_replies ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE discussion_replies ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;

-- Notifications are mostly ready.
