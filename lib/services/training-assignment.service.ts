import { SupabaseClient } from '@supabase/supabase-js';

export type AssignmentStatus = 'completed' | 'cancelled' | 'overdue' | 'due_soon' | 'assigned';

/** Days before the due date at which an assignment starts warning. */
export const DUE_SOON_DAYS = 14;

/**
 * A due date is a day, not an instant: something due today is due until that
 * day ends, so the comparison runs against the end of the due date.
 */
export function deriveStatus(
  assignment: { due_on: string | null; completed_at: string | null; cancelled_at: string | null },
  now: Date = new Date(),
): AssignmentStatus {
  if (assignment.completed_at) return 'completed';
  if (assignment.cancelled_at) return 'cancelled';
  if (!assignment.due_on) return 'assigned';

  const due = new Date(`${assignment.due_on}T23:59:59.999Z`);
  if (due.getTime() < now.getTime()) return 'overdue';

  const days = (due.getTime() - now.getTime()) / 86_400_000;
  return days <= DUE_SOON_DAYS ? 'due_soon' : 'assigned';
}

export class TrainingAssignmentService {
  constructor(private supabase: SupabaseClient<any>) {}

  private async requireCourseStaff(courseSectionId: string, userId: string) {
    const { data } = await this.supabase
      .from('course_lecturers')
      .select('id')
      .eq('course_section_id', courseSectionId)
      .eq('lecturer_id', userId)
      .maybeSingle();
    if (!data) throw new Error('Unauthorized: not assigned to this course section');
  }

  async assign(params: {
    universityId: string;
    courseSectionId: string;
    studentId: string;
    dueOn?: string | null;
    assignedBy: string;
    renewsCertificateId?: string | null;
  }) {
    await this.requireCourseStaff(params.courseSectionId, params.assignedBy);

    // Assigning implies access. A deadline the learner cannot open is a door
    // with no handle, so enrolment comes with the assignment.
    const { error: enrollError } = await this.supabase.from('course_enrollments').upsert(
      {
        university_id: params.universityId,
        course_section_id: params.courseSectionId,
        student_id: params.studentId,
        status: 'active',
      },
      { onConflict: 'course_section_id,student_id' },
    );
    if (enrollError) throw enrollError;

    const { data, error } = await this.supabase
      .from('training_assignments')
      .upsert(
        {
          university_id: params.universityId,
          course_section_id: params.courseSectionId,
          student_id: params.studentId,
          due_on: params.dueOn ?? null,
          assigned_by: params.assignedBy,
          renews_certificate_id: params.renewsCertificateId ?? null,
          // Reassigning someone previously withdrawn revives the row rather
          // than leaving them cancelled with a new deadline.
          cancelled_at: null,
        },
        { onConflict: 'course_section_id,student_id' },
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /** Assigns every active learner in a department. Returns what it wrote. */
  async assignTeam(params: {
    universityId: string;
    courseSectionId: string;
    departmentId: string;
    dueOn?: string | null;
    assignedBy: string;
  }) {
    await this.requireCourseStaff(params.courseSectionId, params.assignedBy);

    const { data: members } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('university_id', params.universityId)
      .eq('department_id', params.departmentId)
      .eq('role', 'student');

    const assigned = [];
    for (const member of members || []) {
      assigned.push(
        await this.assign({
          universityId: params.universityId,
          courseSectionId: params.courseSectionId,
          studentId: member.id,
          dueOn: params.dueOn,
          assignedBy: params.assignedBy,
        }),
      );
    }
    return assigned;
  }

  async cancel(assignmentId: string, userId: string) {
    const { data: assignment, error: readError } = await this.supabase
      .from('training_assignments')
      .select('id, course_section_id')
      .eq('id', assignmentId)
      .single();
    if (readError) throw readError;

    await this.requireCourseStaff(assignment.course_section_id, userId);

    const { error } = await this.supabase
      .from('training_assignments')
      .update({ cancelled_at: new Date().toISOString() })
      .eq('id', assignmentId);
    if (error) throw error;

    return { cancelled: true };
  }

  async listForStudent(studentId: string) {
    const { data, error } = await this.supabase
      .from('training_assignments')
      .select('id,course_section_id,due_on,assigned_at,completed_at,cancelled_at,course_sections(name,courses(title,code))')
      .eq('student_id', studentId)
      .order('due_on', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async listForSection(courseSectionId: string) {
    const { data, error } = await this.supabase
      .from('training_assignments')
      .select('id,student_id,due_on,assigned_at,completed_at,cancelled_at,profiles(first_name,last_name,email)')
      .eq('course_section_id', courseSectionId)
      .order('due_on', { ascending: true });
    if (error) throw error;
    return data || [];
  }
}
