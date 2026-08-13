import { SupabaseClient } from '@supabase/supabase-js';
import { GradebookItemPayload } from '@/types/gradebook';

export class GradebookService {
  constructor(private supabase: SupabaseClient<any>) {}

  private async checkLecturerAccess(sectionId: string, lecturerId: string) {
    const { data } = await this.supabase.from('course_lecturers')
      .select('id')
      .eq('course_section_id', sectionId)
      .eq('lecturer_id', lecturerId)
      .single();
    if (!data) throw new Error('Unauthorized: Lecturer not assigned to this course section');
  }

  async createGradeItem(universityId: string, lecturerId: string, payload: GradebookItemPayload) {
    await this.checkLecturerAccess(payload.courseSectionId, lecturerId);

    const { data, error } = await this.supabase.from('grade_items').insert({
      university_id: universityId,
      course_section_id: payload.courseSectionId,
      title: payload.name,
      name: payload.name,
      max_score: payload.maxScore,
      weight: payload.weight,
      weight_percentage: payload.weight
    }).select().single();

    if (error) throw error;
    
    await this.supabase.from('audit_logs').insert({
        university_id: universityId,
        user_id: lecturerId,
        action: 'GRADE_ITEM_CREATED',
        entity_type: 'grade_items',
        entity_id: data.id
    });

    return data;
  }

  async getCourseGrades(courseSectionId: string, lecturerId: string) {
    await this.checkLecturerAccess(courseSectionId, lecturerId);

    const { data: students } = await this.supabase.from('course_enrollments')
      .select('profiles(id, first_name, last_name, email)')
      .eq('course_section_id', courseSectionId)
      .eq('status', 'active');

    const { data: gradeItems } = await this.supabase.from('grade_items')
      .select('*')
      .eq('course_section_id', courseSectionId);

    const { data: grades } = await this.supabase.from('grades')
      .select('student_id, grade_item_id, score')
      .in('grade_item_id', (gradeItems || []).map(g => g.id));

    // Calculate aggregated scores
    const gradebook = (students || []).map(s => {
      const student = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
      const studentId = (student as any).id;
      
      const items: Record<string, number> = {};
      let totalWeighted = 0;

      (gradeItems || []).forEach(gi => {
          const g = (grades || []).find(gr => gr.student_id === studentId && gr.grade_item_id === gi.id);
          const score = g ? g.score : 0;
          items[gi.id] = score;
          totalWeighted += (score / (gi.max_score || 100)) * ((gi.weight || gi.weight_percentage || 0) / 100);
      });

      return {
          studentId,
          studentName: `${(student as any).first_name} ${(student as any).last_name}`,
          totalGrade: totalWeighted,
          items
      };
    });

    return { gradeItems, gradebook };
  }

  async getStudentGradeSummary(studentId: string, courseSectionId: string) {
    // Only fetch for specific student
    const { data: calculated } = await this.supabase.from('student_course_grades')
        .select('total_weighted_score')
        .eq('student_id', studentId)
        .eq('course_section_id', courseSectionId)
        .single();
        
    return calculated || { total_weighted_score: 0 };
  }
}
