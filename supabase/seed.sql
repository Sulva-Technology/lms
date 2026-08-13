-- Seed data for VUI LMS

-- 1. Create a dummy University
INSERT INTO universities (id, name, domain, logo_url)
VALUES ('00000000-0000-0000-0000-000000000001', 'VUI Demo University', 'vui.edu', 'https://picsum.photos/200')
ON CONFLICT DO NOTHING;

-- 2. Create Users (We'll use auth.users later if needed, but profiles are here)
-- Super Admin
INSERT INTO profiles (id, university_id, first_name, last_name, email, role)
VALUES ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Super', 'Admin', 'superadmin@example.com', 'super_admin')
ON CONFLICT DO NOTHING;

-- University Admin
INSERT INTO profiles (id, university_id, first_name, last_name, email, role)
VALUES ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Univ', 'Admin', 'admin@example.com', 'admin')
ON CONFLICT DO NOTHING;

-- Department Admin
INSERT INTO profiles (id, university_id, first_name, last_name, email, role)
VALUES ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Dept', 'Admin', 'deptadmin@example.com', 'department_admin')
ON CONFLICT DO NOTHING;

-- Lecturer
INSERT INTO profiles (id, university_id, first_name, last_name, email, role)
VALUES ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', 'John', 'Lecturer', 'lecturer@example.com', 'lecturer')
ON CONFLICT DO NOTHING;

-- Student
INSERT INTO profiles (id, university_id, first_name, last_name, email, role)
VALUES ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', 'Jane', 'Student', 'student@example.com', 'student')
ON CONFLICT DO NOTHING;

-- 3. Academic Structure
-- Faculty
INSERT INTO faculties (id, university_id, name, code)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000001', '00000000-0000-0000-0000-000000000001', 'Faculty of Engineering', 'ENG')
ON CONFLICT DO NOTHING;

-- Department
INSERT INTO departments (id, university_id, faculty_id, name, code)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000002', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000001', 'Software Engineering', 'SWE')
ON CONFLICT DO NOTHING;

-- Program
INSERT INTO programs (id, university_id, department_id, name, code)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000003', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000002', 'BSc Software Engineering', 'BSWE')
ON CONFLICT DO NOTHING;

-- Academic Session
INSERT INTO academic_sessions (id, university_id, name, start_date, end_date, is_active)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000004', '00000000-0000-0000-0000-000000000001', '2025/2026', '2025-09-01', '2026-06-30', true)
ON CONFLICT DO NOTHING;

-- Semester
INSERT INTO semesters (id, university_id, academic_session_id, name, start_date, end_date, is_active)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000005', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000004', 'Fall Semester', '2025-09-01', '2025-12-20', true)
ON CONFLICT DO NOTHING;

-- Course
INSERT INTO courses (id, university_id, department_id, title, code, description, credits, status)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000007', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000002', 'Introduction to Programming', 'SWE101', 'Basic programming concepts.', 3, 'published')
ON CONFLICT DO NOTHING;

-- Course Section
INSERT INTO course_sections (id, university_id, course_id, semester_id, name, capacity)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000008', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000007', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000005', 'Group A', 50)
ON CONFLICT DO NOTHING;

-- 4. Course Registration
-- Registration Window
INSERT INTO registration_windows (id, university_id, semester_id, program_id, start_date, end_date, add_drop_deadline, min_credits, max_credits)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000009', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000005', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000003', NOW() - interval '7 days', NOW() + interval '30 days', NOW() + interval '45 days', 3, 24)
ON CONFLICT DO NOTHING;

-- Student Enrollment
INSERT INTO course_enrollments (id, university_id, course_section_id, student_id, status)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000010', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000008', '55555555-5555-5555-5555-555555555555', 'active')
ON CONFLICT DO NOTHING;

-- Lecturer Assignment
INSERT INTO course_lecturers (id, university_id, course_section_id, lecturer_id, role)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000011', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000008', '44444444-4444-4444-4444-444444444444', 'primary')
ON CONFLICT DO NOTHING;

-- 5. Course Content
-- Module
INSERT INTO course_modules (id, university_id, course_id, title, description, order_index)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000012', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000007', 'Module 1: Basics', 'Programming fundamentals and setup.', 1)
ON CONFLICT DO NOTHING;

-- Lesson
INSERT INTO lessons (id, university_id, module_id, title, resource_type, order_index, content, is_published)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000013', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000012', 'What is programming?', 'video', 1, '{"video_asset_id":"aaaa0000-aaaa-aaaa-aaaa-aaaa00000014"}', true)
ON CONFLICT DO NOTHING;

-- Video Asset
INSERT INTO video_assets (id, university_id, lesson_id, course_id, created_by, provider, asset_id, playback_id, duration, status, visibility)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000014', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000013', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000007', '44444444-4444-4444-4444-444444444444', 'mux', 'demo_mux_asset_id', 'demo_playback_id', 3600, 'ready', 'tenant')
ON CONFLICT DO NOTHING;

-- 6. Live Classes
INSERT INTO live_classes (id, university_id, course_id, course_section_id, lecturer_id, title, topic, description, provider, meeting_id, provider_session_id, provider_room_name, provider_room_url, join_url, host_url, start_time, end_time, duration, status)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000015', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000007', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000008', '44444444-4444-4444-4444-444444444444', 'Live Session 1', 'Live Session 1', 'Demo live lecture', 'daily', 'demo-daily-room', 'demo-daily-room', 'demo-daily-room', 'https://demo.daily.co/demo-daily-room', 'https://demo.daily.co/demo-daily-room', 'https://demo.daily.co/demo-daily-room', NOW() + interval '1 day', NOW() + interval '1 day' + interval '60 minutes', 60, 'scheduled')
ON CONFLICT DO NOTHING;

