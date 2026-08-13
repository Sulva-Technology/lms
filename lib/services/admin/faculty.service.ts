import { SupabaseClient } from '@supabase/supabase-js';
import { FacultyPayload } from '@/types/admin';

export class FacultyService {
  constructor(private supabase: SupabaseClient<any>) {}

  async createFaculty(universityId: string, payload: FacultyPayload) {
    const { data, error } = await this.supabase
      .from('faculties')
      .insert({
        university_id: universityId,
        name: payload.name,
        code: payload.code
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateFaculty(universityId: string, facultyId: string, payload: Partial<FacultyPayload>) {
    const { data, error } = await this.supabase
      .from('faculties')
      .update({
        ...(payload.name && { name: payload.name }),
        ...(payload.code && { code: payload.code })
      })
      .eq('id', facultyId)
      .eq('university_id', universityId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async archiveFaculty(universityId: string, facultyId: string) {
    const { data, error } = await this.supabase
      .from('faculties')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', facultyId)
      .eq('university_id', universityId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async restoreFaculty(universityId: string, facultyId: string) {
    const { data, error } = await this.supabase
      .from('faculties')
      .update({ deleted_at: null })
      .eq('id', facultyId)
      .eq('university_id', universityId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
