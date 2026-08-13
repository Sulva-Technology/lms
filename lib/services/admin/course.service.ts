import { SupabaseClient } from '@supabase/supabase-js';
import { CoursePayload } from '@/types/admin';

export class CourseService {
  constructor(private supabase: SupabaseClient<any>) {}

  async createCourse(universityId: string, payload: CoursePayload) {
    const { data, error } = await this.supabase
      .from('courses')
      .insert({
        university_id: universityId,
        department_id: payload.departmentId,
        title: payload.title,
        code: payload.code,
        description: payload.description || null,
        credits: payload.credits,
        status: payload.status || 'draft',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateCourse(universityId: string, courseId: string, payload: Partial<CoursePayload>) {
    const { data, error } = await this.supabase
      .from('courses')
      .update({
        ...(payload.departmentId && { department_id: payload.departmentId }),
        ...(payload.title && { title: payload.title }),
        ...(payload.code && { code: payload.code }),
        ...(payload.description !== undefined && { description: payload.description || null }),
        ...(payload.credits !== undefined && { credits: payload.credits }),
        ...(payload.status && { status: payload.status }),
      })
      .eq('id', courseId)
      .eq('university_id', universityId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async archiveCourse(universityId: string, courseId: string) {
    const { data, error } = await this.supabase
      .from('courses')
      .update({ status: 'archived', deleted_at: new Date().toISOString() })
      .eq('id', courseId)
      .eq('university_id', universityId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async restoreCourse(universityId: string, courseId: string) {
    const { data, error } = await this.supabase
      .from('courses')
      .update({ status: 'draft', deleted_at: null })
      .eq('id', courseId)
      .eq('university_id', universityId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