-- 7. Academic Work
-- Grade Item
INSERT INTO grade_items (id, university_id, course_section_id, title, name, max_score, weight, weight_percentage)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000016', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000008', 'Midterm Exam', 'Midterm Exam', 100, 30, 30)
ON CONFLICT DO NOTHING;

-- Grades
INSERT INTO grades (id, university_id, student_id, grade_item_id, score, graded_by)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000017', '00000000-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000016', 85, '44444444-4444-4444-4444-444444444444')
ON CONFLICT DO NOTHING;

-- 8. Engagement
-- Announcement
INSERT INTO announcements (id, university_id, author_id, course_section_id, title, content, target_scope, is_published)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000018', '00000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000008', 'Welcome to the course', 'We are glad to have you here.', 'course_section', true)
ON CONFLICT DO NOTHING;

-- Assignment
INSERT INTO assignments (id, university_id, course_section_id, title, description, due_date, total_points, is_published, allow_late_submissions)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000019', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000008', 'Programming Lab 1', 'Submit a short program that prints your student profile.', NOW() + interval '10 days', 100, true, true)
ON CONFLICT DO NOTHING;

INSERT INTO assignment_submissions (id, university_id, assignment_id, student_id, status, content, score, submitted_at)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000020', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000019', '55555555-5555-5555-5555-555555555555', 'graded', 'Console application submitted.', 92, NOW() - interval '2 days')
ON CONFLICT DO NOTHING;

-- Attendance
INSERT INTO attendance_sessions (id, university_id, course_section_id, live_class_id, date, title)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000021', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000008', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000015', CURRENT_DATE, 'Week 1 Attendance')
ON CONFLICT DO NOTHING;

INSERT INTO attendance_records (id, university_id, session_id, course_section_id, student_id, record_date, status, created_by)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000022', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000021', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000008', '55555555-5555-5555-5555-555555555555', CURRENT_DATE, 'present', '44444444-4444-4444-4444-444444444444')
ON CONFLICT DO NOTHING;

-- Quiz
INSERT INTO quizzes (id, university_id, course_section_id, title, description, time_limit_minutes, start_time, end_time, total_points)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000023', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000008', 'Programming Basics Quiz', 'Check your understanding of the first module.', 30, NOW() - interval '1 day', NOW() + interval '20 days', 10)
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions (id, university_id, quiz_id, question_text, question_type, points, order_index)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000024', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000023', 'What does a compiler do?', 'multiple_choice', 10, 1)
ON CONFLICT DO NOTHING;

INSERT INTO quiz_options (id, university_id, question_id, option_text, is_correct)
VALUES
('aaaa0000-aaaa-aaaa-aaaa-aaaa00000025', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000024', 'Translates source code into executable form', true),
('aaaa0000-aaaa-aaaa-aaaa-aaaa00000026', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000024', 'Designs user interfaces automatically', false)
ON CONFLICT DO NOTHING;

-- Discussions, notifications, recordings, files
INSERT INTO discussions (id, university_id, course_section_id, author_id, title, content, is_answered)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000027', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000008', '55555555-5555-5555-5555-555555555555', 'How should I submit Lab 1?', 'Can we include screenshots with the source code?', false)
ON CONFLICT DO NOTHING;

INSERT INTO notifications (id, university_id, user_id, title, content, type, link_url)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000028', '00000000-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555', 'Lab 1 is open', 'Programming Lab 1 is ready for submission.', 'assignment', '/student/assignments')
ON CONFLICT DO NOTHING;

INSERT INTO live_class_recordings (id, university_id, live_class_id, recording_url, duration, status)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000029', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000015', 'https://demo.daily.co/recordings/demo-daily-room', 3600, 'ready')
ON CONFLICT DO NOTHING;

INSERT INTO files (id, university_id, uploader_id, file_name, file_size, file_type, storage_path, is_public)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000030', '00000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'swe101-syllabus.pdf', 524288, 'application/pdf', 'course-resources/swe101-syllabus.pdf', false)
ON CONFLICT DO NOTHING;

-- Platform operations
INSERT INTO platform_plans (id, name, slug, description, monthly_price_cents, max_students, max_storage_gb, features)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000031', 'Growth Campus', 'growth-campus', 'Core LMS operations for growing universities.', 49900, 5000, 500, '["live_classes","gradebook","course_registration"]'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO university_plan_subscriptions (id, university_id, plan_id, status, current_period_end)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000032', '00000000-0000-0000-0000-000000000001', 'aaaa0000-aaaa-aaaa-aaaa-aaaa00000031', 'active', NOW() + interval '30 days')
ON CONFLICT DO NOTHING;

INSERT INTO platform_settings (key, value, description)
VALUES ('default_live_provider', '"daily"'::jsonb, 'Default live-class provider')
ON CONFLICT DO NOTHING;

INSERT INTO support_tickets (id, university_id, requester_id, subject, status, priority)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000033', '00000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'Need help configuring registration windows', 'open', 'normal')
ON CONFLICT DO NOTHING;

INSERT INTO audit_logs (id, university_id, user_id, action, entity_type, entity_id, metadata)
VALUES ('aaaa0000-aaaa-aaaa-aaaa-aaaa00000034', '00000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'SEED_COMPLETION_DATA', 'system', NULL, '{"source":"seed.sql"}'::jsonb)
ON CONFLICT DO NOTHING;
