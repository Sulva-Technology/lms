import { SupabaseClient } from '@supabase/supabase-js';

export class GradeService {
  constructor(private supabase: SupabaseClient<any>) {}

  private async checkLecturerAccess(sectionId: string, lecturerId: string) {
    const { data } = await this.supabase.from('course_lecturers')
      .select('id')
      .eq('course_section_id', sectionId)
      .eq('lecturer_id', lecturerId)
      .single();
    if (!data) throw new Error('Unauthorized: Lecturer not assigned to this course section');
  }

  async gradeSubmission(universityId: string, lecturerId: string, submissionId: string, score: number, feedback?: string, feedbackFileUrls?: string[]) {
    // 1. Get submission and assignment to check limits and auth
    const { data: submission } = await this.supabase.from('assignment_submissions')
      .select('id, assignment_id, assignments(course_section_id, total_points)')
      .eq('id', submissionId)
      .single();
      
    if (!submission) throw new Error('Submission not found');
    
    // Type casting because supabase nested joins return dynamic types
    const assignment = Array.isArray(submission.assignments) ? submission.assignments[0] : submission.assignments;
    if (!assignment) throw new Error('Assignment data missing');

    if (score > (assignment as any).total_points) {
      throw new Error(`Score cannot exceed maximum points (${(assignment as any).total_points})`);
    }

    await this.checkLecturerAccess((assignment as any).course_section_id, lecturerId);

    // 2. Update submission
    const now = new Date().toISOString();
    const { data: updatedSub, error: updateError } = await this.supabase.from('assignment_submissions')
      .update({
        score,
        feedback,
        feedback_file_urls: feedbackFileUrls || [],
        status: 'graded',
        graded_at: now,
        updated_at: now
      })
      .eq('id', submissionId)
      .select().single();

    if (updateError) throw updateError;

    // 3. Upsert to grades table (general grades table for final calculations)
    // Find grade item or create it
    let { data: gradeItem } = await this.supabase.from('grade_items')
      .select('id')
      .eq('course_section_id', (assignment as any).course_section_id)
      .eq('name', 'Assignment: ' + submissionId) // simplistic approach, usually links to assignment title
      .single();

    if (!gradeItem) {
        const { data: newgi } = await this.supabase.from('grade_items').insert({
            university_id: universityId,
            course_section_id: (assignment as any).course_section_id,
            name: 'Assignment',
            weight: 10,
            max_score: (assignment as any).total_points
        }).select().single();
        gradeItem = newgi;
    }

    // This handles upserting into the generic `grades` table
    const { data: studentSub } = await this.supabase.from('assignment_submissions').select('student_id').eq('id', submissionId).single();
    if (studentSub && gradeItem) {
        await this.supabase.from('grades').upsert({
            university_id: universityId,
            grade_item_id: gradeItem.id,
            student_id: studentSub.student_id,
            score: score,
            graded_by: lecturerId,
            graded_at: now
        }, { onConflict: 'grade_item_id,student_id' });
    }

    // 4. Audit Log
    await this.supabase.from('audit_logs').insert({
      university_id: universityId,
      user_id: lecturerId,
      action: 'ASSIGNMENT_GRADED',
      entity_type: 'assignment_submissions',
      entity_id: submissionId
    });

    return updatedSub;
  }
}
