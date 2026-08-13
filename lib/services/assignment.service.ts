import { SupabaseClient } from '@supabase/supabase-js';
import { AssignmentPayload } from '@/types/assignment';

export class AssignmentService {
  constructor(private supabase: SupabaseClient<any>) {}

  private async checkLecturerAccess(sectionId: string, lecturerId: string) {
    const { data } = await this.supabase.from('course_lecturers')
      .select('id')
      .eq('course_section_id', sectionId)
      .eq('lecturer_id', lecturerId)
      .single();
    if (!data) throw new Error('Unauthorized: Lecturer not assigned to this course section');
  }

  async createAssignment(universityId: string, lecturerId: string, payload: AssignmentPayload) {
    await this.checkLecturerAccess(payload.courseSectionId, lecturerId);

    const { data: assignment, error } = await this.supabase.from('assignments').insert({
      university_id: universityId,
      course_section_id: payload.courseSectionId,
      title: payload.title,
      description: payload.description,
      due_date: payload.dueDate,
      total_points: payload.totalPoints,
      is_published: payload.isPublished || false,
      allow_late_submissions: payload.allowLateSubmissions || false,
      max_resubmissions: payload.maxResubmissions || 1,
    }).select().single();

    if (error) throw error;

    await this.supabase.from('audit_logs').insert({
      university_id: universityId,
      user_id: lecturerId,
      action: 'ASSIGNMENT_CREATED',
      entity_type: 'assignments',
      entity_id: assignment.id
    });

    return assignment;
  }

  async togglePublish(universityId: string, lecturerId: string, assignmentId: string, isPublished: boolean) {
    const { data: assignment } = await this.supabase.from('assignments')
      .select('course_section_id')
      .eq('id', assignmentId).single();
    if (!assignment) throw new Error('Assignment not found');

    await this.checkLecturerAccess(assignment.course_section_id, lecturerId);

    const { error } = await this.supabase.from('assignments')
      .update({ is_published: isPublished })
      .eq('id', assignmentId);

    if (error) throw error;
    return true;
  }

  async updateAssignment(universityId: string, lecturerId: string, assignmentId: string, payload: Partial<AssignmentPayload>) {
    const { data: assignment } = await this.supabase.from('assignments')
      .select('course_section_id')
      .eq('id', assignmentId)
      .eq('university_id', universityId)
      .single();
    if (!assignment) throw new Error('Assignment not found');
    await this.checkLecturerAccess(assignment.course_section_id, lecturerId);

    const { data, error } = await this.supabase.from('assignments')
      .update({
        ...(payload.courseSectionId && { course_section_id: payload.courseSectionId }),
        ...(payload.title && { title: payload.title }),
        ...(payload.description !== undefined && { description: payload.description || null }),
        ...(payload.dueDate && { due_date: payload.dueDate }),
        ...(payload.totalPoints !== undefined && { total_points: payload.totalPoints }),
        ...(payload.isPublished !== undefined && { is_published: payload.isPublished }),
        ...(payload.allowLateSubmissions !== undefined && { allow_late_submissions: payload.allowLateSubmissions }),
        ...(payload.maxResubmissions !== undefined && { max_resubmissions: payload.maxResubmissions }),
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async archiveAssignment(universityId: string, lecturerId: string, assignmentId: string) {
    const { data: assignment } = await this.supabase.from('assignments')
      .select('course_section_id')
      .eq('id', assignmentId)
      .eq('university_id', universityId)
      .single();
    if (!assignment) throw new Error('Assignment not found');
    await this.checkLecturerAccess(assignment.course_section_id, lecturerId);

    const { data, error } = await this.supabase.from('assignments')
      .update({ deleted_at: new Date().toISOString(), is_published: false })
      .eq('id', assignmentId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
