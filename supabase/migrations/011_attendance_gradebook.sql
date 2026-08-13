-- Attendance and Gradebook schema additions

CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    course_section_id UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
    live_class_id UUID REFERENCES live_classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- If attendance_records already exists from the initial schema, reconcile it
-- with the session-based attendance model used by the app.
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS record_date DATE;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS course_section_id UUID REFERENCES course_sections(id) ON DELETE CASCADE;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_attendance_records_modtime ON attendance_records;
CREATE TRIGGER update_attendance_records_modtime BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Gradebook compatibility for weighted score calculations.
ALTER TABLE grade_items ADD COLUMN IF NOT EXISTS max_score DECIMAL(5,2) NOT NULL DEFAULT 100;
ALTER TABLE grade_items ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2);
UPDATE grade_items SET weight = COALESCE(weight, weight_percentage) WHERE weight IS NULL;

-- Reporting Views for easy access
CREATE OR REPLACE VIEW student_course_grades AS
SELECT 
    g.student_id,
    gi.course_section_id,
    SUM((g.score / NULLIF(gi.max_score, 0)) * (gi.weight / 100.0) * 100) as total_weighted_score
FROM grades g
JOIN grade_items gi ON g.grade_item_id = gi.id
GROUP BY g.student_id, gi.course_section_id;

CREATE OR REPLACE VIEW course_attendance_stats AS
SELECT 
    ar.session_id,
    asess.course_section_id,
    COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN ar.status IN ('absent', 'late', 'excused') THEN 1 END) as other_count,
    COUNT(*) as total_students
FROM attendance_records ar
JOIN attendance_sessions asess ON ar.session_id = asess.id
GROUP BY ar.session_id, asess.course_section_id;
