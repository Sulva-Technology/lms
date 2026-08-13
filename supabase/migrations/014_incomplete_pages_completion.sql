-- Completion contracts for production-backed dashboard pages.

CREATE TABLE IF NOT EXISTS platform_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    monthly_price_cents INTEGER NOT NULL DEFAULT 0,
    max_students INTEGER,
    max_storage_gb INTEGER,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS university_plan_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES platform_plans(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled')),
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(university_id)
);

CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
    requester_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'suspended', 'archived'));
ALTER TABLE universities ADD COLUMN IF NOT EXISTS plan_status TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS university_settings_university_id_key ON university_settings(university_id);

ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS max_score DECIMAL(7,2);
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS percentage DECIMAL(5,2);
CREATE UNIQUE INDEX IF NOT EXISTS quiz_attempts_quiz_student_active_idx
    ON quiz_attempts (quiz_id, student_id)
    WHERE status = 'started';

ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS provider_room_name TEXT;
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS provider_room_url TEXT;
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS recording_status TEXT DEFAULT 'not_started';
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS provider_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE live_class_participants ADD COLUMN IF NOT EXISTS provider_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS calendar_events_user_start_idx ON calendar_events(user_id, start_time);
CREATE INDEX IF NOT EXISTS calendar_events_section_start_idx ON calendar_events(course_section_id, start_time);
CREATE INDEX IF NOT EXISTS files_university_created_idx ON files(university_id, created_at DESC);
CREATE INDEX IF NOT EXISTS video_assets_university_created_idx ON video_assets(university_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_university_created_idx ON audit_logs(university_id, created_at DESC);
CREATE INDEX IF NOT EXISTS grades_student_idx ON grades(student_id);
CREATE INDEX IF NOT EXISTS attendance_records_student_idx ON attendance_records(student_id);

DROP TRIGGER IF EXISTS update_platform_plans_modtime ON platform_plans;
CREATE TRIGGER update_platform_plans_modtime BEFORE UPDATE ON platform_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_university_plan_subscriptions_modtime ON university_plan_subscriptions;
CREATE TRIGGER update_university_plan_subscriptions_modtime BEFORE UPDATE ON university_plan_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_support_tickets_modtime ON support_tickets;
CREATE TRIGGER update_support_tickets_modtime BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE platform_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_plan_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins manage platform plans" ON platform_plans;
CREATE POLICY "Super admins manage platform plans" ON platform_plans FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
DROP POLICY IF EXISTS "Tenant admins view active platform plans" ON platform_plans;
CREATE POLICY "Tenant admins view active platform plans" ON platform_plans FOR SELECT USING (is_active OR is_super_admin());

DROP POLICY IF EXISTS "Super admins manage university subscriptions" ON university_plan_subscriptions;
CREATE POLICY "Super admins manage university subscriptions" ON university_plan_subscriptions FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
DROP POLICY IF EXISTS "Admins view own university subscription" ON university_plan_subscriptions;
CREATE POLICY "Admins view own university subscription" ON university_plan_subscriptions FOR SELECT USING (is_super_admin() OR is_university_admin(university_id));

DROP POLICY IF EXISTS "Super admins manage platform settings" ON platform_settings;
CREATE POLICY "Super admins manage platform settings" ON platform_settings FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Support ticket visibility" ON support_tickets;
CREATE POLICY "Support ticket visibility" ON support_tickets FOR SELECT USING (
    is_super_admin()
    OR (university_id IS NOT NULL AND is_university_admin(university_id))
    OR requester_id = auth.uid()
);
DROP POLICY IF EXISTS "Support ticket creation" ON support_tickets;
CREATE POLICY "Support ticket creation" ON support_tickets FOR INSERT WITH CHECK (
    is_super_admin()
    OR requester_id = auth.uid()
    OR (university_id IS NOT NULL AND is_university_admin(university_id))
);
DROP POLICY IF EXISTS "Support ticket updates" ON support_tickets;
CREATE POLICY "Support ticket updates" ON support_tickets FOR UPDATE USING (
    is_super_admin()
    OR (university_id IS NOT NULL AND is_university_admin(university_id))
);
