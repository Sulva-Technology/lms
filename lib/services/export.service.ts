import { GradebookService } from './gradebook.service';
import { SupabaseClient } from '@supabase/supabase-js';

export class ExportService {
  constructor(private supabase: SupabaseClient<any>) {}

  async generateGradebookCSV(courseSectionId: string, lecturerId: string) {
    const gbService = new GradebookService(this.supabase);
    const { gradeItems, gradebook } = await gbService.getCourseGrades(courseSectionId, lecturerId);

    if (!gradeItems || gradeItems.length === 0) {
      return "Student ID,Student Name,Total Weighted Grade\\n"; // Empty state
    }

    // Build Headers
    const itemHeaders = gradeItems.map(gi => `"${gi.name} (Max ${gi.max_score}, Weight ${gi.weight}%)"`);
    const headers = ['Student ID', 'Student Name', 'Total Final Score', ...itemHeaders];

    // Build Rows
    const rows = gradebook.map(student => {
      const studentData = [
        student.studentId,
        `"${student.studentName}"`,
        (student.totalGrade * 100).toFixed(2)
      ];

      gradeItems.forEach(gi => {
        studentData.push(student.items[gi.id] !== undefined ? student.items[gi.id].toString() : '0');
      });

      return studentData.join(',');
    });

    return [headers.join(','), ...rows].join('\\n');
  }

  async generateStudentAttendanceCSV(courseSectionId: string, lecturerId: string) {
      // Basic CSV export for attendance records
      const { data } = await this.supabase.from('attendance_records')
        .select('student_id, status, attendance_sessions!inner(date, course_section_id), profiles!inner(first_name, last_name)')
        .eq('attendance_sessions.course_section_id', courseSectionId);

      const headers = ['Date', 'Student Name', 'Status'];
      const rows = (data || []).map((row: any) => {
          return [`"${row.attendance_sessions.date}"`, `"${row.profiles.first_name} ${row.profiles.last_name}"`, `"${row.status}"`].join(',');
      });

      return [headers.join(','), ...rows].join('\\n');
  }
}
