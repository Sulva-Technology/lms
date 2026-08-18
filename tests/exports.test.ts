import { describe, it, expect } from 'vitest';
import { createSupabaseStub } from './helpers/supabase-stub';
import { ExportService } from '@/lib/services/export.service';

function stub(assigned = true) {
  return createSupabaseStub({
    course_lecturers: assigned ? [{ id: 'cl1', course_section_id: 'sec1', lecturer_id: 'lec1' }] : [],
    attendance_records: [
      {
        status: 'present',
        notes: 'Arrived late, bus delay',
        record_date: '2026-09-01',
        attendance_sessions: { date: '2026-09-01', period: 2, title: 'Week 1', course_section_id: 'sec1' },
        profiles: { first_name: 'Ada', last_name: 'Obi', email: 'ada@example.edu', student_id: 'MAT-001' },
      },
      {
        status: 'absent',
        notes: null,
        record_date: '2026-09-01',
        attendance_sessions: { date: '2026-09-01', period: 1, title: 'Week 1', course_section_id: 'sec1' },
        profiles: { first_name: '=cmd', last_name: 'Injection', email: 'x@example.edu', student_id: 'MAT-002' },
      },
    ],
  });
}

describe('ExportService.generateStudentAttendanceCSV', () => {
  it('rejects a lecturer who is not assigned to the section', async () => {
    const { client } = stub(false);

    await expect(new ExportService(client).generateStudentAttendanceCSV('sec1', 'lec1')).rejects.toThrow(
      'Unauthorized: Lecturer not assigned to this course section',
    );
  });

  it('separates rows with real newlines rather than a literal backslash-n', async () => {
    const csv = await new ExportService(stub().client).generateStudentAttendanceCSV('sec1', 'lec1');

    expect(csv).not.toContain('\\n');
    expect(csv.split('\r\n')).toHaveLength(3);
  });

  it('carries the period and the note for each record', async () => {
    const csv = await new ExportService(stub().client).generateStudentAttendanceCSV('sec1', 'lec1');
    const [header, ...rows] = csv.split('\r\n');

    expect(header).toContain('"Period"');
    expect(header).toContain('"Notes"');
    expect(rows.join('\n')).toContain('"Arrived late, bus delay"');
    // Ordered by date, then period.
    expect(rows[0]).toContain('"1"');
    expect(rows[1]).toContain('"2"');
  });

  it('neutralises spreadsheet formula injection from student-supplied names', async () => {
    const csv = await new ExportService(stub().client).generateStudentAttendanceCSV('sec1', 'lec1');

    expect(csv).toContain(`"'=cmd Injection"`);
    expect(csv).not.toContain('"=cmd Injection"');
  });
});
