import { SupabaseClient } from '@supabase/supabase-js';
import { DepartmentPayload } from '@/types/admin';

export class DepartmentService {
  constructor(private supabase: SupabaseClient<any>) {}

  async createDepartment(universityId: string, payload: DepartmentPayload) {
    const { data, error } = await this.supabase
      .from('departments')
      .insert({
        university_id: universityId,
        faculty_id: payload.facultyId,
        name: payload.name,
        code: payload.code,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateDepartment(universityId: string, departmentId: string, payload: Partial<DepartmentPayload>) {
    const { data, error } = await this.supabase
      .from('departments')
      .update({
        ...(payload.facultyId && { faculty_id: payload.facultyId }),
        ...(payload.name && { name: payload.name }),
        ...(payload.code && { code: payload.code }),
      })
      .eq('id', departmentId)
      .eq('university_id', universityId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async archiveDepartment(universityId: string, departmentId: string) {
    const { data, error } = await this.supabase
      .from('departments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', departmentId)
      .eq('university_id', universityId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async restoreDepartment(universityId: string, departmentId: string) {
    const { data, error } = await this.supabase
      .from('departments')
      .update({ deleted_at: null })
      .eq('id', departmentId)
      .eq('university_id', universityId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
