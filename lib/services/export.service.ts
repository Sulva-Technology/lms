import { GradebookService } from './gradebook.service';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Quotes a CSV field and neutralises spreadsheet formula injection: a value
 * opening with =, +, - or @ is executed on open by Excel and Sheets, and
 * student-supplied names reach this export.
 */
const csvField = (value: unknown): string => {
  const raw = value === null || value === undefined ? '' : String(value);
  const guarded = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${guarded.replace(/"/g, '""')}"`;
};

const csvDocument = (headers: string[], rows: string[][]): string =>
  [headers.map(csvField).join(','), ...rows.map((row) => row.map(csvField).join(','))].join('\r\n');

export class ExportService {
  constructor(private supabase: SupabaseClient<any>) {}

  private async requireLecturerAccess(courseSectionId: string, lecturerId: string) {
    const { data } = await this.supabase
      .from('course_lecturers')
      .select('id')
      .eq('course_section_id', courseSectionId)
      .eq('lecturer_id', lecturerId)
      .maybeSingle();
    if (!data) throw new Error('Unauthorized: Lecturer not assigned to this course section');
  }

  async generateGradebookCSV(courseSectionId: string, lecturerId: string) {
    const gbService = new GradebookService(this.supabase);
    const { gradeItems, gradebook } = await gbService.getCourseGrades(courseSectionId, lecturerId);

    if (!gradeItems || gradeItems.length === 0) {
      return csvDocument(['Student ID', 'Student Name', 'Total Weighted Grade'], []);
    }

    const headers = [
      'Student ID',
      'Student Name',
      'Total Final Score',
      ...gradeItems.map((gi) => `${gi.name} (Max ${gi.max_score}, Weight ${gi.weight}%)`),
    ];

    const rows = gradebook.map((student) => [
      student.studentId,
      student.studentName,
      (student.totalGrade * 100).toFixed(2),
      ...gradeItems.map((gi) =>
        student.items[gi.id] !== undefined ? student.items[gi.id].toString() : '0',
      ),
    ]);

    return csvDocument(headers, rows);
  }

  async generateStudentAttendanceCSV(courseSectionId: string, lecturerId: string) {
    await this.requireLecturerAccess(courseSectionId, lecturerId);

    const { data, error } = await this.supabase
      .from('attendance_records')
      .select(
        'status,notes,record_date,attendance_sessions!inner(date,period,title,course_section_id),profiles!inner(first_name,last_name,email,student_id)',
      )
      .eq('attendance_sessions.course_section_id', courseSectionId);

    if (error) throw error;

    const one = (value: any) => (Array.isArray(value) ? value[0] : value);

    const rows = (data || [])
      .map((row: any) => {
        const session = one(row.attendance_sessions);
        const profile = one(row.profiles);
        const name =
          [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.email || 'Student';
        return {
          date: session?.date || row.record_date || '',
          period: session?.period ?? 1,
          title: session?.title || 'Attendance',
          identifier: profile?.student_id || profile?.email || '',
          name,
          status: row.status,
          notes: row.notes || '',
        };
      })
      .sort((a, b) =>
        a.date === b.date
          ? a.period === b.period
            ? a.name.localeCompare(b.name)
            : a.period - b.period
          : a.date.localeCompare(b.date),
      );

    return csvDocument(
      ['Date', 'Period', 'Session', 'Student ID', 'Student Name', 'Status', 'Notes'],
      rows.map((row) => [
        row.date,
        String(row.period),
        row.title,
        row.identifier,
        row.name,
        row.status,
        row.notes,
      ]),
    );
  }
}
