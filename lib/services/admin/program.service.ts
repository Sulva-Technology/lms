import { SupabaseClient } from '@supabase/supabase-js';
import { ProgramPayload } from '@/types/admin';

export class ProgramService {
  constructor(private supabase: SupabaseClient<any>) {}

  async createProgram(universityId: string, payload: ProgramPayload) {
    const { data, error } = await this.supabase
      .from('programs')
      .insert({
        university_id: universityId,
        department_id: payload.departmentId,
        name: payload.name,
        code: payload.code,
        description: payload.description || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateProgram(universityId: string, programId: string, payload: Partial<ProgramPayload>) {
    const { data, error } = await this.supabase
      .from('programs')
      .update({
        ...(payload.departmentId && { department_id: payload.departmentId }),
        ...(payload.name && { name: payload.name }),
        ...(payload.code && { code: payload.code }),
        ...(payload.description !== undefined && { description: payload.description || null }),
      })
      .eq('id', programId)
      .eq('university_id', universityId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async archiveProgram(universityId: string, programId: string) {
    const { data, error } = await this.supabase
      .from('programs')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', programId)
      .eq('university_id', universityId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async restoreProgram(universityId: string, programId: string) {
    const { data, error } = await this.supabase
      .from('programs')
      .update({ deleted_at: null })
      .eq('id', programId)
      .eq('university_id', universityId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
