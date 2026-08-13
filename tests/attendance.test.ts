import { describe, it, expect } from 'vitest';
import { createSupabaseStub } from './helpers/supabase-stub';
import { AttendanceService } from '@/lib/services/attendance.service';

function stub(options: { assigned: boolean; existingSession?: boolean }) {
  return createSupabaseStub({
    course_lecturers: options.assigned ? [{ id: 'cl1', course_section_id: 'sec1', lecturer_id: 'lec1' }] : [],
    attendance_sessions: options.existingSession
      ? [{ id: 'sess1', course_section_id: 'sec1', date: '2026-09-01' }]
      : [],
    attendance_records: [],
    audit_logs: [],
    live_classes: [
      { id: 'lc1', course_section_id: 'sec1', start_time: '2026-09-01T10:00:00.000Z', topic: 'Week 1' },
    ],
    live_class_participants: [{ live_class_id: 'lc1', student_id: 'stu1' }],
    course_enrollments: [
      { course_section_id: 'sec1', student_id: 'stu1', status: 'active' },
      { course_section_id: 'sec1', student_id: 'stu2', status: 'active' },
    ],
  });
}

const payload = {
  courseSectionId: 'sec1',
  date: '2026-09-01',
  title: 'Week 1',
  records: [
    { studentId: 'stu1', status: 'present' as const },
    { studentId: 'stu2', status: 'absent' as const },
  ],
};

describe('AttendanceService.markAttendance', () => {
  it('rejects a lecturer who is not assigned to the section', async () => {
    const { client } = stub({ assigned: false });
    const service = new AttendanceService(client);

    await expect(service.markAttendance('uni1', 'lec1', payload)).rejects.toThrow(
      'Unauthorized: Lecturer not assigned to this course section',
    );
  });

  it('creates a session and one record per student', async () => {
    const { client, inserted } = stub({ assigned: true });
    const service = new AttendanceService(client);

    const result = await service.markAttendance('uni1', 'lec1', payload);

    expect(inserted.attendance_sessions).toHaveLength(1);
    expect(inserted.attendance_records).toHaveLength(2);
    expect(result.count).toBe(2);
  });

  it('reuses an existing session for the same section and date', async () => {
    const { client, inserted } = stub({ assigned: true, existingSession: true });
    const service = new AttendanceService(client);

    const result = await service.markAttendance('uni1', 'lec1', payload);

    expect(inserted.attendance_sessions).toBeUndefined();
    expect(result.sessionId).toBe('sess1');
  });

  it('stores the submitted status per student', async () => {
    const { client, inserted } = stub({ assigned: true });
    const service = new AttendanceService(client);

    await service.markAttendance('uni1', 'lec1', payload);

    const byStudent = Object.fromEntries(
      inserted.attendance_records.map((record: any) => [record.student_id, record.status]),
    );
    expect(byStudent).toEqual({ stu1: 'present', stu2: 'absent' });
  });
});

describe('AttendanceService.calculateFromLiveClass', () => {
  it('marks participants present and absent enrollees absent', async () => {
    const { client, inserted } = stub({ assigned: true });
    const service = new AttendanceService(client);

    await service.calculateFromLiveClass('uni1', 'lec1', 'lc1');

    const byStudent = Object.fromEntries(
      inserted.attendance_records.map((record: any) => [record.student_id, record.status]),
    );
    expect(byStudent).toEqual({ stu1: 'present', stu2: 'absent' });
  });

  it('rejects a lecturer who does not teach the live class section', async () => {
    const { client } = stub({ assigned: false });
    const service = new AttendanceService(client);

    await expect(service.calculateFromLiveClass('uni1', 'lec1', 'lc1')).rejects.toThrow(
      'Unauthorized: Lecturer not assigned to this course section',
    );
  });
});
