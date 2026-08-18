import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createSupabaseStub } from './helpers/supabase-stub';
import { AttendanceService } from '@/lib/services/attendance.service';

function stub(options: { assigned: boolean; existingSession?: boolean; sessions?: any[] }) {
  return createSupabaseStub({
    course_lecturers: options.assigned ? [{ id: 'cl1', course_section_id: 'sec1', lecturer_id: 'lec1' }] : [],
    attendance_sessions:
      options.sessions ||
      (options.existingSession
        ? [{ id: 'sess1', course_section_id: 'sec1', date: '2026-09-01', period: 1 }]
        : []),
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

  it('resolves the session with one upsert keyed by section, date and period', async () => {
    // Reading the session first and inserting only when missing let two staff
    // marking the same register race into a duplicate key error.
    const { client, upsertConflicts } = stub({ assigned: true });
    const service = new AttendanceService(client);

    await service.markAttendance('uni1', 'lec1', payload);

    expect(upsertConflicts.attendance_sessions).toEqual(['course_section_id', 'date', 'period']);
    expect(upsertConflicts.attendance_records).toEqual(['session_id', 'student_id']);
  });

  it('defaults to period 1 and keeps an explicit period', async () => {
    const first = stub({ assigned: true });
    await new AttendanceService(first.client).markAttendance('uni1', 'lec1', payload);
    expect(first.inserted.attendance_sessions[0].period).toBe(1);

    const second = stub({ assigned: true });
    const result = await new AttendanceService(second.client).markAttendance('uni1', 'lec1', {
      ...payload,
      period: 3,
    });
    expect(second.inserted.attendance_sessions[0].period).toBe(3);
    expect(result.period).toBe(3);
  });

  it('stores a note against a record and normalises blank notes to null', async () => {
    const { client, inserted } = stub({ assigned: true });
    const service = new AttendanceService(client);

    await service.markAttendance('uni1', 'lec1', {
      ...payload,
      records: [
        { studentId: 'stu1', status: 'excused', notes: '  Medical appointment  ' },
        { studentId: 'stu2', status: 'absent', notes: '   ' },
      ],
    });

    const byStudent = Object.fromEntries(
      inserted.attendance_records.map((record: any) => [record.student_id, record.notes]),
    );
    expect(byStudent).toEqual({ stu1: 'Medical appointment', stu2: null });
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

  it('takes the next free period when the day already has a register', async () => {
    const { client, inserted } = stub({
      assigned: true,
      sessions: [{ id: 'sess1', course_section_id: 'sec1', date: '2026-09-01', period: 1 }],
    });

    await new AttendanceService(client).calculateFromLiveClass('uni1', 'lec1', 'lc1');

    expect(inserted.attendance_sessions[0].period).toBe(2);
  });

  it('keeps the period of a register already tied to the live class', async () => {
    const { client, inserted } = stub({
      assigned: true,
      sessions: [
        { id: 'sess1', course_section_id: 'sec1', date: '2026-09-01', period: 4, live_class_id: 'lc1' },
      ],
    });

    await new AttendanceService(client).calculateFromLiveClass('uni1', 'lec1', 'lc1');

    expect(inserted.attendance_sessions[0].period).toBe(4);
  });

  it('rejects a lecturer who does not teach the live class section', async () => {
    const { client } = stub({ assigned: false });
    const service = new AttendanceService(client);

    await expect(service.calculateFromLiveClass('uni1', 'lec1', 'lc1')).rejects.toThrow(
      'Unauthorized: Lecturer not assigned to this course section',
    );
  });
});

describe('attendance register contracts', () => {
  it('allows several registers per section per day', () => {
    const migration = fs.readFileSync(
      path.join(process.cwd(), 'supabase', 'migrations', '032_attendance_school_register.sql'),
      'utf8',
    );

    expect(migration).toContain('DROP INDEX IF EXISTS attendance_sessions_section_date_key');
    expect(migration).toContain('attendance_sessions_section_date_period_key');
    expect(migration).toContain('ON attendance_sessions (course_section_id, date, period)');
  });

  it('logs every attendance change through a trigger the API cannot rewrite', () => {
    const migration = fs.readFileSync(
      path.join(process.cwd(), 'supabase', 'migrations', '032_attendance_school_register.sql'),
      'utf8',
    );

    expect(migration).toContain('CREATE TABLE IF NOT EXISTS attendance_record_changes');
    expect(migration).toContain('log_attendance_record_change_trigger');
    expect(migration).toContain('SECURITY DEFINER');
    // The log is append-only: readable, never writable through PostgREST.
    expect(migration).not.toMatch(/attendance_record_changes[\s\S]*FOR (INSERT|UPDATE|DELETE)/);
  });
});

describe('AttendanceService duration tracking', () => {
  function durationStub(trackingRule: 'duration' | 'join', participants: any[]) {
    return createSupabaseStub({
      course_lecturers: [{ id: 'cl1', course_section_id: 'sec1', lecturer_id: 'lec1' }],
      attendance_sessions: [],
      attendance_records: [],
      audit_logs: [],
      live_classes: [
        {
          id: 'lc1',
          course_section_id: 'sec1',
          start_time: '2026-09-01T10:00:00.000Z',
          topic: 'Week 1',
          duration: 60,
          tracking_rule: trackingRule,
          attendance_threshold_percent: 75,
        },
      ],
      live_class_participants: participants,
      course_enrollments: [
        { course_section_id: 'sec1', student_id: 'stu1', status: 'active' },
        { course_section_id: 'sec1', student_id: 'stu2', status: 'active' },
        { course_section_id: 'sec1', student_id: 'stu3', status: 'active' },
      ],
    });
  }

  const presence = [
    { live_class_id: 'lc1', student_id: 'stu1', total_seconds: 3000 },
    { live_class_id: 'lc1', student_id: 'stu2', total_seconds: 1500 },
    { live_class_id: 'lc1', student_id: 'stu3', total_seconds: 120 },
  ];

  it('grades present, late and absent from time attended under the duration rule', async () => {
    // 60 scheduled minutes at a 75% threshold: present from 45 minutes,
    // late from 22.5, absent below.
    const { client, inserted } = durationStub('duration', presence);

    await new AttendanceService(client).calculateFromLiveClass('uni1', 'lec1', 'lc1');

    const byStudent = Object.fromEntries(
      inserted.attendance_records.map((record: any) => [record.student_id, record.status]),
    );
    expect(byStudent).toEqual({ stu1: 'present', stu2: 'late', stu3: 'absent' });
  });

  it('records the minutes attended in the note', async () => {
    const { client, inserted } = durationStub('duration', presence);

    await new AttendanceService(client).calculateFromLiveClass('uni1', 'lec1', 'lc1');

    const record = inserted.attendance_records.find((r: any) => r.student_id === 'stu1');
    expect(record?.notes).toBe('Present for 50 of 60 scheduled minutes');
  });

  it('ignores time attended under the join rule', async () => {
    const { client, inserted } = durationStub('join', presence);

    await new AttendanceService(client).calculateFromLiveClass('uni1', 'lec1', 'lc1');

    const byStudent = Object.fromEntries(
      inserted.attendance_records.map((record: any) => [record.student_id, record.status]),
    );
    expect(byStudent).toEqual({ stu1: 'present', stu2: 'present', stu3: 'present' });
  });
});

describe('AttendanceService.getAttendanceRates', () => {
  function ratesStub() {
    return createSupabaseStub({
      attendance_records: [
        { student_id: 'stu1', status: 'present', course_section_id: 'sec1', profiles: { first_name: 'Ada', last_name: 'Obi', student_id: 'MAT-001' } },
        { student_id: 'stu1', status: 'late', course_section_id: 'sec1', profiles: { first_name: 'Ada', last_name: 'Obi', student_id: 'MAT-001' } },
        { student_id: 'stu1', status: 'absent', course_section_id: 'sec1', profiles: { first_name: 'Ada', last_name: 'Obi', student_id: 'MAT-001' } },
        { student_id: 'stu1', status: 'present', course_section_id: 'sec1', profiles: { first_name: 'Ada', last_name: 'Obi', student_id: 'MAT-001' } },
        { student_id: 'stu2', status: 'absent', course_section_id: 'sec1', profiles: { first_name: 'Bola', last_name: 'Eze', student_id: 'MAT-002' } },
        { student_id: 'stu2', status: 'absent', course_section_id: 'sec1', profiles: { first_name: 'Bola', last_name: 'Eze', student_id: 'MAT-002' } },
      ],
    });
  }

  it('counts late as attended and flags anyone below the threshold', async () => {
    const { client } = ratesStub();

    const rates = await new AttendanceService(client).getAttendanceRates(['sec1']);

    expect(rates).toHaveLength(2);
    // Lowest rate first, so the defaulters surface at the top.
    expect(rates[0]).toMatchObject({ studentId: 'stu2', rate: 0, belowThreshold: true });
    expect(rates[1]).toMatchObject({ studentId: 'stu1', rate: 75, belowThreshold: false });
  });

  it('returns nothing when no sections are given', async () => {
    const { client } = ratesStub();
    expect(await new AttendanceService(client).getAttendanceRates([])).toEqual([]);
  });
});
