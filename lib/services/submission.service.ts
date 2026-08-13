import { SupabaseClient } from '@supabase/supabase-js';

export class SubmissionService {
  constructor(private supabase: SupabaseClient<any>) {}

  private async checkStudentEnrollment(sectionId: string, studentId: string) {
    const { data } = await this.supabase.from('course_enrollments')
      .select('id')
      .eq('course_section_id', sectionId)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .single();
    if (!data) throw new Error('Unauthorized: Student not enrolled in this course');
  }

  async submitAssignment(
    universityId: string,
    studentId: string,
    assignmentId: string,
    content?: string,
    files?: Array<{ path: string; fileName: string; fileSize: number; fileType: string }>,
  ) {
    const { data: assignment } = await this.supabase.from('assignments')
      .select('course_section_id, due_date, allow_late_submissions, max_resubmissions, is_published')
      .eq('id', assignmentId)
      .single();
      
    if (!assignment) throw new Error('Assignment not found');
    if (!assignment.is_published) throw new Error('Assignment is not published');
    
    await this.checkStudentEnrollment(assignment.course_section_id, studentId);

    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    const isLate = now > dueDate;

    if (isLate && !assignment.allow_late_submissions) {
      throw new Error('Submission deadline has passed and late submissions are not allowed.');
    }

    const { data: previous } = await this.supabase.from('assignment_submissions')
      .select('id, attempt_count')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .single();

    if (previous && previous.attempt_count >= assignment.max_resubmissions) {
      throw new Error('Maximum number of resubmissions reached.');
    }

    const payload = {
      university_id: universityId,
      assignment_id: assignmentId,
      student_id: studentId,
      content,
      file_urls: (files || []).map((file) => file.path),
      file_metadata: files || [],
      status: 'submitted',
      is_late: isLate,
      attempt_count: previous ? previous.attempt_count + 1 : 1,
      submitted_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const { data: submission, error } = previous 
      ? await this.supabase.from('assignment_submissions').update(payload).eq('id', previous.id).select().single()
      : await this.supabase.from('assignment_submissions').insert(payload).select().single();

    if (error) throw error;

    await this.supabase.from('audit_logs').insert({
      university_id: universityId,
      user_id: studentId,
      action: 'ASSIGNMENT_SUBMITTED',
      entity_type: 'assignment_submissions',
      entity_id: submission.id
    });

    // The caller needs the section to notify assigned lecturers.
    return { ...submission, course_section_id: assignment.course_section_id };
  }
}
