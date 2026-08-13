import { SupabaseClient } from '@supabase/supabase-js';

export class LearningService {
  constructor(private supabase: SupabaseClient<any>) {}

  async getEnrolledCourses(studentId: string, semesterId?: string) {
    let query = this.supabase
      .from('course_enrollments')
      .select(`
        id, status,
        course_sections!inner (
          id, name,
          courses!inner ( id, title, code, description, thumbnail_url ),
          semesters!inner ( id, name )
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'active');
    
    if (semesterId) {
        query = query.eq('course_sections.semester_id', semesterId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getCourseContent(courseId: string, isStudent: boolean) {
    let query = this.supabase
      .from('course_modules')
      .select('*, lessons(*, lesson_materials(*), video_assets(*))')
      .is('deleted_at', null);
    query = query.eq('course_id', courseId).order('order_index', { ascending: true });
    
    const { data, error } = await query;
    if (error) throw error;

    // Filter unpublished content client side or within mapping
    if (isStudent && data) {
        data.forEach((m: any) => {
            m.lessons = (m.lessons || []).filter((l: any) => l.is_published && !l.deleted_at);
            m.lessons.sort((a: any, b: any) => a.order_index - b.order_index);
        });
    } else if (data) {
        data.forEach((m: any) => {
            m.lessons = (m.lessons || []).filter((l: any) => !l.deleted_at).sort((a: any, b: any) => a.order_index - b.order_index);
        });
    }

    return data;
  }

  async getSectionCourseForLecturer(sectionId: string, lecturerId: string) {
    const { data, error } = await this.supabase
      .from('course_lecturers')
      .select('course_sections!inner ( id, name, course_id, courses!inner ( id, code, title, description ) )')
      .eq('course_section_id', sectionId)
      .eq('lecturer_id', lecturerId)
      .single();

    if (error) throw error;
    const section = Array.isArray(data.course_sections) ? data.course_sections[0] : data.course_sections;
    if (!section) throw new Error('Course section not found.');
    return section;
  }

  private async requireCourseAccess(courseId: string, lecturerId: string) {
    const { data, error } = await this.supabase
      .from('course_lecturers')
      .select('id, course_sections!inner(course_id)')
      .eq('lecturer_id', lecturerId)
      .eq('course_sections.course_id', courseId)
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('You are not assigned to this course.');
  }

  private async requireModuleAccess(moduleId: string, lecturerId: string) {
    const { data, error } = await this.supabase.from('course_modules').select('course_id').eq('id', moduleId).single();
    if (error) throw error;
    await this.requireCourseAccess(data.course_id, lecturerId);
    return data.course_id;
  }

  private async requireLessonAccess(lessonId: string, lecturerId: string) {
    const { data, error } = await this.supabase.from('lessons').select('module_id, course_modules!inner(course_id)').eq('id', lessonId).single();
    if (error) throw error;
    const courseModule = Array.isArray(data.course_modules) ? data.course_modules[0] : data.course_modules;
    await this.requireCourseAccess(courseModule.course_id, lecturerId);
    return data;
  }

  async upsertModule(universityId: string, lecturerId: string, payload: { id?: string; courseId: string; title: string; description?: string; orderIndex: number }) {
    await this.requireCourseAccess(payload.courseId, lecturerId);
    const row = {
      university_id: universityId,
      course_id: payload.courseId,
      title: payload.title,
      description: payload.description || null,
      order_index: payload.orderIndex,
      deleted_at: null,
    };
    const query = payload.id
      ? this.supabase.from('course_modules').update(row).eq('id', payload.id)
      : this.supabase.from('course_modules').insert(row);
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  }

  async archiveModule(moduleId: string, lecturerId: string) {
    await this.requireModuleAccess(moduleId, lecturerId);
    const { data, error } = await this.supabase.from('course_modules').update({ deleted_at: new Date().toISOString() }).eq('id', moduleId).select().single();
    if (error) throw error;
    return data;
  }

  async upsertLesson(universityId: string, lecturerId: string, payload: { id?: string; moduleId: string; title: string; content?: string; resourceType: string; orderIndex: number; isPublished: boolean; videoAssetId?: string }) {
    await this.requireModuleAccess(payload.moduleId, lecturerId);
    const row = {
      university_id: universityId,
      module_id: payload.moduleId,
      title: payload.title,
      content: payload.content || null,
      resource_type: payload.resourceType,
      order_index: payload.orderIndex,
      is_published: payload.isPublished,
      video_asset_id: payload.videoAssetId || null,
      deleted_at: null,
    };
    const query = payload.id
      ? this.supabase.from('lessons').update(row).eq('id', payload.id)
      : this.supabase.from('lessons').insert(row);
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  }

  async archiveLesson(lessonId: string, lecturerId: string) {
    await this.requireLessonAccess(lessonId, lecturerId);
    const { data, error } = await this.supabase.from('lessons').update({ deleted_at: new Date().toISOString() }).eq('id', lessonId).select().single();
    if (error) throw error;
    return data;
  }

  async upsertLessonMaterial(universityId: string, lecturerId: string, payload: { id?: string; lessonId: string; title: string; materialType: string; url?: string; fileId?: string; videoAssetId?: string }) {
    await this.requireLessonAccess(payload.lessonId, lecturerId);
    const row = {
      university_id: universityId,
      lesson_id: payload.lessonId,
      title: payload.title,
      material_type: payload.materialType,
      url: payload.url || null,
      file_id: payload.fileId || null,
      video_asset_id: payload.videoAssetId || null,
      created_by: lecturerId,
      deleted_at: null,
    };
    const query = payload.id
      ? this.supabase.from('lesson_materials').update(row).eq('id', payload.id)
      : this.supabase.from('lesson_materials').insert(row);
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  }

  async archiveLessonMaterial(materialId: string, lecturerId: string) {
    const { data: material, error: fetchError } = await this.supabase.from('lesson_materials').select('lesson_id').eq('id', materialId).single();
    if (fetchError) throw fetchError;
    await this.requireLessonAccess(material.lesson_id, lecturerId);
    const { data, error } = await this.supabase.from('lesson_materials').update({ deleted_at: new Date().toISOString() }).eq('id', materialId).select().single();
    if (error) throw error;
    return data;
  }

  async saveProgress(universityId: string, studentId: string, lessonId: string, isCompleted: boolean) {
    const { error } = await this.supabase.from('lesson_progress').upsert({
        university_id: universityId,
        student_id: studentId,
        lesson_id: lessonId,
        is_completed: isCompleted,
        last_accessed: new Date().toISOString()
    }, { onConflict: 'lesson_id,student_id' });
    
    if (error) throw error;
    return true;
  }
}
