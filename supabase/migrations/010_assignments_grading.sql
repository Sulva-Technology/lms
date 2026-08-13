-- Extend Assignment Tables
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS allow_late_submissions BOOLEAN DEFAULT false;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS max_resubmissions INTEGER DEFAULT 1;

ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 1;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT false;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS feedback_file_urls TEXT[];
